import { router } from "@inertiajs/react";
import { showGlobalStatusModal } from "@/Components/Context/StatusModalContext";
import { configureErrorMessages, getResponseError } from "@/lib/errorMessages";

let isInitialized = false;

const handleFlash = (flash) => {
    if (!flash) return;
    const type = ["error", "warning", "success", "info"].find((key) => flash[key]);
    if (!type) return;
    const titles = { error: "Perhatian", warning: "Peringatan", success: "Berhasil", info: "Informasi" };
    showGlobalStatusModal({ type, title: titles[type], message: flash[type], button1: { text: "OK" } });
};

export const setupInertiaInterceptors = (initialProps) => {
    configureErrorMessages(initialProps?.initialPage?.props?.messages);
    if (isInitialized) return;
    isInitialized = true;

    // The provider consumes this after mounting, including on the first visit.
    handleFlash(initialProps?.initialPage?.props?.flash);

    router.on("success", (event) => {
        configureErrorMessages(event.detail.page.props.messages);
        handleFlash(event.detail.page.props.flash);
    });

    router.on("invalid", (event) => {
        event.preventDefault();
        const response = event.detail?.response;
        const { title, message } = getResponseError(response);
        showGlobalStatusModal({
            type: "error", title, message,
            button1: response?.status === 419
                ? { text: "Muat Ulang", onClick: () => window.location.reload() }
                : { text: "OK" },
        });
    });

    router.on("exception", (event) => {
        event.preventDefault();
        const { title, message } = getResponseError(event.detail?.exception?.response);
        showGlobalStatusModal({ type: "error", title, message, button1: { text: "OK" } });
    });
};
