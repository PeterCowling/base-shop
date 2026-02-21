---
Type: Plan
Status: Archived
Domain: UI | Data
Feature-Slug: brikette-cta-sales-funnel-ga4
Created: 2026-02-15
Archived: 2026-02-18
Card-ID: BRIK-005
---

# Brikette CTA + GA4 Sales Funnel — Plan v1 (Historical)

> **Archived 2026-02-18.** This document is the historical v1 plan, containing the original task set
> that predates the scope amendment (clean break from booking modals).
>
> **Active plan (v2):** `docs/plans/brikette-cta-sales-funnel-ga4/plan.md`

## Why v1 Was Superseded

On 2026-02-18, scope was amended (Decision Pete): remove `BookingModal`/`Booking2Modal` entirely and
route all booking-intent CTAs directly to `/{lang}/book` or Octorate. The original v1 tasks assumed
the booking modals would be improved, not deleted.

Eleven original tasks are superseded; six completed tasks remain valid in v2.

## Completed Tasks (also referenced in v2)

| Task | Description | Completed |
|---|---|---|
| TASK-01 | GA4 contract primitives (enums + item builder + dedupe scaffold) | 2026-02-15 |
| TASK-07 | view_item_list impressions with dedupe (rooms index, book rooms, home carousel) | 2026-02-15 |
| TASK-08 | view_item on room detail + apartment pages | 2026-02-15 |
| TASK-15 | Staging GA4 stream isolation (env-scoped measurement ID) | 2026-02-15 |
| TASK-16 | Verification protocol doc (DebugView + payload checklist) [DebugView method amended in TASK-40 v2] | 2026-02-15 |
| TASK-18 | Impression dedupe fix (per-navigation, not per-session) | 2026-02-15 |

## Superseded Tasks

| Task | Type | Original Description | Superseded by | Reason |
|---|---|---|---|---|
| TASK-02 | IMPLEMENT | Outbound reliability for Booking2Modal | TASK-30 (v2) | Modal deleted; `trackThenNavigate` replaces with corrected API |
| TASK-03 | IMPLEMENT | Model A on BookingModal exit | TASK-13 (v2) | Modal deleted entirely; messaging moves to /book page |
| TASK-04 | INVESTIGATE | Booking2Modal call-site map | — | Investigation complete; call sites documented in fact-find blast radius table |
| TASK-05 | CHECKPOINT | Pre-amendment checkpoint | TASK-29 (v2) | Superseded by post-modal-removal checkpoint |
| TASK-06 | IMPLEMENT | select_item via modal open | TASK-32 (v2) | Re-implemented via direct RoomCard navigation to Octorate |
| TASK-09 | IMPLEMENT | search_availability on StickyBookNow (incorrect) | TASK-35 (v2) | StickyBookNow fires begin_checkout (high-intent), not search_availability |
| TASK-10 | IMPLEMENT | Modal lifecycle events | — | Booking modal lifecycle gone; non-booking lifecycle tracking OOS |
| TASK-11 | IMPLEMENT | cta_click with modal intercept | TASK-36 (v2) | Re-implemented for navigation-based approach |
| TASK-12 | IMPLEMENT | Conversion copy inside modals | TASK-13 (v2) | Modals deleted; content moves to /book page |
| TASK-17 | IMPLEMENT | Booking2Modal begin_checkout items[] | TASK-32 (v2) | Modal deleted; begin_checkout fires on direct RoomCard navigation |
| TASK-19 | INVESTIGATE | Lock modal copy + i18n | TASK-13 (v2) | Modals deleted; i18n work moves to bookPage.json |

## Notes on Key Superseded Tasks

### TASK-02: Outbound reliability for Booking2Modal

**Original intent:** Add beacon transport + event_callback fallback to Booking2Modal's Octorate
navigation to prevent event loss on page unload.

**Why superseded:** Modal deleted. The reliability pattern lives on in TASK-30 (v2) as the
`trackThenNavigate(eventName, params, navigate, timeoutMs)` helper.

