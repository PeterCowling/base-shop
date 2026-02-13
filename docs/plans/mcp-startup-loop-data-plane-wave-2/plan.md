---
Type: Plan
Status: Active
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: mcp-startup-loop-data-plane-wave-2
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence, lp-replan
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1,M=2)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# MCP Startup Loop Data Plane Wave 2 Plan

## Summary
This plan operationalizes wave-2 as a bounded data-plane expansion, not eight parallel platforms. The execution spine is fixed: collectors write artifacts, MCP exposes normalized reads and guarded refresh requests, startup-loop stages consume reproducible packets/packs, and BOS remains write authority. The first implementation objective is a vertical slice (`measure_*` + `app_*` + `pack_*`) with deterministic provenance and packet redaction guarantees, followed by a checkpoint gate before broader expansion. Planning evidence includes targeted passing tests for policy gates and S10 growth accounting, plus documented Jest harness collisions that must be controlled during build validation.

## Goals
- Deliver a versioned shared contract kernel (`metrics-registry.v1`, `provenance.v1`, `packet-redaction.v1`, `refresh-enqueue.v1`, `anomaly-baseline.v1`) for all wave-2 tool families.
- Ship one replayable vertical slice proving artifact-reader MCP semantics before multi-source expansion.
- Expand read-only capabilities (refresh status/enqueue, anomaly detection, measurement sources) with deterministic quality semantics.
- Add experiment runtime and one guarded ops pilot using existing BOS conflict controls and policy preflight checks.

## Non-goals
- Direct third-party API fan-out from loop skills.
- Replacing BOS as the write authority.
- Bulk migration of all legacy `analytics_*` non-loop consumers in this wave.

## Constraints & Assumptions
- Constraints:
  - Startup-loop stage policy boundaries remain authoritative (`S5A` side-effect-free, guarded writes in approved stages only).
  - MCP handlers default to artifact-reader compute locality; only health probes and enqueue signals are live exceptions.
  - Packet payloads must be bounded (`maxPacketSizeBytes=262144`) and redacted.
  - Build validation must account for existing Jest haste collisions from generated/cache/worktree paths.
- Assumptions:
  - Base MCP entrypoint remains `@acme/mcp-server`.
  - `@acme/mcp-cloudflare` is reused behind adapter contracts unless superseded later.

## Fact-Find Reference
- Related brief: `docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`
- Key findings:
  - Existing startup-loop kernels already provide deterministic S10 growth/diagnostic outputs (`scripts/src/startup-loop/s10-growth-accounting.ts:198`).
  - MCP dispatch/policy scaffolding exists but lacks wave-2 tool families (`packages/mcp-server/src/tools/index.ts:25`).
  - BOS optimistic concurrency primitives already exist and should be reused for guarded writes (`apps/business-os/src/app/api/agent/cards/[id]/route.ts:140`).
  - Fact-find confidence inputs: Implementation 82 / Approach 84 / Impact 78 / Delivery-Readiness 82 / Testability 81.

## Existing System Notes
- Key modules/files:
  - `packages/mcp-server/src/tools/index.ts:25` - central registry/dispatcher and strict policy preflight integration.
  - `packages/mcp-cloudflare/src/tools/index.ts:15` - separate Cloudflare tool registry to wrap via adapters.
  - `scripts/src/startup-loop/s10-growth-accounting.ts:40` - structured S10 growth payload with data-quality and sources.
  - `apps/business-os/src/app/api/agent/cards/[id]/route.ts:112` - guarded PATCH semantics with `baseEntitySha` conflict control.
  - `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts:10` - policy gate regression harness.
- Patterns to follow:
  - Strict preflight policy mode + compatibility mode split (`packages/mcp-server/src/tools/index.ts:50`).
  - Event/payload determinism and replay checks (`scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts:99`).

## Proposed Approach
Implement wave-2 in phased increments with a hard vertical-slice gate and checkpoint before expansion.

- Option A: Artifact-reader MCP + scheduled collectors (chosen)
  - Pros: deterministic replay, clearer provenance, preserves single-writer invariants.
  - Cons: requires up-front collector artifact contracts and freshness status tooling.
- Option B: MCP live connector fan-out per tool call
  - Pros: less initial collector plumbing.
  - Cons: non-reproducible outputs, higher rate-limit risk, weaker governance.
- Chosen: Option A because it is consistent with existing startup-loop artifact discipline and BOS safety boundaries.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Select credential/tenancy model for provider connectors | 60% | S | Complete (2026-02-13) | - | TASK-07 |
| TASK-02 | INVESTIGATE | Build blast-radius + consumer map to raise Impact confidence | 74% | M | Complete (2026-02-13) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Implement shared wave-2 contracts + policy middleware | 82% | M | Complete (2026-02-13) | TASK-02 | TASK-04, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10 |
| TASK-04 | IMPLEMENT | Deliver vertical slice (`measure` + `app_packet` + `pack`) over artifacts | 80% | M | Complete (2026-02-13) | TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess post-slice before broad expansion | 95% | S | Complete (2026-02-13) | TASK-04 | TASK-06, TASK-09, TASK-10 |
| TASK-06 | IMPLEMENT | Add refresh status/enqueue lifecycle and anomaly detection tools | 81% | M | Complete (2026-02-13) | TASK-03, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Expand measurement adapters and enforce startup-loop `analytics_*` sunset trigger | 84% | M | Pending | TASK-01, TASK-03, TASK-05, TASK-09 | TASK-08 |
| TASK-08 | IMPLEMENT | Add experiment runtime MCP and a guarded ops pilot | 82% | M | Blocked | TASK-03, TASK-05, TASK-07, TASK-10 | - |
| TASK-09 | SPIKE | Add `@acme/mcp-cloudflare` contract harness + package-local analytics tests | 84% | M | Complete (2026-02-13) | TASK-03, TASK-05 | TASK-07 |
| TASK-10 | SPIKE | Probe `exp_*` runtime contract and guarded `ops_*` audit envelope | 83% | M | Complete (2026-02-13) | TASK-03, TASK-05 | TASK-08 |

