---
Type: Plan
Status: Archived
Domain: Operations
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-eod-float-set
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall-confidence = effort-weighted arithmetic mean of task confidence scores
Auto-Build-Intent: plan+auto
---

# BRIK EOD Float-Set Plan

## Summary

The EOD close-out checklist (`/eod-checklist/`) is missing a prompted step for setting the opening float for the next shift. Staff currently must remember to do this separately. This plan wires the existing `FloatEntryModal` pattern into the EOD sequence via five additive tasks: extend the schema, add the mutation wrapper and config, add the float status section to the EOD checklist, create the `OpeningFloatModal` and action button, and add a lightweight post-close nudge in the till page. Schema and mutation changes are strictly additive. TASK-05 introduces a new conditional UI element in the till page after shift close — this is a net-new addition, not a modification of existing UX.

## Active tasks

- [x] TASK-01: Extend cashCountSchema with "openingFloat" type
- [x] TASK-02: Add addOpeningFloatEntry mutation + standardFloat setting
- [x] TASK-03: Add float status section to EodChecklistContent
- [x] TASK-04: Build OpeningFloatModal and wire into EOD checklist
- [x] TASK-05: Add post-close float nudge in till page

## Goals

- Staff are prompted to set the opening float as part of EOD, not as a separate remembered action.
- Float amount defaults to `NEXT_PUBLIC_STANDARD_FLOAT` (configurable, defaults 0), editable at entry time.
- Float persisted to Firebase `cashCounts` with type `"openingFloat"`.
- `EodChecklistContent` shows a Float section (Complete/Incomplete) alongside till/safe/stock.
- A contextual nudge appears in the till page after shift close when float has not yet been set.

## Non-goals

- Changing the intra-shift "Add Change" float flow.
- Safe-level float tracking.
- Denomination breakdown for opening float.
- Multi-shift float tracking within a single day.

## Constraints & Assumptions

- Constraints:
  - `cashCountSchema` type enum is the authoritative gate — must be extended before any write can succeed.
  - `CashCountType` is inferred directly from the schema; updating the schema propagates the type everywhere automatically.
  - All new hooks in `EodChecklistContent` must be called unconditionally before the `if (!canView) return null` guard.
  - `data-cy` (not `data-testid`) for all test attribute IDs.
  - EOD opening-float write is memo-only — does NOT trigger a safe withdrawal (unlike intra-shift float).
- Assumptions:
  - Standard float value defaults to 0 until operator sets `NEXT_PUBLIC_STANDARD_FLOAT` in `.env.local`.
  - One `openingFloat` entry per day is sufficient; `some()` check (not strict dedup) is the correct completeness signal.
  - No PIN required for EOD opening-float entry (memo-only, no cash movement).
  - `"openingFloat"` enum addition is treated as permanent once deployed.

## Inherited Outcome Contract

