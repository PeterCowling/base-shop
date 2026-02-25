# Critique History: startup-loop-legal-container-insertion

## Round 1 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Proposed LEGAL contract | No explicit hard gate contract between LEGAL and MEASURE (risk of bypass). |
| 1-02 | Major | Suggested task seeds | No canonical LEGAL artifact output paths defined, making acceptance non-testable. |
| 1-03 | Moderate | Suggested task seeds | Proposed process IDs did not match existing assignment naming convention. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Missing LEGAL hard gate definition | Added `GATE-LEGAL-00 (Hard)` proposal and pass criteria in contract + task seeds. |
| 1-02 | Major | Missing LEGAL artifact path contract | Added proposed canonical outputs for LEGAL-01 and LEGAL-02 under `docs/business-os/strategy/<BIZ>/`. |
| 1-03 | Moderate | Process ID naming mismatch | Updated suggested process IDs to `LEG-1` and `LEG-2` to align with process-assignment conventions. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 1 | Jurisdiction default (EU/US/dual) remains unresolved and must be operator-decided during planning. |

---

## Round 2 — 2026-02-24

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Task Summary table | Confidence column inflated on 3 tasks (TASK-01: 88→85, TASK-02: 83→80, TASK-05: 84→82); contradicts stated min(I,A,Im) Confidence-Method. |
| 2-02 | Major | TASK-01 Decision inputs + Risks | GATE-ASSESSMENT-01 comment in loop-spec.yaml references MEASURE-01 but actual edge is ASSESSMENT→MEASURE-00; ambiguity not surfaced in plan, creates build-time gate insertion risk. |
| 2-03 | Moderate | TASK-03, TASK-04, TASK-05 Execution plan | Mixed-track tasks used code-only "Red -> Green -> Refactor" format instead of required "VC-first Red -> Green -> Refactor". |
| 2-04 | Moderate | Validation Contracts VC-03, VC-04, VC-05 | Each fails 2 VC quality principles: missing time-boxing; VC-03 also underspecified on failure-diagnostic path. |
| 2-05 | Minor | Observability section | Metrics ("LEGAL completion rate", "legal-tagged rework events") have no implementation path in plan tasks. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | Task Summary confidence inflation | Corrected TASK-01→85%, TASK-02→80%, TASK-05→82% in table and task bodies. Bottom calculation already used correct values. |
| 2-02 | Major | Gate placement ambiguity not surfaced | Added third decision-input question to TASK-01 naming MEASURE-01 vs MEASURE-00 discrepancy; added new risk row in Risks & Mitigations. |
| 2-03 | Moderate | Code-only execution plan on mixed-track tasks | Changed TASK-03, TASK-04, TASK-05 to "VC-first Red -> Green -> Refactor". |
| 2-04 | Moderate | VC time-boxing missing | Added time-box clause to VC-03, VC-04, VC-05 in Validation Contracts section; added failure-diagnostic language to VC-03-02. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 2 | Jurisdiction default (EU/US/dual) still requires operator decision; options and recommendation documented in TASK-01 but answer not logged. |
| 2-05 | Minor | 1 | Observability metrics lack implementation path — no task covers instrumentation setup for LEGAL completion rate tracking. |

---

## Round 3 — 2026-02-24 (operator review + plan fixes)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Proposed Approach | Container/stage semantics contradictory — LEGAL referenced as both container label and ordering node with no explanation of which model applies |
| 3-02 | Major | Proposed Approach | Gate enforcement definition absent — hard gate intent stated but enforcement point, bypass policy, observable signal, and GATE-ASSESSMENT-01 disposition not specified |
| 3-03 | Major | TASK-01 | Decision task underspecified — only 2 of 4 required decision outputs present; workstream placement and gate pass schema missing; "Edge-case review complete: Yes" while gate disposition was open |
| 3-04 | Major | TASK-01 | Jurisdiction "default" is wrong primitive — must be required explicit operator selection with recorded rationale, not a silent fallback |
| 3-05 | Major | TASK-03 | Workstream taxonomy decision (new LEG workstream vs FIN sub-workstream) left as TASK-03 scout — this is a structural choice that impacts reporting, routing, and schema; must be decided in TASK-01 |
| 3-06 | Major | TASK-04 | Artifact contracts too vague to be lintable — no committed artifact names, canonical paths, field lists, or sign-off role |
| 3-07 | Moderate | TASK-05 | Regeneration command left as scout rather than required acceptance criterion; no operator-delta paragraph for workflow guide; parity check not in CI |
| 3-08 | Moderate | TASK-06 | Bypass prevention test absent — topology ordering tests do not verify that gate actually blocks runtime advancement |
| 3-09 | Moderate | TASK-07 | No explicit rollout no-go conditions — checkpoint has no enumerated failure criteria |
| 3-10 | Moderate | (missing section) | Migration strategy absent — no handling for in-flight runs when mandatory stages are inserted |
| 3-11 | Moderate | Observability | Metrics have no numerator/denominator definitions, events, or thresholds (carried from 2-05) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Container/stage semantics | Added Container/Stage Semantic Model subsection to Proposed Approach; confirmed LEGAL follows ASSESSMENT container-completion-node pattern |
| 3-02 | Major | Gate enforcement definition | Added Gate Enforcement Contract subsection with enforcement point options, bypass policy, observable signal, and GATE-ASSESSMENT-01 disposition |
| 3-03 | Major | TASK-01 underspecified | Full TASK-01 rewrite; 4 required decision outputs enumerated; "Edge-case review complete" changed to No |
| 3-04 | Major | Jurisdiction silent default | Output 3 in TASK-01 mandates explicit operator selection written into artifact; gate fails on absent or placeholder field |
| 3-05 | Major | Workstream decision in wrong task | Output 2 in TASK-01 requires workstream placement decision before TASK-03; scout removed from TASK-03 |
| 3-06 | Major | Artifact contracts vague | TASK-04 artifact format decision locked (one-per-stage); artifact names, paths, field lists, and sign-off role all specified |
| 3-07 | Moderate | Regen as scout | TASK-05 acceptance updated: regen in same commit, parity check in CI, operator-delta paragraph required in workflow guide |
| 3-08 | Moderate | Bypass prevention test absent | TC-06-03 added: test asserts hard block on MEASURE-00 advancement when LEGAL artifacts absent |
| 3-09 | Moderate | No rollout no-go conditions | Six explicit no-go conditions added to TASK-07 |
| 3-10 | Moderate | Migration strategy absent | Migration & Versioning section added with versioned-spec/new-runs-only strategy, in-flight run handling, and rollback path |
| 3-11 | Moderate | Observability not instrumentable | Numerator/denominator definitions, block event tied to GATE-LEGAL-00, and investigation thresholds added to Observability section |
| 2-05 | Minor | Observability metrics no implementation path | Resolved with 3-11 fix; block event is in scope of TASK-01/TASK-02; metric computation is report-only (no new instrumentation task needed at this stage) |

### Issues Carried Open (not yet resolved)
None.

---

## Round 4 — 2026-02-24 (jurisdiction decision)

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-04 | Moderate | Jurisdiction decision not logged | Operator confirmed Italy. Logged in Decision Log: jurisdictions `["IT", "EU"]`, UIBM + EUIPO trademark targets, Italian Consumer Code + EU UCPD for claims/terms. US out of scope for initial pass. |

### Issues Opened This Round
None.

### Issues Carried Open (not yet resolved)
None.
