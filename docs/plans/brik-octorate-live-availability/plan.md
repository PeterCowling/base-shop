---
Type: Plan
Status: Active
Domain: SELL
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-octorate-live-availability
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Octorate Live Availability Plan

## Summary

Guests on the Brikette book page currently see no per-room availability or live pricing before being handed off to Octorate. This plan adds a server-side availability proxy (`/api/availability`) that calls the Octorate Connect ARI calendar endpoint with valid OAuth credentials, a `useAvailability` hook that debounces per-date-range queries, wiring through `BookPageContent` → `RoomsSection` → `RoomCard`, and updated RoomCard display states (live NR price, sold-out, loading). The existing `buildOctorateUrl.ts` and NR/flex two-button pattern are preserved. A feature flag (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`) gates the live path with a graceful fallback to the existing `rates.json`/`basePrice` path.

## Active tasks
- [ ] TASK-00: Pre-build ARI endpoint schema verification (INVESTIGATE)
- [ ] TASK-01: API route — Octorate ARI availability proxy
- [ ] TASK-02: `useAvailability` hook
- [ ] TASK-03: BookPageContent — wire availability data through to RoomsSection and RoomCard
- [ ] TASK-04: RoomCard — display live availability and per-plan pricing
- [x] TASK-05: Env var provisioning (parallel start)
- [ ] TASK-CP: Horizon checkpoint — reassess TASK-03/04/06/07/08 after proxy + schema confirmed
- [ ] TASK-06: Tests — availability hook and API route
- [ ] TASK-07: E2E smoke test
- [ ] TASK-08: i18n availability state strings

## Goals
- Show per-room live availability (available / sold-out) and NR price on the Brikette book page for the selected date range before Octorate handoff.
- Display NR price from ARI `price` field on the NR button; flex button shows policy label ("+ free cancellation") in MVP.
- Preserve the two-button NR/flex pattern and `buildOctorateUrl.ts`.
- Feature flag to ship UI changes without live credentials and toggle on when credentials are ready.
- Graceful fallback to `rates.json` / `basePrice` when availability data is unavailable.

## Non-goals
- Replacing Octorate's payment/booking completion step.
- Showing live flex pricing in this iteration (deferred to follow-on).
- Apartment booking page (`ApartmentBookContent.tsx`).
- OTA rate codes or OTA channel visibility.

## Constraints & Assumptions
- Constraints:
  - `buildOctorateUrl.ts` is read-only — not modified.
  - `roomsData.ts` is read-only — rate codes reused as ARI identifiers.
  - Server-only env vars: `OCTORATE_CLIENT_ID`, `OCTORATE_CLIENT_SECRET` (no `NEXT_PUBLIC_` prefix — never exposed to browser).
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is build-time inlined. Toggling requires a new build and deploy.
  - Staging deploys via `OUTPUT_EXPORT=1` (Cloudflare Pages static export) — API routes are not available on staging. Fallback must work without the route.
  - No `describe.skip` blocks in test files — if a test cannot run in CI, refactor, not skip.
- Assumptions:
  - `GET /rest/v1/ari/calendar` accepts a date range and returns per-room, per-day `{ availability, price, stopSells }`. Exact query parameter names not confirmed — TASK-00 must verify before TASK-01 finalizes request shape.
  - One authenticated ARI call returns availability for all rooms in the accommodation; or parallel per-room calls remain within rate limit (100/5min with 11 rooms is safe).
  - Octorate credentials will be provisioned by operator (TASK-05) before live integration testing. Mock-based development proceeds without them.

## Inherited Outcome Contract

- **Why:** Guests leave the Brikette site with no visibility of availability or pricing before handoff. This unqualified handoff causes friction at Octorate and is the most impactful conversion gap in the funnel prior to downstream optimisation.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Improve booking conversion rate (search_availability → begin_checkout) by showing per-room live availability and pricing on the Brikette book page. Baseline: 0% in-page availability today. Target: measurable lift in select_item and begin_checkout events post-launch. Timeframe: within 4 weeks of launch.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-octorate-live-availability/fact-find.md`
- Key findings used:
  - Octorate ARI endpoint confirmed: `GET /rest/v1/ari/calendar`, OAuth 2.0, 100 calls/accommodation/5min.
  - CORS boundary: browser cannot call `api.octorate.com` directly — server-side proxy required.
  - `buildOctorateUrl.ts` preserved as pure URL builder; `roomsData.ts` rate codes are live ARI identifiers.
  - `RatesContext` / `rates.json` is a static snapshot (today-only, force-cache) — not a live date-range feed.
  - Existing debounced `search_availability` GA4 event (600ms) is the pattern to follow for availability trigger.
  - Credentials not in repo — TASK-05 provisions them; TASK-00 verifies schema once available.
  - Staging (`OUTPUT_EXPORT=1`) does not run API routes — fallback path required.

## Proposed Approach

- Option A: Server-side proxy API route + debounced hook + per-RoomCard availability prop. Feature-flagged fallback to existing `useRoomPricing` / `rates.json` path.
- Option B: Octorate widget or iframe embed (rules out in-page availability display).
- Chosen approach: Option A. Option B was ruled out during fact-find — the widget/iframe launches a full checkout flow and cannot provide availability data to the host page. Option A follows existing patterns (debounced GA4 event, RatesContext-style context, existing RoomCard action structure) and is the only viable architecture for the desired in-page experience.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-05 | IMPLEMENT | Env var provisioning and docs update | 85% | S | Complete (2026-02-27) | - | TASK-00 |
| TASK-00 | INVESTIGATE | Pre-build ARI endpoint schema verification | 70% | S | Pending | TASK-05 | TASK-01 |
| TASK-01 | IMPLEMENT | API route: Octorate ARI availability proxy | 80% | M | Pending | TASK-00 | TASK-02, TASK-CP |
| TASK-02 | IMPLEMENT | `useAvailability` hook | 80% | M | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-CP | CHECKPOINT | Horizon checkpoint — reassess consumer tasks | 95% | S | Pending | TASK-01 | TASK-03, TASK-04, TASK-06, TASK-07, TASK-08 |
| TASK-03 | IMPLEMENT | BookPageContent wire-through | 80% | S | Pending | TASK-02, TASK-CP | TASK-07 |
| TASK-04 | IMPLEMENT | RoomCard: live availability + pricing display | 80% | M | Pending | TASK-02, TASK-CP | TASK-06, TASK-07, TASK-08 |
| TASK-06 | IMPLEMENT | Tests: availability hook and API route | 80% | M | Pending | TASK-01, TASK-02, TASK-04 | - |
| TASK-07 | IMPLEMENT | E2E smoke test | 75% | S | Pending | TASK-03, TASK-04 | - |
| TASK-08 | IMPLEMENT | i18n: availability state strings | 85% | S | Pending | TASK-04, TASK-CP | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-05 | - | Env var provisioning; no code deps. Begin immediately. |
| 2 | TASK-00 | TASK-05 | Requires credentials. INVESTIGATE — run authenticated ARI call, record schema. |
| 3 | TASK-01 | TASK-00 | API route proxy. Mock mode from Day 1; finalize request shape after TASK-00 confirms params. |
| 4 | TASK-02 | TASK-01 | Hook. Depends only on API route response shape being stable. |
| 4 | TASK-CP | TASK-01 | Checkpoint fires after TASK-01 to validate API contract before consumer tasks. |
| 5 | TASK-03, TASK-04 | TASK-02, TASK-CP | Can run in parallel: TASK-03 wires data flow; TASK-04 updates RoomCard display. |
| 5 | TASK-08 | TASK-04, TASK-CP | i18n strings depend on knowing which display states TASK-04 introduces. |
| 6 | TASK-06 | TASK-01, TASK-02, TASK-04 | Tests for all new surfaces. |
| 6 | TASK-07 | TASK-03, TASK-04 | E2E smoke test. Can parallel with TASK-06. |

## Tasks

---

### TASK-05: Env var provisioning and docs update
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/.env.reference.md`, new `apps/brikette/.env.example`, updated `apps/brikette/src/config/env.ts` with `OCTORATE_LIVE_AVAILABILITY` export.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/.env.reference.md`, `apps/brikette/src/config/env.ts`, `apps/brikette/.env.example` (new file)
- **Depends on:** -
- **Blocks:** TASK-00
- **Build evidence:**
  - Exit code: 0 (codex offload route, `--full-auto`)
  - Affects verified: `docs/.env.reference.md` has 3 new table rows (lines 70-72); `apps/brikette/src/config/env.ts` has `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` in `STATIC_PROCESS_ENV` (lines 19-20) and `OCTORATE_LIVE_AVAILABILITY` export (lines 118-119); `apps/brikette/.env.example` created with 3 commented vars.
  - TC-05-01/02: `OCTORATE_LIVE_AVAILABILITY = readEnv(...) === "1"` — false when unset, true when "1". Pass (verified by inspection).
  - TC-05-03/04: All 3 vars in `.env.reference.md`; `.env.example` exists. Pass.
  - Post-build validation: Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: env var export logic inspected — correct boolean coercion from string "1".
  - Server-only vars (CLIENT_ID/SECRET) NOT in STATIC_PROCESS_ENV — confirmed.
- **Confidence:** 85%
  - Implementation: 85% - Standard env var documentation; no code risk. Pattern confirmed from `env.ts`.
  - Approach: 90% - Existing `STATIC_PROCESS_ENV` pattern in `env.ts` makes adding `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` straightforward.
  - Impact: 85% - Prerequisite for TASK-00 and live integration. No direct user-facing impact but blocks entire credential chain.
  - Held-back test: Implementation at 85% (not 80-anchored) — only unknown is exact Cloudflare secret name convention (already established by `CARYINA_ADMIN_KEY` pattern).
- **Acceptance:**
  - `docs/.env.reference.md` has entries for `OCTORATE_CLIENT_ID`, `OCTORATE_CLIENT_SECRET`, `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`.
  - `apps/brikette/.env.example` created with all three vars commented out with descriptions.
  - `apps/brikette/src/config/env.ts` exports `OCTORATE_LIVE_AVAILABILITY: boolean` (reads `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`).
  - `.env.reference.md` notes that `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is build-time inlined and requires a rebuild to toggle.
- **Validation contract (TC-XX):**
  - TC-05-01: `env.ts` exports `OCTORATE_LIVE_AVAILABILITY` and returns `false` when env var is unset.
  - TC-05-02: `env.ts` exports `OCTORATE_LIVE_AVAILABILITY` and returns `true` when `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`.
  - TC-05-03: `docs/.env.reference.md` contains all three new vars with descriptions.
  - TC-05-04: `apps/brikette/.env.example` exists and contains the three vars commented out.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add entries to `.env.reference.md` and `.env.example`.
  - Green: Add `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` to `STATIC_PROCESS_ENV` in `env.ts`; export `OCTORATE_LIVE_AVAILABILITY = readEnv(["NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY"]) === "1"`.
  - Refactor: Verify docs formatting matches existing table style.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None — env var naming convention confirmed from `CARYINA_ADMIN_KEY` in `docs/.env.reference.md`.
- **Edge Cases & Hardening:** `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` must default to `false` when unset — do not default to `true`.
- **What would make this >=90%:** Already close. 90% requires operator confirmation that Cloudflare Worker secret names are correct (match what will be `wrangler secret put` commands).
- **Rollout / rollback:**
  - Rollout: Merge; operator provisions actual credentials separately.
  - Rollback: Remove entries from docs; revert `env.ts` change.
- **Documentation impact:** `docs/.env.reference.md` updated.
- **Notes / references:**
  - `apps/brikette/src/config/env.ts` — add to `STATIC_PROCESS_ENV` block (line 7-19) and add export at bottom.
  - Server-only vars (`OCTORATE_CLIENT_ID`, `OCTORATE_CLIENT_SECRET`) are not added to `STATIC_PROCESS_ENV` (they must not be accessible in the browser).

---

### TASK-00: Pre-build ARI endpoint schema verification
- **Type:** INVESTIGATE
- **Deliverable:** Schema notes written as a comment block at the top of `docs/plans/brik-octorate-live-availability/task-00-ari-schema.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] https://api.octorate.com/connect/rest/v1/ari/calendar`, `docs/plans/brik-octorate-live-availability/task-00-ari-schema.md` (new)
- **Depends on:** TASK-05
- **Blocks:** TASK-01
- **Confidence:** 70%
  - Implementation: 75% - Process is clear (make an authenticated GET call, log response). Unknown: whether credentials are available when this task runs.
  - Approach: 80% - curl/fetch approach with bearer token; straightforward.
  - Impact: 70% - If credentials not yet provisioned, task cannot complete; TASK-01 must proceed with mock mode only and defer final request shape.
