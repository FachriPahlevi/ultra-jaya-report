import { useState, useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import { useStatusModal } from "@/Components/Context/StatusModalContext";

const PER_PAGE = 10;

export function useReports(reports = []) {
    const { props } = usePage();
    const { setStatusModalProps } = useStatusModal();

    const auth = props.auth?.user;
    const permissions = auth?.permissions || [];
    const can = (p) => permissions.includes(p);

    const perms = {
        canCreate:       can("reports.create"),
        canViewAll:      can("reports.view.all"),
        canSolveOwnArea: can("reports.solve.own.area"),
        canViewOwn:      can("reports.view.own"),
        canSolve:        can("reports.solve.all") || can("reports.solve.own.area"),
        canEditAll:      can("reports.edit.all"),
        canEditOwn:      can("reports.edit.own"),
        canDeleteAll:    can("reports.delete.all"),
        canDeleteOwn:    can("reports.delete.own"),
        canExportAll:    can("reports.view.all"),
        canExportArea:   can("reports.solve.own.area"),
        canExportOwn:    can("reports.view.own"),
    };
    perms.canExport = perms.canExportAll || perms.canExportArea || perms.canExportOwn;

    const isReportEditable = (report) => {
        if (!report || report.finished_date) return false;
        if (perms.canEditAll) return true;
        return perms.canEditOwn && report.author_id === auth?.id;
    };

    const isReportDeletable = (report) => {
        if (!report || report.finished_date) return false;
        if (perms.canDeleteAll) return true;
        return perms.canDeleteOwn && report.author_id === auth?.id;
    };

    const [search, setSearch]               = useState("");
    const [statusFilter, setStatusFilter]   = useState("");
    const [typeFilter, setTypeFilter]       = useState("");
    const [areaFilter, setAreaFilter]       = useState("");
    const [roleFilter, setRoleFilter]       = useState("");
    const [dateFrom, setDateFrom]           = useState("");
    const [dateTo, setDateTo]               = useState("");
    const [myReportsOnly, setMyReportsOnly] = useState(false);
    const [page, setPage]                   = useState(1);

    const [selectedReport, setSelectedReport] = useState(null);
    const [editReport, setEditReport]         = useState(null);
    const [isReportModalOpen, setIsReportModalOpen]   = useState(false);
    const [isSolveModalOpen, setIsSolveModalOpen]     = useState(false);
    const [isExportModalOpen, setIsExportModalOpen]   = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen]   = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen]   = useState(false);
    const [reportToSolve, setReportToSolve] = useState(null);
    
    const [tempStatus, setTempStatus]             = useState("");
    const [tempType, setTempType]                 = useState("");
    const [tempArea, setTempArea]                 = useState("");
    const [tempRole, setTempRole]                 = useState("");
    const [tempDateFrom, setTempDateFrom]         = useState("");
    const [tempDateTo, setTempDateTo]             = useState("");
    const [tempMyReportsOnly, setTempMyReportsOnly] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return reports.filter((r) => {
            if (myReportsOnly && r.author_id !== auth?.id) return false;
            if (statusFilter === "pending" && r.finished_date) return false;
            if (statusFilter === "solved" && !r.finished_date) return false;
            if (typeFilter && String(r.activity_id) !== String(typeFilter)) return false;
            if (areaFilter && String(r.area_id) !== String(areaFilter)) return false;
            if (roleFilter && r.author?.role !== roleFilter) return false;
            if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
            if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
            if (q) {
                const searchable = [
                    r.issue,
                    r.activity,
                    r.author?.name,
                    r.activity_type?.name,
                    r.activity_type?.description,
                ].filter(Boolean).join(" ").toLowerCase();
                if (!searchable.includes(q)) return false;
            }
            return true;
        });
    }, [reports, search, statusFilter, typeFilter, areaFilter, roleFilter, dateFrom, dateTo, myReportsOnly, auth?.id]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
    const safePage   = Math.min(page, totalPages);
    const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const hasActiveFilter = !!(statusFilter || typeFilter || areaFilter || roleFilter || dateFrom || dateTo || myReportsOnly);

    const openFilterModal = () => {
        setTempStatus(statusFilter); setTempType(typeFilter); setTempArea(areaFilter);
        setTempRole(roleFilter); setTempDateFrom(dateFrom); setTempDateTo(dateTo);
        setTempMyReportsOnly(myReportsOnly);
        setIsFilterModalOpen(true);
    };

    const openFilterSheet = () => {
        setTempStatus(statusFilter); setTempType(typeFilter); setTempArea(areaFilter);
        setTempRole(roleFilter); setTempDateFrom(dateFrom); setTempDateTo(dateTo);
        setTempMyReportsOnly(myReportsOnly);
        setIsFilterSheetOpen(true);
    };

    const applyFilter = () => {
        setStatusFilter(tempStatus); setTypeFilter(tempType); setAreaFilter(tempArea);
        setRoleFilter(tempRole); setDateFrom(tempDateFrom); setDateTo(tempDateTo);
        setMyReportsOnly(tempMyReportsOnly);
        setPage(1);
    };

    const applyFilterModal = () => { applyFilter(); setIsFilterModalOpen(false); };
    const applyFilterSheet = () => { applyFilter(); setIsFilterSheetOpen(false); };

    const resetTempFilter = () => {
        setTempStatus(""); setTempType(""); setTempArea(""); setTempRole("");
        setTempDateFrom(""); setTempDateTo(""); setTempMyReportsOnly(false);
    };

    const resetAllFilters = () => {
        setSearch(""); setStatusFilter(""); setTypeFilter(""); setAreaFilter("");
        setRoleFilter(""); setDateFrom(""); setDateTo(""); setMyReportsOnly(false);
        setPage(1);
    };

    const handleSelectReport = (report) => {
        setSelectedReport((prev) => (prev?.id === report.id ? null : report));
    };

    const handleCloseSelected = () => setSelectedReport(null);

    const openCreateModal = () => { setEditReport(null); setIsReportModalOpen(true); };
    const openEditModal   = (report) => { setEditReport(report); setIsReportModalOpen(true); };
    const closeReportModal = () => { setIsReportModalOpen(false); setEditReport(null); };

    const openSolveModal = (report) => {
    if (!report || !report.id) {
        console.error("Cannot open solve modal: invalid report", report);
        return;
    }

    setReportToSolve(report);
    setIsSolveModalOpen(true);
};
   const closeSolveModal = () => {
    setIsSolveModalOpen(false);
    setReportToSolve(null);
};

    const confirmDelete = (report) => {
        if (!report) return;
        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: "Delete Report",
            message: `Apakah Anda yakin ingin menghapus laporan #${report.id}?`,
            button1: {
                text: "Hapus",
                onClick: () => {
                    router.delete(route("reports.destroy", report.id), {
                        preserveScroll: true,
                        onSuccess: () => {
                            setSelectedReport(null);
                            setStatusModalProps({
                                isOpen: true, type: "success", title: "Berhasil",
                                message: "Laporan berhasil dihapus", button1: { text: "OK" },
                            });
                        },
                        onError: () => {
                            setStatusModalProps({
                                isOpen: true, type: "error", title: "Gagal",
                                message: "Gagal menghapus laporan.", button1: { text: "OK" },
                            });
                        },
                    });
                },
            },
            button2: { text: "Batal" },
        });
    };

    const temp = { tempStatus, setTempStatus, tempType, setTempType, tempArea, setTempArea, tempRole, setTempRole, tempDateFrom, setTempDateFrom, tempDateTo, setTempDateTo, tempMyReportsOnly, setTempMyReportsOnly };

    return {
        auth, perms,
        isReportEditable, isReportDeletable,
        search, setSearch,
        statusFilter, typeFilter, areaFilter, roleFilter, dateFrom, dateTo, myReportsOnly,
        filtered, paginated, totalPages, page, setPage, hasActiveFilter,
        selectedReport, editReport,
        isReportModalOpen, isSolveModalOpen, isExportModalOpen, isFilterModalOpen, isFilterSheetOpen,
        setIsExportModalOpen, setIsFilterModalOpen, setIsFilterSheetOpen,
        openFilterModal, openFilterSheet,
        applyFilterModal, applyFilterSheet,
        resetTempFilter, resetAllFilters,
        handleSelectReport, handleCloseSelected,
        openCreateModal, openEditModal, closeReportModal,
        openSolveModal, closeSolveModal,
        confirmDelete,
        temp,
        reportToSolve,
    };
}