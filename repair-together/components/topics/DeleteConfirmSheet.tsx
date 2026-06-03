"use client"

import { useEffect, useState } from "react"

type Props = {
  topicQuestion: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmSheet({ topicQuestion, onConfirm, onCancel }: Props) {
  const [visible, setVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleCancel() {
    if (deleting) return
    setVisible(false)
    setTimeout(onCancel, 260)
  }

  function handleConfirm() {
    setDeleting(true)
    onConfirm()
    // Parent handles async deletion and will unmount this component when done
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.55)",
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
          <p className="text-base font-medium text-foreground">Remove this topic?</p>
          <p
            className="text-sm text-muted-foreground leading-snug"
            style={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {topicQuestion}
          </p>

          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="w-full min-h-12 rounded-xl text-sm font-medium border
                         transition-colors duration-150 disabled:opacity-50
                         flex items-center justify-center gap-2"
              style={{
                color: "#c47a6a",
                borderColor: "rgba(196,122,106,0.45)",
                background: "rgba(196,122,106,0.10)",
              }}
            >
              {deleting ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "rgba(196,122,106,0.3)",
                      borderTopColor: "#c47a6a",
                    }}
                  />
                  Removing…
                </>
              ) : "Remove"}
            </button>

            <button
              onClick={handleCancel}
              disabled={deleting}
              className="w-full min-h-12 rounded-xl text-sm text-muted-foreground
                         border border-white/8 hover:text-foreground hover:bg-white/4
                         transition-colors duration-150 disabled:opacity-50"
            >
              Keep it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
