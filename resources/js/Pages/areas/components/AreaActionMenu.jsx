import { createPortal } from "react-dom"
import { useEffect, useId, useRef, useState } from "react"
import { HiOutlineDotsVertical } from "react-icons/hi"

export default function AreaActionMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    const positionMenu = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const height = menuRef.current?.offsetHeight ?? items.length * 44 + 12
      setPosition({ top: Math.max(8, rect.bottom + height + 6 > window.innerHeight ? rect.top - height - 6 : rect.bottom + 6), right: Math.max(12, window.innerWidth - rect.right) })
    }
    const closeOutside = (event) => {
      if (!buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus() }
    }
    positionMenu()
    document.addEventListener("mousedown", closeOutside)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", positionMenu)
    window.addEventListener("scroll", positionMenu, true)
    return () => {
      document.removeEventListener("mousedown", closeOutside)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", positionMenu)
      window.removeEventListener("scroll", positionMenu, true)
    }
  }, [open, items.length])

  if (!items.length) return null
  return (
    <>
      <button ref={buttonRef} type="button" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1">
        <HiOutlineDotsVertical className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={menuId} role="menu" aria-label={`Actions for ${label}`} style={position} className="fixed z-[80] min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10">
          {items.map(({ label: itemLabel, icon: Icon, action, danger }) => (
            <button key={itemLabel} type="button" role="menuitem" onClick={() => { setOpen(false); action() }} className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium outline-none ${danger ? "text-red-700 hover:bg-red-50 focus-visible:bg-red-50" : "text-slate-700 hover:bg-slate-50 focus-visible:bg-blue-50"}`}>
              <Icon className="h-4 w-4" />{itemLabel}
            </button>
          ))}
        </div>, document.body,
      )}
    </>
  )
}
