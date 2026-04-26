import { useEffect } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineXCircle, HiOutlineInformationCircle } from "react-icons/hi";
import ModalOverlay from "./ModalOverlay";
import BtnDefault from "../Button/BtnDefault";
import { useStatusModal } from "@/Components/Context/StatusModalContext";

const statusConfig = {
    success: {
        icon: HiOutlineCheckCircle,
        iconColor: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
    },
    error: {
        icon: HiOutlineXCircle,
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
    },
    warning: {
        icon: HiOutlineExclamationCircle,
        iconColor: "text-amber-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200"
    },
    info: {
        icon: HiOutlineInformationCircle,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
    }
};

export default function StatusModal() {
    const { statusModalProps, setStatusModalProps } = useStatusModal();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && statusModalProps?.isOpen) {
                closeModal();
            }
        };

        if (statusModalProps?.isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [statusModalProps?.isOpen]);

    const closeModal = () => {
        setStatusModalProps(prev => ({ ...prev, isOpen: false }));
    };

    const handleButton1Click = () => {
        if (statusModalProps?.button1?.onClick) {
            statusModalProps.button1.onClick();
        }
        if (statusModalProps?.button1?.redirectUrl) {
            window.location.href = statusModalProps.button1.redirectUrl;
        }
        closeModal();
    };

    const handleButton2Click = () => {
        if (statusModalProps?.button2?.onClick) {
            statusModalProps.button2.onClick();
        }
        if (statusModalProps?.button2?.redirectUrl) {
            window.location.href = statusModalProps.button2.redirectUrl;
        }
        closeModal();
    };

    if (!statusModalProps?.isOpen) return null;

    const config = statusConfig[statusModalProps.type] || statusConfig.info;
    const Icon = config.icon;

    return (
        <ModalOverlay isOpen={statusModalProps.isOpen} onClose={closeModal}>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                <div className="w-[calc(100%-2rem)] max-w-[400px] bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4">
                    <div className={`${config.bgColor} p-4 rounded-full`}>
                        <Icon className={`w-12 h-12 ${config.iconColor}`} />
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-foreground mb-2">{statusModalProps.title}</h3>
                        <p className="text-sm text-muted-foreground">{statusModalProps.message}</p>
                    </div>

                    <div className="w-full flex gap-3 pt-2">
                        {statusModalProps.button2 && (
                            <BtnDefault outline onClick={handleButton2Click} className="flex-1">
                                {statusModalProps.button2.text || "Cancel"}
                            </BtnDefault>
                        )}
                        <BtnDefault 
                            onClick={handleButton1Click} 
                            className={`flex-1 ${statusModalProps.type === "warning" ? "bg-destructive hover:bg-destructive/90" : ""}`}
                        >
                            {statusModalProps.button1?.text || "OK"}
                        </BtnDefault>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}