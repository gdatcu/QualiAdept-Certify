import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950/90 py-5 px-4 sm:px-6 md:px-8 mt-auto text-xs font-mono text-zinc-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          {t('copyright', { year: new Date().getFullYear() })}
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="hover:text-emerald-400 transition-colors underline-offset-4 hover:underline"
          >
            {t('privacy')}
          </Link>
          <span className="text-zinc-700 font-sans">•</span>
          <Link
            href="/terms"
            className="hover:text-emerald-400 transition-colors underline-offset-4 hover:underline"
          >
            {t('terms')}
          </Link>
          <span className="text-zinc-700 font-sans">•</span>
          <span className="text-zinc-400">qualiadept.eu</span>
        </div>
      </div>
    </footer>
  );
}
