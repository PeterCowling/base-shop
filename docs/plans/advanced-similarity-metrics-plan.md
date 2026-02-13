---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: none
Feature-Slug: advanced-similarity-metrics
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-replan
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall is effort-weighted average (S=1, M=2, L=3)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Advanced Similarity Metrics Library Plan

## Summary

This plan adds a new `packages/lib/src/math/similarity/` module with five advanced dependence/similarity metrics: Hoeffding's D, Distance Correlation, Jensen-Shannon Divergence, Kendall's Tau, and Normalized Mutual Information. Work is staged so the highest-risk assumptions are validated early, then a horizon checkpoint is used before finishing remaining metrics and integration. The plan keeps the implementation TypeScript-only, pure-function-first, and aligned with existing math-module patterns in `@acme/lib`. It uses explicit validation contracts per metric and targeted package test commands (`pnpm --filter @acme/lib test -- ...`) rather than unscoped Jest invocations.

## Goals

- Add five advanced similarity/dependence metrics under `packages/lib/src/math/similarity/`.
- Preserve existing library design standards: pure functions, deterministic behavior, explicit edge-case handling.
- Provide reliable numerical validation coverage for each metric and a cross-metric integration suite.
- Keep rollout low-risk by using a checkpoint and an explicit NMI investigation gate before final implementation.

## Non-goals

- Integrating these metrics into app-level ranking/search pipelines in this task.
- Adding Rust/Python dependencies or sidecars.
- Shipping ANN/vector index infrastructure.
- Introducing runtime logging/telemetry in these math functions.

## Constraints & Assumptions

- Constraints:
  - TypeScript-only implementation.
  - Public APIs accept `ReadonlyArray<number>` and remain side-effect free.
  - Invalid-input behavior must be explicit and consistent across metrics.
  - Testing must use targeted package commands (`pnpm --filter @acme/lib test -- ...`).
- Assumptions:
  - O(n^2) metrics are acceptable for current planned analytical usage.
  - A two-pass design for Distance Correlation is sufficient to avoid memory blow-ups.
  - Existing math test infrastructure remains the primary validation harness.

## Fact-Find Reference

- Related brief: `docs/plans/advanced-math-algorithms-fact-find.md`
- Key findings carried into this plan:
  - Opportunity K identified this work as TypeScript-feasible and high leverage for richer dependency analysis.
  - Existing library already supports Pearson/Spearman but lacks non-monotonic dependence metrics.
  - External references (fast_vector_similarity, hoeffdings_d_explainer) are algorithm references only; no runtime dependency adoption.
- Validation-foundation note:
  - The legacy fact-find predates current `/lp-fact-find` validation-frontmatter standards. This plan backfills confidence using repository evidence and targeted baseline test runs.

## Existing System Notes

- Key modules/files:
  - `packages/lib/src/math/index.ts` - current math barrel export surface.
  - `packages/lib/src/math/statistics/correlation.ts` - existing Pearson/Spearman baseline and NaN-on-invalid behavior.
  - `packages/lib/src/math/statistics/__tests__/correlation.test.ts` - current correlation validation style.
  - `packages/lib/src/math/statistics/__tests__/descriptive.test.ts` - extensive deterministic fixtures/patterns.
  - `packages/lib/src/index.ts` - top-level export aggregation patterns.
  - `packages/lib/package.json` - package export map (`./math/*`) relevant to new module exposure.
- Patterns to follow:
  - Pure-function module style from `packages/lib/src/math/statistics/`.
  - Explicit edge-case tests and NaN behavior assertions in existing statistics suites.
  - Package-scoped targeted test execution from `@acme/lib` script conventions.

## Proposed Approach

- Option A: Implement all five metrics in one uninterrupted batch.
  - Trade-off: faster on paper, but high compounding uncertainty (especially NMI binning/contract choices).
- Option B (chosen): Stage implementation with early core metrics + checkpoint + explicit NMI investigation gate.
  - Trade-off: one additional planning/control task, but lower risk and clearer confidence progression.
- Option C: Use external implementation bindings (Rust/Python).
  - Trade-off: rejected by hard constraints.

