# Critique History: do-workflow-context-bloat-tracking

## Round 1 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [warning] `modules_loaded` stores raw `--module` strings, not canonical resolved paths — can fragment per-module trend data
  - [warning] `appendWorkflowStepTelemetry` dedupes by `telemetry_key` which hashes aggregate context bytes + module names — per-module breakdown with same aggregate could be collapsed as duplicate
  - [warning] Outcome contract says "tracked and trended" but no time-bucketing or trend output designed
  - [warning] Backward compatibility treated as automatic but needs explicit defaulting in summary/report code
- **Actions:** Added module identity design decision (use resolved paths); documented dedupe key update requirement; narrowed outcome statement to clarify "trending" scope; changed Rollout/rollback from N/A to Required with explicit backwards-compat handling; added risks #4 and #5; updated rehearsal trace with new scope areas

## Round 2 (codemoot)

- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (advisory)
- **Findings:**
  - [warning] Field name drift: `per_module_bytes` vs `context_path_bytes` used inconsistently
  - [warning] Test coverage gap incomplete — no dedupe-key regression test called for
  - [info] Several cited line numbers stale
- **Actions:** Unified field name to `per_module_bytes` throughout; added dedupe regression test requirement to test landscape; fixed stale line numbers
- **Final verdict:** credible (lp_score 4.0)

## Analysis — Round 1 (codemoot)

- **Score:** 5/10 → lp_score 2.5
- **Verdict:** needs_revision
- **Findings:**
  - [critical] Option A (`context_path_bytes` flat map) does not solve the module identity problem — cannot distinguish modules from non-modules at query time without replaying `resolveModulePath()` against current filesystem
  - [warning] Contract drift from fact-find `per_module_bytes` name to `context_path_bytes`
  - [warning] Extending `WorkflowTelemetrySummary` with per-module aggregates bloats health-check consumer
  - [info] Schema doc `lp-do-ideas-telemetry.schema.md` not mentioned as implementation surface
- **Actions:** Complete rewrite — chose Option B (module-only resolved-path map `per_module_bytes`); restored fact-find field name; kept per-module aggregation in report generator only (not summary); added schema doc to implementation surface

## Analysis — Round 2 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [warning] False claim that non-module file sizes can be derived from `context_paths + context_input_bytes` — only flat path list + aggregate total persisted, not per-file sizes
  - [warning] `per_module_bytes: Record<string, number> | null` conflates "known empty" (zero modules) with "legacy record missing field" — ambiguous backwards-compat handling
  - [warning] JSON report contract underspecified — reporter's JSON mode serializes `summarizeWorkflowStepTelemetry()` directly, so per-module data needs explicit JSON envelope
- **Actions:** Fixed false derivability claim; changed type to `per_module_bytes?: Record<string, number>` (optional/absent for legacy, empty `{}` for zero modules); specified `per_module_breakdown` JSON envelope key alongside existing summary

## Analysis — Round 3 (codemoot)

- **Score:** 9/10 → lp_score 4.5
- **Verdict:** approved
- **Findings:** None
- **Final verdict:** credible (lp_score 4.5)

## Plan — Round 1 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [warning] TASK-02 underspecified at implementation seam — `formatMarkdown()` receives summary not raw records; plan must specify per-module aggregation happens in `main()` from raw records, not leaked into `summarizeWorkflowStepTelemetry()`
  - [warning] JSON empty-case `null` collapses legacy vs zero-module distinction — fixed to use empty `{}` instead
  - [warning] Rehearsal trace says JSON envelope change is "additive" but it's actually breaking — fixed wording consistently
- **Actions:** Specified that `main()` computes per-module aggregation from raw records (line 106) and passes to `formatMarkdown()` as new parameter; changed JSON empty case from `null` to `{}` (empty object); fixed "additive" to "breaking change" consistently across rehearsal trace, consumer tracing, and risks sections

## Plan — Round 2 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [warning] TASK-02 Affects missing test file — no existing reporter test file, plan must name destination
  - [warning] TC-07 conflicts with execution plan — TC says show "No per-module data available" but execution says skip section
  - [warning] Report-level `{}` collapses legacy vs zero-module distinction — plan claims preservation but doesn't
  - [warning] "Partial coverage" promise in edge cases without mechanism to produce it
- **Actions:** Added test file path to TASK-02 Affects; aligned TC-07 with execution (Markdown omits section, JSON shows `{}`); acknowledged legacy/zero-module collapse is intentional at report level; removed partial-coverage claim, noting existing record-count context suffices

## Plan — Round 3 (codemoot)

- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (advisory)
- **Findings:**
  - [warning] Per-module aggregation must reapply same featureSlug/business filters as summary — otherwise scopes mismatch
  - [warning] Missing explicit coverage indicator for mixed old/new records — operators can't tell if breakdown is partial
- **Actions:** Added filter reapplication to execution step 1; added `per_module_record_count` to both Markdown and JSON output; Markdown section now shows "Based on N of M records with per-module data" prefix
