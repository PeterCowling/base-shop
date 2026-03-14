---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-refetch-error-logging
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-005
Related-Plan: none
processed_by: lp-do-build
processed_at: 2026-03-13
---

# Prime Refetch Error Logging Micro-Build

## Scope
- Change: Wrap `useOccupantDataSources.refetch` in try/catch; log background data refresh failures with `console.error` and re-throw so callers can surface them.
- Non-goals: UI error indicator for failed refetch (separate concern); changing refetch trigger intervals.

## Execution Contract
- Affects: `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts`
- Acceptance checks:
  - `refetch()` errors produce a `console.error('[useOccupantDataSources] background data refresh failed:', err)` log entry
  - Error is re-thrown (callers still receive it)
  - No change to hook return shape or loading state logic
- Validation commands: `nvm exec 22 pnpm --filter prime typecheck`
- Rollback note: Remove the try/catch wrapper added to the `refetch` callback; errors will again be silently discarded.

## Outcome Contract
- **Why:** Background data refresh failures in the Prime guest app were silently swallowed — no log, no signal, no way to diagnose stale-data incidents in error monitoring.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Refetch errors in `useOccupantDataSources` are logged via `console.error` so they appear in error monitoring and are diagnosable.
- **Source:** operator

## Build Evidence

**Status:** Already delivered — work was completed in commit `fb9e37369f` (2026-03-13) as part of the PRIME resilience wave.

**What was found:** `useOccupantDataSources.ts` lines 157–182 now contain:
```ts
const refetch = useCallback(async () => {
  try {
    await Promise.all([...]);
  } catch (err) {
    console.error('[useOccupantDataSources] background data refresh failed:', err);
    throw err;
  }
}, [...]);
```

**Typecheck:** Passes (`pnpm --filter prime typecheck` clean).

**Note:** The dispatch evidence described errors as "caught and discarded." The fix was shipped before this micro-build invocation. This document records the dispatch closure.
