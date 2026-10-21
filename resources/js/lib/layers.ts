export const LAYERS = {
    sticky: "z-10",
    dropdown: "z-20",
    sidebar: "z-50",
    sidebarOverlay: "z-40",
    modal: "z-[100]",
    statusModal: "z-[200]",
} as const;

export type Layer = keyof typeof LAYERS;
