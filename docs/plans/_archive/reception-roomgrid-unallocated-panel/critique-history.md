# Critique History: reception-roomgrid-unallocated-panel

---

## Round 1

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/fact-find.md`
**Date:** 2026-03-14
**codemoot score:** 7/10
**lp_score:** 3.5 (partially credible — triggers Round 2 per 2+ Major findings)
**Verdict:** needs_revision
**Severity counts:** Critical: 0 / Major: 3 / Minor: 1

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | fact-find.md:142 | Test-landscape section incomplete: `RoomsGrid`, `RoomGrid`, and `BookingDetailsModal` already have component tests in `__tests__/` — the brief incorrectly stated "no coverage" for those components. |
| F2 | Major | fact-find.md:214 | Default assumption for `BookingDetailsModal` reuse understates implementation risk. The modal uses `bookingDetails.date` in `allocateRoomIfAllowed`; an unallocated row has no clicked-cell date context. |
| F3 | Major | fact-find.md:319 | Suggested analysis comparison option (separate `useUnallocatedOccupants` hook) would duplicate `onValue` reads from the same Firebase nodes, contradicting the additive integration goal. |
| F4 | Minor | fact-find.md:40 | Non-goal wording incorrectly stated bed-allocation is a separate future feature; `BookingDetailsModal.tsx` already has room-move action via `useAllocateRoom`. |

### Autofix Actions (AF-1 → AF-4)

**AF-1 (F1 — test landscape):** Read all test files in `apps/reception/src/components/roomgrid/__tests__/`. Confirmed: `RoomsGrid.test.tsx`, `RoomGrid.test.tsx`, `BookingDetailsModal.test.tsx`, `DayVariants.test.tsx`, `GridCell.capabilities.test.tsx`, `GridComponents.test.tsx`, `ReservationGrid.capabilities.test.tsx`, `RoomGridLayout.test.tsx` exist. Updated Test Landscape table with accurate coverage descriptions for all component tests. Removed incorrect "None" entries.

**AF-2 (F2 — modal date risk):** Read `BookingDetailsModal.tsx` in full. Confirmed `allocateRoomIfAllowed` is called with `oldDate: bookingDetails.date` and `newDate: bookingDetails.date` (both use the modal's date context). Updated Open Questions to specify the date semantics risk and the default assumption (`checkInDate` as synthetic date). Added new Risk row for this. Updated Rehearsal Trace entry from Minor to Moderate with explicit API signature mismatch classification.

**AF-3 (F3 — separate hook option):** Removed the `useUnallocatedOccupants` separate-hook option from Analysis Readiness. Clarified that a separate hook duplicating Firebase subscriptions contradicts the additive goal. Updated recommendation to focus analysis on extending `useGridData`'s existing `useMemo`.

**AF-4 (F4 — non-goals wording):** Updated Non-goals section to accurately reflect that `BookingDetailsModal` already has room-move capability and the open scope question is whether the unallocated panel should expose that existing workflow.

---

## Round 2

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/fact-find.md` (after Round 1 autofixes)
**Date:** 2026-03-14
**codemoot score:** 6/10
**lp_score:** 3.0 (partially credible — triggers Round 3 per Critical finding)
**Verdict:** needs_revision
**Severity counts:** Critical: 1 / Major: 2 / Minor: 0

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Critical | fact-find.md:217 | `BookingDetailsModal.handleConfirmMoveBooking` loops ALL occupants under the booking ref — using it from an occupant-level unallocated panel would silently reassign already-allocated roommates. Brief framed this as a date-context detail, not a booking-vs-occupant mismatch. |
| F2 | Major | fact-find.md:269 | TASK-02 hardcoded `BookingDetailsModal` reuse even though Open Questions said the UX/mutation decision was unresolved. |
| F3 | Major | fact-find.md:318 | Scope Signal said "no write operations" but the default path reused `BookingDetailsModal` which writes to `/guestByRoom` and `/roomsByDate`. |
| F4 | Major | fact-find.md:168 | Recommended test approach too thin — `RoomsGrid.test.tsx` exists and must be extended for the conditional panel wiring. |

### Autofix Actions

