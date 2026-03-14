---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-guest-name-lookup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-prime-guest-name-lookup/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314200000-0002
Trigger-Why: Prime messaging threads always show null guest names in the inbox, even though bookingId is present on every PrimeReviewThreadSummary. Email threads display guest names after Firebase lookup at sync time. The gap makes Prime threads harder to triage.
Trigger-Intended-Outcome: type: operational | statement: Prime inbox threads display guest first and last names (looked up from Firebase guestsDetails at list time) with the same fidelity and graceful degradation as email threads | source: auto
---

# Reception Prime Guest Name Lookup Fact-Find Brief

## Scope
### Summary
The reception inbox shows guest names for email threads by matching sender email to active Firebase bookings at sync time (`sync.server.ts` / `buildGuestEmailMap`). For Prime messaging threads, `mapPrimeSummaryToInboxThread()` always sets `guestFirstName: null` and `guestLastName: null` even though `PrimeReviewThreadSummary.bookingId` is always populated and equals the Firebase `bookingRef`. This fact-find investigates the Firebase data shape, the bookingId→bookingRef relationship, the occupantId resolution challenge, integration point options, and efficiency constraints for the list-time bulk fetch.

### Goals
- Confirm the Firebase `guestsDetails/{bookingRef}/{occupantId}` field schema
- Confirm bookingId from Prime equals bookingRef in Firebase
- Determine whether occupantId is needed and how to derive it (or work around it) from bookingRef alone
- Assess bulk-fetch efficiency for up to 50 Prime threads at list time
- Identify the correct integration point (augment `mapPrimeSummaryToInboxThread` vs higher layer)
- Document the `prime_activity` sentinel guard requirement

### Non-goals
- Changing how email thread guest lookup works
- Modifying Prime app-side data structures
- Real-time subscriptions or websocket patterns
- Per-message sender matching for Prime (out of scope — bookingId is already thread-level)
- Guest name population in detail/mutation paths (`getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`) — de-scoped to a follow-on plan

### Constraints & Assumptions
- Constraints:
  - Firebase RTDB REST access is available server-side via `fetchFirebaseJson` (env: `FIREBASE_BASE_URL`, `FIREBASE_DB_SECRET`)
  - List route `/api/mcp/inbox` fetches up to 50 Prime threads; each Firebase fetch adds latency
  - `prime_activity` threads use sentinel bookingId `'activity'` — must be guarded against
  - `prime_broadcast` whole-hostel broadcast threads use `bookingId: ''` (empty string) — must also be guarded against (confirmed: `apps/prime/functions/api/staff-broadcast-send.ts:107`)
  - `mapPrimeSummaryToInboxThread` is a synchronous pure function; making it async would require API plumbing changes
  - Guest name lookup is booking-level context (lead guest or first named occupant), not email-matched individual — weaker than email thread matching
- Assumptions:
  - When `bookingId` is non-empty and not `'activity'`, it equals a valid Firebase `bookingRef` — this is the case for `prime_direct` threads (guest-specific) but not for broadcasts
  - The `guestsDetails/{bookingRef}` node contains at least one occupant with `firstName`/`lastName`; the lead guest is the most useful name to surface
  - Firebase lookup at list time (not per-request) is acceptable given the existing pattern in `buildGuestEmailMap`

## Outcome Contract

- **Why:** Prime inbox threads have no guest names, making triage slower for staff. Email threads already resolve names. Closing this gap makes the Prime inbox parity-complete for the most operator-visible field.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime direct (`prime_direct`) inbox threads display a booking-level guest name (lead guest or first named occupant from `guestsDetails/{bookingRef}`) in the inbox list view; broadcast and activity threads remain name-free; Firebase unavailability degrades gracefully to null names with no throw
- **Source:** auto

## Current Process Map

