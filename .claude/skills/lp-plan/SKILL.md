---
name: lp-plan
description: Thin orchestrator for confidence-gated planning. Routes to track-specific planning modules, persists plan artifacts from templates, and optionally hands off to /lp-build when explicit auto-build intent is present.
---

# Plan Orchestrator

`/lp-plan` is the intake, gating, and routing layer for planning.

It owns:
1. Discovery/intake/dedupe
2. Planning gates
3. Track routing to specialized planner modules
4. Plan persistence using external templates
5. Optional BOS sync
6. Optional handoff to `/lp-build`

It does not embed large plan/task templates or long doctrine blocks.

## Global Invariants

### Terminology rule

- `CI` means continuous integration only.
- Use `confidence` / `Overall-confidence` for planning scores.

### Operating mode

**PLANNING FIRST**

### Allowed actions

- Read/search files and docs.
- Run non-destructive validation commands needed for evidence.
- Edit plan docs.
- Allowed exception: for L-effort code/mixed tasks, add non-failing test stubs (`test.todo()` / `it.skip()`) only.

### Prohibited actions

- Production implementation changes, refactors, migrations, or deploy operations.
- Destructive shell/git commands.
- Failing test stubs in planning mode.

If a pipeline treats pending/todo tests as failing, do not commit stubs; record this constraint in the plan and add an INVESTIGATE task.

## Inputs Priority

1. Fact-find brief (`docs/plans/<slug>/fact-find.md`)
2. Existing plan (`docs/plans/<slug>/plan.md`)
3. User request/topic/card ID
4. Current repository evidence

## Phase 1: Intake and Mode Selection

Determine planning mode early:

- `plan-only` (default)
- `plan+auto` (only when explicit user intent says build now, ship now, implement now, or user passes an explicit `--auto` style instruction)

Never assume silent approval to auto-build.

## Phase 2: Discovery and De-duplication

### Fast path (argument provided)

- Slug -> open matching plan/fact-find paths directly.
- Card ID -> resolve card, then slug/plan link from card metadata.

### Discovery path (no argument)

- Read `docs/business-os/_meta/discovery-index.json`.
- Present short planning-ready table.
- Ask user to select a slug/card/topic.

### De-duplication rule

Before creating a new plan file:
- search `docs/plans/` for overlapping plan docs,
- update existing canonical plan when possible,
- avoid duplicate plan files for the same feature slug.

## Phase 3: Plan Gates (Canonical)

Populate and evaluate these gates in the plan doc:

- Foundation Gate
- Build Gate
- Auto-Continue Gate

### Foundation Gate

If fact-find exists, require:
- `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`
- `Startup-Deliverable-Alias` (`none` unless startup)
- Delivery-readiness confidence input
- Track-specific validation foundation
  - code/mixed: test landscape + testability
  - business/mixed: channel landscape + hypothesis/validation landscape

If missing, stop planning and return to `/lp-fact-find` or add explicit INVESTIGATE tasks with confidence penalty.

### Build Gate (for auto-continue readiness)

For automatic handoff from `/lp-plan` to `/lp-build`, require at least one `IMPLEMENT` task with:
- confidence >=80,
- dependencies complete,
- no blocking decision/input gates.

Note:
- `/lp-build` may execute `SPIKE` tasks at >=80 and `INVESTIGATE` tasks at >=60 when explicitly selected/routed.

### Auto-Continue Gate

Use shared policy:
- `../_shared/auto-continue-policy.md`

## Phase 4: Track Classification and Routing

Determine:
- `Execution-Track`: `code | business-artifact | mixed`
- `Deliverable-Type`: canonical downstream type
- `Primary-Execution-Skill` and `Supporting-Skills`

Route to one module only (or mixed pair):
- code -> `modules/plan-code.md`
- business-artifact -> `modules/plan-business.md`
- mixed -> `modules/plan-mixed.md`

## Phase 5: Decompose Tasks with External Templates

Use:
- Plan template: `docs/plans/_templates/plan.md`
- Task templates:
  - `docs/plans/_templates/task-implement-code.md`
  - `docs/plans/_templates/task-implement-biz.md`
  - `docs/plans/_templates/task-investigate.md`
  - `docs/plans/_templates/task-decision.md`
  - `docs/plans/_templates/task-checkpoint.md`

Rules:
- One logical unit per task.
- Use CHECKPOINT tasks for long dependency chains.
- If a field is not applicable: write `None: <reason>` (no placeholder `TBD`).

## Phase 6: Confidence Scoring

Apply compact scoring doctrine from:
- `../_shared/confidence-scoring-rules.md`

Use evidence-based scores only. Every task must explain confidence briefly.

## Phase 7: Sequence + Edge-Case Review

1. Run `/lp-sequence` after decomposition/topology edits.
2. Run edge-case review and update impacted tasks.
3. If task structure changes again, run `/lp-sequence` again.

Set plan gate statuses explicitly:
- Foundation Gate: Pass/Fail
- Sequenced: Yes/No
- Edge-case review complete: Yes/No
- Auto-build eligible: Yes/No

## Phase 8: Persist Plan

Write/update:
- `docs/plans/<feature-slug>/plan.md`

Status policy:
- Default `Status: Draft`.
- Set `Status: Active` only when:
  - user explicitly wants build handoff now, and
  - plan gates pass.

## Phase 9: Optional Business OS Integration

When `Card-ID` exists and integration is on, execute:
- `../_shared/plan-bos-integration.md`

Payload shapes live in:
- `../_shared/bos-api-payloads.md`

Use shared discovery index contract for BOS mutations:
- `../_shared/discovery-index-contract.md`

## Phase 10: Optional Handoff to Build

Evaluate shared auto-continue policy:
- `../_shared/auto-continue-policy.md`

If eligible and mode is `plan+auto`, invoke `/lp-build <feature-slug>`.

CHECKPOINT enforcement contract:
- `/lp-build` is responsible for stopping at CHECKPOINT tasks and invoking `/lp-replan` for downstream tasks before continued execution.

## Completion Messages

Plan-only:

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`.

Plan+auto:

> Plan complete and eligible. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `Active`. Gates passed. Auto-continuing to `/lp-build <feature-slug>`.

## Quick Checklist

- [ ] No duplicate plan doc created
- [ ] Plan/task templates loaded from files (not inlined)
- [ ] Plan gates populated and evaluated
- [ ] Confidence rules applied from shared scoring doc
- [ ] VC checks reference shared business VC checklist when relevant
- [ ] `/lp-sequence` completed after structural edits
- [ ] Auto-build only when explicit intent + eligibility
