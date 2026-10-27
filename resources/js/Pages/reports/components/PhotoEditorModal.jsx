import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Check, Circle, Crop, Focus, LineChart, Pencil, RotateCw, Square, Type, Undo2 } from "lucide-react"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import BtnDefault from "@/Components/Button/BtnDefault"

const EDITOR_TOOLS = [
  { id: "draw", label: "Draw", icon: Pencil },
  { id: "line", label: "Line", icon: LineChart },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "text", label: "Text", icon: Type },
  { id: "crop", label: "Crop", icon: Crop },
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
  const [historyCount, setHistoryCount] = useState(0)

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
    if (image && historyRef.current.at(-1) !== image) {
      historyRef.current.push(image)
      setHistoryCount(historyRef.current.length)
    }
  }

  useEffect(() => {
    if (!file) return undefined
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const canvas = canvasRef.current
      const ratio = Math.min(1600 / image.width, 1600 / image.height, 1)
      canvas.width = Math.round(image.width * ratio)
      canvas.height = Math.round(image.height * ratio)
      getContext().drawImage(image, 0, 0, canvas.width, canvas.height)
      originalRef.current = capture()
      historyRef.current = [originalRef.current]
      setHistoryCount(1)
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
    setHistoryCount(historyRef.current.length)
    restore(historyRef.current.at(-1))
  }

  const reset = () => {
    historyRef.current = [originalRef.current]
    setHistoryCount(1)
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

  const save = () =>
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) onSave(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
      },
      "image/jpeg",
      0.82,
    )

  return (
    <ModalOverlay isOpen={Boolean(file)} onClose={onClose} layer="statusModal">
      <ModalPanel width="wide" className="h-[min(820px,100dvh)]">
        <ModalHeader title="Photo editor" description="Crop or highlight important details." onClose={onClose} />
        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#050505] p-2 sm:p-6">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full touch-none shadow-2xl"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </main>
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
          {tool === "text" && (
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write text, then tap the photo"
              className="mb-3 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                aria-pressed={tool === id}
                className={`flex h-14 min-w-[58px] flex-col items-center justify-center gap-1 rounded-lg px-2 transition focus-visible:ring-2 focus-visible:ring-primary ${tool === id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-slate-200"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            ))}
            <span className="mx-1 h-7 w-px bg-border" />
            <button type="button" title="Undo last change" aria-label="Undo last change" onClick={undo} disabled={historyCount <= 1} className="grid h-11 min-w-11 place-items-center rounded-lg bg-muted text-foreground hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"><Undo2 className="h-5 w-5" /></button>
            <button type="button" title="Rotate photo" aria-label="Rotate photo" onClick={rotate} className="grid h-11 min-w-11 place-items-center rounded-lg bg-muted text-foreground hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-primary">
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Restore original photo"
              aria-label="Restore original photo"
              onClick={reset}
              className="h-11 shrink-0 rounded-lg bg-muted px-4 text-xs font-semibold text-foreground hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Reset
            </button>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Choose color ${item}`}
                  onClick={() => setColor(item)}
                  className={`h-8 w-8 shrink-0 rounded-full border-2 ${color === item ? "border-primary ring-2 ring-primary/20" : "border-slate-300"}`}
                  style={{ backgroundColor: item }}
                />
              ))}
              <input
                aria-label="Choose another color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
            <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
                className="grid h-11 w-11 place-items-center rounded-lg bg-muted text-lg text-foreground hover:bg-slate-200"
                aria-label="Zoom out"
              >
                −
              </button>
              <input aria-label="Stroke width" type="range" min="2" max="20" value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full min-w-20 accent-blue-600" />
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
                className="grid h-11 w-11 place-items-center rounded-lg bg-muted text-lg text-foreground hover:bg-slate-200"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <ModalFooter><BtnDefault outline fullWidth onClick={onClose} className="min-h-12">Cancel</BtnDefault><BtnDefault fullWidth onClick={save} className="min-h-12"><Check className="h-4 w-4" /> Use photo</BtnDefault></ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
