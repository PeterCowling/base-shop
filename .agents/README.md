# .agents/ Directory

This directory contains agent-agnostic tooling for AI assistants (Claude Code, Codex, etc.) working in this repository.

## Structure

```
.agents/
├── README.md              # This file
├── skills/                # Composable skill definitions
│   ├── manifest.yaml      # Skill catalog with metadata
│   ├── workflows/         # Core workflow skills (plan, build)
│   ├── components/        # UI component skills
│   ├── testing/           # Testing skills
│   └── domain/            # Domain-specific skills
├── safety/                # Safety rules and rationale
├── orchestration/         # Multi-agent patterns (exploratory)
├── learnings/             # Session reflections (gitignored, ephemeral)
└── status/                # Worker status files (gitignored, ephemeral)
```

## For Agents

### Finding Skills

1. Check `skills/manifest.yaml` for available skills
2. Match your current task to a skill's `triggers` field
3. Read the skill file for step-by-step guidance

### Using Skills

Skills are markdown files with structured guidance:
- **When to Use**: Trigger conditions
- **Prerequisites**: Required state/knowledge
- **Workflow**: Step-by-step instructions
- **Quality Checks**: Validation criteria
- **Common Pitfalls**: Anti-patterns to avoid

### Recording Learnings

After significant work, consider reflecting:
1. Read `skills/workflows/session-reflection.md`
2. Create a file in `learnings/` with your findings
3. Note skill gaps, patterns that worked, tooling ideas

**Privacy note**: `learnings/` is gitignored. Do not include customer data, secrets, or PII.

## For Humans

### What's Committed vs Ephemeral

| Directory | Committed | Purpose |
|-----------|-----------|---------|
| `skills/` | Yes | Skill definitions (shared knowledge) |
| `safety/` | Yes | Safety rules and rationale |
| `orchestration/` | Yes | Multi-agent patterns |
| `learnings/` | No (gitignored) | Session reflections (may contain task details) |
| `status/` | No (gitignored) | Worker coordination files |

### Cleanup Commands

```bash
# Clear all session learnings
rm -f .agents/learnings/*.md

# Clear all status files
rm -f .agents/status/*.md

# Both
rm -f .agents/learnings/*.md .agents/status/*.md
```

### Adding New Skills

1. Create skill file in appropriate subdirectory
2. Add entry to `skills/manifest.yaml`
3. Run `pnpm validate:manifest` to verify (CI will also check)

## Related Documentation

- `AGENTS.md` — Universal runbook (commands, git rules, validation)
- `CLAUDE.md` — Claude Code specific guidance
- `CODEX.md` — Codex specific guidance
- `.claude/HOW_TO_USE_SKILLS.md` — Detailed skill usage guide
