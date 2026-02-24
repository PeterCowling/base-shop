Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-23

# Git Safety Guide (Agent Runbook)

> Critical incident reference: January 14, 2026 (`docs/historical/RECOVERY-PLAN-2026-01-14.md`).
> This guide defines the no-loss operating model that replaced the old workflow.

## Quick Reference

| Audience | Primary doc |
|----------|-------------|
| AI agents (Claude/Codex) | `AGENTS.md` |
| All contributors | This guide |

<!-- BEGIN BASESHOP_GIT_SAFETY_POLICY_KERNEL -->

## Command Policy Kernel (Canonical)

This fenced YAML block is the canonical, machine-readable source of truth for git safety policy.
Generators and tests must derive from this kernel to prevent drift between layers.

```yaml baseshop-git-safety-policy
schemaVersion: 1
policyId: baseshop-git-safety

evaluation:
  resolution: priority_then_first_match
  defaultEffect: allow
  # If a platform cannot implement interactive "ask", treat ask as deny.
  askBehavior: deny_if_noninteractive

# Semantic rules for runtime enforcement. Platform adapters (e.g. Claude permissions
# matchers) should be derived from these rules where possible.
rules:
  - id: deny.skip_bypass_env
    effect: deny
    priority: 1000
    rationale: Prevent bypassing writer lock / safety hooks in agent workflows.
    match:
      kind: env_var
      names: [SKIP_WRITER_LOCK, SKIP_SIMPLE_GIT_HOOKS]

  - id: deny.skip_bypass_arg
    effect: deny
    priority: 995
    rationale: Prevent bypassing writer lock / safety hooks by passing SKIP_* as arguments.
    match:
      kind: argv_regex_any
      patterns: ["^SKIP_(WRITER_LOCK|SIMPLE_GIT_HOOKS)(=|$)"]

  - id: deny.hooks_path_bypass
    effect: deny
    priority: 990
    rationale: Prevent bypassing git hooks via core.hooksPath.
    match:
      kind: git_hooks_path

  - id: deny.worktree
    effect: deny
    priority: 980
    rationale: Worktrees create additional checkouts and are forbidden in this repo.
    match:
      kind: git_argv
      subcommand: worktree

  - id: deny.rebase
    effect: deny
    priority: 970
    rationale: Rebase rewrites history and is forbidden by default.
    match:
      kind: git_argv
      subcommand: rebase

  - id: deny.commit_amend
    effect: deny
    priority: 960
    rationale: Amend rewrites history; use a new commit instead.
    match:
      kind: git_argv
      subcommand: commit
      flagsAny: [--amend]

  - id: deny.commit_no_verify
    effect: deny
    priority: 955
    rationale: --no-verify bypasses safety hooks.
    match:
      kind: git_argv
      subcommand: commit
      flagsAny: [--no-verify, -n]

  - id: deny.force_push
    effect: deny
    priority: 950
    rationale: Force-push can overwrite remote history.
    match:
      kind: git_argv
      subcommand: push
      flagsAny: [-f, --force, --force-with-lease, --mirror]

  - id: deny.push_no_verify
    effect: deny
    priority: 945
    rationale: --no-verify bypasses safety hooks.
    match:
      kind: git_argv
      subcommand: push
      flagsAny: [--no-verify, -n]

  - id: deny.reset_modes
    effect: deny
    priority: 940
    rationale: Reset with mode flags can destroy working tree state.
    match:
      kind: git_argv
      subcommand: reset
      flagsAny: [--hard, --mixed, --merge, --keep]

  - id: ask.reset_head_tilde
    effect: ask
    priority: 930
    rationale: Bare reset to earlier commits is risky; requires explicit confirmation.
    match:
      kind: git_argv
      subcommand: reset
      argsAnyRegex: ["^HEAD~[0-9]*$"]

  - id: deny.checkout_force
    effect: deny
    priority: 915
    rationale: checkout --force discards local changes.
    match:
      kind: git_argv
      subcommand: checkout
      flagsAny: [-f, --force]

  - id: deny.restore_worktree
    effect: deny
    priority: 914
    rationale: restore --worktree can discard working tree changes.
    match:
      kind: git_argv
      subcommand: restore
      flagsAny: [--worktree]

  - id: deny.switch_discard
    effect: deny
    priority: 913
    rationale: switch --discard-changes/--force discards local changes.
    match:
      kind: git_argv
      subcommand: switch
      flagsAny: [--discard-changes, -f, --force]

  - id: deny.clean_force
    effect: deny
    priority: 920
    rationale: Clean with force deletes untracked files; require dry-run first.
    match:
      kind: git_argv
      subcommand: clean
      flagsRegexAny: ["^-.*f"]
      flagsNone: [-n, --dry-run]

  - id: deny.stash_mutations
    effect: deny
    priority: 910
    rationale: Stash mutations hide work and create conflict debt in a multi-agent repo.
    match:
      kind: git_stash
      allowSubcommands: [list, show]
      denySubcommands: [push, pop, apply, drop, clear]
      denyBare: true
      denyUnknown: true

  - id: deny.checkout_restore_bulk_discards
    effect: deny
    priority: 905
    rationale: Bulk worktree discards are forbidden; only single-file restores are allowed.
    match:
      kind: git_checkout_restore_pathspecs

  - id: deny.config_set_hooks_path
    effect: deny
    priority: 900
    rationale: Setting core.hooksPath bypasses safety hooks.
    match:
      kind: git_config_set_key
      key: core.hooksPath

  - id: allow.clean_dry_run
    effect: allow
    priority: 100
    rationale: Dry-run clean is safe.
    match:
      kind: git_argv
      subcommand: clean
      flagsAny: [-n, --dry-run]
claudePermissions:
  deny:
    - Bash(git reset --hard:*)
    - Bash(git reset --merge:*)
    - Bash(git reset --keep:*)
    - Bash(git clean -f:*)
    - Bash(git clean -fd:*)
    - Bash(git clean -fdx:*)
    - Bash(git clean -ffdx:*)
    - Bash(git checkout -f:*)
    - Bash(git checkout --force:*)
    - Bash(git checkout -- .:*)
    - Bash(git restore .:*)
    - Bash(git restore --worktree:*)
    - Bash(git switch --discard-changes:*)
    - Bash(git switch -f:*)
    - Bash(git push --force:*)
    - Bash(git push -f:*)
    - Bash(git push --force-with-lease:*)
    - Bash(git push --mirror:*)
    - Bash(git rebase:*)
    - Bash(git commit --amend:*)
    - Bash(git stash push:*)
    - Bash(git stash pop:*)
    - Bash(git stash apply:*)
    - Bash(git stash drop:*)
    - Bash(git stash clear:*)
    - Bash(git worktree:*)
    - Bash(git -c core.hooksPath:*)
    - Bash(git config core.hooksPath:*)
    - Bash(/usr/bin/git reset:*)
    - Bash(/usr/bin/git clean:*)
    - Bash(/usr/bin/git checkout -f:*)
    - Bash(/usr/bin/git push --force:*)
    - Bash(/opt/homebrew/bin/git reset:*)
    - Bash(/opt/homebrew/bin/git clean:*)
  ask:
    - Bash(git commit --no-verify:*)
    - Bash(git commit -n:*)
    - Bash(git push --no-verify:*)
    - Bash(SKIP_WRITER_LOCK=1:*)
    - Bash(SKIP_SIMPLE_GIT_HOOKS=1:*)
    - Bash(ALLOW_GIT_REBASE=1:*)
    - Bash(ALLOW_COMMIT_MSG_REUSE=1:*)
    - Bash(ALLOW_COMMIT_ON_PROTECTED_BRANCH=1:*)
    - Bash(git restore:*)
    - Bash(git checkout --:*)
    - Bash(git reset HEAD~:*)
    - Bash(git push origin --delete:*)
    - Bash(git push origin ::*)
  allow:
    - Bash(head:*)
    - Bash(git status:*)
    - Bash(git log:*)
    - Bash(git diff:*)
    - Bash(git show:*)
    - Bash(git branch:*)
    - Bash(git remote:*)
    - Bash(git fetch:*)
    - Bash(git add:*)
    - Bash(git rm --cached:*)
    - Bash(git commit -m:*)
    - Bash(git push origin:*)
    - Bash(git pull --ff-only:*)
    - Bash(git stash list:*)
    - Bash(git stash show:*)
    - Bash(git reset HEAD:*)
    - Bash(git restore --staged:*)
    - Bash(git cherry-pick:*)
    - Bash(git tag:*)
    - Bash(git clean --dry-run:*)
    - Bash(git clean -n:*)
    - Bash(git ls-files:*)
    - Bash(git ls-tree:*)
    - Bash(git rev-parse:*)
    - Bash(git check-ignore:*)
    - Bash(git fsck:*)
    - Bash(git read-tree:*)
    - Bash(git mv:*)
policyTable:
  - id: TC-01
    command: git reset --hard HEAD
    args:
      - reset
      - --hard
      - HEAD
    expectedDecision: deny
    description: reset --hard
  - id: TC-02
    command: git clean -fd
    args:
      - clean
      - -fd
    expectedDecision: deny
    description: clean -fd
  - id: TC-03
    command: git clean -f
    args:
      - clean
      - -f
    expectedDecision: deny
    description: clean -f alone
  - id: TC-04
    command: git push --force origin main
    args:
      - push
      - --force
      - origin
      - main
    expectedDecision: deny
    description: push --force
  - id: TC-05
    command: git push --force-with-lease
    args:
      - push
      - --force-with-lease
    expectedDecision: deny
    description: push --force-with-lease
  - id: TC-06
    command: git push --mirror
    args:
      - push
      - --mirror
    expectedDecision: deny
    description: push --mirror
  - id: TC-07
    command: git checkout -- .
    args:
      - checkout
      - --
      - .
    expectedDecision: deny
    description: checkout -- .
  - id: TC-08
    command: git checkout -- src/
    args:
      - checkout
      - --
      - src/
    expectedDecision: deny
    description: checkout -- dir/
  - id: TC-09
    command: git restore .
    args:
      - restore
      - .
    expectedDecision: deny
    description: restore .
  - id: TC-10
    command: git switch --discard-changes main
    args:
      - switch
      - --discard-changes
      - main
    expectedDecision: deny
    description: switch --discard-changes
  - id: TC-11
    command: git checkout -f main
    args:
      - checkout
      - -f
      - main
    expectedDecision: deny
    description: checkout -f
  - id: TC-12
    command: git rebase main
    args:
      - rebase
      - main
    expectedDecision: deny
    description: rebase
  - id: TC-13
    command: git commit --amend
    args:
      - commit
      - --amend
    expectedDecision: deny
    description: commit --amend
  - id: TC-14
    command: git stash drop
    args:
      - stash
      - drop
    expectedDecision: deny
    description: stash drop
  - id: TC-15
    command: git stash clear
    args:
      - stash
      - clear
    expectedDecision: deny
    description: stash clear
  - id: TC-24
    command: git stash push
    args:
      - stash
      - push
    expectedDecision: deny
    description: stash push
  - id: TC-72
    command: git stash
    args:
      - stash
    expectedDecision: deny
    description: bare stash
  - id: TC-16
    command: git worktree add ../foo
    args:
      - worktree
      - add
      - ../foo
    expectedDecision: deny
    description: worktree
  - id: TC-17
    command: git -c core.hooksPath=/dev/null commit
    args:
      - -c
      - core.hooksPath=/dev/null
      - commit
    expectedDecision: deny
    description: -c core.hooksPath (hook bypass)
  - id: TC-18
    command: git config core.hooksPath /dev/null
    args:
      - config
      - core.hooksPath
      - /dev/null
    expectedDecision: deny
    description: config core.hooksPath
  - id: TC-30
    command: git reset --merge
    args:
      - reset
      - --merge
    expectedDecision: deny
    description: reset --merge
  - id: TC-31
    command: git reset --keep
    args:
      - reset
      - --keep
    expectedDecision: deny
    description: reset --keep
  - id: TC-46
    command: git checkout -f main
    args:
      - checkout
      - -f
      - main
    expectedDecision: deny
    description: checkout -f (force flag)
    skipHook: true
  - id: TC-47
    command: git switch --discard-changes main
    args:
      - switch
      - --discard-changes
      - main
    expectedDecision: deny
    description: switch --discard-changes
    skipHook: true
  - id: TC-48
    command: git clean -f
    args:
      - clean
      - -f
    expectedDecision: deny
    description: clean -f alone (guard)
    skipHook: true
  - id: TC-49
    command: git clean -fdx
    args:
      - clean
      - -fdx
    expectedDecision: deny
    description: clean -fdx
  - id: TC-51
    command: git checkout -- src/
    args:
      - checkout
      - --
      - src/
    expectedDecision: deny
    description: checkout -- dir/ (guard)
    skipHook: true
  - id: TC-56
    command: git stash pop
    args:
      - stash
      - pop
    expectedDecision: deny
    description: stash pop
  - id: TC-55
    command: git stash push
    args:
      - stash
      - push
    expectedDecision: deny
    description: stash push (guard)
    skipHook: true
  - id: TC-60
    command: git reset HEAD~1
    args:
      - reset
      - HEAD~1
    expectedDecision: deny
    description: bare reset HEAD~1
    skipHook: true
  - id: TC-61
    command: git -c core.hooksPath=/dev/null commit
    args:
      - -c
      - core.hooksPath=/dev/null
      - commit
    expectedDecision: deny
    description: -c core.hooksPath (guard)
    skipHook: true
  - id: TC-62
    command: git commit --no-verify -m x
    args:
      - commit
      - --no-verify
      - -m
      - x
    expectedDecision: deny
    description: commit --no-verify (guard hard-block)
    skipHook: true
  - id: TC-63
    command: git push --mirror
    args:
      - push
      - --mirror
    expectedDecision: deny
    description: push --mirror (guard)
    skipHook: true
  - id: TC-67
    command: git config core.hooksPath /dev/null
    args:
      - config
      - core.hooksPath
      - /dev/null
    expectedDecision: deny
    description: config core.hooksPath (guard)
    skipHook: true
  - id: TC-68
    command: SKIP_WRITER_LOCK=1 git status
    args:
      - status
    expectedDecision: deny
    description: SKIP_WRITER_LOCK env var (guard)
    skipHook: true
    guardEnv:
      SKIP_WRITER_LOCK: "1"
  - id: TC-69
    command: SKIP_SIMPLE_GIT_HOOKS=1 git status
    args:
      - status
    expectedDecision: deny
    description: SKIP_SIMPLE_GIT_HOOKS env var (guard)
    skipHook: true
    guardEnv:
      SKIP_SIMPLE_GIT_HOOKS: "1"
  - id: TC-70
    command: git restore -- file-a.txt file-b.txt
    args:
      - restore
      - --
      - file-a.txt
      - file-b.txt
    expectedDecision: deny
    description: restore multi-path pathspec (guard)
    skipHook: true
  - id: TC-71
    command: git checkout -- file-a.txt file-b.txt
    args:
      - checkout
      - --
      - file-a.txt
      - file-b.txt
    expectedDecision: deny
    description: checkout multi-path pathspec (guard)
    skipHook: true
  - id: TC-EXTRA-01
    command: git clean -ffdx
    args:
      - clean
      - -ffdx
    expectedDecision: deny
    description: clean -ffdx (combined flags)
  - id: TC-EXTRA-02
    command: git push -f origin main
    args:
      - push
      - -f
      - origin
      - main
    expectedDecision: deny
    description: push -f (short flag)
  - id: TC-EXTRA-03
    command: git checkout --force main
    args:
      - checkout
      - --force
      - main
    expectedDecision: deny
    description: checkout --force (long flag)
  - id: TC-EXTRA-04
    command: git switch -f main
    args:
      - switch
      - -f
      - main
    expectedDecision: deny
    description: switch -f (short flag)
  - id: TC-EXTRA-05
    command: git restore src/
    args:
      - restore
      - src/
    expectedDecision: deny
    description: restore directory path
  - id: TC-EXTRA-06
    command: git stash apply
    args:
      - stash
      - apply
    expectedDecision: deny
    description: stash apply
  - id: TC-20
    command: git status
    args:
      - status
    expectedDecision: allow
    description: status (read-only)
  - id: TC-21
    command: git commit -m "test"
    args:
      - commit
      - -m
      - test
    expectedDecision: allow
    description: normal commit
  - id: TC-22
    command: git push origin feature-branch
    args:
      - push
      - origin
      - feature-branch
    expectedDecision: allow
    description: normal push
  - id: TC-23
    command: git stash list
    args:
      - stash
      - list
    expectedDecision: allow
    description: stash list
  - id: TC-25
    command: git add .
    args:
      - add
      - .
    expectedDecision: allow
    description: add
  - id: TC-26
    command: git log --oneline
    args:
      - log
      - --oneline
    expectedDecision: allow
    description: log
  - id: TC-27
    command: ls -la
    args: []
    expectedDecision: allow
    description: non-git command
    skipGuard: true
  - id: TC-28
    command: git reset HEAD file.txt
    args:
      - reset
      - HEAD
      - file.txt
    expectedDecision: allow
    description: reset HEAD file (unstage)
  - id: TC-29
    command: git clean --dry-run
    args:
      - clean
      - --dry-run
    expectedDecision: allow
    description: clean dry-run
  - id: TC-50
    command: git clean --dry-run
    args:
      - clean
      - --dry-run
    expectedDecision: allow
    description: clean dry-run (guard)
    skipHook: true
  - id: TC-53
    command: git stash list
    args:
      - stash
      - list
    expectedDecision: allow
    description: stash list (guard)
    skipHook: true
  - id: TC-54
    command: git stash show
    args:
      - stash
      - show
    expectedDecision: allow
    description: stash show
  - id: TC-59
    command: git reset HEAD file.txt
    args:
      - reset
      - HEAD
      - file.txt
    expectedDecision: allow
    description: reset HEAD file (unstage, guard)
    skipHook: true
  - id: TC-64
    command: git push origin feature
    args:
      - push
      - origin
      - feature
    expectedDecision: allow
    description: push origin feature (guard)
    skipHook: true
  - id: TC-65
    command: git commit -m "test"
    args:
      - commit
      - -m
      - test
    expectedDecision: allow
    description: normal commit (guard)
    skipHook: true
  - id: TC-66
    command: git status
    args:
      - status
    expectedDecision: allow
    description: status (guard passthrough)
    skipHook: true
  - id: TC-EXTRA-07
    command: git diff --stat
    args:
      - diff
      - --stat
    expectedDecision: allow
    description: diff (read-only)
  - id: TC-EXTRA-08
    command: git fetch origin
    args:
      - fetch
      - origin
    expectedDecision: allow
    description: fetch
  - id: TC-EXTRA-09
    command: git branch -a
    args:
      - branch
      - -a
    expectedDecision: allow
    description: branch list
  - id: TC-EXTRA-10
    command: git tag v1.0.0
    args:
      - tag
      - v1.0.0
    expectedDecision: allow
    description: tag
  - id: TC-EXTRA-11
    command: git clean -n
    args:
      - clean
      - -n
    expectedDecision: allow
    description: clean -n (dry-run short flag)
  - id: TC-EXTRA-12
    command: git restore --staged file.txt
    args:
      - restore
      - --staged
      - file.txt
    expectedDecision: allow
    description: restore --staged (unstage)
  - id: TC-EXTRA-13
    command: git restore -- file.txt
    args:
      - restore
      - --
      - file.txt
    expectedDecision: allow
    description: restore single-file pathspec
  - id: TC-EXTRA-14
    command: git checkout -- file.txt
    args:
      - checkout
      - --
      - file.txt
    expectedDecision: allow
    description: checkout single-file pathspec
```

