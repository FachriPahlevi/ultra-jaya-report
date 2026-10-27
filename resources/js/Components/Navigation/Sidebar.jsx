import React from "react"
import { usePage, Link } from "@inertiajs/react"
import { HiOutlineViewGrid, HiOutlineDocumentReport, HiOutlineMap, HiOutlineLightningBolt, HiOutlineCog, HiOutlineLogout } from "react-icons/hi"
import { LAYERS } from "@/lib/layers"

const NAV_ICONS = {
  dashboard: HiOutlineViewGrid,
  reports: HiOutlineDocumentReport,
  areas: HiOutlineMap,
  activities: HiOutlineLightningBolt,
  settings: HiOutlineCog,
}

const SidebarItem = ({ item, active, onClick }) => {
  if (!item?.icon) return null
  const Icon = NAV_ICONS[item.icon]

  if (!Icon) return null

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`
                relative mx-3 flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-colors duration-150
                ${
                  active
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)]"
                }
            `}
    >
      {active && <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-[var(--sidebar-primary)]" aria-hidden="true" />}
      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--sidebar-primary)]" : "opacity-60"}`} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

const Sidebar = ({ sidebarOpen, closeSidebar }) => {
  const { props, url } = usePage()
  const currentUser = props.auth?.user

  const isActive = (href) => {
    const path = href.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/"
    const currentPath = url.split("?")[0].replace(/\/$/, "") || "/"

    return path === "/" ? currentPath === "/" : currentPath === path || currentPath.startsWith(`${path}/`)
  }

  const getInitials = (name) =>
    name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "U"

  const getRoleName = () => {
    const roles = currentUser?.roles || []
    return roles[0] || "User"
  }

  const navItems = props.navItems ?? []

  return (
    <aside
      className={`
                w-[min(280px,88vw)] lg:w-[248px] bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)]
                fixed top-0 left-0 h-screen ${LAYERS.sidebar} flex flex-col
                transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
    >
      <div className="flex min-h-20 items-center gap-3 border-b border-[var(--sidebar-border)] px-5 py-4">
        <img src="/img/logo/logo_uj.svg" className="h-11 w-11 shrink-0 object-contain" alt="Ultrajaya logo" />
        <div className="min-w-0">
          <span className="block text-[13px] font-bold leading-[1.35] text-[var(--sidebar-foreground)]">PT Ultrajaya Milk Industry</span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Internal Ticketing</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto py-5" aria-label="Main navigation">
        <p className="mb-2 px-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Main menu</p>
        {navItems.map((item) => (
          <SidebarItem key={item.href} item={item} active={isActive(item.href)} onClick={closeSidebar} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-[var(--sidebar-border)] px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-muted)] px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sidebar-accent)] text-[11px] font-bold text-[var(--sidebar-primary)]">
            {getInitials(currentUser?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-[var(--sidebar-foreground)] truncate">{currentUser?.name}</div>
            <div className="text-[11px] text-[var(--muted-foreground)] truncate uppercase tracking-wide">{getRoleName()}</div>
          </div>
        </div>

        <Link
          href="/logout"
          method="post"
          as="button"
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-medium text-[var(--destructive)] transition-colors hover:bg-red-50"
        >
          <HiOutlineLogout className="w-4 h-4" />
          Log out
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
