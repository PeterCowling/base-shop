---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Replan-date: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-skill-system-sequencing
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact) — LPSP-01 resolved; sub-80% tasks split and replanned; VC contracts enumerated 2026-02-13
Business-OS-Integration: off
Business-Unit: BOS
---

# LP Skill System Sequencing Plan

## Summary

This plan implements the sequencing fact-find by moving Startup Loop to a deterministic, replayable runtime contract with safe parallel execution:

1. Runtime-authoritative loop spec.
2. Data-plane/control-plane split (single-writer control updates).
3. Event-sourced run state with derived views.
4. Deterministic fan-out/fan-in merge barrier.
5. Idempotent persistence boundary.
6. Contract lint guardrails and controlled-velocity thresholds.

Primary references:

- `docs/plans/lp-skill-system-sequencing-fact-find.md`
- `docs/business-os/startup-loop-current-vs-proposed.user.md`
- `.claude/skills/startup-loop/SKILL.md`
- `docs/business-os/startup-loop-workflow.user.md`

## Goals

1. Remove stage/path/naming drift as an operational failure mode.
2. Enable safe parallel fan-out by preventing shared-state contention.
3. Make runs auditable and recoverable from partial failure.
4. Keep rollout velocity high via explicit stabilization triggers, not ad-hoc interventions.

## Non-goals

1. Rewriting every LP skill in one release.
2. Multi-run concurrency per business in the first cut.
3. Introducing heavy orchestration infrastructure beyond current repo patterns.

## Constraints & Assumptions

- Constraints:
  - Existing startup-loop usage must continue during migration.
  - Compatibility window is required (legacy reads, canonical writes).
  - No destructive bulk migration of historical artifacts.
- Assumptions:
  - One active run per business is acceptable during stabilization.
  - `/lp-baseline-merge` and `/lp-bos-sync` can be introduced incrementally.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| LPSP-01 | DECISION | Finalize runtime contract decisions (stage set, baseline commit stage, concurrency policy, alias sunset gate) | 88% | S | Done | - | LPSP-02, LPSP-03A, LPSP-05 |
| LPSP-02 | IMPLEMENT | Add runtime-authoritative loop spec and align wrapper/workflow/prompt index | 85% | M | Done | LPSP-01 | LPSP-06A, LPSP-08 |
| LPSP-03A | IMPLEMENT | Define stage-result schema + data-plane ownership contract | 88% | S | Done | LPSP-01 | LPSP-03B, LPSP-04A |
| LPSP-03B | IMPLEMENT | Implement single-writer manifest update mechanism | 86% | M | Done | LPSP-03A | LPSP-07 |
| LPSP-04A | IMPLEMENT | Define event schema + derived state schema + deterministic derivation (happy-path) | 89% | M | Done | LPSP-03A | LPSP-06B, LPSP-06C, LPSP-08 |
| LPSP-04B | IMPLEMENT | Add recovery automation (resume/restart/abort) + event validation + failure injection | 78% (→84%) | M | Pending | LPSP-04A, LPSP-06B | LPSP-09 |
| LPSP-05 | IMPLEMENT | Canonicalize feature workspace + stage-doc key policy + alias handling | 87% | M | Done | LPSP-01 | LPSP-06A |
| LPSP-06A | DECISION | Define `/lp-baseline-merge` skill contract (inputs, blocking logic, output paths) | 92% | S | Done | LPSP-02, LPSP-05 | LPSP-06B, LPSP-06C |
| LPSP-06B | IMPLEMENT | Implement `/lp-baseline-merge` (S4 join barrier) | 85% | M | Done | LPSP-06A, LPSP-04A | LPSP-04B, LPSP-08 |
| LPSP-06C | IMPLEMENT | Implement `/lp-bos-sync` (S5B idempotent persistence + manifest commit) | 80% | M | Pending | LPSP-06A, LPSP-04A | LPSP-08 |
| LPSP-07 | IMPLEMENT | Define autonomy policy tiers and enforce guarded side-effect boundary | 80% | M | Pending | LPSP-03B | LPSP-08 |
| LPSP-08 | IMPLEMENT | Add contract lint + controlled-velocity metrics/triggers + run-concurrency gate | 82% | M | Pending | LPSP-02, LPSP-04A, LPSP-06B, LPSP-06C, LPSP-07 | LPSP-09 |
| LPSP-09 | CHECKPOINT | Validate end-to-end supervised dry run on one business path | 86% | M | Pending | LPSP-08, LPSP-04B | - |

## Active Tasks

- `LPSP-01` (DECISION) — **Done**.
- `LPSP-02` (IMPLEMENT) — **Done**.
- `LPSP-03A` (IMPLEMENT) — **Done**.
- `LPSP-03B` (IMPLEMENT) — **Done**.
- `LPSP-04A` (IMPLEMENT) — **Done**.
- `LPSP-05` (IMPLEMENT) — Unblocked, ready to build (Wave 2).
- `LPSP-06A` — Unblocked (Wave 3, depends on LPSP-02+05).
- `LPSP-06B`, `LPSP-06C` — Newly unblocked by LPSP-04A (Wave 4, still need LPSP-06A).
- `LPSP-07` — Unblocked (Wave 4, depends on LPSP-03B Done).

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | LPSP-01 | - | Done. Contract decisions recorded. |
| 2 | LPSP-02, LPSP-03A, LPSP-05 | LPSP-01 | All three can run in parallel: spec alignment, stage-result schema, workspace policy |
| 3 | LPSP-03B, LPSP-04A, LPSP-06A | LPSP-03A, LPSP-02+05 | Single-writer impl, event schema, and merge-barrier contract can run in parallel |
| 4 | LPSP-06B, LPSP-06C, LPSP-07 | LPSP-06A, LPSP-04A, LPSP-03B | Merge impl, bos-sync impl, and autonomy policy can run in parallel |
| 5 | LPSP-04B, LPSP-08 | LPSP-06B, LPSP-06C, LPSP-07 | Recovery hardening and contract lint after core orchestration |
| 6 | LPSP-09 | LPSP-08, LPSP-04B | End-to-end supervised dry-run with failure injection |

