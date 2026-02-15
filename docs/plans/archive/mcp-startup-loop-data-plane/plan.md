---
Type: Plan
Status: Archived
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: mcp-startup-loop-data-plane
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-replan, /lp-sequence
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# MCP Startup Loop Data Plane Plan

## Summary

This plan upgrades MCP into a stage-aware startup-loop data plane by adding explicit tool policy metadata, Business OS bridge tools, startup-loop artifact status tools, and guarded write paths that respect `entitySha` and stage boundaries. The plan uses an API-first access model and keeps run-artifact writes in existing single-writer scripts. It also introduces explicit error taxonomy and config drift checks so operators and skills can rely on deterministic responses. A checkpoint is inserted after the first three IMPLEMENT tasks to reassess assumptions before guarded-write rollout.

## Goals

- Ship initial `bos_*` and `loop_*` core read primitives for startup-loop execution, with explicit gap tracking for full S0..S10 coverage.
- Enforce stage-aware permission gating (`read`, `guarded_write`) with fail-closed metadata validation.
- Preserve BOS optimistic concurrency (`entitySha`) for guarded write paths.
- Add deterministic test coverage for policy gates, BOS bridge contracts, and loop artifact status tools.
- Establish operator-facing drift/freshness checks for startup-loop MCP tooling.

## Non-goals

- Implementing production measurement connectors (`measure_*`) in this wave.
- Changing startup-loop stage order or BOS control-plane ownership.
- Introducing direct run-artifact write tools for manifest or learning ledger.
- Replacing legacy non-loop MCP tool families.

## Constraints & Assumptions

- Constraints:
  - `S5A` remains side-effect-free and `S5B` remains guarded mutation boundary per `docs/business-os/startup-loop/loop-spec.yaml`.
  - Guarded writes must reuse BOS API concurrency and auth boundaries.
  - Tests must stay targeted and governed; no broad monorepo test runs.
  - Existing single-writer ownership of startup-loop artifacts is preserved.
  - Phase-1 strict policy enforcement applies only to startup-loop tool groups (`bos_*`, `loop_*`); legacy tools remain compatibility-scoped.
- Assumptions:
  - `@acme/mcp-server` remains the extension point for new startup-loop tools.
  - BOS agent routes under `apps/business-os/src/app/api/agent/*` are stable integration contracts.
  - Deployment identity model for MCP -> BOS calls is selectable without changing BOS route semantics.
  - `loop_*` tooling in phase 1 runs only where MCP has filesystem access to startup-loop run artifacts (configured root path).

## Fact-Find Reference

- Related brief: `docs/plans/mcp-startup-loop-data-plane/fact-find.md`
- Key findings carried into this plan:
  - Startup-loop stage and mutation policy are explicit in `docs/business-os/startup-loop/loop-spec.yaml`.
  - BOS card/stage-doc APIs already expose `entitySha` conflict semantics.
  - MCP currently has no `bos_*`, `loop_*`, or metadata-gated startup-loop tools.
  - Current MCP dispatcher is centralized in `packages/mcp-server/src/tools/index.ts`, making policy insertion low-friction.
  - Fact-find impact confidence was 79%, requiring explicit uncertainty-reduction tasks.

## Validation Foundation Check

- `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`: present in fact-find.
- `Startup-Deliverable-Alias`: `none` in fact-find.
- `Delivery-Readiness` confidence: present (81%).
- Mixed-track test foundation: present (infrastructure, patterns, gaps, testability).
- Mixed-track business validation foundation: present (delivery/channel + hypotheses/falsifiability).
- Result: foundation is sufficient to plan and confidence-gate execution.

## Existing System Notes

