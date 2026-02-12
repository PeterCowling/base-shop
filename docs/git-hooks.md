Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-09

# Git Hooks (Agent Runbook)

> Related: [Git Safety Guide](./git-safety.md)

This repo uses [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) to enforce safety and quality checks before commit/push.

## Overview

Hooks are installed by `pnpm install` via the `prepare` script in `package.json`.

`prepare` runs `scripts/git-hooks/install-hooks.sh`, which sets `core.hooksPath` correctly and then installs simple-git-hooks.

## Active Hooks

| Hook | Script entrypoint | Purpose |
|------|-------------------|---------|
| `pre-commit` | `scripts/git-hooks/block-commit-on-protected-branches.sh && scripts/git-hooks/pre-commit.sh` | Blocks commits on protected branches, then runs staged-scope checks with writer-lock enforcement |
| `prepare-commit-msg` | `scripts/git-hooks/prepare-commit-msg-safety.sh` | Blocks amend/reuse-message flows that rewrite history |
| `pre-rebase` | `scripts/git-hooks/pre-rebase-safety.sh` | Blocks `git rebase` by default |
| `pre-push` | `scripts/git-hooks/pre-push.sh` | Enforces writer-lock, blocks unsafe pushes, and runs range-scoped validation |

## Pre-commit Flow

`pre-commit.sh` runs these checks in order:

1. `pre-commit-check-env.sh`
2. `require-writer-lock.sh`
3. `no-partially-staged.js`
4. `run-lint-staged.sh`
5. `typecheck-staged.sh`
6. `lint-staged-packages.sh`
7. `pnpm validate:agent-context`

Key behavior:

- scope is staged changes (not full-repo typecheck/lint)
- partial staging is blocked to avoid accidental hunk mutation
- lockfile/writer-lock guard is always enforced

## Pre-push Flow

Entry script: `scripts/git-hooks/pre-push.sh`

`pre-push.sh` does the following:

1. Runs `require-writer-lock.sh`
2. Runs `pre-push-safety.sh` on the pushed ref updates from stdin
3. For each branch update being pushed, computes a git range and runs:
   - `STRICT=1 VALIDATE_RANGE=<range> bash scripts/validate-changes.sh`

Key behavior:

- direct pushes to `main`/`staging`/`master` are blocked
- non-fast-forward pushes are blocked
- validation is scoped to the pushed delta, not full repository

## Hook Configuration

`package.json`:

```json
"simple-git-hooks": {
  "pre-commit": "scripts/git-hooks/block-commit-on-protected-branches.sh && scripts/git-hooks/pre-commit.sh",
  "prepare-commit-msg": "scripts/git-hooks/prepare-commit-msg-safety.sh",
  "pre-rebase": "scripts/git-hooks/pre-rebase-safety.sh",
  "pre-push": "scripts/git-hooks/pre-push.sh"
}
```

After hook changes:

```bash
pnpm run prepare
```

## Safety and Bypass Policy

- Agents must not bypass hooks (`--no-verify`, `-n`, `SKIP_SIMPLE_GIT_HOOKS=1`, `SKIP_WRITER_LOCK=1`).
- In Claude/Codex guarded sessions these bypasses are also blocked by `.claude/hooks/pre-tool-use-git-safety.sh`.
- If a hook blocks needed work, fix root cause or escalate to a human; do not bypass in agent flow.

## Troubleshooting

### Hooks are not running

```bash
pnpm run prepare
hooks_dir="$(git config --get core.hooksPath || git rev-parse --git-path hooks)"
cat "$hooks_dir/pre-commit"
ls -la "$hooks_dir/pre-commit"
```

### Hook script not found

```bash
ls scripts/git-hooks/pre-commit.sh
chmod +x scripts/git-hooks/pre-commit.sh
pnpm run prepare
```

### Writer lock failures

```bash
scripts/git/writer-lock.sh status
scripts/git/writer-lock.sh clean-stale   # only if holder PID is dead on this host
scripts/git/writer-lock.sh acquire --wait
```

## Related Files

- `scripts/git-hooks/pre-commit.sh`
- `scripts/git-hooks/pre-push.sh`
- `scripts/git-hooks/pre-push-safety.sh`
- `scripts/git-hooks/require-writer-lock.sh`
- `.claude/hooks/pre-tool-use-git-safety.sh`
- `scripts/__tests__/pre-tool-use-git-safety.test.ts`
- `scripts/__tests__/git-safety-policy.test.ts`
