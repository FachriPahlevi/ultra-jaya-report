import { HiChevronDown } from "react-icons/hi";

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
    ...props
}) {
    const Icon = icon;

    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName} ${className}`}>
            {label && (
                <label htmlFor={id} className={`text-[13px] font-semibold text-foreground ${labelClassName}`}>
                    {label}
                    {required && <span className="ml-0.5 text-destructive">*</span>}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
                        <Icon className="h-4 w-4" />
                    </span>
                )}

                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
                        h-10 w-full appearance-none rounded-xl border bg-card text-[13.5px] font-medium text-foreground
                        outline-none transition-all duration-150
                        ${Icon ? "pl-10" : "pl-3.5"} pr-10
                        ${disabled ? "cursor-not-allowed border-border bg-muted text-muted-foreground" : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"}
                        ${error ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                        ${selectClassName}
                    `}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                    <HiChevronDown className="h-4 w-4" />
                </span>
            </div>

            {error ? <span className="text-[11.5px] text-destructive">{error}</span> : helperText ? <span className="text-[11.5px] text-muted-foreground">{helperText}</span> : null}
        </div>
    );
}
