import { useEffect, useRef, useState } from "react"
import { Camera, RefreshCw, X } from "lucide-react"
import ModalOverlay from "@/Components/Modal/ModalOverlay"

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
        setError(permissionDenied ? "Izin kamera ditolak. Izinkan akses kamera dari pengaturan browser, lalu coba lagi." : "Kamera tidak tersedia atau sedang digunakan aplikasi lain.")
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
      <section
        aria-labelledby="report-camera-title"
        className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-slate-950 text-white sm:h-[min(760px,calc(100dvh-2rem))] sm:rounded-2xl sm:border sm:border-white/10"
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-5">
          <div>
            <h2 id="report-camera-title" className="text-base font-semibold">
              Ambil foto
            </h2>
            <p className="mt-0.5 text-xs text-white/60">Posisikan objek di dalam bingkai.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kamera"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/75 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-contain transition-opacity ${loading || error ? "opacity-25" : "opacity-100"}`} />
          {loading && <p className="absolute inset-0 grid place-items-center text-sm font-medium text-white/80">Menyiapkan kamera...</p>}
          {error && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <p className="max-w-sm text-sm leading-6 text-white/80">{error}</p>
            </div>
          )}
        </main>

        <footer
          className="grid shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-4 border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-6"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={() => setFacingMode((value) => (value === "environment" ? "user" : "environment"))}
            disabled={loading}
            aria-label="Ganti kamera"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={loading || Boolean(error)}
            aria-label="Ambil foto sekarang"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40"
          >
            <Camera className="h-7 w-7" />
          </button>
          <span aria-hidden="true" />
        </footer>
      </section>
    </ModalOverlay>
  )
}
