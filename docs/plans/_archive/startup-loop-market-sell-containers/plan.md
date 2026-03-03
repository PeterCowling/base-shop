---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-21
Last-reviewed: 2026-02-21
Last-updated: 2026-02-21
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-market-sell-containers
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop MARKET/SELL Containerization Plan

## Summary
This plan replaces disparate marketing/sales stage IDs (`S2`, `S2B`, `S3B`, `S6B`) with a consolidated two-container model: `MARKET` and `SELL`. Per your decision, this is a hard cutover with **no legacy stage IDs kept as aliases**.

The implementation is mixed-track because it spans runtime code (gates, workers, MCP policy), contract docs (loop spec, artifact/capability schemas), and operator-facing workflow surfaces. The critical invariant is preserved: strategy design and spend activation remain separately gated within SELL.

## Active tasks
- None. All planned tasks are complete.

## Goals
- Replace `S2/S2B/S3B/S6B` with a clean `MARKET` + `SELL` stage family.
- Preserve current control semantics:
  - hard messaging gate before leaving offer design,
  - hard strategy-eligibility gate before channel design,
  - hard spend-activation gate before paid commitment,
  - S3B-equivalent adjacent research remains conditional/non-blocking.
- Remove legacy marketing/sales stage IDs from runtime-addressable contracts.
- Keep S4 join barrier deterministic after cutover.

## Non-goals
- Reworking pre-ASSESSMENT/MEASURE stage families.
- Rewriting DO/S9B/S10 process logic outside necessary stage-reference updates.
- Introducing compatibility aliases for retired marketing/sales stage IDs.

## Constraints & Assumptions
- Constraints:
  - `docs/business-os/startup-loop/loop-spec.yaml` remains source of truth.
  - Single-writer manifest/state ownership remains unchanged.
  - No legacy IDs will be retained (`S2`, `S2B`, `S3B`, `S6B`) after cutover.
