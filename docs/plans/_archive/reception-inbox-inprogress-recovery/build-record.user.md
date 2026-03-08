---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-inprogress-recovery
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-inprogress-recovery/build-event.json
---

# Build Record: Reception Inbox In-Progress Recovery

## Outcome Contract

- **Why:** Threads that get stuck in In-Progress state require manual operator intervention to recover. This creates operational drag and risks emails being missed when the operator is unavailable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Stuck In-Progress threads are automatically detected and retried without manual operator intervention.
- **Source:** operator

## What Was Built

**TASK-01 (telemetry + query foundation):** Added `inbox_recovery` to the telemetry event type registry in `telemetry.server.ts`, enabling recovery actions to be logged in the D1 `thread_events` table. Added `findStaleAdmittedThreads` query function in `repositories.server.ts` that identifies threads stuck in `pending` status where the latest admission decision is `admit`, no draft exists, `needsManualDraft` is not set, and `updated_at` exceeds the stale threshold. The query respects a configurable limit (default 20) and treats null/missing `metadata_json` as eligible for recovery (fail-open).

**TASK-02 (recovery function):** Created `recovery.server.ts` with the `recoverStaleThreads` function. Exported 5 helper functions from `sync.server.ts` (`extractEmailAddress`, `getLatestInboundMessage`, `buildThreadContext`, `inferPrepaymentProvider`, `inferPrepaymentStep`) to mirror the full `syncInbox` draft generation context. Recovery fetches the Gmail thread, matches the sender to a guest, infers prepayment context, builds thread context, and generates an agent draft. On success: creates a draft record, updates status to `drafted`, logs an `inbox_recovery` event with `outcome: "recovered"`. On failure: sets `needsManualDraft: true`, logs with `outcome: "manual_flagged"`. At max retries (default 3): flags immediately without attempting draft. Individual thread errors do not block processing of remaining threads.

**TASK-03 (API route + cron wiring):** Created the internal API route at `/api/internal/inbox-recovery` with Bearer token auth (`INBOX_RECOVERY_SECRET`), configurable stale threshold (`INBOX_RECOVERY_STALE_HOURS`, default 2), and disable toggle (`INBOX_RECOVERY_ENABLED=false`). Created `worker-entry.ts` as a thin wrapper around OpenNext's generated worker: it re-exports Durable Object classes, delegates `fetch` to OpenNext, and adds a `scheduled` handler that calls `openNextWorker.fetch()` directly (not global `fetch()`) with a synthetic recovery request. Updated `wrangler.toml` to use `worker-entry.ts` as the main entry point and added a `[triggers]` section with `crons = ["*/30 * * * *"]`. Added `worker-entry.ts` to the ESLint ignore list since it is compiled by wrangler, not tsc.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` (pre-commit hook, scoped) | Pass | All affected packages pass typecheck |
| `pnpm lint` (pre-commit hook, scoped) | Pass | After fixing import sort, unused eslint-disable directives |
| Unit tests: `recovery.server.test.ts` | Pass (CI) | TC-01 through TC-07 for TASK-01, TC-01 through TC-06 for TASK-02 |
| Unit tests: `recovery-route.test.ts` | Pass (CI) | TC-01 through TC-05 + 503 case for TASK-03 |

## Validation Evidence

### TASK-01
- TC-01: Thread pending+admitted+no draft+no manual flag+stale -> returned. Test verifies query returns matching thread.
- TC-02: Thread pending+admitted+has draft -> NOT returned. Test verifies exclusion.
- TC-03: Thread pending+admitted+needsManualDraft:true -> NOT returned. Test verifies exclusion.
- TC-04: Thread pending+admitted+recently updated -> NOT returned. Test verifies threshold filtering.
- TC-05: Thread in drafted status -> NOT returned. Test verifies status filtering.
- TC-06: Thread pending+admission decision auto-archive -> NOT returned. Test verifies decision filtering.
- TC-07: `inbox_recovery` event logged via `recordInboxEvent` without error. Test verifies event type is valid.

### TASK-02
- TC-01: Stale thread recovered with full context (guest match, prepayment, thread context) -> draft created, status `drafted`, event logged with `outcome: "recovered"`.
- TC-02: Draft generation fails -> `needsManualDraft: true` set, event logged with `outcome: "manual_flagged"`, retry counter incremented.
- TC-03: Thread at max retry count -> flagged immediately without draft attempt, event logged with `outcome: "max_retries"`.
- TC-04: Error on one thread does not prevent processing of next thread.
- TC-05: Summary counts match actual outcomes.
- TC-06: No Gmail thread found -> skipped gracefully, logged.

### TASK-03
- TC-01: Valid secret -> 200 response with recovery summary.
- TC-02: No auth header -> 401 response.
- TC-03: Wrong secret -> 401 response.
- TC-04: INBOX_RECOVERY_ENABLED=false -> 200 with `{ enabled: false }`, no recovery executed.
- TC-05: Recovery function error -> 500 response with error logged.
- TC-503: INBOX_RECOVERY_SECRET not configured -> 503 response.

## Scope Deviations

- **Controlled expansion (TASK-03):** Added `**/worker-entry.ts` to `tools/eslint-ignore-patterns.cjs`. Rationale: `worker-entry.ts` is compiled by wrangler at deploy time, not by tsc. It sits outside tsconfig and cannot be parsed by ESLint's TypeScript parser. This is a build-tooling accommodation, not a functional change.
- **Additional exports (TASK-02):** Exported 5 helpers from `sync.server.ts` instead of the 3 originally planned. `extractEmailAddress` and `getLatestInboundMessage` were also needed to mirror the full draft generation context. Export-only changes with no signature or logic modifications.
