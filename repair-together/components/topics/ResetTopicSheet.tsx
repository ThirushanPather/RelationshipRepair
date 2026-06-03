"use client"

import { useEffect, useState } from "react"

type Props = {
  topicQuestion: string
  onConfirm: () => void
  onCancel: () => void
}

export function ResetTopicSheet({ topicQuestion, onConfirm, onCancel }: Props) {
  const [visible, setVisible] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleCancel() {
    if (resetting) return
    setVisible(false)
    setTimeout(onCancel, 260)
  }

  function handleConfirm() {
    setResetting(true)
    onConfirm()
    // Parent handles async reset and will unmount this component when done
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
        onClick={handleCancel}
      />

      {/* Sheet */}
      <div
        className="relative w-full glass-card rounded-t-3xl"
        style={{
          transition: "transform 250ms ease-out",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          background: "color-mix(in srgb, var(--color-surface) 92%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
          />
        </div>

        <div className="px-5 pb-8 pt-2 flex flex-col gap-3">
          <p className="text-base font-medium text-foreground">Reset this conversation?</p>

          <p
            className="text-sm italic text-muted-foreground leading-snug"
            style={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {topicQuestion}
          </p>

          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This will remove all scores and notes for this topic. The topic itself won&apos;t be deleted.
          </p>

          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={handleConfirm}
              disabled={resetting}
              className="w-full min-h-12 rounded-xl text-sm font-medium border
                         transition-colors duration-150 disabled:opacity-50
                         flex items-center justify-center gap-2"
              style={{
                color: "#c47a6a",
                borderColor: "rgba(196,122,106,0.45)",
                background: "rgba(196,122,106,0.10)",
              }}
            >
              {resetting ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "rgba(196,122,106,0.3)",
                      borderTopColor: "#c47a6a",
                    }}
                  />
                  Resetting…
                </>
              ) : "Reset scores"}
            </button>

            <button
              onClick={handleCancel}
              disabled={resetting}
              className="w-full min-h-12 rounded-xl text-sm text-muted-foreground
                         border border-white/8 hover:text-foreground hover:bg-white/4
                         transition-colors duration-150 disabled:opacity-50"
            >
              Keep scores
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
