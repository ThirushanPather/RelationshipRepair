export default function HomeLoading() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 md:py-14 animate-pulse">

      {/* Header skeleton */}
      <div className="mb-12 md:mb-16">
        <div className="h-12 w-72 bg-white/[0.07] rounded-xl mb-3" />
        <div className="h-5 w-64 bg-white/[0.04] rounded-lg mb-6" />
        <div className="h-7 w-56 bg-white/[0.04] rounded-full" />
      </div>

      {/* Section label */}
      <div className="h-2.5 w-14 bg-white/[0.04] rounded mb-5" />

      {/* Theme grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex flex-col gap-0">
            {/* Icon + title */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
              <div className="h-5 w-2/5 bg-white/[0.06] rounded" />
            </div>
            {/* Description lines */}
            <div className="space-y-1.5 mb-5">
              <div className="h-3.5 w-full bg-white/[0.04] rounded" />
              <div className="h-3.5 w-3/4 bg-white/[0.04] rounded" />
            </div>
            {/* Progress area */}
            <div className="mt-auto space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-white/[0.04] rounded" />
              </div>
              <div className="h-px w-full bg-white/[0.06] rounded-full" />
            </div>
            {/* Button */}
            <div className="h-8 w-36 bg-white/[0.04] rounded-lg mt-3" />
          </div>
        ))}
      </div>

      {/* Activity section label */}
      <div className="h-2.5 w-24 bg-white/[0.04] rounded mb-5" />

      {/* Activity items skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-white/[0.07]" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-4 w-4/5 bg-white/[0.06] rounded" />
              <div className="h-4 w-3/5 bg-white/[0.04] rounded" />
              <div className="h-3 w-1/3 bg-white/[0.03] rounded" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
