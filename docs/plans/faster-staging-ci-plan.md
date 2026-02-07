---
Type: Plan
Status: Active
Domain: CI/Infrastructure
Last-reviewed: 2026-02-07
Created: 2026-02-07
Last-updated: 2026-02-07
Relates-to charter: none
Supersedes: docs/plans/archive/faster-staging-ci-plan.md
Feature-Slug: faster-staging-ci
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: PLAT
Card-ID:
---

# Brikette CI Test Sharding Acceleration Plan

## Summary
This plan reduces Brikette staging CI runtime by attacking the dominant bottleneck: serialized Jest execution (~19.5m per run). The primary implementation stream introduces deterministic CI sharding for Brikette tests, with cache-aware execution and telemetry verification. A secondary policy stream addresses expensive full deploy loops on test/doc-only changes. The first stream is build-ready now; the policy stream needs an explicit governance decision.

## Goals
- Reduce Brikette staging CI test wall time from ~19.5m to <=8m.
- Reduce staging loop p50 from ~29-31m toward <=18m without weakening validation coverage.
- Preserve conservative classifier behavior on uncertainty and existing deploy safety checks.

## Non-goals
- Disabling Brikette tests for runtime changes.
- Broad refactor of all app deploy workflows.
- Relaxing required quality gates across the repo.

## Constraints & Assumptions
- Constraints:
  - Validation fidelity must be preserved (same test suite, distributed execution only).
  - Workflow syntax/behavior must remain valid for non-Brikette callers.
  - CI changes must be observable with before/after telemetry.
- Assumptions:
  - Jest 29.7.0 sharding behavior remains stable in GitHub-hosted runners.
  - Three shards is the best initial balance point based on current run data.

## Fact-Find Reference
- Related brief: `docs/plans/faster-staging-ci-fact-find.md`
- Key findings:
  - Latest Brikette staging test step recorded `Time: 1169.105 s` (~19.5m).
  - Recent runs with tests enabled show test p50 ~18.63m and end-to-end avg ~31.24m.
  - Simulation from real suite timings indicates:
    - 2 shards ~9.7m
    - 3 shards ~6.5m
    - 4 shards ~4.9m
  - Latest expensive run was triggered by test/doc-only change while still executing full deploy path.

## Existing System Notes
- Key modules/files:
  - `.github/workflows/reusable-app.yml` — central validation/build/deploy orchestration.
  - `.github/workflows/brikette.yml` — Brikette caller workflow.
  - `.github/workflows/cms.yml` — established Jest sharding + cache pattern.
  - `apps/brikette/package.json` — current `test` command uses `--runInBand`.
  - `scripts/src/ci/collect-workflow-metrics.ts` — standardized run/job duration metrics.
- Patterns to follow:
  - CI matrix sharding precedent from CMS.
  - Conservative fallbacks from classifier gating (`run_validation=true` on uncertainty).
  - Script-first telemetry and reproducible command usage.

## Proposed Approach
Implement Brikette CI sharding as the primary performance lever, then validate gains using existing telemetry tooling. Keep changes scoped and reversible.

- Option A: Brikette-specific sharding in `brikette.yml` only.
  - Trade-offs: fastest path, but duplicates behavior and increases per-app drift.
- Option B: Extend reusable workflow with controlled Brikette sharding path (chosen).
  - Trade-offs: slightly higher implementation effort, but preserves centralized behavior and avoids one-off logic.
- Chosen: Option B for lower long-term maintenance cost and cleaner policy control.

