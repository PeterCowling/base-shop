// src/context/modal/effects/useModalEscapeKey.ts
/* -------------------------------------------------------------------------- */
/*  Effect: close modal on Escape key press                                   */
/* -------------------------------------------------------------------------- */

import { useEffect } from "react";

import { getDocument } from "../environment";

/**
 * Closes the active modal when the user presses Escape.
 * Extracted from ModalProvider as a dedicated effect module (TASK-06).
 */
export function useModalEscapeKey(activeModal: unknown, closeModal: () => void): void {
  useEffect(() => {
    const targetDocument = getDocument();
    if (typeof targetDocument?.addEventListener !== "function") return;

    const onKey: EventListener = (event) => {
      if ("key" in event && (event as KeyboardEvent).key === "Escape" && activeModal) {
        closeModal();
      }
    };

    targetDocument.addEventListener("keydown", onKey);
    return () => targetDocument.removeEventListener?.("keydown", onKey);
  }, [activeModal, closeModal]);
}
