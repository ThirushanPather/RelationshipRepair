"use client"

import { useState, useEffect } from "react"
import {
  Star, MessageCircle, Target, BookOpen, Trophy, Link2,
  Shield, TrendingUp, Pencil, LayoutGrid, Lock, X, CheckCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type MilestoneStatus = { id: string; name: string; unlocked: boolean }

export type ThemeBreakdown = {
  id: string
  name: string
  completedCount: number
  totalCount: number
}

export type MilestoneProgressData = {
  completedCount: number
  totalTopics: number
  avgGap: number
  topicsWithNoteCount: number
  themeBreakdown: ThemeBreakdown[]
}

type ProgressInfo = { current: number; target: number; label: string }

type MilestoneDetail = {
  description: string
  requirement: string
  howToUnlock: (d: MilestoneProgressData) => string
  completion: string
  progress?: (d: MilestoneProgressData) => ProgressInfo
}

// ─── Milestone content ────────────────────────────────────────────────────────

const DETAILS: Record<string, MilestoneDetail> = {
  "first-step": {
    description: "Every journey has a first step. This one starts with an honest conversation.",
    requirement: "Complete 1 topic together — both people save a score on the same topic.",
    howToUnlock: () =>
      "Go to Conversations, open any topic, move both sliders to where you honestly feel, and tap Save.",
    completion: "You took the first step together. Every conversation between you starts here.",
    progress: (d) => ({
      current: Math.min(d.completedCount, 1),
      target: 1,
      label: `${d.completedCount >= 1 ? 1 : 0} of 1 topic`,
    }),
  },
  "getting-real": {
    description: "Five conversations in and you're starting to build something real.",
    requirement: "Complete 5 topics together.",
    howToUnlock: (d) => {
      const left = Math.max(0, 5 - d.completedCount)
      return `Rate ${left} more topic${left === 1 ? "" : "s"} together. Pick ones that feel approachable first.`
    },
    completion: "Five conversations deep — you're showing up for each other consistently.",
    progress: (d) => ({
      current: Math.min(d.completedCount, 5),
      target: 5,
      label: `${d.completedCount} of 5 topics`,
    }),
  },
  "halfway": {
    description: "You've covered half the ground. The hard and the easy, the comfortable and the stretching.",
    requirement: `Complete at least half of all topics (both people rate the same topic).`,
    howToUnlock: (d) => {
      const target = Math.ceil(d.totalTopics / 2)
      const left = Math.max(0, target - d.completedCount)
      return `Complete ${left} more topic${left === 1 ? "" : "s"} — you need ${target} total (half of ${d.totalTopics}).`
    },
    completion: "Halfway there. You've shown you can stay in the conversation even when it's hard.",
    progress: (d) => {
      const target = Math.ceil(d.totalTopics / 2)
      return {
        current: Math.min(d.completedCount, target),
        target,
        label: `${d.completedCount} of ${target} topics`,
      }
    },
  },
  "deep-dive": {
    description: "True depth comes from finishing what you started — complete every topic in one theme.",
    requirement: "Rate every topic in any single theme.",
    howToUnlock: (d) => {
      const closest = [...d.themeBreakdown]
        .filter((t) => t.totalCount > 0)
        .sort((a, b) => b.completedCount / b.totalCount - a.completedCount / a.totalCount)[0]
      if (!closest) return "Pick a theme in Conversations and work through all its topics together."
      const left = closest.totalCount - closest.completedCount
      if (left === 0) return "You've already unlocked this!"
      return `You're closest in "${closest.name}" — ${closest.completedCount} of ${closest.totalCount} done, ${left} topic${left === 1 ? "" : "s"} to go.`
    },
    completion: "You went all the way through one area of your relationship. That takes real commitment.",
    progress: (d) => {
      const closest = [...d.themeBreakdown]
        .filter((t) => t.totalCount > 0)
        .sort((a, b) => b.completedCount / b.totalCount - a.completedCount / a.totalCount)[0]
      if (!closest) return { current: 0, target: 1, label: "0 themes fully explored" }
      return {
        current: closest.completedCount,
        target: closest.totalCount,
        label: `${closest.completedCount} of ${closest.totalCount} in "${closest.name}"`,
      }
    },
  },
  "full-circle": {
    description: "No conversation left unstarted. You've explored every corner of your relationship.",
    requirement: `Complete all ${41} topics across all 6 themes.`,
    howToUnlock: (d) => {
      const left = Math.max(0, d.totalTopics - d.completedCount)
      return `You've done ${d.completedCount} of ${d.totalTopics} topics — ${left} left to go.`
    },
    completion: "All of it. Every topic, every theme. You didn't avoid a single conversation.",
    progress: (d) => ({
      current: d.completedCount,
      target: d.totalTopics,
      label: `${d.completedCount} of ${d.totalTopics} topics`,
    }),
  },
  "in-sync": {
    description: "Your scores are closely aligned — you're seeing your relationship through similar eyes.",
    requirement: "Complete 5+ topics with an average score gap of 1 or less between you.",
    howToUnlock: (d) => {
      if (d.completedCount < 5) {
        const left = 5 - d.completedCount
        return `Complete ${left} more topic${left === 1 ? "" : "s"} first, then keep scoring in sync — aim for less than 1 point apart on average.`
      }
      if (d.avgGap > 1) {
        return `You have enough topics but your average gap is ${d.avgGap.toFixed(1)}. Try to find more common ground — aim for scores within 1 point of each other.`
      }
      return "You've already unlocked this!"
    },
    completion: "You're seeing eye-to-eye. An average gap of 1 or less shows real alignment.",
    progress: (d) => {
      if (d.completedCount < 5) {
        return {
          current: d.completedCount,
          target: 5,
          label: `${d.completedCount} of 5 topics needed`,
        }
      }
      return {
        current: Math.max(0, Math.round((1 - Math.min(d.avgGap, 2) / 2) * 100)),
        target: 100,
        label: `Avg gap: ${d.avgGap.toFixed(1)} (need ≤ 1.0)`,
      }
    },
  },
  "honest-ground": {
    description: "Find a topic where you both genuinely feel strong — no pretending, just real good feeling.",
    requirement: "Both people score the same topic 8 or above.",
    howToUnlock: () =>
      "When you discuss a topic where things are genuinely going well, let your scores reflect that. Both need to score 8, 9, or 10 on the same topic.",
    completion: "You found shared ground where you both feel genuinely good. That's worth holding onto.",
  },
  "growth-mindset": {
    description: "Growth shows when you come back to a conversation and your scores have shifted.",
    requirement: "Revisit a topic you've already rated and save updated scores.",
    howToUnlock: () =>
      "Open a topic you've previously rated — you'll see a 'Revisit this conversation' button. Update your scores and tap Save.",
    completion: "You came back. Revisiting shows you're willing to track your own growth.",
  },
  "vulnerability": {
    description: "Words matter. Adding a note turns a number into something real.",
    requirement: "Add a personal note when saving scores on 3 different topics.",
    howToUnlock: (d) => {
      const left = Math.max(0, 3 - d.topicsWithNoteCount)
      return `Add a note to ${left} more topic${left === 1 ? "" : "s"}. When saving scores, tap the note field and write something — even a sentence.`
    },
    completion: "Three topics with notes. You're not just scoring — you're sharing what's underneath.",
    progress: (d) => ({
      current: Math.min(d.topicsWithNoteCount, 3),
      target: 3,
      label: `${d.topicsWithNoteCount} of 3 topics with notes`,
    }),
  },
  "all-in": {
    description: "A full relationship shows up in all its parts. No theme left untouched.",
    requirement: "Complete at least one topic in each of the 6 themes.",
    howToUnlock: (d) => {
      const missing = d.themeBreakdown.filter((t) => t.completedCount === 0).map((t) => t.name)
      if (missing.length === 0) return "You've already unlocked this!"
      return `Start a conversation in: ${missing.join(", ")}.`
    },
    completion: "You showed up for every part of your relationship. That's all in.",
    progress: (d) => {
      const covered = d.themeBreakdown.filter((t) => t.completedCount > 0).length
      return {
        current: covered,
        target: 6,
        label: `${covered} of 6 themes started`,
      }
    },
  },
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────

function getMilestoneIcon(id: string, size = 20) {
  const p = { size, strokeWidth: 1.5 }
  switch (id) {
    case "first-step":     return <Star {...p} />
    case "getting-real":   return <MessageCircle {...p} />
    case "halfway":        return <Target {...p} />
    case "deep-dive":      return <BookOpen {...p} />
    case "full-circle":    return <Trophy {...p} />
    case "in-sync":        return <Link2 {...p} />
    case "honest-ground":  return <Shield {...p} />
    case "growth-mindset": return <TrendingUp {...p} />
    case "vulnerability":  return <Pencil {...p} />
    case "all-in":         return <LayoutGrid {...p} />
    default:               return <Star {...p} />
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, target, label }: ProgressInfo) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold text-accent">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--color-accent)" }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MilestoneStrip({
  milestones,
  progressData,
}: {
  milestones: MilestoneStatus[]
  progressData: MilestoneProgressData
}) {
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<MilestoneStatus | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const unlockedCount = milestones.filter((m) => m.unlocked).length
  const sorted = [...milestones].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))

  function open(m: MilestoneStatus) {
    setSelected(m)
    requestAnimationFrame(() => setVisible(true))
  }

  function close() {
    setVisible(false)
    setTimeout(() => setSelected(null), 250)
  }

  // Escape key + body scroll lock
  useEffect(() => {
    if (!selected) return
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", onKey)
    }
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const detail = selected ? DETAILS[selected.id] : null
  const progress = detail && !selected?.unlocked ? detail.progress?.(progressData) ?? null : null
  const bodyText = selected
    ? selected.unlocked
      ? detail?.completion ?? ""
      : detail?.howToUnlock(progressData) ?? ""
    : ""

  return (
    <>
      {/* ── Strip ── */}
      <div>
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1">
          Milestones
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {unlockedCount} of {milestones.length} unlocked — tap any to learn more
        </p>

        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {sorted.map((m) => {
              const unlocked = m.unlocked
              return (
                <button
                  key={m.id}
                  onClick={() => open(m)}
                  className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 border"
                  style={{
                    width: 96,
                    height: 96,
                    flexShrink: 0,
                    cursor: "pointer",
                    background: unlocked
                      ? "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))"
                      : "color-mix(in srgb, var(--color-surface2) 50%, transparent)",
                    borderColor: unlocked
                      ? "color-mix(in srgb, var(--color-accent) 30%, transparent)"
                      : "color-mix(in srgb, var(--color-border) 60%, transparent)",
                    transition: "opacity 150ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8" }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
                  aria-label={`${m.name} — ${unlocked ? "unlocked" : "locked"}`}
                >
                  <span
                    style={{
                      color: unlocked ? "var(--color-accent)" : "var(--color-muted-foreground)",
                      opacity: unlocked ? 1 : 0.45,
                    }}
                  >
                    {getMilestoneIcon(m.id)}
                  </span>
                  <p
                    className="text-center leading-tight"
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: unlocked ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                      opacity: unlocked ? 1 : 0.45,
                    }}
                  >
                    {m.name}
                  </p>
                  {!unlocked && (
                    <span
                      className="absolute top-1.5 right-1.5"
                      style={{ color: "var(--color-muted-foreground)", opacity: 0.35 }}
                    >
                      <Lock size={10} strokeWidth={2} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Popup ── */}
      {mounted && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 220ms ease-out",
          }}
          onClick={close}
        >
          <div
            className="glass-card rounded-2xl w-full max-w-sm p-6 relative"
            style={{
              background: "color-mix(in srgb, var(--color-surface) 94%, transparent)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
              transition: "transform 220ms ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 text-muted-foreground"
              style={{ transition: "color 150ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-foreground)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-muted-foreground)" }}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4 pr-8">
              <span
                className="shrink-0 mt-0.5"
                style={{ color: selected.unlocked ? "var(--color-accent)" : "var(--color-muted-foreground)" }}
              >
                {getMilestoneIcon(selected.id, 22)}
              </span>
              <div>
                <h3 className="font-heading italic text-xl text-foreground leading-tight">
                  {selected.name}
                </h3>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5"
                  style={{ color: selected.unlocked ? "var(--color-accent)" : "var(--color-muted-foreground)" }}
                >
                  {selected.unlocked ? (
                    <><CheckCircle size={11} strokeWidth={2.5} /> Unlocked</>
                  ) : (
                    <><Lock size={11} strokeWidth={2.5} /> Locked</>
                  )}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {detail?.description}
            </p>

            {/* Requirement pill */}
            <div
              className="rounded-lg px-3 py-2 mb-4 text-xs text-muted-foreground leading-relaxed"
              style={{ background: "color-mix(in srgb, var(--color-border) 40%, transparent)" }}
            >
              <span className="font-semibold text-foreground/60 uppercase tracking-wider text-[10px]">
                Requirement&nbsp;
              </span>
              {detail?.requirement}
            </div>

            {/* Progress bar (locked only, when applicable) */}
            {progress && (
              <div className="mb-4">
                <ProgressBar {...progress} />
              </div>
            )}

            {/* How to unlock / completion message */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: "color-mix(in srgb, var(--color-surface2) 70%, transparent)" }}
            >
              <p
                className="text-[10px] font-semibold tracking-wider uppercase mb-1.5"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {selected.unlocked ? "How you got here" : "How to unlock"}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {bodyText}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
