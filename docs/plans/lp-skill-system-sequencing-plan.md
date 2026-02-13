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
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact) — LPSP-01 resolved, no unresolved DECISION tasks
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
| LPSP-01 | DECISION | Finalize runtime contract decisions (stage set, baseline commit stage, concurrency policy, alias sunset gate) | 88% | S | Done | - | LPSP-02, LPSP-03, LPSP-05 |
| LPSP-02 | IMPLEMENT | Add runtime-authoritative loop spec and align wrapper/workflow/prompt index | 82% | M | Pending | LPSP-01 | LPSP-06, LPSP-08 |
| LPSP-03 | IMPLEMENT | Introduce stage-result + single-writer control semantics (manifest + derived state updates) | 76% | L | Pending | LPSP-01 | LPSP-04, LPSP-07 |
| LPSP-04 | IMPLEMENT | Add event-sourced run ledger + derived state schema + recovery semantics | 74% | L | Pending | LPSP-03 | LPSP-06, LPSP-08 |
| LPSP-05 | IMPLEMENT | Canonicalize feature workspace + stage-doc key policy + alias handling | 84% | M | Pending | LPSP-01 | LPSP-06 |
| LPSP-06 | IMPLEMENT | Implement deterministic S4 merge barrier and S5A/S5B split (`lp-prioritize` + `lp-bos-sync`) | 78% | L | Pending | LPSP-02, LPSP-04, LPSP-05 | LPSP-08 |
| LPSP-07 | IMPLEMENT | Define autonomy policy tiers and enforce guarded side-effect boundary | 80% | M | Pending | LPSP-03 | LPSP-08 |
| LPSP-08 | IMPLEMENT | Add contract lint + controlled-velocity metrics/triggers + run-concurrency gate | 79% | M | Pending | LPSP-02, LPSP-04, LPSP-06, LPSP-07 | LPSP-09 |
| LPSP-09 | CHECKPOINT | Validate end-to-end supervised dry run on one business path | 86% | M | Pending | LPSP-08 | - |

## Active Tasks

- `LPSP-01` (DECISION) — **Done**. Decisions recorded in Decision Log below.
- `LPSP-02` (IMPLEMENT), `LPSP-03` (IMPLEMENT), `LPSP-05` (IMPLEMENT) are now unblocked (Wave 2/3).

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | LPSP-01 | - | Resolve remaining contract decisions once, before code/docs divergence increases |
| 2 | LPSP-02, LPSP-05 | LPSP-01 | Stage/spec alignment and workspace/key policy can proceed in parallel |
| 3 | LPSP-03 | LPSP-01 | Establish single-writer semantics before event-derived runtime |
| 4 | LPSP-04, LPSP-07 | LPSP-03 | Recovery/event model and autonomy policy can progress together |
| 5 | LPSP-06 | LPSP-02, LPSP-04, LPSP-05 | Merge barrier and S5 split depend on contract + runtime state |
| 6 | LPSP-08 | LPSP-02, LPSP-04, LPSP-06, LPSP-07 | Guardrails and metrics after core orchestration semantics are in place |
| 7 | LPSP-09 | LPSP-08 | End-to-end supervised dry-run validation |

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

### LPSP-02: Add runtime-authoritative loop spec and align docs/wrapper

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact + code-change.
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Affects:**
  - `docs/business-os/startup-loop/loop-spec.yaml` (new)
  - `.claude/skills/startup-loop/SKILL.md`
  - `docs/business-os/startup-loop-workflow.user.md`
  - `docs/business-os/workflow-prompts/README.user.md`
- **Acceptance:**
  - Wrapper stage graph matches loop spec.
  - Workflow stage graph matches loop spec.
  - Prompt index covers all spec stages or marks `no-prompt-required`.
  - Run packet contract includes `loop_spec_version`.
- **Validation contract (VC-02):**
  - Spec/doc/wrapper graph diff check passes.
  - No unresolved stage aliasing in active stage map.

### LPSP-03: Stage-result + single-writer control semantics

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 76%
- **Affects (expected):**
  - Startup-loop orchestration implementation path.
  - Baseline manifest update mechanism.
  - Stage result file schema (new).
- **Acceptance:**
  - Stage workers publish stage-owned outputs and stage result files only.
  - Shared control artifacts are updated by single-writer control path only.
  - Manifest pointer updates reject unresolved or invalid stage results.
- **Validation contract (VC-03):**
  - Simulated parallel stage completion cannot produce manifest write contention.
  - Single-writer path can deterministically re-derive pointers.

### LPSP-04: Event-sourced run ledger + derived state + recovery

- **Type:** IMPLEMENT
- **Deliverable:** code-change + business-artifact.
- **Execution-Skill:** /lp-build
- **Confidence:** 74%
- **Affects (expected):**
  - `runs/<run_id>/events.jsonl` schema
  - `runs/<run_id>/state.json` derived view
  - Recovery handling in startup-loop orchestration
- **Acceptance:**
  - Runs append events as source of truth.
  - Derived state reproduces stage statuses and blockers.
  - Recovery actions (`resume`, `restart`, `abort`) are recorded and replayable.
- **Validation contract (VC-04):**
  - Mid-run failure simulation resumes from last `Done` stage.
  - Corrupt event stream simulation triggers controlled restart behavior.
  - No hidden cleanup of partial artifacts.

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

### LPSP-06: Deterministic S4 merge + S5A/S5B split

- **Type:** IMPLEMENT
- **Deliverable:** code-change + skill-contract update.
- **Execution-Skill:** /lp-build
- **Confidence:** 78%
- **Acceptance:**
  - `/lp-baseline-merge` validates required upstream artifacts and composes deterministic snapshot.
  - `S5A` remains side-effect free (`/lp-prioritize`).
  - `S5B` (`/lp-bos-sync`) is sole mutation boundary for BOS writes.
  - `bos-sync` is idempotent under retry.
- **Validation contract (VC-06):**
  - Join stage blocks on missing required inputs with explicit reasons.
  - Re-running S5B does not duplicate or diverge BOS records.

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

1. Complete `LPSP-01` decisions and remove current architectural ambiguity.
2. Demonstrate one successful end-to-end supervised run with injected failure resume.
3. Prove idempotent `S5B` behavior in repeated mutation attempts.
4. Show contract-lint catches all previously observed drift classes (SQ-01..SQ-12).

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
