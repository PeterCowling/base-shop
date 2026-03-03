---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Sequenced: 2026-03-01
Build-completed: 2026-03-01
Audit-Ref: working-tree (eodClosureSchema.ts has uncommitted changes from a prior task)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-eod-variance-amounts
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception EOD Variance Amounts Plan

## Summary

The EOD closure record stored in Firebase RTDB currently carries only `confirmedBy`, `timestamp`, `date`, and `uid`. A manager reviewing a past closure cannot see the day's cash over/short or how many stock items were counted without navigating away. This plan enriches the closure record with two optional fields — `cashVariance` (signed, summed from per-shift `closeDifference`) and `stockItemsCounted` (count of distinct inventory items with a today `count` ledger entry) — and surfaces them inline in `EodChecklistContent`: a pre-close summary row above the confirm button and in the post-close "day closed" banner. The blast radius is narrow: four files are affected plus their tests.

## Active tasks

- [x] TASK-01: Extend `eodClosureSchema` with `cashVariance` and `stockItemsCounted`
- [x] TASK-02: Update `useEodClosureMutations` to accept and persist variance snapshot
- [x] TASK-03: Compute variance figures in `EodChecklistContent` and render pre-close summary
- [x] TASK-04: Update "day closed" banner to show variance figures from stored closure
- [x] TASK-05: Tests — schema unit, mutation update, component coverage for new UI

## Goals

- Enrich the stored EOD closure record with `cashVariance?: number` and `stockItemsCounted?: number`.
- Compute and persist these figures at the moment of confirmation using data already loaded in the component.
- Surface figures inline in `EodChecklistContent` pre-close and post-close.

## Non-goals

- `safeVariance` and `keycardVariance` — require provider refactor; deferred.
- Full EOD report screen — existing `ManagerAuditContent` path handles that.
- Manager override / exception carry-over — IDEA-DISPATCH-20260301-0084.
- Changes to safe reconciliation or till close flows.

## Constraints & Assumptions

- Constraints:
  - New Zod fields use `z.number().optional()` / `z.number().int().optional()` for backward compat.
  - Mutation continues to `safeParse` before writing.
  - Display format: signed number, positive = over, negative = short (e.g. `€+3.50`, `€−2.00`).
  - `useTillShiftsData` limit raised from 10 to 20 to prevent silent undercount.
  - No local test runs — push to CI per AGENTS.md.
