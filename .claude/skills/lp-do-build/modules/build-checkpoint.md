# Build Executor: CHECKPOINT

## Objective

Pause normal build flow and reassess remaining plan viability with fresh implementation evidence.

## Workflow

1. Summarize completed-task evidence and validated/invalidated assumptions.
2. Invoke `/lp-do-replan` for all downstream tasks.
3. If topology changed, run `/lp-do-sequence`.
4. Re-evaluate confidence for all downstream tasks after replan:
   - All tasks meet type threshold (IMPLEMENT/SPIKE ≥80%, INVESTIGATE ≥60%) → **continue automatically** into the next wave. Do not stop to ask the user.
   - Any task still below threshold → stop, report the specific task and confidence gap, request operator input.

## Ownership Contract

`/lp-do-build` owns checkpoint-triggered replan/resume behavior.
