# Critique History: email-system-production-readiness

## Round 1 — 2026-02-21

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | R2, Task Seed 3 | Booking dedup claim overstated — message-level dedup exists via `hasBriketteLabel`; real gap is booking-ref-level only |
| 1-02 | Major | Test Landscape table | ~11 email-related test files omitted from coverage audit table |
| 1-03 | Moderate | Entry Points, line 61 | Tool count wrong (9 tools, not 8); `gmail_list_query` missing from list |
| 1-04 | Moderate | Confidence Inputs | Testability/gap claims not calibrated against omitted test files |
| 1-05 | Moderate | Remaining Assumptions | OAuth app verification status buried in assumptions, should be explicit Open Question |
| 1-06 | Minor | Task Seed 1 | Impact misattributed to R1; retry-with-backoff addresses R10, not OAuth token expiry |

### Issues Confirmed Resolved This Round

(none — first round)

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-02 | Major | 1 | ~11 email-related test files omitted from coverage audit table (not yet added to table) |
| 1-04 | Moderate | 1 | Confidence dimensions not recalibrated against full test inventory |

### Autofix Summary

- Applied 6 point fixes: tool count correction (1-03), R2 description/likelihood correction (1-01), task seed 3 clarification (1-01), task seed 1 impact correction (1-06), Open Questions section added (1-05), Coverage Gaps `gmail_list_query` note added (1-03)
- 0 section rewrites triggered
- 2 issues carried open (1-02, 1-04): test table expansion and confidence recalibration deferred — requires re-counting all test files, which is lower priority than the structural fixes applied

### Score

Overall: **4.0** (first round — no prior to compare)

## Round 2 — 2026-02-21 (Plan critique)

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-06 Affects | health_check handler is in `health.ts`, not `gmail.ts` — Affects field misdirected builder |
| 2-02 | Major | TASK-06 Premise | health_check already runs DB probe, 10-item preflight, structured response; plan claimed "file existence only" |
| 2-03 | Major | TASK-04 Execution Plan | References nonexistent `readEvents()` in signal-events.ts; actual readers are private functions in `draft-ranker-calibrate.ts` and `draft-template-review.ts` |
| 2-04 | Moderate | TASK-04 Affects + Consumer Tracing | Missing `draft-ranker-calibrate.ts` and `draft-template-review.ts` from Affects; `joinEvents()` return shape change would break 3 callers |
| 2-05 | Moderate | TASK-12 Notes | Line-range breakdown 5/7 inaccurate — section descriptions don't match actual file content at those ranges |
| 2-06 | Moderate | Risks & Mitigations | Fact-find risks R6 (agreement false positives) and R8 (Python divergence) dropped without explanation |
| 2-07 | Moderate | TASK-08 Acceptance | Archival depends on calibration which has never been triggered; file could grow unbounded if calibration never runs |
| 2-08 | Minor | TASK-03 Acceptance | "At least one call wrapped" leaves ~49 unwrapped Gmail API calls without explaining why partial coverage justifies 85% confidence |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| (none from Round 1 were plan-targeted) | | | |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-02 | Major | 2 | ~11 email-related test files omitted from fact-find coverage audit table |
| 1-04 | Moderate | 2 | Fact-find confidence dimensions not recalibrated against full test inventory |

### Autofix Summary

- Applied 7 fixes: 1 section rewrite (TASK-06), 6 point fixes (TASK-04 Affects/execution/scouts, Risks table R6+R8, TASK-08 fallback trigger, TASK-12 line ranges, TASK-03 scope note)
- 1 section rewrite triggered (TASK-06: 2 Major issues → full rewrite with correct file path, rescoped acceptance, effort M→S, confidence 80→85%)
- Consistency scan: 3 cleanup edits (overall acceptance criteria, R4 mitigation, fact-find reference)
- Overall-confidence recalculated: 1280/16 = 80% (unchanged — TASK-06 effort reduction offset by higher per-task confidence)
- 2 prior issues carried open (1-02, 1-04): fact-find test table and confidence recalibration — these are fact-find issues, not plan issues

### Score

Overall: **3.5** (first critique of plan document — no prior plan score to compare; distinct from Round 1 which targeted the fact-find)

## Round 3 — 2026-02-21 (Plan verification critique)

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Minor | TASK-06 + Fact-Find Reference | "10-item email preflight" count wrong — actual count is 9; enumerated list is correct |
| 3-02 | Minor | TASK-06 response shape | Response description omits 4 fields (server, timestamp, totalMs, strict/checkedAt); decision-relevant fields are present |
| 3-03 | Minor | TASK-12 Notes | 3 minor description imprecisions in structure map (classification constants, booking interfaces, type definitions); all line ranges and anchors exact |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | TASK-06 Affects misdirected to gmail.ts | TASK-06 rewritten to target health.ts; all references corrected |
| 2-02 | Major | TASK-06 premise false ("file existence only") | Existing baseline documented with verified line numbers and 9-item preflight detail |
| 2-03 | Major | TASK-04 references nonexistent readEvents() | Execution plan rewritten to target actual private readers at verified line numbers |
| 2-04 | Moderate | TASK-04 Affects incomplete, joinEvents consumer gap | Affects updated; joinEvents return-shape preservation note added |
| 2-05 | Moderate | TASK-12 line ranges inaccurate | Structure map replaced with verified ranges — all 7 anchors exact (delta 0) |
| 2-06 | Moderate | R6 and R8 dropped without explanation | Both added to Risks table with deferral rationale |
| 2-07 | Moderate | TASK-08 archival depends on never-triggered calibration | Fallback 1MB size-based trigger added |
| 2-08 | Minor | TASK-03 partial wrapping unexplained | Clarification note added explaining proof-of-concept scope |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-02 | Major | 3 | ~11 email-related test files omitted from fact-find coverage audit table (fact-find issue, not plan) |
| 1-04 | Moderate | 3 | Fact-find confidence dimensions not recalibrated against full test inventory (fact-find issue, not plan) |

### Autofix Summary

- Applied 2 point fixes: "10-item" → "9-item" count correction in Fact-Find Reference (line 82) and TASK-06 baseline (line 358)
- 0 section rewrites triggered
- Consistency scan: 0 cleanup edits needed (both fixes are isolated count corrections)
- 2 prior fact-find issues carried open (1-02, 1-04): these target the fact-find document, not the plan
- 3 Minor issues opened: all cosmetic/descriptive, none blocking execution

### Score

Overall: **4.0** (delta +0.5 from Round 2's 3.5; justified by confirmation that all 8 Round 2 issues are resolved — 3 Major factual errors eliminated, top 3 load-bearing claims verified with exact line-number matches)
