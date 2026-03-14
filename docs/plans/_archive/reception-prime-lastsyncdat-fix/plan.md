---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-lastsyncdat-fix
Dispatch-ID: IDEA-DISPATCH-20260314200000-0005
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 95%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Reception Prime `lastSyncedAt` Fix Plan

## Summary

`mapPrimeSummaryToInboxThread()` in `apps/reception/src/lib/inbox/prime-review.server.ts` hard-codes `lastSyncedAt: null` for every Prime thread it produces. The `stale-sync` inbox filter in `apps/reception/src/components/inbox/filters.ts` treats `null` as stale, so every Prime thread unconditionally matches the stale-sync filter, making the filter unreliable. The fix is a single-line change: populate `lastSyncedAt` from `summary.updatedAt`, which is already present on `PrimeReviewThreadSummary` and is the correct proxy for Prime's own sync freshness. The guard for the `prime_activity` sentinel (`bookingId: 'activity'`) is orthogonal — it controls `guestBookingRef` nulling, not `lastSyncedAt`, so no special case is needed for that channel. A targeted test update confirms non-null `lastSyncedAt` and validates that the stale-sync filter no longer fires for a recently-updated Prime thread.

## Active tasks
- [x] TASK-01: Populate `lastSyncedAt` from `updatedAt` in `mapPrimeSummaryToInboxThread` and update test

## Goals
- Fix `lastSyncedAt: null` so Prime threads are excluded from stale-sync filter when their `updatedAt` is recent.
- Add targeted test coverage confirming the fix and filter behaviour.

## Non-goals
- Changes to the `prime_activity` sentinel logic (bookingId / guestBookingRef).
- Changes to `STALE_SYNC_THRESHOLD_MS` value.
- Any other inbox filter changes.
- Refactoring `mapPrimeSummaryToInboxThread` beyond the single field fix.

## Constraints & Assumptions
- Constraints:
  - `mapPrimeSummaryToInboxThread` is not exported. Tests must exercise the fix via an exported function (`listPrimeInboxThreadSummaries`) with a mocked `fetch` — this is the established pattern in `send-prime-inbox-thread.test.ts`.
  - Stale-sync filter assertions belong in `apps/reception/src/components/inbox/__tests__/filters.test.ts`, which already has TC-06 covering the `null` branch and the full stale/fresh spectrum.
  - `updatedAt` is typed as `string` (non-nullable) on `PrimeReviewThreadSummary` — no null-guard needed.
- Assumptions:
  - Prime's `updatedAt` is a valid ISO-8601 string whenever a thread is returned by the API.
  - Using `updatedAt` as a proxy for last-synced time is appropriate because Prime manages its own state and the reception inbox does not perform a separate sync step for Prime threads.

## Inherited Outcome Contract

- **Why:** The stale-sync inbox filter is unreliable for Prime threads because `lastSyncedAt` is always null, causing every Prime thread to match the filter regardless of freshness. Fixing this makes the filter useful for its intended purpose: surfacing threads that genuinely need attention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Stale-sync inbox filter correctly excludes Prime threads whose `updatedAt` is within the freshness window; the filter is only triggered for genuinely stale Prime threads.
- **Source:** auto

## Analysis Reference
- Related analysis: None (micro-build dispatched directly without analysis stage)
- Selected approach inherited:
  - Populate `lastSyncedAt: summary.updatedAt` in `mapPrimeSummaryToInboxThread()`.
- Key reasoning used:
  - `updatedAt` is already present on `PrimeReviewThreadSummary` (line 19 of `prime-review.server.ts`).
  - The `prime_activity` channel sentinel only affects `guestBookingRef` (line 325); `lastSyncedAt` logic is channel-agnostic.
  - No null-guard is needed: `updatedAt` is typed as `string`, not `string | null`.

## Selected Approach Summary
- What was chosen:
  - Single-line change: `lastSyncedAt: null` → `lastSyncedAt: summary.updatedAt`.
  - New test file `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` exercising the mapper via `listPrimeInboxThreadSummaries()` with mocked `fetch`.
  - Extension of `apps/reception/src/components/inbox/__tests__/filters.test.ts` with a Prime-flavoured fresh-thread stale-sync case.
- Why planning is not reopening option selection:
  - The source field is unambiguous; `updatedAt` is the only timestamp on the summary that reflects when Prime last updated the thread. No other approach is warranted.