Chosen: Option B, because it validates the hardest assumptions early, keeps implementation quality high, and avoids committing deeply before evidence is gathered.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| ASM-01 | IMPLEMENT | Create similarity module scaffold + shared validation contract | 90% | S | Complete (2026-02-13) | - | ASM-02, ASM-03, ASM-05, ASM-06, ASM-07 |
| ASM-02 | IMPLEMENT | Implement Hoeffding's D + deterministic fixtures/tests | 83% | M | Complete (2026-02-13) | ASM-01 | ASM-04 |
| ASM-03 | IMPLEMENT | Implement Distance Correlation + memory-safe two-pass tests | 84% | M | Pending | ASM-01 | ASM-04 |
| ASM-04 | CHECKPOINT | Horizon checkpoint after first core metrics | 95% | S | Pending | ASM-02, ASM-03 | ASM-05, ASM-06, ASM-07 |
| ASM-05 | INVESTIGATE | Resolve NMI contract/binning calibration before implementation | 76% ⚠️ | M | Pending | ASM-04 | ASM-08 |
| ASM-06 | IMPLEMENT | Implement Jensen-Shannon divergence/distance | 88% | S | Pending | ASM-04 | ASM-09 |
| ASM-07 | IMPLEMENT | Implement Kendall's Tau-b (O(n log n)) | 85% | M | Pending | ASM-04 | ASM-09 |
| ASM-08 | IMPLEMENT | Implement NMI discrete + binned modes using ASM-05 decisions | 81% | M | Pending | ASM-05 | ASM-09 |
| ASM-09 | IMPLEMENT | Add integration suite, docs, and final export hardening | 83% | M | Pending | ASM-06, ASM-07, ASM-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Active tasks

- ASM-03 - Unblocked, ready to build.
- ASM-05 - Required investigation gate before ASM-08 can start.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | ASM-01 | - | Foundation scaffold + contract utilities |
| 2 | ASM-02, ASM-03 | ASM-01 | Core dependency metrics can build in parallel |
| 3 | ASM-04 | ASM-02, ASM-03 | Reassess horizon before committing to remaining work |
| 4 | ASM-05, ASM-06, ASM-07 | ASM-04 | Investigation + two independent implementations |
| 5 | ASM-08 | ASM-05 | NMI implementation gated on calibration decisions |
| 6 | ASM-09 | ASM-06, ASM-07, ASM-08 | Cross-metric integration + docs hardening |

**Max parallelism:** 3 | **Critical path:** 6 waves | **Total tasks:** 9

## Tasks

### ASM-01: Create similarity module scaffold + shared validation contract
- **Type:** IMPLEMENT
- **Deliverable:** code-change (`packages/lib/src/math/similarity/*`) + baseline tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/index.ts`, `packages/lib/src/math/similarity/common.ts`, `packages/lib/src/math/similarity/__tests__/common.test.ts`, `packages/lib/src/math/index.ts`, `[readonly] packages/lib/package.json`
- **Depends on:** -
- **Blocks:** ASM-02, ASM-03, ASM-05, ASM-06, ASM-07
- **Confidence:** 90%
  - Implementation: 91% - module/barrel and shared validator patterns match established math package conventions.
  - Approach: 90% - centralizing validation avoids duplicate edge-case logic across all metrics.
  - Impact: 90% - blast radius is local to `@acme/lib/math` exports.
- **Acceptance:**
  - New `similarity` module directory exists with barrel and shared validation utility.
  - Validation utility enforces common input policy (length checks, finite values, strict-mode throw path).
  - `packages/lib/src/math/index.ts` exports the new module.
- **Validation contract:**
  - TC-01: new module files compile and import cleanly.
  - TC-02: validation utility returns `NaN` in default mode for invalid inputs.
  - TC-03: strict mode throws `RangeError` with actionable message.
  - **Acceptance coverage:** TC-01 covers module scaffold/export; TC-02..TC-03 cover contract behavior.
  - **Validation type:** unit tests + package test run.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/common.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/common.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/lib test -- packages/lib/src/math/statistics/__tests__/correlation.test.ts` (23 passing).
  - Validation artifacts written: none.
  - Unexpected findings: no existing `similarity` module currently exists.
- **Rollout / rollback:**
  - Rollout: additive module introduction only.
  - Rollback: remove `similarity` export from math barrel and module directory.
