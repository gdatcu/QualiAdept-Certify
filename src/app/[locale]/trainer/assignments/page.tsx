import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import CreateAssignmentForm from '@/components/CreateAssignmentForm';
import ToggleAssignmentButton from '@/components/ToggleAssignmentButton';
import DeleteAssignmentButton from '@/components/DeleteAssignmentButton';

export const dynamic = 'force-dynamic';

export default async function TrainerAssignmentsPage() {
  const session = await getAuthSession();

  // Security guard: Only TRAINER role is allowed
  if (!session || session.user?.role !== 'TRAINER') {
    redirect('/');
  }

  // Fetch all assignments ordered by module integer ascending
  const assignments = await prisma.assignment.findMany({
    orderBy: {
      module: 'asc',
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/trainer"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-2"
            >
              <span>← Back to Submissions</span>
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                ⚙️
              </div>
              <span className="font-semibold text-zinc-100 tracking-wide text-sm hidden sm:inline">
                Trainer Curriculum & Module Manager
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
      <main className="max-w-6xl mx-auto w-full flex-1 px-4 py-8 sm:px-8 flex flex-col gap-8">
        {/* Top Hero Section */}
        <section className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              GOD MODE ADMINISTRATOR
            </span>
            <span className="text-xs text-zinc-600">&bull;</span>
            <span className="text-xs font-mono text-zinc-400">QualiAdept LMS Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
            Curriculum Management Panel
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Create new automated assessment modules, update descriptions, and toggle assignment active states in real-time across student dashboards.
          </p>
        </section>

        {/* Create New Module Form Section */}
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              <h2 className="text-lg font-bold text-zinc-100">Create New Assessment Module</h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">Real-time DB Sync</span>
          </div>

          <CreateAssignmentForm />
        </section>

        {/* Existing Modules Data Table Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>Existing Curriculum Modules</span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Total Modules: {assignments.length}
              </p>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="p-12 text-center border border-zinc-800/80 rounded-2xl bg-zinc-900/40">
              <p className="text-xs font-mono text-zinc-400">
                No assignments found in curriculum. Use the form above to add your first module.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl">
              <table className="w-full text-left text-xs text-zinc-300 font-mono">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Module #</th>
                    <th className="py-3.5 px-4 font-bold">Title & Description</th>
                    <th className="py-3.5 px-4 font-bold">Validation Engine</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-emerald-400 text-sm whitespace-nowrap">
                        Module 0{assignment.module}
                      </td>
                      <td className="py-4 px-4 max-w-md">
                        <div className="font-bold text-zinc-100 text-sm font-sans mb-0.5">
                          {assignment.title}
                        </div>
                        <div className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed">
                          {assignment.description}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-semibold uppercase">
                          {assignment.validationType}
                        </span>
                        {assignment.validationRules && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
                            Custom Rules JSON ⚙️
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {assignment.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 font-semibold text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                              INACTIVE
                            </span>
                          )}

                          {assignment.isPublished === false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-amber-800/80 font-mono text-[9px] font-bold">
                              🔒 Draft (Unpublished)
                            </span>
                          ) : assignment.unlockDate && new Date(assignment.unlockDate) > new Date() ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80 font-mono text-[9px] font-bold">
                              ⏳ Scheduled ({new Date(assignment.unlockDate).toLocaleDateString('ro-RO')})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900 font-mono text-[9px]">
                              ✅ Published
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/trainer/assignments/${assignment.id}/edit`}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <span>Edit ✏️</span>
                          </Link>
                          <ToggleAssignmentButton
                            assignmentId={assignment.id}
                            currentStatus={assignment.isActive}
                          />
                          <DeleteAssignmentButton
                            assignmentId={assignment.id}
                            title={assignment.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-4 px-4 sm:px-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-mono gap-2">
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
