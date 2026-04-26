import { usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { HiOutlineDocumentReport, HiOutlineClock, HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineExternalLink, HiOutlineUser } from 'react-icons/hi';

const statusColor = (status) => {
    if (!status) return '#6b7280';
    if (status === 'solved') return '#16a34a';
    if (status === 'pending') return '#d97706';
    if (status === 'in_progress') return '#2563eb';
    return '#6b7280';
};

const statusLabel = (status) => {
    if (!status) return 'Open';
    if (status === 'solved') return 'Solved';
    if (status === 'pending') return 'Pending';
    if (status === 'in_progress') return 'In Progress';
    return status;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const s = polarToCartesian(cx, cy, r, startAngle);
    const e = polarToCartesian(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

const quickLinks = [
    { href: '/areas', label: 'Master Area', icon: HiOutlineDocumentReport },
    { href: '/activities', label: 'Master Activity', icon: HiOutlineChartBar },
    { href: '/users', label: 'Master User', icon: HiOutlineUser },
    { href: '/reports/issues', label: 'New Issue', icon: HiOutlineDocumentReport, primary: true },
];

const StatusBadge = ({ status }) => {
    const sc = statusColor(status);
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
    );
};

const GaugeChart = ({ solvedPct }) => {
    const gaugeAngle = Math.min((solvedPct / 100) * 180, 180);
    const gaugePath = describeArc(60, 60, 44, 0, gaugeAngle);
    const gaugeBg = describeArc(60, 60, 44, 0, 180);

    return (
        <svg viewBox="0 0 120 70" width="180" height="105">
            <path d={gaugeBg} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
            <path d={gaugePath} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
            <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--foreground)" fontFamily="Plus Jakarta Sans, sans-serif">
                {solvedPct}%
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
    const solvedPct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

    return (
        <AppLayout title="Dashboard">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Total Reports */}
                    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-[13px] font-medium text-muted-foreground">Total Reports</div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <HiOutlineDocumentReport className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-[40px] font-bold text-foreground tracking-[-1.5px] leading-none">
                            {stats.total}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-2">
                            All issues submitted across areas
                        </div>
                        <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline mt-4 hover:gap-2 transition-all">
                            View all reports
                            <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Pending Issues */}
                    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-[13px] font-medium text-muted-foreground">Pending Issues</div>
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                <HiOutlineClock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-[40px] font-bold text-foreground tracking-[-1.5px] leading-none">
                            {stats.pending}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-2">
                            {stats.pending} out of {stats.total} issues unresolved
                        </div>
                        <Link href="/reports?status=pending" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline mt-4 hover:gap-2 transition-all">
                            View pending issues
                            <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Solved Goal / Gauge */}
                    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-[13px] font-medium text-muted-foreground">Solved Rate</div>
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="flex justify-center -mt-2">
                            <GaugeChart solvedPct={solvedPct} />
                        </div>
                        <Link href="/reports?solved=1" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline mt-2 hover:gap-2 transition-all">
                            View solved reports
                            <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Recent Issues & Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Issues */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[15px] font-bold text-foreground m-0">Recent Issues</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Latest reports from all areas</p>
                                </div>
                                <span className="text-xs text-muted-foreground bg-card px-2.5 py-1 rounded-full shadow-sm">Latest</span>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {recentReports.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-[13px]">
                                    No reports yet
                                </div>
                            ) : (
                                recentReports.slice(0, 5).map((report, i) => (
                                    <div key={report.id ?? i} className="px-6 py-4 hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                                {report.submitted_by?.[0]?.toUpperCase() ?? 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="text-[13.5px] font-semibold text-foreground truncate">
                                                        {report.submitted_by ?? 'Unknown'}
                                                    </div>
                                                    <StatusBadge status={report.status} />
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {report.area ?? '-'} · {report.activity ?? '-'} · {formatDate(report.created_at)}
                                                </div>
                                                <div className="text-xs text-foreground mt-1 truncate">{report.issue ?? '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-muted/30">
                            <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:gap-2 transition-all">
                                View all reports
                                <HiOutlineExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Overview Stats */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="text-[15px] font-bold text-foreground m-0">Overview</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Reports statistics summary</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="text-[11.5px] text-blue-600 mb-1.5 font-medium">Total</div>
                                    <div className="text-[28px] font-bold text-blue-600 tracking-[-1px]">{stats.total}</div>
                                    <div className="text-[11.5px] text-blue-600/70 mt-0.5">Issues reported</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4">
                                    <div className="text-[11.5px] text-green-600 mb-1.5 font-medium">Solved</div>
                                    <div className="text-[28px] font-bold text-green-600 tracking-[-1px]">{stats.solved}</div>
                                    <div className="text-[11.5px] text-green-600/70 mt-0.5">Resolved so far</div>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4">
                                    <div className="text-[11.5px] text-amber-600 mb-1.5 font-medium">Pending</div>
                                    <div className="text-[28px] font-bold text-amber-600 tracking-[-1px]">{stats.pending}</div>
                                    <div className="text-[11.5px] text-amber-600/70 mt-0.5">Awaiting action</div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <div className="text-[11.5px] text-purple-600 mb-1.5 font-medium">My Reports</div>
                                    <div className="text-[28px] font-bold text-purple-600 tracking-[-1px]">{stats.myReports}</div>
                                    <div className="text-[11.5px] text-purple-600/70 mt-0.5">Submitted by me</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-0 border-t border-border mt-6 pt-5">
                                <div className="text-center">
                                    <div className="text-[11.5px] text-muted-foreground mb-1">Solve rate</div>
                                    <div className="text-lg font-bold text-primary">{solvedPct}%</div>
                                    <div className="text-[10px] text-muted-foreground">overall</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[11.5px] text-muted-foreground mb-1">Top area</div>
                                    <div className="text-sm font-bold text-primary truncate px-1">{topArea || 'N/A'}</div>
                                    <div className="text-[10px] text-muted-foreground">most reports</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[11.5px] text-muted-foreground mb-1">Status</div>
                                    <div className={`text-sm font-bold ${solvedPct > 70 ? 'text-green-600' : solvedPct > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {solvedPct > 70 ? 'Good' : solvedPct > 40 ? 'Average' : 'Needs attention'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">on track</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <h3 className="text-[15px] font-bold text-foreground m-0">Quick Access</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Frequently used features</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {quickLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl text-center transition-all hover:scale-105 ${
                                            link.primary
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
                                                : 'bg-muted text-foreground hover:bg-primary/10'
                                        }`}
                                    >
                                        <Icon className={`w-6 h-6 ${link.primary ? 'text-white' : 'text-primary'}`} />
                                        <span className="text-[12.5px] font-medium">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}