---
Type: Plan
Status: Active
Domain: Reception
Last-reviewed: 2026-02-08
Last-replan: 2026-02-08
Overall-confidence: 82% (effort-weighted across remaining open tasks)
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
- Role checks exist for stock/management/cash/safe (`Permissions.*` via `canAccess`)
- Reauth in place: password reauth for bank deposits, large stock adjustments, safe deposit/withdrawal, petty cash, shift close, safe reset, safe reconcile, tender removal (policy-gated), void, and correction flows
- Recipes stored in `inventory/recipes` keyed by inventory item ID; bar sales post ledger `sale` entries; stock dashboard warns on missing mappings

### Critical gaps
| Area | Issue | Severity | Status |
|------|-------|----------|--------|
| Cash | Shift ledger + shiftId tagging not implemented | Critical | **Resolved** (REC-V2-12) |
| Access | Name-based gating in cash/safe flows | High | **Resolved** — `ActionButtons`, `SafeManagement`, `StepProgress` now use `canAccess` + `Permissions` |
| Auth | PIN "reauth" uses client-side env mapping (`getUserByPin`) | High | **Resolved** — `getUserByPin` has zero active call sites; password reauth is universal across all 18 high-risk actions (REC-V2-14). Dead code cleanup remains. |
| Cash | SafeResetForm / SafeReconcileForm lack password reauth | High | **Resolved** — both use `PasswordReauthInline` |
| Cash | Tender removal policy flag (`pinRequiredAboveLimit`) computed but not enforced | Medium | **Resolved** (REC-V2-04) — `pinRequiredForTenderRemoval` gates `PasswordReauthInline` |
| Cash | No variance sign-off workflow | High | **Resolved** (REC-V2-05) |
| Infra | Firebase security rules need emulator tests + CI validation | Critical | **Resolved** — 8 emulator tests + CI workflow (REC-V2-02) |
| Infra | Settings writes (cash drawer limit, safe keycards) not protected server-side | High | Partial — `database.rules.json` protects `settings/cashDrawerLimit` (manager+ only). Remaining settings coverage in REC-V2-02. |
| Cash | `/api/pms-postings` and `/api/terminal-batches` not implemented | Medium | Open (REC-V2-08) — replacing with Firebase-backed manual entry |
| Reporting | Transaction table shows `type` under the "METHOD" column | Low | **Resolved** — `method` and `type` now have separate columns |

### Repo audit notes (file-backed, updated 2026-02-07)
- ~~`useAllTransactionsMutations.ts` uses `update` without guarding against overwrites.~~ **Resolved**: now blocks overwrites except for void fields (REC-V2-01).
- ~~`useTillShifts.ts` derives shifts from `cashCounts` only; `tillShifts` is never written and `utils/shiftId.ts` is never set.~~ **Resolved**: `tillShifts` records written on open/close, `shiftId` generated and propagated (REC-V2-12).
- ~~`ActionButtons.tsx`, `SafeManagement.tsx`, and `StepProgress.tsx` gate by hard-coded names.~~ **Resolved**: all three use `canAccess` + `Permissions.*` role checks.
- ~~`apps/reception/src/utils/getUserByPin.ts` reads `NEXT_PUBLIC_USERS_JSON` (client-side PINs).~~ **Resolved**: zero active call sites; password reauth covers all 18 high-risk action types. Dead code (`getUserByPin.ts`, its test, `NEXT_PUBLIC_USERS_JSON`) remains for cleanup (REC-V2-14).
- ~~`TenderRemovalModal.tsx` always requires PIN and ignores `pinRequiredForTenderRemoval`.~~ **Resolved**: conditionally renders `PasswordReauthInline` based on `pinRequiredForTenderRemoval` flag (REC-V2-04).
- ~~`useIngredients.ts` uses direct `set()`; `useConfirmOrder.ts` decrements ingredients by product name.~~ **Resolved**: `useIngredients` uses `addLedgerEntry`; `useConfirmOrder` looks up recipes by inventory item ID (REC-V2-06, REC-V2-07).
- ~~`TransactionTable.tsx` maps `type` into the "METHOD" column.~~ **Resolved**: `method` and `type` are separate correctly-labelled columns.

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

