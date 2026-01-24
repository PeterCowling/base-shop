---
Type: Plan
Status: Active
Domain: Reception
Last-reviewed: 2026-01-23
Relates-to charter: none
Predecessor: docs/historical/plans/reception-stock-cash-control-plan.md
---

# Reception - Stock + Cash Control Plan v2

Goal: close the remaining accountability gaps identified in the v1 audit. The
foundational ledger infrastructure is in place; this plan addresses immutability
enforcement, reauth coverage, server-side rules, and ingredient audit trail.

## Audit summary (2026-01-23)

### What works
- Inventory ledger (append-only, Zod-validated, typed hooks)
- Stock management UI (receive, count, adjust, waste, transfer, alerts)
- Ingredient stock now uses inventory items + ledger (legacy migration supported)
- Cash/till shift management with denomination breakdowns
- Safe management (deposit, withdrawal, exchange, bank, reconcile, reset)
- Variance calculations (cash, keycard, safe) with mismatch detection
- End-of-day report aggregation and CSV export
- Role checks exist for stock/management (`Permissions.*`), but cash/safe still uses name-based gating
- Reauth in place: password reauth for bank deposits and large stock adjustments; PIN confirmation for safe deposit/withdrawal, petty cash, and shift close
- Recipes stored in `inventory/recipes` keyed by inventory item ID; bar sales post ledger `sale` entries; stock dashboard warns on missing mappings

### Critical gaps
| Area | Issue | Severity |
|------|-------|----------|
| Cash | Shift ledger + shiftId tagging not implemented (`tillShifts` unused; `shiftId` never set) | Critical |
| Access | Name-based gating in cash/safe flows (`ActionButtons`, `SafeManagement`, `StepProgress`) | High |
| Auth | PIN "reauth" uses client-side env mapping (`getUserByPin`) | High |
| Cash | SafeResetForm / SafeReconcileForm lack password reauth | High |
| Cash | Tender removal policy flag (`pinRequiredAboveLimit`) computed but not enforced | Medium |
| Cash | No variance sign-off workflow | High |
| Infra | No Firebase security rules for reception | Critical |
| Infra | Settings writes (cash drawer limit, safe keycards) not protected server-side | High |
| Cash | `/api/pms-postings` and `/api/terminal-batches` not implemented | Medium |
| Reporting | Transaction table shows `type` under the "METHOD" column | Low |

### Repo audit notes (file-backed)
- `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts` uses `update` without guarding against overwrites.
- `apps/reception/src/hooks/client/till/useTillShifts.ts` derives shifts from `cashCounts` only; `tillShifts` is never written and `utils/shiftId.ts` is never set.
- `apps/reception/src/components/till/ActionButtons.tsx`, `apps/reception/src/components/safe/SafeManagement.tsx`, and `apps/reception/src/components/till/StepProgress.tsx` gate by hard-coded names.
- `apps/reception/src/utils/getUserByPin.ts` reads `NEXT_PUBLIC_USERS_JSON` (client-side PINs).
- `apps/reception/src/components/till/TenderRemovalModal.tsx` always requires PIN and ignores `pinRequiredForTenderRemoval`.
- `apps/reception/src/hooks/data/inventory/useIngredients.ts` uses direct `set()`; `useConfirmOrder.ts` decrements ingredients by product name while `inventory/recipes` exists but is unused.
- `apps/reception/src/components/till/TransactionTable.tsx` maps `type` into the "METHOD" column.

### Decisions (locked 2026-01-23)
- Reauth model: password reauth everywhere for high-risk actions (no server-verified PIN infra).
- Recipe source of truth: `inventory/recipes` is canonical, keyed by inventory item ID (not product name) to avoid name drift; remove `inventoryItem.recipeMap`.
- FinancialsRoom handling: keep `financialsRoom/transactions` as an authoritative ledger with void/correction fields (not a derived view).

## Active tasks

### Critical — Immutability, ledger integrity, and server-side enforcement