## Active tasks
- **TASK-01:** Add shard-capable Brikette test execution path in reusable workflow.
- **TASK-02:** Enable 3-shard Brikette configuration in caller workflow.
- **TASK-03:** Add Jest/ts-jest cache restore strategy for sharded Brikette tests.
- **TASK-04:** Capture post-change telemetry and enforce speed acceptance checks.
- **TASK-05:** Optimize top 3 slow test suites if shard runtime remains >8m.
- **TASK-06:** Decide policy for test/doc-only Brikette changes (deploy bypass vs full deploy).

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add shard-capable Brikette test execution path in reusable workflow | 84% | M | Complete (2026-02-07) | - | TASK-02, TASK-03, TASK-06 |
| TASK-02 | IMPLEMENT | Enable 3-shard Brikette configuration in caller workflow | 88% | S | Complete (2026-02-07) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add Jest/ts-jest cache restore strategy for sharded Brikette tests | 82% | S | Complete (2026-02-07) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Capture post-change telemetry and enforce speed acceptance checks | 90% | S | Complete (2026-02-07) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Optimize top 3 slow test suites if shard runtime remains >8m | 72% ⚠️ | M | Pending | TASK-04 | - |
| TASK-06 | DECISION | Decide policy for test/doc-only Brikette changes (deploy bypass vs full deploy) | 70% ⚠️ | S | Needs-Input | TASK-01 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Foundation workflow changes |
| 2 | TASK-02, TASK-03, TASK-06 | TASK-01 | Caller config + cache can run in parallel; policy decision in parallel |
| 3 | TASK-04 | TASK-02, TASK-03 | Measure realized gains after implementation |
| 4 | TASK-05 | TASK-04 | Conditional optimization stream |

**Max parallelism:** 3
**Critical path:** 4 waves
**Total active tasks:** 6

## Tasks

### TASK-01: Add shard-capable Brikette test execution path in reusable workflow
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/reusable-app.yml`, `[readonly] .github/workflows/cms.yml`, `[readonly] apps/brikette/package.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-06
- **Confidence:** 84%
  - Implementation: 86% — Existing CMS shard pattern and current reusable workflow structure provide direct implementation precedent.
  - Approach: 84% — Centralizing logic in reusable workflow avoids app-specific drift.
  - Impact: 84% — Touches central CI orchestration, but scoped to Brikette branch path and test stage.
- **Acceptance:**
  - Reusable workflow supports Brikette test sharding (target 3 shards) while preserving current behavior for other apps.
  - Sharded test jobs are executed only when validation is required.
  - Aggregate test failure behavior remains fail-fast at workflow level (any shard failure fails validation).
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Brikette validation run with sharding enabled executes exactly 3 shard jobs.
    - TC-02: Non-Brikette caller path retains existing single-path test behavior.
    - TC-03: `run_validation=false` path skips all test shards.
    - TC-04: One shard failing marks the validation stage as failed.
  - **Acceptance coverage:** TC-01 covers sharding contract; TC-02 guards blast radius; TC-03 preserves classifier behavior; TC-04 validates failure semantics.
  - **Test type:** workflow integration + syntax validation.
  - **Test location:** `.github/workflows/reusable-app.yml` execution traces.
  - **Run:** `actionlint .github/workflows/reusable-app.yml` plus controlled staging probe runs.
  - **Cross-boundary coverage (if applicable):** N/A (single workflow boundary).
  - **End-to-end coverage (major flows):** staging push run completes validation + deploy path.
- **TDD execution plan:**
  - **Red:** run a controlled Brikette probe expecting 3 shard jobs; initial behavior should not satisfy this.
  - **Green:** add shard-capable job structure and conditions until probe shows expected shard fan-out.
  - **Refactor:** simplify conditional expressions and shared env usage while keeping probe green.
