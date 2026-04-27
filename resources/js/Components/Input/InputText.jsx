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
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="text-[12px] font-medium text-muted-foreground"
                >
                    {label}
                    {required && (
                        <span className="text-destructive ml-0.5">*</span>
                    )}
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
                className={`
                    w-full h-10 px-3 rounded-lg text-[13px]
                    bg-background border border-border
                    outline-none transition-all duration-150
                    placeholder:text-muted-foreground/70
                    ${disabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "focus:ring-2 focus:ring-primary/20 focus:border-primary"}
                    ${error
                        ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                        : ""}
                `}
                {...props}
            />

            {error && (
                <span className="text-[11px] text-destructive">
                    {error}
                </span>
            )}
        </div>
    );
}