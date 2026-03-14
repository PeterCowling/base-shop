---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-unallocated-panel
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-roomgrid-unallocated-panel/fact-find.md
Related-Plan: docs/plans/reception-roomgrid-unallocated-panel/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Rooms-Grid Unallocated Panel — Analysis

## Decision Frame

### Summary
`useGridData.ts` line 241 silently drops every occupant whose `guestByRoomData[occId]?.allocated` does not match any known room. Staff have no visibility of these unallocated occupants on the rooms-grid page, creating a failure mode where guests arrive with no room assignment. The decision here is how to expose `unallocatedOccupants` from the existing `useGridData` hook, what shape the surface takes, and how the `UnallocatedPanel` component integrates into `RoomsGrid.tsx`. v1 scope is read-only (no allocation action); the `BookingDetailsModal` reuse path is explicitly ruled out due to its booking-level mutation granularity.

### Goals
- Surface all unallocated occupants within the selected date window on the rooms-grid page.
- Show enough context per occupant (name, booking ref, check-in/check-out, booked room, status) for staff to identify and act on missing allocations.
- Keep the implementation purely additive — no changes to the existing room panel filter logic.
- Integrate with the existing Firebase subscription pipeline (no new `onValue` reads).

### Non-goals
- Allocation action from the unallocated panel in v1. `BookingDetailsModal` is NOT safe to reuse for single-occupant allocation (it moves all occupants under the booking ref). A future occupant-scoped action is deferred.
- New Firebase paths or data model changes.
- Server-side notifications for unallocated bookings.

### Constraints & Assumptions
- Constraints:
  - English-only internal tool; no i18n.
  - DS primitives (`Stack`, `Inline`, `Cluster`) required for layout — codebase pattern from `RoomsGrid.tsx`.
  - No new Firebase subscriptions; must reuse existing hook data.
  - `BookingDetailsModal` is unsafe for occupant-level allocation — moves all occupants under bookingRef, not just selected occupant.
- Assumptions:
  - "Unallocated" = `guestByRoomData[occId]?.allocated` is absent, `undefined`, `null`, empty string, OR a value not in `knownRooms`.
  - Date-window filter (checkInDate/checkOutDate vs page startDate/endDate) applies to the unallocated panel.
  - v1 is read-only — no click-through action needed in this phase.

## Inherited Outcome Contract

