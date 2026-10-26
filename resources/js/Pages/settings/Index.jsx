import { getRequestErrorMessage } from "@/lib/errorMessages"
import { useEffect, useState } from "react"
import { Head, router } from "@inertiajs/react"
import http from "@/lib/http"
import AppLayout from "@/Layouts/AppLayout"
import UserForm from "@/Pages/settings/components/UserForm"
import RoleForm from "@/Pages/settings/components/RoleForm"
import PermissionEditorModal from "@/Pages/settings/components/PermissionEditorModal"
import RolesTable from "@/Pages/settings/components/RolesTable"
import UsersTable from "@/Pages/settings/components/UsersTable"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { useAuthorization } from "@/hooks/useAuthorization"
import PageHeader from "@/Components/Layout/PageHeader"
import BtnDefault from "@/Components/Button/BtnDefault"
import { HiOutlinePlus } from "react-icons/hi"

const SETTINGS_TABS = [
  { key: "roles", label: "Role" },
  { key: "users", label: "Pengguna" },
]

export default function Settings({ users, auth, roles, permissions, systemRoles, areas = [], filters = {} }) {
  const { setStatusModalProps } = useStatusModal()
  const { can } = useAuthorization()
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [roleForPermissions, setRoleForPermissions] = useState(null)
  const canViewRoles = can("roles.view")
  const canViewUsers = can("users.view")
  const canAddRoles = can("roles.create")
  const canAddUsers = can("users.create")
  const [activeTab, setActiveTab] = useState(filters.active_tab === "users" && canViewUsers ? "users" : canViewRoles ? "roles" : "users")
  const [roleDisplayCount, setRoleDisplayCount] = useState(10)
  const [userSearch, setUserSearch] = useState(filters.user_search ?? "")

  const isSuperadmin = auth.user.roles.includes("SUPER_ADMIN")
  const visibleUsersCount = users.data.filter((user) => user.roles[0]?.name !== "SUPER_ADMIN" || user.id === auth.user.id).length
  const visibleRolesCount = roles.filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN").length
  const usersPerPage = String(filters.users_per_page ?? 10)

  useEffect(() => {
    if (userSearch === (filters.user_search ?? "")) return undefined

    const timeoutId = window.setTimeout(() => {
      router.get(route("settings.index"), { active_tab: "users", users_per_page: usersPerPage, user_search: userSearch }, { preserveState: true, preserveScroll: true, replace: true })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [filters.user_search, userSearch, usersPerPage])

  const showStatusModal = (type, title, message) =>
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })

  const openUserModal = (user = null) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const openRoleModal = (role = null) => {
    setSelectedRole(role)
    setShowRoleModal(true)
  }

  const openPermissionsModal = (role) => {
    setRoleForPermissions(role)
    setShowPermissionsModal(true)
  }

  const confirmDeleteUser = (user) => {
    if (user.roles[0]?.name === "SUPER_ADMIN") {
      showStatusModal("error", "Error", "User dengan role SUPER_ADMIN tidak dapat dihapus untuk menjaga keamanan sistem.")
      return
    }

    setStatusModalProps({
      isOpen: true,
      type: "warning",
      title: "Delete User",
      message: `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      button1: {
        text: "Delete",
        variant: "danger",
        onClick: async () => {
          try {
            const response = await http.delete(`/settings/users/${user.id}`)
            showStatusModal("success", "Success", response.data?.message || `User "${user.name}" berhasil dihapus`)
            router.reload()
          } catch (error) {
            const message = getRequestErrorMessage(error)
            showStatusModal("error", "Error", message)
          }
        },
      },
      button2: { text: "Cancel" },
    })
  }

  const confirmDeleteRole = (role) => {
    if (role.name === "SUPER_ADMIN") {
      showStatusModal("error", "Error", "Role SUPER_ADMIN adalah role sistem yang tidak dapat dihapus.")
      return
    }

    setStatusModalProps({
      isOpen: true,
      type: "warning",
      title: "Delete Role",
      message: `Apakah Anda yakin ingin menghapus role "${role.name}"?`,
      button1: {
        text: "Delete",
        variant: "danger",
        onClick: async () => {
          try {
            const response = await http.delete(`/settings/roles/${role.id}`)
            showStatusModal("success", "Success", response.data.message)
            router.reload()
          } catch (error) {
            const message = getRequestErrorMessage(error)
            showStatusModal("error", "Error", message)
          }
        },
      },
      button2: { text: "Cancel" },
    })
  }

  const handleUsersPerPageChange = (value) => {
    router.get(
      route("settings.index"),
      {
        active_tab: "users",
        users_per_page: value,
        user_search: userSearch,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      },
    )
  }

  return (
    <AppLayout title="Settings">
      <Head>
        <title>Settings</title>
      </Head>

      <div className="flex flex-col gap-5">
        <PageHeader
          title="Pengaturan"
          mobileAction={
            activeTab === "roles" && canAddRoles ? (
              <button
                type="button"
                onClick={() => openRoleModal()}
                aria-label="Tambah role"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : activeTab === "users" && canAddUsers ? (
              <button
                type="button"
                onClick={() => openUserModal()}
                aria-label="Tambah pengguna"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : null
          }
          actions={
            <>
              <div className="inline-flex flex-1 rounded-lg border border-border bg-background p-0.5 sm:flex-none">
                {SETTINGS_TABS.filter((tab) => (tab.key === "roles" ? canViewRoles : canViewUsers)).map((tab) => {
                  const count = tab.key === "roles" ? visibleRolesCount : visibleUsersCount

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors sm:flex-none ${
                        activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                      <span className="text-[11px] text-muted-foreground">{count}</span>
                    </button>
                  )
                })}
              </div>
              {activeTab === "roles" && canAddRoles && (
                <BtnDefault onClick={() => openRoleModal()} className="gap-2">
                  <HiOutlinePlus className="h-4 w-4" /> Tambah Role
                </BtnDefault>
              )}
              {activeTab === "users" && canAddUsers && (
                <BtnDefault onClick={() => openUserModal()} className="gap-2">
                  <HiOutlinePlus className="h-4 w-4" /> Tambah Pengguna
                </BtnDefault>
              )}
            </>
          }
        />

        <div className="inline-flex w-full rounded-xl border border-border bg-background p-1 md:hidden">
          {SETTINGS_TABS.filter((tab) => (tab.key === "roles" ? canViewRoles : canViewUsers)).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {tab.label}
              <span className="text-[11px] text-muted-foreground">{tab.key === "roles" ? visibleRolesCount : visibleUsersCount}</span>
            </button>
          ))}
        </div>

        <section>
          {activeTab === "roles" ? (
            <RolesTable
              roles={roles}
              onEdit={openRoleModal}
              onDelete={confirmDeleteRole}
              onManagePermissions={openPermissionsModal}
              isSuperadmin={isSuperadmin}
              systemRoles={systemRoles}
              displayCount={roleDisplayCount}
              onDisplayCountChange={setRoleDisplayCount}
            />
          ) : (
            <UsersTable
              users={users}
              onEdit={openUserModal}
              onDelete={confirmDeleteUser}
              auth={auth}
              usersPerPage={usersPerPage}
              onUsersPerPageChange={handleUsersPerPageChange}
              activeTab="users"
              search={userSearch}
              onSearchChange={setUserSearch}
            />
          )}
        </section>
      </div>

      <UserForm isOpen={showUserModal} onClose={() => setShowUserModal(false)} user={selectedUser} roles={roles} areas={areas} isSuperadmin={isSuperadmin} />
      <RoleForm isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} role={selectedRole} />
      <PermissionEditorModal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} role={roleForPermissions} permissions={permissions} auth={auth} />
    </AppLayout>
  )
}
