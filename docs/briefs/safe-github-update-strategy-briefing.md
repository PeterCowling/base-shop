Type: Briefing
Status: Active
Domain: Git/GitHub
Created: 2026-02-01
Last-reviewed: 2026-02-01

# Safe GitHub Update Strategy Briefing

## Executive Summary

You have **139 commits** on local `main` that are not on GitHub. The local work also exists across multiple work branches (`work/agents-ci-motivation`, `work/2026-01-31-git-safety-instructions`). Neither `dev` nor `staging` branches exist locally or remotely yet.

**The new pipeline workflow (`dev -> staging -> main`) is designed but not yet deployed on GitHub.**

The safest path forward is:
1. Push the current work branch to GitHub first
2. Create PR(s) to merge work into a new `staging` branch
3. After staging verification, promote to `main` via PR

---

## Current State Analysis

### Local Branches

| Branch | Tracking | Status |
|--------|----------|--------|
| `main` | `origin/main` | **139 commits ahead** |
| `work/agents-ci-motivation` (HEAD) | None | Current branch, uncommitted changes |
| `work/2026-01-29-laurito-seo` | `origin/main` | At remote main |
| `work/2026-01-31-git-safety-instructions` | `origin/work/2026-01-31-git-safety-instructions` | Synced to remote |

### Remote Branches (GitHub)

| Branch | Exists | Notes |
|--------|--------|-------|
| `origin/main` | Yes | 139 commits behind local main |
| `origin/staging` | **No** | Does not exist |
| `origin/dev` | **No** | Does not exist |
| `origin/work/2026-01-31-git-safety-instructions` | Yes | Synced |

### Uncommitted Changes

Current working directory has modifications:
- `docs/audits/fact-check-multi-writer-git-locking-plan-2026-02-01.md` (modified)
- `docs/plans/multi-writer-git-locking-plan.md` (deleted)

---

## Deployment Flow Analysis

### Which branches deploy where?

| Workflow | Trigger Branches | Deploys To |
|----------|------------------|------------|
| `ci.yml` | Push to `main` | Staging only (line 221: `github.ref_name == 'main'`) |
| `brikette.yml` | Push to `main` OR `staging` | Staging branch by default |
| `brikette.yml` | Manual dispatch + `main` | Production (requires checkbox) |
| `prime.yml` | Push to `main` OR `staging` | Staging or Production based on branch |
| `skylar.yml` | Push to `main` OR `staging` | Staging or Production based on branch |
| `cms.yml` | Push to `main` OR `staging` | Staging or Production based on branch |
| `reusable-app.yml` | Called by app workflows | Deploys if `main` OR `staging` |

### Critical Findings

1. **Pushing to `main` triggers CI + staging deploys** (for most apps)
2. **Production deploys require:**
   - For Brikette: Manual workflow dispatch with `publish_to_production: true`
   - For other apps (Prime, Skylar, CMS): Push to `main` OR `staging` triggers deploy based on branch name
3. **The new `dev -> staging -> main` pipeline is documented but not enforced on GitHub yet**
4. **The `auto-pr.yml` workflow expects `work/**` branches, NOT `dev`** (see line 22-27)

---

## Risk Assessment

### CRITICAL: Pushing local `main` directly

**DO NOT push local `main` to `origin/main` via `git push origin main`.**

Why:
1. This would trigger CI workflows
2. For apps like Prime/Skylar/CMS, pushing to `main` triggers **production deploy**
3. 139 commits at once is a large, untested batch

### SAFE: Push work branches first

The work branches (`work/agents-ci-motivation`, etc.) can be safely pushed because:
1. They don't trigger production deploys
2. PRs can be reviewed before merging
3. CI runs on PRs without deploying

---

## Recommended Safe Strategy

### Phase 1: Commit and push work branch

```bash
# 1. Commit any remaining changes on work branch
git add -A
git commit -m "chore: checkpoint before github sync

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 2. Push work branch to GitHub
git push -u origin work/agents-ci-motivation
```

### Phase 2: Create staging branch on GitHub

