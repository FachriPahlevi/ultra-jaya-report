import { ArrowUpDown, ChevronDown } from "lucide-react"

export default function FilterSelectField({ label = "Urutan", description, value, onChange, options, icon: Icon = ArrowUpDown }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {description && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>}
      <span className="relative mt-2.5 flex min-h-12 items-center rounded-xl border border-border bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <Icon className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 min-w-0 flex-1 appearance-none bg-transparent px-3 pr-10 text-sm font-semibold text-foreground outline-none"
        >
          {options.map((option) => {
            const item = Array.isArray(option) ? { value: option[0], label: option[1] } : option
            return (
              <option key={String(item.value)} value={item.value}>
                {item.label}
              </option>
            )
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted-foreground" />
      </span>
    </label>
  )
}
