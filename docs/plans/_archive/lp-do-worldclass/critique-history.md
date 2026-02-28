# Critique History: lp-do-worldclass

## Round 1 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Constraints & Assumptions; TASK-04 | Invalid MCP namespace (`mcp__brikette__*`) and unsupported tool availability claims. |
| 1-02 | Major | TASK-02 Edge Cases & Hardening | Contradiction: `domains` declared required (>=1) but also documented as allowed empty. |
| 1-03 | Moderate | TASK-05 Acceptance/VC | Dispatch field checklist was underspecified vs required `dispatch.v1` schema fields. |
| 1-04 | Moderate | Acceptance Criteria (overall) | Success criterion required "at least 2 dispatches", which is not tied to observed actionable gaps. |
| 1-05 | Moderate | TASK-01..TASK-05, CHECKPOINT-A Validation contracts | VC checks had no explicit time-box or minimum-sample rule for business-artifact validation quality. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| None | - | - | - |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | - |

## Round 2 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-04 Step 6 vs TASK-05 decomposition | Scan output was domain-granular while ideas routing required one dispatch per distinct gap. |
| 2-02 | Major | Proposed Approach / TASK-02 / TASK-03 | `goal_version` field naming was inconsistent across sections. |
| 2-03 | Major | TASK-03 benchmark output contract | Benchmark format lacked schema/versioned machine-parse anchors (`schema_version`, domain IDs). |
| 2-04 | Major | Proposed Approach / TASK-03 Step 5 | Missing explicit stale-benchmark gate (`benchmark.goal_version` mismatch). |
| 2-05 | Major | TASK-05 Step 3 | Deterministic formulas for clustering/idempotency keys were unspecified. |
| 2-06 | Moderate | TASK-04 Step 6 | Same-day scan rerun overwrite semantics were unspecified. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| None | - | - | - |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | - |
