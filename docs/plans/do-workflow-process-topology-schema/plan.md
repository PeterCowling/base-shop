---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-process-topology-schema
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-process-topology-schema/analysis.md
artifact: plan
---

# DO Workflow Process Topology Schema Plan

## Summary

Replace the current raw walkthrough row arrays in DO handoff packets with a compact typed `process_topology` schema owned in TypeScript, bump the packet schema version, update the contract to match, regenerate the proof slug packets, and persist measured before/after byte reductions for the topology subpayload.

## Active tasks
- [x] TASK-01: Implement compact `process_topology` types, extraction, and `do-stage-handoff.v2` packet generation
- [x] TASK-02: Update the packet contract and related workflow references to the compact topology schema
- [x] TASK-03: Regenerate proof packets, validate the workflow artifacts, and persist byte-reduction evidence

## Goals
- lift process-topology ownership into `skill-runner` types,
- reduce packet bytes for process-changing walkthrough payloads,
- preserve packet-first progressive disclosure with canonical markdown fallback.

## Non-goals
- replacing markdown walkthrough sections,
- changing workflow telemetry semantics,
- deriving all walkthrough text from task graphs.

## Constraints & Assumptions
- Constraints:
  - packet content must remain deterministic and markdown-derived,
  - the compact schema must still be understandable to downstream stages,
  - old packet artifacts may remain in the repo without being backfilled.
- Assumptions:
  - stage-aware compact records will materially beat raw row-object shape on bytes,
  - one proof slug is sufficient evidence for this increment.

## Inherited Outcome Contract
- **Why:** The workflow now has the right walkthrough checkpoints, but the packet payload is still carrying repeated markdown column names instead of a compact TS-owned topology shape. That leaves a real token-efficiency gap even after the earlier packet work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO packets carry a compact typed process_topology payload for process-changing work, and regenerated packets for a proof slug show a smaller topology subpayload than the current raw row-object shape.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-process-topology-schema/analysis.md`
- Selected approach inherited:
  - replace raw row arrays with one stage-aware compact `process_topology` object,
  - keep markdown canonical and packet-first behavior unchanged,
  - prove the change with explicit before/after byte measurements.
- Key reasoning used:
  - the current inefficiency is repeated key overhead, not lack of packetization,
  - TS ownership is the missing normalization seam,
  - measurement must accompany the refactor.

## Selected Approach Summary
- What was chosen:
  - add compact topology interfaces to `stage-handoff-packet-types.ts`,
  - add stage-aware extraction helpers in `stage-handoff-packet-markdown.ts`,
  - emit `process_topology` in `generate-stage-handoff-packet.ts`,
  - bump packet schema version to `do-stage-handoff.v2`,
  - update the packet contract and regenerate packets for this slug with byte-delta evidence.
- Why planning is not reopening option selection:
  - analysis already showed that measurement-only and full derivation are both weaker than a compact schema refactor.

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-process-topology-schema/fact-find.md`
- Evidence carried forward:
  - repeated table-header keys are the measured overhead source,
  - no internal code consumer requires the current raw key names,
  - the refactor stays inside one bounded `skill-runner` seam plus contract docs.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Implement compact `process_topology` types, extraction, and `do-stage-handoff.v2` packet generation | 89% | M | Complete (2026-03-12) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update contract/docs to the compact topology schema | 87% | S | Complete (2026-03-12) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Regenerate proof packets, validate artifacts, and persist byte-reduction evidence | 86% | S | Complete (2026-03-12) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: workflow/tooling change only | - | no product UI |
| UX / states | Compact topology stays readable while reducing repeated-key overhead | TASK-01, TASK-02, TASK-03 | packet-first behavior remains explicit |
| Security / privacy | Source-derived extraction only | TASK-01, TASK-03 | no external data |
| Logging / observability / audit | Persist regenerated packets and measured byte comparison | TASK-03 | build evidence is the proof surface |
| Testing / validation | Typecheck/lint plus artifact validators and packet regeneration | TASK-01, TASK-02, TASK-03 | no local Jest |
| Data / contracts | TS schema and contract doc must converge on one topology model | TASK-01, TASK-02 | version bump included |
| Performance / reliability | Replace verbose row objects with stage-aware compact fields | TASK-01, TASK-03 | explicit byte reduction required |
| Rollout / rollback | Markdown fallback remains intact; old packets can remain historical | TASK-01, TASK-02 | no destructive migration |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Code first so the compact schema is real before docs and proof. |
| 2 | TASK-02 | TASK-01 | Contract wording should match the actual generated packet shape. |
| 3 | TASK-03 | TASK-01, TASK-02 | Regenerate packets and record validation + byte evidence last. |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| AREA-01: fact-find packet topology | `lp-do-fact-find` emits packet sidecar for process-changing work | Generator emits `process_topology` with compact fact-find area records instead of `current_process_areas`, so analysis reads one typed topology object first and only reopens markdown when it needs fuller evidence | TASK-01 -> TASK-03 | Old v1 packets remain in repo until regenerated |
| AREA-02: analysis packet topology | `lp-do-analysis` emits packet sidecar | Generator emits compact analysis topology records instead of `end_state_process_areas`, preserving current/future/seam meaning without repeated header keys | TASK-01 -> TASK-03 | Stage-specific compact fields must stay expressive enough for planning |
| AREA-03: plan packet topology | `lp-do-plan` emits packet sidecar | Generator emits compact plan topology records with `task_ids` extracted from the walkthrough row, so build sees topology linkage and task briefs together before reopening the task block | TASK-01 -> TASK-03 | Non-task dependency nuance may still require a small fallback seam field |
| AREA-04: schema contract coherence | Packet version changes to `do-stage-handoff.v2` | Contract doc, TS interfaces, generator output, and regenerated proof packets all describe the same compact topology shape | TASK-01 -> TASK-02 -> TASK-03 | Historical docs referencing v1 stay unchanged |