- Trigger: Operator loads reception inbox (`GET /api/mcp/inbox`) or opens Prime thread detail
- End condition: Inbox list returns with `guestFirstName` / `guestLastName` populated for Prime threads that have a non-sentinel bookingId

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Email thread guest lookup | (1) Gmail sync triggers `processThread`; (2) `buildGuestEmailMap()` fetches `bookings/` + `guestsDetails/` from Firebase in parallel; (3) `matchSenderToGuest(map, senderEmail)` finds match; (4) guest fields written to D1 thread row and returned via `buildThreadSummaryFromRow` | `sync.server.ts`, `guest-matcher.server.ts`, `api-models.server.ts` | `sync.server.ts:930`, `guest-matcher.server.ts:106` | None (working correctly) |
| Prime thread listing | (1) `GET /api/mcp/inbox` calls `listPrimeInboxThreadSummaries(status)`; (2) Prime API `/api/review-threads?limit=50` returns array of `PrimeReviewThreadSummary`; (3) each summary passed to `mapPrimeSummaryToInboxThread()`; (4) `guestFirstName: null`, `guestLastName: null` always returned | `prime-review.server.ts`, `app/api/mcp/inbox/route.ts` | `prime-review.server.ts:301-329`, `route.ts:48-61` | **Gap: guest names never populated** |
| Prime detail (single thread) | Same `mapPrimeSummaryToInboxThread` called inside `getPrimeInboxThreadDetail` — same null gap | `prime-review.server.ts:415` | `prime-review.server.ts:401-460` | Same null gap |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates
Not applicable — this is a direct-inject fact-find with a well-scoped code gap.

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/api/mcp/inbox/route.ts` — list endpoint; calls `listPrimeInboxThreadSummaries` and merges with email rows; currently passes Prime rows through without guest name augmentation
- `apps/reception/src/lib/inbox/prime-review.server.ts` — all Prime thread operations; `mapPrimeSummaryToInboxThread()` is the mapping gap

### Key Modules / Files
- `apps/reception/src/lib/inbox/prime-review.server.ts` — `mapPrimeSummaryToInboxThread()` (line 301): synchronous mapper, sets `guestFirstName: null`, `guestLastName: null`, `guestBookingRef: summary.channel === "prime_activity" ? null : summary.bookingId`
- `apps/reception/src/lib/inbox/guest-matcher.server.ts` — `buildGuestEmailMap()`: builds `email → GuestMatch` map by fetching `bookings/` and `guestsDetails/` in parallel; **not called for Prime threads**
- `packages/lib/src/hospitality/index.ts` — `HOSPITALITY_RTDB_ROOTS.guestDetails = 'guestsDetails'`; provides `guestDetailsBookingPath(bookingRef)` = `guestsDetails/{bookingRef}`
- `apps/reception/src/lib/inbox/firebase-rtdb.server.ts` — `fetchFirebaseJson(path)`: generic REST fetch; available server-side
- `apps/reception/src/lib/inbox/api-models.server.ts` — `InboxThreadSummaryApiModel` type: has `guestBookingRef`, `guestFirstName`, `guestLastName` (all `string | null`)
- `apps/reception/src/schemas/occupantDetailsSchema.ts` — `occupantDetailsSchema`: `firstName?: string`, `lastName?: string`, `email?: string` — fields are optional
- `apps/reception/src/schemas/guestsDetailsSchema.ts` — `guestsDetailsSchema = z.record(bookingOccupantDetailsSchema)` where `bookingOccupantDetailsSchema = z.record(occupantDetailsSchema)` — structure is `Record<occupantId, OccupantDetails>`
- `apps/reception/src/lib/inbox/__tests__/prime-activity-contracts.test.ts` — TC-18: confirms sentinel `bookingId = 'activity'` for `prime_activity` channel; current guard at `mapPrimeSummaryToInboxThread` line 325 already nullifies `guestBookingRef` for activity channel

### Patterns & Conventions Observed
- **Batch-before-loop pattern** - evidence: `sync.server.ts:930` — `buildGuestEmailMap()` called once per batch before iterating threads; same pattern expected for Prime list augmentation
- **Fail-open pattern** - evidence: `guest-matcher.server.ts:38-43` — `buildGuestEmailMap` returns `GuestEmailMapResult` with `map` always valid (possibly empty) and `status` for errors; never throws
- **Sentinel guard** - evidence: `prime-review.server.ts:325` — `prime_activity` channel already guarded for `guestBookingRef`; must extend to guest name lookup

### Data & Contracts
- Types/schemas/events:
  - Firebase `guestsDetails/{bookingRef}/{occupantId}`: `{ firstName?: string, lastName?: string, email?: string, citizenship?: string, ... }` — defined by `occupantDetailsSchema`
  - Firebase `bookings/{bookingRef}/{occupantId}`: `{ checkInDate?, checkOutDate?, leadGuest?: boolean, roomNumbers?: [] }` — used by `buildGuestEmailMap`
  - `GuestMatch` (from `guest-matcher.server.ts`): `{ bookingRef, occupantId, firstName, lastName, email, checkInDate, checkOutDate, roomNumbers, leadGuest }`
  - `InboxThreadSummaryApiModel.guestFirstName: string | null` — already typed; no schema change needed
- Persistence:
  - Email threads: guest data written to D1 columns (`guest_first_name`, `guest_last_name`, `guest_booking_ref`) at sync time — persisted and returned from DB
  - Prime threads: fetched live from Prime API on every request — guest augmentation must happen at fetch time, not persisted (no D1 row for Prime threads)
- API/contracts:
  - `PrimeReviewThreadSummary.bookingId: string` — always present, never null; for `prime_activity` channel the value is the string `'activity'`
  - `bookingId` in Prime === `bookingRef` in Firebase: confirmed by `primeRequestsSchema.ts` (`bookingId: z.string()`) and the `primeRequestsByGuestPath(occupantId)` / `primeRequestByIdPath(requestId)` patterns — Prime consistently uses the same booking reference format as Firebase

### Firebase guestsDetails Structure (Confirmed)

Path: `guestsDetails/{bookingRef}/{occupantId}` where:
- `bookingRef` = the Prime `bookingId` (same string — confirmed from cross-reference of `primeRequestsSchema.bookingId`, `guestsByBookingSchema.reservationCode`, and `guest-matcher.server.ts` which reads `bookings/{bookingRef}` and matches to `guestsDetails/{bookingRef}`)
- `occupantId` = any key under the booking; `leadGuest: true` field in `bookings/{bookingRef}/{occupantId}` identifies the primary guest

### Dependency & Impact Map
- Upstream dependencies:
  - `listPrimeInboxThreadSummaries` in `prime-review.server.ts` — returns `InboxThreadSummaryApiModel[]` with null guest fields
  - `GET /api/mcp/inbox/route.ts` — the list API that merges Prime and email rows
  - Firebase RTDB REST (`FIREBASE_BASE_URL`, `FIREBASE_DB_SECRET`) — already used by `buildGuestEmailMap`
- Downstream dependents:
  - `ThreadList.tsx:239` — renders `thread.guestFirstName` when non-null
  - `ThreadDetailPane.tsx:162-163` — shows guest context block when `guestBookingRef` or `guestFirstName` is truthy
  - `useInbox.ts:59-61` — client-side type mirrors `guestFirstName?`, `guestLastName?`, `guestBookingRef?`
  - Draft pipeline (`draft-pipeline.server.ts:31`) — uses `guestName` param; Prime drafts don't currently pass guest name (separate gap, out of scope)
- Likely blast radius:
  - `mapPrimeSummaryToInboxThread()` — private function; change is contained
  - `listPrimeInboxThreadSummaries()` — signature unchanged if augmentation happens before return
  - `getPrimeInboxThreadDetail()` — also calls `mapPrimeSummaryToInboxThread`; would benefit automatically
  - `resolvePrimeInboxThread()` and `dismissPrimeInboxThread()` — also call `mapPrimeSummaryToInboxThread`; low priority but consistent

### bookingId ↔ bookingRef Relationship (Partially Confirmed — Empty String Gap)

Evidence chain:
1. `primeRequestsSchema.ts:27` — `bookingId: z.string()` stored in Firebase `primeRequests/byId/{requestId}`
2. `guest-matcher.server.ts:159` — iterates `bookings/{bookingRef}/` to match guests; same refs appear in `guestDetails/{bookingRef}/`
3. `prime-review.server.ts:325` — already uses `summary.bookingId` directly as `guestBookingRef` for non-activity threads
4. **NEW (critique finding):** `apps/prime/functions/api/staff-broadcast-send.ts:107` — whole-hostel broadcast thread is upserted with `bookingId: ''` (empty string). `prime-review-api.ts:189` returns `row.booking_id` verbatim — so broadcast threads arrive at reception with `bookingId: ''`.

**Conclusion: For `prime_direct` threads, `bookingId` equals a real Firebase `bookingRef`. For `prime_broadcast` threads, `bookingId` may be an empty string. For `prime_activity` threads, it is the sentinel `'activity'`. The lookup guard must reject empty strings AND `'activity'` — not just `prime_activity` channel.**

### occupantId Derivation

**Problem:** `guestsDetails/{bookingRef}` contains multiple occupantIds. To get a specific guest's name, an occupantId is needed. But Prime threads only expose `bookingId`, not `occupantId`.

**Resolution path (two viable options):**

Option A — Fetch entire booking node, pick lead guest:
- Fetch `guestsDetails/{bookingRef}` (the booking node, all occupants)
- Cross-reference with `bookings/{bookingRef}` to find occupant with `leadGuest: true`
- Take that occupant's `firstName` + `lastName`
- Cost: 2 Firebase reads per unique bookingRef (same as `buildGuestEmailMap`)

Option B — Fetch booking node only, pick first occupant with a name:
- Fetch `guestsDetails/{bookingRef}` only
- Iterate occupants, take first with non-empty `firstName`
- Avoid needing `bookings/` at all; slightly simpler
- Risk: non-lead guest name may surface; acceptable for inbox display

Option C — Reuse `buildGuestEmailMap` result if already built:
- The inbox list API already has access to `buildGuestEmailMap` for email threads
- But email guest map is keyed by email address, not bookingRef — no direct reuse without restructuring
- A parallel `bookingRef → GuestMatch` secondary index from the same data fetch could work
- Cost: zero extra Firebase reads if email sync map is being built anyway, but inbox list for Prime doesn't build this map today

**Efficiency assessment for 50 Prime threads:**
- Naive: 50 reads for `guestsDetails/{bookingRef}` — unacceptable (N+1)
- **Preferred:** Fetch `guestsDetails/` root node once (entire tree), then do in-memory lookup by bookingRef — same pattern `buildGuestEmailMap` uses
- Risk: `guestsDetails/` root may be large if many historical bookings exist; `buildGuestEmailMap` mitigates this by filtering `bookings/` for active window first; for Prime guest names we only need name fields not check-in data, so could fetch just `guestsDetails/` root
- Alternative: Fetch only needed bookingRefs as parallel individual fetches (up to 50 but deduplicated to unique bookingIds); may be 5-10 unique bookingIds in practice — acceptable

### Activity Channel and Broadcast Sentinel Guards (Confirmed)

Two sentinel patterns must be guarded:

1. **`prime_activity` channel:** `bookingId = 'activity'` — confirmed `prime-activity-contracts.test.ts:46`. The existing `guestBookingRef` guard at line 325 already handles this. Guest name lookup must also skip.

2. **`prime_broadcast` whole-hostel threads:** `bookingId = ''` (empty string) — confirmed `apps/prime/functions/api/staff-broadcast-send.ts:107`. The Prime review API returns `row.booking_id` verbatim (`prime-review-api.ts:189`), so broadcast threads arrive at reception with `bookingId: ''`. **Critically:** `guestDetailsBookingPath("")` in `packages/lib/src/hospitality/index.ts:71` calls `joinFirebasePath('guestsDetails', '')` which collapses the empty segment and returns `guestsDetails` (the root). `fetchFirebaseJson('guestsDetails')` would then fetch the entire guestsDetails tree — a full-tree read, not a harmless no-op. This guard is therefore a correctness and performance requirement, not just defensive coding.

**Combined guard rule:** Skip Firebase lookup when `bookingId` is empty string, `'activity'`, or null/undefined. Only proceed when `bookingId` is a non-empty, non-sentinel string. The guard must run before any path construction, not after.

### Integration Point Analysis

`mapPrimeSummaryToInboxThread()` is synchronous and private. Options:

1. **Augment at list layer** (preferred for list path): In `listPrimeInboxThreadSummaries()`, after fetching and mapping summaries, do a single bulk Firebase fetch of guest names and patch the resulting `InboxThreadSummaryApiModel[]`. This keeps `mapPrimeSummaryToInboxThread` synchronous and pure; the async work is localized to the list function.

2. **Augment at detail/mutation layer** (required for detail/mutation paths): `getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, and `dismissPrimeInboxThread` each call `mapPrimeSummaryToInboxThread` with a single thread — a single Firebase fetch per call for the one bookingRef is appropriate. A shared helper covers both list and detail paths.

