---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-draft-quality-analytics
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-inbox-draft-quality-analytics/analysis.md
---

# Reception Inbox Draft Quality Analytics Plan

## Summary
Add a comprehensive analytics surface to the reception inbox so that staff can see draft quality pass rates, average resolution time, email volume, and admission rates. The implementation follows the chosen approach from analysis: a new `/api/mcp/inbox/analytics` endpoint backed by an extracted computation module (`analytics.server.ts`), a new MCP tool wrapping the endpoint, an inline summary in the InboxWorkspace header, and a D1 migration for a performance index. All work is additive and does not modify the existing draft-stats endpoint.

## Active tasks
- [x] TASK-01: D1 migration for event_type index
- [x] TASK-02: Analytics computation module
- [x] TASK-03: Analytics API route
- [x] TASK-04: Unit tests for analytics module and route
- [x] TASK-05: MCP tool for inbox analytics
- [x] TASK-06: InboxWorkspace analytics summary UI

## Goals
- Give staff visibility into draft quality trends, resolution times, and volume
- Keep analytics queries within D1 per-request compute limits
- Follow existing codebase patterns (SQL in route handlers, MCP tool wrapping API)
- Provide both UI and MCP access paths

## Non-goals
- Real-time alerting or threshold notifications (adjacent-later)
- Weekly digest emails (adjacent-later)
- Redesigning the telemetry recording system
- Charts or sparklines (v1 is text-only metrics)

## Constraints & Assumptions
- Constraints:
  - D1 (SQLite) is the only database; no external analytics service
  - Cloudflare Worker per-request compute budget limits query complexity
  - Tests run in CI only per testing policy
- Assumptions:
  - Thread volume is low-to-moderate (hostel email traffic)
  - D1 read performance is adequate for aggregations at this scale

## Inherited Outcome Contract

- **Why:** Staff and operators have no way to tell whether the AI email drafts are getting better or worse over time. They cannot see how long it takes to resolve a guest enquiry, how many drafts pass quality checks, or whether email volume is trending up. Without this visibility, problems go unnoticed until a guest complains.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for inbox analytics, with required metrics, computation approach, and UI surface identified.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/reception-inbox-draft-quality-analytics/analysis.md`
- Selected approach inherited:
  - Option B: New analytics endpoint with extracted computation module
- Key reasoning used:
  - Follows existing codebase patterns (route handler + SQL in D1)
  - Keeps metric group queries bounded within D1 compute limits
  - Produces independently testable computation functions
  - Additive -- does not modify the existing draft-stats endpoint

## Selected Approach Summary
- What was chosen:
  - New `/api/mcp/inbox/analytics` endpoint with selective metric groups (volume, quality, resolution, admission)
  - Extracted `analytics.server.ts` computation module with one function per metric group
  - New MCP tool `inbox_analytics` wrapping the endpoint
  - Inline summary section in InboxWorkspace header showing 4 key metrics
  - D1 migration 0005 for event_type index
- Why planning is not reopening option selection:
  - Analysis compared three options (extend draft-stats, new module, cron-based) and decisively chose Option B with clear elimination rationale for the others

## Fact-Find Support
- Supporting brief: `docs/plans/reception-inbox-draft-quality-analytics/fact-find.md`
- Evidence carried forward:
  - 12 canonical event types in telemetry.server.ts
  - quality_json on draft rows stores full QualityCheckResult
  - Existing draft-stats/route.ts demonstrates CTE pattern for D1 SQL
  - listThreadEvents supports filtering by eventType, startTime, endTime
  - InboxWorkspace header slot is the UI extension point
  - requireStaffAuth mandatory on all inbox API routes

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | D1 migration for event_type index | 90% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Analytics computation module | 85% | M | Complete (2026-03-12) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Analytics API route | 85% | S | Complete (2026-03-12) | TASK-02 | TASK-04, TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Unit tests for analytics module and route | 85% | M | Complete (2026-03-12) | TASK-02, TASK-03 | - |
| TASK-05 | IMPLEMENT | MCP tool for inbox analytics | 85% | S | Complete (2026-03-12) | TASK-03 | - |
| TASK-06 | IMPLEMENT | InboxWorkspace analytics summary UI | 80% | M | Complete (2026-03-12) | TASK-03 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Inline summary section in InboxWorkspace header | TASK-06 | Text-only metrics, no charts in v1 |
| UX / states | Loading skeleton, empty state, error fallback | TASK-06 | Follows existing InboxWorkspace patterns |
| Security / privacy | requireStaffAuth on new route | TASK-03 | Same pattern as all inbox API routes |
| Logging / observability / audit | console.error for query failures; per-metric error isolation | TASK-02, TASK-03 | Follows existing error logging pattern |
| Testing / validation | Unit tests for computation functions and API route | TASK-04 | Tests run in CI only |
| Data / contracts | New D1 index; typed response contract; metric group types | TASK-01, TASK-02, TASK-03 | API response types defined in analytics module |
| Performance / reliability | Selective metric computation; event_type index for query performance | TASK-01, TASK-02 | Metrics parameter allows partial fetch |
| Rollout / rollback | Additive migration and endpoints; no breaking changes | TASK-01, TASK-03 | Rollback: revert migration + remove route |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | D1 migration -- must be first |
| 2 | TASK-02 | TASK-01 | Computation module |
| 3 | TASK-03 | TASK-02 | API route |
| 4 | TASK-04, TASK-05, TASK-06 | TASK-03 | Tests, MCP tool, and UI can run in parallel |

## Tasks

### TASK-01: D1 migration for event_type index
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `apps/reception/migrations/0005_thread_events_event_type_index.sql`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/migrations/0005_thread_events_event_type_index.sql` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% - Standard D1 CREATE INDEX statement; exact same pattern as 0001_inbox_init.sql indexes
  - Approach: 95% - Adding an index is the standard way to optimize queries filtering by event_type
  - Impact: 90% - Directly enables performant analytics queries; without it, full table scans on growing event table
