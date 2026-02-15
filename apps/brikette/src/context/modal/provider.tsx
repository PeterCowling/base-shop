"use client";

// src/context/modal/provider.tsx
/* -------------------------------------------------------------------------- */
/*  Modal provider component                                                  */
/* -------------------------------------------------------------------------- */

import { useCallback, useEffect, useRef, useState } from "react";

import { fireModalClose, fireModalOpen } from "@/utils/ga4-events";
import { prefetchInteractiveBundlesNow } from "@/utils/prefetchInteractive";

import { ModalContext, type ModalContextValue, type ModalProviderProps, type ModalType } from "./context";
import { ensureDocument } from "./environment";
import { GlobalModals } from "./global-modals";

ensureDocument();

const getDocument = (): (Document | DocumentShim) | undefined => {
  if (typeof globalThis === "undefined") return undefined;
  const maybeDocument = ensureDocument();
  return maybeDocument ?? undefined;
};

type ShimBodyElement = HTMLElement | DocumentShim["body"];

const getDocumentBody = (): ShimBodyElement | null => {
  const targetDocument = getDocument();
  if (!targetDocument) return null;
  const body = targetDocument.body;
  if (!body) return null;
  if (body instanceof HTMLElement) {
    return body;
  }
  return body as DocumentShim["body"];
};

function extractModalSource(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const maybeSource = (data as { source?: unknown }).source;
  return typeof maybeSource === "string" ? maybeSource : undefined;
}

export function ModalProvider({ children }: ModalProviderProps): JSX.Element {
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
