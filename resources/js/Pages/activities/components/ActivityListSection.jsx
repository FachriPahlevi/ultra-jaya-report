import { Fragment, useEffect, useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import { HiChevronDown, HiChevronRight } from "react-icons/hi"
import { ActivityActions, EmptyState, ScopeAccess } from "./ActivityShared"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import BtnDefault from "@/Components/Button/BtnDefault"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

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

function ParentRow({ activity, expanded, onToggle, canEdit, canDelete, onAddSub, onEdit, onDelete }) {
  return (
    <tr className={expanded ? "bg-blue-50/30" : "bg-white"}>
      <td>
        <div className="flex min-w-[250px] items-start gap-2">
          <ExpandButton expanded={expanded} onClick={onToggle} label={activity.name} />
          <div className="min-w-0 pt-1.5">
            <p className="text-[15px] font-semibold leading-5 text-slate-900">{activity.name}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{activity.children_count} sub-aktivitas</p>
          </div>
        </div>
      </td>
      <td>
        <ScopeAccess activity={activity} />
      </td>
      <td className="w-16 text-right">
        <div className="flex justify-end">
          <ActivityActions activity={activity} canEdit={canEdit} canDelete={canDelete} onAddSub={onAddSub} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  )
}

function ChildRow({ activity, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <tr className="bg-slate-50/70">
      <td>
        <div className="flex min-w-[250px] items-start gap-3 pl-[52px]">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-300" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-slate-800">{activity.name}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Sub-aktivitas</p>
          </div>
        </div>
      </td>
      <td>
        <ScopeAccess activity={activity} />
      </td>
      <td className="w-16 text-right">
        <div className="flex justify-end">
          <ActivityActions activity={activity} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  )
}

function DesktopTable({ activities, expandedIds, onToggle, ...actions }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="ui-table min-w-[980px]">
        <thead>
          <tr>
            <th className="w-[36%]">Aktivitas</th>
            <th>Cakupan &amp; Akses</th>
            <th>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.data.map((activity) => (
            <Fragment key={activity.id}>
              <ParentRow activity={activity} expanded={expandedIds.has(activity.id)} onToggle={() => onToggle(activity.id)} {...actions} />
              {expandedIds.has(activity.id) && activity.children.map((child) => <ChildRow key={child.id} activity={child} {...actions} />)}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileActivity({ activity, expanded, onToggle, canEdit, canDelete, onAddSub, onEdit, onDelete }) {
  return (
    <article className={expanded ? "bg-slate-50/80" : "bg-white"}>
      <div className="flex items-start gap-1 px-3 py-3 sm:px-5">
        <ExpandButton expanded={expanded} onClick={onToggle} label={activity.name} />
        <div className="min-w-0 flex-1 py-1.5">
          <h3 className="text-[15px] font-semibold leading-5 text-slate-900">{activity.name}</h3>
          <p className="mt-1.5 text-xs font-medium text-slate-500">{activity.children_count} sub-aktivitas</p>
        </div>
        <ActivityActions activity={activity} canEdit={canEdit} canDelete={canDelete} onAddSub={onAddSub} onEdit={onEdit} onDelete={onDelete} />
      </div>
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-4 sm:px-6">
          <section aria-label={`Cakupan dan akses ${activity.name}`}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cakupan &amp; Akses</p>
            <ScopeAccess activity={activity} chips />
          </section>
          <section aria-label={`Sub-aktivitas ${activity.name}`} className="mt-5 border-t border-slate-200 pt-2">
            {activity.children.length === 0 ? (
              <p className="py-3 pl-6 text-sm text-slate-500">Belum ada sub-aktivitas.</p>
            ) : (
              <div>
                {activity.children.map((child) => (
                  <div key={child.id} className="flex items-start gap-2 py-2.5">
                    <span className="mt-0.5 w-4 shrink-0 text-sm leading-5 text-slate-400" aria-hidden="true">
                      ↳
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 text-slate-800">{child.name}</p>
                      <div className="mt-0.5">
                        <ScopeAccess activity={child} compact />
                      </div>
                    </div>
                    <ActivityActions activity={child} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </article>
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

function MobileToolbar({ search, onSearchChange, perPage, onPerPageChange, resultText, allExpanded, onToggleAll, hasData, filterProps, onResetFilter }) {
  return (
    <div className="xl:hidden">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari aktivitas atau sub-aktivitas..."
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        resultText={resultText}
        filterContent={<ActivitySortOptions {...filterProps} />}
        mobileFilterActive={
          filterProps.sort !== "default" || filterProps.childFilter !== "all" || filterProps.scopeFilter !== "all" || filterProps.roleFilter.length > 0 || filterProps.descriptionFilter !== "all"
        }
        onResetFilter={onResetFilter}
        sheetActions={
          hasData ? (
            <BtnDefault outline size="sm" onClick={onToggleAll}>
              {allExpanded ? "Tutup semua" : "Buka semua"}
            </BtnDefault>
          ) : null
        }
      />
    </div>
  )
}

export default function ActivityListSection({ activities, canEdit, canDelete, onAddSub, onEdit, onDelete, search, onSearchChange, perPage, onPerPageChange }) {
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
  const commonProps = { canEdit, canDelete, onAddSub, onEdit, onDelete }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
      <div className="hidden xl:block">
        <DataTableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Cari aktivitas atau sub-aktivitas..."
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          resultText={resultText}
          filterContent={<ActivitySortOptions {...filterProps} />}
          mobileFilterActive={sort !== "default" || childFilter !== "all" || scopeFilter !== "all" || roleFilter.length > 0 || descriptionFilter !== "all"}
          onResetFilter={resetFilter}
          sheetActions={
            activities.data.length > 0 ? (
              <BtnDefault outline size="sm" onClick={handleToggleAll}>
                {allExpanded ? "Tutup Semua" : "Buka Semua"}
              </BtnDefault>
            ) : null
          }
        />
      </div>
      <MobileToolbar
        search={search}
        onSearchChange={onSearchChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        resultText={resultText}
        allExpanded={allExpanded}
        onToggleAll={handleToggleAll}
        hasData={activities.data.length > 0}
        filterProps={filterProps}
        onResetFilter={resetFilter}
      />
      {sortedActivities.length === 0 ? (
        <EmptyState hasSearch={Boolean(search)} />
      ) : (
        <>
          <DesktopTable activities={{ ...activities, data: sortedActivities }} expandedIds={expandedIds} onToggle={handleToggle} {...commonProps} />
          <div className="divide-y divide-slate-200 xl:hidden">
            {sortedActivities.map((activity) => (
              <MobileActivity key={activity.id} activity={activity} expanded={expandedIds.has(activity.id)} onToggle={() => handleToggle(activity.id)} {...commonProps} />
            ))}
          </div>
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