- **Questions to answer:**
  - Q1: Which query parameter names does `GET /rest/v1/ari/calendar` accept for date range? (`from`/`to`, `checkin`/`checkout`, `dateFrom`/`dateTo`, or other)
  - Q2: Does one call return all rooms in the accommodation, or does it require a per-room filter param?
  - Q3: What are the exact field names in the response? (`availability`, `price`, `stopSells`, `minStay`, `maxStay`)
  - Q4: What is the data type of `availability`? (boolean or count integer)
  - Q5: What is the OAuth token endpoint URL and grant type used?
  - Q6: What does a sold-out response look like? (`availability: 0`, `stopSells: true`, or HTTP 404 for the room?)
- **Acceptance:**
  - Authenticated GET call made to `GET /rest/v1/ari/calendar`.
  - Raw JSON response logged and attached to `task-00-ari-schema.md`.
  - All 6 questions answered with evidence from the live response.
  - Answers propagated to TASK-01 execution plan (request shape finalized).
- **Validation contract:** `task-00-ari-schema.md` exists with all 6 questions answered and at least one redacted/sanitized JSON response excerpt attached (strip any live price values before committing — retain only field names and data types as evidence).
- **Planning validation:** None: non-implementation task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `task-00-ari-schema.md` created.
- **Notes / references:**
  - Octorate Connect API base: `https://api.octorate.com/connect/rest/v1`.
  - Auth: POST to OAuth token endpoint (URL in Octorate portal). `grant_type=client_credentials` with `OCTORATE_CLIENT_ID`/`OCTORATE_CLIENT_SECRET`.
  - ARI webhook spec confirmed fields: `{ id, name, days: [{ availability, closeToArrival, closeToDeparture, cutOffDays, days, maxStay, minStay, price, stopSells }] }`. Use these as the expected GET response shape until confirmed.

