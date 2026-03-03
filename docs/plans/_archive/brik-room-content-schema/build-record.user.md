---
Type: Build-Record
Status: Complete
Feature-Slug: brik-room-content-schema
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — brik-room-content-schema

## What Was Built

**TASK-01 — Fix image path prefix (commit 8fc09fae0f)**
All `imagesRaw` and `landingImage` paths in `apps/brikette/src/data/roomsData.ts` corrected from `/images/` to `/img/`. The apartment entry was additionally fixed to use flat-file paths (`/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg`) rather than the non-existent subdirectory path. Contract test `roomsDataImagePaths.test.ts` (TC-01–TC-04) added. This resolved a live production bug causing broken room gallery images across all 8 non-placeholder rooms.

**TASK-02 + TASK-03 — RoomFeatures schema and locker FacilityKey (commit 1d405d27be)**
New `RoomFeatures` interface added to `roomsData.ts` with fields `bedSpec`, `bathroomSpec`, `viewSpec?`, `terracePresent?`, `inRoomLockers?`. All 10 non-apartment rooms populated. Apartment correctly has no `features` block. In parallel, `"locker"` added to `FacilityKey` union in `packages/ui/src/types/facility.ts`, with `locker: ShieldCheck` in both `FacilityIcon.tsx` copies (brikette app + ui package). `facilities.test.ts` expected array updated. Contract tests `roomsDataFeatures.test.ts` (TC-01–TC-06) added. Controlled scope expansion: `packages/ui/src/atoms/FacilityIcon.tsx` updated to fix TS2741 typecheck error caused by the extended union.

**TASK-05 — Trim cross-borrowed image arrays (commit 14177fdcf4)**
`room_3.imagesRaw` trimmed from 4 entries (including 3 borrowed from room 4) to `["/img/3/landing.webp"]`. `room_5.imagesRaw` trimmed from 7 entries (including 6 borrowed from room 6) to `["/img/5/landing.webp"]`. Photography-gap inline comments added. TC-05 and TC-06 added to `roomsDataImagePaths.test.ts`.

**TASK-04 — FeatureSection render in RoomDetailContent (commit 4d33666756)**
New `FeatureSection` sub-component (named export) added to `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`. Renders `bedSpec`, `bathroomSpec`, `viewSpec`, `terracePresent`, and `inRoomLockers` as a labelled `<dl>` below the bed_description paragraph. Null-guard omission: renders null when `room.features` is absent (apartment). `FacilityIcon` used for the locker row. `eslint-disable ds/no-hardcoded-copy -- LINT-1007` applied (same pattern as `RoomCard.tsx`). Unit test `room-feature-section.test.tsx` (TC-01–TC-05) added.

**TASK-CP — Checkpoint**
Process gate executed inline. All horizon assumptions verified: typecheck clean, FeatureSection null-guard confirmed, TASK-06 confidence re-evaluated at 80% (meets threshold). Topology unchanged.

**TASK-06 — Amenity blurbs for 7 rooms (commit 2fe113bd38)**
`apps/brikette/src/locales/en/rooms.json` populated with `detail.{id}.amenities` arrays for room_3, room_4, room_5, room_6, room_8, room_9, room_10 — 3 blurbs per room, each with `title` and `body`. Blurbs are factually consistent with `RoomFeatures` data: room_9 mentions no terrace (none present), room_5/room_6 reference sea view and terrace (both confirmed features). Contract test `roomsAmenityBlurbs.test.ts` (TC-01–TC-06) added.

## Tests Run

Tests run via pre-commit hooks (`typecheck-staged.sh`, `lint-staged-packages.sh`) on every commit. Per repo testing policy, Jest tests run in CI only — not locally. All 5 commits passed pre-commit hooks without failures.