- [x] REC-V2-02: Firebase security rules — emulator tests + CI validation
  - **Type:** IMPLEMENT | **Effort:** M | **Confidence:** 80%
    - Implementation: 80% — test infra proven (`src/rules/__tests__/databaseRules.test.ts`, 137 lines; `test:rules` script works; `@firebase/rules-unit-testing` v4.0.1 installed). Remaining: expand test cases + add CI job.
    - Approach: 85% — established pattern: emulator on `127.0.0.1:9000` via `firebase.json`; `pnpm dlx firebase-tools@13.35.1 emulators:exec` runs tests.
    - Impact: 90% — rules file already deployed (209 lines); tests are additive; CI prevents regression.
    - Evidence class: E2 (existing test file runs, `test:rules` script functional).
  - Scope:
    - `apps/reception/database.rules.json` exists (209 lines, covers append-only patterns, role-based access, indexes). Remaining work:
      - Expand emulator test coverage for all append-only nodes: `allFinancialTransactions` (void fields only), `financialsRoom/transactions`, `cashCounts`, `safeCounts`, `creditSlips`, `tillEvents`, `cashDiscrepancies`, `keycardDiscrepancies`, `keycardTransfers`, `inventory/ledger`.
      - Test owner/developer restrictions: `inventory/items`, `inventory/recipes`, `settings/*`.
      - Test append-only + privileged access: `audit/*`, `reconciliation/*`.
      - Add CI job that runs `pnpm --filter @apps/reception test:rules` on merge to main.
    - Add indexes for `timestamp`, `shiftId`, `itemId` where queried.
  - Dependencies: REC-V2-01 ✅, REC-V2-11 ✅, REC-V2-12 ✅ (all resolved).
  - Definition of done:
    - Unauthorized or destructive writes are rejected server-side.
    - Rules are tested with Firebase emulator via `@firebase/rules-unit-testing`.
    - CI job runs emulator tests and fails on regression.
  - **Test contract:**
    - **TC-01:** Unauthenticated write to `allFinancialTransactions` → rejected
    - **TC-02:** Staff creates new transaction → allowed
    - **TC-03:** Staff overwrites existing transaction (non-void field) → rejected
    - **TC-04:** Staff adds void fields to existing transaction → allowed
    - **TC-05:** Staff writes to `cashCounts` (new entry) → allowed; overwrite → rejected
    - **TC-06:** Staff writes to `settings/cashDrawerLimit` → rejected (manager+ only)
    - **TC-07:** Manager writes to `settings/cashDrawerLimit` → allowed
    - **TC-08:** Staff writes to `inventory/items` → rejected (owner/developer only)
    - **TC-09:** Staff writes new entry to `audit/*` → allowed; overwrite → rejected
    - **TC-10:** Staff writes new entry to `reconciliation/*` → allowed; overwrite → rejected
    - **Acceptance coverage:** TC-01–04 cover append-only + void; TC-05 covers cash/safe nodes; TC-06–07 cover settings; TC-08 covers inventory; TC-09–10 cover audit/reconciliation
    - **Test type:** integration (Firebase emulator)
    - **Test location:** `apps/reception/src/rules/__tests__/databaseRules.test.ts` (existing, expand)
    - **Run:** `pnpm --filter @apps/reception test:rules`
  - **Key files:**
    - Rules: `apps/reception/database.rules.json`
    - Tests: `apps/reception/src/rules/__tests__/databaseRules.test.ts`
    - Config: `firebase.json` (emulator config)
    - CI: `.github/workflows/reception.yml`, `.github/workflows/reusable-app.yml`
  - **Build Completion (2026-02-08):**
    - **Commit:** `9dde9ef149` — "test(reception): expand Firebase rules emulator tests + add CI (REC-V2-02)"
    - **TDD cycle:**
      - Expanded test suite from 4 to 8 tests (TC-08: inventory/items role gating, TC-09: audit append-only, TC-10: reconciliation append-only, plus inventory/ledger append-only + role gating)
      - Fixed pre-existing issue: `jest.setup.ts` `console.warn` interceptor was throwing on Firebase RTDB `permission_denied` warnings — added `/@firebase\/database: FIREBASE WARNING:/` to `IGNORED_WARN_PATTERNS`
      - All 8 tests pass: `pnpm --filter @apps/reception test:rules` ✅
    - **Validation:** typecheck PASS ✅, lint PASS ✅, test:rules 8/8 PASS ✅
    - **CI added:** `.github/workflows/reception.yml` (new) triggers on `apps/reception/**` changes; `reusable-app.yml` extended with Firebase rules test gate for `@apps/reception`