- Assumptions:
  - All active consumers can be migrated in one coordinated release.
  - Generated stage views (`docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`) are regenerated in the same change-set as dictionary/spec updates.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-market-sell-containers/fact-find.md`
- Key findings used:
  - Existing contract already separates proposition-design and channel-activation responsibilities.
  - Legacy S6B gate split already defined two independent hard gates; these are preserved in SELL strategy/activation gates.
  - Stage-ID drift exists in MCP tooling and contract-lint surfaces, so cutover must include parity hardening.
  - Hard cutover is feasible but requires synchronized updates across docs, skills, scripts, MCP tools, and fixtures.

## Proposed Approach
- Option A: Single `M&S` container.
  - Rejected: collapses decision checkpoint between offer-definition and route-to-demand execution.
- Option B: `MARKET` + `SELL` containers with legacy aliases.
  - Rejected: conflicts with explicit user instruction to not keep legacy IDs.
- Option C (chosen): `MARKET` + `SELL` hard cutover, no legacy aliases.
  - Chosen: clear operating boundary, preserves gating semantics, and fully removes old stage vocabulary.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - Reason: `plan-only` mode.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rewrite canonical stage model to MARKET/SELL in loop-spec + operator dictionary + generated views | 85% | M | Done | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-07 |
| TASK-02 | IMPLEMENT | Re-anchor startup-loop orchestration/gates and skill contracts to MARKET/SELL IDs | 85% | M | Done | TASK-01 | TASK-03, TASK-05, TASK-07, TASK-09 |
| TASK-03 | IMPLEMENT | Hard-cut runtime code paths (gates/workers/detector/resolver) to new stage IDs | 80% | L | Done | TASK-01, TASK-02, TASK-09 | TASK-04, TASK-06 |
| TASK-04 | IMPLEMENT | Cut over MCP loop/bos policy stage allowlists and stage validation comments/contracts | 85% | M | Done | TASK-01, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Update contract docs and capability anchors to MARKET/SELL with no legacy IDs | 85% | M | Done | TASK-01, TASK-02 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Update tests/fixtures/lint rules for new IDs and enforce no-legacy policy | 85% | M | Done | TASK-03, TASK-04, TASK-05 | TASK-08 |
| TASK-07 | IMPLEMENT | Update operator workflow/prompt index and stage-facing docs to new vocabulary | 85% | M | Done | TASK-01, TASK-02, TASK-05 | TASK-08 |
| TASK-08 | CHECKPOINT | Horizon checkpoint: re-sequence and validate pre-build readiness after cutover updates | 95% | S | Done | TASK-06, TASK-07 | - |
| TASK-09 | INVESTIGATE | Build runtime stage-ID migration matrix + compatibility guardrails for TASK-03 cutover | 85% | S | Done | TASK-02 | TASK-03 |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Canonical contract baseline |
| 2 | TASK-02 | TASK-01 | Gate/orchestration doc cutover |
| 3 | TASK-05, TASK-09 | TASK-01, TASK-02 | Contract-anchor cutover + runtime migration investigate precursor |
| 4 | TASK-03 | TASK-01, TASK-02, TASK-09 | Runtime path cutover after precursor evidence |
| 5 | TASK-04 | TASK-01, TASK-03 | MCP policy alignment after runtime IDs settle |
| 6 | TASK-06, TASK-07 | TASK-03, TASK-04, TASK-05 | Validation + operator-facing sync |
| 7 | TASK-08 | TASK-06, TASK-07 | Replan checkpoint before build |

## Tasks

### TASK-01: Rewrite canonical stage model to MARKET/SELL in loop-spec + operator dictionary + generated views
- **Type:** IMPLEMENT
- **Deliverable:** Stage model rewrite in canonical contracts and generated operator map/table
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-07
- **Confidence:** 85%
  - Implementation: 85% - canonical files and generated outputs are known and bounded.
  - Approach: 90% - container-stage pattern already exists (`ASSESSMENT`, `DO`).
  - Impact: 85% - establishes single source of truth for downstream migration.
- **Acceptance:**
  - `loop-spec.yaml` replaces `S2/S2B/S3B/S6B` with `MARKET` + `SELL` and explicit sub-stage IDs.
  - Ordering/fan-out/fan-in semantics are preserved.
  - Join barrier input contract remains deterministic and complete.
  - Stage dictionary and generated artifacts are fully aligned to the new IDs.
  - No legacy marketing/sales IDs remain in canonical stage dictionaries.
- **Validation contract (TC-01):**
  - TC-01: Stage list parity check (loop spec vs stage dictionary vs generated map) -> exact ID set match.
  - TC-02: Join barrier validation check -> required inputs map correctly to new stage IDs.
  - TC-03: Generated artifact drift check -> regeneration produces no diff after commit.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg`/`sed` review of loop spec, stage dictionary, generated map/table.
  - Validation artifacts: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`.
  - Unexpected findings: existing MCP allowlists include obsolete stage IDs, increasing need for synchronized follow-up.
  - Consumer tracing:
    - New outputs: `MARKET*` and `SELL*` stage IDs.
    - Consumers: stage-addressing resolver, startup-loop command docs, MCP tool stage allowlists, detector stage enums, contract lint checks.
- **Scouts:** None: scope is contract-authority rewrite only.
- **Edge Cases & Hardening:** Ensure conditional adjacent-product branch remains explicitly non-blocking at S4.
- **What would make this >=90%:** Add automated parity test that imports loop-spec IDs and fails on dictionary/generated mismatch.
- **Rollout / rollback:**
  - Rollout: commit spec + dictionary + generated artifacts as one atomic change.
  - Rollback: revert these files together; do not partially revert one surface.
- **Documentation impact:** Canonical stage vocabulary and operator map become MARKET/SELL-native.
- **Notes / references:** `docs/plans/startup-loop-market-sell-containers/fact-find.md`
- **Execution evidence (2026-02-21):**
  - Updated canonical stage model in `docs/business-os/startup-loop/loop-spec.yaml` from `S2/S2B/S3B/S6B` to `MARKET`, `MARKET-01`, `MARKET-02`, `MARKET-03`, `SELL`, `SELL-01`, `SELL-02`.
  - Updated stage dictionary in `docs/business-os/startup-loop/stage-operator-dictionary.yaml` with MARKET/SELL entries and removed legacy marketing/sales aliases.
  - Regenerated derived views: `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`.
  - Validation:
    - `pnpm --filter scripts check-stage-operator-views` -> pass
    - loop-spec vs dictionary stage order parity + forbidden legacy stage ID check -> pass
    - legacy marketing/sales ID grep in dictionary/generated views -> no matches

### TASK-02: Re-anchor startup-loop orchestration/gates and skill contracts to MARKET/SELL IDs
- **Type:** IMPLEMENT
- **Deliverable:** Updated startup-loop orchestration docs and skill contracts referencing new stage IDs/gates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`, `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-baseline-merge/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-other-products/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05, TASK-07, TASK-09
- **Confidence:** 85%
  - Implementation: 85% - affected skill surfaces are explicit.
  - Approach: 85% - preserves existing gate semantics while changing stage anchors.
  - Impact: 90% - prevents contract drift between canonical spec and skill runtime instructions.
- **Acceptance:**
  - Startup-loop wrapper tables and gate sections reference only MARKET/SELL stage IDs.
  - Existing hard gate semantics remain intact under new names.
  - Companion skill dispatch rules and S4 barrier references are updated to new stage anchors.
  - No residual references to `S2/S2B/S3B/S6B` remain in startup-loop orchestration docs.
- **Validation contract (TC-02):**
  - TC-01: Search check over startup-loop skill surfaces finds no legacy stage IDs.
  - TC-02: Gate descriptions preserve STRAT vs ACT separation and hard/soft classifications.
  - TC-03: Skill-to-stage mapping table aligns exactly with loop-spec stage IDs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted `rg` scans over startup-loop and relevant lp-* skill docs.
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`.
  - Unexpected findings: existing docs include duplicated stage references across multiple skills, requiring coordinated edit pass.
  - Consumer tracing:
    - Modified behavior: stage-routing guidance and gate trigger text now keyed to MARKET/SELL IDs.
    - Consumers: operators invoking `/startup-loop`, subagent dispatchers, lint rule SQ-01/SQ-09 stage-coverage checks.
- **Scouts:** None: orchestration behavior is defined in existing gate text.
- **Edge Cases & Hardening:** Validate no accidental downgrade of hard gates to advisory language during rename.
- **What would make this >=90%:** Add cross-file consistency test that compares wrapper stage table to loop-spec IDs.
- **Rollout / rollback:**
  - Rollout: update all startup-loop skill references in one commit.
  - Rollback: revert skill docs as a unit.
