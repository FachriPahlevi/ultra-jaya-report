import { usePage, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import {
    HiOutlineDocumentReport,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineChartBar,
    HiOutlineUser,
    HiOutlineExternalLink,
    HiArrowUp,
    HiOutlinePlusCircle,
    HiArrowRight,
} from "react-icons/hi";

const statusConfig = {
    solved: { label: "Solved", color: "#16a34a", bg: "#f0fdf4" },
    pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
    in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
    submitted: { label: "Submitted", color: "#6366f1", bg: "#eef2ff" },
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000 / 60);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || {
        label: status || "Open",
        color: "#6b7280",
        bg: "#f9fafb",
    };
    return (
        <span
            className="inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.color }}
        >
            {cfg.label}
        </span>
    );
};

const SparkLine = ({ color = "var(--primary)" }) => (
    <svg viewBox="0 0 80 32" width="80" height="32" fill="none">
        <polyline
            points="0,28 13,22 26,24 39,14 52,16 65,8 80,4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="80" cy="4" r="3" fill={color} />
    </svg>
);

const GaugeChart = ({ pct }) => {
    const angle = Math.min((pct / 100) * 180, 180);
    const toXY = (deg) => {
        const rad = ((deg - 180) * Math.PI) / 180;
        return { x: 64 + 48 * Math.cos(rad), y: 64 + 48 * Math.sin(rad) };
    };
    const s = toXY(0);
    const e = toXY(angle);
    const large = angle > 180 ? 1 : 0;
    const arc = `M ${s.x} ${s.y} A 48 48 0 ${large} 1 ${e.x} ${e.y}`;
    const bg = `M ${toXY(0).x} ${toXY(0).y} A 48 48 0 1 1 ${toXY(180).x} ${toXY(180).y}`;

    return (
        <svg viewBox="0 0 128 76" width="160" height="95">
            <path
                d={bg}
                fill="none"
                stroke="var(--border)"
                strokeWidth="12"
                strokeLinecap="round"
            />
            <path
                d={arc}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="12"
                strokeLinecap="round"
            />
            <text
                x="64"
                y="70"
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="var(--foreground)"
                fontFamily="Plus Jakarta Sans, sans-serif"
            >
                {pct}%
            </text>
        </svg>
    );
};

