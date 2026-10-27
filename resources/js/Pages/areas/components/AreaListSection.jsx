import { useEffect, useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import { HiChevronDown, HiChevronRight, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi"
import { Building2, RotateCcw, Trash2, X } from "lucide-react"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const SORT_OPTIONS = [
  ["latest", "Newest"],
  ["name-asc", "Name A–Z"],
  ["name-desc", "Name Z–A"],
  ["sub-area-desc", "Most sub-areas"],
  ["sub-area-asc", "Fewest sub-areas"],
  ["manager-desc", "Most managers"],
  ["manager-asc", "Fewest managers"],
]
const MANAGER_OPTIONS = [
  ["all", "All"],
  ["assigned", "Has manager"],
  ["unassigned", "No manager"],
]
const SUB_AREA_OPTIONS = [
  ["all", "All"],
  ["available", "Has sub-areas"],
  ["empty", "No sub-areas"],
]
const ARCHIVE_OPTIONS = [
  ["all", "All"],
  ["active", "Active"],
  ["archived", "Archived"],
]

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

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

function People({ people = [], emptyText, compact = false }) {
  if (!people.length) return <span className="text-xs text-slate-500">{emptyText}</span>
  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {people.map((person) => (
        <span key={person.id} className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"}`}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold ring-1 ring-slate-200">{initials(person.name)}</span>
          <span className="truncate font-medium">{person.name}</span>
        </span>
      ))}
    </div>
  )
}

function IconAction({ label, danger = false, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 ${danger ? "text-red-600 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {children}
    </button>
  )
}

function AreaActions({ area, canEdit, canDelete, onEdit, onArchive, onRestore, onForceDelete }) {
  if (area.deleted_at)
    return (
      <div className="flex shrink-0">
        {canDelete && (
          <>
            <IconAction label="Restore area" onClick={() => onRestore(area)}>
              <RotateCcw className="h-4 w-4" />
            </IconAction>
            <IconAction label="Delete permanently" danger onClick={() => onForceDelete(area)}>
              <Trash2 className="h-4 w-4" />
            </IconAction>
          </>
        )}
      </div>
    )
  return (
    <div className="flex shrink-0">
      {canEdit && (
        <IconAction label="Edit area" onClick={() => onEdit(area)}>
          <HiOutlinePencil className="h-4 w-4" />
        </IconAction>
      )}
      {canDelete && (
        <IconAction label="Archive area" danger onClick={() => onArchive(area)}>
          <HiOutlineTrash className="h-4 w-4" />
        </IconAction>
      )}
    </div>
  )
}

function SubActions({ area, subArea, canEdit, onEditSubArea, onDeleteSubArea }) {
  if (!canEdit) return null
  return (
    <div className="flex shrink-0">
      <IconAction label={`Edit ${subArea.name}`} onClick={() => onEditSubArea(area, subArea)}>
        <HiOutlinePencil className="h-4 w-4" />
      </IconAction>
      <IconAction label={`Delete ${subArea.name}`} danger onClick={() => onDeleteSubArea(area, subArea)}>
        <HiOutlineTrash className="h-4 w-4" />
      </IconAction>
    </div>
  )
}

function AreaTree({ areas, expandedIds, onToggle, onAddSubArea, ...actions }) {
  return (
    <div>
      <div className="hidden grid-cols-[minmax(320px,45%)_minmax(240px,1fr)_auto] border-b border-slate-200 bg-slate-50/80 px-6 py-3 xl:grid">
        <p className="text-xs font-semibold text-slate-600">Area</p>
        <p className="text-xs font-semibold text-slate-600">Assignees</p>
        <span className="sr-only">Actions</span>
      </div>
      <div className="divide-y divide-slate-200">
        {areas.map((area) => {
          const expanded = expandedIds.has(area.id)
          return (
            <article key={area.id} className={expanded ? "bg-white xl:bg-slate-50/80" : "bg-white hover:bg-blue-50/30"}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start px-2 py-2 sm:px-4 xl:grid-cols-[minmax(320px,45%)_minmax(240px,1fr)_auto] xl:items-center xl:px-6 xl:py-2">
                <div className="flex min-w-0 items-start gap-1 sm:gap-2">
                  <ExpandButton expanded={expanded} onClick={() => onToggle(area.id)} label={area.area} emphasized />
                  <div className="min-w-0 pt-1.5 pr-1">
                    <h3 className="text-[15px] font-semibold leading-5 text-slate-900">{area.area}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">{area.sub_areas.length} {area.sub_areas.length === 1 ? "sub-area" : "sub-areas"}</p>
                  </div>
                </div>
                <div className="hidden xl:block">
                  <People people={area.managers} emptyText="-" />
                </div>
                <div className="flex justify-end">
                  <AreaActions area={area} {...actions} />
                </div>
              </div>
              {expanded && (
                <section aria-label={`Sub-areas for ${area.area}`} className="border-t border-slate-200 bg-slate-50/60">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600 sm:px-6 xl:hidden">
                    <span className="shrink-0">Manager</span>
                    <People people={area.managers} emptyText="-" compact />
                  </div>
                  {!area.sub_areas.length ? (
                    <p className="px-6 py-4 text-sm text-slate-500">No sub-areas yet.</p>
                  ) : (
                    area.sub_areas.map((subArea, index) => {
                      const isLast = index === area.sub_areas.length - 1
                      return (
                        <div
                          key={subArea.id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch px-2 sm:px-4 xl:grid-cols-[minmax(320px,45%)_minmax(240px,1fr)_auto] xl:items-center xl:px-6"
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
                              <p className="break-words text-sm font-semibold leading-5 text-slate-800">{subArea.name}</p>
                              <div className="mt-1 xl:hidden">
                                <People people={subArea.supervisors} emptyText="-" compact />
                              </div>
                            </div>
                          </div>
                          <div className="hidden xl:block">
                            <People people={subArea.supervisors} emptyText="-" compact />
                          </div>
                          <div className="flex items-center justify-end">
                            <SubActions area={area} subArea={subArea} {...actions} />
                          </div>
                        </div>
                      )
                    })
                  )}
                  {actions.canEdit && !area.deleted_at && (
                    <div className="px-4 py-1 sm:px-6 xl:pl-[106px]">
                      <button
                        type="button"
                        onClick={() => onAddSubArea(area)}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary outline-none hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <HiOutlinePlus className="h-4 w-4" />
                        Add sub-area
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

function FilterSheet({ open, onClose, active, onApply, canViewArchived, allExpanded, onToggleAll, hasData }) {
  const [draft, setDraft] = useState(active)
  useEffect(() => {
    if (open) setDraft(active)
  }, [active, open])
  return (
    <ModalOverlay id="area-filter-sheet" isOpen={open} onClose={onClose}>
      <section className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl sm:max-w-xl sm:rounded-2xl sm:border">
        <div className="px-4 pt-2">
          <div className="mx-auto h-1 w-12 rounded-full bg-slate-300" />
        </div>
        <header className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div>
            <h2 className="text-lg font-bold">Filter areas</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose how areas are displayed.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-4 py-5">
          <FilterSelectField label="Sort areas" value={draft.sort} onChange={(sort) => setDraft({ ...draft, sort })} options={SORT_OPTIONS} />
          <FilterChoiceGroup legend="Manager assignment" value={draft.manager} onChange={(manager) => setDraft({ ...draft, manager })} options={MANAGER_OPTIONS} variant="chips" />
          <FilterChoiceGroup legend="Sub-areas" value={draft.subArea} onChange={(subArea) => setDraft({ ...draft, subArea })} options={SUB_AREA_OPTIONS} variant="chips" />
          {canViewArchived && <FilterChoiceGroup legend="Record status" value={draft.archive} onChange={(archive) => setDraft({ ...draft, archive })} options={ARCHIVE_OPTIONS} variant="chips" />}
          <FilterSelectField
            label="Rows per page"
            value={String(draft.perPage)}
            onChange={(perPage) => setDraft({ ...draft, perPage: Number(perPage) })}
            options={[10, 25, 50, 100, -1].map((value) => [String(value), value === -1 ? "Show all" : `${value} rows`])}
          />
          {hasData && (
            <button type="button" onClick={onToggleAll} className="min-h-11 border-t border-border pt-4 text-sm font-semibold text-primary">
              {allExpanded ? "Collapse all details" : "Expand all details"}
            </button>
          )}
        </div>
        <footer className="grid grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3">
          <button type="button" onClick={() => setDraft({ sort: "latest", manager: "all", subArea: "all", archive: "all", perPage: 10 })} className="min-h-12 rounded-xl border font-semibold">
            Reset
          </button>
          <button type="button" onClick={() => onApply(draft)} className="min-h-12 rounded-xl bg-primary font-semibold text-primary-foreground">
            Show results
          </button>
        </footer>
      </section>
    </ModalOverlay>
  )
}

export default function AreaListSection(props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [filter, setFilter] = useState({ sort: "latest", manager: "all", subArea: "all", archive: "all", perPage: Number(props.perPage) })
  const areas = useMemo(
    () =>
      [...props.areas.data]
        .filter((area) => filter.manager === "all" || (filter.manager === "assigned" ? area.managers.length : !area.managers.length))
        .filter((area) => filter.subArea === "all" || (filter.subArea === "available" ? area.sub_areas.length : !area.sub_areas.length))
        .filter((area) => filter.archive === "all" || (filter.archive === "active" ? !area.deleted_at : area.deleted_at))
        .sort((a, b) =>
          filter.sort === "name-asc"
            ? a.area.localeCompare(b.area, "id")
            : filter.sort === "name-desc"
              ? b.area.localeCompare(a.area, "id")
              : filter.sort === "sub-area-desc"
                ? b.sub_areas.length - a.sub_areas.length
                : filter.sort === "sub-area-asc"
                  ? a.sub_areas.length - b.sub_areas.length
                  : filter.sort === "manager-desc"
                    ? b.managers.length - a.managers.length
                    : filter.sort === "manager-asc"
                      ? a.managers.length - b.managers.length
                      : 0,
        ),
    [filter, props.areas.data],
  )
  const toggle = (id) =>
    setExpandedIds((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const allExpanded = areas.length > 0 && areas.every((area) => expandedIds.has(area.id))
  const toggleAll = () => setExpandedIds(allExpanded ? new Set() : new Set(areas.map((area) => area.id)))
  useEffect(() => {
    if (props.search) setExpandedIds(new Set(props.areas.data.map((area) => area.id)))
  }, [props.areas.data, props.search])
  const active = filter.sort !== "latest" || filter.manager !== "all" || filter.subArea !== "all" || filter.archive !== "all" || filter.perPage !== 10
  const actions = {
    canEdit: props.canEdit,
    canDelete: props.canDelete,
    onEdit: props.onEdit,
    onArchive: props.onArchive,
    onRestore: props.onRestore,
    onForceDelete: props.onForceDelete,
    onEditSubArea: props.onEditSubArea,
    onDeleteSubArea: props.onDeleteSubArea,
  }
  const apply = (next) => {
    setFilter(next)
    setFilterOpen(false)
    if (next.perPage !== Number(props.perPage)) props.onPerPageChange(next.perPage)
  }
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <DataTableToolbar
        search={props.search}
        onSearchChange={props.onSearchChange}
        searchPlaceholder="Search areas or sub-areas..."
        perPage={props.perPage}
        onPerPageChange={props.onPerPageChange}
        resultText={`${areas.length}${active ? ` of ${props.areas.data.length}` : ""} areas`}
        language="en"
        onMobileFilter={() => setFilterOpen(true)}
        mobileFilterActive={active}
      />
      {!areas.length ? (
        <div className="px-6 py-16 text-center">
          <Building2 className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 font-semibold">No areas found</p>
        </div>
      ) : (
        <AreaTree areas={areas} expandedIds={expandedIds} onToggle={toggle} onAddSubArea={props.onAddSubArea} {...actions} />
      )}
      <ServerPagination
        language="en"
        links={props.areas.links}
        from={props.areas.meta?.from}
        to={props.areas.meta?.to}
        total={props.areas.meta?.total ?? 0}
        onNavigate={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
      />
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        active={filter}
        onApply={apply}
        canViewArchived={props.canViewArchived}
        allExpanded={allExpanded}
        onToggleAll={toggleAll}
        hasData={areas.length > 0}
      />
    </section>
  )
}
