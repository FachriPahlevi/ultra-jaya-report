import { router } from "@inertiajs/react"
import { useMemo, useState } from "react"
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi"
import Can from "@/Components/Authorization/Can"
import ServerPagination from "@/Components/Navigation/ServerPagination"
import DataTableToolbar from "@/Components/Table/DataTableToolbar"
import FilterChoiceGroup from "@/Components/Table/FilterChoiceGroup"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const initials = (name) =>
  name
    ?.split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") ?? "U"
const visibleUsers = (users, auth) => users.data.filter((user) => auth.user.roles.includes("SUPER_ADMIN") || user.roles[0]?.name !== "SUPER_ADMIN" || user.id === auth.user.id)

function ScopeChips({ user }) {
  const assignments = [...(user.managed_areas?.map((area) => area.area) ?? []), ...(user.supervised_sub_areas?.map((subArea) => `${subArea.area?.area ?? "Area"} / ${subArea.name}`) ?? [])]
  if (!assignments.length) return null
  const shown = assignments.slice(0, 2)
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((assignment) => (
        <span key={assignment} title={assignment} className="inline-flex max-w-full truncate rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {assignment}
        </span>
      ))}
      {assignments.length > shown.length && (
        <span title={assignments.slice(shown.length).join(", ")} className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          +{assignments.length - shown.length} more
        </span>
      )}
    </div>
  )
}

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

function visitPage(url, activeTab) {
  if (!url) return
  const target = new URL(url, window.location.origin)
  target.searchParams.set("active_tab", activeTab)
  router.visit(`${target.pathname}${target.search}`, { preserveState: true, preserveScroll: true, replace: true })
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
          visibleUsers(users, auth)
            .map((user) => user.roles[0]?.name)
            .filter(Boolean),
        ),
      ].sort(),
    [users, auth],
  )
  const filtered = useMemo(
    () =>
      visibleUsers(users, auth)
        .filter((user) => role.length === 0 || role.includes(user.roles[0]?.name))
        .filter((user) => status === "all" || (status === "active" ? user.is_active !== false : user.is_active === false))
        .filter(
          (user) => scope === "all" || (scope === "assigned" ? user.managed_areas?.length || user.supervised_sub_areas?.length : !(user.managed_areas?.length || user.supervised_sub_areas?.length)),
        )
        .sort((a, b) =>
          sort === "name-desc"
            ? b.name.localeCompare(a.name, "en")
            : sort === "latest"
              ? new Date(b.created_at || 0) - new Date(a.created_at || 0)
              : sort === "oldest"
                ? new Date(a.created_at || 0) - new Date(b.created_at || 0)
                : a.name.localeCompare(b.name, "en"),
        ),
    [users, auth, role, status, scope, sort],
  )
  const start = users.meta?.from ?? 1
  const filterContent = (
    <div className="space-y-5">
      <FilterSelectField
        label="Sort users"
        value={sort}
        onChange={setSort}
        options={[
          ["name-asc", "Name A–Z"],
          ["name-desc", "Name Z–A"],
          ["latest", "Recently added"],
          ["oldest", "Oldest first"],
        ]}
      />
      <FilterMultiSelect label="User roles" values={role} onChange={setRole} options={availableRoles.map((item) => ({ value: item, label: item }))} placeholder="All roles" searchable={false} />
      <FilterChoiceGroup
        legend="Account status"
        value={status}
        onChange={setStatus}
        options={[
          ["all", "All"],
          ["active", "Active"],
          ["inactive", "Inactive"],
        ]}
        variant="chips"
      />
      <FilterChoiceGroup
        legend="Area assignment"
        value={scope}
        onChange={setScope}
        options={[
          ["all", "All"],
          ["assigned", "Assigned"],
          ["empty", "Unassigned"],
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
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by name or email..."
        perPage={Number(usersPerPage)}
        onPerPageChange={onUsersPerPageChange}
        resultText={`${role.length === 0 ? (users.meta?.total ?? users.data.length) : filtered.length} results`}
        filterContent={filterContent}
        mobileFilterActive={sort !== "name-asc" || role.length > 0 || status !== "all" || scope !== "all"}
        onResetFilter={() => {
          setSort("name-asc")
          setRole([])
          setStatus("all")
          setScope("all")
        }}
      />
      <div className="hidden grid-cols-[56px_minmax(230px,1.25fr)_minmax(190px,1fr)_minmax(140px,.65fr)_minmax(190px,.8fr)] border-y border-border bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground xl:grid">
        <span>No.</span>
        <span>User</span>
        <span>Email</span>
        <span>Role</span>
        <span>Actions</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border bg-card md:grid-cols-2 md:gap-3 md:divide-y-0 md:bg-background/60 md:p-3 xl:block xl:bg-card xl:p-0">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-muted-foreground md:col-span-2">No users found.</div>
        ) : (
          filtered.map((user, index) => (
            <article
              key={user.id}
              className="flex min-w-0 flex-col p-4 transition-colors hover:bg-muted/10 md:rounded-xl md:border md:border-border md:bg-card xl:grid xl:grid-cols-[56px_minmax(230px,1.25fr)_minmax(190px,1fr)_minmax(140px,.65fr)_minmax(190px,.8fr)] xl:items-center xl:rounded-none xl:border-x-0 xl:border-b xl:border-t-0 xl:px-5 xl:py-4"
            >
              <span className="mb-2 text-[11px] font-semibold text-muted-foreground xl:mb-0 xl:text-[13px] xl:text-foreground">
                <span className="xl:hidden">#</span>
                {start + index}
              </span>
              <div className="flex min-w-0 items-start gap-3 xl:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(user.name)}</div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{user.name}</h3>
                  <ScopeChips user={user} />
                </div>
              </div>
              <div className="mt-3 min-w-0 xl:mt-0 xl:px-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground xl:hidden">Email</span>
                <p className="break-all text-xs leading-5 text-muted-foreground xl:break-normal">{user.email}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 xl:mt-0">
                <span className="inline-flex max-w-full truncate rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-foreground">
                  {user.roles[0]?.name || "No role"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground xl:hidden">
                  <span className={`h-1.5 w-1.5 rounded-full ${user.is_active === false ? "bg-slate-400" : "bg-emerald-500"}`} />
                  {user.is_active === false ? "Inactive" : "Active"}
                </span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-3 md:mt-auto xl:mt-0 xl:border-0 xl:p-0 max-sm:[&>button]:flex-1">
                {user.can?.update && (
                  <Can permission="users.edit">
                    <Action onClick={() => onEdit(user)} title="Edit User">
                      <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                      Edit
                    </Action>
                  </Can>
                )}
                {user.can?.delete && (
                  <Can permission="users.delete">
                    <Action danger onClick={() => onDelete(user)} title="Delete User">
                      <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                      Delete
                    </Action>
                  </Can>
                )}
              </div>
            </article>
          ))
        )}
      </div>
      <ServerPagination language="en" links={users.links} from={users.meta?.from} to={users.meta?.to} total={users.meta?.total ?? 0} onNavigate={(url) => visitPage(url, activeTab)} />
    </section>
  )
}
