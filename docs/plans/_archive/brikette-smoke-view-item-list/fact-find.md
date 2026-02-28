---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: brikette-smoke-view-item-list
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-smoke-view-item-list/plan.md
Trigger-Why: Smoke test confirmed view_item_list fires in production but no assertion captures it — automated verification gap identified in results-review.
Trigger-Intended-Outcome: type: operational | statement: Add view_item_list to REQUIRED_EVENTS in ga4-funnel-smoke.mjs so the smoke test fails if the event stops firing | source: operator
---

# Brikette Smoke — view_item_list Assertion Fact-Find Brief

## Scope

### Summary

The Brikette GA4 funnel smoke test (`apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs`) runs
against a live URL via Playwright, intercepting `g/collect` network requests and asserting a
set of required GA4 events. The `view_item_list` event fires in production (confirmed in
TASK-38, 2026-02-22) but is absent from `REQUIRED_EVENTS`, so it appears in the diagnostic
log only and is never asserted. This fact-find scopes the single fix: add `view_item_list` to
`REQUIRED_EVENTS` and, optionally, assert its payload fields (`item_list_id`, `items.length`).

### Goals

- Identify the exact line change in `ga4-funnel-smoke.mjs` required to assert `view_item_list`
- Confirm the event fires before any user interaction (page-load-time) so no additional click
  steps are needed in the test scenario
- Determine whether a presence-only assertion or a payload-depth assertion is appropriate
- Produce a single focused implementation task

### Non-goals

- Any changes to unit tests (already comprehensively covered — 4 test cases in
  `ga4-view-item-list-impressions.test.tsx`)
- Changes to the `fireViewItemList` helper or any component calling it
- Adding new smoke test scenarios (IT locale, additional surfaces)
- GA4 custom dimension assertions (deferred per results-review)

### Constraints & Assumptions

- Constraints:
  - Smoke test runs against live production (`https://hostel-positano.com`) or `E2E_BASE_URL`
  - The EN scenario navigates to `/en/book?checkin=...&checkout=...&pax=2`; `view_item_list`
    fires on initial render of `BookPageContent` — no additional interaction needed
  - The test intercepts `**/g/collect**` requests; GA4 consent must be granted programmatically
    (already done via `window.gtag("consent", "update", ...)` on line 141–150)
  - `REQUIRED_EVENTS` is a module-level constant — changing it affects all scenarios equally
- Assumptions:
  - Playwright intercepts the `g/collect` POST; `view_item_list` (`en=view_item_list`)
    is parseable by the existing `parseGA4Events` function (confirmed pattern matches
    `select_item` and `begin_checkout` which are already asserted)
  - The event fires consistently before `networkidle` + 1500ms settle time (already confirmed
    by build-record TASK-38 observation)

## Outcome Contract

- **Why:** The results-review for the GA4 funnel plan identified a gap: `view_item_list`
  fires in production but the smoke test does not assert it, so a regression would go
  undetected. The operator escalated this from "defer" to act on it now.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `view_item_list` is in `REQUIRED_EVENTS` in
  `ga4-funnel-smoke.mjs`; the smoke test fails if the event stops firing in production.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs:30` — `REQUIRED_EVENTS` constant:
  currently `["select_item", "begin_checkout"]`. This is the exact change point.
- `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs:206–221` — assertion loop over
  `REQUIRED_EVENTS`; each event is checked against `capturedEvents` map.

### Key Modules / Files

- `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` — the smoke test. Uses Playwright
  `chromium`, `page.route("**/g/collect**")` intercept, and `parseGA4Events()` to extract
  `en=` event names from URL QS and POST body lines.
- `apps/brikette/src/utils/ga4-events.ts:344–358` — `fireViewItemList()`: fires
  `gtag("event", "view_item_list", { item_list_id, item_list_name, items[] })`. Uses
  `shouldFireImpressionOnce` dedupe — fires once per navigation per `item_list_id`.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:123–125` — calls
  `fireViewItemList({ itemListId: "book_rooms", rooms: roomsData })` in a `useEffect` on
  mount. This is the surface exercised by the EN scenario (navigates to `/en/book`).