- Assumptions:
  - `closeDifference` is always populated for shifts closed by `CloseShiftForm.finishConfirm()` — confirmed by reading the form code.
  - A single BRIK hostel day has fewer than 20 shifts.
  - Old closure records (missing new fields) render gracefully — banner omits the variance rows entirely when fields are absent (no `—` placeholder). This is consistent with TASK-04 acceptance.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A manager reviewing the stored EOD closure record can see the cash over/short and stock items-counted figures without navigating to separate screens.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-eod-variance-amounts/fact-find.md`
- Key findings used:
  - `useEndOfDayReportData` not viable without TillDataProvider/SafeDataProvider; per-shift `closeDifference` summation used instead.
  - Schema enrichment blast radius: 4 files only (`eodClosureSchema.ts`, `useEodClosureMutations.ts`, `useEodClosureData.ts`, `EodChecklistContent.tsx`). Note: `useEodClosureData.ts` is unchanged by this plan — it subscribes to the `eodClosures/<date>` node and returns raw Firebase data. The enriched `EodClosure` type flows through automatically via type inference; no behavioral change is needed in that hook.
  - Mutation test TC-01 asserts exact payload shape — must update.
  - Display format resolved: signed number (positive = over; negative = short).

## Proposed Approach

- Option A: Compute variance inside the mutation hook (reads additional Firebase data internally).
- Option B: Compute variance in `EodChecklistContent` using already-loaded `shifts` and `entries`, pass to `confirmDayClosed` as a typed snapshot object.
- Chosen approach: **Option B** — `EodChecklistContent` already has `shifts` and `entries` in scope; computing there keeps the mutation hook lean and both sides independently testable.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend `eodClosureSchema` with `cashVariance` and `stockItemsCounted` | 90% | S | Complete (2026-03-01) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Update `useEodClosureMutations` signature and payload | 90% | S | Complete (2026-03-01) | TASK-01 | TASK-03 |
| TASK-04 | IMPLEMENT | Update "day closed" banner to show variance from stored closure | 90% | S | Complete (2026-03-01) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Compute variance in `EodChecklistContent`, render pre-close summary | 85% | M | Complete (2026-03-01) | TASK-02, TASK-04 | TASK-05 |
| TASK-05 | IMPLEMENT | Tests — schema, mutation, component for all new paths | 85% | M | Complete (2026-03-01) | TASK-03, TASK-04 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema foundation; no dependencies |
| 2 | TASK-02, TASK-04 | TASK-01 complete | Both depend only on TASK-01 and can run in parallel. TASK-02 updates the mutation hook; TASK-04 updates the banner display (reads `EodClosure` type from schema only). |
| 3 | TASK-03 | TASK-02, TASK-04 complete | Depends on TASK-02 (updated mutation signature) and TASK-04 (file-overlap ordering on `EodChecklistContent.tsx` — both tasks modify the same file). |
| 4 | TASK-05 | TASK-03, TASK-04 complete | All test coverage after all implementation complete |

**Max parallelism:** 2 (Wave 2)
**Critical path:** TASK-01 → TASK-02 → TASK-03 → TASK-05 (4 waves)
**Total tasks:** 5

## Tasks

---

### TASK-01: Extend `eodClosureSchema` with `cashVariance` and `stockItemsCounted`

- **Build evidence:** Complete (2026-03-01). Commit 336624a564. Added `cashVariance: z.number().optional()` and `stockItemsCounted: z.number().int().optional()` to schema. Created `eodClosureSchema.test.ts` with TC-01 through TC-04. Typecheck pass, lint 0 errors. Offload route: inline (codex lock contention — fallback per build-offload-protocol).
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/schemas/eodClosureSchema.ts`; exported `EodClosure` type reflects new optional fields.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/schemas/eodClosureSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — Schema file is 27 lines (includes `EodOverrideSignoff` interface added by a prior task); the zod object itself is 12 fields. Pattern is established (`z.number().optional()` in `safeCountSchema`, `tillShiftSchema`). No ambiguity.
  - Approach: 90% — Adding two optional Zod fields with backward compat is the correct and minimal change.
  - Impact: 90% — Schema is the foundation contract; downstream consumers receive new fields automatically once enriched.
- **Acceptance:**
  - `eodClosureSchema` accepts a record with `cashVariance` (number) and `stockItemsCounted` (integer) when present.
  - `eodClosureSchema` accepts a record without these fields (backward compat).
  - `eodClosureSchema` rejects non-numeric `cashVariance` and non-integer `stockItemsCounted`.
  - `EodClosure` TypeScript type has `cashVariance?: number` and `stockItemsCounted?: number`.
- **Validation contract (TC-XX):**
  - TC-01: Valid full payload `{date, timestamp, confirmedBy, cashVariance: -3.5, stockItemsCounted: 12}` → `safeParse` succeeds.
  - TC-02: Payload without new fields `{date, timestamp, confirmedBy}` → `safeParse` succeeds (backward compat).
  - TC-03: Payload with `cashVariance: "bad"` → `safeParse` fails with validation error.
  - TC-04: Payload with `stockItemsCounted: 3.7` (non-integer) → `safeParse` fails with validation error.
- **Execution plan:** Red → Green → Refactor
  - Red: No direct schema test file exists — add `src/schemas/__tests__/eodClosureSchema.test.ts` with TC-01 through TC-04 (all initially failing for new fields).
  - Green: Add `cashVariance: z.number().optional()` and `stockItemsCounted: z.number().int().optional()` to `eodClosureSchema`. Tests pass.
  - Refactor: Verify exported `EodClosure` type is correctly inferred; update JSDoc on schema file.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: schema-only, no runtime behavior.
