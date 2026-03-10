---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-draft-acceptance-rate
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-draft-acceptance-rate/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307140500-9051
Trigger-Why: No visibility into how often AI-generated drafts are accepted as-is, edited, or rejected — preventing quality measurement and targeted improvement.
Trigger-Intended-Outcome: "type: measurable | statement: Surface draft acceptance rate metrics via MCP tool so operators can track AI draft quality over time | source: operator"
---

# Reception Inbox Draft Acceptance Rate Fact-Find Brief

## Scope
### Summary
The reception inbox generates AI email drafts for staff review. Staff can send drafts as-is, edit then send, regenerate, or dismiss threads. Currently there is no aggregated view of how often drafts are accepted without edits vs modified vs rejected. The `thread_events` table already records all lifecycle events (drafted, draft_edited, approved, sent, resolved, dismissed) — the data exists but no tool computes acceptance metrics from it.

With the draft edit tracking work just completed (IDEA-DISPATCH-20260307140500-9050), we now also have `original_plain_text` preserved on drafts, enabling diff-based analysis of edit magnitude.

### Goals
- Compute draft acceptance rate metrics from existing D1 telemetry data
- Expose metrics via an MCP tool (consistent with existing `draft_signal_stats` pattern)
- Track: sent-as-generated rate, edit rate, regeneration rate, dismissal rate

### Non-goals
- Automated template adjustment based on metrics (future work)
- Per-template or per-category breakdown (future refinement)
- UI dashboard for acceptance metrics (future)

### Constraints & Assumptions
- Constraints:
  - D1 database queries (Cloudflare Workers runtime)
  - MCP tool must follow existing tool registration pattern in `packages/mcp-server`
  - Data source is `thread_events` table, not the MCP server's `draft-signal-events.jsonl`
- Assumptions:
  - Event sequence `drafted → sent` (no `draft_edited` in between) = accepted as-is
  - Event sequence `drafted → draft_edited → sent` = edited before send
  - Event sequence `drafted → drafted` (regeneration) = rejected/regenerated
  - `thread_events` table has sufficient historical data for meaningful metrics

