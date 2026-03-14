# Critique History: reception-prime-guest-name-lookup

---

## Fact-Find Critique

### Round 1

- **Route:** codemoot
- **Score:** 7/10 → lp_score: 3.5 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 3 / **Minor:** 0

### Findings

1. **[Major]** Empty-string broadcast guard missing: `prime_broadcast` whole-hostel threads use `bookingId: ''` (confirmed `apps/prime/functions/api/staff-broadcast-send.ts:107`). Brief incorrectly stated `bookingId` is always a real Firebase bookingRef.
2. **[Major]** Integration point incomplete: preferred integration point only covered list path; detail/mutation paths still called `mapPrimeSummaryToInboxThread` without augmentation.
3. **[Major]** Outcome contract overpromised "same fidelity as email threads" — Prime lookup is booking-level (lead guest), email is email-matched (specific occupant).

### Fixes Applied

- Added `prime_broadcast` empty-string guard to constraints, sentinel guard section, and combined guard rule
- Corrected `bookingId === bookingRef` claim to note empty-string exception for broadcast
- Updated outcome contract to describe booking-level name in list view only
- Resolved integration point: list path only (detail/mutation de-scoped)

---

### Round 2

- **Route:** codemoot
- **Score:** 8/10 → lp_score: 4.0 (credible threshold)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 3 / **Minor:** 0

### Findings

1. **[Major]** Empty-string broadcast guard rationale was wrong: `guestDetailsBookingPath('')` collapses `""` to `guestsDetails` root; attempting the lookup would fetch entire tree — far more severe than "invalid request".
2. **[Major]** Test coverage table missed broadcast sentinel case — only mentioned `prime_activity`.
3. **[Major]** Scope inconsistency: detail/mutation augmentation was in scope per text but had no test coverage specified in acceptance package.

### Fixes Applied

- Corrected empty-string guard explanation: `joinFirebasePath` collapses empty segment → full root fetch; performance + correctness risk
- Added broadcast sentinel to test coverage gaps and recommended tests
- De-scoped detail/mutation paths to non-goals + TODO comment
- Updated integration point section to list-only; updated acceptance package accordingly

---

### Round 3 (Final)

- **Route:** codemoot
- **Score:** 8/10 → lp_score: 4.0 (credible)
- **Verdict:** needs_revision (3 remaining warnings — all doc consistency)
- **Critical:** 0 / **Major (warnings):** 3 / **Minor:** 0

### Findings

1. **[Major]** Outcome contract still said "at list and detail time" — inconsistent with de-scoped detail paths.
2. **[Major]** Test coverage table incorrectly stated no tests found for `listPrimeInboxThreadSummaries()`; `prime-review-mapper.test.ts` exists.
3. **[Major]** Resolved Q&A for "right integration point" was stale.

### Fixes Applied

- Outcome contract narrowed to list view only
- Test coverage table corrected; gap reframed as guest-name augmentation coverage
- Resolved Q&A updated to list-only integration point

---

## Analysis Critique

### Round 1

- **Route:** codemoot
- **Score:** 6/10 → lp_score: 3.0 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 4 / **Minor:** 1

### Findings

1. **[Major]** Broadcast `guestBookingRef: ''` still emitted by mapper; guard only at lookup time leaves footgun open for future callers.
2. **[Major]** Testing guidance understates seam change: both Prime API and Firebase calls flow through `global.fetch`; dual-endpoint mocking must be specified.
3. **[Major]** `Promise.allSettled` fan-out has no concurrency bound; up to 50 parallel Firebase reads in worst case.
4. **[Major]** Lead-guest vs. first-named-occupant strategy unresolved — changes helper contract, Firebase query shape, latency, tests.
5. **[Minor]** `guestDetailsBookingPath` not yet imported in `guest-matcher.server.ts`; test path reference minor drift.

### Fixes Applied