- **Documentation impact:** All orchestration docs become container-model consistent.
- **Notes / references:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Execution evidence (2026-02-21):**
  - Updated startup-loop wrapper contracts in `.claude/skills/startup-loop/SKILL.md`:
    - stage submit examples now use `<STAGE_ID>` and run-packet contract now references `loop_spec_version: 3.4.0`.
    - stage table re-anchored from legacy `S2/S2B/S3B/S6B` references to `MARKET`, `MARKET-01/02/03`, `SELL`, `SELL-01/02`.
  - Updated gate/orchestration module `.claude/skills/startup-loop/modules/cmd-advance.md`:
    - gate IDs renamed and preserved by semantics: `GATE-MARKET-03-01`, `GATE-SELL-STRAT-01`, `GATE-SELL-ACT-01`.
    - trigger boundaries updated to `MARKET-02` completion and `MARKET-02→SELL-01` fan-out.
    - secondary dispatch section re-anchored from S6B to SELL-01 with unchanged parallel `lp-seo` + `draft-outreach` requirement.
  - Updated dependent skill contracts:
    - `.claude/skills/lp-offer/SKILL.md` -> MARKET-02 stage anchoring.
    - `.claude/skills/lp-channels/SKILL.md` -> SELL-01 stage anchoring with explicit STRAT-vs-ACT gate split.
    - `.claude/skills/lp-baseline-merge/SKILL.md` -> S4 join inputs now `MARKET-02`, `S3`, `SELL-01` plus optional `MARKET-03`.
    - `.claude/skills/lp-forecast/SKILL.md` -> consumes MARKET-02 offer (SELL-01 channels optional).
    - `.claude/skills/lp-other-products/SKILL.md` -> `GATE-MARKET-03-01` and MARKET-02 anchoring.
  - Validation:
    - TC-01 legacy sweep across TASK-02 scope -> pass (no `S2/S2B/S3B/S6B`, `GATE-S6B*`, or `GATE-S3B-01` references).
    - TC-02 gate taxonomy check -> pass (`GATE-SELL-STRAT-01` hard gate retained, `GATE-SELL-ACT-01` hard gate retained, `GATE-MARKET-03-01` soft advisory retained).
    - TC-03 startup-loop skill stage table parity vs `docs/business-os/startup-loop/loop-spec.yaml` stage IDs -> exact match.

