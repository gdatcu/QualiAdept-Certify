import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { STALE_PENDING_TIMEOUT_MS } from '@/lib/dynamic-runner';

/**
 * Authenticated polling endpoint for retrieving live status & results of a
 * submission (used by AssignmentWorkspace while a DYNAMIC GitHub Actions job
 * is in `PENDING` state).
 *
 * Includes automatic stale-job recovery so students are never stuck in PENDING
 * if a runner crashes before calling back.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        assignmentId: true,
        status: true,
        score: true,
        feedbackJSON: true,
        submittedAt: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const isTrainer = session.user.role === 'TRAINER';
    if (submission.userId !== session.user.id && !isTrainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let parsedFeedback: {
      status?: string;
      score?: number;
      stage?: string;
      locale?: string;
      primaryFileName?: string;
      feedback?: Array<{ check: string; passed: boolean; message: string; file?: string; ruleIndex?: number; diagnosticIndex?: number }>;
      executionLogs?: string;
      runUrl?: string;
    } = {};

    try {
      parsedFeedback = JSON.parse(submission.feedbackJSON || '{}');
    } catch {
      parsedFeedback = {};
    }

    // Stale PENDING auto-recovery guard (default 3 minutes)
    if (submission.status === 'PENDING') {
      const ageMs = Date.now() - new Date(submission.submittedAt).getTime();
      if (ageMs > STALE_PENDING_TIMEOUT_MS) {
        const isEn = parsedFeedback.locale === 'en';
        const stage1 = Array.isArray(parsedFeedback.feedback) ? parsedFeedback.feedback : [];
        const timeoutItem = {
          check: isEn
            ? '[Playwright E2E] Cloud Execution Timeout'
            : '[Playwright E2E] Timeout Execuție Cloud',
          passed: false,
          message: isEn
            ? 'The cloud Playwright runner did not report back within 3 minutes. Please submit again.'
            : 'Runner-ul Playwright din cloud nu a răspuns în 3 minute. Te rugăm să reîncerci trimiterea.',
          file: parsedFeedback.primaryFileName || 'task-tracker-e2e.spec.ts',
        };
        const updatedFeedback = [...stage1, timeoutItem];
        const updatedScore =
          updatedFeedback.length > 0
            ? Math.round((stage1.filter((c) => c.passed).length / updatedFeedback.length) * 100)
            : 0;
        const timedOutPayload = {
          status: 'fail' as const,
          score: updatedScore,
          stage: 'dynamic_completed' as const,
          feedback: updatedFeedback,
        };

        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: 'FAIL',
            score: updatedScore,
            feedbackJSON: JSON.stringify(timedOutPayload),
          },
        });

        return NextResponse.json(
          {
            submissionId: submission.id,
            status: 'fail',
            score: updatedScore,
            stage: 'dynamic_completed',
            feedback: updatedFeedback,
            submittedAt: submission.submittedAt,
          },
          { status: 200 }
        );
      }
    }

    const normalizedStatus = submission.status.toLowerCase() as 'pending' | 'pass' | 'fail';

    return NextResponse.json(
      {
        submissionId: submission.id,
        status: normalizedStatus,
        score: submission.score,
        stage:
          parsedFeedback.stage ||
          (normalizedStatus === 'pending' ? 'dynamic_queued' : 'dynamic_completed'),
        feedback: Array.isArray(parsedFeedback.feedback) ? parsedFeedback.feedback : [],
        executionLogs: parsedFeedback.executionLogs,
        runUrl: isTrainer ? parsedFeedback.runUrl : undefined,
        submittedAt: submission.submittedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/submissions/[id]:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
