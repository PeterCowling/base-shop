---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hypothesis-portfolio-manager
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-do-replan, /lp-sequence
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall is effort-weighted average (S=1, M=2, L=3)
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Hypothesis Portfolio Manager Plan

## Summary

This plan defines a portfolio-level hypothesis system that ranks startup bets by expected value, time-to-signal, and constraint fit before they enter `/lp-prioritize`. It adds a typed hypothesis model, deterministic ranking and gating logic, and a CLI workflow for creation, lifecycle transitions, and portfolio scoring.  
The implementation is sequenced to lock schema and storage contracts first, then checkpoint, then ship ranking/constraint logic and prioritize integration with explicit confidence gates.  
Because this is a mixed execution track (code + operating artifact changes), each task includes explicit publication destination, reviewer, approval evidence, and measurement readiness.

## Goals

- Create a canonical hypothesis schema with explicit EV semantics and lifecycle invariants.
- Rank hypotheses by deterministic composite scoring (EV, time-to-signal, cash-risk preference) with clear inadmissible reasons.
- Enforce portfolio constraints (concurrency, budget, risk cap, dependency gate) during activation and ranking.
- Integrate portfolio scoring into `/lp-prioritize` without regressing items that have no linked hypothesis.
- Produce operator documentation and rehearsal evidence so the system can be adopted by at least one business unit.

## Non-goals

- Real-time experiment telemetry ingestion from `/lp-experiment` (deferred).
- Bayesian posterior updates of prior confidence (deferred).
- Multi-objective optimizer/solver infrastructure (deferred).
- Any Python/Rust/sidecar architecture outside the TypeScript monorepo.

## Constraints & Assumptions

- Constraints:
  - TypeScript-only implementation in existing monorepo packages.
  - Persistence must use existing Business OS ideas/stage-doc infrastructure.
  - `/lp-prioritize` integration must be additive and backwards-compatible.
  - Test execution must remain targeted (no broad unfiltered test runs).
- Assumptions:
  - Hypothesis authors can supply coarse but directionally useful priors and upside/downside estimates.
  - Portfolio default domain (`default_value_unit`, `default_value_horizon_days`) is available or can be configured per business.
  - Business owners will accept explicit blocked reasons instead of silent filtering.

## Fact-Find Reference

- Related brief: `docs/plans/archive/advanced-math-algorithms-fact-find.md` (Opportunity N).
- Key findings carried into this plan:
  - There is no current portfolio-level hypothesis optimizer.
  - Existing repo primitives already cover ideas and stage-doc persistence contracts.
  - Startup-loop flow currently prioritizes go-items but does not inject explicit EV portfolio signals.
  - A dedicated hypothesis portfolio path is high leverage for startup-loop throughput.

Validation foundation note:
- A dedicated `hypothesis-portfolio-manager` fact-find brief does not yet exist.
- This plan includes HPM-05 as an explicit investigation gate to close remaining normalization and integration uncertainty before downstream implementation tasks proceed.

## Existing System Notes

- Key modules/files:
  - `packages/platform-core/src/repositories/businessOsIdeas.server.ts` - idea entity schema and CRUD patterns.
  - `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` - stage-doc contract and upsert semantics.
  - `scripts/src/startup-loop/bos-sync.ts` - idempotent card/stage-doc API synchronization pattern.
  - `scripts/src/startup-loop/__tests__/bos-sync.test.ts` - integration-style repository/API contract test shape.
  - `.claude/skills/lp-prioritize/SKILL.md` - current prioritization scoring formula and flow.
  - `packages/lib/src/math/*` - canonical location for reusable scoring and statistical logic.
- Patterns to follow:
  - Zod-backed schema validation and explicit parse errors.
  - Deterministic ranking with stable tiebreaks.
  - Repository adapters with explicit blocked/failure reasons, not silent drops.
  - Targeted unit/integration tests in the package where logic lives.

## Proposed Approach

- Option A: store hypotheses in a new dedicated table + custom ranking service.
  - Trade-off: cleaner domain boundary, but violates no-new-table and sidecar constraints.
- Option B: use existing ideas + stage-doc contracts, add hypothesis modules in `@acme/lib`, and expose operators via scripts CLI.
  - Trade-off: slightly more mapping logic, but aligns with current BOS storage and avoids infra churn.
- Option C: add scoring only inside `/lp-prioritize` with no hypothesis registry.
  - Trade-off: lower initial work, but no durable lifecycle, auditability, or cross-run portfolio memory.

Chosen: Option B, because it delivers long-term maintainability without violating current repository and runtime constraints.

## Active tasks