- `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — also calls `fireViewItemList`
  (`item_list_id: "rooms_index"`); not exercised by current smoke test scenarios.
- `apps/brikette/src/test/components/ga4-view-item-list-impressions.test.tsx` — existing
  Jest integration tests: 4 TCs (rooms, book, home, deals). Well-covered unit-side.

### Patterns & Conventions Observed

- **Presence-only assertion pattern**: `REQUIRED_EVENTS` loop checks `capturedEvents.has(eventName)`
  only — does not inspect payload fields. This matches the current approach for `select_item`
  and `begin_checkout`.
- **Diagnostic log pattern**: `console.info("all captured GA4 events: [...]")` logs all
  captured event names for non-asserting diagnostics. `view_item_list` already appears here.
- **Consent grant**: `gtag("consent", "update", ...)` grants all consents programmatically
  before interactions — ensures GA4 events are not blocked by consent-denial default.
- **`parseGA4Events`**: handles both URL QS (`en=`) and batched POST body lines. Existing
  events are parsed identically; no special handling needed for `view_item_list`.

### Data & Contracts

- Types/schemas/events:
  - `view_item_list` payload: `{ item_list_id: ItemListId, item_list_name: string, items: GA4Item[] }`
  - `GA4Item`: `{ item_id: string, item_name: string, item_category: "hostel", affiliation:
    "Hostel Brikette", currency: "EUR", index: number, ...optional fields }`
  - `ItemListId` enum: `home_rooms_carousel | rooms_index | book_rooms | deals_index | room_detail`
  - For the `/en/book` scenario: `item_list_id = "book_rooms"`, `item_list_name = "Book page rooms"`
- Persistence: none — event emitted once per navigation, captured by Playwright route handler
- API/contracts:
  - GA4 Measurement Protocol v2: `en=view_item_list` in `g/collect` POST body line
  - `capturedEvents.get("view_item_list")[0].raw` will contain `ep.item_list_id=book_rooms`
    as a URL-encoded param key (confirmed pattern from custom dimension evidence: TASK-38
    smoke noted `ep.item_list_id=book_rooms` present in g/collect)

### Dependency & Impact Map

- Upstream dependencies:
  - `BookPageContent` renders on page load with `roomsData` — `fireViewItemList` called
    in `useEffect` immediately on mount; no date selection or user action required
  - GA4 consent granted programmatically at line 141 (already in smoke test)
- Downstream dependents:
  - `REQUIRED_EVENTS` is read only by the assertion loop (lines 206–221); no other code
    depends on this constant
- Likely blast radius:
  - **Extremely small**: one array literal change. Applies to all scenarios in principle;
    IT scenario exits before assertions (redirect guard at lines 153–161), so no practical
    effect on IT. If the parallel `brikette-it-book-route-static-export` plan resolves the
    IT redirect, the IT scenario would reach the assertion loop and `view_item_list` would
    be required for IT too — acceptable and expected behaviour.

### Test Landscape

#### Test Infrastructure

- Frameworks: Playwright (smoke), Jest (unit), pnpm test:governed
- Commands:
  - Smoke: `E2E_BASE_URL=https://hostel-positano.com node apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs`
  - Unit: `pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs`
- CI integration: smoke test is NOT in CI (manual/on-demand). Unit tests run in CI.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `view_item_list` event firing | Jest integration | `ga4-view-item-list-impressions.test.tsx` | 4 TCs: /rooms, /book, home carousel, deals. Dedupe per-nav. Full payload verified. |
| `view_item_list` helper contract | Jest unit | `ga4-events-contract.test.ts` | `shouldFireImpressionOnce` behavior; key deduplication |
| `select_item` + `begin_checkout` (smoke) | Playwright (live) | `ga4-funnel-smoke.mjs` | Present-assertion only via `REQUIRED_EVENTS` |
| `view_item_list` (smoke) | None | — | **Gap**: fires and is logged but not asserted |

