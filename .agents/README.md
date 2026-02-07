# .agents/ Directory

This directory contains agent-agnostic support files for AI assistants (Claude Code, Codex, etc.) working in this repository.

## Structure

```
.agents/
├── README.md              # This file
├── safety/                # Safety rules and rationale
├── learnings/             # DEPRECATED: Legacy learning files (use /session-reflect instead)
└── status/                # Worker status files (gitignored, ephemeral)
```

## Skills

Skills have moved to `.claude/skills/`. See:
- Claude Code: invoke via `/skill-name` (auto-discovered)
- Codex: read `.claude/skills/<name>/SKILL.md` directly

## Recording Learnings

After significant work, use the `/session-reflect` skill:
1. Analyzes session for evidence-based improvement opportunities
2. Proposes targeted updates to existing docs, skills, or core instructions
3. Applies approved changes directly (no separate learning files)

**Note**: The legacy `/session-reflection` skill (which created separate files in `learnings/`) has been deprecated in favor of the active feedback-loop approach.

## What's Committed vs Ephemeral

| Directory | Committed | Purpose |
|-----------|-----------|---------|
| `safety/` | Yes | Safety rules and rationale |
| `learnings/` | No (gitignored) | **DEPRECATED:** Legacy learning files (use `/session-reflect` instead) |
| `status/` | No (gitignored) | Worker coordination files |

## Cleanup Commands

```bash
rm -f .agents/learnings/*.md .agents/status/*.md
```

## Related Documentation

- `AGENTS.md` — Universal runbook (commands, git rules, validation)
- `CLAUDE.md` — Claude Code specific guidance
- `CODEX.md` — Codex specific guidance
