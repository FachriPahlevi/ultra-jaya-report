import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import UserForm from "@/Components/Form/UserForm";
import RoleForm from "@/Components/Form/RoleForm";
import PermissionsForm from "@/Components/Form/PermissionsForm";
import RolesTable from "@/Components/Settings/RolesTable";
import UsersTable from "@/Components/Settings/UsersTable";
import { useStatusModal } from "@/Components/Context/StatusModalContext";

const SETTINGS_TABS = [
    { key: "roles", label: "Roles" },
    { key: "users", label: "Users" },
];

export default function Settings({ users, auth, roles, permissions, filters = {} }) {
    const { setStatusModalProps } = useStatusModal();
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [roleForPermissions, setRoleForPermissions] = useState(null);
    const [activeTab, setActiveTab] = useState(filters.active_tab ?? "roles");
    const [roleDisplayCount, setRoleDisplayCount] = useState(10);

    const isSuperadmin = auth.user.roles[0] === "SUPER_ADMIN";
    const visibleUsersCount = users.data.filter((user) => user.roles[0]?.name !== "SUPER_ADMIN" || user.id === auth.user.id).length;
    const visibleRolesCount = roles.filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN").length;
    const usersPerPage = String(filters.users_per_page ?? 10);

    const showStatusModal = (type, title, message) =>
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });

    const openUserModal = (user = null) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const openRoleModal = (role = null) => {
        setSelectedRole(role);
        setShowRoleModal(true);
    };

    const openPermissionsModal = (role) => {
        setRoleForPermissions(role);
        setShowPermissionsModal(true);
    };

    const confirmDeleteUser = (user) => {
        if (user.roles[0]?.name === "SUPER_ADMIN") {
            showStatusModal("error", "Error", "User dengan role SUPER_ADMIN tidak dapat dihapus untuk menjaga keamanan sistem.");
            return;
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
                        await axios.delete(`/settings/users/${user.id}`);
                        showStatusModal("success", "Success", `User "${user.name}" berhasil dihapus`);
                        router.reload();
                    } catch (error) {
                        const message = error.response?.data?.message || "Terjadi kesalahan saat menghapus user";
                        showStatusModal("error", "Error", message);
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    const confirmDeleteRole = (role) => {
        if (role.name === "SUPER_ADMIN") {
            showStatusModal("error", "Error", "Role SUPER_ADMIN adalah role sistem yang tidak dapat dihapus.");
            return;
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
                        const response = await axios.delete(`/settings/roles/${role.id}`);
                        showStatusModal("success", "Success", response.data.message);
                        router.reload();
                    } catch (error) {
                        const message = error.response?.data?.message || "Terjadi kesalahan saat menghapus role";
                        showStatusModal("error", "Error", message);
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    const handleUsersPerPageChange = (event) => {
        router.get(
            route("settings.index"),
            {
                active_tab: "users",
                users_per_page: event.target.value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout title="Settings">
            <Head>
                <title>Settings</title>
            </Head>

            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Manage users, roles, and permissions from one simple workspace.</p>
                    </div>
                    <div className="inline-flex w-full rounded-2xl border border-border bg-background sm:w-auto">
                        {SETTINGS_TABS.map((tab) => {
                            const count = tab.key === "roles" ? visibleRolesCount : visibleUsersCount;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-[12px] font-medium transition-colors sm:flex-none ${
                                        activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                    <span className="text-[11px] text-muted-foreground">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <section className="overflow-hidden">
                    <div className="p-4 sm:p-6">
                        {activeTab === "roles" ? (
                            <RolesTable
                                roles={roles}
                                onAdd={() => openRoleModal()}
                                onEdit={openRoleModal}
                                onDelete={confirmDeleteRole}
                                onManagePermissions={openPermissionsModal}
                                isSuperadmin={isSuperadmin}
                                displayCount={roleDisplayCount}
                                onDisplayCountChange={(event) => setRoleDisplayCount(Number(event.target.value))}
                            />
                        ) : (
                            <UsersTable
                                users={users}
                                onAdd={() => openUserModal()}
                                onEdit={openUserModal}
                                onDelete={confirmDeleteUser}
                                auth={auth}
                                usersPerPage={usersPerPage}
                                onUsersPerPageChange={handleUsersPerPageChange}
                                activeTab="users"
                            />
                        )}
                    </div>
                </section>
            </div>

            <UserForm isOpen={showUserModal} onClose={() => setShowUserModal(false)} user={selectedUser} roles={roles} isSuperadmin={isSuperadmin} />
            <RoleForm isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} role={selectedRole} />
            <PermissionsForm isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} role={roleForPermissions} permissions={permissions} auth={auth} />
        </AppLayout>
    );
}
