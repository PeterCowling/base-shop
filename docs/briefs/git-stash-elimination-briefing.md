---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Repo
Created: 2026-02-10
Last-updated: 2026-02-10
Topic-Slug: git-stash-elimination
---

# Git Stash Elimination Briefing

## Executive Summary

Git stash is a one-way street for agents: they can `push` but can never `pop`, `apply`, `drop`, or `clear` — all are hard-blocked by the safety layers. This means every stash an agent creates becomes permanent orphaned debt requiring human cleanup. There are **4 orphaned stash entries right now** proving this is an active problem, not theoretical.

The solution is to ban `git stash push` from agent workflows entirely and replace every use case with **checkpoint commits** — the only fully autonomous, no-intervention alternative.

## Questions Answered

- Q1: Where is `git stash` used in the codebase today?
- Q2: What are the safety layers around stash operations?
- Q3: Why does stash create a mess for agents?
- Q4: What are the alternatives that require zero user intervention?
- Q5: What needs to change to eliminate stash from agent workflows?

## Current State: Stash in the Safety Layers

### Layer-by-Layer Stash Policy

| Operation | PreToolUse Hook (L4) | Agent Git Guard (L3) | Settings Permissions (L5) |
|-----------|---------------------|---------------------|--------------------------|
| `stash list` | ALLOW (line 185) | ALLOW (line 278) | allow list (line 91) |
| `stash show` | ALLOW (line 185) | ALLOW (line 278) | allow list (line 92) |
| `stash push` | **ALLOW** (line 185) | **ALLOW** (line 278) | **allow list** (line 93) |
| `stash pop` | **NOT BLOCKED** (gap) | DENY (line 281-282) | ask-gate (line 72) |
| `stash apply` | **NOT BLOCKED** (gap) | DENY (line 281-282) | ask-gate (line 73) |
| `stash drop` | DENY (line 140) | DENY (line 281-282) | deny list (line 48) |
| `stash clear` | DENY (line 140) | DENY (line 281-282) | deny list (line 49) |

**Key insight**: `stash push` is explicitly allowed at all 3 layers, but every operation needed to *use* or *clean up* the stash is blocked. This creates a roach motel: stashes check in but they don't check out.

### Evidence: 4 Orphaned Stash Entries Right Now

```
stash@{0}: On dev: stash WIP for staging push 2
stash@{1}: On dev: stash unrelated WIP for staging push
stash@{2}: On dev: codex-temp-ship-to-staging-1770706159
stash@{3}: On dev: codex-temp-ship-to-staging-2026-02-09
```

These were created by Codex agents attempting to stash dirty working trees before running `ship-to-staging.sh` (which requires a clean tree). The agents could push to stash but then could never pop/apply the stash back, leaving 4 permanent orphans.

### Historical Incident: January 14, 2026

The Recovery Plan (`docs/historical/RECOVERY-PLAN-2026-01-14.md`) documents exactly this failure mode:

1. lint-staged auto-stashed 179 files into `stash@{0}`
2. Agent tried `git stash pop` → merge conflicts
3. Agent panicked → `git reset --hard HEAD` → `git reset --hard 59f17b748` → **catastrophic data loss**

This incident is why `stash pop|apply|drop|clear` were hard-blocked. But `stash push` was left allowed, creating the current one-way-street problem.

### lint-staged: Already Fixed

The `lint-staged` auto-stash problem was already solved (`docs/historical/plans/lint-staged-autostash-avoidance-plan.md`, completed 2026-01-17):

- `run-lint-staged.sh` runs `lint-staged --no-stash` (line 23)
- `no-partially-staged.js` blocks partial staging before lint-staged runs
- lint-staged hooks are check-only (no `--fix`)

This path no longer creates stash entries.

### ops-ship Skill: Already Correct in Policy, Not Enforced

The skill doc (`.claude/skills/ops-ship/SKILL.md`) already says:

> Default policy is **no new stashes** ... creating a stash that cannot be safely restored/cleared creates hidden debt

But `git stash push` is still in the allow list, so enforcement doesn't match policy.

## Why Stash Doesn't Work for Agents

| Property | Required for autonomous operation | Stash behavior |
|----------|----------------------------------|----------------|
| Push data | Yes | Works |
| Retrieve data | Yes | **Blocked** (`pop`/`apply` denied) |
| Clean up | Yes | **Blocked** (`drop`/`clear` denied) |
| Conflict-free restore | Yes | **No** (pop can cause merge conflicts) |
| Works without user intervention | Yes | **No** (stuck forever once pushed) |

Stash is fundamentally unsuitable for autonomous agent workflows because retrieval and cleanup both require human intervention.

## Alternatives: What Works Without User Intervention

### 1. Checkpoint Commits (Recommended)

**Pattern**: Commit work-in-progress to the current branch before any operation that requires a clean tree.

```bash
git add <specific-files>
git commit -m "wip: checkpoint before <operation>"
# ... do the operation ...
# work continues on top of the checkpoint commit
```

