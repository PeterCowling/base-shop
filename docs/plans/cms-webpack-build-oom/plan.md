---
Type: Plan
Status: Draft
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
Overall-confidence: 81.4%
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
- [ ] TASK-01: Capture profiled CMS webpack OOM baseline artifact
- [ ] TASK-02: Map CMS build-surface blast radius and gate consumers
- [x] TASK-03: Decide CMS gate policy for dependent migrations
- [ ] TASK-04: Implement one bounded CMS graph-reduction mitigation slice
- [ ] TASK-05: Horizon checkpoint - reassess downstream plan
- [ ] TASK-06: Implement validated gate contract updates in dependent migration docs

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
- Related brief: `docs/plans/cms-webpack-build-oom/fact-find.md`
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
- Build Gate: Fail (no unblocked `IMPLEMENT` task with confidence >=80 yet)
- Auto-Continue Gate: Fail (mode is `plan-only`; no explicit auto-build intent)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Capture profiled CMS webpack OOM baseline with reproducible command matrix | 80% | S | Pending | - | TASK-04 |
| TASK-02 | INVESTIGATE | Map CMS build-gate blast radius across migration and CI surfaces | 80% | S | Pending | - | TASK-06 |
| TASK-03 | DECISION | Choose CMS gate policy (hard blocker vs machine-class best-effort) | 85% | S | Complete (2026-02-23) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Apply one bounded graph-reduction mitigation in CMS webpack path | 75% | M | Pending | TASK-01, TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess confidence and sequencing from mitigation evidence | 95% | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Update dependent migration gate contracts from validated checkpoint output | 80% | S | Pending | TASK-02, TASK-05 | - |

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
- **Deliverable:** `docs/plans/cms-webpack-build-oom/artifacts/profiling-baseline.md` with command outputs, elapsed timings, and profiler artifact pointers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/cms-webpack-build-oom/artifacts/profiling-baseline.md`, `[readonly] apps/cms/package.json`, `[readonly] apps/cms/next.config.mjs`
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
  - Checks run: `docs/plans/cms-webpack-build-oom/fact-find.md` evidence review.
  - Unexpected findings: None: task is purpose-built to discover them.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add one artifact under `docs/plans/cms-webpack-build-oom/artifacts/`.
- **Notes / references:**
  - `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md`

### TASK-02: Map CMS build-gate blast radius across migration and CI surfaces
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/cms-webpack-build-oom/artifacts/build-surface-matrix.md` enumerating all plans/workflows/contracts that consume CMS build pass/fail status
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/cms-webpack-build-oom/artifacts/build-surface-matrix.md`, `[readonly] docs/plans/turbopack-full-migration/plan.md`, `[readonly] .github/workflows/*.yml`
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
  - Checks run: fact-find references and targeted workflow/path scan already establish seed list.
  - Unexpected findings: None: to be captured in artifact.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add one artifact under `docs/plans/cms-webpack-build-oom/artifacts/`.

### TASK-03: Decide CMS gate policy for dependent migrations
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/cms-webpack-build-oom/plan.md` Decision Log + explicit gate policy statement in TASK-06 preconditions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/cms-webpack-build-oom/plan.md`, `[readonly] docs/plans/cms-webpack-build-oom/fact-find.md`, `[readonly] docs/plans/turbopack-full-migration/plan.md`
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
- **Status:** Pending
- **Affects:** `apps/cms/next.config.mjs`, `apps/cms/package.json`, `docs/plans/cms-webpack-build-oom/artifacts/profiling-baseline.md`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 75%
  - Implementation: 75% - mitigation mechanics are known but effect size is uncertain.
  - Approach: 80% - bounded one-slice change limits blast radius.
  - Impact: 75% - may reduce pressure but may not clear OOM alone.
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
  - Checks run: reviewed historical OOM evidence in `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md` and current blocker evidence in `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`.
  - Validation artifacts: `docs/plans/cms-webpack-build-oom/artifacts/profiling-baseline.md` (TASK-01 prerequisite).
  - Unexpected findings: None yet; task is capped at 75 pending fresh profiling.
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

### TASK-05: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated confidence and sequencing evidence via checkpoint reassessment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/cms-webpack-build-oom/plan.md`
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

### TASK-06: Update dependent migration gate contracts from validated checkpoint output
- **Type:** IMPLEMENT
- **Deliverable:** contract updates in dependent migration docs reflecting chosen CMS gate policy and checkpoint evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/turbopack-full-migration/plan.md`, `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`, `docs/plans/cms-webpack-build-oom/plan.md`
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
  - `docs/plans/cms-webpack-build-oom/fact-find.md`

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
- [ ] Profile baseline artifact exists and is reproducible.
- [ ] CMS gate policy is explicitly decided with scope boundaries.
- [ ] One mitigation slice is implemented and validated with before/after probe evidence.
- [ ] Checkpoint recalibrates downstream confidence and dependencies.
- [ ] Dependent migration gate contracts are updated and non-contradictory.

## Decision Log
- 2026-02-23: Initialized standalone CMS OOM mitigation plan from `docs/plans/cms-webpack-build-oom/fact-find.md` in plan-only mode.
- 2026-02-23: TASK-03 completed. Selected Option A: CMS build remains a hard blocker for dependent migration gates (user input: `option a`).

## Overall-confidence Calculation
- S=1, M=2, L=3
- Task confidences (effort-weighted): 80×1, 80×1, 85×1, 75×2, 95×1, 80×1
- Total weighted = 80 + 80 + 85 + 150 + 95 + 80 = 570
- Total weights = 1 + 1 + 1 + 2 + 1 + 1 = 7
- Overall-confidence = 570 / 7 = 81.4%
- Trigger checks:
  - Trigger 1 (Overall-confidence <4.0 / <80%): not triggered.
  - Trigger 2 (uncovered low-confidence task <80): not triggered (`TASK-04` is covered by upstream INVESTIGATE task `TASK-01`).