3. **Augment at route layer**: In `/api/mcp/inbox/route.ts`, after receiving `filteredPrimeRows`, do a Firebase fetch and patch. More invasive to the route handler; not preferred.

4. **Make `mapPrimeSummaryToInboxThread` async**: Requires changing the signature and all call sites (`listPrimeInboxThreadSummaries`, `getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`). Overly broad blast radius for marginal benefit.

**Preferred integration point: list path only (Option 1). Augment inside `listPrimeInboxThreadSummaries()` after mapping — bulk Firebase fetch, patch all summaries before returning. `mapPrimeSummaryToInboxThread` stays synchronous and pure. Detail/mutation paths (`getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`) are de-scoped from this plan; a TODO comment will document the remaining gap. This keeps the blast radius minimal and the test surface well-defined.**

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (unit)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: `validate-changes.sh` → `reusable-app.yml` Jest step

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `mapPrimeSummaryToInboxThread` sentinel guard | Unit (type contract) | `prime-activity-contracts.test.ts` | TC-18: confirms `bookingId='activity'` → null `guestBookingRef`; does NOT test guest name lookup |
| `buildGuestEmailMap` / `matchSenderToGuest` | Unit | `guest-matcher.server.test.ts` | Full coverage of email-based lookup; no Prime-specific tests |
| `listPrimeInboxThreadSummaries` | Unit | `prime-review-mapper.test.ts` | Tests mapper behavior via list function (channel, status, bookingRef guard); no guest-name augmentation assertions |
| `InboxThreadSummaryApiModel` fields | Unit | `api-models.server.test.ts` | Tests for email thread fields; no Prime-source assertion |

