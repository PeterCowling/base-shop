---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: none
Feature-Slug: cms-webpack-build-oom
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83.4%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# CMS Webpack Build OOM Mitigation Plan

## Summary
This plan addresses recurring `@apps/cms` webpack build OOM failures that currently block completion of `turbopack-full-migration` TASK-07 validation. The plan separates policy choice from technical mitigation: collect fresh profiling and build-surface evidence, apply the selected gate policy, implement one bounded mitigation slice, then checkpoint before broader rollout. This keeps high-risk CMS config changes incremental and reversible while preserving strict migration gating. The near-term objective is to produce a reliable, explicit validation contract for CMS on current machine classes and CI paths.

## Active tasks
- [x] TASK-01: Capture profiled CMS webpack OOM baseline artifact
- [x] TASK-02: Map CMS build-surface blast radius and gate consumers
- [x] TASK-03: Decide CMS gate policy for dependent migrations
- [x] TASK-04: Implement one bounded CMS graph-reduction mitigation slice
- [x] TASK-05: Horizon checkpoint - reassess downstream plan
- [x] TASK-06: Implement validated gate contract updates in dependent migration docs

## Goals
- Produce reproducible profiling evidence for current CMS OOM behavior.
- Make an explicit policy decision for CMS build gating in dependent migration plans.
- Execute one bounded, rollback-safe mitigation slice against CMS build graph pressure.
- Re-evaluate confidence and downstream sequencing after mitigation evidence is available.

## Non-goals
- Full Turbopack migration for CMS in this plan.
- Multi-slice or broad CMS refactors in a single pass.
- Storybook or non-CMS build-path changes.

## Constraints & Assumptions
- Constraints:
  - CMS build command is currently `next build --webpack`.
  - Existing OOM evidence includes repeated failures at default heap and 8GB heap with `NEXT_BUILD_CPUS=1`.
  - CMS `next.config.mjs` contains high-risk alias/cache/fallback logic that must preserve behavior.
- Assumptions:
  - OOM is primarily build-graph pressure, not a transient runtime failure.
  - A single bounded mitigation slice is safer than a broad simultaneous config rewrite.

## Fact-Find Reference
- Related brief: `docs/plans/_archive/cms-webpack-build-oom/fact-find.md`
- Key findings used:
  - `apps/cms/package.json` keeps webpack-pinned `dev`, `dev:debug`, and `build` scripts.
  - `apps/cms/next.config.mjs` sets `experimental.cpus` from `NEXT_BUILD_CPUS` and includes high-complexity webpack callback behavior.
  - Current migration evidence reports three CMS build OOM failures (`default`, `8GB`, `8GB + cpus=1`) on 2026-02-23.
  - Historical Next 16 OOM notes show CMS can still fail at high heap sizes; heap increase alone is insufficient.

## Proposed Approach
- Option A: Keep CMS as hard blocker in dependent migration gates until build exits 0 on baseline machine class.
  - Pros: strongest regression guard.
  - Cons: high risk of migration deadlock if mitigation takes multiple cycles.
- Option B: Move CMS to explicit best-effort gate for constrained machine classes while mitigation lane runs, keeping hard blocker only where machine class is proven sufficient.
  - Pros: avoids deadlock and keeps mitigation lane explicit.
  - Cons: weaker immediate enforcement; requires clear policy boundaries.
- Chosen approach:
  - Option A selected. Keep CMS as hard blocker while executing evidence-first mitigation work: profile baseline, apply one bounded mitigation slice, checkpoint, then update dependent contracts.

