---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: startup-loop-orchestrated-os-comparison-v2
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-sequence
Related-Plan: docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Orchestrated OS Comparison v2 — Fact-Find Brief

## Scope

### Summary
Define a v2 refactor path that aligns startup-loop workstream naming to the research taxonomy and assigns each in-loop process to one or more canonical workflow phases, while preserving stage-graph stability and downstream compatibility.

### Goals
- Normalize startup-loop workstream names to the research canonical set (CDI/OFF/GTM/OPS/CX/FIN/DATA with full labels).
- Make process-to-workstream assignment explicit and machine-readable (not just implied by section headings or process ID prefix).
- Add explicit process-to-workflow-phase assignment for weekly operating flow.
- Produce a planning-ready migration outline for `/lp-do-plan` with bounded blast radius.

### Non-goals
- Rewriting `docs/business-os/startup-loop/loop-spec.yaml` stage ordering or gate semantics in this run.
- Renumbering or replacing existing process IDs (`CDI-1` .. `DATA-4`).
- Changing business-level operating status for HEAD/PET/BRIK.

### Constraints & Assumptions
- Constraints:
  - Stage IDs and addressing behavior (`--stage`, `--stage-alias`, `--stage-label`) must remain backward compatible.
  - Generated stage-operator artifacts remain deterministic and schema-validated.
  - Existing S10 authority (`weekly-kpcs-decision-prompt.md`) remains canonical for weekly decision logging.
- Assumptions:
  - The research taxonomy in `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` is the target naming model.
  - v2 should be additive-first, with optional label renames only after compatibility checks.

## Evidence Audit (Current State)

### Entry Points
- `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` - canonical research taxonomy and process library.
- `docs/business-os/startup-loop/process-registry-v1.md` - current process-layer contract.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` - canonical operator-facing stage names.
- `docs/business-os/startup-loop/stage-operator-dictionary.schema.json` - naming schema contract.
- `scripts/src/startup-loop/generate-stage-operator-views.ts` - generated naming outputs.
- `scripts/src/startup-loop/stage-addressing.ts` - stage resolution behavior.
- `scripts/src/startup-loop/derive-state.ts` - derived-state stage label source.

### Key Modules / Files
- `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` - defines 7 workstreams and 28 process IDs.
- `docs/business-os/startup-loop/process-registry-v1.md` - already includes all 28 process IDs with stage anchors/cadence.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` - current stage labels (S0..S10) used by runtime displays.
- `docs/business-os/startup-loop/stage-operator-dictionary.schema.json` - currently forbids extra stage fields (`additionalProperties: false`).
- `docs/business-os/startup-loop/_generated/stage-operator-map.json` - runtime naming map consumed by scripts.
- `scripts/src/startup-loop/generate-stage-operator-views.ts` - validation + deterministic generation logic for naming map/table.
- `scripts/src/startup-loop/stage-addressing.ts` - label/alias resolution index built from generated map.
- `scripts/src/startup-loop/derive-state.ts` - sets `stages[stage].name` from `label_operator_short`.
- `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` - dictionary/generator contracts.
- `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` - stage label/addressing contracts.

### Patterns & Conventions Observed
- Research workstream names and process IDs are already represented in v1 process registry, but as markdown section headings labeled `Domain:` rather than first-class workstream fields.
  - Evidence: `docs/business-os/startup-loop/process-registry-v1.md`.
- Current startup-loop control plane remains stage-centric; workstreams are not currently part of stage operator schema.
  - Evidence: `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`.
- Process assignments are explicit to stages, but not explicit to workflow phases.
  - Evidence: Stage Coverage Map in `docs/business-os/startup-loop/process-registry-v1.md`.
- Stage display strings are runtime-significant and consumed by CLI/state layers.
  - Evidence: `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/derive-state.ts`, `docs/business-os/startup-loop/event-state-schema.md`.
