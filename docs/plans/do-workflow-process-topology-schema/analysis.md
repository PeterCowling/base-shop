---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-process-topology-schema
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Related-Fact-Find: docs/plans/do-workflow-process-topology-schema/fact-find.md
Related-Plan: docs/plans/do-workflow-process-topology-schema/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Process Topology Schema Analysis

## Decision Frame

### Summary
The current packetized walkthrough lift solved correctness but not compactness. The decision is whether to keep serializing generic table rows, add telemetry-only measurement, or move the walkthrough shape into a compact TS-owned `process_topology` schema that can carry only the stage-specific fields that matter.

### Goals
- reduce process-topology packet bytes through a TS-owned compact schema,
- preserve packet-first progressive disclosure,
- prove the compact schema with regenerated packets and measured byte deltas.

### Non-goals
- replacing markdown walkthrough sections,
- building packet consumers that execute from process topology alone,
- redesigning workflow telemetry.

### Constraints & Assumptions
- Constraints:
  - stage payloads must stay deterministic and markdown-derived,
  - the new schema must be readable enough for workflow consumers,
  - byte reduction must be demonstrated, not assumed.
- Assumptions:
  - stage-specific topology records can be more compact than raw per-column row objects,
  - a schema bump is acceptable because packets are generated sidecars, not committed runtime API contracts.

## Inherited Outcome Contract

