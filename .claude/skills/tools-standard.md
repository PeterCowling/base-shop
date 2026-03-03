# Tool Skill Standard (`tools-*`)

This document defines naming, metadata, and classification rules for tool skills in `.claude/skills/`.

## 1) Naming Convention

- Canonical prefix for new tool skills: `tools-` (plural).
- Legacy singular prefix is allowed only for existing exception: `tool-process-audit`.
- Do not rename `tool-process-audit`; keep invocation and directory as-is.

### Legacy Invocation/Directory Exceptions (Documented)

- `tool-process-audit`
  - Directory: `.claude/skills/tool-process-audit/`
  - Invocation (`name`): `tool-process-audit`
- `tools-ui-breakpoint-sweep`
  - Directory: `.claude/skills/tools-web-breakpoint/`
  - Invocation (`name`): `tools-ui-breakpoint-sweep`
- `tools-ui-frontend-design`
  - Directory: `.claude/skills/frontend-design/`
  - Invocation (`name`): `tools-ui-frontend-design`

Rule for new skills: directory name must match invocation name exactly. New skills must not introduce new directory/name mismatches.

## 2) Required SKILL.md Frontmatter

All `tool-*` / `tools-*` skills must include all fields below in frontmatter.

| Field | Definition | Example |
|---|---|---|
| `name` | Canonical invocation name. For new skills, must exactly match directory name. | `name: tools-ui-contrast-sweep` |
| `description` | Single line describing what the skill does and when to use it. | `description: Audit UI color contrast and return prioritized accessibility findings.` |
| `operating_mode` | Primary workflow/output mode. Must use allowed vocabulary from Section 3. | `operating_mode: AUDIT` |
| `trigger_conditions` | Comma-separated keywords or situations that should trigger this skill. | `trigger_conditions: accessibility, color contrast, pre-launch QA` |
| `related_skills` | Comma-separated invocation names commonly paired with this skill. | `related_skills: lp-design-qa, tools-ui-breakpoint-sweep` |

## 3) `operating_mode` Vocabulary

Allowed values:

- `AUDIT`
  - Runs a systematic check and produces a findings report.
  - Example use: contrast sweep, breakpoint sweep.
- `ANALYSIS + RECOMMENDATIONS`
  - Diagnoses a system/process and returns ranked recommendations.
  - Example use: process audit.
- `GENERATE`
  - Produces a new artifact from inputs (for example: document, diagram, code stub).
- `INTERACTIVE`
  - Guides an operator through a multi-step interactive workflow.

Vocabulary is extensible. Any new `operating_mode` value must be added to this file and to `.claude/skills/tools-index.md`.

## 4) Classification: `tools-*` vs `lp-*`

A skill belongs in `tools-*` only when all four conditions are true:

1. It is invoked on-demand for a specific diagnostic, generative, or utility task, and is not a startup-loop step.
2. It produces an artifact or analysis output that is not a loop artifact (not a plan, fact-find, briefing, or stage-doc).
3. It can run in any context (inside or outside a loop run) without loop state.
4. It is ad-hoc and not suitable as a deterministic standing loop step.

If conditions 3 or 4 fail, place the skill in `lp-*` or `startup-loop`.

## 5) Invocation Name and Directory Rule

- Canonical invocation name is the `name` field in `SKILL.md` frontmatter.
- For new skills, directory must exactly equal `name`.
- Legacy exceptions (no rename required): `tool-process-audit`, `tools-ui-breakpoint-sweep`, `tools-ui-frontend-design`.

## 6) How To Create a New Tool Skill

1. Choose invocation name using `tools-<domain>-<action>` (example: `tools-ui-contrast-sweep`).
2. Create directory `.claude/skills/<invocation-name>/` exactly matching that name.
3. Create `SKILL.md` with required frontmatter fields:
   - `name`
   - `description`
   - `operating_mode`
   - `trigger_conditions`
   - `related_skills`
4. Add the skill to `.claude/skills/tools-index.md`.
5. Add a one-line entry in `AGENTS.md` under Available Skills.

Required maintenance note: every new tool skill must update `.claude/skills/tools-index.md` or the skill is effectively undiscoverable for index-first workflows.
