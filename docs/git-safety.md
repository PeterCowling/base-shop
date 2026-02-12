Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-11

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
- stash mutation ops (`git stash` bare, `git stash push|pop|apply|drop|clear`)

If git state is confusing: stop, capture diagnostics, and ask for direction.

### 2) Use single-writer lock for any write operation

For non-interactive agents:

```bash
scripts/agents/integrator-shell.sh -- <command> [args...]
# guard-only session for long read-only work (no writer lock)
scripts/agents/integrator-shell.sh --read-only -- <command> [args...]
# lock waits are queue-ordered and wait forever by default; optional fast-fail:
scripts/agents/integrator-shell.sh --timeout 30 -- <command> [args...]
```

Lock diagnostics:

```bash
scripts/git/writer-lock.sh status
scripts/git/writer-lock.sh clean-stale   # only if holder PID is dead on this host
scripts/agents/with-writer-lock.sh -- <git-write-command>
# or: scripts/agents/integrator-shell.sh -- <command>
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

## Writer Lock System

The writer lock prevents multiple agents (or a human + agents) from writing to the same checkout simultaneously.

### Lifecycle

1. **Entry** — always go through a wrapper, never call `writer-lock.sh` directly:
   - `scripts/agents/integrator-shell.sh -- <cmd>` (lock + command guard)
   - `scripts/agents/with-writer-lock.sh -- <cmd>` (lock only)

2. **Queue** — if the lock is held, the wrapper joins a FIFO queue (ticket-numbered). Waiters poll until they reach the head of the queue AND the lock directory is free.

3. **Acquire** — atomic `mkdir` creates the lock directory. A meta file records a random token, the owner PID, timestamp, and branch.

4. **Token export** — the wrapper reads the token from the meta file and exports `BASESHOP_WRITER_LOCK_TOKEN`. Git hooks check this token to verify the caller owns the lock.

5. **Release** — on wrapper exit (normal or crash), a trap calls `writer-lock.sh release` with the matching token. The lock directory is removed.

### Enforcement layers

| Layer | Script | Blocks |
|-------|--------|--------|
| Git hooks | `require-writer-lock.sh` | `git commit`/`push` without lock or with wrong token |
| Agent git guard | `scripts/agent-bin/git` | Destructive commands, bypass env vars |
| Claude pre-tool-use hook | `.claude/hooks/pre-tool-use-git-safety.sh` | Dangerous commands before they reach bash |
| Settings ask-rules | `.claude/settings.json` | Borderline commands (requires confirmation) |

### Failure recovery

| Scenario | Recovery |
|----------|----------|
| Lock holder crashed (PID dead) | `writer-lock.sh clean-stale` |
| Lock held but stale meta | `writer-lock.sh release --force` (human only) |
| Wrapper killed while child waits in queue | Child detects its ticket was cleaned and exits (orphan protection) |
| `status` command during lock contention | Returns instantly (non-blocking read) |

### Queue invariants

- FIFO ordering: first to request, first to acquire (ticket-numbered)
- Orphan safety: waiters whose parent PID dies cannot acquire the lock
- Stale cleanup: dead-PID tickets and locks are automatically recovered

Regression tests: `scripts/__tests__/writer-lock-queue.test.ts` (5 TCs covering FIFO, orphan, contention, token lifecycle).

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
- `scripts/__tests__/writer-lock-queue.test.ts`

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
- `release --force` is a human-only break-glass action. Use it only when:
  - The lock holder PID is confirmed dead but `clean-stale` cannot resolve (e.g., stale meta).
  - You have verified no active writer is running.
- After any `release --force`, document the reason in the next commit message.
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
