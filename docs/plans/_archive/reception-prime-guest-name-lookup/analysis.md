---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-guest-name-lookup
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-guest-name-lookup/fact-find.md
Related-Plan: docs/plans/reception-prime-guest-name-lookup/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Prime Guest Name Lookup — Analysis

## Decision Frame
### Summary
The reception inbox permanently returns `guestFirstName: null` / `guestLastName: null` for all Prime messaging threads. The bookingId needed to look up the guest is already present on every `PrimeReviewThreadSummary`. The decision is which Firebase fetch strategy to use for the list-time augmentation — two options differ primarily on the single vs. batch lookup surface and how they handle the confirmed empty-string broadcast sentinel risk.

### Goals
- Surface guest first and last name on `prime_direct` inbox list threads
- Guard against `bookingId: ''` (broadcast) triggering a full-tree `guestsDetails/` read
- Guard against `bookingId: 'activity'` (activity channel) triggering any Firebase call
- Fail open: Firebase unavailable → names stay null, no throw, no visible error

### Non-goals
- Augmenting detail/mutation paths (`getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`) — de-scoped to a follow-on
- Changing how email thread guest names work
- Occupant-level precision matching (booking-level lead guest is sufficient for inbox display)

### Constraints & Assumptions
- Constraints:
  - `listPrimeInboxThreadSummaries` is async; augmentation can happen after the Prime API call, before return
  - Firebase REST available via `fetchFirebaseJson` (env: `FIREBASE_BASE_URL`, `FIREBASE_DB_SECRET` — already in use)
  - `guestDetailsBookingPath('')` collapses to `guestsDetails` root — empty string must never be passed
  - `mapPrimeSummaryToInboxThread` line 346 emits `guestBookingRef: summary.bookingId` for all non-activity channels — broadcast threads emit `guestBookingRef: ''`; this is a pre-existing model contract; the analysis decision is whether to fix it here or carry it as a risk
  - `guest-matcher.server.ts` currently imports `HOSPITALITY_RTDB_ROOTS` from `@acme/lib/hospitality` but not `guestDetailsBookingPath` — must be added
  - After augmentation, `listPrimeInboxThreadSummaries()` will make two types of `global.fetch` calls: Prime API call + Firebase calls. New tests must route both mock responses correctly (not use a single generic mock)
  - `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` is the test seam model
- Assumptions:
  - For `prime_direct` threads, `bookingId` is a valid Firebase `bookingRef`
  - **Lead-guest strategy resolved (see Chosen Approach):** Dual-fetch `bookings/{bookingRef}` + `guestsDetails/{bookingRef}` per unique ref; identify `leadGuest: true` occupant from bookings, retrieve name from guestsDetails; fall back to first-named occupant when no lead-guest flag present
  - Up to 50 Prime threads at list time; unique bookingRefs deduplication expected to yield 2–10 unique refs; fan-out capped at 10 concurrent Firebase call-pairs

