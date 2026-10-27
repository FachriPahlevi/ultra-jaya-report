import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import InputText from "@/Components/Input/InputText"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "")
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function displayDate(value, locale) {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date) : ""
}

export default function InputDate({ id, label, value = "", onChange, min, max, required = false, disabled = false, error, placeholder, locale = "en-US", className = "" }) {
  const isIndonesian = locale.startsWith("id")
  const weekdays = isIndonesian ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] : WEEKDAYS
  const generatedId = useId()
  const fieldId = id || generatedId
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640)
  const [month, setMonth] = useState(() => {
    const date = parseDate(value) || new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [position, setPosition] = useState(null)
  const calendarRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    document.getElementById(fieldId)?.focus()
  }, [fieldId])

  const openCalendar = () => {
    if (disabled) return
    if (open) {
      close()
      return
    }
    const date = parseDate(value) || new Date()
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setMobile(window.innerWidth < 640)
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) return undefined
    const updatePosition = () => {
      const isMobile = window.innerWidth < 640
      setMobile(isMobile)
      if (isMobile) return
      const rect = document.getElementById(fieldId)?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(344, window.innerWidth - 24)
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
      const height = calendarRef.current?.offsetHeight || 390
      const top = rect.bottom + height + 8 <= window.innerHeight || rect.top < height + 8 ? rect.bottom + 6 : rect.top - height - 6
      setPosition({ top, left, width })
    }
    updatePosition()
    const observer = new ResizeObserver(updatePosition)
    const field = document.getElementById(fieldId)
    if (field) observer.observe(field)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [fieldId, open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        close()
      }
    }
    const onOutsideClick = (event) => {
      if (!mobile && !calendarRef.current?.contains(event.target) && !document.getElementById(fieldId)?.contains(event.target)) close()
    }
    document.addEventListener("keydown", onKeyDown, true)
    document.addEventListener("pointerdown", onOutsideClick)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      document.removeEventListener("pointerdown", onOutsideClick)
    }
  }, [close, fieldId, mobile, open])

  const selectDate = (date) => {
    onChange({ target: { value: toIsoDate(date) } })
    close()
  }

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const leadingDays = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const today = toIsoDate(new Date())
  const withinRange = (date) => (!min || date >= min) && (!max || date <= max)

  const calendar = (
    <div ref={calendarRef} role="dialog" aria-label={isIndonesian ? `Kalender ${label || "tanggal"}` : `${label || "Date"} calendar`} className={`w-full overflow-y-auto bg-card p-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl sm:p-3 ${mobile ? "max-h-[85dvh] rounded-t-2xl border-t border-border" : "rounded-xl border border-border"}`} style={mobile ? undefined : { width: position?.width }}>
      {mobile && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />}
      <div className="mb-3 flex items-center justify-between gap-2 px-3 sm:px-1">
        <p className="text-sm font-semibold text-foreground">{new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label={isIndonesian ? "Bulan sebelumnya" : "Previous month"} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label={isIndonesian ? "Bulan berikutnya" : "Next month"} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><ChevronRight className="h-4 w-4" /></button>
          {mobile && <button type="button" onClick={close} aria-label={isIndonesian ? "Tutup kalender" : "Close calendar"} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><X className="h-4 w-4" /></button>}
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground sm:px-1">
        {weekdays.map((day) => <span key={day} className="py-2">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 sm:px-1">
        {Array.from({ length: leadingDays }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, monthIndex, index + 1)
          const iso = toIsoDate(date)
          const selected = iso === value
          return <button key={iso} type="button" disabled={!withinRange(iso)} onClick={() => selectDate(date)} aria-label={new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)} aria-pressed={selected} className={`min-h-11 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground/40 ${selected ? "bg-primary text-primary-foreground" : iso === today ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-foreground hover:bg-muted"}`}>{index + 1}</button>
        })}
      </div>
      <div className="mt-3 flex gap-2 border-t border-border px-3 pt-3 sm:px-0">
        <button type="button" disabled={!withinRange(today)} onClick={() => selectDate(new Date())} className="min-h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40">{isIndonesian ? "Hari ini" : "Today"}</button>
        {!required && <button type="button" onClick={() => { onChange({ target: { value: "" } }); close() }} className="min-h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted">{isIndonesian ? "Hapus" : "Clear"}</button>}
      </div>
    </div>
  )

  return (
    <>
      <InputText id={fieldId} label={label} value={displayDate(value, locale)} onChange={() => {}} onClick={openCalendar} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openCalendar() } }} icon={CalendarDays} placeholder={placeholder ?? (isIndonesian ? "Pilih tanggal" : "Select date")} required={required} disabled={disabled} error={error} className={`min-w-0 ${className}`} readOnly aria-haspopup="dialog" aria-expanded={open} autoComplete="off" />
      {open && createPortal(mobile ? <div className="fixed inset-0 z-[210] flex items-end"><button type="button" aria-label={isIndonesian ? "Tutup kalender" : "Close calendar"} onClick={close} className="absolute inset-0 bg-slate-950/55" /><div className="relative w-full">{calendar}</div></div> : <div className="fixed z-[110]" style={position}>{calendar}</div>, document.body)}
    </>
  )
}
