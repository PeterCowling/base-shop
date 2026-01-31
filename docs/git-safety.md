Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17

# Git Safety Guide (Agent Runbook)

> **⚠️ CRITICAL:** On January 14, 2026, a `git reset --hard` command destroyed 8 applications worth of work.
> Recovery took days. This guide exists to prevent that from ever happening again.
> See [RECOVERY-PLAN-2026-01-14.md](./historical/RECOVERY-PLAN-2026-01-14.md) for incident details.

---

## Quick Reference

| Who | What to Read |
|-----|--------------|
| **AI Agents (Claude/Codex)** | [AGENTS.md](../AGENTS.md) - Git Safety Rules section |
| **All contributors** | The rules below apply to all contributors |

---

## The Golden Rules

### 1. Never Run Destructive Git Commands

These commands can permanently destroy work:

| Command | Risk | What It Does |
|---------|------|--------------|
| `git reset --hard` | 🔴 CATASTROPHIC | Destroys uncommitted changes AND moves HEAD |
| `git reset --hard <commit>` | 🔴 CATASTROPHIC | Deletes ALL work since that commit |
| `git clean -fd` | 🔴 HIGH | Permanently deletes untracked files |
| `git checkout -- .`, `git restore .` | 🔴 HIGH | Discards all local modifications |
| `git checkout --theirs .` | 🔴 HIGH | Overwrites files during conflict resolution (can destroy local changes) |
| `git stash drop` | 🟠 MEDIUM | Permanently loses stashed changes |
| `git stash clear` | 🟠 MEDIUM | Loses all stashes |
| `git push --force` | 🔴 HIGH | Overwrites remote history (affects team) |
| `git push -f` | 🔴 HIGH | Same as above (shorthand) |
| `git push --force-with-lease` | 🔴 HIGH | Safer force-push variant, but still rewrites remote history |
| `git rebase` (incl. `-i`) | 🟠 MEDIUM | Rewrites history; can lose commits |
| `git commit --amend` | 🟠 MEDIUM | Rewrites the last commit (dangerous after push) |

**If one of these commands seems necessary, STOP and read the alternatives below.**

### 2. Safe Alternatives

| Instead of... | Do this... |
|--------------|------------|
| `git reset --hard` | Commit first, then discuss what to discard |
| `git reset --hard <commit>` | **Never do this.** Ask for help instead. |
| `git clean -fd` | Move files to `archive/` folder |
| `git checkout -- .`, `git restore .` | Commit first, then discuss what to discard |
| `git rebase`, `git commit --amend` | Create a new commit; let PR squash-merge handle history |
| `git push --force` | Create a new branch instead |
| Fixing a "broken" git state | Share `git status` output and ask for help |

### 3. Commit and Push Regularly

| Trigger | Action |
|---------|--------|
| Every 30 minutes of work | Commit changes |
| Every significant change | Commit immediately |
| Every 2 hours | Push to GitHub |
| Every 3 local commits | Push to GitHub |
| After first push of a `work/*` branch | Open a PR |

**Why:** Uncommitted work is unrecoverable. Unpushed commits are lost if the local machine fails.

### 4. Never Work Directly on `main`

```bash
# Check current branch
git branch --show-current

# If on main, create a work branch:
git checkout -b work/2026-01-15-my-feature
```

**Why:** Direct commits to `main` risk accidental deployment and bypass CI gating.

### 5. Use Worktrees for Parallel Work (Recommended)

If you’re running multiple agents (or editing while an agent runs), don’t share one working tree.

Create a dedicated worktree per agent/human:

```bash
scripts/git/new-worktree.sh <label>
# Example: scripts/git/new-worktree.sh codex-hooks
```

Or manually:

```bash
git fetch origin
git worktree add -b work/$(date +%Y-%m-%d)-<desc> .worktrees/$(date +%Y-%m-%d)-<desc> origin/main
```

**Why:** Shared working trees cause “mystery edits” mid-task and make “save to GitHub” nondeterministic. Worktrees isolate changes so each branch can be committed/pushed independently.

### 6. Claim Work Areas (Prevents Parallel Conflicts)

Worktrees prevent “mystery edits” in the same working tree, but they don’t stop two parallel branches from editing the *same file* and creating painful merge conflicts later.

Use the shared claim system to ensure only one branch is editing an area at a time:

```bash
# Claim an area before making changes
scripts/git/claim.sh apps/business-os

# List active claims
scripts/git/claims.sh

# Release when done
scripts/git/unclaim.sh apps/business-os
```

For agent-named branches (containing `codex`, `claude`, or `agent`), claims are required before committing changes in `apps/`, `packages/`, `src/`, `docs/`, or `scripts/`.

---

## Branch Strategy

### Branch Types

| Branch | Purpose | Who Creates | Deploys To |
|--------|---------|-------------|------------|
| `main` | Production code | Humans only (via PR) | Production (live sites) |
| `work/*` | Development work | Agents or humans | Preview only |
| `hotfix/*` | Emergency fixes | Humans | Production (after CI green) |

