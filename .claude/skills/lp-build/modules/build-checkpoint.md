# Build Executor: CHECKPOINT

## Objective

Pause normal build flow and reassess remaining plan viability with fresh implementation evidence.

## Workflow

1. Summarize completed-task evidence and validated/invalidated assumptions.
2. Invoke `/lp-replan` for downstream tasks.
3. If topology changed, run `/lp-sequence`.
4. Resume only if downstream tasks meet thresholds and have complete validation contracts.

## Ownership Contract

`/lp-build` owns checkpoint-triggered replan/resume behavior.
