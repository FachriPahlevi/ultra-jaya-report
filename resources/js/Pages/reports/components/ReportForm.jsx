import { useForm, usePage } from "@inertiajs/react"
import { useState, useEffect, useRef } from "react"
import InputDropdown from "@/Components/Input/InputDropdown"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import PhotoEditorModal from "./PhotoEditorModal"
import CameraCaptureModal from "./CameraCaptureModal"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePhotograph } from "react-icons/hi"
import { Camera, FileImage, ImagePlus } from "lucide-react"
import { createEmptyReportForm, createReportForm, createReportSelections } from "@/Pages/reports/utils/reportForm"

export default function ReportForm({ isOpen, onClose, areas = [], activities = [], report = null }) {
  const { setStatusModalProps } = useStatusModal()
  const { auth } = usePage().props
  const currentUser = auth?.user
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoToEdit, setPhotoToEdit] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedSubArea, setSelectedSubArea] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [selectedSubActivity, setSelectedSubActivity] = useState(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const galleryInputRef = useRef(null)
  const permissions = new Set(currentUser?.permissions ?? [])
  const canSubmit = report ? report.can?.update === true : permissions.has("reports.create")
  const hasGlobalScope = ["reports.view.all", "reports.solve.all", "reports.edit.all", "reports.delete.all"].some((permission) => permissions.has(permission))
  const hasManagerScope = !hasGlobalScope && permissions.has("reports.review.area")
  const hasSupervisorScope = !hasGlobalScope && permissions.has("reports.solve.own.area")

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(createEmptyReportForm(currentUser?.id))

  useEffect(() => {
    if (!isOpen) return

    const form = createReportForm(report, currentUser?.id)
    const selections = createReportSelections(report, areas, activities)

    reset()
    clearErrors()
    setData(form)
    setSelectedArea(selections.area)
    setSelectedSubArea(selections.subArea)
    setSelectedActivity(selections.activity)
    setSelectedSubActivity(selections.subActivity)
    setPhotoPreview(null)
    setPhotoToEdit(null)
    setIsCameraOpen(false)
  }, [isOpen, report, currentUser?.id, areas, activities, reset, clearErrors, setData])

  useEffect(
    () => () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview)
    },
    [photoPreview],
  )

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 15 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      showStatusModal("error", "File too large", "The original photo must be 15 MB or smaller. It will be compressed after editing.")
      e.currentTarget.value = ""
      return
    }

    setPhotoToEdit(file)
    e.currentTarget.value = ""
  }

  const handleEditedPhoto = (file) => {
    setData("photo", file)
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoToEdit(null)
  }

  const removePhoto = () => {
    setData("photo", null)
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  const handleTypeActivityChange = (item) => {
    setData("type_activity", item.value)
    setData("sub_activity_id", "")
    setSelectedActivity(item)
    setSelectedSubActivity(null)
  }

  const handleSubActivityChange = (item) => {
    setData("sub_activity_id", item.value)
    setSelectedSubActivity(item)
  }

  const handleAreaActivityChange = (item) => {
    setData("area_activity", item.value)
    setData("sub_area_id", "")
    setSelectedArea(item)
    setSelectedSubArea(null)
  }
  const handleSubAreaChange = (item) => {
    setData("sub_area_id", item.value)
    setSelectedSubArea(item)
  }

  const handleActivityChange = (e) => {
    setData("activity", e.target.value)
  }

  const handleIssueChange = (e) => {
    setData("issue", e.target.value)
  }

  const resetForm = () => {
    reset()
    clearErrors()
    setData(createEmptyReportForm(currentUser?.id))
    setSelectedArea(null)
    setSelectedSubArea(null)
    setSelectedActivity(null)
    setSelectedSubActivity(null)
    setPhotoPreview(null)
    setPhotoToEdit(null)
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      showStatusModal("error", "Access denied", "You do not have permission to save this report.")
      return
    }

    const action = report ? put : post
    const url = report ? `/reports/${report.id}` : "/reports"
    action(url, {
      forceFormData: true,
      onSuccess: (page) => {
        if (page?.props?.flash?.error) {
          return
        }
        if (!page?.props?.flash?.success) {
          showStatusModal("success", "Success", report ? "Report updated successfully" : "Report created successfully")
        }
        resetForm()
        onClose()
      },
      onError: (error) => {
        const firstErr = Object.values(error || {})[0]
        showStatusModal("error", "Unable to save", firstErr || (report ? "Unable to update the report" : "Unable to create the report"))
      },
    })
  }

  const scopedAreas = !report && (hasManagerScope || hasSupervisorScope) ? areas.filter((area) => area.is_in_current_user_scope) : areas
  const scopedActivities =
    !report && (hasManagerScope || hasSupervisorScope)
      ? activities.filter((activity) => activity.is_in_current_user_scope || activity.sub_activities?.some((child) => child.is_in_current_user_scope))
      : activities
  const selectedParentActivity = scopedActivities.find((activity) => String(activity.id) === String(data.type_activity))
  const selectedAreaData = scopedAreas.find((area) => String(area.id) === String(data.area_activity))
  const canReviewSelection = hasManagerScope && selectedAreaData?.is_in_review_scope && selectedParentActivity?.is_in_current_user_scope
  const availableSubAreas =
    hasSupervisorScope && !report && !selectedAreaData?.is_in_review_scope ? selectedAreaData?.sub_areas?.filter((subArea) => subArea.is_in_current_user_scope) : selectedAreaData?.sub_areas
  const subAreaOptions = availableSubAreas?.map((subArea) => ({ label: subArea.name, value: subArea.id })) ?? []
  const availableSubActivities =
    hasSupervisorScope && !report && !canReviewSelection ? selectedParentActivity?.sub_activities?.filter((activity) => activity.is_in_current_user_scope) : selectedParentActivity?.sub_activities
  const subActivityOptions =
    availableSubActivities?.map((activity) => ({
      label: `${activity.name}${activity.category ? ` · ${activity.category}` : ""}`,
      value: activity.id,
    })) ?? []
  const selectedCategory =
    report && String(report.sub_activity_id) === String(data.sub_activity_id)
      ? report.category_snapshot
      : (availableSubActivities?.find((activity) => String(activity.id) === String(data.sub_activity_id))?.category ?? "ISSUE")
  const reporterName = report?.author?.name ?? currentUser?.name ?? "-"
  const reporterRole = report?.author?.role ?? currentUser?.roles?.[0] ?? "USER"
  const photoFileName = data.photo?.name ?? ""
  const photoFileSize = data.photo?.size ?? 0
  const formatFileSize = (bytes) => {
    if (!bytes) return "–"
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
      <ModalPanel width="xl" className="h-[100dvh] sm:h-auto">
        <ModalHeader title={report ? "Edit report" : "Create report"} description="Add the location, activity, and supporting documentation." onClose={handleCancel} />
        <ModalBody>
          <form id="report-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reporter</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">{reporterName}</p>
              </div>
              <span className="shrink-0 rounded-md bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">{String(reporterRole).replaceAll("_", " ")}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputDropdown
                id="area_activity"
                label="Area"
                itemList={scopedAreas.map((area) => ({ label: area.area, value: area.id }))}
                placeholder="Select an area"
                required
                setObject={handleAreaActivityChange}
                object={selectedArea}
                error={errors.area_activity}
              />

              <InputDropdown
                id="sub_area_id"
                label="Sub-area"
                itemList={subAreaOptions}
                placeholder={selectedAreaData ? "Select a sub-area" : "Select an area first"}
                required
                setObject={handleSubAreaChange}
                object={selectedSubArea}
                disabled={!selectedAreaData}
                error={errors.sub_area_id}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputDropdown
                id="type_activity"
                label="Activity"
                itemList={scopedActivities.map((act) => ({ label: act.name, value: act.id }))}
                placeholder="Select an activity"
                required
                setObject={handleTypeActivityChange}
                object={selectedActivity}
                error={errors.type_activity}
              />

              <InputDropdown
                id="sub_activity_id"
                label="Sub-activity"
                required
                itemList={subActivityOptions}
                placeholder={selectedParentActivity ? "Select a sub-activity" : "Select an activity first"}
                setObject={handleSubActivityChange}
                object={selectedSubActivity}
                disabled={!selectedParentActivity || subActivityOptions.length === 0}
                error={errors.sub_activity_id}
              />
            </div>

            <div>
              <label htmlFor="issue" className="text-[13px] font-semibold text-foreground mb-1.5 block">
                {selectedCategory === "REPORT" ? "Observation" : "Finding"} <span className="text-destructive">*</span>
              </label>
              <textarea
                id="issue"
                value={data.issue}
                onChange={handleIssueChange}
                placeholder={
                  selectedCategory === "REPORT" ? "Describe the condition or inspection result..." : "Describe the issue, its location, and its impact..."
                }
                className="min-h-[112px] w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
            </div>

            <div>
              <label htmlFor="activity" className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Additional notes
              </label>
              <textarea
                id="activity"
                value={data.activity}
                onChange={handleActivityChange}
                placeholder="Add supporting details if needed"
                className="min-h-[92px] w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {errors.activity && <p className="mt-1 text-xs text-destructive">{errors.activity}</p>}
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Photo documentation <span className="text-[11px] text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">JPG or PNG · compressed automatically before saving</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Camera className="h-4 w-4" />
                    Take photo
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Choose file
                  </button>
                </div>
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhotoChange} className="hidden" aria-label="Choose a photo from your device" />
              </div>

              {photoPreview ? (
                <div className="overflow-hidden rounded-xl border border-primary/40 bg-muted/20">
                  <div className="relative mx-auto w-fit max-w-full">
                    <ExpandableImage src={photoPreview} alt={photoFileName || "Report photo preview"} className="block h-auto max-h-[360px] max-w-full w-auto object-contain" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute right-2 top-2 min-h-8 rounded-lg bg-black/65 px-2.5 text-xs font-medium text-white outline-none transition-colors hover:bg-black focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Remove photo
                    </button>
                  </div>
                  <div className="flex min-w-0 items-center gap-3 border-t border-border bg-card px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileImage className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground" title={photoFileName}>
                        {photoFileName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Compressed JPEG · {formatFileSize(photoFileSize)}</p>
                    </div>
                  </div>
                </div>
              ) : report?.photo_before ? (
                <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                  <div className="mx-auto w-fit max-w-full">
                    <ExpandableImage src={`/storage/${report.photo_before}`} alt="Report documentation" className="block h-auto max-h-[360px] max-w-full w-auto object-contain" />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[140px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
                  <div className="py-6 text-center text-muted-foreground">
                    <HiOutlinePhotograph className="mx-auto mb-2 h-9 w-9 opacity-40" />
                    <span className="text-[13px] font-semibold text-foreground">No photo added</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">Take a photo or choose one from your device</span>
                  </div>
                </div>
              )}
              {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault type="button" outline fullWidth onClick={handleCancel} className="min-h-12">
            Cancel
          </BtnDefault>
          <BtnDefault form="report-form" type="submit" fullWidth loading={processing} disabled={!canSubmit} className="min-h-12">
            {processing ? "Saving..." : report ? "Save changes" : "Submit report"}
          </BtnDefault>
        </ModalFooter>
      </ModalPanel>
      <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={setPhotoToEdit} />
      <PhotoEditorModal file={photoToEdit} onClose={() => setPhotoToEdit(null)} onSave={handleEditedPhoto} />
    </ModalOverlay>
  )
}
