---
Type: Plan
Status: Draft
Domain: Repo/Git
Last-reviewed: 2026-02-09
Created: 2026-02-09
Last-updated: 2026-02-09
Relates-to charter: none
Feature-Slug: git-conflict-ops-hardening
Related-Fact-Find: docs/plans/ci-integration-speed-control-fact-find.md
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: re-plan, safe-commit-push-ci
Overall-confidence: 69%
Confidence-Method: min(Implementation,Approach,Impact); weighted by evidence completeness and safety risk
Business-Unit: PLAT
Card-ID:
---

# Git Conflict Ops Hardening Plan

## Summary
This plan defines a safe, no-loss conflict-resolution workflow and tooling track that was extracted from CI speed optimization scope. It is investigation-first and remains `Draft` until safety evidence is complete.

## Plan Framing
This is a pre-activation draft with one blocked IMPLEMENT task.
Execution is safety-first and primarily serial; limited overlap is allowed between GIT-COH-01 and GIT-COH-02 for contract scaffolding, but GIT-COH-02 cannot finalize before taxonomy evidence lands.

Current state:
- Investigation and contract-definition tasks are ready to execute.
- No IMPLEMENT task is currently build-eligible (`>=80%`), by design.
- Implementation moves only after conflict taxonomy and policy fixtures are complete.

## Goals
- Standardize conflict resolution with explicit no-loss guarantees.
- Enforce full compliance with repo non-destructive git policy.
- Reduce operator variance and recovery time during merge conflicts.

## Non-goals
- CI runtime optimization.
- Workflow gating changes unrelated to git conflict operations.
- Any automation that rewrites history or bypasses writer-lock controls.

## Constraints and Hard-Failure Rules
The script/workflow produced by this plan must never execute forbidden operations.

Forbidden command classes (hard failure):
- `git reset --hard`
- `git clean -fd`
- `git push --force`, `git push -f`, `git push --force-with-lease`
- `git checkout -- .`, `git restore .`
- bulk discard via `git restore -- <pathspec...>` or `git checkout -- <pathspec...>`
- `git stash drop`, `git stash clear`
- `git rebase` (including `-i`)
- `git commit --amend`
- branch deletion on non-temporary branches (`git branch -D <branch>`) as part of automated flow

Required controls:
- Writer lock required for all write operations.
- Lockfile conflicts resolved by regeneration from declarative manifests (never by partial discard).
- Post-merge no-loss verification required before push.

## No-Loss Definition
For this plan, “no-loss” means all of the following:
- No pre-existing tracked changes are silently discarded.
- No reachable commits from pre-merge source/target refs become unreachable due to tooling behavior.
- No unresolved lockfile edits are discarded; they must be regenerated and explicitly reviewed.
- Conflict resolutions are auditable (snapshot before/after and explicit changed-file list).

## Fact-Find and Evidence Base
- Extraction source: `docs/plans/ci-integration-speed-control-plan.md` (Scope Extraction).
- Existing conflict-process evidence: `docs/git-safety.md` (manual merge conflict process and safety guidance).
- Policy references:
  - `AGENTS.md` (destructive command prohibitions, writer lock requirements)
  - `CODEX.md` (agent safety constraints and stop/escalation behavior)
- Existing lock tooling:
  - `scripts/git/writer-lock.sh`
  - `scripts/agents/integrator-shell.sh`

## Existing System Notes
- Current conflict process is primarily manual and policy-heavy; consistency depends on operator discipline.
- Strong preventive controls already exist (writer lock + destructive command policy), but procedural automation is limited.
- Integration plan identified “manual conflict execution variance” as an operational risk; this plan owns that gap.

## Canonical Process During Development
- The manual process documented in `docs/git-safety.md` remains canonical and unchanged until GIT-COH-04 returns a go decision.
- Any in-progress helper script is non-canonical and must be treated as experimental until activation criteria are met.

## Active tasks
- **GIT-COH-01:** Build conflict failure taxonomy from real repo scenarios and current manual workflow.
- **GIT-COH-02:** Define additive-only merge-assistant contract, with explicit no-loss assertions and fixture matrix.
- **GIT-COH-03:** Implement minimal safe merge-assistant script and run fixture suite.
- **GIT-COH-04:** Validate policy compliance and rollout protocol; decide go/no-go for Active status.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Build Gate |
|---|---|---|---:|---:|---|---|---|
| GIT-COH-01 | INVESTIGATE | Conflict-mode audit and failure taxonomy | 70% | M | Complete (2026-02-09) | - | N/A |
| GIT-COH-02 | PLAN | Script contract + no-loss assertions + fixture matrix | 74% | M | Pending | GIT-COH-01 | N/A |
| GIT-COH-03 | IMPLEMENT | Minimal additive-only merge-assistant script | 66% | M | Pending | GIT-COH-02 | Blocked (<80) |
| GIT-COH-04 | INVESTIGATE | Policy compliance validation + rollout/rollback protocol | 72% | M | Pending | GIT-COH-03 | N/A |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | GIT-COH-01 | - | Evidence and taxonomy first |
| 2 | GIT-COH-02 | GIT-COH-01 | Contract and test fixture definition |
| 3 | GIT-COH-03 | GIT-COH-02 | Implementation only after contract lock |
| 4 | GIT-COH-04 | GIT-COH-03 | Compliance proof and activation decision |

## Tasks

### GIT-COH-01: Build conflict failure taxonomy
- **Type:** INVESTIGATE
- **Deliverable:** Catalog of conflict types, operator failure modes, and current resolution pain points
- **Execution-Skill:** `re-plan`
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

### GIT-COH-02: Define script contract and fixture matrix
- **Type:** PLAN
- **Deliverable:** Additive-only script spec with no-loss assertions and test matrix
- **Execution-Skill:** `re-plan`
- **Affects:** planned `scripts/git/*` interface, docs contract section, test fixture definitions
- **Depends on:** GIT-COH-01
- **Effort:** M
- **Status:** Pending
- **Confidence:** 74% (Implementation 76%, Approach 74%, Impact 74%)
- **Acceptance:**
  - Script entry/exit contract defined (inputs, outputs, failure modes, audit logs).
  - Snapshot mechanism is explicitly defined and policy-safe (for example: temporary anchor branch and/or commit/ref checkpoints); disallowed stash lifecycle operations are not required.
  - No-loss assertions mapped to checkable commands and expected outcomes.
  - Fixture matrix defines pass/fail expectations for each conflict class.
- **Validation contract:**
  - Validation type: spec review against hard-failure command rules.
  - Evidence: checked-in contract doc and fixture matrix.
- **What would make this >=90%:** dry-run contract walkthrough on two synthetic conflict branches.

### GIT-COH-03: Implement minimal safe merge-assistant script
- **Type:** IMPLEMENT
- **Deliverable:** Minimal script + tests executing additive-only, policy-compliant conflict workflow
- **Execution-Skill:** `build-feature`
- **Affects:** `scripts/git/*`, script tests, operator docs
- **Depends on:** GIT-COH-02
- **Effort:** M
- **Status:** Pending
- **Confidence:** 66% (Implementation 68%, Approach 66%, Impact 66%)
- **Acceptance:**
  - Script performs snapshot -> additive merge attempt -> explicit conflict inventory -> no-loss checks.
  - Script explicitly blocks forbidden command classes.
  - Lockfile conflict path uses regeneration workflow and explicit verification.
- **Validation contract:**
  - Validation type: fixture suite across defined conflict matrix + policy-command deny checks.
  - Evidence: test results and before/after git state snapshots.
- **Rollout/Rollback:**
  - Rollout: start as opt-in helper with manual confirmation steps.
  - Rollback: disable helper usage and revert script commits; fallback remains documented manual process.
- **Documentation impact:** Add operator runbook and troubleshooting notes.
- **What would make this >=90%:** complete fixture suite with zero no-loss violations and two successful pilot runs.

### GIT-COH-04: Validate compliance and rollout protocol
- **Type:** INVESTIGATE
- **Deliverable:** Go/no-go decision package for moving plan to Active
- **Execution-Skill:** `re-plan`
- **Affects:** `AGENTS.md` references, `docs/git-safety.md`, adoption protocol docs
- **Depends on:** GIT-COH-03
- **Effort:** M
- **Status:** Pending
- **Confidence:** 72% (Implementation 74%, Approach 72%, Impact 72%)
- **Acceptance:**
  - Compliance checklist completed against all forbidden command classes.
  - Rollout policy defines when helper is allowed vs when manual conflict handling is mandatory.
  - Clear rollback trigger conditions documented.
- **Validation contract:**
  - Validation type: policy checklist review and pilot evidence review.
  - Evidence: compliance report + go/no-go decision log.
- **Output handoff:** If go, set plan `Status: Active` and create execution-ready follow-on task set; if no-go, record blockers and keep `Draft`.

## Risks and Mitigations
| Risk | Severity | Mitigation |
|---|---|---|
| Automation creates false confidence and operators skip verification | High | Mandatory no-loss checks, explicit human checkpoints, and pilot-only rollout first. |
| Policy drift between docs and script behavior | High | GIT-COH-04 compliance checklist tied directly to forbidden command classes. |
| Lockfile conflicts handled unsafely | Medium | Force regeneration path and explicit post-regeneration verification. |
| Over-scoping into generalized git automation | Medium | Keep scope to merge-conflict assistance only; no history-rewrite tooling. |

## Acceptance Criteria (overall)
- No-loss definition is converted into executable checks and validated on conflict fixtures.
- Any produced helper is additive-only and policy-compliant.
- Rollout policy defines clear use/avoid boundaries and rollback triggers.

## Decision Log
- 2026-02-09: Extracted from `ci-integration-speed-control-plan` to avoid scope creep and confidence dilution.
- 2026-02-09: Expanded from stub into draft plan with explicit execution profile, constraints, and blocked implementation path.
- 2026-02-09: Completed GIT-COH-01 with taxonomy artifact at `docs/plans/git-conflict-ops-hardening-conflict-taxonomy.md`.

## Overall-confidence calculation
- Investigation and planning readiness: moderate (`70-74%`) due incomplete evidence baseline.
- Implementation readiness: low (`66%`) until contract and fixtures are complete.
- Arithmetic:
  - Equal-weight base = `(70 + 74 + 66 + 72) / 4 = 70.5`.
  - Safety risk adjustment (`-1.5`) for unresolved snapshot mechanism and pre-pilot policy risk.
- Weighted draft confidence: `69.0%` (rounded to `69%`).

## What Would Make This >=90%
- Complete GIT-COH-01 and GIT-COH-02 with validated fixture matrix.
- Prove no-loss checks across all fixture classes in GIT-COH-03.
- Complete GIT-COH-04 compliance package and pilot evidence.

## Decision Points
| Condition | Action |
|---|---|
| GIT-COH-02 complete and reviewed | Re-score GIT-COH-03 for build eligibility |
| Any no-loss assertion fails in fixtures | Stop rollout, keep Draft, open remediation task |
| Compliance checklist incomplete | Do not set Active |
| Pilot runs pass and compliance complete | Promote to Active and begin controlled adoption |
