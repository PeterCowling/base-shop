---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-gap-highlight
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-roomgrid-gap-highlight/fact-find.md
Related-Plan: docs/plans/reception-roomgrid-gap-highlight/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Short Gap Highlighting on Rooms Grid — Analysis

## Decision Frame
### Summary
Decide where to detect and represent 1–3 day free gaps between bookings so they render in a distinct amber colour on the rooms grid. Two viable approaches: inject the gap status into the data layer (`useGridData`) vs. compute and apply it in the component layer (`RowCell`/`RoomGrid`). Additionally, because `getDayParams` controls day-shape rendering, any injected gap period must be handled specially in `getDayParams` to avoid shape distortion on adjacent cells.

### Goals
- Gap cells render amber/warning on the grid without touching the ReservationGrid rendering engine
- No false positives for arrival/departure counts or occupancy strip
- Clean TypeScript: exhaustive `statusColors` record, no `as any`
- Minimal file surface — additive change, rollback = revert commit

### Non-goals
- Runtime-configurable threshold
- Drag-and-drop restrictions on gap cells
- Server-side or API changes

### Constraints & Assumptions
- Constraints:
  - `statusColors: Record<MyLocalStatus, string>` is exhaustively checked at compile time; adding `"gap"` to the union requires simultaneous colour entry
  - `getDayParams` currently only special-cases `"disabled"` — the same pattern applies for `"gap"`
  - `NON_OCCUPIED_STATUSES` in `OccupancyStrip` must be extended to exclude gap periods
- Assumptions:
  - GAP_THRESHOLD_DAYS = 3 (constant in `useGridData`)
  - Gap detection operates on fully packed rows (after `packBookingsIntoRows`)

## Inherited Outcome Contract