#### Coverage Gaps
- Untested paths:
  - `listPrimeInboxThreadSummaries()` return value with guest fields populated (existing tests only cover null baseline)
  - Firebase lookup for Prime threads — new code path, no coverage
  - Fail-open behavior when Firebase is unavailable during Prime thread listing
  - `prime_activity` sentinel guard against Firebase lookup (not just `guestBookingRef` null)
  - `prime_broadcast` empty-string `bookingId` guard — must not trigger full `guestsDetails` root fetch
- Extinct tests: None identified

#### Testability Assessment
- Easy to test:
  - The augmentation function (a new helper that maps bookingRefs → guest names) — pure transformation, easily mocked
  - Sentinel guard for `prime_activity` — simple condition test
  - Fail-open behavior — mock `fetchFirebaseJson` to throw
- Hard to test:
  - End-to-end with real Firebase — integration test; not required for CI
- Test seams needed:
  - `fetchFirebaseJson` must be mockable (already is via Jest module mock)
  - New augmentation helper should be exported for unit testing

#### Recommended Test Approach
- Unit tests for:
  - New `buildPrimeGuestNameMap(bookingRefs: string[])` helper (or equivalent)
  - Augmentation of Prime summary list with guest names
  - Sentinel guard: `prime_activity` bookingRefs (`'activity'`) excluded from Firebase lookup
  - Sentinel guard: `prime_broadcast` empty-string `bookingId` excluded from Firebase lookup — empty string must not reach `guestDetailsBookingPath` (would collapse to root fetch)
  - Fail-open: Firebase unavailable → names stay null, no throw