> Effort scale: S=1, M=2 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02 | - | Decision + impact map can run in parallel |
| 2 | TASK-03 | TASK-02 | Contract kernel starts after impact mapping |
| 3 | TASK-04 | TASK-03 | Vertical slice implementation |
| 4 | TASK-05 | TASK-04 | Completed checkpoint gate |
| 5 | TASK-06, TASK-09, TASK-10 | TASK-03, TASK-05 | Ready branch: refresh/anomaly + two precursor spikes |
| 6 | TASK-07 | TASK-01, TASK-03, TASK-05, TASK-09 | Source expansion after Cloudflare harness |
| 7 | TASK-08 | TASK-03, TASK-05, TASK-07, TASK-10 | Experiment/ops pilot after adapter + runtime precursors |

**Max parallelism:** 3 | **Critical path:** 7 waves | **Total tasks:** 10

## Tasks

### TASK-01: Select credential and tenancy model for connector access
- **Type:** DECISION
- **Deliverable:** ADR at `docs/plans/mcp-startup-loop-data-plane-wave-2/decisions/credential-tenancy.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`, `[readonly] apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `[readonly] scripts/src/startup-loop/growth-metrics-adapter.ts`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 60% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — both options are implementable with existing repo primitives.
  - Approach: 60% — policy/compliance tradeoff needs explicit preference.
  - Impact: 60% — impacts secrets, audit, and rollout ownership across connectors.
- **Options:**
  - **Option A (recommended):** BOS-scoped connector profiles + centralized secret manager references.
  - **Option B:** collector-environment scoped secrets.
- **Recommendation:** Option A because it preserves tenancy boundaries and auditability while supporting rotation without redeploy.
- **Decision:** Option A approved by user on 2026-02-13.
- **Question for user:**
  - Approve Option A as the production connector model for wave-2?
  - Why it matters: TASK-07 cannot safely ship multi-source connectors without this governance decision.
  - Default if no answer: Option A (risk: slower initial rollout, stronger compliance).
- **Acceptance:**
  - Decision recorded in ADR with owner and acceptance criteria.
  - Dependent tasks updated to reference approved model.
- **Validation contract:**
  - TC-01: Option A and Option B are both scored against tenancy, rotation, auditability, and environment-isolation criteria.
  - TC-02: Recommended option includes explicit risk/tradeoff summary and fallback.
  - Acceptance coverage: TC-01..TC-02 cover all acceptance bullets.
  - Validation type: decision checklist.
  - Validation location/evidence: `docs/plans/mcp-startup-loop-data-plane-wave-2/decisions/credential-tenancy.md`.
  - Run/verify: reviewer confirms checklist completion and selected option.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: demonstrate at least one option fails one production criterion.
  - Green evidence: chosen option satisfies all production criteria.
  - Refactor evidence: streamline decision artifact and ensure rationale is auditable.
- **Planning validation:**
  - Checks run: fact-find option analysis reviewed and aligned with governance constraints.
  - Validation artifacts written: none (S effort).
  - Unexpected findings: none.
- **Rollout / rollback:**
  - Rollout: apply chosen credential model first to one provider in TASK-07.
  - Rollback: pause additional providers and revert to prior secret reference approach for wave-2 adapters.
- **Documentation impact:**
  - Update wave-2 governance notes in `docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** None (plan/update artifact only)
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1 decision cycle
  - Initial validation: Option comparison pending
  - Final validation: PASS (Option A selected with rationale)
- **Confidence reassessment:**
  - Original: 60%
  - Post-validation: 92%
  - Delta reason: user decision resolved the only gating uncertainty
- **Validation:**
  - Ran: decision checklist against tenancy/rotation/audit criteria — PASS
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** Option A is now authoritative for TASK-07 rollout planning.

### TASK-02: Build blast-radius and consumer map for wave-2 surfaces
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/mcp-startup-loop-data-plane-wave-2/impact-map.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `[readonly] packages/mcp-server/src/tools/index.ts`, `[readonly] packages/mcp-cloudflare/src/tools/index.ts`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`, `[readonly] docs/business-os/startup-loop/stage-result-schema.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 74%
  - Implementation: 78% — evidence sources are available and traceable.
  - Approach: 74% — expected call-site map is straightforward but broad.
  - Impact: 74% — this task explicitly raises fact-find Impact (78 baseline).
- **Blockers / questions to answer:**
  - Which startup-loop skills currently consume `analytics_*` or provider-specific outputs.
  - Which artifacts and schemas are required for deterministic pack replay.
- **Acceptance:**
  - Consumer matrix includes source, contract, owner, and migration risk.
  - Explicit list of files/modules affected by TASK-03..TASK-08.
  - Plan confidence updates after evidence capture.
- **Validation contract:**
  - TC-01: all startup-loop MCP call sites are enumerated with current tool family and proposed replacement.
  - TC-02: artifact dependencies for packet/pack/replay are traced to concrete file/schema paths.
  - TC-03: unresolved high-risk unknowns are converted into explicit blockers/tasks.
  - Acceptance coverage: TC-01..TC-03 cover all acceptance bullets.
  - Validation type: analysis checklist.
  - Validation location/evidence: `docs/plans/mcp-startup-loop-data-plane-wave-2/impact-map.md`.
  - Run/verify: reviewer confirms no missing tool families or artifact classes.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: initial map intentionally omits one known dependency class to confirm checklist catches it.
  - Green evidence: revised map includes complete dependency set and ownership fields.
  - Refactor evidence: normalize impact-map schema for reuse in later waves.
- **Planning validation:**
  - Checks run: repository scans across MCP registries and startup-loop schema docs.
  - Validation artifacts written: none (M effort).
  - Unexpected findings: broad blast radius validates need for checkpoint after vertical slice.
- **Rollout / rollback:**
  - Rollout: use matrix as gating input for TASK-03 implementation scope.
  - Rollback: if gaps remain, hold TASK-03 and rerun investigation.
- **Documentation impact:**
  - Create and maintain `docs/plans/mcp-startup-loop-data-plane-wave-2/impact-map.md`.
