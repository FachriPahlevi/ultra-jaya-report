import { getPhotoSizeMessage } from "@/lib/errorMessages"
import { useForm, usePage } from "@inertiajs/react"
import { useState, useEffect, useRef } from "react"
import InputText from "@/Components/Input/InputText"
import InputDropdown from "@/Components/Input/InputDropdown"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import ExpandableImage from "@/Components/UI/ExpandableImage"
import PhotoEditorModal from "./PhotoEditorModal"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePhotograph, HiOutlineX } from "react-icons/hi"
import { Camera, ImagePlus, Info } from "lucide-react"
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
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

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
    const file = e.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 3 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      showStatusModal("error", "File Terlalu Besar", getPhotoSizeMessage())
      e.currentTarget.value = ""
      return
    }

    setPhotoToEdit(file)
    e.currentTarget.value = ""
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
      label: `${activity.name}${activity.category ? ` · ${activity.category}` : ""}`,
      value: activity.id,
    })) ?? []

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
      <div className="mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-primary">LAPORAN LAPANGAN</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">{report ? "Perbarui laporan" : "Buat laporan baru"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Lengkapi lokasi, aktivitas, dan dokumentasi kejadian.</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Tutup form laporan"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-card p-4 sm:p-6">
          <form id="report-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputText label="Nama pelapor" value={currentUser?.name ?? ""} disabled />
            <input type="hidden" name="author_id" value={currentUser?.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputDropdown
                id="area_activity"
                label="Area"
                itemList={areas.map((area) => ({ label: area.area, value: area.id }))}
                placeholder="Pilih area"
                required
                setObject={handleAreaActivityChange}
                object={selectedArea}
                error={errors.area_activity}
              />

              <InputDropdown
                id="sub_area_id"
                label="Sub-area"
                itemList={subAreaOptions}
                placeholder={selectedAreaData ? "Pilih sub-area" : "Pilih area terlebih dahulu"}
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
                label="Aktivitas"
                itemList={activities.map((act) => ({ label: act.name, value: act.id }))}
                placeholder="Pilih aktivitas"
                required
                setObject={handleTypeActivityChange}
                object={selectedActivity}
                error={errors.type_activity}
              />

              <InputDropdown
                id="sub_activity_id"
                label="Sub-aktivitas"
                itemList={subActivityOptions}
                placeholder={selectedParentActivity ? "Pilih sub-aktivitas" : "Pilih aktivitas terlebih dahulu"}
                setObject={handleSubActivityChange}
                object={selectedSubActivity}
                disabled={!selectedParentActivity || subActivityOptions.length === 0}
                error={errors.sub_activity_id}
              />
            </div>

            <div>
              <label htmlFor="issue" className="text-[13px] font-semibold text-foreground mb-1.5 block">
                Kendala <span className="text-destructive">*</span>
              </label>
              <textarea
                id="issue"
                value={data.issue}
                onChange={handleIssueChange}
                placeholder="Jelaskan kendala yang ditemukan, lokasi spesifik, dan dampaknya..."
                className="min-h-[112px] w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
            </div>

            <InputText
              id="activity"
              label="Catatan tambahan"
              value={data.activity}
              onChange={handleActivityChange}
              placeholder="Tambahkan informasi pendukung bila diperlukan"
              error={errors.activity}
            />

            <div className="border-t border-border pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Dokumentasi foto <span className="text-[11px] text-muted-foreground font-normal">(opsional)</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Maks. 3 MB (format: JPG, JPEG, PNG)</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Camera className="h-4 w-4" />
                    Ambil foto
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Pilih file
                  </button>
                </div>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" aria-label="Ambil foto menggunakan kamera belakang" />
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhotoChange} className="hidden" aria-label="Pilih foto dari perangkat" />
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
                    <span className="text-[13px] font-semibold text-foreground">Belum ada dokumentasi</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">Ambil foto langsung atau pilih dari perangkat</span>
                  </div>
                )}
              </div>
              {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Foto dapat dipangkas, diberi penanda, teks, atau disamarkan sebelum digunakan.</p>
              </div>
            </div>
          </form>
        </div>
        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <BtnDefault type="button" outline onClick={handleCancel} className="min-h-12">
            Batal
          </BtnDefault>
          <BtnDefault form="report-form" type="submit" loading={processing} className="min-h-12">
            {processing ? "Menyimpan..." : report ? "Simpan perubahan" : "Kirim laporan"}
          </BtnDefault>
        </footer>
      </div>
      <PhotoEditorModal file={photoToEdit} onClose={() => setPhotoToEdit(null)} onSave={handleEditedPhoto} />
    </ModalOverlay>
  )
}
