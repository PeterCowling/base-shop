---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-context-bloat-tracking
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-context-bloat-tracking/analysis.md
---

# Per-Module Context Size Tracking Plan

## Summary

Add per-module context byte tracking to the workflow telemetry system. The existing recorder aggregates all context file sizes into a single `context_input_bytes` number, discarding per-file data. This plan extends the record type with `per_module_bytes?: Record<string, number>`, updates the dedupe key to include it, and adds a per-module breakdown section to the report generator. Two S-effort tasks in sequence: record layer first (type + builder + dedupe key + tests), then report layer (report extension + schema doc + tests).

## Active tasks
- [x] TASK-01: Extend record type, builder, and dedupe key with per_module_bytes
- [x] TASK-02: Add per-module breakdown to report generator and update schema doc

## Goals
- Track per-module context consumption in each telemetry record
- Surface per-module data in the Markdown/JSON report
- Maintain backwards compatibility with old JSONL records

## Non-goals
- Time-bucketed trend dashboards or UI visualizations
- Changes to how skills pass `--module` flags
- Migration of historical JSONL records
- Per-file tracking for non-module context (skill SKILL.md, input paths, artifact)

## Constraints & Assumptions
- Constraints:
  - Must not break existing JSONL consumers (health check, summary, report)
  - `computeTelemetryKey()` must include new field to prevent dedupe collisions
  - Old records without the new field must be handled gracefully
  - Module identity must be stable — keyed on resolved repo-relative paths at record time
  - Health-check output (`WorkflowTelemetrySummary`) must not be bloated with per-module aggregates
- Assumptions:
  - Module file sizes are reasonable for in-memory processing (largest ~10KB)
  - The existing `readPathMetrics()` loop already reads each file — no extra I/O needed
  - Schema doc `lp-do-ideas-telemetry.schema.md` must be updated alongside schema changes

## Inherited Outcome Contract

- **Why:** Each workflow step loads skill modules that consume AI capacity. Without knowing which ones are the heaviest, it's impossible to spot waste or catch modules that are silently growing. Per-module tracking would reveal where to focus efficiency improvements and catch bloat before it drives up costs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-module context consumption is tracked in telemetry records and surfaced in reports, enabling targeted efficiency improvements.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-context-bloat-tracking/analysis.md`
- Selected approach inherited:
  - Option B: module-only resolved-path map `per_module_bytes?: Record<string, number>`
  - Empty `{}` for zero-module records; field absent (`undefined`) on legacy records
- Key reasoning used:
  - Stable module identity (resolved paths persisted at record time, not replayed at query time)
  - Consumer isolation (per-module aggregation in report generator only, not in `WorkflowTelemetrySummary`)
  - Matches fact-find contract field name `per_module_bytes`

## Selected Approach Summary
- What was chosen:
  - Option B — `per_module_bytes?: Record<string, number>` keyed by resolved repo-relative module paths
  - Empty `{}` when zero modules; field absent/`undefined` on legacy records (semantically distinct)
  - Per-module breakdown added to report generator only; `WorkflowTelemetrySummary` unchanged
  - Reporter's JSON mode adds `per_module_breakdown` envelope key alongside existing summary
