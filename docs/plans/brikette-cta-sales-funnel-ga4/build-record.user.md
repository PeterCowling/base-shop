---
Type: Build-Record
Plan: brikette-cta-sales-funnel-ga4
Status: Complete
Created: 2026-02-22
Card-ID: BRIK-005
---

# Build Record — Brikette CTA + GA4 Sales Funnel

## What Was Built

Replaced Brikette's booking modal flow with a direct CTA → `/book` → Octorate funnel,
upgraded the `/book` page with conversion content, added GA4 e-commerce event tracking
across the full funnel, and locked the implementation with unit tests + a live smoke test.

### Track E — Modal Removal
- Deleted `BookingModal` / `Booking2Modal` and all 9+2 call sites.
- Migrated all booking-intent CTAs to router.push(`/{lang}/book`) or direct Octorate links.
- Removed extinct modal tests; updated 7 affected tests.

### Track A — `/book` Page Conversion Content
- Added `DirectBookingPerks`, social proof, FAQ, `LocationInline`, deal-applied banner.
- JSON-LD: `LodgingBusiness`, `FAQPage`, `BreadcrumbList`.
- Improved H1/meta; `?deal=ID` param wires deal banner on entry.

### Track B — ContentStickyCta
- Added `ContentStickyCta` to all 10 high-traffic pages lacking booking CTAs.

### Track C — GA4 Funnel
- `cta_click` wired to header / hero / widget / content pages / offers modal.
- `search_availability` on `/book` date-picker submit + initial valid URL params.
- `select_item` (full GA4Item fields) on room card NR/Flex click.
- `begin_checkout` via `trackThenNavigate` (beacon + timeout fallback) on room selection.
- `view_promotion` / `select_promotion` on deals page.
- SPA `page_view` on internal navigation via `PageViewTracker` (`usePathname` hook).
- `handoff_to_engine` fires at every Octorate navigation point.

### Track D — Tests + Verification
- Unit tests for all helpers: `trackThenNavigate`, `fireSelectItem`, `fireBeginCheckout`,
  `fireViewPromotion`, `fireSelectPromotion`, `PageViewTracker`, `reportWebVitals`.
- `verification.md` updated: DebugView method, SPA page_view steps, custom dimensions,
  promotions checklists, Network tab filter `**/g/collect`.
- Playwright smoke test (`apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs`) written and
  passing against live hostel-positano.com.

## Tests Run

| Test | Command | Result |
|---|---|---|
| All brikette unit tests | `pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs` | Pass |
| Page-view-tracker | `--testPathPattern='page-view-tracker'` | 4/4 pass |
| GA4 funnel smoke (live) | `E2E_BASE_URL=https://hostel-positano.com node apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` | PASSED |

## GA4 Smoke Test Evidence (TASK-38, 2026-02-22)

Site: `https://hostel-positano.com` (live production)
Dates: `2026-03-01 → 2026-03-03`, pax=2
Measurement ID confirmed: `G-2ZSYXG8R7T`

Events captured on NR button click from `/en/book`:
- `page_view` ✓
- `view_item_list` ✓ (item_list_id=book_rooms, all rooms present)
- `search_availability` ✓ (source=booking_widget, pax=2, nights=2, lead_time_days=7)
- `select_item` ✓ (item_id=double_room, item_category=hostel, affiliation=Hostel Brikette)
- `begin_checkout` ✓ (source=room_card, item_list_id=book_rooms, transport_type=beacon)
- `handoff_to_engine` ✓
- Octorate navigation ✓ → `https://book.octorate.com/octobook/site/reservation/confirm.xhtml`

IT locale (`/it/prenota`) skipped — redirects to `/en` (route not in static export; expected).

## TASK-42 — GA4 Custom Dimensions (Complete 2026-02-22)

Registered via GA4 Admin API v1beta using `ga4-automation-bot@brikette-web.iam.gserviceaccount.com`:

| Dimension | Parameter | Scope | Status |
|---|---|---|---|
| CTA ID | `cta_id` | Event | ✓ created |
| CTA Location | `cta_location` | Event | ✓ created |
| Item List ID | `item_list_id` | Event | ✓ created |
| Coupon | `coupon` | Event | ✓ created |

Property: `properties/474488225`. Allow 24–48h propagation before dimensions appear in Explorations.

## Key Architectural Decisions Locked

| Decision | Resolution |
|---|---|
| URL strategy | `/{lang}/book` for all in-app navigation; `getSlug` for SEO-facing external URLs |
| Dates gate | Disable RoomCard CTAs until valid dates present on `/book` |
| Analytics placement | Callback props from app layer; `packages/ui` stays analytics-free |
| Beacon transport | `trackThenNavigate` owns `event_callback` wiring; 150ms timeout fallback |
| SPA page_view | Pattern B — single fire on hard load (inline snippet only); one per SPA nav (PageViewTracker) |
| Modal removal | BookingModal + Booking2Modal fully deleted; no backward-compat shims |
