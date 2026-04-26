import { useEffect } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineXCircle } from "react-icons/hi";
import ModalOverlay from "./ModalOverlay";
import BtnDefault from "../Button/BtnDefault";

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
    }
};

export default function StatusModal({ isOpen, onClose, type = "success", title, message, redirectUrl = null, btnText = "OK" }) {
    const config = statusConfig[type] || statusConfig.success;
    const Icon = config.icon;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleClose = () => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-[calc(100%-2rem)] max-w-[400px] bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4">
                    <div className={`${config.bgColor} p-4 rounded-full`}>
                        <Icon className={`w-12 h-12 ${config.iconColor}`} />
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>

                    <div className="w-full pt-2">
                        <BtnDefault onClick={handleClose} fullWidth>
                            {btnText}
                        </BtnDefault>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}