- Version drift exists between `loop-spec.yaml` (`1.5.0`) and stage-operator dictionary metadata (`1.3.0`).
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`.

### Data & Contracts
- Types/schemas/events:
  - Stage naming schema: `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`.
  - Stage graph and run packet contract: `docs/business-os/startup-loop/loop-spec.yaml`.
  - Event/state display fields derived from stage labels: `docs/business-os/startup-loop/event-state-schema.md`.
- Persistence:
  - Process-layer docs in `docs/business-os/startup-loop/`.
  - Generated map/table in `docs/business-os/startup-loop/_generated/`.
- API/contracts:
  - Stage addressing APIs consume generated map aliases/labels (`stage-addressing.ts`).

### Dependency & Impact Map
- Upstream dependencies:
  - Research taxonomy and process library.
  - Existing process-registry-v1 and stage-operator contracts.
- Downstream dependents:
  - `/startup-loop` status/advance/recovery surfaces using stage map + labels.
  - Tests for generator/addressing/derive-state.
  - Operator-facing docs that reference stage labels.
- Likely blast radius:
  - Low for additive process metadata in process-registry.
  - Medium for schema/generator changes.
  - High if stage labels/aliases are renamed without compatibility policy.

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop maintainers and venture-studio operator.
- Channel constraints:
  - Changes are contract/documentation + TypeScript runtime helper updates.
- Existing templates/assets:
  - Fact-find planning template and evidence-gap checklist.
  - Existing v1 overlap/decision artifacts in `docs/plans/startup-loop-orchestrated-os-comparison/`.
- Approvals/owners:
  - startup-loop maintainers for schema/runtime naming contracts.
  - Operator for workflow naming language adoption.
- Compliance constraints:
  - None unique beyond existing loop contracts.
- Measurement hooks:
  - VC tests around stage dictionary generation and addressing.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Workstream naming can be normalized without changing stage IDs | Additive taxonomy approach | Low | 1 review cycle |
| H2 | Every process can be assigned to one or more workflow phases with no process ID churn | Process registry completeness | Medium | 1-2 cycles |
| H3 | Main technical risk is schema/generator/addressing compatibility, not process content gaps | Existing tests + consumers | Medium | 1 cycle |
| H4 | v2 should treat workstreams and workflows as separate dimensions (taxonomy vs weekly phase) | Naming model clarity | Low | Immediate |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | 7 workstream names already mirror research wording in process-registry headings | `docs/business-os/startup-loop/process-registry-v1.md`, research brief | High |
| H2 | All 28 process IDs already defined with stage anchors and cadences | `docs/business-os/startup-loop/process-registry-v1.md` | High |
| H3 | Explicit runtime consumers + tests tied to stage labels are known | `stage-addressing.ts`, `derive-state.ts`, related tests | High |
| H4 | Current docs mix stage, domain, workstream, and workflow terms | stage docs + process-registry + research brief | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Completeness of process-to-workstream and process-to-workflow assignment matrices.
  - Backward compatibility for stage addressing behavior.
- Hard to test:
  - Operator comprehension impact from naming refactor without a live pilot.
- Validation seams needed:
  - Contract lint/check ensuring no process remains unassigned.
  - Regression tests for stage label/addressing flows when schema changes.

#### Recommended Validation Approach
- Quick probes:
  - Build a draft mapping table for all 28 processes against both dimensions:
    - workstreams (7 research names),
    - workflow phases (Sense, Decide/Plan, Build/Prepare, Sell/Acquire, Deliver/Support, Measure/Learn, Weekly Review).
- Structured tests:
  - Run stage-operator generator and targeted tests:
    - `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`
    - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
    - `scripts/src/startup-loop/__tests__/derive-state.test.ts`
- Deferred validation:
  - Any stage short-label renaming should be deferred until additive metadata and alias compatibility checks pass.

### Test Landscape

#### Test Infrastructure
- Frameworks:
  - Jest in `scripts/src/startup-loop/__tests__/`.
- Commands:
  - `pnpm --filter <pkg> test -- scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`
  - `pnpm --filter <pkg> test -- scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
  - `pnpm --filter <pkg> test -- scripts/src/startup-loop/__tests__/derive-state.test.ts`
- CI integration:
  - Not fully investigated in this run; assume these tests are part of package-level suites.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Stage dictionary generator | Unit/contract | `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` | Validates required fields, alias uniqueness, deterministic generation |