### Naming Convention

```
work/YYYY-MM-DD-brief-description
```

Examples:
- `work/2026-01-15-add-user-auth`
- `work/2026-01-15-fix-cart-bug`
- `work/2026-01-15-update-translations`

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Create work │────▶│ Do work,    │────▶│ Push to     │
│ branch      │     │ commit often│     │ GitHub      │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Merge to    │◀────│ Human       │◀────│ Create PR   │
│ main        │     │ approves    │     │ on GitHub   │
└─────────────┘     └─────────────┘     └─────────────┘
        │
        ▼
┌─────────────┐
│ Auto-deploy │
│ to staging  │
└─────────────┘
        │
        ▼
┌─────────────┐
│ Manual      │
│ promote to  │
│ prod        │
└─────────────┘
```

---

## Protection Layers

This repo has multiple layers of protection against accidental data loss:

### Layer 1: Documentation (AGENTS.md, CLAUDE.md)

AI agents are instructed to follow git safety rules. These rules are enforced by:
- Clear prohibitions on destructive commands
- Decision trees for common scenarios
- Explicit instructions to ask for help when git is confusing

**Location:** [AGENTS.md](../AGENTS.md) - Git Safety Rules section

### Layer 2: Git Hooks (Local)

Git hooks run automatically before commits and pushes:

| Hook | Script | What It Does |
|------|--------|--------------|
| `pre-commit` | [pre-commit-check-env.sh](../scripts/git-hooks/pre-commit-check-env.sh) | Blocks commits of secret env files |
| `pre-commit` | [pre-commit-agent-claims.sh](../scripts/git-hooks/pre-commit-agent-claims.sh) | Blocks commits into areas claimed by another branch |
| `pre-commit` | [no-partially-staged.js](../scripts/git-hooks/no-partially-staged.js) | Blocks partially staged files before lint-staged runs |
| `pre-commit` | `lint-staged --no-stash` | Runs check-only linting on staged files without backup stashes |
| `pre-commit` | `pnpm typecheck` | Runs typecheck before committing |
| `pre-commit` | `pnpm lint` | Runs lint before committing |
| `pre-commit` | `pnpm validate:agent-context` | Checks for drift in always-on agent context files |
| `prepare-commit-msg` | [prepare-commit-msg-safety.sh](../scripts/git-hooks/prepare-commit-msg-safety.sh) | Blocks amend-style / commit-message-reuse workflows by default |
| `pre-rebase` | [pre-rebase-safety.sh](../scripts/git-hooks/pre-rebase-safety.sh) | Blocks `git rebase` by default |
| `pre-push` | [pre-push-safety.sh](../scripts/git-hooks/pre-push-safety.sh) | Blocks direct pushes to protected branches and any non-fast-forward push |
| `pre-push` | `pnpm typecheck` | Runs typecheck before pushing |
| `pre-push` | `pnpm lint` | Runs lint before pushing |

**Setup:**
```bash
pnpm install
pnpm run prepare
```

**Documentation:** [Git Hooks](./git-hooks.md)

### Layer 3: GitHub Branch Protection (Server)

GitHub enforces these rules on the `main` branch:

| Setting | Value | Why |
|---------|-------|-----|
| Require pull request | ✅ On | No direct pushes to main |
| Required approvals | 0 | No manual review required |
| Require status checks | ✅ On | CI must pass |
| Auto-merge enabled | ✅ On | Merges PRs when checks pass |
| Block force pushes | ✅ On | Prevents history destruction |

**Configuration:** GitHub → Settings → Rules → Rulesets → `main`

### Layer 4: Agent Runner Guardrails (Optional)

Some agent tools can be configured to deny-list destructive commands (tool permissions, wrappers, command filters, etc.).

**Do not rely on this layer.** Assume *no* tool will save you from a bad git command. Follow the rules above.

If you run agents locally, you can optionally use the repo’s shell-level git guard:

```bash
scripts/agents/with-git-guard.sh -- <your-agent-command>
```

---

## For AI Agents (Claude/Codex)

### Session Start Checklist

```bash
# 1. Check current branch (must not be main)
git branch --show-current
# If "main", create work branch

# 2. Check for uncommitted changes
git status --porcelain
# If not empty, commit them

# 3. Sync remote refs (no merge/rebase)
git fetch origin --prune

# 4. Claim the area you will edit (prevents parallel conflicts)
scripts/git/claim.sh <path>
```

### During Session

- Commit after every significant change
- Push every 2 hours or 3 commits
- Ensure a PR exists after the first push; keep it green with `zero-touch` + auto-merge enabled
- Never run destructive commands
- If git is confusing, STOP and ask the user

### Session End Checklist

```bash
# 1. Commit any remaining changes
git add -A
git commit -m "WIP: session end checkpoint