---

### TASK-01: API route — Octorate ARI availability proxy
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/app/api/availability/route.ts` (new file).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/api/availability/route.ts` (new)
- **Depends on:** TASK-00
- **Blocks:** TASK-02, TASK-CP
- **Confidence:** 80%
  - Implementation: 80% — Route handler pattern is well-established in Next.js App Router. Mock mode makes credential absence a non-blocker. ARI query param names are the residual unknown (TASK-00 closes this).
  - Approach: 85% — Server-side proxy is the only viable CORS-safe approach. OAuth client credentials flow is standard. Pattern matches existing Next.js routes.
  - Impact: 80% — Without this route, no availability data reaches the UI. Correct error handling and fallback are critical to avoid breaking the existing flow.
  - Held-back test for Implementation@80: Single unresolved unknown — ARI query param names. If TASK-00 reveals a non-standard param name scheme, the request construction must change. TASK-00 is a hard prerequisite. This unknown justifies not raising to 85.
- **Acceptance:**
  - `GET /api/availability?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=N` returns `{ rooms: Record<string, { available: boolean; nrPrice?: number; error?: string }> }` where keys are rate code strings matching `roomsData.ts`.
  - Returns HTTP 200 with `{ rooms: {} }` when `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is disabled or credentials absent (mock/fallback mode — callers degrade gracefully).
  - Returns HTTP 200 with per-room availability when Octorate ARI call succeeds.
  - On ARI calendar call errors (post-token, e.g. rate limit 429): returns HTTP 200 with `{ rooms: { [rateCode]: { available: false, error: "rate_limited" } } }` for all rooms — per-room degrade, logs server-side.
  - On auth/token errors (401 before any room data): returns HTTP 200 with `{ rooms: {} }` — total fallback, logs server-side. Never propagates 500 to the client.
  - Server-side logging of Octorate ARI errors (authentication failure, rate limit, network error).
  - Route is only reachable on production Worker build (not on static export staging — confirmed by not being in `pages/api`).
- **Validation contract (TC-XX):**
  - TC-01-01: Feature flag disabled → route returns `{ rooms: {} }` immediately without calling Octorate.
  - TC-01-02: Credentials absent (env vars unset) → route returns `{ rooms: {} }` in mock mode.
  - TC-01-03: Octorate ARI call succeeds → route returns correct per-room `{ available, nrPrice }` map.
  - TC-01-04: Octorate returns rate-limited error (429) at the ARI calendar call (after token obtained) → route returns `{ rooms: { [rateCode]: { available: false, error: "rate_limited" } } }` for all rooms (graceful per-room degrade, logs error server-side). Never returns HTTP 5xx to client.
  - TC-01-05: OAuth token request returns 401 (invalid credentials) — auth fails before any room data is resolved → route returns `{ rooms: {} }` (total fallback, no per-room data available; logs auth error server-side). This is distinct from TC-01-04: auth failure happens before rooms are enumerable.
  - TC-01-06: `checkin`/`checkout` params missing → route returns HTTP 400 with error message.
  - TC-01-07: Response shape matches `{ rooms: Record<string, { available: boolean; nrPrice?: number; error?: string }> }` TypeScript type.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write route stub returning `{ rooms: {} }` (TC-01-01, TC-01-02 pass immediately).
  - Green: Add OAuth token acquisition; implement `GET /rest/v1/ari/calendar` call with confirmed query params (from TASK-00); map response to `{ rooms: Record<string, { available, nrPrice }> }` using `rateCodes.direct.nr` as keys; add error handling (TC-01-03 through TC-01-06).
  - Refactor: Extract OAuth token acquisition into a module-level utility (reusable across potential future Octorate API routes); add server-side logging; ensure TypeScript strict mode compliance.
- **Planning validation (required for M/L):**
  - Checks run:
    - `apps/brikette/src/app/api/` directory does not exist yet — confirmed by `ls` (no api dir).
    - Next.js App Router route handlers in `app/api/` are supported by `@opennextjs/cloudflare` production build but not by `OUTPUT_EXPORT=1` staging — confirmed from MEMORY.md and fact-find.
    - `roomsData.ts` contains `rateCodes.direct.nr` for each room — confirmed from fact-find evidence.
    - `BOOKING_CODE = "45111"` in `context/modal/constants.ts` — accommodation ID for ARI calls.
  - Validation artifacts: Fact-find evidence section; `apps/brikette/src/config/env.ts` line scan.
  - Unexpected findings: No existing `/api` dir — clean slate, no conflicts.
- **Scouts:** Rate limit (100/5min) is safe for 11 rooms. If ARI endpoint requires per-room calls, 11 calls/request stays well within limit.
- **Edge Cases & Hardening:**
  - Token caching: OAuth bearer token should be cached in-memory (module-level) with expiry to avoid re-fetching on every request. Cloudflare Worker module scope persists across requests within a single isolate.
  - Date validation: Validate `checkin` < `checkout` before calling Octorate; return 400 for invalid range.
  - `stopSells: true` → treat as `available: false` in the response mapping.
  - `availability === 0` → `available: false`.
  - `minStay` / `maxStay` violations: for MVP, ignore these (they don't affect the available/price display, only Octorate's own booking gate).
- **What would make this >=90%:** Confirmed ARI query param schema from TASK-00 and a successful authenticated test call in staging/production.
- **Rollout / rollback:**
  - Rollout: Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` gates the live path. Ship route with flag disabled; enable when credentials verified.
  - Rollback: Set `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=0` (or remove), redeploy.
