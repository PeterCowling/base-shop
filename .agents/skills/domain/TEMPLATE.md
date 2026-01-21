# Domain Skill Extraction Template

This template documents the pattern for extracting domain knowledge from plan documents into reusable skills.

## When to Extract

Consider extracting a domain skill when:
- A plan document contains reusable patterns others will need
- The same problem-solving approach appears across multiple plans
- Domain-specific troubleshooting is documented inline
- Onboarding new agents would benefit from structured guidance

## Extraction Process

### 1. Identify Extractable Knowledge

Review the plan document for:
- **Patterns**: Recurring approaches that worked
- **Pitfalls**: Common mistakes and how to avoid them
- **Workflows**: Step-by-step procedures for specific tasks
- **Troubleshooting**: Problem-solution pairs

### 2. Choose Skill Structure

**Single skill** (most common):
```
.agents/skills/domain/<topic>.md
```

**Skill directory** (for complex domains):
```
.agents/skills/domain/<topic>/
├── README.md           # Overview and entry point
├── <workflow-1>.md     # Specific workflow
├── <workflow-2>.md     # Another workflow
└── troubleshooting.md  # Common problems
```

### 3. Apply Skill Template

Use this structure for individual skills:

```markdown
# <Domain Topic>

## When to Use

Brief trigger description — when should an agent load this skill?

## Prerequisites

- Required knowledge or context
- Files/systems that must be accessible
- Prior steps that should be completed

## Key Concepts

Brief explanation of domain-specific terms or patterns.

## Workflow

### Step 1: <Action>

Description of what to do.

```bash
# Commands or code examples
```

### Step 2: <Action>

Continue with step-by-step guidance.

## Quality Checks

- [ ] Validation 1
- [ ] Validation 2
- [ ] Final verification

## Common Pitfalls

❌ **Anti-pattern**: Description
✅ **Correct approach**: Description

❌ **Anti-pattern**: Description
✅ **Correct approach**: Description

## Troubleshooting

### Problem: <Error or symptom>

**Cause**: Why this happens
**Fix**: How to resolve it

### Problem: <Another error>

**Cause**: Why this happens
**Fix**: How to resolve it

## Related

- Link to related skill
- Link to documentation
- Link to source plan (if applicable)
```

### 4. Update Manifest

Add the new skill to `.agents/skills/manifest.yaml`:

```yaml
- name: <skill-name>
  path: domain/<skill-name>.md
  description: <Brief description>
  load: on-demand
  triggers:
    - "<trigger phrase 1>"
    - "<trigger phrase 2>"
  provides:
    - <capability>
```

### 5. Validate

```bash
# Run manifest validation
node scripts/validate-agent-manifest.js
```

## Example Extraction

**Source**: `docs/plans/content-translation-pipeline-plan.md`

**Extracted to**: `.agents/skills/domain/translation/`

```
.agents/skills/domain/translation/
├── README.md                    # Translation pipeline overview
├── adding-new-locale.md         # How to add a new language
├── fixing-missing-keys.md       # Handling translation gaps
└── troubleshooting.md           # Common i18n errors
```

**Manifest entries**:
```yaml
- name: translation-overview
  path: domain/translation/README.md
  description: Translation pipeline overview and concepts
  load: on-demand
  triggers:
    - "translation"
    - "i18n"
    - "locale"

- name: translation-troubleshooting
  path: domain/translation/troubleshooting.md
  description: Fix common i18n and translation errors
  load: on-demand
  triggers:
    - "missing translation key"
    - "locale not found"
    - "i18n error"
```

## Quality Guidelines

### Good Extractions

- Focused on one domain or workflow
- Reusable across multiple tasks
- Contains actionable steps, not just theory
- Includes real commands and examples
- Has clear triggers for discovery

### Avoid

- Extracting plan-specific details that won't generalize
- Creating skills for one-time tasks
- Duplicating content that exists elsewhere
- Skills without clear triggers (how will agents find it?)

## Maintenance

When the source plan evolves:
1. Review if extracted skills need updates
2. Keep skills and plans loosely coupled (skills should stand alone)
3. Update "Related" links if plans move or are archived
