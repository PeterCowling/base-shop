---
Type: Task-Artifact
Status: Draft
---

# TASK-15 — Italian Meta/Title Quality Pass

Date: 2026-02-22  
Task: `TASK-15` (`IMPLEMENT`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope Implemented

Updated Italian SEO title/description copy for the 10-URL transport-guide sample defined in `TASK-11`.

Target set (IT route sample):
- `amalfiPositanoBus`
- `amalfiPositanoFerry`
- `capriPositanoFerry`
- `chiesaNuovaArrivals`
- `naplesPositano`
- `salernoPositano`
- `ferryDockToBrikette`
- `fornilloBeachToBrikette`
- `chiesaNuovaDepartures`
- `briketteToFerryDock`

## Implementation Notes

- Copy edits were applied only to `seo.title` and `seo.description` in:
  - `apps/brikette/src/locales/it/guides/content/*.json` for the 10 listed guide keys.
- Focus of edits:
  - stronger intent terms for arrival/transport queries,
  - clearer route context (`Napoli`, `Salerno`, `molo`, `traghetti`, `SITA`),
  - explicit local destination context (`Positano`, `Hostel Brikette`).
- No EN locale files were modified.

## Validation

Executed:
- `pnpm --filter @apps/brikette test -- src/test/app/it-transport-guide-metadata.test.ts`
- `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts`
- `pnpm --filter @apps/brikette typecheck`

Results:
- All targeted tests passed.
- Typecheck passed.

## Acceptance Check (TASK-15)

- 10 targeted IT transport pages have reviewed/updated `seo.title` and `seo.description`: **Pass**
- No regressions in metadata utility behavior: **Pass**
- VC-02 monitoring window (GSC Italian CTR ≥3.5%) can now start from deploy date: **Pass (tracking started)**
