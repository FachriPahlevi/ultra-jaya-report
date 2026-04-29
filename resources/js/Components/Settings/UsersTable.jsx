// resources/js/Components/Settings/UsersTable.jsx
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import { HiOutlinePencil, HiOutlineTrash, HiOutlineUserAdd } from "react-icons/hi";

const getInitials = (name) => {
    return name?.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") ?? "U";
};

const UsersTable = ({ users, onEdit, onDelete, onAdd }) => {
    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-foreground m-0">System Users</h2>
                <BtnDefault size="sm" onClick={onAdd}>
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
                            <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="p-3 text-xs text-muted-foreground font-mono">
                                    {(users.meta?.from ?? 1) + i}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                            {getInitials(user.name)}
                                        </div>
                                        <span className="font-medium text-foreground">{user.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-muted-foreground text-xs">{user.email}</td>
                                <td className="p-3">
                                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px]">
                                        {user.roles[0]?.name || "No role"}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEdit(user)} className="text-primary hover:text-primary/80 p-1" title="Edit">
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        {user.roles[0]?.name !== "SUPER_ADMIN" && (
                                            <button onClick={() => onDelete(user)} className="text-destructive hover:text-destructive/80 p-1" title="Delete">
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
                            onClick={() => link.url && router.visit(link.url)}
                            className="min-w-[32px] px-2"
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </BtnDefault>
                    ))}
                </div>
            )}
        </div>
    );
}