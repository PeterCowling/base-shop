"use client";

import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";
import { createFocusTrap } from "focus-trap";

interface Props {
  width?: string;
  height?: string;
  /** Trigger mode for the modal */
  trigger?: "load" | "delay" | "exit";
  /** Delay in ms before showing when trigger is "delay" */
  delay?: number;
  /** HTML content rendered inside the modal */
  content?: string;
  /** Frequency cap bucket key (localStorage), e.g. "newsletter-popup" */
  frequencyKey?: string;
  /** Maximum shows within cool-off window; default 1 */
  maxShows?: number;
  /** Cool-off period in days; default 7 */
  coolOffDays?: number;
  /** Cookie name that must equal the given value to allow showing (consent gate) */
  consentCookieName?: string;
  /** Required cookie value for consent gate; default "true" */
  consentRequiredValue?: string;
}

export default function PopupModal({
  width = "400px",
  height = "300px",
  trigger = "load",
  delay = 0,
  content = "",
  frequencyKey = "default",
  maxShows = 1,
  coolOffDays = 7,
  consentCookieName,
  consentRequiredValue = "true",
}: Props) {
  const [open, setOpen] = useState(false);
  const sanitized = DOMPurify.sanitize(content);
  const modalRef = useRef<HTMLDivElement>(null);

  const allowedByConsent = () => {
    if (!consentCookieName) return true;
    try {
      const m = document.cookie.match(new RegExp("(?:^|; )" + consentCookieName.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
      const v = m ? decodeURIComponent(m[1]) : null;
      return v === consentRequiredValue;
    } catch {
      return false;
    }
  };

  const allowedByFrequency = () => {
    try {
      const raw = localStorage.getItem(`pb:popup:${frequencyKey}`);
      if (!raw) return true;
      const data = JSON.parse(raw) as { last: number; count: number };
      const ms = (coolOffDays || 7) * 864e5;
      const withinWindow = Date.now() - data.last < ms;
      if (!withinWindow) return true;
      return (data.count ?? 0) < (maxShows || 1);
    } catch {
      return true;
    }
  };

  const recordShow = () => {
    try {
      const raw = localStorage.getItem(`pb:popup:${frequencyKey}`);
      const prev = raw ? (JSON.parse(raw) as { last: number; count: number }) : { last: 0, count: 0 };
      const next = { last: Date.now(), count: (prev.count ?? 0) + 1 };
      localStorage.setItem(`pb:popup:${frequencyKey}`, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const maybeOpen = () => {
      if (!allowedByConsent()) return;
      if (!allowedByFrequency()) return;
      setOpen(true);
      recordShow();
    };
    if (trigger === "delay") {
      timer = setTimeout(maybeOpen, delay);
    } else if (trigger === "exit") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          maybeOpen();
          document.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    } else {
      // load
      maybeOpen();
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

  useEffect(() => {
    if (!open || !modalRef.current) return;
    const trap = createFocusTrap(modalRef.current, {
      escapeDeactivates: false,
      allowOutsideClick: true,
      fallbackFocus: modalRef.current,
      tabbableOptions: {
        displayCheck: "none",
      },
    });
    trap.activate();
    return () => {
      trap.deactivate();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Popup modal"
        className="relative bg-white p-4 shadow-elevation-4"
        style={{ width, height }}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        {content && (
          <div dangerouslySetInnerHTML={{ __html: sanitized }} />
        )}
        <button
          type="button"
          aria-label="Close"
          className="absolute end-2 top-2 text-xl"
          onClick={() => setOpen(false)}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
