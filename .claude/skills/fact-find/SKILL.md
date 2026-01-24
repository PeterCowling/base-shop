---
name: fact-find
description: Gather context for a feature by auditing the repo, searching the web, and building understanding. Use before planning when you need to understand the current state of the codebase, relevant patterns, or external best practices.
---

# Fact-Find

Gather context and understanding before planning. This skill produces a structured brief that feeds into plan-feature.

## When to Use

- Before planning any non-trivial feature
- When you don't fully understand the affected area of the codebase
- When external research (APIs, libraries, patterns) is needed
- When the user requests investigation or audit of a topic

## Workflow

### 1. Define the Scope

State clearly:
- What feature/change is being considered
- What areas of the codebase might be affected
- What external knowledge might be needed

### 2. Audit the Repo

Investigate the current state systematically:

```
For each potentially affected area:
  - Read the relevant source files
  - Understand existing patterns and conventions
  - Identify dependencies (what imports this? what does this import?)
  - Note any existing tests and their coverage
  - Check for related plans in docs/plans/
  - Look at recent git history for context on recent changes
```

**Do not assume.** Read the code. If something might be relevant, check it.

### 3. Research Externally (if needed)

When the feature involves technologies, APIs, or patterns you need to verify:
- Search for current best practices
- Check library documentation for correct usage
- Verify compatibility with the project's stack (Next.js 15, React 19, pnpm, etc.)

### 4. Identify Open Questions

For each uncertainty discovered:

1. **First: try to answer it yourself** — search the repo, read related code, check docs
2. **If answerable from the repo**: resolve it and document the answer with evidence
3. **If genuinely uncertain**: mark it as an open question for the user

**Policy**: Only escalate to the user when you cannot determine the best long-term solution from the available evidence. Prefer self-resolution through investigation.

### 5. Produce the Brief

Output a structured brief:

```markdown
## Fact-Find Brief: <Feature Name>

### Current State
- <What exists today in the relevant areas>
- <Key files and their responsibilities>
- <Existing patterns to follow or deviate from>

### External Research
- <Findings from web research, if any>
- <Library versions, API constraints, best practices>

### Dependencies & Impact
- <What other code depends on the areas we'll change>
- <What might break>
- <Cross-cutting concerns (types, tests, builds)>

### Resolved Questions
- Q: <question> → A: <answer> (evidence: <file:line or source>)

### Open Questions (for user)
- Q: <question> (why it matters: <context>)

### Confidence Inputs
- Implementation clarity: <what we know vs. don't know about HOW>
- Approach certainty: <is the right solution clear, or are there competing options?>
- Impact visibility: <do we fully understand what this change touches?>
```

### 6. Hand Off

If open questions exist that block planning → ask the user.
If the brief is complete → proceed to `/plan-feature`.

## Quality Checks

- [ ] All potentially affected files have been read (not assumed)
- [ ] Open questions were first investigated before escalating
- [ ] External research is current and relevant to our stack
- [ ] Dependencies and impact are explicitly mapped
- [ ] Brief provides enough context for confident planning

## Common Pitfalls

- Don't assume you know how code works without reading it
- Don't skip impact analysis (what else does this touch?)
- Don't ask the user questions you could answer by reading the repo
- Don't produce a brief that's just a restatement of the user's request
- Do investigate thoroughly before declaring something an "open question"
