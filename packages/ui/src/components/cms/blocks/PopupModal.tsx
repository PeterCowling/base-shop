"use client";

import { useEffect, useState } from "react";

interface Props {
  width?: string;
  height?: string;
  /** Controls when the modal opens */
  trigger?: "delay" | "exitIntent";
  /** Delay in ms before showing when trigger is "delay" */
  delay?: number;
  /** HTML string or plain text to render inside the modal */
  content?: string;
}

export default function PopupModal({
  width = "400px",
  height = "300px",
  trigger = "delay",
  delay = 0,
  content,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (trigger === "delay") {
      const timer = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(timer);
    }
    if (trigger === "exitIntent") {
      const handleMouseOut = (e: MouseEvent) => {
        if (!e.relatedTarget && e.clientY <= 0) {
          setOpen(true);
        }
      };
      document.addEventListener("mouseout", handleMouseOut);
      return () => document.removeEventListener("mouseout", handleMouseOut);
    }
  }, [trigger, delay]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative bg-white p-4"
        style={{ width, height }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-2 top-2"
        >
          &times;
        </button>
        {content && (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
}