- **Why:** The workflow now has the right walkthrough checkpoints, but the packet payload is still carrying repeated markdown column names instead of a compact TS-owned topology shape. That leaves a real token-efficiency gap even after the earlier packet work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO packets carry a compact typed process_topology payload for process-changing work, and regenerated packets for a proof slug show a smaller topology subpayload than the current raw row-object shape.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/do-workflow-process-topology-schema/fact-find.md`
- Key findings used:
  - process-row arrays are currently generic table-row objects,
  - no internal code depends on the raw per-column keys,
  - `stage-handoff-packet-types.ts` is the correct home for compact topology interfaces,
  - proof needs an explicit byte comparison rather than another intuition-based claim.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Byte reduction | This is the explicit goal of the increment | Critical |
| Determinism | Packet data must remain source-derived and stable | Critical |
| Schema clarity | The compact shape should be owned in TS and documented once | High |
| Workflow safety | Packet-first remains packet-first, not packet-only | High |
| Implementation size | The change should stay within one bounded workflow increment | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Keep the current raw row-object fields and only add telemetry/measurement | Lowest implementation cost | Does not actually reduce packet size | User concern remains unresolved | No |
| B | Replace the stage-specific raw row arrays with a compact typed `process_topology` object and measure the payload delta | Addresses the real inefficiency and lifts schema ownership into TS | Requires a schema change and regenerated packets | Compact fields could drop too much nuance if chosen poorly | Yes |
| C | Try to auto-derive most walkthrough content from plan graph/task metadata now | Potentially the smallest eventual payload | Too much scope for one increment and weak coverage for fact-find/analysis stages | Overbuild and partial correctness | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (measurement only) | Option B (compact topology schema) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | Packet-first still carries a verbose process payload | Packet-first carries a more compact but still human-legible topology payload | Option B |
| Security / privacy | No change | No change; still source-derived | Option B keeps repo-local behavior unchanged |
| Logging / observability / audit | Better evidence, same inefficiency | Better evidence plus actual payload reduction | Option B |
| Testing / validation | Proof without product change | Proof tied directly to the new schema via regenerated packets | Option B |
| Data / contracts | Contract remains prose-first | Contract and TS types converge on one compact shape | Option B |
| Performance / reliability | No packet-size improvement | Expected byte reduction in the topology subpayload | Option B |
| Rollout / rollback | No contract churn | Schema change is additive at the workflow level because markdown remains canonical | Option B |

## Chosen Approach

- **Recommendation:** Option B
- **Why this wins:** It is the smallest change that actually improves token efficiency instead of just documenting the problem. The current generic row objects preserve markdown headers that are redundant once the stage is known. A compact stage-specific `process_topology` schema can replace those repeated keys with typed fields, keep the meaningful text, and prove the gain on regenerated packets.
- **What it depends on:** New topology interfaces in `stage-handoff-packet-types.ts`, stage-aware extraction helpers in `stage-handoff-packet-markdown.ts`, generator changes in `generate-stage-handoff-packet.ts`, contract/doc updates, and a measured payload comparison in build evidence.

### Rejected Approaches

- Option A was rejected because measurement alone does not change the packet hot path.
- Option C was rejected because the current stages still need authored walkthrough reasoning, and full derivation would expand the increment too far.

### Open Questions (Operator Input Required)

None.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| AREA-01: fact-find packet topology | `fact-find.packet.json` stores `current_process_areas` as raw row objects keyed by markdown column names | `lp-do-fact-find` emits packet sidecar | Packet stores `process_topology` with `changed`, `note`, `trigger`, `end_condition`, and compact area records such as `id`, `label`, `flow`, `owners`, `evidence`, `issues` | `fact-find.md` remains canonical and can still be reopened for full evidence | Compact records must retain enough context to remain useful |
| AREA-02: analysis packet topology | `analysis.packet.json` stores `end_state_process_areas` as raw row objects | `lp-do-analysis` emits packet sidecar | Packet stores stage-aware compact topology records such as `id`, `label`, `current`, `trigger`, `future`, `steady`, `seams` | Analysis markdown remains canonical | Need to avoid stage fields that are mostly null |
| AREA-03: plan packet topology | `plan.packet.json` stores `delivered_process_areas` with verbose row keys and prose task references | `lp-do-plan` emits packet sidecar | Packet stores compact records such as `id`, `label`, `trigger`, `flow`, `task_ids`, `seams`, while task briefs remain the richer task graph source | Build still reads the full task block before execution | `task_ids` extraction must not silently discard important non-task dependency text |
| AREA-04: contract + packet versioning | Contract still documents v1 raw process-row fields | Generator and contract are updated together | New packets declare `do-stage-handoff.v2` and the contract names the compact `process_topology` shape per stage | Old packet files remain historical artifacts | v1/v2 coexistence must be clear in docs |

## Planning Handoff

- Planning focus:
  - introduce stage-specific compact topology interfaces in `stage-handoff-packet-types.ts`,
  - replace the current raw row-array fields with one `process_topology` object per stage,
  - update the contract doc to the new schema and bump the packet version,
  - regenerate packets for the proof slug and persist before/after byte measurements.
- Validation implications:
  - `pnpm --filter @acme/skill-runner typecheck`
  - `pnpm --filter @acme/skill-runner lint`
  - `scripts/validate-fact-find.sh docs/plans/do-workflow-process-topology-schema/fact-find.md docs/plans/do-workflow-process-topology-schema/critique-history.md`
  - `scripts/validate-analysis.sh docs/plans/do-workflow-process-topology-schema/analysis.md`
  - `scripts/validate-plan.sh docs/plans/do-workflow-process-topology-schema/plan.md`
  - `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/analysis.md`
  - `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/plan.md`
  - `scripts/generate-stage-handoff-packet.sh` for all three stage artifacts
- Sequencing constraints:
  - types/extractors/generator before contract wording is finalized,
  - packet regeneration only after the schema is stable,
  - byte comparison only after the new packets are generated.
- Risks to carry into planning:
  - compact records might still be too verbose if field names are not tight,
  - plan task dependency prose may need a fallback note field when task IDs do not capture all nuance.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Compact field set is still too large | Medium | Medium | Needs implementation and measurement | Measure the topology subpayload bytes explicitly |
| Task dependency text loses nuance | Low | Medium | Depends on the exact extractor behavior | Keep a small fallback seam/note field if needed |
| Schema version drift between docs and generator | Low | Medium | Requires coordinated edits | Update types, generator, and contract in one task wave |

## Planning Readiness

- Status: Go
- Rationale: The problem is well-bounded and the preferred approach is clear. The next step is implementation, not more option analysis.