## Fact-Find Support
- Supporting brief: None (operator-specified micro-build)
- Evidence carried forward:
  - `PrimeReviewThreadSummary.updatedAt: string` — verified at line 19 of `prime-review.server.ts`.
  - `lastSyncedAt: null` hardcoded at line 317 of `prime-review.server.ts`.
  - `stale-sync` filter: `if (!thread.lastSyncedAt) return true` — verified at lines 55–59 of `filters.ts`.
  - `mapPrimeSummaryToInboxThread` is not exported — tests exercise it through `listPrimeInboxThreadSummaries()` with a mocked `fetch` (established pattern in `send-prime-inbox-thread.test.ts`).
  - `filters.test.ts` already has TC-06 covering stale-sync with null/stale/fresh variants; a Prime-specific fresh case fits naturally as a new test in that file.
  - `prime-activity-contracts.test.ts` contains only type-contract assertions and is not extended for runtime assertions in this plan.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Populate `lastSyncedAt` from `updatedAt`; update test | 95% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | - | No rendering path touched |
| UX / states | N/A | - | Filter behaviour is a data concern, not a UI state machine |
| Security / privacy | N/A | - | `updatedAt` is a non-PII timestamp already present in the thread object |
| Logging / observability / audit | N/A | - | No logging change needed for a mapping fix |
| Testing / validation | Required — new `prime-review-mapper.test.ts` exercises mapper via `listPrimeInboxThreadSummaries()` with mocked fetch; `filters.test.ts` extended with supplemental Prime fresh-thread case | TASK-01 | `prime-activity-contracts.test.ts` is NOT the target for runtime assertions |
| Data / contracts | Required — `InboxThreadSummaryApiModel.lastSyncedAt` changes from always-null to always-non-null for Prime threads | TASK-01 | Type is already `string \| null`; no schema change needed |
| Performance / reliability | N/A | - | Single string assignment; negligible |
| Rollout / rollback | N/A | - | Pure code change; deploy is instant; rollback is a revert |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no parallelism needed |

## Delivered Processes

None: no material process topology change

## Tasks

### TASK-01: Populate `lastSyncedAt` from `updatedAt` in `mapPrimeSummaryToInboxThread` and update test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/lib/inbox/prime-review.server.ts` (1-line fix); `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` (new — mapper test via mocked fetch on `listPrimeInboxThreadSummaries`); `apps/reception/src/components/inbox/__tests__/filters.test.ts` (extended — Prime fresh-thread stale-sync assertion)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/prime-review.server.ts`, `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` (new file), `apps/reception/src/components/inbox/__tests__/filters.test.ts` (extended)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — exact line identified (line 317); field source confirmed (`summary.updatedAt`); no ambiguity.
  - Approach: 95% — `updatedAt` is the only suitable timestamp; operator confirmed this is the correct proxy.
  - Impact: 95% — stale-sync filter `null` branch is the only path producing the bug; fixing it is direct.
- **Acceptance:**
  - `listPrimeInboxThreadSummaries()` (called with mocked `fetch`) returns a thread with `lastSyncedAt` equal to the `updatedAt` value from the mocked Prime API response — exercises the private mapper through an exported function (established pattern in `send-prime-inbox-thread.test.ts`).
  - `matchesFilter(thread, 'stale-sync', now)` returns `false` for a Prime thread whose `lastSyncedAt` is within `STALE_SYNC_THRESHOLD_MS` — new assertion added to `filters.test.ts` (the existing stale-sync test home).
  - `matchesFilter(thread, 'stale-sync', now)` returns `true` for a Prime thread with an old `lastSyncedAt` — already covered by TC-06 in `filters.test.ts`.
  - `prime_activity` channel behaviour is unchanged: `guestBookingRef` remains `null` for sentinel `bookingId: 'activity'`.
