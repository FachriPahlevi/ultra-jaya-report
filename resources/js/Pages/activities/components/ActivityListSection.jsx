import { FileText } from "lucide-react";
import { ActivityActions, ActivityMobileSummary, ActivityPagination, ActivityStatusToggle, EmptyState, SubActivityList } from "./ActivityShared";

const ACTIVITY_TABLE_COLUMNS = ["No", "Main Activity", "Description", "Sub Activity List", "Actions"];

function ActivityTableHeader({ totalActivities }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-foreground">Activity Directory</h3>
            </div>
            <span className="text-[12px] font-medium text-muted-foreground">{totalActivities} records</span>
        </div>
    );
}

function ActivityDesktopTableRow({ activity, index, startNumber, canEdit, canDelete, onAddSub, onEdit, onDelete, onToggleStatus }) {
    return (
        <tr className="align-top transition-colors hover:bg-muted/10">
            <td className="w-12 px-6 py-5 text-[13px] font-semibold text-foreground">{startNumber + index}</td>
            <td className="px-6 py-5">
                <div className="min-w-[220px]">
                    <p className="text-[14px] font-semibold text-foreground">{activity.name}</p>
                    <p className="mt-2 text-[12px] text-muted-foreground">{activity.usage_count > 0 ? `Used in ${activity.usage_count} reports` : "Not used in reports"}</p>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="max-w-[360px]">
                    <p className="text-[12.5px] leading-6 text-muted-foreground">{activity.description || "-"}</p>
                </div>
            </td>
            <td className="px-6 py-5">
                <SubActivityList items={activity.children} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
            </td>
            <td className="w-[260px] px-6 py-5">
                <div className="flex flex-wrap items-center gap-1.5">
                    {canEdit && <ActivityStatusToggle activity={activity} onClick={() => onToggleStatus(activity)} />}
                    <ActivityActions activity={activity} canEdit={canEdit} canDelete={canDelete} onAddSub={onAddSub} onEdit={onEdit} onDelete={onDelete} />
                </div>
            </td>
        </tr>
    );
}

function DesktopTable({ activities, totalActivities, canEdit, canDelete, onAddSub, onEdit, onDelete, onToggleStatus }) {
    const startNumber = activities.meta?.from ?? 1;

    return (
        <div className="hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-sm sm:block">
            <ActivityTableHeader totalActivities={totalActivities} />

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            {ACTIVITY_TABLE_COLUMNS.map((column) => (
                                <th key={column} className="whitespace-nowrap px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {activities.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-16 text-center text-[13px] text-muted-foreground">
                                    No activities found
                                </td>
                            </tr>
                        ) : (
                            activities.data.map((activity, index) => (
                                <ActivityDesktopTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={index}
                                    startNumber={startNumber}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onAddSub={onAddSub}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onToggleStatus={onToggleStatus}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ActivityPagination links={activities.links} />
        </div>
    );
}

function ActivityMobileCard({ activity, index, startNumber, canEdit, canDelete, onAddSub, onEdit, onDelete, onToggleStatus }) {
    return (
        <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">#{startNumber + index}</p>
                <div className="rounded-2xl border border-border bg-background/80 p-1">
                    <ActivityActions activity={activity} canEdit={canEdit} canDelete={canDelete} onAddSub={onAddSub} onEdit={onEdit} onDelete={onDelete} mobile />
                </div>
            </div>

            <div className="mt-3">
                <h3 className="text-[16px] font-bold leading-tight text-foreground">{activity.name}</h3>
                <div className="mt-3">
                    <ActivityMobileSummary activity={activity} />
                </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
                {canEdit && (
                    <div className="mb-4">
                        <ActivityStatusToggle activity={activity} onClick={() => onToggleStatus(activity)} className="w-full justify-center" />
                    </div>
                )}

                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity Description</p>
                    <p className="text-[12.5px] leading-6 text-muted-foreground">{activity.description || "-"}</p>
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sub Activity List</p>
                        <span className="text-[11px] text-muted-foreground">{activity.children_count} items</span>
                    </div>
                    <SubActivityList items={activity.children} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} mobile />
                </div>
            </div>
        </div>
    );
}

function MobileList({ activities, canEdit, canDelete, onAddSub, onEdit, onDelete, onToggleStatus }) {
    const startNumber = activities.meta?.from ?? 1;

    return (
        <div className="flex flex-col gap-3 sm:hidden">
            {activities.data.length === 0 ? (
                <EmptyState />
            ) : (
                activities.data.map((activity, index) => (
                    <ActivityMobileCard
                        key={activity.id}
                        activity={activity}
                        index={index}
                        startNumber={startNumber}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onAddSub={onAddSub}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                    />
                ))
            )}

            {activities.links?.length > 3 && (
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <ActivityPagination links={activities.links} />
                </div>
            )}
        </div>
    );
}

export default function ActivityListSection(props) {
    return (
        <>
            <DesktopTable {...props} />
            <MobileList {...props} />
        </>
    );
}
