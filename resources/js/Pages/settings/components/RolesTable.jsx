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
      <div className="hidden grid-cols-[minmax(220px,.8fr)_minmax(300px,1.25fr)_minmax(280px,1fr)] border-y border-border bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground xl:grid">
        <span>Role</span>
        <span>Permissions</span>
        <span>Actions</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border bg-card md:grid-cols-2 md:gap-3 md:divide-y-0 md:bg-background/60 md:p-3 xl:block xl:bg-card xl:p-0">
        {displayed.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-muted-foreground md:col-span-2">No roles found.</div>
        ) : (
          displayed.map((role) => (
            <article
              key={role.id}
              className="flex min-w-0 flex-col p-4 transition-colors hover:bg-muted/10 md:rounded-xl md:border md:border-border md:bg-card xl:grid xl:grid-cols-[minmax(220px,.8fr)_minmax(300px,1.25fr)_minmax(280px,1fr)] xl:items-center xl:rounded-none xl:border-x-0 xl:border-b xl:border-t-0 xl:px-5 xl:py-4"
            >
              <div className="flex items-start justify-between gap-3 xl:pr-4">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold leading-5 text-foreground">{role.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role.permissions.length} {role.permissions.length === 1 ? "permission" : "permissions"}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground xl:hidden">{systemRoles.includes(role.name) ? "System" : "Custom"}</span>
              </div>
              <div className="mt-3 xl:mt-0 xl:pr-4">
                <PermissionPreview permissions={role.permissions} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 md:mt-auto xl:mt-0 xl:border-0 xl:p-0 max-sm:[&>button]:flex-1">
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