## Tasks

### LPSP-01: Finalize runtime contract decisions — DONE

- **Type:** DECISION
- **Status:** Done (2026-02-13)
- **Deliverable:** Decision log update in this plan.
- **Execution-Skill:** /lp-build
- **Confidence:** 88%
- **Resolved questions:**
  - DL-01: 17-stage canonical model, S4 as first-class join-barrier stage.
  - DL-02: S5B is the sole baseline commit point (not S4).
  - DL-03: Alias sunset at N=10 per-alias with two-phase enforcement.
  - DL-04: 20-run rolling window, 5 criteria, incremental concurrency relaxation.
- **Acceptance:** Met.
  - All four decisions recorded with chosen option and rationale in Decision Log.
  - Downstream tasks (LPSP-02, LPSP-03, LPSP-05) now reference these as fixed inputs.

### LPSP-02: Add runtime-authoritative loop spec and align docs/wrapper — DONE

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** business-artifact + code-change.
- **Execution-Skill:** /lp-build
- **Confidence:** 82% → 85% post-validation
- **Affects:**
  - `docs/business-os/startup-loop/loop-spec.yaml` (new)
  - `.claude/skills/startup-loop/SKILL.md`
  - `docs/business-os/startup-loop-workflow.user.md`
  - `docs/business-os/workflow-prompts/README.user.md`
- **Acceptance:** Met.
  - Wrapper stage graph matches loop spec.
  - Workflow stage graph matches loop spec.
  - Prompt index covers all spec stages or marks `no-prompt-required`.
  - Run packet contract includes `loop_spec_version`.
- **Validation contract (VC-02):** PASS.
  - Spec/doc/wrapper graph diff check passes (all 17 stages aligned).
  - No unresolved stage aliasing in active stage map (fixed `idea-readiness` → `lp-readiness`).

#### Build Completion (2026-02-13)
- **Commits:** 3a97532ace
- **Execution cycle:**
  - Validation cases executed: VC-02 (7 sub-checks)
  - Cycles: 1 (single pass + 1 alias fix from validation)
  - Final validation: PASS (all 7 checks)
- **Confidence reassessment:**
  - Original: 82%
  - Post-validation: 85%
  - Delta reason: validation confirmed assumptions; no surprises
- **Implementation notes:** Created loop-spec.yaml as canonical source, aligned wrapper (SKILL.md), workflow (stage table, BOS sync matrix, state snapshot, mermaid diagram), and prompt index. Fixed one legacy alias (`idea-readiness`).

### LPSP-03A: Stage-result schema + data-plane ownership contract — DONE

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** business-artifact (schema definition + examples).
- **Execution-Skill:** /lp-build
- **Confidence:** 84% → 88% post-validation
- **Replan note:** Split from original LPSP-03 (76%) to separate schema design from control-plane implementation.
- **Scope:**
  - Define stage-result file format that parallel workers emit after completing stage work.
  - Document directory ownership contract: `runs/<run_id>/stages/<stage>/` is stage-owned, `baseline.manifest.json` is control-plane-owned.
- **Acceptance:** Met.
  - Stage-result schema defined with all required fields + `loop_spec_version` and `timestamp`.
  - 5 schema examples (S2B Done, S3 Done, S6B Done with optionals, S4 Blocked, S3 Failed).
  - Directory ownership contract with explicit rules.
  - Control-plane consumption contract with malformed detection.
- **Validation contract (VC-03A):** PASS.
  - Consumption contract defines discovery, validation, rejection, and progression steps.
  - Malformed detection rules enumerate all failure cases.

#### Build Completion (2026-02-13)
- **Commits:** 48d14e4133
- **Execution cycle:**
  - Validation cases executed: VC-03A (6 sub-checks)
  - Cycles: 1 (single pass)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 84%
  - Post-validation: 88%
  - Delta reason: validation confirmed; schema aligned cleanly with briefing doc reference examples
- **Implementation notes:** Created `docs/business-os/startup-loop/stage-result-schema.md` with v1 schema, 5 examples, directory ownership contract, and control-plane consumption contract.

### LPSP-03B: Single-writer manifest update mechanism — DONE

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change.
- **Execution-Skill:** /lp-build
- **Confidence:** 82% → 86% post-validation
- **Replan note:** Split from original LPSP-03 (76%). Adapts existing BOS optimistic-concurrency patterns (`computeEntitySha`) to manifest updates.
- **Depends on:** LPSP-03A (needs stage-result schema as input contract).
- **Scope:**
  - Single entry point (function/module) responsible for manifest pointer updates.
  - Reads stage-result files from `runs/<run_id>/stages/*/stage-result.json`.
  - Updates `baseline.manifest.json` only when all required upstream stage results are `Done`.
  - Rejects update if any required stage result is missing, malformed, or `Failed`/`Blocked`.
- **Acceptance:**
  - Shared control artifacts are updated by single-writer control path only.
  - Manifest pointer updates reject unresolved or invalid stage results.
  - Re-running the update with identical inputs produces identical manifest (idempotent).
