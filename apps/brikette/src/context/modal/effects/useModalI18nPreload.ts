// src/context/modal/effects/useModalI18nPreload.ts
/* -------------------------------------------------------------------------- */
/*  Effect: preload modal-scoped i18n namespaces on provider mount            */
/* -------------------------------------------------------------------------- */

import { useEffect } from "react";

import i18n from "@/i18n";
import { MODAL_I18N_PRELOAD_NAMESPACES } from "@/i18n.namespaces";

/**
 * Eagerly preloads modal-scoped i18n namespaces so that components like
 * PolicyFeeClarityPanel have translations ready before the booking modal
 * opens for the first time.
 *
 * Policy: modal-scoped (TASK-03 Option B) — not added to CORE_LAYOUT_I18N_NAMESPACES
 * because bookPage would exceed the startup delta budget.
 *
 * Extracted from ModalProvider as a dedicated effect module (TASK-06).
 */
export function useModalI18nPreload(): void {
  useEffect(() => {
    void i18n.loadNamespaces?.([...MODAL_I18N_PRELOAD_NAMESPACES]);
  }, []);
}
