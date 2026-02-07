---
Type: Plan
Status: Draft
Domain: Repo
Last-reviewed: 2026-02-02
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-02-02
Last-updated-by: Codex
Feature-Slug: agent-git-instructions-update
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Agent Git Instruction Updates Plan

## Summary

Tighten agent Git runbook and guardrails so agents:

- follow a consistent “push → PR → keep CI green” workflow, and
- do not discard work via `git restore` / `git checkout --` “cleanup” operations.

This plan focuses on documentation + local agent guardrails (not CI/CD infrastructure changes).

## Goals

- Require agents to open a pull request after pushing work branches (or use the repo’s scripted ship/promote workflow when appropriate).
- Document that PRs must be kept green by resolving merge conflicts and fixing GitHub Actions failures.
- Prevent accidental loss of work from bulk discards (e.g., `git restore -- <many files>`).
- Make the safe alternative explicit: checkpoint commit(s) + `git revert`, or leave unrelated changes uncommitted (stage only intended files).
- Keep instructions consistent across `AGENTS.md`, `CODEX.md`, and `docs/git-safety.md`.

## Non-Goals

- Changing CI/CD infrastructure, staging deployment behavior, or GitHub configuration.
- Implementing multi-writer / per-agent-index architecture (see `docs/plans/multi-writer-git-locking-plan.md`).

## Constraints & Assumptions

- Codex sessions may run non-interactively; safety must be “default deny” rather than “ask for confirmation”.
- The git guard wrapper only applies when agents run inside integrator mode (`scripts/agents/integrator-shell.sh`).

## Fact-Find Reference

- Related brief: `docs/plans/agent-git-instructions-update-fact-find.md`

## Existing System Notes

- Primary docs: `AGENTS.md`, `CODEX.md`, `docs/git-safety.md`, `.agents/safety/*`.
- Optional local enforcement for agents: `scripts/agents/integrator-shell.sh` → `scripts/agents/with-git-guard.sh` → `scripts/agent-bin/git`.

## Proposed Approach

- Make docs unambiguous: treat worktree discards via `git restore` / `git checkout --` as destructive for agents (not only `git restore .`).
- Prefer “checkpoint commit + revert” whenever someone wants to discard changes.
- Tighten the git wrapper to block worktree restore operations by default in guarded shells.
- Keep a narrow “escape hatch” for humans (explicit env var override) if needed.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | DECISION | Final policy: allow any worktree restore for agents? | 70% ⚠️ | S | Pending | - |
| TASK-02 | IMPLEMENT | Update agent Git docs + checklists (PR/CI + no-discard) | 88% | M | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Update guide-editing skills to avoid `git restore` guidance | 85% | S | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Harden git guard wrapper to block worktree restore/checkout pathspec | 80% | M | Pending | TASK-01 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Final policy on worktree restores for agents

- **Type:** DECISION
- **Affects:** `AGENTS.md`, `CODEX.md`, `docs/git-safety.md`, `scripts/agent-bin/git`, `.claude/skills/*` (policy wording)
- **Depends on:** -
- **Confidence:** 70% ⚠️ BELOW THRESHOLD
  - Implementation: 90% — either policy is implementable
  - Approach: 70% — depends on how strict we want agent constraints to be
  - Impact: 70% — stricter blocks may disrupt some workflows; looser policy risks repeat incidents
- **Options:**
  - **Option A (recommended):** Agents never run worktree discards via `git restore -- <paths>` / `git checkout -- <paths>` (single-file included). Use checkpoint commit(s) + `git revert`, or restore from known-good snapshots.
  - **Option B:** Allow *single-file* worktree restore only with explicit override (env var) + explicit user instruction; block multi-file restores and “computed restore lists”.
- **Recommendation:** Option A — it best matches prior incident learnings and removes ambiguity.
- **Question for user:**
  - Should we fully forbid *all* worktree restores for agents (Option A), or allow the narrow single-file exception (Option B)?
  - Why it matters: this gates both doc wording and the guard wrapper behavior.
  - Default if no answer: Option A (safest; least ambiguous).
- **Acceptance:**
  - Policy choice recorded in Decision Log; downstream tasks updated accordingly.

### TASK-02: Update agent Git docs + checklists (PR/CI + no-discard)

- **Type:** IMPLEMENT
- **Affects:** `AGENTS.md`, `CODEX.md`, `docs/git-safety.md`, `.agents/safety/checklists.md`, `.agents/safety/rationale.md`
- **Depends on:** TASK-01
- **Confidence:** 88%
  - Implementation: 90% — docs are straightforward to update with concrete rules and examples
  - Approach: 88% — aligns with existing safety stance; details depend on TASK-01
  - Impact: 88% — mostly additive clarity; low risk
