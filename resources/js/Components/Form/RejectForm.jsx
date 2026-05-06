import { useState } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function RejectForm({ isOpen, onClose, reportId }) {
  const { setStatusModalProps } = useStatusModal();
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    });
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      showStatusModal("error", "Error", "Mohon isi komentar penolakan terlebih dahulu");
      return;
    }

    setProcessing(true);
    router.post(`/reports/${reportId}/reject`, { rejected_comment: comment }, {
      onSuccess: () => {
        showStatusModal("success", "Berhasil", "Laporan berhasil ditolak dan dikembalikan ke penulis");
        setComment("");
        setProcessing(false);
        onClose();
        setTimeout(() => router.reload(), 500);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.errors?.rejected_comment?.[0] || error.response?.data?.message || "Gagal menolak laporan";
        showStatusModal("error", "Error", errorMessage);
        setProcessing(false);
      },
    });
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[520px] mx-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-[-0.5px] m-0">Reject Report</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md shrink-0" aria-label="Close">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-sm text-muted-foreground mb-4">Tambahkan komentar agar pelapor tahu apa yang harus diperbaiki.</div>
          <div>
            <label htmlFor="rejected_comment" className="text-[13px] font-semibold text-foreground mb-1.5 block">
              Komentar Penolakan <span className="text-destructive">*</span>
            </label>
            <textarea
              id="rejected_comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Jelaskan alasan penolakan dan koreksi yang dibutuhkan..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors resize-y min-h-[120px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <BtnDefault outline onClick={handleClose} className="w-full sm:flex-1 order-2 sm:order-1">
              Batal
            </BtnDefault>
            <BtnDefault onClick={handleSubmit} loading={processing} className="w-full sm:flex-[2] order-1 sm:order-2">
              {processing ? "Mengirim..." : "Tolak Laporan"}
            </BtnDefault>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