## Inherited Outcome Contract
- **Why:** Prime inbox threads have no guest names, making triage slower for staff. Email threads already resolve names. Closing this gap makes the Prime inbox parity-complete for the most operator-visible field.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime direct (`prime_direct`) inbox threads display a booking-level guest name (lead guest or first named occupant from `guestsDetails/{bookingRef}`) in the inbox list view; broadcast and activity threads remain name-free; Firebase unavailability degrades gracefully to null names with no throw
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-prime-guest-name-lookup/fact-find.md`
- Key findings used:
  - `bookingId === bookingRef` for `prime_direct` threads (confirmed)
  - `prime_broadcast` whole-hostel threads use `bookingId: ''` — `guestDetailsBookingPath('')` collapses to `guestsDetails` root, triggering full-tree read if unguarded
  - `prime_activity` threads use `bookingId: 'activity'`
  - `guestDetailsBookingPath(bookingRef)` from `packages/lib/src/hospitality/index.ts:71` — path builder already exists
  - `fetchFirebaseJson` available server-side; fail-open pattern established in `buildGuestEmailMap`
  - `prime-review-mapper.test.ts` — exercises `listPrimeInboxThreadSummaries()` via mocked global fetch; proven test seam

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Firebase call efficiency (N+1 avoidance) | Up to 50 threads; each extra round-trip adds latency to inbox load | High |
| Empty-string / sentinel correctness | An unguarded empty bookingRef triggers a full `guestsDetails` tree read — correctness + performance risk | Critical |
| Code simplicity / pattern consistency | New code should match established `guest-matcher` / `firebase-rtdb` patterns | Medium |
| Blast radius (scope containment) | Change should be localized to `prime-review.server.ts` and new helper | High |
| Testability | New code paths must be verifiable in Jest without network calls | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Single `guestsDetails/` root fetch | Fetch entire `guestsDetails/` root once, build in-memory `bookingRef → {firstName, lastName}` map, augment all summaries | One Firebase call regardless of thread count; mirrors `buildGuestEmailMap` pattern exactly; simplest code | Full tree read on every inbox list; payload grows as historical bookings accumulate | Historical booking accumulation may grow payload significantly over time | Yes |
| B: Parallel per-bookingRef fetches (deduplicated) | Collect unique non-sentinel bookingRefs from summaries, fire parallel `fetchFirebaseJson(guestDetailsBookingPath(ref))` calls | Only fetches needed bookingRefs; payload bounded by current active guest count | Multiple Firebase calls (up to N unique refs, typically 2-8 in practice); slightly more complex code | Marginally more code; `Promise.all` failure handling needed | Yes |
| C: Per-thread sequential fetch | Fetch `guestsDetails/{bookingRef}` for each thread serially | Simplest loop logic | N round-trips; slow inbox load | Unacceptable at 50 threads | No |
| D: Reuse `buildGuestEmailMap` result | Reuse the email-thread guest map (keyed by email) for Prime | Zero extra Firebase reads | Email map is keyed by email; Prime threads have no guest email; not reusable without restructuring | Architectural mismatch; would require restructuring `buildGuestEmailMap` | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (root fetch) | Option B (parallel per-ref) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — UI already wired | N/A — UI already wired | N/A |
| UX / states | Fail-open: error → null names, no UX change | Same fail-open; `Promise.allSettled` can handle partial failures per-ref | Option B: slightly more precise partial-fail handling; Option A: all-or-nothing |
| Security / privacy | PII in server memory only; no client exposure change | Same | No change from baseline |
| Logging / observability / audit | Log once: map build status + count + duration | Log per-batch: how many refs fetched, how many found | Option B allows finer-grained hit-rate logging |
| Testing / validation | One mock for `fetchFirebaseJson` covering entire tree response | One mock per bookingRef call; `jest.fn()` chained resolves | Option A test setup simpler; Option B tests are slightly more explicit |
| Data / contracts | No type changes; `guestDetailsBookingPath` returns root path for empty string — guard mandatory | Same guard required; path called with validated ref only | Both require the empty-string guard |
| Performance / reliability | Single large Firebase read; payload grows with historical bookings; timeout risk if tree is very large | N small reads; each bounded; easier to add timeout per-call | Option B is more resilient to payload growth |
| Rollout / rollback | Additive; no DB migration; rollback = revert augmentation call | Same | No difference |

## Chosen Approach

**Option B: Parallel per-bookingRef fetches (deduplicated).**

- **Recommendation:** Add a new exported helper `fetchPrimeGuestNames(bookingRefs: string[])` in `apps/reception/src/lib/inbox/guest-matcher.server.ts`. Per unique valid bookingRef it fires two parallel `fetchFirebaseJson` calls — `bookings/{bookingRef}` (to find `leadGuest: true` occupantId) and `guestsDetails/{bookingRef}` (to read that occupant's name) — via `Promise.allSettled`. Empty/sentinel bookingRefs are filtered before any path is constructed. Returns `Map<string, { firstName: string; lastName: string }>`. Augment `listPrimeInboxThreadSummaries()` by calling this helper after mapping and patching the results.

- **Why this wins over Option A:**
  1. **Payload bound:** In production the Prime thread list has up to 50 threads but typically 2–10 unique bookingRefs (guests thread multiple times). Option B fetches only those nodes rather than the full historical `guestsDetails/` tree. Option A's single read is cheaper in call count but grows without bound as booking history accumulates.
  2. **Empty-string guard location is unambiguous:** The guard is applied before any `guestDetailsBookingPath` or `bookingRootPath` call is made, making it structurally impossible to trigger a root-fetch.
  3. **`Promise.allSettled` partial resilience:** If one bookingRef's Firebase read fails, other refs still succeed. Option A is all-or-nothing.
  4. **Pattern fits existing codebase:** `buildGuestEmailMap` already fetches both `bookings/` and `guestsDetails/` in parallel. This helper follows the same dual-fetch approach for a bounded ref set.

- **Concurrency cap:** Fan-out is bounded: unique bookingRefs are deduplicated first; in practice 2–10 refs. Each ref triggers 2 Firebase calls (bookings + guestsDetails). A hard cap of 10 concurrent ref-pairs prevents pathological cases.

- **Lead-guest strategy (dual-fetch):** `guestsDetails/{bookingRef}/{occupantId}` does not carry a `leadGuest` flag — that flag lives in `bookings/{bookingRef}/{occupantId}.leadGuest`. Existing reception code (`usePrepaymentData.ts:252`, `useEmailProgressData.ts:195`) explicitly cross-references both paths. `fetchPrimeGuestNames` fetches both paths per unique ref, identifies the `leadGuest: true` occupantId from bookings, retrieves that occupant's name from guestsDetails. Falls back to first named occupant when no `leadGuest: true` is found.

- **`mapPrimeSummaryToInboxThread` — NOT changed:** Changing the mapper would widen blast radius to detail/resolve/dismiss paths (lines 436, 541, 562 in `prime-review.server.ts`) which are de-scoped. The broadcast `guestBookingRef: ''` pre-condition is left in place; the empty-string guard lives entirely in `fetchPrimeGuestNames` before any path construction.

- **What it depends on:**
  - `FIREBASE_BASE_URL` + `FIREBASE_DB_SECRET` set in environment (already required by email guest lookup; no new env var)
  - `guestDetailsBookingPath` from `@acme/lib/hospitality` — must be added to `guest-matcher.server.ts` imports (currently only `HOSPITALITY_RTDB_ROOTS` is imported from `@acme/lib/hospitality`)
  - `fetchFirebaseJson` from `firebase-rtdb.server.ts` (already imported in `guest-matcher.server.ts`)

### Rejected Approaches
- **Option A (root fetch):** Viable but rejected on payload-growth grounds. A single `guestsDetails/` root read grows with every historical booking. Under load (peak season) the tree could be large enough to cause timeout or slow the inbox list noticeably. Option B trades call count (2–8 vs 1) for bounded payload.
- **Option C (sequential per-thread fetch):** Rejected — N sequential round-trips at up to 50 threads is unacceptable latency.
- **Option D (reuse email guest map):** Rejected — the email map is email-keyed; Prime threads have no guest email at list time. Restructuring `buildGuestEmailMap` would widen blast radius unnecessarily.

### Open Questions (Operator Input Required)
None. All architectural decisions resolved above (lead-guest strategy, concurrency cap, broadcast bookingRef normalization).

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Prime thread list guest names | `listPrimeInboxThreadSummaries()` returns all threads with `guestFirstName: null`, `guestLastName: null` | `GET /api/mcp/inbox` request | (1) Prime API call returns `PrimeReviewThreadSummary[]`; (2) `summaries.map(mapPrimeSummaryToInboxThread)` builds base `InboxThreadSummaryApiModel[]` with null names; (3) unique non-sentinel bookingRefs extracted; (4) `fetchPrimeGuestNames(refs)` fires parallel Firebase reads; (5) names patched into summaries before return | Email thread path unchanged; `mapPrimeSummaryToInboxThread` stays synchronous; detail/mutation paths remain null (de-scoped) | Firebase unavailability must degrade gracefully — tested in build |
| Sentinel guard (`'activity'` + empty string) | `guestBookingRef` already nullified for `prime_activity`; broadcast threads emit `guestBookingRef: ''` (existing mapper pre-condition; NOT changed) | Any inbox list request including broadcast threads | `fetchPrimeGuestNames` filters empty/sentinel bookingRefs before constructing any Firebase path; `prime_activity` ('activity') and broadcast ('') bookingRefs never reach `bookingRootPath` or `guestDetailsBookingPath` | `mapPrimeSummaryToInboxThread` unchanged; broadcast `guestBookingRef: ''` unchanged; guard is internal to helper only | Empty-string guard must be tested explicitly to prevent root-fetch regression |
| UI display | `ThreadList.tsx` renders name when non-null; shows nothing when null | Name populated by new augmentation | Guest name appears in Prime direct thread list rows | All other thread list fields unchanged | No UI changes required |

## Planning Handoff
- Planning focus:
  - **TASK-01:** Add `guestDetailsBookingPath` and `bookingRootPath` (or equivalent) to imports in `guest-matcher.server.ts` (currently only `HOSPITALITY_RTDB_ROOTS` is imported from `@acme/lib/hospitality`)
  - **TASK-02:** Implement `fetchPrimeGuestNames(bookingRefs: string[])` in `guest-matcher.server.ts` — exported, fail-open via `Promise.allSettled`, deduplicates refs, guards empty/sentinel refs before path construction, caps concurrency at 10 per batch, fetches `bookings/{bookingRef}` + `guestsDetails/{bookingRef}` per unique ref (dual-fetch to identify `leadGuest: true` occupant), returns `Map<string, { firstName: string; lastName: string }>`
  - **TASK-03:** Augment `listPrimeInboxThreadSummaries()` in `prime-review.server.ts`: after mapping, collect unique non-sentinel bookingRefs (guard: skip empty string, `'activity'`, null), call `fetchPrimeGuestNames`, patch `guestFirstName`/`guestLastName` in returned summaries
  - **TASK-04:** Add TODO comments in `getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread` noting the de-scoped guest name gap
  - **TASK-05:** Unit tests for `fetchPrimeGuestNames`: happy path, empty-string guard (must not call `fetchFirebaseJson`), `'activity'` guard, Firebase failure → null names, partial failure (`Promise.allSettled` one rejects), lead-guest selection (occupant with `leadGuest: true` wins over first-named)
  - **TASK-06:** Update existing API contract tests that hard-code `guestFirstName: null` for Prime threads: `inbox.route.test.ts` (lines 238-240, 362-364, 400-402, 456-458, 640-642, 698-700), `inbox-draft.route.test.ts` (line 185), `inbox-actions.route.test.ts` (lines 658, 827) — update either to mock Firebase and assert populated names, or update fixture comments to `null` with explicit "Firebase not mocked in this test" note
  - **TASK-07:** Unit tests for augmented `listPrimeInboxThreadSummaries()`: route both `global.fetch` calls correctly — Prime API URL vs Firebase URL — to separate mock responses; `prime-review-mapper.test.ts` is the model but mock must distinguish call URLs via `jest.fn().mockImplementation((url) => ...)`
- Validation implications:
  - Tests run in CI only; `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` is the test file model (mocked `global.fetch`)
  - New tests for `listPrimeInboxThreadSummaries` must distinguish Prime API vs Firebase URL in `global.fetch` mock (e.g. `jest.fn().mockImplementation((url) => ...)`)
  - Existing `prime-review-mapper.test.ts` regression tests must still pass (mapper not changed)
  - **Existing API contract test blast radius:** `inbox.route.test.ts`, `inbox-draft.route.test.ts`, `inbox-actions.route.test.ts` hard-code `guestFirstName: null` for Prime threads — all affected lines must be updated in TASK-06
- Sequencing constraints:
  - TASK-01 (import `guestDetailsBookingPath` + `bookingRootPath`) must precede TASK-02 (helper implementation)
  - TASK-02 (helper `fetchPrimeGuestNames`) must precede TASK-03 (augmentation call in `listPrimeInboxThreadSummaries`) and TASK-05 (helper unit tests)
  - TASK-03 (augmentation) must precede TASK-07 (augmentation integration tests)
  - TASK-06 (API contract test updates) is independent; can run in parallel with TASK-02
- Risks to carry into planning:
  - Dual-endpoint `global.fetch` mock setup is moderately complex; if done wrong tests pass against wrong mock data — reviewer must verify mock URL routing explicitly
  - `Promise.allSettled` result parsing: rejected entries logged at warn level with bookingRef and error; not surfaced to caller

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Dual-endpoint `global.fetch` mock brittle or incorrect | Medium | Medium | Test design detail; determined in build | TASK-07 must specify URL-routing mock pattern; reviewer verifies mock correctness |
| Firebase latency adds to inbox list response time | Low | Low | Dual-fetch (bookings + guestsDetails per ref) doubles reads but parallel calls keep latency bounded; 2–10 refs at 2 reads each | Add console timing log at warn level; concurrency cap of 10 batches reads |
| Existing API contract tests (`inbox.route.test.ts` etc.) hard-code `guestFirstName: null` | High (confirmed) | Medium | Test blast radius now fully identified; 9 test locations across 3 files | TASK-06 must update all 9 locations; build fails until all are resolved |
| Lead-guest lookup returns wrong occupant if `leadGuest` field is absent from booking | Low | Low | `buildGuestEmailMap` handles this similarly; `leadGuest: false` as default | Fall back to first-named occupant when no `leadGuest: true` found |

## Planning Readiness
- Status: Go
- Rationale: Approach is decisive. No operator questions open. Implementation surface is minimal (one new helper, one call site augmentation, unit tests). All sentinel guards documented. No schema migrations.
