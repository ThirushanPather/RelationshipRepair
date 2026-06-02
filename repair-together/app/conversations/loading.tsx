export default function ConversationsLoading() {
  return (
    <div className="flex flex-col md:flex-row md:h-dvh md:overflow-hidden">

      {/* Left panel skeleton (desktop) */}
      <aside className="hidden md:flex flex-col w-[220px] glass-nav border-r border-border/50 shrink-0 py-6 px-3 gap-1.5">
        <div className="h-2.5 w-14 rounded bg-white/[0.06] mx-2 mb-3 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-white/[0.05] animate-pulse" />
        ))}
      </aside>

      <div className="flex-1 flex flex-col md:overflow-hidden">
        {/* Mobile tab row skeleton */}
        <div className="md:hidden flex gap-2 px-4 py-3 glass-nav border-b border-border/50 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-white/[0.05] animate-pulse shrink-0" />
          ))}
        </div>

        {/* Topic area skeleton */}
        <div className="px-4 md:px-10 py-6 md:py-10 space-y-5">
          {/* Theme heading */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
          </div>

          {/* Section label */}
          <div className="h-2.5 w-12 rounded bg-white/[0.05] animate-pulse" />

          {/* Topic cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 md:p-6 space-y-4 animate-pulse">
              <div className="h-6 w-4/5 rounded-lg bg-white/[0.06]" />
              <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
              <div className="space-y-3">
                <div className="h-4 rounded-full bg-white/[0.05]" />
                <div className="h-8 rounded-lg bg-white/[0.04]" />
                <div className="h-4 rounded-full bg-white/[0.05]" />
                <div className="h-8 rounded-lg bg-white/[0.04]" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
