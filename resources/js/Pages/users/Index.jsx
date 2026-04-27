import React, { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import StatusModal from "@/Components/Modal/StatusModal";
import {
    HiOutlineUserAdd,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineX,
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

export default function Index({
    users = { data: [], links: [], meta: {} },
    roles = [],
}) {
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: "success",
        title: "Tes",
        message: "",
    });

    const [form, setForm] = useState({
        name: "",
        email: "",
        role_id: "",
        password: "",
    });

    const roleOptions = roles.map((role) => ({
        label: role.role_name,
        value: role.id,
    }));

    const showStatusModal = (type, title, message) => {
        setStatusModal({
            isOpen: true,
            type,
            title,
            message,
        });
    };

    const closeStatusModal = () => {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ name: "", email: "", role_id: "", password: "" });
        setIsModalOpen(true);
    };

    const openEdit = (user) => {
        setEditTarget(user);
        setForm({
            name: user.name,
            email: user.email,
            role_id: user.role_id?.toString() || "",
            password: "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditTarget(null);
        setForm({ name: "", email: "", role_id: "", password: "" });
    };

    const handleFormChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const submit = async () => {
        setProcessing(true);

        const submitData = {
            name: form.name,
            email: form.email,
            role_id: parseInt(form.role_id),
            password: form.password,
        };

        if (editTarget && !form.password) {
            delete submitData.password;
        }

        try {
            if (editTarget) {
                await axios.put(`/users/${editTarget.id}`, submitData);
                showStatusModal(
                    "success",
                    "Success",
                    `User "${form.name}" has been updated`,
                );
            } else {
                await axios.post("/users", submitData);
                showStatusModal(
                    "success",
                    "Success",
                    `User "${form.name}" has been created`,
                );
            }
            router.reload({ only: ["users"] });
            closeModal();
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0];
                showStatusModal(
                    "error",
                    "Validation Error",
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                showStatusModal(
                    "error",
                    "Error",
                    "Something went wrong. Please try again.",
                );
            }
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = async (user) => {
        if (!window.confirm(`Delete user "${user.name}"?`)) return;
        try {
            await axios.delete(`/users/${user.id}`);
            showStatusModal(
                "success",
                "Success",
                `User "${user.name}" has been deleted`,
            );
            router.reload({ only: ["users"] });
        } catch (error) {
            showStatusModal("error", "Error", "Failed to delete user");
        }
    };

    const isAdmin = (role_id) => {
        const adminRole = roles.find((r) => r.role_name === "Admin");
        return adminRole && role_id === adminRole.id;
    };

    const getRoleName = (roleId) => {
        const role = roles.find((r) => r.id === roleId);
        return role?.role_name || "Unknown";
    };
    console.log(roles);

    return (
        <AppLayout title="Users">
            <div className="flex flex-col gap-8">
                <div className="flex items-end justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
                            Users
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage system users and permissions
                        </p>
                    </div>

                    <BtnDefault
                        onClick={openAdd}
                        size="md"
                        className="gap-2 shadow-sm px-4"
                    >
                        <HiOutlineUserAdd className="w-4 h-4" />
                        Add User
                    </BtnDefault>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
                                    <th className="px-5 py-3 w-12">No</th>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3 w-28 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="py-16 text-center text-muted-foreground text-sm"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user, i) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                                                {(users.meta?.from ?? 1) + i}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <span className="font-medium text-foreground">
                                                        {user.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-muted-foreground text-xs">
                                                {user.email}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-[2px] rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                                                    {getRoleName(user.role_id)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {isAdmin(user.role_id) ? (
                                                    <div className="text-right text-xs text-muted-foreground">
                                                        —
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openEdit(user)
                                                            }
                                                            className="p-2 rounded-md hover:bg-muted transition-colors text-primary"
                                                        >
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                confirmDelete(
                                                                    user,
                                                                )
                                                            }
                                                            className="p-2 rounded-md hover:bg-muted transition-colors text-destructive"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.links?.length > 3 && (
                        <div className="px-5 py-3 border-t border-border bg-muted/30 flex gap-1 flex-wrap">
                            {users.links.map((link, idx) => (
                                <BtnDefault
                                    key={idx}
                                    size="sm"
                                    outline={!link.active}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    className="min-w-[34px] px-2"
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
            </div>
            <ModalOverlay isOpen={isModalOpen} onClose={closeModal}>
                <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
                    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-[-0.5px] m-0">
                                {editTarget ? "Edit User" : "Add New User"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {editTarget
                                    ? `Editing ${editTarget.name}`
                                    : "Fill in the details below"}
                            </p>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                            aria-label="Close"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        <InputText
                            label="Full Name"
                            placeholder="Enter full name"
                            value={form.name}
                            onChange={(e) =>
                                handleFormChange("name", e.target.value)
                            }
                            required
                        />

                        <InputText
                            label="Email Address"
                            type="email"
                            placeholder="Enter email address"
                            value={form.email}
                            onChange={(e) =>
                                handleFormChange("email", e.target.value)
                            }
                            required
                        />

                        <InputDropdown
                            label="Role"
                            placeholder="Select a role"
                            value={form.role_id}
                            setObject={(item) =>
                                handleFormChange("role_id", item.value)
                            }
                            itemList={roleOptions}
                            required
                        />

                        <InputText
                            label={
                                editTarget
                                    ? "New Password (optional)"
                                    : "Password"
                            }
                            type="password"
                            placeholder={
                                editTarget
                                    ? "Leave blank to keep current"
                                    : "Enter password"
                            }
                            value={form.password}
                            onChange={(e) =>
                                handleFormChange("password", e.target.value)
                            }
                        />

                        <div className="flex items-center gap-3 pt-4">
                            <BtnDefault
                                outline
                                onClick={closeModal}
                                className="flex-1"
                            >
                                Cancel
                            </BtnDefault>
                            <BtnDefault
                                onClick={submit}
                                loading={processing}
                                className="flex-[2]"
                            >
                                {processing
                                    ? "Saving..."
                                    : editTarget
                                      ? "Update User"
                                      : "Create User"}
                            </BtnDefault>
                        </div>
                    </div>
                </div>
            </ModalOverlay>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={closeStatusModal}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </AppLayout>
    );
}
