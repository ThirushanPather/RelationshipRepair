# CLAUDE.md — Us, Intentionally

This file documents the current state of the project for Claude Code. Read this before making any changes.

---

## What this app is

**Us, Intentionally** is a private relationship-repair web app for two people. It guides them through structured conversation topics organised by theme (e.g. Communication, Being Chosen, Physical Intimacy), lets each person rate how they feel about each topic on a 1–10 slider, adds optional notes, and surfaces a progress/analytics view over time.

The app is personal and intimate — not a product, not multi-tenant. There are exactly two users: "him" and "her" (display names configurable in settings via the `settings` table). There is no authentication — the app is accessed directly.

---

## Running the app

```bash
cd repair-together
npm install
npm run dev        # starts at http://localhost:3000 (or 3001/3002 if ports are in use)
npm run build      # production build
npx tsc --noEmit   # type check only
```

The `.env.local` file is not committed. It must contain:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

A template is at `.env.local.example`. After setting up env vars, seed the DB once:

```bash
curl -X POST http://localhost:3000/api/seed
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14.2 (App Router) | No Pages Router — all routes live in `/app` |
| Language | TypeScript 5 | Strict mode on |
| Styling | Tailwind CSS v4 + tw-animate-css | Config lives in CSS (`@theme`), NOT in `tailwind.config.ts` |
| Components | shadcn/ui (v4 flavour) | Uses `@base-ui/react` primitives, not Radix |
| Database | Supabase (PostgreSQL) | Client-only via `@supabase/supabase-js` |
| Charts | Recharts 3 | Used in `/progress` via `next/dynamic` with `ssr: false` |
| Date utils | date-fns 4 | For formatting `rated_at` timestamps |
| Icons | lucide-react 1.17 | Used in nav and settings components |
| Fonts | Google Fonts via `next/font` | Cormorant Garamond (headings) + DM Sans (body) |
| PostCSS | `@tailwindcss/postcss` | v4 plugin — NOT the old `tailwindcss` plugin |

---

## Project structure

```
repair-together/
├── app/
│   ├── api/
│   │   ├── health/route.ts            GET  /api/health — deployment health check
│   │   └── seed/route.ts              POST /api/seed   — seeds DB if empty (idempotent)
│   ├── conversations/
│   │   ├── ConversationsClient.tsx    "use client" — full conversations UI
│   │   ├── loading.tsx                Skeleton loading state
│   │   └── page.tsx                   Suspense wrapper → ConversationsClient
│   ├── progress/
│   │   ├── ProgressCharts.tsx         "use client" — Recharts line + bar charts
│   │   ├── loading.tsx                Skeleton loading state
│   │   └── page.tsx                   Server component — all data + page render
│   ├── settings/
│   │   ├── loading.tsx                Skeleton loading state
│   │   └── page.tsx                   "use client" — palette switcher + name customisation
│   ├── globals.css                    Design system (colour tokens, glass utilities, gradient mesh)
│   ├── layout.tsx                     Root layout — fonts, manifest, palette init script, AppShell
│   ├── loading.tsx                    Skeleton loading state for home page
│   └── page.tsx                       Home page — welcome header, theme grid, recent activity
│
├── components/
│   ├── icons/
│   │   └── ThemeIcons.tsx             ThemeIcon component — SVG line icons for each of the 6 themes
│   ├── layout/
│   │   ├── AppShell.tsx               Server component — composes Sidebar + main + BottomNav
│   │   ├── BottomNav.tsx              "use client" — mobile bottom nav bar
│   │   ├── nav-config.ts              Shared nav items array (single source of truth)
│   │   └── Sidebar.tsx                "use client" — desktop sidebar (220px fixed)
│   ├── ui/                            shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── slider.tsx
│   └── PaletteSync.tsx                "use client" — syncs Supabase palette pref → localStorage on mount
│
├── lib/
│   ├── data.ts                        seedData() — inserts 6 themes + 41 topics + 2 settings rows
│   ├── db.sql                         Run once in Supabase SQL editor to create schema + RLS
│   ├── palettes.ts                    Palette definitions, applyPalette(), PALETTE_INIT_SCRIPT
│   ├── supabase.ts                    Supabase client (single export: `supabase`)
│   └── utils.ts                       shadcn cn() utility
│
├── public/
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   └── site.webmanifest               PWA manifest — name, theme_color, icons
│
├── types/
│   └── index.ts                       Theme, Topic, Rating interfaces
│
├── .env.local.example                 Template for required environment variables
└── next.config.mjs                    poweredByHeader: false
```

---

## Database schema

Run `lib/db.sql` once in the Supabase SQL editor. RLS is enabled on all tables with permissive `FOR ALL` policies so the anon key can read and write freely.

### `themes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, gen_random_uuid() |
| name | text | e.g. "Connection & Communication" |
| icon | text | Emoji stored in DB but **not rendered** — UI uses `ThemeIcon` SVG component instead |
| description | text | One-line theme description |
| sort_order | int | Display order (1–6) |
| created_at | timestamptz | Default now() |

