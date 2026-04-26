import React, { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import { ROLES } from "@/lib/constants.js";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";

export default function Index({ users = { data: [], links: [], meta: {} } }) {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "",
        password: ""
    });

    const roleMap = {
        1: { label: "Admin", variant: "danger", color: "#ef4444", bg: "#fef2f2" },
        2: { label: "Supervisor", variant: "primary", color: "#3b82f6", bg: "#eff6ff" },
        3: { label: "Manager", variant: "warning", color: "#f59e0b", bg: "#fffbeb" }
    };

    const getInitials = (name) => {
        return name?.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") ?? "U";
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ name: "", email: "", role: "", password: "" });
    };

    const openEdit = (user) => {
        setEditTarget(user);
        setForm({
            name: user.name,
            email: user.email,
            role: user.role ?? "",
            password: ""
        });
    };

    const handleFormChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const submit = async () => {
        setProcessing(true);
        try {
            if (editTarget) {
                await axios.put(`/users/${editTarget.id}`, form);
            } else {
                await axios.post("/users", form);
            }
            router.reload({ only: ["users"] });
            openAdd();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = async (user) => {
        if (!window.confirm(`Delete user "${user.name}"?`)) return;
        try {
            await axios.delete(`/users/${user.id}`);
            router.reload({ only: ["users"] });
        } catch (error) {
            console.error(error);
        }
    };

    const applyFilter = () => {
        router.get("/users", { search, role: roleFilter }, { preserveState: true });
    };

    const isAdmin = (role_id) => role_id === 1;

    return (
        <AppLayout title="Users">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Users</h1>
                        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: "0.25rem 0 0 0" }}>
                            Manage system users and permissions
                        </p>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @media (min-width: 1280px) {
                        .users-grid { display: grid !important; grid-template-columns: 1fr 320px !important; gap: 1.25rem !important; }
                    }
                `}} />

                <div className="users-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem", alignItems: "start" }}>
                    <div style={{ display: "contents" }}>
                        <div style={{ display: "block", width: "100%" }}>
                            <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                                    <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <InputText
                                            placeholder="Search by name or email..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ width: "160px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <InputDropdown
                                            placeholder="All roles"
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            options={ROLES.map(r => ({ label: r, value: r }))}
                                        />
                                    </div>

                                    <BtnDefault outline onClick={applyFilter} style={{ height: "38px" }}>
                                        <svg style={{ width: "0.875rem", height: "0.875rem" }} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                        Search
                                    </BtnDefault>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", fontSize: "0.875rem" }}>
                                        <thead>
                                            <tr style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", background: "color-mix(in srgb, var(--muted) 50%, transparent)" }}>
                                                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", width: "3rem" }}>No</th>
                                                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>User</th>
                                                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Email</th>
                                                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Role</th>
                                                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", width: "7rem" }}>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody style={{ borderCollapse: "collapse" }}>
                                            {users.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: "3rem 1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                                        No users found
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.data.map((user, i) => (
                                                    <tr key={user.id} style={{ borderBottom: "1px solid color-mix(in srgb, var(--border) 50%, transparent)", transition: "background 0.1s" }}>
                                                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                                                            {(users.meta?.from ?? 1) + i}
                                                        </td>
                                                        <td style={{ padding: "0.875rem 1.25rem" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                                <div style={{ width: "2rem", height: "2rem", borderRadius: "9999px", background: "var(--accent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0, userSelect: "none" }}>
                                                                    {getInitials(user.name)}
                                                                </div>
                                                                <span style={{ fontWeight: 500, color: "var(--foreground)", lineHeight: 1.25 }}>
                                                                    {user.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "0.875rem 1.25rem", color: "var(--muted-foreground)", fontSize: "0.75rem" }}>
                                                            {user.email}
                                                        </td>
                                                        <td style={{ padding: "0.875rem 1.25rem" }}>
                                                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, backgroundColor: roleMap[user.role_id]?.bg ?? "var(--muted)", color: roleMap[user.role_id]?.color ?? "var(--muted-foreground)" }}>
                                                                {roleMap[user.role_id]?.label ?? "Unknown"}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "0.875rem 1.25rem" }}>
                                                            {isAdmin(user.role_id) ? (
                                                                <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>—</span>
                                                            ) : (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                                    <button
                                                                        onClick={() => openEdit(user)}
                                                                        style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", transition: "color 0.12s" }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <span style={{ color: "var(--border)" }}>·</span>
                                                                    <button
                                                                        onClick={() => confirmDelete(user)}
                                                                        style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--destructive)", background: "none", border: "none", cursor: "pointer", transition: "opacity 0.12s" }}
                                                                    >
                                                                        Delete
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.875rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--muted)", flexWrap: "wrap" }}>
                                        {users.links.map((link, idx) => (
                                            <BtnDefault
                                                key={idx}
                                                size="sm"
                                                outline={!link.active}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </BtnDefault>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "block", width: "100%" }}>
                            <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
                                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                                        {editTarget ? "Edit User" : "Add New User"}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: "0.125rem 0 0 0" }}>
                                        {editTarget ? `Editing ${editTarget.name}` : "Fill in the details below"}
                                    </p>
                                </div>

                                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <InputText
                                            label="Full Name"
                                            placeholder="Enter full name"
                                            value={form.name}
                                            onChange={(e) => handleFormChange("name", e.target.value)}
                                        />

                                        <InputText
                                            label="Email Address"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={form.email}
                                            onChange={(e) => handleFormChange("email", e.target.value)}
                                        />

                                        <InputDropdown
                                            label="Role"
                                            placeholder="Select a role"
                                            value={form.role}
                                            onChange={(e) => handleFormChange("role", e.target.value)}
                                            options={ROLES && ROLES.filter((r) => r !== "Admin")}
                                        />

                                        <InputText
                                            label={editTarget ? "New Password (optional)" : "Password"}
                                            type="password"
                                            placeholder={editTarget ? "Leave blank to keep current" : "Enter password"}
                                            value={form.password}
                                            onChange={(e) => handleFormChange("password", e.target.value)}
                                        />

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.25rem" }}>
                                        <BtnDefault outline onClick={openAdd}>
                                            Cancel
                                        </BtnDefault>
                                        <BtnDefault
                                            fullWidth
                                            onClick={submit}
                                            loading={processing}
                                        >
                                            {processing ? "Saving..." : editTarget ? "Update User" : "Create User"}
                                        </BtnDefault>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
