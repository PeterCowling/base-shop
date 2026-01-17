# Incident Prevention Summary

> **One-page summary of protections against accidental data loss.**
> For full details, see [Git Safety Guide](./git-safety.md).

---

## Protection Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Claude Code Hooks (.claude/settings.json)             │
│  └─ Blocks destructive commands before AI can execute them      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: GitHub Branch Protection (server-side)                │
│  └─ Requires PR, approval, and passing CI to merge to main      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Git Hooks (local)                                     │
│  └─ pre-push blocks force push; pre-commit blocks secrets       │
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
| `git checkout -- .` | Discards all local modifications |
| `git stash drop/clear` | Loses stashed work permanently |
| `git push --force` / `-f` | Overwrites remote history |
| `git rebase -i` | Can rewrite/lose history |
| `--no-verify` | Bypasses safety hooks |

---

## Required Practices

| Practice | Frequency | Why |
|----------|-----------|-----|
| Commit changes | Every 30 min or significant change | Creates restore points |
| Push to GitHub | Every 2 hours or 3 commits | Backs up work off-machine |
| Use work branches | Always | Isolates work from production |
| Create PRs (green, conflict-free) | For all main merges | Enables review and CI |

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
| Claude Code Hooks | ✅ Configured | [.claude/settings.json](../.claude/settings.json) |

---

## Quick Links

- [Git Safety Guide](./git-safety.md) - Full documentation
- [AGENTS.md](../AGENTS.md) - AI agent rules
- [Git Hooks](./git-hooks.md) - Hook configuration
- [Recovery Plan](./RECOVERY-PLAN-2026-01-14.md) - Incident details

---

**Last Updated:** 2026-01-16
