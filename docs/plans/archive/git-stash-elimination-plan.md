---
Type: Plan
Status: Archived
Domain: Repo/Git
Workstream: Engineering
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: git-stash-elimination
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: ops-ship
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); weighted by Effort (S=1, M=2, L=3)
---

# Git Stash Elimination Plan

## Summary
Eliminate one-way stash behavior for agents by hard-blocking stash mutations (`push`, bare `stash`, `pop`, `apply`, `drop`, `clear`) across the active enforcement stack and aligning tests/docs with that policy. The objective is to remove hidden stash debt while preserving safe read-only stash visibility (`list`, `show`).

## Goals
- Remove agent ability to create new stash debt.
- Close L4/L3/L5 enforcement drift for stash operations.
- Keep policy, enforcement, and regression tests synchronized.

## Non-goals
- Automated cleanup of existing stash entries.
- Changing merge strategy (`dev -> staging -> main` remains PR merge-based).
- Introducing automatic checkpoint commits on `dev` as a universal fallback.

## Constraints & Assumptions
- Constraints:
  - Preserve read-only stash access (`git stash list`, `git stash show`).
  - Do not rely on allow-list edits alone in L4; default-allow requires explicit deny patterns.
  - For dirty-tree shipping, default remains stage-only or explicit user-directed parking strategy.
- Assumptions:
  - Existing orphan stashes require human review and cleanup.

## Fact-Find Reference
- `docs/briefs/git-stash-elimination-briefing.md`
- `docs/briefs/git-conflict-enforcement-balance-lp-fact-find.md`

## Existing System Notes
- `.claude/hooks/pre-tool-use-git-safety.sh` currently default-allows unmatched commands.
- `scripts/agent-bin/git` currently allows `stash push` and bare `stash`.
- `.claude/settings.json` currently allows `stash push`; `stash pop`/`apply` are ask-gated.
- `scripts/__tests__/pre-tool-use-git-safety.test.ts` and `scripts/__tests__/git-safety-policy.test.ts` encode current stash behavior and must be updated.

## Proposed Approach
- Option A: Keep `stash push` and rely on process discipline.
  - Trade-off: retains orphan-stash debt and policy drift risk.
- Option B: Hard-block stash mutations and keep read-only stash ops.
  - Trade-off: narrows one workflow but removes hidden debt and aligns mechanistic safety.
- Chosen: Option B.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Enforce stash mutation denies in L3/L4/L5 | 92% | M | Complete (2026-02-10) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update regression tests to lock policy | 92% | M | Complete (2026-02-10) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Align policy and skill docs to enforced behavior | 88% | M | Complete (2026-02-10) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Enforcement first |
| 2 | TASK-02 | TASK-01 | Tests lock expected behavior |
| 3 | TASK-03 | TASK-02 | Docs reflect enforced reality |

**Max parallelism:** 1 | **Critical path:** 3 waves | **Total tasks:** 3

## Tasks

### TASK-01: Enforce stash mutation denies in L3/L4/L5
- **Type:** IMPLEMENT
- **Deliverable:** Updated hook/guard/permissions behavior for stash commands
- **Execution-Skill:** lp-build
- **Affects:** `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/agent-bin/git`, `.claude/settings.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 92%
  - Implementation: 94% — existing patterns already handle deny-first command classes.
  - Approach: 92% — explicit deny semantics remove one-way stash failure mode.
  - Impact: 92% — blast radius is localized to safety enforcement files.
- **Acceptance:**
  - `git stash push` is denied by hook + guard + settings deny list.
  - Bare `git stash` is denied by hook + guard.
  - `git stash pop` and `git stash apply` are denied by hook (closing known gap) and no longer ask-gated in settings.
  - `git stash list` and `git stash show` remain allowed.
- **Validation contract:**
  - TC-01: `git stash push` -> blocked.
  - TC-02: `git stash` -> blocked.
  - TC-03: `git stash pop` -> blocked by hook + guard.
  - TC-04: `git stash apply` -> blocked by hook + guard.
  - TC-05: `git stash list`/`git stash show` -> allowed.
  - Validation type: targeted Jest policy tests.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Tests run: `pnpm exec jest --config jest.config.cjs --runTestsByPath scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` and `pnpm exec jest --config jest.config.cjs --runTestsByPath scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` (pass).
  - Unexpected findings: None.
- **Rollout / rollback:**
  - Rollout: immediate via existing hooks/guard/settings.
  - Rollback: revert stash-specific hunks in three files.
- **Documentation impact:** TASK-03.

### TASK-02: Update regression tests to lock policy
- **Type:** IMPLEMENT
- **Deliverable:** Updated test expectations and cases for stash policy
- **Execution-Skill:** lp-build
- **Affects:** `scripts/__tests__/pre-tool-use-git-safety.test.ts`, `scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 92%
  - Implementation: 93% — tests are table-driven and already include stash cases.
  - Approach: 92% — codifies new expected behavior and prevents regression.
  - Impact: 92% — only safety-policy test suites affected.
