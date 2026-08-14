import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import AssignmentWorkspace from './AssignmentWorkspace';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssignmentPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = session.user.id;

  // Batch target assignment and user details with submissions into a single Promise.all batch
  const [assignment, currentUser] = await Promise.all([
    prisma.assignment.findUnique({
      where: { id },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        isEnrolled: true,
        role: true,
        submissions: {
          orderBy: {
            submittedAt: 'desc',
          },
          select: {
            id: true,
            assignmentId: true,
            codePayload: true,
            status: true,
            score: true,
            feedbackJSON: true,
            aiFeedback: true,
            codeQuality: true,
            submittedAt: true,
            assignment: {
              select: {
                module: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!assignment) {
    notFound();
  }

  // Enrollment Guard: Enforce redirection to /enroll if user is not enrolled and not a trainer
  if (!currentUser || (!currentUser.isEnrolled && currentUser.role !== 'TRAINER')) {
    redirect('/enroll');
  }

  // Server-side Drip Content Guard (Publish status + unlockDate check)
  if (currentUser.role !== 'TRAINER') {
    if (assignment.isPublished === false) {
      redirect('/');
    }
    if (assignment.unlockDate && new Date() < new Date(assignment.unlockDate)) {
      redirect('/');
    }
  }

  // Server-side guard: If assignment's module > 1, verify user has a "PASS" submission for module - 1
  if (assignment.module > 1) {
    const hasPassedPrevModule = currentUser.submissions.some(
      (s) => s.status === 'PASS' && s.assignment?.module === assignment.module - 1
    );

    if (!hasPassedPrevModule) {
      redirect('/');
    }
  }

  // Extract initial submissions for current assignment in memory from userRecord
  const initialSubmissions = currentUser.submissions
    .filter((s) => s.assignmentId === assignment.id)
    .map((s) => ({
      id: s.id,
      codePayload: s.codePayload,
      status: s.status,
      score: s.score,
      feedbackJSON: s.feedbackJSON,
      aiFeedback: s.aiFeedback,
      codeQuality: s.codeQuality,
      submittedAt: s.submittedAt.toISOString(),
    }));

  return (
    <AssignmentWorkspace
      assignment={{
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        module: assignment.module,
        validationType: assignment.validationType,
      }}
      initialSubmissions={initialSubmissions}
    />
  );
}
