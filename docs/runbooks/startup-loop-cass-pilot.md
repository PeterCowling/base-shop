---
Type: Runbook
Status: Active
Domain: Startup-Loop / Retrieval
Last-reviewed: 2026-03-01
---

# Startup-Loop CASS Pilot

This runbook configures and runs CASS retrieval as advisory context for startup-loop planning workflow steps.

## Objective

Use prior-session retrieval to reduce duplicate audits in:
- `/lp-do-fact-find`
- `/lp-do-plan`

## Command

```bash
pnpm startup-loop:cass-retrieve -- --mode <fact-find|plan> --slug <feature-slug> --topic "<topic>"
```

## Required Configuration

`CASS_RETRIEVE_COMMAND` is optional.

- If set, the script uses your external CASS command.
- If unset, the script automatically uses a built-in CASS-compatible session-history provider (`~/.claude/projects`, `~/.codex/sessions`).

When using `CASS_RETRIEVE_COMMAND`, the command receives:
- `CASS_QUERY`
- `CASS_TOP_K`
- `CASS_SOURCE_ROOTS` (CSV)

Example shape:

```bash
export CASS_RETRIEVE_COMMAND='<your-cass-command-using-$CASS_QUERY-$CASS_TOP_K-$CASS_SOURCE_ROOTS>'
```

## Output

Default output path:
- `docs/plans/<feature-slug>/artifacts/cass-context.md`

Override:

```bash
pnpm startup-loop:cass-retrieve -- --mode plan --slug <feature> --out docs/plans/<feature>/artifacts/cass-custom.md
```

## Fail-Open Behavior

If CASS command is missing or fails:
- Script first attempts the built-in CASS provider (if no external command is configured).
- If CASS is still unavailable, script falls back to local `rg` retrieval over startup-loop docs/skills.
- Workflow continues.

To enforce strict CASS-only mode:

```bash
pnpm startup-loop:cass-retrieve -- --mode fact-find --slug <feature> --strict
```

## Default Source Roots Coverage

The built-in fallback-rg provider searches these directories by default:

| Directory | Content |
|---|---|
| `docs/plans` | Prior fact-finds, plans, build records, artifacts |
| `docs/business-os/startup-loop` | Loop state, stage docs, standing artifacts |
| `.claude/skills` | Skill definitions and SKILL.md files |
| `docs/business-os/strategy` | Assessment-layer docs: brand identity, solution decisions, naming specs, business plans (104 `.user.md` files across 9 businesses) |

Override with `--source-roots <csv>` to replace the defaults for a specific invocation.

Total output is bounded to `topK=8` snippets regardless of corpus size. Retrieved snippets are advisory context only — verify cited files directly before reusing conclusions.

## Usage Rules

- Retrieval is advisory, not authoritative.
- Verify cited files directly before reusing conclusions.
- Keep canonical evidence links in `fact-find.md` and `plan.md`.
