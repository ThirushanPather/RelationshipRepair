export const dynamic = "force-dynamic"

import nextDynamic from "next/dynamic"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import type { TimelinePoint, ThemeBarPoint } from "./ProgressCharts"

// ─── Dynamic import — Recharts must be client-only ────────────────────────────

const ProgressCharts = nextDynamic(() => import("./ProgressCharts"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-6">
      <div className="glass-card rounded-2xl h-[340px] animate-pulse" />
      <div className="glass-card rounded-2xl h-[320px] animate-pulse" />
    </div>
  ),
})

// ─── DB row types ─────────────────────────────────────────────────────────────

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
}

type RatingRow = {
  id: string
  topic_id: string
  person: "him" | "her"
  score: number
  rated_at: string
}

// ─── Computed types ───────────────────────────────────────────────────────────

type TopicDetailRow = {
  id: string
  question: string
  themeIcon: string
  themeName: string
  himScore: number | null
  herScore: number | null
  gap: number | null
  lastUpdated: string
}

type SessionEntry = {
  key: string
  ratedAt: string
  themeIcon: string
  themeName: string
  question: string
  himScore: number | null
  herScore: number | null
}

// ─── Data fetching ────────────────────────────────────────────────────────────

const EMPTY_DATA = {
  nameHim: "Him", nameHer: "Her",
  ratedTopicsCount: 0,
  himAvg: null as number | null,
  herAvg: null as number | null,
  latestDate: null as string | null,
  timelineData: [] as TimelinePoint[],
  themeBarData: [] as ThemeBarPoint[],
  topicRows: [] as TopicDetailRow[],
  sessionEntries: [] as SessionEntry[],
}

