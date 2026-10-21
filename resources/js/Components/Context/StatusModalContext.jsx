import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const StatusModalContext = createContext(undefined);

let globalSetStatusModal = null;
let pendingStatusModal = null;

/**
 * Trigger StatusModal from anywhere (inside or outside React, e.g. Inertia router listeners)
 */
export const showGlobalStatusModal = (props) => {
    if (globalSetStatusModal) {
        globalSetStatusModal((prev) => ({
            ...prev,
            isOpen: true,
            type: props.type || "info",
            title: props.title || "",
            message: props.message || "",
            button1: props.button1 ?? { text: "OK" },
            button2: props.button2 ?? null,
        }));
    } else {
        pendingStatusModal = props;
    }
};

export const closeGlobalStatusModal = () => {
    if (globalSetStatusModal) {
        globalSetStatusModal((prev) => ({ ...prev, isOpen: false }));
    }
};

export const StatusModalProvider = ({ children }) => {
    const [statusModalProps, setStatusModalProps] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        button1: null,
        button2: null,
    });

    useEffect(() => {
        globalSetStatusModal = setStatusModalProps;
        if (pendingStatusModal) {
            showGlobalStatusModal(pendingStatusModal);
            pendingStatusModal = null;
        }

        const handleCustomEvent = (e) => {
            if (e.detail) {
                setStatusModalProps((prev) => ({
                    ...prev,
                    isOpen: true,
                    type: e.detail.type || "info",
                    title: e.detail.title || "",
                    message: e.detail.message || "",
                    button1: e.detail.button1 ?? { text: "OK" },
                    button2: e.detail.button2 ?? null,
                }));
            }
        };

        window.addEventListener("app:status-modal", handleCustomEvent);

        return () => {
            globalSetStatusModal = null;
            window.removeEventListener("app:status-modal", handleCustomEvent);
        };
    }, []);

    const showModal = useCallback((type, title, message, options = {}) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: options.button1 ?? { text: "OK" },
            button2: options.button2 ?? null,
        });
    }, []);

    const showSuccess = useCallback((message, title = "Berhasil", options = {}) => {
        showModal("success", title, message, options);
    }, [showModal]);

    const showError = useCallback((message, title = "Terjadi Kesalahan", options = {}) => {
        showModal("error", title, message, options);
    }, [showModal]);

    const showWarning = useCallback((message, title = "Peringatan", options = {}) => {
        showModal("warning", title, message, options);
    }, [showModal]);

    const showInfo = useCallback((message, title = "Informasi", options = {}) => {
        showModal("info", title, message, options);
    }, [showModal]);

    const closeModal = useCallback(() => {
        setStatusModalProps((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <StatusModalContext.Provider
            value={{
                statusModalProps,
                setStatusModalProps,
                showModal,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                closeModal,
            }}
        >
            {children}
        </StatusModalContext.Provider>
    );
};

export const useStatusModal = () => {
    const context = useContext(StatusModalContext);
    if (!context) {
        throw new Error("useStatusModal must be used within StatusModalProvider");
    }
    return context;
};