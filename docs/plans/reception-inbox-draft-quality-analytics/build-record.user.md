---
Type: Build-Record
Status: Complete
Domain: Data
Last-reviewed: "2026-03-12"
Feature-Slug: reception-inbox-draft-quality-analytics
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
---

# Build Record: Reception Inbox Draft Quality Analytics

## Outcome Contract

- **Why:** Staff and operators have no way to tell whether the AI email drafts are getting better or worse over time. They cannot see how long it takes to resolve a guest enquiry, how many drafts pass quality checks, or whether email volume is trending up. Without this visibility, problems go unnoticed until a guest complains.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for inbox analytics, with required metrics, computation approach, and UI surface identified.
- **Source:** auto

## What Was Built

Added a comprehensive analytics surface to the reception inbox across 6 tasks. A D1 migration (0005) adds a composite index on `thread_events(event_type, timestamp)` to support performant analytics queries. An extracted computation module (`analytics.server.ts`) provides four independent metric functions: volume (thread counts by status), quality (draft pass/fail rates with top failure reasons), resolution (average time from admission to send/resolve), and admission (admit/auto-archive/review-later rates from admission_outcomes). Each function accepts optional `days` and `db` parameters for time filtering and testability.

A new API route (`GET /api/mcp/inbox/analytics`) exposes these metrics with `requireStaffAuth`, supporting selective metric groups via a `metrics` query parameter and time filtering via `days`. A corresponding MCP tool (`inbox_analytics`) wraps the endpoint for agent access, formatting results into a readable text summary.

An `AnalyticsSummary` client component renders four key metrics (quality pass rate, average time to send, 30-day volume, admission rate) inline in the InboxWorkspace header. The component handles loading, empty, and error states gracefully -- errors silently hide the analytics section without breaking inbox functionality. The summary refreshes when the user clicks Refresh or Sync.

Unit tests cover both the computation module (10 test cases) and the API route (8 test cases), including auth enforcement, parameter validation, selective metrics, and error handling.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| TypeScript typecheck (reception) | Pass | Clean, no errors |
| TypeScript typecheck (mcp-server) | Pass | Clean, no errors |
| Engineering coverage validation | Pass | All 8 rows covered |

## Workflow Telemetry Summary

None: workflow telemetry not recorded in this resumed session.

## Validation Evidence

### TASK-01: D1 migration for event_type index
- TC-01: Migration file at `apps/reception/migrations/0005_thread_events_event_type_index.sql` contains `CREATE INDEX IF NOT EXISTS idx_thread_events_event_type_time ON thread_events(event_type, timestamp)`
- TC-02: Index name follows `idx_thread_events_*` convention matching 0001 indexes

### TASK-02: Analytics computation module
- TC-01 through TC-08: Covered by unit tests in `analytics.server.test.ts` -- volume counts, empty data, quality pass rates, null handling, resolution averages, admission rates, selective metrics, days filtering

### TASK-03: Analytics API route
- TC-01 through TC-06: Covered by unit tests in `inbox-analytics.route.test.ts` -- full metrics, selective metrics, days filtering, invalid days 400, auth 401, computation error 502

### TASK-04: Unit tests
- TC-01: `analytics.server.test.ts` contains 10 test cases covering all 4 computation functions
- TC-02: `inbox-analytics.route.test.ts` contains 8 test cases covering auth, params, responses, errors

### TASK-05: MCP tool
- TC-01 through TC-04: Tool registered as `inbox_analytics` in index.ts; accepts metrics and days params; calls reception API with auth; handles missing token and API errors

### TASK-06: InboxWorkspace analytics summary UI
- TC-01 through TC-05: AnalyticsSummary component renders 4 metrics, shows skeleton during loading, shows empty message when no data, hides on error, refreshes on Refresh/Sync button clicks

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | AnalyticsSummary.tsx renders 4 metric cards in InboxWorkspace header | Text-only, no charts in v1 |
| UX / states | Loading skeleton, empty state ("No analytics data yet"), error fallback (hide section) | Follows InboxWorkspace patterns |
| Security / privacy | requireStaffAuth on analytics route; tested in route test TC-05 | Same auth as all inbox routes |
| Logging / observability / audit | Errors returned via inboxApiErrorResponse (502); client errors silently degrade | Existing error pattern |
| Testing / validation | analytics.server.test.ts (10 tests), inbox-analytics.route.test.ts (8 tests) | Tests run in CI only |
| Data / contracts | Typed AnalyticsResult, MetricGroup; D1 index on (event_type, timestamp) | Response types exported from module |
| Performance / reliability | Selective metric computation via metrics param; event_type index; AbortController in UI | Each metric group is a bounded query |
| Rollout / rollback | All additive (new files + new migration); rollback: revert migration + delete files | No breaking changes |

## Scope Deviations

None. All work stayed within planned scope.
