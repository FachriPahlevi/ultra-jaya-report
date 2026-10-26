import { HiChevronLeft, HiChevronRight } from "react-icons/hi"

export default function ServerPagination({ links = [], from = 0, to = 0, total = 0, onNavigate }) {
  if (links.length <= 3) return null

  const currentIndex = links.findIndex((link) => link.active)
  const visibleLinks = links.filter((link, index) => index === 0 || index === links.length - 1 || link.active || Math.abs(index - currentIndex) <= 1)

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-muted-foreground">
        Menampilkan {from ?? 0}–{to ?? 0} dari {total} data
      </p>
      <nav aria-label="Paginasi" className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
        {visibleLinks.map((link) => {
          const index = links.indexOf(link)
          const isPrevious = index === 0
          const isNext = index === links.length - 1
          const label = isPrevious ? <HiChevronLeft className="h-4 w-4" /> : isNext ? <HiChevronRight className="h-4 w-4" /> : link.label

          return (
            <button
              key={`${link.label}-${index}`}
              type="button"
              disabled={!link.url}
              onClick={() => link.url && onNavigate(link.url)}
              aria-current={link.active ? "page" : undefined}
              aria-label={isPrevious ? "Halaman sebelumnya" : isNext ? "Halaman berikutnya" : `Halaman ${link.label}`}
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                link.active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-slate-400 hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
