---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-occupancy-strip
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-roomgrid-occupancy-strip/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-002
---

# Reception Rooms-Grid Occupancy Strip Fact-Find Brief

## Scope

### Summary

Add a compact occupancy count strip to the `/rooms-grid` page in the reception app showing how many rooms are occupied tonight (e.g. "Occupied tonight: 12 / 15 rooms"). Staff currently have no at-a-glance summary and must count occupied cells in the grid manually.

The feature is a new read-only UI component inserted into `RoomsGrid.tsx`. It derives the count entirely from data already loaded by `useGridData` — no new Firebase queries or API calls are needed.

### Goals

- Display occupied room count vs total rooms for the current date (today relative to startDate/endDate window)
- Use existing hook data (`allRoomData` / `getReservationDataForRoom`) for zero additional fetches
- Insert the strip below `<StatusLegend />` and above `<DndProvider>` in `RoomsGrid.tsx`
- Follow DS layout primitives (`Cluster`, `Inline`, `Stack`) — no raw flex divs

### Non-goals

- Per-day occupancy column (the dispatch mentions a "row of daily totals" but P3 scoping keeps this to tonight-only count strip)
- Colour-coded daily grid (deferred to a future iteration)
- New Firebase reads, API routes, or server-side data fetching
- Unallocated occupants counted as occupying rooms (they have no `allocated` room)

### Constraints & Assumptions

- Constraints:
  - No raw flex/grid CSS — DS primitives only (ds/enforce-layout-primitives lint rule)
  - No inline `style={{...}}` attributes
  - Tests written for CI; no local jest execution
  - Writer lock required for all commits
- Assumptions:
  - "Tonight" = today's date falls within `[startDate, endDate]` window; if today is outside the window, no occupancy indicator is shown (or a neutral "–" count is shown)
  - "Occupied" means any booking period where the period's date range overlaps today AND status is NOT `free`, `disabled`, or `16` (bags-picked-up / effectively departed)
  - `14` (checkout complete) is treated as occupied for tonight if the guest has not yet departed (checkout day itself is ambiguous — we count it as occupied to avoid under-counting)
  - Total room count = `knownRooms.length` (10 rooms: 3–12)

## Access Declarations

None: local code path only.

## Current Process Map

None: local code path only. No multi-step workflow, CI lane, approval path, or operator runbook is affected.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/rooms-grid/page.tsx` (or equivalent) — renders `<RoomsGrid />` component
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — the layout host; this is where the strip will be inserted

### Key Modules / Files

- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — renders `StatusLegend`, `DndProvider`, per-room `RoomGrid`. Hook `useGridData` called here. New `<OccupancyStrip />` is inserted between `StatusLegend` and `DndProvider`.
- `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — returns `getReservationDataForRoom`, `unallocatedOccupants`, `testDates`, `loading`, `error`. Also exports `allRoomData` (internal) and `packBookingsIntoRows`.
- `apps/reception/src/hooks/client/checkin/useRoomConfigs.ts` — returns `knownRooms` (10 rooms: "3"–"12"), `getBedCount`, `getMaxGuestsPerBed`.
- `apps/reception/src/types/MyLocalStatus.ts` — union type: `"free" | "disabled" | "awaiting" | "confirmed" | "1" | "8" | "12" | "14" | "23" | "16"`
- `apps/reception/src/components/roomgrid/constants/statusColors.ts` — maps each `MyLocalStatus` to a CSS color. `free → transparent`, `16 → hsl(var(--color-fg-muted))`, `14 → hsl(var(--color-border))`, all others → accent colors.
- `apps/reception/src/components/roomgrid/StatusLegend.tsx` — existing legend component placed above room grids; occupancy strip will go below it.
- `apps/reception/src/components/roomgrid/__tests__/RoomsGrid.test.tsx` — existing RTL tests that mock `useGridData` and `useRoomConfigs`; test for strip behavior must be added here or in a dedicated file.
- `apps/reception/src/utils/dateUtils.ts` — exports `generateDateRange`, `addDays`, `formatDateForInput`, `getYesterday`, `toEpochMillis`, `dateRangesOverlap`.

