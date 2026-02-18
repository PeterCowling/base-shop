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

## Anti-Bias Rules (Mandatory)

These rules prevent threshold-anchoring. All scoring agents must follow them.

### Score-first rule
Score each dimension (Implementation, Approach, Impact) independently using only evidence. Never start from the threshold and work backward. Check the threshold only after all three dimension scores are set.

### Rounding rule
Express all scores in multiples of 5 only: 55, 60, 65, 70, 75, 80, 85, 90, 95. Non-multiples of 5 are invalid. This removes the ability to micro-game to threshold-adjacent values.

### Exact-threshold red flag
A composite score of exactly 80 on any dimension is a structural warning. When any dimension lands at 80 before taking the min:
1. Apply the **held-back test**: "What single unresolved unknown, if it resolves badly, would push this dimension below 80?"
2. If such an unknown exists → score must be ≤75. Convert the unknown to a precursor task.
3. If no such unknown exists → state it explicitly: "Held-back test: no single unresolved unknown would drop this below 80 because [specific reason]."

### Downward bias rule
When uncertain between two adjacent scores (e.g., 75 vs 80), assign the lower score. Upward revision requires new evidence, not reinterpretation of existing evidence.

## Required Explanation

Each task must include short score rationale and:
- the evidence class and artifact used for each dimension score,
- what specific unknown or gap is capping it below 80 (if below),
- the held-back test result (if any dimension is at 80),
- what would make it >=90 (if currently below 90).

## Terminology

`CI` means continuous integration only. Do not use `CI` as shorthand for confidence.
