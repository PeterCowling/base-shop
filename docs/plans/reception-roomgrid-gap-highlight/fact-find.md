---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-gap-highlight
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-roomgrid-gap-highlight/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-004
Trigger-Why: Free cells between close bookings look identical to genuinely free nights, hiding scheduling inefficiencies that staff need to act on.
Trigger-Intended-Outcome: type: operational | statement: Short gaps (1-3 consecutive free days between bookings) are visually distinguished on the grid, giving staff an immediate visual cue to investigate or reassign. | source: operator
---

# Short Gap Highlighting on Rooms Grid — Fact-Find Brief

## Scope
### Summary
On the `/rooms-grid` page, free days that fall between two booking periods with only 1–3 days of gap look identical to any other free cell. Staff must scan manually to find these scheduling hazards. This change adds a `"gap"` pseudo-status so those cells render in a distinct amber/warning colour.

### Goals
- Visually distinguish 1–3 consecutive free days sandwiched between two bookings for the same room/row
- Integrate cleanly into the existing `MyLocalStatus` → `statusColors` → `RowCell` rendering pipeline
- Add a matching legend entry in `StatusLegend`
- Provide full unit-test coverage of the detection algorithm

### Non-goals
- Changing click behaviour or modal content for gap cells
- Server-side or database changes
- Drag-and-drop restrictions on gap cells
- Dynamic configuration of the gap threshold at runtime

### Constraints & Assumptions
- Constraints:
  - No new npm dependencies
  - Must use DS primitives (Cluster, Inline, Stack) for any new UI; no raw flex divs
  - Tests must be written but NOT run locally (CI only per testing policy)
  - All commits via `scripts/agents/with-writer-lock.sh`
- Assumptions:
  - GAP_THRESHOLD_DAYS = 3 (configurable as a file-level constant)
  - The grid date window is always finite (user-selected start/end)
  - `packBookingsIntoRows` already handles per-row period packing; gap detection runs after packing

## Outcome Contract

- **Why:** Free cells between close bookings look identical to genuinely free nights, hiding scheduling inefficiencies that staff need to act on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Short gaps (1–3 consecutive free days between bookings) are visually distinguished on the grid, giving staff an immediate visual cue to investigate or reassign.
- **Source:** operator

## Current Process Map

None: local code path only

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/rooms-grid/page.tsx` → lazy-imports `RoomsGridClient` (no SSR); entry point for the rooms-grid page
- `apps/reception/src/app/rooms-grid/RoomsGridClient.tsx` → wraps providers and renders `<RoomsGrid />`
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` → calls `useGridData(startDate, endDate)`, iterates `knownRooms`, passes per-room data to `<RoomGrid />`
- `apps/reception/src/components/roomgrid/RoomGrid.tsx` → passes `data` (array of `GridReservationRow`) to `<ReservationGrid>` with a `theme` mapping status → colour

