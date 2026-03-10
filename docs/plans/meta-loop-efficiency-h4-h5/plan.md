---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: meta-loop-efficiency-h4-h5
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: meta-loop-efficiency, tools-loop-efficiency-deterministic-extraction
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Meta-Loop Efficiency H4/H5 Plan

## Summary
Implement a script-backed `/meta-loop-efficiency` audit path so H4 deterministic-extraction and H5 shrink-without-simplification are computed from repo state instead of remaining prose-only heuristics. The build also updates the skill contract where needed and extends deterministic-extraction scout/queue tooling so new signals flow into the existing analysis pipeline. The chosen approach uses the previous audit artifact `git_sha` to reconstruct prior skill snapshots, avoiding new baseline storage and making H5 immediately usable on future runs.

## Active tasks
- [x] TASK-01: Ship script-backed H4/H5 audit and downstream ingestion

## Goals
- Generate audit output with executable H0-H5 coverage including List 3.
- Compute H5 from current repo state versus previous-audit git snapshots.
- Keep scout and queue tooling compatible with the expanded audit output.
- Validate the touched `scripts` code path locally with targeted static checks and dry-runs.

## Non-goals
- Solving unrelated skill-efficiency backlog items.
- Broad repo validation outside touched surfaces.
- Local Jest execution.

## Constraints & Assumptions
- Constraints:
  - Commit scope must remain limited to files required for this feature.
  - Validation must respect CI-only test execution policy.
  - Audit artifact contract and skill docs must remain aligned.
- Assumptions:
  - Previous artifact `git_sha` values resolve in local git history.
  - A script-backed audit is the long-term correct architecture for H4/H5.

## Inherited Outcome Contract
- **Why:** Close the structural-only gap in skill-efficiency auditing so deterministic extraction and anti-gaming regressions are detected automatically instead of relying on prose-only guidance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/meta-loop-efficiency` emits artifacts with H4/H5 findings, and downstream deterministic-extraction tooling can ingest those findings into planning/build queues.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/meta-loop-efficiency-h4-h5/fact-find.md`
- Key findings used:
  - H4/H5 are specified but not executed.
  - Latest audit artifact still reports H4/H5 as unscored.
  - Downstream scout and queue tooling currently ingest H1-H3 only.
  - `scripts` has established patterns for deterministic CLI logic plus unit-test coverage.

## Proposed Approach
- Option A: Keep `meta-loop-efficiency` prose-only and manually update artifacts.
- Option B: Add a script-backed audit engine, then wire scout/queue support in the same change.
- Chosen approach: Option B. H5 requires deterministic previous-state comparison and repeatable tests, so prose-only guidance would preserve the core failure mode.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Ship script-backed H4/H5 audit and downstream ingestion | 84% | M | Complete (2026-03-09) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded implementation wave |

## Tasks

### TASK-01: Ship script-backed H4/H5 audit and downstream ingestion
- **Type:** IMPLEMENT
- **Deliverable:** Executable audit logic for `/meta-loop-efficiency`, updated skill contract, and downstream H4/H5 scout/queue support.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/package.json`, `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts` (create), `scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` (create), `.claude/skills/meta-loop-efficiency/SKILL.md`, `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs`, `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs`, `docs/plans/meta-loop-efficiency-h4-h5/fact-find.md`, `docs/plans/meta-loop-efficiency-h4-h5/plan.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 88% - bounded file set, established `scripts` patterns, no product ambiguity.
  - Approach: 86% - previous-artifact `git_sha` provides a deterministic H5 baseline path without inventing new storage.
  - Impact: 84% - directly closes a queued P1 gap and prevents audit gaming from going unreported.
- **Acceptance:**
  - Audit engine emits List 3 with H4/H5 findings and summary counts.
  - H5 compares current metrics against previous-audit git snapshots rather than ad hoc manual baselines.
  - Scout ingestion recognizes H4/H5 findings from the audit output.
  - Queue builder produces useful execution notes for H4/H5 scout rows.
  - `meta-loop-efficiency` documentation points to the executable path without contradicting the artifact contract.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` -> passes.
  - TC-02: `pnpm exec eslint scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` -> passes.
  - TC-03: `pnpm --filter scripts exec tsx src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts --dry-run` -> prints an audit report containing `List 3 — Deterministic extraction and anti-gaming`.
  - TC-04: `node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs --dry-run` -> reports scout opportunities without parse errors after List 3 support is added.
  - TC-05: CI-only: new Jest coverage exists for the audit engine; not executed locally per repo policy.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: direct reads of current skill contract, latest audit artifact, downstream scout parser, `scripts` CLI/test reference files.
  - Validation artifacts: `docs/plans/meta-loop-efficiency-h4-h5/fact-find.md`
  - Unexpected findings: original `meta-loop-efficiency` plan intentionally avoided scripts, so this change must update that architectural assumption explicitly.
- **Scouts:** None: current repo evidence is sufficient.
- **Edge Cases & Hardening:** Handle missing previous artifacts, missing historical paths at previous `git_sha`, and non-evaluable H5 rows without crashing the audit.
- **What would make this >=90%:**
  - Dry-run audit and dry-run scout both succeed on first pass with no artifact-format iteration.
- **Rollout / rollback:**
  - Rollout: commit the new audit engine and supporting updates; future audits use the executable path.
  - Rollback: revert the task commit; previous prose-only behavior remains.
- **Documentation impact:**
  - Update the skill doc to reflect the executable audit path and List 3 propagation.
- **Notes / references:**
  - `.claude/skills/meta-loop-efficiency/SKILL.md`
  - `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`
- **Build evidence (2026-03-09):**
  - Added `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts` and exposed it via `scripts/package.json` so `/meta-loop-efficiency` now has an executable audit path for H0-H5.
  - Added `scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` covering H4/H5 detection and the missing-previous-artifact path. Jest remains CI-only by repo policy.
  - Updated `.claude/skills/meta-loop-efficiency/SKILL.md` so the documented contract points to the script-backed audit path and recognizes List 3 in the new/regression gate.
  - Extended `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs` to parse List 3, score H4/H5 rows, and accept `critical` tier findings.
  - Extended `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs` with execution guidance for H4/H5 scout rows.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit` -> pass
    - `pnpm exec eslint scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` -> pass with 6 pre-existing `security/detect-possible-timing-attacks` warnings on CLI flag comparisons, 0 errors
    - `pnpm --filter scripts startup-loop:meta-loop-efficiency-audit -- --dry-run` -> pass; emitted `List 3 — Deterministic extraction and anti-gaming` with `h4_count: 11` and `h5_count: 9`
    - `node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs --audit /tmp/meta-loop-efficiency-validation/skill-efficiency-audit-2099-01-01-0000.md --dry-run` -> pass; `auto-scout new opportunities: 1`

## Risks & Mitigations
- Prior snapshot lookup may fail for renamed or missing skill files: emit per-skill note and skip H5 rather than failing the audit.
- New artifact format could drift from scout expectations: update parser in the same task and validate with dry-run.

## Observability
- Logging: dry-run CLI output and explicit notes for non-evaluable H5 cases.
- Metrics: summary counts for H1-H5 in the audit artifact.
- Alerts/Dashboards: None; audit artifact itself is the reporting surface.

## Acceptance Criteria (overall)
- [x] H4/H5 are computed by executable code rather than remaining prose-only.
- [x] Audit output includes List 3 and matching summary counts.
- [x] Deterministic-extraction scout tooling accepts H4/H5 findings without parse failures.

## Decision Log
- 2026-03-09: Chose script-backed implementation over prose-only update because H5 requires deterministic snapshot comparison and repeatable validation.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
