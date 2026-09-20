import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { sendDiscordTriumphNotification } from '@/lib/webhook';
import { syncModuleCodeToGitHub } from '@/lib/github-sync';

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
            let passed = false;
            const checkType = r.check || r.type || 'exists';
            const selector = r.selector || r.tag || r.value;
            let checkName = r.name || r.title || '';
            let msg = '';

            if (checkType === 'regex' || r.type === 'regex') {
              const pattern = r.pattern || r.value || '';
              const regex = new RegExp(pattern, 'i');
              passed = regex.test(htmlCode);
              checkName = checkName || r.check || `Pattern check (${pattern})`;
              msg = passed
                ? `Matched required pattern: ${pattern}`
                : (r.message || `Code does not match required pattern: ${pattern}`);
            } else if (checkType === 'hasClass') {
              const expectedClass = r.expected || r.value;
              const matches = $(selector);
              passed =
                matches.length > 0 &&
                matches.toArray().some((el) => {
                  const classAttr = (el as any).attribs?.class || '';
                  return classAttr.split(/\s+/).includes(expectedClass);
                });
              checkName = checkName || `Element "${selector}" has class "${expectedClass}"`;
              msg = passed
                ? `Element "${selector}" contains class "${expectedClass}".`
                : (r.message || `Element "${selector}" is missing required class "${expectedClass}".`);
            } else if (checkType === 'hasAttribute') {
              const attrName = (r.attrName || r.attr || r.value || '').toLowerCase();
              const matches = $(selector);
              passed =
                matches.length > 0 &&
                matches.toArray().some((el) => {
                  const attribs = (el as any).attribs || {};
                  return Object.keys(attribs).some((k) => k.toLowerCase() === attrName);
                });
              checkName = checkName || `Element "${selector}" has attribute "${attrName}"`;
              msg = passed
                ? `Element "${selector}" has attribute "${attrName}".`
                : (r.message || `Element "${selector}" is missing attribute "${attrName}".`);
            } else if (checkType === 'attribute') {
              const attrName = (r.attrName || r.attr || '').toLowerCase();
              const expected = (r.expected || r.value || '').trim();
              const matches = $(selector);
              passed =
                matches.length > 0 &&
                matches.toArray().some((el) => {
                  const attribs = (el as any).attribs || {};
                  const matchedKey = Object.keys(attribs).find((k) => k.toLowerCase() === attrName);
                  const val = matchedKey ? attribs[matchedKey] : undefined;
                  return val !== undefined && val.trim() === expected;
                });
              checkName = checkName || `Element "${selector}" [${attrName}="${expected}"]`;
              msg = passed
                ? `Element "${selector}" has attribute ${attrName}="${expected}".`
                : (r.message || `Element "${selector}" attribute "${attrName}" expected "${expected}".`);
            } else if (checkType === 'attributeRegex') {
              const attrName = (r.attrName || r.attr || '').toLowerCase();
              const pattern = r.pattern || r.expected || r.value;
              const regex = new RegExp(pattern, 'i');
              const matches = $(selector);
              passed =
                matches.length > 0 &&
                matches.toArray().some((el) => {
                  const attribs = (el as any).attribs || {};
                  const matchedKey = Object.keys(attribs).find((k) => k.toLowerCase() === attrName);
                  const val = matchedKey ? attribs[matchedKey] : undefined;
                  return val !== undefined && regex.test(val.trim());
                });
              checkName = checkName || `Element "${selector}" [${attrName} matches /${pattern}/]`;
              msg = passed
                ? `Element "${selector}" attribute "${attrName}" matches expected pattern.`
                : (r.message || `Element "${selector}" attribute "${attrName}" did not match pattern /${pattern}/.`);
            } else if (checkType === 'textContains') {
              const expectedText = (r.expected || r.value || '').trim().toLowerCase();
              const matches = $(selector);
              passed = matches.length > 0 && matches.text().toLowerCase().includes(expectedText);
              checkName = checkName || `Element "${selector}" contains text "${expectedText}"`;
              msg = passed
                ? `Element "${selector}" contains expected text.`
                : (r.message || `Element "${selector}" does not contain "${expectedText}".`);
            } else if (r.type === 'tag') {
              const tagSelector = r.value || r.selector || r.tag;
              passed = $(tagSelector).length > 0;
              checkName = checkName || `<${tagSelector}> tag exists`;
              msg = passed
                ? `Tag <${tagSelector}> is present.`
                : (r.message || `Missing required <${tagSelector}> tag.`);
            } else if (r.type === 'attr') {
              const rawAttr = r.value || r.selector;
              const attrSelector =
                rawAttr.startsWith('[') || rawAttr.startsWith('#') || rawAttr.startsWith('.')
                  ? rawAttr
                  : `[${rawAttr}]`;
              passed = $(attrSelector).length > 0;
              checkName = checkName || `Selector "${rawAttr}" exists`;
              msg = passed
                ? `Found element matching "${rawAttr}".`
                : (r.message || `Missing required attribute or selector "${rawAttr}".`);
            } else {
              // checkType === 'exists' or default selector check
              const targetSelector = selector || r.check;
              if (targetSelector) {
                passed = $(targetSelector).length > 0;
                checkName = checkName || (r.check && r.check !== 'exists' ? r.check : `Element "${targetSelector}" exists`);
                msg = passed
                  ? `Found element matching "${targetSelector}".`
                  : (r.message || `Missing element matching "${targetSelector}".`);
              }
            }

            if (checkName) {
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

    // Build standardized feedback object
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

    // Save submission to database using Prisma
    await prisma.submission.create({
      data: {
        userId,
        assignmentId,
        codePayload: htmlCode,
        status: dbStatus,
        score,
        feedbackJSON: JSON.stringify(responsePayload),
      },
    });

    // Fire non-blocking Discord Triumph Webhook notification & GitHub Auto-Sync if score === 100
    if (isPass && score === 100) {
      const studentName = session?.user?.name || existingUser?.name || 'QA Student';
      try {
        await Promise.allSettled([
          sendDiscordTriumphNotification({
            studentName,
            userId,
            moduleNum: targetAssignment?.module || 1,
            assignmentTitle: targetAssignment?.title,
            validationType: 'STATIC',
          }),
          syncModuleCodeToGitHub({
            userId,
            moduleNum: targetAssignment?.module || 1,
            assignmentTitle: targetAssignment?.title,
            codePayload: htmlCode,
            validationType: 'STATIC',
          }),
        ]);
      } catch (err) {
        console.error('Post-validation async dispatch error:', err);
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
