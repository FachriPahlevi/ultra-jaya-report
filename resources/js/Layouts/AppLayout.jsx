import { useState } from "react";
import Sidebar from "@/Components/Navigation/Sidebar";

const SidebarOverlay = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            role="presentation"
            className="fixed inset-0 z-[40] bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
    );
};

const MenuIcon = () => (
    <div className="flex flex-col gap-[3px]">
        <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
        <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
        <span className="block w-[18px] h-[2px] bg-[var(--foreground)] rounded" />
    </div>
);

const MobileHeader = ({ onToggleMenu }) => (
    <header className="hidden items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-[30] max-lg:flex">
        <button
            onClick={onToggleMenu}
            className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors shrink-0"
        >
            <MenuIcon />
        </button>

        <img src="/img/logo/logo_uj.svg" className="w-8 h-8 object-contain shrink-0" alt="logo" />

        <span className="text-[13px] font-bold text-[var(--foreground)] leading-tight truncate">
            PT Ultrajaya Milk Industry
        </span>
    </header>
);

export default function Layout({ title = "", children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background)] flex">
            <Sidebar sidebarOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

            <SidebarOverlay isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col lg:ml-[220px] min-w-0">
                <MobileHeader onToggleMenu={() => setSidebarOpen(prev => !prev)} />

                <main className="flex-1 px-8 py-6 max-sm:px-4 max-sm:py-4">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}