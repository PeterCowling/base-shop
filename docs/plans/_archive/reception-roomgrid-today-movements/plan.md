---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-roomgrid-today-movements
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-003
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-roomgrid-today-movements/analysis.md
---

# Today's Movements Summary — Plan

## Summary
Add a compact "Today's Movements" panel to the rooms-grid page (`RoomsGrid.tsx`) showing which guests are arriving and departing today. All data is derived from the existing `getReservationDataForRoom` hook by iterating known rooms and filtering periods where `start === today` (arrivals) or `end === today` (departures). A new `TodayMovements` component accepts typed arrays as props and renders two lists using DS layout primitives. The panel appears only when today is within the visible grid window, matching the `OccupancyStrip` guard pattern.

## Active tasks
- [ ] TASK-01: Create TodayMovements component, wire into RoomsGrid, and write tests

## Goals
- Render a "Today's Movements" panel on the rooms-grid page with arrivals and departures.
- Follow the established DS-primitives pattern (Cluster, Inline, Stack).
- Cover 4 unit TCs in a new test file + 1 RoomsGrid wiring assertion.

## Non-goals
- Edit/action capability on the panel.
- Historical movements (yesterday, tomorrow).
- Always-visible panel independent of grid window.

## Constraints & Assumptions
- Constraints:
  - `ds/enforce-layout-primitives`: use DS layout primitives for layout elements.
  - Tests written but not run locally — CI-only.
  - Commits via `scripts/agents/with-writer-lock.sh`.
- Assumptions:
  - `period.end === today` means guest departs today (exclusive-end convention).
  - `occupantId` is unique per booking occupant — safe as React render key.
  - Grid-window coupling is accepted: panel hidden when `todayInWindow` is false.

## Inherited Outcome Contract

- **Why:** Staff must manually scan each room timeline to find today's check-ins and check-outs; there is no summary.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A "Today's Movements" section on the rooms-grid page lists arrivals (check-in date = today) and departures (check-out date = today) with room numbers and guest names, eliminating manual timeline scanning.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-roomgrid-today-movements/analysis.md`
- Selected approach inherited:
  - Option A — derive from existing `getReservationDataForRoom` hook, compute in `RoomsGrid`, pass typed arrays as props.
- Key reasoning used:
  - Zero new data fetching; follows OccupancyStrip/UnallocatedPanel patterns; grid-window coupling accepted.

## Selected Approach Summary
- What was chosen:
  - New `TodayMovements.tsx` component accepting `arrivals: TodayMovementEntry[]` and `departures: TodayMovementEntry[]` props. Computation in `RoomsGrid` by iterating `knownRooms` + `getReservationDataForRoom`.
