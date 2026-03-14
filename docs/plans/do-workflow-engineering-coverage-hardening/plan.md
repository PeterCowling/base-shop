---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-engineering-coverage-hardening
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-engineering-coverage-hardening/analysis.md
---

# DO Workflow Engineering Coverage Hardening Plan

## Summary
Introduce one shared engineering coverage contract and one deterministic validator, then wire both through the `lp-do-ideas -> lp-do-build` workflow and canonical templates. This reduces repeated workflow prose while making code/mixed coverage expectations explicit across fact-find, analysis, plan, build, and critique.

## Active tasks
- [x] TASK-01: Add shared engineering coverage contract and template support
- [x] TASK-02: Add deterministic engineering coverage validator and align fact-find validation
- [x] TASK-03: Wire coverage contract and validator through workflow skills

## Goals
- Centralize engineering coverage doctrine in one shared contract.
- Enforce coverage deterministically for code/mixed artifacts.
- Reinforce observability, reliability, and rollout coverage alongside UI/UX/security/testing.

## Non-goals
- Instrument prompt/token telemetry.
- Change live queue persistence formats.

## Constraints & Assumptions
- Constraints:
  - `lp-do-ideas` must stay thin.
  - deterministic code must live in `packages/skill-runner`.
- Assumptions:
  - future real DO runs will populate the new coverage sections from templates.

## Inherited Outcome Contract
- **Why:** The DO workflow still spends tokens on repeated fixed rules and does not consistently force code-bearing work to cover UX, security, observability, testing, contracts, reliability, and rollout concerns end to end.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce one shared engineering coverage contract plus deterministic validation, and wire it through the `lp-do-ideas -> lp-do-build` workflow.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-engineering-coverage-hardening/analysis.md`
- Selected approach inherited:
  - shared contract + validator + workflow/template wiring
- Key reasoning used:
  - the shared contract removes duplicated prose
  - the validator makes omissions explicit

## Selected Approach Summary
- What was chosen:
  - add one shared engineering coverage matrix contract and one deterministic validator
  - use lightweight coverage hints in ideas, then hard enforcement from fact-find onward
- Why planning is not reopening option selection:
  - analysis already ruled out docs-only and validator-only alternatives

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md`
- Evidence carried forward:
  - existing `skill-runner` package
  - current workflow/template gaps
  - stale post-analysis fact-find validator wording

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add shared engineering coverage contract and template updates | 90% | M | Complete (2026-03-11) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add deterministic coverage validator and align stale fact-find validation | 88% | M | Complete (2026-03-11) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Wire contract and validator through DO workflow skills/docs | 84% | L | Complete (2026-03-11) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Keep existing UI rigor but move it into the shared matrix | TASK-01, TASK-03 | still explicit in plan/build |
| UX / states | Add to shared matrix and workflow artifacts | TASK-01, TASK-03 | no longer plan-only |
| Security / privacy | Add to shared matrix and critique/analysis/planning expectations | TASK-01, TASK-03 | normalized across stages |
| Logging / observability / audit | Add as explicit matrix row plus validator-backed artifact presence | TASK-01, TASK-02, TASK-03 | closes current blind spot |
| Testing / validation | Carry through templates, skills, and build evidence | TASK-01, TASK-03 | complements existing TC/VC contracts |
| Data / contracts | Preserve and normalize | TASK-01, TASK-03 | aligned with consumer tracing |
| Performance / reliability | Promote from fact-find note to shared row | TASK-01, TASK-03 | now visible in analysis/plan/build |
| Rollout / rollback | Keep as task field and add workflow-wide row | TASK-01, TASK-03 | stronger than tail-note only |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | shared contract/templates and validator can be built in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 | skill/docs wiring depends on stable contract + validator |

## Tasks

