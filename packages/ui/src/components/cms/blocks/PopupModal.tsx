"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Width of the modal in pixels */
  width?: number;
  /** Height of the modal in pixels */
  height?: number;
  /** How the modal should be triggered */
  trigger?: "delay" | "exitIntent";
  /** Delay in ms before showing when using the delay trigger */
  delay?: number;
  /** HTML content shown inside the modal */
  content?: string;
}

export default function PopupModal({
  width = 400,
  height = 300,
  trigger = "delay",
  delay = 1000,
  content = "",
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (trigger === "delay") {
      const t = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(t);
    }
    if (trigger === "exitIntent") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          setOpen(true);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
    // default: show immediately
    setOpen(true);
  }, [trigger, delay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative bg-white p-4 shadow-lg"
        style={{ width, height }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute right-2 top-2"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        {content && <div dangerouslySetInnerHTML={{ __html: content }} />}
      </div>
    </div>
  );
}

