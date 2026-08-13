'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function HeaderAuth() {
  const t = useTranslations('Navigation');
  const { data: session, status: authStatus } = useSession();
  const isTrainer = session?.user?.role === 'TRAINER';
  const isAdmin = session?.user?.isAdmin === true || isTrainer;

  return (
    <div className="flex items-center gap-3">
      <LanguageSwitcher />

      {authStatus === 'loading' ? (
        <div className="h-8 w-32 bg-zinc-900 rounded-full animate-pulse border border-zinc-800"></div>
      ) : session?.user ? (
        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
          >
            <span>🏆 {t('leaderboard')}</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <span>🛡️ {t('adminPanel')}</span>
            </Link>
          )}
          {isTrainer && (
            <Link
              href="/trainer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              <span>⚡ {t('godMode')}</span>
            </Link>
          )}
          <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User Avatar'}
                className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                {(session.user.name || 'U').charAt(0)}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-zinc-200 leading-tight">
                {session.user.name || 'Student'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                {session.user.role === 'TRAINER' ? t('trainer') : t('student')}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="text-xs text-zinc-400 hover:text-rose-400 font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-rose-900 transition-colors cursor-pointer"
          >
            {t('signOut')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn('github')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer font-mono"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {t('signIn')}
        </button>
      )}
    </div>
  );
}