- Why planning is not reopening option selection:
  - Analysis settled this decisively through 3 rounds of critique (final score 9/10). Option A rejected for module identity problem, Option C rejected for violating point-in-time measurement.

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-context-bloat-tracking/fact-find.md`
- Evidence carried forward:
  - `readPathMetrics()` at line 251 already returns per-file bytes — data is computed then discarded
  - `resolvedModules` at line 340 computes resolved absolute paths; stored in `context_paths` as repo-relative
  - `modules_loaded` at line 377/424 stores raw CLI strings (stage-relative), NOT resolved paths
  - `computeTelemetryKey()` at line 280 hashes aggregate data — must include `per_module_bytes`
  - Aggregation loop at lines 354-362 iterates `resolvedContextPaths` and sums to aggregate

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Record type + builder + dedupe key + tests | 85% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Report per-module breakdown + schema doc + tests | 85% | S | Complete (2026-03-12) | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: CLI-only tooling, no visual component | - | - |
| UX / states | Required: report format extended with per-module columns | TASK-02 | Markdown + JSON output |
| Security / privacy | N/A: reads local files only, no auth boundary | - | - |
| Logging / observability / audit | Required: core improvement — per-module granularity in JSONL records | TASK-01 | New field in telemetry records |
| Testing / validation | Required: new tests for builder, dedupe regression, report rendering, backwards compat | TASK-01, TASK-02 | TC contracts below |
| Data / contracts | Required: `WorkflowStepTelemetryRecord` type extension, dedupe key update, JSON report envelope | TASK-01, TASK-02 | Schema doc update in TASK-02 |
| Performance / reliability | N/A: no extra I/O — data already read in existing loop | - | Negligible overhead |
| Rollout / rollback | Required: old records handled gracefully (`undefined` → skip in report) | TASK-01, TASK-02 | Additive field; no migration |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Record layer foundation |
| 2 | TASK-02 | TASK-01 | Report layer consumes new field |

## Tasks

### TASK-01: Extend record type, builder, and dedupe key with per_module_bytes
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` and `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% - `readPathMetrics()` already returns per-file bytes; `resolvedModules` already computed; change is preserving existing data in a new field during the same loop
  - Approach: 90% - analysis settled on Option B through 3 critique rounds; field shape is clear
  - Impact: 85% - directly enables per-module visibility in records; report consumption depends on TASK-02
- **Acceptance:**
  - `WorkflowStepTelemetryRecord` type includes `per_module_bytes?: Record<string, number>`
  - `buildWorkflowStepTelemetryRecord()` populates `per_module_bytes` with resolved repo-relative module paths as keys and byte sizes as values
  - Records with zero modules have `per_module_bytes: {}`
  - `computeTelemetryKey()` includes `per_module_bytes` in the hash payload
  - Two records with different per-module distributions but same aggregate `context_input_bytes` produce different `telemetry_key` values
  - Existing tests continue to pass (backwards compat)
- **Engineering Coverage:**
  - UI / visual: N/A - CLI tooling only
  - UX / states: N/A - no user-facing output changes in this task
  - Security / privacy: N/A - local file reads only
  - Logging / observability / audit: Required - new `per_module_bytes` field in JSONL records
  - Testing / validation: Required - TC-01 through TC-04 below
  - Data / contracts: Required - type extension + dedupe key update
  - Performance / reliability: N/A - no extra I/O
  - Rollout / rollback: Required - additive optional field; old records have `undefined`
- **Validation contract (TC-01 through TC-04):**
  - TC-01: Build record with modules → `per_module_bytes` contains resolved repo-relative paths as keys with correct byte sizes
  - TC-02: Build record with zero modules → `per_module_bytes` is `{}`
  - TC-03: Dedupe regression — two records with same aggregate bytes but different per-module distributions → different `telemetry_key` values, both appended (not deduplicated)
  - TC-04: Existing test "builds a workflow-step record from canonical stage paths" still passes with new field present
- **Execution plan:**
  1. Add `per_module_bytes?: Record<string, number>` to `WorkflowStepTelemetryRecord` interface
  2. In `buildWorkflowStepTelemetryRecord()`, after computing `resolvedModules` (line 340) and before the aggregation loop (line 354), build a `Set<string>` of resolved module absolute paths. During the loop, when `contextPath` is in the module set, record its bytes in a `Record<string, number>` keyed by `path.relative(rootDir, contextPath)`. After the loop, assign to `per_module_bytes` (empty `{}` if no modules).
  3. Add `per_module_bytes` to `computeTelemetryKey()` hash payload
  4. Add TC-01 through TC-04 tests
- **Consumer tracing:**
  - New output `per_module_bytes`: consumed by TASK-02 report generator (dependent task). `summarizeWorkflowStepTelemetry()` is unchanged — it does not read `per_module_bytes` (consumer isolation by design). `checkWorkflowHealth()` calls `summarizeWorkflowStepTelemetry()` — unchanged and safe. `isWorkflowStepTelemetryRecord()` type guard does not check `per_module_bytes` — legacy records without it pass the guard correctly.
  - Modified output `telemetry_key`: all consumers use it as an opaque string for deduplication only — no semantic parsing. Safe.
- **Scouts:** None: all code paths verified in fact-find
- **Edge Cases & Hardening:**
  - Module file missing (in `missing_context_paths`): excluded from `per_module_bytes` since `readPathMetrics()` returns 0 bytes and the loop `continue`s. The module path appears in `missing_context_paths` but not in `per_module_bytes` — correct behavior.
  - Same file appears as both module and input path: `resolvedContextPaths` is deduplicated by `normalizeStringList()` — the file is read once. If it's a module, it appears in `per_module_bytes`. No double-counting.
- **What would make this >=90%:**
  - Seeing test results pass in CI
- **Rollout / rollback:**
  - Rollout: additive optional field; existing consumers ignore unknown fields
  - Rollback: revert the commit; old records unaffected
- **Documentation impact:**
  - Schema doc update deferred to TASK-02
- **Notes / references:**
  - Key lines: `readPathMetrics()` at 251, `resolvedModules` at 340, aggregation loop at 354-362, `computeTelemetryKey()` at 280, `modulesLoaded` at 377/424

### TASK-02: Add per-module breakdown to report generator and update schema doc
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` and `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry-report.test.ts` (new file), `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - report generator is simple; JSON envelope needs new key; Markdown needs new section. Held-back test: no single unknown would drop this below 80 — all surfaces are identified and the reporter is straightforward code.
  - Approach: 90% - analysis specified `per_module_breakdown` envelope key and report-only boundary
  - Impact: 85% - completes the user-visible output; per-module data becomes queryable in reports
- **Acceptance:**
  - Markdown report includes a `## Per-Module Context Bytes` section with a table of module paths and byte sizes (aggregated across records for the feature)
  - JSON report includes a `per_module_breakdown` key alongside the existing summary, containing aggregated per-module byte data
  - Old records without `per_module_bytes` are handled gracefully — report shows data only for records that have the field
  - Schema doc `lp-do-ideas-telemetry.schema.md` updated with `per_module_bytes` field documentation and version bumped