- **Notes / references:**
  - `packages/mcp-server/src/tools/index.ts:25`
  - `packages/mcp-cloudflare/src/tools/index.ts:15`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** None (analysis artifact + plan update in working tree)
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1 analysis cycle
  - Initial validation: dependency map draft with known gaps
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 74%
  - Post-validation: 82%
  - Delta reason: completed consumer matrix and explicit affected-area map reduced blast-radius uncertainty
- **Validation:**
  - Ran: repository scans and source/contract mapping review — PASS
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/impact-map.md`, `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** TASK-03 is unblocked with explicit impacted modules and migration seams documented.

### TASK-03: Implement shared contracts and middleware for wave-2
- **Type:** IMPLEMENT
- **Deliverable:** Contract kernel + policy middleware in `packages/mcp-server` with tests
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/lib/wave2-contracts/` and `packages/mcp-server/src/tools/`
- **Reviewer:** PLAT engineering owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-03.md`
- **Measurement-Readiness:** Owner PLAT; cadence weekly; track contract pass/fail in `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/contract-checks.json`
- **Affects:** `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`, `[readonly] docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10
- **Confidence:** 82%
  - Implementation: 82% — existing policy preflight and tests provide a direct extension path.
  - Approach: 84% — shared kernel prevents contract drift across tool families.
  - Impact: 82% — blast radius is concentrated in MCP contract and policy surfaces.
- **Acceptance:**
  - `metrics-registry.v1`, `provenance.v1`, `packet-redaction.v1`, `refresh-enqueue.v1`, `anomaly-baseline.v1` represented as versioned schemas/types.
  - Shared response envelope enforces `schemaVersion`, `refreshedAt`, `quality`, `qualityNotes`, `coverage`, and provenance block.
  - Quality thresholds are deterministic (`ok >= 0.95`, `partial >= 0.50`, `blocked < 0.50`).
  - Contract validation utilities are consumable by all new wave-2 tool handlers.
- **Validation contract:**
  - TC-01: metric record with invalid unit/dimension mapping fails schema validation.
  - TC-02: packet exceeding `maxPacketSizeBytes` or top-K limits is rejected.
  - TC-03: missing required provenance keys fails closed.
  - TC-04: unknown policy permission enum fails parse and blocks handler dispatch.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance bullets above.
  - Validation type: unit + contract.
  - Validation location/evidence: `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts` plus new contract tests.
  - Run/verify: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts --maxWorkers=2 --modulePathIgnorePatterns=/\.open-next/ /\.worktrees/ /\.ts-jest/`
  - Cross-boundary coverage: policy preflight contract enforces shared rules across tool families.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: targeted test runs initially failed due haste collisions and unresolved duplicates, confirming harness risk.
  - Green evidence: policy gate suite passes under constrained governed run (8/8 tests passing).
  - Refactor evidence: standardized ignore patterns for planning-time validation to isolate target suites while preserving governed runner.
- **Scouts:**
  - Policy preflight extensibility -> existing strict/compat modes in `packages/mcp-server/src/tools/index.ts:50` -> confirmed.
  - Deterministic S10 payload contract -> `scripts/src/startup-loop/s10-growth-accounting.ts:40` -> confirmed.
- **Planning validation:**
  - Checks run: governed policy-gates test (pass); governed startup-loop test (pass with scoped ignore patterns).
  - Validation artifacts written: none (M effort).
  - Unexpected findings: baseline Jest environment has duplicate haste entries from generated/worktree paths.
- **What would make this >=90%:**
  - Add one end-to-end contract fixture suite that validates all five schema families through `handleToolCall` entrypoint.
- **Rollout / rollback:**
  - Rollout: ship contract kernel behind wave-2 tool prefixes only.
  - Rollback: disable new tool prefixes, retain legacy paths unchanged.
- **Documentation impact:**
  - Update `docs/business-os/startup-loop-workflow.user.md` and MCP tool contract docs.
- **Notes / references:**
  - `packages/mcp-server/src/tools/index.ts:78`
  - `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts:10`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `7510b0ba57`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1 red-green-refactor cycle
  - Initial validation: FAIL (missing wave-2 contracts module)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 82%
  - Post-validation: 84%
  - Delta reason: shared contract kernel and middleware now implemented with passing contract tests
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/wave2-contracts.test.ts packages/mcp-server/src/__tests__/tool-policy-gates.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only)
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** Added `packages/mcp-server/src/lib/wave2-contracts.ts`, `packages/mcp-server/src/__tests__/wave2-contracts.test.ts`, and policy envelope preflight in `packages/mcp-server/src/tools/policy.ts`.

### TASK-04: Build vertical slice (`measure_snapshot_get` + `app_run_packet_build/get` + `pack_weekly_s10_build`)
- **Type:** IMPLEMENT
- **Deliverable:** End-to-end artifact-backed vertical slice in MCP + fixture-backed tests
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/` and `packages/mcp-server/src/__tests__/fixtures/startup-loop/`
- **Reviewer:** PLAT engineering owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-04.md`
- **Measurement-Readiness:** Owner PLAT; cadence per run; track replay determinism in `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/pack.json`
- **Affects:** `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `[readonly] scripts/src/startup-loop/s10-growth-accounting.ts`, `[readonly] docs/business-os/startup-loop/manifest-schema.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 80% — deterministic S10 kernels and existing tool dispatch patterns are reusable.
  - Approach: 82% — vertical slice first reduces compounding uncertainty.
  - Impact: 80% — contained to new tool handlers and fixture contracts.
- **Acceptance:**
  - `measure_snapshot_get` reads normalized persisted metric artifacts (no live provider fan-out).
  - `app_run_packet_build/get` produces bounded packet with `sizeBytes`, `redactionApplied`, `sourceRefs`, `schemaVersion`.
  - `pack_weekly_s10_build` composes markdown + JSON pack with evidence links.
  - Identical inputs produce deterministic output packet/pack IDs and payloads.