### TASK-01: Add shared engineering coverage contract and template updates
- **Type:** IMPLEMENT
- **Deliverable:** shared contract doc plus updated DO templates and loop output contract
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `.claude/skills/_shared/engineering-coverage-matrix.md`, `docs/plans/_templates/fact-find-planning.md`, `docs/plans/_templates/analysis.md`, `docs/plans/_templates/plan.md`, `docs/plans/_templates/task-implement-code.md`, `docs/plans/_templates/build-record.user.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/agents/feature-workflow-guide.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 92% - bounded docs/template work
  - Approach: 94% - single shared contract is the cleanest source of truth
  - Impact: 90% - affects all future DO artifacts
- **Acceptance:**
  - shared engineering coverage contract exists
  - canonical templates carry engineering coverage sections/blocks
  - loop output contract documents the new artifact sections
- **Engineering Coverage:**
  - UI / visual: Required - shared matrix must keep UI explicit without making it the only first-class concern
  - UX / states: Required - templates must capture flow-state coverage
  - Security / privacy: Required - templates must force explicit treatment
  - Logging / observability / audit: Required - templates must add this missing row
  - Testing / validation: Required - templates must tie coverage to validation
  - Data / contracts: Required - templates must keep contract handling explicit
  - Performance / reliability: Required - templates must carry this early
  - Rollout / rollback: Required - templates must keep this first-class
- **Validation contract (TC-XX):**
  - TC-01: shared contract file exists and lists all canonical rows -> pass
  - TC-02: templates include engineering coverage sections/blocks -> pass
  - TC-03: loop output contract documents engineering coverage sections -> pass
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: template and contract inspection
  - Validation artifacts: shared row labels agreed before edits
  - Unexpected findings: build-record lacked `Execution-Track`, which needed alignment
- **Scouts:** None: repo-local workflow change
- **Edge Cases & Hardening:** preserve business-artifact paths by allowing omit/`None: reason`
- **What would make this >=90%:**
  - already met
- **Rollout / rollback:**
  - Rollout: next generated DO artifact uses the new sections
  - Rollback: revert the shared contract and template/contract doc changes
- **Documentation impact:**
  - feature workflow guide updated
  - loop output contract updated
- **Notes / references:**
  - relies on canonical row labels staying verbatim across artifacts

### TASK-02: Add deterministic engineering coverage validator and align stale fact-find validation
- **Type:** IMPLEMENT
- **Deliverable:** `skill-runner` validator, CLI, shell wrapper, and fact-find validator alignment fix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `packages/skill-runner/src/validate-engineering-coverage.ts`, `packages/skill-runner/src/cli/validate-engineering-coverage.ts`, `packages/skill-runner/src/index.ts`, `packages/skill-runner/src/validate-fact-find.ts`, `scripts/validate-engineering-coverage.sh`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 90% - deterministic markdown validation using existing parser helpers
  - Approach: 89% - runner-backed validation is consistent with existing extracted gates
  - Impact: 88% - executable contract replaces prose-only expectations
- **Acceptance:**
  - validator reports missing engineering coverage sections/rows
  - plan validation covers task-level engineering coverage blocks
  - fact-find validator matches `Ready-for-analysis`
- **Engineering Coverage:**
  - UI / visual: Required - validator must recognize UI row presence
  - UX / states: Required - validator must recognize row presence
  - Security / privacy: Required - validator must recognize row presence
  - Logging / observability / audit: Required - validator must recognize row presence
  - Testing / validation: Required - validator must recognize row presence
  - Data / contracts: Required - validator must recognize row presence
  - Performance / reliability: Required - validator must recognize row presence
  - Rollout / rollback: Required - validator must recognize row presence
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @acme/skill-runner typecheck` -> pass
  - TC-02: `pnpm --filter @acme/skill-runner lint` -> pass
  - TC-03: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/plan.md` -> pass
  - TC-04: `scripts/validate-fact-find.sh docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md docs/plans/do-workflow-engineering-coverage-hardening/critique-history.md` -> pass
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: existing parser/validator inspection
  - Validation artifacts: reusable `parseFrontmatter`, `extractSection`, `parseTaskBlocks`
  - Unexpected findings: fact-find validator still referenced the pre-analysis readiness terminology
- **Scouts:** None: bounded runner extension
- **Edge Cases & Hardening:** skip non-code-bearing artifacts cleanly
- **What would make this >=90%:**
  - add dedicated validator tests
- **Rollout / rollback:**
  - Rollout: workflow skills can call the validator immediately
  - Rollback: revert validator and wrapper
- **Documentation impact:**
  - none beyond skill/template wiring
- **Notes / references:**
  - validator deliberately checks canonical row presence, not deeper semantic quality

### TASK-03: Wire contract and validator through DO workflow skills
- **Type:** IMPLEMENT
- **Deliverable:** updated DO skills, critique lenses, and ideas intake guidance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-11)
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`, `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-fact-find/modules/outcome-a-code.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-analysis/modules/analyze-code.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-plan/modules/plan-code.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-build/modules/build-code.md`, `.claude/skills/lp-do-build/modules/build-validate.md`, `.claude/skills/lp-do-critique/modules/fact-find-lens.md`, `.claude/skills/lp-do-critique/modules/analysis-lens.md`, `.claude/skills/lp-do-critique/modules/plan-lens.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 86% - large but bounded docs wiring
  - Approach: 88% - references point to one shared contract and one validator
  - Impact: 84% - touches the full DO workflow
- **Acceptance:**
  - skills reference the shared engineering coverage contract rather than duplicating row lists
  - relevant stages call out deterministic validator usage
  - critique lenses inspect engineering coverage for code/mixed artifacts
- **Engineering Coverage:**
  - UI / visual: Required - preserve existing frontend QA emphasis within the shared frame
  - UX / states: Required - surfaced from ideas/fact-find onward
  - Security / privacy: Required - carried through critique and planning/build gates
  - Logging / observability / audit: Required - elevated to first-class workflow concern
  - Testing / validation: Required - tied to validator/build evidence
  - Data / contracts: Required - normalized with existing consumer tracing
  - Performance / reliability: Required - explicitly carried into build validation and analysis comparison
  - Rollout / rollback: Required - preserved as both task and workflow-level concern
- **Validation contract (TC-XX):**
  - TC-01: skills/templates/critique lenses reference `.claude/skills/_shared/engineering-coverage-matrix.md` where applicable -> pass
  - TC-02: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md` -> pass
  - TC-03: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/analysis.md` -> pass
  - TC-04: `scripts/validate-plan.sh docs/plans/do-workflow-engineering-coverage-hardening/plan.md` -> pass
  - TC-05: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-engineering-coverage-hardening/plan.md` -> pass
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: hot-path skill inspection and template/contract reads
  - Validation artifacts: identified all code-bearing workflow stages and critique modules needing updates
  - Unexpected findings: delivery rehearsal wording in `lp-do-plan` needed adjustment after shifting from four fixed lenses to the shared matrix for code/mixed work
