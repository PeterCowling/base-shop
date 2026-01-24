---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-20
Created: 2026-01-17
Created-by: Claude Opus 4.5
Last-updated: 2026-01-24
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

## Type Intelligence (MCP)

When asked to “check types” or “check TypeScript errors,” use the MCP TypeScript language tools first (fast, on-demand). See `docs/ide/agent-language-intelligence-guide.md` for setup and scripts. `pnpm typecheck && pnpm lint` remains the final validation gate before commits.

Prompt template to enforce MCP usage: see `docs/ide/type-check-sop.md`.

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

## Feature Workflow (Fact-Find → Plan → Build → Re-Plan)

Codex follows the same confidence-gated workflow as Claude Code. Since Codex has no skill loader or slash commands, invoke each phase by reading the skill file and following its instructions.

### The Loop

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  fact-find   │────▶│ plan-feature  │────▶│ build-feature  │
│             │     │              │     │               │
│ Audit repo  │     │ Tasks with   │     │ Only builds   │
│ Map impact  │     │ confidence % │     │ tasks ≥80%    │
│ Resolve Qs  │     │ per task     │     │               │
└─────────────┘     └──────────────┘     └───────┬───────┘
       ▲                    ▲                     │
       │              ┌─────┴─────┐               │
       └──────────────│  re-plan   │◀──────────────┘
                      │            │  confidence <80%
                      └────────────┘
```

### How to Invoke Each Phase

| Phase | Action | Skill file |
|-------|--------|-----------|
| Fact-find | Read and follow | `.claude/skills/fact-find/SKILL.md` |
| Plan | Read and follow | `.claude/skills/plan-feature/SKILL.md` |
| Build | Read and follow | `.claude/skills/build-feature/SKILL.md` |
| Re-plan | Read and follow | `.claude/skills/re-plan/SKILL.md` |

### Confidence System

Each task gets a confidence percentage (0-100%) based on three dimensions:

| Dimension | Question |
|-----------|----------|
| **Implementation** | Do we know exactly how to write correct code? |
| **Approach** | Is this the best long-term solution? |
| **Impact** | Do we fully understand what this touches and won't break? |

Overall confidence = minimum of the three.

**Thresholds:**
- **80%+** → Build the task
- **60-79%** → Build with caution, flag risks
- **Below 60%** → Do NOT build. Re-plan first.

### Open Questions Policy

When uncertain about the right approach:
1. **First**: investigate the repo (read code, trace dependencies, check tests)
2. **Second**: search externally if it's a knowledge gap
3. **Third**: select the best long-term solution based on evidence
4. **Only then**: ask the user if genuinely unable to determine the answer

### Example Session

```
1. Read `.claude/skills/fact-find/SKILL.md`
2. Audit the affected codebase areas, produce a brief
3. Read `.claude/skills/plan-feature/SKILL.md`
4. Create plan at `docs/plans/<feature>-plan.md` with confidence scores
5. If all tasks ≥80%:
   - Read `.claude/skills/build-feature/SKILL.md`
   - Build tasks one at a time
6. If any task <80%:
   - Read `.claude/skills/re-plan/SKILL.md`
   - Investigate, update confidence, loop back to step 5
```

### Other Available Skills

| Skill | Purpose | Location |
|-------|---------|----------|
| `jest-esm-issues` | Fix ESM/CJS test errors | `.claude/skills/jest-esm-issues/SKILL.md` |
| `git-recovery` | Recover from confusing git state | `.claude/skills/git-recovery/SKILL.md` |
| `dependency-conflicts` | Resolve pnpm workspace issues | `.claude/skills/dependency-conflicts/SKILL.md` |
| `session-reflection` | Capture learnings after work | `.claude/skills/session-reflection/SKILL.md` |

## What Stays the Same

- Read `AGENTS.md` for commands and rules
- Follow `docs/plans/` workflow
- Use the fact-find → plan → build → re-plan loop (see above)
- Run validation before committing (when possible)
- Never take shortcuts on large-scale fixes
