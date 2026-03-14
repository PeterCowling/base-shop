---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-roomgrid-gap-highlight
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-004
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-roomgrid-gap-highlight/analysis.md
---

# Short Gap Highlighting on Rooms Grid — Plan

## Summary
Add a `"gap"` status to the rooms-grid rendering pipeline so that 1–3 consecutive free days sandwiched between two booking periods render in a distinct amber colour. Gap detection runs as a post-processing step inside `useGridData` after `packBookingsIntoRows`. A one-line special-case in `getDayParams` renders gap cells as full-block fills (`single.full`) rather than booking start/end shapes. The `OccupancyStrip` and `RoomsGrid` arrival/departure loops are guarded to exclude gap pseudo-periods. A `StatusLegend` entry makes the colour self-documenting.

## Active tasks
- [ ] TASK-01: Add gap status detection, colour, rendering, and legend entry

## Goals
- Gap cells (1–3 free days between two bookings) render amber on the grid
- Zero false positives: occupancy count, arrivals, and departures are unaffected
- TypeScript compiles cleanly; no suppression comments
- Unit tests cover gap detection algorithm (5 TCs)

## Non-goals
- Runtime-configurable gap threshold
- Drag-and-drop restrictions on gap cells
- Modal content changes for gap cells
- Server-side or API changes

## Constraints & Assumptions
- Constraints:
  - All commits via `scripts/agents/with-writer-lock.sh`
  - DS primitives only for any new UI; no raw flex divs
  - Tests written but NOT run locally (CI only)
- Assumptions:
  - GAP_THRESHOLD_DAYS = 3 (file-level constant)
  - Gap detection operates on packed rows (after `packBookingsIntoRows`)

## Inherited Outcome Contract

- **Why:** Free cells between close bookings look identical to genuinely free nights, hiding scheduling inefficiencies that staff need to act on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Short gaps (1–3 consecutive free days between bookings) are visually distinguished on the grid, giving staff an immediate visual cue to investigate or reassign.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-roomgrid-gap-highlight/analysis.md`
- Selected approach inherited:
  - Option A: data-layer injection with `getDayParams` special-case
- Key reasoning used:
  - Minimal surface area; flows through existing colour mechanism; zero `ReservationGrid`/`RowCell` prop changes; pure-function detection is easily tested

## Selected Approach Summary
- What was chosen:
  - Add `"gap"` to `MyLocalStatus`, `statusColors`, `useGridData` (gap detection + period injection), `getDayParams` (one special-case), `OccupancyStrip` (`NON_OCCUPIED_STATUSES`), `RoomsGrid` (arrival/departure guards), `StatusLegend` (new entry)
- Why planning is not reopening option selection:
  - Analysis conclusively preferred data-layer; component-layer rejected due to prop-drilling and interface sprawl

## Fact-Find Support
- Supporting brief: `docs/plans/reception-roomgrid-gap-highlight/fact-find.md`
- Evidence carried forward:
  - `getDayParams` special-case pattern (mirrors `"disabled"` handling)
  - `NON_OCCUPIED_STATUSES` confirmed at `OccupancyStrip.tsx` line 19
  - Arrival/departure loops confirmed at `RoomsGrid.tsx` lines 64–80 (no status guard today)
  - `TBookingPeriod` required fields: `bookingRef`, `occupantId`, `firstName`, `lastName`, `info`, `color`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add gap status + detection + rendering + tests | 85% | S | Pending | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Amber fill via `statusColors["gap"]`; `single.full` shape via `getDayParams` special-case; `StatusLegend` entry | TASK-01 | Colour: `hsl(40 90% 85%)` |
| UX / states | Gap state: amber full-block; no gap state: unchanged free cells; loading/error states: unchanged | TASK-01 | — |
| Security / privacy | N/A — internal tool; no auth/PII changes | — | — |
| Logging / observability / audit | N/A — visual-only derived status; no logging required | — | — |
| Testing / validation | 5 unit TCs for gap detection; TC-06 for arrival/departure guard | TASK-01 | CI only |
| Data / contracts | `MyLocalStatus` extended; `statusColors` extended; `TBookingPeriod` synthetic shape; `NON_OCCUPIED_STATUSES` updated | TASK-01 | Atomic changes |
| Performance / reliability | O(n×d) post-processing inside `useMemo`; trivial for 14–90 day windows | TASK-01 | No concern |
| Rollout / rollback | Additive; rollback = revert commit; no migration | TASK-01 | — |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; all changes atomic |

## Delivered Processes

None: no material process topology change

## Tasks

### TASK-01: Add gap status detection, colour, rendering, and legend entry
- **Type:** IMPLEMENT
- **Deliverable:** code-change — modified files in `apps/reception/src/` + new test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/types/MyLocalStatus.ts` — add `"gap"` to union
  - `apps/reception/src/components/roomgrid/constants/statusColors.ts` — add `"gap": "hsl(40 90% 85%)"` (amber)
  - `apps/reception/src/utils/dateUtils.ts` — add `status === "gap"` → `single.full` special-case in `getDayParams`
  - `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — add `detectAndInjectGapPeriods` helper + call after `packBookingsIntoRows`
  - `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` — add `"gap"` to `NON_OCCUPIED_STATUSES`
  - `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — guard arrival/departure loops with `period.status !== "gap"`
  - `apps/reception/src/components/roomgrid/StatusLegend.tsx` — add `"Short gap"` entry
  - `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.gap.test.ts` — new test file (TC-01 through TC-06)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — all code paths identified; `getDayParams` special-case is one line; gap detection is a well-bounded algorithm
  - Approach: 90% — data-layer injection confirmed as correct approach by analysis
  - Impact: 85% — directly solves the visual problem; no uncertainty on outcome
