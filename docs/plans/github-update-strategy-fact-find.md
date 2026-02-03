---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: github-update-strategy
Related-Plan: docs/plans/github-update-strategy-plan.md
---

# Safe GitHub Update Strategy Fact-Find Brief

## Scope

### Summary

Push significant local work to GitHub safely, ensuring changes go only to staging environments without affecting production. Local work includes agent instructions, git safety infrastructure, GitHub Actions updates, guide improvements, and Business OS work.

### Goals

- Push all local changes to GitHub
- Ensure changes land in staging environments only (not production)
- Follow the new git safety workflow (dev -> staging -> main pipeline)
- Avoid triggering production deployments

### Non-goals

- Production deployment (explicitly avoided)
- Force-pushing or history rewriting

### Constraints & Assumptions

- Constraints:
  - Must follow `.agents/safety/checklists.md` and `.agents/safety/rationale.md` rules
  - Direct commits to `main`/`staging` are prohibited for agents
  - The `dev` and `staging` branches do NOT exist on remote yet
  - Current PR #7159 targets `main` directly (work/agents-ci-motivation -> main)

- Assumptions:
  - The new dev -> staging -> main pipeline is the intended workflow going forward
  - CI failures on PR #7159 are acceptable to fix incrementally

## Repo Audit (Current State)

### Branch State

**Local branches:**
| Branch | Tracking | Status |
|--------|----------|--------|
| `main` | origin/main | **139 commits ahead** of origin/main |
| `work/agents-ci-motivation` | origin/work/agents-ci-motivation | Current branch, synced with remote |
| `infra/ci-and-git-safety-update` | origin/infra/ci-and-git-safety-update | Feature branch |
| `work/2026-01-31-git-safety-instructions` | origin/work/2026-01-31-git-safety-instructions | Already merged locally |

**Remote branches:**
- `origin/main` - Production branch (last commit: `75b41835af`)
- `origin/staging` - **DOES NOT EXIST** (workflow file references it but branch not created)
- `origin/dev` - **DOES NOT EXIST** (workflow file references it but branch not created)

**Key insight:** The local `main` branch is **139 commits ahead** of `origin/main`. This represents significant local work that hasn't been synced to GitHub.

### Current PR State

**PR #7159** (`work/agents-ci-motivation` -> `main`):
- State: OPEN, MERGEABLE
- CI Status: Multiple failures (Lint, Typecheck, Security Audit, E2E, Lighthouse)
- This is the current working branch with recent CI fixes

### Entry Points (Workflows)

| Workflow | Trigger | Production Deployment |
|----------|---------|----------------------|
| `ci.yml` (Core Platform CI) | push, pull_request | Only on `main` branch with all checks passing |
| `brikette.yml` | push to `main`/`staging` + paths | `staging` job always runs; `production` only on manual workflow_dispatch from `main` |
| `auto-pr.yml` | push to `dev` | Creates PR from `dev` -> `staging` (auto-merge when checks pass) |
| `merge-gate.yml` | pull_request, push to `main` | Gates merges by waiting for required workflows |

### Patterns & Conventions Observed

- **Branch pipeline pattern**: `work/**` -> PR to `staging` -> auto-merge -> `staging` -> PR to `main` -> `main`
  - Evidence: `.github/workflows/auto-pr.yml`, `.agents/safety/rationale.md`

- **Writer lock pattern**: Single-writer concurrency via `.git/base-shop-writer-lock/meta`
  - Evidence: `scripts/agents/integrator-shell.sh`, `scripts/agents/with-writer-lock.sh`

- **Git guard pattern**: Blocks destructive commands (`reset --hard`, `clean -fd`, `push --force`, `rebase`, `amend`)
  - Evidence: `scripts/agents/with-git-guard.sh`, `.agents/safety/checklists.md`

### Deployment Triggers Analysis

**Production deployments occur when:**

1. **brikette.yml**: Manual `workflow_dispatch` with `publish_to_production: true` from `main`
2. **ci.yml release job**: Push to `main` with all prior jobs successful

**Staging deployments occur when:**

1. **brikette.yml**: Push to `main` or `staging` branches with relevant path changes
2. **ci.yml release job**: Push to `main` (deploys to staging Cloudflare Pages)

**Key safety finding:** Pushing to `work/**` branches or creating PRs targeting non-main branches will NOT trigger production deployments.

### Tests & Quality Gates

