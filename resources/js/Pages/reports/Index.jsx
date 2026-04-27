import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { formatDate } from "@/lib/format.ts";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ReportForm from "@/Components/Form/ReportForm";
import SolveForm from "@/Components/Form/SolveForm";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX, HiOutlinePlus } from "react-icons/hi";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import { BsFileExcelFill } from "react-icons/bs";
import { FaFilePdf } from "react-icons/fa";

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
        <BtnDefault size="sm" onClick={onAction} className="shadow-lg">
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
          {reports.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-muted-foreground text-[13px]">
                No data found
              </td>
            </tr>
          ) : (
            reports.map((report, i) => renderRow(report, i, selectedId, onSelect))
          )}
        </tbody>
      </table>
    </div>

    <Pagination links={paginationLinks} onPageChange={onPageChange} />
  </div>
);

export default function Index({ areaReports = { data: [], links: [], meta: {} }, areas = [], activities = [] }) {
  const { setStatusModalProps } = useStatusModal();
  const [selectedAreaReport, setSelectedAreaReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredReports = useMemo(() => {
    let reports = areaReports.data;
    
    if (search) {
      reports = reports.filter(report => 
        report.issue?.toLowerCase().includes(search.toLowerCase()) ||
        report.author?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter === "pending") {
      reports = reports.filter(report => !report.finished_date);
    } else if (statusFilter === "solved") {
      reports = reports.filter(report => report.finished_date);
    }
    
    if (typeFilter) {
      reports = reports.filter(report => report.activity_id === parseInt(typeFilter));
    }
    
    return reports;
  }, [areaReports.data, search, statusFilter, typeFilter]);

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    });
  };

  const handleSelectAreaReport = (report) => {
    setSelectedAreaReport(selectedAreaReport?.id === report.id ? null : report);
  };

  const handleCloseAreaReport = () => {
    setSelectedAreaReport(null);
  };

  const handleSolveClick = () => {
    setShowSolveModal(true);
  };

  const handleCloseSolveModal = () => {
    setShowSolveModal(false);
    setSelectedAreaReport(null);
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

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
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
        <td className="p-3 text-[13px] text-muted-foreground font-semibold">{index + 1}</td>
        <td className="p-3 text-[13px] text-foreground">{formatDate(report.created_at)}</td>
        <td className="p-3 text-[13px] text-foreground">{formatDate(report.updated_at)}</td>
        <td className="p-3 text-[13px] font-semibold text-foreground">{report.author?.name ?? "-"}</td>
        <td className="p-3 text-[13px] text-foreground">
          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11.5px] font-semibold">
            {report.activity?.description ?? report.activity?.name ?? "-"}
          </span>
        </td>
        <td className="p-3 text-[13px] text-foreground">
          {typeof report.activity === 'object' 
            ? (report.activity?.description || report.activity?.name || "-")
            : (report.activity || "-")}
        </td>
        <td className="p-3 text-[13px] text-foreground max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{report.issue ?? "-"}</td>
        <td className="p-3 text-[13px] text-foreground">
          {report.photo_before ? (
            <ExpandableImage 
              src={`/storage/${report.photo_before}`}
              alt="Photo before"
              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : <span className="text-muted-foreground">-</span>}
        </td>
        <td className="p-3 text-[13px] text-foreground">
          {report.photo_after ? (
            <ExpandableImage 
              src={`/storage/${report.photo_after}`}
              alt="Photo after"
              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            />
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
    label: activity.description,
    value: activity.id.toString()
  }));

  return (
    <AppLayout title="Report Lists">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-[-0.3px]">
              Report Lists
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track all reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <BtnDefault
              onClick={handleOpenModal}
              size="md"
              className="gap-2 px-4 h-10 rounded-xl shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              New Issue
            </BtnDefault>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <InputText
                placeholder="Search by issue or submitter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

              <BtnDefault
                outline
                onClick={handleReset}
                className="h-10 rounded-xl"
              >
                Reset
              </BtnDefault>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-2">
                <BtnDefault
                  outline
                  className="gap-2 h-9 px-3 rounded-xl"
                >
                  <FaFilePdf className="w-4 h-4" />
                  <span className="w-4 h-4 bg-blue-500/10 rounded flex items-center justify-center text-blue-600 text-xs font-bold">
                    PDF
                  </span>
                  Export PDF
                </BtnDefault>

                <BtnDefault
                  outline
                  className="gap-2 h-9 px-3 rounded-xl"
                >
                  <BsFileExcelFill className="w-4 h-4" />
                  <span className="w-4 h-4 bg-blue-500/10 rounded flex items-center justify-center text-blue-600 text-xs font-bold">
                    XLS
                  </span>
                  Export Excel
                </BtnDefault>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <ReportTable
            title="Area Report"
            subtitle=""
            reports={filteredReports}
            columns={areaReportColumns}
            selectedId={selectedAreaReport?.id}
            onSelect={handleSelectAreaReport}
            renderRow={renderAreaReportRow}
            paginationLinks={areaReports.links}
            onPageChange={handlePageChange}
          />
        </div>

        <ActionBar
          selected={selectedAreaReport}
          onClose={handleCloseAreaReport}
          onAction={handleSolveClick}
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

        <SolveForm
          isOpen={showSolveModal}
          onClose={handleCloseSolveModal}
          reportId={selectedAreaReport?.id}
        />
      </div>
    </AppLayout>
  );
}