## Plan Gates
- Foundation Gate: Pass
- Build Gate: Pass (all executable tasks complete)
- Auto-Continue Gate: Fail (mode is `plan-only`; no explicit auto-build intent)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Capture profiled CMS webpack OOM baseline with reproducible command matrix | 80% | S | Complete (2026-02-23) | - | TASK-04 |
| TASK-02 | INVESTIGATE | Map CMS build-gate blast radius across migration and CI surfaces | 80% | S | Complete (2026-02-23) | - | TASK-06 |
| TASK-03 | DECISION | Choose CMS gate policy (hard blocker vs machine-class best-effort) | 85% | S | Complete (2026-02-23) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Apply one bounded graph-reduction mitigation in CMS webpack path | 82% | M | Complete (2026-02-23) | TASK-01, TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess confidence and sequencing from mitigation evidence | 95% | S | Complete (2026-02-23) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Update dependent migration gate contracts from validated checkpoint output | 80% | S | Complete (2026-02-23) | TASK-02, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Evidence collection tasks run in parallel (`TASK-03` already complete) |
| 2 | TASK-04 | TASK-01, TASK-03 | Mitigation slice executes under selected hard-blocker policy |
| 3 | TASK-05 | TASK-04 | Mandatory checkpoint before downstream propagation |
| 4 | TASK-06 | TASK-02, TASK-05 | Contract updates after checkpoint and blast-radius mapping |

## Tasks

### TASK-01: Capture profiled CMS webpack OOM baseline artifact
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md` with command outputs, elapsed timings, and profiler artifact pointers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`, `[readonly] apps/cms/package.json`, `[readonly] apps/cms/next.config.mjs`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% - command matrix is known and reproducible.
  - Approach: 85% - profiler-first evidence reduces guesswork.
  - Impact: 80% - provides objective baseline for mitigation validation.
- **Questions to answer:**
  - Which command variant fails fastest and where in build lifecycle?
  - What profiling signals indicate dominant memory pressure contributors?
- **Acceptance:**
  - Baseline artifact records at least three command variants (`default`, `8GB`, `8GB+cpus=1`).
  - Artifact includes machine-class metadata and explicit failure signatures.
  - Artifact links profiler outputs (or explains why unavailable).
- **Validation contract:**
  - Evidence artifact exists and is referenced in TASK-04 planning validation.