**Why it works for agents**:
- Commit is allowed and fully autonomous
- No retrieval problem — code stays in the branch history
- No cleanup needed — gets squashed/rebased by humans during PR review if needed
- No conflict risk — linear history on the branch
- `git log` shows what happened (full audit trail)

**Trade-off**: Creates "noise" commits. But these are on `dev`, not `main`, and are trivially cleaned up during the PR merge (squash merge).

### 2. Stage-Only Workflow (Already Policy)

**Pattern**: Only stage intended files, leave everything else unstaged. Don't try to hide unrelated work.

```bash
git add <only-the-files-I-want-to-commit>
git commit -m "<message>"
```

This is already the stated policy in `ops-ship` SKILL.md:
> stage only intended files with explicit paths; leave unrelated edits unstaged and untouched

### 3. Temporary Branch (For Complex Cases)

**Pattern**: Branch, commit WIP, switch back.

```bash
git checkout -b temp/wip-$(date +%s)
git add -A && git commit -m "wip: parking unrelated changes"
git checkout dev
```

**When to use**: When the working tree is so dirty that selective staging is impractical. However, this is rarely needed if agents follow the checkpoint commit pattern.

### Recommendation

**Use checkpoint commits as the sole mechanism.** They are:
- Fully autonomous (no blocked operations)
- Self-documenting (visible in `git log`)
- Zero cleanup risk
- Already aligned with "commit frequently" policy in `docs/git-safety.md`

## What Needs to Change

### 1. Block `git stash push` in all safety layers

Move `stash push` from "allowed" to "denied" across all 3 layers:

- `.claude/settings.json`: move `Bash(git stash push:*)` from `allow` to `deny`
- `.claude/hooks/pre-tool-use-git-safety.sh`: change the allow pattern from `list|show|push` to `list|show`
- `scripts/agent-bin/git`: change the stash allow list from `list|show|push` to `list|show`

### 2. Block bare `git stash` (defaults to push)

The agent-bin/git wrapper currently allows bare `git stash` (line 284-286). This should be blocked.

### 3. Close the PreToolUse hook gap for pop/apply

The PreToolUse hook does NOT block `stash pop` or `stash apply` (acknowledged gap in `docs/briefs/git-conflict-enforcement-balance-fact-find.md`, Finding 4). Add these to the deny patterns.

### 4. Update policy docs

- `docs/git-safety.md`: add "no stash push" to golden rules
- `AGENTS.md`: extend forbidden list from `stash drop/clear` to all stash mutations
- `.claude/skills/ops-ship/SKILL.md`: move `stash push` from "safe sharp tools" to "hard-blocked"; document checkpoint commit as the replacement pattern

### 5. Update test cases

- `scripts/__tests__/git-safety-policy.test.ts`: change TC-24/TC-55 (`stash push`) from `allow` to `deny`
- `scripts/__tests__/pre-tool-use-git-safety.test.ts`: change `stash push` from allowed to blocked; add `stash pop` and `stash apply` as blocked
- Add test case for bare `git stash` (deny)

### 6. Clean up existing orphaned stashes

The 4 orphaned stashes need human cleanup:
```bash
git stash list          # review
git stash show -p stash@{N}  # inspect each
git stash drop stash@{N}     # or git stash clear
```

## Files Involved

| File | Role | Change needed |
|------|------|---------------|
| `.claude/settings.json` | L5 permissions | Move `stash push` allow→deny; add `stash pop`/`stash apply` to deny |
| `.claude/hooks/pre-tool-use-git-safety.sh` | L4 PreToolUse hook | Block `push`; add `pop`/`apply` to deny |
| `scripts/agent-bin/git` | L3 agent guard | Block `push` and bare `stash` |
| `docs/git-safety.md` | Policy doc | Update stash rules |
| `AGENTS.md` | Agent instructions | Update forbidden list |
| `.claude/skills/ops-ship/SKILL.md` | Commit skill | Update stash policy; add checkpoint commit pattern |
| `scripts/__tests__/git-safety-policy.test.ts` | L3 tests | Update expected decisions |
| `scripts/__tests__/pre-tool-use-git-safety.test.ts` | L4 tests | Update expected decisions |

## Unknowns / Follow-ups

- Unknown: Are there any other agent scripts (outside the repo, in Codex configs) that use `git stash push`?
  - How to verify: Search Codex session logs for `git stash push` usage patterns.
- Unknown: Do the 4 orphaned stash entries contain any unique work not committed elsewhere?
  - How to verify: `git stash show -p stash@{N}` for each, compare against committed code.

## If You Later Want to Change This (Non-plan)

- **Likely change points**: The 3 safety layers (settings.json, PreToolUse hook, agent-bin/git) and the test files.
- **Key risks**: Blocking stash push is a narrowing change (removes capability). If any workflow secretly depends on stash push, it will fail loudly. Scan for usage first.
- **Evidence-based constraints**: The `ship-to-staging.sh` script already requires a clean tree and does NOT use stash itself. The stash entries were created by agents *before* calling ship-to-staging. The fix is for agents to checkpoint-commit instead.