- **Acceptance:**
  - `"gap"` member present in `MyLocalStatus` union
  - `statusColors["gap"]` returns amber colour string
  - `getDayParams` returns `single.full` for a date covered by a period with `status === "gap"`
  - `computeOccupancyCount` does not count gap periods as occupied
  - Arrival/departure loops in `RoomsGrid` skip periods with `status === "gap"`
  - `StatusLegend` renders "Short gap" entry
  - All 6 TCs pass in CI
  - `pnpm --filter @apps/reception typecheck` passes
  - `pnpm --filter @apps/reception lint` passes
- **Engineering Coverage:**
  - UI / visual: Required — amber colour via `statusColors`; `single.full` via `getDayParams`; legend entry
  - UX / states: Required — gap state renders distinctly; no-gap state unchanged; loading/error unchanged
  - Security / privacy: N/A — internal tool; no sensitive data in gap periods
  - Logging / observability / audit: N/A — visual-only feature; no logging needed
  - Testing / validation: Required — 6 TCs in new test file
  - Data / contracts: Required — `MyLocalStatus`, `statusColors`, `TBookingPeriod` synthetic shape, `NON_OCCUPIED_STATUSES`
  - Performance / reliability: Required (noted) — O(n×d) inside `useMemo`; trivial for expected window sizes
  - Rollout / rollback: Required — additive; rollback = revert commit
- **Validation contract:**
  - TC-01: single free day between two bookings (gap = 1 day) → that day has status `"gap"`
  - TC-02: 3 consecutive free days between two bookings → all 3 days have status `"gap"`
  - TC-03: 4 consecutive free days between two bookings → none of those days has status `"gap"`
  - TC-04: free day at the start of the date range with no preceding booking → NOT `"gap"`
  - TC-05: free day at the end of the date range with no following booking → NOT `"gap"`
  - TC-06: row with gap periods — arrival/departure loops in `RoomsGrid` omit gap periods (no false movement entries)
- **Execution plan:** Red → Green → Refactor
  1. Add `"gap"` to `MyLocalStatus` (causes compile error at `statusColors`)
  2. Add `"gap": "hsl(40 90% 85%)"` to `statusColors` (compile error resolved)
  3. Add `status === "gap"` special-case to `getDayParams` in `dateUtils.ts`
  4. Implement `detectAndInjectGapPeriods` in `useGridData.ts`; call after `packBookingsIntoRows` inside `allRoomData` useMemo
  5. Add `"gap"` to `NON_OCCUPIED_STATUSES` in `OccupancyStrip.tsx`
  6. Add `period.status !== "gap"` guards to arrival/departure loops in `RoomsGrid.tsx`
  7. Add `{ label: "Short gap", color: "hsl(40 90% 85%)" }` to `LEGEND_ENTRIES` in `StatusLegend.tsx`
  8. Write test file with TC-01 through TC-06
  9. Typecheck + lint