**AF-1 (F1 — Critical modal mutation mismatch):** Read `useAllocateRoom.ts` in full. Confirmed: `allocateRoomIfAllowed` writes to `/guestByRoom` + `/roomsByDate` per occupant; `BookingDetailsModal.handleConfirmMoveBooking` loops all occupants under `bookingRef`. Updated Open Questions (Q1) default assumption to "read-only panel in v1 — no modal action". Added Rehearsal-Blocking-Waiver. Updated Risks table. Updated Scope Signal blast radius.

**AF-2 (F2 — TASK-02 pre-decision):** Removed `BookingDetailsModal` reuse from TASK-02 seed. Added explicit warning against reuse. Scope remains read-only for v1.

**AF-3 (F3 — Scope Signal write operations):** Updated Scope Signal to accurately reflect blast radius: `RoomsGrid.tsx` must change (it is a downstream consumer); read-only v1 has no write path; if allocation action added later, new occupant-scoped modal required.

**AF-4 (F4 — test approach):** Updated Recommended Test Approach to include extending `RoomsGrid.test.tsx` for conditional panel wiring using existing mocked `useGridData` seam.

---

## Round 3

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/fact-find.md` (after Round 2 autofixes)
**Date:** 2026-03-14
**codemoot score:** 8/10
**lp_score:** 4.0 (credible — ≥4.0, zero Critical → proceed)
**Verdict:** needs_revision (advisory; Round 3 is final round)
**Severity counts:** Critical: 0 / Major: 3 / Minor: 0

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | fact-find.md:122 | Dependency map still said `BookingDetailsModal` "can reuse for unallocated occupant drill-down" — conflicts with read-only-v1 scoping established elsewhere. |
| F2 | Major | fact-find.md:132 | Test-infrastructure section listed `pnpm --filter reception test` as a local run command — contradicts CI-only testing policy in `docs/testing-policy.md`. |
| F3 | Major | fact-find.md:336 | Analysis handoff told analysis to focus on "modal date semantics for `BookingDetailsModal` reuse" — reopened a path the document already ruled unsafe. |

### Autofix Actions (Round 3)

**AF-1 (F1):** Updated Downstream dependents entry for `BookingDetailsModal` to explicitly state it is NOT safely reusable from the unallocated panel and why.

**AF-2 (F2):** Updated test infrastructure Commands entry to match CI-only policy from `docs/testing-policy.md`.

**AF-3 (F3):** Updated Analysis Readiness recommended next step to remove "modal date semantics for BookingDetailsModal reuse" and replace with accurate guidance (reuse ruled out; confirm operator read-only preference; explore future occupant-scoped action scope).

### Post-Loop Gate Result

- **Final lp_score:** 4.0
- **Critical remaining:** 0
- **Gate result:** credible (score ≥ 4.0, zero Critical) → proceed to completion
- **Status:** Ready-for-analysis

---

## Analysis Critique Round 1

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/analysis.md`
**Date:** 2026-03-14
**codemoot score:** 6/10
**lp_score:** 3.0
**Verdict:** needs_revision

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | analysis.md | `bookedRoom` sourcing too narrow — missing-record occupants have no `guestByRoomData[occId]?.booked`. Must fallback to `bookingsData[ref]?.[occId]?.roomNumbers[0]`. |
| F2 | Major | analysis.md | `RoomsGrid.test.tsx` "existing tests unaffected" was inaccurate — tests will break when `unallocatedOccupants` is destructured unless mock is updated. TASK-05 must treat this as required fix. |
| F3 | Minor | analysis.md | Dep array inconsistency — "same as `allRoomData`" in one place vs "minus `getBedCount`" in another. |
| F4 | Minor | analysis.md | Date-window test case missing — only 3 test cases enumerated; 4 needed (absent allocated outside window must be excluded). |

### Autofix Actions

**AF-1:** Added fallback chain to `bookedRoom` sourcing in analysis.
**AF-2:** Updated test coverage section to mark `RoomsGrid.test.tsx` mock update as required fix, not optional extension.
**AF-3:** Normalized dep array to explicit list everywhere: `[knownRooms, bookingsData, guestsDetailsData, guestByRoomData, activitiesData, startDate, endDate]`.
**AF-4:** Updated to 4 test cases including "occupant outside date window must be excluded".

---