- **Acceptance:**
  - Migration file exists at `apps/reception/migrations/0005_thread_events_event_type_index.sql`
  - Creates composite index on `(event_type, timestamp)` for thread_events table
  - Uses `CREATE INDEX IF NOT EXISTS` for idempotency
- **Engineering Coverage:**
  - UI / visual: N/A - schema-only change
  - UX / states: N/A - schema-only change
  - Security / privacy: N/A - index does not expose new data
  - Logging / observability / audit: N/A - schema-only change
  - Testing / validation: N/A - migration tested by D1 applying it; no unit test needed
  - Data / contracts: Required - new index on thread_events(event_type, timestamp)
  - Performance / reliability: Required - index optimizes analytics queries
  - Rollout / rollback: Required - migration is additive; rollback is DROP INDEX
- **Validation contract (TC-XX):**
  - TC-01: Migration file contains valid SQL CREATE INDEX statement -> D1 applies without error
  - TC-02: Index name follows existing naming convention (idx_thread_events_*) -> consistent with 0001 indexes
- **Execution plan:** Write migration SQL file with CREATE INDEX IF NOT EXISTS
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: standard D1 migration pattern
- **Edge Cases & Hardening:** IF NOT EXISTS guard prevents failure on re-run
- **What would make this >=90%:** Already at 90%. Confirmed by inspecting existing migration pattern in 0001_inbox_init.sql.
- **Rollout / rollback:**
  - Rollout: wrangler d1 migrations apply
  - Rollback: DROP INDEX IF EXISTS idx_thread_events_event_type_time
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/migrations/0001_inbox_init.sql` lines 82-85

### TASK-02: Analytics computation module
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `apps/reception/src/lib/inbox/analytics.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/src/lib/inbox/analytics.server.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - SQL patterns confirmed in draft-stats/route.ts; resolution time query uses julianday() which is standard SQLite. Held-back test at 85: no single unknown would drop below 80 because all SQL functions needed (GROUP BY, julianday, COUNT, CASE) are confirmed available in D1/SQLite.
  - Approach: 90% - Extracted module pattern matches codebase convention; one function per metric group is testable and selective
  - Impact: 85% - These metrics are what operators requested; all data sources exist
