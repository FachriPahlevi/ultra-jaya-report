import { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import BtnDefault from "@/Components/Button/BtnDefault";
import UserForm from "@/Components/Form/UserForm";
import RoleForm from "@/Components/Form/RoleForm";
import PermissionsForm from "@/Components/Form/PermissionsForm";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck, HiOutlineUserAdd } from "react-icons/hi";
import { Plus } from "lucide-react";

const getInitials = (name) =>
  name
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") ?? "U";

const UsersTable = ({ users, onEdit, onDelete, onAdd }) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
    <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-foreground m-0">System Users</h2>
      <BtnDefault size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add User</span>
      </BtnDefault>
    </div>
    <div className="hidden sm:block overflow-x-auto">
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
            <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="p-3 text-xs text-muted-foreground font-mono">{(users.meta?.from ?? 1) + i}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{getInitials(user.name)}</div>
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
              </td>
              <td className="p-3 text-muted-foreground text-xs">{user.email}</td>
              <td className="p-3">
                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px]">{user.roles[0]?.name || "No role"}</span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(user)} className="text-primary hover:text-primary/80 p-1">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  {user.roles[0]?.name !== "SUPER_ADMIN" && (
                    <button onClick={() => onDelete(user)} className="text-destructive hover:text-destructive/80 p-1">
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
    <div className="block sm:hidden divide-y divide-border">
      {users.data.map((user, i) => (
        <div key={user.id} className="p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {getInitials(user.name)}
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-semibold">
              {user.roles[0]?.name || "No role"}
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <button onClick={() => onEdit(user)} className="text-primary hover:text-primary/80 p-1 text-sm flex items-center gap-1">
              <HiOutlinePencil className="w-4 h-4" />
              Edit
            </button>
            {user.roles[0]?.name !== "SUPER_ADMIN" && (
              <button onClick={() => onDelete(user)} className="text-destructive hover:text-destructive/80 p-1 text-sm flex items-center gap-1">
                <HiOutlineTrash className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    {users.links?.length > 3 && (
      <div className="px-4 py-3 border-t border-border bg-muted/30 flex gap-1 flex-wrap justify-center">
        {users.links.map((link, idx) => (
          <BtnDefault key={idx} size="sm" outline={!link.active} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="min-w-[32px] px-2">
            <span dangerouslySetInnerHTML={{ __html: link.label }} />
          </BtnDefault>
        ))}
      </div>
    )}
  </div>
);

const RolesTable = ({ roles, onAdd, onEdit, onDelete, onManagePermissions }) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
    <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-foreground m-0">Roles</h2>
      <BtnDefault size="sm" onClick={onAdd}>
        <HiOutlinePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Role</span>
      </BtnDefault>
    </div>
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold text-muted-foreground border-b border-border bg-muted/20">
            <th className="p-3">Name</th>
            <th className="p-3">Permissions</th>
            <th className="p-3 w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="p-3 font-medium text-foreground">{role.name}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((perm) => {
                    let label = perm.name.split(".")[0];
                    return (
                      <span key={perm.id} className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px] font-semibold">
                        {label}
                      </span>
                    );
                  })}
                  {role.permissions.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{role.permissions.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onManagePermissions(role)} className="text-primary hover:text-primary/80 p-1">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                  </button>
                  {role.name !== "SUPER_ADMIN" && (
                    <>
                      <button onClick={() => onEdit(role)} className="text-primary hover:text-primary/80 p-1">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(role)} className="text-destructive hover:text-destructive/80 p-1">
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
    <div className="block sm:hidden divide-y divide-border">
      {roles.map((role) => (
        <div key={role.id} className="p-4 hover:bg-muted/30 transition-colors">
          <div className="mb-2">
            <div className="font-semibold text-foreground text-sm">{role.name}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {role.permissions.slice(0, 3).map((perm) => {
                let label = perm.name.split(".")[0];
                return (
                  <span key={perm.id} className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-semibold">
                    {label}
                  </span>
                );
              })}
              {role.permissions.length > 3 && (
                <span className="text-xs text-muted-foreground">+{role.permissions.length - 3}</span>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <button onClick={() => onManagePermissions(role)} className="text-primary hover:text-primary/80 p-1 text-sm flex items-center gap-1">
              <HiOutlineShieldCheck className="w-4 h-4" />
              Permissions
            </button>
            {role.name !== "SUPER_ADMIN" && (
              <>
                <button onClick={() => onEdit(role)} className="text-primary hover:text-primary/80 p-1 text-sm flex items-center gap-1">
                  <HiOutlinePencil className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => onDelete(role)} className="text-destructive hover:text-destructive/80 p-1 text-sm flex items-center gap-1">
                  <HiOutlineTrash className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Settings({ users, roles, permissions }) {
  const { setStatusModalProps } = useStatusModal();
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [roleForPermissions, setRoleForPermissions] = useState(null);

  const showStatusModal = (type, title, message) =>
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    });

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
        onClick: async () => {
          try {
            await axios.delete(`/settings/users/${user.id}`);
            showStatusModal("success", "Success", `User "${user.name}" berhasil dihapus`);
            window.location.reload();
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

  const permissionGroups = {
    menu: permissions.filter((p) => p.name.startsWith("menu.")),
    users: permissions.filter((p) => p.name.startsWith("users.")),
    roles: permissions.filter((p) => p.name.startsWith("roles.")),
    settings: permissions.filter((p) => p.name.startsWith("settings.")),
    areas: permissions.filter((p) => p.name.startsWith("areas.")),
    activities: permissions.filter((p) => p.name.startsWith("activities.")),
    reports: permissions.filter((p) => p.name.startsWith("reports.")),
  };

  const groupLabels = {
    menu: "Menu",
    users: "Users",
    roles: "Roles",
    settings: "Settings",
    areas: "Areas",
    activities: "Activities",
    reports: "Reports",
  };

  return (
    <AppLayout title="Settings">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and permissions</p>
        </div>

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
            setShowPermissionsModal(true);
          }}
        />

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
      </div>

      <UserForm isOpen={showUserModal} onClose={() => setShowUserModal(false)} user={selectedUser} roles={roles} />
      <RoleForm isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} role={selectedRole} />
      <PermissionsForm isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} role={roleForPermissions} permissions={permissions} />
    </AppLayout>
  );
}