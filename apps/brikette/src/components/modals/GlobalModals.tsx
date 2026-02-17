/**
 * @deprecated TASK-05 (brikette-modal-system-remake): This re-export is unused
 * and must not be imported by any Brikette runtime path.
 *
 * The authoritative Brikette modal orchestration stack (TASK-01 Option A):
 *   Host/provider: apps/brikette/src/context/modal/provider.tsx
 *   Switcher:      apps/brikette/src/context/modal/global-modals.tsx
 *   Individual modals: apps/brikette/src/context/modal/global-modals/*.tsx
 *
 * The packages/ui GlobalModals component uses a different booking flow,
 * lacks GA4 analytics wiring, and does not render PolicyFeeClarityPanel
 * or DirectPerksBlock. Importing it from Brikette would silently break
 * conversion tracking and policy disclosure.
 *
 * Removal target: TASK-10 (brikette-modal-system-remake).
 * Guard: ModalProvider dual-mount invariant will fire if this path is
 * somehow activated alongside the app-level provider.
 */
export { default } from "@acme/ui/organisms/GlobalModals";
export { default as GlobalModals } from "@acme/ui/organisms/GlobalModals";