### Patterns & Conventions Observed

- DS layout primitives `Cluster`, `Inline`, `Stack` imported from `@acme/design-system/primitives` — used throughout `RoomsGrid.tsx` already
- `useGridData` is the single hook responsible for all room-booking state; it already calls `useRoomConfigs` internally and constructs `allRoomData` per room
- All loading/error gating is at the `RoomsGrid` level; child components receive already-resolved data
- Tests use `jest.mock` to stub `useGridData` and `useRoomConfigs` returning minimal fixtures
- `data-cy` attribute (not `data-testid`) per jest.setup.ts configure call

### Data & Contracts

- Types/schemas/events:
  - `MyLocalStatus` — the full status union; occupied-relevant statuses: `"awaiting" | "confirmed" | "1" | "8" | "12" | "14" | "23"`; non-occupied: `"free" | "disabled" | "16"`
  - `TBookingPeriod` — `{ start: string; end: string; status: MyLocalStatus; bookingRef: string; occupantId: string; firstName: string; lastName: string; info: string; color: string }`
  - `GridReservationRow` — `{ id: string; title: string; info: string; startDate: string; endDate: string; color?: string; periods: TBookingPeriod[] }`
- Persistence: None — all data comes from `useGridData` which reads from Firebase via `useBookingsData`, `useGuestByRoomData`, etc.
- API/contracts: None new.

### Dependency & Impact Map

- Upstream dependencies:
  - `useGridData(startDate, endDate)` — provides booking periods per room
  - `useRoomConfigs()` — provides `knownRooms` (total room count)
  - `startDate`, `endDate` — date window state from `RoomsGrid` component
- Downstream dependents:
  - None: `OccupancyStrip` is a new leaf component with no consumers
- Likely blast radius:
  - Only `RoomsGrid.tsx` is modified (to add the strip import and render)
  - New file `OccupancyStrip.tsx` added
  - New test file `__tests__/OccupancyStrip.test.tsx` added
  - No existing tests are broken (strip is additive)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (RTL)
