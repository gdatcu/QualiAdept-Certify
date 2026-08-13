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

  // Fetch specific assignment from Prisma
  const assignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!assignment) {
    notFound();
  }

  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Enrollment Guard: Enforce redirection to /enroll if user is not enrolled and not a trainer
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isEnrolled: true, role: true },
  });

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
    if (!session?.user?.id) {
      redirect('/');
    }

    const prevAssignment = await prisma.assignment.findFirst({
      where: {
        module: assignment.module - 1,
        isActive: true,
      },
    });

    if (!prevAssignment) {
      redirect('/');
    }

    const passSubmission = await prisma.submission.findFirst({
      where: {
        userId: session.user.id,
        assignmentId: prevAssignment.id,
        status: 'PASS',
      },
    });

    if (!passSubmission) {
      redirect('/');
    }
  }

  // Fetch all submissions for current authenticated user and this assignment (newest first)
  const submissions = session?.user?.id
    ? await prisma.submission.findMany({
        where: {
          userId: session.user.id,
          assignmentId: assignment.id,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      })
    : [];

  const initialSubmissions = submissions.map((s) => ({
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
