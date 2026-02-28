---
Status: Complete
Feature-Slug: brik-eod-float-set
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record: BRIK EOD Float-Set

## What Was Built

**TASK-01 — Schema extension (Wave 1)**
Added `"openingFloat"` to the `cashCountSchema.type` enum in `apps/reception/src/schemas/cashCountSchema.ts`. The `CashCountType` union is inferred directly from the schema, so the new type propagated automatically to all consumers without a manual type-alias update. The schema test file was updated to include `"openingFloat"` in the `validTypes` array.

**TASK-02 — Mutation wrapper and environment setting (Wave 2)**
Added `addOpeningFloatEntry(amount: number)` to `useCashCountsMutations.ts` following the exact pattern of `addFloatEntry` — delegates to `addCashCount("openingFloat", 0, 0, amount)` (no safe withdrawal, memo-only). Added `standardFloat` to `apps/reception/src/constants/settings.ts` reading `NEXT_PUBLIC_STANDARD_FLOAT` with a double-guard fallback to `0`. Documented the env var in `apps/reception/.env.example`.

**TASK-03 — Float status section in EOD checklist (Wave 2, parallel with TASK-02)**
Extended `EodChecklistContent.tsx` with a fourth "Float" section. Added `useCashCountsData` (today's Italy-timezone range), derived `floatDone = cashCounts.some(c => c.type === "openingFloat" && sameItalyDate(c.timestamp, new Date()))`, and rendered loading/complete/incomplete states with `data-cy="float-loading"`, `data-cy="float-status"`, `data-cy="float-set-button"`. Added `showFloatModal` state (wired to modal in TASK-04). Added TC-14 through TC-17 to the test file.

**TASK-04 — OpeningFloatModal and EOD checklist wiring (Wave 3)**
Created `OpeningFloatModal.tsx` in `apps/reception/src/components/eodChecklist/`. Modal uses `withModalBackground` HOC, `ModalContainer`, and `z.number().min(0)` validation (zero is a valid float — distinct from `FloatEntryModal` which uses `z.number().positive()`). Pre-fills amount from `settings.standardFloat` (blank when 0). Includes `submitting` boolean state that disables the Confirm button on first click, preventing duplicate Firebase writes. Wired into `EodChecklistContent` via `useCashCountsMutations().addOpeningFloatEntry` passed as `onConfirm`. Created `OpeningFloatModal.test.tsx` with 7 tests (TC-01 through TC-06 plus TC-01b). Added TC-18 to `EodChecklistContent.test.tsx` verifying button click opens modal.

**TASK-05 — Post-close float nudge in till page (Wave 3, parallel with TASK-04)**
Extended `TillReconciliation.tsx` with a `useCashCountsData` subscription (today's range) and derived `floatDoneToday`. Rendered an inline warning banner (`data-cy="float-nudge-banner"`) when `shiftOpenTime === null && !floatDoneToday`. The banner contains a link to `/eod-checklist/` (`data-cy="float-nudge-link"`). The nudge disappears automatically when a Firebase `openingFloat` entry is written (realtime subscription). Updated `TillReconciliation.test.tsx` with TC-01 through TC-04 for the nudge and fixed a pre-existing test failure (matcher `/Click a row to delete/` → `/Click a row to void/` to match component text).

## Tests Run

| Test suite | Command pattern | Result |
|---|---|---|
| cashCountSchema | `jest --testPathPattern="cashCountSchema"` | 6 passed |
| useCashCountsMutation | `jest --testPathPattern="useCashCountsMutation"` | 10 passed |
| EodChecklistContent | `jest --testPathPattern="EodChecklistContent"` | 18 passed |
| OpeningFloatModal | `jest --testPathPattern="OpeningFloatModal"` | 7 passed |
| TillReconciliation | `jest --testPathPattern="TillReconciliation"` | 7 passed |
| Full reception suite (Wave 3 combined) | `jest --testPathPattern="EodChecklistContent|OpeningFloatModal|TillReconciliation"` | 34 passed |

All runs: 0 failed, 0 skipped.

## Validation Evidence

**TASK-01**
- TC-01: `cashCountSchema.safeParse({type:"openingFloat",...})` → success: true ✓
- TC-02: `cashCountSchema.safeParse({type:"float",...})` → success: true ✓ (regression)
- TC-03/04: Invalid type and `openingFloat` with amount parsing ✓

**TASK-02**
- TC-01: `addOpeningFloatEntry(75)` → Firebase write with `type:"openingFloat"`, `amount:75`, `count:0`, `difference:0` ✓
- TC-03/04: `standardFloat` env var fallback to 0 ✓

**TASK-03**
- TC-14: `cashCounts` loading → `data-cy="float-loading"` visible ✓
- TC-15: `type:"openingFloat"` entry today → float-status shows "Complete" ✓
- TC-16: empty `cashCounts` → float-status shows "Incomplete", float-set-button present ✓
- TC-17: `type:"float"` (intra-shift) → float status still "Incomplete" ✓

**TASK-04**
- TC-01: Modal renders with title "Set Opening Float" and amount input ✓
- TC-02: Valid amount → `onConfirm` called with parsed number ✓
- TC-03: Negative amount → error toast, `onConfirm` not called ✓
- TC-04: Non-numeric input → error toast, `onConfirm` not called ✓
- TC-05: Zero amount → `onConfirm(0)` called ✓
- TC-06: Close button → `onClose` called ✓
- TC-18 (EodChecklistContent): "Set Opening Float" button click → modal appears ✓

**TASK-05**
- TC-01: `shiftOpenTime=null`, no `openingFloat` today → nudge banner and link visible ✓
- TC-02: `shiftOpenTime` is Date (shift open) → nudge not shown ✓
- TC-03: `openingFloat` entry exists today → nudge not shown ✓
- TC-04: Nudge link href is `/eod-checklist/` ✓

## Scope Deviations

- None from planned scope. One controlled repair: fixed pre-existing `TillReconciliation.test.tsx` test failure (`/Click a row to delete/` → `/Click a row to void/`) — no scope expansion, repair was necessary to avoid a test regression count in the suite.
- `useCashCountsMutations` added to `EodChecklistContent` import set (not in original TASK-03 Affects but needed for TASK-04 wiring — recorded as controlled scope expansion within TASK-04 objective).

## Outcome Contract

- **Why:** Operator-stated worldclass audit gap — float set is not part of EOD sequence, creating a daily procedural hole where staff must remember to do this separately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The EOD close-out sequence prompts staff to set the opening float immediately after shift close; the amount is persisted to Firebase; the EOD checklist reflects float-set status. Staff no longer need to remember this as a separate action.
- **Source:** operator
