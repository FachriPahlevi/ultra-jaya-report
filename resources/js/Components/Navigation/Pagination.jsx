import { HiChevronLeft, HiChevronRight } from "react-icons/hi"

export default function Pagination({ page, totalPages, onChange, center = false, total = null, perPage = null }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1)

  return (
    <div className={`flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:px-6 ${center ? "sm:justify-center" : "sm:justify-between"}`}>
      {typeof total === "number" && typeof perPage === "number" && (
        <p className="text-xs text-muted-foreground">
          Menampilkan {total === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, total)} dari {total} data
        </p>
      )}
      <nav aria-label="Paginasi" className="flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-slate-400 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <HiChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Halaman ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`h-10 min-w-10 rounded-lg border px-3 text-xs font-semibold transition-colors
                        ${
                          p === page ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-slate-400 hover:bg-muted hover:text-foreground"
                        }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-slate-400 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <HiChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}
