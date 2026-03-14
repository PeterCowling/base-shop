# Analysis Module: Code Track

Use for `Execution-Track: code`.

## Objective

Produce a decision-grade implementation approach recommendation that planning can decompose without re-litigating the architecture.

## Required Outputs

- Explicit option set
- Comparison criteria
- Engineering coverage comparison using the canonical rows from `../../_shared/engineering-coverage-matrix.md`
- Chosen approach
- Rejected approaches with reasons
- Planning handoff notes

## Comparison Heuristics

- Prefer approaches that match existing codebase patterns unless deviation buys clear simplicity or risk reduction.
- Compare contract location, migration surface, consumer update burden, rollback shape, and validation seam quality.
- Compare how each option handles UI/UX, security/privacy, observability, testing, data/contracts, reliability, and rollout.
- Call out when an option is only superficially cheaper because it pushes risk into build.
