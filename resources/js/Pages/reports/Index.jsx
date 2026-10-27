import { Head } from "@inertiajs/react"
import AppLayout from "@/Layouts/AppLayout"
import { formatDate as formatLocalizedDate } from "@/lib/format.ts"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import InputDate from "@/Components/Input/InputDate"
import { ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import ReportForm from "@/Pages/reports/components/ReportForm"
import CloseTicketForm from "@/Pages/reports/components/CloseTicketForm"
import ExportForm from "@/Pages/reports/components/ExportReportForm"
import ReportCard, { reportDesktopGrid } from "@/Pages/reports/components/ReportCard"
import Pagination from "@/Components/Navigation/Pagination"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import { useReports } from "@/Pages/reports/hooks/useReports"
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi"
import { CalendarClock, File, FileText, Layers3, MapPin, StickyNote, UserRound, RotateCcw } from "lucide-react"
import { LAYERS } from "@/lib/layers"
import PageHeader from "@/Components/Layout/PageHeader"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const formatDate = (date) => formatLocalizedDate(date, "en-US")

function FilterFields({ temp, statusOptions, filterAreaOptions, typeOptions, subAreaOptions, authorOptions, roleOptions, canFilterReporter, canToggleOwn }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
        <p className="text-sm font-semibold text-foreground">Date & sorting</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Choose a date range and how reports are ordered.</p>
        <div className="mt-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <InputDate label="Start date" value={temp.tempDateFrom} onChange={(event) => temp.setTempDateFrom(event.target.value)} />
            <InputDate label="End date" value={temp.tempDateTo} min={temp.tempDateFrom || undefined} onChange={(event) => temp.setTempDateTo(event.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <FilterSelectField
            label="Sort by"
            value={temp.tempSort}
            onChange={temp.setTempSort}
            options={[
              ["latest", "Newest first"],
              ["oldest", "Oldest first"],
              ["area-asc", "Area A–Z"],
              ["activity-asc", "Activity A–Z"],
              ...(canFilterReporter ? [["reporter-asc", "Reporter A–Z"]] : []),
            ]}
          />
        </div>
        <div className="mt-4">
          <FilterSelectField
            label="Rows per page"
            value={String(temp.tempPerPage)}
            onChange={(value) => temp.setTempPerPage(Number(value))}
            options={[["10", "10 rows"], ["25", "25 rows"], ["50", "50 rows"], ["100", "100 rows"], ["-1", "Show all"]]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
        <FilterChoiceGroup
          legend="Report status"
          description="Select one or more statuses."
          value={temp.tempStatus}
          onChange={temp.setTempStatus}
          options={statusOptions.filter((option) => option.value)}
          multiple
          variant="chips"
        />
        <div className="my-4 h-px bg-border" />
        <FilterChoiceGroup
          legend="Photo documentation"
          description="Choose which photos should be available."
          value={temp.tempPhoto}
          onChange={temp.setTempPhoto}
          options={[
            ["", "Any"],
            ["before", "Before photo"],
            ["after", "After photo"],
            ["complete", "Both photos"],
          ]}
          variant="chips"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
        <p className="text-sm font-semibold text-foreground">Location & activity</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Select one or more locations or activities.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FilterMultiSelect label="Area" values={temp.tempArea} onChange={temp.setTempArea} options={filterAreaOptions.filter((option) => option.value)} placeholder="All areas" />
          <FilterMultiSelect label="Sub-area" values={temp.tempSubArea} onChange={temp.setTempSubArea} options={subAreaOptions.filter((option) => option.value)} placeholder="All sub-areas" />
        </div>
        <div className="mt-4">
          <FilterMultiSelect label="Activity" values={temp.tempType} onChange={temp.setTempType} options={typeOptions.filter((option) => option.value)} placeholder="All activities" />
        </div>
      </section>

      {canFilterReporter && (
        <section className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-sm font-semibold text-foreground">Reporter</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FilterMultiSelect label="Created by" values={temp.tempAuthor} onChange={temp.setTempAuthor} options={authorOptions.filter((option) => option.value)} placeholder="All users" />
            <FilterMultiSelect
              label="Reporter role"
              values={temp.tempRole}
              onChange={temp.setTempRole}
              options={roleOptions.filter((option) => option.value)}
              placeholder="All roles"
              searchable={false}
            />
          </div>
        </section>
      )}

      {canToggleOwn && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3.5 sm:px-4">
          <div>
            <p className="text-[13px] font-semibold text-foreground">My reports only</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Show only reports you submitted.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={temp.tempMyReportsOnly}
            aria-label="Show only my reports"
            onClick={() => temp.setTempMyReportsOnly((v) => !v)}
            className={`relative h-6 w-10 shrink-0 cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${temp.tempMyReportsOnly ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${temp.tempMyReportsOnly ? "left-5" : "left-1"}`} />
          </button>
        </div>
      )}
    </div>
  )
}

function DesktopStatusPill({ status, category }) {
  const isReport = category === "REPORT"
  const isClosed = status === "closed"

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium ${
        isReport ? "border-slate-200 bg-slate-50 text-slate-700" : isClosed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isReport ? "bg-slate-500" : isClosed ? "bg-emerald-500" : "bg-blue-500"}`} />
      {isReport ? "Report" : isClosed ? "Closed" : "Open"}
    </span>
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
      <ModalPanel width="xl">
        <ModalHeader title="Report details" description={`Created ${formatDate(report.created_at)} · ${report.author?.name ?? "Unknown reporter"}`} onClose={onClose}>
          <DesktopStatusPill status={report.status} category={report.category_snapshot} />
        </ModalHeader>

        <div className="space-y-4 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h4 className="mb-5 text-[15px] font-bold text-foreground">Report information</h4>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <DetailField icon={CalendarClock} label="Created at">
                {formatDate(report.created_at)}
              </DetailField>
              <DetailField icon={UserRound} label="Reported by">
                <p className="font-medium">{report.author?.name ?? "-"}</p>
                {report.author?.role && <p className="mt-0.5 text-xs text-muted-foreground">{report.author.role}</p>}
              </DetailField>
              <DetailField icon={MapPin} label="Area">
                {report.area?.area ?? "-"}
              </DetailField>
              <DetailField icon={Layers3} label="Sub-area">
                {report.sub_area?.name ?? "-"}
              </DetailField>
              <DetailField icon={FileText} label="Activity">
                <p className="font-medium">{mainActivity}</p>
                {subActivity && <p className="mt-0.5 text-xs text-muted-foreground">Sub-activity: {subActivity}</p>}
              </DetailField>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
            <h4 className="mb-1 text-[15px] font-bold text-foreground">Report content</h4>
            <ReportContentRow icon={FileText} label={report.category_snapshot === "REPORT" ? "Observation" : "Finding"}>
              <p className="whitespace-pre-wrap break-words">{report.issue || "-"}</p>
            </ReportContentRow>
            <ReportContentRow icon={StickyNote} label="Additional notes" divided>
              <p className="whitespace-pre-wrap break-words">{report.activity || "-"}</p>
            </ReportContentRow>
          </section>

          {(report.photo_before || report.photo_after) && (
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h4 className="mb-3 text-[15px] font-bold text-foreground">Photo documentation</h4>
              <div className={`grid grid-cols-1 gap-4 ${report.photo_before && report.photo_after ? "sm:grid-cols-2" : ""}`}>
                <ReportPhoto src={report.photo_before} label="Before photo" />
                <ReportPhoto src={report.photo_after} label="After photo" />
              </div>
            </section>
          )}

          {report.status === "closed" && (
            <section className="rounded-2xl border border border-border bg-card p-4 sm:p-5">
              <DetailField icon={UserRound} label="Resolution">
                <p className="font-medium">Closed at {formatDate(report.closed_at)}</p>
                {report.closer && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    By {report.closer.name}
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
              Close ticket
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
              Edit
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
              Delete
            </button>
          )}
        </div>
      </ModalPanel>
    </ModalOverlay>
  )
}

export default function Index({ reports = [], areas = [], activities = [], users = [] }) {
  const r = useReports(reports)

  const exportAreas = [...new Map(reports.filter((report) => report.area).map((report) => [report.area.id, report.area])).values()]
  const exportUsers = [...new Map(reports.filter((report) => report.author).map((report) => [report.author.id, report.author])).values()]
  const exportActivities = [...new Map(reports.filter((report) => report.activity_type).map((report) => [report.activity_type.id, report.activity_type])).values()]

  const statusOptions = [
    { label: "All statuses", value: "" },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
    { label: "Report", value: "report" },
  ]
  const typeOptions = [{ label: "All activities", value: "" }, ...exportActivities.map((a) => ({ label: a.name, value: String(a.id) }))]
  const areaOptions = [{ label: "All areas", value: "" }, ...exportAreas.map((a) => ({ label: a.area, value: String(a.id) }))]
  const visibleReportAreaIds = new Set(reports.map((report) => String(report.area_id)).filter(Boolean))
  const filterAreaOptions = r.perms.canViewAll
    ? areaOptions
    : [{ label: "All accessible areas", value: "" }, ...areas.filter((area) => visibleReportAreaIds.has(String(area.id))).map((area) => ({ label: area.area, value: String(area.id) }))]
  const subAreaOptions = [
    { label: "All sub-areas", value: "" },
    ...[
      ...new Map(
        reports.filter((report) => report.sub_area).map((report) => [report.sub_area.id, { label: `${report.area?.area ?? "Area"} / ${report.sub_area.name}`, value: String(report.sub_area.id) }]),
      ).values(),
    ],
  ]
  const authorOptions = [
    { label: "All reporters", value: "" },
    ...[...new Map(reports.filter((report) => report.author).map((report) => [report.author.id, { label: report.author.name, value: String(report.author.id) }])).values()].sort((left, right) =>
      left.label.localeCompare(right.label, "id"),
    ),
  ]
  const roleOptions = [{ label: "All roles", value: "" }, ...[...new Set(reports.map((report) => report.author?.role).filter(Boolean))].sort().map((role) => ({ label: role, value: role }))]

  const { temp } = r
  // const temporaryFilterCount = [
  //   temp.tempStatus.length,
  //   temp.tempType.length,
  //   temp.tempArea.length,
  //   temp.tempRole.length,
  //   temp.tempAuthor.length,
  //   temp.tempSubArea.length,
  //   temp.tempPhoto ? 1 : 0,
  //   temp.tempSort !== "latest" ? 1 : 0,
  //   temp.tempDateFrom || temp.tempDateTo ? 1 : 0,
  //   temp.tempMyReportsOnly ? 1 : 0,
  // ].reduce((total, count) => total + count, 0)

  return (
    <AppLayout title="Reports">
      <Head>
        <title>Reports</title>
      </Head>

      <div className="flex flex-col gap-4 xl:gap-5">
        <PageHeader
          title="Reports"
          mobileAction={
            r.perms.canCreate || r.perms.canExport ? (
              <div className="flex items-center gap-2">
                {r.perms.canExport && (
                  <button
                    type="button"
                    onClick={() => r.setIsExportModalOpen(true)}
                    aria-label="Export reports"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <File className="h-5 w-5" />
                  </button>
                )}
                {r.perms.canCreate && (
                  <button
                    type="button"
                    onClick={r.openCreateModal}
                    aria-label="Create report"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <HiOutlinePlus className="h-5 w-5" />
                  </button>
                )}
              </div>
            ) : null
          }
          actions={
            r.perms.canCreate ? (
              <BtnDefault onClick={r.openCreateModal} size="lg" className="min-w-[152px] gap-2">
                <HiOutlinePlus className="w-4 h-4" />
                Create report
              </BtnDefault>
            ) : null
          }
        />

        <div className="ui-panel overflow-hidden">
          <DataTableToolbar
            language="en"
            search={r.search}
            onSearchChange={(value) => {
              r.setSearch(value)
              r.setPage(1)
            }}
            searchPlaceholder="Search findings, reporters, or activities..."
            perPage={r.perPage}
            onPerPageChange={(value) => {
              r.setPerPage(value)
              r.setPage(1)
            }}
            resultText={`${r.filtered.length} results`}
            onMobileFilter={() => (window.matchMedia("(min-width: 1280px)").matches ? r.openFilterModal() : r.openFilterSheet())}
            mobileFilterActive={r.hasActiveFilter}
            actions={
              <>
                {r.perms.canExport && (
                  <BtnDefault outline onClick={() => r.setIsExportModalOpen(true)} size="md" className="gap-2 px-3.5 text-sm">
                    <File className="h-4 w-4" /> Export
                  </BtnDefault>
                )}
              </>
            }
          />
          <div className="border-b border-border/70 px-4 py-2 text-xs text-muted-foreground sm:hidden">{r.filtered.length} results</div>
          <div className={`hidden border-b border-border bg-muted/30 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:grid ${reportDesktopGrid}`}>
            <span>No</span>
            <span>Finding</span>
            <span>Reporter</span>
            <span>Location</span>
            <span>Activity</span>
            <span>Photos</span>
            <span>Status</span>
          </div>
          {r.paginated.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">No reports found</div>
          ) : (
            <div>
              {r.paginated.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  number={(r.page - 1) * (r.perPage === -1 ? r.filtered.length : r.perPage) + index + 1}
                  isSelected={r.selectedReport?.id === report.id}
                  onSelect={r.handleSelectReport}
                />
              ))}
            </div>
          )}
          <Pagination page={r.page} totalPages={r.totalPages} onChange={r.setPage} total={r.filtered.length} perPage={r.perPage} language="en" />
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

      <ModalOverlay isOpen={r.isFilterModalOpen} onClose={() => r.setIsFilterModalOpen(false)}>
        <ModalPanel width="xl" className="h-[100dvh] sm:h-auto">
          <ModalHeader title="Filter reports" description="Changes take effect when you apply the filters." onClose={() => r.setIsFilterModalOpen(false)} />
          <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
            <FilterFields
              temp={temp}
              statusOptions={statusOptions}
              filterAreaOptions={filterAreaOptions}
              typeOptions={typeOptions}
              subAreaOptions={subAreaOptions}
              authorOptions={authorOptions}
              roleOptions={roleOptions}
              canFilterReporter={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
              canToggleOwn={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
            />
          </div>
          <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <div className="grid grid-cols-2 gap-2.5">
              <BtnDefault outline fullWidth size="lg" onClick={r.resetTempFilter} className="rounded-lg">
                <RotateCcw className="h-4 w-4" /> Reset
              </BtnDefault>
              <BtnDefault fullWidth size="lg" onClick={r.applyFilterModal} className="rounded-lg">
                Apply filters
              </BtnDefault>
            </div>
          </div>
        </ModalPanel>
      </ModalOverlay>

      {r.isFilterSheetOpen && (
        <div className={`fixed inset-0 ${LAYERS.modal} xl:hidden`}>
          <button type="button" aria-label="Close report filters" className="absolute inset-0 bg-slate-950/55" onClick={() => r.setIsFilterSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl">
            <div className="flex shrink-0 justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 pb-3 pt-2">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Filter reports</h3>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Choose which reports to display.</p>
              </div>
              <button
                type="button"
                onClick={() => r.setIsFilterSheetOpen(false)}
                aria-label="Close report filters"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-4">
              <FilterFields
                temp={temp}
                statusOptions={statusOptions}
                filterAreaOptions={filterAreaOptions}
                typeOptions={typeOptions}
                subAreaOptions={subAreaOptions}
                authorOptions={authorOptions}
                roleOptions={roleOptions}
                canFilterReporter={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
                canToggleOwn={r.perms.canViewAll || r.perms.canReviewArea || r.perms.canSolveOwnArea}
              />
            </div>
            <div className="shrink-0 border-t border-border bg-card px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              <div className="grid grid-cols-2 gap-2.5">
                <BtnDefault outline fullWidth size="lg" onClick={r.resetTempFilter} className="rounded-lg">
                  <RotateCcw className="h-4 w-4" /> Reset
                </BtnDefault>
                <BtnDefault fullWidth size="lg" onClick={r.applyFilterSheet} className="rounded-lg">
                  Apply filters
                </BtnDefault>
              </div>
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
        activities={exportActivities}
        users={exportUsers}
        canExportAll={r.perms.canExportAll}
        canExportArea={r.perms.canExportArea}
        canExportOwn={r.perms.canExportOwn}
      />
    </AppLayout>
  )
}
