---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Archived-date: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-sticky-book-now-room-context
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Auto-Build-Intent: plan+auto
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Relates-to:
  - docs/plans/brik-sticky-book-now-room-context/fact-find.md
---

# StickyBookNow Room Context Plan

## Summary

`StickyBookNow` on room detail pages currently deep-links to Octorate's generic `calendar.xhtml` endpoint with no room pre-selection. Guests must manually re-select their room after clicking the CTA. This plan adds an optional `octorateUrl` prop to `StickyBookNow` (TASK-01) and wires it from `RoomDetailContent` via the existing `buildOctorateUrl` utility using the NR rate code (TASK-02). The change is 2-file, backward-compatible, and self-contained. As a secondary benefit it also fixes a date-staleness issue: StickyBookNow currently reads date params once on mount; the prop approach derives dates from live React state instead.

## Active tasks

- [x] TASK-01: Add `octorateUrl` prop to StickyBookNow — Complete 2026-02-27
- [x] TASK-02: Wire `octorateUrl` from RoomDetailContent — Complete 2026-02-27

## Goals

- StickyBookNow on room detail pages links directly to `result.xhtml` with the correct room rate code pre-filled.
- Guests land on the right room in Octorate without re-selecting.
- No regression to GA4 event contracts or existing tests.

## Non-goals

- Flex-plan variant on StickyBookNow.
- Extending StickyBookNow to non-room pages.
- Resolving the apartment 3-pax rate code gap (pre-existing, out of scope).

## Constraints & Assumptions

- Constraints:
  - `buildOctorateUrl` lives in `apps/brikette` — cannot be imported by `packages/ui`. URL built in app layer and passed as prop.
  - `StickyBookNow` (`packages/ui`) must not import from the app layer.
  - No hardcoded `"45111"` — use `BOOKING_CODE` from `@/context/modal/constants`.
- Assumptions:
  - NR (`direct.nr`) is the correct rate plan for this CTA. All 11 room entries have non-empty `direct.nr` codes.
  - `buildOctorateUrl` returns `ok: false` for `invalid_dates` — RoomDetailContent guards with `ok ? url : undefined`.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Room detail page sticky CTA sends guests directly to their chosen room in Octorate's booking flow, eliminating the manual re-selection step.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/brik-sticky-book-now-room-context/fact-find.md`
- Key findings used:
  - `StickyBookNow.tsx:125-135` — `deepLink` memo hardcoded to `calendar.xhtml`; no `octorateUrl` prop.
  - `RoomDetailContent.tsx:409-414` — `room.rateCodes.direct.nr` and `pickerCheckIn/Out/Adults` available at render time but unused for StickyBookNow.
  - `buildOctorateUrl.ts` — pure URL builder returning discriminated union; 2 non-test import sites (`RoomCard.tsx`, `RoomsSection.tsx`) confirm import path `@/utils/buildOctorateUrl`.
  - `BOOKING_CODE = "45111"` in `@/context/modal/constants.ts` — canonical import pattern.
  - GA4 handler (`onStickyCheckoutClick`) does not read `ctx.href`; no handler-side change needed.
  - 3 of 4 existing StickyBookNow-touching tests mock the component entirely; 1 tests real component without new prop — unaffected.

## Proposed Approach

- Option A: Add `octorateUrl?: string` prop to `StickyBookNow`; RoomDetailContent builds and passes the URL.
- Option B: Add `octorateRateCode` + `bookingCode` props to `StickyBookNow` and rebuild URL internally.
- **Chosen approach: Option A.** Option B would couple `packages/ui` to app-layer URL logic. Option A passes an opaque string — the established pattern for ui-package components. No alternative analysis required.

## Plan Gates