- **Validation contract:**
  - TC-01: repeated run with identical artifacts yields byte-equivalent packet and pack outputs.
  - TC-02: packet containing forbidden PII pattern is redacted and marked `redactionApplied=true`.
  - TC-03: `measure_snapshot_get` rejects records failing registry dimension rules.
  - TC-04: `pack_weekly_s10_build` includes required provenance references for each section.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance bullets.
  - Validation type: integration + contract.
  - Validation location/evidence: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` and fixture artifacts.
  - Run/verify: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts --maxWorkers=2 --modulePathIgnorePatterns=/\.open-next/ /\.worktrees/ /\.ts-jest/`
  - Cross-boundary coverage: startup-loop pack composition references manifest/event contracts.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: baseline suite invocation surfaces harness/path collisions and missing mappings.
  - Green evidence: S10 growth integration suite passes (3/3) under controlled governed run.
  - Refactor evidence: codified constrained governed command pattern for deterministic plan/build validation.
- **Scouts:**
  - Replay determinism feasibility -> `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts:99` -> confirmed.
  - MCP dispatch insertion point -> `packages/mcp-server/src/tools/index.ts:25` -> confirmed.
- **Planning validation:**
  - Checks run: governed S10 growth accounting test (pass); governed BOS cards route test (fails due module mapper mismatch, not accepted as readiness evidence).
  - Validation artifacts written: none (M effort).
  - Unexpected findings: route test config maps `@/` to `apps/cms` for a `business-os` test target.
- **What would make this >=90%:**
  - Add passing integration fixture test that exercises all three vertical-slice handlers in one run.
- **Rollout / rollback:**
  - Rollout: expose tools behind explicit `measure_*`/`app_*`/`pack_*` prefixes.
  - Rollback: disable new prefixes and revert to existing stage-doc/manual artifacts.
- **Documentation impact:**
  - Update startup-loop operator runbook with packet/pack consumption semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts:67`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `7510b0ba57`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 2 (initial implementation + lint-driven refactor extraction)
  - Initial validation: FAIL (lint `max-lines-per-function` and import-sort errors in `loop.ts`)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 83%
  - Delta reason: vertical-slice handlers are now implemented and validated through deterministic integration tests
- **Validation:**
  - Ran: `pnpm --filter @acme/mcp-server test:startup-loop` — PASS (7 tests, including TC-07 deterministic vertical slice)
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/wave2-contracts.test.ts packages/mcp-server/src/__tests__/tool-policy-gates.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only)
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** Added `measure_snapshot_get`, `app_run_packet_build/get`, and `pack_weekly_s10_build` to `packages/mcp-server/src/tools/loop.ts`; extended `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` with deterministic vertical-slice validation.

### TASK-05: Horizon checkpoint — reassess remaining plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated confidence + dependency adjustments in this plan document
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-replan
- **Affects:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06, TASK-09, TASK-10
- **Confidence:** 95%
  - Implementation: 95% — deterministic checkpoint workflow is straightforward.
  - Approach: 95% — required to prevent long-horizon error compounding.
  - Impact: 95% — plan-only updates, no runtime risk.
- **Acceptance:**
  - Run `/lp-replan` for TASK-06..TASK-08 using evidence from TASK-03/TASK-04.
  - Confirm or revise confidence, dependencies, and scope before expansion.
  - Record go/no-go outcome and rationale in Decision Log.
- **Validation contract:**
  - TC-01: checkpoint review includes updated confidence and blockers for TASK-06..TASK-08.
  - TC-02: at least one concrete plan adjustment or explicit no-change rationale is recorded.
  - Acceptance coverage: TC-01..TC-02 cover all acceptance bullets.
  - Validation type: checkpoint review.
  - Validation location/evidence: updated `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md` Decision Log.
  - Run/verify: `/lp-replan` output is persisted and referenced.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: identify at least one post-slice uncertainty that could invalidate downstream sequencing.
  - Green evidence: uncertainty is resolved or converted into explicit task changes.
  - Refactor evidence: simplify downstream dependencies after reassessment.
- **Planning validation:**
  - Checks run: n/a during initial planning (executed at checkpoint time).
  - Validation artifacts written: none (S effort).
  - Unexpected findings: none.
- **Rollout / rollback:**
  - Rollout: only proceed past checkpoint when review is complete.
  - Rollback: keep downstream tasks blocked and re-open planning.
- **Documentation impact:**
  - Update this plan and linked decision notes.
- **Horizon assumptions to validate:**
  - Shared contracts are stable enough for broader source expansion.
  - Vertical slice replay behavior generalizes to additional tool families.

#### Checkpoint Completion (2026-02-13)
- **Status:** Complete
- **Validation:** `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/replan-trigger.test.ts scripts/src/startup-loop/__tests__/metrics-aggregate.test.ts packages/mcp-server/src/__tests__/bos-tools.test.ts packages/mcp-server/src/__tests__/bos-tools-write.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS (4 suites, 40 tests)
- **Go/No-Go outcome:** GO for TASK-06, TASK-09, TASK-10; HOLD TASK-07 and TASK-08 pending precursor evidence.

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 95%
- **Updated confidence:** 95%
  - **Evidence class:** E2 (executable verification)
- **Investigation performed:**
  - Repo: `scripts/src/startup-loop/replan-trigger.ts:117`, `scripts/src/startup-loop/metrics-aggregate.ts:54`, `packages/mcp-server/src/tools/index.ts:50`, `packages/mcp-cloudflare/src/tools/index.ts:15`
  - Tests: `scripts/src/startup-loop/__tests__/replan-trigger.test.ts`, `scripts/src/startup-loop/__tests__/metrics-aggregate.test.ts`, `packages/mcp-server/src/__tests__/bos-tools.test.ts`, `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`
- **Decision / resolution:**
  - Refresh/anomaly and guarded-write kernels are validated and reusable.
  - Source-expansion and experiment-runtime work still contain unresolved implementation unknowns; added explicit SPIKE precursors.
- **Changes to task:**
  - Dependencies: checkpoint now directly unblocks TASK-06, TASK-09, TASK-10.
  - Validation plan: upgraded from E1-only audit to E2 execution evidence.

