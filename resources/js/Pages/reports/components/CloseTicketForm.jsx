// resources/js/Components/Form/CloseTicketForm.jsx
import { useState, useEffect, useRef } from "react"
import { router } from "@inertiajs/react"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePhotograph } from "react-icons/hi"
import { Camera, ImagePlus } from "lucide-react"
import CameraCaptureModal from "./CameraCaptureModal"
import PhotoEditorModal from "./PhotoEditorModal"

export default function CloseTicketForm({ isOpen, onClose, report }) {
  const { setStatusModalProps } = useStatusModal()
  const [closePhoto, setClosePhoto] = useState(null)
  const [closePhotoPreview, setClosePhotoPreview] = useState(null)
  const [closeComment, setCloseComment] = useState("")
  const [processing, setProcessing] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [photoToEdit, setPhotoToEdit] = useState(null)
  const fileInputRef = useRef(null)
  const reportId = report?.id
  const issueText = report?.issue?.trim() || "-"
  const areaLabel = report?.area?.area ?? "-"
  const activityLabel = report?.sub_activity?.name ?? report?.activity_type?.name ?? report?.activity ?? "-"

  useEffect(() => {
    setClosePhoto(null)
    setClosePhotoPreview(null)
    setCloseComment("")
    setProcessing(false)
    setIsCameraOpen(false)
    setPhotoToEdit(null)
  }, [isOpen, reportId])

  useEffect(() => () => {
    if (closePhotoPreview) URL.revokeObjectURL(closePhotoPreview)
  }, [closePhotoPreview])

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const handleCloseSubmit = () => {
    if (!reportId) {
      showStatusModal("error", "Error", "Invalid report ID. Close and reopen this form.")
      return
    }

    if (!closeComment.trim()) {
      showStatusModal("error", "Error", "Please add a closing comment")
      return
    }

    setProcessing(true)
    const formData = new FormData()
    formData.append("close_comment", closeComment.trim())

    if (closePhoto) {
      formData.append("photo_after", closePhoto)
    }

    const url = route ? route("reports.close", reportId) : `/reports/${reportId}/close`

    router.post(url, formData, {
      onSuccess: (page) => {
        setProcessing(false)
        if (page?.props?.flash?.error) {
          return
        }
        if (!page?.props?.flash?.success) {
          showStatusModal("success", "Success", "Ticket closed successfully")
        }
        setClosePhoto(null)
        setClosePhotoPreview(null)
        setCloseComment("")
        onClose()
      },
      onError: (errors) => {
        console.error("Close ticket error:", errors)
        const errorMessage = errors.close_comment || errors.photo_after || "Unable to close the ticket"
        showStatusModal("error", "Unable to close ticket", errorMessage)
        setProcessing(false)
      },
    })
  }

  const handlePhotoSelected = (file) => {
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      showStatusModal("error", "File too large", "The original photo must be 15 MB or smaller.")
      return
    }
    setPhotoToEdit(file)
  }

  const handleEditedPhoto = (file) => {
    if (file.size > 2 * 1024 * 1024) {
      showStatusModal("error", "File too large", "The closing photo must be 2 MB or smaller after editing.")
      return
    }
    setClosePhoto(file)
    setClosePhotoPreview(URL.createObjectURL(file))
    setPhotoToEdit(null)
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={`Close ticket${reportId ? ` #${reportId}` : ""}`} description="Review the issue, add a closing note, and optionally attach evidence." onClose={onClose} />
        <ModalBody className="py-4 sm:py-5">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Area</p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">{areaLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity</p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">{activityLabel}</p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 block text-[12.5px] font-semibold text-foreground">Reported Issue</p>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-5 text-foreground whitespace-pre-wrap break-words">{issueText}</div>
            </div>

            <div>
              <label htmlFor="close_comment" className="mb-1.5 block text-[12.5px] font-semibold text-foreground">
                Closing Comment <span className="text-destructive">*</span>
              </label>
              <textarea
                id="close_comment"
                value={closeComment}
                onChange={(e) => setCloseComment(e.target.value)}
                rows={4}
                placeholder="Write the resolution, action taken, and any follow-up notes"
                className="min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-5 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="block text-[12.5px] font-semibold text-foreground">
                    Closing Photo <span className="font-normal text-muted-foreground">(optional)</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG or PNG · max. 2 MB after editing</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <BtnDefault size="sm" fullWidth onClick={() => setIsCameraOpen(true)} className="min-h-11 sm:w-auto"><Camera className="h-4 w-4" /> Take photo</BtnDefault>
                  <BtnDefault size="sm" outline fullWidth onClick={() => fileInputRef.current?.click()} className="min-h-11 sm:w-auto"><ImagePlus className="h-4 w-4" /> Choose file</BtnDefault>
                </div>
              </div>

              <input
                id="photo_after"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => {
                  handlePhotoSelected(e.target.files?.[0])
                  e.target.value = ""
                }}
                className="hidden"
              />

              <div
                className="overflow-hidden rounded-lg border border-dashed bg-muted/30"
                style={{
                  borderColor: closePhotoPreview ? "var(--primary)" : "var(--border)",
                }}
              >
                {closePhotoPreview ? (
                  <div className="relative mx-auto w-fit max-w-full"><img src={closePhotoPreview} alt="Closing evidence preview" className="block max-h-[300px] max-w-full object-contain" /><button type="button" onClick={() => { setClosePhoto(null); setClosePhotoPreview(null) }} className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-white">Remove photo</button></div>
                ) : (
                  <div className="flex min-h-24 items-center justify-center px-4 py-4 text-center text-muted-foreground">
                    <div>
                      <HiOutlinePhotograph className="mx-auto mb-1 h-6 w-6 opacity-50" />
                      <span className="text-xs">No photo added</span>
                    </div>
                  </div>
                )}
              </div>

              {closePhoto && <p className="mt-2 truncate text-xs text-muted-foreground">{closePhoto.name} · {(closePhoto.size / 1024).toFixed(0)} KB</p>}
            </div>

          </div>
        </ModalBody>
        <ModalFooter>
          <BtnDefault outline fullWidth onClick={onClose} className="min-h-12">Cancel</BtnDefault>
          <BtnDefault fullWidth onClick={handleCloseSubmit} loading={processing} className="min-h-12">{processing ? "Closing..." : "Close ticket"}</BtnDefault>
        </ModalFooter>
      </ModalPanel>
      <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handlePhotoSelected} />
      <PhotoEditorModal file={photoToEdit} onClose={() => setPhotoToEdit(null)} onSave={handleEditedPhoto} />
    </ModalOverlay>
  )
}
