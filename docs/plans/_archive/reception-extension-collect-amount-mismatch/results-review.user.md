---
Type: Results-Review
Status: Draft
Feature-Slug: reception-extension-collect-amount-mismatch
Review-date: 2026-03-14
artifact: results-review
---

# Results Review

## Observed Outcomes
- `apps/reception/src/components/man/Extension.tsx` line 443: `nightlyRate` prop to `ExtensionPayModal` now passes `roundDownTo50Cents(selectedRow.nightlyRate)` instead of the raw unrounded value.
- For 1-night extensions: collect amount is unchanged (rounding the already-rounded value is idempotent).
- For 2+ night extensions: collect amount now matches table display. E.g. raw rate 65.33 → table 65,00 → modal 2 nights 130,00 (was 130,50).
- All existing `ExtensionPayModal.test.tsx` tests pass (integer nightlyRate inputs are unaffected).

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

- **Intended:** The Collect amount in the extension modal always equals the displayed nightly rate multiplied by the number of extension nights, with no rounding discrepancy.
- **Observed:** The extension modal now receives the rounded nightly rate. `pricePerGuest = roundDownTo50Cents(nightlyRate * nights)` operates on the already-rounded value, producing a collect amount that matches the table display exactly for any number of extension nights.
- **Verdict:** Met
- **Notes:** One-line call-site fix. The root cause was that the table applied `roundDownTo50Cents` for display but passed the raw float to the modal, causing divergence on multi-night extensions. Fix confirmed live: raw rate 65.25+ → table 65,00 → modal 2 nights 130,00.
