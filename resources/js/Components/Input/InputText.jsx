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
                    {label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
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
                    w-full h-10 px-3.5 rounded-xl text-[13.5px] transition-all duration-150
                    border bg-card outline-none
                    placeholder:text-muted-foreground/60
                    ${disabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
                        : "text-foreground border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    }
                    ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                `}
                {...props}
            />

            {error && (
                <span className="text-[11.5px] text-destructive">{error}</span>
            )}
        </div>
    );
}