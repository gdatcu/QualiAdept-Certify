import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import HeaderAuth from '@/components/HeaderAuth';
import ShareProfileButton from '@/components/ShareProfileButton';
import EditProfileModal from '@/components/EditProfileModal';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'QualiAdept Certify | QA Automation Learning Platform',
  };
}

export default async function StudentDashboard() {
  const t = await getTranslations('Index');
  const tDash = await getTranslations('Dashboard');
  const session = await getAuthSession();

  const userId = session?.user?.id;

  // Fetch assignments, submissions, and profile concurrently with Promise.all
  const [rawAssignments, submissions, userRecord] = await Promise.all([
    prisma.assignment.findMany({
      where: { isActive: true },
      orderBy: { module: 'asc' },
    }),
    userId
      ? prisma.submission.findMany({
          where: { userId, status: 'PASS' },
          select: { assignmentId: true },
        })
      : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            linkedinUrl: true,
            githubUrl: true,
            publicEmail: true,
            aboutMe: true,
            isProfilePublic: true,
          },
        })
      : Promise.resolve(null),
  ]);

  // Deduplicate assignments by module integer if test entries exist
  const uniqueAssignmentsMap = new Map<number, typeof rawAssignments[0]>();
  for (const assignment of rawAssignments) {
    if (!uniqueAssignmentsMap.has(assignment.module)) {
      uniqueAssignmentsMap.set(assignment.module, assignment);
    }
  }
  const assignments = Array.from(uniqueAssignmentsMap.values()).sort((a, b) => a.module - b.module);

  // Determine passed assignments and completed module numbers
  const passedAssignmentIds = new Set(submissions.map((s) => s.assignmentId));

  const completedModules = new Set<number>();
  assignments.forEach((a) => {
    if (passedAssignmentIds.has(a.id)) {
      completedModules.add(a.module);
    }
  });

  const now = new Date();

  // Compute state for each assignment (COMPLETED, UNLOCKED, LOCKED)
  const moduleCards = assignments.map((assignment) => {
    const isPassed = passedAssignmentIds.has(assignment.id);
    const isPrevPassed = assignment.module <= 1 || completedModules.has(assignment.module - 1);
    const isPublished = assignment.isPublished !== false;
    const isTimeUnlocked =
      !assignment.unlockDate || new Date(assignment.unlockDate) <= now;

    let status: 'COMPLETED' | 'UNLOCKED' | 'LOCKED' = 'LOCKED';
    let lockReason: 'PREV_NOT_PASSED' | 'NOT_PUBLISHED' | 'FUTURE_UNLOCK' = 'PREV_NOT_PASSED';

    if (isPassed) {
      status = 'COMPLETED';
    } else if (isPrevPassed && isPublished && isTimeUnlocked) {
      status = 'UNLOCKED';
    } else {
      status = 'LOCKED';
      if (!isPublished) {
        lockReason = 'NOT_PUBLISHED';
      } else if (!isTimeUnlocked) {
        lockReason = 'FUTURE_UNLOCK';
      } else {
        lockReason = 'PREV_NOT_PASSED';
      }
    }

    return {
      ...assignment,
      status,
      lockReason,
    };
  });

  const completedCount = moduleCards.filter((m) => m.status === 'COMPLETED').length;
  const totalCount = moduleCards.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Top Header / Brand & Auth Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100 tracking-wide text-sm sm:text-base">QualiAdept</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  LMS Dashboard
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">qualiadept.eu</p>
            </div>
          </div>

          <HeaderAuth />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-3 sm:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Dashboard Hero Banner & Learning Progress */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('curriculumBadge')}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
                {t('dashboardTitle')}
              </h1>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* Overall Progress Gauge Card */}
            <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3 min-w-[260px] shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{t('progressLabel')}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{progressPercent}%</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-50 font-mono">{completedCount}</span>
                <span className="text-xs text-zinc-400 font-mono">/ {totalCount} {t('modulesPassed')}</span>
              </div>

              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {session?.user?.id && (
                <div className="mt-1 pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <EditProfileModal initialData={userRecord || undefined} />
                  <ShareProfileButton userId={session.user.id} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 100% Curriculum Completion Certificate Banner */}
        {progressPercent === 100 && (
          <section className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-sky-950/60 rounded-2xl border border-amber-500/50 p-6 sm:p-8 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
                🏆
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                  {t('curriculumMastered')}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight">
                  {t('congratsTitle')}
                </h2>
                <p className="text-xs text-zinc-300 font-mono mt-1 max-w-xl leading-relaxed">
                  {t('congratsDescription')}
                </p>
              </div>
            </div>

            <a
              href="/api/certificate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-sky-400 hover:from-amber-400 hover:to-sky-300 text-zinc-950 font-black text-xs font-mono transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2.5 shrink-0 hover:scale-105 cursor-pointer uppercase tracking-wider relative z-10"
            >
              <span>🏆 {t('downloadCertificate')}</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </a>
          </section>
        )}

        {/* Modules Grid Section */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{tDash('pageTitle')}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{tDash('subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> {tDash('passed')}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span> {tDash('unlocked')}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                <span className="h-2 w-2 rounded-full bg-zinc-600"></span> {tDash('locked')}
              </span>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {moduleCards.map((assignment) => {
              const isCompleted = assignment.status === 'COMPLETED';
              const isUnlocked = assignment.status === 'UNLOCKED';
              const isLocked = assignment.status === 'LOCKED';

              const CardContent = (
                <>
                  {/* Background Ambient Glow */}
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                  )}

                  <div>
                    {/* Top Row: Module Badge & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-950 text-zinc-300 border border-zinc-800 font-semibold">
                        {tDash('moduleBadge', { module: assignment.module < 10 ? `0${assignment.module}` : assignment.module })}
                      </span>

                      {/* Visual Status Badge */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-mono font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                          {tDash('passed')}
                        </span>
                      )}

                      {isUnlocked && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 text-xs font-mono font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                          {tDash('unlocked')}
                        </span>
                      )}

                      {isLocked && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-mono font-medium">
                          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {tDash('locked')}
                        </span>
                      )}
                    </div>

                    {/* Validation Engine Type Tag */}
                    <div className="mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/50 uppercase tracking-wider">
                        {assignment.validationType} {tDash('inspection')}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Card Action Area */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80">
                    {isCompleted || isUnlocked ? (
                      <div
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all font-mono shadow-md ${
                          isCompleted
                            ? 'bg-zinc-800 group-hover:bg-emerald-950 group-hover:text-emerald-300 text-zinc-200 border border-zinc-700 group-hover:border-emerald-600'
                            : 'bg-gradient-to-r from-cyan-500 to-teal-500 group-hover:from-cyan-400 group-hover:to-teal-400 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        }`}
                      >
                        <span>{isCompleted ? tDash('reviewButton') : tDash('startModule')}</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800/60 text-zinc-400 text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-not-allowed text-center">
                        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>
                          {assignment.lockReason === 'NOT_PUBLISHED'
                            ? `🔒 ${tDash('comingSoon')}`
                            : assignment.lockReason === 'FUTURE_UNLOCK'
                            ? `🔒 ${tDash('unlocksOn', {
                                date: assignment.unlockDate
                                  ? new Date(assignment.unlockDate).toLocaleDateString('ro-RO', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '',
                              })}`
                            : tDash('passModuleFirst', { module: assignment.module - 1 })}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              );

              const cardClassName = `rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                isCompleted
                  ? 'bg-zinc-900/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-400 hover:-translate-y-1 cursor-pointer'
                  : isUnlocked
                  ? 'bg-zinc-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-cyan-400 hover:-translate-y-1 cursor-pointer'
                  : 'bg-zinc-950/40 border-zinc-800/80 opacity-70 cursor-not-allowed'
              }`;

              if (isCompleted || isUnlocked) {
                return (
                  <Link key={assignment.id} href={`/assignment/${assignment.id}`} className={cardClassName}>
                    {CardContent}
                  </Link>
                );
              }

              return (
                <div key={assignment.id} className={cardClassName}>
                  {CardContent}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-4 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-mono gap-2">
          <div>QualiAdept Auto-Validation Platform &copy; {new Date().getFullYear()}</div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">● Auth Protected</span>
            <span>Domain: app.qualiadept.eu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
