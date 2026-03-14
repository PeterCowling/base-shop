---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-occupancy-strip
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-roomgrid-occupancy-strip/fact-find.md
Related-Plan: docs/plans/reception-roomgrid-occupancy-strip/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Rooms-Grid Occupancy Strip Analysis

## Decision Frame

### Summary

How should the occupancy count for tonight be computed and displayed on the rooms-grid page? The fact-find confirmed that all required data is already available in `useGridData`. The core decision is: derive the count client-side from the existing hook, or introduce a new Firebase query. A secondary decision is the component shape: props-driven leaf vs hook-calling component.

### Goals

- Display occupied room count vs total rooms for the current date
- Zero additional network requests beyond what already loads
- Purely additive change — no existing behaviour modified
- Clean test seam: computation logic is separately testable

### Non-goals

- Per-day occupancy grid/heatmap (deferred to future iteration)
- Colour-coded occupancy spectrum per date
- New API endpoints or server routes

### Constraints & Assumptions

- Constraints:
  - DS primitives only (`Cluster`, `Inline`, `Stack` from `@acme/design-system/primitives`). No raw flex or inline styles.
  - Typecheck + lint must pass locally before commit.
  - Tests written for CI; no local jest execution.
- Assumptions:
  - "Tonight" = today's date (client-side `new Date()` formatted to `yyyy-MM-dd`)
  - A room is "occupied tonight" if it has at least one `GridReservationRow` with a `TBookingPeriod` where `period.start <= today < period.end` AND `period.status` is not in `{"free", "disabled", "16"}`
  - Total room count = `knownRooms.length` (10)

## Inherited Outcome Contract

