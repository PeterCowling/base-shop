---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Mixed
Created: 2026-02-24
Last-updated: 2026-02-24
Feature-Slug: startup-loop-legal-container-insertion
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-plan
Related-Plan: docs/plans/startup-loop-legal-container-insertion/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
---

# Startup Loop Legal Container Insertion Fact-Find Brief

## Scope
### Summary
Define where and how to add a new `LEGAL` container to startup-loop so legal protection work starts immediately after ASSESSMENT, with two staged processes: first trademark/IP protection research, second legal positioning and terms/claims risk design.

### Goals
- Add a new stage container `LEGAL` to canonical stage topology.
- Define `LEGAL-01` as trademark and legal-protection initiation for brand then product line.
- Define `LEGAL-02` as competitive/compelling claims + terms and conditions de-risking stage.
- Ensure this addition does not collide with existing FIN-3 compliance ownership.
- Define a clear gate contract so MEASURE does not start until legal baseline outputs exist.

### Non-goals
- Drafting full legal copy for each business in this pass.
- Replacing FIN-3 incident/compliance runbooks.
- Implementing all downstream skill files in this fact-find pass.

### Constraints & Assumptions
- Constraints:
  - Stage ordering authority is `docs/business-os/startup-loop/loop-spec.yaml`.
  - Process definition authority is `docs/business-os/startup-loop/process-registry-v2.md` and `process-assignment-v2.yaml`.
  - Existing stage IDs and aliases should remain backward-compatible.
- Assumptions:
  - Legal protection must begin before MEASURE/market execution to reduce brand/IP and claims risk.
  - Terms/claims framing can be designed pre-launch at policy level, then refined in WEBSITE/DO.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` - canonical stage graph and ordering.
- `docs/business-os/startup-loop/process-registry-v2.md` - process model and workstream boundaries.
- `docs/business-os/startup-loop/process-assignment-v2.yaml` - process IDs and activation model.
- `docs/business-os/startup-loop/artifact-registry.md` - canonical artifact path contracts.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/business-os/startup-loop/process-registry-v2.md`
- `docs/business-os/startup-loop/process-assignment-v2.yaml`
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- `docs/business-os/startup-loop-workflow.user.md`
- `docs/business-os/startup-loop/artifact-registry.md`
- `docs/business-os/startup-loop/exception-runbooks-v1.md`

### Patterns & Conventions Observed
- New containers are introduced with explicit sub-stage IDs and ordering comments in `loop-spec.yaml`.
- Container insertions are tracked by spec version bump comments in `loop-spec.yaml` header.
- Optional profile-specific containers (example: LOGISTICS) use explicit conditional semantics and absent-safe consumer rules.
- Process registry keeps legal/compliance currently under FIN (`FIN-3`), but no dedicated LEGAL container/stages exist.

### Data & Contracts
- Stage sequencing contract: `docs/business-os/startup-loop/loop-spec.yaml` (`ordering.sequential`).
- Process contract: `docs/business-os/startup-loop/process-registry-v2.md`.
- Artifact path contract: `docs/business-os/startup-loop/artifact-registry.md`.
- Loop output contract registry: `docs/business-os/startup-loop/loop-output-contracts.md` (LEGAL outputs not yet defined here — new LEGAL artifact entries must be added as part of this work).

### Proposed LEGAL Stage Contract (for planning)
- Container: `LEGAL` (unconditional, all profiles).
- Stage 1 (`LEGAL-01`): trademark/IP and legal protection research.
  - Minimum output: `docs/business-os/strategy/<BIZ>/legal-trademark-protection.user.md`
  - Purpose: initiate legal protections for business name/brand and then product line.
- Stage 2 (`LEGAL-02`): competitive/compelling claims and T&C risk architecture.
  - Minimum output: `docs/business-os/strategy/<BIZ>/legal-claims-terms.user.md`
  - Purpose: define claims posture, prohibited claim classes, and customer-facing terms baseline before MEASURE.
- Proposed gate: `GATE-LEGAL-00 (Hard)` at `LEGAL -> MEASURE-00`.
  - Pass condition: both LEGAL outputs exist and are `Status: Active` with jurisdiction baseline declared.

### Dependency & Impact Map
- Upstream dependencies:
  - `ASSESSMENT` output completion (`ASSESSMENT-10`, `ASSESSMENT-11`, container gate).
- Downstream dependents:
  - `MEASURE-00`, `MEASURE-01`, `MEASURE-02`, and all market/sell/website work relying on claim and policy posture.
- Likely blast radius:
  - `loop-spec.yaml` stage definitions and ordering.
  - workflow stage docs and operator dictionary.
  - process registry and assignment taxonomy.
  - startup-loop tooling/tests that validate stage IDs and ordering.
  - `docs/business-os/startup-loop/_generated/stage-operator-map.json` — generated from the stage spec; must be regenerated after LEGAL stages are added, or stage-addressing tests will pass against stale data and silently miss the new IDs.