### TASK-06: Add refresh status/enqueue lifecycle and anomaly detection tools
- **Type:** IMPLEMENT
- **Deliverable:** `refresh_status_*`, guarded `refresh_enqueue_*`, `anomaly_detect_*` handlers + tests
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/` and `packages/mcp-server/src/__tests__/`
- **Reviewer:** PLAT engineering owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-06.md`
- **Measurement-Readiness:** Owner PLAT; cadence each run; track queue lag + anomaly false-positive rate in `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/anomalies.json`
- **Affects:** `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `[readonly] scripts/src/startup-loop/metrics-aggregate.ts`, `[readonly] scripts/src/startup-loop/replan-trigger.ts`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 81%
  - Implementation: 82% — lifecycle and severity-gate kernels already exist with passing tests.
  - Approach: 81% — refresh state machine + anomaly gates align with wave-2 artifact-reader spine.
  - Impact: 81% — blast radius is bounded to loop tool handlers + fixture contracts.
- **Acceptance:**
  - `refresh_enqueue_*` uses idempotent `requestId` lifecycle (`enqueued -> pending -> running -> complete/failed/expired`).
  - Duplicate enqueue requests return prior state without rewriting artifacts.
  - `anomaly_detect_*` enforces minimum history gates (daily 28 / weekly 8) and emits `quality=blocked` on cold start.
  - Detector metadata versions (EWMA/z-score defaults) are included in outputs.
- **Validation contract:**
  - TC-01: duplicate enqueue with same `requestId` returns existing state.
  - TC-02: stale collector status reports lag and failed state details.
  - TC-03: detector with insufficient history returns blocked quality and no severity.
  - TC-04: detector with sufficient history emits deterministic severity for fixture series.
  - Acceptance coverage: TC-01..TC-04 map one-to-one with acceptance bullets.
  - Validation type: integration + contract.
  - Validation location/evidence: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`.
  - Run/verify: governed targeted Jest run with constrained modulePathIgnorePatterns.
  - Cross-boundary coverage: queue state outputs align with collector artifact lifecycle.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: create failing fixture where detector history is below threshold.
  - Green evidence: implement lifecycle/anomaly handlers until TC-01..TC-04 pass.
  - Refactor evidence: extract shared queue-state and detector metadata helpers; re-run suite.
- **Planning validation:**
  - Checks run: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/replan-trigger.test.ts scripts/src/startup-loop/__tests__/metrics-aggregate.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Validation artifacts written: none (M effort).
  - Unexpected findings: governed runs require explicit `modulePathIgnorePatterns` because of known haste-map collisions in generated/worktree paths.
- **What would make this >=90%:**
  - Add passing fixture coverage for all lifecycle transitions plus one real historical anomaly replay.
- **Rollout / rollback:**
  - Rollout: enable read-only status first, then guarded enqueue.
  - Rollback: disable enqueue tool prefix and preserve status-only read path.
- **Documentation impact:**
  - Update weekly operations runbook with refresh queue state semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/metrics-aggregate.ts:54`
  - `scripts/src/startup-loop/replan-trigger.ts:117`

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 74%
- **Updated confidence:** 81%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 82% — persistent constraint lifecycle already proven by `replan-trigger` tests.
  - Approach: 81% — thresholded warning logic already exercised by `metrics-aggregate` tests.
  - Impact: 81% — handler boundaries confirmed in `packages/mcp-server/src/tools/loop.ts:90`.
- **Investigation performed:**
  - Repo: `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/metrics-aggregate.ts`, `packages/mcp-server/src/tools/loop.ts`
  - Tests: `scripts/src/startup-loop/__tests__/replan-trigger.test.ts`, `scripts/src/startup-loop/__tests__/metrics-aggregate.test.ts`
- **Decision / resolution:**
  - Task is now build-eligible without adding a precursor because the key lifecycle/anomaly assumptions are validated in executable suites.
- **Changes to task:**
  - Dependencies/order: TASK-06 now explicitly blocks TASK-07 to enforce lifecycle-first expansion.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `4166298ae4`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 2 (red-green)
  - Initial validation: FAIL (expected red; new `refresh_*`/`anomaly_*` tools were not implemented yet)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 81%
  - Post-validation: 84%
  - Delta reason: lifecycle, idempotency, stale status lag reporting, and cold-start anomaly gating are now exercised by passing integration tests.
- **Validation:**
  - Ran: `pnpm --filter @acme/mcp-server test:startup-loop` — PASS (9 tests, includes TC-08/TC-09)
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only)
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** Added `refresh_status_get`, `refresh_enqueue_guarded`, and `anomaly_detect_{traffic,revenue,errors}` in `packages/mcp-server/src/tools/loop.ts` with guarded refresh lifecycle transitions and deterministic EWMA/z-score detector metadata.

### TASK-07: Expand measurement adapters and enforce startup-loop `analytics_*` sunset trigger
- **Type:** IMPLEMENT
- **Deliverable:** Additional `measure_*` adapters + Cloudflare test coverage + startup-loop surface containment
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/`, `packages/mcp-cloudflare/src/`, `packages/mcp-cloudflare/src/__tests__/`
- **Reviewer:** PLAT engineering owner + BOS ops reviewer
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-07.md`
- **Measurement-Readiness:** Owner PLAT; cadence weekly S10; track source coverage + sunset readiness in `docs/plans/mcp-startup-loop-data-plane-wave-2/coverage-report.md`
- **Affects:** `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/analytics.ts`, `packages/mcp-cloudflare/src/tools/index.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `[readonly] docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`
- **Depends on:** TASK-01, TASK-03, TASK-05, TASK-09
- **Blocks:** TASK-08
- **Confidence:** 84%
  - Implementation: 85% — Cloudflare adapter contract harness now exists in both packages with deterministic fixtures.
  - Approach: 84% — sunset policy remains scoped and now has executable evidence inputs.
  - Impact: 84% — blast radius remains MCP-focused with cross-package seams validated.
- **Acceptance:**
  - `measure_*` covers prioritized sources: Stripe, D1/Prisma, Cloudflare, GA4/Search Console, support/email summaries.
  - `@acme/mcp-cloudflare` has package-local tests for covered endpoints and adapter contract tests in `@acme/mcp-server`.
  - Startup-loop skills are prevented from using provider-specific `analytics_*` once trigger criteria are met.
  - Sunset trigger logic is instrumented: two consecutive weekly S10 runs with full `measure_*` coverage -> block loop access to `analytics_*` within 14 days.
