# CLAUDE.md — Us, Intentionally

This file documents the current state of the project for Claude Code. Read this before making any changes.

---

## What this app is

**Us, Intentionally** is a private relationship-repair web app for two people. It guides them through structured conversation topics organised by theme (e.g. Communication, Being Chosen, Physical Intimacy), lets each person rate how they feel about each topic on a 1–10 slider, adds optional notes, and surfaces a progress/analytics view over time.

The app is personal and intimate — not a product, not multi-tenant. There are exactly two users: "him" and "her" (display names configurable in settings via the `settings` table).

---

## Running the app

```bash
cd repair-together
npm install
npm run dev        # starts at http://localhost:3000 (or 3001 if 3000 is in use)
npm run build      # production build
npx tsc --noEmit   # type check only
```

The `.env.local` file is not committed. It must contain:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
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
| Charts | Recharts 3 | For the Progress page (not yet built) |
| Date utils | date-fns 4 | For formatting `rated_at` timestamps |
| Icons | lucide-react 1.17 | Used in nav components |
| Fonts | Google Fonts via `next/font` | Cormorant Garamond (headings) + DM Sans (body) |
| PostCSS | `@tailwindcss/postcss` | v4 plugin — NOT the old `tailwindcss` plugin |

---

## Project structure

```
repair-together/
├── app/
│   ├── api/
│   │   └── seed/route.ts       POST /api/seed — seeds DB if empty
│   ├── conversations/
│   │   └── page.tsx            Placeholder
│   ├── progress/
│   │   └── page.tsx            Placeholder
│   ├── settings/
│   │   └── page.tsx            Placeholder
│   ├── globals.css             Design system (colours, glass utilities, gradient mesh)
│   ├── layout.tsx              Root layout — loads fonts, wraps in AppShell
│   ├── loading.tsx             Skeleton loading state for home page
│   └── page.tsx                Home page — welcome header, theme grid, recent activity
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        Server component — composes Sidebar + main + BottomNav
│   │   ├── BottomNav.tsx       "use client" — mobile bottom nav bar
│   │   ├── nav-config.ts       Shared nav items array (single source of truth)
│   │   └── Sidebar.tsx         "use client" — desktop sidebar (220px fixed)
│   └── ui/                     shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       └── slider.tsx
│
├── lib/
│   ├── data.ts                 seedData() — inserts 6 themes + 41 topics + 2 settings rows
│   ├── db.sql                  Run once in Supabase SQL editor to create schema + RLS
│   ├── supabase.ts             Supabase client (single export: `supabase`)
│   ├── supabase/client.ts      Re-exports from lib/supabase.ts (legacy path)
│   └── utils.ts                shadcn cn() utility
│
└── types/
    └── index.ts                Theme, Topic, Rating interfaces
```

---

## Database schema

Run `lib/db.sql` once in the Supabase SQL editor. RLS is enabled on all tables with permissive `FOR ALL` policies so the anon key can read and write freely.

### `themes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, gen_random_uuid() |
| name | text | e.g. "Connection & Communication" |
| icon | text | Emoji, e.g. "🔗" |
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
| key | text | e.g. "name_him", "name_her" |
| value | text | e.g. "Him", "Her" |

### Seeded data
- **6 themes**: Connection & Communication, Being Chosen, Effort & Reciprocity, Individual Fullness, Physical Intimacy, Future & Commitment
- **41 topics** total, distributed across difficulty levels 1–3 within each theme
- **2 settings rows**: `name_him = "Him"`, `name_her = "Her"`

To seed: `POST /api/seed` (idempotent — skips if themes table already has rows).

---

## Design system

### Aesthetic
Premium wellness / mindfulness app. Frosted matcha glass — organic, warm, intimate. Not clinical.

### Colour tokens (defined in `app/globals.css` via `@theme`)

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#1a1f1a` | Page background (deep matcha dark) |
| `--color-foreground` | `#e8ebe4` | Primary text |
| `--color-surface` | `#222722` | Card / panel backgrounds |
| `--color-surface2` | `#2a302a` | Inset surfaces, inputs |
| `--color-border` | `#3a4238` | Subtle borders |
| `--color-accent` | `#8aab7a` | Matcha green — active states, primary actions |
| `--color-gold` | `#c9a96e` | App name, highlights, special moments |
| `--color-muted` | `#2a302a` | Subtle background (shadcn `bg-muted`) |
| `--color-muted-foreground` | `#7a8c75` | Secondary / muted text |
| `--color-primary` | `#8aab7a` | shadcn primary (= accent) |
| `--color-ring` | `#8aab7a` | Focus rings |
| `--color-destructive` | `#e05252` | Errors / danger |

Accent soft (use inline): `rgba(138, 171, 122, 0.12)` = `bg-accent/12` in Tailwind.

### Typography
- **Headings**: `font-heading` → Cormorant Garamond (loaded via `next/font/google`, variable `--font-cormorant`)
- **Body**: `font-sans` → DM Sans (loaded via `next/font/google`, variable `--font-dm-sans`)
- Heading italic: `className="font-heading italic"` — used for the app name and page titles

### Glassmorphism utilities (Tailwind `@utility` classes)

| Class | Use for |
|---|---|
| `glass-card` | Content cards, panels |
| `glass-nav` | Sidebar, bottom nav |
| `glass-input` | Form inputs |
| `glass-button` | Secondary / ghost action buttons |

The gradient mesh background is a fixed `html::before` pseudo-element (`z-index: -1`) — glass elements blur against this rather than a flat colour.

### Tailwind v4 notes
- **No `tailwind.config.ts` is used for theme config.** All design tokens live in `@theme {}` inside `app/globals.css`.
- Custom utilities are defined with `@utility` (not `@layer utilities`).
- The PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`.
- `tailwind.config.ts` exists in the repo but is intentionally empty — kept only for editor tooling.

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
Fully implemented. Server component with `export const dynamic = "force-dynamic"`.

- **Welcome header**: Gold italic "Us, Intentionally" title + muted subtitle + accent stat pill showing `X of Y topics explored together` (a topic counts as complete only when **both** him and her have a rating for it)
- **Theme grid**: 2-column (desktop) / 1-column (mobile) grid of 6 `ThemeCard` components. Each shows icon, name, description, a 1px progress bar (width = avgScore / 10 × 100%), topics explored count, and a `glass-button` link to `/conversations?theme=[themeId]`
- **Recent Activity**: Last 5 ratings fetched via Supabase join (`ratings → topics(question)`). Shows score in a circular accent badge, topic question (2-line clamp), person display name from settings table, and relative time via `date-fns formatDistanceToNow`. Empty state shows a centred `✦` ornament
- **Skeleton**: `app/loading.tsx` mirrors the page layout with `animate-pulse` + `glass-card` shaped skeletons

Data fetched with `Promise.all` (5 parallel Supabase queries). Stats computed in JS — no N+1 queries.

---

## What is NOT built yet

- `/conversations` page — the main feature (browse themes → pick topic → rate + note via slider)
- `/progress` page — charts (Recharts) showing scores over time per theme
- `/settings` page — edit display names for him/her
- Authentication — there is none. The app is accessed directly; both people use the same device/browser or trust each other with the URL.
- Any server-side session logic — all DB calls use the Supabase anon key from the browser

---

## Key conventions

- All DB calls go through `lib/supabase.ts` (`import { supabase } from "@/lib/supabase"`)
- Use `@/` alias for all internal imports (configured in `tsconfig.json`)
- Client components that need browser APIs or hooks must have `"use client"` at the top
- Server components are the default — no `"use client"` unless needed
- Do not add authentication or multi-user logic — this is a private two-person app
- Do not create new colour tokens outside of `app/globals.css @theme` — use what exists
- Keep the glassmorphism restrained: every new surface should use `glass-card` or `glass-nav`, not raw background colours
