---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-unallocated-panel
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-roomgrid-unallocated-panel/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-001
Trigger-Why: Guests with confirmed bookings arrive at the hostel with no bed assigned because staff cannot see unallocated occupants anywhere on the rooms grid.
Trigger-Intended-Outcome: type: operational | statement: Staff can identify all unallocated occupants directly from the rooms-grid page before guests arrive, eliminating the failure mode where guests arrive with no room assignment. | source: operator
---

# Rooms-Grid Unallocated Panel — Fact-Find Brief

## Scope

### Summary
The rooms-grid page (`/rooms-grid`) shows one `RoomGrid` per known room (rooms 3–12). Occupants that have a booking in Firebase but have not yet been assigned a bed appear in `guestByRoomData` with a missing, empty, or null `allocated` field. The filter `guestByRoomData[occId]?.allocated !== room` in `useGridData.ts` (line 241) silently drops these occupants — they never appear in any room panel, making them invisible to staff.

The change being considered is adding a new "Unallocated" panel (or badge/section) to the rooms-grid page that collects and displays every occupant whose `guestByRoomData` entry has `allocated` absent, null, or empty, along with enough booking context for staff to act on the allocation before the guest arrives.

### Goals
- Surface all unallocated occupants on the rooms-grid page within the selected date window.
- Show enough context per occupant (name, booking ref, check-in/check-out date, occupant status) for staff to take action.
- Keep the implementation additive — no changes to existing room panels or the filter logic that powers them.
- Integrate cleanly with the existing `useGridData` data pipeline (Firebase live subscription).

### Non-goals
- Adding a net-new bed-allocation workflow. Note: `BookingDetailsModal` already contains a "Move Booking" room-assignment action backed by `useAllocateRoom`; whether the unallocated panel exposes that existing workflow is an open scope question for analysis.
- Adding server-side push notifications for unallocated bookings.
- Changes to the Firebase data model or how `allocated` is written.

### Constraints & Assumptions
- Constraints:
  - Internal tool — English only, no i18n required.
  - Must work with the existing Firebase Realtime Database subscription pattern (`onValue`).
  - `useRoomConfigs` returns a static list of known rooms (3–12). Occupants whose `allocated` value is not in `knownRooms` are also effectively unallocated from the grid's perspective.
  - No new Firebase paths — reads only existing `bookings`, `guestByRoom`, `guestsDetails`, `activities` nodes.
- Assumptions:
  - An occupant is "unallocated" if `guestByRoomData[occId]?.allocated` is absent, `undefined`, `null`, or an empty string, OR if the value is not in the `knownRooms` list.
  - The date-range filter (checkInDate/checkOutDate vs page startDate/endDate) should apply to the unallocated panel as well — no value in showing occupants outside the selected window.
  - The `booked` field on `guestByRoomData` entries records the originally booked room and is informational; `allocated` is the actual assignment.

## Outcome Contract

- **Why:** Guests with confirmed bookings arrive at the hostel with no bed assigned because staff cannot see unallocated occupants anywhere on the rooms grid. This is an operational gap: the data exists but is hidden from the staff view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can identify all unallocated occupants directly from the rooms-grid page before guests arrive, eliminating the failure mode where guests arrive with no room assignment.
- **Source:** operator

## Current Process Map

