import { Head, Link, router, usePage } from "@inertiajs/react"
import AppLayout from "@/Layouts/AppLayout"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { HiArrowRight, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentReport, HiOutlineInbox, HiOutlineLocationMarker } from "react-icons/hi"
import { CalendarDays, ChevronDown, X } from "lucide-react"
import { useEffect, useState } from "react"

const PERIOD_OPTIONS = [
  ["today", "Hari ini"],
  ["last_7_days", "7 hari terakhir"],
  ["this_month", "Bulan ini"],
  ["last_month", "Bulan lalu"],
  ["all", "Semua waktu"],
]

const statusConfig = {
  closed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  open: "border-blue-200 bg-blue-50 text-blue-700",
}

const formatRelative = (dateStr) => {
  if (!dateStr) return "-"
  const diffMinutes = Math.floor((new Date() - new Date(dateStr)) / 1000 / 60)
  if (diffMinutes < 60) return `${Math.max(diffMinutes, 0)} menit lalu`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} jam lalu`
  return `${Math.floor(diffMinutes / 1440)} hari lalu`
}

function StatusBadge({ status }) {
  const className = statusConfig[status] || "border-border bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status === "closed" ? "Selesai" : status === "open" ? "Terbuka" : status}
    </span>
  )
}

function StatCard({ title, value, note, href, icon, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }

  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-slate-300 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-[30px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[34px]">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="truncate text-xs text-muted-foreground">{note}</p>
        <HiArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  )
}

function TicketRow({ report }) {
  return (
    <Link href="/reports" className="grid gap-3 px-4 py-4 transition-colors hover:bg-background sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2 text-xs font-bold text-foreground">#{report.id}</span>
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">{report.issue || "Tanpa judul kendala"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HiOutlineLocationMarker className="h-3.5 w-3.5" />
              {report.area}
            </span>
            <span aria-hidden="true">·</span>
            <span>{report.activity}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelative(report.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pl-[52px] sm:justify-end sm:pl-0">
        <StatusBadge status={report.status} />
        <HiArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

function EmptyTickets() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <HiOutlineInbox className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">Belum ada laporan</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">Laporan operasional yang dibuat akan muncul di bagian ini.</p>
    </div>
  )
}

function ProgressPanel({ stats, completionPct, topArea }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Progress Penyelesaian</h2>
          <p className="mt-1 text-xs text-muted-foreground">Perbandingan tiket selesai dari seluruh tiket.</p>
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{completionPct}%</p>
      </div>
      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Progress penyelesaian tiket"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={completionPct}
      >
        <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${completionPct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {stats.closed} dari {stats.total} tiket selesai
        </span>
        <span>{stats.open} masih terbuka</span>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Area dengan tiket terbanyak</p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">{topArea || "Belum ada data area"}</p>
      </div>
    </section>
  )
}

function AttentionPanel({ ticket }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <HiOutlineClock className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold text-foreground">Perlu Perhatian</h2>
      </div>
      {!ticket ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-emerald-50 p-3 text-emerald-700">
          <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Tidak ada tiket terbuka</p>
            <p className="mt-0.5 text-xs">Seluruh tiket dalam cakupan Anda telah ditangani.</p>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-foreground">
              #{ticket.id} · {ticket.issue}
            </p>
            <StatusBadge status="open" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ticket.area} · {ticket.activity}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Terbuka selama</span>
            <span className={`text-sm font-bold tabular-nums ${ticket.age_in_days >= 30 ? "text-red-600" : "text-amber-700"}`}>{ticket.age_in_days} hari</span>
          </div>
          <Link href="/reports?status=open" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary">
            Tinjau tiket <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  )
}

function DashboardPeriod({ filters, areas }) {
  const [period, setPeriod] = useState(filters.period || "this_month")
  const [dateFrom, setDateFrom] = useState(filters.date_from || "")
  const [dateTo, setDateTo] = useState(filters.date_to || "")
  const [areaId, setAreaId] = useState(filters.area_id ? String(filters.area_id) : "")
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState({ period, dateFrom, dateTo, areaId })

  useEffect(() => {
    setPeriod(filters.period || "this_month")
    setDateFrom(filters.date_from || "")
    setDateTo(filters.date_to || "")
    setAreaId(filters.area_id ? String(filters.area_id) : "")
  }, [filters.area_id, filters.date_from, filters.date_to, filters.period])

  const open = () => {
    setDraft({ period, dateFrom, dateTo, areaId })
    setIsOpen(true)
  }

  const apply = () => {
    router.get(
      route("dashboard"),
      {
        period: draft.period,
        area_id: draft.areaId || undefined,
        ...(draft.period === "custom" ? { date_from: draft.dateFrom || undefined, date_to: draft.dateTo || undefined } : {}),
      },
      { preserveState: true, preserveScroll: true, replace: true },
    )
    setIsOpen(false)
  }

  const selectedLabel = period === "custom" ? "Rentang tanggal" : (PERIOD_OPTIONS.find(([value]) => value === period)?.[1] ?? "Pilih periode")

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <ModalOverlay id="dashboard-period-filter" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <section
          aria-labelledby="dashboard-period-title"
          className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl sm:max-w-lg sm:rounded-2xl sm:border"
        >
          <div className="px-4 pt-2 sm:hidden">
            <div className="mx-auto h-1 w-12 rounded-full bg-slate-300" />
          </div>
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
            <div>
              <h2 id="dashboard-period-title" className="text-lg font-bold tracking-tight text-foreground">
                Atur periode dashboard
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Pilih periode data yang ingin ditampilkan.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup pengaturan periode"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-4 py-5 sm:px-5">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Periode</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PERIOD_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, period: value, dateFrom: "", dateTo: "" }))}
                    className={`min-h-11 rounded-lg border px-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${draft.period === value ? "border-primary bg-blue-50 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold text-foreground">Atau pilih rentang tanggal</legend>
              <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                Tanggal mulai
                <input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(event) => setDraft((current) => ({ ...current, period: "custom", dateFrom: event.target.value }))}
                  className="ui-field min-h-11 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                Tanggal akhir
                <input
                  type="date"
                  value={draft.dateTo}
                  min={draft.dateFrom || undefined}
                  onChange={(event) => setDraft((current) => ({ ...current, period: "custom", dateTo: event.target.value }))}
                  className="ui-field min-h-11 text-sm"
                />
              </label>
            </fieldset>
            {areas.length > 0 && (
              <label className="grid gap-1.5 border-t border-border pt-5 text-sm font-semibold text-foreground">
                Area
                <select value={draft.areaId} onChange={(event) => setDraft((current) => ({ ...current, areaId: event.target.value }))} className="ui-field min-h-11 text-sm">
                  <option value="">Semua area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.area}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <footer
            className="grid grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:px-5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => setDraft({ period: "this_month", dateFrom: "", dateTo: "", areaId: "" })}
              className="min-h-12 rounded-xl border border-border bg-card text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              Atur ulang
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={draft.period === "custom" && (!draft.dateFrom || !draft.dateTo)}
              className="min-h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Terapkan
            </button>
          </footer>
        </section>
      </ModalOverlay>
    </>
  )
}