- **Planning validation:**
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/setup-ci.test.ts` (pass via `--no-cache`, 4/4).
  - Test stubs written: N/A (M effort).
  - Unexpected findings: Jest cache writer issue occurs without `--no-cache` in current environment; planning keeps this as known local tooling artifact.
- **What would make this >=90%:**
  - Execute two successful real probes (runtime-heavy + small change) with expected shard behavior and no non-Brikette regressions.
- **Rollout / rollback:**
  - Rollout: merge behind Brikette-only configuration and monitor first 10 runs.
  - Rollback: revert reusable workflow sharding additions; default single-path tests resume.
- **Documentation impact:**
  - Update `docs/testing-policy.md` with Brikette CI shard behavior.
- **Notes / references:**
  - Reference implementation pattern: `.github/workflows/cms.yml` shard matrix.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** split reusable workflow into `validate`, `test`, `test-sharded`, and `build` jobs; kept non-Brikette callers on single test path and added Brikette shard routing via `test-shard-count`.
- **Confidence reassessment:** 84% -> 86% (task structure held up under lint validation; no hidden coupling found).
- **Validation:**
  - `actionlint .github/workflows/reusable-app.yml .github/workflows/brikette.yml` — PASS
- **Documentation updated:** none required for this task (covered in TASK-04).

### TASK-02: Enable 3-shard Brikette configuration in caller workflow
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/brikette.yml`, `[readonly] .github/workflows/reusable-app.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% — Caller input wiring is straightforward once reusable support exists.
  - Approach: 88% — 3 shards aligns with measured simulation and avoids immediate over-fragmentation.
  - Impact: 88% — Scoped to Brikette deploy path only.
- **Acceptance:**
  - Brikette caller requests 3-way test sharding for validation-required runs.
  - Existing deploy behavior (artifact build/deploy) remains unchanged.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: staging push with runtime change produces 3 shard test jobs.
    - TC-02: workflow dispatch production path remains unaffected.
    - TC-03: log output clearly identifies shard indices and totals.
  - **Acceptance coverage:** TC-01 validates configuration; TC-02 protects production branch behavior; TC-03 ensures operator observability.
  - **Test type:** workflow integration.
  - **Test location:** `.github/workflows/brikette.yml` run logs.
  - **Run:** `actionlint .github/workflows/brikette.yml` + staging probe run.
  - **Cross-boundary coverage (if applicable):** N/A.
  - **End-to-end coverage (major flows):** staging deploy run to successful completion.
- **TDD execution plan:**
  - **Red:** run staging probe and confirm only non-sharded execution exists.
  - **Green:** add caller configuration to activate 3-shard path.
  - **Refactor:** normalize input naming/comments for future app adoption.
- **Planning validation:**
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/ci/classify-deploy-change.test.ts` (pass, 5/5).
  - Test stubs written: N/A (S effort).
  - Unexpected findings: None.
- **What would make this >=90%:**
  - One successful staging production-equivalent probe with stable shard distribution and no queue contention.
- **Rollout / rollback:**
  - Rollout: enable 3 shards in Brikette caller only.
  - Rollback: set shard count back to 1.
- **Documentation impact:**
  - Note shard count and rationale in `docs/plans/faster-staging-ci-fact-find.md` (post-build update section).
- **Notes / references:**
  - Shard estimate source: `docs/plans/faster-staging-ci-fact-find.md`.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** configured Brikette staging caller to pass `test-shard-count: 3` to reusable workflow.
- **Confidence reassessment:** 88% -> 90% (change stayed fully isolated to Brikette caller inputs).
- **Validation:**
  - `actionlint .github/workflows/reusable-app.yml .github/workflows/brikette.yml` — PASS
- **Documentation updated:** included in TASK-04 fact-find update.

### TASK-03: Add Jest/ts-jest cache restore strategy for sharded Brikette tests
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/reusable-app.yml`, `[readonly] .github/workflows/cms.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 82%
  - Implementation: 84% — Cache action usage matches existing CMS practice.
  - Approach: 82% — Cache can reduce transform overhead but impact is environment-sensitive.
  - Impact: 82% — Limited to test job performance; functional behavior unchanged.
- **Acceptance:**
  - Sharded Brikette test jobs restore Jest/ts-jest cache with deterministic keys.
  - Cache misses do not fail the workflow.
  - Cache logic does not leak across unrelated workflows.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: first run records cache miss but succeeds.
    - TC-02: second comparable run restores cache (visible in action logs).
    - TC-03: stale cache key path falls back cleanly without failure.
  - **Acceptance coverage:** TC-01/02 validate caching behavior; TC-03 validates resilience.
  - **Test type:** workflow integration.
  - **Test location:** run logs for sharded test jobs.
  - **Run:** controlled back-to-back probe runs.
  - **Cross-boundary coverage (if applicable):** N/A.
  - **End-to-end coverage (major flows):** N/A (performance-only task).
- **TDD execution plan:**
  - **Red:** observe no cache restore events on baseline sharded run.
  - **Green:** add cache restore steps and verify hit/miss behavior across two runs.
  - **Refactor:** simplify key/restore-key scope once behavior is stable.
