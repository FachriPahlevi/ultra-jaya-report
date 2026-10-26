import { HiOutlineX } from "react-icons/hi"

const widths = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  wide: "sm:max-w-4xl",
}

export function ModalPanel({ children, width = "md", className = "" }) {
  return <div className={`flex max-h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card shadow-xl sm:max-h-[90dvh] sm:rounded-2xl ${widths[width]} ${className}`}>{children}</div>
}

export function ModalHeader({ title, description, onClose, children = null }) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
          {children}
        </div>
        {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">
        <HiOutlineX className="h-5 w-5" />
      </button>
    </header>
  )
}

export function ModalBody({ children, className = "" }) {
  return <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 ${className}`}>{children}</div>
}

export function ModalFooter({ children, className = "" }) {
  return <footer className={`grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 ${className}`}>{children}</footer>
}