- **HPM-01** - Publish canonical hypothesis + portfolio schema contract
- **HPM-02** - Build typed hypothesis validation module in `@acme/lib`
- **HPM-03** - Implement storage adapter contract for ideas + stage-docs
- **HPM-04** - Horizon checkpoint after schema and storage foundations
- **HPM-05** - Calibrate normalization/domain defaults and integration rules
- **HPM-06** - Ship ranking and constraint engine with deterministic blocked reasons
- **HPM-07** - Ship hypothesis registry CLI and lifecycle activation guard
- **HPM-08** - Integrate portfolio scores into `/lp-prioritize` via explicit linkage
- **HPM-09** - Run end-to-end rehearsal and publish operator runbook + evidence

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| HPM-01 | IMPLEMENT | Publish canonical hypothesis + portfolio schema contract | 86% | S | Complete (2026-02-13) | - | HPM-02, HPM-03 |
| HPM-02 | IMPLEMENT | Build typed hypothesis validation module in `@acme/lib` | 82% | M | Complete (2026-02-13) | HPM-01 | HPM-06 |
| HPM-03 | IMPLEMENT | Implement storage adapter contract for ideas + stage-docs | 81% | M | Complete (2026-02-13) | HPM-01 | HPM-06 |
| HPM-04 | CHECKPOINT | Horizon checkpoint after schema and storage foundations | 95% | S | Complete (2026-02-13) | HPM-02, HPM-03 | HPM-05, HPM-06 |
| HPM-05 | INVESTIGATE | Calibrate normalization/domain defaults and integration rules | 82% | M | Complete (2026-02-13) | HPM-04 | HPM-06, HPM-08 |
| HPM-06 | IMPLEMENT | Ship ranking and constraint engine with deterministic blocked reasons | 80% | M | Complete (2026-02-13) | HPM-02, HPM-03, HPM-05 | HPM-07, HPM-09 |
| HPM-07 | IMPLEMENT | Ship hypothesis registry CLI and lifecycle activation guard | 80% | M | Complete (2026-02-13) | HPM-06 | HPM-08, HPM-09 |
| HPM-08 | IMPLEMENT | Integrate portfolio scores into `/lp-prioritize` via explicit linkage | 80% | M | Complete (2026-02-13) | HPM-05, HPM-07 | HPM-09 |
| HPM-09 | IMPLEMENT | Run end-to-end rehearsal and publish operator runbook + evidence | 81% | M | Complete (2026-02-13) | HPM-06, HPM-07, HPM-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Confidence Gate Policy

- IMPLEMENT build threshold: `>=80%`.
- IMPLEMENT tasks below threshold require explicit INVESTIGATE/DECISION work before execution.
- HPM-05 calibration is complete and no longer blocks HPM-06/HPM-08 execution readiness.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | HPM-01 | - | Define immutable schema and scoring semantics first |
| 2 | HPM-02, HPM-03 | HPM-01 | Types and storage adapter can proceed in parallel |
| 3 | HPM-04 | HPM-02, HPM-03 | Checkpoint before deeper implementation |
| 4 | HPM-05 | HPM-04 | Resolve normalization/domain uncertainty |
| 5 | HPM-06 | HPM-02, HPM-03, HPM-05 | Ranking + constraints after calibration |
| 6 | HPM-07 | HPM-06 | CLI lifecycle flow depends on ranking/constraints |
| 7 | HPM-08 | HPM-05, HPM-07 | Prioritize integration after registry flow exists |
| 8 | HPM-09 | HPM-06, HPM-07, HPM-08 | Full rehearsal and docs hardening |

**Max parallelism:** 2 | **Critical path:** 8 waves | **Total tasks:** 9

## Checkpoint Notes

HPM-04 completed on 2026-02-13.

- Completed foundations:
  - canonical schema contract published,
  - typed validation module implemented and exported from `@acme/lib`,
  - storage adapter + contract documentation implemented for ideas/stage-doc mapping.
- Validation evidence:
  - `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/validation.test.ts` -> pass (11 tests),
  - `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/storage.test.ts` -> pass (5 tests),
  - `pnpm --filter @acme/lib build` -> pass.
- Horizon assumptions re-check:
  - storage contract viability: confirmed via adapter + tests.
  - lifecycle and EV invariants: confirmed in validation layer.
  - `/lp-prioritize` additive integration remains unimplemented and still depends on HPM-05 calibration output.
- Plan adjustment result:
  - no dependency changes required,
  - HPM-05 produced explicit calibration policy at `docs/plans/hypothesis-portfolio-manager-calibration.md`.

## Tasks

