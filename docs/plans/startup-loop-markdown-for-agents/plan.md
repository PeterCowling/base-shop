---
Type: Plan
Status: Complete
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-14
Feature-Slug: startup-loop-markdown-for-agents
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Startup Loop Markdown for Agents Plan

## Summary
This plan adds a deterministic markdown-ingestion path for startup-loop standing refresh work, using Cloudflare Markdown for Agents as the primary adapter. The implementation keeps current wave-2 constraints intact: read-first behavior, guarded refresh lifecycle, artifact-backed replayability, and provenance envelopes. Work is split into one decision gate plus three implementation tasks so the riskiest assumptions (fallback policy and domain eligibility) are resolved before code integration. Validation is anchored on existing startup-loop integration tests and Cloudflare adapter contract tests, then extended to cover markdown-specific behavior and artifact persistence.

## Goals
- Add a Cloudflare markdown adapter contract in `@acme/mcp-cloudflare`.
- Persist startup-loop markdown source artifacts with quality/provenance metadata.
- Wire source artifacts into S10 pack evidence and standing refresh operator prompts.

## Non-goals
- Full multi-provider markdown extraction in this wave.
- Replacing existing S2/S6 deep-research prompt workflows.
- Replacing app-level `llms.txt` generation paths.

## Constraints & Assumptions
- Constraints:
  - Startup-loop mutation boundaries remain enforced (guarded writes only via refresh lifecycle).
  - Cloudflare markdown support is only guaranteed on Cloudflare-served domains with Content Signals/Controls enabled.
  - New outputs must remain deterministic and replayable under startup-loop run artifacts.
- Assumptions:
  - Initial source catalog can be per-business allowlist config.
  - Fallback to non-Cloudflare extraction can be deferred if policy is explicit and observable.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-markdown-for-agents/fact-find.md`
- Key findings:
  - Existing refresh queue/status APIs are already suitable as collector control-plane.
  - `@acme/mcp-cloudflare` has reusable normalization/testing patterns but currently no raw-markdown fetch path.
  - Delivery-Readiness (78%) and Approach (79%) require explicit policy/operability tasks to raise confidence.

## Existing System Notes
- Key modules/files:
  - `packages/mcp-cloudflare/src/client.ts` - Cloudflare API client abstraction currently JSON-envelope oriented.
  - `packages/mcp-cloudflare/src/tools/analytics.ts` - normalization and contract test pattern to follow.
  - `packages/mcp-server/src/tools/loop.ts` - startup-loop refresh, packet, pack, anomaly tooling and policy metadata.
  - `packages/mcp-server/src/lib/wave2-contracts.ts` - shared envelope/provenance contract.
  - `docs/business-os/workflow-prompts/_templates/monthly-market-pulse-prompt.md` - standing refresh downstream consumer.
- Patterns to follow:
  - Wave-2 contract-first envelope pattern and registry checks.
  - Idempotent refresh request lifecycle and guarded transitions.

## Proposed Approach
- Option A: Cloudflare-first adapter, persist source artifacts, explicit deferred fallback policy.
  - Trade-offs: fastest safe delivery on known infrastructure; non-Cloudflare domains are unsupported until next increment.
- Option B: Cloudflare + immediate AI Gateway Browser Rendering fallback in same wave.
  - Trade-offs: broader coverage, but larger blast radius and lower confidence in a single implementation cycle.
- Chosen: Option A, because it aligns with current wave-2 staged rollout discipline and keeps this increment testable and reversible.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock markdown adapter policy and delivery guardrails | 85% | S | Complete (2026-02-13) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add Cloudflare markdown adapter + contract tests | 84% | M | Complete (2026-02-14) | TASK-01 (complete) | TASK-03 |
| TASK-03 | IMPLEMENT | Add startup-loop markdown collector tools + persisted source artifacts | 82% | M | Complete (2026-02-14) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Wire pack/prompt/preflight integration for markdown source operations | 81% | M | Complete (2026-02-14) | TASK-03 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Policy/decision baseline |
| 2 | TASK-02 | TASK-01 | Adapter contract implementation |
| 3 | TASK-03 | TASK-02 | Loop collector and artifact persistence |
| 4 | TASK-04 | TASK-03 | Operator integration and readiness hardening |

**Max parallelism:** 1 | **Critical path:** 4 waves | **Total tasks:** 4

## Tasks

### TASK-01: Lock markdown adapter policy and delivery guardrails
- **Type:** DECISION
- **Deliverable:** Policy ADR at `docs/plans/startup-loop-markdown-for-agents/decisions/markdown-adapter-policy.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `docs/plans/startup-loop-markdown-for-agents/decisions/markdown-adapter-policy.md`, `[readonly] docs/plans/startup-loop-markdown-for-agents/fact-find.md`, `[readonly] packages/mcp-server/src/tools/loop.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Status:** Complete (2026-02-13)
- **Confidence:** 85%
  - Implementation: 90% - Decision inputs are already documented with concrete repo and external evidence.
  - Approach: 85% - Cloudflare-first phased approach matches current wave-2 strategy and reduces risk.
  - Impact: 85% - Scope of policy change and downstream implications are bounded and known.
- **Options:**
  - **Option A:** Cloudflare-first adapter now; non-Cloudflare fallback explicitly deferred.
  - **Option B:** Cloudflare + AI Gateway fallback in same delivery wave.
- **Recommendation:** Option A because it keeps this wave reversible and keeps confidence above build threshold.
- **Acceptance:**
  - ADR records chosen option, rejected option, and promotion criteria for fallback support.
  - ADR defines source allowlist contract and error semantics for unsupported domains.
  - ADR sets operational owner and weekly review cadence for source freshness/coverage.
- **Notes / references:**
  - `docs/plans/startup-loop-markdown-for-agents/fact-find.md`
  - `docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md`

### TASK-02: Add Cloudflare markdown adapter + contract tests
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-14)
- **Deliverable:** New markdown adapter tool surface in `@acme/mcp-cloudflare` with deterministic contract tests
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/mcp-cloudflare/src/client.ts`, `packages/mcp-cloudflare/src/tools/index.ts`, `packages/mcp-cloudflare/src/tools/content.ts`, `packages/mcp-cloudflare/src/tools/content.contract.test.ts`, `[readonly] packages/mcp-cloudflare/src/tools/analytics.ts`
- **Depends on:** TASK-01 (complete)
- **Blocks:** TASK-03
- **Confidence:** 84%
  - Implementation: 86% - Existing analytics adapter patterns and client scaffolding reduce unknowns.
  - Approach: 84% - Contract-first adapter aligns with wave-2 architecture and avoids bypassing existing tool registries.
  - Impact: 84% - Blast radius is limited to mcp-cloudflare adapter and tests.
- **Acceptance:**
  - New markdown adapter tool exists and is registered in `toolDefinitions`/dispatcher.
  - Adapter supports markdown retrieval with structured metadata and explicit unsupported/disabled errors.
  - Contract tests cover success and fallback/error behaviors deterministically.
- **Validation contract:**
  - TC-01: Cloudflare markdown success response -> adapter returns normalized markdown payload with deterministic fields.
  - TC-02: Disabled/unavailable markdown feature -> adapter returns structured error classification (not generic internal error).
  - TC-03: Unexpected non-markdown/empty response -> adapter flags quality issue and fails contract.
  - Acceptance coverage: TC-01 (acceptance 1), TC-02 (acceptance 2), TC-03 (acceptance 3).
  - Validation type: unit/contract
  - Validation location/evidence: `packages/mcp-cloudflare/src/tools/content.contract.test.ts`
  - Run/verify: `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-cloudflare/src/tools/content.contract.test.ts`
  - Cross-boundary coverage: adapter contract fields remain compatible with startup-loop provenance envelope consumers.
- **Execution plan:**
  - Red -> write failing contract tests for markdown success/error semantics.
  - Green -> implement adapter and registration changes to satisfy tests.
  - Refactor -> align helper naming/typing with existing analytics adapter conventions.
- **Scouts:**
  - Cloudflare markdown invocation contract (`Accept: text/markdown` and endpoint behavior) -> official docs lookup -> confirmed.
- **Planning validation:**
  - Checks run: `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-cloudflare/src/tools/analytics.contract.test.ts` -> PASS (3/3).
  - Validation artifacts written: none during planning.
  - Unexpected findings: duplicate manual mock warnings from `.open-next` artifacts; non-blocking for target test path.
- **What would make this >=90%:**
  - Add one integration smoke test against a controlled markdown-enabled endpoint fixture and verify raw-text path behavior.
- **Rollout / rollback:**
  - Rollout: release behind new tool name without touching existing analytics tools.
  - Rollback: unregister the new tool and retain existing client behavior.
- **Documentation impact:**
  - Update `packages/mcp-server/README.md` tool catalog references if mcp-cloudflare tool exposure is documented there.
- **Notes / references:**
  - `packages/mcp-cloudflare/src/tools/analytics.ts`
  - `packages/mcp-cloudflare/src/tools/analytics.contract.test.ts`

### TASK-03: Add startup-loop markdown collector tools + persisted source artifacts
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-14)
- **Deliverable:** Startup-loop tooling to fetch/store markdown sources with provenance envelope and artifact paths
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/lib/loop-artifact-reader.ts`, `packages/mcp-server/src/lib/wave2-contracts.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `packages/mcp-server/src/__tests__/fixtures/startup-loop/`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 82%
  - Implementation: 84% - Existing loop tool framework and artifact writer helpers are directly reusable.
  - Approach: 82% - Persist-first collector design preserves deterministic startup-loop behavior.
  - Impact: 82% - Touches core loop tool module and tests, but within known boundaries.
- **Acceptance:**
  - New loop markdown collector tool(s) are policy-registered and stage-gated.
  - Collector writes deterministic source artifacts under run paths with provenance and quality metadata.
  - Integration tests validate fetch->persist->status/evidence paths and failure classifications.
- **Validation contract:**
  - TC-01: Collector success path persists markdown artifact + metadata envelope at deterministic path.
  - TC-02: Unsupported/disabled source returns structured tool error without writing partial artifacts.
  - TC-03: Collector output references are visible in loop status/evidence payloads for downstream consumption.
  - Acceptance coverage: TC-01 (acceptance 2), TC-02 (acceptance 3), TC-03 (acceptance 1 and 3).
  - Validation type: integration/contract
  - Validation location/evidence: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
  - Run/verify: `pnpm --filter @acme/mcp-server test:startup-loop`
  - Cross-boundary coverage: validates compatibility between mcp-server loop tool outputs and mcp-cloudflare markdown adapter contract.
- **Execution plan:**
  - Red -> extend integration suite with failing collector scenarios and artifact assertions.
  - Green -> implement loop tool handlers and artifact persistence wiring.
  - Refactor -> simplify helper boundaries and ensure envelope generation is centralized.
- **Scouts:**
  - Existing startup-loop integration harness can exercise new tool contracts -> targeted startup-loop suite run -> confirmed.
  - Provenance/quality envelope support for non-metric records -> schema review in `wave2-contracts.ts` -> partially confirmed; may need additive schema.
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/mcp-server test:startup-loop` -> PASS (10/10).
  - Validation artifacts written: none during planning.
  - Unexpected findings: none.
- **What would make this >=90%:**
  - Add fixture-backed test for a real markdown corpus with size/quality edge cases and persistence replay checks.
- **Rollout / rollback:**
  - Rollout: introduce collector tools with no change to existing packet/pack behavior until TASK-04 wiring.
  - Rollback: disable new collector tool names and ignore new artifact folders.
- **Documentation impact:**
  - Update startup-loop operator docs with markdown collector artifact paths and error interpretation.
- **Notes / references:**
  - `packages/mcp-server/src/tools/loop.ts`
  - `packages/mcp-server/src/lib/wave2-contracts.ts`

### TASK-04: Wire pack/prompt/preflight integration for markdown source operations
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-14)
- **Deliverable:** Operational integration for pack evidence, prompt consumption, and preflight policy checks
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `packages/mcp-server/src/tools/loop.ts`, `scripts/src/startup-loop/mcp-preflight.ts`, `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`, `docs/business-os/workflow-prompts/_templates/monthly-market-pulse-prompt.md`, `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 81%
  - Implementation: 82% - Existing preflight and pack patterns are explicit and test-backed.
  - Approach: 81% - Integrating ops docs and preflight with code changes improves delivery readiness.
  - Impact: 81% - Changes span code + runbook but remain within startup-loop subsystem.
