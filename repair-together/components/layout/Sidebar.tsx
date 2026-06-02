"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "./nav-config"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="glass-nav hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] z-40
                 border-r border-r-[rgba(138,171,122,0.1)]"
    >
      {/* App name */}
      <div className="px-6 pt-8 pb-6">
        <span className="font-heading italic text-gold text-[1.35rem] leading-snug tracking-wide">
          Us, Intentionally
        </span>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[rgba(138,171,122,0.1)]" />

      {/* Nav links */}
      <nav className="flex flex-col gap-1 px-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200 group
                          ${active
                            ? "bg-accent/10 text-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                          }`}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2 : 1.5}
                className="shrink-0 transition-all duration-200"
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