### HPM-01: Publish canonical hypothesis + portfolio schema contract
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** schema docs (`docs/business-os/hypothesis-portfolio/schema.md`)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `docs/business-os/hypothesis-portfolio/schema.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** merge diff for `docs/business-os/hypothesis-portfolio/schema.md` plus reviewer sign-off comment in plan thread
- **Measurement-Readiness:** schema adoption tracked by count of hypotheses created with valid frontmatter per week
- **Affects:** `docs/business-os/hypothesis-portfolio/schema.md`, `[readonly] packages/platform-core/src/repositories/businessOsIdeas.server.ts`, `[readonly] packages/platform-core/src/repositories/businessOsStageDocs.server.ts`
- **Depends on:** -
- **Blocks:** HPM-02, HPM-03
- **Confidence:** 86%
  - Implementation: 88% - schema authoring is straightforward and supported by existing repository schemas.
  - Approach: 86% - explicit EV semantics and lifecycle invariants reduce long-term drift.
  - Impact: 86% - impacts are bounded to new docs and downstream module contracts.
- **Acceptance:**
  - Hypothesis schema defines required fields, nullability rules, and lifecycle date invariants.
  - EV semantics explicitly define gross upside/downside and always-incurred cost subtraction.
  - Portfolio metadata includes default domain and normalization fallback policy.
  - Constraint contract covers concurrency, budget attribution, risk cap, and dependency gate.
- **Validation contract:**
  - VC-01: Required fields and invariants are enumerated with pass/fail examples.
  - VC-02: EV semantics and unit/horizon domain guardrails are explicit and testable.
  - VC-03: Constraint definitions include enforcement points (rank-time and activation-time).
  - **Acceptance coverage:** VC-01 covers schema completeness; VC-02 covers EV semantics; VC-03 covers constraint behavior.
  - **Validation type:** review checklist
  - **Validation location/evidence:** `docs/business-os/hypothesis-portfolio/schema.md`
  - **Run/verify:** manual schema review against checklist and downstream task contracts.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: current plan lacked one canonical source for lifecycle and EV semantics.
  - Green evidence: schema doc covers every required field and invariant.
  - Refactor evidence: removed duplicate/ambiguous semantics and aligned naming with repo conventions.
- **Scouts:**
  - Ideas schema viability -> `packages/platform-core/src/repositories/businessOsIdeas.server.ts` -> confirmed.
  - Stage-doc persistence pattern -> `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` -> confirmed.
- **What would make this >=90%:** publish one valid and one invalid frontmatter fixture validated by downstream parser tests.
- **Rollout / rollback:**
  - Rollout: ship schema doc before code implementation.
  - Rollback: retain previous behavior and mark schema as draft if inconsistency is found.
- **Documentation impact:** creates canonical schema reference for hypothesis portfolio.
- **Notes / references:** `docs/plans/archive/advanced-math-algorithms-fact-find.md`

### HPM-02: Build typed hypothesis validation module in `@acme/lib`
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`packages/lib/src/hypothesis-portfolio/*`)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `packages/lib/src/hypothesis-portfolio/`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** passing targeted test log for `validation.test.ts` attached to build-log and reviewed
- **Measurement-Readiness:** weekly parse success/failure rate by `ValidationError.code` in CLI output logs
- **Affects:** `packages/lib/src/hypothesis-portfolio/types.ts`, `packages/lib/src/hypothesis-portfolio/validation.ts`, `packages/lib/src/hypothesis-portfolio/index.ts`, `packages/lib/src/hypothesis-portfolio/__tests__/validation.test.ts`, `[readonly] docs/business-os/hypothesis-portfolio/schema.md`
- **Depends on:** HPM-01
- **Blocks:** HPM-06
- **Confidence:** 82%
  - Implementation: 84% - established Zod/type validation patterns already exist in the repo.
  - Approach: 82% - domain typing before ranking logic reduces downstream churn.
  - Impact: 82% - new package-local surface with isolated test boundary.
- **Acceptance:**
  - Type definitions match schema fields and invariants from HPM-01.
  - Validation functions return structured error codes for required, range, and invariant failures.
  - Domain guards enforce EV eligibility (`value_unit` and `value_horizon_days` compatibility).
  - Unit tests cover happy path, error path, and edge path cases.
- **Validation contract:**
  - TC-01: Valid hypothesis payload parses into typed model.
  - TC-02: Missing required field returns deterministic validation error.
  - TC-03: Invalid lifecycle/date invariant fails with actionable reason.
  - TC-04: Non-EV-eligible unit is rejected with explicit code.
  - TC-05: Null detection window passes only with portfolio fallback present.
  - **Acceptance coverage:** TC-01..TC-05 cover all acceptance criteria.
  - **Validation type:** unit tests
  - **Validation location/evidence:** `packages/lib/src/hypothesis-portfolio/__tests__/validation.test.ts`
  - **Run/verify:** `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/validation.test.ts`
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: add failing tests for invalid lifecycle and unit-domain mismatches.
  - Green evidence: implement parsing/validation until all tests pass.
  - Refactor evidence: normalize error codes/messages and re-run full targeted suite.
- **Scouts:**
  - Test harness baseline -> `pnpm --filter @acme/lib test -- src/math/statistics/__tests__/correlation.test.ts` -> pass (23 tests).
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/lib test -- src/math/statistics/__tests__/correlation.test.ts` -> pass.
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: none.
- **What would make this >=90%:** add property-based validation fixtures for boundary values (0/100 confidence, empty dependencies, null windows).
- **Rollout / rollback:**
  - Rollout: publish module behind new export path only.
  - Rollback: remove export and retain schema doc while fixing type issues.
- **Documentation impact:** update schema doc with final error code catalog.
- **Notes / references:** existing math module export pattern under `packages/lib/src/math/`.

### HPM-03: Implement storage adapter contract for ideas + stage-docs
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change + contract docs (`scripts/src/hypothesis-portfolio/*`, `docs/business-os/hypothesis-portfolio/storage-contract.md`)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `scripts/src/hypothesis-portfolio/` and `docs/business-os/hypothesis-portfolio/storage-contract.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** passing adapter tests and reviewed contract doc diff
- **Measurement-Readiness:** weekly count of create/update/read operations and blocked parse reasons in operator logs
- **Affects:** `scripts/src/hypothesis-portfolio/storage.ts`, `scripts/src/hypothesis-portfolio/markdown.ts`, `scripts/src/hypothesis-portfolio/__tests__/storage.test.ts`, `docs/business-os/hypothesis-portfolio/storage-contract.md`, `[readonly] packages/platform-core/src/repositories/businessOsIdeas.server.ts`, `[readonly] packages/platform-core/src/repositories/businessOsStageDocs.server.ts`
- **Depends on:** HPM-01
- **Blocks:** HPM-06
- **Confidence:** 81%
  - Implementation: 83% - repository contracts and tags/frontmatter patterns are already known.
  - Approach: 81% - adapter layer avoids coupling CLI to repository internals.
  - Impact: 81% - isolated script-side adapter with explicit blocked reasons.
- **Acceptance:**
  - Adapter supports create/read/update/archive over existing ideas/stage-doc semantics.
  - Invalid frontmatter is surfaced as blocked records, not fatal errors.
  - Query contract includes explicit ranking domain behavior and mismatch reasons.
  - Storage contract doc includes canonical examples and parse-failure example.
- **Validation contract:**
  - TC-01: Create writes hypothesis payload with expected tag schema.
  - TC-02: Read lists hypotheses by business and status with deterministic parsing.
  - TC-03: Invalid frontmatter returns blocked entry with `invalid_frontmatter`.
  - TC-04: Portfolio metadata read/write uses stage-doc key consistently.
  - TC-05: Archive transition preserves entity and marks status as archived.
  - **Acceptance coverage:** TC-01..TC-05 cover CRUD and error handling contracts.
  - **Validation type:** integration tests (adapter-level)
  - **Validation location/evidence:** `scripts/src/hypothesis-portfolio/__tests__/storage.test.ts`
  - **Run/verify:** `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/storage.test.ts`
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: adapter tests fail on invalid frontmatter and missing stage-doc mapping.
  - Green evidence: adapter behavior passes all contract tests.
  - Refactor evidence: shared parser/mapper utilities extracted and tests remain green.
- **Scouts:**
  - Repository contract coverage -> `pnpm --filter @acme/platform-core test -- src/repositories/__tests__/businessOsOther.server.test.ts` -> pass (8 tests).
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/platform-core test -- src/repositories/__tests__/businessOsOther.server.test.ts` -> pass.
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: existing Idea status enum differs from planned hypothesis status and needs adapter mapping.
- **What would make this >=90%:** add fixture matrix for status mapping and archive semantics before build start.
- **Rollout / rollback:**
  - Rollout: adapter introduced in scripts layer first, then consumed by CLI.
  - Rollback: keep contract doc, disable adapter consumer commands.
- **Documentation impact:** adds storage contract document and API mapping examples.
- **Notes / references:** `scripts/src/startup-loop/bos-sync.ts` for idempotent sync behavior.

### HPM-04: Horizon checkpoint - reassess remaining plan
- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-13)
- **Deliverable:** plan update in this document
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-replan
- **Artifact-Destination:** `docs/plans/hypothesis-portfolio-manager-plan.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** checkpoint comment marking confidence re-score before HPM-06 start
- **Measurement-Readiness:** decision log updated with revised confidence and dependency state
- **Affects:** `docs/plans/hypothesis-portfolio-manager-plan.md`
- **Depends on:** HPM-02, HPM-03
- **Blocks:** HPM-05, HPM-06
- **Confidence:** 95%
  - Implementation: 95% - procedural re-assessment task.
  - Approach: 95% - prevents deep execution on stale assumptions.
  - Impact: 95% - reduces compounded dependency risk.
- **Acceptance:**
  - Re-score HPM-05..HPM-09 using evidence from implemented work.
  - Confirm storage adapter and validation contracts still match assumptions.
  - Update dependencies/confidence if new constraints are discovered.
- **Horizon assumptions to validate:**
  - Portfolio default domain policy is actionable for real business data.
  - Constraint blocking reasons are understandable to operators.
  - `/lp-prioritize` integration remains additive.

### HPM-05: Calibrate normalization/domain defaults and integration rules
- **Type:** INVESTIGATE
- **Status:** Complete (2026-02-13)
- **Deliverable:** calibration report (`docs/plans/hypothesis-portfolio-manager-calibration.md`)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `docs/plans/hypothesis-portfolio-manager-calibration.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** calibration report reviewed and linked in Decision Log
- **Measurement-Readiness:** report includes recommended defaults and explicit threshold checks for ongoing monitoring
- **Affects:** `docs/plans/hypothesis-portfolio-manager-calibration.md`, `[readonly] .claude/skills/lp-prioritize/SKILL.md`, `[readonly] docs/business-os/hypothesis-portfolio/schema.md`
- **Depends on:** HPM-04
- **Blocks:** HPM-06, HPM-08
- **Confidence:** 82%
  - Implementation: 84% - dataset-backed calibration artifacts are now in place.
  - Approach: 82% - normalization/domain defaults are explicit and testable.
  - Impact: 82% - residual risk is operational adoption, not policy ambiguity.
- **Blockers / questions to answer:**
  - What fallback behavior is safest for small-N and flat distributions in real datasets?
  - Which `value_unit` values are allowed as EV-eligible by default in v1?
  - How should `portfolio_score_normalized` map to `/lp-prioritize` 1-5 scale for outlier-heavy cohorts?
- **Acceptance:**
  - At least 3 representative hypothesis datasets evaluated with deterministic ranking output.
  - Recommended default-domain and normalization policy documented with rationale.
  - Clear pass/fail criteria for when hypotheses are blocked vs scored.
  - Plan updated so downstream IMPLEMENT tasks are >=80% or explicitly waived.
  - Calibration report published at `docs/plans/hypothesis-portfolio-manager-calibration.md`.

### HPM-06: Ship ranking and constraint engine with deterministic blocked reasons
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`packages/lib/src/hypothesis-portfolio/ranking.ts`, `constraints.ts` + tests)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `packages/lib/src/hypothesis-portfolio/`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** passing ranking/constraint test logs attached to build-log
- **Measurement-Readiness:** logs capture admitted/blocked counts by reason per ranking run
- **Affects:** `packages/lib/src/hypothesis-portfolio/ranking.ts`, `packages/lib/src/hypothesis-portfolio/constraints.ts`, `packages/lib/src/hypothesis-portfolio/__tests__/ranking.test.ts`, `packages/lib/src/hypothesis-portfolio/__tests__/constraints.test.ts`, `[readonly] packages/lib/src/hypothesis-portfolio/validation.ts`
- **Depends on:** HPM-02, HPM-03, HPM-05
- **Blocks:** HPM-07, HPM-09
- **Confidence:** 80%
  - Implementation: 82% - ranking and constraint formulas are explicit and testable.
  - Approach: 80% - gated by HPM-05 calibration results.
  - Impact: 80% - isolated domain module with explicit output contracts.
- **Acceptance:**
  - Implements EV, time, and cost component scoring with deterministic normalization.
  - Returns blocked reasons for negative EV, domain mismatch, invalid frontmatter, and constraint failures.
  - Enforces concurrency, budget attribution, risk cap, and dependency gate checks.
  - Includes stable tiebreak behavior and empty/small-N fallbacks.
- **Validation contract:**
  - TC-01: EV formula and effort-cost subtraction match fixture calculations.
  - TC-02: Time-to-signal and cost normalization produce deterministic ordering.
  - TC-03: Negative EV and domain mismatch hypotheses are blocked with explicit reasons.
  - TC-04: Constraint checker blocks concurrency/budget/risk/dependency violations.
  - TC-05: Small-N and flat-distribution cases return stable outputs.
  - **Acceptance coverage:** TC-01..TC-05 cover all acceptance criteria.
  - **Validation type:** unit tests
  - **Validation location/evidence:** `packages/lib/src/hypothesis-portfolio/__tests__/ranking.test.ts`, `packages/lib/src/hypothesis-portfolio/__tests__/constraints.test.ts`
  - **Run/verify:** `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/ranking.test.ts` and `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/constraints.test.ts`
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: add failing deterministic fixture tests before implementation.
  - Green evidence: implement ranking/constraint engine until fixture matrix passes.
  - Refactor evidence: extract normalization helper utilities without changing outputs.
- **Planning validation:**
  - Checks run: adjacent math/statistics harness test pass confirms stable package-level test setup.
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: normalization policy requires explicit small-N fallback guard (captured in HPM-05).
- **Build validation evidence:**
  - `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/ranking.test.ts` -> pass (6 tests).
  - `pnpm --filter @acme/lib test -- src/hypothesis-portfolio/__tests__/constraints.test.ts` -> pass (5 tests).
  - `pnpm --filter @acme/lib build` -> pass.
  - `pnpm --filter @acme/lib exec eslint src/hypothesis-portfolio src/index.ts` -> pass.
- **What would make this >=90%:** run ranking fixtures against one real business dataset and confirm blocked reasons align with operator expectations.
- **Rollout / rollback:**
  - Rollout: publish module behind new import path used by CLI only initially.
  - Rollback: disable module consumer paths and retain storage + schema contracts.
- **Documentation impact:** update schema/storage docs with final blocked reason codes.
- **Notes / references:** existing deterministic test conventions in `packages/lib/src/math/*/__tests__/`.

### HPM-07: Ship hypothesis registry CLI and lifecycle activation guard
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change (`scripts/src/hypothesis-portfolio/cli.ts` + command handlers + tests)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `scripts/src/hypothesis-portfolio/`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** command rehearsal transcript attached to build-log and reviewed
- **Measurement-Readiness:** command usage and blocked activation counts tracked in operation logs
- **Affects:** `scripts/src/hypothesis-portfolio/cli.ts`, `scripts/src/hypothesis-portfolio/commands.ts`, `scripts/src/hypothesis-portfolio/__tests__/cli.test.ts`, `[readonly] scripts/src/hypothesis-portfolio/storage.ts`, `[readonly] packages/lib/src/hypothesis-portfolio/ranking.ts`
- **Depends on:** HPM-06
- **Blocks:** HPM-08, HPM-09
- **Confidence:** 80%
  - Implementation: 81% - script CLI patterns are established in repository scripts.
  - Approach: 80% - explicit lifecycle guard + override audit is operationally sound.
  - Impact: 80% - bounded to new CLI command surface.
- **Acceptance:**
  - CLI supports create/update/list/rank/set-status/archive flows.
  - Activation to `active` enforces constraints unless `--force` is provided.
  - `--force` requires reason and persists override audit metadata.
  - Error output is actionable and deterministic for API/validation failures.
- **Validation contract:**
  - TC-01: create/list/update/archive flow works for a valid hypothesis.
  - TC-02: set-status active blocks when constraints fail.
  - TC-03: set-status active with `--force --force-reason` succeeds and records audit metadata.
  - TC-04: rank output includes admitted and blocked entries with reasons.
  - TC-05: API conflict error path returns actionable retry guidance.
  - **Acceptance coverage:** TC-01..TC-05 cover all acceptance criteria.
  - **Validation type:** integration tests (CLI)
  - **Validation location/evidence:** `scripts/src/hypothesis-portfolio/__tests__/cli.test.ts`
  - **Run/verify:** `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/cli.test.ts`
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: add CLI tests that fail on activation guard and force override metadata.
  - Green evidence: implement command handlers until tests pass.
  - Refactor evidence: consolidate argument parsing and error mapping while preserving test output.
- **Scouts:**
  - API sync patterns -> `scripts/src/startup-loop/bos-sync.ts` and `scripts/src/startup-loop/__tests__/bos-sync.test.ts` -> confirmed.
- **Planning validation:**
  - Checks run: `pnpm --filter scripts test -- src/startup-loop/__tests__/bos-sync.test.ts` -> pass (5 tests).
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: none.
- **What would make this >=90%:** run scripted CLI rehearsal against a dedicated test business and capture deterministic snapshots.
- **Rollout / rollback:**
  - Rollout: expose command under scripts package after test pass.
  - Rollback: disable command entrypoint and keep ranking module available for internal calls.
- **Documentation impact:** add CLI usage section to hypothesis portfolio runbook.
- **Notes / references:** `scripts/package.json` test command conventions.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** 24fd41a18e
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Cycles: 3 (initial red, fixes for metadata serialization and activation candidate constraints, green)
  - Initial validation: FAIL expected on new CLI test suite
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 82%
  - Delta reason: tests validated activation guard/override behavior and conflict guidance after fixing undefined-field persistence edge cases.
- **Validation:**
  - Ran: `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/cli.test.ts` -> PASS (5 tests)
  - Ran: `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/storage.test.ts` -> PASS (5 tests)
  - Ran: `pnpm --filter scripts exec eslint src/hypothesis-portfolio/commands.ts src/hypothesis-portfolio/cli.ts src/hypothesis-portfolio/__tests__/cli.test.ts` -> PASS (0 errors, 1 warning)
  - Ran: `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` -> FAIL (pre-existing unrelated error in `scripts/src/startup-loop/growth-metrics-adapter.ts`: missing `GrowthStageKey` export from `@acme/lib`)
- **Documentation updated:** None in this task scope (runbook docs are scheduled under HPM-09).
- **Implementation notes:** Added CLI dispatch and argument parsing, enforced activation guard with force-audit metadata, fixed dependency-array update semantics, prevented undefined optional fields from persisting as null in hypothesis frontmatter, and stabilized hypothesis IDs using `hypothesis_key`.

### HPM-08: Integrate portfolio scores into `/lp-prioritize` via explicit linkage
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** skill and integration docs updates
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `.claude/skills/lp-prioritize/SKILL.md` and `docs/business-os/hypothesis-portfolio/integration-guide.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** reviewed prioritize run showing linked and unlinked item behavior
- **Measurement-Readiness:** `% of prioritized items with explicit hypothesis linkage` tracked in weekly startup-loop review
- **Affects:** `.claude/skills/lp-prioritize/SKILL.md`, `docs/business-os/hypothesis-portfolio/integration-guide.md`, `scripts/src/hypothesis-portfolio/prioritize-bridge.ts`, `scripts/src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts`, `[readonly] packages/lib/src/hypothesis-portfolio/ranking.ts`
- **Depends on:** HPM-05, HPM-07
- **Blocks:** HPM-09
- **Confidence:** 80%
  - Implementation: 81% - integration path is explicit and additive.
  - Approach: 80% - explicit linkage avoids brittle fuzzy matching as canonical path.
  - Impact: 80% - limited to prioritize scoring extension and bridge utility.