- Why planning is not reopening option selection:
  - Analysis clearly rejected Option B (new Firebase query) as unnecessary overhead. Option A is unambiguously correct.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-roomgrid-today-movements/fact-find.md`
- Evidence carried forward:
  - `TBookingPeriod` fields: `start`, `end`, `firstName`, `lastName`, `occupantId`.
  - `today` already in scope in `RoomsGrid` as `formatDateForInput(new Date())`.
  - `todayInWindow` guard already exists in `RoomsGrid`.
  - Existing test pattern from `OccupancyStrip.test.tsx`: fixture rows + deterministic today string.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | TodayMovements component + RoomsGrid wiring + tests | 87% | S | Pending | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | DS primitives (Cluster/Inline/Stack) only for layout; two-section layout: Arriving/Departing | TASK-01 | Follows OccupancyStrip visual pattern |
| UX / states | Empty state ("No arrivals today" / "No departures today"), populated state; panel guarded by todayInWindow | TASK-01 | TC-03 covers empty state |
| Security / privacy | N/A — reads in-memory data already loaded for the grid; no new data surface | - | Internal tool, access-controlled by operator login |
| Logging / observability / audit | N/A — pure read-only display component; no mutations | - | No logging needed |
| Testing / validation | Unit tests for TodayMovements (TC-01 to TC-04); RoomsGrid wiring test (TC-05) | TASK-01 | CI-only; no local jest run |
| Data / contracts | No schema change; `TodayMovementEntry = { room, occupantId, firstName, lastName }` type defined in component file | TASK-01 | Stable fields from TBookingPeriod |
| Performance / reliability | O(rooms × rows × periods) — bounded; no async; useMemo guards re-computation | TASK-01 | No performance risk at ~10 rooms |
| Rollout / rollback | Direct commit deploy; rollback = revert commit; no migration or feature flag | TASK-01 | Reception Worker deploy |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no dependencies |

## Delivered Processes

None: no material process topology change.

## Tasks

### TASK-01: Create TodayMovements component, wire into RoomsGrid, write tests
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/components/roomgrid/TodayMovements.tsx`; modified `apps/reception/src/components/roomgrid/RoomsGrid.tsx`; new `apps/reception/src/components/roomgrid/__tests__/TodayMovements.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/roomgrid/TodayMovements.tsx` (new), `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (modified), `apps/reception/src/components/roomgrid/__tests__/TodayMovements.test.tsx` (new)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 95% — follows OccupancyStrip/UnallocatedPanel patterns exactly; all data fields confirmed.
  - Approach: 92% — derive from existing hook is clearly correct; no alternative viable.
  - Impact: 87% — panel directly addresses stated pain; value confirmed by business context.
- **Acceptance:**
  - `TodayMovements.tsx` created with `TodayMovementEntry` type, `arrivals`/`departures` props, DS-primitive layout.
  - `RoomsGrid.tsx` computes `arrivals` and `departures` via `useMemo`, renders `TodayMovements` when `!loading && error == null && todayInWindow`.
  - `TodayMovements.test.tsx` contains TC-01 through TC-04.
  - `RoomsGrid.test.tsx` updated with TC-05 wiring assertion.
  - `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint` pass clean.
- **Engineering Coverage:**
  - UI / visual: Required — DS primitives layout; two-section card.
  - UX / states: Required — empty state + populated state; panel visibility guarded.
  - Security / privacy: N/A — reads in-memory data only.
  - Logging / observability / audit: N/A — pure display component.
  - Testing / validation: Required — 4 unit TCs + 1 wiring TC.
  - Data / contracts: Required — `TodayMovementEntry` type definition.
  - Performance / reliability: N/A — O(rooms × rows × periods), bounded, synchronous.
  - Rollout / rollback: Required — direct commit; rollback = revert.
- **Validation contract (TC-XX):**
  - TC-01: `arrivals` list contains entry for room whose period.start === today → entry rendered in "Arriving today" section.
  - TC-02: `departures` list contains entry for room whose period.end === today → entry rendered in "Departing today" section.
  - TC-03: both lists empty → renders "No arrivals today" and "No departures today".
  - TC-04: entry with empty firstName and lastName → renders "Unknown".
  - TC-05: `RoomsGrid` renders `TodayMovements` with correct props when getReservationDataForRoom returns today's movements.
- **Execution plan:** Red → Green → Refactor
  - Write test file with TC-01 to TC-04 (all fail — component does not exist).
  - Create `TodayMovements.tsx` with `TodayMovementEntry` type and render logic.
  - Tests TC-01–TC-04 pass.
  - Add TC-05 to `RoomsGrid.test.tsx`.
  - Update `RoomsGrid.tsx` to compute arrivals/departures and render `TodayMovements`.
  - TC-05 passes.
  - Run typecheck + lint.
- **Scouts:** None — all patterns confirmed from OccupancyStrip and UnallocatedPanel.
- **Edge Cases & Hardening:**
  - Same occupant in multiple rows (packed): deduplicate by `occupantId` in the compute step to avoid double-listing.
  - Guest with no name: `[firstName, lastName].filter(Boolean).join(" ") || "Unknown"`.
  - Period exactly on window boundary (period.end === today AND period.start === today impossible given `checkInDate >= checkOutDate` guard in useGridData).
- **What would make this >=90%:**
  - Reception staff validation that the panel is used during daily arrival/departure prep (impact evidence).
- **Rollout / rollback:**
  - Rollout: commit directly to branch; deploy via normal reception Worker pipeline.
  - Rollback: revert the commit; no migration or flag to clean up.
- **Documentation impact:** None — internal UI change; no external docs.
- **Notes / references:**
  - `OccupancyStrip.tsx` is the closest design analogue for component structure and test pattern.
  - `RoomsGrid.test.tsx` shows the mock pattern for `useGridData` and `useRoomConfigs`.

## Risks & Mitigations
- Duplicate `occupantId` across rooms: not possible — `occupantId` is per-occupant globally.
- Packed rows listing same occupant twice: mitigated by `occupantId` deduplication in compute step.

## Observability
- Logging: None needed.
- Metrics: None needed.
- Alerts/Dashboards: None needed.

## Acceptance Criteria (overall)
- [ ] `TodayMovements.tsx` created and renders correctly with DS primitives.
- [ ] `RoomsGrid.tsx` computes and passes arrivals/departures via useMemo.
- [ ] TC-01 to TC-05 test assertions written.
- [ ] typecheck and lint pass clean.

## Decision Log
- 2026-03-14: Chose Option A (derive from existing hook); rejected Option B (new Firebase query) as unnecessary overhead.
- 2026-03-14: Accepted grid-window coupling — panel is contextual overlay, not standalone feature.
- 2026-03-14: Added `occupantId` to `TodayMovementEntry` for stable React render keys.
- 2026-03-14: Deduplicate by `occupantId` in compute step to handle packed rows edge case.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create TodayMovements.tsx | Yes — TBookingPeriod fields confirmed; DS primitives available; OccupancyStrip pattern as guide | None | No |
| TASK-01: Wire into RoomsGrid.tsx | Yes — today already in scope; todayInWindow guard exists; getReservationDataForRoom callable | None | No |
| TASK-01: Write TodayMovements.test.tsx | Yes — jest + RTL pattern established; OccupancyStrip.test.tsx is direct template | None | No |
| TASK-01: Update RoomsGrid.test.tsx TC-05 | Yes — mock pattern for useGridData established; TodayMovements can be mocked same way as UnallocatedPanel | None | No |
| TASK-01: typecheck + lint | Yes — no new imports from unbuilt packages; all types from existing codebase | None | No |

## Overall-confidence Calculation
- S=1 weight: TASK-01 at 87% confidence, weight S=1.
- Overall-confidence = 87%.