## Outcome Contract
- **Why:** No visibility into how often AI-generated drafts are accepted as-is, edited, or rejected — preventing quality measurement and targeted improvement.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Surface draft acceptance rate metrics via MCP tool so operators can track AI draft quality over time. Target: tool returns acceptance/edit/regeneration/dismissal rates within 30 days of deployment.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/lib/inbox/telemetry.server.ts` — event recording system with all lifecycle events
- `packages/mcp-server/src/tools/draft-signal-stats.ts` — existing MCP tool pattern for draft statistics

### Key Modules / Files
- `apps/reception/src/lib/inbox/repositories.server.ts` — `listThreadEvents()` function for querying events, `ThreadEventRow` type
- `apps/reception/src/lib/inbox/telemetry.server.ts` — event types: drafted, draft_edited, approved, sent, resolved, dismissed
- `packages/mcp-server/src/utils/signal-events.ts` — existing signal event processing utilities
- `packages/mcp-server/src/tools/index.ts` — MCP tool registration

### Patterns & Conventions Observed
- MCP tools follow a consistent pattern: tool definition array + handler function — evidence: `draft-signal-stats.ts`
- Draft signal stats reads from local JSONL file — evidence: `draft-signal-stats.ts:6-12`
- The acceptance rate tool should instead query D1 via the BOS agent API or a new reception API endpoint

### Data & Contracts
- Types/schemas/events:
  - `ThreadEventRow`: id, thread_id, event_type, actor_uid, timestamp, metadata_json
  - Event types: admitted, auto_archived, review_later, drafted, draft_edited, approved, sent, resolved, dismissed
  - Draft statuses: generated, edited, approved, sent
- Persistence:
  - D1 `thread_events` table — records every lifecycle transition with timestamp
  - D1 `drafts` table — now includes `original_plain_text` for diff computation
- API/contracts:
  - `listThreadEvents()` supports filtering by event_type, time range, and thread_id
  - MCP tools registered in `packages/mcp-server/src/tools/index.ts`

### Dependency & Impact Map
- Upstream dependencies:
  - D1 `thread_events` table data (populated by existing inbox operations)
  - `original_plain_text` column (from just-completed IDEA-DISPATCH-20260307140500-9050)
- Downstream dependents:
  - MCP tool consumers (Claude agent, operator queries)
  - Future self-improving system (could use acceptance rate to trigger template adjustments)
- Likely blast radius:
  - New API endpoint in reception app (query + aggregate events)
  - New MCP tool in `packages/mcp-server` (calls reception API)
  - No changes to existing code paths

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (CI-only per `docs/testing-policy.md`)
- Commands: `pnpm -w run test:governed`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Draft signal stats MCP tool | Unit | `packages/mcp-server/src/__tests__/` | Tests for signal event counting |
| Thread events repository | None | — | No tests for listThreadEvents |

#### Testability Assessment
- Easy to test: aggregation logic (pure function over event arrays), MCP tool handler
- Hard to test: D1 query (requires miniflare)

#### Recommended Test Approach
- Unit tests for: acceptance rate computation function (pure function taking event arrays)

## Questions
### Resolved
- Q: Should the tool query D1 directly or go through the reception app API?
  - A: Through a new reception API endpoint. The MCP server runs as a local Node process and cannot access D1 directly — it needs to call the reception app's HTTP API. This follows the same pattern as other MCP inbox tools that proxy through `/api/mcp/inbox`.
  - Evidence: `packages/mcp-server/src/tools/` — inbox-related tools call HTTP endpoints

- Q: What time window should metrics cover?
  - A: Last 7 days, last 30 days, and all-time. This matches operator mental models for weekly and monthly review.
  - Evidence: Standard reporting cadence; `draft_signal_stats` returns aggregate counts without time windowing — we improve on this.

- Q: How do we classify "accepted as-is" vs "edited"?
  - A: By checking the draft `status` at send time. If status is `generated` when sent → accepted as-is. If status is `edited` when sent → edited before send. We can also check if `original_plain_text` differs from `plain_text` for a more precise signal.
  - Evidence: `draft/route.ts` sets status to "edited", `send/route.ts` reads current status

### Open (Operator Input Required)
No open questions — all decisions resolved from available evidence.

## Confidence Inputs
- Implementation: 85% — new API endpoint + MCP tool following established patterns
  - Evidence: clear patterns in existing tools and API routes
  - >=90: verify D1 query performance for aggregation
- Approach: 90% — event-based computation is the natural approach given existing data
  - >=90: already there
- Impact: 80% — enables quality tracking but value depends on regular review
  - >=90: integrate into weekly operator briefing
- Delivery-Readiness: 85% — all code paths identified, patterns clear
  - >=90: verify MCP tool registration works end-to-end
- Testability: 80% — aggregation logic easily testable, D1 queries need mocking
  - >=90: add miniflare-based integration test

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| D1 aggregation query too slow on large event tables | Low | Medium | Add time-range filter; D1 handles moderate data volumes well |
| Insufficient historical events for meaningful metrics | Medium | Low | Metrics will improve over time; show "insufficient data" for small samples |
| MCP tool registration conflicts | Very Low | Low | Follow existing pattern exactly |

## Planning Constraints & Notes
- Must-follow patterns:
  - MCP tool registration in `packages/mcp-server/src/tools/index.ts`
  - Reception API route at `/api/mcp/inbox/stats` or similar
  - D1 queries via repository functions
- Rollout/rollback expectations:
  - Additive — new endpoint and tool, no changes to existing code
  - Safe to deploy independently

## Suggested Task Seeds (Non-binding)
1. Add draft acceptance rate query endpoint to reception app (`/api/mcp/inbox/draft-stats`)
2. Add `draft_acceptance_rate` MCP tool to packages/mcp-server
3. Wire up MCP tool to call reception API endpoint

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - New API endpoint returns acceptance/edit/regeneration/dismissal rates
  - New MCP tool registered and callable
  - Rates computed from D1 thread_events data
- Post-delivery measurement plan:
  - Call `draft_acceptance_rate` MCP tool and verify it returns metrics
  - Compare manual event counting against tool output

## Scope Signal
- **Signal:** right-sized
- **Rationale:** New endpoint + new MCP tool with clear data source. No architectural decisions. Dependencies satisfied (edit tracking already deployed). Bounded to read-only metrics — no side effects.

## Evidence Gap Review
### Gaps Addressed
- Confirmed event data exists in D1 thread_events table for all lifecycle transitions
- Confirmed MCP tool pattern from existing `draft_signal_stats` tool
- Confirmed reception API proxy pattern for D1 access from MCP server

### Confidence Adjustments
- No adjustments needed

### Remaining Assumptions
- D1 aggregation queries perform adequately for event volumes (hostel inbox = low volume)

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| D1 event data availability | Yes | None | No |
| MCP tool registration pattern | Yes | None | No |
| Reception API route pattern | Yes | None | No |
| Edit tracking dependency | Yes | None — just completed | No |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-draft-acceptance-rate --auto`