- **Acceptance:**
  - Module exports 4 metric computation functions: `computeVolumeMetrics`, `computeQualityMetrics`, `computeResolutionMetrics`, `computeAdmissionMetrics`
  - Each function accepts `{ db: D1Database, days?: number }` and returns typed metric objects
  - Module exports TypeScript types for each metric group: `VolumeMetrics`, `QualityMetrics`, `ResolutionMetrics`, `AdmissionMetrics`
  - `computeVolumeMetrics` returns: total threads, admitted count, drafted count, sent count, resolved count for the period
  - `computeQualityMetrics` returns: total drafted, quality passed count, quality failed count, pass rate %, top 3 failure reasons
  - `computeResolutionMetrics` returns: average time from admitted to sent (hours), average time from admitted to resolved (hours), median resolution time (hours), count of resolved threads
  - `computeAdmissionMetrics` returns: total processed, admitted count/rate, auto-archived count/rate, review-later count/rate
  - All functions handle empty data gracefully (return zero counts, null for averages)
  - Module uses `"server-only"` import guard
- **Engineering Coverage:**
  - UI / visual: N/A - backend module
  - UX / states: N/A - backend module; empty data handling in the functions
  - Security / privacy: N/A - module is internal; auth enforced at route level
  - Logging / observability / audit: Required - console.error for unexpected query failures
  - Testing / validation: Required - unit tests in TASK-04
  - Data / contracts: Required - typed response shapes; SQL queries use event_type index from TASK-01
  - Performance / reliability: Required - each query is bounded per metric group; selective computation avoids computing all metrics when only one is needed
  - Rollout / rollback: N/A - new file; rollback is delete
- **Validation contract (TC-XX):**
  - TC-01: computeVolumeMetrics with events in range -> returns correct counts per status
  - TC-02: computeVolumeMetrics with no events -> returns all zeros
  - TC-03: computeQualityMetrics with mix of passed/failed drafts -> returns correct pass rate
  - TC-04: computeQualityMetrics with no drafted events -> returns zero total, null pass rate
  - TC-05: computeResolutionMetrics with admitted->sent sequences -> returns correct average hours
  - TC-06: computeResolutionMetrics with no resolved threads -> returns null averages
  - TC-07: computeAdmissionMetrics with mixed outcomes -> returns correct rates
  - TC-08: days parameter filters events to correct time window
- **Execution plan:**
  1. Create `analytics.server.ts` with `"server-only"` import
  2. Define TypeScript types for each metric group
  3. Implement `computeVolumeMetrics` using COUNT + GROUP BY on thread_events
  4. Implement `computeQualityMetrics` using draft-stats CTE pattern for quality pass/fail
  5. Implement `computeResolutionMetrics` using julianday() difference between admitted and sent/resolved events
  6. Implement `computeAdmissionMetrics` using COUNT on admission_outcomes table
  7. Each function takes `{ db, days? }` and applies time filter when days is provided
- **Planning validation (required for M/L):**
  - Checks run: Confirmed julianday() available in D1/SQLite; confirmed CTE pattern works in draft-stats/route.ts; confirmed admission_outcomes table has decision column
  - Validation artifacts: `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts` (CTE pattern), `apps/reception/migrations/0001_inbox_init.sql` (schema)
  - Unexpected findings: None
- **Consumer tracing:**
  - `computeVolumeMetrics` -> consumed by TASK-03 route handler and TASK-04 tests
  - `computeQualityMetrics` -> consumed by TASK-03 route handler and TASK-04 tests
  - `computeResolutionMetrics` -> consumed by TASK-03 route handler and TASK-04 tests
  - `computeAdmissionMetrics` -> consumed by TASK-03 route handler and TASK-04 tests
  - Exported types -> consumed by TASK-03 route handler, TASK-04 tests, TASK-05 MCP tool response, TASK-06 UI component
  - No existing consumers affected (new module)
- **Scouts:** None: all SQL functions confirmed available in D1
- **Edge Cases & Hardening:**
  - Division by zero when computing rates (guard with totalX > 0 check)
  - Null/missing timestamps in event data (COALESCE or skip rows)
  - Threads with admitted event but no subsequent events (excluded from resolution time)
- **What would make this >=90%:** Prototype the resolution time query against production D1 data to validate julianday() performance on real data.
- **Rollout / rollback:**
  - Rollout: deploy with reception app
  - Rollback: remove file
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts` for SQL aggregation approach
  - Schema: `apps/reception/migrations/0001_inbox_init.sql` for table/column names

### TASK-03: Analytics API route
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `apps/reception/src/app/api/mcp/inbox/analytics/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/src/app/api/mcp/inbox/analytics/route.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 90% - Exact same route handler pattern as draft-stats/route.ts; requireStaffAuth, query param parsing, delegating to computation functions
  - Approach: 90% - Standard Next.js API route following established inbox API conventions
  - Impact: 85% - Endpoint is the data source for both UI and MCP tool
- **Acceptance:**
  - Route at `GET /api/mcp/inbox/analytics`
  - Requires staff auth via `requireStaffAuth`
  - Accepts `metrics` query param (comma-separated: volume,quality,resolution,admission; defaults to all)
  - Accepts `days` query param (positive integer; optional, defaults to all-time)
  - Returns `{ success: true, data: { volume?, quality?, resolution?, admission?, period: { days } } }`
  - Returns 400 for invalid days param
  - Returns 401/403 for unauthenticated requests
  - Catches and returns errors via `inboxApiErrorResponse`
- **Engineering Coverage:**
  - UI / visual: N/A - API route
  - UX / states: N/A - API route; error responses follow existing pattern
  - Security / privacy: Required - requireStaffAuth enforced; no PII in response
  - Logging / observability / audit: Required - errors logged via inboxApiErrorResponse pattern
  - Testing / validation: Required - unit tests in TASK-04
  - Data / contracts: Required - response types match analytics module exports
  - Performance / reliability: Required - selective metric computation via metrics param
  - Rollout / rollback: Required - additive route; rollback is delete directory
- **Validation contract (TC-XX):**
  - TC-01: GET with valid auth and no params -> returns all 4 metric groups
  - TC-02: GET with metrics=volume,quality -> returns only volume and quality
  - TC-03: GET with days=7 -> returns metrics filtered to last 7 days
  - TC-04: GET with invalid days=-1 -> returns 400
  - TC-05: GET without auth -> returns 401
  - TC-06: Computation error -> returns error via inboxApiErrorResponse
- **Execution plan:**
  1. Create route directory `apps/reception/src/app/api/mcp/inbox/analytics/`
  2. Create `route.ts` with GET handler
  3. Add requireStaffAuth check
  4. Parse metrics and days query params
  5. Call selective computation functions from analytics.server.ts
  6. Return JSON response with requested metric groups
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: identical pattern to draft-stats/route.ts
- **Edge Cases & Hardening:**
  - Unknown metric names in metrics param -> ignore unknown, process valid ones
  - Empty metrics param -> treat as all metrics
- **What would make this >=90%:** Already near 90; would reach it with a working prototype.
- **Rollout / rollback:**
  - Rollout: deploy with reception app
  - Rollback: delete route directory
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`
  - Auth: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`

### TASK-04: Unit tests for analytics module and route
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `apps/reception/src/lib/inbox/__tests__/analytics.server.test.ts` and `apps/reception/src/app/api/mcp/__tests__/inbox-analytics.route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/src/lib/inbox/__tests__/analytics.server.test.ts` (new), `apps/reception/src/app/api/mcp/__tests__/inbox-analytics.route.test.ts` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Test patterns established in existing inbox test files; D1 mock pattern from sync.server.test.ts and inbox-actions.route.test.ts
  - Approach: 90% - Unit tests with mocked D1 is the standard approach for reception inbox tests
  - Impact: 85% - Tests validate correctness of SQL aggregations and API contract
- **Acceptance:**
  - Test file for analytics module covers all 4 computation functions
  - Test file for API route covers auth, param parsing, error handling
  - Tests follow existing jest mock patterns (mock D1, mock auth)
  - Tests cover: happy path with data, empty data, time-filtered data, error cases
  - All tests pass in CI governed runner
- **Engineering Coverage:**
  - UI / visual: N/A - test code
  - UX / states: N/A - test code
  - Security / privacy: Required - test that auth is enforced on the route
  - Logging / observability / audit: N/A - test code
  - Testing / validation: Required - this IS the testing task
  - Data / contracts: Required - tests validate response shapes match types
  - Performance / reliability: N/A - performance tested by running against real D1 in production
  - Rollout / rollback: N/A - test files
- **Validation contract (TC-XX):**
  - TC-01: analytics.server.test.ts has at least 8 test cases covering TC-01 through TC-08 from TASK-02
  - TC-02: inbox-analytics.route.test.ts has at least 6 test cases covering TC-01 through TC-06 from TASK-03
  - TC-03: All tests pass via `pnpm -w run test:governed`
- **Execution plan:**
  1. Create `analytics.server.test.ts` following pattern from `sync.server.test.ts` (D1 mocking)
  2. Write test cases for each computation function: happy path, empty data, time window
  3. Create `inbox-analytics.route.test.ts` following pattern from `inbox-actions.route.test.ts`
  4. Write test cases for route: auth, params, response shapes, errors
- **Planning validation (required for M/L):**
  - Checks run: Confirmed D1 mock pattern in `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`; confirmed route test pattern in `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`
  - Validation artifacts: existing test files as pattern references
  - Unexpected findings: None
- **Consumer tracing:** None: test files have no downstream consumers
- **Scouts:** None: established test patterns
- **Edge Cases & Hardening:** None: test code
- **What would make this >=90%:** Working green tests confirmed in CI.
- **Rollout / rollback:**
  - Rollout: committed with code
  - Rollback: delete test files
- **Documentation impact:** None
- **Notes / references:**
  - Mock pattern: `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`
  - Route test pattern: `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`

### TASK-05: MCP tool for inbox analytics
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `packages/mcp-server/src/tools/inbox-analytics.ts` and registration in `packages/mcp-server/src/tools/index.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `packages/mcp-server/src/tools/inbox-analytics.ts` (new), `packages/mcp-server/src/tools/index.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Exact same pattern as draft-acceptance-rate.ts: resolve config, call reception API, format response
  - Approach: 90% - Standard MCP tool wrapping a reception API endpoint
  - Impact: 85% - Provides agent access to analytics; secondary access path after UI
- **Acceptance:**
  - Tool named `inbox_analytics` registered in MCP server
  - Accepts optional `metrics` (string) and `days` (number) parameters
  - Calls `GET /api/mcp/inbox/analytics` on reception app with auth token
  - Returns formatted text summary and raw metrics JSON
  - Handles missing RECEPTION_AUTH_TOKEN with clear error message
  - Handles reception API errors gracefully
- **Engineering Coverage:**
  - UI / visual: N/A - MCP tool
  - UX / states: N/A - MCP tool; error messages for missing config
  - Security / privacy: Required - uses RECEPTION_AUTH_TOKEN for auth
  - Logging / observability / audit: N/A - MCP tool; errors returned to caller
  - Testing / validation: Required - test follows existing pattern in `packages/mcp-server/src/__tests__/`
  - Data / contracts: Required - tool input/output schema must match MCP conventions
  - Performance / reliability: N/A - delegates to reception API
  - Rollout / rollback: Required - additive; rollback is remove from index.ts and delete file
- **Validation contract (TC-XX):**
  - TC-01: Tool call with no args -> returns all metrics summary
  - TC-02: Tool call with metrics="quality" and days=7 -> returns filtered quality metrics
  - TC-03: Missing RECEPTION_AUTH_TOKEN -> returns clear error
  - TC-04: Reception API returns error -> returns formatted error
- **Execution plan:**
  1. Create `inbox-analytics.ts` following `draft-acceptance-rate.ts` pattern
  2. Define tool schema with optional metrics and days params
  3. Implement handler: resolve config, call reception API, format response
  4. Register in `index.ts`: import tools array + handler, spread into allTools, add to handler dispatch
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: exact pattern from draft-acceptance-rate.ts
- **Edge Cases & Hardening:** Missing env var produces clear error message (not cryptic failure)
- **What would make this >=90%:** Working tool call against live reception API.
- **Rollout / rollback:**
  - Rollout: rebuild MCP server
  - Rollback: remove registration from index.ts and delete file
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `packages/mcp-server/src/tools/draft-acceptance-rate.ts`
  - Registration: `packages/mcp-server/src/tools/index.ts`

