export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col animate-pulse">
      {/* Header skeleton */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800"></div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-zinc-900 rounded"></div>
              <div className="h-3 w-16 bg-zinc-900 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-32 bg-zinc-900 rounded-full border border-zinc-800"></div>
        </div>
      </header>

      {/* Main container skeleton */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-3 sm:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Hero banner skeleton */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="h-5 w-36 bg-zinc-800 rounded-full"></div>
            <div className="h-8 sm:h-10 w-72 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-96 max-w-full bg-zinc-800/70 rounded"></div>
          </div>

          <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3 min-w-[260px]">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-zinc-800 rounded"></div>
              <div className="h-3 w-10 bg-zinc-800 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-zinc-800 rounded"></div>
            <div className="w-full bg-zinc-900 h-2.5 rounded-full border border-zinc-800"></div>
          </div>
        </section>

        {/* Module grid header skeleton */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-zinc-900 rounded"></div>
            <div className="h-3 w-56 bg-zinc-900 rounded"></div>
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
                  <div className="h-5 w-16 bg-zinc-800 rounded"></div>
                  <div className="h-5 w-20 bg-zinc-800 rounded-full"></div>
                </div>
                <div className="h-4 w-24 bg-zinc-800/80 rounded"></div>
                <div className="h-6 w-48 bg-zinc-800 rounded"></div>
                <div className="h-3 w-full bg-zinc-800/60 rounded"></div>
                <div className="h-3 w-3/4 bg-zinc-800/60 rounded"></div>
              </div>
              <div className="h-9 w-full bg-zinc-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
