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
import ExportForm from "@/Components/Form/ExportReportForm";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import { SlidersHorizontal, FileDown, ChevronRight, File, X } from "lucide-react";
import Pagination from "@/Components/Navigation/Pagination";
import ReportCard from "@/Components/Card/ReportCard";

export default function Index({ areaReports = { data: [], links: [], meta: {} }, areas = [], activities = [], users = [], filters = {} }) {
  const { props } = usePage();
  const { setStatusModalProps } = useStatusModal();
  const permissions = props.auth?.user?.permissions || [];
  const auth = props.auth?.user;
  const [selectedAreaReport, setSelectedAreaReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
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
  const canExport = can("reports.view.all");

  const reports = areaReports.data ?? [];

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

      router.get(route("reports.index"), params, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 300);

    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [search, status, type, area, role, dateFrom, dateTo, myReportsOnly]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setType("");
    setArea("");
    setRole("");
    setDateFrom("");
    setDateTo("");
    setMyReportsOnly(false);
    router.get(route("reports.index"), {}, { preserveScroll: true });
  };

  const openFilterModal = () => {
    setTempStatus(status);
    setTempType(type);
    setTempArea(area);
    setTempRole(role);
    setTempDateFrom(dateFrom);
    setTempDateTo(dateTo);
    setTempMyReportsOnly(myReportsOnly);
    setShowFilterModal(true);
  };

  const applyFilterModal = () => {
    setStatus(tempStatus);
    setType(tempType);
    setArea(tempArea);
    setRole(tempRole);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setMyReportsOnly(tempMyReportsOnly);
    setShowFilterModal(false);
  };

  const resetFilterModal = () => {
    setTempStatus("");
    setTempType("");
    setTempArea("");
    setTempRole("");
    setTempDateFrom("");
    setTempDateTo("");
    setTempMyReportsOnly(false);
  };

  const openFilterSheet = () => {
    setTempStatus(status);
    setTempType(type);
    setShowFilterSheet(true);
  };

  const applyFilterSheet = () => {
    setStatus(tempStatus);
    setType(tempType);
    setShowFilterSheet(false);
  };

  const resetFilterSheet = () => {
    setTempStatus("");
    setTempType("");
  };

  const activeFilterChips = [
    ...(dateFrom || dateTo
      ? [
          {
            key: "periode",
            label: `Periode: ${dateFrom || "..."} - ${dateTo || "..."}`,
            clear: () => {
              setDateFrom("");
              setDateTo("");
            },
          },
        ]
      : []),
    ...(status ? [{ key: "status", label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, clear: () => setStatus("") }] : []),
    ...(area ? [{ key: "area", label: `Area: ${areas.find((a) => a.id == area)?.area ?? area}`, clear: () => setArea("") }] : []),
    ...(role ? [{ key: "role", label: `Role: ${role}`, clear: () => setRole("") }] : []),
    ...(type ? [{ key: "type", label: `Activity: ${activities.find((a) => a.id == type)?.description ?? type}`, clear: () => setType("") }] : []),
    ...(myReportsOnly ? [{ key: "my_reports", label: "My Reports Only", clear: () => setMyReportsOnly(false) }] : []),
  ];

  const tableColumns = ["No", "Created", "Updated", "Submitted By", "Type", "Activity", "Issue", "Photo", "Photo After", "Status", "Finished"];

  const typeOptions = [{ label: "All Activities", value: "" }, ...activities.map((a) => ({ label: a.description, value: a.id.toString() }))];
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Finished", value: "solved" },
  ];
  const areaOptions = [{ label: "All Areas", value: "" }, ...areas.map((a) => ({ label: a.area, value: a.id.toString() }))];
  const roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Admin", value: "Admin" },
    { label: "Supervisor", value: "Supervisor" },
    { label: "Manager", value: "Manager" },
  ];

  const handleSelectAreaReport = (report) => setSelectedAreaReport(selectedAreaReport?.id === report.id ? null : report);
  const handleCloseAreaReport = () => setSelectedAreaReport(null);
  const handleSolveClick = () => setShowSolveModal(true);
  const handleCloseSolveModal = () => {
    setShowSolveModal(false);
    setSelectedAreaReport(null);
  };
  const areaOfAuthUser = areas.find((a) => a.pic_user_id == auth.id);

  return (
    <AppLayout title="Report Lists">
      <Head>
        <title>Reports</title>
      </Head>

      <div className="hidden sm:flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-[-0.3px]">Report Lists</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all reports</p>
          </div>
          {canCreate && (
            <BtnDefault onClick={() => setIsModalOpen(true)} size="md" className="gap-2 px-4 h-10 rounded-xl shadow-sm">
              <HiOutlinePlus className="w-4 h-4" />
              New Issue
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
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </BtnDefault>
              <BtnDefault outline onClick={() => setShowExportModal(true)} className="gap-2 h-10 px-4 rounded-xl text-sm">
                <File className="w-4 h-4" />
                Export Dokumen
              </BtnDefault>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md px-2.5 py-1 text-xs font-semibold">
                  {chip.label}
                  <button onClick={chip.clear} className="hover:text-primary/70 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button onClick={handleReset} className="text-xs text-primary font-semibold hover:underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <h3 className="text-[15px] font-bold text-foreground m-0">
              Report <span>{areaOfAuthUser?.area ?? "Area"}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
                  {tableColumns.map((col, idx) => (
                    <th key={idx} className="p-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length} className="py-12 text-center text-muted-foreground text-[13px]">
                      No data found
                    </td>
                  </tr>
                ) : (
                  reports.map((report, index) => {
                    const isSolved = !!report.finished_date;
                    return (
                      <tr
                        key={report.id}
                        onClick={() => handleSelectAreaReport(report)}
                        className={`cursor-pointer transition-all duration-150 hover:bg-muted/50
                          ${selectedAreaReport?.id === report.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}
                          ${isSolved ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}
                      >
                        <td className="p-3 text-[13px] text-muted-foreground font-semibold">{index + 1}</td>
                        <td className="p-3 text-[13px] text-foreground whitespace-nowrap">{formatDate(report.created_at)}</td>
                        <td className="p-3 text-[13px] text-foreground whitespace-nowrap">{formatDate(report.updated_at)}</td>
                        <td className="p-3 text-[13px] font-semibold text-foreground">{report.author?.name ?? "-"}</td>
                        <td className="p-3 text-[13px] text-foreground">
                          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11.5px] font-semibold whitespace-nowrap">
                            {report.activity_type?.name ?? "-"}
                          </span>
                        </td>
                        <td className="p-3 text-[13px] text-foreground">{report.activity || "-"}</td>
                        <td className="p-3 text-[13px] text-foreground max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{report.issue ?? "-"}</td>
                        <td className="p-3">
                          {report.photo_before ? (
                            <ExpandableImage src={`/storage/${report.photo_before}`} alt="Photo before" className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
                          ) : (
                            <span className="text-muted-foreground text-[13px]">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {report.photo_after ? (
                            <ExpandableImage src={`/storage/${report.photo_after}`} alt="Photo after" className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
                          ) : (
                            <span className="text-muted-foreground text-[13px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[13px]">
                          {report.finished_date ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Finished
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[13px]">
                          {report.finished_date ? (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold whitespace-nowrap">{formatDate(report.finished_date)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">–</span>
                          )}
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

        {selectedAreaReport && !selectedAreaReport.finished_date && canSolve && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-xl z-[300] min-w-[340px] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                #{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"} · {formatDate(selectedAreaReport.created_at)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-amber-400">● Pending</span>
              </div>
            </div>
            <BtnDefault size="sm" onClick={handleSolveClick} className="shadow-lg">
              Solve
            </BtnDefault>
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center">
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {selectedAreaReport && selectedAreaReport.finished_date && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-xl z-[300] min-w-[340px] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                #{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"} · {formatDate(selectedAreaReport.created_at)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-400">✓ Solved {formatDate(selectedAreaReport.finished_date)}</span>
              </div>
            </div>
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center">
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 text-[13px] text-gray-800 placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button onClick={openFilterSheet} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600 active:bg-gray-200 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
            {canExport && (
              <button onClick={() => setShowExportModal(true)} className="flex items-center px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors">
                <FileDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-3 py-3 flex flex-col gap-2.5">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 mb-4 opacity-30">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 8L72 24V56L40 72L8 56V24L40 8Z" stroke="#94a3b8" strokeWidth="2" fill="none" />
                  <path d="M40 8V72M8 24L72 56M72 24L8 56" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                  <circle cx="55" cy="18" r="4" fill="#cbd5e1" />
                  <path d="M52 26l6-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[16px] font-semibold text-gray-700 mb-1">Belum ada laporan</p>
              <p className="text-[13px] text-gray-400 mb-5">Laporan yang Anda buat akan muncul di sini.</p>
              {canCreate && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold shadow-md active:scale-95 transition-transform">
                  <HiOutlinePlus className="w-4 h-4" />
                  Buat Laporan Baru
                </button>
              )}
            </div>
          ) : (
            reports.map((report) => <ReportCard key={report.id} report={report} isSelected={selectedAreaReport?.id === report.id} onSelect={handleSelectAreaReport} />)
          )}
        </div>

        <Pagination links={areaReports.links} center />

        {selectedAreaReport && !selectedAreaReport.finished_date && canSolve && (
          <div className="fixed bottom-20 left-3 right-3 bg-slate-800 text-white rounded-2xl py-3 px-4 flex items-center gap-3 shadow-xl z-[300] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                #{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pending
                </span>
              </div>
            </div>
            <button onClick={handleSolveClick} className="px-4 py-2 bg-blue-600 rounded-xl text-[13px] font-semibold shadow-md active:bg-blue-700 transition-colors">
              Solve
            </button>
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        )}

        {selectedAreaReport && selectedAreaReport.finished_date && (
          <div className="fixed bottom-20 left-3 right-3 bg-slate-800 text-white rounded-2xl py-3 px-4 flex items-center gap-3 shadow-xl z-[300] border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                #{selectedAreaReport.id} · {selectedAreaReport.activity_type?.description ?? "-"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Solved {formatDate(selectedAreaReport.finished_date)}
                </span>
              </div>
            </div>
            <button onClick={handleCloseAreaReport} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <ModalOverlay isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
        <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-foreground">Filter Reports</h2>
            <button onClick={() => setShowFilterModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Periode</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={tempDateFrom}
                    onChange={(e) => setTempDateFrom(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="date"
                    value={tempDateTo}
                    onChange={(e) => setTempDateTo(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <InputDropdown label="Role" value={tempRole} setObject={(item) => setTempRole(item.value)} itemList={roleOptions} />
              </div>

              <div>
                <InputDropdown label="Activity" value={tempType} setObject={(item) => setTempType(item.value)} itemList={typeOptions} />
              </div>

              <div>
                <InputDropdown label="Status" value={tempStatus} setObject={(item) => setTempStatus(item.value)} itemList={statusOptions} />
              </div>

              <div>
                <InputDropdown label="Area" value={tempArea} setObject={(item) => setTempArea(item.value)} itemList={areaOptions} />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempMyReportsOnly}
                    onChange={(e) => setTempMyReportsOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-[13px] text-foreground">Show only my reports</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <BtnDefault outline onClick={resetFilterModal} className="h-9 px-5 rounded-xl text-sm">
              Reset
            </BtnDefault>
            <BtnDefault onClick={applyFilterModal} className="h-9 px-5 rounded-xl text-sm">
              Apply Filter
            </BtnDefault>
          </div>
        </div>
      </ModalOverlay>

      {showFilterSheet && (
        <div className="sm:hidden fixed inset-0 z-[400]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pt-3 pb-8">
              <h3 className="text-[17px] font-bold text-gray-900 mb-5">Filter Reports</h3>
              <div className="mb-5">
                <p className="text-[13px] font-semibold text-gray-700 mb-2.5">Status</p>
                <div className="bg-gray-50 rounded-2xl p-1 divide-y divide-gray-100">
                  {[
                    { label: "All Status", value: "" },
                    { label: "Pending", value: "pending", dot: "bg-amber-400" },
                    { label: "Finished", value: "solved", dot: "bg-emerald-500" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 px-3 py-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${tempStatus === opt.value ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                        {tempStatus === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input type="radio" className="sr-only" value={opt.value} checked={tempStatus === opt.value} onChange={() => setTempStatus(opt.value)} />
                      <span className="flex items-center gap-2 text-[13px] text-gray-800">
                        {opt.dot && <span className={`w-2 h-2 rounded-full ${opt.dot}`} />}
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <p className="text-[13px] font-semibold text-gray-700 mb-2.5">Activity</p>
                <div className="relative">
                  <select
                    value={tempType}
                    onChange={(e) => setTempType(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={resetFilterSheet} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-700 active:bg-gray-50 transition-colors">
                  Reset
                </button>
                <button onClick={applyFilterSheet} className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white text-[14px] font-semibold shadow-md active:bg-blue-700 transition-colors">
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} areas={areas} activities={activities} users={users} />
      <SolveForm isOpen={showSolveModal} onClose={handleCloseSolveModal} reportId={selectedAreaReport?.id} />
      <ExportForm isOpen={showExportModal} onClose={() => setShowExportModal(false)} areas={areas} activities={activities} users={users} />
    </AppLayout>
  );
}