import { createPortal } from "react-dom";
import { useEffect, useRef, useCallback } from "react";

export default function ModalOverlay({ id, isOpen, onClose, children, forceMount = false }) {
  const modalRef = useRef(null);

  const handleOutsideClick = useCallback((event) => {
    if (modalRef.current && event.target === modalRef.current && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleEscapePress = useCallback((event) => {
    if (event.key === "Escape" && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        id={id} 
        ref={modalRef} 
        className="relative z-[10000] w-full max-w-[600px] max-h-[90vh] overflow-y-auto m-4"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}