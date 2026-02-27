---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-room-octorate-live-pricing
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-room-octorate-live-pricing/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260227-0047
Trigger-Why: Room detail pages show no live pricing or availability before the user navigates away to book.octorate.com. Guests cannot choose between NR and flex rates with prices shown before committing to the booking engine. This is the primary conversion friction point on individual room pages.
Trigger-Intended-Outcome: type: measurable | statement: Guests on room detail pages can select dates and guest count, see live per-night pricing for NR and flex rate options, and proceed directly to Octorate for the chosen room and rate — without needing to navigate to a separate book page first. | source: operator
---

# BRIK Room Pages — Live Pricing and Availability Fact-Find Brief

## Scope

### Summary

Room detail pages (`/rooms/[id]`) currently display a `RoomCard` with NR/flex booking buttons, but guests can only trigger navigation to Octorate; they cannot see the actual price for their selected dates on the page. A date picker exists structurally (dates are parsed from query params and passed to `RoomCard`), but there is no on-page UI for date/guest selection, and the price shown is a static "price from" figure sourced from `rates.json` — which is confirmed stale as of Feb 2026 (data ends Oct 2025). This fact-find maps the room detail page architecture, identifies the delta from the already-investigated book page integration (see prior fact-find `brik-octorate-live-availability`), and determines the recommended approach for adding an on-page date/guest selector plus live pricing on room detail pages.

### Goals
- Map the room detail page data flow: how dates/pax currently reach `RoomCard` from URL params, and what UI is absent.
- Confirm that the `rates.json` static snapshot is stale and document the impact on the "price from" display.
- Assess the Octorate booking widget/embed option as an alternative to building custom date-picker + availability UI.
- Determine whether the room detail page integration can reuse the API proxy and `useAvailability` hook from the book page plan (`brik-octorate-live-availability`) or needs a parallel implementation.
- Define the minimum viable on-page flow: date range picker + guest count → live NR/flex price → CTA to Octorate.
- Identify UI components to add to `RoomDetailContent.tsx` and wiring changes to `RoomCard.tsx`.

