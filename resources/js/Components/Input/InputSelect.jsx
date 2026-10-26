import InputDropdown from "@/Components/Input/InputDropdown"

export default function InputSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = null,
  required = false,
  disabled = false,
  helperText,
  error,
  className = "",
  wrapperClassName = "",
  labelClassName = "",
  selectClassName = "",
  icon = null,
}) {
  const items = placeholder ? [{ value: "", label: placeholder }, ...options] : options
  const selected = items.find((option) => String(option.value) === String(value)) ?? null

  return (
    <InputDropdown
      id={id}
      label={label}
      object={selected}
      itemList={items}
      setObject={(item) => onChange({ target: { value: String(item.value) } })}
      placeholder={placeholder || "Select an option"}
      required={required}
      disabled={disabled}
      helperText={helperText}
      error={error}
      className={`${wrapperClassName} ${className}`}
      labelClassName={labelClassName}
      buttonClassName={selectClassName}
      icon={icon}
    />
  )
}
