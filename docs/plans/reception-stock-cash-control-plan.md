---
Type: Plan
Status: Active
Domain: Reception
Last-reviewed: 2026-01-13
Relates-to charter: none
---

# Reception - Stock + Cash Control Plan

Goal: provide management control so stock or cash cannot disappear without
being detected, with clear accountability for every change. We are not aiming
for full accounting compliance yet.

## Scope + constraints

- Desktop-only UX.
- Use Firebase Realtime Database; no new paid Cloudflare services.
- Use existing Reception roles (owner/developer/staff) and reauth for sensitive actions.
- Keep workflows simple: count, record, reconcile, and flag discrepancies.

## Current state snapshot (from code)

Stock:
- Ingredient stock exists at `inventory/ingredients` with manual updates.
- Bar sales decrement ingredient quantities, but no movement ledger or audit trail.
- `/stock` screen is a placeholder with no persistence.

Cash:
- Till open/close/reconcile flows with denomination breakdowns exist.
- Safe management and reconciliation flows exist (deposit/withdraw/exchange/bank).
- Discrepancies are recorded, but transactions can be edited/deleted without audit.
- Reconciliation workbench relies on missing `/api/pms-postings` and `/api/terminal-batches`.

## Active tasks

- [x] REC-STOCK-01: Inventory data model + ledger
  - Scope:
    - Add `inventory/items` with unit, reorder threshold, and optional recipe mapping.
    - Add `inventory/ledger` with entries: type, qty, user, timestamp, reason, ref.
    - Add Zod schemas + typed hooks for items + ledger.
  - Dependencies: None.
  - Definition of done:
    - Stock changes are recorded as immutable ledger entries.
    - Current on-hand quantity is derived from ledger + opening count.

- [x] REC-STOCK-02: Replace `/stock` placeholder with real inventory management
  - Scope:
    - Show items, expected on-hand, last count, variance.
    - Provide actions: receive purchase, count, adjust/waste, transfer.
    - Require reason for adjustments and reauth for large changes.
  - Dependencies: REC-STOCK-01.
  - Definition of done:
    - Stock screen updates inventory via ledger entries, not direct set().

- [x] REC-STOCK-03: Ingredient stock workflow
  - Scope:
    - Migrate `IngredientStock` to use ledger-based adjustments.
    - Add a simple recipe map so bar items decrement the correct inventory.
    - Log each bar sale as stock consumption entries.
  - Dependencies: REC-STOCK-01.
  - Definition of done:
    - All ingredient changes are auditable and linked to sales or manual adjustments.

- [x] REC-STOCK-04: Stock count + variance reporting
  - Scope:
    - Add a periodic count workflow (daily/weekly) with variance capture.
    - Provide a variance report (by item, user, reason, date).
  - Dependencies: REC-STOCK-01.
  - Definition of done:
    - Management can see variance trends and who performed counts/adjustments.

- [x] REC-STOCK-05: Alerts for low stock and abnormal shrinkage
  - Scope:
    - Trigger low-stock flags based on reorder thresholds.
    - Add anomaly detection (e.g., shrinkage > threshold in 24h).
  - Dependencies: REC-STOCK-01.
  - Definition of done:
    - Low stock and shrinkage warnings appear on the stock dashboard.

- [x] REC-CASH-01: Shift-based cash ledger
  - Scope:
    - Create a `tillShifts` node with shiftId, open/close metadata, user.
    - Tag all cashCounts, safeCounts, and transactions with shiftId.
  - Dependencies: None.
  - Definition of done:
    - Every cash movement can be traced to a shift and user.

- [x] REC-CASH-02: Make financial transactions immutable
  - Scope:
    - Replace edit/delete with adjustment/void records (keep originals).
    - Require reason + reauth for adjustments.
    - Add audit log for edits/voids.
  - Dependencies: REC-CASH-01.
  - Definition of done:
    - No transactions are hard-deleted or overwritten without a trace.

- [x] REC-CASH-03: Role gating + reauth coverage
  - Scope:
    - Replace name-based checks with role checks in cash flows.
    - Require reauth for safe reset/reconcile, tender removal, bank deposit,
      and cash drawer limit changes.
  - Dependencies: None.
  - Definition of done:
    - Sensitive actions are limited to owner/developer and reauthenticated.

- [x] REC-CASH-04: Reconciliation inputs
  - Scope:
    - Implement `/api/pms-postings` and `/api/terminal-batches` or replace
      with a manual entry flow stored in Firebase.
    - Surface missing-data warnings in Reconciliation Workbench.
  - Dependencies: None.
  - Definition of done:
    - Reconciliation screens use real data or a managed manual fallback.

- [x] REC-CASH-05: Variance alerts + sign-off
  - Scope:
    - Add variance thresholds for till and safe.
    - Require a note and sign-off for variances over threshold.
  - Dependencies: REC-CASH-01.
  - Definition of done:
    - Variances are visible, tracked, and cannot be ignored silently.

- [x] REC-CASH-06: Management reporting
  - Scope:
    - Add daily summary: expected vs actual, deposits, withdrawals, keycards,
      and discrepancies by user.
    - Add export (CSV) for cashCounts, safeCounts, and variances.
  - Dependencies: REC-CASH-01.
  - Definition of done:
    - Managers can review cash movement and variance without manual DB work.

- [x] REC-CASH-07: Firebase rules for accountability
  - Scope:
    - Restrict direct writes to finance nodes by role.
    - Block overwrites of immutable records; allow only append/void actions.
  - Dependencies: REC-CASH-02, REC-CASH-03.
  - Definition of done:
    - Unauthorized or destructive writes are blocked server-side.

## Notes

- Stock and cash both need immutable ledgers with clear user attribution.
- Keep offline mode read-only for these areas to avoid lost write intent.