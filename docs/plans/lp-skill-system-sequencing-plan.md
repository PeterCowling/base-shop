---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-skill-system-sequencing
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact) — LPSP-01 resolved; sub-80% tasks split and replanned
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
| LPSP-03A | IMPLEMENT | Define stage-result schema + data-plane ownership contract | 84% | S | Pending | LPSP-01 | LPSP-03B, LPSP-04A |
| LPSP-03B | IMPLEMENT | Implement single-writer manifest update mechanism | 82% | M | Pending | LPSP-03A | LPSP-07 |
| LPSP-04A | IMPLEMENT | Define event schema + derived state schema + deterministic derivation (happy-path) | 85% | M | Pending | LPSP-03A | LPSP-06B, LPSP-06C, LPSP-08 |
| LPSP-04B | IMPLEMENT | Add recovery automation (resume/restart/abort) + event validation + failure injection | 78% | M | Pending | LPSP-04A, LPSP-06B | LPSP-09 |
| LPSP-05 | IMPLEMENT | Canonicalize feature workspace + stage-doc key policy + alias handling | 84% | M | Pending | LPSP-01 | LPSP-06A |
| LPSP-06A | DECISION | Define `/lp-baseline-merge` skill contract (inputs, blocking logic, output paths) | 90% | S | Pending | LPSP-02, LPSP-05 | LPSP-06B, LPSP-06C |
| LPSP-06B | IMPLEMENT | Implement `/lp-baseline-merge` (S4 join barrier) | 80% | M | Pending | LPSP-06A, LPSP-04A | LPSP-04B, LPSP-08 |
| LPSP-06C | IMPLEMENT | Implement `/lp-bos-sync` (S5B idempotent persistence + manifest commit) | 80% | M | Pending | LPSP-06A, LPSP-04A | LPSP-08 |
| LPSP-07 | IMPLEMENT | Define autonomy policy tiers and enforce guarded side-effect boundary | 80% | M | Pending | LPSP-03B | LPSP-08 |
| LPSP-08 | IMPLEMENT | Add contract lint + controlled-velocity metrics/triggers + run-concurrency gate | 80% | M | Pending | LPSP-02, LPSP-04A, LPSP-06B, LPSP-06C, LPSP-07 | LPSP-09 |
| LPSP-09 | CHECKPOINT | Validate end-to-end supervised dry run on one business path | 86% | M | Pending | LPSP-08, LPSP-04B | - |

## Active Tasks

- `LPSP-01` (DECISION) — **Done**. Decisions recorded in Decision Log below.
- `LPSP-02`, `LPSP-03A`, `LPSP-05` are now unblocked (Wave 2).

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

### LPSP-03A: Stage-result schema + data-plane ownership contract

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact (schema definition + examples).
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
- **Replan note:** Split from original LPSP-03 (76%) to separate schema design from control-plane implementation.
- **Scope:**
  - Define stage-result file format that parallel workers emit after completing stage work.
  - Document directory ownership contract: `runs/<run_id>/stages/<stage>/` is stage-owned, `baseline.manifest.json` is control-plane-owned.
- **Acceptance:**
  - Stage-result schema defined: `{ schema_version, run_id, stage, status: "Done"|"Failed"|"Blocked", produced_keys[], artifacts{}, error?, blocking_reason? }`.
  - Schema examples for 3+ stages (S2B, S3, S6B).
  - Clear contract: workers write only to stage-owned directories + emit `stage-result.json`.
  - No worker touches manifest or shared state files.
- **Validation contract (VC-03A):**
  - Hand-crafted stage-result files from simulated parallel workers can be consumed by control plane.
  - Missing/malformed stage-result files are detectable and reportable.

### LPSP-03B: Single-writer manifest update mechanism

- **Type:** IMPLEMENT
- **Deliverable:** code-change.
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
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
  - Simulated parallel completion: write S3 and S6B stage results concurrently, verify S4 merge can consume both deterministically.
  - Simulated failure: S3 completes, S6B fails → manifest update blocked with explicit reason.
  - Re-derivation: given valid stage results, re-running produces identical manifest pointers.

### LPSP-04A: Event schema + derived state + deterministic derivation (happy-path)

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
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
  - Given a valid event stream, derivation reproduces expected stage statuses.
  - Given a manually injected `stage_completed` event, derivation updates state correctly.
  - Derived state satisfies `/lp-launch-qa` expected contract fields.
- **Deferred to LPSP-04B:** Automated recovery actions, event stream corruption detection, partial artifact cleanup, failure injection test harness.

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
  - Mid-run failure simulation: kill during S4, verify derived state shows Active/Blocked, manual resume continues from correct checkpoint.
  - Corrupt event stream simulation: truncate events.jsonl, verify validation detects corruption and recommends restart.
  - No hidden cleanup: after abort, all partial artifacts remain accessible.

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
  - New fact-find/plan/build chain resolves canonical workspace files.
  - Legacy path inputs remain readable during migration window.

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
  - Blocking logic examples cover all required input scenarios.
  - Skill contract aligns with loop-spec stage graph from LPSP-02.

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
  - Simulated missing S3 output → S4 blocks with reason "forecast artifact missing".
  - Valid S3 + S6B outputs → S4 produces snapshot + manifest.

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
  - S5A incomplete → S5B blocks with explicit reason.
  - S5B retry (same prioritized items) → BOS card count unchanged, entitySha confirms idempotency.
  - S5B partial failure (BOS write succeeds, manifest commit fails) → resume completes manifest without duplicate writes.

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
  - Policy classification is referenced by wrapper route behavior.
  - Guarded actions emit explicit state transition or review signals.

### LPSP-08: Contract lint + controlled-velocity triggers + concurrency gate

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 79%
- **Acceptance:**
  - Contract lint covers stage graph, skill existence, root policies, alias sunset.
  - Controlled-velocity metrics collected (manual interventions, join-block recurrence, replan frequency, lint failure trend, resume success).
  - Stabilization triggers enforce pause conditions.
  - One-active-run-per-business gate enforced; relaxation requires threshold pass.
- **Validation contract (VC-08):**
  - Intentional contract violations fail lint.
  - Simulated threshold breach toggles stabilization mode.
  - Concurrent second run request is queued/blocked per policy.

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
  - Dry-run trace includes run events, derived state snapshots, and decision log.
  - All blocking reasons are explicit and reproducible.

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
