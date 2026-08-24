'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { verifyToken } from '@/app/actions/enroll';

export default function EnrollForm() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Te rugăm să introduci codul de acces.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('token', token.trim());

    try {
      const res = await verifyToken(formData);
      if (res.success) {
        await update({ isEnrolled: true });
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'Cod de acces incorect.');
      }
    } catch {
      setError('A apărut o eroare la procesarea cererii.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-rose-950/80 border border-rose-800 p-3.5 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 shadow-md">
          <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="token-input" className="text-xs font-mono text-zinc-300 font-semibold">
          Cod de Acces (Enrollment Token)
        </label>
        <input
          id="token-input"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Lipește codul primit de la mentor..."
          disabled={loading}
          autoComplete="off"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-mono mt-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Se verifică...</span>
          </>
        ) : (
          <span>Deblochează Cursul →</span>
        )}
      </button>
    </form>
  );
}