- **Engineering Coverage:**
  - UI / visual: N/A — server-layer mapping function only
  - UX / states: N/A — no UI state affected
  - Security / privacy: N/A — `updatedAt` is a non-sensitive timestamp
  - Logging / observability / audit: N/A — no log changes warranted
  - Testing / validation: Required — (a) add `prime-review-mapper.test.ts` (new sibling of `send-prime-inbox-thread.test.ts`) exercising `listPrimeInboxThreadSummaries` with a mocked `fetch` to confirm `lastSyncedAt === updatedAt` in the returned thread; (b) extend `apps/reception/src/components/inbox/__tests__/filters.test.ts` with a Prime-thread-flavoured stale-sync case confirming `lastSyncedAt` from `updatedAt` is treated as fresh
  - Data / contracts: Required — `InboxThreadSummaryApiModel.lastSyncedAt` will be non-null for all Prime threads post-fix; type already allows `string | null` so no interface change needed; downstream consumers of this field now receive a valid ISO string instead of null
  - Performance / reliability: N/A — single string assignment per call
  - Rollout / rollback: N/A — pure logic fix, instant rollback via revert
- **Validation contract:**
  - TC-01: `listPrimeInboxThreadSummaries()` with `fetch` mocked to return a thread with `updatedAt: "2026-03-14T10:00:00.000Z"` → returned thread has `lastSyncedAt === "2026-03-14T10:00:00.000Z"` (exercised in `prime-review-mapper.test.ts`)
  - TC-02: `matchesFilter({lastSyncedAt: freshIso, ...}, 'stale-sync', NOW)` → `false` (exercised in `filters.test.ts`)
  - TC-03: `matchesFilter({lastSyncedAt: staleIso, ...}, 'stale-sync', NOW)` → `true` — already covered by TC-06 in `filters.test.ts`; no new assertion needed
  - TC-04: `prime_activity` thread with `bookingId: 'activity'` — mapper still produces `guestBookingRef: null` (regression guard in `prime-review-mapper.test.ts`)
- **Execution plan:** Red → Green → Refactor
  - Red: write `prime-review-mapper.test.ts` asserting `lastSyncedAt` equals `updatedAt` from the mocked `fetch` response — this test fails before the fix because the current mapper returns `null`.
  - Green: change `lastSyncedAt: null` to `lastSyncedAt: summary.updatedAt` at line 317 of `prime-review.server.ts`; mapper test now passes.
  - Supplement (Green phase): add a Prime fresh-thread case to `filters.test.ts` to confirm stale-sync filter excludes a thread with a recent `lastSyncedAt` — this test verifies filter behaviour using the fixed mapper output but does not itself fail before the fix (it operates on the `matchesFilter` function independently).
  - Refactor: none needed; change is self-contained.
- **Planning validation (required for M/L):**
  - None: S-effort task; code path verified by direct read of source files
- **Scouts:**
  - None: `updatedAt` field confirmed present and non-nullable on `PrimeReviewThreadSummary` (line 19); `listPrimeInboxThreadSummaries` + mocked `fetch` pattern confirmed in `send-prime-inbox-thread.test.ts`; `filters.test.ts` stale-sync seam confirmed (TC-06); no unknowns remain
- **Edge Cases & Hardening:**
  - `prime_activity` sentinel guard: `bookingId: 'activity'` already handled at line 325 (sets `guestBookingRef: null`); this guard is channel-based, not timestamp-based; `lastSyncedAt` change does not interact with it.
  - `updatedAt` format: typed as `string` (non-nullable); Prime API always returns it; no null-guard or format normalization required.
  - Threads with stale `updatedAt`: the fix correctly allows stale Prime threads (old `updatedAt`) to match the stale-sync filter — this is the desired behaviour.
- **What would make this >=90%:**
  - Already at 95%; held-back test: "what single unresolved unknown would push this below 80?" — none. `updatedAt` type, field presence, and filter logic are all directly confirmed from source. Score stands.
- **Rollout / rollback:**
  - Rollout: standard deploy; no migration or config change.
  - Rollback: revert the one-line change.
- **Documentation impact:**
  - None: internal mapping function; no public API or operator-facing doc change.
- **Notes / references:**
  - `mapPrimeSummaryToInboxThread` is called from: `listPrimeInboxThreadSummaries` (line 393), `getPrimeInboxThreadDetail` (line 415), `resolvePrimeInboxThread` (line 520), `dismissPrimeInboxThread` (line 541). All callers benefit from the fix without any change required on their side — consumer tracing confirms no update needed to callers.
  - Consumer tracing: `lastSyncedAt` is consumed by `matchesFilter` in `filters.ts` (stale-sync branch) and by any UI displaying the thread. Changing from `null` to a valid ISO string is strictly an improvement for all consumers.
