import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Clasament & Leaderboard | QualiAdept Auto-Validation',
  description: 'Topul cursanților și progresul tehnic în cadrul platformei QualiAdept.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Check enrollment & role in DB
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isEnrolled: true, role: true },
  });

  if (!currentUser || (!currentUser.isEnrolled && currentUser.role !== 'TRAINER')) {
    redirect('/enroll');
  }

  // Fetch all enrolled users or users with submissions
  const users = await prisma.user.findMany({
    where: {
      OR: [{ isEnrolled: true }, { role: 'TRAINER' }],
    },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      isProfilePublic: true,
      submissions: {
        where: { status: 'PASS' },
        select: {
          assignmentId: true,
          score: true,
          submittedAt: true,
          assignment: {
            select: { module: true },
          },
        },
      },
    },
  });

  // Process leaderboard ranking entries
  const leaderboardEntries = users.map((u) => {
    // Map best score per assignment
    const bestAssignmentScores = new Map<string, { score: number; module: number; submittedAt: Date }>();
    
    for (const sub of u.submissions) {
      const existing = bestAssignmentScores.get(sub.assignmentId);
      if (!existing || sub.score > existing.score) {
        bestAssignmentScores.set(sub.assignmentId, {
          score: sub.score,
          module: sub.assignment.module,
          submittedAt: new Date(sub.submittedAt),
        });
      }
    }

    const passedModules = Array.from(bestAssignmentScores.values());
    const passedCount = passedModules.length;
    const highestModule = passedModules.length > 0 ? Math.max(...passedModules.map((p) => p.module)) : 0;
    const totalScorePoints = passedModules.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = passedCount > 0 ? Math.round(totalScorePoints / passedCount) : 0;
    
    const lastPassTimestamp =
      passedModules.length > 0
        ? Math.max(...passedModules.map((p) => p.submittedAt.getTime()))
        : 0;

    return {
      id: u.id,
      name: u.name || 'QA Student',
      image: u.image,
      role: u.role,
      isProfilePublic: u.isProfilePublic,
      passedCount,
      highestModule,
      avgScore,
      totalScorePoints,
      lastPassTimestamp,
      isCurrentUser: u.id === session.user.id,
    };
  });

  // Sort descending by: passed count -> highest module -> total score points -> oldest last pass date
  leaderboardEntries.sort((a, b) => {
    if (b.passedCount !== a.passedCount) return b.passedCount - a.passedCount;
    if (b.highestModule !== a.highestModule) return b.highestModule - a.highestModule;
    if (b.totalScorePoints !== a.totalScorePoints) return b.totalScorePoints - a.totalScorePoints;
    return a.lastPassTimestamp - b.lastPassTimestamp;
  });

  const currentUserRank = leaderboardEntries.findIndex((e) => e.isCurrentUser) + 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Top Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors shrink-0"
            >
              <span>← Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                🏆
              </div>
              <span className="font-semibold text-zinc-100 text-xs sm:text-sm font-mono tracking-wide">
                QualiAdept Hall of Fame
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-emerald-950/60 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800/60">
              Rank-ul Tău: #{currentUserRank > 0 ? currentUserRank : '-'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {/* Leaderboard Banner Header */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span>🥇 Gamified Evaluation Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-50 tracking-tight">
                Clasamentul Cursanților QualiAdept
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1 max-w-2xl leading-relaxed">
                Clasament actualizat în timp real pe baza modulelor deblocat și a punctajelor obținute în testele automate.
              </p>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shrink-0 self-start sm:self-auto min-w-[160px]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Cursanți</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">{leaderboardEntries.length}</span>
                <span className="text-xs text-zinc-400 font-mono">Înscriși</span>
              </div>
            </div>
          </div>
        </section>

        {/* Top 3 Podium Highlights (Grid for Top 3) */}
        {leaderboardEntries.length >= 1 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Rank 2 (Silver) */}
            {leaderboardEntries[1] && (
              <div className="md:order-1 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-slate-700/60 p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-3 right-3 text-2xl">🥈</div>
                <div className="h-16 w-16 rounded-2xl bg-slate-800 border-2 border-slate-400/60 flex items-center justify-center font-bold text-xl text-slate-200 mb-3 shadow-[0_0_20px_rgba(148,163,184,0.2)]">
                  {leaderboardEntries[1].image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leaderboardEntries[1].image} alt="" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    leaderboardEntries[1].name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">#2 SILENT CODE RUNNER</span>
                <h3 className="text-base font-bold text-zinc-100 mt-1 truncate max-w-full">
                  {leaderboardEntries[1].name}
                </h3>
                <div className="mt-3 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{leaderboardEntries[1].passedCount} Module</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-400">{leaderboardEntries[1].avgScore}% Scos</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center Prominent) */}
            {leaderboardEntries[0] && (
              <div className="md:order-2 bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 rounded-2xl border-2 border-amber-500/60 p-6 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.2)] transform md:-translate-y-2">
                <div className="absolute top-3 right-3 text-3xl">🥇</div>
                <div className="h-20 w-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-black text-2xl text-amber-300 mb-3 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  {leaderboardEntries[0].image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leaderboardEntries[0].image} alt="" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    leaderboardEntries[0].name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-mono font-extrabold text-amber-400 tracking-wider">👑 CHAMPION QA ENGINEER</span>
                <h3 className="text-lg font-extrabold text-zinc-50 mt-1 truncate max-w-full">
                  {leaderboardEntries[0].name}
                </h3>
                <div className="mt-3 bg-amber-950/60 px-4 py-1.5 rounded-xl border border-amber-800/60 text-xs font-mono flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{leaderboardEntries[0].passedCount} Module Trecute</span>
                  <span className="text-amber-500">•</span>
                  <span className="text-amber-300 font-bold">{leaderboardEntries[0].avgScore}% Medie</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {leaderboardEntries[2] && (
              <div className="md:order-3 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-amber-800/60 p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-3 right-3 text-2xl">🥉</div>
                <div className="h-16 w-16 rounded-2xl bg-amber-950/40 border-2 border-amber-700/60 flex items-center justify-center font-bold text-xl text-amber-500 mb-3 shadow-[0_0_20px_rgba(180,83,9,0.2)]">
                  {leaderboardEntries[2].image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leaderboardEntries[2].image} alt="" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    leaderboardEntries[2].name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-amber-600">#3 AUTOMATION CHAMP</span>
                <h3 className="text-base font-bold text-zinc-100 mt-1 truncate max-w-full">
                  {leaderboardEntries[2].name}
                </h3>
                <div className="mt-3 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{leaderboardEntries[2].passedCount} Module</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-400">{leaderboardEntries[2].avgScore}% Scos</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Full Leaderboard Table */}
        <section className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span>📊 Structură Clasament Complet</span>
            </h2>
            <span className="text-xs font-mono text-zinc-400">Total: {leaderboardEntries.length} Cursanți</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Cursant QA</th>
                  <th className="py-3 px-4">Nivel Progres</th>
                  <th className="py-3 px-4 text-center">Module Trecute</th>
                  <th className="py-3 px-4 text-center">Scor Mediu</th>
                  <th className="py-3 px-4 text-right">Portofoliu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {leaderboardEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-zinc-900/80 transition-colors ${
                        entry.isCurrentUser ? 'bg-emerald-950/30 font-semibold' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold text-sm">
                        <span
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-xl border ${
                            rank === 1
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-base'
                              : rank === 2
                              ? 'bg-slate-500/20 text-slate-300 border-slate-500/40 text-base'
                              : rank === 3
                              ? 'bg-amber-800/20 text-amber-500 border-amber-700/40 text-base'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 text-xs'
                          }`}
                        >
                          {medal}
                        </span>
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 overflow-hidden shrink-0">
                            {entry.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={entry.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              entry.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100 truncate">{entry.name}</span>
                              {entry.isCurrentUser && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  TU
                                </span>
                              )}
                              {entry.role === 'TRAINER' && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                  TRAINER
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              ID: {entry.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Progress Level */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Modulul {entry.highestModule} Deblocat
                        </span>
                      </td>

                      {/* Modules Passed */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {entry.passedCount} / 8
                      </td>

                      {/* Avg Score */}
                      <td className="py-3.5 px-4 text-center font-bold text-cyan-400">
                        {entry.avgScore}%
                      </td>

                      {/* Public Portfolio Link */}
                      <td className="py-3.5 px-4 text-right">
                        {entry.isProfilePublic ? (
                          <Link
                            href={`/portfolio/${entry.id}`}
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                          >
                            <span>Portofoliu</span>
                            <span>→</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-600">Privat</span>
                        )}
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
