---
Type: Build-Record
Status: Complete
Domain: Reception
Last-reviewed: 2026-03-14
Feature-Slug: reception-room-cleaning-status-pipeline
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/reception-room-cleaning-status-pipeline/build-event.json
---

# Build Record: Room Cleaning Status Pipeline

## Outcome Contract

- **Why:** Cleaning staff have no way to signal when a room is done. Reception staff checking guests in are flying blind on whether the room is actually ready. Fixing this means both teams can do their jobs without phone calls or guesswork.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cleaning staff can mark individual rooms as cleaned on the prepare dashboard. The checkins screen shows a per-room cleanliness indicator. Reception staff can see at a glance whether a room is ready before a guest reaches the desk.
- **Source:** operator

## What Was Built

**TASK-01 & TASK-02 — Hook return value and auto-sync guard fix.** The `usePrepareDashboard` hook already held a `roomStatusMap` internally but did not expose it. The return value was updated to include it, making it available to downstream components. Separately, a bug in the auto-sync logic was patched: when an occupied room had been manually marked clean, the sync would overwrite it with "Dirty" on every refresh. The fix adds a guard that skips the overwrite when the clean timestamp is from today, preserving the manual signal through the working day.

**TASK-03 — Mark Clean button on the prepare dashboard.** A new "Mark Clean" button column was added to `CleaningPriorityTable`. The button is disabled for any date other than today (no historical writes to the live status path), and is globally disabled during a write to prevent double-submission. The handler in `PrepareDashboard` writes `{ clean: "Yes", cleaned: <ISO timestamp> }` to the `/roomStatus/index_<room>` Firebase path. On write failure, a toast error is shown.

**TASK-04 — Room status subscription wired into the checkins screen.** A single `useRoomStatusData()` subscription was added at the `CheckinsTable` controller level. The resulting `roomStatusMap` is threaded through `CheckinsTableView → BookingRow → BookingRowView` as a prop, with no per-row subscriptions created.

**TASK-05 — Cleanliness pill and 8th column on the checkins table.** `TableHeader` gained an 8th column ("Room Ready" with a CheckCircle icon). Each booking row now shows a green "Clean" or red "Dirty" chip based on the room's current status from Firebase. When a room is not yet allocated or the status is unknown, the cell is left empty. The notes-row `colSpan` was updated from 7 to 8 to keep the table layout intact. A pre-existing test mismatch ("Email Booking" column that had been removed) was fixed as part of this task.

**TASK-06 — Tests.** Five test files were updated: guard behaviour tests in `usePrepareDashboard.test.ts`; button render and click tests (including write-lock state) in `PrepareDashboard.test.tsx`; prop-threading tests in `CheckinsTable.test.tsx`; cleanliness pill render tests in `BookingRow.test.tsx`; and explicit column header assertions (replacing the old snapshot) in `TableHeader.test.tsx`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| CI — `apps/reception` Jest suite | Pass | Validated via push to dev branch (testing policy: tests run in CI only) |
| `pnpm typecheck` (reception) | Pass | All modified files typecheck clean |
| `pnpm lint` (reception) | Pass | No lint errors introduced |

## Workflow Telemetry Summary

Telemetry recorded via the standard lp-do-build pipeline. Stage coverage: lp-do-build (modules: build-code.md, build-validate.md). Deterministic check: `scripts/validate-engineering-coverage.sh`. Input paths: `plan.packet.json`, `plan.md`.

## Validation Evidence

### TASK-01
- TC-01: `usePrepareDashboardData()` return value includes `roomStatusMap` field
- TC-02: `defaultPrepareData()` mock in `PrepareDashboard.test.tsx` includes `roomStatusMap: null`

### TASK-02
- TC-01: Guard prevents `saveRoomStatus` call when `clean === "Yes"` + today timestamp + occupantSaysDirty
- TC-02: Guard allows `saveRoomStatus` call when `cleaned` timestamp is from a previous day (stale)
- TC-03: Guard allows overwrite when `cleaned` is `false` (missing timestamp treated as stale)

### TASK-03
- TC-01: Mark Clean button visible and enabled when `isToday=true`
- TC-02: Mark Clean button disabled when `isToday=false`
- TC-03: Click calls `saveRoomStatus("index_3", { clean: "Yes", cleaned: <iso> })`
- TC-04: On `saveRoomStatus` rejection, `showToast("Failed to mark room as clean", "error")` fired

### TASK-04
- TC-01: `CheckinsTable` with mocked `useRoomStatusData` passes `roomStatusMap` to `CheckinsTableView`
- TC-02: `view/BookingRow` receives `roomStatusMap` prop from parent

### TASK-05
- TC-01: `roomStatusMap = { index_3: { clean: "Yes" } }`, `roomAllocated = "3"` → green "Clean" chip
- TC-02: `roomStatusMap = { index_3: { clean: false } }`, `roomAllocated = "3"` → red "Dirty" chip
- TC-03: `roomStatusMap = {}`, `roomAllocated = "3"` → 8th cell empty
- TC-04: `roomAllocated = undefined` → 8th cell empty, no error
- TC-05: Notes row open → `colSpan={8}` spans all columns

### TASK-06
- TC-01 through TC-06: All five test files pass in CI (guard, button, lock, pill, prop-threading, header)

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Mark Clean button column in `CleaningPriorityTable`; Clean/Dirty chip in `view/BookingRow` 8th cell; "Room Ready" header in `TableHeader` | Chip uses semantic tokens `bg-success-main` / `bg-error-main` |
| UX / states | Button disabled on non-today and during write; error toast on failure; empty cell when room unallocated | Await-not-optimistic; global write lock intentional for single-operator tool |
| Security / privacy | N/A — Firebase auth unchanged; no PII in room status | Acceptable for hostel context |
| Logging / observability / audit | `try/catch` + `showToast("Failed to mark room as clean", "error")` in `PrepareDashboard` handler | `saveRoomStatus` rethrows; toast wraps it |
| Testing / validation | 5 test files: `usePrepareDashboard.test.ts`, `PrepareDashboard.test.tsx`, `CheckinsTable.test.tsx`, `BookingRow.test.tsx`, `TableHeader.test.tsx` | TypeScript typecheck pass, lint clean |
| Data / contracts | `SingleRoomStatus` schema unchanged; `usePrepareDashboardData()` return additive; guard uses `typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime` | No Zod schema change |
| Performance / reliability | Single `useRoomStatusData()` at `CheckinsTable` level; prop-threaded to all rows; no per-row listeners | `useRoomStatusMutations()` in `PrepareDashboard` does not add a subscription |
| Rollout / rollback | Cloudflare Worker hot-swap; no DB migration; Firebase writes idempotent; no feature flag | Revert deploy is sufficient rollback |

## Scope Deviations

None. All tasks completed as planned. The pre-existing "Email Booking" test mismatch in `TableHeader.test.tsx` was fixed as part of TASK-06, consistent with the plan's documented handling of this issue.
