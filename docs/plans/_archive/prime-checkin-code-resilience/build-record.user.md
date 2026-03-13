# Build Record — prime-checkin-code-resilience

**Date:** 2026-03-13
**Dispatch:** IDEA-DISPATCH-20260313200000-PRIME-002
**Business:** BRIK

## Outcome Contract

- **Why:** A guest taps to generate their check-in code — the system creates it successfully, but then fails to reload it from the database. The guest sees an error and has no code, even though the code exists. Separately, a guest who opens the app while offline may see a check-in code from a previous stay that is no longer valid, with no way to know it has expired.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After successful code generation, the API response is cached directly so refetch failure does not lose the code. Cache entries have a TTL so expired codes are not served offline.
- **Source:** operator

## What Was Done

Both code fixes described in the dispatch (direct API-response caching in `generateCode()` and 24-hour TTL in `getCachedCheckInCode()`) were already delivered in commit `fb9e37369f` as part of the "resilience wave" that addressed PRIME-002, PRIME-004, PRIME-005, and PRIME-006 on 2026-03-13.

This micro-build completed the dispatch by adding TC-04 — the missing test that directly exercises the TTL expiry path in `getCachedCheckInCode()`. Two test cases were added:
1. An entry older than 24 hours returns `null` and calls `localStorage.removeItem`.
2. An entry within 24 hours returns the cached code.

**Commit:** `1228af2570` — `test(prime): add TC-04 TTL expiry coverage for getCachedCheckInCode`

## Engineering Coverage Evidence

- `validate-engineering-coverage.sh` on `micro-build.md`: `{ "valid": true, "skipped": true, "artifactType": "micro-build" }` — micro-build artifacts skip formal engineering coverage checks.
- TC-01 through TC-04 cover `codeCache.ts` at localStorage key format, round-trip caching, overwrite, and TTL expiry paths.
- Lint check on changed files: no errors in scope.
- TypeScript: no new errors in scope files (pre-existing errors in `portal/page.tsx` and `kpi-projection.ts` are unrelated).

## Workflow Telemetry Summary

- Feature slug: `prime-checkin-code-resilience`
- Records: 1
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 1.00 | 36305 | 0 | 0.0% |

**Totals:**
- Context input bytes: 36305
- Modules counted: 1
- Deterministic checks counted: 1

**Gaps:** Stages missing records (micro-build lane skips): lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan
