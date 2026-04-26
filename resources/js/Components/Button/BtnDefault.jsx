import React from "react";

export default function BtnDefault({
    children,
    onClick,
    type = "button",
    disabled = false,
    loading = false,
    outline = false,
    size = "md",
    fullWidth = false,
    className = "",
    ...props
}) {
    const baseClasses = "inline-flex items-center justify-center gap-1.5 font-semibold transition-all outline-none border rounded-lg disabled:cursor-not-allowed disabled:opacity-70";
    
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs h-8",
        md: "px-4 py-2.5 text-[13.5px]",
        lg: "px-5 py-3 text-sm h-12"
    }[size] || "px-4 py-2.5 text-[13.5px]";

    const widthClass = fullWidth ? "w-full" : "";

    const variantClasses = outline
        ? "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        : "bg-primary border-transparent text-primary-foreground hover:opacity-90 cursor-pointer";

    const isInteractive = !disabled && !loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={!isInteractive}
            className={`${baseClasses} ${sizeClasses} ${widthClass} ${variantClasses} ${className}`}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}
