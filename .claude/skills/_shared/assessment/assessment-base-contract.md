# Assessment Base Contract

Shared structural conventions for all `lp-do-assessment-*` skill orchestrators. Each assessment SKILL.md must conform to these conventions. Step/part-specific logic lives in local `modules/` — the orchestrator routes to them.

## Invocation Pattern (recommended)

```
/lp-do-assessment-NN-<name> --business <BIZ> [--app-dir <path>]
```

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

Skills that operate solely on prior assessment output (e.g. gate/promote skills) may omit `--app-dir`.

## Operating Mode

All assessment skills declare: **ASSESSMENT ONLY** (or **EXECUTE** for synthesis skills that produce artifacts from prior inputs without eliciting new information).

Prohibited in assessment mode: code changes, deploy operations, destructive shell commands.

## Required Inputs Format

Each skill declares inputs as a table:

| Source | Glob pattern | Required |
|---|---|---|
| <upstream artifact> | `*-<name>.user.md` | Yes/No |

All globs are relative to `docs/business-os/strategy/<BIZ>/`. When multiple files match, apply the Artifact Discovery Rule (latest `Updated:` frontmatter, then latest filename date prefix, then lexicographic tiebreak).

## Step/Part Routing Convention

Orchestrator SKILL.md declares the execution structure but routes to local modules for step-specific content:

- **Step-based skills** (numbered `## Step N — Title`): load `modules/steps.md` or grouped modules like `modules/steps-01-05.md`.
- **Part-based skills** (numbered `## Part N — Title`): load `modules/part-N.md` per part, or group small parts.
- Orchestrator retains: frontmatter, invocation, operating mode, required inputs, any pre-flight gates, and routing logic.
- Orchestrator delegates: step/part instructions, output templates, detailed checklists.

Module naming: `modules/<descriptive-name>.md`. Prefer grouping related steps over one-module-per-step to avoid file explosion (target 2–5 modules per skill).

## Quality Gate Structure

Each skill that includes a quality gate uses a `## Quality Gate` or `## Quality Checklist` section with numbered checklist items. Skills with >10 checklist items should extract the gate to `modules/quality-gate.md`.

Standard red-flag patterns (cross-skill):
- Missing required upstream artifact
- Output artifact missing required sections
- Contradictions with upstream decisions

Skill-specific red flags remain in the local quality gate module.

## Completion Message Format

```
> Assessment-NN (<name>) complete for <BIZ>.
> Artifact saved to `docs/business-os/strategy/<BIZ>/<artifact-path>`.
> Status: <Complete | Needs-input>.
> Next: <downstream assessment or skill>.
```

Skills that lack a completion message (01, 03) are not required to add one.

## Integration Block Format

Each skill ends with an `## Integration` section listing:

- **Upstream:** which assessments/skills must run before this one.
- **Downstream:** which assessments/skills consume this one's output.
- **Standing registry:** artifact ID if registered.

## Assessment Dependency Chain

| Assessment | Name | Requires |
|---|---|---|
| 01 | Problem Statement | None |
| 02 | Solution Profiling | 01 |
| 03 | Solution Selection | 02 |
| 04 | Candidate Names | 03 |
| 05 | Name Selection | 04 |
| 06 | Distribution Profiling | 03 |
| 07 | Measurement Profiling | 06 |
| 08 | Current Situation | 03 |
| 10 | Brand Profiling | 08 |
| 11 | Brand Identity | 10 |
| 12 | Promote (gate) | 11 |
| 13 | Product Naming | 05, 10 |
| 14 | Logo Brief | 10, 11, 13 |
| 15 | Packaging Brief | 14 (conditional) |
