# Brikette CTA + GA4 Funnel — Verification Protocol

Last-updated: 2026-02-18 (TASK-40 update: DebugView method, SPA page_view, promotions, custom dimensions)

This protocol is the minimum required to verify GA4 event arrival and payload correctness (especially `items[]`) without polluting production reporting.

## Guardrails (Do This First)

1. **Verify you are on staging** (not production).
   - Expected staging base URL looks like: `https://staging.brikette-website.pages.dev`
2. **Verify the loaded GA Measurement ID is the staging stream ID.**
   - Quick check (any page on staging): View page source and search for `G-` — it should match the staging measurement ID, NOT the production ID.

Do not continue until (1) and (2) are true.

## Tooling

### Option A: Google Analytics Debugger Browser Extension (Preferred for DebugView)

GA4 DebugView (`Admin → DebugView`) shows events in near-real-time but only activates for a browser that sets `debug_mode: true`.

**Important:** `?gtm_debug` does NOT work for direct gtag setups (only GTM). Use the browser extension instead.

1. Install **Google Analytics Debugger** extension for Chrome.
2. Enable it on the staging tab (toggle in extension toolbar).
3. The extension automatically sets `debug_mode: true` on all gtag calls.
4. Open GA4 → Admin → DebugView and confirm events appear.

**Staging-only alternative (if extension unavailable):** Temporarily add `debug_mode: true` to the gtag config call in `buildGA4InlineScript`. Remove before merging. Example patch:
```js
gtag('config', MEASUREMENT_ID, { debug_mode: true });
```

### Option B: Console gtag Tap (Best for payload inspection, works anywhere)

Run this in DevTools Console **before** triggering actions:

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

### Option C: Network Tab (Secondary Cross-Check)

In DevTools Network:
- Filter for `**/g/collect` (catches both `GET` and `POST` beacon requests).
- Verify the event name matches the action triggered.
- Verify the payload includes `items[]` and key event params.

If Network payload inspection is unclear, treat the Console gtag tap (Option B) as the source of truth.

---

## Event Checklists (Known-Good Payloads)

### `page_view` (SPA navigation — Pattern B)

**When to verify:** After TASK-41 lands. Navigate from Home → `/en/book` via the header CTA (same tab, no new-tab).

Trigger: Internal SPA navigation (e.g., header "Check availability" → `/en/book`).

Pass criteria:
- **On hard load (first page load):** exactly **one** `page_view` fires (from the inline gtag snippet). The `PageViewTracker` component does NOT fire on initial render.
- **On SPA navigation (Home → /book):** exactly **one** additional `page_view` fires from `PageViewTracker`. Confirm in console tap or DebugView:
  - `["config", "G-<STAGING_ID>", { page_path: "/en/book", page_location: "https://staging.brikette-website.pages.dev/en/book" }]`
- Navigate again (e.g., /book → Home → /book): a third `page_view` should fire for each navigation.

Fail signals:
- `page_view` fires twice on hard load (double-counting — inline snippet + `PageViewTracker`).
- No `page_view` at all on SPA navigation.
- `page_path` missing or stale.

### `search_availability`

Trigger: Submit the date picker on `/book` with valid dates, or initial load when URL has valid `checkin`/`checkout`/`pax` params.

Pass criteria:
- Console log: `["event", "search_availability", payload]`.
- Payload includes:
  - `source` (enum): `header | mobile_nav | hero | booking_widget | deals | room_card | sticky_cta | unknown`
  - `pax` (number)
  - `nights` (number, computed — no raw date strings)
  - `lead_time_days` (number, computed — no raw date strings)

Fail signals:
- Raw `checkin` / `checkout` date strings in the payload.
- Missing `source` or obviously free-form source values (string sprawl).

### `select_item`

Trigger: Click an NR or Flex CTA on a room card (rooms list or book page list).

Pass criteria:
- Console log: `["event", "select_item", payload]`.
- Payload includes:
  - `item_list_id` (enum): `home_rooms_carousel | rooms_index | book_rooms | deals_index`
  - `item_list_name` (stable English mapping from plan)
  - `items[]` with exactly one item:
    - `item_id` = Room SKU (stable)
    - `item_name` (room display name, not SKU)
    - `item_category: "hostel"`
    - `affiliation: "Hostel Brikette"`
    - `currency: "EUR"`
    - `item_variant: "nr" | "flex"`

Fail signals:
- Double fire on one click (check `isNavigating` ref guard).
- `item_variant` at top-level instead of inside `items[]`.
- Missing `item_name` or `item_category`.

### `view_item_list`

