---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-context-bloat-tracking
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/do-workflow-context-bloat-tracking/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312075840-C003
---

# Per-Module Context Size Tracking Fact-Find Brief

## Outcome Contract

- **Why:** Each workflow step loads skill modules that consume AI capacity. Without knowing which ones are the heaviest, it's impossible to spot waste or catch modules that are silently growing. Per-module tracking would reveal where to focus efficiency improvements and catch bloat before it drives up costs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-module context consumption is tracked in telemetry records and surfaced in reports, enabling targeted efficiency improvements. (Note: "trending" means the per-module data is available in the JSONL time series for comparison across builds — not a dedicated time-bucketed trend dashboard. The existing reporter groups by stage; per-module grouping in the report is a concrete implementation requirement.)
- **Source:** operator

## Access Declarations

None. All evidence is in the local repository — no external data sources or services needed.

## Evidence Audit (Current State)

### Entry Points

1. **CLI recorder:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — `buildWorkflowStepTelemetryRecord()` at line 318 is the single entry point for building telemetry records. Called by the CLI `main()` at line 635.
2. **CLI reporter:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — reads JSONL records and produces stage-level summaries (Markdown or JSON format).
3. **pnpm scripts:** `startup-loop:lp-do-ideas-record-workflow-telemetry` (recorder) and `startup-loop:lp-do-ideas-report-workflow-telemetry` (reporter) in `scripts/package.json`.

### Key Modules / Files

| # | File | Role |
|---|---|---|
| 1 | `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` | Record builder + JSONL appender + summary aggregator |
| 2 | `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` | Markdown/JSON report generator |
| 3 | `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` | Append-only telemetry data store |
| 4 | `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` | Existing unit tests for telemetry system |
| 5 | `.claude/skills/lp-do-fact-find/SKILL.md` (and sibling skill dirs) | Consumer — passes `--module` flags to recorder |

### Data & Contracts

**Current `WorkflowStepTelemetryRecord` fields (lines 26–59):**
- `modules_loaded: string[]` — raw `--module` CLI strings, NOT resolved paths (e.g., `["modules/outcome-a-code.md"]`). Stored at line 377 from `normalizeStringList(options.modules)` — **not** from the resolved `resolvedModules` used for context sizing. This means `modules_loaded` is stage-relative (e.g., `modules/build-code.md` in lp-do-build vs `modules/outcome-a-code.md` in lp-do-fact-find), while `context_paths` stores the repo-relative resolved paths. Any per-module tracking must decide which identity to key on.
- `module_count: number` — simple array length
- `context_input_bytes: number` — **aggregate** across all context (skill SKILL.md + all modules + input paths + artifact)
- `context_input_lines: number` — aggregate line count
- `context_paths: string[]` — flat list of all resolved repo-relative file paths
- `missing_context_paths: string[]` — files referenced but not found

**What's missing:** No `per_module_bytes` field. The `readPathMetrics()` helper (line 251) already reads individual file sizes via `Buffer.byteLength(content, "utf-8")`, but the per-file results are summed into the aggregate `context_input_bytes` without preserving the breakdown.

**Module identity design decision:** The per-module breakdown field should key on the resolved repo-relative path (matching `context_paths` entries), not the raw `modules_loaded` strings, to ensure consistent identity across stages and avoid fragmentation in trend analysis.

**`WorkflowTelemetrySummary` (lines 105–140):**
- `by_stage[].total_module_count` and `average_module_count` — count only
- `totals.context_input_bytes` — aggregate sum across all records
- No per-module breakdown in the summary either

**`WorkflowStageTelemetrySummary` fields (line 108ff):**
- `average_context_input_bytes`, `max_context_input_bytes` — stage-level, not module-level

### Dependency & Impact Map

