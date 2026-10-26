import { useEffect, useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import { HiChevronDown, HiChevronRight, HiOutlinePlus } from "react-icons/hi"
import { FileText } from "lucide-react"
import { ActivityActions, EmptyState } from "./ActivityShared"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import BtnDefault from "@/Components/Button/BtnDefault"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

function ExpandButton({ expanded, onClick, label, emphasized = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Tutup" : "Buka"} detail ${label}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${emphasized ? "text-slate-500 hover:bg-slate-100 xl:bg-blue-50 xl:text-blue-600 xl:hover:bg-blue-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {expanded ? <HiChevronDown className="h-5 w-5" /> : <HiChevronRight className="h-5 w-5" />}
    </button>
  )
}

function CategoryIndicator({ category }) {
  if (category !== "REPORT") return null

  return (
    <span role="img" aria-label="Kategori report" title="Report" className="text-blue-600">
      <FileText className="h-3.5 w-3.5" strokeWidth={2} />
    </span>
  )
}

function ReportCount({ count, compact = false }) {
  const total = Number(count ?? 0)

  return <span className={`tabular-nums ${compact ? "text-xs font-medium text-slate-500" : "text-sm font-semibold text-slate-700"}`}>{total > 0 ? total : "-"}</span>
}

function ReportSummary({ count }) {
  const total = Number(count ?? 0)

  return total > 0 ? (
    <>
      <ReportCount count={total} compact /> laporan
    </>
  ) : (
    <ReportCount count={total} compact />
  )
}

function AssignmentList({ people = [], emptyLabel = "—", compact = false }) {
  if (people.length === 0) return <span className="text-sm text-slate-400">{emptyLabel}</span>

  const visiblePeople = people.slice(0, 2)
  const remainingCount = people.length - visiblePeople.length

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${compact ? "mt-1" : ""}`}>
      {visiblePeople.map((person) => (
        <span key={person.id} title={person.name} className="max-w-[132px] truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {person.name}
        </span>
      ))}
      {remainingCount > 0 && <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold tabular-nums text-slate-700">+{remainingCount}</span>}
    </div>
  )
}

function ActivityTree({ activities, expandedIds, onToggle, canEdit, canDelete, canAssignManager, canAssignSupervisor, onAddSub, onAssignUsers, onEdit, onDelete }) {
  return (
    <div>
      <div className="hidden grid-cols-[minmax(320px,40%)_minmax(120px,14%)_minmax(220px,30%)_1fr] border-b border-slate-200 bg-slate-50/80 px-6 py-3 xl:grid">
        <p className="text-xs font-semibold text-slate-600">Aktivitas</p>
        <p className="text-xs font-semibold text-slate-600">Jumlah laporan</p>
        <p className="text-xs font-semibold text-slate-600">Penanggung Jawab</p>
        <span className="sr-only">Aksi</span>
      </div>
      <div className="divide-y divide-slate-200">
        {activities.data.map((activity) => {
          const expanded = expandedIds.has(activity.id)

          return (
            <article key={activity.id} className={expanded ? "bg-white xl:bg-slate-50/80" : "bg-white hover:bg-blue-50/30"}>
              <div className="grid grid-cols-[minmax(0,1fr)_44px] items-start px-2 py-2 sm:px-4 xl:grid-cols-[minmax(320px,40%)_minmax(120px,14%)_minmax(220px,30%)_1fr] xl:items-center xl:px-6 xl:py-2">
                <div className="flex min-w-0 items-start gap-1 sm:gap-2 xl:gap-2">
                  <ExpandButton expanded={expanded} onClick={() => onToggle(activity.id)} label={activity.name} emphasized />
                  <div className="min-w-0 pt-1.5 pr-1">
                    <h3 className="text-[15px] font-semibold leading-5 text-slate-900">{activity.name}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">{activity.children_count} sub-aktivitas</p>
                  </div>
                </div>
                <div className="hidden xl:block">
                  <ReportCount count={activity.usage_count} />
                </div>
                <div className="hidden xl:block">
                  <AssignmentList people={activity.managers} emptyLabel="-" />
                </div>
                <div className="flex justify-end">
                  <ActivityActions
                    activity={activity}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canAssignManager={canAssignManager}
                    canAssignSupervisor={canAssignSupervisor}
                    onAddSub={onAddSub}
                    onAssignUsers={onAssignUsers}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
              {expanded && (
                <section aria-label={`Sub-aktivitas ${activity.name}`} className="border-t border-slate-200 bg-slate-50/60 xl:bg-slate-50/60">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600 sm:px-6 xl:hidden">
                    <span className="whitespace-nowrap">
                      <ReportSummary count={activity.usage_count} />
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="shrink-0">Manager</span>
                    <AssignmentList people={activity.managers} emptyLabel="-" />
                  </div>
                  {activity.children.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-slate-500">Belum ada sub-aktivitas.</p>
                  ) : (
                    activity.children.map((child, index) => {
                      const isLast = index === activity.children.length - 1
                      return (
                        <div
                          key={child.id}
                          className="grid grid-cols-[minmax(0,1fr)_44px] items-stretch px-2 sm:px-4 xl:grid-cols-[minmax(320px,40%)_minmax(120px,14%)_minmax(220px,30%)_1fr] xl:items-center xl:px-6"
                        >
                          <div className="relative flex min-h-[72px] min-w-0 items-start pl-[4.5rem] sm:min-h-[68px] sm:pl-20 xl:min-h-[52px] xl:items-center xl:pl-[110px]">
                            <span
                              className={`absolute left-5 top-0 border-l border-dashed border-slate-300 xl:left-10 ${isLast ? "bottom-[calc(100%-21px)] xl:bottom-1/2" : "bottom-0"}`}
                              aria-hidden="true"
                            />
                            <span className="absolute left-5 top-[21px] w-6 border-t border-dashed border-slate-300 xl:left-10 xl:top-1/2 xl:w-11" aria-hidden="true" />
                            <span
                              className="absolute left-[42px] top-[21px] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-300 xl:left-[81px] xl:top-1/2"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 py-2.5">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <p className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-800">{child.name}</p>
                                <CategoryIndicator category={child.category} />
                              </div>
                              <p className="mt-1 text-xs text-slate-500 xl:hidden">
                                <span className="sr-only">Jumlah laporan: </span>
                                <ReportSummary count={child.usage_count} />
                              </p>
                              <div className="xl:hidden">
                                <AssignmentList people={child.supervisors} emptyLabel="-" compact />
                              </div>
                            </div>
                          </div>
                          <div className="hidden xl:block">
                            <ReportCount count={child.usage_count} />
                          </div>
                          <div className="hidden xl:block">
                            <AssignmentList people={child.supervisors} emptyLabel="-" />
                          </div>
                          <div className="flex items-center justify-end">
                            <ActivityActions
                              activity={child}
                              canEdit={canEdit}
                              canDelete={canDelete}
                              canAssignManager={canAssignManager}
                              canAssignSupervisor={canAssignSupervisor}
                              onAssignUsers={onAssignUsers}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                  {canEdit && activity.is_active && (
                    <div className="px-4 py-1 sm:px-6 xl:pl-[106px]">
                      <button
                        type="button"
                        onClick={() => onAddSub(activity)}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary outline-none transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <HiOutlinePlus className="h-4 w-4" />
                        Tambah sub-aktivitas
                      </button>
                    </div>
                  )}
                </section>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ActivitySortOptions({ sort, onSortChange, childFilter, onChildFilterChange, scopeFilter, onScopeFilterChange, roleFilter, onRoleFilterChange, descriptionFilter, onDescriptionFilterChange }) {
  const options = [
    ["default", "Terbaru"],
    ["name-asc", "Nama A–Z"],
    ["name-desc", "Nama Z–A"],
    ["children-desc", "Sub-aktivitas terbanyak"],
    ["children-asc", "Sub-aktivitas tersedikit"],
  ]
  return (
    <div className="space-y-5">
      <FilterSelectField label="Susun aktivitas" description="Tentukan urutan yang paling mudah dipindai." value={sort} onChange={onSortChange} options={options} />
      <FilterChoiceGroup
        legend="Sub-aktivitas"
        value={childFilter}
        onChange={onChildFilterChange}
        options={[
          ["all", "Semua"],
          ["available", "Memiliki sub-aktivitas"],
          ["empty", "Tanpa sub-aktivitas"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Jangkauan area"
        value={scopeFilter}
        onChange={onScopeFilterChange}
        options={[
          ["all", "Semua"],
          ["global", "Seluruh area"],
          ["limited", "Area tertentu"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Dapat diakses oleh"
        description="Pilih satu atau beberapa peran."
        value={roleFilter}
        onChange={onRoleFilterChange}
        options={[
          ["USER", "User"],
          ["SPV", "SPV"],
          ["MANAGER", "Manager"],
        ]}
        multiple
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Informasi akses"
        value={descriptionFilter}
        onChange={onDescriptionFilterChange}
        options={[
          ["all", "Semua"],
          ["available", "Sudah diatur"],
          ["empty", "Belum diatur"],
        ]}
        variant="chips"
      />
    </div>
  )
}

export default function ActivityListSection({
  activities,
  canEdit,
  canDelete,
  canAssignManager,
  canAssignSupervisor,
  onAddSub,
  onAssignUsers,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  perPage,
  onPerPageChange,
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [sort, setSort] = useState("default")
  const [childFilter, setChildFilter] = useState("all")
  const [scopeFilter, setScopeFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState([])
  const [descriptionFilter, setDescriptionFilter] = useState("all")
  const allExpanded = activities.data.length > 0 && activities.data.every((activity) => expandedIds.has(activity.id))
  const sortedActivities = useMemo(
    () =>
      activities.data
        .filter((activity) => childFilter === "all" || (childFilter === "available" ? activity.children_count > 0 : activity.children_count === 0))
        .filter((activity) => scopeFilter === "all" || (scopeFilter === "global" ? /Area:\s*All/i.test(activity.description || "") : !/Area:\s*All/i.test(activity.description || "")))
        .filter((activity) => roleFilter.length === 0 || roleFilter.some((role) => new RegExp(`User Role:[^|]*\\b${role}\\b`, "i").test(activity.description || "")))
        .filter((activity) => descriptionFilter === "all" || (descriptionFilter === "available" ? Boolean(activity.description?.trim()) : !activity.description?.trim()))
        .sort((left, right) => {
          if (sort === "name-asc") return left.name.localeCompare(right.name, "id")
          if (sort === "name-desc") return right.name.localeCompare(left.name, "id")
          if (sort === "children-desc") return right.children_count - left.children_count || left.name.localeCompare(right.name, "id")
          if (sort === "children-asc") return left.children_count - right.children_count || left.name.localeCompare(right.name, "id")
          return 0
        }),
    [activities.data, childFilter, descriptionFilter, roleFilter, scopeFilter, sort],
  )
  const resultText = `${sortedActivities.length}${sortedActivities.length !== activities.data.length ? ` dari ${activities.meta?.total ?? activities.data.length}` : ""} aktivitas`
  const filterProps = {
    sort,
    onSortChange: setSort,
    childFilter,
    onChildFilterChange: setChildFilter,
    scopeFilter,
    onScopeFilterChange: setScopeFilter,
    roleFilter,
    onRoleFilterChange: setRoleFilter,
    descriptionFilter,
    onDescriptionFilterChange: setDescriptionFilter,
  }
  const resetFilter = () => {
    setSort("default")
    setChildFilter("all")
    setScopeFilter("all")
    setRoleFilter([])
    setDescriptionFilter("all")
  }

  useEffect(() => {
    if (search) setExpandedIds(new Set(activities.data.map((activity) => activity.id)))
  }, [activities.data, search])

  const handleToggle = (id) =>
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const handleToggleAll = () => setExpandedIds(allExpanded ? new Set() : new Set(activities.data.map((activity) => activity.id)))
  const commonProps = { canEdit, canDelete, canAssignManager, canAssignSupervisor, onAddSub, onAssignUsers, onEdit, onDelete }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        resultText={resultText}
        searchPlaceholder="Cari aktivitas atau sub-aktivitas..."
        filterContent={<ActivitySortOptions {...filterProps} />}
        mobileFilterActive={sort !== "default" || childFilter !== "all" || scopeFilter !== "all" || roleFilter.length > 0 || descriptionFilter !== "all"}
        onResetFilter={resetFilter}
        sheetActions={
          activities.data.length > 0 ? (
            <BtnDefault outline size="sm" onClick={handleToggleAll}>
              {allExpanded ? "Tutup semua" : "Buka semua"}
            </BtnDefault>
          ) : null
        }
      />
      {sortedActivities.length === 0 ? (
        <EmptyState hasSearch={Boolean(search)} />
      ) : (
        <>
          <ActivityTree activities={{ ...activities, data: sortedActivities }} expandedIds={expandedIds} onToggle={handleToggle} {...commonProps} />
        </>
      )}
      <ServerPagination
        links={activities.links}
        from={activities.meta?.from}
        to={activities.meta?.to}
        total={activities.meta?.total ?? 0}
        onNavigate={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
      />
    </section>
  )
}
