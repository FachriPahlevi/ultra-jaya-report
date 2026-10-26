import { Link } from "@inertiajs/react"

export default function NavLink({ active = false, className = "", children, ...props }) {
  return (
    <Link
      {...props}
      className={
        "inline-flex min-h-11 items-center border-b-2 px-1 text-[13px] font-semibold transition-colors focus:outline-none " +
        (active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground") +
        className
      }
    >
      {children}
    </Link>
  )
}
