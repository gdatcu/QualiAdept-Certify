export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col animate-pulse">
      {/* Top Navigation Header skeleton */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-zinc-900 rounded"></div>
            <div className="h-5 w-px bg-zinc-800"></div>
            <div className="h-6 w-32 bg-zinc-900 rounded"></div>
          </div>
          <div className="h-6 w-24 bg-zinc-900 rounded-full"></div>
        </div>
      </header>

      {/* Main Container skeleton */}
      <main className="max-w-5xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {/* Banner skeleton */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="h-5 w-36 bg-zinc-800 rounded-full"></div>
            <div className="h-8 w-60 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-80 bg-zinc-800/70 rounded"></div>
          </div>
          <div className="h-16 w-32 bg-zinc-950/80 rounded-xl border border-zinc-800"></div>
        </section>

        {/* Top 3 Podium skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 h-48 flex flex-col items-center justify-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800"></div>
            <div className="h-4 w-28 bg-zinc-800 rounded"></div>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-700 p-6 h-56 flex flex-col items-center justify-center space-y-3">
            <div className="h-20 w-20 rounded-2xl bg-zinc-800"></div>
            <div className="h-5 w-36 bg-zinc-800 rounded"></div>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 h-48 flex flex-col items-center justify-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800"></div>
            <div className="h-4 w-28 bg-zinc-800 rounded"></div>
          </div>
        </section>

        {/* Full Table skeleton */}
        <section className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="h-6 w-44 bg-zinc-800 rounded"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-zinc-950/70 rounded-xl border border-zinc-800"></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
