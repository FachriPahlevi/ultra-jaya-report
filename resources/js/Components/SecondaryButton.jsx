export default function SecondaryButton({ type = "button", className = "", disabled, children, ...props }) {
  return (
    <button
      {...props}
      type={type}
      className={
        `inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-slate-400 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ${
          disabled && "opacity-50"
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  )
}
