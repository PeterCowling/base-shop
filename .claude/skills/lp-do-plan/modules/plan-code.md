# Planner Module: Code Track

Use for `Execution-Track: code`.

## Objective

Produce implementation-ready tasks with explicit validation contracts and realistic confidence.

## Task Decomposition Heuristics

- Put highest-risk assumptions early.
- Prefer infra/contracts before consumers.
- Insert CHECKPOINT after first 2-3 dependent IMPLEMENT tasks when the chain is long.

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