- Trigger: Staff opens the rooms-grid page in Reception.
- End condition: Staff sees all allocated bookings in per-room panels; unallocated bookings are silently absent.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Data loading | Page mounts → `useGridData` subscribes to Firebase `bookings`, `guestByRoom`, `guestsDetails`, `activities` nodes | Firebase Realtime DB → React hooks | `useGridData.ts`, `useGuestByRoomData.ts`, `useBookingsData.ts` | None in loading itself |
| Occupant filtering | For each (bookingRef, occId) in `bookingsData`, check `guestByRoomData[occId]?.allocated !== room` — if not matching the current room, skip entirely | `useGridData.ts` line 241 | `useGridData.ts:241` | **Occupants without an `allocated` value are dropped here silently** |
| Room panel rendering | `RoomsGrid.tsx` iterates `knownRooms` (rooms 3–12), renders one `RoomGrid` per room with filtered data | `RoomsGrid.tsx`, `RoomGrid.tsx` | None | No unallocated slot exists |
| Staff action | Staff can see allocated occupants and click cells to see booking details | `BookingDetailsModal.tsx` | None | No action possible for unallocated because they are invisible |

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/rooms-grid/page.tsx` — Next.js route page, dynamically imports `RoomsGridClient` with `ssr: false` to prevent Firebase initialisation during SSR
- `apps/reception/src/app/rooms-grid/RoomsGridClient.tsx` — wraps `<Providers>` + `<RoomsGrid>`; this is the client boundary entry

### Key Modules / Files
1. `apps/reception/src/hooks/data/roomgrid/useGridData.ts` — central data pipeline; computes `allRoomData: Record<string, GridReservationRow[]>`; the allocation filter lives here at line 241
2. `apps/reception/src/hooks/data/roomgrid/useGuestByRoomData.ts` — subscribes to Firebase `guestByRoom` node; returns `IGuestByRoomData` keyed by occupantId with `{ allocated: string; booked: string }`
3. `apps/reception/src/hooks/data/roomgrid/useBookingsData.ts` — subscribes to Firebase `bookings` node; returns `IBookingData` keyed by bookingRef → occupantId with checkIn/checkOut dates and `roomNumbers[]`
4. `apps/reception/src/hooks/data/roomgrid/useGuestsDetailsData.ts` — subscribes to Firebase `guestsDetails` node; returns guest names, emails, document info
5. `apps/reception/src/hooks/data/roomgrid/useActivitiesData.ts` — subscribes to Firebase `activities` node; status codes drive cell colours
6. `apps/reception/src/hooks/client/checkin/useRoomConfigs.ts` — static config; `knownRooms = ["3","4","5","6","7","8","9","10","11","12"]`, `getBedCount()` per room
7. `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — top-level rooms-grid component; renders date pickers + one `RoomGrid` per `knownRoom`; insertion point for new unallocated panel
8. `apps/reception/src/components/roomgrid/RoomGrid.tsx` — single-room grid using `ReservationGrid<MyLocalStatus>`; click opens `BookingDetailsModal`
9. `apps/reception/src/types/MyLocalStatus.ts` — union type for occupant status codes (`"1"` | `"8"` | `"12"` | `"14"` | `"16"` | `"23"` | `"free"` | `"disabled"` | `"awaiting"` | `"confirmed"`)
10. `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx` — modal for booking details and the existing "Move Booking" room-assignment action via `useAllocateRoom`; uses `bookingDetails.date` in `allocateRoomIfAllowed` calls — critical constraint for unallocated panel integration
11. `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts` — existing unit tests for `useGridData` and `packBookingsIntoRows`; confirms mocked hook pattern

### Patterns & Conventions Observed
- Firebase subscriptions: `onValue` listeners via `useFirebaseSubscription` wrapper or inline in hooks — evidence: `useBookingsData.ts`, `useGuestByRoomData.ts`
- React hook composition: `useGridData` composes four data hooks and transforms in `useMemo` — evidence: `useGridData.ts:198-305`
- DS primitives: `Stack`, `Inline`, `Cluster` from `@acme/design-system/primitives` — evidence: `RoomsGrid.tsx`
- Mocked hook tests: `jest.mock()` pattern with `jest.mocked()` — evidence: `useGridData.test.ts`
- `ssr: false` dynamic import for Firebase-dependent pages — evidence: `page.tsx`

