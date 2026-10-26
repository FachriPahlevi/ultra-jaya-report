import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Check, Circle, Crop, Focus, LineChart, Pencil, RotateCw, Square, Type, Undo2, X } from "lucide-react"
import ModalOverlay from "@/Components/Modal/ModalOverlay"

const EDITOR_TOOLS = [
  { id: "draw", label: "Gambar", icon: Pencil },
  { id: "line", label: "Garis", icon: LineChart },
  { id: "arrow", label: "Panah", icon: ArrowUpRight },
  { id: "rectangle", label: "Kotak", icon: Square },
  { id: "circle", label: "Lingkaran", icon: Circle },
  { id: "text", label: "Teks", icon: Type },
  { id: "crop", label: "Pangkas", icon: Crop },
  { id: "blur", label: "Blur", icon: Focus },
]

const COLORS = ["#ffffff", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#111827"]

export default function PhotoEditorModal({ file, onClose, onSave }) {
  const canvasRef = useRef(null)
  const originalRef = useRef(null)
  const historyRef = useRef([])
  const startRef = useRef(null)
  const baseRef = useRef(null)
  const [tool, setTool] = useState("draw")
  const [color, setColor] = useState("#ef4444")
  const [size, setSize] = useState(5)
  const [zoom, setZoom] = useState(1)
  const [text, setText] = useState("")

  const getContext = () => canvasRef.current?.getContext("2d")
  const capture = () => canvasRef.current?.toDataURL("image/png")

  const restore = (source) =>
    new Promise((resolve) => {
      const image = new Image()
      image.onload = () => {
        const canvas = canvasRef.current
        const context = getContext()
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve()
      }
      image.src = source
    })

  const addHistory = () => {
    const image = capture()
    if (image && historyRef.current.at(-1) !== image) historyRef.current.push(image)
  }

  useEffect(() => {
    if (!file) return undefined
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const canvas = canvasRef.current
      const ratio = Math.min(1280 / image.width, 860 / image.height, 1)
      canvas.width = Math.round(image.width * ratio)
      canvas.height = Math.round(image.height * ratio)
      getContext().drawImage(image, 0, 0, canvas.width, canvas.height)
      originalRef.current = capture()
      historyRef.current = [originalRef.current]
      setZoom(1)
    }
    image.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const getPosition = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height) }
  }

  const drawShape = (from, to) => {
    const context = getContext()
    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = size
    context.lineCap = "round"
    context.lineJoin = "round"
    if (tool === "line" || tool === "arrow") {
      context.beginPath()
      context.moveTo(from.x, from.y)
      context.lineTo(to.x, to.y)
      context.stroke()
      if (tool === "arrow") {
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const headSize = Math.max(14, size * 3)
        context.beginPath()
        context.moveTo(to.x, to.y)
        context.lineTo(to.x - headSize * Math.cos(angle - Math.PI / 6), to.y - headSize * Math.sin(angle - Math.PI / 6))
        context.lineTo(to.x - headSize * Math.cos(angle + Math.PI / 6), to.y - headSize * Math.sin(angle + Math.PI / 6))
        context.closePath()
        context.fill()
      }
    }
    if (tool === "rectangle") context.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y)
    if (tool === "circle") {
      context.beginPath()
      context.ellipse((from.x + to.x) / 2, (from.y + to.y) / 2, Math.abs(to.x - from.x) / 2, Math.abs(to.y - from.y) / 2, 0, 0, Math.PI * 2)
      context.stroke()
    }
  }

  const drawSelection = (from, to) => {
    const context = getContext()
    context.save()
    context.fillStyle = tool === "crop" ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.2)"
    context.fillRect(from.x, from.y, to.x - from.x, to.y - from.y)
    context.strokeStyle = "#ffffff"
    context.lineWidth = 2
    context.setLineDash([8, 6])
    context.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y)
    context.restore()
  }

  const handlePointerDown = (event) => {
    const point = getPosition(event)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (tool === "text") {
      if (!text.trim()) return
      const context = getContext()
      context.fillStyle = color
      context.font = `700 ${Math.max(18, size * 5)}px sans-serif`
      context.fillText(text.trim(), point.x, point.y)
      addHistory()
      return
    }
    startRef.current = point
    baseRef.current = capture()
  }

  const handlePointerMove = async (event) => {
    if (!startRef.current) return
    const point = getPosition(event)
    if (tool === "draw") {
      const context = getContext()
      context.strokeStyle = color
      context.lineWidth = size
      context.lineCap = "round"
      context.lineJoin = "round"
      context.beginPath()
      context.moveTo(startRef.current.x, startRef.current.y)
      context.lineTo(point.x, point.y)
      context.stroke()
      startRef.current = point
      return
    }
    await restore(baseRef.current)
    if (tool === "crop" || tool === "blur") drawSelection(startRef.current, point)
    else drawShape(startRef.current, point)
  }

  const handlePointerUp = async (event) => {
    if (!startRef.current) return
    const from = startRef.current
    const to = getPosition(event)
    startRef.current = null
    if (tool === "draw") {
      addHistory()
      return
    }
    const x = Math.min(from.x, to.x)
    const y = Math.min(from.y, to.y)
    const width = Math.abs(to.x - from.x)
    const height = Math.abs(to.y - from.y)
    if (width < 8 || height < 8) {
      await restore(baseRef.current)
      return
    }
    await restore(baseRef.current)
    if (tool === "crop") {
      const source = document.createElement("canvas")
      source.width = canvasRef.current.width
      source.height = canvasRef.current.height
      source.getContext("2d").drawImage(canvasRef.current, 0, 0)
      canvasRef.current.width = width
      canvasRef.current.height = height
      getContext().drawImage(source, x, y, width, height, 0, 0, width, height)
    } else if (tool === "blur") {
      const context = getContext()
      context.save()
      context.beginPath()
      context.rect(x, y, width, height)
      context.clip()
      context.filter = `blur(${Math.max(8, size * 2)}px)`
      context.drawImage(canvasRef.current, x, y, width, height, x, y, width, height)
      context.restore()
    } else drawShape(from, to)
    addHistory()
  }

  const undo = () => {
    if (historyRef.current.length <= 1) return
    historyRef.current.pop()
    restore(historyRef.current.at(-1))
  }

  const reset = () => {
    historyRef.current = [originalRef.current]
    restore(originalRef.current)
  }

  const rotate = () => {
    const source = document.createElement("canvas")
    source.width = canvasRef.current.width
    source.height = canvasRef.current.height
    source.getContext("2d").drawImage(canvasRef.current, 0, 0)
    canvasRef.current.width = source.height
    canvasRef.current.height = source.width
    const context = getContext()
    context.translate(canvasRef.current.width, 0)
    context.rotate(Math.PI / 2)
    context.drawImage(source, 0, 0)
    addHistory()
  }

  const save = () => canvasRef.current.toBlob((blob) => onSave(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })), "image/jpeg", 0.92)

  return (
    <ModalOverlay isOpen={Boolean(file)} onClose={onClose} layer="statusModal">
      <section className="flex h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl border border-slate-700 bg-[#101114] text-white shadow-lg sm:rounded-xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-3 sm:px-5">
          <button type="button" onClick={onClose} aria-label="Batalkan edit foto" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">Editor foto</p>
            <p className="mt-0.5 text-[10px] text-white/50">Beri penanda pada bagian penting</p>
          </div>
          <button
            type="button"
            onClick={undo}
            disabled={historyRef.current.length <= 1}
            aria-label="Batalkan perubahan terakhir"
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-30"
          >
            <Undo2 className="h-5 w-5" />
          </button>
        </header>
        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#050505] p-4 sm:p-8">
          <canvas
            ref={canvasRef}
            className="max-w-none touch-none shadow-2xl"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </main>
        <footer className="shrink-0 border-t border-white/10 bg-[#18191d] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          {tool === "text" && (
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Tulis teks, lalu ketuk foto"
              className="mb-3 h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/50"
            />
          )}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {EDITOR_TOOLS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setTool(id)}
                className={`flex h-14 min-w-[58px] flex-col items-center justify-center gap-1 rounded-xl px-2 transition ${tool === id ? "bg-blue-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-semibold">{label}</span>
              </button>
            ))}
            <span className="mx-1 h-7 w-px bg-white/15" />
            <button type="button" title="Putar foto" aria-label="Putar foto" onClick={rotate} className="grid h-11 min-w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Kembalikan ke foto awal"
              aria-label="Kembalikan ke foto awal"
              onClick={reset}
              className="h-11 shrink-0 rounded-full bg-white/10 px-4 text-xs font-semibold transition hover:bg-white/20"
            >
              Reset
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Pilih warna ${item}`}
                  onClick={() => setColor(item)}
                  className={`h-7 w-7 shrink-0 rounded-full border-2 ${color === item ? "scale-110 border-blue-500" : "border-white/30"}`}
                  style={{ backgroundColor: item }}
                />
              ))}
              <input
                aria-label="Pilih warna lain"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} className="text-lg text-white/80 hover:text-white" aria-label="Perkecil foto">
                −
              </button>
              <input aria-label="Ukuran garis" type="range" min="2" max="20" value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-20 accent-blue-600" />
              <button type="button" onClick={() => setZoom((value) => Math.min(2, value + 0.25))} className="text-lg text-white/80 hover:text-white" aria-label="Perbesar foto">
                +
              </button>
            </div>
            <button type="button" onClick={save} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500" aria-label="Gunakan foto ini">
              <Check className="h-6 w-6 stroke-[3]" />
            </button>
          </div>
        </footer>
      </section>
    </ModalOverlay>
  )
}
