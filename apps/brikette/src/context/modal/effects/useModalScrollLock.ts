// src/context/modal/effects/useModalScrollLock.ts
/* -------------------------------------------------------------------------- */
/*  Effect: lock body scroll while a modal is open                            */
/* -------------------------------------------------------------------------- */

import { useEffect } from "react";

import { getDocumentBody } from "../environment";

/**
 * Prevents the document body from scrolling while a modal is active.
 * Restores the previous overflow value on close or unmount.
 * Extracted from ModalProvider as a dedicated effect module (TASK-06).
 */
export function useModalScrollLock(activeModal: unknown): void {
  useEffect(() => {
    const body = getDocumentBody();
    if (!body) return;

    if (body instanceof HTMLElement) {
      const { style } = body;
      const previousOverflow = style.overflow;

      if (activeModal) {
        style.overflow = "hidden";
      } else {
        style.overflow = previousOverflow;
      }

      return () => {
        style.overflow = previousOverflow;
      };
    }

    // Shim path (SSR / test)
    const style = body.style as Record<string, string | undefined> | undefined;
    if (!style) return;

    const previousOverflow = style["overflow"] ?? "";

    if (activeModal) {
      style["overflow"] = "hidden";
    } else {
      style["overflow"] = previousOverflow;
    }

    return () => {
      style["overflow"] = previousOverflow;
    };
  }, [activeModal]);
}