- **Validation contract:**
  - TC-01: each source adapter emits registry-compliant metric records (unit/dimension/grain).
  - TC-02: Cloudflare adapter tests pass in both packages (local + integration contracts).
  - TC-03: loop-stage invocation of `analytics_*` is rejected once trigger condition is true.
  - TC-04: non-loop consumers can still call `analytics_*` during transition window.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance bullets.
  - Validation type: contract + integration.
  - Validation location/evidence: MCP server and mcp-cloudflare test suites.
  - Run/verify: governed targeted tests for each adapter family + policy gate regression.
  - Cross-boundary coverage: adapter contracts verify cross-package compatibility.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: introduce fixture mismatches for unit/dimension mapping and confirm fail-closed behavior.
  - Green evidence: adapter and policy tests pass for all covered sources.
  - Refactor evidence: consolidate shared normalization helpers to remove duplication.
- **Planning validation:**
  - Checks run: static audit of `packages/mcp-server/src/tools/index.ts:50`, `packages/mcp-server/src/tools/analytics.ts:58`, `packages/mcp-cloudflare/src/tools/index.ts:15`; no package-local tests found in `@acme/mcp-cloudflare` and no `test` script in `packages/mcp-cloudflare/package.json`.
  - Validation artifacts written: none (M effort).
  - Unexpected findings: coexistence of `analytics_*` and new wave-2 surfaces remains permissive until explicit sunset guard logic is added.
- **What would make this >=90%:**
  - Complete one full provider expansion pair (Stripe + Cloudflare) with passing cross-package contracts and sunset dry-run.
- **Rollout / rollback:**
  - Rollout: source-by-source enablement with coverage scoreboard.
  - Rollback: disable failing source adapter while preserving existing measure sources.
- **Documentation impact:**
  - Update MCP tool catalog and loop operator migration notes for `analytics_*` sunset.
- **Notes / references:**
  - `packages/mcp-server/src/tools/index.ts:50`
  - `packages/mcp-server/src/tools/analytics.ts:58`
  - `packages/mcp-cloudflare/src/tools/index.ts:15`

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 70%
- **Updated confidence:** 70% (→ 84% conditional on TASK-09)
  - **Evidence class:** E1 (static audit)
  - Confidence cannot be promoted until Cloudflare contract-test seams are proven with executable evidence.
- **Investigation performed:**
  - Repo: `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/analytics.ts`, `packages/mcp-cloudflare/src/tools/index.ts`
  - Package scripts: `packages/mcp-cloudflare/package.json`
- **Decision / resolution:**
  - Keep scope intact; add SPIKE precursor TASK-09 to produce missing cross-package evidence instead of speculatively promoting confidence.
- **Changes to task:**
  - Dependencies updated to require TASK-09 before source expansion begins.

#### Dependency Unblock Update (2026-02-13)
- **Status:** Pending (build-eligible)
- **Confidence update:** promoted from 70% to 84% after TASK-09 completion evidence.
- **Evidence:** `246da27213` added package-local Cloudflare analytics contract tests and MCP-side registry enforcement harness.
- **Next action:** proceed with TASK-07 implementation using established adapter contract harness as a required regression gate.

### TASK-08: Add experiment runtime MCP and a guarded ops pilot
- **Type:** IMPLEMENT
- **Deliverable:** `exp_*` control tools + one `ops_*_guarded` pilot with audit/concurrency controls
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/` and `packages/mcp-server/src/__tests__/`
- **Reviewer:** PLAT engineering owner + BOS governance reviewer
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-08.md`
- **Measurement-Readiness:** Owner BOS/PLAT; cadence weekly; track experiment decision quality in `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/experiment-summary.json`
- **Affects:** `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/bos-tools.test.ts`, `[readonly] apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `[readonly] scripts/src/hypothesis-portfolio/storage.ts`
- **Depends on:** TASK-03, TASK-05, TASK-07, TASK-10
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 84% — `exp_*` and guarded `ops_*` contract probes are now implemented with passing tests.
  - Approach: 82% — TASK-10 resolved contract shape uncertainty, leaving only TASK-07 dependency.
  - Impact: 82% — guarded-write blast radius is now bounded by proven conflict and redaction behavior.
- **Acceptance:**
  - `exp_allocate_id`, `exp_register`, `exp_rollout_status`, `exp_results_snapshot` implemented with policy preflight and provenance envelopes.
  - One guarded `ops_*` pilot requires `write_reason`, concurrency token (`entitySha` or equivalent), stage allowlist, audit tag.
  - Conflict paths (`409`) are surfaced deterministically and non-destructively.
  - No tool in this task bypasses BOS write authority.
- **Validation contract:**
  - TC-01: experiment register call without required guarded fields fails closed.
  - TC-02: valid guarded experiment flow records auditable metadata and returns normalized snapshot.
  - TC-03: guarded ops pilot rejects stale `entitySha` with conflict response.
  - TC-04: successful guarded ops pilot appends audit metadata and returns redacted sensitive fields.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance bullets.
  - Validation type: integration + route-contract.
  - Validation location/evidence: `packages/mcp-server/src/__tests__/bos-tools.test.ts` and mocked BOS API fixtures.
  - Run/verify: governed targeted tests for BOS tools and policy gates.
  - Cross-boundary coverage: BOS API conflict semantics verified with mocked 409 responses.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: seed invalid guarded args and stale entity-sha responses; verify fail-closed.
  - Green evidence: implement minimal exp/ops tool set until TC-01..TC-04 pass.
  - Refactor evidence: extract shared guarded-write helper used by both exp and ops paths.
- **Scouts:**
  - BOS conflict control viability -> `apps/business-os/src/app/api/agent/cards/[id]/route.ts:140` -> confirmed.
  - Strict policy gate for guarded writes -> `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts:88` -> confirmed.
- **Planning validation:**
  - Checks run: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/bos-tools.test.ts packages/mcp-server/src/__tests__/bos-tools-write.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Validation artifacts written: none (M effort).
  - Unexpected findings: experiment-specific MCP tools are absent; only BOS guarded primitives are currently tested.
- **What would make this >=90%:**
  - Add passing end-to-end mocked BOS conflict suite covering both experiment and ops guarded paths.
- **Rollout / rollback:**
  - Rollout: ship experiment read/status tools first, then guarded write tools behind allowlist.
  - Rollback: disable guarded-write tools while retaining read-only experiment snapshots.
- **Documentation impact:**
  - Update BOS agent API contract notes for guarded experiment/ops operations.
- **Notes / references:**
  - `apps/business-os/src/app/api/agent/cards/[id]/route.ts:140`
  - `packages/mcp-server/src/__tests__/bos-tools-write.test.ts:63`

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 68%
- **Updated confidence:** 74% (→ 82% conditional on TASK-10)
  - **Evidence class:** E2 (executable verification) + E1 (static audit)
  - Implementation: 78% — conflict and guarded-write semantics are validated in passing BOS tool suites.
  - Approach: 74% — no finalized `exp_*` contract yet.
  - Impact: 74% — cross-app dependency on hypothesis storage and BOS APIs remains non-trivial.
- **Investigation performed:**
  - Repo: `packages/mcp-server/src/tools/bos.ts:271`, `apps/business-os/src/app/api/agent/cards/[id]/route.ts:140`, `scripts/src/hypothesis-portfolio/storage.ts:48`
  - Tests: `packages/mcp-server/src/__tests__/bos-tools.test.ts`, `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`
- **Decision / resolution:**
  - Promote confidence modestly from new E2 evidence but keep task below threshold until experiment-specific contracts are probed in TASK-10.
- **Changes to task:**
  - Dependencies now include TASK-10 precursor.

#### Dependency Update (2026-02-13)
- **Status:** Blocked (awaiting TASK-07 completion only)
- **Confidence update:** promoted from 74% to 82% after TASK-10 completion evidence.
- **Evidence:** `f8d789c637` implemented contract probes for `exp_allocate_id`, `exp_register`, `exp_rollout_status`, `exp_results_snapshot`, and `ops_update_price_guarded`.
- **Go/No-Go recommendation from TASK-10:** **GO** for TASK-08 once TASK-07 lands, with scope bounded to the validated contract envelopes and BOS conflict semantics.

### TASK-09: Spike Cloudflare adapter contract harness and package-local test baseline
- **Type:** SPIKE
- **Deliverable:** Contract-test harness + package-local analytics tests proving adapter compatibility
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-cloudflare/src/__tests__/`, `packages/mcp-server/src/__tests__/`
- **Reviewer:** PLAT engineering owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-09.md`
- **Measurement-Readiness:** Owner PLAT; cadence per build; track contract pass/fail in CI annotations
- **Affects:** `packages/mcp-cloudflare/src/tools/analytics.ts`, `packages/mcp-cloudflare/src/tools/index.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `[readonly] packages/mcp-server/src/tools/analytics.ts`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 84%
  - Implementation: 85% — scope is bounded to tests/harness and existing adapters.
  - Approach: 84% — establishing executable contracts is the smallest path to de-risk TASK-07.
  - Impact: 84% — limited runtime impact; primary effect is evidence generation.
