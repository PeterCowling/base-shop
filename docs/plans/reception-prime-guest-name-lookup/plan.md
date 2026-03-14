---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-guest-name-lookup
Dispatch-ID: IDEA-DISPATCH-20260314200000-0002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-guest-name-lookup/analysis.md
---

# Reception Prime Guest Name Lookup — Plan

## Summary

The reception inbox always returns `guestFirstName: null` / `guestLastName: null` for Prime messaging threads even though every `PrimeReviewThreadSummary` carries a `bookingId` that equals the Firebase `bookingRef` for direct (`prime_direct`) threads. This plan implements a new `fetchPrimeGuestNames` helper in `guest-matcher.server.ts` that performs deduplicated parallel dual-fetch (bookings + guestsDetails per ref) to retrieve lead-guest names, then augments `listPrimeInboxThreadSummaries()` to patch the names before returning to the caller. Sentinel `bookingId` values (`''` for broadcast, `'activity'` for activity) are filtered before any Firebase path is constructed. Existing API contract tests that hard-code `guestFirstName: null` for Prime threads are updated. The `mapPrimeSummaryToInboxThread` mapper is intentionally left unchanged.

## Active tasks

- [x] TASK-01: Add `guestDetailsBookingPath` and `bookingRootPath` imports to `guest-matcher.server.ts`
- [x] TASK-02: Implement `fetchPrimeGuestNames` helper in `guest-matcher.server.ts`
- [x] TASK-03: Augment `listPrimeInboxThreadSummaries()` to call `fetchPrimeGuestNames` and patch names
- [x] TASK-04: Add TODO comments in de-scoped detail/mutation paths
- [x] TASK-05: Unit tests for `fetchPrimeGuestNames`
- [x] TASK-06: Audit 9 API contract test locations that hard-code `guestFirstName: null` (mock stubs — comment only)
- [x] TASK-07: Integration tests for augmented `listPrimeInboxThreadSummaries()`

## Goals

- Surface `guestFirstName` / `guestLastName` on `prime_direct` inbox list threads
- Guard against `bookingId: ''` (broadcast) triggering a full `guestsDetails/` tree read
- Guard against `bookingId: 'activity'` triggering any Firebase call
- Fail open: Firebase unavailable → names stay null, no throw, no visible error
- Audit existing API contract test stubs for Prime threads and confirm they remain valid (all are in fully-mocked test contexts; no assertion changes needed)

## Non-goals

- Augmenting detail/mutation paths (`getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`) — de-scoped, TODO comment only
- Changing how email thread guest names work
- Occupant-level precision matching (booking-level lead guest is sufficient for inbox display)
- Feature flags or DB migrations (change is additive)

## Constraints & Assumptions

- Constraints:
  - `listPrimeInboxThreadSummaries` is async; augmentation happens after the Prime API call, before return
  - Firebase REST available via `fetchFirebaseJson` (`FIREBASE_BASE_URL` + `FIREBASE_DB_SECRET` — already in use)
  - `guestDetailsBookingPath('')` collapses to `guestsDetails` root via `joinFirebasePath` — empty string must never be passed to it
  - `mapPrimeSummaryToInboxThread` is NOT changed (de-scoped mutation paths use it; widening blast radius is prohibited)
  - Tests run in CI only — no local test execution
  - Both Prime API calls and Firebase calls flow through `global.fetch`; dual-endpoint mock routing required in new tests
- Assumptions:
  - For `prime_direct` threads, `bookingId` is a valid Firebase `bookingRef` (confirmed from `prime-review-api.ts:189`)
  - `guestsDetails/{bookingRef}` does not carry a `leadGuest` flag; dual-fetch with `bookings/{bookingRef}` identifies lead guest
  - Up to 50 Prime threads; unique bookingRefs typically 2–10; concurrency cap of 10 ref-pairs is safe

## Inherited Outcome Contract

