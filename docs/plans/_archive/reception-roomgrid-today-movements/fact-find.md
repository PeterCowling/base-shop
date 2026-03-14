---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-today-movements
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-roomgrid-today-movements/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-003
Trigger-Why: Staff must manually scan each room's timeline to identify today's arrivals and departures — there is no summary view.
Trigger-Intended-Outcome: type: operational | statement: A "Today's Movements" section on the rooms-grid page lists guests arriving (check-in date = today) and departing (check-out date = today) with room numbers and guest names, eliminating the need to scan room timelines manually. | source: operator
---

# Today's Movements Summary — Fact-Find Brief

## Scope
### Summary
Add a compact "Today's Movements" panel to the `/rooms-grid` page that shows which guests are checking in today and which are checking out today. All required data is already available in `useGridData` — no new data fetching is needed.

### Goals
- Surface today's arrivals (periods where `start === today`) and departures (periods where `end === today`) in one compact view.
- Eliminate the need for staff to scan each room's timeline cell-by-cell.
- Fit within the existing DS-primitive layout patterns used by `OccupancyStrip` and `UnallocatedPanel`.

### Non-goals
- No new Firebase queries or data fetching.
- No edit/action capability — read-only display only.
- No historical movements (not yesterday, not tomorrow).

### Constraints & Assumptions
- Constraints:
  - The `ds/enforce-layout-primitives` lint rule disallows raw flex/grid layout classes on leaf div elements — `Cluster`, `Inline`, and `Stack` from `@acme/design-system/primitives` must be used for layout. Plain `div`, `span`, `label` elements are permitted for semantics/accessibility, consistent with the rest of the roomgrid codebase.
  - Tests must be written but NOT run locally (CI-only per testing policy).
  - All commits via `scripts/agents/with-writer-lock.sh`.
