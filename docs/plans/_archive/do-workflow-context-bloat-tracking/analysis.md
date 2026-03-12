---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-context-bloat-tracking
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/do-workflow-context-bloat-tracking/fact-find.md
Related-Plan: docs/plans/do-workflow-context-bloat-tracking/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Per-Module Context Size Tracking Analysis

## Decision Frame

### Summary
The workflow telemetry system aggregates context bytes across all loaded files into a single `context_input_bytes` number. This prevents identifying which modules are the heaviest consumers or detecting growth over time. The decision is what field shape to use for per-module byte tracking and how to extend the report layer without bloating the health-check consumer.

### Goals
- Track per-module context consumption in each telemetry record
- Surface per-module data in the Markdown/JSON report
- Maintain backwards compatibility with old JSONL records

### Non-goals
- Time-bucketed trend dashboards or UI visualizations
- Changes to how skills pass `--module` flags
- Migration of historical JSONL records
- Per-file tracking for non-module context (skill SKILL.md, input paths, artifact)

### Constraints & Assumptions
- Constraints:
  - Must not break existing JSONL consumers (health check, summary, report)
  - `computeTelemetryKey()` must include new field to prevent dedupe collisions
  - Old records without the new field must be handled gracefully
  - Module identity must be stable across time — cannot depend on filesystem state at query time
  - Health-check output (`WorkflowTelemetrySummary`) must not be bloated with per-module aggregates
- Assumptions:
  - Module file sizes are reasonable for in-memory processing (largest module ~10KB)
  - The existing `readPathMetrics()` loop already reads each file — no extra I/O
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` documents the persisted JSONL fields and must be updated alongside any schema change

## Inherited Outcome Contract

- **Why:** Each workflow step loads skill modules that consume AI capacity. Without knowing which ones are the heaviest, it's impossible to spot waste or catch modules that are silently growing. Per-module tracking would reveal where to focus efficiency improvements and catch bloat before it drives up costs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-module context consumption is tracked in telemetry records and surfaced in reports, enabling targeted efficiency improvements.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/do-workflow-context-bloat-tracking/fact-find.md`
- Key findings used:
  - `readPathMetrics()` already reads each file individually in the aggregation loop — per-file data is computed then discarded
  - `modules_loaded` stores raw `--module` CLI strings (stage-relative), while `resolvedModules` (line 340) stores resolved absolute paths used for context sizing — the builder already computes both
  - `context_paths` stores repo-relative resolved paths for all context files (including modules)
  - `computeTelemetryKey()` hashes `context_input_bytes` and `modules_loaded` — new field must be included
  - Old JSONL records lack the new field — consumers must default missing data explicitly

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Module identity stability | Module keys must be reliably identifiable without replaying resolution at query time | Critical |
| Query simplicity | Per-module data should be easy to extract with `jq` or simple TS code | High |
| Schema consistency | Field should match existing record patterns and the `per_module_bytes` name from the fact-find | High |
| Consumer isolation | Health check should not receive per-module aggregation overhead | High |
| Backwards compatibility | Old records without the field must not break consumers | High |
| Storage overhead | Additional JSONL bytes per record | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: All-context-paths map | `context_path_bytes: Record<string, number>` for every context file (skill + modules + inputs + artifact) | Full per-file breakdown | Cannot reliably distinguish modules from non-modules at query time without replaying `resolveModulePath()` against current filesystem — unstable over refactors; broader scope than needed; fact-find contract drift (`per_module_bytes` → `context_path_bytes`) | Module identity depends on filesystem state at query time | No — rejected |
| B: Module-only resolved-path map | `per_module_bytes?: Record<string, number>` keyed by resolved repo-relative module paths (same paths already in `context_paths` and computed as `resolvedModules`). Empty `{}` for zero-module records; field absent (`undefined`) on legacy records — semantically distinct | Stable module identity (resolved at record time, persisted); simple flat map query; matches fact-find contract name; focused on modules only; clean legacy/empty distinction | Does not include non-module file sizes (not recoverable from existing records — only flat path list + aggregate total persisted) | Does not capture skill SKILL.md or input-path sizes — acceptable, those are less variable | Yes |
| C: Summary-time re-read | Keep record unchanged; aggregate per-module only in summary by re-reading files | No schema change | Violates point-in-time measurement principle; files may have changed; not queryable from JSONL | Trend analysis unreliable | No — rejected |

## Engineering Coverage Comparison