- **Documentation impact:** none.
- **Notes / references:** `packages/lib/src/math/statistics/correlation.ts`.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `ee1ff2a6ba`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1 red-green cycle
  - Initial validation: FAIL expected (`Cannot find module '../common'`)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 90%
  - Delta reason: validation confirmed assumptions
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/common.test.ts` - PASS (8 tests)
  - Ran: `pnpm --filter @acme/lib test -- packages/lib/src/math/statistics/__tests__/correlation.test.ts` - PASS (23 tests)
  - Ran: `pnpm --filter @acme/lib lint` - PASS
  - Ran: `pnpm --filter @acme/lib build` - PASS
- **Documentation updated:** None required
- **Implementation notes:** Added similarity scaffold and shared validation helpers, plus math-barrel export wiring.

### ASM-02: Implement Hoeffding's D + deterministic fixtures/tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change + unit tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/hoeffding.ts`, `packages/lib/src/math/similarity/__tests__/hoeffding.test.ts`, `packages/lib/src/math/similarity/index.ts`
- **Depends on:** ASM-01
- **Blocks:** ASM-04
- **Confidence:** 83%
  - Implementation: 84% - algorithm is well-defined but tie semantics and scaling must be explicit.
  - Approach: 83% - adds genuinely missing non-monotonic dependency detection.
  - Impact: 83% - isolated function surface with targeted tests keeps regression risk bounded.
- **Acceptance:**
  - Implements documented Hoeffding's D variant with deterministic tie handling.
  - Handles invalid inputs and minimum sample-size constraints consistently with shared contract.
  - Includes deterministic fixtures for linear, independent, and non-monotonic patterns.
- **Validation contract:**
  - TC-01: independent fixture returns near-zero signal.
  - TC-02: monotonic fixture returns strong positive signal.
  - TC-03: non-monotonic deterministic fixture returns non-zero dependence.
  - TC-04: invalid inputs return `NaN` or throw in strict mode.
  - TC-05: repeated runs on tie-heavy fixture are deterministic.
  - **Acceptance coverage:** TC-01..TC-05 map 1:1 to correctness, edge handling, and determinism.
  - **Validation type:** unit tests.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/hoeffding.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/hoeffding.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Rank/tie precedent -> `packages/lib/src/math/statistics/correlation.ts` tie-ranking helper confirms deterministic tie pattern baseline.
- **Planning validation:**
  - Checks run: baseline correlation suite confirms current NaN/edge-case expectations.
  - Validation artifacts written: none.
  - Unexpected findings: none.
- **What would make this >=90%:** verify fixture outputs against two independent references (NumPy/R) committed as snapshots.
- **Rollout / rollback:**
  - Rollout: additive export in similarity barrel.
  - Rollback: remove metric export and test file only.
- **Documentation impact:** add metric usage caveats in similarity README (added in ASM-09).
- **Notes / references:** `docs/plans/advanced-math-algorithms-fact-find.md` Opportunity K.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `67259859f2`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Cycles: 2 red-green cycles
  - Initial validation: FAIL expected (`Cannot find module '../hoeffding'`)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 83%
  - Post-validation: 83%
  - Delta reason: validation confirmed implementation approach; ring-fixture threshold refined during red-green.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/hoeffding.test.ts` - PASS (6 tests)
  - Ran: `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/common.test.ts` - PASS (8 tests)
  - Ran: `pnpm --filter @acme/lib test -- packages/lib/src/math/statistics/__tests__/correlation.test.ts` - PASS (23 tests)
  - Ran: commit-hook lint path with `SKIP_TYPECHECK=1` (user-directed bypass of unrelated package type failures) - PASS for staged scope
- **Documentation updated:** None required
- **Implementation notes:** Added Hoeffding's D (scaled `D* = 30*D`), deterministic tie handling, strict `<` Q-count semantics, and metric export wiring.

### ASM-03: Implement Distance Correlation + memory-safe two-pass tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change + unit tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/distance-correlation.ts`, `packages/lib/src/math/similarity/__tests__/distance-correlation.test.ts`, `packages/lib/src/math/similarity/index.ts`
- **Depends on:** ASM-01
- **Blocks:** ASM-04
- **Confidence:** 84%
  - Implementation: 85% - formula is standard; memory-safe accumulation requires care.
  - Approach: 84% - fills a concrete detection gap where Pearson can miss nonlinear dependence.
  - Impact: 84% - function is isolated and testable with deterministic fixtures.
- **Acceptance:**
  - Implements distance correlation using two-pass accumulation to avoid full matrix allocation.
  - Returns near-zero for independence fixtures and high values for deterministic nonlinear dependence.
  - Follows shared invalid-input policy.
