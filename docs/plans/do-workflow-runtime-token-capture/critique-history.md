---
Type: Working-Notes
Status: Active
Domain: Repo / Agents
Last-reviewed: 2026-03-11
---

# Critique History: do-workflow-runtime-token-capture

## Round 1 — 2026-03-11

Target: `fact-find.md`

- Verdict: credible
- Score: 4.7/5.0
- Critical: 0
- Major: 0
- Moderate: 1
- Minor: 0

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | `Key Findings` | Needed an explicit statement that Claude telemetry exists locally but does not yet expose a stable current-session seam. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Claude boundary too implicit | Added explicit current-session limitation language in findings, constraints, and engineering coverage. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |

## Round 2 — 2026-03-11

Target: `analysis.md`

- Verdict: credible
- Score: 4.6/5.0
- Critical: 0
- Major: 0
- Moderate: 0
- Minor: 1

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | `Chosen Approach` | Needed the `lp-do-ideas` baseline step called out explicitly, not just implied by “feature baseline.” |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Minor | Baseline stage too implicit | Added `lp-do-ideas` baseline wording to the chosen approach and planning handoff. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |

## Round 3 — 2026-03-11

Target: `plan.md`

- Verdict: credible
- Score: 4.7/5.0
- Critical: 0
- Major: 0
- Moderate: 1
- Minor: 0

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | `TASK-03` | The proof task needed an explicit requirement for non-zero token coverage in the final reporter output. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Moderate | Proof threshold too soft | Added a non-zero token-coverage requirement to TASK-03 acceptance and TC-03. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |

## Round 4 — 2026-03-11

Target: `analysis.md`, `plan.md`

- Verdict: credible
- Score: 4.8/5.0
- Critical: 0
- Major: 0
- Moderate: 1
- Minor: 0

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Moderate | `Chosen Approach`, `Selected Approach Summary` | The Claude boundary was too blunt: the workflow should distinguish unsafe implicit discovery from safe explicit-session capture. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-01 | Moderate | Claude boundary hid a valid explicit-session seam | Updated fact-find, analysis, and plan to allow Claude capture only when a concrete session id is supplied. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |
