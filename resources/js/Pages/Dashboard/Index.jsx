import { Head, Link, router, usePage } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { CalendarDays, ChevronDown, CircleCheck, Clock3, FileText, Files, X } from "lucide-react"
import AppLayout from "@/Layouts/AppLayout"
import InputDate from "@/Components/Input/InputDate"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const PERIOD_OPTIONS = [
  ["today", "Today"],
  ["last_7_days", "Last 7 days"],
  ["this_month", "This month"],
  ["last_month", "Last month"],
  ["all", "All time"],
]

const number = (value) => Number(value || 0).toLocaleString("en-US")
const chartTooltip = { backgroundColor: "#fff", border: "1px solid #e4e9f1", borderRadius: 8, color: "#243049", fontSize: 12, boxShadow: "0 4px 16px rgba(17,24,39,.08)" }
const areaColors = ["#3268dc", "#4c86e5", "#317eaa", "#52a49d", "#8798b7", "#8b74b0"]
const cardClass = "min-w-0 rounded-xl border border-[#e4e9f1] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.03)]"
const dateLong = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
const formatDay = (value) => dateLong.format(new Date(`${value}T00:00:00`))

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`${cardClass} ${className}`}>
      <div className="flex min-w-0 items-start justify-between gap-3 px-4 pb-2 pt-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#1c2740]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#73809a]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function StatCard({ title, value, hint, href, icon: Icon, tone = "neutral" }) {
  const Component = href ? Link : "div"
  const toneClass = { neutral: "text-[#1c2740]", blue: "text-[#2962e8]", amber: "text-[#d8841d]", green: "text-[#42aa79]" }[tone]
  return (
    <Component
      href={href || undefined}
      className={`${cardClass} block px-4 py-3.5 transition-colors hover:border-[#c9d6eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5`}
    >
      <div className="flex items-start justify-between gap-2 text-xs font-medium text-[#64718a]">
        <span>{title}</span>
        <Icon className="h-4 w-4 shrink-0 text-[#71819e]" aria-hidden="true" />
      </div>
      <p className={`mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums ${toneClass}`}>{number(value)}</p>
      <p className="mt-1.5 text-xs leading-4 text-[#8b98ae]">{hint}</p>
    </Component>
  )
}