| Stage addressing | Unit/contract | `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` | Validates ID/alias/label resolution behavior and fail-closed semantics |
| Derived state naming | Unit | `scripts/src/startup-loop/__tests__/derive-state.test.ts` | Validates deterministic stage-state projection and stage name population |

#### Coverage Gaps
- Untested paths:
  - No dedicated tests yet for future workstream metadata fields in stage dictionary/map.
  - No explicit contract tests for process-to-workflow-phase assignment completeness.
- Extinct tests:
  - Not investigated.

#### Testability Assessment
- Easy to test:
  - Schema and generator extensions.
  - Backward-compatible addressing behavior.
- Hard to test:
  - Human/operator interpretation improvements from naming changes.
- Test seams needed:
  - Assignment completeness validator (all processes mapped to >=1 workflow phase and exactly 1 canonical workstream).

#### Recommended Test Approach
- Unit tests for:
  - New schema fields and generator output structure.
- Integration tests for:
  - Stage addressing compatibility after map changes.
- Contract tests for:
  - Process assignment matrix completeness and no-orphan process IDs.

### Recent Git History (Targeted)
- `a21f930dfe` - Added `process-registry-v1` and orchestrated OS comparison artifacts (establishes v1 baseline).
- `10009b845d` - Added CAP-05/06 schemas (`sales-ops-schema.md`, `retention-schema.md`) that now depend on process-registry naming.
- `2c2f55d622` - Added stage-operator naming guardrails and tests (relevant for v2 compatibility).
- `c85fcb0953` - Added event ledger + derived state implementation using stage operator labels.

## External Research (If Needed)
- Primary research baseline is saved and discoverable at: `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`.

## Initial Findings

1. The research workstream taxonomy is already partially embedded in v1, but not yet formalized as canonical machine-readable metadata.
2. The largest remaining gap for this v2 objective is not process coverage (already strong) but vocabulary contract consistency across:
   - process registry,
   - stage operator schema,
   - generated map consumers,
   - operator-facing docs.
3. “Workstream” and “workflow” are currently conflated. v2 should define them separately:
   - `workstream` = business-function lane (7 canonical research names),
   - `workflow_phase` = weekly operating cycle phase.
4. Existing stage-label contracts are brittle by design (exact-match label resolution). Any renaming strategy must preserve compatibility via aliases or additive fields before label swaps.

## Questions

### Resolved
- Q: Do we already have the 28 research process IDs represented in current startup-loop contracts?
  - A: Yes; they are all present in `process-registry-v1.md`.
  - Evidence: `docs/business-os/startup-loop/process-registry-v1.md`.

- Q: Are research workstream names already reflected anywhere in current docs?
  - A: Yes, as `Domain` section labels in `process-registry-v1.md`, but not as first-class schema fields.
  - Evidence: `docs/business-os/startup-loop/process-registry-v1.md`, research workstreams map.

- Q: Where is the highest technical coupling risk for naming refactors?
  - A: Stage operator dictionary -> generated map -> stage addressing + derived-state consumers.
  - Evidence: `stage-operator-dictionary.yaml`, `generate-stage-operator-views.ts`, `stage-addressing.ts`, `derive-state.ts`.

### Open (User Input Needed)
None blocking for `/lp-do-plan`. One scope decision can be handled as an early plan task:
- Should v2 stop at additive metadata + process assignment, or also rename stage short labels to workstream-oriented labels?
  - Default assumption for planning: additive metadata first; stage label renames deferred.

## Confidence Inputs
- Implementation: 86%
  - Evidence basis: primary files and consumers are identified; mappings already exist in v1.
  - What raises to >=80: already met.
  - What raises to >=90: draft and validate a machine-readable assignment schema before implementation tasks.
- Approach: 84%
  - Evidence basis: additive-first strategy aligns with prior v1 boundary decision and known coupling points.
  - What raises to >=80: already met.
  - What raises to >=90: explicit decision on whether stage label renaming is in-scope for v2.
- Impact: 87%
  - Evidence basis: directly improves loop comprehensibility and enables cleaner orchestration docs/plans.
  - What raises to >=80: already met.
  - What raises to >=90: complete assignment matrix + operator-facing naming consistency across key docs.
