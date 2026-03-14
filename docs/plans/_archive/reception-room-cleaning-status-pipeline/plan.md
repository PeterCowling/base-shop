---
Type: Plan
Status: Archived
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-room-cleaning-status-pipeline
Dispatch-ID: IDEA-DISPATCH-20260314155800-0001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: weighted average by effort size (S=1, M=2); no additional bias applied
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-room-cleaning-status-pipeline/analysis.md
---

# Room Cleaning Status Pipeline Plan

## Summary

Connects the prepare dashboard and checkins screen via the existing `/roomStatus` Firebase path. Cleaning staff get a per-room "Mark Clean" button (today-only) on the prepare dashboard. Reception staff get a per-row cleanliness pill on the checkins table. The auto-sync guard bug is patched first so manual clean signals from occupied rooms are never silently overwritten. All changes are additive; no new Firebase paths or npm dependencies are required.

## Active tasks

- [ ] TASK-01: Expose `roomStatusMap` from `usePrepareDashboardData()` return value
- [ ] TASK-02: Patch auto-sync guard in `usePrepareDashboard.ts`
- [ ] TASK-03: Mark Clean button on prepare dashboard
- [ ] TASK-04: `useRoomStatusData()` subscription at `CheckinsTable` level + prop-threading
- [ ] TASK-05: Cleanliness pill + `TableHeader` 8th column + `colSpan` update
- [ ] TASK-06: Tests (guard, button, pill, prop-threading, header snapshot)

## Goals

- Cleaning staff can mark a room as cleaned on the prepare dashboard (today-only)
- Manual clean signals are never overwritten by the auto-sync for occupied rooms
- Reception staff see a per-room cleanliness pill on the checkins screen
- No new Firebase paths or npm dependencies

## Non-goals

- Global "Rooms Ready" toggle replacement
- "Mark as dirty" manual button
- Per-occupant/per-bed status
- Historical cleaning audit log

## Constraints & Assumptions

- Constraints:
  - `SingleRoomStatus` Zod schema must remain backward compatible
  - `/roomStatus/index_<room>` is the write target — no new paths
  - UI must use reception design system tokens (Tailwind v4 semantic tokens)
  - Tests run in CI only — validate by pushing to dev branch (testing policy)
  - Mark Clean button is today-only: `/roomStatus` is a live record with no date partition; historical writes would corrupt current-day status
- Assumptions:
  - `roomAllocated` in `CheckInRow` holds raw room number (e.g. "3") → Firebase key `index_3`
  - `useFirebaseSubscription` creates one `onValue` listener per hook instance — no React-layer deduplication
  - `usePrepareDashboardData()` currently returns an inferred object (no explicit interface); adding `roomStatusMap` is additive and does not break callers
  - Pre-existing state: `TableHeader.tsx` currently has 7 columns but `TableHeader.test.tsx` expects 8 (including an "Email Booking" column that no longer exists in the file) — TASK-05 adds "Room Ready" as the 8th column; TASK-06 reconciles the test

## Inherited Outcome Contract

