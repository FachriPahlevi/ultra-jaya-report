import { usePage, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'

const statusColor = (status) => {
    if (!status) return '#6b7280'
    if (status === 'solved') return '#16a34a'
    if (status === 'pending') return '#d97706'
    return '#2563eb'
}

const statusLabel = (status) => {
    if (!status) return 'Open'
    if (status === 'solved') return 'Solved'
    if (status === 'pending') return 'Pending'
    return status
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 180) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const s = polarToCartesian(cx, cy, r, startAngle)
    const e = polarToCartesian(cx, cy, r, endAngle)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

const quickLinks = [
    { href: '/areas', label: 'Master Area' },
    { href: '/activities', label: 'Master Activity' },
    { href: '/users', label: 'Master User' },
    { href: '/issue-report', label: '+ New Issue' },
]

const StatusBadge = ({ status }) => {
    const sc = statusColor(status)
    return (
        <span
            className="inline-block px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
            style={{
                background: `color-mix(in srgb, ${sc} 10%, white)`,
                color: sc,
            }}
        >
            {statusLabel(status)}
        </span>
    )
}

const GaugeChart = ({ solvedPct }) => {
    const gaugeAngle = (solvedPct / 100) * 180
    const gaugePath = describeArc(60, 60, 44, 0, gaugeAngle)
    const gaugeBg = describeArc(60, 60, 44, 0, 180)

    return (
        <svg viewBox="0 0 120 70" width="180" height="105">
            <path d={gaugeBg} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
            <path d={gaugePath} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
            <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--foreground)" fontFamily="Plus Jakarta Sans, sans-serif">
                {solvedPct}%
            </text>
        </svg>
    )
}

