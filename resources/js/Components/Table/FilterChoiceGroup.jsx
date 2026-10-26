import { Check } from "lucide-react"

export default function FilterChoiceGroup({ legend, description, value, onChange, options, columns = 2, multiple = false, variant = "tiles" }) {
  const gridClass = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">{legend}</legend>
      {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      <div className={variant === "chips" ? "mt-2.5 flex flex-wrap gap-2" : `mt-2.5 grid gap-2 ${gridClass}`}>
        {options.map((option) => {
          const item = Array.isArray(option) ? { value: option[0], label: option[1] } : option
          const selected = multiple ? value.includes(String(item.value)) : value === item.value
          const Icon = item.icon

          return (
            <button
              key={String(item.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(multiple ? (selected ? value.filter((entry) => entry !== String(item.value)) : [...value, String(item.value)]) : item.value)}
              className={`group flex min-h-11 min-w-0 items-center gap-2 border text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${variant === "chips" ? "rounded-full px-3.5 py-2" : "rounded-xl px-3 py-2.5"} ${selected ? "border-blue-300 bg-blue-50 text-blue-800" : "border-border bg-card text-foreground hover:border-slate-300 hover:bg-muted/60"}`}
            >
              {Icon && <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-4">{item.label}</span>
                {item.description && <span className="mt-0.5 block text-[11px] font-normal leading-4 text-muted-foreground">{item.description}</span>}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border ${multiple ? "rounded-md" : "rounded-full"} ${selected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-transparent"}`}
                aria-hidden="true"
              >
                {multiple ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className={`h-2 w-2 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
