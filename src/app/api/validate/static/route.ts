import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { sendDiscordTriumphNotification } from '@/lib/webhook';
import { generateAiCodeReview } from '@/lib/ai-reviewer';

export interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
}

export interface ValidationResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
  aiFeedback?: string;
  codeQuality?: 'Excellent' | 'Good' | 'Needs Improvement';
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

    const { htmlCode } = body;

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

    // Determine assignmentId
    let assignmentId = body.assignmentId;
    if (!assignmentId || typeof assignmentId !== 'string') {
      let activeAssignment = await prisma.assignment.findFirst({
        where: { validationType: 'STATIC', isActive: true },
      });

      if (!activeAssignment) {
        activeAssignment = await prisma.assignment.create({
          data: {
            title: 'Session 1: Task Tracker HTML',
            description: 'Build a semantic HTML layout for a Task Tracker application.',
            module: 1,
            validationType: 'STATIC',
            isActive: true,
          },
        });
      }
      assignmentId = activeAssignment.id;
    }

    if (htmlCode === undefined || htmlCode === null || typeof htmlCode !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: htmlCode' },
        { status: 400 }
      );
    }

    // 1. Time-based rate limit lock: Ensure 3 seconds between submissions for same user and assignment
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

    // 2. Global 1-minute window rate limit (max 10 evaluations per minute across all assignments)
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

    // Parse HTML with cheerio
    const $ = cheerio.load(htmlCode);

    // Fetch target assignment details
    const targetAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    // Perform static validation checks
    const checks: FeedbackItem[] = [];

    // Evaluate dynamic rules if set by trainer
    if (targetAssignment?.validationRules) {
      try {
        const rules = JSON.parse(targetAssignment.validationRules);
        if (Array.isArray(rules)) {
          for (const r of rules) {
            const selector = r.selector || r.tag || r.check;
            if (selector) {
              const passed = $(selector).length > 0;
              const checkName = r.check || `Element "${selector}" exists`;
              const msg = r.message || (passed ? `Found element matching "${selector}".` : `Missing element matching "${selector}".`);
              checks.push({
                check: checkName,
                passed,
                message: msg,
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse assignment validationRules JSON:', e);
      }
    }

    // Fallback to default Session 1 checks if no dynamic rules were provided
    if (checks.length === 0) {
      // Check a: Existence of <main> tag
      const hasMainTag = $('main').length > 0;
      checks.push({
        check: 'Main tag exists',
        passed: hasMainTag,
        message: hasMainTag
          ? 'Semantic <main> tag is present.'
          : 'Missing <main> tag. Expected a semantic <main> element.',
      });

      // Check b: Existence of element with id="add-task-section"
      const hasAddTaskSection = $('#add-task-section').length > 0;
      checks.push({
        check: 'Add task section exists',
        passed: hasAddTaskSection,
        message: hasAddTaskSection
          ? 'Element with id="add-task-section" is present.'
          : 'Missing element with id="add-task-section".',
      });

      // Check c: Existence of a button with data-testid="submit-btn"
      const hasSubmitBtn = $('button[data-testid="submit-btn"]').length > 0;
      checks.push({
        check: 'Submit button exists',
        passed: hasSubmitBtn,
        message: hasSubmitBtn
          ? 'Button with data-testid="submit-btn" is present.'
          : 'Missing button element with data-testid="submit-btn".',
      });
    }

    // Calculate score
    const passedCount = checks.filter((c) => c.passed).length;
    const totalChecks = checks.length;
    const score = Math.round((passedCount / totalChecks) * 100);
    const isPass = score === 100;
    const status = isPass ? 'pass' : 'fail';
    const dbStatus = isPass ? 'PASS' : 'FAIL';

    // Call Virtual Mentor AI Code Reviewer (non-blocking defensive execution)
    const aiReview = await generateAiCodeReview(htmlCode || '');

    // Build standardized feedback object
    const responsePayload: ValidationResponse = {
      status,
      score,
      feedback: checks,
      aiFeedback: aiReview.aiFeedback,
      codeQuality: aiReview.codeQuality,
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

    // Save submission to database using Prisma
    await prisma.submission.create({
      data: {
        userId,
        assignmentId,
        codePayload: htmlCode,
        status: dbStatus,
        score,
        feedbackJSON: JSON.stringify(responsePayload),
        aiFeedback: aiReview.aiFeedback,
        codeQuality: aiReview.codeQuality,
      },
    });

    // Fire non-blocking Discord Triumph Webhook notification if score === 100
    if (isPass && score === 100) {
      const studentName = session?.user?.name || existingUser?.name || 'QA Student';
      try {
        await sendDiscordTriumphNotification({
          studentName,
          userId,
          moduleNum: targetAssignment?.module || 1,
          assignmentTitle: targetAssignment?.title,
          validationType: 'STATIC',
        });
      } catch (err) {
        console.error('Discord webhook notification error:', err);
      }
    }

    // Return standardized JSON response
    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in static validation API route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
