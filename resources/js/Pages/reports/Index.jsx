import { Head } from "@inertiajs/react"
import AppLayout from "@/Layouts/AppLayout"
import { formatDate } from "@/lib/format.ts"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import ReportForm from "@/Pages/reports/components/ReportForm"
import CloseTicketForm from "@/Pages/reports/components/CloseTicketForm"
import ExportForm from "@/Pages/reports/components/ExportReportForm"
import ReportCard from "@/Pages/reports/components/ReportCard"
import Pagination from "@/Components/Navigation/Pagination"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import { useReports } from "@/Pages/reports/hooks/useReports"
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi"
import { CalendarClock, File, FileText, Layers3, MapPin, StickyNote, UserRound, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { LAYERS } from "@/lib/layers"
import PageHeader from "@/Components/Layout/PageHeader"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const RichText = ({ text, maxLines = 3 }) => {
  const [expanded, setExpanded] = useState(false)
  if (!text || text === "-") return <span className="text-muted-foreground text-[12px]">–</span>
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const isList = lines.length > 1 && lines.every((l) => /^[-•*]|^\d+[.)]\s/.test(l))
  const cleanLine = (l) => l.replace(/^[-•*]\s*|^\d+[.)]\s*/, "")
  const visibleLines = expanded ? lines : lines.slice(0, maxLines)
  const hasMore = lines.length > maxLines
  if (isList) {
    return (
      <div className="space-y-0.5">
        <ul className="space-y-0.5 list-none m-0 p-0">
          {visibleLines.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-foreground leading-snug">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span>{cleanLine(line)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> +{lines.length - maxLines} more
              </>
            )}
          </button>
        )}
      </div>
    )
  }
  const fullText = lines.join(" ")
  const isLong = fullText.length > 120 || lines.length > maxLines
  const shortText = fullText.slice(0, 120)
  return (
    <div>
      <p className="text-[12.5px] text-foreground leading-snug whitespace-pre-wrap break-words">{expanded || !isLong ? fullText : shortText + "…"}</p>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Show more
            </>
          )}
        </button>
      )}
    </div>
  )
}

