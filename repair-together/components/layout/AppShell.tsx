import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-[220px] pb-[60px] md:pb-0 min-h-dvh">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
