---
Type: Plan
Status: Archived
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-website-first-build-contract
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop WEBSITE First-Build Contract Plan

## Summary
This plan hardens the WEBSITE container contract so the first-build (`WEBSITE-01`) and upgrade (`WEBSITE-02`) paths are operationally complete, consistently named, and drift-resistant across startup-loop authoritative surfaces. The core WEBSITE model is already present in loop-spec, stage-operator dictionary, startup-loop gate docs, and prompt templates. Remaining work is focused on process-layer clarity (`process-registry-v2` coverage semantics), authoritative workflow reference cleanup, and deterministic guardrails that prevent naming/coverage regression. The plan stays strictly framework-level and does not include business-specific website implementation.

## Active tasks
- [x] TASK-01: WEBSITE contract drift matrix (authoritative surfaces)
- [x] TASK-02: WEBSITE-01 process-registry treatment decision
- [x] TASK-03: Process-registry WEBSITE coverage hardening
- [x] TASK-04: Workflow reference normalization for WEBSITE handoff surfaces
- [x] TASK-05: WEBSITE drift guards + targeted validation
- [x] TASK-06: Checkpoint and handoff-readiness review

## Goals
- Remove ambiguity about how WEBSITE-01 is represented in process-layer contracts.
- Ensure authoritative workflow references align to current WEBSITE stage model.
- Add deterministic checks that fail when WEBSITE contract surfaces drift.
- Preserve launch-surface split and framework-first boundaries for WEBSITE-01.

## Non-goals
- Building a business website or generating business-specific website copy/content.
- Expanding WEBSITE-01 into feature-level implementation specs.
- Altering WEBSITE-02 methodology beyond consistency alignment.

## Constraints & Assumptions
- Constraints:
  - `loop-spec.yaml` remains the runtime authority for stage order and gating.
  - WEBSITE-01 and WEBSITE-02 remain conditional and mutually path-specific by `launch-surface`.
  - Changes should be additive and non-breaking for existing startup-loop flows.
- Assumptions:
  - WEBSITE-01 process-layer treatment is explicit coverage via `OFF-3` bootstrap mapping.
  - Workflow reference tables are operator-critical and should not carry stale legacy stage IDs.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-website-first-build-contract/fact-find.md`
- Key findings used:
  - WEBSITE container and sub-stages are canonical in `loop-spec.yaml`.
  - WEBSITE gate behavior in `cmd-start.md` is launch-surface aware and artifact-specific.
  - WEBSITE-01 prompt template now encodes framework-first assembly and measurable DoD.
  - Process-registry WEBSITE-01 coverage is now explicit; residual drift remains mainly in legacy stage labels across workflow reference sections.

## Proposed Approach
- Option A: Leave current docs as-is and rely on tribal knowledge for WEBSITE-01 process accountability.
  - Rejected: preserves ambiguity and drift risk.
- Option B: Complete contract hardening in three layers: process registry semantics, operator workflow reference alignment, and deterministic drift checks.
  - Chosen: closes remaining operational gaps while preserving existing architecture.
- Option C: Delay hardening until first business WEBSITE-01 execution fails.
  - Rejected: fail-late path; avoidable operator stalls.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - `Auto-Build-Intent` is `plan-only`.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build WEBSITE contract drift matrix across authoritative surfaces | 88% | S | Complete (2026-02-23) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | DECISION | Decide WEBSITE-01 process-registry treatment (explicit row vs explicit exemption) | 82% | S | Complete (2026-02-23, operator-confirmed) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Apply WEBSITE coverage updates in process-registry and stage coverage map | 81% | M | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Normalize WEBSITE-related workflow handoff references and remove stale stage labels in authoritative sections | 80% | M | Complete (2026-02-23) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Add WEBSITE drift guards and run targeted validation | 80% | M | Complete (2026-02-23) | TASK-03, TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Reassess confidence and approve handoff readiness | 95% | S | Complete (2026-02-23) | TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish exact drift and authority map |
| 2 | TASK-02 | TASK-01 | Decision needed before registry edits |
| 3 | TASK-03, TASK-04 | TASK-01 (+ TASK-02 for TASK-03) | Can run in parallel once policy decision is set |
| 4 | TASK-05 | TASK-03, TASK-04 | Add guards only after docs/contracts are settled |
| 5 | TASK-06 | TASK-05 | Final checkpoint for readiness |

## Tasks

### TASK-01: WEBSITE contract drift matrix (authoritative surfaces)
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-website-first-build-contract/artifacts/website-contract-drift-matrix.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `[readonly] docs/business-os/startup-loop/loop-spec.yaml`, `[readonly] docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `[readonly] docs/business-os/startup-loop-workflow.user.md`, `[readonly] docs/business-os/startup-loop/process-registry-v2.md`, `[readonly] .claude/skills/startup-loop/modules/cmd-start.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 88%
  - Implementation: 90% - source set is known and bounded
  - Approach: 88% - single matrix clarifies authority vs mirror docs quickly
  - Impact: 88% - avoids duplicate edits and conflicting assumptions
- **Acceptance:**
  - Matrix lists each WEBSITE-relevant surface and classifies it as `authoritative`, `derived`, or `operator-reference`.
  - Matrix calls out every WEBSITE-01/02 inconsistency with exact path references.
- **Build completion evidence (2026-02-23):**
  - Artifact created: `docs/plans/startup-loop-website-first-build-contract/artifacts/website-contract-drift-matrix.md`.
  - Evidence queries executed with targeted `rg`/`nl` reads against all `Affects` surfaces.
  - Validation snapshot captured in artifact:
    - `pnpm --filter ./scripts run check-stage-operator-views` (PASS)
    - `pnpm --filter ./scripts test -- --testPathPattern=\"generate-stage-operator-views.test.ts|derive-state.test.ts\" --maxWorkers=2` (PASS)