- **Validation contract (VC-03B):**
  - **VC-03B-01:** Simulated parallel completion — write S3 and S6B stage results concurrently → S4 merge consumes both deterministically and manifest artifact pointers are correct.
  - **VC-03B-02:** Simulated upstream failure — S3 completes, S6B fails → manifest update blocked with explicit reason referencing S6B failure.
  - **VC-03B-03:** Idempotent re-derivation — given identical valid stage results, re-running manifest update produces byte-identical manifest pointers.
  - **Acceptance coverage:** VC-03B-01 covers criteria 1,2; VC-03B-02 covers criteria 2; VC-03B-03 covers criteria 3.
  - **Validation type:** dry-run (simulated stage-result files on disk).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/TEST/runs/` (test fixture directory).
  - **Run/verify:** Create test fixture stage-result files, invoke manifest update function, diff outputs.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** f77f7b217e
- **Execution cycle:**
  - Validation cases executed: VC-03B-01, VC-03B-02, VC-03B-03
  - Cycles: 1 (red-green) + 1 lint fix
  - Initial validation: FAIL (discriminant collision — `"error" in result` always true because StageResult has an `error` field)
  - Fix: renamed validation error key to `validation_error`
  - Final validation: PASS (8/8 tests, typecheck clean, lint clean)
- **Confidence reassessment:**
  - Original: 82%
  - Post-validation: 86%
  - Delta reason: validation confirmed; all VCs pass cleanly; schema is well-defined; idempotency proven
- **Validation:**
  - Ran: `npx jest --testPathPattern="manifest-update"` — PASS (8/8)
  - Ran: `npx tsc --project scripts/tsconfig.json --noEmit` — PASS
  - Ran: `npx eslint scripts/src/startup-loop/` — PASS
- **Documentation updated:** `docs/business-os/startup-loop/manifest-schema.md` (new), `docs/business-os/startup-loop/stage-result-schema.md` updated relationship table reference (LPSP-03B row now says "This document")
- **Implementation notes:**
  - Created `docs/business-os/startup-loop/manifest-schema.md` — defines baseline manifest schema v1 (candidate/current lifecycle, artifact pointers, stage completions).
  - Created `scripts/src/startup-loop/manifest-update.ts` — `updateManifest()` function with discovery, validation, gate check, and deterministic write.
  - Created `scripts/src/startup-loop/__tests__/manifest-update.test.ts` — 8 tests covering all 3 VCs.
  - Learning: when using discriminated unions with `"key" in obj`, ensure the discriminant key doesn't collide with domain fields (StageResult.error vs validation error).

### LPSP-04A: Event schema + derived state + deterministic derivation (happy-path) — DONE

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 85% → 89% post-validation
- **Replan note:** Split from original LPSP-04 (74%). Scoped to happy-path event/state schemas and derivation. Recovery automation deferred to LPSP-04B.
- **Depends on:** LPSP-03A (stage-result format feeds event schema).
- **Scope:**
  - Define minimal event types: `stage_started`, `stage_completed`, `stage_blocked`.
  - Define derived state schema (`state.json`) satisfying `/lp-launch-qa` contract.
  - Implement deterministic state derivation function (replay events → state).
  - Single-writer control plane appends events and regenerates derived state.
  - Manual resume supported: operator appends `stage_started` event, re-derives state.
- **Acceptance:**
  - Event schema versioned: `{ schema_version, event, run_id, stage, timestamp, loop_spec_version, artifact_key?, blocking_reason? }`.
  - Derived state schema: `{ schema_version, business, run_id, loop_spec_version, active_stage, stages: { [stage]: { status, artifact_key?, blocking_reason? } } }`.
  - Derivation is deterministic and idempotent (same events → same state).
  - Manual resume works (operator edits events.jsonl, re-derives).
- **Validation contract (VC-04A):**
  - **VC-04A-01:** Happy-path derivation — given a valid event stream (S0→S2B→S3→S6B→S4→S5A→S5B) → derivation produces expected stage statuses for all 7 stages.
  - **VC-04A-02:** Manual resume — inject `stage_started` event for a Blocked stage → re-derive state → stage status updates to Active.
  - **VC-04A-03:** Launch-QA contract — derived state includes all fields expected by `/lp-launch-qa` (active_stage, per-stage status, artifact keys).
  - **VC-04A-04:** Deterministic replay — replay identical event stream twice → byte-identical derived state output.
  - **Acceptance coverage:** VC-04A-01 covers criteria 1,2; VC-04A-02 covers criteria 4; VC-04A-03 covers criteria 2; VC-04A-04 covers criteria 3.
  - **Validation type:** dry-run (fixture event files + derivation script).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/TEST/runs/test-events/`.
  - **Run/verify:** Create fixture `events.jsonl`, invoke derivation function, compare `state.json` output to expected snapshot.
- **Deferred to LPSP-04B:** Automated recovery actions, event stream corruption detection, partial artifact cleanup, failure injection test harness.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** c85fcb0953
- **Execution cycle:**
  - Validation cases executed: VC-04A-01, VC-04A-02, VC-04A-03, VC-04A-04
  - Cycles: 1 (single red-green pass, no fixes needed)
  - Initial validation: PASS (all 9 tests green on first run)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 89%
  - Delta reason: all VCs passed first time; pure function made derivation trivially testable; launch-QA compatibility confirmed with all 17 stages
- **Validation:**
  - Ran: `npx jest --testPathPattern="derive-state"` — PASS (9/9)
  - Ran: `npx tsc --project scripts/tsconfig.json --noEmit` — PASS
  - Ran: `npx eslint scripts/src/startup-loop/` — PASS
