"use client";

import { useEffect, useState } from "react";

interface Props {
  width?: string;
  height?: string;
  /** Trigger mode for the modal */
  trigger?: "load" | "delay" | "exit";
  /** Delay in ms before showing when trigger is "delay" */
  delay?: number;
  /** HTML content rendered inside the modal */
  content?: string;
}

export default function PopupModal({
  width = "400px",
  height = "300px",
  trigger = "load",
  delay = 0,
  content = "",
}: Props) {
  const [open, setOpen] = useState(trigger === "load" && delay === 0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (trigger === "delay") {
      timer = setTimeout(() => setOpen(true), delay);
    } else if (trigger === "exit") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          setOpen(true);
          document.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    } else {
      setOpen(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [trigger, delay]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

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
        {content && (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
        <button
          type="button"
          aria-label="Close"
          className="absolute right-2 top-2 text-xl"
          onClick={() => setOpen(false)}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

