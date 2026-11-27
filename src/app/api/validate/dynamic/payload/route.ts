import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSubmissionFiles } from '@/lib/static-evaluator';
import {
  getDynamicRunnerConfig,
  resolvePrimarySpecFileName,
  verifyRunnerSignature,
} from '@/lib/dynamic-runner';

/**
 * HMAC-authenticated payload fetch endpoint used exclusively by Step A (trusted
 * setup step) of the private GitHub Actions Playwright runner.
 *
 * Security guarantees:
 * - Requires valid `X-Eval-Timestamp` + `X-Eval-Signature` over `GET:${submissionId}`
 * - Only serves submissions currently in `PENDING` status (blocks historical scraping)
 */
export async function GET(req: NextRequest) {
  try {
    const config = getDynamicRunnerConfig();
    const secret = config?.callbackSecret || process.env.EVAL_CALLBACK_SECRET?.trim() || '';

    if (!secret) {
      return NextResponse.json(
        { error: 'Dynamic runner callback secret is not configured.' },
        { status: 503 }
      );
    }

    const submissionId = req.nextUrl.searchParams.get('submissionId')?.trim() || '';
    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId query parameter.' }, { status: 400 });
    }

    const timestamp = req.headers.get('x-eval-timestamp');
    const signature = req.headers.get('x-eval-signature');

    const verification = verifyRunnerSignature({
      message: `GET:${submissionId}`,
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

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            module: true,
            title: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission is no longer pending evaluation.' },
        { status: 409 }
      );
    }

    const parsed = parseSubmissionFiles({ codePayload: submission.codePayload });
    const fileName = resolvePrimarySpecFileName(submission.assignment.module, parsed.files);
    const code = parsed.files[fileName] || Object.values(parsed.files)[0] || submission.codePayload;

    return NextResponse.json(
      {
        submissionId: submission.id,
        module: submission.assignment.module,
        fileName,
        code,
        files: parsed.files,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in dynamic payload route:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