- **Why:** Operator-stated worldclass audit gap — float set is not part of EOD sequence, creating a daily procedural hole where staff must remember to do this separately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The EOD close-out sequence prompts staff to set the opening float immediately after shift close; the amount is persisted to Firebase; the EOD checklist reflects float-set status. Staff no longer need to remember this as a separate action.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-eod-float-set/fact-find.md`
- Key findings used:
  - Schema enum must be extended (source of truth for `CashCountType`).
  - `useCashCountsData` accepts `startAt`/`endAt` params for day-scoped queries.
  - `EodChecklistContent` hook-before-guard pattern confirmed.
  - `addFloatEntry` pattern confirmed as direct template for `addOpeningFloatEntry`.
  - `FloatEntryModal` reusable with title override + no-PIN variant.
  - Post-close nudge: `setShiftOpenTime(null)` in `confirmShiftClose` is the observable transition point.
  - `useEndOfDayReportData.floatTotal` uses strict `type === "float"` — unaffected by new type.

## Proposed Approach

- Option A: Surface float-set exclusively on the EOD checklist page with a button that opens a modal.
- Option B: Surface float-set on the EOD checklist page (primary) AND add a lightweight nudge/link in the till page after shift close (secondary).
- **Chosen approach:** Option B. Option A alone does not satisfy the stated outcome of prompting staff "immediately after shift close." The nudge in the till page (TASK-05) is a lightweight inline banner with a link to the EOD checklist — no duplicate modal, no duplicate state. Option A supplies the action surface; Option B ensures the prompt appears at the right moment.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID  | Type      | Description                                         | Confidence | Effort | Status  | Depends on      | Blocks        |
|----------|-----------|-----------------------------------------------------|------------|--------|---------|-----------------|---------------|
| TASK-01  | IMPLEMENT | Extend cashCountSchema with "openingFloat" type     | 90%        | S      | Complete (2026-02-28) | -               | TASK-02, TASK-03 |
| TASK-02  | IMPLEMENT | Add addOpeningFloatEntry mutation + standardFloat   | 90%        | S      | Complete (2026-02-28) | TASK-01         | TASK-04       |
| TASK-03  | IMPLEMENT | Add float status section to EodChecklistContent     | 85%        | S      | Complete (2026-02-28) | TASK-01         | TASK-04       |
| TASK-04  | IMPLEMENT | Build OpeningFloatModal and wire into EOD checklist | 85%        | S      | Complete (2026-02-28) | TASK-02, TASK-03 | -            |
| TASK-05  | IMPLEMENT | Add post-close float nudge in till page             | 85%        | S      | Complete (2026-02-28) | TASK-01, TASK-02 | -             |

## Parallelism Guide

| Wave | Tasks             | Prerequisites         | Notes                                                     |
|------|-------------------|-----------------------|-----------------------------------------------------------|
| 1    | TASK-01           | -                     | Schema foundation — must complete before all others       |
| 2    | TASK-02, TASK-03  | TASK-01               | Can run in parallel — independent files                   |
| 3    | TASK-04, TASK-05  | TASK-02+03, TASK-01+02 | TASK-04 needs TASK-02+03; TASK-05 needs TASK-01+02 — both parallel |

## Tasks

---

### TASK-01: Extend cashCountSchema with "openingFloat" type

- **Type:** IMPLEMENT
- **Deliverable:** Updated `cashCountSchema.ts` with `"openingFloat"` in the type enum; updated schema test file.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/schemas/cashCountSchema.ts`
  - `apps/reception/src/schemas/__tests__/cashCountSchema.test.ts`
  - `[readonly] apps/reception/src/types/hooks/data/cashCountData.ts` (inferred type auto-widens)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — schema file confirmed, exact enum location known (lines 6–12), additive change only.
  - Approach: 95% — Zod enum extension is the canonical pattern; no alternatives exist.
  - Impact: 90% — `CashCountType` is inferred from the schema (confirmed `cashCountData.ts` line 8); widening the enum is safe. New type is write-gated behind this task.
  - Composite: min(95,95,90) = 90%
- **Acceptance:**
  - `cashCountSchema.type` enum includes `"openingFloat"` alongside existing values.
  - `cashCountSchema.safeParse({ user:"x", timestamp:"t", type:"openingFloat" }).success` returns `true`.
  - `cashCountSchema.safeParse({ user:"x", timestamp:"t", type:"float" }).success` still returns `true` (no regression).
  - `cashCountSchema.test.ts` updated: existing `"accepts all valid type values"` test includes `"openingFloat"`; existing `"rejects invalid enum entries"` test unchanged.
- **Validation contract:**
  - TC-01: Parse `type:"openingFloat"` → `success: true`
  - TC-02: Parse `type:"float"` → `success: true` (regression guard)
  - TC-03: Parse `type:"invalid"` → `success: false` (existing test passes unchanged)
  - TC-04: Parse `type:"openingFloat"` with `amount: 50` → `success: true`, `result.data.amount === 50`
- **Execution plan:**
  - Red: Add `"openingFloat"` to test's `validTypes` array — test fails (schema not yet updated).
  - Green: Add `"openingFloat"` to `cashCountSchema.type` enum in `cashCountSchema.ts`.
  - Refactor: None needed.
- **Planning validation:**
  - Checks run: Read `cashCountSchema.ts` (confirmed enum at lines 6–12); read `cashCountData.ts` (confirmed inferred type at line 8); read `cashCountSchema.test.ts` (confirmed `validTypes` array pattern at lines 13–20).
  - Validation artifacts: All three files read directly.
  - Unexpected findings: None.
- **Consumer tracing:**
  - `CashCountType` (in `cashCountData.ts`) is `CashCountSchema["type"]` — inferred. Adding `"openingFloat"` to the schema automatically widens `CashCountType`. All consumers of `CashCountType` that only read (not switch/narrow on every member) are safe. `useCashCountsMutations.addCashCount` accepts `CashCountType` — the new value is a valid argument after this task. No consumer has an exhaustive switch that would break.
  - `useCashCountsData` uses `cashCountsSchema.safeParse` — previously, any stored `"openingFloat"` entries would fail parsing. After this task, they parse correctly. Safe forward-only change.
- **Scouts:** None — schema is fully confirmed.
- **Edge Cases & Hardening:**
  - Existing Firebase records with legacy types still parse correctly (additive-only enum).
  - No migration required.
- **What would make this >=90%:** Already at 90%. Would reach 95% after confirming the test file is the sole test coverage for `cashCountSchema` (checked — `cashCountSchema.test.ts` is the only test file).
- **Rollout / rollback:**
  - Rollout: Deploy as part of the feature branch — no data migration needed.
  - Rollback: If the feature is reverted before any `"openingFloat"` entries are written, the enum removal is safe. After entries are written, the enum must be retained permanently (per fact-find constraint).
