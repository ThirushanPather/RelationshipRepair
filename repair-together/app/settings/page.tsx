"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()

  // ── Names ────────────────────────────────────────────────────────────────────
  const [nameHim, setNameHim] = useState("")
  const [nameHer, setNameHer] = useState("")
  const [namesSaving, setNamesSaving] = useState(false)
  const [namesSaved, setNamesSaved] = useState(false)
  const [namesError, setNamesError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load on mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("settings").select("key,value")
        const settings = (data ?? []) as { key: string; value: string }[]
        setNameHim(settings.find(s => s.key === "name_him")?.value ?? "Him")
        setNameHer(settings.find(s => s.key === "name_her")?.value ?? "Her")
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

      {/* ── Section 1: Names ─────────────────────────────────────────────────── */}
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

      {/* ── Section 2: Appearance ────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Appearance
        </p>

        <div className="glass-card rounded-2xl p-5 md:p-7">
          <h2 className="font-heading italic text-2xl text-foreground mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>
      </section>

    </div>
  )
}
