---
Type: Plan
Status: Complete
Domain: Skills / Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: core-triad-size-budget-guardrails
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: meta-loop-efficiency
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Core Triad Size Budget Guardrails Plan

## Summary
This plan implements commit-time size-budget enforcement for the three core workflow orchestrators: `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`. The build does not try to shrink the skills to the `meta-loop-efficiency` 200-line target in the same change because the triad is already over that threshold. Instead, it formalizes shared size-metric collection, adds a checked-in manifest with explicit target/allowed limits and waiver metadata, wires a validator into the normal local gate, and adds CI-runnable tests so future growth fails deterministically. After the validator is in place and verified, the queued idea dispatch can be marked complete because its intended outcome is operational guardrails, not immediate refactoring of the triad shells.

## Active tasks
- [x] TASK-01: Stabilize shared triad size-budget measurement and source-of-truth data
- [x] TASK-02: Land manifest-backed validator and `validate-changes.sh` enforcement
- [x] TASK-03: Verify behavior, update plan evidence, and reconcile the queued dispatch

## Goals
- Reuse one shared line-counting/skill-metric implementation across audit and enforcement paths.
- Add explicit budget metadata for the triad with no-growth enforcement and non-silent waivers.
- Fail closed in the default validation path when the triad exceeds allowed limits or the waiver contract is broken.
- Add automated coverage for validator behavior.

## Non-goals
- Reduce triad orchestrators to `<=200` lines in this build.
- Expand the guardrail to all skills.
- Replace or redesign the weekly `meta-loop-efficiency` artifact format.

## Constraints & Assumptions
- Constraints:
  - Local Jest execution is blocked by repo policy; test coverage must be CI-runnable only.
  - `scripts/validate-changes.sh` is the required local validation gate and must remain usable in a dirty tree.
  - The current workspace already contains untracked `meta-loop-efficiency` audit code that this build must normalize rather than ignore.
- Assumptions:
  - A checked-in waiver/baseline manifest is acceptable when it prevents further growth and encodes an exit path.
  - Aligning validator and audit counts is more important than keeping all logic inside one existing file.

## Inherited Outcome Contract
- **Why:** The triad that every build cycle depends on has already regressed significantly; without guardrails it will drift back into monolith state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Define and implement enforceable size-budget checks and exception policy for `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/core-triad-size-budget-guardrails/fact-find.md`
- Key findings used:
  - A direct `<=200` hard cap would fail immediately because current sizes are 247, 332, and 345 lines.
  - The weekly audit already defines the threshold but does not block regressions.
  - `scripts/validate-changes.sh` is the right commit-time enforcement surface.
  - Reusable size-metric logic already exists in the workspace audit engine but is not yet stabilized in git.

## Proposed Approach
- Option A: Add a small standalone shell line-counter inside `validate-changes.sh`.
  - Rejected: fastest to write, but duplicates threshold logic and would drift away from the audit path.
- Option B: Reuse and stabilize shared TypeScript size-metric logic, add a triad budget manifest, and expose a dedicated validator command wired into `validate-changes.sh`.
  - Chosen approach: this is the only fail-closed solution that preserves one source of truth while allowing temporary over-budget waivers with explicit metadata.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Stabilize shared size-metric code and triad budget manifest | 82% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add validator CLI, wire `validate-changes.sh`, and harden failure messages | 84% | M | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add CI-runnable tests, run targeted validation, and reconcile queue completion | 81% | S | Complete (2026-03-09) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Shared metric/data source must exist before validator wiring. |
| 2 | TASK-02 | TASK-01 | Validator depends on shared metrics and manifest shape. |
| 3 | TASK-03 | TASK-02 | Tests and queue completion require final validator paths and evidence. |

## Tasks

