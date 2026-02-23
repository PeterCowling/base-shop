---
Type: Plan
Status: Draft
Domain: Repo
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: unit-test-sufficiency-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: plan
---

# Unit Test Sufficiency Audit Plan

## Summary
This plan converts the fact-find gaps into an execution sequence that first restores test-runner integrity, then expands test breadth in the lowest-signal codebases, and finally tightens coverage governance. The highest-severity issue is structural: multiple package `test` scripts reference missing Jest configs, which undermines package-level test reliability. After wiring is corrected and guarded, implementation work targets low-breadth areas (`apps/product-pipeline`, `apps/xa-b`, `packages/types`) using bounded, targeted unit/integration additions. A final governance phase graduates coverage policy from permissive defaults toward enforceable thresholds for runtime packages with improved test baselines. This is a `plan-only` handoff and does not auto-continue to build.

## Active tasks
- [x] TASK-01: Decide canonical Jest config strategy for package `test` scripts
- [x] TASK-02: Add a static guard for invalid `test --config` references
- [x] TASK-03: Repair broken package test wiring (`xa-b`, `telemetry`, `theme`, `xa-drop-worker`)
- [x] TASK-04: Horizon checkpoint before breadth expansion
- [x] TASK-11: Harden governed test-script CWD semantics repo-wide
- [x] TASK-05: Expand `apps/product-pipeline` unit/integration baseline
- [x] TASK-06: Expand `apps/xa-b` unit/integration baseline
- [ ] TASK-07: Expand `packages/types` schema composition baseline
- [ ] TASK-08: Investigate coverage-tier graduation matrix
- [ ] TASK-09: Decision gate for tier changes and rollout scope
- [ ] TASK-10: Apply coverage-tier and policy updates

## Goals
- Restore correctness of package-level test command wiring.
- Add deterministic guardrails so future broken `--config` references fail fast.
- Improve unit-test breadth in the most under-tested runtime scopes identified by fact-find.
- Convert improved breadth into explicit coverage policy progress.

## Non-goals
- Broad, unfiltered test execution.
- Rewriting unrelated test frameworks or replacing Jest.
- Full monorepo coverage normalization in one cycle.

## Constraints & Assumptions
- Constraints:
  - Targeted test policy remains in force (`docs/testing-policy.md`).
  - Validation commands must stay scoped and resource-safe (`scripts/validate-changes.sh`).
  - Existing package script contracts should remain backward-compatible where possible.
- Assumptions:
  - Co-located test mapping remains a directional sufficiency signal, not an absolute metric.
  - Runtime packages currently on `MINIMAL` coverage can be graduated incrementally without destabilizing CI.

## Fact-Find Reference
- Related brief: `docs/plans/unit-test-sufficiency-audit/fact-find.md`
- Key findings used:
  - Broken `test --config` references in multiple packages.
  - `apps/product-pipeline` has extremely narrow test surface and narrow coverage collection scope.
  - `apps/xa-b` and `packages/types` have low breadth signals.
  - Coverage policy currently permits 0% thresholds for several runtime packages.

## Proposed Approach
- Option A:
  - Immediately add many tests first, defer runner-integrity fixes.
  - Pros: faster raw test count increase.
  - Cons: weak execution reliability; broken package scripts remain.
- Option B:
  - Fix integrity first, then add breadth, then tighten policy.
  - Pros: stable foundation and safer policy ratcheting.
  - Cons: slower visible growth in test counts during early tasks.
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (`plan-only` mode)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Canonical Jest config strategy for package scripts | 85% | S | Complete (2026-02-23) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Guard for missing `test --config` targets | 85% | M | Complete (2026-02-23) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Repair broken package test wiring | 85% | M | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Reassess before low-breadth expansion | 95% | S | Complete (2026-02-23) | TASK-03 | TASK-11 |
| TASK-11 | IMPLEMENT | Harden governed runner CWD/config semantics | 85% | M | Complete (2026-02-23) | TASK-04 | TASK-05, TASK-06, TASK-07 |
| TASK-05 | IMPLEMENT | Expand `apps/product-pipeline` test baseline | 85% | L | Complete (2026-02-23) | TASK-04, TASK-11 | TASK-08 |
| TASK-06 | IMPLEMENT | Expand `apps/xa-b` test baseline | 85% | L | Complete (2026-02-23) | TASK-04, TASK-11 | TASK-08 |
| TASK-07 | IMPLEMENT | Expand `packages/types` test baseline | 85% | M | Pending | TASK-04, TASK-11 | TASK-08 |
| TASK-08 | INVESTIGATE | Coverage-tier graduation matrix + risk envelope | 85% | M | Pending | TASK-05, TASK-06, TASK-07 | TASK-09 |
| TASK-09 | DECISION | Approve coverage-tier promotion scope | 85% | S | Pending | TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Apply tier/policy updates and validation wiring | 85% | M | Pending | TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock strategy before scripting and package edits |
| 2 | TASK-02 | TASK-01 | Add guardrail first so fixes are continuously protected |
| 3 | TASK-03 | TASK-01, TASK-02 | Repair currently broken script wiring |
| 4 | TASK-04 | TASK-03 | Checkpoint before breadth expansion |
| 5 | TASK-11 | TASK-04 | Close governed CWD/config semantic gaps before breadth work |
| 6 | TASK-05, TASK-06, TASK-07 | TASK-04, TASK-11 | Parallel breadth expansion by scope |
| 7 | TASK-08 | TASK-05, TASK-06, TASK-07 | Build evidence-driven graduation matrix |
| 8 | TASK-09 | TASK-08 | Explicit approval gate for tier ratchet |
| 9 | TASK-10 | TASK-09 | Final policy and contract updates |

