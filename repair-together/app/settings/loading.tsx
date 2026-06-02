export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 md:py-14 space-y-10 animate-pulse">

      {/* Header */}
      <div className="space-y-2">
        <div className="h-12 w-40 rounded-xl bg-white/[0.06]" />
        <div className="h-4 w-64 rounded-lg bg-white/[0.04]" />
      </div>

      {/* Names card */}
      <div>
        <div className="h-2.5 w-20 rounded bg-white/[0.04] mb-4" />
        <div className="glass-card rounded-2xl p-5 md:p-7 space-y-5">
          <div className="space-y-1">
            <div className="h-7 w-32 rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-72 rounded bg-white/[0.04]" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-white/[0.04]" />
              <div className="h-10 rounded-lg bg-white/[0.05]" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-white/[0.04]" />
              <div className="h-10 rounded-lg bg-white/[0.05]" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-lg bg-white/[0.05]" />
        </div>
      </div>

      {/* Data cards */}
      <div className="space-y-4">
        <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
        <div className="glass-card rounded-2xl p-5 md:p-7 space-y-4">
          <div className="h-7 w-36 rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-64 rounded bg-white/[0.04]" />
          <div className="h-10 rounded-lg bg-white/[0.05]" />
        </div>
        <div className="glass-card rounded-2xl p-5 md:p-7 space-y-4">
          <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-56 rounded bg-white/[0.04]" />
          <div className="h-9 w-36 rounded-lg bg-white/[0.05]" />
        </div>
      </div>

    </div>
  )
}
