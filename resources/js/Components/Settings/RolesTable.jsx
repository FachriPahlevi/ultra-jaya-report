// resources/js/Components/Settings/RolesTable.jsx
import BtnDefault from "@/Components/Button/BtnDefault";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck } from "react-icons/hi";

const RolesTable = ({ roles, onAdd, onEdit, onDelete, onManagePermissions }) => {
    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-foreground m-0">Roles</h2>
                <BtnDefault size="sm" onClick={onAdd}>
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
                            <th className="p-3 w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="p-3 font-medium text-foreground">{role.name}</td>
                                <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {role.permissions.slice(0, 2).map((perm) => (
                                            <span key={perm.id} className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px]">
                                                {perm.name.split(".")[0]}
                                            </span>
                                        ))}
                                        {role.permissions.length > 2 && (
                                            <span className="text-xs text-muted-foreground">+{role.permissions.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onManagePermissions(role)} className="text-primary hover:text-primary/80 p-1" title="Manage Permissions">
                                            <HiOutlineShieldCheck className="w-4 h-4" />
                                        </button>
                                        {role.name !== "SUPER_ADMIN" && (
                                            <>
                                                <button onClick={() => onEdit(role)} className="text-primary hover:text-primary/80 p-1" title="Edit">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onDelete(role)} className="text-destructive hover:text-destructive/80 p-1" title="Delete">
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
    );
}