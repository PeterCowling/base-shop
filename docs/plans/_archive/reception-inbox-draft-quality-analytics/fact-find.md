---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Data
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-draft-quality-analytics
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-inbox-draft-quality-analytics/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312120000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Draft Quality Analytics Fact-Find Brief

## Scope
### Summary
The reception inbox records telemetry events for every step in the email draft lifecycle (admitted, drafted, sent, resolved, dismissed, recovery, etc.) in a D1 SQLite database, but provides no aggregated analytics or reporting surface. Staff and operators cannot see draft quality pass rates, average resolution time, volume trends, or admission rates. A draft-stats endpoint exists but is limited to acceptance rate only and is only exposed via MCP. This fact-find investigates what telemetry data already exists, what metrics are most valuable, how they can be computed, and where the analytics surface should live.

### Goals
- Map the complete set of telemetry events recorded and the data available in each
- Identify quality-check data stored alongside drafts
- Determine which metrics provide the most operational value
- Evaluate computation approaches (D1 SQL aggregations vs. API-computed vs. materialized)
- Recommend where the analytics surface should live in the UI

### Non-goals
- Alerting when quality rates drop below thresholds (adjacent-later)
- Weekly digest emails summarizing performance (adjacent-later)
- Redesigning the telemetry recording system itself

### Constraints & Assumptions
- Constraints:
  - Reception uses Cloudflare D1 (SQLite) as its database; no PostgreSQL aggregation features available
  - D1 has read performance limits; analytics queries must not block the operational inbox
  - Reception is a Cloudflare Worker with limited compute budget per request
- Assumptions:
  - Thread volume is low-to-moderate (hostel inbox, not high-volume SaaS)
  - D1 query performance is sufficient for simple aggregations over the event table at current scale

## Outcome Contract

- **Why:** Staff and operators have no way to tell whether the AI email drafts are getting better or worse over time. They cannot see how long it takes to resolve a guest enquiry, how many drafts pass quality checks, or whether email volume is trending up. Without this visibility, problems go unnoticed until a guest complains.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for inbox analytics, with required metrics, computation approach, and UI surface identified.
- **Source:** auto

## Discovery Contract Output

Not applicable: no `self_evolving.discovery_contract` present on this dispatch.

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/lib/inbox/telemetry.server.ts` -- telemetry recording layer; defines all event types and recording functions
- `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts` -- existing draft acceptance rate endpoint (SQL-based)
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` -- inbox UI entry point; currently shows only thread count and manual-draft/ready-to-send counts

### Key Modules / Files
1. `apps/reception/src/lib/inbox/repositories.server.ts` -- data layer with `ThreadEventRow`, `InboxDraftRow`, `AdmissionOutcomeRow` types and all CRUD operations including `listThreadEvents` with filtering by threadId, eventType, startTime, endTime
2. `apps/reception/src/lib/inbox/telemetry.server.ts` -- defines 12 canonical event types, critical vs. best-effort recording, `recordInboxEvent` and `listInboxEvents` functions
3. `apps/reception/src/lib/inbox/draft-pipeline.server.ts` -- draft generation pipeline; `QualityCheckResult` stored in `quality_json` on draft rows; includes `deriveDraftFailureReason` for failure codes
4. `apps/reception/src/lib/inbox/draft-core/quality-check.ts` -- quality check engine; produces `QualityCheckResult` with passed/failed_checks/failed_check_details/warnings/confidence/question_coverage
5. `apps/reception/src/lib/inbox/sync.server.ts` -- sync pipeline; records admission, drafted, guest_matched, thread_sync_error events; stores draft quality metadata in thread metadata_json
6. `apps/reception/src/lib/inbox/recovery.server.ts` -- recovery pipeline; records inbox_recovery events with outcome codes (recovered, error, skipped, max_retries, manual_flagged)
7. `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts` -- existing SQL aggregation for acceptance rate (sent_as_generated, sent_after_edit, regenerated, dismissed)
8. `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` -- records approved and sent events
9. `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` -- records draft_edited events on PUT
10. `apps/reception/migrations/0001_inbox_init.sql` -- D1 schema with tables: threads, messages, drafts, thread_events, admission_outcomes