export default function Dashboard({
    stats = { total: 0, pending: 0, solved: 0, myReports: 0 },
    recentReports = [],
}) {
    const { auth } = usePage().props
    const currentUser = auth?.user
    const solvedPct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 84

    return (
        <AppLayout title="Dashboard">
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_340px] gap-4">
                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="text-[13px] font-medium text-muted-foreground mb-3">Total Reports</div>
                        <div className="flex items-center gap-2.5 text-[40px] font-bold text-foreground tracking-[-1.5px] leading-none">
                            {stats.total}
                            <span className="text-xl text-primary flex items-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[22px] h-[22px]">
                                    <line x1="7" y1="17" x2="17" y2="7" />
                                    <polyline points="7 7 17 7 17 17" />
                                </svg>
                            </span>
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-2 flex-1">All issues submitted across areas</div>
                        <Link href="/report-lists" className="mt-5 text-[13px] font-medium text-primary no-underline inline-flex items-center gap-1">
                            Reports list →
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="text-[13px] font-medium text-muted-foreground mb-3">Pending Issues</div>
                        <div className="flex items-center gap-2.5 text-[40px] font-bold text-foreground tracking-[-1.5px] leading-none">
                            {stats.pending}%
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-2 flex-1">
                            {stats.pending} out of {stats.total} issues unresolved
                        </div>
                        <Link href="/report-lists" className="mt-5 text-[13px] font-medium text-primary no-underline inline-flex items-center gap-1">
                            All issues →
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center">
                        <div className="text-[13px] font-medium text-muted-foreground mb-3 self-start">Solved Goal</div>
                        <div className="flex flex-col items-center flex-1 justify-center">
                            <GaugeChart solvedPct={solvedPct} />
                        </div>
                        <Link href="/report-lists" className="mt-5 text-[13px] font-medium text-primary no-underline inline-flex items-center gap-1 self-start">
                            All goals →
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-base font-bold text-foreground tracking-[-0.3px]">Recent Issues</div>
                            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Latest</span>
                        </div>

                        <div className="flex flex-col">
                            {recentReports.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-[13px]">No reports yet</div>
                            ) : (
                                recentReports.slice(0, 4).map((report, i) => (
                                    <div key={report.id ?? i} className="flex items-center gap-3 py-[11px] border-b border-border group">
                                        <div className="w-[34px] h-[34px] rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                            {report.submitted_by?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                        <div>
                                            <div className="text-[13.5px] font-semibold text-foreground">{report.submitted_by ?? 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {report.area ?? '-'} · {formatDate(report.created_at)}
                                            </div>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-transparent border-none cursor-pointer p-1 rounded-md text-muted-foreground flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            <button className="bg-transparent border-none cursor-pointer p-1 rounded-md text-muted-foreground flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <StatusBadge status={report.status} />
                                    </div>
                                ))
                            )}
                        </div>

                        <Link href="/report-lists" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline mt-4">
                            All reports →
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-base font-bold text-foreground tracking-[-0.3px]">Overview</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted rounded-xl p-4">
                                <div className="text-[11.5px] text-muted-foreground mb-1.5">Total</div>
                                <div className="text-[26px] font-bold text-foreground tracking-[-1px]">{stats.total}</div>
                                <div className="text-[11.5px] text-muted-foreground mt-0.5">Issues reported</div>
                            </div>
                            <div className="bg-primary/10 rounded-xl p-4">
                                <div className="text-[11.5px] text-primary/70 mb-1.5">Solved</div>
                                <div className="text-[26px] font-bold text-primary tracking-[-1px]">{stats.solved}</div>
                                <div className="text-[11.5px] text-primary/70 mt-0.5">Resolved so far</div>
                            </div>
                            <div className="bg-[#d97706]/10 rounded-xl p-4">
                                <div className="text-[11.5px] text-[#d97706] mb-1.5">Pending</div>
                                <div className="text-[26px] font-bold text-[#d97706] tracking-[-1px]">{stats.pending}</div>
                                <div className="text-[11.5px] text-[#d97706] mt-0.5">Awaiting action</div>
                            </div>
                            <div className="bg-[#16a34a]/10 rounded-xl p-4">
                                <div className="text-[11.5px] text-[#16a34a] mb-1.5">My Reports</div>
                                <div className="text-[26px] font-bold text-[#16a34a] tracking-[-1px]">{stats.myReports}</div>
                                <div className="text-[11.5px] text-[#16a34a] mt-0.5">Submitted by me</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-0 border-t border-border mt-4 pt-4">
                            <div className="text-center">
                                <div className="text-[11.5px] text-muted-foreground mb-1">Solve rate</div>
                                <div className="text-sm font-bold text-primary">{solvedPct}%</div>
                                <div className="text-[11px] text-muted-foreground">overall</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[11.5px] text-muted-foreground mb-1">Top area</div>
                                <div className="text-[13px] font-bold text-primary">Area A</div>
                                <div className="text-[11px] text-muted-foreground">most reports</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[11.5px] text-muted-foreground mb-1">Status</div>
                                <div className="text-sm font-bold text-[#16a34a]">Good</div>
                                <div className="text-[11px] text-muted-foreground">on track</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="text-base font-bold text-foreground tracking-[-0.3px] mb-4">All Reports</div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="text-left text-[11.5px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
                                        <th className="p-2">No</th>
                                        <th className="p-2">Submitted By</th>
                                        <th className="p-2">Area</th>
                                        <th className="p-2">Type</th>
                                        <th className="p-2">Issue</th>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReports.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-muted-foreground text-[13px]">
                                                No reports found
                                            </td>
                                        </tr>
                                    ) : (
                                        recentReports.map((report, i) => (
                                            <tr key={report.id ?? i} className="border-b border-border">
                                                <td className="p-2.5 text-[13px] text-muted-foreground font-semibold">{i + 1}</td>
                                                <td className="p-2.5 text-[13px] font-semibold text-foreground">{report.submitted_by ?? '-'}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">{report.area ?? '-'}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">
                                                    <span className="inline-block px-2 py-0.5 bg-accent text-primary rounded text-[11.5px] font-semibold">
                                                        {report.type ?? '-'}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-[13px] text-foreground max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {report.issue ?? '-'}
                                                </td>
                                                <td className="p-2.5 text-[13px] text-muted-foreground">{formatDate(report.created_at)}</td>
                                                <td className="p-2.5 text-[13px]">
                                                    <StatusBadge status={report.status} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Link href="/report-lists" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline mt-4">
                            View full report list →
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                        <div className="text-base font-bold text-foreground tracking-[-0.3px] mb-4">Quick Access</div>
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center justify-between px-3.5 py-2.5 bg-muted rounded-lg no-underline text-foreground text-[13px] font-medium mb-2 hover:bg-accent transition-colors"
                            >
                                {link.label}
                                <span className="w-[22px] h-[22px] rounded-full border border-current flex items-center justify-center shrink-0 opacity-60">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </span>
                            </Link>
                        ))}

                        <div className="mt-2 pt-4 border-t border-border">
                            <div className="text-xs text-muted-foreground mb-2.5 font-medium">Logged in as</div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-white">
                                    {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                                <div>
                                    <div className="text-[13px] font-semibold text-foreground">{currentUser?.name ?? 'User'}</div>
                                    <div className="text-[11.5px] text-muted-foreground">{currentUser?.role ?? 'User'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}