- **Why:** Cleaning staff have no way to signal when a room is done. Reception staff checking guests in are flying blind on whether the room is actually ready. Fixing this means both teams can do their jobs without phone calls or guesswork.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cleaning staff can mark individual rooms as cleaned on the prepare dashboard. The checkins screen shows a per-room cleanliness indicator. Reception staff can see at a glance whether a room is ready before a guest reaches the desk.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/reception-room-cleaning-status-pipeline/analysis.md`
- Selected approach inherited:
  - Option A: Full end-to-end pipeline in a single delivery (mark-clean write + auto-sync guard fix + checkins read)
- Key reasoning used:
  - Options B (prepare-only) and C (checkins-only) each deliver half of a pipeline that only works end-to-end
  - `/roomStatus` path and `useRoomStatusData` / `useRoomStatusMutations` hooks already exist; this is new usage, not new infrastructure
  - Mark Clean button must be today-only; `/roomStatus` has no date partition

## Selected Approach Summary

- What was chosen: Full pipeline — Mark Clean button on prepare dashboard + auto-sync guard patch + per-room cleanliness pill on checkins screen
- Why planning is not reopening option selection: Analysis resolved all sub-architecture choices (subscription placement, prepare-side wiring, today-only gating, await-not-optimistic UX) and closed all open questions with defaults

## Fact-Find Support

- Supporting brief: `docs/plans/reception-room-cleaning-status-pipeline/fact-find.md`
- Evidence carried forward:
  - `usePrepareDashboardData()` at line 125 already holds `roomStatusMap` — expose it in return value
  - Auto-sync `else` block at line 419–428 is the stayover overwrite bug — guard with `typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime`
  - `saveRoomStatus` signature: `(roomNumber: string, statusData: Partial<SingleRoomStatus>)` — call with `{ clean: "Yes", cleaned: getItalyIsoString() }`
  - `showToast` utility at `apps/reception/src/utils/toastUtils.ts` — already used in `CheckinsTable.tsx`
  - `view/BookingRow.tsx` notes-row has `colSpan={7}` — must be updated to `colSpan={8}` when 8th column added
  - `TableHeader.tsx` currently has 7 columns (snapshot has 8 including "Email Booking" which was removed — pre-existing test mismatch)

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Expose `roomStatusMap` from `usePrepareDashboardData()` return | 90% | S | Complete (2026-03-14) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Patch auto-sync guard in `usePrepareDashboard.ts` | 90% | S | Complete (2026-03-14) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Mark Clean button on prepare dashboard | 85% | M | Complete (2026-03-14) | TASK-01, TASK-02 | TASK-06 |
| TASK-04 | IMPLEMENT | `useRoomStatusData()` at `CheckinsTable` level + prop-threading | 85% | M | Complete (2026-03-14) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Cleanliness pill + TableHeader 8th column + colSpan | 85% | M | Complete (2026-03-14) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Tests (guard, button, pill, prop-threading, header snapshot) | 80% | M | Complete (2026-03-14) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Mark Clean button per row in `CleaningPriorityTable`; cleanliness pill in `view/BookingRow` 8th cell; "Room Ready" header in `TableHeader` | TASK-03, TASK-05 | Chip reused from `CleaningPriorityTable`; semantic tokens `bg-success-main`/`bg-error-main` |
| UX / states | Button disabled when `!isToday`; button disabled during write; error toast on failure; already-clean state visible in pill | TASK-03, TASK-05 | Await-not-optimistic; `showToast` on error |
| Security / privacy | N/A — same Firebase auth as all reception staff; no PII in room status | - | Acceptable for hostel context |
| Logging / observability / audit | `try/catch` + `showToast("Failed to mark room as clean", "error")` in `PrepareDashboard` handler | TASK-03 | `saveRoomStatus` already rethrows; toast wraps it |
| Testing / validation | Guard unit test; button interaction test + mock update; cleanliness pill test; prop-threading test; TableHeader snapshot update | TASK-06 | 5 test files; TableHeader test reconciles pre-existing Email Booking mismatch |
| Data / contracts | `SingleRoomStatus` schema unchanged; `usePrepareDashboardData()` return additive; guard: `clean === "Yes" && typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime` | TASK-01, TASK-02 | No Zod schema change |
| Performance / reliability | Single `useRoomStatusData()` at `CheckinsTable` level; prop-thread through `CheckinsTableView → BookingRow`; no per-row listeners | TASK-04 | `useRoomStatusMutations()` has no subscription overhead; calling it in `PrepareDashboard` (TASK-03) does not create a duplicate listener — `usePrepareDashboardData()` only calls it for internal write path; the "single subscription" constraint applies to `useRoomStatusData()` only |
| Rollout / rollback | Cloudflare Worker hot-swap; no DB migration; Firebase writes idempotent; no feature flag needed | - | Deploy + revert is sufficient rollback |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | All independent; TASK-01/02 are S-effort; TASK-04 is checkins-side wiring |
| 2 | TASK-03 | TASK-01, TASK-02 | Prepare dashboard button depends on guard fix and return value |
| 3 | TASK-05 | TASK-04 | Checkins pill depends on prop-threading |
| 4 | TASK-06 | TASK-01–TASK-05 | All tests after all implementation |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Cleaning staff workflow | Cleaning staff finishes cleaning a room | 1. Staff opens `/prepare-dashboard` for today; 2. Each room row shows "Mark Clean" button (disabled for past/future dates); 3. Staff clicks button → button disables during write → Firebase `/roomStatus/index_<room>` updated with `{ clean: "Yes", cleaned: <ISO timestamp> }` → chip refreshes to "Clean" in real-time; 4. If write fails: toast error shown, chip stays "Dirty" | TASK-02 (guard), TASK-03 (button) | Error path: network failure shows toast; room stays "Dirty" |
| Auto-sync (stayover guard) | `usePrepareDashboard` `useEffect` fires when `selectedDate === today` | For each room: if `clean === "Yes"` AND `typeof cleaned === "string"` AND `toEpochMillis(cleaned) >= todayTime` → skip dirty overwrite; stayover clean survives until midnight | TASK-02 | Occupants who check in after manual clean still show as Dirty on next auto-sync cycle — this is acceptable (manual re-clean may be needed) |
| Reception checkins view | Guest approaches desk for check-in | 1. Reception opens `/checkin`; 2. Per-row "Room Ready" pill visible in 8th column for each booking row; 3. Green "Clean" or red "Dirty" derived from `/roomStatus/index_<roomAllocated>`; 4. Single Firebase subscription at `CheckinsTable` level; all rows read from shared `roomStatusMap` prop | TASK-04 (subscription), TASK-05 (pill) | `roomAllocated` undefined → pill renders nothing (graceful); `colSpan` update required alongside header |

## Tasks

---

### TASK-01: Expose `roomStatusMap` from `usePrepareDashboardData()` return value

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts` return value update
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts`, `apps/reception/src/components/prepare/__tests__/PrepareDashboard.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - One-line addition to an existing return statement; hook already holds `roomStatusMap` at line 125; return type is inferred (additive)
  - Approach: 95% - No alternatives; purely additive
  - Impact: 90% - Enables TASK-03 access and test mock consistency; no consumer breakage
- **Acceptance:**
  - [ ] `usePrepareDashboardData()` return value includes `roomStatusMap: Record<string, SingleRoomStatus> | null`
  - [ ] `defaultPrepareData()` in `PrepareDashboard.test.tsx` includes `roomStatusMap: null` field
  - [ ] TypeScript typecheck passes on the hook and its consumer `PrepareDashboard.tsx`