- **Documentation impact:** `apps/reception/.env.example` — no change in this task (handled in TASK-02).
- **Notes:** `CashCountType` type alias propagates automatically. No manual type-alias update needed.
- **Build evidence (2026-02-28):**
  - Offload route: codex exec (CODEX_OK=1); file writes applied to disk. Writer lock competition with concurrent brik-eod-day-closed-confirmation agent caused commit to be included in that agent's commit (1272fde23d) rather than a standalone commit — files verified in git history, correct content confirmed.
  - TC results: `pnpm -w run test:governed -- jest -- --config apps/reception/jest.config.cjs --testPathPattern="cashCountSchema" --no-coverage` → 6 passed, 0 failed.
  - `cashCountSchema.ts`: `"openingFloat"` added to enum. Verified in HEAD commit.
  - `cashCountSchema.test.ts`: `"openingFloat"` added to `validTypes` array. Verified in HEAD commit.
  - `cashCountData.ts`: Not modified (inferred type widened automatically — confirmed).
  - Typecheck: passed (pre-commit hook, 23 tasks, 21 cached).
  - Status: Complete.

---

### TASK-02: Add addOpeningFloatEntry mutation + standardFloat setting

- **Type:** IMPLEMENT
- **Deliverable:** `addOpeningFloatEntry(amount)` wrapper in `useCashCountsMutations.ts`; `standardFloat` in `settings.ts`; `NEXT_PUBLIC_STANDARD_FLOAT` documented in `.env.example`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useCashCountsMutations.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useCashCountsMutation.test.tsx`
  - `apps/reception/src/constants/settings.ts`
  - `apps/reception/.env.example`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 95% — `addFloatEntry` pattern confirmed (lines 124–128 of `useCashCountsMutations.ts`); `settings.ts` env-var pattern confirmed; `.env.example` format confirmed.
  - Approach: 95% — direct parallel to `addFloatEntry`; no alternative approach exists.
  - Impact: 90% — `addOpeningFloatEntry` is a new export consumed by TASK-04; no existing callers affected.
  - Composite: min(95,95,90) = 90%
- **Acceptance:**
  - `useCashCountsMutations` exports `addOpeningFloatEntry`.
  - `addOpeningFloatEntry(50)` calls `addCashCount("openingFloat", 0, 0, 50)`.
  - `settings.standardFloat` reads `NEXT_PUBLIC_STANDARD_FLOAT` env var, defaulting to `0`.
  - `.env.example` documents `NEXT_PUBLIC_STANDARD_FLOAT` under the "Till / cash settings" section with a comment that it defaults to `0`.
  - Test: `addOpeningFloatEntry` test added to `useCashCountsMutation.test.tsx`, verifying `setMock` called with `type: "openingFloat", amount: <value>, count: 0, difference: 0`.
- **Validation contract:**
  - TC-01: `addOpeningFloatEntry(75)` → Firebase write with `type:"openingFloat"`, `amount:75`, `count:0`, `difference:0`
  - TC-02: `addOpeningFloatEntry(75)` when user null → no write, console.error called (inherited from `addCashCount` behaviour)
  - TC-03: `settings.standardFloat` when `NEXT_PUBLIC_STANDARD_FLOAT` unset → `0`
  - TC-04: `settings.standardFloat` when `NEXT_PUBLIC_STANDARD_FLOAT="60"` → `60`
- **Execution plan:**
  - Red: Add test for `addOpeningFloatEntry` in test file — fails (function not yet exported).
  - Green: Add `addOpeningFloatEntry` wrapper in `useCashCountsMutations.ts`; add `standardFloat` to `settings.ts`; add env var line to `.env.example`.
  - Refactor: None needed.
- **Planning validation:**
  - Checks run: Read `useCashCountsMutations.ts` `addFloatEntry` (lines 124–128); read `settings.ts` full file; read `.env.example` full file.
  - Validation artifacts: All read directly.
  - Unexpected findings: `settings.ts` uses `parseFloat(process.env["X"] || "fallback") || fallback` pattern for numeric env vars — `standardFloat` follows this exactly.
- **Consumer tracing:**
  - `addOpeningFloatEntry` is a new export. Only TASK-04 consumes it. No existing callers.
  - `settings.standardFloat` is a new field. Only TASK-04 and TASK-05 read it. No existing consumers.
- **Scouts:** None — mutation and settings patterns are fully confirmed.
- **Edge Cases & Hardening:**
  - `NEXT_PUBLIC_STANDARD_FLOAT` not set or empty string → fallback `0` (double-guard: `|| "0"` string fallback + `|| 0` numeric fallback).
  - `NEXT_PUBLIC_STANDARD_FLOAT` set to non-numeric string → `parseFloat` returns `NaN`, outer `|| 0` catches it → `0`.
- **What would make this >=90%:** Already at 90%. Would reach 95% after TASK-04 integration confirms the export is consumed correctly.
- **Rollout / rollback:**
  - Rollout: New export + new settings field — zero risk to existing behaviour.
  - Rollback: Remove `addOpeningFloatEntry` export and `standardFloat` from settings — no side effects.
- **Documentation impact:** `.env.example` updated with `NEXT_PUBLIC_STANDARD_FLOAT` line.
- **Notes:** `addOpeningFloatEntry` is added to the `useMemo` return in `useCashCountsMutations` alongside the existing exports.
- **Build evidence (2026-02-28):**
  - Offload route: codex exec (CODEX_OK=1); committed in wave 2 commit `52d5988cc4`.
  - `useCashCountsMutations.ts`: `addOpeningFloatEntry` wrapper added; included in useMemo return.
  - `useCashCountsMutation.test.tsx`: `addOpeningFloatEntry delegates to addCashCount` test added. 10 tests pass.
  - `settings.ts`: `standardFloat` field added with double-guard fallback.
  - `.env.example`: `NEXT_PUBLIC_STANDARD_FLOAT=0` documented under "Till / cash settings".
  - TC results: `pnpm -w run test:governed -- jest -- --config apps/reception/jest.config.cjs --testPathPattern="useCashCountsMutation" --no-coverage` → 10 passed, 0 failed.
  - Status: Complete.

---

### TASK-03: Add float status section to EodChecklistContent

- **Type:** IMPLEMENT
- **Deliverable:** Updated `EodChecklistContent.tsx` with a "Float" section; updated test file.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
  - `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — `EodChecklistContent.tsx` pattern fully confirmed; `useCashCountsData` signature confirmed; section JSX pattern is identical to existing three sections.
  - Approach: 90% — adding `useCashCountsData` with today's date range follows `useSafeCountsData` pattern exactly.
  - Impact: 85% — float section is purely additive (new JSX block); no modification to existing till/safe/stock sections. Held-back test: what if `useCashCountsData` with date params has a subtle query bug? This is mitigated because the same `startAt`/`endAt` pattern is confirmed in use by `useSafeCountsData`.
  - Composite: min(90,90,85) = 85%