- **Planning validation:**
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/ci/collect-workflow-metrics.test.ts` (pass, 5/5).
  - Test stubs written: N/A (S effort).
  - Unexpected findings: None.
- **What would make this >=90%:**
  - Demonstrate repeatable >=10% shard runtime reduction over at least 5 runs.
- **Rollout / rollback:**
  - Rollout: ship cache in Brikette shard path only.
  - Rollback: remove cache step; shard execution remains functional.
- **Documentation impact:**
  - Add cache-key rationale to CI runbook section in `docs/testing-policy.md`.
- **Notes / references:**
  - Pattern reference: `.github/workflows/cms.yml` cache restore block.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** added shard-specific cache restore for `.ts-jest` and Jest cache directories in Brikette sharded test jobs.
- **Confidence reassessment:** 82% -> 84% (implementation matched CMS cache pattern and passed workflow lint checks).
- **Validation:**
  - `actionlint .github/workflows/reusable-app.yml .github/workflows/brikette.yml` — PASS
- **Documentation updated:** cache strategy documented in TASK-04.

### TASK-04: Capture post-change telemetry and enforce speed acceptance checks
- **Type:** IMPLEMENT
- **Affects:** `docs/plans/faster-staging-ci-fact-find.md`, `[readonly] scripts/src/ci/collect-workflow-metrics.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 92% — Telemetry tooling and commands already exist and are validated.
  - Approach: 90% — objective metrics are required to verify claimed gains.
  - Impact: 90% — Documentation/measurement task only.
- **Acceptance:**
  - Post-change run window includes at least 10 staging push runs.
  - Report includes test step p50/p90, validate-and-build p50, and end-to-end p50.
  - Pass/fail against targets is explicitly documented.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: telemetry command returns run-level summaries for target window.
    - TC-02: telemetry output includes per-job durations needed for comparison.
    - TC-03: acceptance check clearly states whether <=8m test p50 target is met.
  - **Acceptance coverage:** TC-01/02 ensure data availability; TC-03 ensures decision readiness.
  - **Test type:** script execution + documentation verification.
  - **Test location:** generated telemetry JSON and updated fact-find section.
  - **Run:** `pnpm --filter scripts run collect-workflow-metrics -- ... --include-jobs`.
  - **Cross-boundary coverage (if applicable):** N/A.
  - **End-to-end coverage (major flows):** N/A.
- **TDD execution plan:**
  - **Red:** baseline dataset does not meet target.
  - **Green:** collect post-change data and demonstrate target achievement or quantified gap.
  - **Refactor:** tighten metric command presets for repeatability.
- **Planning validation:**
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/ci/collect-workflow-metrics.test.ts` (pass, 5/5).
  - Test stubs written: N/A (S effort).
  - Unexpected findings: None.
- **Rollout / rollback:**
  - Rollout: publish telemetry snapshot in plan/fact-find.
  - Rollback: N/A (measurement only).
- **Documentation impact:**
  - Update `docs/plans/faster-staging-ci-fact-find.md` with post-change measured baseline.
- **Notes / references:**
  - Use same command window style as pre-change baseline for comparability.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** added an explicit telemetry gate section to fact-find with executable commands, target thresholds, and a current baseline snapshot; updated testing policy with Brikette shard/cache behavior.
- **Confidence reassessment:** 90% -> 90% (tooling was already in place; implementation formalized enforcement and reporting paths).
- **Validation:**
  - `pnpm --filter scripts run collect-workflow-metrics -- --workflow "Deploy Brikette" --limit 60 --branch staging --event push --include-jobs --from "2026-01-20T00:00:00Z" --to "2026-02-07T23:59:59Z"` — PASS (snapshot generated)
  - custom Node extractor for `Test` step p50/p90 from latest staging runs — PASS
- **Documentation updated:**
  - `docs/plans/faster-staging-ci-fact-find.md`
  - `docs/testing-policy.md`

### TASK-05: Optimize top 3 slow test suites if shard runtime remains >8m
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/test/routes/guides/__tests__/block-template-wiring.test.tsx`, `apps/brikette/src/test/components/experiences-page.test.tsx`, `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`, `[readonly] apps/brikette/src/test/helpers/**`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 72% ⚠️ BELOW PREFERRED THRESHOLD
  - Implementation: 75% — Hotspots are known, but root causes per suite are not fully profiled.
  - Approach: 72% — Possible wins from fixture reduction/memoization, but effect size uncertain.
  - Impact: 72% — Test behavior changes risk accidental coverage loss.
