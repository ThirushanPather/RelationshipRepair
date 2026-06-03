"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { PALETTES, applyPalette } from "@/lib/palettes"

// Runs once on mount. Reads the stored palette from Supabase and, if it
// differs from localStorage, applies it — keeping all devices in sync.
export function PaletteSync() {
  useEffect(() => {
    async function sync() {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "ui-palette")
          .limit(1)
          .maybeSingle()

        if (!data?.value) return

        const local = localStorage.getItem("ui-palette")
        if (data.value === local) return

        const palette = PALETTES.find(p => p.key === data.value)
        if (!palette) return

        applyPalette(palette)
        localStorage.setItem("ui-palette", data.value)
      } catch {
        // Silently ignore — the inline script already applied the local palette
      }
    }
    sync()
  }, [])

  return null
}