- Foundation Gate: **Pass** — Deliverable-Type, Execution-Track, Primary-Execution-Skill, Startup-Deliverable-Alias all present. Delivery-Readiness 93%. Test landscape complete.
- Sequenced: **Yes** — TASK-01 → TASK-02 (linear dependency; no parallelism possible).
- Edge-case review complete: **Yes**
- Auto-build eligible: **Yes** — `plan+auto`, both tasks at 85%, no blocking DECISION tasks.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `octorateUrl` prop to StickyBookNow | 85% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Wire `octorateUrl` from RoomDetailContent | 85% | S | Complete (2026-02-27) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Add prop to packages/ui component; includes new unit test |
| 2 | TASK-02 | TASK-01 complete | Wire in brikette app; TypeScript requires prop to exist first |

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `octorateUrl` prop | Yes — source file at confirmed path; no upstream deps | None | No |
| TASK-02: Wire `octorateUrl` in RoomDetailContent | Yes — TASK-01 prop declared; `buildOctorateUrl` + `BOOKING_CODE` import paths confirmed via fact-find grep | None | No |

No Critical simulation findings.

## Tasks

---

### TASK-01: Add `octorateUrl` prop to StickyBookNow

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/ui/src/organisms/StickyBookNow.tsx` (modified); new test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/organisms/StickyBookNow.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 95% — Exact target lines confirmed: props interface (line 22–35), `deepLink` memo (lines 125–135). Simple prop addition + memo branch.
  - Approach: 95% — Optional string prop is the correct interface boundary; no coupling to app utilities.
  - Impact: 85% — This task enables the feature but TASK-02 must also land for end-to-end effect. Held-back test: no single unresolved unknown would push this below 80%; prop addition is self-contained.
- **Acceptance:**
  - `StickyBookNow` accepts an optional `octorateUrl?: string` prop.
  - When `octorateUrl` is provided, the rendered `<a href>` equals `octorateUrl`.
  - When `octorateUrl` is absent, the `<a href>` falls back to the existing `calendar.xhtml` link (no regression).
  - `octorateUrl` is included in the `deepLink` `useMemo` dependency array.
  - `StickyBookNowClickContext.href` reflects `octorateUrl` when provided.
  - New unit test passes; all existing brikette tests pass.
- **Validation contract:**
  - TC-01: Render `<StickyBookNow octorateUrl="https://book.octorate.com/...result.xhtml?...">` → `<a href>` equals the provided URL.
  - TC-02: Render `<StickyBookNow>` without `octorateUrl` → `<a href>` starts with `https://book.octorate.com/octobook/site/reservation/calendar.xhtml`.
  - TC-03: `octorateUrl` appears in `useMemo` dep array (code review / linting check).