- **Documentation impact:** `docs/.env.reference.md` already updated by TASK-05. No additional docs needed.
- **Notes / references:**
  - Response type: `AvailabilityRouteResponse = { rooms: Record<string, RoomAvailability> }` where `RoomAvailability = { available: boolean; nrPrice?: number; error?: string }`. Export this type from the route file for consumption by TASK-02.
  - Octorate ARI webhook spec (confirmed): `{ data: [{ id, name, days: [{ availability, closeToArrival, closeToDeparture, cutOffDays, days, maxStay, minStay, price, stopSells }] }] }`.

---

### TASK-02: `useAvailability` hook
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/hooks/useAvailability.ts` (new file).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/hooks/useAvailability.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 80%
  - Implementation: 80% — Hook pattern mirrors existing `useRoomPricing` and debounced `search_availability` GA4 event (600ms). Response type is defined by TASK-01. No unknown ahead of TASK-01 completing.
  - Approach: 85% — Debounce on checkin/checkout/pax change; fetch `/api/availability`; return `Record<string, AvailabilityResult>` (keys = rate code strings, consistent with all prop contracts). Follows established pattern in `BookPageContent.tsx`.
  - Impact: 80% — Without this hook, no availability data reaches RoomCard. Correct loading/error states are critical to avoid breaking the UI in the no-credential case.
  - Held-back test for Implementation@80: If TASK-01's response shape changes materially after TASK-00, the hook's parsing logic needs update. This is a sequential dependency risk, not a fundamental unknown.
- **Acceptance:**
  - `useAvailability({ checkin, checkout, pax })` returns `{ availability: Record<string, AvailabilityResult>; loading: boolean; error: Error | null }`.
  - `AvailabilityResult = { available: boolean; nrPrice?: number }`.
  - Debounce: 600ms delay on checkin/checkout/pax change, matching the existing `search_availability` GA4 event debounce in `BookPageContent.tsx` (lines 126-138).
  - When `OCTORATE_LIVE_AVAILABILITY` is false (from `env.ts`): hook returns `{ availability: {}, loading: false, error: null }` immediately without fetching.
  - On fetch error: hook returns `{ availability: {}, loading: false, error }` — callers fall back to `useRoomPricing`.
  - Hook is safe to call unconditionally — no rules-of-hooks violations.
- **Validation contract (TC-XX):**
  - TC-02-01: Feature flag false → hook returns `{ availability: {}, loading: false, error: null }` without fetch call.
  - TC-02-02: Valid dates → hook fires fetch after 600ms debounce; returns `{ availability: { [rateCode]: { available, nrPrice } }, loading: false }` on success.
  - TC-02-03: Checkin changes → debounce resets; no stale fetch completes.
  - TC-02-04: Fetch returns error → hook returns `{ availability: {}, loading: false, error }`.
  - TC-02-05: `loading: true` while fetch in flight.
  - TC-02-06: Hook unmount during fetch → no setState-after-unmount warning.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Stub hook returning `{ availability: {}, loading: false, error: null }`. All TC-02-01 passes.
  - Green: Add `useEffect` with `AbortController` and `setTimeout` (600ms debounce); call `/api/availability`; parse response into `Record<string, AvailabilityResult>`; set state. TC-02-02 through TC-02-06.
  - Refactor: Extract debounce logic if reusable; add JSDoc; ensure TypeScript strict types.
- **Planning validation (required for M/L):**
  - Checks run:
    - Existing debounce pattern in `BookPageContent.tsx` lines 126-138: `window.setTimeout(..., 600)` with cleanup `clearTimeout`.
    - `useRoomPricing.ts` exists and exports `RoomPricing` type — confirms hook pattern.
    - No existing `useAvailability.ts` — confirmed by `ls hooks/use*.ts`.
  - Validation artifacts: `BookPageContent.tsx` debounce evidence; `useRoomPricing.ts` pattern.
  - Unexpected findings: None.
- **Consumer tracing:**
  - `useAvailability` return value `availability: Record<string, AvailabilityResult>` is consumed by `BookPageContent` (TASK-03), which passes it down to `RoomsSection` → `RoomCard`. The key type (`string` rate code) matches `roomsData.ts` `rateCodes.direct.nr` keys.
  - No existing consumer reads this hook — no backward compat risk.
- **Scouts:** `AbortController` is available in Cloudflare Workers runtime.
- **Edge Cases & Hardening:**
  - Race condition: If two fetches are in-flight (rapid date changes), only the latest response is applied. Use `AbortController` to cancel the prior fetch.
  - Empty result: If all rooms return `available: false`, RoomCard shows sold-out state without fallback to `useRoomPricing`. This is correct behavior (live data takes precedence over stale snapshot).
- **What would make this >=90%:** MSW handler in place for `/api/availability` and all TC-02-XX tests written and passing.
- **Rollout / rollback:**
  - Rollout: Deployed behind feature flag (same as TASK-01).
  - Rollback: Feature flag off; hook returns empty immediately.
- **Documentation impact:** None.
- **Notes / references:**
  - Export `AvailabilityResult` type from this file (consumed by `RoomCard` TASK-04 and tests).
  - Keys in `availability` map are `room.rateCodes.direct.nr` strings. TASK-03 must map these to rooms when passing to `RoomCard`.

---

### TASK-CP: Horizon checkpoint — reassess consumer tasks after API contract confirmed
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` for TASK-03, TASK-04, TASK-06, TASK-07, TASK-08.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-octorate-live-availability/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-06, TASK-07, TASK-08
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution if ARI shape differs from assumption
  - Impact: 95% — controls downstream risk from unconfirmed ARI response format
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on TASK-03, TASK-04, TASK-06, TASK-07, TASK-08.
  - Confidence for consumer tasks recalibrated from TASK-00 + TASK-01 findings.
  - Plan updated and re-sequenced if needed.
