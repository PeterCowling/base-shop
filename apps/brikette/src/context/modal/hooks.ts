 
// src/context/modal/hooks.ts
/* -------------------------------------------------------------------------- */
/*  Hooks for accessing the modal context                                     */
/* -------------------------------------------------------------------------- */

import { useContext } from "react";

import { ModalContext, type ModalContextValue,ssrStub } from "./context";

type ModalTestGlobals = {
  __VITEST_ENV__?: boolean;
  __TEST_FORCE_SSR__?: boolean;
};

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (ctx) return ctx;
  const globals =
    typeof globalThis !== "undefined" ? (globalThis as typeof globalThis & ModalTestGlobals) : undefined;
  const forceTestSsr = globals?.__VITEST_ENV__ === true && globals?.__TEST_FORCE_SSR__ === true;
  if (forceTestSsr) return ssrStub;
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
