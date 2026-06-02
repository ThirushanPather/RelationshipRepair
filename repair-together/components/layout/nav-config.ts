import { Home, MessageCircle, BarChart2, Settings } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/",              label: "Home",          icon: Home          },
  { href: "/conversations", label: "Conversations", icon: MessageCircle },
  { href: "/progress",      label: "Progress",      icon: BarChart2     },
  { href: "/settings",      label: "Settings",      icon: Settings      },
]