- **Why:** Prime inbox threads have no guest names, making triage slower for staff. Email threads already resolve names. Closing this gap makes the Prime inbox parity-complete for the most operator-visible field.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime direct (`prime_direct`) inbox threads display a booking-level guest name (lead guest or first named occupant from `guestsDetails/{bookingRef}`) in the inbox list view; broadcast and activity threads remain name-free; Firebase unavailability degrades gracefully to null names with no throw
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/reception-prime-guest-name-lookup/analysis.md`
- Selected approach inherited:
  - Option B: Parallel per-bookingRef fetches (deduplicated) with dual-fetch per ref
  - New exported helper `fetchPrimeGuestNames` in `guest-matcher.server.ts`
  - `Promise.allSettled` for fail-open partial-fetch resilience
  - Concurrency cap: 10 concurrent ref-pairs
- Key reasoning used:
  - Option A (root fetch) rejected: single `guestsDetails/` read grows unbounded with historical bookings
  - Lead-guest strategy: dual-fetch required because `guestsDetails/` has no `leadGuest` flag — must cross-ref `bookings/`
  - Mapper not changed: changing it would widen blast radius to de-scoped detail/resolve/dismiss paths

## Selected Approach Summary

- What was chosen:
  - `fetchPrimeGuestNames(bookingRefs: string[]): Promise<Map<string, { firstName: string; lastName: string }>>` in `guest-matcher.server.ts`
  - Per unique valid ref: `fetchFirebaseJson(bookingRootPath(ref))` + `fetchFirebaseJson(guestDetailsBookingPath(ref))` in parallel via `Promise.allSettled`
  - Identify `leadGuest: true` occupantId from bookings response, look up name in guestsDetails response; fall back to first-named occupant
  - `listPrimeInboxThreadSummaries()` calls helper after mapping, patches `guestFirstName`/`guestLastName` before return
- Why planning is not reopening option selection:
  - Analysis resolved all architectural decisions (lead-guest strategy, concurrency cap, blast radius containment, sentinel guards)
  - No operator questions remain open

## Fact-Find Support

- Supporting brief: `docs/plans/reception-prime-guest-name-lookup/fact-find.md`
- Evidence carried forward:
  - `bookingId === bookingRef` for `prime_direct` threads; empty string for broadcasts
  - `guestDetailsBookingPath('')` → full `guestsDetails` root via `joinFirebasePath` (confirmed `packages/lib/src/hospitality/index.ts:71`)
  - `buildFirebaseUrl` / `fetchFirebaseJson` available in `firebase-rtdb.server.ts`
  - `prime-review-mapper.test.ts` is the established test seam (mocked `global.fetch`)
  - 9 existing API contract test locations hard-code `guestFirstName: null` for Prime threads

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add path imports to `guest-matcher.server.ts` | 95% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Implement `fetchPrimeGuestNames` helper | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Augment `listPrimeInboxThreadSummaries()` | 85% | S | Complete (2026-03-14) | TASK-02 | TASK-07 |
| TASK-04 | IMPLEMENT | Add TODO comments in de-scoped paths | 95% | S | Complete (2026-03-14) | - | - |
| TASK-05 | IMPLEMENT | Unit tests for `fetchPrimeGuestNames` | 85% | M | Complete (2026-03-14) | TASK-02 | - |
| TASK-06 | IMPLEMENT | Audit 9 API contract test locations (mock stubs — comment only) | 85% | S | Complete (2026-03-14) | - | - |
| TASK-07 | IMPLEMENT | Integration tests for augmented list function | 80% | M | Complete (2026-03-14) | TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — `ThreadList.tsx` already renders `guestFirstName` when non-null; no UI changes needed | - | No UI files touched |
| UX / states | Fail-open: Firebase unavailable → `guestFirstName: null` (no UX change); partial failure per-ref → other refs still succeed | TASK-02, TASK-05 | `Promise.allSettled` handles partial failures |
| Security / privacy | PII (first/last name) stays server-only; same server context as email thread path; no new client exposure; `FIREBASE_DB_SECRET` already required | TASK-02 | No new env vars needed |
| Logging / observability / audit | Log rejected `Promise.allSettled` entries at `console.error` with bookingRef and error; no success-path logs (matches `buildGuestEmailMap` error-only posture) | TASK-02 | Same logging posture as `buildGuestEmailMap` |
| Testing / validation | Unit tests for helper (TASK-05); integration tests for augmented list function (TASK-07); existing API contract tests updated (TASK-06) | TASK-05, TASK-06, TASK-07 | Dual-endpoint `global.fetch` mock required in TASK-07 |
| Data / contracts | No type changes to `InboxThreadSummaryApiModel`; no schema migration; `guestFirstName`/`guestLastName` already `string \| null` | TASK-03 | `mapPrimeSummaryToInboxThread` unchanged |
| Performance / reliability | Per-ref bounded fetch (not root fetch); deduplicated unique refs; `Promise.allSettled` fail-open; concurrency cap 10 ref-pairs | TASK-02 | Typical 2–10 unique refs at list time |
| Rollout / rollback | Additive (null → populated); no DB migration; no feature flag; rollback = revert TASK-03 augmentation call | TASK-03 | Zero-risk rollback |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04, TASK-06 | - | Imports, TODO comments, and API contract test audit can proceed in parallel |
| 2 | TASK-02 | TASK-01 complete | Helper implementation |
| 3 | TASK-03, TASK-05 | TASK-02 complete | Augmentation call and helper tests in parallel |
| 4 | TASK-07 | TASK-03 complete | Integration tests for augmented function |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Prime thread list guest names | `GET /api/mcp/inbox` request | (1) Prime API call returns `PrimeReviewThreadSummary[]`; (2) `listPrimeInboxThreadSummaries` maps each via `mapPrimeSummaryToInboxThread` → `InboxThreadSummaryApiModel[]` with null names; (3) unique non-sentinel bookingRefs extracted (skip `''` and `'activity'`); (4) `fetchPrimeGuestNames(refs)` fires parallel dual-fetch per ref; (5) names patched into summaries before return to caller | TASK-02, TASK-03 | Firebase unavailability: `Promise.allSettled` catches → names stay null, no throw |
| Sentinel guard | Any inbox list request including broadcast/activity threads | `fetchPrimeGuestNames` receives filtered refs — empty string and `'activity'` refs never reach `bookingRootPath` or `guestDetailsBookingPath` path builders | TASK-02 | Empty-string guard is test-covered in TASK-05 — regression-guarded |
| UI display (no change) | List response received by `ThreadList.tsx` | `ThreadList.tsx:239` renders `guestFirstName` when non-null; prime_direct rows show guest name; broadcast/activity rows unchanged (null → nothing) | None (UI already wired) | None |

## Tasks

---

### TASK-01: Add `guestDetailsBookingPath` and `bookingRootPath` imports to `guest-matcher.server.ts`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/lib/inbox/guest-matcher.server.ts` — import line update only
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/guest-matcher.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% — single import line change; `guestDetailsBookingPath` and `bookingRootPath` are confirmed exported from `packages/lib/src/hospitality/index.ts:63,71`
  - Approach: 95% — import pattern already established with `HOSPITALITY_RTDB_ROOTS`
  - Impact: 95% — prerequisite only; no runtime behavior change
