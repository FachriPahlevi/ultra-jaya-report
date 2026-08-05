import { Head } from "@inertiajs/react";
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText, HiOutlineTicket, HiOutlineViewGrid } from "react-icons/hi";
import { usePublicDisplayMetrics } from "./hooks/usePublicDisplayMetrics";
import { dashboardColors, formatDate, formatRelative, formatTime, publicDisplayClasses as styles, RING_CIRCUMFERENCE, statusStyles, statStyles } from "./utils/publicDisplay";

const SectionHeader = ({ title, subtitle, noBorder = false }) => (
    <div className={`${styles.sectionHead} ${noBorder ? "border-b-0" : ""}`}>
        <p className={styles.sectionTitle}>{title}</p>
        <p className={styles.sectionSub}>{subtitle}</p>
    </div>
);

const StatCard = ({ label, value, hint, icon, valueClass = "text-[#13151c]" }) => (
    <div className={styles.card}>
        <div className="p-4 px-[18px]">
            <div className="mb-3.5 flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-[#6b7280]">{label}</span>
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#f2f3f8]">
                    {icon}
                </span>
            </div>
            <div className={`mb-1.5 text-[27px] font-bold leading-none ${valueClass}`}>{value}</div>
            <div className="text-[11.5px] text-[#9aa1ae]">{hint}</div>
        </div>
    </div>
);

