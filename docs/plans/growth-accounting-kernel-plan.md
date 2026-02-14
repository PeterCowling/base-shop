---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: growth-accounting-kernel
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-replan, /lp-sequence
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall is effort-weighted average (S=1, M=2, L=3)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Growth Accounting Kernel Plan

## Summary

This plan implements Opportunity M from the Advanced Math Algorithms fact-find: a canonical growth-accounting kernel that makes startup-loop scale/hold/kill decisions explicit, deterministic, and replayable. The kernel introduces one per-business ledger (`data/shops/{shopId}/growth-ledger.json`) with AARRR stage state, threshold snapshots, and guardrail outputs.

The design preserves immutable audit history in startup-loop stage-result and event artifacts, while the ledger remains a materialized latest-state view. Integration targets S10 weekly decisioning first, then scorecard/operator visibility. The plan front-loads risk by validating reducer and persistence contracts before S10 wiring, and inserts a checkpoint before downstream integration.

## Goals

- Define and type a canonical AARRR growth-ledger schema with deterministic numeric semantics.
- Implement deterministic stage evaluation (`overallStatus` + `guardrailSignal`) with blocking-policy controls.
- Implement atomic, idempotent, CAS-safe persistence for per-business growth ledger snapshots.
- Integrate growth accounting into S10 stage execution and replayable event payloads.
- Expose growth state in Business OS with safe API boundaries and explicit empty states.

## Non-goals

- Building a new analytics ingestion/ETL pipeline.
- Cross-business portfolio reporting in v1.
- Replacing existing KPI aggregation systems.
- ML-based forecasting or autonomous policy optimization.

## Constraints & Assumptions

- Constraints:
  - TypeScript-only implementation in current workspace packages/apps.
  - Deterministic replay requirement (integer-unit math + explicit threshold snapshots).
  - Startup-loop audit artifacts remain the immutable system of record.
- Assumptions:
  - Required weekly metrics can be sourced via adapter seams from existing aggregates.
  - S10 weekly cadence is sufficient for first rollout.
  - `HEAD` or `PET` can be used as realistic dry-run fixtures.

## Fact-Find Reference

- Related brief: `docs/plans/advanced-math-algorithms-fact-find.md`
- Key findings carried into this plan:
  - Opportunity M explicitly identified missing runtime growth ledger and guardrail gate.
  - HEAD/PET docs already define concrete guardrails (CAC/CVR) that can seed threshold contracts.
  - Existing startup-loop code has tested patterns for JSONL/event validation and atomic file writes.

## Existing System Notes

- Key modules/files:
  - `scripts/src/startup-loop/s10-learning-hook.ts` - S10 orchestration and atomic write pattern.
  - `scripts/src/startup-loop/event-validation.ts` - schema validation pattern for replay artifacts.
  - `scripts/src/startup-loop/__tests__/s10-learning-hook.test.ts` - integration seam for S10 behavior.
  - `scripts/src/startup-loop/__tests__/event-validation.test.ts` - event contract test baseline.
  - `apps/prime/src/lib/owner/businessScorecard.ts` - status-threshold evaluation pattern.
  - `apps/prime/src/lib/owner/__tests__/businessScorecard.test.ts` - deterministic metric/status tests.
- Patterns to follow:
  - Pure-function reducers with table-driven tests in `packages/lib`.
  - Atomic file writes via temp file + rename.
  - Explicit typed route contracts and authz checks for Next.js API handlers.

## Proposed Approach

- Option A: Document-only design with later code implementation.
  - Trade-off: low immediate risk, but delays production guardrail enforcement.
- Option B: Direct S10 integration first, schema/persistence hardening after.
  - Trade-off: faster visible output, but higher risk of replay drift and schema churn.
- Option C (chosen): kernel-first sequence (schema -> reducer -> persistence) then S10/UI integration with checkpoint gating.
  - Trade-off: slightly longer path, but significantly lower long-term operational risk.

Chosen: Option C because it validates deterministic contracts before high-blast-radius integration work.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| GAK-01 | IMPLEMENT | Define growth-ledger schema/types and threshold-set contract | 86% | S | Complete (2026-02-13) | - | GAK-02, GAK-03 |
| GAK-02 | IMPLEMENT | Build guardrail reducer and blocking-policy evaluator | 83% | M | Complete (2026-02-13) | GAK-01 | GAK-04, GAK-06 |
| GAK-03 | IMPLEMENT | Build persistence layer (atomic writes, canonical JSON, CAS revision) | 82% | M | Complete (2026-02-13) | GAK-01 | GAK-04, GAK-06 |
| GAK-04 | CHECKPOINT | Horizon checkpoint after kernel core | 95% | S | Complete (2026-02-13) | GAK-02, GAK-03 | GAK-05 |
| GAK-05 | INVESTIGATE | Validate S10 metrics-adapter ownership and source contract | 86% | M | Complete (2026-02-13) | GAK-04 | GAK-06 |
| GAK-06 | IMPLEMENT | Integrate growth kernel into S10 stage-result and event outputs | 81% | M | Complete (2026-02-13) | GAK-02, GAK-03, GAK-05 | GAK-07 |
| GAK-07 | IMPLEMENT | Add Business OS API + UI surface for growth ledger | 80% | M | Complete (2026-02-13) | GAK-06 | GAK-08 |
| GAK-08 | IMPLEMENT | Run replayable end-to-end dry-run on HEAD/PET fixture | 82% | M | Complete (2026-02-13) | GAK-07 | GAK-09 |
| GAK-09 | IMPLEMENT | Harden docs/policy and operator runbook for governed usage | 84% | S | Complete (2026-02-13, user-waived docs-lint baseline) | GAK-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Active tasks

- GAK-01: complete (2026-02-13).
- GAK-02: complete (2026-02-13).
- GAK-03: complete (2026-02-13).
- GAK-04: complete (2026-02-13).
- GAK-05: complete (2026-02-13).
- GAK-06: complete (2026-02-13).
- GAK-07: complete (2026-02-13).
- GAK-08: complete (2026-02-13).
- GAK-09: complete (2026-02-13, user waived repo-wide docs-lint baseline gate for this task).

## Confidence Gate Policy

- IMPLEMENT build threshold: `>=80%`.
- IMPLEMENT tasks below threshold require INVESTIGATE/DECISION closure before execution.
- Confidence gate satisfied: GAK-05 completed on 2026-02-13; GAK-06 can proceed.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | GAK-01 | - | Establish schema/type contract first |
| 2 | GAK-02, GAK-03 | GAK-01 | Reducer and persistence can proceed in parallel |
| 3 | GAK-04 | GAK-02, GAK-03 | Checkpoint before S10 integration |
| 4 | GAK-05 | GAK-04 | Remove adapter ownership uncertainty |
| 5 | GAK-06 | GAK-02, GAK-03, GAK-05 | S10 integration after contract closure |
| 6 | GAK-07 | GAK-06 | API/UI surface once control-plane output is stable |
| 7 | GAK-08 | GAK-07 | End-to-end replay validation |
| 8 | GAK-09 | GAK-08 | Policy/docs hardening after implementation evidence |

**Max parallelism:** 2 | **Critical path:** 8 waves | **Total tasks:** 9

## Tasks

### GAK-01: Define growth-ledger schema/types and threshold-set contract

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`packages/lib/src/growth/types.ts`, `packages/lib/src/growth/schema.ts`) + schema docs.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/growth/types.ts`, `packages/lib/src/growth/schema.ts`, `packages/lib/src/growth/index.ts`, `packages/lib/src/growth/__tests__/schema.test.ts`, `docs/business-os/growth-accounting/ledger-schema.md`, `[readonly] docs/business-os/strategy/HEAD/plan.user.md`, `[readonly] docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`
- **Depends on:** -
- **Blocks:** GAK-02, GAK-03
- **Confidence:** 86%
  - Implementation: 88% - schema/type work follows well-established workspace patterns.
  - Approach: 86% - AARRR + threshold snapshot is aligned with startup-loop contracts.
  - Impact: 86% - isolated to additive files and read-only strategy references.
- **Acceptance:**
  - Ledger schema covers all 5 AARRR stages with deterministic integer-unit metrics.
  - Threshold sets are versioned and content-addressed (`threshold_set_id`, `threshold_set_hash`).
  - Status enums explicitly separate `insufficient_data` from `red`.
  - TypeScript types compile under strict settings and ban `any`.
- **Validation contract:**
  - TC-01: schema declares 5 stages and required stage-level policy fields.
  - TC-02: integer-unit invariants enforced (`*_eur_cents`, `*_bps`) and float comparisons excluded.
  - TC-03: strict compilation passes for new growth schema/types.
  - TC-04: HEAD/PET guardrails map into schema without semantic loss.
  - **Acceptance coverage:** TC-01 covers stage coverage; TC-02 covers determinism; TC-03 covers type safety; TC-04 covers compatibility.
  - **Validation type:** unit + typecheck + doc cross-check.
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/schema.test.ts`, `docs/business-os/growth-accounting/ledger-schema.md`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- src/growth/__tests__/schema.test.ts` and `pnpm --filter @acme/lib build`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - HEAD/PET threshold compatibility -> doc review -> confirmed representative CAC/CVR contracts exist.
- **What would make this >=90%:** schema spike merged with two real threshold fixtures (`HEAD`, `PET`) and passing compile/tests.
- **Rollout / rollback:**
  - Rollout: add schema/types behind unused module exports.
  - Rollback: isolate by removing growth module exports.
- **Documentation impact:**
  - Update `docs/business-os/growth-accounting/ledger-schema.md`.
- **Notes / references:**
  - Opportunity M in `docs/plans/advanced-math-algorithms-fact-find.md`.

- **Build validation (2026-02-13):******
  - Added: `packages/lib/src/growth/types.ts`, `packages/lib/src/growth/schema.ts`, `packages/lib/src/growth/index.ts`, `packages/lib/src/growth/__tests__/schema.test.ts`, `docs/business-os/growth-accounting/ledger-schema.md`.
  - Pass: `pnpm --filter @acme/lib test -- src/growth/__tests__/schema.test.ts`.
  - Pass: `pnpm exec eslint packages/lib/src/growth/types.ts packages/lib/src/growth/schema.ts packages/lib/src/growth/__tests__/schema.test.ts`.
  - Pass: `pnpm exec tsc --noEmit --pretty false --strict --moduleResolution bundler --module ESNext --target ES2022 --types node packages/lib/src/growth/types.ts packages/lib/src/growth/schema.ts`.
  - Known unrelated failure: `pnpm --filter @acme/lib build` currently fails in pre-existing `src/hypothesis-portfolio/validation.ts` (outside GAK-01 scope).

### GAK-02: Build guardrail reducer and blocking-policy evaluator

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`packages/lib/src/growth/evaluate.ts`) + reducer tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/growth/evaluate.ts`, `packages/lib/src/growth/index.ts`, `packages/lib/src/growth/__tests__/evaluate.test.ts`, `[readonly] apps/prime/src/lib/owner/businessScorecard.ts`
- **Depends on:** GAK-01
- **Blocks:** GAK-04, GAK-06
- **Confidence:** 83%
  - Implementation: 84% - pure-function reducer and test matrix are straightforward.
  - Approach: 83% - explicit status/signal split reduces ambiguity in downstream consumers.
  - Impact: 83% - additive kernel surface with bounded call sites.
- **Acceptance:**
  - Reducer returns deterministic `overallStatus` and `guardrailSignal`.
  - Blocking policy (`always|after_valid|never`) is enforced exactly.
  - Referral/advisory stage cannot force global red by itself.
  - Reducer emits actionable stage-level remediation actions.
- **Validation contract:**
  - TC-01: threshold-direction matrix passes for higher/lower and green/red bounds.
  - TC-02: validity-denominator gaps emit `insufficient_data`, not false red.
  - TC-03: blocking-policy transitions for `after_valid` are deterministic.
  - TC-04: deterministic replay check returns identical outputs for identical inputs.
  - TC-05: referral-only red does not force overall red when blocking stages are green.
  - **Acceptance coverage:** TC-01/TC-02 cover threshold semantics; TC-03/TC-05 cover policy semantics; TC-04 covers determinism.
  - **Validation type:** unit tests (table-driven + edge cases).
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/evaluate.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- src/growth/__tests__/evaluate.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Existing status-threshold evaluation pattern -> `apps/prime/src/lib/owner/businessScorecard.ts` -> confirmed reusable comparison semantics.
- **Planning validation:**
  - Checks run: `pnpm --filter @apps/prime test -- src/lib/owner/__tests__/businessScorecard.test.ts` - pass (13 tests).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: none.
- **What would make this >=90%:** exhaustive 3125-combination fixture coverage plus mutation test pass.
- **Rollout / rollback:**
  - Rollout: ship reducer standalone; no control-plane call sites until GAK-06.
  - Rollback: remove growth reducer export.
- **Documentation impact:**
  - Add reducer semantics to `docs/business-os/growth-accounting/guardrails.md`.
- **Notes / references:**
  - Stage policy semantics align with plan constraints in this doc.

- **Build validation (2026-02-13):****
  - Added: `packages/lib/src/growth/evaluate.ts`, `packages/lib/src/growth/__tests__/evaluate.test.ts`.
  - Updated: `packages/lib/src/growth/index.ts` (export surface).
  - Pass: `pnpm --filter @acme/lib test -- src/growth/__tests__/evaluate.test.ts src/growth/__tests__/schema.test.ts`.
  - Pass: `pnpm exec eslint packages/lib/src/growth/evaluate.ts packages/lib/src/growth/__tests__/evaluate.test.ts packages/lib/src/growth/index.ts packages/lib/src/growth/schema.ts packages/lib/src/growth/types.ts packages/lib/src/growth/__tests__/schema.test.ts`.
  - Pass: `pnpm exec tsc --noEmit --pretty false --strict --moduleResolution bundler --module ESNext --target ES2022 --types node packages/lib/src/growth/types.ts packages/lib/src/growth/schema.ts packages/lib/src/growth/evaluate.ts`.