- **Edge Cases & Hardening:**
  - Backward compat: confirmed by TC-02 — existing records without new fields must parse successfully.
  - `stockItemsCounted: 0` is valid (day with no stock counted).
  - `cashVariance: 0` is valid (balanced cash).
  - Negative `cashVariance` is valid (cash short).
- **What would make this >=90%:** Already at 90% — no unknowns. Held-back test: no single unresolved unknown would drop this below 80 because the schema pattern is fully established in the codebase and both fields are simple optionals.
- **Rollout / rollback:**
  - Rollout: Schema change is backward compatible; no deploy coordination needed.
  - Rollback: Revert the two field additions; existing records remain valid.
- **Documentation impact:** Update JSDoc comment on `eodClosureSchema` to describe new fields.
- **Notes / references:** Pattern: `apps/reception/src/schemas/safeCountSchema.ts` (`count: z.number().optional()`), `apps/reception/src/schemas/tillShiftSchema.ts` (`closeDifference: z.number().optional()`).

---

### TASK-02: Update `useEodClosureMutations` signature and payload

- **Build evidence:** Complete (2026-03-01). Commit 4efba348e5. Added `EodClosureSnapshot` interface. Updated `confirmDayClosed` to accept optional snapshot. Conditional key spread guards undefined. Typecheck pass, lint 0 errors.
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — `confirmDayClosed` accepts an optional typed snapshot and merges it into the written payload.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/useEodClosureMutations.ts`; `[readonly] apps/reception/src/schemas/eodClosureSchema.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — Mutation file is 56 lines; change is adding one parameter and spreading into payload. Hook's return type changes from `{ confirmDayClosed: () => Promise<void> }` to `{ confirmDayClosed: (snapshot?: EodClosureSnapshot) => Promise<void> }`.
  - Approach: 90% — Typed snapshot object (not positional args) is the established pattern for extensible payloads; avoids future argument-order bugs.
  - Impact: 90% — The payload enrichment is the essential write-path for the feature; all consumers of the stored record benefit.
- **Acceptance:**
  - `confirmDayClosed()` (no args) writes `{date, timestamp, confirmedBy, uid}` — unchanged behavior for callers that don't pass snapshot.
  - `confirmDayClosed({ cashVariance: -3.5, stockItemsCounted: 12 })` writes all fields.
  - `confirmDayClosed({ cashVariance: undefined })` omits the field from the written record. The implementation must conditionally include snapshot fields (not blindly spread the snapshot object) — Zod `.optional()` does not strip keys that are explicitly present with `undefined` values. **Implementation assumption:** Firebase RTDB JS SDK v9 silently drops `undefined`-valued keys from the `set()` payload (they are treated as non-existent); this is consistent with observed behavior in the codebase. To avoid any ambiguity, the implementation conditionally omits undefined keys before `safeParse` rather than relying on SDK behavior — this makes the guard explicit and testable regardless of SDK version.
  - `safeParse` gate still enforces schema before any write.
  - Hook return type updated; TypeScript compile succeeds.
- **Validation contract (TC-XX):**
  - TC-01: `confirmDayClosed({ cashVariance: -3.5, stockItemsCounted: 12 })` → `set()` called with payload including `cashVariance: -3.5, stockItemsCounted: 12`.
  - TC-02: `confirmDayClosed()` (no args) → `set()` called with original 4-field payload; no new fields present.
  - TC-03: `confirmDayClosed({ cashVariance: 0, stockItemsCounted: 0 })` → `set()` called with `cashVariance: 0, stockItemsCounted: 0`.
  - TC-04: `user` is null → `set()` not called (existing guard, regression test).
- **Execution plan:** Red → Green → Refactor
  - Red: Update existing `useEodClosureMutations.test.ts` TC-01 to expect new optional fields. Add TC-03 (zero values). Existing TC-01 will now fail until implementation.
  - Green: Add `EodClosureSnapshot` type `{ cashVariance?: number; stockItemsCounted?: number }`. Update `confirmDayClosed` signature to `(snapshot?: EodClosureSnapshot) => Promise<void>`. Build the payload by conditionally including snapshot fields: `...(snapshot?.cashVariance !== undefined ? { cashVariance: snapshot.cashVariance } : {})` — do NOT use a blind spread of the snapshot object, because Firebase RTDB silently drops `undefined`-valued keys from the written object, causing the in-memory `safeParse` payload to diverge from the stored record. Explicitly omit undefined keys before `safeParse`. Update `useCallback` deps array. Tests pass.
  - Refactor: Update JSDoc. Verify TypeScript return type annotation matches new signature.
