---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-self-evolving-evidence-admission
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas
Related-Plan: docs/plans/startup-loop-self-evolving-evidence-admission/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309181000-9314
Trigger-Why: The self-evolving trial currently manufactures narrative-only observations with almost no measured evidence, so candidate scoring is forced to downgrade most ideas before it can evaluate whether they are genuinely high-value improvements.
Trigger-Intended-Outcome: "type: operational | statement: New self-evolving observations and candidate admission rules require explicit evidence grade or measurement contract, while legacy observations remain readable but cannot masquerade as strong evidence. | source: operator"
---

# Startup Loop Self-Evolving Evidence Admission Fact-Find Brief

## Scope
### Summary
The self-evolving trial can detect recurring work, but its current observation builders discard most outcome-bearing fields before candidate scoring runs. The result is a trial that learns structure, not effectiveness. This fact-find scopes the admission seam where evidence quality should be declared and enforced without forcing a historical backfill of existing observations.

### Goals
- Define the minimum evidence contract required for new self-evolving observations to support effectiveness judgments.
- Separate legacy-readable observations from new observations that are eligible for higher-confidence candidate states.
- Identify the right enforcement seam so weak evidence is treated explicitly, not inferred after the fact.

### Non-goals
- Retrofitting old queue entries or old observations with invented measurements.
- Redesigning dispatch.v2 for the ideas queue.
- Turning trial review into autonomous execution.

### Constraints & Assumptions
- Constraints:
  - Keep contract evolution additive; existing observation files must remain readable.
  - Do not require historical backfill unless missing evidence can be derived deterministically.
  - Preserve the current trial workflow boundary (`lp-do-ideas -> lp-do-fact-find`) while improving evidence quality.
- Assumptions:
  - Evidence quality belongs primarily at the observation/candidate admission seam, not the dispatch schema.
  - A stricter evidence contract can be enforced prospectively with a versioned or graded compatibility boundary.

## Outcome Contract
- **Why:** The self-evolving trial currently manufactures narrative-only observations with almost no measured evidence, so candidate scoring is forced to downgrade most ideas before it can evaluate whether they are genuinely high-value improvements.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** New self-evolving observations and candidate admission rules require explicit evidence grade or measurement contract, while legacy observations remain readable but cannot masquerade as strong evidence.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - build-output observation bridge.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - dispatch-to-observation bridge.
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - observation validation contract.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - evidence gate and candidate generation.
- `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl` - live observation dataset.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - writes `kpi_name`, `sample_size`, `baseline_ref`, and `measurement_window` as null for build-output observations.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - sets KPI hints for some dispatches but still leaves `sample_size` and `baseline_ref` null and data quality `unknown`.
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - validates only a minimal observation contract; richer evidence fields are optional.
- `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json` - shows the resulting candidates are all `structural_only`.
- `docs/plans/startup-loop-self-evolving-evidence-rigor/fact-find.md` - adjacent prior work hardened scoring/reporting but did not solve upstream evidence starvation.

### Patterns & Conventions Observed
- The current contract treats measured evidence as optional metadata rather than a gating input for candidate quality.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
- The orchestrator already has an evidence-aware route downgrade, but it runs after low-information observations have been admitted.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- Existing active BRIK observations are overwhelmingly missing measurement-bearing fields.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`

### Data & Contracts
- Types/schemas/events:
  - `MetaObservation` supports `sample_size`, `data_quality_status`, `baseline_ref`, and `measurement_window`, but does not require them globally.
  - `validateMetaObservation()` only requires extra fields when `kpi_name` is present.
- Persistence:
  - Self-evolving observations are stored append-only in `docs/business-os/startup-loop/self-evolving/<BIZ>/observations.jsonl`.
- API/contracts:
  - Candidate routing depends on `computeScoreResult()` evidence classification in the orchestrator.

### Dependency & Impact Map
- Upstream dependencies:
  - `lp-do-build` results-review and pattern-reflection artifacts.
  - `lp-do-ideas` dispatch packet content and outcome hints.
- Downstream dependents:
  - Candidate scoring and route assignment.
  - Dashboard/report output.
  - Any future self-evolving promotion logic.
- Likely blast radius:
  - Observation builders, contract validation, orchestrator scoring gates, and report surfaces.

### Recent Git History (Targeted)
- `docs/plans/startup-loop-self-evolving-evidence-rigor/` - prior tranche improved downstream evidence interpretation but left upstream observation admission permissive.

## Questions
### Resolved
- Q: Does this require backfilling the existing ideas pipeline or old observation history?
  - A: No, not if the stricter standard is applied prospectively at admission/scoring time rather than as a schema break for old records.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`
- Q: Is current live evidence starvation real rather than theoretical?
  - A: Yes. The current BRIK observation store is missing measurement-bearing fields across the active dataset, and the candidate ledger shows only `structural_only` classifications.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`, `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 88%
  - Basis: the seam is localized to observation builders, validation, and scoring admission.
- Approach: 91%
  - Basis: additive evidence-grade enforcement avoids forced historical backfill.
- Impact: 92%
  - Basis: this directly affects whether the trial can learn effectiveness rather than just collect narratives.
- Delivery-Readiness: 89%
  - Basis: all relevant files and live artifacts are already present in repo.
- Testability: 84%
  - Basis: existing self-evolving tests can cover admission behavior, but outcome quality still depends on realistic fixtures.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Tightening admission rules too aggressively suppresses useful exploratory signals | Medium | Medium | Preserve a `legacy` or `structural_only` path for low-evidence observations; gate promotion, not raw storage |
| A contract change accidentally implies historical backfill | Medium | High | Keep schema compatibility and version or grade only new admission paths |
| Evidence fields are required in the wrong layer | Medium | High | Decide explicitly whether the contract belongs in observation builders, candidate validation, or route selection before implementation |