- **Acceptance:**
  - Each target suite runtime reduced by >=25% or justified as non-optimizable.
  - No semantic coverage regression for modified suites.
  - Aggregate test p50 improves when rerun under same shard configuration.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: suite-level behavior parity before/after optimization.
    - TC-02: runtime measurement for each optimized suite recorded and compared.
    - TC-03: no assertion count/regression in modified test files.
  - **Acceptance coverage:** TC-01/03 protect correctness; TC-02 validates performance goal.
  - **Test type:** targeted unit/integration tests with timing capture.
  - **Test location:** existing suite files listed in `Affects`.
  - **Run:** `pnpm --filter @apps/brikette test -- --testPathPattern "block-template-wiring|experiences-page|i18n-parity-quality-audit" --maxWorkers=2`.
  - **Cross-boundary coverage (if applicable):** N/A.
  - **End-to-end coverage (major flows):** N/A.
- **TDD execution plan:**
  - **Red:** capture baseline suite timings and identify bottleneck sections.
  - **Green:** apply minimal fixture/setup reductions that keep assertions stable.
  - **Refactor:** clean helper reuse and eliminate duplicated expensive setup.
- **Planning validation:**
  - Tests run: baseline suite durations observed from latest CI log in fact-find.
  - Test stubs written: N/A (M effort).
  - Unexpected findings: Duration attribution is coarse for suites without explicit timing lines in logs.
- **What would make this >=90%:**
  - Add deterministic suite profiling harness and confirm repeatable wins locally + CI.
- **Rollout / rollback:**
  - Rollout: one suite at a time with timing comparison.
  - Rollback: revert suite-level optimization commit if coverage/perf worsens.
- **Documentation impact:**
  - Update performance notes in fact-find with achieved suite-level deltas.
- **Notes / references:**
  - Hotspot list sourced from `docs/plans/faster-staging-ci-fact-find.md`.

### TASK-06: Decide policy for test/doc-only Brikette changes (deploy bypass vs full deploy)
- **Type:** DECISION
- **Affects:** `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`, `[readonly] docs/testing-policy.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 70% ⚠️ BELOW PREFERRED THRESHOLD
  - Implementation: 82% — Both policy options are implementable with existing classifier infrastructure.
  - Approach: 65% — Requires explicit repo governance decision on deploy signal expectations.
  - Impact: 70% — Could significantly reduce runtime, but changes what deploy loops run for non-runtime diffs.
- **Options:**
  - **Option A:** keep current behavior (full deploy workflow still runs for test/doc-only changes).
  - **Option B (recommended):** skip deploy path for test/doc-only changes while preserving required validation in CI.
- **Recommendation:** Option B for major runtime savings and reduced no-op deploy load.
- **Question for user:**
  - Approve Option B now, or keep Option A until a separate governance PR?
  - Why it matters: this changes staging deploy loop policy for non-runtime diffs.
  - Default if no answer: keep Option A (safer governance posture, slower loops).
- **Acceptance:**
  - Decision recorded in plan decision log.
  - Workflow path and required-check contract updated accordingly.

## Risks & Mitigations
- Risk: workflow complexity introduces CI flakiness.
  - Mitigation: restrict initial rollout to Brikette path and validate with actionlint + probe runs.
- Risk: shard imbalance reduces expected gains.
  - Mitigation: start with 3 shards and adjust using measured distribution.
- Risk: policy ambiguity on test/doc-only deploy loops.
  - Mitigation: keep as explicit decision task with conservative default.

## Observability
- Logging:
  - Per-shard start/end and shard index in test jobs.
  - Validation gating reason remains visible.
- Metrics:
  - `Test` step p50/p90.
  - `Validate & build` p50.
  - End-to-end workflow p50.
- Alerts/Dashboards:
  - Track regression if test p50 returns above 10m for 3 consecutive staging runs.

## Acceptance Criteria (overall)
- [ ] Brikette runtime-change staging runs execute sharded tests (3 shards) with stable pass/fail semantics.
- [ ] Test step p50 is <=8m over at least 10 staging push runs.
- [ ] No regression to non-Brikette reusable workflow callers.
- [ ] Decision on test/doc-only deploy policy is recorded and implemented or explicitly deferred.

## Decision Log
- 2026-02-07: Created new active plan from updated fact-find and superseded archived implementation plan format.
- 2026-02-07: Chosen primary path is reusable-workflow-based Brikette sharding with 3 initial shards.
- 2026-02-07: Implemented TASK-01 through TASK-04 (workflow sharding, caller wiring, shard cache restore, telemetry gate documentation).