- **Planning validation (required for M/L):** None: S-effort task.
- **Consumer tracing (new output):**
  - New output: `confirmDayClosed` now has a `snapshot?` parameter.
  - Consumer: `EodChecklistContent` (calls `confirmDayClosed`) — must be updated in TASK-03 to pass the snapshot. Addressed in TASK-03.
  - Consumer: `useEodClosureMutations.test.ts` — mock must be updated. Addressed in TASK-05.
  - No other consumers: grep confirms `useEodClosureMutations` is imported only in `EodChecklistContent` and its test file.
- **Scouts:** None: hook-only change with well-understood behavior.
- **Edge Cases & Hardening:**
  - `snapshot` with only one field set (e.g. `{ cashVariance: 5 }`, no `stockItemsCounted`) → Zod optional handles; field omitted from record.
  - `snapshot` is `undefined` → payload without new fields, identical to pre-change behavior.
- **What would make this >=90%:** Already at 90%. Held-back test: no single unresolved unknown would drop below 80; the pattern and types are all confirmed.
- **Rollout / rollback:**
  - Rollout: The signature change is additive — callers passing no args continue to work.
  - Rollback: Revert signature to `() => Promise<void>`, remove snapshot spread.
- **Documentation impact:** Update JSDoc to document snapshot parameter and fields.
- **Notes / references:** Existing callers: `EodChecklistContent.tsx` line 198 — `void confirmDayClosed()`. Must be updated in TASK-03.

---

### TASK-04: Update "day closed" banner to show variance figures from stored closure