- **Acceptance:**
  - `guest-matcher.server.ts` imports `guestDetailsBookingPath` and `bookingRootPath` from `@acme/lib/hospitality`
  - Existing `HOSPITALITY_RTDB_ROOTS` import is preserved (same import line or separate; either is valid)
  - TypeScript compiles without error on the file
- **Engineering Coverage:**
  - UI / visual: N/A — import-only change
  - UX / states: N/A — no runtime behavior change
  - Security / privacy: N/A — no runtime behavior change
  - Logging / observability / audit: N/A — no runtime behavior change
  - Testing / validation: N/A — no new test surface introduced; covered by TASK-05
  - Data / contracts: N/A — no contract change
  - Performance / reliability: N/A — no runtime behavior change
  - Rollout / rollback: N/A — import-only; trivially reversible
- **Validation contract:**
  - TC-01: TypeScript compilation of `guest-matcher.server.ts` after import change → no error
  - TC-02: `guestDetailsBookingPath` and `bookingRootPath` are referenced in TASK-02's implementation without import errors
- **Execution plan:** Add named imports `guestDetailsBookingPath` and `bookingRootPath` to the existing `@acme/lib/hospitality` import at line 9 of `guest-matcher.server.ts`.
- **Planning validation:** Confirmed: `packages/lib/src/hospitality/index.ts:63` exports `bookingRootPath`; line 71 exports `guestDetailsBookingPath`. Both take a single `bookingRef: string` argument.
- **Scouts:** None — confirmed exports at specific line numbers.
- **Edge Cases & Hardening:** None — import-only task.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: No deploy step; merged with TASK-02+.
  - Rollback: Revert import line addition.
- **Documentation impact:** None.
- **Notes / references:**
  - Current import line: `import { HOSPITALITY_RTDB_ROOTS } from "@acme/lib/hospitality";` at `guest-matcher.server.ts:9`

---

### TASK-02: Implement `fetchPrimeGuestNames` helper in `guest-matcher.server.ts`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/lib/inbox/guest-matcher.server.ts` — new exported async function `fetchPrimeGuestNames`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/guest-matcher.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 85%
  - Implementation: 85% — dual-fetch pattern is confirmed from `buildGuestEmailMap`; occupant-iteration logic is analogous but new; `Promise.allSettled` result parsing is straightforward; held-back test: a badly shaped Firebase response (unexpected occupant key structure) could cause silent wrong-occupant selection — risk is low because `leadGuest` flag presence is checked first and fallback is first-named
  - Approach: 90% — approach confirmed in analysis; dual-fetch with `leadGuest` flag cross-reference is the established reception pattern
  - Impact: 85% — new output; consumer (TASK-03) must read it correctly; dead-end risk if TASK-03 missed — but TASK-03 is explicitly planned
- **Acceptance:**
  - `fetchPrimeGuestNames(bookingRefs: string[]): Promise<Map<string, { firstName: string; lastName: string }>>` is exported from `guest-matcher.server.ts`
  - Empty-string entries in `bookingRefs` are filtered before any path construction — `fetchFirebaseJson` is never called with an empty-segment path
  - `'activity'` entries in `bookingRefs` are filtered before any path construction
  - Per unique valid ref: `fetchFirebaseJson(bookingRootPath(ref))` and `fetchFirebaseJson(guestDetailsBookingPath(ref))` are called in parallel via `Promise.allSettled`
  - Lead-guest identification: `leadGuest: true` occupantId from bookings response → `guestsDetails[bookingRef][occupantId].firstName/lastName`
  - Fallback: if no `leadGuest: true` occupant found, use first occupant key with a non-empty `firstName` in `guestsDetails[bookingRef]`
  - On Firebase error (either leg rejects): entry is logged at `console.error` with bookingRef and sanitized error message string (matching `buildGuestEmailMap` pattern: `err instanceof Error ? err.message : String(err)`); ref is absent from returned map (not in result → caller sees null names)
  - Concurrency: batches of ≤10 ref-pairs processed concurrently; refs beyond 10 wait for current batch to settle before firing
  - Returns empty `Map` (not null, not throws) when `bookingRefs` is empty or all are filtered sentinels
- **Engineering Coverage:**
  - UI / visual: N/A — server-side only
  - UX / states: Required — fail-open: Firebase error → entry absent from map → caller sees null names with no throw; partial failure → other refs still succeed
  - Security / privacy: Required — PII (names) confined to server-side memory; `FIREBASE_DB_SECRET` already env-managed; no client exposure
  - Logging / observability / audit: Required — log individual rejected `allSettled` entries at `console.error` with bookingRef + error (no success-path logging; matches `buildGuestEmailMap` posture)
  - Testing / validation: Required — TASK-05 covers all acceptance paths
  - Data / contracts: Required — return type `Map<string, { firstName: string; lastName: string }>`; exported for TASK-03 and tests; `FirebaseOccupantBooking` / `FirebaseOccupantDetails` types already defined in `guest-matcher.server.ts`
  - Performance / reliability: Required — concurrency cap 10 ref-pairs; `Promise.allSettled` (not `Promise.all`) so one failure doesn't abort others; typical 2–10 unique refs at list time
  - Rollout / rollback: Required — new exported function; does not alter existing exports; rollback = remove function + TASK-03 call