### GAK-03: Build persistence layer (atomic writes, canonical JSON, CAS revision)

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`packages/lib/src/growth/store.ts`) + persistence tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/lib/src/growth/store.ts`, `packages/lib/src/growth/serialize.ts`, `packages/lib/src/growth/__tests__/store.test.ts`, `docs/business-os/growth-accounting/store-contract.md`, `[readonly] scripts/src/startup-loop/s10-learning-hook.ts`
- **Depends on:** GAK-01
- **Blocks:** GAK-04, GAK-06
- **Confidence:** 82%
  - Implementation: 83% - atomic write and CAS patterns are already present in repo.
  - Approach: 82% - canonical serialization + CAS is the safest long-term durability model.
  - Impact: 82% - affects only new growth paths under `data/shops/{shopId}`.
- **Acceptance:**
  - `readGrowthLedger`, `writeGrowthLedger`, and CAS-safe `updateGrowthLedger` APIs exist.
  - Writes are atomic and idempotent with canonical JSON bytes.
  - `ledger_revision` increments only when content changes.
  - CAS mismatch returns explicit conflict errors.
- **Validation contract:**
  - TC-01: missing ledger returns null and does not crash.
  - TC-02: interrupted write never leaves partial/corrupt JSON.
  - TC-03: same-input update is byte-identical and does not increment revision.
  - TC-04: changed-input update increments revision exactly once.
  - TC-05: stale expected revision returns conflict and preserves latest persisted state.
  - **Acceptance coverage:** TC-01 covers graceful reads; TC-02 covers atomicity; TC-03/TC-04 cover idempotency/revision rules; TC-05 covers concurrency safety.
  - **Validation type:** unit/integration tests with temporary filesystem fixtures.
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/store.test.ts`.
  - **Run/verify:** `pnpm --filter @acme/lib test -- src/growth/__tests__/store.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Atomic write implementation precedent -> `scripts/src/startup-loop/s10-learning-hook.ts` -> confirmed temp-file + rename pattern.
- **Planning validation:**
  - Checks run: `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-learning-hook.test.ts` - pass (8 tests).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: none.
- **What would make this >=90%:** stress loop with 100+ concurrent CAS attempts and zero corruption.
- **Rollout / rollback:**
  - Rollout: introduce store APIs behind new module; no runtime call sites until GAK-06.
  - Rollback: disable store import path in S10 integration.
- **Documentation impact:**
  - Document on-disk format and lifecycle in `docs/business-os/growth-accounting/store-contract.md`.
- **Notes / references:**
  - Current shop data root conventions under `data/shops/`.

- **Build validation (2026-02-13):****
  - Added: `packages/lib/src/growth/store.ts`, `packages/lib/src/growth/serialize.ts`, `packages/lib/src/growth/__tests__/store.test.ts`, `docs/business-os/growth-accounting/store-contract.md`.
  - Updated: `packages/lib/src/growth/index.ts`, `packages/lib/src/growth/schema.ts`.
  - Pass: `pnpm --filter @acme/lib test -- src/growth/__tests__/store.test.ts`.
  - Pass: `pnpm --filter @acme/lib test -- src/growth/__tests__/schema.test.ts src/growth/__tests__/evaluate.test.ts src/growth/__tests__/store.test.ts`.
  - Pass: `pnpm exec tsc --noEmit --pretty false --strict --moduleResolution bundler --module ESNext --target ES2022 --types node packages/lib/src/growth/types.ts packages/lib/src/growth/schema.ts packages/lib/src/growth/evaluate.ts packages/lib/src/growth/serialize.ts packages/lib/src/growth/store.ts`.
  - Pass (warnings-only): `pnpm exec eslint packages/lib/src/growth/schema.ts packages/lib/src/growth/store.ts packages/lib/src/growth/serialize.ts packages/lib/src/growth/index.ts packages/lib/src/growth/__tests__/store.test.ts`.

### GAK-04: Horizon checkpoint after kernel core

- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-13)
- **Deliverable:** plan update/re-sequencing artifact.
- **Execution-Skill:** /lp-replan
- **Affects:** `docs/plans/growth-accounting-kernel-plan.md`
- **Depends on:** GAK-02, GAK-03
- **Blocks:** GAK-05
- **Confidence:** 95%
  - Implementation: 95% - procedural reassessment task.
  - Approach: 95% - reduces compounded risk before integration.
  - Impact: 95% - prevents deep execution on stale assumptions.
- **Acceptance:**
  - Re-score GAK-05..GAK-09 confidence using completed-task evidence.
  - Confirm reducer and persistence contracts are stable for S10 integration.
  - Update dependencies if adapter ownership or API-surface assumptions change.
- **Horizon assumptions to validate:**
  - S10 can consume growth outputs without changing existing event contracts.
  - Business OS has suitable placement for growth card/API without routing churn.

- **Checkpoint findings (2026-02-13):**
  - GAK-01/GAK-02/GAK-03 implementation evidence is complete and green on targeted tests.
  - Reducer and persistence contracts are stable and export-ready for S10 integration.
  - No dependency changes were required; sequencing remains valid (`GAK-05 -> GAK-06 -> GAK-07`).
  - Main remaining uncertainty remains metrics-adapter ownership; GAK-05 stays below threshold until contract is written.
- **Confidence re-score (post-checkpoint):**
  - GAK-05: 76% (unchanged, still blocked on ownership decisions).
  - GAK-06: 81% (unchanged; integration seam still depends on adapter ownership closure).
  - GAK-07: 80% (unchanged).
  - GAK-08: 82% (unchanged).
  - GAK-09: 84% (unchanged).

### GAK-05: Validate S10 metrics-adapter ownership and source contract

- **Type:** INVESTIGATE
- **Status:** Complete (2026-02-13)
- **Deliverable:** analysis artifact (`docs/business-os/growth-accounting/metrics-adapter-contract.md`).
- **Execution-Skill:** /lp-build
- **Affects:** `docs/business-os/growth-accounting/metrics-adapter-contract.md`, `[readonly] scripts/src/startup-loop/metrics-aggregate.ts`, `[readonly] scripts/src/startup-loop/funnel-metrics-extractor.ts`, `[readonly] docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** GAK-04
- **Blocks:** GAK-06
- **Confidence:** 86%
  - Implementation: 87% - ownership and source traversal are now explicitly specified with concrete paths.
  - Approach: 86% - dedicated adapter boundary removes ambiguity between diagnosis and growth modules.
  - Impact: 86% - integration churn risk reduced by fixed field ownership and fixture contract.