- **Build evidence:** Complete (2026-03-01). Commit 4efba348e5. Added `formatCashVariance()` helper. Banner shows `data-cy="eod-closure-cash-variance"` and `data-cy="eod-closure-stock-items"` via `typeof` guards. Old records omit rows gracefully. Typecheck pass, lint 0 errors.
- **Type:** IMPLEMENT
- **Deliverable:** Updated "day closed" banner in `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — shows `cashVariance` and `stockItemsCounted` from `closure` record when present.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`; `[readonly] apps/reception/src/schemas/eodClosureSchema.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — Banner is 14 JSX lines; adding conditional display for two optional fields is trivial.
  - Approach: 90% — Graceful fallback (omit row when field absent) is safe and backward compat with old closure records.
  - Impact: 90% — This is the manager-facing post-close view that closes the gap described in the worldclass scan.
- **Acceptance:**
  - Banner `data-cy="day-closed-banner"` continues to show `confirmedBy` and formatted `timestamp`.
  - When `closure.cashVariance` is present: banner shows `data-cy="eod-closure-cash-variance"` with signed Euro format.
  - When `closure.stockItemsCounted` is present: banner shows `data-cy="eod-closure-stock-items"` with count.
  - When either field is absent (old closure records): that line is not rendered (graceful omission, no `—` placeholder).
  - TypeScript: no type errors accessing `closure.cashVariance` or `closure.stockItemsCounted` on `EodClosure`.
- **Validation contract (TC-XX):**
  - TC-01: `closure = { date, timestamp, confirmedBy, cashVariance: -3.5, stockItemsCounted: 12 }` → banner shows `€-3.50` and `12 items counted`.
  - TC-02: `closure = { date, timestamp, confirmedBy }` (legacy, no new fields) → banner shows `confirmedBy` and timestamp; no extra rows.
  - TC-03: `closure = { ..., cashVariance: 0, stockItemsCounted: 0 }` → banner shows `€0.00` and `0 items counted`.
  - TC-04: `closure = { ..., cashVariance: 5.5 }` but no `stockItemsCounted` → only cash variance row shown; no items row.
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-01 through TC-04 in `EodChecklistContent.test.tsx` (tests reference `data-cy="eod-closure-cash-variance"` and `data-cy="eod-closure-stock-items"` which don't exist yet).
  - Green: Inside the closure-banner branch, add `{typeof closure.cashVariance === "number" && <p data-cy="eod-closure-cash-variance">...}` and `{typeof closure.stockItemsCounted === "number" && <p data-cy="eod-closure-stock-items">...}`. Format `cashVariance` with sign and 2dp.
  - Refactor: Extract format helper `formatCashVariance(n: number): string` if not already done in TASK-03 scope.
- **Planning validation (required for M/L):** None: S-effort task.
- **Consumer tracing (new output):**
  - New output: `data-cy="eod-closure-cash-variance"` and `data-cy="eod-closure-stock-items"` elements.
  - Consumer: TASK-05 tests. All accounted for.
  - New behavior: `EodClosure.cashVariance` and `EodClosure.stockItemsCounted` now read by `EodChecklistContent`. Both are optional — absent fields handled by `typeof` guard. No silent fallback risk.
- **Scouts:** None: display-only; no write path involved.
- **Edge Cases & Hardening:**
  - `cashVariance` negative: signed format displays `€-X.XX`.
  - `stockItemsCounted` 0: `0 items counted` shown — valid state.
  - Old records (missing fields): `typeof` guard prevents rendering missing rows.
- **What would make this >=90%:** Already at 90%. Held-back test: display-only task with typed optional access — no single unknown drops below 80.
- **Rollout / rollback:**
  - Rollout: Display-only; no data written. Fully backward compatible.
  - Rollback: Remove the conditional display rows.
- **Documentation impact:** None.
- **Notes / references:** Existing banner: `EodChecklistContent.tsx` lines 65–83. `typeof x === "number"` check correctly handles `undefined` optional fields (does not render when absent).

---

### TASK-03: Compute variance in `EodChecklistContent` and render pre-close summary

- **Build evidence:** Complete (2026-03-01). Commit 4efba348e5. `limitToLast` raised to 20. `cashVariance` computed from closed today-shifts via `sameItalyDate(s.closedAt, new Date())`. `stockItemsCounted` via distinct itemId Set. `data-cy="eod-variance-summary"` renders when `allDone && !eodClosureLoading`. `confirmDayClosed` updated to pass `{ cashVariance, stockItemsCounted }`. Typecheck pass, lint 0 errors.
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — variance computation logic, `useTillShiftsData` limit bump, `confirmDayClosed` call updated, pre-close summary row rendered.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
- **Depends on:** TASK-02, TASK-04 (file overlap: `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`)
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — Component is 213 lines, well-understood. Computation uses data already in scope. Primary uncertainty: date-filtering logic for `shifts` (need to filter by today, since `limitToLast: 20` may include yesterday's shifts near midnight).
  - Approach: 85% — Computing in the component and passing to mutation is cleaner than computing in the hook; established pattern. Signed display format decided.
  - Impact: 85% — Pre-close summary directly addresses the gap; operationally useful for staff confirming the day.
- **Acceptance:**
  - `useTillShiftsData` called with `{ limitToLast: 20 }` (was 10).
  - `cashVariance` computed as sum of `closeDifference` across shifts that are `status === "closed"` and `closedAt` falls on today's Italy date. Missing `closeDifference` treated as 0.
  - `stockItemsCounted` computed as count of distinct `itemId` values from `entries` where `type === "count"` and `sameItalyDate(timestamp, new Date())`.
  - When `allDone && !eodClosureLoading`, a summary row `data-cy="eod-variance-summary"` renders above the confirm button, showing `cashVariance` formatted as signed Euro (e.g. `€+3.50` or `€-2.00`) and `stockItemsCounted` (e.g. `12 items counted`).
  - When loading (or `allDone` is false), the summary row is absent — omitted entirely, consistent with the omission-only fallback contract.
  - `confirmDayClosed` call updated to `confirmDayClosed({ cashVariance, stockItemsCounted })`.
- **Validation contract (TC-XX):**
  - TC-01: `shifts` has two closed today-shifts with `closeDifference: 2.00` and `closeDifference: -3.50`, all done → summary row shows `€-1.50` cash variance.
  - TC-02: `shifts` all closed with `closeDifference: undefined` → summary row shows `€0.00` (sum of zeros).
  - TC-03: `entries` has 3 distinct `itemId` count entries for today → summary row shows `3 items counted`.
  - TC-04: `allDone` is false → summary row absent.
  - TC-05: `eodClosureLoading` is true → summary row absent.
  - TC-06: `shifts` includes yesterday's closed shift (yesterday's `closedAt`) → excluded from `cashVariance` sum.
  - TC-07: confirm button clicked with `allDone` → `confirmDayClosed` called with computed `{ cashVariance, stockItemsCounted }` snapshot.
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-01 through TC-07 test cases to `EodChecklistContent.test.tsx`.
  - Green: (a) Change `useTillShiftsData({ limitToLast: 20 })`. (b) Add `cashVariance` derivation: `shifts.filter(s => s.status === "closed" && s.closedAt && sameItalyDate(s.closedAt, new Date())).reduce((sum, s) => sum + (s.closeDifference ?? 0), 0)`. (c) Add `stockItemsCounted` derivation: `new Set(entries.filter(e => e.type === "count" && sameItalyDate(e.timestamp, new Date())).map(e => e.itemId)).size`. (d) Update `confirmDayClosed` call. (e) Render `<div data-cy="eod-variance-summary">` before the confirm button when `allDone && !eodClosureLoading`.
  - Refactor: Extract variance computation to local helpers at top of component for readability. Ensure `sameItalyDate` usage matches existing pattern in component.
- **Planning validation (required for M/L):**
  - Checks run:
    - `TillShift` type confirmed to have `closedAt?: string` and `status?: "open" | "closed"` — from `tillShiftSchema.ts`.
    - `sameItalyDate` already imported and used in `EodChecklistContent` for `stockDone` and `floatDone` — correct import path confirmed.
    - `InventoryLedgerEntry.itemId: string` confirmed — from `inventoryLedgerSchema.ts`.
    - `entries` is already in scope as `const { entries, loading: stockLoading } = useInventoryLedger()` — no new hook needed.
  - Validation artifacts: File reads on `EodChecklistContent.tsx`, `tillShiftSchema.ts`, `inventoryLedgerSchema.ts`.
  - Unexpected findings: None.
- **Consumer tracing (new output):**
  - New output: `cashVariance` and `stockItemsCounted` are computed and passed to `confirmDayClosed`.
  - Consumer: `useEodClosureMutations.confirmDayClosed` — already updated in TASK-02 to accept snapshot. Safe.
  - New output: `data-cy="eod-variance-summary"` element rendered in DOM.
  - Consumer: Test TC-07 in TASK-05. All consumers accounted for.
- **Scouts:**
  - Shifts near midnight edge case: `closedAt` may fall on previous Italy-date. `sameItalyDate(s.closedAt, new Date())` correctly filters using Italy timezone — same utility already used elsewhere in component.
  - If `shifts` has no closed-today entries (e.g., no shifts at all), `cashVariance` = 0. Valid and expected.
- **Edge Cases & Hardening:**
  - Shifts with `closedAt` undefined: exclude from sum (`s.closedAt &&` guard).
  - `closeDifference` undefined: `?? 0` fallback.
  - `entries` empty: `stockItemsCounted` = 0 (valid — `allDone` would be false so confirm button absent, but computation is safe).
  - Floating-point display: format `cashVariance` to 2 decimal places with sign.
- **What would make this >=90%:** Confirming via CI that `sameItalyDate` with `TillShift.closedAt` works correctly at midnight boundary for Italy timezone (would require a CI run with the implementation).
- **Rollout / rollback:**
  - Rollout: UI-only addition; no data migration. `limitToLast` bump is safe.
  - Rollback: Revert component changes; limit reverts to 10.
- **Documentation impact:** None beyond inline code comments.
- **Notes / references:** `sameItalyDate` import already present at line 17 of `EodChecklistContent.tsx`. `extractItalyDate` / `getItalyIsoString` available from `dateUtils`.

---

### TASK-05: Tests — schema, mutation, component for all new paths

- **Build evidence:** Complete (2026-03-01). Commit 4efba348e5. Schema test file created (TC-01 through TC-04). Mutation test updated: TC-01 revised (snapshot payload), TC-02 unchanged, TC-03 (zero values), TC-04 (no-args absent-key assertion). Component test: TC-13 updated (snapshot assertion); TC-V01 through TC-V06 (pre-close summary); TC-B01 through TC-B04 (banner variance). Typecheck pass, lint 0 errors. Tests run in CI per testing-policy.
- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/reception/src/schemas/__tests__/eodClosureSchema.test.ts`; updated `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts`; updated `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/schemas/__tests__/eodClosureSchema.test.ts` (new)
  - `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts` (update)
  - `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` (update)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Schema test pattern established (18 schema test files in repo); component test pattern established (18 cases in existing test file). Mutation test update is mechanical.
  - Approach: 85% — Tests follow existing patterns in the file. Only open question is exact mock shape for new `confirmDayClosed` signature in component tests.
  - Impact: 85% — Tests gate regressions on both the write path and the display path.
