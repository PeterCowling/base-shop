---
Type: Plan
Status: Active
Domain: Repo
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
Last-reviewed: 2026-01-16
Relates-to charter: AGENTS.md
---

# Plan: Audit + Selectively Integrate stash@{1}

## Goal
Safely audit `stash@{1}` and selectively integrate only the changes that are clear improvements, while excluding generated artifacts and any unrelated or risky edits.

## Scope
- Review `stash@{1}` contents against current `HEAD`.
- Classify files into: eligible source/doc changes, generated outputs, and unrelated/unwanted changes.
- Manually apply selected changes (no stash pop).
- Validate with targeted checks and keep PR green.

## Non-goals
- Broadly applying the stash wholesale.
- Restoring or committing generated artifacts (`apps/prime/out/**`, `apps/storybook/storybook-static/**`, `node_modules`, `.eslintcache`).
- Using `git stash pop` or `git stash drop` as part of the integration workflow.

## Constraints
- Follow `AGENTS.md` git safety rules and testing policy.
- Prefer manual, scoped application of changes rather than applying the stash.
- Any change affecting 10+ files must be justified and tracked in this plan.

## Active Tasks
- [ ] REPO-1: Inventory and classify stash@{1} contents
  - Scope: Use `git stash show --name-only stash@{1}` and targeted diffs to build a categorized list (eligible vs generated vs ignore).
  - Dependencies: stash exists locally.
  - Definition of done: A short inventory table in this plan listing candidate paths and exclusions.

- [ ] REPO-2: Decide what to integrate
  - Scope: For each candidate file, compare `stash@{1}` against `HEAD` and decide include/exclude with rationale.
  - Dependencies: REPO-1.
  - Definition of done: A decision list (include/exclude + reason) captured in this plan.

- [ ] REPO-3: Manually apply approved changes
  - Scope: Recreate approved edits via focused patches; avoid `git stash pop`. Keep changes minimal and on the current `work/*` branch.
  - Dependencies: REPO-2.
  - Definition of done: Only approved files changed; no generated outputs added; changes committed with attribution.

- [ ] REPO-4: Validate and push
  - Scope: Run targeted lint/tests per touched packages; push updates and confirm CI is green.
  - Dependencies: REPO-3.
  - Definition of done: CI green on the PR branch; user notified with summary and any remaining warnings.

## Risks / Notes
- The stash appears to include large generated output and mixed changes across multiple apps; careless application could regress unrelated areas.
- Integration must remain selective, auditable, and reversible.
