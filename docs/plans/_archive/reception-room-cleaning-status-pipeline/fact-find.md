---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-room-cleaning-status-pipeline
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-room-cleaning-status-pipeline/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314155800-0001
---

# Room Cleaning Status Pipeline Fact-Find Brief

## Scope

### Summary
Cleaning staff need a way to mark individual rooms as finished on the prepare dashboard. Front desk staff checking in guests need to see per-room cleanliness status on the checkins screen. Currently the prepare dashboard is fully read-only and the checkins screen has only a global "Rooms Ready" toggle disconnected from per-room data.

### Goals
- Cleaning staff can tap/click a "Mark Clean" button per room on the prepare dashboard
- The mark-clean signal is persisted to Firebase `/roomStatus/index_<room>` and survives page reload
- The auto-sync in `usePrepareDashboard` is guarded so a manual clean signal is never overwritten while the room is still occupied (stayover cleans)
- The checkins table shows a per-room cleanliness pill next to each booking row (green "Clean" / red "Dirty") derived from the same `/roomStatus` data
- The existing global "Rooms Ready" toggle is left unchanged (separate concern)

### Non-goals
- Replacing or removing the global "Rooms Ready" toggle on the checkins screen
- Adding a "mark as dirty" button (auto-sync already handles this when occupants are detected)
- Per-occupant or per-bed cleaning status (room-level is sufficient)
- Historical cleaning audit log

### Constraints & Assumptions
- Constraints:
  - Firebase `/roomStatus` schema must remain backward compatible (`SingleRoomStatus` strict Zod schema)
  - No new Firebase paths needed — `/roomStatus/index_<room>` is the existing write target
  - UI must follow reception design system tokens (Tailwind v4, semantic tokens)
  - No new npm dependencies
- Assumptions:
  - `roomAllocated` in `CheckInRow` holds the raw room number (e.g. "3") — the Firebase key is `index_3`
  - `useFirebaseSubscription` does NOT deduplicate across React hook instances; each call installs its own `onValue` listener — this is why `roomStatusMap` must be subscribed once at `CheckinsTable` level and passed as a prop, not called per-row
  - The guard condition for the auto-sync is: if `dbStatus.clean === "Yes"` AND `typeof dbStatus.cleaned === "string"` AND `toEpochMillis(dbStatus.cleaned) >= todayTime` → do not overwrite with dirty, even if occupants are present (`cleaned` is `string | false | undefined` per the Zod schema, so the string narrowing guard is required before calling `toEpochMillis()`; epoch comparison rather than `isToday()` is required because `cleaned` holds a full ISO timestamp)

## Outcome Contract

- **Why:** Cleaning staff have no way to signal when a room is done. Reception staff checking guests in are flying blind on whether the room is actually ready. Fixing this means both teams can do their jobs without phone calls or guesswork.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cleaning staff can mark individual rooms as cleaned on the prepare dashboard. The checkins screen shows a per-room cleanliness indicator. Reception staff can see at a glance whether a room is ready before a guest reaches the desk.
- **Source:** operator

## Current Process Map

