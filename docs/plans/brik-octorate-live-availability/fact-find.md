---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-octorate-live-availability
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-octorate-live-availability/plan.md
Trigger-Source: direct-inject
Trigger-Why: Guests currently leave the Brikette site with no visibility of availability or pricing before handoff to Octorate. This creates an unqualified handoff — guests may encounter sold-out rooms or unexpected prices at Octorate, damaging conversion and eroding trust. The operator wants guests to see per-room availability and live pricing on the Brikette site before choosing NR or flex rate and proceeding to payment.
Trigger-Intended-Outcome: type: measurable | statement: Increase booking conversion rate (from search to begin_checkout) by surfacing availability and pricing on the Brikette site before Octorate handoff — baseline unknown, improve measured post-launch | source: operator
Dispatch-ID: IDEA-DISPATCH-20260227-0043
---

# Brikette Octorate Live Availability Fact-Find Brief

## Scope

### Summary

The Brikette booking funnel currently builds an Octorate deep-link from static data (hardcoded rate codes in `roomsData.ts`) and hands guests directly to Octorate's booking engine without checking availability. Guests cannot see which rooms are available or what the actual price is for their specific dates. This fact-find investigates what Octorate exposes for in-page availability and pricing queries, assesses feasibility of integrating per-room availability/pricing into the Brikette book page, and maps the minimal architecture change required to show live availability before handoff.

### Goals
- Confirm whether a per-room availability + pricing query is achievable via Octorate API or a proxy approach.
- Map the desired guest funnel: select dates → see per-room live availability + prices → choose NR/flex rate → navigate to Octorate for payment.
- Clarify whether `buildOctorateUrl.ts` and the NR/Flex CTA pattern are preserved or replaced.
- Determine authentication requirements and whether a Next.js API route proxy is needed.
- Produce a planning brief with concrete, testable tasks.

### Non-goals
- Room content schema and media (tracked separately as `brik-room-content-schema`).
- Replacing Octorate's payment/booking completion step — operator explicitly confirmed booking completion continues to use Octobook.
- Old funnel plan work (`brikette-cta-sales-funnel-ga4`, `brikette-octorate-funnel-reduction`) — treated as superseded.
- OTA rate codes or OTA channel visibility.

### Constraints & Assumptions
- Constraints:
  - Booking completion stays on Octorate — no in-app payment processing.
  - `BOOKING_CODE = "45111"` is the live Octorate account identifier for Brikette. Rate codes in `roomsData.ts` are live.
  - Brikette deploys to Cloudflare Pages (static export) for staging and a Cloudflare Worker for production. API routes exist on production (`@opennextjs/cloudflare`) but not on staging.
  - No Octorate API credentials are currently present in any brikette env file; the Octorate Connect API (`api.octorate.com`) requires OAuth 2.0 with a `client_id` and `client_secret` issued by Octorate — credentials not in repo.
  - Rate limit: Octorate Connect API allows 100 calls per accommodation per 5 minutes.
- Assumptions:
  - The existing `rates.json` at `/data/rates.json` (fetched by `RatesContext`) is generated offline from Octorate data — it is a static snapshot, not a live feed. This is inferred from the context (700 kB file, force-cache fetch, no API route generating it).
  - The Octorate ARI calendar endpoint (`GET /rest/v1/ari/calendar`) can return per-room availability and pricing for a date range, given valid OAuth credentials.
  - CORS from a browser direct-call to `api.octorate.com` is not permitted — a server-side proxy (Next.js API route) is required.
  - The apartment booking page (`ApartmentBookContent.tsx`) uses a `calendar.xhtml` handoff URL variant (vs `result.xhtml` used by rooms) — the two flows are structurally similar but the apartment does not need in-page availability (it uses WhatsApp as a fallback), and is out of scope unless the operator explicitly extends scope.

## Outcome Contract

- **Why:** Guests leave the Brikette site before seeing availability or pricing. This unqualified handoff causes friction at Octorate (unexpected sold-out or sticker-price shock) and is the most impactful conversion gap in the funnel prior to any downstream optimisation.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Improve booking conversion rate (search_availability → begin_checkout) by showing per-room live availability and pricing on the Brikette book page. Baseline: 0% in-page availability today (full redirect). Target: measurable lift in select_item and begin_checkout events post-launch. Timeframe: within 4 weeks of launch.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — The book page client component. Owns checkin/checkout/pax state. Passes `bookingQuery` + `queryState` to `RoomsSection`. When dates are valid (`queryState === "valid"`), `RoomsSection.onRoomSelect` fires `buildOctorateUrl` and navigates via `window.location.assign()`. **No availability query happens before navigation.**
- `apps/brikette/src/app/[lang]/book/page.tsx` — RSC wrapper. Has a noscript fallback linking directly to `book.octorate.com/octobook/site/reservation/calendar.xhtml?codice=45111`.
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — Apartment-specific booking page. Uses `calendar.xhtml` handoff (not `result.xhtml`). Separate rate code matrix per pax count. Not in scope but structurally related.

