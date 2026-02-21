
// src/context/modal/hooks.ts
/* -------------------------------------------------------------------------- */
/*  Hooks for accessing the modal context                                     */
/* -------------------------------------------------------------------------- */

import { useContext } from "react";

import { ModalContext, type ModalContextValue, ssrStub } from "./context";
import type { ModalPayloadMap } from "./payloadMap";

type ModalTestGlobals = {
  __VITEST_ENV__?: boolean;
  __TEST_FORCE_SSR__?: boolean;
};

// ---------------------------------------------------------------------------
// Typed openModal — compile-time enforcement of payload shapes.
//
// No-payload modals (undefined in ModalPayloadMap) accept an optional
// undefined second arg so callers can omit it:
//   openModal("language")           ← OK
//   openModal("language", undefined) ← also OK
//
// Payload modals require the typed payload:
//   openModal("booking2", { checkIn: "2026-06-01", ... })
//   openModal("booking2")            ← TS error: payload required
//   openModal("booking2", { bad: 1 }) ← TS error: invalid field
// ---------------------------------------------------------------------------

type NoPayloadKeys = {
  [K in keyof ModalPayloadMap]: ModalPayloadMap[K] extends undefined ? K : never;
}[keyof ModalPayloadMap];

type PayloadKeys = {
  [K in keyof ModalPayloadMap]: ModalPayloadMap[K] extends undefined ? never : K;
}[keyof ModalPayloadMap];

export type TypedOpenModal = {
  <K extends NoPayloadKeys>(key: K, payload?: undefined): void;
  // payload is optional because all current payload interfaces have all-optional fields.
  // TypeScript still enforces that any provided fields match the declared shape.
  <K extends PayloadKeys>(key: K, payload?: ModalPayloadMap[K]): void;
};

/** Brikette-typed modal context — openModal is payload-safe at call sites */
export interface TypedModalContextValue extends Omit<ModalContextValue, "openModal"> {
  openModal: TypedOpenModal;
}

function makeTypedContextValue(ctx: ModalContextValue): TypedModalContextValue {
  const openModal: TypedOpenModal = (key: string, payload?: unknown) =>
    ctx.openModal(key as Parameters<typeof ctx.openModal>[0], payload);
  return { ...ctx, openModal };
}

export function useModal(): TypedModalContextValue {
  const ctx = useContext(ModalContext);
  if (ctx) return makeTypedContextValue(ctx);
  const globals =
    typeof globalThis !== "undefined" ? (globalThis as typeof globalThis & ModalTestGlobals) : undefined;
  const forceTestSsr = globals?.__VITEST_ENV__ === true && globals?.__TEST_FORCE_SSR__ === true;
  if (forceTestSsr) return makeTypedContextValue(ssrStub);
  if (typeof window === "undefined") return makeTypedContextValue(ssrStub);
  throw new Error("useModal must be used inside <ModalProvider />");
}

/**
 * Optional variant: returns a safe no-op stub when the provider
 * is absent (e.g., in isolated tests or lightweight pages that
 * don't require modals).
 */
export function useOptionalModal(): TypedModalContextValue {
  const ctx = useContext(ModalContext);
  return makeTypedContextValue(ctx ?? ssrStub);
}

/**
 * Typed payload accessor for modal consumer components.
 *
 * Returns the typed payload for the specified modal key when that modal is
 * active, otherwise null. Consumers should only call this from inside the
 * GlobalModal component for the matching key.
 *
 * Example:
 *   const payload = useModalPayload("booking2");
 *   // payload is Booking2Payload | null
 */
export function useModalPayload<K extends keyof ModalPayloadMap>(
  key: K,
): ModalPayloadMap[K] | null {
  const { activeModal, modalData } = useModal();
  if (activeModal !== key) return null;
  // Trust that the typed openModal producer has set the correct payload shape.
  return modalData as ModalPayloadMap[K] | null;
}