- **Planning validation:**
  - Checks run:
    - `pnpm --filter @apps/cms build`
    - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`
    - `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`
  - Validation artifact: `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`
  - Unexpected findings: `NEXT_BUILD_CPUS=1` increased wall-clock time materially but still failed with the same OOM signature.
- **Build evidence (2026-02-23):**
  - Created `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md` with machine metadata, required probe matrix results, and log pointers.
  - Captured reproducible OOM failures for all required variants in `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/`.
- **Downstream confidence propagation:**
  - Classification: Neutral for `TASK-04`.
  - `TASK-04` remains at 75% because this task confirms reproducibility but does not yet isolate dominant memory contributors.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add one artifact under `docs/plans/_archive/cms-webpack-build-oom/artifacts/`.
- **Notes / references:**
  - `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md`

### TASK-02: Map CMS build-gate blast radius across migration and CI surfaces
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md` enumerating all plans/workflows/contracts that consume CMS build pass/fail status
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`, `[readonly] docs/plans/turbopack-full-migration/plan.md`, `[readonly] .github/workflows/*.yml`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - dependent surfaces are identifiable from repo artifacts.
  - Approach: 80% - matrix format is straightforward and reusable.
  - Impact: 85% - prevents hidden gate-policy regressions.
- **Questions to answer:**
  - Which automation and plan gates currently require hard CMS build success?
  - Which consumers can tolerate explicit best-effort semantics with machine-class condition?
- **Acceptance:**
  - Matrix lists each consumer, current requirement, and policy sensitivity.
  - Matrix identifies owners for each gate decision.
- **Validation contract:**
  - Every item in matrix includes at least one repo pointer.
- **Planning validation:**
  - Checks run:
    - `rg -n "@apps/cms build|--filter @apps/cms build|CMS validation blocker|TASK-07|hard blocker" docs/plans/turbopack-full-migration/plan.md docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/_archive/cms-webpack-build-oom/plan.md`
    - `rg -n "@apps/cms|pnpm --filter .*cms.* build|turbo run build --filter=@apps/cms|cms_deploy|cms_e2e|promote-app:cms" .github/workflows/*.yml`
  - Validation artifact: `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`
  - Unexpected findings: no active consumer currently supports machine-class best-effort semantics for CMS build status.
- **Build evidence (2026-02-23):**
  - Created `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md` with six active consumer surfaces across plans/workflows and explicit policy-sensitivity mapping.
  - Confirmed merge gating requires both `cms.yml` and `cypress.yml` when CMS scopes are active.
  - Confirmed `ci.yml` is path-ignored for CMS and is not an active CMS build-status consumer.
- **Downstream confidence propagation:**
  - Classification: Neutral for `TASK-06`.
  - `TASK-06` remains at 80% because contract-update confidence still depends on `TASK-05` checkpoint output.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add one artifact under `docs/plans/_archive/cms-webpack-build-oom/artifacts/`.

### TASK-03: Decide CMS gate policy for dependent migrations
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/_archive/cms-webpack-build-oom/plan.md` Decision Log + explicit gate policy statement in TASK-06 preconditions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/cms-webpack-build-oom/plan.md`, `[readonly] docs/plans/_archive/cms-webpack-build-oom/fact-find.md`, `[readonly] docs/plans/turbopack-full-migration/plan.md`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - decision format and acceptance are clear.
  - Approach: 85% - policy trade-off is well-bounded by evidence tasks.
  - Impact: 90% - determines whether migration remains blocked.
- **Options:**
  - Option A: Keep CMS as hard blocker in all dependent migration gates.
  - Option B: Adopt machine-class-aware best-effort CMS gate for constrained environments, while preserving hard blocker where environment capacity is validated.
- **Recommendation:** Option A when strict migration gate posture is required.
- **Decision outcome (2026-02-23):**
  - Selected option: Option A (CMS remains a hard blocker in dependent migration gates).
  - Input source: user decision (`option a`).
  - Rationale: preserve strongest regression control while mitigation lane works to restore reliable build pass conditions.
- **Acceptance:**
  - Selected option is recorded with rationale and explicit scope boundaries.
  - Downstream task preconditions reflect selected option.
- **Validation contract:**
  - Decision log entry exists and no task dependency contradictions remain.
- **Planning validation:**
  - User-input decision captured and recorded in plan Decision Log.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update plan decision log and, if needed, related dependent plan notes.

### TASK-04: Apply one bounded graph-reduction mitigation in CMS webpack path
- **Type:** IMPLEMENT
- **Deliverable:** code-change implementing one mitigation slice in CMS build graph behavior with before/after probe evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/cms/next.config.mjs`, `apps/cms/package.json`, `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 82% - baseline OOM reproduction matrix and timing envelope are now captured in lane-specific artifact (`E2` evidence).
  - Approach: 82% - mitigation remains bounded to one slice with explicit rollback and validation contracts.
  - Impact: 82% - pass/fail signals and gate consumers are now explicit, so a mitigation attempt can be judged without policy ambiguity.
- **Acceptance:**
  - One clearly-scoped mitigation slice is implemented and documented.
  - Standardized probe matrix rerun with before/after comparison.
  - No alias/fallback regressions in targeted CMS validations.
- **Validation contract (TC-XX):**
  - TC-01: mitigation branch compiles and starts build process with expected config semantics.
  - TC-02: probe matrix runs and records pass/fail + elapsed timings.
  - TC-03: targeted config-dependent validations pass (no new alias/fallback errors).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed historical OOM evidence in `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md`, current blocker evidence in `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`, and lane-specific baseline in `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`.
  - Validation artifacts: `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md` (TASK-01 prerequisite).
  - Unexpected findings: `NEXT_BUILD_CPUS=1` increases wall-clock time substantially without changing fail outcome on current machine class.
- **Scouts:**
  - Confirm chosen slice does not invalidate CMS runtime aliases or node built-in handling.
- **Edge Cases & Hardening:**
  - Preserve behavior for `ensureSafeWebpackHash`, dev cache behavior, and alias mappings required by CMS routes.
- **What would make this >=90%:**
  - Fresh profiler data identifies a dominant contributor with a direct, low-risk mitigation lever.
  - Pilot slice demonstrates measurable memory/timing improvement without regression.
- **Rollout / rollback:**
  - Rollout: one mitigation slice only, then rerun probe matrix.
  - Rollback: revert touched CMS config/script files and restore previous probe baseline.
- **Documentation impact:**
  - update mitigation evidence artifact and plan decision/checkpoint notes.
- **Notes / references:**
  - Consumer tracing (preliminary): modified build-graph knobs are consumed by Next webpack compiler and all CMS module-resolution call-sites; downstream safety relies on targeted alias/fallback checks in TC-03.
#### Re-plan Update (2026-02-23)
- Confidence: 75% -> 82% (Evidence: E2 from `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`; E1 from `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`)
- Key change: baseline and gate-consumer unknowns are now converted into explicit artifacts, so TASK-04 can run as a bounded mitigation attempt.
- Dependencies: unchanged (`TASK-01`, `TASK-03` complete)
- Validation contract: unchanged (TC-01..TC-03)
- Notes: no topology change; `/lp-sequence` not required
- **Build evidence (2026-02-23):**
  - Implemented one bounded build-only graph-reduction slice in `apps/cms/next.config.mjs`: production webpack aliases now resolve `@acme/lib` and `@acme/configurator` from `dist/` while preserving dev-mode source aliases.
  - Updated mitigation evidence artifact with before/after matrix data in `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`.
  - Reran standardized probe matrix with fresh raw logs under `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/`:
    - `pnpm --filter @apps/cms build` -> exit `134` in `441s` (`SIGABRT` OOM)
    - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> exit `134` in `558s` (`SIGABRT` OOM)
    - `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> exit `134` in `431s` (`SIGABRT` OOM)
  - Targeted config-dependent validations:
    - `pnpm --filter @apps/cms lint -- next.config.mjs` -> pass (warnings only)
    - `pnpm --filter @apps/cms exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs "apps/cms/src/app/cms/shop/\\[shop\\]/settings/__tests__/useShopEditorForm.test.ts"` -> pass
    - `pnpm --filter @apps/cms test -- src/lib/__tests__/listShops.test.ts` -> pass
  - Non-blocking validation note: `pnpm --filter @apps/cms typecheck` currently fails with TS6305 against `packages/theme/dist/index.d.ts`; failure is in pre-existing workspace artifact mapping and not in TASK-04 touched files.
- **Downstream confidence propagation:**
  - Classification: Positive for `TASK-05` eligibility, Neutral for `TASK-06`.
  - `TASK-05` was promoted to runnable and completed in the subsequent checkpoint cycle.
  - `TASK-06` remains at 80% pending checkpoint output from `TASK-05`.

### TASK-05: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated confidence and sequencing evidence via checkpoint reassessment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/cms-webpack-build-oom/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is deterministic.
  - Approach: 95% - avoids compounding unknowns after first mitigation slice.
  - Impact: 95% - ensures downstream contract updates are evidence-driven.
- **Acceptance:**
  - Mitigation outputs reviewed and task confidence recalibrated.
  - Downstream task scope adjusted if mitigation results differ from assumptions.
- **Horizon assumptions to validate:**
  - Mitigation signal is strong enough to update gate contracts.
  - Additional mitigation slices are either unnecessary or explicitly re-planned.
- **Validation contract:**
  - Plan is updated with checkpoint outcomes and dependency consistency preserved.
- **Planning validation:**
  - replan/checkpoint evidence captured in plan notes.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan with checkpoint outcomes.
- **Build evidence (2026-02-23):**
  - Summarized completed-task evidence from TASK-04 artifact updates (`docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`): one bounded mitigation slice was applied, but all three required probes still fail with OOM/SIGABRT (`exit 134`).
  - Evaluated horizon assumptions:
    - Assumption `Mitigation signal is strong enough to update gate contracts` -> **validated** (signal is decisive: hard-blocker contract remains in force with refreshed evidence).
    - Assumption `Additional mitigation slices are unnecessary` -> **invalidated** (first slice did not clear blocker; further mitigation and/or environment strategy remains likely).
  - Ran checkpoint replan for downstream task (`TASK-06`) using current evidence in:
    - `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`
    - `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`
    - `docs/plans/turbopack-full-migration/plan.md`
    - `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`
  - Replan outcome:
    - `TASK-06` remains runnable at 80% with unchanged dependency chain (`TASK-02`, `TASK-05` complete).
    - No precursor task required.
    - No topology/dependency graph changes; `/lp-sequence` not required.
- **Downstream confidence propagation:**
  - Classification: Neutral for `TASK-06` confidence; positive for `TASK-06` readiness.
  - `TASK-06` was promoted as the next runnable task and is now complete.

### TASK-06: Update dependent migration gate contracts from validated checkpoint output
- **Type:** IMPLEMENT
- **Deliverable:** contract updates in dependent migration docs reflecting chosen CMS gate policy and checkpoint evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/turbopack-full-migration/plan.md`, `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`, `docs/plans/_archive/cms-webpack-build-oom/plan.md`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - edits are bounded to plan contract surfaces.
  - Approach: 85% - updates happen only after policy + checkpoint closure.
  - Impact: 80% - clears ambiguity for downstream execution.
- **Acceptance:**
  - Dependent plan contracts explicitly match selected gate policy.
  - No contradictory blocker statements remain between plans.
- **Validation contract (TC-XX):**
  - TC-01: cross-plan gate statements are internally consistent.
  - TC-02: updated migration matrix reflects current CMS validation posture.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: documentation contract update task.
- **Edge Cases & Hardening:**
  - Preserve explicit hard-blocker language and avoid introducing implicit best-effort exceptions.
- **What would make this >=90%:**
  - Checkpoint results are definitive and eliminate conditional wording.
- **Rollout / rollback:**
  - Rollout: update contracts only after checkpoint completion.
  - Rollback: revert dependent plan docs to prior gate wording.
- **Documentation impact:**
  - updates in both feature plans and associated matrix artifact.
- **Notes / references:**
  - `docs/plans/_archive/cms-webpack-build-oom/fact-find.md`
#### Re-plan Update (2026-02-23)
- Confidence: 80% -> 80% (Evidence: checkpoint confirms hard-blocker contract remains consistent across mapped consumers; no new topology risk introduced)
- Key change: scope remains contract-sync propagation only; checkpoint evidence is now explicit and ready to apply to dependent migration docs.
- Dependencies: unchanged (`TASK-02`, `TASK-05` complete)
- Validation contract: unchanged (TC-01, TC-02 remain the required checks for this S-effort docs task)
- Notes: no topology change; `/lp-sequence` not required
- **Build evidence (2026-02-23):**
  - Updated `docs/plans/turbopack-full-migration/plan.md` TASK-07 contract wording from generic "CMS validation blocker" to explicit hard-blocker contract language aligned with Option A policy from this plan.
  - Updated `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` to:
    - align CMS workflow coupling with active consumers (`cms.yml`, `cypress.yml`; removed `ci.yml` as active consumer),
    - add checkpoint addendum with post-mitigation probe evidence from `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/`,
    - preserve explicit TASK-08 block condition under hard-blocker policy.
  - Contract validation checks:
    - `rg -n "CMS validation blocker|hard-blocker|Option A|TASK-07|TASK-08" docs/plans/turbopack-full-migration/plan.md docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/_archive/cms-webpack-build-oom/plan.md`
    - `rg -n "ci.yml|cms.yml|cypress.yml" docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`
  - Validation result: cross-plan language and matrix posture are now internally consistent with the checkpointed Option A hard-blocker contract.
- **Downstream confidence propagation:**
  - Not applicable: no remaining downstream tasks in this plan.

## Risks & Mitigations
- Mis-scoped mitigation changes alter CMS runtime behavior:
  - Mitigation: one-slice bounded changes + targeted alias/fallback validation.
- Policy ambiguity causes conflicting execution decisions across plans:
  - Mitigation: decision now fixed to Option A; propagate exact wording in TASK-06.
- Profiling artifacts are incomplete or non-actionable:
  - Mitigation: artifact acceptance requires command matrix and machine metadata.
- Persistent OOM after first mitigation slice:
  - Mitigation: CHECKPOINT task decides replan vs additional slice with explicit stall-escalation path under hard-blocker policy.

## Observability
- Logging:
  - Persist each probe command, failure signature, elapsed time, and environment variables in artifact docs.
- Metrics:
  - OOM occurrence count per command variant.
  - Time-to-failure and (when available) peak memory indicator from profiler outputs.
- Alerts/Dashboards:
  - None: artifact-based observability in plan docs is sufficient for this lane.

## Acceptance Criteria (overall)
- [x] Profile baseline artifact exists and is reproducible.
- [x] Build-surface matrix exists with consumer, policy-sensitivity, and owner-role mapping.
- [x] CMS gate policy is explicitly decided with scope boundaries.
- [x] One mitigation slice is implemented and validated with before/after probe evidence.
- [x] Checkpoint recalibrates downstream confidence and dependencies.
- [x] Dependent migration gate contracts are updated and non-contradictory.

## Decision Log
- 2026-02-23: Initialized standalone CMS OOM mitigation plan from `docs/plans/_archive/cms-webpack-build-oom/fact-find.md` in plan-only mode.
- 2026-02-23: TASK-01 completed. Baseline profiling artifact captured at `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md` with reproducible OOM failures across `default`, `8GB`, and `8GB+cpus=1`.
- 2026-02-23: TASK-02 completed. Build-surface consumer matrix captured at `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`; hard-gate consumers confirmed across migration docs, CMS/Cypress workflows, and merge-gate workflow requirements.
- 2026-02-23: TASK-03 completed. Selected Option A: CMS build remains a hard blocker for dependent migration gates (user input: `option a`).
- 2026-02-23: `/lp-do-replan` delta applied for TASK-04. Confidence promoted from 75% to 82% using E2 lane-specific probe evidence plus E1 consumer-matrix evidence; task is now build-eligible.
- 2026-02-23: TASK-04 completed. Implemented production-only dist-alias graph-reduction slice in `apps/cms/next.config.mjs`, reran full probe matrix, and captured before/after deltas in `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`. OOM persists in all three variants (`exit 134`), so TASK-05 checkpoint is required before contract propagation.
- 2026-02-23: TASK-05 completed. Checkpoint validated that TASK-04 evidence is sufficient to keep Option A hard-blocker posture and proceed to contract-propagation work; downstream replan found no topology changes and kept TASK-06 runnable at 80%.
- 2026-02-23: TASK-06 completed. Updated dependent `turbopack-full-migration` contracts and migration matrix to explicitly reflect Option A hard-blocker posture and current CMS checkpoint evidence; no contradictory blocker wording remains across plan/matrix surfaces.
- 2026-02-23: Build record generated at `docs/plans/_archive/cms-webpack-build-oom/build-record.user.md`; waiting on `results-review.user.md` before archival.
- 2026-02-23: `results-review.user.md` completed at `docs/plans/_archive/cms-webpack-build-oom/results-review.user.md`; plan lifecycle advanced to `Status: Archived`.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Task confidences (effort-weighted): 80×1, 80×1, 85×1, 82×2, 95×1, 80×1
- Total weighted = 80 + 80 + 85 + 164 + 95 + 80 = 584
- Total weights = 1 + 1 + 1 + 2 + 1 + 1 = 7
- Overall-confidence = 584 / 7 = 83.4%
- Trigger checks:
  - Trigger 1 (Overall-confidence <4.0 / <80%): not triggered.
  - Trigger 2 (uncovered low-confidence task <80): not triggered (no runnable IMPLEMENT task remains below 80).