- **Acceptance:**
  - Explicit linked items (`hypothesis_id` or `hypothesis:<id>`) receive normalized portfolio score.
  - Unlinked items keep current `(Impact + Learning-Value) / Effort` behavior.
  - Out-of-domain/non-EV-eligible hypotheses map to blocked reason and do not silently bias scores.
  - Integration guide documents mapping, defaults, and fallback behavior.
- **Validation contract:**
  - TC-01: linked item score changes deterministically with portfolio input.
  - TC-02: unlinked item score is unchanged from baseline formula.
  - TC-03: missing portfolio metadata causes graceful skip, not failure.
  - TC-04: blocked hypotheses expose explicit reason and map to neutral/zero injection.
  - **Acceptance coverage:** TC-01..TC-04 cover all acceptance criteria.
  - **Validation type:** integration test + skill rehearsal
  - **Validation location/evidence:** `scripts/src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts`, operator rehearsal notes
  - **Run/verify:** `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts`
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: add failing score-compatibility tests for linked and unlinked flows.
  - Green evidence: implement bridge and skill update until tests and rehearsal pass.
  - Refactor evidence: simplify mapping logic while preserving score outputs.
- **Planning validation:**
  - Checks run: reviewed `.claude/skills/lp-prioritize/SKILL.md` current formula and tie-break rules.
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: current skill has no portfolio hook, so bridge must remain optional by default.
- **What would make this >=90%:** run one live prioritize cycle with mixed linked/unlinked items and confirm operator acceptance.
- **Rollout / rollback:**
  - Rollout: additive score injection guarded by explicit linkage.
  - Rollback: disable bridge and retain baseline prioritize scoring.
