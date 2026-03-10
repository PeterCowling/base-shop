---
Status: Complete
Build-Date: 2026-03-02
Plan-Slug: brik-live-pricing-room-matching
---

# Build Record — brik-live-pricing-room-matching

## Outcome Contract

- **Why:** Live pricing is running in production but only one room type shows a live price. The majority of rooms silently fall back to `basePrice`. Guests comparing rooms see inconsistent data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Brikette room categories (Dorm, Double, Apartment) show live Octorate prices on the /book page and room detail pages when dates are selected and availability data is returned by the proxy.
- **Source:** operator

## Shipped Tasks

- TASK-01: Add `octorateRoomCategory` to `Room` interface + populate all 11 rooms in `roomsData.ts` — complete
- TASK-02: Add `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` to route parser; normalise `"Dorm Room"` → `"Dorm"` in `parseRoomSection` — complete
- TASK-03: Create `aggregateAvailabilityByCategory` utility; fix matching in `RoomsSection.tsx`, `useAvailabilityForRoom.ts`, `HomeContent.tsx` — complete
- TASK-04: Update `route.test.ts` (fixtures to `data-id="3"`, normalization test); update `useAvailabilityForRoom.test.ts` (name-based mocks, aggregation tests); create `aggregateAvailabilityByCategory.test.ts` — complete

## Evidence

- `apps/brikette/src/data/roomsData.ts` — `octorateRoomCategory` field added to `Room` interface; all 11 rooms populated
- `apps/brikette/src/types/octorate-availability.ts` — `octorateRoomId` annotated: always `"3"` in live HTML, do not use for matching
- `apps/brikette/src/app/api/availability/route.ts` — `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` + normalization in `parseRoomSection`
- `apps/brikette/src/utils/aggregateAvailabilityByCategory.ts` — new shared aggregation utility (min priceFrom, any-available)
- `apps/brikette/src/components/rooms/RoomsSection.tsx` — matching fixed to category-based aggregation
- `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — matching fixed to category-based aggregation
- `apps/brikette/src/app/[lang]/HomeContent.tsx` — matching fixed to category-based aggregation
- `apps/brikette/src/utils/aggregateAvailabilityByCategory.test.ts` — 8 unit tests (TC-03-01 through TC-03-08)
- Commits: `79eec9842b` (Wave 1), `5570f64174` (Wave 2), `a3c5b5c807` (Wave 3)

## Approach

Root cause: `data-id` on Octobook `<h1>` is a JSF UI animation attribute — always `"3"` in live HTML, not a room identifier. Previous matching via `widgetRoomCode === octorateRoomId` only matched the single room with code `"3"`.

Fix: name-based matching. The route parser normalises `<h1>` text variants to canonical category strings at parse time. Three consumer sites now iterate `roomsData` and call `aggregateAvailabilityByCategory(rooms, room.octorateRoomCategory)` — which filters sections by `octorateRoomName`, picks minimum `priceFrom` across available sections, and returns `available: true` when any section is available.

No changes to Octobook fetch logic, feature flag, or cache TTL. `octorateRoomId` field retained in the type with a deprecation note (backwards-compatible; no existing callers depend on it for matching after this change).
