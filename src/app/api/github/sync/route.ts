import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncModuleCodeToGitHub } from '@/lib/github-sync';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Autentificare necesară: Te rugăm să te autentifici cu GitHub.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { assignmentId, codePayload: directCode, targetFile } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'ID-ul temei este obligatoriu.' },
        { status: 400 }
      );
    }

    // Fetch target assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Tema specificată nu a fost găsită.' },
        { status: 404 }
      );
    }

    let codeToSync = directCode;

    // If no code is explicitly passed in request body, retrieve user's latest passing submission
    if (!codeToSync || typeof codeToSync !== 'string' || !codeToSync.trim()) {
      const bestSubmission = await prisma.submission.findFirst({
        where: {
          userId,
          assignmentId,
          status: 'PASS',
        },
        orderBy: { submittedAt: 'desc' },
      });

      if (!bestSubmission || !bestSubmission.codePayload) {
        return NextResponse.json(
          { error: 'Nu există o rezolvare validată pentru această temă pentru a fi sincronizată.' },
          { status: 400 }
        );
      }

      codeToSync = bestSubmission.codePayload;
    }

    // Perform synchronization to GitHub
    const syncResult = await syncModuleCodeToGitHub({
      userId,
      moduleNum: assignment.module,
      assignmentTitle: assignment.title,
      codePayload: codeToSync,
      validationType: assignment.validationType,
      targetFile: typeof targetFile === 'string' && targetFile.trim().length > 0 ? targetFile.trim() : undefined,
    });

    if (!syncResult.success) {
      return NextResponse.json(
        {
          error: syncResult.message || 'Eroare la sincronizarea pe GitHub.',
          code: syncResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        repoUrl: syncResult.repoUrl,
        commitUrl: syncResult.commitUrl,
        filePath: syncResult.filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API /api/github/sync error:', error);
    return NextResponse.json(
      { error: 'Eroare internă de server la sincronizarea GitHub.' },
      { status: 500 }
    );
  }
}