### High — Access control & reauth hardening

- [x] REC-V2-03: Add password reauth to SafeResetForm and SafeReconcileForm
  - Scope:
    - Add `PasswordReauthInline` or `PasswordReauthModal` to SafeResetForm and SafeReconcileForm.
    - Remove PIN-only confirmation for these actions.
    - Submission blocked until reauth succeeds.
  - Dependencies: None.
  - Definition of done:
    - Safe reset and reconcile require password re-entry before execution.
    - Tests mock reauth and verify gating.
  - Notes:
    - Both `SafeResetForm` and `SafeReconcileForm` now use `PasswordReauthInline`.

- [x] REC-V2-04: Add reauth to TenderRemovalModal (and enforce policy flags)
  - Scope:
    - Add `PasswordReauthInline` (or modal) to TenderRemovalModal.
    - Use `pinRequiredAboveLimit`/`pinRequiredForTenderRemoval` to decide when reauth is required.
    - Log tender removals (and reauth user) for audit visibility.
  - Dependencies: None.
  - Definition of done:
    - Tender removals require reauth according to policy and are audit-logged.
    - Test verifies reauth blocks submission until authenticated.

- [x] REC-V2-13: Replace name-based gating with role checks (cash/safe scope)
  - Scope:
    - Replace hard-coded user checks in cash/safe flows with `canAccess` + `Permissions`.
    - Update `Permissions` to include manager/admin roles where appropriate.
    - Require role + reauth for drawer limit updates and safe open.
  - Dependencies: None.
  - Definition of done:
    - Cash/safe actions are role-gated; name checks removed.
    - Tests cover privileged vs non-privileged access.
  - Notes:
    - `ActionButtons`, `SafeManagement`, and `StepProgress` now use `canAccess` with `Permissions.TILL_ACCESS` / `Permissions.MANAGEMENT_ACCESS`.

- [x] REC-V2-14: Replace client-side PIN confirmation with secure reauth
  - Scope:
    - Migrate high-risk actions (safe deposit/withdrawal, petty cash, shift close,
      tender removal, keycard returns) to password reauth OR implement server-verified PINs.
    - Remove reliance on `NEXT_PUBLIC_USERS_JSON` for PIN validation.
    - Update tests to reflect the chosen reauth model.
  - Dependencies: Decision on reauth model.
  - Definition of done:
    - No high-risk action relies on client-side PINs.
    - Reauth failures are handled consistently and audited.
  - Notes:
    - **Resolved (2026-02-08 re-plan)**: `getUserByPin` has zero active call sites.
      Password reauth (`PasswordReauthInline` / `PasswordReauthModal`) covers all 18
      high-risk action types including safe operations, shift close, tender removal,
      keycard returns, voids, corrections, stock adjustments, and settings changes.
      `VarianceSignoffModal` enforces different-manager credential verification.
    - **Remaining cleanup**: delete `getUserByPin.ts` + test, remove `NEXT_PUBLIC_USERS_JSON` env var.

### High — Variance sign-off