- **Uncertainty statement:** Can `@acme/mcp-cloudflare` be safely reused behind `measure_*` without contract drift?
- **Falsifiable check:** If package-local Cloudflare tests plus MCP-side adapter contract tests pass with deterministic fixtures, reuse is viable; otherwise TASK-07 must revise adapter strategy.
- **Evidence target class:** E2
- **Acceptance:**
  - Add package-local tests for Cloudflare analytics endpoints used by wave-2.
  - Add MCP adapter contract tests that validate normalized metric shape/unit/segment mapping for Cloudflare-derived records.
  - Document test command(s) in plan build-completion notes for TASK-07 promotion.
  - Produce clear pass/fail outcome that either unblocks TASK-07 or triggers approach revision.
- **Validation contract:**
  - TC-01: package-local Cloudflare analytics test fixtures pass.
  - TC-02: MCP-side adapter contract tests fail on dimension/unit mismatch and pass on valid mappings.
  - TC-03: contract harness remains deterministic across two consecutive runs.
  - Acceptance coverage: TC-01..TC-03 cover all acceptance bullets.
  - Validation type: unit + contract.
  - Validation location/evidence: `packages/mcp-cloudflare/src/__tests__/` and `packages/mcp-server/src/__tests__/`.
  - Run/verify: governed targeted Jest run for both package test paths.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: introduce intentionally invalid mapping fixture and verify contract failure.
  - Green evidence: implement harness/tests until TC-01..TC-03 pass.
  - Refactor evidence: extract shared fixture helpers and re-run tests.
- **Planning validation:**
  - Checks run: static verification that no package-local tests currently exist.
  - Validation artifacts written: none (M effort).
  - Unexpected findings: package currently has no `test` script, so harness command wiring is part of the spike.
- **Rollout / rollback:**
  - Rollout: merge harness first, then allow TASK-07 to consume it.
  - Rollback: keep harness-only changes isolated; do not alter runtime tool dispatch in this task.
- **Documentation impact:**
  - Update wave-2 plan notes with verified Cloudflare reuse path.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `246da27213`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1 red/green/refactor cycle
  - Initial validation: FAIL (missing harness + no package-local Cloudflare tests)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 84%
  - Post-validation: 84%
  - Delta reason: confidence held; executable evidence satisfied planned acceptance and unblocked TASK-07 dependency.
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-cloudflare/src/tools/analytics.contract.test.ts packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Ran: `pnpm --filter @acme/mcp-cloudflare build` — PASS
  - Ran: `pnpm --filter @acme/mcp-cloudflare lint` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only)
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Implementation notes:** Cloudflare projection contract kernel and adapter harness now provide deterministic registry validation input for TASK-07.