function FilterFields({ temp, statusOptions, filterAreaOptions, typeOptions, subAreaOptions, authorOptions, roleOptions, canFilterReporter, canToggleOwn }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="block text-[12px] font-semibold text-foreground mb-2">Periode</p>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <input
            type="date"
            value={temp.tempDateFrom}
            onChange={(e) => temp.setTempDateFrom(e.target.value)}
            className="min-w-0 w-full border border-border rounded-xl px-2 py-2.5 text-xs text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-[375px]:px-3 min-[375px]:text-[13px]"
          />
          <span className="text-muted-foreground text-sm font-medium shrink-0">–</span>
          <input
            type="date"
            value={temp.tempDateTo}
            onChange={(e) => temp.setTempDateTo(e.target.value)}
            className="min-w-0 w-full border border-border rounded-xl px-2 py-2.5 text-xs text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-[375px]:px-3 min-[375px]:text-[13px]"
          />
        </div>
      </div>
      <FilterSelectField
        label="Susun laporan"
        description="Pilih urutan daftar laporan."
        value={temp.tempSort}
        onChange={temp.setTempSort}
        options={[
          ["latest", "Terbaru lebih dulu"],
          ["oldest", "Terlama lebih dulu"],
          ["area-asc", "Area A–Z"],
          ["activity-asc", "Aktivitas A–Z"],
          ...(canFilterReporter ? [["reporter-asc", "Nama pelapor A–Z"]] : []),
        ]}
      />
      <FilterChoiceGroup
        legend="Tahap laporan"
        description="Pilih satu atau keduanya."
        value={temp.tempStatus}
        onChange={temp.setTempStatus}
        options={statusOptions.filter((option) => option.value)}
        multiple
        variant="chips"
      />
      <FilterMultiSelect label="Lokasi area" values={temp.tempArea} onChange={temp.setTempArea} options={filterAreaOptions.filter((option) => option.value)} placeholder="Semua area" />
      <FilterMultiSelect label="Lokasi sub-area" values={temp.tempSubArea} onChange={temp.setTempSubArea} options={subAreaOptions.filter((option) => option.value)} placeholder="Semua sub-area" />
      <FilterMultiSelect label="Jenis aktivitas" values={temp.tempType} onChange={temp.setTempType} options={typeOptions.filter((option) => option.value)} placeholder="Semua aktivitas" />
      {canFilterReporter && (
        <FilterMultiSelect label="Dibuat oleh" values={temp.tempAuthor} onChange={temp.setTempAuthor} options={authorOptions.filter((option) => option.value)} placeholder="Semua pengguna" />
      )}
      {canFilterReporter && (
        <FilterMultiSelect
          label="Peran pembuat"
          values={temp.tempRole}
          onChange={temp.setTempRole}
          options={roleOptions.filter((option) => option.value)}
          placeholder="Semua peran"
          searchable={false}
        />
      )}
      <FilterChoiceGroup
        legend="Dokumentasi foto"
        value={temp.tempPhoto}
        onChange={temp.setTempPhoto}
        options={[
          ["", "Apa pun"],
          ["before", "Ada foto awal"],
          ["after", "Ada foto akhir"],
          ["complete", "Lengkap"],
        ]}
        variant="chips"
      />
      {canToggleOwn && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3">
          <div>
            <p className="text-[13px] font-semibold text-foreground">Hanya laporan saya</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Sembunyikan laporan pengguna lain.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={temp.tempMyReportsOnly}
            aria-label="Tampilkan hanya laporan saya"
            onClick={() => temp.setTempMyReportsOnly((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${temp.tempMyReportsOnly ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${temp.tempMyReportsOnly ? "left-5" : "left-1"}`} />
          </button>
        </div>
      )}
    </div>
  )
}

function DesktopStatusPill({ status }) {
  const isClosed = status === "closed"

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium ${
        isClosed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isClosed ? "bg-emerald-500" : "bg-blue-500"}`} />
      {isClosed ? "Selesai" : "Terbuka"}
    </span>
  )
}

function TablePhotoPreview({ src, label }) {
  if (!src) {
    return <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-[10px] font-medium text-muted-foreground">-</div>
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <ExpandableImage src={`/storage/${src}`} alt={label} className="h-12 w-12 rounded-xl border border-border object-cover" />
      <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
    </div>
  )
}

function DetailField({ icon: Icon, label, children, className = "" }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        {label}
      </div>
      <div className="mt-1 pl-7 text-sm leading-6 text-foreground">{children}</div>
    </section>
  )
}

function ReportPhoto({ src, label, showLabel = true }) {
  if (!src) return null

  return (
    <div className="min-w-0">
      {showLabel && <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>}
      <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:min-h-52">
        <ExpandableImage src={`/storage/${src}`} alt={label} className="max-h-[420px] w-full object-contain" />
      </div>
    </div>
  )
}

function ReportContentRow({ icon: Icon, label, children, divided = false }) {
  return (
    <div className={`grid gap-2 py-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4 ${divided ? "border-t border-border" : ""}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        {label}
      </div>
      <div className="pl-6 text-sm leading-6 text-foreground sm:pl-0">{children}</div>
    </div>
  )
}

function ReportDetailModal({ report, isOpen, onClose, onCloseTicket, onEdit, onDelete, isReportEditable, isReportDeletable, formatDate }) {
  if (!report) return null
  const mainActivity = report.activity_type?.name ?? "-"
  const subActivity = report.sub_activity?.name

  return (
    <ModalOverlay id="report-detail-modal" isOpen={isOpen} onClose={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">Detail laporan</h3>
              <DesktopStatusPill status={report.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Dibuat {formatDate(report.created_at)} · {report.author?.name ?? "Pelapor tidak diketahui"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail laporan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h4 className="mb-5 text-[15px] font-bold text-foreground">Informasi laporan</h4>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <DetailField icon={CalendarClock} label="Dibuat pada">
                {formatDate(report.created_at)}
              </DetailField>
              <DetailField icon={UserRound} label="Dilaporkan oleh">
                <p className="font-medium">{report.author?.name ?? "-"}</p>
                {report.author?.role && <p className="mt-0.5 text-xs text-muted-foreground">{report.author.role}</p>}
              </DetailField>
              <DetailField icon={MapPin} label="Area">
                {report.area?.area ?? "-"}
              </DetailField>
              <DetailField icon={Layers3} label="Sub-area">
                {report.sub_area?.name ?? "-"}
              </DetailField>
              <DetailField icon={FileText} label="Aktivitas">
                <p className="font-medium">{mainActivity}</p>
                {subActivity && <p className="mt-0.5 text-xs text-muted-foreground">Sub-aktivitas: {subActivity}</p>}
              </DetailField>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
            <h4 className="mb-1 text-[15px] font-bold text-foreground">Detail isi laporan</h4>
            <ReportContentRow icon={FileText} label="Kendala">
              <p className="whitespace-pre-wrap break-words">{report.issue || "-"}</p>
            </ReportContentRow>
            <ReportContentRow icon={StickyNote} label="Catatan" divided>
              <p className="whitespace-pre-wrap break-words">{report.activity || "-"}</p>
            </ReportContentRow>
          </section>

          {(report.photo_before || report.photo_after) && (
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h4 className="mb-3 text-[15px] font-bold text-foreground">Dokumentasi foto</h4>
              <div className={`grid grid-cols-1 gap-4 ${report.photo_before && report.photo_after ? "sm:grid-cols-2" : ""}`}>
                <ReportPhoto src={report.photo_before} label="Foto sebelum" showLabel={Boolean(report.photo_after)} />
                <ReportPhoto src={report.photo_after} label="Foto setelah" showLabel={Boolean(report.photo_before)} />
              </div>
            </section>
          )}

          {report.status === "closed" && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
              <DetailField icon={UserRound} label="Penyelesaian">
                <p className="font-medium">Ditutup pada {formatDate(report.closed_at)}</p>
                {report.closer && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Oleh {report.closer.name}
                    {report.closer.role ? ` · ${report.closer.role}` : ""}
                  </p>
                )}
                {report.close_comment && <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/50 p-3 text-sm">{report.close_comment}</p>}
              </DetailField>
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card p-3 sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          {report.can?.close && (
            <button
              onClick={() => {
                onCloseTicket(report)
                onClose()
              }}
              className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Selesaikan laporan
            </button>
          )}
          {isReportEditable(report) && (
            <button
              onClick={() => {
                onEdit(report)
                onClose()
              }}
              className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Ubah
            </button>
          )}
          {isReportDeletable(report) && (
            <button
              onClick={() => {
                onDelete(report)
                onClose()
              }}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}

export default function Index({ reports = [], areas = [], activities = [], users = [] }) {
  const r = useReports(reports)

  const assignedAreas = areas.filter((area) => area.is_in_current_user_scope)
  const exportAreas = r.perms.canExportAll ? areas : r.perms.canExportArea ? assignedAreas : []
  const exportUsers = r.perms.canExportAll ? users : []

  const statusOptions = [
    { label: "Semua status", value: "" },
    { label: "Terbuka", value: "open" },
    { label: "Selesai", value: "closed" },
  ]
  const typeOptions = [{ label: "All Activities", value: "" }, ...activities.map((a) => ({ label: a.name, value: String(a.id) }))]
  const areaOptions = [{ label: "All Areas", value: "" }, ...areas.map((a) => ({ label: a.area, value: String(a.id) }))]
  const visibleReportAreaIds = new Set(reports.map((report) => String(report.area_id)).filter(Boolean))
  const filterAreaOptions = r.perms.canViewAll
    ? areaOptions
    : [{ label: "Semua area yang dapat diakses", value: "" }, ...areas.filter((area) => visibleReportAreaIds.has(String(area.id))).map((area) => ({ label: area.area, value: String(area.id) }))]
  const scopedAreaIds = new Set(filterAreaOptions.filter((option) => option.value).map((option) => String(option.value)))
  const subAreaOptions = [
    { label: "Semua sub-area", value: "" },
    ...areas
      .filter((area) => r.perms.canViewAll || scopedAreaIds.has(String(area.id)))
      .flatMap((area) => area.sub_areas.map((subArea) => ({ label: `${area.area} / ${subArea.name}`, value: String(subArea.id) }))),
  ]
  const authorOptions = [
    { label: "Semua pelapor", value: "" },
    ...[...new Map(reports.filter((report) => report.author).map((report) => [report.author.id, { label: report.author.name, value: String(report.author.id) }])).values()].sort((left, right) =>
      left.label.localeCompare(right.label, "id"),
    ),
  ]
  const roleOptions = [{ label: "Semua role", value: "" }, ...[...new Set(reports.map((report) => report.author?.role).filter(Boolean))].sort().map((role) => ({ label: role, value: role }))]

  const { temp } = r

  return (
    <AppLayout title="Laporan">
      <Head>
        <title>Laporan</title>
      </Head>

      <div className="hidden xl:flex flex-col gap-5">
        <PageHeader
          title="Laporan"
          mobileAction={
            r.perms.canCreate ? (
              <button
                type="button"
                onClick={r.openCreateModal}
                aria-label="Buat laporan"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : null
          }
          actions={
            r.perms.canCreate ? (
              <BtnDefault onClick={r.openCreateModal} size="lg" className="min-w-[152px] gap-2">
                <HiOutlinePlus className="w-4 h-4" />
                Buat Laporan
              </BtnDefault>
            ) : null
          }
        />

        <div className="ui-panel overflow-hidden">
          <DataTableToolbar
            search={r.search}
            onSearchChange={(value) => {
              r.setSearch(value)
              r.setPage(1)
            }}
            searchPlaceholder="Cari kendala, pelapor, atau aktivitas..."
            perPage={r.perPage}
            onPerPageChange={(value) => {
              r.setPerPage(value)
              r.setPage(1)
            }}
            resultText={`${r.filtered.length} hasil`}
            onMobileFilter={r.openFilterModal}
            mobileFilterActive={r.hasActiveFilter}
            actions={
              <>
                {r.perms.canExport && (
                  <BtnDefault outline onClick={() => r.setIsExportModalOpen(true)} size="sm" className="gap-2">
                    <File className="h-4 w-4" /> Ekspor
                  </BtnDefault>
                )}
              </>
            }
          />
          <div className="overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  {["No", "Tanggal", "Pelapor", "Area", "Kendala", "Foto", "Aktivitas", "Status", "Selesai pada"].map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {r.paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-muted-foreground text-[13px]">
                      Laporan tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  r.paginated.map((report, index) => {
                    const isClosed = report.status === "closed"
                    const isSelected = r.selectedReport?.id === report.id
                    return (
                      <tr
                        key={report.id}
                        onClick={() => r.handleSelectReport(report)}
                        className={`cursor-pointer transition-all duration-150 align-top hover:bg-muted/20 ${isSelected ? "bg-muted/20" : ""}`}
                      >
                        <td className="px-5 py-4 text-[13px] text-foreground font-semibold w-12">{(r.page - 1) * 10 + index + 1}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-[14px] font-semibold text-foreground">{formatDate(report.created_at)}</p>
                          {report.updated_at !== report.created_at && <p className="text-[12px] text-muted-foreground mt-1">↑ {formatDate(report.updated_at)}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-[14px] font-semibold text-foreground">{report.author?.name ?? "-"}</p>
                          {report.author?.role && <p className="text-[12px] text-muted-foreground mt-1 uppercase">{report.author.role}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-600">{report.area?.area ?? "-"}</span>
                        </td>
                        <td className="px-5 py-4 min-w-[250px]">{report.issue && <RichText text={report.issue} maxLines={3} />}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <TablePhotoPreview src={report.photo_before} label="Sebelum" />
                            {report.status === "closed" && <TablePhotoPreview src={report.photo_after} label="Sesudah" />}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700">
                            {report.sub_activity?.name ?? report.activity_type?.name ?? "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <DesktopStatusPill status={report.status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isClosed ? <span className="text-[13px] font-semibold text-foreground">{formatDate(report.closed_at)}</span> : <span className="text-[13px] text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={r.page} totalPages={r.totalPages} onChange={r.setPage} total={r.filtered.length} perPage={r.perPage} />
        </div>

        <ReportDetailModal
          report={r.selectedReport}
          isOpen={!!r.selectedReport}
          onClose={r.handleCloseSelected}
          onCloseTicket={(report) => r.openCloseTicketModal(report)}
          onEdit={(report) => r.openEditModal(report)}
          onDelete={(report) => r.confirmDelete(report)}
          isReportEditable={r.isReportEditable}
          isReportDeletable={r.isReportDeletable}
          formatDate={formatDate}
        />
      </div>

      <div className="flex flex-col gap-4 bg-background xl:hidden">
        <PageHeader
          title="Laporan"
          mobileAction={
            r.perms.canCreate ? (
              <button
                type="button"
                onClick={r.openCreateModal}
                aria-label="Buat laporan"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : null
          }
          actions={
            r.perms.canCreate ? (
              <BtnDefault onClick={r.openCreateModal} className="w-full gap-2">
                <HiOutlinePlus className="h-4 w-4" /> Buat Laporan
              </BtnDefault>
            ) : null
          }
        />
        <div className="ui-panel overflow-hidden">
          <DataTableToolbar
            search={r.search}
            onSearchChange={(value) => {
              r.setSearch(value)
              r.setPage(1)
            }}
            searchPlaceholder="Cari laporan..."
            perPage={r.perPage}
            onPerPageChange={(value) => {
              r.setPerPage(value)
              r.setPage(1)
            }}
            resultText={`${r.filtered.length} hasil`}
            onMobileFilter={r.openFilterSheet}
            mobileFilterActive={r.hasActiveFilter}
            actions={
              r.perms.canExport ? (
                <BtnDefault outline onClick={() => r.setIsExportModalOpen(true)} size="sm" className="gap-2">
                  <File className="h-4 w-4" /> Ekspor
                </BtnDefault>
              ) : null
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {r.paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 mb-4 opacity-30">
                <svg viewBox="0 0 80 80" fill="none">
                  <path d="M40 8L72 24V56L40 72L8 56V24L40 8Z" stroke="#94a3b8" strokeWidth="2" fill="none" />
                  <path d="M40 8V72M8 24L72 56M72 24L8 56" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
              </div>
              <p className="text-[16px] font-semibold text-gray-700 mb-1">Belum ada laporan</p>
              <p className="text-[13px] text-gray-400 mb-5">Laporan yang Anda buat akan muncul di sini.</p>
              {r.perms.canCreate && (
                <button
                  onClick={r.openCreateModal}
                  className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-blue-700"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  Buat Laporan Baru
                </button>
              )}
            </div>
          ) : (
            r.paginated.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={r.selectedReport?.id === report.id}
                onSelect={r.handleSelectReport}
                onDelete={() => r.confirmDelete(report)}
                showDelete={r.isReportDeletable(report)}
              />
            ))
          )}
        </div>

        <Pagination page={r.page} totalPages={r.totalPages} onChange={r.setPage} total={r.filtered.length} perPage={r.perPage} />

        <ReportDetailModal
          report={r.selectedReport}
          isOpen={!!r.selectedReport}
          onClose={r.handleCloseSelected}
          onCloseTicket={(report) => r.openCloseTicketModal(report)}
          onEdit={(report) => r.openEditModal(report)}
          onDelete={(report) => r.confirmDelete(report)}
          isReportEditable={r.isReportEditable}
          isReportDeletable={r.isReportDeletable}
          formatDate={formatDate}
        />
      </div>

      <ModalOverlay isOpen={r.isFilterModalOpen} onClose={() => r.setIsFilterModalOpen(false)}>
        <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Atur tampilan</h2>
              <p className="mt-1 text-xs text-muted-foreground">Temukan laporan yang ingin diperiksa.</p>
            </div>
            <button
              onClick={() => r.setIsFilterModalOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-5">
            <FilterFields
              temp={temp}
              statusOptions={statusOptions}
              filterAreaOptions={filterAreaOptions}
              typeOptions={typeOptions}
              subAreaOptions={subAreaOptions}
              authorOptions={authorOptions}
              roleOptions={roleOptions}
              canFilterReporter={r.perms.canViewAll}
              canToggleOwn={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
            />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-5 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
            <BtnDefault outline onClick={r.resetTempFilter} className="min-h-12 rounded-xl text-sm">
              Reset
            </BtnDefault>
            <BtnDefault onClick={r.applyFilterModal} className="min-h-12 rounded-xl text-sm">
              Tampilkan hasil
            </BtnDefault>
          </div>
        </div>
      </ModalOverlay>

      {r.isFilterSheetOpen && (
        <div className={`fixed inset-0 ${LAYERS.modal} xl:hidden`}>
          <button type="button" aria-label="Tutup filter" className="absolute inset-0 bg-slate-950/55" onClick={() => r.setIsFilterSheetOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-xl border-t border-gray-200 bg-white shadow-lg"
            style={{ "--foreground": "#111827", "--muted-foreground": "#9ca3af", "--border": "#e5e7eb", "--background": "#ffffff", "--primary": "#2563eb", "--primary-foreground": "#ffffff" }}
          >
            <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-gray-900">Atur tampilan</h3>
                <p className="mt-0.5 text-xs text-gray-500">Temukan laporan yang ingin diperiksa.</p>
              </div>
              <button onClick={() => r.setIsFilterSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5">
              <FilterFields
                temp={temp}
                statusOptions={statusOptions}
                filterAreaOptions={filterAreaOptions}
                typeOptions={typeOptions}
                subAreaOptions={subAreaOptions}
                authorOptions={authorOptions}
                roleOptions={roleOptions}
                canFilterReporter={r.perms.canViewAll}
                canToggleOwn={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
              />
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button onClick={r.resetTempFilter} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-700 active:bg-gray-50 transition-colors">
                Reset
              </button>
              <button onClick={r.applyFilterSheet} className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white text-[14px] font-semibold shadow-md active:bg-blue-700 transition-colors">
                Tampilkan hasil
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportForm isOpen={r.isReportModalOpen} onClose={r.closeReportModal} report={r.editReport} areas={areas} activities={activities} users={users} />
      <CloseTicketForm isOpen={r.isCloseTicketModalOpen} onClose={r.closeCloseTicketModal} report={r.ticketToClose} />
      <ExportForm
        isOpen={r.isExportModalOpen}
        onClose={() => r.setIsExportModalOpen(false)}
        areas={exportAreas}
        activities={activities}
        users={exportUsers}
        canExportAll={r.perms.canExportAll}
        canExportArea={r.perms.canExportArea}
        canExportOwn={r.perms.canExportOwn}
        assignedAreas={assignedAreas}
      />
    </AppLayout>
  )
}
