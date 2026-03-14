---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14 (TASK-05 complete — all tasks done)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-roomgrid-unallocated-panel
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-roomgrid-unallocated-panel/analysis.md
---

# Rooms-Grid Unallocated Panel Plan

## Summary
`useGridData.ts` line 241 silently drops occupants whose `guestByRoomData` entry has no valid allocated room, making them invisible on the rooms-grid page. This plan adds a second `useMemo` to `useGridData` that captures these occupants into a typed `UnallocatedOccupant[]`, then renders them in a new read-only `UnallocatedPanel` component wired into `RoomsGrid.tsx`. v1 is read-only (no allocation action); the changes are purely additive and leave existing room panels untouched. Four test tasks cover the new hook computation, component rendering, and the required `RoomsGrid.test.tsx` mock update.

## Active tasks
- [x] TASK-01: Fix `allocated` type to optional + define `UnallocatedOccupant` type
- [x] TASK-02: Add `unallocatedOccupants` computation to `useGridData`
- [x] TASK-03: Create `UnallocatedPanel` component
- [x] TASK-04: Wire `UnallocatedPanel` into `RoomsGrid.tsx`
- [x] TASK-05: Write tests (hook computation, component render, RoomsGrid integration)

## Goals
- Surface all unallocated occupants within the selected date window on the rooms-grid page.
- Show enough context per occupant (name, booking ref, check-in/check-out, booked room, status) for staff to act.
- Keep the change purely additive — no changes to existing room panel filter logic.
- Integrate with the existing Firebase subscription pipeline (no new `onValue` reads).

## Non-goals
- Allocation action from the unallocated panel in v1. `BookingDetailsModal` is NOT safe to reuse (it moves all occupants under the booking ref). A future occupant-scoped action is deferred.
- New Firebase paths or data model changes.
- Server-side notifications for unallocated bookings.
- i18n — English-only internal tool.

## Constraints & Assumptions
- Constraints:
  - DS primitives (`Stack`, `Inline`, `Cluster`) required for layout.
  - No new Firebase subscriptions — must reuse existing `useGridData` data.
  - `BookingDetailsModal` is unsafe for single-occupant allocation use.
  - Tests run in CI only (`docs/testing-policy.md`). Use `pnpm --filter reception typecheck` and `pnpm --filter reception lint` locally.
- Assumptions:
  - "Unallocated" = `guestByRoomData[occId]?.allocated` absent, `undefined`, `null`, empty string, OR not in `knownRooms`.
  - Date-window filter (checkInDate/checkOutDate vs page startDate/endDate) applies to the unallocated panel.
  - v1 is read-only.
  - `bookedRoom` prefers `guestByRoomData[occId]?.booked`; falls back to `bookingsData[ref]?.[occId]?.roomNumbers[0]`; displays "—" when both absent.

## Inherited Outcome Contract

- **Why:** Guests with confirmed bookings arrive at the hostel with no bed assigned because staff cannot see unallocated occupants anywhere on the rooms grid. The data exists but is hidden from the staff view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can identify all unallocated occupants directly from the rooms-grid page before guests arrive, eliminating the failure mode where guests arrive with no room assignment.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-roomgrid-unallocated-panel/analysis.md`
- Selected approach inherited:
  - Option A — second `useMemo` inside `useGridData` returning `unallocatedOccupants: UnallocatedOccupant[]`
  - Dep array: `[knownRooms, bookingsData, guestsDetailsData, guestByRoomData, activitiesData, startDate, endDate]` (same as `allRoomData` minus `getBedCount`)
  - `UnallocatedPanel` read-only, conditionally rendered in `RoomsGrid.tsx`
- Key reasoning used:
  - Separate memo = clean separation of concerns; independent testability; `allRoomData` logic untouched.
  - Separate hook option rejected: would duplicate four Firebase `onValue` subscriptions.
  - `BookingDetailsModal` reuse rejected: moves all occupants under booking ref, not just selected occupant.

## Selected Approach Summary
- What was chosen:
  - Second `useMemo` added to `useGridData.ts` that scans `bookingsData` and `guestByRoomData` to collect occupants where `allocated` is absent/empty/not-in-knownRooms and booking overlaps the selected date window.
  - New `UnallocatedOccupant` type exported from `useGridData.ts`.
  - `IGuestByRoomData.allocated` corrected to `allocated?: string`.
  - `UnallocatedPanel` component rendered above the room list in `RoomsGrid.tsx`, hidden when empty.
- Why planning is not reopening option selection:
  - Analysis settled the option comparison with a decisive recommendation. No operator-only forks remain for v1.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-roomgrid-unallocated-panel/fact-find.md`
