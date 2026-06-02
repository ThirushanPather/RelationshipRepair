"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ThemeRow = {
  id: string
  name: string
  icon: string
  sort_order: number
}

type TopicRow = {
  id: string
  theme_id: string
  question: string
  sort_order: number
}

// ─── CSV helper ────────────────────────────────────────────────────────────────

function csvCell(val: string | number | null | undefined): string {
  if (val == null || val === "") return ""
  const s = String(val)
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// ─── Muted-red danger button ───────────────────────────────────────────────────

function DangerButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm border transition-colors duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: "#c47a6a", borderColor: "rgba(196,122,106,0.3)", background: "rgba(196,122,106,0.08)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(196,122,106,0.16)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(196,122,106,0.08)" }}
    >
      {children}
    </button>
  )
}

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

  // ── Topics / reset ───────────────────────────────────────────────────────────
  const [themes, setThemes] = useState<ThemeRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Export ───────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // ── Loading ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)

  // ── Load on mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, themesRes, topicsRes] = await Promise.all([
          supabase.from("settings").select("key,value"),
          supabase.from("themes").select("id,name,icon,sort_order").order("sort_order"),
          supabase.from("topics").select("id,theme_id,question,sort_order").order("sort_order"),
        ])
        const settings = (settingsRes.data ?? []) as { key: string; value: string }[]
        setNameHim(settings.find(s => s.key === "name_him")?.value ?? "Him")
        setNameHer(settings.find(s => s.key === "name_her")?.value ?? "Her")
        setThemes((themesRes.data ?? []) as ThemeRow[])
        setTopics((topicsRes.data ?? []) as TopicRow[])
      } catch (err) {
        console.error("Failed to load settings data:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  const filteredGroups = themes
    .map(theme => ({
      ...theme,
      topics: topics.filter(t => {
        if (t.theme_id !== theme.id) return false
        if (!search.trim()) return true
        return t.question.toLowerCase().includes(search.toLowerCase())
      }),
    }))
    .filter(g => g.topics.length > 0)

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

  // ── Delete topic ratings ─────────────────────────────────────────────────────

  async function deleteTopicRatings() {
    if (!selectedTopicId) return
    setDeleting(true)
    setDeleteError(null)

    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("topic_id", selectedTopicId)

    setDeleting(false)
    if (error) {
      setDeleteError(error.message)
      return
    }
    setDeleteSuccess(true)
    setConfirmDelete(false)
    setSelectedTopicId(null)
    setTimeout(() => setDeleteSuccess(false), 3000)
  }

  // ── Download CSV ─────────────────────────────────────────────────────────────

  async function downloadCSV() {
    setExporting(true)
    setExportError(null)

    const [ratingsRes, topicsRes, themesRes] = await Promise.all([
      supabase
        .from("ratings")
        .select("topic_id,person,score,note,rated_at")
        .order("rated_at", { ascending: false }),
      supabase.from("topics").select("id,theme_id,question"),
      supabase.from("themes").select("id,name"),
    ])

    if (ratingsRes.error || topicsRes.error || themesRes.error) {
      setExportError("Failed to fetch data for export.")
      setExporting(false)
      return
    }

    const ratings = (ratingsRes.data ?? []) as {
      topic_id: string; person: "him" | "her"
      score: number; note: string | null; rated_at: string
    }[]
    const allTopics = (topicsRes.data ?? []) as { id: string; theme_id: string; question: string }[]
    const allThemes = (themesRes.data ?? []) as { id: string; name: string }[]

    // One CSV row per rated topic — most recent scores per person
    const rows: string[] = []
    for (const topic of allTopics) {
      const tr = ratings.filter(r => r.topic_id === topic.id)
      if (tr.length === 0) continue
      // ratings sorted desc — first match per person = most recent
      const him  = tr.find(r => r.person === "him")
      const her  = tr.find(r => r.person === "her")
      const date = format(new Date(tr[0].rated_at), "yyyy-MM-dd")
      const theme = allThemes.find(t => t.id === topic.theme_id)
      rows.push([
        csvCell(date),
        csvCell(theme?.name ?? ""),
        csvCell(topic.question),
        csvCell(him?.score ?? ""),
        csvCell(him?.note ?? ""),
        csvCell(her?.score ?? ""),
        csvCell(her?.note ?? ""),
      ].join(","))
    }

    rows.sort((a, b) => b.localeCompare(a)) // desc by date (first column)

    const header = [
      "Date", "Theme", "Question",
      csvCell(`${nameHim} Score`), csvCell(`${nameHim} Note`),
      csvCell(`${nameHer} Score`), csvCell(`${nameHer} Note`),
    ].join(",")

    const csv  = [header, ...rows].join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `us-intentionally-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExporting(false)
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
            {namesSaved  && <StatusDot message="Names updated" />}
            {namesError  && <StatusDot message={namesError} variant="error" />}
          </div>
        </div>
      </section>

      {/* ── Sections 2 & 3: Data ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
          Data
        </p>

        {/* ── Reset a Topic ────────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 md:p-7">
          <h2 className="font-heading italic text-2xl text-foreground mb-1">Reset a Topic</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Delete all ratings for a specific topic. This cannot be undone.
          </p>

          {/* Searchable dropdown */}
          <div className="relative mb-4">
            {/* Click-away backdrop */}
            {dropdownOpen && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setDropdownOpen(false)
                  if (!selectedTopicId) setSearch("")
                }}
              />
            )}

            {/* Trigger input */}
            <div className="relative z-20">
              <input
                type="text"
                value={dropdownOpen ? search : (selectedTopic ? selectedTopic.question.slice(0, 72) : "")}
                onChange={e => {
                  setSearch(e.target.value)
                  setDropdownOpen(true)
                  setSelectedTopicId(null)
                  setConfirmDelete(false)
                  setDeleteError(null)
                }}
                onFocus={() => {
                  setDropdownOpen(true)
                  setSearch("")
                }}
                placeholder={loading ? "Loading topics…" : "Choose a topic to reset…"}
                readOnly={loading}
                className="glass-input w-full rounded-lg px-3 py-2.5 pr-9 text-sm text-foreground
                           placeholder:text-muted-foreground/40
                           focus:ring-1 focus:ring-accent/30 cursor-pointer truncate"
              />
              <ChevronDown
                size={15}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                            pointer-events-none transition-transform duration-200
                            ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </div>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div
                className="absolute top-full mt-1 left-0 right-0 z-20
                           glass-card rounded-xl overflow-hidden shadow-2xl
                           border border-border/60 max-h-60 overflow-y-auto scrollbar-none"
              >
                {loading ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">Loading…</p>
                ) : filteredGroups.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No topics match your search
                  </p>
                ) : (
                  filteredGroups.map(group => (
                    <div key={group.id}>
                      {/* Theme header */}
                      <div
                        className="sticky top-0 px-3 py-1.5 text-[9px] font-semibold
                                   tracking-widest uppercase text-muted-foreground
                                   border-b border-border/30"
                        style={{ background: "rgba(26,31,26,0.95)", backdropFilter: "blur(12px)" }}
                      >
                        {group.icon}&nbsp;{group.name}
                      </div>

                      {/* Topic options */}
                      {group.topics.map(topic => (
                        <button
                          key={topic.id}
                          onClick={() => {
                            setSelectedTopicId(topic.id)
                            setDropdownOpen(false)
                            setSearch("")
                            setConfirmDelete(false)
                            setDeleteSuccess(false)
                            setDeleteError(null)
                          }}
                          className="w-full px-3 py-2.5 text-sm text-left text-foreground
                                     hover:bg-accent/10 transition-colors duration-150 leading-snug"
                        >
                          <span className="line-clamp-2">{topic.question}</span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action: initial clear button */}
          {selectedTopicId && !confirmDelete && !deleteSuccess && (
            <DangerButton onClick={() => setConfirmDelete(true)}>
              Clear ratings
            </DangerButton>
          )}

          {/* Action: inline confirmation */}
          {selectedTopicId && confirmDelete && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground basis-full sm:basis-auto">
                Are you sure? This cannot be undone.
              </p>
              <DangerButton onClick={deleteTopicRatings} disabled={deleting}>
                {deleting ? "Deleting…" : "Confirm"}
              </DangerButton>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground
                           transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Feedback */}
          {deleteSuccess && <StatusDot message="Ratings cleared" />}
          {deleteError   && <StatusDot message={deleteError} variant="error" />}
        </div>

        {/* ── Export ──────────────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 md:p-7">
          <h2 className="font-heading italic text-2xl text-foreground mb-1">Export</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Download all your rated topics and scores as a CSV file.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={downloadCSV}
              disabled={exporting}
              className="glass-button px-5 py-2 rounded-lg text-sm text-accent
                         hover:bg-accent/25 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? "Preparing…" : "Download as CSV"}
            </button>
            {exportError && <StatusDot message={exportError} variant="error" />}
          </div>
        </div>
      </section>

    </div>
  )
}