- [x] REC-V2-01: Replace hard-delete with void pattern
  - Scope:
    - Add `voidedAt`, `voidedBy`, `voidedByUid`, `voidReason`, `voidedShiftId` to
      `FinancialTransaction` and (if retained) `RoomTransaction`.
    - Replace `useDeleteTransaction` with `useVoidTransaction` that sets void fields
      without removing records.
    - Update `DeleteTransactionModal` -> `VoidTransactionModal` with required reason and reauth.
    - Ensure `useAllTransactionsMutations` refuses overwrites (except void fields).
    - Filter voided transactions from active views; show struck-through in history and expose in audit views.
  - Dependencies: None (REC-V2-12 recommended for shiftId support).
  - Definition of done:
    - No transaction is removed from `allFinancialTransactions` or `financialsRoom/transactions`.
    - Voids are attributable (user + timestamp + reason + shiftId) and visible in audit views.
    - Tests cover void flow and verify original record persists.
  - Notes:
    - `useAllTransactionsMutations` now blocks overwrites except for void fields.

- [x] REC-V2-11: Replace edit-in-place with correction + audit trail
  - Scope:
    - Retire `useEditTransaction` and `EditTransactionModal` (or refactor to create corrections).
    - Introduce a correction flow that writes a new transaction with `type: correction`
      (or `adjustment`) and `sourceTxnId`.
    - Write an append-only audit record (e.g., `audit/financialTransactionAudits`)
      capturing before/after snapshots, reason, user, and shiftId.
    - Update reports/analytics to reflect corrections and prevent silent totals drift.
  - Dependencies: REC-V2-01.
  - Definition of done:
    - No in-place edits of financial transactions.
    - Corrections are append-only and traceable to a source transaction.
    - Audit log exists for corrections with reason + user attribution.
  - Notes:
    - `EditTransactionModal` now records a correction with password reauth.
    - `useCorrectTransaction` writes reversal + replacement and an audit log entry.

- [x] REC-V2-12: Shift ledger + shiftId propagation
  - Scope:
    - Generate a `shiftId` on open; persist via `setStoredShiftId` and clear on close.
    - Write `tillShifts` records on open/close/reconcile with open/close metadata and variance fields.
    - Add `shiftId` to `cashCounts`, `safeCounts`, `tillEvents`, `allFinancialTransactions`,
      `inventory/ledger`, and `keycardTransfers` (schema + mutations + data hooks).
    - Update end-of-day reporting and shift history to display `shiftId`.
  - Dependencies: None.
  - Definition of done:
    - `TillShiftHistory` shows recent shifts populated from `tillShifts`.
    - New ledger entries include a `shiftId` and remain backwards-compatible with legacy data.
    - Tests cover shiftId tagging and shift history updates.

- [ ] REC-V2-02: Firebase security rules for reception
  - Scope:
    - Create `apps/reception/database.rules.json` with rules for:
      - `allFinancialTransactions`, `financialsRoom/transactions`: append-only; allow void fields only.
      - `cashCounts`, `safeCounts`, `creditSlips`, `tillEvents`, `cashDiscrepancies`,
        `keycardDiscrepancies`, `keycardTransfers`: append-only.
      - `inventory/ledger`: append-only; `inventory/items` + `inventory/recipes`: owner/developer only.
      - `settings/*`: owner/developer (or manager) only.
      - `audit/*` and `reconciliation/*`: append-only with privileged access.
    - Add indexes for `timestamp`, `shiftId`, `itemId` where queried.
    - Add emulator tests + CI check that validates rules on merge to main.
  - Dependencies: REC-V2-01, REC-V2-11, REC-V2-12.
  - Definition of done:
    - Unauthorized or destructive writes are rejected server-side.
    - Rules are tested with Firebase emulator or `@firebase/rules-unit-testing`.

### High — Access control & reauth hardening

- [ ] REC-V2-03: Add password reauth to SafeResetForm and SafeReconcileForm
  - Scope:
    - Add `PasswordReauthInline` or `PasswordReauthModal` to SafeResetForm and SafeReconcileForm.
    - Remove PIN-only confirmation for these actions.
    - Submission blocked until reauth succeeds.
  - Dependencies: None.
  - Definition of done:
    - Safe reset and reconcile require password re-entry before execution.
    - Tests mock reauth and verify gating.

- [x] REC-V2-04: Add reauth to TenderRemovalModal (and enforce policy flags)
  - Scope:
    - Add `PasswordReauthInline` (or modal) to TenderRemovalModal.
    - Use `pinRequiredAboveLimit`/`pinRequiredForTenderRemoval` to decide when reauth is required.
    - Log tender removals (and reauth user) for audit visibility.
  - Dependencies: None.
  - Definition of done:
    - Tender removals require reauth according to policy and are audit-logged.
    - Test verifies reauth blocks submission until authenticated.

