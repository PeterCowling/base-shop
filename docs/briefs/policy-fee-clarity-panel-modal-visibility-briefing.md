---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: UI
Created: 2026-02-17
Last-updated: 2026-02-17
Topic-Slug: policy-fee-clarity-panel-modal-visibility
---

# Policy Fee Clarity Panel - Modal Visibility Briefing

## Executive Summary

`PolicyFeeClarityPanel` was wired into `BookingModal2` correctly, but it was hidden by two immediate defects: viewport clipping and late `bookPage` namespace loading. Those defects were fixed on 2026-02-17.

A deeper audit confirms your concern: this was only a surface symptom. The current modal system has systemic issues (typed contract gaps, duplicated orchestration layers, inconsistent booking semantics, i18n lifecycle coupling, and thin integration coverage) that make regressions likely.

## Questions Answered

- Q1: Is `PolicyFeeClarityPanel` wired into the booking modal? Yes - passed as `extraContent` in `Booking2GlobalModal`.
- Q2: Did `BookingModal2` render `extraContent`? Yes - rendered in `BookingModal2` when provided.
- Q3: Why was the panel invisible? Two bugs: clipped modal card + `bookPage` namespace race.
- Q4: Were required `bookPage.policies.*` keys present? Yes.
- Q5: Is modal architecture currently robust? No.
- Q6: Is a remake justified? Yes, at the orchestration/contract layer.

## High-Level Architecture

- App orchestration stack:
  - `apps/brikette/src/context/modal/provider.tsx`
  - `apps/brikette/src/context/modal/global-modals.tsx`
  - `apps/brikette/src/context/modal/global-modals/*.tsx`
- UI package orchestration stack (parallel implementation):
  - `packages/ui/src/context/modal/provider.tsx`
  - `packages/ui/src/organisms/GlobalModals.tsx`
- Shared modal components:
  - `packages/ui/src/organisms/modals/*.tsx`
  - `packages/ui/src/organisms/modals/primitives.tsx`
- i18n infrastructure:
  - `apps/brikette/src/i18n.namespaces.ts`
  - `apps/brikette/src/i18n.ts`

## End-to-End Flow

### Primary flow (booking2 modal open)

1. CTA triggers `openModal("booking2", data)`.
2. `ModalProvider` sets `activeModal` and `modalData`.
3. `GlobalModals` selects `Booking2GlobalModal`.
4. `Booking2GlobalModal` adapts payload + analytics + handoff URL.
5. `BookingModal2` renders fields + `extraContent` (`DirectPerksBlock`, `PolicyFeeClarityPanel`).

### Alternate / edge flows

- If `bookPage` is not loaded yet, `PolicyFeeClarityPanel` resolves items as non-array and renders no list.
- If modal content exceeds viewport and card/container classes are not scroll-safe, content is clipped.

## Data & Contracts

- Current contract:
  - `ModalContextValue.modalData: unknown`
  - `openModal(type, data?: unknown)`
- Effective contract in practice:
  - Each modal wrapper casts `modalData` locally with `as Partial<...>` and optional guards.
- Source of truth:
  - Policy copy: `apps/brikette/src/locales/en/bookPage.json`
  - Namespace preload set: `apps/brikette/src/i18n.namespaces.ts`

## Configuration, Flags, and Operational Controls

- `bookPage` is in `APP_I18N_NAMESPACES` but not in `CORE_LAYOUT_I18N_NAMESPACES`.
- i18n runs with `useSuspense: false` (`apps/brikette/src/i18n.ts`).
- `ModalProvider` preloads `bookPage` via `useEffect` and `i18n.loadNamespaces?.(["bookPage"])`.

## Root Causes and Fixes Applied (2026-02-17)

### Bug 1 - Viewport clipping (fixed)

- Root cause: modal card lacked explicit viewport-bounded scrolling behavior.
- Fix: `overflow-y-auto max-h-[90dvh]` added in `packages/ui/src/organisms/modals/BookingModal2.tsx`.

### Bug 2 - `bookPage` namespace race (fixed)

- Root cause: namespace loaded after first modal render.
- Final fix: preload moved to always-mounted `ModalProvider` effect.

## Systemic Modal Architecture Findings (2026-02-17 audit)

### Finding 1 - Untyped payload contract is a regression amplifier

