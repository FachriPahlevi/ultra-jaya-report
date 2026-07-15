import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { HiArrowRight, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentReport, HiOutlineExternalLink, HiOutlineUser } from "react-icons/hi";

const statusConfig = {
    closed: "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]",
    open: "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]",
};

const formatRelative = (dateStr) => {
    if (!dateStr) return "-";

    const now = new Date();
    const date = new Date(dateStr);
    const diffMinutes = Math.floor((now - date) / 1000 / 60);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;

    return `${Math.floor(diffMinutes / 1440)}d ago`;
};

const StatCard = ({ title, value, note, href, hrefLabel, icon }) => (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-[12px] font-medium text-[var(--muted-foreground)]">{title}</p>
                <p className="mt-3 text-[34px] font-bold leading-none tracking-tight text-[var(--foreground)]">{value}</p>
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">{note}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]">{icon}</div>
        </div>
        {href && (
            <Link href={href} className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--primary)] hover:gap-2 transition-all">
                {hrefLabel} <HiOutlineExternalLink className="h-3 w-3" />
            </Link>
        )}
    </div>
);

const StatusBadge = ({ status }) => {
    const className = statusConfig[status] || "bg-slate-100 text-slate-600";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${className}`}>
            {status === "closed" ? "Closed" : status === "open" ? "Open" : status}
        </span>
    );
};

const GaugeChart = ({ pct }) => {
    const angle = Math.min((pct / 100) * 180, 180);

    const toXY = (deg) => {
        const rad = ((deg - 180) * Math.PI) / 180;
        return { x: 64 + 48 * Math.cos(rad), y: 64 + 48 * Math.sin(rad) };
    };

    const start = toXY(0);
    const end = toXY(angle);
    const arc = `M ${start.x} ${start.y} A 48 48 0 0 1 ${end.x} ${end.y}`;
    const backgroundArc = `M ${toXY(0).x} ${toXY(0).y} A 48 48 0 1 1 ${toXY(180).x} ${toXY(180).y}`;

    return (
        <svg viewBox="0 0 128 76" width="120" height="72">
            <path d={backgroundArc} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
            <path d={arc} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
            <text x="64" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--foreground)" fontFamily="Plus Jakarta Sans, sans-serif">
                {pct}%
            </text>
        </svg>
    );
};

export default function Dashboard({ stats = { total: 0, open: 0, closed: 0, myReports: 0 }, recentReports = [], topArea = null, oldestOpenTicket = null }) {
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(" ")[0] || "User";
    const completionPct = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

    return (
        <AppLayout title="Dashboard">
            <Head>
                <title>Dashboard</title>
            </Head>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
                        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Welcome back, {firstName}. Here is today&apos;s ticket overview.</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[12px] font-medium text-[var(--muted-foreground)]">
                        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Tickets" value={stats.total} note="All tickets in your dashboard scope" href="/reports" hrefLabel="View all" icon={<HiOutlineDocumentReport className="h-4 w-4" />} />
                    <StatCard title="Open Tickets" value={stats.open} note="Still waiting for follow-up" href="/reports?status=open" hrefLabel="View open" icon={<HiOutlineClock className="h-4 w-4" />} />
                    <StatCard title="Closed Tickets" value={stats.closed} note="Already completed" href="/reports?status=closed" hrefLabel="View closed" icon={<HiOutlineCheckCircle className="h-4 w-4" />} />
                    <StatCard title="My Reports" value={stats.myReports} note="Tickets created by you" href="/reports" hrefLabel="Open reports" icon={<HiOutlineUser className="h-4 w-4" />} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                            <div>
                                <h2 className="text-[15px] font-bold text-[var(--foreground)]">Recent Tickets</h2>
                                <p className="mt-0.5 text-[11.5px] text-[var(--muted-foreground)]">Latest updates from your visible reports</p>
                            </div>
                            <Link href="/reports" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--primary)] hover:gap-2 transition-all">
                                View all <HiArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-[var(--border)]">
                            {recentReports.length === 0 ? (
                                <div className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">No reports yet</div>
                            ) : (
                                recentReports.map((report) => (
                                    <div key={report.id} className="flex items-start gap-3 px-5 py-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-foreground)]">
                                            {report.submitted_by?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">{report.issue ?? "-"}</p>
                                                    <p className="mt-1 text-[11.5px] text-[var(--muted-foreground)]">
                                                        {report.area} · {report.activity} · by {report.submitted_by}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{formatRelative(report.created_at)}</p>
                                                </div>
                                                <StatusBadge status={report.status} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="border-b border-[var(--border)] px-5 py-4">
                            <h2 className="text-[15px] font-bold text-[var(--foreground)]">Ticket Completion</h2>
                            <p className="mt-0.5 text-[11.5px] text-[var(--muted-foreground)]">Quick health check and oldest open ticket in your queue</p>
                        </div>

                        <div className="flex flex-col gap-5 p-5">
                            <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                                <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] py-4">
                                    <GaugeChart pct={completionPct} />
                                </div>

                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                                    <p className="text-[11px] text-[var(--muted-foreground)]">Top Area</p>
                                    <p className="mt-2 text-[20px] font-bold text-[var(--foreground)]">{topArea || "N/A"}</p>
                                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Area with the highest ticket volume in your current scope</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <HiOutlineChartBar className="h-4 w-4 text-[var(--muted-foreground)]" />
                                        <p className="text-[12px] font-semibold text-[var(--foreground)]">Oldest Open Ticket</p>
                                    </div>
                                    <p className="text-[11px] text-[var(--muted-foreground)]">Total {stats.total} tickets</p>
                                </div>

                                {!oldestOpenTicket ? (
                                    <p className="mt-3 text-[12px] text-[var(--muted-foreground)]">No open ticket in your current dashboard scope.</p>
                                ) : (
                                    <div className="mt-3 space-y-2.5">
                                        <p className="text-[14px] font-semibold text-[var(--foreground)]">{oldestOpenTicket.issue}</p>
                                        <p className="text-[11.5px] text-[var(--muted-foreground)]">
                                            {oldestOpenTicket.area} · {oldestOpenTicket.activity}
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                                                <p className="text-[10.5px] text-[var(--muted-foreground)]">Ticket ID</p>
                                                <p className="mt-1 text-[13px] font-bold text-[var(--foreground)]">#{oldestOpenTicket.id}</p>
                                            </div>
                                            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                                                <p className="text-[10.5px] text-[var(--muted-foreground)]">Opened</p>
                                                <p className="mt-1 text-[13px] font-bold text-[var(--foreground)]">{formatRelative(oldestOpenTicket.created_at)}</p>
                                            </div>
                                            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                                                <p className="text-[10.5px] text-[var(--muted-foreground)]">Age</p>
                                                <p className={`mt-1 text-[13px] font-bold ${oldestOpenTicket.age_in_days >= 30 ? "text-red-600" : "text-[var(--foreground)]"}`}>
                                                    {oldestOpenTicket.age_in_days} days
                                                </p>
                                            </div>
                                        </div>
                                        {oldestOpenTicket.age_in_days >= 30 && <p className="text-[11.5px] text-red-600">This ticket has been open for more than 1 month and should be prioritized.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
