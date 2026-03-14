---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: 2026-03-12
Feature-Slug: do-workflow-process-topology-schema
Execution-Track: mixed
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: DO Workflow Process Topology Schema

## Outcome Contract

- **Why:** The workflow now has the right walkthrough checkpoints, but the packet payload is still carrying repeated markdown column names instead of a compact TS-owned topology shape. That leaves a real token-efficiency gap even after the earlier packet work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO packets carry a compact typed process_topology payload for process-changing work, and regenerated packets for a proof slug show a smaller topology subpayload than the current raw row-object shape.
- **Source:** operator

## What Was Built

`packages/skill-runner` now owns a compact stage-aware process-topology schema instead of treating walkthrough sections as generic table-row objects. `stage-handoff-packet-types.ts` defines the topology types, `stage-handoff-packet-markdown.ts` extracts compact stage-aware records, and `generate-stage-handoff-packet.ts` now emits `process_topology` with `schema_version: do-stage-handoff.v2` for fact-find, analysis, and plan packets.

The packet contract was updated to version `1.2.0` so the human docs describe the same compact `process_topology` shape the generator emits. The feature workflow guide was also updated so packet-first guidance now points to `process_topology` rather than generic walkthrough rows.

The new workflow slug was persisted end to end and its packets were regenerated under the new schema. Using the same markdown content as the baseline, the compact topology payload is smaller than the old raw row-object equivalent in every stage: fact-find `2738 -> 2489` bytes, analysis `2295 -> 1956`, plan `1882 -> 1702`, for a total reduction of `768` bytes across the three topology subpayloads.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/skill-runner typecheck` | Pass | Targeted typecheck for the packet schema refactor |
| `pnpm --filter @acme/skill-runner lint` | Pass with warnings | 85 warnings, 0 errors; warnings are pre-existing package debt plus non-blocking internal string/security lint noise |
| `scripts/validate-fact-find.sh docs/plans/do-workflow-process-topology-schema/fact-find.md docs/plans/do-workflow-process-topology-schema/critique-history.md` | Pass | Fact-find + critique-history contract satisfied |
| `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/fact-find.md` | Pass | Fact-find engineering coverage satisfied |
| `scripts/validate-analysis.sh docs/plans/do-workflow-process-topology-schema/analysis.md` | Pass | Analysis contract satisfied |
| `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/analysis.md` | Pass | Analysis engineering coverage satisfied |
| `scripts/validate-plan.sh docs/plans/do-workflow-process-topology-schema/plan.md` | Pass | Plan contract satisfied |
| `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/plan.md` | Pass | Plan engineering coverage satisfied |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-topology-schema/fact-find.md` | Pass | Wrote `fact-find.packet.json` |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-topology-schema/analysis.md` | Pass | Wrote `analysis.packet.json` |
| `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-topology-schema/plan.md` | Pass | Wrote `plan.packet.json` |
| `node --import tsx --input-type=module <byte-measurement-script>` | Pass | Compared compact `process_topology` bytes to the old raw row-object equivalent on the same markdown content |

## Workflow Telemetry Summary

None: workflow telemetry was not recorded in this turn. The proof for this increment is the packet byte comparison, not stage token capture.

## Validation Evidence

### TASK-01
- TC-01-A: `pnpm --filter @acme/skill-runner typecheck` passed.
- TC-01-B: `pnpm --filter @acme/skill-runner lint` passed with warnings only.
- TC-01-C: regenerated packets emit `schema_version: do-stage-handoff.v2` and `process_topology`.

### TASK-02
- TC-02-A: contract doc now describes the compact `process_topology` shape for fact-find, analysis, and plan.
- TC-02-B: `feature-workflow-guide.md` now references `process_topology` in packet-first guidance.

### TASK-03
- TC-03-A: fact-find validator passed.
- TC-03-B: analysis validator passed.
- TC-03-C: plan validator passed.
- TC-03-D: engineering-coverage validator passed for fact-find, analysis, and plan.
- TC-03-E: all three packet-generation commands succeeded.
- TC-03-F: topology byte comparison showed a total reduction of `768` bytes (`6915 -> 6147`).

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Workflow/tooling change only |
| UX / states | Pass | Packet-first still carries process topology, but in a compact stage-aware shape |
| Security / privacy | Pass | Packet data remains repo-local and source-derived from markdown artifacts |
| Logging / observability / audit | Pass | Regenerated packets and persisted byte deltas provide auditable proof |
| Testing / validation | Pass | Typecheck/lint and all workflow validators passed for the proof slug |
| Data / contracts | Pass | TS interfaces, generator output, and contract doc now describe the same topology shape |
| Performance / reliability | Pass | Topology subpayload size dropped in all three packet stages |
| Rollout / rollback | Pass | Markdown remains canonical and older packets can coexist as historical artifacts |

## Scope Deviations

None.
