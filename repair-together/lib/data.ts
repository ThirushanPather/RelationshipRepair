import { supabase } from "@/lib/supabase"

// ─── Seed content ────────────────────────────────────────────────────────────

const THEMES: {
  name: string
  icon: string
  description: string
  sort_order: number
  topics: { question: string; difficulty: 1 | 2 | 3; sort_order: number }[]
}[] = [
  {
    name: "Connection & Communication",
    icon: "🔗",
    description: "The foundation — without this, nothing else can be rebuilt.",
    sort_order: 1,
    topics: [
      { question: "What's something you've been carrying lately that you haven't said out loud?", difficulty: 1, sort_order: 1 },
      { question: "When did you feel most connected to me during our relationship?", difficulty: 1, sort_order: 2 },
      { question: "What does a good conversation feel like to you?", difficulty: 1, sort_order: 3 },
      { question: "Was there ever a moment where you felt like you couldn't come to me with something? What made it that way?", difficulty: 2, sort_order: 4 },
      { question: "When things got hard between us, was your instinct to come toward me or pull back? Why?", difficulty: 2, sort_order: 5 },
      { question: "What's something you wanted from me that you never actually said?", difficulty: 2, sort_order: 6 },
      { question: "Do you feel like you fully let me in — or were you always holding something back?", difficulty: 3, sort_order: 7 },
      { question: "What does repair look like to you after a conflict? Have we ever actually done it?", difficulty: 3, sort_order: 8 },
      { question: "Is the kind of depth I need in conversation something you feel like you can genuinely grow toward?", difficulty: 3, sort_order: 9 },
    ],
  },
  {
    name: "Being Chosen",
    icon: "👑",
    description: "Feeling like a priority — not an option.",
    sort_order: 2,
    topics: [
      { question: "When did you feel most proud to be with me?", difficulty: 1, sort_order: 1 },
      { question: "What's something about us you used to look forward to?", difficulty: 1, sort_order: 2 },
      { question: "Do you feel like you were able to fully invest in us, or were you always being pulled in another direction?", difficulty: 2, sort_order: 3 },
      { question: "I often felt like I was waiting in line behind everything else in your life. Did you feel that dynamic too?", difficulty: 2, sort_order: 4 },
      { question: "I have introduced you to my family and friends. I haven't met a single person in your life. What has been in the way of that?", difficulty: 3, sort_order: 5 },
      { question: "What would it concretely look like for you to make me feel chosen — not in theory, but in practice?", difficulty: 3, sort_order: 6 },
      { question: "What needs to happen for your family to know about us? Can you give me a real timeline?", difficulty: 3, sort_order: 7 },
    ],
  },
  {
    name: "Effort & Reciprocity",
    icon: "🤝",
    description: "Is this mutual — or is one person still carrying it?",
    sort_order: 3,
    topics: [
      { question: "What's one thing I did that made you feel genuinely cared for?", difficulty: 1, sort_order: 1 },
      { question: "What's one thing you wish you had done differently in how you showed up for me?", difficulty: 1, sort_order: 2 },
      { question: "Do you think people can actually change the things about themselves that caused problems in a relationship? What would that look like for you?", difficulty: 2, sort_order: 3 },
      { question: "After a hard conversation or conflict — who usually came back first? How did that feel for each of us?", difficulty: 2, sort_order: 4 },
      { question: "I have been very patient and accommodating. I need to know you are actually trying, not just present. How do I know the difference?", difficulty: 3, sort_order: 5 },
      { question: "What does effort look like to you in a relationship — what does it actually feel like when someone is genuinely trying?", difficulty: 3, sort_order: 6 },
    ],
  },
  {
    name: "Individual Fullness",
    icon: "🌿",
    description: "Two full people make a healthy relationship — not one person filling the other's gaps.",
    sort_order: 4,
    topics: [
      { question: "What's something outside of work that genuinely excites you right now?", difficulty: 1, sort_order: 1 },
      { question: "Who do you turn to when you need support — outside of me?", difficulty: 1, sort_order: 2 },
      { question: "Do you feel like you have enough in your life outside of this relationship and work?", difficulty: 2, sort_order: 3 },
      { question: "I think you carried a lot of emotional weight without many places to put it. Do you think that affected us?", difficulty: 2, sort_order: 4 },
      { question: "I think I became responsible for filling a life that had very little else in it. Do you see that pattern? What would you do about it?", difficulty: 3, sort_order: 5 },
      { question: "What does a full, independent version of you actually look like — and are you moving toward that?", difficulty: 3, sort_order: 6 },
    ],
  },
  {
    name: "Physical Intimacy",
    icon: "🔥",
    description: "A real and legitimate need on both sides — requires honesty, not avoidance.",
    sort_order: 5,
    topics: [
      { question: "What does feeling close to someone feel like to you — what does it actually involve?", difficulty: 1, sort_order: 1 },
      { question: "When did you feel most comfortable and safe with me physically?", difficulty: 1, sort_order: 2 },
      { question: "Physical intimacy is one of the main ways I feel desired and connected. When it's absent I feel unwanted. How do you feel when I share that?", difficulty: 2, sort_order: 3 },
      { question: "What specifically makes you feel unsafe — is it pace, pressure, something else?", difficulty: 2, sort_order: 4 },
      { question: "I need to know we are moving toward something, not that intimacy is permanently off the table. Can we talk about what that looks like?", difficulty: 3, sort_order: 5 },
      { question: "What would need to be true — about us, about trust, about safety — for you to feel open to physical closeness again?", difficulty: 3, sort_order: 6 },
    ],
  },
  {
    name: "Future & Commitment",
    icon: "🔭",
    description: "Are we building toward something real — or just comfortable?",
    sort_order: 6,
    topics: [
      { question: "What does a relationship that's actually working feel like to you day to day?", difficulty: 1, sort_order: 1 },
      { question: "What are you hoping this feels like six months from now?", difficulty: 1, sort_order: 2 },
      { question: "What would make you feel like we were actually doing this differently this time — not just saying it?", difficulty: 2, sort_order: 3 },
      { question: "What does commitment look like to you right now — not in theory, but in how we actually show up?", difficulty: 2, sort_order: 4 },
      { question: "Long distance only works with intention. What does that actually require from both of us?", difficulty: 3, sort_order: 5 },
      { question: "If we are doing this, I need to know we are building toward being in the same place. What does that plan look like to you?", difficulty: 3, sort_order: 6 },
      { question: "What does the version of this relationship you actually want look like — and are you willing to say it out loud?", difficulty: 3, sort_order: 7 },
    ],
  },
]