## Tasks

### TASK-01: Decide canonical Jest config strategy for package `test` scripts
- **Type:** DECISION
- **Deliverable:** decision artifact at `docs/plans/unit-test-sufficiency-audit/artifacts/test-config-strategy.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Build evidence:** User approved Option C (`hybrid`) and decision record was written at `docs/plans/unit-test-sufficiency-audit/artifacts/test-config-strategy.md` with explicit mapping for TASK-03.
- **Affects:** `docs/plans/unit-test-sufficiency-audit/plan.md`, `docs/plans/unit-test-sufficiency-audit/artifacts/test-config-strategy.md`, `[readonly] apps/*/package.json`, `[readonly] packages/*/package.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% - decision artifact scope is bounded and evidence already exists.
  - Approach: 85% - options are clear and repo-local.
  - Impact: 85% - removes ambiguity that would fragment fixes.
- **Options:**
  - Option A: require package-local `jest.config.cjs` for all package `test` scripts.
  - Option B: standardize on root `jest.config.cjs` references in package scripts.
  - Option C: hybrid policy (local configs only where alias/roots differ; root config for simple packages).
- **Recommendation:**
  - Option C.
- **Decision input needed:** `None: resolved 2026-02-23 by owner; Option C approved.`
- **Acceptance:**
  - Decision artifact records selected option, rationale, and file-pattern rule.
  - TASK-03 implementation notes are aligned to chosen strategy.
- **Validation contract:**
  - Artifact references each currently broken package path and maps it to the chosen strategy.
- **Planning validation:**
  - Checks run: package script inventory for `--config` usage.
  - Validation artifacts: `docs/plans/unit-test-sufficiency-audit/fact-find.md`.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add strategy section to this plan’s Decision Log.

### TASK-02: Add a static guard for invalid `test --config` references
- **Type:** IMPLEMENT
- **Deliverable:** code-change introducing config-path validation in the standard validation flow.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added guard script `scripts/src/ci/check-jest-config-paths.mjs`, wired it into `scripts/validate-changes.sh`, and added targeted tests at `scripts/__tests__/jest-config-path-policy.test.ts`. Validation: `pnpm run test:governed -- jest -- --runTestsByPath scripts/__tests__/jest-config-path-policy.test.ts` passed (3/3).
- **Affects:** `scripts/validate-changes.sh`, `scripts/src/ci/` (new guard script), `scripts/__tests__/` (new targeted tests)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - guard logic is straightforward file/path validation.
  - Approach: 85% - fail-fast gate prevents recurrence.
  - Impact: 85% - converts silent drift into deterministic validation failures.
- **Acceptance:**
  - Validation fails when any package `test` script references missing `--config` target.
  - Validation passes when targets exist.
  - Output identifies package name and missing path deterministically.
- **Validation contract (TC-02):**
  - TC-01: fixture with missing config path -> non-zero exit and package/path in output.
  - TC-02: fixture with valid config path -> zero exit.
  - TC-03: package test scripts without `--config` are ignored unless policy says otherwise.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add guard tests that fail with current validation behavior.
  - **Green:** implement script and wire into `scripts/validate-changes.sh` policy checks.
  - **Refactor:** centralize parser for package script extraction.
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing policy gate sequence in `scripts/validate-changes.sh`.
  - Validation artifacts: `scripts/validate-changes.sh`, `apps/xa-b/package.json`, `packages/telemetry/package.json`, `packages/theme/package.json`, `apps/xa-drop-worker/package.json`.
  - Unexpected findings: none.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - New guard output lines (`package`, `configPath`, `exists`) consumed by humans and CI logs.
  - Modified behavior check:
    - `scripts/validate-changes.sh` consumers (local pre-commit and CI jobs invoking it) will now hard-fail on invalid config paths.
    - No downstream script contract changes beyond additive failure mode.
