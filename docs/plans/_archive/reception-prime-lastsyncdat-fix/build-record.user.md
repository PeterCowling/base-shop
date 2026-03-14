---
Status: Complete
Feature-Slug: reception-prime-lastsyncdat-fix
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/_archive/reception-prime-lastsyncdat-fix/build-event.json
---

# Build Record: Reception Prime `lastSyncedAt` Fix

## What Was Built

**TASK-01** — Single-line fix in `apps/reception/src/lib/inbox/prime-review.server.ts`: changed `lastSyncedAt: null` to `lastSyncedAt: summary.updatedAt` in `mapPrimeSummaryToInboxThread()`. This ensures all Prime threads carry a valid ISO-8601 timestamp for `lastSyncedAt`, so the stale-sync inbox filter only matches Prime threads whose `updatedAt` is genuinely older than the 24-hour freshness threshold.

New test file `apps/reception/src/lib/inbox/__tests__/prime-review-mapper.test.ts` exercises the private mapper via the exported `listPrimeInboxThreadSummaries()` function with a mocked `fetch` (TC-01: `lastSyncedAt === updatedAt`; TC-04: `prime_activity` sentinel `guestBookingRef: null` unaffected).

Extended `apps/reception/src/components/inbox/__tests__/filters.test.ts` with TC-09 (Prime fresh-thread stale-sync: a thread with a recent `lastSyncedAt` correctly returns `false` from `matchesFilter`). Also fixed a latent factory bug: `makeThread({ lastSyncedAt: null })` was using `??` which coalesced `null` to a fresh timestamp, rendering TC-06 (null-treated-as-stale) meaningless. Fixed with an `in`-operator guard: `"lastSyncedAt" in overrides ? overrides.lastSyncedAt ?? null : new Date().toISOString()`.

## Tests Run

```
pnpm -w run test:governed -- jest -- --testPathPattern="prime-review-mapper|inbox/__tests__/filters" --no-coverage
```

Result: 15/15 tests passed (4 mapper + 11 filter). No skips.

Typecheck: no errors in touched files (`prime-review.server.ts`, `prime-review-mapper.test.ts`, `filters.test.ts`).
Lint (ESLint): no errors in any touched file.

## Workflow Telemetry Summary

- Stage: lp-do-plan + lp-do-build
- Module: modules/plan-code.md
- Deterministic checks: validate-plan.sh ✓, validate-engineering-coverage.sh ✓
- Critiques: 3 rounds (scores: 4.0, 4.0, 4.0 — all credible)
- Build mode: inline (no Codex offload)
- Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass

## Validation Evidence

| TC | Description | Result |
|---|---|---|
| TC-01 | `listPrimeInboxThreadSummaries()` returns `lastSyncedAt === updatedAt` | Pass |
| TC-02 | `matchesFilter({lastSyncedAt: freshIso}, 'stale-sync', NOW)` → `false` | Pass (TC-09 in filters.test.ts) |
| TC-03 | `matchesFilter({lastSyncedAt: staleIso}, 'stale-sync', NOW)` → `true` | Pass (TC-06 regression) |
| TC-04 | `prime_activity` thread → `guestBookingRef: null` unchanged | Pass |

## Engineering Coverage Evidence

| Coverage Area | Required/N/A | Evidence |
|---|---|---|
| UI / visual | N/A | Server-layer mapping function; no UI touched |
| UX / states | N/A | No UI state machine affected |
| Security / privacy | N/A | `updatedAt` is a non-PII timestamp |
| Logging / observability / audit | N/A | No logging change warranted |
| Testing / validation | Required | `prime-review-mapper.test.ts` (4 tests); `filters.test.ts` TC-09 (+ factory fix); all 15 tests pass |
| Data / contracts | Required | `lastSyncedAt` field changes from always-null to always-non-null for Prime threads; type `string \| null` unchanged; no interface change; downstream `matchesFilter` now correctly excludes fresh Prime threads from stale-sync filter |
| Performance / reliability | N/A | Single string assignment per mapper call; negligible |
| Rollout / rollback | N/A | Pure logic fix; deploy is instant; rollback is a one-line revert |

## Scope Deviations

- `makeThread` factory null-propagation fix in `filters.test.ts` — the `??` operator was coalescing explicit `null` to a fresh timestamp, causing TC-06 to test a fresh thread rather than a null-synced thread. Fixed to correctly pass `null` through using the `in`-operator guard. This is a bounded correction to the same file within the same task objective (stale-sync filter correctness).

## Outcome Contract

- **Why:** The stale-sync inbox filter is unreliable for Prime threads because `lastSyncedAt` is always null, causing every Prime thread to match the filter regardless of freshness. Fixing this makes the filter useful for its intended purpose: surfacing threads that genuinely need attention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Stale-sync inbox filter correctly excludes Prime threads whose `updatedAt` is within the freshness window; the filter is only triggered for genuinely stale Prime threads.
- **Source:** auto
