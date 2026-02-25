# Auto-Continue Policy (Plan -> Build)

## Modes

- `plan-only` (default)
- `plan+auto` (explicit user intent only)

## Explicit Intent Requirement

Only use `plan+auto` when the user explicitly asks to build/implement/ship now or asks for auto-continue.

Silence is not approval.

## Eligibility Gates (all required)

1. Plan status is `Active`.
2. No unresolved `Needs-Input` / blocking DECISION tasks.
3. At least one IMPLEMENT task has confidence >=80.
4. Dependencies for auto-selected tasks are satisfied.
5. `/lp-do-sequence` has run after the final topology changes.
6. Edge-case review gate is marked complete.

## Execution Scope

- Auto-continue invokes `/lp-do-build <feature-slug>`.
- Build execution continues until a checkpoint or threshold stop condition.

## CHECKPOINT Cross-Skill Contract

- `/lp-do-build` owns checkpoint execution behavior.
- When `/lp-do-build` reaches a CHECKPOINT task, it must:
  1. stop normal build progression,
  2. invoke `/lp-do-replan` for downstream tasks,
  3. after replan completes, act on the result immediately (do not stop and wait):
     - `Ready` → automatically resume `/lp-do-build <feature-slug>`. No manual invocation required.
     - `Partially ready` → build the new precursor tasks first, then re-invoke `/lp-do-replan`, then resume build.
     - `Blocked (pending-decision)` → surface the DECISION question to the user and stop.
     - `Blocked (low-confidence)` → escalate to user; scope clarification required.
     - `Infeasible` → surface kill rationale to user and stop. Do not resume.

`/lp-do-plan` must not bypass this contract.