### Patterns & Conventions Observed
- **Event-sourced telemetry**: All state transitions are recorded as `thread_events` rows with event_type, timestamp, metadata_json. This is the primary analytics data source. Evidence: `telemetry.server.ts` lines 11-25, all route handlers call `recordInboxEvent`.
- **Quality data stored on drafts**: `drafts.quality_json` contains the full `QualityCheckResult` (passed, failed_checks, warnings, confidence, question_coverage). Evidence: `repositories.server.ts` line 71, `sync.server.ts` lines 672-673.
- **Thread metadata as denormalized state**: `threads.metadata_json` stores lastDraftQualityPassed, draftFailureCode, draftFailureMessage, lastDraftTemplateSubject, recoveryAttempts, etc. Evidence: `sync.server.ts` lines 49-71.
- **MCP tool pattern**: Analytics exposed via MCP tools that call reception API endpoints. The `draft_acceptance_rate` MCP tool calls `/api/mcp/inbox/draft-stats`. Evidence: `packages/mcp-server/src/tools/draft-acceptance-rate.ts`.
- **SQL aggregation in route handlers**: The draft-stats endpoint uses CTEs with D1 SQL to classify thread outcomes from event sequences. Evidence: `draft-stats/route.ts` lines 65-117.

### Data & Contracts
- Types/schemas/events:
  - **ThreadEventRow**: `{ id: number, thread_id: string, event_type: string, actor_uid: string | null, timestamp: string, metadata_json: string | null }` -- evidence: `repositories.server.ts` lines 78-85
  - **InboxDraftRow**: includes `quality_json: string | null` and `interpret_json: string | null` -- evidence: `repositories.server.ts` lines 59-76
  - **AdmissionOutcomeRow**: `{ id, thread_id, decision, source, classifier_version, matched_rule, source_metadata_json, created_at }` -- evidence: `repositories.server.ts` lines 87-96
  - **QualityCheckResult**: `{ passed: boolean, failed_checks: string[], failed_check_details: Record<string,string[]>, warnings: string[], confidence: number, question_coverage: QuestionCoverageEntry[] }` -- evidence: `quality-check.ts` lines 27-34
  - **12 canonical event types**: admitted, auto_archived, review_later, drafted, draft_edited, approved, sent, resolved, dismissed, inbox_recovery, guest_matched, guest_match_not_found -- evidence: `telemetry.server.ts` lines 11-25
- Persistence:
  - D1 SQLite database with tables: threads, messages, drafts, thread_events, admission_outcomes, inbox_sync_state
  - Indexes on thread_events: `idx_thread_events_thread_time (thread_id, timestamp)` and `idx_thread_events_time (timestamp)` -- evidence: `0001_inbox_init.sql` lines 82-85
  - No index on `thread_events.event_type` alone -- analytics queries filtering by event_type will scan the time index
- API/contracts:
  - `GET /api/mcp/inbox/draft-stats?days=N` -- returns DraftStatsResponse with totalDrafted, sentAsGenerated, sentAfterEdit, regenerated, dismissed, rates, insufficient flag
  - `listThreadEvents(options)` supports filtering by threadId, eventType, startTime, endTime, limit, offset

### Dependency & Impact Map
- Upstream dependencies:
  - D1 database (Cloudflare) -- all analytics data lives here
  - `telemetry.server.ts` -- recording layer must continue working correctly
  - Gmail sync pipeline -- primary source of events
- Downstream dependents:
  - MCP `draft_acceptance_rate` tool depends on `/api/mcp/inbox/draft-stats`
  - InboxWorkspace UI currently does not consume analytics