- **Build evidence:**
  - Red phase: `prime-review-mapper.test.ts` written first — TC-01 assertions failed (3 tests: `lastSyncedAt` was null). TC-04 guestBookingRef test passed pre-fix.
  - Green: changed `lastSyncedAt: null` → `lastSyncedAt: summary.updatedAt` at `prime-review.server.ts` line 338 (post-existing-changes offset). All 4 mapper tests pass.
  - Supplement: `filters.test.ts` extended with TC-09 (Prime fresh-thread stale-sync). Also fixed latent `makeThread` factory bug — `lastSyncedAt: overrides.lastSyncedAt ?? new Date().toISOString()` used `??` which coalesced `null` to a fresh timestamp, making TC-06 always test a fresh sync (not null). Fixed to `"lastSyncedAt" in overrides ? overrides.lastSyncedAt ?? null : new Date().toISOString()`. All 11 filter tests pass.
  - Scope expansion: `makeThread` factory fix in `filters.test.ts` — required to make TC-06 (null-sync branch) meaningful and to ensure TC-09 is not a false pass. Bounded to same file, same objective.
  - Typecheck: no errors in touched files (`prime-review.server.ts`, `prime-review-mapper.test.ts`, `filters.test.ts`).
  - Lint: no errors in any touched file.
  - Total tests: 15 passed (4 mapper + 11 filter).
  - Post-build validation:
    Mode: 2 (Data Simulation)
    Attempt: 1
    Result: Pass
    Evidence: listPrimeInboxThreadSummaries() with mocked fetch returning updatedAt "2026-03-14T10:00:00.000Z" → thread.lastSyncedAt === "2026-03-14T10:00:00.000Z" (TC-01 ✓). prime_activity sentinel guestBookingRef: null preserved (TC-04 ✓). stale-sync filter returns false for fresh lastSyncedAt (TC-09 ✓). null lastSyncedAt still stale (TC-06 ✓).
    Engineering coverage evidence:
      Testing/validation: Required — 4 mapper tests (new prime-review-mapper.test.ts) + TC-09 + TC-06 regression fix in filters.test.ts. All 15 tests pass.
      Data/contracts: Required — lastSyncedAt now string (non-null) for all Prime threads. Type string|null unchanged, no interface change. Typecheck clean.
    Scoped audits (Mode 1): N/A — no UI
    Autofix actions: None
    Symptom patches: None
    Deferred findings: None
    Degraded mode: No

## Risks & Mitigations
- **Risk:** If a Prime thread legitimately has a very old `updatedAt` (e.g., dormant thread), it will now match the stale-sync filter. **Mitigation:** This is correct behaviour — the filter is intended to surface threads that have not been updated recently.

## Observability
- Logging: None
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] `listPrimeInboxThreadSummaries()` returns threads with `lastSyncedAt` equal to the Prime API `updatedAt` value (verified via `prime-review-mapper.test.ts` with mocked fetch).
- [x] `matchesFilter(thread, 'stale-sync')` returns `false` for a Prime thread with a recent `lastSyncedAt` (verified in `filters.test.ts` TC-09).
- [x] `prime_activity` sentinel guard (`guestBookingRef: null`) is unaffected (verified TC-04).
- [ ] Tests pass in CI.

## Decision Log
- 2026-03-14: `updatedAt` chosen as `lastSyncedAt` proxy (non-nullable, always present, correct semantic meaning for Prime sync freshness). No DECISION task warranted.
- 2026-03-14: `prime_activity` guard confirmed orthogonal — affects `guestBookingRef` only, no interaction with `lastSyncedAt`.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Populate `lastSyncedAt` from `updatedAt` | Yes | None | No |

**Trace notes:**
- Source field `summary.updatedAt` confirmed present and typed `string` (non-nullable) on `PrimeReviewThreadSummary` at line 19.
- Target field `lastSyncedAt` typed `string | null` on `InboxThreadSummaryApiModel` at line 139 of `api-models.server.ts` — assigning a `string` to a `string | null` is safe.
- New test file `prime-review-mapper.test.ts` will be added alongside `send-prime-inbox-thread.test.ts`; `listPrimeInboxThreadSummaries()` is exported and testable via mocked `fetch` (pattern established).
- `matchesFilter` is exported from `filters.ts` — directly importable in tests.
- No preconditions from other tasks; single self-contained step.

## Overall-confidence Calculation
- TASK-01: S=1, confidence=95%
- Overall-confidence = 95% (single S-effort task)
