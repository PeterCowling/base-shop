---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Repo
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: agent-git-instructions-update
Related-Plan: docs/plans/agent-git-instructions-update-plan.md
---

# Agent Git Instruction Updates — Fact-Find Brief (Bulk Discard Prevention)

## Scope

### Summary

An agent discarded in-progress work by running `git restore -- <many files>` (and deleting some untracked files) as a cleanup step. Current agent docs and guardrails treat *repo-wide* discards (`git restore .`) as forbidden, but do not clearly forbid (or technically block) bulk per-file restores. This brief captures evidence of what happened and what should change to prevent repeat incidents.

### Goals

- Prevent agents from discarding work via `git restore` / `git checkout --` (including multi-file “cleanup” restores).
- Make the safe alternative explicit: checkpoint commit(s) + `git revert`, or leave unrelated changes uncommitted (stage only intended files).
- Strengthen technical guardrails (git wrapper) so “integrator mode” blocks dangerous restore patterns even when docs are missed.
- Update skill guidance that currently suggests `git restore` during JSON corruption recovery.

### Non-goals

- Redesign the multi-writer / multi-agent workflow (see `docs/plans/multi-writer-git-locking-plan.md`).
- Change CI/CD infrastructure or GitHub branch protection configuration.

### Constraints & Assumptions

- Codex sessions may run non-interactively and may execute shell commands without a “confirm step”.
- The git guard (`scripts/agent-bin/git`) only applies when agents are run inside `scripts/agents/with-git-guard.sh` / `scripts/agents/integrator-shell.sh`.
- We must prefer prevention-by-default over relying on “remember to be careful”.

## Repo Audit (Current State)

### Entry Points

- `AGENTS.md` — Git Rules: forbids `git restore .` but not bulk per-file restores.
- `CODEX.md` — Safety Rules: forbids `git restore .` but not bulk per-file restores.
- `docs/git-safety.md` — lists destructive commands; focuses on repo-wide discards.
- `.agents/safety/checklists.md` + `.agents/safety/rationale.md` — safety checklists/rationale.
- `scripts/agents/integrator-shell.sh` + `scripts/agents/with-git-guard.sh` — opt-in wrapper for safety.
- `scripts/agent-bin/git` — git wrapper that currently blocks repo-wide `restore/checkout` discards, but allows multi-file restores.

### Patterns & Conventions Observed

- “Never discard work as an agent” is documented, but scope is defined as repo-wide patterns (`.` / `:/`), leaving a gap for bulk per-file discards.
- Safety enforcement is layered:
  - Documentation (AGENTS/CODEX)
  - Optional PATH wrapper (`scripts/agent-bin/git`) when in integrator mode
  - Git hooks for commit/push safety (writer lock, pre-push protections)

### Incident Evidence (2026-02-02)

During a Codex session, a “cleanup” step ran `git restore` on a computed list of files:

- It listed tracked changes (`git diff --name-only`).
- It kept only an allowlist of paths/patterns for the “festival guides” work.
- It restored (discarded) everything else: **`tracked changed: 27; restoring: 19`**.
- It then removed some untracked files not on the keep list: **`untracked: 17; removing: 2`**.

This discarded updated guide content that was later expected to be translated.

#### Files discarded (tracked; restored back to `HEAD`)

These 19 files were present as modified before the cleanup and disappeared from `git status` immediately after:

- `apps/brikette/src/components/guides/GuideCollectionCard.tsx`
- `apps/brikette/src/data/guideDirectionLinks.ts`
- `apps/brikette/src/locales/en/guides/content/cheapEats.json`
- `apps/brikette/src/locales/en/guides/content/cuisineAmalfiGuide.json`
- `apps/brikette/src/locales/en/guides/content/eatingOutPositano.json`
- `apps/brikette/src/locales/en/guides/content/ferryCancellations.json`
- `apps/brikette/src/locales/en/guides/content/foodieGuideNaplesAmalfi.json`
- `apps/brikette/src/locales/en/guides/content/groceriesPharmacies.json`
- `apps/brikette/src/locales/en/guides/content/instagramSpots.json`
- `apps/brikette/src/locales/en/guides/content/limoncelloCuisine.json`
- `apps/brikette/src/locales/en/guides/content/onlyHostel.json`
- `apps/brikette/src/locales/en/guides/content/porterServices.json`
- `apps/brikette/src/locales/en/guides/content/positanoBudget.json`
- `apps/brikette/src/locales/en/guides/content/positanoDining.json`
- `apps/brikette/src/locales/en/guides/content/tramontiWineries.json`
- `apps/brikette/src/locales/guides.stub/content/digitalConcierge.ts`
- `apps/brikette/src/locales/guides.stub/content/terraceSunsets.ts`
- `apps/brikette/src/test/components/experiences-page.test.tsx`
- `apps/brikette/src/test/routes/guides/__tests__/guide-diagnostics.test.ts`