async function getProgressData() {
  try {
  const [themesRes, topicsRes, ratingsRes, settingsRes] = await Promise.all([
    supabase.from("themes").select("id,name,icon,sort_order").order("sort_order"),
    supabase.from("topics").select("id,theme_id,question"),
    supabase
      .from("ratings")
      .select("id,topic_id,person,score,rated_at")
      .order("rated_at", { ascending: false }),
    supabase.from("settings").select("key,value"),
  ])

  const themes   = (themesRes.data   ?? []) as ThemeRow[]
  const topics   = (topicsRes.data   ?? []) as TopicRow[]
  const ratings  = (ratingsRes.data  ?? []) as RatingRow[]
  const settings = (settingsRes.data ?? []) as { key: string; value: string }[]

  const nameHim = settings.find(s => s.key === "name_him")?.value ?? "Him"
  const nameHer = settings.find(s => s.key === "name_her")?.value ?? "Her"

  // ── Section 1: stats ───────────────────────────────────────────────────────

  const ratedTopicsCount = topics.filter(topic => {
    const tr = ratings.filter(r => r.topic_id === topic.id)
    return tr.some(r => r.person === "him") && tr.some(r => r.person === "her")
  }).length

  const himRatings = ratings.filter(r => r.person === "him")
  const herRatings = ratings.filter(r => r.person === "her")
  const himAvg = himRatings.length > 0
    ? himRatings.reduce((s, r) => s + r.score, 0) / himRatings.length
    : null
  const herAvg = herRatings.length > 0
    ? herRatings.reduce((s, r) => s + r.score, 0) / herRatings.length
    : null
  // ratings is already sorted desc — first item is the latest
  const latestDate = ratings.length > 0 ? ratings[0].rated_at : null

  // ── Section 2: line chart data ─────────────────────────────────────────────
  // Group by calendar day, compute per-person daily averages

  const byDate: Record<string, { him: number[]; her: number[] }> = {}
  for (const r of [...ratings].sort((a, b) => a.rated_at.localeCompare(b.rated_at))) {
    const day = r.rated_at.slice(0, 10) // "YYYY-MM-DD"
    if (!byDate[day]) byDate[day] = { him: [], her: [] }
    byDate[day][r.person].push(r.score)
  }

  const timelineData: TimelinePoint[] = Object.entries(byDate).map(([day, { him, her }]) => ({
    date: format(new Date(day + "T12:00:00"), "MMM d"),
    him: him.length > 0 ? him.reduce((a, b) => a + b) / him.length : null,
    her: her.length > 0 ? her.reduce((a, b) => a + b) / her.length : null,
  }))

  // ── Section 3: theme bar data ──────────────────────────────────────────────

  const themeBarData: ThemeBarPoint[] = themes.map(theme => {
    const themeTopicIds = topics.filter(t => t.theme_id === theme.id).map(t => t.id)
    const themeRatings  = ratings.filter(r => themeTopicIds.includes(r.topic_id))
    const avgScore = themeRatings.length > 0
      ? themeRatings.reduce((s, r) => s + r.score, 0) / themeRatings.length
      : 0
    const shortName = theme.name.includes(" & ")
      ? theme.name.split(" & ")[0]
      : theme.name.split(" ").slice(0, 2).join(" ")
    return {
      label:     `${theme.icon} ${shortName}`,
      fullName:  theme.name,
      avgScore:  parseFloat(avgScore.toFixed(1)),
    }
  })

  // ── Section 4: topic detail rows ───────────────────────────────────────────

  const topicRows: TopicDetailRow[] = topics.flatMap(topic => {
    const tr = ratings.filter(r => r.topic_id === topic.id)
    if (tr.length === 0) return []

    // Most-recent rating per person (tr is already desc by rated_at globally;
    // filter preserves order, so first match = most recent for each person)
    const himLatest = tr.find(r => r.person === "him")
    const herLatest = tr.find(r => r.person === "her")
    const himScore  = himLatest?.score ?? null
    const herScore  = herLatest?.score ?? null
    const gap       = himScore !== null && herScore !== null
      ? Math.abs(himScore - herScore)
      : null
    const theme     = themes.find(t => t.id === topic.theme_id)

    return [{
      id:          topic.id,
      question:    topic.question,
      themeIcon:   theme?.icon ?? "",
      themeName:   theme?.name ?? "",
      himScore,
      herScore,
      gap,
      lastUpdated: tr[0].rated_at, // tr[0] = most recent overall
    }]
  }).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))

  // ── Section 5: session timeline ────────────────────────────────────────────
  // Each save = 2 rows with identical topic_id + rated_at — deduplicate into one entry

  const seenKeys = new Set<string>()
  const sessionEntries: SessionEntry[] = []

  for (const r of ratings) { // already sorted desc
    const key = `${r.topic_id}:${r.rated_at}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const paired  = ratings.filter(x => x.topic_id === r.topic_id && x.rated_at === r.rated_at)
    const him     = paired.find(x => x.person === "him")
    const her     = paired.find(x => x.person === "her")
    const topic   = topics.find(t => t.id === r.topic_id)
    const theme   = themes.find(t => t.id === topic?.theme_id)

    sessionEntries.push({
      key,
      ratedAt:    r.rated_at,
      themeIcon:  theme?.icon ?? "",
      themeName:  theme?.name ?? "",
      question:   topic?.question ?? "",
      himScore:   him?.score ?? null,
      herScore:   her?.score ?? null,
    })
  }

  return {
    nameHim, nameHer,
    ratedTopicsCount,
    himAvg, herAvg, latestDate,
    timelineData, themeBarData,
    topicRows, sessionEntries,
  }
  } catch (err) {
    console.error("Failed to load progress data:", err)
    return EMPTY_DATA
  }
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-1.5">
      <p className="text-2xl md:text-3xl font-semibold text-foreground tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs text-muted-foreground leading-snug">{label}</p>
    </div>
  )
}

// ─── Score pill ───────────────────────────────────────────────────────────────

function ScorePill({
  score,
  color,
}: {
  score: number | null
  color: "green" | "gold"
}) {
  const base = color === "green"
    ? "bg-accent/10 text-accent border-accent/20"
    : "bg-gold/10 text-gold border-gold/20"

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-semibold tabular-nums ${base}`}
    >
      {score ?? "—"}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const {
    nameHim, nameHer,
    ratedTopicsCount,
    himAvg, herAvg, latestDate,
    timelineData, themeBarData,
    topicRows, sessionEntries,
  } = await getProgressData()

  const hasAnyData = ratedTopicsCount > 0

  return (
    <div className="max-w-4xl mx-auto px-5 py-10 md:py-14 space-y-10">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header>
        <h1 className="font-heading italic text-5xl md:text-[3.5rem] text-gold leading-none mb-2 tracking-tight">
          How we&apos;re doing
        </h1>
        <p className="text-muted-foreground text-base">
          A record of every conversation, score, and shift
        </p>
      </header>

      {/* ── Section 1: Summary stats ──────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          At a glance
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Topics explored together"
            value={hasAnyData ? String(ratedTopicsCount) : "—"}
          />
          <StatCard
            label={`${nameHim}'s average score`}
            value={himAvg !== null ? himAvg.toFixed(1) : "—"}
          />
          <StatCard
            label={`${nameHer}'s average score`}
            value={herAvg !== null ? herAvg.toFixed(1) : "—"}
          />
          <StatCard
            label="Most recent session"
            value={latestDate
              ? format(new Date(latestDate), "MMM d")
              : "—"}
          />
        </div>
      </section>

      {/* ── Sections 2 & 3: Charts (client-only via dynamic import) ──────── */}
      <section>
        <ProgressCharts
          timelineData={timelineData}
          themeBarData={themeBarData}
          nameHim={nameHim}
          nameHer={nameHer}
        />
      </section>

      {/* ── Section 4: Topic detail table ────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Topic by topic
        </p>

        {topicRows.length === 0 ? (
          <div className="glass-card rounded-2xl px-6 py-12 text-center">
            <p className="text-gold/50 text-2xl mb-3" aria-hidden="true">✦</p>
            <p className="text-sm text-muted-foreground">
              Once you start rating topics, they&apos;ll appear here
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div
              className="hidden md:grid px-5 py-3 text-[10px] font-semibold tracking-widest
                         uppercase text-muted-foreground border-b border-border/50"
              style={{ gridTemplateColumns: "1fr 2fr auto auto auto" }}
            >
              <span>Theme</span>
              <span>Question</span>
              <span className="text-center">{nameHim}</span>
              <span className="text-center">{nameHer}</span>
              <span className="text-center">Gap</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/40">
              {topicRows.map(row => {
                const isHighlighted = row.gap !== null && row.gap >= 3
                return (
                  <div
                    key={row.id}
                    className="flex flex-col md:grid px-5 py-4 gap-2 md:gap-0 md:items-center
                               transition-colors duration-200"
                    style={{
                      gridTemplateColumns: "1fr 2fr auto auto auto",
                      ...(isHighlighted
                        ? { background: "rgba(201,169,110,0.07)" }
                        : {}),
                    }}
                  >
                    {/* Theme */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{row.themeIcon}</span>
                      <span className="text-xs text-muted-foreground truncate hidden md:block">
                        {row.themeName.split(" & ")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {row.themeName}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-sm text-foreground leading-snug line-clamp-2 md:pr-6">
                      {row.question}
                    </p>

                    {/* Scores */}
                    <div className="flex items-center gap-3 md:justify-center">
                      <span className="text-xs text-muted-foreground md:hidden">{nameHim}</span>
                      <ScorePill score={row.himScore} color="green" />
                    </div>
                    <div className="flex items-center gap-3 md:justify-center">
                      <span className="text-xs text-muted-foreground md:hidden">{nameHer}</span>
                      <ScorePill score={row.herScore} color="gold" />
                    </div>

                    {/* Gap */}
                    <div className="flex items-center gap-2 md:justify-center">
                      <span className="text-xs text-muted-foreground md:hidden">Gap</span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isHighlighted ? "text-gold" : "text-muted-foreground"
                        }`}
                      >
                        {row.gap !== null ? row.gap : "—"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Section 5: Session timeline ──────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Your journey so far
        </p>

        {sessionEntries.length === 0 ? (
          <div className="glass-card rounded-2xl px-6 py-12 text-center">
            <p className="text-gold/50 text-2xl mb-3" aria-hidden="true">✦</p>
            <p className="text-sm text-muted-foreground">
              Your first conversation will appear here
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[11px] top-3 bottom-3 w-px bg-border/50 hidden md:block"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-3">
              {sessionEntries.map(entry => (
                <div key={entry.key} className="flex items-start gap-4 md:gap-5">
                  {/* Dot */}
                  <div
                    className="hidden md:flex shrink-0 mt-4 w-[23px] h-[23px] rounded-full
                               bg-accent/15 border border-accent/30
                               items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/80 block" />
                  </div>

                  {/* Card */}
                  <div className="glass-card rounded-xl px-4 py-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none shrink-0">{entry.themeIcon}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.themeName}
                        </span>
                      </div>
                      <time
                        dateTime={entry.ratedAt}
                        className="text-xs text-muted-foreground shrink-0"
                      >
                        {format(new Date(entry.ratedAt), "MMM d, yyyy")}
                      </time>
                    </div>

                    <p className="text-sm text-foreground leading-snug line-clamp-2 mb-3">
                      {entry.question}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{nameHim}</span>
                        <ScorePill score={entry.himScore} color="green" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{nameHer}</span>
                        <ScorePill score={entry.herScore} color="gold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
