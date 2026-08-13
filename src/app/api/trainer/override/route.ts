import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const { submissionId } = body;

    if (!submissionId || typeof submissionId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid submissionId' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Prepare updated feedback JSON with override metadata
    let updatedFeedbackObj;
    try {
      updatedFeedbackObj = JSON.parse(existingSubmission.feedbackJSON);
    } catch {
      updatedFeedbackObj = { status: 'fail', score: existingSubmission.score, feedback: [] };
    }

    // Append manual override check item & update top-level status
    const overrideCheck = {
      check: 'Trainer Manual Override',
      passed: true,
      message: 'Status and score manually overridden to 100% PASS by Trainer (God Mode).',
    };

    const feedbackItems = Array.isArray(updatedFeedbackObj.feedback)
      ? [...updatedFeedbackObj.feedback, overrideCheck]
      : [overrideCheck];

    const updatedFeedbackJSON = JSON.stringify({
      ...updatedFeedbackObj,
      status: 'pass',
      score: 100,
      manualOverride: true,
      overriddenAt: new Date().toISOString(),
      feedback: feedbackItems,
    });

    // Update in database
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'PASS',
        score: 100,
        feedbackJSON: updatedFeedbackJSON,
      },
      include: {
        user: true,
        assignment: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Submission status manually overridden to PASS',
        submission: updatedSubmission,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in trainer override API route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
