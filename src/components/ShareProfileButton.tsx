'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface ShareProfileButtonProps {
  userId: string;
}

export default function ShareProfileButton({ userId }: ShareProfileButtonProps) {
  const t = useTranslations('ProgressCard');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const shareUrl = `${window.location.origin}/en/portfolio/${userId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browser contexts
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy portfolio URL:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        type="button"
        className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
          copied
            ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 hover:border-emerald-500/50'
        }`}
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 9a3 3 0 100-2.684 3 3 0 000 2.684z" />
            </svg>
            <span>{t('shareProfile')}</span>
          </>
        )}
      </button>

      <Link
        href={`/en/portfolio/${userId}`}
        target="_blank"
        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors text-xs font-mono inline-flex items-center justify-center"
        title="View Public Portfolio Page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );
}
