---
Type: Implementation-Artifact
Task: TASK-01
Plan: docs/plans/reception-roomgrid-external-package-removal/plan.md
Source-Brief: docs/plans/reception-roomgrid-external-package-removal/fact-find.md
Created: 2026-02-23
Last-updated: 2026-02-23
Status: Complete
Upstream-Package: "@daminort/reservation-grid@3.0.0"
Upstream-Repo: https://github.com/daminort/reservation-grid
Upstream-Reference-Commit: 5bf1437
---

# Upstream Capability Contract (Frozen)

## Purpose
Freeze the exact upstream API/behavior contract that Reception must preserve while removing `@daminort/reservation-grid`.

## Status Definitions
- `preserved`: current Reception runtime already matches upstream behavior.
- `missing`: capability exists upstream but is not exposed by current runtime path.
- `reduced`: capability is partially present but behavior/payload is weaker than upstream.
- `partial`: capability is present but narrower than upstream contract surface.

## Contract Matrix
| ID | Capability | Status | Upstream Evidence | Reception Baseline Evidence | Required Remediation | Verification Mapping |
|---|---|---|---|---|---|---|
| CAP-01 | Core props: `start`, `end`, `data`, `title`, `locale`, `highlightToday`, `onClickCell` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.tsx:15` | `apps/reception/src/components/roomgrid/ReservationGrid.tsx:26`, `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:20` | Complete: active export now routes directly to canonical `Grid` prop surface. | VC-01 |
| CAP-02 | Info support: `info` data + `showInfo` visibility toggle | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.tsx:20`, `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Header/Header.tsx:14` | `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:24`, `apps/reception/src/components/roomgrid/components/Header/Header.tsx:63`, `apps/reception/src/components/roomgrid/components/Row/Row.tsx:125` | Complete: active runtime exposes and renders `info` + `showInfo` behavior. | VC-02 |
| CAP-03 | Selection highlighting: `selectedRows`, `selectedColumns` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.tsx:23`, `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Header/Header.tsx:21`, `/tmp/reservation-grid-contract.96wvIn/src/lib/interfaces/mainContext.interface.ts:13` | `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:27`, `apps/reception/src/components/roomgrid/components/Header/Header.tsx:33`, `apps/reception/src/components/roomgrid/components/Row/Row.tsx:110` | Complete: row/column selection state is propagated and styled in active runtime path. | VC-03 |
| CAP-04 | Row title click callback: `onClickTitle(id)` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.tsx:30`, `/tmp/reservation-grid-contract.96wvIn/src/lib/interfaces/mainContext.interface.ts:18` | `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:34`, `apps/reception/src/components/roomgrid/components/Row/Row.tsx:54` | Complete: callback is wired through context to row title click handler. | VC-04 |
| CAP-05 | Custom renderers: `renderTitle`, `renderInfo` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.interface.ts:14`, `/tmp/reservation-grid-contract.96wvIn/src/lib/components/Grid/Grid.tsx:58` | `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:31`, `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:73` | Complete: renderer extension points are active in canonical path. | VC-05 |
| CAP-06 | Day-shape semantics: `single.start`, `single.end`, `single.full`, `intersection` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/utils/dateUtils/dateUtils.ts:171`, `/tmp/reservation-grid-contract.96wvIn/src/lib/interfaces/grid.interface.ts:6` | `apps/reception/src/utils/dateUtils.ts:178`, `apps/reception/src/components/roomgrid/components/Row/RowCell.tsx:66` | Complete: overlap/intersection semantics now match upstream-compatible day typing. | VC-06 |
| CAP-07 | Click payload includes complete `dayStatus[]` for overlaps | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/interfaces/grid.interface.ts:14`, `/tmp/reservation-grid-contract.96wvIn/src/lib/utils/dateUtils/dateUtils.ts:189` | `apps/reception/src/utils/dateUtils.ts:183`, `apps/reception/src/components/roomgrid/components/Row/Row.tsx:67` | Complete: click payload now emits deterministic status arrays for overlaps. | VC-07 |
| CAP-08 | Theme surface: font/color/width/date status keys | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/constants/theme.ts:3`, `/tmp/reservation-grid-contract.96wvIn/src/lib/interfaces/mainContext.interface.ts:16` | `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx:42`, `apps/reception/src/components/roomgrid/components/Day/utils/styleUtils/styleUtils.ts:6` | Complete: full theme surface is accepted and mapped to CSS variables in active runtime. | VC-08 |
| CAP-09 | Locale bundle parity + safe fallback to `en` | preserved | `/tmp/reservation-grid-contract.96wvIn/src/lib/constants/locales.ts:4` | `apps/reception/src/components/roomgrid/constants/locales.ts:8`, `apps/reception/src/components/roomgrid/hooks/useDaysRange/useDaysRange.ts:11` | Complete: locale key parity kept and unknown locale keys safely fall back to `en`. | VC-09 |

## Verification Contract for TASK-03
| Verification ID | Test Target | Must Prove |
|---|---|---|
| VC-01 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | Core upstream prop surface remains accepted and rendered. |
| VC-02 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | `showInfo` hides/shows info column and row info cells predictably. |
| VC-03 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | `selectedRows` and `selectedColumns` mark selected classes on row/date cells. |
| VC-04 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | `onClickTitle` receives the row id for title clicks. |
| VC-05 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | `renderTitle` and `renderInfo` override default row rendering. |
| VC-06 | `apps/reception/src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx` | Overlapping periods emit upstream-compatible day shape (`intersection` when >1 match). |
| VC-07 | `apps/reception/src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx` | Overlapping click payload includes complete `dayStatus[]` in deterministic order. |
| VC-08 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | Full theme surface is accepted and influences render variables/classes safely. |
| VC-09 | `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` | Supported locale keys render; unknown keys fall back to English labels. |

## Deferred/Excluded Capability Review
No upstream capability in scope is deferred or excluded. Any future exclusion requires explicit operator decision and a contract update with risk acceptance.

## Execution Evidence (TASK-02 to TASK-04)
- Canonical runtime implementation:
  - `apps/reception/src/components/roomgrid/ReservationGrid.tsx` now routes active export to canonical `Grid`.
  - `apps/reception/src/utils/dateUtils.ts` now computes overlap-aware day type/status arrays.
  - `apps/reception/src/components/roomgrid/hooks/useDaysRange/useDaysRange.ts` now provides unknown-locale fallback to `en`.
- Capability tests:
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` (pass).
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx` (pass).
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomGrid.test.tsx` (pass).
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomsGrid.test.tsx` (pass).
- Dependency/shim removal + guard:
  - `@daminort/reservation-grid` removed from `apps/reception/package.json` and lockfile.
  - Deleted shim declarations:
    - `apps/reception/src/types/daminort__reservation-grid.d.ts`
    - `apps/reception/src/types/reservation-grid.d.ts`
  - Guard command added and passing:
    - `pnpm --filter @apps/reception guard:no-external-reservation-grid`

## Risk Notes
- VC-01 through VC-09 are green in focused low-memory runs.
- No open parity gaps remain for upstream `@daminort/reservation-grid@3.0.0` capabilities.
