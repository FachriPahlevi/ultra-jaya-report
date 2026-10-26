import { ArrowUpDown } from "lucide-react"
import InputDropdown from "@/Components/Input/InputDropdown"

export default function FilterSelectField({ label = "Sort by", description, value, onChange, options = [], icon: Icon = ArrowUpDown }) {
  const items = options.map((option) => (Array.isArray(option) ? { value: option[0], label: option[1] } : option))
  const selected = items.find((item) => String(item.value) === String(value)) ?? null

  return (
    <InputDropdown
      label={label}
      description={description}
      itemList={items}
      object={selected}
      setObject={(item) => onChange(item.value)}
      icon={Icon}
      buttonClassName="h-12 rounded-xl font-semibold"
    />
  )
}