- **Engineering Coverage:**
  - UI / visual: N/A - Hook return change only; no visual output
  - UX / states: N/A - No UI
  - Security / privacy: N/A - No change to auth or data exposure
  - Logging / observability / audit: N/A - No new logging path
  - Testing / validation: Required - Test mock in `PrepareDashboard.test.tsx` must include `roomStatusMap` field; covered by TASK-06 but mock update must land in TASK-01 to avoid type errors in subsequent tasks
  - Data / contracts: Required - `usePrepareDashboardData()` return type; additive; `roomStatusMap` is already `Record<string, SingleRoomStatus> | null` from `useRoomStatusData()`
  - Performance / reliability: N/A - No new subscription; hook already calls `useRoomStatusData()` internally
  - Rollout / rollback: N/A - No deploy change; additive return field
- **Validation contract (TC-01):**
  - TC-01: `renderHook(() => usePrepareDashboardData("2024-06-02"))` → result includes `roomStatusMap` field equal to `statusResult.roomStatusMap`
  - TC-02: `defaultPrepareData()` mock return in `PrepareDashboard.test.tsx` → includes `roomStatusMap: null`
- **Execution plan:** Red → Green → Refactor
  - Red: Tests fail because `roomStatusMap` is absent from return type
  - Green: Add `roomStatusMap` to the return object in `usePrepareDashboard.ts`; update mock in `PrepareDashboard.test.tsx`
  - Refactor: None needed
- **Scouts:** None: return type is inferred; no interface to update
- **Edge Cases & Hardening:** If `useRoomStatusData()` returns `null` (loading/error), `roomStatusMap` is `null` — consumer must handle
- **What would make this >=90%:** Already at 90%; only minor edge case from above
- **Rollout / rollback:**
  - Rollout: Deployed via reception app Worker deploy
  - Rollback: Revert deploy
- **Documentation impact:** None
- **Notes / references:** `roomStatusMap` is already declared at line 125 of `usePrepareDashboard.ts`; only the return statement needs to change

---

### TASK-02: Patch auto-sync guard in `usePrepareDashboard.ts`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts` auto-sync `useEffect` guard
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Bug location confirmed (line 419–428 `else` block); fix pattern already used in same file at line 314–317 (`toEpochMillis` comparison); string narrowing required before call
  - Approach: 95% - Single correct approach; same pattern already in codebase
  - Impact: 90% - Correctness fix for stayover cleans; no side effects on clean rooms or new-dirty rooms
- **Acceptance:**
  - [ ] When `dbStatus.clean === "Yes"`, `typeof dbStatus.cleaned === "string"`, and `toEpochMillis(dbStatus.cleaned) >= todayTime`: auto-sync does NOT call `saveRoomStatus` to set `clean: false`
  - [ ] When `dbStatus.clean === "Yes"` but `cleaned` is stale (< todayTime): auto-sync STILL overwrites to `clean: false` (existing behaviour preserved)
  - [ ] When `dbStatus.clean === false` and room is dirty: auto-sync behaviour unchanged
  - Expected user-observable behavior:
    - [ ] Cleaning staff marks a room clean while a guest is still checked in → `clean: "Yes"` persists through page reload (no overwrite)
    - [ ] At midnight, stale `cleaned` timestamps trigger normal dirty sync on next day
- **Engineering Coverage:**
  - UI / visual: N/A - Hook logic only
  - UX / states: N/A - Behavioural fix; no UI
  - Security / privacy: N/A - No change
  - Logging / observability / audit: N/A - Existing `console.error` calls in effect unchanged
  - Testing / validation: Required - Guard unit test in `usePrepareDashboard.test.ts`; covered by TASK-06
  - Data / contracts: Required - `typeof dbStatus.cleaned === "string"` narrowing required; `toEpochMillis()` expects string input; `cleaned` is `string | false | undefined` per schema
  - Performance / reliability: N/A - No performance impact; guard is an `if` check with no I/O
  - Rollout / rollback: N/A - No deploy change; pure logic fix
- **Validation contract (TC-02):**
  - TC-01: `roomStatusMap` has `index_3: { clean: "Yes", cleaned: "2024-06-02T10:00:00Z" }`, `occupantSaysDirty = true`, `todayTime = 2024-06-02T00:00:00Z epoch` → `saveRoomStatus` NOT called for room 3
  - TC-02: `roomStatusMap` has `index_3: { clean: "Yes", cleaned: "2024-06-01T10:00:00Z" }` (yesterday), `occupantSaysDirty = true` → `saveRoomStatus` IS called (stale clean)
  - TC-03: `roomStatusMap` has `index_3: { clean: "Yes", cleaned: false }` → `typeof cleaned !== "string"` → guard does not apply; `saveRoomStatus` IS called (missing timestamp treated as stale)
- **Execution plan:** Red → Green → Refactor
  - Red: Write failing test asserting `saveRoomStatus` not called when `clean === "Yes"` and `cleaned` is today's timestamp
  - Green: In the `else` block (line ~419), before `if (dbStatus.clean === "Yes")` write to `clean: false`, add early return: `if (dbStatus.clean === "Yes" && typeof dbStatus.cleaned === "string" && !Number.isNaN(toEpochMillis(dbStatus.cleaned)) && toEpochMillis(dbStatus.cleaned) >= todayTime) { return; }`
  - Refactor: None needed
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: `toEpochMillis` and `todayTime` patterns confirmed at lines 314–317 of same file
- **Edge Cases & Hardening:** `cleaned === false` → `typeof cleaned !== "string"` → guard skipped (falls through to existing overwrite); `cleaned === undefined` → same; `Number.isNaN(toEpochMillis(cleaned))` → guard skipped
- **What would make this >=90%:** Already at 90%; limited only by test coverage being deferred to TASK-06
- **Rollout / rollback:**
  - Rollout: Deployed via reception app Worker deploy
  - Rollback: Revert deploy
