# Critique History: jest-runaway-process-prevention

## Round 1 — 2026-02-21

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Patterns & Conventions (line 75) | False claim: "per-package scripts use --detectOpenHandles" — zero matches repo-wide |
| 1-02 | Major | Task seed 4 / Risks | Process group kill feasibility not analyzed — PGID isolation required |
| 1-03 | Moderate | Constraints & Assumptions (line 47) | Portable timeout race condition (PID reuse) not acknowledged |
| 1-04 | Moderate | Assumptions (line 49) | 10-min timeout default untested — no telemetry data on actual run durations |
| 1-05 | Moderate | Risks / Task seeds | RSS-based kill not considered as complementary defense |
| 1-06 | Moderate | Task seed 1 / Risks | forceExit in shared preset affects CI — no local-vs-CI distinction |
| 1-07 | Minor | Key Modules (line 61) | Line number reference approximate (~312-324 vs actual 312-325) |
| 1-08 | Minor | Template compliance | Omitted sections missing "Not investigated" markers |

### Issues Confirmed Resolved This Round
(none — first round)

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 1 | 10-min timeout default untested — check telemetry for duration data |
| 1-05 | Moderate | 1 | RSS-based kill not in task seeds |

### Autofix Summary
- 1-01: Corrected false detectOpenHandles claim → accurate "zero matches" statement
- 1-02: Added PGID isolation analysis to assumptions, risks, and task seed 4; recommended pkill -P
- 1-03: Added PID liveness guard note to timeout portability risk
- 1-06: Added CI vs local forceExit question to task seed 1 and risks
- 1-07: Not fixed (approximate line numbers acceptable for fact-find)
- 1-08: Added "Not investigated" markers for 5 omitted sections
- Confidence scores adjusted: Implementation 90→82%, Approach 85→78%
- Blast radius text corrected for consistency
- Evidence Gap Review updated with post-critique items

### Score
- Overall: **3.5** (weighted)
- Severity distribution: Major: 2, Moderate: 4, Minor: 2

## Round 2 — 2026-02-21 (Plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Fact-Find Reference (line 67) / TASK-02 Notes (line 178) | detectOpenHandles already exists in 4+ package.json scripts and 2 CI workflows — "zero matches" claim is false; TASK-02 framing should say "universalize" not "add" |
| 2-02 | Major | TASK-04 Task Summary (line 88) / TASK-04 detail (line 234) | Dependency contradiction: Task Summary says `Depends on: -` but Parallelism Guide says Wave 2 after TASK-03 for same-file serialization |
| 2-03 | Moderate | TASK-03 Edge Cases (line 212) / Execution plan (line 205) | Zero-timeout implementation bug: `$((SECONDS + 0))` causes immediate timeout, not "no timeout" as documented. Missing `> 0` guard. |
| 2-04 | Moderate | TASK-04 Execution plan (line 256) | `timeout_watchdog_pid` not initialized alongside other state vars — risk under `set -u` |
| 2-05 | Moderate | Carried: 1-04 | 10-min timeout default untested — still no telemetry data on actual run durations (2 rounds open) |
| 2-06 | Moderate | Carried: 1-05 | RSS-based kill still not in task seeds (2 rounds open) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | False detectOpenHandles claim in fact-find | Corrected in fact-find Round 1 autofix; however, plan carried forward a variant of the false claim — re-opened as 2-01 |
| 1-02 | Major | PGID isolation not analyzed | Plan adds TASK-01 investigation with clear acceptance criteria |
| 1-03 | Moderate | PID reuse race not acknowledged | Plan's TASK-04 includes `kill -0` liveness guard and documents microsecond window |
| 1-06 | Moderate | forceExit CI distinction | Plan decision log (line 455) explicitly chooses global forceExit with rationale |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-05 (was 1-04) | Moderate | 2 | 10-min timeout default untested — no telemetry calibration data |
| 2-06 (was 1-05) | Moderate | 2 | RSS-based kill not in task seeds |

### Autofix Summary
- 2-01: Corrected fact-find reference and TASK-02 notes to reflect existing detectOpenHandles usage; reframed as "universalize to shared preset"
- 2-02: Added `Depends on: TASK-03` to TASK-04 in Task Summary and detail block; updated Parallelism Guide to match
- 2-03: Added `(( admission_timeout > 0 ))` guard to TASK-03 execution plan; updated edge case documentation
- 2-04: Added `timeout_watchdog_pid=""` to TASK-04 state variable initialization step

### Score
- Overall: **3.5** (weighted)
- Severity distribution: Major: 2, Moderate: 4
- Delta from Round 1: +0.0 — different document type (plan vs fact-find) at similar quality tier; detectOpenHandles claim carried forward as regression

## Round 3 — 2026-02-21 (Plan critique, post-factcheck)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-04 step 4 / Edge Cases (line 300) | Timeout detection false-positive: cleanup() killing watchdog causes post-wait code to misattribute signal kill as timeout. Fix: do NOT kill watchdog in cleanup. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | detectOpenHandles claim understated ("several" vs 42 files) | Fact-check corrected to exact count (42 package.json files); plan lines 67, 178 updated |
| 2-02 | Major | TASK-04 dependency contradiction | Fixed in Round 2 autofix; confirmed consistent across Task Summary, detail block, and Parallelism Guide |
| 2-03 | Moderate | Zero-timeout implementation bug | Fixed in Round 2 autofix; `(( admission_timeout > 0 ))` guard confirmed present in TASK-03 |
| 2-04 | Moderate | `timeout_watchdog_pid` not initialized | Fixed in Round 2 autofix; initialization confirmed at TASK-04 step 1 |
| 2-06 | Moderate | RSS-based kill not in task seeds (3 rounds open) | Closed as out-of-scope: added to Non-goals with rationale (existing RSS monitor logs; killing on threshold is separate work) |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-05 (was 1-04) | Moderate | 3 | 10-min timeout default untested — no telemetry calibration data. Accepted risk: default is configurable via env var. |

### Autofix Summary
- 3-01: Changed TASK-04 step 4 from "kill watchdog in cleanup" to "do NOT kill watchdog in cleanup"; updated edge case (line 300) to match; updated consumer tracing (line 294) to reflect post-wait check, not cleanup, as consumer
- 2-06: Added RSS-based killing to Non-goals section to formally close carried issue
- Consistency scan: Fixed stale consumer tracing at line 294 (`timeout_watchdog_pid` described as consumed by cleanup → corrected to consumed by post-wait liveness check)

### Score
- Overall: **4.0** (weighted)
- Severity distribution: Moderate: 1 (new), plus 1 carried (accepted risk)
- Delta from Round 2: +0.5 — all Major issues from Round 2 resolved; new Moderate issue (3-01) found and fixed in same round; carried 2-06 closed via Non-goals; only 2-05 remains as accepted risk with configurable default