- **Validation contract:**
  - TC-01: linear deterministic fixture returns value close to 1.
  - TC-02: symmetric quadratic fixture returns high value while Pearson baseline remains near 0.
  - TC-03: independent fixture returns low value.
  - TC-04: invalid/constant-input paths return `NaN` or strict errors.
  - **Acceptance coverage:** TC-01..TC-04 cover correctness and failure handling.
  - **Validation type:** unit tests.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/distance-correlation.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/distance-correlation.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Runtime feasibility -> O(n)-memory requirement selected to avoid large in-memory matrices in Node runtime.
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/lib test -- packages/lib/src/math/statistics/__tests__/descriptive.test.ts` (73 passing).
  - Validation artifacts written: none.
  - Unexpected findings: none.
- **What would make this >=90%:** add benchmark snapshot for n=1k and n=10k fixture sizes.
- **Rollout / rollback:**
  - Rollout: additive metric export.
  - Rollback: remove distance-correlation files and export.
- **Documentation impact:** document estimator choice and complexity notes in similarity README (ASM-09).
- **Notes / references:** `packages/lib/src/math/statistics/__tests__/correlation.test.ts` (baseline behavior).

### ASM-04: Horizon checkpoint — reassess remaining plan
- **Type:** CHECKPOINT
- **Deliverable:** plan update/re-sequencing artifact.
- **Execution-Skill:** /lp-replan
- **Affects:** `docs/plans/advanced-similarity-metrics-plan.md`
- **Depends on:** ASM-02, ASM-03
- **Blocks:** ASM-05, ASM-06, ASM-07
- **Confidence:** 95%
  - Implementation: 95% - procedural checkpoint task.
  - Approach: 95% - reduces compounding uncertainty before second phase.
  - Impact: 95% - low cost, high risk reduction.
- **Acceptance:**
  - Re-score ASM-05..ASM-09 using evidence from ASM-02/ASM-03 outputs.
  - Confirm shared validation contract and fixture strategy are holding.
  - Update dependencies/confidence if observed runtime or numerical behavior differs from assumptions.
- **Horizon assumptions to validate:**
  - Shared contract utility is sufficient for all remaining metrics.
  - NMI complexity remains isolated to calibration/API decisions.
  - Export and test structure scales cleanly to integration stage.

### ASM-05: Resolve NMI contract/binning calibration before implementation
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact (`docs/plans/advanced-similarity-metrics-nmi-calibration.md`) + plan update.
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/mutual-information.ts` (planned), `packages/lib/src/math/similarity/__tests__/mutual-information.test.ts` (planned), `docs/plans/advanced-similarity-metrics-plan.md`
- **Depends on:** ASM-04
- **Blocks:** ASM-08
- **Confidence:** 76% ⚠️ BELOW THRESHOLD
  - Implementation: 80% - formulas are known, but practical binning/normalization choices need proof.
  - Approach: 76% - unresolved API semantics can create inconsistent results.
  - Impact: 76% - poor calibration can mislead downstream analytics.
- **Blockers / questions to answer:**
  - Which NMI normalization variant is canonical for this module (fixed formula and documented range guarantees)?
  - What default binning strategy is stable for heavy-tail fixtures (`equalWidth` vs `quantile`)?
  - Which fixture set best prevents regressions while avoiding overfitting to one distribution shape?
- **Acceptance:**
  - Lock one canonical NMI API contract with explicit normalization/binning defaults.
  - Produce deterministic fixture set and acceptance thresholds for ASM-08.
  - Raise ASM-08 confidence inputs to >=80% (or explicitly record waiver).
- **Notes / references:** NMI uncertainty was the only sub-80 IMPLEMENT area in previous revision and is now isolated.

