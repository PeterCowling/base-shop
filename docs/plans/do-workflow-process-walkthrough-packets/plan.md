---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-process-walkthrough-packets
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-process-walkthrough-packets/analysis.md
artifact: plan
---

# DO Workflow Process Walkthrough Packets Plan

## Summary

Lift the new walkthrough/process sections into compact DO stage handoff packet rows, add a deterministic analysis validator and wrapper, update workflow guidance to require that validator, and prove the full path with a persisted feature slug, generated packet sidecars, and validation evidence.

## Active tasks
- [x] TASK-01: Extend the packet contract and generator with compact process-row extraction
- [x] TASK-02: Add `validate-analysis` and wire workflow guidance to it
- [x] TASK-03: Persist packet sidecars and validate the new path end to end

## Goals
- keep walkthrough quality gains while preserving packet-first progressive disclosure,
- eliminate the analysis validator gap,
- prove the new path with a real workflow slug and regenerated packets.

## Non-goals
- replacing canonical markdown artifacts,
- redesigning workflow telemetry,
- building a larger runtime session handoff system.

## Constraints & Assumptions
- Constraints:
  - packet fields must stay source-derived and compact,
  - analysis validator section names must match the actual skill/template language,
  - build still escalates to the full task block before execution.
- Assumptions:
  - table-shaped walkthrough sections are stable enough for deterministic extraction,
  - targeted typecheck/lint plus workflow validators are sufficient proof for this increment.

## Inherited Outcome Contract
- **Why:** The walkthrough gate fixed a planning-quality blind spot, but it made the markdown artifacts larger. If the handoff packets keep omitting those new process sections, downstream stages will reopen full upstream markdown and lose much of the deterministic token-efficiency gain.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO workflow packets carry compact walkthrough/process rows for fact-find, analysis, and plan, and analysis has a deterministic validator so packet-first progressive disclosure remains real after the walkthrough gate.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-process-walkthrough-packets/analysis.md`
- Selected approach inherited:
  - extend packets with compact process-row fields,
  - add a deterministic analysis validator in the same increment,
  - preserve packet-first, not packet-only, workflow behavior.
- Key reasoning used:
  - the new walkthrough sections are already table-shaped,
  - analysis is the only planning-stage artifact without its own deterministic validator,
  - telemetry-first measurement alone would not fix the current workflow mismatch.

## Selected Approach Summary
- What was chosen:
  - update the packet contract to require the new walkthrough/process-row fields,
  - extend packet generation to extract current-process, end-state, and delivered-process rows,
  - add `validate-analysis.sh` plus `skill-runner` validator/CLI wiring,
  - update the analysis skill and feature workflow guide to require the new validator,
  - regenerate packet sidecars and validation artifacts for this slug.
- Why planning is not reopening option selection:
  - analysis already settled that packetization and deterministic validation belong in the same bounded increment.

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-process-walkthrough-packets/fact-find.md`
- Evidence carried forward:
  - packet generator omits the new process sections today,
  - the process sections already match deterministic table extraction patterns,
  - fact-find and plan validators already exist and establish the desired validator pattern.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend the packet contract and generator with compact process-row extraction | 89% | M | Complete (2026-03-12) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add `validate-analysis` and wire workflow guidance to it | 87% | M | Complete (2026-03-12) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Persist packet sidecars and validate the new path end to end | 85% | S | Complete (2026-03-12) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: workflow/process change only | - | no product UI |