### TASK-06: InboxWorkspace analytics summary UI
- **Type:** IMPLEMENT
- **Deliverable:** code-change at `apps/reception/src/components/inbox/AnalyticsSummary.tsx` and update to `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/src/components/inbox/AnalyticsSummary.tsx` (new), `apps/reception/src/components/inbox/InboxWorkspace.tsx`, `apps/reception/src/services/useInbox.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - InboxWorkspace header slot is clear extension point; fetch pattern established in useInbox. Held-back test at 80: no single unresolved unknown would drop below 80 because the header slot layout, data fetching pattern, and design-system atoms are all confirmed present.
  - Approach: 85% - Inline summary in existing workspace follows the established reception app UI patterns
  - Impact: 80% - Staff see metrics at a glance; value depends on metrics being meaningful at current data volume. Held-back test at 80: no single unknown would drop below 80 because the telemetry data already exists and the metrics are clearly operational.
- **Acceptance:**
  - New `AnalyticsSummary` component renders 4 key metrics inline: draft pass rate %, avg resolution time, volume today, admission rate %
  - Component fetches from `/api/mcp/inbox/analytics` on mount
  - Loading state: shows skeleton placeholders while fetching
  - Empty state: shows "No data yet" when insufficient=true or all metrics are zero
  - Error state: silently hides analytics summary (does not break inbox functionality)
  - Component is rendered in InboxWorkspace header below the existing counts line
  - Uses existing design-system atoms (no new dependencies)
  - **Expected user-observable behavior:**
    - [ ] Staff sees 4 metrics displayed below the inbox thread count when data exists
    - [ ] Metrics show loading placeholders briefly on page load
    - [ ] If no telemetry data exists, the summary shows a "No data yet" message instead of zeros
    - [ ] If the analytics API fails, the inbox still works normally (analytics section hidden)
    - [ ] Metrics refresh when the user clicks the existing Refresh button
- **Engineering Coverage:**
  - UI / visual: Required - inline summary section with 4 metric values; uses design-system atoms; text-only (no charts)
  - UX / states: Required - loading skeleton, empty state, error fallback (hide section)
  - Security / privacy: N/A - component uses authenticated fetch from useInbox pattern; no PII displayed
  - Logging / observability / audit: N/A - client component; errors silently degrade
  - Testing / validation: Required - component test for rendering states
  - Data / contracts: Required - consumes analytics API response types
  - Performance / reliability: Required - fetch on mount with graceful degradation; does not block inbox rendering
  - Rollout / rollback: Required - additive component; rollback is remove from InboxWorkspace
- **Validation contract (TC-XX):**
  - TC-01: Component renders with analytics data -> shows 4 metrics with correct values
  - TC-02: Component renders during loading -> shows skeleton placeholders
  - TC-03: Component renders with empty/insufficient data -> shows "No data yet" message
  - TC-04: Component renders when API fails -> analytics section hidden, inbox works normally
  - TC-05: Refresh button click triggers analytics re-fetch
- **Post-build QA loop:**
  - Run `lp-design-qa` on InboxWorkspace page
  - Run `tools-ui-contrast-sweep` on InboxWorkspace page
  - Run `tools-ui-breakpoint-sweep` on InboxWorkspace page
  - Auto-fix and re-verify until no Critical/Major issues remain
- **Execution plan:**
  1. Create `AnalyticsSummary.tsx` as a client component
  2. Add analytics fetch function (or extend useInbox hook with analytics state)
  3. Render 4 metric cards/values with loading/empty/error states
  4. Insert `<AnalyticsSummary />` into InboxWorkspace headerSlot below existing counts
  5. Wire refresh to re-fetch analytics alongside thread list refresh
- **Planning validation (required for M/L):**
  - Checks run: Confirmed InboxWorkspace headerSlot structure at lines 158-217; confirmed useInbox hook pattern at `apps/reception/src/services/useInbox.ts`; confirmed buildMcpAuthHeaders available for authenticated fetch
  - Validation artifacts: InboxWorkspace.tsx, useInbox.ts
  - Unexpected findings: None
- **Consumer tracing:**
  - `AnalyticsSummary` component -> consumed by InboxWorkspace only
  - Analytics API response types -> consumed from analytics.server.ts types (or re-declared client-side)
  - useInbox hook changes (if any) -> consumed by InboxWorkspace (existing consumer)
  - No existing consumers modified beyond InboxWorkspace importing the new component
- **Scouts:** None: InboxWorkspace structure confirmed
- **Edge Cases & Hardening:**
  - API timeout: use AbortController with 5s timeout; degrade gracefully
  - Stale data after sync: re-fetch analytics when syncInbox completes
  - Very small numbers (e.g., 1 thread resolved): display absolute values alongside percentages
- **What would make this >=90%:** Working component rendered in InboxWorkspace with real data from the analytics endpoint.
- **Rollout / rollback:**
  - Rollout: deploy with reception app
  - Rollback: remove AnalyticsSummary import from InboxWorkspace
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/components/inbox/InboxWorkspace.tsx` headerSlot
  - Fetch: `apps/reception/src/services/useInbox.ts` for auth headers

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: D1 migration | Yes -- migrations directory exists, sequential numbering confirmed (0001-0004) | None | No |
| TASK-02: Analytics module | Yes -- TASK-01 provides index; D1Database type available; telemetry types importable from repositories.server.ts | None | No |
| TASK-03: API route | Yes -- TASK-02 provides computation functions; requireStaffAuth importable from _shared/staff-auth; inboxApiErrorResponse available from api-route-helpers | None | No |
| TASK-04: Unit tests | Yes -- TASK-02 and TASK-03 provide code to test; D1 mock pattern confirmed in existing tests; jest config exists | None | No |
| TASK-05: MCP tool | Yes -- TASK-03 provides endpoint; draft-acceptance-rate.ts pattern confirmed; index.ts registration pattern confirmed | None | No |
| TASK-06: UI component | Yes -- TASK-03 provides endpoint; InboxWorkspace header slot exists; design-system atoms available; buildMcpAuthHeaders available for auth | None | No |

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Resolution time SQL performance on D1 | Low | Medium | Test query against production D1 during TASK-02; fall back to simpler count-only metrics if performance is poor |
| D1 compute budget for multi-metric requests | Low | Medium | Metrics parameter allows selective computation; each metric group query is bounded |
| No charting library for trend visualization | Low | Low | v1 is text-only metrics; sparklines deferred to future enhancement |

