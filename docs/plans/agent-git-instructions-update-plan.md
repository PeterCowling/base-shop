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
`AGENTS.md` already mandates pushing work branches, opening PRs, and keeping PRs green. The remaining gap is to make the "autosave to GitHub" intent explicit and align staging expectations with the deployment runbook: agents push early/often, fix CI/CD issues on the work branch, and humans only review staging and promote once CI is green and conflicts are resolved.

## Goals
- Make it explicit that routine agent work is auto-saved to GitHub via early/often pushes.
- Reinforce that CI/CD failures and merge conflicts are fixed on the work branch before approval.
- Align staging expectations with the documented workflow (staging updates after merge to `main`).
- Keep instructions consistent across the repo runbook and related docs.

## Non-Goals
- Changing CI/CD infrastructure or staging deployment behavior.
- Altering branch protection rules or GitHub configuration.

## Scope
- Primary doc: `AGENTS.md` (repo runbook).
- Related references: `docs/git-safety.md`, `docs/incident-prevention.md`, `docs/contributing.md`, `docs/deployment-workflow.md`, and `docs/ci-and-deploy-roadmap.md`.

## Proposed Changes
1. Tighten wording in `AGENTS.md` around Rule 2/2b to call out "autosave to GitHub" and "fix CI/CD failures on the work branch before approval."
2. In the "Human Workflow: Staging + Production" section, make the conflict/CI gates explicit and link to `docs/deployment-workflow.md` for staging URLs.
3. Update the "deploy"/"push to production" decision tree to state: staging updates after PR merge to `main`, and only then does visual review/promotion happen.

## Resolved Questions
- Term: use "pull request (PR)" throughout (matches `AGENTS.md`, `docs/git-safety.md`, and `docs/contributing.md`).
- Staging environments: Cloudflare Pages staging URLs `staging.<app>.pages.dev` per `docs/deployment-workflow.md` and `docs/ci-and-deploy-roadmap.md`.
- CI workflows: reference GitHub Actions generically in `AGENTS.md`, and link to `docs/deployment-workflow.md` for workflow file names and staging URL details (avoid duplicating the list in the runbook).

## Tasks
- [x] Audit `AGENTS.md` for the best insertion points (rules, decision tree, and deploy workflow).
- [x] Check existing CI/CD docs for any standard wording to reuse.
- [x] Draft the runbook updates with concise, actionable steps.
- [x] Validate that the updated instructions do not conflict with existing safety rules.

## Acceptance Criteria
- `AGENTS.md` explicitly calls out early/often pushes as the GitHub autosave.
- Instructions clearly state that merge conflicts and GitHub Actions failures must be resolved before approval.
- Staging expectations align with the documented "merge to main triggers staging" workflow and link to staging URLs.
- Any related docs are updated or cross-referenced for consistency.

## Risks and Mitigations
- Risk: Instructions describe behavior that does not match actual CI/CD triggers.
  - Mitigation: Keep staging language aligned to the current "merge to main triggers staging" workflow.

## Validation
- Manual doc review for clarity and consistency.
- (Optional) Verify CI workflow triggers in `.github/workflows` if the runbook language needs tighter linkage.
