import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import AppLayout from "@/Layouts/AppLayout";
import { formatDate } from "@/lib/format.ts";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import ReportForm from "@/Components/Form/ReportForm";
import SolveForm from "@/Components/Form/SolveForm";
import RejectForm from "@/Components/Form/RejectForm";
import ExportForm from "@/Components/Form/ExportReportForm";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import { SlidersHorizontal, FileDown, ChevronRight, File, X, ChevronDown, ChevronUp } from "lucide-react";
import Pagination from "@/Components/Navigation/Pagination";
import ReportCard from "@/Components/Card/ReportCard";

const RichText = ({ text, maxLines = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text || text === "-") return <span className="text-muted-foreground text-[12px]">–</span>;
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const isList = lines.length > 1 && lines.every((l) => /^[-•*]|^\d+[.)]\s/.test(l));
  const cleanLine = (l) => l.replace(/^[-•*]\s*|^\d+[.)]\s*/, "");
  const visibleLines = expanded ? lines : lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;
  if (isList) {
    return (
      <div className="space-y-0.5">
        <ul className="space-y-0.5 list-none m-0 p-0">
          {visibleLines.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-foreground leading-snug">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span>{cleanLine(line)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> +{lines.length - maxLines} more</>}
          </button>
        )}
      </div>
    );
  }
  const shortText = lines.slice(0, maxLines).join(" ");
  const fullText = lines.join(" ");
  const isLong = fullText.length > 120 || lines.length > maxLines;
  return (
    <div>
      <p className="text-[12.5px] text-foreground leading-snug whitespace-pre-wrap break-words">
        {expanded || !isLong ? fullText : shortText.slice(0, 120) + "…"}
      </p>
      {isLong && (
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
        </button>
      )}
    </div>
  );
};

