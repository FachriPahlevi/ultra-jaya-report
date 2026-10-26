import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { HiOutlineX } from "react-icons/hi"

export default function MultiSelectChecklist({
  label,
  values = [],
  options = [],
  onChange,
  error,
  helperText,
  searchPlaceholder = "Cari pilihan...",
  emptyText = "Pilihan tidak tersedia.",
  selectionLabel = "Dipilih",
  emptySelectionText = "Belum ada pilihan.",
}) {
  const [search, setSearch] = useState("")

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return options

    return options.filter((option) => {
      const haystack = [option.label, option.description].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(keyword)
    })
  }, [options, search])

  const selectedOptions = useMemo(() => options.filter((option) => values.includes(String(option.value))), [options, values])

  const toggleValue = (rawValue) => {
    const value = String(rawValue)
    const option = options.find((item) => String(item.value) === value)

    if (option?.disabled) {
      return
    }

    const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

    onChange(nextValues)
  }

  const removeValue = (rawValue) => {
    const value = String(rawValue)
    onChange(values.filter((item) => item !== value))
  }

  return (
    <div className="flex flex-col gap-2.5">
      {label && <span className="ui-label">{label}</span>}

      <div className="rounded-xl border border-border bg-background p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="ui-field pl-9" />
        </div>

        <div className="mt-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground">{selectionLabel}</p>
                <p className="text-[11px] text-muted-foreground">{selectedOptions.length} dipilih</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex min-h-[40px] flex-wrap gap-2">
            {selectedOptions.length === 0 ? (
              <span className="text-[12px] text-muted-foreground">{emptySelectionText}</span>
            ) : (
              selectedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => removeValue(option.value)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-slate-400"
                  aria-label={`Hapus ${option.label}`}
                >
                  <span>{option.label}</span>
                  <HiOutlineX className="h-3.5 w-3.5" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {filteredOptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">{emptyText}</div>
          ) : (
            filteredOptions.map((option) => {
              const checked = values.includes(String(option.value))

              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    option.disabled ? "cursor-not-allowed border-border bg-muted/30 opacity-70" : checked ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={option.disabled}
                    onChange={() => toggleValue(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{option.label}</p>
                    {option.description && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{option.description}</p>}
                  </div>
                </label>
              )
            })
          )}
        </div>
      </div>

      {error ? (
        <p className="ui-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="ui-help">{helperText}</p>
      ) : null}
    </div>
  )
}
