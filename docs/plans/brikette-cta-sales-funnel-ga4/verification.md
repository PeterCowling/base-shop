# Brikette CTA + GA4 Funnel — Verification Protocol

Last-updated: 2026-02-15

This protocol is the minimum required to verify GA4 event arrival and payload correctness (especially `items[]`) without polluting production reporting.

## Guardrails (Do This First)

1. **Verify you are on staging** (not production).
   - Expected staging base URL looks like: `https://staging.<project>.pages.dev`
2. **Verify the loaded GA Measurement ID is the staging stream ID.**
   - Workflow expects repo variables:
     - `NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING`
     - `NEXT_PUBLIC_GA_MEASUREMENT_ID_PRODUCTION`
   - Quick check (any page on staging): View page source and search for `G-` (should match the staging measurement ID).

Do not continue until (1) and (2) are true.

## Tooling

- **GA4 DebugView** (preferred for confirming event arrival and params).
- **Browser DevTools**:
  - Console-based `gtag` tap (most reliable for `items[]` QA).
  - Network tab (optional cross-check).

### Console: Tap `gtag` Calls

Run this in DevTools Console before triggering actions:

```js
// Logs GA4 gtag calls without breaking the original implementation.
(() => {
  const w = window;
  const original = w.gtag;
  w.__gtag_original__ = original;
  w.gtag = (...args) => {
    console.log("[gtag]", ...args);
    return typeof original === "function" ? original(...args) : undefined;
  };
})();
```

To stop logging:

```js
(() => {
  const w = window;
  if (typeof w.__gtag_original__ === "function") w.gtag = w.__gtag_original__;
})();
```

## Event Checklists (Known-Good Payloads)

### `search_availability` (Model A: availability-only)

Trigger examples:
- Booking modal v1: click “Check availability” / equivalent from header/hero/widget/deals (availability-only path).
- Booking2 fallback (only when room-selected fields are missing).

Pass criteria:
- A console log like: `["event", "search_availability", payload]`.
- Payload includes:
  - `source` (enum): `header | mobile_nav | hero | booking_widget | deals | room_card | sticky_cta | unknown`
  - `pax` (number)
  - `nights` (number)
  - `lead_time_days` (number)

Fail signals:
- `begin_checkout` fired for an availability-only action.
- Missing `source` or obviously free-form source values (string sprawl).

### `select_item`

Trigger examples:
- Click NR/Flex CTA on a room card in the rooms list or book page list (pre-modal-open).

Pass criteria:
- A console log: `["event", "select_item", payload]`.
- Payload includes:
  - `item_list_id` (enum): `home_rooms_carousel | rooms_index | book_rooms | deals_index`
  - `item_list_name` (stable English mapping from plan)
  - `items` array with exactly one selected item:
    - `items[0].item_id` equals `Room.sku` (stable)
    - `items[0].item_name` present
    - `items[0].item_variant` equals `nr | flex`

Fail signals:
- Double fire on one click.
- `item_variant` at top-level instead of inside `items[]`.

### `view_item_list`

Trigger examples:
- Initial render of:
  - rooms index list
  - book page rooms list
  - deals index list
  - home rooms carousel

Pass criteria:
- A console log: `["event", "view_item_list", payload]`.
- Payload includes:
  - `item_list_id` (enum)
  - `item_list_name` (stable English mapping)
  - `items[]` where each item includes:
    - `item_id` (Room.sku)
    - `item_name`
    - `index` (0-based or 1-based is acceptable, but must be consistent per surface)
- Dedupe behavior:
  - Fires once per navigation per `item_list_id` (re-renders should not refire).
  - Revisiting the same page later should fire again (per-navigation, not per-session).

Fail signals:
- List fires repeatedly on state changes within the same navigation (no dedupe).
- List never fires on revisits (session-scoped dedupe bug).

### `view_item`

Trigger examples:
- Room detail page load.
- Apartment page load (if applicable).

Pass criteria:
- A console log: `["event", "view_item", payload]`.
- Payload includes:
  - `items[]` with:
    - `items[0].item_id = Room.sku`
    - `items[0].item_name` present
  - If a plan/variant is known on the surface, `items[0].item_variant` is present.

Fail signals:
- Item identity uses rate codes or other unstable identifiers.

### `begin_checkout` (room-selected outbound only)

Trigger examples:
- Booking2 “Confirm” from a room-selected entry (NR/Flex chosen).
- StickyBookNow deep-link click (room detail).

Pass criteria:
- A console log: `["event", "begin_checkout", payload]`.
- Payload includes:
  - `transport_type: "beacon"`
  - `event_callback` function (navigation is delayed until callback/timeout)
  - `items[]` with:
    - `items[0].item_id = Room.sku`
    - `items[0].item_name` present
    - `items[0].item_variant = nr|flex`
- Price semantics (this iteration):
  - `value` is absent unless the flow can compute a reliable total.
  - `currency` is absent unless `value` is present.

Fail signals:
- `begin_checkout` fired without `items[]` for room-selected flows.
- Same-tab navigation happens immediately (no beacon/callback delay) and events are intermittently missing.
- `currency` present without `value`.

### `cta_click`

Trigger examples:
- Desktop header “Check availability”
- Mobile nav “Check availability”
- Hero primary CTA
- Booking widget CTA
- Content sticky CTA variant A (opens booking modal)

Pass criteria:
- A console log: `["event", "cta_click", payload]`.
- Payload includes:
  - `cta_id` (authoritative enum from plan)
  - `cta_location` (authoritative enum from plan)
- Fires exactly once per click, before modal opens (if modal-based).

Fail signals:
- Multiple event emissions per click.
- Free-form IDs/locations (string sprawl).

### `modal_open` / `modal_close`

Trigger examples:
- Opening any modal (`booking`, `booking2`, `offers`, etc.)
- Closing via cancel button, overlay click, or ESC.

Pass criteria:
- A console log: `["event", "modal_open", payload]` and/or `["event", "modal_close", payload]`.
- Payload includes:
  - `modal_type` (authoritative enum)
  - `source` (enum) when available; otherwise `unknown`

Fail signals:
- UI package hardcodes GA4 calls (boundary violation); modal lifecycle should be callback-driven.

## Optional Cross-Check: Network Tab

Use only as a secondary cross-check. In DevTools Network:
- Filter for `collect` requests (commonly `https://www.google-analytics.com/g/collect`).
- Verify the event name corresponds to the action you triggered.
- Verify that payload contains a representation of `items[]` and the key event params.

If Network payload inspection is unclear, treat the Console `gtag` tap as the source of truth.

## Staging vs Prod Safety Checklist (Before/After Testing)

- Confirm staging Measurement ID is loaded (Guardrails step #2).
- Confirm you did not test on `https://www.hostel-positano.com`.
- If you must reproduce an issue on prod, do not use DebugView as a validation source for payload QA; rely on local `gtag` tap logs and keep the session short.

