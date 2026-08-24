import { notFound, redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import AssignmentWorkspace from './AssignmentWorkspace';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getCachedAssignment = (id: string) =>
  unstable_cache(
    async () => {
      return prisma.assignment.findUnique({
        where: { id },
      });
    },
    [`assignment-detail-${id}`],
    { revalidate: 60, tags: ['assignments'] }
  )();

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

  // Execute cached assignment retrieval and all user queries strictly in parallel (Zero Waterfall)
  const [assignment, currentUser, currentSubmissions, userPassedSubmissions] = await Promise.all([
    getCachedAssignment(id),
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
    prisma.submission.findMany({
      where: {
        userId,
        status: 'PASS',
      },
      select: {
        assignment: {
          select: { module: true },
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

  // Server-side prerequisite guard evaluated in-memory
  if (assignment.module > 1 && currentUser.role !== 'TRAINER') {
    const passedModules = new Set(userPassedSubmissions.map((s) => s.assignment.module));
    if (!passedModules.has(assignment.module - 1)) {
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