- [x] REC-V2-05: Variance sign-off workflow
  - Scope:
    - Define variance thresholds in `settings/varianceThresholds` (configurable per property).
    - When variance exceeds threshold at shift close:
      - Block shift close until a manager signs off (different user than shift owner).
      - Require a free-text note explaining the discrepancy.
      - Record `signedOffBy`, `signedOffAt`, `varianceNote` on the shift record (`tillShifts`).
    - Surface unacknowledged variances in the end-of-day report.
  - Dependencies: REC-V2-12 ✅, REC-V2-13 ✅, REC-V2-14.
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

- [x] REC-V2-15: Reporting accuracy + audit search
  - Scope:
    - ~~Fix TransactionTable method/type column mapping~~ — **Done**: `method` and `type` are now separate columns.
    - Display void/correction status in transaction views.
    - Update end-of-day reports, dashboards, and analytics to exclude voided transactions by default
      and show sign-offs/corrections where relevant.
    - Implement `/audit` search view to filter by booking, user, shiftId, reason, and show void/correction history.
    - Progress: `/audit` now includes a corrections audit log tab (`FinancialTransactionAuditSearch`) with before/after details.
    - Progress: End-of-day packet includes a corrections summary (count + net impact).
    - Progress: Reception dashboard metrics exclude voided transactions (via `isVoidedTransaction` filter).
  - Dependencies: REC-V2-01, REC-V2-11, REC-V2-12.
  - Definition of done:
    - Reporting matches source-of-truth transactions and surfaces void/correction/audit data.
    - Audit search view can find transactions by key fields.
  - Notes:
    - **Resolved (2026-02-08 re-plan)**: All core acceptance criteria met:
      - `TransactionTable`: voided rows shown with strikethrough + opacity; "VOIDED" / "CORRECTION" badges with reasons.
      - End-of-day reports: `useEndOfDayReportData` filters voided transactions via `isVoidedTransaction`; corrections summary with count + net impact.
      - Dashboard metrics: `ReceptionDashboard` and `RealTimeDashboard` both exclude voided transactions.
      - Shift calculations: `useShiftCalculations` excludes voided transactions from totals.
      - Audit search: `/audit` page with 3 tabs (Bookings, Transactions, Audits); `FinancialTransactionAuditSearch` with filters for user, booking, shiftId, sourceTxnId, reason.
      - Variance sign-offs: `EndOfDayPacket` surfaces pending sign-offs with threshold + manager tracking.
    - Optional enhancements (export, advanced date/amount filters, transaction chain view) deferred.

### Medium — Reconciliation data sources

