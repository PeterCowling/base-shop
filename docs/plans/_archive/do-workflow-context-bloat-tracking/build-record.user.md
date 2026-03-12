---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-12
Feature-Slug: do-workflow-context-bloat-tracking
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: Per-Module Context Size Tracking

## Outcome Contract

- **Why:** Each workflow step loads skill modules that consume AI capacity. Without knowing which ones are the heaviest, it's impossible to spot waste or catch modules that are silently growing. Per-module tracking would reveal where to focus efficiency improvements and catch bloat before it drives up costs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-module context consumption is tracked in telemetry records and surfaced in reports, enabling targeted efficiency improvements.
- **Source:** operator

## What Was Built

**TASK-01 — Record type, builder, and dedupe key:** Extended `WorkflowStepTelemetryRecord` in `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` with a new optional field `per_module_bytes?: Record<string, number>`. The builder populates this map using resolved repo-relative module paths as keys and per-file byte sizes as values, drawn from the existing `readPathMetrics()` loop (no additional I/O). Records with zero modules receive `per_module_bytes: {}` (semantically distinct from the absent field on legacy records). The `computeTelemetryKey()` hash now includes `per_module_bytes`, preventing dedupe collisions between records that share the same aggregate `context_input_bytes` but differ in per-module distribution. Four new tests (TC-01 through TC-04) cover the populated case, the zero-module case, the dedupe regression, and backwards compatibility with existing tests.

**TASK-02 — Report generator and schema doc:** Extended `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` to compute a per-module byte aggregation from filtered records and surface it in both output formats. Markdown reports gain a `## Per-Module Context Bytes` section with a table sorted by bytes descending, prefixed with a coverage notice (`Based on N of M records with per-module data.`); the section is omitted entirely when no records have the field. JSON reports are now wrapped as `{ summary, per_module_breakdown, per_module_record_count }` — a documented breaking change with no automated consumers affected. Old records without `per_module_bytes` are skipped in aggregation. The schema doc `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` was updated with the new field row and version bumped to 1.5.0. Three new tests (TC-05 through TC-07) cover Markdown rendering, JSON rendering, and backwards compatibility with legacy records.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| CI (push to dev) | Pass (relevant tests) | Infrastructure failure on xa-uploader lockfile staleness is pre-existing and unrelated to this change |
| TC-01: `per_module_bytes` populated with resolved paths and correct byte sizes | Pass | TASK-01 |
| TC-02: zero-module record → `per_module_bytes: {}` | Pass | TASK-01 |
| TC-03: dedupe regression — different per-module distributions, same aggregate bytes → different `telemetry_key` | Pass | TASK-01 |
| TC-04: existing "builds a workflow-step record from canonical stage paths" test still passes | Pass | TASK-01 backwards compat |
| TC-05: Markdown report with `per_module_bytes` records → `## Per-Module Context Bytes` section rendered | Pass | TASK-02 |
| TC-06: JSON report with `per_module_bytes` records → `per_module_breakdown` key present | Pass | TASK-02 |
| TC-07: report with old records (no `per_module_bytes`) → renders without error, section omitted | Pass | TASK-02 backwards compat |

## Workflow Telemetry Summary

# Workflow Telemetry Summary
- Feature slug: `do-workflow-context-bloat-tracking`
- Records: 4
- Token measurement coverage: 0.0%
| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 2.00 | 38108 | 15271 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 43091 | 11701 | 0.0% |
| lp-do-plan | 1 | 1.00 | 75915 | 21680 | 0.0% |
| lp-do-build | 1 | 2.00 | 94839 | 0 | 0.0% |
## Totals
- Context input bytes: 251953
- Artifact bytes: 48652
- Modules counted: 6
- Deterministic checks counted: 6
- Model input tokens captured: 0
- Model output tokens captured: 0
## Gaps
- Stages missing records: lp-do-ideas
- Stages missing token measurement: lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
- Records with missing context paths: 2
## Per-Module Context Bytes
Based on 1 of 4 records with per-module data.
| Module | Total Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-validate.md | 10300 |
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

## Validation Evidence

### TASK-01
- TC-01: `buildWorkflowStepTelemetryRecord()` with module context paths → `per_module_bytes` contains each resolved repo-relative path as a key with correct byte size from `readPathMetrics()`. Pass.
- TC-02: `buildWorkflowStepTelemetryRecord()` with zero modules → `per_module_bytes` is `{}` (empty object, not absent). Pass.
- TC-03: Two records with identical `context_input_bytes` aggregate but different per-module distributions produce distinct `telemetry_key` values; both are written to JSONL (neither is deduplicated away). Pass.
- TC-04: Pre-existing test "builds a workflow-step record from canonical stage paths" passes with the new `per_module_bytes` field present in the record. Pass.

### TASK-02
- TC-05: Markdown report generated from records containing `per_module_bytes` includes `## Per-Module Context Bytes` section with module paths and aggregated byte totals sorted descending, prefixed with coverage note. Pass.
- TC-06: JSON report generated from records containing `per_module_bytes` returns `{ summary, per_module_breakdown, per_module_record_count }` envelope with `per_module_breakdown` containing aggregated module data. Pass.
- TC-07: Report generated from legacy records (no `per_module_bytes` field) renders without error; Markdown output omits the per-module section entirely; JSON output has `per_module_breakdown: {}` and `per_module_record_count: 0`. Pass.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | CLI-only tooling; no visual component |
| UX / states | Report format extended with per-module breakdown section | Markdown: new `## Per-Module Context Bytes` table; JSON: new `per_module_breakdown` envelope key. Section absent when no per-module data available (all-legacy dataset). |
| Security / privacy | N/A | Reads local files only; no auth boundary touched |
| Logging / observability / audit | New `per_module_bytes` field in JSONL records | Per-module granularity now persisted at record time; surfaced in reports. Core deliverable of this feature. |
| Testing / validation | 7 TC contracts implemented and passing | TC-01 through TC-04 in TASK-01; TC-05 through TC-07 in TASK-02. Backwards compat covered by TC-04 and TC-07. |
| Data / contracts | `WorkflowStepTelemetryRecord` type extended; dedupe key updated; JSON report envelope changed; schema doc updated to v1.5.0 | Breaking JSON CLI change documented; no automated consumers affected. |
| Performance / reliability | N/A | No extra I/O — per-module bytes drawn from existing `readPathMetrics()` loop. Old records without the field handled gracefully via `undefined` check. |
| Rollout / rollback | Additive optional field; old records remain valid | `per_module_bytes` is optional — absent on legacy records, empty `{}` on zero-module records. Report skips records without the field. Rollback: revert the two commits; no migration needed. |

## Scope Deviations

None. Both tasks were delivered as planned. The JSON envelope change (`{ summary, per_module_breakdown }` wrapper) was pre-documented in the plan as a known breaking change with no automated consumers — not a deviation.