### Data & Contracts
- Types/schemas/events:
  - `IGuestByRoomData` in `useGuestByRoomData.ts`: `{ [occupantId]: { allocated: string; booked: string } }` — `allocated` field is typed as `string` but may be absent in Firebase (optional in practice)
  - `IBookingData` in `useBookingsData.ts`: `{ [bookingRef]: { [occupantId]: { checkInDate, checkOutDate, leadGuest, roomNumbers[] } } }` — `roomNumbers[]` records originally booked rooms
  - `GridReservationRow` in `useGridData.ts`: `{ id, title, info, startDate, endDate, periods: TBookingPeriod[] }`
  - `TBookingPeriod` in `useGridData.ts`: `{ start, end, status: MyLocalStatus, bookingRef, occupantId, firstName, lastName, info, color }`
  - `MyLocalStatus` in `MyLocalStatus.ts`: string literal union — codes 1/8/12/14/16/23 plus semantic strings
- Persistence:
  - Firebase Realtime DB nodes: `bookings/`, `guestByRoom/`, `guestsDetails/`, `activities/`
  - All reads are live subscriptions (`onValue`); no writes from the rooms-grid page
- API/contracts:
  - `useGridData` returns `{ getReservationDataForRoom, testDates, testStartDate, testEndDate, loading, error }` — no `unallocatedOccupants` surface yet

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase Realtime DB (all four nodes)
  - `useRoomConfigs` (static config — no Firebase)
  - Design System: `@acme/design-system`, `@acme/design-system/primitives`
- Downstream dependents:
  - `RoomsGrid.tsx` consumes `useGridData` — only consumer
  - `RoomGrid.tsx` consumes `GridReservationRow[]` — one per room
  - `BookingDetailsModal.tsx` — opened on cell click from existing room panels. **NOT safely reusable from the unallocated panel** — its "Move Booking" action moves all occupants under the booking ref, not just the selected occupant. v1 unallocated panel is read-only; `BookingDetailsModal` is not wired from it.
