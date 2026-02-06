---
Type: Reference
Status: Canonical
Domain: Operations
---

# Incident Prevention Summary

> **One-page summary of protections against accidental data loss.**
> For full details, see [Git Safety Guide](./git-safety.md).

---

## Protection Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Claude Code Hooks (.claude/settings.json)             │
│  └─ PreToolUse hooks ACTIVE - blocks destructive commands       │
│     automatically before AI can execute them                     │
│     SessionStart hook injects git guard onto PATH                │
│     (.claude/hooks/pre-tool-use-git-safety.sh)                   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: GitHub Branch Protection (server-side)                │
│  └─ Requires PR and passing CI; auto-merge on green             │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Git Hooks (local)                                     │
│  └─ pre-commit blocks secrets + runs checks; pre-push blocks force push + runs checks │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Documentation (AGENTS.md, CLAUDE.md)                  │
│  └─ Rules for AI agents to follow                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Blocked Commands

These commands are blocked by one or more protection layers:

| Command | Why Blocked |
|---------|-------------|
| `git reset --hard` | Destroys uncommitted work |
| `git reset --hard <commit>` | **CATASTROPHIC** - Deletes all work since that commit |
| `git clean -fd` | Permanently deletes untracked files |
| `git checkout -- .` / `git restore .` | Discards all local modifications |
| `git restore -- <pathspec...>` / `git checkout -- <pathspec...>` | Bulk discards local modifications (multiple paths, directories, or globs) |
| `git stash drop/clear/pop/apply` | Loses stashed work or can cause conflicts (list/show/push allowed) |
| `git push --force` / `-f` | Overwrites remote history |
| `git rebase -i` | Can rewrite/lose history |
| `--no-verify` | Bypasses safety hooks - hard-blocked by git guard |

---

## Required Practices

| Practice | Frequency | Why |
|----------|-----------|-----|
| Commit changes | Every 30 min or significant change | Creates restore points |
| Push to GitHub | Every 2 hours or 3 commits | Backs up work off-machine |
| Use work branches | Always | Isolates work from production |
| Create PRs (green, conflict-free) | For all main merges | Enables CI gating and auto-merge |

---

## What Happened (Jan 14, 2026)

1. Git was in a confusing state (stash conflicts)
2. AI agent tried to "fix" it by resetting to an old commit
3. Command: `git reset --hard 59f17b748`
4. Result: **8 applications lost their source files**
5. Recovery: Days of parsing transcript logs

**Root cause:** Trying to solve git problems with destructive commands.

**Prevention:** All protection layers block this scenario now.

---

## Configuration Status

| Layer | Status | Location |
|-------|--------|----------|
| Documentation | ✅ Configured | [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md) |
| Git Hooks | ✅ Configured | `pnpm exec simple-git-hooks` to install |
| GitHub Protection | ✅ Configured | Settings → Rules → Rulesets |
| Claude Code Hooks | ✅ ACTIVE | [.claude/settings.json](../.claude/settings.json), [pre-tool-use-git-safety.sh](../.claude/hooks/pre-tool-use-git-safety.sh), [tests](../scripts/__tests__/pre-tool-use-git-safety.test.ts) |

---

## Quick Links

- [Git Safety Guide](./git-safety.md) - Full documentation
- [AGENTS.md](../AGENTS.md) - AI agent rules
- [Git Hooks](./git-hooks.md) - Hook configuration
- [Recovery Plan](./historical/RECOVERY-PLAN-2026-01-14.md) - Incident details

---

**Last Updated:** 2026-02-02
