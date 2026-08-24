import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EnrollForm from './EnrollForm';

export const metadata: Metadata = {
  title: 'Cod de Acces Curs | QualiAdept Auto-Validation',
  description: 'Introdu codul de acces pentru a debloca curriculumul QualiAdept.',
};

export const dynamic = 'force-dynamic';

export default async function EnrollPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Check enrollment status in DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isEnrolled: true, role: true },
  });

  if (user?.isEnrolled || user?.role === 'TRAINER') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:border-emerald-400/60 transition-colors">
              Q
            </div>
            <span className="font-semibold text-zinc-100 tracking-wide text-sm group-hover:text-white transition-colors">
              QualiAdept Enrollment Portal
            </span>
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none -mr-16 -mt-16"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                🔑
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-50 tracking-tight">
                Acces Curs Privat
              </h1>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Acest curs este privat. Introdu codul de acces primit de la trainer.
              </p>
            </div>

            <EnrollForm />
          </div>
        </div>
      </main>
    </div>
  );
}