### TASK-01: Stabilize shared triad size-budget measurement and source-of-truth data
- **Type:** IMPLEMENT
- **Deliverable:** tracked shared size-metric module(s) and checked-in triad budget manifest under `scripts/src/startup-loop/diagnostics/` (or equivalent shared scripts path)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts`, `scripts/src/startup-loop/diagnostics/*.ts`, `scripts/src/startup-loop/__tests__/*.test.ts`, `scripts/package.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 82%
  - Implementation: 82% - the workspace already contains the audit logic; work is mostly extraction/normalization.
  - Approach: 88% - sharing one metric collector across audit and validation is the least risky architecture.
  - Impact: 84% - this removes the main logic-duplication failure mode before enforcement lands.
- **Acceptance:**
  - Shared size-metric collection exists in tracked code and can report the triad `SKILL.md` line counts deterministically.
  - A checked-in manifest exists for `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build` with target/allowed budget data plus waiver metadata.
  - `meta-loop-efficiency-audit.ts` uses the shared collector instead of private duplicated counting logic.
- **Validation contract (TC-01):**
  - TC-01: shared collector returns the current triad counts and H1 state consistently for all three skills.
  - TC-02: manifest load fails cleanly on missing/invalid triad entries.
- **Execution plan:** Red -> identify duplicated logic and implicit budget data; Green -> extract shared collector + manifest; Refactor -> update audit engine to consume shared code.
- **Planning validation (required for M/L):**
  - Checks run: audit-engine structure inspection, package entrypoint inspection, fact-find evidence review
  - Validation artifacts: `docs/plans/core-triad-size-budget-guardrails/fact-find.md`
  - Unexpected findings: current audit engine/test harness are untracked workspace files and must be normalized
- **Scouts:** None: the fact-find already identified the relevant files and contracts.
- **Edge Cases & Hardening:** ensure shared collector only counts the intended `SKILL.md` budget surface and does not accidentally switch to total markdown footprint for the validator.
- **What would make this >=90%:**
  - confirm the extracted collector can support both changed-skill and full-repo scan modes without additional refactor
- **Rollout / rollback:**
  - Rollout: shared metric module becomes available to both audit and validator paths
  - Rollback: revert the extracted module and audit wiring together
- **Documentation impact:**
  - plan/build artifacts only unless manifest usage requires a validator note
- **Notes / references:**
  - `docs/plans/core-triad-size-budget-guardrails/fact-find.md`
- **Build evidence:**
  - Added shared collector [`skill-size-metrics.ts`](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/skill-size-metrics.ts) and triad manifest [`core-triad-skill-budgets.json`](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/core-triad-skill-budgets.json).
  - Rewired [`meta-loop-efficiency-audit.ts`](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts) to consume the shared metric collector and default threshold constant.

### TASK-02: Land manifest-backed validator and `validate-changes.sh` enforcement
- **Type:** IMPLEMENT
- **Deliverable:** validator CLI plus `scripts/validate-changes.sh` integration and failure-contract-compliant output
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/package.json`, `scripts/validate-changes.sh`, `scripts/src/startup-loop/diagnostics/*.ts`, `[readonly] AGENTS.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 84%
  - Implementation: 84% - validator shape is clear once shared metrics and manifest exist.
  - Approach: 90% - a dedicated CLI + gate wiring is consistent with existing repo validation patterns.
  - Impact: 88% - this is the task that actually prevents future triad growth.
- **Acceptance:**
  - A direct validator command exists in `scripts/package.json`.
  - `scripts/validate-changes.sh` runs the validator for relevant triad changes and fails closed on budget breaches.
  - Validator output satisfies the failure-message contract: failure reason, retry posture, exact next step, anti-retry list, escalation condition.
  - Over-target-but-waived files do not fail unless they exceed allowed max or waiver policy is broken.
- **Validation contract (TC-02):**
  - TC-01: no-change / within-allowed triad state passes.
  - TC-02: synthetic over-limit state fails with contract-compliant output.
  - TC-03: missing manifest entry or expired waiver fails with contract-compliant output.
- **Execution plan:** Red -> encode failing scenarios in test fixtures/logic; Green -> implement validator; Refactor -> wire changed-file scoping into validation gate and simplify shared helpers.
- **Planning validation (required for M/L):**
  - Checks run: validator/gate surface map from fact-find
  - Validation artifacts: `scripts/validate-changes.sh`, `AGENTS.md` failure-message contract section
  - Unexpected findings: none beyond the need to keep changed-file scoping sane in a dirty tree
- **Scouts:** None: enforcement surface is already confirmed.
- **Edge Cases & Hardening:** dirty working tree, validator full-scan mode, unchanged triad files during unrelated validations, malformed manifest data.
- **What would make this >=90%:**
  - verify the validator can accept an explicit file list so `validate-changes.sh` stays simple and deterministic
- **Rollout / rollback:**
  - Rollout: validator is active on next local validation run
  - Rollback: revert CLI + gate wiring together
- **Documentation impact:**
  - likely none beyond build evidence if failure messages are self-describing
- **Notes / references:**
  - `AGENTS.md`
  - `scripts/validate-changes.sh`
- **Build evidence:**
  - Added validator CLI [`core-triad-size-budget-validator.ts`](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/core-triad-size-budget-validator.ts) and package entrypoint in [`scripts/package.json`](/Users/petercowling/base-shop/scripts/package.json).
  - Wired the validator into [`scripts/validate-changes.sh`](/Users/petercowling/base-shop/scripts/validate-changes.sh) for relevant triad/validator path changes.
  - Validator now passes when the triad is within explicit `allowed_lines` caps and emits warnings because all three skills remain above the 200-line target under active waivers.

### TASK-03: Add CI-runnable tests, run targeted validation, and reconcile the queued dispatch
- **Type:** IMPLEMENT
- **Deliverable:** automated tests for validator behavior, targeted local validation evidence, and queue-state completion metadata for dispatch `IDEA-DISPATCH-20260304122500-0002`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/__tests__/*.test.ts`, `docs/plans/core-triad-size-budget-guardrails/plan.md`, `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 81%
  - Implementation: 81% - queue reconciliation is straightforward, but the shared queue file already has unrelated edits.
  - Approach: 86% - targeted validation plus deterministic queue update matches repo practice.
  - Impact: 82% - closes the loop operationally once the validator is live.
- **Acceptance:**
  - Tests cover pass, over-limit fail, missing-entry fail, and waiver/allowed-limit behavior.
  - Targeted validation for the affected scripts surfaces is recorded in the plan.
  - The idea dispatch is marked `completed` with the plan path and concise outcome.
- **Validation contract (TC-03):**
  - TC-01: scripts package targeted typecheck/lint (or repo-native equivalent validation for affected files) passes.
  - TC-02: validator-focused automated tests are present and CI-runnable.
  - TC-03: queue-state entry for the dispatch moves to `completed` and points at this plan.
- **Execution plan:** Red -> add failing test expectations for validator scenarios; Green -> make them pass; Refactor -> reconcile queue state and update plan evidence.
- **Planning validation (required for M/L):**
  - Checks run: queue completion helper inspection, build completion contract review
  - Validation artifacts: `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
  - Unexpected findings: queue-state is already dirty, so update must be narrowly targeted and preserve unrelated changes
- **Scouts:** None: task is a bounded verification/closure task.
- **Edge Cases & Hardening:** preserve unrelated queue-state modifications; avoid direct manual JSON surgery if helper function can do the mutation safely.
- **What would make this >=90%:**
  - a dedicated CLI wrapper for queue completion so the update is one command instead of an inline node invocation
- **Rollout / rollback:**
  - Rollout: tests and queue completion become part of the final change set
  - Rollback: revert tests and queue-state update with the implementation if needed
- **Documentation impact:**
  - plan evidence updates only
- **Notes / references:**
  - `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- **Build evidence:**
  - Added validator coverage in [`core-triad-size-budget-validator.test.ts`](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/core-triad-size-budget-validator.test.ts) for waiver-pass, over-limit fail, expired-waiver fail, and missing-entry fail cases.
  - Targeted validation completed:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - `pnpm exec eslint scripts/src/startup-loop/diagnostics/skill-size-metrics.ts scripts/src/startup-loop/diagnostics/core-triad-size-budget-validator.ts scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts scripts/src/startup-loop/__tests__/core-triad-size-budget-validator.test.ts scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts --no-warn-ignored`
    - `pnpm --filter scripts startup-loop:validate-core-triad-size-budgets`
    - `pnpm --filter scripts startup-loop:meta-loop-efficiency-audit -- --dry-run`
  - Queue reconciliation is completed after build evidence capture; see queue-state update in final artifact set.

## Risks & Mitigations
- Existing untracked audit-engine files may reflect in-progress work.
  - Mitigation: normalize that state explicitly in TASK-01 instead of building around assumptions.
- Waiver policy could become permanent debt.
  - Mitigation: require explicit waiver metadata in the manifest and keep the 200-line target visible.
- Queue-state update could trample unrelated work.
  - Mitigation: use the existing queue completion helper and keep the mutation limited to the matching dispatch.

## Observability
- Logging:
  - validator CLI emits explicit pass/fail results for triad budget checks
- Metrics:
  - triad line counts are read from the shared collector and can be compared against audit output
- Alerts/Dashboards:
  - None: local validation + CI failures are sufficient for this change

## Acceptance Criteria (overall)
- [x] Shared triad size-metric logic is tracked and reused.
- [x] Triad budget manifest exists with target and temporary allowed limits plus waiver metadata.
- [x] Validator CLI is wired into `scripts/validate-changes.sh`.
- [x] Failure messages satisfy the repo failure-message contract.
- [x] CI-runnable tests cover the new validator behavior.
- [x] Dispatch `IDEA-DISPATCH-20260304122500-0002` is marked complete with this plan as evidence.

## Decision Log
- 2026-03-09: Chose manifest-backed no-growth enforcement over immediate 200-line hard fail because the triad is already above target.
- 2026-03-09: Chose to stabilize shared metric logic before validator wiring to avoid audit/enforcement drift.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: shared metrics + manifest | Yes | [Moderate] Existing audit implementation is untracked workspace state, so normalization is part of the task. | Yes |
| TASK-02: validator + gate wiring | Yes | [Moderate] Failure output must satisfy a stricter contract than current validation helpers typically use. | Yes |
| TASK-03: tests + queue completion | Yes | [Moderate] Shared queue-state file already has unrelated modifications; update must be helper-based and narrow. | Yes |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
- Calculation:
  - TASK-01: 82 * 2 = 164
  - TASK-02: 84 * 2 = 168
  - TASK-03: 81 * 1 = 81
  - Total = 413 / 5 = 82.6% -> 82%
