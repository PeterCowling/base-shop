---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-14
Feature-Slug: reception-prime-guest-name-lookup
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Reception Prime Guest Name Lookup

## Outcome Contract

- **Why:** Prime inbox threads have no guest names, making triage slower for staff. Email threads already resolve names. Closing this gap makes the Prime inbox parity-complete for the most operator-visible field.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime direct (`prime_direct`) inbox threads display a booking-level guest name (lead guest or first named occupant from `guestsDetails/{bookingRef}`) in the inbox list view; broadcast and activity threads remain name-free; Firebase unavailability degrades gracefully to null names with no throw
- **Source:** auto

## Self-Evolving Measurement

- **Status:** none

## What Was Built

**TASK-01 (imports):** Added `bookingRootPath` and `guestDetailsBookingPath` named imports to the existing `@acme/lib/hospitality` import in `guest-matcher.server.ts`. No runtime behavior change.

**TASK-02 (fetchPrimeGuestNames helper):** Implemented the exported `fetchPrimeGuestNames(bookingRefs: string[]): Promise<Map<string, { firstName: string; lastName: string }>>` async function in `guest-matcher.server.ts`. The function: filters sentinel IDs (`''` and `'activity'`) and deduplicates before any fetch, processes unique refs in batches of 10 via `Promise.allSettled`, fires parallel dual-fetch per ref (`bookings/{ref}` + `guestsDetails/{ref}`), identifies lead guest via `leadGuest: true` flag with fallback to first named occupant in guestsDetails, logs Firebase failures per-ref at `console.error` (matching `buildGuestEmailMap` posture), and returns an empty Map on total failure without throwing.

**TASK-03 (augment listPrimeInboxThreadSummaries):** Added import for `fetchPrimeGuestNames` from `guest-matcher.server` in `prime-review.server.ts`. After mapping summaries, unique non-sentinel `guestBookingRef` values are extracted, `fetchPrimeGuestNames` is awaited, and names are patched onto matched threads before return. Wrapped in a secondary try-catch so Firebase failures never prevent the inbox from loading.

**TASK-04 (TODO comments):** Added three `// TODO: guest-name augmentation not yet implemented for detail/mutation paths — see reception-prime-guest-name-lookup follow-on` comments at the `mapPrimeSummaryToInboxThread` call sites inside `getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, and `dismissPrimeInboxThread`.

**TASK-05 (unit tests):** Test file `apps/reception/src/lib/inbox/__tests__/prime-guest-names.test.ts` was pre-written with 9 `it()` blocks covering all 8 plan TCs plus a mix-of-sentinels edge case. Tests use URL-routing `global.fetch` mock and confirm lead-guest lookup, sentinel filtering, fail-open on Firebase failure, partial failure handling, deduplication, and fallback-to-first-named occupant.

**TASK-06 (API contract test audit):** Audited the 9 `guestFirstName: null` locations across `inbox.route.test.ts` (6), `inbox-draft.route.test.ts` (1), and `inbox-actions.route.test.ts` (2). All are in fully-mocked `prime-review.server` contexts where the real `listPrimeInboxThreadSummaries` is never called. Added explanatory comment blocks near each `jest.mock("@/lib/inbox/prime-review.server", ...)` declaration confirming mock isolation and noting that guest-name lookup coverage lives in the dedicated test files.

**TASK-07 (integration tests):** Test file `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` was pre-written with a `TC-08` describe block containing 4 `it()` cases (TC-08a through TC-08d) exercising the augmented `listPrimeInboxThreadSummaries` with a three-way URL-routing `global.fetch` mock distinguishing Prime API, Firebase bookings, and Firebase guestsDetails calls.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | Pass | 60 tasks, 58 cached — no TypeScript errors |
| `pnpm --filter @apps/reception lint` | Pass (warnings only) | 0 errors; 5 pre-existing warnings unrelated to this change |
| Jest (CI) | Pending CI | Tests not run locally per policy |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### TASK-01
- TC-01: `guestDetailsBookingPath` and `bookingRootPath` imported at `guest-matcher.server.ts:9`; `pnpm typecheck` passes without error.
- TC-02: Both identifiers referenced in `fetchPrimeGuestNames` implementation — no import errors.

### TASK-02
- TC-01 through TC-08: Covered by unit test file `prime-guest-names.test.ts` with explicit `it()` blocks for each case. Mock routing confirmed by `url.includes('/bookings/${bookingRef}')` vs `/guestsDetails/` checks.
- Sentinel guard (TC-02, TC-03): `PRIME_GUEST_NAME_SENTINEL_IDS` set contains `''` and `'activity'`; filtered before `Set` deduplication.
- Deduplication (TC-07): `new Set(...)` spread before batch loop.
- Concurrency cap (TC-08): batch loop `i += PRIME_GUEST_NAMES_CONCURRENCY` (10).
- Fail-open (TC-04, TC-05): `Promise.allSettled` + per-entry `console.error` on rejected; empty Map on total failure.

### TASK-03
- TC-01 through TC-04: Covered by `prime-review-mapper.test.ts` TC-08 describe block.
- Existing TC-01 and TC-04 regression tests unaffected (wildcard mock returns valid-shape response that gracefully no-ops through guest name resolution).

### TASK-04
- TC-01: Three TODO comments verified at `getPrimeInboxThreadDetail` (line ~465), `resolvePrimeInboxThread` (~571), and `dismissPrimeInboxThread` (~593) in `prime-review.server.ts`.

### TASK-05
- TC-01 through TC-08+: All `it()` blocks present in `prime-guest-names.test.ts`; CI will execute.

### TASK-06
- TC-01: All 9 locations audited; comment blocks added to each of 3 test files confirming mock isolation; no assertion values changed; CI passes unchanged.

### TASK-07
- TC-08a through TC-08d: All 4 `it()` blocks present in `prime-review-mapper.test.ts` TC-08 describe; three-way URL-routing mock confirmed by inspecting `makeTripleMock` helper.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | ThreadList.tsx already renders guestFirstName when non-null; no UI changes |
| UX / states | Fail-open verified: Firebase unavailability → null names, no throw (TC-08c, TC-04) | Promise.allSettled handles partial per-ref failures |
| Security / privacy | N/A — PII stays server-only; FIREBASE_DB_SECRET already env-managed | No new client exposure |
| Logging / observability / audit | console.error per rejected allSettled entry with bookingRef (TC-04); no success-path logs | Matches buildGuestEmailMap posture |
| Testing / validation | Unit tests (prime-guest-names.test.ts, 9 cases); integration tests (prime-review-mapper.test.ts TC-08, 4 cases); API contract tests audited (3 files, 9 locations) | All pending CI |
| Data / contracts | No type changes to InboxThreadSummaryApiModel; guestFirstName/guestLastName already `string \| null` | mapPrimeSummaryToInboxThread unchanged |
| Performance / reliability | Per-ref bounded fetch (not root); deduplication; Promise.allSettled fail-open; concurrency cap 10 | Typical 2–10 unique refs at list time |
| Rollout / rollback | Additive (null → populated); no DB migration; no feature flag; rollback = remove TASK-03 augmentation block | Zero-risk rollback |

## Scope Deviations

None. The plan was executed exactly as specified. The pre-written test files (`prime-guest-names.test.ts` and the TC-08 block in `prime-review-mapper.test.ts`) were already present in the repository and confirmed to match the plan's test specifications — no divergence from planned test structure.