### TASK-10: Spike experiment-runtime tool contracts and guarded ops audit envelope
- **Type:** SPIKE
- **Deliverable:** Executable contract draft for `exp_*` + guarded `ops_*` payload/response envelopes
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Artifact-Destination:** `packages/mcp-server/src/__tests__/`, `packages/mcp-server/src/tools/`
- **Reviewer:** PLAT engineering owner + BOS governance reviewer
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane-wave-2/approvals/TASK-10.md`
- **Measurement-Readiness:** Owner BOS/PLAT; cadence per run; track conflict-rate and guardrail-fail metrics in weekly S10 notes
- **Affects:** `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`, `[readonly] scripts/src/hypothesis-portfolio/storage.ts`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 83%
  - Implementation: 84% — guarded-write and policy primitives already pass in MCP tests.
  - Approach: 83% — spike isolates contract risk before full runtime implementation.
  - Impact: 83% — scoped to contract probing, not full feature rollout.
- **Uncertainty statement:** What is the minimal safe `exp_*` + `ops_*` contract shape that preserves BOS guardrails and reproducibility?
- **Falsifiable check:** If mock-driven contract tests can enforce required fields (`write_reason`, concurrency token, auditTag, provenance), TASK-08 can promote; if not, TASK-08 approach must split or reduce scope.
- **Evidence target class:** E2
- **Acceptance:**
  - Define test-first schema expectations for `exp_allocate_id`, `exp_register`, `exp_rollout_status`, `exp_results_snapshot`.
  - Define and test one guarded `ops_*` pilot payload envelope including audit and concurrency fields.
  - Prove deterministic 409 conflict handling and redaction requirements through tests.
  - Produce a concrete go/no-go recommendation for TASK-08 scope.
- **Validation contract:**
  - TC-01: `exp_register` without guarded fields fails closed.
  - TC-02: valid guarded payload includes audit and provenance metadata.
  - TC-03: stale `entitySha` returns deterministic conflict envelope.
  - TC-04: response redaction preserves safety fields and removes sensitive values.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance bullets.
  - Validation type: integration + contract.
  - Validation location/evidence: `packages/mcp-server/src/__tests__/bos-tools-write.test.ts` and new `exp_*` contract test file.
  - Run/verify: governed targeted Jest run over BOS and experiment contract tests.
- **Execution plan:**
  - Red -> Green -> Refactor.
  - Red evidence: add failing tests for missing required fields and stale-sha conflict handling.
  - Green evidence: add minimal contract handlers/mocks so TC-01..TC-04 pass.
  - Refactor evidence: extract shared guarded-envelope helper reused by experiment and ops probe tests.
- **Planning validation:**
  - Checks run: BOS guarded tool suites are passing and provide reusable conflict semantics.
  - Validation artifacts written: none (M effort).
  - Unexpected findings: experiment-runtime contract tests do not yet exist and must be created in this spike.
- **Rollout / rollback:**
  - Rollout: keep spike outputs behind test-only or non-public contract paths.
  - Rollback: remove spike contract scaffolding if TASK-08 direction changes.
- **Documentation impact:**
  - Update wave-2 plan with final experiment/ops contract decision before TASK-08 implementation.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `f8d789c637`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1 red/green/refactor cycle
  - Initial validation: FAIL (missing `exp_*` and `ops_*` tools returned `NOT_FOUND`)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 83%
  - Post-validation: 83%
  - Delta reason: confidence held; spike delivered expected contract evidence and unblocked TASK-08 approach risk.
- **Validation:**
  - Ran (red): `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts packages/mcp-server/src/__tests__/exp-tools.contract.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — FAIL (expected)
  - Ran (green): `pnpm run test:governed -- jest -- --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts packages/mcp-server/src/__tests__/exp-tools.contract.test.ts --maxWorkers=2 --modulePathIgnorePatterns='/\\.open-next/' '/\\.worktrees/' '/\\.ts-jest/'` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only)
- **Documentation updated:** `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`
- **Go/No-Go recommendation:** **GO** for TASK-08 after TASK-07, with implementation constrained to tested contract envelopes and existing BOS guarded patch authority (no direct non-BOS writes).
- **Implementation notes:** Added experiment runtime contracts and guarded ops pilot handlers to `packages/mcp-server/src/tools/bos.ts`, plus strict-scope policy prefixing for `exp_*` and `ops_*` in `packages/mcp-server/src/tools/policy.ts`.

## Risks & Mitigations
- Test harness instability (Jest haste collisions) could distort validation signals.
  - Mitigation: use governed targeted tests with explicit `modulePathIgnorePatterns`; track harness cleanup as follow-up.
- Missing cross-package adapter tests can stall source expansion confidence.
  - Mitigation: execute TASK-09 before TASK-07 and require contract pass evidence.
- Provider data heterogeneity may produce low-confidence metrics.
  - Mitigation: enforce registry mapping + deterministic quality thresholds in shared kernel.

## Observability
- Logging: tool preflight rejects, refresh enqueue state transitions, anomaly detector baseline gate failures.
- Metrics: packet size distribution, redaction hit rate, refresh lag, anomaly false-positive rate, source coverage rate.
- Alerts/Dashboards: weekly S10 coverage/regression board and refresh queue health board.

## Acceptance Criteria (overall)
- [ ] Shared wave-2 contracts and middleware are versioned, reusable, and testable.
- [ ] Vertical slice proves deterministic replayable outputs from artifact-backed MCP handlers.
- [ ] Post-checkpoint expansion tasks are revalidated against real build evidence before full rollout.
- [ ] Guarded write surfaces for experiments/ops enforce policy and concurrency controls without bypassing BOS.

## Decision Log
- 2026-02-13: Chose artifact-reader MCP spine over live connector fan-out for reproducibility and governance.
- 2026-02-13: Added mandatory checkpoint after vertical slice to cap horizon risk before expansion.
- 2026-02-13: User approved Option A (BOS-scoped connector profiles + centralized secret references) for credential/tenancy model.
- 2026-02-13: Checkpoint re-assessment completed with E2 evidence; promoted TASK-06 to build-eligible (81%).
- 2026-02-13: Added precursor spikes TASK-09 and TASK-10; kept TASK-07 and TASK-08 below threshold until precursor evidence lands.
- 2026-02-13: Completed TASK-06 with passing startup-loop integration tests for refresh lifecycle and anomaly baseline gates.
- 2026-02-13: Completed TASK-09 with Cloudflare package-local and MCP adapter contract harness evidence (`246da27213`), promoting TASK-07 to 84% and Pending.
- 2026-02-13: Completed TASK-10 with passing `exp_*`/`ops_*` contract probes (`f8d789c637`), promoting TASK-08 to 82% and recommending GO once TASK-07 completes.