Co-Authored-By: Claude <model> <noreply@anthropic.com>"

# 2. Push to GitHub
git push origin HEAD

# 3. Tell user the branch name
```

### When Git Is Confusing

**THIS IS HOW THE JAN 14 INCIDENT HAPPENED.** An agent tried to "fix" a confusing git state by resetting to an old commit.

**DO NOT try to fix it yourself. Instead:**

1. STOP - do not run more commands
2. Run diagnostics:
   ```bash
   git status
   git stash list
   git log --oneline -5
   git diff --stat
   ```
3. Share output with user
4. Say: "Git is in an unexpected state. Please advise how to proceed."
5. Wait for human guidance

---

## For Humans

### Deploying to Staging + Production

1. **Review the work branch:**
   ```bash
   git fetch origin
   git log origin/main..origin/work/<branch> --oneline
   git diff origin/main..origin/work/<branch> --stat
   ```

2. **Ensure PR exists and is zero-touch:**
   - If no PR, create one (`gh pr create --fill`)
   - Confirm the `zero-touch` label and auto-merge are enabled
   - Add `keep-open` if the PR should not auto-close on failures or staleness
   - Resolve merge conflicts on the work branch before auto-merge
   - Ensure GitHub Actions is green (fix failures, do not bypass)

3. **Auto-merge (triggers staging):**
   - Auto-merge runs when required checks pass
   - If checks fail, the PR auto-closes; open a new PR after fixing

4. **Verify staging and promote:**
   - Check GitHub Actions tab
   - Confirm staging URL (see `docs/deployment-workflow.md`)
   - After visual review, trigger production deploy (see `docs/deployment-workflow.md`)

### Cleaning Up

After merge:
```bash
git branch -d work/<branch-name>
git push origin --delete work/<branch-name>
```

### Emergency: Bypassing Hooks (Humans only)

**⚠️ Use only when absolutely necessary:**

```bash
# Skip pre-commit / pre-push hooks
git commit --no-verify -m "Emergency fix"
git push --no-verify

# Or: skip simple-git-hooks specifically
SKIP_SIMPLE_GIT_HOOKS=1 git push origin HEAD

# Or: skip only the agent-claims check
SKIP_AGENT_CLAIMS=1 git commit -m "Emergency fix"

# Never bypass in order to rewrite history or push to protected branches.
```

**Document why hooks were bypassed and follow up to fix the root cause.**

---

## Troubleshooting

### "My changes disappeared"

1. Check stash: `git stash list`
2. Check reflog: `git reflog`
3. Check recent commits: `git log --oneline -10`
4. **Do NOT reset to try to recover**
5. Ask for help

### "I accidentally committed to main"

1. Don't push yet!
2. Create a work branch at your current commit: `git checkout -b work/$(date +%Y-%m-%d)-my-feature`
3. Push the work branch: `git push -u origin HEAD`
4. Continue via PR from the work branch (do not try to “clean up” `main` as an agent)

### "I want to undo a change"

**Safe way:**
```bash
# Undo a specific commit (creates new commit)
git revert <commit-hash>

# Restore a specific file to an earlier version
git restore --source <commit-hash> -- path/to/file
```

**NOT safe (don't do this):**
```bash
# DON'T DO THIS
git reset --hard <commit>
```

### "Git hooks aren't running"

```bash
# Reinstall hooks
pnpm run prepare

# Verify installation
hooks_dir="$(git config --get core.hooksPath || git rev-parse --git-path hooks)"
cat "$hooks_dir/pre-commit"
ls -la "$hooks_dir/pre-commit"
```

### "Push was rejected"

If GitHub rejects a push to main:
1. This is expected - main is protected
2. Create a work branch instead
3. Push the work branch
4. Create a PR

---

## Reference

### Commit Message Format

```
type: brief description

Longer description if needed.

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Related Documentation

- [AGENTS.md](../AGENTS.md) - Full rules for AI agents
- [CLAUDE.md](../CLAUDE.md) - Project-specific Claude instructions
- [Git Hooks](./git-hooks.md) - Hook configuration details
- [Contributing](./contributing.md) - Contribution guidelines
- [Recovery Plan](./historical/RECOVERY-PLAN-2026-01-14.md) - Jan 14 incident details

---

## Incident Reference

**Date:** January 14, 2026, 12:52 CET

**What happened:**
1. Git was in a confusing state (stash conflicts)
2. AI agent tried to "fix" it by resetting to an old commit
3. `git reset --hard 59f17b748` deleted all work since Dec 29, 2025
4. 8 applications lost their source files
5. Recovery required parsing transcript logs over several days

**Root cause:** The agent tried to solve a git problem by resetting, not realizing this would destroy uncommitted and unpushed work.

**Prevention:** All the rules and protection layers in this document.

---

**Last Updated:** 2026-01-15

**Questions?** Open an issue on GitHub or check the related documentation above.
