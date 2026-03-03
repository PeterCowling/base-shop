---
Status: Complete
Feature-Slug: brik-stock-count-variance-reason-codes
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — BRIK Stock Count Variance Reason Codes

## What Was Built

**TASK-01 — Shared constants file.**
Created `apps/reception/src/constants/inventoryReasons.ts` exporting the `VarianceReasonCode` union type (`"Scarto" | "Consumo staff" | "Rottura" | "Furto" | "Altro"`) and the `VARIANCE_REASON_CODES` readonly array. A shared constants file was required because both `BatchStockCount` and `StockManagement` import the same type and values; cross-component sibling imports are not acceptable in this codebase.

**TASK-02 + TASK-03 — Reason-code prompt and submit wiring in `BatchStockCount`.**
Added a two-step collection gate to the batch count confirmation flow. When `handleCompleteCategory` detects any negative quantity delta, it stores a `PendingReasonCapture` state (separate from the existing reauth `PendingBatchSubmission` state) and renders a `VarianceReasonPrompt` sub-component. This is a native `<select>` dropdown listing the five Italian reason codes, plus an optional free-text note input shown only when "Altro" is selected. Confirming the prompt calls `submitCategoryWithReauthGate`, which passes the reason and note through to `executeCategorySubmit`. The reauth path (large-variance PasswordReauthModal flow) was extended so that `PendingBatchSubmission` carries `reason?/note?`, preserving the selected reason across a reauth confirmation. Positive-delta items continue to use the existing `"conteggio batch"` constant and are unaffected by the new flow.

**TASK-04 — Reason-coded breakdown in `StockManagement`.**
Extended `LedgerEntryForVariance` with `reason?: string` (backward-compatible). Added `buildReasonBreakdown(entries, windowDays, validReasons)` — a pure reduce function that groups negative-delta count entries by reason, bucketing unrecognised or absent reasons under `"Non specificato"`. Capped to at most 6 keys (5 valid codes + fallback) to prevent high-cardinality growth. Extended `VarianceBreakdownSectionProps` and the corresponding useMemo; the sub-table renders under `data-cy="reason-breakdown-table"` with Italian heading "Varianza conteggio batch per motivo" and column labels "Motivo" / "Varianza totale". The sub-table is suppressed when the breakdown is empty.

**TASK-05 — `BatchStockCount` test suite update.**
Added `submitCategoryWithReason(user, reason, note?)` helper to avoid duplicating reason-prompt interaction across tests. Updated `"submits negative count delta without reauth"` to interact with the reason prompt before asserting on `addLedgerEntry` call args. Added TC-R01 through TC-R07 covering: prompt appearance on negative delta, no prompt on non-negative deltas, reason propagation to `addLedgerEntry`, "Altro" note, note-field visibility toggle, cancel dismiss, and reauth-path reason preservation. 31 tests pass.

**TASK-06 — `StockManagement` test suite update.**
Extended `makeEntry` helper to accept optional `reason` param. Added TC-R08 in the top-level `describe` block (Count Variance Report renders reason column). Added TC-VR01..TC-VR05 in `describe("Variance Breakdown")` covering: structured reason shown in sub-table, fallback "Non specificato" for entries without reason, legacy "conteggio batch" grouped under "Non specificato", positive entries excluded, out-of-window entries excluded. 23 tests pass. Bug caught during integration: Codex initially used English "Unspecified" as the fallback label — corrected to "Non specificato" and component heading/column labels italianised before tests were validated.

## Tests Run

| Command | Result |
|---|---|
| `BASESHOP_TEST_ADMISSION_BYPASS=1 pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern="BatchStockCount.test" --no-coverage` | 31 passed, 0 failed |
| `BASESHOP_TEST_ADMISSION_BYPASS=1 pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern="StockManagement.test" --no-coverage` | 23 passed, 0 failed |

Typecheck: `pnpm --filter @apps/reception typecheck` passed at each task boundary (TASK-01, TASK-02, TASK-04 individually verified by Codex offload; TASK-03/05/06 verified by CI pre-commit hook).

## Validation Evidence

- **TASK-01 TC-01/TC-02:** TypeScript compile gate — export shape and union type constraints verified; `tsc --noEmit` exit 0.
- **TASK-02 acceptance:** `data-cy="variance-reason-select"` and `data-cy="variance-reason-note"` elements present in rendered output (exercised by TC-R01, TC-R03, TC-R04, TC-R05 in TASK-05 test suite).
- **TASK-03 acceptance:** `addLedgerEntry` called with `reason: "Scarto"` for negative-delta items (TC-R03); called with `reason: "Altro", note: "caduto"` (TC-R04); positive-delta items call with `reason: "conteggio batch"` (TC-R02). Reauth path carries reason through to submission (TC-R07).
- **TASK-04 acceptance:** reason breakdown sub-table rendered for recognised reasons (TC-VR01), fallback for absent reasons (TC-VR02), legacy "conteggio batch" grouped under fallback (TC-VR03), positive entries excluded (TC-VR04), out-of-window entries excluded (TC-VR05).
- **TASK-05 acceptance:** All 7 TC-R tests pass; existing 25 pre-TASK-05 tests continue to pass (31 total).
- **TASK-06 acceptance:** All 6 new TC-VR/TC-R tests pass; existing TC-01..TC-07 continue to pass (23 total).

## Scope Deviations

- **Italian label correction (TASK-06 integration):** Codex initially wrote `"Unspecified"` as the `buildReasonBreakdown` fallback in `StockManagement.tsx`. Corrected to `"Non specificato"` per plan spec. Heading and column labels also italianised at the same time: "Varianza conteggio batch per motivo", "Motivo", "Varianza totale". This is within TASK-04 scope (same file) and was caught during TASK-06 test integration before any commit was made under the task-scoped writer-lock attempt.

## Outcome Contract

- **Why:** Operators cannot distinguish spoilage, staff comp, breakage, or theft from each other in the variance ledger. This blocks meaningful stock-loss investigation and undermines audit confidence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Count variance entries always carry a reason code for negative deltas, enabling operators to categorise each variance event and produce a reason-coded breakdown in the variance report.
- **Source:** operator
