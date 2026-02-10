Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-09

# Git Safety Guide (Agent Runbook)

> Critical incident reference: January 14, 2026 (`docs/historical/RECOVERY-PLAN-2026-01-14.md`).
> This guide defines the no-loss operating model that replaced the old workflow.

## Quick Reference

| Audience | Primary doc |
|----------|-------------|
| AI agents (Claude/Codex) | `AGENTS.md` |
| All contributors | This guide |

## Golden Rules

### 1) Never run destructive/history-rewrite commands

Forbidden in agent flow:

- `git reset --hard` / `git clean -fd`
- `git push --force`, `-f`, `--force-with-lease`
- `git rebase` (including `-i`)
- `git commit --amend`
- bulk discard patterns (`git checkout -- ...`, `git restore ...` across multiple paths/dirs/globs)
- stash-losing ops (`git stash pop|apply|drop|clear`)

If git state is confusing: stop, capture diagnostics, and ask for direction.

### 2) Use single-writer lock for any write operation

For non-interactive agents:

```bash
scripts/agents/integrator-shell.sh -- <command> [args...]
```

Lock diagnostics:

```bash
scripts/git/writer-lock.sh status
scripts/git/writer-lock.sh clean-stale   # only if holder PID is dead on this host
scripts/git/writer-lock.sh acquire --wait
```

### 3) Follow the only release path

`dev -> staging -> main`

- Commit and push on `dev`
- Ship via `scripts/git/ship-to-staging.sh`
- Promote via `scripts/git/promote-to-main.sh`

Direct commit/push to `staging` or `main` is blocked by policy and hooks.

### 4) Commit and push frequently

- commit every significant change (or <= 30 minutes)
- push `dev` regularly (<= 2 hours or <= 3 commits)

## Branch Strategy

| Branch | Purpose | Deploy target |
|--------|---------|---------------|
| `dev` | integration branch for local work | CI only |
| `staging` | pre-production branch | staging environment |
| `main` | production branch | production |

Operational scripts:

- `scripts/git/ship-to-staging.sh`
- `scripts/git/promote-to-main.sh`

## Protection Layers

### Layer 1: Policy docs

- `AGENTS.md`
- `docs/git-safety.md`
- `docs/git-hooks.md`

### Layer 2: Local hooks

| Hook | Script | Effect |
|------|--------|--------|
| `pre-commit` | `scripts/git-hooks/block-commit-on-protected-branches.sh && scripts/git-hooks/pre-commit.sh` | blocks protected-branch commits; runs staged-scope checks with writer-lock enforcement |
| `prepare-commit-msg` | `scripts/git-hooks/prepare-commit-msg-safety.sh` | blocks amend/reuse-message workflows |
| `pre-rebase` | `scripts/git-hooks/pre-rebase-safety.sh` | blocks rebase by default |
| `pre-push` | `scripts/git-hooks/pre-push.sh` | enforces writer lock, blocks unsafe pushes, runs range-scoped `scripts/validate-changes.sh` |

Install/refresh hooks:

```bash
pnpm run prepare
```

### Layer 3: GitHub branch protections

Rulesets on `staging` and `main` should enforce:

- pull requests required
- required checks must pass
- force-push blocked
- auto-merge allowed

### Layer 4: Agent git guard (Claude/Codex sessions)

`.claude/hooks/pre-tool-use-git-safety.sh` blocks destructive commands and hook-bypass attempts (`--no-verify`, `-n`, `SKIP_WRITER_LOCK`, `SKIP_SIMPLE_GIT_HOOKS`) before execution.

Regression tests:

- `scripts/__tests__/pre-tool-use-git-safety.test.ts`
- `scripts/__tests__/git-safety-policy.test.ts`

## Conflict-Safe Merge Procedure (No-Loss)

Use this when push is rejected because remote advanced.

1. Create safety anchor:

```bash
git rev-parse HEAD
git branch backup/pre-merge-$(date +%Y%m%d-%H%M%S)
```

2. Merge additively (no rebase/force):

```bash
git fetch origin --prune
git merge --no-ff origin/dev
```

3. Resolve conflicts file-by-file:

```bash
git diff --name-only --diff-filter=U
```

Never use bulk `ours/theirs` checkout or bulk discard shortcuts.

4. Lockfile conflict rule:

Regenerate lockfile from declarative sources where appropriate (for pnpm: `pnpm install --lockfile-only`), then re-run validation.

5. Validate and push:

```bash
bash scripts/validate-changes.sh
git push origin dev
```

## Agent Session Checklist

### Start

```bash
git branch --show-current
git status --porcelain
git fetch origin --prune
```

If writing, run write commands via integrator wrapper.

### During

- keep changes small and committed
- avoid stash-based workflows
- run targeted validation before commit/push

### End

```bash
git add <paths>
git commit -m "<message>"
git push origin dev
```

## Human Break-Glass Policy

- Human-only emergency bypasses are outside standard agent flow.
- Agents must never bypass hooks or guards.
- If an emergency bypass occurs, document reason and follow-up remediation in repo history.

## Troubleshooting

### "I accidentally committed on main/staging"

Do not rewrite history. Move forward safely:

```bash
git fetch origin --prune
git switch dev || git switch -c dev origin/dev || git switch -c dev origin/main
```

Then re-commit/cherry-pick as needed and continue through `dev -> staging -> main`.

### "Hooks are not running"

```bash
pnpm run prepare
hooks_dir="$(git config --get core.hooksPath || git rev-parse --git-path hooks)"
cat "$hooks_dir/pre-commit"
ls -la "$hooks_dir/pre-commit"
```

### "Push rejected"

Protected branches reject direct pushes by design.

Use:

- `scripts/git/ship-to-staging.sh`
- `scripts/git/promote-to-main.sh`

## Related Docs

- `AGENTS.md`
- `docs/git-hooks.md`
- `docs/testing-policy.md`
- `docs/historical/RECOVERY-PLAN-2026-01-14.md`
