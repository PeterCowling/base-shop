---
name: lp-do-replan
description: Thin orchestrator for resolving low-confidence plan tasks with evidence, explicit precursor tasks, stable task IDs, and checkpoint-aware reassessment.
---

# Re-Plan Orchestrator

`/lp-do-replan` updates an existing plan by converting uncertainty into evidence-backed task updates.

This orchestrator owns:
1. task selection and mode detection,
2. canonical replan gates,
3. module routing,
4. structured plan delta updates,
5. sequencing handoff,
6. decision-oriented completion output.

## Global Invariants

### Operating mode

**RE-PLANNING ONLY**

### Allowed actions

- Read/search files and docs.
- Run read-only commands needed for evidence (for example targeted tests, type checks, grep/ripgrep, static analysis commands).
- Update plan and replan notes docs.

### Prohibited actions

- Production implementation/refactor/migration changes.
- Destructive shell/git commands.
- Writing throwaway probe code in this skill.

If an assumption requires executable probe code, create a SPIKE precursor task instead of writing probes in `/lp-do-replan`.

## Inputs

- Existing plan: `docs/plans/<feature-slug>/plan.md` (legacy fallback allowed)
- Optional task IDs to target
- Optional fact-find brief

If plan is missing, route to `/lp-do-plan` (or create initial plan from fact-find then return).

## Invocation Modes

- `standard`: low-confidence/missing-contract replanning
- `checkpoint`: mid-build reassessment when `/lp-do-build` hits CHECKPOINT

Load checkpoint module only in checkpoint mode.

## Replan Gates (Canonical)

Evaluate and record these gates for each affected task:

1. **Promotion Gate**
- `<80 -> >=80` requires E2+ evidence or explicit precursor chain.

2. **Validation Gate**
- Runnable tasks require complete validation contracts before Ready status (task-type appropriate).

3. **Precursor Gate**
- Unresolved unknowns become formal precursor tasks (`INVESTIGATE` or `SPIKE`).
- No inline "needs spike" notes.

4. **Sequencing Gate**
- If topology changed (tasks added/split/removed/dependencies updated), run `/lp-sequence` in stable-ID mode (no renumbering).

5. **Escalation Gate**
- Ask user only when decision intent cannot be inferred after evidence review.

Shared doctrine sources:
- `../_shared/confidence-protocol.md`
- `../_shared/evidence-ladder.md`
- `../_shared/fail-first-biz.md`
- `../_shared/validation-contracts.md`
- `../_shared/replan-update-format.md`
- `../_shared/precursor-doctrine.md`

## Phase 1: Select Scope

Target explicit IDs when provided; otherwise include:
- all `IMPLEMENT` tasks below 80,
- all `SPIKE` tasks below 80,
- all `INVESTIGATE` tasks below 60,
- runnable tasks with missing/incomplete validation contracts,
- direct dependents affected by those tasks.

## Phase 2: Classify Track and Route

Determine per task:
- `Execution-Track`: `code | business-artifact | mixed`

Route modules:
- code -> `modules/replan-code.md`
- business-artifact -> `modules/replan-biz.md`
- mixed -> both modules + `modules/replan-validation.md`
- missing/weak validation contracts -> `modules/replan-validation.md`
- checkpoint invocation -> add `modules/replan-checkpoint.md`

## Phase 3: Apply Deltas to Plan

Use compact delta format from:
- `../_shared/replan-update-format.md`

Keep in-plan updates concise; put detailed evidence in:
- `docs/plans/<feature-slug>/replan-notes.md` when needed.

ID policy:
- Preserve existing TASK-IDs.
- New tasks get next available TASK-ID and remain stable.
- Dependencies reference stable TASK-IDs.

## Phase 4: Sequencing

When topology changed, run `/lp-sequence` with stable IDs preserved.

Expected sequence behavior for replan flows:
- reorder tasks,
- refresh `Depends on` / `Blocks` consistency,
- refresh Parallelism Guide,
- **do not renumber task IDs**.

## Phase 5: Readiness Decision

- `Ready`: runnable tasks meet type thresholds (`IMPLEMENT/SPIKE >=80`, `INVESTIGATE >=60`) and have complete validation contracts.
- `Partially ready`: precursor chain created; blocked tasks remain below type threshold.
- `Blocked`: unresolved decision/input or tasks <60 without viable precursor path.

## Completion Messages

Ready:

> Re-plan complete. Updated `docs/plans/<feature-slug>/plan.md`. Stable task IDs preserved. Eligible tasks are ready for `/lp-do-build`.

Partially ready:

> Re-plan complete. Added precursor chain(s) and updated dependencies with stable task IDs. Build precursor tasks first, then re-run `/lp-do-replan` for blocked tasks.

Blocked:

> Re-plan complete but blocked by unresolved decisions or confidence floor. See updated tasks and required decisions in plan/replan notes.

## Quick Checklist

- [ ] Evidence-based confidence adjustments only
- [ ] Unknowns converted to formal precursor tasks
- [ ] Validation contracts complete for runnable tasks
- [ ] Stable task IDs preserved
- [ ] `/lp-sequence` run after topology changes (no renumber)