- Assumptions:
  - `period.start` = check-in date (YYYY-MM-DD, inclusive); `period.end` = check-out date (YYYY-MM-DD, exclusive per `OccupancyStrip` convention).
  - "Departing today" = `period.end === today` (the guest's last occupied night was yesterday; they leave today).
  - "Arriving today" = `period.start === today`.
  - Guest name can be absent (empty string); fall back to "Unknown".

## Outcome Contract

- **Why:** Staff must manually scan each room timeline to find today's check-ins and check-outs; there is no summary. This creates friction during busy arrival/departure windows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A "Today's Movements" section on the rooms-grid page lists arrivals (check-in date = today) and departures (check-out date = today) with room numbers and guest names, eliminating manual timeline scanning.
- **Source:** operator

## Current Process Map

None: local code path only.

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — top-level rooms-grid page component; renders `StatusLegend`, `OccupancyStrip`, `UnallocatedPanel`, and one `RoomGrid` per room. This is the insertion point for `TodayMovements`.
- `/rooms-grid` route — `apps/reception/src/app/rooms-grid/page.tsx` → `apps/reception/src/app/rooms-grid/RoomsGridClient.tsx` → `RoomsGrid`.

### Key Modules / Files
- `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — returns `getReservationDataForRoom`, `unallocatedOccupants`, `loading`, `error`. The internal `allRoomData` (type `Record<string, GridReservationRow[]>`) contains all periods across all rooms.
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — wiring point; already imports `formatDateForInput`, already computes `today`.
- `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` — closest design analogue; uses `Inline` from DS primitives; accepts computed values as props.
- `apps/reception/src/components/roomgrid/UnallocatedPanel.tsx` — renders a list of guests without rooms; shows pattern for iterating over occupants.
- `apps/reception/src/hooks/client/checkin/useRoomConfigs.ts` — provides `knownRooms` array (`["3","4","5","6","7","8","9","10","11","12"]`).
- `apps/reception/src/types/MyLocalStatus.ts` — status union type.
- `apps/reception/src/components/roomgrid/constants/statusColors.ts` — color map per status.

### Patterns & Conventions Observed
- DS layout primitives enforced — `Cluster`, `Inline`, `Stack` used in `RoomsGrid.tsx`, `OccupancyStrip.tsx`, `UnallocatedPanel.tsx`.
- Pure display components with computed data passed as props (OccupancyStrip pattern) — suits `TodayMovements`.
- `today` is already computed in `RoomsGrid` as `formatDateForInput(new Date())`.
- `getReservationDataForRoom(room)` returns `GridReservationRow[]`; each row has `periods: TBookingPeriod[]` with `start`, `end`, `firstName`, `lastName`.
- `knownRooms` already available in `RoomsGrid` via `useRoomConfigs`.
- Tests use `jest.useFakeTimers` + `jest.setSystemTime` for deterministic date testing (see `RoomsGrid.test.tsx`).
- `/* eslint-disable ds/no-raw-color -- test fixtures */` comment pattern in test files with colour literals.

### Data & Contracts
- Types/schemas/events:
  - `TBookingPeriod` (from `useGridData.ts`): `{ start: string, end: string, status: MyLocalStatus, bookingRef: string, occupantId: string, firstName: string, lastName: string, info: string, color: string }`.
  - `GridReservationRow`: `{ id, title, info, startDate, endDate, color?, periods: TBookingPeriod[] }`.
  - `MyLocalStatus`: union of `"free" | "disabled" | "awaiting" | "confirmed" | "1" | "8" | "12" | "14" | "23" | "16"`.
- Persistence: None — all data computed from Firebase streams in `useBookingsData`, `useGuestsDetailsData`, `useGuestByRoomData`, `useActivitiesData`.
- API/contracts: `getReservationDataForRoom: (room: string) => GridReservationRow[]` — stable callable, already used in `RoomsGrid`. **Note:** `useGridData` does NOT expose `allRoomData` directly. The seam for `TodayMovements` is: compute arrivals/departures in `RoomsGrid` by calling `getReservationDataForRoom` across `knownRooms`, then pass the resulting `TodayMovementEntry[]` arrays as props to `TodayMovements`. This avoids widening the hook API. The prop contract for `TodayMovements` will be: `{ arrivals: TodayMovementEntry[], departures: TodayMovementEntry[] }` where `TodayMovementEntry = { room: string, occupantId: string, firstName: string, lastName: string }`. Including `occupantId` (from `TBookingPeriod`) ensures stable React render keys even when multiple guests fall back to "Unknown".

  **Grid-window coupling accepted:** `useGridData` filters to `startDate`/`endDate` before building `getReservationDataForRoom`. If staff scroll the grid away from today, `todayInWindow` becomes false and the panel is hidden — consistent with `OccupancyStrip` behaviour. This is accepted as correct: the panel is a contextual overlay of today's portion of the grid, not a standalone independent view. The requirement is to reduce manual scanning of the grid when today is visible, which matches this scoping. Analysis will document this decision explicitly.

### Dependency & Impact Map
- Upstream dependencies:
  - `useGridData` hook — provides all reservation rows.
  - `useRoomConfigs` hook — provides `knownRooms` list.
  - `formatDateForInput` utility — already imported in `RoomsGrid`.
- Downstream dependents:
  - `RoomsGrid.tsx` modified to mount `TodayMovements`.
  - No other dependents — new `TodayMovements` component is leaf-level.
- Likely blast radius:
  - Confined to `RoomsGrid.tsx` (one import + one JSX element) and new `TodayMovements.tsx`.
  - No type changes to existing contracts.
  - No existing tests broken.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library (reception app).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (CI only).
- CI integration: runs in GitHub Actions on push.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| RoomsGrid | Unit/render | `__tests__/RoomsGrid.test.tsx` | Covers date state, UnallocatedPanel wiring, loading/error |
| OccupancyStrip | Unit | `__tests__/OccupancyStrip.test.tsx` | Covers compute logic + render |
| UnallocatedPanel | Unit | `__tests__/UnallocatedPanel.test.tsx` | Covers occupant list rendering |

#### Coverage Gaps
- Untested paths:
  - `TodayMovements` component (new — to be tested in new test file).
  - `RoomsGrid` wiring: that the computed arrivals/departures arrays are passed correctly to `TodayMovements` (to be asserted in existing `RoomsGrid.test.tsx` via mock of `TodayMovements`).
- Extinct tests: None.

#### Testability Assessment
- Easy to test:
  - `TodayMovements` is a pure display component; test by passing fixture `arrivals: TodayMovementEntry[]` + `departures: TodayMovementEntry[]` props directly.
  - Period matching logic (`start === today`, `end === today`) is pure string comparison — trivially testable.
  - `RoomsGrid` integration: mock `TodayMovements` in `RoomsGrid.test.tsx` and assert it receives the correct props when grid data contains today's movements.
- Hard to test: None.
- Test seams needed:
  - `jest.useFakeTimers` pattern already exists in `RoomsGrid.test.tsx` — re-use for `TodayMovements.test.tsx`.
  - `TodayMovements` must accept typed props (not derive from hooks internally) to enable isolated unit testing.

#### Recommended Test Approach
- Unit tests for: `TodayMovements` — arrivals list, departures list, empty state (both lists empty), unknown guest name fallback.
- Integration tests for: `RoomsGrid` wiring assertion — mock `TodayMovements` in `RoomsGrid.test.tsx`; confirm component renders when arrivals/departures are present; confirm omitted when `todayInWindow` is false.
- E2E tests for: Not in scope.
- Contract tests for: Not applicable.

### Recent Git History (Targeted)
- `apps/reception/src/components/roomgrid/` — `d3883fb` added `OccupancyStrip` (same pattern as planned `TodayMovements`).
- `apps/reception/src/components/roomgrid/` — `a8b74fe` added `UnallocatedPanel` tests and wiring into `RoomsGrid`.
- Both recent additions confirm the DS-primitives-only and pure-props-display pattern is stable and accepted.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | DS primitives used throughout roomgrid; `OccupancyStrip` is closest analogue for layout | No gap — follows same Inline/Stack pattern | Confirm DS-only layout in component design |
| UX / states | Required | `OccupancyStrip` only renders when `todayInWindow`; `UnallocatedPanel` hidden when empty | Empty state (no arrivals/departures) must render gracefully — needs explicit text | Define empty-state copy ("No arrivals today", "No departures today") |
| Security / privacy | N/A | Reception app is internal, access-controlled by operator login; no new data surface | No new exposure — reads existing in-memory data | — |
| Logging / observability / audit | N/A | No async operations, no mutations; pure read-only display derived from existing data | No new observability needed | — |
| Testing / validation | Required | Jest + RTL pattern established; `OccupancyStrip.test.tsx` is the closest test pattern | New component needs unit test file | Write `TodayMovements.test.tsx` covering 4 TCs |
| Data / contracts | Required | `TBookingPeriod.start` / `.end` are stable YYYY-MM-DD strings; `getReservationDataForRoom` API stable | No schema changes — reads existing period fields | Confirm `period.end === today` semantics (exclusive end means departure = today) |
| Performance / reliability | N/A | Computation is O(rooms × beds × periods) — bounded by ~10 rooms × ~8 beds × few periods; no async | No performance risk at this scale | — |
| Rollout / rollback | Required | Reception app deploys as Cloudflare Worker; no feature flags present in codebase | Rollback = revert commit; no migration or flag needed | Plan for direct revert as rollback path |

## Confidence Inputs
- Implementation: 95% — all data already available; component follows established patterns.
- Approach: 92% — deriving from `getReservationDataForRoom` is the established pattern (identical to `computeOccupancyCount`).
- Impact: 85% — directly addresses stated pain; value depends on actual arrival/departure density.
- Delivery-Readiness: 90% — no blockers; patterns are clear.
- Testability: 92% — pure component with string-match logic; highly testable.

What raises each to >=80: All already at or above 85%.
What raises each to >=90: Implementation/Testability already >=90; Impact would reach 90 with reception staff validation that the panel is used daily.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `period.end === today` semantics mismatch | Low | Medium | OccupancyStrip uses `today < end` (exclusive end); departures use `end === today` — same convention, confirmed by OccupancyStrip comment in source |
| Periods across packed rows duplicated | Low | Low | `packBookingsIntoRows` merges periods into rows; flat-iterating all periods from all rows of a room will naturally include all occupants. Filter by room+period is sufficient. |
| Guest name absent | Low | Low | `firstName`/`lastName` default to `""` in `useGridData` — fall back to "Unknown" string in render |

## Planning Constraints & Notes
- Must-follow patterns:
  - `ds/enforce-layout-primitives` lint rule: use `Cluster`, `Inline`, `Stack` for layout; plain `div`/`span`/`label` are permitted for semantic/accessibility markup.
  - `TodayMovements` accepts computed arrays as props — `arrivals: TodayMovementEntry[]`, `departures: TodayMovementEntry[]` (type defined in `TodayMovements.tsx`). No hook calls inside the component.
  - `TodayMovementEntry = { room: string, occupantId: string, firstName: string, lastName: string }` — `occupantId` included for stable React render keys.
  - `RoomsGrid` computes arrivals/departures by iterating `knownRooms` → `getReservationDataForRoom(room)` → flat-mapping all periods → filtering by `period.start === today` (arrivals) and `period.end === today` (departures). This is the same access pattern used for `computeOccupancyCount`.
  - `today` is already in `RoomsGrid` scope as `formatDateForInput(new Date())`.
  - `TodayMovements` only renders when `todayInWindow && !loading && error == null` (same guard as `OccupancyStrip`). Grid-window coupling is accepted behaviour — panel is a contextual overlay of the visible grid.
- Rollout/rollback expectations:
  - Direct commit revert; no migration or feature flag needed.
- Observability expectations:
  - None required for a read-only display component.

## Suggested Task Seeds (Non-binding)
- TASK-01: Create `TodayMovements.tsx` + wire into `RoomsGrid.tsx` + write `TodayMovements.test.tsx`.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| useGridData data shape | Yes | None | No |
| RoomsGrid wiring point | Yes | None | No |
| DS primitives constraint | Yes | None | No |
| Period date semantics (start/end) | Yes | None | No |
| Empty state handling | Yes | None | No |
| Test infrastructure | Yes | None | No |
| Blast radius (no existing tests broken) | Yes | None | No |

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis`
