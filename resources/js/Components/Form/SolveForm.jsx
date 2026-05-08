// resources/js/Components/Form/SolveForm.jsx
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX, HiOutlinePhotograph } from "react-icons/hi";

export default function SolveForm({ isOpen, onClose, reportId }) {
  const { setStatusModalProps } = useStatusModal();
  const [solvePhoto, setSolvePhoto] = useState(null);
  const [solvePhotoPreview, setSolvePhotoPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reportToSolve, setReportToSolve] = useState(null);
  console.log(reportId)

  useEffect(() => {
    if (!isOpen) {
      setSolvePhoto(null);
      setSolvePhotoPreview(null);
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

  const openSolveModal = (report) => {
        if (!report || !report.id) {
            console.error("Cannot open solve modal: invalid report", report);
            return;
        }

        setReportToSolve(report);
        setIsSolveModalOpen(true);
    };

    const closeSolveModal = () => {
        setIsSolveModalOpen(false);
        setReportToSolve(null);
    };
  const handleSolveSubmit = () => {
    console.log("handleSolveSubmit called with reportId:", reportId);
    
    // VALIDASI reportId
    if (!reportId) {
      console.error("Report ID is undefined or null");
      showStatusModal("error", "Error", "Report ID tidak valid. Silakan tutup dan buka kembali form.");
      return;
    }

    if (!solvePhoto) {
      showStatusModal("error", "Error", "Please upload photo after");
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append("photo_after", solvePhoto);

    // Gunakan route helper jika tersedia, atau hardcode URL
    const url = route ? route("reports.solve", reportId) : `/reports/${reportId}/solve`;


    router.post(url, formData, {
      onSuccess: () => {
        console.log("Solve success");
        showStatusModal("success", "Success", "Report has been solved");
        setSolvePhoto(null);
        setSolvePhotoPreview(null);
        onClose();
        setTimeout(() => {
          router.reload();
        }, 1500);
      },
      onError: (errors) => {
        console.error("Solve error:", errors);
        const errorMessage = errors.response?.data?.errors?.photo_after?.[0] || 
                           errors.response?.data?.message || 
                           "Failed to solve report";
        showStatusModal("error", "Error", errorMessage);
        setProcessing(false);
      },
    });
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px] mx-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-[-0.5px] m-0">
            Solve Report {reportId ? `#${reportId}` : ''}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md shrink-0" aria-label="Close">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-5">
              <div>
                <label className="text-[13px] font-semibold text-foreground mb-1.5 block">
                  Photo After <span className="text-destructive">*</span>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <label
                    htmlFor="photo_after"
                    className="inline-flex items-center justify-center gap-1.5 bg-accent text-primary px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-primary/20 w-full sm:w-auto"
                  >
                    <HiOutlinePhotograph className="w-3.5 h-3.5" />
                    Upload Photo
                  </label>
                  <input
                    id="photo_after"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log("File selected:", file.name);
                        setSolvePhoto(file);
                        setSolvePhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                <div
                  className="border-2 border-dashed rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center bg-muted transition-colors"
                  style={{
                    borderColor: solvePhotoPreview ? "var(--primary)" : "var(--border)",
                  }}
                >
                  {solvePhotoPreview ? (
                    <img src={solvePhotoPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <HiOutlinePhotograph className="w-9 h-9 mx-auto mb-2 opacity-40" />
                      <span className="text-[12.5px]">Click Upload to add a photo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-1">
                <BtnDefault outline onClick={onClose} className="w-full sm:flex-1 order-2 sm:order-1">
                  Cancel
                </BtnDefault>
                <BtnDefault onClick={handleSolveSubmit} loading={processing} className="w-full sm:flex-[2] order-1 sm:order-2">
                  {processing ? "Submitting..." : "Submit"}
                </BtnDefault>
              </div>
            </div>
        </div>
      </div>
    </ModalOverlay>
  );
}