- Likely blast radius:
  - New API route(s) for analytics -- low risk, additive
  - New UI component(s) -- contained within InboxWorkspace or sibling page
  - Possible new D1 index for event_type queries -- schema migration required

### Delivery & Channel Landscape
Not investigated: pure engineering/code deliverable.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (unit tests via CI governed runner)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: tests run in CI only per testing policy

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Telemetry recording | Unit | `apps/reception/src/lib/inbox/__tests__/telemetry.server.test.ts` | Tests recordInboxEvent routing (critical vs best-effort), metadata clamping |
| Sync pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Tests event recording calls during sync, error handling for telemetry failures |
| Recovery pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts` | Tests inbox_recovery event recording |
| Draft actions | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Tests send/resolve/dismiss event recording |
| Draft CRUD | Unit | `apps/reception/src/app/api/mcp/__tests__/inbox-draft.route.test.ts` | Tests draft_edited event recording |
| Draft pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` | Tests quality check result shapes |
| Presentation | Unit | `apps/reception/src/components/inbox/__tests__/presentation.test.ts` | Tests inbox presentation logic |

#### Coverage Gaps
- No tests for `draft-stats/route.ts` endpoint
- No integration tests for analytics SQL queries against D1
- No tests for quality_json parsing from draft rows

#### Testability Assessment
- Easy to test: SQL aggregation queries (can mock D1 or use in-memory SQLite), API route handlers, data transformation functions
- Hard to test: Full end-to-end from sync through analytics (requires real D1 + Gmail mocks)
- Test seams needed: Analytics computation functions should be extracted from route handlers for unit testability (same pattern as draft-stats existing code)

#### Recommended Test Approach
- Unit tests for: analytics computation functions, data aggregation logic, API response shapes
- Integration tests for: SQL query correctness against sample data sets
- Contract tests for: API response schema validation

### Recent Git History (Targeted)
Not investigated: recent commits do not affect inbox analytics (latest commits concern theming, CMS, and CI).

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | InboxWorkspace shows basic counts (threads, manual draft, ready-to-send) but no analytics panel. No charts or summary views exist. | No analytics UI exists. Need to decide tab vs. page vs. inline summary. | Yes -- UI approach is a primary decision |
| UX / states | Required | Draft-stats endpoint returns `insufficient: true` when no events exist. | Need empty states for all new metrics, loading states for analytics queries, error handling for D1 query failures. | Yes |
| Security / privacy | Required | All inbox API routes use `requireStaffAuth`. Draft-stats follows this pattern. | New analytics endpoints must require staff auth. No PII in aggregated metrics. | Yes -- ensure auth requirement |
| Logging / observability / audit | Required | Thread events are the audit trail. telemetry.server.ts has critical vs best-effort distinction. | Analytics computation errors should be logged. Consider adding an event for analytics access. | Yes |
| Testing / validation | Required | Draft-stats endpoint has zero test coverage. Telemetry recording is well-tested. | New analytics code needs unit tests for SQL queries and data transformations. | Yes -- testing approach needed |
| Data / contracts | Required | D1 schema has thread_events indexed on (thread_id, timestamp) and (timestamp). No event_type index. quality_json stored on draft rows. | May need new index on event_type for efficient aggregation. API response contract needs definition. | Yes -- index and API design |
| Performance / reliability | Required | D1 has per-request compute limits. Draft-stats endpoint runs complex CTEs. | Analytics queries on growing event table could hit D1 limits. Consider query complexity budget. | Yes -- query performance critical |
| Rollout / rollback | Required | Schema migrations are sequential (0001-0004). New indexes require a migration. | New migration for index. API endpoints are additive (no breaking changes). UI behind existing InboxWorkspace. | Moderate -- standard migration |

## Scope Signal

