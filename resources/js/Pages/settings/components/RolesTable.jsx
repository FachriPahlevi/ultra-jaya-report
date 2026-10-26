import { HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck } from "react-icons/hi"
import Can from "@/Components/Authorization/Can"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import { useState } from "react"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterSelectField from "@/Components/Table/FilterSelectField"

function RoleActionButton({ children, tone = "subtle", className = "", ...props }) {
  const tones = {
    subtle: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
    danger: "border-transparent bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700",
  }

  return (
    <button {...props} className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors ${tones[tone]} ${className}`}>
      {children}
    </button>
  )
}

const getVisibleRoles = (roles, isSuperadmin) => roles.filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN")

function PermissionPreview({ permissions = [] }) {
  const modules = [...new Set(permissions.map((permission) => permission.name.split(".")[0]))]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {modules.slice(0, 3).map((module) => (
        <span key={module} className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
          {module}
        </span>
      ))}
      {modules.length > 3 && <span className="text-xs text-muted-foreground">+{modules.length - 3}</span>}
    </div>
  )
}

function DesktopTable({ roles, onEdit, onDelete, onManagePermissions, systemRoles }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="ui-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Hak akses</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {roles.length === 0 ? (
            <tr>
              <td colSpan="3" className="py-16 text-center text-[13px] text-muted-foreground">
                Role tidak ditemukan
              </td>
            </tr>
          ) : (
            roles.map((role) => (
              <tr key={role.id} className="transition-colors hover:bg-muted/10">
                <td className="px-6 py-5">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{role.name}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{role.permissions.length} permissions assigned</p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <PermissionPreview permissions={role.permissions} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Can permission="permissions.manage">
                      <RoleActionButton onClick={() => onManagePermissions(role)} title="Manage Permissions">
                        <HiOutlineShieldCheck className="mr-1.5 h-4 w-4" />
                        Permissions
                      </RoleActionButton>
                    </Can>
                    {!systemRoles.includes(role.name) && (
                      <>
                        <Can permission="roles.edit">
                          <RoleActionButton onClick={() => onEdit(role)} title="Edit Role">
                            <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                            Edit
                          </RoleActionButton>
                        </Can>
                        <Can permission="roles.delete">
                          <RoleActionButton onClick={() => onDelete(role)} tone="danger" title="Delete Role">
                            <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                            Delete
                          </RoleActionButton>
                        </Can>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function MobileList({ roles, onEdit, onDelete, onManagePermissions, systemRoles }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border xl:hidden">
      {roles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">No roles found</div>
      ) : (
        roles.map((role) => (
          <div key={role.id} className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{role.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{role.permissions.length} hak akses diberikan</p>
              </div>
            </div>

            <div className="mt-3">
              <PermissionPreview permissions={role.permissions} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 max-sm:[&>button]:flex-1">
              <Can permission="permissions.manage">
                <RoleActionButton onClick={() => onManagePermissions(role)} title="Manage Permissions">
                  <HiOutlineShieldCheck className="mr-1.5 h-4 w-4" />
                  Permissions
                </RoleActionButton>
              </Can>
              {!systemRoles.includes(role.name) && (
                <>
                  <Can permission="roles.edit">
                    <RoleActionButton onClick={() => onEdit(role)} title="Edit Role">
                      <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                      Edit
                    </RoleActionButton>
                  </Can>
                  <Can permission="roles.delete">
                    <RoleActionButton onClick={() => onDelete(role)} tone="danger" title="Delete Role">
                      <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                      Delete
                    </RoleActionButton>
                  </Can>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function RolesTable({ roles, onEdit, onDelete, onManagePermissions, isSuperadmin, systemRoles, displayCount, onDisplayCountChange }) {
  const visibleRoles = getVisibleRoles(roles, isSuperadmin)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("name-asc")
  const [roleType, setRoleType] = useState("all")
  const [accessFilter, setAccessFilter] = useState("all")
  const filteredRoles = visibleRoles
    .filter((role) => role.name.toLowerCase().includes(search.toLowerCase()))
    .filter((role) => roleType === "all" || (roleType === "system" ? systemRoles.includes(role.name) : !systemRoles.includes(role.name)))
    .filter((role) => accessFilter === "all" || (accessFilter === "available" ? role.permissions.length > 0 : role.permissions.length === 0))
    .sort((left, right) =>
      sort === "name-desc"
        ? right.name.localeCompare(left.name, "id")
        : sort === "permissions-desc"
          ? right.permissions.length - left.permissions.length || left.name.localeCompare(right.name, "id")
          : sort === "permissions-asc"
            ? left.permissions.length - right.permissions.length || left.name.localeCompare(right.name, "id")
            : left.name.localeCompare(right.name, "id"),
    )
  const displayedRoles = displayCount === -1 ? filteredRoles : filteredRoles.slice(0, displayCount)
  const filterContent = (
    <div className="space-y-5">
      <FilterSelectField
        label="Susun peran"
        value={sort}
        onChange={setSort}
        options={[
          ["name-asc", "Nama A–Z"],
          ["name-desc", "Nama Z–A"],
          ["permissions-desc", "Akses terbanyak"],
          ["permissions-asc", "Akses tersedikit"],
        ]}
      />
      <FilterChoiceGroup
        legend="Sumber peran"
        value={roleType}
        onChange={setRoleType}
        options={[
          ["all", "Semua"],
          ["system", "Bawaan sistem"],
          ["custom", "Dibuat pengguna"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Konfigurasi akses"
        value={accessFilter}
        onChange={setAccessFilter}
        options={[
          ["all", "Semua"],
          ["available", "Sudah diatur"],
          ["empty", "Belum diatur"],
        ]}
        variant="chips"
      />
    </div>
  )

  return (
    <section className="ui-panel overflow-hidden">
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari role..."
        perPage={displayCount}
        onPerPageChange={onDisplayCountChange}
        resultText={`${filteredRoles.length} hasil`}
        filterContent={filterContent}
        mobileFilterActive={sort !== "name-asc" || roleType !== "all" || accessFilter !== "all"}
        onResetFilter={() => {
          setSort("name-asc")
          setRoleType("all")
          setAccessFilter("all")
        }}
      />
      <DesktopTable roles={displayedRoles} onEdit={onEdit} onDelete={onDelete} onManagePermissions={onManagePermissions} systemRoles={systemRoles} />
      <MobileList roles={displayedRoles} onEdit={onEdit} onDelete={onDelete} onManagePermissions={onManagePermissions} systemRoles={systemRoles} />
    </section>
  )
}
