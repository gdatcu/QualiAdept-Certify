import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'God Mode Admin Dashboard | QualiAdept',
  description: 'Panou administrativ de monitorizare cursanți, securitate tokenuri și metrici platformă.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Verify Admin or Trainer privileges
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, role: true },
  });

  if (!currentUser || (!currentUser.isAdmin && currentUser.role !== 'TRAINER')) {
    redirect('/');
  }

  // Fetch all assignments count for status calculation
  const totalActiveAssignments = await prisma.assignment.count({
    where: { isActive: true },
  });

  // Fetch all users with submissions
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isAdmin: true,
      isEnrolled: true,
      failedAttempts: true,
      lockoutUntil: true,
      createdAt: true,
      isProfilePublic: true,
      submissions: {
        select: {
          id: true,
          status: true,
          score: true,
          assignmentId: true,
          submittedAt: true,
          assignment: {
            select: { module: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  const now = new Date();

  // Process user metrics & status
  let totalEnrolledCount = 0;
  let totalSubmissionsCount = 0;
  let totalLockoutsCount = 0;

  const userMetrics = users.map((u) => {
    if (u.isEnrolled) totalEnrolledCount++;
    totalSubmissionsCount += u.submissions.length;

    const isLockedOut = u.lockoutUntil && new Date(u.lockoutUntil) > now;
    if (isLockedOut) totalLockoutsCount++;

    const passedSubmissions = u.submissions.filter((s) => s.status === 'PASS');
    const passedAssignmentIds = new Set(passedSubmissions.map((s) => s.assignmentId));
    const unlockedModulesCount = passedAssignmentIds.size;

    const failedSubmissionsCount = u.submissions.filter((s) => s.status === 'FAIL').length;

    // Status classification logic: Completed, Locked Out, Stuck, Active
    let userStatus: 'Completed' | 'Locked Out' | 'Stuck' | 'Active' = 'Active';
    if (unlockedModulesCount >= (totalActiveAssignments || 8)) {
      userStatus = 'Completed';
    } else if (isLockedOut) {
      userStatus = 'Locked Out';
    } else if (u.failedAttempts >= 3 || failedSubmissionsCount >= 5) {
      userStatus = 'Stuck';
    }

    const createdFormatted = new Date(u.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      ...u,
      unlockedModulesCount,
      failedSubmissionsCount,
      userStatus,
      createdFormatted,
      isLockedOut,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-zinc-950 flex flex-col">
      {/* Top Admin Header */}
      <header className="border-b border-rose-900/60 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-rose-400 transition-colors shrink-0"
            >
              <span>← Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                🛡️
              </div>
              <span className="font-semibold text-zinc-100 text-xs sm:text-sm font-mono tracking-wide">
                QualiAdept God Mode Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-rose-950/80 text-rose-300 px-3 py-1 rounded-full border border-rose-800/80 font-bold shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              ADMIN CONTROL CENTER
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {/* Banner Section */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-rose-950/40 rounded-2xl border border-rose-900/40 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold mb-2">
                🛡️ System Governance &amp; Security Overview
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-50 tracking-tight">
                Panou Administrativ Cursanți
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1 max-w-2xl leading-relaxed">
                Monitorizare în timp real a înregistrărilor, ratelor de blocare token, modulelor deblocate și stării de participare.
              </p>
            </div>
          </div>
        </section>

        {/* Executive Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Utilizatori</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono">{users.length}</span>
              <span className="text-xs text-zinc-400 font-mono">Înregistrați</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Cursanți Înscriși</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{totalEnrolledCount}</span>
              <span className="text-xs text-zinc-400 font-mono">Cu Access Code</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Evaluări</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{totalSubmissionsCount}</span>
              <span className="text-xs text-zinc-400 font-mono">Submisii Cod</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Alerte Securitate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{totalLockoutsCount}</span>
              <span className="text-xs text-zinc-400 font-mono">Conturi Blocate</span>
            </div>
          </div>
        </section>

        {/* User Data Table */}
        <section className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
                <span>👥 Monitorizare Cursanți &amp; Încercări Token</span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Detalii despre conturi, role, tentative eșuate de token și progresul modulelor
              </p>
            </div>

            <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
              Total {userMetrics.length} înregistrări
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Utilizator / Email</th>
                  <th className="py-3 px-4 text-center">Rolă &amp; Admin</th>
                  <th className="py-3 px-4 text-center">Înrolat</th>
                  <th className="py-3 px-4 text-center">Module Deblocat</th>
                  <th className="py-3 px-4 text-center">Tentative Eșuate Token</th>
                  <th className="py-3 px-4 text-center">Status Account</th>
                  <th className="py-3 px-4 text-right">Data Înregistrării</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {userMetrics.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 overflow-hidden shrink-0">
                            {u.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (u.name || 'S').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-zinc-100 truncate">{u.name || 'QA Student'}</span>
                            <span className="text-[11px] text-zinc-400 truncate">{u.email || u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Admin Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              u.role === 'TRAINER'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            {u.role}
                          </span>
                          {u.isAdmin && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Enrolled Status */}
                      <td className="py-3.5 px-4 text-center">
                        {u.isEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                            ✓ Înrolat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-500 border border-zinc-800 text-[11px]">
                            Neînrolat
                          </span>
                        )}
                      </td>

                      {/* Unlocked Modules */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {u.unlockedModulesCount} / {totalActiveAssignments || 8}
                      </td>

                      {/* Failed Token Attempts */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            u.failedAttempts >= 5
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : u.failedAttempts >= 3
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'text-zinc-300'
                          }`}
                        >
                          {u.failedAttempts} / 5
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.userStatus === 'Completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : u.userStatus === 'Locked Out'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : u.userStatus === 'Stuck'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {u.userStatus}
                        </span>
                      </td>

                      {/* Creation Date */}
                      <td className="py-3.5 px-4 text-right text-xs text-zinc-400">
                        {u.createdFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