- **Why:** Free cells between close bookings look identical to genuinely free nights, hiding scheduling inefficiencies that staff need to act on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Short gaps (1–3 consecutive free days between bookings) are visually distinguished on the grid, giving staff an immediate visual cue to investigate or reassign.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-roomgrid-gap-highlight/fact-find.md`
- Key findings used:
  - `getDayParams` renders period.start as `single.start`, period.end as `single.end` — injected gap periods need a special-case to render as `single.full`
  - `NON_OCCUPIED_STATUSES` does not include `"gap"` → must be added to avoid occupancy inflation
  - Arrival/departure loops in `RoomsGrid` iterate all periods without status guards → gap periods need guarding
  - `statusColors: Record<MyLocalStatus, string>` is exhaustive at compile time
  - `RoomGrid.test.tsx` mocks `ReservationGrid` entirely — `RowCell` rendering is not indirectly tested

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Rendering correctness | Gap cells must show as full-block amber fill, not as booking start/end shapes | High |
| Side-effect safety | Must not corrupt occupancy, arrival, or departure counts | High |
| Type safety | TypeScript must compile without casts or suppressions | High |
| Code surface area | Fewer files = lower regression risk | Medium |
| Testability | Gap detection must be unit-testable without Firebase | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Data-layer injection | Add `"gap"` to `MyLocalStatus`. In `useGridData`, after `packBookingsIntoRows`, inject synthetic `TBookingPeriod` entries for gap dates. Add `status === "gap"` special-case in `getDayParams` (like `"disabled"`). Add `"gap"` to `NON_OCCUPIED_STATUSES`. Guard arrival/departure loops. | Single source of truth; zero rendering code changes; gap status flows through existing `theme["date.status"]` colour lookup; pure-function detection is easily tested | Requires touching `dateUtils.ts` (`getDayParams`) to add one special-case; TBookingPeriod has required fields needing placeholder values for synthetic records | Forgetting `NON_OCCUPIED_STATUSES` update inflates occupancy; forgetting `getDayParams` special-case causes shape distortion | Yes |
| B: Component-layer approach | Pass a `gapDates: Set<string>` or similar from `useGridData` to `RoomGrid`/`RowCell`. In `RowCell`, override colour when date is in `gapDates`. No change to `getDayParams`. | Avoids `getDayParams` change; rendering logic stays in component | Prop-drilling through `GridReservationRow` → `ReservationGrid` → `Row` → `RowCell`; bypasses the `theme["date.status"]` colour mechanism; requires interface changes to `TRow`, `TReservedPeriod`, `RowCellProps`; much larger surface area | Interface sprawl across 4–5 files; `StatusLegend` colour still manually defined; harder to test rendering path | Yes |

## Engineering Coverage Comparison

| Coverage Area | Option A (data-layer injection) | Option B (component-layer) | Chosen implication |
|---|---|---|---|
| UI / visual | Gap period flows through existing `theme["date.status"]` → `topColor` → `Day` component; amber colour defined once in `statusColors` | Colour override in `RowCell` directly; `StatusLegend` still manually defined | Option A: single colour definition in `statusColors`; cleaner legend sync |
| UX / states | `getDayParams` special-case ensures full-block rendering; adjacent bookings unaffected | Same result achievable but requires more component logic | Option A: cleaner; `single.full` matches visual intent |
| Security / privacy | N/A for both | N/A for both | N/A |
| Logging / observability / audit | N/A for both | N/A for both | N/A |
| Testing / validation | Gap detection is a pure function in data hook — easily unit tested; 5 TCs cover threshold, boundaries | Harder to test: requires rendering component with gap date set; more setup | Option A: better testability |
| Data / contracts | `MyLocalStatus` extended; `statusColors` extended; `TBookingPeriod` satisfied with placeholders; `NON_OCCUPIED_STATUSES` updated; `getDayParams` one-line addition | `TRow`, `TReservedPeriod`, `RowCellProps` all need new fields; larger contract surface | Option A: smaller contract surface |
| Performance / reliability | O(n×d) post-processing pass inside `useMemo`; trivial for typical grid windows | Same cost | Equal |
| Rollout / rollback | Additive; revert = remove `"gap"` from union + colour + detection + `getDayParams` line | Same rollback simplicity | Equal |

## Chosen Approach
- **Recommendation:** Option A — data-layer injection with `getDayParams` special-case
- **Why this wins:** Minimal surface area; gap status flows through existing colour mechanism; zero changes to `ReservationGrid`, `Row`, or `RowCell` prop interfaces; pure-function detection is easily unit tested; `StatusLegend` entry is the only manual sync point.
- **What it depends on:**
  - One-line addition to `getDayParams` in `dateUtils.ts` for `status === "gap"` → `single.full`
  - `"gap"` added to `MyLocalStatus` and `statusColors` atomically
  - `"gap"` added to `NON_OCCUPIED_STATUSES` in `OccupancyStrip.tsx`
  - Arrival/departure loops in `RoomsGrid` guarded with `period.status !== "gap"`

### Rejected Approaches
- Option B (component-layer) — rejected: prop-drilling through 4–5 interface files; bypasses existing colour mechanism; harder to test; larger blast radius.

### Open Questions (Operator Input Required)
- None

## End-State Operating Model

None: no material process topology change

## Planning Handoff
- Planning focus:
  - Single TASK-01 (IMPLEMENT, size S): all changes atomic in one commit
  - Key subtasks: `MyLocalStatus`, `statusColors`, `useGridData` detection + injection, `getDayParams` special-case, `OccupancyStrip` guard, `RoomsGrid` arrival/departure guards, `StatusLegend` entry
  - New test file: `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.gap.test.ts` covering TC-01 through TC-05
- Validation implications:
  - TypeScript compile enforces `statusColors` exhaustiveness — partial changes cause build failure
  - Unit tests for gap detection algorithm are the primary validation
- Sequencing constraints:
  - `MyLocalStatus` change must be committed alongside `statusColors` change (single task, single commit)
- Risks to carry into planning:
  - Synthetic `TBookingPeriod` needs placeholder values for all required fields (`bookingRef: ""`, `occupantId: ""`, `firstName: ""`, `lastName: ""`, `info: "short gap"`, `color: <gap colour>`)

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `getDayParams` special-case incomplete | Low | High (shape distortion) | Code change not yet written | TC in tests validates `single.full` rendering for gap dates |
| Arrival/departure guard missed | Low | Medium (false movement entries) | Code change not yet written | TC-06 validates guard |
| StatusLegend colour token missing | Low | Low (fallback to inline hsl) | Token availability not confirmed | Use `hsl(40 90% 85%)` (inline) — no token dependency |

## Planning Readiness
- Status: Go
- Rationale: All unknowns resolved; approach is clear; single task; full test plan defined; no operator input required.
