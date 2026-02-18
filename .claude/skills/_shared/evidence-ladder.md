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
- Cite evidence artifacts used for each uplift.