- Delivery-Readiness: 82%
  - Evidence basis: required contract surfaces are localized and testable.
  - What raises to >=80: already met.
  - What raises to >=90: run targeted tests proving no stage-addressing regression.
- Testability: 79%
  - Evidence basis: strong coverage for stage naming contracts; missing assignment-completeness tests.
  - What raises to >=80: add assignment validator tests.
  - What raises to >=90: include migration compatibility tests for any renamed labels/aliases.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Stage label rename breaks `--stage-label` exact matches | Medium | High | Keep stage labels stable in first wave; use additive metadata and aliases first |
| Workstream/workflow vocabulary drift across docs | High | Medium | Add a canonical taxonomy contract file and reference it from loop docs |
| Process assignment remains implicit in markdown prose | Medium | Medium | Introduce machine-readable assignment table with validation contract |
| Schema changes create generator drift | Medium | Medium | Extend tests + run generator check before merge |
| Over-scoping into loop-spec stage-graph changes | Medium | High | Keep explicit v2 boundary: naming/assignment refactor only |
| Operator confusion from parallel naming systems | Medium | Medium | Publish a one-page glossary + mapping table in operator guide |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve canonical stage IDs and loop ordering in `loop-spec.yaml`.
  - Preserve S10 weekly decision authority contract.
  - Keep generated stage operator artifacts deterministic.
- Rollout/rollback expectations:
  - Rollout: additive taxonomy + assignments first; optional label renames only in later wave.
  - Rollback: revert to v1 process-registry naming and remove new metadata fields without touching stage graph.
- Observability expectations:
  - Add validation checks: no unmapped process IDs, no invalid workstream/workflow labels, no addressing regressions.

## Suggested Task Seeds (Non-binding)
- TASK-00 (DECISION): Lock v2 scope boundary (additive taxonomy only vs taxonomy + stage label rename).
- TASK-01 (INVESTIGATE): Build authoritative vocabulary map:
  - current terms (stage/domain/workstream/workflow),
  - target canonical terms from research,
  - migration aliases.
- TASK-02 (IMPLEMENT): Define `workstream-taxonomy-v2` contract with 7 canonical names + IDs + descriptions.
- TASK-03 (IMPLEMENT): Refactor `process-registry-v1.md` to v2 structure:
  - replace `Domain:` sections with `Workstream:` sections,
  - add explicit fields for `workstream_id` and `workflow_phases[]` per process.
- TASK-04 (IMPLEMENT): Add machine-readable assignment artifact (YAML/JSON/CSV) for all 28 process IDs.
- TASK-05 (IMPLEMENT): Extend stage-operator dictionary schema/generator only as needed for additive workstream metadata.
- TASK-06 (IMPLEMENT): Update consumers/docs that rely on generated stage labels/maps (`event-state-schema.md`, addressing references).
- TASK-07 (IMPLEMENT): Add validation contracts/tests for:
  - assignment completeness,
  - label/addressing backwards compatibility,
  - generator drift checks.
- TASK-08 (CHECKPOINT): Pilot-readiness checkpoint with clear go/no-go criteria for optional stage label rename wave.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-plan`
- Supporting skills:
  - `lp-do-build`, `lp-sequence`, `lp-do-replan` (if confidence falls below threshold during planning)
- Deliverable acceptance package:
  - v2 taxonomy contract,
  - v2 process assignment matrix,
  - updated process registry structure,
  - compatibility + validation evidence.
- Post-delivery measurement plan:
  - 2-week operator trial measuring:
    - decision traceability clarity,
    - time-to-map weekly priorities to processes,
    - number of naming-related ambiguities in weekly review notes.

## Evidence Gap Review

### Gaps Addressed
- Identified all primary contract and runtime consumers touched by naming/assignment refactor.
- Confirmed 28-process baseline already exists and can be reused.
- Isolated highest-risk compatibility seams (stage label/addressing).

### Confidence Adjustments
- Reduced testability confidence below 80 due to missing assignment-completeness tests.
- Kept delivery-readiness in low 80s because scope is bounded and additive-first.

### Remaining Assumptions
- Additive-first migration is acceptable for v2.
- Process-to-workflow-phase taxonomy chosen in planning will match operator mental model.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-orchestrated-os-comparison-v2`
