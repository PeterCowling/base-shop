# Critique History: startup-loop-learned-prescription-system

## Round 1 — 2026-03-10

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | fact-find.md | The brief assumed `gap_case_id` in later policy/evaluation seams without defining a canonical `gap_case` contract. |
| 1-02 | Major | fact-find.md | Milestone examples overreached current contract truth by treating `first_sale` and `first_stockist_live` as if they were already canonical runtime roots. |
| 1-03 | Moderate | fact-find.md | Metadata and decision spine were incomplete: missing `Last-reviewed`, missing `Relates-to charter`, dangling `Related-Plan`, and no explicit decision owner/question. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Missing canonical `gap_case` unit | Added `Canonical Gap Case Contract` as the first missing part, threaded it into opportunities, confidence, rehearsal trace, and planning notes. |
| 1-02 | Major | Milestone examples overstated beyond current contract roots | Reframed milestone section around code-backed roots (`first_qualified_lead`, `first_transaction_data_available`, `first_repeat_signal`, `wholesale_accounts_crossed_zero`) and demoted `first_sale` / `first_stockist_live` to optional aliases. |
| 1-03 | Moderate | Metadata and decision spine incomplete | Added `Last-reviewed`, `Relates-to charter`, explicit decision owner/question, and removed the dangling `Related-Plan` reference. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |

## Round 2 — 2026-03-10

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | plan.md | Overall-confidence arithmetic and header value were inconsistent with the task-weight calculation. |
| 2-02 | Major | plan.md | The original TASK-07 bundled richer sensing and unknown-prescription discovery outputs into one task, which was too wide to be one logical unit. |
| 2-03 | Major | plan.md | Milestone runtime implementation could have bypassed the normalization layer because TASK-06 did not depend on the seam-normalization task. |
| 2-04 | Moderate | plan.md | Validation contract IDs became inconsistent after the task split. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | Overall-confidence arithmetic mismatch | Updated the weighted calculation and header to `81%` with corrected task totals. |
| 2-02 | Major | Over-wide TASK-07 | Split the work into TASK-07 (richer sensing) and TASK-08 (discovery-output contract), then resequenced downstream tasks. |
| 2-03 | Major | Milestone runtime could bypass normalization | Added TASK-02 as a dependency for TASK-06 and made the normalization requirement explicit in the task notes. |
| 2-04 | Moderate | Validation contract IDs inconsistent | Renumbered the affected validation contract labels so each task now has a unique ID. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| None | - | - | None |
