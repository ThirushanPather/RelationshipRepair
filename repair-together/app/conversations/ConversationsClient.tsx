"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ThemeRow = {
  id: string
  name: string
  icon: string
  description: string
  sort_order: number
}

type TopicRow = {
  id: string
  theme_id: string
  question: string
  difficulty: 1 | 2 | 3
  sort_order: number
}

type TopicState = {
  himScore: number
  herScore: number
  himNote: string
  herNote: string
  saving: boolean
  lastSavedAt: string | null
  // Completion tracking
  completed: boolean
  himRatingId: string | null
  herRatingId: string | null
  // Revisit mode
  revisiting: boolean
  // Snapshot used to revert on Cancel
  savedHimScore: number
  savedHerScore: number
  savedHimNote: string
  savedHerNote: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_META = {
  1: { label: "Easy",   color: "#8aab7a" },
  2: { label: "Medium", color: "#c9a96e" },
  3: { label: "Hard",   color: "#c47a6a" },
} as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sliderFillStyle(value: number): React.CSSProperties {
  const pct = ((value - 1) / 9) * 100
  return {
    background: `linear-gradient(to right, #8aab7a ${pct}%, rgba(42,48,42,0.6) ${pct}%)`,
  }
}

// ─── Slider row ────────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  note,
  onValueChange,
  onNoteChange,
}: {
  label: string
  value: number
  note: string
  onValueChange: (v: number) => void
  onNoteChange: (n: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground shrink-0 w-14 truncate">{label}</span>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={e => onValueChange(Number(e.target.value))}
          className="rating-slider flex-1"
          style={sliderFillStyle(value)}
        />
        <span className="text-sm font-semibold text-accent tabular-nums w-4 text-right shrink-0">
          {value}
        </span>
      </div>
      <input
        type="text"
        value={note}
        onChange={e => onNoteChange(e.target.value)}
        placeholder="Add a note…"
        className="glass-input w-full rounded-lg px-3 py-2 text-sm text-foreground
                   placeholder:text-muted-foreground/40
                   focus:ring-1 focus:ring-accent/30 transition-all"
      />
    </div>
  )
}

