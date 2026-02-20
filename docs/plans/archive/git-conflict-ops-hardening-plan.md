---
Type: Plan
Status: Historical
Domain: Repo/Git
Last-reviewed: 2026-02-10
Created: 2026-02-09
Last-updated: 2026-02-10
Relates-to charter: none
Feature-Slug: git-conflict-ops-hardening
Related-Fact-Find: docs/plans/ci-integration-speed-control-fact-find.md
Related-Briefing: docs/briefs/git-conflict-enforcement-balance-lp-do-fact-find.md
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-replan, ops-ship
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); weighted by evidence completeness and safety risk
Business-Unit: PLAT
Card-ID:
---

# Git Conflict Ops Hardening Plan

## Summary

Shift conflict-resolution safety controls from soft enforcement (skills/docs that agents must read and faithfully execute) into mechanistic enforcement (hooks, guard extensions, validation scripts that fire automatically). This eliminates operator variance, removes ~860 tokens of redundant skill text per invocation, and makes no-loss guarantees uncheckable rather than aspirational.

Extracted from CI speed optimization scope. Reframed 2026-02-10 after enforcement-balance audit (see Related-Briefing).

## Plan Framing

**Previous approach (v1):** Build a standalone merge-assistant script that agents opt into.
**Current approach (v2):** Embed controls directly into the existing four-layer enforcement infrastructure. No new script to opt into — controls fire automatically via the git guard wrapper, git hooks, and validation pipeline.

Current state:
- GIT-COH-01 (taxonomy) is complete with validated conflict classes.
- GIT-COH-02 (contract) is ready to execute with clearer target: hook/guard extension specs.
- GIT-COH-03 (implement) targets four specific mechanistic controls with well-defined integration points.
- GIT-COH-04 (validate + slim) extends existing test infrastructure and removes redundant skill text.

## Goals

- **Mechanistic no-loss guarantees:** Safety anchor, post-merge verification, lockfile regeneration, and merge-commit enforcement all enforced by hooks/guard — not by agent compliance.
- **Eliminate operator variance:** Controls fire for every agent and every human, every time. No opt-in required.
- **Reduce token cost:** Remove ~80 lines of redundant safety documentation from `ops-ship` skill that duplicate what 4 mechanistic layers already enforce.
- **Extend, don't replace:** All changes are additive to existing infrastructure (`scripts/agent-bin/git`, git hooks, `validate-changes.sh`, `git-safety-policy.test.ts`).

## Non-goals

- CI runtime optimization.
- Workflow gating changes unrelated to git conflict operations.
- Any automation that rewrites history or bypasses writer-lock controls.
- A standalone opt-in merge-assistant script (superseded by mechanistic approach).
- Replacing the existing manual conflict resolution process — mechanistic controls augment it.

## Constraints and Hard-Failure Rules

All changes must integrate into the existing enforcement infrastructure. No new scripts that require opt-in adoption.

Forbidden command classes (hard failure — already enforced at 4 layers):
- `git reset --hard`
- `git clean -fd`
- `git push --force`, `git push -f`, `git push --force-with-lease`
- `git checkout -- .`, `git restore .`
- bulk discard via `git restore -- <pathspec...>` or `git checkout -- <pathspec...>`
- `git stash drop`, `git stash clear`
- `git rebase` (including `-i`)
- `git commit --amend`
- branch deletion on non-temporary branches (`git branch -D <branch>`) as part of automated flow

Required controls (currently soft, moving to mechanistic):
- Safety anchor created automatically before non-fast-forward merges.
- Merge commits always created (no silent fast-forward).
- Post-merge no-loss verification before push is permitted.
- Lockfile conflicts resolved by regeneration, not manual splice.

Integration constraints:
- Must not break `scripts/git/ship-to-staging.sh` or `promote-to-main.sh` (these use `gh pr` + auto-merge, not local merge).
- Must work for both human and agent workflows (hooks fire for both).
- Must be testable within existing `scripts/__tests__/git-safety-policy.test.ts` framework.

