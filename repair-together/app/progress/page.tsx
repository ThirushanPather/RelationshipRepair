export const dynamic = "force-dynamic"

import nextDynamic from "next/dynamic"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import type { TimelinePoint, ThemeBarPoint } from "./ProgressCharts"
import { ThemeIcon } from "@/components/icons/ThemeIcons"
import HealthScoreRing from "@/components/progress/HealthScoreRing"
import {
  Star, MessageCircle, Target, BookOpen, Trophy, Link2,
  Shield, TrendingUp, Pencil, LayoutGrid, Lock,
  Heart, Flag,
} from "lucide-react"

// ─── Dynamic import — Recharts must be client-only ────────────────────────────

const ProgressCharts = nextDynamic(() => import("./ProgressCharts"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-6">
      <div className="glass-card rounded-2xl h-85 animate-pulse" />
      <div className="glass-card rounded-2xl h-80 animate-pulse" />
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
  note?: string | null
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

type HealthScoreData = {
  base: number
  coverage: number
  alignment: number
  total: number
}

type MilestoneStatus = {
  id: string
  name: string
  unlocked: boolean
}

type InsightData = {
  type: "strongest" | "growth" | "aligned" | "gap"
  headline: string
  body: string
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
  healthScore: { base: 0, coverage: 0, alignment: 0, total: 0 } as HealthScoreData,
  milestones: [] as MilestoneStatus[],
  insights: [] as InsightData[],
  totalTopicsCount: 0,
  completedTopicsCount: 0,
}

async function getProgressData() {
  try {
  const [themesRes, topicsRes, ratingsRes, settingsRes] = await Promise.all([
    supabase.from("themes").select("id,name,icon,sort_order").order("sort_order"),
    supabase.from("topics").select("id,theme_id,question"),
    supabase
      .from("ratings")
      .select("id,topic_id,person,score,note,rated_at")
      .order("rated_at", { ascending: false }),
    supabase.from("settings").select("key,value"),
  ])

  const themes   = (themesRes.data   ?? []) as ThemeRow[]
  const topics   = (topicsRes.data   ?? []) as TopicRow[]
  const ratings  = (ratingsRes.data  ?? []) as RatingRow[]
  const settings = (settingsRes.data ?? []) as { key: string; value: string }[]

  const nameHim = settings.find(s => s.key === "name_him")?.value ?? "Him"
  const nameHer = settings.find(s => s.key === "name_her")?.value ?? "Her"

  const totalTopicsCount = topics.length

  // ── Section 1: stats ───────────────────────────────────────────────────────

  const completedTopics = topics.filter(topic => {
    const tr = ratings.filter(r => r.topic_id === topic.id)
    return tr.some(r => r.person === "him") && tr.some(r => r.person === "her")
  })
  const ratedTopicsCount = completedTopics.length

  const himRatings = ratings.filter(r => r.person === "him")
  const herRatings = ratings.filter(r => r.person === "her")
  const himAvg = himRatings.length > 0
    ? himRatings.reduce((s, r) => s + r.score, 0) / himRatings.length
    : null
  const herAvg = herRatings.length > 0
    ? herRatings.reduce((s, r) => s + r.score, 0) / herRatings.length
    : null
  const latestDate = ratings.length > 0 ? ratings[0].rated_at : null

  // ── Health score ────────────────────────────────────────────────────────────

  const allAvg = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
    : 0
  const base = ratings.length > 0 ? (allAvg - 1) / 9 * 100 : 0

  const coverageBonus = totalTopicsCount > 0
    ? (ratedTopicsCount / totalTopicsCount) * 10
    : 0

  const topicGaps = completedTopics.map(t => {
    const tr = ratings.filter(r => r.topic_id === t.id)
    const him = tr.find(r => r.person === "him")?.score ?? 0
    const her = tr.find(r => r.person === "her")?.score ?? 0
    return Math.abs(him - her)
  })
  const avgGap = topicGaps.length > 0
    ? topicGaps.reduce((a, b) => a + b, 0) / topicGaps.length
    : 5
  const alignmentBonus = Math.max(0, (5 - Math.min(avgGap, 5)) / 5 * 10)

  const healthScore: HealthScoreData = {
    base:      Math.round(base),
    coverage:  Math.round(coverageBonus),
    alignment: Math.round(alignmentBonus),
    total:     Math.min(100, Math.round(base + coverageBonus + alignmentBonus)),
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  const completedThemeIds = new Set(completedTopics.map(t => t.theme_id))

  const topicRatingCounts = new Map<string, number>()
  for (const r of ratings) {
    const key = `${r.topic_id}:${r.person}`
    topicRatingCounts.set(key, (topicRatingCounts.get(key) ?? 0) + 1)
  }
  const topicsWithNote = new Set(
    ratings.filter(r => r.note && r.note.trim() !== "").map(r => r.topic_id)
  )

  const milestones: MilestoneStatus[] = [
    {
      id: "first-step",
      name: "First Step",
      unlocked: ratedTopicsCount >= 1,
    },
    {
      id: "getting-real",
      name: "Getting Real",
      unlocked: ratedTopicsCount >= 5,
    },
    {
      id: "halfway",
      name: "Halfway There",
      unlocked: totalTopicsCount > 0 && ratedTopicsCount >= totalTopicsCount / 2,
    },
    {
      id: "deep-dive",
      name: "Deep Dive",
      unlocked: themes.some(theme => {
        const themeTopics = topics.filter(t => t.theme_id === theme.id)
        return themeTopics.length > 0 &&
          themeTopics.every(t => completedTopics.some(ct => ct.id === t.id))
      }),
    },
    {
      id: "full-circle",
      name: "Full Circle",
      unlocked: totalTopicsCount > 0 && ratedTopicsCount >= totalTopicsCount,
    },
    {
      id: "in-sync",
      name: "In Sync",
      unlocked: completedTopics.length >= 5 && avgGap <= 1,
    },
    {
      id: "honest-ground",
      name: "Honest Ground",
      unlocked: completedTopics.some(t => {
        const tr = ratings.filter(r => r.topic_id === t.id)
        const him = tr.find(r => r.person === "him")?.score ?? 0
        const her = tr.find(r => r.person === "her")?.score ?? 0
        return him >= 8 && her >= 8
      }),
    },
    {
      id: "growth-mindset",
      name: "Growth Mindset",
      unlocked: Array.from(topicRatingCounts.values()).some(c => c > 1),
    },
    {
      id: "vulnerability",
      name: "Voice of Vulnerability",
      unlocked: topicsWithNote.size >= 3,
    },
    {
      id: "all-in",
      name: "All In",
      unlocked: themes.length > 0 && themes.every(t => completedThemeIds.has(t.id)),
    },
  ]

  // ── Insights ────────────────────────────────────────────────────────────────

  const themeInsights = themes.map(theme => {
    const themeCompleted = completedTopics.filter(t => t.theme_id === theme.id)
    if (themeCompleted.length === 0) return { name: theme.name, avgScore: 0, count: 0 }
    const scores = themeCompleted.flatMap(t =>
      ratings.filter(r => r.topic_id === t.id).map(r => r.score)
    )
    return {
      name: theme.name,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: themeCompleted.length,
    }
  }).filter(t => t.count > 0)

  const insights: InsightData[] = []

  if (themeInsights.length >= 2) {
    const sorted = [...themeInsights].sort((a, b) => b.avgScore - a.avgScore)
    const strongest = sorted[0]
    insights.push({
      type: "strongest",
      headline: `${strongest.name} is your strongest area`,
      body: `Your average combined score here is ${strongest.avgScore.toFixed(1)} out of 10.`,
    })
    const weakest = sorted[sorted.length - 1]
    insights.push({
      type: "growth",
      headline: `${weakest.name} has room to grow`,
      body: `Your average score here is ${weakest.avgScore.toFixed(1)} — your lowest so far.`,
    })
  }

  if (completedTopics.length >= 3) {
    const withGaps = completedTopics.map(t => {
      const tr = ratings.filter(r => r.topic_id === t.id)
      const him = tr.find(r => r.person === "him")?.score ?? 0
      const her = tr.find(r => r.person === "her")?.score ?? 0
      return { topic: t, himScore: him, herScore: her, gap: Math.abs(him - her) }
    })

    const mostAligned = [...withGaps].sort((a, b) => a.gap - b.gap)[0]
    const alignedWords = mostAligned.topic.question.split(" ")
    const alignedTrunc = alignedWords.slice(0, 6).join(" ") +
      (alignedWords.length > 6 ? "..." : "")
    insights.push({
      type: "aligned",
      headline: `You're most in sync on "${alignedTrunc}"`,
      body: `Your scores were only ${mostAligned.gap} point${mostAligned.gap === 1 ? "" : "s"} apart on this one.`,
    })

    const bigGap = withGaps.filter(x => x.gap >= 3).sort((a, b) => b.gap - a.gap)[0]
    if (bigGap) {
      const gapWords = bigGap.topic.question.split(" ")
      const gapTrunc = gapWords.slice(0, 6).join(" ") +
        (gapWords.length > 6 ? "..." : "")
      insights.push({
        type: "gap",
        headline: `Worth revisiting: "${gapTrunc}"`,
        body: `${nameHim} scored ${bigGap.himScore}, ${nameHer} scored ${bigGap.herScore} — a ${bigGap.gap} point difference.`,
      })
    }
  }

  // ── Section 2: line chart data ─────────────────────────────────────────────

  const byDate: Record<string, { him: number[]; her: number[] }> = {}
  for (const r of [...ratings].sort((a, b) => a.rated_at.localeCompare(b.rated_at))) {
    const day = r.rated_at.slice(0, 10)
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
      label:    shortName,
      fullName: theme.name,
      avgScore: parseFloat(avgScore.toFixed(1)),
    }
  })

  // ── Section 4: topic detail rows ───────────────────────────────────────────

  const topicRows: TopicDetailRow[] = topics.flatMap(topic => {
    const tr = ratings.filter(r => r.topic_id === topic.id)
    if (tr.length === 0) return []

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
      lastUpdated: tr[0].rated_at,
    }]
  }).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))

  // ── Section 5: session timeline ────────────────────────────────────────────

  const seenKeys = new Set<string>()
  const sessionEntries: SessionEntry[] = []

  for (const r of ratings) {
    const key = `${r.topic_id}:${r.rated_at}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const paired = ratings.filter(x => x.topic_id === r.topic_id && x.rated_at === r.rated_at)
    const him    = paired.find(x => x.person === "him")
    const her    = paired.find(x => x.person === "her")
    const topic  = topics.find(t => t.id === r.topic_id)
    const theme  = themes.find(t => t.id === topic?.theme_id)

    sessionEntries.push({
      key,
      ratedAt:   r.rated_at,
      themeIcon: theme?.icon ?? "",
      themeName: theme?.name ?? "",
      question:  topic?.question ?? "",
      himScore:  him?.score ?? null,
      herScore:  her?.score ?? null,
    })
  }

  return {
    nameHim, nameHer,
    ratedTopicsCount,
    himAvg, herAvg, latestDate,
    timelineData, themeBarData,
    topicRows, sessionEntries,
    healthScore,
    milestones,
    insights,
    totalTopicsCount,
    completedTopicsCount: ratedTopicsCount,
  }
  } catch (err) {
    console.error("Failed to load progress data:", err)
    return EMPTY_DATA
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMilestoneIcon(id: string) {
  const p = { size: 20, strokeWidth: 1.5 }
  switch (id) {
    case "first-step":    return <Star {...p} />
    case "getting-real":  return <MessageCircle {...p} />
    case "halfway":       return <Target {...p} />
    case "deep-dive":     return <BookOpen {...p} />
    case "full-circle":   return <Trophy {...p} />
    case "in-sync":       return <Link2 {...p} />
    case "honest-ground": return <Shield {...p} />
    case "growth-mindset":return <TrendingUp {...p} />
    case "vulnerability": return <Pencil {...p} />
    case "all-in":        return <LayoutGrid {...p} />
    default:              return <Star {...p} />
  }
}

function InsightIcon({ type }: { type: InsightData["type"] }) {
  const p = { size: 18, strokeWidth: 1.5 }
  switch (type) {
    case "strongest": return <TrendingUp {...p} className="text-accent" />
    case "growth":    return <Target {...p} className="text-muted-foreground" />
    case "aligned":   return <Heart {...p} className="text-gold" />
    case "gap":       return <Flag {...p} style={{ color: "#c47a6a" }} />
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

function ScorePill({ score, color }: { score: number | null; color: "green" | "gold" }) {
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
    healthScore,
    milestones,
    insights,
    completedTopicsCount,
  } = await getProgressData()

  const hasAnyData = ratedTopicsCount > 0
  const unlockedCount = milestones.filter(m => m.unlocked).length
  const sortedMilestones = [...milestones].sort(
    (a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0)
  )

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

      {/* ── Health score ──────────────────────────────────────────────────── */}
      <section className="flex justify-center">
        <div className="w-full md:max-w-72">
          <HealthScoreRing {...healthScore} />
        </div>
      </section>

      {/* ── Milestone strip ───────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1">
          Milestones
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {unlockedCount} of {milestones.length} unlocked
        </p>

        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {sortedMilestones.map(m => {
              const unlocked = m.unlocked
              return (
                <div
                  key={m.id}
                  className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 border"
                  style={{
                    width: 96,
                    height: 96,
                    flexShrink: 0,
                    background: unlocked
                      ? "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))"
                      : "color-mix(in srgb, var(--color-surface2) 50%, transparent)",
                    borderColor: unlocked
                      ? "color-mix(in srgb, var(--color-accent) 30%, transparent)"
                      : "color-mix(in srgb, var(--color-border) 60%, transparent)",
                  }}
                >
                  {/* Icon */}
                  <span style={{ color: unlocked ? "var(--color-accent)" : "var(--color-muted-foreground)", opacity: unlocked ? 1 : 0.5 }}>
                    {getMilestoneIcon(m.id)}
                  </span>

                  {/* Name */}
                  <p
                    className="text-center leading-tight"
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: unlocked ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    {m.name}
                  </p>

                  {/* Lock overlay */}
                  {!unlocked && (
                    <span
                      className="absolute top-1.5 right-1.5"
                      style={{ color: "var(--color-muted-foreground)", opacity: 0.4 }}
                    >
                      <Lock size={10} strokeWidth={2} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

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
            value={latestDate ? format(new Date(latestDate), "MMM d") : "—"}
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

      {/* ── Insights ──────────────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-4">
          Insights
        </p>

        {completedTopicsCount < 3 ? (
          <div className="glass-card rounded-2xl px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Keep going — insights will appear once you&apos;ve explored more topics together.
            </p>
          </div>
        ) : insights.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map(insight => (
              <div key={insight.type} className="glass-card rounded-xl p-4 flex gap-3 items-start">
                <span className="shrink-0 mt-0.5">
                  <InsightIcon type={insight.type} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1 leading-snug">
                    {insight.headline}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
                      ...(isHighlighted ? { background: "rgba(201,169,110,0.07)" } : {}),
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ThemeIcon themeName={row.themeName} size={16} className="shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate hidden md:block">
                        {row.themeName.split(" & ")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {row.themeName}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug line-clamp-2 md:pr-6">
                      {row.question}
                    </p>
                    <div className="flex items-center gap-3 md:justify-center">
                      <span className="text-xs text-muted-foreground md:hidden">{nameHim}</span>
                      <ScorePill score={row.himScore} color="green" />
                    </div>
                    <div className="flex items-center gap-3 md:justify-center">
                      <span className="text-xs text-muted-foreground md:hidden">{nameHer}</span>
                      <ScorePill score={row.herScore} color="gold" />
                    </div>
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
            <div
              className="absolute left-2.75 top-3 bottom-3 w-px bg-border/50 hidden md:block"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-3">
              {sessionEntries.map(entry => (
                <div key={entry.key} className="flex items-start gap-4 md:gap-5">
                  <div
                    className="hidden md:flex shrink-0 mt-4 w-5.75 h-5.75 rounded-full
                               bg-accent/15 border border-accent/30
                               items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/80 block" />
                  </div>

                  <div className="glass-card rounded-xl px-4 py-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ThemeIcon themeName={entry.themeName} size={16} className="shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.themeName}
                        </span>
                      </div>
                      <time dateTime={entry.ratedAt} className="text-xs text-muted-foreground shrink-0">
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
