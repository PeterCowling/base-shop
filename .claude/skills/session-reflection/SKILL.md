---
name: session-reflection
description: Capture learnings at end of significant work sessions. Use after completing multi-task plans, resolving unexpected problems, or discovering documentation gaps.
disable-model-invocation: true
---

# Session Reflection

Use this skill at the end of significant work sessions to capture learnings that can improve future agent work.

## When to Use

Reflect after:
- Completing a multi-task plan
- Encountering and resolving unexpected problems
- Discovering gaps in documentation or skills
- Finishing a debugging session with novel solutions

**Do not** reflect after trivial tasks (typo fixes, single-line changes).

## Workflow

### 1. Create Reflection File

Create a file in `.agents/learnings/` with this naming pattern:
```
.agents/learnings/{YYYY-MM-DD}-{brief-topic}.md
```

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

## Quality Checks

- [ ] Reflection is specific and actionable (not vague)
- [ ] No sensitive information included
- [ ] Skill gap or improvement suggestion is concrete
- [ ] File is in correct location (`.agents/learnings/`)

## Common Pitfalls

- Don't reflect on every small task (noise)
- Don't include sensitive data in learnings
- Don't give vague suggestions ("documentation could be better")
- Do reflect only on meaningful sessions
- Do sanitize all content before writing
- Do give specific suggestions ("add ESM troubleshooting to jest skill")
