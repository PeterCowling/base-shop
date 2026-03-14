---
Type: Analysis
Status: Ready-for-planning
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-room-cleaning-status-pipeline
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-room-cleaning-status-pipeline/fact-find.md
Related-Plan: docs/plans/reception-room-cleaning-status-pipeline/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Room Cleaning Status Pipeline Analysis

## Decision Frame

### Summary

Two independent screens need to be connected via a shared Firebase data path that already exists but has no write surface and no read surface in the UI. The core decision is whether to deliver both ends of the pipeline together (mark-clean write + checkins read) or split delivery. A secondary decision is the exact wiring architecture for the subscription data flow.

### Goals

- Cleaning staff can mark a room as cleaned on the prepare dashboard
- The mark-clean signal survives page reload and is never silently overwritten for occupied rooms
- Reception staff see a per-room cleanliness pill on the checkins screen
- No new Firebase paths or npm dependencies

### Non-goals

- Global "Rooms Ready" toggle replacement
- "Mark as dirty" manual button
- Per-occupant/per-bed status
- Historical cleaning audit log

### Constraints & Assumptions

- Constraints:
  - `SingleRoomStatus` Zod schema must remain backward compatible
  - `/roomStatus/index_<room>` is the write target — no new paths
  - UI must use reception design system tokens (Tailwind v4 semantic tokens)
- Assumptions:
  - `roomAllocated` in `CheckInRow` holds raw room number (e.g. "3") → Firebase key `index_3`
  - `useFirebaseSubscription` creates one `onValue` listener per hook instance — no React-layer deduplication
  - `usePrepareDashboardData()` already subscribes to `/roomStatus` internally; exposing `roomStatusMap` in its return value adds zero subscription overhead

## Inherited Outcome Contract