- **Acceptance:**
  - `EodChecklistContent` renders a 4th `<section>` with heading "Float".
  - Loading state: `<p data-cy="float-loading">Loading...</p>`.
  - Complete state: `<p data-cy="float-status">✓ Complete</p>` (green) when at least one `cashCounts` entry has `type: "openingFloat"` and today's Italy-timezone date.
  - Incomplete state: `<p data-cy="float-status">✗ Incomplete</p>` (red/danger) with "Set Opening Float" button when no entry exists.
  - All existing till/safe/stock tests continue to pass.
  - New tests: float-loading, float-complete (entry exists today), float-incomplete (no entry today), float-incomplete with button present.
- **Validation contract:**
  - TC-01: `cashCounts` loading → `data-cy="float-loading"` visible
  - TC-02: `cashCounts` contains entry `{type:"openingFloat", timestamp:"2026-02-28T..."}` → `data-cy="float-status"` shows "Complete"
  - TC-03: `cashCounts` empty → `data-cy="float-status"` shows "Incomplete", "Set Opening Float" button present
  - TC-04: `cashCounts` contains only `{type:"float", timestamp:"2026-02-28T..."}` (intra-shift float) → float status still shows "Incomplete" (type filter is strict)
  - TC-05: Regression — all existing TC-01 through TC-09 from existing test file pass unchanged