const DEFAULT_SETTINGS = [
  { key: "name_him", value: "Him" },
  { key: "name_her", value: "Her" },
]

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedData(): Promise<{ message: string; skipped?: boolean }> {
  // Guard: skip if themes table already has data
  const { data: existing, error: checkError } = await supabase
    .from("themes")
    .select("id")
    .limit(1)

  if (checkError) throw new Error(`Check failed: ${checkError.message}`)

  if (existing && existing.length > 0) {
    return { message: "Database already seeded — skipped.", skipped: true }
  }

  // Insert themes and their topics
  for (const theme of THEMES) {
    const { data: insertedTheme, error: themeError } = await supabase
      .from("themes")
      .insert({
        name: theme.name,
        icon: theme.icon,
        description: theme.description,
        sort_order: theme.sort_order,
      })
      .select("id")
      .single()

    if (themeError) throw new Error(`Theme insert failed (${theme.name}): ${themeError.message}`)

    const { error: topicsError } = await supabase.from("topics").insert(
      theme.topics.map((t) => ({
        theme_id: insertedTheme.id,
        question: t.question,
        difficulty: t.difficulty,
        sort_order: t.sort_order,
      }))
    )

    if (topicsError) throw new Error(`Topics insert failed (${theme.name}): ${topicsError.message}`)
  }

  // Seed settings (only if key doesn't already exist)
  for (const setting of DEFAULT_SETTINGS) {
    const { data: existingSetting } = await supabase
      .from("settings")
      .select("id")
      .eq("key", setting.key)
      .maybeSingle()

    if (!existingSetting) {
      const { error } = await supabase.from("settings").insert(setting)
      if (error) throw new Error(`Settings insert failed (${setting.key}): ${error.message}`)
    }
  }

  return { message: `Seeded ${THEMES.length} themes and ${THEMES.reduce((n, t) => n + t.topics.length, 0)} topics.` }
}