### `topics`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| theme_id | uuid | FK → themes.id (CASCADE delete) |
| question | text | The conversation prompt |
| difficulty | int | 1 = easy, 2 = medium, 3 = hard |
| sort_order | int | Order within the theme |
| created_at | timestamptz | Default now() |

### `ratings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| topic_id | uuid | FK → topics.id (CASCADE delete) |
| person | text | CHECK IN ('him', 'her') |
| score | int | CHECK 1–10 |
| note | text | Optional free-text note |
| rated_at | timestamptz | Default now() |

### `settings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| key | text | e.g. "name_him", "name_her", "ui-palette" |
| value | text | e.g. "Him", "Her", "dusk-rose" |

Note: `settings.key` has **no unique constraint**. All writes use select-then-update-or-insert by `id`.

### Seeded data
- **6 themes**: Connection & Communication, Being Chosen, Effort & Reciprocity, Individual Fullness, Physical Intimacy, Future & Commitment
- **41 topics** total, distributed across difficulty levels 1–3 within each theme
- **2 settings rows**: `name_him = "Him"`, `name_her = "Her"`
- `ui-palette` is written on first palette selection (not seeded)

To seed: `POST /api/seed` (idempotent — skips if themes table already has rows).

---

## Design system

### Aesthetic
Premium wellness / mindfulness app. Frosted glass — organic, warm, intimate. Not clinical. The default palette is Matcha; two additional palettes (Dusk Rose, Slate Blue) can be selected in Settings.

### Colour palette system

Colours are defined as CSS custom properties in `app/globals.css` via `@theme {}`. The `@theme` values are the **Matcha defaults**. At runtime, `lib/palettes.ts` overrides them on the `<html>` element via inline style, which takes precedence over `:root` — all Tailwind utility classes and glass utilities respond instantly.

The inline init script in `app/layout.tsx` runs synchronously before first paint (preventing a colour flash) by reading `localStorage("ui-palette")` and applying the stored palette. `components/PaletteSync.tsx` reconciles with the Supabase-stored value on every mount for cross-device sync.

**Three palettes** (defined in `lib/palettes.ts`):

| Key | Name | Accent |
|---|---|---|
| `matcha` | Matcha (default) | `#8aab7a` green |
| `dusk-rose` | Dusk Rose | `#c48b9f` rose |
| `slate-blue` | Slate Blue | `#8a97c9` blue |

**Colour tokens** (Matcha defaults — all overridden at runtime when a non-default palette is active):

| Token | Matcha default | Usage |
|---|---|---|
| `--color-background` | `#1a1f1a` | Page background |
| `--color-foreground` | `#e8ebe4` | Primary text |
| `--color-surface` | `#222722` | Card / panel backgrounds |
| `--color-surface2` | `#2a302a` | Inset surfaces, inputs |
| `--color-border` | `#3a4238` | Subtle borders |
| `--color-accent` | `#8aab7a` | Active states, primary actions |
| `--color-gold` | `#c9a96e` | App name, highlights |
| `--color-muted-foreground` | `#7a8c75` | Secondary / muted text |
| `--color-primary` | `#8aab7a` | shadcn primary (= accent) |
| `--color-ring` | `#8aab7a` | Focus rings |
| `--color-destructive` | `#e05252` | Errors / danger |

Destructive/danger UI (e.g. delete buttons) uses `#c47a6a` — a warm rose-red — NOT `--color-destructive`. Inline: `color: "#c47a6a"`, `borderColor: "rgba(196,122,106,0.45)"`, `background: "rgba(196,122,106,0.10)"`.