#### Coverage Gaps

- Untested paths:
  - `view_item_list` reaching `g/collect` in a live browser (no E2E assertion today)
- Extinct tests: none

#### Testability Assessment

- Easy to test: adding `"view_item_list"` to `REQUIRED_EVENTS` — one line; reuses all
  existing infrastructure (route intercept, `parseGA4Events`, assertion loop)
- Hard to test: payload-depth assertion in smoke (possible but requires accessing
  `capturedEvents.get("view_item_list")[0].raw` and checking `ep.item_list_id`; adds ~6
  lines; justified only if payload regression is a real risk)
- Test seams needed: none — all infrastructure already in place

#### Recommended Test Approach

- E2E: add `"view_item_list"` to `REQUIRED_EVENTS` (minimum viable, reuses existing pattern)
- Optional payload check: assert `item_list_id = "book_rooms"` and `items.length >= 1` from
  `capturedEvents.get("view_item_list")[0].raw`. Addresses the question of whether the payload
  correct, not just whether the event name fires.

### Recent Git History (Targeted)

- `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` — single commit: `39b9863cfb`
  ("chore: commit outstanding workspace changes") — written as part of TASK-38 in the
  `brikette-cta-sales-funnel-ga4` plan (completed 2026-02-22).

## Questions

### Resolved

- Q: Does `view_item_list` fire before any user interaction, or does it require the date
  picker to be submitted first?
  - A: Fires on component mount, not on date submission. `BookPageContent` calls
    `fireViewItemList({ itemListId: "book_rooms", rooms: roomsData })` in a `useEffect`
    immediately when mounted (`BookPageContent.tsx:123–125`). The smoke test already waits
    for `#double_room` and 1500ms settle — `view_item_list` fires well within this window.
  - Evidence: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:123–125`;
    build-record TASK-38: "`view_item_list ✓ (item_list_id=book_rooms, all rooms present)`"

- Q: Does the existing `parseGA4Events` function correctly capture `view_item_list`?
  - A: Yes. The function extracts `en=` from both URL QS and POST body lines. `view_item_list`
    is already appearing in the diagnostic `console.info("all captured GA4 events")` log,
    confirming it IS being captured — it is just not in `REQUIRED_EVENTS`.
  - Evidence: `ga4-funnel-smoke.mjs:233–237` (diagnostic log); TASK-38 build-record
    confirms the event fires and was observed in the smoke run.

- Q: Should the assertion be presence-only or should it also validate payload fields?
  - A: Presence-only (`"view_item_list"` added to `REQUIRED_EVENTS`) is the minimum and
    consistent with the existing pattern for `select_item` and `begin_checkout`. An optional
    payload check (verify `item_list_id = "book_rooms"` from `raw`) would catch payload
    regressions. Recommend: presence assertion first (one-line change); payload assertion
    is explicitly optional and can be added in the same task if desired, but is not required
    for the gap to be closed. Payload is thoroughly covered by unit tests.
  - Evidence: `ga4-funnel-smoke.mjs:30, 206–221` (existing pattern); unit test coverage
    in `ga4-view-item-list-impressions.test.tsx` (payload fully asserted at unit level).

- Q: Does adding `view_item_list` to `REQUIRED_EVENTS` affect the IT scenario?
  - A: No. The IT locale scenario (`/it/prenota`) exits early at the redirect guard
    (`ga4-funnel-smoke.mjs:153–161`) — it returns `failures = []` (treated as a skip) before
    reaching the `REQUIRED_EVENTS` assertion loop. The IT scenario does not assert any events.
  - Evidence: `ga4-funnel-smoke.mjs:153–161` (redirect guard returns early).

### Open (Operator Input Required)

None — all questions self-resolved from evidence.

## Confidence Inputs

- **Implementation**: 98%
  - Evidence: Exact change point identified (line 30, `REQUIRED_EVENTS`). One-line fix.
    Event confirmed captured and loggable. Raises to 99% if smoke test is run manually
    to confirm passing after the change.
  - What raises to ≥80: already there.
  - What raises to ≥90: already there.

- **Approach**: 97%
  - Evidence: Adding to `REQUIRED_EVENTS` is the exact pattern used for all other required
    events. No alternative approach is needed.
  - What raises to ≥90: already there.

- **Impact**: 90%
  - Evidence: The smoke test will now fail if `view_item_list` stops reaching `g/collect`
    in production. This closes the automation gap identified in the results-review. Impact
    is operational (catches regression) not revenue-driving.
  - What raises to ≥90: already there; smoke test is manual-only so impact is bounded by
    test run frequency.

- **Delivery-Readiness**: 98%
  - Evidence: Tiny scope. No dependencies on other work. Can be done in a single edit.
    No CI changes needed (smoke is manual).
  - What raises to ≥90: already there.

- **Testability**: 95%
  - Evidence: Manual smoke run against production confirms pass/fail immediately.
  - What raises to ≥90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `view_item_list` doesn't fire in the time window | Low | High | build-record confirms it fires; event is on mount, before any interaction; existing 1500ms settle time is sufficient |
| IT scenario now fails if `view_item_list` required | None | — | IT redirect guard exits before assertion loop; no risk |
| Event fires but payload has silently changed | Low | Medium | Presence assertion detects event presence; unit tests detect payload shape. Optional payload check in smoke is additive. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow the existing `REQUIRED_EVENTS` presence-only pattern for the minimum assertion
  - If adding optional payload assertion, access `capturedEvents.get("view_item_list")[0].raw`
    and check `ep.item_list_id === "book_rooms"` using the same log/fail pattern as other assertions
- Rollout/rollback expectations:
  - No deployment involved — this is a test script only. Rollback = revert the array change.
- Observability expectations:
  - After the change: smoke test output will include
    `✓ EN /en/book: "view_item_list" captured (tid=..., count=1)` on pass;
    `✗ EN /en/book: GA4 event "view_item_list" was NOT captured` on failure.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `"view_item_list"` to `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs`; optionally
  add payload assertion for `item_list_id = "book_rooms"`; run smoke test to confirm pass.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs` includes `"view_item_list"`
  - Smoke test run passes with `✓ "view_item_list" captured` in output