- **Validation contract (TC-XX):**
  - TC-01: `fetchPrimeGuestNames(['booking-abc'])` with mocked bookings response returning `leadGuest: true` for occupant `occ-1` and guestsDetails returning `{firstName: 'Ana', lastName: 'Perez'}` for `occ-1` → Map has entry `'booking-abc' → {firstName: 'Ana', lastName: 'Perez'}`
  - TC-02: `fetchPrimeGuestNames([''])` → Firebase not called; empty Map returned
  - TC-03: `fetchPrimeGuestNames(['activity'])` → Firebase not called; empty Map returned
  - TC-04: `fetchPrimeGuestNames(['booking-abc'])` with both Firebase legs throwing → `console.error` called with bookingRef + error; empty Map returned (no throw)
  - TC-05: `fetchPrimeGuestNames(['booking-abc', 'booking-def'])` with only `booking-def` Firebase legs throwing → Map contains `'booking-abc'` entry; `booking-def` absent; `console.error` called for `booking-def`
  - TC-06: Bookings response has no occupant with `leadGuest: true`; guestsDetails has occupant `occ-x` with `firstName: 'Bob'` → falls back to first-named occupant `'Bob'`
  - TC-07: `fetchPrimeGuestNames(['booking-abc', 'booking-abc'])` (duplicate inputs) → deduplicated; Firebase called once per ref, not twice
  - TC-08: Concurrency cap: 12 unique refs → first batch of 10 fires, waits for allSettled, then remaining 2 fire
- **Execution plan:**
  - Red: add stub `export async function fetchPrimeGuestNames(...)` with empty implementation → TC-01 through TC-08 fail
  - Green: implement sentinel filter, deduplication, batched `Promise.allSettled`, dual-fetch per ref, occupant resolution logic, log calls → all TCs pass
  - Refactor: review naming and logging consistency with `buildGuestEmailMap` style
- **Planning validation (M-effort):**
  - Checks run: confirmed `FirebaseOccupantBooking` type at `guest-matcher.server.ts:51` has `leadGuest?: boolean`; confirmed `FirebaseOccupantDetails` type at line 58 has `firstName?: string`, `lastName?: string`
  - Validation artifacts: `packages/lib/src/hospitality/index.ts:63,71` for path builders; `guest-matcher.server.ts:130-148` for established `Promise.all` / `fetchFirebaseJson` pattern
  - Unexpected findings: `joinFirebasePath` strips empty and falsy segments (line 28 — `filter(Boolean)`), so `joinFirebasePath('guestsDetails', '')` → `'guestsDetails'`. Guard must happen before calling `guestDetailsBookingPath`, not inside it.
- **Scouts:**
  - Scout: Does `FirebaseOccupantBooking` need a new type or can existing type be reused? — Existing type at `guest-matcher.server.ts:51` has `leadGuest?: boolean`; reuse confirmed.
  - Scout: Are occupant keys ever non-string (numeric)? — `Object.entries` returns string keys regardless; safe.
- **Edge Cases & Hardening:**
  - Occupant key `__` prefix: skip as in `buildGuestEmailMap` (line 164: `if (occupantId.startsWith("__")) continue`)
  - `bookingRefs` array is empty → return empty Map immediately (no loop)
  - Firebase returns `null` (booking has no occupants) → handle null-check on response before iterating
  - All occupants in `guestsDetails` for a ref have no `firstName` → entry absent from map (null names); no error
- **What would make this >=90%:**
  - Confirmed integration test verifying the exact URL routing in `global.fetch` mock (TASK-07 provides this)
- **Rollout / rollback:**
  - Rollout: Deployed with TASK-03; no DB migration; no feature flag.
  - Rollback: Remove `fetchPrimeGuestNames` function and the TASK-03 call site in `listPrimeInboxThreadSummaries`.
- **Documentation impact:** None — internal server utility; JSDoc comment in implementation.
- **Notes / references:**
  - Consumer tracing: `fetchPrimeGuestNames` return value is consumed exclusively by TASK-03's `listPrimeInboxThreadSummaries()` augmentation. No other consumer exists. Dead-end risk is covered by TASK-03 being explicitly sequenced.

---