## No-Loss Definition

For this plan, "no-loss" means all of the following:
- No pre-existing tracked changes are silently discarded.
- No reachable commits from pre-merge source/target refs become unreachable due to tooling behavior.
- No unresolved lockfile edits are discarded; they must be regenerated and explicitly reviewed.
- Conflict resolutions are auditable (snapshot before/after and explicit changed-file list).

## Fact-Find and Evidence Base

- Extraction source: `docs/plans/ci-integration-speed-control-plan.md` (Scope Extraction).
- Enforcement-balance audit: `docs/briefs/git-conflict-enforcement-balance-lp-do-fact-find.md` (2026-02-10).
- Existing conflict-process evidence: `docs/git-safety.md` (manual merge conflict process and safety guidance).
- Policy references:
  - `AGENTS.md` (destructive command prohibitions, writer lock requirements)
  - `CODEX.md` (agent safety constraints and stop/escalation behavior)
- Existing enforcement infrastructure:
  - `scripts/agent-bin/git` (git guard wrapper — target for merge interception)
  - `scripts/git-hooks/pre-push.sh` (target for no-loss check integration)
  - `scripts/validate-changes.sh` (target for lockfile audit)
  - `.claude/hooks/session-start.sh` (target for merge.ff config)
  - `scripts/__tests__/git-safety-policy.test.ts` (target for regression tests)
- Existing lock tooling:
  - `scripts/git/writer-lock.sh`
  - `scripts/agents/integrator-shell.sh`

## Enforcement Balance (from briefing audit)

### Already mechanistic (no action needed)
- Destructive command blocking: 4 redundant layers (guard + PreToolUse + hooks + deny perms)
- Rebase/amend/force-push blocking: 3 layers (guard + hooks + GitHub)
- Writer lock enforcement: hooks (pre-commit + pre-push)
- Protected branch protection: hooks + GitHub
- Bulk discard blocking: guard
- Hook bypass blocking: guard + PreToolUse + perms

### Currently soft, targeted for mechanistic enforcement

| Control | Current Layer | Target Layer | Task |
|---------|--------------|-------------|------|
| Safety anchor before merge | L1 (doc/skill) | L4 (git guard) | GIT-COH-03a |
| `merge.ff = false` | L1 (doc/skill) | L2 (git config) | GIT-COH-03b |
| Post-merge no-loss check | L1 (doc/skill) | L2 (pre-push hook) | GIT-COH-03c |
| Lockfile regeneration enforcement | L1 (doc/skill) | L2 (validate-changes.sh) | GIT-COH-03d |
| Redundant skill safety docs | L1 (skill) | Removed (mechanistic covers it) | GIT-COH-04 |

## Canonical Process During Development

- The manual process documented in `docs/git-safety.md` remains canonical and unchanged until GIT-COH-04 returns a go decision.
- Mechanistic controls added during GIT-COH-03 are additive to the manual process (they enforce what the docs already prescribe).

## Active tasks

- **GIT-COH-01:** Build conflict failure taxonomy from real repo scenarios and current manual workflow.
- **GIT-COH-02:** Define hook/guard extension contracts with no-loss assertions and test matrix.
- **GIT-COH-03:** Implement four mechanistic controls (merge guard, config, no-loss check, lockfile audit).
- **GIT-COH-04:** Extend regression tests, slim skill, validate compliance; decide go/no-go for Active.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Build Gate |
|---|---|---|---:|---:|---|---|---|
| GIT-COH-01 | INVESTIGATE | Conflict-mode audit and failure taxonomy | 70% | M | Complete (2026-02-09) | - | N/A |
| GIT-COH-02 | PLAN | Hook/guard extension contracts + no-loss assertions + test matrix | 80% | S | Pending | GIT-COH-01 | N/A |
| GIT-COH-03 | IMPLEMENT | Four mechanistic enforcement controls | 78% | M | Pending | GIT-COH-02 | Eligible (>=80 after GIT-COH-02) |
| GIT-COH-04 | INVESTIGATE | Regression tests + skill slimming + compliance validation + go/no-go | 76% | S | Pending | GIT-COH-03 | N/A |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | GIT-COH-01 | - | Evidence and taxonomy first (complete) |
| 2 | GIT-COH-02 | GIT-COH-01 | Contract specs for each enforcement point |
| 3 | GIT-COH-03a, GIT-COH-03b | GIT-COH-02 | Guard extension + config are independent of each other |
| 3 | GIT-COH-03c, GIT-COH-03d | GIT-COH-02 | Hook extension + lockfile audit are independent of each other |
| 4 | GIT-COH-04 | GIT-COH-03 | Tests + slimming + compliance check |

Note: All four sub-parts of GIT-COH-03 can be implemented in parallel within Wave 3.

## Tasks

### GIT-COH-01: Build conflict failure taxonomy

- **Type:** INVESTIGATE
- **Deliverable:** Catalog of conflict types, operator failure modes, and current resolution pain points
- **Execution-Skill:** `lp-do-replan`
- **Affects:** `docs/git-safety.md`, git workflow docs, conflict fixture definitions
- **Depends on:** -
- **Effort:** M
- **Status:** Complete (2026-02-09)
- **Confidence:** 70% (Implementation 72%, Approach 70%, Impact 70%)
- **Acceptance:**
  - Comprehensive conflict class catalog documented with minimum coverage of: content/content, add/add, rename/delete, lockfile conflict, binary/generated artifact conflict.
  - Current manual resolution path and failure points documented per class.
  - Explicit list of gaps automation can safely address vs gaps requiring human intervention.
- **Validation contract:**
  - Validation type: evidence review and reproducible fixture list.
  - Evidence: `docs/plans/git-conflict-ops-hardening-conflict-taxonomy.md`.
- **What would make this >=90%:** run taxonomy against three recent real conflict incidents from git history and confirm coverage.

### GIT-COH-02: Define hook/guard extension contracts and test matrix

- **Type:** PLAN
- **Deliverable:** Per-enforcement-point spec defining inputs, outputs, failure modes, and test expectations
- **Execution-Skill:** `lp-do-replan`
- **Affects:** `scripts/agent-bin/git`, `scripts/git-hooks/`, `scripts/validate-changes.sh`, `.claude/hooks/session-start.sh`, `scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** GIT-COH-01
- **Effort:** S (reduced from M — integration points are now well-defined)
- **Status:** Pending
- **Confidence:** 80% (Implementation 82%, Approach 80%, Impact 80%)
- **Acceptance:**
  - Contract defined for each of the four mechanistic controls:
    - **03a (merge guard):** When `git merge` is intercepted, what triggers anchor creation, what the anchor branch naming convention is, what happens on fast-forward vs diverged merges, what the guard outputs.
    - **03b (merge.ff config):** Where config is set, idempotency, interaction with existing `pull.ff only` setting.
    - **03c (no-loss check):** What triggers the check (post-merge state or pre-push range), what constitutes "unexpected deletion," how false positives are handled (intentional file removal), override mechanism.
    - **03d (lockfile audit):** How to detect that `pnpm-lock.yaml` was in a merge conflict, how to verify regeneration vs manual splice, performance budget for pre-commit.
  - No-loss assertions mapped to checkable commands and expected outcomes per control.
  - Test matrix defines pass/fail expectations for each conflict class × each control.
  - Explicitly documents what remains soft (file-by-file resolution, CI classification, commit frequency).
- **Validation contract:**
  - Validation type: spec review against hard-failure command rules + integration point analysis.
  - Evidence: checked-in contract doc at `docs/plans/git-conflict-ops-hardening-contracts.md`.
- **What would make this >=90%:** dry-run contract walkthrough on two synthetic conflict branches confirming all four controls trigger correctly.

### GIT-COH-03: Implement four mechanistic enforcement controls

- **Type:** IMPLEMENT
- **Deliverable:** Guard extension, config change, hook extension, and validation extension — all integrated into existing infrastructure
- **Execution-Skill:** `lp-do-build`
- **Affects:** `scripts/agent-bin/git`, `.claude/hooks/session-start.sh`, `scripts/git-hooks/`, `scripts/validate-changes.sh`
- **Depends on:** GIT-COH-02
- **Effort:** M
- **Status:** Pending
- **Confidence:** 78% (Implementation 80%, Approach 78%, Impact 78%)
- **Sub-tasks (parallelizable):**

#### GIT-COH-03a: Git guard merge interception (safety anchor)

- **Target file:** `scripts/agent-bin/git`
- **What it does:** Intercept `git merge` in the guard wrapper. When merge target has diverged from HEAD (not a fast-forward), auto-create `backup/pre-merge-<timestamp>` branch at HEAD before allowing the merge to proceed. Log the anchor SHA to stderr.
- **Key design decisions:**
  - Only triggers on non-fast-forward merges (check `git merge-base --is-ancestor` before proceeding).
  - Uses the real git binary for the ancestry check and branch creation.
  - Does not block the merge — just ensures anchor exists first.
  - Anchor branches are lightweight (no checkout, no data copy).
- **Edge cases:**
  - `git merge --abort` must pass through unmodified.
  - `git merge --continue` must pass through unmodified.
  - Fast-forward merges should pass through without anchor creation.

#### GIT-COH-03b: Merge commit enforcement via git config

- **Target file:** `.claude/hooks/session-start.sh`
- **What it does:** Add `git config merge.ff false` alongside the existing `git config --global pull.ff only`.
- **Scope:** Use `--global` to match existing pattern. This ensures all merges create merge commits (audit trail).
- **Interaction:** `pull.ff only` (already set) means pulls fail on non-fast-forward — this is correct and complementary. `merge.ff false` means explicit `git merge` always creates a merge commit.

#### GIT-COH-03c: Post-merge no-loss verification

- **Target file:** `scripts/git-hooks/pre-push.sh` (extend) or new `scripts/git-hooks/post-merge-check.sh` (called from pre-push)
- **What it does:** Before push is permitted, if the commit range includes a merge commit:
  1. Identify the merge commit(s) in the push range.
  2. For each merge commit, check `git diff --name-status <merge>^1..<merge>` for unexpected `D` (deleted) entries.
  3. Cross-reference deletions: if a file was deleted in the merge but existed in both parent branches (not an intentional deletion from either branch), flag it.
  4. On flag: block push with actionable message listing suspicious deletions and how to verify/override.
- **Override mechanism:** `ALLOW_MERGE_DELETIONS=1` (human-only, follows existing bypass pattern). The git guard and PreToolUse hook should block this env var for agents (add to blocked bypass list).
- **False positive handling:** If a file was already deleted in one of the merge parents, it's not flagged. Only flag files that existed in both parents but are missing in the merge result.

#### GIT-COH-03d: Lockfile regeneration audit

- **Target file:** `scripts/validate-changes.sh` (extend)
- **What it does:** When `pnpm-lock.yaml` is in the changed file set and a merge commit is in recent history:
  1. Check if `pnpm-lock.yaml` has conflict markers (should never reach this point, but safety net).
  2. Run `pnpm install --lockfile-only --frozen-lockfile` — if it succeeds, the lockfile is consistent with manifests. If it fails, the lockfile was manually spliced or is stale.
  3. On failure: block with message explaining regeneration path.
- **Performance budget:** `pnpm install --frozen-lockfile` (validation-only, no network) should complete in <5s. If too slow for pre-commit, scope to pre-push only.
- **Scope trigger:** Only runs when lockfile is in the changed set AND there's a merge commit in range. Normal lockfile updates (from `pnpm add` etc.) skip this check.

- **Overall Acceptance (GIT-COH-03):**
  - All four controls integrated into existing files (no new standalone scripts).
  - Each control has at least two test cases in the safety policy test suite.
  - No regressions in existing `git-safety-policy.test.ts` test suite.
  - Manual verification: create a synthetic conflict branch, run through the full merge flow, confirm all four controls fire.
- **Validation contract:**
  - Validation type: extended test suite + synthetic conflict walkthrough.
  - Evidence: test results, before/after git state snapshots, guard output logs.
- **Rollout/Rollback:**
  - Rollout: Controls are always-on once merged (mechanistic, not opt-in).
  - Rollback: Revert the specific commits modifying guard/hooks/validation. Fallback is the existing manual process (unchanged).
- **What would make this >=90%:** all four controls passing in test suite + two successful synthetic conflict walkthroughs with zero false positives.

### GIT-COH-04: Regression tests, skill slimming, and compliance validation

- **Type:** INVESTIGATE + IMPLEMENT (mixed)
- **Deliverable:** Extended test coverage, slimmed skill, compliance report, and go/no-go decision
- **Execution-Skill:** `lp-do-replan` (compliance) + `lp-do-build` (tests + skill edit)
- **Affects:** `scripts/__tests__/git-safety-policy.test.ts`, `.claude/skills/ops-ship/SKILL.md`, `docs/git-safety.md`
- **Depends on:** GIT-COH-03
- **Effort:** S
- **Status:** Pending
- **Confidence:** 76% (Implementation 78%, Approach 76%, Impact 76%)
- **Sub-tasks:**

#### GIT-COH-04a: Extend regression test suite

- **Target file:** `scripts/__tests__/git-safety-policy.test.ts`
- **What it does:** Add test cases for the four new controls:
  - Merge interception: verify anchor branch is created on diverged merge, not on fast-forward.
  - Merge.ff config: verify config is set by session-start hook.
  - No-loss check: verify push is blocked when merge deletes files that existed in both parents.
  - Lockfile audit: verify validation fails when lockfile is manually spliced after merge conflict.
  - Override mechanism: verify `ALLOW_MERGE_DELETIONS=1` is blocked for agents by guard + PreToolUse.

#### GIT-COH-04b: Slim ops-ship skill

- **Target file:** `.claude/skills/ops-ship/SKILL.md`
- **What it does:** Replace ~80 lines of redundant safety command documentation (§ Hardcoded Safety Baseline, § Hard-blocked command classes, § Bypass flags, § Safe sharp tools) with a concise reference:
  ```markdown
  ## Safety Controls (enforced mechanistically)
  Git guard (`scripts/agent-bin/git`), hooks, and Claude permissions enforce all command
  safety rules. See `docs/git-safety.md` § Command Policy Matrix for the full deny/allow
  list. No destructive commands, hook bypasses, or lock bypasses are possible in this
  environment — attempting them produces a hard block with actionable guidance.
  ```
- **Token savings:** ~860 tokens per skill invocation.
- **Preserves:** All procedural content (CI watch loop, failure classification, conflict flow orchestration, stash policy, validation steps).

#### GIT-COH-04c: Compliance validation and go/no-go

- **What it does:**
  - Run compliance checklist against all forbidden command classes (existing + new controls).
  - Verify no regressions in the full `git-safety-policy.test.ts` suite.
  - Document rollback trigger conditions.
  - Produce go/no-go decision.

- **Acceptance (GIT-COH-04 overall):**
  - Regression test suite extended with minimum 8 new test cases (2 per control).
  - `ops-ship` skill reduced by ~80 lines with no loss of procedural guidance.
  - Compliance checklist completed and passing.
  - Clear rollback trigger conditions documented.
- **Validation contract:**
  - Validation type: test suite green + skill diff review + compliance checklist.
  - Evidence: test results, skill diff, compliance report, go/no-go decision log.
- **Output handoff:** If go, set plan `Status: Active`; if no-go, record blockers and keep `Draft`.

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Merge guard anchor creation adds latency to every merge | Low | Ancestry check is fast (~5ms). Branch creation is a single ref write. Measured, not assumed. |
| Post-merge no-loss check produces false positives on intentional deletions | Medium | Only flag files that existed in both merge parents. Provide `ALLOW_MERGE_DELETIONS=1` override (human-only). |
| Lockfile audit slows pre-commit | Medium | Use `--frozen-lockfile` (no network). Scope to pre-push if >5s. Only triggers on lockfile changes + merge context. |
| Skill slimming removes context agents need | Low | Only remove content that duplicates mechanistic enforcement. Preserve all procedural guidance. Verify by running skill through a test scenario. |
| Policy drift between docs, guard, hooks, and tests | Medium | Single source of truth remains `docs/git-safety.md` § Command Policy Matrix. Tests validate both guard and hooks against this matrix (existing pattern). |
| `merge.ff false` global config affects other repos | Low | Follows existing pattern (`pull.ff only` is already set globally). Both are safe defaults — merge commits are always preferable for audit. |

## Acceptance Criteria (overall)

- Four mechanistic controls implemented and tested within existing infrastructure.
- No-loss definition is enforced by hooks/guard, not just documented.
- `ops-ship` skill slimmed by ~80 lines with zero loss of procedural value.
- Regression test suite extended with minimum 8 new test cases.
- Compliance checklist passing against all forbidden command classes + new controls.

## Decision Log

- 2026-02-09: Extracted from `ci-integration-speed-control-plan` to avoid scope creep and confidence dilution.
- 2026-02-09: Expanded from stub into draft plan with explicit execution profile, constraints, and blocked implementation path.
- 2026-02-09: Completed GIT-COH-01 with taxonomy artifact at `docs/plans/git-conflict-ops-hardening-conflict-taxonomy.md`.
- 2026-02-10: **Major reframe (v2).** Enforcement-balance audit (`docs/briefs/git-conflict-enforcement-balance-lp-do-fact-find.md`) identified that conflict resolution procedure is 100% soft control while destructive command prevention is 4x redundant. Reframed from standalone merge-assistant script (opt-in, token-heavy) to mechanistic enforcement extensions (always-on, zero token cost). GIT-COH-02 through GIT-COH-04 rewritten. Confidence raised from 69% to 78% due to clearer implementation path and well-defined integration points.

## Overall-confidence calculation

- Planning readiness: good (`80%`) — enforcement points, integration targets, and contracts are well-defined from briefing audit.
- Implementation readiness: good (`78%`) — each control has a specific target file and clear logic. Guard wrapper pattern is proven. Hook extension pattern is proven.
- Validation readiness: moderate (`76%`) — test framework exists but new test patterns needed for merge interception and no-loss checks.
- Arithmetic:
  - Equal-weight base = `(70 + 80 + 78 + 76) / 4 = 76.0`.
  - Approach clarity bonus (`+2`) for well-defined integration points (vs. previous approach uncertainty).
- Weighted draft confidence: `78.0%` (rounded to `78%`).

## What Would Make This >=90%

- Complete GIT-COH-02 with validated contracts for all four controls.
- Prove all four controls trigger correctly on synthetic conflict branches.
- Full regression test suite green with zero false positives.
- Successful pilot: run through a real merge conflict scenario end-to-end with mechanistic controls active.

## Decision Points

| Condition | Action |
|---|---|
| GIT-COH-02 complete and reviewed | Re-score GIT-COH-03 for build eligibility (expected >=80%) |
| Any mechanistic control causes false positives in testing | Tighten heuristic or add scoping condition before proceeding |
| No-loss assertion fails in synthetic walkthrough | Stop, diagnose, fix control logic. Do not proceed to GIT-COH-04. |
| Lockfile audit exceeds 5s in pre-commit | Move to pre-push only |
| Compliance checklist passing and tests green | Promote to Active |
| Skill slimming removes needed procedural context | Restore section and keep as-is with a comment explaining why it's retained |
