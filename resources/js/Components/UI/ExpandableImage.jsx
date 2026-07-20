import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { HiOutlineX } from "react-icons/hi";

const ExpandableImage = ({ src, alt, className, style, onClick, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [zoomDirection, setZoomDirection] = useState("in");
  const [transformOrigin, setTransformOrigin] = useState("center center");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
    if (e.defaultPrevented) return;
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const percentX = (offsetX / rect.width) * 100;
    const percentY = (offsetY / rect.height) * 100;
    setTransformOrigin(`${percentX}% ${percentY}%`);

    const delta = e.deltaY;
    setScale((prev) => {
      const newScale = prev - delta * 0.001;
      const clamped = Math.min(Math.max(newScale, 1), 5);
      setZoomDirection(delta < 0 ? "in" : "out");
      return clamped;
    });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      <img
        src={src}
        alt={alt || "Image"}
        className={`cursor-pointer ${className || ""}`}
        style={{ ...style }}
        onClick={handleClick}
        {...props}
      />

      {isOpen && typeof window !== "undefined" && createPortal(
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
          <div
            className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-[9999]"
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              onMouseDown={handleMouseDown}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: transformOrigin,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
                cursor: isDragging ? "grabbing" : zoomDirection === "in" ? "zoom-in" : "zoom-out",
              }}
            >
              <img
                src={src}
                alt={alt || "Image"}
                className="w-auto h-auto object-contain select-none pointer-events-none"
                style={{ objectFit: "contain", maxWidth: "90vw", maxHeight: "90vh" }}
                draggable={false}
              />
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 left-4 text-white hover:opacity-80 transition-opacity"
            >
              <HiOutlineX className="w-6 h-6 md:w-10 md:h-10" />
            </button>
          </div>
        </ModalOverlay>,
        document.body
      )}
    </>
  );
};

export default ExpandableImage;