- **Horizon assumptions to validate:**
  - ARI response `price` field maps to `nrPrice` in `AvailabilityResult` (number, per night).
  - `availability` field (or `stopSells: true`) maps correctly to the `available: boolean` shape in `AvailabilityResult`.
  - `Record<string, AvailabilityResult>` keyed by `rateCodes.direct.nr` is the correct data shape to pass to `RoomCard`.
  - i18n keys needed by TASK-04 are confirmed (new states vs. reuse of `rooms.soldOut` / `loadingPrice`).
- **Validation contract:** Replan run; `plan.md` updated with calibrated confidence on consumer tasks.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `plan.md` updated.

---

### TASK-03: BookPageContent — wire availability data through to RoomsSection and RoomCard
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/components/rooms/RoomsSection.tsx`
- **Depends on:** TASK-02, TASK-CP
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — `BookPageContent.tsx` is 250 lines; integration point is the `<RoomsSection>` call at line 225-236. Adding `availabilityData` prop is a localized change.
  - Approach: 85% — `useAvailability` called in `BookPageContent`; result passed as prop to `RoomsSection` → forwarded to each `RoomCard`. Follows existing `bookingQuery`/`queryState` prop-threading pattern.
  - Impact: 80% — If prop threading is incorrect, `RoomCard` won't receive data. Must be backward-compatible (optional prop, no breaking change to `RoomsSection` consumers outside this flow).
- **Acceptance:**
  - `BookPageContent` calls `useAvailability({ checkin, checkout, pax: String(pax) })` unconditionally (per hooks invariants); the hook returns empty `{ availability: {} }` internally when dates are invalid or feature flag is off — no conditional hook call.
  - `RoomsSection` accepts new optional `availabilityData?: Record<string, AvailabilityResult>` prop and threads it through to each `RoomCard`.
  - `RoomCard` receives `availabilityResult?: AvailabilityResult` keyed by its `room.rateCodes.direct.nr`.
  - All existing `queryState` / `bookingQuery` prop behavior unchanged.
  - No TypeScript errors.
- **Validation contract (TC-XX):**
  - TC-03-01: `useAvailability` called unconditionally; with valid dates and flag enabled, returns per-room availability data.
  - TC-03-02: `availabilityData` prop threaded from `BookPageContent` → `RoomsSection` → each `RoomCard`.
  - TC-03-03: With invalid dates, `useAvailability` returns `{ availability: {}, loading: false }` internally (no fetch fires); `availabilityData` passed as empty map, RoomCard shows existing `useRoomPricing` fallback.
  - TC-03-04: Existing snapshot/render tests for `BookPageContent` still pass (availability prop is optional with empty default).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add `availabilityData` prop slot to `RoomsSection` and `RoomCard` interfaces (typed but unused). Tests pass.
  - Green: Call `useAvailability` in `BookPageContent`; thread result through `RoomsSection` to `RoomCard`.
  - Refactor: Ensure prop name consistency; add prop-types doc comments.
- **Planning validation (required for M/L):** None: S effort task.
- **Consumer tracing:**
  - New prop `availabilityData` on `RoomsSection` — only consumer is `BookPageContent`. No other callers of `RoomsSection` in the codebase pass this prop — it must be optional to avoid breaking other render sites.
  - Check: `RoomsSection` is used in `BookPageContent` and potentially on landing/home pages (rooms preview). The `availabilityData` prop must default to `undefined` so those render sites are unaffected.
- **Scouts:** Grep for all `<RoomsSection` usages before implementing to confirm no other call sites pass `availabilityData`. If other sites exist, `availabilityData` must remain optional.
- **Edge Cases & Hardening:** `availabilityData` being `undefined` or `{}` must fall back gracefully to existing `useRoomPricing` behavior in `RoomCard`.
- **What would make this >=90%:** TASK-CP confirms the data shape; existing RoomsSection tests continue to pass.
- **Rollout / rollback:**
  - Rollout: Prop is additive; no breaking change. Deployed behind feature flag.
  - Rollback: Remove `useAvailability` call from `BookPageContent`; remove prop from `RoomsSection`.
- **Documentation impact:** None.
- **Notes / references:**
  - `BookPageContent.tsx` line 225-236: existing `<RoomsSection>` call is the integration point.
  - `RoomsSection.tsx` props type (`RoomsSectionProps`) must gain `availabilityData?: Record<string, AvailabilityResult>`.

---

### TASK-04: RoomCard — display live availability and per-plan pricing
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/components/rooms/RoomCard.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/rooms/RoomCard.tsx`
- **Depends on:** TASK-02, TASK-CP
- **Blocks:** TASK-06, TASK-07, TASK-08
- **Confidence:** 80%
  - Implementation: 80% — `RoomCard.tsx` is an adapter; the `actions` array (lines 318-338) is the target. Adding live price and sold-out state is localized to `useRoomPricing` overrides and action label construction.
  - Approach: 80% — When `availabilityResult` is provided: override `soldOut` and `lowestPrice` with live values; show NR price on NR button; flex button shows policy label. Fallback to existing `useRoomPricing` path when `availabilityResult` is absent. This additive pattern preserves backward compat.
  - Impact: 80% — RoomCard is the user-visible output. Incorrect rendering (wrong price, wrong soldOut state) directly degrades the booking experience. The existing GA4 `select_item` tracking on CTA clicks must not break.
  - Held-back test for Implementation@80: `resolveTranslatedCopy` and `buildLabel` helper functions are complex — if the new price label for NR button conflicts with existing i18n key resolution logic, the label may not display correctly. This warrants careful integration but is not a fundamental unknown.
