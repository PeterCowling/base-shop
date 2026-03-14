---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: 2026-03-12
Feature-Slug: do-workflow-process-walkthrough-packets
Execution-Track: mixed
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: DO Workflow Process Walkthrough Packets

## Outcome Contract

- **Why:** The walkthrough gate fixed a planning-quality blind spot, but it made the markdown artifacts larger. If the handoff packets keep omitting those new process sections, downstream stages will reopen full upstream markdown and lose much of the deterministic token-efficiency gain.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO workflow packets carry compact walkthrough/process rows for fact-find, analysis, and plan, and analysis has a deterministic validator so packet-first progressive disclosure remains real after the walkthrough gate.
- **Source:** operator

## What Was Built

The packet contract and generator were extended so the DO workflow now carries compact process topology rows from `## Current Process Map`, `## End-State Operating Model`, and `## Delivered Processes` in the corresponding `*.packet.json` sidecars. The extraction is bounded and deterministic, and explicit `None:` process sections are represented as a no-topology-change signal instead of malformed rows.

The missing deterministic analysis gate was added with a new `validate-analysis` validator, CLI entrypoint, and shell wrapper. The analysis skill and feature workflow guide were updated so the analysis stage now requires `validate-analysis.sh` before packet generation, keeping analysis aligned with the existing fact-find and plan validator pattern.

The new workflow slug was persisted end to end. Fact-find, analysis, plan, and the three generated packet sidecars now exist for `do-workflow-process-walkthrough-packets`, and the validator chain passed for the slug after one parser fix for unquoted YAML dates in frontmatter.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/skill-runner typecheck` | Pass | Explicit clean exit |
| `pnpm --filter @acme/skill-runner lint` | Pass with warnings | 82 warnings, 0 errors; warnings are pre-existing package debt plus internal validator-copy warnings |
| `scripts/validate-fact-find.sh docs/plans/do-workflow-process-walkthrough-packets/fact-find.md docs/plans/do-workflow-process-walkthrough-packets/critique-history.md` | Pass | Ready-for-analysis gate satisfied |
| `scripts/validate-analysis.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md` | Pass | Needed parser fix for unquoted YAML dates before re-run |
| `scripts/validate-plan.sh docs/plans/do-workflow-process-walkthrough-packets/plan.md` | Pass | Plan remained build-eligible throughout |
| `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md` | Pass | Mixed-track analysis coverage complete |
| `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-walkthrough-packets/plan.md` | Pass | Mixed-track plan coverage complete |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-walkthrough-packets/fact-find.md` | Pass | Wrote `fact-find.packet.json` |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md` | Pass | Wrote `analysis.packet.json` |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-walkthrough-packets/plan.md` | Pass | Wrote `plan.packet.json` |

## Workflow Telemetry Summary

None: workflow telemetry was not recorded in this turn. The build proof relied on persisted packet sidecars and deterministic validator outputs instead.

## Validation Evidence

### TASK-01
- TC-01-A: `pnpm --filter @acme/skill-runner typecheck` passed.
- TC-01-B: `pnpm --filter @acme/skill-runner lint` passed with warnings only.
- TC-01-C: regenerated packet sidecars include `process_topology_change` and the new stage-specific process-row arrays.

### TASK-02
- TC-02-A: `scripts/validate-analysis.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md` passed.
- TC-02-B: `pnpm --filter @acme/skill-runner typecheck` passed.
- TC-02-C: `pnpm --filter @acme/skill-runner lint` passed with warnings only.

### TASK-03
- TC-03-A: fact-find validator passed.
- TC-03-B: analysis validator passed.
- TC-03-C: plan validator passed.
- TC-03-D: engineering-coverage validator passed for plan and analysis.
- TC-03-E: all three packet-generation commands succeeded.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Workflow/tooling change only |
| UX / states | Pass | Packets now carry process topology rows so packet-first remains truthful for process-changing work |
| Security / privacy | Pass | Packet and validator inputs remain repo-local and source-derived |
| Logging / observability / audit | Pass | Deterministic validator outputs and packet sidecars provide auditable proof; workflow telemetry intentionally not recorded here |
| Testing / validation | Pass | Typecheck/lint and slug-specific validators all passed |
| Data / contracts | Pass | Packet contract, packet generator, and validator family are aligned |
| Performance / reliability | Pass | Compact row extraction avoids copying full walkthrough prose into packets |
| Rollout / rollback | Pass | Additive fields and additive validator; markdown fallback remains intact |

## Scope Deviations

None. The only unexpected finding was that unquoted YAML dates were parsed as `Date` objects, so `getFrontmatterString()` was hardened instead of quoting single artifacts by hand.
