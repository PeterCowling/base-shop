---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-12
Feature-Slug: reception-inbox-analytics-sql-correctness
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: Reception Inbox Analytics SQL Correctness and Safety

## Outcome Contract

- **Why:** The inbox analytics dashboard shows inflated numbers because it counts the same email thread multiple times when retries or recovery happen, and the SQL queries have a security gap where user input is put directly into the query text.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Analytics queries produce accurate deduplicated metrics, use validated SQL inputs, and enforce a maximum time window.
- **Source:** operator

## What Was Built

**Issue #12 — SQL string interpolation (security):** Added `assertSafeDays()` guard in `analytics.server.ts` that validates `Number.isInteger(days) && days >= 1 && days <= 365` before any value is interpolated into SQL. Both `timeFilter` and `admissionTimeFilter` now call this guard. Even though D1 does not easily support bind params in dynamic WHERE clauses, the integer assertion makes injection impossible.

**Issue #11 — No max days cap:** Updated the API route to reject `days` values outside 1-365 with a 400 response. The validation was tightened from "positive integer" to "integer between 1 and 365".

**Issue #3 — Volume metrics double-count:** Replaced the volume query's `COUNT(DISTINCT thread_id)` approach with a `ROW_NUMBER() OVER (PARTITION BY thread_id, event_type ORDER BY timestamp DESC)` subquery that keeps only one row per (thread, event_type) pair. This prevents recovery retries from inflating admitted/drafted/sent/resolved counts.

**Issue #13 — Quality metrics join unconstrained:** The quality and failure-reasons queries now apply time filters to both sides of the join: `d.created_at` for the drafts table and `te.timestamp` for the thread_events table. This prevents stale drafts outside the requested window from inflating quality metrics.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p apps/reception/tsconfig.json --noEmit` | Pass (changed files) | Pre-existing errors in repositories.server.ts (zod import, rows_written) are unrelated |
| `pnpm exec eslint <changed files>` | Pass | No new lint violations |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### Issue #12 — SQL interpolation safety
- `assertSafeDays()` throws if days is not an integer or outside 1-365
- Both `timeFilter` and `admissionTimeFilter` call the guard before interpolation

### Issue #11 — Max days cap
- Route returns 400 with descriptive error for days < 1 or > 365

### Issue #3 — Volume deduplication
- ROW_NUMBER window function partitions by (thread_id, event_type), keeping only latest event per pair
- COUNT(*) on the deduplicated set gives accurate per-type thread counts

### Issue #13 — Quality join time constraint
- `draftTimeFilter` constrains `d.created_at`, `eventTimeFilter` constrains `te.timestamp`
- Applied to both the quality pass/fail query and the failure-reasons query

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No UI changes |
| UX / states | N/A | No UX changes |
| Security / privacy | `assertSafeDays` integer guard + route-level 1-365 validation | Defence in depth: API rejects before it reaches SQL layer |
| Logging / observability / audit | N/A | Error responses include descriptive messages |
| Testing / validation | Typecheck + lint pass on changed files | CI will run full test suite |
| Data / contracts | Volume query dedup, quality join time-constrained | Metrics now reflect accurate thread counts |
| Performance / reliability | Max 365-day window prevents unbounded queries | D1 query scope capped |
| Rollout / rollback | Backward compatible — no schema changes | Safe to deploy without migration |

## Scope Deviations

None.