- **Blockers / questions to answer:**
  - Which module owns `getWeeklyGrowthMetrics(shopId, weekRange)` in v1?
  - Which metrics are source-of-truth versus derived at S10 time?
  - Which missing fields can safely emit `not_tracked` in v1?
- **Acceptance:**
  - Produce signed-off adapter contract with explicit field ownership and units.
  - Define fallback semantics for missing/late metrics.
  - Provide test fixture shape used by GAK-06 integration tests.
- **Planning validation:**
  - Checks run: `pnpm --filter scripts test -- src/startup-loop/__tests__/event-validation.test.ts` - pass (9 tests).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: no existing dedicated growth adapter seam found.
- **What would make this >=90%:** approved adapter contract with one implemented fixture-backed prototype call in S10 harness.
- **Notes / references:**
  - Existing startup-loop aggregation files in `scripts/src/startup-loop/`.

- **Build validation (2026-02-13):****
  - Added: `docs/business-os/growth-accounting/metrics-adapter-contract.md`.
  - Pass: `pnpm --filter scripts test -- src/startup-loop/__tests__/funnel-metrics-extractor.test.ts`.
  - Decision: adapter ownership fixed to `scripts/src/startup-loop/growth-metrics-adapter.ts` (to be implemented in GAK-06).

### GAK-06: Integrate growth kernel into S10 stage-result and event outputs

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change in startup-loop control plane and tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/src/startup-loop/growth-metrics-adapter.ts`, `scripts/src/startup-loop/s10-growth-accounting.ts`, `scripts/src/startup-loop/s10-diagnosis-integration.ts`, `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts`, `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts`, `scripts/src/startup-loop/__tests__/event-validation.test.ts`, `packages/lib/src/index.ts`, `[readonly] packages/lib/src/growth/evaluate.ts`, `[readonly] packages/lib/src/growth/store.ts`
- **Depends on:** GAK-02, GAK-03, GAK-05
- **Blocks:** GAK-07
- **Confidence:** 81%
  - Implementation: 82% - startup-loop integration seams and test harness exist.
  - Approach: 81% - stage-result + event payload integration matches current audit model.
  - Impact: 81% - touches high-value S10 flow but remains bounded by fixture tests.
- **Acceptance:**
  - S10 flow computes and persists growth ledger each weekly run.
  - Stage-result payload includes stage statuses, `overallStatus`, `guardrailSignal`, and coverage values.
  - Event payload is replay-complete (inputs + threshold snapshot + outputs).
  - Missing metrics paths emit `insufficient_data`/`not_tracked` without crashing S10.
- **Validation contract:**
  - TC-01: S10 fixture run writes growth ledger and stage-result fields.
  - TC-02: emitted event contains replay-required inputs/outputs.
  - TC-03: adapter missing fields produce safe statuses and no process crash.
  - TC-04: rerun with identical inputs yields identical ledger and deterministic outputs.
  - **Acceptance coverage:** TC-01 covers integration path; TC-02 covers replayability; TC-03 covers failure handling; TC-04 covers determinism.
  - **Validation type:** integration tests with fixture metrics and event assertions.
  - **Validation location/evidence:** `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts`.
  - **Run/verify:** `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-growth-accounting.test.ts`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - Existing S10 orchestration seam -> `scripts/src/startup-loop/s10-learning-hook.ts` -> confirmed injection point.
- **Planning validation:**
  - Checks run: `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-learning-hook.test.ts` - pass (8 tests).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: none.
- **What would make this >=90%:** one real `HEAD` dry-run artifact captured and replayed from event payload alone.
- **Rollout / rollback:**
  - Rollout: feature-flag growth integration in S10 path.
  - Rollback: disable growth hook while retaining kernel modules.
- **Documentation impact:**
  - Update `docs/business-os/startup-loop-workflow.user.md` S10 output contract.
- **Notes / references:**
  - Event schema pattern in `scripts/src/startup-loop/event-validation.ts`.

- **Build validation (2026-02-13):****
  - Added: `scripts/src/startup-loop/growth-metrics-adapter.ts`, `scripts/src/startup-loop/s10-growth-accounting.ts`, `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts`.
  - Updated: `scripts/src/startup-loop/s10-diagnosis-integration.ts`, `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts`, `scripts/src/startup-loop/__tests__/event-validation.test.ts`, `packages/lib/src/index.ts`.
  - Pass: `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-growth-accounting.test.ts`.
  - Pass: `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-diagnosis-integration.test.ts`.
  - Pass: `pnpm --filter scripts test -- src/startup-loop/__tests__/event-validation.test.ts`.
  - Pass: `pnpm exec eslint packages/lib/src/index.ts scripts/src/startup-loop/growth-metrics-adapter.ts scripts/src/startup-loop/s10-growth-accounting.ts scripts/src/startup-loop/s10-diagnosis-integration.ts scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts scripts/src/startup-loop/__tests__/event-validation.test.ts`.
  - Pass: `pnpm --filter @acme/lib build`.

### GAK-07: Add Business OS API + UI surface for growth ledger

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** API route + UI component + tests.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/business-os/src/app/api/business/[business]/growth-ledger/route.ts`, `apps/business-os/src/app/api/business/[business]/growth-ledger/route.test.ts`, `apps/business-os/src/components/board/GrowthLedgerCard.tsx`, `apps/business-os/src/components/board/GrowthLedgerCardContainer.tsx`, `apps/business-os/src/components/board/GrowthLedgerCard.test.tsx`, `apps/business-os/src/app/boards/[businessCode]/page.tsx`, `packages/i18n/src/en.json`
- **Depends on:** GAK-06
- **Blocks:** GAK-08
- **Confidence:** 80%
  - Implementation: 81% - Next.js route/component patterns are established.
  - Approach: 80% - board-level surface provides low-friction operator visibility.
  - Impact: 80% - medium blast radius with authz and rendering concerns.
