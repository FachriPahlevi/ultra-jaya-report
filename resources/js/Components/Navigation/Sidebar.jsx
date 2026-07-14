import React from "react";
import { usePage, Link } from "@inertiajs/react";
import {
    HiOutlineViewGrid,
    HiOutlineDocumentReport,
    HiOutlineMap,
    HiOutlineLightningBolt,
    HiOutlineCog,
    HiOutlineLogout,
} from "react-icons/hi";

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: HiOutlineViewGrid, permission: "menu.dashboard" },
    { href: "/reports", label: "All reports", icon: HiOutlineDocumentReport, permission: "menu.reports" },
    { href: "/areas", label: "Areas", icon: HiOutlineMap, permission: "menu.areas" },
    { href: "/activities", label: "Activities", icon: HiOutlineLightningBolt, permission: "menu.activities" },
    { href: "/settings", label: "Settings", icon: HiOutlineCog, permission: "menu.settings" },
];

const SidebarItem = ({ item, active, onClick }) => {
    if (!item?.icon) return null;
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`
                flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl text-[13px] transition-all duration-150
                ${active
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] font-semibold"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)]"
                }
            `}
        >
            <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[var(--sidebar-primary)]" : "opacity-60"}`} />
            <span className="truncate">{item.label}</span>
        </Link>
    );
};

const Sidebar = ({ sidebarOpen, closeSidebar }) => {
    const { props, url } = usePage();
    const currentUser = props.auth?.user;
    const permissions = props.auth?.user?.permissions || [];

    const isActive = (href) => (href === "/" ? url === "/" : url.startsWith(href));

    const getInitials = (name) =>
        name?.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") ?? "U";

    const getRoleName = () => {
        const roles = currentUser?.roles || [];
        return roles[0] || "User";
    };

    const filteredNav = NAV_ITEMS.filter((item) =>
        !item.permission ? true : permissions.includes(item.permission)
    );

    return (
        <aside
            className={`
                w-[220px] bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)]
                fixed top-0 left-0 h-screen z-50 flex flex-col
                transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
        >
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--sidebar-border)]">
                <img src="/img/logo/logo_uj.svg" className="w-12 h-12 object-contain" alt="logo" />
                <span className="text-[13px] font-bold text-[var(--sidebar-foreground)] leading-tight">
                    PT Ultrajaya Milk Industry
                </span>
            </div>

            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
                {filteredNav.map((item) => (
                    <SidebarItem
                        key={item.label}
                        item={item}
                        active={isActive(item.href)}
                        onClick={closeSidebar}
                    />
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-[var(--sidebar-border)] space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--muted)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--sidebar-accent)] flex items-center justify-center text-[11px] font-bold text-[var(--sidebar-primary)] shrink-0">
                        {getInitials(currentUser?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-[var(--sidebar-foreground)] truncate">
                            {currentUser?.name}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] truncate uppercase tracking-wide">
                            {getRoleName()}
                        </div>
                    </div>
                </div>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-[var(--destructive)] rounded-lg hover:bg-red-50 w-full transition-colors"
                >
                    <HiOutlineLogout className="w-4 h-4" />
                    Log out
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;