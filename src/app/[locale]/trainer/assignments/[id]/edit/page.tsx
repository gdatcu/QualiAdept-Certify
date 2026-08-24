import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import EditAssignmentForm from '@/components/EditAssignmentForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAssignmentPage({ params }: PageProps) {
  const session = await getAuthSession();

  // Security guard: Only TRAINER role is allowed
  if (!session || session.user?.role !== 'TRAINER') {
    redirect('/');
  }

  const { id } = await params;
  if (!id) {
    notFound();
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!assignment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/assignments"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-2"
            >
              <span>← Cancel</span>
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                ✏️
              </div>
              <span className="font-semibold text-zinc-100 tracking-wide text-sm hidden sm:inline">
                Edit Assessment Module 0{assignment.module}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold">
              TRAINER: {session.user.name || session.user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full flex-1 px-4 py-8 sm:px-8 flex flex-col gap-8">
        {/* Top Hero Section */}
        <section className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              CURRICULUM EDITOR
            </span>
            <span className="text-xs text-zinc-600">&bull;</span>
            <span className="text-xs font-mono text-zinc-400">Module ID: {assignment.id.substring(0, 12)}...</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
            Edit Module 0{assignment.module}: {assignment.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Modify module numbering, title, validation engine, or description requirements. Changes apply immediately across all student workspaces.
          </p>
        </section>

        {/* Edit Assignment Form Container */}
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              <h2 className="text-lg font-bold text-zinc-100">Module Details</h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">PostgreSQL Sync</span>
          </div>

          <EditAssignmentForm assignment={assignment} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-4 px-4 sm:px-8 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-mono gap-2">
          <div>QualiAdept Curriculum Management Panel &copy; {new Date().getFullYear()}</div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">● Realtime Sync</span>
            <span>certify.qualiadept.eu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