- Integration tests for: not required for this change
- E2E tests for: not required
- Contract tests for: `InboxThreadSummaryApiModel` guestFirstName/guestLastName populated for `prime_direct` source threads

### Recent Git History (Targeted)
- `apps/reception/src/lib/inbox/prime-review.server.ts` — `cadcf87681` deprecates old broadcast path (TASK-06); `1290cd4c02` added four Prime inbox correctness gaps; `836fa1a446` introduced guest matching for email threads (Prime gap left intentionally at that point)
- `apps/reception/src/lib/inbox/guest-matcher.server.ts` — introduced in `836fa1a446`; email-only design; not yet extended to Prime

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | `ThreadList.tsx:239` already renders `guestFirstName` conditionally; `ThreadDetailPane.tsx:162` shows guest block when name or bookingRef present; no UI changes needed | None — UI already handles populated fields | No |
| UX / states | Required | Guest names show when non-null; null shows nothing (graceful); no loading state needed (inline with list fetch) | Must confirm fail-open behavior (null name, no error) when Firebase unavailable | Yes — specify fail-open behavior |
| Security / privacy | Required | Guest PII (first/last name) already flows through email thread path; same server-only context applies | Firebase secret required (`FIREBASE_DB_SECRET`) — already in use; no new secret needed | Minimal — confirm no client-side PII leak beyond what email threads already expose |
| Logging / observability / audit | Required | `sync.server.ts:689-694` emits `guest_matched` / `guest_match_not_found` events for email threads; no equivalent for Prime | Add similar telemetry or console log for Prime guest map build status (status, count, duration) | Yes |
| Testing / validation | Required | `prime-activity-contracts.test.ts` tests sentinel guard; `guest-matcher.server.test.ts` covers email path; no tests for Prime guest name augmentation | New unit tests for augmentation helper and fail-open | Yes — required new tests |
| Data / contracts | Required | `InboxThreadSummaryApiModel.guestFirstName/guestLastName` already `string \| null`; no type change needed; `PrimeReviewThreadSummary.bookingId` is source of truth | No schema or DB migration needed (Prime threads are not persisted); Firebase data structure confirmed | Low risk — no contract changes |
| Performance / reliability | Required | `buildGuestEmailMap` fetches entire `guestsDetails/` tree — acceptable if active bookings are filtered; up to 50 Prime threads may have up to 50 unique bookingRefs | Bulk fetch strategy must avoid N+1; prefer single `guestsDetails/` root fetch | Yes — bulk strategy is an analysis decision |
| Rollout / rollback | N/A | No DB migration; no feature flag needed; change is additive (null → populated); any regression rolls back to null names — same as current state | None | No |

