# Naming Round Analytics (Latest)

Generated at: 2026-03-04T20:15:40.373Z
Schema: naming-round-analytics.v1
Source files: 3
Round records: 3
Total events: 871

## Totals by pipeline

| Pipeline | Rounds | Events |
|---|---:|---:|
| company | 1 | 501 |
| product | 2 | 370 |

## Totals by business

| Business | Rounds | Events |
|---|---:|---:|
| HBAG | 1 | 330 |
| HEAD | 2 | 541 |

## Round detail

| Business | Pipeline | Run date | Round | Events | Generated | RDAP checked | TM pre-screened | RDAP yield | TM label coverage | Source file |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| HBAG | product | 2026-02-27 | 1 | 330 | 165 | 0 | 165 | - | 0.00% | `HBAG/assessment/naming-workbench/product-naming-sidecars/2026-02-27-round-1.jsonl` |
| HEAD | company | 2026-02-26 | 7 | 501 | 250 | 250 | 0 | 50.00% | - | `HEAD/assessment/naming-workbench/naming-sidecars/2026-02-26-round-7.jsonl` |
| HEAD | product | 2026-02-26 | 1 | 40 | 20 | 0 | 20 | - | 0.00% | `HEAD/assessment/naming-workbench/product-naming-sidecars/2026-02-26-round-1.jsonl` |

## Notes

- RDAP yield is `available / (generated - i_gate_eliminated)` for rounds with RDAP checks.
- TM label coverage is `(clear + conflict + pending) / tm_prescreened`.
- Rounds with missing operator labels are still included; coverage exposes readiness for preference analysis.

