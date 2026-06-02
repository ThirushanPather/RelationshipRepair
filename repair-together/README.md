# Us, Intentionally

A private relationship-repair app for two people. It guides both of you through structured conversation topics organised by theme — Communication, Being Chosen, Physical Intimacy, and more — lets each person rate how they feel on a 1–10 slider, adds optional notes, and shows progress and analytics over time.

This is a personal app, not a product. There are exactly two users and no authentication — it is meant to be accessed together on a shared device or between two people who trust each other with the URL.

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens in CSS, not `tailwind.config.ts`)
- **Supabase** (PostgreSQL, anon key, RLS enabled)
- **Recharts** (progress charts)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd repair-together
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `lib/db.sql` — this creates the four tables (`themes`, `topics`, `ratings`, `settings`) with RLS policies
3. From **Project Settings → API**, copy your **Project URL** and **anon public** key

### 3. Add environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

A template is provided at `.env.local.example`.

### 4. Seed the database

Start the dev server, then send a POST request to the seed endpoint:

```bash
npm run dev
curl -X POST http://localhost:3000/api/seed
```

Or visit `http://localhost:3000/api/seed` and send a POST from a tool like Postman. This is idempotent — it skips if data already exists.

The seed inserts **6 themes**, **41 topics**, and two default settings rows (`name_him = "Him"`, `name_her = "Her"`).

### 5. Customise names

Go to **Settings** in the app and update the display names for both people. These appear on sliders and charts throughout the app.

---

## Running locally

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build locally
npx tsc --noEmit   # type-check only
```

---

## Deploying to Vercel

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the two environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js and configures everything

After deployment, confirm the app is live by hitting the health endpoint:

```
GET https://<your-app>.vercel.app/api/health
→ { "status": "ok", "timestamp": "..." }
```

---

## Project structure

```
repair-together/
├── app/
│   ├── api/
│   │   ├── health/route.ts     GET  — deployment health check
│   │   └── seed/route.ts       POST — seed DB (idempotent)
│   ├── conversations/          Main feature — rate topics by theme
│   ├── progress/               Analytics — charts and timeline
│   ├── settings/               Names, reset, CSV export
│   ├── globals.css             Design tokens + glass utilities
│   ├── layout.tsx              Root layout
│   └── page.tsx                Home — theme grid + recent activity
├── components/layout/          AppShell, Sidebar, BottomNav
├── components/ui/              shadcn components
├── lib/
│   ├── data.ts                 seedData() — themes, topics, settings
│   ├── db.sql                  Run once in Supabase SQL editor
│   └── supabase.ts             Supabase client
└── types/index.ts              Theme, Topic, Rating interfaces
```

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Both variables are exposed to the browser (they are public by design — Supabase's anon key is safe to expose when RLS is properly configured).