- Post-delivery measurement plan:
  - No ongoing measurement needed — this is a test assertion. Future smoke runs will
    continuously verify the event fires.

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity** ✓ — All claims traced to specific file paths and line numbers.
   `REQUIRED_EVENTS` at line 30, assertion loop at lines 206–221, `fireViewItemList` at
   `ga4-events.ts:344–358`, `BookPageContent.tsx:123–125` mount call all verified.
2. **Boundary coverage** ✓ — Integration boundary (GA4 `g/collect` network request) confirmed
   intercepted by existing `page.route` handler. IT locale redirect guard confirmed safe.
3. **Testing coverage** ✓ — Unit test coverage for `view_item_list` is comprehensive (4 TCs).
   Smoke test gap (no assertion) is the stated work item. No extinct tests.

### Confidence Adjustments

- No downward adjustments required. All scores are high because the scope is extremely narrow:
  one line addition to an array constant, with all surrounding infrastructure already in place
  and confirmed working in production.

### Remaining Assumptions

- `view_item_list` fires in a `useEffect` at mount time but is queued by Consent Mode v2
  (`analytics_storage: 'denied'` default). The queue is flushed to `g/collect` after the
  programmatic consent grant at lines 141–150 (which runs post-networkidle). The Playwright
  route intercept captures the flush regardless of when it arrives — confirmed by TASK-38.
- The `parseGA4Events` POST body parser correctly handles the batched line containing
  `en=view_item_list` (confirmed: same format as `select_item`/`begin_checkout`).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan brikette-smoke-view-item-list --auto`