- **Documentation impact:** None
- **Notes / references:** Bug location: `usePrepareDashboard.ts` lines 419–428; existing epoch-compare pattern at lines 314–317

---

### TASK-03: Mark Clean button on prepare dashboard

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/prepare/CleaningPriorityTable.tsx` (button UI), `apps/reception/src/components/prepare/PrepareDashboard.tsx` (handler + mutation)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/prepare/CleaningPriorityTable.tsx`, `apps/reception/src/components/prepare/PrepareDashboard.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - Button placement in existing table pattern; `useRoomStatusMutations` and `showToast` already in codebase; today-only gate via `isTodayFlag` already computed in `PrepareDashboard`
  - Approach: 90% - Clean pattern; `useCallback` wrapping required for memo compliance
  - Impact: 85% - Depends on TASK-02 guard being in place; without guard, button-written values would be overwritten
- **Acceptance:**
  - [ ] A "Mark Clean" button appears in each prepare dashboard row
  - [ ] Button is disabled when `isToday` is false
  - [ ] Button is disabled while write is in progress (loading state)
  - [ ] Clicking button calls `saveRoomStatus("index_<roomNumber>", { clean: "Yes", cleaned: getItalyIsoString() })`
  - [ ] On success: room chip refreshes to "Clean" (via Firebase subscription refresh)
  - [ ] On failure: `showToast("Failed to mark room as clean", "error")` shown
  - Expected user-observable behavior:
    - [ ] Viewing today's prepare dashboard: "Mark Clean" button visible and enabled in each row
    - [ ] Viewing yesterday's prepare dashboard: "Mark Clean" button visible but disabled (greyed out)
    - [ ] Clicking "Mark Clean" for Room 3: all room buttons disable (global write lock); Room 3 chip changes to "Clean" on Firebase callback; all buttons re-enable
    - [ ] Network failure: all buttons re-enable; red toast appears
- **Engineering Coverage:**
  - UI / visual: Required - New column "Mark Clean" in `CleaningPriorityTable`; button styled with DS tokens; disabled state uses opacity/cursor-not-allowed; `memo` wrapper preserved
  - UX / states: Required - Disabled on non-today; disabled during write; error toast on failure; `useCallback` on handler to avoid breaking memo
  - Security / privacy: N/A - Firebase auth guards write; no PII
  - Logging / observability / audit: Required - `try/catch` + `showToast` in handler; `saveRoomStatus` rethrows
  - Testing / validation: Required - Button interaction test in `PrepareDashboard.test.tsx`; covered in TASK-06
  - Data / contracts: Required - Write payload: `{ clean: "Yes", cleaned: getItalyIsoString() }`; `roomNumber` → `"index_<roomNumber>"` key construction
  - Performance / reliability: Required - `handleMarkClean` wrapped in `useCallback((roomNumber: string) => ..., [saveRoomStatus, setIsWriting])`; global `useState<boolean>` (`isWriting`) in `PrepareDashboard`; button `disabled={isWriting || !isToday}`; **global lock is an explicit product decision** for a single-operator cleaning tool; `string | null` per-room state is not used (would require `Set<string>` to be race-condition safe; global lock is simpler and correct here)
  - Rollout / rollback: Required - No feature flag; button is visible immediately on deploy; rollback by revert deploy
- **Validation contract (TC-03):**
  - TC-01: Render `PrepareDashboard` with `isToday=true`, room "3" in data → button visible and enabled
  - TC-02: Render `PrepareDashboard` with `isToday=false` → button is disabled
  - TC-03: Click button for room "3" → `saveRoomStatus("index_3", { clean: "Yes", cleaned: <iso> })` called
  - TC-04: `saveRoomStatus` rejects → `showToast("Failed to mark room as clean", "error")` called
- **Execution plan:** Red → Green → Refactor
  - Red: Add `onMarkClean` prop to `CleaningPriorityTableProps`; add test asserting button visible
  - Green:
    1. `CleaningPriorityTable.tsx`: add `onMarkClean: (roomNumber: string) => void` and `isWriting: boolean` props; add 5th `<TableHead>` column "Mark Clean"; add `<Button>` per row with `disabled={isWriting || !isToday}` and `onClick={() => onMarkClean(row.roomNumber)}`; global write lock is intentional — this is a single-operator tool; concurrent writes do not occur in practice with ~10 rooms
    2. `PrepareDashboard.tsx`: add imports (`useRoomStatusMutations`, `getItalyIsoString`, `showToast`); call `useRoomStatusMutations()`; create `handleMarkClean` with `useState<boolean>` (`isWriting`) for global write lock; inside handler: `setIsWriting(true)` before write, `setIsWriting(false)` in finally block; pass `onMarkClean={handleMarkClean}` and `isWriting={isWriting}` to `CleaningPriorityTable`; **decision: global lock chosen explicitly** — all buttons disable during the single Firebase write; re-enable on completion or error; this is correct for a one-person cleaning-staff workflow
  - Refactor: Ensure `handleMarkClean` is `useCallback` to avoid breaking `CleaningPriorityTable` memo
- **Planning validation:**
  - Checks run: Read `PrepareDashboard.tsx`, `CleaningPriorityTable.tsx`, `useRoomStatusMutations.ts`, `toastUtils.ts`
  - Validation artifacts: `PrepareDashboard.tsx` already imports `isToday as isTodayDate`; `isTodayFlag` computed at line 115; `CleaningPriorityTableProps` interface confirmed at `CleaningPriorityTable.tsx` lines 27-30
  - Unexpected findings: `getItalyIsoString` is NOT currently imported in `PrepareDashboard.tsx` — must add to `dateUtils` import; `showToast` is NOT currently imported in `PrepareDashboard.tsx` — must add import
- **Scouts:** None: `saveRoomStatus` signature confirmed; `showToast` confirmed at `toastUtils.ts`
- **Edge Cases & Hardening:** `roomNumber` must be passed as-is to `handleMarkClean`; Firebase key construction `"index_${roomNumber}"` happens in the handler; global write lock (`isWriting`) prevents duplicate writes on double-click; global lock disables all row buttons during write — intentional for single-operator workflow; all buttons re-enable in `finally` block regardless of success/error
- **What would make this >=90%:** Completed prior test pass confirming `useRoomStatusMutations` mock pattern in `PrepareDashboard.test.tsx`
- **Rollout / rollback:**
  - Rollout: Deploy reception Worker; button visible immediately; TASK-02 guard must be deployed first
  - Rollback: Revert deploy
- **Documentation impact:** None
- **Notes / references:** `getItalyIsoString` already in `dateUtils`; `isToday` already imported in `PrepareDashboard.tsx` as `isTodayDate`; `isTodayFlag` computed at line 115 from `selectedDate`

---

### TASK-04: `useRoomStatusData()` at `CheckinsTable` level + prop-threading

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `CheckinsTable.tsx` (controller), `view/CheckinsTable.tsx` (view), `BookingRow.tsx` (container), `view/BookingRow.tsx` (view)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/CheckinsTable.tsx`, `apps/reception/src/components/checkins/view/CheckinsTable.tsx`, `apps/reception/src/components/checkins/BookingRow.tsx`, `apps/reception/src/components/checkins/view/BookingRow.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - 4 files; all are prop-threading additions; controller/view pattern well-established
  - Approach: 90% - Resolved in analysis; single subscription at controller level is the correct approach
  - Impact: 85% - No visual change yet; data available for TASK-05 to consume
- **Acceptance:**
  - [ ] `CheckinsTable.tsx` calls `useRoomStatusData()` and passes `roomStatusMap` to `CheckinsTableView`
  - [ ] `view/CheckinsTable.tsx` `Props` interface includes `roomStatusMap: Record<string, SingleRoomStatus> | null`
  - [ ] `BookingRow.tsx` `BookingRowProps` interface includes `roomStatusMap?: Record<string, SingleRoomStatus> | null`
  - [ ] `view/BookingRow.tsx` `BookingRowViewProps` interface includes `roomStatusMap?: Record<string, SingleRoomStatus> | null`
  - [ ] TypeScript typecheck passes on all 4 files
  - [ ] No per-row `useRoomStatusData()` calls anywhere in the checkins component tree
- **Engineering Coverage:**
  - UI / visual: N/A - No visual change; prop threading only
  - UX / states: N/A - Data wiring; TASK-05 handles visual states
  - Security / privacy: N/A - No new auth surface
  - Logging / observability / audit: N/A - No logging change
  - Testing / validation: Required - `CheckinsTable.test.tsx` needs `useRoomStatusData` mock added; covered in TASK-06
  - Data / contracts: Required - `SingleRoomStatus` import needed in `view/CheckinsTable.tsx`, `BookingRow.tsx`, `view/BookingRow.tsx`; type from `../../types/hooks/data/roomStatusData`
  - Performance / reliability: Required - Single subscription at `CheckinsTable` level; verify no per-row hook calls in the component tree; `roomStatusMap` is `null` during Firebase loading — consumers must handle
  - Rollout / rollback: N/A - No visible change; no deploy risk
- **Validation contract (TC-04):**
  - TC-01: `CheckinsTable` renders with mocked `useRoomStatusData` returning `{ roomStatusMap: { index_3: { clean: "Yes" } } }` → `roomStatusMap` prop present in rendered `CheckinsTableView`
  - TC-02: `view/BookingRow` receives `roomStatusMap` prop with `index_3` data → prop available for TASK-05 consumption
- **Execution plan:** Red → Green → Refactor
  - Red: Add `roomStatusMap` prop to `CheckinsTableView.Props`; TypeScript errors appear downstream
  - Green: 1. Add `useRoomStatusData` import + call in `CheckinsTable.tsx`; pass `roomStatusMap` to `CheckinsTableView`. 2. Add `roomStatusMap` to `view/CheckinsTable.tsx` Props; pass to each `BookingRow`. 3. Add to `BookingRowProps`; pass to `BookingRowView`. 4. Add to `BookingRowViewProps`.
  - Refactor: Confirm no duplicate subscriptions via grep for `useRoomStatusData` in `BookingRow.tsx` and `view/BookingRow.tsx`
- **Planning validation:**
  - Checks run: Read `CheckinsTable.tsx`, `view/CheckinsTable.tsx`, `BookingRow.tsx`, `view/BookingRow.tsx`
  - Validation artifacts: `SingleRoomStatus` type confirmed in `../../types/hooks/data/roomStatusData`; import path verified in `usePrepareDashboard.ts` line 8; `BookingRowViewProps` confirmed at `view/BookingRow.tsx` lines 17-32; `view/CheckinsTable.tsx` Props confirmed at lines 21-50
  - Unexpected findings: `view/CheckinsTable.tsx` already has `bookingStatuses: Record<string, string | undefined>` prop pattern — `roomStatusMap` follows same pattern
- **Scouts:** None: pattern confirmed from existing `bookingStatuses` prop threading
- **Edge Cases & Hardening:** `roomStatusMap` can be `null` during Firebase loading; consumers in TASK-05 must use optional chaining `roomStatusMap?.[key]`
- **What would make this >=90%:** Completed passing test from TASK-06 confirming prop reaches `view/BookingRow`
- **Rollout / rollback:**
  - Rollout: Deploy reception Worker; no visible change until TASK-05
  - Rollback: Revert deploy
- **Documentation impact:** None
- **Notes / references:** `useRoomStatusData` path: `apps/reception/src/hooks/data/useRoomStatus.ts`; import path from `CheckinsTable.tsx` would be `../../hooks/data/useRoomStatus`

---

### TASK-05: Cleanliness pill + `TableHeader` 8th column + `colSpan` update

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/checkins/view/BookingRow.tsx`, `apps/reception/src/components/checkins/TableHeader.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/view/BookingRow.tsx`, `apps/reception/src/components/checkins/TableHeader.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - `Chip` pattern confirmed in `CleaningPriorityTable.tsx`; `colSpan` update is mechanical; `TableHeader` change follows established pattern
  - Approach: 85% - 8th cell chosen over inline (cleaner UX); `TableHeader` pre-existing test mismatch known and handled in TASK-06
  - Impact: 85% - Visual change is straightforward; risk is `colSpan` mismatch if notes-row not updated
- **Acceptance:**
  - [ ] `TableHeader.tsx` has an 8th `<TableHead>` with title "Room Ready" and an appropriate Lucide icon (e.g. `CheckCircle`)
  - [ ] `view/BookingRow.tsx` has an 8th `<TableCell>` showing a green "Clean" chip or red "Dirty" chip based on `roomStatusMap`
  - [ ] When `roomAllocated` is undefined or `roomStatusMap` has no entry for the room, 8th cell is empty (no chip, no error)
  - [ ] Notes-row `colSpan` updated from 7 to 8
  - Expected user-observable behavior:
    - [ ] Checkins view shows "Room Ready" icon column to the right of "Document Insert"
    - [ ] For a room that has been marked clean: green "Clean" chip in that booking's row
    - [ ] For a room that is dirty: red "Dirty" chip in that booking's row
    - [ ] For a booking with no room allocated: 8th cell is empty
    - [ ] Notes row (when open) spans all 8 columns with no visual gap
  - Post-build QA:
    - Run `lp-design-qa` on `/checkin` route
    - Run `tools-ui-contrast-sweep` on `/checkin` route
    - Run `tools-ui-breakpoint-sweep` on `/checkin` route at 768px, 1024px, 1280px
    - Auto-fix any Critical/Major findings before marking TASK-05 complete
- **Engineering Coverage:**
  - UI / visual: Required - `TableHead` title "Room Ready" + icon; `TableCell` with inline cleanliness chip; semantic tokens `bg-success-main text-success-fg` (Clean) / `bg-error-main text-danger-fg` (Dirty); no design system component added — inline span pattern from `CleaningPriorityTable`
  - UX / states: Required - Empty state when `roomAllocated` undefined or status unknown; clean/dirty chip states; no loading state (subscription is always active before render; `null` map = empty)
  - Security / privacy: N/A - No new data exposed
  - Logging / observability / audit: N/A - No logging
  - Testing / validation: Required - Pill render test and header snapshot in TASK-06
  - Data / contracts: Required - `roomAllocated` is raw room number (e.g. "3") → Firebase key `"index_3"`; `roomStatusMap?.[`index_${booking.roomAllocated}`]`; `clean === "Yes"` means Clean
  - Performance / reliability: Required - `roomStatusMap` already subscribed in TASK-04; no new subscription; optional chaining handles null/undefined
  - Rollout / rollback: Required - `colSpan` update must ship together with header update; partial deploy would break table visual layout; both are in same PR
- **Validation contract (TC-05):**
  - TC-01: `roomStatusMap = { index_3: { clean: "Yes" } }`, `booking.roomAllocated = "3"` → green "Clean" chip rendered in 8th cell
  - TC-02: `roomStatusMap = { index_3: { clean: false } }`, `booking.roomAllocated = "3"` → red "Dirty" chip rendered in 8th cell
  - TC-03: `roomStatusMap = {}`, `booking.roomAllocated = "3"` → 8th cell is empty (no chip)
  - TC-04: `booking.roomAllocated = undefined` → 8th cell is empty (no chip, no error)
  - TC-05: Notes row open → notes cell `colSpan={8}` spans all columns
- **Execution plan:** Red → Green → Refactor
  - Red: Temporarily add empty 8th `TableCell`; snapshot test fails (new column, colSpan mismatch)
  - Green: 1. `TableHeader.tsx`: add 8th `<TableHead title="Room Ready">` with `CheckCircle` icon from lucide-react. 2. `view/BookingRow.tsx`: compute `const roomKey = booking.roomAllocated ? \`index_\${booking.roomAllocated}\` : null`; `const roomStatus = roomKey ? roomStatusMap?.[roomKey] : undefined`; `const isClean = roomStatus?.clean === "Yes"`; add 8th `<TableCell>` with conditional chip. 3. Update `colSpan={7}` → `colSpan={8}` in notes row.
  - Refactor: Post-build QA loop (design-qa + contrast + breakpoint)