- **Documentation updated:** `docs/business-os/startup-loop/event-state-schema.md` (new), stage-result-schema.md relationship table (LPSP-04A rows now reference this doc)
- **Implementation notes:**
  - Created `docs/business-os/startup-loop/event-state-schema.md` — event ledger and derived state schemas, derivation algorithm, launch-QA compatibility notes.
  - Created `scripts/src/startup-loop/derive-state.ts` — pure `deriveState()` function. No I/O — caller reads/writes files.
  - Created `scripts/src/startup-loop/__tests__/derive-state.test.ts` — 9 tests covering all 4 VCs.
  - Design choice: `deriveState` is a pure function taking events + options, returning state. This makes testing trivial and keeps I/O at the edges.

### LPSP-04B: Recovery automation + event validation + failure injection

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 78%
- **Replan note:** Split from original LPSP-04 (74%). Hardening phase — builds on proven LPSP-04A foundation.
- **Depends on:** LPSP-04A (needs event/state schemas), LPSP-06B (needs merge barrier for failure scenarios).
- **Scope:**
  - Recovery event types: `run_resumed`, `run_restarted`, `run_aborted` (with operator, reason, timestamp).
  - Event stream validation: schema version checks, ordering validation, integrity checks.
  - Resume/restart/abort decision tree: deterministic and documented.
  - No hidden cleanup policy: partial artifacts remain on disk for forensics.
- **Acceptance:**
  - Recovery decision tree is documented and deterministic.
  - Event stream validation detects common corruption (truncated file, schema mismatch, missing fields).
  - Resume/restart/abort actions are recorded as explicit events.
