import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { Layers3 } from "lucide-react";

function ActivityActionButton({ children, tone = "subtle", className = "", ...props }) {
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

export function ActivityPagination({ links = [] }) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6">
            {links.map((link, index) => (
                <BtnDefault
                    key={index}
                    size="sm"
                    variant={link.active ? "primary" : "outline"}
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    className="min-w-[36px] rounded-xl px-2.5"
                >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </BtnDefault>
            ))}
        </div>
    );
}

export function ActivityActions({ activity, canEdit, canDelete, onAddSub, onEdit, onDelete, mobile = false }) {
    const iconButtonClass = mobile ? "h-9 w-9 rounded-xl px-0" : "px-2";
    const canAddSub = canEdit && !activity.parent_id && activity.is_active;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${mobile ? "justify-end" : ""}`}>
            {canAddSub && (
                <ActivityActionButton onClick={() => onAddSub(activity)} title="Add Sub Activity" className={iconButtonClass}>
                    {mobile ? (
                        <HiOutlinePlus className="h-4 w-4" />
                    ) : (
                        <>
                            <HiOutlinePlus className="mr-1.5 h-4 w-4" />
                            Add Sub
                        </>
                    )}
                </ActivityActionButton>
            )}

            {canEdit && (
                <ActivityActionButton onClick={() => onEdit(activity)} title="Edit Activity" className={iconButtonClass}>
                    {mobile ? (
                        <HiOutlinePencil className="h-4 w-4" />
                    ) : (
                        <>
                            <HiOutlinePencil className="mr-1.5 h-4 w-4" />
                            Edit
                        </>
                    )}
                </ActivityActionButton>
            )}

            {canDelete && (
                <ActivityActionButton onClick={() => onDelete(activity)} tone="danger" title="Delete Activity" className={iconButtonClass}>
                    {mobile ? (
                        <HiOutlineTrash className="h-4 w-4" />
                    ) : (
                        <>
                            <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                            Delete
                        </>
                    )}
                </ActivityActionButton>
            )}
        </div>
    );
}

export function ActivityStatusToggle({ activity, onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted/50 ${className}`}
        >
            <span className={`h-2.5 w-2.5 rounded-full ${activity.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
            {activity.is_active ? "Active" : "Inactive"}
        </button>
    );
}

export function SubActivityList({ items = [], canEdit, canDelete, onEdit, onDelete, mobile = false }) {
    if (!items.length) {
        return <p className="text-[12px] text-muted-foreground">No sub activity yet.</p>;
    }

    return (
        <div className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border bg-background">
            {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
                        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{item.description || "-"}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">{item.usage_count > 0 ? `Used in ${item.usage_count} reports` : "Not used in reports"}</p>
                    </div>

                    <ActivityActions activity={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} mobile={mobile} />
                </div>
            ))}
        </div>
    );
}

export function ActivityMobileSummary({ activity }) {
    const subActivityText = activity.children_count > 0 ? `${activity.children_count} sub activities` : "No sub activities";
    const usageText = activity.usage_count > 0 ? `Used in ${activity.usage_count} reports` : "Not used in reports";

    return (
        <p className="text-[12px] leading-5 text-muted-foreground">
            {subActivityText} · {usageText}
        </p>
    );
}

export function EmptyState() {
    return (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                <Layers3 className="h-6 w-6" />
            </div>
            <p className="text-[16px] font-semibold text-foreground">No activities found</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Activity data will appear here after it is created.</p>
        </div>
    );
}
