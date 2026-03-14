# Prime Refetch Error Logging — Build Record

**Feature slug:** prime-refetch-error-logging
**Business:** BRIK
**Completed:** 2026-03-13
**Track:** code
**Deliverable type:** code-change

---

## Outcome Contract

- **Why:** Background data refresh failures in the Prime guest app were silently swallowed — no log, no signal, no way to diagnose stale-data incidents in error monitoring.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Refetch errors in `useOccupantDataSources` are logged via `console.error` so they appear in error monitoring and are diagnosable.
- **Source:** operator

---

## What Was Done

The `refetch` callback in `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` was wrapped in a `try/catch` block. On any rejection from the parallel refetch `Promise.all`, the catch block:

1. Calls `console.error('[useOccupantDataSources] background data refresh failed:', err)` — visible in error monitoring tools
2. Re-throws the error so callers still receive it

This was delivered as part of commit `fb9e37369f` (2026-03-13), the PRIME resilience wave covering PRIME-002, PRIME-004, PRIME-005, PRIME-006.

**Note:** Dispatch IDEA-DISPATCH-20260313200000-PRIME-005 was enqueued after the work was already committed. This micro-build run processes the queue closure.

---

## Engineering Coverage Evidence

**Validation:** `scripts/validate-engineering-coverage.sh docs/plans/prime-refetch-error-logging/micro-build.md`

```json
{
  "valid": true,
  "skipped": true,
  "artifactType": "micro-build",
  "track": "code",
  "errors": [],
  "warnings": ["No engineering coverage contract registered for artifact type \"micro-build\"."]
}
```

**Typecheck:** `pnpm --filter @apps/prime typecheck` — passes clean (no errors).

**Key file:** `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` lines 157–182 — refetch callback with try/catch, console.error, and re-throw.

---

## Workflow Telemetry Summary

- Feature slug: `prime-refetch-error-logging`
- Records: 1
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 1.00 | 35244 | 0 | 0.0% |

**Totals:**
- Context input bytes: 35244
- Artifact bytes: 0
- Modules counted: 1
- Deterministic checks counted: 1

**Gaps:** Stages missing records: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan (micro-build lane — no upstream stage docs).
