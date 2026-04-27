// resources/js/Components/Form/SolveForm.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function SolveForm({ isOpen, onClose, reportId }) {
  const { setStatusModalProps } = useStatusModal();
  const [solvePhoto, setSolvePhoto] = useState(null);
  const [solvePhotoPreview, setSolvePhotoPreview] = useState(null);
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

  const handleSolveSubmit = () => {
    if (!solvePhoto) {
      showStatusModal("error", "Error", "Please upload photo after");
      return;
    }
    
    setProcessing(true);
    const formData = new FormData();
    formData.append('photo_after', solvePhoto);
    
    router.post(`/reports/${reportId}/solve`, formData, {
      onSuccess: () => {
        showStatusModal("success", "Success", "Report has been solved");
        setSolvePhoto(null);
        setSolvePhotoPreview(null);
        onClose();
        setTimeout(() => {
          router.reload();
        }, 1500);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.errors?.photo_after?.[0] 
          || error.response?.data?.message 
          || "Failed to solve report";
        showStatusModal("error", "Error", errorMessage);
        setProcessing(false);
      }
    });
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-foreground">Solve Report</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground mb-1.5 block">
              Photo After <span className="text-destructive">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSolvePhoto(file);
                  setSolvePhotoPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-[13.5px] bg-background focus:border-primary outline-none"
            />
            {solvePhotoPreview && (
              <img src={solvePhotoPreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
            )}
          </div>
          <div className="flex gap-3">
            <BtnDefault outline onClick={onClose} className="flex-1">Cancel</BtnDefault>
            <BtnDefault onClick={handleSolveSubmit} loading={processing} className="flex-[2]">Submit</BtnDefault>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}