## Questions
### Resolved
- Q: Where should LEGAL be inserted to satisfy “post assessment”?
  - A: Immediately after `ASSESSMENT` container completion and before `MEASURE-00`.
  - Evidence: `loop-spec.yaml` currently sequences `ASSESSMENT -> MEASURE-00` directly.

- Q: Is legal/compliance already modeled elsewhere?
  - A: Yes, partially in `FIN-3`, but only as broad ongoing compliance/risk readiness; no dedicated early legal protection and claim/T&C strategy stages exist.
  - Evidence: `process-registry-v2.md` (`FIN-3` rows and stage coverage map).

- Q: How should new legal work avoid colliding with FIN-3?
  - A: LEGAL should own pre-launch legal strategy/protection artifacts; FIN-3 remains owner of ongoing compliance operations and incident readiness.
  - Evidence: `process-registry-v2.md`, `exception-runbooks-v1.md`.

### Open (User Input Needed)
- Q: Which jurisdiction baseline should LEGAL default to (EU-only, US-only, dual-track)?
  - Why it matters: determines trademark classing, consumer terms defaults, and claim rules.
  - Decision impacted: LEGAL-01/LEGAL-02 prompt and acceptance criteria.
  - Decision owner: Operator.
  - Default assumption + risk: default EU-first with optional US appendix; risk is under-protection for US-first brands. This default is unverified against the current business cohort — operator must confirm jurisdiction baseline before LEGAL-01 acceptance criteria can be locked.

## Confidence Inputs
- Implementation: 85%
  - Basis: container/stage insertion patterns are well established in `loop-spec.yaml`.
  - To reach >=90: include stage-addressing/test updates in same plan.
- Approach: 88%
  - Basis: post-ASSESSMENT insertion aligns with user intent and current sequence boundary.
  - To reach >=90: lock legal artifact schema and gate semantics before build.
- Impact: 75%
  - Basis: introduces a structurally mandated legal protection step before go-to-market; no pilot evidence yet that operators use it effectively or that rework is reduced.
  - To reach >=85%: track actual reduction in late legal/claims rework across first two businesses that complete LEGAL and reach WEBSITE/DO stages.
- Delivery-Readiness: 82%
  - Basis: clear insertion point and stage naming; cross-doc updates are known.
  - To reach >=90: finalize jurisdiction policy and output templates.
- Testability: 80%
  - Basis: topology and ID checks are script-testable; legal quality itself is partly review-based.
  - To reach >=90: add deterministic contract lint for required LEGAL sections/fields.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| LEGAL and FIN-3 scope overlap causes ownership ambiguity | Medium | High | Add explicit collision notes in process registry: LEGAL=pre-launch legal strategy, FIN-3=ongoing compliance operations/incidents |
| Stage insertion breaks existing sequence tooling | Medium | High | Update stage-addressing/derive-state and add targeted startup-loop tests |
| Terms/claims guidance too generic to be actionable | Medium | Medium | Define required LEGAL-02 output schema with concrete sections and decision fields |
| Jurisdiction ambiguity produces weak legal output | High | High | Add explicit jurisdiction input requirement at LEGAL-01 entry |
| GATE-ASSESSMENT-01 displaced by LEGAL insertion, leaving ASSESSMENT exit ungated or pointing at a non-existent edge | High | Critical | Determine at planning stage whether GATE-ASSESSMENT-01 moves to guard `ASSESSMENT → LEGAL-01`, or a new gate is created at `LEGAL → MEASURE-00`; do not allow plan to ship without explicit gate disposition |
| LEGAL container added without hard gate, allowing MEASURE to bypass legal baseline | Medium | Critical | Add `GATE-LEGAL-00 (Hard)` at `LEGAL → MEASURE-00` with explicit pass conditions and contract test |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve canonical ID style: `LEGAL`, `LEGAL-01`, `LEGAL-02`.
  - Keep `loop-spec.yaml` as stage authority; process docs as operational authority.
- Rollout/rollback expectations:
  - Rollout behind contract/docs update first, then tooling + stage dictionary updates.
  - Rollback by removing `LEGAL` links and restoring `ASSESSMENT -> MEASURE-00` direct edge.
- Observability expectations:
  - Track LEGAL stage completion and legal artifact freshness in stage status output.

## Suggested Task Seeds (Non-binding)
- Add `LEGAL` container to `loop-spec.yaml` with two sequential child stages:
  - `LEGAL-01`: Trademark/IP and legal-protection research kickoff (post-ASSESSMENT).
  - `LEGAL-02`: Competitive/compelling claim posture + T&C/legal-risk architecture.
- Update `ordering.sequential` to:
  - `ASSESSMENT -> LEGAL-01 -> LEGAL-02 -> LEGAL -> MEASURE-00`.