- [ ] REC-V2-13: Replace name-based gating with role checks (cash/safe scope)
  - Scope:
    - Replace hard-coded user checks in cash/safe flows with `canAccess` + `Permissions`.
    - Update `Permissions` to include manager/admin roles where appropriate.
    - Require role + reauth for drawer limit updates and safe open.
  - Dependencies: None.
  - Definition of done:
    - Cash/safe actions are role-gated; name checks removed.
    - Tests cover privileged vs non-privileged access.

- [ ] REC-V2-14: Replace client-side PIN confirmation with secure reauth
  - Scope:
    - Migrate high-risk actions (safe deposit/withdrawal, petty cash, shift close,
      tender removal, keycard returns) to password reauth OR implement server-verified PINs.
    - Remove reliance on `NEXT_PUBLIC_USERS_JSON` for PIN validation.
    - Update tests to reflect the chosen reauth model.
  - Dependencies: Decision on reauth model.
  - Definition of done:
    - No high-risk action relies on client-side PINs.
    - Reauth failures are handled consistently and audited.

### High — Variance sign-off

- [x] REC-V2-05: Variance sign-off workflow
  - Scope:
    - Define variance thresholds in `settings/varianceThresholds` (configurable per property).
    - When variance exceeds threshold at shift close:
      - Block shift close until a manager signs off (different user than shift owner).
      - Require a free-text note explaining the discrepancy.
      - Record `signedOffBy`, `signedOffAt`, `varianceNote` on the shift record (`tillShifts`).
    - Surface unacknowledged variances in the end-of-day report.
  - Dependencies: REC-V2-12, REC-V2-13, REC-V2-14.
  - Definition of done:
    - Shift close is blocked if variance > threshold and no sign-off exists.
    - Sign-off metadata is persisted and visible in reports.
    - Test covers sign-off flow and threshold boundary.

### High — Ingredient audit trail

- [x] REC-V2-06: Migrate ingredient stock to ledger pattern
  - Scope:
    - Choose a single source of truth: treat ingredients as `inventory/items` with
      category `ingredient` and track all movement in `inventory/ledger`.
    - Migrate `inventory/ingredients` into inventory items and create opening ledger entries.
    - Derive current ingredient quantities from ledger (opening + sum of entries).
    - Update `IngredientStock` to use inventory item + ledger hooks (no direct `set()`).
    - Remove `inventory/ingredients` read/write path.
  - Dependencies: None.
  - Definition of done:
    - All ingredient quantity changes create immutable ledger entries.
    - Current stock is derived, not stored.
    - Existing tests pass with updated async patterns.
  - Notes:
    - IngredientStock now offers a one-time legacy migration button to move `inventory/ingredients`
      into inventory items + ledger entries, then remove the legacy node.

- [x] REC-V2-07: Wire recipe map for bar sale consumption
  - Scope:
    - Pick recipe source of truth (`inventory/recipes` or `inventoryItem.recipeMap`)
      and remove the unused path.
    - Store recipes by inventory item ID (not product name) to avoid name drift.
    - When a bar sale is recorded, automatically create ledger `sale` entries
      for each mapped ingredient.
    - Surface unmapped items as warnings in the stock dashboard.
  - Dependencies: REC-V2-06 and recipe source decision.
  - Definition of done:
    - Bar sales decrement mapped ingredients via ledger entries.
    - Unmapped items are flagged for setup.
    - Test verifies sale → ledger entry creation.
  - Notes:
    - Stock management now includes a recipe coverage warning list and a one-time
      migration helper for legacy name-keyed recipes.

### Medium — Reporting & audit UX

- [ ] REC-V2-15: Reporting accuracy + audit search
  - Scope:
    - Fix TransactionTable method/type column mapping and display void/correction status.
    - Update end-of-day reports, dashboards, and analytics to exclude voided transactions by default
      and show sign-offs/corrections where relevant.
    - Implement `/audit` search view to filter by booking, user, shiftId, reason, and show void/correction history.
    - Progress: `/audit` now includes a corrections audit log tab with before/after details.
    - Progress: End-of-day packet includes a corrections summary (count + net impact).
    - Progress: Reception dashboard metrics exclude voided transactions.
  - Dependencies: REC-V2-01, REC-V2-11, REC-V2-12.
  - Definition of done:
    - Reporting matches source-of-truth transactions and surfaces void/correction/audit data.
    - Audit search view can find transactions by key fields.