### TASK-02: WEBSITE-01 process-registry treatment decision
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-website-first-build-contract/decisions/website-01-process-registry-treatment.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-23, operator-confirmed)
- **Affects:** `docs/business-os/startup-loop/process-registry-v2.md` (policy input), `docs/plans/startup-loop-website-first-build-contract/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 82%
  - Implementation: 85% - decision space is small
  - Approach: 82% - requires explicit semantics choice to prevent future ambiguity
  - Impact: 82% - unblocks consistent registry coverage and validation rules
- **Acceptance:**
  - One explicit policy selected: `explicit coverage row` or `explicit exemption rule`.
  - Decision note includes rationale, consequences, and validation implications.
- **Resolution evidence (2026-02-23):**
  - Operator confirmation: explicit coverage path confirmed in chat.
  - Policy encoded in docs and recorded in decision log:
    - `docs/business-os/startup-loop/process-registry-v2.md:60`
    - `docs/business-os/startup-loop/process-registry-v2.md:102`
    - `docs/business-os/startup-loop/process-registry-v2.md:248`

### TASK-03: Process-registry WEBSITE coverage hardening
- **Type:** IMPLEMENT
- **Deliverable:** updated WEBSITE coverage semantics in `process-registry-v2.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/business-os/startup-loop/process-registry-v2.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Confidence:** 81%
  - Implementation: 82% - target sections are explicit
  - Approach: 81% - contract-only changes with clear policy output
  - Impact: 81% - removes WEBSITE-01 accountability ambiguity
- **Acceptance:**
  - Stage coverage table and related prose align with selected TASK-02 policy.
  - WEBSITE container semantics are explicit and non-contradictory.
- **Validation contract:**
  - VC-03-01: `rg -n "WEBSITE-01|WEBSITE-02|WEBSITE" docs/business-os/startup-loop/process-registry-v2.md` returns policy-consistent references.
  - VC-03-02: no claim remains that conflicts with actual stage coverage rows.
- **Consumer tracing (M effort):**
  - New/updated outputs consumed by: operator workflow readers and maintainers; no runtime parser changes expected.
  - Unchanged consumers are safe because runtime authority remains `loop-spec.yaml`.