## Validation Contracts
- TC-01: `@acme/skill-runner` typecheck/lint stay green after the topology refactor
- TC-02: regenerated packets for this slug emit `do-stage-handoff.v2` and a compact `process_topology` payload for all three stages
- TC-03: the new topology subpayload is smaller than the current raw row-object equivalent for this slug
- TC-04: fact-find, analysis, plan, and engineering-coverage validators pass for the persisted workflow artifacts

## Tasks

### TASK-01: Implement compact `process_topology` types, extraction, and `do-stage-handoff.v2` packet generation
- **Type:** IMPLEMENT
- **Deliverable:** code/doc change in `packages/skill-runner` and packet schema version
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Added compact process-topology interfaces to `stage-handoff-packet-types.ts` and stage-aware extraction helpers to `stage-handoff-packet-markdown.ts`.
  - Updated `generate-stage-handoff-packet.ts` so new packets emit `process_topology` and `schema_version: do-stage-handoff.v2`.
  - New packets no longer emit the legacy raw walkthrough row arrays.
- **Affects:** `packages/skill-runner/src/stage-handoff-packet-types.ts`, `packages/skill-runner/src/stage-handoff-packet-markdown.ts`, `packages/skill-runner/src/generate-stage-handoff-packet.ts`, `[readonly] docs/plans/_templates/fact-find-planning.md`, `[readonly] docs/plans/_templates/analysis.md`, `[readonly] docs/plans/_templates/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 89%
  - Implementation: 90% - one bounded code seam with no downstream runtime API callers.
  - Approach: 89% - compact stage-aware fields directly target the measured overhead.
  - Impact: 88% - should materially reduce packet bytes for process-changing work.
- **Acceptance:**
  - `stage-handoff-packet-types.ts` defines compact topology interfaces owned in TS,
  - `generate-stage-handoff-packet.ts` emits `process_topology` for fact-find, analysis, and plan,
  - packet schema version is bumped to `do-stage-handoff.v2`,
  - legacy raw fields (`current_process_areas`, `end_state_process_areas`, `delivered_process_areas`) are no longer emitted by new packets.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - packet-first flow must remain readable
  - Security / privacy: Required - deterministic source-derived extraction only
  - Logging / observability / audit: Required - packet outputs remain auditable artifacts
  - Testing / validation: Required - typecheck/lint and packet generation proof
  - Data / contracts: Required - topology schema and version bump must be aligned
  - Performance / reliability: Required - compact fields must reduce overhead
  - Rollout / rollback: Required - additive workflow change with markdown fallback
- **Validation contract (TC-01):**
  - TC-01-A: `pnpm --filter @acme/skill-runner typecheck`
  - TC-01-B: `pnpm --filter @acme/skill-runner lint`
  - TC-01-C: regenerated packets for this slug emit `process_topology` and `do-stage-handoff.v2`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: source inspection of packet types, generator, and walkthrough templates
  - Validation artifacts: updated types/generator and regenerated packets
  - Unexpected findings: none
- **Edge Cases & Hardening:** explicit `None:` sections must still map to `changed: false` plus note rather than malformed topology rows

### TASK-02: Update contract/docs to the compact topology schema
- **Type:** IMPLEMENT
- **Deliverable:** packet contract update and workflow wording aligned to compact topology
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Updated `do-stage-handoff-packet-contract.md` to version `1.2.0` and documented the compact `process_topology` shape for all three stages.
  - Updated `feature-workflow-guide.md` so packet-first guidance names `process_topology` rather than generic walkthrough rows.
- **Affects:** `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`, `docs/agents/feature-workflow-guide.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 87%
  - Implementation: 88% - mostly contract wording and any guide copy needed.
  - Approach: 87% - docs simply need to match the generator.
  - Impact: 86% - prevents schema drift and keeps packet-first guidance honest.
