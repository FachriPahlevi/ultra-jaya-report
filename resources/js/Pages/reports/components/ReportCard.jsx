import { useState } from "react"
import { formatDate } from "@/lib/format.ts"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import { ChevronDown, ChevronUp } from "lucide-react"

const avatarColors = ["bg-blue-700", "bg-slate-700", "bg-blue-800", "bg-slate-600"]

function getInitials(name) {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function getAvatarColor(name) {
  if (!name) return avatarColors[0]
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

function PhotoSlot({ src, label }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {src ? (
        <ExpandableImage src={`/storage/${src}`} alt={label} className="h-16 w-16 cursor-pointer rounded-lg border border-border object-cover transition-opacity hover:opacity-80" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
          <span className="text-[10px] text-muted-foreground">Tanpa foto</span>
        </div>
      )}
    </div>
  )
}

function RichText({ text, maxLines = 3, stopPropagation = true }) {
  const [expanded, setExpanded] = useState(false)

  if (!text || text.trim() === "" || text === "-") {
    return <span className="text-[12px] text-muted-foreground">–</span>
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const isList = lines.length > 1 && lines.every((l) => /^[-•*]|^\d+[.)]\s/.test(l))
  const cleanLine = (l) => l.replace(/^[-•*]\s*|^\d+[.)]\s*/, "")
  const visibleLines = expanded ? lines : lines.slice(0, maxLines)
  const hasMore = lines.length > maxLines

  const toggle = (e) => {
    if (stopPropagation) e.stopPropagation()
    setExpanded((v) => !v)
  }

  if (isList) {
    return (
      <div>
        <ul className="space-y-1 m-0 p-0 list-none">
          {visibleLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground">
              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>{cleanLine(line)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button type="button" onClick={toggle} className="mt-1.5 flex min-h-8 items-center gap-1 text-[11px] font-semibold text-primary">
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Tampilkan lebih sedikit
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> +{lines.length - maxLines} lainnya
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  const fullText = lines.join(" ")
  const isLong = fullText.length > 100

  return (
    <div>
      <p className="whitespace-pre-wrap break-words text-[12.5px] leading-snug text-foreground">{expanded || !isLong ? fullText : fullText.slice(0, 100) + "…"}</p>
      {isLong && (
        <button type="button" onClick={toggle} className="mt-1 flex min-h-8 items-center gap-1 text-[11px] font-semibold text-primary">
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Lebih sedikit
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Selengkapnya
            </>
          )}
        </button>
      )}
    </div>
  )
}

function ContentSection({ label, children }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default function ReportCard({ report, isSelected, onSelect }) {
  const isSolved = report.status === "closed"
  const activityLabel = report.sub_activity?.name ?? report.activity_type?.name ?? "-"
  const hasPhotos = report.photo_before || report.photo_after
  const hasActivity = report.activity && report.activity !== "-"
  const hasIssue = report.issue && report.issue !== "-"
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(report)
    }
  }

  return (
    <>
      <div
        onClick={() => onSelect(report)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={`cursor-pointer overflow-hidden rounded-xl border bg-card transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${isSelected ? "border-primary bg-blue-50/20" : "border-border hover:border-slate-300"}`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold ${getAvatarColor(report.author?.name)}`}>
              {getInitials(report.author?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-tight text-foreground">{report.author?.name ?? "-"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {report.author?.role && <span>{report.author.role}</span>}
                    <span>{formatDate(report.created_at)}</span>
                    {report.updated_at && report.updated_at !== report.created_at && <span className="text-gray-300">↑ {formatDate(report.updated_at)}</span>}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-white text-slate-600">{report.area?.area ?? "-"}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {isSolved ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Selesai</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Terbuka</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(hasActivity || hasIssue) && (
            <div className="mt-3 flex flex-col gap-3">
              {hasActivity && (
                <ContentSection label="Aktivitas">
                  <RichText text={`${activityLabel}${report.activity ? `\n${report.activity}` : ""}`} maxLines={3} />
                </ContentSection>
              )}
              {hasIssue && (
                <ContentSection label="Kendala">
                  <RichText text={report.issue} maxLines={3} />
                </ContentSection>
              )}
            </div>
          )}

          {hasPhotos && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
              <PhotoSlot src={report.photo_before} label="Sebelum" />
              <PhotoSlot src={report.photo_after} label="Sesudah" />
            </div>
          )}

          {isSolved && report.closed_at && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Ditutup pada</span>
              <span className="text-[11px] font-semibold text-slate-700">{formatDate(report.closed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
