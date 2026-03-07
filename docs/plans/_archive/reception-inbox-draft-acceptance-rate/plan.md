---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07T13:45:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-draft-acceptance-rate
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Draft Acceptance Rate Plan

## Summary
Add a draft acceptance rate stats endpoint to the reception app that aggregates D1 thread_events data into actionable quality metrics. The endpoint computes sent-as-generated rate, edit rate, regeneration rate, and dismissal rate across configurable time windows (7d, 30d, all-time). Two tasks: aggregation query + API endpoint, then MCP tool registration.

## Active tasks
- [x] TASK-01: Draft stats aggregation endpoint
- [x] TASK-02: MCP tool for draft acceptance rate

## Goals
- Compute draft acceptance rate metrics from existing D1 telemetry data
- Expose metrics via reception API + MCP tool
- Track: sent-as-generated rate, edit rate, regeneration rate, dismissal rate

## Non-goals
- Automated template adjustment based on metrics
- Per-template breakdown
- UI dashboard

## Constraints & Assumptions
- Constraints:
  - D1 database queries (Cloudflare Workers runtime)
  - MCP tool must follow existing registration pattern
- Assumptions:
  - D1 handles event aggregation at hostel inbox volume (~100s of events)
  - Event sequence analysis provides meaningful acceptance signals

## Inherited Outcome Contract
- **Why:** No visibility into how often AI-generated drafts are accepted as-is, edited, or rejected — preventing quality measurement and targeted improvement.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Surface draft acceptance rate metrics via MCP tool so operators can track AI draft quality over time.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-draft-acceptance-rate/fact-find.md`
- Key findings used:
  - `thread_events` table records all lifecycle events with timestamps
  - Event types: drafted, draft_edited, approved, sent, resolved, dismissed
  - `listThreadEvents()` in `repositories.server.ts` supports event_type and time range filtering
  - MCP tool pattern: tool definition array + handler function (e.g. `draft-signal-stats.ts`)
  - Draft status at send time determines acceptance: `generated` = as-is, `edited` = modified

## Proposed Approach
- Chosen approach: Add `/api/mcp/inbox/draft-stats` GET endpoint that runs D1 aggregation queries on `thread_events` and `drafts` tables. The query groups threads by their draft lifecycle outcome (sent-as-generated, sent-after-edit, regenerated, dismissed). A separate MCP tool calls this endpoint to surface metrics to the agent.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Draft stats aggregation endpoint | 85% | S | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | MCP tool for draft acceptance rate | 85% | S | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Reception API endpoint |
| 2 | TASK-02 | TASK-01 | MCP tool wiring |

## Tasks

### TASK-01: Draft stats aggregation endpoint
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Endpoint created at `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`. Uses D1 CTEs to classify thread outcomes from `thread_events` (sent_as_generated, sent_after_edit, dismissed). Separate query counts regenerated threads (multiple `drafted` events). Supports `?days=N` time filter. Protected by `requireStaffAuth`. Returns `{ success: true, data: { totalDrafted, sentAsGenerated, sentAfterEdit, regenerated, dismissed, rates, days, insufficient } }`. Typecheck + lint clean. Commit `ee29b9b617`.
- **Affects:** `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`, `[readonly] apps/reception/src/lib/inbox/repositories.server.ts`, `[readonly] apps/reception/src/lib/inbox/telemetry.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% - new route following established pattern; D1 aggregation query needs care
  - Approach: 90% - clear data source and computation method
  - Impact: 85% - delivers the core metrics
- **Acceptance:**
  - GET `/api/mcp/inbox/draft-stats` returns JSON with draft acceptance metrics
  - Metrics include: `totalDrafted`, `sentAsGenerated`, `sentAfterEdit`, `regenerated`, `dismissed`
  - Rates computed as percentages of `totalDrafted`
  - Optional `days` query param for time window (default: all-time)
  - Protected by `requireStaffAuth`
  - Returns `{ success: true, data: { ... } }` envelope matching inbox API convention
- **Validation contract (TC-01):**
  - TC-01: GET `/api/mcp/inbox/draft-stats` returns 200 with metrics object
  - TC-02: GET `/api/mcp/inbox/draft-stats?days=7` filters to last 7 days
  - TC-03: Unauthenticated request returns 401
- **Execution plan:**
  1. Create `apps/reception/src/app/api/mcp/inbox/draft-stats/route.ts`
  2. Implement GET handler with `requireStaffAuth`
  3. Query D1: count `drafted` events (total), count threads where last event before `sent` was `draft_edited` (edited), count threads sent without `draft_edited` (as-generated), count `dismissed` events
  4. Use SQL GROUP BY on event sequences per thread for efficiency
  5. Return metrics object with counts and rates
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: clear D1 query patterns from existing repository functions
- **Edge Cases & Hardening:**
  - Zero events: return all zeros with `{ insufficient: true }` flag
  - `days` param validation: must be positive integer, default to all-time