**Upstream inputs:**
- Every DO-stage skill (`lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, `lp-do-build`) calls the recorder CLI with `--module` flags
- Module file paths are relative to the stage skill directory

**Downstream consumers:**
- `summarizeWorkflowStepTelemetry()` — aggregates records for reports
- `lp-do-ideas-workflow-telemetry-report.ts` — renders Markdown/JSON output
- `workflow-health-check.ts` — calls `summarizeWorkflowStepTelemetry()` for health status
- `build-record.user.md` — includes workflow telemetry summary section

**Dedupe layer:** `appendWorkflowStepTelemetry()` deduplicates records by `telemetry_key`, which is a SHA-256 hash computed by `computeTelemetryKey()` (line 280). The hash includes `context_input_bytes` and `modules_loaded` among other fields. If per-module breakdown is added to the record type, the new field must also be included in `computeTelemetryKey()` to prevent records with different module distributions but identical aggregate totals from colliding.

**Blast radius:** Additive field extension to existing record type, but requires updating the dedupe key computation. Existing consumers read only the fields they know — new fields are ignored. Summary/report consumers need explicit updates to surface per-module data.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | CLI-only tooling, no visual component | - | - |
| UX / states | Required | CLI output format (Markdown/JSON reports) needs per-module columns | Report format needs extension | Report module changes |
| Security / privacy | N/A | Reads local files only, no auth boundary | - | - |
| Logging / observability / audit | Required | JSONL telemetry is the audit trail; per-module breakdown adds granularity | Current telemetry lacks module-level granularity | Core improvement target |
| Testing / validation | Required | 6 existing tests in `lp-do-ideas-workflow-telemetry.test.ts` covering record building, appending, and summarizing | Tests need extension for new per-module fields | Test additions for new fields |
| Data / contracts | Required | `WorkflowStepTelemetryRecord` type at line 26; `WorkflowTelemetrySummary` at line 105 | New field in record type; summary type extension | Schema extension |
| Performance / reliability | Required | `readPathMetrics()` already reads each file individually in the loop (line 344–362); no extra I/O needed | Negligible — data already read, just needs to be preserved per-file instead of summed | No new I/O |
| Rollout / rollback | Required | Additive field; old records lack new per-module field | Summary/report code must explicitly default missing per-module data to `null`/empty rather than assuming it exists — this is a concrete implementation requirement, not an automatic guarantee | Explicit backwards-compat handling in summary + report |

### Test Landscape

**Existing tests:** `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- Tests `buildWorkflowStepTelemetryRecord()` with various module configurations
- Tests `appendWorkflowStepTelemetry()` for JSONL persistence
- Tests `summarizeWorkflowStepTelemetry()` for aggregation
- Tests verify `modules_loaded`, `module_count`, `context_input_bytes` fields (lines 102–111)
- **No assertions for per-module byte sizes** (field doesn't exist yet)

**Coverage gap:** New per-module fields need test coverage for record building, summarization, and report rendering. Additionally, a dedupe-key regression test is required: two records with different per-module breakdowns but identical aggregate totals must produce distinct `telemetry_key` values and not be collapsed by `appendWorkflowStepTelemetry()`.

**Testability:** High — the record builder is a pure function taking options and returning a structured record. Temp-dir fixture pattern is established.

### Recent Git History (Targeted)

- `workflow-health-check.ts` just added (2026-03-12) — consumes `summarizeWorkflowStepTelemetry()` output
- Telemetry system has been stable since initial implementation; no breaking changes in the past 2 weeks
- `lp-do-ideas-workflow-telemetry-report.ts` was recently created for Markdown/JSON reporting

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is bounded to one record type, one builder function, one dedupe key function, one summary function, and one report generator. The `readPathMetrics()` helper already reads individual file sizes — the gap is in preserving the breakdown instead of aggregating it away, plus updating the dedupe key and adding explicit backwards-compat handling in consumers. No new I/O, no new external dependencies, no architecture change.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Record builder (`buildWorkflowStepTelemetryRecord`) | Yes | None | No |
| Dedupe key (`computeTelemetryKey`) | Yes | [Data / contracts] [Moderate]: New per-module field must be included in hash to prevent collisions — addressed in Risks #4 | No — documented as implementation requirement |
| Module identity (`modules_loaded` vs resolved paths) | Yes | [Data / contracts] [Moderate]: Raw CLI strings vs resolved paths — addressed in Data & Contracts section | No — design decision documented |
| Summary aggregator (`summarizeWorkflowStepTelemetry`) | Yes | None | No |
| Report generator (`lp-do-ideas-workflow-telemetry-report.ts`) | Yes | None | No |
| JSONL schema compatibility | Yes | [Rollout / rollback] [Moderate]: Old records lack new field — consumers must explicitly default, not assume field exists — addressed in Engineering Coverage Matrix | No — documented as implementation requirement |
| Downstream consumers (health check, build-record) | Yes | None — health check calls `summarizeWorkflowStepTelemetry()` which will pass through new data transparently | No |

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 85% | `readPathMetrics()` already computes per-file bytes; change is preserving existing data in a new field |
| Approach | 85% | Additive field extension is the standard pattern in this codebase (see `module_count`, `context_paths`) |
| Impact | 80% | Directly enables per-module visibility and trend detection as stated in outcome contract |
| Delivery-Readiness | 85% | All code paths identified, no unknowns, no external dependencies |
| Testability | 90% | Pure function with established fixture-based test pattern |

- **What raises to >=80:** Already at 80+ on all dimensions.
- **What raises to >=90:** Integration verification that old JSONL records without the new field don't break summary/report consumers.

## Risks

1. **JSONL backwards compatibility** (Low) — Old records lack per-module fields. Mitigation: summary and report code must explicitly default missing `per_module_bytes` to `null`/empty — this is a concrete implementation requirement documented in the engineering coverage matrix. Not assumed automatic.
2. **Report format change** (Low) — Adding per-module columns to Markdown report changes output format. Mitigation: additive columns; existing consumers (build-record template) copy the output as-is.
3. **Summary type extension** (Low) — `WorkflowTelemetrySummary` needs new fields for per-module aggregation. Mitigation: new optional fields; existing consumers unaffected.
4. **Telemetry key collision** (Medium) — `computeTelemetryKey()` hashes `context_input_bytes` and `modules_loaded`. If per-module breakdown is added without updating the hash, records with different module distributions but identical aggregate totals could be collapsed as duplicates. Mitigation: include new per-module field in hash computation.
5. **Module identity fragmentation** (Low) — `modules_loaded` stores raw `--module` CLI strings (stage-relative), not resolved repo-relative paths. Per-module tracking should key on resolved paths (from `context_paths`) for consistent cross-stage identity. Mitigation: design decision to use resolved paths as module identity key.

## Open Questions

None. All evidence gathered from the codebase directly. No operator-only knowledge needed.

## Evidence Gap Review

### Gaps Addressed
- Verified `readPathMetrics()` helper exists and returns individual file metrics (line 254)
- Confirmed the aggregation loop (lines 344–362) where per-file data is summed away
- Checked all downstream consumers of `WorkflowTelemetrySummary`
- Confirmed JSONL schema is append-only (no migration needed)

### Confidence Adjustments
- None required. All dimensions at 80%+.

### Remaining Assumptions
- Old JSONL records without per-module fields will be handled gracefully by consumer code — this requires explicit defaulting in summary/report code (documented as implementation requirement, not assumed automatic)
- Report format additions won't break any automated parsers (reports are human-readable Markdown, no automated consumers identified)
- The `computeTelemetryKey()` hash update is a required part of the implementation (not optional)

## Scope

Add per-module context size tracking to the workflow telemetry system. Specifically:
1. Extend `WorkflowStepTelemetryRecord` with a `per_module_bytes` field (keyed by resolved repo-relative path)
2. Update `computeTelemetryKey()` to include the new field
3. Update `summarizeWorkflowStepTelemetry()` to aggregate per-module data across records
4. Update the report generator to surface per-module breakdown in output
5. Add tests for new fields including dedupe regression

**Out of scope:** Time-bucketed trend dashboards, UI visualizations, changes to how skills pass `--module` flags, migration of historical JSONL records.

## Analysis Readiness

- **Status:** Ready for analysis
- **Rationale:** All entry points, key modules, contracts, dependencies, and risks are identified. Implementation surface is well-understood including the dedupe key update requirement and module identity design decision. Confidence is at 80%+ on all dimensions.
- **Blocking items:** None
- **Recommended analysis focus:** Compare approach options for the `per_module_bytes` field shape (flat map vs nested array) and decide whether to extend the existing summary type or add a separate per-module summary.
