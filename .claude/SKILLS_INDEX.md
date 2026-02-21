# Skills Index (Repo)

This file is a pointer for humans and agents.

The canonical skill list is the generated registry:

- List skills (recommended): `scripts/agents/list-skills`
- Registry JSON (generated; do not edit): `.agents/registry/skills.json`

Skill sources live at:

- `.claude/skills/<skill>/SKILL.md` (excluding `.claude/skills/_shared/**`)

## Updating Skills

When you add/remove/rename skills, regenerate the registry:

```bash
scripts/agents/generate-skill-registry --write
```

## Workflow Entry Point

For the feature workflow (fact-find -> plan -> build -> replan), see:

- `docs/agents/feature-workflow-guide.md`