- **Acceptance:**
  - `AGENTS.md` explicitly requires a PR after pushing work branches (or uses the scripted ship/promote workflow).
  - `AGENTS.md` and `CODEX.md` explicitly forbid worktree discards via `git restore -- <paths>` / `git checkout -- <paths>` (per TASK-01), including “cleanup restore lists”.
  - Safe alternative is documented: checkpoint commit(s) + `git revert`, or stage only intended files and leave the rest uncommitted.
  - `docs/git-safety.md` and `.agents/safety/*` are consistent with the runbook and do not recommend unsafe discards for agents.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Search “destructive commands” sections include the new restore/checkout policy → policy is visible and unambiguous.
    - TC-02: Search for `git restore` across docs/skills → only safe forms remain (e.g., `git restore --staged`) or clearly-scoped human-only guidance.
  - **Test type:** documentation
  - **Test location:** N/A
  - **Run:** `rg -n \"git restore\" AGENTS.md CODEX.md docs/git-safety.md .agents/safety .claude/skills`
- **Rollout / rollback:**
  - Rollout: docs-only; effective immediately.
  - Rollback: revert doc changes.
- **Documentation impact:**
  - Updates the repo’s canonical agent docs (this task *is* documentation impact).

### TASK-03: Update guide-editing skills to avoid `git restore` guidance

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/improve-en-guide/SKILL.md`, `.claude/skills/improve-translate-guide/SKILL.md`
- **Depends on:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — wording change, consistent with snapshot-first protocol
  - Approach: 90% — prevents skill text from encouraging destructive commands
  - Impact: 85% — reduces accidental data loss risk; minimal workflow impact
- **Acceptance:**
  - Skills no longer suggest `git restore` / `git checkout -- <path>` as a recovery mechanism.
  - Recovery guidance is snapshot-first; if snapshot is missing, the skill instructs to stop and ask the user.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `rg` over the two skill files contains no “use git restore” guidance → prevents accidental adoption.
  - **Test type:** documentation
  - **Run:** `rg -n \"git restore|git checkout --\" .claude/skills/improve-en-guide/SKILL.md .claude/skills/improve-translate-guide/SKILL.md`

### TASK-04: Harden git guard wrapper to block worktree restore/checkout pathspec

- **Type:** IMPLEMENT
- **Affects:** `scripts/agent-bin/git`
- **Depends on:** TASK-01
- **Confidence:** 80%
  - Implementation: 85% — small wrapper change; needs careful arg parsing
  - Approach: 80% — default-deny is right; exact exceptions depend on TASK-01
  - Impact: 80% — could block legitimate workflows in guarded shells; mitigated by explicit override
- **Acceptance:**
  - In guarded shells, `git restore -- <paths>` that affects the worktree is blocked (per TASK-01).
  - In guarded shells, `git restore --staged <paths>` remains allowed.
  - In guarded shells, `git checkout -- <paths>` is blocked; branch checkouts remain allowed.
  - Error messaging points to safe alternatives (checkpoint commit + revert) and `docs/git-safety.md`.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Guard blocks `git restore -- DOES_NOT_EXIST.txt` → exits non-zero with guard message (wrapper must block before calling real git).
    - TC-02: Guard allows `git restore --staged DOES_NOT_EXIST.txt` → wrapper does not block (real git errors, proving it reached the real git binary).
    - TC-03: Guard blocks `git checkout -- DOES_NOT_EXIST.txt` → exits non-zero with guard message.
  - **Test type:** command-level (manual)
  - **Test location:** N/A
  - **Run:** `PATH=\"$(pwd)/scripts/agent-bin:$PATH\" git restore -- DOES_NOT_EXIST.txt` (and variants above)

## Risks & Mitigations

- Risk: Stricter policy blocks a legitimate one-off recovery workflow.
  - Mitigation: document the safe alternative (checkpoint commit + revert) and (optionally) provide a human-only override.
- Risk: Docs and skills drift or contradict each other over time.
  - Mitigation: keep a single canonical policy statement in `AGENTS.md` and reference it elsewhere; add a quick `rg` check to validate consistency during doc updates.

## Acceptance Criteria (overall)

- [ ] Agent docs make PR/CI workflow explicit and actionable.
- [ ] Agent docs + skills do not recommend worktree discards via `git restore` / `git checkout --`.
- [ ] Guarded shells block dangerous restore/checkout patterns by default.

## Decision Log

- 2026-02-02: Plan expanded to address accidental work loss from bulk `git restore -- <paths>` operations (see fact-find brief).

## Risks and Mitigations
- Risk: Instructions describe behavior that does not match actual CI/CD triggers.
  - Mitigation: Confirm staging trigger conditions in CI/CD docs before final wording.

## Validation
- Manual doc review for clarity and consistency.
- (Optional) Verify CI workflow triggers mention work branches or PRs in `.github/workflows` if needed for accuracy.

## Active tasks

- **GITDOCS-01** - Audit `AGENTS.md` for insertion points and draft updates
