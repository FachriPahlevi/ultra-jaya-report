import React from "react";

export default function InputText({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error,
    className = "",
    ...props
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`w-full px-3 py-2.5 border rounded-lg text-[13.5px] outline-none transition-colors font-inherit ${
                    disabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
                        : "bg-background text-foreground focus:border-primary border-border"
                } ${error ? "border-destructive focus:border-destructive" : ""}`}
                {...props}
            />
            {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
    );
}