- Resolved lead-guest strategy: accepted first-named-occupant initially, then corrected to dual-fetch in Round 2
- Added concurrency cap of 10 ref-pairs
- Specified dual-endpoint `global.fetch` mock requirement in planning handoff
- Documented `guestDetailsBookingPath` import as TASK-01 prerequisite
- Identified 9 existing test locations with hard-coded `guestFirstName: null` as TASK-06 blast radius

---

### Round 2

- **Route:** codemoot
- **Score:** 6/10 → lp_score: 3.0 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 3 / **Minor:** 0

### Findings

1. **[Major]** "First named occupant" strategy not supported by data contract: `guestsDetails/{bookingRef}` has no `leadGuest` flag; existing code joins `bookings/` to find lead guest.
2. **[Major]** TASK-01 (mapper normalization) widens blast radius beyond list path — mapper also used by detail/resolve/dismiss.
3. **[Major]** Validation scope incomplete: `inbox.route.test.ts`, `inbox-draft.route.test.ts`, `inbox-actions.route.test.ts` hard-code `guestFirstName: null` at 9 locations.

### Fixes Applied

- Revised to dual-fetch strategy: `bookings/{bookingRef}` + `guestsDetails/{bookingRef}` per unique ref; identifies `leadGuest: true` occupant
- Removed TASK-01 mapper normalization; empty-string guard moved entirely into helper
- Added TASK-06: update 9 existing API contract test locations
- Updated End-State Operating Model sentinel row to reflect mapper-unchanged approach

---

### Round 3 (Final)

- **Route:** codemoot
- **Score:** 6/10 → lp_score: 3.0 (partially credible)
- **Verdict:** needs_revision (3 findings — all internal consistency from prior edits)
- **Critical:** 1 / **Major (warnings):** 2 / **Minor:** 0

### Findings

1. **[Critical]** Recommendation paragraph still described `guestDetails`-only helper with first-occupant strategy; contradicted lines 116 and 142 which specified dual-fetch. Planning could implement the wrong strategy.
2. **[Major]** End-State Operating Model sentinel row reintroduced mapper normalization (contradicting decision to leave mapper unchanged).
3. **[Major]** Sequencing constraints referenced stale task numbers (`TASK-01 broadcast ref normalization`, `TASK-02 import`).

### Fixes Applied

- Rewrote recommendation paragraph to match dual-fetch strategy (bookings + guestsDetails per ref, `Promise.allSettled`)
- Removed stale first-occupant reference
- Fixed End-State sentinel row to reflect helper-only guard (mapper unchanged)
- Fixed sequencing constraints to match current task list (TASK-01 = imports, TASK-02 = helper, TASK-03 = augmentation, TASK-05 = helper tests, TASK-06 = API contract tests, TASK-07 = integration tests)

---

## Plan Critique

### Round 1

- **Route:** codemoot
- **Score:** 7/10 → lp_score: 3.5 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 3 / **Minor (info):** 1

### Findings

1. **[Major]** TASK-06 scope mixed de-scoped paths: `inbox-draft.route.test.ts` and `inbox-actions.route.test.ts` stubs are for `getPrimeInboxThreadDetail` / de-scoped detail/mutation paths — the plan treated them as list-path test locations.
2. **[Major]** Observability plan specified `console.warn` for success-path request logs; `buildGuestEmailMap` only uses `console.error` for failures (no success-path logs). The plan's posture claim was internally inconsistent.
3. **[Major]** TASK-06 approach (b) "keep null with comment if Firebase not mocked" was misleading: all 3 test files fully mock `prime-review.server` — the `guestFirstName: null` values are stubs in mocked payloads, not assertions on real code. No test will fail when TASK-03 lands; the stubs are valid as-is.
4. **[Minor]** Note that TASK-06 must land before TASK-03 to avoid CI failures was incorrect — mock isolation means these tests are unaffected by TASK-03.

### Fixes Applied