- **Why:** Guests with confirmed bookings arrive at the hostel with no bed assigned because staff cannot see unallocated occupants anywhere on the rooms grid. The data exists but is hidden from the staff view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can identify all unallocated occupants directly from the rooms-grid page before guests arrive, eliminating the failure mode where guests arrive with no room assignment.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-roomgrid-unallocated-panel/fact-find.md`
- Key findings used:
  - Drop point confirmed: `useGridData.ts:241` — `if (guestByRoomData[occId]?.allocated !== room) return;`
  - `IGuestByRoomData.allocated` typed `string` (non-optional) but Firebase may omit key — should be `allocated?: string`
  - `BookingDetailsModal.handleConfirmMoveBooking` loops ALL occupants under bookingRef; unsafe for single-occupant use from an unallocated panel
  - `useAllocateRoom` writes to both `/guestByRoom` and `/roomsByDate`; uses `date` parameter as path key
  - `RoomsGrid.tsx` already uses DS `Stack`/`Cluster`/`Inline` primitives — insertion pattern is established
  - Existing `__tests__/RoomsGrid.test.tsx` and `__tests__/useGridData.test.ts` have mocked hook seams that are directly reusable for new tests
  - 10 known rooms (3–12), 47 total beds; live Firebase subscriptions already hold all required data

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correctness of the unallocated definition | Must capture absent, empty, and non-knownRooms `allocated` values | Critical |
| No duplicate Firebase subscriptions | A separate hook re-subscribing to the same nodes would be wasteful and could create stale-data divergence | Critical |
| Type safety | `IGuestByRoomData.allocated` is typed non-optional but absent at runtime — type must be corrected | High |
| Separation of computed concerns | `allRoomData` and `unallocatedOccupants` have different shapes and consumers — cleaner if each has its own memo | Medium |
| Testability | Each computed value should be independently mockable and testable | High |
| Build burden | Fewer new files, smaller diff, lower review risk | Medium |
| UI integration simplicity | How easily does `RoomsGrid.tsx` wire up the new panel | Medium |

## Options Considered

The fact-find already eliminated the "separate hook" option (would duplicate four `onValue` subscriptions). Both viable options extend `useGridData` internally.

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Second `useMemo` in `useGridData` | Add a new `useMemo` with deps `[knownRooms, bookingsData, guestsDetailsData, guestByRoomData, activitiesData, startDate, endDate]` (same as `allRoomData` minus `getBedCount`) that scans `bookingsData` + `guestByRoomData` and produces `UnallocatedOccupant[]`. Return it alongside `getReservationDataForRoom` from the hook. | Clean separation of concerns — each memo has one job. `allRoomData` logic untouched. Independent testability. Clear TypeScript return type. | Two passes over `bookingsData` instead of one — marginal O(N) cost. | Dep array drift if `allRoomData` deps change but the new memo's deps are not updated in sync (mitigated by explicit dep list in planning task). | Yes |
| B — Single combined `useMemo` | Expand the existing `allRoomData` `useMemo` to simultaneously collect `unallocatedOccupants` as it iterates. Return both from a single `useMemo` result object. | One pass over data — marginally more efficient. Single dep array to maintain. | `allRoomData` memo becomes multi-purpose and harder to reason about. Mixing two different output shapes in one block increases cognitive load and test complexity. Any future change to either shape requires reasoning about both. | The combined memo return requires destructuring at the call site; adds coupling between unrelated concerns. | Yes |

**Eliminated options:**
- Separate `useUnallocatedOccupants` hook — ruled out: would duplicate the four Firebase `onValue` subscriptions already live in `useGridData`, contradicting the additive goal and introducing stale-data risk between two subscription instances.

## Engineering Coverage Comparison

| Coverage Area | Option A (second `useMemo`) | Option B (combined `useMemo`) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | Panel rendered by `UnallocatedPanel` using DS primitives — identical for both | Same | `UnallocatedPanel` renders above room list, using `Stack`/`Inline`, `border-border-2`, `bg-surface` tokens to match existing panel style. Badge with count in `RoomsGrid` header. Hides when `unallocatedOccupants.length === 0`. |
| UX / states | Read-only list for both; empty-state hides panel; loading/error propagate from shared hook state | Same | Empty state: panel hidden entirely (not an empty card). Loading: no separate loading state — panel rendered only after `!loading`. Error: parent error message covers both room panels and unallocated panel. |
| Security / privacy | N/A — internal tool, no new auth surface, no writes in v1 | Same | N/A |
| Logging / observability / audit | Option A: observability seam is the panel itself — staff can see unallocated count visually | Option B: same | No `console.warn` on every recompute — the existence of unallocated occupants is normal operational state, not an error; the hook recomputes on every live Firebase update. Observability is provided by the panel UI itself. No additional logging in the hook. |
| Testing / validation | Each memo independently testable — mock `useGuestByRoomData` to return absent `allocated`; assert `unallocatedOccupants` shape | Combined memo: same mock inputs but assertions on both outputs simultaneously — slightly harder to isolate | Unit tests cover **4 cases**: absent `allocated`, blank `allocated`, non-knownRooms `allocated`, and **occupant outside date window must be excluded**. `RoomsGrid.test.tsx` gets conditional panel assertion. `RoomsGrid.test.tsx` existing mocks must be updated to include `unallocatedOccupants: []`. Pattern established in `useGridData.test.ts`. |
| Data / contracts | New `UnallocatedOccupant` type exported from `useGridData.ts`. `IGuestByRoomData.allocated` corrected to `allocated?: string`. `useGridData` return type updated with `unallocatedOccupants: UnallocatedOccupant[]`. Both options require same type changes. | Same | `UnallocatedOccupant` must carry: `bookingRef`, `occupantId`, `firstName`, `lastName`, `checkInDate`, `checkOutDate`, `bookedRoom?: string` (prefer `guestByRoomData[occId]?.booked`, fallback to `bookingsData[ref]?.[occId]?.roomNumbers[0]` for missing-record case), `status: MyLocalStatus`. `BookingDetailsModal` also consumes `useGuestByRoomData` — verify its TypeScript remains valid after `allocated` optionality change. |
| Performance / reliability | O(N) second pass over `bookingsData` per render cycle. With 10 rooms × typical N bookings, cost is negligible. Memo only recomputes when any dep changes — same frequency as `allRoomData`. | Marginally fewer iterations (single pass) but difference is not measurable at expected data sizes | O(N) additional scan acceptable. No extra Firebase reads. Memo cache shared deps ensure synchronized recompute. |
| Rollout / rollback | Additive for both. Rollback = revert hook change + component deletion. No feature flag needed. No data migration. | Same | Purely additive. No migration. Internal tool — no staged rollout needed. |

## Chosen Approach

- **Recommendation:** Option A — second `useMemo` inside `useGridData`, returning `unallocatedOccupants: UnallocatedOccupant[]` alongside the existing `getReservationDataForRoom`.
- **Why this wins:**
  1. **Separation of concerns**: Each memo has a single, clear job. `allRoomData` builds per-room grid rows; the new memo builds an unallocated list. Mixing them in Option B conflates two different output shapes and two different consumers.
  2. **Independent testability**: The new memo can be tested in complete isolation from `allRoomData` — mock `guestByRoomData` with absent `allocated` values and assert `unallocatedOccupants` without touching the room-panel logic.
  3. **Safe evolution**: If `allRoomData` logic changes in the future (e.g., new status handling), the unallocated memo is unaffected. Option B creates accidental coupling.
  4. **Marginal performance difference is zero in practice**: O(N) second pass over bookings data at hostel scale (dozens of active bookings at most) is not measurable.
  5. **Dep array maintenance**: Both memos share the same dep array; no drift risk in practice.
- **What it depends on:**
  - `IGuestByRoomData.allocated` must be corrected to `allocated?: string` — required regardless of option.
  - `UnallocatedOccupant` type must be defined and exported.
  - `RoomsGrid.tsx` must be updated to consume `unallocatedOccupants` and render `UnallocatedPanel` conditionally.
  - Operator confirmation that v1 is read-only (no allocation action wired). Default assumption: yes. If operator wants the allocation action, a new occupant-scoped modal is required in a subsequent feature — not this one.

### Rejected Approaches

- **Option B (combined `useMemo`)** — rejected because mixing two distinct output shapes in a single memo increases cognitive load and couples unrelated concerns. The marginal performance gain (one fewer array scan) is not measurable at production data sizes and does not justify the structural trade-off.
- **Separate `useUnallocatedOccupants` hook** — rejected at fact-find stage: would duplicate the four Firebase `onValue` subscriptions, creating two independent live listeners for the same data and introducing stale-data divergence risk.
- **`BookingDetailsModal` reuse for allocation action in v1** — rejected: `handleConfirmMoveBooking` loops ALL occupants under the booking ref, not just the selected occupant. From an occupant-level unallocated panel, this would silently reassign allocated roommates. The panel is read-only in v1.

### Open Questions (Operator Input Required)

- Q: Should staff be able to click an occupant row in the unallocated panel to trigger an allocation action (assign to room) in a future iteration?
  - Why operator input is required: The correct UX for a v2 allocation action depends on whether a simple "pick room" interaction is sufficient or a richer flow (e.g., see bed availability before assigning) is needed. This is undocumented preference.
  - Planning impact: Does not affect v1 build. If yes for v2, a new occupant-scoped modal must be planned separately — it cannot reuse `BookingDetailsModal`.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Data pipeline | `useGridData` computes `allRoomData` only; occupants without `allocated` are dropped silently at line 241 | Page mounts / date window changes / Firebase data updates | (1) `useGridData` second `useMemo` scans same `bookingsData` + `guestByRoomData`; (2) collects occupants where `allocated` is absent/empty/not-in-knownRooms AND booking overlaps date window; (3) returns `unallocatedOccupants: UnallocatedOccupant[]` alongside existing API | `allRoomData` computation unchanged; existing room panels unaffected; Firebase subscription unchanged | Dep array must match `allRoomData` memo exactly; any future dep addition must update both memos |
| Staff view | Room panels only; unallocated occupants invisible | Page loads | `RoomsGrid.tsx` renders `UnallocatedPanel` above the room list when `unallocatedOccupants.length > 0`; panel shows each occupant's name, booking ref, check-in/check-out, booked room, status badge; panel hidden entirely when count is zero | Room panels, date pickers, StatusLegend, error/loading states unchanged | Panel must use DS tokens and `Stack`/`Inline` — visual consistency check needed in review |
| Type correctness | `IGuestByRoomData.allocated: string` — non-optional, inconsistent with Firebase runtime (key may be absent) | Build | `allocated?: string` — corrected to optional; optional chaining at line 241 already handles runtime absence | Rest of `IGuestByRoomData` unchanged | `useGuestByRoomData` is also consumed by `BookingDetailsModal.tsx` (line 50: `const { guestByRoomData } = useGuestByRoomData()`). The modal already accesses `guestByRoomData[occupantId]?.allocated` with optional chaining at line 77 — no behavioural change. Blast radius is contained but must verify `BookingDetailsModal` TypeScript after the type change. |
| Test coverage | `useGridData.test.ts` tests allocation-match path only; no unallocated path test; `RoomsGrid.test.tsx` mocks `useGridData()` returning `{ getReservationDataForRoom, loading, error }` — does not include `unallocatedOccupants` | Build | New: 3 unit test cases for unallocated computation; `RoomsGrid.test.tsx` **must be updated** — existing mock must add `unallocatedOccupants: []` to the `useGridData` return value or the component will fail to render; extend with conditional panel assertions; `UnallocatedPanel` RTL render tests | `RoomGrid.test.tsx` and `useGridData.test.ts` allocation-match tests unaffected | Tests run in CI only (`docs/testing-policy.md`) — push and watch CI. Planning must treat `RoomsGrid.test.tsx` update as required fix, not optional extension. |

## Planning Handoff

- Planning focus:
  - Define `UnallocatedOccupant` type in `useGridData.ts` and export it.
  - Add second `useMemo` for `unallocatedOccupants`. Dep array is **`allRoomData` minus `getBedCount`**: `[knownRooms, bookingsData, guestsDetailsData, guestByRoomData, activitiesData, startDate, endDate]`. `getBedCount` is NOT needed — unallocated occupants are not packed into bed rows. Note: `knownRooms` is still required to check whether `allocated` is a valid room. This dep array is a strict subset of `allRoomData`'s deps — no drift risk in practice.
  - Update `useGridData` return type to include `unallocatedOccupants`.
  - Fix `IGuestByRoomData.allocated` to `allocated?: string`.
  - Create `UnallocatedPanel` component (props: `occupants: UnallocatedOccupant[]`) using DS primitives.
  - Wire into `RoomsGrid.tsx` with conditional render (`unallocatedOccupants.length > 0`).
  - Write unit tests: 4 cases for memo computation (absent `allocated`, blank `allocated`, non-knownRooms `allocated`, occupant outside date window excluded), component render tests for `UnallocatedPanel`, `RoomsGrid.test.tsx` update (existing mock must include `unallocatedOccupants: []`) plus conditional panel assertions.
- Validation implications:
  - `validate-analysis.sh` and `validate-engineering-coverage.sh` passed for this analysis artifact.
  - `validate-fact-find.sh` already passed at fact-find stage (not a build gate).
  - Tests run in CI only — push after build and monitor with `gh run watch`.
  - Type correctness validated by `pnpm --filter reception typecheck` locally before push.
  - Lint validated by `pnpm --filter reception lint` locally before push.
- Sequencing constraints:
  1. Fix `IGuestByRoomData.allocated` to optional — must precede new memo (removes TypeScript noise in the new code).
  2. Define `UnallocatedOccupant` type and add `useMemo` to `useGridData` — produces the data surface.
  3. Create `UnallocatedPanel` component — consumes the data surface.
  4. Wire `UnallocatedPanel` into `RoomsGrid.tsx` — final integration.
  5. Write all tests — can follow implementation or be done in parallel by the same task.
- Risks to carry into planning:
  - Dep array drift: the new memo must have the same deps as `allRoomData` minus `getBedCount`. Planning task must list deps explicitly in the implementation contract.
  - `bookedRoom` field sourcing: prefer `guestByRoomData[occId]?.booked` when the record exists. However, one of the three unallocated cases is a **missing `guestByRoomData[occId]` entry entirely** — in that case `booked` is absent. Fall back to `bookingsData[ref]?.[occId]?.roomNumbers[0]` (the `IBookingData` booking-level room association) to preserve staff context. Type as `bookedRoom?: string` — display "—" when both sources are absent.
  - Empty-state visual: `UnallocatedPanel` must not render at all when empty (no empty card, no "0 unallocated" message). Implementation must guard at the `RoomsGrid.tsx` call site, not inside the panel component itself — keeps `UnallocatedPanel` a pure renderer.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `guestByRoomData.booked` may be absent for some occupants | Medium | Low | Firebase runtime data quality not inspectable in analysis | Type `bookedRoom` as optional; display "—" when absent |
| Future v2 allocation action requires new occupant-scoped modal | Medium | Medium | Out of scope for v1; operator preference not yet confirmed | Document explicitly in plan non-goals; do not wire any click handler to `BookingDetailsModal` |
| Dep array divergence between the two memos | Low | Low | Static concern — visible in code review | Plan task must list dep array explicitly; include in build task contract |
| `allRoomData` useMemo scale on very large multi-week date ranges | Low | Low | Not measurable at current booking volumes | Non-blocking; note in build task as a future optimization seam |

## Planning Readiness
- Status: Go
- Rationale: Approach is decisive. All options compared. No blocking open questions for v1 build. Type changes and sequencing constraints are explicit. Engineering coverage carried forward for all applicable areas.