**Option A: Create `staging` from current `origin/main`**
```bash
# Create staging branch on GitHub from origin/main
git push origin origin/main:refs/heads/staging
```

**Option B: Create `staging` from your work branch (recommended)**
```bash
# After pushing work branch, create PR: work/agents-ci-motivation -> staging (new)
# This lets CI run before anything goes to staging
```

### Phase 3: Merge work into staging via PR

```bash
# Create PR from work branch to staging
gh pr create \
  --head work/agents-ci-motivation \
  --base staging \
  --title "feat: sync local work to staging" \
  --body "Large sync of local development work including:
- Git safety infrastructure
- Business OS improvements
- Guide improvements
- Agent instructions

This PR merges to staging for verification before production."
```

### Phase 4: Promote staging to main (when verified)

After visual/functional verification on staging:

```bash
# Use the pipeline script (once staging exists)
git checkout staging
git pull origin staging
scripts/git/promote-to-main.sh
```

---

## What NOT to Do

| Action | Risk |
|--------|------|
| `git push origin main` | Triggers production deploys for Prime/Skylar/CMS |
| `git push --force` | Blocked by hooks, would destroy remote history |
| `git reset --hard` | Catastrophic data loss risk |
| Create PR directly to `main` | Bypasses staging verification |
| Push without CI passing | May break production |

---

## Git Safety Infrastructure (New)

### Writer Lock System
- Location: `.git/base-shop-writer-lock/`
- Required for commits/pushes (enforced by hooks)
- Use `scripts/git/writer-lock.sh status` to check

### Hooks in Place
| Hook | Protection |
|------|------------|
| `pre-commit` | Blocks commits on main/staging |
| `pre-push` | Blocks direct pushes to main/staging |
| `pre-rebase` | Blocks rebase operations |
| `prepare-commit-msg` | Blocks amend workflows |

### Pipeline Scripts
| Script | Purpose |
|--------|---------|
| `scripts/git/ship-to-staging.sh` | Push `dev` to `staging` via PR |
| `scripts/git/promote-to-main.sh` | Push `staging` to `main` via PR |
| `scripts/git/writer-lock.sh` | Manage single-writer lock |

---

## Immediate Action Checklist

1. [ ] Commit uncommitted changes on `work/agents-ci-motivation`
2. [ ] Push `work/agents-ci-motivation` to GitHub
3. [ ] Create `staging` branch on GitHub (from `origin/main`)
4. [ ] Create PR: `work/agents-ci-motivation` -> `staging`
5. [ ] Wait for CI to pass
6. [ ] Merge PR to staging
7. [ ] Verify staging environment works
8. [ ] Create PR: `staging` -> `main`
9. [ ] Merge to main (triggers production for some apps)

---

## Files Referenced

- `/Users/petercowling/base-shop/docs/git-safety.md` - Full git safety guide
- `/Users/petercowling/base-shop/scripts/git/ship-to-staging.sh` - Shipping script
- `/Users/petercowling/base-shop/scripts/git/promote-to-main.sh` - Promotion script
- `/Users/petercowling/base-shop/scripts/git/writer-lock.sh` - Lock management
- `/Users/petercowling/base-shop/.github/workflows/ci.yml` - Core CI
- `/Users/petercowling/base-shop/.github/workflows/brikette.yml` - Brikette deploy
- `/Users/petercowling/base-shop/.github/workflows/prime.yml` - Prime deploy
- `/Users/petercowling/base-shop/.github/workflows/cms.yml` - CMS deploy
- `/Users/petercowling/base-shop/.github/workflows/reusable-app.yml` - Reusable deploy

---

## Summary

**Key insight:** The new `dev -> staging -> main` pipeline is not yet active on GitHub (no `staging` or `dev` branches exist). The safest approach is:

1. Push work branches (not `main`)
2. Create `staging` branch on GitHub
3. Merge via PRs with CI verification
4. Only merge to `main` after staging is verified
5. Production deploys happen automatically for some apps when `main` is updated

**Brikette is the safest app** - it requires manual workflow dispatch for production deploy. Other apps (Prime, Skylar, CMS) deploy to production automatically when `main` or `staging` is pushed.
