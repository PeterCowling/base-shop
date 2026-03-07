# Critique History: lp-do-workflow-rehearsal-reflection-boundary

## Round 1 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Hypothesis & Validation Landscape → Recommended Validation Approach | Logic inversion: "accept only if pilot shows..." phrasing implies a go/no-go gate, but TASK-05 runs after all implementation tasks |
| 1-02 | Moderate | Confidence Inputs → Testability | Circular justification: 76% with threshold-breaker "add checkpoint task" — but TASK-05 already is that task |
| 1-03 | Moderate | Suggested Task Seeds | No task seed for eventual `simulation-protocol.md` path rename after terminology bridge stabilises |
| 1-04 | Moderate | Risks rows 3 and 5 | Top-2 highest-impact risk mitigations are self-referential (scope-creep mitigation = "enforce same-outcome inclusion"; reflection-only mitigation = wording only) |
| 1-05 | Minor | Suggested Task Seeds → TASK-02 | Four files in one task, no parallelism note — could produce mid-task inconsistency |
| 1-06 | Minor | Execution Routing Packet → Post-delivery measurement | "Next 5 builds" has no threshold for acceptable vs. unacceptable adherence |

### Issues Confirmed Resolved This Round
None (first round).

### Issues Carried Open (not yet resolved)
| ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-05 | Minor | 1 | TASK-02 blast radius note — four files, no parallelism guidance |
| 1-06 | Minor | 1 | Post-delivery measurement lacks numeric threshold |

---

## Round 2 — 2026-03-06 (target: plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Task Summary + Overall-confidence Calculation + frontmatter | Confidence inflation: TASK-02/03 shown at 80% in Task Summary but task-level min(85,85,75)=75%; TASK-04 shown at 85% but min(90,90,80)=80%; Overall-confidence was 85%, corrected to 80% |
| 2-02 | Moderate | Plan Gates | Auto-build eligible: Yes without noting TASK-02/03 will trigger auto-replan at build time |
| 2-03 | Moderate | TASK-02 VC-01 | Pass rule was subjective ("reviewer confirms"); now objectified to grep log + exemption citation |
| 2-04 | Minor | TASK-05 Acceptance | Target (3 plans) inconsistent with VC minimum (≥2); aligned to VC wording |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-05 | Minor | TASK-02 blast radius — no parallelism note | Addressed in TASK-02 Notes/references: internal ordering documented (shared protocol first), parallelism within task confirmed safe |
| 1-06 | Minor | Post-delivery measurement lacks threshold | TASK-04 VC-03 establishes baseline count; TASK-05 pilot notes record signal per lens; sufficient anchor for future comparison |

### Issues Carried Open
| ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-01 | Major | 0 (fixed this round) | Resolved by autofix: all confidence figures corrected in Task Summary, Overall-confidence Calculation, and frontmatter |
| 2-02 | Moderate | 0 (fixed this round) | Resolved by autofix: Plan Gates note added |
| 2-03 | Moderate | 0 (fixed this round) | Resolved by autofix: VC-01 pass rule objectified |
| 2-04 | Minor | 0 (fixed this round) | Resolved by autofix: TASK-05 Acceptance aligned to VC wording |