- **Acceptance:**
  - Existing stash-push allow cases converted to deny.
  - Hook-level skip flags removed for pop/apply where gap is closed.
  - Bare stash deny case added.
  - Test suite passes.
- **Validation contract:**
  - TC-06: policy table has deny coverage for push/pop/apply/bare stash.
  - TC-07: policy table retains allow coverage for list/show.
  - Validation type: targeted Jest runs for modified test files.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Tests run: `pnpm exec jest --config jest.config.cjs --runTestsByPath scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` and `pnpm exec jest --config jest.config.cjs --runTestsByPath scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` (pass).
  - Unexpected findings: None.
- **Rollout / rollback:**
  - Rollout: commit updated tests with enforcement changes.
  - Rollback: revert test files and reassess policy decision.
- **Documentation impact:** TASK-03.

### TASK-03: Align policy and skill docs
- **Type:** IMPLEMENT
- **Deliverable:** Updated runbook/guide/skill docs matching enforced stash policy
- **Execution-Skill:** lp-build
- **Affects:** `AGENTS.md`, `docs/git-safety.md`, `docs/incident-prevention.md`, `.claude/skills/ops-ship/SKILL.md`, `CODEX.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — straightforward policy text updates.
  - Approach: 88% — keeps docs aligned with real enforcement and avoids conflicting guidance.
  - Impact: 88% — several canonical docs touched; needs careful wording consistency.
- **Acceptance:**
  - Forbidden-command language reflects stash mutation deny (`push` included).
  - Guidance avoids implying automatic WIP checkpoint commits on `dev` as mandatory behavior.
  - Skill docs match hard-enforcement behavior.
- **Validation contract:**
  - VC-01: all updated docs consistently describe `stash list/show` as allowed and mutation commands as blocked.
  - VC-02: no doc claims stash push remains allowed.
  - Validation type: targeted grep/read-through consistency check.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Checks run: repository grep across updated policy files for stale stash-push allowance phrasing.
  - Unexpected findings: None.
- **What would make this >=90%:** run docs-lint and manual diff review with a second reviewer.
- **Rollout / rollback:**
  - Rollout: commit docs with enforcement/test changes.
  - Rollback: revert doc hunks only.
- **Documentation impact:** None (self-contained).

## Risks & Mitigations
- A hidden automation path may rely on `stash push`.
  - Mitigation: explicit deny causes loud failure; inspect follow-up logs and adjust workflow guidance.
- Inconsistent behavior between hook and guard if only one side changes.
  - Mitigation: update both and lock with shared policy tests.

## Acceptance Criteria (overall)
- [x] New stash mutations are mechanistically blocked for agents.
- [x] Read-only stash inspection remains available.
- [x] Safety tests pass with updated policy.
- [x] Canonical docs match enforcement reality.

## Decision Log
- 2026-02-10: Chose explicit deny semantics over allow-list edits only because PreToolUse hook is default-allow for unmatched commands.
- 2026-02-10: Rejected "checkpoint commit as sole mechanism" framing to avoid accidental WIP propagation through merge-based branch flow.
- 2026-02-10: Completed TASK-01 through TASK-03 with targeted policy-test validation (`scripts/__tests__/pre-tool-use-git-safety.test.ts`, `scripts/__tests__/git-safety-policy.test.ts`).
