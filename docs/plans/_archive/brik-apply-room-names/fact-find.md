---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Product
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-apply-room-names
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-apply-room-names/plan.md
Trigger-Why: Nine room names reviewed and agreed with operator in session — apply to all consumer-facing surfaces.
Trigger-Intended-Outcome: type: operational | statement: All customer-facing room name strings across dropdown config, EN locale titles, and JSON-LD structured data reflect the agreed set of 9 names. | source: operator
---

# BRIK Apply Room Names Fact-Find Brief

## Scope
### Summary
Nine dorm-room marketing names were reviewed and agreed by the operator in the current session. They replace vague tier labels ("Value", "Superior", "Deluxe", "Premium") with feature-led names that communicate actual selling points (sea view, garden, terrace, single beds, ensuite). This task applies those agreed names to every consumer-facing EN surface in the codebase.

### Agreed Name Mapping

| Room ID | Old Name | New Name |
|---------|----------|----------|
| room_3 | Value Female Dorm | 8-Bed Female Dorm |
| room_4 | Value Mixed Dorm | 8-Bed Mixed Dorm |
| room_5 | Superior Female Dorm – Sea View | Female Sea View Dorm |
| room_6 | Superior Female Dorm – 7 Beds | 7-Bed Female Sea View Dorm |
| room_8 | All Female Dorm with one Bunkbed | Female Garden Room |
| room_9 | Deluxe Mixed Room | Mixed Room – Single Beds |
| room_10 | Premium Mixed Dorm | Mixed Ensuite Dorm |
| room_11 | Superior Female Dorm – Large Terrace | Female Dorm – Large Sea Terrace |
| room_12 | Superior Mixed Dorm | Mixed Dorm – Sea Terrace |

`double_room` ("Double Room") is not a dorm room and its name is unchanged.

### Goals
- Replace all 9 stale room name strings in EN consumer-facing surfaces.
- Keep `double_room` name and all non-title copy (bed descriptions, facilities, prices) unchanged.
- Keep non-EN locales unchanged (separate task: IDEA-DISPATCH-20260228-0008).

### Non-goals
- Updating non-EN locale room title translations (deferred to brik-locale-propagation).
- Changing room descriptions, amenity lists, or pricing copy.
- Updating the prime app internal operational names in `roomUtils.ts` (internal staff-facing fallback).

### Constraints & Assumptions
- `double_room` removed from nav dropdown in prior commit; name string stays "Double Room".
- `apps/brikette/public/schema/hostel-brikette/rooms.jsonld` is auto-generated at build time from `src/schema/` — do NOT edit the public copy directly.
- `pages.rooms.json` eyebrow for room_12 contains "Superior Mixed Dorm" and needs updating; all 17 non-EN locale copies of this file also contain translated versions of "Superior Mixed Dorm" which are deferred.

## Outcome Contract
- **Why:** Marketing names reviewed and agreed — new names communicate actual features rather than abstract tier labels, improving booking intent clarity.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 dorm room names updated across 4 EN source files (roomNames.ts, roomsPage.json, rooms.jsonld, pages.rooms.json) with no broken tests or TypeScript errors.

## Access Declarations
None — all changes are local file edits with no external service dependencies.

## Key Files / Modules

| File | Role | Change |
|------|------|--------|
| `packages/ui/src/config/roomNames.ts` | Source of truth for nav dropdown names | Replace 9 name strings |
| `apps/brikette/src/locales/en/roomsPage.json` | EN locale room titles (brikette website) | Update `.rooms.{id}.title` for 9 rooms |
| `apps/brikette/src/schema/hostel-brikette/rooms.jsonld` | JSON-LD structured data (SEO) | Update `name` field for 9 dorm rooms in `@graph` |
| `apps/brikette/src/locales/en/pages.rooms.json` | Room detail hero copy (room_12 only) | Update `detail.room_12.hero.eyebrow` from "Superior Mixed Dorm • Terrace" |

## Files Out of Scope (this task)

