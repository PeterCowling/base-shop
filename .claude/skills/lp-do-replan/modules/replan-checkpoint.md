# Replan Module: Checkpoint Mode

Use only when `/lp-do-build` invokes `/lp-do-replan` at a CHECKPOINT.

## Goal

Reassess downstream tasks using completed-task evidence and update plan viability before further build.

## Required Actions

1. Read completed task outputs and build evidence.
2. Validate checkpoint horizon assumptions against observed outcomes.
3. Reassess downstream tasks:
- confirm
- revise/split
- defer/remove
4. Add precursor tasks for newly exposed unknowns.
5. Run `/lp-sequence` in stable-ID mode after topology changes.

## Constraint

Do not write probe code in this mode. If a probe is needed, create SPIKE precursor tasks.
