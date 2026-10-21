import { createPortal } from "react-dom";
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { LAYERS, type Layer } from "@/lib/layers";
import { isTopModal, registerModal, unregisterModal } from "@/lib/modalStack";

type ModalOverlayProps = {
    id?: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    forceMount?: boolean;
    layer?: Layer;
};

export default function ModalOverlay({ id, isOpen, onClose, children, forceMount = false, layer = "modal" }: ModalOverlayProps) {
    const generatedId = useId();
    const modalId = id ?? generatedId;
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        registerModal(modalId);

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isTopModal(modalId)) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
            unregisterModal(modalId);
            restoreFocusRef.current?.focus();
        };
    }, [isOpen, modalId, onClose]);

    if (!isOpen && !forceMount) {
        return null;
    }

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && isTopModal(modalId)) {
            onClose();
        }
    };

    return createPortal(
        <div
            aria-modal="true"
            className={`fixed inset-0 ${LAYERS[layer]} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
            role="dialog"
            onMouseDown={handleBackdropClick}
        >
            {children}
        </div>,
        document.body,
    );
}
