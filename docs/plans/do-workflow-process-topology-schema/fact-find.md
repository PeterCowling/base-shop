---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-process-topology-schema
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Related-Analysis: docs/plans/do-workflow-process-topology-schema/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312194500-PTS1
artifact: fact-find
---

# DO Workflow Process Topology Schema Fact-Find Brief

## Scope
### Summary
The current walkthrough lift is deterministic but not yet materially token-efficient because the packet still stores process rows as generic markdown-table objects. This increment is about moving that shape into compact TS-owned topology types and proving the resulting payload is actually smaller.

### Goals
- replace raw process-row arrays with a compact typed topology payload,
- keep packet-first progressive disclosure intact,
- persist proof that the new topology payload is smaller on a real workflow slug.

### Non-goals
- replacing canonical markdown artifacts,
- redesigning workflow telemetry,
- auto-deriving every walkthrough sentence from plan prose.

### Constraints & Assumptions
- Constraints:
  - packet payloads must remain deterministic and source-derived,
  - packet-first must remain packet-first, not packet-only,
  - the schema change must stay bounded to the handoff packet seam.
- Assumptions:
  - the three walkthrough sections are stable enough to map to stage-specific compact types,
  - stage-specific typed rows will be smaller than generic table-header objects.

## Outcome Contract

- **Why:** The workflow now has the right walkthrough checkpoints, but the packet payload is still carrying repeated markdown column names instead of a compact TS-owned topology shape. That leaves a real token-efficiency gap even after the earlier packet work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO packets carry a compact typed process_topology payload for process-changing work, and regenerated packets for a proof slug show a smaller topology subpayload than the current raw row-object shape.
- **Source:** operator

## Current Process Map

- Trigger: A process-changing DO feature is packetized after fact-find, analysis, or plan.
- End condition: Upstream packets express process topology through a compact typed payload that is smaller than the current raw table-row representation while keeping markdown as the canonical source.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| AREA-01: fact-find packet process rows | `generate-stage-handoff-packet.ts` reads `## Current Process Map`, extracts named fields plus the `Process Areas` table, and stores each row with the original markdown header strings as JSON keys. | `packages/skill-runner`, packet contract, fact-find packet consumers | `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `packages/skill-runner/src/stage-handoff-packet-markdown.ts`; `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` | Repeated keys like `Current step-by-step flow` and `Owners / systems / handoffs` add overhead without adding meaning once the stage is known. |
| AREA-02: analysis packet operating model | `analysis.packet.json` stores `End-State Operating Model` rows as generic objects keyed by markdown column labels. | `packages/skill-runner`, analysis packet consumers | `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `docs/plans/_templates/analysis.md` | The packet keeps the full human table shape instead of a compact stage-specific topology record. |
| AREA-03: plan packet delivered processes | `plan.packet.json` stores `Delivered Processes` rows as generic objects keyed by column labels like `Tasks / dependencies`. | `packages/skill-runner`, build packet consumers | `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `docs/plans/_templates/plan.md` | Task linkage is still prose-heavy even though task IDs can be extracted deterministically. |
| AREA-04: contract and type ownership | The packet contract describes stage-specific arrays, but `stage-handoff-packet-types.ts` does not define compact process topology interfaces. | contract doc, `skill-runner` types, generator | `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`; `packages/skill-runner/src/stage-handoff-packet-types.ts` | The compact process structure is described only informally, so TS cannot own or normalize it yet. |

## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` - canonical packet contract and payload requirements.
- `packages/skill-runner/src/generate-stage-handoff-packet.ts` - generator that currently emits raw process-row arrays.
- `packages/skill-runner/src/stage-handoff-packet-types.ts` - current packet envelope types with no explicit process-topology model.
- `packages/skill-runner/src/stage-handoff-packet-markdown.ts` - markdown extraction helpers for tables, fields, and bounded text.

### Key Modules / Files
| # | File | Role |
|---|---|---|
| 1 | `packages/skill-runner/src/generate-stage-handoff-packet.ts` | Current stage payload construction and process-row serialization. |
| 2 | `packages/skill-runner/src/stage-handoff-packet-types.ts` | Packet envelope typing; likely home for the new topology schema. |
| 3 | `packages/skill-runner/src/stage-handoff-packet-markdown.ts` | Existing bounded markdown extraction helpers to extend with compact topology parsing. |
| 4 | `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` | Human-readable contract that must match the compact schema. |
| 5 | `docs/plans/do-workflow-process-walkthrough-packets/*.packet.json` | Existing proof slug showing the current raw process-row payload shape. |

### Patterns & Conventions Observed
- Packet payloads are deterministic extracts, not model summaries.
- Stage payloads already use compact typed concepts in other places such as `task_briefs` and `outcome_contract`.
- The walkthrough sections differ by stage, so a single generic table-row type is not the most compact or semantically accurate representation.
- `parseMarkdownTable()` is a good ingestion step, but not a good final packet schema.

