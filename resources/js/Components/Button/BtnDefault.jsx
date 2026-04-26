import { Link } from "@inertiajs/react";

export default function BtnDefault({ 
    children, 
    type = "button", 
    fullWidth = false, 
    disabled = false, 
    outline = false, 
    negative = false, 
    href = null, 
    rounded = false, 
    fullRounded = false, 
    size = "md", 
    onClick = null, 
    btnText = "", 
    form = null, 
    loading = false,
    className = "",
    ...props 
}) {
    let buttonClass = "bg-primary text-primary-foreground border border-transparent hover:opacity-90";
    let ringClass = "focus:ring-primary";
    const roundness = fullRounded ? "rounded-full" : rounded ? "rounded-md" : "rounded-sm";
    let buttonSize = "px-4 py-2 text-[13.5px]";
    let gapSize = "gap-1.5";

    if (outline && negative) {
        buttonClass = "bg-transparent border border-destructive text-destructive hover:bg-destructive/10";
        ringClass = "focus:ring-destructive";
    } else if (outline) {
        buttonClass = "bg-transparent border border-border text-foreground hover:bg-muted";
        ringClass = "focus:ring-primary";
    } else if (negative) {
        buttonClass = "bg-destructive text-destructive-foreground border border-transparent hover:opacity-90";
        ringClass = "focus:ring-destructive";
    }

    if (size === "sm") {
        buttonSize = "px-3 py-1.5 text-xs";
        gapSize = "gap-1";
    } else if (size === "md") {
        buttonSize = "px-4 py-2 text-[13.5px]";
        gapSize = "gap-1.5";
    } else if (size === "lg") {
        buttonSize = "px-5 py-2.5 text-sm";
        gapSize = "gap-2";
    } else if (size === "xl") {
        buttonSize = "px-6 py-3 text-base";
        gapSize = "gap-2.5";
    }

    const baseClasses = `inline-flex items-center justify-center font-semibold transition-all outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonSize} ${roundness} ${fullWidth ? "w-full" : "w-fit"} min-w-[100px] relative ${className}`;
    
    const contentWrapper = (content) => (
        <div className={`flex items-center justify-center ${gapSize}`}>
            {content}
        </div>
    );

    const renderContent = () => {
        const hasChildren = !!children;
        const hasBtnText = !!btnText;
        
        if (hasChildren && hasBtnText) {
            return contentWrapper(
                <>
                    <span className="inline-flex items-center">{children}</span>
                    <span>{btnText}</span>
                </>
            );
        } else if (hasChildren) {
            return contentWrapper(
                <span className="inline-flex items-center">{children}</span>
            );
        } else if (hasBtnText) {
            return contentWrapper(
                <span>{btnText}</span>
            );
        }
        return null;
    };

    const loadingContent = (
        <div className={`flex items-center justify-center ${gapSize}`}>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{btnText || "Loading..."}</span>
        </div>
    );

    if (href) {
        return (
            <div className={`${fullWidth ? "w-full" : "w-fit"} h-fit ${disabled || loading ? "pointer-events-none" : ""} ${ringClass} transition-all ${roundness} ring-offset-2 focus-within:ring-2 ${className}`}>
                <Link 
                    href={href} 
                    className={`${buttonClass} ${buttonSize} ${roundness} inline-flex items-center justify-center w-full h-full ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""}`} 
                    {...props}
                >
                    {loading ? loadingContent : renderContent()}
                </Link>
            </div>
        );
    }

    return (
        <div className={`${fullWidth ? "w-full" : "w-fit"} h-fit ${disabled || loading ? "pointer-events-none" : ""} ${ringClass} transition-all ${roundness} ring-offset-2 focus-within:ring-2 ${className}`}>
            <button 
                form={form} 
                onClick={onClick} 
                disabled={disabled || loading} 
                type={type} 
                className={`${buttonClass} ${buttonSize} ${roundness} inline-flex items-center justify-center w-full h-full ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""}`}
                {...props}
            >
                {loading ? loadingContent : renderContent()}
            </button>
        </div>
    );
}