- **Scouts:**
  - Probe whether guard should also validate `--runTestsByPath` path existence in a follow-up task.
- **Edge Cases & Hardening:**
  - Support nested package roots (for example `packages/themes/prime`).
  - Ensure deterministic output ordering for CI diffs.
- **What would make this >=90%:**
  - Add snapshot test for full guard output across mixed valid/invalid cases.
- **Rollout / rollback:**
  - Rollout: enable in validation gate with targeted script tests.
  - Rollback: remove guard hook from validation script.
- **Documentation impact:**
  - Update `docs/testing-policy.md` with new guard behavior.
- **Notes / references:**
  - `docs/plans/unit-test-sufficiency-audit/fact-find.md`

### TASK-03: Repair broken package test wiring (`xa-b`, `telemetry`, `theme`, `xa-drop-worker`)
- **Type:** IMPLEMENT
- **Deliverable:** code-change making package `test` scripts resolve valid Jest config targets.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added missing package-local Jest configs at `apps/xa-b/jest.config.cjs`, `packages/telemetry/jest.config.cjs`, `packages/theme/jest.config.cjs`, and `apps/xa-drop-worker/jest.config.cjs`; rewired package `test` scripts to call `../../scripts/tests/run-governed-test.sh` from package CWD so `./jest.config.cjs` resolves as intended under governed runs. Validation: `node scripts/src/ci/check-jest-config-paths.mjs --repo-root . --source fs --paths apps/xa-b/package.json packages/telemetry/package.json packages/theme/package.json apps/xa-drop-worker/package.json` passed; `CI=true pnpm --filter @apps/xa-b test -- --showConfig`, `CI=true pnpm --filter @acme/telemetry test -- --showConfig`, `CI=true pnpm --filter @acme/theme test -- --showConfig`, and `CI=true pnpm --filter @apps/xa-drop-worker test -- --showConfig` all passed with package-local `rootDir` resolution; package-scoped smoke tests passed for all four targets (`demoData.test.ts`, `index.test.ts`, `mergeExternalTokens.test.ts`, `xaDropWorker.test.ts`).
- **Affects:** `apps/xa-b/package.json`, `packages/telemetry/package.json`, `packages/theme/package.json`, `apps/xa-drop-worker/package.json`, and strategy-dependent `jest.config.cjs` files
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - affected files are explicit and limited.
  - Approach: 85% - guided by TASK-01 policy and enforced by TASK-02 guard.
  - Impact: 90% - restores package-level test command integrity immediately.
- **Acceptance:**
  - All four package `test` scripts point to existing Jest configs.
  - No package-level alias/path resolution regressions introduced by config changes.
  - Validation guard from TASK-02 passes for these packages.
- **Validation contract (TC-03):**
  - TC-01: static guard reports no missing config paths for the four packages.
  - TC-02: each package test command resolves config successfully under governed runner.
  - TC-03: package-local alias-dependent tests (if any) still resolve module paths.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** confirm each broken package fails guard with current state.
  - **Green:** apply strategy-selected fix pattern across four packages.
  - **Refactor:** normalize script wording for consistency.
- **Planning validation (required for M/L):**
  - Checks run: verified current missing-path state and affected script lines.
  - Validation artifacts: same four `package.json` files plus `docs/plans/unit-test-sufficiency-audit/fact-find.md`.
  - Unexpected findings: `pnpm -w run test:governed` executes from repo root, so package-local `./jest.config.cjs` does not resolve unless runner invocation preserves package CWD.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - Potential new package-local `jest.config.cjs` files consumed by package `test` scripts.
  - Modified behavior check:
    - Package `test` scripts now run the governed runner from package CWD and target valid local configs; callers include local operators, CI package tests, and validation workflows.
    - Ensure no caller depends on previous invalid path behavior (none expected).
- **Scouts:**
  - Confirm whether `@apps/xa-b` requires a local mapper versus root config fallback.
- **Edge Cases & Hardening:**
  - Avoid divergence between local configs and root preset defaults.
  - Keep governed execution policy while ensuring package-local cwd for config resolution.
- **What would make this >=90%:**
  - Add a generated inventory check that compares script-config targets against actual files repo-wide.
- **Rollout / rollback:**
  - Rollout: atomic update of scripts and config files.
  - Rollback: revert package script/config edits together.
- **Documentation impact:**
  - Note fixed package list in Decision Log.
- **Notes / references:**
  - `apps/xa-b/package.json`, `packages/telemetry/package.json`, `packages/theme/package.json`, `apps/xa-drop-worker/package.json`

