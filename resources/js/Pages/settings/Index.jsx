// resources/js/Pages/settings/Index.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineX,
    HiOutlineShieldCheck,
    HiOutlineUserAdd,
    HiOutlineUser,
} from "react-icons/hi";

const getInitials = (name) => {
    return (
        name
            ?.split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") ?? "U"
    );
};

export default function Settings({ users, roles, permissions }) {
    const { setStatusModalProps } = useStatusModal();
    const [activeTab, setActiveTab] = useState("users");

    // User state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        role: "",
        password: "",
    });
    const [processing, setProcessing] = useState(false);

    // Role state
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: "" });
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const roleOptions = roles.map((role) => ({
        label: role.name,
        value: role.name,
    }));

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    // User CRUD
    const openAddUser = () => {
        setEditUser(null);
        setUserForm({ name: "", email: "", role: "", password: "" });
        setShowUserModal(true);
    };

    const openEditUser = (user) => {
        setEditUser(user);
        setUserForm({
            name: user.name,
            email: user.email,
            role: user.roles[0]?.name || "",
            password: "",
        });
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setEditUser(null);
        setUserForm({ name: "", email: "", role: "", password: "" });
    };

    const submitUser = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (editUser) {
                await axios.put(`/settings/users/${editUser.id}`, userForm);
                showStatusModal("success", "Success", "User updated");
            } else {
                await axios.post("/settings/users", userForm);
                showStatusModal("success", "Success", "User created");
            }
            router.reload();
            closeUserModal();
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to save user";
            showStatusModal("error", "Error", message);
        } finally {
            setProcessing(false);
        }
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
                        router.reload();
                    } catch (error) {
                        showStatusModal(
                            "error",
                            "Error",
                            "Failed to delete user",
                        );
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    // Role CRUD
    const openAddRole = () => {
        setEditRole(null);
        setRoleForm({ name: "" });
        setShowRoleModal(true);
    };

    const openEditRole = (role) => {
        setEditRole(role);
        setRoleForm({ name: role.name });
        setShowRoleModal(true);
    };

    const closeRoleModal = () => {
        setShowRoleModal(false);
        setEditRole(null);
        setRoleForm({ name: "" });
    };

    const submitRole = async (e) => {
        e.preventDefault();

        try {
            if (editRole) {
                await axios.put(`/settings/roles/${editRole.id}`, roleForm);
                showStatusModal("success", "Success", "Role updated");
            } else {
                await axios.post("/settings/roles", roleForm);
                showStatusModal("success", "Success", "Role created");
            }
            router.reload();
            closeRoleModal();
        } catch (error) {
            showStatusModal(
                "error",
                "Error",
                error.response?.data?.message || "Failed to save role",
            );
        }
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
                        router.reload();
                    } catch (error) {
                        showStatusModal(
                            "error",
                            "Error",
                            "Failed to delete role",
                        );
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    // Permissions Management
    const openPermissionsModal = (role) => {
        setSelectedRole(role);
        setSelectedPermissions(role.permissions.map((p) => p.name));
    };

    const closePermissionsModal = () => {
        setSelectedRole(null);
        setSelectedPermissions([]);
    };

    const togglePermission = (permission) => {
        setSelectedPermissions((prev) =>
            prev.includes(permission)
                ? prev.filter((p) => p !== permission)
                : [...prev, permission],
        );
    };

    const savePermissions = async () => {
        try {
            await axios.post(`/settings/roles/${selectedRole.id}/permissions`, {
                permissions: selectedPermissions,
            });
            showStatusModal("success", "Success", "Permissions updated");
            router.reload();
            closePermissionsModal();
        } catch (error) {
            showStatusModal("error", "Error", "Failed to update permissions");
        }
    };

    const permissionGroups = {
        users: permissions.filter((p) => p.name.startsWith("users.")),
        areas: permissions.filter((p) => p.name.startsWith("areas.")),
        activities: permissions.filter((p) => p.name.startsWith("activities.")),
        reports: permissions.filter((p) => p.name.startsWith("reports.")),
    };

    return (
        <AppLayout title="Settings">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">
                        Settings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage users, roles, and permissions
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "users"
                                ? "text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <HiOutlineUser className="w-4 h-4 inline mr-2" />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab("roles")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "roles"
                                ? "text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <HiOutlineShieldCheck className="w-4 h-4 inline mr-2" />
                        Roles & Permissions
                    </button>
                </div>

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <h2 className="text-[15px] font-bold text-foreground m-0">
                                System Users
                            </h2>
                            <BtnDefault size="sm" onClick={openAddUser}>
                                <HiOutlineUserAdd className="w-4 h-4" />
                                Add User
                            </BtnDefault>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold text-muted-foreground border-b border-border bg-muted/20">
                                        <th className="p-3 w-12">No</th>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3 w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user, i) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-border/50 hover:bg-muted/30"
                                        >
                                            <td className="p-3 text-xs text-muted-foreground font-mono">
                                                {(users.meta?.from ?? 1) + i}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <span className="font-medium text-foreground">
                                                        {user.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground text-xs">
                                                {user.email}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px]">
                                                    {user.roles[0]?.name ||
                                                        "No role"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditUser(user)
                                                        }
                                                        className="text-primary hover:text-primary/80 p-1"
                                                        title="Edit"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    {user.roles[0]?.name !==
                                                        "SUPER_ADMIN" && (
                                                        <button
                                                            onClick={() =>
                                                                confirmDeleteUser(
                                                                    user,
                                                                )
                                                            }
                                                            className="text-destructive hover:text-destructive/80 p-1"
                                                            title="Delete"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.links?.length > 3 && (
                            <div className="px-4 py-3 border-t border-border bg-muted/30 flex gap-1 flex-wrap">
                                {users.links.map((link, idx) => (
                                    <BtnDefault
                                        key={idx}
                                        size="sm"
                                        outline={!link.active}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        className="min-w-[32px] px-2"
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </BtnDefault>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Roles & Permissions Tab */}
                {activeTab === "roles" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Roles List */}
                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                <h2 className="text-[15px] font-bold text-foreground m-0">
                                    Roles
                                </h2>
                                <BtnDefault size="sm" onClick={openAddRole}>
                                    <HiOutlinePlus className="w-4 h-4" />
                                    Add Role
                                </BtnDefault>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-semibold text-muted-foreground border-b border-border bg-muted/20">
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Permissions</th>
                                            <th className="p-3 w-24">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map((role) => (
                                            <tr
                                                key={role.id}
                                                className="border-b border-border/50 hover:bg-muted/30"
                                            >
                                                <td className="p-3 font-medium text-foreground">
                                                    {role.name}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {role.permissions
                                                            .slice(0, 2)
                                                            .map((perm) => (
                                                                <span
                                                                    key={
                                                                        perm.id
                                                                    }
                                                                    className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px]"
                                                                >
                                                                    {
                                                                        perm.name.split(
                                                                            ".",
                                                                        )[0]
                                                                    }
                                                                </span>
                                                            ))}
                                                        {role.permissions
                                                            .length > 2 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +
                                                                {role
                                                                    .permissions
                                                                    .length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openPermissionsModal(
                                                                    role,
                                                                )
                                                            }
                                                            className="text-primary hover:text-primary/80 p-1"
                                                            title="Manage Permissions"
                                                        >
                                                            <HiOutlineShieldCheck className="w-4 h-4" />
                                                        </button>
                                                        {role.name !==
                                                            "SUPER_ADMIN" && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        openEditRole(
                                                                            role,
                                                                        )
                                                                    }
                                                                    className="text-primary hover:text-primary/80 p-1"
                                                                    title="Edit"
                                                                >
                                                                    <HiOutlinePencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        confirmDeleteRole(
                                                                            role,
                                                                        )
                                                                    }
                                                                    className="text-destructive hover:text-destructive/80 p-1"
                                                                    title="Delete"
                                                                >
                                                                    <HiOutlineTrash className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Permission Groups Summary */}
                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border bg-muted/30">
                                <h2 className="text-[15px] font-bold text-foreground m-0">
                                    Permission Groups
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4">
                                        <div className="text-[11.5px] text-blue-600 mb-1 font-medium">
                                            Users
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {permissionGroups.users.length}
                                        </div>
                                        <div className="text-[10px] text-blue-600/70 mt-1">
                                            permissions
                                        </div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4">
                                        <div className="text-[11.5px] text-green-600 mb-1 font-medium">
                                            Areas
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {permissionGroups.areas.length}
                                        </div>
                                        <div className="text-[10px] text-green-600/70 mt-1">
                                            permissions
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4">
                                        <div className="text-[11.5px] text-purple-600 mb-1 font-medium">
                                            Activities
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">
                                            {permissionGroups.activities.length}
                                        </div>
                                        <div className="text-[10px] text-purple-600/70 mt-1">
                                            permissions
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
                                        <div className="text-[11.5px] text-amber-600 mb-1 font-medium">
                                            Reports
                                        </div>
                                        <div className="text-2xl font-bold text-amber-600">
                                            {permissionGroups.reports.length}
                                        </div>
                                        <div className="text-[10px] text-amber-600/70 mt-1">
                                            permissions
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            <ModalOverlay isOpen={showUserModal} onClose={closeUserModal}>
                <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
                    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {editUser ? "Edit User" : "Add New User"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {editUser
                                    ? `Editing ${editUser.name}`
                                    : "Fill in the details below"}
                            </p>
                        </div>
                        <button
                            onClick={closeUserModal}
                            className="text-muted-foreground hover:text-foreground p-1"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                    <form
                        onSubmit={submitUser}
                        className="p-6 flex flex-col gap-4"
                    >
                        <InputText
                            label="Full Name"
                            placeholder="Enter full name"
                            value={userForm.name}
                            onChange={(e) =>
                                setUserForm({
                                    ...userForm,
                                    name: e.target.value,
                                })
                            }
                            required
                        />
                        <InputText
                            label="Email Address"
                            type="email"
                            placeholder="Enter email address"
                            value={userForm.email}
                            onChange={(e) =>
                                setUserForm({
                                    ...userForm,
                                    email: e.target.value,
                                })
                            }
                            required
                        />
                        <InputDropdown
                            label="Role"
                            placeholder="Select a role"
                            value={userForm.role}
                            setObject={(item) =>
                                setUserForm({ ...userForm, role: item.value })
                            }
                            itemList={roleOptions}
                            required
                        />
                        <InputText
                            label={
                                editUser
                                    ? "New Password (optional)"
                                    : "Password"
                            }
                            type="password"
                            placeholder={
                                editUser
                                    ? "Leave blank to keep current"
                                    : "Enter password"
                            }
                            value={userForm.password}
                            onChange={(e) =>
                                setUserForm({
                                    ...userForm,
                                    password: e.target.value,
                                })
                            }
                        />
                        <div className="flex gap-3 pt-4">
                            <BtnDefault
                                outline
                                onClick={closeUserModal}
                                className="flex-1"
                            >
                                Cancel
                            </BtnDefault>
                            <BtnDefault
                                type="submit"
                                loading={processing}
                                className="flex-[2]"
                            >
                                {editUser ? "Update User" : "Create User"}
                            </BtnDefault>
                        </div>
                    </form>
                </div>
            </ModalOverlay>

            {/* Role Modal */}
            <ModalOverlay isOpen={showRoleModal} onClose={closeRoleModal}>
                <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[400px]">
                    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">
                            {editRole ? "Edit Role" : "Add New Role"}
                        </h2>
                        <button
                            onClick={closeRoleModal}
                            className="text-muted-foreground hover:text-foreground p-1"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                    <form
                        onSubmit={submitRole}
                        className="p-6 flex flex-col gap-4"
                    >
                        <InputText
                            label="Role Name"
                            placeholder="Enter role name"
                            value={roleForm.name}
                            onChange={(e) =>
                                setRoleForm({ name: e.target.value })
                            }
                            required
                        />
                        <div className="flex gap-3">
                            <BtnDefault
                                outline
                                onClick={closeRoleModal}
                                className="flex-1"
                            >
                                Cancel
                            </BtnDefault>
                            <BtnDefault type="submit" className="flex-[2]">
                                Save
                            </BtnDefault>
                        </div>
                    </form>
                </div>
            </ModalOverlay>

            {/* Permissions Modal */}
            <ModalOverlay
                isOpen={selectedRole !== null}
                onClose={closePermissionsModal}
            >
                <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[600px] max-h-[80vh] overflow-hidden">
                    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">
                            Permissions for {selectedRole?.name}
                        </h2>
                        <button
                            onClick={closePermissionsModal}
                            className="text-muted-foreground hover:text-foreground p-1"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {Object.entries(permissionGroups).map(
                            ([group, perms]) => (
                                <div key={group} className="mb-6">
                                    <h3 className="text-[13px] font-semibold text-foreground mb-3 uppercase tracking-wide">
                                        {group}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {perms.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(
                                                        perm.name,
                                                    )}
                                                    onChange={() =>
                                                        togglePermission(
                                                            perm.name,
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <span className="text-[13px] text-foreground">
                                                    {perm.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                    <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
                        <BtnDefault
                            outline
                            onClick={closePermissionsModal}
                            className="flex-1"
                        >
                            Cancel
                        </BtnDefault>
                        <BtnDefault
                            onClick={savePermissions}
                            className="flex-[2]"
                        >
                            Save Permissions
                        </BtnDefault>
                    </div>
                </div>
            </ModalOverlay>
        </AppLayout>
    );
}
