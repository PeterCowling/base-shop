# Critique History: agent-failure-instruction-contract

## Round 1 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | TASK-01 Confidence + Task Summary + Overall-confidence Calculation | Confidence-Method declares min(dimensions) but TASK-01 stated 90% ≠ min(93%,90%,88%)=88%; propagated to wrong overall of 86% (correct: 84%) |
| 1-02 | Moderate | TASK-01 Artifact-Destination | Vague destination ("canonical repo instructions … chosen during build") creates discovery dependency for TASK-02 and TASK-03 |
| 1-03 | Moderate | TASK-03 Notes | Consumer path for MCP_PREFLIGHT_* output unresolved at planning time; implementation layer (printHumanResult vs McpPreflightIssue struct) not committed |
| 1-04 | Moderate | TASK-02 Notes | evaluate-git-safety.mjs policy-denial output flowing through agent-bin/git not in scope and not explained; implicit assumption that PreToolUse catches all policy denials for Claude sessions |
| 1-05 | Moderate | TASK-01 VC-01, VC-02 | VCs lack time-box dimension required by plan-lens VC quality check |
| 1-06 | Minor | Overall-confidence Calculation | 84.8% rounded to 86% in calculation section; correct rounding is 85% (and with corrected TASK-01 confidence, 84.4% → 84%) |
| 1-07 | Minor | Risks & Mitigations | Contract placement risk not enumerated: contract doc in wrong location won't be found by future implementors |

### Issues Confirmed Resolved This Round
None (first round — no prior issues to resolve).

### Issues Carried Open (not yet resolved)
None (all issues addressed in this round's autofix).

### Autofix Summary
- F-01: TASK-01 Confidence corrected from 90% to 88% (Task body + Task Summary table).
- F-02: Overall-confidence Calculation corrected (TASK-01 row, total, rounded result).
- F-03: Frontmatter Overall-confidence corrected from 86% to 84%.
- F-04: TASK-01 Artifact-Destination given concrete candidate path (AGENTS.md § Agent Failure Message Contract).
- F-05: VC-01 and VC-02 in TASK-01 given explicit time-box ("pass at task acceptance").
- F-06: TASK-02 Notes: added evaluator scope clarification.
- F-07: TASK-03 Notes: committed to printHumanResult() as first implementation layer; struct field deferred.
- F-08: Risks & Mitigations: added contract placement risk + mitigation.
- F-09 (consistency): Task Summary table TASK-01 Confidence corrected from 90% to 88%.