- Signal: right-sized
- Rationale: The telemetry data already exists in structured form with 12 event types and quality check results stored per draft. An existing draft-stats endpoint demonstrates the SQL aggregation pattern for D1. The scope is bounded: compute metrics from existing data, expose via API, surface in UI. No schema changes to the event recording system are needed -- only new read paths and possibly a D1 index.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Telemetry event types and metadata | Yes | None | No |
| Quality check data on drafts | Yes | None | No |
| D1 schema and indexes | Yes | No event_type index exists; analytics queries filtering by event_type may scan | No (advisory: index recommendation) |
| Existing draft-stats endpoint | Yes | None -- confirms feasible SQL aggregation pattern for D1 | No |
| InboxWorkspace UI structure | Yes | None -- clear extension point (tab or header summary) | No |
| MCP tool pattern | Yes | None -- existing draft_acceptance_rate demonstrates the pattern | No |
| Auth boundary | Yes | None -- requireStaffAuth on all inbox routes | No |
| Recovery and error telemetry | Yes | None -- inbox_recovery events have structured outcome codes | No |

## Questions

### Resolved
- Q: What telemetry events are currently recorded?
  - A: 12 canonical types: admitted, auto_archived, review_later, drafted, draft_edited, approved, sent, resolved, dismissed, inbox_recovery, guest_matched, guest_match_not_found. Each is stored in thread_events with thread_id, event_type, actor_uid, timestamp, and metadata_json.
  - Evidence: `apps/reception/src/lib/inbox/telemetry.server.ts` lines 11-25

- Q: What quality check data is available?
  - A: Each draft stores `quality_json` containing `QualityCheckResult` with: passed (bool), failed_checks (string[]), failed_check_details (Record), warnings (string[]), confidence (0-1), question_coverage (array). Thread metadata also stores lastDraftQualityPassed and draftFailureCode/draftFailureMessage.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/quality-check.ts` lines 27-34; `apps/reception/src/lib/inbox/sync.server.ts` lines 63-64

- Q: How could metrics be computed from existing data?
  - A: SQL aggregations over D1 thread_events table, following the same CTE pattern used by draft-stats/route.ts. D1 supports window functions, CTEs, and datetime functions. For time-series data, GROUP BY date(timestamp). For resolution time, compute difference between admitted and sent/resolved events per thread.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts` lines 65-117

- Q: Where should the analytics surface live?
  - A: Recommended: new tab or collapsible summary panel in InboxWorkspace. The workspace already has a header slot showing counts. A summary section could show key metrics inline (draft pass rate, avg resolution time, volume today/week). Full dashboard could be a separate tab. MCP tool should also be added for agent access.
  - Evidence: `apps/reception/src/components/inbox/InboxWorkspace.tsx` header slot at lines 158-217

