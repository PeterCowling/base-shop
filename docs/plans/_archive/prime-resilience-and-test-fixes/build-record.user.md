---
Type: Build-Record
Feature-Slug: prime-resilience-and-test-fixes
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-002,PRIME-004,PRIME-005,PRIME-006
Business: BRIK
Completed: 2026-03-13
Execution-Track: code
artifact: build-record
---

# Prime Resilience and Test Fixes — Build Record

## What Was Done

Wave of 4 independent micro-builds (no file overlap):

**PRIME-002 — Check-in code resilience**
- `useCheckInCode.ts`: parses API response body for `code` field and caches it directly before calling `refetch()`. If refetch fails, the code survives via cache.
- `codeCache.ts`: `getCachedCheckInCode` now evicts entries older than 24 hours (TTL constant added). Stale offline codes no longer served.

**PRIME-004 — Firebase startup env guard**
- `firebase.ts`: added client-side check on module load that logs `console.error` listing any missing required env vars (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`). No impact on happy path.

**PRIME-005 — Refetch error logging**
- `useOccupantDataSources.ts`: `refetch` now wraps `Promise.all` in try/catch, logs `console.error` with context, and re-throws so callers can handle it. Failures are no longer silent.

**PRIME-006 — Confidence cue + TC-03**
- `PreArrival.json` (EN): added `confidenceCue.readyForArrival` = "You are ready for arrival"
- `ReadinessDashboard.tsx`: renders confidence cue when `completedCount === totalItems`
- `value-framing.test.tsx`: TC-03 unskipped (`it.skip` → `it`)

Typecheck passed clean for all changes.

## Outcome Contract

- **Why:** Four independent resilience and quality gaps in the prime app: generated check-in codes could be silently lost on refetch failure; offline cache had no expiry; Firebase misconfiguration produced cryptic runtime failures; background refetch errors were silently swallowed; a confidence cue feature was unimplemented with its test skipped.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Check-in code generation is resilient to refetch failure; offline cache expires after 24h; Firebase misconfiguration is caught at startup; background refetch failures are logged; confidence cue renders when all 5 items complete; TC-03 passes.
- **Source:** operator

## Engineering Coverage Evidence

4 isolated code changes in 6 files. Typecheck (`pnpm --filter @apps/prime typecheck`) passed. validate-engineering-coverage.sh: valid: true, skipped: true (micro-build). Bug scan: 0 findings.

## Workflow Telemetry Summary

- Stage: lp-do-build (direct-dispatch micro-build lane)
- Dispatches: PRIME-002, PRIME-004, PRIME-005, PRIME-006
- Deterministic check: validate-engineering-coverage.sh passed
