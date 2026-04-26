import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Map,
    Activity,
    AlertTriangle,
    Settings,
    LogOut,
    Sun,
    Moon,
    Monitor,
} from 'lucide-react';
import { updateAppearance } from '@/lib/theme';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/users', label: 'User', icon: Users },
    { href: '/reports', label: 'All reports', icon: FileText },
    { href: '/areas', label: 'Areas', icon: Map },
    { href: '/activities', label: 'Activities', icon: Activity },
    { href: '/reports/issues', label: 'Issue Report', icon: AlertTriangle },
];

const THEME_OPTIONS = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
    { value: 'dark', icon: Moon, label: 'Dark' },
];

const SidebarItem = ({ item, active, onClick }) => {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`
                flex items-center gap-[10px] px-3 py-2 mx-2 my-[1px] rounded-[var(--radius-md)] 
                text-[13px] no-underline transition-all duration-150
                ${active
                    ? 'font-semibold text-[var(--sidebar-primary)] bg-[var(--sidebar-accent)]'
                    : 'font-medium text-[var(--sidebar-foreground)] bg-transparent hover:bg-[var(--muted)]'}
            `}
        >
            <Icon
                size={15}
                strokeWidth={active ? 2 : 1.75}
                className={`shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}
            />
            {item.label}
        </Link>
    );
};

const Sidebar = ({ sidebarOpen, closeSidebar }) => {
    const { props, url } = usePage();
    const currentUser = props.auth?.user;

    const [currentAppearance, setCurrentAppearance] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('appearance') ?? 'system';
        }
        return 'system';
    });

    const setTheme = (value) => {
        setCurrentAppearance(value);
        updateAppearance(value);
    };

    const isActive = (href) => (href === '/' ? url === '/' : url.startsWith(href));

    const getInitial = (name) =>
        name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') ?? 'U';

    return (
        <aside
            className={`
                w-[220px] bg-[var(--sidebar-background,#fff)] border-r border-[var(--sidebar-border)]
                flex flex-col fixed top-0 left-0 h-screen z-[200] transition-transform duration-300 overflow-hidden
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                uj-sidebar
            `}
        >
            <div className="flex items-center gap-[10px] pt-[18px] px-4 pb-4 border-b border-[var(--sidebar-border)] shrink-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img src="/img/logo/logo_uj.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-[13px] text-[var(--sidebar-foreground)] tracking-[-0.2px] leading-[1.2]">
                    PT Ultra Jaya Milk
                </span>
            </div>

            <nav className="flex-1 py-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <SidebarItem
                        key={item.label}
                        item={item}
                        active={isActive(item.href)}
                        onClick={closeSidebar}
                    />
                ))}
            </nav>

            <div className="p-3 pb-4 border-t border-[var(--sidebar-border)] shrink-0 flex flex-col gap-[2px]">
                <div className="flex bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-md)] p-[3px] mb-[10px] gap-[2px]">
                    {THEME_OPTIONS.map((opt) => {
                        const active = currentAppearance === opt.value;
                        const Icon = opt.icon;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTheme(opt.value)}
                                className={`
                                    flex-1 flex items-center justify-center gap-1 py-[5px] px-[2px] border-none cursor-pointer
                                    text-[11px] transition-all duration-150 whitespace-nowrap rounded-[calc(var(--radius-md)-2px)]
                                    ${active
                                        ? 'font-semibold text-[var(--sidebar-primary)] bg-[var(--card)] shadow-sm'
                                        : 'font-normal text-[var(--muted-foreground)] bg-transparent'}
                                `}
                            >
                                <Icon size={12} strokeWidth={active ? 2 : 1.75} />
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-[9px] px-1 pt-1 pb-2">
                    <div className="w-[30px] h-[30px] rounded-full bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitial(currentUser?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--sidebar-foreground)] truncate">
                            {currentUser?.name ?? 'User'}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] capitalize">
                            {currentUser?.role ?? 'User'}
                        </div>
                    </div>
                </div>

                <Link
                    href="/settings"
                    className="flex items-center gap-[9px] py-[7px] px-1 text-[12.5px] font-medium text-[var(--sidebar-foreground)] no-underline rounded-[var(--radius-md)] hover:text-[var(--foreground)] transition-colors"
                >
                    <Settings size={14} strokeWidth={1.75} className="opacity-60" />
                    Settings
                </Link>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex items-center gap-[9px] py-[7px] px-1 text-[12.5px] font-medium text-[var(--destructive)] no-underline rounded-[var(--radius-md)] opacity-80 hover:opacity-100 transition-opacity w-full border-none bg-transparent text-left cursor-pointer"
                >
                    <LogOut size={14} strokeWidth={1.75} />
                    Log out
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;