- **Scouts:** None: contract-driven workflow hardening
- **Edge Cases & Hardening:** keep business-artifact flow lighter by allowing applicable-lens rehearsal instead of forcing the full matrix
- **What would make this >=90%:**
  - run the next real DO cycle through the new templates
- **Rollout / rollback:**
  - Rollout: immediate on next skill invocation
  - Rollback: revert the workflow docs
- **Documentation impact:**
  - DO workflow docs and critique lenses updated
- **Notes / references:**
  - ideas stage intentionally remains hint-level to avoid schema churn

## Risks & Mitigations
- Shared matrix becomes check-the-box boilerplate
  - Mitigation: allow `N/A` only with reasons and validate row presence, not canned prose
- Validator overreaches on business-artifact work
  - Mitigation: skip non-code-bearing tracks
- Future workflow drift breaks the validator
  - Mitigation: shared labels live in one contract and the validator is intentionally simple

## Observability
- Logging:
  - workflow coverage now explicitly includes logging/observability/audit as a canonical row
- Metrics:
  - no new prompt telemetry in this cycle
- Alerts/Dashboards:
  - none; this is workflow/process hardening

## Acceptance Criteria (overall)
- [x] Shared engineering coverage contract added
- [x] Deterministic validator added and exposed via shell wrapper
- [x] Fact-find validator aligned with post-analysis workflow
- [x] DO skills/templates/critique lenses wired to the shared contract
- [x] Artifacts in this plan pass the new deterministic validator

## Decision Log
- 2026-03-11: Chosen shared-contract-plus-validator approach over docs-only and validator-only alternatives.
- 2026-03-11: Kept `lp-do-ideas` lightweight via `coverage-hint:` evidence refs rather than queue schema changes.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
