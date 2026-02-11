---
Type: Idea
ID: PLAT-OPP-0004
Business: PLAT
Status: Draft
Owner: Pete
Created-Date: 2026-02-06
Tags: [safety, git, locking, agents, dx, incident-prevention]
---

# Close Gaps in Agent Safety Net (File Locking & Destructive Command Prevention)

## Summary

Harden the existing 4-layer safety system so that the protections cannot be accidentally or silently bypassed by AI agents. The goal is **zero lost work** while keeping controlled, legitimate work unblocked -- agents should wait for a lock, not fail or lose data.

## The problem

After the January 14 incident (`git reset --hard` destroyed 8 apps), we built a comprehensive safety system: writer locks, git hooks, an agent-level git guard, documentation rules, and Claude Code settings. It's good -- but it has gaps that mean the protections can still be overridden, sometimes by things we explicitly allow-listed ourselves.

**The core tension:** we're not trying to prevent agents from editing files or committing. We *want* agents to do work. What we're preventing is:

1. **Destructive operations that lose uncommitted work** -- `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean -fd`, etc.
2. **Concurrent writes that create conflicts** -- two agents editing the same files simultaneously, leading to merge messes that take longer to sort out than the original work.
3. **Force pushes or history rewrites** -- destroying shared history that other people or agents are building on.

The second principle is equally important: **don't create problems for other people or agents to sort out later.** A conflict created now becomes someone else's 30-minute detour later. Waiting 2 minutes for a lock is always cheaper.

## Known gaps (from audit)

### Gap 1: Claude Code PreToolUse hooks are empty

`.claude/settings.json` declares a `PreToolUse` hook with matcher `*` but the hooks array is empty. This means Layer 4 (the final runtime gate before a tool executes) is a no-op. `docs/incident-prevention.md` documents it as active, but it isn't.

### Gap 2: No deny list in Claude Code settings

Both `settings.json` and `settings.local.json` use only allow-lists. Critically, `settings.local.json` explicitly allows `git reset:*`, `git restore:*`, `git checkout:*`, `git stash:*`, and `git push:*` -- the wildcards match destructive variants. There is no deny-list to block `git reset --hard`, `git push --force`, etc.

### Gap 3: Hook bypass patterns are allow-listed

`SKIP_SIMPLE_GIT_HOOKS=1 git commit` and `SKIP_WRITER_LOCK=1 git` are in the allow-list in `settings.local.json`. These are documented as "human only, emergency" but there's no technical enforcement -- an agent can use them freely.

### Gap 4: Agent git guard has pattern-matching gaps

`scripts/agent-bin/git` blocks `.`, `:/`, `:/.`, `:/*` for checkout/restore but misses:
- Directory paths (`git checkout -- src/`)
- Glob patterns (`git restore -- '*.json'`)
- `git reset` without flags (defaults to `--mixed`, which can unstage and move HEAD)

### Gap 5: Agent git guard over-blocks stash

All `git stash` operations are blocked, including harmless read-only ones (`stash list`, `stash show`). AGENTS.md only forbids `stash drop` and `stash clear`.

### Gap 6: Protected-branch commit guard is orphaned

`scripts/git-hooks/block-commit-on-protected-branches.sh` exists but isn't called from the pre-commit chain. The pre-push hook blocks pushes to protected branches, but you can still commit on `main` locally and only discover the problem at push time.

### Gap 7: Git hooks don't protect uncommitted work

Hooks only fire on commit and push. `git restore`, `git checkout --`, and `git clean` happen *before* a commit and destroy uncommitted work with no hook to stop them. The only defense is the agent git guard -- but that's only active when launched via `with-git-guard.sh`.

### Gap 8: Git guard only activates in wrapper shells

The `scripts/agent-bin/git` guard requires the agent to be launched via `with-git-guard.sh` or `integrator-shell.sh`. If an agent runs outside those wrappers (which Claude Code does by default), the guard is not on PATH and real git runs unfiltered.

## Design principles

1. **Wait, don't fail.** If a lock is held, the agent waits for it. If the lock wait times out, surface the problem to the user -- don't silently bypass.
2. **Don't create problems for others.** A conflict, a broken history, or a lost stash is not just your problem -- it's the next person's problem. Err on the side of caution.
3. **Defense in depth.** No single layer should be the only thing standing between an agent and lost work. Redundancy is intentional.
4. **Controlled bypasses require humans.** Emergency overrides (`SKIP_WRITER_LOCK`, `--no-verify`, `ALLOW_GIT_REBASE`) must require explicit human approval at the point of use, not pre-authorized via allow-lists.
5. **Least surprise.** Read-only git operations should never be blocked. Agents should be able to `git status`, `git log`, `git diff`, `git stash list` without friction.

## Proposed approach (high level)

### A. Implement Claude Code PreToolUse hooks (close Layer 4)

Write actual hook scripts that run before every Bash tool call. The hooks should:
- Parse the command to detect destructive git patterns (same list as the agent git guard)
- Block and explain, rather than silently fail
- Allow all read-only git operations without friction

### B. Add deny rules to Claude Code settings

Add explicit `permissions.deny` entries for destructive patterns:
- `Bash(git reset --hard:*)`, `Bash(git push --force:*)`, `Bash(git push -f:*)`, etc.
- `Bash(SKIP_WRITER_LOCK:*)`, `Bash(SKIP_SIMPLE_GIT_HOOKS:*)` -- remove bypass patterns from the allow-list

### C. Tighten the agent git guard

- Expand checkout/restore blocking to catch directory paths and globs (not just `.` and `:/`)
- Block `git reset` without flags (bare `git reset <ref>` defaults to `--mixed`)
- Allow `git stash list` and `git stash show` (read-only) while keeping `stash push/pop/drop/clear` blocked

### D. Wire the orphaned branch guard

Add `block-commit-on-protected-branches.sh` to the pre-commit chain so commits on `main`/`master` are caught early, not at push time.

### E. Ensure git guard is always on PATH for agents

Explore making the git guard the default for all Claude Code Bash invocations, not just wrapped shells. This could be via a PreToolUse hook that prepends `scripts/agent-bin/` to PATH, or via Claude Code's environment configuration.

## What this does NOT do

- **Does not block legitimate work.** File edits, commits, pushes to feature branches, and all normal git operations remain unblocked.
- **Does not replace the writer lock.** The lock system stays as-is. This closes the gaps around it.
- **Does not implement multi-writer locking.** That's a separate, larger initiative (see `docs/plans/multi-writer-git-locking-plan.md`).

## Relationship to other work

- **Multi-writer locking plan** (`docs/plans/multi-writer-git-locking-plan.md`) -- that plan addresses concurrent multi-agent writes with path-level locks. This idea addresses the simpler problem of single-agent safety gaps. Both are needed; this one should come first.
- **Incident prevention docs** (`docs/incident-prevention.md`, `docs/git-safety.md`) -- will need updating once gaps are closed.

## Next steps

1. Fact-find: audit Claude Code hook API to confirm PreToolUse script capabilities and limitations
2. Fact-find: determine if `permissions.deny` is supported in Claude Code settings (vs. only allow-list)
3. Prototype: write a PreToolUse hook script that catches the top-5 destructive patterns
4. Test: verify the hook fires for both direct `git` calls and `env VAR=x git` patterns
5. Roll out incrementally: start with the hook, then tighten settings, then wire the branch guard