## Observability
- Logging: console.error for analytics query failures (established pattern)
- Metrics: analytics endpoint response includes counts that serve as operational metrics
- Alerts/Dashboards: None in v1 (adjacent-later scope)

## Acceptance Criteria (overall)
- [ ] Staff can see 4 key metrics (draft pass rate, avg resolution time, volume, admission rate) in the InboxWorkspace header
- [ ] Analytics data is available via MCP tool `inbox_analytics`
- [ ] Analytics API endpoint returns correct aggregated metrics from thread_events and admission_outcomes
- [ ] Empty/loading/error states are handled gracefully in the UI
- [ ] All new code has unit test coverage
- [ ] D1 event_type index exists for query performance

## Decision Log
- 2026-03-12: Analysis chose Option B (new analytics endpoint + module) over extending draft-stats or adding cron. Planning follows this decision without reopening.
- 2026-03-12: v1 UI is text-only metrics (no charts/sparklines). Charts deferred as future enhancement.
- 2026-03-12: Default time granularity is daily with 7/30 day summaries. Operator can adjust post-delivery.

## Overall-confidence Calculation
- TASK-01: 90% * S(1) = 90
- TASK-02: 85% * M(2) = 170
- TASK-03: 85% * S(1) = 85
- TASK-04: 85% * M(2) = 170
- TASK-05: 85% * S(1) = 85
- TASK-06: 80% * M(2) = 160
- Sum weights: 1+2+1+2+1+2 = 9
- Overall-confidence: 760/9 = 84.4% -> 85%
