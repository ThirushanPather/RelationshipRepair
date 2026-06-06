"use client"

import { useEffect, useState } from "react"

type TopicRow = {
  id: string
  theme_id: string
  question: string
  difficulty: 1 | 2 | 3
  sort_order: number
  added_by?: string | null
}

type ThemeRow = {
  id: string
  name: string
  icon: string
  description: string
  sort_order: number
}

type Props = {
  mode: "add" | "edit"
  topic?: TopicRow
  themeId?: string
  themes: ThemeRow[]
  nameHim: string
  nameHer: string
  onSave: (topic: TopicRow) => void
  onClose: () => void
}

const DIFFICULTY_META = {
  1: { label: "Easy",   color: "#8aab7a" },
  2: { label: "Medium", color: "#c9a96e" },
  3: { label: "Hard",   color: "#c47a6a" },
} as const

export function TopicFormSheet({ mode, topic, themeId, themes, nameHim, nameHer, onSave, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const [question, setQuestion] = useState(topic?.question ?? "")
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(topic?.difficulty ?? 1)
  const [selectedThemeId, setSelectedThemeId] = useState(
    themeId ?? topic?.theme_id ?? themes[0]?.id ?? ""
  )
  const [addedBy, setAddedBy] = useState<"him" | "her" | null>(null)
  const [fieldError, setFieldError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  async function handleSubmit() {
    if (!question.trim()) {
      setFieldError("Please enter a topic question.")
      return
    }
    setFieldError("")
    setSaving(true)
    try {
      const url = mode === "edit" ? `/api/topics/${topic!.id}` : "/api/topics"
      const method = mode === "edit" ? "PATCH" : "POST"
      const body = mode === "edit"
        ? { question: question.trim(), difficulty }
        : { theme_id: selectedThemeId, question: question.trim(), difficulty, added_by: addedBy }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setFieldError(data.error ?? "Something went wrong.")
        setSaving(false)
        return
      }
      onSave(data as TopicRow)
      setVisible(false)
      setTimeout(onClose, 260)
    } catch {
      setFieldError("Something went wrong.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "opacity 250ms ease-out",
          opacity: visible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full glass-card rounded-t-3xl flex flex-col"
        style={{
          maxHeight: "85dvh",
          transition: "transform 250ms ease-out",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          background: "color-mix(in srgb, var(--color-surface) 92%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
          />
        </div>

        {/* Scrollable content — stays visible when keyboard opens */}
        <div className="overflow-y-auto px-5 pb-8 pt-2 flex flex-col gap-5">
          <h2 className="font-heading italic text-xl text-foreground">
            {mode === "edit" ? "Edit Topic" : "Add Topic"}
          </h2>

          {/* Question */}
          <div className="flex flex-col gap-1.5">
            <textarea
              rows={2}
              value={question}
              onChange={e => { setQuestion(e.target.value); setFieldError("") }}
              placeholder="What would you like to explore together?"
              disabled={saving}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-foreground
                         placeholder:text-muted-foreground/40 resize-none
                         focus:ring-1 focus:ring-accent/30 transition-colors
                         disabled:opacity-50"
            />
            {fieldError && (
              <p className="text-xs" style={{ color: "#c47a6a" }}>{fieldError}</p>
            )}
          </div>

          {/* Difficulty pills */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Difficulty
            </p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(d => {
                const { label, color } = DIFFICULTY_META[d]
                const active = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={saving}
                    className="flex-1 min-h-11 rounded-xl text-sm font-medium border
                               transition-colors duration-150 disabled:opacity-50"
                    style={{
                      color: active ? color : "var(--color-muted-foreground)",
                      borderColor: active ? `${color}60` : "rgba(255,255,255,0.08)",
                      background: active ? `${color}18` : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Theme selector — add mode only */}
          {mode === "add" && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Theme
              </p>
              <select
                value={selectedThemeId}
                onChange={e => setSelectedThemeId(e.target.value)}
                disabled={saving}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm text-foreground
                           focus:ring-1 focus:ring-accent/30 transition-colors
                           disabled:opacity-50"
                style={{ colorScheme: "dark" }}
              >
                {themes.map(t => (
                  <option
                    key={t.id}
                    value={t.id}
                    style={{ background: "var(--color-surface2)", color: "var(--color-foreground)" }}
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Added by — add mode only */}
          {mode === "add" && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Added by
              </p>
              <div className="flex gap-2">
                {(["him", "her"] as const).map(person => {
                  const name = person === "him" ? nameHim : nameHer
                  const active = addedBy === person
                  return (
                    <button
                      key={person}
                      onClick={() => setAddedBy(active ? null : person)}
                      disabled={saving}
                      className="flex-1 min-h-11 rounded-xl text-sm border
                                 transition-colors duration-150 disabled:opacity-50"
                      style={{
                        color: active ? "var(--color-accent)" : "var(--color-muted-foreground)",
                        borderColor: active
                          ? "color-mix(in srgb, var(--color-accent) 40%, transparent)"
                          : "rgba(255,255,255,0.08)",
                        background: active
                          ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                          : "rgba(255,255,255,0.04)",
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full min-h-12 glass-button rounded-xl text-sm text-accent
                       hover:bg-accent/25 transition-colors duration-150
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
                    borderTopColor: "var(--color-accent)",
                  }}
                />
                Saving…
              </>
            ) : mode === "edit" ? "Save Topic" : "Add Topic"}
          </button>
        </div>
      </div>
    </div>
  )
}