export default function Index({ areaReports = { data: [], links: [], meta: {} }, areas = [], activities = [], users = [], filters = {} }) {
  const { props } = usePage();
  const { setStatusModalProps } = useStatusModal();
  const permissions = props.auth?.user?.permissions || [];
  const auth = props.auth?.user;
  const [selectedAreaReport, setSelectedAreaReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "");
  const [type, setType] = useState(filters.type || "");
  const [area, setArea] = useState(filters.area || "");
  const [role, setRole] = useState(filters.role || "");
  const [dateFrom, setDateFrom] = useState(filters.date_from || "");
  const [dateTo, setDateTo] = useState(filters.date_to || "");
  const [myReportsOnly, setMyReportsOnly] = useState(filters.my_reports_only === "true" || false);

  const [tempStatus, setTempStatus] = useState("");
  const [tempType, setTempType] = useState("");
  const [tempArea, setTempArea] = useState("");
  const [tempRole, setTempRole] = useState("");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");
  const [tempMyReportsOnly, setTempMyReportsOnly] = useState(false);

  const can = (permission) => permissions.includes(permission);
  const canCreate = can("reports.create");
  const canSolve = can("reports.solve.all") || can("reports.solve.own.area");
  const canReject = canSolve;
  const canEditAll = can("reports.edit.all");
  const canEditOwn = can("reports.edit.own");
  const canDelete = can("reports.delete");
  const canExportAll = can("reports.view.all");
  const canExportArea = can("reports.solve.own.area");
  const canExportOwn = can("reports.view.own");
  const canExport = canExportAll || canExportArea || canExportOwn;
  const assignedAreas = areas.filter((a) => a.pic_user_id == auth.id);
  const exportAreas = canExportAll ? areas : assignedAreas;
  const exportUsers = canExportAll ? users : [];
  const reports = areaReports.data ?? [];
  const canEditSelected = (report) => report && (canEditAll || (canEditOwn && report.author_id === auth.id));
  const canRejectSelected = (report) => report && canReject && !report.finished_date && report.status === 'pending' && (can('reports.solve.all') || report.area?.pic_user_id == auth.id);
  const canSolveSelected = (report) => report && canSolve && !report.finished_date && report.status === 'pending' && (can('reports.solve.all') || report.area?.pic_user_id == auth.id);
  const canDeleteSelected = (report) => report && report.status === 'pending' && canDelete;

  useEffect(() => {
    const debouncedFilter = debounce(() => {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;
      if (area) params.area = area;
      if (role) params.role = role;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (myReportsOnly) params.my_reports_only = true;
      router.get(route("reports.index"), params, { preserveState: true, preserveScroll: true, replace: true });
    }, 300);
    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [search, status, type, area, role, dateFrom, dateTo, myReportsOnly]);

  const handleReset = () => {
    setSearch(""); setStatus(""); setType(""); setArea(""); setRole("");
    setDateFrom(""); setDateTo(""); setMyReportsOnly(false);
    router.get(route("reports.index"), {}, { preserveScroll: true });
  };

  const openFilter = () => {
    setTempStatus(status); setTempType(type); setTempArea(area);
    setTempRole(role); setTempDateFrom(dateFrom); setTempDateTo(dateTo);
    setTempMyReportsOnly(myReportsOnly);
  };
  const openFilterModal = () => { openFilter(); setShowFilterModal(true); };
  const openFilterSheet = () => { openFilter(); setShowFilterSheet(true); };

  const applyFilter = () => {
    setStatus(tempStatus); setType(tempType); setArea(tempArea);
    setRole(tempRole); setDateFrom(tempDateFrom); setDateTo(tempDateTo);
    setMyReportsOnly(tempMyReportsOnly);
  };
  const applyFilterModal = () => { applyFilter(); setShowFilterModal(false); };
  const applyFilterSheet = () => { applyFilter(); setShowFilterSheet(false); };
  const resetFilter = () => {
    setTempStatus(""); setTempType(""); setTempArea(""); setTempRole("");
    setTempDateFrom(""); setTempDateTo(""); setTempMyReportsOnly(false);
  };

  const activeFilterChips = [
    ...(dateFrom || dateTo ? [{ key: "periode", label: `Periode: ${dateFrom || "..."} – ${dateTo || "..."}`, clear: () => { setDateFrom(""); setDateTo(""); } }] : []),
    ...(status ? [{ key: "status", label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, clear: () => setStatus("") }] : []),
    ...(area ? [{ key: "area", label: `Area: ${areas.find((a) => a.id == area)?.area ?? area}`, clear: () => setArea("") }] : []),
    ...(role ? [{ key: "role", label: `Role: ${role}`, clear: () => setRole("") }] : []),
    ...(type ? [{ key: "type", label: `Activity: ${activities.find((a) => a.id == type)?.description ?? type}`, clear: () => setType("") }] : []),
    ...(myReportsOnly ? [{ key: "my_reports", label: "My Reports Only", clear: () => setMyReportsOnly(false) }] : []),
  ];

  const typeOptions = [{ label: "All Activities", value: "" }, ...activities.map((a) => ({ label: a.description, value: a.id.toString() }))];
  const statusOptions = [{ label: "All Statuses", value: "" }, { label: "Pending", value: "pending" }, { label: "Rejected", value: "rejected" }, { label: "Finished", value: "solved" }];
  const areaOptions = [{ label: "All Areas", value: "" }, ...areas.map((a) => ({ label: a.area, value: a.id.toString() }))];
  const roleOptions = [{ label: "All Roles", value: "" }, { label: "Admin", value: "Admin" }, { label: "Supervisor", value: "Supervisor" }, { label: "Manager", value: "Manager" }];

  const handleSelectAreaReport = (report) => setSelectedAreaReport(selectedAreaReport?.id === report.id ? null : report);
  const handleCloseAreaReport = () => setSelectedAreaReport(null);
  const handleSolveClick = () => setShowSolveModal(true);
  const handleCloseSolveModal = () => { setShowSolveModal(false); setSelectedAreaReport(null); };
  const handleEditClick = () => setShowEditModal(true);
  const handleCloseEditModal = () => { setShowEditModal(false); setSelectedAreaReport(null); };
  const handleRejectClick = () => setShowRejectModal(true);
  const handleCloseRejectModal = () => { setShowRejectModal(false); setSelectedAreaReport(null); };
  const handleDeleteReport = async () => {
    if (!selectedAreaReport || selectedAreaReport.status !== 'pending') return;
    const confirmed = window.confirm("Hapus laporan ini?");
    if (!confirmed) return;

    try {
      await router.delete(route("reports.destroy", selectedAreaReport.id), {}, { preserveScroll: true });
      setSelectedAreaReport(null);
      router.reload();
    } catch (error) {
      console.error(error);
    }
  };
  const areaOfAuthUser = areas.find((a) => a.pic_user_id == auth.id);

  // Shared filter form — rendered inside both modal and bottom sheet
  const FilterFields = () => (
    <div className="flex flex-col gap-5">
      {/* Periode */}
      <div>
        <label className="block text-[12px] font-semibold text-foreground mb-2">Periode</label>
        <div className="flex items-center gap-2">
          <input type="date" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)}
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <span className="text-muted-foreground text-sm font-medium shrink-0">–</span>
          <input type="date" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)}
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </div>

      {/* Status — pill buttons */}
      <div>
        <label className="block text-[12px] font-semibold text-foreground mb-2">Status</label>
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <button key={opt.value} onClick={() => setTempStatus(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-all
                ${tempStatus === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/40"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <InputDropdown label="Area" value={tempArea} setObject={(item) => setTempArea(item.value)} itemList={areaOptions} />
      </div>

      {/* Role */}
      <div>
        <InputDropdown label="Role" value={tempRole} setObject={(item) => setTempRole(item.value)} itemList={roleOptions} />
      </div>

      {/* Activity */}
      <div>
        <InputDropdown label="Activity" value={tempType} setObject={(item) => setTempType(item.value)} itemList={typeOptions} />
      </div>

      {/* My Reports Only — toggle switch */}
      <label className="flex items-center justify-between gap-3 cursor-pointer py-0.5">
        <span className="text-[13px] text-foreground font-medium">Show only my reports</span>
        <div onClick={() => setTempMyReportsOnly((v) => !v)}
          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${tempMyReportsOnly ? "bg-primary" : "bg-border"}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${tempMyReportsOnly ? "left-5" : "left-1"}`} />
        </div>
      </label>
    </div>
  );

  return (
    <AppLayout title="Report Lists">
      <Head><title>Reports</title></Head>

      {/* ── DESKTOP ── */}
      <div className="hidden sm:flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-[-0.3px]">Report Lists</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all reports</p>
          </div>
          {canCreate && (
            <BtnDefault onClick={() => setIsModalOpen(true)} size="md" className="gap-2 px-4 h-10 rounded-xl shadow-sm">
              <HiOutlinePlus className="w-4 h-4" />New Issue
            </BtnDefault>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <InputText placeholder="Search by issue, submitter, or activity..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <BtnDefault outline onClick={openFilterModal} className="gap-2 h-10 rounded-xl px-4">
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterChips.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterChips.length}
                </span>
              )}
            </BtnDefault>
            {canExport && (
              <BtnDefault outline onClick={() => setShowExportModal(true)} className="gap-2 h-10 px-4 rounded-xl text-sm">
                <File className="w-4 h-4" />Export Dokumen
              </BtnDefault>
            )}
          </div>
          {activeFilterChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md px-2.5 py-1 text-xs font-semibold">
                  {chip.label}
                  <button onClick={chip.clear} className="hover:text-primary/70 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button onClick={handleReset} className="text-xs text-primary font-semibold hover:underline ml-1">Clear all</button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-foreground">Report <span>{areaOfAuthUser?.area ?? "Area"}</span></h3>
            <span className="text-[12px] text-muted-foreground">{reports.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/40 text-left border-b border-border">
                  {["No", "Date", "Submitted By", "Type"].map((col) => (
                    <th key={col} className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase whitespace-nowrap">{col}</th>
                  ))}
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase min-w-[220px]">Activity / Issue</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">Before</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">After</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase whitespace-nowrap">Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reports.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-muted-foreground text-[13px]">No data found</td></tr>
                ) : (
                  reports.map((report, index) => {
                    const isSolved = !!report.finished_date;
                    const isSelected = selectedAreaReport?.id === report.id;
                    return (
                      <tr key={report.id} onClick={() => handleSelectAreaReport(report)}
                        className={`cursor-pointer transition-all duration-150 align-top hover:bg-muted/50
                          ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}
                          ${report.status === 'solved' ? "bg-emerald-50/30 dark:bg-emerald-950/10" : report.status === 'rejected' ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}>
                        <td className="px-4 py-3.5 text-[12px] text-muted-foreground font-semibold w-10 shrink-0">{index + 1}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-[12.5px] font-medium text-foreground">{formatDate(report.created_at)}</p>
                          {report.updated_at !== report.created_at && <p className="text-[11px] text-muted-foreground mt-0.5">↑ {formatDate(report.updated_at)}</p>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-[12.5px] font-semibold text-foreground">{report.author?.name ?? "-"}</p>
                          {report.author?.role && <p className="text-[11px] text-muted-foreground mt-0.5">{report.author.role}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11.5px] font-semibold whitespace-nowrap">
                            {report.activity_type?.name ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[320px]">
                          {report.activity && (
                            <div className="mb-2">
                              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide">Activity</span>
                              <RichText text={report.activity} maxLines={2} />
                            </div>
                          )}
                          {report.issue && (
                            <div className={report.activity ? "pt-2 border-t border-border/50" : ""}>
                              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide">Issue</span>
                              <RichText text={report.issue} maxLines={3} />
                            </div>
                          )}
                          {!report.activity && !report.issue && <span className="text-muted-foreground text-[12px]">–</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {report.photo_before
                            ? <ExpandableImage src={`/storage/${report.photo_before}`} alt="Before" className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border" />
                            : <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center"><span className="text-muted-foreground text-[10px]">–</span></div>}
                        </td>
                        <td className="px-4 py-3.5">
                          {report.photo_after
                            ? <ExpandableImage src={`/storage/${report.photo_after}`} alt="After" className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border" />
                            : <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center"><span className="text-muted-foreground text-[10px]">–</span></div>}
                        </td>
                        <td className="px-4 py-3.5">
                          {report.status === 'solved' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11.5px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Finished</span>
                          ) : report.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-600 text-[11.5px] font-semibold bg-rose-50 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />Rejected</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 text-[11.5px] font-semibold bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isSolved
                            ? <span className="text-emerald-600 text-[12px] font-semibold">{formatDate(report.finished_date)}</span>
                            : <span className="text-muted-foreground text-xs">–</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination links={areaReports.links} />
        </div>

        {selectedAreaReport && selectedAreaReport.status === 'pending' && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-xl py-3 px-5 flex items-center gap-3 shadow-xl z-[300] min-w-[340px] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"} · {formatDate(selectedAreaReport.created_at)}</div>
              <div className="text-xs text-slate-400 mt-0.5"><span className="text-amber-400">● Pending</span></div>
            </div>
            {canEditSelected(selectedAreaReport) && (
              <BtnDefault size="sm" onClick={handleEditClick} className="shadow-lg">Edit</BtnDefault>
            )}
            {canRejectSelected(selectedAreaReport) && (
              <BtnDefault size="sm" outline onClick={handleRejectClick} className="shadow-lg">Reject</BtnDefault>
            )}
            {canSolveSelected(selectedAreaReport) && (
              <BtnDefault size="sm" onClick={handleSolveClick} className="shadow-lg">Solve</BtnDefault>
            )}
            {canDeleteSelected(selectedAreaReport) && (
              <BtnDefault size="sm" outline onClick={handleDeleteReport} className="shadow-lg text-destructive border-destructive">Delete</BtnDefault>
            )}
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center"><HiOutlineX className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {selectedAreaReport && selectedAreaReport.status === 'rejected' && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-rose-900 text-white rounded-xl py-3 px-5 flex items-center gap-3 shadow-xl z-[300] min-w-[340px] border border-rose-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"} · {formatDate(selectedAreaReport.created_at)}</div>
              <div className="text-xs text-rose-200 mt-0.5"><span className="text-rose-300">● Rejected</span></div>
            </div>
            {canEditSelected(selectedAreaReport) && (
              <BtnDefault size="sm" onClick={handleEditClick} className="shadow-lg">Perbaiki</BtnDefault>
            )}
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center"><HiOutlineX className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {selectedAreaReport && selectedAreaReport.status === 'solved' && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-xl z-[300] min-w-[340px] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"} · {formatDate(selectedAreaReport.created_at)}</div>
              <div className="text-xs text-emerald-400 mt-0.5"><span className="text-emerald-400">✓ Solved {formatDate(selectedAreaReport.finished_date)}</span></div>
            </div>
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center"><HiOutlineX className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* ── MOBILE ── */}
      <div className="flex sm:hidden flex-col gap-0 bg-[#f5f6fa] min-h-screen -mx-4 -mt-4">
        <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 leading-tight">Report Lists</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Manage reports</p>
            </div>
            {canCreate && (
              <button onClick={() => setIsModalOpen(true)} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md active:scale-95 transition-transform">
                <HiOutlinePlus className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 text-[13px] text-gray-800 placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <button onClick={openFilterSheet} className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600 active:bg-gray-200 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />Filter
              {activeFilterChips.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterChips.length}
                </span>
              )}
            </button>
            {canExport && (
              <button onClick={() => setShowExportModal(true)} className="flex items-center px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors">
                <FileDown className="w-4 h-4" />
              </button>
            )}
          </div>
          {activeFilterChips.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-gray-100">
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {chip.label}
                  <button onClick={chip.clear}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              <button onClick={handleReset} className="text-[11px] text-blue-600 font-semibold">Clear all</button>
            </div>
          )}
        </div>

        <div className="px-3 py-3 flex flex-col gap-2.5">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 mb-4 opacity-30">
                <svg viewBox="0 0 80 80" fill="none"><path d="M40 8L72 24V56L40 72L8 56V24L40 8Z" stroke="#94a3b8" strokeWidth="2" fill="none" /><path d="M40 8V72M8 24L72 56M72 24L8 56" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" /><circle cx="55" cy="18" r="4" fill="#cbd5e1" /><path d="M52 26l6-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <p className="text-[16px] font-semibold text-gray-700 mb-1">Belum ada laporan</p>
              <p className="text-[13px] text-gray-400 mb-5">Laporan yang Anda buat akan muncul di sini.</p>
              {canCreate && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold shadow-md active:scale-95 transition-transform">
                  <HiOutlinePlus className="w-4 h-4" />Buat Laporan Baru
                </button>
              )}
            </div>
          ) : (
            reports.map((report) => <ReportCard key={report.id} report={report} isSelected={selectedAreaReport?.id === report.id} onSelect={handleSelectAreaReport} />)
          )}
        </div>
        <Pagination links={areaReports.links} center />

        {selectedAreaReport && selectedAreaReport.status === 'pending' && (
          <div className="fixed bottom-20 left-3 right-3 bg-slate-800 text-white rounded-2xl py-3 px-4 flex flex-wrap items-center gap-3 shadow-xl z-[300] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"}</div>
              <div className="text-[11px] text-slate-400 mt-0.5"><span className="text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pending</span></div>
            </div>
            {canEditSelected(selectedAreaReport) && (
              <button onClick={handleEditClick} className="px-4 py-2 bg-blue-600 rounded-xl text-[13px] font-semibold shadow-md active:bg-blue-700 transition-colors">Edit</button>
            )}
            {canRejectSelected(selectedAreaReport) && (
              <button onClick={handleRejectClick} className="px-4 py-2 bg-rose-600 rounded-xl text-[13px] font-semibold shadow-md active:bg-rose-700 transition-colors">Reject</button>
            )}
            {canSolveSelected(selectedAreaReport) && (
              <button onClick={handleSolveClick} className="px-4 py-2 bg-emerald-600 rounded-xl text-[13px] font-semibold shadow-md active:bg-emerald-700 transition-colors">Solve</button>
            )}
            {canDeleteSelected(selectedAreaReport) && (
              <button onClick={handleDeleteReport} className="px-4 py-2 bg-white/10 text-red-200 rounded-xl text-[13px] font-semibold shadow-md hover:bg-white/20">Delete</button>
            )}
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"><HiOutlineX className="w-4 h-4" /></button>
          </div>
        )}
        {selectedAreaReport && selectedAreaReport.status === 'rejected' && (
          <div className="fixed bottom-20 left-3 right-3 bg-rose-900 text-white rounded-2xl py-3 px-4 flex flex-wrap items-center gap-3 shadow-xl z-[300] border border-rose-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"}</div>
              <div className="text-[11px] text-rose-200 mt-0.5"><span className="text-rose-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block" /> Rejected</span></div>
            </div>
            {canEditSelected(selectedAreaReport) && (
              <button onClick={handleEditClick} className="px-4 py-2 bg-blue-600 rounded-xl text-[13px] font-semibold shadow-md active:bg-blue-700 transition-colors">Perbaiki</button>
            )}
            {canDelete && (
              <button onClick={handleDeleteReport} className="px-4 py-2 bg-white/10 text-red-200 rounded-xl text-[13px] font-semibold shadow-md hover:bg-white/20">Delete</button>
            )}
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"><HiOutlineX className="w-4 h-4" /></button>
          </div>
        )}
        {selectedAreaReport && selectedAreaReport.status === 'solved' && (
          <div className="fixed bottom-20 left-3 right-3 bg-slate-800 text-white rounded-2xl py-3 px-4 flex items-center gap-3 shadow-xl z-[300] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">#{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5"><span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Solved {formatDate(selectedAreaReport.finished_date)}</span></div>
            </div>
            {canDelete && (
              <button onClick={handleDeleteReport} className="px-4 py-2 bg-white/10 text-red-200 rounded-xl text-[13px] font-semibold shadow-md hover:bg-white/20">Delete</button>
            )}
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"><HiOutlineX className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* ── FILTER MODAL (desktop) ── */}
      <ModalOverlay isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-foreground">Filter Reports</h2>
            <button onClick={() => setShowFilterModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1">
            <FilterFields />
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <BtnDefault outline onClick={resetFilter} className="h-9 px-5 rounded-xl text-sm">Reset</BtnDefault>
            <BtnDefault onClick={applyFilterModal} className="h-9 px-5 rounded-xl text-sm">Apply Filter</BtnDefault>
          </div>
        </div>
      </ModalOverlay>

      {/* ── FILTER BOTTOM SHEET (mobile) — same FilterFields component ── */}
      {showFilterSheet && (
        <div className="sm:hidden fixed inset-0 z-[400]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col"
            style={{ "--foreground": "#111827", "--muted-foreground": "#9ca3af", "--border": "#e5e7eb", "--background": "#ffffff", "--primary": "#2563eb", "--primary-foreground": "#ffffff" }}>
            <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-[17px] font-bold text-gray-900">Filter Reports</h3>
              <button onClick={() => setShowFilterSheet(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <FilterFields />
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button onClick={resetFilter} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-700 active:bg-gray-50 transition-colors">Reset</button>
              <button onClick={applyFilterSheet} className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white text-[14px] font-semibold shadow-md active:bg-blue-700 transition-colors">Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      <ReportForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} areas={areas} activities={activities} users={users} />
      <ReportForm isOpen={showEditModal} onClose={handleCloseEditModal} report={selectedAreaReport} areas={areas} activities={activities} users={users} />
      <SolveForm isOpen={showSolveModal} onClose={handleCloseSolveModal} reportId={selectedAreaReport?.id} />
      <RejectForm isOpen={showRejectModal} onClose={handleCloseRejectModal} reportId={selectedAreaReport?.id} />
      <ExportForm isOpen={showExportModal} onClose={() => setShowExportModal(false)} areas={exportAreas} activities={activities} users={exportUsers} canExportAll={canExportAll} canExportArea={canExportArea} canExportOwn={canExportOwn} assignedAreas={assignedAreas} />
    </AppLayout>
  );
}