- Evidence carried forward:
  - Drop point confirmed: `apps/reception/src/hooks/data/roomgrid/useGridData.ts:241`
  - `IGuestByRoomData` interface in `apps/reception/src/hooks/data/roomgrid/useGuestByRoomData.ts:26-31`
  - `RoomsGrid.test.tsx` mock shape: returns `{ getReservationDataForRoom, loading, error }` — must add `unallocatedOccupants: []` to avoid render failure
  - `BookingDetailsModal.tsx` also consumes `useGuestByRoomData` — verify TypeScript after `allocated` optionality change

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix `allocated` type + define `UnallocatedOccupant` | 92% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add `unallocatedOccupants` computation to `useGridData` | 88% | M | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Create `UnallocatedPanel` component | 88% | S | Complete (2026-03-14) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Wire `UnallocatedPanel` into `RoomsGrid.tsx` | 90% | S | Complete (2026-03-14) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Write tests (hook, component, RoomsGrid integration) | 85% | M | Complete (2026-03-14) | TASK-02, TASK-03, TASK-04 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `UnallocatedPanel` built with DS `Stack`/`Inline` primitives; uses `border-border-2`, `bg-surface`, `text-foreground` tokens matching existing panels; hidden when empty | TASK-03, TASK-04 | Post-build design QA required |
| UX / states | Empty: panel hidden entirely. Loading: rendered only inside `!loading` block (existing gate). Error: parent error message covers page. Read-only list. | TASK-03, TASK-04 | No separate loading spinner needed |
| Security / privacy | N/A — internal tool, read-only, no new auth surface, data already subscribed | N/A | — |
| Logging / observability / audit | Observability delivered by the panel itself (staff see unallocated count visually). No `console.warn` on recompute — normal operational state. | TASK-02 | No hook-level logging added |
| Testing / validation | 4 unit test cases for hook computation; `UnallocatedPanel` render tests; `RoomsGrid.test.tsx` mock update (required, not optional) + conditional panel assertions | TASK-05 | Tests run in CI only |
| Data / contracts | `IGuestByRoomData.allocated?: string` type fix; new `UnallocatedOccupant` type; `useGridData` return type update; `BookingDetailsModal` TypeScript verified after type change | TASK-01, TASK-02 | `bookedRoom` fallback pattern documented in TASK-02 |
| Performance / reliability | O(N) second pass acceptable at hostel booking volumes; no extra Firebase reads; memo recomputes at same frequency as `allRoomData` | TASK-02 | — |
| Rollout / rollback | Purely additive; rollback = revert TASK-01–05; no feature flag needed; no data migration | All tasks | Internal tool — no staged rollout |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Type-only change; no deps |
| 2 | TASK-02 | TASK-01 complete | Hook computation; TASK-01 must land first to avoid TS noise |
| 3 | TASK-03 | TASK-02 complete | Component needs `UnallocatedOccupant` type from TASK-02 |
| 4 | TASK-04 | TASK-02, TASK-03 complete | Integration step |
| 5 | TASK-05 | TASK-02, TASK-03, TASK-04 complete | Tests validate all prior tasks |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff rooms-grid view | Staff opens `/rooms-grid` page | (1) Page mounts → `useGridData` subscribes to four Firebase nodes (unchanged); (2) `allRoomData` memo computes room panels (unchanged); (3) NEW: second `useMemo` scans `bookingsData`+`guestByRoomData`, collects occupants where `allocated` absent/empty/not-in-knownRooms AND booking overlaps date window → `unallocatedOccupants`; (4) `RoomsGrid.tsx` renders `UnallocatedPanel` above room list when `unallocatedOccupants.length > 0`, hidden otherwise; (5) Staff sees name, booking ref, check-in/check-out, booked room, status per unallocated occupant | TASK-01→02→03→04 | Rollback: revert TASK-01–04 commits; no DB change |
| Data contract | Build | `IGuestByRoomData.allocated` becomes optional; `UnallocatedOccupant` type exported; `useGridData` return includes `unallocatedOccupants`; `BookingDetailsModal` TypeScript verified (uses optional chaining already — no change expected) | TASK-01, TASK-02 | If `BookingDetailsModal` TypeScript fails after type change, fix is contained to that file |
| Test coverage | CI push | `useGridData.test.ts` gains 4 unallocated cases; `RoomsGrid.test.tsx` mock updated to include `unallocatedOccupants: []`; `UnallocatedPanel` render tests added | TASK-05 | Tests run in CI only — push and watch |

## Tasks

---

### TASK-01: Fix `allocated` type to optional and define `UnallocatedOccupant` type
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/data/roomgrid/useGuestByRoomData.ts`, `apps/reception/src/hooks/data/roomgrid/useGridData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/roomgrid/useGuestByRoomData.ts` — change `allocated: string` to `allocated?: string`
  - `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — add exported `UnallocatedOccupant` interface
  - `[readonly] apps/reception/src/components/roomgrid/BookingDetailsModal.tsx` — verify TypeScript still valid after type change (already uses optional chaining at line 77)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 92%
  - Implementation: 95% — Single-line type change on a well-understood interface; `UnallocatedOccupant` type definition is fully specified. No execution uncertainty.
  - Approach: 95% — Type optionality already handled by optional chaining at `useGridData.ts:241`; this is a correctness fix, not a behavioral change. `BookingDetailsModal` already uses `guestByRoomData[occupantId]?.allocated` with optional chaining at line 77 — no behavioral change expected.
  - Impact: 90% — Removes a latent type mismatch. Held-back test: no single unknown would push below 80 because the optional chaining is already present in all consumers.
- **Acceptance:**
  - `IGuestByRoomData.allocated` is `allocated?: string` and `booked` is `booked?: string` in `useGuestByRoomData.ts` (roomgrid-local interface only; `guestByRoomSchema.ts` and `useGuestByRoom.ts` are not modified)
  - `UnallocatedOccupant` interface is exported from `useGridData.ts` with fields: `bookingRef: string`, `occupantId: string`, `firstName: string`, `lastName: string`, `checkInDate: string`, `checkOutDate: string`, `bookedRoom?: string`, `status: MyLocalStatus`
  - `pnpm --filter reception typecheck` passes with no new errors
  - `pnpm --filter reception lint` passes
  - **Expected user-observable behavior:** No visible change — this is a type-only fix with no runtime effect.
