---
Type: Results-Review
Status: Draft
Feature-Slug: brik-stock-count-variance-reason-codes
Review-date: 2026-02-28
artifact: results-review
---

# Results Review

<!-- Note: codemoot route attempted but produced no output file (process exited with no artifact); auto-drafted inline per SKILL.md fallback protocol. -->

## Observed Outcomes

- The batch stock count flow now shows an Italian-language reason-code dropdown whenever any item in a category has a negative quantity delta. Operators must select one of five codes (Scarto, Consumo staff, Rottura, Furto, Altro) before the count can be submitted; there is no skip option.
- Selecting "Altro" reveals an optional free-text note field. The note is stored in `entry.note` on the ledger; the reason code is stored in `entry.reason`.
- The Variance Breakdown section of StockManagement now includes a "Varianza conteggio batch per motivo" sub-table grouping negative-delta batch count entries by reason. Legacy entries without a structured reason code are grouped under "Non specificato".
- All 54 affected tests (31 BatchStockCount + 23 StockManagement) pass with no regressions.

## Standing Updates

- `docs/business-os/strategy/BRIK/apps/reception/worldclass-scan-2026-02-28.md`: the worldclass scan flagged "no reason codes on count variance" as an audit gap. This build closes that gap. The scan document should be updated to reflect that count variance reason codes are now in place.

## New Idea Candidates

- Variance CSV export already includes the reason column and was not changed; no new idea triggered.
- New standing data source: None.
- New open-source package: None.
- New skill: None.
- New loop process: None. The pattern of an operator-visible test failure exposing an English string in an Italian-language operator tool (Codex used "Unspecified" instead of "Non specificato") suggests a locale-consistency lint pass might be valuable, but no recurring build pattern exists yet to warrant a skill.
- AI-to-mechanistic: None.

None.

## Standing Expansion

No standing expansion: this is an operational improvement to the BRIK reception app. No new external data sources or layer-A standing artifacts were introduced.

## Intended Outcome Check

- **Intended:** Count variance entries always carry a reason code for negative deltas, enabling operators to categorise each variance event and produce a reason-coded breakdown in the variance report.
- **Observed:** The batch count flow now requires a reason code for negative deltas before submission. Reason codes are persisted on ledger entries and surfaced in the Variance Breakdown sub-table. Historical (pre-feature) entries without a structured reason code are grouped under "Non specificato" in the breakdown view. All test contracts verified; feature deployed with no regressions.
- **Verdict:** Met
- **Notes:** Full operator validation (confirming that "Non specificato" is the right label for legacy ungrouped entries) is recommended before treating the reason breakdown table as authoritative for audits. The implementation is correct per spec; the remaining open question is operator preference on label wording for legacy entries.
