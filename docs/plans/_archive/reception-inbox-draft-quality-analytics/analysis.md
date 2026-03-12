---
Type: Analysis
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-draft-quality-analytics
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-inbox-draft-quality-analytics/fact-find.md
Related-Plan: docs/plans/reception-inbox-draft-quality-analytics/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Inbox Draft Quality Analytics -- Analysis

## Decision Frame

### Summary
The reception inbox has 12 telemetry event types and per-draft quality check results stored in D1, but no aggregated analytics surface. A single draft-stats endpoint exists for acceptance rates only. The decision is how to expose comprehensive analytics (volume, quality, resolution time, admission rates) to staff via UI and to agents via MCP, choosing between extending the existing endpoint pattern versus building a new analytics module architecture.

### Goals
- Give staff visibility into draft quality trends, resolution times, and volume
- Keep analytics queries within D1 per-request compute limits
- Follow existing codebase patterns (SQL in route handlers, MCP tool wrapping API)
- Provide both UI and MCP access paths

### Non-goals
- Real-time alerting or threshold notifications (adjacent-later)
- Weekly digest emails (adjacent-later)
- Redesigning the telemetry recording system

### Constraints & Assumptions
- Constraints:
  - D1 (SQLite) is the only database; no external analytics service
  - Cloudflare Worker per-request compute budget limits query complexity
  - No client-side charting library currently used in reception app
- Assumptions:
  - Thread volume is low-to-moderate (hostel email traffic, estimated hundreds per month not thousands)
  - D1 read performance is adequate for aggregations at this scale
  - Staff will primarily use the web UI; MCP is a secondary access path for agents

## Inherited Outcome Contract