- **Engineering Coverage:**
  - UI / visual: N/A — type-only change
  - UX / states: N/A — type-only change
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — existing tests unchanged; type safety verified by typecheck
  - Data / contracts: Required — `allocated` correctly typed as optional; `UnallocatedOccupant` type defined as the contract for new computation
  - Performance / reliability: N/A — type-only
  - Rollout / rollback: Required — purely additive type change; rollback = revert the two file edits
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter reception typecheck` runs without new type errors after the change
  - TC-02: `BookingDetailsModal.tsx` imports `useGuestByRoomData` — verify no TypeScript errors introduced by the optionality change
- **Execution plan:** Red → Green → Refactor
  - Red: (no test needed — type-only; typecheck acts as the gate)
  - Green: Change `allocated: string` to `allocated?: string` and `booked: string` to `booked?: string` in `useGuestByRoomData.ts` only (matches raw Firebase shape confirmed in `useGuestByRoom.ts:20`). Do NOT modify `guestByRoomSchema.ts` (keeps `z.string()`) or `useGuestByRoom.ts` (keeps `?? ""` coercion). Add `UnallocatedOccupant` interface in `useGridData.ts` (can be placed before the `useGridData` function). Run `pnpm --filter reception typecheck` to confirm `BookingDetailsModal` is unaffected.
  - Refactor: None required.
- **Planning validation (required for M/L):** N/A — S effort
- **Scouts:** None: type change is unambiguous; all consumers use optional chaining already
- **Edge Cases & Hardening:** `BookingDetailsModal.tsx` also consumes `useGuestByRoomData` — verified at line 77 it uses `guestByRoomData[occupantId]?.allocated` with optional chaining. No change needed.
- **What would make this >=90%:** Already at 92%.
- **Rollout / rollback:**
  - Rollout: Deploy with rest of feature; type-only change has no runtime effect
  - Rollback: Revert `useGuestByRoomData.ts` change; remove `UnallocatedOccupant` from `useGridData.ts`
- **Documentation impact:** None
- **Notes / references:**
  - `useGuestByRoomData.ts:26-31` — interface location
  - `useGridData.ts:241` — optional chaining already present: `guestByRoomData[occId]?.allocated`
  - `BookingDetailsModal.tsx:77` — `guestByRoomData[occupantId]?.allocated` — safe
  - `useGuestByRoom.ts:67` — the shared (non-roomgrid) hook coerces `allocated` to `""` when absent via `roomData?.allocated ?? ""`; `guestByRoomSchema.ts:4` requires `z.string()` (non-optional). TASK-01 changes `allocated` to optional only in `useGuestByRoomData.ts` (roomgrid-local interface), NOT in `guestByRoomSchema.ts` or `useGuestByRoom.ts`. This correctly limits the scope to the roomgrid data layer without forking the shared contract. The roomgrid hook reads directly from Firebase (not via the shared hook), so the optionality reflects reality for this consumer without contradicting the shared normalizer.
- **Build Evidence (TASK-01 — Complete 2026-03-14):**
  - Changed `allocated: string` → `allocated?: string` and `booked: string` → `booked?: string` in `useGuestByRoomData.ts`
  - Added `UnallocatedOccupant` interface export to `useGridData.ts` (placed after `BookingDateRange` type)
  - `pnpm --filter @apps/reception typecheck` — passed (0 errors)
  - `pnpm --filter @apps/reception lint` — passed (0 errors, 4 pre-existing warnings in unrelated files)
  - Commit: `1f0fa08abe` via writer lock
  - `BookingDetailsModal.tsx` verified: uses `guestByRoomData[occupantId]?.allocated` with optional chaining at line 77 — no TypeScript change needed

---

### TASK-02: Add `unallocatedOccupants` computation to `useGridData`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/data/roomgrid/useGridData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — new `useMemo`, updated return type, exported `UnallocatedOccupant` type (from TASK-01)
  - `[readonly] apps/reception/src/hooks/data/roomgrid/useGuestByRoomData.ts` — consumed (type corrected in TASK-01)
  - `[readonly] apps/reception/src/hooks/data/roomgrid/useBookingsData.ts` — consumed for `roomNumbers` fallback
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 88%
  - Implementation: 90% — Data already subscribed; memo logic is a straightforward filter over existing data; `hasBookingDateRange` guard already exists. `bookedRoom` fallback pattern is specific but well-understood.
  - Approach: 90% — Second `useMemo` pattern chosen by analysis; dep array is explicit and enumerated.
  - Impact: 85% — Directly produces the data surface the panel depends on. Minor uncertainty: `guestByRoomData[occId]?.booked` field population rate in Firebase is not known precisely (treated as optional with fallback). Held-back test: if `bookedRoom` is absent for many occupants, the panel is still functional (shows "—") — no single unknown would break the feature.
- **Acceptance:**
  - `unallocatedOccupants: UnallocatedOccupant[]` is returned from `useGridData`
  - An occupant with absent `allocated` AND booking overlapping the date window appears in the array
  - An occupant with blank (`""`) `allocated` AND booking overlapping the date window appears in the array
  - An occupant with `allocated` set to a value NOT in `knownRooms` AND booking overlapping the date window appears in the array
  - An occupant with missing `allocated` BUT booking entirely outside the date window does NOT appear in the array
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes
  - **Expected user-observable behavior:** Not directly visible from this task alone — TASK-04 wires it to the UI. This task produces the data surface.
- **Engineering Coverage:**
  - UI / visual: N/A — hook-only change
  - UX / states: N/A — hook-only change
  - Security / privacy: N/A
  - Logging / observability / audit: Required — No `console.warn` added for unallocated count (normal operational state, not an error; hook recomputes on every Firebase update)
  - Testing / validation: Required — Covered by TASK-05 (4 test cases for the new memo logic)
  - Data / contracts: Required — New `unallocatedOccupants: UnallocatedOccupant[]` added to `useGridData` return type. `bookedRoom` sourcing: prefer `guestByRoomData[occId]?.booked`, fallback to `bookingsData[ref]?.[occId]?.roomNumbers[0]`.
  - Performance / reliability: Required — O(N) second pass over `bookingsData`; no extra Firebase reads; memo cached; same recompute frequency as `allRoomData`. Acceptable at hostel booking volumes.
  - Rollout / rollback: Required — Additive return field; consumers not reading it see no change. Rollback = remove memo + return field.
- **Validation contract (TC-02):**
  - TC-01: occupant with absent `allocated` + booking in window → included in `unallocatedOccupants`
  - TC-02: occupant with `allocated: ""` + booking in window → included
  - TC-03: occupant with `allocated: "99"` (not in knownRooms) + booking in window → included
  - TC-04: occupant with absent `allocated` + booking entirely outside window → NOT included
  - TC-05: occupant with valid `allocated` matching a known room → NOT included (existing behavior)
  - TC-06: `unallocatedOccupants` result contains correct `bookingRef`, `occupantId`, `firstName`, `lastName`, `checkInDate`, `checkOutDate`, `status`
  - TC-07: `bookedRoom` = `guestByRoomData[occId]?.booked` when record present; fallback to `bookingsData[ref]?.[occId]?.roomNumbers[0]` when absent; `undefined` when both absent
  - TC-08: Occupant with activity code `"23"` (bag-drop) → `status` is `"23"` (validated after adding `"23"` to the precedence list in this task)
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-05 writes failing test stubs for the new memo (but per testing policy tests run in CI — typecheck serves as the local gate)
  - Green: Add second `useMemo` after `allRoomData` in `useGridData.ts`:
    ```
    Dep array: [knownRooms, bookingsData, guestsDetailsData, guestByRoomData, activitiesData, startDate, endDate]
    Logic:
    - iterate Object.entries(bookingsData)
    - for each [ref, occMap], iterate Object.entries(occMap)
    - skip occId.startsWith("__")
    - skip if !hasBookingDateRange(rawData)
    - skip if booking outside date window (same guard as allRoomData: checkOutDate < startDate || checkInDate > endDate)
    - skip if checkInDate >= checkOutDate (invalid range)
    - include if: allocated is absent OR allocated === "" OR !knownRooms.includes(allocated)
    - build UnallocatedOccupant from: bookingRef=ref, occupantId=occId, firstName/lastName from guestsDetailsData, checkInDate/checkOutDate, status via getActivityStatus, bookedRoom via guestByRoomData[occId]?.booked ?? bookingsData[ref]?.[occId]?.roomNumbers?.[0]
    - sort result by checkInDate ascending using sortByDateAsc (already imported at line 11) for deterministic panel order
    ```
    Also add `"23"` to the `getActivityStatus` precedence list (same `useGridData.ts` — status `"23"` is already defined in `MyLocalStatus` and `statusColors`; its absence from the precedence array was a pre-existing omission, safe to fix now while the file is being edited).
    Add `unallocatedOccupants` to the hook return.
  - Refactor: Ensure dep array matches spec exactly. No additional refactor needed.
- **Planning validation (required for M/L):**
  - Checks run: Read `useGridData.ts` full file; `useBookingsData.ts` for `IBookingData` shape (specifically `roomNumbers: string[]`); `useGuestsDetailsData.ts` for name field access pattern; `useActivitiesData.ts` return shape.
  - Validation artifacts: `useGridData.ts:228-305` (existing allRoomData memo pattern); `useBookingsData.ts:20-27` (IBookingData includes `roomNumbers: string[]`); `useGuestsDetailsData.ts` (guestsDetailsData indexed by `[bookingRef][occupantId]`).
  - Unexpected findings: None.
- **Scouts:** `hasBookingDateRange` is a file-local function at `useGridData.ts:45` (not exported) — usable in the new memo since both reside in the same module. `getActivityStatus` is also module-level, usable directly. TASK-02 will add `"23"` to the `getActivityStatus` precedence list (same-file change — status `"23"` (bag-drop) is already defined in `MyLocalStatus` and `statusColors` but was omitted from the precedence array). Sort: `unallocatedOccupants` must be sorted by `checkInDate` ascending (using `sortByDateAsc` already imported at line 11) before returning, to match the deterministic ordering pattern used for `allRoomData` and to enable stable RTL assertions.
- **Edge Cases & Hardening:**
  - Missing `guestByRoomData[occId]` entry: `guestByRoomData[occId]?.allocated` evaluates to `undefined` → included as unallocated. `bookedRoom` falls back to `bookingsData[ref]?.[occId]?.roomNumbers?.[0]`.
  - `roomNumbers` is `string[]` — may be empty array; `roomNumbers?.[0]` returns `undefined` safely.
  - Invalid date range (checkInDate >= checkOutDate): skipped with same guard as `allRoomData`.
  - Metadata keys (`__`-prefixed): skipped with same guard as `allRoomData`.
- **What would make this >=90%:** Confirming `guestByRoomData[occId]?.booked` is consistently populated in production Firebase (currently unknown — treated as optional with fallback).
- **Rollout / rollback:**
  - Rollout: Deployed as part of full feature; new return field is ignored by existing `RoomsGrid.tsx` until TASK-04 lands
  - Rollback: Remove `unallocatedOccupants` from memo and return type
- **Documentation impact:** None
- **Notes / references:**
  - `useGridData.ts:228-305` — existing allRoomData memo for pattern reference
  - `useGridData.ts:172-192` — `getActivityStatus` function (module-level, usable)
  - `useGridData.ts:45-61` — `hasBookingDateRange` type guard
  - `useGuestByRoomData.ts:26-31` — `IGuestByRoomData` interface
  - `useBookingsData.ts:20-27` — `IBookingData` shape with `roomNumbers: string[]`

**Consumer tracing for new output:**
- `unallocatedOccupants: UnallocatedOccupant[]` is consumed by: `RoomsGrid.tsx` (TASK-04). No other consumers exist at time of planning. `RoomsGrid.test.tsx` mock must add `unallocatedOccupants: []` to avoid render failure (TASK-05).

---

### TASK-03: Create `UnallocatedPanel` component
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new file `apps/reception/src/components/roomgrid/UnallocatedPanel.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/roomgrid/UnallocatedPanel.tsx` — new file
  - `[readonly] apps/reception/src/hooks/data/roomgrid/useGridData.ts` — imports `UnallocatedOccupant` type
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% — New component using established DS primitives; pattern is directly observable in `RoomGrid.tsx` panel header and `StatusLegend.tsx`.
  - Approach: 90% — Read-only display; no state management; props-only component. Clear design from analysis.
  - Impact: 85% — Provides the visible staff surface. Slight uncertainty on exact visual design details (badge placement, row layout) to be resolved during build with design QA.
- **Acceptance:**
  - `UnallocatedPanel` renders a panel with header "Unallocated Bookings" (or similar) using DS primitives
  - Each occupant row shows: name (`firstName lastName`), booking ref, check-in date, check-out date, booked room (or "—" if absent), status badge matching `statusColors`
  - Panel uses `border-border-2`, `bg-surface`, `text-foreground` tokens matching existing room panels
  - `pnpm --filter reception typecheck` passes
  - Post-build: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`; resolve Critical/Major findings before marking complete
  - **Expected user-observable behavior:**
    - [ ] When unallocated occupants exist in date window, a distinct panel appears above the room list with a header and list of occupants
    - [ ] Each row shows occupant name, booking ref, date range, booked room, and status
    - [ ] Panel is visually consistent with the existing room panels (same border, background, font styles)
    - [ ] Status badge colour matches the existing `statusColors` mapping