### Typography
- **Headings**: `font-heading` → Cormorant Garamond (loaded via `next/font/google`, variable `--font-cormorant`)
- **Body**: `font-sans` → DM Sans (loaded via `next/font/google`, variable `--font-dm-sans`)
- Heading italic: `className="font-heading italic"` — used for the app name and all page titles

### Glassmorphism utilities (Tailwind `@utility` classes)

| Class | Use for |
|---|---|
| `glass-card` | Content cards, panels |
| `glass-nav` | Sidebar, bottom nav, conversations theme panel |
| `glass-input` | Form inputs and text fields |
| `glass-button` | Secondary / ghost action buttons |

All glass utilities use `color-mix(in srgb, var(--color-*) α%, transparent)` — **never hardcoded rgba values** — so they respond to palette changes. The gradient mesh background is a fixed `html::before` pseudo-element (`z-index: -1`) using `var(--color-background)` and `color-mix()` tints.

### Theme icons

The `themes.icon` DB column stores emojis but they are **not rendered in the UI**. Instead, use `<ThemeIcon themeName={theme.name} size={N} className="..." />` from `@/components/icons/ThemeIcons`.

The component maps theme names to one of 6 custom stroke-based SVGs (strokeWidth 1.5, fill none, currentColor):

| Theme | Icon |
|---|---|
| Connection & Communication | Two overlapping speech bubbles |
| Being Chosen | Shield outline |
| Effort & Reciprocity | Circular refresh arrows |
| Individual Fullness | Upward trend line with peak circle |
| Physical Intimacy | Heart outline |
| Future & Commitment | Compass dial |

Matching is by keyword (`includes` on lowercase name). Icons inherit colour from the parent element via `currentColor`.

### Additional CSS classes (plain CSS, not Tailwind utilities)

| Class | Use for |
|---|---|
| `rating-slider` | `<input type="range">` on the conversations page — accent green fill via inline gradient, gold thumb via `::webkit-slider-thumb` (uses `var(--color-gold)`) |
| `scrollbar-none` | `@utility` — hides scrollbars on horizontally scrollable containers |

