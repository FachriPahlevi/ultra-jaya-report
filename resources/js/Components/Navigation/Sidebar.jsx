import React from "react";
import { usePage, Link } from "@inertiajs/react";
import {
    LayoutDashboard,
    Users,
    FileText,
    Map,
    Activity,
    LogOut,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "User", icon: Users },
    { href: "/reports", label: "All reports", icon: FileText },
    { href: "/areas", label: "Areas", icon: Map },
    { href: "/activities", label: "Activities", icon: Activity },
];

const SidebarItem = ({ item, active, onClick }) => {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`
                group flex items-center gap-3 px-4 py-[10px] mx-2 rounded-xl text-[13px]
                transition-all duration-150
                ${
                    active
                        ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] font-semibold shadow-sm"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--muted)]"
                }
            `}
        >
            <Icon
                size={16}
                strokeWidth={active ? 2 : 1.75}
                className="opacity-70 group-hover:opacity-100"
            />
            <span className="truncate">{item.label}</span>
        </Link>
    );
};

const Sidebar = ({ sidebarOpen, closeSidebar }) => {
    const { props, url } = usePage();
    const currentUser = props.auth?.user;

    const isActive = (href) =>
        href === "/" ? url === "/" : url.startsWith(href);

    const getInitial = (name) =>
        name
            ?.split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") ?? "U";

    return (
        <aside
            className={`
                w-[240px] bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)]
                fixed top-0 left-0 h-screen z-[50] flex flex-col
                transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
        >
            <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--sidebar-border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--sidebar-accent)] flex items-center justify-center">
                    <img
                        src="/img/logo/logo_uj.png"
                        className="w-6 h-6 object-contain"
                    />
                </div>
                <span className="text-[13px] font-semibold text-[var(--sidebar-foreground)] leading-tight">
                    PT Ultra Jaya Milk
                </span>
            </div>

            <nav className="flex-1 py-4 space-y-[4px] overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <SidebarItem
                        key={item.label}
                        item={item}
                        active={isActive(item.href)}
                        onClick={closeSidebar}
                    />
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-[var(--sidebar-border)]">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[var(--muted)]">
                    <div className="w-9 h-9 rounded-full bg-[var(--sidebar-accent)] flex items-center justify-center text-xs font-semibold text-[var(--sidebar-primary)]">
                        {getInitial(currentUser?.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[var(--sidebar-foreground)] truncate">
                            {currentUser?.name}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                            {currentUser?.role}
                        </div>
                    </div>
                </div>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-3 flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--destructive)] rounded-lg hover:bg-[var(--muted)] w-full transition-colors"
                >
                    <LogOut size={14} />
                    Log out
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;