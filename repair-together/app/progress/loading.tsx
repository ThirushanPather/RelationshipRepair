export default function ProgressLoading() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-10 md:py-14 space-y-10">

      {/* Header */}
      <div className="space-y-2">
        <div className="h-12 w-56 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-white/5 animate-pulse" />
      </div>

      {/* Health score ring */}
      <div className="flex justify-center">
        <div className="w-full md:max-w-72">
          <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center gap-4">
            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
            <div className="w-40 h-40 rounded-full bg-white/5 animate-pulse" />
            <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone strip */}
      <div>
        <div className="h-3 w-20 rounded bg-white/5 animate-pulse mb-2" />
        <div className="h-3 w-28 rounded bg-white/5 animate-pulse mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 animate-pulse shrink-0"
              style={{ width: 96, height: 96 }}
            />
          ))}
        </div>
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
        <div className="glass-card rounded-2xl h-85 animate-pulse" />
        <div className="glass-card rounded-2xl h-80 animate-pulse" />
      </div>

      {/* Insights */}
      <div>
        <div className="h-3 w-16 rounded bg-white/5 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex gap-3 items-start">
              <div className="h-5 w-5 rounded bg-white/5 animate-pulse shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
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
