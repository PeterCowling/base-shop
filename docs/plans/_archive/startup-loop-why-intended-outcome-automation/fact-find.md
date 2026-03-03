---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: startup-loop-why-intended-outcome-automation
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-why-intended-outcome-automation/plan.md
artifact: fact-find
Trigger-Source: direct-operator-decision: enforce automatic why-and-intended-outcome propagation for lp-do workflow and Build Summary integrity
---

# Startup Loop Why/Intended Outcome Automation Fact-Find Brief

## Scope
### Summary
Design a contract-first workflow change so `why` and `intended outcome` are produced and preserved automatically across `ideas -> fact-find -> plan -> build -> reflect`, with deterministic, non-fabricated output suitable for Build Summary and upcoming automated idea intake.

### Goals
- Define a canonical, machine-readable `why` + `intended outcome` contract at intake (ideas dispatch) and carry it through all downstream artifacts.
- Remove dependence on weak markdown/HTML section scraping as the primary Build Summary source.
- Preserve deterministic behavior and idempotent regeneration.
- Support both measurable and non-measurable work without inventing KPIs.
- Keep trial/live go-live controls aligned with quality gates before autonomous routing expands.

### Non-goals
- Activating `mode: live` immediately.
- Forcing KPI targets on tasks that are operational/documentation-only.
- Rewriting historical artifacts to full parity in one pass.
- Replacing the existing Build Summary UI surface.

### Constraints & Assumptions
- Constraints:
  - Build Summary must not fabricate claims; missing/unknown values must remain explicit.
  - Changes must remain deterministic and static-site compatible.
  - Existing `dispatch.v1` consumers need a safe migration path.
  - Reflection debt remains soft-gate, but minimum payload can be expanded.
- Assumptions:
  - Automated production at ideas intake is expected soon; quality gates must be ready before escalation.
  - Operator accepts adding mandatory contract fields in templates and schemas.
  - For `artifact_delta` triggers, `why`/`intended_outcome` values require explicit operator authoring at Option B confirmation (auto-generation replicates the current quality problem). Schema enforcement is necessary but not sufficient for quality improvement.
  - Direct-inject fact-finds (no dispatch packet) must carry `why`/`intended_outcome` via frontmatter fields (e.g. `Trigger-Why`, `Trigger-Intended-Outcome`) that template propagation carries forward to plan and build-record. TASK-03 must cover both dispatch-routed and direct-inject cases.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` - dispatch schema for intake routing.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts` - trial runtime dispatch emission logic.
- `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` - packet validation and handoff payload.
- `docs/plans/_templates/fact-find-planning.md` - canonical fact-find template.
- `docs/plans/_templates/plan.md` - canonical plan template.
- `docs/plans/_templates/results-review.user.md` - canonical results-review template.
- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` - reflection minimum payload enforcement.
- `scripts/src/startup-loop/generate-build-summary.ts` - Build Summary data generator.
- `docs/business-os/startup-loop-output-registry.user.html` - Build Summary table consumer.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` - automation activation gate.

### Key Modules / Files
- `scripts/src/startup-loop/generate-build-summary.ts`
  - Extracts `why`/`intended` heuristically and falls back to `"—"`.
  - Row schema already includes `why` and `intended`, but source corpus rarely provides them in deterministic locations.
- `docs/business-os/startup-loop-output-registry.user.html`
  - Requires `Why` and `Intended outcome` columns in Build Summary table.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
  - Has `current_truth` and `next_scope_now`, but does not require them and has no strict `why`/`intended` contract.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts`
  - For artifact deltas, emits generic fallback scope strings (`"changed (...)"`, `"Investigate implications..."`).
- `docs/plans/_templates/fact-find-planning.md`
  - Scope summary is free text; no required canonical intended outcome field.
- `docs/plans/_templates/plan.md`
  - No mandatory inherited outcome contract section.
- `docs/plans/_templates/results-review.user.md`
  - Captures observed outcomes but no explicit intended-vs-observed check.
- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`
  - Minimum payload gate checks four sections only; no intended-outcome fidelity check.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
  - Option B queue-with-confirmation active; Option C escalation based on routing precision only.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
  - Go-live gates cover precision/idempotency/rollback; no rationale/outcome payload quality gate.

### Patterns & Conventions Observed
- Startup-loop automation contracts are schema-first with deterministic behavior expectations.
- Build Summary generation expects deterministic extraction and stable serialization.
- Intake-to-build pipeline currently prioritizes routing correctness over semantic quality of rationale/outcome fields.
- Existing templates favor narrative flexibility but do not enforce machine-readable intent propagation.

### Data & Contracts
- Dispatch schema currently requires routing primitives but not rationale/outcome quality fields.
- Loop output contracts require core sections but not a canonical `why/intended` thread.
- Reflection debt contract enforces minimum completion but not expected-vs-observed comparison.
- Build Summary generator consumes mixed source docs with conservative extraction, leading to high missing-field rates.

### Dependency & Impact Map
- Upstream dependencies:
  - `lp-do-ideas` schema/runtime/queue/adapter
  - fact-find/plan/results-review templates
  - loop output contracts + artifact registry
- Downstream dependents:
  - `/lp-do-plan`, `/lp-do-build`, reflection debt emitter
  - Build Summary generator and registry page
  - go-live checklist and live mode seam
- Likely blast radius:
  - `docs/business-os/startup-loop/ideas/*.json|*.md`
  - `scripts/src/startup-loop/lp-do-ideas-*.ts`
  - `docs/plans/_templates/*.md`
  - `docs/business-os/startup-loop/loop-output-contracts.md`
  - `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`
  - `scripts/src/startup-loop/generate-build-summary.ts`

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop maintainers and operators relying on autonomous intake and Build Summary.
- Channel constraints:
  - Static docs + local scripts; no runtime service dependency required.
- Existing templates/assets:
  - Canonical loop templates already centralized in `docs/plans/_templates/`.
- Approvals/owners:
  - Startup-loop maintainers own contracts, skills, and go-live gating.
- Compliance constraints:
  - No fabricated outcomes; unknown must remain explicit.
- Measurement hooks:
  - Current go-live metrics measure routing precision/idempotency but not payload semantic completeness.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Enforcing a typed outcome contract at intake will materially reduce missing `why`/`intended` in Build Summary without ad-hoc per-artifact curation. | Schema + adapter + template updates + auto-population design decision for `artifact_delta` triggers (operator authors at Option B confirmation OR auto-generated values flagged `source:auto` and excluded from quality metrics) | Medium-High | 1-2 days |
| H2 | A measurable/operational dual outcome type prevents KPI fabrication while keeping rows decision-useful. | Contract design + validator rules | Low-Medium | <1 day |
| H3 | Adding intended-vs-observed check to reflection minimum payload improves loop closure quality before live automation. | results-review template + reflection debt updater | Medium | 1 day |
| H4 | Build Summary quality improves more from canonical build events than from stronger heuristic scraping alone. | Build emitter + generator source shift | Medium | 1-2 days |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Current Build Summary missing rates are extreme (`why` 98.9% missing, `intended` 100% missing). | `docs/business-os/_data/build-summary.json` generated stats | High |
| H2 | Current docs often omit measurable fields by design in workflow artifacts. | Existing plan/fact-find corpus + operator feedback | High |
| H3 | Reflection minimum payload currently ignores intended outcome comparison. | `lp-do-build-reflection-debt.ts` + `results-review.user.md` template | High |
| H4 | Generator currently depends on fragile section extraction and fallback. | `generate-build-summary.ts` | High |

#### Falsifiability Assessment
- Easy to test:
  - Schema validation rejects dispatches missing required rationale/outcome fields.
  - New template sections appear in generated artifacts.
  - Build Summary missing-rate drops after first wave of compliant artifacts.
- Hard to test:
  - Semantic quality of free-text `why` statements without over-constraining style.
  - Whether required `why`/`intended_outcome` fields contain operator-authored rationale vs auto-generated template strings — fill-rate metric (`% rows with why != "—"`) cannot distinguish these. A `source: operator|auto` flag or equivalent is needed to make quality measurable separately from presence.
- Validation seams needed:
  - Deterministic validator for required fields/length/type.
  - Migration checks for `dispatch.v1` compatibility window.

#### Recommended Validation Approach
- Quick probes:
  - Compute `% rows with why != "—"` and `% rows with intended != "—"` before/after change.
- Structured tests:
  - Unit tests for dispatch schema v2 validation and adapter required fields.
  - Reflection debt tests with new intended-outcome-check section requirements.
  - Build Summary generator tests preferring canonical event source.
- Deferred validation:
  - Historical backfill completeness beyond first migration scope.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest for startup-loop scripts.
- Commands:
  - Targeted `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --runTestsByPath ...`
- CI integration:
  - Startup-loop script tests and repo validation gate.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Build Summary generation | unit | `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts` | Covers extraction/determinism but not upstream payload quality.
| ideas routing adapter | unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` | Covers route readiness and required routing fields.
| reflection debt | unit | `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts` | Covers current 4-section minimum payload.

#### Coverage Gaps
- Untested paths:
  - Mandatory `why/intended` contract at dispatch ingestion.
  - Cross-stage intent propagation integrity checks.
  - Intended-vs-observed reflection requirement.
- Extinct tests:
  - None identified in this scope.

#### Testability Assessment
- Easy to test:
  - Schema-required-field enforcement and deterministic serialization.
- Hard to test:
  - Human quality of rationale wording.
- Test seams needed:
  - Add explicit contract-lint checks for outcome thread presence.

#### Recommended Test Approach
- Unit tests for:
  - Dispatch v2 required fields, adapter rejection paths, and migration compatibility.
- Integration tests for:
  - fact-find -> plan -> build-record -> results-review artifacts retaining unchanged outcome contract IDs/values.
- Contract tests for:
  - reflection debt minimum payload now includes intended-outcome-check section.

## Questions
### Resolved
- Q: Should we require measurable KPI fields in every plan/build item?
  - A: No. Use a typed contract: `measurable` or `operational`. `operational` still requires a concrete success signal.
  - Evidence: operator explicitly stated current workflow often lacks measurable definitions.
- Q: Is stronger scraping enough to solve Build Summary quality?
  - A: No. Scraping remains fallback only; canonical event emission is needed for reliable automation.
  - Evidence: current missing rates despite existing extraction heuristics.
- Q: Should this wait until live mode activation?
  - A: No. It should be implemented in trial mode first so go-live gates include payload-quality readiness.
  - Evidence: go-live artifacts currently focus on routing precision/idempotency, not semantic payload quality.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: concrete change points and existing deterministic testing patterns.
  - What raises to >=90: complete migration spec (`dispatch.v1` compatibility and cutoff), plus green targeted tests.
- Approach: 88%
  - Evidence basis: contract-first propagation directly addresses observed data-quality failure mode.
  - What raises to >=90: dry-run on one full business cycle proving non-fabrication + improved completeness.
- Impact: 86%
  - Evidence basis: directly improves Build Summary signal and autonomy safety at intake.
  - What raises to >=90: observed reduction in missing-field rate and fewer manual clarifications during intake.
- Delivery-Readiness: 82%
  - Evidence basis: bounded file set and clear ownership, but multi-layer coordination required.
  - What raises to >=90: phased rollout plan with explicit compatibility checkpoints and rollback criteria.
- Testability: 85%
  - Evidence basis: most requirements are schema/template/validator level and deterministic.
  - What raises to >=90: add end-to-end artifact-chain integrity test fixture.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Breaking existing `dispatch.v1` producers/consumers during schema upgrade | Medium | High | Introduce additive `dispatch.v2` + compatibility reader window before hard cutover. |
| Overly strict field requirements create operator friction at intake | Medium | Medium | Allow `operational` intended outcome type with explicit success signal and no KPI requirement. |
| Backfill noise from historical artifacts contaminates Build Summary | Medium | Medium | Mark legacy rows as inferred/backfilled and prefer canonical post-change build events by default. |
| Reflection payload expansion increases unresolved debt volume initially | Medium | Medium | Add staged rollout: warn mode first, then enforce after one cycle. |
| Go-live proceeds without payload-quality gate | Medium | High | Add explicit checklist criteria for rationale/outcome completeness before activation. |
| Auto-generated `why`/`intended_outcome` values satisfy schema validation but not quality goal — fill rate reaches 100% while Build Summary remains semantically empty | High | High | Pair schema enforcement with `source: operator\|auto` flag; exclude auto-sourced values from quality metrics; operator must author values at Option B confirmation. |
| Direct-inject fact-finds have no dispatch packet; `why`/`intended_outcome` are orphaned without explicit frontmatter mechanism | High | Medium | Specify `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields in TASK-03; cover both dispatch-routed and direct-inject propagation paths. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Deterministic contracts and idempotent generation.
  - No fabricated claims or synthetic KPI targets.
  - Canonical path discipline in artifact contracts/templates.
