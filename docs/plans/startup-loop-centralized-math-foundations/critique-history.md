---
Type: Critique-History
Feature-Slug: startup-loop-centralized-math-foundations
Last-updated: 2026-03-09
---

# Critique History — startup-loop-centralized-math-foundations

## Round 1 — 2026-03-09

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Task graph | Calibration and regret were named, but there was no replay or maturation-window lane to make them mathematically credible. |
| 1-02 | Major | Plan-wide rollout semantics | The draft relied on scattered "shadow/advisory" notes without one explicit policy-authority ladder for when outputs may influence the queue. |
| 1-03 | Major | TASK-03, TASK-10, TASK-13 | Stochastic exploration and regret were underspecified because the plan did not yet require a decision journal with candidate-set snapshots and action propensities. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| None | None | None | Initial critique round |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Major | 1 | Replay and maturation-window evaluation missing |
| 1-02 | Major | 1 | No explicit authority ladder |
| 1-03 | Major | 1 | No decision-journal / propensity contract |

## Round 2 — 2026-03-09

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| None | None | None | No new architectural issues opened after the revised rehearsal |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Replay and maturation-window evaluation missing | Added TASK-16 plus maturity-window, replay, and shadow-policy requirements across TASK-04, TASK-06, TASK-10, TASK-13, and TASK-14. |
| 1-02 | Major | No explicit authority ladder | Added a plan-level Policy Authority Ladder and aligned rollout rules to it. |
| 1-03 | Major | No decision-journal / propensity contract | Updated TASK-03, TASK-05, TASK-07, TASK-10, TASK-13, and TASK-14 to require decision-context snapshots, action probabilities, and replay-ready policy traces. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | None | 0 | No open architectural issues remain at planning level |