### Non-goals
- Replacing Octorate's payment/booking completion step.
- Apartment booking page (`ApartmentBookContent.tsx`) — different flow, WhatsApp fallback.
- OTA rate codes or OTA channel visibility.
- Book page (`BookPageContent.tsx`) — covered by the prior `brik-octorate-live-availability` plan.
- Building a full multi-room availability comparison (that is the book page's job).

### Constraints & Assumptions
- Constraints:
  - Booking completion stays on Octorate. `buildOctorateUrl.ts` is preserved.
  - `BOOKING_CODE = "45111"` is the live Octorate property code. Rate codes in `roomsData.ts` are live.
  - Brikette deploys to Cloudflare Pages (static export) for staging and Cloudflare Worker for production. API routes only exist on the Worker/production path.
  - Octorate Connect API credentials (`client_id`, `client_secret`) are not currently in any env file. Required before live API calls can be made.
  - Room detail pages use `generateStaticParams` — they are statically rendered at build time. All interactive elements are in the `RoomDetailContent` client component.
  - The apartment's `widgetRoomCode` is "TODO" — apartment is excluded from this scope.
- Assumptions:
  - The `rates.json` snapshot is pre-generated offline from Octorate data (no generation script found in repo). It is confirmed stale: latest date entry is 2025-10-30. Any "price from" display currently shown on room cards using this data is showing prices from 4+ months ago.
  - The Octorate ARI calendar endpoint (`GET /rest/v1/ari/calendar`) can return per-room pricing for a date range with valid OAuth. This was confirmed in the prior `brik-octorate-live-availability` fact-find.
  - CORS prevents direct browser-to-Octorate API calls. A server-side proxy (API route) is required.
  - The Octorate booking widget (JavaScript embed, "custom page" mode) would keep the booking within brikette.com's domain but is a rendered iframe-equivalent with Octorate's own UI — it does not give us control over price display or NR/flex distinction before handoff. This makes it unsuitable for the operator's goal of showing prices before booking initiation.

## Outcome Contract

- **Why:** Guests on room detail pages leave with no visibility of pricing for their dates. The information gap before the booking decision point — no date selector, no live price, no rate choice — creates unqualified handoffs to Octorate where guests encounter sticker shock or sold-out rooms.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Guests on room detail pages can select a date range and guest count, see the NR and flex prices for those dates, and click through to Octorate already knowing which rate they selected and what they will pay. Measured by: `select_item` event rate on room detail pages and begin_checkout completion rate post-launch vs pre-launch baseline.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx` — RSC wrapper for the room detail page. Calls `generateStaticParams` (all lang/room combinations). Renders `<RoomDetailContent lang={validLang} id={id} />` inside a `Suspense` fallback. Redirects unknown room IDs to the rooms listing.
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — Client component ("use client"). Owns the current page layout. Reads URL search params (`checkin`, `checkout`, `pax`) via `useSearchParams()`, parses them with `parseBookingQuery()`, and passes the result (`checkIn`, `checkOut`, `adults`, `queryState`) to `RoomCard`. **No date picker UI exists here.** Guests can arrive with pre-filled params via URL (e.g. from the StickyBookNow deep link) but have no way to change dates on the room detail page itself.

### Key Modules / Files

1. `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — Page layout component. `parseBookingQuery()` extracts dates from URL params. Current `queryState` logic: `"valid"` when params are present and valid, `"absent"` when absent. Note: `"invalid"` is also a supported value in the `RoomCardProps` type (used by the book page when the user enters invalid dates in a date picker), but `RoomDetailContent` currently only produces `"valid"` or `"absent"` — `"invalid"` is not reachable from URL param parsing alone. When an on-page date picker is added, `"invalid"` becomes reachable (user changes check-in to after check-out, or selects a stay shorter than 2 nights) and must be handled: CTAs should be disabled and the date picker should scroll into view. No date/pax selector UI currently exists. Renders `<RoomCard room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} queryState={queryState} />`.
2. `apps/brikette/src/components/rooms/RoomCard.tsx` — App-specific card adapter. Uses `useRoomPricing(room)` for "price from" display (today-only, reads stale `rates.json`). Pre-computes `nrOctorateUrl` and `flexOctorateUrl` when `queryState === "valid"`. `openNonRefundable` / `openFlexible` callbacks navigate to Octorate when URLs are available, or to `/book` when `queryState === "absent"`. **No live pricing by date range — only today's NR price from stale snapshot.**
3. `apps/brikette/src/hooks/useRoomPricing.ts` — React hook returning `{ lowestPrice, soldOut, loading }`. Calls `useRates()` which fetches `/data/rates.json` (force-cache). `lowestPrice` is for today only, falls back to `basePrice` when no rate found.
4. `packages/ui/src/context/RatesContext.tsx` — Fetches `/data/rates.json` on client mount. Confirmed stale: data ends 2025-10-30, today is 2026-02-27. Rooms will show either a stale price (if their rate code was in the file) or fall back to `basePrice`.
5. `apps/brikette/src/data/roomsData.ts` — Source of truth for all 11 rooms. Contains `widgetRoomCode` (numeric room ID in Octorate), `rateCodes.direct.{nr,flex}` (live rate plan codes), `occupancy`, `pricingModel` (perRoom vs perBed), `basePrice`. The apartment's `widgetRoomCode` is "TODO". All other rooms have real codes.
6. `apps/brikette/src/utils/buildOctorateUrl.ts` — Pure URL builder for `result.xhtml` deep links. Takes `checkin/checkout/pax/plan/roomSku/octorateRateCode/bookingCode`. Returns discriminated union `{ ok: true; url } | { ok: false; error }`. No changes needed here.
7. `apps/brikette/src/utils/bookingDateRules.ts` — `HOSTEL_MIN_STAY_NIGHTS = 2`, `HOSTEL_MAX_STAY_NIGHTS = 8`, `HOSTEL_MIN_PAX = 1`, `HOSTEL_MAX_PAX = 8`. These constraints apply to the hostel rooms (not apartment). Date picker must enforce these.
8. `apps/brikette/src/rooms/pricing.ts` / `apps/brikette/src/rooms/availability.ts` — Server/utility helpers: `getPriceForDate(room, date, calendar)` and `isSoldOut(room, date, calendar)`. Read from `RateCalendar` (the `rates.json` shape). These already handle the lookup logic; a live availability hook would replace the `rates.json` data source but could reuse the lookup logic structure.
9. `apps/brikette/src/types/rates.ts` — `RateCalendar = Record<string, DailyRate[]>`. `DailyRate = { date: string; nr: number; flex?: number }`. The API proxy response would need to conform to this shape (or a superset) to be compatible with existing pricing logic.
10. `packages/ui/src/organisms/StickyBookNow.tsx` — Floating CTA on room detail pages. Reads `checkin/checkout/pax` from URL params after mount. Generates a `calendar.xhtml` deep link (property-level, no room pre-selection). Does not use or display live pricing. Not directly in scope for the date picker change.

### Patterns & Conventions Observed

- **URL param as date state**: `RoomDetailContent` reads dates from search params rather than managing them as React state. Adding an on-page date picker means the date picker should write back to the URL (via `router.push` / `router.replace` with updated search params) so the URL remains shareable and the existing `parseBookingQuery` path continues to work.
- **`queryState` gate**: `"valid"` enables direct Octorate navigation; `"absent"` navigates to `/book`; `"invalid"` disables CTAs and scrolls to the date picker if a `datePickerRef` is provided (`RoomCard.tsx` already handles this via the `datePickerRef` prop). On the room detail page today, only `"valid"` and `"absent"` are reachable (from URL param parsing). Once an on-page date picker is added, `"invalid"` becomes reachable (e.g. checkout before checkin, stay too short/long) and the `datePickerRef` scroll-to behavior should be wired. The date picker should default-populate (today + 2 nights) so that the initial state is always `"valid"` rather than `"absent"`.
- **Static snapshot for pricing**: `RatesContext` / `useRoomPricing` use a pre-generated `rates.json` file. This pattern is already incompatible with per-date-range queries — a date picker change means the price must update. The prior book-page fact-find's approach (server-side API route proxy + `useAvailability` hook) is the right model to reuse.
- **Two-button NR/flex pattern**: Already implemented in `RoomCard`. The date picker adds context so these buttons can show live prices rather than navigation to `/book`. The structure is correct and should not change.
- **No API routes currently in brikette** (`apps/brikette/src/app/api/` directory does not exist). The prior `brik-octorate-live-availability` plan includes creating `/api/availability/route.ts`. This fact-find's integration should reuse that route rather than duplicating it.

### Data & Contracts

- Types/schemas/events:
  - `Room` from `roomsData.ts`: `widgetRoomCode` (numeric string), `rateCodes.direct.{nr,flex}`, `occupancy`, `pricingModel`.
  - `BuildOctorateUrlParams` / `BuildOctorateUrlResult` — unchanged.
  - `RateCalendar` / `DailyRate` — the shape the new availability API response should return (or be adapted to).
  - `BookingQuery` type in `RoomDetailContent.tsx` — `{ checkIn, checkOut, adults, queryState }`.
  - Octorate ARI calendar endpoint: `GET /rest/v1/ari/calendar` — returns per-room/per-date availability and price. Exact response shape confirmed in prior fact-find: includes `price` (NR nightly price) and availability status fields.
- Persistence:
  - `/data/rates.json` — static file, **stale since 2025-10-30**. Currently the only pricing data source on the room detail page. Will be superseded by live API once credentials are provisioned. Should be refreshed as an immediate stop-gap regardless of the live API work.
- API/contracts:
  - Octorate Connect REST API: `https://api.octorate.com/connect/rest/v1`. OAuth 2.0 (client_id + client_secret). Rate limit: 100 calls per accommodation per 5 minutes. Credentials not currently in repo.
  - Next.js API route proxy: to be created at `apps/brikette/src/app/api/availability/route.ts` (per `brik-octorate-live-availability` plan, TASK-01). This route does not exist yet.
  - Octorate booking engine: `result.xhtml` deep link — preserved as booking completion target.

### Dependency & Impact Map

- Upstream dependencies:
  - Octorate Connect API credentials (`client_id`, `client_secret`) — absent. Availability proxy cannot be tested with live Octorate data until credentials are provisioned (TASK-05 in prior plan).
  - The `/api/availability` route (from `brik-octorate-live-availability` TASK-01) must exist and be functional before the room detail page can consume live pricing.
- Downstream dependents:
  - `RoomDetailContent.tsx` — gains a date/pax picker UI block and writes selected dates back to URL params. `queryState` always becomes `"valid"` once picker has defaults.
  - `RoomCard.tsx` — gains per-date-range NR and flex price display in the action buttons (replacing static "price from"). The `useRoomPricing` hook is extended or replaced with one that queries per date range.
  - `StickyBookNow.tsx` — not changed. Continues to use URL params for its deep link (which are now always present when picker defaults are populated).
  - `useRoomPricing.ts` — either extended to accept a date range and query the API, or a new `useAvailabilityForRoom` hook wraps the API route for per-room queries.
  - i18n keys — new strings needed for: loading state, sold-out by date range, price display (NR price per night), flex label ("+ free cancellation").
- Likely blast radius:
  - Medium: `RoomDetailContent`, `RoomCard`, `useRoomPricing` (or new hook). URL param write-back via router.
  - Small: new i18n string keys, possibly `StickyBookNow` URL param handling (no logic change, just always populated).
  - Zero: `buildOctorateUrl.ts`, `roomsData.ts`, `bookingDateRules.ts`, `RoomsSection.tsx`, `BookPageContent.tsx`.

### Delivery & Channel Landscape
Not investigated: not applicable for a code-change deliverable.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (unit/component), governed test runner (`pnpm -w run test:governed`), Playwright/Cypress (e2e).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern> --no-coverage`.
- CI integration: full CI suite on PRs; typecheck + lint gate pre-commit.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `buildOctorateUrl` | Unit | `apps/brikette/src/utils/buildOctorateUrl.test.ts` | Well-covered. Unchanged. |
| `bookingDateRules` | Unit | `apps/brikette/src/test/utils/bookingDateRules.test.ts` | Min/max stay, pax bounds. |
| Room CTAs (GA4) | Component | `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` | Tests `RoomCard` CTA firing. |
| `view_item` on detail pages | Component | `apps/brikette/src/test/components/ga4-view-item-detail.test.tsx` | Fires view_item on detail page mount. |
| StickyBookNow GA4 | Component | `apps/brikette/src/test/components/ga4-35-sticky-begin-checkout.test.tsx` | begin_checkout on sticky CTA click. |

#### Coverage Gaps

- Untested paths:
  - Date picker UI interaction on room detail page (does not exist yet).
  - Per-date-range availability query from room detail page.
  - `RoomCard` rendering live NR/flex prices from API response.
  - Sold-out state on room detail page for specific date range.
  - Loading / error / stale-data states in per-room availability hook.
  - URL param write-back when user changes dates on room detail page.
- Extinct tests: None identified (no test references removed code paths).

#### Testability Assessment

- Easy to test:
  - Date picker state management and URL param write-back (unit/component with mocked router).
  - Per-room availability hook (`useAvailabilityForRoom`) with mocked fetch / API response.
  - `RoomCard` rendering price label for NR/flex given mock availability data.
  - Sold-out state rendering.
- Hard to test:
  - Full end-to-end with live Octorate credentials (requires E2E environment with real API access).
  - Debounce timing on date change → availability fetch.
- Test seams needed:
  - Mock for the availability API route (`/api/availability`) via `jest.mock` or MSW.
  - Mock for `useSearchParams()` to control initial date state.

#### Recommended Test Approach
- Unit tests for: `parseBookingQuery` with edge cases (invalid dates, absent params, URL write-back helper).
- Component tests for: date picker interaction, `RoomCard` displaying live prices (mocked hook), sold-out rendering, loading skeleton.
- Integration tests for: API route `GET /api/availability` with mocked Octorate response.
- E2E tests for: date selection → price display → CTA click → navigation to Octorate.

### Recent Git History (Targeted)

- `apps/brikette/src/utils/buildOctorateUrl.ts` — Last change: `f1652ec2b5` "brikette: preserve selected stay by using octorate result endpoint". Stable. Pure function. No changes needed.
- `apps/brikette/src/data/roomsData.ts` — Last substantive change: initial commit (all rate codes present). Apartment `widgetRoomCode = "TODO"` is a known gap.
- `apps/brikette/src/components/rooms/RoomCard.tsx` — Last change: part of the CTA GA4 wave (`066b4d0e4b`). `useRoomPricing` call and two-button NR/flex pattern already in place.
- `apps/brikette/public/data/rates.json` — Last change: `18959d44a5` ("pullman work pt1", 2025-12-22). Data ends 2025-10-30. Confirmed stale by ~4 months.

## External Research

- **Octorate Connect API** — Confirmed to have `GET /rest/v1/ari/calendar` for per-room availability and pricing. Requires OAuth 2.0 (client_id + client_secret). Rate limit: 100 calls per accommodation per 5 minutes. Source: `api.octorate.com/connect/rest/v1/integration/openapi.yaml` (OpenAPI spec).
- **Octorate booking widget** — JavaScript snippet embedded via body tag. Default mode redirects to `book.octorate.com`. "Custom page" option keeps the booking on the operator's own domain by redirecting within the operator's site. However, the widget renders Octorate's own UI — it does not expose prices before the guest enters the booking engine. It does not allow the operator to display NR vs flex pricing side-by-side before booking initiation. This makes it unsuitable for the goal of showing prices on the room detail page before CTA click. Source: `community.octorate.com` widget documentation.
- **rates.json stale date** — Confirmed from direct file inspection: latest entry is `2025-10-30`. Today is 2026-02-27. The `rates.json` snapshot is approximately 4 months stale. Any room that falls back to `basePrice` is showing a hardcoded price set in `roomsData.ts` rather than a stale `rates.json` entry. Source: `apps/brikette/public/data/rates.json` (direct read).

## Questions

### Resolved

- Q: Does the Octorate booking widget allow the operator to display NR and flex prices before the guest initiates booking, while keeping the user on brikette.com?
  - A: No. The widget (in "custom page" mode) keeps the domain fixed but renders Octorate's own booking UI — it does not expose pricing data to the operator's page before the guest is in the booking engine. The custom page option redirects the widget to an operator-specified page rather than `book.octorate.com`, but it still shows Octorate's interface. This does not meet the requirement of showing prices on the room detail page before booking handoff.
  - Evidence: Octorate community documentation, widget behavior description.

- Q: Does the room detail page already have a date picker?
  - A: No. `RoomDetailContent.tsx` reads dates from URL search params and passes them to `RoomCard`, but there is no UI for the guest to select dates. Guests can arrive with pre-filled dates via URL (e.g., from StickyBookNow or a shared link), but cannot change dates on the page itself.
  - Evidence: `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` lines 246–249.

- Q: Does the "price from" display on room detail pages currently show live pricing?
  - A: No. It reads from `rates.json` (stale since 2025-10-30). As of today (2026-02-27) this data is 4 months old. Rooms either show a stale cached price or fall back to the hardcoded `basePrice` from `roomsData.ts`. Neither represents live pricing.
  - Evidence: `apps/brikette/public/data/rates.json` (tail confirms last date 2025-10-30); `packages/ui/src/context/RatesContext.tsx` (fetch pattern, force-cache).

- Q: Should the room detail page reuse the `/api/availability` route from the `brik-octorate-live-availability` plan, or build a separate route?
  - A: Reuse. The API route serves the same need: per-room availability + pricing for a date range from Octorate ARI. Both the book page and the room detail page require the same inputs (room rate code, checkin, checkout, pax) and need the same outputs (NR price, availability status). Duplicating the route would create maintenance divergence. **Important**: the API contract must be agreed on once, at TASK-01 specification time, for both surfaces. The proposed contract `{ nr: number | null; flex: number | null; available: boolean }` per room is a reasonable starting point, but it is not yet defined in the prior plan — TASK-01 in `brik-octorate-live-availability` must explicitly specify the response schema, and this plan's tasks must use that schema verbatim. If the prior plan's TASK-01 only returns NR price (not flex), the room detail page integration must adapt to that same contract rather than diverge. Reconciliation between plans on this contract is a planning prerequisite.
  - Evidence: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` (same date params), `apps/brikette/src/data/roomsData.ts` (same rate codes used for both pages), `brik-octorate-live-availability/plan.md` TASK-01 (defines the route, contract not yet finalised).

- Q: What is the minimum viable UI on the room detail page?
  - A: Two native `<input type="date">` fields (check-in / check-out, matching the pattern in `ApartmentBookContent.tsx`) plus a pax selector (numeric input or buttons, bounded by `HOSTEL_MIN_PAX` / `HOSTEL_MAX_PAX` and `room.occupancy`). This matches the existing `ApartmentBookContent` UI pattern (steps 1 + 2) and introduces no new UI package dependency. Booking completion flows via the existing NR/flex CTAs in `RoomCard`.
  - Evidence: `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` (date input + pax selector pattern); `apps/brikette/src/utils/bookingDateRules.ts` (bounds constants).

- Q: What is the integration architecture — server-side API route proxy vs client-side fetch?
  - A: Server-side API route proxy (Next.js Route Handler) is required. Direct browser calls to `api.octorate.com` will fail due to CORS. The API route server-proxies the Octorate ARI call, holds the OAuth secret, and returns a simplified payload to the client. This is consistent with the approach defined in the prior `brik-octorate-live-availability` plan (TASK-01).
  - Evidence: Octorate Connect API uses OAuth 2.0 with server-held credentials; browser CORS constraints; prior fact-find architectural decision.

- Q: Can the Octorate ARI calendar rate limit (100 calls/accommodation/5 min) cause problems at room detail page scale?
  - A: Risk exists but is manageable with caching. Each date-range change on a room detail page would trigger one API call. At typical Brikette traffic levels (low-medium), the limit is unlikely to be hit. However, debouncing on date input (300–500 ms) and short-lived server-side cache (60s TTL keyed by `room_id+checkin+checkout`) will keep well within limits. This matches the approach planned for the book page.
  - Evidence: Octorate API docs (100 calls/5 min confirmed); `ApartmentBookContent.tsx` shows similar state-driven navigation patterns.

### Open (Operator Input Required)

No genuinely open questions remain. The date picker default question was resolved by reasoning.

### Previously Open — Now Resolved

- Q: Should the room detail page date picker default to today + 2 nights, or should dates be left empty until the guest selects them?
  - A: Default to today + 2 nights, matching `parseBookingQuery`'s existing fallback behavior and the book page pattern. This minimises implementation complexity and immediately produces `queryState === "valid"` so the price and CTAs are shown on first render — consistent with the operator's goal of reducing friction before booking handoff. Empty defaults would require the guest to interact before any price is shown, increasing friction without a documented benefit in this context.
  - Evidence: `parseBookingQuery()` in `RoomDetailContent.tsx` (existing fallback is today + 2 nights); `ApartmentBookContent.tsx` (pre-populated state pattern); operator-stated goal: show prices before handoff.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Room detail page entry points (`RoomDetailContent.tsx`, `page.tsx`) | Yes | None | No |
| `RoomCard.tsx` — current pricing and CTA state | Yes | None | No |
| `useRoomPricing` / `RatesContext` / `rates.json` freshness | Yes | [Scope gap in investigation] Minor: generation script for `rates.json` not found in repo — source of how it was originally populated is unknown | No (does not block planning; stop-gap is refresh the file manually) |
| `buildOctorateUrl.ts` mapping to Octorate identifiers | Yes | None | No |
| `bookingDateRules.ts` constraints | Yes | None | No |
| Octorate Connect API — ARI calendar endpoint | Yes (via OpenAPI spec URL fetch) | [Boundary coverage] Moderate: exact query parameters for `GET /rest/v1/ari/calendar` (accommodation ID format, date range params) not fully confirmed from public docs. Prior fact-find noted similar uncertainty. TASK-00 in prior plan addresses this. | No (waived — TASK-00 in `brik-octorate-live-availability` plan specifically addresses schema verification pre-build) |
| Octorate widget/embed option | Yes | None (assessed and ruled out — see Resolved Q1) | No |
| Dependency on prior plan (`brik-octorate-live-availability`) | Yes | [Missing precondition] Moderate: the `/api/availability` route required by this plan's room detail integration does not yet exist (it is TASK-01 in the prior active plan). Room detail page implementation depends on this route. | No (addressed in planning constraint — room detail tasks are sequenced after API route task, or shared with it) |
| Test landscape for new surfaces | Yes | [Scope gap in investigation] Minor: no existing test for `RoomDetailContent.tsx` date-handling or `RoomCard` per-date pricing. New test surface, not a gap in existing coverage. | No |
| i18n strings for new UI | Partial | [Missing domain coverage] Minor: new strings needed (loading state, sold-out label, price per night display, flex label). Not investigated in detail — scope is consistent with existing i18n pattern. | No |

## Confidence Inputs

- **Implementation: 82%**
  - Evidence: All key files read and understood. Date picker pattern exists in `ApartmentBookContent.tsx`. URL param write-back is standard Next.js pattern. API route reuse from prior plan is well-defined. Rate code mapping is complete for all rooms except apartment (which is out of scope).
  - What raises to ≥80: Already at 82%. Confirmation of Octorate ARI exact query params (TASK-00 in prior plan) would raise to 88%.
  - What raises to ≥90: Octorate credentials provisioned and TASK-01 (API route) complete from prior plan. This plan's tasks become straightforward wiring once the proxy exists.

- **Approach: 80%**
  - Evidence: API proxy + hook pattern is established and correct. Date picker pattern from `ApartmentBookContent.tsx` is reusable. Widget option assessed and correctly ruled out. URL param write-back is idiomatic for Next.js App Router. Date picker default (today + 2 nights) resolved by reasoning — consistent with existing fallback and operator goal.
  - What raises to ≥80: Already at 80%. The resolved date picker default eliminates the prior blocker.
  - What raises to ≥90: TASK-00 ARI schema verification complete.

- **Impact: 85%**
  - Evidence: Operator-stated requirement. Current state confirmed — no prices, no date selection on room detail pages. `rates.json` is stale. The gap is concrete and the benefit of showing prices before handoff is clear.
  - What raises to ≥90: Post-launch measurement showing `select_item` rate lift on room detail pages.

- **Delivery-Readiness: 65%**
  - Evidence: Architecture is clear and dependencies are mapped. However, two external blockers exist: (1) Octorate API credentials absent, (2) TASK-01 API route from prior plan must be built first. Both are known and tracked.
  - What raises to ≥80: Octorate credentials provisioned and TASK-01 merged.
  - What raises to ≥90: Feature flag in place and TASK-00 ARI schema verification complete.

- **Testability: 80%**
  - Evidence: All new surfaces are mockable (fetch, router, hooks). Existing test patterns (React Testing Library, Jest mocks) apply directly.
  - What raises to ≥90: MSW or similar HTTP mock at API route level for integration-level tests.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Octorate credentials not available when build starts | High (absent today) | High (blocks live API path) | Feature flag gates live path. Static `rates.json` fallback shown until credentials arrive. Refresh `rates.json` now as stop-gap. |
| `rates.json` stale data is currently shown to users | Confirmed | Medium | Refresh `rates.json` as an immediate stop-gap action (independent of the live pricing feature). |
| ARI calendar endpoint query params differ from assumed | Medium | Medium | TASK-00 (schema verification) in prior plan must run first. Checkpoint gate in plan controls downstream task start. |
| Rate limit breach during date-picker interaction | Low (traffic is low-medium) | Medium | Debounce (300 ms) + 60s server-side cache per room/date. |
| API route not available on staging (static export path) | Medium | Low | Feature flag can default to off on staging. Document limitation. |
| Apartment `widgetRoomCode = "TODO"` causes a null-pointer risk | Low (apartment is out of scope) | Low | Out of scope. Existing code guards this already (apartment uses separate booking page). |
| Date picker default (today + 2 nights) shows a sold-out room | Low | Medium | Sold-out state must be handled — show a clear sold-out indicator with a suggestion to change dates. |

## Planning Constraints & Notes

- **Prior plan dependency**: This fact-find's implementation depends on `brik-octorate-live-availability` plan's TASK-01 (API route) and TASK-05 (credentials). The room detail page plan tasks should be sequenced to either: (a) share the same plan by adding tasks to the prior plan, or (b) create a new plan that gates its API-consuming tasks behind TASK-01 completion. Recommend option (a): add room detail tasks to the existing `brik-octorate-live-availability` plan to keep credentials/route/feature-flag work in one plan.
- **API contract reconciliation**: TASK-01 in the prior plan must explicitly specify the `/api/availability` response schema. Both the book page and room detail page must consume the same contract. The plan for this surface must reference TASK-01's specified contract rather than defining its own. The planning task (TASK-RPC or equivalent) must be written as: "consume the response shape specified in TASK-01" — not "expect `{ nr, flex, available }`" — to prevent divergence if TASK-01's contract is refined during implementation.
- **Must-follow patterns**: URL param write-back for date state (idiomatic Next.js App Router). Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`. Date/pax validation via `bookingDateRules.ts`. `buildOctorateUrl.ts` preserved.
- **Rollout/rollback**: Feature flag allows shipping UI without live credentials. Rollback = toggle flag.
- **Observability**: Existing GA4 events (`select_item`, `begin_checkout`) cover the funnel. No new event types needed. Add `queryState` as an event parameter if not already present.
- **rates.json stop-gap**: Regardless of when live API integration ships, `rates.json` should be refreshed now. The stale data is hurting the "price from" display today.
- **Feature-flag-off price display**: When the live API feature flag is off, the date picker must still render (the UI ships independently of credentials). Pricing display in this state should show `basePrice` from `roomsData.ts` with a label indicating it is an approximate starting price, not a date-specific rate (e.g., "from €X / night"). This prevents the date picker from falling back to stale `rates.json` prices for user-selected dates that are months in the past, and avoids showing no price at all (which could suppress CTA engagement). Plan tasks must specify this fallback display behavior explicitly.

## Suggested Task Seeds (Non-binding)

These are additive to the `brik-octorate-live-availability` plan's task list:

- TASK-DP: Add date range picker + pax selector to `RoomDetailContent.tsx` (UI only, writes to URL params, defaults to today + 2 nights)
- TASK-RPC: Wire per-room availability hook to `RoomCard.tsx` — replace `useRoomPricing` with `useAvailabilityForRoom` when `queryState === "valid"` (depends on TASK-01 API route)
- TASK-RPR: Show live NR price on NR button, flex policy label ("+ free cancellation") on flex button
- TASK-RD-TEST: Tests — date picker interaction, RoomCard price/sold-out rendering, URL param write-back
- TASK-RATES-REFRESH: Refresh `rates.json` immediately as a stop-gap (separate, can run now in parallel)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: Room detail pages show a date picker and guest count selector; RoomCard displays live NR and flex prices for selected dates; NR/flex CTAs navigate to Octorate with the correct rate code and dates; sold-out state shown when room is unavailable for selected dates; loading and error states handled.
- Post-delivery measurement plan: Compare `select_item` event rate on `/rooms/[id]` pages before and after launch. Track begin_checkout completion rate. Monitor for Octorate rate limit errors in API route logs.

## Evidence Gap Review

### Gaps Addressed

1. **Citation Integrity**: All file paths confirmed by direct read. Rate codes confirmed live. `rates.json` stale date confirmed by direct read (tail of file). Octorate API endpoints confirmed via OpenAPI spec fetch. Widget behavior confirmed via community documentation.
2. **Boundary Coverage**: API boundary (Octorate ARI, CORS constraint, OAuth) confirmed. Feature flag pattern established. Security boundary: OAuth secret held server-side, not exposed to client.
3. **Testing/Validation Coverage**: Existing tests verified by file listing and content inspection. Coverage gaps explicitly listed. New test seams identified.
4. **Business Validation Coverage**: Operator requirements explicitly cited as evidence refs in dispatch. No additional hypotheses needed — the problem and desired solution are operator-stated.
5. **Confidence Calibration**: Scores reflect evidence with explicit blockers (credentials, prior plan TASK-01) noted. Delivery-Readiness intentionally low (65%) due to real external dependencies.

### Confidence Adjustments

- Delivery-Readiness lowered to 65% (vs. a naive 85%) due to confirmed external dependencies: Octorate credentials absent, API route not yet built.
- Approach set to 80%: date picker default resolved by agent reasoning (today + 2 nights). Prior 78% reflected an open question that has been moved to Resolved.
- No scores inflated based on optimism.

### Remaining Assumptions

- Octorate ARI calendar endpoint parameters are as assumed from the OpenAPI spec (`accommodation`, `from`, `to` date range). TASK-00 in prior plan verifies this.
- CORS prevents direct browser calls to Octorate API. This is a strong assumption supported by general knowledge of the Octorate domain architecture, not a confirmed test against the endpoint.
- The API route created in `brik-octorate-live-availability` TASK-01 will accept per-room queries and return a response schema to be specified in TASK-01. This plan's tasks must reference that schema verbatim — not define their own — to prevent contract divergence between the book page and room detail page consumers.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None that block writing a plan. The plan itself should note TASK-01 (API route) as a hard prerequisite for the live pricing tasks.
- Recommended next step: `/lp-do-plan brik-room-octorate-live-pricing --auto`. Recommend the plan explicitly evaluates whether to append tasks to the `brik-octorate-live-availability` plan (single plan, single feature flag) or create a sister plan that gates on the API route being ready.
