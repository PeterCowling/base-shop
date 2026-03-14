---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-extension-city-tax-activity-guard
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313150000-0002
Related-Plan: none
---

# Extension — City Tax Activity Guard Micro-Build

## Scope
- Change: Move `saveActivity(CITY_TAX_PAYMENT)` inside the `if (record.balance > 0)` guard in `markCityTaxPaid` (ExtensionPayModal.tsx lines 126–140) so the activity log entry is only written when the guest actually had an outstanding city tax balance.
- Non-goals: No change to key extension logic, no refactor of partial-failure handling, no UI changes.

## Execution Contract
- Affects:
  - `apps/reception/src/components/man/modals/ExtensionPayModal.tsx` (primary)
  - `apps/reception/src/components/man/modals/__tests__/ExtensionPayModal.test.tsx` (test)
- Acceptance checks:
  1. `saveActivity(code 9)` is NOT called when `record.balance === 0`
  2. `saveActivity(code 9)` IS called when `record.balance > 0`
  3. Error handling for `!cityTaxActivityResult.success` still applies within the guard
  4. Existing tests continue to pass
- Validation commands:
  - `pnpm --filter reception test -- --testPathPattern=ExtensionPayModal --no-coverage`
- Rollback note: Single-line move of `saveActivity` call — trivially reversible.

## Outcome Contract
- **Why:** Every time an extension is confirmed, the system logs 'city tax paid' activity even if the guest already paid in full. This creates false duplicate entries in the guest activity log.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The 'city tax paid' activity entry is only written when the guest actually had an outstanding city tax balance.
- **Source:** operator