- TASK-06 reframed: narrowed scope to audit + comment only; de-scoped detail/mutation path stubs identified as intentional (leave unchanged); `inbox.route.test.ts` stubs get clarifying comments, no assertion changes
- TASK-06 effort downgraded S (was M); confidence raised to 85%
- Observability section corrected: `console.error` for Firebase errors only; no success-path logs; matches `buildGuestEmailMap` posture
- TASK-02 acceptance and Engineering Coverage logging rows updated to `console.error`
- TASK-05 engineering coverage logging row corrected to `console.error`
- Stale TASK-06 ordering note removed from planning rationale
- Overall-confidence recalculated: 85% (unchanged at 5-multiple)

### Round 2

- **Route:** codemoot
- **Score:** 7/10 → lp_score: 3.5 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 0 / **Major (warnings):** 3 / **Minor (info):** 1

### Findings

1. **[Major]** Goal at line ~45 still said "reflect the new populated state" for API contract tests; contradicted by TASK-06 now being a comment-only audit of mock stubs.
2. **[Major]** TASK-02 validation contract TC-04/TC-05 still said `console.warn`; all other references (acceptance, engineering coverage, observability) already corrected to `console.error`.
3. **[Major]** Risks section said "console timing log added" but revised observability plan has no success-path logs — internal inconsistency.
4. **[Minor]** `Overall-confidence` frontmatter header still `83%`; document calculation resolved to `85%`.

### Fixes Applied

- Goal corrected: "Audit existing API contract test stubs and confirm they remain valid (all are in fully-mocked test contexts)"
- TASK-02 TC-04/TC-05 corrected to `console.error`
- Risks section `console timing log` reference removed; replaced with "Firebase errors logged via `console.error`; no success-path request logs"
- API contract test blast-radius risk reclassified: Low (not Confirmed high) — mock isolation confirmed
- `Overall-confidence` frontmatter updated to `85%`

### Round 3 (Final)

- **Route:** codemoot
- **Score:** 8/10 → lp_score: 4.0 (credible)
- **Verdict:** needs_revision (3 remaining findings — all doc consistency from prior edits)
- **Critical:** 0 / **Major (warnings):** 2 / **Minor (info):** 1

### Findings

1. **[Major]** TASK-03 impact confidence note still said "existing API contract tests (TASK-06) must be updated or they fail" — contradicted by TASK-06 planning validation confirming mock isolation.
2. **[Major]** TASK-06 validation contract self-contradictory: TC-01 said "pass without any changes" while TC-02 and acceptance said "add clarifying comments" — conflicting expected outcomes.
3. **[Minor]** TASK-02 failure-log payload: acceptance said "log bookingRef and error" (raw object); Observability section only said "log bookingRef" — underspecified and inconsistent.

### Fixes Applied

- TASK-03 impact confidence note corrected: "existing API contract tests mock `prime-review.server` entirely; real coverage from TASK-05 and TASK-07"
- TASK-06 validation contract consolidated to TC-01 only: "passes CI unchanged; clarifying comments optional"
- TASK-06 acceptance aligned: "no assertion changes required; CI passes unchanged; optional clarifying comment where ambiguous"
- TASK-02 acceptance and Observability aligned: `console.error` with sanitized error message (`err instanceof Error ? err.message : String(err)`) — matching `buildGuestEmailMap` pattern

### Final Assessment

Score: 4.0/5.0 after 3 rounds. Remaining findings were all internal consistency issues from iterative edits (not new code problems). Deterministic validators pass. The plan is internally consistent. Setting `Status: Active` — approach is resolved, all tasks are implementation-ready.

---

### Final Assessment

Score: 3.0/5.0 after 3 rounds. Findings are internal consistency issues (not new code problems) from iterative edits. Deterministic validators pass. The approach is sound; the document is now internally consistent. Setting `Status: Ready-for-planning` — all architectural decisions are resolved with no operator questions open.
