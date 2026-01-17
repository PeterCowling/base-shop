---
Type: Plan
Status: Active
Domain: Repo
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

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

## Proposed Changes
1. Add a new rule or workflow step that agents must create a pull request after pushing a `work/*` branch.
2. Extend the "Human Workflow: Deploying to Production" section to include:
   - PR creation after push.
   - Resolving conflicts before approval.
   - Fixing GitHub Actions failures (no bypasses).
   - Confirming staging updates on the work branch before human visual review.
3. Update the "deploy"/"push to production" decision tree to clarify:
   - Agents never merge to `main`.
   - Humans approve PRs only after conflicts and CI are resolved.
   - Staging should already be updated from the work branch.
4. Add a short "Staging Expectations" subsection describing:
   - Work branch pushes should trigger staging previews.
   - If previews are stale, investigate CI/CD logs before approval.

## Resolved Questions
- Term: use "pull request (PR)" throughout (matches `AGENTS.md`, `docs/git-safety.md`, and `docs/contributing.md`).
- Staging environments: Cloudflare Pages staging URLs `staging.<app>.pages.dev` per `docs/deployment-workflow.md` and `docs/ci-and-deploy-roadmap.md`.
- CI workflows: reference GitHub Actions generically in `AGENTS.md`, and link to `docs/deployment-workflow.md` for workflow file names and staging URL details (avoid duplicating the list in the runbook).

## Tasks
1. Audit `AGENTS.md` for the best insertion points (rules, decision tree, and deploy workflow).
2. Check existing CI/CD docs for any standard wording to reuse.
3. Draft the runbook updates with concise, actionable steps.
4. Validate that the updated instructions do not conflict with existing safety rules.

## Acceptance Criteria
- `AGENTS.md` includes an explicit requirement to open a PR after pushing a work branch.
- Instructions clearly state that merge conflicts and GitHub Actions failures must be resolved before approval.
- Staging preview expectations are documented and align with existing deployment flow.
- Any related docs are updated or cross-referenced for consistency.

## Risks and Mitigations
- Risk: Instructions describe behavior that does not match actual CI/CD triggers.
  - Mitigation: Confirm staging trigger conditions in CI/CD docs before final wording.

## Validation
- Manual doc review for clarity and consistency.
- (Optional) Verify CI workflow triggers mention work branches or PRs in `.github/workflows` if needed for accuracy.
