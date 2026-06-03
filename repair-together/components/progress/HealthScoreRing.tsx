"use client"

import { useEffect, useState } from "react"

type Props = {
  base: number
  coverage: number
  alignment: number
  total: number
}

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

export default function HealthScoreRing({ base, coverage, alignment, total }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const dashOffset = mounted
    ? CIRCUMFERENCE * (1 - total / 100)
    : CIRCUMFERENCE

  return (
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
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
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

        {/* Centre text */}
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

      {/* Component pills */}
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        {[
          { label: "Base", value: base },
          { label: "Coverage", value: coverage },
          { label: "Alignment", value: alignment },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/50"
            style={{ background: "color-mix(in srgb, var(--color-surface2) 60%, transparent)" }}
          >
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-[10px] font-semibold text-accent">+{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
