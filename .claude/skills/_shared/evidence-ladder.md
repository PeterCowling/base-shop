# Evidence Ladder

Use evidence classes when adjusting confidence.

| Class | Source | Typical uplift envelope |
|---|---|---|
| E0 | assumption/opinion | 0 |
| E1 | static audit (files/docs/call maps) | +0 to +5 |
| E2 | executable read-only verification (tests/scripts/log outputs) | +5 to +15 |
| E3 | completed precursor spike/prototype evidence | +10 to +25 |

Rules:
- Do not promote to `>=80` from E1-only evidence when key unknowns remain.
- Cite the specific evidence artifact for each uplift (not just the class label).
- State *why* the claimed uplift amount falls at that point in the range. Default to the minimum of the range unless there is explicit justification for a higher value.
- Maximum-range uplift (top quartile: E1 ≥4, E2 ≥13, E3 ≥20) requires a positive stated reason. "No reason given" defaults to minimum-range uplift.
- Accumulating more E1 evidence does not unlock E2-level promotions. Class, not volume, determines promotion eligibility.