- **Acceptance:**
  - contract doc names `do-stage-handoff.v2` and the compact `process_topology` shape,
  - any workflow guide wording that describes process rows reflects the compact topology model,
  - docs do not imply packet-only execution.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - workflow wording matches actual packet behavior
  - Security / privacy: Required - doc change only
  - Logging / observability / audit: Required - contract is the canonical audit surface
  - Testing / validation: Required - artifact validators and packet regeneration proof
  - Data / contracts: Required - docs must match TS types and generator output
  - Performance / reliability: Required - docs explain compact payload rationale
  - Rollout / rollback: Required - additive doc update
- **Validation contract (TC-02):**
  - TC-02-A: contract doc explicitly describes `process_topology`
  - TC-02-B: regenerated packets match the documented field names
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task
- **Edge Cases & Hardening:** make v1/v2 coexistence explicit enough that historical packets are not mistaken for generator failures

### TASK-03: Regenerate proof packets, validate artifacts, and persist byte-reduction evidence
- **Type:** IMPLEMENT
- **Deliverable:** regenerated workflow artifacts, packet sidecars, validation evidence, and before/after byte measurements
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Fact-find, analysis, plan, and engineering-coverage validators all passed for this slug.
  - Regenerated `fact-find.packet.json`, `analysis.packet.json`, and `plan.packet.json`.
  - Measured topology subpayload reduction on the same markdown content: fact-find `2738 -> 2489` bytes, analysis `2295 -> 1956`, plan `1882 -> 1702`, total `6915 -> 6147` (`-768` bytes).
- **Affects:** `docs/plans/do-workflow-process-topology-schema/fact-find.md`, `docs/plans/do-workflow-process-topology-schema/analysis.md`, `docs/plans/do-workflow-process-topology-schema/plan.md`, `docs/plans/do-workflow-process-topology-schema/fact-find.packet.json`, `docs/plans/do-workflow-process-topology-schema/analysis.packet.json`, `docs/plans/do-workflow-process-topology-schema/plan.packet.json`, `docs/plans/do-workflow-process-topology-schema/critique-history.md`, `docs/plans/do-workflow-process-topology-schema/build-record.user.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 86%
  - Implementation: 87% - validators and packet generation are deterministic.
  - Approach: 86% - a persisted proof slug is the cleanest evidence path.
  - Impact: 85% - provides explicit byte evidence instead of qualitative claims.
- **Acceptance:**
  - fact-find, analysis, plan, critique-history, and build-record exist for this slug,
  - all three packet sidecars are regenerated with the compact topology schema,
  - validation commands pass for this slug,
  - build evidence records the before/after topology subpayload bytes and confirms the compact schema is smaller.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - packet-first proof is persisted across the slug
  - Security / privacy: Required - proof artifacts remain repo-local
  - Logging / observability / audit: Required - build record captures validation and byte evidence
  - Testing / validation: Required - validators plus packet generation commands
  - Data / contracts: Required - regenerated packets prove schema alignment
  - Performance / reliability: Required - measured payload reduction is the key proof
  - Rollout / rollback: Required - proof artifacts are additive
- **Validation contract (TC-03):**
  - TC-03-A: `scripts/validate-fact-find.sh docs/plans/do-workflow-process-topology-schema/fact-find.md docs/plans/do-workflow-process-topology-schema/critique-history.md`
  - TC-03-B: `scripts/validate-analysis.sh docs/plans/do-workflow-process-topology-schema/analysis.md`
  - TC-03-C: `scripts/validate-plan.sh docs/plans/do-workflow-process-topology-schema/plan.md`
  - TC-03-D: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/analysis.md`
  - TC-03-E: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-topology-schema/plan.md`
  - TC-03-F: `scripts/generate-stage-handoff-packet.sh` for `fact-find.md`, `analysis.md`, and `plan.md`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task
- **Edge Cases & Hardening:** byte comparison must compare the new compact topology subpayload against the old raw row-object equivalent generated from the same markdown content

## Risks & Mitigations
- Compact topology still too large -> keep fields stage-aware and drop redundant null-heavy keys
- Task extraction loses nuance -> preserve seam text separately when task IDs are insufficient
- Version drift -> update types, generator, and contract in one cycle

## Observability
- Logging: packet regeneration plus build-record byte evidence
- Metrics: topology subpayload byte delta for all three stage packets in this slug
- Alerts/Dashboards: none

## Acceptance Criteria (overall)
- [x] New packets use `do-stage-handoff.v2`
- [x] New packets emit compact `process_topology` payloads for fact-find, analysis, and plan
- [x] Proof slug validators pass
- [x] Build record shows smaller topology subpayload bytes than the previous raw row-object shape

## Decision Log
- 2026-03-12: Chose compact TS-owned topology schema over telemetry-only measurement or deeper derivation from plan graph.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: compact topology refactor | Yes | None - affected files are isolated to packet types/generator/helpers | No |
| TASK-02: contract/doc alignment | Yes | None - contract wording depends on final emitted field names | No |
| TASK-03: proof + validation | Yes | None - validators and packet generation commands already exist | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
