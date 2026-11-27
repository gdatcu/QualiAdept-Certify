import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { sendDiscordTriumphNotification } from '@/lib/webhook';
import {
  evaluateStaticRules,
  parseSubmissionFiles,
  stripCodeComments,
  type FeedbackItem,
  type ValidationResponse,
} from '@/lib/static-evaluator';
import {
  checkUnsafeRunnerPatterns,
  dispatchGitHubActionsEval,
  getDynamicRunnerConfig,
  resolvePrimarySpecFileName,
} from '@/lib/dynamic-runner';

export type { FeedbackItem, ValidationResponse };

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { codePayload, assignmentId } = body;
    const locale = (
      body.locale ||
      req.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ||
      'ro'
    ).toLowerCase();
    const isEn = locale === 'en';

    // 1. ReDoS & Payload Protection
    if (typeof codePayload === 'string' && codePayload.length > 10000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }

    const parsedFiles = parseSubmissionFiles(body);
    if (parsedFiles.rawPayload.length > 12000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }

    // Retrieve authenticated user session
    const session = await getAuthSession();

    // Determine userId from session (or fallback to body.userId for legacy API testing)
    let candidateUserId = session?.user?.id;
    if (!candidateUserId && body.userId && typeof body.userId === 'string') {
      candidateUserId = body.userId;
    }

    if (!candidateUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in with GitHub to submit code.' },
        { status: 401 }
      );
    }

    const userId: string = candidateUserId;

    // Enrollment Check: Verify user is enrolled or has TRAINER role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isEnrolled: true, role: true, name: true },
    });

    if (!dbUser || (!dbUser.isEnrolled && dbUser.role !== 'TRAINER')) {
      return NextResponse.json(
        { error: 'Forbidden: Enrollment required to submit assignments.' },
        { status: 403 }
      );
    }

    if (!assignmentId || typeof assignmentId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: assignmentId' },
        { status: 400 }
      );
    }

    // Fetch assignment details from database
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // 2. API Bypass Protection (Progressive Unlocking Enforcement for students)
    if (dbUser.role !== 'TRAINER') {
      const userPassedSubmissions = await prisma.submission.findMany({
        where: {
          userId,
          status: 'PASS',
        },
        include: {
          assignment: true,
        },
      });

      const highestPassedModule = userPassedSubmissions.reduce(
        (max, sub) => Math.max(max, sub.assignment.module),
        0
      );

      if (assignment.module > highestPassedModule + 1) {
        return NextResponse.json(
          {
            error:
              'Forbidden: You must complete prior modules before attempting this assignment.',
          },
          { status: 403 }
        );
      }
    }

    // Time-based rate limit lock: Ensure 3 seconds between submissions for same user and assignment
    const recentSubmission = await prisma.submission.findFirst({
      where: { userId, assignmentId },
      orderBy: { submittedAt: 'desc' },
    });

    if (recentSubmission) {
      const timeDiffMs = Date.now() - new Date(recentSubmission.submittedAt).getTime();
      if (timeDiffMs < 3000) {
        return NextResponse.json(
          { error: 'Please wait a few seconds before submitting again.' },
          { status: 429 }
        );
      }
    }

    // Global 1-minute window rate limit (max 10 evaluations per minute across all assignments)
    const recentSubmissionsCount = await prisma.submission.count({
      where: {
        userId,
        submittedAt: {
          gte: new Date(Date.now() - 60000),
        },
      },
    });

    if (recentSubmissionsCount >= 10) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Maximum 10 evaluations per minute to prevent server overload.',
        },
        { status: 429 }
      );
    }

    const targetFileFilter =
      typeof body.targetFile === 'string' && body.targetFile.trim().length > 0
        ? body.targetFile.trim()
        : null;

    const primaryFileName = resolvePrimarySpecFileName(assignment.module, parsedFiles.files);
    const primaryCode =
      parsedFiles.files[primaryFileName] ||
      Object.values(parsedFiles.files)[0] ||
      (typeof codePayload === 'string' ? codePayload.trim() : '');

    // ------------------------------------------------------------------
    // STAGE 1: Static Hygiene Gate (runs synchronously on Vercel in ~50ms)
    // ------------------------------------------------------------------
    let checks: FeedbackItem[] = [];

    if (assignment.validationRules) {
      const stage1 = evaluateStaticRules({
        validationRulesJson: assignment.validationRules,
        parsedFiles,
        locale,
        targetFileFilter,
      });
      checks = stage1.checks;
    } else {
      // Fallback Playwright syntax suite if no custom rules are defined on the assignment
      const cleanCode = stripCodeComments(primaryCode, primaryFileName);

      const hasGoto = /page\.goto\(/i.test(cleanCode);
      checks.push({
        check: 'Navigates to Target URL',
        passed: hasGoto,
        message: hasGoto
          ? 'Playwright Syntax Validated'
          : 'Missing page.goto() navigation command.',
        file: primaryFileName,
      });

      const hasLocator = /(page\.locator\(|page\.\$|page\.click\(|page\.fill\(|getByTestId\(|getByRole\()/i.test(
        cleanCode
      );
      checks.push({
        check: 'Uses Playwright Locators & Interaction',
        passed: hasLocator,
        message: hasLocator
          ? 'Playwright Syntax Validated'
          : 'Missing page.locator() element locator command.',
        file: primaryFileName,
      });

      const hasExpect = /(expect\(|assert|should)/i.test(cleanCode);
      checks.push({
        check: 'Executes Test Assertions',
        passed: hasExpect,
        message: hasExpect
          ? 'Playwright Syntax Validated'
          : 'Missing expect() test assertion statement.',
        file: primaryFileName,
      });
    }

    // Zero-Trust Security Gate: block Node OS/FS/process escape attempts before runner execution
    const unsafePatterns = checkUnsafeRunnerPatterns(primaryCode);
    if (unsafePatterns.length > 0) {
      checks.push({
        check: isEn
          ? '[Security Sandbox] Restricted Node APIs prohibited'
          : '[Securitate Sandbox] API-uri Node restricționate interzise',
        passed: false,
        message: isEn
          ? `Prohibited APIs detected (${unsafePatterns.join(', ')}). Remove them before running on the cloud evaluator.`
          : `API-uri interzise detectate (${unsafePatterns.join(', ')}). Elimină-le înainte de execuția în cloud.`,
        file: primaryFileName,
      });
    }

    const passedCount = checks.filter((c) => c.passed).length;
    const totalChecks = checks.length;
    const stage1Score = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;
    const stage1Passed = stage1Score === 100;

    // Partial per-file checks only run Stage 1 and never persist or trigger GitHub Actions
    if (targetFileFilter) {
      const partialPayload: ValidationResponse = {
        status: stage1Passed ? 'pass' : 'fail',
        score: stage1Score,
        feedback: checks,
        isPartial: true,
        targetFile: targetFileFilter,
        stage: 'static',
      };
      return NextResponse.json(partialPayload, { status: 200 });
    }

    // Ensure User exists in DB to satisfy foreign key constraints
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: session?.user?.email || `${userId}@qualiadept.eu`,
          name: session?.user?.name || `Student ${userId}`,
          image: session?.user?.image || null,
          role: 'STUDENT',
        },
      });
    }

    const storedPayload = parsedFiles.rawPayload || (typeof codePayload === 'string' ? codePayload : '');

    // If Stage 1 FAILS, persist FAIL immediately (saves GitHub Actions minutes!)
    if (!stage1Passed) {
      const failResponse: ValidationResponse = {
        status: 'fail',
        score: stage1Score,
        feedback: checks,
        stage: 'static',
      };

      const created = await prisma.submission.create({
        data: {
          userId,
          assignmentId,
          codePayload: storedPayload,
          status: 'FAIL',
          score: stage1Score,
          feedbackJSON: JSON.stringify(failResponse),
        },
      });

      return NextResponse.json(
        {
          ...failResponse,
          submissionId: created?.id,
        },
        { status: 200 }
      );
    }

    // ------------------------------------------------------------------
    // STAGE 2: Dispatch to isolated GitHub Actions Playwright Runner
    // ------------------------------------------------------------------
    const runnerConfig = getDynamicRunnerConfig();

    if (runnerConfig) {
      const pendingPayload: ValidationResponse = {
        status: 'pending',
        score: 0,
        feedback: checks,
        stage: 'dynamic_queued',
      };

      const createdSubmission = await prisma.submission.create({
        data: {
          userId,
          assignmentId,
          codePayload: storedPayload,
          status: 'PENDING',
          score: 0,
          feedbackJSON: JSON.stringify({
            ...pendingPayload,
            locale,
            primaryFileName,
          }),
        },
      });

      const dispatchRes = await dispatchGitHubActionsEval({
        config: runnerConfig,
        submissionId: createdSubmission.id,
        moduleNum: assignment.module,
        fileName: primaryFileName,
      });

      if (!dispatchRes.dispatched) {
        const dispatchFailFeedback: FeedbackItem[] = [
          ...checks,
          {
            check: isEn
              ? '[Playwright E2E] Cloud Runner Dispatch'
              : '[Playwright E2E] Lansare Runner Cloud',
            passed: false,
            message: isEn
              ? 'Could not start the cloud Playwright evaluator. Please retry in a few seconds.'
              : 'Nu s-a putut porni evaluatorul Playwright în cloud. Te rugăm să reîncerci în câteva secunde.',
            file: primaryFileName,
          },
        ];
        const dispatchFailPayload: ValidationResponse = {
          status: 'fail',
          score: Math.round((checks.length / dispatchFailFeedback.length) * 100),
          feedback: dispatchFailFeedback,
          stage: 'dynamic_completed',
          submissionId: createdSubmission.id,
          executionLogs: dispatchRes.error,
        };

        await prisma.submission.update({
          where: { id: createdSubmission.id },
          data: {
            status: 'FAIL',
            score: dispatchFailPayload.score,
            feedbackJSON: JSON.stringify(dispatchFailPayload),
          },
        });

        return NextResponse.json(
          {
            error: isEn
              ? 'Cloud Playwright runner dispatch failed. Please retry.'
              : 'Lansarea runner-ului Playwright în cloud a eșuat. Te rugăm să reîncerci.',
            details: dispatchRes.error,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          ...pendingPayload,
          submissionId: createdSubmission.id,
        },
        { status: 202 }
      );
    }

    // Graceful fallback when GitHub Actions runner env vars are not configured (local dev / unit tests)
    const staticPassResponse: ValidationResponse = {
      status: 'pass',
      score: 100,
      feedback: checks,
      stage: 'static',
    };

    const created = await prisma.submission.create({
      data: {
        userId,
        assignmentId,
        codePayload: storedPayload,
        status: 'PASS',
        score: 100,
        feedbackJSON: JSON.stringify(staticPassResponse),
      },
    });

    const studentName = session?.user?.name || existingUser?.name || 'QA Student';
    try {
      await Promise.allSettled([
        sendDiscordTriumphNotification({
          studentName,
          userId,
          moduleNum: assignment.module,
          assignmentTitle: assignment.title,
          validationType: 'DYNAMIC',
        }),
      ]);
    } catch (err) {
      console.error('Post-validation async dispatch error in dynamic route:', err);
    }

    return NextResponse.json(
      {
        ...staticPassResponse,
        submissionId: created?.id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in dynamic validation API route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