- **Planning validation:**
  - Checks run: Read `view/BookingRow.tsx` (notes-row colSpan confirmed at line 146); read `TableHeader.tsx` (7 columns confirmed; snapshot has "Email Booking" as 8th — pre-existing mismatch)
  - Validation artifacts: `colSpan={7}` confirmed at `view/BookingRow.tsx:146`; `CleaningPriorityTable` Chip pattern confirmed at lines 44-64
  - Unexpected findings: `TableHeader.tsx` has only 7 columns but `TableHeader.test.tsx` expects 8 including "Email Booking" — pre-existing mismatch. TASK-06 will reconcile by updating test to expect 8 columns: 7 existing + "Room Ready" (not "Email Booking")
- **Scouts:** None: `CleaningPriorityTable` Chip pattern is the reuse target; confirmed compatible
- **Edge Cases & Hardening:** `roomStatusMap` is `null` during Firebase load → `roomStatusMap?.[key]` returns `undefined` → chip renders nothing; `colSpan` and column count must be updated atomically
- **What would make this >=90%:** Completed TASK-06 snapshot test passing
- **Rollout / rollback:**
  - Rollout: Deploy reception Worker; 8th column appears immediately
  - Rollback: Revert deploy
- **Documentation impact:** None
- **Notes / references:** `CheckCircle` is available in `lucide-react`; `colSpan` at `view/BookingRow.tsx:146`

