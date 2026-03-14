---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-extension-collect-amount-mismatch
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314171800-BRIK-EXT-012
Related-Plan: none
---

# Reception Extension Collect Amount Mismatch Micro-Build

## Scope
- Change: Pass `roundDownTo50Cents(selectedRow.nightlyRate)` instead of `selectedRow.nightlyRate` to `ExtensionPayModal` in `Extension.tsx`. This makes the modal always compute from the same rounded value displayed in the table.
- Non-goals: Changes to `ExtensionPayModal` itself; changes to city tax calculations; changes to the "Extend all" / booking-level amount.

## Execution Contract
- Affects: `apps/reception/src/components/man/Extension.tsx` (line 443)
- Acceptance checks:
  - Collect amount for 1-night extension equals `roundDownTo50Cents(nightlyRate)` — unchanged from before
  - Collect amount for 2-night extension equals `roundDownTo50Cents(nightlyRate) * 2` with no rounding surprise (e.g. raw 65.33 → table 65,00 → modal 2 nights 130,00)
  - `ExtensionPayModal.test.tsx` passes (integer nightlyRate tests are unaffected)
- Validation commands: `pnpm --filter scripts lint` (CI runs jest; no local test execution)
- Rollback note: revert the single-line change to pass `selectedRow.nightlyRate` instead.

## Outcome Contract
- **Why:** Staff see one nightly rate in the table and a different total in the modal when extending for more than one night. They have to recalculate manually and risk collecting the wrong amount.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Collect amount in the extension modal always equals the displayed nightly rate multiplied by the number of extension nights, with no rounding discrepancy.
- **Source:** operator
