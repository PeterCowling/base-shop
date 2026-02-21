# Confidence Protocol (Replan)

## Core Rule

Confidence increases only when uncertainty is reduced by evidence.

If uncertainty remains:
- keep score unchanged or lower it, or
- create explicit precursor tasks and keep downstream task below threshold.

## Promotion Rule

Promotion from `<80` to `>=80` requires:
- E2+ evidence with explicit citation (artifact + why this uplift is justified), or
- precursor chain that resolves uncertainty before downstream implementation.

E1-only evidence (static audit, file reading, call maps) cannot promote a task to >=80 when key unknowns remain, regardless of how much E1 evidence is accumulated.

## Blind Scoring Procedure

Score dimensions before consulting the threshold. Steps in order:

1. Assess **Implementation** confidence: what do you know vs. don't know about *how* to build this?
2. Assess **Approach** confidence: how proven/validated is the approach?
3. Assess **Impact** confidence: how certain is the expected outcome?
4. Express each as a multiple of 5. Apply Evidence Caps and Fail-First Caps from the scoring rules.
5. Compute `min(Implementation, Approach, Impact)`.
6. *Now* check: is this ≥80? If yes, apply the held-back test on every dimension at 80 before accepting the score.

## Held-Back Test (Required When Any Dimension = 80)

Before accepting a score of 80 on any dimension, answer: "What single unresolved unknown would push this dimension below 80 if it resolves badly?"
- If the answer is non-trivial → that unknown becomes a precursor task and the dimension score drops to ≤75.
- If no such unknown exists → state it explicitly in the rationale.

## Uplift Justification Rule

When citing an evidence class uplift (e.g., "E2 evidence raised score by +10"), you must state:
- the specific artifact (test output, log, grep result, etc.),
- *why* the uplift lands at that point in the range rather than the minimum of the range.

Claiming near-maximum uplift (top quartile of range) requires a positive reason. Default to claiming minimum-range uplift unless there is explicit justification for more.

## Task Score Model

Task overall confidence = `min(Implementation, Approach, Impact)`.