- **Scouts:** None — all interfaces and implementations fully read before planning
- **Edge Cases & Hardening:**
  - Gap detection must handle rooms with no bookings (empty periods array → no gaps, correct)
  - Gap detection must handle single booking with no adjacent booking (free dates at range edges → not gaps, correct)
  - Synthetic `TBookingPeriod` fields: `bookingRef: ""`, `occupantId: ""`, `firstName: ""`, `lastName: ""`, `info: "Short gap"`, `color: "hsl(40 90% 85%)"`
  - Date arithmetic uses existing `generateDateRange` and string comparison (ISO format — safe for comparison)
- **What would make this >=90%:**
  - Reading `ReservationGrid.tsx` to confirm period types are passed as-is to `RowCell` without filtering
- **Rollout / rollback:**
  - Rollout: deploy with normal release; no feature flag needed (visual-only additive change)
  - Rollback: revert commit; TypeScript exhaustiveness check ensures no partial state
- **Documentation impact:**
  - None — `StatusLegend` is self-documenting
- **Notes / references:**
  - `getDayParams` in `apps/reception/src/utils/dateUtils.ts` lines 193–219
  - `NON_OCCUPIED_STATUSES` in `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` line 19
  - Existing `"disabled"` special-case at `dateUtils.ts` line 205 — mirror this pattern for `"gap"`

## Risks & Mitigations
- Gap period `TBookingPeriod` shape must have all required fields → use placeholder empty strings and `"Short gap"` info string
- `getDayParams` special-case ordering matters: check `status === "gap"` before position logic (same as `"disabled"` pattern)

## Observability
- Logging: None required
- Metrics: None required
- Alerts/Dashboards: None required

## Acceptance Criteria (overall)
- [ ] `"gap"` in `MyLocalStatus` union
- [ ] `statusColors["gap"]` defined as amber
- [ ] `getDayParams` returns `single.full` for gap periods
- [ ] `computeOccupancyCount` excludes gap periods
- [ ] Arrival/departure loops exclude gap periods
- [ ] `StatusLegend` shows "Short gap" entry
- [ ] 6 TCs pass in CI
- [ ] Typecheck and lint pass

## Decision Log
- 2026-03-14: Chose data-layer injection (Option A) over component-layer (Option B) — smaller surface area, cleaner type flow, better testability

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 step 1: Add `"gap"` to `MyLocalStatus` | Yes — file identified | [Type contract gap Minor]: causes compile error at `statusColors` until step 2 completes — but both steps are in single task | No (handled in single commit) |
| TASK-01 step 2: Add `statusColors["gap"]` | Yes — step 1 output | None | No |
| TASK-01 step 3: `getDayParams` special-case | Yes — `dateUtils.ts` read; `"disabled"` pattern confirmed at line 205 | None | No |
| TASK-01 step 4: `detectAndInjectGapPeriods` in `useGridData` | Yes — `packBookingsIntoRows` output and `generateDateRange` available | None | No |
| TASK-01 step 5: `NON_OCCUPIED_STATUSES` update | Yes — `OccupancyStrip.tsx` read; set confirmed | None | No |
| TASK-01 step 6: Arrival/departure guards | Yes — `RoomsGrid.tsx` lines 64–80 read | None | No |
| TASK-01 step 7: `StatusLegend` entry | Yes — `LEGEND_ENTRIES` array identified | None | No |
| TASK-01 step 8: Tests | Yes — `useGridData.test.ts` pattern identified; renderHook pattern available | None | No |
| TASK-01 step 9: Typecheck + lint | Yes — scripts available | None | No |

## Overall-confidence Calculation
- S=1
- TASK-01: confidence 85%, effort weight 1
- Overall-confidence = 85%
