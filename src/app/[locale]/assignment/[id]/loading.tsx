export default function AssignmentLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col animate-pulse">
      {/* Top Header skeleton */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-zinc-900 rounded"></div>
            <div className="h-6 w-px bg-zinc-800"></div>
            <div className="h-8 w-8 rounded-lg bg-zinc-900"></div>
          </div>
          <div className="h-8 w-44 bg-zinc-900 rounded-full border border-zinc-800"></div>
        </div>
      </header>

      {/* Main Workspace skeleton */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 flex flex-col gap-6">
        {/* Assignment Hero Header skeleton */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-zinc-800 rounded"></div>
              <div className="h-5 w-28 bg-zinc-800 rounded"></div>
            </div>
            <div className="h-8 w-72 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-96 max-w-full bg-zinc-800/70 rounded"></div>
          </div>
          <div className="h-12 w-40 bg-zinc-950 rounded-xl border border-zinc-800"></div>
        </section>

        {/* 2-Column Interactive Workspace skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Code Editor skeleton (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl h-[580px] flex flex-col">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-zinc-800"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-800"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-800"></div>
                </div>
                <div className="h-6 w-28 bg-zinc-900 rounded"></div>
              </div>
              <div className="flex-1 bg-zinc-950/80 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              </div>
            </div>
          </div>

          {/* Right Column: Green Wall skeleton (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 sm:p-6 min-h-[580px] space-y-5">
              <div className="flex justify-between border-b border-zinc-800 pb-4">
                <div className="h-6 w-36 bg-zinc-800 rounded"></div>
                <div className="h-6 w-20 bg-zinc-800 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-16 w-full bg-zinc-950/60 rounded-xl border border-zinc-800"></div>
                <div className="h-16 w-full bg-zinc-950/60 rounded-xl border border-zinc-800"></div>
                <div className="h-16 w-full bg-zinc-950/60 rounded-xl border border-zinc-800"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