// ─── Topic card ────────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  state,
  nameHim,
  nameHer,
  onUpdate,
  onSave,
  onCancel,
}: {
  topic: TopicRow
  state: TopicState
  nameHim: string
  nameHer: string
  onUpdate: (patch: Partial<TopicState>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const { label, color } = DIFFICULTY_META[topic.difficulty]
  const showSummary = state.completed && !state.revisiting

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6">
      {/* Question + difficulty badge */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {state.completed && (
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 block"
              style={{ background: "#8aab7a" }}
            />
          )}
          <p
            className={`font-heading italic text-xl md:text-[1.4rem] leading-snug ${
              state.completed ? "text-foreground/60" : "text-foreground"
            }`}
          >
            {topic.question}
          </p>
        </div>
        <span
          className="shrink-0 text-[9px] font-semibold tracking-widest uppercase
                     px-2.5 py-1 rounded-full mt-0.5 border whitespace-nowrap"
          style={{
            color,
            borderColor: `${color}40`,
            background: `${color}14`,
          }}
        >
          {label}
        </span>
      </div>

      {/* ── Summary view (completed & not revisiting) ───────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: showSummary ? "320px" : "0px",
          opacity: showSummary ? 1 : 0,
        }}
      >
        <div className="space-y-4 pb-1">
          {/* Score pair */}
          <div className="flex items-center gap-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">{nameHim}</span>
              <span className="text-xl font-semibold text-accent tabular-nums">
                {state.savedHimScore}
              </span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">{nameHer}</span>
              <span className="text-xl font-semibold text-gold tabular-nums">
                {state.savedHerScore}
              </span>
            </div>
          </div>

          {/* Notes (if any) */}
          {(state.savedHimNote || state.savedHerNote) && (
            <div className="space-y-1.5">
              {state.savedHimNote && (
                <p className="text-sm italic text-muted-foreground leading-snug">
                  <span className="not-italic text-[11px] text-muted-foreground/60 uppercase tracking-wide mr-1">
                    {nameHim}:
                  </span>
                  {state.savedHimNote}
                </p>
              )}
              {state.savedHerNote && (
                <p className="text-sm italic text-muted-foreground leading-snug">
                  <span className="not-italic text-[11px] text-muted-foreground/60 uppercase tracking-wide mr-1">
                    {nameHer}:
                  </span>
                  {state.savedHerNote}
                </p>
              )}
            </div>
          )}

          {/* Last discussed date */}
          {state.lastSavedAt && (
            <p className="text-xs text-muted-foreground/70">
              Last discussed {format(new Date(state.lastSavedAt), "d MMMM yyyy")}
            </p>
          )}

          {/* Revisit button */}
          <button
            onClick={() => onUpdate({ revisiting: true })}
            className="w-full min-h-12 px-5 py-3 rounded-xl text-sm text-accent
                       glass-button hover:bg-accent/25 transition-colors duration-200"
          >
            Revisit this conversation
          </button>
        </div>
      </div>

      {/* ── Edit view (not completed, or revisiting) ─────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: !showSummary ? "480px" : "0px",
          opacity: !showSummary ? 1 : 0,
        }}
      >
        <div>
          {/* Sliders */}
          <div className="space-y-4 mb-5">
            <SliderRow
              label={nameHim}
              value={state.himScore}
              note={state.himNote}
              onValueChange={v => onUpdate({ himScore: v })}
              onNoteChange={n => onUpdate({ himNote: n })}
            />
            <SliderRow
              label={nameHer}
              value={state.herScore}
              note={state.herNote}
              onValueChange={v => onUpdate({ herScore: v })}
              onNoteChange={n => onUpdate({ herNote: n })}
            />
          </div>

          {/* Save row */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={onSave}
              disabled={state.saving}
              className="glass-button px-5 py-2 rounded-lg text-sm text-accent
                         hover:bg-accent/25 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.saving ? "Saving…" : state.revisiting ? "Update scores" : "Save"}
            </button>
            {state.revisiting && (
              <button
                onClick={onCancel}
                disabled={state.saving}
                className="min-h-11 px-2 text-xs text-muted-foreground
                           hover:text-foreground transition-colors duration-150
                           disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:h-dvh md:overflow-hidden">
      <aside className="hidden md:flex flex-col w-55 glass-nav border-r border-border/50 shrink-0 p-3 gap-1.5 pt-6">
        <div className="h-3 w-16 rounded bg-white/10 animate-pulse mx-2 mb-3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </aside>
      <div className="flex-1 px-4 md:px-10 py-6 md:py-10 flex flex-col gap-4">
        <div className="h-9 w-52 rounded-lg bg-white/5 animate-pulse mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl h-44 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ConversationsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [themes, setThemes] = useState<ThemeRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [nameHim, setNameHim] = useState("Him")
  const [nameHer, setNameHer] = useState("Her")
  const [topicStates, setTopicStates] = useState<Record<string, TopicState>>({})
  const [loading, setLoading] = useState(true)

  const themeParam = searchParams.get("theme")
  const activeThemeId = themeParam ?? themes[0]?.id ?? ""

  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
      const [themesRes, topicsRes, ratingsRes, settingsRes] = await Promise.all([
        supabase.from("themes").select("id,name,icon,description,sort_order").order("sort_order"),
        supabase.from("topics").select("id,theme_id,question,difficulty,sort_order").order("sort_order"),
        supabase
          .from("ratings")
          .select("id,topic_id,person,score,note,rated_at")
          .order("rated_at", { ascending: false }),
        supabase.from("settings").select("key,value"),
      ])

      const themesData = (themesRes.data ?? []) as ThemeRow[]
      const topicsData = (topicsRes.data ?? []) as TopicRow[]
      const ratingsData = (ratingsRes.data ?? []) as {
        id: string
        topic_id: string
        person: "him" | "her"
        score: number
        note: string | null
        rated_at: string
      }[]
      const settingsData = (settingsRes.data ?? []) as { key: string; value: string }[]

      setThemes(themesData)
      setTopics(topicsData)
      setNameHim(settingsData.find(s => s.key === "name_him")?.value ?? "Him")
      setNameHer(settingsData.find(s => s.key === "name_her")?.value ?? "Her")

      // Build topic state — ratingsData sorted desc by rated_at, first match = most recent
      const stateMap: Record<string, TopicState> = {}
      for (const topic of topicsData) {
        const tr = ratingsData.filter(r => r.topic_id === topic.id)
        const him = tr.find(r => r.person === "him")
        const her = tr.find(r => r.person === "her")
        const completed = !!(him && her)
        const himScore = him?.score ?? 5
        const herScore = her?.score ?? 5
        const himNote = him?.note ?? ""
        const herNote = her?.note ?? ""
        stateMap[topic.id] = {
          himScore,
          herScore,
          himNote,
          herNote,
          saving: false,
          lastSavedAt: tr[0]?.rated_at ?? null,
          completed,
          himRatingId: him?.id ?? null,
          herRatingId: her?.id ?? null,
          revisiting: false,
          savedHimScore: himScore,
          savedHerScore: herScore,
          savedHimNote: himNote,
          savedHerNote: herNote,
        }
      }
      setTopicStates(stateMap)
      setLoading(false)
      } catch (err) {
        console.error("Failed to load conversations data:", err)
        setLoading(false)
      }
    }
    load()
  }, [])

  // Default to first theme when none in URL
  useEffect(() => {
    if (themes.length > 0 && !themeParam) {
      router.replace(`/conversations?theme=${themes[0].id}`)
    }
  }, [themes, themeParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived ────────────────────────────────────────────────────────────────

  const activeTheme = themes.find(t => t.id === activeThemeId)
  const activeTopics = topics.filter(t => t.theme_id === activeThemeId)
  const grouped = {
    1: activeTopics.filter(t => t.difficulty === 1),
    2: activeTopics.filter(t => t.difficulty === 2),
    3: activeTopics.filter(t => t.difficulty === 3),
  } as const

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function selectTheme(id: string) {
    router.push(`/conversations?theme=${id}`, { scroll: false })
  }

  function patchTopic(topicId: string, patch: Partial<TopicState>) {
    setTopicStates(prev => ({
      ...prev,
      [topicId]: { ...prev[topicId], ...patch },
    }))
  }

  function cancelRevisit(topicId: string) {
    const s = topicStates[topicId]
    if (!s) return
    patchTopic(topicId, {
      revisiting: false,
      himScore: s.savedHimScore,
      herScore: s.savedHerScore,
      himNote: s.savedHimNote,
      herNote: s.savedHerNote,
    })
  }

  async function saveTopic(topicId: string) {
    const s = topicStates[topicId]
    if (!s || s.saving) return
    patchTopic(topicId, { saving: true })

    const now = new Date().toISOString()

    if (s.completed && s.himRatingId && s.herRatingId) {
      // Revisit: update existing rating rows in place
      const [r1, r2] = await Promise.all([
        supabase
          .from("ratings")
          .update({ score: s.himScore, note: s.himNote || null, rated_at: now })
          .eq("id", s.himRatingId),
        supabase
          .from("ratings")
          .update({ score: s.herScore, note: s.herNote || null, rated_at: now })
          .eq("id", s.herRatingId),
      ])
      const error = r1.error ?? r2.error
      if (error) {
        patchTopic(topicId, { saving: false })
      } else {
        patchTopic(topicId, {
          saving: false,
          lastSavedAt: now,
          revisiting: false,
          savedHimScore: s.himScore,
          savedHerScore: s.herScore,
          savedHimNote: s.himNote,
          savedHerNote: s.herNote,
        })
      }
    } else {
      // First-time save: insert new rows and capture their IDs
      const { data, error } = await supabase
        .from("ratings")
        .insert([
          { topic_id: topicId, person: "him", score: s.himScore, note: s.himNote || null, rated_at: now },
          { topic_id: topicId, person: "her", score: s.herScore, note: s.herNote || null, rated_at: now },
        ])
        .select("id,person")

      if (error || !data) {
        patchTopic(topicId, { saving: false })
      } else {
        const rows = data as { id: string; person: string }[]
        patchTopic(topicId, {
          saving: false,
          lastSavedAt: now,
          completed: true,
          himRatingId: rows.find(r => r.person === "him")?.id ?? null,
          herRatingId: rows.find(r => r.person === "her")?.id ?? null,
          savedHimScore: s.himScore,
          savedHerScore: s.herScore,
          savedHimNote: s.himNote,
          savedHerNote: s.herNote,
        })
      }
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />

  return (
    <div className="flex flex-col md:flex-row md:h-dvh md:overflow-hidden">

      {/* ── Left: theme list (desktop only) ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-55 glass-nav border-r border-border/50
                   shrink-0 overflow-y-auto py-6 px-3"
      >
        <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-4 px-2">
          Themes
        </p>
        <nav className="flex flex-col gap-0.5">
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left w-full",
                  "transition-all duration-200",
                  isActive
                    ? "glass-card text-accent border border-accent/20 bg-accent/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/4",
                ].join(" ")}
              >
                <span className="text-base leading-none shrink-0">{theme.icon}</span>
                <span className="leading-snug">{theme.name}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Right: topics area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:overflow-hidden">

        {/* Mobile: horizontal theme tabs */}
        <div
          className="md:hidden flex gap-2 overflow-x-auto scrollbar-none px-4 py-3
                     glass-nav border-b border-border/50 shrink-0 sticky top-0 z-10"
        >
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={[
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap shrink-0 border",
                  "transition-all duration-200",
                  isActive
                    ? "bg-accent/20 text-accent border-accent/30"
                    : "text-muted-foreground border-border/50 bg-white/5",
                ].join(" ")}
              >
                <span>{theme.icon}</span>
                <span>{theme.name}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable topic list */}
        <div className="md:flex-1 md:overflow-y-auto px-4 md:px-10 py-6 md:py-10">

          {/* Theme header */}
          {activeTheme && (
            <header className="mb-8 md:mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl md:text-3xl" aria-hidden="true">
                  {activeTheme.icon}
                </span>
                <h1 className="font-heading italic text-3xl md:text-[2.25rem] text-foreground leading-tight">
                  {activeTheme.name}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeTheme.description}
              </p>
            </header>
          )}

          {/* Empty state — DB not seeded */}
          {themes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <p className="text-gold/40 text-3xl" aria-hidden="true">✦</p>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                No conversations yet. Make sure the database has been seeded by hitting{" "}
                <code className="text-accent/80 text-xs">/api/seed</code>.
              </p>
            </div>
          )}

          {/* Difficulty sections */}
          {([1, 2, 3] as const).map(diff => {
            const items = grouped[diff]
            if (items.length === 0) return null
            const { label, color } = DIFFICULTY_META[diff]
            return (
              <section key={diff} className="mb-10 last:mb-6">
                {/* Section divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-px flex-1 rounded-full"
                    style={{ background: `${color}1a` }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                    style={{ color }}
                  >
                    {label}
                  </span>
                  <div
                    className="h-px flex-1 rounded-full"
                    style={{ background: `${color}1a` }}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {items.map(topic => {
                    const state = topicStates[topic.id] ?? {
                      himScore: 5,
                      herScore: 5,
                      himNote: "",
                      herNote: "",
                      saving: false,
                      lastSavedAt: null,
                      completed: false,
                      himRatingId: null,
                      herRatingId: null,
                      revisiting: false,
                      savedHimScore: 5,
                      savedHerScore: 5,
                      savedHimNote: "",
                      savedHerNote: "",
                    }
                    return (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        state={state}
                        nameHim={nameHim}
                        nameHer={nameHer}
                        onUpdate={patch => patchTopic(topic.id, patch)}
                        onSave={() => saveTopic(topic.id)}
                        onCancel={() => cancelRevisit(topic.id)}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
