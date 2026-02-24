---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Task-ID: TASK-01
---

# TASK-01 Migration Inventory and Parity Contract

## Scope
This artifact closes TASK-01 by locking a route-to-wave inventory for all Reception routes, defining parity selectors/interactions for the locked route set, and listing native-element hotspot files by wave from the `HEAD` baseline.

## VC Results
- `VC-01` route count command:
  - `find apps/reception/src/app -name page.tsx | wc -l`
  - Observed: `26`
- `VC-02` global baseline native tag counts (`HEAD`):
  - `git grep -n "<button\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `270`
  - `git grep -n "<input\b\|<select\b\|<textarea\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `134`
  - `git grep -n "<table\b\|<thead\b\|<tbody\b\|<tr\b\|<th\b\|<td\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `561`
- `VC-03` route assignment coverage:
  - 26/26 routes assigned to Waves 1-4.

## Route Inventory (26/26)

| Route | Entry file | Primary UI surface | Assigned wave | Notes |
|---|---|---|---|---|
| `/` | `apps/reception/src/app/page.tsx` | redirect to `/bar` | Wave 1 | Parity follows `/bar` unauthenticated login state. |
| `/alloggiati` | `apps/reception/src/app/alloggiati/page.tsx` | `@/components/man/Alloggiati` | Wave 3 | `man/*` domain. |
| `/audit` | `apps/reception/src/app/audit/page.tsx` | `@/components/search/Search` | Wave 2 | Search/table-heavy route. |
| `/bar` | `apps/reception/src/app/bar/page.tsx` | `@/components/bar/Bar` (+ `Login` when unauthenticated) | Wave 1 | Locked parity state is unauthenticated login. Residual bar-specific UI continues in Wave 4. |
| `/checkin` | `apps/reception/src/app/checkin/page.tsx` | dynamic `@/components/checkins/CheckinContent` | Wave 1 | Locked parity route. |
| `/checkout` | `apps/reception/src/app/checkout/page.tsx` | `@/components/checkout/Checkout` | Wave 1 | Locked parity route. |
| `/doc-insert` | `apps/reception/src/app/doc-insert/page.tsx` | `@/components/checkins/docInsert/DocInsertPage` | Wave 3 | Doc-insert sits in form-heavy checkin subdomain. |
| `/email-automation` | `apps/reception/src/app/email-automation/page.tsx` | `@/components/emailAutomation/EmailProgress` | Wave 4 | Remaining route cluster. |
| `/end-of-day` | `apps/reception/src/app/end-of-day/page.tsx` | `@/components/reports/EndOfDayPacket` | Wave 2 | Table-heavy reports domain. |
| `/extension` | `apps/reception/src/app/extension/page.tsx` | `@/components/man/Extension` | Wave 3 | `man/*` domain. |
| `/ingredient-stock` | `apps/reception/src/app/ingredient-stock/page.tsx` | `@/components/inventory/IngredientStock` | Wave 2 | Inventory/table-heavy domain. |
| `/live` | `apps/reception/src/app/live/page.tsx` | `@/components/live/Live` | Wave 4 | Remaining route cluster. |
| `/loan-items` | `apps/reception/src/app/loan-items/page.tsx` | local `LoanItemsContent` -> `@/components/loans/Loans` | Wave 3 | Loans/form-modal domain. |
| `/menu-performance` | `apps/reception/src/app/menu-performance/page.tsx` | `@/components/analytics/MenuPerformanceDashboard` | Wave 4 | Remaining route cluster; requires TASK-11 `Affects` coverage of `analytics/*`. |
| `/prepare-dashboard` | `apps/reception/src/app/prepare-dashboard/page.tsx` | `@/components/prepare/PrepareDashboard` | Wave 4 | Remaining route cluster; requires TASK-11 `Affects` coverage of `prepare/*`. |
| `/prepayments` | `apps/reception/src/app/prepayments/page.tsx` | `@/components/prepayments/PrepaymentsContainer` | Wave 3 | Prepayments/form-modal domain. |
| `/prime-requests` | `apps/reception/src/app/prime-requests/page.tsx` | `@/components/prime-requests/PrimeRequestsQueue` | Wave 2 | Queue/table-heavy domain. |
| `/real-time-dashboard` | `apps/reception/src/app/real-time-dashboard/page.tsx` | `@/components/reports/RealTimeDashboard` | Wave 2 | Reports/table-heavy domain. |
| `/reconciliation-workbench` | `apps/reception/src/app/reconciliation-workbench/page.tsx` | `@/components/till/ReconciliationWorkbench` | Wave 1 | Located under `till/*`, therefore covered by Wave 1 `till` scope. |
| `/rooms-grid` | `apps/reception/src/app/rooms-grid/page.tsx` | local `RoomsGridClient` -> `@/components/roomgrid/RoomsGrid` | Wave 4 | Remaining route cluster. |
| `/safe-management` | `apps/reception/src/app/safe-management/page.tsx` | `@/components/safe/SafeManagement` | Wave 1 | Locked parity route. |
| `/safe-reconciliation` | `apps/reception/src/app/safe-reconciliation/page.tsx` | `@/components/safe/SafeReconciliation` | Wave 1 | `safe/*` scope in Wave 1. |
| `/statistics` | `apps/reception/src/app/statistics/page.tsx` | `@/components/stats/Statistics` | Wave 4 | Remaining route cluster. |
| `/stock` | `apps/reception/src/app/stock/page.tsx` | `@/components/man/Stock` | Wave 3 | `man/*` domain. |
| `/till-reconciliation` | `apps/reception/src/app/till-reconciliation/page.tsx` | `@/components/till/Till` | Wave 1 | Locked parity route. |
| `/variance-heatmap` | `apps/reception/src/app/variance-heatmap/page.tsx` | `@/components/reports/VarianceHeatMap` | Wave 2 | Reports/table-heavy domain. |

### Wave distribution summary
- Wave 1: 8 routes
- Wave 2: 6 routes
- Wave 3: 6 routes
- Wave 4: 6 routes

## Migration completion status (2026-02-23)

| Wave | Route coverage | Status | Completion task | Evidence artifact |
|---|---:|---|---|---|
| Wave 1 | 8/8 | Complete | `TASK-08` | `docs/plans/reception-ds-centralization-growth-first/artifacts/wave-1-results.md` |
| Wave 2 | 6/6 | Complete | `TASK-09` | `docs/plans/reception-ds-centralization-growth-first/artifacts/wave-2-results.md` |
| Wave 3 | 6/6 | Complete | `TASK-10` | `docs/plans/reception-ds-centralization-growth-first/artifacts/wave-3-results.md` |
| Wave 4 | 6/6 | Complete | `TASK-11` | `docs/plans/reception-ds-centralization-growth-first/artifacts/wave-4-results.md` |

Overall route completion: `26/26` complete.

## Locked Parity Contract

Locked parity set (minimum contract): unauthenticated `/bar` login state, `/checkin`, `/checkout`, `/till-reconciliation`, `/safe-management`.

| Route + state | Selector contract (must remain stable) | Interaction contract (must remain stable) |
|---|---|---|
| `/bar` (unauthenticated login) | Heading text `Sign in to Reception`; `#email`; `#password`; submit button `Sign in`; password toggle button with `aria-label` (`Show password`/`Hide password`) | Password visibility toggle changes `#password` input type (`password` <-> `text`); dark-mode toggle in `LoginContainer` flips theme mode classing without breaking form controls |
| `/checkin` | Heading text `CHECKINS`; checkbox label `Show cancelled`; button/text state `Rooms Ready` / `Rooms are Set` | `Show cancelled` checkbox toggles visible row set; clicking `Rooms Ready` transitions to `Rooms are Set` state |
| `/checkout` | Heading text `CHECKOUTS`; table `aria-label="checkout table"` (when rows exist) or empty-state text `No checkouts found for this date.` | Date quick-select actions in `DaySelector` (`Yesterday`, `Today`, weekday chips) trigger selected-date updates; completion button callback contract remains unchanged (`Complete`/`Completed` semantics) |
| `/till-reconciliation` | Heading text `TILL MANAGEMENT`; action dropdown labels `Shift`, `Cash`, `Keycards` | Opening each action dropdown reveals same option sets (Shift: `Open Shift`, `Reconcile`, `Close`; Keycards: `Add Keycard`, `Return Keycard`, `Count Keycards`) with unchanged enable/disable behavior |
| `/safe-management` | Heading text `SAFE MANAGEMENT`; text labels `Safe Balance`, `Keycards in Safe`; table `aria-label="safe transactions"`; action buttons (`Open`, `Deposit`, `Withdraw`, `Exchange`, `Reconcile`) | Action buttons open corresponding modal/form components (`SafeOpenForm`, `SafeDepositForm`, etc.); transaction detail toggle maintains `View Details` <-> `Hide Details` behavior |

## Native-element hotspots by wave (`HEAD`, production files only)

Counting method for each wave scope:
- Buttons: `git grep -n "<button\b" HEAD -- <wave-paths>`
- Form controls: `git grep -n "<input\b\|<select\b\|<textarea\b" HEAD -- <wave-paths>`
- Table structure: `git grep -n "<table\b\|<thead\b\|<tbody\b\|<tr\b\|<th\b\|<td\b" HEAD -- <wave-paths>`
- Exclusions: `__tests__`, `.test.`, `.spec.`, `.snap`

### Wave 1 hotspots

| File | button | form | table | total |
|---|---:|---:|---:|---:|
| `apps/reception/src/components/till/ReconciliationWorkbench.tsx` | 2 | 5 | 33 | 40 |
| `apps/reception/src/components/safe/SafeManagement.tsx` | 10 | 0 | 19 | 29 |
| `apps/reception/src/components/checkout/CheckoutTable.tsx` | 2 | 0 | 21 | 23 |
| `apps/reception/src/components/till/TillShiftHistory.tsx` | 0 | 0 | 23 | 23 |
| `apps/reception/src/components/till/TransactionTable.tsx` | 0 | 0 | 23 | 23 |
| `apps/reception/src/components/Login.tsx` | 8 | 5 | 0 | 13 |
| `apps/reception/src/components/checkins/view/BookingRow.tsx` | 0 | 1 | 12 | 13 |
| `apps/reception/src/components/checkins/TableHeader.tsx` | 0 | 0 | 10 | 10 |
| `apps/reception/src/components/checkins/view/CheckinsTable.tsx` | 1 | 1 | 8 | 10 |
| `apps/reception/src/components/checkins/notes/BookingNotesModal.tsx` | 6 | 2 | 0 | 8 |

### Wave 2 hotspots

| File | button | form | table | total |
|---|---:|---:|---:|---:|
| `apps/reception/src/components/reports/EndOfDayPacket.tsx` | 1 | 0 | 83 | 84 |
| `apps/reception/src/components/inventory/StockManagement.tsx` | 5 | 10 | 51 | 66 |
| `apps/reception/src/components/search/FinancialTransactionSearch.tsx` | 1 | 7 | 25 | 33 |
| `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx` | 2 | 5 | 21 | 28 |
| `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx` | 2 | 2 | 17 | 21 |
| `apps/reception/src/components/search/BookingSearchTable.tsx` | 1 | 2 | 17 | 20 |
| `apps/reception/src/components/inventory/IngredientStock.tsx` | 2 | 1 | 11 | 14 |
| `apps/reception/src/components/reports/VarianceHeatMap.tsx` | 1 | 2 | 9 | 12 |
| `apps/reception/src/components/search/FilterBar.tsx` | 1 | 7 | 0 | 8 |
| `apps/reception/src/components/search/_FilterBar.tsx` | 1 | 7 | 0 | 8 |

### Wave 3 hotspots

| File | button | form | table | total |
|---|---:|---:|---:|---:|
| `apps/reception/src/components/man/Extension.tsx` | 2 | 2 | 19 | 23 |
| `apps/reception/src/components/man/Stock.tsx` | 0 | 4 | 15 | 19 |
| `apps/reception/src/components/man/Alloggiati.tsx` | 2 | 1 | 13 | 16 |
| `apps/reception/src/components/loans/LoansTable.tsx` | 0 | 0 | 14 | 14 |
| `apps/reception/src/components/man/modals/ExtensionPayModal.tsx` | 2 | 4 | 0 | 6 |
| `apps/reception/src/components/prepayments/EntryDialogue.tsx` | 4 | 2 | 0 | 6 |
| `apps/reception/src/components/loans/GuestRow.tsx` | 0 | 0 | 5 | 5 |
| `apps/reception/src/components/loans/LoanModal.tsx` | 3 | 2 | 0 | 5 |
| `apps/reception/src/components/checkins/docInsert/DOBSection.tsx` | 0 | 3 | 0 | 3 |
| `apps/reception/src/components/checkins/docInsert/row1.tsx` | 0 | 3 | 0 | 3 |

### Wave 4 hotspots

| File | button | form | table | total |
|---|---:|---:|---:|---:|
| `apps/reception/src/components/bar/CompScreen.tsx` | 0 | 0 | 15 | 15 |
| `apps/reception/src/components/prepare/CleaningPriorityTable.tsx` | 0 | 0 | 13 | 13 |
| `apps/reception/src/components/bar/orderTaking/OrderList.tsx` | 2 | 0 | 9 | 11 |
| `apps/reception/src/components/roomgrid/ReservationGrid.tsx` | 0 | 0 | 8 | 8 |
| `apps/reception/src/components/bar/orderTaking/modal/PayModal.tsx` | 2 | 4 | 0 | 6 |
| `apps/reception/src/components/roomgrid/components/Header/Header.tsx` | 0 | 0 | 6 | 6 |
| `apps/reception/src/components/appNav/AppNav.tsx` | 4 | 0 | 0 | 4 |
| `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx` | 4 | 0 | 0 | 4 |
| `apps/reception/src/components/bar/HeaderControls.tsx` | 3 | 0 | 0 | 3 |
| `apps/reception/src/components/bar/orderTaking/modal/IcedCoffeeSweetnessModal.tsx` | 3 | 0 | 0 | 3 |

## Inventory conclusions for downstream build tasks
- Inventory is complete (26 routes assigned).
- Locked parity contract is now explicit and testable.
- Wave boundaries align with task architecture, with one explicit scope note:
  - TASK-11 must include `apps/reception/src/components/analytics/**/*` and `apps/reception/src/components/prepare/**/*` to fully cover `/menu-performance` and `/prepare-dashboard`.
