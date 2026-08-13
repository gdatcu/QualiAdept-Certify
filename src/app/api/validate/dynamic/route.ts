import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { sendDiscordTriumphNotification } from '@/lib/webhook';

export interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
}

export interface ValidationResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { codePayload, assignmentId } = body;

    // 1. ReDoS & Payload Protection
    if (typeof codePayload === 'string' && codePayload.length > 10000) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 400 }
      );
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
      select: { isEnrolled: true, role: true },
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
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // 2. API Bypass Protection (Progressive Unlocking Enforcement)
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
        { error: 'Forbidden: You must complete prior modules before attempting this assignment.' },
        { status: 403 }
      );
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
        { error: 'Rate limit exceeded. Maximum 10 evaluations per minute to prevent server overload.' },
        { status: 429 }
      );
    }

    const code = typeof codePayload === 'string' ? codePayload.trim() : '';

    // 3. Anti-Cheat: Strip single-line (//...) and multi-line (/*...*/) comments
    const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

    const checks: FeedbackItem[] = [];

    // Evaluate dynamic Playwright regex rules on cleanCode
    if (assignment.validationRules) {
      try {
        const rules = JSON.parse(assignment.validationRules);
        if (Array.isArray(rules)) {
          for (const r of rules) {
            const regexPattern = r.regex || r.pattern;

            if (regexPattern) {
              const regex = new RegExp(regexPattern, 'i');
              const passed = cleanCode.length > 0 && regex.test(cleanCode);
              
              // Set check card title to user-friendly message (e.g. "Navigates to URL")
              const checkTitle = r.message || r.check || r.name || 'Playwright Syntax Assertion';
              
              // Set details subtitle to clean string without raw regex
              const details = r.details || (passed ? 'Playwright Syntax Validated' : 'Required Playwright statement missing');

              checks.push({
                check: checkTitle,
                passed,
                message: details,
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse assignment validationRules JSON in dynamic route:', e);
      }
    }

    // Fallback Playwright assertion suite if no custom rules are defined (evaluated on cleanCode)
    if (checks.length === 0) {
      // Check 1: Navigation syntax (page.goto)
      const hasGoto = /page\.goto\(/i.test(cleanCode);
      checks.push({
        check: 'Navigates to Target URL',
        passed: hasGoto,
        message: hasGoto
          ? 'Playwright Syntax Validated'
          : 'Missing page.goto() navigation command.',
      });

      // Check 2: Element Locator syntax (page.locator, page.$, page.click, page.fill)
      const hasLocator = /(page\.locator\(|page\.\$|page\.click\(|page\.fill\()/i.test(cleanCode);
      checks.push({
        check: 'Uses Playwright Locators & Interaction',
        passed: hasLocator,
        message: hasLocator
          ? 'Playwright Syntax Validated'
          : 'Missing page.locator() element locator command.',
      });

      // Check 3: Assertion syntax (expect)
      const hasExpect = /(expect\(|assert|should)/i.test(cleanCode);
      checks.push({
        check: 'Executes Test Assertions',
        passed: hasExpect,
        message: hasExpect
          ? 'Playwright Syntax Validated'
          : 'Missing expect() test assertion statement.',
      });
    }

    // Calculate score
    const passedCount = checks.filter((c) => c.passed).length;
    const totalChecks = checks.length;
    const score = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;
    const isPass = score === 100;
    const status = isPass ? 'pass' : 'fail';
    const dbStatus = isPass ? 'PASS' : 'FAIL';

    // Build response payload matching Green Wall format
    const responsePayload: ValidationResponse = {
      status,
      score,
      feedback: checks,
    };

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

    // Save submission record in PostgreSQL database
    await prisma.submission.create({
      data: {
        userId,
        assignmentId,
        codePayload: codePayload || '',
        status: dbStatus,
        score,
        feedbackJSON: JSON.stringify(responsePayload),
      },
    });

    // Fire non-blocking Discord Triumph Webhook notification if score === 100
    if (isPass && score === 100) {
      const studentName = session?.user?.name || existingUser?.name || 'QA Student';
      sendDiscordTriumphNotification({
        studentName,
        userId,
        moduleNum: assignment.module,
        assignmentTitle: assignment.title,
        validationType: 'DYNAMIC',
      }).catch(() => {});
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in dynamic validation API route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