export default function Dashboard({
    stats = { total: 0, pending: 0, solved: 0, myReports: 0 },
    recentReports = [],
    topArea = null,
}) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const permissions = currentUser?.permissions || [];

    const can = (permission) => permissions.includes(permission);

    const canViewAreas = can("areas.view");
    const canViewActivities = can("activities.view");
    const canViewUsers = can("users.view");
    const canCreateReports = can("reports.create");

    const solvedPct =
        stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
    const firstName = currentUser?.name?.split(" ")[0] || "User";

    return (
        <AppLayout title="Dashboard">
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[22px] font-bold text-[var(--foreground)] tracking-[-0.5px]">
                            Dashboard
                        </h1>
                        <p className="text-[13.5px] text-[var(--muted-foreground)] mt-0.5">
                            Welcome back, {firstName} 👋
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-[13px] text-[var(--muted-foreground)] font-medium">
                        <HiOutlineClock className="w-4 h-4" />
                        {new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
                                    Total Reports
                                </p>
                                <p className="text-[38px] font-bold text-[var(--foreground)] tracking-[-1.5px] leading-none mt-1">
                                    {stats.total}
                                </p>
                                <p className="text-[12px] text-[var(--muted-foreground)] mt-1.5">
                                    All issues submitted across areas
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                <HiOutlineDocumentReport className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-end justify-between"></div>
                        <Link
                            href="/reports"
                            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] mt-3 hover:gap-2 transition-all"
                        >
                            View all reports{" "}
                            <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
                                    Pending Issues
                                </p>
                                <p className="text-[38px] font-bold text-[var(--foreground)] tracking-[-1.5px] leading-none mt-1">
                                    {stats.pending}
                                </p>
                                <p className="text-[12px] text-[var(--muted-foreground)] mt-1.5">
                                    Issues awaiting action
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                <HiOutlineClock className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                        <Link
                            href="/reports?status=pending"
                            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] mt-3 hover:gap-2 transition-all"
                        >
                            View pending issues{" "}
                            <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
                                    Solved Rate
                                </p>
                                <p className="text-[12px] text-[var(--muted-foreground)] mt-1">
                                    Issues resolved successfully
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="flex justify-center -mt-1">
                            <GaugeChart pct={solvedPct} />
                        </div>
                        <div className="flex items-center justify-between -mt-1">
                            <Link
                                href="/reports?status=solved"
                                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] hover:gap-2 transition-all"
                            >
                                View solved{" "}
                                <HiOutlineExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="text-[14.5px] font-bold text-[var(--foreground)]">
                                    Recent Issues
                                </h3>
                                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
                                    Latest reports from all areas
                                </p>
                            </div>
                            <Link
                                href="/reports"
                                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--primary)] hover:gap-2 transition-all"
                            >
                                View all reports{" "}
                                <HiArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-[var(--border)]">
                            {recentReports.length === 0 ? (
                                <div className="text-center py-12 text-[var(--muted-foreground)] text-[13px]">
                                    No reports yet
                                </div>
                            ) : (
                                recentReports.slice(0, 5).map((report, i) => (
                                    <div
                                        key={report.id ?? i}
                                        className="px-6 py-4 hover:bg-[var(--muted)]/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-[var(--primary)] shrink-0">
                                                {report.submitted_by
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                                                        <span className="text-[13px] font-semibold text-[var(--foreground)] truncate">
                                                            {report.issue ??
                                                                "-"}
                                                        </span>
                                                        <span className="text-[11px] text-[var(--muted-foreground)] truncate">
                                                            by{" "}
                                                            {report.submitted_by ??
                                                                "-"}
                                                        </span>
                                                    </div>
                                                    <StatusBadge
                                                        status={report.status}
                                                    />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[var(--muted-foreground)]">
                                                    <span className="truncate">
                                                        {report.area ?? "-"}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="whitespace-nowrap">
                                                        {formatDate(
                                                            report.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--muted)]/30">
                            <Link
                                href="/reports"
                                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] hover:gap-2 transition-all"
                            >
                                View all reports{" "}
                                <HiOutlineExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border)]">
                            <h3 className="text-[14.5px] font-bold text-[var(--foreground)]">
                                Overview
                            </h3>
                            <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
                                Reports statistics summary
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "Total",
                                        value: stats.total,
                                        sub: "Issues reported",
                                        icon: HiOutlineDocumentReport,
                                        color: "blue",
                                    },
                                    {
                                        label: "Solved",
                                        value: stats.solved,
                                        sub: "Resolved so far",
                                        icon: HiOutlineCheckCircle,
                                        color: "green",
                                    },
                                    {
                                        label: "Pending",
                                        value: stats.pending,
                                        sub: "Awaiting action",
                                        icon: HiOutlineClock,
                                        color: "amber",
                                    },
                                    {
                                        label: "My Reports",
                                        value: stats.myReports,
                                        sub: "Submitted by me",
                                        icon: HiOutlineUser,
                                        color: "purple",
                                    },
                                ].map(
                                    ({
                                        label,
                                        value,
                                        sub,
                                        icon: Icon,
                                        color,
                                    }) => {
                                        const configs = {
                                            blue: {
                                                bg: "bg-blue-50",
                                                text: "text-blue-600",
                                                sub: "text-blue-400",
                                            },
                                            green: {
                                                bg: "bg-green-50",
                                                text: "text-green-600",
                                                sub: "text-green-400",
                                            },
                                            amber: {
                                                bg: "bg-amber-50",
                                                text: "text-amber-600",
                                                sub: "text-amber-400",
                                            },
                                            purple: {
                                                bg: "bg-purple-50",
                                                text: "text-purple-600",
                                                sub: "text-purple-400",
                                            },
                                        };
                                        const c = configs[color];
                                        return (
                                            <div
                                                key={label}
                                                className={`${c.bg} rounded-xl p-4`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p
                                                        className={`text-[11.5px] font-medium ${c.text}`}
                                                    >
                                                        {label}
                                                    </p>
                                                    <Icon
                                                        className={`w-4 h-4 ${c.text} opacity-60`}
                                                    />
                                                </div>
                                                <p
                                                    className={`text-[28px] font-bold tracking-[-1px] ${c.text}`}
                                                >
                                                    {value}
                                                </p>
                                                <p
                                                    className={`text-[11px] mt-0.5 ${c.sub}`}
                                                >
                                                    {sub}
                                                </p>
                                            </div>
                                        );
                                    },
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-0 mt-6 pt-5 border-t border-[var(--border)]">
                                <div className="text-center">
                                    <p className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                        Solve rate
                                    </p>
                                    <p className="text-[17px] font-bold text-[var(--primary)]">
                                        {solvedPct}%
                                    </p>
                                    <p className="text-[10.5px] text-[var(--muted-foreground)]">
                                        overall
                                    </p>
                                </div>
                                <div className="text-center border-x border-[var(--border)]">
                                    <p className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                        Top area
                                    </p>
                                    <p className="text-[14px] font-bold text-[var(--primary)] truncate px-2">
                                        {topArea || "N/A"}
                                    </p>
                                    <p className="text-[10.5px] text-[var(--muted-foreground)]">
                                        most reports
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                        Status
                                    </p>
                                    <p
                                        className={`text-[14px] font-bold ${solvedPct > 70 ? "text-green-600" : solvedPct > 40 ? "text-amber-600" : "text-red-600"}`}
                                    >
                                        {solvedPct > 70
                                            ? "On Track"
                                            : solvedPct > 40
                                              ? "Average"
                                              : "At Risk"}
                                    </p>
                                    <p className="text-[10.5px] text-[var(--muted-foreground)]">
                                        performance
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