| UX / states | packet-first workflow remains truthful for process-changing features | TASK-01, TASK-02, TASK-03 | packets carry the new process rows |
| Security / privacy | packet and validator data stays repo-local and source-derived | TASK-01, TASK-03 | no new external inputs |
| Logging / observability / audit | generated packet sidecars and validation artifacts prove the path | TASK-01, TASK-02, TASK-03 | optional workflow telemetry may be appended if recorded |
| Testing / validation | typecheck/lint plus fact-find/analysis/plan/engineering validators and packet generation | TASK-01, TASK-02, TASK-03 | no local Jest runs |
| Data / contracts | one packet contract plus one new validator family | TASK-01, TASK-02 | additive contract evolution |
| Performance / reliability | bounded process rows reduce needless markdown reopening | TASK-01, TASK-03 | packet-first remains the default |
| Rollout / rollback | additive packet fields and additive validator introduction | TASK-02, TASK-03 | markdown fallback remains unchanged |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract and generator first so downstream docs/tools refer to real fields. |
| 2 | TASK-02 | TASK-01 | Validator and workflow guidance align to the new packet semantics. |
| 3 | TASK-03 | TASK-01, TASK-02 | Persist packet sidecars and proof artifacts against the final rules. |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| AREA-01: fact-find -> analysis process handoff | `lp-do-analysis` starts on process-changing work | Analysis loads `fact-find.packet.json`, reads compact current-process trigger/end-condition/area rows first, then opens `fact-find.md` only if packet detail is insufficient or a cited claim needs verification | TASK-01 -> TASK-03 | Older packet files remain valid but lack the new rows until regenerated |
| AREA-02: analysis -> plan operating-model handoff | `lp-do-plan` starts | Plan loads `analysis.packet.json`, reads end-state operating-model rows there first, and reopens `analysis.md` only when planning needs path-specific supporting detail | TASK-01 -> TASK-02 -> TASK-03 | Option nuance still lives in markdown by design |
| AREA-03: plan -> build delivered-process handoff | `lp-do-build` starts | Build loads `plan.packet.json`, sees task briefs plus delivered-process rows, then escalates to the specific task block in `plan.md` before execution | TASK-01 -> TASK-03 | Packet-first must not be misread as task-block replacement |
| AREA-04: analysis validation path | `lp-do-analysis` is ready to persist | Analysis runs `validate-analysis.sh`; for code/mixed work it then runs `validate-engineering-coverage.sh`; after required validators pass it emits `analysis.packet.json` | TASK-02 -> TASK-03 | Historical analyses are only checked when touched or rerun |

## Validation Contracts
- TC-01: `@acme/skill-runner` typecheck/lint stay green after the packet + validator changes
- TC-02: fact-find, analysis, plan, and engineering-coverage validators pass for this slug
- TC-03: regenerated packet sidecars include the new process-row fields

## Tasks

### TASK-01: Extend the packet contract and generator with compact process-row extraction
- **Type:** IMPLEMENT
- **Deliverable:** code/doc change in packet contract + `packages/skill-runner`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Updated `do-stage-handoff-packet-contract.md` to require compact process-row fields for fact-find, analysis, and plan.
  - Extended `generate-stage-handoff-packet.ts` to extract `Current Process Map`, `End-State Operating Model`, and `Delivered Processes` rows plus explicit `None:` handling.
  - Generated packet sidecars for this slug showing the new fields present.