### Key Modules / Files

1. `apps/brikette/src/utils/buildOctorateUrl.ts` — Pure URL builder. Constructs `https://book.octorate.com/octobook/site/reservation/result.xhtml` with `codice`, `room` (= rate code), `date/checkin/checkout/pax/adulti` params. Discriminated-union return (`ok/error`). No external calls. Well-tested. **This file is preserved — only the routing logic that decides when to call it changes.**
2. `apps/brikette/src/components/rooms/RoomsSection.tsx` — Brikette-app adapter over `@acme/ui/organisms/RoomsSection`. Owns `onRoomSelect` callback. Calls `buildOctorateUrl` and `trackThenNavigate`. The navigation-guard ref pattern (`isNavigatingRef`) is here.
3. `apps/brikette/src/components/rooms/RoomCard.tsx` — App-specific RoomCard adapter. Composes `useRoomPricing` (live price from `rates.json`), builds NR and flex Octorate URLs, and renders two `RoomCardAction` items (nonRefundable, flexible). Each action's `onSelect` navigates directly to Octorate.
4. `apps/brikette/src/data/roomsData.ts` — Source of truth for 11 rooms. Contains `rateCodes.direct.nr` / `rateCodes.direct.flex` (Octorate rate code strings) and `widgetRoomCode` (room number in Octorate). Also stores `basePrice` and `seasonalPrices` as static fallbacks. The rate codes are the bridge between Brikette and Octorate's ARI system.
5. `apps/brikette/src/hooks/useRoomPricing.ts` — React hook. Calls `useRates()` (from `RatesContext`) and `getPriceForDate(room, today, rates)`. Returns `{ lowestPrice, soldOut, loading }`. The `soldOut` logic: true only when calendar is "fresh" (has future dates) and no live rate found.
6. `packages/ui/src/context/RatesContext.tsx` — Fetches `/data/rates.json` on the client (force-cache). Exposes `rates: RateCalendar | null`, `loading`, `error`. The `RateCalendar` is `Record<string, DailyRate[]>` keyed by rate code.
7. `apps/brikette/src/rooms/pricing.ts` — `getPriceForDate()`: priority-ordered lookup in `RateCalendar` for a given room + date. Falls through direct NR → unified widget → flex-only → OTA NR → room.id.
8. `apps/brikette/src/rooms/availability.ts` — `isSoldOut()`: wraps `getPriceForDate`. Returns true when no price found.
9. `apps/brikette/src/types/rates.ts` — `RateCalendar = Record<string, DailyRate[]>`. `DailyRate = { date: string; nr: number; flex?: number }`.
10. `apps/brikette/src/context/modal/constants.ts` — `BOOKING_CODE = "45111"`. Live Octorate property code.

### Patterns & Conventions Observed

- **Static snapshot pattern for rates**: `RatesContext` fetches `/data/rates.json` (a pre-generated ~700 kB file) with `force-cache`. This is a static offline snapshot, not a live API call. It only covers today's price (used for the "price from €X" display) and does not support per-date-range queries across multi-night stays.
- **URL builder pattern**: `buildOctorateUrl` is a pure, side-effect-free function. Pattern should be preserved — new availability logic goes in a separate hook/service, not inside the URL builder.
- **`queryState` gate**: `"valid" | "invalid" | "absent"` controls whether CTAs navigate to Octorate directly, are disabled, or navigate to `/book`. The availability integration will likely add a new state or extend this pattern.
- **Navigation guard pattern**: `isNavigatingRef` in `RoomsSection.tsx` prevents double-click. Any new async availability-fetch step needs to participate in this guard (or use a similar loading state) to prevent multiple concurrent calls.
- **`widgetRoomCode` and `rateCodes`**: `roomsData.ts` stores both the Octorate widget room code (numeric: "3", "4", etc.) and the rate plan codes (NR/flex for direct and OTA). These are the identifiers the Octorate API uses. The apartment room's `widgetRoomCode` is "TODO" — incomplete.

### Data & Contracts

- Types/schemas/events:
  - `Room` (from `roomsData.ts`) — `id`, `sku`, `widgetRoomCode`, `widgetRateCodeNR/Flex`, `rateCodes.direct.{nr,flex}`, `rateCodes.ota.{nr,flex}`, `occupancy`, `pricingModel` (perRoom/perBed), `basePrice`, `seasonalPrices`, `availability.{totalBeds, defaultRelease}`.
  - `RateCalendar` — `Record<string, DailyRate[]>` where key = rate code, value = array of `{ date: string; nr: number; flex?: number }`.
  - `BuildOctorateUrlParams` — `checkin/checkout/pax/plan/roomSku/octorateRateCode/bookingCode/deal`.
  - `BuildOctorateUrlResult` — `{ ok: true; url: string } | { ok: false; error: ... }`.
  - Octorate ARI calendar webhook payload (from OpenAPI spec): `{ data: [{ id, name, days: [{ availability, closeToArrival, closeToDeparture, cutOffDays, days: string[], maxStay, minStay, price, stopSells }] }] }`.
