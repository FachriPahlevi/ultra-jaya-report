import { Link } from "@inertiajs/react";

export default function BtnDefault({
    children,
    type = "button",
    href = null,
    onClick = null,
    disabled = false,
    loading = false,
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    ...props
}) {
    const base =
        "inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const sizes = {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-9 px-4 text-[13px] rounded-lg",
        lg: "h-10 px-5 text-sm rounded-lg",
    };

    const variants = {
        primary:
            "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm",
        secondary:
            "bg-muted text-foreground hover:bg-muted/80 focus:ring-primary",
        outline:
            "border border-border text-foreground hover:bg-muted focus:ring-primary",
        ghost:
            "text-foreground hover:bg-muted focus:ring-primary",
        danger:
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm",
    };

    const classes = `
        ${base}
        ${sizes[size]}
        ${variants[variant]}
        ${fullWidth ? "w-full" : "w-fit"}
        ${className}
    `;

    const content = (
        <div className="flex items-center gap-2">
            {loading && (
                <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-20"
                    />
                    <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-80"
                    />
                </svg>
            )}
            {children}
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={classes}
                {...props}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={classes}
            {...props}
        >
            {content}
        </button>
    );
}