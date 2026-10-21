import { Link } from "@inertiajs/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type BtnDefaultProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    href?: string | null;
    loading?: boolean;
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
};

export default function BtnDefault({ children, href = null, loading = false, variant = "primary", size = "md", fullWidth = false, className = "", disabled = false, ...props }: BtnDefaultProps) {
    const sizes = { sm: "h-8 px-3 text-xs rounded-md", md: "h-9 px-4 text-[13px] rounded-lg", lg: "h-10 px-5 text-sm rounded-lg" };
    const variants = { primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm", secondary: "bg-muted text-foreground hover:bg-muted/80 focus:ring-primary", outline: "border border-border text-foreground hover:bg-muted focus:ring-primary", ghost: "text-foreground hover:bg-muted focus:ring-primary", danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm" };
    const classes = `inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${fullWidth ? "w-full" : "w-fit"} ${className}`;
    const content = <div className="flex items-center gap-2">{loading && <span aria-label="Memuat" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}{children}</div>;

    if (href) {
        return <Link href={href} className={classes}>{content}</Link>;
    }

    return <button {...props} className={classes} disabled={disabled || loading}>{content}</button>;
}
