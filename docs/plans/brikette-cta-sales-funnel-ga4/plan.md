---
Type: Plan
Status: Active
Domain: UI | Data
Workstream: Mixed
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: brikette-cta-sales-funnel-ga4
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-spec, /lp-seo
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: BRIK-005
---

# Brikette CTA + GA4 Sales Funnel Plan

## Summary
We will turn Brikette’s direct-booking flow into a measurable, analyzable funnel and improve conversion surfaces where intent occurs today. The dominant JS-enabled conversion surface is modal-first booking (`BookingModal` / `Booking2Modal`), with `/book` serving as SEO/direct-entry plus degraded fallback primarily for header/mobile-nav links.

We will lock GA4 semantics to **Model A (clean funnel)** so availability-only flows do not pollute `begin_checkout`. We will implement a canonical GA4 event contract (including authoritative enums, stable item identity mapping, dedupe rules, and outbound reliability) and then incrementally instrument list impressions, selections, modal lifecycle, and outbound transitions.

In parallel, we will add conversion content parity to booking modals and upgrade `/book` with direct-booking persuasion and validated JSON-LD (no third-party `aggregateRating`).

GA4 changes are mostly additive, with an explicit semantics migration under Model A (BookingModal availability-only exits no longer emit `begin_checkout`).

## Goals
- Conversion: add direct-booking persuasion where users actually convert (booking modals + `/book`).
- Measurement: implement a coherent GA4 funnel (Model A) for `view_item_list` → `select_item` → `begin_checkout` plus availability-only tracking.
- Coverage: add booking CTAs to high-traffic pages that currently dead-end (guides, about, menus, assistance/how-to-get-here), using a sticky CTA variant that opens the booking modal.
- Reliability: prevent lost outbound events (beacon/callback delay) and prevent double-fires (dedupe guards).

## Non-goals
- Octorate booking engine changes.
- `purchase` tracking (blocked by Octorate redirect).
- Booking modal mechanics redesign (fields/validation/layout). Only small conversion-copy blocks are in scope.

## Constraints & Assumptions
- Constraints:
  - Staging is static export; GA4 currently shared with prod; verification must be staging-safe.
  - Consent Mode v2 may deny storage; events must still be testable via DebugView + Network payloads.