---

### TASK-06: Tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — test files across 5 files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/orchestrations/prepare/__tests__/usePrepareDashboard.test.ts`
  - `apps/reception/src/components/prepare/__tests__/PrepareDashboard.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/BookingRow.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/CheckinsTable.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/TableHeader.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/__snapshots__/TableHeader.test.tsx.snap`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - Pattern-following for most tests; `CheckinsTable.test.tsx` needs `useRoomStatusData` mock that may require investigating existing mock setup; `TableHeader.test.tsx` reconciliation of pre-existing "Email Booking" assertion
  - Approach: 85% - All test patterns (mock hook return, render check, `saveRoomStatus` call check) are established
  - Impact: 85% - All tests are pure coverage additions; no risk to existing behaviour
- **Acceptance:**
  - [ ] `usePrepareDashboard.test.ts`: new `it` block confirms `saveRoomStatus` NOT called when `clean === "Yes"` + today timestamp + occupantSaysDirty
  - [ ] `usePrepareDashboard.test.ts`: new `it` block confirms `saveRoomStatus` IS called when `cleaned` is yesterday (stale)
  - [ ] `PrepareDashboard.test.tsx`: `defaultPrepareData()` includes `roomStatusMap: null`; `useRoomStatusMutations` mock added; new test confirms Mark Clean button renders when `isToday=true` and calls `saveRoomStatus`; additional test: during a pending `saveRoomStatus` call (unresolved promise), all "Mark Clean" buttons are disabled
  - [ ] `BookingRow.test.tsx`: new test renders with `roomStatusMap` prop containing a clean room entry → green chip visible
  - [ ] `CheckinsTable.test.tsx`: `useRoomStatusData` mock added; renders without error; `roomStatusMap` reaches child via prop
  - [ ] `TableHeader.test.tsx`: replace snapshot assertion with explicit `expect(screen.getByText('Room Ready')).toBeInTheDocument()` for the new column; remove "Email Booking" assertion; **no snapshot regeneration needed** — CI runs Jest with `--ci` which blocks snapshot auto-creation; explicit assertions avoid this constraint entirely