- **Acceptance:**
  - API returns ledger payload for valid authorized business.
  - Missing ledger returns typed 404 (`ledger_not_initialized`).
  - Invalid business identifiers are rejected safely.
  - Board UI shows 5 stages + overall signal + freshness timestamp.
- **Validation contract:**
  - TC-01: authorized request with existing ledger returns 200 and typed payload.
  - TC-02: missing ledger returns 404 with `ledger_not_initialized`.
  - TC-03: unauthorized or malformed business id is rejected.
  - TC-04: UI renders mixed-status fixture and empty-state path.
  - **Acceptance coverage:** TC-01/TC-02/TC-03 cover API contract; TC-04 covers UI behavior.
  - **Validation type:** API integration tests + React component tests.
  - **Validation location/evidence:** `apps/business-os/src/app/api/business/[business]/growth-ledger/route.test.ts`, `apps/business-os/src/components/board/GrowthLedgerCard.test.tsx`.
  - **Run/verify:** `pnpm --filter @apps/business-os test -- src/app/api/business/[business]/growth-ledger/route.test.ts` and `pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx`.
- **Execution plan:** Red -> Green -> Refactor.
- **Scouts:**
  - API auth middleware usage -> `apps/business-os/src/app/api/agent/businesses/route.ts` -> confirmed guard pattern.
- **Planning validation:**
  - Checks run: `pnpm --filter @apps/prime test -- src/lib/owner/__tests__/businessScorecard.test.ts` - pass (13 tests).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: `apps/business-os` currently has no existing `/api/business/[business]` routes, so new route family is needed.
- **What would make this >=90%:** add one end-to-end board-page test that exercises API fetch + card rendering together.
- **Rollout / rollback:**
  - Rollout: gated card rendering when ledger exists.
  - Rollback: hide card and disable route registration.
- **Documentation impact:**
  - Add API contract section in `docs/business-os/growth-accounting/operator-guide.md`.
- **Notes / references:**
  - Board/page paths under `apps/business-os/src/app/boards/[businessCode]/page.tsx`.

