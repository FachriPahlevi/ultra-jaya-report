import { useState } from "react"
import Sidebar from "@/Components/Navigation/Sidebar"
import { LAYERS } from "@/lib/layers"

const SidebarOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return <div onClick={onClose} role="presentation" className={`fixed inset-0 ${LAYERS.sidebarOverlay} bg-slate-950/45 lg:hidden`} />
}

const MenuIcon = () => (
  <div className="flex flex-col gap-[3px]">
    <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
    <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
    <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
  </div>
)

const MobileHeader = ({ onToggleMenu }) => (
  <header className={`hidden h-13 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-2 sticky top-0 ${LAYERS.sticky} max-lg:flex min-[375px]:px-3`}>
    <button
      type="button"
      onClick={onToggleMenu}
      aria-label="Open navigation menu"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-primary"
    >
      <MenuIcon />
    </button>
    <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
      <span className="truncate text-right text-xs font-bold leading-tight text-[var(--foreground)] min-[375px]:text-[13px]">PT Ultrajaya Milk Industry</span>
      <img src="/img/logo/logo_uj.svg" className="h-7 w-7 shrink-0 object-contain" alt="Ultrajaya logo" />
    </div>
  </header>
)

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar sidebarOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      <SidebarOverlay isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[248px]">
        <MobileHeader onToggleMenu={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 px-3 py-3 min-[375px]:px-4 sm:px-5 sm:py-5 md:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