- **What would make this >=90%:** Verify D1 query plan efficiency on production data
- **Rollout / rollback:**
  - Rollout: deploy with reception app
  - Rollback: remove route file; no side effects
- **Documentation impact:** None
- **Notes / references:** Classification logic: for each thread with a `drafted` event, look at the terminal state. If `sent` event exists AND no `draft_edited` between `drafted` and `sent` → sent-as-generated. If `sent` exists AND `draft_edited` exists between `drafted` and `sent` → sent-after-edit. If another `drafted` event follows → regenerated. If `dismissed` → dismissed.

### TASK-02: MCP tool for draft acceptance rate
- **Type:** IMPLEMENT
- **Deliverable:** New tool in `packages/mcp-server/src/tools/draft-acceptance-rate.ts`, registered in `packages/mcp-server/src/tools/index.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Tool `draft_acceptance_rate` created at `packages/mcp-server/src/tools/draft-acceptance-rate.ts`. Registered in `index.ts` with import, tool definitions spread, name set, and handler dispatch. Uses `RECEPTION_AUTH_TOKEN` env var for Firebase bearer auth. Accepts optional `days` parameter. Calls reception API endpoint and formats results with both summary text and raw metrics. Error handling for missing auth, API failures, and unreachable reception app. Typecheck + lint clean. Commit `ee29b9b617`.
- **Affects:** `packages/mcp-server/src/tools/draft-acceptance-rate.ts`, `packages/mcp-server/src/tools/index.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - follows existing tool pattern exactly
  - Approach: 90% - standard MCP tool registration
  - Impact: 85% - makes metrics available to agent
- **Acceptance:**
  - `draft_acceptance_rate` MCP tool registered and listed in tool index
  - Tool accepts optional `days` parameter (7, 30, or omit for all-time)
  - Tool calls reception API endpoint and returns formatted metrics
  - Tool returns useful error message if reception app is unreachable
- **Validation contract (TC-02):**
  - TC-01: `draft_acceptance_rate` tool is registered in tool index
  - TC-02: Tool handler calls correct reception endpoint URL
  - TC-03: TypeScript compiles without errors
- **Execution plan:**
  1. Create `packages/mcp-server/src/tools/draft-acceptance-rate.ts` with tool definition + handler
  2. Handler fetches `https://reception.hostel-positano.com/api/mcp/inbox/draft-stats?days=<N>` with auth headers
  3. Register tool in `packages/mcp-server/src/tools/index.ts`
  4. Format response for agent consumption (include both raw counts and percentage rates)
- **Consumer tracing:**
  - New MCP tool `draft_acceptance_rate`: consumed by Claude agent via MCP protocol. No other code consumer.
  - Registration in `index.ts`: adds to tool listing; no existing tool modified.
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: follows `draft-signal-stats.ts` pattern
- **Edge Cases & Hardening:**
  - Reception app offline: return descriptive error
  - Auth headers: use MCP auth header pattern from existing inbox tools
- **What would make this >=90%:** End-to-end test with running reception app
- **Rollout / rollback:**
  - Rollout: rebuild MCP server package
  - Rollback: remove tool file + deregister
- **Documentation impact:** None
- **Notes / references:** Must handle auth. The reception app uses `requireStaffAuth` — the MCP tool needs to pass the correct auth headers. Check how existing MCP tools authenticate with the reception app.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| D1 aggregation slow | Low | Medium | Time-range filter limits query scope |
| Insufficient events | Medium | Low | Show `insufficient: true` flag |

## Observability
- Logging: None: read-only endpoint
- Metrics: The endpoint itself IS the metrics surface
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Draft stats API endpoint returns acceptance metrics
- [ ] MCP tool callable and returns formatted results
- [ ] `pnpm typecheck` passes

## Decision Log
- 2026-03-07: Chose separate API endpoint + MCP tool (vs embedding query in MCP server) because D1 access requires Cloudflare Workers runtime
- 2026-03-07: Chose event-sequence analysis over draft-status snapshot because event sequences capture the full lifecycle

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Draft stats endpoint | Yes | None | No |
| TASK-02: MCP tool | Yes (TASK-01 endpoint available) | None | No |

## Delivery Rehearsal
- **Data:** TASK-01 reads from existing `thread_events` table (populated by normal inbox operations). No missing data.
- **Process/UX:** No user-visible flow changes. API-only.
- **Security:** TASK-01 uses `requireStaffAuth` — same auth as existing inbox endpoints.
- **UI:** No UI changes.

## Overall-confidence Calculation
- TASK-01: 85% * 1 (S) = 85
- TASK-02: 85% * 1 (S) = 85
- Overall = (85 + 85) / 2 = 85%
