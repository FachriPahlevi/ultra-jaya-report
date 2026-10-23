import { getPhotoSizeMessage } from "@/lib/errorMessages"
import { useForm, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import InputText from "@/Components/Input/InputText"
import InputDropdown from "@/Components/Input/InputDropdown"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import PhotoEditorModal from "./PhotoEditorModal"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePhotograph, HiOutlineX } from "react-icons/hi"
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
  }, [isOpen, report, currentUser?.id, areas, activities, reset, clearErrors, setData])

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
    const file = e.target.files[0]
    if (!file) return

    const maxSizeBytes = 3 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      showStatusModal("error", "File Terlalu Besar", getPhotoSizeMessage())
      e.target.value = ""
      return
    }

    setPhotoToEdit(file)
    e.target.value = ""
  }

  const handleEditedPhoto = (file) => {
    setData("photo", file)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoToEdit(null)
  }

  const removePhoto = () => {
    setData("photo", null)
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

    if (!data.author_id) {
      showStatusModal("error", "Error", "User ID is required")
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
          showStatusModal("success", "Berhasil", report ? "Laporan berhasil diperbarui" : "Laporan berhasil dibuat")
        }
        resetForm()
        onClose()
      },
      onError: (error) => {
        const firstErr = Object.values(error || {})[0]
        showStatusModal("error", "Gagal Menyimpan", firstErr || (report ? "Gagal memperbarui laporan" : "Gagal membuat laporan"))
      },
    })
  }

  const selectedParentActivity = activities.find((activity) => String(activity.id) === String(data.type_activity))
  const selectedAreaData = areas.find((area) => String(area.id) === String(data.area_activity))
  const subAreaOptions = selectedAreaData?.sub_areas?.map((subArea) => ({ label: subArea.name, value: subArea.id })) ?? []
  const subActivityOptions =
    selectedParentActivity?.sub_activities?.map((activity) => ({
      label: activity.name,
      value: activity.id,
    })) ?? []

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px] mx-auto">
        <div className="flex justify-between sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-[-0.5px] m-0">{report ? "Edit Issue Report" : "Create Issue Report"}</h2>
          <button onClick={handleCancel} className="flex items-center gap-2 text-foreground hover:text-destructive transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            <>
              <InputText label="Name" value={currentUser?.name ?? ""} disabled />
              <input type="hidden" name="author_id" value={currentUser?.id} />
            </>

            <InputDropdown
              id="area_activity"
              label="Area Activity"
              itemList={areas.map((area) => ({
                label: area.area,
                value: area.id,
              }))}
              placeholder="Select area..."
              required
              setObject={handleAreaActivityChange}
              object={selectedArea}
              error={errors.area_activity}
            />

            <InputDropdown
              id="sub_area_id"
              label="Sub-area"
              itemList={subAreaOptions}
              placeholder={selectedAreaData ? "Pilih sub-area..." : "Pilih area terlebih dahulu"}
              required
              setObject={handleSubAreaChange}
              object={selectedSubArea}
              disabled={!selectedAreaData}
              error={errors.sub_area_id}
            />

            <InputDropdown
              id="type_activity"
              label="Type Activity"
              itemList={activities.map((act) => ({
                label: act.name,
                value: act.id,
              }))}
              placeholder="Select type..."
              required
              setObject={handleTypeActivityChange}
              object={selectedActivity}
              error={errors.type_activity}
            />

            <InputDropdown
              id="sub_activity_id"
              label="Sub Activity"
              itemList={subActivityOptions}
              placeholder={selectedParentActivity ? "Select sub activity..." : "Select parent activity first"}
              setObject={handleSubActivityChange}
              object={selectedSubActivity}
              disabled={!selectedParentActivity || subActivityOptions.length === 0}
              error={errors.sub_activity_id}
            />

            <div>
              <label htmlFor="issue" className="text-[13px] font-semibold text-foreground mb-1.5 block">
                Issue <span className="text-destructive">*</span>
              </label>
              <textarea
                id="issue"
                value={data.issue}
                onChange={handleIssueChange}
                placeholder="Describe the issue in detail..."
                className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors font-inherit resize-y min-h-[90px]"
              />
              {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
            </div>

            <InputText id="activity" label="Notes" value={data.activity} onChange={handleActivityChange} placeholder="Tambahkan catatan bila diperlukan..." error={errors.activity} />

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Photo <span className="text-[11px] text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Maks. 3 MB (format: JPG, JPEG, PNG)</p>
                </div>
                <label
                  htmlFor="photo"
                  className="inline-flex items-center justify-center gap-1.5 bg-accent text-primary px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-primary/20 w-full sm:w-auto"
                >
                  <HiOutlinePhotograph className="w-3.5 h-3.5" />
                  Pilih Foto
                </label>
                <input id="photo" type="file" accept="image/jpeg,image/png,image/jpg" capture="environment" onChange={handlePhotoChange} className="hidden" />
              </div>

              <div
                className="border-2 border-dashed rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center bg-muted transition-colors"
                style={{
                  borderColor: photoPreview ? "var(--primary)" : "var(--border)",
                }}
              >
                {photoPreview ? (
                  <div className="relative w-full">
                    <ExpandableImage src={photoPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                    <button type="button" onClick={removePhoto} className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
                      Hapus foto
                    </button>
                  </div>
                ) : report?.photo_before ? (
                  <ExpandableImage src={`/storage/${report.photo_before}`} alt="Existing" className="w-full max-h-[240px] object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <HiOutlinePhotograph className="w-9 h-9 mx-auto mb-2 opacity-40" />
                    <span className="text-[12.5px]">Click Upload to add a photo</span>
                    <span className="block text-[11px] text-muted-foreground/80 mt-0.5">Maksimal 3 MB (JPG, JPEG, PNG)</span>
                  </div>
                )}
              </div>
              {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
            </div>

            <div className="flex gap-3 mt-1">
              <BtnDefault type="button" outline onClick={handleCancel} className="w-full sm:flex-1">
                Cancel
              </BtnDefault>
              <BtnDefault type="submit" loading={processing} className="w-full">
                {processing ? (report ? "Updating..." : "Submitting...") : report ? "Update Report" : "Submit Report"}
              </BtnDefault>
            </div>
          </form>
        </div>
      </div>
      <PhotoEditorModal file={photoToEdit} onClose={() => setPhotoToEdit(null)} onSave={handleEditedPhoto} />
    </ModalOverlay>
  )
}