### Tailwind v4 notes
- **No `tailwind.config.ts` is used for theme config.** All design tokens live in `@theme {}` inside `app/globals.css`.
- Tailwind v4 utility classes compile to `var(--color-*)` references — they respond to runtime CSS variable overrides automatically.
- Custom utilities are defined with `@utility` (not `@layer utilities`).
- The PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`.
- `tailwind.config.ts` exists in the repo but is intentionally empty — kept only for editor tooling.
- Use canonical Tailwind class names (e.g. `min-h-11` not `min-h-[44px]`, `w-55` not `w-[220px]`, `bg-white/4` not `bg-white/[0.04]`) — the linter flags non-canonical forms.

---

## Navigation

Four routes, defined in `components/layout/nav-config.ts`:

| Label | Route | Icon |
|---|---|---|
| Home | `/` | `Home` |
| Conversations | `/conversations` | `MessageCircle` |
| Progress | `/progress` | `BarChart2` |
| Settings | `/settings` | `Settings` |

**Desktop (≥ md):** Fixed 220px sidebar on the left using `glass-nav`. App name "Us, Intentionally" in gold italic Cormorant Garamond at the top. Active item: `text-accent bg-accent/10`. Inactive: `text-muted-foreground`.

**Mobile (< md):** Fixed bottom bar using `glass-nav`. 60px min-height touch targets. Same active/inactive colour logic. `main` has `pb-[60px]` to clear the bar.

Active state logic: `href === "/" ? pathname === "/" : pathname.startsWith(href)`

---

## TypeScript interfaces (`types/index.ts`)

```ts
Theme   { id, name, icon, description }
Topic   { id, themeId, question, difficulty: 1|2|3 }
Rating  { id, topicId, person: "him"|"her", score: 1–10, note?, createdAt }
```

Note: the DB column for `themeId` is `theme_id` (snake_case) and for `createdAt` is `rated_at`. Map accordingly when reading from Supabase.

---

## What is built

### `/` — Home page (`app/page.tsx` + `app/loading.tsx`)
Server component with `export const dynamic = "force-dynamic"`.

- **Welcome header**: Gold italic title + muted subtitle + accent stat pill showing `X of Y topics explored together` (counts only topics where **both** him and her have a rating)
- **Theme grid**: 2-column (desktop) / 1-column (mobile) grid of 6 `ThemeCard` components. Each shows a `<ThemeIcon>` SVG, name, description, a 1px progress bar, topics explored count, and a `glass-button` link to `/conversations?theme=[themeId]`
- **Recent Activity**: Last 5 ratings via Supabase join. Shows score badge, question (2-line clamp), person display name, relative time via `date-fns formatDistanceToNow`. Empty state: centred `✦` ornament
- **Skeleton**: `app/loading.tsx` mirrors page layout with `animate-pulse` + `glass-card` shapes

Data fetched with `Promise.all` (5 parallel Supabase queries). Stats computed in JS — no N+1 queries.

---

### `/conversations` — Conversations page (`app/conversations/`)

`page.tsx` is a thin Suspense wrapper. All logic lives in `ConversationsClient.tsx` (`"use client"`).

**Layout:**
- Desktop: 220px left panel (`glass-nav`) listing all 6 themes (each with a `<ThemeIcon size={16}>`) + independently scrollable topic area on the right. The full page fills `md:h-dvh md:overflow-hidden`.
- Mobile: sticky horizontal scrollable theme tab row (`scrollbar-none`) at the top with `<ThemeIcon size={15}>` pills, topics scroll below.
- Active theme driven by `?theme=[themeId]` URL param; defaults to first theme (set via `router.replace` on load).

**Topics:**
- Grouped into Easy / Medium / Hard sections with coloured dividers (`#8aab7a` / `#c9a96e` / `#c47a6a`).
- Each **topic card** contains: question in Cormorant Garamond italic, difficulty badge, and either a summary view (completed) or slider rows (not yet rated).
- Sliders use native `<input type="range">` with the `rating-slider` CSS class and an inline `background` gradient for the fill. Track: accent green. Thumb: gold.
- On load, sliders are pre-populated from the most-recent rating per person per topic (ratings fetched sorted `rated_at DESC`; first `.find()` per person = most recent).
- Empty state when DB is not seeded: centred `✦` with a note to run `/api/seed`.

**Completed topics & Revisit flow:**
- A topic is **completed** when both a `him` and a `her` rating exist for it. `completed` is derived at load time — no extra DB column needed.
- Completed cards show a small accent dot before the question and muted question text (`text-foreground/60`) to signal completion without locking the card.
- When a completed topic is displayed the card shows a **summary view** instead of sliders:
  - Score pair: him score in accent, her score in gold, separated by a vertical rule.
  - Notes from the last save in muted italic with a small name label (if any).
  - "Last discussed [d MMMM yyyy]" date using `date-fns format`.
  - "Revisit this conversation" button (full-width, `min-h-12`).
- Tapping "Revisit this conversation" transitions (`max-height` + `opacity`, 200ms) to the edit view with sliders pre-populated from the last saved scores. Save button reads "Update scores". A "Cancel" text link (`min-h-11`) reverts to the saved snapshot and returns to the summary view without saving.
- **Revisit save** calls `.update().eq("id", ...)` on the existing rating rows (IDs stored in `TopicState`). Does NOT insert new rows — history is preserved.
- **First-time save** uses `.insert().select("id,person")` so the returned IDs can be stored in `TopicState` for future revisit updates.
- `TopicState` carries: `completed`, `himRatingId`, `herRatingId`, `revisiting`, plus a saved-scores snapshot (`savedHimScore`, `savedHerScore`, `savedHimNote`, `savedHerNote`) used to revert on Cancel.

**Error handling:** `load()` is wrapped in `try/catch`; `setLoading(false)` is always reached.

---

### `/progress` — Progress analytics page (`app/progress/`)

`page.tsx` is a server component (`export const dynamic = "force-dynamic"`). Recharts is loaded via `nextDynamic(() => import("./ProgressCharts"), { ssr: false })` — must stay client-only.

