import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDiscordTriumphNotification } from '@/lib/webhook';
import type { FeedbackItem } from '@/lib/static-evaluator';
import {
  buildDynamicFeedbackItems,
  getDynamicRunnerConfig,
  sanitizeExecutionLogs,
  verifyRunnerSignature,
  type RunnerTestOutcome,
} from '@/lib/dynamic-runner';

interface RunnerCallbackBody {
  submissionId: string;
  tests?: RunnerTestOutcome[];
  executionLogs?: string;
  runUrl?: string;
  runnerError?: string;
}

/**
 * HMAC-SHA256 authenticated callback invoked by Step C of the private GitHub
 * Actions Playwright runner after isolated test execution finishes.
 *
 * Merges Stage 1 (static hygiene checks) with Stage 2 (real Chromium E2E test
 * outcomes + sanitized execution logs), persists PASS/FAIL, and triggers
 * Discord triumph notifications on 100% pass.
 */
export async function POST(req: NextRequest) {
  try {
    const config = getDynamicRunnerConfig();
    const secret = config?.callbackSecret || process.env.EVAL_CALLBACK_SECRET?.trim() || '';

    if (!secret) {
      return NextResponse.json(
        { error: 'Dynamic runner callback secret is not configured.' },
        { status: 503 }
      );
    }

    const rawBody = await req.text();
    const timestamp = req.headers.get('x-eval-timestamp');
    const signature = req.headers.get('x-eval-signature');

    const verification = verifyRunnerSignature({
      message: rawBody,
      timestamp,
      signature,
      secret,
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: `Unauthorized: ${verification.reason || 'Invalid signature'}` },
        { status: 401 }
      );
    }

    let payload: RunnerCallbackBody;
    try {
      payload = JSON.parse(rawBody) as RunnerCallbackBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON callback body' }, { status: 400 });
    }

    if (!payload.submissionId || typeof payload.submissionId !== 'string') {
      return NextResponse.json({ error: 'Missing required field: submissionId' }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: payload.submissionId },
      include: {
        assignment: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Idempotency & override protection: never overwrite a completed or trainer-overridden submission
    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          reason: `Submission already finalized with status ${submission.status}`,
        },
        { status: 200 }
      );
    }

    // Recover Stage 1 static feedback & metadata stored when submission was queued
    let stage1Feedback: FeedbackItem[] = [];
    let locale = 'ro';
    let primaryFileName = 'task-tracker-e2e.spec.ts';

    try {
      const existing = JSON.parse(submission.feedbackJSON || '{}');
      if (Array.isArray(existing.feedback)) {
        stage1Feedback = existing.feedback;
      }
      if (typeof existing.locale === 'string') {
        locale = existing.locale;
      }
      if (typeof existing.primaryFileName === 'string') {
        primaryFileName = existing.primaryFileName;
      }
    } catch {
      // Ignore malformed prior JSON
    }

    const stage2Feedback = buildDynamicFeedbackItems(payload.tests || [], {
      fileName: primaryFileName,
      locale,
      runnerError: payload.runnerError,
    });

    const combinedFeedback: FeedbackItem[] = [...stage1Feedback, ...stage2Feedback];
    const passedCount = combinedFeedback.filter((c) => c.passed).length;
    const totalCount = combinedFeedback.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    // Require BOTH Stage 1 AND Stage 2 tests (at least 1 executed test) to pass 100%
    const hasExecutedTests = Array.isArray(payload.tests) && payload.tests.length > 0;
    const isPass = score === 100 && hasExecutedTests;
    const status: 'pass' | 'fail' = isPass ? 'pass' : 'fail';
    const dbStatus = isPass ? 'PASS' : 'FAIL';

    const sanitizedLogs = sanitizeExecutionLogs(payload.executionLogs);
    const safeRunUrl =
      typeof payload.runUrl === 'string' && payload.runUrl.startsWith('https://github.com/')
        ? payload.runUrl
        : undefined;

    const finalFeedbackPayload = {
      status,
      score,
      stage: 'dynamic_completed' as const,
      feedback: combinedFeedback,
      executionLogs: sanitizedLogs || undefined,
      runUrl: safeRunUrl,
    };

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: dbStatus,
        score,
        feedbackJSON: JSON.stringify(finalFeedbackPayload),
      },
    });

    if (isPass) {
      const studentName = submission.user?.name || 'QA Student';
      try {
        await Promise.allSettled([
          sendDiscordTriumphNotification({
            studentName,
            userId: submission.userId,
            moduleNum: submission.assignment.module,
            assignmentTitle: submission.assignment.title,
            validationType: 'DYNAMIC',
          }),
        ]);
      } catch (err) {
        console.error('Post-callback Discord dispatch error:', err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        submissionId: submission.id,
        status,
        score,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in dynamic callback route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