function TicketStatus({ report }) {
  const type = report.category === "REPORT" ? "report" : report.status === "closed" ? "closed" : "open"
  const styles = {
    report: ["Report", "bg-slate-100 text-slate-600"],
    open: ["Open", "bg-amber-50 text-amber-700"],
    closed: ["Closed", "bg-emerald-50 text-emerald-700"],
  }
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold ${styles[type][1]}`}>{styles[type][0]}</span>
}

function reportDate(value) {
  if (!value) return ["—", ""]
  const date = new Date(value)
  return [new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date), new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date)]
}

function RecentTickets({ reports, canViewReports }) {
  return (
    <Panel title="Recent Tickets" className="flex min-h-0 flex-col">
      {reports.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No tickets in this period.</p>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.95fr)_auto] gap-3 border-y border-[#e8edf4] bg-[#f8faff] px-5 py-2 text-xs font-medium text-[#64718a] md:grid">
            <span>Finding</span>
            <span>Activity</span>
            <span>Area</span>
            <span>Reported at</span>
            <span>Status</span>
          </div>
          <div
            className="min-h-0 max-h-[min(55dvh,460px)] divide-y divide-[#e8edf4] overflow-y-auto overscroll-contain px-4 sm:px-5 xl:max-h-none xl:flex-1"
            role="region"
            aria-label="Recent tickets, scroll for more"
          >
            {reports.map((report) => {
              const [date, time] = reportDate(report.created_at)
              const content = (
                <>
                  <span className="col-span-2 min-w-0 text-[13px] font-medium leading-5 text-[#243049] md:col-auto md:line-clamp-2">{report.issue || "No description"}</span>
                  <span className="col-span-2 min-w-0 truncate text-xs text-[#52617d] md:col-auto">{report.activity}</span>
                  <span className="col-start-1 row-start-3 min-w-0 truncate text-xs text-[#52617d] md:col-auto md:row-auto">{report.area}</span>
                  <span className="col-start-1 row-start-4 text-xs tabular-nums text-[#52617d] md:col-auto md:row-auto">
                    <span className="block">{date}</span>
                    <span className="text-[#77859b]">{time}</span>
                  </span>
                  <span className="col-start-2 row-span-2 self-center justify-self-end md:col-auto md:row-span-1 md:justify-self-start">
                    <TicketStatus report={report} />
                  </span>
                </>
              )
              return canViewReports ? (
                <Link
                  key={report.id}
                  href={`/reports?selected_report=${report.id}`}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-3 hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.95fr)_auto] md:items-center md:gap-3"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={report.id}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.95fr)_auto] md:items-center md:gap-3"
                >
                  {content}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Panel>
  )
}

function StatusBreakdown({ stats }) {
  const values = [
    { label: "Open Tickets", value: stats.open, color: "#3d79ec" },
    { label: "Closed Tickets", value: stats.closed, color: "#4eb789" },
    { label: "Reports", value: stats.reports, color: "#aeb8ca" },
  ]
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <Panel title="Ticket Status Breakdown" subtitle="Distribution of tickets by status." className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pb-5 pt-2 sm:flex-row sm:gap-6 sm:px-5 sm:pb-4">
        <div
          className="relative h-[clamp(160px,22dvh,240px)] w-[clamp(160px,22dvh,240px)] shrink-0"
          role="img"
          aria-label={`${number(stats.open)} open, ${number(stats.closed)} closed, ${number(stats.reports)} reports`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={total ? values : [{ label: "No data", value: 1, color: "#e9edf4" }]}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="91%"
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
              >
                {(total ? values : [{ label: "No data", value: 1, color: "#e9edf4" }]).map((item) => (
                  <Cell key={item.label} fill={item.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltip} formatter={(value) => [`${number(value)} tickets`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums text-[#1c2740]">{number(total)}</span>
            <span className="text-[11px] text-[#8b98ae]">Total Tickets</span>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 divide-y divide-[#e9edf4] text-xs" aria-label="Status totals">
          {values.map((item) => (
            <li key={item.label} className="flex items-center gap-2 py-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1 text-[#52617d]">{item.label}</span>
              <span className="font-semibold tabular-nums text-[#1c2740]">{number(item.value)}</span>
              <span className="w-10 text-right tabular-nums text-[#73809a]">{total ? Math.round((Number(item.value || 0) / total) * 100) : 0}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

function AreaBars({ items }) {
  const shown = items.slice(0, 6)
  const data = shown.map((item) => ({ ...item, total: Number(item.total || 0) }))
  return (
    <Panel title="Tickets by Area" subtitle="Number of tickets per area." className="flex min-h-0 flex-col">
      {shown.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No area data in this period.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-5">
          <div className="min-h-[130px] flex-1" role="img" aria-label={`Tickets by area: ${shown.map((item) => `${item.name} ${number(item.total)}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 19, right: 7, bottom: 0, left: 0 }} barCategoryGap="38%">
                <CartesianGrid vertical={false} stroke="#e8edf4" />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#aeb9cc" }} tick={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#8b98ae", fontSize: 10 }} width={35} />
                <Tooltip contentStyle={chartTooltip} labelFormatter={(name) => name} formatter={(value) => [`${number(value)} tickets`, "Total"]} />
                <Bar dataKey="total" maxBarSize={50} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.map((item, index) => (
                    <Cell key={item.id} fill={areaColors[index % areaColors.length]} />
                  ))}
                  <LabelList dataKey="total" position="top" formatter={number} style={{ fill: "#243049", fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-4 text-[#52617d] sm:grid-cols-3">
            {shown.map((item, index) => (
              <li key={item.id} className="flex min-w-0 items-start gap-1.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: areaColors[index % areaColors.length] }} aria-hidden="true" />
                <span className="min-w-0 break-words">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function TopActivities({ items, subActivities }) {
  const activities = items.filter((item) => Number(item.issue_total) > 0)
  const subItems = activities.length === 1
    ? subActivities.filter((item) => item.activity_id === activities[0].id && Number(item.issue_total) > 0).sort((a, b) => Number(b.issue_total) - Number(a.issue_total))
    : []
  const singleSubActivity = activities.length === 1 && subItems.length === 1
  const shown = (activities.length === 1 && subItems.length ? subItems : activities).slice(0, 5)
  const title = activities.length === 1 && subItems.length > 1 ? "Sub-activity progress" : singleSubActivity ? "Issue progress" : "Top Activities"
  const subtitle = activities.length === 1 ? `${activities[0].name} · Closed issues / total issues` : "Closed issues / total issues in this period."
  const single = singleSubActivity ? subItems[0] : null
  const percentage = single ? Math.round((Number(single.issue_closed) / Number(single.issue_total)) * 100) : 0
  return (
    <Panel title={title} subtitle={subtitle} className="flex min-h-0 flex-col">
      {activities.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No issues in this period.</p>
      ) : single ? (
        <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
          <p className="break-words text-sm font-medium text-[#35445f]">{single.name}</p>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-2xl font-semibold tabular-nums text-[#243049]">{percentage}% <span className="text-sm font-medium text-slate-500">completed</span></span>
            <span className="text-sm font-semibold tabular-nums text-[#243049]">{number(single.issue_closed)} / {number(single.issue_total)} closed</span>
          </div>
          <div className="h-4 overflow-hidden bg-[#f0f3f8]" role="img" aria-label={`${single.name}: ${number(single.issue_closed)} closed out of ${number(single.issue_total)} issues`}>
            <div className="h-full bg-[#3d79ec]" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-xs text-slate-500">{number(Number(single.issue_total) - Number(single.issue_closed))} open issues</p>
        </div>
      ) : (
        <ol className="flex flex-col px-4 pb-3 sm:px-5">
          {shown.map((item) => (
            <li key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_5.5rem] sm:gap-x-4">
              <span className="min-w-0 break-words text-[13px] font-medium leading-5 text-[#35445f]">{item.name}</span>
              <span
                className="col-start-1 row-start-2 h-4 overflow-hidden bg-[#f0f3f8] sm:col-start-2 sm:row-start-1"
                role="img"
                aria-label={`${item.name}: ${number(item.issue_closed)} closed out of ${number(item.issue_total)} issues`}
              >
                <span className="block h-full bg-[#3d79ec]" style={{ width: `${item.issue_total ? Math.max(0, Math.min(100, (Number(item.issue_closed) / Number(item.issue_total)) * 100)) : 0}%` }} />
              </span>
              <span className="col-start-2 row-span-2 whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-[#243049] sm:col-start-3 sm:row-span-1">
                {number(item.issue_closed)} / {number(item.issue_total)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function TicketTrend({ items }) {
  const data = items.map((item) => ({ ...item, total: Number(item.total || 0) }))
  const subtitle = items.length ? `Daily tickets, ${formatDay(items[0].date)} to ${formatDay(items[items.length - 1].date)}.` : "Daily tickets in the selected period."
  return (
    <Panel title="Ticket Trend" subtitle={subtitle} className="flex min-h-0 flex-col">
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No trend data for this period.</p>
      ) : (
        <div
          className="min-h-[120px] flex-1 px-3 pb-3 sm:px-5"
          role="img"
          aria-label={`Daily ticket trend: ${number(data.reduce((sum, item) => sum + item.total, 0))} tickets across ${items.length} days`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 9, bottom: 0, left: 0 }}>
              <CartesianGrid vertical stroke="#e8edf4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#aeb9cc" }}
                minTickGap={28}
                tick={{ fill: "#8b98ae", fontSize: 10 }}
                tickFormatter={(value) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`))}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#8b98ae", fontSize: 10 }} width={35} />
              <Tooltip
                contentStyle={chartTooltip}
                labelFormatter={(value) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`))}
                formatter={(value) => [`${number(value)} tickets`, "Total"]}
              />
              <Line dataKey="total" type="monotone" stroke="#3d79ec" strokeWidth={2.5} dot={items.length <= 31 ? { r: 2.5, strokeWidth: 0 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

function DashboardPeriod({ filters }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState({
    period: filters.period || "this_month",
    dateFrom: filters.date_from || "",
    dateTo: filters.date_to || "",
  })
  useEffect(() => {
    setDraft({ period: filters.period || "this_month", dateFrom: filters.date_from || "", dateTo: filters.date_to || "" })
  }, [filters.date_from, filters.date_to, filters.period])
  const open = () => {
    setDraft({ period: filters.period || "this_month", dateFrom: filters.date_from || "", dateTo: filters.date_to || "" })
    setIsOpen(true)
  }
  const apply = () => {
    router.get(
      route("dashboard"),
      { period: draft.period, ...(draft.period === "custom" ? { date_from: draft.dateFrom || undefined, date_to: draft.dateTo || undefined } : {}) },
      { preserveState: true, preserveScroll: true, replace: true },
    )
    setIsOpen(false)
  }
  const label = filters.period === "custom" ? "Custom range" : PERIOD_OPTIONS.find(([value]) => value === (filters.period || "this_month"))?.[1] || "This month"
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e4e9f1] bg-white px-3 text-xs font-semibold text-[#243049] hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CalendarDays className="h-4 w-4 text-[#71819e]" />
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-[#71819e]" />
      </button>
      <ModalOverlay id="dashboard-period-filter" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <section
          aria-labelledby="dashboard-period-title"
          className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-card sm:max-w-lg sm:rounded-xl sm:border"
        >
          <div className="px-4 pt-2 sm:hidden">
            <div className="mx-auto h-1 w-12 rounded-full bg-slate-300" />
          </div>
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
            <div>
              <h2 id="dashboard-period-title" className="text-lg font-bold tracking-tight text-foreground">
                Dashboard period
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose the dates to include.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close period filter"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Period</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PERIOD_OPTIONS.map(([value, optionLabel]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={draft.period === value}
                    onClick={() => setDraft((current) => ({ ...current, period: value, dateFrom: "", dateTo: "" }))}
                    className={`min-h-11 rounded-lg border px-3 text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary ${draft.period === value ? "border-primary bg-blue-50 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                  >
                    {optionLabel}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex gap-2">
              <InputDate label="Start date" value={draft.dateFrom} onChange={(event) => setDraft((current) => ({ ...current, period: "custom", dateFrom: event.target.value }))} />
              <InputDate
                label="End date"
                value={draft.dateTo}
                min={draft.dateFrom || undefined}
                onChange={(event) => setDraft((current) => ({ ...current, period: "custom", dateTo: event.target.value }))}
              />
            </fieldset>
          </div>
          <footer className="grid grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 sm:px-5" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={() => setDraft({ period: "this_month", dateFrom: "", dateTo: "" })}
              className="min-h-12 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={draft.period === "custom" && (!draft.dateFrom || !draft.dateTo || draft.dateFrom > draft.dateTo)}
              className="min-h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
            >
              Apply
            </button>
          </footer>
        </section>
      </ModalOverlay>
    </>
  )
}