#### Files discarded (untracked; deleted)

These 2 untracked files were removed by the same cleanup:

- `apps/brikette/src/locales/en/guides/content/digitalConcierge.json`
- `apps/brikette/src/locales/en/guides/content/terraceSunsets.json`

#### Supporting evidence (file mtimes)

At least 10 of the tracked files above currently share the same modification time (2026-02-02 20:29:40 CET), consistent with being restored in a single bulk operation:

- `apps/brikette/src/locales/en/guides/content/cheapEats.json`
- `apps/brikette/src/locales/en/guides/content/cuisineAmalfiGuide.json`
- `apps/brikette/src/locales/en/guides/content/eatingOutPositano.json`
- `apps/brikette/src/locales/en/guides/content/foodieGuideNaplesAmalfi.json`
- `apps/brikette/src/locales/en/guides/content/limoncelloCuisine.json`
- `apps/brikette/src/locales/en/guides/content/positanoDining.json`
- `apps/brikette/src/locales/en/guides/content/tramontiWineries.json`
- `apps/brikette/src/locales/guides.stub/content/digitalConcierge.ts`
- `apps/brikette/src/locales/guides.stub/content/terraceSunsets.ts`
- `apps/brikette/src/test/routes/guides/__tests__/guide-diagnostics.test.ts`

### Test Landscape

- The primary safety mechanism for destructive git commands is a PATH wrapper:
  - Enabled via `scripts/agents/with-git-guard.sh` (or `scripts/agents/integrator-shell.sh`).
  - Wrapper implementation: `scripts/agent-bin/git`.
- There are no dedicated automated tests for the git wrapper behavior; validation today is manual command execution in a guarded shell.

### Recent Git History (Targeted)

- `d648bae052` — “git safety: harden agent workflows” introduced `scripts/agent-bin/git` and related docs/skills.
- Subsequent commits refined integrator scripts and runbook wording (see `git log` on `AGENTS.md`, `CODEX.md`, `docs/git-safety.md`, `scripts/agent-bin/git`).

## Questions

### Resolved

- Q: “Was the ‘Push test commit for CI check’ session the direct cause?”
  - A: No; that session contains no `git restore` usage. The discard happened later as part of a separate cleanup step.

### Open (User Input Needed)

None required to proceed with planning. A policy choice can be captured as a DECISION task:
- Whether agents should be allowed to do *single-file* worktree restores (`git restore -- <file>`) in any circumstance, or never.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - We can update docs + safety rationale and tighten the git wrapper logic with a small, targeted change set.
- **Approach:** 90%
  - Default-deny on worktree restores for agents is consistent with prior incident learnings (prefer checkpoint commits + reverts).
- **Impact:** 80%
  - Changes touch widely-read docs and optional guard tooling; main risk is accidentally blocking a legitimate workflow (mitigated via explicit override mechanism for humans).
- **Testability:** 80%
  - Wrapper behavior can be validated via deterministic command checks in guarded mode; we can optionally add a lightweight shell-based regression check.

## Planning Constraints & Notes

- Prefer “prevent foot-guns” over “teach best practices only”.
- Ensure docs are consistent across `AGENTS.md`, `CODEX.md`, and `docs/git-safety.md`.
- Any remaining mention of `git restore` in skills should be narrowed to safe forms (`--staged`) or replaced with snapshot-based recovery.

## Suggested Task Seeds (Non-binding)

- Update agent docs to explicitly forbid `git restore -- <paths>` and `git checkout -- <paths>` discards (not just `.`).
- Tighten `scripts/agent-bin/git` to block worktree restores by default (allow `--staged`; optional override env var for humans).
- Update guide-editing skills to remove “use git restore to recover from corruption” guidance.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: proceed to `/plan-feature` for `agent-git-instructions-update`.
