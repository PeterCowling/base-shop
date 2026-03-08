---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-evidence-rigor
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Evolving Evidence Rigor Plan

## Summary
This plan hardens the self-evolving loop where it currently overclaims quality. It adds a reusable beta-binomial posterior helper to the math package, replaces fake dashboard ratios with interval-based evidence metrics, and makes weak-evidence candidates fall back to `lp-do-fact-find` instead of being treated as ready for direct plan/build execution.

## Active tasks
- [x] TASK-01: Add reusable posterior utilities and explicit evidence profiles for self-evolving scoring
- [x] TASK-02: Replace misleading dashboard metrics and apply evidence-aware route suppression

## Goals
- Remove fake precision/data-quality ratios from the self-evolving dashboard.
- Persist explicit evidence profile metadata alongside candidate scores.
- Force weak-evidence candidates back into the canonical fact-find lane.
- Reuse `@acme/lib` math primitives instead of embedding statistics inline.

## Non-goals
- Redesign the full candidate lifecycle state machine.
- Auto-remediate historical candidate ledgers unless the new logic requires it.
- Run local Jest.

## Inherited Outcome Contract
- **Why:** The self-evolving loop is publishing misleading quality metrics and letting thin-evidence candidates jump straight into downstream workflow lanes. The loop needs mathematically defensible evidence metrics and route gating that reflects actual evidence strength.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-evolving dashboard reports interval-based evidence metrics instead of fake precision proxies, candidate scoring carries an explicit evidence profile, and weak-evidence candidates are forced back into fact-find rather than flowing directly into plan/build.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-evidence-rigor/fact-find.md`

## Proposed Approach
- Option A: Rename the current metrics and leave candidate routing unchanged.
  - Pros: low code churn.
  - Cons: still leaves weak-evidence candidates behaving as if they are ready for downstream execution.
- Option B: Add interval-based evidence metrics, persist evidence profiles in score output, and make routing depend on evidence strength.
  - Pros: materially raises the bar and aligns the workflow with the evidence it actually has.
  - Cons: touches both `scripts` and `@acme/lib`.
- Chosen approach:
  - **Option B**.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add beta-binomial posterior support and explicit evidence-profile scoring metadata | 90% | M | Complete (2026-03-06) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Replace fake dashboard ratios and force weak-evidence candidates back to fact-find | 88% | M | Complete (2026-03-06) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Math and score-contract changes first |
| 2 | TASK-02 | TASK-01 | Dashboard/report and route suppression depend on new score metadata |

## Tasks

### TASK-01: Add reusable posterior utilities and explicit evidence profiles for self-evolving scoring
- **Type:** IMPLEMENT
- **Deliverable:** reusable experimentation helper plus self-evolving score metadata that records evidence class and interval-backed support signals
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/lib/src/math/experimentation/bayesian.ts`, `packages/lib/src/math/experimentation/index.ts`, `packages/lib/__tests__/math/experimentation/bayesian.test.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% - existing posterior machinery can be refactored into a single-arm helper cleanly.
  - Approach: 91% - evidence profile is the smallest contract change that downstream code can use.
  - Impact: 90% - removes the current ambiguity between “weak evidence known” and “weak evidence ignored”.
- **Acceptance:**
  - A reusable single-arm beta-binomial posterior helper exists in `@acme/lib`.
  - `ScoreResult` includes explicit evidence metadata, not just string reasons.
  - Weak-evidence scoring no longer masquerades as a simple missing-v2 branch.
- **Validation contract (TC-01):**
  - TC-01: new experimentation helper returns deterministic posterior mean and credible interval for simple Bernoulli inputs.
  - TC-02: `computeScoreResult()` exposes evidence classification and preserves v2 gating behavior.
  - TC-03: scoring tests cover at least one weak-evidence profile and one measured-evidence profile.
- **Build evidence:**
  - Added `betaBinomialPosterior()` to `packages/lib/src/math/experimentation/bayesian.ts` and exported it through both `packages/lib/src/math/experimentation/index.ts` and `packages/lib/src/math/index.ts`.
  - `ScoreResult` now persists an explicit `evidence` profile with classification, missing requirements, and interval-backed support signals.
  - Added focused regression coverage in `packages/lib/__tests__/math/experimentation/bayesian.test.ts` and `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`.

### TASK-02: Replace fake dashboard ratios and force weak-evidence candidates back to fact-find
- **Type:** IMPLEMENT
- **Deliverable:** interval-based dashboard metrics plus evidence-aware route suppression for weak candidates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `docs/plans/startup-loop-self-evolving-evidence-rigor/plan.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 88% - dashboard and routing are localized, but report/ledger readers need coordinated updates.
  - Approach: 89% - fact-find fallback is the correct route when evidence is weak.
  - Impact: 88% - directly fixes the current overclaiming behavior seen in the audit.
- **Acceptance:**
  - The dashboard no longer emits `precision_proxy` or coerces missing data-quality annotations to `0`.
  - The report exposes interval-based evidence metrics with explicit sample sizes.
  - Candidates with weak evidence fall back to `lp-do-fact-find` instead of `lp-do-plan` / `lp-do-build`.
  - Backbone queue emission skips candidates that are not eligible for downstream execution.
- **Validation contract (TC-02):**
  - TC-01: dashboard snapshot returns interval-backed metrics and null/unknown for missing evidence rather than fake zeros.
  - TC-02: orchestrator integration shows weak-evidence candidate follow-up routing forced to fact-find.
  - TC-03: targeted lint/build/type validation passes for touched packages/files.
- **Build evidence:**
  - Replaced `precision_proxy` / `data_quality_ok_ratio` with interval-based `quality.*` metrics in `self-evolving-dashboard.ts`.
  - `runSelfEvolvingOrchestrator()` now forces non-measured candidates back to `lp-do-fact-find` via evidence-aware route override.
  - `startup-loop:self-evolving-report -- --business BRIK` now emits the new dashboard shape with `insufficient_data` instead of fake zeros when there is no resolved-candidate sample.
  - `pnpm --filter @acme/lib build`, `pnpm --filter @acme/lib lint`, and targeted `pnpm --filter scripts exec eslint ...` passed.
  - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` still fails in unrelated pre-existing `src/xa/run-xa-pipeline.ts` paths; no self-evolving errors remained after this change.

## Risks & Mitigations
- Small samples may make the new metrics return wide intervals or unknown states.
  - Mitigation: that is the correct output; expose the sample size and keep the raw counts.
- Route suppression may reduce immediate build-ready candidate volume.
  - Mitigation: that is intentional; the goal is to stop thin-evidence candidates from jumping the queue.

## Acceptance Criteria (overall)
- [x] Self-evolving quality reporting uses mathematically defensible interval-based metrics.
- [x] Candidate scores persist evidence profile data that downstream routing can consume.
- [x] Weak-evidence candidates no longer route directly into plan/build lanes.

## Build Notes
- Expected validation:
  - `pnpm --filter @acme/lib lint`
  - `pnpm --filter @acme/lib build`
  - `pnpm --filter scripts exec eslint <touched files>`
  - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
  - `bash scripts/validate-changes.sh`
- Local Jest remains out of scope per repo policy.