### ASM-06: Implement Jensen-Shannon divergence/distance
- **Type:** IMPLEMENT
- **Deliverable:** code-change + unit tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/jensen-shannon.ts`, `packages/lib/src/math/similarity/__tests__/jensen-shannon.test.ts`, `packages/lib/src/math/similarity/index.ts`
- **Depends on:** ASM-04
- **Blocks:** ASM-09
- **Confidence:** 88%
  - Implementation: 89% - stable formula and well-known edge cases.
  - Approach: 88% - adds information-theoretic divergence not covered by existing module.
  - Impact: 88% - contained API + deterministic fixtures keep blast radius low.
- **Acceptance:**
  - Exposes divergence and distance variants.
  - Handles normalized and count-style non-negative inputs per chosen contract.
  - Correctly handles zero-probability edge cases.
- **Validation contract:**
  - TC-01: identical distributions return 0.
  - TC-02: disjoint distributions approach maximum divergence.
  - TC-03: symmetry property holds (`JSD(P,Q) = JSD(Q,P)`).
  - TC-04: distance equals `sqrt(divergence)`.
  - TC-05: invalid inputs follow shared error policy.
  - **Acceptance coverage:** TC-01..TC-05 map directly to formula correctness and contract behavior.
  - **Validation type:** unit tests.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/jensen-shannon.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/jensen-shannon.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **What would make this >=90%:** add snapshot fixtures generated from a second independent implementation.
- **Rollout / rollback:**
  - Rollout: additive export.
  - Rollback: remove jensen-shannon files and export.
- **Documentation impact:** add JSD examples and caveats in similarity README (ASM-09).
- **Notes / references:** current invalid-input precedent in `packages/lib/src/math/statistics/correlation.ts`.

### ASM-07: Implement Kendall's Tau-b (O(n log n))
- **Type:** IMPLEMENT
- **Deliverable:** code-change + unit tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/kendall.ts`, `packages/lib/src/math/similarity/__tests__/kendall.test.ts`, `packages/lib/src/math/similarity/index.ts`
- **Depends on:** ASM-04
- **Blocks:** ASM-09
- **Confidence:** 85%
  - Implementation: 86% - merge-sort inversion counting is known but tie-correction details require care.
  - Approach: 85% - complements existing Spearman by adding pairwise concordance metric.
  - Impact: 85% - isolated function and deterministic fixtures reduce systemic risk.
- **Acceptance:**
  - Implements tau-b with tie correction.
  - Achieves O(n log n) algorithmic structure.
  - Handles perfect concordance/discordance and tie-heavy edge cases.
- **Validation contract:**
  - TC-01: perfect concordance returns 1.
  - TC-02: perfect discordance returns -1.
  - TC-03: tie-heavy fixtures stay within [-1, 1] and deterministic.
  - TC-04: invalid inputs follow shared error policy.
  - **Acceptance coverage:** TC-01..TC-04 cover correctness and edge behavior.
  - **Validation type:** unit tests + informational benchmark assertion.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/kendall.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/kendall.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: existing correlation tests confirm current rank-based behavior expectations.
  - Validation artifacts written: none.
  - Unexpected findings: none.
- **What would make this >=90%:** cross-check merge-sort result against naive O(n^2) reference for randomized seeded fixtures.
- **Rollout / rollback:**
  - Rollout: additive export.
  - Rollback: remove kendall files and export.
- **Documentation impact:** add tau-b tie semantics note in similarity README (ASM-09).
- **Notes / references:** existing rank treatment in `packages/lib/src/math/statistics/correlation.ts`.

### ASM-08: Implement NMI discrete + binned modes using ASM-05 decisions
- **Type:** IMPLEMENT
- **Deliverable:** code-change + unit tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/mutual-information.ts`, `packages/lib/src/math/similarity/__tests__/mutual-information.test.ts`, `packages/lib/src/math/similarity/index.ts`
- **Depends on:** ASM-05
- **Blocks:** ASM-09
- **Confidence:** 81%
  - Implementation: 82% - feasible once calibration decisions are fixed.
  - Approach: 81% - API is useful, but must be tightly specified to avoid misuse.
  - Impact: 81% - moderate risk due interpretation sensitivity, controlled by explicit fixtures/docs.
- **Acceptance:**
  - Implements both discrete-label and binned-continuous entry points.
  - Uses canonical normalization and defaults from ASM-05.
  - Edge cases (constant arrays, sparse bins, non-finite values) are deterministic and documented.
- **Validation contract:**
  - TC-01: independent fixture returns near 0.
  - TC-02: bijective mapping fixture returns near 1.
  - TC-03: many-to-one mapping fixture returns high but <1.
  - TC-04: heavy-tail fixture comparison demonstrates deterministic behavior across configured binning modes.
  - TC-05: invalid inputs follow shared error policy.
  - **Acceptance coverage:** TC-01..TC-05 map to correctness, stability, and failure behavior.
  - **Validation type:** unit tests.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/mutual-information.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/mutual-information.test.ts`
- **Execution plan:** Red -> Green -> Refactor.
- **What would make this >=90%:** calibrate and snapshot one real-world heavy-tail dataset from internal analytics export.
- **Rollout / rollback:**
  - Rollout: additive export after ASM-05 decisions are locked.
  - Rollback: remove NMI export and files, keep investigation artifact for future attempts.
