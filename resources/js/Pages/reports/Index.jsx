import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { formatDate } from "@/lib/format.ts";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import ReportForm from "@/Components/Form/ReportForm";
import SolveForm from "@/Components/Form/SolveForm";
import ExportForm from "@/Components/Form/ExportReportForm";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import ReportCard from "@/Components/Card/ReportCard";
import Pagination from "@/Components/Navigation/Pagination";
import { useReports } from "@/hooks/useReports";
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi";
import { SlidersHorizontal, File, FileDown, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";

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
    const fullText = lines.join(" ");
    const isLong = fullText.length > 120 || lines.length > maxLines;
    const shortText = fullText.slice(0, 120);
    return (
        <div>
            <p className="text-[12.5px] text-foreground leading-snug whitespace-pre-wrap break-words">
                {expanded || !isLong ? fullText : shortText + "…"}
            </p>
            {isLong && (
                <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline">
                    {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                </button>
            )}
        </div>
    );
};

function FilterFields({ temp, statusOptions, filterAreaOptions, roleOptions, typeOptions }) {
    return (
        <div className="flex flex-col gap-5">
            <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Periode</label>
                <div className="flex items-center gap-2">
                    <input type="date" value={temp.tempDateFrom} onChange={(e) => temp.setTempDateFrom(e.target.value)}
                        className="flex-1 border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    <span className="text-muted-foreground text-sm font-medium shrink-0">–</span>
                    <input type="date" value={temp.tempDateTo} onChange={(e) => temp.setTempDateTo(e.target.value)}
                        className="flex-1 border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground bg-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
            </div>
            <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Status</label>
                <div className="flex gap-2">
                    {statusOptions.map((opt) => (
                        <button key={opt.value} onClick={() => temp.setTempStatus(opt.value)}
                            className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-all
                                ${temp.tempStatus === opt.value
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-foreground border-border hover:border-primary/40"}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            <InputDropdown label="Area" defaultValue={temp.tempArea} setObject={(item) => temp.setTempArea(item.value)} itemList={filterAreaOptions} />
            <InputDropdown label="Role" defaultValue={temp.tempRole} setObject={(item) => temp.setTempRole(item.value)} itemList={roleOptions} />
            <InputDropdown label="Activity" defaultValue={temp.tempType} setObject={(item) => temp.setTempType(item.value)} itemList={typeOptions} />
            <label className="flex items-center justify-between gap-3 cursor-pointer py-0.5">
                <span className="text-[13px] text-foreground font-medium">Show only my reports</span>
                <div onClick={() => temp.setTempMyReportsOnly((v) => !v)}
                    className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${temp.tempMyReportsOnly ? "bg-primary" : "bg-border"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${temp.tempMyReportsOnly ? "left-5" : "left-1"}`} />
                </div>
            </label>
        </div>
    );
}

function ReportDetailModal({ report, isOpen, onClose, onSolve, onEdit, onDelete, perms, isReportEditable, isReportDeletable, formatDate }) {
    if (!report) return null;
    
    return (
        <ModalOverlay id="report-detail-modal" isOpen={isOpen} onClose={onClose}>
            <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-xl border border-slate-700">
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">Report Details</h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    <div>
                        <div className="text-sm text-slate-400">Activity</div>
                        <div className="text-white font-medium mt-1">
                         {report.activity ?? "-"}
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-sm text-slate-400">Created At</div>
                        <div className="text-white mt-1">{formatDate(report.created_at)}</div>
                    </div>
                    
                    {report.author && (
                        <div>
                            <div className="text-sm text-slate-400">Submitted By</div>
                            <div className="text-white mt-1">{report.author.name}</div>
                            {report.author.role && (
                                <div className="text-xs text-slate-400 mt-0.5">{report.author.role}</div>
                            )}
                        </div>
                    )}
                    
                    {report.area && (
                        <div>
                            <div className="text-sm text-slate-400">Area</div>
                            <div className="text-white mt-1">{report.area.area}</div>
                        </div>
                    )}
                    
                    {report.issue && (
                        <div>
                            <div className="text-sm text-slate-400">Issue</div>
                            <div className="text-white mt-1 text-sm">{report.issue}</div>
                        </div>
                    )}
                    
                    <div>
                        <div className="text-sm text-slate-400">Status</div>
                        <div className="mt-1">
                            {report.finished_date ? (
                                <div className="text-emerald-400 flex items-center gap-2">
                                    <span>✓ Solved</span>
                                    <span className="text-sm">{formatDate(report.finished_date)}</span>
                                </div>
                            ) : (
                                <div className="text-amber-400 flex items-center gap-2">
                                    <span>● Pending</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
                    {perms.canSolve && !report.finished_date && (
                        <button
                            onClick={() => {
                                onSolve(report);
                                onClose();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Solve
                        </button>
                    )}
                    {isReportEditable(report) && (
                        <button
                            onClick={() => {
                                onEdit(report);
                                onClose();
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    {isReportDeletable(report) && (
                        <button
                            onClick={() => {
                                onDelete(report);
                                onClose();
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}

export default function Index({ reports = [], areas = [], activities = [], users = [] }) {
    const { props } = usePage();
    const r = useReports(reports);

    const assignedAreas  = areas.filter((a) => a.pic_user_id == r.auth?.id);
    const exportAreas    = r.perms.canExportAll ? areas : r.perms.canExportArea ? assignedAreas : [];
    const exportUsers    = r.perms.canExportAll ? users : [];
    const areaOfAuthUser = areas.find((a) => a.pic_user_id == r.auth?.id);

    const statusOptions = [
        { label: "All Statuses", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Finished", value: "solved" },
    ];
    const typeOptions = [{ label: "All Activities", value: "" }, ...activities.map((a) => ({ label: a.description, value: String(a.id) }))];
    const areaOptions = [{ label: "All Areas", value: "" }, ...areas.map((a) => ({ label: a.area, value: String(a.id) }))];
    const roleOptions = r.perms.canViewAll || r.perms.canSolveOwnArea
        ? [{ label: "All Roles", value: "" }, { label: "Admin", value: "Admin" }, { label: "Supervisor", value: "Supervisor" }, { label: "Manager", value: "Manager" }]
        : [{ label: "User", value: "User" }];
    const filterAreaOptions = r.perms.canViewAll
        ? areaOptions
        : r.perms.canSolveOwnArea
            ? [{ label: "All Assigned Areas", value: "" }, ...assignedAreas.map((a) => ({ label: a.area, value: String(a.id) }))]
            : areaOptions;

    const { temp } = r;

    return (
        <AppLayout title="Report Lists">
            <Head><title>Reports</title></Head>

            <div className="hidden sm:flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground tracking-[-0.3px]">Report Lists</h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage and track all reports</p>
                    </div>
                    {r.perms.canCreate && (
                        <BtnDefault onClick={r.openCreateModal} size="md" className="gap-2 px-4 h-10 rounded-xl shadow-sm">
                            <HiOutlinePlus className="w-4 h-4" />New Issue
                        </BtnDefault>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-[220px]">
                            <InputText placeholder="Search by issue, submitter, or activity..." value={r.search} onChange={(e) => { r.setSearch(e.target.value); r.setPage(1); }} />
                        </div>
                        <BtnDefault outline onClick={r.openFilterModal} className="gap-2 h-10 rounded-xl px-4">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filter
                            {r.hasActiveFilter && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">!</span>
                            )}
                        </BtnDefault>
                        {r.perms.canExport && (
                            <BtnDefault outline onClick={() => r.setIsExportModalOpen(true)} className="gap-2 h-10 px-4 rounded-xl text-sm">
                                <File className="w-4 h-4" />Export Dokumen
                            </BtnDefault>
                        )}
                    </div>
                    {r.hasActiveFilter && (
                        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground font-medium">Filters active</span>
                            <button onClick={r.resetAllFilters} className="text-xs text-primary font-semibold hover:underline ml-1">Clear all</button>
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                        <h3 className="text-[15px] font-bold text-foreground">
                            Report <span>{areaOfAuthUser?.area ?? "Area"}</span>
                        </h3>
                        <span className="text-[12px] text-muted-foreground">{r.filtered.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/40 text-left border-b border-border">
                                    {["No", "Date", "Submitted By", "Area", "Issue", "Type Activity", "Before", "After", "Status", "Finished"].map((col) => (
                                        <th key={col} className="px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wide uppercase whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {r.paginated.length === 0 ? (
                                    <tr><td colSpan={10} className="py-16 text-center text-muted-foreground text-[13px]">No data found</td></tr>
                                ) : (
                                    r.paginated.map((report, index) => {
                                        const isSolved = !!report.finished_date;
                                        const isSelected = r.selectedReport?.id === report.id;
                                        return (
                                            <tr key={report.id} onClick={() => r.handleSelectReport(report)}
                                                className={`cursor-pointer transition-all duration-150 align-top hover:bg-muted/50
                                                    ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}
                                                    ${isSolved ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}>
                                                <td className="px-4 py-3.5 text-[12px] text-muted-foreground font-semibold w-10">
                                                    {(r.page - 1) * 10 + index + 1}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <p className="text-[12.5px] font-medium text-foreground">{formatDate(report.created_at)}</p>
                                                    {report.updated_at !== report.created_at && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">↑ {formatDate(report.updated_at)}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <p className="text-[12.5px] font-semibold text-foreground">{report.author?.name ?? "-"}</p>
                                                    {report.author?.role && <p className="text-[11px] text-muted-foreground mt-0.5">{report.author.role}</p>}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="inline-block px-2 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-semibold">{report.area?.area ?? "-"}</span>
                                                </td>
                                                <td className="px-4 py-3.5 min-w-[220px]">
                                                    {report.issue && <RichText text={report.issue} maxLines={3} />}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11.5px] font-semibold whitespace-nowrap">
                                                        {report.activity_type?.name ?? "-"}
                                                    </span>
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
                                                    {isSolved
                                                        ? <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11.5px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Finished</span>
                                                        : <span className="inline-flex items-center gap-1.5 text-amber-600 text-[11.5px] font-semibold bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Pending</span>}
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
                    <Pagination page={r.page} totalPages={r.totalPages} onChange={r.setPage} />
                </div>

                <ReportDetailModal
                    report={r.selectedReport}
                    isOpen={!!r.selectedReport}
                    onClose={r.handleCloseSelected}
                    onSolve={(report) => r.openSolveModal(report)}
                    onEdit={(report) => r.openEditModal(report)}
                    onDelete={(report) => r.confirmDelete(report)}
                    perms={r.perms}
                    isReportEditable={r.isReportEditable}
                    isReportDeletable={r.isReportDeletable}
                    formatDate={formatDate}
                />
            </div>

            <div className="flex sm:hidden flex-col gap-0 bg-[#f5f6fa] min-h-screen -mx-4 -mt-4">
                <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-[17px] font-bold text-gray-900 leading-tight">Report Lists</h2>
                            <p className="text-[12px] text-gray-400 mt-0.5">Manage reports</p>
                        </div>
                        {r.perms.canCreate && (
                            <button onClick={r.openCreateModal} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md active:scale-95 transition-transform">
                                <HiOutlinePlus className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                            </svg>
                            <input type="text" placeholder="Search reports..." value={r.search}
                                onChange={(e) => { r.setSearch(e.target.value); r.setPage(1); }}
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 text-[13px] text-gray-800 placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <button onClick={r.openFilterSheet} className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600 active:bg-gray-200 transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />Filter
                            {r.hasActiveFilter && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">!</span>
                            )}
                        </button>
                        {r.perms.canExport && (
                            <button onClick={() => r.setIsExportModalOpen(true)} className="flex items-center px-3 py-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors">
                                <FileDown className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {r.hasActiveFilter && (
                        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                            <span className="text-[11px] text-gray-500">Filters active</span>
                            <button onClick={r.resetAllFilters} className="text-[11px] text-blue-600 font-semibold">Clear all</button>
                        </div>
                    )}
                </div>

                <div className="px-3 py-3 flex flex-col gap-2.5">
                    {r.paginated.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-20 h-20 mb-4 opacity-30">
                                <svg viewBox="0 0 80 80" fill="none"><path d="M40 8L72 24V56L40 72L8 56V24L40 8Z" stroke="#94a3b8" strokeWidth="2" fill="none" /><path d="M40 8V72M8 24L72 56M72 24L8 56" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                            </div>
                            <p className="text-[16px] font-semibold text-gray-700 mb-1">Belum ada laporan</p>
                            <p className="text-[13px] text-gray-400 mb-5">Laporan yang Anda buat akan muncul di sini.</p>
                            {r.perms.canCreate && (
                                <button onClick={r.openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold shadow-md active:scale-95 transition-transform">
                                    <HiOutlinePlus className="w-4 h-4" />Buat Laporan Baru
                                </button>
                            )}
                        </div>
                    ) : (
                        r.paginated.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                isSelected={r.selectedReport?.id === report.id}
                                onSelect={r.handleSelectReport}
                                onDelete={() => r.confirmDelete(report)}
                                showDelete={r.isReportDeletable(report)}
                            />
                        ))
                    )}
                </div>

                <Pagination page={r.page} totalPages={r.totalPages} onChange={r.setPage} center />

                <ReportDetailModal
                    report={r.selectedReport}
                    isOpen={!!r.selectedReport}
                    onClose={r.handleCloseSelected}
                    onSolve={(report) => r.openSolveModal(report)}
                    onEdit={(report) => r.openEditModal(report)}
                    onDelete={(report) => r.confirmDelete(report)}
                    perms={r.perms}
                    isReportEditable={r.isReportEditable}
                    isReportDeletable={r.isReportDeletable}
                    formatDate={formatDate}
                />
            </div>

            <ModalOverlay isOpen={r.isFilterModalOpen} onClose={() => r.setIsFilterModalOpen(false)}>
                <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                        <h2 className="text-base font-bold text-foreground">Filter Reports</h2>
                        <button onClick={() => r.setIsFilterModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="px-6 py-5 overflow-y-auto flex-1">
                        <FilterFields temp={temp} statusOptions={statusOptions} filterAreaOptions={filterAreaOptions} roleOptions={roleOptions} typeOptions={typeOptions} />
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
                        <BtnDefault outline onClick={r.resetTempFilter} className="h-9 px-5 rounded-xl text-sm">Reset</BtnDefault>
                        <BtnDefault onClick={r.applyFilterModal} className="h-9 px-5 rounded-xl text-sm">Apply Filter</BtnDefault>
                    </div>
                </div>
            </ModalOverlay>

            {r.isFilterSheetOpen && (
                <div className="sm:hidden fixed inset-0 z-[400]">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => r.setIsFilterSheetOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col"
                        style={{ "--foreground": "#111827", "--muted-foreground": "#9ca3af", "--border": "#e5e7eb", "--background": "#ffffff", "--primary": "#2563eb", "--primary-foreground": "#ffffff" }}>
                        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100 shrink-0">
                            <h3 className="text-[17px] font-bold text-gray-900">Filter Reports</h3>
                            <button onClick={() => r.setIsFilterSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-5 py-4 overflow-y-auto flex-1">
                            <FilterFields temp={temp} statusOptions={statusOptions} filterAreaOptions={filterAreaOptions} roleOptions={roleOptions} typeOptions={typeOptions} />
                        </div>
                        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
                            <button onClick={r.resetTempFilter} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-700 active:bg-gray-50 transition-colors">Reset</button>
                            <button onClick={r.applyFilterSheet} className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white text-[14px] font-semibold shadow-md active:bg-blue-700 transition-colors">Apply Filter</button>
                        </div>
                    </div>
                </div>
            )}

            <ReportForm
                isOpen={r.isReportModalOpen}
                onClose={r.closeReportModal}
                report={r.editReport}
                areas={areas}
                activities={activities}
                users={users}
            />
            <SolveForm
                isOpen={r.isSolveModalOpen}
                onClose={r.closeSolveModal}
                reportId={r.reportToSolve?.id}
            />
            <ExportForm
                isOpen={r.isExportModalOpen}
                onClose={() => r.setIsExportModalOpen(false)}
                areas={exportAreas}
                activities={activities}
                users={exportUsers}
                canExportAll={r.perms.canExportAll}
                canExportArea={r.perms.canExportArea}
                canExportOwn={r.perms.canExportOwn}
                assignedAreas={assignedAreas}
            />
        </AppLayout>
    );
}