---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: startup-loop-self-evolving-evidence-rigor
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/startup-loop-self-evolving-evidence-rigor/plan.md
Trigger-Why: The self-evolving loop is publishing misleading quality metrics and letting thin-evidence candidates jump straight into downstream workflow lanes. The loop needs mathematically defensible evidence metrics and route gating that reflects actual evidence strength.
Trigger-Intended-Outcome: "type: operational | statement: The self-evolving dashboard reports interval-based evidence metrics instead of fake precision proxies, candidate scoring carries an explicit evidence profile, and weak-evidence candidates are forced back into fact-find rather than flowing directly into plan/build. | source: operator"
---

# Startup Loop Self-Evolving Evidence Rigor Fact-Find Brief

## Scope
### Summary
This tranche hardens the self-evolving loop where it currently overclaims quality. The target is the scoring/reporting seam in `self-evolving-dashboard.ts`, `self-evolving-scoring.ts`, and the orchestrator/backbone routing path that currently treats weak-evidence candidates as if they were ready for downstream execution.

### Goals
- Replace misleading dashboard ratios with mathematically defensible proportion metrics plus uncertainty bounds.
- Add an explicit evidence profile to scored candidates so downstream consumers can distinguish measured evidence from thin signals.
- Prevent weak-evidence candidates from routing directly to `lp-do-plan` or `lp-do-build`.
- Reuse or extend the repo math package rather than embedding ad hoc statistics in the startup-loop code.

### Non-goals
- Full redesign of self-evolving candidate states and release controls.
- Automatic promotion of weak candidates after fact-find.
- Local Jest execution.

### Constraints & Assumptions
- Constraints:
  - Keep the change bounded to `scripts` startup-loop code, the supporting math package, and direct tests/docs.
  - Preserve existing candidate ledger readability.
  - Use policy-compliant local validation only.
- Assumptions:
  - `promoted`/`kept` vs `reverted` is the closest available resolved-outcome precision signal in current runtime data.
  - A Bayesian/binomial interval is preferable to raw ratios because sample sizes are currently small.

