"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "./nav-config"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40
                 border-t border-border
                 flex items-stretch"
      style={{
        background: "color-mix(in srgb, var(--color-surface) 88%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3
                        min-h-[60px] text-[11px] font-medium tracking-wide
                        transition-all duration-200 active:scale-95
                        ${active ? "text-accent" : "text-muted-foreground"}`}
          >
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.5}
              className="shrink-0 transition-all duration-200"
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