### TASK-04: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if needed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Build evidence:** Checkpoint reassessment validated that low-breadth targets remain materially under-covered (`apps/product-pipeline src=253 tests=1`, `apps/xa-b src=129 tests=4`, `packages/types src=284 tests=8`) and therefore TASK-05/06/07 scopes are still required. Replan also identified a residual foundation gap: `apps/xa-uploader/package.json` and `apps/caryina/package.json` still use `pnpm -w run test:governed` with relative `--config ./jest.config.cjs`, which resolves from repo root under governed runs. Plan topology updated with precursor hardening task TASK-11 before breadth expansion.
- **Affects:** `docs/plans/unit-test-sufficiency-audit/plan.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-11
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is deterministic.
  - Approach: 95% - prevents expansion on stale assumptions.
  - Impact: 95% - reduces compounding execution risk.
- **Acceptance:**
  - Re-evaluate low-breadth targets after runner-integrity fixes land.
  - Confirm task scopes for TASK-05/06/07 remain valid.
  - Re-sequence if upstream scope drift appears.
- **Horizon assumptions to validate:**
  - Runner-integrity fixes are stable enough to support breadth-expansion validation.
  - No remaining governed-runner CWD/config semantic hazards remain in active package scripts.
- **Validation contract:** checkpoint notes captured in plan update.
- **Planning validation:** replan evidence logged if topology changes.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan task statuses and dependencies refreshed.

### TASK-11: Harden governed runner CWD/config semantics
- **Type:** IMPLEMENT
- **Deliverable:** code/doc changes that detect and remove unsafe `pnpm -w` + relative `--config` usage for governed Jest scripts.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Updated `scripts/src/ci/check-jest-config-paths.mjs` to detect unsafe workspace-root governed invocations that use relative `--config` paths and to correctly resolve repo-relative config paths for workspace-governed scripts. Normalized remaining unsafe package scripts in `apps/xa-uploader/package.json` and `apps/caryina/package.json` to package-CWD governed runner invocation. Expanded policy tests in `scripts/__tests__/jest-config-path-policy.test.ts` (TC-01..TC-05). Updated operator policy doc in `docs/testing-policy.md`. Validation: `CI=true pnpm run test:governed -- jest -- --runTestsByPath scripts/__tests__/jest-config-path-policy.test.ts` passed (5/5); `node scripts/src/ci/check-jest-config-paths.mjs --repo-root . --source fs --paths apps/xa-uploader/package.json apps/caryina/package.json apps/prime/package.json packages/tailwind-config/package.json` passed; `CI=true pnpm --filter @apps/xa-uploader test -- --showConfig` and `CI=true pnpm --filter @apps/caryina test -- --showConfig` passed with package-local `rootDir`.
- **Affects:** `apps/xa-uploader/package.json`, `apps/caryina/package.json`, `scripts/src/ci/check-jest-config-paths.mjs`, `scripts/__tests__/jest-config-path-policy.test.ts`, `docs/testing-policy.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-05, TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 85% - pattern scope is explicit and bounded to governed script plumbing.
  - Approach: 85% - static policy check plus script normalization prevents recurrence.
  - Impact: 85% - removes a class of silent misconfiguration not covered by existence-only checks.
- **Acceptance:**
  - No package `test` script uses `pnpm -w run test:governed` with relative `--config ./...`.
  - `apps/xa-uploader` and `apps/caryina` package tests resolve package-local config/root correctly.
  - Guard policy fails on future occurrences of this unsafe pattern.
- **Validation contract (TC-11):**
  - TC-01: static policy check flags relative `--config` when combined with `pnpm -w run test:governed`.
  - TC-02: updated package scripts pass guard and `--showConfig` confirms package-local `rootDir`.
  - TC-03: existing valid workspace-root config references (`apps/prime`, `packages/tailwind-config`) remain allowed.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add/adjust guard tests to fail on governed-root + relative-config pattern.
  - **Green:** normalize impacted scripts and update policy check.
  - **Refactor:** centralize guard parsing logic for script invocation + config path semantics.
- **Planning validation (required for M/L):**
  - Checks run: script inventory for governed invocations with `--config`.
  - Validation artifacts: `apps/xa-uploader/package.json`, `apps/caryina/package.json`, `apps/prime/package.json`, `packages/tailwind-config/package.json`.
  - Unexpected findings: none.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - Guard output expands with semantic violation details (workspace-root invocation + relative config path).
  - Modified behavior check:
    - Validation callers (`scripts/validate-changes.sh`, CI hooks) now fail this additional unsafe pattern.
- **Scouts:**
  - Inventory whether any non-Jest intents need similar CWD policy treatment in a later pass.
- **Edge Cases & Hardening:**
  - Preserve valid absolute/repo-relative config paths.
  - Preserve package-local direct runner invocation pattern.