- Assumptions (defaults unless overridden):
  - GA4 semantics: **Model A (clean funnel)**.
  - Staging isolation: separate GA4 data stream (same property) with env-scoped `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
  - Item identity: `items[].item_id = Room.sku` from `apps/brikette/src/data/roomsData.ts`.
  - Sticky CTAs: content pages use Variant A (open `BookingModal`); deep-link `StickyBookNow` remains room-detail only.

## Fact-Find Reference
- Related brief: `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md`
- Key decisions pulled forward:
  - GA4 semantics model is an explicit decision; default is Model A.
  - Enums/item_id/dedupe/price semantics are authoritative (see fact-find) and must be enforced in code.

## Monorepo Boundary Rule (apps vs packages/ui)
Several remaining tasks touch `packages/ui/*` components (header/nav/hero, RoomsSection, StickyBookNow, modal provider). **`packages/ui` must not import `apps/brikette/*` analytics utilities.**

**Chosen approach (Option A, required):** UI emits optional callbacks, the app owns analytics.
- `packages/ui` components will accept optional callback props (e.g. `onPrimaryCtaClick`, `onRoomSelect`, `onStickyCheckoutClick`, `onModalOpen`, `onModalClose`) and call them.
- `apps/brikette` wrappers/call-sites pass analytics handlers that use the contract layer in `apps/brikette/src/utils/ga4-events.ts`.

This keeps UI reusable while still enforcing canonical analytics enums/payload shapes.

## Analytics Enums (Authoritative)
Source of truth: `apps/brikette/src/utils/ga4-events.ts` (`GA4_ENUMS`). These values are stable, low-cardinality, and `snake_case`.

- `item_list_id`: `home_rooms_carousel`, `rooms_index`, `book_rooms`, `deals_index`
- `cta_id`: `header_check_availability`, `mobile_nav_check_availability`, `hero_check_availability`, `booking_widget_check_availability`, `room_card_reserve_nr`, `room_card_reserve_flex`, `sticky_book_now`, `deals_book_direct`, `content_sticky_check_availability`
- `cta_location`: `desktop_header`, `mobile_nav`, `home_hero`, `home_booking_widget`, `rooms_list`, `book_page`, `room_detail`, `deals_page`, `guide_detail`, `about_page`, `bar_menu`, `breakfast_menu`, `assistance`, `how_to_get_here`
- `modal_type`: `offers`, `booking`, `booking2`, `location`, `contact`, `facilities`, `language`
- `rate_plan` (item-level `items[].item_variant`): `flex`, `nr`
- `source`: `header`, `mobile_nav`, `hero`, `booking_widget`, `deals`, `room_card`, `sticky_cta`, `unknown`

## Item List Name Mapping (Stable, Non-localized)
Use these fixed English strings for `item_list_name` (do not i18n).

- `home_rooms_carousel` → "Home rooms carousel"
- `rooms_index` → "Rooms index"
- `book_rooms` → "Book page rooms"
- `deals_index` → "Deals index"

## Existing System Notes
- Booking modals:
  - `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`
- GA4 helpers:
  - `apps/brikette/src/utils/ga4-events.ts`
- Room source of truth:
  - `apps/brikette/src/data/roomsData.ts`
- Existing GA4 tests that will change under Model A:
  - `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx`
  - `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx`

## Proposed Approach
- **Model A (chosen; default):**
  - Availability-only exits emit `search_availability` (custom).
  - Room/rate selection emits `select_item` with `items[].item_variant`.
  - Outbound to Octorate with room/rate known emits `begin_checkout` with `items[]` and no `value` unless reliable.
- Implement a small GA4 “contract layer”:
  - Authoritative enums, item builders, and dedupe guards.
  - Outbound reliability helper for same-tab redirects.
- Roll out instrumentation by surface (modals → room cards → list impressions → sticky links → content CTAs).
- Conversion content parity:
  - Add a small “Why book direct” block above modal confirm/exit.
  - Upgrade `/book` with existing components + schema-validated JSON-LD.

### Alternatives considered
- Model B (`begin_checkout` for any outbound with `checkout_type` segmentation): viable, but it blurs a clean e-commerce funnel and increases reporting complexity; default remains Model A unless explicitly overridden.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add GA4 contract primitives (enums + item builder + dedupe guard scaffolding) | 85% | S | Complete (2026-02-15) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Add outbound reliability helper and wire it for same-tab redirects (Booking2Modal path only) | 82% | S | Complete (2026-02-15) | TASK-01 | TASK-03,TASK-04 |
| TASK-03 | IMPLEMENT | Enforce Model A on BookingModal exit: replace availability-only `begin_checkout` with `search_availability` + update GA4 test | 83% | S | Complete (2026-02-15) | TASK-01,TASK-02 (file overlap: `apps/brikette/src/utils/ga4-events.ts`) | TASK-05 |
| TASK-04 | INVESTIGATE | Booking2 modalData contract: call-site map + canonical payload decision (roomSku + plan + list/source) | 85% | S | Complete (2026-02-15) | TASK-02 | TASK-17 |
| TASK-05 | CHECKPOINT | Horizon checkpoint: re-assess remaining GA4 surfaces after modal semantics land | 95% | S | Complete (2026-02-15) | TASK-03,TASK-17 | TASK-15,TASK-16 |
| TASK-06 | IMPLEMENT | Implement `select_item` on room CTA clicks (RoomCard + RoomsSection) using contract primitives | 82% | M | Complete (2026-02-15) | TASK-05,TASK-15 | TASK-07 |
| TASK-07 | IMPLEMENT | Implement `view_item_list` impressions (rooms index, book rooms list, deals list, home rooms carousel) with dedupe | 76% ⚠️ | M | Pending | TASK-05,TASK-06,TASK-15,TASK-18 | TASK-08 |
| TASK-08 | IMPLEMENT | Implement `view_item` on room detail + apartment pages | 76% ⚠️ | M | Pending | TASK-05,TASK-06,TASK-15 | - |
| TASK-09 | IMPLEMENT | Implement `search_availability` + reliability on StickyBookNow (room detail availability deep-link) | 80% | M | Pending | TASK-05,TASK-15 | - |
| TASK-10 | IMPLEMENT | Add modal lifecycle events (`modal_open`/`modal_close`) in Brikette ModalProvider | 82% | M | Pending | TASK-05,TASK-15 | TASK-11 |
| TASK-11 | IMPLEMENT | Add `cta_click` coverage for header/mobile-nav/hero/widget and new sticky CTA variant | 80% | M | Pending | TASK-05,TASK-15 | TASK-12 |
| TASK-12 | IMPLEMENT | Conversion copy parity inside BookingModal/Booking2Modal (no mechanics redesign) | 72% ⚠️ | M | Pending | TASK-05 | TASK-13 |
| TASK-13 | IMPLEMENT | Upgrade `/book`: DirectBookingPerks + trust + FAQ + internal links + JSON-LD (lodging + FAQ + breadcrumb) | 70% ⚠️ | L | Pending | TASK-05,TASK-12 | TASK-14 |
| TASK-14 | IMPLEMENT | Add sticky CTA variant A to content pages (GuideContent/about/bar-menu/breakfast-menu) + tracking | 68% ⚠️ | L | Pending | TASK-05,TASK-11,TASK-15 | - |
| TASK-15 | IMPLEMENT | Staging stream isolation enablement (env-scoped GA measurement ID) | 82% | M | Complete (2026-02-15) | TASK-05 | TASK-06,TASK-07,TASK-08,TASK-09,TASK-10,TASK-11,TASK-14 |
| TASK-16 | IMPLEMENT | Verification protocol doc (DebugView + payload checklist) | 85% | M | Complete (2026-02-15) | TASK-05 | - |
| TASK-17 | IMPLEMENT | Booking2Modal begin_checkout payload: room-selected `items[]` (no value) + update GA4 test | 85% | M | Complete (2026-02-15) | TASK-02,TASK-04 | TASK-05 |
| TASK-18 | IMPLEMENT | Fix impression dedupe to be per-navigation (not per session) + update unit test | 82% | S | Complete (2026-02-15) | TASK-01 | TASK-07 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide
Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | GA4 contract primitives foundation |
| 2 | TASK-02 | Wave 1: TASK-01 | Outbound reliability helper (touches `ga4-events.ts`) |
| 3 | TASK-03 | Wave 2: TASK-02 | File-overlap sequencing on `ga4-events.ts` + Model A BookingModal semantics |
| 4 | TASK-04 | Wave 2: TASK-02 | Call-site map + canonical booking2 modalData payload decision |
| 5 | TASK-17 | Wave 2+4: TASK-02,TASK-04 | Booking2Modal begin_checkout items[] payload + updated test |
| 6 | TASK-05 | Wave 3+5: TASK-03,TASK-17 | Checkpoint: reassess remaining plan via `/lp-replan` |
| 7 | TASK-15, TASK-16 | Wave 6: TASK-05 | Isolate staging stream first; verification doc can be parallel |
| 8 | TASK-06, TASK-10, TASK-11 | Wave 7: TASK-15 | Broad instrumentation begins only after isolation |
| 9 | TASK-18 | Wave 1: TASK-01 | Dedupe fix must land before list impressions |
| 10 | TASK-07, TASK-08, TASK-09 | Wave 8+9: TASK-18 (+ TASK-06 for TASK-07/TASK-08) | TASK-07/TASK-08 depend on selection + per-navigation dedupe; TASK-09 is availability-only + outbound reliability |
| 12 | TASK-12 | Wave 5: TASK-05 | Conversion copy parity inside modals |
| 13 | TASK-13 | Wave 12: TASK-12 | /book conversion + JSON-LD relies on settled copy + namespace approach |
| 14 | TASK-14 | Wave 7: TASK-11 | Content sticky CTA depends on CTA click contract |

**Max parallelism:** 3 (Wave 8)
**Critical path (current):** TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-17 → TASK-05 → TASK-15 → TASK-06 → TASK-18 → TASK-07 → TASK-13
**Total tasks:** 18

## Tasks

### TASK-01: Add GA4 contract primitives (enums + item builder + dedupe guard scaffolding)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** code changes in `apps/brikette/src/utils/` (contract primitives)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/data/roomsData.ts` ([readonly])
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% — established GA4 helper pattern exists (`getGtag()` + `window.gtag(event, ...)`).
  - Approach: 90% — contract primitives reduce drift and long-term reporting pain.
  - Impact: 85% — additive utilities; no call sites changed yet.
- **Acceptance:**
  - Contract exports exist for authoritative enums (or equivalent runtime-checked mapping) aligned to the fact-find.
  - A helper exists to build GA4 `items[]` for a room using `Room.sku` as `item_id`.
  - Dedupe mechanism exists (module-level `Set` or equivalent) ready to be used for impression events.
- **Validation contract:**
  - TC-01: buildItemFromRoom(room_10, flex) → returns `items[0].item_id === room_10` and `item_variant === flex`.
  - TC-02: unknown sku → does not throw; emits no event (guarded) or returns null (documented).
  - TC-03: enums: passing unknown `cta_location` fails typecheck or triggers a runtime guard in dev (choose one).
  - Acceptance coverage: all acceptance bullets.
  - Validation type: unit
  - Validation location/evidence: new unit test file under `apps/brikette/src/test/utils/`
  - Run/verify: `pnpm --filter brikette test -- <new-test-file>`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: none (planning-only)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: behind existing code paths; no user-visible change.
  - Rollback: revert commit.
- **Documentation impact:** None

### TASK-02: Add outbound reliability helper and wire it for same-tab redirects (Booking2Modal path only)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** shared helper that fires GA event with `transport_type: beacon` and delays navigation via `event_callback`/timeout
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 82%
  - Implementation: 85% — single same-tab redirect path; existing gtag wrapper exists.
  - Approach: 85% — improves measurement correctness without UX regressions.
  - Impact: 82% — affects a conversion-critical redirect path; guarded delay must be small.
- **Acceptance:**
  - When Booking2Modal redirects in the same tab, the GA event is dispatched with `transport_type: beacon`.
  - Navigation is delayed by callback/short timeout (documented constant) to reduce event loss.
- **Validation contract:**
  - TC-01: confirm action → gtag called with `transport_type: beacon`.
  - TC-02: event_callback invoked → navigation occurs after callback.
  - TC-03: timeout fallback triggers navigation if callback never fires.
  - Validation type: unit/integration
  - Run/verify: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** revert commit
- **Documentation impact:** None

### TASK-03: Enforce Model A on BookingModal exit (search_availability)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** BookingModal emits `search_availability` (custom) on availability-only exit, not `begin_checkout`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`, `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx`
- **Depends on:** TASK-01, TASK-02 (file overlap: `apps/brikette/src/utils/ga4-events.ts`)
- **Blocks:** TASK-05
- **Confidence:** 83%
  - Implementation: 85% — bounded change with existing test seam.
  - Approach: 90% — prevents analytically incoherent funnel.
  - Impact: 83% — changes an existing event emission; reporting consumers must adapt.
- **Acceptance:**
  - BookingModal action emits `search_availability` with low-cardinality params (`nights`, `lead_time_days`, `pax`) and `source` enum.
  - BookingModal no longer emits availability-only `begin_checkout` under Model A.
  - Existing GA4 test updated to assert `search_availability`.
- **Validation contract:**
  - TC-01: BookingModal onAction → `window.gtag(event,search_availability, ...)` with derived params.
  - TC-02: does not emit `begin_checkout` from BookingModal path.
  - Run/verify: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** revert commit
- **Documentation impact:** Update event contract notes in `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` only if implementation diverges.

### TASK-04: Booking2 modalData contract: call-site map + canonical payload decision (roomSku + plan + list/source)
- **Type:** INVESTIGATE
- **Deliverable:** Decision + call-site map recorded in this plan (append under this task)
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`, `packages/ui/src/context/modal/context.ts`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-17
- **Confidence:** 85%
  - Implementation: 85% — call sites are identifiable and bounded.
  - Approach: 90% — canonical modalData prevents analytics drift.
  - Impact: 85% — clarifies contract before further instrumentation.
- **Acceptance:**
  - Enumerate every producer of `openModal("booking2", ...)` and the exact payload shape.
  - Define a canonical booking2 modalData shape that is sufficient for analytics:
    - `roomSku: string` (must match `Room.sku`)
    - `plan: flex|nr` (maps from refundable/nonRefundable)
    - `checkIn`, `checkOut`, `adults`
    - `item_list_id` (surface-derived) and `source` (enum)
  - Confirm this contract can be implemented without violating the monorepo boundary rule.
- **Validation contract:**
  - TC-01: call-site map includes at least `apps/brikette/src/components/rooms/RoomCard.tsx` and `packages/ui/src/organisms/RoomsSection.tsx`.
  - TC-02: canonical modalData is written as a TypeScript type (location decided) or as a documented schema in the plan.

**Findings (E1: static call-site audit)**
- Producers of `openModal("booking2", ...)`:
  - `apps/brikette/src/components/rooms/RoomCard.tsx`:
    - Payload today: `{ rateType: "nonRefundable"|"refundable", room: Room, checkIn: string, checkOut: string, adults: number }`.
  - `packages/ui/src/organisms/RoomsSection.tsx`:
    - Payload today: `{ checkIn: string, checkOut: string, adults: number, rateType: "nonRefundable"|"refundable", room: { nonRefundableCode: string, refundableCode: string } }`.
    - Gap: no `roomSku` (so GA4 `items[].item_id` cannot be built reliably).

- Consumers of booking2 modal data:
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`:
    - Reads only `{ checkIn, checkOut, adults }` today and **ignores** `rateType` / `room`.
    - Redirects to `.../reservation/result.xhtml` (availability results).
  - `packages/ui/src/organisms/GlobalModals.tsx`:
    - Has a booking2 confirm handler that requires a room/rate code and redirects to `.../reservation/confirm.xhtml?room=...`.
    - Note: Brikette app mounts `apps/brikette/src/context/modal/global-modals.tsx` (not the UI `GlobalModals` switcher), so this code path is not currently driving Brikette’s booking2 flow.

**Decision: Canonical `booking2` modalData contract (authoritative)**
Booking2 is treated as a **room-selected** flow when it is opened from room/rate CTAs (NR/Flex). To support coherent Model A semantics and GA4 `items[]`, the canonical payload is:

```ts
// Canonical booking2 payload for Brikette.
// Required fields enable room-selected begin_checkout + confirm.xhtml navigation.
export type Booking2ModalData = {
  checkIn: string;
  checkOut: string;
  adults: number;

  // Analytics identity
  roomSku: string; // must match Room.sku (stable item_id)
  plan: "nr" | "flex";

  // Booking engine alignment
  octorateRateCode: string; // direct rate code; passed as `room=` to confirm.xhtml

  // Diagnostic segmentation (low-cardinality)
  source: import("@/utils/ga4-events").EventSource;
  item_list_id?: import("@/utils/ga4-events").ItemListId;
};
```

Mapping rules:
- Legacy `rateType` mapping: `nonRefundable` → `nr`, `refundable` → `flex`.
- `octorateRateCode` derivation:
  - If producer has `Room` object: use `room.rateCodes.direct.nr|flex` (preferred) or `room.widgetRateCodeNR|Flex`.
  - If producer has only direct rate codes: use the provided code for the chosen plan.

Fallback rule (to avoid silent breakage):
- If `roomSku/plan/octorateRateCode` are missing, Booking2GlobalModal must **not** emit room-selected `begin_checkout`. It should treat the action as availability-only (`search_availability`) and navigate to `result.xhtml`.

Boundary check:
- This contract is producer-owned data passed via `openModal`. It does not require `packages/ui` to import `apps/brikette` analytics utilities; producers pass plain strings/enums and the app-level modal emits GA4.

### TASK-17: Booking2Modal begin_checkout payload: room-selected `items[]` (no value) + update GA4 test
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Booking2Modal emits GA4 `begin_checkout` with `items[]` for room-selected flows (no `value`)
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`, `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx`, `apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** TASK-02, TASK-04
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 83% — modalData contract is now explicit; work is plumbing + payload assembly + tests.
  - Approach: 90% — aligns with GA4 ecommerce conventions.
  - Impact: 82% — changes payload semantics; requires careful test updates.
- **Acceptance:**
  - `begin_checkout` payload follows GA4 e-commerce conventions:
    - `items[0].item_id = Room.sku`
    - `items[0].item_name` is present
    - `items[0].item_variant = flex|nr` (item-level)
  - Does not emit `value` unless a reliable total is computed (deferred by default).
  - `currency: "EUR"` is only included when `value` is included.
  - Outbound reliability remains enforced (`transport_type: "beacon"` + callback/timeout) for same-tab redirect.
- **Validation contract:**
  - TC-01: confirm action → gtag called with `begin_checkout` and item payload (`item_id`, `item_name`, `item_variant`).
  - TC-02: `value` and `currency` are absent for hostel room flows in this iteration.
  - Run/verify: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx`

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commit:** `45d5f83066`
- **Implementation notes:**
  - Canonical booking2 modalData fields are now plumbed by both producers:
    - `apps/brikette/src/components/rooms/RoomCard.tsx` adds `roomSku`, `plan`, `octorateRateCode`, `source` (keeps legacy fields for compatibility).
    - `packages/ui/src/organisms/RoomsSection.tsx` adds the same fields (keeps legacy `rateType` + `room.{...Code}` for UI `GlobalModals` compatibility).
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` now:
    - Navigates to `confirm.xhtml?room=...` and emits room-selected `begin_checkout` with `items[]` when room data is present.
    - Falls back to availability-only `result.xhtml` + `search_availability` if required room fields are missing.
  - `apps/brikette/src/utils/ga4-events.ts` adds `fireBeginCheckoutRoomSelectedAndNavigate` + `fireSearchAvailabilityAndNavigate` (beacon + callback/timeout navigation delay) and removes room-value computation for `fireRoomBeginCheckout`.
- **Validation:**
  - Ran: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx --maxWorkers=2` (PASS)
  - Ran: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx --maxWorkers=2` (PASS)
  - Ran: `pnpm --filter brikette typecheck` (PASS)
  - Ran: `pnpm --filter @acme/ui typecheck` (PASS)
  - Ran: `pnpm --filter @acme/ui lint` (PASS with warnings)

### TASK-05: Horizon checkpoint — reassess remaining GA4 surfaces
- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-15)
- **Depends on:** TASK-03, TASK-17
- **Blocks:** TASK-15, TASK-16
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on TASK-06..TASK-16 using evidence from modal semantics + updated tests.
  - Confirm the monorepo boundary rule is enforced: `packages/ui` changes are callback-only (no imports from `apps/brikette`).
  - Confirm staging stream isolation will land before any broad instrumentation (TASK-06..TASK-11, TASK-14 are gated on TASK-15).
  - Confirm no unintended reporting regressions from Model A shift.

#### Checkpoint Notes (2026-02-15)
Evidence gathered from completed work:
- Model A semantics confirmed with executable tests:
  - BookingModal now emits `search_availability` (availability-only) instead of `begin_checkout` (TASK-03).
  - Booking2Modal now emits room-selected `begin_checkout` with `items[]` and beacon/callback navigation delay (TASK-17).
- Booking2 modalData contract is now proven end-to-end across both producers (E2): Brikette RoomCard + UI RoomsSection both supply `roomSku/plan/octorateRateCode/source`.
- Monorepo boundary rule held: `packages/ui` was updated without importing `apps/brikette` analytics utilities; all GA4 emission remains app-owned.

Replan outcomes for remaining tasks (TASK-06..TASK-16):
- No topology changes required after TASK-17; existing dependency graph and staging-isolation gating remain correct.
- Key known risks unchanged:
  - Staging stream isolation (TASK-15) remains a hard gate before broad instrumentation tasks (06–11, 14).
  - Impression dedupe implementation still needs per-navigation semantics (TASK-18) before TASK-07.
  - StickyBookNow still requires GA4-agnostic navigation interception in UI (TASK-09) to avoid event loss.

### TASK-06: select_item on room CTA clicks (RoomCard + RoomsSection)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`, `apps/brikette/src/components/rooms/RoomsSection.tsx`, `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-15
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Evidence (E1): `packages/ui/src/organisms/RoomsSection.tsx` is the dominant room-list CTA surface and already centralizes NR/Flex click handling in `openBooking(rateType)`.
  - Evidence (E1): `apps/brikette/src/components/rooms/RoomCard.tsx` has explicit NR/Flex click handlers and already passes canonical booking2 modalData fields (roomSku/plan/source).
- **Acceptance:**
  - `select_item` fires **exactly once per click**, before the modal opens.
  - Event has deterministic surface identity:
    - `item_list_id` is derived by surface (rooms index vs book page vs home rooms carousel).
  - `select_item` uses item-level `items[].item_variant` (`flex|nr`) and stable `items[].item_id` (`Room.sku`).
  - No `begin_checkout` fires from the click itself (reserved for outbound/confirm).
- **Validation contract:**
  - TC-01: clicking NR emits `select_item` with `items[0].item_variant === nr`.
  - TC-02: clicking Flex emits `select_item` with `items[0].item_variant === flex`.
  - TC-03: event includes `item_list_id` + `item_list_name` for the originating surface.
  - Test type: integration (component)
  - Test location: `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx --maxWorkers=2`

**Evidence**
- Commit: `45c66bc567`
- Validations:
  - `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx --maxWorkers=2`
  - `pnpm --filter brikette typecheck`
  - `pnpm --filter @acme/ui typecheck`
  - `pnpm --filter @acme/ui lint`

Replan notes:
- To keep the monorepo boundary clean, `packages/ui/src/organisms/RoomsSection.tsx` should accept an optional callback prop (e.g. `onRoomSelect`) and invoke it before calling `openModal("booking2", ...)`. The Brikette app wrapper passes an analytics handler.

### TASK-07: view_item_list impressions with dedupe
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/[lang]/rooms/page.tsx` (or content component), `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`, `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-06, TASK-15, TASK-18
- **Blocks:** TASK-08
- **Confidence:** 76% ⚠️
  - Evidence (E1): primary surfaces are known and stable (`RoomsPageContent`, `BookPageContent`, `DealsPageContent`, `HomeContent`).
  - Evidence (E2): per-navigation dedupe helper is implemented and unit-tested (TASK-18).
- **Acceptance:**
  - `view_item_list` fires once per navigation per `item_list_id`.
  - `items[]` uses stable `item_id` and includes `index`.
  - Dedupe is scoped to a single navigation/page-view:
    - Prefer component-local `useRef` guards per surface.
    - If a shared helper is used, it must reset on pathname change or accept a page-view token.
  - Dedupe key includes at minimum `${pathname}:${item_list_id}`.
  - Known limitation (documented): if list content changes within a navigation (re-render due to state), simple dedupe may undercount those changes in this iteration.

Additional requirements:
- Include `item_list_name` using the stable mapping in this plan.

- **Validation contract:**
  - TC-01: `/[lang]/rooms` fires `view_item_list` with `item_list_id: rooms_index` and stable `items[].item_id` (Room.sku) once per navigation.
  - TC-02: `/[lang]/book` fires `view_item_list` with `item_list_id: book_rooms` once per navigation.
  - TC-03: Home carousel fires `view_item_list` with `item_list_id: home_rooms_carousel` once per navigation.
  - TC-04: revisiting a page (navigate away then back) refires the impression (per-navigation).
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/ga4-12-view-item-list-impressions.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-12-view-item-list-impressions.test.tsx --maxWorkers=2`

What would make this ≥90%:
- Add a small “impression payload builder” helper and unit-test it so list payload correctness isn’t only proven through brittle page/component tests.

### TASK-08: view_item on room detail + apartment pages
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx`, apartment page(s), `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-06, TASK-15
- **Blocks:** -
- **Confidence:** 76% ⚠️
  - Evidence (E1): room detail surface is isolated to `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` and has access to stable room identity (`Room.sku`).

- **Acceptance:**
  - Room detail page emits `view_item` once per navigation with `items[0].item_id = Room.sku`.
  - Apartment page emits `view_item` once per navigation with stable `item_id` (apartment sku).
  - No `begin_checkout` is emitted as a side-effect of `view_item`.
- **Validation contract:**
  - TC-01: `/[lang]/rooms/[id]` emits `view_item` with `items[0].item_id` matching the room’s sku.
  - TC-02: apartment page emits `view_item` with `items[0].item_id` matching apartment sku.
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/ga4-13-view-item-detail.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-13-view-item-detail.test.tsx --maxWorkers=2`

What would make this ≥90%:
- Add a shared “room -> item payload” builder that includes optional price only when stable and shown, then unit-test it in isolation.

### TASK-09: search_availability on StickyBookNow (availability-only deep link) + reliability
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `packages/ui/src/organisms/StickyBookNow.tsx`, `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-15
- **Blocks:** -
- **Confidence:** 80%

- **Acceptance:**
  - `packages/ui/src/organisms/StickyBookNow.tsx` supports reliability-safe navigation interception:
    - If an `onStickyCheckoutClick` handler is provided, the click prevents default navigation.
    - UI navigates after ack signal from the handler (event callback) or a short timeout fallback.
    - If no handler is provided, StickyBookNow behaves as a normal `<a>`.
  - The UI handler shape is boundary-safe and GA4-agnostic. Example: `onStickyCheckoutClick?: (ctx) => { proceed: () => void } | Promise<void> | void`.
  - StickyBookNow is availability-only today (it links to `result.xhtml` without a `room=` selection). Under Model A:
    - the app handler emits `search_availability` (not `begin_checkout`) before navigating out.
    - `begin_checkout` remains reserved for room-selected outbound flows (e.g. Booking2 confirm).
- **Validation contract:**
  - TC-01: clicking StickyBookNow fires `search_availability` exactly once and navigation is delayed until callback/timeout.
  - TC-02: `begin_checkout` is not emitted by StickyBookNow in this iteration.
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/ga4-sticky-book-now-search-availability.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-sticky-book-now-search-availability.test.tsx --maxWorkers=2`

What would make this ≥90%:
- Decide whether StickyBookNow should become a true room-selected CTA (requires a UX decision: default plan vs explicit choice). If yes, split into a separate task and re-enable `begin_checkout` with `items[]`.

### TASK-18: Fix impression dedupe to be per-navigation (not per session) + update unit test
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Deliverable:** shared dedupe helper cannot undercount revisits to the same route in a single session
- **Affects:** `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/test/utils/ga4-events-contract.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Status:** Complete (2026-02-15)
- **Confidence:** 82%
  - Implementation: 85% — bounded helper change + unit test updates.
  - Approach: 85% — aligns implementation with "per navigation" contract.
  - Impact: 82% — affects impression event guarding.
- **Acceptance:**
  - Dedupe helper is scoped to a single navigation/page-view.
  - A consumer can reset the dedupe on pathname change (or provide a page-view token).
- **Validation contract:**
  - TC-01: visiting the same pathname twice (simulated via reset/token) allows the impression to fire again.
  - TC-02: re-render within the same navigation remains deduped.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commit:** `322688b1de`
- **Implementation notes:**
  - `apps/brikette/src/utils/ga4-events.ts` now scopes impression dedupe to the current `window.location.pathname` and clears the dedupe set when pathname changes (per-navigation semantics).
  - Added `resetImpressionDedupe()` for explicit reset in edge cases/tests.
- **Validation:**
  - Ran: `pnpm --filter brikette test -- apps/brikette/src/test/utils/ga4-events-contract.test.ts --maxWorkers=2` (PASS)
  - Ran: `pnpm --filter brikette typecheck` (PASS)

### TASK-10: modal_open/modal_close
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/context/modal/provider.tsx`, `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx` (new)
- **Depends on:** TASK-05, TASK-15
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Evidence (E1): Brikette’s `ModalProvider` in `apps/brikette/src/context/modal/provider.tsx` is the single choke point for all `openModal` / `closeModal` calls (including calls originating inside `packages/ui` via shared ModalContext).

- **Acceptance:**
  - `apps/brikette/src/context/modal/provider.tsx` emits `modal_open` when `openModal(type, ...)` is called.
  - `apps/brikette/src/context/modal/provider.tsx` emits `modal_close` when `closeModal()` is called (include prior modal type).
  - Payload uses canonical enums: `modal_type` + `source` (when available; otherwise `unknown`).
- **Validation contract:**
  - TC-01: opening `booking` emits `modal_open` with `modal_type: booking`.
  - TC-02: closing `booking` emits `modal_close` with `modal_type: booking`.
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx --maxWorkers=2`

### TASK-11: cta_click coverage
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `packages/ui/src/organisms/DesktopHeader.tsx`, `packages/ui/src/organisms/MobileNav.tsx`, `packages/ui/src/organisms/LandingHeroSection.tsx`, `apps/brikette/src/components/header/Header.tsx`, `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/components/landing/BookingWidget.tsx`
- **Depends on:** TASK-05, TASK-15
- **Blocks:** TASK-12, TASK-14
- **Confidence:** 80%
  - Evidence (E1): `packages/ui/src/organisms/DesktopHeader.tsx` and `packages/ui/src/organisms/MobileNav.tsx` both centralize the booking CTA click and already intercept navigation to open the booking modal.
  - Evidence (E1): `packages/ui/src/organisms/LandingHeroSection.tsx` already supports `onPrimaryCtaClick`.

- **Acceptance:**
  - Header/mobile-nav CTAs emit `cta_click` exactly once per click, before opening the modal.
  - `packages/ui` exposes callback props for header/mobile CTAs; `apps/brikette/src/components/header/Header.tsx` wires analytics handlers.
  - CTA payload uses only canonical enums (`cta_id`, `cta_location`).

Notes:
- LandingHeroSection already exposes `onPrimaryCtaClick`; Brikette can wire `cta_click` without changing `packages/ui/src/organisms/LandingHeroSection.tsx`.
- **Validation contract:**
  - TC-01: desktop header CTA click emits `cta_click` with `cta_id: header_check_availability` and `cta_location: desktop_header`.
  - TC-02: mobile nav CTA click emits `cta_click` with `cta_id: mobile_nav_check_availability` and `cta_location: mobile_nav`.
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx --maxWorkers=2`

### TASK-12: conversion copy parity in booking modals
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`, `apps/brikette/src/locales/en/*` (as needed)
- **Depends on:** TASK-05
- **Blocks:** TASK-13
- **Confidence:** 72% ⚠️

Notes:
- Avoid importing `DirectBookingPerks` into modals just to reuse copy; it is wired to `dealsPage` i18n namespace. Prefer a small modal-specific block with copy in an appropriate namespace (`modals` / `bookPage`).

- **Acceptance:**
  - BookingModal and Booking2Modal render a small “Why book direct” block above the primary action area (no mechanics redesign).
  - Copy is sourced from an appropriate namespace (`modals` or `bookPage`) and does not introduce new namespace coupling into the modals.
  - The block is present in EN and falls back safely for non-EN locales (no raw i18n key tokens displayed).
- **Validation contract:**
  - TC-01: BookingModal renders the direct-booking block (smoke render test).
  - TC-02: Booking2Modal renders the direct-booking block (smoke render test).
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx --maxWorkers=2`

What would make this ≥90%:
- Confirm the final copy structure with product owner and lock translation keys before implementation (avoids churn across locales).

### TASK-13: Upgrade /book + JSON-LD
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/locales/en/bookPage.json`, `apps/brikette/src/components/seo/*` (new book structured data component)
- **Depends on:** TASK-05, TASK-12
- **Blocks:** TASK-14
- **Confidence:** 70% ⚠️
- **Validation contract:**
  - TC-01: snapshot of JSON-LD output is stable and contains required fields; no third-party `aggregateRating`.
  - TC-02: `/[lang]/book` renders without i18n key leakage for 2-3 non-EN locales in staging.

Guardrails:
- JSON-LD acceptance is schema validity + stable output, not an outcome promise (rich results may not appear).
- `aggregateRating` remains omitted unless first-party reviews exist on-site.

Replan notes (E1):
- `/book` currently loads `bookPage` + `roomsPage` namespaces; adding conversion content must avoid pulling in unrelated namespaces that create coupling (e.g. `dealsPage`).
- Validation must explicitly use the “valid schema, no errors” standard rather than promising rich results.

What would make this ≥90%:
- A concrete, locked JSON-LD field list for the chosen `@type` strategy (Hostel vs LodgingBusiness) + a snapshot test covering the final output.

### TASK-14: Sticky CTA variant A on content pages
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `apps/brikette/src/app/[lang]/about/page.tsx`, `apps/brikette/src/app/[lang]/bar-menu/page.tsx`, `apps/brikette/src/app/[lang]/breakfast-menu/page.tsx`
- **Depends on:** TASK-05, TASK-11, TASK-15
- **Blocks:** -
- **Confidence:** 68% ⚠️

- **Acceptance:**
  - Add a sticky CTA Variant A to the listed content pages that opens BookingModal (generic availability), not a deep-link.
  - CTA is session-dismissible (avoid intrusive behavior) and reuses the “sticky CTA pattern” rather than forcing `StickyBookNow` deep-links where room context is absent.
  - Tracking:
    - emits `cta_click` with canonical `cta_id`/`cta_location`
    - emits `modal_open`/`modal_close` through the modal lifecycle task
- **Validation contract:**
  - TC-01: guide detail page renders the sticky CTA and clicking it opens BookingModal.
  - TC-02: about page renders the sticky CTA and clicking it opens BookingModal.
  - Test type: integration
  - Test location: `apps/brikette/src/test/components/content-sticky-cta.test.tsx` (new)
  - Run: `pnpm --filter brikette test -- apps/brikette/src/test/components/content-sticky-cta.test.tsx --maxWorkers=2`

What would make this ≥90%:
- Confirm the exact target page set and the desired dismiss TTL (session vs longer) with product owner; these are UX decisions that affect intrusiveness risk.

### TASK-15: Staging stream isolation enablement (env-scoped GA measurement ID)
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Status:** Complete (2026-02-15)
- **Deliverable:** staging build uses a staging-only measurement ID (does not pollute prod stream)
- **Affects:** `.github/workflows/brikette.yml`, `apps/brikette/src/config/env.ts` ([readonly])
- **Depends on:** TASK-05
- **Blocks:** TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-14
- **Confidence:** 82%
- **Acceptance:**
  - Staging deploy uses a staging-specific `NEXT_PUBLIC_GA_MEASUREMENT_ID` (environment-scoped) distinct from production.
  - A documented checklist exists describing how to confirm which measurement ID loaded.
- **Validation contract:**
  - TC-01: staging build logs/HTML contains the staging measurement ID.
  - TC-02: GA4 DebugView shows events arriving in the staging stream/property, not production.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commit:** `9f390162bf`
- **Implementation notes:**
  - `.github/workflows/brikette.yml` now sets `NEXT_PUBLIC_GA_MEASUREMENT_ID` from:
    - staging: `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING` (fallback `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID`)
    - production: `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID_PRODUCTION` (fallback `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- **Operator checklist (staging isolation verification):**
  - Ensure GitHub repo variables are set:
    - `NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING` (staging stream Measurement ID)
    - `NEXT_PUBLIC_GA_MEASUREMENT_ID_PRODUCTION` (production stream Measurement ID)
  - Deploy `staging` (or open the `staging-pages` URL) and confirm the loaded Measurement ID:
    - In browser DevTools Console: `window.gtag?.toString?.()` exists and the GA config call includes `G-...` matching the staging ID (or inspect the page source for the Measurement ID string).
    - In GA4 DebugView (staging stream): events appear when browsing staging with debug tooling enabled.
  - Confirm production still uses the production Measurement ID.

### TASK-16: Verification protocol doc (DebugView + payload checklist)
- **Type:** IMPLEMENT
- **Execution-Skill:** /lp-build
- **Status:** Complete (2026-02-15)
- **Deliverable:** `docs/plans/brikette-cta-sales-funnel-ga4/verification.md`
- **Affects:** `docs/plans/brikette-cta-sales-funnel-ga4/verification.md`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 85%

- **Acceptance:**
  - `docs/plans/brikette-cta-sales-funnel-ga4/verification.md` includes:
    - DebugView checklist per event type (`search_availability`, `select_item`, `view_item_list`, `view_item`, `begin_checkout`, `cta_click`, `modal_open`, `modal_close`).
    - Network payload checklist (what params to expect and where they live, especially `items[].item_variant`).
    - A staging-vs-prod guard section (confirm staging stream isolation before testing).
- **Validation contract:**
  - TC-01: operator can follow the checklist end-to-end and unambiguously determine pass/fail for a given event.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Docs:** `docs/plans/brikette-cta-sales-funnel-ga4/verification.md`
- **Validation:**
  - TC-01 satisfied by the presence of per-event pass/fail payload checklists (DebugView + Console `gtag` tap + optional Network cross-check) and explicit staging-vs-prod guardrails.

## Risks & Mitigations
- **Semantics migration risk:** Model A changes existing events (BookingModal). Mitigate with explicit test updates + doc contract.
- **Event loss on navigation:** enforce outbound reliability helper on same-tab redirects.
- **Param sprawl:** authoritative enums + contract primitives; reject ad-hoc strings.
- **Double-fire risk:** dedupe guards.

## Observability
- GA4 DebugView as primary correctness check for payload shape; Network tab confirms `/g/collect` params.

## Acceptance Criteria (overall)
- [ ] Model A semantics enforced (availability-only != `begin_checkout`).
- [ ] `select_item` + `view_item_list` + `view_item` implemented per contract with stable `item_id`.
- [ ] `begin_checkout` includes `items[]` only when room/apartment selection is known; `value` only when reliable.
- [ ] Outbound events are reliable (beacon/callback delay on same-tab redirects).
- [ ] `/book` and booking modals include direct-booking persuasion; `/book` includes validated JSON-LD (no third-party `aggregateRating`).
- [ ] New CTAs exist on guide/about/menu pages and are tracked.

## Decision Log
- 2026-02-15: Defaulted GA4 semantics to Model A (clean funnel) unless explicitly overridden.
- 2026-02-15: Set `Business-OS-Integration: off` for this plan doc because `Card-ID: BRIK-005` does not resolve to a local card file and the MCP BOS tools require startup-loop `runId/current_stage` context not present in-repo. If BOS integration is required for this workstream, add an enablement task during `/lp-replan`.
