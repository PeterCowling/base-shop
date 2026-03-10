---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-cmd-advance-split
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-factcheck
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup-Loop `cmd-advance` Split Plan

## Summary
Split the monolithic startup-loop advance module into stage-family submodules while preserving `.claude/skills/startup-loop/modules/cmd-advance.md` as the stable command entrypoint. The implementation is intentionally structural: reduce edit blast radius and improve maintainability without changing gate semantics, stage ordering, or startup-loop routing. Direct readers currently couple to the entrypoint path and specific strings, so the plan keeps anchor text in the entrypoint and moves detailed instructions into subordinate files.

## Active tasks
- [x] TASK-01: Modularize `cmd-advance` into stage-family submodules with stable entrypoint compatibility

## Goals
- Reduce `cmd-advance.md` to a thin orchestrator/entrypoint.
- Move detailed gate/dispatch instructions into focused submodules.
- Preserve existing SELL-01 working-tree edits.
- Keep startup-loop routing, shell contract checks, and direct entrypoint readers coherent.

## Non-goals
- Change any startup-loop gate semantics.
- Rename or relocate the top-level `cmd-advance.md` path.
- Resolve all prose/code duplication in SELL gating.
- Execute or modify CI test policy.

## Constraints & Assumptions
- Constraints:
  - `.claude/skills/startup-loop/modules/cmd-advance.md` must remain the command module loaded by `.claude/skills/startup-loop/SKILL.md`.
  - Current tests and shell checks read the stable path directly.
  - Local Jest execution is not allowed by repo policy.
- Assumptions:
  - A concise entrypoint with explicit submodule loads is acceptable to the startup-loop skill runtime.
  - Preserving key anchor strings in the entrypoint avoids unnecessary downstream churn.

