import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type StatusType = "success" | "error" | "warning" | "info";
type StatusButton = { text?: string; variant?: string; onClick?: () => void | Promise<void>; redirectUrl?: string };
export type StatusModalProps = { isOpen: boolean; type: StatusType; title: string; message: string; button1: StatusButton | null; button2: StatusButton | null };
type StatusModalContextValue = {
    statusModalProps: StatusModalProps;
    setStatusModalProps: Dispatch<SetStateAction<StatusModalProps>>;
    closeModal: () => void;
    showModal: (type: StatusType, title: string, message: string, options?: Pick<StatusModalProps, "button1" | "button2">) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showWarning: (message: string, title?: string) => void;
    showInfo: (message: string, title?: string) => void;
};

const initialStatus: StatusModalProps = { isOpen: false, type: "info", title: "", message: "", button1: null, button2: null };
const StatusModalContext = createContext<StatusModalContextValue | undefined>(undefined);
let globalSetStatusModal: Dispatch<SetStateAction<StatusModalProps>> | null = null;
let pendingStatusModal: Partial<StatusModalProps> | null = null;

const normalizeStatus = (props: Partial<StatusModalProps>): StatusModalProps => ({ ...initialStatus, ...props, isOpen: true, button1: props.button1 ?? { text: "OK" }, button2: props.button2 ?? null });

export function showGlobalStatusModal(props: Partial<StatusModalProps>): void {
    if (globalSetStatusModal) globalSetStatusModal(normalizeStatus(props));
    else pendingStatusModal = props;
}

export function closeGlobalStatusModal(): void {
    globalSetStatusModal?.((previous) => ({ ...previous, isOpen: false }));
}

export function StatusModalProvider({ children }: { children: ReactNode }) {
    const [statusModalProps, setStatusModalProps] = useState<StatusModalProps>(initialStatus);

    useEffect(() => {
        globalSetStatusModal = setStatusModalProps;
        if (pendingStatusModal) { showGlobalStatusModal(pendingStatusModal); pendingStatusModal = null; }
        const handleStatusEvent = (event: Event) => {
            const detail = (event as CustomEvent<Partial<StatusModalProps>>).detail;
            if (detail) setStatusModalProps(normalizeStatus(detail));
        };
        window.addEventListener("app:status-modal", handleStatusEvent);
        return () => { globalSetStatusModal = null; window.removeEventListener("app:status-modal", handleStatusEvent); };
    }, []);

    const closeModal = useCallback(() => setStatusModalProps((previous) => ({ ...previous, isOpen: false })), []);
    const showModal = useCallback((type: StatusType, title: string, message: string, options: Pick<StatusModalProps, "button1" | "button2"> = { button1: null, button2: null }) => setStatusModalProps(normalizeStatus({ type, title, message, ...options })), []);
    const showSuccess = useCallback((message: string, title = "Berhasil") => showModal("success", title, message), [showModal]);
    const showError = useCallback((message: string, title = "Terjadi Kesalahan") => showModal("error", title, message), [showModal]);
    const showWarning = useCallback((message: string, title = "Peringatan") => showModal("warning", title, message), [showModal]);
    const showInfo = useCallback((message: string, title = "Informasi") => showModal("info", title, message), [showModal]);

    return <StatusModalContext.Provider value={{ statusModalProps, setStatusModalProps, closeModal, showModal, showSuccess, showError, showWarning, showInfo }}>{children}</StatusModalContext.Provider>;
}

export function useStatusModal(): StatusModalContextValue {
    const context = useContext(StatusModalContext);
    if (!context) throw new Error("useStatusModal must be used within StatusModalProvider");
    return context;
}