### TASK-03: Augment `listPrimeInboxThreadSummaries()` to call `fetchPrimeGuestNames` and patch names

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/lib/inbox/prime-review.server.ts` — augmented `listPrimeInboxThreadSummaries()` function body
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/prime-review.server.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — function body is short and pattern is clear; the key risk is the mapping step that extracts unique non-sentinel bookingRefs from already-mapped `InboxThreadSummaryApiModel[]` (using `guestBookingRef` field which may be `''` for broadcasts). Held-back test: `guestBookingRef` for broadcast threads is `''` (not null), so filter must check for both `null` and `''` to skip sentinels — confirmed from mapper line 346.
  - Approach: 90% — approach confirmed in analysis; call placement after `summaries.map(mapPrimeSummaryToInboxThread)` is unambiguous
  - Impact: 85% — this is the actual delivery step; existing API contract tests (TASK-06 confirmed) mock `prime-review.server` entirely so they are unaffected by this change; real guest-name coverage provided by TASK-05 and TASK-07
- **Acceptance:**
  - After `summaries.map(mapPrimeSummaryToInboxThread)` inside `listPrimeInboxThreadSummaries()`, unique non-sentinel `guestBookingRef` values are extracted (filter: truthy and not `'activity'`)
  - `fetchPrimeGuestNames(uniqueRefs)` is awaited
  - For each returned thread with a matching bookingRef in the map, `guestFirstName` and `guestLastName` are patched from the map entry
  - Broadcast threads (`guestBookingRef: ''`) and activity threads (`guestBookingRef: null`) remain name-free
  - Firebase failure → names stay null; function does not throw
  - Existing `prime-review-mapper.test.ts` regression tests still pass (mapper not changed)
- **Engineering Coverage:**
  - UI / visual: N/A — server-side function change
  - UX / states: Required — fail-open: `fetchPrimeGuestNames` catches internally → summaries returned with null names is correct degraded behavior; tested in TASK-07
  - Security / privacy: N/A — no new data exposure change; same server-only path
  - Logging / observability / audit: N/A — logging done inside `fetchPrimeGuestNames` (TASK-02)
  - Testing / validation: Required — TASK-07 covers the augmented function; TASK-06 updates API contract tests
  - Data / contracts: Required — `guestFirstName`/`guestLastName` on returned models change from always-null to sometimes-populated; downstream API contract tests must be updated (TASK-06)
  - Performance / reliability: Required — `fetchPrimeGuestNames` is awaited; adds Firebase round-trips to inbox list time; bounded by concurrency cap in TASK-02
  - Rollout / rollback: Required — this is the integration point; rollback = remove the 3 lines added (extract refs, call helper, patch results)
- **Validation contract:**
  - TC-01: `listPrimeInboxThreadSummaries()` with mocked Prime API returning one `prime_direct` thread + mocked Firebase returning guest name → returned thread has `guestFirstName: 'Ana'`
  - TC-02: `listPrimeInboxThreadSummaries()` with mocked Prime API returning one `prime_broadcast` thread (`bookingId: ''`) → Firebase not called for that thread; returned thread has `guestFirstName: null`
  - TC-03: `listPrimeInboxThreadSummaries()` with Firebase failing → returned thread has `guestFirstName: null`; no throw
  - TC-04: Existing `prime-review-mapper.test.ts` TC-01 and TC-04 still pass unchanged
- **Execution plan:**
  - Green: After `summaries.map(...)` line in `listPrimeInboxThreadSummaries()`, add: (1) extract unique non-sentinel `guestBookingRef` values; (2) call `fetchPrimeGuestNames(uniqueRefs)`; (3) patch `guestFirstName`/`guestLastName` into each matched thread. Wrap augmentation in try-catch to preserve fail-open guarantee.
- **Planning validation:**
  - Current function body (`prime-review.server.ts:404-420`): `summaries.map(mapPrimeSummaryToInboxThread)` is the only return-path expression. Augmentation inserts between the map call and the return.
- **Scouts:** None — exact insertion point confirmed from source read.
- **Edge Cases & Hardening:**
  - `guestBookingRef: ''` for broadcasts must be skipped (falsy check covers this)
  - `guestBookingRef: null` for activity threads must be skipped (nullish check)
  - `guestBookingRef: 'activity'` — actually `mapPrimeSummaryToInboxThread` returns `null` for `prime_activity` channel; but if a `prime_direct` thread were to have a literal `'activity'` bookingId, filter catches it
  - Empty thread list → `uniqueRefs` is empty → `fetchPrimeGuestNames([])` returns empty Map; no Firebase calls
- **What would make this >=90%:**
  - TASK-06 and TASK-07 complete and passing (confirms downstream consumers updated correctly)
- **Rollout / rollback:**
  - Rollout: Deployed atomically with TASK-02; no separate migration.
  - Rollback: Remove the 3-line augmentation block added to `listPrimeInboxThreadSummaries`.
- **Documentation impact:** None — internal function; behavior change is apparent from code.
- **Notes / references:**
  - Consumer tracing for modified function: `listPrimeInboxThreadSummaries()` is called at `apps/reception/src/app/api/mcp/inbox/route.ts:48`; that caller already swallows errors with `.catch()`. The augmentation adds no new throw surface (fail-open).

---

### TASK-04: Add TODO comments in de-scoped detail/mutation paths

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/lib/inbox/prime-review.server.ts` — TODO comments in `getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/prime-review.server.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — comment insertion only
  - Approach: 95% — comment pattern established
  - Impact: 95% — no runtime change; documents future work
- **Acceptance:**
  - A `// TODO: guest-name augmentation not yet implemented for detail/mutation paths — see reception-prime-guest-name-lookup follow-on` comment added near the `mapPrimeSummaryToInboxThread(detail.thread)` call at `getPrimeInboxThreadDetail` (line ~436) and near equivalent calls in `resolvePrimeInboxThread` (~line 541) and `dismissPrimeInboxThread` (~line 562)
- **Engineering Coverage:**
  - UI / visual: N/A — comment only
  - UX / states: N/A — no behavior change
  - Security / privacy: N/A — no behavior change
  - Logging / observability / audit: N/A — no behavior change
  - Testing / validation: N/A — no new test surface
  - Data / contracts: N/A — no contract change
  - Performance / reliability: N/A — no behavior change
  - Rollout / rollback: N/A — comment only
- **Validation contract:**
  - TC-01: Three TODO comments present in `prime-review.server.ts` at the specified locations → confirmed by code review
- **Execution plan:** Insert one-line comments at each de-scoped call site.
- **Planning validation:** Confirmed call sites at lines 436, ~541, ~562 from source read (lines 434-436, 502+, 523+ in prior read context).
- **Scouts:** None.
- **Edge Cases & Hardening:** None — comment only.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** N/A — comment only.
- **Documentation impact:** None.
- **Notes / references:** None.

---

### TASK-05: Unit tests for `fetchPrimeGuestNames`

- **Type:** IMPLEMENT
- **Deliverable:** New or modified test file: `apps/reception/src/lib/inbox/__tests__/prime-guest-names.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/__tests__/prime-guest-names.test.ts` (new file)
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — test pattern is established in `guest-matcher.server.test.ts` and `prime-review-mapper.test.ts`; dual-endpoint mock is required and moderately complex; held-back test: mock URL routing must correctly distinguish Firebase bookings path from guestsDetails path — if it doesn't, TC-01 may pass for the wrong reason
  - Approach: 90% — using `jest.fn().mockImplementation((url) => ...)` for `global.fetch` to route by URL prefix is the correct pattern
  - Impact: 85% — tests gate future correctness; if mock is wrong, tests give false confidence
