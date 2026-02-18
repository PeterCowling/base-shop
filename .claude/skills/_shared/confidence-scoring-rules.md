# Confidence Scoring Rules (Planning)

Use this compact ruleset for `/lp-plan` and `/lp-replan`.

## Core Definitions

- Task overall confidence = `min(Implementation, Approach, Impact)`.
- Plan `Overall-confidence` = effort-weighted average of task overall confidence (`S=1`, `M=2`, `L=3`).
- Build eligibility is per-task, not by plan average.

## Thresholds

- `IMPLEMENT`: `>=80` build-eligible if dependency/input gates pass.
- `SPIKE`: `>=80` build-eligible if dependency/input gates pass.
- `INVESTIGATE`: `>=60` build-eligible for information-gain execution if dependency/input gates pass.
- `<60`: blocked; do not schedule direct build execution.
- `CHECKPOINT`: procedural task type; no numeric threshold gate.

Auto-continue note:
- `/lp-plan` auto-continue still requires at least one `IMPLEMENT` task at `>=80`.

## Evidence Caps

- M/L tasks with reasoning-only evidence cap at `75`.
- Any task with incomplete validation contract caps at `70`.
- Confidence `>80` requires enumerated TC/VC coverage for all acceptance criteria.

## Business Fail-First Caps

For business-artifact or mixed tasks:
- No Red evidence -> cap `79`.
- Red present, no Green evidence -> cap `84`.
- Green present, no Refactor evidence -> cap `89`.

## Fact-Find Baseline Guardrails

When fact-find confidence exists:
- Task implementation confidence cannot exceed fact-find implementation confidence by >10 without new evidence.
- If fact-find testability confidence <70, do not assign >90 without new testability evidence.

## Required Explanation

Each task must include short score rationale and:
- what makes it >=80 (if currently below),
- what would make it >=90 (if currently below).

## Terminology

`CI` means continuous integration only. Do not use `CI` as shorthand for confidence.