- Evidence:
  - `packages/ui/src/context/modal/context.ts` uses `modalData: unknown`.
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` and `BookingModal.tsx` repeatedly cast `modalData` with local `Partial<...>` shapes.
- Why this matters:
  - Producer/consumer drift is not caught by TypeScript.
  - Runtime fallback behavior becomes silent and inconsistent.

### Finding 2 - Two orchestration stacks drift independently

- Evidence:
  - Full stack exists in both app and UI package (`apps/brikette/src/context/modal/*` and `packages/ui/src/context/modal/*` + `packages/ui/src/organisms/GlobalModals.tsx`).
  - `apps/brikette/src/components/modals/GlobalModals.tsx` still re-exports UI `GlobalModals` even though Brikette uses app-local switcher.
- Why this matters:
  - Behavior differences emerge by integration path.
  - Fixes are easy to land in one stack and miss in the other.

### Finding 3 - Booking modal semantics are inconsistent

- Evidence:
  - `BookingWidget` sends `checkIn/checkOut/adults` into `openModal("booking", ...)`.
  - `BookingGlobalModal` reads only `deal` from `modalData`; it does not hydrate initial dates/guests.
  - `BookingModal` component defaults to `today + minNights` on open.
  - `BookingModal` has anchor-first `_blank` behavior while app wrapper may override via `onAction` same-tab handoff.
- Why this matters:
  - User intent payloads can be dropped.
  - Conversion behavior differs by path instead of by explicit product policy.

### Finding 4 - i18n readiness is coupled to provider lifecycle

- Evidence:
  - `bookPage` omitted from core preload list.
  - `ModalProvider` manually preloads `bookPage` in effect.
  - `useSuspense: false` allows raw-key/empty rendering during late load windows.
- Why this matters:
  - Translation correctness depends on mount timing and network timing.

### Finding 5 - Provider is overloaded

- Evidence:
  - `apps/brikette/src/context/modal/provider.tsx` handles analytics emission, interactive bundle prefetch, i18n preload, focus restore, escape key, scroll lock, and document shim interactions.
- Why this matters:
  - Cross-cutting concerns are tightly coupled.
  - Testing and future changes become high-risk.

### Finding 6 - Shared primitives exist but composition is inconsistent

- Evidence:
  - `ModalFrame` supports shared layout, but modal implementations still carry bespoke overlay/content/panel behavior and repeated class stacks.
  - `ModalContainer` in primitives exists but is largely bypassed.
- Why this matters:
  - Fixes like viewport/scroll/accessibility are repeated manually.
  - Styling and behavior drift between modals is expected, not exceptional.

### Finding 7 - Test suite is mostly smoke-level for modal UX integrity

- Evidence:
  - `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` covers simple click interactions.
  - Brikette tests focus mostly on analytics callbacks and routing mocks.
- Gaps:
  - No integration test for viewport overflow clipping.
  - No deterministic test for namespace-race rendering behavior.
  - No typed contract test to enforce modal payload shape consistency across producers and consumers.

## Remake Assessment

A full remake is justified, but it should target architecture first, not a wholesale visual rewrite.

Recommended interpretation of "remake":

1. Replace `unknown` payloads with a typed modal registry and discriminated payload map.
2. Collapse to one modal orchestration system (single host/switcher/provider ownership).
3. Move i18n preload policy into explicit modal contracts (not ad-hoc provider effects).
4. Normalize booking handoff policy (one documented navigation/analytics mode per booking flow).
5. Add integration tests for overflow, preload race, and payload-contract drift.

## Tests and Coverage

- Existing:
  - `apps/brikette/src/test/components/policy-fee-clarity-panel.test.tsx`
  - `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx`
  - Brikette modal analytics/routing tests (`ga4-*`, `language-modal-routing`)
- Coverage gaps remain as listed above.

## Unknowns / Follow-ups

- Unknown: should booking V1 and booking V2 remain separate products, or converge into one modal flow?
  - How to verify: product/analytics decision based on funnel segmentation needs.
- Unknown: should modal namespace preloading be global or per-modal with loading state contracts?
  - How to verify: bundle-size budget vs flicker/race tolerance decision.

## If You Later Want to Change This (Non-plan)

- Likely change points:
  - `packages/ui/src/context/modal/context.ts` (typed contract)
  - `apps/brikette/src/context/modal/provider.tsx` + `global-modals.tsx` (host ownership)
  - `packages/ui/src/organisms/modals/primitives.tsx` and modal implementations (composition normalization)
  - `apps/brikette/src/i18n.namespaces.ts` + modal i18n loading policy
- Key risks:
  - Partial migration (typed in one layer, `unknown` in another) increases complexity.
  - Keeping dual orchestrators during transition can preserve current drift behavior unless migration is staged and gated.
