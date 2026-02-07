"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { createFocusTrap } from "focus-trap";

import { Dialog, DialogContent, DialogDescription,DialogTitle } from "../../atoms";

interface Props {
  width?: string;
  height?: string;
  /** Trigger mode for the modal */
  trigger?: "load" | "delay" | "exit";
  /** Open immediately on first render (test-friendly) */
  autoOpen?: boolean;
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
  autoOpen = false,
  delay = 0,
  content = "",
  frequencyKey,
  maxShows = 1,
  coolOffDays = 7,
  consentCookieName,
  consentRequiredValue = "true",
}: Props) {
  const [open, setOpen] = useState<boolean>(autoOpen);
  const sanitized = DOMPurify.sanitize(content);
  const modalRef = useRef<HTMLDivElement>(null);
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const assignModalRef = useCallback((node: HTMLDivElement | null) => {
    modalRef.current = node;
    setContentNode(node);
  }, []);

  const allowedByConsent = useCallback(() => {
    if (!consentCookieName) return true;
    try {
      // Safer cookie parsing without dynamic RegExp
      const parts = document.cookie.split("; ");
      for (const part of parts) {
        const [k, v] = part.split("=");
        if (decodeURIComponent(k) === consentCookieName) {
          return decodeURIComponent(v ?? "") === consentRequiredValue;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [consentCookieName, consentRequiredValue]);

  const allowedByFrequency = useCallback(() => {
    if (!frequencyKey) return true;
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
  }, [frequencyKey, coolOffDays, maxShows]);

  const recordShow = useCallback(() => {
    if (!frequencyKey) return;
    try {
      const raw = localStorage.getItem(`pb:popup:${frequencyKey}`);
      const prev = raw ? (JSON.parse(raw) as { last: number; count: number }) : { last: 0, count: 0 };
      const next = { last: Date.now(), count: (prev.count ?? 0) + 1 };
      localStorage.setItem(`pb:popup:${frequencyKey}`, JSON.stringify(next));
    } catch {}
  }, [frequencyKey]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const maybeOpen = () => {
      if (!allowedByConsent()) return;
      if (!allowedByFrequency()) return;
      setOpen(true);
      recordShow();
    };
    if (autoOpen) {
      // Already opened via initial state; do nothing
    } else if (trigger === "delay") {
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
  }, [autoOpen, trigger, delay, allowedByConsent, allowedByFrequency, recordShow]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !contentNode) return;
    const container = contentNode.parentElement;
    if (!container) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contentNode.contains(target)) {
        return;
      }
      setOpen(false);
    };
    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, [open, contentNode]);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={assignModalRef}
        // Scope width/height to content; DialogContent already provides relative positioning and z-index
        className="p-4"
        style={{ width, height }}
        onPointerDownOutside={() => setOpen(false)}
        onInteractOutside={() => setOpen(false)}
      >
        {/*
          Radix requires a DialogTitle for a11y. Render a visually-hidden
          title/description so screen readers have context without imposing
          UI requirements on content authored via CMS HTML.
        */}
        <DialogTitle className="sr-only">Popup Modal</DialogTitle>
        {content ? (
          <DialogDescription asChild>
            <div dangerouslySetInnerHTML={{ __html: sanitized }} />
          </DialogDescription>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
