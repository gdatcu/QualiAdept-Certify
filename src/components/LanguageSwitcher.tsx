'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 font-mono text-xs shadow-sm">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 rounded-md transition-all text-xs font-semibold cursor-pointer ${
          locale === 'en'
            ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
      >
        🇬🇧 EN
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLanguageChange('ro')}
        className={`px-2 py-1 rounded-md transition-all text-xs font-semibold cursor-pointer ${
          locale === 'ro'
            ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
      >
        🇷🇴 RO
      </button>
    </div>
  );
}
