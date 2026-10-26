import React from "react"

export default function InputText({ id, label, type = "text", value, onChange, placeholder, icon: Icon, required = false, disabled = false, error, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
                        ui-field
                        ${Icon ? "pl-10 pr-3.5" : "px-3.5"}
                        ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                    `}
          {...props}
        />
      </div>

      {error && (
        <span className="ui-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
