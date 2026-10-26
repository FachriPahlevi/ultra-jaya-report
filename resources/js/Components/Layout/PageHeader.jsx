export default function PageHeader({ title, actions = null, mobileAction = null }) {
  return (
    <header className="border-b border-border pb-3 sm:pb-5">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
        {mobileAction && <div className="shrink-0 md:hidden">{mobileAction}</div>}
        {actions && <div className="hidden min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 md:flex">{actions}</div>}
      </div>
    </header>
  )
}
