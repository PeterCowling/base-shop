---
Type: Plan
Status: Active
Domain: Business-OS
Workstream: Venture-Studio
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-from-spec-skill-library
Related-Fact-Find: docs/plans/startup-from-spec-skill-library-fact-find.md
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-plan, idea-generate, idea-readiness
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact) with confidence-raising DECISION/CHECKPOINT tasks
Business-OS-Integration: on
Business-Unit: BOS
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# Startup-From-Spec Skill Library Plan

## Summary

Implement a startup-native, high-contribution skill library that converts a product specification directly into a 90-day execution system for B2C startup businesses. This plan keeps existing delivery discipline (`lp-do-fact-find -> lp-do-plan -> lp-do-build`) while replacing fixed seeding behavior with adaptive context-budget seeding.

## Locked Decisions

1. First rollout businesses: `HEAD` and `PET`.
2. Run `HEAD` and `PET` as parallel but separated tracks.
3. Budgets are separate per business.
4. Launch geography is Italy.
5. Preorders are allowed before stock arrives.
6. Product order-to-availability planning assumes ~60 days.
7. Startup flow may bypass ideas generation, but any approved build work must enter `lp-do-fact-find -> lp-do-plan -> lp-do-build`.

## Goals

1. Build `/startup-from-spec` as a spec-to-launch orchestrator for startup execution.
2. Deliver heavy first-pass contribution with blocker-only questioning.
3. Establish mandatory startup baseline from business intent + existing kanban/idea context before generating new Go items.
4. Produce computed outputs for budget, channel, unit economics, supply timing, and weekly K/P/C/S decisions.
5. Replace fixed Top-K seeding with adaptive seeding based on context headroom and item complexity.
6. Preserve execution rigor by mandatory handoff into existing delivery gates.

## Non-goals

1. Replace `/idea-generate` for mature businesses.
2. Remove current `improve-data` and `grow-business` modes.
3. Implement full legal/compliance automation for all categories in v1.
4. Introduce cross-business blended budgeting in v1.

## Active tasks

- SFS-00 - Implement mandatory startup baseline ingestion (`0a/0b/0c`).
- SFS-01 - Define startup orchestrator and schema contracts.
- SFS-02 - Implement spec intake + blocker-question engine + assumption ledger.
- SFS-03 - Implement Italy-first budget/channel/economics/supply modules.
- SFS-04 - Implement weekly K/P/C/S governance pack.
- SFS-05 - Implement adaptive context-budget seeding (`K_dynamic`).
- SFS-06 - Implement delivery handoff contract to `lp-do-fact-find -> lp-do-plan -> lp-do-build`.
- SFS-07 - Implement dry-run + progress visibility + degraded handling contract.
- SFS-08 - Build validation harness for HEAD/PET paired runs.
- SFS-09 - Update skill docs/runbooks and integration references.

## Architecture (v1)

### Stage 0a: Business Intent Harvest
- Read strategy/outcome/readiness context for `HEAD` and `PET`.
- Normalize current goals, constraints, and known signal gaps.

### Stage 0b: Existing Work Harvest
- Read existing ideas/cards/stage-docs via Business OS API/contracts.
- Normalize lane/priority/blocked/dependency state and prior deliberation context.

### Stage 0c: Startup Baseline Merge
- Merge `0a` + `0b` into one baseline per business.
- Classify potential actions as `reuse-existing`, `adapt-existing`, or `new`.
- Emit coverage/confidence flags where baseline data is stale or incomplete.

### Stage 1: Spec Intake
- Normalize user product spec to a structured startup brief.
- Ask only blocker questions.
- Record assumptions with confidence and falsification tests.

### Stage 2: Parallel Startup Tracks
- Spawn independent coordinator contexts for `HEAD` and `PET`.
- Maintain separate budget ledgers, decision ledgers, and output packs.

### Stage 3: Startup Decision Pack Generation
Per business, compute:
- 90-day outcome contract
- budget envelope (Lean/Base/Push)
- Italy channel strategy
- no-stock preorder demand test
- unit economics frame + kill thresholds
- 60-day supply decision timeline
- weekly K/P/C/S loop

### Stage 4: Adaptive Seeding
- Replace fixed `K=3` with `K_dynamic` per business:
  - reserve 30% context headroom
  - complexity costs: simple=1, medium=4, complex=16
  - rank by value density
  - clamp on degradation (mild <=3, severe=1)
  - bounds: min 1 (if valid Go exists), max 20