**Note:** The v1 spec had a broken API (`fireEvent: () => void` as a parameter — impossible since
`go` is scoped inside the helper). TASK-30 (v2) corrects the API so the helper owns the
`event_callback: go` wiring internally.

---

### TASK-03: Model A on BookingModal exit

**Original intent:** Add "book direct" messaging (DirectBookingPerks, social proof) inside
BookingModal exit flow to increase conversion.

**Why superseded:** BookingModal deleted. Conversion content moves to /book page (TASK-13 v2)
where it reaches all booking-intent users regardless of entry path.

---

### TASK-04: Booking2Modal call-site map

**Original intent:** Audit all Booking2Modal call sites (openModal("booking2")) and classify by
context (room card, sticky nav, etc.).

**Why superseded:** Modal deleted. The call-site audit was completed informally during scope
amendment planning: 9x `openModal("booking")` + 2x `openModal("booking2")` sites documented in the
fact-find blast radius table.

---

### TASK-05: Pre-amendment checkpoint

**Original intent:** Gate checkpoint before Track A/B/C tasks could begin.

**Why superseded:** Scope amendment fundamentally changes the dependency graph. Replaced by
TASK-29 (v2) — post-modal-removal checkpoint, after Track E (modal deletion) completes.

---

### TASK-06: select_item via modal open

**Original intent:** Fire `select_item` GA4 event when user opens Booking2Modal (treating
modal-open as the selection proxy).

**Why superseded:** Using modal-open as `select_item` is semantically wrong — the user hasn't
selected a room, they've triggered a flow. In v2, `select_item` fires on actual RoomCard direct
navigation to Octorate (TASK-32), where room context is unambiguous.

---

### TASK-09: search_availability on StickyBookNow (incorrect)

**Original intent:** Fire `search_availability` when StickyBookNow CTA is clicked.

**Why superseded:** StickyBookNow on the room detail page is a high-intent "Book Now" CTA, not a
"Search" trigger. It navigates directly to Octorate. The correct event is `begin_checkout`, not
`search_availability`. Corrected in TASK-35 (v2).

---

### TASK-10: Modal lifecycle events

**Original intent:** Track modal open/close as funnel analytics signals (modal_open, modal_close
events).

**Why superseded:** Booking modals are deleted. Non-booking modal lifecycle tracking (offers,
location, etc.) is out of scope for this plan.

---

### TASK-11: cta_click with modal intercept

**Original intent:** Fire `cta_click` before opening the booking modal (modal intercept pattern).

**Why superseded:** Navigation-based architecture replaces modal-intercept. In v2, `cta_click`
fires on navigate-to-book intent (no modal involved). Implemented in TASK-36 (v2).

---

### TASK-12: Conversion copy inside modals

**Original intent:** Add DirectBookingPerks + social proof sections inside BookingModal.

**Why superseded:** BookingModal deleted. Conversion copy moves to /book page (TASK-13 v2).

---

### TASK-17: Booking2Modal begin_checkout items[]

**Original intent:** Add `items[]` array to the `begin_checkout` event fired when Booking2Modal
submits to Octorate (so GA4 reports which room and rate were booked).

**Why superseded:** Modal deleted. `begin_checkout` now fires on direct RoomCard navigation to
Octorate (TASK-32 v2), where room context (room.sku, plan, rate codes) is always known at click time.

---

### TASK-19: Lock modal copy + i18n

**Original intent:** Lock i18n keys and copy for booking modal strings.

**Why superseded:** Modals deleted. i18n work moves to `bookPage.json` for the /book page
conversion content (TASK-13 v2).

---

## Decision Log (v1)

- 2026-02-15: GA4 semantics model A chosen (clean funnel; availability-only exits not polluting begin_checkout)
- 2026-02-15: Staging GA4 stream isolation: separate data stream within same property (not separate property)
- 2026-02-15: Item identity: `items[].item_id = Room.sku` (not Octorate room/rate codes)
- 2026-02-18: **Scope amendment — clean break from booking modals.** Decision (Pete): remove BookingModal/Booking2Modal entirely; route all CTAs to /book or Octorate directly. 11 tasks superseded.