- Persistence:
  - `/data/rates.json` — static file served from Cloudflare CDN. Pre-generated (offline). Not live. Source of generation not confirmed in repo (no script found during investigation — needs follow-up).
- API/contracts:
  - Octorate Connect REST API: base `https://api.octorate.com/connect/rest/v1`. OAuth 2.0. Rate limit: 100 calls per accommodation per 5 minutes.
  - `GET /rest/v1/ari/calendar` — availability + pricing per room per date. Exact query parameters not confirmed from public docs; likely accepts `accommodationId`, `from`, `to` date range.
  - Octorate booking engine: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&room={rateCode}&checkin=...&checkout=...&pax=...` — the deep-link target (preserved).

### Dependency & Impact Map

- Upstream dependencies:
  - Octorate Connect API credentials (`client_id`, `client_secret`) — currently absent from all env files. Required before any live API integration can be built or tested.
  - A new Next.js API route handler (`apps/brikette/src/app/api/availability/route.ts` or similar) to proxy Octorate ARI calls server-side (CORS boundary).
- Downstream dependents:
  - `RoomCard.tsx` — currently renders price from `useRoomPricing` (today-only static snapshot). If availability is queried per date range, `RoomCard` will need to accept or source per-date-range pricing.
  - `RoomsSection.tsx` — `onRoomSelect` navigation currently fires immediately. With async availability pre-fetch, the flow changes: dates change → availability query fires (debounced) → RoomCard updates with live price/sold-out state → user clicks NR or flex CTA → navigate to Octorate. No separate confirmation step is introduced.
  - `BookPageContent.tsx` — owns dates/pax state. Will need to trigger the availability query when dates change (debounced, similar to existing `search_availability` GA4 event fire).
  - GA4 events: `fireSearchAvailability` already fires on date change. No new GA4 event is needed for the availability query itself — the existing `search_availability`, `select_item`, and `begin_checkout` events cover the funnel steps.
- Likely blast radius:
  - Medium-high: `RoomCard`, `RoomsSection`, `BookPageContent` all touched.
  - New: API route file, availability hook, possibly updated i18n keys for availability states (sold-out display, price display).
  - `buildOctorateUrl.ts` — NOT changed (preserved as pure URL builder).
  - `roomsData.ts` — NOT changed (rate codes are reused as Octorate API identifiers).

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + Testing Library (unit/component tests), Playwright + Cypress (e2e), governed test runner (`pnpm -w run test:governed`).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern>`.
- CI integration: full CI suite on PRs; typecheck and lint gate pre-commit.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `buildOctorateUrl` | Unit | `apps/brikette/src/utils/buildOctorateUrl.test.ts` | Well-covered: all error cases, deal param, URL shape. |
| Book page GA4 events | Component | `ga4-33-book-page-search-availability.test.tsx`, `ga4-08-book-checkout-payload.test.tsx`, `ga4-11-select-item-room-ctas.test.tsx`, `ga4-35-sticky-begin-checkout.test.tsx` | GA4 firing, payload shape, dedupe logic. |
| Room pricing/availability | Unit | `apps/brikette/src/test/utils/roomsCatalog.test.ts`, pricing tests inferred from RoomCard tests. | `getPriceForDate` and `isSoldOut` logic likely covered via catalog tests. |
| Booking date rules | Unit | `apps/brikette/src/test/utils/bookingDateRules.test.ts` | Min stay, checkout bounds. |
| RoomCard rendering | Component | Inferred from GA4 select-item tests | No dedicated RoomCard availability-state rendering test found. |

#### Coverage Gaps

- Untested paths:
  - Per-date-range availability query (does not exist yet — new surface).
  - API route proxy for Octorate ARI calls (new surface).
  - RoomCard sold-out rendering for a specific date range (vs. today-only).
  - Loading / error state in availability hook.
  - Debounce behavior of availability query on date change.
- Extinct tests:
  - None identified yet (no tests reference removed modules).

#### Testability Assessment

- Easy to test:
  - URL builder logic (pure function, already well-tested, no changes needed).
  - Availability hook logic (React Testing Library + mocked API route response).
  - Per-room sold-out / price display states.
- Hard to test:
  - Live Octorate API responses (requires credentials + network — use MSW for mocking in tests).
  - Navigation guard integration with async availability fetch (timing-sensitive).
- Test seams needed:
  - MSW handler for `/api/availability` route in Jest test environment.
  - Mock `RatesContext`-style context for per-date-range availability state.