**Sections:**
1. **Summary stats** — 4 `glass-card` tiles: topics rated by both, him avg, her avg, most recent session date. Shows `—` when no data.
2. **Score over time** (line chart in `ProgressCharts.tsx`) — daily averages per person. Him: `#8aab7a`. Her: `#c9a96e`. Empty state inside chart area when no ratings.
3. **Theme breakdown** (horizontal bar chart) — average combined score per theme. All 6 themes always shown; zero-rated themes show bars at 0. Y-axis labels use `shortName` (e.g. "Connection", "Being Chosen") — no emoji.
4. **Topic detail table** — all rated topics, columns: Theme / Question / His Score / Her Score / Gap. Each row has a `<ThemeIcon size={16}>`. Sorted by most recently updated. Rows where gap ≥ 3 get a subtle gold/amber background (`rgba(201,169,110,0.07)`).
5. **Session timeline** — every save event most-recent-first, deduplicated by `topic_id + rated_at` (each save = 2 DB rows with identical timestamp). Each entry shows a `<ThemeIcon size={16}>`, date, theme name, question, score pills.

**Error handling:** `getProgressData()` is wrapped in `try/catch`; returns `EMPTY_DATA` on failure so the page never crashes.

---

### `/settings` — Settings page (`app/settings/page.tsx`)

Full `"use client"` page. Loads settings on mount via `try/catch/finally`.

**Section 1 — Appearance (palette switcher):**
- Three `PaletteSwatch` buttons in a flex row: Matcha, Dusk Rose, Slate Blue.
- Each swatch is an 80×48px rounded rectangle showing the palette's bg colour, a small accent circle, and a border in the palette's border colour.
- Active swatch has a 2.5px ring in its own accent colour. Active label is coloured with the swatch's accent; inactive labels use `text-muted-foreground`.
- Clicking a swatch: immediately calls `applyPalette()` (sets all CSS variables on `<html>`), saves to `localStorage("ui-palette")`, then upserts to Supabase `settings` table under key `"ui-palette"` (select-by-id then update, or insert if not found).
- On mount, the active swatch is synced from `localStorage` immediately, then from Supabase if a value is stored there (Supabase value takes precedence for cross-device sync).

**Section 2 — Personalise (names):**
- Two `glass-input` text fields (side-by-side on `sm+`, stacked on mobile) for `name_him` and `name_her`.
- Saves via two parallel `.update().eq("key", ...)` calls. Calls `router.refresh()` after save so server components pick up new names.
- Shows "Names updated" `StatusDot` for 3 seconds on success.

---

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/seed` | POST | Seeds DB with 6 themes + 41 topics + 2 settings rows. Idempotent. |
| `/api/health` | GET | Returns `{ status: "ok", timestamp }`. Used to verify deployment. |

---

## Key conventions

- All DB calls go through `lib/supabase.ts` (`import { supabase } from "@/lib/supabase"`)
- Use `@/` alias for all internal imports (configured in `tsconfig.json`)
- Client components that need browser APIs or hooks must have `"use client"` at the top
- Server components are the default — no `"use client"` unless needed
- Do not add authentication or multi-user logic — this is a private two-person app
- Do not create new colour tokens outside of `app/globals.css @theme` — use what exists
- Do not use hardcoded rgba hex values from the palette in `@utility` classes or plain CSS — always use `color-mix(in srgb, var(--color-*) α%, transparent)` so glass utilities respond to palette changes
- Keep glassmorphism restrained: every new surface should use `glass-card` or `glass-nav`, not raw background colours
- Every async data load must be wrapped in `try/catch`. `setLoading(false)` must always be reached (use `finally` or place it in both branches). The UI must never hang in a loading state due to a DB error.
- Every route directory must have a `loading.tsx` skeleton that matches the glass aesthetic
- Use Tailwind canonical class names — the linter flags non-canonical forms (e.g. use `min-h-11` not `min-h-[44px]`, `w-55` not `w-[220px]`, `bg-white/4` not `bg-white/[0.04]`)
- Recharts must always be loaded via `next/dynamic` with `ssr: false` — it uses browser APIs that break SSR
- Destructive/danger actions use warm rose `#c47a6a` inline styles, NOT the `--color-destructive` token (`#e05252`). The destructive token is for error messages only.
- Theme icons are always rendered via `<ThemeIcon themeName={...} size={N} />` — never render `theme.icon` (the DB emoji field) directly
- The `settings` table has no unique constraint on `key`. Writes for new keys must use select-by-id then update-or-insert, not plain `.update().eq("key", ...)`