- **Engineering Coverage:**
  - UI / visual: Required — New component; DS tokens must match existing panels; post-build design QA required
  - UX / states: Required — Read-only list; no empty state rendered (panel is conditionally rendered from `RoomsGrid.tsx`); no loading state (data arrives from parent)
  - Security / privacy: N/A — internal tool; read-only display
  - Logging / observability / audit: N/A — observability is the panel itself
  - Testing / validation: Required — Covered by TASK-05 render tests
  - Data / contracts: Required — Props interface: `occupants: UnallocatedOccupant[]`; must not accept empty array (caller guards this)
  - Performance / reliability: N/A — simple list render; no Firebase reads
  - Rollout / rollback: Required — New file; rollback = delete file
- **Validation contract (TC-03):**
  - TC-01: Renders with one occupant → shows name, booking ref, dates, booked room, status
  - TC-02: Renders with multiple occupants → all rows present
  - TC-03: `bookedRoom` absent → displays "—"
  - TC-04: Status `"12"` → status badge color matches `statusColors["12"]`
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-05 adds failing render tests
  - Green: Create `UnallocatedPanel.tsx` as a functional component. Props: `{ occupants: UnallocatedOccupant[] }`. Use DS `Stack` for layout, `Inline` for header, panel header pattern from `RoomGrid.tsx` (lines 123-129). Each row is an `Inline` with occupant fields. Status color via `statusColors[occupant.status]`.
  - Refactor: Ensure no raw colors (ds/no-raw-color lint rule); use only token-based styles.
