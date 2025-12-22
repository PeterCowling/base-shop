/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/context/modal/hooks.ts
/* -------------------------------------------------------------------------- */
/*  Hooks for accessing the modal context                                     */
/* -------------------------------------------------------------------------- */

import { useContext } from "react";
import { ModalContext, ssrStub, type ModalContextValue } from "./context";

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (ctx) return ctx;
  if (typeof window === "undefined") return ssrStub;
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
