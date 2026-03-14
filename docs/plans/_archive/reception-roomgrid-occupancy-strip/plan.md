---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-roomgrid-occupancy-strip
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-roomgrid-occupancy-strip/analysis.md
---

# Reception Rooms-Grid Occupancy Strip Plan

## Summary

Add a compact occupancy count strip to the rooms-grid page showing "Occupied tonight: X / 10 rooms" derived from booking data already loaded by `useGridData`. The strip is a new props-driven `OccupancyStrip` component inserted between `<StatusLegend />` and `<DndProvider>` in `RoomsGrid.tsx`. Occupancy count is computed via a pure utility function `computeOccupancyCount` that iterates rooms, checks each room's booking periods for today overlap and an occupied status. No new Firebase queries. One task.

## Active tasks

- [x] TASK-01: Add OccupancyStrip component and wire into RoomsGrid

## Goals

- Display occupied room count vs total rooms for tonight on the rooms-grid page
- Zero additional network requests
- DS primitives only (no raw flex/inline styles)
- Clean test seam via props-driven component and pure utility function

## Non-goals

- Per-day occupancy heatmap or column grid (future iteration)
- New API endpoints or server routes
- Colour-coded occupancy spectrum

## Constraints & Assumptions

- Constraints:
  - DS primitives only: `Cluster`, `Inline`, `Stack` from `@acme/design-system/primitives`
  - No raw flex divs or `style={{...}}` attributes
  - Typecheck + lint must pass locally
- Assumptions:
  - "Tonight" = today's date as `yyyy-MM-dd` string from `formatDateForInput(new Date())`
  - Occupied statuses: any `MyLocalStatus` except `"free"`, `"disabled"`, `"16"`
  - `"14"` (checkout complete) is counted as occupied (conservative — guest still in property until `"16"`)
  - If today falls outside `[startDate, endDate]`, the strip is not rendered

## Inherited Outcome Contract

- **Why:** Staff using the rooms grid have no at-a-glance view of how many rooms are occupied tonight. They must count occupied cells manually when deciding whether to push discounts, adjust minimum stays, or block availability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A compact occupancy count strip appears on the rooms-grid page showing the number of occupied rooms vs total rooms for the current date, derived from existing booking data without additional network requests.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/reception-roomgrid-occupancy-strip/analysis.md`
- Selected approach inherited:
  - Option A: derive count client-side from `getReservationDataForRoom` data already loaded by `useGridData`
- Key reasoning used:
  - All data already in memory; zero new network requests; props-driven component is cleanly testable

## Selected Approach Summary

- What was chosen: Client-side count derivation from `useGridData` data; props-driven `OccupancyStrip` leaf component; pure `computeOccupancyCount` utility function.
- Why planning is not reopening option selection: Option B (new Firebase query) was clearly inferior — same data available, extra latency, extra test burden.

## Fact-Find Support

- Supporting brief: `docs/plans/reception-roomgrid-occupancy-strip/fact-find.md`
- Evidence carried forward:
  - `getReservationDataForRoom` is the correct per-room access pattern (allRoomData not exposed)
  - Occupied statuses confirmed from `MyLocalStatus.ts` and `statusColors.ts`
  - Insertion point: below `<StatusLegend />`, above `<DndProvider>` in `RoomsGrid.tsx` lines 92–94
  - DS primitives already imported in `RoomsGrid.tsx`
  - 10 total rooms from `knownRooms` in `useRoomConfigs`

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add OccupancyStrip component and wire into RoomsGrid | 90% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | New `OccupancyStrip` component using DS primitives only; token-based colors | TASK-01 | No raw flex. Strip renders below StatusLegend. |
| UX / states | Strip shows count, zero-occupied, full-house. Not rendered when loading, error, or today outside window. | TASK-01 | All states handled in component and test. |
| Security / privacy | N/A | — | Internal staff tool, no new data pathway, no auth change. |
| Logging / observability / audit | N/A | — | Read-only derived UI, no mutations. |
| Testing / validation | New `OccupancyStrip.test.tsx`; `RoomsGrid.test.tsx` updated to assert strip renders | TASK-01 | Tests in CI only. |
| Data / contracts | No schema/type changes; uses existing `GridReservationRow[]` and `TBookingPeriod`; new `computeOccupancyCount` utility exported | TASK-01 | Pure function testable without React. |
| Performance / reliability | `useMemo` for count derivation; O(rooms × bookings) — bounded | TASK-01 | No hot path risk. |
| Rollout / rollback | Additive; git revert is rollback | TASK-01 | No feature flag needed. |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Single task, no dependencies |

## Delivered Processes

None: no material process topology change.

## Tasks

### TASK-01: Add OccupancyStrip component and wire into RoomsGrid

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` (new), `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (modified), `apps/reception/src/components/roomgrid/__tests__/OccupancyStrip.test.tsx` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` (new)
  - `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (modified — add import + render strip)
  - `apps/reception/src/components/roomgrid/__tests__/OccupancyStrip.test.tsx` (new)
  - `[readonly] apps/reception/src/hooks/data/roomgrid/useGridData.ts`
  - `[readonly] apps/reception/src/hooks/client/checkin/useRoomConfigs.ts`
  - `[readonly] apps/reception/src/types/MyLocalStatus.ts`
  - `[readonly] apps/reception/src/utils/dateUtils.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Clear requirements, established patterns. Typecheck will confirm correctness.
  - Approach: 92% — Data availability confirmed; insertion point confirmed.
  - Impact: 85% — Additive, visual-only. No regression risk.