- **Why:** Staff and operators have no way to tell whether the AI email drafts are getting better or worse over time. They cannot see how long it takes to resolve a guest enquiry, how many drafts pass quality checks, or whether email volume is trending up. Without this visibility, problems go unnoticed until a guest complains.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for inbox analytics, with required metrics, computation approach, and UI surface identified.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-draft-quality-analytics/fact-find.md`
- Key findings used:
  - 12 canonical event types in telemetry.server.ts provide complete lifecycle coverage
  - `quality_json` on draft rows stores full QualityCheckResult (passed, failed_checks, warnings, confidence)
  - Existing `draft-stats/route.ts` demonstrates CTE-based SQL aggregation pattern for D1
  - `listThreadEvents` already supports filtering by eventType, startTime, endTime
  - InboxWorkspace header slot is the natural UI extension point
  - No index on event_type alone; (thread_id, timestamp) and (timestamp) indexes exist
  - `requireStaffAuth` is mandatory on all inbox API routes

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Pattern consistency | Following existing route handler + SQL pattern reduces review burden and risk | High |
| Query performance on D1 | Compute budget is limited per Worker request; queries must stay fast | High |
| Development speed | Low-complexity change on an established codebase; should not be over-engineered | Medium |
| Extensibility | Future metrics and alerting should be addable without rearchitecting | Medium |
| UI simplicity | Staff need quick visibility, not a full analytics dashboard | Medium |
| Testability | Analytics logic must be testable independent of D1 | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Extend draft-stats endpoint | Add new metric groups (volume, quality, resolution time, admission) as additional fields on the existing `/api/mcp/inbox/draft-stats` endpoint. Single API call returns everything. | Simplest change; one endpoint; existing MCP tool needs minor update only | Single endpoint grows complex; all metrics computed in every call even when not needed; the existing CTE query is already substantial | Query complexity could exceed D1 per-request limits as metrics accumulate | No -- rejected |
| B: New analytics endpoint with extracted computation module | Create `/api/mcp/inbox/analytics` with a separate analytics computation module (`analytics.server.ts`). Route handler delegates to extracted functions. Accepts `metric` query param to request specific metric groups. | Clean separation; testable computation functions; selective metric loading; follows same route pattern as draft-stats | Slightly more files than Option A; new route needs its own auth setup | Low -- follows established patterns | Yes |
| C: Pre-computed analytics via scheduled Worker | Use a Cloudflare Cron Trigger to periodically compute and cache aggregated analytics in a new D1 table. API reads from cache. | Eliminates per-request computation cost; handles scale | Introduces new infrastructure (cron trigger); data is stale (not real-time); more complex deployment; overkill for current volume | Over-engineering for current scale; adds cron management | No -- rejected |

### Option A Elimination Rationale
The existing draft-stats endpoint already contains a substantial CTE query (lines 65-117). Adding volume trends, quality breakdowns, resolution time calculations, and admission rates into a single endpoint would make the query unmanageable and risk hitting D1 compute limits. The single-endpoint approach also forces computing all metrics on every call, which is wasteful when the UI only needs a summary or the MCP tool only needs one metric group.

### Option C Elimination Rationale
Pre-computed analytics via cron trigger is architecturally sound for high-volume systems but introduces unnecessary infrastructure complexity for a hostel inbox processing hundreds of emails per month. The added deployment surface (cron config in wrangler.toml, cache invalidation, staleness management) is disproportionate to the problem. If volume grows significantly in future, this approach can be reconsidered -- the extracted computation module from Option B would serve as a clean migration path to a cron-based system.

## Engineering Coverage Comparison

| Coverage Area | Option A (Extend draft-stats) | Option B (New analytics endpoint + module) | Chosen implication |
|---|---|---|---|
| UI / visual | Same UI regardless of backend | Same UI regardless of backend | UI approach is independent of backend option; inline summary in InboxWorkspace header is the recommendation for both |
| UX / states | Single endpoint means one loading state | Selective metrics allow partial loading; empty/loading states per metric group | Option B allows better UX with independent loading per metric |
| Security / privacy | Existing requireStaffAuth on draft-stats | New route needs requireStaffAuth (trivial, established pattern) | Trivial -- copy existing auth pattern |
| Logging / observability / audit | Single endpoint, single failure point | Per-metric-group error isolation; finer-grained logging | Option B isolates failures better |
| Testing / validation | Monolithic query is harder to test | Extracted functions are independently testable | Option B is significantly more testable |
| Data / contracts | Single response contract grows complex | Separate metric group types; clear response contract per group | Option B keeps contracts clean and extensible |
| Performance / reliability | All metrics computed on every call; single query could exceed D1 limits | Selective computation; each metric stays within D1 budget | Option B reduces per-request compute risk |
| Rollout / rollback | Single endpoint change; rollback reverts everything | New endpoint is additive; can be deployed independently | Option B has safer rollout -- existing draft-stats is untouched |

## Chosen Approach

- **Recommendation:** Option B -- New analytics endpoint with extracted computation module
- **Why this wins:** It follows existing codebase patterns (route handler + SQL in D1), keeps each metric group's query complexity bounded within D1 limits, produces independently testable computation functions, and is safely additive (does not modify the existing draft-stats endpoint). The extracted module also provides a clean migration path to pre-computed analytics if volume grows.
- **What it depends on:** D1 SQLite supporting the required date arithmetic for resolution time (confirmed: `julianday()` is available). InboxWorkspace being extendable with a summary section (confirmed: header slot exists).

### API Design
- **Endpoint:** `GET /api/mcp/inbox/analytics?metrics=volume,quality,resolution,admission&days=30`
- **Metrics parameter:** comma-separated list of metric groups to compute. Omit for all.
- **Days parameter:** lookback window (optional, defaults to all-time).
- **Response shape:** `{ success: true, data: { volume?: VolumeMetrics, quality?: QualityMetrics, resolution?: ResolutionMetrics, admission?: AdmissionMetrics, period: { days: number | null } } }`

### UI Design
- Inline summary section in InboxWorkspace header (below the existing counts line)
- Shows 4 key metrics: draft pass rate %, avg resolution time, volume today, admission rate %
- Data fetched on workspace mount via the new analytics endpoint
- Loading skeleton while fetching; graceful empty state when no data

### Rejected Approaches
- **Option A (Extend draft-stats)** -- rejected because the single-endpoint approach creates an unmanageable monolithic query that risks exceeding D1 compute limits as metrics accumulate. Testability and extensibility suffer.
- **Option C (Pre-computed via cron)** -- rejected as over-engineering for current volume. The extracted computation module from Option B provides a clean migration path if this is ever needed.

### Open Questions (Operator Input Required)

- Q: What time granularity matters most for trend views -- daily, weekly, or both?
  - Why operator input is required: This is an operational preference that affects UI layout.
  - Planning impact: Affects whether the summary shows daily sparklines or weekly roll-ups. Default assumption (daily with 7/30 day summaries) is safe to proceed with and can be adjusted post-delivery.

## Planning Handoff

- Planning focus:
  - D1 migration for event_type index (0005)
  - Analytics computation module (`analytics.server.ts`) with functions per metric group
  - API route handler (`/api/mcp/inbox/analytics/route.ts`)
  - MCP tool wrapping the new endpoint
  - InboxWorkspace inline analytics summary component
  - Unit tests for computation functions
- Validation implications:
  - SQL query correctness must be tested with representative event data
  - API response contract must be validated
  - Empty state / insufficient data handling must be tested
  - Auth requirement must be verified
- Sequencing constraints:
  - D1 migration before computation module (index must exist for performant queries)
  - Computation module before route handler (route delegates to module)
  - Route handler before MCP tool (tool calls the endpoint)
  - Route handler before UI component (component fetches from endpoint)
  - Tests can be written alongside each layer
- Risks to carry into planning:
  - Resolution time SQL has not been prototyped against real D1 data
  - No existing charting or sparkline library in reception app

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Resolution time SQL performance on D1 | Low | Medium | Requires testing against production data; not resolvable statically | Plan should include a validation step for the resolution-time query |
| D1 compute budget for multi-metric requests | Low | Medium | Depends on production data volume; selective metrics mitigate | Plan should ensure the `metrics` parameter allows partial fetching |
| No charting library for sparklines | Low | Low | UI decision -- sparklines are optional; plain text metrics suffice for v1 | Plan should scope v1 as text-only metrics; sparklines are future enhancement |

## Planning Readiness
- Status: Go
- Rationale: Approach is decisive. All three gates pass: fact-find evidence is complete, options were compared and one was chosen with clear rationale, and planning handoff notes are present with sequencing constraints and risk transfer. The remaining open question (time granularity preference) has a safe default assumption that does not block planning.
