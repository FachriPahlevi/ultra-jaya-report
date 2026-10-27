import { useEffect, useRef, useState } from "react"
import { Camera, RefreshCw } from "lucide-react"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import BtnDefault from "@/Components/Button/BtnDefault"

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState("environment")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return undefined

    let cancelled = false
    const videoElement = videoRef.current
    const startCamera = async () => {
      setLoading(true)
      setError("")
      streamRef.current?.getTracks().forEach((track) => track.stop())

      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported")
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoElement) {
          videoElement.srcObject = stream
          await videoElement.play()
        }
      } catch (cameraError) {
        const permissionDenied = cameraError?.name === "NotAllowedError" || cameraError?.name === "SecurityError"
        setError(permissionDenied ? "Camera access was denied. Allow camera access in your browser settings and try again." : "The camera is unavailable or being used by another app.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoElement) videoElement.srcObject = null
    }
  }, [facingMode, isOpen])

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video?.videoHeight) return

    const maxDimension = 1600
    const ratio = Math.min(maxDimension / video.videoWidth, maxDimension / video.videoHeight, 1)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(video.videoWidth * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() }))
        onClose()
      },
      "image/jpeg",
      0.84,
    )
  }

  return (
    <ModalOverlay id="report-camera" isOpen={isOpen} onClose={onClose} layer="statusModal">
      <ModalPanel width="xl" className="h-[min(760px,100dvh)]">
        <ModalHeader title="Take photo" description="Position the subject inside the frame." onClose={onClose} />

        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-contain transition-opacity ${loading || error ? "opacity-25" : "opacity-100"}`} />
          {loading && <p className="absolute inset-0 grid place-items-center text-sm font-medium text-white/80">Starting camera...</p>}
          {error && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <p className="max-w-sm text-sm leading-6 text-white/80">{error}</p>
            </div>
          )}
        </main>

        <div className="flex shrink-0 justify-end px-4 pt-3 sm:px-6">
          <button
            type="button"
            onClick={() => setFacingMode((value) => (value === "environment" ? "user" : "environment"))}
            disabled={loading}
            aria-label="Switch camera"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" /> Switch camera
          </button>
        </div>
        <ModalFooter><BtnDefault outline fullWidth onClick={onClose} className="min-h-12">Cancel</BtnDefault><BtnDefault fullWidth onClick={capture} disabled={loading || Boolean(error)} className="min-h-12"><Camera className="h-4 w-4" /> Take photo</BtnDefault></ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