- **Documentation impact:** adds integration guide and prioritize skill update.
- **Notes / references:** `.claude/skills/lp-prioritize/SKILL.md`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** 75c671af39
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 2 (red with failing bridge tests, green with bridge + docs integration)
  - Initial validation: FAIL expected on new bridge tests
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 82%
  - Delta reason: bridge behavior is now tested end-to-end for linked/unlinked/blocked/missing metadata paths, and docs are aligned to explicit-linkage semantics.
- **Validation:**
  - Ran: `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts` -> PASS (4 tests)
  - Ran: `pnpm --filter scripts exec eslint src/hypothesis-portfolio/prioritize-bridge.ts src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts` -> PASS
- **Documentation updated:** `.claude/skills/lp-prioritize/SKILL.md`, `docs/business-os/hypothesis-portfolio/integration-guide.md`
- **Implementation notes:** Added explicit-linkage scoring bridge (`hypothesis_id` or `hypothesis:<id>`), preserved baseline scoring for unlinked candidates, added graceful metadata-missing behavior, and surfaced deterministic blocked reasons with zero injection for inadmissible linked hypotheses.

### HPM-09: Run end-to-end rehearsal and publish operator runbook + evidence
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** validation report + operator docs
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** `docs/plans/hypothesis-portfolio-manager-validation-report.md` and `docs/business-os/hypothesis-portfolio/runbook.md`
- **Reviewer:** Pete (BOS owner)
- **Approval-Evidence:** sign-off on validation report with explicit go/no-go decision
- **Measurement-Readiness:** weekly KPI review includes admitted/blocked hypothesis mix and override rate
- **Affects:** `docs/plans/hypothesis-portfolio-manager-validation-report.md`, `docs/business-os/hypothesis-portfolio/runbook.md`, `scripts/src/hypothesis-portfolio/rehearsal-fixtures.ts`, `[readonly] scripts/src/hypothesis-portfolio/cli.ts`, `[readonly] .claude/skills/lp-prioritize/SKILL.md`
- **Depends on:** HPM-06, HPM-07, HPM-08
- **Blocks:** -
- **Confidence:** 81%
  - Implementation: 82% - rehearsal workflow is explicit and bounded.
  - Approach: 81% - fail-first rehearsal catches operator friction before broad usage.
  - Impact: 81% - documentation and reproducible evidence reduce adoption risk.
- **Acceptance:**
  - Rehearsal executes deterministic scenario with at least five hypotheses.
  - Report captures ranking outputs, blocked reasons, lifecycle transitions, and prioritize integration results.
  - Runbook documents operator commands, override policy, and troubleshooting.
  - Go/no-go criteria and rollback procedure are explicit.
- **Validation contract:**
  - TC-01: deterministic ranking order matches fixture expectations.
  - TC-02: activation gate blocks violations and logs override metadata when forced.
  - TC-03: prioritize integration reflects linked vs unlinked behavior as designed.
  - TC-04: runbook enables a second operator to reproduce the same outputs.
  - **Acceptance coverage:** TC-01..TC-04 cover all acceptance criteria.
  - **Validation type:** end-to-end rehearsal + review checklist
  - **Validation location/evidence:** `docs/plans/hypothesis-portfolio-manager-validation-report.md`, `docs/business-os/hypothesis-portfolio/runbook.md`
  - **Run/verify:** execute rehearsal fixture script and verify output against report assertions.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence: initial rehearsal run identifies at least one operator/documentation gap.
  - Green evidence: runbook updates close gaps and rehearsal passes all checks.
  - Refactor evidence: streamline runbook and fixture readability without changing outcomes.
- **Planning validation:**
  - Checks run: confirmed existing startup-loop sync and repository tests pass for prerequisite persistence patterns.
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: none.
- **What would make this >=90%:** complete one production-like rehearsal with real business hypotheses and no unresolved operator blockers.
- **Rollout / rollback:**
  - Rollout: onboard one business first, then widen.
  - Rollback: suspend prioritize score injection and keep hypotheses as advisory records only.