### Stage 5: Handoff
- Convert approved Go items into `lp-do-fact-find` seeds and planning-ready manifests.
- No direct build bypass.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| SFS-D01 | DECISION | Define startup cash-at-risk cap requiring operator approval | 72% | S | Pending | - | SFS-03, SFS-04 |
| SFS-D02 | DECISION | Define Italy compliance minimum checklist by product category | 70% | S | Pending | - | SFS-03, SFS-06 |
| SFS-00 | IMPLEMENT | Build mandatory baseline ingestion (`0a` intent + `0b` existing work + `0c` merge/classification) | 83% | M | Pending | - | SFS-01, SFS-03, SFS-05 |
| SFS-01 | IMPLEMENT | Create `/startup-from-spec` orchestration contract and schemas | 84% | M | Pending | SFS-00 | SFS-02, SFS-03, SFS-05, SFS-06 |
| SFS-02 | IMPLEMENT | Build intake normalization, blocker questions, assumption ledger | 83% | M | Pending | SFS-01 | SFS-04, SFS-05 |
| SFS-03 | IMPLEMENT | Build Italy-first budget/channel/econ/supply modules | 80% | L | Pending | SFS-01, SFS-D01, SFS-D02 | SFS-04, SFS-06 |
| SFS-04 | IMPLEMENT | Build weekly Kill/Pivot/Continue/Scale decision loop pack | 82% | M | Pending | SFS-02, SFS-03 | SFS-06 |
| SFS-05 | IMPLEMENT | Build adaptive seeding engine and output manifest | 81% | M | Pending | SFS-01, SFS-02 | SFS-06, SFS-08 |
| SFS-07 | IMPLEMENT | Add dry-run, progress updates, degraded preflight behavior | 83% | M | Pending | SFS-01 | SFS-08 |
| SFS-06 | IMPLEMENT | Wire approved Go-item handoff into existing delivery path | 80% | M | Pending | SFS-03, SFS-04, SFS-05, SFS-D02 | SFS-08, SFS-09 |
| SFS-08 | CHECKPOINT | Validate paired HEAD/PET dry-runs + adaptive seeding behavior | 78% | M | Pending | SFS-05, SFS-06, SFS-07 | SFS-09 |
| SFS-09 | IMPLEMENT | Update skill docs/runbooks + operator guidance and references | 85% | S | Pending | SFS-06, SFS-08 | - |

## Detailed Tasks

### SFS-D01: Startup Risk-Cap Decision
- **Type:** DECISION
- **Question:** What default cash-at-risk ceiling requires explicit operator approval before continuing?
- **Acceptance:**
  - [ ] One default threshold documented.
  - [ ] Override path documented.
  - [ ] Referenced by budget and weekly K/P/C/S tasks.

### SFS-D02: Italy Compliance Baseline Decision
- **Type:** DECISION
- **Question:** What minimum compliance checklist must be satisfied for Italy-first launch by product category?
- **Acceptance:**
  - [ ] Checklist documented in machine-readable and user-readable forms.
  - [ ] Handoff task blocks Go-items that fail checklist.

### SFS-00: Startup Baseline Ingestion (`0a`/`0b`/`0c`)
- **Type:** IMPLEMENT
- **Deliverables:**
  - Business intent ingester (strategy/outcome/readiness ingestion).
  - Existing work ingester (cards/ideas/stage-doc context ingestion).
  - Baseline merger with candidate classification (`reuse-existing` | `adapt-existing` | `new`).
- **Acceptance:**
  - [ ] Per-business baseline exists for `HEAD` and `PET` before decision-pack generation.
  - [ ] Baseline includes explicit distinction between business intent and existing work state.
  - [ ] Every proposed Go-item has source provenance (`from-existing` or `new`) and classification.
  - [ ] Coverage/staleness flags are emitted for weak baseline areas.

### SFS-01: Orchestrator and Schema Contracts
- **Type:** IMPLEMENT
- **Deliverables:**
  - `/startup-from-spec` invocation contract.
  - Input/output schemas for startup brief, decision pack, and handoff manifest.
- **Acceptance:**
  - [ ] Schema validation exists for all orchestrator inputs/outputs.
  - [ ] Explicit dual-business parallel contract (`HEAD`, `PET`) is encoded.
  - [ ] Separate budget ledgers are first-class fields.
  - [ ] Stage ordering enforces `0a -> 0b -> 0c -> 1..5` (cannot skip baseline ingestion).

### SFS-02: Intake + Blocker Questions + Assumption Ledger
- **Type:** IMPLEMENT
- **Deliverables:**
  - Spec normalization stage.
  - Blocker-only question policy.
  - Assumption ledger with confidence and falsification tests.
- **Acceptance:**
  - [ ] Missing optional fields do not block run by default.
  - [ ] Missing blocker fields trigger targeted questions only.
  - [ ] Every assumption includes owner, confidence, and test.

### SFS-03: Italy-First Startup Computation Modules
- **Type:** IMPLEMENT
- **Deliverables:**
  - Budget envelope module (Lean/Base/Push).
  - Channel selection module (Italy-first).
  - Unit-economics module with kill thresholds.
  - 60-day supply plan module.
- **Acceptance:**
  - [ ] Separate budget outputs for `HEAD` and `PET`.
  - [ ] Output includes spend categories and rationale.
  - [ ] Output includes explicit stop/pivot thresholds.
  - [ ] Output includes order decision checkpoints tied to 60-day lead time.

