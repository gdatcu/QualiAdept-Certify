'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';

export default function HeaderAuth() {
  const t = useTranslations('Navigation');
  const { data: session, status: authStatus } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isTrainer = session?.user?.role === 'TRAINER';
  const isAdmin = session?.user?.isAdmin === true || isTrainer;

  useEffect(() => {
    if (session?.user) {
      const displayName = session.user.name || session.user.email?.split('@')[0];
      if (displayName) {
        document.title = `QualiAdept Certify | ${displayName}`;
      }
    }
  }, [session]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />

        {authStatus === 'loading' ? (
          <div className="h-8 w-24 sm:w-32 bg-zinc-900 rounded-full animate-pulse border border-zinc-800"></div>
        ) : session?.user ? (
          <>
            {/* Desktop Navigation Row */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/leaderboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              >
                <span>🏆 {t('leaderboard')}</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  <span>🛡️ {t('adminPanel')}</span>
                </Link>
              )}
              {isTrainer && (
                <Link
                  href="/trainer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
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
                <div className="flex flex-col text-left">
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

            {/* Mobile View: Quick User Avatar & Hamburger Menu Toggle */}
            <div className="flex md:hidden items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User Avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-emerald-400">
                    {(session.user.name || 'U').charAt(0)}
                  </span>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  ) : (
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                  )}
                </svg>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => signIn('github')}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer font-mono"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">{t('signIn')}</span>
            <span className="sm:hidden">GitHub</span>
          </button>
        )}
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && session?.user && (
        <div className="absolute right-0 top-12 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User Avatar'}
                className="h-9 w-9 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                {(session.user.name || 'U').charAt(0)}
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-zinc-100">
                {session.user.name || 'Student'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {session.user.role === 'TRAINER' ? t('trainer') : t('student')}
              </span>
            </div>
          </div>

          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold transition-all"
          >
            <span>🏆 {t('leaderboard')}</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-bold transition-all"
            >
              <span>🛡️ {t('adminPanel')}</span>
            </Link>
          )}

          {isTrainer && (
            <Link
              href="/trainer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs font-mono font-bold transition-all"
            >
              <span>⚡ {t('godMode')}</span>
            </Link>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
            className="w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-800 hover:border-rose-900 text-xs font-mono transition-all cursor-pointer mt-1"
          >
            <span>{t('signOut')}</span>
            <span>🚪</span>
          </button>
        </div>
      )}
    </div>
  );
}
