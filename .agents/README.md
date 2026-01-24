# .agents/ Directory

This directory contains agent-agnostic support files for AI assistants (Claude Code, Codex, etc.) working in this repository.

## Structure

```
.agents/
├── README.md              # This file
├── safety/                # Safety rules and rationale
├── learnings/             # Session reflections (gitignored, ephemeral)
└── status/                # Worker status files (gitignored, ephemeral)
```

## Skills

Skills have moved to `.claude/skills/`. See:
- Claude Code: invoke via `/skill-name` (auto-discovered)
- Codex: read `.claude/skills/<name>/SKILL.md` directly

## Recording Learnings

After significant work, use the `/session-reflection` skill:
1. Creates a file in `.agents/learnings/` with structured findings
2. Notes skill gaps, patterns that worked, tooling ideas

**Privacy note**: `learnings/` is gitignored. Do not include customer data, secrets, or PII.

## What's Committed vs Ephemeral

| Directory | Committed | Purpose |
|-----------|-----------|---------|
| `safety/` | Yes | Safety rules and rationale |
| `learnings/` | No (gitignored) | Session reflections (may contain task details) |
| `status/` | No (gitignored) | Worker coordination files |

## Cleanup Commands

```bash
rm -f .agents/learnings/*.md .agents/status/*.md
```

## Related Documentation

- `AGENTS.md` — Universal runbook (commands, git rules, validation)
- `CLAUDE.md` — Claude Code specific guidance
- `CODEX.md` — Codex specific guidance
