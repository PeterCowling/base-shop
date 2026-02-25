# Build Executor: CHECKPOINT

## Objective

Pause normal build flow and reassess remaining plan viability with fresh implementation evidence.

## Workflow

1. Summarize completed-task evidence and validated/invalidated assumptions.
2. Invoke `/lp-do-replan` for downstream tasks.
3. If topology changed, run `/lp-do-sequence`.
4. Resume only if downstream tasks meet thresholds and have complete validation contracts.

## Ownership Contract

`/lp-do-build` owns checkpoint-triggered replan/resume behavior.