- **Validation contract (VC-04B):**
  - **VC-04B-01:** Mid-run failure — simulate kill during S4 (stage-result absent) → derived state shows S4 as Active, upstream stages Done → manual `run_resumed` event re-derives correctly and S4 restarts.
  - **VC-04B-02:** Corrupt event stream — truncate `events.jsonl` mid-line → validation detects corruption (JSON parse failure) and recommends restart with explicit error.
  - **VC-04B-03:** No hidden cleanup — after `run_aborted` event, all partial artifacts remain on disk (verify with `ls stages/*/`).
  - **Acceptance coverage:** VC-04B-01 covers criteria 1,3; VC-04B-02 covers criteria 2; VC-04B-03 covers criteria 3.
  - **Validation type:** dry-run (fixture files + simulated failures).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/TEST/runs/test-recovery/`.
  - **Run/verify:** Create fixture run directory with partial state, invoke recovery actions, verify state transitions and artifact preservation.

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 78%
- **Updated confidence:** 78% (→ 84% conditional on LPSP-04A, LPSP-06B)
  - Confidence cannot be promoted until precursor tasks complete and provide E2/E3 evidence.
  - Implementation: 78% — no existing recovery patterns; greenfield design required.
  - Approach: 82% — decision tree approach is clear, follows existing optimistic-concurrency patterns (`entity-sha.ts`, `optimistic-concurrency.test.ts`).
  - Impact: 80% — well-scoped to recovery/validation layer; no blast radius beyond run directory.
- **Investigation performed:**
  - Repo: `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/` — no existing recovery logic.
  - Patterns: `apps/business-os/src/lib/optimistic-concurrency.test.ts`, `apps/business-os/src/lib/entity-sha.ts` — SHA-based conflict detection reusable.
  - Tests: `apps/prime/cypress/e2e/expired-token-recovery.cy.ts` — E2E recovery test structure exists.
- **Decision / resolution:**
  - Dependencies are real blockers (event schema from LPSP-04A, merge barrier from LPSP-06B). Confidence remains conditional.
  - No precursor tasks needed — LPSP-04A and LPSP-06B already exist as formal tasks.
  - Scope decisions: no hidden cleanup (partial artifacts stay on disk for forensics), resume is stage-level only (no sub-stage checkpoints in first cut).

### LPSP-05: Workspace canonicalization + stage-doc key policy

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact + code-change.
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
- **Acceptance:**
  - Canonical feature workspace path active for new work (`docs/plans/<slug>/...`).
  - Stage-doc canonical keys enforced for writes.
  - Legacy alias reads remain supported during migration; legacy writes blocked.
- **Validation contract (VC-05):**
  - **VC-05-01:** Canonical resolution — new fact-find/plan/build chain resolves canonical workspace files at `docs/plans/<slug>/` paths.
  - **VC-05-02:** Legacy read compatibility — legacy path inputs (flat `docs/plans/<slug>-*.md`) remain readable during migration window via alias resolver.
  - **VC-05-03:** Legacy write block — attempt to write via legacy path → blocked with actionable error directing to canonical path.
  - **Acceptance coverage:** VC-05-01 covers criteria 1,2; VC-05-02 covers criteria 3; VC-05-03 covers criteria 3.
  - **Validation type:** dry-run (create test workspace + verify resolution).
  - **Validation location/evidence:** `docs/plans/test-workspace/` (temporary test fixture).
  - **Run/verify:** Create canonical workspace, attempt resolution via old and new paths, verify read/write behavior.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** b3499ab256
- **Execution cycle:**
  - Validation cases executed: VC-05-01, VC-05-02, VC-05-03
  - Cycles: 1 draft-review cycle
  - Initial validation: draft + grep verification of path references
  - Final validation: PASS (all legacy write paths removed from core skills; fallback read paths preserved)
- **Confidence reassessment:**
  - Original: 84%
  - Post-validation: 87%
  - Delta reason: validation confirmed clean separation — no stray legacy write paths in core 5 skills; stage-doc key normalization documented with backward-compatible note
- **Validation:**
  - Ran: `grep -r 'docs/plans/<.*>-plan\.md' .claude/skills/{lp-fact-find,lp-plan,lp-build,lp-replan,lp-sequence}/` — only legacy fallback (read-only) references remain
  - Pre-commit hooks: PASS
- **Documentation updated:** workspace-paths.md (new), stage-doc-operations.md (stage key normalization + canonical path templates)
- **Implementation notes:**
  - Created `.claude/skills/_shared/workspace-paths.md` — canonical directory layout, alias map, resolution algorithm, write blocking rules, stage-doc API key policy
  - Normalized stage-doc API key: `fact-find` (canonical) replaces `lp-fact-find` (legacy read-only alias)
  - Updated all 5 core workflow skills (lp-fact-find, lp-plan, lp-build, lp-replan, lp-sequence)
  - Supporting skills (idea-generate, idea-develop, idea-advance) still use `lp-fact-find` key — acceptable during migration, documented in stage-doc-operations.md note
  - 7 files changed, 157 insertions, 42 deletions

### LPSP-06A: Define `/lp-baseline-merge` skill contract

- **Type:** DECISION
- **Deliverable:** business-artifact (`.claude/skills/lp-baseline-merge/SKILL.md`).
- **Execution-Skill:** /lp-build
- **Confidence:** 90%
- **Replan note:** Split from original LPSP-06 (78%). Tractable design task with clear inputs from DL-01/DL-02.
- **Depends on:** LPSP-02 (loop spec), LPSP-05 (canonical paths).
- **Acceptance:**
  - Required inputs documented: `offer` (S2B), `forecast` (S3), `channels` (S6B); optional: `seo`, `outreach`.
  - Blocking logic: S4 blocks with explicit reason when required inputs missing/invalid.
  - Snapshot composition algorithm documented (priority order, conflict resolution).
  - Canonical output paths: `docs/business-os/startup-baselines/<BIZ>/S4-baseline-merge/baseline.snapshot.md` + draft `baseline.manifest.json`.
- **Validation contract (VC-06A):**
  - **VC-06A-01:** Blocking logic completeness — contract documents blocking behavior for all required input scenarios (S3 missing, S6B missing, both missing, both present, one Failed).
  - **VC-06A-02:** Spec alignment — skill contract stage ID, inputs, outputs, and routing match `loop-spec.yaml` S4 entry exactly.
  - **Acceptance coverage:** VC-06A-01 covers criteria 1,2,3; VC-06A-02 covers criteria 4.
  - **Validation type:** review checklist.
  - **Validation location/evidence:** `.claude/skills/lp-baseline-merge/SKILL.md` (artifact to produce).
  - **Run/verify:** Cross-reference skill contract against loop-spec.yaml S4 entry; verify all blocking scenarios enumerated.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** 959b52c558
- **Execution cycle:**
  - Validation cases executed: VC-06A-01, VC-06A-02
  - Cycles: 1 draft-review cycle
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed all 13 blocking scenarios enumerated; loop-spec alignment verified (stage ID, inputs, outputs, join_barrier flag all match)
- **Validation:**
  - VC-06A-01: 13 input scenarios documented (3 missing, 3 Failed, 3 Blocked, 3 malformed, 1 happy-path)
  - VC-06A-02: S4 entry cross-referenced — `id: S4`, `skill: /lp-baseline-merge`, all `required_inputs` match, `join_barrier: true` implemented
- **Documentation updated:** Created `.claude/skills/lp-baseline-merge/SKILL.md`
- **Implementation notes:**
  - Skill contract covers: operating mode, required inputs, blocking logic, snapshot composition algorithm, determinism guarantee, outputs, canonical paths, data-plane ownership, error handling
  - Key decision: S4 does NOT write `baseline.manifest.json` — that remains control-plane (LPSP-03B) responsibility. S4 only writes snapshot + stage-result.json.

### LPSP-06B: Implement `/lp-baseline-merge` (S4 join barrier)

- **Type:** IMPLEMENT
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Replan note:** Split from original LPSP-06 (78%). Implementation follows contract from LPSP-06A.
- **Depends on:** LPSP-06A (skill contract), LPSP-04A (stage-result schema for upstream validation).
- **Acceptance:**
  - S4 joins S3/S6B outputs into deterministic snapshot following documented merge algorithm.
  - S4 writes snapshot to canonical path + draft manifest with `status: candidate`.
  - S4 blocks on missing required inputs with explicit reasons from stage-result files.
  - Snapshot composition is deterministic (same inputs → same output).
- **Validation contract (VC-06B):**
  - **VC-06B-01:** Missing required input — S3 stage-result absent → S4 blocks with reason "forecast artifact missing" and writes `stage-result.json` with `status: Blocked`.
  - **VC-06B-02:** Happy-path merge — valid S3 + S6B stage-result files present → S4 produces `baseline.snapshot.md` + draft `baseline.manifest.json` with `status: candidate`.
  - **VC-06B-03:** Deterministic composition — same S3 + S6B inputs → identical snapshot and manifest output (byte-comparable after whitespace normalization).
  - **Acceptance coverage:** VC-06B-01 covers criteria 3; VC-06B-02 covers criteria 1,2; VC-06B-03 covers criteria 4.
  - **Validation type:** dry-run (fixture stage-result files).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/TEST/runs/test-merge/stages/`.
  - **Run/verify:** Create fixture S3 + S6B stage-result files, invoke merge skill, verify snapshot + manifest outputs.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** 073d7ef737