- **Engineering Coverage:**
  - UI / visual: N/A - CLI tooling only
  - UX / states: Required - Markdown + JSON report format extended with per-module section
  - Security / privacy: N/A - local file reads only
  - Logging / observability / audit: N/A - report reads existing records, does not produce new telemetry
  - Testing / validation: Required - TC-05 through TC-07 below
  - Data / contracts: Required - JSON report envelope extension + schema doc update
  - Performance / reliability: N/A - aggregation over in-memory records
  - Rollout / rollback: Required - report gracefully handles mixed old/new records
- **Validation contract (TC-05 through TC-07):**
  - TC-05: Markdown report with records containing `per_module_bytes` → includes `## Per-Module Context Bytes` section with module paths and byte totals
  - TC-06: JSON report with records containing `per_module_bytes` → includes `per_module_breakdown` key with aggregated per-module data
  - TC-07: Report with old records (no `per_module_bytes` field) → report renders without error; Markdown output omits per-module section entirely (no empty table); JSON output has `per_module_breakdown: {}`
- **Execution plan:**
  1. In `main()`: after calling `summarizeWorkflowStepTelemetry()`, compute per-module aggregation separately from the same `records` array (already available at line 106). **Apply the same `featureSlug` / `business` filters** used for `summarizeWorkflowStepTelemetry()` so the per-module breakdown is scoped identically to the summary. Build a `Record<string, number>` by iterating filtered records, checking `per_module_bytes` exists and is a non-empty object, then summing bytes per module path. Also count how many filtered records contributed per-module data (`per_module_record_count`). This keeps `summarizeWorkflowStepTelemetry()` unchanged and computes breakdown at the report layer only.
  2. Pass the aggregated `per_module_breakdown` map and `per_module_record_count` to `formatMarkdown()` as new parameters. In Markdown mode, render a `## Per-Module Context Bytes` section with a table sorted by bytes descending, prefixed with `Based on N of M records with per-module data.` to indicate coverage. Skip section entirely if map is empty (all-legacy dataset).
  3. In JSON mode: emit `{ summary: existingSummary, per_module_breakdown: aggregatedMap, per_module_record_count: N }`. When no records have `per_module_bytes`, `aggregatedMap` is `{}` and count is `0`. The `per_module_record_count` alongside `summary.record_count` gives operators explicit coverage visibility. Note: legacy and zero-module records both contribute nothing to the aggregate — intentional collapse at report level.
  4. Handle `undefined` `per_module_bytes` on old records: skip those records in per-module aggregation. Records with `per_module_bytes: {}` (zero modules) also contribute nothing. The per-module section is purely additive data from records that have it.
  4. Update schema doc: add `per_module_bytes` row to the `workflow_step` field table, document semantics (`undefined` = legacy, `{}` = zero modules, populated = module byte map), bump version to 1.5.0.
  5. Add TC-05 through TC-07 tests.
