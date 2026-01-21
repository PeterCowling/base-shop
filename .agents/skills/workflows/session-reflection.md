# Session Reflection

Use this skill at the end of significant work sessions to capture learnings that can improve future agent work.

## When to Use

Reflect after:
- Completing a multi-task plan
- Encountering and resolving unexpected problems
- Discovering gaps in documentation or skills
- Finishing a debugging session with novel solutions

**Do not** reflect after trivial tasks (typo fixes, single-line changes).

## Prerequisites

- Completed meaningful work in the session
- Access to `.agents/learnings/` directory

## Workflow

### 1. Create Reflection File

Create a file in `.agents/learnings/` with this naming pattern:
```
.agents/learnings/{YYYY-MM-DD}-{brief-topic}.md
```

Example: `.agents/learnings/2026-01-20-jest-esm-debugging.md`

### 2. Fill Out the Template

```markdown
## Session: {ISO timestamp}

### Agent
{claude-code | codex}

### Task Summary
{1-2 sentence description of what you worked on}

### Problems Encountered

- **Problem**: {description}
  - **Resolution**: {what worked}
  - **Skill gap**: {what documentation was missing or unclear}

### Patterns That Worked

- {Pattern 1}: {brief description of approach that was effective}

### Suggested Skill Updates

- **Skill**: {skill name or "NEW: suggested-name"}
  - **Change**: {what to add/modify}
  - **Reason**: {why this would help}

### Tooling Ideas

- **Idea**: {description}
  - **Benefit**: {why useful}
```

### 3. Review for Sensitive Content

Before saving, ensure the reflection does NOT contain:
- Customer data or PII
- Secrets, tokens, API keys
- Internal URLs or incident identifiers
- Specific user names or emails

### 4. Note for Human Review

End the reflection with:
```markdown
---
**Review status**: Pending human review
**Proposed actions**: {list any skill updates or tooling suggestions above}
```

## Quality Checks

- [ ] Reflection is specific and actionable (not vague)
- [ ] No sensitive information included
- [ ] Skill gap or improvement suggestion is concrete
- [ ] File is in correct location (`.agents/learnings/`)

## Common Pitfalls

❌ Reflecting on every small task (noise)
❌ Including sensitive data in learnings
❌ Vague suggestions ("documentation could be better")

✅ Reflecting only on meaningful sessions
✅ Sanitizing all content before writing
✅ Specific suggestions ("add ESM troubleshooting to jest skill")

## Output

- Learning file created in `.agents/learnings/`
- Human can review and convert suggestions into skill PRs

## Related

- `.agents/README.md` — Cleanup instructions for learnings directory
- `.agents/skills/manifest.yaml` — Skill catalog for reference
