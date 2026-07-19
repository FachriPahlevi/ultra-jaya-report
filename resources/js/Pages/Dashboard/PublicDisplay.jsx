import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentReport, HiOutlineExclamation, HiOutlineLocationMarker } from "react-icons/hi";

const REFRESH_INTERVAL = 60000;

const formatClock = (date) =>
    new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);

const formatRelative = (dateStr) => {
    if (!dateStr) return "-";

    const now = new Date();
    const date = new Date(dateStr);
    const diffMinutes = Math.floor((now - date) / 1000 / 60);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;

    return `${Math.floor(diffMinutes / 1440)}d ago`;
};

const InfoCard = ({ title, value, note, icon }) => (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{title}</p>
                <p className="mt-3 text-[40px] font-black leading-none tracking-[-0.04em] text-[var(--foreground)]">{value}</p>
                <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">{note}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]">{icon}</div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = status === "closed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700";

    return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${styles}`}>{status === "closed" ? "Closed" : "Open"}</span>;
};

const SectionCard = ({ title, subtitle, icon, children }) => (
    <section className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
            <div>
                <h2 className="text-[15px] font-bold text-[var(--foreground)]">{title}</h2>
                <p className="mt-0.5 text-[11.5px] text-[var(--muted-foreground)]">{subtitle}</p>
            </div>
            <div className="text-[var(--muted-foreground)]">{icon}</div>
        </div>
        <div className="p-4">{children}</div>
    </section>
);

export default function PublicDisplay({ stats = { total: 0, open: 0, closed: 0, activeAreas: 0 }, oldestOpenTicket = null, recentReports = [], topAreas = [], topActivities = [], generatedAt }) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const clockTimer = window.setInterval(() => setNow(new Date()), 1000);
        const refreshTimer = window.setInterval(() => window.location.reload(), REFRESH_INTERVAL);

        return () => {
            window.clearInterval(clockTimer);
            window.clearInterval(refreshTimer);
        };
    }, []);

    return (
        <>
            <Head>
                <title>Public Dashboard</title>
            </Head>

            <div className="h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
                <div className="mx-auto grid h-full max-w-[1800px] grid-rows-[auto_auto_1fr_1fr] gap-4 px-5 py-4">
                    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="h-1.5 bg-[var(--primary)]" />
                        <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1.35fr_0.65fr]">
                            <div>
                                <div className="inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-foreground)]">
                                    Public Monitoring Screen
                                </div>
                                <h1 className="mt-3 text-[30px] font-black leading-[1.02] tracking-[-0.05em] xl:text-[40px]">Ringkasan Tiket Operasional untuk Layar Informasi Kantor</h1>
                                <p className="mt-2 max-w-3xl text-[12.5px] leading-5 text-[var(--muted-foreground)]">
                                    Tampilan ini dibuat khusus untuk layar pasif yang tidak bisa diklik, jadi informasinya difokuskan ke tiket terbuka, area paling sering muncul, dan update terakhir yang perlu
                                    diketahui semua orang.
                                </p>
                            </div>

                            <div className="grid gap-2 self-start xl:justify-self-end xl:w-full xl:max-w-[320px]">
                                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Current Time</p>
                                    <p className="mt-1.5 text-[22px] font-black tracking-[-0.04em] xl:text-[24px]">{formatClock(now)}</p>
                                </div>
                                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[11.5px] text-[var(--muted-foreground)]">
                                    <p>Last sync: {generatedAt ? formatClock(new Date(generatedAt)) : "-"}</p>
                                    <p className="mt-1">Auto refresh every 60 seconds</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <InfoCard title="Total Tickets" value={stats.total} note="All ticket records" icon={<HiOutlineDocumentReport className="h-5 w-5" />} />
                        <InfoCard title="Open Tickets" value={stats.open} note="Need follow-up" icon={<HiOutlineClock className="h-5 w-5" />} />
                        <InfoCard title="Closed Tickets" value={stats.closed} note="Already completed" icon={<HiOutlineCheckCircle className="h-5 w-5" />} />
                        <InfoCard title="Active Areas" value={stats.activeAreas} note="Areas with ticket activity" icon={<HiOutlineLocationMarker className="h-5 w-5" />} />
                    </div>

                    <div className="grid min-h-0 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                        <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#ffffff_100%)] shadow-sm">
                            <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Priority Attention</p>
                                    <h2 className="mt-1 text-[18px] font-black tracking-[-0.03em] xl:text-[22px]">Oldest Open Ticket</h2>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                    <HiOutlineExclamation className="h-6 w-6" />
                                </div>
                            </div>

                            <div className="p-4">
                                {!oldestOpenTicket ? (
                                    <div className="rounded-[22px] border border-green-100 bg-green-50 px-6 py-8 text-center">
                                        <p className="text-[20px] font-black tracking-[-0.03em] text-green-700">No Open Ticket</p>
                                        <p className="mt-2 text-[12px] text-green-600">Semua tiket saat ini sudah ditindaklanjuti.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <StatusBadge status="open" />
                                            <p className="text-[12px] font-semibold text-amber-700">{formatRelative(oldestOpenTicket.created_at)}</p>
                                        </div>

                                        <div className="rounded-[24px] border border-amber-100 bg-white px-4 py-4">
                                            <p className="text-[22px] font-black leading-[1.08] tracking-[-0.04em] xl:text-[30px]">{oldestOpenTicket.issue}</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-[20px] border border-[var(--border)] bg-white px-3 py-3">
                                                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Ticket ID</p>
                                                <p className="mt-1.5 text-[15px] font-bold">#{oldestOpenTicket.id}</p>
                                            </div>
                                            <div className="rounded-[20px] border border-[var(--border)] bg-white px-3 py-3">
                                                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Area</p>
                                                <p className="mt-1.5 text-[15px] font-bold">{oldestOpenTicket.area}</p>
                                            </div>
                                            <div className="rounded-[20px] border border-[var(--border)] bg-white px-3 py-3">
                                                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Activity</p>
                                                <p className="mt-1.5 text-[15px] font-bold">{oldestOpenTicket.activity}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-[20px] bg-amber-50 px-4 py-2.5 text-[12px] text-amber-800">Opened on {formatClock(new Date(oldestOpenTicket.created_at))}</div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <SectionCard title="Recent Ticket Updates" subtitle="Latest updates shown on the public screen" icon={<HiOutlineClock className="h-5 w-5" />}>
                            <div className="space-y-2">
                                {recentReports.length === 0 ? (
                                    <div className="py-10 text-center text-[13px] text-[var(--muted-foreground)]">No reports yet</div>
                                ) : (
                                    recentReports.map((report, index) => (
                                        <div key={report.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-3 py-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-foreground)]">{index + 1}</div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12.5px] font-semibold">{report.issue ?? "-"}</p>
                                                <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                                                    {report.area} · {report.activity}
                                                </p>
                                                <p className="mt-0.5 text-[10.5px] text-[var(--muted-foreground)]">{formatRelative(report.created_at)}</p>
                                            </div>
                                            <StatusBadge status={report.status} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    <div className="grid min-h-0 gap-4 xl:grid-cols-2">
                        <SectionCard title="Most Reported Areas" subtitle="Area ranking by total ticket volume" icon={<HiOutlineChartBar className="h-5 w-5" />}>
                            <div className="space-y-2">
                                {topAreas.length === 0 ? (
                                    <div className="py-10 text-center text-[13px] text-[var(--muted-foreground)]">No area data yet</div>
                                ) : (
                                    topAreas.map((area, index) => (
                                        <div key={area.name} className="rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12.5px] font-semibold">
                                                        {index + 1}. {area.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                                                        {area.open} open · {area.closed} closed
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[24px] font-black leading-none tracking-[-0.04em]">{area.total}</p>
                                                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">tickets</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Most Reported Activities" subtitle="Activity groups with the highest number of tickets" icon={<HiOutlineDocumentReport className="h-5 w-5" />}>
                            <div className="space-y-3">
                                {topActivities.length === 0 ? (
                                    <div className="py-10 text-center text-[13px] text-[var(--muted-foreground)]">No activity data yet</div>
                                ) : (
                                    topActivities.map((activity, index) => {
                                        const width = stats.total > 0 ? Math.max(12, Math.round((activity.total / stats.total) * 100)) : 12;

                                        return (
                                            <div key={activity.name} className="rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="truncate text-[12.5px] font-semibold">
                                                        {index + 1}. {activity.name}
                                                    </p>
                                                    <p className="text-[13px] font-bold">{activity.total}</p>
                                                </div>
                                                <div className="mt-2 h-2 rounded-full bg-[var(--border)]">
                                                    <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${width}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </>
    );
}
