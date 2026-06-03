"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  PALETTES,
  DEFAULT_PALETTE_KEY,
  getPalette,
  applyPalette,
  type Palette,
  type PaletteKey,
} from "@/lib/palettes"

// ─── Inline status message ────────────────────────────────────────────────────

function StatusDot({ message, variant = "success" }: { message: string; variant?: "success" | "error" }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span
        className="w-1.5 h-1.5 rounded-full block shrink-0"
        style={{ background: variant === "error" ? "#e05252" : "#8aab7a" }}
      />
      <span style={{ color: variant === "error" ? "#e05252" : "#8aab7a" }}>{message}</span>
    </div>
  )
}

// ─── Palette swatch ───────────────────────────────────────────────────────────

function PaletteSwatch({
  palette,
  isActive,
  onSelect,
}: {
  palette: Palette
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2"
      aria-label={`${palette.name} theme`}
      aria-pressed={isActive}
    >
      {/* Mini preview */}
      <div
        className="w-20 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          boxShadow: isActive ? `0 0 0 2.5px ${palette.accent}` : "none",
        }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: palette.accent }}
        />
      </div>
      {/* Label */}
      <span
        className={`text-xs transition-colors duration-200 ${isActive ? "" : "text-muted-foreground"}`}
        style={isActive ? { color: palette.accent } : undefined}
      >
        {palette.name}
      </span>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()

  // ── Palette ──────────────────────────────────────────────────────────────────
  const [activePalette, setActivePalette] = useState<PaletteKey>(DEFAULT_PALETTE_KEY)

  // ── Names ────────────────────────────────────────────────────────────────────
  const [nameHim, setNameHim] = useState("")
  const [nameHer, setNameHer] = useState("")
  const [namesSaving, setNamesSaving] = useState(false)
  const [namesSaved, setNamesSaved] = useState(false)
  const [namesError, setNamesError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load on mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    // Sync active swatch with whatever the inline script already applied
    const local = localStorage.getItem("ui-palette")
    if (local && PALETTES.some(p => p.key === local)) {
      setActivePalette(local as PaletteKey)
    }

    async function load() {
      try {
        const { data } = await supabase.from("settings").select("key,value")
        const settings = (data ?? []) as { key: string; value: string }[]
        setNameHim(settings.find(s => s.key === "name_him")?.value ?? "Him")
        setNameHer(settings.find(s => s.key === "name_her")?.value ?? "Her")

        // Prefer Supabase palette over localStorage
        const dbPaletteKey = settings.find(s => s.key === "ui-palette")?.value
        if (dbPaletteKey && PALETTES.some(p => p.key === dbPaletteKey)) {
          setActivePalette(dbPaletteKey as PaletteKey)
          if (dbPaletteKey !== localStorage.getItem("ui-palette")) {
            applyPalette(getPalette(dbPaletteKey))
            localStorage.setItem("ui-palette", dbPaletteKey)
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Select palette ───────────────────────────────────────────────────────────

  async function selectPalette(key: PaletteKey) {
    const palette = getPalette(key)
    applyPalette(palette)
    localStorage.setItem("ui-palette", key)
    setActivePalette(key)

    try {
      // Settings table has no unique constraint on key — check then update/insert
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", "ui-palette")
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        await supabase.from("settings").update({ value: key }).eq("id", existing.id)
      } else {
        await supabase.from("settings").insert({ key: "ui-palette", value: key })
      }
    } catch (err) {
      console.error("Failed to persist palette:", err)
    }
  }

  // ── Save names ───────────────────────────────────────────────────────────────

  async function saveNames() {
    if (!nameHim.trim() || !nameHer.trim()) return
    setNamesSaving(true)
    setNamesError(null)

    const [r1, r2] = await Promise.all([
      supabase.from("settings").update({ value: nameHim.trim() }).eq("key", "name_him"),
      supabase.from("settings").update({ value: nameHer.trim() }).eq("key", "name_her"),
    ])

    setNamesSaving(false)
    if (r1.error || r2.error) {
      setNamesError(r1.error?.message ?? r2.error?.message ?? "Failed to save names.")
      return
    }
    setNamesSaved(true)
    router.refresh()
    setTimeout(() => setNamesSaved(false), 3000)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 md:py-14 space-y-10">

      {/* Page header */}
      <header>
        <h1 className="font-heading italic text-5xl md:text-[3.5rem] text-gold leading-none tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage how the app works for both of you
        </p>
      </header>

      {/* ── Section 1: Appearance ────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Appearance
        </p>

        <div className="glass-card rounded-2xl p-5 md:p-7">
          <h2 className="font-heading italic text-2xl text-foreground mb-1">Colour Theme</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a palette for the app. Changes apply instantly across all pages.
          </p>

          <div className="flex flex-wrap gap-5">
            {PALETTES.map(palette => (
              <PaletteSwatch
                key={palette.key}
                palette={palette}
                isActive={activePalette === palette.key}
                onSelect={() => selectPalette(palette.key)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Names ─────────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Personalise
        </p>

        <div className="glass-card rounded-2xl p-5 md:p-7">
          <h2 className="font-heading italic text-2xl text-foreground mb-1">Your Names</h2>
          <p className="text-sm text-muted-foreground mb-6">
            These names appear on sliders and charts throughout the app.
          </p>

          {/* Inputs */}
          {loading ? (
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="h-10 flex-1 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-10 flex-1 rounded-lg bg-white/5 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="name-him" className="text-xs text-muted-foreground">
                  His name
                </label>
                <input
                  id="name-him"
                  type="text"
                  value={nameHim}
                  onChange={e => setNameHim(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveNames()}
                  placeholder="Him"
                  className="glass-input rounded-lg px-3 py-2.5 text-sm text-foreground
                             placeholder:text-muted-foreground/40
                             focus:ring-1 focus:ring-accent/30 w-full"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="name-her" className="text-xs text-muted-foreground">
                  Her name
                </label>
                <input
                  id="name-her"
                  type="text"
                  value={nameHer}
                  onChange={e => setNameHer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveNames()}
                  placeholder="Her"
                  className="glass-input rounded-lg px-3 py-2.5 text-sm text-foreground
                             placeholder:text-muted-foreground/40
                             focus:ring-1 focus:ring-accent/30 w-full"
                />
              </div>
            </div>
          )}

          {/* Save row */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={saveNames}
              disabled={namesSaving || loading || !nameHim.trim() || !nameHer.trim()}
              className="glass-button px-5 py-2 rounded-lg text-sm text-accent
                         hover:bg-accent/25 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {namesSaving ? "Saving…" : "Save names"}
            </button>
            {namesSaved && <StatusDot message="Names updated" />}
            {namesError && <StatusDot message={namesError} variant="error" />}
          </div>
        </div>
      </section>

    </div>
  )
}
