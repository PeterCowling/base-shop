"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Dialog, DialogContent } from "../../atoms/shadcn";

interface Props {
  width?: string;
  height?: string;
  trigger?: "delay" | "exitIntent";
  /** Delay in ms when trigger is set to `delay` */
  delay?: number;
  /** HTML content to display inside the modal */
  content?: string;
}

export default function PopupModal({
  width,
  height,
  trigger,
  delay = 1000,
  content,
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
          document.removeEventListener("mouseout", handleMouseLeave);
        }
      };
      document.addEventListener("mouseout", handleMouseLeave);
      return () => document.removeEventListener("mouseout", handleMouseLeave);
    }
  }, [trigger, delay]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent style={{ width, height }}>
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content ?? "") }}
        />
      </DialogContent>
    </Dialog>
  );
}

