import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import SubmissionsTable, { SubmissionRecord } from './SubmissionsTable';

export const metadata: Metadata = {
  title: 'QualiAdept Certify | Trainer God Mode',
  description: 'Trainer Control Center for assignment management and submission auditing.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TrainerDashboardPage() {
  const t = await getTranslations('Trainer');

  // Fetch all submissions with User and Assignment relations ordered by newest first
  const rawSubmissions = await prisma.submission.findMany({
    include: {
      user: true,
      assignment: true,
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Convert Date objects to ISO strings for client prop serialization
  const submissions: SubmissionRecord[] = rawSubmissions.map((s) => ({
    ...s,
    submittedAt: s.submittedAt.toISOString(),
    user: {
      ...s.user,
      createdAt: s.user.createdAt.toISOString(),
    },
  }));

  // Calculate top key metrics
  const totalSubmissions = submissions.length;
  const passCount = submissions.filter((s) => s.status.toUpperCase() === 'PASS').length;
  const failCount = submissions.filter((s) => s.status.toUpperCase() === 'FAIL').length;
  const passRate = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;
  const avgScore =
    totalSubmissions > 0
      ? Math.round(submissions.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions)
      : 0;
  const uniqueStudents = new Set(submissions.map((s) => s.userId)).size;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500 selection:text-zinc-950 flex flex-col">
      {/* Top Header / Brand Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/30 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              ⚙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100 tracking-wide text-sm sm:text-base">
                  {t('title')}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold">
                  God Mode
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">qualiadept.eu / trainer</p>
            </div>
          </div>

          {/* Quick Navigation link back to Student Portal and Curriculum Manager */}
          <div className="flex items-center gap-3">
            <Link
              href="/trainer/assignments"
              className="text-xs text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-800 px-3.5 py-1.5 rounded-full font-mono flex items-center gap-1.5 transition-colors shadow-sm font-semibold"
            >
              <span>{t('curriculum')} ⚙️</span>
            </Link>
            <Link
              href="/"
              className="text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-1.5 rounded-full font-mono flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Student Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-8 flex flex-col gap-8">
        {/* Header Hero Section */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Live Monitoring Stream
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
                {t('title')}
              </h1>
              <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-400 self-start md:self-auto">
              <span>Database Status: <strong className="text-emerald-400">Connected</strong></span>
            </div>
          </div>
        </section>

        {/* Key Metrics Grid Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Submissions */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">{t('totalSubmissions')}</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l-5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-zinc-50">{totalSubmissions}</span>
              <span className="text-xs text-zinc-400 font-mono">records</span>
            </div>
          </div>

          {/* Card 2: Overall Pass Rate */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">{t('passRate')}</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-400">{passRate}%</span>
              <span className="text-xs text-zinc-400 font-mono">
                ({passCount} pass / {failCount} fail)
              </span>
            </div>
          </div>

          {/* Card 3: Average Score */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">Average Score</span>
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-cyan-300">{avgScore}%</span>
              <span className="text-xs text-zinc-400 font-mono">platform average</span>
            </div>
          </div>

          {/* Card 4: Active Students */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">{t('activeStudents')}</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-indigo-300">{uniqueStudents}</span>
              <span className="text-xs text-zinc-400 font-mono">enrolled candidates</span>
            </div>
          </div>
        </section>

        {/* Main Interactive Submissions Table */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400"></span>
              All Student Submissions
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              Showing {submissions.length} records
            </span>
          </div>

          {/* Client Table Component */}
          <SubmissionsTable initialSubmissions={submissions} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-4 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-mono gap-2">
          <div>QualiAdept Auto-Validation Platform &copy; {new Date().getFullYear()}</div>
          <div className="flex items-center gap-4">
            <span className="text-purple-400">● Admin Mode</span>
            <span>Domain: qualiadept.eu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