- **What would make this >=90%:**
  - Add repo-wide snapshot test for all current governed `test` scripts and expected policy classification.
- **Rollout / rollback:**
  - Rollout: policy + script fixes in one atomic change.
  - Rollback: revert policy check and package script rewires together.
- **Documentation impact:**
  - Update testing policy docs with governed CWD/config rule.

### TASK-05: Expand `apps/product-pipeline` unit/integration baseline
- **Type:** IMPLEMENT
- **Deliverable:** code-change adding focused tests and broadening package coverage collection scope.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added focused app-domain helper tests in `src/lib/pipeline/__tests__/fingerprint.test.ts` and `src/lib/pipeline/__tests__/cooldown.test.ts`, plus route-handler tests in `src/routes/api/launches/__tests__/decision.test.ts`. Kept existing `triage` tests and expanded package coverage scope in `apps/product-pipeline/jest.config.cjs` from a single file to `src/lib/**`, `src/routes/**`, and `src/app/api/**` (with standard test/d.ts excludes). Validation: `CI=true pnpm run test:governed -- jest -- --config apps/product-pipeline/jest.config.cjs --rootDir apps/product-pipeline --runInBand --runTestsByPath apps/product-pipeline/src/lib/pipeline/__tests__/triage.test.ts apps/product-pipeline/src/lib/pipeline/__tests__/fingerprint.test.ts apps/product-pipeline/src/lib/pipeline/__tests__/cooldown.test.ts apps/product-pipeline/src/routes/api/launches/__tests__/decision.test.ts` passed (4 suites, 14 tests). Snapshot metric after task: `apps/product-pipeline src=249 tests=4`.
- **Affects:** `apps/product-pipeline/src/lib/**`, `apps/product-pipeline/src/routes/**`, `apps/product-pipeline/src/app/**`, `apps/product-pipeline/jest.config.cjs`
- **Depends on:** TASK-04, TASK-11
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - low existing baseline leaves clear candidate seams.
  - Approach: 85% - route/lib-first targeted tests align with repo policy.
  - Impact: 90% - materially improves weakest runtime test surface.
- **Acceptance:**
  - Add targeted tests beyond `triage.test.ts` covering at least one route handler class and one app-domain helper class.
  - Remove single-file-only coverage collection scope from `apps/product-pipeline/jest.config.cjs`.
  - Preserve governed targeted-test execution compatibility.
- **Validation contract (TC-05):**
  - TC-01: new route/domain tests fail pre-change and pass post-change.
  - TC-02: package coverage scope includes multiple source areas instead of one file.
  - TC-03: targeted run command remains bounded (`--runTestsByPath` / `--testPathPattern`).
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add failing tests for identified untested route/helper behaviors.
  - **Green:** implement required seams and/or test harness wrappers.
  - **Refactor:** reduce duplicated fixtures and shared mocks.
- **Planning validation (required for M/L):**
  - Checks run: reviewed `apps/product-pipeline/jest.config.cjs` and existing test inventory.
  - Validation artifacts: `apps/product-pipeline/jest.config.cjs`, `apps/product-pipeline/src/lib/pipeline/__tests__/triage.test.ts`, `docs/plans/unit-test-sufficiency-audit/fact-find.md`.
  - Unexpected findings: none.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - New test files and potentially helper exports used only by test runtime.
  - Modified behavior check:
    - `collectCoverageFrom` behavior in package Jest config affects coverage reports consumed by CI/test reporting.
    - Ensure no existing consumer depends on single-file-only scope.
- **Scouts:**
  - Evaluate whether any route logic should be extracted into pure helpers before testing.
- **Edge Cases & Hardening:**
  - Ensure tests cover both happy-path and input-validation failure branches.
  - Keep `--maxWorkers` and targeted scope constraints aligned with policy.
- **What would make this >=90%:**
  - Add a maintained route test matrix artifact tying handlers to test cases.
- **Rollout / rollback:**
  - Rollout: merge with config and test additions together.
  - Rollback: revert package config + new tests atomically.
- **Documentation impact:**
  - Update this plan with post-task breadth metrics snapshot.
- **Notes / references:**
  - `docs/plans/unit-test-sufficiency-audit/fact-find.md`

