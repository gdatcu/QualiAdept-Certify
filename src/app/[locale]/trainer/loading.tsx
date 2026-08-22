export default function TrainerLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col animate-pulse">
      {/* Top Header skeleton */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800"></div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-zinc-900 rounded"></div>
              <div className="h-3 w-20 bg-zinc-900 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-zinc-900 rounded-full"></div>
            <div className="h-8 w-32 bg-zinc-900 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Container skeleton */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-8 flex flex-col gap-8">
        {/* Header Hero skeleton */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="h-4 w-36 bg-zinc-800 rounded-full"></div>
            <div className="h-8 w-64 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-80 bg-zinc-800/70 rounded"></div>
          </div>
          <div className="h-10 w-44 bg-zinc-950 rounded-xl border border-zinc-800"></div>
        </section>

        {/* 4 Metric Cards skeleton */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-zinc-800 rounded"></div>
                <div className="h-8 w-8 rounded-xl bg-zinc-800"></div>
              </div>
              <div className="h-8 w-20 bg-zinc-800 rounded"></div>
            </div>
          ))}
        </section>

        {/* Table skeleton */}
        <section className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-44 bg-zinc-800 rounded"></div>
            <div className="h-5 w-32 bg-zinc-800 rounded"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 w-full bg-zinc-950/70 rounded-xl border border-zinc-800"></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
