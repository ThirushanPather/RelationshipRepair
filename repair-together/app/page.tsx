export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { ThemeIcon } from "@/components/icons/ThemeIcons"

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeStat = {
  id: string
  name: string
  icon: string
  description: string
  sort_order: number
  totalTopics: number
  completedTopics: number
  avgScore: number
}

type RecentRating = {
  id: string
  person: "him" | "her"
  score: number
  rated_at: string
  topics: { question: string } | null
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getHomeData() {
  const [themes, topics, ratings, settings, recentRaw] = await Promise.all([
    supabase.from("themes").select("id, name, icon, description, sort_order").order("sort_order").then(r => r.data ?? []),
    supabase.from("topics").select("id, theme_id").then(r => r.data ?? []),
    supabase.from("ratings").select("id, topic_id, person, score").then(r => r.data ?? []),
    supabase.from("settings").select("key, value").then(r => r.data ?? []),
    supabase.from("ratings").select("id, person, score, rated_at, topics(question)").order("rated_at", { ascending: false }).limit(5).then(r => r.data ?? []),
  ])

  // Index topics by theme
  const topicsByTheme: Record<string, string[]> = {}
  for (const t of topics as { id: string; theme_id: string }[]) {
    ;(topicsByTheme[t.theme_id] ??= []).push(t.id)
  }

  // Index ratings by topic
  const ratingsByTopic: Record<string, { person: string; score: number }[]> = {}
  for (const r of ratings as { id: string; topic_id: string; person: string; score: number }[]) {
    ;(ratingsByTopic[r.topic_id] ??= []).push(r)
  }

  // Compute per-theme stats
  const themeStats: ThemeStat[] = (themes as { id: string; name: string; icon: string; description: string; sort_order: number }[]).map(theme => {
    const topicIds = topicsByTheme[theme.id] ?? []
    let completedTopics = 0
    let totalScore = 0

    for (const topicId of topicIds) {
      const tr = ratingsByTopic[topicId] ?? []
      const him = tr.find(r => r.person === "him")
      const her = tr.find(r => r.person === "her")
      if (him && her) {
        completedTopics++
        totalScore += (him.score + her.score) / 2
      }
    }

    return {
      ...theme,
      totalTopics: topicIds.length,
      completedTopics,
      avgScore: completedTopics > 0 ? totalScore / completedTopics : 0,
    }
  })

  const totalTopics = (topics as unknown[]).length
  const totalCompleted = themeStats.reduce((n, t) => n + t.completedTopics, 0)

  const settingsArr = settings as { key: string; value: string }[]
  const nameHim = settingsArr.find(s => s.key === "name_him")?.value ?? "Him"
  const nameHer = settingsArr.find(s => s.key === "name_her")?.value ?? "Her"

  return {
    themeStats,
    totalTopics,
    totalCompleted,
    nameHim,
    nameHer,
    recentRatings: recentRaw as unknown as RecentRating[],
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { themeStats, totalTopics, totalCompleted, nameHim, nameHer, recentRatings } =
    await getHomeData()

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 md:py-14">

      {/* ── Welcome header ─────────────────────────────────────── */}
      <header className="mb-12 md:mb-16">
        <h1 className="font-heading italic text-5xl md:text-[3.5rem] text-gold leading-none mb-3 tracking-tight">
          Us, Intentionally
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-6">
          A space to rebuild with honesty and care
        </p>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                       bg-accent/10 border border-accent/20 text-sm">
          <span className="text-accent font-medium tabular-nums">{totalCompleted}</span>
          <span className="text-muted-foreground">of</span>
          <span className="text-accent font-medium tabular-nums">{totalTopics}</span>
          <span className="text-muted-foreground">topics explored together</span>
        </div>
      </header>

      {/* ── Theme grid ─────────────────────────────────────────── */}
      <section className="mb-14">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-5">
          Themes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeStats.map(theme => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </section>

      {/* ── Recent activity ────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-5">
          Recent Activity
        </p>
        {recentRatings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentRatings.map(rating => (
              <ActivityItem
                key={rating.id}
                rating={rating}
                personName={rating.person === "him" ? nameHim : nameHer}
              />
            ))}
          </div>
        ) : (
          <EmptyActivity />
        )}
      </section>

    </div>
  )
}

// ─── Theme card ───────────────────────────────────────────────────────────────

function ThemeCard({ theme }: { theme: ThemeStat }) {
  const hasRatings = theme.completedTopics > 0
  const barWidth = theme.totalTopics > 0
    ? `${(theme.completedTopics / theme.totalTopics) * 100}%`
    : "0%"

  return (
    <div
      className="glass-card rounded-2xl p-5 flex flex-col
                 transition-all duration-300
                 hover:-translate-y-0.5
                 hover:shadow-[0_12px_40px_rgba(138,171,122,0.07)]"
    >
      {/* Icon + name + description */}
      <div className="flex-1">
        <div className="flex items-center gap-2.5 mb-2">
          <ThemeIcon themeName={theme.name} size={22} className="shrink-0 text-muted-foreground" />
          <h3 className="font-heading text-[1.1rem] text-foreground leading-snug">
            {theme.name}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {theme.description}
        </p>
      </div>

      {/* Progress + button — always anchored to bottom */}
      <div className="mt-5 flex flex-col gap-3">
        {/* Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {hasRatings
                ? `${theme.completedTopics} of ${theme.totalTopics} explored`
                : `${theme.totalTopics} topics`}
            </span>
            {hasRatings && (
              <span className="text-xs text-accent/80 tabular-nums">
                {theme.avgScore.toFixed(1)}&thinsp;avg
              </span>
            )}
          </div>
          <div className="h-px bg-white/[0.07] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/55 rounded-full transition-all duration-700"
              style={{ width: barWidth }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/conversations?theme=${theme.id}`}
          className="glass-button self-start inline-flex items-center gap-1.5
                     px-4 py-2 rounded-lg text-sm text-accent
                     hover:bg-accent/20 transition-colors duration-200"
        >
          View Conversations
          <ArrowRight size={13} strokeWidth={1.75} className="opacity-70" />
        </Link>
      </div>
    </div>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

function ActivityItem({
  rating,
  personName,
}: {
  rating: RecentRating
  personName: string
}) {
  const question = rating.topics?.question ?? "Conversation"
  const timeAgo = formatDistanceToNow(new Date(rating.rated_at), { addSuffix: true })

  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-4">
      {/* Score circle */}
      <div
        className="shrink-0 w-9 h-9 rounded-full bg-accent/10 border border-accent/20
                   flex items-center justify-center text-sm font-medium text-accent
                   tabular-nums"
      >
        {rating.score}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm text-foreground leading-snug line-clamp-2">
          {question}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {personName}&ensp;·&ensp;{timeAgo}
        </p>
      </div>
    </div>
  )
}

// ─── Empty activity state ─────────────────────────────────────────────────────

function EmptyActivity() {
  return (
    <div className="glass-card rounded-xl px-6 py-10 text-center">
      <p className="text-gold/60 text-2xl mb-3" aria-hidden="true">✦</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Your first conversation will appear here.
      </p>
    </div>
  )
}