### Medium — Reconciliation data sources

- [ ] REC-V2-08: Manual PMS posting + terminal batch entry
  - Scope:
    - Instead of unimplemented API endpoints, add a Firebase-backed manual entry
      flow for PMS postings and terminal batches.
    - Provide forms in the reconciliation workbench for:
      - PMS posting totals (credit card, bank transfer, by date).
      - Terminal batch summary (settled amount, date, terminal ID).
    - Store at `reconciliation/pmsPostings` and `reconciliation/terminalBatches`.
    - Surface missing-entry warnings when data is absent for current date.
  - Dependencies: None.
  - Definition of done:
    - Reconciliation workbench consumes real or manually-entered data.
    - Missing data is surfaced as a warning, not a silent gap.
    - Delete the dead `/api/pms-postings` and `/api/terminal-batches` references.

### Low — Operational improvements

- [ ] REC-V2-09: Cash drawer limit enforcement
  - Scope:
    - Enforce drawer limit warnings consistently (use `cashDrawerLimit`, `tillMaxLimit`,
      and `pinRequiredAboveLimit` policies).
    - Add a warning (not a hard block) when a deposit would cause the drawer
      to exceed the configured limit.
    - Log drawer-over-limit events to `drawerAlerts` with user + shiftId.
  - Dependencies: None.
  - Definition of done:
    - UI warns when drawer approaches/exceeds limit.
    - Over-limit events are logged to a `drawerAlerts` node.

- [ ] REC-V2-10: Keycard-to-guest assignment tracking
  - Scope:
    - Add a `keycardAssignments` node linking keycard ID → room → guest.
    - Update keycard loan/return flows to record assignments.
    - Surface unresolved keycard variances with last-known assignment.
  - Dependencies: None.
  - Definition of done:
    - Keycard variances show which guest/room was last assigned.
    - Loan/return flows update the assignment map.

## Implementation order

```
Phase 1 (Critical):  REC-V2-12 -> REC-V2-01 -> REC-V2-11 -> REC-V2-02
Phase 2 (High):      REC-V2-13, REC-V2-03, REC-V2-04, REC-V2-14 (parallel)
Phase 3 (High):      REC-V2-05
Phase 4 (High):      REC-V2-06 -> REC-V2-07
Phase 5 (Medium):    REC-V2-15, REC-V2-08 (parallel)
Phase 6 (Low):       REC-V2-09, REC-V2-10 (parallel)
```

## Constraints

- Desktop-only UX (unchanged from v1).
- Firebase Realtime Database; no new paid services.
- Use existing Firebase auth + userProfiles roles (owner/developer/manager/admin/staff).
- Avoid new auth infrastructure unless the PIN decision explicitly requires it.
- Keep offline mode read-only for finance nodes to avoid sync conflicts.

## Data migration & backfill

- Ingredients: snapshot `inventory/ingredients` into inventory items + opening ledger entries.
  Freeze ingredient writes during the migration window.
- Recipes: provide a one-time migration from legacy name-keyed recipes to inventory
  item ID keys (no automatic backfill for unmatched names).
- ShiftId: do not backfill historical records; treat missing shiftId as "legacy" in reporting.
- Voids/corrections: no backfill needed; treat missing void fields as "not voided".

## Testing & validation

- Unit tests for void/correction flows, role gating, reauth gating, and shiftId tagging.
- Firebase rules emulator tests for append-only nodes + settings/audit access controls.
- Regression coverage for end-of-day reports, reconciliation workbench, and inventory ledger.

## Rollout & ops readiness

- Stage rules in emulator/staging; deploy rules after code changes are live.
- Update SOPs for void/correction handling and variance sign-off; train staff.
- Monitor denied writes and `drawerAlerts` after rules rollout.

## Notes

- The v1 plan marked all tasks `[x]` but several were not fully implemented in code.
  This plan captures the actual remaining work.
- Firebase rules (REC-V2-02) are the single most impactful change — without them,
  client-side immutability can be bypassed by any authenticated user with devtools.
- Ingredient migration (REC-V2-06) should be coordinated with bar staff to avoid
  disruption during service hours.