- **Execution plan:**
  - **Red:** Write new test file `apps/brikette/src/test/components/sticky-book-now-octorate-url-prop.test.tsx` with TC-01 and TC-02 using real `StickyBookNow` component. TC-01 fails (prop not yet accepted). TC-02 passes (existing behavior).
  - **Green:** In `packages/ui/src/organisms/StickyBookNow.tsx`:
    1. Add `octorateUrl?: string` to the props destructuring and TypeScript interface (alongside `lang` and `onStickyCheckoutClick`).
    2. Update the `deepLink` `useMemo`:
       ```ts
       const deepLink = useMemo(() => {
         if (octorateUrl) return octorateUrl;
         const qs = new URLSearchParams({
           codice: "45111",
           checkin: checkIn,
           checkout: checkOut,
           pax: String(adults),
           children: "0",
           childrenAges: "",
         });
         return `https://book.octorate.com/octobook/site/reservation/calendar.xhtml?${qs}`;
       }, [octorateUrl, checkIn, checkOut, adults]);
       ```
    3. Run TC-01 and TC-02 — both should pass.
  - **Refactor:** Add JSDoc comment to `octorateUrl` prop: `/** When provided, overrides the internal calendar.xhtml fallback. Build this URL in the app layer and pass it here. */`. No structural refactor needed.
- **Planning validation:**
  - Checks run: Read `StickyBookNow.tsx` in full; confirmed props interface at line 22–35, deepLink memo at 125–135, `deepLink` used in `navigateToDeepLink` (148–155), `onCtaClick` (157–203), and `<a href={deepLink}>` (241). All consumers within the same component — no external consumers of `deepLink`.
  - Validation artifacts: fact-find evidence, code reading.
  - Unexpected findings: none.
- **Scouts:** `memo()` wrapper on the component exports — `memo(StickyBookNow)`. Since `octorateUrl` is a stable string (recomputed only when picker state changes in RoomDetailContent via `useMemo`), `memo()` will correctly prevent unnecessary re-renders.
- **Edge Cases & Hardening:**
  - Empty string `""` for `octorateUrl`: `if (octorateUrl)` is falsy for empty string → falls back to `calendar.xhtml`. Correct behavior.
  - `undefined` (default when prop absent): same falsy branch → `calendar.xhtml` fallback.
- **What would make this >=90%:** Add integration test confirming `ctx.href` in `StickyBookNowClickContext` equals `octorateUrl` when provided.
- **Rollout / rollback:**
  - Rollout: deployed as part of TASK-02 — prop addition alone has no visible effect until TASK-02 passes the URL.
  - Rollback: remove `octorateUrl` prop and revert `deepLink` memo to single-branch.
- **Documentation impact:** JSDoc comment on the new prop is sufficient. No external docs needed.
- **Notes / references:**
  - Pattern reference: `packages/ui` components receive pre-built values from the app layer. This prop follows the same principle as existing `lang` prop and `onStickyCheckoutClick` hook.
- **Build evidence (Complete 2026-02-27):**
  - Offload route: Codex (`--dangerously-bypass-approvals-and-sandbox`), exit code 0
  - Affects verified: `packages/ui/src/organisms/StickyBookNow.tsx` (modified), `apps/brikette/src/test/components/sticky-book-now-octorate-url-prop.test.tsx` (created)
  - TC-01 pass: `<StickyBookNow octorateUrl="...result.xhtml...">` → `<a href>` equals provided URL
  - TC-02 pass: `<StickyBookNow>` without prop → `<a href>` starts with `calendar.xhtml`
  - Regression: `ga4-35-sticky-begin-checkout`, `ga4-sticky-book-now-search-availability`, `content-sticky-cta` — all pass
  - Post-build validation: Mode 1 Degraded — test suite DOM assertions confirm rendered `<a href>` values; no standalone dev server for packages/ui component
  - Typecheck: @acme/ui + @apps/brikette — clean (0 errors)
  - Commit: 96dc6fa5af

---

### TASK-02: Wire `octorateUrl` from RoomDetailContent

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (modified); test assertion added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Import paths confirmed (`@/utils/buildOctorateUrl`, `@/context/modal/constants`). Insertion point clear: `useMemo` after `onStickyCheckoutClick` callback (line 452), before the JSX return. Pattern from `RoomCard.tsx:233` confirms usage.
  - Approach: 90% — `useMemo` with `[pickerCheckIn, pickerCheckOut, pickerAdults, room.rateCodes.direct.nr]` deps. Discriminated-union `ok` check before using URL. Established pattern from RoomCard.
  - Impact: 85% — Completes the feature; guests now land on the right room. Held-back test: the only potential unknown is whether `buildOctorateUrl` has an undocumented behavior change — reading the source file rules this out.
- **Acceptance:**
  - `RoomDetailContent` imports `buildOctorateUrl` from `@/utils/buildOctorateUrl` and `BOOKING_CODE` from `@/context/modal/constants`.
  - `stickyOctorateUrl` is computed via `useMemo` from `pickerCheckIn`, `pickerCheckOut`, `pickerAdults`, and `room.rateCodes.direct.nr`.
  - `<StickyBookNow>` receives `octorateUrl={stickyOctorateUrl}`.
  - On a room with a valid rate code and valid dates, `stickyOctorateUrl` is a `result.xhtml` URL containing `room=<rateCode>`.
  - On `buildOctorateUrl` `ok: false` result, `stickyOctorateUrl` is `undefined`.
  - All existing brikette tests pass (no existing test captures `octorateUrl` prop from RoomDetailContent — the mock in `ga4-35-sticky-begin-checkout.test.tsx` accepts any props).
  - New assertion added: mock captures `octorateUrl` prop and asserts it includes `result.xhtml` and `room=` for a room with a valid rate code.
- **Validation contract:**
  - TC-01: Render `RoomDetailContent` for `room_10` with valid picker dates → StickyBookNow mock receives `octorateUrl` starting with `https://book.octorate.com/octobook/site/reservation/result.xhtml`.
  - TC-02: The `octorateUrl` passed to StickyBookNow contains `room=433883` (room_10 NR rate code per roomsData).
  - TC-03: When picker dates change → `stickyOctorateUrl` updates to reflect new dates (verified by re-render with new state).
  - TC-04 (edge): `buildOctorateUrl` returns `ok: false` (simulated invalid dates) → `stickyOctorateUrl` is `undefined` → StickyBookNow `octorateUrl` prop is `undefined`.