- **Documentation impact:** adds validation report and operator runbook.
- **Notes / references:** `scripts/src/startup-loop/__tests__/bos-sync.test.ts`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** b8a4c3fe3b
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 2 (red via initial fixture/report draft, green after deterministic rehearsal + runbook hardening)
  - Initial validation: FAIL expected until fixture outputs and runbook assertions aligned
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 81%
  - Post-validation: 84%
  - Delta reason: deterministic rehearsal output and reproducible operator steps are now captured with explicit go/no-go and rollback evidence.
- **Validation:**
  - Ran: `node --import tsx scripts/src/hypothesis-portfolio/rehearsal-fixtures.ts` -> PASS (deterministic output captured in report)
  - Ran: `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/cli.test.ts` -> PASS (5 tests)
  - Ran: `pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts` -> PASS (4 tests)
  - Ran: `pnpm --filter scripts exec eslint src/hypothesis-portfolio/rehearsal-fixtures.ts` -> PASS
- **Documentation updated:** `docs/plans/hypothesis-portfolio-manager-validation-report.md`, `docs/business-os/hypothesis-portfolio/runbook.md`
- **Implementation notes:** Added deterministic five-hypothesis rehearsal fixture, captured ranking/blocked/lifecycle/prioritize outputs in validation report, and published an operator runbook with explicit override policy and troubleshooting.

