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
        borderColor: "border-green-200",
        primaryVariant: "primary",
    },
    error: {
        icon: HiOutlineXCircle,
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        primaryVariant: "danger",
    },
    warning: {
        icon: HiOutlineExclamationCircle,
        iconColor: "text-amber-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        primaryVariant: "danger",
    },
    info: {
        icon: HiOutlineInformationCircle,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        primaryVariant: "primary",
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
    const button1Variant = statusModalProps.button1?.variant || config.primaryVariant || "primary";
    const button2Variant = statusModalProps.button2?.variant || "outline";

    return (
        <ModalOverlay isOpen={statusModalProps.isOpen} onClose={closeModal}>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                <div className="w-[calc(100%-2rem)] max-w-[420px] rounded-[28px] border border-border bg-white p-6 shadow-xl">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`${config.bgColor} rounded-full p-4`}>
                        <Icon className={`w-12 h-12 ${config.iconColor}`} />
                        </div>

                        <div>
                            <h3 className="mb-2 text-lg font-bold text-foreground">{statusModalProps.title}</h3>
                            <p className="text-sm leading-6 text-muted-foreground">{statusModalProps.message}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        {statusModalProps.button2 && (
                            <BtnDefault variant={button2Variant} onClick={handleButton2Click} className="w-full rounded-xl sm:w-auto sm:min-w-[120px]">
                                {statusModalProps.button2.text || "Cancel"}
                            </BtnDefault>
                        )}
                        <BtnDefault
                            variant={button1Variant}
                            onClick={handleButton1Click}
                            className="w-full rounded-xl sm:w-auto sm:min-w-[140px]"
                        >
                            {statusModalProps.button1?.text || "OK"}
                        </BtnDefault>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
