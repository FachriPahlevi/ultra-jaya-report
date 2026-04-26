import { useState } from "react";
import Sidebar from "@/Components/Navigation/Sidebar";

const SidebarOverlay = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            role="presentation"
            className="fixed inset-0 z-[199] bg-black/25 backdrop-blur-sm lg:hidden"
        />
    );
};

const MenuIcon = () => (
    <>
        <span className="block w-5 h-[2px] bg-[var(--foreground)] rounded" />
        <span className="block w-5 h-[2px] bg-[var(--foreground)] rounded" />
        <span className="block w-5 h-[2px] bg-[var(--foreground)] rounded" />
    </>
);

const MobileHeader = ({ title, onToggleMenu }) => (
    <header className="hidden items-center gap-3 px-5 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-[100] max-lg:flex">
        <button
            onClick={onToggleMenu}
            aria-label="Toggle menu"
            className="flex flex-col gap-1 p-1 cursor-pointer"
        >
            <MenuIcon />
        </button>

        <span className="text-[15px] font-semibold text-[var(--foreground)]">
            {title}
        </span>
    </header>
);

export default function Layout({ title = "", children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex min-h-screen">
            <Sidebar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />

            <SidebarOverlay isOpen={sidebarOpen} onClose={closeSidebar} />

            <div className="flex flex-1 flex-col min-w-0 lg:ml-[220px]">
                <MobileHeader title={title} onToggleMenu={toggleSidebar} />

                <main className="flex-1 p-7 max-sm:p-4">{children}</main>
            </div>
        </div>
    );
}
