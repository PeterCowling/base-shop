---
Type: Build-Record
Status: Complete
Feature-Slug: reception-roomgrid-gap-highlight
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-004
Completed: 2026-03-14
Execution-Track: code
---

# Short Gap Highlighting — Build Record

## What was built

Short gaps (1–3 consecutive free days between bookings) on the rooms-grid now render in amber, giving staff an immediate visual cue to investigate or reassign.

## Files changed

| File | Change |
|---|---|
| `apps/reception/src/types/MyLocalStatus.ts` | Added `"gap"` to the status union |
| `apps/reception/src/components/roomgrid/constants/statusColors.ts` | Added `"gap": "hsl(40 90% 85%)"` (amber) |
| `apps/reception/src/utils/dateUtils.ts` | Added `status === "gap"` special-case in `getDayParams` → `single.full` rendering |
| `apps/reception/src/hooks/data/roomgrid/useGridData.ts` | Added `GAP_THRESHOLD_DAYS`, `detectAndInjectGapPeriods` function, and call after `packBookingsIntoRows` |
| `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` | Added `"gap"` to `NON_OCCUPIED_STATUSES` |
| `apps/reception/src/components/roomgrid/RoomsGrid.tsx` | Added `period.status !== "gap"` guard in arrival/departure loops |
| `apps/reception/src/components/roomgrid/StatusLegend.tsx` | Added "Short gap" legend entry |
| `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.gap.test.ts` | New test file: 8 tests covering TC-01 through TC-06 + edge cases |

## Engineering Coverage Evidence

| Coverage Area | Applicable? | Evidence |
|---|---|---|
| UI / visual | Required | Amber colour `hsl(40 90% 85%)` in `statusColors`; `single.full` shape via `getDayParams` special-case; "Short gap" entry in `StatusLegend` |
| UX / states | Required | Gap state: amber full-block; no-gap state: unchanged free cells; loading/error: unchanged |
| Security / privacy | N/A | Internal tool; no auth or PII changes |
| Logging / observability / audit | N/A | Visual-only derived status; no logging warranted |
| Testing / validation | Required | 8 tests in `useGridData.gap.test.ts`; TC-01 through TC-06 + 2 edge cases |
| Data / contracts | Required | `MyLocalStatus` + `statusColors` changed atomically; `TBookingPeriod` synthetic shape uses placeholder fields; `NON_OCCUPIED_STATUSES` updated |
| Performance / reliability | Required | O(n×d) detection inside `useMemo`; `generateDateRange` reused; no new dependencies |
| Rollout / rollback | Required | Additive change; rollback = revert commit; no schema/DB/API migration |

## Validation

- `pnpm --filter @apps/reception typecheck` — pass
- `pnpm --filter @apps/reception lint` (staged files only) — pass (pre-existing warnings in unrelated files not introduced by this change)
- Pre-commit hooks (lint-staged + typecheck-staged) — pass via writer lock commit

## Commit

`93646204d7` — `feat(reception): add gap highlighting for short free periods on rooms-grid (BRIK-004)`
