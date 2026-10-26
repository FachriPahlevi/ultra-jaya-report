import { createPortal } from "react-dom"
import { useEffect, useId, useRef, useState } from "react"
import { HiOutlineDotsVertical, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash, HiOutlineUserAdd } from "react-icons/hi"
import { Layers3 } from "lucide-react"

export function ScopeAccess({ activity, compact = false, chips = false }) {
  const description = activity.description?.trim()
  const area = description?.match(/(?:^|\|)\s*Area:\s*([^|]+)/i)?.[1]?.trim()
  const role = description?.match(/(?:^|\|)\s*User Role:\s*(.+)$/i)?.[1]?.trim()

  if (chips && (area || role)) {
    const labels = [
      area && (area.toLowerCase() === "all" ? "Semua Area" : area),
      ...(role
        ? role
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : []),
    ].filter(Boolean)
    return (
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <span key={label} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold leading-4 text-slate-700">
            {label}
          </span>
        ))}
      </div>
    )
  }

  if (compact && (area || role)) {
    return <p className="text-xs leading-4 text-slate-500">{role || area}</p>
  }

  if (area || role) {
    return (
      <dl className={`flex min-w-0 flex-wrap gap-x-4 gap-y-1.5 ${compact ? "text-xs" : "text-[13px]"}`}>
        {area && (
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Area</dt>
            <dd className="min-w-0 text-slate-700">{area}</dd>
          </div>
        )}
        {role && (
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Peran</dt>
            <dd className="min-w-0 text-slate-700">{role}</dd>
          </div>
        )}
      </dl>
    )
  }

  return (
    <div className="min-w-0">
      <p className={`${compact ? "line-clamp-2 text-xs" : "max-w-xl text-sm"} leading-5 text-slate-600`}>{description || "Belum ada cakupan yang dicatat."}</p>
    </div>
  )
}

export function ActivityActions({ activity, canEdit, canDelete, canAssignManager, canAssignSupervisor, onAddSub, onAssignUsers, onEdit, onDelete }) {
  const canAddSub = canEdit && !activity.parent_id && activity.is_active
  const canAssignUsers = (!activity.parent_id && canAssignManager) || (activity.parent_id && canAssignSupervisor)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = menuRef.current?.offsetHeight ?? 152
      const openUpward = rect.bottom + menuHeight + 8 > window.innerHeight
      setPosition({ top: openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6, right: Math.max(12, window.innerWidth - rect.right) })
    }
    const closeFromOutside = (event) => {
      if (!buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    updatePosition()
    document.addEventListener("mousedown", closeFromOutside)
    document.addEventListener("keydown", handleKey)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      document.removeEventListener("mousedown", closeFromOutside)
      document.removeEventListener("keydown", handleKey)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])

  if (!canAddSub && !canAssignUsers && !canEdit && !canDelete) return null
  const runAction = (action) => {
    setOpen(false)
    action(activity)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={`Aksi untuk ${activity.name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
      >
        <HiOutlineDotsVertical className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Menu aksi ${activity.name}`}
            style={{ top: position.top, right: position.right }}
            className="fixed z-[80] min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10"
          >
            {canAddSub && (
              <button
                role="menuitem"
                type="button"
                onClick={() => runAction(onAddSub)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:text-blue-800"
              >
                <HiOutlinePlus className="h-4 w-4" />
                Tambah sub-aktivitas
              </button>
            )}
            {canAssignUsers && (
              <button
                role="menuitem"
                type="button"
                onClick={() => runAction(onAssignUsers)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:text-blue-800"
              >
                <HiOutlineUserAdd className="h-4 w-4" />
                {activity.parent_id ? "Atur SPV" : "Atur manager"}
              </button>
            )}
            {canEdit && (
              <button
                role="menuitem"
                type="button"
                onClick={() => runAction(onEdit)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:text-blue-800"
              >
                <HiOutlinePencil className="h-4 w-4" />
                Ubah aktivitas
              </button>
            )}
            {canDelete && (
              <button
                role="menuitem"
                type="button"
                onClick={() => runAction(onDelete)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:bg-red-50"
              >
                <HiOutlineTrash className="h-4 w-4" />
                Hapus aktivitas
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export function EmptyState({ hasSearch = false }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
        <Layers3 className="h-5 w-5" />
      </div>
      <p className="text-base font-semibold text-slate-900">{hasSearch ? "Aktivitas tidak ditemukan" : "Belum ada aktivitas"}</p>
      <p className="mt-1.5 text-sm text-slate-500">{hasSearch ? "Coba kata kunci lain atau hapus pencarian." : "Aktivitas baru akan muncul setelah ditambahkan."}</p>
    </div>
  )
}
