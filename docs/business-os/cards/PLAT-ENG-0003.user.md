---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0003
Title: 'Plan: Agent Git Instruction Updates (PR + CI + Staging)'
Business: PLAT
Tags:
  - plan-migration
  - repo
Created: 2026-01-16T00:00:00.000Z
Updated: 2026-01-16T00:00:00.000Z
---
# Plan: Agent Git Instruction Updates (PR + CI + Staging)

**Source:** Migrated from `agent-git-instructions-update-plan.md`


# Plan: Agent Git Instruction Updates (PR + CI + Staging)

## Background
The current agent runbook emphasizes frequent commits, push frequency, and avoiding destructive commands. It does not clearly require that agents open a pull request after pushing, nor does it spell out how to resolve merge conflicts or GitHub Actions pipeline failures. The desired outcome is that work performed by agents is effectively auto-saved to GitHub, keeps staging environments updated, and leaves only human visual inspection and production promotion as the remaining steps.

## Goals
- Require agents to open a pull request after pushing work branches.
- Document that PRs must be kept green by resolving merge conflicts and fixing GitHub Actions failures.
- Make it explicit that routine agent work should auto-save to GitHub and update staging previews.
- Keep instructions consistent across the repo runbook and related docs.

## Non-Goals
- Changing CI/CD infrastructure or staging deployment behavior.
- Altering branch protection rules or GitHub configuration.

## Scope
- Primary doc: `AGENTS.md` (repo runbook).
- Related references: `docs/git-safety.md`, `docs/incident-prevention.md`, `docs/contributing.md`, `docs/deployment-workflow.md`, and `docs/ci-and-deploy-roadmap.md`.


[... see full plan in docs/plans/agent-git-instructions-update-plan.md]