### TASK-06: Expand `apps/xa-b` unit/integration baseline
- **Type:** IMPLEMENT
- **Deliverable:** code-change adding coverage for currently untested lib and route logic.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added targeted lib tests for `xaFilters`, `xaListingUtils`, and `xaCatalog` in `apps/xa-b/src/lib/__tests__/xaFilters.test.ts`, `apps/xa-b/src/lib/__tests__/xaListingUtils.test.ts`, and `apps/xa-b/src/lib/__tests__/xaCatalog.test.ts`. Added app-route behavior coverage for search sync caching in `apps/xa-b/src/app/api/search/sync/__tests__/route.test.ts` (200 payload + 304 ETag path). Validation: `CI=true pnpm --filter @apps/xa-b test -- --runTestsByPath src/lib/__tests__/xaFilters.test.ts src/lib/__tests__/xaListingUtils.test.ts src/lib/__tests__/xaCatalog.test.ts src/app/api/search/sync/__tests__/route.test.ts --runInBand` passed (4 suites, 14 tests). Snapshot metric after task: `apps/xa-b src=127 tests=8`.
- **Affects:** `apps/xa-b/src/lib/**`, `apps/xa-b/src/app/**`, `apps/xa-b/src/components/**`, plus strategy-aligned Jest config if needed
- **Depends on:** TASK-04, TASK-11
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - low baseline creates clear high-value targets.
  - Approach: 85% - prioritize pure lib logic and route-level behavior.
  - Impact: 90% - reduces regression risk in user-facing storefront behavior.
- **Acceptance:**
  - Add targeted tests for `xaFilters` and at least two additional high-usage lib modules.
  - Add at least one app-route behavior test aligned to business-critical path (for example search/filter/cart state).
  - Ensure package test wiring remains valid after TASK-03.
- **Validation contract (TC-06):**
  - TC-01: newly added lib tests assert deterministic filtering/search behavior.
  - TC-02: route-level test asserts expected response/render branch for representative input.
  - TC-03: package tests run with valid config reference and no unresolved mapper errors.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add failing tests for identified untested modules.
  - **Green:** implement minimal seams/mocks to support deterministic tests.
  - **Refactor:** consolidate duplicated fixtures in `src/lib/__tests__`.
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing `apps/xa-b` test inventory and key untested files.
  - Validation artifacts: `apps/xa-b/src/lib/__tests__/`, `apps/xa-b/src/lib/xaFilters.ts`, `docs/plans/unit-test-sufficiency-audit/fact-find.md`.
  - Unexpected findings: current package `test` script points to missing `jest.config.cjs` (handled upstream by TASK-03).
- **Consumer tracing (M/L required):**
  - New outputs check:
    - New tests consume existing lib exports; no new runtime outputs required.
  - Modified behavior check:
    - If testability refactors alter lib signatures, all route/component callers must be updated in the same task.
- **Scouts:**
  - Probe whether search/indexing logic should get dedicated fixture builders.
- **Edge Cases & Hardening:**
  - Include empty-filter, malformed-input, and locale/currency edge scenarios where applicable.
- **What would make this >=90%:**
  - Add contract-style tests around core storefront data adapters.
- **Rollout / rollback:**
  - Rollout: staged lib-first then route tests in one PR series.
  - Rollback: revert test additions and any helper signature changes together.
- **Documentation impact:**
  - Record newly-covered module matrix in artifacts.
- **Notes / references:**
  - `docs/plans/unit-test-sufficiency-audit/fact-find.md`

