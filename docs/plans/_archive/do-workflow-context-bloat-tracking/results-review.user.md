---
Type: Results-Review
Status: Draft
Feature-Slug: do-workflow-context-bloat-tracking
Review-date: "2026-03-12"
artifact: results-review
---

# Results Review

## Observed Outcomes
- `WorkflowStepTelemetryRecord` extended with `per_module_bytes?: Record<string, number>`, keyed by resolved repo-relative module paths. Records with zero modules carry `per_module_bytes: {}` (empty object, semantically distinct from the absent field on legacy records).
- `buildWorkflowStepTelemetryRecord()` now populates `per_module_bytes` from the existing `readPathMetrics()` loop — no extra I/O. Module identity is stable: resolved absolute paths converted to repo-relative strings at record time.
- `computeTelemetryKey()` updated to include `per_module_bytes` in the hash payload, preventing dedupe collisions between records that share an aggregate `context_input_bytes` value but differ in per-module distribution.
- Report generator (`lp-do-ideas-workflow-telemetry-report.ts`) surfaces per-module data in both output formats: Markdown gains a `## Per-Module Context Bytes` section (table sorted by bytes descending, prefixed with record coverage count); JSON gains a `per_module_breakdown` key alongside the existing summary envelope.
- Old records without `per_module_bytes` are handled gracefully: aggregation skips them, Markdown section is omitted entirely when no records contribute data, JSON emits `per_module_breakdown: {}` with `per_module_record_count: 0`.
- Schema doc `lp-do-ideas-telemetry.schema.md` updated with `per_module_bytes` field documentation (semantics for `undefined` / `{}` / populated states) and version bumped to 1.5.0.
- All 7 TC contracts (TC-01 through TC-07) implemented covering: module builder, zero-module records, dedupe regression, existing backwards compat, Markdown and JSON report rendering, and legacy-record graceful handling.

## Standing Updates
No standing updates: this build changes internal telemetry tooling only. No Layer A standing artifacts cover workflow step context consumption. No KPI feeds are affected.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: no new standing artifact is warranted. The per-module breakdown is surfaced in on-demand reports rather than a continuously-maintained standing feed. If per-module growth trends become a recurring review concern, a standing feed could be added in a future build.

## Intended Outcome Check

- **Intended:** Per-module context consumption is tracked in telemetry records and surfaced in reports, enabling targeted efficiency improvements.
- **Observed:** `per_module_bytes` is populated in JSONL records at record time, and the report generator surfaces a per-module breakdown table (Markdown) and `per_module_breakdown` key (JSON) scoped to the same feature/business filters as the existing summary. Legacy records without the field are handled without error.
- **Verdict:** Met
- **Notes:** Both delivery surfaces (records and reports) are complete. The JSON envelope change is a breaking CLI contract change, but no automated consumers of JSON report output were identified in the codebase, so the impact is contained.