- Key modules/files:
  - `packages/mcp-server/src/tools/index.ts` - centralized tool registry and dispatch.
  - `apps/business-os/src/app/api/agent/cards/[id]/route.ts` - card read/patch with `entitySha`.
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` - stage-doc read/patch with `entitySha`.
  - `scripts/src/startup-loop/manifest-update.ts` - single-writer manifest contract.
  - `scripts/src/startup-loop/learning-ledger.ts` - append/query learning ledger contract.
  - `scripts/src/startup-loop/metrics-aggregate.ts` - rolling KPI aggregation.
  - `packages/mcp-server/README.md` - MCP registration and usage docs.
  - `.claude/settings.json` - current local agent runtime config (currently no `mcpServers` entry).
- Patterns to follow:
  - Zod input validation + structured tool error payloads in existing MCP handlers.
  - Route tests covering conflict and auth behaviors in `@apps/business-os`.
  - Deterministic artifact validation pattern in startup-loop script tests.

## Proposed Approach

- Option A: extend MCP with startup-loop tools but keep implicit tool policy.
  - Trade-off: faster coding, but does not solve accidental side-effect risk.
- Option B: build startup-loop tools with explicit policy metadata and staged gates.
  - Trade-off: slightly more upfront scaffolding, but aligns with loop policy and reduces write-risk.
- Chosen: Option B.
  - Rationale: long-term maintainability and correctness; enables clear auditability and safer phased rollout.

Design outline:
- Add a policy metadata layer for all MCP tools (`permission`, `sideEffects`, `allowedStages`, `requiresEntitySha`).
- Add API-first `bos_*` read tools, then guarded write tool(s) for stage-doc patch.
- Add read-only `loop_*` artifact status/freshness tools.
- Standardize error codes and retry guidance at MCP boundary.
- Add integration tests and operator drift/freshness checks.

## Policy Scope, Context Authority, and Runtime Profiles

- Policy scope (phase 1):
  - Strict fail-closed metadata enforcement is required for `bos_*` and `loop_*` tools.
  - Legacy tools run through a compatibility adapter (`enforcementScope=legacy_compat`) with explicit warning telemetry; global strict mode is deferred.
- Stage context authority (phase 1):
  - Stage gating is MCP-local and based on caller-declared context; required context keys are `business`, `cardId`, `runId` (or equivalent), `current_stage`, and `write_reason` for guarded writes.
  - BOS APIs remain authoritative for auth and optimistic concurrency; stage checks at BOS layer are out-of-scope for this wave.
  - For guarded writes, MCP logs declared stage context in audit events to keep decisions traceable.
- Runtime profiles:
  - `local`: read `.claude/settings.json` and local artifact root.
  - `ci`: read environment-provided MCP/BOS settings and artifact fixture roots.
  - `deployed`: read service config/env; if artifact root is unavailable, `loop_*` tools are disabled with deterministic error.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add MCP policy schema with scoped strict enforcement (`bos_*`/`loop_*`) + compatibility adapter for legacy tools | 84% | M | Complete (2026-02-13) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Implement BOS read bridge tools (`bos_cards_list`, `bos_stage_doc_get`) via agent APIs | 82% | M | Complete (2026-02-13) | TASK-01 | TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Implement loop read tools (`loop_manifest_status`, `loop_learning_ledger_status`, `loop_metrics_summary`) | 83% | M | Complete (2026-02-13) | TASK-01 | TASK-04, TASK-07 |
| TASK-04 | CHECKPOINT | Horizon checkpoint after initial policy + read tool wave | 95% | S | Complete (2026-02-13) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | DECISION | Finalize MCP->BOS identity/deployment model and exception policy (default Option A) | 85% | S | Complete (2026-02-13) | TASK-04 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Add guarded BOS write tool (`bos_stage_doc_patch_guarded`) with conflict handling and stage gating | 87% | M | Complete (2026-02-13) | TASK-02, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add startup-loop MCP integration suite with stable test harness wrapper + BOS API stub fixtures | 86% | M | Complete (2026-02-13) | TASK-03, TASK-06, TASK-05 | TASK-08 |
| TASK-08 | IMPLEMENT | Add drift/freshness preflight checks + documentation/runbook updates | 85% | M | Complete (2026-02-13) | TASK-07 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Establish shared policy primitives first |
| 2 | TASK-02, TASK-03 | TASK-01 | BOS and loop read domains can proceed in parallel |
| 3 | TASK-04 | TASK-02, TASK-03 | Reassess plan before guarded writes |
| 4 | TASK-05 | TASK-04 | Resolve identity/policy decision before write rollout |
| 5 | TASK-06 | TASK-02, TASK-05 | Guarded write path after decision closure |
| 6 | TASK-07 | TASK-03, TASK-06, TASK-05 | Cross-domain tests once all startup-loop tools exist |
| 7 | TASK-08 | TASK-07 | Operational hardening and docs last |

**Max parallelism:** 2 | **Critical path:** 7 waves | **Total tasks:** 8

## Execution Gates

- Guarded-write rollout gate:
  - Do not enable `bos_stage_doc_patch_guarded` outside development until TASK-05 is completed and TASK-06 validation passes.
- CI gating gate:
  - Do not make startup-loop MCP integration suite mandatory in CI until TASK-07 passes reliably with the dedicated wrapper/config.
- Global strict-mode gate:
  - Do not fail-close legacy tool families in phase 1; retain compatibility mode and warning telemetry until a separate legacy annotation wave is planned.

## Tasks

### TASK-01: Add MCP policy schema with scoped strict enforcement (`bos_*`/`loop_*`) + compatibility adapter for legacy tools
- **Type:** IMPLEMENT
- **Deliverable:** code-change in MCP tool registry/policy layer + policy gate tests + legacy compatibility adapter.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/` + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-01`
- **Reviewer:** Platform infrastructure owner (PLAT)
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-01-approval`
- **Measurement-Readiness:** Owner=PLAT infra; cadence=per build + weekly ops review; tracking=`.cache/test-governor/events.jsonl` + startup-loop run health checks
- **Effort:** M
- **Affects:** `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Status:** Complete (2026-02-13)
- **Confidence:** 84%
  - Implementation: 86% - centralized dispatcher exists and can host metadata preflight and compatibility mapping with low code churn.
  - Approach: 84% - scoped strict enforcement addresses startup-loop risk without breaking legacy domains.
  - Impact: 84% - blast radius stays within MCP registry/policy files.
- **Acceptance:**
  - `bos_*` and `loop_*` tools require full metadata (`permission`, `sideEffects`, `allowedStages`, `auditTag`, `sensitiveFields`) and fail closed when missing.
  - Legacy tool families use compatibility metadata mapping (`enforcementScope=legacy_compat`, `sideEffects=unknown`) with warning telemetry, not hard failure, in phase 1.
  - Stage allowlist validation runs before handler execution.
  - `guarded_write` tools require `write_reason` and declared context keys.
  - Policy layer applies default redaction for declared `sensitiveFields` in logs and error details.
- **Validation contract:**
  - TC-01: `bos_*`/`loop_*` tool without metadata -> deterministic failure (`CONTRACT_MISMATCH`) before handler runs.
  - TC-02: `current_stage` not in `allowedStages` -> deterministic failure (`FORBIDDEN_STAGE`).
  - TC-03: `read` tool with valid context -> handler executes successfully.
  - TC-04: `guarded_write` tool without `write_reason` -> deterministic validation failure.
  - TC-05: legacy tool without explicit metadata -> compatibility metadata applied + warning log event.
  - TC-06: error/log payload redacts fields listed in `sensitiveFields`.
  - **Acceptance coverage:** TC-01/TC-05 cover scoped strictness and compatibility; TC-02 covers stage gate; TC-03/TC-04 cover permission flow; TC-06 covers redaction.
  - **Validation type:** unit + contract.
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`.
  - **Run/verify:** `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** `rg -n "\"bos_|\"loop_|\"measure_" packages/mcp-server/src/tools` returned no matches; `rg -n "permission|allowedStages|requiresEntitySha|sideEffects" packages/mcp-server/src/tools/index.ts packages/mcp-server/src/tools/*.ts` returned no policy schema signal.
  - **Green evidence:** `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/policy-decision.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/` passed (11/11), confirming MCP test harness stability.
  - **Refactor evidence:** current dispatcher grouping in `packages/mcp-server/src/tools/index.ts` is centralized and supports a single preflight hook insertion point.
- **Scouts:**
  - Stage gate authority exists -> verified in `docs/business-os/startup-loop/loop-spec.yaml` (`S5A`, `S5B`, `side_effects: guarded`) -> confirmed.
- **Planning validation:**
  - Checks run: policy and capability probes + MCP targeted test pass.
  - Validation artifacts written: none during planning.
  - Unexpected findings: root Jest required module-path ignore flags due `.open-next` duplicate modules.
- **What would make this >=90%:** complete first end-to-end gate test with one real `bos_*` read tool and stage context injection.
- **Rollout / rollback:**
  - Rollout: enforce strict fail-closed only for `bos_*`/`loop_*`; keep legacy compatibility mode with warning telemetry.
  - Rollback: keep schema and compatibility adapter, disable strict startup-loop enforcement toggle.
- **Documentation impact:** update `packages/mcp-server/README.md` with metadata schema and stage-context requirement.
- **Notes / references:** `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 3, 5, 9.

### TASK-02: Implement BOS read bridge tools (`bos_cards_list`, `bos_stage_doc_get`) via agent APIs
- **Type:** IMPLEMENT
- **Deliverable:** API-first BOS bridge tools and client helper in MCP with test coverage.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/bos.ts` + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-02`
- **Reviewer:** Business OS API owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-02-approval`
- **Measurement-Readiness:** Owner=BOS API owner; cadence=per release; tracking=tool invocation logs + `apps/business-os` route test status
- **Effort:** M
- **Affects:** `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/lib/bos-agent-client.ts`, `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/__tests__/bos-tools.test.ts`, `[readonly] apps/business-os/src/app/api/agent/cards/route.ts`, `[readonly] apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-06
- **Status:** Complete (2026-02-13)
- **Confidence:** 82%
  - Implementation: 84% - existing BOS routes and auth middleware are already tested and stable.
  - Approach: 82% - API-first read path matches ADR-01 and avoids audit/auth drift.
  - Impact: 82% - changes remain local to MCP with bounded dependency on existing agent routes.
- **Acceptance:**
  - `bos_cards_list` requires explicit context input (`business`, optional filters) and maps to `/api/agent/cards` without cross-business leakage.
  - `bos_stage_doc_get` requires (`business`, `cardId`, `stage`) and maps to `/api/agent/stage-docs/:cardId/:stage` including `entitySha`.
  - Outputs are shaped to startup-loop-safe fields (no raw BOS payload passthrough).
  - Errors map into standardized tool taxonomy (`AUTH_FAILED`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `INTERNAL_ERROR`).
  - Tool metadata binds read permissions to valid loop stages.
- **Validation contract:**
  - TC-01: Valid `bos_cards_list` request -> returns card list scoped to the requested business only.
  - TC-02: Valid `bos_stage_doc_get` request -> returns entity + `entitySha`.
  - TC-03: Missing/invalid auth to BOS API -> returns `AUTH_FAILED`.
  - TC-04: Missing stage doc -> returns `NOT_FOUND`.
  - TC-05: BOS transient 5xx -> returns retryable `UPSTREAM_UNAVAILABLE`.
  - TC-06: Response shape excludes non-whitelisted fields from BOS entities.
  - **Acceptance coverage:** TC-01/TC-02 cover scoped happy path; TC-03..TC-05 cover failure taxonomy; TC-06 covers output-shaping boundary.
  - **Validation type:** integration + contract.
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/bos-tools.test.ts`.
  - **Run/verify:** `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/bos-tools.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** no `bos_*` tool names exist in current MCP tool inventory (`rg -n "\"bos_" packages/mcp-server/src/tools` returned no matches).
  - **Green evidence:** `pnpm --filter @apps/business-os test -- src/app/api/agent/stage-docs/__tests__/route.test.ts` passed (8/8), confirming route contracts and `entitySha` behavior.
  - **Refactor evidence:** choose shared `bos-agent-client` helper to prevent duplicated auth/error mapping logic across future `bos_*` tools.
- **Scouts:**
  - BOS route concurrency contract -> verified by `TC-06` in `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts` -> confirmed.
- **Planning validation:**
  - Checks run: targeted route test + route contract grep checks.
  - Validation artifacts written: none during planning.
  - Unexpected findings: none beyond known root Jest duplicate-module warning.
- **What would make this >=90%:** complete one MCP test that uses a BOS mock server fixture for 401/404/409/500 branches.
- **Rollout / rollback:**
  - Rollout: enable read tools behind `bos_*` group flag, then expand to default-enabled.
  - Rollback: disable `bos_*` group while leaving metadata schema intact.
- **Documentation impact:** add `bos_*` API contract mapping in `packages/mcp-server/README.md`.
- **Notes / references:** `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 1, 4, 9.

### TASK-03: Implement loop read tools (`loop_manifest_status`, `loop_learning_ledger_status`, `loop_metrics_summary`)
- **Type:** IMPLEMENT
- **Deliverable:** startup-loop artifact status/freshness read tools with deterministic output contracts.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/loop.ts` + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-03`
- **Reviewer:** Startup-loop runtime owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-03-approval`
- **Measurement-Readiness:** Owner=startup-loop runtime owner; cadence=weekly + on-demand; tracking=`docs/business-os/startup-baselines/<BIZ>/runs/*` freshness outputs
- **Effort:** M
- **Affects:** `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/lib/loop-artifact-reader.ts`, `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/__tests__/loop-tools.test.ts`, `[readonly] scripts/src/startup-loop/manifest-update.ts`, `[readonly] scripts/src/startup-loop/learning-ledger.ts`, `[readonly] scripts/src/startup-loop/metrics-aggregate.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-07
- **Status:** Complete (2026-02-13)
- **Confidence:** 83%
  - Implementation: 85% - artifact contracts are explicit and already tested in scripts.
  - Approach: 83% - read-only status tooling preserves single-writer control-plane boundary.
  - Impact: 83% - bounded to file-reading adapters and response shaping in MCP.
- **Acceptance:**
  - `loop_manifest_status` reports manifest existence, stage completeness, and standardized freshness envelope.
  - `loop_learning_ledger_status` reports ledger existence, recent entry age, and standardized freshness envelope.
  - `loop_metrics_summary` reports aggregated KPI snapshot availability and standardized freshness envelope.
  - Freshness envelope is uniform across `loop_*` tools: `freshness.status`, `freshness.ageSeconds`, `freshness.thresholdSeconds`, `freshness.sourceTimestamp`.
  - Tools return `MISSING_ARTIFACT` when required artifacts are absent.
- **Validation contract:**
  - TC-01: Existing run dir with complete manifest -> `loop_manifest_status` returns `ok` with stage coverage.
  - TC-02: Missing manifest -> deterministic `MISSING_ARTIFACT`.
  - TC-03: Existing ledger with entries -> returns latest timestamp and count.
  - TC-04: Existing metrics -> returns summary fields plus full freshness envelope.
  - TC-05: Freshness beyond threshold -> returns `freshness.status=stale` with age/threshold values.
  - TC-06: All three `loop_*` tools emit identical freshness field names and types.
  - **Acceptance coverage:** TC-01..TC-04 cover happy paths; TC-02/TC-05 cover missing+stale conditions; TC-06 covers contract consistency.
  - **Validation type:** unit + fixture integration.
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/loop-tools.test.ts`.
  - **Run/verify:** `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/loop-tools.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** `rg -n "manifest_status|learning_ledger|metrics_summary" packages/mcp-server/src/tools` returned no matches.
  - **Green evidence:** `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/manifest-update.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/` passed (8/8), confirming source contracts.
  - **Refactor evidence:** consolidate artifact path discovery and freshness calculations in one `loop-artifact-reader` utility to avoid handler duplication.
- **Scouts:**
  - Single-writer invariant exists -> confirmed by top-of-file contract comments in `scripts/src/startup-loop/manifest-update.ts`.
- **Planning validation:**
  - Checks run: targeted startup-loop test + artifact contract grep.
  - Validation artifacts written: none during planning.
  - Unexpected findings: none.
- **What would make this >=90%:** fixture set that includes malformed artifacts and partial-run states to verify error taxonomy exhaustively.
- **Rollout / rollback:**
  - Rollout: release as read-only `loop_*` group with warn-only stale notices first.
  - Rollback: disable `loop_*` group without touching startup-loop scripts.
- **Documentation impact:** extend `packages/mcp-server/README.md` with `loop_*` tool contracts and freshness semantics.
- **Notes / references:** `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 1, 7, 10.

### TASK-04: Horizon checkpoint after initial policy + read tool wave
- **Type:** CHECKPOINT
- **Deliverable:** updated confidence and sequencing assessment in this plan.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-replan
- **Effort:** S
- **Affects:** `docs/plans/mcp-startup-loop-data-plane/plan.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Status:** Complete (2026-02-13)
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is procedural and localized to plan updates.
  - Approach: 95% - explicit horizon reassessment reduces compounding uncertainty.
  - Impact: 96% - no production code changes in this step.
- **Acceptance:**
  - Reassess TASK-05..TASK-08 confidence with evidence produced by TASK-01..TASK-03.
  - Confirm whether API-first assumption still holds after first integration tests.
  - Update this plan with any scope splits or risk changes before guarded-write work begins.
  - Exit criteria (must all be true):
    - policy gate tests pass for scoped strictness + legacy compatibility adapter;
    - BOS read tools are verified against stubbed `401/404/5xx` branches;
    - `loop_*` tools are validated against missing, partial, and complete fixture states;
    - strictness scope decision (`startup_loop_only` in phase 1) is reaffirmed in Decision Log.
- **Horizon assumptions to validate:**
  - Policy metadata preflight catches all missing-context and stage violations.
  - BOS read and loop read tool output shapes are adequate for loop-skill consumption.
  - No hidden contract drift at MCP/BOS or MCP/artifact seams.

### TASK-05: Finalize MCP->BOS identity/deployment model and exception policy
- **Type:** DECISION
- **Deliverable:** ADR note at `docs/plans/mcp-startup-loop-data-plane/adr-identity-and-access.md`.
- **Execution-Skill:** /lp-replan
- **Effort:** S
- **Affects:** `docs/plans/mcp-startup-loop-data-plane/plan.md`, `docs/plans/mcp-startup-loop-data-plane/adr-identity-and-access.md`, `[readonly] apps/business-os/src/lib/auth/middleware.ts`
- **Depends on:** TASK-04
- **Blocks:** TASK-06, TASK-07
- **Status:** Complete (2026-02-13)
- **Confidence:** 85%
  - Implementation: 88% - Option A is directly compatible with existing BOS API auth contracts.
  - Approach: 85% - phase split (Option A now, Option B later) preserves long-term extensibility without phase-1 complexity.
  - Impact: 85% - blast-radius and incident controls are explicit in ADR threat-model checklist.
- **Options:**
  - **Option A:** Service identity with scoped API key + business/stage claims enforced at MCP preflight and BOS routes.
  - **Option B:** Per-business key material resolved at runtime by MCP (key ring/secret lookup).
- **Recommendation:** Option A in phase 1, because it minimizes secret sprawl and keeps auditing centralized.
- **Decision rule:** default to Option A for phase 1 unless security governance explicitly requires per-business keys before rollout.
- **Acceptance:**
  - ADR committed with chosen model and explicit phase split (Option A now, Option B as future extension).
  - ADR includes a concrete threat-model checklist: token distribution path, token rotation cadence, blast radius if leaked, audit attribution, revocation runbook, scope claims model, secret storage boundary, redaction requirements, incident fallback mode, and key-expiry policy.
  - ADR clarifies `Business-OS-Integration: off` means no BOS code/schema changes for this workstream.
  - TASK-06 and TASK-07 dependency references updated to reflect finalized model.

### TASK-06: Add guarded BOS write tool (`bos_stage_doc_patch_guarded`) with conflict handling and stage gating
- **Type:** IMPLEMENT
- **Deliverable:** guarded write MCP tool with conflict/retry semantics and audit-safe error mapping.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `packages/mcp-server/src/tools/bos.ts` + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-06`
- **Reviewer:** Business OS API owner + platform infra owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-06-approval`
- **Measurement-Readiness:** Owner=PLAT infra; cadence=per release + weekly; tracking=conflict/error code counters in MCP logs
- **Effort:** M
- **Affects:** `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/lib/bos-agent-client.ts`, `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`, `[readonly] apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** TASK-07
- **Status:** Complete (2026-02-13)
- **Confidence:** 87%
  - Implementation: 87% - guarded-write path is fully implemented and verified by dedicated contract tests.
  - Approach: 87% - write boundary stays API-first and enforces stage + concurrency controls before BOS mutation.
  - Impact: 87% - regression surface is constrained and validated with conflict/no-side-effect assertions.
- **Acceptance:**
  - `bos_stage_doc_patch_guarded` requires `baseEntitySha`, `write_reason`, `current_stage`.
  - Writes are rejected outside allowed stages (`FORBIDDEN_STAGE`).
  - 409 conflict returns `CONFLICT_ENTITY_SHA`, includes latest `entitySha` when available, and requires caller re-read (no automatic merge/retry in MCP).
  - Audit payload redacts sensitive fields while preserving traceability (`auditTag`).
- **Validation contract:**
  - TC-01: Valid PATCH with fresh `baseEntitySha` in allowed stage -> success and new `entitySha`.
  - TC-02: Stale `baseEntitySha` -> `CONFLICT_ENTITY_SHA` with `re_read_required=true` and latest `entitySha` hint when available.
  - TC-03: Stage outside allowlist -> `FORBIDDEN_STAGE` with no side effects.
  - TC-04: Missing `write_reason` -> validation failure before network call.
  - TC-05: Upstream auth failure -> `AUTH_FAILED`.
  - TC-06: MCP does not auto-retry or auto-merge on `CONFLICT_ENTITY_SHA`.
  - **Acceptance coverage:** TC-01/TC-02/TC-06 cover concurrency semantics; TC-03/TC-04 cover guardrails; TC-05 covers auth path.
  - **Validation type:** integration + contract.
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`.
  - **Run/verify:** `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** prior to implementation, guarded-write-only contract tests were absent; this left stage/conflict semantics unverified at MCP boundary.
  - **Green evidence:** `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts` passed (6/6).
  - **Refactor evidence:** moved BOS HTTP/status mapping into `packages/mcp-server/src/lib/bos-agent-client.ts` and added handler-level preflight in `packages/mcp-server/src/tools/bos.ts`.
- **Scouts:**
  - Guarded mutation boundary exists -> confirmed in `docs/business-os/startup-loop/loop-spec.yaml` (`S5B side_effects: guarded`).
- **Planning validation:**
  - Checks run: BOS route test (8/8 pass) + taxonomy grep gap check.
  - Validation artifacts written: none during planning.
  - Unexpected findings: none.
- **What would make this >=90%:** complete one end-to-end rehearsal from read (`bos_stage_doc_get`) -> guarded write -> re-read with conflict retry scenario.
- **Rollout / rollback:**
  - Rollout: enable write tool in allowlisted environments only after TASK-05 decision closure.
  - Rollback: disable write tool registration while retaining read tools.
- **Documentation impact:** add guarded write semantics and retry guidance to `packages/mcp-server/README.md`.
- **Notes / references:** `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 3, 8, 9.

### TASK-07: Add startup-loop MCP integration suite with stable test harness wrapper + BOS API stub fixtures
- **Type:** IMPLEMENT
- **Deliverable:** targeted startup-loop MCP integration test suite with fixture matrix, reusable Jest wrapper/config, and BOS API stub fixture library.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-07`
- **Reviewer:** Platform QA owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-07-approval`
- **Measurement-Readiness:** Owner=Platform QA; cadence=every change to `bos_*` or `loop_*`; tracking=targeted governed test run history
- **Effort:** M
- **Affects:** `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `packages/mcp-server/src/__tests__/fixtures/startup-loop/`, `packages/mcp-server/src/__tests__/fixtures/bos-api/`, `packages/mcp-server/jest.startup-loop.config.cjs` (or equivalent wrapper script), `packages/mcp-server/src/tools/index.ts`, `[readonly] scripts/src/startup-loop/__tests__/manifest-update.test.ts`, `[readonly] apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts`
- **Depends on:** TASK-03, TASK-06, TASK-05
- **Blocks:** TASK-08
- **Status:** Complete (2026-02-13)
- **Confidence:** 86%
  - Implementation: 87% - integration suite executes reliably via dedicated wrapper config and fixture libraries.
  - Approach: 86% - startup-loop integration validation now reflects actual policy/error contracts end-to-end.
  - Impact: 86% - scope remains bounded to MCP tests/config and does not touch production runtime paths.
- **Acceptance:**
  - Integration suite covers read, guarded write, conflict, and stage-forbidden paths.
  - Fixture matrix includes missing/stale artifact cases for `loop_*` tools.
  - BOS API stub fixture library includes deterministic `401/404/409/500` branches.
  - Tests run via one stable wrapper/config (no repeated ad hoc ignore flags in each command).
- **Validation contract:**
  - TC-01: `bos_cards_list` and `bos_stage_doc_get` pass with fixture-backed API stubs.
  - TC-02: guarded write success path updates `entitySha`.
  - TC-03: guarded write stale-sha path returns `CONFLICT_ENTITY_SHA`.
  - TC-04: stage-forbidden write returns `FORBIDDEN_STAGE`.
  - TC-05: `loop_manifest_status` missing artifact returns `MISSING_ARTIFACT`.
  - TC-06: harness wrapper/config injects required path ignores and executes cleanly for startup-loop MCP tests.
  - **Acceptance coverage:** TC-01..TC-05 cover tool behavior; TC-06 covers harness stability contract.
  - **Validation type:** integration + contract.
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`.
  - **Run/verify:** `CI=true pnpm --filter @acme/mcp-server test:startup-loop`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** first root MCP test attempt failed from `.open-next` duplication, proving harness fragility if ignore patterns are omitted.
  - **Green evidence:** `CI=true pnpm --filter @acme/mcp-server test:startup-loop` passed (6/6) with dedicated config.
  - **Refactor evidence:** replaced repeated one-off ignore flags with a dedicated startup-loop Jest wrapper/config and package script.
- **Planning validation:**
  - Checks run:
    - `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/policy-decision.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/` (pass)
    - `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/manifest-update.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/` (pass)
    - `pnpm --filter @apps/business-os test -- src/app/api/agent/stage-docs/__tests__/route.test.ts` (pass)
  - Validation artifacts written: none during planning.
  - Unexpected findings: root-level Jest has duplicate manual mock noise due generated `.open-next` paths.
- **What would make this >=90%:** completed on 2026-02-13 (five consecutive governed `test:startup-loop` passes, including one CI-mode run).
- **Rollout / rollback:**
  - Rollout: add suite to targeted validation gate for `packages/mcp-server` changes.
  - Rollback: keep tests runnable manually if CI integration causes transient instability.
- **Documentation impact:** update `docs/testing-policy.md` with startup-loop MCP test invocation guidance.
- **Notes / references:** `docs/testing-policy.md`, `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 2, 11.

### TASK-08: Add drift/freshness preflight checks + documentation/runbook updates
- **Type:** IMPLEMENT
- **Deliverable:** drift-preflight check + updated MCP/startup-loop operational docs.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `scripts/src/startup-loop/mcp-preflight.ts` + docs updates + `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-08`
- **Reviewer:** Platform operations owner
- **Approval-Evidence:** `docs/plans/mcp-startup-loop-data-plane/build-validation.md#task-08-approval`
- **Measurement-Readiness:** Owner=Platform ops; cadence=weekly and before release; tracking=preflight report output + stale-warning counts
- **Effort:** M
- **Affects:** `scripts/src/startup-loop/mcp-preflight.ts`, `scripts/src/startup-loop/mcp-preflight-config.ts`, `packages/mcp-server/README.md`, `docs/testing-policy.md`, `docs/plans/mcp-startup-loop-data-plane/plan.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Status:** Complete (2026-02-13)
- **Confidence:** 85%
  - Implementation: 86% - profile-aware preflight and tests are implemented with deterministic outputs.
  - Approach: 85% - operational drift checks are now encoded in one script instead of doc-only guidance.
  - Impact: 85% - changes are low-risk and validated across local/ci profile paths.
- **Acceptance:**
  - Preflight supports `local`, `ci`, and `deployed` runtime profiles with profile-specific config resolution.
  - Preflight reports missing MCP registration, tool metadata completeness, and stale artifact warnings.
  - MCP README and testing policy document startup-loop tool groups and governed test commands.
  - Local profile checks `.claude/settings.json`; CI/deployed profiles use env/service config and do not hard-fail on missing local config file.
- **Validation contract:**
  - TC-01: Local profile + missing `.claude` MCP registration -> actionable preflight failure.
  - TC-02: CI/deployed profile with env/service config -> preflight evaluates without local settings dependency.
  - TC-03: Complete registration + metadata -> preflight passes.
  - TC-04: Artifact freshness older than threshold -> preflight warning emitted.
  - TC-05: Documentation command snippets execute successfully in dry-run mode.
  - **Acceptance coverage:** TC-01/TC-02/TC-03 cover profile-aware drift detection; TC-04 covers freshness; TC-05 covers docs operability.
  - **Validation type:** script integration + docs verification.
  - **Validation location/evidence:** `scripts/src/startup-loop/mcp-preflight.ts` tests and command transcript in `docs/plans/mcp-startup-loop-data-plane/build-validation.md`.
  - **Run/verify:** `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** `rg -n "mcpServers" .claude/settings.json` returned no output while README documents `mcpServers` config, indicating local-profile drift risk.
  - **Green evidence:** README includes explicit MCP config example and build/typecheck commands (`packages/mcp-server/README.md`).
  - **Refactor evidence:** centralize preflight checks instead of scattered docs-only expectations.
- **Planning validation:**
  - Checks run: config drift probe + README inspection.
  - Validation artifacts written: none during planning.
  - Unexpected findings: config/documentation drift already present in current workspace.
- **What would make this >=90%:** preflight wiring into `runDiagnosisPipeline` is complete; remaining step is zero false positives over one full week of operator runs.
- **Rollout / rollback:**
  - Rollout: run preflight in advisory mode first, then enforce before guarded-write release.
  - Rollback: keep preflight as manual advisory if enforcement causes operational blocking.
- **Documentation impact:** update `packages/mcp-server/README.md`, `docs/testing-policy.md`, and startup-loop operator notes.
- **Notes / references:** `docs/plans/mcp-startup-loop-data-plane/fact-find.md` sections 11 and 15.

## Risks & Mitigations

- Stage-aware policy bugs could block legitimate workflows.
  - Mitigation: fail-closed metadata tests + checkpoint before guarded writes.
- Identity model drift could create auth outages or audit gaps.
  - Mitigation: explicit TASK-05 decision gate + ADR before write rollout.
- Tool sprawl across legacy and startup-loop domains could confuse operators.
  - Mitigation: taxonomy (`bos_*`, `loop_*`, `measure_*`, `legacy_*`) and preflight checks.
- Filesystem-dependent `loop_*` tools may fail in deployed runtimes without artifact mounts.
  - Mitigation: profile-aware preflight checks and deterministic disablement/error path for missing artifact roots.
- Test instability from generated artifacts (`.open-next`) could hide regressions.
  - Mitigation: enforce dedicated startup-loop Jest wrapper config (`packages/mcp-server/jest.startup-loop.config.cjs`) instead of ad hoc ignore flags.

## Observability

- Logging:
  - structured tool invocation logs with `auditTag`, `business`, `current_stage`, and redacted sensitive fields.
- Metrics:
  - counts by tool group (`bos_*`, `loop_*`), error code, conflict retries, stale artifact warnings.
- Alerts/Dashboards:
  - warn when stale-artifact rate exceeds threshold or guarded-write failure rate spikes.

## Contract Artifacts (Phase-1 Baseline)

### Stage Capability Coverage Map (Phase 1)

| Stage band | Required capability class | Phase-1 tool coverage | Gap status |
|---|---|---|---|
| S0-S1 | BOS context reads (business/card/stage docs) | `bos_cards_list`, `bos_stage_doc_get` | partial (no stage-doc list yet) |
| S2-S4 | Run artifact health/freshness reads | `loop_manifest_status`, `loop_learning_ledger_status`, `loop_metrics_summary` | partial (no run index tool yet) |
| S5B | Guarded stage-doc mutation | `bos_stage_doc_patch_guarded` | implemented (TASK-06 complete) |
| S6-S10 | Extended read models + KPI synthesis | foundational primitives only | deferred (coverage expansion wave) |

### Tool Classification and Enforcement Scope

| Tool group | Scope in this wave | Enforcement mode |
|---|---|---|
| `bos_*` | new startup-loop tools | strict metadata + stage gating |
| `loop_*` | new startup-loop tools | strict metadata + stage gating |
| `measure_*` | not implemented in this wave | n/a |
| `legacy_*` (existing families) | retained for compatibility | compatibility adapter + warning telemetry |

### Error Envelope Contract

```ts
type McpToolError = {
  code:
    | "AUTH_FAILED"
    | "FORBIDDEN_STAGE"
    | "NOT_FOUND"
    | "CONFLICT_ENTITY_SHA"
    | "CONTRACT_MISMATCH"
    | "MISSING_ARTIFACT"
    | "UPSTREAM_UNAVAILABLE"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
  auditTag?: string;
};
```

### Runtime and Access Assumptions

- MCP runtime must be able to call BOS agent APIs over configured network path.
- `loop_*` tools require artifact-root accessibility (`STARTUP_LOOP_ARTIFACT_ROOT` or equivalent profile config).
- If artifact root is unavailable in deployed profile, `loop_*` tools return deterministic unavailability errors and do not attempt fallback writes.

## Planning Validation Transcript

- `pnpm --filter @acme/mcp-server typecheck` -> pass
- `pnpm --filter @acme/mcp-server lint` -> pass (warnings only; no errors)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts` -> pass (8/8)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts` -> pass (6/6)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/loop-tools.test.ts` -> pass (6/6)
- `CI=true pnpm --filter @acme/mcp-server test:startup-loop` -> pass (startup-loop integration suite, 6/6)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/mcp-preflight.test.ts` -> pass (4/4)
- `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` -> pass
- `pnpm exec eslint scripts/src/startup-loop/mcp-preflight.ts scripts/src/startup-loop/mcp-preflight-config.ts scripts/src/startup-loop/__tests__/mcp-preflight.test.ts` -> pass (warning only; no errors)
- `MCP_STARTUP_LOOP_SERVER_REGISTERED=true pnpm preflight:mcp-startup-loop -- --profile ci --json` -> pass (`ok: true`, warnings only)

## Acceptance Criteria (overall)

- [x] Startup-loop MCP tool groups (`bos_*`, `loop_*`) exist with explicit policy metadata.
- [x] Guarded write path enforces stage allowlist + `entitySha` conflict semantics.
- [x] Error taxonomy and retry behaviors are consistent and tested.
- [x] Drift/freshness preflight is operational and documented.
- [x] Targeted governed validation passes for new MCP startup-loop suites.

## Decision Log

- 2026-02-13: Chose metadata-gated, API-first startup-loop data-plane approach over implicit-policy extension.
- 2026-02-13: Scoped strict enforcement to `bos_*`/`loop_*` in phase 1; legacy tools remain compatibility-scoped with warning telemetry.
- 2026-02-13: Set phase-1 identity default to service identity (Option A) unless security governance overrides.
- 2026-02-13: Inserted CHECKPOINT after first three IMPLEMENT tasks to cap horizon risk before guarded writes.
- 2026-02-13: Kept `Business-OS-Integration: off` for planning workflow tracking while still planning BOS API client integration.
- 2026-02-13: Added explicit rollout gates: no guarded-write rollout before TASK-05/TASK-06 and no CI gating before TASK-07 stabilization.
- 2026-02-13: Completed TASK-01 implementation and validation (policy schema, scoped strict enforcement, legacy compatibility adapter, targeted tests).
- 2026-02-13: Completed TASK-02 implementation and validation (`bos_cards_list`, `bos_stage_doc_get`, BOS API client, strict metadata registration, targeted tests).
- 2026-02-13: Completed TASK-03 implementation and validation (`loop_manifest_status`, `loop_learning_ledger_status`, `loop_metrics_summary`, artifact-reader helper, fixture-based tests).
- 2026-02-13: Completed TASK-04 checkpoint and reaffirmed API-first + scoped strictness approach before guarded-write rollout.
- 2026-02-13: Completed TASK-05 decision with ADR (`docs/plans/mcp-startup-loop-data-plane/adr-identity-and-access.md`): Option A service identity for phase 1, Option B deferred.
- 2026-02-13: Completed TASK-06 implementation and validation (`bos_stage_doc_patch_guarded` guarded-write tests, conflict/no-retry semantics, stage gate enforcement).
- 2026-02-13: Completed TASK-07 implementation and validation (startup-loop integration suite, fixture libraries, dedicated Jest wrapper config).
- 2026-02-13: Completed TASK-08 implementation and validation (profile-aware MCP preflight, policy/docs updates, CI profile preflight command verification).
- 2026-02-13: Added post-plan hardening evidence: five consecutive startup-loop integration suite passes (one CI-mode run) and advisory preflight integration in S10 diagnosis pipeline.
