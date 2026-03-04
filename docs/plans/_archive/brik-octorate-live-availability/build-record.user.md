---
Status: Complete
Build-Date: 2026-02-27
Plan-Slug: brik-octorate-live-availability
---

# Build Record — brik-octorate-live-availability

## Outcome Contract

- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Guests on `/en/book` with valid dates see per-room live prices or `basePrice` fallback before being handed off to Octorate.

## Shipped Tasks

- TASK-05: Env var provisioning (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`) — complete
- TASK-01: `/api/availability` route — HTML-scraping proxy for `result.xhtml?codice=45111` — complete
- TASK-02: `useAvailability` hook with 300ms debounce — complete
- TASK-03: `BookPageContent` → `RoomsSection` → `RoomCard` wiring — complete
- TASK-04: `RoomCard` live price / sold-out / loading display states — complete
- TASK-06: Tests (hook + API route, HTML fixture, price parsing) — complete
- TASK-07: E2E smoke test — complete
- TASK-08: i18n availability state strings — complete

## Evidence

- `apps/brikette/src/app/api/availability/route.ts` — availability proxy
- `apps/brikette/src/hooks/useAvailability.ts` — hook
- `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — per-room helper
- `apps/brikette/src/components/rooms/RoomCard.tsx` — display states
- `apps/brikette/src/config/env.ts` — `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` flag
- Feature flag gates live path; `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=0` restores basePrice fallback

## Approach

HTML-scraping of public Octobook endpoint (`result.xhtml?codice=45111`) — no OAuth, no paid API. 5-min `next: { revalidate: 300 }` cache. CORS open on Octorate side. Price format `"189 ,98"` (space before comma) handled in parser.