- **Consumer tracing:**
  - New output `per_module_breakdown` JSON key: consumed by operators reading JSON reports. No automated consumers identified — reports are human-readable.
  - New output `## Per-Module Context Bytes` Markdown section: consumed by `build-record.user.md` which includes workflow telemetry summary. Additive section — no existing consumer breaks.
  - Modified JSON output shape: current JSON mode serializes `summarizeWorkflowStepTelemetry()` directly at top level. Wrapping in `{ summary, per_module_breakdown }` is a **breaking change** to the JSON CLI contract. Consumer `build-record.user.md` uses Markdown format, not JSON — safe. No other automated JSON consumer identified in the codebase (confirmed via `grep` for the report CLI invocation patterns). The breaking change is acceptable given no automated consumers exist.
- **Scouts:** None: reporter is a simple formatting layer
- **Edge Cases & Hardening:**
  - Mixed old and new records: old records have `per_module_bytes: undefined`; new records have `{}` or populated map. Aggregation skips records without the field. The `per_module_record_count` in the output explicitly shows how many records contributed per-module data vs the total `record_count`, giving operators clear coverage visibility.
  - Module path renamed between records: each historical record preserves its own resolved path. Aggregation sums by exact path — renamed modules appear as separate entries. Correct behavior (point-in-time identity).
- **What would make this >=90%:**
  - Seeing test results pass in CI and verifying report output against real telemetry data
- **Rollout / rollback:**
  - Rollout: additive report section; JSON envelope change is breaking for any consumer that expects raw summary at top level — no automated consumers identified
  - Rollback: revert the commit
- **Documentation impact:**
  - Schema doc updated in this task (version bump to 1.5.0)
- **Notes / references:**
  - Reporter at `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`
  - Schema doc at `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`

## Risks & Mitigations
- **Dedupe key collision** (Medium if forgotten → mitigated): `per_module_bytes` must be included in `computeTelemetryKey()` hash. Mitigated by making this part of TASK-01 with TC-03 regression test.
- **Old record breakage** (Low → mitigated): consumers must handle `undefined` explicitly. Mitigated by TC-04 (existing tests pass) and TC-07 (report backwards compat).
- **JSON envelope change** (Low but breaking): wrapping JSON output in `{ summary, per_module_breakdown }` is a breaking change to the JSON CLI contract. No automated consumers identified; Markdown format (used by build-record) is unaffected. Acceptable given no consumers.
- **Schema doc staleness** (Low → mitigated): included in TASK-02 scope.

## Observability
- Logging: per-module byte data visible in JSONL records and report output
- Metrics: none (no dashboards in scope)
- Alerts/Dashboards: none (non-goal)

## Acceptance Criteria (overall)
- [ ] Telemetry records include `per_module_bytes` with resolved module paths and byte sizes
- [ ] Dedupe key differentiates records with different per-module distributions
- [ ] Report output (Markdown + JSON) includes per-module breakdown section
- [ ] Old records without the field are handled gracefully everywhere
- [ ] Schema doc updated with new field and version bumped
- [ ] All 7 TC contracts pass in CI

## Delivered Processes
None: this is a code-only change to internal telemetry tooling with no process deliverables.

## Decision Log
- 2026-03-12: Analysis chose Option B (module-only resolved-path map) after rejecting Option A (module identity problem) and Option C (point-in-time violation). 3 critique rounds, final score 9/10.
- 2026-03-12: JSON report envelope uses `{ summary, per_module_breakdown }` wrapper rather than injecting per-module data into `WorkflowTelemetrySummary` (consumer isolation).
- 2026-03-12: Field type is `per_module_bytes?: Record<string, number>` — optional (absent on legacy), empty `{}` on zero-module records (semantically distinct from absent).

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Record type + builder + dedupe key | Yes | None — `readPathMetrics()` returns per-file bytes, `resolvedModules` already computed, `computeTelemetryKey()` accepts the full record object | No |
| TASK-02: Report per-module breakdown + schema doc | Yes | None — TASK-01 provides the `per_module_bytes` field; `main()` already has raw records at line 106 for per-module aggregation without changing `summarizeWorkflowStepTelemetry()`; JSON envelope is a breaking change to CLI contract but no automated consumers identified | No |

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- Overall = (85 + 85) / (1 + 1) = 85%
