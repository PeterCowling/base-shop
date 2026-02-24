# Critique History: startup-loop-new-business-launch-priorities

## Round 1 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Open Questions | Launch sequencing model (strict serial vs constrained overlap) remained operator-owned. |
| 1-02 | Moderate | Remaining Assumptions | LOGISTICS minimum requirement was framed as inferred policy without explicit scope decision. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| none | none | none | First critique round |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Moderate | 1 | Process scope vs business scope mismatch with user intent. |
| 1-02 | Moderate | 1 | Logistics gate policy decision still pending. |

## Round 2 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Open Questions | Final hard-gate boundary for physical-product logistics (paid-only vs all scale decisions) needs operator decision. |
| 2-02 | Moderate | Open Questions | Launch-shop mandate scope (all first launches vs Pages-backed only) needs operator decision. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Process scope vs business scope mismatch | Rewrote fact-find to process-first architecture and backlog priorities. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-02 | Moderate | 2 | Explicit logistics gate policy still pending operator decision. |
| 2-01 | Moderate | 1 | Logistics hard-gate scope decision pending. |
| 2-02 | Moderate | 1 | Launch-shop policy scope decision pending. |

## Round 3 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | Open Questions | Final mandate scope for non-Pages first-launch deploy rails still needs operator confirmation. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | Logistics hard-gate policy tied to decision-support framing | Reframed as factory launch-minimum contract for physical-product packet completeness. |
| 2-02 | Moderate | launch-shop scope framed with decision-support context | Reframed as factory deploy-rail policy decision only. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 3-01 | Moderate | 1 | Non-Pages first-launch rail mandate policy decision pending. |

## Round 4 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | High | Artifact Contract | `website-content-packet` is used in practice but not canonical in artifact-registry, so cross-business reuse is weak. |
| 4-02 | High | Runtime Consumption | Website copy/SEO content is still hardcoded in app code (`apps/caryina/src/lib/contentPacket.ts`) instead of generated from loop artifacts. |
| 4-03 | Moderate | Iteration Automation | No deterministic artifact-delta -> page-update mapping exists for WEBSITE-02 recurring iterations. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Moderate | Non-Pages deploy-rail mandate question dominated scope | Scope was narrowed to website information-leverage factory priorities; deploy-rail policy removed from immediate priority set. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 4-01 | High | 1 | Canonical `website-content-packet` contract decision pending (`mandatory` vs `optional` before DO build). |
| 4-02 | High | 1 | Generated payload strategy pending (`commit generated artifacts` vs `runtime compile`). |

## Round 5 — 2026-02-24 (Plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 5-01 | Moderate | TASK-02–07, TASK-09 | Flat 85% confidence across heterogeneous IMPLEMENT tasks masks real variance; differentiation needed. |
| 5-02 | Moderate | TASK-08 | Checkpoint pass/fail thresholds undefined — "materially slow" and "high enough" are not falsifiable. |
| 5-03 | Moderate | Validation Contracts | TC numbering misaligned between global list and task blocks; no TC-08 for checkpoint. |
| 5-04 | Moderate | TASK-04 | Consumer route enumeration missing — 11 routes not listed, risking incomplete migration. |
| 5-05 | Moderate | Confidence-Method | Frontmatter description inconsistent with actual calculation approach. |
| 5-06 | Moderate | TASK-07 / TASK-03 | Mandatory vs optional logistics fields for physical-product profiles not specified in compiler fail-closed rules. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-01 | High | Canonical packet contract decision pending | TASK-01 resolved as `mandatory`; TASK-02 implements canonicalization. |
| 4-02 | High | Generated payload strategy pending | TASK-01 resolved as `commit generated artifacts`; TASK-04 implements materializer. |
| 4-03 | Moderate | No deterministic delta mapping | TASK-06 directly targets this gap with explicit TC-06 validation contract. |
| 1-02 | Moderate | Logistics gate policy (carried 4 rounds) | TASK-07 addresses logistics mapping with absent-safe rules; remaining gap is field-level mandatory/optional classification (5-06). |

### Issues Confirmed Resolved via Autofix This Round
| ID | Severity | Summary | How resolved |
|---|---|---|---|
| 5-01 | Moderate | Flat confidence | Differentiated: TASK-02→88%, TASK-04→80%, TASK-05→82%; others retained with dimension-level justification. |
| 5-02 | Moderate | Checkpoint thresholds undefined | Added measurable thresholds: >20% cycle time increase = fail, >70% acceptance rate, zero critical false-positives. |
| 5-03 | Moderate | TC numbering misalignment | Global list renumbered to TC-02–TC-09 matching task numbers; TC-08 added for checkpoint. |
| 5-04 | Moderate | Consumer enumeration missing | All 11 route paths added to TASK-04 acceptance criteria. |
| 5-05 | Moderate | Confidence-Method inconsistency | Frontmatter and calculation section reconciled to explicit min(I,A,I) per task, then effort-weighted. Overall recalculated to 84%. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 5-06 | Moderate | 1 | Mandatory vs optional logistics field classification for physical-product profiles not yet specified in TASK-03/TASK-07 edge cases. |

## Round 6 — 2026-02-24 (Plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 6-01 | Moderate | Frontmatter Contract | `artifact: plan` marker required by loop-output contract was missing from plan frontmatter. |
| 6-02 | Moderate | TASK-03 / TASK-07 | Logistics conditionality did not specify explicit mandatory-vs-optional source/field behavior for physical-product profiles. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 5-06 | Moderate | Mandatory vs optional logistics field classification was unspecified | TASK-03 and TASK-07 now define conditional-mandatory logistics inputs and required policy fields with deterministic failure diagnostics. |

### Issues Confirmed Resolved via Autofix This Round
| ID | Severity | Summary | How resolved |
|---|---|---|---|
| 6-01 | Moderate | Missing `artifact: plan` contract marker | Added `artifact: plan` to frontmatter for loop-output contract conformance. |
| 6-02 | Moderate | Ambiguous logistics mandatory/optional behavior | Added explicit source classification, TC-03-04 logistics-missing failure case, and TASK-07 required policy-field contract. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| none | none | 0 | none |