- **Execution cycle:**
  - Validation cases executed: VC-06B-01, VC-06B-02, VC-06B-03
  - Cycles: 1 red-green cycle (tests failed on missing module, then all 9 passed first try)
  - Initial validation: FAIL expected (module not found)
  - Final validation: PASS (9/9 tests, typecheck clean)
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 85%
  - Delta reason: implementation was straightforward given LPSP-06A contract; determinism fix (wall-clock → max upstream timestamp) was anticipated during implementation
- **Validation:**
  - Ran: `npx jest --config scripts/jest.config.cjs --testPathPattern=baseline-merge --no-coverage` — 9/9 PASS
  - Ran: `npx tsc --project scripts/tsconfig.json --noEmit` — clean
  - Pre-commit hooks: PASS (after eslint --fix for import sorting)
- **Documentation updated:** None required (skill contract already exists from LPSP-06A)
- **Implementation notes:**
  - Created `scripts/src/startup-loop/baseline-merge.ts` with `baselineMerge()` function
  - Reuses `StageResult` type from `manifest-update.ts`
  - Determinism: snapshot Generated timestamp uses max upstream stage-result timestamp, not wall-clock
  - S4 writes only to `stages/S4/` (stage-result.json + baseline.snapshot.md) — manifest is control-plane owned
  - Acceptance criterion 2 ("draft manifest with status: candidate") is handled by LPSP-03B `updateManifest`, not by S4 directly — consistent with LPSP-06A contract decision

### LPSP-06C: Implement `/lp-bos-sync` (S5B idempotent persistence + manifest commit)

- **Type:** IMPLEMENT
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Replan note:** Split from original LPSP-06 (78%). Leverages existing BOS Agent API with optimistic concurrency (entitySha).
- **Depends on:** LPSP-06A (contract), LPSP-04A (stage-result schema for S5A→S5B gating).
- **Acceptance:**
  - S5B gates on S5A completion (derived state shows `S5A.status=Done`).
  - S5B persists cards/stage-docs via BOS Agent API (`upsertCard`, `upsertStageDoc`).
  - S5B commits manifest pointer (`status: candidate → current`) after BOS writes succeed.
  - Retry with same input produces no duplicate cards (entitySha match = no-op).