export default function Dashboard({ stats = { total: 0, reports: 0, open: 0, closed: 0 }, recentReports = [], analytics = {}, filters = {} }) {
  const { auth, navItems = [] } = usePage().props
  const canViewReports = navItems.some((item) => item.href === route("reports.index"))
  const reportLink = (status) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (filters.date_from) params.set("date_from", filters.date_from)
    if (filters.date_to) params.set("date_to", filters.date_to)
    if (filters.area_id) params.set("area_id", String(filters.area_id))
    return `/reports${params.size ? `?${params}` : ""}`
  }
  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard" />
      <div className="flex min-h-0 flex-col gap-3 xl:min-h-[calc(100dvh-64px)]">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1c2740]">Dashboard</h1>
            <p className="mt-0.5 text-xs text-[#73809a]">Welcome back, {auth?.user?.name || "User"}.</p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardPeriod filters={filters} />
            <span className="hidden text-xs text-[#73809a] md:inline">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>
          </div>
        </header>
        <section aria-label="Ticket summary" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard title="Total Tickets" value={stats.total} hint="All recorded tickets" icon={Files} href={canViewReports && reportLink()} />
          <StatCard title="Reports" value={stats.reports} hint="Reports without closing status" icon={FileText} href={canViewReports && reportLink("report")} tone="blue" />
          <StatCard title="Open Tickets" value={stats.open} hint="Waiting for follow-up" icon={Clock3} href={canViewReports && reportLink("open")} tone="amber" />
          <StatCard title="Closed Tickets" value={stats.closed} hint="Resolved tickets" icon={CircleCheck} href={canViewReports && reportLink("closed")} tone="green" />
        </section>
        <div className="grid min-h-0 min-w-0 gap-3 xl:h-[calc(100dvh-214px)] xl:min-h-[570px] xl:flex-none xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="grid min-h-0 min-w-0 gap-3 xl:grid-rows-[minmax(330px,1fr)_minmax(210px,1.1fr)]">
            <RecentTickets reports={recentReports} canViewReports={canViewReports} />
            <TopActivities items={analytics.activities || []} subActivities={analytics.subActivities || []} />
          </div>
          <div className="order-first grid min-h-0 min-w-0 gap-3 md:order-none xl:grid-rows-[minmax(210px,1.1fr)_minmax(200px,1fr)_minmax(160px,.8fr)]">
            <StatusBreakdown stats={stats} />
            <AreaBars items={analytics.areas || []} />
            <TicketTrend items={analytics.dailyTrend || []} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