- Q: Does an analytics endpoint already exist?
  - A: Yes -- `/api/mcp/inbox/draft-stats` computes acceptance rate metrics (sent_as_generated, sent_after_edit, regenerated, dismissed) from thread_events. It uses CTEs to classify thread outcomes. This can be extended or complemented with additional endpoints.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`

- Q: Is a new D1 index needed?
  - A: Likely yes. Current indexes are on (thread_id, timestamp) and (timestamp) alone. Analytics queries that filter by event_type (e.g., count all "admitted" events in a date range) would benefit from an index on (event_type, timestamp). At current scale this is advisory, not blocking.
  - Evidence: `apps/reception/migrations/0001_inbox_init.sql` lines 82-85

### Open (Operator Input Required)

- Q: What time granularity matters most for trend views -- daily, weekly, or both?
  - Why operator input is required: This is an operational preference that affects UI design and query complexity.
  - Decision impacted: Whether to show daily sparklines, weekly summaries, or selectable ranges.
  - Decision owner: Operator
  - Default assumption: Daily granularity with 7-day and 30-day roll-up summaries. Low risk -- both can be computed from the same data.

## Confidence Inputs
- Implementation: 85% -- existing draft-stats endpoint proves the D1 SQL aggregation pattern; the remaining work is extending queries and adding UI. Would reach 90% with a prototype query for resolution-time computation validated against real data.
- Approach: 80% -- SQL aggregations over D1 is the natural approach; no alternative infrastructure needed. Would reach 90% after confirming D1 query latency at production data volume.
- Impact: 75% -- operators have explicitly requested visibility into draft quality. Would reach 90% after confirming which specific metrics operators check most frequently.
- Delivery-Readiness: 80% -- all data sources exist, patterns are established, UI extension point is clear. Would reach 90% with a defined API contract and wireframe for the analytics panel.
- Testability: 80% -- SQL queries are testable with mock D1/in-memory SQLite, API routes follow established patterns. Would reach 90% with test fixtures for realistic event sequences.

Evidence basis for all scores: existing draft-stats endpoint demonstrates feasibility; 12 event types with structured metadata provide rich data; InboxWorkspace provides clear UI extension point.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| D1 query performance on growing event table | Low | Medium | Add event_type index; monitor query latency; consider periodic aggregation if needed |
| Analytics queries compete with inbox operations for D1 read budget | Low | Medium | Use separate API route with appropriate caching (stale-while-revalidate); queries are read-only |
| Quality_json parsing failures on malformed data | Low | Low | Defensive parsing with fallback to "unknown" quality status; log parsing errors |
| Scope creep into alerting/notification features | Medium | Low | Strict scope boundary: analytics display only, no alerts in v1 |

## Planning Constraints & Notes
- Must-follow patterns:
  - New API routes must use `requireStaffAuth` (established pattern in all inbox routes)
  - SQL queries should follow the CTE pattern from draft-stats/route.ts
  - MCP tool should follow the `draft_acceptance_rate` pattern (calls reception API endpoint)
  - Tests run in CI only per testing policy
- Rollout/rollback expectations:
  - New D1 migration for index -- standard sequential migration (0005)
  - API endpoints are additive, no breaking changes
  - UI additions within InboxWorkspace can be feature-toggled if needed
- Observability expectations:
  - Analytics query errors should be logged with `console.error` (established pattern)
  - Consider adding query latency logging for performance monitoring

## Suggested Task Seeds (Non-binding)
1. Add D1 migration for event_type index on thread_events
2. Create analytics computation module with functions for: volume by period, admission rates, draft quality pass rate, average resolution time, failure reason breakdown
3. Create API route `/api/mcp/inbox/analytics` returning aggregated metrics
4. Add MCP tool `draft_quality_analytics` wrapping the new endpoint
5. Build analytics summary component for InboxWorkspace (inline header metrics or collapsible panel)
6. Unit tests for analytics computation functions and API route

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Analytics API endpoint returning aggregated metrics
  - UI surface displaying key metrics in InboxWorkspace
  - MCP tool for agent access to analytics
  - Unit tests for computation logic and API routes
  - D1 migration for event_type index
- Post-delivery measurement plan:
  - Operator confirms analytics surface is useful (qualitative)
  - Query latency remains under 500ms on production data

## Evidence Gap Review

### Gaps Addressed
- Confirmed all 12 event types and their metadata shapes by reading telemetry.server.ts and all call sites
- Confirmed quality_json structure by reading quality-check.ts and draft creation code
- Confirmed D1 schema and indexes by reading all 4 migrations
- Confirmed existing analytics pattern by reading draft-stats/route.ts end-to-end
- Confirmed UI extension point by reading InboxWorkspace component

### Confidence Adjustments
- No downward adjustments needed; all primary evidence was found in the codebase
- Implementation confidence could be higher (90%+) after validating resolution-time SQL against real data, but 85% is appropriate for fact-find stage

### Remaining Assumptions
- D1 query performance is acceptable for analytics at current data volume (low-moderate hostel email traffic)
- Staff will primarily use the web UI for analytics (MCP tool is secondary access path)

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis`
