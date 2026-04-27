// resources/js/Pages/settings/Index.jsx
import { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import PermissionsMForm from "@/Components/Form/PermissionsForm";
import UserForm from "@/Components/Form/UserForm";
import UsersTable from "@/Components/Settings/UsersTable";
import RolesTable from "@/Components/Settings/RolesTable";
import PermissionSummary from "@/Components/Settings/PermissionSummary";
import RoleForm from "@/Components/Form/RoleForm";


export default function Settings({ users, roles, permissions }) {
    const { setStatusModalProps } = useStatusModal();
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermissionsMForm, setShowPermissionsMForm] = useState(false);
    const [roleForPermissions, setRoleForPermissions] = useState(null);

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const permissionGroups = {
        users: permissions.filter((p) => p.name.startsWith("users.")),
        areas: permissions.filter((p) => p.name.startsWith("areas.")),
        activities: permissions.filter((p) => p.name.startsWith("activities.")),
        reports: permissions.filter((p) => p.name.startsWith("reports.")),
    };

    const confirmDeleteUser = (user) => {
        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: "Delete User",
            message: `Are you sure you want to delete user "${user.name}"?`,
            button1: {
                text: "Delete",
                onClick: async () => {
                    try {
                        await axios.delete(`/settings/users/${user.id}`);
                        showStatusModal("success", "Success", "User deleted");
                        window.location.reload();
                    } catch (error) {
                        showStatusModal("error", "Error", "Failed to delete user");
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    const confirmDeleteRole = (role) => {
        if (role.name === "SUPER_ADMIN") {
            showStatusModal("error", "Error", "Cannot delete SUPER_ADMIN role");
            return;
        }

        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: "Delete Role",
            message: `Are you sure you want to delete role "${role.name}"?`,
            button1: {
                text: "Delete",
                onClick: async () => {
                    try {
                        await axios.delete(`/settings/roles/${role.id}`);
                        showStatusModal("success", "Success", "Role deleted");
                        window.location.reload();
                    } catch (error) {
                        showStatusModal("error", "Error", "Failed to delete role");
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    return (
        <AppLayout title="Settings">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and permissions</p>
                </div>

                <UsersTable
                    users={users}
                    onAdd={() => {
                        setSelectedUser(null);
                        setShowUserModal(true);
                    }}
                    onEdit={(user) => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                    }}
                    onDelete={confirmDeleteUser}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RolesTable
                        roles={roles}
                        onAdd={() => {
                            setSelectedRole(null);
                            setShowRoleModal(true);
                        }}
                        onEdit={(role) => {
                            setSelectedRole(role);
                            setShowRoleModal(true);
                        }}
                        onDelete={confirmDeleteRole}
                        onManagePermissions={(role) => {
                            setRoleForPermissions(role);
                            setShowPermissionsMForm(true);
                        }}
                    />
                    <PermissionSummary groups={permissionGroups} />
                </div>
            </div>

            <UserForm
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                user={selectedUser}
                roles={roles}
            />

            <RoleForm   
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                role={selectedRole}
            />

            <PermissionsMForm
                isOpen={showPermissionsMForm}
                onClose={() => setShowPermissionsMForm(false)}
                role={roleForPermissions}
                permissions={permissions}
            />
        </AppLayout>
    );
}