- **Affects:** `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`, `packages/skill-runner/src/generate-stage-handoff-packet.ts`, `packages/skill-runner/src/stage-handoff-packet-markdown.ts`, `[readonly] docs/plans/_templates/fact-find-planning.md`, `[readonly] docs/plans/_templates/analysis.md`, `[readonly] docs/plans/_templates/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 89%
  - Implementation: 90% - the new sections already match the existing parser helpers.
  - Approach: 90% - packetizing the tables is the smallest deterministic lift.
  - Impact: 89% - it restores packet-first value for process-changing features.
- **Acceptance:**
  - packet contract names the new process-row fields for fact-find, analysis, and plan,
  - generated packets include compact walkthrough/process rows when those sections are present,
  - explicit `None:` process sections remain represented as no-topology-change rather than malformed rows.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - packet-first handoff stays coherent
  - Security / privacy: Required - source-derived extract only
  - Logging / observability / audit: Required - packet outputs are deterministic artifacts
  - Testing / validation: Required - typecheck/lint plus packet generation proof
  - Data / contracts: Required - contract and generator must stay aligned
  - Performance / reliability: Required - bounded extraction only, no prose duplication
  - Rollout / rollback: Required - additive packet fields only
- **Validation contract (TC-01):**
  - TC-01-A: `pnpm --filter @acme/skill-runner typecheck`
  - TC-01-B: `pnpm --filter @acme/skill-runner lint`
  - TC-01-C: generated packets for this slug include process-row fields for all three upstream stages
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: source inspection of packet contract, generator, and templates
  - Validation artifacts: updated contract + generated packet files
  - Unexpected findings: none
- **Edge Cases & Hardening:** explicit `None:` sections must not be mistaken for missing sections

### TASK-02: Add validate-analysis and wire workflow guidance to it
- **Type:** IMPLEMENT
- **Deliverable:** validator + CLI/shell wrapper + workflow doc/skill updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Added `validate-analysis.ts`, CLI wrapper, exported entrypoint, and `scripts/validate-analysis.sh`.
  - Updated `.claude/skills/lp-do-analysis/SKILL.md` so `validate-analysis.sh` is required before packet generation and telemetry recording.
  - Updated `docs/agents/feature-workflow-guide.md` to list `validate-analysis.sh` and note that walkthrough rows should travel in packets for process-changing work.
- **Affects:** `packages/skill-runner/src/validate-analysis.ts`, `packages/skill-runner/src/cli/validate-analysis.ts`, `packages/skill-runner/src/index.ts`, `scripts/validate-analysis.sh`, `.claude/skills/lp-do-analysis/SKILL.md`, `docs/agents/feature-workflow-guide.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 87%
  - Implementation: 88% - fact-find/plan validator patterns can be mirrored directly.
  - Approach: 88% - adding the missing validator keeps analysis aligned with the other planning stages.
  - Impact: 87% - the new walkthrough section becomes a real gate, not a soft instruction.
- **Acceptance:**
  - `validate-analysis.sh` exists and returns non-zero when required analysis sections are missing,
  - `lp-do-analysis` requires `validate-analysis.sh` before packet generation,
  - the feature workflow guide lists the new helper.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - workflow instructions match actual validator path
  - Security / privacy: Required - local artifact validation only
  - Logging / observability / audit: Required - deterministic check becomes explicitly named
  - Testing / validation: Required - typecheck/lint and validator pass/fail behavior
  - Data / contracts: Required - required section set is explicit
  - Performance / reliability: Required - validator is lightweight and deterministic
  - Rollout / rollback: Required - additive helper; workflow can still open markdown on demand
- **Validation contract (TC-02):**
  - TC-02-A: `scripts/validate-analysis.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md`
  - TC-02-B: `pnpm --filter @acme/skill-runner typecheck`
  - TC-02-C: `pnpm --filter @acme/skill-runner lint`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: validator seam and workflow docs inspection
  - Validation artifacts: new validator files + updated skill/guide
  - Unexpected findings: none
- **Edge Cases & Hardening:** status and required-section checks should be strict enough to catch missing end-state operating models without inventing critique dependencies

### TASK-03: Persist packet sidecars and validate the new path end to end
- **Type:** IMPLEMENT
- **Deliverable:** persisted workflow docs, packet sidecars, validation evidence, and build record
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - `scripts/validate-fact-find.sh`, `scripts/validate-analysis.sh`, `scripts/validate-plan.sh`, and `scripts/validate-engineering-coverage.sh` all passed for this slug.
  - Regenerated `fact-find.packet.json`, `analysis.packet.json`, and `plan.packet.json`.
  - `build-record.user.md` captures the validation evidence and the fact that workflow telemetry was not recorded in this turn.
