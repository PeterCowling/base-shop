---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-today-movements
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-roomgrid-today-movements/fact-find.md
Related-Plan: docs/plans/reception-roomgrid-today-movements/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Today's Movements Summary — Analysis

## Decision Frame
### Summary
Choose how to surface today's arrivals and departures on the rooms-grid page. Two options exist: derive the data from the existing `getReservationDataForRoom` hook (no new data fetching), or add a new Firebase query dedicated to today-specific data. The decision affects implementation complexity, test surface, and data-freshness coupling.

### Goals
- Identify the correct data seam without widening the hook API.
- Confirm that `todayInWindow` gating is acceptable (panel is a contextual overlay, not standalone).
- Resolve the `TodayMovementEntry` shape including stable identity fields.

### Non-goals
- Edit/action capability on the panel.
- Historical movements (yesterday, tomorrow).
- Changing the Firebase data model.

### Constraints & Assumptions
- Constraints:
  - `useGridData` does not expose `allRoomData` directly — must use `getReservationDataForRoom`.
  - `ds/enforce-layout-primitives`: use DS layout primitives (`Cluster`, `Inline`, `Stack`) for layout; plain `div`/`span` permitted for semantics.
  - Grid-window coupling is accepted: if `todayInWindow` is false, panel is hidden (consistent with `OccupancyStrip`).
- Assumptions:
  - `period.end === today` means the guest departs today (exclusive-end convention confirmed by `OccupancyStrip` source).
  - `occupantId` is always unique per booking occupant — safe as React render key.

## Inherited Outcome Contract

- **Why:** Staff must manually scan each room timeline to find today's check-ins and check-outs; there is no summary. This creates friction during busy arrival/departure windows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A "Today's Movements" section on the rooms-grid page lists arrivals (check-in date = today) and departures (check-out date = today) with room numbers and guest names, eliminating manual timeline scanning.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-roomgrid-today-movements/fact-find.md`
- Key findings used:
  - `useGridData` exposes only `getReservationDataForRoom` — all period data is accessible via this function.
  - `TBookingPeriod` includes `start`, `end`, `firstName`, `lastName`, `occupantId`, `bookingRef`.
  - `today` is already computed in `RoomsGrid` scope.
  - `todayInWindow` guard already exists and governs `OccupancyStrip` — same pattern applies here.
  - Route path: `page.tsx → RoomsGridClient.tsx → RoomsGrid`.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Implementation simplicity | Fewer moving parts = lower risk | High |
| Zero new data fetching | Avoids race conditions and loading states | High |
| Testability | Pure props-in component is trivially testable | High |
| Design consistency | Matches OccupancyStrip/UnallocatedPanel patterns | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Derive from existing hook | Iterate `knownRooms` → `getReservationDataForRoom` → flat-map periods → filter by date. Compute in `RoomsGrid`, pass typed arrays to `TodayMovements` props. | Zero new fetching; follows existing pattern; pure component; trivially testable | Panel disappears when `todayInWindow` is false (accepted per scope) | None material | Yes |
| B — New Firebase query | Add a dedicated query for today's bookings separate from the grid window | Panel always visible regardless of grid window position | Significant complexity: new hook, new loading state, potentially duplicate data in memory; no business requirement for always-visible panel | Race conditions, data duplication, complexity overhead | No |

## Engineering Coverage Comparison

| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | DS primitives; minimal layout change | Same DS primitives + loading state UI | Option A: simpler — no loading state needed |
| UX / states | Empty state + populated state; panel hidden when off-window | Empty/loading/error/populated states + always visible | Option A: 2 states vs 4; accepted trade-off |
| Security / privacy | N/A — reads in-memory data already loaded | Same — no new external data exposure | N/A either way |
| Logging / observability / audit | N/A — pure read display | N/A | N/A |
| Testing / validation | Pure component + RoomsGrid mock = simple test scope | New hook needs its own tests; more integration surface | Option A: smaller test surface |
| Data / contracts | No schema change; uses existing `TBookingPeriod` fields | Would require new query shape + type | Option A: zero schema work |
| Performance / reliability | O(rooms × rows × periods) — bounded; no async | Extra Firebase listener; extra memory | Option A: no overhead |
| Rollout / rollback | Direct commit; revert = rollback | Same deploy model but more code to revert | Option A: minimal rollback surface |

## Chosen Approach
- **Recommendation:** Option A — derive from existing `getReservationDataForRoom` hook.
- **Why this wins:** Zero new data fetching, follows established patterns, pure component design, minimal blast radius, and the grid-window coupling is acceptable because the panel is contextually scoped to the visible grid.
- **What it depends on:** `getReservationDataForRoom` continues to return all periods for the grid window (stable API — no planned changes).

### Rejected Approaches
- Option B (new Firebase query) — unnecessary overhead given Option A works. No business requirement for always-visible panel. Rejected.

### Open Questions (Operator Input Required)
None — all design decisions resolved from evidence.

## End-State Operating Model

None: no material process topology change.

## Planning Handoff
- Planning focus:
  - Single task: create `TodayMovements.tsx` + wire into `RoomsGrid.tsx` + write unit tests.
  - Prop contract: `arrivals: TodayMovementEntry[]`, `departures: TodayMovementEntry[]` where `TodayMovementEntry = { room: string, occupantId: string, firstName: string, lastName: string }`.
  - Computation in `RoomsGrid`: iterate `knownRooms`, call `getReservationDataForRoom(room)`, flat-map `row.periods`, filter by `period.start === today` (arrivals) or `period.end === today` (departures).
  - Only render when `!loading && error == null && todayInWindow` — same guard as `OccupancyStrip`.
  - Guest name fallback: `[firstName, lastName].filter(Boolean).join(" ") || "Unknown"`.
  - React render keys: use `occupantId` (unique per period).
- Validation implications:
  - TC-01: arrivals list populated when period.start === today.
  - TC-02: departures list populated when period.end === today.
  - TC-03: empty state renders ("No arrivals today" / "No departures today") when lists empty.
  - TC-04: "Unknown" fallback for missing guest name.
  - TC-05: `RoomsGrid` wiring test — mock `TodayMovements` and assert it receives correct arrivals/departures.
- Sequencing constraints: Single task; no dependencies.
- Risks to carry into planning:
  - `period.end === today` edge: same-day booking (checkin = checkout on same day) is already guarded against in `useGridData` (`checkInDate >= checkOutDate` is skipped), so no risk of double-counting.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Packed rows may list same occupant multiple times | Very Low | Low | `packBookingsIntoRows` merges non-overlapping periods into rows; a single occupant only has one period per room per stay | Guard: deduplicate by `occupantId` in the compute step |

## Planning Readiness
- Status: Go
- Rationale: Approach is clear, data seam confirmed, prop contract defined, test strategy consistent. No blockers.