- **Acceptance:**
  - Weekly S10 pack output references markdown source artifacts where available.
  - Preflight checks detect missing metadata wiring for new collector tools.
  - Standing refresh prompt/workflow docs explicitly consume persisted source artifact inputs.
- **Validation contract:**
  - TC-01: Pack build output includes markdown source evidence refs after collector success.
  - TC-02: Preflight fails when new collector tools are missing policy/registry metadata.
  - TC-03: Prompt/workflow docs include source artifact path contract and render cleanly.
  - Acceptance coverage: TC-01 (acceptance 1), TC-02 (acceptance 2), TC-03 (acceptance 3).
  - Validation type: integration/unit + docs render check
  - Validation location/evidence: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`, updated docs files
  - Run/verify:
    - `pnpm --filter @acme/mcp-server test:startup-loop`
    - `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`
    - `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md`
  - Cross-boundary coverage: ensures tool wiring, operator prompt contract, and preflight governance stay aligned.
- **Execution plan:**
  - Red -> add failing assertions for pack evidence/preflight/doc contract.
  - Green -> implement integration hooks and docs updates.
  - Refactor -> tighten naming and reduce duplicated contract text across docs/tests.
- **Scouts:**
  - Preflight currently validates loop/bos tool metadata patterns and can be extended for new collectors -> source read confirmed.
- **Planning validation:**
  - Checks run: `pnpm --filter @acme/mcp-server test:startup-loop` -> PASS (10/10).
  - Validation artifacts written: none during planning.
  - Unexpected findings: none.
- **What would make this >=90%:**
  - Add CI smoke validation that ensures docs and pack evidence schema remain synchronized after each collector change.
- **Rollout / rollback:**
  - Rollout: enable docs+preflight checks alongside collector release in same merge window.
  - Rollback: remove source-evidence references and disable new preflight assertions if rollout must pause.
- **Documentation impact:**
  - Update `docs/business-os/startup-loop-workflow.user.md` and standing refresh prompt template paths.
- **Notes / references:**
  - `scripts/src/startup-loop/mcp-preflight.ts`
  - `docs/business-os/workflow-prompts/_templates/monthly-market-pulse-prompt.md`

## Risks & Mitigations
- Cloudflare-only support may leave some sources uncovered.
  - Mitigation: explicit unsupported-domain error + documented fallback promotion trigger in ADR.
- Artifact quality drift (empty or noisy markdown) could reduce decision quality.
  - Mitigation: quality thresholds and `qualityNotes` enforcement in collector outputs.
- Governance drift between tool registration and policy metadata.
  - Mitigation: extend preflight and contract tests to fail fast on missing wiring.

## Observability
- Logging: collector fetch outcome, classification (`ok`, `unsupported`, `disabled`, `failed`), artifact write path.
- Metrics: source coverage %, freshness lag, collector failure rate by business/run.
- Alerts/Dashboards: weekly S10 readiness board tracks stale/missing source artifacts.

## Acceptance Criteria (overall)
- [x] Cloudflare markdown adapter exists with deterministic contract tests.
- [x] Startup-loop collector persists markdown source artifacts with provenance/quality envelope.
- [x] S10 pack, preflight, and standing refresh docs consume the new source artifact contract.
- [x] Targeted startup-loop and adapter validation suites pass.

## Decision Log
- 2026-02-13: Chose Cloudflare-first phased adapter (defer non-Cloudflare fallback) to preserve deterministic scope and confidence.
- 2026-02-13: Kept implementation chain at three IMPLEMENT tasks (no checkpoint required under horizon rule for <=3 IMPLEMENT tasks).
- 2026-02-14: Completed TASK-02 through TASK-04 with passing adapter, startup-loop integration, preflight, and docs-render validation.