| Coverage Area | Option A (all-paths map) | Option B (module-only map) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | Report shows all context files | Report shows module files only — the stated goal | Option B: focused on the stated need |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | Full per-file breakdown | Module-only breakdown — sufficient for the stated goal | Option B: right-sized |
| Testing / validation | Same test burden | Same test burden | Equal |
| Data / contracts | Keys are all context paths — no explicit module identity | Keys are resolved module paths persisted at record time — stable identity | Option B: solves the module identity problem |
| Performance / reliability | No extra I/O | No extra I/O | Equal |
| Rollout / rollback | Old records: field `undefined` — consumers must default | Same | Equal |

## Chosen Approach

- **Recommendation:** Option B — module-only resolved-path map `per_module_bytes: Record<string, number>` (empty `{}` when zero modules; field absent/`undefined` on legacy records)
- **Why this wins:**
  1. **Stable module identity:** Module paths are resolved to repo-relative paths at record time (the builder already computes `resolvedModules` at line 340 and stores them in `context_paths`). The resolved path is persisted in the record — no filesystem replay needed at query time.
  2. **Matches fact-find contract:** Uses the `per_module_bytes` field name established in the fact-find, avoiding schema drift.
  3. **Simple query:** `jq '.per_module_bytes["path/to/module.md"]'` — flat map keyed by repo-relative path.
  4. **Focused scope:** Tracks only module files, which are the variable-size context contributors. Non-module file sizes (skill SKILL.md, input paths) are not recoverable from existing records (only a flat path list + aggregate total is persisted), but they are less variable and out of scope for this change.
  5. **Consumer isolation:** Per-module aggregation stays in the report generator, not in `WorkflowTelemetrySummary` — the health check consumer is unaffected.
- **What it depends on:** The `readPathMetrics()` loop already has per-file metrics and the resolved module paths. The builder needs to accumulate a `Record<string, number>` during the existing loop.

### Rejected Approaches

- **Option A (all-context-paths map):** Rejected because it does not solve the module identity problem. At query time, distinguishing module entries from skill/input/artifact entries in the map would require replaying `resolveModulePath()` against the current filesystem, which can resolve differently after refactors. Also introduces contract drift from the fact-find's `per_module_bytes` name.
- **Option C (summary-time re-read):** Rejected because it violates the telemetry principle of point-in-time measurement. Re-reading files at summary time would reflect current sizes, not historical.

### Open Questions (Operator Input Required)

None. The field shape decision is technical with clear trade-offs favouring Option B.

## Planning Handoff

- Planning focus:
  - Extend `WorkflowStepTelemetryRecord` type with `per_module_bytes?: Record<string, number>` (optional — absent on legacy records, empty `{}` on new zero-module records)
  - Modify the builder to accumulate per-module bytes during the existing `readPathMetrics()` loop using resolved module paths as keys
  - Include `per_module_bytes` in `computeTelemetryKey()` hash
  - Add per-module section to the **report generator only** (not `WorkflowTelemetrySummary` — health check consumer stays unaffected). The reporter's JSON mode currently serializes `summarizeWorkflowStepTelemetry()` directly; per-module data must be added as a separate `per_module_breakdown` key in the JSON envelope alongside the existing summary, not injected into `WorkflowTelemetrySummary`
  - Handle `undefined` (legacy records missing the field) vs `{}` (new records with zero modules) explicitly in report generator — these are semantically distinct
  - Update schema documentation in `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
  - Add tests: record builder with per-module data, dedupe regression, report rendering with per-module section, report backwards compat with old records
- Validation implications:
  - Dedupe regression test: two records with different per-module distributions but same aggregate bytes must produce different telemetry keys
  - Old-record backwards compatibility test: report should handle records with `per_module_bytes: undefined` (legacy) distinctly from `per_module_bytes: {}` (new zero-module records)
- Sequencing constraints:
  - Record type + builder + dedupe key first, then report (report depends on the record field)
- Risks to carry into planning:
  - Dedupe key collision if `per_module_bytes` is not included in `computeTelemetryKey()` — must be part of the first task
  - Backwards compat — explicit handling in report code, not assumed

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Dedupe key collision | Medium (if forgotten) | High (data loss) | Implementation detail | Must be in same task as field addition |
| Old record breakage | Low (if handled) | Medium | Requires code-level defaulting | Explicit test coverage required |
| Schema doc staleness | Low (if forgotten) | Low | Documentation update | Include in task scope |

## Planning Readiness

- Status: Go
- Rationale: Single clear approach (Option B), module identity problem solved by persisting resolved paths at record time, all implementation surfaces identified including telemetry schema doc, consumer isolation addressed (report-only, not summary), no operator questions.