Trigger: Initial render of rooms index, book page rooms list, deals index, home rooms carousel.

Pass criteria:
- Console log: `["event", "view_item_list", payload]`.
- Payload includes:
  - `item_list_id` (enum)
  - `item_list_name` (stable English mapping)
  - `items[]` where each item includes:
    - `item_id` (Room SKU)
    - `item_name` (room display name)
    - `index` (0-based, consistent per surface)
- Dedupe: fires once per navigation per `item_list_id`; re-fires on revisit (per-navigation dedupe, not per-session).

Fail signals:
- List fires repeatedly on state changes within the same navigation.
- List never fires on revisits (session-scoped dedupe bug).

### `view_item`

Trigger: Room detail page load.

Pass criteria:
- Console log: `["event", "view_item", payload]`.
- Payload includes `items[]` with `item_id = Room.sku` and `item_name` present.
- If plan/variant is known, `item_variant` is present.

Fail signals:
- Item identity uses rate codes or other unstable identifiers.

### `view_promotion`

Trigger: Deals/offers list becomes visible (initial render of deals index or offers surface).

Pass criteria:
- Console log: `["event", "view_promotion", payload]`.
- Payload includes:
  - `promotions[]` array where each entry has:
    - `promotion_id` (deal ID string)
    - `promotion_name` (deal title string)

Fail signals:
- `view_promotion` fires on every scroll or re-render (should fire once per navigation).
- Missing `promotions[]` array.

### `select_promotion`

Trigger: Click on a deal/offer card or CTA that navigates to a deal detail or applies a deal.

Pass criteria:
- Console log: `["event", "select_promotion", payload]`.
- Payload includes:
  - `promotions: [{ promotion_id, promotion_name }]` (single-item array for the selected promotion)

Fail signals:
- Multiple `select_promotion` fires per click.
- `promotions[]` contains more than one item.

### `begin_checkout` (room-selected, outbound)

Trigger: Click NR/Flex CTA on a room card that navigates directly to Octorate (post-TASK-37, no modal).

Pass criteria:
- Console log: `["event", "begin_checkout", payload]`.
- Payload includes:
  - `transport_type: "beacon"` (verifies `trackThenNavigate` wiring)
  - `event_callback` function present (navigation delayed until beacon dispatched or 200ms timeout)
  - `source` (enum)
  - `pax`, `nights`, `lead_time_days`
  - `items[]` with exactly one item:
    - `item_id = Room.sku`
    - `item_name` present
    - `item_category: "hostel"`
    - `affiliation: "Hostel Brikette"`
    - `currency: "EUR"`
    - `item_variant: "nr" | "flex"`
  - If deal context: `coupon: "<deal-id>"` present
- Navigation to Octorate URL happens after beacon callback (not immediately on click).

Fail signals:
- `begin_checkout` fired without `items[]`.
- `transport_type` absent (beacon not set — event may be lost on page unload).
- Same-tab navigation happens immediately without delay (callback not wired).
- `coupon` absent when launched from a deal context.

### `cta_click`

Trigger: Desktop header CTA, mobile nav CTA, hero primary CTA, booking widget CTA, content sticky CTA.

Pass criteria:
- Console log: `["event", "cta_click", payload]`.
- Payload includes:
  - `cta_id` (authoritative enum from plan)
  - `cta_location` (authoritative enum from plan)
- Fires exactly once per click.

Fail signals:
- Multiple event emissions per click.
- Free-form `cta_id` / `cta_location` values (string sprawl).

---

## Custom Dimensions Verification (After TASK-42)

After `cta_id`, `cta_location`, `item_list_id`, and `coupon` are registered as event-scoped custom dimensions in GA4 Admin (TASK-42), verify in DebugView:

1. Trigger a `cta_click` event with the Debugger extension active.
2. In GA4 DebugView, click the event name.
3. Confirm `cta_id` and `cta_location` appear in the expanded event params list.
4. Trigger a `begin_checkout` from a deal context.
5. Confirm `coupon` and `item_list_id` appear in event params.

If custom dimensions are not yet queryable in Explorations: allow 24–48h propagation delay after TASK-42 registration before expecting dimensions to appear in Explorations.

---

## Staging vs Prod Safety Checklist

Before and after each testing session:

- Confirm staging Measurement ID is loaded (Guardrails step #2).
- Confirm you did NOT test on `https://www.hostel-positano.com` (production).
- Confirm Google Analytics Debugger extension is toggled OFF on the production tab if open simultaneously.
- If you must reproduce an issue on production: rely on Console gtag tap (Option B) only; keep the session short; do NOT use DebugView on production as it pollutes production session data.
