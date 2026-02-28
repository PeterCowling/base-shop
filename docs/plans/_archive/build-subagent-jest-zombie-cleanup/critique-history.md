# Critique History: build-subagent-jest-zombie-cleanup

## Round 1 — 2026-02-25

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Frontmatter + Execution Routing Packet | `Execution-Track: business-artifact` is wrong; deliverables are repo file edits → should be `code`; routes to wrong executor and demands VC instead of TC contracts |
| 1-02 | Moderate | Risks table, Suggested Task Seeds | `build-spike.md` zombie risk listed as Medium; actual executor file confirms SPIKE has no Jest step; likelihood should be Low; Task Seeds item 2 adjusted to optional |
| 1-03 | Moderate | Evidence Gap Review | "25 lines" stale reference (file is 23 lines); appeared in 3 places; cleaned up |
| 1-04 | Moderate | Planning Constraints | Missing: (a) pre-fix source verification step; (b) guard-effectiveness confirmation for non-interactive shells; two missing risks also added to risk table |
| 1-05 | Minor | Frontmatter | `Trigger-Intended-Outcome` inline pipe format — confirmed intentional per template; no change required |
| 1-06 | Minor | Frontmatter | `Deliverable-Type: doc` is non-canonical; corrected to `code-change` |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

None — all issues were autofixed in Round 1.

## Round 2 — 2026-02-25

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Evidence Audit + Questions + Evidence Gap Review | Unsupported claim that `AGENTS.md` mandates `test:governed`; corrected to reflect that explicit command policy lives in `docs/testing-policy.md` |
| 2-02 | Major | Fact-Find structure | Missing `## Test Landscape` section for `Execution-Track: code`; added full section (infrastructure, gaps, testability, recommended approach) |
| 2-03 | Moderate | Suggested Task Seeds + Planning Constraints | Fix sequencing was inverted (implementation before source attribution); reordered to require investigation first |
| 2-04 | Moderate | Risks table | Mitigation over-claimed guard certainty in non-interactive mode; revised to require explicit hook/wrapper coverage confirmation |
| 2-05 | Moderate | Remaining Assumptions / Planning risks | Incident-source attribution remains unverified until planned investigation task executes |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | `AGENTS.md` mandate claim incorrect | Replaced with evidence-backed distinction between AGENTS testing rules and `docs/testing-policy.md` command contract |
| 2-02 | Major | Missing code-track Test Landscape | Added `### Test Landscape` with all required subsections |
| 2-03 | Moderate | Source attribution not first in execution order | Added required first INVESTIGATE seed and rollout note |
| 2-04 | Moderate | Guard mitigation certainty overstated | Reworded mitigation to conditional + explicit verification step |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-05 | Moderate | 1 | Source attribution for the 2026-02-25 zombie incident is still an assumption pending the planned investigation task |

## Round 3 — 2026-02-25

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-01 and TASK-04 confidence breakdowns | Dimension scores were set to exactly `80%` without held-back-test justification required by confidence scoring rules |
| 3-02 | Moderate | TASK-01 and TASK-04 task blocks | Missing `What would make this >=90%` entries for INVESTIGATE tasks |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Moderate | Exact-threshold scoring without held-back test | Re-scored affected dimensions away from 80 to eliminate threshold ambiguity while preserving task ordering and confidence rationale |
| 3-02 | Moderate | Missing >=90 uplift path on INVESTIGATE tasks | Added explicit `What would make this >=90%` criteria to both INVESTIGATE tasks |

### Issues Carried Open (not yet resolved)

None.

## Round 4 — 2026-02-25

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Critical | Proposed Approach / All tasks | Primary hypothesis (ungoverned invocations caused zombies) is contradicted by telemetry: all `governed:false` events on 2026-02-25 had `admitted:false` (blocked). Actual zombie events are `governed:true, timeout_killed:true, kill_escalation:sigterm`. Doc fix may not address actual cause. |
| 4-02 | Major | TASK-01 Questions to answer | Questions were framed as confirmation-seeking; did not reference the directly queryable telemetry fields (`governed`, `admitted`, `timeout_killed`, `kill_escalation`); missing question about `governed:false, admitted:true` existence check. |
| 4-03 | Major | Risks & Mitigations | "Misattributed incident source" risk lacked acknowledgement that telemetry is already partially queryable and contains evidence against the primary hypothesis. |
| 4-04 | Moderate | TASK-02 Impact confidence | Impact confidence of 85% not supportable if actual zombie mechanism is SIGTERM escalation within the governed runner; dimension not downgraded pending TASK-01 confirmation. |
| 4-05 | Moderate | Constraints & Assumptions | Assumption about ungoverned path had no counter-evidence flag despite telemetry being directly inspectable at plan-creation time. |
| 4-06 | Minor | TASK-01 Validation contract | Validation contract did not specify telemetry fields as required primary evidence sources; under-specified for the executing agent. |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-01 | Critical | Primary hypothesis not flagged as contradicted by available telemetry | Added counter-evidence note to Assumptions; added SIGTERM-source replan trigger to Chosen approach; added telemetry-evidence risk row to Risks & Mitigations |
| 4-02 | Major | TASK-01 missing telemetry-field questions | Added third question to TASK-01 asking for `governed:false, admitted:true` existence check and SIGTERM pivot condition |
| 4-03 | Major | Risks section didn't reference telemetry evidence | Added dedicated risk row for SIGTERM escalation as zombie source with telemetry-based mitigation |
| 4-05 | Moderate | Assumption missing counter-evidence | Added inline counter-evidence note citing observed telemetry pattern |
| 4-06 | Minor | TASK-01 validation contract under-specified | Extended validation contract to require citation of `governed`/`admitted`/`timeout_killed`/`kill_escalation` fields and explicit alternative-hypothesis requirement |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 4-04 | Moderate | 1 | TASK-02 Impact confidence of 85% is potentially over-stated pending TASK-01 attribution. Not autofixed: re-scoring before TASK-01 completes would be premature; impact confidence should be re-evaluated during TASK-01 execution if attribution confirms SIGTERM source. |

## Replan Round 1 — 2026-02-25

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-04 | Moderate | TASK-02 Impact confidence of 85% over-stated | Impact reduced to 75% in replan with telemetry evidence: all 7 ungoverned events `admitted:false`; zombie source confirmed as `kill_escalation:sigterm` in governed runner; min(90,85,75)=75% |

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| R1-01 | None (topology) | Plan | TASK-05 added: IMPLEMENT for `baseshop_terminate_command_tree` process-group kill hardening; depends on TASK-01; 80% confidence |

### Issues Carried Open (not yet resolved)
None.