- **Engineering Coverage:**
  - UI / visual: Required - `BookingRow.test.tsx` pill render; `TableHeader.test.tsx` explicit column header assertions (no snapshot — CI `--ci` blocks auto-regeneration)
  - UX / states: Required - Mark Clean button disabled/enabled test; error toast test
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - All test additions; CI-only validation (testing policy)
  - Data / contracts: Required - Guard TC-01/02/03 in `usePrepareDashboard.test.ts`
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-06):**
  - TC-01: `usePrepareDashboard.test.ts` guard tests pass
  - TC-02: `PrepareDashboard.test.tsx` button render and click tests pass
  - TC-03: `PrepareDashboard.test.tsx` global write lock test: during pending write, all Mark Clean buttons disabled
  - TC-04: `BookingRow.test.tsx` pill test passes
  - TC-05: `CheckinsTable.test.tsx` mock setup passes
  - TC-06: `TableHeader.test.tsx` explicit column header assertions pass (no snapshot)
- **Execution plan:** Red → Green → Refactor
  - All tests are additions to existing test files; no new files needed
  - `TableHeader` test: replace `toMatchSnapshot()` with explicit `getByText` assertions for all column headers — CI uses `--ci` flag which blocks snapshot auto-regeneration; explicit assertions are the correct approach and produce clearer failure messages