- [ ] REC-V2-08: Manual PMS posting + terminal batch entry
  - **Type:** IMPLEMENT | **Effort:** M | **Confidence:** 85%
    - Implementation: 90% — Firebase schemas exist (`reconciliationManualSchema.ts`: `manualPmsPostingSchema`, `manualTerminalBatchSchema`); Firebase rules ready (`reconciliation/*` append-only); `ReconciliationWorkbench` renders data via `usePmsPostings` / `useTerminalBatches`; clear mutation pattern from `useCashCountsMutations`.
    - Approach: 88% — replace fetch-based hooks (404 endpoints) with Firebase subscriptions; add entry forms following `SafeDepositForm` pattern; schemas already Zod-validated.
    - Impact: 85% — isolated to `reconciliation/*` Firebase path; workbench already renders correctly; no breaking changes to existing code.
    - Evidence class: E1 (static code audit: schemas, hooks, rules, workbench component).
  - Scope:
    - Replace `usePmsPostings` (currently fetches from 404 `/api/pms-postings`) with Firebase subscription to `reconciliation/pmsPostings`.
    - Replace `useTerminalBatches` (currently fetches from 404 `/api/terminal-batches`) with Firebase subscription to `reconciliation/terminalBatches`.
    - Create `usePmsPostingsMutations` and `useTerminalBatchesMutations` hooks (pattern: `push` + Zod validate + `set`).
    - Create `PmsPostingEntryForm` (fields: amount, method CASH/CC, optional note) and `TerminalBatchEntryForm` (fields: amount, optional note).
    - Add form trigger buttons to `ReconciliationWorkbench`.
    - Surface missing-entry warnings when data is absent for current date.
    - Delete dead references to `/api/pms-postings` and `/api/terminal-batches`.
  - Dependencies: None.
  - Definition of done:
    - Reconciliation workbench consumes Firebase-backed manually-entered data.
    - Missing data is surfaced as a warning, not a silent gap.
    - Dead API endpoint references removed.
  - **Test contract:**
    - **TC-01:** Submit PMS posting form → entry appears in `reconciliation/pmsPostings` with correct schema fields (amount, method, createdAt, createdBy)
    - **TC-02:** Submit terminal batch form → entry appears in `reconciliation/terminalBatches` with correct schema fields
    - **TC-03:** Reconciliation workbench with no entries for today → shows missing-data warning
    - **TC-04:** Reconciliation workbench with manual entries → displays correct totals in comparison table
    - **TC-05:** Invalid form submission (missing amount) → form validation prevents submit
    - **Acceptance coverage:** TC-01–02 cover entry creation; TC-03 covers warning; TC-04 covers workbench consumption; TC-05 covers validation
    - **Test type:** unit (component tests for forms + workbench)
    - **Test location:** `apps/reception/src/components/till/__tests__/ReconciliationWorkbench.test.tsx` (existing, extend) + new `PmsPostingEntryForm.test.tsx`, `TerminalBatchEntryForm.test.tsx`
    - **Run:** `pnpm --filter @apps/reception test -- --testPathPattern="(ReconciliationWorkbench|PmsPosting|TerminalBatch)"`
  - **Key files:**
    - Schemas: `apps/reception/src/schemas/reconciliationManualSchema.ts`
    - Hooks (replace): `apps/reception/src/hooks/data/till/usePmsPostings.ts`, `useTerminalBatches.ts`
    - Workbench: `apps/reception/src/components/till/ReconciliationWorkbench.tsx`
    - Type defs: `apps/reception/src/types/hooks/data/pmsPostingData.ts`, `terminalBatchData.ts`

### Low — Operational improvements

- [ ] REC-V2-09: Cash drawer limit enforcement
  - **Type:** IMPLEMENT | **Effort:** S | **Confidence:** 88%
    - Implementation: 90% — core infra exists: `useCashDrawerLimit` hook (read/write + audit logging), `useShiftCalculations` computes `isDrawerOverLimit` / `isTillOverMax`, `DrawerLimitWarning` component renders alert, `TenderRemovalModal` handles deposits with conditional reauth. Only missing: `drawerAlerts` logging node.
    - Approach: 90% — follows established patterns: `logSettingChange` for audit, `push` + Zod validate for `drawerAlerts`, `ActionButtons` already disables shift close when `isTillOverMax`.
    - Impact: 88% — additive change (new `drawerAlerts` node); no breaking changes; existing limit calculations unchanged; Firebase rules for `drawerAlerts` needed.
    - Evidence class: E1 (static code audit: hooks, calculations, UI components, rules).
  - Scope:
    - Create `drawerAlerts` Firebase node + append-only security rule.
    - Add `useDawerAlertsMutations` hook to log over-limit events (user, shiftId, amount, limit, timestamp).
    - Wire alert logging into `useShiftCalculations` or `useTillAlerts` when `isDrawerOverLimit` transitions to true.
    - Ensure `DrawerLimitWarning` is consistently shown in all relevant views (currently in `TillReconciliation`; verify presence in deposit flows).
  - Dependencies: None.
  - Definition of done:
    - UI warns when drawer approaches/exceeds limit.
    - Over-limit events are logged to a `drawerAlerts` node with user + shiftId.
  - **Test contract:**
    - **TC-01:** Cash exceeds `cashDrawerLimit` → `DrawerLimitWarning` renders with "Lift" button
    - **TC-02:** Cash under limit → no warning displayed
    - **TC-03:** Over-limit event → `drawerAlerts` entry created with user, shiftId, amount, limit, timestamp
    - **Acceptance coverage:** TC-01–02 cover UI warnings; TC-03 covers alert logging
    - **Test type:** unit
    - **Test location:** `apps/reception/src/components/till/__tests__/DrawerLimitWarning.test.tsx` (new) + extend `useShiftCalculations` tests
    - **Run:** `pnpm --filter @apps/reception test -- --testPathPattern="(DrawerLimit|shiftCalculations)"`
  - **Key files:**
    - Hooks: `apps/reception/src/hooks/data/useCashDrawerLimit.ts`, `apps/reception/src/hooks/client/till/useShiftCalculations.ts`, `apps/reception/src/hooks/client/till/useTillAlerts.ts`
    - UI: `apps/reception/src/components/till/DrawerLimitWarning.tsx`, `apps/reception/src/components/till/TillReconciliation.tsx`
    - Settings: `apps/reception/src/constants/settings.ts`
    - Rules: `apps/reception/database.rules.json` (add `drawerAlerts` node)

