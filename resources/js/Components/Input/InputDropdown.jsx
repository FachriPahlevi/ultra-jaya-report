import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { HiChevronDown } from "react-icons/hi"

export default function InputDropdown({
  id,
  label,
  itemList = [],
  required = false,
  defaultValue = "",
  placeholder = "Select an option",
  setObjectGroup,
  setObject,
  object,
  disabled = false,
  componentId,
  defaultOpen = false,
  iconSrc,
  icon: Icon,
  description,
  helperText,
  className = "",
  labelClassName = "",
  buttonClassName = "",
  error,
}) {
  const generatedId = useId()
  const fieldId = componentId || id || generatedId
  const listId = `${fieldId}-options`
  const [value, setValue] = useState(defaultValue)
  const [showDropdown, setShowDropdown] = useState(defaultOpen)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const displayValue = object ? object.value : value
  const selectedOption = itemList.find((item) => String(item.value) === String(displayValue))
  const displayText = object?.label ?? selectedOption?.label ?? ""

  useEffect(() => {
    if (!object) {
      setValue(defaultValue)
    }
  }, [defaultValue, object])

  useEffect(() => {
    if (disabled) setShowDropdown(false)
  }, [disabled])

  useLayoutEffect(() => {
    if (!showDropdown) return undefined
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width, maxHeight: Math.min(280, Math.max(80, window.innerHeight - rect.bottom - 14)) })
    }
    triggerRef.current?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" })
    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    const observer = new ResizeObserver(updatePosition)
    if (triggerRef.current) observer.observe(triggerRef.current)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [showDropdown])

  useEffect(() => {
    if (!showDropdown) return undefined
    const closeOutside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setShowDropdown(false)
    }
    const closeEscape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        setShowDropdown(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", closeEscape, true)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("keydown", closeEscape, true)
    }
  }, [showDropdown])

  const handleSelectClick = () => {
    if (!disabled) setShowDropdown((prev) => !prev)
  }

  const handleOptionClick = (item) => {
    if (item.disabled) return
    setValue(item.value)
    setShowDropdown(false)
    if (setObjectGroup) setObjectGroup((prev) => ({ ...prev, [id]: item.value }))
    if (setObject) setObject({ label: item.label, value: item.value })
    triggerRef.current?.focus()
  }

  return (
    <div className={`relative flex w-full min-w-0 flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className={`ui-label ${labelClassName}`}>
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}

      <input id={`${fieldId}-value`} className="sr-only" value={displayValue ?? ""} required={required} disabled={disabled} tabIndex={-1} onChange={() => {}} onInvalid={(event) => { event.preventDefault(); triggerRef.current?.focus(); setShowDropdown(true) }} />

      <div className="relative min-w-0">
        {iconSrc && <img src={iconSrc} alt="" className="absolute w-4 h-4 top-1/2 -translate-y-1/2 left-3.5 z-10 opacity-60" />}

        <button
          id={fieldId}
          ref={triggerRef}
          type="button"
          onClick={handleSelectClick}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault()
              setShowDropdown(true)
              requestAnimationFrame(() => {
                const options = menuRef.current?.querySelectorAll('button[role="option"]:not(:disabled)')
                options?.[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus()
              })
            }
          }}
          disabled={disabled}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={showDropdown ? listId : undefined}
          aria-label={label || placeholder}
          className={`
                        ui-field flex min-w-0 items-center justify-between gap-2 text-left
                        ${iconSrc ? "pl-9" : ""}
                        ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                        focus:ring-0 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15
                        ${buttonClassName}
                    `}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          <span className={`min-w-0 flex-1 truncate ${displayText ? "text-foreground" : "text-muted-foreground/60"}`} title={displayText}>{displayText || placeholder}</span>
          <HiChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showDropdown ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
        </button>

        {showDropdown && position && createPortal(
          <div ref={menuRef} id={listId} className="fixed z-[110] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card py-1 shadow-xl" style={position} role="listbox" tabIndex={-1} aria-label={label || placeholder} onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
            event.preventDefault()
            const options = [...menuRef.current.querySelectorAll('button[role="option"]:not(:disabled)')]
            const next = (options.indexOf(document.activeElement) + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length
            options[next]?.focus()
          }}>
              {itemList.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-muted-foreground">No options available</div>
              ) : (
                itemList.map((item, index) => {
                  const isSelected = String(displayValue) === String(item.value)
                  return (
                    <button
                      key={`${item.value}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={item.disabled}
                      onClick={() => handleOptionClick(item)}
                      className={`flex min-h-11 w-full items-center px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        isSelected ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="min-w-0 break-words">{item.label}</span>
                    </button>
                  )
                })
              )}
          </div>
        , document.body)}
      </div>

      {error && (
        <p className="ui-error" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && <p className="ui-help">{helperText}</p>}
    </div>
  )
}
