export type PaletteKey = "matcha" | "dusk-rose" | "slate-blue"

export type Palette = {
  key: PaletteKey
  name: string
  bg: string
  surface: string
  surface2: string
  border: string
  accent: string
  accentSoft: string
  text: string
  muted: string
  gold: string
}

export const PALETTES: Palette[] = [
  {
    key: "matcha",
    name: "Matcha",
    bg: "#1a1f1a", surface: "#222722", surface2: "#2a302a", border: "#3a4238",
    accent: "#8aab7a", accentSoft: "rgba(138,171,122,0.12)",
    text: "#e8ebe4", muted: "#7a8c75", gold: "#c9a96e",
  },
  {
    key: "dusk-rose",
    name: "Dusk Rose",
    bg: "#1f1a1c", surface: "#271f22", surface2: "#302228", border: "#42303a",
    accent: "#c48b9f", accentSoft: "rgba(196,139,159,0.12)",
    text: "#ebe4e6", muted: "#8c757a", gold: "#c9a06e",
  },
  {
    key: "slate-blue",
    name: "Slate Blue",
    bg: "#1a1b22", surface: "#21222e", surface2: "#282a38", border: "#383c52",
    accent: "#8a97c9", accentSoft: "rgba(138,151,201,0.12)",
    text: "#e4e5eb", muted: "#757a8c", gold: "#b8a96e",
  },
]

export const DEFAULT_PALETTE_KEY: PaletteKey = "matcha"

export function getPalette(key: string): Palette {
  return PALETTES.find(p => p.key === key) ?? PALETTES[0]
}

// Sets all palette-derived CSS variables on <html> — call only in browser context.
export function applyPalette(p: Palette): void {
  const el = document.documentElement
  el.style.setProperty("--color-background",       p.bg)
  el.style.setProperty("--color-foreground",       p.text)
  el.style.setProperty("--color-surface",          p.surface)
  el.style.setProperty("--color-surface2",         p.surface2)
  el.style.setProperty("--color-border",           p.border)
  el.style.setProperty("--color-accent",           p.accent)
  el.style.setProperty("--color-gold",             p.gold)
  el.style.setProperty("--color-accent-soft",      p.accentSoft)
  el.style.setProperty("--color-primary",          p.accent)
  el.style.setProperty("--color-muted-foreground", p.muted)
  el.style.setProperty("--color-card",             p.surface)
  el.style.setProperty("--color-card-foreground",  p.text)
  el.style.setProperty("--color-muted",            p.surface2)
  el.style.setProperty("--color-secondary",        p.surface2)
  el.style.setProperty("--color-input",            p.border)
  el.style.setProperty("--color-ring",             p.accent)
}

// Inline script string — embedded synchronously in <head> to apply the stored
// palette before first paint, preventing a flash of the default theme.
// Palette data is inlined so no async loading is needed.
export const PALETTE_INIT_SCRIPT: string = (() => {
  const d: Record<string, Record<string, string>> = {}
  for (const p of PALETTES) {
    d[p.key] = {
      bg: p.bg, surface: p.surface, surface2: p.surface2, border: p.border,
      accent: p.accent, accentSoft: p.accentSoft, text: p.text,
      muted: p.muted, gold: p.gold,
    }
  }
  return (
    `(function(){try{` +
    `var p=${JSON.stringify(d)};` +
    `var k=localStorage.getItem("ui-palette")||"matcha";` +
    `var d2=p[k]||p.matcha;var e=document.documentElement;` +
    `e.style.setProperty("--color-background",d2.bg);` +
    `e.style.setProperty("--color-foreground",d2.text);` +
    `e.style.setProperty("--color-surface",d2.surface);` +
    `e.style.setProperty("--color-surface2",d2.surface2);` +
    `e.style.setProperty("--color-border",d2.border);` +
    `e.style.setProperty("--color-accent",d2.accent);` +
    `e.style.setProperty("--color-gold",d2.gold);` +
    `e.style.setProperty("--color-accent-soft",d2.accentSoft);` +
    `e.style.setProperty("--color-primary",d2.accent);` +
    `e.style.setProperty("--color-muted-foreground",d2.muted);` +
    `e.style.setProperty("--color-card",d2.surface);` +
    `e.style.setProperty("--color-card-foreground",d2.text);` +
    `e.style.setProperty("--color-muted",d2.surface2);` +
    `e.style.setProperty("--color-secondary",d2.surface2);` +
    `e.style.setProperty("--color-input",d2.border);` +
    `e.style.setProperty("--color-ring",d2.accent);` +
    `}catch(x){}})()`
  )
})()
