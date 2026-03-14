---
Status: Complete
Feature-Slug: reception-prime-shadow-write-logging
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/reception-prime-shadow-write-logging/build-event.json
---

# Build Record: Prime Activity Shadow-Write Structured Error Logging

## What Was Built

**TASK-01** (S-effort): Replaced the bare `console.error(msg, rawError)` in the D1 shadow-write catch block of `apps/prime/functions/api/activity-message.ts` with a structured two-argument call: `console.error(msg, { threadId: channelId, channelId, error: <error message string>, failedAt: Date.now() })`. The change is confined to lines 154–160 of that file; the handler signature, return value, and Firebase write paths are unchanged.

In `apps/prime/functions/__tests__/activity-message.test.ts`:
- Added a `consoleSpy` (`jest.spyOn(console, 'error')`) to the describe block, restored in `afterAll`.
- Extended TC-11 to assert: (1) response status is still 200; (2) `consoleSpy` was called once with a string containing `'shadow-write'` and an object containing `{ threadId, channelId, error: 'D1 unavailable', failedAt: Number }`.
- Added TC-EDGE-01 assertion inside the existing TC-06 extended test: on a successful D1 shadow-write, `consoleSpy` must NOT have been called.
- Added `RATE_LIMIT: createMockKv()` to TC-06, TC-11, TC-12, and TC-06-extended to fix pre-existing test failures caused by the kv-rate-limit binding-absent warning thrown by the jest console-warn guard (controlled scope expansion; no change to test coverage assertions).

## Tests Run

```
pnpm -w run test:governed -- jest -- --testPathPattern="apps/prime/functions/__tests__/activity-message" --no-coverage
```

Results:
- ✓ TC-06: valid session + valid body → 200
- ✓ TC-07: missing prime_session cookie → 401
- ✕ TC-08: invalid/expired session token → 401 (**pre-existing** — `validateGuestSessionToken` returns 404 not 401; out of scope)
- ✓ TC-09: rate limit exceeded → 429
- ✓ TC-10: missing activityId, channelId, or content → 400
- ✓ TC-11: shadow-write failure → 200 + structured console.error (NEW assertion)
- ✓ TC-12: Firebase write failure → 500
- ✓ TC-06 extended: D1 shadow-write rows (TC-EDGE-01: consoleSpy not called on success) (NEW assertion)

7 pass, 1 fail (pre-existing TC-08 — not in scope).

Typecheck: `pnpm --filter @apps/prime run typecheck` — ✓ pass.
Lint: `pnpm --filter @apps/prime run lint` — ✓ pass.

## Validation Evidence

- TC-11 (D1 failure path): `consoleSpy` spy asserted with `(stringContaining('shadow-write'), objectContaining({ threadId: 'act-uuid-fire-forget', channelId: 'act-uuid-fire-forget', error: 'D1 unavailable', failedAt: Number }))` — ✓ pass.
- TC-EDGE-01 (success path): `consoleSpy` not called after successful D1 write in TC-06 extended — ✓ pass.
- Guest response: TC-11 continues to return 200 — ✓ pass.

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | N/A — server-side CF Pages function; no UI |
| UX / states | N/A — guest 200 response unchanged; no UX states |
| Security / privacy | N/A — `threadId` and `channelId` are non-sensitive internal IDs; no PII logged |
| Logging / observability / audit | **Required** — structured log now emits `{ threadId, channelId, error, failedAt }`. Verified by TC-11 spy assertion: consoleSpy called with matching object containing all four required fields. |
| Testing / validation | **Required** — TC-11 extended with consoleSpy assertion; TC-EDGE-01 added in TC-06 extended; both pass. |
| Data / contracts | N/A — no schema/API/return-type changes |
| Performance / reliability | N/A — catch block only; no hot-path impact |
| Rollout / rollback | N/A — single patch commit; rollback = `git revert`; no migration needed |

## Scope Deviations

Controlled expansion: `RATE_LIMIT: createMockKv()` added to four test cases (TC-06, TC-11, TC-12, TC-06 extended) that were all failing due to a pre-existing kv-rate-limit `console.warn` that the jest console-guard rejects. These tests were in the same untracked file as my target tests. The fix is a one-line env override per test case; it does not change any test's coverage assertions and is required for the new TC-11 consoleSpy assertion to run cleanly. Plan `Affects` list updated in build evidence above; no plan amendment needed for S-effort tasks.

## Outcome Contract

- **Why:** Silent shadow-write failures cause activity thread messages to go missing from the reception inbox with no trace, making diagnosis impossible.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When D1 is unavailable during an activity message shadow write, a structured error log is emitted with enough context (threadId, channelId, error message, timestamp) to diagnose the failure.
- **Source:** auto

## Workflow Telemetry Summary

- Feature slug: `reception-prime-shadow-write-logging`
- Records: 2
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 39980 | 14616 | 0.0% |
| lp-do-build | 1 | 2.00 | 71251 | 4962 | 0.0% |

Totals: context input bytes 111,231; artifact bytes 19,578; modules counted 3; deterministic checks 3. Stages missing records: lp-do-ideas, lp-do-fact-find, lp-do-analysis (micro-build; no upstream pipeline). Token capture: unavailable this session.