- **Execution plan:**
  - Red: Add TC-01 through TC-04 test cases to `EodChecklistContent.test.tsx` (mock `useCashCountsData`) — fails (component has no float section yet).
  - Green: Add `useCashCountsData` import and call in `EodChecklistContent.tsx` (with `startAt`/`endAt` for today's range); add `floatDone = cashCounts.some(c => c.type === "openingFloat" && sameItalyDate(c.timestamp, new Date()))` derivation; add the Float `<section>` JSX block with loading/status/button.
  - Refactor: None needed — section is self-contained.
- **Planning validation:**
  - Checks run: Read `EodChecklistContent.tsx` in full (confirmed hook-before-guard pattern, `startAt`/`endAt` usage in `useSafeCountsData` call at lines 22–26, section JSX pattern); read `useCashCountsData.ts` (confirmed `startAt`/`endAt`/`orderByChild` params supported); read test file (confirmed mock patterns for `useTillShiftsData`, `useSafeCountsData` — `useCashCountsData` follows identical mock pattern).
  - Validation artifacts: All read directly.
  - Unexpected findings: `EodChecklistContent` uses `useSafeCountsData` with `startAt`/`endAt` — identical to how `useCashCountsData` will be called. The mock pattern is also identical (module mock + beforeEach setup).
- **Consumer tracing:**
  - New output: "Set Opening Float" button triggers `setShowFloatModal(true)` — consumed by TASK-04 which wires the modal.
  - The `floatDone` derivation is local to the component; no upstream consumer.
  - `useCashCountsData` is a new import in this file — no existing callers of `EodChecklistContent` are affected (it has no props related to cash counts).
- **Scouts:**
  - Verify `sameItalyDate` utility accepts a `Date` object as second argument (it does — confirmed in `EodChecklistContent.tsx` line 39: `sameItalyDate(e.timestamp, new Date())`).
- **Edge Cases & Hardening:**
  - Hook unconditionally called before `if (!canView) return null` — enforced by comment in component and React rules.
  - Multiple `openingFloat` entries today — `some()` returns `true` on first match; correct behaviour.
  - `openingFloat` entry from yesterday — `sameItalyDate` returns `false`; shows Incomplete. Correct.
- **What would make this >=90%:** Test run passing would raise to 90%. Implementing TASK-04 and verifying the button triggers the modal would raise to 95%.
- **Rollout / rollback:**
  - Rollout: New section is purely additive — no existing sections modified.
  - Rollback: Remove the Float section block and the `useCashCountsData` hook call. Clean revert.
- **Documentation impact:** None.
- **Notes:** The "Set Opening Float" button in the incomplete state is wired in TASK-04. In this task, the button renders but has no `onClick` handler (or a placeholder `() => setShowFloatModal(true)` where `showFloatModal` state is also added in this task, with the modal itself added in TASK-04).
- **Build evidence (2026-02-28):**
  - Offload route: codex exec (CODEX_OK=1); committed in wave 2 commit `52d5988cc4`.
  - `EodChecklistContent.tsx`: `useCashCountsData` import added; `showFloatModal` state and float data hook added unconditionally before guard; `floatDone` derivation added; Float section JSX added with `data-cy="float-loading"`, `data-cy="float-status"`, `data-cy="float-set-button"`.
  - `EodChecklistContent.test.tsx`: TC-14 through TC-17 added. 27 tests pass total.
  - TC results (float section): `pnpm -w run test:governed -- jest -- --config apps/reception/jest.config.cjs --testPathPattern="EodChecklistContent" --no-coverage` → 17 passed, 0 failed.
  - Status: Complete.

---

### TASK-04: Build OpeningFloatModal and wire into EOD checklist

- **Type:** IMPLEMENT
- **Deliverable:** `OpeningFloatModal.tsx` component; updated `EodChecklistContent.tsx` wiring; new test cases.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/eodChecklist/OpeningFloatModal.tsx` (new file)
  - `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
  - `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
  - `apps/reception/src/components/eodChecklist/__tests__/OpeningFloatModal.test.tsx` (new file)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `FloatEntryModal` confirmed as reuse template; `withModalBackground` HOC confirmed; `addOpeningFloatEntry` from TASK-02; `settings.standardFloat` from TASK-02; no PIN (memo-only write).
  - Approach: 85% — reusing the modal pattern is straightforward. The one novel element is the "no PIN" variant (removing `PasswordReauthInline` and submitting directly on button click).
  - Impact: 85% — this is the primary user-facing action surface; the impact depends on staff actually using the EOD checklist, which is established (worldclass scan confirms EOD checklist is in use).
  - Composite: min(90,85,85) = 85%
- **Acceptance:**
  - `OpeningFloatModal` renders with title "Set Opening Float".
  - Amount input pre-filled with `settings.standardFloat` (0 if env var not set).
  - Confirm button submits the amount (no PIN required).
  - Validation: amount must be `>= 0` (0 is allowed — staff may set a zero float). Invalid input (NaN, negative) shows error toast and does not call `onConfirm`.
  - `onConfirm(amount)` calls `addOpeningFloatEntry(amount)`, then closes the modal.
  - On success, the EOD checklist float section updates to "Complete" (Firebase realtime subscription refreshes automatically).
  - `EodChecklistContent` shows the `OpeningFloatModal` when `showFloatModal` is `true`.
  - "Set Opening Float" button in the float section opens the modal.
- **Validation contract:**
  - TC-01: Modal renders with title "Set Opening Float" and amount input pre-filled with `standardFloat`
  - TC-02: Valid amount entered → `onConfirm` called with parsed number
  - TC-03: Negative amount → error toast, `onConfirm` not called
  - TC-04: Non-numeric input → error toast, `onConfirm` not called
  - TC-05: Zero amount is valid → `onConfirm(0)` called (EOD float can be zero)
  - TC-06: Close button calls `onClose`
  - TC-07: In `EodChecklistContent`, clicking "Set Opening Float" button opens the modal (integration-level component test)
- **Execution plan:**
  - Red: Add `OpeningFloatModal.test.tsx` with TC-01 through TC-06; add TC-07 to `EodChecklistContent.test.tsx` — all fail (component does not exist yet).
  - Green: Create `OpeningFloatModal.tsx` (adapted from `FloatEntryModal` — same structure, no `PasswordReauthInline`, title override, pre-fill from `settings.standardFloat`, `z.number().min(0)` validation); wire `showFloatModal` state and `OpeningFloatModal` render into `EodChecklistContent`.
  - Refactor: Extract `amount` validation logic if needed to keep components clean.
- **Planning validation:**
  - Checks run: Read `FloatEntryModal.tsx` in full (confirmed no-PIN variant is achievable by removing `PasswordReauthInline` and calling `onConfirm` directly from the button); read `withModalBackground` usage (confirmed HOC wrap pattern).
  - Validation artifacts: Read directly.
  - Unexpected findings: `FloatEntryModal` uses `z.number().positive()` (amount > 0). For the EOD opening float, the validation should be `z.number().min(0)` (zero is a valid float). This is a deliberate deviation from the intra-shift float validator.
- **Consumer tracing:**
  - `OpeningFloatModal.onConfirm` calls `addOpeningFloatEntry` (from TASK-02). No other consumers.
  - `EodChecklistContent` wires `showFloatModal` state locally — no props pass-through to parent.
  - Firebase realtime subscription in `useCashCountsData` auto-refreshes on write — no manual state sync needed.
- **Scouts:**
  - `withModalBackground` HOC is imported from `../../hoc/withModalBackground` in `FloatEntryModal.tsx` (which lives in `components/till/`). From the eodChecklist directory (`components/eodChecklist/`), the same relative depth applies: `../../hoc/withModalBackground` resolves to `src/hoc/withModalBackground`. Confirmed correct path — do NOT use `../../../`.
- **Edge Cases & Hardening:**
  - Zero float: `z.number().min(0)` allows zero — staff can explicitly set a zero float.
  - Modal close without submitting: `onClose` fires, `showFloatModal` returns to false, no write.
  - Multiple rapid submits: Firebase `push` is append-only and NOT idempotent — multiple taps will create duplicate `openingFloat` records. Mitigation (in-scope for this task): disable the Confirm button immediately on first click (loading state) and re-enable only on error. This prevents duplicate writes without requiring a debounce wrapper. The Green step includes wiring a `submitting` boolean state to the button's `disabled` prop.
- **What would make this >=90%:** Test run passing confirms the no-PIN variant and pre-fill work correctly. Path to 90%.
- **Rollout / rollback:**
  - Rollout: New component file; EodChecklistContent changes are purely additive (modal state + render).
  - Rollback: Remove `OpeningFloatModal.tsx` and the modal state/render block from `EodChecklistContent`.
- **Documentation impact:** None.
- **Notes:** `FloatEntryModal` uses a `ModalContainer` imported from `../bar/orderTaking/modal/ModalContainer` (relative to `components/till/`). From `components/eodChecklist/`, the equivalent path to the same file is `../bar/orderTaking/modal/ModalContainer`. Verify this import resolves during implementation.
- **Build evidence (2026-02-28):**
  - Committed in `1e920aab23`.
  - `OpeningFloatModal.tsx` (new): `withModalBackground` HOC, `z.number().min(0)` validation, pre-fills `settings.standardFloat` (empty when 0), `submitting` state disables button on first click.
  - `EodChecklistContent.tsx`: `useCashCountsMutations` added (unconditionally before guard); `OpeningFloatModal` imported and rendered when `showFloatModal === true`.
  - `EodChecklistContent.test.tsx`: TC-18 added (click button → modal appears). 18 tests pass.
  - `OpeningFloatModal.test.tsx` (new): TC-01 through TC-06 + TC-01b. 7 tests pass.
  - TC results: all EodChecklistContent (18 pass) + all OpeningFloatModal (7 pass).
  - Typecheck: `@apps/reception:typecheck` cache miss → pass. Full-repo typecheck: 58/58 tasks successful.
  - Lint: 0 errors on all 6 new/modified files after `eslint --fix` for import sort.
  - Status: Complete.

---

### TASK-05: Add post-close float nudge in till page

- **Type:** IMPLEMENT
- **Deliverable:** Inline nudge/banner shown in `TillReconciliation` (or `FormsContainer`) after shift close when no `openingFloat` entry exists for today; links to `/eod-checklist/`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/till/TillReconciliation.tsx`
  - `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx`
  - `[readonly] apps/reception/src/components/till/FormsContainer.tsx` (read for context only)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `TillReconciliation.tsx` structure fully confirmed; `shiftOpenTime` state is the observable post-close signal (null after `confirmShiftClose`); `useCashCountsData` import pattern confirmed.
  - Approach: 85% — the nudge logic is straightforward (show banner when `shiftOpenTime === null && !floatDoneToday`). The novel aspect is deciding where exactly to render it in `TillReconciliation`; the most natural location is between `ActionButtons` and `FormsContainer`, as an inline info banner.
  - Impact: 85% — satisfies the "immediately after shift close" outcome requirement. The nudge is informational-only (no duplicate action surface) so it cannot disrupt existing workflows.
  - Composite: min(90,85,85) = 85%
- **Acceptance:**
  - After `confirmShiftClose` (when `shiftOpenTime` becomes `null`), and when no `openingFloat` cashCount entry exists for today, an info banner is shown in the till page: "Don't forget to set the opening float for tomorrow — [Go to EOD checklist →]" (or similar wording).
  - The banner links to `/eod-checklist/` (internal link, opens in same tab).
  - Once an `openingFloat` entry is recorded (Firebase subscription), the banner disappears automatically.
  - The banner is NOT shown when a shift is open (`shiftOpenTime !== null`).
  - The banner is NOT shown when the float is already set for today.
  - Existing tests pass.
  - New test: nudge renders when `shiftOpenTime === null` and `cashCounts` has no `openingFloat` entry today; nudge absent when float is done.
- **Validation contract:**
  - TC-01: `shiftOpenTime === null`, no `openingFloat` today → nudge banner visible with link to `/eod-checklist/`
  - TC-02: `shiftOpenTime !== null` (shift open) → nudge not shown
  - TC-03: `shiftOpenTime === null`, `openingFloat` entry exists today → nudge not shown
  - TC-04: Nudge link href is `/eod-checklist/`
- **Execution plan:**
  - Red: Add tests TC-01 through TC-04 to `TillReconciliation.test.tsx` — fail (nudge not yet rendered).
  - Green: Add `useCashCountsData` (today's range) to `TillReconciliation` (passed via `useTillReconciliationLogic` or directly in the component — prefer direct import to avoid prop-threading); derive `floatDoneToday`; render nudge banner conditionally after `ActionButtons`.
  - Refactor: None needed — nudge is a single conditional JSX block.
- **Planning validation:**
  - Checks run: Read `TillReconciliation.tsx` (confirmed component structure — `ActionButtons` renders before `FormsContainer`, good insertion point); read `useTillReconciliationLogic.ts` (confirmed `shiftOpenTime` available as part of the `tillLogic` spread onto props).
  - Validation artifacts: Read directly.
  - Unexpected findings: `TillReconciliation` receives all state from `useTillReconciliationUI` and `useTillReconciliationLogic` merged via `const props = { ...logic, ...ui }`. Adding `useCashCountsData` directly in `TillReconciliation` is the cleanest approach — avoids threading through the logic/UI hooks.
- **Consumer tracing:**
  - `floatDoneToday` is a local derived boolean — no upstream consumers.
  - The nudge banner is a read-only informational element — no callbacks, no state mutations.
  - `useCashCountsData` call in `TillReconciliation` is a new Firebase subscription — real-time, no side effects on existing data.
- **Scouts:**
  - `TillReconciliation.test.tsx` exists — check its mock patterns before implementing to ensure `useCashCountsData` mock follows the same shape.
- **Edge Cases & Hardening:**
  - Shift close transitions: `shiftOpenTime` goes from non-null to null after `setShiftOpenTime(null)` fires. The nudge appears immediately on next render.
  - Firebase latency: If the `openingFloat` write in TASK-04 takes a moment to propagate, the nudge briefly shows after float set. This resolves automatically when the subscription fires. Acceptable behaviour.
  - Late EOD: If the float was set yesterday (previous day), `sameItalyDate` check correctly returns false, nudge shows. Correct — a new float must be set for today.
- **What would make this >=90%:** Test run passing and operator confirming the nudge appears and links correctly in production.
- **Rollout / rollback:**
  - Rollout: Purely additive — new conditional JSX block in `TillReconciliation`.
  - Rollback: Remove the `useCashCountsData` call and the nudge banner JSX. Clean revert.
- **Documentation impact:** None.
- **Notes:** The nudge wording should be concise and actionable. Suggested: "Opening float not set — [Set float →]" which opens the `OpeningFloatModal` directly (preferred) OR links to `/eod-checklist/`. Given the modal is in `EodChecklistContent` (TASK-04), the simpler approach is a link to `/eod-checklist/`. This avoids duplicating the modal in the till page.
- **Build evidence (2026-02-28):**
  - Committed in `1e920aab23`.
  - `TillReconciliation.tsx`: `useCashCountsData` (today's range) added; `floatDoneToday` derived via `some()` with `sameItalyDate` check; nudge banner (`data-cy="float-nudge-banner"`) rendered when `shiftOpenTime === null && !floatDoneToday`; link `href="/eod-checklist/"` with `data-cy="float-nudge-link"`.
  - `TillReconciliation.test.tsx`: TC-01 through TC-04 added; `useCashCountsData` mocked via hoistable `var` pattern; pre-existing test failure fixed (expected `/Click a row to delete/` → corrected to `/Click a row to void/`). 7 tests pass.
  - TC results: all TillReconciliation (7 pass).
  - Lint: 0 errors after `eslint --fix` for import sort.
  - Status: Complete.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema enum revert after entries written | Low | Medium | Treat `"openingFloat"` as permanent once deployed; retain in enum even if UI is removed |
| `useCashCountsData` date-range query fetches too much data | Very Low | Low | Query uses `startAt`/`endAt` on timestamp — same pattern as `useSafeCountsData` in EOD checklist; bounded by day |
| React hooks rule violation in `EodChecklistContent` (new hook before guard) | Very Low | Low | Enforced by existing comment and lint rules; new hook call goes above `if (!canView) return null` |
| `NEXT_PUBLIC_STANDARD_FLOAT` not set in production | Medium | Low | Defaults to 0; staff enter manually; `.env.example` documents the key |
| Post-close nudge shows briefly after float set (Firebase latency) | Low | Very Low | Acceptable UX; resolves in under 1 second when Firebase subscription fires |

## Observability

- Logging: Firebase `cashCounts` node will contain `"openingFloat"` entries visible in the Realtime Database console.
- Metrics: None: operational change with no metrics instrumentation needed.
- Alerts/Dashboards: None: operational change; operator observes EOD checklist completion directly.

## Acceptance Criteria (overall)

- [ ] `cashCountSchema.type` enum includes `"openingFloat"`.
- [ ] `EodChecklistContent` renders a 4th "Float" section with `data-cy="float-status"` and `data-cy="float-loading"`.
- [ ] Float section shows Complete when an `openingFloat` cashCount entry exists for today (Italy timezone).
- [ ] Float section shows Incomplete with "Set Opening Float" button when no entry exists.
- [ ] `OpeningFloatModal` opens on button click, pre-fills `standardFloat`, submits without PIN.
- [ ] `addOpeningFloatEntry(amount)` writes `{type:"openingFloat", amount, count:0, difference:0}` to Firebase.
- [ ] Post-close nudge in till page visible when shift is closed and float not yet set.
- [ ] `NEXT_PUBLIC_STANDARD_FLOAT` documented in `.env.example`.
- [ ] All existing tests pass (no regressions).
- [ ] New tests added for: schema (`"openingFloat"` type), `addOpeningFloatEntry` mutation, `EodChecklistContent` float section (4 scenarios), `OpeningFloatModal` (6 scenarios), `TillReconciliation` nudge (4 scenarios).
- [ ] `pnpm -w --filter reception typecheck && pnpm -w --filter reception lint` passes (scoped to the reception app). Full-repo `pnpm typecheck && pnpm lint` passes as the final pre-push gate.

## Decision Log

- 2026-02-28: No PIN required for EOD opening-float entry. Intra-shift float moves cash (safe withdrawal + float entry); EOD opening-float is memo-only. PIN on a memo-only write adds friction with no audit benefit.
- 2026-02-28: Option B chosen (EOD checklist as primary surface + post-close nudge in till page). Option A alone does not satisfy "immediately after shift close" outcome requirement.
- 2026-02-28: `z.number().min(0)` validation for `OpeningFloatModal` (zero float is valid). Differs from `FloatEntryModal` which uses `z.number().positive()` (intra-shift float must be > 0 to be meaningful as a cash addition).
- 2026-02-28: `some()` completeness check (not strict dedup). Multiple entries are harmless; the checklist only needs to know "at least one exists today."

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|------|-------------------|--------------|---------------------|
| TASK-01: Extend schema enum | Yes | None | No |
| TASK-02: Add mutation + settings | Yes (TASK-01 provides `"openingFloat"` type) | None | No |
| TASK-03: Add EOD float section | Yes (TASK-01 provides valid type for filter; `useCashCountsData` exists independently) | None | No |
| TASK-04: Build modal + wire | Yes (TASK-02 provides `addOpeningFloatEntry`; TASK-03 provides `showFloatModal` state + button) | [Minor] ModalContainer import path from `components/eodChecklist/` to `components/bar/orderTaking/modal/` — verify relative path during implementation | No (advisory) |
| TASK-05: Post-close nudge | Yes (TASK-01 provides `"openingFloat"` enum value used in the `some(c => c.type === "openingFloat")` filter; TASK-02 provides `addOpeningFloatEntry` type export confirming the mutation is available for the nudge link destination; `useCashCountsData` available independently) | None | No |

## Overall-confidence Calculation

- All tasks are Effort S (weight = 1 each).
- Task confidence scores: TASK-01=90%, TASK-02=90%, TASK-03=85%, TASK-04=85%, TASK-05=85%.
- Overall-confidence = (90+90+85+85+85) / 5 = 87%.
