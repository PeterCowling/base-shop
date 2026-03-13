---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-checkin-code-resilience
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-002
Related-Plan: none
---

# Prime Check-In Code Resilience Micro-Build

## Scope
- Change: Add direct API-response caching in `useCheckInCode.generateCode()` so a refetch failure does not lose a newly generated code. Add 24-hour TTL enforcement to `getCachedCheckInCode()` so stale offline codes are evicted. Add TC-04 test for TTL expiry path.
- Non-goals: Changes to the check-in code API, authentication logic, or any other Prime feature.

## Execution Contract
- Affects:
  - `apps/prime/src/hooks/useCheckInCode.ts` — cache API response before refetch (already delivered in fb9e37369f)
  - `apps/prime/src/lib/arrival/codeCache.ts` — 24-hour TTL on getCachedCheckInCode (already delivered in fb9e37369f)
  - `apps/prime/src/hooks/__tests__/useCheckInCode.offline-cache.test.ts` — add TC-04 TTL expiry test
- Acceptance checks:
  - TC-04 covers the TTL expiry code path: `getCachedCheckInCode` returns `null` for entries older than 24 hours and removes them from storage.
  - Existing TC-01, TC-02, TC-03 continue to pass.
  - TypeScript types unchanged; no new lint errors.
- Validation commands:
  - `pnpm typecheck` (prime app)
  - `pnpm lint` (prime app)
  - CI: governed Jest run — `apps/prime` test suite
- Rollback note: Revert test addition only; core fixes from fb9e37369f should not be rolled back.

## Outcome Contract
- **Why:** A guest taps to generate their check-in code — the system creates it successfully, but then fails to reload it from the database. The guest sees an error and has no code, even though the code exists. Separately, a guest who opens the app while offline may see a check-in code from a previous stay that is no longer valid, with no way to know it has expired.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After successful code generation, the API response is cached directly so refetch failure does not lose the code. Cache entries have a TTL so expired codes are not served offline.
- **Source:** operator

## Build Notes

The two code changes described in the dispatch were already delivered in commit `fb9e37369f` (2026-03-13) as part of the "resilience wave" that addressed PRIME-002, PRIME-004, PRIME-005, and PRIME-006. Specifically:

- `useCheckInCode.ts` lines 123–128: caches `responseData.code` via `cacheCheckInCode()` before calling `refetch()`.
- `codeCache.ts` line 8 + lines 34–36: defines `CACHE_TTL_MS = 24 * 60 * 60 * 1000` and evicts entries older than TTL.

The micro-build task is to add the missing TC-04 test that directly exercises the TTL expiry path (currently untested).

## Task

### TASK-01 — Add TC-04 TTL expiry test
- **Type:** IMPLEMENT
- **Status:** Complete (2026-03-13)
- **Execution-Track:** code
- **Affects:** `apps/prime/src/hooks/__tests__/useCheckInCode.offline-cache.test.ts`
- **Confidence:** 95

**Build evidence:**
- Added `describe('TC-04: getCachedCheckInCode returns null for expired entries', ...)` with two cases: entry older than 24h returns null and removes item; entry within 24h returns the code.
- TypeScript compiles clean, no lint errors.
- All TC-01 through TC-04 pass in CI.
