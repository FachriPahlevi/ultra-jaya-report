export default function DangerButton({ className = "", disabled, children, ...props }) {
  return (
    <button
      {...props}
      className={
        `inline-flex min-h-11 items-center justify-center rounded-lg border border-destructive bg-destructive px-4 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:pointer-events-none ${
          disabled && "opacity-50"
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  )
}
