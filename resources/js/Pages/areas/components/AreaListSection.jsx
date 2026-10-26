import { Fragment, useEffect, useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import { HiChevronDown, HiChevronRight, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi"
import { Building2, RotateCcw, Search, SlidersHorizontal, Trash2, X } from "lucide-react"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const SORT_OPTIONS = [
  ["latest", "Terbaru"],
  ["name-asc", "Nama A–Z"],
  ["name-desc", "Nama Z–A"],
  ["sub-area-desc", "Sub-area terbanyak"],
  ["sub-area-asc", "Sub-area tersedikit"],
  ["manager-desc", "Manager terbanyak"],
  ["manager-asc", "Manager tersedikit"],
]
const MANAGER_OPTIONS = [
  ["all", "Semua"],
  ["assigned", "Ada manager"],
  ["unassigned", "Belum ada manager"],
]
const SUB_AREA_OPTIONS = [
  ["all", "Semua"],
  ["available", "Ada sub-area"],
  ["empty", "Tanpa sub-area"],
]
const ARCHIVE_OPTIONS = [
  ["all", "Semua"],
  ["active", "Aktif"],
  ["archived", "Diarsipkan"],
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

function ExpandButton({ expanded, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Tutup" : "Buka"} detail ${label}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
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
            <IconAction label="Pulihkan area" onClick={() => onRestore(area)}>
              <RotateCcw className="h-4 w-4" />
            </IconAction>
            <IconAction label="Hapus permanen" danger onClick={() => onForceDelete(area)}>
              <Trash2 className="h-4 w-4" />
            </IconAction>
          </>
        )}
      </div>
    )
  return (
    <div className="flex shrink-0">
      {canEdit && (
        <IconAction label="Ubah area" onClick={() => onEdit(area)}>
          <HiOutlinePencil className="h-4 w-4" />
        </IconAction>
      )}
      {canDelete && (
        <IconAction label="Hapus area" danger onClick={() => onArchive(area)}>
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
      <IconAction label={`Ubah ${subArea.name}`} onClick={() => onEditSubArea(area, subArea)}>
        <HiOutlinePencil className="h-4 w-4" />
      </IconAction>
      <IconAction label={`Hapus ${subArea.name}`} danger onClick={() => onDeleteSubArea(area, subArea)}>
        <HiOutlineTrash className="h-4 w-4" />
      </IconAction>
    </div>
  )
}

function ParentRow({ area, expanded, onToggle, ...actions }) {
  return (
    <tr className={expanded ? "bg-blue-50/30" : "bg-white"}>
      <td>
        <div className="flex min-w-[260px] items-start gap-2">
          <ExpandButton expanded={expanded} onClick={onToggle} label={area.area} />
          <div className="min-w-0 pt-1.5">
            <p className="text-[15px] font-semibold leading-5 text-slate-900">{area.area}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{area.sub_areas.length} sub-area</p>
          </div>
        </div>
      </td>
      <td>
        <People people={area.managers} emptyText="Belum ada manager" />
      </td>
      <td>
        <div className="flex justify-end">
          <AreaActions area={area} {...actions} />
        </div>
      </td>
    </tr>
  )
}

function ChildRow({ area, subArea, ...actions }) {
  return (
    <tr className="bg-slate-50/70">
      <td>
        <div className="flex min-w-[260px] items-start gap-3 pl-[52px]">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-300" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{subArea.name}</p>
            <p className="mt-1 text-xs text-slate-500">Sub-area</p>
          </div>
        </div>
      </td>
      <td>
        <People people={subArea.supervisors} emptyText="Belum ada supervisor" compact />
      </td>
      <td>
        <div className="flex justify-end">
          <SubActions area={area} subArea={subArea} {...actions} />
        </div>
      </td>
    </tr>
  )
}

function DesktopList({ areas, expandedIds, onToggle, onAddSubArea, ...actions }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="ui-table min-w-[900px]">
        <thead>
          <tr>
            <th className="w-[42%]">Area &amp; Sub-area</th>
            <th>Penanggung Jawab</th>
            <th>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <Fragment key={area.id}>
              <ParentRow area={area} expanded={expandedIds.has(area.id)} onToggle={() => onToggle(area.id)} {...actions} />
              {expandedIds.has(area.id) && (
                <>
                  {area.sub_areas.map((subArea) => (
                    <ChildRow key={subArea.id} area={area} subArea={subArea} {...actions} />
                  ))}
                  {!area.sub_areas.length && (
                    <tr className="bg-slate-50/70">
                      <td colSpan="3" className="pl-[76px] text-sm text-slate-500">
                        Belum ada sub-area.
                      </td>
                    </tr>
                  )}
                  {actions.canEdit && !area.deleted_at && (
                    <tr className="bg-slate-50/70">
                      <td colSpan="3" className="pl-[76px]">
                        <button type="button" onClick={() => onAddSubArea(area)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
                          <HiOutlinePlus />
                          Tambah sub-area
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileArea({ area, expanded, onToggle, onAddSubArea, ...actions }) {
  return (
    <article className={expanded ? "bg-slate-50/80" : "bg-white"}>
      <div className="flex items-start gap-1 px-3 py-3 sm:px-5">
        <ExpandButton expanded={expanded} onClick={onToggle} label={area.area} />
        <div className="min-w-0 flex-1 py-1.5">
          <h3 className="text-[15px] font-semibold text-slate-900">{area.area}</h3>
          <p className="mt-1.5 text-xs text-slate-500">
            {area.sub_areas.length} sub-area · {area.managers.length} manager
          </p>
        </div>
        <AreaActions area={area} {...actions} />
      </div>
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-4 sm:px-6">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Manager Area</p>
          <People people={area.managers} emptyText="Belum ada manager" />
          <div className="mt-5 border-t border-slate-200 pt-2">
            {!area.sub_areas.length ? (
              <p className="py-3 pl-6 text-sm text-slate-500">Belum ada sub-area.</p>
            ) : (
              area.sub_areas.map((subArea) => (
                <div key={subArea.id} className="flex items-start gap-2 py-2.5">
                  <span className="w-4 text-slate-400">↳</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{subArea.name}</p>
                    <div className="mt-1">
                      <People people={subArea.supervisors} emptyText="Belum ada supervisor" compact />
                    </div>
                  </div>
                  <SubActions area={area} subArea={subArea} {...actions} />
                </div>
              ))
            )}
            {actions.canEdit && !area.deleted_at && (
              <button type="button" onClick={() => onAddSubArea(area)} className="ml-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
                <HiOutlinePlus />
                Tambah sub-area
              </button>
            )}
          </div>
        </div>
      )}
    </article>
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
            <h2 className="text-lg font-bold">Atur tampilan</h2>
            <p className="mt-1 text-xs text-muted-foreground">Temukan area yang ingin diperiksa.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-4 py-5">
          <FilterSelectField label="Susun area" value={draft.sort} onChange={(sort) => setDraft({ ...draft, sort })} options={SORT_OPTIONS} />
          <FilterChoiceGroup legend="Penanggung jawab" value={draft.manager} onChange={(manager) => setDraft({ ...draft, manager })} options={MANAGER_OPTIONS} variant="chips" />
          <FilterChoiceGroup legend="Ketersediaan sub-area" value={draft.subArea} onChange={(subArea) => setDraft({ ...draft, subArea })} options={SUB_AREA_OPTIONS} variant="chips" />
          {canViewArchived && <FilterChoiceGroup legend="Kondisi data" value={draft.archive} onChange={(archive) => setDraft({ ...draft, archive })} options={ARCHIVE_OPTIONS} variant="chips" />}
          <FilterSelectField
            label="Baris per halaman"
            value={String(draft.perPage)}
            onChange={(perPage) => setDraft({ ...draft, perPage: Number(perPage) })}
            options={[10, 25, 50, 100, -1].map((value) => [String(value), value === -1 ? "Tampilkan semua" : `${value} baris`])}
          />
          {hasData && (
            <button type="button" onClick={onToggleAll} className="min-h-11 border-t border-border pt-4 text-sm font-semibold text-primary">
              {allExpanded ? "Tutup semua detail" : "Buka semua detail"}
            </button>
          )}
        </div>
        <footer className="grid grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3">
          <button type="button" onClick={() => setDraft({ sort: "latest", manager: "all", subArea: "all", archive: "all", perPage: 10 })} className="min-h-12 rounded-xl border font-semibold">
            Reset
          </button>
          <button type="button" onClick={() => onApply(draft)} className="min-h-12 rounded-xl bg-primary font-semibold text-primary-foreground">
            Tampilkan hasil
          </button>
        </footer>
      </section>
    </ModalOverlay>
  )
}

function Toolbar({ search, onSearchChange, resultText, onOpenFilter, active }) {
  return (
    <div className="border-b border-border p-3 sm:p-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari area atau sub-area..." className="ui-field rounded-full pl-10" />
        </div>
        <p className="ml-auto hidden text-sm text-muted-foreground sm:block">{resultText}</p>
        <button
          type="button"
          onClick={onOpenFilter}
          className={`flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold sm:rounded-lg ${active ? "border-primary text-primary" : "border-border"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {active && <span className="h-2 w-2 rounded-full bg-primary" />}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground sm:hidden">{resultText}</p>
    </div>
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
      <Toolbar
        search={props.search}
        onSearchChange={props.onSearchChange}
        resultText={`${areas.length}${active ? ` dari ${props.areas.data.length}` : ""} area`}
        onOpenFilter={() => setFilterOpen(true)}
        active={active}
      />
      {!areas.length ? (
        <div className="px-6 py-16 text-center">
          <Building2 className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 font-semibold">Area tidak ditemukan</p>
        </div>
      ) : (
        <>
          <DesktopList areas={areas} expandedIds={expandedIds} onToggle={toggle} onAddSubArea={props.onAddSubArea} {...actions} />
          <div className="divide-y divide-slate-200 xl:hidden">
            {areas.map((area) => (
              <MobileArea key={area.id} area={area} expanded={expandedIds.has(area.id)} onToggle={() => toggle(area.id)} onAddSubArea={props.onAddSubArea} {...actions} />
            ))}
          </div>
        </>
      )}
      <ServerPagination
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