- **Acceptance:**
  - When `availabilityResult` provided and `available: true`: NR button label includes live `nrPrice` (e.g. "Check rates – from €X"); NR button enabled.
  - When `availabilityResult` provided and `available: false`: both NR and flex buttons show sold-out state (disabled, label from `rooms.soldOut` i18n key).
  - When `availabilityResult.nrPrice` is undefined (loading or unavailable): NR button shows existing `loadingPrice` label or `ratesFrom` label from `useRoomPricing` fallback.
  - When `availabilityResult` is undefined (no availability data): existing `useRoomPricing` behavior unchanged — NR button shows `basePrice` or `ratesFrom`; sold-out from static `rates.json`.
  - Flex button in MVP: shows policy label ("+ free cancellation" or `checkRatesFlexible` i18n key) regardless of `availabilityResult`. Flex price enrichment deferred.
  - `queryState === "valid"` guard continues to gate CTA navigation.
  - Existing GA4 `select_item` tracking on NR/flex button click fires as before.
  - No new `describe.skip` blocks introduced.
- **Validation contract (TC-XX):**
  - TC-04-01: `availabilityResult = { available: true, nrPrice: 45 }` → NR button enabled, label contains "45".
  - TC-04-02: `availabilityResult = { available: false }` → both buttons disabled, sold-out label shown.
  - TC-04-03: `availabilityResult = undefined` → existing `useRoomPricing` behavior (no regression).
  - TC-04-04: `availabilityResult = { available: true }` with no `nrPrice` → NR button shows loading/fallback label, not "undefined".
  - TC-04-05: GA4 `select_item` fires on NR button click when the button is enabled (available room, valid dates). When the NR button is disabled (sold-out or invalid dates), no click event fires — this is correct behavior.
  - TC-04-06: `queryState === "invalid"` → NR/flex buttons disabled regardless of `availabilityResult`.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add optional `availabilityResult?: AvailabilityResult` prop to `RoomCard`. No behavior change yet. Existing tests pass.
  - Green: Override `soldOut` from `useRoomPricing` with `availabilityResult.available === false` when present. Override `lowestPrice` with `availabilityResult.nrPrice` when present. Update NR button label to show price. Add sold-out display state. TC-04-01 through TC-04-06 pass.
  - Refactor: Clean up label construction; ensure all display states are covered in i18n (TASK-08 follow-up).
- **Planning validation (required for M/L):**
  - Checks run:
    - `RoomCard.tsx` actions array at lines 318-338: confirmed two actions (`nonRefundable`, `flexible`).
    - `useRoomPricing` returns `{ lowestPrice, soldOut, loading }` — these are the values to override.
    - `price` object at lines 172-179 constructs the display price from `lowestPrice`. Override pattern must modify `lowestPrice` source.
    - Existing GA4 `select_item` firing is in `openNonRefundable`/`openFlexible` callbacks — not in the `actions` array — so CTA tracking is not disrupted by label changes.
  - Validation artifacts: `RoomCard.tsx` lines 170-180, 318-338.
  - Unexpected findings: `resolveTranslatedCopy` + `buildLabel` complexity — plan uses additive override of `lowestPrice`/`soldOut` rather than restructuring the label pipeline to minimize risk.
- **Consumer tracing:**
  - `availabilityResult` prop on `RoomCard` — new optional prop. No existing consumer passes it. Backward compat confirmed.
  - Modified behavior: `soldOut` derivation now prefers `availabilityResult.available === false` over `useRoomPricing.soldOut`. Every call site of `RoomCard` that does not pass `availabilityResult` is unaffected.
  - Modified behavior: `lowestPrice` in price label now uses `availabilityResult.nrPrice` when present. Existing `ratesFrom` and `basePrice` fallback remain unchanged for no-availability path.
- **Scouts:** Check for any direct consumers of `RoomCard` that render it outside of `RoomsSection` and might be affected by prop additions.
- **Edge Cases & Hardening:**
  - Loading state: While `useAvailability` is fetching (loading=true), `availabilityResult` is undefined → RoomCard shows existing `useRoomPricing` loading state. No flash of incorrect sold-out state.
  - Sold-out override: `availabilityResult.available === false` must be interpreted as sold-out for all rate plans of this room (NR and flex both disabled). Do not allow booking a sold-out room via the flex CTA.
- **What would make this >=90%:** TASK-CP confirms price field mapping; all TC-04-XX tests written and passing.
- **Rollout / rollback:**
  - Rollout: Prop is additive. Feature flag controls whether `availabilityResult` is ever non-null.
  - Rollback: Feature flag off; `availabilityResult` is always undefined; existing behavior.
- **Documentation impact:** None (i18n strings added in TASK-08).
- **Notes / references:**
  - `RoomCard.tsx` line 170: `const { lowestPrice, soldOut, loading: priceLoading } = useRoomPricing(room)` — this is the point to overlay live values.
  - `openNonRefundable`/`openFlexible` callbacks fire GA4 `select_item` and navigate — do not alter these callbacks in this task.

---

### TASK-06: Tests — availability hook and API route
- **Type:** IMPLEMENT
- **Deliverable:** Test files:
  - `apps/brikette/src/hooks/useAvailability.test.ts` (new)
  - `apps/brikette/src/app/api/availability/route.test.ts` (new)
  - Updated `apps/brikette/src/components/rooms/RoomCard.test.tsx` or a new `RoomCard.availability.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/hooks/useAvailability.test.ts` (new), `apps/brikette/src/app/api/availability/route.test.ts` (new), `apps/brikette/src/components/rooms/RoomCard.availability.test.tsx` (new)
- **Depends on:** TASK-01, TASK-02, TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — Test framework (Jest + Testing Library) is established. MSW handler pattern for API routes is a seam that exists in the codebase. Route.test.ts using `node-fetch`/direct handler invocation is standard.
  - Approach: 80% — Unit tests for hook (mock `/api/availability`); unit tests for route handler (mock Octorate response); component tests for RoomCard display states.
  - Impact: 80% — Without tests, regressions in the availability flow won't be caught in CI. The RoomCard backward-compat test (TC-04-03) is particularly important.
- **Acceptance:**
  - `useAvailability` tests: all TC-02-XX scenarios covered.
  - API route tests: TC-01-01, TC-01-02, TC-01-03, TC-01-04, TC-01-05 covered.
  - `RoomCard` availability tests: TC-04-01 through TC-04-06 covered.
  - All tests run under `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`.
  - Zero `describe.skip` blocks introduced.
- **Validation contract (TC-XX):**
  - TC-06-01: All named TC codes above pass in CI.
  - TC-06-02: No existing `RoomCard` tests regress.
  - TC-06-03: Test runner completes without requiring live Octorate credentials (mocked via MSW or direct handler mock).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write test files with `test.todo()` stubs for each named TC. Confirm they appear in test output without failing.
  - Green: Implement each test. Add MSW handler for `/api/availability`. Mock Octorate ARI responses in route handler tests.
  - Refactor: Remove any stubs; ensure coverage of all edge cases.
