# Critique History: ideas-classifier-queue-wiring-and-report

## Round 1 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Questions / Resolved / Q1 | Scheduler design fork unresolved — two candidate paths (modify TrialDispatchPacket vs QueueEntry) without committing to one |
| 1-02 | Moderate | Scope / Constraints & Assumptions | HTML template edit location contradiction — stated "generator file" but correct answer is committed HTML |
| 1-03 | Moderate | Test Landscape / Existing Test Coverage | planNextDispatches() test gap under-specified — no enumeration of which tests break or what new assertions are required |
| 1-04 | Minor | Data & Contracts / ScheduledDispatch | ScheduledDispatch output contract not addressed for Task-03 — unclear if output type needs new fields |
| 1-05 | Minor | Confidence Inputs / Impact | Impact 85% justification internally inconsistent — "minimal change" cited as confidence basis for high score |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Scheduler design fork | Fixed: committed to Option B (add `classification` to `QueueEntry`, not `TrialDispatchPacket`); Q1 answer updated |
| 1-02 | Moderate | HTML template location contradiction | Fixed: Constraints bullet corrected to "edit directly in committed HTML" |
| 1-05 | Minor | Impact confidence justification | Fixed: Impact evidence rewritten to cite report grouping as primary impact |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-03 | Moderate | 1 | planNextDispatches() test gap under-specified — planner should enumerate specific test cases in plan |
| 1-04 | Minor | 1 | ScheduledDispatch output type not addressed — planner to decide if output interface needs new fields for Task-03 |

---

## Round 2 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-03 / Consumer Tracing | False caller claim — plan stated planNextDispatches() is called in lp-do-ideas-dispatch.ts; grep confirms zero non-test callers |
| 2-02 | Moderate | TASK-03 / Acceptance + Notes | ScheduledDispatch.priority stale field not addressed — field becomes misleading label when sort is rerouted; no decision recorded |
| 2-03 | Moderate | TASK-05 / Edge Cases | Test seam hedge unresolved — plan left "worth checking during execution" despite listEntries() returning object references (mutation viable) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-03 | Moderate | planNextDispatches() test gap under-specified | Fixed: TASK-03 TC-06 through TC-10 fully enumerated with scenario, expected outcome, and "verified by test in TASK-05" |
| 1-04 | Minor | ScheduledDispatch output type not addressed | Fixed: TASK-03 Notes and Acceptance now record decision: priority field left as legacy display label; TSDoc comment prescribed |
| 2-01 | Major | False caller claim in consumer tracing | Fixed: replaced with grep-confirmed statement that planNextDispatches() has no non-test caller; noted Phase 1 advisory scope |
| 2-02 | Moderate | ScheduledDispatch.priority stale field | Fixed: Acceptance gains bullet that priority type is unchanged with TSDoc; Notes records the legacy-label decision |
| 2-03 | Moderate | Test seam hedge | Fixed: Edge Cases rewritten with confirmed object-reference mutation pattern; Notes updated; "worth checking" hedge removed |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
None. All issues resolved.