- **Execution plan:**
  - **Red:** Add assertion to the existing `ga4-35-sticky-begin-checkout.test.tsx` mock: capture `octorateUrl` prop passed to `StickyBookNow` and assert it contains `result.xhtml`. Test fails (prop not yet passed).
  - **Green:** In `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`:
    1. Add imports at top of import block:
       ```ts
       import { buildOctorateUrl } from "@/utils/buildOctorateUrl";
       import { BOOKING_CODE } from "@/context/modal/constants";
       ```
    2. After the `onStickyCheckoutClick` `useCallback` (line 452), add:
       ```ts
       const stickyOctorateUrlResult = useMemo(
         () =>
           buildOctorateUrl({
             checkin: pickerCheckIn,
             checkout: pickerCheckOut,
             pax: pickerAdults,
             plan: "nr",
             roomSku: room.sku,
             octorateRateCode: room.rateCodes.direct.nr,
             bookingCode: BOOKING_CODE,
           }),
         [pickerCheckIn, pickerCheckOut, pickerAdults, room.sku, room.rateCodes.direct.nr]
       );
       const stickyOctorateUrl = stickyOctorateUrlResult.ok ? stickyOctorateUrlResult.url : undefined;
       ```
    3. Update the `<StickyBookNow>` render at line 575:
       ```tsx
       <StickyBookNow lang={lang} onStickyCheckoutClick={onStickyCheckoutClick} octorateUrl={stickyOctorateUrl} />
       ```
    4. Run all tests — should pass.
  - **Refactor:** None needed. The inline `const stickyOctorateUrl` extraction from the result keeps the `useMemo` clean.
