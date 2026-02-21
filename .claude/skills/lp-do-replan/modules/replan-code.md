# Replan Module: Code Track

Use for `Execution-Track: code`.

## Goal

Raise confidence by closing Implementation/Approach/Impact uncertainty with evidence.

## Required Actions

1. Implementation gaps
- Locate analogous repo pattern.
- Verify integration seams and contracts.
- Run at least one read-only executable check for high-impact claims when feasible.

2. Approach gaps
- Compare at least two approaches when decision is unclear.
- Choose based on architectural fit and maintainability.
- If unresolved, create DECISION or INVESTIGATE precursor.

3. Impact gaps
- Map upstream/downstream dependencies and blast radius.
- Identify test coverage gaps and extinct tests.
- Update rollout/rollback implications.

## Output Expectations

- Update task confidence with evidence class references.
- Add/update TC contracts if missing via validation module.
- If uncertainty remains, add precursor tasks (INVESTIGATE/SPIKE) and keep downstream confidence below threshold.
