import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import CodeBlock from '@/components/CodeBlock';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { userId } = await params;
  if (!userId) {
    return {
      title: { absolute: 'QualiAdept Certify | Certified portfolio' },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const userName = user?.name || user?.email?.split('@')[0] || 'QA Student';
  const fullTitle = `QualiAdept Certify | Certified portfolio | ${userName}`;
  const description = `View the verified QA Automation scripts and E2E testing portfolio of ${userName}.`;

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      images: [
        {
          url: '/icon.svg',
          width: 512,
          height: 512,
          alt: fullTitle,
        },
      ],
    },
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { userId } = await params;
  const t = await getTranslations('Portfolio');

  if (!userId) {
    notFound();
  }

  // Fetch public user fields only
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      linkedinUrl: true,
      githubUrl: true,
      publicEmail: true,
      aboutMe: true,
      isProfilePublic: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Privacy Guard: If profile is private, return stylized private state
  if (!user.isProfilePublic) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col justify-between">
        <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-2">
                <span>← QualiAdept Home</span>
              </Link>
              <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
              <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base group-hover:border-emerald-400/60 transition-colors">
                  Q
                </div>
                <span className="font-semibold text-zinc-100 tracking-wide text-sm hidden sm:inline group-hover:text-white transition-colors">
                  {t('portalTitle')}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto w-full flex-1 px-4 py-12 sm:py-16 flex items-center justify-center">
          <div className="p-6 sm:p-8 md:p-12 text-center border border-zinc-800/80 rounded-2xl bg-zinc-900/80 max-w-md shadow-2xl relative overflow-hidden">
            <div className="h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              🔒
            </div>
            <h2 className="text-xl font-bold text-zinc-100">{t('privateTitle')}</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-mono">
              {t('privateDesc')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Deduplication (Highest Score Strategy): Get highest scoring pass per assignment
  const passedSubmissions = await prisma.submission.findMany({
    where: {
      userId: user.id,
      status: 'PASS',
    },
    distinct: ['assignmentId'],
    orderBy: [
      { score: 'desc' },
      { submittedAt: 'desc' },
    ],
    include: {
      assignment: true,
    },
  });

  const milestones = passedSubmissions.sort(
    (a, b) => a.assignment.module - b.assignment.module
  );

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  const highestScore = milestones.length > 0 ? Math.max(...milestones.map((m) => m.score)) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Top Header / Brand Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-1 sm:mr-2 shrink-0">
              <span>← QualiAdept</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800 hidden sm:block"></div>
            <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm sm:text-base shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 group-hover:border-emerald-400/60 transition-colors">
                Q
              </div>
              <span className="font-semibold text-zinc-100 tracking-wide text-xs sm:text-sm hidden md:inline group-hover:text-white transition-colors">
                {t('portalTitle')}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-800/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="whitespace-nowrap">{t('verifiableBadge')}</span>
          </div>
        </div>
      </header>

      {/* Main Portfolio Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10 flex flex-col gap-6 sm:gap-8 md:gap-10">
        {/* Student Profile Hero Header */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800 p-4 sm:p-6 md:p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* User Avatar */}
              <div className="relative shrink-0">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || 'Student Avatar'}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-emerald-500/60 object-cover shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-500/60 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    {(user.name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-black text-[10px] sm:text-xs shadow-md">
                  ✓
                </div>
              </div>

              <div className="w-full min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-50 tracking-tight break-words">
                    {user.name || 'QA Student'}
                  </h1>
                  <span className="text-[10px] sm:text-xs font-mono px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                    {t('verifiedRole')}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-400 font-mono mb-2 break-all">
                  {t('memberSince')} {memberSince} &bull; {t('verifiedId')}: {user.id.substring(0, 12)}...
                </p>

                {/* About Me Bio */}
                {user.aboutMe && (
                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed mt-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    {user.aboutMe}
                  </p>
                )}

                {/* Social Contact Links */}
                {(user.linkedinUrl || user.githubUrl || user.publicEmail) && (
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-3 flex-wrap max-w-full">
                    {user.linkedinUrl && (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 text-xs font-mono transition-colors shadow-sm shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-blue-400 shrink-0" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.74a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}

                    {user.githubUrl && (
                      <a
                        href={user.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-mono transition-colors shadow-sm shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-zinc-200 shrink-0" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                    )}

                    {user.publicEmail && (
                      <a
                        href={`mailto:${user.publicEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-mono transition-colors shadow-sm max-w-full overflow-hidden shrink"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{user.publicEmail}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid (Stacks grid-cols-1 on mobile, grid-cols-2 / grid-cols-3 on md) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/60 w-full">
              <div className="bg-zinc-950/80 p-3.5 sm:p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">{t('verifiedModules')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{milestones.length}</span>
                  <span className="text-xs text-zinc-400 font-mono">{t('modulesPassed')}</span>
                </div>
              </div>

              <div className="bg-zinc-950/80 p-3.5 sm:p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">{t('highestScore')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{highestScore}%</span>
                  <span className="text-xs text-zinc-400 font-mono">{t('topScore')}</span>
                </div>
              </div>

              <div className="bg-zinc-950/80 p-3.5 sm:p-4 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-md sm:col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">{t('validationMode')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-bold text-purple-400 font-mono">100% {t('automated')}</span>
                  <span className="text-xs text-zinc-400 font-mono">Cheerio / Playwright</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Progression Timeline */}
        <section className="flex flex-col gap-6 w-full max-w-full">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] shrink-0"></span>
              {t('timelineTitle')}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {t('timelineSubtitle')}
            </p>
          </div>

          {milestones.length === 0 ? (
            <div className="p-6 sm:p-8 md:p-12 text-center border border-zinc-800/80 rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950 shadow-xl relative overflow-hidden">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                🌱
              </div>
              <h3 className="text-base font-bold text-zinc-100">
                {user.name || 'Student'} is just starting their QA Automation journey!
              </h3>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Check back soon for their validated projects and automated assertion test results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full max-w-full pb-2">
              <div className="relative pl-5 sm:pl-8 border-l-2 border-emerald-500/30 space-y-6 sm:space-y-8 my-2 w-full max-w-full min-w-0">
                {milestones.map((item) => {
                  const completedDate = new Date(item.submittedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div key={item.id} className="relative group w-full max-w-full">
                      {/* Timeline Dot Icon */}
                      <div className="absolute -left-[27px] sm:-left-[39px] top-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500 border-2 sm:border-4 border-zinc-950 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                        ✓
                      </div>

                      {/* Timeline Content Card */}
                      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 p-4 sm:p-6 shadow-xl transition-all w-full max-w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-zinc-800/80 pb-3 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-950 text-cyan-400 border border-zinc-800 font-semibold shrink-0">
                              {t('moduleBadge', { module: item.assignment.module < 10 ? `0${item.assignment.module}` : item.assignment.module })}
                            </span>
                            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/60 uppercase tracking-wider shrink-0">
                              {t('validation', { type: item.assignment.validationType })}
                            </span>
                          </div>

                          <span className="text-xs font-mono text-zinc-400 shrink-0">
                            {t('passedOn', { date: completedDate })}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-zinc-50 tracking-tight">
                          {item.assignment.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {item.assignment.description}
                        </p>

                        {/* Collapsible View Source Code Section */}
                        <details className="mt-4 group border border-zinc-800 rounded-xl bg-zinc-950/70 overflow-hidden max-w-full w-full">
                          <summary className="px-3.5 sm:px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-xs font-mono text-zinc-300 font-semibold cursor-pointer flex items-center justify-between transition-colors select-none">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              <span>{t('viewCode')}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono group-open:text-emerald-400 transition-colors">
                              {t('clickToggle')}
                            </span>
                          </summary>
                          <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 overflow-x-auto max-w-full w-full">
                            <CodeBlock
                              code={item.codePayload}
                              language={item.assignment.validationType === 'DYNAMIC' ? 'typescript' : 'html'}
                            />
                          </div>
                        </details>

                        {/* Verification Footer Bar */}
                        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 flex-wrap">
                            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-semibold">{t('autoValidated')}</span>
                            <span className="text-zinc-500 font-normal hidden sm:inline">| qualiadept.eu</span>
                          </div>

                          <span className="text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800 self-start sm:self-auto shrink-0">
                            Score: {item.score}% PASS
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