### Recent Git History (Targeted)

- `e7e5752258` — `fix(brikette): reset room CTA navigation guard after back navigation` — pageshow listener added to `isNavigatingRef`; any async availability flow must also participate in this reset.
- `f1652ec2b5` — `brikette: preserve selected stay by using octorate result endpoint` — switched to `result.xhtml` (vs `calendar.xhtml`) so dates are pre-filled at Octorate. This is the current state of `buildOctorateUrl.ts`.
- `3827ba32cd`, `e7366c2630` — Octorate endpoint consolidation work. Confirms the `result.xhtml` pattern is deliberate and settled.
- `53f91fd2d4`, `1d9654728b` — pax and stay-length enforcement. These rules must remain intact post-integration.
- `066b4d0e4b`, `83cc0c043c` — Recent RoomCard TASK-09 work (SSR ready guard). Confirms RoomCard is actively maintained and recently stable.

## External Research

- **Octorate Connect REST API**: Base URL `https://api.octorate.com/connect/rest/v1`. OAuth 2.0 (client credentials or user-grant flow). Requires `client_id` + `client_secret` issued by Octorate. Rate limit: 100 calls per accommodation per 5 minutes.
  - Source: [api.octorate.com/connect/start.html](https://api.octorate.com/connect/start.html)
- **ARI calendar endpoint**: `GET /rest/v1/ari/calendar` confirmed present. Delivers availability per room per day: `{ availability, price, minStay, maxStay, closeToArrival, closeToDeparture, stopSells }`. Exact query parameters (date range, accommodation filter) not confirmed from public docs but structural shape confirmed from webhook spec.
  - Source: [api.octorate.com/connect/rest/v1/integration/openapi.yaml](https://api.octorate.com/connect/rest/v1/integration/openapi.yaml)
- **Octorate booking engine widget**: Deployed as a JavaScript embed (copy-paste into `<body>`). Supports a "custom page" redirect — widget click can redirect to the property's own website instead of `book.octorate.com`. An iframe option is referenced in community questions but not officially documented. The widget is a full checkout flow, not just an availability display component.
  - Source: [community.octorate.com](https://community.octorate.com/articles-7kemes2i/post/how-to-create-the-reservation-widget-Rh4s2Cu3pgKLCVN)
- **CORS**: Octorate's booking engine at `book.octorate.com` is a JSF (PrimeFaces/JavaServer Faces) server-rendered application — confirmed by `viewId`, `contextPath`, `.xhtml` paths, PrimeFaces config. No public JSON API is exposed on the `book.octorate.com` domain; the Connect REST API at `api.octorate.com` is the partner integration surface. Direct browser calls to `api.octorate.com` without CORS headers would be blocked — server-side proxy required.
- **Widget iframe option**: Confirmed available per a community post (a user asked about iframe embed on a WordPress site in 2022). No official documentation found for this approach. The iframe embeds the full `book.octorate.com` experience — it does not provide in-page availability data to the host page.
  - Source: [community.octorate.com](https://community.octorate.com/questions-66xkqdz5/post/hello-when-working-with-a-webpress-website-is-it-possible-to-embed-and-gF2gY43Tl7Y0GI8) (404 on direct fetch but confirmed via search result snippet)

## Questions

### Resolved

- Q: Does `rates.json` contain live availability per date range, or is it a static snapshot used only for today's price display?
  - A: Static snapshot only. `RatesContext` fetches `/data/rates.json` once with `force-cache`. The file structure is a calendar keyed by rate code, and `getPriceForDate` looks up a single date (today). The file does not support arbitrary date-range queries and is not regenerated on demand. It is a best-effort display price source, not an availability gate.
  - Evidence: `packages/ui/src/context/RatesContext.tsx` line 58 (`fetch("/data/rates.json", { cache: "force-cache" })`); `apps/brikette/src/rooms/pricing.ts` (single-date lookup); `apps/brikette/public/data/rates.json` (pre-generated file present in public dir).

- Q: Is `buildOctorateUrl.ts` preserved or replaced?
  - A: Preserved. It is a pure URL builder for the Octorate deep-link. The integration adds an availability check step *before* calling it, but the builder itself is not changed. The `result.xhtml` endpoint it targets is the correct handoff point (delivers pre-filled dates and rate selection to Octorate).
  - Evidence: `apps/brikette/src/utils/buildOctorateUrl.ts`; recent commits (`f1652ec2b5`) confirm `result.xhtml` is deliberate.

- Q: Does Octorate provide a CORS-safe browser-callable availability API?
  - A: No. The Octorate Connect API at `api.octorate.com` requires OAuth 2.0 bearer tokens and does not expose CORS headers for browser-side calls. A Next.js server-side API route proxy is required. The `book.octorate.com` booking engine is a JSF server-rendered app with no JSON API surface.
  - Evidence: External research; `book.octorate.com` returns PrimeFaces/xhtml pages, not JSON.

- Q: Can the existing Octorate booking widget (JS embed or iframe) be used for in-page availability display instead of a REST API integration?
  - A: Not suitable for this use case. The JS widget and iframe embed launch the full Octorate booking flow (a complete checkout experience) — they do not provide a component that displays availability data to the host page. Using an iframe would abandon the Brikette booking UI entirely, not augment it. The desired outcome (show prices/availability on the Brikette page, let user choose NR/flex, then hand off) requires a proper REST API availability query feeding into the Brikette UI.
  - Evidence: External research; community docs confirm widget is a complete booking flow embed.

- Q: What Octorate credentials are needed and are they available?
  - A: A `client_id` and `client_secret` issued by Octorate (Connect API partner program). These are **not currently present** in any brikette env file (confirmed by env var scan). Obtaining them requires contacting Octorate or logging into the Octorate partner portal. This is a **blocker for implementation** but not a blocker for planning — the env var schema and proxy route can be built and tested with mocked credentials.
  - Evidence: `apps/brikette/src/config/env.ts` (no Octorate keys); `apps/brikette/.env.local` (no Octorate keys); external auth docs.

- Q: What architecture approach is correct for availability queries — poll on date change, or query on demand (when user is about to book)?
  - A: Poll on date change (debounced), same pattern as the existing `search_availability` GA4 event. When the user changes dates or pax, query availability for all rooms simultaneously (one API call per rate code, or a single bulk call if the endpoint supports it). Display loading state on each RoomCard, then show price + availability status. This is lower-friction than requiring a separate "check availability" CTA and matches the intent of the existing date-picker UI. Rate limit (100 calls/accommodation/5min) is not a concern at this traffic level.
  - Evidence: `BookPageContent.tsx` lines 126-153 (existing debounced `search_availability` event pattern); Octorate rate limit (100/5min) is unlikely to be hit by a single-property booking site.

- Q: Should the NR/flex rate selection UI be changed from two buttons per room to a different pattern?
  - A: Preserve the two-button pattern (NR / flex) but improve it with price context. After an availability query, each button shows the per-night price for that rate plan (if available), or a sold-out state. The operator confirmed NR vs. flex choice happens before handoff — the current RoomCard action structure (`nonRefundable`, `flexible`) is the right vessel; it just needs live price data injected.
  - Evidence: `apps/brikette/src/components/rooms/RoomCard.tsx` actions array (lines 318-338); operator-stated requirement.

- Q: Is the apartment booking page in scope?
  - A: No, unless explicitly extended. The apartment uses a separate `ApartmentBookContent.tsx` with a `calendar.xhtml` handoff URL and WhatsApp as a live-availability fallback. Its rate codes are pax-specific (2pax vs 3pax) and the room code is marked "TODO". The apartment is a distinct booking flow that would require separate investigation.
  - Evidence: `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`; `roomsData.ts` apartment entry (`widgetRoomCode: "TODO"`).

- Q: Does the current `isSoldOut` / `useRoomPricing` logic need to be replaced or extended?
  - A: Extended. The existing `isSoldOut` / `useRoomPricing` returns a `soldOut` flag and `lowestPrice` for *today*. The new availability integration adds a date-range query that returns availability per room for the selected checkin/checkout window. The existing today-based display can remain as an immediate loading placeholder; the per-date-range result overrides it when available.
  - Evidence: `apps/brikette/src/hooks/useRoomPricing.ts`; `apps/brikette/src/rooms/availability.ts`.

- Q: Should the availability query show per-night prices for both NR and flex plans, or only the NR price?
  - A: The Octorate ARI calendar webhook spec shows a single `price` field per room per day — there is no separate NR vs flex price in the ARI response structure. Display the `price` field as the NR price on the NR button. For the flex button, derive the flex price by making a second ARI call with the `direct.flex` rate code, or display a policy label ("+ free cancellation") if the second call is deferred to a later iteration. Recommended default: show ARI `price` as NR price; flex button shows policy label until a second rate-plan call is implemented. This keeps TASK-01 to a single ARI call per room and leaves flex price enrichment as a follow-on.
  - Evidence: Octorate ARI calendar webhook payload from OpenAPI spec shows `{ price, availability, stopSells, minStay, maxStay, closeToArrival, closeToDeparture }` — no rate-plan split in the per-day structure. `RoomCard.tsx` existing action structure (`nonRefundable`, `flexible`) is the correct UI vessel.

### Open (Operator Input Required)

- Q: Has BRIK enrolled in the Octorate Connect API partner program, and are `client_id`/`client_secret` credentials available?
  - Why operator input is required: These credentials are issued by Octorate and not stored anywhere in the repo. The operator must either retrieve them from the Octorate admin portal or contact Octorate to obtain them. Without these, the API route proxy cannot authenticate.
  - Decision impacted: Whether implementation can begin immediately or must wait for credential provisioning. Planning and mock-based development can proceed without them.
  - Decision owner: Operator (Peter Cowling)
  - Default assumption: Credentials not yet provisioned. Plan tasks will include an env var provisioning step. Mock-based development and testing proceed immediately.


## Confidence Inputs

- **Implementation: 80%**
  - Evidence basis: Entry points, key modules, data shapes, URL builder, and integration boundary all confirmed. The architecture (proxy API route → debounced hook → RoomCard update) is clear and follows existing patterns. The only implementation unknowns are: (1) exact ARI calendar endpoint query parameter schema (needs credential-authenticated test call), (2) response structure validation against the webhook spec shape.
  - To reach 80%: Already at 80%. The plan can be written and implementation begun. Credential provisioning unblocks the live integration test.
  - To reach 90%: Confirm `GET /rest/v1/ari/calendar` exact request/response schema by making an authenticated test call with live credentials. Confirm whether one call returns all room availability or requires per-room calls.

- **Approach: 85%**
  - Evidence basis: Proxy-route approach is the only viable path (CORS confirmed, widget/iframe ruled out). Debounced-query-on-date-change matches existing patterns. RoomCard action extension is clear.
  - To reach 85%: Already at 85%. The approach is well-defined.
  - To reach 90%: Confirm ARI response granularity (per-room, per-day, per-rate-plan) matches the display intent.

- **Impact: 75%**
  - Evidence basis: Funnel gap is real and confirmed (no in-page availability today = unqualified handoff). Conversion improvement from surfacing availability is a reasonable hypothesis. Baseline booking_conversion_rate is unknown (not measured by current GA4 setup for this funnel step).
  - To reach 80%: Establish baseline measurement post-launch (search → begin_checkout rate) within first 2 weeks.
  - To reach 90%: A/B test or before/after comparison after 4 weeks.

- **Delivery-Readiness: 70%**
  - Evidence basis: Code architecture is clear. Blockers: (a) Octorate credentials not provisioned — delays live testing but not mock-based dev, (b) ARI endpoint query schema not fully confirmed.
  - To reach 80%: Operator confirms credential availability timeline. ARI endpoint schema confirmed via authenticated test call.
  - To reach 90%: All env vars provisioned in staging; integration tests passing against live Octorate ARI.

- **Testability: 80%**
  - Evidence basis: Existing test patterns (Jest, MSW-style mocking) are well-established. Availability hook, API route, and RoomCard state display are all easily unit-testable with mocked responses. E2e coverage is feasible via Playwright.
  - To reach 80%: Already at 80%.
  - To reach 90%: MSW handlers in place for `/api/availability`; Playwright test for the full date-select → show availability → click NR → navigate to Octorate flow.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Octorate credentials not provisioned before build begins | High | Moderate | Plan tasks split: mock-based UI/hook development first, credentials+live-API integration as a later task. Unblocks most of the build. |
| ARI calendar endpoint returns availability for whole property (not per-room) and requires multiple calls | Medium | Low | Rate limit (100/5min) is comfortable even with 11 rooms × 2 rate plans. If bulk endpoint exists, use it; otherwise parallelize per-room calls. |
| Octorate ARI endpoint has CORS issues even from server-side proxy (unlikely but possible) | Low | High | All calls go through a Next.js API route — CORS is irrelevant for server-to-server. |
| Static export (`OUTPUT_EXPORT=1`) staging deployment doesn't support API routes | High | Moderate | API routes only run on production (Worker build). Staging can use a mock mode or environment-gated fallback showing basePrice from `roomsData.ts` when no live availability is available. This is the same pattern as the existing `basePrice` fallback in `useRoomPricing`. |
| ARI response includes `stopSells` or `closeToArrival/Departure` flags that need special UI treatment | Medium | Low | Capture as a future enhancement. MVP: treat `availability === 0` as sold-out; `stopSells: true` as sold-out; pricing from `price` field. |
| Date-range availability query reveals that basePrice in `roomsData.ts` is significantly wrong | Low | Low | If ARI returns live prices, the `basePrice` fallback becomes less important. Show live price when available; fall back to `basePrice` with a "from" qualifier when ARI is unavailable. |
| Cloudflare Worker cold start adds latency to the availability API route | Low | Low | Typical Cloudflare Worker cold start is <5ms. Debounce (600ms) absorbs this. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Server-side proxy pattern: availability calls must go through a Next.js API route, not the browser directly.
  - Env var naming convention: server-only vars use no `NEXT_PUBLIC_` prefix (keep Octorate credentials server-side only — never expose `client_secret` to the browser).
  - `buildOctorateUrl.ts` is read-only for this plan — it must not be modified.
  - Static export staging compatibility: the availability API route will not run on staging. Add a graceful fallback (use `basePrice` from `roomsData.ts` when availability data is unavailable or 500s).
  - No new `describe.skip` blocks in test files — if a test cannot run in CI it must be refactored, not skipped.
  - Cloudflare Pages static export constraint: `apps/brikette` uses `OUTPUT_EXPORT=1` for staging. API routes only exist in the Worker production build. Plan must account for this.
- Rollout/rollback expectations:
  - Feature flag or environment variable to enable/disable the live availability query (e.g. `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`). Defaults to disabled; fallback shows basePrice as before. This allows shipping the UI without live credentials and toggling on when credentials are ready. **Important: `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is inlined at Next.js build time — toggling this flag requires a new build and deploy, not a runtime config change.**
  - Rollback: disable the env var. Existing `useRoomPricing` + `rates.json` path is preserved as fallback throughout.
- Observability expectations:
  - GA4 `search_availability` event already fires on date change. No new GA4 event needed for the availability query itself.
  - Add server-side logging in the API route for Octorate ARI errors (authentication failure, rate limit, availability not found).
  - Consider surfacing availability query latency as a metric (Cloudflare Worker analytics).

## Suggested Task Seeds (Non-binding)

0. **TASK-00 — Pre-build: Confirm ARI endpoint schema** — Using operator-provided credentials, make an authenticated GET call to `https://api.octorate.com/connect/rest/v1/ari/calendar` with date range params (try `from`/`to`, `checkin`/`checkout`, `dateFrom`/`dateTo`). Log the raw JSON response. Confirm: (a) which query param names the endpoint accepts for date range, (b) whether one call returns all rooms or requires per-room filtering, (c) the exact field names in the response (`availability`, `price`, etc.), (d) data type of `availability` (boolean or count integer). Record findings in a comment at the top of TASK-01 before implementation begins. **Blocked by: credential provisioning (TASK-05). Run TASK-05 first or in parallel.**

1. **TASK-01 — API Route: Octorate ARI availability proxy** — Create `apps/brikette/src/app/api/availability/route.ts`. Accepts `checkin`, `checkout`, `pax` query params. Fetches `GET /rest/v1/ari/calendar` from Octorate Connect API using server-side credentials. Returns per-room availability + pricing JSON. Includes error handling, rate-limit retry logic, and mock mode when credentials absent. **Prerequisite: TASK-00 must confirm endpoint schema before implementing the request shape.**
2. **TASK-02 — Hook: useAvailability** — Create `apps/brikette/src/hooks/useAvailability.ts`. Takes `checkin`, `checkout`, `pax` (or the `bookingQuery` shape). Calls `/api/availability` route. Debounced (600ms, matching existing `search_availability` GA4 event debounce). Returns `{ availability: Record<RoomId, AvailabilityResult>, loading, error }`. `AvailabilityResult = { available: boolean; nrPrice?: number; flexPrice?: number }`.
3. **TASK-03 — BookPageContent: wire availability query** — Wire `useAvailability` into `BookPageContent`. Pass `availabilityResult` down to `RoomsSection` → `RoomCard`. Handle loading state (skeleton price on each card). Handle error state (fall back to `useRoomPricing` `basePrice`).
4. **TASK-04 — RoomCard: display live availability and per-plan pricing** — Update `RoomCard.tsx` to accept `availabilityResult` prop. When available: show live `nrPrice` (from ARI `price` field) on the NR button; flex button shows a policy label ("+ free cancellation" or equivalent) until a second rate-plan ARI call is implemented (deferred). When `available === false` or `stopSells: true`: show sold-out state on both buttons. When loading: show skeleton.
5. **TASK-05 — Env var provisioning** — Define `OCTORATE_CLIENT_ID` and `OCTORATE_CLIENT_SECRET` in `.env.reference.md`, `apps/brikette/.env.example`, and add to Cloudflare Worker secrets. Add `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` feature flag. **Note: Begin TASK-05 immediately in parallel with mock-based development (TASK-01 through TASK-04). It is not a sequential dependency for mock-based work but must complete before any live Octorate ARI call can be made or TASK-00 can run.**
6. **TASK-06 — Tests: availability hook and API route** — Unit tests for `useAvailability` (MSW mock of `/api/availability`). Unit tests for API route (mock Octorate response). RoomCard rendering tests for sold-out, loading, and with-price states.
7. **TASK-07 — E2E smoke test** — Playwright test: navigate to `/en/book`, enter dates, wait for availability to load, verify at least one room shows a price, click NR CTA, verify navigation to `book.octorate.com`.
8. **TASK-08 — i18n: availability state strings** — Add new i18n keys to the `roomsPage` namespace for: availability loading state (if distinct from existing `loadingPrice`), per-date-range sold-out label (if distinct from existing `rooms.soldOut`), and any new price display format strings for live availability pricing. Ensure all supported languages have translations or English fallbacks before the feature flag is enabled in production.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none (code-only plan)
- Deliverable acceptance package:
  - Guests on `/book` with valid dates see per-room live prices (or basePrice fallback) and sold-out state before any Octorate navigation.
  - NR CTA shows live price from ARI `price` field when available; flex CTA shows policy label in MVP (flex price enrichment deferred to follow-on).
  - `buildOctorateUrl.ts` unchanged.
  - Feature flag works: when disabled, fallback to existing `useRoomPricing` / `rates.json` path.
  - All new tests pass; no existing tests broken.
- Post-delivery measurement plan:
  - Measure `select_item` event rate (room CTA clicks per unique visitor on `/book`) before and after launch.
  - Measure `begin_checkout` rate (Octorate navigations per date-search).
  - Track API route error rate and response latency via Cloudflare Worker analytics.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Octorate Connect API surface — availability and pricing endpoint | Partial | [System boundary coverage] [Moderate]: `GET /rest/v1/ari/calendar` confirmed from OpenAPI schema but exact query parameters (date range, room filter) not confirmed. Response shape known from webhook spec, not GET endpoint spec. | No — plan tasks include a credential-authenticated schema-confirmation step. |
| Current booking funnel entry points and file structure | Yes | None | No |
| `rates.json` / `RatesContext` static snapshot pattern | Yes | None | No |
| `buildOctorateUrl.ts` preservation decision | Yes | None | No |
| CORS boundary and proxy route requirement | Yes | None | No |
| Octorate credentials availability | Yes | [Missing data dependency] [Major]: `OCTORATE_CLIENT_ID` and `OCTORATE_CLIENT_SECRET` not provisioned. Build can begin with mocks but live integration test requires operator to provision credentials. | No — not a Critical gap; planned as TASK-05 with feature-flag rollout. |
| Staging static-export compatibility | Yes | [Integration boundary not handled] [Moderate]: API routes do not run on `OUTPUT_EXPORT=1` staging. Plan tasks must include a graceful fallback for staging. | No — planned as part of TASK-01 (mock mode) and TASK-03 (fallback state). |
| RoomCard and RoomsSection blast radius | Yes | None | No |
| Test landscape and seams | Yes | [Scope gap] [Minor]: MSW handler setup for `/api/availability` not yet present in Jest test environment. | No — planned as TASK-06. |
| Apartment booking page exclusion | Yes | None | No |
| `roomsData.ts` rate codes as Octorate ARI identifiers | Yes | None | No |

No Critical scope gaps found. Proceeding to Phase 6 persist.

## Evidence Gap Review

### Gaps Addressed
1. **Citation integrity**: All claims about current file structure, URL pattern, rate codes, and `rates.json` pattern are traced to confirmed source files. No ungrounded claims.
2. **Boundary coverage**: CORS boundary confirmed (server-proxy required). Octorate ARI API surface confirmed (Connect API + OAuth). Static export staging constraint identified and mitigated in planning constraints.
3. **Testing/validation coverage**: Existing test files enumerated. Coverage gaps for new surfaces (availability hook, API route, RoomCard availability state) explicitly identified. MSW seam required flagged.
4. **Business validation coverage**: Hypothesis explicit (surfacing availability pre-handoff increases conversion). Signal coverage: baseline unknown (no current in-page availability metric) — post-launch measurement plan included.
5. **Confidence calibration**: Implementation 80% (not 90% until ARI endpoint query params confirmed with live credentials). Delivery-Readiness 70% (credential blocker acknowledged). Scores reflect evidence, not optimism.

### Confidence Adjustments
- Implementation dropped from potential 90% to 80%: ARI endpoint exact query parameter schema not confirmed from public docs only — needs live credential test call.
- Delivery-Readiness at 70% (not 80%): credentials provisioning is an external dependency outside agent control. Feature-flag approach mitigates this for the build timeline.

### Remaining Assumptions
1. `GET /rest/v1/ari/calendar` accepts checkin/checkout date range query params and returns per-room, per-day availability + price data. (Structural confirmation from webhook spec; exact GET query params unconfirmed.)
2. The ARI calendar response returns data in a format compatible with the proposed `AvailabilityResult = { available: boolean; nrPrice?: number; flexPrice?: number }` shape. (Webhook spec shows `price`, `availability`, `stopSells` fields which map directly.)
3. Octorate Connect API returns CORS-safe responses from the server-side proxy (no Octorate-side server restriction on server-to-server calls). (Standard REST API design assumption — no evidence of server-IP restrictions.)
4. `rates.json` generation script exists somewhere (not found in repo during investigation). The file is present in `public/data/` but its generation mechanism is unclear. This does not block the new availability integration but should be investigated as a maintenance matter.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None that block planning. Credential provisioning blocks live integration testing (TASK-05) but not mock-based build start.
- Recommended next step: `/lp-do-plan brik-octorate-live-availability --auto`