## Inherited Outcome Contract
- **Why:** A single 532-line module in the startup-loop command path concentrates complexity and raises edit risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Split `cmd-advance.md` into focused modules with unchanged external behavior and clearer maintenance boundaries.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-cmd-advance-split/fact-find.md`
- Key findings used:
  - `cmd-advance.md` is 535 lines and the only startup-loop module-monolith currently flagged by the audit.
  - `startup-loop/SKILL.md`, direct tests, and shell checks all couple to the stable `cmd-advance.md` path.
  - `cmd-advance.md` already decomposes naturally into ASSESSMENT, MARKET/PRODUCT/WEBSITE, SIGNALS, SELL, gap-fill, and closing contract sections.
  - Existing working-tree edits in the SELL-01 dispatch block are isolated and must be preserved.

## Proposed Approach
- Option A: Keep `cmd-advance.md` as the public entrypoint and move detailed stage-family content into a new `modules/cmd-advance/` directory. Preserve critical anchor strings in the entrypoint.
- Option B: Rename `cmd-advance.md` into a folder-level index and update all direct readers/tests/contracts at once.
- Chosen approach: Option A. It delivers the intended maintenance boundary with the lowest breakage risk.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Modularize `cmd-advance` into stage-family submodules with stable entrypoint compatibility | 84% | M | Complete (2026-03-09) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded change surface; no parallel split needed |

## Tasks

### TASK-01: Modularize `cmd-advance` into stage-family submodules with stable entrypoint compatibility
- **Type:** IMPLEMENT
- **Deliverable:** Thin `.claude/skills/startup-loop/modules/cmd-advance.md` entrypoint plus new stage-family module files under `.claude/skills/startup-loop/modules/cmd-advance/`, with discoverability updates in startup-loop docs as needed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build evidence:**
  - TC-01: `wc -l .claude/skills/startup-loop/modules/cmd-advance.md .claude/skills/startup-loop/modules/cmd-advance/*.md` -> entrypoint reduced to 79 lines; six focused submodules created.
  - TC-02: `find .claude/skills/startup-loop/modules/cmd-advance -maxdepth 1 -type f | sort` -> `advance-contract.md`, `assessment-gates.md`, `gap-fill-gates.md`, `market-product-website-gates.md`, `sell-gates.md`, `signals-gates.md`.
  - TC-03: `rg -n "/lp-weekly|Phase 0 fallback|GATE-BD-08|weekly-kpcs|GATE-WEBSITE-DO-01|website-first-build-backlog|docs/plans/<biz>-website-v1-first-build/plan.md|docs/plans/<biz>-website-v1-first-build/fact-find.md" .claude/skills/startup-loop/modules/cmd-advance.md` -> required anchor strings preserved in the stable entrypoint.
  - TC-04: `bash scripts/check-startup-loop-contracts.sh` -> fails, but on unrelated pre-existing startup-loop integrity issues (`ASSESSMENT-13/14/15` missing in dictionary/map; stale `idea-develop` skill reference). No split-specific failures surfaced.
  - TC-05: working-tree SELL-01 additions remain present in `.claude/skills/startup-loop/modules/cmd-advance/sell-gates.md`.
- **Affects:** `.claude/skills/startup-loop/modules/cmd-advance.md`, `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-status.md`, `.claude/skills/startup-loop/modules/cmd-advance/*.md` (create), `[readonly] scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`, `[readonly] scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`, `[readonly] scripts/check-startup-loop-contracts.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 88% - natural section seams are already present and the change is markdown-only.
  - Approach: 86% - preserving the stable entrypoint path avoids the main breakage risk.
  - Impact: 78% - this reduces edit risk but does not remove existing prose/code duplication in SELL gating.
- **Acceptance:**
  - `cmd-advance.md` is reduced to a thin entrypoint/orchestrator.
  - New stage-family submodules exist and contain the relocated detailed gate/dispatch instructions.
  - The current SELL-01 additions remain present after the split.
  - The stable `cmd-advance.md` path still contains the key anchor strings direct readers currently rely on.
  - Startup-loop internal-module discoverability is updated so future edits have obvious entry points.
- **Validation contract (TC-XX):**
  - TC-01: `wc -l .claude/skills/startup-loop/modules/cmd-advance.md` -> significantly reduced from 535 lines and below 220 lines.
  - TC-02: `find .claude/skills/startup-loop/modules/cmd-advance -maxdepth 1 -type f | sort` -> expected stage-family module files exist.
  - TC-03: `rg -n "/lp-weekly|Phase 0 fallback|GATE-BD-08|weekly-kpcs|GATE-WEBSITE-DO-01|website-first-build-backlog|docs/plans/<biz>-website-v1-first-build/plan.md" .claude/skills/startup-loop/modules/cmd-advance.md` -> required anchor strings still present in the entrypoint.
  - TC-04: `bash scripts/check-startup-loop-contracts.sh` -> passes.
  - TC-05: `git diff -- .claude/skills/startup-loop/modules/cmd-advance.md` -> preserved SELL-01 additions remain visible in the modularized result.
- **Execution plan:** Red -> confirm current monolith sections and working-tree diff; Green -> create stage-family modules and thin entrypoint while preserving anchor strings; Refactor -> align startup-loop discoverability text and run targeted validation.
- **Planning validation (required for M/L):**
  - Checks run: `git diff` on target file, `rg` on direct readers, `git log` on recent startup-loop changes, section boundary mapping of current `cmd-advance.md`.
  - Validation artifacts: `docs/plans/startup-loop-cmd-advance-split/fact-find.md`
  - Unexpected findings: direct tests rely on strings in the entrypoint file, so a pure relocation is unsafe.
- **Scouts:** None: scope is already bounded and the direct readers have been enumerated.
- **Edge Cases & Hardening:** Preserve all current gate IDs and command examples verbatim inside either the entrypoint summary or the relocated module; do not collapse the SELL-01 additions added in the working tree.
- **What would make this >=90%:**
  - A green run of `scripts/check-startup-loop-contracts.sh` after the split and confirmation that entrypoint anchor strings remained intact.
- **Rollout / rollback:**
  - Rollout: immediate on next `/startup-loop advance` usage.
  - Rollback: revert the markdown module split in one commit.
- **Documentation impact:**
  - Update this plan with build evidence after implementation.
  - Persist the new submodule layout as startup-loop internal-module discoverability in `startup-loop/SKILL.md`.
- **Notes / references:**
  - Reference: `docs/briefs/startup-loop-cmd-advance-split-briefing.md`
  - Reference: `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`

## Risks & Mitigations
- Direct reader breakage:
  - Mitigation: keep stable entrypoint path and anchor strings.
- Working-tree conflict on `cmd-advance.md`:
  - Mitigation: build on top of current file content and preserve the SELL-01 diff.
- Cosmetic-only refactor:
  - Mitigation: explicitly document deterministic SELL extraction as outside scope rather than silently claiming complexity is solved.

## Observability
- Logging:
  - None: markdown/module refactor only.
- Metrics:
  - Entry-point line count reduction and submodule presence.
- Alerts/Dashboards:
  - None.

## Acceptance Criteria (overall)
- [ ] `cmd-advance.md` is a stable thin entrypoint with explicit module loading guidance.
- [ ] Detailed advance-time instructions live in focused subordinate modules.
- [ ] Startup-loop discoverability text reflects the new internal structure.
- [ ] Targeted non-test validation passes.

## Decision Log
- 2026-03-09: Preserve `.claude/skills/startup-loop/modules/cmd-advance.md` as the stable entrypoint and split by stage family underneath it.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
