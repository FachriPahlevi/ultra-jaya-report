// resources/js/Components/Settings/PermissionsForm.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function PermissionsForm({ isOpen, onClose, role, permissions }) {
    const { setStatusModalProps } = useStatusModal();
    const [selectedPermissions, setSelectedPermissions] = useState(
        role?.permissions?.map((p) => p.name) || []
    );

    const permissionGroups = {
        users: permissions.filter((p) => p.name.startsWith("users.")),
        areas: permissions.filter((p) => p.name.startsWith("areas.")),
        activities: permissions.filter((p) => p.name.startsWith("activities.")),
        reports: permissions.filter((p) => p.name.startsWith("reports.")),
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
        setSelectedPermissions((prev) =>
            prev.includes(permission)
                ? prev.filter((p) => p !== permission)
                : [...prev, permission]
        );
    };

    const toggleGroup = (groupName) => {
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
        const allPermissions = Object.values(permissionGroups).flat().map((p) => p.name);
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

    const isAllSelected = () => {
        const allPermissions = Object.values(permissionGroups).flat().map((p) => p.name);
        return allPermissions.length > 0 && allPermissions.every((p) => selectedPermissions.includes(p));
    };

    const isAnySelected = () => {
        return selectedPermissions.length > 0;
    };

    const handleSave = async () => {
        try {
            await axios.post(`/settings/roles/${role.id}/permissions`, {
                permissions: selectedPermissions,
            });
            showStatusModal("success", "Success", "Permissions updated");
            router.reload();
            onClose();
        } catch (error) {
            showStatusModal("error", "Error", "Failed to update permissions");
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[700px] max-h-[85vh] overflow-hidden">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">
                        Permissions for {role?.name}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Select All Button */}
                    <div className="mb-6 pb-4 border-b border-border">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                {selectedPermissions.length} of {Object.values(permissionGroups).flat().length} permissions selected
                            </span>
                            <button
                                onClick={toggleAll}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    isAllSelected()
                                        ? "bg-primary text-white"
                                        : isAnySelected()
                                        ? "bg-primary/10 text-primary border border-primary/30"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                {isAllSelected() ? "Deselect All" : "Select All"}
                            </button>
                        </div>
                    </div>

                    {/* Permission Groups */}
                    {Object.entries(permissionGroups).map(([group, perms]) => {
                        const isFullySelected = isGroupFullySelected(group);
                        const isPartiallySelected = isGroupPartiallySelected(group);
                        
                        return (
                            <div key={group} className="mb-6 pb-2 border-b border-border/50">
                                <div className="flex justify-between items-center gap-3 mb-3">
                                    <div className="flex items-center gap-3 mb-3">
                                         <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wide">
                                        {group}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        ({perms.length} permissions)
                                    </span>
                                    </div>
                                    <div className="">
                                    <button
                                        onClick={() => toggleGroup(group)}
                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                            isFullySelected
                                                ? "bg-primary border-primary text-white"
                                                : isPartiallySelected
                                                ? "bg-primary/20 border-primary"
                                                : "border-border hover:border-primary"
                                        }`}
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
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                                    {perms.map((perm) => (
                                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer group hover:bg-muted/50 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(perm.name)}
                                                onChange={() => togglePermission(perm.name)}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <span className="text-[13px] text-foreground group-hover:text-primary transition-colors">
                                                {perm.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
                    <BtnDefault outline onClick={onClose} className="flex-1">Cancel</BtnDefault>
                    <BtnDefault onClick={handleSave} className="flex-[2]">Save Permissions</BtnDefault>
                </div>
            </div>
        </ModalOverlay>
    );
}