### TASK-03: Hard-cut runtime code paths (gates/workers/detector/resolver) to new stage IDs
- **Type:** IMPLEMENT
- **Deliverable:** Runtime code migration to MARKET/SELL stage IDs with no legacy fallbacks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Done
- **Affects:** `scripts/src/startup-loop/s6b-gates.ts`, `scripts/src/startup-loop/baseline-merge.ts`, `scripts/src/startup-loop/bottleneck-detector.ts`, `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/manifest-update.ts`, `scripts/src/startup-loop/funnel-metrics-extractor.ts`, `[readonly] docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
- **Depends on:** TASK-01, TASK-02, TASK-09
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - TASK-09 now provides full module-level migration matrix and explicit compatibility decisions.
  - Approach: 80% - MARKET/SELL mapping and test migration order are explicit and executable.
  - Impact: 80% - required for executable correctness under new stage model.
- **Acceptance:**
  - Runtime gate evaluator references SELL gate IDs/model and preserves strategy-vs-activation checks.
  - Baseline merge worker and manifest writer read new upstream stage result IDs and still enforce required artifact keys.
  - Detector/replan/funnel mappings re-anchor constraint keys and metric-stage assignments to MARKET/SELL IDs without semantic regression.
  - Stage resolver accepts only new canonical IDs and canonical aliases from updated dictionary, including updated canonical ID guidance strings.
- **Validation contract (TC-03):**
  - TC-01: Gate evaluation unit/integration checks pass for strategy and activation conditions under new SELL gate IDs.
  - TC-02: Baseline merge + manifest update paths validate required upstream inputs and fail deterministically on missing inputs with new stage IDs.
  - TC-03: Bottleneck detection and replan trigger ranking/recommendation checks pass with updated stage IDs/constraint keys.
  - TC-04: Stage addressing resolver tests confirm canonical-ID help text and alias resolution contain no retired marketing/sales IDs.
  - TC-05: Stage-ID inventory check over non-test runtime files completes with explicit allowlist for non-stage `S1/S2/S3` seasonal scenario labels.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: file-level audit of current runtime references and stage enums + non-test stage-ID inventory scan.
  - Validation artifacts: `scripts/src/startup-loop/s6b-gates.ts`, `scripts/src/startup-loop/baseline-merge.ts`, `scripts/src/startup-loop/bottleneck-detector.ts`, `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/manifest-update.ts`, `scripts/src/startup-loop/funnel-metrics-extractor.ts`.
  - Unexpected findings: hard-coded stage unions/ordering and constraint-key mappings are duplicated across more modules than originally listed.
  - Consumer tracing:
    - New outputs: runtime stage/result references using MARKET/SELL IDs.
    - Consumers: gate evaluator, baseline merge worker, manifest writer, detector/ranker/replan logic, funnel metric extractor, startup-loop stage resolver, MCP policy validators (follow-up TASK-04).
    - Held-back test: one missed consumer of retired IDs would break orchestration; this caps confidence at 70% until full parity tests are in place.
- **Scouts:** Produce a one-pass runtime stage-ID inventory (non-test files) and classify true stage IDs vs non-stage seasonal scenario labels (`hospitality-scenarios.ts`, `s2-market-intelligence-handoff.ts`, `s2-operator-capture.ts`) before edits.
- **Edge Cases & Hardening:** Ensure MARKET-03 remains optional/non-blocking in join logic/detector mappings and avoid mutating non-stage seasonal `S1/S2/S3` scenario tokens.
- **What would make this >=90%:** Add exhaustive stage-ID consumer tests across scripts + MCP tooling before executing this task.
- **Rollout / rollback:**
  - Rollout: perform runtime code cutover only after spec/skill updates merge cleanly.
  - Rollback: revert runtime ID migration commit as one unit.
- **Documentation impact:** Update inline comments and module headers to new stage names.
- **Notes / references:** `docs/plans/startup-loop-market-sell-containers/fact-find.md`
#### Re-plan Update (2026-02-21)
- Confidence: 70% -> 75% (Evidence: E2 from targeted runtime tests + E1 stage-ID inventory)
- Key change: Added TASK-09 precursor to resolve migration ordering and compatibility unknowns before implementation.
- Dependencies: updated (`TASK-03` now depends on `TASK-09`)
- Validation contract: unchanged for TC-03; precursor TC-09 added for promotion evidence.
- Notes: `docs/plans/startup-loop-market-sell-containers/replan-notes.md`
#### Re-plan Update (2026-02-21, post-TASK-09)
- Confidence: 75% -> 80% (Evidence: E3 precursor complete via TASK-09 + E2 governed test evidence captured in replan notes)
- Key change: Promotion threshold met; TASK-03 now build-eligible under IMPLEMENT gate.
- Dependencies: unchanged
- Validation contract: unchanged (TC-03 remains the implementation gate contract)
- Notes: `docs/plans/startup-loop-market-sell-containers/replan-notes.md`
- **Execution evidence (2026-02-21):**
  - Runtime stage/gate/constraint cutover completed in:
    - `scripts/src/startup-loop/s6b-gates.ts`
    - `scripts/src/startup-loop/baseline-merge.ts`
    - `scripts/src/startup-loop/manifest-update.ts`
    - `scripts/src/startup-loop/bottleneck-detector.ts`
    - `scripts/src/startup-loop/replan-trigger.ts`
    - `scripts/src/startup-loop/funnel-metrics-extractor.ts`
    - `scripts/src/startup-loop/stage-addressing.ts`
  - Legacy stage/gate IDs removed from the TASK-03 runtime scope (`S2`, `S2B`, `S3B`, `S6B`, `GATE-S6B-*`, `GATE-S3B-01`), preserving seasonal non-stage `S1/S2/S3` references outside stage-addressing runtime modules.
  - Deterministic runtime behavior updates:
    - SELL gate evaluator now uses `GATE-SELL-STRAT-01` and `GATE-SELL-ACT-01` (`evaluateSellGates` entrypoint).
    - S4 merge/manifest required-stage barrier now keyed to `MARKET-02`, `S3`, `SELL-01`, with optional `MARKET-03` adjacent research support.
    - Bottleneck/replan/funnel mappings now use canonical `SELL-01/*` and `MARKET-02/*` keys.
    - Stage-addressing ID guidance now derives canonical IDs from generated stage map (no hard-coded retired-ID list).
  - TC-03 targeted tests (governed run) -> pass:
    - `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`
    - `scripts/src/startup-loop/__tests__/baseline-merge.test.ts`
    - `scripts/src/startup-loop/__tests__/manifest-update.test.ts`
    - `scripts/src/startup-loop/__tests__/replan-trigger.test.ts`
    - `scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts`
    - `scripts/src/startup-loop/__tests__/funnel-metrics-extractor.test.ts`
    - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
    - `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts`

### TASK-04: Cut over MCP loop/bos policy stage allowlists and stage validation contracts
- **Type:** IMPLEMENT
- **Deliverable:** MCP tool policy and schema surfaces aligned to MARKET/SELL stage IDs only
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Affects:** `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/tools/policy.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - tool schemas/policies are explicit and test-covered.
  - Approach: 85% - direct replacement removes existing drift and legacy contamination.
  - Impact: 90% - ensures API tooling enforces the new canonical stage surface.
- **Acceptance:**
  - `STARTUP_LOOP_STAGES` lists in loop/bos tools match new canonical stage IDs exactly.
  - Legacy stage IDs are removed from allowlists and tool docs/comments.
  - Integration tests continue to pass with updated stage payloads.
- **Validation contract (TC-04):**
  - TC-01: MCP loop/bos tools reject retired stage IDs.
  - TC-02: MCP loop/bos tools accept new MARKET/SELL stage IDs where policy permits.
  - TC-03: Startup-loop integration test suite passes after payload updates.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted stage-list audit in `packages/mcp-server/src/tools/loop.ts` and `packages/mcp-server/src/tools/bos.ts`.
  - Validation artifacts: both tool files + integration test file.
  - Unexpected findings: current tool lists still contain old retired IDs (`S1`, `S1B`, `S2A`), so cleanup is required regardless.
  - Consumer tracing:
    - Modified behavior: policy validation for `current_stage` now uses MARKET/SELL model.
    - Consumers: all MCP loop/bos tool calls and associated test fixtures.
- **Scouts:** None: test harness already exists.
- **Edge Cases & Hardening:** Verify stage-specific write-permission policies are unchanged after ID replacement.
- **What would make this >=90%:** Add generated-source import for stage allowlists to remove literal duplication.
- **Rollout / rollback:**
  - Rollout: land with synchronized tests.
  - Rollback: revert tool changes + tests together.
- **Documentation impact:** Tool descriptions referencing stage IDs updated.
- **Notes / references:** `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
- **Execution evidence (2026-02-21):**
  - Updated `STARTUP_LOOP_STAGES` allowlists in:
    - `packages/mcp-server/src/tools/loop.ts`
    - `packages/mcp-server/src/tools/bos.ts`
  - Stage list parity verified against `docs/business-os/startup-loop/_generated/stage-operator-map.json` (exact ID and order match).
  - Updated startup-loop integration fixture in `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` to canonical stage IDs.
  - Validation:
    - `pnpm --filter @acme/mcp-server test:startup-loop -- --testPathPattern="startup-loop-tools.integration.test.ts"` -> pass
    - `pnpm --filter @acme/mcp-server test:startup-loop` -> pass
    - `pnpm --filter @acme/mcp-server typecheck` -> pass
    - `pnpm --filter @acme/mcp-server lint` -> pass (warnings only; 0 errors)

### TASK-05: Update contract docs and capability anchors to MARKET/SELL with no legacy IDs
- **Type:** IMPLEMENT
- **Deliverable:** Contract/documentation set fully re-anchored to MARKET/SELL stage family
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Artifact-Destination:** Canonical startup-loop contract docs under `docs/business-os/startup-loop/`
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** Maintainer review note in plan Decision Log; full contract-lint closure tracked under TASK-06/TASK-07
- **Measurement-Readiness:** Weekly contract-lint pass/fail trend tracked via `scripts/check-startup-loop-contracts.sh` output in CI logs
- **Affects:** `docs/business-os/startup-loop/artifact-registry.md`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/business-os/startup-loop/stage-result-schema.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 85% - target contract docs are explicit and bounded.
  - Approach: 85% - contract-first alignment reduces hidden runtime/document drift.
  - Impact: 90% - downstream planners/builders rely on these anchors.
- **Acceptance:**
  - All canonical startup-loop contracts refer only to MARKET/SELL identifiers for this segment.
  - Capability anchor mappings remain semantically equivalent (offer-side vs channel-side responsibilities preserved).
  - Artifact path and join contracts remain deterministic after stage renaming.
- **Validation contract (VC-05):**
  - VC-01: Stage-anchor consistency -> pass when 5/5 canonical docs above contain no retired IDs by end of task over full-document sample; else fail and block TASK-06.
  - VC-02: Capability continuity -> pass when CAP-01..CAP-04 mappings preserve original operational ownership with explicit MARKET/SELL anchors within one review cycle by maintainer sample review of 1 full table; else fail and require rewrite.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify all retired-ID references and impacted capability anchors.
  - Green evidence plan: rewritten docs and cross-doc anchor check pass.
  - Refactor evidence plan: normalize wording and remove duplicate anchor terminology.
- **Planning validation (required for M/L):**
  - Checks run: targeted contract doc reads + stage anchor grep scans.
  - Validation artifacts: listed docs and existing fact-find evidence map.
  - Unexpected findings: some docs embed stage IDs in examples/tables that require full-table edits, not search/replace.
  - Consumer tracing:
    - Modified outputs: canonical stage anchors in contract docs.
    - Consumers: startup-loop skill docs, lint checks, planner references, maintainers reviewing capability completeness.
- **Scouts:** None: canonical docs and scope are identified.
- **Edge Cases & Hardening:** Keep optional/conditional semantics explicit where MARKET-03-equivalent behavior appears in contracts.
- **Execution evidence (2026-02-21):**
  - Re-anchored the full TASK-05 contract scope to MARKET/SELL IDs:
    - `docs/business-os/startup-loop/artifact-registry.md`
    - `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
    - `docs/business-os/startup-loop/process-registry-v2.md`
    - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
    - `docs/business-os/startup-loop/stage-result-schema.md`
  - VC-05 checks:
    - VC-01 stage-anchor consistency -> pass (full-document retired-ID sweep across 5/5 canonical docs returned no `S2`, `S2B`, `S3B`, `S6B`, `GATE-S6B-*`, or `GATE-S3B-01` anchors).
    - VC-02 capability continuity -> pass (CAP-01..CAP-04 preserve ownership boundary: `MARKET-02` for offer-side capabilities and `SELL-01`/`SELL-02` gate semantics for channel-side capabilities).
  - Normalized stage split wording where required (strategy vs activation), including SELL strategy (`SELL-01`) vs paid activation (`SELL-02`) references in capability and schema examples.
  - Validation note: `bash scripts/check-startup-loop-contracts.sh` still fails on known SQ-01/SQ-09 workflow + prompt-index coverage gaps outside TASK-05 scope (addressed by TASK-07/TASK-06); no TASK-05 file regressions detected in VC-05 scans.
- **What would make this >=90%:** Add schema-backed validation for contract tables that encode stage anchor fields.
- **Rollout / rollback:**
  - Rollout: update contract docs in a single coherent commit.
  - Rollback: restore prior docs from commit snapshot if semantic regression is detected.
- **Documentation impact:** Primary deliverable of this task.
- **Notes / references:** `docs/business-os/_shared/business-vc-quality-checklist.md`

### TASK-06: Update tests/fixtures/lint rules for new IDs and enforce no-legacy policy
- **Type:** IMPLEMENT
- **Deliverable:** Test and lint suite enforcing MARKET/SELL IDs and rejecting retired IDs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Affects:** `scripts/check-startup-loop-contracts.sh`, `scripts/src/docs-lint-helpers.ts`, `scripts/src/docs-lint.ts`, `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`, `packages/mcp-server/src/__tests__/fixtures/startup-loop/manifest.complete.json`, `packages/mcp-server/src/__tests__/fixtures/startup-loop/manifest.stale.json`
- **Depends on:** TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - lint/test harnesses already exist and are actively used.
  - Approach: 85% - enforcement prevents regression back to retired IDs.
  - Impact: 90% - cutover reliability depends on automated parity checks.
- **Acceptance:**
  - Contract lint validates new stage coverage and fails on retired marketing/sales IDs.
  - MCP integration tests and fixtures reflect new canonical IDs.
  - Docs-lint stage-ID helpers accept new forms and reject legacy surface usage.
- **Validation contract (TC-06):**
  - TC-01: `bash scripts/check-startup-loop-contracts.sh` passes with updated stage model.
  - TC-02: `pnpm --filter @acme/mcp-server test:startup-loop -- --testPathPattern="startup-loop-tools.integration.test.ts"` passes.
  - TC-03: Stage-ID lint checks fail when injected legacy IDs are present in startup-loop surfaces.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: existing lint command and MCP startup-loop integration test command.
  - Validation artifacts: current lint output (failing baseline) and passing MCP integration suite.
  - Unexpected findings: current lint already failing on stage coverage drift, so this task also resolves baseline hygiene debt.
  - Consumer tracing:
    - New/modified outputs: lint and tests encode MARKET/SELL policy.
    - Consumers: CI validation gate, maintainers, downstream plan/build tasks.
- **Scouts:** None: validation commands are known and reproducible.
- **Edge Cases & Hardening:** Ensure lint avoids false positives in historical/archive docs by scoping checks to active canonical surfaces.
- **What would make this >=90%:** Add generated-stage-set parity assertion in lint to remove manual list maintenance.
- **Rollout / rollback:**
  - Rollout: update checks/fixtures in same PR as core code changes.
  - Rollback: revert lint changes only if false-positive rate becomes blocking.
- **Documentation impact:** Validation guidance in runbook/check scripts may need short update.
- **Notes / references:** `docs/plans/startup-loop-market-sell-containers/fact-find.md`
- **Execution evidence (2026-02-21):**
  - Added no-legacy enforcement to startup-loop contract lint in `scripts/check-startup-loop-contracts.sh` (SQ-01C over active operator surfaces).
  - Updated docs-lint stage handling:
    - `scripts/src/docs-lint-helpers.ts` now recognizes canonical ASSESSMENT/MEASURE/MARKET/SELL IDs.
    - `scripts/src/docs-lint-helpers.ts` now exposes `checkRetiredMarketingSalesStageIds`.
    - `scripts/src/docs-lint.ts` hard-fails retired IDs in `docs/business-os/startup-loop-workflow.user.md` and `docs/business-os/workflow-prompts/README.user.md`.
    - `scripts/src/docs-lint.test.ts` updated with canonical VC-01 examples and new VC-02 retired-ID checks.
  - Updated MCP fixture/test stage IDs:
    - `packages/mcp-server/src/__tests__/fixtures/startup-loop/manifest.complete.json`
    - `packages/mcp-server/src/__tests__/fixtures/startup-loop/manifest.stale.json`
    - `packages/mcp-server/src/__tests__/loop-tools.test.ts`
  - Validation:
    - `bash scripts/check-startup-loop-contracts.sh` -> pass
    - `pnpm run test:governed -- jest -- --runInBand --runTestsByPath scripts/src/docs-lint.test.ts` -> pass
    - `pnpm run test:governed -- jest -- --runInBand --runTestsByPath packages/mcp-server/src/__tests__/loop-tools.test.ts` -> pass
    - `pnpm --filter @acme/mcp-server test:startup-loop -- --testPathPattern="startup-loop-tools.integration.test.ts"` -> pass

### TASK-07: Update operator workflow/prompt index and stage-facing docs to new vocabulary
- **Type:** IMPLEMENT
- **Deliverable:** Operator-facing startup-loop docs fully aligned to MARKET/SELL model
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Done
- **Artifact-Destination:** Operator docs under `docs/business-os/startup-loop-workflow.user.md` and `docs/business-os/workflow-prompts/README.user.md`
- **Reviewer:** Venture-studio operator owner (Pete)
- **Approval-Evidence:** Operator sign-off note that stage progression is understandable without legacy IDs
- **Measurement-Readiness:** Comprehension check: 3 sample run packets, target <= 30s to identify current/next stage with new labels
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/README.user.md`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`
- **Depends on:** TASK-01, TASK-02, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - target docs and generated table are known.
  - Approach: 85% - aligns operator language with canonical stage model.
  - Impact: 85% - prevents dual vocabulary confusion after hard cutover.
- **Acceptance:**
  - Active workflow docs use MARKET/SELL labels and sequencing consistently.
  - Prompt index stage references align with canonical prompt-required stages after cutover.
  - No retired marketing/sales IDs remain in active operator docs.
- **Validation contract (VC-07):**
  - VC-01: Operator readability check -> pass when reviewer identifies current and next stage correctly in 3/3 sample packets within 30 seconds each during one review session; else fail.
  - VC-02: Prompt index coverage -> pass when every prompt-required stage in loop spec appears exactly once in prompt index by end of task over full index sample; else fail.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: list mismatched/legacy stage mentions in active operator docs.
  - Green evidence plan: rewritten docs and prompt index pass coverage and readability checks.
  - Refactor evidence plan: normalize stage naming phrasing and remove duplicate wording.
- **Planning validation (required for M/L):**
  - Checks run: startup-loop workflow/prompt index read and contract-lint failure audit.
  - Validation artifacts: `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/README.user.md`, lint SQ-01/SQ-09 failures.
  - Unexpected findings: workflow guide currently lags canonical stage set and will require structural table updates.
  - Consumer tracing:
    - Modified outputs: operator-visible stage names and prompts.
    - Consumers: human operators, startup-loop command usage patterns, contract-lint coverage checks.
- **Scouts:** None: operator doc surfaces are explicit.
- **Edge Cases & Hardening:** Keep technical appendix references accurate even while removing retired IDs from operator-facing sections.
- **What would make this >=90%:** Add a generated-doc snippet insertion flow so manual drift cannot reappear.
- **Rollout / rollback:**
  - Rollout: land docs with generated table update.
  - Rollback: revert docs and generated table together.
- **Documentation impact:** Primary deliverable of this task.
- **Notes / references:** `docs/business-os/_shared/business-vc-quality-checklist.md`
- **Execution evidence (2026-02-21):**
  - Updated active operator docs:
    - `docs/business-os/startup-loop-workflow.user.md`
    - `docs/business-os/workflow-prompts/README.user.md`
  - Added canonical stage inventory to workflow guide so SQ-01 stage presence matches loop-spec deterministically.
  - Prompt index now includes canonical prompt-required stage IDs: `ASSESSMENT-09`, `ASSESSMENT-10`, `ASSESSMENT-11`, `MEASURE-01`, `MEASURE-02`, `MARKET-01`, `S5A`, `S6`, `S10`.
  - Retired marketing/sales ID sweep for active operator docs (`S2`, `S2B`, `S3B`, `S6B`, `GATE-S6B-*`, `GATE-S3B-01`) -> no matches.
  - Validation:
    - `bash scripts/check-startup-loop-contracts.sh` -> pass (SQ-01 + SQ-09 + SQ-01C)

### TASK-08: Horizon checkpoint - re-sequence and validate pre-build readiness after cutover updates
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan confidence and dependency sequencing after post-cutover validation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Done
- **Affects:** `docs/plans/startup-loop-market-sell-containers/plan.md`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint flow and replan contract are established.
  - Approach: 95% - prevents deep execution with stale assumptions.
  - Impact: 95% - protects hard-cutover quality before build continuation.
- **Acceptance:**
  - `/lp-do-build` checkpoint contract executed.
  - Post-cutover validation outcomes are recorded.
  - Downstream task confidences are recalibrated from latest evidence and re-sequenced.
- **Horizon assumptions to validate:**
  - No hidden runtime consumer still requires retired marketing/sales stage IDs.
  - CI/lint surfaces remain stable under no-legacy enforcement.
- **Validation contract:** Replan evidence recorded in this plan with updated gate states and confidence notes.
- **Planning validation:** Updated command outcomes + sequence table refresh.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update only.
- **Execution evidence (2026-02-21):**
  - Checkpoint executed after TASK-06 and TASK-07 completion.
  - Horizon assumptions validated:
    - no active-surface legacy marketing/sales IDs remain;
    - startup-loop contract lint + MCP startup-loop integration + docs-lint helper tests all pass.
  - No remaining blockers in wave sequencing.

### TASK-09: Build runtime stage-ID migration matrix + compatibility guardrails for TASK-03 cutover
- **Type:** INVESTIGATE
- **Deliverable:** File-level migration matrix and compatibility decision notes covering runtime stage IDs, gate IDs, and constraint keys
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Done
- **Affects:** `[readonly] scripts/src/startup-loop/s6b-gates.ts`, `[readonly] scripts/src/startup-loop/baseline-merge.ts`, `[readonly] scripts/src/startup-loop/bottleneck-detector.ts`, `[readonly] scripts/src/startup-loop/replan-trigger.ts`, `[readonly] scripts/src/startup-loop/stage-addressing.ts`, `[readonly] scripts/src/startup-loop/manifest-update.ts`, `[readonly] scripts/src/startup-loop/funnel-metrics-extractor.ts`, `[readonly] scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `[readonly] scripts/src/startup-loop/__tests__/baseline-merge.test.ts`, `[readonly] scripts/src/startup-loop/__tests__/manifest-update.test.ts`, `[readonly] scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`, `[readonly] scripts/src/startup-loop/__tests__/replan-trigger.test.ts`, `docs/plans/startup-loop-market-sell-containers/replan-notes.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - scope is bounded to inventory, matrixing, and compatibility decisions; no production code mutation.
  - Approach: 85% - investigate-first path directly targets the held-back unknowns blocking TASK-03 promotion.
  - Impact: 85% - reduces runtime cutover risk by converting implicit assumptions into explicit migration contracts.
- **Acceptance:**
  - Runtime non-test stage-ID inventory captured and classified into true stage IDs vs non-stage tokens (seasonal `S1/S2/S3`, operator-capture artifacts).
  - Legacy-to-canonical mapping matrix documented for all TASK-03 runtime modules and directly impacted tests.
  - Constraint-key compatibility decision (history key migration vs normalization shim) documented with recommended execution order.
- **Validation contract (TC-09):**
  - TC-01: Stage-ID inventory command output recorded with file-level classifications.
  - TC-02: Targeted read-only test evidence recorded:
    - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` (known fail boundary after MARKET/SELL cutover),
    - `scripts/src/startup-loop/__tests__/baseline-merge.test.ts` pass,
    - `scripts/src/startup-loop/__tests__/manifest-update.test.ts` pass,
    - `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` pass,
    - `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` pass.
  - TC-03: Replan notes include explicit promotion criteria for TASK-03 (`>=80`) tied to completed precursor evidence.
- **Planning validation (required for M/L):**
  - Checks run: runtime stage-ID inventory + targeted governed tests.
  - Validation artifacts: `docs/plans/startup-loop-market-sell-containers/replan-notes.md`.
  - Unexpected findings: stage-addressing tests fail on legacy expectations while other legacy-runtime suites still pass, confirming mixed-state migration risk.
  - Consumer tracing:
    - New outputs: migration matrix + compatibility guardrails consumed by TASK-03 implementation.
    - Consumers: runtime cutover task (TASK-03), downstream MCP alignment (TASK-04), test/lint hardening (TASK-06).
- **What would make this >=90%:** Add one dry-run migration script output proving zero unresolved module references post-map.
- **Execution evidence (2026-02-21):**
  - Added module-by-module runtime migration matrix (legacy -> canonical stage/gate/key anchors) in `docs/plans/startup-loop-market-sell-containers/replan-notes.md`.
  - Added compatibility decision for historical constraint-key normalization while preserving canonical-only external stage contracts.
  - Added deterministic test migration order for TASK-03 implementation.
  - Captured targeted governed test evidence:
    - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` -> fail boundary confirmed post-MARKET/SELL cutover.
    - `scripts/src/startup-loop/__tests__/baseline-merge.test.ts` -> pass.
    - `scripts/src/startup-loop/__tests__/manifest-update.test.ts` -> pass.
    - `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` -> pass.
    - `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` -> pass.
  - Downstream confidence propagation: TASK-03 promoted to 80% with precursor complete.

## Risks & Mitigations
- High blast radius from hard cutover with no alias fallback.
  - Mitigation: strict wave sequencing + checkpoint gate before further execution.
- Missed stage-ID consumer in runtime or tests.
  - Mitigation: consumer-tracing in every M/L task + parity lint and integration tests.
- Gate semantics drift during rename.
  - Mitigation: preserve hard/soft gate taxonomy and verify explicitly in TASK-02/TASK-03.
- Operator confusion after vocabulary switch.
  - Mitigation: dedicated operator-doc task with measurable comprehension check (VC-07).

## Observability
- Logging:
  - Track startup-loop gate evaluation messages for strategy/spend decisions after SELL cutover.
- Metrics:
  - Contract lint pass/fail trend.
  - Startup-loop MCP integration test pass/fail trend.
- Alerts/Dashboards:
  - None: use existing CI job status as enforcement surface.

## Acceptance Criteria (overall)
- [x] Canonical stage graph and dictionary use MARKET/SELL model with no retired marketing/sales IDs.
- [x] Runtime workers/gates/resolver execute correctly with new stage IDs.
- [x] MCP tool policies and integration tests enforce the new stage surface.
- [x] Contract lint passes and blocks legacy-stage reintroduction.
- [x] Operator workflow/prompt index are fully aligned to new vocabulary.
- [x] Checkpoint replan completed before build continuation.

## Decision Log
- 2026-02-21: User decision: no legacy marketing/sales stage IDs will be retained. Hard cutover required.
- 2026-02-21: TASK-01 completed (canonical MARKET/SELL contract cutover + generated stage-operator artifacts regenerated and validated).
- 2026-02-21: lp-do-factcheck audit completed (Audit-Ref: `working-tree @ be4c8e7fafc259282e8e0edc6ad3bea63bbdc713`); confidence/cross-section consistency and path precision corrected.
- 2026-02-21: `/lp-do-replan TASK-03` executed; TASK-09 INVESTIGATE precursor added and TASK-03 confidence/dependencies updated based on E2 test evidence.
- 2026-02-21: TASK-09 completed; runtime migration matrix + compatibility guardrails captured, and TASK-03 promoted to 80% (build-eligible).
- 2026-02-21: TASK-05 completed; VC-05 contract-anchor checks passed across the five canonical startup-loop contract docs.
- 2026-02-21: Startup-loop contract lint rerun during TASK-05 evidence capture -> fails on known SQ-01/SQ-09 workflow/prompt-index coverage gaps (TASK-07/TASK-06 scope), not on TASK-05 canonical contract docs.
- 2026-02-21: TASK-03 completed; runtime modules and targeted governed tests are now MARKET/SELL-native with no legacy marketing/sales stage or gate IDs in the TASK-03 runtime scope.
- 2026-02-21: TASK-04 completed; MCP loop/bos allowlists are canonicalized and parity-checked against generated stage map (no legacy IDs).
- 2026-02-21: TASK-07 completed; workflow guide and prompt index are aligned to MARKET/SELL and canonical prompt-required stage IDs.
- 2026-02-21: TASK-06 completed; lint/tests now enforce no-legacy marketing/sales IDs on active operator startup-loop surfaces.
- 2026-02-21: TASK-08 checkpoint completed; post-cutover readiness validated and no blockers remain.

## Overall-confidence Calculation
- Weighted scores (S=1, M=2, L=3):
  - TASK-01: 85 * 2 = 170
  - TASK-02: 85 * 2 = 170
  - TASK-03: 80 * 3 = 240
  - TASK-04: 85 * 2 = 170
  - TASK-05: 85 * 2 = 170
  - TASK-06: 85 * 2 = 170
  - TASK-07: 85 * 2 = 170
  - TASK-08: 95 * 1 = 95
  - TASK-09: 85 * 1 = 85
- Total weighted points: 1440
- Total weight: 17
- Overall-confidence: 1440 / 17 = 84.7059% -> **85%**

## Section Omission Rule
None: all core sections are applicable for this mixed-track hard-cutover plan.