- **Why:** Staff using the rooms grid have no at-a-glance view of how many rooms are occupied tonight. They must count occupied cells manually when deciding whether to push discounts, adjust minimum stays, or block availability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A compact occupancy count strip appears on the rooms-grid page showing the number of occupied rooms vs total rooms for the current date, derived from existing booking data without additional network requests.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-roomgrid-occupancy-strip/fact-find.md`
- Key findings used:
  - `useGridData` does not expose `allRoomData` directly; `getReservationDataForRoom(room)` is the correct per-room access pattern
  - Occupied statuses: everything except `"free"`, `"disabled"`, `"16"`
  - 10 total rooms (`knownRooms` from `useRoomConfigs`)
  - Insertion point: below `<StatusLegend />`, above `<DndProvider>`
  - DS primitives already imported in `RoomsGrid.tsx`

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Zero new network requests | Reception data loads slowly from Firebase; any new query degrades perceived performance | High |
| Testability | Props-driven components are trivially testable; hook-calling components require more mocking surface | High |
| Implementation simplicity | P3 feature; should not introduce architectural complexity | High |
| Accuracy | The count should correctly reflect tonight's occupancy given the booking data already loaded | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Derive from existing hook data (client-side, zero new queries) | Compute occupancy count in `RoomsGrid` from already-loaded `getReservationDataForRoom` data; pass `occupiedCount` + `totalRooms` as props to a new `OccupancyStrip` leaf component | Zero additional fetches; clean prop interface; easy to unit-test; additive only | Count is only as current as the already-loaded data (same currency as the grid itself) | Today might fall outside the selected date window — handle with a null/absent state in the strip | Yes |
| B — New Firebase query for tonight's occupancy | Add a new `useOccupancyData` hook that queries Firebase independently for tonight's bookings | Could be slightly more targeted | Adds a new subscription, new loading state, new error path, new mocking surface in tests; all data is already available from Option A | Increased complexity, extra cost, and slower load time with no accuracy benefit | No — rejected |

## Engineering Coverage Comparison

| Coverage Area | Option A (derive from hook) | Option B (new query) | Chosen implication |
|---|---|---|---|
| UI / visual | New leaf component `OccupancyStrip`, DS primitives, token-based colors | Same | Minimal: one new component using established DS patterns |
| UX / states | Strip shows count, zero-occupied, full-house, today-outside-window states; no new loading spinner needed | Adds a second loading spinner for strip data independently | Option A: no new loading state; strip defers to RoomsGrid loading gate |
| Security / privacy | N/A — internal staff tool, no new data pathway | N/A | N/A |
| Logging / observability / audit | N/A — read-only derived UI | N/A — same | N/A |
| Testing / validation | Props-driven component: count logic in pure utility function; strip renders props directly — straightforward RTL test | Requires mocking new Firebase hook; more test surface | Option A is far simpler to test |
| Data / contracts | No schema or type changes; uses existing `GridReservationRow[]` and `TBookingPeriod` | Would require new types/hook contract | Option A: zero contract changes |
| Performance / reliability | `useMemo` for count derivation; O(rooms × bookings) — bounded; no new I/O | Extra Firebase subscription; adds latency | Option A is clearly superior |
| Rollout / rollback | Additive — revert commit to rollback | Same | Git revert is the rollback mechanism |

## Chosen Approach

- **Recommendation:** Option A — derive occupancy count client-side from `getReservationDataForRoom` data already loaded by `useGridData`.
- **Why this wins:** All data is already available. Zero new network requests. Props-driven component with a pure computation utility is trivially testable. The count is exactly as current as the rest of the grid (same data source), which is correct and expected. Option B adds complexity with no accuracy or performance benefit.
- **What it depends on:** `useGridData(startDate, endDate)` being called in `RoomsGrid` (it already is); `getReservationDataForRoom` returning `GridReservationRow[]` per room (confirmed); `knownRooms` from `useRoomConfigs` (already available in `RoomsGrid`).

### Rejected Approaches

- Option B (new Firebase query) — All required data is already loaded by `useGridData`. A second query adds latency, a new error/loading state, additional test mocking surface, and no accuracy benefit over the data already in memory.

### Open Questions (Operator Input Required)

None. All questions resolved from evidence in the fact-find.

## End-State Operating Model

None: no material process topology change. The strip is a read-only additive UI element on an existing page. No workflow, approval path, or runbook is affected.

## Planning Handoff

- Planning focus:
  - TASK-01: Create `OccupancyStrip` component (`apps/reception/src/components/roomgrid/OccupancyStrip.tsx`) with props `occupiedCount: number` and `totalRooms: number`. Implement `computeOccupancyCount(rooms: string[], getReservationDataForRoom: (room: string) => GridReservationRow[], today: string): number` as a separate exported utility function (allows unit testing).
  - TASK-01 continued: Wire `<OccupancyStrip />` into `RoomsGrid.tsx` (below `<StatusLegend />`, above `<DndProvider>`). Pass `occupiedCount` derived from `computeOccupancyCount` and `totalRooms` from `knownRooms.length`.
  - TASK-01 continued: Write Jest test `__tests__/OccupancyStrip.test.tsx` covering: count display, zero occupied, all occupied, today-outside-window (strip not rendered or shows "–"), loading state (strip not rendered).
- Validation implications:
  - `pnpm --filter @apps/reception typecheck` — must pass
  - `pnpm --filter @apps/reception lint` — must pass (ds/enforce-layout-primitives, no raw flex)
- Sequencing constraints:
  - Single task or two tasks (component + wiring) — implementation is simple enough for one task
- Risks to carry into planning:
  - "Today outside window" UX: when `today < startDate` or `today > endDate`, the occupancy count is meaningless — strip should handle this gracefully (render nothing or show a "not in current window" indicator)
  - `"14"` (checkout complete) counted as occupied — document in code comment

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Today outside window produces misleading count | Low (staff typically view the current week) | Low (visual only) | Analysis confirmed the risk and the mitigation (null-render or indicator) | Plan task must specify the today-outside-window branch explicitly |
| Strip visible during loading causes layout shift | Low | Minimal | Strip is gated on `!loading && error == null` just like the grid | Plan task: strip renders only inside the existing loading gate |

## Planning Readiness

- Status: Go
- Rationale: All evidence gathered, approach selected, no open questions. Single implementation task is well-scoped. Zero new data dependencies, zero breaking changes.
