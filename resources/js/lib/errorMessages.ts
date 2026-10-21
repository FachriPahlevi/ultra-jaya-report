type Message = { title: string; message: string };
type Catalog = Record<string, Message | string>;
type ErrorResponse = {
    status?: number;
    data?: { user_message?: boolean; title?: string; message?: string; errors?: Record<string, string[]> } | string;
};

let messages: Catalog = {};

export function configureErrorMessages(catalog: Catalog = {}): void {
    messages = catalog;
}

export function getErrorMessage(key: string): Message {
    const entry = messages[key] ?? messages.fallback;
    if (entry && typeof entry === "object") return entry;
    // Last resort when no backend response/catalog is available.
    return { title: "Terjadi Kesalahan", message: "Permintaan tidak dapat diproses. Silakan coba kembali." };
}

export function getPhotoSizeMessage(): string {
    const entry = messages.photo_too_large;
    return typeof entry === "string" ? entry : getErrorMessage("413").message;
}

export function getResponseError(response?: ErrorResponse): Message {
    const fallback = getErrorMessage(response?.status ? String(response.status) : "network");
    const data = response?.data;
    if (typeof data === "object" && data?.user_message === true && typeof data.message === "string") {
        return { title: typeof data.title === "string" ? data.title : fallback.title, message: data.message };
    }
    if (typeof data === "string" && typeof DOMParser !== "undefined") {
        const document = new DOMParser().parseFromString(data, "text/html");
        const title = document.querySelector('meta[name="app-error-title"]')?.getAttribute("content");
        const message = document.querySelector('meta[name="app-error-message"]')?.getAttribute("content");
        if (title && message) return { title, message };
    }
    return fallback;
}

export function getRequestErrorMessage(error: { response?: ErrorResponse }): string {
    return getResponseError(error.response).message;
}
