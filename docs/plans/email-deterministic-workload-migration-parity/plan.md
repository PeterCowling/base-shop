---
Type: Plan
Status: Complete
Domain: STRATEGY
Workstream: Code
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02 (Plan complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-deterministic-workload-migration-parity
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 94%
Confidence-Method: Code-path audit + existing quality-gate contracts + bounded migration scope
---

# Email Deterministic Workload Migration With Parity

## Summary

Move a concrete email workload from external rewrite dependence to deterministic code while enforcing a hard parity contract: migrated behavior must not reduce quality-gate outcomes versus existing behavior.

## Completion Gate

Plan is complete for deterministic extraction scope in `draft_refine` with parity enforcement.

Completed deterministic repairs now cover quality-failure classes:
- `missing_signature`
- `missing_required_link`
- `missing_required_reference`
- `reference_not_applicable`
- `unanswered_questions`
- `prohibited_claims`
- `policy_prohibited_content`

Remaining quality checks are intentionally not auto-repaired in this plan:
- `contradicts_thread`: semantic contradiction risk; deterministic repair could silently alter intent.
- `missing_policy_mandatory_content`: requires policy payload context not supplied in `draft_refine` quality invocation.
- `missing_plaintext` / `missing_html`: structurally guarded by tool contracts and HTML derivation path.

For all remaining cases, universal baseline parity fallback remains the non-regression safety net.

## Active tasks
- [x] TASK-01: Add deterministic refinement mode with non-regression parity guard and regression tests
- [x] TASK-02: Add deterministic intent-confidence router in `draft_interpret` with parity fixtures vs current extraction
- [x] TASK-03: Add deterministic template-slot conflict resolver in `draft_generate` with parity fixtures vs baseline template output
- [x] TASK-04: Add deterministic refinement parity corpus test (>=10 fixtures) to enforce non-regression contract
- [x] TASK-05: Add deterministic-path telemetry slice for refinement pass/fallback rates in draft signal stats
- [x] TASK-06: Default `draft_refine` to auto deterministic execution when external rewrite is absent
- [x] TASK-07: Add deterministic telemetry health status to `draft_signal_stats` for operator visibility
- [x] TASK-08: Add `draft_refine` `auto_best` mode to prefer deterministic output unless external quality is better
- [x] TASK-09: Enforce universal baseline parity fallback in `draft_refine` across all refinement modes
- [x] TASK-10: Attribute deterministic attempts in telemetry even when `auto_best` or fallback emits external mode
- [x] TASK-11: Set `draft_refine` default mode to `auto_best` while preserving explicit external compatibility
- [x] TASK-12: Infer `rewrite_reason` deterministically when callers provide `none`
- [x] TASK-13: Normalize external candidate text deterministically before quality/parity evaluation
- [x] TASK-14: Add deterministic missing-signature repair before parity fallback
- [x] TASK-15: Add deterministic link/reference repair before parity fallback
- [x] TASK-16: Add deterministic unanswered-question repair before parity fallback
- [x] TASK-17: Add deterministic prohibited-claims repair before parity fallback

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add deterministic refinement mode and quality parity guard so migrated path is never worse than baseline | 91% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Deterministic intent-confidence router with parity fixtures and fallback contract | 84% | M | Complete (2026-03-02) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Deterministic template-slot conflict resolver with parity fixtures and no-regression fallback | 81% | M | Complete (2026-03-02) | TASK-02 | - |
| TASK-04 | IMPLEMENT | Deterministic refinement parity corpus with >=10 fixtures and baseline comparison assertions | 88% | S | Complete (2026-03-02) | TASK-03 | - |
| TASK-05 | IMPLEMENT | Deterministic refinement telemetry aggregation (pass/fallback/quality rate) in draft signal stats | 86% | S | Complete (2026-03-02) | TASK-04 | - |
| TASK-06 | IMPLEMENT | `draft_refine` auto mode defaults to deterministic path when external refine text is absent | 85% | S | Complete (2026-03-02) | TASK-05 | - |
| TASK-07 | IMPLEMENT | Deterministic telemetry health signal in `draft_signal_stats` with thresholded status | 84% | S | Complete (2026-03-02) | TASK-06 | - |
| TASK-08 | IMPLEMENT | `draft_refine` auto_best chooses deterministic unless external candidate has better quality | 82% | S | Complete (2026-03-02) | TASK-07 | - |
| TASK-09 | IMPLEMENT | `draft_refine` parity guard falls back to baseline when any selected candidate is lower quality | 86% | S | Complete (2026-03-02) | TASK-08 | - |
| TASK-10 | IMPLEMENT | Deterministic telemetry attribution captures attempted/selected outcomes across `auto_best` + fallback paths | 85% | S | Complete (2026-03-02) | TASK-09 | - |
| TASK-11 | IMPLEMENT | Default `draft_refine` mode to `auto_best` so deterministic candidate is considered by default with parity fallback | 84% | S | Complete (2026-03-02) | TASK-10 | - |
| TASK-12 | IMPLEMENT | Deterministically infer refinement rewrite reason for telemetry when explicit reason is absent | 83% | S | Complete (2026-03-02) | TASK-11 | - |
| TASK-13 | IMPLEMENT | Deterministically normalize external candidate text to remove formatting noise before parity checks | 84% | S | Complete (2026-03-02) | TASK-12 | - |
| TASK-14 | IMPLEMENT | Deterministically repair `missing_signature` quality failures prior to baseline fallback | 82% | S | Complete (2026-03-02) | TASK-13 | - |
| TASK-15 | IMPLEMENT | Deterministically repair missing link/reference failures prior to baseline fallback | 81% | S | Complete (2026-03-02) | TASK-14 | - |
| TASK-16 | IMPLEMENT | Deterministically recover missing answer content for `unanswered_questions` failures prior to fallback | 80% | S | Complete (2026-03-02) | TASK-15 | - |
| TASK-17 | IMPLEMENT | Deterministically scrub prohibited claim phrases prior to fallback | 82% | S | Complete (2026-03-02) | TASK-16 | - |

## Tasks

### TASK-01: Add deterministic refinement mode with non-regression parity guard and regression tests
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 91%
- **Acceptance:**
  - Tool accepts deterministic execution path for refinement without requiring externally rewritten text.
  - Deterministic path runs the same quality gate and enforces parity guard: if deterministic output is worse than original by quality pass/fail, fallback to original.
  - Existing external path behavior remains compatible (no regression for current callers).
  - Regression tests cover deterministic success and deterministic fallback-on-parity-fail behavior.
- **Validation contract (TC):**
  - TC-01: deterministic mode without `refinedBodyPlain` returns non-error result and quality payload.
  - TC-02: deterministic mode can improve a failing original draft to passing quality in a controlled fixture.
  - TC-03: deterministic mode falls back to original when deterministic output fails and original passes.
  - TC-04: default mode still errors when `refinedBodyPlain` is missing (backward compatibility guard).
  - TC-05: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-06: `pnpm --filter @acme/mcp-server lint` passes.

## Feature Parity Contract

For every deterministic migration in this plan, parity is mandatory and enforced in-task:
- Compare migrated output against baseline path using the same quality gate.
- If migrated output degrades `quality.passed` relative to baseline, runtime must fail over to baseline output.
- Keep existing caller contract stable unless an explicit versioned schema change is introduced.

### TASK-02: Deterministic intent-confidence router in `draft_interpret`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/__tests__/draft-interpret.intent-routing-parity.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 84%
- **Acceptance:**
  - Deterministic intent extraction path exists and computes confidence metadata.
  - Runtime parity guard falls back to legacy extraction whenever deterministic extraction has weaker coverage.
  - Output intent arrays are never lower-coverage than legacy baseline for the same input.
- **Validation contract (TC):**
  - TC-01: clear multi-signal input selects deterministic routing.
  - TC-02: weak deterministic case falls back to legacy routing and preserves legacy extraction.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic intent extraction functions (`extractQuestionsDeterministic`, `extractRequestsDeterministic`) and confidence scoring in `draft-interpret.ts`.
- Added `routeIntents` parity router that compares deterministic vs legacy coverage and auto-falls back with `fallback_reason: "deterministic_under_extract"` if deterministic coverage is weaker.
- Added output metadata field `intent_routing` to make selection and confidence observable without changing core `intents` contract.
- Added regression tests in `draft-interpret.intent-routing-parity.test.ts` for deterministic-selected and legacy-fallback paths.

### TASK-03: Deterministic template-slot conflict resolver in `draft_generate`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 81%
- **Acceptance:**
  - Deterministic slot resolver path is applied before final quality check.
  - Runtime parity guard falls back to legacy slot resolver whenever deterministic resolver leaves unresolved slot markers.
  - Generated draft body is never worse than baseline for unresolved-slot cases.
- **Validation contract (TC):**
  - TC-01: resolvable-slot case selects deterministic resolver.
  - TC-02: unresolved-slot case falls back to legacy resolver and removes unresolved marker.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic slot resolver (`resolveSlotsDeterministic`) in `draft-generate.ts` that tracks unresolved slot markers instead of silently removing them.
- Added parity wrapper (`resolveSlotsWithParity`) that compares deterministic slot outcome and falls back to legacy `resolveSlots` when unresolved markers exist.
- Added output metadata `slot_resolution` to expose selected path (`deterministic|legacy`) and fallback reason for auditability.
- Added regression tests in `draft-generate.test.ts`:
  - deterministic selected when all slot markers are resolvable,
  - legacy fallback selected when unresolved marker is present and final draft removes unresolved marker.

### TASK-04: Deterministic refinement parity corpus test
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/__tests__/draft-refine.parity-corpus.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 88%
- **Acceptance:**
  - A corpus test with at least 10 fixtures compares deterministic refinement against baseline external identity path.
  - Test asserts deterministic result is never lower-quality than baseline by pass/fail and failed-check count.
- **Validation contract (TC):**
  - TC-01: corpus fixture count >=10.
  - TC-02: each fixture enforces deterministic non-regression assertions.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added `draft-refine.parity-corpus.test.ts` with 10 fixtures covering short/no-signature/policy/info/prohibited-claim patterns.
- For each fixture, test compares:
  - baseline (`refinement_mode: "external"`, identity refine),
  - deterministic (`refinement_mode: "deterministic_only"`).
- Assertions enforce parity contract:
  - if baseline passes, deterministic must pass,
  - deterministic failed-check count must be <= baseline failed-check count.

### TASK-05: Deterministic refinement telemetry slice
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/utils/signal-events.ts`, `packages/mcp-server/src/tools/draft-signal-stats.ts`, `packages/mcp-server/src/__tests__/signal-events.test.ts`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 86%
- **Acceptance:**
  - Refinement events encode deterministic mode and parity fallback outcomes.
  - `countSignalEvents` includes deterministic refinement aggregates (total/applied/fallback/quality pass rate).
  - `draft_signal_stats` description and output contract cover deterministic telemetry slice.
- **Validation contract (TC):**
  - TC-01: legacy/no-mode events still return deterministic metrics as zeroes.
  - TC-02: deterministic events compute expected aggregate counts and pass rate.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added optional refinement event fields: `refinement_mode`, `quality_passed`, `quality_failed_checks_count`, `parity_fallback`.
- `draft_refine` now emits those fields for no-op, deterministic fallback, and applied-refinement outcomes.
- Extended signal stats aggregation with `deterministic_refinement` block: `{ total, applied, fallback, quality_observed, quality_passed, quality_pass_rate }`.
- Added regression tests in `signal-events.test.ts` for:
  - zeroed deterministic metrics on legacy events,
  - deterministic aggregate calculations including fallback and pass rate.

### TASK-06: `draft_refine` auto-default deterministic execution
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.test.ts`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 85%
- **Acceptance:**
  - `refinement_mode` supports `auto` and defaults to `auto`.
  - In auto mode, missing `refinedBodyPlain` routes to deterministic refinement path (no error).
  - Explicit `external` mode still requires `refinedBodyPlain` and fails closed when absent.
- **Validation contract (TC):**
  - TC-01: auto mode (default) without `refinedBodyPlain` returns non-error deterministic result.
  - TC-02: explicit `external` mode without `refinedBodyPlain` still returns validation error.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added `refinement_mode: "auto"` and made it default in `draft_refine` schema.
- Implemented `effectiveMode` routing:
  - `auto + refinedBodyPlain` -> `external`,
  - `auto + no refinedBodyPlain` -> `deterministic_only`.
- Preserved strict external compatibility by keeping the `external` missing-`refinedBodyPlain` validation error path.
- Updated tests:
  - existing missing-refined test now asserts error in explicit `external` mode,
  - new test asserts default auto mode without refined text succeeds on deterministic path.

### TASK-07: Deterministic telemetry health signal
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-signal-stats.ts`, `packages/mcp-server/src/__tests__/draft-signal-stats.test.ts`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 84%
- **Acceptance:**
  - `draft_signal_stats` returns operator-readable deterministic health state in addition to raw counts.
  - Health status thresholds are deterministic and test-covered.
  - Existing raw stats fields remain backward-compatible.
- **Validation contract (TC):**
  - TC-01: low deterministic sample returns `insufficient_data`.
  - TC-02: pass rate >=95% with sufficient sample returns `healthy`.
  - TC-03: pass rate <95% with sufficient sample returns `watch`.
  - TC-04: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-05: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added `deterministic_health` computed status to `draft_signal_stats` output.
- Thresholds implemented:
  - `<10` deterministic events -> `insufficient_data`,
  - `>=10` with `quality_pass_rate >= 0.95` -> `healthy`,
  - otherwise -> `watch`.
- Added dedicated tool tests in `draft-signal-stats.test.ts` covering all health branches and unknown-tool error path.

### TASK-08: `draft_refine` `auto_best` deterministic-preference mode
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.auto-best.test.ts`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 82%
- **Acceptance:**
  - `refinement_mode` supports `auto_best`.
  - `auto_best` evaluates deterministic and external candidates with the same quality gate and selects deterministic when not worse.
  - If deterministic is worse, `auto_best` selects external candidate (parity fallback).
- **Validation contract (TC):**
  - TC-01: `auto_best` chooses deterministic when both candidates are quality-equivalent.
  - TC-02: `auto_best` falls back to external when deterministic quality is worse.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added `auto_best` mode to `draft_refine` schema and tool input contract.
- Implemented candidate comparison using shared quality gate and deterministic preference rule (`not worse` => choose deterministic).
- Added `isCandidateWorse` comparator and mode-aware event emission.
- Added dedicated regression tests in `draft-refine.auto-best.test.ts` for deterministic-preferred and external-fallback branches.

### TASK-09: Universal baseline parity fallback in `draft_refine`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.test.ts`, `packages/mcp-server/src/__tests__/draft-refine.auto-best.test.ts`
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 86%
- **Acceptance:**
  - All refinement modes (`external`, `deterministic_only`, `auto`, `auto_best`) compare selected candidate quality to baseline (`originalBodyPlain`).
  - When selected candidate quality is worse than baseline, tool falls back to baseline output with `refinement_applied: false`.
  - Existing no-op and hard-rule behavior remains intact.
- **Validation contract (TC):**
  - TC-01: adversarial external refinement falls back to baseline.
  - TC-02: `auto_best` selected candidate that is worse than baseline falls back to baseline.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Moved baseline parity fallback from deterministic-only branch to universal post-selection guard in `draft-refine.ts`.
- Updated `draft-refine.test.ts` TC-01-03 to assert external-worse fallback behavior (no degraded output applied).
- Added `draft-refine.auto-best.test.ts` regression for auto-best selected-candidate baseline fallback.

### TASK-10: Deterministic telemetry attribution for `auto_best` and fallbacks
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/utils/signal-events.ts`, `packages/mcp-server/src/__tests__/signal-events.test.ts`
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 85%
- **Acceptance:**
  - Refinement events include explicit deterministic-attempt metadata independent of emitted `refinement_mode`.
  - Signal aggregation counts deterministic attempts for `auto_best` paths (including parity fallback to baseline).
  - Existing deterministic counters remain backward compatible for legacy events.
- **Validation contract (TC):**
  - TC-01: deterministic-only events continue to aggregate as before.
  - TC-02: `auto_best` event with `deterministic_attempted: true` and emitted external mode increments deterministic totals.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added additive refinement-event fields: `refinement_strategy` and `deterministic_attempted`.
- `draft_refine` now emits deterministic-attempt metadata for no-op, fallback, and applied outcomes.
- `countSignalEvents` deterministic aggregation now prefers `deterministic_attempted` and falls back to legacy `refinement_mode === "deterministic_only"` for compatibility.
- Added `selected` metric in deterministic telemetry for deterministic-path attribution.
- Extended `signal-events.test.ts` with `auto_best` deterministic-attempt aggregation coverage.

### TASK-11: Default `draft_refine` mode to `auto_best`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.test.ts`, `packages/mcp-server/src/__tests__/draft-refine.auto-best.test.ts`
- **Depends on:** TASK-10
- **Blocks:** -
- **Confidence:** 84%
- **Acceptance:**
  - `draft_refine` defaults `refinement_mode` to `auto_best`.
  - Explicit `external` mode remains available and unchanged for callers that require strict external-only behavior.
  - Regression tests prove default path executes `auto_best` behavior and explicit external path still works.
- **Validation contract (TC):**
  - TC-01: omitted `refinement_mode` executes `auto_best` behavior.
  - TC-02: explicit `external` mode still uses provided refined text path.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Changed `draft_refine` schema default from `auto` to `auto_best`.
- Updated tool schema description to reflect default candidate-comparison behavior.
- Updated `draft-refine.test.ts` external-path case to pass `refinement_mode: "external"` explicitly.
- Added `draft-refine.auto-best.test.ts` case proving default mode executes `auto_best`.

### TASK-12: Deterministic rewrite-reason inference
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.rewrite-reason.test.ts`
- **Depends on:** TASK-11
- **Blocks:** -
- **Confidence:** 83%
- **Acceptance:**
  - When `rewrite_reason` is `none`, `draft_refine` emits a deterministic inferred reason based on edit-distance bands.
  - Explicit caller-provided rewrite reasons remain unchanged.
  - Parity and output behavior remain unchanged (telemetry-only enhancement).
- **Validation contract (TC):**
  - TC-01: `rewrite_reason: "none"` emits a non-`none` inferred reason for changed drafts.
  - TC-02: explicit `rewrite_reason` is preserved verbatim.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic `inferRewriteReason` helper in `draft-refine.ts` using `editDistancePct`.
- Unified event emission to use inferred reason across no-op, fallback, and applied branches.
- Added dedicated regression tests in `draft-refine.rewrite-reason.test.ts` for inferred and preserved reason paths.

### TASK-13: Deterministic external text normalization
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.external-normalization.test.ts`
- **Depends on:** TASK-12
- **Blocks:** -
- **Confidence:** 84%
- **Acceptance:**
  - External refinement candidates are normalized by deterministic whitespace/newline rules before quality gate evaluation.
  - `auto_best` external candidate branch uses the same normalization to keep candidate comparison stable.
  - Parity fallback contract remains unchanged.
- **Validation contract (TC):**
  - TC-01: external candidate with noisy whitespace/newlines is normalized in output.
  - TC-02: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-03: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added shared `normalizeCandidateText` helper in `draft-refine.ts`.
- Applied normalization to external mode candidate and `auto_best` external branch.
- Added regression coverage in `draft-refine.external-normalization.test.ts`.

### TASK-14: Deterministic signature repair
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.signature-repair.test.ts`
- **Depends on:** TASK-13
- **Blocks:** -
- **Confidence:** 82%
- **Acceptance:**
  - If candidate quality fails with `missing_signature`, `draft_refine` applies deterministic signature repair for non-protected categories.
  - Repaired candidate is accepted only when not worse than pre-repair candidate quality.
  - Universal baseline parity fallback remains active after repair stage.
- **Validation contract (TC):**
  - TC-01: external candidate missing signature is repaired and can pass quality without falling back to baseline.
  - TC-02: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-03: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic `repairMissingSignature` helper in `draft-refine.ts`.
- Added post-candidate quality repair branch keyed by `missing_signature` failed-check signal.
- Kept strict non-regression by accepting repaired candidate only when quality is not worse than pre-repair candidate.
- Added regression test `draft-refine.signature-repair.test.ts`.

### TASK-15: Deterministic link/reference repair
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.link-repair.test.ts`
- **Depends on:** TASK-14
- **Blocks:** -
- **Confidence:** 81%
- **Acceptance:**
  - When candidate quality fails for missing link/reference checks, `draft_refine` attempts deterministic repair by reusing links from baseline draft.
  - Repaired candidate is accepted only when not worse than pre-repair candidate quality.
  - Universal baseline parity fallback remains intact.
- **Validation contract (TC):**
  - TC-01: missing link in external candidate is repaired from baseline link and passes quality.
  - TC-02: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-03: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic `extractUrls` and `repairMissingLinks` helpers in `draft-refine.ts`.
- Added post-quality deterministic repair branch for `missing_required_link`, `missing_required_reference`, and `reference_not_applicable`.
- Added regression test `draft-refine.link-repair.test.ts` validating link recovery and quality pass.

### TASK-16: Deterministic unanswered-question repair
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.unanswered-repair.test.ts`
- **Depends on:** TASK-15
- **Blocks:** -
- **Confidence:** 80%
- **Acceptance:**
  - When candidate quality fails with `unanswered_questions`, `draft_refine` attempts deterministic recovery by appending relevant baseline answer sentences keyed to question terms.
  - Repaired candidate is accepted only when not worse than pre-repair candidate quality.
  - Baseline parity fallback remains unchanged.
- **Validation contract (TC):**
  - TC-01: unanswered-question candidate is repaired deterministically and passes quality in controlled regression fixture.
  - TC-02: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-03: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic helpers `tokenizeQuestionTerms`, `splitSentences`, and `repairUnansweredQuestions` in `draft-refine.ts`.
- Added post-quality deterministic repair branch keyed by `unanswered_questions` signal.
- Added regression test `draft-refine.unanswered-repair.test.ts`.

### TASK-17: Deterministic prohibited-claims repair
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.prohibited-claims-repair.test.ts`
- **Depends on:** TASK-16
- **Blocks:** -
- **Confidence:** 82%
- **Acceptance:**
  - When candidate quality fails for `prohibited_claims` or `policy_prohibited_content`, `draft_refine` applies deterministic phrase scrub for known prohibited claims.
  - Repaired candidate is accepted only when not worse than pre-repair candidate quality.
  - Baseline parity fallback remains unchanged.
- **Validation contract (TC):**
  - TC-01: prohibited claim candidate is scrubbed and quality passes in controlled fixture.
  - TC-02: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-03: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Added deterministic `repairProhibitedClaims` helper in `draft-refine.ts`.
- Added post-quality deterministic repair branch for `prohibited_claims` and `policy_prohibited_content`.
- Added regression test `draft-refine.prohibited-claims-repair.test.ts`.

#### Build evidence (2026-03-02)
- Added deterministic refinement execution path in `draft_refine` via `refinement_mode: "deterministic_only"` that does not require externally rewritten text.
- Implemented deterministic rewrite function with protected-category no-op behavior, signature completion, and whitespace normalization.
- Added runtime parity guard for deterministic path: if deterministic quality is worse than baseline (`originalBodyPlain`) by pass/fail or failed-check count, handler falls back to baseline output.
- Preserved external mode compatibility by requiring `refinedBodyPlain` when `refinement_mode` is `external`.
- Added regression coverage:
  - deterministic mode success path (`draft-refine.test.ts`, TC-01-02b),
  - deterministic parity fallback path via controlled quality-gate mock (`draft-refine.deterministic-parity.test.ts`).
- Validation executed:
  - `pnpm --filter @acme/mcp-server typecheck` -> pass.
  - `pnpm --filter @acme/mcp-server lint` -> pass.

## What would make this >=95%

- Add fixture corpus parity test that compares deterministic vs baseline outcomes across at least 10 representative guest-email patterns.
- Add telemetry dashboard slice for deterministic path pass/fallback rates after deployment.
