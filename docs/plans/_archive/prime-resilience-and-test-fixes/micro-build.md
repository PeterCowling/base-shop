---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-resilience-and-test-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-002,IDEA-DISPATCH-20260313200000-PRIME-004,IDEA-DISPATCH-20260313200000-PRIME-005,IDEA-DISPATCH-20260313200000-PRIME-006
Related-Plan: none
---

# Prime Resilience and Test Fixes — Micro-Build

Batched wave of 4 independent, bounded micro-builds with no file overlap.

## PRIME-002 — Check-in code resilience

### Scope
- Cache generated code from API response body before calling `refetch()`, so a refetch failure does not lose the code.
- Add 24-hour TTL to `getCachedCheckInCode()` — expired cache entries are evicted and return null.

### Execution Contract
- Affects: `apps/prime/src/hooks/useCheckInCode.ts`, `apps/prime/src/lib/arrival/codeCache.ts`
- Acceptance checks: response body is parsed for `code` field and cached before refetch; `getCachedCheckInCode` returns null for entries older than 24h.

## PRIME-004 — Firebase startup env guard

### Scope
- Log a clear `console.error` at client startup when any of the 3 required Firebase env vars are missing.

### Execution Contract
- Affects: `apps/prime/src/services/firebase.ts`
- Acceptance checks: missing vars produce an actionable error log; no change to happy path behavior.

## PRIME-005 — Refetch error logging

### Scope
- Wrap `Promise.all` in `useOccupantDataSources.refetch` in a try/catch that logs and re-throws.

### Execution Contract
- Affects: `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts`

## PRIME-006 — Confidence cue + unskip TC-03

### Scope
- Add `confidenceCue.readyForArrival` key to EN PreArrival translations.
- Render confidence cue in `ReadinessDashboard` when `completedCount === totalItems`.
- Remove `it.skip` from TC-03.

### Execution Contract
- Affects: `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`, `apps/prime/public/locales/en/PreArrival.json`, `apps/prime/src/components/pre-arrival/__tests__/value-framing.test.tsx`

## Outcome Contract
- **Why:** Four independent resilience and quality gaps in the prime app, each bounded to one or two files: (1) generated check-in codes could be silently lost on refetch failure and stale offline codes had no expiry; (2) missing Firebase config caused cryptic runtime failures with no startup warning; (3) background data refresh failures were silently discarded; (4) a confidence cue feature had no implementation and its test was skipped.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Check-in code generation is resilient to refetch failure; offline cache expires after 24h; Firebase misconfiguration is caught at startup with a clear message; background refetch failures are logged; all 5 checklist items complete → confidence cue renders; TC-03 passes.
- **Source:** operator
