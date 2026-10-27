import { useState } from "react"
import { HiOutlinePencil, HiOutlineShieldCheck, HiOutlineTrash } from "react-icons/hi"
import Can from "@/Components/Authorization/Can"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

function Action({ children, danger = false, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}

function PermissionPreview({ permissions = [] }) {
  const modules = [...new Set(permissions.map((permission) => permission.name.split(".")[0]))]
  const shown = modules.slice(0, 3)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((module) => (
        <span key={module} className="inline-flex max-w-full truncate rounded-md border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">
          {module}
        </span>
      ))}
      {modules.length > shown.length && <span className="text-xs font-medium text-muted-foreground">+{modules.length - shown.length}</span>}
    </div>
  )
}

export default function RolesTable({ roles, onEdit, onDelete, onManagePermissions, isSuperadmin, systemRoles, displayCount, onDisplayCountChange }) {
  const visible = roles.filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("name-asc")
  const [roleType, setRoleType] = useState("all")
  const [accessFilter, setAccessFilter] = useState("all")
  const filtered = visible
    .filter((role) => role.name.toLowerCase().includes(search.toLowerCase()))
    .filter((role) => roleType === "all" || (roleType === "system" ? systemRoles.includes(role.name) : !systemRoles.includes(role.name)))
    .filter((role) => accessFilter === "all" || (accessFilter === "available" ? role.permissions.length > 0 : role.permissions.length === 0))
    .sort((a, b) =>
      sort === "name-desc"
        ? b.name.localeCompare(a.name, "en")
        : sort === "permissions-desc"
          ? b.permissions.length - a.permissions.length || a.name.localeCompare(b.name, "en")
          : sort === "permissions-asc"
            ? a.permissions.length - b.permissions.length || a.name.localeCompare(b.name, "en")
            : a.name.localeCompare(b.name, "en"),
    )
  const displayed = displayCount === -1 ? filtered : filtered.slice(0, displayCount)
  const filterContent = (
    <div className="space-y-5">
      <FilterSelectField
        label="Sort roles"
        value={sort}
        onChange={setSort}
        options={[
          ["name-asc", "Name A–Z"],
          ["name-desc", "Name Z–A"],
          ["permissions-desc", "Most permissions"],
          ["permissions-asc", "Fewest permissions"],
        ]}
      />
      <FilterChoiceGroup
        legend="Role source"
        value={roleType}
        onChange={setRoleType}
        options={[
          ["all", "All"],
          ["system", "System roles"],
          ["custom", "Custom roles"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Permission setup"
        value={accessFilter}
        onChange={setAccessFilter}
        options={[
          ["all", "All"],
          ["available", "Configured"],
          ["empty", "Not configured"],
        ]}
        variant="chips"
      />
    </div>
  )

  return (
    <section className="ui-panel overflow-hidden">
      <DataTableToolbar
        language="en"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search roles..."
        perPage={displayCount}
        onPerPageChange={onDisplayCountChange}
        resultText={`${filtered.length} results`}
        filterContent={filterContent}
        mobileFilterActive={sort !== "name-asc" || roleType !== "all" || accessFilter !== "all"}
        onResetFilter={() => {
          setSort("name-asc")
          setRoleType("all")
          setAccessFilter("all")
        }}
      />
      <div className="hidden grid-cols-[48px_minmax(180px,.75fr)_120px_minmax(260px,1.2fr)_minmax(250px,1fr)] border-y border-border bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground lg:grid">
        <span>No.</span>
        <span>Role</span>
        <span>Type</span>
        <span>Permissions</span>
        <span>Actions</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border bg-card md:grid-cols-2 md:gap-3 md:divide-y-0 md:bg-background/60 md:p-3 lg:block lg:bg-card lg:p-0">
        {displayed.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-muted-foreground md:col-span-2">No roles found.</div>
        ) : (
          displayed.map((role, index) => (
            <article
              key={role.id}
              className="flex min-w-0 flex-col p-4 transition-colors hover:bg-muted/10 md:rounded-xl md:border md:border-border md:bg-card lg:grid lg:grid-cols-[48px_minmax(180px,.75fr)_120px_minmax(260px,1.2fr)_minmax(250px,1fr)] lg:items-center lg:rounded-none lg:border-x-0 lg:border-b lg:border-t-0 lg:px-5 lg:py-4"
            >
              <span className="mb-2 text-[11px] font-semibold text-muted-foreground lg:mb-0 lg:text-[13px] lg:text-foreground">
                <span className="lg:hidden">#</span>
                {index + 1}
              </span>
              <div className="min-w-0 lg:pr-4">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold leading-5 text-foreground">{role.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role.permissions.length} {role.permissions.length === 1 ? "permission" : "permissions"}
                  </p>
                </div>
              </div>
              <div className="mt-3 lg:mt-0">
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{systemRoles.includes(role.name) ? "System" : "Custom"}</span>
              </div>
              <div className="mt-3 lg:mt-0 lg:pr-4">
                <PermissionPreview permissions={role.permissions} />
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-border pt-3 md:mt-auto lg:mt-0 lg:border-0 lg:p-0">
                <Can permission="permissions.manage">
                  <Action onClick={() => onManagePermissions(role)} title="Manage Permissions">
                    <HiOutlineShieldCheck className="mr-1.5 h-4 w-4" />
                    Permissions
                  </Action>
                </Can>
                {!systemRoles.includes(role.name) && (
                  <>
                    <Can permission="roles.edit">
                      <Action onClick={() => onEdit(role)} title="Edit Role">
                        <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Action>
                    </Can>
                    <Can permission="roles.delete">
                      <Action danger onClick={() => onDelete(role)} title="Delete Role">
                        <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                        Delete
                      </Action>
                    </Can>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
