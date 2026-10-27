import { formatDate as formatLocalizedDate } from "@/lib/format.ts"

const formatDate = (date) => formatLocalizedDate(date, "en-US")

function PhotoThumbnail({ src, label }) {
  return src ? (
    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:h-11 md:w-11 xl:h-12 xl:w-12" title={label}>
      <img src={`/storage/${src}`} alt={label} loading="lazy" className="h-full w-full object-cover" />
    </span>
  ) : null
}

function ReportStatus({ report }) {
  const isReport = report.category_snapshot === "REPORT"
  const isClosed = report.status === "closed"
  const label = isReport ? "Report" : isClosed ? "Closed" : "Open"
  const color = isReport
    ? "border-slate-200 bg-slate-50 text-slate-700"
    : isClosed
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-blue-200 bg-blue-50 text-blue-700"

  return (
    <span className="flex min-w-0 flex-col items-end gap-1.5 text-right xl:items-start xl:text-left">
      <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>
      {isClosed && report.closed_at && <span className="text-[11px] leading-4 text-muted-foreground">{formatDate(report.closed_at)}</span>}
    </span>
  )
}

export default function ReportCard({ report, number, isSelected, onSelect }) {
  const activity = report.sub_activity?.name ?? report.activity_type?.name ?? "–"
  const photos = [report.photo_before, report.photo_after].filter(Boolean)

  return (
    <button
      type="button"
      onClick={() => onSelect(report)}
      aria-label={`View report ${number}: ${report.issue || activity}`}
      aria-current={isSelected ? "true" : undefined}
      className={`group relative grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-3 border-b border-border/70 px-4 py-4 text-left outline-none transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_6.5rem] md:gap-x-5 md:px-6 xl:grid-cols-[2.5rem_minmax(0,2.2fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.1fr)_7.5rem_6.5rem] xl:items-start xl:gap-4 xl:px-5 ${isSelected ? "bg-blue-50/50" : "bg-card"}`}
    >
      <span className="hidden pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground xl:block">{number}</span>

      <span className="col-span-2 block min-w-0 pr-20 md:col-span-1 md:col-start-1 md:row-start-1 md:pr-0 xl:col-start-auto xl:row-start-auto">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground xl:hidden">{report.category_snapshot === "REPORT" ? "Observation" : "Finding"}</span>
        <span className="line-clamp-2 break-words text-[13px] font-semibold leading-5 text-foreground sm:text-sm">{report.issue || "No details provided"}</span>
        <span className="mt-1 block text-xs tabular-nums text-muted-foreground">{formatDate(report.created_at)}</span>
      </span>

      <span className="col-span-2 block min-w-0 md:col-span-1 md:col-start-2 md:row-start-1 xl:col-start-auto xl:row-start-auto">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground xl:hidden">Reporter</span>
        <span className="block truncate text-[13px] font-medium text-foreground" title={report.author?.name ?? ""}>{report.author?.name ?? "–"}</span>
        {report.author?.role && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{report.author.role.replaceAll("_", " ")}</span>}
      </span>

      <span className="block min-w-0 md:col-start-1 md:row-start-2 xl:col-start-auto xl:row-start-auto">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground xl:hidden">Location</span>
        <span className="block truncate text-[13px] text-foreground" title={`${report.area?.area ?? ""}${report.sub_area?.name ? ` / ${report.sub_area.name}` : ""}`}>{report.area?.area ?? "–"}</span>
        {report.sub_area?.name && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{report.sub_area.name}</span>}
      </span>

      <span className="block min-w-0 md:col-start-2 md:row-start-2 xl:col-start-auto xl:row-start-auto">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground xl:hidden">Activity</span>
        <span className="line-clamp-2 break-words text-[13px] leading-5 text-foreground" title={activity}>{activity}</span>
      </span>

      <span className={`${photos.length ? "flex" : "hidden md:flex"} min-w-0 items-center gap-1.5 md:col-start-3 md:row-start-2 xl:col-start-auto xl:row-start-auto`}>
        {photos.length ? (
          <>
            <PhotoThumbnail src={report.photo_before} label="Before photo" />
            <PhotoThumbnail src={report.photo_after} label="After photo" />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No photos</span>
        )}
      </span>

      <span className="absolute right-4 top-4 md:static md:col-start-3 md:row-start-1 md:self-start xl:col-start-auto xl:row-start-auto">
        <ReportStatus report={report} />
      </span>
    </button>
  )
}
