import React from "react";

export default function InputText({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    icon: Icon,
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

            <div className="relative">
                {Icon && (
                    <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
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
                        w-full h-10 rounded-xl text-[13.5px] transition-all duration-150
                        border bg-card outline-none
                        placeholder:text-muted-foreground/60
                        ${Icon ? "pl-10 pr-3.5" : "px-3.5"}
                        ${disabled
                            ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
                            : "text-foreground border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        }
                        ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                    `}
                    {...props}
                />
            </div>

            {error && (
                <span className="text-[11.5px] text-destructive">{error}</span>
            )}
        </div>
    );
}