- **Acceptance:**
  - `eodClosureSchema.test.ts` exists with TC-01 through TC-04 as specified in TASK-01.
  - `useEodClosureMutations.test.ts` TC-01 updated: asserts `set()` receives payload with `cashVariance` and `stockItemsCounted` when snapshot provided. TC-02 (no-op when no user) unchanged. New TC-03 and TC-04 added.
  - `EodChecklistContent.test.tsx` has new test cases for: pre-close summary row (TC-01 through TC-07 from TASK-03) and post-close banner variance display (TC-01 through TC-04 from TASK-04). Existing 18 tests continue to pass.
  - `pnpm typecheck && pnpm lint` passes on all changed files.
- **Validation contract (TC-XX):**
  - Schema TCs: As per TASK-01 acceptance (TC-01 through TC-04).
  - Mutation TCs: TC-01 updated (full payload with new fields); TC-02 unchanged; TC-03 (zero values); TC-04 (no args, original payload shape).
  - Component TCs for pre-close: TC-01 through TC-07 from TASK-03.
  - Component TCs for post-close banner: TC-01 through TC-04 from TASK-04.
- **Execution plan:** Red → Green → Refactor
  - Red: All new TC stubs written and failing (or TODO stubs for new TCs, updating existing TCs to reflect new API shape).
  - Green: Implementation already complete (TASK-01 through TASK-04 done). Running tests should now pass.
  - Refactor: Ensure `beforeEach` mock resets cover new `confirmDayClosed` mock signature. Remove any redundant mock setup.