## Outcome Contract
- **Why:** The self-evolving loop is publishing misleading quality metrics and letting thin-evidence candidates jump straight into downstream workflow lanes. The loop needs mathematically defensible evidence metrics and route gating that reflects actual evidence strength.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-evolving dashboard reports interval-based evidence metrics instead of fake precision proxies, candidate scoring carries an explicit evidence profile, and weak-evidence candidates are forced back into fact-find rather than flowing directly into plan/build.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts` - current dashboard metrics compute `precision_proxy` and `data_quality_ok_ratio`.
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts` - current scoring v2 gate and weak-evidence reason codes.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - turns weak-evidence candidates into validated candidates and applies type-based routing.
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts` - serializes dashboard output for operator inspection.
- `packages/lib/src/math/experimentation/confidence-intervals.ts` - Wilson interval support already exists.
- `packages/lib/src/math/experimentation/bayesian.ts` - Beta posterior machinery exists for A/B tests but not as a single-arm Bernoulli posterior API.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts` - candidate ledger stores score output and is the right place to preserve evidence metadata.
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts` - downstream queue writer can suppress direct routing for weak-evidence candidates.
- `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts` - direct scoring tests already exist.
- `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts` - integration path covers candidate generation and follow-up routing.
- `packages/lib/__tests__/math/experimentation/bayesian.test.ts` - existing experimentation test suite is the right place for any new posterior primitive.

### Patterns & Conventions Observed
- Existing self-evolving metrics overstate certainty by emitting raw point estimates without uncertainty.
  - Evidence: `self-evolving-dashboard.ts`
- Existing v2 scoring already distinguishes weak evidence but only as a reason string.
  - Evidence: `self-evolving-scoring.ts`
- The orchestrator currently ignores that weak-evidence reason when assigning validated state and routing candidates.
  - Evidence: `self-evolving-orchestrator.ts`
- The repo already prefers reusable math primitives in `@acme/lib` over local one-off implementations.
  - Evidence: `scripts/src/migrate-shop.ts`, `packages/lib/src/math/experimentation/*`

### Data & Contracts
- Types/schemas/events:
  - `ScoreResult` is persisted into `candidates.json` via `RankedCandidate`.
  - `DashboardSnapshot` is emitted by `self-evolving-report.ts`.
- Persistence:
  - Candidate scores live in `docs/business-os/startup-loop/self-evolving/<BIZ>/candidates.json`.
- API/contracts:
  - `buildDashboardSnapshot()` and `computeScoreResult()` are repo-local contracts; changing their shape is bounded.

### Dependency & Impact Map
- Upstream dependencies:
  - Repeat-work observations from ideas/build-output bridges.
- Downstream dependents:
  - `self-evolving-report.ts`
  - backbone queue emission and canonical follow-up dispatches
  - operator trust in the self-evolving diagnostics
- Likely blast radius:
  - `scripts` self-evolving subsystem
  - `@acme/lib` experimentation utilities

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Replacing fake precision with resolved-outcome posterior metrics will make the dashboard honest without losing usefulness. | Candidate state distribution and score persistence | Low | Low |
| H2 | Adding a single-arm beta-binomial posterior helper to `@acme/lib` is cleaner than duplicating Bayesian math in the startup-loop scripts. | Existing experimentation internals | Low | Low |
| H3 | Weak-evidence candidates should still exist, but they should be constrained to `lp-do-fact-find` rather than plan/build lanes. | Orchestrator score metadata and backbone route override | Medium | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | `precision_proxy` is computed from severity/confidence thresholds, not outcomes | `self-evolving-dashboard.ts` | High |
| H2 | `bayesian.ts` already computes beta posterior summaries internally | `packages/lib/src/math/experimentation/bayesian.ts` | High |
| H3 | `computeScoreResult()` already records `v2_evidence_missing_or_low_quality`, but route/state generation ignores that fact | `self-evolving-scoring.ts`, `self-evolving-orchestrator.ts` | High |

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest in `packages/lib` and `scripts`.
- Commands: local targeted lint/build/type validation allowed; local Jest disallowed by policy.
- CI integration: CI remains test authority.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Scoring gates | Unit | `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts` | Covers current v2 gate/autonomy cap only |
| Orchestrator routing | Integration | `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts` | Covers candidate emission and follow-up dispatches |
| Bayesian experimentation primitives | Unit | `packages/lib/__tests__/math/experimentation/bayesian.test.ts` | Covers posterior math infrastructure |

#### Coverage Gaps
- No test for a single-arm beta-binomial posterior helper.
- No dashboard test coverage for interval-based evidence metrics.
- No routing test proving weak-evidence candidates are forced back to fact-find.

## Questions
### Resolved
- Q: Is `precision_proxy` actually precision?
  - A: No. It is the share of observations with `severity >= 0.4` among observations with `detector_confidence >= 0.5`.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
- Q: Does the current scoring path know when evidence is weak?
  - A: Yes. `computeScoreResult()` emits `v2_evidence_missing_or_low_quality`, but the orchestrator still validates and routes candidates using type-only routing.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- Q: Does the repo already contain the math needed for better proportion estimates?
  - A: Partly. Wilson intervals and beta posterior internals exist, but there is no reusable single-arm beta-binomial posterior helper.
  - Evidence: `packages/lib/src/math/experimentation/confidence-intervals.ts`, `packages/lib/src/math/experimentation/bayesian.ts`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 88%
  - Basis: localized code path with existing math primitives and direct tests.
  - To reach >=90: confirm package-level validation is clean on touched files.
- Approach: 90%
  - Basis: interval-based metrics plus evidence-aware routing directly address the observed defect.
  - To reach >=90: keep state semantics stable and constrain the change to routing/metrics rather than broader lifecycle redesign.
- Impact: 92%
  - Basis: this materially improves trust in the self-evolving loop and stops weak evidence from bypassing canonical discovery.
  - To reach >=90: maintained.
- Delivery-Readiness: 91%
  - Basis: repo-local only; no external dependencies.
  - To reach >=90: maintained.
- Testability: 84%
  - Basis: direct unit/integration test files exist, but local Jest remains blocked.
  - To reach >=90: add focused regression tests before pushing to CI.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Resolved-outcome precision has tiny sample sizes and often returns unknown | High | Medium | Use posterior intervals and explicit `sample_size`, never coerce missing data to `0` |
| Route suppression for weak evidence changes existing integration expectations | Medium | Medium | Update direct tests and keep the route fallback narrowly scoped to weak-evidence candidates |
| Evidence metrics become over-engineered and hard to interpret | Low | Medium | Keep a small set of metrics tied to explicit definitions and persisted score metadata |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-build docs/plans/startup-loop-self-evolving-evidence-rigor/plan.md`

## Scope Signal
Signal: right-sized

Rationale: The defect is localized, evidence-backed, and the fix is bounded to startup-loop scoring/reporting plus one reusable math primitive. It raises the bar materially without reopening the whole self-evolving lifecycle design.