- Rollout/rollback expectations:
  - Roll out in phases (schema, templates, validators, Build Summary source shift).
  - Keep fallback extraction temporarily for pre-migration artifacts.
- Observability expectations:
  - Track coverage metrics: `% dispatches with complete outcome contract`, `% Build Summary rows with non-missing why/intended`, `% reflections with intended-vs-observed verdict`.

## Suggested Task Seeds (Non-binding)
- TASK-01: Define `dispatch.v2` schema and runtime adapter enforcement for `why` and typed `intended_outcome`. (Design decision required: for `artifact_delta` dispatches, operator provides `why`/`intended_outcome` at Option B confirmation step rather than auto-generation, OR auto-generated values are flagged with `source: "auto"` and excluded from quality metrics — choose before implementing. Auto-generation without this distinction replicates the current quality gap at 100% fill rate.)
- TASK-02: Update `lp-do-ideas` trial/live contracts and go-live checklist to include payload-quality gates.
- TASK-03: Update fact-find and plan templates/contracts with required `Outcome Contract` section and frontmatter propagation fields.
- TASK-04: Update build output contracts so `build-record.user.md` includes canonical `why` + `intended outcome` for each built unit.
- TASK-05: Update `results-review.user.md` and reflection-debt validator with required `Intended Outcome Check` section and verdict taxonomy.
- TASK-06: Add canonical build-event artifact emitter and update Build Summary generator to prefer canonical events over heuristic extraction. (Design sketch: (a) emitter artifact — per-plan `build-event.json` with fields `why`, `intended_outcome`, `build_id`, `feature_slug`, `emitted_at`; (b) trigger — `lp-do-build` completion step emits the event after build-record is written; (c) storage — `docs/plans/<slug>/build-event.json`; (d) generator discovery — check for `build-event.json` first, fall back to heuristic extraction if absent.)
- TASK-07: Add migration/backfill strategy for legacy artifacts and a cutover plan for deprecating fallback scraping.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Updated schemas/contracts/templates
  - Updated runtime validators + tests
  - Canonical build-event feed and Build Summary source update
  - Go-live checklist criteria expanded for payload quality
- Post-delivery measurement plan:
  - Baseline and track weekly:
    - Build Summary `why` completeness rate
    - Build Summary `intended` completeness rate
    - Dispatch contract completeness rate
    - Reflection intended-vs-observed completion rate

## Evidence Gap Review
### Gaps Addressed
- Confirmed exact locations where `why`/`intended` are currently optional or absent.
- Quantified current Build Summary missing-field rates.
- Mapped automation-go-live artifacts and identified missing quality gate coverage.

### Confidence Adjustments
- Increased impact confidence after quantifying missing rates and confirming this is a structural, not stylistic, gap.
- Kept delivery-readiness below 90 due to migration and multi-layer rollout coordination.

### Remaining Assumptions
- Existing maintainers accept a versioned dispatch migration (`v1` -> `v2`) rather than in-place breaking changes.
- Canonical build-event emitter can be introduced without disrupting existing output-registry consumers.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-why-intended-outcome-automation --auto`

## Section Omission Rule
None: all relevant sections are populated for this run.
