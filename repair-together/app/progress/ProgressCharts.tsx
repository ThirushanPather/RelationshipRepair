"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LabelList,
} from "recharts"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TimelinePoint = {
  date: string
  him: number | null
  her: number | null
}

export type ThemeBarPoint = {
  label: string
  fullName: string
  avgScore: number
}

// ─── Tooltip components ────────────────────────────────────────────────────────

const tooltipBoxStyle: React.CSSProperties = {
  background: "var(--color-background)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontSize: "0.8125rem",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(138,171,122,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

function LineTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number | null; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipBoxStyle}>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: "0.5rem", fontSize: "0.75rem" }}>{label}</p>
      {payload.map(entry => (
        <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, display: "block", flexShrink: 0 }} />
          <span style={{ color: "#e8ebe4" }}>{entry.name}</span>
          <span style={{ color: entry.color, fontWeight: 600, marginLeft: "auto", paddingLeft: "1rem" }}>
            {entry.value != null ? entry.value.toFixed(1) : "—"}
          </span>
        </div>
      ))}
    </div>
  )
}

function BarTooltip({ active, payload }: {
  active?: boolean
  payload?: { value: number; payload: ThemeBarPoint }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={tooltipBoxStyle}>
      <p style={{ color: "#e8ebe4", marginBottom: "0.25rem" }}>{item.payload.fullName}</p>
      <p style={{ color: "var(--color-accent)", fontWeight: 600 }}>
        Avg: {item.value > 0 ? item.value.toFixed(1) : "No ratings yet"}
      </p>
    </div>
  )
}

// ─── Line chart ────────────────────────────────────────────────────────────────

function ScoreLineChart({
  data,
  nameHim,
  nameHer,
  himColor,
  herColor,
  mutedColor,
  gridColor,
}: {
  data: TimelinePoint[]
  nameHim: string
  nameHer: string
  himColor: string
  herColor: string
  mutedColor: string
  gridColor: string
}) {
  if (data.length === 0) {
    return (
      <div className="h-65 flex flex-col items-center justify-center gap-3">
        <p className="text-gold/40 text-3xl" aria-hidden="true">✦</p>
        <p className="text-sm text-muted-foreground text-center">
          Start your first conversation to see your journey here
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="date"
          tick={{ fill: mutedColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[1, 10]}
          ticks={[1, 3, 5, 7, 10]}
          tick={{ fill: mutedColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<LineTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "16px" }}
          formatter={(value) => (
            <span style={{ color: mutedColor, fontSize: "12px" }}>{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="him"
          name={nameHim}
          stroke={himColor}
          strokeWidth={2}
          dot={{ r: 4, fill: himColor, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="her"
          name={nameHer}
          stroke={herColor}
          strokeWidth={2}
          dot={{ r: 4, fill: herColor, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────

function ThemeBarChart({ data, barColor, mutedColor, gridColor, cursorColor }: {
  data: ThemeBarPoint[]
  barColor: string
  mutedColor: string
  gridColor: string
  cursorColor: string
}) {
  return (
    <ResponsiveContainer width="100%" height={268}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={gridColor} />
        <XAxis
          type="number"
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fill: mutedColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fill: mutedColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: cursorColor }} />
        <Bar
          dataKey="avgScore"
          fill={barColor}
          radius={[0, 4, 4, 0]}
          background={{ fill: "rgba(42,48,42,0.45)", radius: 4 } as React.SVGProps<SVGRectElement>}
          maxBarSize={26}
        >
          <LabelList
            dataKey="avgScore"
            position="right"
            style={{ fill: barColor, fontSize: "12px", fontWeight: 600 }}
            formatter={(v) => v != null && Number(v) > 0 ? Number(v).toFixed(1) : ""}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Default export ────────────────────────────────────────────────────────────

export default function ProgressCharts({
  timelineData,
  themeBarData,
  nameHim,
  nameHer,
}: {
  timelineData: TimelinePoint[]
  themeBarData: ThemeBarPoint[]
  nameHim: string
  nameHer: string
}) {
  const cs = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const accentColor  = cs?.getPropertyValue('--color-accent').trim()           ?? '#8aab7a'
  const goldColor    = cs?.getPropertyValue('--color-gold').trim()              ?? '#c9a96e'
  const mutedColor   = cs?.getPropertyValue('--color-muted-foreground').trim()  ?? '#7a8c75'
  const gridColor    = hexToRgba(accentColor, 0.07)
  const cursorColor  = hexToRgba(accentColor, 0.05)

  return (
    <div className="flex flex-col gap-6">

      {/* Line chart */}
      <div className="glass-card rounded-2xl p-5 md:p-7">
        <h2 className="font-heading italic text-xl md:text-2xl text-foreground mb-0.5">
          How we&apos;ve been feeling over time
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Daily average scores, 1–10</p>
        <ScoreLineChart
          data={timelineData}
          nameHim={nameHim}
          nameHer={nameHer}
          himColor={accentColor}
          herColor={goldColor}
          mutedColor={mutedColor}
          gridColor={gridColor}
        />
      </div>

      {/* Horizontal bar chart */}
      <div className="glass-card rounded-2xl p-5 md:p-7">
        <h2 className="font-heading italic text-xl md:text-2xl text-foreground mb-0.5">
          Where we stand by theme
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Average score across all ratings</p>
        <ThemeBarChart
          data={themeBarData}
          barColor={accentColor}
          mutedColor={mutedColor}
          gridColor={gridColor}
          cursorColor={cursorColor}
        />
      </div>

    </div>
  )
}