- Existing tests: Multiple CI jobs (Lint, Typecheck, Unit tests, E2E, Storybook, Lighthouse)
- Gaps: Some CI jobs are currently failing on PR #7159 (Security Audit, some Lighthouse tests)
- Commands: `pnpm typecheck && pnpm lint` (pre-commit), full CI on push

### Uncommitted Local Changes

7 files with local changes:
- `docs/business-os/cards/BRIK-ENG-0020.user.md` (modified)
- `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md` (modified)
- `docs/plans/commerce-core-readiness-fact-find.md` (modified)
- `pnpm-lock.yaml` (modified)
- `apps/brikette-scripts/` (new, untracked)
- `docs/audits/commerce-core-readiness-fact-check-2026-02-01.md` (new)
- `docs/plans/email-autodraft-response-system-fact-find.md` (new)

## Questions

### Resolved

- Q: Does pushing to `work/**` branches trigger production deployments?
  - A: NO. Production deployments only occur on push to `main` or manual workflow_dispatch.
  - Evidence: `.github/workflows/brikette.yml` lines 64-80, `.github/workflows/ci.yml` lines 217-221

- Q: Does the `staging` branch exist on remote?
  - A: NO. Only `origin/main` exists. The workflow references `staging` but the branch hasn't been created.
  - Evidence: `git branch -r` shows only `origin/main` in the main branches

- Q: What is the intended branch pipeline?
  - A: `work/**` -> PR to `staging` -> auto-merge -> `staging` -> PR to `main` -> `main`
  - Evidence: `.github/workflows/auto-pr.yml`, `.agents/safety/rationale.md`

### Open (User Input Needed)

- Q: Should we continue with the current PR #7159 targeting `main` directly, or create the `staging` branch and redirect?
  - Why it matters: The current PR bypasses the intended dev->staging->main pipeline
  - Decision impacted: Whether to create `staging` branch now or later
  - Default assumption: Continue with current PR to `main` since staging branch doesn't exist yet; create staging/dev later
  - Risk: Low, since production deployment requires manual trigger

## Confidence Inputs (for /plan-feature)

- **Implementation:** 90%
  - The path is clear: continue using `work/**` branches and PRs
  - git push is well understood
  - Missing: staging/dev branches don't exist yet but aren't blocking

- **Approach:** 80%
  - The intended workflow (dev->staging->main) is documented but not yet implemented on remote
  - Current PR targeting main is acceptable given staging doesn't exist
  - Would raise to 90%: Create `staging` branch on remote and update PR target

- **Impact:** 95%
  - Production is safe: requires manual trigger or push to `main`
  - Pushing to `work/**` branches only triggers CI, not deployments
  - Staging deployments are acceptable and expected

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `work/**` branch naming for feature work
  - Never push directly to `main` or `staging`
  - Use PRs with CI validation before merge

- Rollout/rollback expectations:
  - Changes go to staging first
  - Production requires explicit manual trigger
  - Rollback via revert commits (no force-push)

- Observability expectations:
  - GitHub Actions provides full CI visibility
  - Cloudflare Pages provides deployment status

## Safe Push Strategy

### Option A: Continue Current PR to Main (Recommended)

1. **Current state is safe**: PR #7159 already exists targeting `main`
2. **CI failures are non-blocking**: Can be fixed incrementally
3. **Production safety**: Deploying to production requires manual trigger even after merge to `main`
4. **Next steps**:
   - Fix remaining CI failures
   - Get PR approved/merged
   - Production stays unchanged until manual deployment

### Option B: Create Staging Branch First

1. Create `staging` branch from current `origin/main`
2. Retarget PR #7159 to `staging` instead of `main`
3. Merge to `staging` first
4. Create new PR from `staging` to `main`

**Recommendation**: Option A is simpler and equally safe. The `staging` branch can be created later as a separate infrastructure task.

## Immediate Actions to Push Safely

1. **Commit any uncommitted work** on `work/agents-ci-motivation`:
   ```bash
   git add <specific files>
   git commit -m "chore: <description>"
   ```

2. **Push to remote**:
   ```bash
   git push origin work/agents-ci-motivation
   ```

3. **Verify CI**: Check PR #7159 for updated CI status

4. **For the 139 commits on local main**: These should NOT be pushed directly. They likely represent work that was merged locally but should go through PRs. Investigate what these commits are before taking action.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step:
  1. Push current branch safely
  2. Investigate the 139 commits on local `main` ahead of `origin/main`
  3. Optionally create `staging` branch as separate infra task
