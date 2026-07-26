import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function PermissionsForm({ isOpen, onClose, role, permissions, auth }) {
    const { setStatusModalProps } = useStatusModal();
    const [processing, setProcessing] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Check if current user is superadmin
    const isSuperadmin = auth?.user?.roles?.[0] === "SUPER_ADMIN";
    const isFormDisabled = !isSuperadmin;

    useEffect(() => {
        if (role && isOpen) {
            setSelectedPermissions(role.permissions?.map((p) => p.name) || []);
        }
    }, [role, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedPermissions([]);
        }
    }, [isOpen]);

    const permissionGroups = {
        menu: permissions.filter((p) => p.name.startsWith("menu.")),
        users: permissions.filter((p) => p.name.startsWith("users.")),
        areas: permissions.filter((p) => p.name.startsWith("areas.")),
        activities: permissions.filter((p) => p.name.startsWith("activities.")),
        reports: permissions.filter((p) => p.name.startsWith("reports.")),
        settings: permissions.filter((p) => p.name.startsWith("settings.")),
        roles: permissions.filter((p) => p.name.startsWith("roles.")),
    };

    const groupLabels = {
        menu: "Menu Navigation",
        users: "User Management",
        areas: "Area Management",
        activities: "Activity Management",
        reports: "Report Management",
        settings: "Settings",
        roles: "Role & Permission",
    };

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const togglePermission = (permission) => {
        if (isFormDisabled) return;
        setSelectedPermissions((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]));
    };

    const toggleGroup = (groupName) => {
        if (isFormDisabled) return;
        const groupPermissions = permissionGroups[groupName].map((p) => p.name);
        const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));

        if (allSelected) {
            setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
        } else {
            const newPermissions = [...selectedPermissions];
            groupPermissions.forEach((p) => {
                if (!newPermissions.includes(p)) {
                    newPermissions.push(p);
                }
            });
            setSelectedPermissions(newPermissions);
        }
    };

    const toggleAll = () => {
        if (isFormDisabled) return;
        const allPermissions = Object.values(permissionGroups)
            .flat()
            .map((p) => p.name);
        const allSelected = allPermissions.every((p) => selectedPermissions.includes(p));

        if (allSelected) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allPermissions);
        }
    };

    const isGroupFullySelected = (groupName) => {
        const groupPermissions = permissionGroups[groupName].map((p) => p.name);
        return groupPermissions.length > 0 && groupPermissions.every((p) => selectedPermissions.includes(p));
    };

    const isGroupPartiallySelected = (groupName) => {
        const groupPermissions = permissionGroups[groupName].map((p) => p.name);
        const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length;
        return selectedCount > 0 && selectedCount < groupPermissions.length;
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            await axios.post(`/settings/roles/${role.id}/permissions`, {
                permissions: selectedPermissions,
            });
            showStatusModal("success", "Success", "Permissions updated");
            router.reload();
            onClose();
        } catch (error) {
            console.error("Error:", error);
            showStatusModal("error", "Error", error.response?.data?.message || "Failed to update permissions");
        } finally {
            setProcessing(false);
        }
    };

    if (!role) return null;

    const groupsToShow = Object.entries(permissionGroups).filter(([_, perms]) => perms.length > 0);

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="mx-4 flex max-h-[90vh] w-full max-w-[760px] flex-col rounded-[28px] border border-border bg-card shadow-xl sm:mx-auto">
                <div className="sticky top-0 flex items-center justify-between shrink-0 rounded-t-[28px] border-b border-border bg-card px-4 py-5 sm:px-6">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Manage Permissions</p>
                        <h2 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-foreground">Permissions for {role.name}</h2>
                    </div>
                    <button onClick={onClose} className="shrink-0 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                    {isFormDisabled && (
                        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-medium text-amber-800 sm:text-sm">Admin tidak bisa mengubah permission. Hanya Superadmin yang dapat mengubah permission.</p>
                        </div>
                    )}
                    <div className="mb-6 border-b border-border pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <BtnDefault onClick={toggleAll} disabled={isFormDisabled} size="sm" className="w-full rounded-xl sm:w-auto">
                                {selectedPermissions.length === Object.values(permissionGroups).flat().length ? "Deselect All" : "Select All"}
                            </BtnDefault>
                            <span className="text-xs text-muted-foreground text-center sm:text-left">
                                {selectedPermissions.length} of {Object.values(permissionGroups).flat().length} permissions selected
                            </span>
                        </div>
                    </div>

                    {groupsToShow.map(([group, perms]) => {
                        const isFullySelected = isGroupFullySelected(group);
                        const isPartiallySelected = isGroupPartiallySelected(group);

                        return (
                            <div key={group} className="mb-6 rounded-2xl border border-border bg-background p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <button
                                        onClick={() => toggleGroup(group)}
                                        disabled={isFormDisabled}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                            isFullySelected ? "bg-primary border-primary text-white" : isPartiallySelected ? "bg-primary/20 border-primary" : "border-border hover:border-primary"
                                        } ${isFormDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {isFullySelected && (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {isPartiallySelected && (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
                                            </svg>
                                        )}
                                    </button>
                                    <h3 className="text-[13px] sm:text-[14px] font-bold text-foreground uppercase tracking-wide">{groupLabels[group] || group}</h3>
                                    <span className="text-xs text-muted-foreground">({perms.length} permissions)</span>
                                </div>

                                <div className="ml-0 grid grid-cols-1 gap-2 sm:ml-7 sm:grid-cols-2 sm:gap-3">
                                    {perms.map((perm) => (
                                        <label
                                            key={perm.id}
                                            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40 ${isFormDisabled ? "opacity-50" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(perm.name)}
                                                onChange={() => togglePermission(perm.name)}
                                                disabled={isFormDisabled}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0 disabled:cursor-not-allowed"
                                            />
                                            <span className="text-[12px] sm:text-[13px] text-foreground group-hover:text-primary transition-colors break-words">{perm.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t border-border bg-card px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <BtnDefault variant="outline" onClick={onClose} className="order-2 w-full rounded-xl sm:order-1 sm:w-auto sm:min-w-[116px]">
                        Cancel
                    </BtnDefault>
                    <BtnDefault
                        onClick={handleSave}
                        loading={processing}
                        disabled={isFormDisabled}
                        className="order-1 w-full rounded-xl sm:order-2 sm:w-auto sm:min-w-[172px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Permissions
                    </BtnDefault>
                </div>
            </div>
        </ModalOverlay>
    );
}