export default function Dashboard({ stats = { total: 0, open: 0, closed: 0, myReports: 0 }, recentReports = [], topArea = null, oldestOpenTicket = null, filters = {}, filterAreas = [] }) {
  const { auth } = usePage().props
  const userName = auth?.user?.name || "User"
  const roleName = (auth?.user?.roles?.[0] || "PENGGUNA")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
  const completionPct = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0
  const isLowData = recentReports.length > 0 && recentReports.length <= 3

  return (
    <AppLayout title="Dashboard">
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="flex flex-col gap-5 lg:gap-6">
        <header className="border-b border-border pb-3 sm:pb-5">
          <div className="flex min-h-12 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[26px]">Dashboard</h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-[13px]">
                Selamat datang, {roleName} {userName}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <DashboardPeriod filters={filters} areas={filterAreas} />
              <span className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </header>

        <section aria-label="Ringkasan tiket" className="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Tiket" value={stats.total} note="Seluruh tiket" href="/reports" icon={<HiOutlineDocumentReport className="h-5 w-5" />} />
          <StatCard title="Perlu Tindakan" value={stats.open} note="Tiket masih terbuka" href="/reports?status=open" icon={<HiOutlineClock className="h-5 w-5" />} tone="amber" />
          <StatCard title="Selesai" value={stats.closed} note="Tiket telah ditutup" href="/reports?status=closed" icon={<HiOutlineCheckCircle className="h-5 w-5" />} tone="emerald" />
          <StatCard
            title="Completion"
            value={`${completionPct}%`}
            note={`${stats.closed} dari ${stats.total} tiket`}
            href="/reports"
            icon={<HiOutlineCheckCircle className="h-5 w-5" />}
            tone="slate"
          />
        </section>

        <div className={`grid items-start gap-5 ${isLowData ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]" : "xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.7fr)]"}`}>
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Tickets Overview</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{recentReports.length ? `${recentReports.length} laporan terbaru` : "Belum ada aktivitas laporan"}</p>
              </div>
              <Link href="/reports" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-blue-50">
                Lihat semua <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentReports.length === 0 ? (
              <EmptyTickets />
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((report) => (
                  <TicketRow key={report.id} report={report} />
                ))}
              </div>
            )}
          </section>
          <div className="grid gap-5">
            <ProgressPanel stats={stats} completionPct={completionPct} topArea={topArea} />
            <AttentionPanel ticket={oldestOpenTicket} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