- **Planning validation (required for M/L):**
  - Checks run:
    - Test file for schema: no `eodClosureSchema.test.ts` exists — confirmed by fact-find. New file required.
    - `EodChecklistContent.test.tsx` mock for `useEodClosureMutations` uses `confirmDayClosedMock = jest.fn()`. Signature change: mock will need to accept optional snapshot arg. `jest.fn()` accepts any args by default — no mock shape change required, but assertion in TC-01 must use `toHaveBeenCalledWith({ cashVariance: ..., stockItemsCounted: ... })`.
    - `data-cy` attribute names used in tests must match implementation: `eod-variance-summary`, `eod-closure-cash-variance`, `eod-closure-stock-items` — these are defined in TASK-03 and TASK-04.
  - Validation artifacts: File reads on `EodChecklistContent.test.tsx`, `useEodClosureMutations.test.ts`.
  - Unexpected findings: `jest.setup.ts` uses `testIdAttribute: "data-cy"` — confirmed; all `getByTestId` calls use `data-cy` values.
- **Consumer tracing (new output):**
  - New output: new test file `eodClosureSchema.test.ts`.
  - Consumer: CI test runner — no dependencies.
  - Modified behavior: `useEodClosureMutations.test.ts` TC-01 assertion updated. All callers addressed.
