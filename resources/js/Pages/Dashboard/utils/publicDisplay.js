export const REFRESH_INTERVAL = 60000;
export const RING_CIRCUMFERENCE = 226.19;

export const dashboardColors = {
    blue: "#4f5bef",
    line: "#eaecf3",
    ink: "#13151c",
    faint: "#9aa1ae",
};

export const publicDisplayClasses = {
    card: "overflow-hidden rounded-[14px] border border-[#eaecf3] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04),0_6px_20px_rgba(17,24,39,0.05)]",
    sectionHead: "border-b border-[#eaecf3] px-[18px] pb-3 pt-[18px]",
    sectionTitle: "mb-0.5 text-sm font-bold text-[#13151c]",
    sectionSub: "text-[11.5px] text-[#9aa1ae]",
};

export const statusStyles = {
    open: {
        label: "Open",
        iconBox: "bg-[#fdf1e2]",
        icon: "text-[#e08a2c]",
        pill: "bg-[#fdf1e2] text-[#e08a2c]",
    },
    closed: {
        label: "Closed",
        iconBox: "bg-[#e8f6f0]",
        icon: "text-[#1f9d6b]",
        pill: "bg-[#e8f6f0] text-[#1f9d6b]",
    },
};

export const statStyles = {
    total: "text-[#13151c]",
    open: "text-[#e08a2c]",
    closed: "text-[#1f9d6b]",
    areas: "text-[#13151c]",
};

export const formatDate = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
};

export const formatTime = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

export const formatRelative = (value) => {
    if (!value) return "-";

    const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;

    return `${Math.floor(diffMinutes / 1440)}d ago`;
};

export const getAgeInDays = (value) => {
    if (!value) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
};

export const clampPercent = (value) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

export const withBarWidths = (items = []) => {
    const maxTotal = Math.max(...items.map((item) => item.total), 1);
    return items.map((item) => ({ ...item, width: clampPercent((item.total / maxTotal) * 100) }));
};
