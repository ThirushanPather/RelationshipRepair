export default function ProgressLoading() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-10 md:py-14 space-y-10">

      {/* Header */}
      <div className="space-y-2">
        <div className="h-12 w-56 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-white/5 animate-pulse" />
      </div>

      {/* Stats row */}
      <div>
        <div className="h-3 w-20 rounded bg-white/5 animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 space-y-2">
              <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <div className="glass-card rounded-2xl h-[340px] animate-pulse" />
        <div className="glass-card rounded-2xl h-[320px] animate-pulse" />
      </div>

      {/* Table */}
      <div>
        <div className="h-3 w-24 rounded bg-white/5 animate-pulse mb-4" />
        <div className="glass-card rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0"
            >
              <div className="h-4 w-4 rounded bg-white/5 animate-pulse shrink-0" />
              <div className="h-4 flex-1 rounded bg-white/5 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="h-4 w-4 rounded bg-white/5 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="h-3 w-32 rounded bg-white/5 animate-pulse mb-4" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
              <div className="flex gap-4 pt-1">
                <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
                <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
