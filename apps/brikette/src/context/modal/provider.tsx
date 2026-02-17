"use client";

// src/context/modal/provider.tsx
/* -------------------------------------------------------------------------- */
/*  Modal provider component                                                  */
/* -------------------------------------------------------------------------- */

import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { fireModalClose, fireModalOpen } from "@/utils/ga4-events";
import { prefetchInteractiveBundlesNow } from "@/utils/prefetchInteractive";

import { ModalContext, type ModalContextValue, type ModalProviderProps, type ModalType } from "./context";
import { useModalEscapeKey } from "./effects/useModalEscapeKey";
import { useModalI18nPreload } from "./effects/useModalI18nPreload";
import { useModalScrollLock } from "./effects/useModalScrollLock";
import { ensureDocument, getDocument } from "./environment";
import { GlobalModals } from "./global-modals";

// ---------------------------------------------------------------------------
// Single-host invariant guard
// Detects a nested ModalProvider by reading the parent context value.
// Fires a console.error in dev/test so errors surface without crashing SSR.
// ---------------------------------------------------------------------------
function useModalHostInvariant(): void {
  const parentCtx = useContext(ModalContext);
  useEffect(() => {
    if (parentCtx !== null) {

      // Developer invariant logger — not user-facing, exempt from i18n
      // i18n-exempt -- BRIK-0 [ttl=2026-12-31]
      // eslint-disable-next-line no-console -- BRIK-0 internal invariant
      console.error(
        "[ModalProvider] Invariant: nested ModalProvider detected. " + // i18n-exempt -- BRIK-0 [ttl=2026-12-31]
          "Brikette must have exactly one ModalProvider in the tree. " +
          "Check AppLayout for accidental double-mounting. " +
          "(TASK-05 — brikette-modal-system-remake)", // i18n-exempt -- BRIK-0 [ttl=2026-12-31]
      );
    }
  }, [parentCtx]);
}

ensureDocument();

function extractModalSource(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const maybeSource = (data as { source?: unknown }).source;
  return typeof maybeSource === "string" ? maybeSource : undefined;
}

export function ModalProvider({ children }: ModalProviderProps): JSX.Element {
  useModalHostInvariant();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<unknown>(null);
  const activeModalRef = useRef<ModalType>(null);
  const modalDataRef = useRef<unknown>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback((type: Exclude<ModalType, null>, data: unknown = null): void => {
    if (type !== "language") {
      void prefetchInteractiveBundlesNow();
    }
    const targetDocument = getDocument();
    const activeElement = targetDocument?.activeElement;
    if (activeElement instanceof HTMLElement) {
      lastFocusedRef.current = activeElement;
    }
    activeModalRef.current = type;
    modalDataRef.current = data;
    fireModalOpen({ modalType: type, source: extractModalSource(data) });
    setActiveModal(type);
    setModalData(data);
  }, []);

  const closeModal = useCallback((): void => {
    const closingType = activeModalRef.current;
    if (closingType) {
      fireModalClose({ modalType: closingType, source: extractModalSource(modalDataRef.current) });
    }
    setActiveModal(null);
    setModalData(null);
    activeModalRef.current = null;
    modalDataRef.current = null;
    lastFocusedRef.current?.focus?.();
    lastFocusedRef.current = null;
  }, []);

  // --- Effect modules (TASK-06 decomposition) ---
  useModalI18nPreload();
  useModalEscapeKey(activeModal, closeModal);
  useModalScrollLock(activeModal);

  const contextValue: ModalContextValue = {
    activeModal,
    modalData,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {getDocument() && <GlobalModals />}
    </ModalContext.Provider>
  );
}
