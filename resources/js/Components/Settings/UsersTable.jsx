import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputSelect from "@/Components/Input/InputSelect";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { FileText, Plus } from "lucide-react";

const USER_TABLE_COLUMNS = ["No", "User", "Email", "Role", "Actions"];

const getInitials = (name) =>
    name
        ?.split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("") ?? "U";

const getVisibleUsers = (users, auth) => users.data.filter((user) => user.roles[0]?.name !== "SUPER_ADMIN" || user.id === auth.user.id);
const isSupervisor = (user) => user.roles[0]?.name === "SUPERVISOR";

function AreaAssignmentChips({ user }) {
    if (!isSupervisor(user)) {
        return null;
    }

    if (!user.assigned_areas?.length) {
        return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">No area assigned</span>;
    }

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {user.assigned_areas.map((area) => (
                <span key={area.id} className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    {area.area}
                </span>
            ))}
        </div>
    );
}

function UserActionButton({ children, tone = "subtle", className = "", ...props }) {
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

function visitWithActiveTab(url, activeTab) {
    if (!url) {
        return;
    }

    const target = new URL(url, window.location.origin);
    target.searchParams.set("active_tab", activeTab);

    router.visit(`${target.pathname}${target.search}`, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}

function TableHeader({ totalUsers, onAdd }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-[15px] font-bold text-foreground">System Users</h2>
            </div>
            <div className="flex items-center gap-3">
                <BtnDefault onClick={onAdd} size="md" className="h-10 gap-2 rounded-2xl px-4 shadow-none">
                    <Plus className="h-4 w-4" />
                    Add User
                </BtnDefault>
            </div>
        </div>
    );
}

function DesktopTable({ users, auth, onEdit, onDelete }) {
    const visibleUsers = getVisibleUsers(users, auth);
    const startNumber = users.meta?.from ?? 1;

    return (
        <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border text-left">
                        {USER_TABLE_COLUMNS.map((column) => (
                            <th key={column} className="whitespace-nowrap px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {visibleUsers.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="py-16 text-center text-[13px] text-muted-foreground">
                                No users found
                            </td>
                        </tr>
                    ) : (
                        visibleUsers.map((user, index) => (
                            <tr key={user.id} className="transition-colors hover:bg-muted/10">
                                <td className="w-12 px-6 py-5 text-[13px] font-semibold text-foreground">{startNumber + index}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">{getInitials(user.name)}</div>
                                        <div>
                                            <p className="text-[14px] font-semibold text-foreground">{user.name}</p>
                                            <AreaAssignmentChips user={user} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[12.5px] text-muted-foreground">{user.email}</td>
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                                        {user.roles[0]?.name || "No role"}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-1.5">
                                        <UserActionButton onClick={() => onEdit(user)} title="Edit User">
                                            <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                                            Edit
                                        </UserActionButton>
                                        {user.roles[0]?.name !== "SUPER_ADMIN" && (
                                            <UserActionButton onClick={() => onDelete(user)} tone="danger" title="Delete User">
                                                <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                                                Delete
                                            </UserActionButton>
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

function MobileList({ users, auth, onEdit, onDelete }) {
    const visibleUsers = getVisibleUsers(users, auth);
    const startNumber = users.meta?.from ?? 1;

    return (
        <div className="flex flex-col gap-3 p-4 sm:hidden">
            {visibleUsers.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">No users found</div>
            ) : (
                visibleUsers.map((user, index) => (
                    <div key={user.id} className="rounded-[22px] border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">{getInitials(user.name)}</div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">#{startNumber + index}</p>
                                    <h3 className="text-[15px] font-semibold text-foreground">{user.name}</h3>
                                </div>
                            </div>
                            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground">
                                {user.roles[0]?.name || "No role"}
                            </span>
                        </div>

                        <p className="mt-3 text-[12.5px] text-muted-foreground">{user.email}</p>
                        <AreaAssignmentChips user={user} />

                        <div className="mt-4 flex justify-end gap-1.5 border-t border-border pt-4">
                            <UserActionButton onClick={() => onEdit(user)} title="Edit User">
                                <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                                Edit
                            </UserActionButton>
                            {user.roles[0]?.name !== "SUPER_ADMIN" && (
                                <UserActionButton onClick={() => onDelete(user)} tone="danger" title="Delete User">
                                    <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                                    Delete
                                </UserActionButton>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function UsersTable({ users, onEdit, onDelete, onAdd, auth, usersPerPage, onUsersPerPageChange, activeTab = "users" }) {
    const totalUsers = getVisibleUsers(users, auth).length;

    return (
        <section className="overflow-hidden rounded-[24px] border border-border bg-card">
            <TableHeader totalUsers={totalUsers} onAdd={onAdd} />
            <div className="border-b border-border px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-muted-foreground">Showing {users.data.length} records</p>
                    <InputSelect
                        id="users_per_page"
                        value={usersPerPage}
                        onChange={onUsersPerPageChange}
                        options={[
                            { value: "10", label: "10 records" },
                            { value: "25", label: "25 records" },
                            { value: "50", label: "50 records" },
                            { value: "100", label: "100 records" },
                        ]}
                        wrapperClassName="w-full sm:w-[150px]"
                        selectClassName="h-9 rounded-xl text-[12px]"
                    />
                </div>
            </div>
            <DesktopTable users={users} auth={auth} onEdit={onEdit} onDelete={onDelete} />
            <MobileList users={users} auth={auth} onEdit={onEdit} onDelete={onDelete} />
            {users.links?.length > 3 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6">
                    {users.links.map((link, index) => (
                        <BtnDefault
                            key={index}
                            size="sm"
                            variant={link.active ? "primary" : "outline"}
                            disabled={!link.url}
                            onClick={() => visitWithActiveTab(link.url, activeTab)}
                            className="min-w-[36px] rounded-xl px-2.5"
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </BtnDefault>
                    ))}
                </div>
            )}
        </section>
    );
}