const RecentTicketRow = ({ report }) => {
    const status = statusStyles[report.status] ?? statusStyles.open;

    return (
        <div className="flex items-start gap-3 border-b border-[#eaecf3] px-[18px] py-[13px] last:border-b-0">
            <div className={`mt-px flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${status.iconBox}`}>
                <HiOutlineTicket className={`h-[15px] w-[15px] ${status.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="mb-1 line-clamp-2 text-[12.5px] font-medium leading-[1.45] text-[#13151c]">{report.issue ?? "-"}</p>
                <div className="truncate text-[11px] text-[#6b7280]">
                    <b className="font-semibold text-[#13151c]">{report.area}</b> · {report.activity}
                </div>
            </div>
            <div className="shrink-0 text-right">
                <span className={`inline-flex items-center rounded-full px-[11px] py-1 text-[10.5px] font-semibold ${status.pill}`}>{status.label}</span>
                <div className="mt-1.5 text-[10.5px] text-[#9aa1ae]">{formatRelative(report.created_at)}</div>
            </div>
        </div>
    );
};

const CompletionRing = ({ percentage }) => {
    const ringOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * percentage) / 100;

    return (
        <svg className="mb-0.5 h-[86px] w-[86px]" viewBox="0 0 86 86">
            <circle cx="43" cy="43" r="36" fill="none" stroke={dashboardColors.line} strokeWidth="9" />
            <circle
                cx="43"
                cy="43"
                r="36"
                fill="none"
                stroke={dashboardColors.blue}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 43 43)"
            />
            <text x="43" y="46" textAnchor="middle" fontSize="15" fontWeight="700" fill={dashboardColors.ink}>
                {percentage}%
            </text>
            <text x="43" y="59" textAnchor="middle" fontSize="7" fontWeight="500" fill={dashboardColors.faint}>
                closed
            </text>
        </svg>
    );
};

const CompletionCard = ({ stats, topArea, completionPct }) => (
    <div className={styles.card}>
        <SectionHeader title="Ticket Completion" subtitle="Quick health check and oldest open ticket in your queue" noBorder />
        <div className="flex gap-3 px-[18px] py-4">
            <div className="flex flex-1 flex-col items-center justify-center bg-white py-1.5">
                <CompletionRing percentage={completionPct} />
                <div className="text-[10.5px] font-medium text-[#9aa1ae]">
                    {stats.closed} dari {stats.total} tiket selesai
                </div>
            </div>
            <div className="flex-[1.3] border-l border-[#eaecf3] pl-3.5">
                <div className="mb-1.5 text-[11px] text-[#6b7280]">Top Area</div>
                <div className="mb-1.5 text-lg font-bold text-[#13151c]">{topArea}</div>
                <div className="text-[11px] leading-normal text-[#9aa1ae]">Area with the highest ticket volume in your current scope</div>
            </div>
        </div>
    </div>
);

const OldestTicketCard = ({ ticket, totalTickets, age }) => (
    <div className={`${styles.card} p-4 px-[18px]`}>
        <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#13151c]">
                <HiOutlineClock className="h-[15px] w-[15px] text-[#e08a2c]" />
                Oldest Open Ticket
            </div>
            <span className="shrink-0 text-[11px] text-[#9aa1ae]">Total {totalTickets} tickets</span>
        </div>

        {ticket ? (
            <>
                <p className="mb-1.5 line-clamp-3 text-[13px] font-semibold leading-normal text-[#13151c]">"{ticket.issue}"</p>
                <div className="mb-3.5 truncate text-[11.5px] text-[#6b7280]">
                    <b className="font-semibold text-[#13151c]">{ticket.area}</b> · {ticket.activity}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                    <InfoBox label="Area" value={ticket.area} />
                    <InfoBox label="Opened" value={formatRelative(ticket.created_at)} />
                    <InfoBox label="Age" value={`${age} days`} />
                </div>
            </>
        ) : (
            <EmptyState label="No open ticket at the moment." />
        )}
    </div>
);

const InfoBox = ({ label, value }) => (
    <div className="rounded-[10px] bg-[#f2f3f8] px-3 py-2.5">
        <div className="mb-1 text-[10px] text-[#9aa1ae]">{label}</div>
        <div className="truncate text-[13px] font-bold text-[#13151c]">{value}</div>
    </div>
);

const BarList = ({ items, variant = "blue", showPercentage = false }) => {
    if (items.length === 0) return <EmptyState label="No data yet" />;

    return items.map((item, index) => (
        <div className="mb-3 last:mb-0" key={`${item.name}-${index}`}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="truncate font-semibold text-[#13151c]">
                    {index + 1}. {item.name}
                </span>
                <span className="shrink-0 text-[#6b7280]">{showPercentage ? `${item.percentage}%` : item.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#f2f3f8]">
                <div className={`h-full rounded-[3px] ${variant === "orange" ? "bg-[#e08a2c]" : "bg-[#4f5bef]"}`} style={{ width: `${item.width}%` }} />
            </div>
        </div>
    ));
};

const RankingCard = ({ title, subtitle, children }) => (
    <div className={`${styles.card} p-4 px-[18px]`}>
        <div className="mb-3">
            <p className={styles.sectionTitle}>{title}</p>
            <p className={styles.sectionSub}>{subtitle}</p>
        </div>
        {children}
    </div>
);

const KpiCard = ({ value, label }) => (
    <div className={styles.card}>
        <div className="p-4 px-[18px]">
            <div className="mb-1 text-[23px] font-bold text-[#4f5bef]">{value}</div>
            <div className="text-[11.5px] text-[#6b7280]">{label}</div>
        </div>
    </div>
);

const EmptyState = ({ label }) => <div className="py-4 text-[11.5px] text-[#9aa1ae]">{label}</div>;

export default function PublicDisplay({ stats = { total: 0, open: 0, closed: 0, activeAreas: 0 }, oldestOpenTicket = null, recentReports = [], topAreas = [], topActivities = [], generatedAt }) {
    const { now, completionPct, oldestTicketAge, topArea, avgTicketsPerArea, areaBars, activityBars } = usePublicDisplayMetrics({
        stats,
        oldestOpenTicket,
        topAreas,
        topActivities,
    });

    const statCards = [
        { key: "total", label: "Total Tickets", value: stats.total, hint: "All recorded tickets", valueClass: statStyles.total, icon: <HiOutlineDocumentText className="h-[15px] w-[15px] text-[#4f5bef]" /> },
        { key: "open", label: "Open Tickets", value: stats.open, hint: "Still waiting for follow-up", valueClass: statStyles.open, icon: <HiOutlineClock className="h-[15px] w-[15px] text-[#e08a2c]" /> },
        {
            key: "closed",
            label: "Closed Tickets",
            value: stats.closed,
            hint: "Already completed",
            valueClass: statStyles.closed,
            icon: <HiOutlineCheckCircle className="h-[15px] w-[15px] text-[#1f9d6b]" />,
        },
        { key: "areas", label: "Active Areas", value: stats.activeAreas, hint: "Areas with ticket activity", valueClass: statStyles.areas, icon: <HiOutlineViewGrid className="h-[15px] w-[15px] text-[#4f5bef]" /> },
    ];

    return (
        <>
            <Head>
                <title>Public Dashboard</title>
            </Head>

            <div className="min-h-screen overflow-hidden bg-[#eef1f8] font-sans text-[13px] text-[#13151c] antialiased max-[860px]:overflow-auto">
                <div className="mx-auto max-w-[1540px] px-10 pb-11 pt-[26px] max-[860px]:px-4 max-[860px]:pb-8 max-[860px]:pt-[22px]">
                    <div className="mb-[22px] flex items-start justify-between gap-6 max-[860px]:flex-col">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ae]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" />
                                · Live Monitoring
                            </div>
                            <h1 className="mb-1.5 text-[23px] font-bold tracking-[-0.02em] text-[#13151c]">Dashboard Monitoring</h1>
                            <p className="m-0 max-w-[680px] text-[12.5px] leading-normal text-[#6b7280]">
                                Pantauan tiket operasional secara real-time untuk membantu tim melihat progres, prioritas tindak lanjut, dan area yang membutuhkan perhatian.
                            </p>
                        </div>

                        <div className="shrink-0 rounded-[10px] border border-[#eaecf3] bg-white px-3.5 py-2 text-right text-[12.5px] font-semibold text-[#13151c] max-[860px]:w-full max-[860px]:text-left">
                            {formatDate(now)}
                            <span className="mt-0.5 block text-[10px] font-medium text-[#9aa1ae]">{formatTime(now)} · WIB</span>
                        </div>
                    </div>

                    <div className="mb-4 grid grid-cols-4 gap-3.5 max-[860px]:grid-cols-2">
                        {statCards.map((stat) => (
                            <StatCard key={stat.key} {...stat} />
                        ))}
                    </div>

                    <div className="mb-4 grid grid-cols-[minmax(0,1.55fr)_minmax(420px,1fr)] items-start gap-5 max-[860px]:grid-cols-1">
                        <div className={styles.card}>
                            <SectionHeader title="Recent Tickets" subtitle="Latest updates from your visible reports" />
                            {recentReports.length === 0 ? (
                                <div className="px-[18px] py-4">
                                    <EmptyState label="No ticket activity yet." />
                                </div>
                            ) : (
                                recentReports.map((report) => <RecentTicketRow key={report.id} report={report} />)
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            <CompletionCard stats={stats} topArea={topArea} completionPct={completionPct} />
                            <OldestTicketCard ticket={oldestOpenTicket} totalTickets={stats.total} age={oldestTicketAge} />
                        </div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,0.62fr)] gap-5 max-[860px]:grid-cols-1">
                        <RankingCard title="Top Areas" subtitle="Highest volume">
                            <BarList items={areaBars} />
                        </RankingCard>

                        <RankingCard title="Top Activities" subtitle="Most reported">
                            <BarList items={activityBars} variant="orange" showPercentage />
                        </RankingCard>

                        <div className="flex flex-col gap-3.5">
                            <KpiCard value={avgTicketsPerArea} label="Avg tickets / area" />
                            <KpiCard value={`${oldestTicketAge}d`} label="Longest open ticket" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