- Commands: `pnpm --filter @apps/reception test` (CI only)
- CI integration: GitHub Actions via `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| RoomsGrid layout + date controls | Unit/RTL | `__tests__/RoomsGrid.test.tsx` | Mocks useGridData, useRoomConfigs. Tests date wiring, RoomGrid props, UnallocatedPanel conditional. |
| RoomGrid (per-room) | Unit/RTL | `__tests__/RoomGrid.test.tsx` | Modal open/close, theme classes, empty data. |
| UnallocatedPanel | Unit/RTL | `__tests__/UnallocatedPanel.test.tsx` | Renders occupant list. |
| StatusLegend | Not found | — | No dedicated test found. |
| useGridData (hook logic) | Unit | Not found as dedicated file | Covered via RoomsGrid integration-style tests. |

#### Coverage Gaps

- Untested paths:
  - Occupancy count computation (new logic to be added in `OccupancyStrip`)
  - Strip rendering when today is outside the date window
  - Strip rendering when loading or error state
- Extinct tests: None — adding tests is purely additive.

#### Testability Assessment

- Easy to test:
  - `OccupancyStrip` takes computed props (occupiedCount, totalRooms) — pure render component, straightforward RTL test
  - Count computation logic can be extracted to a pure utility function and unit-tested in isolation
- Hard to test: None beyond standard RTL constraints
- Test seams needed: Strip should accept `occupiedCount` and `totalRooms` as props (not call hooks internally) so tests can control inputs without additional mocking

#### Recommended Test Approach

- Unit tests for: `computeOccupancyCount(allRoomData, knownRooms, today)` utility function
- Unit tests for: `<OccupancyStrip occupiedCount={N} totalRooms={M} />` rendering (count display, "all occupied" variant, zero variant)
- Integration tests for: `OccupancyStrip` visible in `RoomsGrid` when data is loaded

### Recent Git History (Targeted)

- `apps/reception/src/components/roomgrid/` — `a8b74fe` (feat: add UnallocatedPanel tests, useGridData.unallocatedOccupants, RoomsGrid wiring), `e5ddbd5` (feat: wire UnallocatedPanel into RoomsGrid above room list). Pattern: additive components inserted alongside existing grid elements follow the same pattern we will use for OccupancyStrip.
- `dc1c11b` — DS primitives migration for roomgrid. All layout primitives already in place; new strip must follow same pattern.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `RoomsGrid.tsx` uses DS primitives (`Cluster`, `Inline`, `Stack`). `StatusLegend` pattern gives a reference for a compact strip above the grid. | Strip must use DS primitives only; no raw flex. Color choice for the strip label/number needs token-based colors only. | Confirm strip placement (below StatusLegend, above DndProvider); define visual treatment in plan task. |
| UX / states | Required | Grid shows loading/error states at `RoomsGrid` level. Existing pattern: strip only renders when `!loading && error == null`. | Need empty-state (0 occupied), full-house state (all occupied), and today-outside-window state. | Address all states in OccupancyStrip component and plan task. |
| Security / privacy | N/A | Internal staff tool, no auth boundary change, no new data exposed beyond what the grid already displays. | None. | — |
| Logging / observability / audit | N/A | No new data mutation or external calls. Purely derived UI. | None. | — |
| Testing / validation | Required | Existing RTL suite for RoomsGrid mocks useGridData. OccupancyStrip will need its own RTL test. | New test file required for OccupancyStrip; RoomsGrid.test may need update to assert strip renders. | Write OccupancyStrip.test.tsx covering count display, zero, and full-house cases. |
| Data / contracts | Required | `allRoomData: Record<string, GridReservationRow[]>` already available inside `useGridData`. The hook does not expose `allRoomData` directly — `getReservationDataForRoom` exposes per-room data. To aggregate, we call `getReservationDataForRoom` per room in `RoomsGrid`. | Count logic needs to iterate `knownRooms`, call `getReservationDataForRoom(room)` for each, inspect `periods` for today overlap and occupied status. No schema change required. | Plan must specify the occupancy computation algorithm precisely. |
| Performance / reliability | Required | `useGridData` already memoises `allRoomData` with `useMemo`. Occupancy count is O(rooms × bookings_per_room) — bounded and cheap. | None material; memoisation of derived count via `useMemo` is recommended. | Add `useMemo` to count derivation in plan task. |
| Rollout / rollback | Required | Reception is deployed as a Cloudflare Worker. No feature flag system exists. Strip is additive; rollback = revert commit. | No feature flag needed; change is additive and visual-only. | Document rollback = git revert in plan. |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point: `RoomsGrid.tsx` layout and hook wiring | Yes | None | No |
| Hook data: `useGridData` return shape and `getReservationDataForRoom` | Yes | None — allRoomData is internal; per-room access via getReservationDataForRoom is the correct access pattern | No |
| Status taxonomy: which statuses = occupied | Yes | `"free"`, `"disabled"`, `"16"` are non-occupied. All others are occupied-state. `"14"` (checkout complete) counts as occupied for the night (conservative). | No |
| Total room count source: `knownRooms` | Yes | 10 rooms: "3", "4", "5", "6", "7", "8", "9", "10", "11", "12" | No |
| DS primitive compliance | Yes | `Cluster`, `Inline`, `Stack` already imported in RoomsGrid. New component must import from same package. | No |
| Test seam: props vs hooks | Yes | OccupancyStrip should accept computed props; computation belongs in RoomsGrid or a utility to allow clean testing. | No |
| Date window / today logic | Partial | `startDate` defaults to yesterday; "today" within the window is `formatDateForInput(new Date())`. Minor: need to confirm how "today" is compared to period start/end (period end = checkout date; a guest checking out today is still counted as occupied). | No |

## Scope Signal

constrained

## Outcome Contract

- **Why:** Staff using the rooms grid have no at-a-glance view of how many rooms are occupied tonight. They must count occupied cells across all 10 rooms manually — a slow and error-prone task when deciding whether to push discounts, adjust minimum stays, or block availability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A compact occupancy count strip appears on the rooms-grid page showing the number of occupied rooms vs total rooms for the current date, derived from existing booking data without additional network requests.
- **Source:** auto

## Confidence Inputs

- Implementation: 90% — The approach is clear: new leaf component, props-driven, inserted between StatusLegend and DndProvider. No new data dependencies. Would reach 95% once OccupancyStrip is wired and typechecks pass.
- Approach: 92% — Deriving count from existing hook data is validated; `getReservationDataForRoom` is the correct access pattern. Already ≥90 — no additional evidence needed.
- Impact: 85% — Staff benefit is real (removes manual counting). Risk is near-zero (additive, read-only UI). Reaches 90% once strip is visible in the reception app.
- Delivery-Readiness: 90% — All data, hooks, and patterns are understood. Implementation is straightforward. Already ≥90.
- Testability: 90% — Component accepts computed props; pure utility function for count logic is easily unit-tested. Already ≥90.

## Open Questions

No operator-input-required questions remain. All questions resolved from evidence:

### Resolved

- Q: Does `useGridData` expose `allRoomData` directly?
  - A: No. It exposes `getReservationDataForRoom(room)` per room. `allRoomData` is an internal memoised `Record<string, GridReservationRow[]>`. The correct pattern is to call `getReservationDataForRoom` per room in `RoomsGrid`, matching what `RoomsGrid` already does for rendering.
  - Evidence: `apps/reception/src/hooks/data/roomgrid/useGridData.ts` lines 397–400, 407

- Q: Which statuses count as "occupied"?
  - A: All statuses except `"free"`, `"disabled"`, and `"16"` (bags picked up / effectively departed). Confirmed occupied statuses: `"awaiting"`, `"confirmed"`, `"1"`, `"8"`, `"12"`, `"14"`, `"23"`.
  - Evidence: `apps/reception/src/types/MyLocalStatus.ts`, `apps/reception/src/components/roomgrid/constants/statusColors.ts`

- Q: Can the count be derived without new Firebase queries?
  - A: Yes. `useGridData` already loads all bookings for the visible date window. The count is a client-side derivation over already-loaded data.
  - Evidence: `apps/reception/src/hooks/data/roomgrid/useGridData.ts`

- Q: How many total rooms are there?
  - A: 10 rooms (strings "3" through "12"). Total bed capacity is 49 beds. The strip reports rooms, not beds.
  - Evidence: `apps/reception/src/hooks/client/checkin/useRoomConfigs.ts`

- Q: Where in `RoomsGrid.tsx` should the strip be inserted?
  - A: Below `<StatusLegend />` and above `<DndProvider>`. This mirrors the pattern used for `UnallocatedPanel` (which is inside DndProvider). The strip is non-draggable UI so it belongs outside DndProvider.
  - Evidence: `apps/reception/src/components/roomgrid/RoomsGrid.tsx` lines 92–124

## Evidence Gap Review

### Gaps Addressed

- Status taxonomy fully audited from `MyLocalStatus.ts` and `statusColors.ts`.
- Hook data shape confirmed from `useGridData.ts` source.
- Insertion point confirmed from `RoomsGrid.tsx` JSX tree.
- Test seam confirmed: props-driven component is cleanly testable.

### Confidence Adjustments

- No downward adjustments. All evidence found in repository. No external dependencies.

### Remaining Assumptions

- "Today" is determined client-side using `new Date()` formatted via `formatDateForInput`. This matches the existing `startDate`/`endDate` patterns in `dateUtils.ts`.
- `"14"` (checkout complete) is counted as occupied — this is conservative and aligns with how the grid displays checked-out guests (they remain visible in the grid until `"16"` status).

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis` — compare approach options (derive from existing hook vs new Firebase query) and select the no-new-query approach.
