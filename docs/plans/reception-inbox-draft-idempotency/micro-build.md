# Micro-Build Record: Reception Inbox Draft Idempotency

**Date:** 2026-03-12
**Issues:** #20 (regenerate idempotency), #22 (concurrent sync draft creation)

## What changed

### Issue #20 — Regenerate endpoint recency guard

**File:** `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`

Added a 10-second idempotency window: if a `generated` draft already exists and was created within the last 10 seconds, the endpoint returns the existing draft with `idempotent: true` instead of triggering a new LLM generation. The `force` flag bypasses this guard (same as the existing edited-draft guard).

Client-side debounce was already in place: the `regeneratingDraft` state disables all action buttons while the request is in flight, and the `ConfirmModal` component disables its confirm button during async processing.

### Issue #22 — Atomic draft creation for sync pipeline

**File:** `apps/reception/src/lib/inbox/repositories.server.ts`

Added `createDraftIfNotExists()` — uses `INSERT ... SELECT ... WHERE NOT EXISTS` to atomically insert a draft row only if no `generated` draft already exists for the thread. Returns a `{ draft, created }` result so the caller knows whether it got a new or existing row.

**File:** `apps/reception/src/lib/inbox/sync.server.ts`

Updated `upsertSyncDraft()` to use `createDraftIfNotExists()` instead of the non-atomic `createDraft()` in the "no existing draft" branch. The existing `getPendingDraft` check-then-update branch remains for the case where a generated draft already exists and should be updated with fresh content.

## Validation

- TypeScript: `tsc --noEmit` passes (zero errors on changed files)
- ESLint: no lint errors on changed files
- Client debounce: already present via `actionsDisabled` + `ConfirmModal.isProcessing`

## Files touched

| File | Change |
|------|--------|
| `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` | Added 10s recency guard |
| `apps/reception/src/lib/inbox/repositories.server.ts` | Added `createDraftIfNotExists()`, fixed missing `z` import |
| `apps/reception/src/lib/inbox/sync.server.ts` | Switched to `createDraftIfNotExists()` in `upsertSyncDraft` |
