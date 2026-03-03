---
Type: Build-Record
Status: Complete
Feature-Slug: brik-room-octorate-live-pricing
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record: BRIK Room Pages — Live Pricing and Availability

## Outcome Contract

- **Why:** Guests on room detail pages leave with no visibility of pricing for their dates. The information gap before the booking decision point — no date selector, no live price, no rate choice — creates unqualified handoffs to Octorate where guests encounter sticker shock or sold-out rooms.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Guests on room detail pages can select a date range and guest count, see the NR price for those dates, and click through to Octorate already knowing which rate they selected and what they will pay. Measured by: `select_item` event rate on room detail pages and `begin_checkout` completion rate post-launch vs pre-launch baseline.
- **Source:** operator

## What Was Built

**TASK-DP (pre-existing, Complete):** Date range picker and adult pax selector added to `RoomDetailContent`. Dates default to today + 2 nights, pax=1. Inputs sync to URL via `router.replace` so state is shareable and bookmarkable.

**TASK-RPC:** New hook `useAvailabilityForRoom` created at `apps/brikette/src/hooks/useAvailabilityForRoom.ts`. The hook calls the existing `/api/availability` route with `checkin`, `checkout`, and `pax` params, fetches all rooms, and filters the response by matching `r.octorateRoomId === room.widgetRoomCode`. Room matching required a targeted fix: the Octorate HTML `<h1>` elements carry a `data-id` numeric attribute (matching `widgetRoomCode`) rather than the text name — `octorateRoomId` field was added to the `OctorateRoom` interface extracted from this attribute, and `RoomsSection.tsx` matching was updated accordingly. The hook uses a 300ms debounce and an `AbortController` for clean unmount behaviour.

**TASK-RPR:** `RoomDetailContent.tsx` wired to call `useAvailabilityForRoom` with picker state and pass the result as `availabilityRoom` to `<RoomCard>`. No changes to `RoomCard.tsx` itself — the `availabilityRoom?: OctorateRoom` prop already existed from the sibling plan. Guests now see live NR prices and sold-out state for their selected dates on room detail pages.

**TASK-RD-TEST:** Three test files covering the full TC matrix:
- `useAvailabilityForRoom.test.ts` — 7 unit tests for the hook (fetch, debounce, abort, error states, no-match)
- `room-card-live-pricing.test.tsx` — 3 tests for RoomCard display integration (invalid queryState, CTA click navigation, backward compat)
- `room-detail-date-picker.test.tsx` — 4 tests for date picker in RoomDetailContent (default seeding, check-in change, invalid stay, pax minimum)

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern="useAvailabilityForRoom\|room-card-live-pricing\|room-detail-date-picker" --no-coverage` | Pass | 14/14 new tests pass |
| Full brikette regression (7 suites) | Pass | 40/40 tests pass across all relevant suites |

## Validation Evidence

### TASK-RPC
- TC-RPC-01: Fetch fires on valid dates; matched `OctorateRoom` (octorateRoomId="7") returned — ✅ pass
- TC-RPC-02: Empty dates → no fetch, returns empty state — ✅ pass
- TC-RPC-03: `available: false` room → returned as-is — ✅ pass
- TC-RPC-04: Rapid rerenders within 300ms → only final params appear in fetch — ✅ pass
- TC-RPC-05: Unmount during in-flight fetch → no throw, no state warning — ✅ pass
- TC-RPC-06: HTTP 500 response → `error` set, `availabilityRoom` undefined — ✅ pass
- TC-RPC-07: No matching room in response → `availabilityRoom` undefined — ✅ pass

### TASK-RPR
- TC-RPR-05: `queryState=invalid` → both NR and flex CTAs disabled regardless of `availabilityRoom` — ✅ pass
- TC-RPR-06: NR CTA click with `queryState=absent` (enabled) → `router.push("/en/book")` called — ✅ pass
- TC-RPR-07: No `availabilityRoom` → `useRoomPricing` fallback, price shown, NR button enabled — ✅ pass
- TC-RPR-01 to TC-RPR-04: Covered by pre-existing `RoomCard.availability.test.tsx` (TC-04-01 to TC-04-06) — ✅ pass (no regression)

### TASK-RD-TEST
- TC-DP-01: No URL params → `router.replace` called with today + 2 nights, pax=1 — ✅ pass
- TC-DP-02: Check-in change → `router.replace` called with new `checkin` param — ✅ pass
- TC-DP-03: `checkin === checkout` (invalid stay) → RoomCard receives `queryState=invalid` — ✅ pass
- TC-DP-04: Pax at minimum (1) → decrease-adults button disabled — ✅ pass

## Scope Deviations

**Controlled expansion — room matching fix:** TASK-RPC's Red step confirmed `octorateRoomName` (text like "Dorm") does not match `widgetRoomCode` (numeric like "7"). Rather than adding an `octorateRoomName` field to `Room` interface (as the plan anticipated as one option), the fix was cleaner: extract the numeric `data-id` attribute from the Octorate `<h1>` into a new `octorateRoomId: string` field on `OctorateRoom`, and match on that. This also fixed the pre-existing matching bug in `RoomsSection.tsx`. Scope expanded to `route.ts` and `RoomsSection.tsx` in addition to the planned `useAvailabilityForRoom.ts`.
