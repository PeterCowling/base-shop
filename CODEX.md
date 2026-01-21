---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-20
Created: 2026-01-17
Created-by: Claude Opus 4.5
Last-updated: 2026-01-20
Last-updated-by: Claude Opus 4.5
---

# CODEX.md — Codex Agent Context

This file contains Codex-specific guidance. For universal commands, see `AGENTS.md`.

## Safety Rules (CRITICAL)

**IMPORTANT**: Codex does not have safety hooks like Claude Code. You MUST follow these rules based on documentation alone.

### Destructive Commands — STOP and Ask Protocol

Before running ANY of these commands, **STOP and ask the user for explicit confirmation**:

| Command/Pattern | Why Dangerous | Required Action |
|-----------------|---------------|-----------------|
| `git reset --hard` | Loses all uncommitted work permanently | STOP, explain risk, ask user |
| `git push --force` | Overwrites remote history, affects all collaborators | STOP, explain risk, ask user |
| `git clean -fd` | Deletes all untracked files permanently | STOP, explain risk, ask user |
| `rm -rf` on project directories | Irreversible deletion | STOP, explain risk, ask user |
| `pnpm test` (unfiltered) | Spawns too many Jest workers, crashes machine | Use targeted tests instead |
| Any commit to `main` branch | Protected branch | Work on `work/*` branches only |

### How to STOP and Ask

When you encounter a situation requiring a destructive command:

1. **Do NOT run the command**
2. **Explain to the user**: "This operation would run `[command]` which [danger]. This is irreversible."
3. **Offer alternatives**: "Instead, I can [safer alternative]."
4. **Wait for explicit approval**: Only proceed if user explicitly confirms

**Example**:
```
User: Clean up all the untracked files
You: This would run `git clean -fd` which permanently deletes all untracked files.
     This cannot be undone. Files that would be deleted include: [list them]

     Alternatives:
     - Review untracked files first: `git status`
     - Delete specific files manually
     - Add files to .gitignore instead

     Do you want me to proceed with `git clean -fd`? (yes/no)
```

### Reference

For the full rationale behind these safety rules, see:
- `AGENTS.md` § "Git Rules → Destructive commands"
- `.agents/safety/rationale.md`

## Environment Awareness

Codex may run in various configurations. Adapt behavior based on what's available:

### If Network Is Disabled

- `git push`, `git fetch` → Won't work; create commits for human to push
- `pnpm add <pkg>` → Won't work; dependencies must be pre-installed
- External API calls → Won't work; mock or skip

### If Network Is Enabled

- Follow normal `AGENTS.md` workflow including push/PR rules

### Detecting Environment

```bash
# Check if network is available
curl -s --max-time 2 https://github.com > /dev/null 2>&1 && echo "Network OK" || echo "No network"

# Check if we can push
git remote -v  # If empty or unreachable, commits are local-only
```

## Workflow Adaptations

| Situation | Adaptation |
|-----------|------------|
| No network | Create commits locally; note "ready to push" in plan |
| Limited time | Focus on one task; leave clear state for next session |
| Missing dependency | Note in plan; don't attempt workarounds |
| Can't run tests | Note which tests need running; don't skip validation intent |

## Output Expectations

When network is unavailable, end sessions with:
```markdown
## Session End

Commits ready to push:
- abc1234: Add validation to checkout form
- def5678: Add tests for validation

Next steps for human:
1. `git push origin HEAD`
2. Open PR
3. Continue with remaining tasks in docs/plans/<feature>-plan.md
```

## Attribution

```
Co-Authored-By: Codex <noreply@openai.com>
```

## Using Skills

Codex can use the same skills as Claude Code. Skills are structured workflow templates that provide step-by-step guidance for common tasks.

### How to Use Skills

1. **Find the right skill**: Check `.agents/skills/manifest.yaml` for available skills
2. **Read the skill file**: Skills live in `.agents/skills/<category>/<name>.md`
3. **Follow the workflow**: Each skill has step-by-step instructions

### Most Useful Skills for Codex

| Skill | Purpose | Location |
|-------|---------|----------|
| `plan-feature` | Create detailed implementation plans | `.agents/skills/workflows/plan-feature.md` |
| `build-feature` | Implement tasks from an approved plan | `.agents/skills/workflows/build-feature.md` |

### Example Invocation

When starting a new feature:
1. Read `.agents/skills/workflows/plan-feature.md`
2. Follow the "Planning Mode" instructions
3. Create a plan in `docs/plans/<feature>-plan.md`

When implementing:
1. Read `.agents/skills/workflows/build-feature.md`
2. Follow the "Building Mode" instructions
3. Work through tasks one at a time

### Skill Discovery

The manifest at `.agents/skills/manifest.yaml` lists all available skills with:
- `name`: Skill identifier
- `description`: What it does
- `triggers`: When to use it
- `path`: Where to find it (or `location` if not yet migrated)

## What Stays the Same

- Read `AGENTS.md` for commands and rules
- Follow `docs/plans/` workflow
- Use `.agents/skills/workflows/plan-feature.md` and `build-feature.md` patterns
- Run validation before committing (when possible)
- Never take shortcuts on large-scale fixes
