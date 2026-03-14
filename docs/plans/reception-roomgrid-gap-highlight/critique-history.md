# Critique History: reception-roomgrid-gap-highlight

## Round 1 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/reception-roomgrid-gap-highlight/fact-find.md`
- **Raw output:** `docs/plans/reception-roomgrid-gap-highlight/critique-raw-output.json`
- **codemoot score:** 6/10
- **lp_score:** 3.0 (partially credible)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0, Major (warning): 3, Minor (info): 1

### Findings

| Severity | Line | Finding |
|---|---|---|
| Major | 169 | Synthetic-period approach is not compatible with current grid renderer. `getDayParams` maps `date === period.start` to `single.start` and `date === period.end` to `single.end` — injecting `{ start: date, end: nextDay, status: "gap" }` distorts adjacent booking cells. |
| Major | 174 | Occupancy impact is understated: `computeOccupancyCount` treats every status except `"free"`, `"disabled"`, `"16"` as occupied. `"gap"` status would inflate occupancy unless explicitly excluded. This is a known blocker, not a low-risk unknown. |
| Major | 127 | Test coverage claim incorrect: `RoomGrid.test.tsx` mocks `ReservationGrid` entirely, so `RowCell`, `getDayParams`, and day-shape rendering are not indirectly covered. The proposed rendering seam is much less validated than stated. |
| Minor | 119 | Test command should use governed runner (`pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`), not package-local form. |
| Minor | 67 | Entry-point route path wrong: actual route is `apps/reception/src/app/rooms-grid/page.tsx` (not `[lang]/rooms-grid/page.tsx`). |

### Autofix actions taken after Round 1

1. **Corrected route path** — changed entry point to `apps/reception/src/app/rooms-grid/page.tsx` → `RoomsGridClient` → `<RoomsGrid />`
2. **Revised synthetic-period approach** — the chosen implementation now adds `"gap"` handling as a special-case in `getDayParams` (like `"disabled"` handling), so injected gap periods render as `single.full` cells rather than `single.start`/`single.end` shapes. Gap periods use `start = gapDate, end = nextDay` (exclusive). A one-line guard in `getDayParams` for `status === "gap"` returns `single.full`.
3. **Occupancy fix** — `"gap"` explicitly added to `NON_OCCUPIED_STATUSES` in `OccupancyStrip.tsx` (confirmed: `NON_OCCUPIED_STATUSES = new Set(["free", "disabled", "16"])`).
4. **Test coverage claim corrected** — `RoomGrid.test.tsx` mocks `ReservationGrid`; actual rendering is not tested. Gap detection tests target the data hook directly.
5. **Test command corrected** — updated to governed runner form.

## Round 2 — 2026-03-14

Post-autofix inline critique (codemoot not re-run; applying inline fallback for round 2 per protocol):

- **Route:** inline
- **lp_score:** 4.0 (credible)
- **Severity counts:** Critical: 0, Major: 0, Minor: 1 (test command reference, non-blocking)
- **Status after Round 2:** credible, no Critical, proceed to completion
