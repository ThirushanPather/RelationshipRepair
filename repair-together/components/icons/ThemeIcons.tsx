import type { ReactNode } from "react"

type IconProps = { size: number; className?: string }

function Svg({ size, className, children }: { size: number; className?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Two overlapping speech bubbles — Connection & Communication
function CommunicationIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 3h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8.5L6.5 14v-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M11 9h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H17L14.5 20v-3H11a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
    </Svg>
  )
}

// Shield outline — Being Chosen
function ShieldIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3L20 7V13C20 18 16.4 21 12 21C7.6 21 4 18 4 13V7Z" />
    </Svg>
  )
}

// Circular refresh arrows — Effort & Reciprocity
function RefreshIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Svg>
  )
}

// Upward trend line with peak circle — Individual Fullness
function TrendingDotIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <polyline points="3 18 8 12 13 15.5 18 8" />
      <circle cx="18" cy="8" r="2.5" />
    </Svg>
  )
}

// Heart outline — Physical Intimacy
function HeartIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  )
}

// Compass dial — Future & Commitment
function CompassIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
    </Svg>
  )
}

function getIconComponent(themeName: string) {
  const n = themeName.toLowerCase()
  if (n.includes("connection") || n.includes("communication")) return CommunicationIcon
  if (n.includes("chosen") || n.includes("trust") || n.includes("honesty")) return ShieldIcon
  if (n.includes("effort") || n.includes("reciprocity") || n.includes("conflict") || n.includes("repair")) return RefreshIcon
  if (n.includes("individual") || n.includes("fullness") || n.includes("growth") || n.includes("goals")) return TrendingDotIcon
  if (n.includes("physical") || n.includes("intimacy")) return HeartIcon
  if (n.includes("future") || n.includes("commitment") || n.includes("adventure") || n.includes("fun")) return CompassIcon
  return CommunicationIcon
}

export function ThemeIcon({
  themeName,
  size = 24,
  className,
}: {
  themeName: string
  size?: number
  className?: string
}) {
  const Icon = getIconComponent(themeName)
  return <Icon size={size} className={className} />
}