- **Trigger:** Cleaning staff finish cleaning a room
- **End condition:** Reception staff can confirm room is ready when checking a guest in

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Cleaning staff workflow | Staff clean room → have no system action available → room status unchanged in system | Cleaning staff → Firebase RTDB (passive) | `CleaningPriorityTable.tsx` (read-only, no button) | No write path for cleaning staff |
| Prepare dashboard auto-sync | `usePrepareDashboard` `useEffect` runs on every render when date=today → writes `clean: false` if occupants active, `clean: "Yes"` if no occupants → overwrites any prior value | `usePrepareDashboard.ts:358–430` | `usePrepareDashboard.ts` | Overwrites manual clean signal for occupied rooms (stayover bug) |
| Checkins room readiness | Reception views checkins table → no per-room status shown → clicks global "Rooms Ready" toggle manually based on offline knowledge | `CheckinsTable.tsx:124` `useSharedDailyToggle("roomsReady")` | `CheckinsTable.tsx`, `CheckinsTableView` | Global toggle disconnected from per-room data; no individual room signal |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/prepare-dashboard/page.tsx` — route `/prepare-dashboard`, renders `<PrepareDashboard />`
- `apps/reception/src/app/checkin/page.tsx` — route `/checkin`, renders checkins UI via `CheckinContent.tsx` → `CheckinsTable`

### Key Modules / Files
- `apps/reception/src/components/prepare/CleaningPriorityTable.tsx` — read-only table; `TableRow` interface `{roomNumber, occupantCount, finalCleanliness, checkouts}`; no interactive elements; needs "Mark Clean" button per row
- `apps/reception/src/components/prepare/PrepareDashboard.tsx` — orchestrator; builds `finalData` from three hooks; **wiring**: `usePrepareDashboardData()` already subscribes to `/roomStatus` internally; expose `roomStatusMap` in its return value (no second listener); call `useRoomStatusMutations()` once in `PrepareDashboard` for `saveRoomStatus` (write-only, no subscription overhead)
- `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts` — auto-sync `useEffect` (lines 358–430); computes `mergedData`; has bug: overwrites manual clean for occupied rooms
- `apps/reception/src/hooks/data/useRoomStatus.ts` — Firebase subscription to `/roomStatus`; returns `roomStatusMap: Record<string, SingleRoomStatus> | null`; subscribed via `useFirebaseSubscription("roomStatus")`
- `apps/reception/src/hooks/mutations/useRoomStatusMutations.ts` — `saveRoomStatus(roomNumber, Partial<SingleRoomStatus>)`: `update` at `/roomStatus/<roomNumber>`; already used in `usePrepareDashboard`
- `apps/reception/src/schemas/roomStatusSchema.ts` — Zod strict schema: `{ checkedout?, clean?, cleaned? }` all `string | false | undefined`; no schema change needed
- `apps/reception/src/components/checkins/BookingRow.tsx` — container; currently calls `useKeycardInfo`, `useBookingNotes`, `useRoomAllocation`; receives `roomStatusMap` as a prop (prop-threading from `CheckinsTable` — do NOT add a per-row `useRoomStatusData()` call)
- `apps/reception/src/components/checkins/view/BookingRow.tsx` — view layer; renders 7 `TableCell`s; if an 8th cleanliness cell is added, `TableHeader.tsx` (column headers) and the notes-row `colSpan={7}` in this same file must also be updated to match
- `apps/reception/src/components/checkins/CheckinsTable.tsx` — controller; line 124 `useSharedDailyToggle("roomsReady")`; candidate location for shared `useRoomStatusData()` hook to avoid per-row subscriptions

### Patterns & Conventions Observed
- Controller/View split for BookingRow (container `BookingRow.tsx` → view `view/BookingRow.tsx`) — any new hook should go in the container, not the view
- Design system chip pattern already in `CleaningPriorityTable.tsx` (local `Chip` component) — can reuse or extract
- Semantic tokens: `bg-success-main`, `text-success-fg`, `bg-error-main`, `text-danger-fg` already used for Clean/Dirty chips
- `memo` wrapping on all components — the new "Mark Clean" button handler must be `useCallback`-wrapped to avoid breaking memoization

### Data & Contracts
- **Types/schemas/events:**
  - `SingleRoomStatus: { checkedout?: string|false, clean?: string|false, cleaned?: string|false }` — strict Zod, no new fields needed
  - `Cleanliness: "Clean" | "Dirty"` — existing type
  - `CheckInRow.roomAllocated?: string` — raw room number (e.g. "3"), convert to `index_3` for Firebase lookup
- **Persistence:**
  - Write path: `saveRoomStatus("index_<room>", { clean: "Yes", cleaned: <ISOstring> })`
  - Read path: `useRoomStatusData()` → `roomStatusMap["index_<room>"]`
  - Firebase path: `/roomStatus/index_<room>`
- **API/contracts:**
  - No REST API involved — Firebase RTDB direct reads/writes only
  - `saveRoomStatus` returns a `Promise<void>` (void return confirmed in mutations hook)

### Dependency & Impact Map
- **Upstream dependencies:**
  - `usePrepareDashboard` already calls `useRoomStatusData()` — no new subscription needed on prepare side
  - Checkins side currently has NO subscription to `/roomStatus` — adding `useRoomStatusData()` in `CheckinsTable` is a new listener
- **Downstream dependents:**
  - `CleaningPriorityTable` — new prop for mark-clean callback
  - `PrepareDashboard` — passes `saveRoomStatus` + `roomStatusMap` down to table
  - `BookingRow` (container) — new hook or prop for room status
  - `view/BookingRow` — new prop for cleanliness status display
  - `CheckinsTableView` — may need new `roomStatusMap` prop to pass down
- **Likely blast radius:**
  - Small: 5–7 files touched, all in `apps/reception`
  - No shared packages affected
  - No Firebase schema changes
  - No API route changes

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `CleaningPriorityTable.tsx` uses `Chip` component with semantic tokens; checkins `BookingRow` has 7 cells | No "Mark Clean" button; no cleanliness pill in BookingRow | Button design and placement; pill style; ds-compliant token usage |
| UX / states | Required | Prepare table shows static Clean/Dirty chip; checkins rows have no loading state for sub-data | Missing: loading state for mark-clean action (optimistic?), already-clean state, error state on failed write | Optimistic update vs await-then-refresh; dirty→clean transition animation |
| Security / privacy | N/A | `/roomStatus` writes are Firebase RTDB; auth is Firebase Auth (same for all reception staff); no PII in room status | No role restriction on who can mark clean (all staff can write); acceptable for hostel context | None |
| Logging / observability / audit | N/A | `saveRoomStatus` only records error state and rethrows — no logging of its own; `console.error` calls are inside `usePrepareDashboard` auto-sync effect, not in the mutation hook itself | New manual button path has no error handling today; a failure is swallowed silently | New button needs explicit `try/catch` with `showToast("Failed to mark room as clean", "error")` — `showToast` utility already exists at `apps/reception/src/utils/toastUtils.ts` |
| Testing / validation | Required | `PrepareDashboard.test.tsx` mocks hooks; `BookingRow.test.tsx` mocks sub-components; `usePrepareDashboard.test.ts` exists | No test for mark-clean button interaction; no test for cleanliness pill; no test for auto-sync guard | New component tests for button + pill; new unit test for guard logic |
| Data / contracts | Required | `roomStatusSchema` is strict Zod — no new fields needed; `saveRoomStatus` mutation exists; `cleaned` is an ISO timestamp string written by `getItalyIsoString()` (not a `YYYY-MM-DD` date) | Auto-sync guard must use `toEpochMillis(dbStatus.cleaned) >= todayTime` — same pattern already in `mergedData` at line ~315 of `usePrepareDashboard.ts`; using `isToday(dbStatus.cleaned)` would silently fail because `isToday` expects `YYYY-MM-DD` | Guard condition (correct): `clean === "Yes" && toEpochMillis(cleaned) >= todayTime` → skip dirty overwrite |
| Performance / reliability | Required | `useFirebaseSubscription` creates one `onValue` listener per hook instance — no React-layer dedup; `/roomStatus` has 10 rooms (small dataset) | Per-row `useRoomStatusData()` calls would create per-row listeners; must use one subscription at CheckinsTable level and pass `roomStatusMap` as prop | Single subscription at CheckinsTable; prop-thread through CheckinsTableView → BookingRow |
| Rollout / rollback | Required | Reception is a Cloudflare Worker deploy (hot-swap); no DB migration needed; Firebase writes are idempotent | No rollback concern beyond revert deploy; the auto-sync guard change is backward compatible (clean rooms already get `cleaned` timestamp) | No feature flag needed; deploy + revert is sufficient rollback |

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: test job in reusable-app.yml

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| PrepareDashboard | Unit (hook-mocked) | `prepare/__tests__/PrepareDashboard.test.tsx` | Covers loading, error, no-data, table render; no interactive test |
| BookingRow | Unit (component-mocked) | `checkins/__tests__/BookingRow.test.tsx` | Covers render, room alloc, row click, notes; no room status test |
| usePrepareDashboard | Unit | `orchestrations/prepare/__tests__/usePrepareDashboard.test.ts` | Exists; **confirmed no assertions on clean-overwrite guard** — this is a known coverage gap to fill |

#### Coverage Gaps
- Untested paths:
  - Mark Clean button click → `saveRoomStatus` called with correct args
  - Auto-sync guard: occupied room with manual `clean: "Yes"` and today's `cleaned` timestamp is not overwritten
  - Cleanliness pill in `view/BookingRow`: renders "Clean" (green) / "Dirty" (red) / null (no status)
  - Error handling when `saveRoomStatus` throws
- Extinct tests: none

#### Recommended Test Approach
- Unit tests for: `CleaningPriorityTable` mark-clean button interaction; `view/BookingRow` cleanliness pill states; guard logic in `usePrepareDashboard` (via existing test file)
- Integration tests for: none required beyond unit coverage
- E2E tests for: not required (no E2E suite for reception currently)

### Recent Git History (Targeted)
- `CleaningPriorityTable.tsx` / `usePrepareDashboard.ts` / `view/BookingRow.tsx` — last 8 commits in these areas: theming fixes, audit/colour clashes, email column removal, DS migration. No recent changes to the cleaning status data path. No in-flight work overlapping this feature.

## Questions

### Resolved

- **Q: Does `roomAllocated` in `CheckInRow` hold a raw room number (e.g. "3") or a Firebase key (e.g. "index_3")?**
  - A: Raw number. Firebase key form (`index_3`) is constructed at point of use (confirmed by `useRoomAllocation` test using `oldRoom: "index_101"` with `roomAllocated: "101"`).
  - Evidence: `checkInRowSchema.ts`, `BookingRow.test.tsx:202`

- **Q: Does `useFirebaseSubscription` deduplicate across React hook instances?**
  - A: No. `useFirebaseSubscription` installs its own `onValue` listener per hook call instance. Multiple components each calling `useRoomStatusData()` create multiple Firebase listeners on the same path. The correct approach is one subscription at `CheckinsTable` level, passing `roomStatusMap` as a prop. This avoids listener sprawl and is consistent with how `bookingStatuses` is already prop-threaded.
  - Evidence: `useFirebaseSubscription.ts` (one `onValue` per `useEffect`, cleaned up on unmount)

- **Q: Is any new Firebase RTDB path or schema field needed?**
  - A: No. `/roomStatus/index_<room>` with `{ clean, cleaned }` already supports the mark-clean write. `cleaned` is an ISO timestamp string (`getItalyIsoString()`). The today-check guard must use `toEpochMillis(cleaned) >= todayTime` — not `isToday(cleaned)` which compares a `YYYY-MM-DD` string.
  - Evidence: `roomStatusSchema.ts`, `useRoomStatusMutations.ts`, `usePrepareDashboard.ts:315`

- **Q: Where should the `useRoomStatusData()` subscription live on the checkins side?**
  - A: `CheckinsTable.tsx` (controller), passed as `roomStatusMap` prop down through `CheckinsTableView` → `BookingRow` (container) → `view/BookingRow`. This keeps one subscription for all rows and follows the existing controller/view pattern.
  - Evidence: `CheckinsTable.tsx` architecture; existing `roomsReady` / `bookingStatuses` prop-passing pattern

- **Q: Is there an in-flight plan covering this area?**
  - A: No. Glob of `docs/plans/reception-*/` shows no active plan for prepare dashboard or cleaning status pipeline.
  - Evidence: Glob result above

### Open (Operator Input Required)
- **Q: Should the "Mark Clean" button be visible only on today's date, or also on past/future dates?**
  - Why operator input is required: This is a business workflow decision — whether cleaners ever need to retroactively or pre-emptively mark rooms.
  - Decision impacted: Whether the `isToday` flag gates the button's visibility.
  - Decision owner: Operator
  - Default assumption + risk: **Default: today only** (consistent with the existing `(Needs cleaning)` label being today-only). Risk: if staff work the next day's prep ahead of time, they can't mark rooms in advance.

## Confidence Inputs

- **Implementation: 88%**
  - Evidence: All affected files identified; write path (`saveRoomStatus`) and read path (`useRoomStatusData`) both exist and are used today; guard logic is straightforward. Gap: open question on today-only gating.
  - Raises to ≥90: Confirm the today-only default with operator.

- **Approach: 85%**
  - Evidence: One clear approach: add button to prepare table + guard to auto-sync + pill to checkins row. The only fork is subscription placement (CheckinsTable vs BookingRow), resolved to CheckinsTable level.
  - Raises to ≥90: No further approach forks exist after analysis confirms prop-threading path.

- **Impact: 90%**
  - Evidence: Feature solves a confirmed real workflow gap (verified via live browser audit). Cleaning staff workflow is immediate and observable. Impact is unambiguous.
  - Raises to ≥90: Already there.

- **Delivery-Readiness: 82%**
  - Evidence: No external dependencies; no schema migration; existing mutation and subscription hooks ready to use. 5–7 files touched. Open question on today-only gating is advisory (default is clear).
  - Raises to ≥90: Resolve open question.

- **Testability: 85%**
  - Evidence: All affected components are already tested with hook-mocking pattern. New tests follow existing patterns in `PrepareDashboard.test.tsx` and `BookingRow.test.tsx`. The auto-sync guard test can use the existing `usePrepareDashboard.test.ts` structure.
  - Raises to ≥90: Confirm test seam for the guard — `usePrepareDashboard` test already mocks `saveRoomStatus` indirectly via the mutation hook.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Auto-sync guard condition is wrong — `isToday()` compares YYYY-MM-DD but `cleaned` is a full ISO timestamp | Low (mitigated in plan) | Medium | Guard must use `toEpochMillis(dbStatus.cleaned) >= todayTime` — same pattern used at line ~315 of `usePrepareDashboard.ts` |
| Multiple BookingRow instances independently calling `useRoomStatusData()` causes Firebase listener sprawl | Low | Low | Resolved: single subscription at CheckinsTable level, map passed as prop |
| Stale roomStatusMap in BookingRow — real-time updates not reflected | Low | Low | Firebase RTDB `onValue` listener updates React state reactively; prop drilling from CheckinsTable propagates updates |
| "Mark Clean" button clicked on a room that has a checkout happening simultaneously | Low | Low | Idempotent write — worst case is auto-sync re-dirtying on next render cycle, but the guard prevents that for today |
| today-only gating default is wrong for the operator's workflow | Medium | Low | Open question flagged; default (today-only) is safe and matches existing behaviour elsewhere |

## Planning Constraints & Notes
- Must-follow patterns:
  - `memo` + `useCallback` on all new callbacks passed as props
  - DS semantic tokens only (`bg-success-main`, `text-danger-fg` etc.) — no raw hex
  - Controller/View split: hooks in container `BookingRow.tsx`, rendering in `view/BookingRow.tsx`
  - `saveRoomStatus` is async — button must show loading or optimistic state
- Rollout/rollback expectations:
  - No migration; Firebase writes are idempotent; Worker deploy is hot-swap. Rollback = revert deploy.
- Observability expectations:
  - Add `showToast("Failed to mark room as clean", "error")` on `saveRoomStatus` failure (existing utility at `apps/reception/src/utils/toastUtils.ts`)

## Suggested Task Seeds (Non-binding)

1. **GUARD** — Fix auto-sync overwrite bug in `usePrepareDashboard.ts`: before the occupant-dirty overwrite path, add guard `if (dbStatus.clean === "Yes" && toEpochMillis(dbStatus.cleaned) >= todayTime) return;` — `cleaned` is a full ISO timestamp so epoch comparison is required; `isToday()` must not be used here
2. **BUTTON** — Add "Mark Clean" button to `CleaningPriorityTable.tsx`: new prop `onMarkClean(roomNumber: string): void`; button visible when `isToday && isDirty`; calls `saveRoomStatus`
3. **PREPARE-WIRE** — Wire `onMarkClean` in `PrepareDashboard.tsx`: `usePrepareDashboardData()` already subscribes to `/roomStatus` internally; expose `roomStatusMap` in its return value (no second listener needed); call `useRoomStatusMutations()` directly in `PrepareDashboard` for `saveRoomStatus` (write-only, no subscription); pass `saveRoomStatus` as `onMarkClean` prop to `CleaningPriorityTable`
4. **CHECKINS-HOOK** — Add `useRoomStatusData()` to `CheckinsTable.tsx`; pass `roomStatusMap` down to `CheckinsTableView` → `BookingRow`
5. **PILL** — Add cleanliness pill to `view/BookingRow.tsx`: derive from `roomStatusMap[index_${booking.roomAllocated}]`; show green "Clean" / red "Dirty" / no-op if no status
6. **TESTS** — Unit tests for guard logic, mark-clean button, and cleanliness pill

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: All 6 task seeds implemented; guard test passes; mark-clean button test passes; pill test passes; typecheck + lint clean
- Post-delivery measurement plan: Manual verification on `/prepare-dashboard` (mark room clean → status updates) and checkins screen (pill appears correct)

## Evidence Gap Review

### Gaps Addressed
- Entry points: confirmed (`prepare-dashboard/page.tsx`, checkins route)
- Key modules: all 8 relevant files read and understood
- Data contracts: schema confirmed (`roomStatusSchema.ts`); no changes needed
- No subscription dedup in `useFirebaseSubscription`: confirmed via hook inspection — one `onValue` per instance; CheckinsTable-level subscription with prop-threading is the correct approach
- `CheckInRow.roomAllocated` field: confirmed as raw room number
- Test landscape: existing test files read; coverage gaps identified
- In-flight plan overlap: confirmed none

### Confidence Adjustments
- Implementation raised from initial 80% → 88% after confirming `saveRoomStatus` is already used in `usePrepareDashboard` (write path proven)
- Approach raised from 80% → 85% after resolving subscription placement (CheckinsTable level)

### Remaining Assumptions
- `roomAllocated` field is populated for all active check-ins — if it's null, the pill simply renders nothing (graceful fallback)
- `usePrepareDashboardData()` exposes `roomStatusMap` in its return value after the PREPARE-WIRE task; no second Firebase subscription is created on the prepare side

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points (`/prepare-dashboard`, checkins route) | Yes | None | No |
| `CleaningPriorityTable` — add Mark Clean button | Yes | None | No |
| `usePrepareDashboard` — auto-sync guard | Yes | None | No |
| `useRoomStatusData` — subscription hook | Yes | None | No |
| `useRoomStatusMutations` — write path | Yes | None | No |
| `CheckInRow.roomAllocated` → Firebase key mapping | Yes | None | No |
| `CheckinsTable` — subscription location decision | Yes | None — subscription must live at CheckinsTable level (not per-row); prop-threading required through CheckinsTableView → BookingRow (2 prop additions) | No |
| `view/BookingRow` — cleanliness pill | Yes | None | No |
| Test landscape | Yes | [Minor] `usePrepareDashboard.test.ts` has no guard assertions — confirmed known gap to fill | No |
| Prepare-side wiring (saveRoomStatus + roomStatusMap) | Yes | None — `usePrepareDashboardData()` already subscribes to `/roomStatus` internally; expose `roomStatusMap` in its return value (no second listener needed); `PrepareDashboard` calls `useRoomStatusMutations()` directly for `saveRoomStatus` (write-only, no subscription overhead) | No |
| Schema backward compatibility | Yes | None | No |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** 5–7 files, no external deps, existing mutation and subscription hooks cover the implementation surface. The single open question (today-only gating) is advisory with a clear default. No architectural branching except subscription placement (resolved). Delivery-Readiness 82% will reach ≥85 after analysis confirms prop-threading path.

## Analysis Readiness
- **Status: Ready-for-analysis**
- Blocking items: none
- Recommended next step: `/lp-do-analysis reception-room-cleaning-status-pipeline`