- **Acceptance:**
  - `OccupancyStrip` component renders "Occupied tonight: X / 10 rooms" using DS primitives
  - `computeOccupancyCount` correctly identifies occupied rooms (status not in `{"free","disabled","16"}`, period overlaps today)
  - Strip is not rendered when `loading === true` or `error != null`
  - Strip is not rendered when today falls outside `[startDate, endDate]`
  - `pnpm --filter @apps/reception typecheck` passes
  - `pnpm --filter @apps/reception lint` passes
  - `OccupancyStrip.test.tsx` written covering: count display, zero occupied, all occupied, today-outside-window (not rendered), strip visible in RoomsGrid
- **Engineering Coverage:**
  - UI / visual: Required — OccupancyStrip uses `Inline` + `Cluster` DS primitives; no raw flex; token-based text colors only
  - UX / states: Required — count, zero, full-house, today-outside-window (null render), loading (null render) all handled
  - Security / privacy: N/A — internal staff tool, no new data exposure
  - Logging / observability / audit: N/A — read-only UI derivation
  - Testing / validation: Required — OccupancyStrip.test.tsx with RTL; computeOccupancyCount unit tests
  - Data / contracts: Required — `computeOccupancyCount(rooms, getReservationDataForRoom, today)` exported; no type/schema changes to existing interfaces
  - Performance / reliability: Required — count derived via `useMemo` in RoomsGrid; O(rooms × bookings) bounded
  - Rollout / rollback: Required — git revert; no feature flag; additive change
- **Validation contract:**
  - TC-01: Strip shows "Occupied tonight: 3 / 10 rooms" when 3 rooms have a booking period overlapping today with occupied status → strip renders with correct count
  - TC-02: All 10 rooms occupied → "Occupied tonight: 10 / 10 rooms"
  - TC-03: 0 rooms occupied → "Occupied tonight: 0 / 10 rooms"
  - TC-04: Today before startDate → strip not rendered
  - TC-05: Today after endDate → strip not rendered
  - TC-06: loading === true → strip not rendered
  - TC-07: status `"16"` (bags picked up) only booking for a room → room NOT counted as occupied
  - TC-08: status `"14"` (checkout complete) booking for a room overlapping today → room IS counted as occupied
- **Execution plan:** Create OccupancyStrip.tsx (component + computeOccupancyCount utility) → wire into RoomsGrid.tsx → write OccupancyStrip.test.tsx → typecheck → lint
- **Planning validation:**
  - Checks run: confirmed getReservationDataForRoom signature, confirmed DS primitives import path, confirmed insertion location in RoomsGrid.tsx JSX
  - Validation artifacts: fact-find.md, analysis.md
  - Unexpected findings: None
- **Scouts:** None: all data shapes and function signatures confirmed from source files
- **Edge Cases & Hardening:**
  - Today outside window: `if (!todayInWindow) return null` guard at top of component or in RoomsGrid before rendering strip
  - Period boundary: `period.start <= today && today < period.end` (end is checkout date — exclusive)
  - `"14"` (checkout complete): counted as occupied (defensive; guest still present until `"16"`)
  - Empty `allRoomData` (data still loading): strip gated on `!loading && error == null`
- **What would make this >=90%:**
  - Already at 90% — typecheck pass would raise to 95%
- **Rollout / rollback:**
  - Rollout: deploy with next reception build; no migration or feature flag needed
  - Rollback: `git revert <commit>` + redeploy
- **Documentation impact:** None
- **Notes / references:**
  - `formatDateForInput` is already imported in `RoomsGrid.tsx` — use it or `new Date().toISOString().slice(0,10)` for today
  - `Cluster`, `Inline` already imported in `RoomsGrid.tsx`; `Stack` also imported — strip can use `Inline` for the text row

## Risks & Mitigations

- Today-outside-window: strip not rendered, preventing misleading count — handled by guard in component
- `"14"` counting: conservative assumption documented in code comment

## Observability

- Logging: None required (read-only UI)
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `OccupancyStrip.tsx` created with `computeOccupancyCount` utility
- [ ] `RoomsGrid.tsx` renders `<OccupancyStrip />` below StatusLegend, above DndProvider
- [ ] `OccupancyStrip.test.tsx` written covering TC-01 through TC-08
- [ ] `pnpm --filter @apps/reception typecheck` passes
- [ ] `pnpm --filter @apps/reception lint` passes

## Decision Log

- 2026-03-14: Chose Option A (client-side derivation). Rejected Option B (new Firebase query) — all data already available, extra complexity with no benefit.
- 2026-03-14: `"14"` (checkout complete) counted as occupied — conservative choice, aligns with grid display behavior.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create OccupancyStrip.tsx | Yes — GridReservationRow and TBookingPeriod types confirmed; getReservationDataForRoom signature confirmed; formatDateForInput available | None | No |
| TASK-01: Wire into RoomsGrid.tsx | Yes — insertion point confirmed (line 92); DS primitives already imported; loading/error gate present | None | No |
| TASK-01: Write OccupancyStrip.test.tsx | Yes — jest + RTL infrastructure confirmed; jest.mock pattern confirmed from RoomsGrid.test.tsx; data-cy attribute convention confirmed | None | No |
| TASK-01: typecheck + lint | Yes — pnpm --filter @apps/reception typecheck and lint commands confirmed in package.json scripts | None | No |

## Overall-confidence Calculation

- TASK-01: confidence 90%, effort S (weight 1)
- Overall-confidence = (90% × 1) / 1 = **90%**