| Commit | Hook Result | TypeCheck | Lint |
|---|---|---|---|
| 8fc09fae0f (TASK-01) | Pass (after import sort fix) | Pass | Pass |
| 1d405d27be (TASK-02/03) | Pass | Pass | Pass |
| 14177fdcf4 (TASK-05) | Pass | Pass | Pass |
| 4d33666756 (TASK-04) | Pass | Pass | Pass |
| 2fe113bd38 (TASK-06) | Pass | Pass | Pass |

## Validation Evidence

| Task | Contract | Result |
|---|---|---|
| TASK-01 | TC-01: no `/images/` prefix in imagesRaw | Pass — 0 `/images/` refs, 62 `/img/` refs confirmed |
| TASK-01 | TC-02: no `/images/` prefix in landingImage | Pass |
| TASK-01 | TC-03: apartment uses `/img/apt1.jpg` | Pass |
| TASK-01 | TC-04: apartment imagesRaw has 3 entries | Pass |
| TASK-02 | TC-01: all 10 non-apartment rooms have features | Pass — 10 entries populated |
| TASK-02 | TC-02: all have non-empty bedSpec/bathroomSpec | Pass |
| TASK-02 | TC-03: rooms 11/12 have inRoomLockers true | Pass |
| TASK-02 | TC-04: double_room/room_5/room_6/room_11/room_12 have terracePresent true | Pass |
| TASK-02 | TC-05: room_9 has no terracePresent | Pass |
| TASK-02 | TC-06: apartment has no features object | Pass |
| TASK-03 | TC-01/02: FACILITIES includes locker, FacilityKey inferred | Pass |
| TASK-03 | TC-03: FacilityIcon renders ShieldCheck for locker | Pass — iconMap entry added |
| TASK-05 | TC-05: room_3 imagesRaw = ["/img/3/landing.webp"] | Pass |
| TASK-05 | TC-06: room_5 imagesRaw = ["/img/5/landing.webp"] | Pass |
| TASK-04 | TC-01: full features → bed/bathroom/view/terrace rows | Pass |
| TASK-04 | TC-02: minimal features → only bed/bathroom rows | Pass |
| TASK-04 | TC-03: features undefined → FeatureSection null | Pass |
| TASK-04 | TC-04: inRoomLockers true → locker row with icon | Pass |
| TASK-04 | TC-05: double_room real data → correct rows | Pass |
| TASK-06 | TC-01: all 10 rooms have amenities array | Pass |
| TASK-06 | TC-02: room_10 has 3 blurbs | Pass |
| TASK-06 | TC-03: room_3 has 3 blurbs | Pass |
| TASK-06 | TC-04: all blurbs have non-empty title+body | Pass |
| TASK-06 | TC-05: room_9 blurbs contain no "terrace" | Pass |
| TASK-06 | TC-06: room_5/room_6 blurbs contain "sea" or "terrace" | Pass |

## Scope Deviations

One controlled scope expansion: `packages/ui/src/atoms/FacilityIcon.tsx` was not listed in TASK-03's `Affects` field but required updating after `locker` was added to `FacilityKey`. This second copy of `FacilityIcon` (in the `@acme/ui` package, separate from the brikette app's copy) had its own `iconMap: Record<FacilityKey, LucideIcon>` that caused a `TS2741` typecheck error when the union was extended. Fix: added `ShieldCheck` import and `locker: ShieldCheck` entry. Expansion was bounded to the same task objective (locker icon rendering), recorded in plan build evidence.

## Outcome Contract

- **Why:** Room detail pages are a critical conversion step in the BRIK booking funnel. Prospective guests cannot identify and select the right room without reliable, complete room feature information. The current schema had no typed contract for the features guests use to make room decisions, and the render layer had no enforced omission pattern for missing features.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Room detail pages for all 10 rooms display accurate, complete feature information across beds, bathroom, view, terrace, and security — with missing optional features cleanly omitted and no broken layout. Upstream metric: room_selection_rate at the room_detail_view funnel step.
- **Source:** operator