- **Affects:** `docs/plans/do-workflow-process-walkthrough-packets/fact-find.md`, `docs/plans/do-workflow-process-walkthrough-packets/analysis.md`, `docs/plans/do-workflow-process-walkthrough-packets/plan.md`, `docs/plans/do-workflow-process-walkthrough-packets/fact-find.packet.json`, `docs/plans/do-workflow-process-walkthrough-packets/analysis.packet.json`, `docs/plans/do-workflow-process-walkthrough-packets/plan.packet.json`, `docs/plans/do-workflow-process-walkthrough-packets/critique-history.md`, `docs/plans/do-workflow-process-walkthrough-packets/build-record.user.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 86% - validator and packet generation commands are deterministic.
  - Approach: 87% - a real feature slug is the cleanest proof for the workflow path.
  - Impact: 85% - proves the new packet/validator contract is runnable end to end.
- **Acceptance:**
  - fact-find, analysis, plan, and build-record exist for this slug,
  - all three packet sidecars are regenerated and include the new process-row data,
  - targeted validators pass and validation evidence is recorded.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface
  - UX / states: Required - packet-first handoff is proven across stages
  - Security / privacy: Required - all proof artifacts stay repo-local
  - Logging / observability / audit: Required - validation evidence is persisted; workflow telemetry may be recorded when run
  - Testing / validation: Required - fact-find/analysis/plan/engineering validators plus packet generation
  - Data / contracts: Required - packet outputs match the updated contract
  - Performance / reliability: Required - packet generation is stable
  - Rollout / rollback: Required - proof is additive, not destructive
- **Validation contract (TC-03):**
  - TC-03-A: `scripts/validate-fact-find.sh docs/plans/do-workflow-process-walkthrough-packets/fact-find.md docs/plans/do-workflow-process-walkthrough-packets/critique-history.md`
  - TC-03-B: `scripts/validate-analysis.sh docs/plans/do-workflow-process-walkthrough-packets/analysis.md`
  - TC-03-C: `scripts/validate-plan.sh docs/plans/do-workflow-process-walkthrough-packets/plan.md`
  - TC-03-D: `scripts/validate-engineering-coverage.sh docs/plans/do-workflow-process-walkthrough-packets/plan.md`
  - TC-03-E: `scripts/generate-stage-handoff-packet.sh docs/plans/do-workflow-process-walkthrough-packets/fact-find.md`, `.../analysis.md`, `.../plan.md`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: validators, packet generation, targeted package typecheck/lint
  - Validation artifacts: packet sidecars + build record
  - Unexpected findings: none
- **Edge Cases & Hardening:** the build proof should show that packets remain additive and the workflow still opens markdown on demand

## Risks & Mitigations
- Packet fields drift from the templates
  - Mitigation: extract directly from the current section/table structure and keep the contract explicit.
- Analysis validator becomes stricter than legacy artifacts can satisfy
  - Mitigation: use additive rollout; validator applies to touched/new analyses via workflow.
- Packet-first gets misread as packet-only
  - Mitigation: keep markdown fallback wording in the contract and skill docs.

## Observability
- Logging: packet sidecars and validator outputs persist as repo artifacts.
- Metrics: existing workflow telemetry can capture packet paths if recorded for this slug.
- Alerts/Dashboards: none.

## Acceptance Criteria (overall)
- [x] DO stage handoff packets include compact process-row fields for fact-find, analysis, and plan.
- [x] `validate-analysis.sh` exists and is wired into the analysis workflow guidance.
- [x] The new feature slug emits passing fact-find, analysis, plan, engineering-coverage, and packet-generation evidence.

## Decision Log
- 2026-03-12: Kept the walkthrough gate and lifted its compact row data into the existing packet system rather than creating another sidecar family.
- 2026-03-12: Added deterministic analysis validation in the same increment because leaving it out would preserve a known asymmetry.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: packet contract + generator | Yes | None | No |
| TASK-02: analysis validator path | Yes | None - validator pattern already exists in fact-find/plan | No |
| TASK-03: proof artifacts and generated packets | Yes | [Logging / observability / audit] [Minor]: workflow telemetry recording is optional to the acceptance proof but useful if time permits | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
- `(89*2 + 87*2 + 85*1) / 5 = 87.4%`

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
