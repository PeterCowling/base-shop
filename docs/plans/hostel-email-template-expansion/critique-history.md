# Critique History: hostel-email-template-expansion

## Round 1 — 2026-02-22

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-09 (T102), TASK-11 (T111, T116), TASK-11 (T121) | SITA ticket price conflict: €2.50 in `chiesaNuovaDepartures.json` vs €2.60 in `naplesAirportPositanoBus.json` / `positanoAmalfiBus.json`. Three distinct day-pass prices (€8.00, €10, €12.40) across three files. `sitaTickets.json` contains no prices. Templates T102, T111, T116 would have contradicted each other. |
| 1-02 | Moderate | TASK-05, TASK-11, TASK-13, TASK-15 task blocks + Task Summary table | Confidence scoring method violated: frontmatter declares `min(Implementation,Approach,Impact)` but 4 tasks used average/rounding. Corrected: TASK-05 85%, TASK-11 88%, TASK-13 85%, TASK-15 82%. Overall-confidence corrected 88%→87%. |
| 1-03 | Moderate | Active tasks list, Task Summary table, missing TASK-22 block | No CHECKPOINT (TASK-22) defined after TASK-21 (final IMPLEMENT). Breaks the IMPLEMENT→CHECKPOINT pattern. Gmail-derived templates are least-verified. |
| 1-04 | Moderate | TASK-21 Acceptance criteria | Google Maps review URL for Hostel Brikette not specified. Execution would stall without it. |
| 1-05 | Minor | TASK-11 task block | Missing Execution plan (Red/Green/Refactor). All other IMPLEMENT tasks have this section. |
| 1-06 | Minor | TASK-08, -10, -12, -16 CHECKPOINT blocks | Significantly abbreviated vs TASK-02/-04/-06. Missing Type, Execution-Skill, Horizon assumptions. Template drift. |
| 1-07 | Minor | Acceptance Criteria (overall) | No pre-expansion baseline captured for `draft_signal_stats`. Post-expansion monitoring is non-comparative. |

### Issues Confirmed Resolved This Round

None (Round 1 — no prior issues).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Minor | 1 | Abbreviated CHECKPOINT blocks (TASK-08, -10, -12, -16): operator-level concern only; no autofix applied as abbreviated blocks are functionally sufficient and were intentionally leaner |

### Autofixes Applied This Round

- 1-01 → Constraints section: canonical SITA price source designated; three day-pass products named; sitaTickets.json flagged as no-price stub. T102 and T116 template descriptions corrected to €2.50. T111 source citation stripped of sitaTickets.json. TASK-09 and TASK-11 Edge Cases sections updated with reconciliation notes. Risks table: 2 new rows added.
- 1-02 → Frontmatter Overall-confidence 88%→87%. Task Summary table corrected for TASK-05/11/13/15. Task blocks corrected with min() evidence. Overall-confidence Calculation narrative updated.
- 1-03 → TASK-22 CHECKPOINT block added. Active tasks list updated. Task Summary table row added. Parallelism Guide updated. TASK-21 Blocks updated to TASK-22.
- 1-04 → TASK-21 Acceptance: Google Maps URL confirmation step added.
- 1-05 → TASK-11: Execution plan (Red/Green/Refactor) section added.
- 1-07 → Noted as minor; no autofix required at plan stage.