- **Planning validation (required for M/L):** N/A — S effort
- **Scouts:** `statusColors` is already imported in `RoomGrid.tsx` from `./constants/statusColors` — available in the same directory.
- **Edge Cases & Hardening:** `bookedRoom` may be `undefined` → display "—". `firstName`/`lastName` may both be empty string → display "Unknown" or blank (consistent with existing behavior in `RoomGrid.tsx` where blank names are passed through).
- **What would make this >=90%:** Post-build design QA confirming visual consistency.
- **Rollout / rollback:**
  - Rollout: New file only; no effect until TASK-04 imports it
  - Rollback: Delete `UnallocatedPanel.tsx`
- **Documentation impact:** None
- **Notes / references:**
  - `RoomGrid.tsx:123-129` — panel header pattern to reuse
  - `apps/reception/src/components/roomgrid/constants/statusColors.ts` — status color map
  - `StatusLegend.tsx` — reference for status badge rendering pattern

---

### TASK-04: Wire `UnallocatedPanel` into `RoomsGrid.tsx`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/roomgrid/RoomsGrid.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — destructure `unallocatedOccupants` from `useGridData`; conditionally render `UnallocatedPanel`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — Minimal change to a well-understood file; destructure one new field and add one conditional render block. Pattern is established.
  - Approach: 90% — Insertion point is clear (above the `knownRooms.map()` block inside the `DndProvider`). Conditional render (`unallocatedOccupants.length > 0`) is straightforward.
  - Impact: 90% — This is the final integration step that makes the feature visible to staff. Held-back test: no single unknown would push this below 80.
- **Acceptance:**
  - `RoomsGrid.tsx` destructures `unallocatedOccupants` from `useGridData` return
  - `UnallocatedPanel` is rendered above the room list when `unallocatedOccupants.length > 0`
  - `UnallocatedPanel` is NOT rendered when `unallocatedOccupants.length === 0`
  - Existing room panel rendering unchanged
  - `pnpm --filter reception typecheck` passes
  - **Expected user-observable behavior:**
    - [ ] When no unallocated occupants exist in the date window, the rooms-grid page looks identical to before
    - [ ] When unallocated occupants exist, the `UnallocatedPanel` appears above the room panels
    - [ ] The room panels below are unchanged in appearance and behavior
- **Engineering Coverage:**
  - UI / visual: Required — Placement above room list; conditional rendering; visual consistency check in design QA
  - UX / states: Required — Hidden when empty (no empty panel card); loading state: rendered inside `!loading && error == null` block (same as room panels — panel only appears after data loaded with no error)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-05 updates `RoomsGrid.test.tsx` mock to include `unallocatedOccupants` and adds conditional panel assertions
  - Data / contracts: Required — `unallocatedOccupants` consumed from `useGridData`; passed directly to `UnallocatedPanel`
  - Performance / reliability: N/A — simple conditional render
  - Rollout / rollback: Required — Single file edit; rollback = revert
- **Validation contract (TC-04):**
  - TC-01: When `unallocatedOccupants.length > 0` → `UnallocatedPanel` rendered
  - TC-02: When `unallocatedOccupants.length === 0` → `UnallocatedPanel` NOT rendered
  - TC-03: `loading === true` → neither room panels nor unallocated panel rendered (existing gate)
  - TC-04: `error != null` → error message rendered, not panels (existing gate)
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-05 adds conditional panel assertions to `RoomsGrid.test.tsx`
  - Green: In `RoomsGrid.tsx`, destructure `unallocatedOccupants` from `useGridData(startDate, endDate)`. The current `!loading && error == null` gate is a single expression `{!loading && error == null && knownRooms.map(...)}` — to insert the panel within the same gate, wrap both in a React fragment:
    ```tsx
    {!loading && error == null && (
      <>
        {unallocatedOccupants.length > 0 && (
          <UnallocatedPanel occupants={unallocatedOccupants} />
        )}
        {knownRooms.map((roomNumber) => { ... })}
      </>
    )}
    ```
    Import `UnallocatedPanel`.
  - Refactor: None required.
- **Planning validation (required for M/L):** N/A — S effort
- **Scouts:** `RoomsGrid.tsx` is a `memo` component — destructuring a new field from `useGridData` will not cause any memoization issues since `useGridData` is already called unconditionally.
- **Edge Cases & Hardening:** `unallocatedOccupants` is always an array (never undefined) since `useGridData` will initialize it to `[]`. The `length > 0` guard is sufficient.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploys with rest of feature
  - Rollback: Revert `RoomsGrid.tsx` to remove destructuring and conditional render
- **Documentation impact:** None
- **Notes / references:**
  - `RoomsGrid.tsx:103-116` — existing conditional render block for room panels (insertion point reference)

---

### TASK-05: Write tests (hook computation, component render, RoomsGrid integration)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts`, `apps/reception/src/components/roomgrid/__tests__/UnallocatedPanel.test.tsx` (new), `apps/reception/src/components/roomgrid/__tests__/RoomsGrid.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** Commit `a8b74fe2b7`. All 11 TC contracts implemented: TC-01 through TC-11 in `useGridData.test.ts` (including ordering test), TC-05/TC-06 and 4 additional cases in `UnallocatedPanel.test.tsx` (new file), TC-07/TC-08 plus beforeEach mock reset in `RoomsGrid.test.tsx`. DS primitives mocked as plain divs in `UnallocatedPanel.test.tsx`; `statusColors` mocked via Proxy. `text-white` → `text-danger-fg` lint fix in `UnallocatedPanel.tsx`. Typecheck and lint pass locally; CI validates on push.
- **Affects:**
  - `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts` — add 7 new test cases (TC-01 through TC-04 for unallocated computation, TC-09 for `bookedRoom` present, TC-10 for `bookedRoom` fallback, TC-11 for status `"23"` bag-drop now passing after TASK-02 precedence fix)
  - `apps/reception/src/components/roomgrid/__tests__/UnallocatedPanel.test.tsx` — new file (TC-05, TC-06)
  - `apps/reception/src/components/roomgrid/__tests__/RoomsGrid.test.tsx` — update mock to add `unallocatedOccupants: []`; add 2 conditional panel test cases (TC-07, TC-08)
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — All test patterns established in existing files; mocked hook pattern in `useGridData.test.ts` is directly reusable; RTL render pattern in `RoomsGrid.test.tsx` is directly reusable.
  - Approach: 85% — 4-case hook test + component render + integration. Clear test seams.
  - Impact: 80% — Tests validate the feature and prevent regression. Held-back test: if `UnallocatedPanel` renders differently than expected in the RTL environment (e.g., DS component mocking issues), tests may need adjustment. Confidence stays at 80% because the DS mock pattern for new components has a small residual risk.
- **Acceptance:**
  - `useGridData.test.ts`: 7 new test cases pass (absent allocated, blank allocated, non-knownRooms allocated, outside date window excluded, `bookedRoom` present, `bookedRoom` fallback, status `"23"` bag-drop now returns `"23"` after TASK-02 precedence fix)
  - `UnallocatedPanel.test.tsx`: renders correctly for 1 occupant, multiple occupants, and `bookedRoom: undefined` (displays "—")
  - `RoomsGrid.test.tsx`: existing mock updated to return `unallocatedOccupants: []` — existing tests continue to pass; 2 new cases added (panel present when `unallocatedOccupants` non-empty, panel absent when empty)
  - All tests pass in CI
  - **Expected user-observable behavior:** (test-level) — CI green across all new and existing roomgrid tests
- **Engineering Coverage:**
  - UI / visual: Required — `UnallocatedPanel` render test validates visual structure
  - UX / states: Required — Test cases cover absent/present panel states
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — This task IS the testing coverage
  - Data / contracts: Required — Tests validate `UnallocatedOccupant` shape from hook
  - Performance / reliability: N/A — unit test scope
  - Rollout / rollback: N/A — tests don't affect rollout
- **Validation contract (TC-05):**
  - TC-01: `useGridData` with `guestByRoomData: { OCC1: {} }` (no `allocated` key) → `unallocatedOccupants` includes OCC1
  - TC-02: `useGridData` with `guestByRoomData: { OCC1: { allocated: "", booked: "6" } }` → included
  - TC-03: `useGridData` with `guestByRoomData: { OCC1: { allocated: "99" } }` (not in knownRooms) → included
  - TC-04: `useGridData` with booking outside date window + unallocated → NOT included
  - TC-05: `UnallocatedPanel` renders name, booking ref, dates for a single occupant
  - TC-06: `UnallocatedPanel` renders "—" when `bookedRoom` is undefined
  - TC-07: `RoomsGrid` renders `UnallocatedPanel` when `unallocatedOccupants.length > 0`
  - TC-08: `RoomsGrid` does NOT render `UnallocatedPanel` when `unallocatedOccupants` is empty
  - TC-09: `useGridData` with occupant having `bookedRoom` present in `guestByRoomData.booked` → `bookedRoom` = that value
  - TC-10: `useGridData` with occupant having no `guestByRoomData` entry → `bookedRoom` falls back to `bookingsData[ref][occId].roomNumbers[0]`
  - TC-11: Occupant with activity code `"23"` (bag-drop) → `status` is `"23"` (TASK-02 adds `"23"` to the `getActivityStatus` precedence list; this case now passes as a positive assertion)
- **Execution plan:** Red → Green → Refactor
  - Red: Write test stubs for TC-01 through TC-11 using `it.todo()` / `test.todo()` first (confirm CI pipeline treats `todo` as non-failing; if not, write full tests directly).
  - Green: Implement TC-01 through TC-11 using established mock patterns from `useGridData.test.ts` and `RoomsGrid.test.tsx`. Update `RoomsGrid.test.tsx` `useGridData` mock to include `unallocatedOccupants: []`. TC-11 (bag-drop status) depends on TASK-02 having added `"23"` to the `getActivityStatus` precedence list.
  - Refactor: Ensure test descriptions are clear and consistent with TC numbering.
- **Planning validation (required for M/L):**
  - Checks run: Read `useGridData.test.ts` full test (confirms mock pattern: `jest.mocked(useBookingsData)`, `jest.mocked(useGuestByRoomData)`, `renderHook`). Read `RoomsGrid.test.tsx` mock structure (confirms `useGridData` mock shape must add `unallocatedOccupants: []`).
  - Validation artifacts: `useGridData.test.ts:96-164`; `RoomsGrid.test.tsx:20-27` (useGridData mock returns `{ getReservationDataForRoom, loading, error }` — must add `unallocatedOccupants: []`).
  - Unexpected findings: CI-only test policy confirmed — do not run tests locally. Push and watch with `gh run watch`.
- **Scouts:** Confirm CI pipeline does not fail on `it.todo()` tests — if it does, write full tests immediately rather than using stubs. (Based on existing test patterns in the repo, `todo` tests are typically treated as pending not failing — verify if uncertain.)
- **Edge Cases & Hardening:** DS components in RTL tests may need mocking (e.g., `@acme/design-system/primitives` components). Follow existing `RoomsGrid.test.tsx` mocking pattern — it already handles DS components.
- **What would make this >=90%:** Confirming DS component mocking pattern for `UnallocatedPanel` does not require new mock setup beyond what `RoomsGrid.test.tsx` already establishes.
- **Rollout / rollback:**
  - Rollout: Tests land with feature; CI validates on push
  - Rollback: Delete `UnallocatedPanel.test.tsx`; revert `useGridData.test.ts` and `RoomsGrid.test.tsx` additions
