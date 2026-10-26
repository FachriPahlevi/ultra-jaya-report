import { useEffect, useRef, useState } from "react"
import { HiChevronDown } from "react-icons/hi"

export default function InputDropdown({
  id,
  label,
  itemList = [],
  required = false,
  defaultValue = "",
  placeholder = "Pilih opsi",
  setObjectGroup,
  setObject,
  object,
  disabled = false,
  componentId,
  defaultOpen = false,
  iconSrc,
  error,
}) {
  const [value, setValue] = useState(object ? object.value : defaultValue)
  const [text, setText] = useState("")
  const [showDropdown, setShowDropdown] = useState(defaultOpen)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const option = itemList.find((item) => item.value === value)
    setText(option?.label || "")
  }, [value, itemList])

  useEffect(() => {
    if (object) {
      setValue(object.value)
      setText(object.label)
    }
  }, [object])

  useEffect(() => {
    if (!object) {
      setValue(defaultValue)
    }
  }, [defaultValue, object])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown])

  const handleSelectClick = () => {
    if (!disabled) setShowDropdown((prev) => !prev)
  }

  const handleOptionClick = (item) => {
    setValue(item.value)
    setText(item.label)
    setShowDropdown(false)
    if (setObjectGroup) setObjectGroup((prev) => ({ ...prev, [id]: item.value }))
    if (setObject) setObject({ label: item.label, value: item.value })
  }

  const displayText = object ? object.label : text
  const displayValue = object ? object.value : value

  return (
    <div className="w-full flex flex-col gap-1.5 relative">
      {label && (
        <label htmlFor={componentId || id} className="ui-label">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <input id={componentId || id} className="sr-only" value={displayText} required={required} onChange={() => {}} />

      <div ref={dropdownRef} className="relative">
        {iconSrc && <img src={iconSrc} alt="" className="absolute w-4 h-4 top-1/2 -translate-y-1/2 left-3.5 z-10 opacity-60" />}

        <button
          type="button"
          onClick={handleSelectClick}
          disabled={disabled}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          className={`
                        ui-field flex items-center justify-between gap-2 text-left
                        ${iconSrc ? "pl-9" : ""}
                        ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                        ${showDropdown ? "border-primary ring-2 ring-primary/10" : ""}
                    `}
        >
          <span className={displayText ? "text-foreground" : "text-muted-foreground/60"}>{displayText || placeholder}</span>
          <HiChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showDropdown ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
        </button>

        {showDropdown && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md" role="listbox">
            <div className="max-h-[250px] overflow-y-auto overscroll-contain">
              {itemList.length === 0 ? (
                <div className="px-4 py-3 text-center text-[13px] text-muted-foreground">Pilihan tidak tersedia</div>
              ) : (
                itemList.map((item, index) => {
                  const isSelected = displayValue === item.value
                  return (
                    <button
                      key={`${item.value}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleOptionClick(item)}
                      className={`w-full text-left px-4 py-2.5 text-[13.5px] transition-colors duration-100 ${
                        isSelected ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="ui-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
