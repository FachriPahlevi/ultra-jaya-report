import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function PermissionsForm({ isOpen, onClose, role, permissions }) {
  const { setStatusModalProps } = useStatusModal();
  const [processing, setProcessing] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

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
    setSelectedPermissions((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]));
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
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[700px] mx-4 sm:mx-auto max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Permissions for {role.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="mb-6 pb-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button onClick={toggleAll} className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-white w-full sm:w-auto">
                {selectedPermissions.length === Object.values(permissionGroups).flat().length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-xs text-muted-foreground text-center sm:text-left">
                {selectedPermissions.length} of {Object.values(permissionGroups).flat().length} permissions selected
              </span>
            </div>
          </div>

          {groupsToShow.map(([group, perms]) => {
            const isFullySelected = isGroupFullySelected(group);
            const isPartiallySelected = isGroupPartiallySelected(group);

            return (
              <div key={group} className="mb-6 pb-2 border-b border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => toggleGroup(group)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      isFullySelected ? "bg-primary border-primary text-white" : isPartiallySelected ? "bg-primary/20 border-primary" : "border-border hover:border-primary"
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
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-foreground uppercase tracking-wide">
                    {groupLabels[group] || group}
                  </h3>
                  <span className="text-xs text-muted-foreground">({perms.length} permissions)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 ml-0 sm:ml-7">
                  {perms.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer group hover:bg-muted/50 p-1.5 sm:p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.name)}
                        onChange={() => togglePermission(perm.name)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <span className="text-[12px] sm:text-[13px] text-foreground group-hover:text-primary transition-colors break-words">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 shrink-0">
          <BtnDefault outline onClick={onClose} className="w-full sm:flex-1 order-2 sm:order-1">
            Cancel
          </BtnDefault>
          <BtnDefault onClick={handleSave} loading={processing} className="w-full sm:flex-[2] order-1 sm:order-2">
            Save Permissions
          </BtnDefault>
        </div>
      </div>
    </ModalOverlay>
  );
}