Update flow:
- Edit the YAML kernel above.
- Regenerate artifacts: `scripts/agents/generate-git-safety-policy --write`.

<!-- END BASESHOP_GIT_SAFETY_POLICY_KERNEL -->
## Golden Rules

### 1) Never run destructive/history-rewrite commands

Forbidden in agent flow:

- `git reset --hard` / `git clean -fd`
- `git push --force`, `-f`, `--force-with-lease`
- `git rebase` (including `-i`)
- `git commit --amend`
- bulk discard patterns (`git checkout -- ...`, `git restore ...` across multiple paths/dirs/globs)
- stash mutation ops (`git stash` bare, `git stash push|pop|apply|drop|clear`)

**Multi-agent environment:** Base-Shop supports multiple agents working concurrently. Finding files, commits, or branches created by other agents is **normal and expected**. The writer lock ensures only one agent writes at a time, but you may see work from other agents between your sessions.

**When to stop:** If git state is internally inconsistent (conflicts, detached HEAD, branch structure violations, corrupt state), stop, capture diagnostics, and ask for direction. Proceed normally when you encounter files or commits from other agents.

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
| `pre-push` | `scripts/git-hooks/pre-push.sh` | enforces writer lock, blocks unsafe pushes, runs range-scoped `scripts/validate-changes.sh` (forces `VALIDATE_INCLUDE_TESTS=0`) |

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

Default `validate-changes.sh` execution is policy + typecheck + lint. Use `VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh` only when you intentionally want local targeted tests.

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