- **Build completion evidence (2026-02-23):**
  - Process-layer coverage updated to explicit WEBSITE-01 bootstrap + WEBSITE-02 recurring mapping through OFF-3:
    - `docs/business-os/startup-loop/process-registry-v2.md:60`
    - `docs/business-os/startup-loop/process-registry-v2.md:102`
    - `docs/business-os/startup-loop/process-registry-v2.md:103`
  - Related prose/anchor consistency hardened:
    - `docs/business-os/startup-loop/process-registry-v2.md:248`
    - `docs/business-os/startup-loop/process-registry-v2.md:591`
  - VC-03 checks:
    - `rg -n "WEBSITE-01|WEBSITE-02|WEBSITE" docs/business-os/startup-loop/process-registry-v2.md` (PASS)
    - conflict scan against stage coverage claims completed via TASK-01 drift matrix + post-change re-read (PASS)

### TASK-04: Workflow reference normalization for WEBSITE handoff surfaces
- **Type:** IMPLEMENT
- **Deliverable:** aligned WEBSITE and stage references in authoritative workflow handoff sections
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop-workflow.user.html` (if regenerated)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 82% - target sections are identifiable
  - Approach: 80% - requires careful separation of active contract vs historical reference text
  - Impact: 80% - reduces operator routing mistakes
- **Acceptance:**
  - WEBSITE-01 and WEBSITE-02 handoff rows are consistent with `loop-spec.yaml` and `cmd-start.md`.
  - Stale legacy stage labels are removed or explicitly marked historical where they remain intentionally.
- **Validation contract:**
  - VC-04-01: `rg -n "WEBSITE-01|WEBSITE-02" docs/business-os/startup-loop-workflow.user.md` shows correct trigger/output mapping.
  - VC-04-02: legacy stage references in authoritative handoff rows are eliminated or tagged as historical with rationale.
- **Consumer tracing (M effort):**
  - Updated references consumed by operators and downstream docs maintainers.
  - No runtime contract consumers are modified.
- **Build completion evidence (2026-02-23):**
  - Workflow reference tables normalized to canonical stage model in authoritative sections:
    - `docs/business-os/startup-loop-workflow.user.md:128`
    - `docs/business-os/startup-loop-workflow.user.md:267`
    - `docs/business-os/startup-loop-workflow.user.md:546`
    - `docs/business-os/startup-loop-workflow.user.md:646`
    - `docs/business-os/startup-loop-workflow.user.md:688`
  - WEBSITE handoff rows revalidated against loop-spec/cmd-start:
    - `docs/business-os/startup-loop-workflow.user.md:556`
    - `docs/business-os/startup-loop-workflow.user.md:557`
    - `.claude/skills/startup-loop/modules/cmd-start.md:169`
  - Rendered companion refreshed:
    - `docs/business-os/startup-loop-workflow.user.html`
  - VC-04 checks:
    - `rg -n "WEBSITE-01|WEBSITE-02" docs/business-os/startup-loop-workflow.user.md` (PASS)
    - legacy stage-label scan for authoritative rows executed and normalized (PASS)

### TASK-05: WEBSITE drift guards + targeted validation
- **Type:** IMPLEMENT
- **Deliverable:** deterministic guard(s) + validation evidence for WEBSITE contract parity
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `scripts/src/startup-loop/` checks/tests, `docs/business-os/startup-loop/_generated/*` (if regenerated), plan artifacts
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - exact guard shape chosen after TASK-01 matrix
  - Approach: 80% - enforce parity where drift has occurred
  - Impact: 80% - catches regressions before operator impact
- **Acceptance:**
  - One automated check fails if WEBSITE contract surfaces diverge.
  - Targeted checks pass after alignment:
    - `pnpm --filter ./scripts run check-stage-operator-views`
    - `pnpm --filter ./scripts test -- --testPathPattern="generate-stage-operator-views.test.ts|derive-state.test.ts" --maxWorkers=2`
- **Consumer tracing (M effort):**
  - New guard output consumed by CI and maintainers.
  - Existing startup-loop command consumers unaffected unless guard intentionally fails on drift.
- **Build completion evidence (2026-02-23):**
  - Added deterministic WEBSITE parity guard test:
    - `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`
  - Guard coverage:
    - loop-spec WEBSITE container/child/ordering invariants
    - WEBSITE-01 handoff contract parity across `cmd-start.md` and workflow handoff map
    - process-layer OFF-3 WEBSITE-01/02 explicit ownership invariants
  - Validation passes:
    - `pnpm --filter ./scripts run check-stage-operator-views` (PASS)
    - `pnpm --filter ./scripts test -- --testPathPattern="generate-stage-operator-views.test.ts|derive-state.test.ts|website-contract-parity.test.ts" --maxWorkers=2` (PASS)
    - `pnpm exec eslint scripts/src/startup-loop/__tests__/website-contract-parity.test.ts` (PASS)

### TASK-06: Checkpoint and handoff-readiness review
- **Type:** CHECKPOINT
- **Deliverable:** updated plan gate statuses + readiness note
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/startup-loop-website-first-build-contract/plan.md`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - procedural
  - Approach: 95% - explicit gate review criteria exists
  - Impact: 95% - prevents partial handoff
- **Acceptance:**
  - Foundation/Sequencing/Edge-case/Auto-build gate statuses are re-evaluated with evidence references.
  - Remaining risks and follow-up actions are explicit.
- **Build completion evidence (2026-02-23):**
  - Gate reassessment:
    - Foundation Gate: Pass (TASK-01..TASK-05 evidence complete)
    - Sequenced: Yes (Wave 1 -> Wave 2 -> Wave 3 -> Wave 4 -> Wave 5 respected)
    - Edge-case review complete: Yes (legacy stage-label drift normalized in authoritative workflow sections)
    - Auto-build eligible: No (plan-only mode and no remaining executable tasks)
  - Downstream check:
    - No downstream tasks remain after TASK-06; `/lp-do-replan` dispatch not required in this checkpoint cycle.
  - Remaining follow-up:
    - Produce `results-review.user.md` after deployment/use to close loop and allow archival per build contract.

## Risks & Mitigations
- Workflow edits accidentally touch historical references intended to stay archived.
  - Mitigation: classify sections as authoritative vs historical in TASK-01 before editing.
- New guard creates false positives.
  - Mitigation: implement small fixture-based checks and document scope boundaries.

## Observability
- Logging:
  - Record guard command outputs and file deltas in task notes.
- Metrics:
  - Count of WEBSITE contract drift findings before/after TASK-05.
- Alerts/Dashboards:
  - None: repo-level validation feedback is sufficient.

## Acceptance Criteria (overall)
- [x] WEBSITE-01 process accountability is explicit and non-ambiguous in process-layer docs.
- [x] WEBSITE handoff references are consistent across loop-spec, startup-loop workflow, and cmd-start gate docs.
- [x] At least one deterministic guard exists for WEBSITE contract drift.
- [x] Targeted startup-loop stage-operator checks/tests pass after changes.

## What would make this >=90%
1. Run one business dry-run generation of `site-v1-builder-prompt.user.md` and capture acceptance evidence.
2. Add CI invocation path that always runs `website-contract-parity.test.ts` in startup-loop contract checks.
3. Produce `results-review.user.md` after first real-world cycle and archive the plan.

## Decision Log
- 2026-02-23: Plan created from direct-inject fact-find for WEBSITE container + WEBSITE-01 first-build prompt hardening.
- 2026-02-23: WEBSITE-01 process-layer treatment confirmed: explicit stage coverage via `OFF-3` bootstrap mapping (not exemption).
- 2026-02-23: TASK-03 and TASK-04 completed; process-registry coverage and workflow-stage reference normalization landed.
- 2026-02-23: TASK-05 guard test added (`website-contract-parity.test.ts`) and validation suite passed.
- 2026-02-23: TASK-06 checkpoint complete; all executable tasks complete pending post-build results review artifact.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence:
  - TASK-01: 88 * 1 = 88
  - TASK-02: 82 * 1 = 82
  - TASK-03: 81 * 2 = 162
  - TASK-04: 80 * 2 = 160
  - TASK-05: 80 * 2 = 160
  - TASK-06: 95 * 1 = 95
- Sum(weights) = 9
- Overall-confidence = 747 / 9 = 83%