- **Build validation (2026-02-13):****
  - Added: `apps/business-os/src/app/api/business/[business]/growth-ledger/route.ts`, `apps/business-os/src/app/api/business/[business]/growth-ledger/route.test.ts`, `apps/business-os/src/components/board/GrowthLedgerCard.tsx`, `apps/business-os/src/components/board/GrowthLedgerCardContainer.tsx`, `apps/business-os/src/components/board/GrowthLedgerCard.test.tsx`.
  - Updated: `apps/business-os/src/app/boards/[businessCode]/page.tsx`, `packages/i18n/src/en.json`.
  - Pass: `pnpm --filter @apps/business-os exec jest --config jest.config.cjs --ci --runInBand --detectOpenHandles --runTestsByPath "src/app/api/business/[business]/growth-ledger/route.test.ts"`.
  - Pass: `pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx`.
  - Pass: `pnpm --filter @apps/business-os typecheck`.
  - Pass: `pnpm --filter @apps/business-os lint`.

### GAK-08: Run replayable end-to-end dry-run on HEAD/PET fixture

- **Type:** IMPLEMENT
- **Deliverable:** validation report + reproducible fixture run artifacts.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `docs/business-os/growth-accounting/validation-report.md`, `data/shops/HEAD/growth-ledger.json`, `scripts/src/startup-loop/__tests__/fixtures/growth-ledger-head.json`
- **Depends on:** GAK-07
- **Blocks:** GAK-09
- **Confidence:** 82%
  - Implementation: 83% - fixture-based S10 dry-run is straightforward once integration exists.
  - Approach: 82% - replay validation is the right reliability gate before broader rollout.
  - Impact: 82% - primarily validation artifacts and fixture data.
- **Acceptance:**
  - One complete S10 dry-run produces ledger, stage-result, and event artifacts.
  - Hand-calculated threshold breach scenario matches reducer output.
  - Replay from event payload alone reconstructs identical decision outputs.
  - UI card displays produced fixture state correctly.
- **Validation contract:**
  - TC-01: full dry-run generates all expected artifacts.
  - TC-02: known breach fixture (e.g., CAC above ceiling) maps to expected red/kill output.
  - TC-03: replay script reproduces identical output JSON from emitted payload.
  - TC-04: board UI reflects dry-run fixture state.
  - **Acceptance coverage:** TC-01 covers end-to-end path; TC-02 covers threshold correctness; TC-03 covers replayability; TC-04 covers operator surface.
  - **Validation type:** integration + fixture replay + UI smoke.
  - **Validation location/evidence:** `docs/business-os/growth-accounting/validation-report.md`.
  - **Run/verify:** `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-growth-accounting.test.ts` and `pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx`.
- **Execution plan:** Red -> Green -> Refactor.
- **Planning validation:**
  - Checks run: baseline targeted tests completed for S10/event/scorecard seams (see Decision Log).
  - Validation artifacts written: none (planning phase).
  - Unexpected findings: none.
- **What would make this >=90%:** two consecutive weekly dry-runs with unchanged replay output hashes.
- **Rollout / rollback:**
  - Rollout: keep to `HEAD`/`PET` pilot businesses first.
  - Rollback: remove pilot fixture and disable growth hook flag.
- **Documentation impact:**
  - Publish dry-run report and replay instructions.
- **Notes / references:**
  - Pilot businesses: `HEAD`, `PET`.

- **Build validation (2026-02-13):**
  - Added: `docs/business-os/growth-accounting/validation-report.md`, `data/shops/HEAD/growth-ledger.json`, `scripts/src/startup-loop/__tests__/fixtures/growth-ledger-head.json`.
  - Pass: `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-growth-accounting.test.ts --modulePathIgnorePatterns=\.open-next/ --modulePathIgnorePatterns=\.worktrees/ --modulePathIgnorePatterns=\.ts-jest/`.
  - Pass: `pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx`.
  - Evidence: `docs/business-os/growth-accounting/validation-report.md` documents TC-01..TC-04 and replay-equivalence outputs for HEAD/PET.
  - Confidence reassessment: 82% -> 83% (validation confirmed replay and fixture assumptions).
  - Commit status: task-scoped commit attempt blocked by unrelated pre-existing hook failures in `packages/lib` (simple-import-sort lint errors outside GAK-08 scope).

### GAK-09: Harden docs/policy and operator runbook

