import React, { createContext, useContext, useState } from "react";

const StatusModalContext = createContext(undefined);

export const StatusModalProvider = ({ children }) => {
    const [statusModalProps, setStatusModalProps] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        button1: null,
        button2: null
    });

    return (
        <StatusModalContext.Provider value={{ statusModalProps, setStatusModalProps }}>
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