# Micro-Build Record: Reception Inbox Sync Observability

**Date:** 2026-03-12
**Dispatch:** dispatch.v2.json
**Issues addressed:** #8, #9, #26

## Changes

### Issue #8 -- Error logs lack step context
**File:** `apps/reception/src/lib/inbox/sync.server.ts`

Added a `step` variable (`SyncStep` type) to `processThread` that tracks which pipeline phase is executing: `gmail_fetch`, `admission_classify`, `guest_match`, `draft_generate`, `db_write`. The function body is wrapped in try/catch that re-throws a `SyncStepError` carrying the step. The `syncInbox` catch block now extracts and logs the `step` field in both the console.error and the telemetry event metadata.

### Issue #9 -- Metadata parse errors silently swallowed
**Files:** `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/recovery.server.ts`

Both `parseMetadata` functions now log `console.warn` on JSON.parse failure, including a truncated copy of the raw value (max 200 chars) and the parse error message. Return value remains `{}` -- no functional change.

### Issue #26 -- Telemetry write failures silently ignored
**File:** `apps/reception/src/lib/inbox/recovery.server.ts`

Guest-match telemetry `recordInboxEvent` in `recoverSingleThread` is now wrapped in try/catch with `console.warn` on failure, including the thread ID and event type. The existing bare `catch {}` in `recoverStaleThreads` also now warns instead of silently discarding.

## Validation
- `pnpm --filter @apps/reception typecheck` -- pass
- `pnpm --filter @apps/reception lint` -- pass
- No functional behaviour changes; logging-only additions