### Key Modules / Files
- `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — core data hook; builds `allRoomData: Record<string, GridReservationRow[]>` per room; each row has `.periods: TBookingPeriod[]`
- `apps/reception/src/types/MyLocalStatus.ts` — union type `"free" | "disabled" | "awaiting" | "confirmed" | "1" | "8" | "12" | "14" | "16" | "23"`. No `"gap"` member today.
- `apps/reception/src/components/roomgrid/constants/statusColors.ts` — `Record<MyLocalStatus, string>`. Exhaustiveness: TypeScript requires every member of the union to be present.
- `apps/reception/src/components/roomgrid/components/Row/RowCell.tsx` — calls `dateUtils.getDayParams(cellDate, periods)` to get `dayType` and `dayStatus[]`; reads colour from `theme["date.status"][topStatus]`.
- `apps/reception/src/components/roomgrid/StatusLegend.tsx` — static `LEGEND_ENTRIES` array; must be updated manually to show gap swatch.
- `apps/reception/src/components/roomgrid/ReservationGrid.tsx` — orchestrates `Row` components; passes `theme` down.
- `apps/reception/src/utils/dateUtils.ts` — `generateDateRange`, `addDays`, `toEpochMillis` available.

### Patterns & Conventions Observed
- Status → colour: every status flows through `statusColors: Record<MyLocalStatus, string>`. TypeScript enforces exhaustiveness at compile time — adding a new union member without adding the matching colour key is a type error.
- Free-cell rendering: `RowCell` calls `isFreeDayType(dayType)` to determine drag-drop eligibility. A `"gap"` day type would need to be considered either "free" or a new category. Examining `getDayParams` is required (investigated via `dateUtils`/`ReservationGrid` pipeline).
- The `periods` array on each `GridReservationRow` contains only **booking** periods (statuses like `"1"`, `"12"`, etc.). Free days are implicit — any date in `[startDate, endDate]` not covered by a period is free.
- Gap detection must therefore be a post-processing step: iterate the packed rows, build a date-coverage map, find free dates flanked by bookings within threshold.

### Data & Contracts
- Types/schemas/events:
  - `MyLocalStatus` — union, `apps/reception/src/types/MyLocalStatus.ts`
  - `TPeriod` — `{ start: string; end: string; status: MyLocalStatus }`
  - `TBookingPeriod extends TPeriod` — adds `bookingRef`, `occupantId`, `firstName`, `lastName`, `info`, `color`
  - `GridReservationRow extends TRow<MyLocalStatus>` — `{ id, title, info, startDate, endDate, color?, periods: TBookingPeriod[] }`
  - `statusColors: Record<MyLocalStatus, string>` — exhaustive at compile time
- Persistence:
  - None — gap status is entirely derived; no persistence needed
- API/contracts:
  - No API changes; data flows from Firebase via `useBookingsData`, `useGuestByRoomData`, `useGuestsDetailsData`, `useActivitiesData` (all unchanged)

### Dependency & Impact Map
- Upstream dependencies:
  - `useGridData` depends on `packBookingsIntoRows` which produces `GridReservationRow[]` per room — gap detection can run on the output of this function
  - `generateDateRange` from `dateUtils` is available for iterating dates in a range
- Downstream dependents:
  - `getReservationDataForRoom` — returns `GridReservationRow[]`; if gap detection mutates/adds a pseudo-period, callers receive the enriched data automatically
  - `RoomGrid` → `ReservationGrid` → `RowCell`: will render gap cells via existing `theme["date.status"]` lookup — zero rendering code changes required if `statusColors` has the `"gap"` key
  - `RoomsGrid`: reads `period.start`, `period.end`, `period.occupantId`, `period.firstName`, `period.lastName` for arrivals/departures panels — gap pseudo-periods must be excluded from these loops (use `status === "gap"` guard or a separate period type)
  - `BookingDetailsModal`: modal shows booking details from the clicked period — gap cells may or may not open a useful modal (acceptable: modal opens with generic gap info)
- Likely blast radius:
  - **Type system** — adding `"gap"` to `MyLocalStatus` will cause a TypeScript error at `statusColors` (missing key) until the colour is added simultaneously. Both files must be changed atomically.
  - **StatusLegend** — static array must be updated manually; does not type-check against `MyLocalStatus`.
  - **`isFreeDayType` in RowCell** — currently checks `dayType === "single.free" || dayType === "free"`. Gap cells: if `getDayParams` returns a `"free"` day type for gap dates (since periods array won't contain them), this remains unchanged. Investigation of `getDayParams` confirms gap detection must inject a synthetic period with `status: "gap"` so `getDayParams` returns a non-free dayType.

### Patterns & Conventions Observed
- Colours use CSS custom properties from reception token set: `var(--reception-signal-warning-fg)`, `hsl(var(--color-border))`, etc. An amber/warning tint for gaps fits: `hsl(40 90% 85%)` or `var(--reception-signal-warning-bg)` if that token exists.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (CI only — do not run locally)
- CI integration: governed test runner via `pnpm -w run test:governed`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useGridData` — packing/allocation | Unit (renderHook) | `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts` | Good: covers `packBookingsIntoRows`, unallocated detection, activity-status mapping |
| `RoomGrid` component | Unit | `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx` | Exists; tests modal open/close |
| `RowCell` | Unit | No direct test; `RoomGrid.test.tsx` mocks `ReservationGrid` entirely — `RowCell`, `getDayParams`, and day-shape rendering are NOT indirectly tested | No coverage of rendering pipeline |
| `StatusLegend` | No dedicated test | — | No current test |

#### Coverage Gaps
- Untested paths:
  - Gap detection algorithm (does not exist yet) — needs dedicated unit tests in `useGridData.test.ts` or new file
  - `StatusLegend` gap entry rendering — new test required
