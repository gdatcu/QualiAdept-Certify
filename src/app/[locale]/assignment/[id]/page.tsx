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

  // Fetch target assignment, user enrollment status, and current assignment submissions in parallel
  const [assignment, currentUser, currentSubmissions] = await Promise.all([
    prisma.assignment.findUnique({
      where: { id },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        isEnrolled: true,
        role: true,
      },
    }),
    prisma.submission.findMany({
      where: {
        userId,
        assignmentId: id,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        codePayload: true,
        status: true,
        score: true,
        feedbackJSON: true,
        submittedAt: true,
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
  if (assignment.module > 1 && currentUser.role !== 'TRAINER') {
    const passedPrev = await prisma.submission.findFirst({
      where: {
        userId,
        status: 'PASS',
        assignment: {
          module: assignment.module - 1,
        },
      },
      select: { id: true },
    });

    if (!passedPrev) {
      redirect('/');
    }
  }

  const initialSubmissions = currentSubmissions.map((s) => ({
    id: s.id,
    codePayload: s.codePayload,
    status: s.status,
    score: s.score,
    feedbackJSON: s.feedbackJSON,
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