### SFS-04: Weekly K/P/C/S Decision Loop
- **Type:** IMPLEMENT
- **Deliverables:**
  - Weekly operating memo template.
  - Decision-state transitions (`kill`, `pivot`, `continue`, `scale`).
  - Common startup scorecard usage contract.
- **Acceptance:**
  - [ ] One-page weekly decision artifact per business.
  - [ ] Scorecard fields are consistent across `HEAD` and `PET`.
  - [ ] Decision state always ties to explicit threshold.

### SFS-05: Adaptive Seeding Engine
- **Type:** IMPLEMENT
- **Deliverables:**
  - `K_dynamic` algorithm and manifest writer.
  - Complexity scoring and value-density ranking.
  - Degradation clamps and bounds.
- **Acceptance:**
  - [ ] 30% context reserve is enforced.
  - [ ] Complexity costs applied (`1/4/16`).
  - [ ] Clamp behavior works (`<=3` mild, `1` severe).
  - [ ] Bounds enforced (`1..20` when valid Go exists).

### SFS-07: Dry-Run + Progress + Degraded Behavior
- **Type:** IMPLEMENT
- **Deliverables:**
  - Dry-run mode contract for startup orchestration.
  - Progress artifact contract with stage transitions.
  - Degraded preflight rules consistent with existing safety constraints.
- **Acceptance:**
  - [ ] Dry-run performs zero persistence writes.
  - [ ] Progress events emitted across major stages.
  - [ ] Degraded mode is opt-in and dry-run only.

### SFS-06: Handoff to Existing Delivery Gates
- **Type:** IMPLEMENT
- **Deliverables:**
  - Handoff mapping from approved Go-items to `lp-do-fact-find` seeds.
  - Routing contract to `lp-do-plan` and `lp-do-build`.
- **Acceptance:**
  - [ ] Every approved Go-item maps to one concrete handoff entry.
  - [ ] No implementation item bypasses `lp-do-fact-find -> lp-do-plan -> lp-do-build`.
  - [ ] Handoff payloads include business, priority, evidence, and decision context.

### SFS-08: Validation Checkpoint (HEAD/PET)
- **Type:** CHECKPOINT
- **Validation Contract:**
  - VC-01: Paired dry-runs execute with separate ledgers and no context cross-bleed.
  - VC-02: Adaptive seeding behaves correctly on simple/medium/complex fixture sets.
  - VC-03: Degradation clamps trigger correctly under simulated pressure.
  - VC-04: Handoff outputs are consumable by downstream workflow.
- **Acceptance:**
  - [ ] Validation record persisted.
  - [ ] Any failing VC produces follow-up corrective task before rollout.

### SFS-09: Documentation and Integration Update
- **Type:** IMPLEMENT
- **Deliverables:**
  - Operator runbook for `/startup-from-spec`.
  - Integration notes with idea-readiness and idea-generate.
  - Updated references in feature workflow docs.
- **Acceptance:**
  - [ ] New skill flow documented with examples.
  - [ ] Startup-vs-mature routing decision guide documented.
  - [ ] Constraints and known limits documented.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | SFS-D01, SFS-D02, SFS-00 | - | lock policy + build baseline ingestion layer |
| 2 | SFS-01 | SFS-00 | orchestrator/schemas over explicit baseline contract |
| 3 | SFS-02, SFS-03, SFS-07 | SFS-01 (+ decisions for SFS-03) | core startup computation and run safety |
| 4 | SFS-04, SFS-05 | SFS-02, SFS-03 | decision loop + adaptive seeding |
| 5 | SFS-06 | SFS-04, SFS-05 | downstream handoff wiring |
| 6 | SFS-08 | SFS-05, SFS-06, SFS-07 | paired validation gate |
| 7 | SFS-09 | SFS-06, SFS-08 | docs and integration completion |

## Rollout and Safety

1. Start with dry-run only for `HEAD` and `PET`.
2. Require SFS-08 checkpoint pass before live persistence behavior.
3. Keep existing `/idea-generate` behavior unchanged for non-startup lanes during rollout.

## Confidence Inputs

- Implementation: 81%
- Approach: 84%
- Impact: 90%

Overall confidence: **81%**.

### What would make confidence >=90%

1. Execute SFS-08 with all VC checks passing on paired `HEAD`/`PET` fixtures.
2. Validate adaptive seeding determinism across repeated dry-runs.
3. Confirm Italy compliance checklist is stable enough to automate as hard gate.
4. Demonstrate two complete spec-to-handoff cycles with zero manual schema fixes.

## Decision Log

1. `K_dynamic` replaces fixed startup seeding because fixed `K=3` underfits simple-obvious weeks and over-allocates in high-complexity weeks.
2. Parallel startup execution is required, but context separation is mandatory to avoid capability loss.
3. Existing delivery pipeline remains mandatory for implementation discipline.