| File | Reason |
|------|--------|
| `apps/brikette/public/schema/hostel-brikette/rooms.jsonld` | Build artifact — auto-copied from src/schema at postbuild; do not edit directly |
| `apps/brikette/src/locales/{de,es,fr,...}/roomsPage.json` | Non-EN translations — deferred to IDEA-DISPATCH-20260228-0008 |
| `apps/brikette/src/locales/{de,es,fr,...}/pages.rooms.json` | Non-EN translations — deferred |
| `apps/prime/src/utils/roomUtils.ts` | Internal operational fallback (staff-facing), uses room-number format not marketing names |
| `apps/prime/public/locales/en/rooms.json` | Same reason — internal format |
| `docs/audits/user-testing/*.json` | Historical snapshots, not user-facing |

## Investigation Findings

### roomNames.ts
Current: 9 stale entries using tier labels. `double_room` already removed from this file. Source of truth for the `buildNavLinks` function that populates the desktop nav dropdown (`DesktopHeader.tsx`). All 9 values need replacement.

### roomsPage.json (EN)
Located at `apps/brikette/src/locales/en/roomsPage.json`. Holds `.rooms.{id}.title` keys consumed by `RoomsSection.tsx` and `RoomCard.tsx` as the primary display title. 10 rooms present (incl. double_room). 9 dorm-room titles need updating; `double_room` stays.

### rooms.jsonld (schema)
Located at `apps/brikette/src/schema/hostel-brikette/rooms.jsonld`. 10 HotelRoom entries in `@graph`. The `name` field maps directly to room marketing name for SEO/structured-data purposes. 9 dorm room names need updating. Public copy (`apps/brikette/public/schema/`) is a build-time copy — only the `src/schema/` file needs editing.

### pages.rooms.json (EN, room_12 only)
Located at `apps/brikette/src/locales/en/pages.rooms.json`. Contains only `detail.room_12`. The `hero.eyebrow` is currently `"Superior Mixed Dorm • Terrace"`. The "Superior Mixed Dorm" portion should be updated to "Mixed Dorm – Sea Terrace". New value: `"Mixed Dorm – Sea Terrace • Terrace"`.

### No hardcoded names in TSX
`grep` across `apps/brikette/src/**/*.{ts,tsx}` for old name strings returns no matches (names are fully locale-driven via i18n).

## Risks

1. **Non-EN locales out of sync after this change** — room_12 `pages.rooms.json` eyebrow in 17 non-EN locales will still contain translated "Superior Mixed Dorm". Mitigated: deferred to IDEA-DISPATCH-20260228-0008 (locale propagation task).
2. **prime app internal names diverge** — `apps/prime/src/utils/roomUtils.ts` still references old tier labels in staff-facing room names. Low risk: these are internal-only operational identifiers not shown to guests.

## Open Questions
None — all affected files identified, name mapping fully agreed.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `roomNames.ts` dropdown config | Yes | None | No |
| `roomsPage.json` EN titles | Yes | None | No |
| `rooms.jsonld` structured data | Yes | None | No |
| `pages.rooms.json` room_12 eyebrow | Yes | None | No |
| Non-EN locale files | Yes (out of scope) | None – deferred to brik-locale-propagation | No |
| Prime app roomUtils | Yes (out of scope) | None – internal operational format | No |
| Build artifact public/schema copy | Yes | Auto-generated; no direct edit needed | No |
| Hardcoded TSX strings | Yes | None found | No |

## Evidence Gap Review

### Gaps Addressed
- All 4 source files identified and verified with direct reads.
- `public/schema` confirmed as build artifact (not source of truth).
- `pages.rooms.json` contains only room_12 detail — no other rooms need attention in that file.
- No hardcoded room name strings found in TSX/TS source.

### Confidence Adjustments
Confidence: **95%**. Full file inventory confirmed. Agreed name set is operator-approved. Only residual risk is non-EN locale drift which is explicitly deferred.

### Remaining Assumptions
- `prime/roomUtils.ts` internal names are not guest-facing and can diverge from marketing names without customer impact.
- `pages.rooms.json` eyebrow uses "• Terrace" suffix which is descriptive not a room name — kept as-is after the prefix change.
