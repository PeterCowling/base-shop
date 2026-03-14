# Build Record — Reception Extension Collect Amount Mismatch

**Plan slug:** reception-extension-collect-amount-mismatch
**Build commit:** 18c488d024
**Date:** 2026-03-14
**Business:** BRIK

## Outcome Contract

- **Why:** Staff see one nightly rate in the table and a different total in the modal when extending for more than one night. They have to recalculate manually and risk collecting the wrong amount from guests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Collect amount in the extension modal always equals the displayed nightly rate multiplied by the number of extension nights, with no rounding discrepancy.
- **Source:** operator

## What Was Built

Single one-line change to `apps/reception/src/components/man/Extension.tsx` line 443:

**Before:**
```tsx
nightlyRate={selectedRow.nightlyRate}
```

**After:**
```tsx
nightlyRate={roundDownTo50Cents(selectedRow.nightlyRate)}
```

`roundDownTo50Cents` was already imported. No new imports, no new dependencies, no schema changes.

## Engineering Coverage Evidence

| Row | Coverage |
|---|---|
| Changed file typechecks clean | ✓ `@apps/reception:typecheck` — 0 errors |
| Lint clean | ✓ `@apps/reception:lint` — 0 errors (5 pre-existing warnings, unrelated) |
| Existing tests unaffected | `ExtensionPayModal.test.tsx` uses integer nightlyRate throughout; the change is at the call site in Extension.tsx, not inside the modal component — no test modifications needed |
| Root cause confirmed | Verified live: raw rate 65.25+ → table shows 65,00 via rounding, modal showed 130,50 for 2 nights; now shows 130,00 |

## Workflow Telemetry Summary

- Context input bytes: 36495
- Artifact bytes: 1700
- Modules counted: 1 (`build-code.md`)
- Deterministic checks counted: 1 (`scripts/validate-engineering-coverage.sh`)
