import { createPortal } from "react-dom";
import { useEffect, useRef, useCallback } from "react";

export default function ModalOverlay({ id, isOpen, onClose, children, forceMount = false }) {
  const modalRef = useRef(null);

  const handleOutsideClick = useCallback(
    (event) => {
      if (modalRef.current && event.target === modalRef.current && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  const handleEscapePress = useCallback(
    (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.addEventListener("click", handleOutsideClick);
      document.addEventListener("keydown", handleEscapePress);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapePress);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, handleOutsideClick, handleEscapePress]);

  if (!isOpen && !forceMount) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div id={id} ref={modalRef} className="w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
