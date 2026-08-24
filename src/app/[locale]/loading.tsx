export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header skeleton */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse"></div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-zinc-900 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-zinc-900/60 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 w-32 bg-zinc-900 rounded-full border border-zinc-800/60 animate-pulse"></div>
        </div>
      </header>

      {/* Main container skeleton */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-3 sm:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Hero banner skeleton */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800/80 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="max-w-2xl space-y-3.5">
            <div className="h-5 w-40 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse"></div>
            <div className="h-9 sm:h-10 w-80 max-w-full bg-zinc-800/80 rounded-xl animate-pulse"></div>
            <div className="h-4 w-[480px] max-w-full bg-zinc-800/50 rounded animate-pulse"></div>
          </div>

          <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800/80 flex flex-col gap-3 min-w-[260px]">
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-3 w-10 bg-emerald-500/20 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse"></div>
            <div className="w-full bg-zinc-900 h-2.5 rounded-full border border-zinc-800"></div>
          </div>
        </section>

        {/* Module grid header skeleton */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-zinc-900 rounded animate-pulse"></div>
            <div className="h-3 w-56 bg-zinc-900/60 rounded animate-pulse"></div>
          </div>
        </div>

        {/* 8 Module cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 flex flex-col justify-between h-64 space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-zinc-950 border border-zinc-800 rounded-md animate-pulse"></div>
                  <div className="h-5 w-20 bg-zinc-900 border border-zinc-800 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 w-28 bg-purple-950/40 border border-purple-800/40 rounded animate-pulse"></div>
                <div className="h-6 w-48 bg-zinc-800/80 rounded animate-pulse"></div>
                <div className="h-3 w-full bg-zinc-800/40 rounded animate-pulse"></div>
                <div className="h-3 w-3/4 bg-zinc-800/40 rounded animate-pulse"></div>
              </div>
              <div className="h-9 w-full bg-zinc-800/60 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