## Analysis Critique Round 2

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/analysis.md` (after Round 1 autofixes)
**Date:** 2026-03-14
**codemoot score:** 8/10
**lp_score:** 4.0 (credible)
**Verdict:** needs_revision (advisory; Round 2 is final round)

### Findings (advisory only)

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Minor | analysis.md | Test count still said 3 (not updated to 4 in one location). |
| F2 | Minor | analysis.md | Status badge color wording could be clearer. |

### Post-Loop Gate Result

- **Final lp_score:** 4.0
- **Critical remaining:** 0
- **Gate result:** credible → proceed to planning

---

## Plan Critique Round 1

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/plan.md`
**Date:** 2026-03-14
**codemoot score:** 6/10
**lp_score:** 3.0
**Verdict:** needs_revision

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | plan.md:388 | TASK-04 execution step assumed `!loading && error == null` block could have panel inserted above map; the block is a single expression — must use React fragment to wrap both panel and map. |
| F2 | Major | plan.md:254 | `getActivityStatus` omits status `"23"` (bag-drop); unallocated panel inherits wrong label for bag-drop occupants. |
| F3 | Major | plan.md:161 | `allocated?: string` type fix would fork the roomgrid interface from `guestByRoomSchema.ts` and `useGuestByRoom.ts` coercion without acknowledging the scope boundary. |
| F4 | Info | plan.md:412 | TASK-05 "4 cases" didn't explicitly call out `bookedRoom` precedence/fallback TCs. |

### Autofix Actions

**AF-1:** Updated TASK-04 execution plan to show React fragment wrapping for `!loading && error == null` block.
**AF-2:** Added `getActivityStatus` "23" gap to TASK-02 scouts; added TC-08 in validation contract.
**AF-3:** Added decision log entry scoping `allocated?: string` fix to roomgrid-local interface only; added `useGuestByRoom.ts:20` reference confirming raw shape.
**AF-4:** Added TC-09 (bookedRoom present) and TC-10 (bookedRoom fallback) to TASK-05 validation contract.

---

## Plan Critique Round 2

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/plan.md` (after Round 1 autofixes)
**Date:** 2026-03-14
**codemoot score:** 7/10
**lp_score:** 3.5
**Verdict:** needs_revision

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | plan.md:161 | `booked` field also needs `?` — raw shape in `useGuestByRoom.ts:20` is `{ allocated?: string; booked?: string }`. TASK-01 only fixed `allocated`. |
| F2 | Major | plan.md:460 | TC-11 locked in wrong `"23" → "1"` behavior as a passing assertion. Should not codify incorrect behavior as green. |
| F3 | Major | plan.md:425 | TASK-05 "4 cases" still said 4 but validation contract had TC-01 through TC-11. Inconsistent. |

### Autofix Actions

**AF-1:** Updated TASK-01 acceptance and execution plan to fix `booked: string` → `booked?: string` alongside `allocated`.
**AF-2:** Changed TC-11 to `it.skip` with explanatory comment (not a passing assertion for inherited-wrong behavior).
**AF-3:** Updated TASK-05 "Affects" to "6 new test cases" and "Acceptance" to match full TC list.

---

## Plan Critique Round 3

**Route:** codemoot
**Artifact:** `docs/plans/reception-roomgrid-unallocated-panel/plan.md` (after Round 2 autofixes)
**Date:** 2026-03-14
**codemoot score:** 8/10
**lp_score:** 4.0 (credible)
**Verdict:** needs_revision (advisory; Round 3 is final round)

### Findings

| # | Severity | File:Line | Message |
|---|---|---|---|
| F1 | Major | plan.md:242 | `getActivityStatus` gap for `"23"` should be fixed (same file already being edited in TASK-02) rather than memorialized as a skip test. `"23"` is defined in `MyLocalStatus` and `statusColors`. |
| F2 | Major | plan.md:245 | No deterministic sort for `unallocatedOccupants` — `Object.entries` iteration order is non-deterministic. `sortByDateAsc` already imported at line 11. |
| F3 | Info | plan.md:264 | Scout note said `hasBookingDateRange` is "already exported" but it is file-local at `useGridData.ts:45`. |

### Autofix Actions

**AF-1:** Moved `getActivityStatus` "23" fix into TASK-02 execution plan as a same-file same-outcome fix. TC-11 upgraded from `it.skip` to a passing assertion.
**AF-2:** Added `sortByDateAsc` sort step to TASK-02 execution plan.
**AF-3:** Corrected scout note to say "file-local" instead of "already exported".

### Post-Loop Gate Result

- **Final lp_score:** 4.0
- **Critical remaining:** 0
- **Gate result:** credible (score ≥ 4.0, zero Critical) → proceed to build handoff
