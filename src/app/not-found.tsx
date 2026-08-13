import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500 selection:text-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 relative z-10">
        {/* Brand Icon Badge */}
        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.2)] text-2xl font-bold text-cyan-400">
          404
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
            404 - Not Found
          </h1>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed">
            Ups! Pagina pe care o cauți nu există, a fost mutată sau nu ai permisiunile necesare pentru a o accesa.
          </p>
        </div>

        {/* Primary Action CTA */}
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Întoarce-te la Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