- **Scouts:** None: test-only task.
- **Edge Cases & Hardening:**
  - Mock for `useEodClosureMutations` in component test already uses `jest.fn()` — accepts any args; no mock shape issue.
  - `confirmDayClosedMock` assertion pattern: `expect(confirmDayClosedMock).toHaveBeenCalledWith({ cashVariance: expect.any(Number), stockItemsCounted: expect.any(Number) })` for precise snapshot.
- **What would make this >=90%:** Confirming CI passes after implementation — test run is by definition the validation gate.
- **Rollout / rollback:**
  - Rollout: Test files only; no production impact.
  - Rollback: Revert test changes.
- **Documentation impact:** None.
- **Notes / references:** `jest.setup.ts` at `apps/reception/src/jest.setup.ts` configures `testIdAttribute: "data-cy"`. CI command: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=eodClosure|EodChecklist --no-coverage`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend `eodClosureSchema` | Yes | None | No |
| TASK-02: Update `useEodClosureMutations` | Yes — TASK-01 schema complete | None | No |
| TASK-04: Update "day closed" banner | Yes — TASK-01 schema complete | None | No |
| TASK-03: Compute variance in `EodChecklistContent` | Yes — TASK-02 mutation signature ready; TASK-04 file-overlap precondition met | [Minor] Date-filter for shifts uses `sameItalyDate(s.closedAt, new Date())` — `closedAt` is optional; guard required. Addressed in execution plan. | No |
| TASK-05: Tests | Yes — TASK-04 all implementation complete | [Minor] `EodChecklistContent.test.tsx` mock for `confirmDayClosed` must match new signature. `jest.fn()` accepts any args — no shape issue; assertion updated. | No |

No Critical simulation findings. No waiver required.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `closeDifference` absent on some closed shifts | Low | Low | `?? 0` fallback in summation; effect is `cashVariance` underestimates on those shifts |
| `useTillShiftsData` limit 20 still insufficient | Very low | Low | BRIK single-terminal; 20 shifts/day is ~4x realistic max |
| Midnight boundary: yesterday's closed shifts counted in today's `cashVariance` | Low | Moderate | `sameItalyDate(s.closedAt, new Date())` filter guards this; same utility used for `stockDone` and `floatDone` |
| Old closure records render broken UI | None | None | `typeof` guard in TASK-04 gracefully omits absent fields |
| CI test failure on updated TC-01 (mutation test) | Certain | Minor | TC-01 intentionally updated as part of TASK-05; this is expected |

## Observability

- Logging: None: existing toast error path in `useEodClosureMutations` covers write failures.
- Metrics: None: no new metrics hooks needed.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `eodClosureSchema` accepts and rejects new optional fields correctly.
- [ ] `confirmDayClosed({ cashVariance, stockItemsCounted })` writes enriched record to `eodClosures/<date>`.
- [ ] Pre-close summary row (`data-cy="eod-variance-summary"`) renders with correct values when `allDone` is true.
- [ ] "Day closed" banner shows `cashVariance` and `stockItemsCounted` from stored closure when present; omits rows when absent.
- [ ] All 18 existing `EodChecklistContent` tests continue to pass.
- [ ] New schema, mutation, and component tests pass in CI.
- [ ] `pnpm typecheck && pnpm lint` passes on all changed files.

## Decision Log

- 2026-03-01: Chose per-shift `closeDifference` summation over `useEndOfDayReportData` — avoids TillDataContext/SafeDataContext provider refactor; data already in scope.
- 2026-03-01: Chose typed snapshot object `{ cashVariance?, stockItemsCounted? }` over positional optional args — extensible and type-safe.
- 2026-03-01: Display format: signed number (positive = over, negative = short), 2dp, Euro prefix — consistent with stored `closeDifference` convention.
- 2026-03-01: `safeVariance` and `keycardVariance` explicitly deferred — require provider refactor not in scope.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight |
|---|---|---|---|
| TASK-01 | 90% | S=1 | 90 |
| TASK-02 | 90% | S=1 | 90 |
| TASK-03 | 85% | M=2 | 170 |
| TASK-04 | 90% | S=1 | 90 |
| TASK-05 | 85% | M=2 | 170 |

Overall-confidence = (90+90+170+90+170) / (1+1+2+1+2) = 610 / 7 = **87%**