## External Research (If Needed)
Not investigated: no external research needed; Firebase RTDB REST API already understood from `firebase-rtdb.server.ts` usage.

## Questions
### Resolved
- Q: Does `bookingId` in Prime equal `bookingRef` in Firebase?
  - A: Yes. Confirmed by cross-reference of `primeRequestsSchema.bookingId`, `guest-matcher.server.ts` reading `bookings/{bookingRef}`, and `prime-review.server.ts:325` already using `summary.bookingId` as `guestBookingRef`.
  - Evidence: `apps/reception/src/lib/inbox/prime-review.server.ts:325`, `apps/reception/src/lib/inbox/guest-matcher.server.ts:159`

- Q: Is `occupantId` derivable from `bookingId` alone?
  - A: Not directly — `guestsDetails/{bookingRef}` has multiple occupant keys. However, occupantId is not required if we fetch the full booking node and pick the lead guest (identified via `bookings/{bookingRef}/{occupantId}.leadGuest = true`) or the first occupant with a non-empty name. For display purposes, the lead guest name is sufficient.
  - Evidence: `apps/reception/src/schemas/occupantDetailsSchema.ts`, `apps/reception/src/lib/inbox/guest-matcher.server.ts:159-196`

- Q: What is the `prime_activity` sentinel value?
  - A: The string `'activity'` — confirmed as the `bookingId` for `prime_activity` channel threads.
  - Evidence: `apps/reception/src/lib/inbox/__tests__/prime-activity-contracts.test.ts:46`

