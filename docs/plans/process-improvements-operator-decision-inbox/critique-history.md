# Critique History: process-improvements-operator-decision-inbox

## Round 1 — 2026-03-10

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Locked Architecture / TASK-01 | Read model hardcoded the trial queue path instead of using an authoritative queue-path resolver. |
| 1-02 | Major | TASK-02 / TASK-03 | Ledger-first action writes had no explicit failed-execution contract, risking audit/workflow divergence. |
| 1-03 | Moderate | TASK-01 | Foundation task still pulled report/generator edits forward, weakening the checkpoint boundary. |

All issues opened in Round 1 were autofixed in the same round. No Round 1 issues remain open.

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| none | - | - | - |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| none | - | - | - |

## Round 2 — 2026-03-11

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Locked Architecture / TASK-08 | Business-wide benefit wording was still too open-ended, risking unsupported freeform copy instead of evidence-backed framing. |
| 2-02 | Moderate | TASK-09 | Recent-history replay window and rationale scope were under-decided, risking UI/history drift. |
| 2-03 | Moderate | Locked Architecture / TASK-08 | Expected-next-step wording was not yet tied to an explicit route/status mapping, risking divergence between UI copy and actual workflow. |

All issues opened in Round 2 were autofixed in the same round. No Round 2 issues remain open.

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | Business-wide benefit wording lacked a bounded evidence-backed contract. | Locked the plan to a controlled business-impact taxonomy derived from evidence-backed categories. |
| 2-02 | Moderate | Recent-history replay and rationale capture semantics were not explicit enough. | Locked replay to the latest 20 non-`defer` decisions from the last 7 days and set rationale storage for all decisions with UI capture first for `Decline`. |
| 2-03 | Moderate | Next-step copy could drift away from actual workflow behavior. | Locked expected-next-step wording to an explicit mapping over `recommendedRoute` and `status`. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| none | - | - | - |
