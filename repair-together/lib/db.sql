-- ─────────────────────────────────────────────────────────────
-- Repair Together — database schema
-- Run once in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────

-- themes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS themes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  icon        text,
  description text,
  sort_order  int,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes: allow all"
  ON themes FOR ALL
  USING (true)
  WITH CHECK (true);

-- topics ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id    uuid        REFERENCES themes(id) ON DELETE CASCADE,
  question    text        NOT NULL,
  difficulty  int         CHECK (difficulty IN (1, 2, 3)),
  sort_order  int,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics: allow all"
  ON topics FOR ALL
  USING (true)
  WITH CHECK (true);

-- ratings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid        REFERENCES topics(id) ON DELETE CASCADE,
  person   text        CHECK (person IN ('him', 'her')),
  score    int         CHECK (score >= 1 AND score <= 10),
  note     text,
  rated_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings: allow all"
  ON ratings FOR ALL
  USING (true)
  WITH CHECK (true);

-- settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key   text NOT NULL,
  value text
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings: allow all"
  ON settings FOR ALL
  USING (true)
  WITH CHECK (true);
