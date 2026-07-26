import BtnDefault from "@/Components/Button/BtnDefault";
import InputSelect from "@/Components/Input/InputSelect";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck } from "react-icons/hi";
import { FileText } from "lucide-react";

function RoleActionButton({ children, tone = "subtle", className = "", ...props }) {
    const tones = {
        subtle: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        danger: "border-transparent bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700",
    };

    return (
        <button {...props} className={`inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[12px] font-medium transition-colors ${tones[tone]} ${className}`}>
            {children}
        </button>
    );
}

const getVisibleRoles = (roles, isSuperadmin) => roles.filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN");

function PermissionPreview({ permissions = [] }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {permissions.slice(0, 3).map((permission) => (
                <span key={permission.id} className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                    {permission.name.split(".")[0]}
                </span>
            ))}
            {permissions.length > 3 && <span className="text-[11px] text-muted-foreground">+{permissions.length - 3}</span>}
        </div>
    );
}

function TableHeader({ totalRoles, onAdd }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-muted-foreground">
                    <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-[15px] font-bold text-foreground">Roles</h2>
            </div>
            <div className="flex items-center gap-3">
                <span className="hidden text-[12px] font-medium text-muted-foreground sm:inline">{totalRoles} records</span>
                <BtnDefault onClick={onAdd} size="md" className="h-10 gap-2 rounded-2xl px-4 shadow-none">
                    <HiOutlinePlus className="h-4 w-4" />
                    Add Role
                </BtnDefault>
            </div>
        </div>
    );
}

function DesktopTable({ roles, onEdit, onDelete, onManagePermissions }) {
    return (
        <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border text-left">
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Role</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Permissions</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {roles.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="py-16 text-center text-[13px] text-muted-foreground">
                                No roles found
                            </td>
                        </tr>
                    ) : (
                        roles.map((role) => (
                            <tr key={role.id} className="transition-colors hover:bg-muted/10">
                                <td className="px-6 py-5">
                                    <div>
                                        <p className="text-[14px] font-semibold text-foreground">{role.name}</p>
                                        <p className="mt-1 text-[12px] text-muted-foreground">{role.permissions.length} permissions assigned</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <PermissionPreview permissions={role.permissions} />
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <RoleActionButton onClick={() => onManagePermissions(role)} title="Manage Permissions">
                                            <HiOutlineShieldCheck className="mr-1.5 h-4 w-4" />
                                            Permissions
                                        </RoleActionButton>
                                        {role.name !== "SUPER_ADMIN" && (
                                            <>
                                                <RoleActionButton onClick={() => onEdit(role)} title="Edit Role">
                                                    <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                                                    Edit
                                                </RoleActionButton>
                                                <RoleActionButton onClick={() => onDelete(role)} tone="danger" title="Delete Role">
                                                    <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                                                    Delete
                                                </RoleActionButton>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function MobileList({ roles, onEdit, onDelete, onManagePermissions }) {
    return (
        <div className="flex flex-col gap-3 p-4 sm:hidden">
            {roles.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">No roles found</div>
            ) : (
                roles.map((role) => (
                    <div key={role.id} className="rounded-[22px] border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-[15px] font-semibold text-foreground">{role.name}</h3>
                                <p className="mt-1 text-[12px] text-muted-foreground">{role.permissions.length} permissions assigned</p>
                            </div>
                        </div>

                        <div className="mt-3">
                            <PermissionPreview permissions={role.permissions} />
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-1.5 border-t border-border pt-4">
                            <RoleActionButton onClick={() => onManagePermissions(role)} title="Manage Permissions">
                                <HiOutlineShieldCheck className="mr-1.5 h-4 w-4" />
                                Permissions
                            </RoleActionButton>
                            {role.name !== "SUPER_ADMIN" && (
                                <>
                                    <RoleActionButton onClick={() => onEdit(role)} title="Edit Role">
                                        <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                                        Edit
                                    </RoleActionButton>
                                    <RoleActionButton onClick={() => onDelete(role)} tone="danger" title="Delete Role">
                                        <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                                        Delete
                                    </RoleActionButton>
                                </>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function RolesTable({ roles, onAdd, onEdit, onDelete, onManagePermissions, isSuperadmin, displayCount, onDisplayCountChange }) {
    const visibleRoles = getVisibleRoles(roles, isSuperadmin);
    const displayedRoles = displayCount === -1 ? visibleRoles : visibleRoles.slice(0, displayCount);

    return (
        <section className="overflow-hidden rounded-[24px] border border-border bg-card">
            <TableHeader totalRoles={visibleRoles.length} onAdd={onAdd} />
            <div className="border-b border-border px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-muted-foreground">
                        Showing {displayedRoles.length} of {visibleRoles.length} roles
                    </p>
                    <InputSelect
                        id="roles_display_count"
                        value={String(displayCount)}
                        onChange={onDisplayCountChange}
                        options={[
                            { value: "10", label: "10 records" },
                            { value: "25", label: "25 records" },
                            { value: "50", label: "50 records" },
                            { value: "-1", label: "All records" },
                        ]}
                        wrapperClassName="w-full sm:w-[150px]"
                        selectClassName="h-9 rounded-xl text-[12px]"
                    />
                </div>
            </div>
            <DesktopTable roles={displayedRoles} onEdit={onEdit} onDelete={onDelete} onManagePermissions={onManagePermissions} />
            <MobileList roles={displayedRoles} onEdit={onEdit} onDelete={onDelete} onManagePermissions={onManagePermissions} />
        </section>
    );
}
