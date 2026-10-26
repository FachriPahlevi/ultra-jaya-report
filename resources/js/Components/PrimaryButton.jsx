export default function PrimaryButton({ className = "", disabled, children, ...props }) {
  return (
    <button
      {...props}
      className={
        `inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ${
          disabled && "opacity-50"
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  )
}
