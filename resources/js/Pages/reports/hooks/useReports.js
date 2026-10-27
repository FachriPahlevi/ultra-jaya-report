import { useState, useMemo, useEffect, useRef } from "react"
import { router, usePage } from "@inertiajs/react"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { useAuthorization } from "@/hooks/useAuthorization"

const DEFAULT_PER_PAGE = 10

export function useReports(reports = []) {
  const { props, url } = usePage()
  const { setStatusModalProps } = useStatusModal()
  const { can } = useAuthorization()

  const auth = props.auth?.user

  const perms = {
    canCreate: can("reports.create"),
    canViewAll: can("reports.view.all") || can("reports.solve.all") || can("reports.edit.all") || can("reports.delete.all"),
    canReviewArea: can("reports.review.area"),
    canSolveOwnArea: can("reports.solve.own.area"),
    canViewOwn: can("reports.view.own") || can("reports.create") || can("reports.edit.own") || can("reports.delete.own"),
    canSolve: can("reports.solve.all") || can("reports.solve.own.area"),
    canEditAll: can("reports.edit.all"),
    canEditOwn: can("reports.edit.own"),
    canDeleteAll: can("reports.delete.all"),
    canDeleteOwn: can("reports.delete.own"),
    canExportAll: can("reports.view.all") || can("reports.solve.all") || can("reports.edit.all") || can("reports.delete.all"),
    canExportArea: can("reports.solve.own.area") || can("reports.review.area"),
    canExportOwn: can("reports.view.own") || can("reports.create") || can("reports.edit.own") || can("reports.delete.own"),
  }
  perms.canExport = can("reports.export") && (perms.canExportAll || perms.canExportArea || perms.canExportOwn)

  const isReportEditable = (report) => report?.can?.update === true
  const isReportDeletable = (report) => report?.can?.delete === true

  const [search, setSearch] = useState("")
  const initialFilters = new URLSearchParams(url.split("?")[1] || "")
  const initialStatus = initialFilters.get("status")
  const initialArea = initialFilters.get("area_id")
  const initialDate = (name) => /^\d{4}-\d{2}-\d{2}$/.test(initialFilters.get(name) || "") ? initialFilters.get(name) : ""
  const [statusFilter, setStatusFilter] = useState(() => ["open", "closed", "report"].includes(initialStatus) ? [initialStatus] : [])
  const [typeFilter, setTypeFilter] = useState([])
  const [areaFilter, setAreaFilter] = useState(() => /^\d+$/.test(initialArea || "") ? [initialArea] : [])
  const [roleFilter, setRoleFilter] = useState([])
  const [authorFilter, setAuthorFilter] = useState([])
  const [subAreaFilter, setSubAreaFilter] = useState([])
  const [photoFilter, setPhotoFilter] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [dateFrom, setDateFrom] = useState(() => initialDate("date_from"))
  const [dateTo, setDateTo] = useState(() => initialDate("date_to"))
  const [myReportsOnly, setMyReportsOnly] = useState(false)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [page, setPage] = useState(1)

  const [selectedReport, setSelectedReport] = useState(null)
  const openedDeepLink = useRef(null)
  useEffect(() => {
    const reportId = Number(props.initialReportId)
    if (!reportId) {
      openedDeepLink.current = null
      return
    }
    if (openedDeepLink.current !== reportId) {
      const report = reports.find((item) => item.id === reportId)
      if (report) {
        setSelectedReport(report)
        openedDeepLink.current = reportId
      }
    }
  }, [props.initialReportId, reports])
  const [editReport, setEditReport] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [ticketToClose, setTicketToClose] = useState(null)

  const [tempStatus, setTempStatus] = useState([])
  const [tempType, setTempType] = useState([])
  const [tempArea, setTempArea] = useState([])
  const [tempRole, setTempRole] = useState([])
  const [tempAuthor, setTempAuthor] = useState([])
  const [tempSubArea, setTempSubArea] = useState([])
  const [tempPhoto, setTempPhoto] = useState("")
  const [tempSort, setTempSort] = useState("latest")
  const [tempDateFrom, setTempDateFrom] = useState("")
  const [tempDateTo, setTempDateTo] = useState("")
  const [tempMyReportsOnly, setTempMyReportsOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return reports
      .filter((r) => {
        if (myReportsOnly && r.author_id !== auth?.id) return false
        const displayStatus = r.category_snapshot === "REPORT" ? "report" : String(r.status)
        if (statusFilter.length && !statusFilter.includes(displayStatus)) return false
        if (typeFilter.length && !typeFilter.includes(String(r.activity_id))) return false
        if (areaFilter.length && !areaFilter.includes(String(r.area_id))) return false
        if (roleFilter.length && !roleFilter.includes(String(r.author?.role))) return false
        if (authorFilter.length && !authorFilter.includes(String(r.author_id))) return false
        if (subAreaFilter.length && !subAreaFilter.includes(String(r.sub_area_id))) return false
        if (photoFilter === "before" && !r.photo_before) return false
        if (photoFilter === "after" && !r.photo_after) return false
        if (photoFilter === "complete" && (!r.photo_before || !r.photo_after)) return false
        if (dateFrom && new Date(r.created_at) < new Date(`${dateFrom}T00:00:00.000Z`)) return false
        if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59.999Z`)) return false
        if (q) {
          const searchable = [r.issue, r.activity, r.author?.name, r.activity_type?.name, r.activity_type?.description, r.sub_activity?.name, r.sub_activity?.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!searchable.includes(q)) return false
        }
        return true
      })
      .sort((left, right) => {
        if (sortBy === "oldest") return new Date(left.created_at) - new Date(right.created_at)
        if (sortBy === "area-asc") return (left.area?.area || "").localeCompare(right.area?.area || "", "id")
        if (sortBy === "activity-asc") return (left.sub_activity?.name || left.activity_type?.name || "").localeCompare(right.sub_activity?.name || right.activity_type?.name || "", "id")
        if (sortBy === "reporter-asc") return (left.author?.name || "").localeCompare(right.author?.name || "", "id")
        return new Date(right.created_at) - new Date(left.created_at)
      })
  }, [reports, search, statusFilter, typeFilter, areaFilter, roleFilter, authorFilter, subAreaFilter, photoFilter, sortBy, dateFrom, dateTo, myReportsOnly, auth?.id])

  const effectivePerPage = perPage === -1 ? Math.max(filtered.length, 1) : perPage
  const totalPages = Math.ceil(filtered.length / effectivePerPage) || 1
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * effectivePerPage, safePage * effectivePerPage)

  const hasActiveFilter = !!(
    statusFilter.length ||
    typeFilter.length ||
    areaFilter.length ||
    roleFilter.length ||
    authorFilter.length ||
    subAreaFilter.length ||
    photoFilter ||
    sortBy !== "latest" ||
    dateFrom ||
    dateTo ||
    myReportsOnly
  )

  const openFilterModal = () => {
    setTempStatus(statusFilter)
    setTempType(typeFilter)
    setTempArea(areaFilter)
    setTempRole(roleFilter)
    setTempAuthor(authorFilter)
    setTempSubArea(subAreaFilter)
    setTempPhoto(photoFilter)
    setTempSort(sortBy)
    setTempDateFrom(dateFrom)
    setTempDateTo(dateTo)
    setTempMyReportsOnly(myReportsOnly)
    setIsFilterModalOpen(true)
  }

  const openFilterSheet = () => {
    setTempStatus(statusFilter)
    setTempType(typeFilter)
    setTempArea(areaFilter)
    setTempRole(roleFilter)
    setTempAuthor(authorFilter)
    setTempSubArea(subAreaFilter)
    setTempPhoto(photoFilter)
    setTempSort(sortBy)
    setTempDateFrom(dateFrom)
    setTempDateTo(dateTo)
    setTempMyReportsOnly(myReportsOnly)
    setIsFilterSheetOpen(true)
  }

  const applyFilter = () => {
    setStatusFilter(tempStatus)
    setTypeFilter(tempType)
    setAreaFilter(tempArea)
    setRoleFilter(tempRole)
    setAuthorFilter(tempAuthor)
    setSubAreaFilter(tempSubArea)
    setPhotoFilter(tempPhoto)
    setSortBy(tempSort)
    setDateFrom(tempDateFrom)
    setDateTo(tempDateTo)
    setMyReportsOnly(tempMyReportsOnly)
    setPage(1)
  }

  const applyFilterModal = () => {
    applyFilter()
    setIsFilterModalOpen(false)
  }
  const applyFilterSheet = () => {
    applyFilter()
    setIsFilterSheetOpen(false)
  }

  const resetTempFilter = () => {
    setTempStatus([])
    setTempType([])
    setTempArea([])
    setTempRole([])
    setTempAuthor([])
    setTempSubArea([])
    setTempPhoto("")
    setTempSort("latest")
    setTempDateFrom("")
    setTempDateTo("")
    setTempMyReportsOnly(false)
  }

  const resetAllFilters = () => {
    setSearch("")
    setStatusFilter([])
    setTypeFilter([])
    setAreaFilter([])
    setRoleFilter([])
    setAuthorFilter([])
    setSubAreaFilter([])
    setPhotoFilter("")
    setSortBy("latest")
    setDateFrom("")
    setDateTo("")
    setMyReportsOnly(false)
    setPage(1)
  }

  const handleSelectReport = (report) => {
    setSelectedReport((prev) => (prev?.id === report.id ? null : report))
  }

  const handleCloseSelected = () => setSelectedReport(null)

  const openCreateModal = () => {
    setEditReport(null)
    setIsReportModalOpen(true)
  }
  const openEditModal = (report) => {
    setEditReport(report)
    setIsReportModalOpen(true)
  }
  const closeReportModal = () => {
    setIsReportModalOpen(false)
    setEditReport(null)
  }

  const openCloseTicketModal = (report) => {
    if (!report || !report.id) {
      return
    }

    setTicketToClose(report)
    setIsCloseTicketModalOpen(true)
  }

  const closeCloseTicketModal = () => {
    setIsCloseTicketModalOpen(false)
    setTicketToClose(null)
  }

  const confirmDelete = (report) => {
    if (!report) return
    setStatusModalProps({
      isOpen: true,
      type: "warning",
      title: "Delete Report",
      message: `Delete report #${report.id}? This action cannot be undone.`,
      button1: {
        text: "Delete",
        onClick: () => {
          router.delete(route("reports.destroy", report.id), {
            preserveScroll: true,
            onSuccess: () => {
              setSelectedReport(null)
              setStatusModalProps({
                isOpen: true,
                type: "success",
                title: "Success",
                message: "Report deleted successfully",
                button1: { text: "OK" },
              })
            },
            onError: () => {
              setStatusModalProps({
                isOpen: true,
                type: "error",
                title: "Error",
                message: "Unable to delete the report.",
                button1: { text: "OK" },
              })
            },
          })
        },
      },
      button2: { text: "Cancel" },
    })
  }

  const temp = {
    tempStatus,
    setTempStatus,
    tempType,
    setTempType,
    tempArea,
    setTempArea,
    tempRole,
    setTempRole,
    tempAuthor,
    setTempAuthor,
    tempSubArea,
    setTempSubArea,
    tempPhoto,
    setTempPhoto,
    tempSort,
    setTempSort,
    tempDateFrom,
    setTempDateFrom,
    tempDateTo,
    setTempDateTo,
    tempMyReportsOnly,
    setTempMyReportsOnly,
  }

  return {
    auth,
    perms,
    isReportEditable,
    isReportDeletable,
    search,
    setSearch,
    perPage,
    setPerPage,
    statusFilter,
    typeFilter,
    areaFilter,
    roleFilter,
    dateFrom,
    dateTo,
    myReportsOnly,
    filtered,
    paginated,
    totalPages,
    page,
    setPage,
    hasActiveFilter,
    selectedReport,
    editReport,
    isReportModalOpen,
    isCloseTicketModalOpen,
    isExportModalOpen,
    isFilterModalOpen,
    isFilterSheetOpen,
    setIsExportModalOpen,
    setIsFilterModalOpen,
    setIsFilterSheetOpen,
    openFilterModal,
    openFilterSheet,
    applyFilterModal,
    applyFilterSheet,
    resetTempFilter,
    resetAllFilters,
    handleSelectReport,
    handleCloseSelected,
    openCreateModal,
    openEditModal,
    closeReportModal,
    openCloseTicketModal,
    closeCloseTicketModal,
    confirmDelete,
    temp,
    ticketToClose,
  }
}