- **Documentation impact:** None
- **Notes / references:**
  - `useGridData.test.ts:96-164` — existing mock pattern for new test cases
  - `RoomsGrid.test.tsx:20-27` — `useGridData` mock shape (add `unallocatedOccupants: []`)
  - `docs/testing-policy.md` — CI-only test execution policy

---

## Risks & Mitigations
- `bookedRoom` field absent for many occupants: panel still functional (shows "—"); no breakage risk. Mitigated by fallback chain in TASK-02.
- `RoomsGrid.test.tsx` mock update missed: existing tests will fail to render after TASK-04 destructures `unallocatedOccupants`. Mitigated by explicit requirement in TASK-05 acceptance.
- DS component mocking complexity in `UnallocatedPanel.test.tsx`: follow existing `RoomsGrid.test.tsx` pattern. If new mocks needed, TASK-05 confidence absorbs this risk at 85%.
- `BookingDetailsModal.tsx` TypeScript errors after `allocated` optionality change: already uses optional chaining at line 77; risk is low. Verified in TASK-01 acceptance.

## Observability
- Logging: None — unallocated occupants are normal operational state; no hook-level logging added.
- Metrics: None — observability is the panel UI itself (staff see the count visually).
- Alerts/Dashboards: None — internal tool.

## Acceptance Criteria (overall)
- [ ] Rooms-grid page shows `UnallocatedPanel` when unallocated occupants exist in the selected date window
- [ ] Panel hidden entirely when no unallocated occupants in window
- [ ] Each row shows name, booking ref, check-in/check-out, booked room (or "—"), status badge
- [ ] Existing room panels unchanged in appearance and behavior
- [ ] `pnpm --filter reception typecheck` passes
- [ ] `pnpm --filter reception lint` passes
- [ ] All new and existing roomgrid tests pass in CI
- [ ] Post-build design QA (contrast + breakpoint sweeps) passes with no Critical/Major findings

## Decision Log
- 2026-03-14: v1 scoped as read-only (no allocation action). `BookingDetailsModal` reuse ruled out — it moves all occupants under booking ref, not just selected occupant. Any future v2 allocation action requires a new occupant-scoped modal.
- 2026-03-14: Option A (second `useMemo`) chosen over Option B (combined `useMemo`) for separation of concerns and independent testability.
- 2026-03-14: `bookedRoom` uses two-source fallback (`guestByRoomData.booked` → `bookingsData.roomNumbers[0]`) to handle missing-record occupants.
- 2026-03-14: `allocated?: string` and `booked?: string` optionality fixes scoped to `useGuestByRoomData.ts` (roomgrid-local interface only). Raw Firebase shape confirmed in `useGuestByRoom.ts:20` as `{ allocated?: string; booked?: string }`. `guestByRoomSchema.ts` (`z.string()`) and `useGuestByRoom.ts` (coerces absent to `""`) are left unchanged — the shared normalizer already handles the missing-key case; the roomgrid interface correction simply reflects the raw Firebase shape that the roomgrid hook reads directly. No contract fork created; shared consumers unaffected.
- 2026-03-14: `getActivityStatus` was missing status `"23"` (bag-drop) from its precedence list, despite `"23"` being defined in both `MyLocalStatus` and `statusColors`. TASK-02 fixes this omission as a same-outcome change (same file already being edited). TC-11 validates the fixed behavior. No adjacent-scope routing needed.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix `allocated` type + define `UnallocatedOccupant` | Yes | None | No |
| TASK-02: Add `unallocatedOccupants` computation | Yes (TASK-01 complete: type correction removes TS noise; `UnallocatedOccupant` type available) | None | No |
| TASK-03: Create `UnallocatedPanel` component | Yes (TASK-02 complete: `UnallocatedOccupant` type exported; status colors available) | None | No |
| TASK-04: Wire into `RoomsGrid.tsx` | Yes (TASK-02: `unallocatedOccupants` in hook return; TASK-03: `UnallocatedPanel` importable) | None | No |
| TASK-05: Write tests | Yes (TASK-02, 03, 04 complete; all contracts defined; mock shapes known) | [Type contract gap] [Minor]: `RoomsGrid.test.tsx` existing mock returns `{ getReservationDataForRoom, loading, error }` without `unallocatedOccupants` — existing tests will fail after TASK-04 until mock is updated. TASK-05 acceptance explicitly requires this update. | No (required fix included in TASK-05 acceptance) |

## Overall-confidence Calculation
- TASK-01: confidence 92%, effort S=1
- TASK-02: confidence 88%, effort M=2
- TASK-03: confidence 88%, effort S=1
- TASK-04: confidence 90%, effort S=1
- TASK-05: confidence 85%, effort M=2
- Weighted sum: (92×1 + 88×2 + 88×1 + 90×1 + 85×2) / (1+2+1+1+2) = (92+176+88+90+170) / 7 = 616/7 ≈ 88%
- Overall-confidence: **85%** (applying downward bias per confidence scoring rules — held to 85% because TASK-05 DS mocking uncertainty is not fully resolved until build)
