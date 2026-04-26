import React from "react";

export default function InputDropdown({
    id,
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select an option",
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
            <select
                id={id}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full px-3 py-2.5 border rounded-lg text-[13.5px] outline-none transition-colors font-inherit appearance-none bg-no-repeat bg-right-3 bg-center ${
                    disabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
                        : "bg-background text-foreground focus:border-primary border-border"
                } ${error ? "border-destructive focus:border-destructive" : ""}`}
                style={{
                    backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'%236b7280\\' stroke-width=\\'2\\'%3E%3Cpolyline points=\\'6 9 12 15 18 9\\'/%3E%3C/svg%3E')",
                    backgroundSize: "16px",
                    paddingRight: "36px"
                }}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => {
                    const isObject = typeof option === "object" && option !== null;
                    const val = isObject ? option.value : option;
                    const lbl = isObject ? option.label : option;
                    return (
                        <option key={index} value={val}>
                            {lbl}
                        </option>
                    );
                })}
            </select>
            {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
    );
}
