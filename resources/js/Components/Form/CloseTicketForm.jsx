// resources/js/Components/Form/CloseTicketForm.jsx
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX, HiOutlinePhotograph } from "react-icons/hi";

export default function CloseTicketForm({ isOpen, onClose, report }) {
    const { setStatusModalProps } = useStatusModal();
    const [closePhoto, setClosePhoto] = useState(null);
    const [closePhotoPreview, setClosePhotoPreview] = useState(null);
    const [closeComment, setCloseComment] = useState("");
    const [processing, setProcessing] = useState(false);
    const reportId = report?.id;
    const issueText = report?.issue?.trim() || "-";
    const areaLabel = report?.area?.area ?? "-";
    const activityLabel = report?.sub_activity?.name ?? report?.activity_type?.name ?? report?.activity ?? "-";

    useEffect(() => {
        if (!isOpen) {
            setClosePhoto(null);
            setClosePhotoPreview(null);
            setCloseComment("");
            setProcessing(false);
        }
    }, [isOpen]);

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const handleCloseSubmit = () => {
        if (!reportId) {
            showStatusModal("error", "Error", "Report ID tidak valid. Silakan tutup dan buka kembali form.");
            return;
        }

        if (!closeComment.trim()) {
            showStatusModal("error", "Error", "Please add a closing comment");
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append("close_comment", closeComment.trim());

        if (closePhoto) {
            formData.append("photo_after", closePhoto);
        }

        const url = route ? route("reports.close", reportId) : `/reports/${reportId}/close`;

        router.post(url, formData, {
            onSuccess: () => {
                showStatusModal("success", "Success", "Ticket has been closed");
                setClosePhoto(null);
                setClosePhotoPreview(null);
                setCloseComment("");
                onClose();
                setTimeout(() => {
                    router.reload();
                }, 1500);
            },
            onError: (errors) => {
                console.error("Close ticket error:", errors);
                const errorMessage = errors.close_comment || errors.photo_after || errors.response?.data?.message || "Failed to close ticket";
                showStatusModal("error", "Error", errorMessage);
                setProcessing(false);
            },
        });
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-border bg-card shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
                            Close Ticket {reportId ? `#${reportId}` : ""}
                        </h2>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                            Review the issue, add a closing note, then optionally attach evidence.
                        </p>
                    </div>
                    <button onClick={onClose} className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-3 rounded-2xl border border-border bg-background px-4 py-3 sm:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Area</p>
                                <p className="mt-1 text-sm font-medium text-foreground">{areaLabel}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity</p>
                                <p className="mt-1 text-sm font-medium text-foreground">{activityLabel}</p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[12.5px] font-semibold text-foreground">Reported Issue</label>
                            <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 text-foreground whitespace-pre-wrap">
                                {issueText}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[12.5px] font-semibold text-foreground">
                                Closing Comment <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                value={closeComment}
                                onChange={(e) => setCloseComment(e.target.value)}
                                rows={6}
                                placeholder="Write the resolution, action taken, and any follow-up notes"
                                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="block text-[12.5px] font-semibold text-foreground">
                                    Closing Photo <span className="font-normal text-muted-foreground">(optional)</span>
                                </label>
                                <label
                                    htmlFor="photo_after"
                                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    <HiOutlinePhotograph className="h-3.5 w-3.5" />
                                    Upload
                                </label>
                            </div>

                            <input
                                id="photo_after"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setClosePhoto(file);
                                        setClosePhotoPreview(URL.createObjectURL(file));
                                    }
                                }}
                                className="hidden"
                            />

                            <div
                                className="overflow-hidden rounded-xl border border-dashed bg-muted/40"
                                style={{
                                    borderColor: closePhotoPreview ? "var(--primary)" : "var(--border)",
                                }}
                            >
                                {closePhotoPreview ? (
                                    <img src={closePhotoPreview} alt="Preview" className="h-32 w-full object-cover" />
                                ) : (
                                    <div className="flex min-h-[112px] items-center justify-center px-4 py-6 text-center text-muted-foreground">
                                        <div>
                                            <HiOutlinePhotograph className="mx-auto mb-2 h-8 w-8 opacity-35" />
                                            <span className="text-[12px]">No photo uploaded</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {closePhoto && <p className="mt-2 truncate text-[11.5px] text-muted-foreground">{closePhoto.name}</p>}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                            <BtnDefault outline onClick={onClose} className="w-full sm:w-auto sm:min-w-[116px]">
                                Cancel
                            </BtnDefault>
                            <BtnDefault onClick={handleCloseSubmit} loading={processing} className="w-full sm:w-auto sm:min-w-[168px]">
                                {processing ? "Closing..." : "Close Ticket"}
                            </BtnDefault>
                        </div>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
