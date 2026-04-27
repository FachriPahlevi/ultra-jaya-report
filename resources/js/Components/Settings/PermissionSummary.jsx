// resources/js/Components/Settings/PermissionSummary.jsx
export default function PermissionSummary({ groups }) {
    const groupColors = {
        users: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-600" },
        areas: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-600" },
        activities: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-600" },
        reports: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600" },
    };

    const groupLabels = {
        users: "Users",
        areas: "Areas",
        activities: "Activities",
        reports: "Reports",
    };

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-[15px] font-bold text-foreground m-0">Permission Groups</h2>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(groups).map(([key, perms]) => (
                        <div key={key} className={`${groupColors[key]?.bg} rounded-xl p-4`}>
                            <div className={`text-[11.5px] ${groupColors[key]?.text} mb-1 font-medium`}>
                                {groupLabels[key]}
                            </div>
                            <div className={`text-2xl font-bold ${groupColors[key]?.text}`}>{perms.length}</div>
                            <div className={`text-[10px] ${groupColors[key]?.text}/70 mt-1`}>permissions</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}