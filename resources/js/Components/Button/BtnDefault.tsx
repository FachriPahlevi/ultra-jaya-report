import { Link } from "@inertiajs/react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type BtnDefaultProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  href?: string | null
  loading?: boolean
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  outline?: boolean
}

export default function BtnDefault({
  children,
  href = null,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  outline = false,
  className = "",
  disabled = false,
  type = "button",
  ...props
}: BtnDefaultProps) {
  const sizes = { sm: "min-h-9 px-3 text-xs", md: "min-h-11 px-4 text-[13px]", lg: "min-h-12 px-5 text-sm" }
  const variants = {
    primary: "border-primary bg-primary text-primary-foreground hover:bg-blue-700",
    secondary: "border-border bg-muted text-foreground hover:bg-slate-200",
    outline: "border-border bg-card text-foreground hover:border-slate-400 hover:bg-muted",
    ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
    danger: "border-destructive bg-destructive text-destructive-foreground hover:bg-red-700",
  }
  const resolvedVariant = outline ? "outline" : variant
  const classes = `inline-flex items-center justify-center rounded-lg border font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${variants[resolvedVariant]} ${fullWidth ? "w-full" : "w-fit"} ${className}`
  const content = (
    <span className="flex items-center justify-center gap-2">
      {loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button {...props} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {content}
    </button>
  )
}