- **Planning validation (required for M/L):**
  - Checks run:
    - `apps/brikette/jest.config.cjs` exists — confirmed.
    - Test command: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` — confirmed from fact-find.
    - `jest.setup.ts` configures `configure({ testIdAttribute: "data-cy" })` — confirmed from MEMORY.md.
    - Existing RoomCard tests exist (inferred from GA4 select-item tests in fact-find) — must not regress.
  - Validation artifacts: Fact-find test landscape section; MEMORY.md jest patterns.
  - Unexpected findings: `IS_TEST` guard in `RoomCard.tsx` (line 59) — test environment has `act` shim. Tests must use `globalThis.__testAct` pattern or standard Testing Library patterns.
- **Scouts:** Confirm MSW version in `apps/brikette/package.json` before writing handlers (MSW v1 vs v2 have different handler syntax).
- **Edge Cases & Hardening:** Test for unmounted hook (cleanup); test for rapid date change (debounce reset).
- **What would make this >=90%:** MSW handler in place and working; Playwright E2E passing (TASK-07).
- **Rollout / rollback:**
  - Rollout: Tests are additive; no production impact.
  - Rollback: None needed.
- **Documentation impact:** None.
- **Notes / references:**
  - MEMORY.md jest patterns: `testIdAttribute: "data-cy"`; relative mock imports for hooks; `pnpm -w run test:governed` runner.

---

### TASK-07: E2E smoke test
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/e2e/availability-smoke.spec.ts` (new Playwright test).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/e2e/availability-smoke.spec.ts` (new)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% — Playwright test pattern exists in the codebase. The test depends on the production Worker build (API routes not available on static export) — local dev with Worker build required.
  - Approach: 75% — Navigate to `/en/book`, enter valid dates, wait for availability, verify price display, click NR CTA, verify navigation to `book.octorate.com`. This is straightforward but depends on live Octorate credentials being available in the test environment.
  - Impact: 80% — Validates the full happy-path funnel before launch.
  - Note: Confidence held at 75% because the test requires live credentials or a mock server in the Playwright environment; this is environment-dependent.
- **Acceptance:**
  - Playwright test navigates to `/en/book`.
  - Enters valid checkin/checkout dates.
  - Waits for at least one room to display a price (not loading state).
  - Clicks NR CTA on the first available room.
  - Verifies that a navigation to `book.octorate.com/octobook/site/reservation/result.xhtml` was attempted (via `page.route()` interception — not actual external navigation, which is blocked in CI).
- **Validation contract (TC-XX):**
  - TC-07-01: Navigation to `/en/book` succeeds (200, no JS error).
  - TC-07-02: After entering dates, at least one RoomCard shows a price value.
  - TC-07-03: Clicking NR CTA triggers a navigation request to `book.octorate.com/octobook/site/reservation/result.xhtml` (intercepted via `page.route()` in CI — does not require actual external navigation).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Create test file with `test.todo()` stubs for each TC (TC-07-01 through TC-07-03) and a comment explaining the credential / Worker-build requirement. No `describe.skip` blocks.
  - Green: Implement full test when credentials available.
  - Refactor: Add network interception for Octorate navigation (prevent actual redirect in CI).
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Check Playwright config in `apps/brikette/` for existing base URL and credential handling patterns.
- **Edge Cases & Hardening:** In CI, use Playwright's `page.route()` to intercept and block `book.octorate.com` navigation (prevents 403 in CI).
- **What would make this >=90%:** Test runs successfully in CI with mocked Octorate credentials.
- **Rollout / rollback:**
  - Rollout: Test is additive.
  - Rollback: None.
- **Documentation impact:** None.
- **Notes / references:**
  - Playwright is in the existing test stack (fact-find confirmed). Confirm config at `apps/brikette/playwright.config.ts` before writing.

---

### TASK-08: i18n — availability state strings
- **Type:** IMPLEMENT
- **Deliverable:** Updated i18n translation files for all supported locales under `apps/brikette/src/i18n/` or equivalent namespace files (`roomsPage` namespace).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/*/roomsPage.json`
- **Depends on:** TASK-04, TASK-CP
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — i18n key addition follows established pattern. TASK-04 defines which display states need new strings.
  - Approach: 85% — Add new keys to `roomsPage` namespace; provide English baseline; ensure all supported locales have fallbacks.
  - Impact: 85% — Missing i18n strings cause fallback to key name in production; not catastrophic but visible to guests.
- **Acceptance:**
  - New keys added to `roomsPage` namespace under `apps/brikette/src/locales/*/roomsPage.json` for: availability loading state (if distinct from existing `loadingPrice`); per-date-range price format (e.g. `availabilityPrice`); sold-out state for date-range query (if distinct from existing `rooms.soldOut`).
  - All supported locales have the new keys (or English fallback strings).
  - Strict i18n audit passes: `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`.
- **Validation contract (TC-XX):**
  - TC-08-01: New keys present in EN locale.
  - TC-08-02: All non-EN supported locales have entries (fallback to EN acceptable if translation is not yet available).
  - TC-08-03: Strict i18n audit passes (`CONTENT_READINESS_MODE=fail`).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Identify which new keys TASK-04 introduces by reviewing TASK-04 implementation.
  - Green: Add keys to all locale files.
  - Refactor: Run i18n audit to confirm completeness.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Locale file path confirmed: `apps/brikette/src/locales/*/roomsPage.json`. No scout needed.
