'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Unhandled runtime error captured in app/error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 relative z-10">
        {/* Warning Icon Badge */}
        <div className="h-16 w-16 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.3)] text-rose-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
            500 - Server Error
          </h1>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed">
            Ceva nu a funcționat corect la încărcarea acestei pagini. Ne cerem scuze pentru inconvenient!
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded border border-zinc-800 mt-2 inline-block">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Încearcă din nou</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Întoarce-te la Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
