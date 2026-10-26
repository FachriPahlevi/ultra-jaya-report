import { router } from "@inertiajs/react"
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import Can from "@/Components/Authorization/Can"
import { useMemo, useState } from "react"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const USER_TABLE_COLUMNS = ["No", "User", "Email", "Role", "Actions"]

const getInitials = (name) =>
  name
    ?.split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") ?? "U"

const getVisibleUsers = (users, auth) => users.data.filter((user) => auth.user.roles.includes("SUPER_ADMIN") || user.roles[0]?.name !== "SUPER_ADMIN" || user.id === auth.user.id)

function AreaAssignmentChips({ user }) {
  const assignments = [...(user.managed_areas?.map((area) => area.area) ?? []), ...(user.supervised_sub_areas?.map((subArea) => `${subArea.area?.area ?? "Area"} / ${subArea.name}`) ?? [])]

  if (!assignments.length && !user.scope_capabilities?.review && !user.scope_capabilities?.close) {
    return null
  }

  if (!assignments.length) {
    return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">Belum ada scope ditugaskan</span>
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {assignments.map((assignment) => (
        <span key={assignment} className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {assignment}
        </span>
      ))}
    </div>
  )
}

function UserActionButton({ children, tone = "subtle", className = "", ...props }) {
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

function visitWithActiveTab(url, activeTab) {
  if (!url) {
    return
  }

  const target = new URL(url, window.location.origin)
  target.searchParams.set("active_tab", activeTab)

  router.visit(`${target.pathname}${target.search}`, {
    preserveState: true,
    preserveScroll: true,
    replace: true,
  })
}

function DesktopTable({ users, auth, onEdit, onDelete }) {
  const visibleUsers = getVisibleUsers(users, auth)
  const startNumber = users.meta?.from ?? 1

  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="ui-table">
        <thead>
          <tr>
            {USER_TABLE_COLUMNS.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {visibleUsers.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-16 text-center text-[13px] text-muted-foreground">
                Pengguna tidak ditemukan
              </td>
            </tr>
          ) : (
            visibleUsers.map((user, index) => (
              <tr key={user.id} className="transition-colors hover:bg-muted/10">
                <td className="w-12 px-6 py-5 text-[13px] font-semibold text-foreground">{startNumber + index}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">{getInitials(user.name)}</div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{user.name}</p>
                      <AreaAssignmentChips user={user} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-[12.5px] text-muted-foreground">{user.email}</td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                    {user.roles[0]?.name || "No role"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    {user.can?.update && (
                      <Can permission="users.edit">
                        <UserActionButton onClick={() => onEdit(user)} title="Edit User">
                          <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                          Edit
                        </UserActionButton>
                      </Can>
                    )}
                    {user.can?.delete && (
                      <Can permission="users.delete">
                        <UserActionButton onClick={() => onDelete(user)} tone="danger" title="Delete User">
                          <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                          Delete
                        </UserActionButton>
                      </Can>
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

function MobileList({ users, auth, onEdit, onDelete }) {
  const visibleUsers = getVisibleUsers(users, auth)
  const startNumber = users.meta?.from ?? 1

  return (
    <div className="grid grid-cols-1 divide-y divide-border xl:hidden">
      {visibleUsers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">No users found</div>
      ) : (
        visibleUsers.map((user, index) => (
          <div key={user.id} className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">{getInitials(user.name)}</div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">#{startNumber + index}</p>
                  <h3 className="truncate text-[15px] font-semibold text-foreground">{user.name}</h3>
                </div>
              </div>
              <span className="inline-flex max-w-[42%] shrink-0 truncate rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">
                {user.roles[0]?.name || "No role"}
              </span>
            </div>

            <p className="mt-3 break-all text-sm text-muted-foreground">{user.email}</p>
            <AreaAssignmentChips user={user} />

            <div className="mt-4 flex gap-2 border-t border-border pt-4 max-sm:[&>button]:flex-1">
              {user.can?.update && (
                <Can permission="users.edit">
                  <UserActionButton onClick={() => onEdit(user)} title="Edit User">
                    <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </UserActionButton>
                </Can>
              )}
              {user.can?.delete && (
                <Can permission="users.delete">
                  <UserActionButton onClick={() => onDelete(user)} tone="danger" title="Delete User">
                    <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                    Delete
                  </UserActionButton>
                </Can>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function UsersTable({ users, onEdit, onDelete, auth, usersPerPage, onUsersPerPageChange, activeTab = "users", search, onSearchChange }) {
  const [sort, setSort] = useState("name-asc")
  const [role, setRole] = useState([])
  const [status, setStatus] = useState("all")
  const [scope, setScope] = useState("all")
  const availableRoles = useMemo(
    () =>
      [
        ...new Set(
          getVisibleUsers(users, auth)
            .map((user) => user.roles[0]?.name)
            .filter(Boolean),
        ),
      ].sort(),
    [users, auth],
  )
  const filteredUsers = useMemo(
    () =>
      getVisibleUsers(users, auth)
        .filter((user) => role.length === 0 || role.includes(user.roles[0]?.name))
        .filter((user) => status === "all" || (status === "active" ? user.is_active !== false : user.is_active === false))
        .filter(
          (user) => scope === "all" || (scope === "assigned" ? user.managed_areas?.length || user.supervised_sub_areas?.length : !(user.managed_areas?.length || user.supervised_sub_areas?.length)),
        )
        .sort((left, right) =>
          sort === "name-desc"
            ? right.name.localeCompare(left.name, "id")
            : sort === "latest"
              ? new Date(right.created_at || 0) - new Date(left.created_at || 0)
              : sort === "oldest"
                ? new Date(left.created_at || 0) - new Date(right.created_at || 0)
                : left.name.localeCompare(right.name, "id"),
        ),
    [users, auth, role, scope, sort, status],
  )
  const displayUsers = { ...users, data: filteredUsers }
  const filterContent = (
    <div className="space-y-5">
      <FilterSelectField
        label="Susun pengguna"
        value={sort}
        onChange={setSort}
        options={[
          ["name-asc", "Nama A–Z"],
          ["name-desc", "Nama Z–A"],
          ["latest", "Terbaru ditambahkan"],
          ["oldest", "Paling lama ditambahkan"],
        ]}
      />
      <FilterMultiSelect label="Peran pengguna" values={role} onChange={setRole} options={availableRoles.map((item) => ({ value: item, label: item }))} placeholder="Semua peran" searchable={false} />
      <FilterChoiceGroup
        legend="Status akun"
        value={status}
        onChange={setStatus}
        options={[
          ["all", "Semua"],
          ["active", "Aktif"],
          ["inactive", "Nonaktif"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Penugasan wilayah"
        value={scope}
        onChange={setScope}
        options={[
          ["all", "Semua"],
          ["assigned", "Sudah ditugaskan"],
          ["empty", "Belum ditugaskan"],
        ]}
        variant="chips"
      />
    </div>
  )

  return (
    <section className="ui-panel overflow-hidden">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari nama atau email..."
        perPage={Number(usersPerPage)}
        onPerPageChange={onUsersPerPageChange}
        resultText={`${role.length === 0 ? (users.meta?.total ?? users.data.length) : filteredUsers.length} hasil`}
        filterContent={filterContent}
        mobileFilterActive={sort !== "name-asc" || role.length > 0 || status !== "all" || scope !== "all"}
        onResetFilter={() => {
          setSort("name-asc")
          setRole([])
          setStatus("all")
          setScope("all")
        }}
      />
      <DesktopTable users={displayUsers} auth={auth} onEdit={onEdit} onDelete={onDelete} />
      <MobileList users={displayUsers} auth={auth} onEdit={onEdit} onDelete={onDelete} />
      <ServerPagination links={users.links} from={users.meta?.from} to={users.meta?.to} total={users.meta?.total ?? 0} onNavigate={(url) => visitWithActiveTab(url, activeTab)} />
    </section>
  )
}