- **Planning validation:**
  - Checks run: Confirmed `pickerCheckIn/Out/Adults` are `useState` values from lines 412–414, updated via `handleDateChange`. Confirmed `room.sku` and `room.rateCodes.direct.nr` are constant for the component lifetime (derived from `roomsData` by room ID). Confirmed `BOOKING_CODE` import path is `@/context/modal/constants`. Verified `buildOctorateUrl` signature matches the call.
  - Validation artifacts: fact-find evidence, RoomDetailContent full read.
  - Unexpected findings: `room.sku` is `"room_10"` etc., but `buildOctorateUrl` takes `roomSku` only for labeling (it's not emitted in the URL params — only `room: octorateRateCode` is). So `room.sku` can be passed safely.
- **Scouts:** Confirm `buildOctorateUrl` does NOT include `roomSku` in the output URL — from source reading, `roomSku` is in `params` but NOT in `urlParams` construction (line 71–79 of `buildOctorateUrl.ts`). Safe to pass any non-empty string.
- **Edge Cases & Hardening:**
  - `pickerAdults` starts at 1 (from `HOSTEL_MIN_PAX`), valid for `isValidPax`.
  - `pickerCheckIn` defaults to `todayIso` and `pickerCheckOut` to `todayIso + 2 days`. Both are valid for `isValidStayRange`. Only invalid if the user somehow produces a checkout < checkin in the picker (guarded by `normalizeCheckoutForStay` in the picker handler).
  - Known limitation: apartment always uses 2-pax NR rate code (`804934`) regardless of `pickerAdults`. Pre-existing gap, not introduced here.
- **What would make this >=90%:** Add a narrow integration test rendering `RoomDetailContent` and checking the actual Octorate URL fragment in the StickyBookNow link.
- **Rollout / rollback:**
  - Rollout: self-contained; no flag needed.
  - Rollback: remove `buildOctorateUrl` import, `stickyOctorateUrl` memo, and `octorateUrl` prop from `<StickyBookNow>` call.
- **Documentation impact:** None.
- **Notes / references:**
  - `room.rateCodes.direct.nr` confirmed values for all 11 rooms: all non-empty per roomsData source (apartment: `"804934"`, hostel rooms: `"433883"` etc.).
  - `RoomCard.tsx:233` is the reference implementation for this same pattern.
  - Plan had TC-02 rate code as `433883` (double_room) — actual `room_10` NR code is `433887`. Implementation is correct; plan note is a factual error corrected by Codex during build.
- **Build evidence (Complete 2026-02-27):**
  - Offload route: Codex (`--dangerously-bypass-approvals-and-sandbox`), exit code 0
  - Affects verified: `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (modified), `apps/brikette/src/test/components/ga4-35-sticky-begin-checkout.test.tsx` (modified — TC-WireUrl assertion added)
  - Scope expansion: `ga4-35-sticky-begin-checkout.test.tsx` added to Affects for TC-WireUrl assertion (within task objective)
  - TC-WireUrl pass: `capturedOctorateUrl` contains `result.xhtml` and `room=433887` for room_10
  - Regression: 13/13 tests across 4 suites (`ga4-35-sticky-begin-checkout`, `ga4-sticky-book-now-search-availability`, `content-sticky-cta`, `sticky-book-now-octorate-url-prop`) — all pass
  - Post-build validation: Mode 1 Degraded — TC-WireUrl DOM assertion confirms `octorateUrl` prop with `result.xhtml` passed to StickyBookNow; no standalone dev server for room detail page
  - Typecheck: @apps/brikette — clean (0 errors)
  - Import sort fixed (simple-import-sort): `buildOctorateUrl` and `BOOKING_CODE` sorted into correct positions
  - Commit: 79bf800d8b

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `deepLink` memo missing `octorateUrl` dep | Low | Low — stale link on rare re-render edge | Explicitly included in memo dep array in TASK-01 execution plan |
| Apartment uses 2-pax rate code regardless of picker adults | Certain | Low — correct room, wrong pax tier for 3+ guests | Pre-existing data model gap; documented in task spec as known limitation |
| `StickyBookNowClickContext.href` changes to `result.xhtml` | Certain (by design) | None — GA4 handler does not read `ctx.href` | Confirmed in fact-find; no consumer of `ctx.href` in `RoomDetailContent` |

## Observability

- Logging: None needed.
- Metrics: GA4 `begin_checkout` events already firing from `onStickyCheckoutClick`. URL verification via browser devtools navigation inspection or GA4 DebugView `page_location` on next click.
- Alerts/Dashboards: None needed.

## Acceptance Criteria (overall)

- [ ] `StickyBookNow` renders `<a href={octorateUrl}>` when `octorateUrl` prop is provided.
- [ ] `StickyBookNow` renders `<a href={calendar.xhtml...}>` when `octorateUrl` prop is absent (no regression).
- [ ] `RoomDetailContent` passes a `result.xhtml` URL as `octorateUrl` for rooms with valid picker dates.
- [ ] `RoomDetailContent` passes `undefined` as `octorateUrl` when `buildOctorateUrl` returns `ok: false`.
- [ ] All existing brikette tests pass.
- [ ] New test for `octorateUrl` prop override passes.
- [ ] TypeScript compiles without errors across all affected packages.

## Decision Log

- 2026-02-27: Option A (opaque `octorateUrl` string prop) chosen over Option B (rate code + booking code props) — preserves package boundary, follows established `packages/ui` pattern.
- 2026-02-27: NR (`direct.nr`) chosen as the rate plan for StickyBookNow — consistent with RoomCard primary CTA, lowest direct rate.

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort S (weight 1)
- TASK-02: confidence 85%, effort S (weight 1)
- Overall = (85×1 + 85×1) / (1+1) = **85%**
