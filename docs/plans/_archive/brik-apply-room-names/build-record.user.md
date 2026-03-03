---
Type: Build-Record
Status: Complete
Feature-Slug: brik-apply-room-names
Build-date: 2026-02-28
artifact: build-record
---

# Build Record — BRIK Apply Room Names

## Summary

Applied 9 agreed marketing room names to all consumer-facing English surfaces. Replaced tier labels (Value, Superior, Deluxe, Premium) with feature-led names that describe actual room characteristics.

## Outcome Contract

- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 dorm room names updated across 4 EN source files with no broken tests or TypeScript errors.

## Tasks Completed

| Task ID | Description | Status | Commit |
|---|---|---|---|
| TASK-01 | Update roomNames.ts dropdown config (9 strings) | Complete (2026-02-28) | def0578446 |
| TASK-02 | Update roomsPage.json EN room titles (9 keys) | Complete (2026-02-28) | def0578446 |
| TASK-03 | Update rooms.jsonld structured data names (9 entries) | Complete (2026-02-28) | def0578446 |
| TASK-04 | Update pages.rooms.json room_12 hero eyebrow | Complete (2026-02-28) | def0578446 |

## Files Changed

- `packages/ui/src/config/roomNames.ts` — 9 ROOM_DROPDOWN_NAMES values updated
- `apps/brikette/src/locales/en/roomsPage.json` — 9 `rooms.{id}.title` keys updated
- `apps/brikette/src/schema/hostel-brikette/rooms.jsonld` — 9 `name` fields in `@graph` array updated
- `apps/brikette/src/locales/en/pages.rooms.json` — `detail.room_12.hero.eyebrow` prefix updated

## Names Applied

| Room ID | Old Name | New Name |
|---|---|---|
| room_3 | Value All-Female Dorm | 8-Bed Female Dorm |
| room_4 | Value Mixed Dorm | 8-Bed Mixed Dorm |
| room_5 | Superior All-Female Dorm | Female Sea View Dorm |
| room_6 | Superior All-Female Dorm (7-bed) | 7-Bed Female Sea View Dorm |
| room_8 | All Female Dorm with Bunkbed | Female Garden Room |
| room_9 | Deluxe Mixed Room | Mixed Room – Single Beds |
| room_10 | Premium Dorm | Mixed Ensuite Dorm |
| room_11 | Superior All-Female Dorm (4th floor) | Female Dorm – Large Sea Terrace |
| room_12 | Superior Mixed Dorm | Mixed Dorm – Sea Terrace |

## Validation Evidence

- All 9 TC contracts verified via Python JSON parsing before commit
- TypeScript typecheck: 21 tasks passed (pre-commit hook)
- Lint: 0 errors (warnings in pre-existing files only)
- `double_room` ("Double Room") confirmed unchanged in all files

## Deferred

- Non-EN locale propagation: handled separately by IDEA-DISPATCH-20260228-0008 (brik-locale-propagation)