### Data & Contracts
- Current packet schema version is `do-stage-handoff.v1`.
- Current process fields are:
  - fact-find: `process_topology_change`, `process_topology_note`, `process_trigger`, `process_end_condition`, `current_process_areas`
  - analysis: `process_topology_change`, `process_topology_note`, `end_state_process_areas`
  - plan: `process_topology_change`, `process_topology_note`, `delivered_process_areas`
- No downstream code in `skill-runner` currently depends on the raw per-column keys beyond packet generation itself.

### Dependency & Impact Map
- Upstream dependencies:
  - walkthrough templates in fact-find, analysis, and plan,
  - packet contract doc,
  - bounded markdown parsers.
- Downstream dependents:
  - packet JSON sidecars for future DO stages,
  - workflow docs that describe packet-first progressive disclosure.
- Likely blast radius:
  - `packages/skill-runner`
  - packet contract doc
  - packet sidecars for the new proof slug

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Workflow/tooling change only | - | - |
| UX / states | Required | Packet-first exists, but process topology is still a verbose row-copy representation | The packet is less efficient than it claims to be | Prefer a stage-aware topology model |
| Security / privacy | Required | Packets remain repo-local and source-derived | New compact fields must not invite free-form summaries | Keep extraction deterministic |
| Logging / observability / audit | Required | Packet artifacts already prove shape changes | No deterministic size proof is yet persisted for the compact schema | Measure payload bytes in build evidence |
| Testing / validation | Required | Existing validators and packet generation commands already cover artifact correctness | No type-level compact topology model exists yet | Add typecheck/lint plus packet regeneration proof |
| Data / contracts | Required | Contract and generator are aligned on the current raw row arrays | The compact topology shape is not yet owned in TS | Move the schema into `stage-handoff-packet-types.ts` |
| Performance / reliability | Required | Current payloads are bounded but not optimally compact | Repeated key strings waste packet bytes | Replace table-header keys with short stage-aware fields |
| Rollout / rollback | Required | Packet sidecars are additive artifacts | Schema change must not remove markdown fallback | Keep canonical markdown unchanged |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is limited to one packet schema seam, one generator/extractor refactor, one contract update, and one proof artifact chain. It does not expand into broader workflow telemetry or planning redesign.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Generator seam | Yes | None - current process fields are isolated to one file | No |
| Type ownership | Yes | [Data / contracts] [Moderate]: no explicit compact topology interfaces exist yet | Yes |
| Contract seam | Yes | [Performance / reliability] [Moderate]: contract still describes verbose stage-specific arrays rather than compact schema | Yes |
| Proof path | Yes | None - a new slug can regenerate packets and compare payload sizes | No |

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 90% | The refactor stays inside `skill-runner` and one contract doc. |
| Approach | 91% | Compact stage-specific topology types directly address the measured inefficiency. |
| Impact | 86% | The change should reduce packet bytes for process-changing work, though exact savings depend on the chosen field set. |
| Delivery-Readiness | 89% | A bounded proof slug and validation path are clear. |
| Testability | 84% | Typecheck/lint, validators, packet regeneration, and byte measurement provide deterministic proof. |

- **What raises to >=80:** Already at 80%+ on all dimensions.
- **What raises to >=90:** Persist a concrete before/after byte delta for the topology subpayload in regenerated packets.

## Risks

1. **Over-normalization** (Low) - if the compact topology drops useful nuance. Mitigation: keep markdown canonical and preserve key stage-specific text fields.
2. **Schema churn without proof** (Medium) - if the new shape is cleaner but not smaller. Mitigation: make byte reduction an explicit build acceptance check.
3. **Stage drift** (Low) - if one stage uses different field names than the contract. Mitigation: put the schema in TS interfaces and update the contract in the same task.

## Open Questions

None.

## Evidence Gap Review

### Gaps Addressed
- Verified the current raw process-row fields and where they are built.
- Verified no internal code consumers require the current per-column keys.
- Verified a persisted proof slug already exists that can be used as a baseline for comparison.

### Confidence Adjustments
- None.

### Remaining Assumptions
- Compact typed topology objects will remain readable enough for packet consumers while reducing repeated-key overhead.
- Byte measurement against the regenerated proof slug is sufficient evidence for this increment.

## Analysis Readiness

- **Status:** Ready for analysis
- **Rationale:** The problem is now specific and evidenced: the packets are deterministic but still not compact enough. The remaining decision is the exact compact schema and how much of the stage-specific prose should be normalized.
- **Blocking items:** None
- **Recommended analysis focus:** Choose the smallest stage-aware topology schema that materially reduces bytes without pretending markdown is no longer needed.
