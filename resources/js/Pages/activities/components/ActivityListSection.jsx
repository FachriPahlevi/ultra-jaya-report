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
      aria-label={`${expanded ? "Collapse" : "Expand"} details for ${label}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${emphasized ? "text-slate-500 hover:bg-slate-100 xl:bg-blue-50 xl:text-blue-600 xl:hover:bg-blue-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {expanded ? <HiChevronDown className="h-5 w-5" /> : <HiChevronRight className="h-5 w-5" />}
    </button>
  )
}

function CategoryIndicator({ category }) {
  if (category !== "REPORT") return null

  return (
    <span role="img" aria-label="Report category" title="Report" className="text-blue-600">
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
      <ReportCount count={total} compact /> {total === 1 ? "report" : "reports"}
    </>
  ) : (
    <ReportCount count={total} compact />
  )
}

function AssignmentList({ people = [], emptyLabel = "—", compact = false }) {
  if (people.length === 0) return <span className="text-sm text-slate-400">{emptyLabel}</span>

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${compact ? "mt-1" : ""}`}>
      {people.map((person) => (
        <span key={person.id} className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {person.name}
        </span>
      ))}
    </div>
  )
}

function ActivityTree({ activities, expandedIds, onToggle, canEdit, canDelete, canAssignManager, canAssignSupervisor, canManageAccessRoles, roleAccessEnabled, onAddSub, onAssignUsers, onAssignRoles, onEdit, onDelete }) {
  return (
    <div>
      <div className="hidden grid-cols-[minmax(320px,40%)_minmax(120px,14%)_minmax(220px,30%)_1fr] border-b border-slate-200 bg-slate-50/80 px-6 py-3 xl:grid">
        <p className="text-xs font-semibold text-slate-600">Activity</p>
        <p className="text-xs font-semibold text-slate-600">Reports</p>
        <p className="text-xs font-semibold text-slate-600">Assignees</p>
        <span className="sr-only">Actions</span>
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
                    <p className="mt-1 text-xs font-medium text-slate-500">{activity.children_count} {activity.children_count === 1 ? "sub-activity" : "sub-activities"}</p>
                  </div>
                </div>
                <div className="hidden xl:block">
                  <ReportCount count={activity.usage_count} />
                </div>
                <div className="hidden xl:block">
                  {!roleAccessEnabled && <AssignmentList people={activity.managers} emptyLabel="-" />}
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
                <section aria-label={`Sub-activities for ${activity.name}`} className="border-t border-slate-200 bg-slate-50/60 xl:bg-slate-50/60">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600 sm:px-6 xl:hidden">
                    <span className="whitespace-nowrap">
                      <ReportSummary count={activity.usage_count} />
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    {!roleAccessEnabled && <><span className="shrink-0">Reviewer</span><AssignmentList people={activity.managers} emptyLabel="-" /></>}
                  </div>
                  {activity.children.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-slate-500">No sub-activities yet.</p>
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
                                <span className="sr-only">Report count: </span>
                                <ReportSummary count={child.usage_count} />
                              </p>
                              <div className="xl:hidden">
                                {!roleAccessEnabled && <AssignmentList people={child.supervisors} emptyLabel="-" compact />}
                                <p className="mt-1 text-xs text-slate-500">Access roles:</p>
                                <AssignmentList people={child.access_roles} emptyLabel="Not configured" compact />
                              </div>
                            </div>
                          </div>
                          <div className="hidden xl:block">
                            <ReportCount count={child.usage_count} />
                          </div>
                          <div className="hidden xl:block">
                            {!roleAccessEnabled && <AssignmentList people={child.supervisors} emptyLabel="-" />}
                            <p className="mt-1 text-xs text-slate-500">Access roles:</p>
                            <AssignmentList people={child.access_roles} emptyLabel="Not configured" compact />
                          </div>
                          <div className="flex items-center justify-end">
                            <ActivityActions
                              activity={child}
                              canEdit={canEdit}
                              canDelete={canDelete}
                              canAssignManager={canAssignManager}
                              canAssignSupervisor={canAssignSupervisor}
                              canManageAccessRoles={canManageAccessRoles}
                              onAssignUsers={onAssignUsers}
                              onAssignRoles={onAssignRoles}
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
                        Add sub-activity
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

function ActivitySortOptions({
  sort,
  onSortChange,
  childFilter,
  onChildFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  descriptionFilter,
  onDescriptionFilterChange,
}) {
  const options = [
    ["default", "Default order"],
    ["name-asc", "Name A–Z"],
    ["name-desc", "Name Z–A"],
    ["children-desc", "Most sub-activities"],
    ["children-asc", "Fewest sub-activities"],
    ["reports-desc", "Most reports"],
  ]
  return (
    <div className="space-y-5">
      <FilterSelectField label="Sort activities" description="Choose the order that works best for you." value={sort} onChange={onSortChange} options={options} />
      <FilterChoiceGroup
        legend="Sub-activities"
        value={childFilter}
        onChange={onChildFilterChange}
        options={[
          ["all", "All"],
          ["available", "Has sub-activities"],
          ["empty", "No sub-activities"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Assignees"
        value={assignmentFilter}
        onChange={onAssignmentFilterChange}
        options={[
          ["all", "All"],
          ["reviewer", "Has reviewer"],
          ["closer", "Has ticket closer"],
          ["empty", "Unassigned"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Sub-activity category"
        description="Select one or both categories."
        value={categoryFilter}
        onChange={onCategoryFilterChange}
        options={[
          ["ISSUE", "ISSUE"],
          ["REPORT", "REPORT"],
        ]}
        multiple
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Description"
        value={descriptionFilter}
        onChange={onDescriptionFilterChange}
        options={[
          ["all", "All"],
          ["available", "Has description"],
          ["empty", "No description"],
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
  canManageAccessRoles,
  roleAccessEnabled,
  onAddSub,
  onAssignUsers,
  onAssignRoles,
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
  const [assignmentFilter, setAssignmentFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [descriptionFilter, setDescriptionFilter] = useState("all")
  const allExpanded = activities.data.length > 0 && activities.data.every((activity) => expandedIds.has(activity.id))
  const sortedActivities = useMemo(
    () =>
      activities.data
        .filter((activity) => childFilter === "all" || (childFilter === "available" ? activity.children_count > 0 : activity.children_count === 0))
        .filter((activity) => {
          const hasReviewer = activity.managers.length > 0
          const hasCloser = activity.children.some((child) => child.supervisors.length > 0)
          return assignmentFilter === "all" || (assignmentFilter === "reviewer" ? hasReviewer : assignmentFilter === "closer" ? hasCloser : !hasReviewer && !hasCloser)
        })
        .filter((activity) => categoryFilter.length === 0 || activity.children.some((child) => categoryFilter.includes(child.category)))
        .filter((activity) => descriptionFilter === "all" || (descriptionFilter === "available" ? Boolean(activity.description?.trim()) : !activity.description?.trim()))
        .sort((left, right) => {
          if (sort === "name-asc") return left.name.localeCompare(right.name, "id")
          if (sort === "name-desc") return right.name.localeCompare(left.name, "id")
          if (sort === "children-desc") return right.children_count - left.children_count || left.name.localeCompare(right.name, "id")
          if (sort === "children-asc") return left.children_count - right.children_count || left.name.localeCompare(right.name, "id")
          if (sort === "reports-desc") return right.usage_count - left.usage_count || left.name.localeCompare(right.name, "id")
          return 0
        }),
    [activities.data, childFilter, descriptionFilter, categoryFilter, assignmentFilter, sort],
  )
  const resultText = `${sortedActivities.length}${sortedActivities.length !== activities.data.length ? ` of ${activities.meta?.total ?? activities.data.length}` : ""} activities`
  const filterProps = {
    sort,
    onSortChange: setSort,
    childFilter,
    onChildFilterChange: setChildFilter,
    assignmentFilter,
    onAssignmentFilterChange: setAssignmentFilter,
    categoryFilter,
    onCategoryFilterChange: setCategoryFilter,
    descriptionFilter,
    onDescriptionFilterChange: setDescriptionFilter,
  }
  const resetFilter = () => {
    setSort("default")
    setChildFilter("all")
    setAssignmentFilter("all")
    setCategoryFilter([])
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
  const commonProps = { canEdit, canDelete, canAssignManager, canAssignSupervisor, canManageAccessRoles, roleAccessEnabled, onAddSub, onAssignUsers, onAssignRoles, onEdit, onDelete }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        resultText={resultText}
        searchPlaceholder="Search activities or sub-activities..."
        language="en"
        filterContent={<ActivitySortOptions {...filterProps} />}
        mobileFilterActive={sort !== "default" || childFilter !== "all" || assignmentFilter !== "all" || categoryFilter.length > 0 || descriptionFilter !== "all"}
        onResetFilter={resetFilter}
        sheetActions={
          activities.data.length > 0 ? (
            <BtnDefault outline size="sm" onClick={handleToggleAll}>
              {allExpanded ? "Collapse all" : "Expand all"}
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
        language="en"
        links={activities.links}
        from={activities.meta?.from}
        to={activities.meta?.to}
        total={activities.meta?.total ?? 0}
        onNavigate={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
      />
    </section>
  )
}