- Add gate contract:
  - `GATE-LEGAL-00 (Hard)` at `LEGAL -> MEASURE-00`.
  - Explicitly resolve interaction with existing `GATE-ASSESSMENT-01` (move, split, or keep + add LEGAL gate).
- Add LEGAL stage entries to:
  - `stage-operator-dictionary.yaml`
  - `startup-loop-workflow.user.md`
  - `process-registry-v2.md` and `process-assignment-v2.yaml` (new legal processes)
  - `artifact-registry.md` (new legal artifacts and canonical paths)
- Add process IDs in process registry/assignment:
  - `LEG-1`: Trademark/IP and legal-protection research (post-ASSESSMENT initiation).
  - `LEG-2`: Competitive/compelling claims + terms/risk architecture.
- Regenerate `docs/business-os/startup-loop/_generated/stage-operator-map.json` after adding LEGAL stages to `loop-spec.yaml`; run stage-addressing tests against the updated map to validate LEGAL-01/LEGAL-02 ID resolution.
- Add targeted script tests for new stage IDs, ordering compatibility, and ASSESSMENT→LEGAL→MEASURE edge sequencing.

## Test Landscape
### Existing Coverage
- `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` — covers canonical ID resolution (VC-01..VC-04), alias resolution, and near-match label rejection. Imports `docs/business-os/startup-loop/_generated/stage-operator-map.json` (generated artifact).
- `scripts/src/startup-loop/__tests__/derive-state.test.ts` — covers stage topology ordering and state derivation from `loop-spec.yaml`.

### At-Risk Tests
- All tests importing `stage-operator-map.json` will pass silently against stale data if the map is not regenerated after LEGAL stages are added to `loop-spec.yaml`.
- Any test that asserts the direct `ASSESSMENT → MEASURE-00` edge will fail after the edge is replaced with `ASSESSMENT → LEGAL-01 → LEGAL-02 → LEGAL → MEASURE-00`.

### Required New Tests
- LEGAL-01 and LEGAL-02 canonical ID resolution via `resolveById` and `resolveByAlias`.
- `ASSESSMENT → LEGAL-01 → LEGAL-02 → LEGAL → MEASURE-00` ordering preserved in `ordering.sequential`.
- Gate disposition validation: whichever gate guards ASSESSMENT exit (GATE-ASSESSMENT-01 moved or new gate) is exercised.
- Deterministic contract lint for required LEGAL artifact sections (once schema is defined in planning).

## Hypothesis & Validation Landscape
### Primary Hypothesis
Adding mandatory LEGAL stages before MEASURE will reduce late-stage legal and claims rework, measurable as the count of legal-driven revision cycles at WEBSITE or DO stages per business cycle.

### Existing Signal Coverage
No baseline exists. No prior business in the loop has had a formal pre-launch legal protection stage. Evidence of the rework problem is qualitative (user intent expressed in scope) rather than quantified.

### Falsifiability Assessment
- **Falsified if**: LEGAL completion rate is high but the rate of legal-tagged rework events at WEBSITE/DO stages is unchanged after ≥3 business cycles through the new topology.
- **Confirmed if**: Legal-tagged revision cycles at WEBSITE/DO decrease by ≥30% relative to any historical baseline established in the first two businesses to complete the loop without LEGAL.

### Recommended Validation Approach
1. Establish a baseline before rollout: audit any WEBSITE/DO stage revision history for legal/claims-driven changes across current live businesses.
2. Tag LEGAL completion in stage status output (already in Observability expectations).
3. After the first two businesses complete LEGAL and reach WEBSITE/DO, measure legal-tagged revision events against the baseline.
4. First measurement checkpoint: after 3 business cycles; decision point: retain LEGAL with refinement, extend with harder gate, or revert to FIN-3-extended model.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `startup-loop`, `lp-do-plan`
- Deliverable acceptance package:
  - Updated stage graph + process registry + artifact contract + operator-facing stage map
- Post-delivery measurement plan:
  - Track LEGAL completion rate before MEASURE entry and reduction in late legal/claims rework at WEBSITE/DO.

## Evidence Gap Review
### Gaps Addressed
- Confirmed canonical insertion boundary and current absence of legal container.
- Confirmed FIN-3 currently covers compliance broadly but not explicit post-assessment legal strategy stages.

### Confidence Adjustments
- Increased approach confidence after validating exact sequencing edge in `loop-spec.yaml`.

### Remaining Assumptions
- Jurisdiction policy default remains unresolved.
- Final LEGAL artifact schema details (field-level) are still to be designed in planning.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for creating a first implementation plan.
- Recommended next step:
  - `/lp-do-plan docs/plans/startup-loop-legal-container-insertion/fact-find.md`

## Section Omission Rule
- All relevant sections were investigated for this scope.