- **Planning validation:**
  - Checks run: Read all 5 test files; confirmed mock patterns; confirmed `CheckinsTable.test.tsx` mocks `BookingRow` and `TableHeader` as dumb components — `useRoomStatusData` must be added as a jest.mock
  - Validation artifacts: `PrepareDashboard.test.tsx` `defaultPrepareData()` confirmed at lines 19-36; `usePrepareDashboard.test.ts` `saveRoomStatus` mock confirmed at line 22
  - Unexpected findings: `TableHeader.test.tsx` expects "Email Booking" which doesn't exist in current `TableHeader.tsx` — pre-existing test failure. TASK-06 must fix this by replacing "Email Booking" with "Room Ready" and regenerating snapshot.
- **Scouts:** `useRoomStatusData` mock path for `CheckinsTable.test.tsx`: `jest.mock("../../../hooks/data/useRoomStatus", () => ({ default: () => ({ roomStatusMap: {}, loading: false, error: null }) }))` — path follows existing pattern `../../../hooks/data/useCheckinsTableData` in that test file
- **Edge Cases & Hardening:** `TableHeader` test uses explicit assertions (not snapshot); existing `.snap` file (if any) should be deleted as part of this task since the test no longer uses `toMatchSnapshot()`; CI `--ci` flag blocks snapshot auto-regeneration so the explicit approach is the only safe path
- **What would make this >=90%:** Prior knowledge of exact test failure messages from CI run
- **Rollout / rollback:**
  - Rollout: Tests run in CI on push
  - Rollback: N/A
- **Documentation impact:** None
- **Notes / references:** Testing policy: tests run in CI only; governed test runner: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern>`

---

## Risks & Mitigations

- `roomAllocated` undefined for some bookings → pill renders nothing (graceful; handled via optional chaining)
- Pre-existing `TableHeader.test.tsx` / snapshot mismatch ("Email Booking") → TASK-06 fixes by removing stale assertion and adding "Room Ready"
- Mark Clean button accessible on non-today dates accidentally → `disabled={!isToday}` guard + no `onClick` handler in disabled state
- `colSpan` and `TableHeader` column count out of sync → both changes land in TASK-05 in same PR; TypeScript does not catch colSpan mismatch, but visual QA in post-build step will catch it

## Observability

- Logging: `try/catch` in `handleMarkClean` calls `showToast` on error — visible to user; no server-side logging
- Metrics: None added
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] Cleaning staff can click "Mark Clean" on the prepare dashboard for today's rooms
- [ ] Cleaning signal survives page reload for occupied rooms (stayover clean)
- [ ] Checkins screen shows per-room "Clean" / "Dirty" pill in 8th column
- [ ] All 5 test file changes pass in CI
- [ ] TypeScript typecheck passes for all modified files
- [ ] Post-build QA on `/checkin` route: no Critical/Major contrast or breakpoint issues

## Decision Log

- 2026-03-14: Mark Clean button today-only — `/roomStatus` has no date partition; historical writes corrupt live status [from analysis]
- 2026-03-14: Await-not-optimistic UX — Firebase subscription round-trip fast enough; optimistic adds complexity [from analysis]
- 2026-03-14: Single subscription at `CheckinsTable` level — `useFirebaseSubscription` creates per-instance `onValue` listeners [from fact-find]
- 2026-03-14: Pre-existing "Email Booking" test mismatch — `TableHeader.tsx` was modified to remove this column; TASK-06 reconciles [Adjacent: delivery-rehearsal] — fix is same-outcome (part of TASK-06 header test update)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Expose `roomStatusMap` from return value | Yes — `roomStatusMap` already declared at line 125 | None | No |
| TASK-02: Patch auto-sync guard | Yes — `toEpochMillis` already imported; `todayTime` already computed in effect | None | No |
| TASK-03: Mark Clean button | Yes — depends TASK-01 (mock update) and TASK-02 (guard); `useRoomStatusMutations`, `showToast` available | `getItalyIsoString` and `showToast` not yet imported in `PrepareDashboard.tsx` — noted in planning validation | No (noted as execution detail) |
| TASK-04: Subscription + prop-threading | Yes — `useRoomStatusData` hook exists; `SingleRoomStatus` type available | `CheckinsTable.tsx` passes many props to `CheckinsTableView` already — adding `roomStatusMap` follows same pattern | No |
| TASK-05: Cleanliness pill + header + colSpan | Yes — depends TASK-04; `roomStatusMap` available in props | Pre-existing `TableHeader.test.tsx` mismatch noted; `colSpan` and header column count must ship together | No (handled in TASK-06) |
| TASK-06: Tests | Yes — depends all prior tasks | Pre-existing "Email Booking" assertion must be replaced; `useRoomStatusData` mock needed in `CheckinsTable.test.tsx` | No (handled within TASK-06) |

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 90% × S(1) = 90
- TASK-03: 85% × M(2) = 170
- TASK-04: 85% × M(2) = 170
- TASK-05: 85% × M(2) = 170
- TASK-06: 80% × M(2) = 160
- Total weight: 1+1+2+2+2+2 = 10
- Weighted sum: 90+90+170+170+170+160 = 850
- Overall-confidence: 850/10 = 85%
