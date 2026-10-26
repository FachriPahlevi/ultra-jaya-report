import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import FilterSelectField from "@/Components/Table/FilterSelectField"

const PAGE_SIZE_OPTIONS = [...[10, 25, 50, 100].map((value) => ({ value: String(value), label: String(value) })), { value: "-1", label: "Semua" }]

export default function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  perPage,
  onPerPageChange,
  resultText,
  actions = null,
  sheetActions = null,
  filterContent = null,
  onResetFilter = null,
  onMobileFilter = null,
  mobileFilterActive = false,
}) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [draftPerPage, setDraftPerPage] = useState(Number(perPage))

  useEffect(() => {
    if (isMobileSheetOpen) setDraftPerPage(Number(perPage))
  }, [isMobileSheetOpen, perPage])

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border bg-background p-3 sm:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="ui-field rounded-full pl-10"
            aria-label={searchPlaceholder}
          />
        </div>
        <button
          type="button"
          onClick={() => (onMobileFilter ? onMobileFilter() : setIsMobileSheetOpen(true))}
          aria-label="Buka filter dan urutan"
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary ${mobileFilterActive ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {mobileFilterActive && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-primary" />}
        </button>
      </div>
      <div className="hidden min-w-0 flex-col gap-3 border-b border-border bg-background p-3 sm:flex sm:px-4 sm:py-3 lg:flex-row lg:items-center lg:px-6">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="ui-field pl-10" aria-label={searchPlaceholder} />
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3 lg:ml-auto lg:justify-end">
          {resultText && <p className="min-w-0 text-sm text-muted-foreground">{resultText}</p>}
          <button
            type="button"
            onClick={() => (onMobileFilter ? onMobileFilter() : setIsMobileSheetOpen(true))}
            className={`relative inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary ${mobileFilterActive ? "border-primary bg-blue-50 text-primary" : "border-border bg-card text-foreground"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter{mobileFilterActive && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Filter aktif" />}
          </button>
          {actions && <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">{actions}</div>}
        </div>
      </div>
      <ModalOverlay id="table-toolbar-mobile-sheet" isOpen={isMobileSheetOpen && !onMobileFilter} onClose={() => setIsMobileSheetOpen(false)}>
        <section
          aria-labelledby="table-toolbar-sheet-title"
          className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl sm:max-w-xl sm:rounded-2xl sm:border"
        >
          <div className="px-4 pt-2">
            <div className="mx-auto h-1 w-12 rounded-full bg-slate-300" />
          </div>
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
            <div>
              <h2 id="table-toolbar-sheet-title" className="text-lg font-bold tracking-tight text-foreground">
                Atur tampilan
              </h2>
              {resultText && <p className="mt-1 text-xs text-muted-foreground">Saat ini ada {resultText}</p>}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(false)}
              aria-label="Tutup pengaturan tampilan"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-4 py-5 sm:px-5">
            {filterContent}
            {filterContent && <div className="border-t border-border" />}
            <FilterSelectField
              label="Baris per halaman"
              description="Pilih banyaknya data dalam satu halaman."
              value={String(draftPerPage)}
              onChange={(value) => setDraftPerPage(Number(value))}
              options={PAGE_SIZE_OPTIONS}
            />
            {sheetActions && <div className="border-t border-border pt-5">{sheetActions}</div>}
          </div>
          <footer
            className="grid grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:px-5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => {
                setDraftPerPage(10)
                onResetFilter?.()
              }}
              className="min-h-12 rounded-xl border border-border bg-card text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onPerPageChange(draftPerPage)
                setIsMobileSheetOpen(false)
              }}
              className="min-h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Tampilkan hasil
            </button>
          </footer>
        </section>
      </ModalOverlay>
    </>
  )
}