- **Type:** IMPLEMENT
- **Deliverable:** policy/doc updates and guardrail operating guide.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/testing-policy.md`, `docs/business-os/growth-accounting/operator-guide.md`, `docs/plans/growth-accounting-kernel-plan.md`
- **Depends on:** GAK-08
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 85% - doc changes are direct once behavior is finalized.
  - Approach: 84% - runbook hardening prevents drift and operational ambiguity.
  - Impact: 84% - low runtime risk, broad operator clarity gains.
- **Acceptance:**
  - Startup-loop workflow docs include growth-ledger output contract at S10.
  - Testing policy references targeted growth-kernel test commands.
  - Operator guide documents override/fallback semantics and replay procedure.
  - Plan reflects final calibration, confidence, and follow-on backlog.
- **Validation contract:**
  - TC-01: docs lint passes after updates.
  - TC-02: operator guide includes replay steps and failure modes.
  - TC-03: startup-loop S10 table includes growth output fields.
  - **Acceptance coverage:** TC-01 covers docs hygiene; TC-02 covers operator readiness; TC-03 covers contract visibility.
  - **Validation type:** docs lint + manual checklist.
  - **Validation location/evidence:** updated docs listed in Affects.
  - **Run/verify:** `pnpm docs:lint`.
- **Execution plan:** Red -> Green -> Refactor.
- **What would make this >=90%:** one operator walkthrough using guide with no clarification requests.
- **Rollout / rollback:**
  - Rollout: publish docs with pilot release notes.
  - Rollback: revert docs to pre-growth state if integration is pulled.
- **Documentation impact:**
  - This task is documentation hardening itself.
- **Notes / references:**
  - Keep command examples aligned with targeted-test policy.

- **Build validation (2026-02-13):**
  - Added: `docs/business-os/growth-accounting/operator-guide.md`.
  - Updated: `docs/business-os/startup-loop-workflow.user.md`, `docs/testing-policy.md`, `docs/plans/growth-accounting-kernel-plan.md`.
  - Validation waiver: `pnpm docs:lint` remains failing repository-wide on pre-existing baseline issues outside GAK-09 scope; user explicitly waived this gate for GAK-09 completion.
  - Manual checks: operator guide includes replay steps + failure modes; S10 stage table includes growth output fields.
  - Confidence reassessment: 84% -> 86% (task content complete; waiver applied for non-local docs-lint baseline debt).
  - Commit status: intentionally skipped per user instruction.

## Risks & Mitigations

- Adapter ownership ambiguity can stall S10 integration.
  - Mitigation: explicit INVESTIGATE gate (GAK-05) before integration.
- Incorrect threshold semantics can cause false scale/kill signals.
  - Mitigation: table-driven reducer tests and fixture replay validation.
- File persistence race conditions can corrupt growth state.
  - Mitigation: CAS revision semantics and atomic writes.
- API surface may expose unauthorized business data.
  - Mitigation: strict authz checks + malformed-id rejection tests.
- Operator confusion between immutable audit and mutable snapshot.
  - Mitigation: explicit runbook language and replay-first validation report.

## Observability

- Logging:
  - Growth reducer decision records (stage statuses, signal, threshold-set hash).
  - S10 integration log line for adapter completeness and fallback statuses.
- Metrics:
  - Count of `insufficient_data`/`not_tracked` fields per run.
  - CAS conflict count and retry outcomes.
  - API request volume and 404 (`ledger_not_initialized`) rate.
- Dashboards/alerts:
  - Weekly pilot summary for HEAD/PET growth status trends.
  - Alert on repeated replay mismatch in dry-run verification.

## Acceptance Criteria (overall)

- [x] Canonical growth-ledger schema/types compile and represent HEAD/PET guardrails.
- [x] Reducer + persistence produce deterministic, replayable outputs.
- [x] S10 writes growth decisions into stage-result/event artifacts.
- [x] Business OS API/UI exposes growth state with secure boundaries and safe empty states.
- [x] Pilot dry-run artifacts replay cleanly and docs/runbook are updated.

## Decision Log

- 2026-02-13: Reframed plan to current `/lp-plan` format with checkpoint gating after kernel core.
- 2026-02-13: Chose kernel-first sequence (schema/reducer/persistence before S10 wiring).
- 2026-02-13: Added explicit INVESTIGATE gate (GAK-05) for metrics-adapter ownership uncertainty.
- 2026-02-13: Planning validation executed on existing seams:
  - `pnpm --filter scripts test -- src/startup-loop/__tests__/event-validation.test.ts` (pass: 9 tests)
  - `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-learning-hook.test.ts` (pass: 8 tests)
  - `pnpm --filter @apps/prime test -- src/lib/owner/__tests__/businessScorecard.test.ts` (pass: 13 tests)
- 2026-02-13: Build gate policy retained: IMPLEMENT tasks require >=80 confidence; below-threshold uncertainty routed to INVESTIGATE before dependent IMPLEMENT tasks.
- 2026-02-13: Completed GAK-09 docs hardening (startup-loop S10 contract update, testing policy command normalization, operator runbook with replay/failure procedure).
- 2026-02-13: GAK-09 had repo-wide `pnpm docs:lint` baseline failures unrelated to changed files; completion proceeded under explicit user waiver for this gate.