- Likely blast radius:
  - Adding an `unallocatedOccupants` computed value to `useGridData` return touches only the hook's `useMemo` block — contained
  - Adding a new `UnallocatedPanel` component to `RoomsGrid.tsx` is purely additive — no existing components change
  - No Firebase writes; no changes to existing filter logic

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (`renderHook`, `render`)
- Commands: Tests run in CI only. Do not run `jest`, `pnpm test`, or `pnpm run test:governed` locally (see `docs/testing-policy.md`). Push and use `gh run watch` to monitor CI results.
- CI integration: runs in CI via monorepo test workflow

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useGridData` core filter + packing | Unit (hook) | `useGridData.test.ts` | Tests allocation-match path, metadata key skip, activity status. **No test for the unallocated drop path.** |
| `useGuestByRoomData` | Unit (hook) | `useGuestByRoomData.test.tsx` | Tests Firebase subscription and loading states |
| `useBookingsData` | Unit (hook) | `useBookingsData.test.tsx` | Tests raw data retrieval |
| `useGuestsDetailsData` | Unit (hook) | `useGuestsDetailsData.test.tsx` | Tests name field retrieval |
| `useActivitiesData` | Unit (hook) | `useActivitiesData.test.ts` | Tests activity data subscription |
| `RoomsGrid` component | Component (render + interaction) | `__tests__/RoomsGrid.test.tsx` | Tests date-picker updates, room panel rendering, loading/error states; mocks `useGridData` and `RoomGrid` |
| `RoomGrid` component | Component (render + interaction) | `__tests__/RoomGrid.test.tsx` | Tests cell click → `BookingDetailsModal` open/close; mocks `ReservationGrid` and `BookingDetailsModal` |
| `BookingDetailsModal` | Component (render + mutation) | `__tests__/BookingDetailsModal.test.tsx` | Tests booking display, "Move Booking" flow via `useAllocateRoom`, room select, confirm dialog; mocks `useAllocateRoom`, `useBookingsData`, `useGuestByRoomData` |
| `GridComponents`, `DayVariants`, `GridCell.capabilities`, `ReservationGrid.capabilities`, `RoomGridLayout` | Component (render) | `__tests__/*.test.tsx` | Various grid cell and layout render tests |
| Unallocated path | None | — | **Gap: no test covers occupants with missing/null `allocated` field in `useGridData`; no test for new `UnallocatedPanel` component** |

#### Coverage Gaps
- Untested paths:
  - Occupant with `guestByRoomData[occId]` absent (new booking, no allocation yet set)
  - Occupant with `guestByRoomData[occId].allocated === ""` (blank allocation)
  - Occupant with `guestByRoomData[occId].allocated` set to a value not in `knownRooms`
  - New `UnallocatedPanel` component (to be created)
- Extinct tests: None identified

#### Testability Assessment
- Easy to test:
  - `useGridData` unallocated computation — same mocked hook pattern already in `useGridData.test.ts`; add cases with absent/null allocated
  - `UnallocatedPanel` pure rendering — props-only component; straightforward RTL render test
- Hard to test:
  - End-to-end: Cypress/Playwright would require Firebase data fixture with unallocated occupants
- Test seams needed:
  - `useGridData` needs to export `unallocatedOccupants` (or similar) from its return object — the new value must be independently testable

#### Recommended Test Approach
- Unit tests for: `useGridData` unallocated computation (3 cases: absent, blank, not-in-knownRooms); `UnallocatedPanel` rendering states (empty, one occupant, multiple occupants)
- Component integration tests for: Extend existing `RoomsGrid.test.tsx` — add cases asserting `UnallocatedPanel` renders conditionally when `useGridData` returns non-empty `unallocatedOccupants`; assert panel is absent when empty. `RoomsGrid` is the only consumer and already has a component test seam via the mocked `useGridData`.
- E2E tests for: Out of scope for this iteration (no live Firebase fixture available for CI)
- Contract tests for: None — no new external API contract

### Recent Git History (Targeted)
- `apps/reception/src/components/roomgrid/*` — `dc1c11b4` "migrate roomgrid/ layout classes to DS primitives (TASK-11)" — layout migrated to `Stack`/`Inline`/`Cluster`; relevant for new panel insertion using same primitives
- `apps/reception/src/components/roomgrid/*` — `9140127` "remove double-click guard from rooms-grid cell click handler" — recent interaction cleanup; no effect on data pipeline
- `apps/reception/src/hooks/data/roomgrid/*` — `66ef5f52` "remove debug console.log statements from hooks" — clean hook surface; no behavioural changes

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `RoomsGrid.tsx` uses DS `Stack`/`Inline`/`Cluster`; per-room panels use `border-border-2`, `bg-surface`, `text-foreground` tokens; `StatusLegend.tsx` for colour key | No unallocated section/panel in layout; new panel must match DS token usage and existing visual language | Define visual placement (above rooms? below? distinct colour?) and component structure |
| UX / states | Required | Room panels show loading spinner and error message at page level; no room-level empty state | Empty unallocated panel (zero unallocated occupants) must not render cluttered UI; loading and error states must propagate | Specify empty-state: hide panel entirely vs show "no unallocated bookings" message; define loading/error passthrough |
| Security / privacy | N/A | Internal tool; no external auth surface; reads existing Firebase subscription data already subscribed on page load | No new auth surface introduced; data is already loaded — panel only reshapes existing data | Not required in analysis |
| Logging / observability / audit | Required | No current observability for dropped unallocated occupants (silent drop at line 241) | Staff have no visibility today; unallocated occupants are invisible without this feature. No logging added at the drop point. | Consider adding a `console.warn` or telemetry event when unallocated occupants are detected — gives future observability seam |
| Testing / validation | Required | `useGridData.test.ts` covers allocation-match path; no test for absent/null `allocated` | Coverage gap for unallocated path in `useGridData`; no component test for new panel | Write unit tests for computation + rendering as outlined in Test Landscape |
| Data / contracts | Required | `IGuestByRoomData.allocated: string` typed non-optional but may be absent at runtime in Firebase snapshot; `useGridData` return type does not include unallocated surface | Runtime type mismatch risk: `allocated` can be absent despite non-optional TypeScript type; new computed value must be typed correctly in return | Add `unallocatedOccupants` to `useGridData` return type; verify `allocated` optionality in `IGuestByRoomData` |
| Performance / reliability | Required | All four Firebase subscriptions are live (`onValue`) already subscribed; `useMemo` recomputes on any of 7 deps; current data size: 10 rooms × N bookings | Adding unallocated computation adds one additional `useMemo` pass over the same `bookingsData` + `guestByRoomData` — O(N) additional scan, no extra Firebase reads; safe | Verify N (active bookings count) is bounded; worst-case: large multi-week view with many unallocated occupants |
| Rollout / rollback | Required | Next.js app deployed to Cloudflare Worker (`@opennextjs/cloudflare`); no feature flags in codebase | New component is additive; rollback is a revert of the new component + hook addition; no data migration | Plan is purely additive — no rollback complexity; no feature flag needed for internal tool |

## External Research
Not investigated: all required evidence is available in the repository.

## Questions

### Resolved
- Q: Is `IGuestByRoomData.allocated` always present at runtime?
  - A: No. The TypeScript interface types it as `string` (non-optional), but Firebase will omit the key entirely if it was never set. The code at `useGridData.ts:241` uses optional chaining (`guestByRoomData[occId]?.allocated`) which handles the absent case. At runtime, an unset allocation means `allocated` is `undefined`, causing the comparison `undefined !== room` to be `true` — the occupant is dropped silently.
  - Evidence: `useGuestByRoomData.ts:26-31`, `useGridData.ts:241`

- Q: Should the unallocated panel also filter by the selected date window?
  - A: Yes. Showing occupants outside the selected date window would be noisy and inconsistent with the room panels. The same `checkInDate`/`checkOutDate` vs `startDate`/`endDate` comparison applied at `useGridData.ts:248-250` should apply to the unallocated computation.
  - Evidence: `useGridData.ts:248-250`

- Q: Should occupants with `allocated` set to a non-`knownRooms` value also appear in the unallocated panel?
  - A: Yes. An `allocated` value that is not in `knownRooms` means the occupant will never appear in any room panel — effectively unallocated from the grid's perspective. The unallocated panel should capture both absent/empty AND non-`knownRooms` values.
  - Evidence: `useRoomConfigs.ts:11`, `useGridData.ts:241`

- Q: Does `roomNumbers[]` on the booking data duplicate the `allocated` field?
  - A: No. `roomNumbers[]` records the rooms originally associated with the booking (from the booking intake), while `allocated` in `guestByRoomData` records the actual bed assignment per occupant. These are independent. An occupant can have `roomNumbers: ["6"]` (booked room 6) but `allocated: undefined` (no specific bed assigned yet).
  - Evidence: `useBookingsData.ts:6-17`, `useGuestByRoomData.ts:17-31`

### Open (Operator Input Required)
- Q: When an occupant is shown in the unallocated panel, should staff be able to act on the allocation, and if so, what is the safe UX path?
  - Why operator input is required: `BookingDetailsModal` exposes the "Move Booking" room-assignment action, but it has a critical booking-vs-occupant mismatch that makes it unsafe to reuse directly from an occupant-level panel: `handleConfirmMoveBooking` loops over ALL occupants under the bookingRef and calls `allocateRoomIfAllowed` for each one. From an occupant-level unallocated panel, clicking "Move Booking" on one unallocated guest would also reassign all already-allocated roommates under the same booking. Additionally, `allocateRoomIfAllowed` writes to `/roomsByDate` using `bookingDetails.date` — an unallocated row has no natural clicked-cell date, and `saveRoomsByDate` uses that date as a path key. The operator must confirm: (a) whether allocation action should be exposed at all in v1, and (b) if yes, whether a new occupant-scoped modal (moves single occupant only, uses `checkInDate` as the date key) or a read-only panel is the correct approach.
  - Decision impacted: Whether the unallocated panel is read-only (display only, safer v1 default) or includes an occupant-scoped allocation action. If allocation is in scope, a new lightweight modal is required — reusing `BookingDetailsModal` as-is is unsafe.
  - Decision owner: Operator (Peter)
  - Default assumption: Read-only panel in v1. Display occupant name, booking ref, check-in/check-out date, booked room, and status. No allocation action. This is the safe default: allocation can be performed from the existing room grid after manually assigning the occupant. If the operator needs the allocation action from the unallocated panel, analysis must plan a new occupant-scoped modal that moves only the selected occupant (not the entire booking).

## Confidence Inputs

- Implementation: 85%
  - Basis: All data is already subscribed; computation change is a single `useMemo` addition; component is additive. Read-only v1 avoids the `BookingDetailsModal` mutation mismatch. Main uncertainty is exact UI placement and whether operator wants the read-only default confirmed before build.
  - To reach ≥80: Already met. Clear drop point in `useGridData`, clear insertion point in `RoomsGrid`, read-only default removes mutation risk.
  - To reach ≥90: Operator confirms read-only v1 scope in analysis; analysis resolves visual placement.

- Approach: 85%
  - Basis: Extending `useGridData`'s existing `useMemo` is the clear approach (separate hook would duplicate subscriptions). Read-only v1 is a clean, safe default. No approach ambiguity remains for the core feature.
  - To reach ≥80: Already met.
  - To reach ≥90: Analysis confirms single-memo vs second-memo preference within `useGridData`.

- Impact: 92%
  - Basis: The problem is concrete — occupants with no `allocated` value are demonstrably invisible on the grid. Surfacing them directly addresses the staff failure mode described in the dispatch.
  - To reach ≥80: Already met.
  - To reach ≥90: Already met.

- Delivery-Readiness: 82%
  - Basis: All prerequisite data surfaces exist; no external dependencies; no migrations; no CI gate changes needed. Read-only v1 is cleaner to deliver than a write path. Minor unknowns on exact UI placement and panel visual style.
  - To reach ≥80: Already met.
  - To reach ≥90: Operator confirms read-only default and visual placement in analysis.

- Testability: 88%
  - Basis: Existing `useGridData.test.ts` and `RoomsGrid.test.tsx` patterns are directly reusable. Component test for `UnallocatedPanel` is straightforward RTL. `RoomsGrid` integration test (mock `useGridData` returning `unallocatedOccupants`) follows the existing mocked hook pattern exactly.
  - To reach ≥80: Already met.
  - To reach ≥90: Already met.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `allocated` TypeScript type misrepresents runtime reality | High (known) | Low — already handled by optional chaining | Update `IGuestByRoomData` to `allocated?: string` to match runtime behaviour; surfaced in analysis |
| New panel adds visual noise when zero unallocated occupants | Medium | Low | Hide panel when `unallocatedOccupants.length === 0`; analysis must specify empty-state behaviour |
| `useMemo` dep array causes unnecessary recomputation | Low | Low | New `useMemo` shares same deps as existing one; combine into single memo if possible |
| Large booking datasets cause perceptible render lag | Low | Low | O(N) additional scan is minimal; no extra Firebase reads |
| `BookingDetailsModal` unsafe for occupant-level allocation | High (known) | High | `BookingDetailsModal.handleConfirmMoveBooking` loops ALL occupants under the bookingRef and moves them. Using it from a single-occupant unallocated row would reassign already-allocated roommates. Modal reuse is **blocked** — a new occupant-scoped action is required if allocation is in scope. Default assumption: v1 is read-only; no modal action. |
| Synthetic `date` for `allocateRoomIfAllowed` if allocation action is added in future | Medium | Medium | `saveRoomsByDate` uses date as a path key in `/roomsByDate`. If an occupant-scoped allocation action is added (v2+), `checkInDate` is the best candidate but semantics differ from cell-click allocation moves. Analysis must confirm. |
| Operator expects bed-assignment action from the unallocated panel in v1 | Medium | Medium | Default v1 scope is read-only. If operator requires allocation action, analysis must plan new occupant-scoped modal — do not reuse `BookingDetailsModal` as-is. |

## Planning Constraints & Notes
- Must-follow patterns:
  - DS primitives (`Stack`, `Inline`, `Cluster`) for layout — evidence from `RoomsGrid.tsx` and recent TASK-11 migration
  - `useMemo` with explicit dep array for derived data — evidence: `useGridData.ts:228-305`
  - Mocked hook pattern for unit tests — evidence: `useGridData.test.ts`
- Rollout/rollback expectations:
  - Purely additive; rollback = revert new component + hook change; no feature flag required
- Observability expectations:
  - Consider `console.warn` at the computation point when unallocated occupants are detected in the selected window — provides debugging visibility without telemetry infra dependency

## Suggested Task Seeds (Non-binding)
- TASK-01: Extend `useGridData` to compute and return `unallocatedOccupants` (occupants with absent/blank/unknown `allocated` values, filtered to date window). Update `IGuestByRoomData` type to mark `allocated` as optional.
- TASK-02: Create `UnallocatedPanel` component — renders a read-only list showing unallocated occupants with name, booking ref, check-in/check-out dates, booked room, and status badge. Click behaviour (read-only info vs action) to be confirmed by operator in analysis. **Do not pre-commit to `BookingDetailsModal` reuse** — that modal moves all occupants under a booking, which is unsafe when acting on a single occupant from this panel.
- TASK-03: Wire `UnallocatedPanel` into `RoomsGrid.tsx` — conditionally render when `unallocatedOccupants.length > 0`, consuming the new `useGridData` return field.
- TASK-04: Write unit tests — 3 cases for `useGridData` unallocated computation (absent/null/non-knownRoom); 3 render tests for `UnallocatedPanel` (empty, single, multiple); extend `RoomsGrid.test.tsx` to assert panel conditionally renders when `unallocatedOccupants` are present.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `UnallocatedPanel` component renders on rooms-grid page when unallocated occupants exist in date window
  - Zero-state: panel hidden or shows "no unallocated bookings" when none present
  - Unit tests passing in CI
- Post-delivery measurement plan:
  - Staff report: unallocated occupants visible before guest arrival (operational confirmation)

## Evidence Gap Review

### Gaps Addressed
- The `allocated` field runtime behaviour (may be absent from Firebase) was confirmed via optional chaining in `useGridData.ts:241` and the TypeScript interface in `useGuestByRoomData.ts`.
- All four Firebase subscription hooks were read to confirm no additional data is needed — existing subscriptions are sufficient.
- The `useGridData.test.ts` file was read to confirm the mocked hook test pattern is directly reusable.
- `RoomsGrid.tsx` was read to confirm there is no existing unallocated panel and to identify the DS primitive pattern for insertion.
- `useRoomConfigs.ts` was read to confirm static `knownRooms` list and its role in the allocation check.
- All `__tests__/*.test.tsx` files in `apps/reception/src/components/roomgrid/__tests__/` were read to correct the test landscape — confirmed component tests exist for `RoomsGrid`, `RoomGrid`, and `BookingDetailsModal`.
- `BookingDetailsModal.tsx` and `useAllocateRoom.ts` were read in full to understand the mutation behaviour. Confirmed: `handleConfirmMoveBooking` loops ALL occupants under the booking ref (not single occupant) and `allocateRoomIfAllowed` writes to both `/guestByRoom` and `/roomsByDate`. This is a critical finding for the panel's click-through design — resolved by defaulting v1 to read-only.

### Confidence Adjustments
- Implementation adjusted slightly downward from 88% to 85%: the confirmation that `BookingDetailsModal` is unsafe for single-occupant use means a read-only v1 requires a clean implementation boundary, and any future allocation action requires a new component rather than reuse.
- Delivery-Readiness adjusted to 82%: the read-only default is clean to implement but the operator must confirm in analysis before any write path is planned.

### Remaining Assumptions
- `allocated` values that are not in `knownRooms` are rare in practice but possible (e.g., staff typing a custom room number). The unallocated panel will capture these too, which is the correct behaviour.
- The `booked` field on `guestByRoomData` is informational and not used by the unallocated computation.
- v1 is assumed read-only. Allocation action is operator-confirmed open question resolved in analysis.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Firebase `guestByRoom` node + `allocated` field semantics | Yes | None | No |
| Firebase `bookings` node + date range shape | Yes | None | No |
| `useGridData.ts` filter logic (line 241) — drop point confirmed | Yes | None | No |
| `RoomsGrid.tsx` insertion point for new panel | Yes | None | No |
| `RoomGrid.tsx` — existing per-room rendering (no changes needed) | Yes | None | No |
| `useRoomConfigs.ts` — `knownRooms` role in allocation check | Yes | None | No |
| TypeScript type coverage (`IGuestByRoomData.allocated` optionality) | Yes | [Type contract gap] [Minor]: `IGuestByRoomData.allocated` is typed `string` (non-optional) but Firebase may omit the key. Should be `allocated?: string`. | No (advisory; safe to address in build) |
| Test landscape — existing mocked hook pattern reusability | Yes | None | No |
| `BookingDetailsModal` mutation behaviour for unallocated panel | Yes | [Scope gap] [Critical]: `handleConfirmMoveBooking` loops ALL occupants under the booking ref — using it from an occupant-level panel would move all roommates. Additionally requires `date` context not present in unallocated row. **Resolved by scoping v1 as read-only panel.** | No (resolved — see waiver below) |
| `RoomsGrid.tsx` must change to consume `unallocatedOccupants` | Yes | None | No |

## Rehearsal-Blocking-Waiver

- **Blocking finding:** [Scope gap] [Critical] — `BookingDetailsModal.handleConfirmMoveBooking` loops all occupants under the booking ref; reuse from an occupant-level unallocated panel is unsafe and would silently reassign allocated roommates. Additionally the modal requires a `date` field the unallocated row does not provide.
- **False-positive reason:** The critical finding is real but has been resolved within this artifact by scoping v1 as a read-only panel. `BookingDetailsModal` is explicitly not used from the unallocated panel in v1. The constraint is documented and visible to analysis.
- **Evidence of missing piece:** Updated Non-goals section, Open Questions (Q1 default assumption now reads "read-only panel in v1"), Risks table (first row), Scope Signal section, and TASK-02 seed all explicitly state read-only default and warn against `BookingDetailsModal` reuse.

## Scope Signal

**Scope posture: constrained**

The core change is narrowly scoped to surfacing already-available data that is currently silently dropped. No new Firebase reads, no data model changes, no new subscription paths.

Blast radius clarification: `RoomsGrid.tsx` must change to consume the new `unallocatedOccupants` field from `useGridData` — it is not unaffected. If v1 is read-only (recommended default), there are no write operations and no new mutation paths. If the operator later requests an allocation action from the panel, a new occupant-scoped modal is required — reusing `BookingDetailsModal` is not safe because it loops all occupants under a booking ref when moving, which would incorrectly reassign already-allocated roommates. This risk is documented in Open Questions and must be resolved in analysis before any write-path is scoped into the plan.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-roomgrid-unallocated-panel` — a separate hook duplicating the four Firebase subscriptions would contradict the additive goal. The implementation approach is to extend `useGridData`'s existing `useMemo` to compute and return `unallocatedOccupants`. Analysis should focus on: (A) computing within the existing `allRoomData` memo vs (B) a second `useMemo` in the same hook; and visual placement of the unallocated panel. Note: `BookingDetailsModal` reuse has been ruled out for v1 (unsafe — moves all occupants under a booking ref). Analysis should confirm operator read-only preference and explore whether a future occupant-scoped allocation action is in scope for this feature or deferred.
