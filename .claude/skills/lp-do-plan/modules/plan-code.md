# Planner Module: Code Track

Use for `Execution-Track: code`.

## Objective

Produce implementation-ready tasks with explicit validation contracts and realistic confidence.

## Task Decomposition Heuristics

- Put highest-risk assumptions early.
- Prefer infra/contracts before consumers.
- Insert CHECKPOINT after first 2-3 dependent IMPLEMENT tasks when the chain is long.

## Design Gate

Check the fact-find for `Design-Spec-Required: yes` before decomposing tasks.

**This gate applies to UI tasks only.** Backend, data, infra, and documentation tasks are exempt.

**If `Design-Spec-Required: yes` is present in the fact-find:**

1. Check whether a design spec document already exists at `docs/plans/<slug>-design-spec.md` or `docs/plans/<slug>/design-spec.md`. If it exists, the gate passes automatically — proceed to task decomposition.
2. If no design spec exists, add a prerequisite IMPLEMENT task at the top of the task list:
   - **Type:** IMPLEMENT
   - **Execution-Skill:** `lp-design-spec`
   - **Description:** Produce design spec for `<slug>` before UI implementation begins
   - **Blocks:** all tasks that touch UI component file paths (e.g., `.tsx`, `.css`, `.module.css` files in `src/components/`, `src/app/`)
3. All UI IMPLEMENT tasks must declare `Depends on: <design-spec task ID>` in their task fields.

**If `Design-Spec-Required` is absent or set to `no`:** no action required — proceed to task decomposition as normal.

## Required Task Types

- IMPLEMENT tasks for planned delivery work
- INVESTIGATE tasks for unknowns
- DECISION tasks for preference-dependent choices
- CHECKPOINT tasks for horizon reassessment in long chains

## Required Fields for IMPLEMENT (Code)

Use `docs/plans/_templates/task-implement-code.md`.

Minimum required:
- Type, Deliverable, Execution-Skill
- Execution-Track, Effort, Status
- Affects, Depends on, Blocks
- Confidence breakdown (Implementation/Approach/Impact)
- Acceptance
- Validation contract (TC-XX with expected outcomes)
- Planning validation evidence for M/L
- Rollout/rollback
- Documentation impact

## Validation Contract Rules

- Every acceptance criterion maps to TC-XX cases.
- Include happy path, failure path, and edge conditions.
- For M/L tasks, planning evidence must show command/check outcomes.

## L-Effort Test Stub Rule

- Allowed in planning mode: non-failing `test.todo()` or `it.skip()` stubs only.
- Failing stubs are not allowed in planning mode.
- If pending tests fail CI policy, do not commit stubs; record constraint and add an INVESTIGATE task.

## Confidence Policy

Apply shared scoring rules:
- `../../_shared/confidence-scoring-rules.md`
