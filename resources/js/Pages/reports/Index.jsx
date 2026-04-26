import { useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { ROUTES } from "@/lib/constants.ts";
import { formatDate } from "@/lib/format.ts";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ReportForm from "@/Components/Form/ReportForm";
import { HiOutlineX, HiOutlineChevronDown, HiOutlinePlus, HiOutlineSearch } from "react-icons/hi";

const TableHeader = ({ columns }) => (
  <thead>
    <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
      {columns.map((col, idx) => (
        <th key={idx} className="p-3 whitespace-nowrap">{col}</th>
      ))}
    </tr>
  </thead>
);

const Pagination = ({ links, onPageChange }) => {
  if (!links?.length || links.length <= 3) return null;
  
  return (
    <div className="px-6 py-4 border-t border-border flex gap-1 flex-wrap">
      {links.map((link, idx) => {
        const active = link.active;
        const hasUrl = !!link.url;
        const handleClick = () => {
          if (hasUrl) onPageChange(link.url);
        };
        
        return (
          <button
            key={idx}
            disabled={!hasUrl}
            onClick={handleClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              active 
                ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            } ${!hasUrl ? "opacity-40 cursor-default" : "cursor-pointer"}`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        );
      })}
    </div>
  );
};

const ActionBar = ({ selected, onClose, onAction, actionLabel, showAction, statusText }) => {
  if (!selected) return null;
  
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-900 text-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-xl z-[300] min-w-[340px] border border-slate-700">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">
          #{selected.id} · {selected.type ?? "-"} · {formatDate(selected.created_at)}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {statusText}
        </div>
      </div>
      {showAction && (
        <BtnDefault 
          size="sm" 
          onClick={onAction}
          className="shadow-lg"
        >
          {actionLabel}
        </BtnDefault>
      )}
      <button
        onClick={onClose}
        className="bg-white/10 hover:bg-white/20 text-white border-none w-7 h-7 rounded-lg cursor-pointer flex items-center justify-center transition-all"
        aria-label="Close"
      >
        <HiOutlineX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const ReportTable = ({ title, subtitle, reports, columns, selectedId, onSelect, renderRow, paginationLinks, onPageChange }) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow transition-shadow">
    <div className="px-6 py-5 border-b border-border bg-muted/30">
      <div className="flex items-baseline gap-2.5">
        <h3 className="text-[15px] font-bold text-foreground m-0">{title}</h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <TableHeader columns={columns} />
        <tbody>
          {reports.data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-muted-foreground text-[13px]">
                No data found
              </td>
            </tr>
          ) : (
            reports.data.map((report, i) => renderRow(report, i, selectedId, onSelect))
          )}
        </tbody>
      </table>
    </div>

    <Pagination links={paginationLinks} onPageChange={onPageChange} />
  </div>
);

export default function Index({ areaReports = { data: [], links: [], meta: {} }, areas = [], activities = [] }) {
  const [selectedAreaReport, setSelectedAreaReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const handleSelectAreaReport = (report) => {
    setSelectedAreaReport(selectedAreaReport?.id === report.id ? null : report);
  };

  const handleCloseAreaReport = () => {
    setSelectedAreaReport(null);
  };

  const handleGoSolve = () => {
    if (!selectedAreaReport) return;
    router.visit(`${ROUTES.solveReport}/${selectedAreaReport.id}`);
  };

  const handlePageChange = (url) => {
    router.visit(url, { preserveScroll: true });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSearch = () => {
    router.get("/reports", 
      { search, status: statusFilter, type: typeFilter }, 
      { preserveState: true }
    );
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    router.get("/reports", {}, { preserveState: true });
  };

  const renderAreaReportRow = (report, index, selectedId, onSelect) => {
    const isSolved = !!report.finished_date;
    const handleRowClick = () => {
      onSelect(report);
    };
    
    return (
      <tr
        key={report.id}
        className={`cursor-pointer transition-all duration-150 hover:bg-muted/50 ${
          selectedId === report.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
        } ${isSolved ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}
        onClick={handleRowClick}
      >
        <td className="p-3 text-[13px] text-muted-foreground font-semibold">{(areaReports.meta?.from ?? 0) + index}</td>
        <td className="p-3 text-[13px] text-foreground">{formatDate(report.created_at)}</td>
        <td className="p-3 text-[13px] text-foreground">{formatDate(report.updated_at)}</td>
        <td className="p-3 text-[13px] font-semibold text-foreground">{report.submitted_by ?? "-"}</td>
        <td className="p-3 text-[13px] text-foreground">
          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11.5px] font-semibold">
            {report.type ?? "-"}
          </span>
        </td>
        <td className="p-3 text-[13px] text-foreground">{report.activity ?? "-"}</td>
        <td className="p-3 text-[13px] text-foreground max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{report.issue ?? "-"}</td>
        <td className="p-3 text-[13px] text-foreground">
          {report.photo ? (
            <a href={report.photo} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium no-underline hover:underline">View</a>
          ) : <span className="text-muted-foreground">-</span>}
        </td>
        <td className="p-3 text-[13px] text-foreground">
          {report.photo_after ? (
            <a href={report.photo_after} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium no-underline hover:underline">View</a>
          ) : <span className="text-muted-foreground">-</span>}
        </td>
        <td className="p-3 text-[13px] text-foreground">
          {report.finished_date ? (
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓ {formatDate(report.finished_date)}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">● Pending</span>
          )}
        </td>
      </tr>
    );
  };

  const areaReportColumns = ["No", "Created", "Updated", "Submitted By", "Type", "Activity", "Issue", "Photo", "Photo After", "Finished"];
  
  const statusOptions = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Solved", value: "solved" }
  ];

  const typeOptions = activities.map(activity => ({
    label: activity.name || activity.description,
    value: activity.id
  }));

  return (
    <AppLayout title="Report Lists">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Report Lists</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all reports</p>
          </div>
          <BtnDefault onClick={handleOpenModal} size="md" className="gap-2 shadow-sm">
            <HiOutlinePlus className="w-4 h-4" />
            New Issue
          </BtnDefault>
        </div>

        {/* Filter Section */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <InputText
              placeholder="Search by issue or submitter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            
            <InputDropdown
              placeholder="Status"
              value={statusFilter}
              setObject={(item) => setStatusFilter(item.value)}
              itemList={statusOptions}
            />
            
            <InputDropdown
              placeholder="Type Activity"
              value={typeFilter}
              setObject={(item) => setTypeFilter(item.value)}
              itemList={typeOptions}
            />
            
            <div className="flex gap-2">
              <BtnDefault onClick={handleSearch} className="gap-2 flex-1">
                <HiOutlineSearch className="w-4 h-4" />
                Search
              </BtnDefault>
              <BtnDefault outline onClick={handleReset} className="flex-1">
                Reset
              </BtnDefault>
            </div>
          </div>
        </div>

        <ReportTable
          title="Area Report"
          subtitle="area yang ditangani akun ini (PIC)"
          reports={areaReports}
          columns={areaReportColumns}
          selectedId={selectedAreaReport?.id}
          onSelect={handleSelectAreaReport}
          renderRow={renderAreaReportRow}
          paginationLinks={areaReports.links}
          onPageChange={handlePageChange}
        />

        <ActionBar
          selected={selectedAreaReport}
          onClose={handleCloseAreaReport}
          onAction={handleGoSolve}
          actionLabel="Solve"
          showAction={!selectedAreaReport?.finished_date}
          statusText={
            selectedAreaReport?.finished_date ? (
              <span className="text-emerald-400">✓ Solved {formatDate(selectedAreaReport.finished_date)}</span>
            ) : (
              <span className="text-amber-400">● Pending</span>
            )
          }
        />

        <ReportForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          areas={areas}
          activities={activities}
        />
      </div>
    </AppLayout>
  );
}