## Risks & Mitigations

- Hypothesis estimates are noisy and can produce unstable rankings.
  - Mitigation: enforce blocked reasons, default domain constraints, and run calibration gate (HPM-05).
- Operator misuse of `--force` could undermine constraint policy.
  - Mitigation: force requires reason and persisted audit metadata; monitor override rate.
- Integration drift between storage schema and validation module.
  - Mitigation: HPM-01 contract is canonical and HPM-02/HPM-03 consume it explicitly.
- `/lp-prioritize` behavior regression for unlinked items.
  - Mitigation: explicit compatibility tests in HPM-08.

## Observability

- Logging:
  - hypothesis create/update/archive events,
  - activation block reasons and override usage,
  - ranking admitted vs blocked counts by reason.
- Metrics:
  - hypotheses created per week,
  - blocked ratio by reason,
  - override usage rate,
  - percent of prioritized items with explicit hypothesis linkage.
- Operator summary:
  - latest ranking run timestamp,
  - last activation failure reason,
  - portfolio capacity and budget status.

## Acceptance Criteria (overall)

- [x] Canonical hypothesis schema and storage contract are published and consumed by code.
- [x] Ranking and constraints are deterministic and surface explicit blocked reasons.
- [x] CLI lifecycle transitions enforce activation guardrails with audited overrides.
- [x] `/lp-prioritize` integration is additive and backward-compatible for unlinked items.
- [x] Rehearsal report and runbook prove operator readiness for first business rollout.

## Decision Log

- 2026-02-13: Keep persistence on existing ideas + stage-doc contracts; no new table/service.
- 2026-02-13: Require explicit hypothesis linkage for prioritize injection; fuzzy matching is advisory only.
- 2026-02-13: Inserted HPM-04 checkpoint and HPM-05 investigation gate to prevent deep execution with unresolved normalization uncertainty.