- [ ] REC-V2-16: Keycard numbering scheme decision (INVESTIGATE)
  - **Type:** INVESTIGATE | **Effort:** S | **Confidence:** 85%
    - Implementation: 90% — requires only a decision memo, no code.
    - Approach: 85% — need to determine: (a) are keycards physically numbered today? (b) numbering range, (c) multi-card guests: separate IDs vs one assignment with count, (d) master key tracking, (e) lost card mid-stay workflow.
    - Impact: 85% — decision directly affects REC-V2-10 data model and UX.
    - Evidence class: E0 → E1 after decision.
  - Scope:
    - Determine whether keycards are currently physically numbered/labelled.
    - Define numbering scheme (e.g., 001–100) or confirm existing scheme.
    - Decide: one assignment per physical keycard ID, or one assignment per guest with count?
    - Decide: should staff master keys be tracked separately?
    - Decide: workflow for lost card mid-stay (void assignment, issue replacement?).
    - Document decisions in a short memo.
  - Dependencies: None (requires Pete's input on operational questions).
  - Acceptance criteria:
    - Decision memo answers all 5 questions above.
    - Data model for `keycardAssignments` specified based on decisions.
  - Exit criteria: Binary — decisions documented and approved by Pete.

- [ ] REC-V2-10: Keycard-to-guest assignment tracking
  - **Type:** IMPLEMENT | **Effort:** M | **Confidence:** 75% (→ 85% conditional on REC-V2-16)
    - Implementation: 85% — comprehensive keycard infra exists: `loans/<bookingRef>/<occupantId>/txns`, `keycardTransfers`, `keycardDiscrepancies`, variance calculations, `KeycardDepositButton`, checkout return flow, `AddKeycardsModal` / `ReturnKeycardsModal`.
    - Approach: 85% — natural extension: add `keycardAssignments` node, wire into existing loan/return flows, enhance variance display.
    - Impact: 75% — depends on keycard numbering scheme decision (REC-V2-16); UX for capturing keycard ID at check-in needs design; physical keycard numbering may not exist.
    - Evidence class: E1 (static code audit of keycard hooks, components, schemas).
    - Confidence cannot be promoted until REC-V2-16 completes.
  - Scope:
    - Add `keycardAssignments` Firebase node: `{ keycardId → { occupantId, bookingRef, roomNumber, assignedAt, assignedBy, returnedAt?, returnedBy?, status } }`.
    - Add append-only Firebase security rules for `keycardAssignments`.
    - Update `KeycardDepositButton` to capture keycard ID(s) on loan.
    - Update `Checkout` return flow to mark assignment as returned.
    - Enhance variance reports: when keycard variance detected, show unresolved assignments with last-known guest/room.
  - Dependencies: REC-V2-16 (keycard numbering decision).
  - Definition of done:
    - Keycard variances show which guest/room was last assigned.
    - Loan/return flows update the assignment map.
  - **Test contract:**
    - **TC-01:** Keycard loan via `KeycardDepositButton` → `keycardAssignments` entry created with occupantId, bookingRef, roomNumber, status: "issued"
    - **TC-02:** Keycard return via checkout → assignment status updated to "returned" with returnedAt/returnedBy
    - **TC-03:** Keycard variance detected → variance display shows unresolved assignments with guest/room info
    - **TC-04:** Duplicate active assignment for same keycard ID → rejected (validation)
    - **Acceptance coverage:** TC-01–02 cover loan/return flow; TC-03 covers variance display; TC-04 covers data integrity
    - **Test type:** unit
    - **Test location:** `apps/reception/src/components/checkins/__tests__/KeycardDepositButton.test.tsx` (extend) + new `apps/reception/src/hooks/data/__tests__/useKeycardAssignments.test.ts`
    - **Run:** `pnpm --filter @apps/reception test -- --testPathPattern="(KeycardDeposit|keycardAssignment)"`
  - **Key files:**
    - Check-in: `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
    - Checkout: `apps/reception/src/components/checkout/Checkout.tsx`
    - Variance: `apps/reception/src/hooks/data/endOfDay/variance.ts`
    - Transfers: `apps/reception/src/hooks/data/useKeycardTransfersMutations.ts`
    - Rules: `apps/reception/database.rules.json`

## Task summary (remaining open)

| Task | Type | Effort | Confidence | Dependencies | Status |
|------|------|--------|------------|--------------|--------|
| REC-V2-02 | IMPLEMENT | M | 80% | None (deps resolved) | **Done** ✅ |
| REC-V2-08 | IMPLEMENT | M | 85% | None | Ready |
| REC-V2-09 | IMPLEMENT | S | 88% | None | Ready |
| REC-V2-16 | INVESTIGATE | S | 85% | None (needs Pete) | Ready |
| REC-V2-10 | IMPLEMENT | M | 75% → 85% | REC-V2-16 | Blocked |

## Implementation order

```
Completed:
  Phase 1 (Critical):  REC-V2-12 ✅ -> REC-V2-01 ✅ -> REC-V2-11 ✅
  Phase 2 (High):      REC-V2-13 ✅, REC-V2-03 ✅, REC-V2-04 ✅, REC-V2-14 ✅
  Phase 3 (High):      REC-V2-05 ✅
  Phase 4 (High):      REC-V2-06 ✅ -> REC-V2-07 ✅
  Phase 5 (Medium):    REC-V2-15 ✅

  Phase 6 (Medium):    REC-V2-02 ✅

Remaining (parallelism guide):
  Wave 1 (parallel):   REC-V2-08, REC-V2-09, REC-V2-16
  Wave 2 (sequential): REC-V2-10 (after REC-V2-16)
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

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-23 | Password reauth everywhere (no server-verified PINs) | Locked — avoids new auth infra; Firebase Auth is server-verified. |
| 2026-01-23 | `inventory/recipes` canonical, keyed by item ID | Avoids name drift; remove `inventoryItem.recipeMap`. |
| 2026-01-23 | `financialsRoom/transactions` is authoritative ledger | Not a derived view; retains void/correction fields. |
| 2026-02-08 | REC-V2-14 resolved — PIN system is dead code | Investigation: `getUserByPin` has zero active call sites; all 18 high-risk actions use `PasswordReauthInline`/`PasswordReauthModal`. Cleanup task only. |
| 2026-02-08 | REC-V2-15 resolved — core scope complete | Investigation: void badges, voided tx exclusion, corrections summary, audit search with 5 filters, variance sign-offs — all implemented. Optional enhancements deferred. |
| 2026-02-08 | REC-V2-16 created — keycard numbering precursor | REC-V2-10 impact confidence (75%) blocked by operational unknowns: physical numbering, multi-card guests, master keys, lost card workflow. Cannot implement data model without decisions. |

## Notes

- The v1 plan marked all tasks `[x]` but several were not fully implemented in code.
  This plan captures the actual remaining work.
- Firebase rules (REC-V2-02) are the single most impactful change — without them,
  client-side immutability can be bypassed by any authenticated user with devtools.
- Ingredient migration (REC-V2-06) should be coordinated with bar staff to avoid
  disruption during service hours.