### TASK-07: Expand `packages/types` schema composition baseline
- **Type:** IMPLEMENT
- **Deliverable:** code-change adding targeted schema/contract tests in `packages/types`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/types/src/page/**`, `packages/types/__tests__/**`, `packages/types/src/__tests__/**`
- **Depends on:** TASK-04, TASK-11
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - schema modules are deterministic and testable.
  - Approach: 85% - expand around composition and cross-schema contracts.
  - Impact: 85% - strengthens type/schema regression detection for dependent apps.
- **Acceptance:**
  - Add tests for at least three currently untested composition paths in `src/page/**`.
  - Verify key export/contract invariants used by downstream consumers.
  - Keep package test runtime bounded to targeted files.
- **Validation contract (TC-07):**
  - TC-01: composition tests fail with invalid schema shapes and pass on valid shapes.
  - TC-02: contract tests assert expected exported schema relationships.
  - TC-03: no `.d.ts`-only paths are used as coverage proxies.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add failing contract tests for representative composition paths.
  - **Green:** adjust schema composition and fixtures where needed.
  - **Refactor:** reduce duplicated setup between page schema tests.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current `packages/types` tests and untested directory map.
  - Validation artifacts: `packages/types/__tests__/`, `packages/types/src/page/organisms/`, `docs/plans/unit-test-sufficiency-audit/fact-find.md`.
  - Unexpected findings: none.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - New tests validate existing schema exports; no new runtime fields expected.
  - Modified behavior check:
    - If schema signatures change, downstream consumers in apps/packages using these exports must be mapped and updated.
- **Scouts:**
  - Identify top downstream importers before modifying schema interfaces.
- **Edge Cases & Hardening:**
  - Include optional/nullable and nested array/object schema edge conditions.
- **What would make this >=90%:**
  - Add importer-driven contract fixtures from at least two downstream packages.
- **Rollout / rollback:**
  - Rollout: merge targeted tests with minimal schema adjustments.
  - Rollback: revert schema/test pair updates together.
- **Documentation impact:**
  - Update schema test inventory note in this plan artifact set.
- **Notes / references:**
  - `docs/plans/unit-test-sufficiency-audit/fact-find.md`

### TASK-08: Investigate coverage-tier graduation matrix
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact at `docs/plans/unit-test-sufficiency-audit/artifacts/coverage-tier-graduation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/unit-test-sufficiency-audit/artifacts/coverage-tier-graduation.md`, `[readonly] packages/config/coverage-tiers.cjs`, `[readonly] package test coverage outputs`
- **Depends on:** TASK-05, TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - evidence is derived from completed breadth tasks.
  - Approach: 85% - matrix approach gives bounded policy choices.
  - Impact: 85% - enables safe ratchet instead of arbitrary threshold jumps.
- **Questions to answer:**
  - Which runtime scopes now have sufficient baseline to move from `MINIMAL` toward enforced thresholds?
  - What threshold increments are realistic without destabilizing CI?
  - Which packages should stay `MINIMAL` for justified reasons in this cycle?
- **Acceptance:**
  - Artifact includes per-scope current signal, proposed tier, and rationale.
  - Includes explicit rollout risk and fallback plan per scope.
- **Validation contract:**
  - Matrix entries are traceable to completed task evidence and package-level test outputs.
- **Planning validation:**
  - Checks run: review updated test artifacts from TASK-05/06/07.
  - Validation artifacts: completed task outputs and `packages/config/coverage-tiers.cjs`.
  - Unexpected findings: none.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** feeds TASK-09 decision memo.

### TASK-09: Decision gate for tier changes and rollout scope
- **Type:** DECISION
- **Deliverable:** decision record at `docs/plans/unit-test-sufficiency-audit/artifacts/coverage-tier-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/unit-test-sufficiency-audit/artifacts/coverage-tier-decision.md`, `docs/plans/unit-test-sufficiency-audit/plan.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 90% - bounded decision output.
  - Approach: 85% - clear options and trade-offs from matrix.
  - Impact: 85% - avoids policy churn without owner approval.
- **Options:**
  - Option A: keep all current `MINIMAL` assignments (no ratchet this cycle).
  - Option B: partial promotion for newly strengthened runtime scopes.
  - Option C: broad promotion to `STANDARD` for all runtime apps.
- **Recommendation:**
  - Option B (partial promotion).
- **Decision input needed:**
  - question: approve partial promotion set from TASK-08 matrix?
  - why it matters: controls CI strictness and merge friction.
  - default + risk: default to B; risk is slower policy progress than full ratchet.
- **Acceptance:**
  - Decision artifact names promoted scopes and deferred scopes explicitly.
  - Rollout order and rollback trigger conditions are documented.
- **Validation contract:**
  - Decision record references TASK-08 matrix and maps each scope to a final outcome.
- **Planning validation:**
  - Checks run: matrix review and impact summary.
  - Validation artifacts: `docs/plans/unit-test-sufficiency-audit/artifacts/coverage-tier-graduation.md`.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** unlocks TASK-10 implementation boundaries.

### TASK-10: Apply coverage-tier and policy updates
- **Type:** IMPLEMENT
- **Deliverable:** code/doc changes implementing approved tier promotions and validation policy notes.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/config/coverage-tiers.cjs`, package-level `jest.config.cjs` files (as needed), `docs/testing-policy.md`, `docs/plans/unit-test-sufficiency-audit/plan.md`
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - bounded edits based on approved matrix.
  - Approach: 85% - explicit decision-gated rollout reduces risk.
  - Impact: 85% - introduces enforceable progress without full-repo shock.
- **Acceptance:**
  - Approved scopes are promoted from `MINIMAL` to stricter tiers per decision artifact.
  - Documentation reflects new tier expectations and operator workflow.
  - Validation contract for changed scopes is updated and reproducible.
- **Validation contract (TC-10):**
  - TC-01: `coverage-tiers.cjs` reflects approved scope mapping exactly.
  - TC-02: impacted package Jest configs resolve tier policy correctly.
  - TC-03: policy docs describe updated requirements and no contradiction remains.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** assert current tier map does not match approved decision.
  - **Green:** apply mapping and doc updates.
  - **Refactor:** normalize tier comments and grouping.
- **Planning validation (required for M/L):**
  - Checks run: reviewed tier assignment logic and package-name mapping behavior.
  - Validation artifacts: `packages/config/coverage-tiers.cjs`, `packages/config/jest.preset.cjs`, TASK-09 decision artifact.
  - Unexpected findings: none.
- **Consumer tracing (M/L required):**
  - New outputs check:
    - Updated tier mapping values consumed by Jest preset `getTier()` resolution.
  - Modified behavior check:
    - Coverage threshold changes affect package test jobs and CI pass/fail outcomes.
    - Consumers include local package test runs, CI coverage jobs, and release validation gates.
- **Scouts:**
  - Verify whether any promoted package needs temporary partial-coverage exceptions.
- **Edge Cases & Hardening:**
  - Keep non-runtime utility packages unchanged unless explicitly approved.
  - Ensure renamed package identifiers do not orphan tier assignments.
- **What would make this >=90%:**
  - Add a guard that detects unknown package names in tier map versus workspace manifests.
- **Rollout / rollback:**
  - Rollout: apply partial promotions first; observe CI behavior.
  - Rollback: revert tier map and doc changes in one commit if merge friction is excessive.
- **Documentation impact:**
  - Update coverage policy references and this plan’s completion notes.
- **Notes / references:**
  - `packages/config/coverage-tiers.cjs`
  - `packages/config/jest.preset.cjs`

## Risks & Mitigations
- Coverage ratchet causes unexpected CI friction in promoted packages.
  - Mitigation: partial promotion only (TASK-09), explicit rollback path in TASK-10.
- Breadth expansion introduces brittle tests around unstable interfaces.
  - Mitigation: checkpoint before expansion and test-matrix artifacts per scope.
- Guard script creates false positives for non-standard scripts.
  - Mitigation: policy decision in TASK-01 and fixture-driven guard tests in TASK-02.

## Observability
- Logging:
  - Validation guard output includes package and config path for failures.
- Metrics:
  - Per-scope test-file count and tests-per-100-source snapshot before/after TASK-05/06/07.
- Alerts/Dashboards:
  - None: repository-level CI status is sufficient for this iteration.

## Acceptance Criteria (overall)
- [x] No package `test` script in scope references a missing Jest config target.
- [x] No governed Jest script relies on workspace-root invocation with relative config paths.
- [ ] `apps/product-pipeline`, `apps/xa-b`, and `packages/types` each gain meaningful targeted test breadth.
- [ ] Coverage-tier decision is evidence-backed and implemented for approved scopes.
- [ ] Updated policy/docs are consistent with implemented test and coverage behavior.

## Decision Log
- 2026-02-23: Plan created from `docs/plans/unit-test-sufficiency-audit/fact-find.md` in `plan-only` mode.
- 2026-02-23: `/lp-do-build` eligibility gate blocked at TASK-01 (`DECISION`) pending owner input on config strategy option.
- 2026-02-23: TASK-01 resolved by owner decision: Option C (`hybrid`) approved; artifact saved at `docs/plans/unit-test-sufficiency-audit/artifacts/test-config-strategy.md`.
- 2026-02-23: TASK-02 completed; new Jest config path policy guard and tests added to validation flow.
- 2026-02-23: TASK-03 investigation found runtime semantics mismatch: package scripts using `pnpm -w run test:governed` execute from repo root, causing `--config ./jest.config.cjs` to resolve against root CWD.
- 2026-02-23: TASK-03 completed by adding missing local Jest config files and rewiring four package `test` scripts to invoke `scripts/tests/run-governed-test.sh` directly from package CWD; guard and `--showConfig` probes passed for all four scopes.
- 2026-02-23: TASK-03 targeted smoke tests passed in all four scopes (`@apps/xa-b`, `@acme/telemetry`, `@acme/theme`, `@apps/xa-drop-worker`) under governed CI compatibility mode.
- 2026-02-23: TASK-04 checkpoint completed; downstream breadth targets remain valid, and topology was updated with TASK-11 to harden remaining governed CWD/config semantics before breadth expansion.
- 2026-02-23: TASK-11 completed; guard now enforces governed workspace CWD/config semantics, `xa-uploader` and `caryina` scripts were normalized, and policy/tests/docs were updated.
- 2026-02-23: TASK-05 completed; product-pipeline gained route/helper test coverage and broader package coverage collection scope, validated with governed targeted test run (4 suites / 14 tests passed).
- 2026-02-23: TASK-06 completed; xa-b gained `xaFilters` + additional lib coverage and search route cache behavior tests, validated with governed targeted test run (4 suites / 14 tests passed).

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted total = `85*1 + 85*2 + 85*2 + 95*1 + 85*2 + 85*3 + 85*3 + 85*2 + 85*2 + 85*1 + 85*2 = 1795`
- Weight sum = `21`
- Overall-confidence = `1795 / 21 = 85.5%` -> **86%**

## Section Omission Rule
None: all template sections are relevant for this planning run.
