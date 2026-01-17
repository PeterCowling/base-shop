---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Created: 2026-01-17
Created-by: Claude Opus 4.5
---

# CODEX.md — Codex Agent Context

This file contains Codex-specific guidance. For universal commands, see `AGENTS.md`.

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

## What Stays the Same

- Read `AGENTS.md` for commands and rules
- Follow `docs/plans/` workflow
- Use `.claude/prompts/plan-feature.md` and `build-feature.md` patterns
- Run validation before committing (when possible)
- Never take shortcuts on large-scale fixes
