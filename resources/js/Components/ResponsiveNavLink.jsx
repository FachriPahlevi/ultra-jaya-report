import { Link } from "@inertiajs/react"

export default function ResponsiveNavLink({ active = false, className = "", children, ...props }) {
  return (
    <Link
      {...props}
      className={`flex min-h-11 w-full items-center border-l-4 py-2 pe-4 ps-3 ${
        active ? "border-primary bg-accent text-accent-foreground" : "border-transparent text-muted-foreground hover:border-slate-300 hover:bg-muted hover:text-foreground"
      } text-[13px] font-semibold transition-colors focus:outline-none ${className}`}
    >
      {children}
    </Link>
  )
}
