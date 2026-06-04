"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  base: number
  coverage: number
  alignment: number
  total: number
}

type ComponentKey = "base" | "coverage" | "alignment"

type ComponentDetail = {
  label: string
  what: string
  how: string
  improve: string
  maxPoints: number
}

// ─── Component explanations ───────────────────────────────────────────────────

const COMPONENT_DETAILS: Record<ComponentKey, ComponentDetail> = {
  base: {
    label: "Base",
    what: "How you're both feeling across all your conversations.",
    how: "We take the average of every score either of you has ever saved, then scale it to 0–100. A perfect 10 on everything = 80 base points. A 1 on everything = 0 base points. It's weighted so the base can never exceed 80, leaving room for the coverage and alignment bonuses.",
    improve: "Keep having conversations and scoring honestly. Higher scores across more topics will lift the base — but only if they reflect how you genuinely feel.",
    maxPoints: 80,
  },
  coverage: {
    label: "Coverage",
    what: "How much of the relationship you've actually explored together.",
    how: "This is a bonus of up to +10 points based on the percentage of all topics where both of you have saved a score. 50% explored = +5 points. 100% explored = +10 points.",
    improve: "Open topics you've been avoiding. The coverage bonus rewards breadth — even one honest conversation in a new area moves this number.",
    maxPoints: 10,
  },
  alignment: {
    label: "Alignment",
    what: "How closely your scores match each other's.",
    how: "This is a bonus of up to +10 points based on the average gap between your scores across all completed topics. An average gap of 0 = +10 points. A gap of 5 or more = +0 points. The scale is linear between those two extremes.",
    improve: "Alignment isn't about agreeing — it's about understanding each other. Talking through the topics where your scores are furthest apart tends to close the gap naturally.",
    maxPoints: 10,
  },
}

// ─── Ring constants ───────────────────────────────────────────────────────────

const SIZE = 160
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getLabel(score: number): string {
  if (score < 40) return "Just getting started"
  if (score < 60) return "Building foundations"
  if (score < 75) return "Growing together"
  if (score < 90) return "Thriving"
  return "Deeply connected"
}

// ─── Mini score bar ───────────────────────────────────────────────────────────

function ScoreBar({
  value,
  max,
}: {
  value: number
  max: number
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {value} of {max} points
        </span>
        <span className="text-[11px] font-semibold text-accent">{pct}%</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--color-accent)" }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HealthScoreRing({ base, coverage, alignment, total }: Props) {
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<ComponentKey | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

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

  function open(key: ComponentKey) {
    setSelected(key)
    requestAnimationFrame(() => setVisible(true))
  }

  function close() {
    setVisible(false)
    setTimeout(() => setSelected(null), 250)
  }

  const dashOffset = mounted
    ? CIRCUMFERENCE * (1 - total / 100)
    : CIRCUMFERENCE

  const scores: Record<ComponentKey, number> = { base, coverage, alignment }
  const pills: { key: ComponentKey; label: string; value: number }[] = [
    { key: "base",      label: "Base",      value: base },
    { key: "coverage",  label: "Coverage",  value: coverage },
    { key: "alignment", label: "Alignment", value: alignment },
  ]

  const detail = selected ? COMPONENT_DETAILS[selected] : null

  return (
    <>
      <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-5">
          Relationship Health
        </p>

        {/* Ring */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ transform: "rotate(-90deg)" }}
            aria-hidden="true"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span
              className="font-heading text-4xl leading-none text-gold"
              style={{ fontStyle: "italic" }}
            >
              {total}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">/100</span>
          </div>
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground mt-3 text-center">
          {getLabel(total)}
        </p>

        {/* Component pills — each is a button */}
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          {pills.map(({ key, label, value }) => (
            <button
              key={key}
              onClick={() => open(key)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/50"
              style={{
                background: "color-mix(in srgb, var(--color-surface2) 60%, transparent)",
                cursor: "pointer",
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75" }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
              aria-label={`Learn about the ${label} score`}
            >
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="text-[10px] font-semibold text-accent">+{value}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/50 mt-3">
          Tap a pill to learn how it&apos;s calculated
        </p>
      </div>

      {/* Popup */}
      {mounted && selected && detail && (
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
            {/* Close */}
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
            <div className="pr-8 mb-4">
              <div className="flex items-baseline gap-2 mb-0.5">
                <h3 className="font-heading italic text-xl text-foreground leading-tight">
                  {detail.label}
                </h3>
                <span className="text-[11px] font-semibold text-accent">
                  +{scores[selected]} pts
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detail.what}
              </p>
            </div>

            {/* Score bar */}
            <div className="mb-4">
              <ScoreBar value={scores[selected]} max={detail.maxPoints} />
            </div>

            {/* How it's calculated */}
            <div
              className="rounded-xl px-4 py-3 mb-3"
              style={{ background: "color-mix(in srgb, var(--color-surface2) 70%, transparent)" }}
            >
              <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
                How it&apos;s calculated
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {detail.how}
              </p>
            </div>

            {/* How to improve */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: "color-mix(in srgb, var(--color-accent) 5%, var(--color-surface2))" }}
            >
              <p className="text-[10px] font-semibold tracking-wider uppercase text-accent/70 mb-1.5">
                How to improve it
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {detail.improve}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
