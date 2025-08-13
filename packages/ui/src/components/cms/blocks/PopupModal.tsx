import { useEffect, useState } from "react";

interface PopupModalProps {
  width?: number;
  height?: number;
  /**
   * Determines how the popup is triggered. If set to `delay` the modal
   * will appear after the specified `delay` (in ms). If set to
   * `exit-intent`, the modal will appear when the user's mouse leaves
   * the viewport.
   */
  trigger?: "delay" | "exit-intent";
  /** Delay in milliseconds used when trigger is `delay`. */
  delay?: number;
  /** HTML string rendered inside the modal. */
  content?: string;
}

export default function PopupModal({
  width = 400,
  height = 300,
  trigger,
  delay = 0,
  content,
}: PopupModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (trigger === "delay") {
      const timer = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(timer);
    }

    if (trigger === "exit-intent") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          setOpen(true);
        }
      };

      document.addEventListener("mouseout", handleMouseLeave);
      return () => document.removeEventListener("mouseout", handleMouseLeave);
    }

    // Default behaviour: show immediately
    setOpen(true);
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
          className="absolute right-2 top-2"
          aria-label="Close modal"
        >
          ×
        </button>
        {content ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : null}
      </div>
    </div>
  );
}