- **Why:** Cleaning staff have no way to signal when a room is done. Reception staff checking guests in are flying blind on whether the room is actually ready. Fixing this means both teams can do their jobs without phone calls or guesswork.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cleaning staff can mark individual rooms as cleaned on the prepare dashboard. The checkins screen shows a per-room cleanliness indicator. Reception staff can see at a glance whether a room is ready before a guest reaches the desk.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-room-cleaning-status-pipeline/fact-find.md`
- Key findings used:
  - `saveRoomStatus` mutation already exists and is used inside `usePrepareDashboard`; no new write infrastructure needed
  - `usePrepareDashboardData()` already subscribes to `/roomStatus` — expose `roomStatusMap` in its return value; no second listener
  - `useFirebaseSubscription` does NOT deduplicate across React instances; subscription must be placed at `CheckinsTable` controller level and prop-threaded
  - Auto-sync guard bug: must use `clean === "Yes" && typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime` — `cleaned` is a full ISO timestamp so `isToday()` comparison silently fails
  - `view/BookingRow.tsx` renders 7 `TableCell`s; if an 8th column is added, `TableHeader.tsx` and the notes-row `colSpan={7}` in the same file must be updated
  - `showToast` utility already exists at `apps/reception/src/utils/toastUtils.ts` — use for mark-clean error feedback

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| End-to-end completeness | Both staff roles must benefit from one delivery; a half-delivery leaves the workflow broken | High |
| Subscription efficiency | Per-row `onValue` listeners are duplicate work on the same Firebase connection (not separate WebSocket channels), but still wasteful; a single shared subscription is the correct pattern | Medium |
| Auto-sync guard correctness | Stayover cleans (occupied room) must survive page reload; the guard is the correctness hinge | High |
| Design system compliance | Reception uses Tailwind v4 semantic tokens; new elements must use `bg-success-main`, `bg-error-main` etc. | Medium |
| Test coverage | New interactive paths need unit test coverage per testing policy | Medium |
| Implementation scope | Simpler is better when both options deliver the goal | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Full pipeline (write + guard + read) | Mark-clean button on prepare dashboard, auto-sync guard fix, per-room cleanliness pill on checkins | Completes the entire staff workflow; both roles get value in one deploy | Touches 6–8 files across two screens | Slightly wider scope, but all changes are additive | **Yes — Recommended** |
| B: Prepare-dashboard only (no checkins pill) | Mark-clean button + guard fix; no change to checkins screen | Narrower scope | Reception staff still need to navigate to prepare dashboard manually; the stated goal ("see at a glance on checkins") is not met | Partial delivery undercuts the operator intent | No |
| C: Checkins pill only (no mark-clean) | Read-only pill on checkins derived from existing auto-sync data | Minimal write changes | No write path → pill always shows "Dirty" for occupied rooms regardless of actual cleaning; stayover cleans can never be signalled | Delivers a widget with misleading data | No |

## Engineering Coverage Comparison

| Coverage Area | Option A | Option B | Option C | Chosen (A) implication |
|---|---|---|---|---|
| UI / visual | Mark-clean button in `CleaningPriorityTable`; cleanliness pill in `view/BookingRow`; 8th column + header update | Mark-clean button only | Pill only | Both UI surfaces required; use `Chip` pattern from `CleaningPriorityTable`; pill uses `bg-success-main`/`bg-error-main` semantic tokens; 8th `TableHeader` column + `colSpan` update |
| UX / states | Loading state on button (disabled while pending); error toast on failure; already-clean state | Button states only | N/A | Optimistic update rejected — await Firebase write then let subscription refresh render; `showToast` on error; button disabled during write |
| Security / privacy | Same Firebase auth as all reception staff; no PII in room status | Same | Same | N/A — all logged-in reception staff can write; acceptable |
| Logging / observability / audit | `saveRoomStatus` only records error state + rethrows; new button path needs explicit `try/catch` + `showToast` | Same | N/A | `try/catch` + `showToast("Failed to mark room as clean", "error")` required in `PrepareDashboard` handler |
| Testing / validation | Tests across 5 files: button interaction + mock update (`PrepareDashboard.test.tsx`), guard unit (`usePrepareDashboard.test.ts`), cleanliness pill + prop-threading (`BookingRow.test.tsx`, `CheckinsTable.test.tsx`), 8th column header snapshot (`TableHeader.test.tsx`); `CheckinsTable.test.tsx` mocks `TableHeader` so the header column change is covered by the separate `TableHeader.test.tsx` snapshot suite | Button + guard tests | Pill test | 5 files impacted; `TableHeader.test.tsx` snapshot must be updated separately from `CheckinsTable.test.tsx` |
| Data / contracts | `SingleRoomStatus` schema unchanged; `saveRoomStatus` existing mutation; guard uses `toEpochMillis` (not `isToday`) | Same | No write change | Guard: `clean === "Yes" && typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime` |
| Performance / reliability | Single subscription at `CheckinsTable` level; prop-thread `roomStatusMap` through `CheckinsTableView → BookingRow`; ~10 rooms = small dataset | Same prep-side wiring | Same checkins-side issue | No per-row subscriptions; `useRoomStatusMutations()` called once in `PrepareDashboard`; `roomStatusMap` exposed from `usePrepareDashboardData()` return (no duplicate listener) |
| Rollout / rollback | Cloudflare Worker hot-swap; no DB migration; Firebase writes idempotent | Same | Same | No feature flag; deploy + revert is sufficient rollback |

## Chosen Approach

- **Recommendation:** Option A — full end-to-end pipeline in a single delivery
- **Why this wins:** The operator intent is explicit: reception staff must be able to see room readiness on the checkins screen. Options B and C each deliver one half of a pipeline that only works when both ends are live. Option A is the minimum complete delivery. The scope is bounded (6–8 files, all additive changes). No new Firebase paths or mutations are needed; a new `useRoomStatusData()` subscription is added at the checkins side, but the hook and the Firebase path (`/roomStatus`) already exist — this is a new usage, not new infrastructure.
- **What it depends on:**
  - `usePrepareDashboardData()` returns `roomStatusMap` (internal refactor, no breaking change)
  - Single `useRoomStatusData()` subscription placed at `CheckinsTable` (controller) level — prop-threading through `CheckinsTableView` → `BookingRow` (container) → `view/BookingRow`
  - `useRoomStatusMutations()` called once in `PrepareDashboard`; `saveRoomStatus` called on button press with `{ clean: "Yes", cleaned: getItalyIsoString() }`
  - Auto-sync guard patched before the button is wired (ordering dependency)

### Sub-approach decisions (resolved here)

| Decision | Choice | Rejected alternative | Rationale |
|---|---|---|---|
| Checkins subscription placement | Single call at `CheckinsTable` controller level + prop threading | Per-row `useRoomStatusData()` in `BookingRow` | Each hook instance installs its own `onValue` listener; per-row = 10+ listeners on the checkins view |
| Prepare-side roomStatusMap | Expose from `usePrepareDashboardData()` return value | Second `useRoomStatusData()` call in `PrepareDashboard` | The hook already subscribes internally; adding a second call creates a duplicate Firebase listener for the same path |
| Pill placement in checkins | 8th dedicated column ("Clean?") in `view/BookingRow.tsx` | Inline pill inside room number cell | Room number cell is 40px wide (`w-10`); inline placement is cramped and poor for scannability; dedicated column requires updating `TableHeader.tsx` + `colSpan={7}→8` but is visually clear |
| Button UX model | Await Firebase write then let subscription refresh (no optimistic update) | Optimistic UI | Firebase subscription is real-time; the round-trip is fast enough (< 200ms local); optimistic update adds complexity with no visible benefit |

### Rejected Approaches

- **Option B (prepare-only)** — Only solves the write side; reception staff still fly blind on the checkins screen. Half-delivery contradicts the stated outcome.
- **Option C (checkins-only)** — Read surface without write path shows "Dirty" for stayover rooms regardless of actual cleaning. Delivers a misleading widget.

### Resolved Defaults (No Operator Input Required)

The fact-find noted one open product question. Resolved here with a default:

- **Mark Clean button availability**: Button is **today-only** — disabled (or hidden) when `selectedDate !== localToday`. `/roomStatus/index_<room>` is a live room-level record with **no date partition**; writing from a historical or future date view would overwrite the current-day live readiness state seen on both the prepare dashboard and the checkins screen. Planning must gate the button on `isToday(selectedDate)`, consistent with how the auto-sync effect already conditions on `isTodayDate(selectedDate)` at line ~360 of `usePrepareDashboard.ts`.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Cleaning staff workflow | Read-only table; no way to mark room as cleaned | Cleaning staff finishes cleaning a room | Staff opens prepare dashboard → sees per-room table → clicks "Mark Clean" button → button disables during write → Firebase `/roomStatus/index_<room>` updated with `{ clean: "Yes", cleaned: <ISO timestamp> }` → table chip refreshes to "Clean" in real-time | Cleanliness table, occupancy/checkout data columns, date selector | Error path: write failure shows `showToast` error; room chip stays "Dirty" |
| Auto-sync (stayover guard) | Auto-sync unconditionally overwrites `clean` based on occupancy; no guard for already-manually-cleaned rooms | `usePrepareDashboard` `useEffect` fires when date=today | Auto-sync checks: if `clean === "Yes" && typeof cleaned === "string" && toEpochMillis(cleaned) >= todayTime` → skip dirty overwrite; manual clean survives until midnight | Auto-sync still runs and handles initial dirty detection for all rooms | Guard uses same epoch-compare pattern as existing `mergedData` at line ~315; string narrowing required before `toEpochMillis()` call |
| Reception checkins view | No per-room status; global "Rooms Ready" toggle only | Guest approaches desk for check-in | Reception staff opens checkins view → per-room "Clean?" pill visible in new 8th column for each booking row → green "Clean" / red "Dirty" derived from `/roomStatus/index_<roomAllocated>` → single Firebase subscription at `CheckinsTable` level; all rows read from shared `roomStatusMap` prop | Global "Rooms Ready" toggle unchanged; all other booking row columns unchanged | `roomAllocated` may be `undefined` for some bookings — pill must render nothing (graceful empty); notes-row `colSpan` must be updated from 7 to 8 |

## Planning Handoff

- Planning focus:
  - TASK-01: Expose `roomStatusMap` from `usePrepareDashboardData()` return value (prerequisite for all prepare-side work)
  - TASK-02: Patch auto-sync guard in `usePrepareDashboard.ts` (prerequisite for Mark Clean button correctness)
  - TASK-03: Add "Mark Clean" button to `CleaningPriorityTable.tsx`; button is disabled when `isToday(selectedDate)` is false; wire `saveRoomStatus` in `PrepareDashboard.tsx` with `try/catch` + `showToast`
  - TASK-04: Add single `useRoomStatusData()` subscription at `CheckinsTable` (controller) level; prop-thread `roomStatusMap` through `CheckinsTableView` → `BookingRow`
  - TASK-05: Render cleanliness pill in `view/BookingRow.tsx` (8th cell); update `TableHeader.tsx` (8th column header); update `colSpan={7}→8` in notes row
  - TASK-06: Tests — guard unit test in `usePrepareDashboard.test.ts`; button interaction test in `PrepareDashboard.test.tsx`; pill render test in `BookingRow.test.tsx`; prop-threading integration test in `CheckinsTable.test.tsx` (verify `roomStatusMap` reaches `BookingRow`); `TableHeader.tsx` snapshot update to capture 8th column; hook mock in `PrepareDashboard.test.tsx` updated to include `roomStatusMap` field
- Validation implications:
  - All tests run in CI only (testing policy); validate by pushing to dev branch
  - TypeScript typecheck must pass — `usePrepareDashboardData()` returns an inferred object (no explicit interface); adding `roomStatusMap` is additive; the primary seam is the mock in `PrepareDashboard.test.tsx` which hardcodes the hook's return shape and must be updated alongside TASK-01
  - `view/BookingRow.tsx` props interface needs `roomStatusMap?: Record<string, SingleRoomStatus>` (or passed via container)
- Sequencing constraints:
  - TASK-01 and TASK-02 must precede TASK-03 (guard must be in place before button lands)
  - TASK-04 must precede TASK-05 (subscription must be in place before pill reads from it)
  - TASK-06 can run in parallel with TASK-04/05 for prepare-side tests; checkins tests after TASK-05
- Risks to carry into planning:
  - Firebase key `index_<room>` construction: must confirm `roomAllocated` is the raw number not the key; graceful undefined handling
  - `usePrepareDashboardData()` return is an inferred object — adding `roomStatusMap` is additive and won't break TypeScript callers, but the test mock in `PrepareDashboard.test.tsx` hardcodes the return shape and must be updated alongside TASK-01
  - 8th column may cause horizontal scroll on very narrow viewports — check at 768px breakpoint during build

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `roomAllocated` undefined for some bookings | Low | Low | Depends on data completeness — graceful empty render is the correct fallback regardless | Pill must handle `roomStatusMap[key] === undefined` without throwing |
| `usePrepareDashboardData()` return shape is hardcoded in test mocks | Medium | Low | `usePrepareDashboardData()` currently returns an inferred object; adding `roomStatusMap` is additive and won't break callers, but `PrepareDashboard.test.tsx` mocks the hook with a hardcoded return shape — mock must be updated alongside TASK-01 | TASK-01 must update the mock in `PrepareDashboard.test.tsx` to include `roomStatusMap: {}` (or a test fixture); otherwise tests will fail |
| Narrow viewport horizontal scroll from 8th column | Medium | Low | Responsive breakpoint check belongs in build not analysis | Build-time verification at 768px; fallback: abbreviate column header ("✓") |

## Planning Readiness

- Status: Ready-for-planning
- Rationale: Approach is decisive. All sub-architecture choices resolved. No operator questions open. Engineering coverage complete. Three risks are carry-forward only — none block planning.