- Q: What is the right integration point?
  - A: List path only — augment inside `listPrimeInboxThreadSummaries()` after mapping, before return. Detail/mutation paths (`getPrimeInboxThreadDetail`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`) are explicitly de-scoped from this plan; a TODO comment documents the remaining gap for a follow-on. `mapPrimeSummaryToInboxThread` stays synchronous.
  - Evidence: `apps/reception/src/lib/inbox/prime-review.server.ts:383-398`

- Q: Should the bulk strategy fetch `guestsDetails/` root or parallel individual bookingRef fetches?
  - A: Two viable options: (1) single root fetch of `guestsDetails/` (one Firebase call, large payload if many historical bookings); (2) parallel individual fetches for unique non-sentinel bookingRefs (up to 50, typically 5-10 in practice). Analysis should compare these. `buildGuestEmailMap` fetches both `bookings/` and `guestsDetails/` root — same approach is proven.
  - Evidence: `apps/reception/src/lib/inbox/guest-matcher.server.ts:131-133`

### Open (Operator Input Required)
- No open questions requiring operator input. All relevant facts are determinable from the codebase and Firebase schema.

## Confidence Inputs
- Implementation: 88%
  - Evidence: Entry point is clear (`listPrimeInboxThreadSummaries`); Firebase fetch pattern is established (`buildGuestEmailMap`); type contracts already accommodate the fields; no DB migration required
  - To reach 90%: confirm that `guestsDetails/` root size is not prohibitive (not measurable without live Firebase access; advisory only)
- Approach: 85%
  - Evidence: Two approaches for bulk strategy (root fetch vs parallel individual) — both are viable; analysis will select; fail-open pattern is proven
  - To reach 90%: resolve bulk strategy choice in analysis
- Impact: 90%
  - Evidence: UI already renders names when non-null; operator directly sees guest names in thread list and detail pane; no secondary changes needed
  - Already at 90% given clear UI wiring
- Delivery-Readiness: 85%
  - Evidence: No schema changes, no DB migrations, existing Firebase helpers, existing test infrastructure; risks are low
  - To reach 90%: confirm Firebase `guestsDetails/` root payload size is not an issue (likely fine given email path already fetches it)
- Testability: 90%
  - Evidence: `fetchFirebaseJson` is mockable; new helper can be exported and unit tested; fail-open path is easily tested by throwing from mock

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Firebase `guestsDetails/` root is large (many historical bookings), causing slow inbox list responses | Low | Moderate | Use parallel per-bookingRef fetches for unique bookingRefs instead of root fetch; or apply an active-window filter as `buildGuestEmailMap` does |
| `bookingId` format mismatch (edge case: Prime stores a different format than Firebase in some edge case) | Very Low | Low | `guestBookingRef` already set from `bookingId` with no transformation at line 325; if that field works, name lookup will too |
| `guestsDetails/{bookingRef}` has no occupant with `firstName` (e.g. incomplete check-in data) | Low | Low | Fail-open: null names — already the current behavior; no regression |
| Firebase unavailable during Prime list request | Low | Moderate | Fail-open: names stay null; no throw; same behavior as current state; must be tested |
| `prime_broadcast` whole-hostel threads have `bookingId: ''` — unguarded, `guestDetailsBookingPath('')` collapses to `guestsDetails` root, triggering a full-tree Firebase read | High (confirmed) | High | Guard: reject empty string before path construction; test explicitly |

## Planning Constraints & Notes
- Must-follow patterns:
  - Fail-open: any Firebase lookup failure must leave names null, not throw
  - `buildGuestEmailMap`-style non-throwing result pattern with status field
  - Combined sentinel guard: skip Firebase lookup when `bookingId` is empty string, `'activity'`, or null — only non-empty non-sentinel bookingRefs are safe to look up
  - New helper must be exported for unit testing
- Rollout/rollback expectations:
  - Additive: null → name; rollback is simply reverting the augmentation call — no state to clean up
- Observability expectations:
  - Log Prime guest map build status/count/duration at batch level (same as `isFirstGuestMatchEvent` pattern in sync.server)

## Suggested Task Seeds (Non-binding)
- TASK-01: Add `buildPrimeGuestNameMap(bookingRefs: string[])` helper in `guest-matcher.server.ts` — filters out empty/sentinel bookingRefs (guard: skip if empty string, `'activity'`, or null), fetches `guestsDetails/{bookingRef}` for valid ones, returns `Map<bookingRef, {firstName, lastName}>`, fail-open
- TASK-02: Augment `listPrimeInboxThreadSummaries()` to call helper and patch returned summaries
- TASK-03: Add TODO comment in `getPrimeInboxThreadDetail()`, `resolvePrimeInboxThread()`, `dismissPrimeInboxThread()` noting the guest-name gap for a follow-on plan
- TASK-04: Write unit tests for helper (happy path, empty-string guard, `'activity'` sentinel guard, fail-open)

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Unit tests pass; `guestFirstName`/`guestLastName` non-null for `prime_direct` threads with valid non-empty non-sentinel bookingRefs in the list path; `prime_activity` (`bookingId='activity'`) and whole-hostel `prime_broadcast` (`bookingId=''`) threads remain null; empty-string bookingRef never triggers `guestsDetails` root fetch; Firebase unavailability degrades gracefully to null with no throw
- Post-delivery measurement plan: Operator confirms guest names visible in Prime thread list in reception inbox

## Evidence Gap Review
### Gaps Addressed
- Firebase `guestsDetails` structure confirmed via `occupantDetailsSchema` + `guestsDetailsSchema` (Zod schemas)
- `bookingId === bookingRef` confirmed by cross-referencing three independent code paths
- `prime_activity` sentinel value confirmed from existing test
- Integration point confirmed — `listPrimeInboxThreadSummaries` is the right augmentation layer
- UI consumption confirmed — `ThreadList.tsx` and `ThreadDetailPane.tsx` already wire the fields

### Confidence Adjustments
- Performance: Moderate concern raised about `guestsDetails/` root size; mitigated by showing `buildGuestEmailMap` already fetches this without issues; analysis should document both strategies
- `prime_broadcast` bookingId semantics: acknowledged as a minor unknown; fail-open removes risk

### Remaining Assumptions
- `guestsDetails/` root fetch is acceptable in size (same assumption `buildGuestEmailMap` makes; no evidence to the contrary)
- In practice, 50 Prime threads will have far fewer than 50 unique bookingRefs (guests may have multiple threads)

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Firebase data structure (`guestsDetails/{bookingRef}/{occupantId}`) | Yes | None | No |
| `bookingId === bookingRef` identity | Yes | None | No |
| `occupantId` derivation from `bookingRef` alone | Yes | None — lead guest strategy documented | No |
| `prime_activity` sentinel guard (`'activity'`) | Yes | None | No |
| `prime_broadcast` empty-string bookingId guard | Yes | None — confirmed from `staff-broadcast-send.ts:107`; guard documented | No |
| Integration point — list path | Yes | None — augmentation in `listPrimeInboxThreadSummaries` is clear | No |
| Integration point — detail/mutation paths (de-scoped) | Yes | [Scope gap in investigation] [Minor]: de-scoped to follow-on; TODO comment will mark the gap | No |
| Bulk-fetch efficiency for 50 threads | Partial | [Scope gap in investigation] [Minor]: live Firebase payload size for `guestsDetails/` root not measurable statically; advisory only | No |
| UI consumption of populated fields | Yes | None — existing UI wiring confirmed | No |
| Fail-open pattern | Yes | None — established pattern in `buildGuestEmailMap` | No |
| Test coverage gap | Yes | None — gaps documented, new tests scoped | No |
| Detail-path (single thread) coverage | Yes | None — `getPrimeInboxThreadDetail` also calls `mapPrimeSummaryToInboxThread` | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The gap is isolated to `listPrimeInboxThreadSummaries` (list path only, detail/mutation paths de-scoped); Firebase access pattern is established; no DB migrations or type changes required; UI already handles the fields. Two sentinel guards documented (empty-string broadcast and `'activity'` activity). Draft pipeline guest name integration is a separate downstream gap. Blast radius is minimal — one list function and a new helper.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-prime-guest-name-lookup`