- **Documentation impact:** document binning strategy defaults and interpretation limits in similarity README (ASM-09).
- **Notes / references:** requires completed `docs/plans/advanced-similarity-metrics-nmi-calibration.md`.

### ASM-09: Add integration suite, docs, and final export hardening
- **Type:** IMPLEMENT
- **Deliverable:** code-change + integration tests + module documentation.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/math/similarity/__tests__/integration.test.ts`, `packages/lib/src/math/similarity/README.md`, `packages/lib/src/math/similarity/index.ts`, `packages/lib/src/math/index.ts`, `[readonly] packages/lib/src/index.ts`
- **Depends on:** ASM-06, ASM-07, ASM-08
- **Blocks:** -
- **Confidence:** 83%
  - Implementation: 84% - integration and docs are straightforward once metric APIs are stable.
  - Approach: 83% - final hardening reduces drift and clarifies use-cases.
  - Impact: 83% - broadest touchpoint in this plan, but still package-local.
- **Acceptance:**
  - Cross-metric integration tests confirm expected relative behavior on shared deterministic datasets.
  - Similarity module README documents API signatures, edge cases, and recommended usage.
  - Package tests for all similarity metrics pass via targeted commands.
- **Validation contract:**
  - TC-01: integration fixture demonstrates metrics diverge where expected (linear vs nonlinear datasets).
  - TC-02: full similarity test set passes in `@acme/lib` package.
  - TC-03: docs examples execute with matching outputs.
  - TC-04: lint passes for changed package files.
  - **Acceptance coverage:** TC-01..TC-04 cover integration behavior, functional correctness, docs, and code quality.
  - **Validation type:** integration tests + package lint.
  - **Validation location/evidence:** `packages/lib/src/math/similarity/__tests__/integration.test.ts`, `packages/lib/src/math/similarity/README.md`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- packages/lib/src/math/similarity/__tests__/integration.test.ts` and `pnpm --filter @acme/lib lint`
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: baseline package tests prove current harness stability for math modules.
  - Validation artifacts written: none.
  - Unexpected findings: `pnpm --filter @acme/lib test -- --listTests` returns "No tests found" under current script wiring; direct targeted-path runs remain reliable and are used in this plan.
- **What would make this >=90%:** run full `@acme/lib` test suite clean plus benchmark snapshot artifact.
- **Rollout / rollback:**
  - Rollout: merge as additive package API extension.
  - Rollback: remove similarity export line(s) and module directory.
- **Documentation impact:** add/maintain `packages/lib/src/math/similarity/README.md` and update any affected library docs referencing available math metrics.
- **Notes / references:** `packages/lib/src/math/index.ts`, `packages/lib/package.json` export map.

## Risks & Mitigations

- NMI binning/normalization ambiguity can produce misleading outputs.
  - Mitigation: isolate in ASM-05 investigation gate before ASM-08 implementation.
- O(n^2) metrics may become slow for very large inputs.
  - Mitigation: document practical limits; keep deterministic benchmark snapshots in integration stage.
- Tie handling differences between references can cause fixture mismatches.
  - Mitigation: lock tie semantics in docs and tests per metric.
- Cross-metric behavior may appear inconsistent to consumers.
  - Mitigation: ship integration cookbook test cases plus README interpretation notes.

## Observability

- Logging: none in runtime API (pure functions).
- Metrics: benchmark outputs captured in test artifacts for regression tracking.
- Alerts/Dashboards: not applicable in this package-level scope.

## Acceptance Criteria (overall)

- [ ] `packages/lib/src/math/similarity/` exists with all planned metrics and shared contract utilities.
- [ ] All metric-specific validation contracts pass through targeted `@acme/lib` tests.
- [ ] NMI implementation is gated by completed calibration investigation (ASM-05).
- [ ] Integration tests and README provide coherent cross-metric usage guidance.
- [ ] Export surface remains stable and package lint passes.

## Decision Log

- 2026-02-13: Kept `ASM-*` lineage but re-sequenced with an explicit mid-horizon checkpoint (ASM-04).
- 2026-02-13: Converted prior sub-threshold NMI implementation risk into an explicit INVESTIGATE gate (ASM-05) before implementation (ASM-08).
- 2026-02-13: Standardized validation commands to package-scoped `pnpm --filter @acme/lib test -- ...` usage.
- 2026-02-13: Retained TypeScript-only implementation boundary from fact-find constraints.
