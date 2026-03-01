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

Set a shell command in `CASS_RETRIEVE_COMMAND`. The command receives:
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
- Script falls back to local `rg` retrieval over startup-loop docs/skills.
- Workflow continues.

To enforce strict CASS-only mode:

```bash
pnpm startup-loop:cass-retrieve -- --mode fact-find --slug <feature> --strict
```

## Usage Rules

- Retrieval is advisory, not authoritative.
- Verify cited files directly before reusing conclusions.
- Keep canonical evidence links in `fact-find.md` and `plan.md`.