- **Acceptance:**
  - Test file created at `apps/reception/src/lib/inbox/__tests__/prime-guest-names.test.ts`
  - All 8 TC cases from TASK-02 validation contract are covered
  - `global.fetch` mock routes by URL: Firebase `bookings/` path → bookings response; Firebase `guestsDetails/` path → details response
  - Tests pass in CI
  - Existing `prime-review-mapper.test.ts` tests unaffected
- **Engineering Coverage:**
  - UI / visual: N/A — test file
  - UX / states: Required — TC-04 (full Firebase failure), TC-05 (partial failure) verify fail-open
  - Security / privacy: N/A — test file; no production data
  - Logging / observability / audit: Required — TC-04 verifies `console.error` called on Firebase failure
  - Testing / validation: Required — primary deliverable of this task
  - Data / contracts: Required — TC-01 verifies return type `Map<string, {firstName, lastName}>` shape
  - Performance / reliability: Required — TC-07 verifies deduplication; TC-08 verifies concurrency cap
  - Rollout / rollback: N/A — test file
- **Validation contract:**
  - TC-01 through TC-08 as defined in TASK-02 validation contract — each must have a corresponding `it()` block in the test file
- **Execution plan:**
  - Red: create test file with `it.todo()` stubs → all marked todo
  - Green: implement each test with URL-routed `global.fetch` mock → all pass
  - Refactor: extract shared mock factory function to reduce duplication
