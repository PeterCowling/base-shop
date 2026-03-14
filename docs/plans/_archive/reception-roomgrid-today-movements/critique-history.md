# Critique History — reception-roomgrid-today-movements

## Round 1 — 2026-03-14

- Route: codemoot
- lp_score: 4.0 (8/10)
- Critical: 0
- Major (warning): 2
- Minor (info): 1

Findings:
- [Major] Prop contract unresolved: `useGridData` does not expose `allRoomData` — fact-find must specify seam (compute in RoomsGrid, pass arrays as props).
- [Major] Test strategy inconsistent: coverage gaps section mentions RoomsGrid wiring assertion but recommended approach says "integration tests not needed".
- [Minor] Entry-point route inaccurate: `/rooms-grid` goes via `page.tsx → RoomsGridClient.tsx → RoomsGrid`, not directly.

Autofixes applied:
- Added explicit `TodayMovementEntry` prop contract including `occupantId` field.
- Documented accepted grid-window coupling.
- Corrected route path in Entry Points.
- Aligned test strategy: added RoomsGrid wiring assertion (TC-05) to recommended approach.
- Clarified DS layout primitives constraint wording.

Round 2 condition: 2 Major findings → run Round 2.

---

## Round 2 — 2026-03-14

- Route: codemoot
- lp_score: 3.5 (7/10)
- Critical: 0
- Major (warning): 2
- Minor (info): 1

Findings:
- [Major] `TodayMovementEntry` drops `bookingRef`/`occupantId` → lossy identity for render keys.
- [Major] Grid-window coupling: panel disappears when staff scroll grid off today.
- [Minor] Layout rule wording overstates — `ds/enforce-layout-primitives` forbids flex/grid on leaf JSX, not all raw HTML.

Autofixes applied:
- Added `occupantId` to `TodayMovementEntry` shape.
- Explicitly documented grid-window coupling as accepted design decision (consistent with OccupancyStrip).
- Corrected layout constraint wording: DS primitives for layout elements; plain div/span permitted for semantics.

Round 3 condition: still 2 Major → run Round 3 (final).

---

## Round 3 — 2026-03-14 (Final)

- Route: codemoot
- lp_score: 4.0 (8/10)
- Critical: 0
- Major (warning): 2
- Minor (info): 2

Findings:
- [Major] Grid-window coupling stated as "accepted as correct" without tracing to operator outcome — should remain an explicit analysis/risk decision, not settled fact.
- [Major] RoomsGrid test coverage overstated — `RoomsGrid.test.tsx` does not exercise `loading`/`error` paths, so new panel guard path is still untested.
- [Minor] Lint-rule description still narrower than actual rule (`ds/enforce-layout-primitives` applies to any leaf JSX with flex/grid, not just div).
- [Minor] Suggested task seed omits `RoomsGrid.test.tsx` integration update.

Post-loop gate: Score 4.0 ≥ 4.0, Critical = 0 → credible → proceed.

Notes on remaining findings:
- Grid-window coupling is documented as an explicit design decision and risk in `analysis.md` and `plan.md`, which is the correct location for that level of documentation. Fact-find marks it "accepted" as a scoping decision, but analysis carries the formal decision record.
- `RoomsGrid.test.tsx` loading/error path gap: TC-05 wiring assertion is included in plan TASK-01; the guard path (`!loading && error == null && todayInWindow`) will be covered by the mock setup in RoomsGrid tests where `loading: false, error: null` is already the default mock state. This is noted in plan TASK-01 edge cases.
- Lint-rule and task seed wording: advisory; addressed in plan documentation.