- **Edge Cases & Hardening:** Existing `rooms.soldOut` and `loadingPrice` keys may already cover the new states — check before adding duplicate keys. If reusable, reference existing keys from TASK-04 rather than adding new ones.
- **What would make this >=90%:** All TC-08-XX pass in CI; translation by a native speaker for each supported locale.
- **Rollout / rollback:**
  - Rollout: i18n changes are additive; no production impact while feature flag is disabled.
  - Rollback: None needed (additive keys don't break existing behavior).
- **Documentation impact:** None.
- **Notes / references:**
  - Translation workflow (from MEMORY.md): structure-first, translate-second. For MVP, English-only with fallback is acceptable.
  - Strict audit: `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Octorate credentials not provisioned when build begins | High | Moderate | TASK-01 builds mock mode from Day 1. Feature flag gates live path. TASK-05 tracks credential provisioning separately. |
| ARI endpoint query params differ from assumption (TASK-00 finding) | Medium | Moderate | TASK-00 is a hard prerequisite for TASK-01 final request shape. TASK-CP reassesses consumer tasks after TASK-01 confirms shape. |
| `resolveTranslatedCopy` / `buildLabel` in RoomCard conflicts with live price label injection | Low | Moderate | TASK-04 uses additive override of `lowestPrice`/`soldOut` source rather than restructuring label pipeline. If conflict arises, i18n key approach is the fallback. |
| Staging environment can't test API routes (static export) | High | Low | Staging shows fallback (`basePrice`). Feature flag off = existing behavior. Production Worker is the test environment for live integration. |
| MSW version mismatch in Jest environment | Low | Moderate | TASK-06 scouts MSW version before writing handlers. |
| ARI response has per-night breakdown that doesn't map cleanly to a single price | Low | Moderate | ARI spec shows single `price` per day — use this as NR nightly price. If multi-night stay, use first night's price or average (TASK-00 confirms actual behavior). |

## Observability
- Logging: Server-side error logging in `/api/availability` route for Octorate authentication failures, rate limit responses, and network errors.
- Metrics: Cloudflare Worker request analytics for `/api/availability` — latency and error rate.
- Alerts/Dashboards: None in MVP. Post-launch: alert on sustained 5xx rate from Octorate calls.

## Acceptance Criteria (overall)
- [ ] Guests on `/en/book` (and all lang variants) with valid dates see per-room live prices or `basePrice` fallback.
- [ ] NR button shows ARI `price` as nightly price when availability data is available.
- [ ] Sold-out rooms show sold-out state on both NR and flex buttons.
- [ ] `buildOctorateUrl.ts` is unchanged.
- [ ] Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=0` restores exact pre-launch behavior.
- [ ] All new tests pass; no existing tests regress.
- [ ] Strict i18n audit passes.
- [ ] No `describe.skip` blocks introduced.

## Decision Log
- 2026-02-27: Option A (server-side proxy) chosen over widget/iframe embed. Widget launches full checkout flow, cannot provide in-page availability data. (Fact-find confirmed.)
- 2026-02-27: Flex price enrichment deferred to follow-on. ARI spec has single `price` field — flex button shows policy label in MVP.
- 2026-02-27: Debounce at 600ms (matching existing `search_availability` GA4 event pattern). No new GA4 event for availability query itself.
- 2026-02-27: `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is build-time inlined — toggling requires rebuild. Documented in constraints and TASK-05.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-05: Env var provisioning | Yes | None — env.ts pattern confirmed; `.env.reference.md` update is straightforward | No |
| TASK-00: ARI endpoint schema verification | Partial | [Missing data dependency] [Major]: Requires live credentials provisioned by TASK-05. Cannot execute without operator action. | No — planned: TASK-05 first; TASK-00 blocked until credentials available. |
| TASK-01: API route proxy | Partial | [Integration boundary not handled] [Moderate]: ARI query param names unconfirmed until TASK-00 runs. Mock mode unblocks UI development. Final request shape deferred. | No — TASK-00 is explicit prerequisite. TASK-CP reassesses. |
| TASK-02: `useAvailability` hook | Yes | None — hook pattern confirmed from `useRoomPricing`; debounce from `BookPageContent`; AbortController available in Workers. | No |
| TASK-CP: Horizon checkpoint | Yes | None — procedural task, no implementation risk. | No |
| TASK-03: BookPageContent wire-through | Yes | [Type contract gap] [Minor]: `availabilityData` keyed by rate code string; `RoomCard` must map to per-room by `rateCodes.direct.nr`. Mapping must be explicit in TASK-03 execution plan. | No — noted in TASK-03 acceptance criteria. |
| TASK-04: RoomCard display | Partial | [Integration boundary not handled] [Moderate]: `resolveTranslatedCopy`/`buildLabel` complexity may conflict with price label injection. Additive `lowestPrice` override approach mitigates this but must be verified during implementation. | No — TASK-04 uses override pattern; TASK-CP revalidates. |
| TASK-06: Tests | Yes | [Missing data dependency] [Minor]: MSW version not confirmed. TASK-06 scouts before writing. | No |
| TASK-07: E2E smoke test | Partial | [Missing data dependency] [Moderate]: Live Octorate credentials required for real availability response in E2E. Mocked response via `page.route()` is the CI path. | No — planned in TASK-07 acceptance criteria. |
| TASK-08: i18n strings | Yes | None — locale file path confirmed: `apps/brikette/src/locales/*/roomsPage.json`. | No |

No Critical simulation findings. Proceeding to Active status.

## Overall-confidence Calculation

Weights: S=1, M=2, L=3.

| Task | Type | Confidence | Effort | Weight |
|---|---|---|---|---|
| TASK-05 | IMPLEMENT | 85% | S | 1 |
| TASK-00 | INVESTIGATE | 70% | S | 1 |
| TASK-01 | IMPLEMENT | 80% | M | 2 |
| TASK-02 | IMPLEMENT | 80% | M | 2 |
| TASK-CP | CHECKPOINT | 95% | S | 1 |
| TASK-03 | IMPLEMENT | 80% | S | 1 |
| TASK-04 | IMPLEMENT | 80% | M | 2 |
| TASK-06 | IMPLEMENT | 80% | M | 2 |
| TASK-07 | IMPLEMENT | 75% | S | 1 |
| TASK-08 | IMPLEMENT | 85% | S | 1 |

Weighted sum: (85×1 + 70×1 + 80×2 + 80×2 + 95×1 + 80×1 + 80×2 + 80×2 + 75×1 + 85×1) = 85 + 70 + 160 + 160 + 95 + 80 + 160 + 160 + 75 + 85 = 1130
Total weight: 1+1+2+2+1+1+2+2+1+1 = 14
Raw weighted average = 1130/14 = 80.7%
Per scoring rules (multiples of 5, downward bias rule): **80%**.
Frontmatter set to 80%. TASK-00 at 70% and TASK-07 at 75% pull below the midpoint of 80-85; credential dependency is a known constraint, not an implementation risk on the core tasks.

Note: At least one IMPLEMENT task (multiple, in fact) has confidence >=80 with dependencies satisfiable. Auto-build eligible.
