import { ChevronDown, Search, X } from "lucide-react"
import { useMemo, useState } from "react"

export default function FilterMultiSelect({ label, values = [], options = [], onChange, placeholder = "All", searchable = true, selectAll = false }) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())), [options, query])
  const selected = options.filter((option) => values.includes(String(option.value)))
  const summary = selected.length === 0 ? placeholder : selected.length <= 2 ? selected.map((option) => option.label).join(", ") : `${selected.length} selected`

  const toggle = (rawValue) => {
    const value = String(rawValue)
    onChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value])
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <details className="group mt-2.5 rounded-xl border border-border bg-card open:border-slate-300">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          <span className={`min-w-0 flex-1 truncate ${selected.length ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-3">
          {searchable && options.length > 6 && (
            <div className="relative mb-2.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search options..." aria-label={`Search ${label}`} className="ui-field min-h-10 pl-9 text-sm" />
            </div>
          )}
          {selected.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {selected.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  aria-label={`Remove ${option.label}`}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-700"
                >
                  {option.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
          {(selectAll || values.length > 0) && (
            <div className="mb-1 flex items-center justify-between gap-2 border-b border-border pb-1">
              {values.length > 0 ? (
                <button type="button" onClick={() => onChange([])} className="min-h-11 rounded-md px-2 text-xs font-semibold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">
                  Clear selection
                </button>
              ) : <span />}
              {selectAll ? (
                <button
                  type="button"
                  onClick={() => onChange([...new Set([...values, ...filtered.map((option) => String(option.value))])])}
                  disabled={filtered.length === 0 || filtered.every((option) => values.includes(String(option.value)))}
                  className="min-h-11 rounded-md px-2 text-xs font-semibold text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:text-muted-foreground"
                >
                  {query.trim() ? "Select all matching" : "Select all"}
                </button>
              ) : <span />}
            </div>
          )}
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {filtered.map((option) => {
              const checked = values.includes(String(option.value))
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${checked ? "bg-blue-50 text-blue-800" : "hover:bg-muted"}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(option.value)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                </label>
              )
            })}
            {filtered.length === 0 && <p className="py-5 text-center text-xs text-muted-foreground">No options found.</p>}
          </div>
        </div>
      </details>
    </fieldset>
  )
}
