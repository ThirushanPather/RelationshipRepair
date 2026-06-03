export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 md:py-14 space-y-10 animate-pulse">

      {/* Header */}
      <div className="space-y-2">
        <div className="h-12 w-40 rounded-xl bg-white/6" />
        <div className="h-4 w-64 rounded-lg bg-white/4" />
      </div>

      {/* Appearance card */}
      <div>
        <div className="h-2.5 w-24 rounded bg-white/4 mb-4" />
        <div className="glass-card rounded-2xl p-5 md:p-7 space-y-5">
          <div className="space-y-1">
            <div className="h-7 w-36 rounded-lg bg-white/6" />
            <div className="h-4 w-64 rounded bg-white/4" />
          </div>
          {/* Three swatch placeholders */}
          <div className="flex gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-12 rounded-xl bg-white/5" />
                <div className="h-3 w-14 rounded bg-white/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Names card */}
      <div>
        <div className="h-2.5 w-20 rounded bg-white/4 mb-4" />
        <div className="glass-card rounded-2xl p-5 md:p-7 space-y-5">
          <div className="space-y-1">
            <div className="h-7 w-32 rounded-lg bg-white/6" />
            <div className="h-4 w-72 rounded bg-white/4" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-white/4" />
              <div className="h-10 rounded-lg bg-white/5" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-white/4" />
              <div className="h-10 rounded-lg bg-white/5" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-lg bg-white/5" />
        </div>
      </div>

    </div>
  )
}