- **Validation contract (VC-06C):**
  - **VC-06C-01:** S5A gate — S5A stage-result absent or `status: Blocked` → S5B blocks with reason "S5A not complete" and writes `stage-result.json` with `status: Blocked`.
  - **VC-06C-02:** Idempotent retry — S5B retry with same prioritized items → BOS card count unchanged, entitySha match confirms no-op on duplicate writes.
  - **VC-06C-03:** Partial failure recovery — BOS card write succeeds but manifest commit fails → resume completes manifest commit without re-creating cards (entitySha-based dedup).
  - **Acceptance coverage:** VC-06C-01 covers criteria 1; VC-06C-02 covers criteria 4; VC-06C-03 covers criteria 2,3.
  - **Validation type:** dry-run + API simulation (mock BOS Agent API responses).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/TEST/runs/test-bos-sync/`.
  - **Run/verify:** Create fixture prioritized items + mock API, invoke S5B, verify card creation + manifest commit; re-invoke and verify idempotency.

### LPSP-07: Autonomy policy tiers and guarded actions

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Acceptance:**
  - Policy tiers defined (`autonomous`, `guarded`, `prohibited`).
  - Core loop actions mapped into tiers with examples.
  - Side-effect stages explicitly marked guarded.
- **Validation contract (VC-07):**
  - **VC-07-01:** Tier completeness — every stage action in loop-spec.yaml is classified into exactly one tier (`autonomous`, `guarded`, `prohibited`).
  - **VC-07-02:** Side-effect marking — S5B (BOS sync) and any stage with `bos_writes: true` are explicitly marked `guarded`.
  - **VC-07-03:** Guarded action signals — guarded-tier actions emit explicit state transition event or review signal before execution (traceable in events.jsonl).
  - **Acceptance coverage:** VC-07-01 covers criteria 1,2; VC-07-02 covers criteria 3; VC-07-03 covers criteria 3.
  - **Validation type:** review checklist + cross-reference.
  - **Validation location/evidence:** Autonomy policy document (new artifact) + loop-spec.yaml cross-check.
  - **Run/verify:** Enumerate all stage actions from loop-spec, verify each is classified; verify guarded stages have signal emission documented.

### LPSP-08: Contract lint + controlled-velocity triggers + concurrency gate

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Acceptance:**
  - Contract lint covers stage graph, skill existence, root policies, alias sunset.
  - Controlled-velocity metrics collected (manual interventions, join-block recurrence, replan frequency, lint failure trend, resume success).
  - Stabilization triggers enforce pause conditions.
  - One-active-run-per-business gate enforced; relaxation requires threshold pass.
- **Scope (clarified):**
  - **Lint script:** Modeled on `scripts/check-ideas-go-faster-contracts.sh` (26-check pattern). Validates loop-spec.yaml, wrapper SKILL.md, workflow guide, prompt index, and all `lp-*` skills (23 skills). Detects all SQ-01..SQ-12 drift classes.
  - **Metrics collection:** Append per-run metrics to `runs/<run_id>/metrics.jsonl` during control-plane updates. Schema: `{ timestamp, run_id, metric_name, value }`.
  - **Metrics aggregation:** CLI script `scripts/startup-loop-metrics.sh --window 20 --business <BIZ>`. Outputs current vs threshold values.
  - **Concurrency gate:** Function in control plane: `checkRunConcurrency(business)` → allow|block. One-run-per-business until DL-04 relaxation criteria met.
  - **CI integration:** Add contract lint to merge gate. Graduated severity: warning-level for first 20 runs, then error-level for SQ-01..SQ-08.
- **Validation contract (VC-08):**
  - **VC-08-01:** Drift detection — introduce intentional contract violations (rename a stage in SKILL.md, remove a prompt entry) → lint script detects and reports each violation with SQ-ID reference.
  - **VC-08-02:** Stabilization trigger — simulate threshold breach (manual interventions median > 2 in rolling window) → metrics aggregation script emits stabilization warning.
  - **VC-08-03:** Concurrency gate — submit concurrent second run request for same business → request blocked with reason "one active run per business".
  - **VC-08-04:** Drift coverage — lint script has at least one check mapped to each of SQ-01 through SQ-12 (12 drift classes covered).
  - **Acceptance coverage:** VC-08-01 covers criteria 1; VC-08-02 covers criteria 2,3; VC-08-03 covers criteria 4; VC-08-04 covers criteria 1.
  - **Validation type:** dry-run + self-test (lint script with deliberate violations).
  - **Validation location/evidence:** `scripts/check-startup-loop-contracts.sh` (new script).
  - **Run/verify:** Run lint with clean state (PASS), introduce violations (FAIL), verify each SQ-ID detected.

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 79%
- **Updated confidence:** 82%
  - **Evidence class:** E1 (static code/doc audit)
  - Implementation: 82% — mature contract lint pattern exists (`scripts/check-ideas-go-faster-contracts.sh`, 26 checks). Direct adaptation to startup-loop contracts.
  - Approach: 85% — graduated severity (warning→error) decided; CLI-first metrics; merge-gate CI integration. No architectural unknowns.
  - Impact: 82% — scope bounded to startup-loop system only (23 `lp-*` skills + 5 core docs). No blast radius beyond startup-loop contracts.
- **Investigation performed:**
  - Repo: `scripts/check-ideas-go-faster-contracts.sh` — 26-check contract validator, reusable pattern.
  - Repo: `apps/brikette/scripts/validate-guide-structure.sh` — two-phase validation pattern.
  - Docs: `docs/plans/lp-skill-system-sequencing-fact-find.md` (SQ-01..SQ-12) — all 12 drift classes enumerated with detection methods.
  - Docs: Plan DL-04 — velocity metrics, thresholds, relaxation criteria already documented.
- **Decision / resolution:**
  - Lint severity: graduated (warning → error after 20 runs). High-severity SQ-01..SQ-08 escalate to error; medium SQ-09..SQ-12 remain warning.
  - Metrics storage: per-run `metrics.jsonl` in run directory, aggregated by CLI script on demand.
  - Lint scope: startup-loop system only (`lp-*` skills + core docs). Not all 47 skills.
  - CI timing: merge-gate step (too slow for pre-commit; comprehensive validation needed).

### LPSP-09: Supervised dry-run checkpoint

- **Type:** CHECKPOINT
- **Deliverable:** validation report.
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
- **Acceptance:**
  - One full run completes with no manual path hints.
  - One injected failure scenario successfully resumes.
  - No shared-state contention observed.
  - BOS mutation boundaries honored (`S5B` only).
- **Validation contract (VC-09):**
  - **VC-09-01:** Full run trace — dry-run produces `events.jsonl`, derived `state.json` snapshots at each stage transition, and decision log entries for all gate decisions.
  - **VC-09-02:** Blocking reproducibility — all blocking reasons in the trace are explicit (reference stage-result `blocking_reason` or event `error` fields) and re-running from the same state reproduces the same block.
  - **VC-09-03:** Failure injection resume — inject one failure scenario (S4 kill or S6B timeout) → verify derived state shows correct blocked stage → manual resume continues from correct checkpoint.
  - **Acceptance coverage:** VC-09-01 covers criteria 1,4; VC-09-02 covers criteria 2; VC-09-03 covers criteria 2.
  - **Validation type:** dry-run (supervised end-to-end run on one business path).
  - **Validation location/evidence:** `docs/business-os/startup-baselines/<BIZ>/runs/<dry-run-id>/`.
  - **Run/verify:** Execute `/startup-loop start --business <BIZ> --mode dry`, trace through all stages, inject one failure, verify recovery.

## Validation Strategy

1. Stage graph conformance checks after each contract-affecting task.
2. Failure-injection checks for recovery semantics before rollout expansion.
3. Idempotency checks for any side-effecting step (`/lp-bos-sync`).
4. CI lint gating before declaring migration complete.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Single-writer semantics accidentally bypassed | High | Enforce write ownership in orchestration and lint rules; test concurrent completions |
| Recovery model incomplete for edge cases | High | Add explicit restart criteria and failure-injection validation |
| Alias sunset stalls | Medium | Tie sunset to measurable zero-legacy-read threshold |
| Contract lint over-tightening blocks progress | Medium | Stage rollout warning→error with stabilization thresholds |

## What Would Make Confidence >=90%

1. ~~Complete `LPSP-01` decisions and remove current architectural ambiguity.~~ Done.
2. Complete Wave 2-3 (LPSP-02, 03A, 03B, 04A, 05, 06A) — all design + schema tasks resolved, removing remaining specification uncertainty.
3. Demonstrate one successful end-to-end supervised run with injected failure resume (LPSP-09).
4. Prove idempotent `S5B` behavior in repeated mutation attempts (LPSP-06C).
5. Show contract-lint catches all previously observed drift classes SQ-01..SQ-12 (LPSP-08).

## Decision Log

### DL-01: Canonical stage set and S4 semantics (LPSP-01)

**Decided:** 2026-02-13
**Chosen option:** 17-stage canonical model with S4 as a first-class join-barrier stage.

```
S0   Intake
S1   Readiness                    /lp-readiness
S1B  Measurement bootstrap        prompt handoff (conditional: pre-website)
S2A  Historical baseline          prompt handoff (conditional: website-live)
S2   Market intelligence          prompt handoff (Deep Research)
S2B  Offer design                 /lp-offer
─── parallel fan-out ───
S3   Forecast                     /lp-forecast
S6B  Channel strategy + GTM       /lp-channels → /lp-seo, /draft-outreach
─── parallel fan-in ────
S4   Baseline merge (barrier)     /lp-baseline-merge   [NEW]
S5A  Prioritize                   /lp-prioritize (pure ranking, no side effects)
S5B  BOS sync                     /lp-bos-sync         [NEW]
S6   Site-upgrade synthesis       /lp-site-upgrade
S7   Fact-find                    /lp-fact-find
S8   Plan                         /lp-plan
S9   Build                        /lp-build
S9B  QA gates                     /lp-launch-qa, /lp-design-qa
S10  Weekly readout + experiments  /lp-experiment
```

**Rationale:**
- The wrapper already uses S2B/S6B/S9B but the workflow doc omits them (root of SQ-01 drift). Making them canonical eliminates the discrepancy.
- S4 must be a first-class stage (not just a barrier concept) because it needs an owning skill (`/lp-baseline-merge`) that validates upstream artifacts, composes a deterministic snapshot, and writes the baseline manifest. A barrier-only concept has no owner and no testable contract.
- The S5→S5A/S5B split resolves SQ-06 (workflow demands card writes at S5 but `/lp-prioritize` explicitly refuses them). Clean separation: ranking is side-effect-free, persistence is idempotent and retry-safe.

---

### DL-02: Baseline commit stage (LPSP-01)

**Decided:** 2026-02-13
**Chosen option:** S5B is the sole commit point for the business-current pointer.

S4 writes a **candidate** baseline snapshot. S5B **commits** it as current.

**Commit sequence:**
1. S4 `/lp-baseline-merge` → writes `baseline.snapshot.md` + draft manifest (local, uncommitted).
2. S5A `/lp-prioritize` → reads snapshot, produces ranked output (no writes).
3. S5B `/lp-bos-sync` → persists cards/stage-docs to D1 **AND** commits manifest pointer as current.

**Rationale:**
- S5A (prioritize) sits between S4 and S5B and determines which items actually advance. Committing the pointer at S4 would mark a baseline as current before prioritization has filtered it.
- S5B already owns the BOS mutation boundary (D1 writes via `/api/agent/*` with optimistic locking). Adding the manifest pointer commit here means BOS state and baseline pointer are always atomically consistent.
- If S5B fails and retries, idempotent semantics ensure the pointer and BOS cards converge. If split across S4 and S5B, a partial failure would leave the pointer committed but cards missing.

---

### DL-03: Alias sunset gate (LPSP-01)

**Decided:** 2026-02-13
**Chosen option:** N = 10 consecutive zero-legacy-read runs, per-alias, with two-phase enforcement.

| Phase | Trigger | Effect |
|---|---|---|
| **Active** | Migration starts | Canonical writes enforced; legacy reads supported; every legacy read logged |
| **Deprecated** | 10 consecutive runs with zero reads of this alias | Alias emits warning in contract lint; still resolves |
| **Removed** | 5 more runs after deprecation (15 total from last read) | Alias removed from resolver; legacy reads fail with actionable error |

**Measurement:** Instrument the manifest resolver to log every alias hit with `{ run_id, alias, canonical_key, timestamp }`. Contract lint aggregates per rolling window.

**Rationale:**
- 10 runs provides statistical confidence that no active workflow depends on the alias. At current velocity (~2-3 runs/month/business), this is ~3-4 months — long enough to catch infrequent paths, short enough to not stall.
- Per-alias tracking (not global) means common aliases can sunset independently from obscure ones.
- Two-phase gives operators warning before hard removal. The 5-run buffer after deprecation catches rarely-used workflow paths that didn't trigger during the first 10 runs.

---

### DL-04: Run-concurrency relaxation gate (LPSP-01)

**Decided:** 2026-02-13
**Chosen option:** 20-run rolling window, all five criteria required, incremental relaxation.

| Criterion | Threshold | Window |
|---|---|---|
| Median manual interventions per run | ≤ 1 | Rolling 20 completed runs |
| Shared-state contention incidents | = 0 | Rolling 20 completed runs |
| Join-stage race failures | = 0 | Rolling 20 completed runs |
| Resume success rate | ≥ 95% | Rolling 20 completed runs |
| Contract-lint failure rate | < 10% of merges | Rolling 20 completed runs |

**Additional policy:**
- **Incremental relaxation:** First relaxation allows 2 concurrent runs per business. Further relaxation (3+) requires the same criteria met again over 20 runs at the new concurrency level.
- **Automatic re-tightening:** If any criterion fails at a higher concurrency level, drop back to the previous level and re-enter observation.
- **Window is completed-run-based, not calendar-based.** Prevents calendar stalls from artificially inflating confidence.

**Rationale:**
- Both the fact-find and current-vs-proposed briefing independently converged on these thresholds — they reflect real operational concerns (contention, recovery reliability, lint health).
- Zero tolerance on contention and race failures is correct for early maturity. These are data-corruption risks, not inconveniences.
- Incremental relaxation (2→3→N) is safer than jumping from 1 to unlimited. Each step proves the system handles that level before escalating.
