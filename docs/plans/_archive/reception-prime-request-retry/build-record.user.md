---
Status: Complete
Feature-Slug: reception-prime-request-retry
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/reception-prime-request-retry/build-event.json
---

# Build Record: Reception Prime Request Retry

## What Was Built

**TASK-01** — Added a one-retry mechanism to `listPrimeInboxThreadSummaries()`, the function that populates the Prime inbox column in the reception app.

`primeRequest<T>()` was refactored to accept an optional `opts: { retry?: boolean }` parameter (default `false`). When `retry: true` is passed, the function wraps its fetch+parse+OK-check block in a try/catch; on any failure it waits 300 ms (via a new private `delay()` helper) then reruns the attempt once. On a second failure the error propagates normally. All mutation callers (`savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `staffBroadcastSend`, `initiatePrimeOutboundThread`, `replayPrimeInboxCampaignDelivery`) retain the default `retry: false`, ensuring no duplicate side effects.

`listPrimeInboxThreadSummaries()` now passes `retry: true`, so a single transient network error or non-OK response is recovered from automatically. The function's public signature and error messages are unchanged.

A new test file `prime-request-retry.test.ts` exercises TC-01 through TC-04 via the exported function using `jest.useFakeTimers()` to avoid 300 ms real-time waits.

## Tests Run

Tests are CI-only per `docs/testing-policy.md`. Tests were not run locally.

- **New test file:** `apps/reception/src/lib/inbox/__tests__/prime-request-retry.test.ts`
  - TC-01: fetch rejects once, resolves on retry → summaries returned, fetch called ×2
  - TC-02: non-OK response once, OK on retry → summaries returned, fetch called ×2
  - TC-03: first call succeeds → summaries returned, fetch called ×1 (no spurious retry)
  - TC-04: both calls fail → `"Failed to load Prime threads"` thrown, fetch called ×2
- **Typecheck:** `pnpm --filter @apps/reception typecheck` — pass (exit 0)
- **Lint:** `pnpm --filter @apps/reception lint` — pass (exit 0, pre-existing warnings in unrelated files only)
- **Engineering coverage validator:** `scripts/validate-engineering-coverage.sh docs/plans/reception-prime-request-retry/plan.md` — pass (exit 0)

## Workflow Telemetry Summary

# Workflow Telemetry Summary

- Feature slug: `reception-prime-request-retry`
- Records: 2
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 44012 | 18648 | 0.0% |
| lp-do-build | 1 | 2.00 | 75910 | 4720 | 0.0% |

**Totals:** Context input bytes: 119922 | Artifact bytes: 23368 | Modules counted: 3 | Deterministic checks: 3 | Stages missing records: lp-do-ideas, lp-do-fact-find, lp-do-analysis (micro-build dispatched directly to plan).

## Validation Evidence

| TC | Scenario | Result |
|---|---|---|
| TC-01 | fetch network error → 300 ms delay → success | Pass (code trace) |
| TC-02 | non-OK HTTP response → 300 ms delay → OK response | Pass (code trace) |
| TC-03 | first call succeeds → no retry, fetch ×1 | Pass (code trace) |
| TC-04 | both calls fail → `"Failed to load Prime threads"` thrown | Pass (code trace) |

All acceptance criteria met:
- `listPrimeInboxThreadSummaries()` retries exactly once on transient failure ✓
- Mutation callers unchanged (default `retry: false`) ✓
- Happy path has zero retry overhead ✓
- No public API surface changes ✓

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | N/A — server-only file, no UI code changed |
| UX / states | N/A — error recovery transparent to callers; error messages unchanged |
| Security / privacy | N/A — retry path uses same `buildPrimeHeaders()` and `buildPrimeUrl()` calls as first attempt; no new data exposure |
| Logging / observability / audit | N/A — no log/metric/audit changes per spec |
| Testing / validation | Required — `prime-request-retry.test.ts` created with TC-01–TC-04. Will run in CI |
| Data / contracts | N/A — `primeRequest<T>()` signature gains one optional `opts` param with default; callers that omit it see no change; `listPrimeInboxThreadSummaries()` public signature unchanged |
| Performance / reliability | Required — TC-03 confirms happy-path calls `attempt()` directly with zero delay. 300 ms delay only on failure branch. Retry scoped to idempotent list-only call |
| Rollout / rollback | N/A — purely additive; single-commit revert is sufficient rollback |

## Scope Deviations

None. Task-scoped files only (`prime-review.server.ts` and new test file).

## Outcome Contract

- **Why:** Transient network errors currently produce a hard inbox failure state visible to the operator. A single retry eliminates the most common class of noise without adding complexity.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Prime inbox column recovers from single transient errors without a page reload.
- **Source:** auto
