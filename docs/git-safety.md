Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-31

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
| `git rebase`, `git commit --amend` | Create a new commit; let PR merge handle history |
| `git push --force` | Create a new branch instead |
| Fixing a "broken" git state | Share `git status` output and ask for help |

### 3. Commit and Push Regularly

| Trigger | Action |
|---------|--------|
| Every 30 minutes of work | Commit changes |
| Every significant change | Commit immediately |
| Every 2 hours | Push to GitHub |
| Every 3 local commits | Push to GitHub |
| When ready to update staging | Ship `dev` → `staging` (`scripts/git/ship-to-staging.sh`) |

**Why:** Uncommitted work is unrecoverable. Unpushed commits are lost if the local machine fails.

### 4. Never Commit Directly on `main` or `staging`

```bash
# Check current branch
git branch --show-current

# If on main/staging, switch to dev (create it if needed)
git fetch origin --prune
git checkout dev || git checkout -b dev origin/main
```

**Why:** Direct commits to `main`/`staging` bypass the release pipeline and can cause accidental deployments.

### 5. Multi-Agent Rule: Single Writer Lock (Required)

If you’re running multiple agents (or a human + agents), do **not** let multiple processes write to the same checkout.

Before editing, committing, or pushing, enter integrator mode (writer lock + git guard):

```bash
scripts/agents/integrator-shell.sh -- codex
# or open a subshell:
scripts/agents/integrator-shell.sh
```

If the lock is held, wait:

```bash
scripts/git/writer-lock.sh status
scripts/git/writer-lock.sh acquire --wait
```

**Why:** A single checkout is safe only with a single-writer rule. The writer lock makes “save to GitHub” deterministic and prevents accidental overwrites.

---

## Branch Strategy

### Branch Types

| Branch | Purpose | Who Creates | Deploys To |
|--------|---------|-------------|------------|
| `dev` | All local commits (integration branch) | Integrator (human or designated agent) | CI only |
| `staging` | Staging deploy branch (auto from `dev`) | Pipeline (PR merge) | Staging environment |
| `main` | Production code | Pipeline (PR merge) | Production (live sites) |

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌────────────────────┐
│ Commit on   │────▶│ Push dev    │────▶│ PR dev → staging    │
│ dev         │     │ (backup)    │     │ (auto-merge)        │
└─────────────┘     └─────────────┘     └────────────────────┘
                                              │
                                              ▼
                                      Auto-deploy to staging
                                              │
                                              ▼
                                      Visual test on staging
                                              │
                                              ▼
                                   PR staging → main (auto-merge)
                                              │
                                              ▼
                                      Auto-deploy to production
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
| `pre-commit` | [require-writer-lock.sh](../scripts/git-hooks/require-writer-lock.sh) | Blocks commits unless the single-writer lock is held |
| `pre-commit` | [no-partially-staged.js](../scripts/git-hooks/no-partially-staged.js) | Blocks partially staged files before lint-staged runs |
| `pre-commit` | `lint-staged --no-stash` | Runs check-only linting on staged files without backup stashes |
| `pre-commit` | `pnpm typecheck` | Runs typecheck before committing |
| `pre-commit` | `pnpm lint` | Runs lint before committing |
| `pre-commit` | `pnpm validate:agent-context` | Checks for drift in always-on agent context files |
| `prepare-commit-msg` | [prepare-commit-msg-safety.sh](../scripts/git-hooks/prepare-commit-msg-safety.sh) | Blocks amend-style / commit-message-reuse workflows by default |
| `pre-rebase` | [pre-rebase-safety.sh](../scripts/git-hooks/pre-rebase-safety.sh) | Blocks `git rebase` by default |
| `pre-push` | [require-writer-lock.sh](../scripts/git-hooks/require-writer-lock.sh) | Blocks pushes unless the single-writer lock is held |
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

GitHub should enforce these rules on `main` and `staging`:

| Setting | Value | Why |
|---------|-------|-----|
| Require pull request | ✅ On | No direct pushes to main |
| Required approvals | 0 | No manual review required |
| Require status checks | ✅ On | CI must pass |
| Auto-merge enabled | ✅ On | Merges PRs when checks pass |
| Block force pushes | ✅ On | Prevents history destruction |

**Configuration:** GitHub → Settings → Rules → Rulesets → `main` / `staging`

### Layer 4: Agent Runner Guardrails (Optional)

Some agent tools can be configured to deny-list destructive commands (tool permissions, wrappers, command filters, etc.).

**Do not rely on this layer.** Assume *no* tool will save you from a bad git command. Follow the rules above.

If you run agents locally, you can optionally use integrator mode (writer lock + git guard):

```bash
scripts/agents/integrator-shell.sh -- <your-agent-command>
```

---

## For AI Agents (Claude/Codex)

### Session Start Checklist

```bash
# 0. If you will WRITE, start in integrator mode (writer lock + git guard)
scripts/agents/integrator-shell.sh -- codex

# 1. Check current branch (commit only on dev)
git branch --show-current

# 2. Check for uncommitted changes
git status --porcelain
# If not empty, commit them

# 3. Sync remote refs (no merge/rebase)
git fetch origin --prune
```

### During Session

- Commit after every significant change
- Push `dev` every 2 hours or 3 commits
- Ship to staging when ready: `scripts/git/ship-to-staging.sh`
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
   git log --oneline -5
   git diff --stat
   scripts/git/writer-lock.sh status
   ```
3. Share output with user
4. Say: "Git is in an unexpected state. Please advise how to proceed."
5. Wait for human guidance

---

## For Humans

### Shipping and Promotion

1. **Ship `dev` → `staging` (auto-deploy to staging)**
   ```bash
   git fetch origin --prune
   git checkout dev
   scripts/git/ship-to-staging.sh
   ```

2. **Promote `staging` → `main` (auto-deploy to production)**
   ```bash
   git fetch origin --prune
   git checkout staging
   scripts/git/promote-to-main.sh
   ```

### Emergency: Bypassing Hooks (Humans only)

**⚠️ Use only when absolutely necessary:**

```bash
# Skip pre-commit / pre-push hooks
git commit --no-verify -m "Emergency fix"
git push --no-verify

# Or: skip simple-git-hooks specifically
SKIP_SIMPLE_GIT_HOOKS=1 git push origin HEAD

# Or: skip only the writer-lock check
SKIP_WRITER_LOCK=1 git commit -m "Emergency fix"

# Never bypass in order to rewrite history or push to protected branches.
```

**Document why hooks were bypassed and follow up to fix the root cause.**

---

## Troubleshooting

### "My changes disappeared"

1. Check reflog: `git reflog`
2. Check recent commits: `git log --oneline -10`
3. **Do NOT reset to try to recover**
4. Ask for help

### "I accidentally committed to main"

1. Don’t push yet!
2. Create/move the commit onto `dev`: `git checkout -b dev`
3. Push `dev` and continue via the `dev` → `staging` pipeline

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

If GitHub rejects a push to `main`/`staging`:
1. This is expected - these branches are protected by process
2. Use the pipeline scripts instead:
   - `scripts/git/ship-to-staging.sh`
   - `scripts/git/promote-to-main.sh`

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