- Extinct tests:
  - None identified

#### Testability Assessment
- Easy to test:
  - Gap detection: pure function taking `GridReservationRow[]` + `startDate`/`endDate` + threshold → returns annotated rows. Can test with stub data, no Firebase dependency.
  - `StatusLegend` entry: simple snapshot or contains check.
- Hard to test:
  - End-to-end visual rendering of gap colour — not covered by Jest; acceptable.
- Test seams needed:
  - Export `detectGaps` as a standalone function (or test via `useGridData` integration, matching existing pattern in `useGridData.test.ts`).

### Recent Git History (Targeted)
- `apps/reception/src/components/roomgrid/*` — `feat(reception/roomgrid): add TodayMovements panel` (BRIK-003, recent). Adds arrival/departure loops over `row.periods` in `RoomsGrid`. Gap pseudo-periods must exclude `status === "gap"` from those loops.
- `apps/reception/src/components/roomgrid/*` — `feat(reception/roomgrid): add OccupancyStrip` — `computeOccupancyCount` iterates rows/periods to find occupied beds. Must confirm gap periods don't inflate occupancy count (guard on period.status needed or use booking-only periods).
- `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — `feat(reception): fix allocated/booked types` — minor type fix. File is stable.
- `apps/reception/src/types/MyLocalStatus.ts` — `chore(reception): remove third-party roomgrid origin references` — cleaned up; current union is the canonical set.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `statusColors.ts` maps status → CSS colour; `StatusLegend` renders swatches | No gap swatch; no amber token for warning-bg confirmed; need to verify token exists or use inline hsl | Confirm colour token; add legend entry |
| UX / states | Required | Free cells show transparent; booking cells show coloured; no gap state exists | Staff cannot identify short gaps without manual scanning | Define gap state clearly; ensure empty-state (no gaps in window) gracefully unchanged |
| Security / privacy | N/A | Internal tool; no auth changes; no PII exposure in gap status | None | — |
| Logging / observability / audit | N/A | No logging required for a visual-only derived status | None | — |
| Testing / validation | Required | `useGridData.test.ts` has good hook unit coverage; `packBookingsIntoRows` tested | No gap detection test exists | Write gap detection unit tests (TC-01 through TC-05) |
| Data / contracts | Required | `MyLocalStatus` union exhaustively checked at compile time by `statusColors` | Adding `"gap"` requires simultaneous update to both `MyLocalStatus` and `statusColors` — must be atomic | Atomic change; verify `TBookingPeriod` shape for synthetic gap periods |
| Performance / reliability | Required | `allRoomData` is a `useMemo`; gap detection adds O(n×d) pass (periods × dates in range) | For typical short grids (14-30 days, <10 rooms, <5 beds/room), O(n×d) is trivial | Note in plan; no concern for typical window sizes |
| Rollout / rollback | Required | Pure UI change; no schema/DB/API changes | Rolling back is deleting the `"gap"` member + colour + detection code | Additive-only change simplifies rollback; TypeScript error-safety prevents partial deploy |

## Questions

### Resolved
- Q: Does `getDayParams` need changing to return a new `dayType` for gap dates?
  - A: Yes — and the synthetic-period approach requires a one-line addition to `getDayParams`. The function maps `period.start === dateIso` → `single.start`, `period.end === dateIso` → `single.end`, middle dates → `single.full`. Injecting a gap period `{ start: gapDate, end: nextDay }` without modification would render the gap cell as `single.start` (half-diamond, visually wrong) and the next day as `single.end` (which could corrupt an adjacent booking's visual shape). Fix: add a special-case in `getDayParams` for `status === "gap"` analogous to the existing `status === "disabled"` check → returns `single.full` regardless of position. This renders the gap cell as a full block fill. The gap period uses exclusive-end convention `{ start: gapDate, end: addOneDay(gapDate) }` so only the gap date itself matches the period.
  - Evidence: `apps/reception/src/utils/dateUtils.ts` lines 193–219 — `getDayParams` position logic; `"disabled"` special-case at line 205
- Q: Will gap pseudo-periods interfere with the arrival/departure loops in `RoomsGrid`?
  - A: Yes, they will interfere unless guarded. The `arrivals`/`departures` loops check `period.start === today` and `period.end === today`. Gap periods injected per-date (start = date, end = date+1) could produce false arrivals/departures. Fix: guard loops with `period.status !== "gap"` (or make gap periods carry a marker field). Chosen: simplest is `period.status !== "gap"` guard.
  - Evidence: `apps/reception/src/components/roomgrid/RoomsGrid.tsx` lines 64–80
- Q: Will gap pseudo-periods interfere with `computeOccupancyCount` in OccupancyStrip?
  - A: Yes, confirmed. `computeOccupancyCount` uses `NON_OCCUPIED_STATUSES = new Set(["free", "disabled", "16"])`. Any status NOT in this set is counted as occupied. A `"gap"` period covering today would therefore inflate the occupancy count. Fix: add `"gap"` to `NON_OCCUPIED_STATUSES` in `OccupancyStrip.tsx`. This is a required change, not a low-risk unknown.
  - Evidence: `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` lines 19–65 — `NON_OCCUPIED_STATUSES` and `computeOccupancyCount`

### Open (Operator Input Required)
- None

## Confidence Inputs
- Implementation: 88% — data flow is well-understood; gap detection algorithm is straightforward; main risk is the period-injection approach affecting other loops, but the guards are simple
- Approach: 90% — data-layer injection is clearly the right choice; component layer alternative would duplicate logic and not flow through existing colour mechanism
- Impact: 85% — solves the stated problem directly; visual distinctness is immediate
- Delivery-Readiness: 88% — all dependencies identified; no unknowns remaining
- Testability: 92% — gap detection is a pure transformation; unit tests are straightforward

What would raise Implementation to ≥90%: read `OccupancyStrip.tsx` to confirm no period-iteration that could be corrupted by gap periods; read `getDayParams` to confirm synthetic period injection works as expected.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Gap pseudo-periods corrupt arrival/departure loops | Medium | High (false "arrivals" shown) | Guard loops in RoomsGrid with `period.status !== "gap"` |
| Gap pseudo-periods inflate occupancy count | High | Medium (occupancy count wrong) | Confirmed: add `"gap"` to `NON_OCCUPIED_STATUSES` in `OccupancyStrip.tsx` |
| Colour token `--reception-signal-warning-bg` doesn't exist | Medium | Low (use inline hsl fallback) | Use `hsl(40 90% 85%)` as fallback if token absent |
| `statusColors` exhaustiveness check blocks build until both files updated | Low | Low (compile-time error, easy fix) | Change `MyLocalStatus` and `statusColors` in same commit |

## Planning Constraints & Notes
- Must-follow patterns:
  - DS primitives only for any new UI elements
  - `statusColors` and `MyLocalStatus` must be updated atomically (TypeScript enforces this)
  - Gap pseudo-period shape must satisfy `TBookingPeriod` interface (has all required fields)
- Rollout/rollback expectations:
  - Additive change; rollback = revert commit; no DB/API migration needed
- Observability expectations:
  - None required for a visual-only feature

## Suggested Task Seeds (Non-binding)
- TASK-01 (IMPLEMENT, S): Add `"gap"` to `MyLocalStatus`, `statusColors`, gap detection in `useGridData`, `StatusLegend` entry, arrival/departure guards, unit tests

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points (rooms-grid page → RoomsGrid → useGridData) | Yes | None | No |
| Data flow: `useGridData` → `packBookingsIntoRows` → `getReservationDataForRoom` | Yes | None | No |
| Type contract: `MyLocalStatus` → `statusColors` exhaustiveness | Yes | [Type contract gap Minor]: adding `"gap"` to union without simultaneous `statusColors` update causes compile error — resolved by atomic task | No (handled in plan) |
| Period injection: synthetic gap periods must satisfy `TBookingPeriod` shape | Yes | [Missing data dependency Moderate]: `TBookingPeriod` requires `bookingRef`, `occupantId`, `firstName`, `lastName`, `info`, `color` — gap pseudo-periods need placeholder values | No (handled in task) |
| Downstream loop interference: arrivals/departures in RoomsGrid | Yes | [Integration boundary Minor]: arrival/departure loops iterate `.periods` without status guard — gap periods could produce false movements | No (handled in task) |
| OccupancyStrip period iteration | Partial | Not fully confirmed — needs read of OccupancyStrip.tsx | No (low risk; guard pattern is consistent) |
| Test coverage: gap detection algorithm | Yes | No existing tests — new test file required | No (in plan) |

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis`