- **Planning validation (M-effort):**
  - Confirmed: `jest.mock("server-only", () => ({}))` is required preamble (established in `prime-review-mapper.test.ts:13`)
  - Confirmed: `fetchPrimeGuestNames` must be imported directly from `../guest-matcher.server` (not via `listPrimeInboxThreadSummaries` — it's directly exported per TASK-02 acceptance)
  - Confirmed: `global.fetch = jest.fn().mockImplementation((url: string) => ...)` is the correct mock pattern for URL-routing
- **Scouts:** None — test seam is confirmed from `prime-review-mapper.test.ts` inspection.
- **Edge Cases & Hardening:**
  - Mock must correctly distinguish `FIREBASE_BASE_URL/bookings/booking-abc.json?auth=...` from `FIREBASE_BASE_URL/guestsDetails/booking-abc.json?auth=...` — URL prefix check on the path segment is sufficient
  - `FIREBASE_BASE_URL` and `FIREBASE_DB_SECRET` env vars must be set in `beforeEach` (pattern from `prime-review-mapper.test.ts:44-48`)
- **What would make this >=90%:**
  - TC-08 concurrency-cap test verified by counting `global.fetch` call timing rather than just call count
- **Rollout / rollback:**
  - Rollout: Included in CI test run.
  - Rollback: Delete test file.
- **Documentation impact:** None.
- **Notes / references:**
  - Model test file: `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts`

---

### TASK-06: Audit API contract test locations that hard-code `guestFirstName: null` for Prime threads

- **Type:** IMPLEMENT
- **Deliverable:** Audited and potentially commented test files — no functional test changes expected in most cases
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:**
  - `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` (lines 239, 363, 401, 457, 641, 699)
  - `apps/reception/src/app/api/mcp/__tests__/inbox-draft.route.test.ts` (line 186) — uses `getPrimeInboxThreadDetail` mock (de-scoped path)
  - `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` (lines 659, 828) — uses `getPrimeInboxThreadDetail` / `resolvePrimeInboxThread` mocks (de-scoped paths)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — all 9 locations are in **mocked return values** (confirmed: all three files use `jest.mock("@/lib/inbox/prime-review.server", () => {...})` to fully replace the module; `prime-review.server` is never called at runtime in these tests). `guestFirstName: null` in mocked payloads is a valid stub value — it does not represent a test failure or regression, only a stub payload used by the route test that is not focused on guest name lookup.
  - Approach: 90% — approach: (a) `inbox-draft.route.test.ts` and `inbox-actions.route.test.ts` use de-scoped detail/mutation path mocks — leave unchanged (the stubs accurately reflect de-scoped behavior); (b) `inbox.route.test.ts` uses `listPrimeInboxThreadSummaries` mocked return value — leave unchanged as a valid stub; add an inline comment clarifying the mock contract
  - Impact: 85% — existing tests are not broken by TASK-03 because `prime-review.server` is fully mocked in these files; no test will fail when the real function is augmented
- **Acceptance:**
  - Audit confirms all 9 locations use fully-mocked `prime-review.server` (no real Firebase calls possible in these tests)
  - No assertion value changes required — mock stubs with `guestFirstName: null` accurately reflect "caller provides a mock payload; real lookup not exercised in this test"
  - CI passes unchanged after TASK-03 lands — mock isolation confirmed
  - Optional: add inline comment at any location where the intent might be ambiguous during code review
- **Engineering Coverage:**
  - UI / visual: N/A — audit and comment task only
  - UX / states: N/A — no test behavior change
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — confirms existing API contract tests remain valid after TASK-03 lands; mock isolation confirmed
  - Data / contracts: Required — confirms that `guestFirstName: null` in mock return values is intentional stub behavior, not a gap
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — comment-only changes
- **Validation contract:**
  - TC-01: All three test files pass CI after TASK-03 (no assertion changes made — mock isolation confirmed). Clarifying comments optionally added; no test behavior changed.
- **Execution plan:**
  - Confirm mock isolation for all 3 files during build; add clarifying comments at 9 locations; no assertion changes
- **Planning validation:**
  - Confirmed: `inbox.route.test.ts:29` — `jest.mock("@/lib/inbox/prime-review.server", ...)` with `listPrimeInboxThreadSummaries: jest.fn()` — fully mocked
  - Confirmed: `inbox-draft.route.test.ts:29` — same mock pattern, `getPrimeInboxThreadDetail: jest.fn()` — de-scoped path, fully mocked
  - Confirmed: `inbox-actions.route.test.ts:47` — same mock pattern — de-scoped path, fully mocked
  - Mock isolation means TASK-03 does NOT break these tests — the real `listPrimeInboxThreadSummaries` is never invoked
- **Scouts:** None — mock pattern confirmed from source inspection.
- **Edge Cases & Hardening:** None — comment-only task; no functional test change.
- **What would make this >=90%:** Already at 85%; inline comments are sufficient.
- **Rollout / rollback:**
  - Rollout: Included in any commit wave.
  - Rollback: Remove comments (trivial).
- **Documentation impact:** None.
- **Notes / references:**
  - The 9 `guestFirstName: null` occurrences are stubs in mocked module return values, not assertions on live code. They remain valid after TASK-03 because the route tests never call the real `listPrimeInboxThreadSummaries`.
  - Detail/mutation paths (`inbox-draft.route.test.ts`, `inbox-actions.route.test.ts`) are de-scoped to a follow-on plan — their stubs should remain null per the de-scoped behavior.

---

### TASK-07: Integration tests for augmented `listPrimeInboxThreadSummaries()`

- **Type:** IMPLEMENT
- **Deliverable:** New tests added to `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` or a companion file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — pattern confirmed from `prime-review-mapper.test.ts`; the critical complexity is URL-routing the `global.fetch` mock to deliver different responses for the Prime API URL vs Firebase bookings URL vs Firebase guestsDetails URL — three different response shapes in one mock; held-back test: if URL-routing logic in mock is wrong (e.g. URL matching is too broad), tests may pass but verify nothing
  - Approach: 85% — `jest.fn().mockImplementation((url: string) => ...)` with URL prefix matching is the correct approach
  - Impact: 80% — these tests are the primary regression guard for the augmented function
- **Acceptance:**
  - New `describe("TC-08: guest name augmentation via fetchPrimeGuestNames")` block added to `prime-review-mapper.test.ts`
  - TC-08a: `listPrimeInboxThreadSummaries()` with `prime_direct` thread + Firebase mocks returning lead guest name → `guestFirstName` populated on returned thread
  - TC-08b: `listPrimeInboxThreadSummaries()` with `prime_broadcast` thread (`bookingId: ''`) → Firebase not called; `guestFirstName: null`
  - TC-08c: `listPrimeInboxThreadSummaries()` with Firebase failing → `guestFirstName: null`; no throw
  - TC-08d: `listPrimeInboxThreadSummaries()` with `prime_activity` thread → `guestFirstName: null`; Firebase not called
  - `global.fetch` mock distinguishes Prime API URL (returns thread list) from Firebase bookings URL (returns occupants) from Firebase guestsDetails URL (returns details) by inspecting the URL string
  - Existing TC-01 and TC-04 tests in `prime-review-mapper.test.ts` still pass
- **Engineering Coverage:**
  - UI / visual: N/A — test file
  - UX / states: Required — TC-08c verifies fail-open behavior end-to-end through `listPrimeInboxThreadSummaries`
  - Security / privacy: N/A — test file
  - Logging / observability / audit: N/A — test file
  - Testing / validation: Required — primary deliverable; end-to-end regression guard for augmented function
  - Data / contracts: Required — TC-08a confirms `guestFirstName` populated on `InboxThreadSummaryApiModel` from `listPrimeInboxThreadSummaries`
  - Performance / reliability: N/A — test scope
  - Rollout / rollback: N/A — test file
- **Validation contract:**
  - TC-08a through TC-08d as stated in Acceptance
  - URL-routing verification: mock implementation is explicit about which URL triggers which response (not a wildcard match)
- **Execution plan:**
  - Green: add describe block with 4 `it()` cases; implement URL-routing `global.fetch` mock; run in CI
  - Refactor: extract mock factory if too verbose
- **Planning validation (M-effort):**
  - Firebase URL pattern: `FIREBASE_BASE_URL/bookings/booking-xyz.json?auth=TOKEN` vs `FIREBASE_BASE_URL/guestsDetails/booking-xyz.json?auth=TOKEN` — both contain `FIREBASE_BASE_URL` prefix; distinguish by path segment (`/bookings/` vs `/guestsDetails/`)
  - Prime API URL: `RECEPTION_PRIME_API_BASE_URL/api/review-threads?limit=50` — clearly distinct from Firebase URL
- **Scouts:** None — URL patterns confirmed from `firebase-rtdb.server.ts` and existing mapper test.
- **Edge Cases & Hardening:**
  - Mock must handle that `fetchFirebaseJson` adds `.json?auth=TOKEN` suffix — URL check should look for path segment presence, not exact match
  - `FIREBASE_BASE_URL`, `FIREBASE_DB_SECRET`, `RECEPTION_PRIME_API_BASE_URL`, `RECEPTION_PRIME_ACCESS_TOKEN` env vars must be set in `beforeEach`
- **What would make this >=90%:**
  - TC-08 mock uses URL assertion (`expect(url).toContain('/bookings/')`) to prove correct routing, not just response delivery
- **Rollout / rollback:**
  - Rollout: CI.
  - Rollback: Remove the TC-08 describe block.
- **Documentation impact:** None.
- **Notes / references:**
  - Model: `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts`

---

## Risks & Mitigations

- **Dual-endpoint `global.fetch` mock incorrect:** Medium likelihood, medium impact. Mitigation: TASK-07 acceptance requires explicit URL-routing in mock; reviewer must verify mock routing is correct and not a wildcard.
- **API contract test blast radius (9 locations):** Low risk — confirmed all 9 are in fully-mocked `prime-review.server` contexts; TASK-03 does not affect them. Mitigation: TASK-06 audits and confirms mock isolation; CI passes without changes.
- **Firebase latency at inbox load:** Low likelihood. Mitigation: `Promise.allSettled`, concurrency cap 10, parallel per-ref dual-fetch keeps latency bounded. Firebase errors logged via `console.error`; no success-path request logs.
- **Lead-guest fallback wrong occupant:** Low likelihood. Mitigation: TC-06 in TASK-05 tests fallback; `__`-prefixed keys skipped per existing `buildGuestEmailMap` pattern.

## Observability

- Logging:
  - `[prime-guest-names] Firebase error for bookingRef: ${ref} — ${sanitizedErrorMessage}` per rejected `allSettled` entry at `console.error` level; error sanitized as `err instanceof Error ? err.message : String(err)` — matching `buildGuestEmailMap` error-only logging posture
  - No success-path request logs (consistent with `buildGuestEmailMap` which also logs only failures via `console.error`)
- Metrics: None — matches existing `guest-matcher` / `buildGuestEmailMap` observability posture
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `prime_direct` inbox threads display `guestFirstName` and `guestLastName` in the reception inbox list view
- [ ] `prime_broadcast` threads remain name-free (`guestFirstName: null`)
- [ ] `prime_activity` threads remain name-free (`guestFirstName: null`)
- [ ] Firebase unavailability → inbox list loads normally with null names; no throw
- [ ] All 9 API contract test locations audited; mock isolation confirmed; clarifying comments added where helpful; CI passes unchanged (tests already pass — stubs are accurate)
- [ ] Unit tests for `fetchPrimeGuestNames` pass in CI
- [ ] Integration tests for `listPrimeInboxThreadSummaries()` pass in CI
- [ ] `mapPrimeSummaryToInboxThread` is NOT modified
- [ ] `buildGuestEmailMap` and email thread path unchanged
- [ ] TODO comments present in de-scoped detail/mutation paths

## Decision Log

- 2026-03-14: Option B (parallel per-bookingRef dual-fetch) chosen over Option A (root fetch) on payload-growth grounds — analysis.md
- 2026-03-14: `mapPrimeSummaryToInboxThread` NOT changed — widening blast radius to de-scoped detail/resolve/dismiss paths prohibited — analysis.md
- 2026-03-14: Lead-guest strategy: dual-fetch (`bookings/` + `guestsDetails/`) required; `guestsDetails` has no `leadGuest` flag — analysis critique round 2
- 2026-03-14: TASK-06 approach (b): keep `guestFirstName: null` in existing route-level tests with comment rather than adding Firebase mock infrastructure — plan reasoning, Phase 4.5

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add path imports | Yes — `bookingRootPath` and `guestDetailsBookingPath` confirmed exported from `@acme/lib/hospitality` | None | No |
| TASK-02: Implement `fetchPrimeGuestNames` | Yes — TASK-01 provides imports; `FirebaseOccupantBooking` / `FirebaseOccupantDetails` types available; `fetchFirebaseJson` imported | [Advisory] `joinFirebasePath` strips empty segments internally — guard must precede path builder call, not rely on it silently no-oping. Documented in planning validation. | No — documented in execution plan |
| TASK-03: Augment `listPrimeInboxThreadSummaries()` | Yes — TASK-02 `fetchPrimeGuestNames` exported and available | [Advisory] `guestBookingRef: ''` for broadcast threads is falsy but not null — filter must use truthiness check (not `!== null` check) to catch empty string | No — documented in edge cases |
| TASK-04: Add TODO comments | Yes — no dependencies | None | No |
| TASK-05: Unit tests for `fetchPrimeGuestNames` | Yes — TASK-02 complete; test seam pattern confirmed | [Advisory] TC-08 concurrency cap test requires careful mock timing; simplification possible by testing call count in batches rather than true concurrency | No — acknowledged |
| TASK-06: Update API contract test locations | Yes — independent; 9 locations confirmed | [Advisory] Some test contexts may need inspection to confirm Firebase not mocked before applying approach (b); stated in scouts | No — handled in build via per-test inspection |
| TASK-07: Integration tests for augmented list function | Yes — TASK-03 complete; URL-routing mock pattern documented | [Advisory] Three-way URL routing in mock (Prime API + bookings + guestsDetails) is moderately complex; mock must not use wildcard match | No — acceptance criteria require explicit URL routing |

## Overall-confidence Calculation

Task weights:
- TASK-01: S=1, confidence 95% → 95
- TASK-02: M=2, confidence 85% → 170
- TASK-03: S=1, confidence 85% → 85
- TASK-04: S=1, confidence 95% → 95
- TASK-05: M=2, confidence 85% → 170
- TASK-06: S=1, confidence 85% → 85
- TASK-07: M=2, confidence 80% → 160

Sum of (confidence × weight) = 95 + 170 + 85 + 95 + 170 + 85 + 160 = 860
Sum of weights = 1 + 2 + 1 + 1 + 2 + 1 + 2 = 10
Overall-confidence = 860 / 10 = 86% → 85% (rounded to multiple of 5)
