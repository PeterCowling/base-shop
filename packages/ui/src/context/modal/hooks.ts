// src/context/modal/hooks.ts
/* -------------------------------------------------------------------------- */
/*  Hooks for accessing the modal context                                     */
/* -------------------------------------------------------------------------- */

import { useContext } from "react";

import { ModalContext, type ModalContextValue,ssrStub } from "./context";

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (ctx) return ctx;
  if (typeof window === "undefined") return ssrStub;
  // i18n-exempt -- UI-1000 [ttl=2026-12-31] Developer error message.
  throw new Error("useModal must be used inside <ModalProvider />");
}

/**
 * Optional variant: returns a safe no-op stub when the provider
 * is absent (e.g., in isolated tests or lightweight pages that
 * don't require modals).
 */
export function useOptionalModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  return ctx ?? ssrStub;
}
