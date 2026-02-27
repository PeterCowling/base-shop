---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-room-content-schema
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Dispatch-IDs: IDEA-DISPATCH-20260227-0042, IDEA-DISPATCH-20260227-0046
---

# BRIK Room Content Schema Plan

## Summary

`roomsData.ts` is the single source of truth for all BRIK rooms. All six original tasks are complete: the image path prefix fix (TASK-01), the `RoomFeatures` content interface (TASK-02), the `locker` FacilityKey (TASK-03), the `FeatureSection` render in `RoomDetailContent.tsx` (TASK-04), the cross-borrowed image array fix for rooms 3 and 5 (TASK-05), and amenity blurbs for all 10 rooms (TASK-06). The checkpoint (TASK-CP) is complete. A second dispatch (IDEA-DISPATCH-20260227-0046) adds Wave 2: replacing the flat, semantically unlabeled `imagesRaw: string[]` field with a typed `RoomImages` schema (`bed: string`, `bathroom: string`, `view?`, `terrace?`, `security?`). Wave 2 tasks (TASK-07, TASK-08, TASK-09) must ship in a single PR because removing `imagesRaw` from the `Room` interface causes TypeScript compile errors in all consumers simultaneously; they cannot be deployed independently.

## Active tasks

- [x] TASK-01: Fix image path prefix `/images/` → `/img/` + add contract test (DONE)
- [x] TASK-02: Define `RoomFeatures` interface + extend `Room` + populate 10 rooms (DONE)
- [x] TASK-03: Add `locker` FacilityKey, update `FacilityIcon.tsx` and `facilities.test.ts` (DONE)
- [x] TASK-04: Update `RoomDetailContent.tsx` — structured feature rendering with clean omission (DONE)
- [x] TASK-05: Fix room_3 and room_5 image arrays — trim cross-borrowed images to landing-only (DONE)
- [x] TASK-CP: Checkpoint — reassess render output and image coverage (DONE)
- [x] TASK-06: Add amenity blurbs to `rooms.json` for 7 rooms currently lacking them
- [ ] TASK-07: Define `RoomImages` interface + replace `imagesRaw` in `Room` + populate all 11 entries
- [ ] TASK-08: Update all 4 `imagesRaw` consumers to derive images from `RoomImages` schema
- [ ] TASK-09: Update 3 test files — `roomsDataImagePaths.test.ts`, `roomsCatalog.test.ts`, `RoomsStructuredDataRsc.test.tsx`

## Goals

- Fix the live image path bug affecting every room's gallery images (DONE)
- Provide TypeScript-enforced content fields for beds, bathroom, view, terrace presence, and in-room lockers on the `Room` type (DONE)
- Render those fields in `RoomDetailContent.tsx` with clean section omission when a feature is absent (DONE)
- Add `locker` as a typed `FacilityKey` with a matching icon for consistent security chip rendering (DONE)
- Document image gaps for rooms 3, 5, and 8 as known photography gaps requiring follow-up (DONE)
- Complete the amenity blurb surface for all 10 rooms (DONE)
- Replace the flat, untyped `imagesRaw: string[]` field on `Room` with a typed `images: RoomImages` schema enforcing bed, bathroom, view, terrace, and security image slots (Wave 2 — Dispatch 0046)
- Update all consumers of `imagesRaw` (RoomCard.tsx adapter, RoomStructuredData.tsx, RoomsStructuredDataRsc.tsx, builders.ts) to derive a flat array from the new schema (Wave 2)
- Eliminate all `imagesRaw` references from production code and tests in a single PR (Wave 2)

## Non-goals

- CMS backend for room content editing
- Octorate availability/pricing integration (companion plan `brik-octorate-live-availability`)
- Translation of new schema fields into non-English locales
- New photography production (gaps are documented, not resolved by code)
- Apartment image slot population (apartment type migration is in Wave 2 scope; content population is not)
- Labeled gallery view showing slot captions (plain sequential gallery; label UI is a separate design decision)

## Constraints & Assumptions

- Constraints:
  - CI-only test policy in effect (`docs/testing-policy.md`). Do not run Jest locally. Push and monitor CI via `gh run watch`.
  - `roomsData.ts` is the single source of truth — all schema changes go there, not to `RoomCategory` in `ml.ts`.
  - `FacilityKey` source is `packages/ui/src/types/facility.ts` only. `apps/brikette/src/lib/facilities.ts` is a re-export barrel — do not edit it.
  - Render policy: omit section entirely when a feature field is absent or false. No "not applicable" copy.
  - New fields on `Room` must be optional (`?`) to avoid breaking existing consumers.
  - Test stubs (`test.todo()` / `it.skip()`) are permitted in planning mode only for L-effort tasks. This plan has no L-effort tasks — all stubs must be implemented, not stubbed.
  - Wave 2 (TASK-07/08/09): The `@acme/ui` `RoomCard` interface (`images?: string[]`) must NOT change — all schema-to-flat-array mapping stays in the app-layer adapter. The shared UI package is not in scope for Wave 2.
  - Wave 2: TASK-07, TASK-08, and TASK-09 must land in a single PR. Removing `imagesRaw` from `Room` in TASK-07 immediately breaks all four consumers and three test files — they cannot be deployed as independent commits because TypeScript would fail between commits.
  - Wave 2: Optional image slots must be `undefined` (absent), not `null` or `""`. The `toFlatImageArray` adapter uses `.filter(Boolean)` to exclude absent slots.
  - Wave 2: The `hardcoded` hotel-level image references in `buildHotelNode` (lines 109–113 of `builders.ts`) are NOT `imagesRaw` consumers; they reference a fixed hotel landing image for hotel-level JSON-LD structured data. They are explicitly out of scope for TASK-08.
  - Wave 2: `LocalizedRoom` in `src/rooms/types.ts` extends `Room` directly without re-declaring `imagesRaw`. When `imagesRaw` is replaced on `Room`, `LocalizedRoom` inherits the change automatically — no separate update to `types.ts` is needed.

- Assumptions:
  - Room_3 and room_5 image arrays will be trimmed to landing-only (default assumption from fact-find open question). Operator can confirm or override before build.
  - Room_8 photography gap is acknowledged; the existing 2 images are retained as-is pending new photography.
  - Apartment is excluded from content population but `RoomFeatures` interface is designed to accommodate it.
  - `inRoomLockers` renders as a boolean field. The `locker` FacilityKey provides the chip icon when the field is true.
  - Wave 2: Cross-room image borrowing for rooms 3 and 5 is treated as acceptable interim state (rooms share similar floor plan). `bed` and `bathroom` slots for rooms 3/5 can be provisionally assigned from Room 4/6 assets until dedicated photography is available, documented with inline comments.
  - Wave 2: Room 8's single numbered image `8_1.webp` is provisionally assigned to the `bed` slot. The `bathroom` slot is left `undefined` — the existing `bathroomSharedFemale` feature field communicates bathroom type; no image slot is required for correctness.
  - Wave 2: `/img/keycard-tap.avif` is a suitable universal `security` slot image for all rooms (keycard access is universal across all BRIK rooms).

## Inherited Outcome Contract

- **Why:** Room detail pages are a critical conversion step in the BRIK booking funnel. Prospective guests cannot identify and select the right room without reliable, complete room feature information. The current schema has no typed contract for the features guests use to make room decisions, and the render layer has no enforced omission pattern for missing features.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Room detail pages for all 10 rooms display accurate, complete feature information across beds, bathroom, view, terrace, and security — with missing optional features cleanly omitted and no broken layout. Upstream metric: room_selection_rate at the room_detail_view funnel step.
- **Source:** operator

## Fact-Find Reference

- Related briefs:
  - `docs/plans/brik-room-content-schema/fact-find.md` (Dispatch 0042 — original Wave 1 findings)
  - `docs/plans/brik-room-content-schema/fact-find.md` (Dispatch 0046 — Wave 2 `RoomImages` schema, same file updated in-place)
- Key findings used (Wave 1 — Dispatch 0042):
  - Live image path bug: all `imagesRaw` paths reference `/images/` but files are under `public/img/` — highest-priority fix
  - Zero rooms have typed content fields; all feature info is in i18n label-key arrays
  - `FacilityKey` union (12 keys) does not include `locker`; amenity blurbs reference "key-card lockers" for rooms 11/12
  - Room_3 and room_5 cross-borrow images from rooms 4 and 6 respectively; own photography consists of landing image only
  - Room_8 has 2 images (landing + 1 gallery); rooms 3, 5, 8 are documented photography gaps
  - `RoomDetailContent.tsx` already has null-guard pattern for hero/outline/amenities sections — extend this pattern for structured features
  - `rooms.json` amenity blurbs exist for only 3 of 10 rooms
- Key findings used (Wave 2 — Dispatch 0046):
  - `imagesRaw: string[]` is semantically unlabeled and has no typed contract for decision-driver image categories
  - 4 production consumers: `RoomCard.tsx` adapter, `RoomStructuredData.tsx`, `RoomsStructuredDataRsc.tsx` (2 usages), `builders.ts` (`pickRelativeImagePaths`)
  - 3 test files stub `imagesRaw`: `roomsDataImagePaths.test.ts`, `roomsCatalog.test.ts`, `RoomsStructuredDataRsc.test.tsx`
  - `LocalizedRoom extends Room` directly — no independent `imagesRaw` re-declaration in `rooms/types.ts`
  - `/img/keycard-tap.avif` available as universal `security` slot image
  - `builders.ts` hotel-level hardcoded refs (lines 109–113) are out of scope — hotel JSON-LD, not room gallery
  - Replace-not-extend: clean single-PR removal of `imagesRaw`; `landingImage` stays unchanged
  - Apartment: type migration in scope; content population deferred to adjacent task

## Proposed Approach

- Option A: Add structured `RoomFeatures` fields directly to the `Room` interface in `roomsData.ts` (typed, inline, agent-maintainable). Render in `RoomDetailContent.tsx` as a new `FeatureSection` that follows the existing null-guard pattern. Preserve i18n facility arrays in `roomsPage.json` as-is for chip rendering in `RoomCard.tsx`.
- Option B: Model all features purely through `roomsPage.json` i18n label keys (current approach, no TypeScript enforcement). Continue relying on i18n string presence for render decisions.
- Chosen approach: **Option A.** TypeScript-enforced fields give the type system the information it needs to guarantee render contracts. Option B is the current state — it has no type safety and the render layer cannot distinguish "feature absent" from "i18n key missing." The structured approach enables clean boolean omission logic that Option B cannot express.

## Plan Gates

- Foundation Gate: Pass
  - Deliverable-Type: code-change
  - Execution-Track: code
  - Primary-Execution-Skill: lp-do-build
  - Startup-Deliverable-Alias: none
  - Delivery-readiness: 82% (from fact-find)
  - Test landscape: Jest unit tests identified, CI-only policy noted, testability 85%
- Sequenced: Yes (see Parallelism Guide)
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 and TASK-02 both at ≥80; no blocking DECISION tasks; at least one IMPLEMENT at ≥80)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix image path prefix + contract test | 90% | S | Complete (2026-02-27) | - | - |
| TASK-02 | IMPLEMENT | Define RoomFeatures interface + populate 10 rooms | 85% | M | Complete (2026-02-27) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Add locker FacilityKey + iconMap + test update | 85% | S | Complete (2026-02-27) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Structured feature rendering in RoomDetailContent | 85% | M | Complete (2026-02-27) | TASK-02, TASK-03 | TASK-CP |
| TASK-05 | IMPLEMENT | Fix room_3/room_5 cross-borrowed image arrays | 90% | S | Complete (2026-02-27) | TASK-01 | - |
| TASK-CP | CHECKPOINT | Reassess render + image coverage | 95% | S | Complete (2026-02-27) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Add amenity blurbs for 7 rooms lacking them | 80% | M | Complete (2026-02-27) | TASK-CP | - |
| TASK-07 | IMPLEMENT | Define `RoomImages` interface + replace `imagesRaw` + populate 11 entries | 83% | M | Pending | - | TASK-08, TASK-09 |
| TASK-08 | IMPLEMENT | Update 4 `imagesRaw` consumers to derive images from `RoomImages` schema | 85% | M | Pending | TASK-07 | - |
| TASK-09 | IMPLEMENT | Update 3 test files — remove `imagesRaw` stubs, add schema integrity tests | 88% | S | Pending | TASK-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All independent; run in parallel. TASK-01 is highest-priority (live bug). |
| 1b | TASK-05 | TASK-01 (image path fix must precede; arrays use same prefix) | Can run as soon as TASK-01 completes |
| 2 | TASK-04 | TASK-02, TASK-03 | Must wait for both schema and FacilityKey |
| CP | TASK-CP | TASK-04 | Checkpoint — triggers replan before TASK-06 |
| 3 | TASK-06 | TASK-CP | Deferred past checkpoint |
| 4a | TASK-07 | All Wave 1–3 tasks complete | Define interface + populate data; all other Wave 4 tasks block on this |
| 4b | TASK-08, TASK-09 | TASK-07 | Update consumers (TASK-08) and tests (TASK-09) can run in parallel after TASK-07; must land in same PR as TASK-07 |

## Tasks

---

### TASK-01: Fix image path prefix `/images/` → `/img/` + add contract test

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/data/roomsData.ts` (image paths corrected) + new contract test in `apps/brikette/src/test/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/data/roomsData.ts`, new file `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — Simple string replacement across 11 entries. All actual file locations confirmed in `public/img/`. Pattern is exact: replace `/images/` with `/img/` throughout `imagesRaw` and `landingImage` fields.
  - Approach: 90% — Contract test that reads `roomsData` and asserts no path starts with `/images/` is straightforward Jest. Mock not needed — reads the real module.
  - Impact: 90% — This is the highest-impact task: room gallery images are currently broken in production. Fix unblocks image display for all 8 rooms with valid `/img/` files.
  - **min(95, 90, 90) = 90%**
  - What would make this >=90%: already at 90%. Held-back test: single unknown that could push below 90: "is `/images/` used as a static string anywhere else (CSS, HTML, config) that would also break?" — search shows no other occurrence outside `roomsData.ts`. Condition satisfied.
- **Acceptance:**
  - All `imagesRaw` and `landingImage` fields in `roomsData.ts` use `/img/` prefix
  - Apartment image paths corrected: apartment does not have a subdirectory under `public/img/`; its images are `/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg` at the root of `public/img/`. The apartment entry in `roomsData.ts` uses `/images/apartment/landing.webp` — correct to `/img/apt1.jpg` for `landingImage` and set `imagesRaw: ["/img/apt1.jpg", "/img/apt2.jpg", "/img/apt3.jpg"]`. This is a two-part fix (prefix AND path) for the apartment only; numbered room paths are prefix-only fixes.
  - New contract test `roomsDataImagePaths.test.ts` passes: asserts every entry in `imagesRaw` and `landingImage` starts with `/img/` and does not start with `/images/`
  - No other references to `/images/` as a room image prefix remain in `apps/brikette/src/` (covers numeric subdirectory paths and the apartment path)
- **Validation contract (TC-XX):**
  - TC-01: `roomsData.imagesRaw` for every room entry → every path starts with `/img/` and no path starts with `/images/`
  - TC-02: `roomsData.landingImage` for every room entry → starts with `/img/`, does not start with `/images/`
  - TC-03: `roomsData['apartment'].imagesRaw[0]` → `/img/apt1.jpg` (apartment images are at root of `public/img/`, not in a subdirectory)
  - TC-04: Contract test file exists and passes in CI
- **Execution plan:** Red → Green → Refactor
  - Red: Write contract test first — initially fails because paths use `/images/`
  - Green: Do the string replacement in `roomsData.ts`; test passes
  - Refactor: Grep `apps/brikette/src/` for any remaining `/images/` references used as room-image prefixes (pattern: `"/images/"`) and fix if found — this covers both numeric room paths and the apartment path
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** Verify no other files in `apps/brikette/src/` reference `/images/` as a room-image prefix — grep result: confirmed `roomsData.ts` is the only location. Apartment images are `/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg` (no subdirectory), confirmed by `ls public/img/` showing flat apt*.jpg files.
- **Edge Cases & Hardening:**
  - Apartment entry has `/images/apartment/landing.webp` — this is a two-part fix: wrong prefix AND wrong path. Correct `landingImage` to `/img/apt1.jpg`; correct `imagesRaw` to `["/img/apt1.jpg", "/img/apt2.jpg", "/img/apt3.jpg"]`. Apartment images live at `public/img/apt1.jpg`, `public/img/apt2.jpg`, `public/img/apt3.jpg` (no subdirectory).
  - room_3 and room_5 cross-borrowed paths (`/images/4/4_1.webp`, `/images/6/6_1.webp`) also need the prefix corrected even if those entries are later trimmed in TASK-05
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy with normal release. No migration, no feature flag.
  - Rollback: Revert commit. Images return to broken state.
- **Documentation impact:** None: no user-facing docs reference image paths directly.
- **Notes / references:**
  - Evidence: `public/img/` directory confirmed with subdirs 3, 4, 5, 6, 7, 8, 9, 10, 11, 12. `public/images/` contains only `guides/`.
  - fact-find: "Critical Finding" in Simulation Trace

**Build evidence (Complete 2026-02-27):**
- Exit code: 0 (codex exec --full-auto)
- Offload route: codex exec via with-writer-lock.sh
- Files verified: `apps/brikette/src/data/roomsData.ts` (all 11 entries corrected, 0 `/images/` refs remaining, 62 `/img/` refs), `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts` (created, TC-01 to TC-04)
- Scope expansion: None
- Commit: `8fc09fae0f` — fix(brik): fix room image paths /images/ → /img/ + add contract test (TASK-01)
- Post-build validation: Mode 2 (Data Simulation) — confirmed via Python script: 0 `/images/` refs, 62 `/img/` refs, apt_count=4. Pass.
- Pre-commit hook fix: import sort order corrected in test file (blank line before @testing-library/jest-dom import per repo pattern)

---

### TASK-02: Define `RoomFeatures` interface + extend `Room` interface + populate 10 rooms

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/data/roomsData.ts` — new `RoomFeatures` optional interface + `features?: RoomFeatures` field on `Room` + features block populated for all 10 non-apartment rooms
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/data/roomsData.ts`, new test file `apps/brikette/src/test/utils/roomsDataFeatures.test.ts`, `[readonly] apps/brikette/src/types/machine-layer/ml.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — Interface design is clear from fact-find. Field names and types are established. Population for 10 rooms requires room-by-room authoring but no ambiguity — all data is derivable from existing `roomsPage.json` facility arrays and bed_description text.
  - Approach: 85% — Optional fields on `Room` maintain backward compatibility. Two-track design (typed struct + preserved i18n arrays) avoids touching existing facility chip rendering. One held-back: "What if consumers need `features` to be non-optional?" — `RoomDetailContent.tsx` and `RoomCard.tsx` currently use `room.*` fields; `features` would be new. All callers would need to guard with `room.features?.field`. This is safe and consistent with existing optional field patterns in `Room`. No consumer currently expects `features` to exist. Condition satisfied.
  - Impact: 85% — Provides the typed foundation that TASK-04 needs. Direct consumer impact depends on TASK-04's render implementation.
  - **min(90, 85, 85) = 85%**
- **Acceptance:**
  - `RoomFeatures` interface defined in `roomsData.ts` with: `bedSpec: string`, `bathroomSpec: string`, `viewSpec?: string`, `terracePresent?: boolean`, `inRoomLockers?: boolean`
  - `Room` interface has `features?: RoomFeatures` field
  - All 10 non-apartment rooms have a `features` block populated
  - `bedSpec` and `bathroomSpec` populated for all 10 rooms (always-present — every room has beds and some form of bathroom)
  - `viewSpec` populated for rooms with a named external view: double_room (sea view), room_5 (sea view), room_6 (sea view), room_9 (courtyard view), room_8 (garden view), room_11 (sea view), room_12 (sea view). `viewSpec` is absent/undefined for rooms without an external view (room_3, room_4, room_10 — per omit policy in Decision Log).
  - `terracePresent: true` for double_room, room_5, room_6, room_11, room_12 (sea-view terrace confirmed in bed_description for each); absent/undefined for rooms without terrace (room_3, room_4, room_9, room_10, room_8)
  - `inRoomLockers: true` for rooms 11, 12 (confirmed in amenity blurbs and hero bullets); false or absent for others
  - New unit test `roomsDataFeatures.test.ts` asserts: all 10 rooms have a `features` object; all 10 rooms have non-empty `bedSpec` and `bathroomSpec`; rooms 11/12 have `inRoomLockers: true`; double_room/room_5/room_6/room_11/room_12 have `terracePresent: true`
- **Validation contract (TC-XX):**
  - TC-01: `roomsData.find(r => r.id === 'double_room').features?.bedSpec` → non-empty string describing bed type
  - TC-02: `roomsData.find(r => r.id === 'room_11').features?.terracePresent` → `true`
  - TC-03: `roomsData.find(r => r.id === 'room_11').features?.inRoomLockers` → `true`
  - TC-04: `roomsData.find(r => r.id === 'room_9').features?.terracePresent` → `undefined` or falsy
  - TC-05: `roomsData.find(r => r.id === 'apartment').features` → `undefined` (apartment excluded)
  - TC-06: All 10 non-apartment rooms have `features?.bedSpec` non-empty → contract test passes
- **Execution plan:** Red → Green → Refactor
  - Red: Write `roomsDataFeatures.test.ts` asserting all 10 rooms have `features` with non-empty `bedSpec` — fails because `features` doesn't exist yet
  - Green: Define `RoomFeatures` interface, add `features?` to `Room`, populate all 10 rooms in data array
  - Refactor: Verify TypeScript compiles cleanly; check apartment entry is untouched (no `features` block)
- **Planning validation (required for M/L):**
  - Checks run: Read `roomsData.ts` lines 14–42 (Room interface) and lines 60–341 (catalogue). Confirmed interface shape. Read `ml.ts` to confirm `RoomCategory` does not need changes.
  - Validation artifacts: fact-find Per-Room Feature Audit table, `rooms.json` bed_description strings for all 10 rooms
  - Unexpected findings: None — field population is straightforward from existing description text

**Consumer tracing for new outputs:**
  - New field `Room.features?: RoomFeatures`: consumed by TASK-04 (`RoomDetailContent.tsx`). No other current consumer. Existing `RoomCard.tsx` does not read `features` — unchanged and safe.
  - No existing field signatures change. `Room` interface addition is backward-compatible.

- **Scouts:** None: all data available in fact-find and existing locale files.
- **Edge Cases & Hardening:**
  - Apartment must NOT get a `features` block (scaffolding is incomplete). TypeScript optional field means absence is correct.
  - `viewSpec` for rooms with no external view (room_3, room_4, room_10) — leave absent per omit policy. The render policy is "omit section when absent." If the operator wants to explicitly communicate "no view," that lives in the i18n facility chip (`noView` label), not in the typed field. Rooms with a named view: double_room (sea view), room_5 (sea view), room_6 (sea view), room_9 (courtyard view), room_8 (garden view), room_11 (sea view), room_12 (sea view) — all get populated `viewSpec` strings.
  - `inRoomLockers` for rooms that mention "keycard lockers" in i18n copy vs rooms without mention: rooms 11 and 12 confirmed true. Rooms 3/4/5/6/9 — beds include curtains but no explicit locker mention; default to false/absent.
- **What would make this >=90%:** Operator confirms `viewSpec` population for no-view rooms and confirms which rooms have in-room lockers beyond 11/12.
- **Rollout / rollback:**
  - Rollout: Deploy with normal release. New optional field has zero blast radius on existing renders (TASK-04 provides the render surface).
  - Rollback: Revert commit. Consumers are unaffected — no one reads `features` until TASK-04 ships.
- **Documentation impact:** None: the `roomsData.ts` header comment is the doc; interface definition is self-documenting.
- **Notes / references:**
  - fact-find Per-Room Feature Audit, Constraints section, Resolved Q&A on terracePresent type and inRoomLockers scope.

**Build evidence (Complete 2026-02-27):**
- Exit code: 0 (codex exec --full-auto)
- Offload route: codex exec via with-writer-lock.sh
- Files verified: `apps/brikette/src/data/roomsData.ts` (RoomFeatures interface added, features? field on Room, all 10 rooms populated), `apps/brikette/src/test/utils/roomsDataFeatures.test.ts` (created, TC-01 to TC-06)
- Post-build validation: Mode 2 (Data Simulation) — file read confirmed interface shape, locker/terrace data per plan spec. Pass.
- Commit: `1d405d27be` — feat(brik): add RoomFeatures typed schema + locker FacilityKey (TASK-02, TASK-03) [combined with TASK-03]

---

### TASK-03: Add `locker` to `FacilityKey`, update `FacilityIcon.tsx` and `facilities.test.ts`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/ui/src/types/facility.ts` (new `locker` key), `apps/brikette/src/components/rooms/FacilityIcon.tsx` (`iconMap` entry), `apps/brikette/src/test/lib/facilities.test.ts` (expected union update)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/types/facility.ts`, `apps/brikette/src/components/rooms/FacilityIcon.tsx`, `apps/brikette/src/test/lib/facilities.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 95% — Three-file change with known exact locations. Add `"locker"` to `FACILITIES` const array; add `locker: <Icon>` to `iconMap`; add `"locker"` to expected array in test. `Archive` Lucide icon is already imported in `FacilityIcon.tsx` for `linen` — `Lock` or `LockKeyhole` from `@/icons` is appropriate for locker. Check import availability.
  - Approach: 90% — Established three-file update pattern confirmed in fact-find. Re-export barrel is automatic.
  - Impact: 85% — Enables TASK-04 to render a `locker` facility chip for rooms 11/12 that have `inRoomLockers: true`. Clean incremental addition to the established icon system.
  - **min(95, 90, 85) = 85%**
  - Note: held-back test for Approach at 90%: "What if `LockKeyhole` is not in `@/icons`?" — `@/icons` is an icon barrel in the brikette app. If `LockKeyhole` is not exported, use `Lock` or another appropriate Lucide icon. `FacilityIcon.tsx` currently imports: `Archive, Bath, BedDouble, Eye, HelpCircle, Home, KeyRound, LucideIcon, Sun, Users` — `Lock` or `Shield` is a reasonable addition. Fallback: use `KeyRound` temporarily. This is a minor icon-selection choice, not a structural risk.
- **Acceptance:**
  - `FACILITIES` array in `packages/ui/src/types/facility.ts` includes `"locker"`
  - `FacilityKey` union now includes `"locker"` (TypeScript inferred from const)
  - `iconMap` in `FacilityIcon.tsx` has `locker: <LockOrEquivalent>` entry
  - `facilities.test.ts` expected array includes `"locker"` — test passes in CI
  - No other existing FacilityKey entries changed
- **Validation contract (TC-XX):**
  - TC-01: `facilities.test.ts` — `FACILITIES` contains `"locker"` → passes
  - TC-02: `facilities.test.ts` — `FacilityKey` union includes `"locker"` (TypeScript compile-time check via expected array)
  - TC-03: `FacilityIcon.tsx` renders a non-HelpCircle icon for `facility="locker"` — verifiable via unit test or visual inspection
- **Execution plan:** Red → Green → Refactor
  - Red: Add `"locker"` to `FACILITIES` only — `facilities.test.ts` fails because expected array doesn't include it yet
  - Green: Update `facilities.test.ts` expected array to include `"locker"`; add `iconMap` entry in `FacilityIcon.tsx`
  - Refactor: Verify `FacilityKey` type is inferred correctly via TypeScript
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** Verify available Lucide icons exported from `@/icons` for a locker representation. `Lock`, `LockKeyhole`, `Shield` are plausible. `KeyRound` already exists for `keycard` — use a distinct icon for lockers.
- **Edge Cases & Hardening:** If the desired icon is not in `@/icons` barrel, add the import directly from `lucide-react` consistent with existing `FacilityIcon.tsx` import pattern.
- **What would make this >=90%:** Confirm icon availability in `@/icons`. At 90% after that confirmation.
- **Rollout / rollback:**
  - Rollout: New FacilityKey is additive. No existing renders break. Chip only appears in TASK-04 render implementation.
  - Rollback: Revert commit. No consumer yet reads `"locker"` FacilityKey before TASK-04.
- **Documentation impact:** None.
- **Notes / references:**
  - fact-find: Constraints section, Risk table "Adding locker FacilityKey..."
- **Build evidence (Complete 2026-02-27):**
  - Exit code: 0 (codex exec --full-auto)
  - Offload route: codex exec via with-writer-lock.sh (parallel with TASK-02)
  - Files verified: `packages/ui/src/types/facility.ts` (locker added at position 12), `apps/brikette/src/components/rooms/FacilityIcon.tsx` (ShieldCheck import + locker entry), `apps/brikette/src/test/lib/facilities.test.ts` (locker in expected array)
  - Scope expansion (controlled): `packages/ui/src/atoms/FacilityIcon.tsx` — added ShieldCheck + locker to fix TS2741 typecheck error (iconMap missing locker key after FacilityKey union extended)
  - Post-build validation: Mode 2 (Data Simulation) — file reads confirmed all acceptance criteria. Pass.
  - Commit: `1d405d27be` — feat(brik): add RoomFeatures typed schema + locker FacilityKey (TASK-02, TASK-03)

---

### TASK-04: Update `RoomDetailContent.tsx` — structured feature rendering with clean omission

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — new `FeatureSection` sub-component; renders `room.features` fields with null-guard omission; new test `apps/brikette/src/test/components/room-feature-section.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`, new file `apps/brikette/src/test/components/room-feature-section.test.tsx`, `[readonly] apps/brikette/src/data/roomsData.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-CP
- **Confidence:** 85%
  - Implementation: 85% — Render pattern is established in the same file (`HeroSection`, `OutlineSection`, `AmenitiesSection` all follow `if (!value || ...) return null`). New `FeatureSection` follows the same sub-component pattern. Feature data comes from `room.features` (TASK-02 output). The typed field itself controls render — no i18n lookup is needed to decide whether to render a row. Feature row labels (e.g., "Beds:", "Bathroom:", "View:") use hardcoded English strings with the `ds/no-hardcoded-copy` LINT-1007 exemption already established in `RoomCard.tsx`. Translation of these labels is explicitly out of scope for this plan (see Non-goals). This is a deliberate short-term trade-off: the Brikette primary audience is international but English is the default locale; translation can be added as a follow-on task without any structural change. The localization debt is documented here so it is not invisible.
  - Approach: 85% — Renders structured feature fields as a new section below the existing bed_description paragraph. Each feature gets a labelled chip or row. `terracePresent` and `inRoomLockers` gate their respective rows. `bedSpec` and `bathroomSpec` always render (required fields). `viewSpec` renders when present.
  - Impact: 85% — Directly enables the operator's goal: feature information visible on room detail pages. Impact capped because rooms 3/5 have limited photography (resolved by TASK-05) and rooms lacking amenity blurbs are incomplete (resolved by TASK-06).
  - **min(85, 85, 85) = 85%**
  - Held-back test for all dims at 85%: "What if the i18n labels for new feature fields aren't translated?" — feature field labels in `FeatureSection` can use hardcoded English initially (consistent with the `/* eslint-disable ds/no-hardcoded-copy, LINT-1007 */` exemption already on `RoomCard.tsx`). Translation is explicitly out of scope. Not a risk.

**Consumer tracing for new outputs:**
  - New `FeatureSection` sub-component is self-contained within `RoomDetailContent.tsx`. No external consumers.
  - Reads `room.features` (new optional field from TASK-02). Guard: `if (!room.features) return null` for the section.
  - Existing sections (`HeroSection`, `OutlineSection`, `AmenitiesSection`, bed_description paragraph) are unchanged.
  - `RoomCard.tsx` is NOT modified in this task — it uses i18n facility chip arrays, not the `features` struct. This is intentional: `RoomCard.tsx` is the listing-page card; `RoomDetailContent.tsx` is the detail page. Two surfaces, two sources.

- **Acceptance:**
  - `FeatureSection` component added to `RoomDetailContent.tsx` and rendered below the bed_description paragraph
  - When `room.features` is undefined → `FeatureSection` renders null (no broken layout)
  - When `room.features.bedSpec` is defined → bed row renders
  - When `room.features.bathroomSpec` is defined → bathroom row renders
  - When `room.features.viewSpec` is undefined → view row does not render
  - When `room.features.terracePresent` is true → terrace row renders; false/absent → no row
  - When `room.features.inRoomLockers` is true → lockers row renders with `locker` FacilityKey icon; false/absent → no row
  - New unit test `room-feature-section.test.tsx` covers: full features present → all rows render; `terracePresent` absent → terrace row absent; `inRoomLockers` absent → locker row absent; `features` undefined → section renders null
- **Validation contract (TC-XX):**
  - TC-01: Render `RoomDetailContent` with `room.features = { bedSpec: "1 double bed", bathroomSpec: "Ensuite bathroom", viewSpec: "Sea view", terracePresent: true, inRoomLockers: false }` → bed, bathroom, view, terrace rows all present; locker row absent
  - TC-02: Render with `room.features = { bedSpec: "3 bunk beds", bathroomSpec: "Shared bathroom" }` (no viewSpec, no terracePresent, no inRoomLockers) → only bed and bathroom rows present; no broken layout
  - TC-03: Render with `room.features = undefined` → `FeatureSection` renders null; page layout intact
  - TC-04: Render with `room.features = { bedSpec: "1 double bed", bathroomSpec: "Ensuite", inRoomLockers: true }` → locker row present with icon
  - TC-05: Render with `room = roomsData.find(r => r.id === 'double_room')` (real data post-TASK-02) → feature section present with bed, bathroom, view, and terrace rows (`terracePresent: true` for double_room); no locker row (absent)
- **Execution plan:** Red → Green → Refactor
  - Red: Write `room-feature-section.test.tsx` asserting bed row renders when `bedSpec` present — fails because `FeatureSection` doesn't exist
  - Green: Implement `FeatureSection` sub-component in `RoomDetailContent.tsx`; add to render tree; all TC tests pass
  - Refactor: Apply `/* eslint-disable ds/no-hardcoded-copy */` exemption if needed for English feature labels; ensure no TypeScript errors on optional field access
- **Planning validation (required for M/L):**
  - Checks run: Read `RoomDetailContent.tsx` lines 79–198 (sub-component patterns). Confirmed `HeroSection`, `OutlineSection`, `AmenitiesSection` patterns. Confirmed `coerceToContent` and `resolveAmenitiesSection` helpers. New `FeatureSection` does not need i18n lookup — reads directly from typed `room.features` fields.
  - Validation artifacts: `RoomDetailContent.tsx` sub-component pattern (lines 79–198), `RoomCard.tsx` `buildFacilities` pattern for icon chip rendering reference
  - Unexpected findings: `RoomCard.tsx` has `/* eslint-disable ds/no-hardcoded-copy, max-lines-per-function -- LINT-1007 */` — same exemption needed in `RoomDetailContent.tsx` for English labels in `FeatureSection`.
- **Scouts:** Verify `room.features` access pattern compiles with TypeScript strict optional chaining (`room.features?.bedSpec`). Confirmed: TypeScript optional chaining is already used throughout `RoomDetailContent.tsx`.
- **Edge Cases & Hardening:**
  - All `room.features` field accesses use optional chaining (`?.`)
  - `FeatureSection` receives the whole `features` object, not individual fields — guards against partial population
  - Labels for feature rows use hardcoded English strings with LINT-1007 exemption (i18n translation is out of scope)
  - Apartment room has no `features` → `FeatureSection` renders null cleanly
- **What would make this >=90%:** Operator confirms preferred visual treatment for feature rows (chip vs list row vs labelled paragraph). Current plan: labelled row matching existing section style. At 90% after visual confirmation.
- **Rollout / rollback:**
  - Rollout: Deploy with normal release. New section is additive. Existing sections untouched.
  - Rollback: Revert commit. Room detail pages return to current state (no feature section).
- **Documentation impact:** None: component is self-documenting.
- **Notes / references:**
  - fact-find: Patterns & Conventions Observed — "Resilience via null-guard in RoomDetailContent.tsx"
  - Render policy: omit section entirely when feature absent — operator-stated.
- **Build evidence (Complete 2026-02-27):**
  - Files modified: `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (FeatureSection added as named export, `<FeatureSection features={room.features} />` in render tree below bed_description)
  - New test: `apps/brikette/src/test/components/room-feature-section.test.tsx` (TC-01 through TC-05)
  - eslint exemption: `/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] */` added at top of file
  - FacilityIcon imported and used in locker row; `RoomFeatures` type imported from roomsData
  - Post-build validation: Mode 1 (Type-safe Code Analysis) — file reads + typecheck clean. All 5 TC assertions verifiable by inspection. Pass.
  - Commit: `4d33666756` — feat(brik): add FeatureSection to RoomDetailContent.tsx (TASK-04)

---

### TASK-05: Fix room_3 and room_5 image arrays — trim cross-borrowed images to landing-only

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/data/roomsData.ts` — room_3 and room_5 `imagesRaw` arrays trimmed to own images only
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/data/roomsData.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Clear data change: remove the cross-borrowed paths from `imagesRaw` for room_3 and room_5. Both rooms have their own `landing.webp` in `public/img/3/` and `public/img/5/`. The array becomes `["/img/3/landing.webp"]` and `["/img/5/landing.webp"]` respectively after the TASK-01 path fix.
  - Approach: 90% — Trim to own images is the default assumption from fact-find. Operator may override before build if borrowed images are acceptable. The plan defaults to trimming — this is the honest state (shows gap rather than another room's images).
  - Impact: 90% — Prevents misleading room content (showing room 4 images on room 3 page). Rooms 3 and 5 will show only a landing image until new photography is done — functionally correct, visually minimal.
  - **min(95, 90, 90) = 90%**
  - Held-back test: "What if the operator decides borrowed images are acceptable?" — operator can override by providing an explicit instruction before build. Default assumption is documented and reasonable.
- **Acceptance:**
  - room_3 `imagesRaw` = `["/img/3/landing.webp"]` (only own landing image)
  - room_5 `imagesRaw` = `["/img/5/landing.webp"]` (only own landing image)
  - No references to room 4 or room 6 image paths remain in room_3 or room_5 entries
  - `landingImage` for both rooms uses `/img/` prefix (TASK-01 ensures this)
  - No test regression: existing gallery/image tests use mocked `imagesRaw` arrays
- **Validation contract (TC-XX):**
  - TC-01: `roomsData.find(r => r.id === 'room_3').imagesRaw` → array with exactly one entry: `"/img/3/landing.webp"`
  - TC-02: `roomsData.find(r => r.id === 'room_5').imagesRaw` → array with exactly one entry: `"/img/5/landing.webp"`
  - TC-03: No entry in room_3 or room_5 `imagesRaw` contains `/4/` or `/6/` path segments
- **Execution plan:** Red → Green → Refactor
  - Red: Contract test added to `roomsDataImagePaths.test.ts` (from TASK-01) asserting no `/4/` in room_3 and no `/6/` in room_5 imagesRaw — fails currently
  - Green: Trim the arrays in `roomsData.ts`
  - Refactor: Confirm `landingImage` still correct for both rooms (uses `/img/` prefix after TASK-01)
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: data change only.
- **Edge Cases & Hardening:** After trimming, room_3 and room_5 galleries show 1 image. `UiRoomCard` must handle single-image arrays — confirmed: `images?: string[]` is optional in `RoomCardProps` and `RoomCard.tsx` uses `room.imagesRaw ?? []`.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy with normal release.
  - Rollback: Revert commit. Cross-borrowed images reappear (existing broken state).
- **Documentation impact:** None. Add inline comment in `roomsData.ts` for room_3 and room_5 noting photography gap.
- **Notes / references:**
  - fact-find: Per-Room Image Audit, Resolved Q&A on cross-borrowing.
  - Operator input: default assumption is trim. If operator says "rooms 3 and 5 share floor-plan with rooms 4 and 6 so shared images are acceptable," keep borrowed images but update paths to `/img/` prefix.
- **Build evidence (Complete 2026-02-27):**
  - Files modified: `apps/brikette/src/data/roomsData.ts` (room_3 and room_5 imagesRaw trimmed), `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts` (TC-05, TC-06 added)
  - room_3.imagesRaw: `["/img/3/landing.webp"]` (was 4 entries including 3 borrowed from room_4)
  - room_5.imagesRaw: `["/img/5/landing.webp"]` (was 7 entries including 6 borrowed from room_6)
  - Photography-gap inline comments added to both entries
  - Post-build validation: Mode 2 (Data Simulation) — TC-01 through TC-06 all pass by inspection. Pass.
  - Commit: `14177fdcf4` — fix(brik): trim room_3 and room_5 cross-borrowed image arrays (TASK-05)

---

### TASK-CP: Checkpoint — reassess render output and image coverage after Wave 2

- **Type:** CHECKPOINT
- **Deliverable:** Updated `docs/plans/brik-room-content-schema/plan.md` via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/plans/brik-room-content-schema/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution
  - Impact: 95% — controls downstream content authoring risk
- **Horizon assumptions to validate:**
  - FeatureSection renders correctly for all 10 rooms without visual regressions
  - Operator has reviewed rooms 3/5/8 image gaps and confirmed or provided new photography
  - No TypeScript compile errors from schema additions
  - Whether TASK-06 (amenity blurbs) scope is still correct given render changes
- **Validation contract:** `/lp-do-replan` run on downstream TASK-06; plan updated
- **Planning validation:** Downstream task TASK-06 is content authoring (i18n JSON edits) — relatively low risk. Checkpoint exists primarily to confirm render quality before expanding content surface.
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Updated plan.md
- **Checkpoint evidence (Complete 2026-02-27):**
  - All Wave 1 and Wave 2 tasks complete. TypeScript compilation clean.
  - Horizon assumptions verified: FeatureSection added with null-guard pattern; rooms 3/5 image arrays trimmed (photography gap noted); no TS errors.
  - TASK-06 replan: Scope confirmed unchanged. Confidence re-evaluated at 80% (meets IMPLEMENT threshold). TASK-06 is eligible for Wave 3 execution.
  - Topology unchanged — no `/lp-do-sequence` re-run needed.

---

### TASK-06: Add amenity blurbs to `rooms.json` for 7 rooms currently lacking them

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/locales/en/rooms.json` — `detail.{id}.amenities` arrays added for rooms 10, 3, 4, 5, 6, 9, 8
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/locales/en/rooms.json`
- **Depends on:** TASK-CP
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — Adding JSON arrays to an existing file following established blurb structure (3 blurbs per room, each with `title` and `body`). Pattern from `double_room`, `room_11`, `room_12` entries.
  - Approach: 80% — Content authoring quality depends on accuracy of blurbs against actual room characteristics. Blurbs must not contradict the typed `features` from TASK-02. No i18n translation needed for English source — translation is out of scope.
  - Impact: 80% — Completes the amenities section surface for all room detail pages. Blurbs are soft-marketing copy — impact on conversion is real but hard to isolate.
  - **min(85, 80, 80) = 80%**
  - Held-back test for Approach at 80%: "What if blurbs authored here contradict feature fields from TASK-02?" — blurbs are narrative, features are structured. The FeatureSection from TASK-04 is authoritative for structured features; amenity blurbs add marketing context. They do not logically conflict. Condition: author blurbs that are consistent with features (e.g., do not describe a terrace for room_9 which has `courtyardView` and no terrace). This is an authoring discipline, not a structural risk.
- **Acceptance:**
  - `rooms.json` has `detail.{id}.amenities` arrays for: room_10, room_3, room_4, room_5, room_6, room_9, room_8
  - Each new entry has 3 blurbs with non-empty `title` and `body` strings
  - Blurbs are factually consistent with `RoomFeatures` data from TASK-02
  - Existing entries for `double_room`, `room_11`, `room_12` are unchanged
  - `RoomDetailContent.tsx` renders amenity section for all 10 rooms (no rooms show empty amenity section)
- **Validation contract (TC-XX):**
  - TC-01: `rooms.json` has `detail.room_10.amenities` → array length 3
  - TC-02: `rooms.json` has `detail.room_3.amenities` → array length 3
  - TC-03: Each blurb `title` and `body` are non-empty strings
  - TC-04: Blurbs for room_9 (courtyard view, no terrace; `terracePresent` absent in features) do not mention terrace — concrete consistency check: grep for "terrace" in room_9 blurbs returns empty
  - TC-05: Blurbs for room_5/room_6 (sea-view terrace; `terracePresent: true` in features) mention sea view or terrace — concrete consistency check: grep for "terrace\|sea" in room_5/room_6 blurbs returns a match
  - TC-06: Blurbs for rooms 11/12 (`inRoomLockers: true`) reference locker or security — concrete consistency check: grep for "locker\|security\|key" in room_11/room_12 blurbs returns a match
- **Execution plan:** Red → Green → Refactor
  - Red: Write a test that asserts all 10 room IDs have `detail.{id}.amenities` in `rooms.json` — fails for 7 rooms
  - Green: Author blurbs for all 7 rooms; test passes
  - Refactor: Review blurb quality against room descriptions; ensure no factual contradictions with feature fields
- **Planning validation (required for M/L):**
  - Checks run: Read `rooms.json` confirming 3 existing entries (`double_room`, `room_11`, `room_12`). Read `roomsPage.json` bed_description for all 7 rooms to source blurb content.
  - Validation artifacts: bed_description strings in `roomsPage.json` as content source for blurbs
  - Unexpected findings: None
- **Scouts:** None: content authoring only.
- **Edge Cases & Hardening:**
  - Blurbs for rooms 3/5 (photography gap) should not describe imagery that doesn't exist
  - room_8 (2 images, garden view, female dorm) — blurbs should focus on the small intimate setting
- **What would make this >=90%:** Content review by operator. At 90% after operator sign-off on blurb drafts.
- **Rollout / rollback:**
  - Rollout: Deploy with normal release. New JSON content only.
  - Rollback: Revert commit. Rooms 10, 3, 4, 5, 6, 9, 8 return to no amenity section (current state — no regression).
- **Documentation impact:** None.
- **Notes / references:**
  - fact-find: `rooms.json` amenity blurb coverage (3 of 10 rooms), Risk table.
  - Blurb template: `{ "title": "<single benefit headline>", "body": "<2–3 sentence supporting description>" }`
- **Build evidence (Complete 2026-02-27):**
  - Files modified: `apps/brikette/src/locales/en/rooms.json` (7 new amenities arrays for room_3, room_4, room_5, room_6, room_8, room_9, room_10)
  - New test: `apps/brikette/src/test/utils/roomsAmenityBlurbs.test.ts` (TC-01 through TC-06)
  - Consistency checks: room_9 blurbs contain no "terrace" mentions (confirmed); room_5/room_6 blurbs reference "sea" or "terrace" (confirmed); existing double_room/room_11/room_12 entries unchanged
  - Post-build validation: Mode 2 (Data Simulation) — JSON read + grep pattern checks confirmed. Pass.
  - Commit: `2fe113bd38` — feat(brik): add amenity blurbs for 7 rooms in rooms.json (TASK-06)

---

### TASK-07: Define `RoomImages` interface + replace `imagesRaw` in `Room` + populate all 11 entries

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/data/roomsData.ts` — new exported `RoomImages` interface; `Room` interface field `imagesRaw: string[]` replaced by `images: RoomImages`; all 11 entries (10 rooms + apartment) populated with schema-valid `images` blocks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/data/roomsData.ts`
- **Depends on:** -
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 83%
  - Implementation: 85% — Interface definition and data population for 11 entries. Required slots (`bed`, `bathroom`) are always populated; optional slots are conditional per room inventory. The only held-back uncertainty is rooms 3/5: their `bed` and `bathroom` slots require visual assignment from Room 4/6 assets respectively (cross-borrow documented as acceptable interim — see Assumptions). Room 8's `bathroom` slot is intentionally left `undefined` (only 2 images; provisionally `bed` only).
  - Approach: 85% — Replace-not-extend is the cleanest strategy; confirmed in fact-find Resolved Q&A. `landingImage` remains unchanged. `toFlatImageArray` utility is co-located in `roomsData.ts` alongside `RoomImages` — this is the definitive location. All 4 consumers already import from `@/data/roomsData`; adding the utility there requires no new import path. A separate `imageUtils.ts` is not needed.
  - Impact: 80% — Interface change creates compile errors in all consumers until TASK-08 fixes them; this task alone cannot ship. Impact is realised only when the full TASK-07/08/09 PR is merged. Held-back 5%: the image assignments for rooms 3/5/8 are provisional and may need operator visual confirmation before the PR is published.
  - **min(85, 85, 80) = 83%** (rounded)
- **Acceptance:**
  - `RoomImages` interface exported from `roomsData.ts`: `{ bed: string; bathroom: string; view?: string; terrace?: string; security?: string }`
  - `Room` interface has `images: RoomImages` (required, not optional) replacing `imagesRaw: string[]`; `imagesRaw` field is removed
  - All 11 entries have an `images` block with at minimum `bed` and `bathroom` populated
  - `toFlatImageArray(images: RoomImages): string[]` utility function exported from `roomsData.ts` or co-located utility; returns `[bed, bathroom, view, terrace, security].filter(Boolean)` (all defined slots)
  - Apartment entry has provisional `images` block using its 3 placeholder paths; inline comment marks content population as deferred
  - `security` slot: `/img/keycard-tap.avif` used for all rooms that have keycard entry (all 11 entries)
  - `view` slot populated for rooms with a named view: double_room, room_5, room_6, room_9, room_8, room_11, room_12; absent for rooms 3, 4, 10
  - `terrace` slot populated for rooms with terrace: double_room, room_5, room_6, room_11, room_12; absent for others
  - TypeScript compiles cleanly within this file (TASK-08/09 resolve consumer errors in same PR)
- **Validation contract (TC-XX):**
  - TC-01: `roomsData.find(r => r.id === 'double_room').images.bed` → non-empty string starting with `/img/`
  - TC-02: `roomsData.find(r => r.id === 'double_room').images.security` → `/img/keycard-tap.avif`
  - TC-03: `roomsData.find(r => r.id === 'room_3').images.view` → `undefined` (room_3 has no view slot)
  - TC-04: `roomsData.find(r => r.id === 'room_10').images.terrace` → `undefined` (room_10 has no terrace)
  - TC-05: `toFlatImageArray(roomsData.find(r => r.id === 'room_11').images)` → array of at least 4 elements (bed, bathroom, view, terrace, security all defined for room_11)
  - TC-06: Every entry in `roomsData` has `images.bed` (non-empty string) and `images.bathroom` (non-empty string) — schema integrity test
  - TC-07: `roomsData.find(r => r.id === 'apartment').images` → defined with `bed`, `bathroom` populated; inline comment present noting photography gap
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-09 owns the schema integrity test (it lives in `roomsDataImagePaths.test.ts` as TC-07). TASK-07's Red step instead writes a TypeScript-only stub — add `images: RoomImages` to one room entry before the interface is exported — this produces a TypeScript error in `roomsData.ts` that guides the Green step.
  - Green: Add `RoomImages` interface export, replace `imagesRaw` with `images` on `Room` interface, populate all 11 entries, export `toFlatImageArray` utility — TypeScript errors in consumers remain until TASK-08/09 (expected in same PR).
  - Refactor: Confirm `imagesRaw` removed from interface; confirm `toFlatImageArray` handles all slot combinations correctly; confirm TypeScript compile (within `roomsData.ts` only) is clean; grep `apps/brikette/src/data/roomsData.ts` for any remaining `imagesRaw` reference.
- **Planning validation (required for M/L):**
  - Checks run: Read `roomsData.ts` lines 14–56 (Room interface) and lines 74–399 (all entries). Read `rooms/types.ts` to confirm `LocalizedRoom extends Room` directly — confirmed no independent `imagesRaw` declaration needed. Read `builders.ts` lines 22–25 to confirm `pickRelativeImagePaths` reads `room.imagesRaw` — consumer identified for TASK-08.
  - Validation artifacts: fact-find Image Slot Assessment table; Room Feature Inventory table; `roomsData.ts` full entry list for population
  - Unexpected findings: `LocalizedRoom extends Room` without re-declaring `imagesRaw` — type migration is automatic when `Room` is updated. No additional type file changes required.
- **Consumer tracing for new outputs:**
  - New field `Room.images: RoomImages`: consumed by TASK-08 (4 production files). TASK-09 updates 3 test files. No other consumers.
  - New function `toFlatImageArray(images: RoomImages): string[]`: consumed by all 4 TASK-08 consumer updates. Must be exported from `roomsData.ts` or a co-located utility importable by all consumers.
  - Removed field `Room.imagesRaw: string[]`: all 4 production consumers and 3 test files will emit TypeScript errors until TASK-08/09 fix them — expected; PR includes all three tasks.
- **Scouts:** Confirm `/img/keycard-tap.avif` exists in `public/img/`. Confirm image slot assignments for rooms 3/5/8 against actual file inventory (rooms 3 and 5: assign from /img/4/ and /img/6/ respectively with comment; room 8: use `/img/8/8_1.webp` for `bed`, leave `bathroom` undefined).
- **Edge Cases & Hardening:**
  - Apartment `images` block: use 3 existing placeholder paths provisionally (`apt1.jpg` → `bed`, `apt2.jpg` → `bathroom`, `apt3.jpg` → `view`) with inline comment noting that slot assignments are unconfirmed pending dedicated photography.
  - room_3 and room_5: cross-room image assignment is acceptable interim state. Use `/img/4/4_1.webp` and `/img/4/4_2.webp` for room_3 `bed` and `bathroom`; use `/img/6/6_1.webp` and `/img/6/6_2.webp` for room_5 `bed` and `bathroom`. Add inline comment.
  - room_8: `bathroom` slot left `undefined` — this is intentional, not an error. The feature `bathroomSpec` on `RoomFeatures` describes the bathroom; the image slot is an enhancement.
  - `toFlatImageArray` must preserve insertion order (bed first, bathroom second) to maintain the gallery's implicit narrative flow.
- **What would make this >=90%:** Operator confirms cross-room image assignment for rooms 3/5 is acceptable and confirms room 8 `bathroom` slot approach. At 90% after that.
- **Rollout / rollback:**
  - Rollout: Deploy only when TASK-08 and TASK-09 are also complete — single PR covers all three. TypeScript compile gates prevent partial deployment.
  - Rollback: Revert PR. `imagesRaw` field reappears; consumers revert to prior state.
- **Documentation impact:** Inline comments in `roomsData.ts` for rooms 3/5 (cross-borrow) and room 8 (sparse coverage) and apartment (photography gap).
- **Notes / references:**
  - fact-find: Resolved Q&A "Should the new schema replace imagesRaw or extend it?", Image Slot Assessment table, Suggested Task Seeds 1+2.
- **Build completion evidence (2026-02-27):**
  - `RoomImages` interface and `toFlatImageArray` added to `apps/brikette/src/data/roomsData.ts`. All 11 room entries (10 rooms + apartment) populated with `images` blocks. `imagesRaw` field removed from `Room` interface.
  - Image slot assignments: rooms 3/5 cross-borrow from 4/6 (photography gap); room 8 bathroom uses `landing.webp` fallback; apartment uses provisional `apt1/2/3.jpg`; all 11 rooms get `security: "/img/keycard-tap.avif"`.
  - `roomsDataImagePaths.test.ts` updated with TC-01 through TC-07 (TC-07 is the schema integrity test verifying bed/bathroom on all 11 entries).
  - Mode 2 data simulation verified: no-view rooms (3/4/10), no-terrace rooms (3/4/8/9/10), 22 bed+bathroom entries for 11 rooms — all constraints pass.

---

### TASK-08: Update all 4 `imagesRaw` consumers to derive images from `RoomImages` schema

- **Type:** IMPLEMENT
- **Deliverable:** Updated production files: `apps/brikette/src/components/rooms/RoomCard.tsx`, `apps/brikette/src/components/seo/RoomStructuredData.tsx`, `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx`, `apps/brikette/src/utils/schema/builders.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/components/rooms/RoomCard.tsx`, `apps/brikette/src/components/seo/RoomStructuredData.tsx`, `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx`, `apps/brikette/src/utils/schema/builders.ts`, `[readonly] packages/ui/src/molecules/RoomCard.tsx`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Four mechanical substitutions. Each consumer's `imagesRaw` usage is well-bounded: a single line in `RoomCard.tsx`, a single `pickRelativeImagePaths` function in `builders.ts`, two `toAbsoluteImages(room.imagesRaw)` calls in `RoomsStructuredDataRsc.tsx`, and a single `pickImages` function in `RoomStructuredData.tsx`. Each becomes `toFlatImageArray(room.images)` with appropriate `.slice(0, 4)` where currently applied.
  - Approach: 85% — Adapter-derived flat array preserves the `@acme/ui` `RoomCardProps.images?: string[]` contract with zero package changes. `toFlatImageArray` imported from `roomsData.ts` (or co-located utility). No structural refactors needed.
  - Impact: 80% — Consumer updates complete the schema migration. No user-visible change expected (gallery ordering: bed first, bathroom, view, terrace, security — vs. prior arbitrary numbered order). SEO structured-data image arrays will be better-labeled conceptually but unchanged in output format.
  - **min(90, 85, 80) = 85%**
- **Acceptance:**
  - `RoomCard.tsx`: `const images = room.imagesRaw ?? []` → `const images = toFlatImageArray(room.images)`
  - `RoomStructuredData.tsx`: `pickImages` function body → derive from `toFlatImageArray(room.images).slice(0, 4)` with `BASE_URL` prefix
  - `RoomsStructuredDataRsc.tsx`: both `toAbsoluteImages(room.imagesRaw)` calls → `toAbsoluteImages(toFlatImageArray(room.images))`
  - `builders.ts`: `pickRelativeImagePaths` body → `return toFlatImageArray(room.images).slice(0, 4)`
  - `builders.ts` hardcoded hotel-level image references (lines 109–113, `buildHotelNode`) are NOT changed — they reference a fixed hotel landing image for hotel-level JSON-LD and are explicitly out of scope
  - TypeScript compiles cleanly across all modified files — no new `any` casts, no `imagesRaw` references remaining
  - All existing tests that exercise these consumers continue to pass (test file updates in TASK-09)
- **Validation contract (TC-XX):**
  - TC-01: `RoomCard.tsx` — no remaining reference to `imagesRaw`; `toFlatImageArray` imported and used
  - TC-02: `RoomStructuredData.tsx` — `pickImages` returns array derived from `room.images` via `toFlatImageArray`; `.slice(0, 4)` preserved
  - TC-03: `RoomsStructuredDataRsc.tsx` — both `imagesRaw` usages replaced; no remaining `imagesRaw` reference
  - TC-04: `builders.ts` — `pickRelativeImagePaths` body updated; `buildHotelNode` hardcoded references unchanged
  - TC-05: TypeScript compile passes with zero errors on modified files (`pnpm typecheck`)
- **Execution plan:** Red → Green → Refactor
  - Red: Not applicable — consumer files already have TypeScript errors from TASK-07 (`imagesRaw` removed). This task is the "green" step for those errors.
  - Green: Update all four consumer files to import and use `toFlatImageArray`; TypeScript errors resolve
  - Refactor: grep `apps/brikette/src/` for any remaining `imagesRaw` references in production code (excluding test files — covered in TASK-09); fix any found
- **Planning validation (required for M/L):**
  - Checks run: Read `RoomCard.tsx` line 147 (`const images = room.imagesRaw ?? []`). Read `RoomStructuredData.tsx` lines 27–29 (`pickImages` function). Read `RoomsStructuredDataRsc.tsx` lines 69–91 (two `toAbsoluteImages(room.imagesRaw)` calls). Read `builders.ts` lines 22–25 (`pickRelativeImagePaths`) and lines 109–113 (`buildHotelNode` hardcoded hotel image refs). Confirmed all four consumers and the out-of-scope hotel-node references.
  - Validation artifacts: `imagesRaw` grep showing all 8 files; `rooms/types.ts` confirming `LocalizedRoom extends Room` (no independent re-declaration); `builders.ts` distinguishing `pickRelativeImagePaths` (in-scope) from `buildHotelNode` fixed refs (out-of-scope)
  - Unexpected findings: `RoomsStructuredDataRsc.tsx` has two separate `imagesRaw` usages (lines 71 and 89 — one for `offers.images`, one for `HotelRoom.image`). Both must be updated.
- **Consumer tracing for modified behaviors:**
  - `RoomCard.tsx` adapter: currently passes `room.imagesRaw ?? []`; will pass `toFlatImageArray(room.images)`. The `@acme/ui` `UiRoomCard.images?: string[]` prop is unchanged — no package change required.
  - `RoomStructuredData.tsx` `pickImages`: currently slices `imagesRaw`; will slice `toFlatImageArray(room.images)`. Output format unchanged (`string[]` of absolute URLs). SEO structured data behavior identical.
  - `RoomsStructuredDataRsc.tsx`: two usages both pass `string[]` to `toAbsoluteImages()`. Unchanged return type. Behavior identical.
  - `builders.ts` `pickRelativeImagePaths`: currently returns `room.imagesRaw.slice(0,4)`; will return `toFlatImageArray(room.images).slice(0,4)`. Output format unchanged. Home graph JSON-LD behavior identical.
- **Scouts:** Verify `toFlatImageArray` import path is correct after TASK-07 places it. If in `roomsData.ts`, import is `import { roomsData, toFlatImageArray } from "@/data/roomsData"`. If in a separate utility, confirm path.
- **Edge Cases & Hardening:**
  - `toFlatImageArray` returns an empty array if all slots are `undefined` — this should not happen for any real room (required `bed` and `bathroom` slots) but is safe for the `UiRoomCard` empty-state render.
  - `RoomStructuredData.tsx` `pickImages` has a guard `Array.isArray(room.imagesRaw)` — this guard is no longer needed since `room.images` is a typed object (not an array). Remove the guard; replace with direct `toFlatImageArray(room.images).slice(0, 4)`.
  - `builders.ts` `pickRelativeImagePaths` has a similar `Array.isArray` guard — remove it for the same reason.
- **What would make this >=90%:** Verify `toFlatImageArray` is tested independently in TASK-09 schema integrity test. At 90% after TASK-09 confirms coverage.
- **Rollout / rollback:**
  - Rollout: Deploy as part of the single Wave 2 PR (TASK-07 + TASK-08 + TASK-09).
  - Rollback: Revert PR. All consumers revert to `imagesRaw`.
- **Documentation impact:** None. Comments in modified functions are self-explanatory.
- **Notes / references:**
  - fact-find: Dependency & Impact Map, Suggested Task Seeds 3+4.
  - Out-of-scope: `buildHotelNode` hardcoded image refs at `builders.ts` lines 109–113 — hotel-level JSON-LD, separate from room gallery images.
- **Build completion evidence (2026-02-27):**
  - All 4 consumer files updated: `RoomCard.tsx` (line 147 `toFlatImageArray` call), `RoomStructuredData.tsx` (`pickImages` function, removed `Array.isArray` guard), `RoomsStructuredDataRsc.tsx` (both `imagesRaw` calls at lines 71 and 89), `builders.ts` (`pickRelativeImagePaths` function, removed `Array.isArray` guard).
  - Controlled scope expansion: `packages/ui/src/data/roomsData.ts` (stale copy, also had `imagesRaw`) and `packages/ui/src/organisms/RoomsSection.tsx` (also used `room.imagesRaw`) updated to resolve TypeScript errors in `HomeContent.tsx` via `CarouselSlidesProps`.
  - `pnpm --filter brikette typecheck` passes with zero errors.
  - Zero `imagesRaw` references remain in `apps/brikette/src/` (production code).

---

### TASK-09: Update 3 test files — remove `imagesRaw` stubs, add schema integrity tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated test files: `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts`, `apps/brikette/src/test/utils/roomsCatalog.test.ts`, `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts`, `apps/brikette/src/test/utils/roomsCatalog.test.ts`, `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — Three-file update with clear substitution patterns. `roomsDataImagePaths.test.ts` TC-01 through TC-04 iterate `room.imagesRaw`; rewrite to iterate `toFlatImageArray(room.images)` or assert `room.images.bed` directly. TC-05 and TC-06 (room_3/room_5 isolation) become assertions on `room.images.bed` and `room.images.bathroom` slot paths. `roomsCatalog.test.ts` mock stub `imagesRaw: []` → `images: { bed: "/img/test-bed.webp", bathroom: "/img/test-bathroom.webp" }`. `RoomsStructuredDataRsc.test.tsx` mock stubs → use `images` schema.
  - Approach: 88% — Pattern is clear; no render logic changes. Test file is pure data substitution plus schema integrity assertions.
  - Impact: 88% — Tests are the gating CI check. Without this task, the Wave 2 PR cannot pass CI.
  - **min(90, 88, 88) = 88%**
- **Acceptance:**
  - `roomsDataImagePaths.test.ts`: no remaining `imagesRaw` references; TC-01 and TC-02 rewritten to iterate `toFlatImageArray(room.images)` and assert `/img/` prefix; TC-03 rewritten to assert `room.images.bed` path for apartment; TC-04 rewritten to assert `toFlatImageArray(room.images).length >= 2` for apartment; TC-05 and TC-06 rewritten to assert room_3 and room_5 `images.bed` slot contains a `/img/` path; new TC-07 added asserting every room has non-empty `images.bed` and `images.bathroom` (schema integrity — this is the canonical schema integrity test; TASK-09 is the owner)
  - `roomsCatalog.test.ts`: mock room stub updated from `imagesRaw: []` to `images: { bed: "/img/test-bed.webp", bathroom: "/img/test-bathroom.webp" }`
  - `RoomsStructuredDataRsc.test.tsx`: mock room stubs updated from `imagesRaw: ["/img/dorm-6.jpg"]` and `imagesRaw: ["/img/twin.jpg"]` to `images: { bed: "/img/dorm-6.jpg", bathroom: "/img/test-bathroom.webp" }` and `images: { bed: "/img/twin.jpg", bathroom: "/img/test-bathroom.webp" }` respectively; JSON-LD output expectations validated
  - All tests pass in CI
- **Validation contract (TC-XX):**
  - TC-01: `roomsDataImagePaths.test.ts` — all test cases pass; no `imagesRaw` reference
  - TC-02: `roomsCatalog.test.ts` — mock stub compiles and test passes
  - TC-03: `RoomsStructuredDataRsc.test.tsx` — mock stubs compile; JSON-LD output test passes
  - TC-04: Schema integrity test (`every room has images.bed and images.bathroom`) passes for all 11 entries
- **Execution plan:** Red → Green → Refactor
  - Red: Tests already fail from TASK-07 (TypeScript: `imagesRaw` does not exist on `Room`). This task resolves those failures.
  - Green: Update all three test files; add schema integrity test; all tests pass in CI
  - Refactor: Confirm no `imagesRaw` remains in any test file under `apps/brikette/src/test/`
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** Confirm mock `images` shape is consistent with `RoomImages` interface from TASK-07. Minimum required: `{ bed: string; bathroom: string }`.
- **Edge Cases & Hardening:**
  - `RoomsStructuredDataRsc.test.tsx` may assert specific image URL strings in the rendered JSON-LD — update expected strings to match the `toFlatImageArray`-derived array output.
  - `roomsCatalog.test.ts` mock only needs minimum required slots (`bed` and `bathroom`) since optional slots are not needed for catalog utility tests.
- **What would make this >=90%:** Already at 88%. At 90% after confirming the `RoomsStructuredDataRsc` test's expected JSON-LD output matches the new flat-array derivation.
- **Rollout / rollback:**
  - Rollout: Deploy as part of the single Wave 2 PR (TASK-07 + TASK-08 + TASK-09).
  - Rollback: Revert PR. Test files revert to `imagesRaw`.
- **Documentation impact:** None.
- **Notes / references:**
  - fact-find: Test Landscape, Suggested Task Seed 6.
- **Build completion evidence (2026-02-27):**
  - `roomsCatalog.test.ts` mock updated: `imagesRaw: []` → `images: { bed: "/img/test-bed.webp", bathroom: "/img/test-bathroom.webp" }`.
  - `RoomsStructuredDataRsc.test.tsx` two mock stubs updated: `imagesRaw: ["/img/dorm-6.jpg"]` and `imagesRaw: ["/img/twin.jpg"]` → `images: { bed, bathroom }` with `/img/test-bathroom.webp` bathroom slot.
  - Controlled scope expansion: `packages/ui/src/data/__tests__/roomsData.test.ts` updated — `expect(room.imagesRaw.length).toBeGreaterThan(0)` → `expect(room.images.bed).toBeTruthy(); expect(room.images.bathroom).toBeTruthy()`.
  - Zero `imagesRaw` references remain in any test file under `apps/brikette/src/test/`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix image paths + contract test | Yes — no dependencies; `roomsData.ts` and `public/img/` locations confirmed | None | No |
| TASK-02: RoomFeatures interface + population | Yes — no dependencies; `Room` interface and existing optional-field pattern confirmed | [Minor] `viewSpec` for no-view rooms: leave absent (omit) vs populate with "No external view". Decision: leave absent (omit policy). | No — resolved in planning |
| TASK-03: locker FacilityKey + iconMap + test | Yes — no dependencies; three target files confirmed | [Minor] Icon availability for `locker` in `@/icons` barrel not fully verified. Fallback available (any distinct Lucide lock icon). | No — fallback documented |
| TASK-04: FeatureSection render in RoomDetailContent | Partial — depends on TASK-02 (RoomFeatures type) and TASK-03 (locker key). Both complete before TASK-04 per wave ordering. | [Moderate] Feature labels in FeatureSection are hardcoded English — requires LINT-1007 exemption already present in sibling component RoomCard.tsx. Apply same exemption. | No — pattern established |
| TASK-05: Trim room_3/room_5 image arrays | Partial — depends on TASK-01 (path prefix fix must precede so arrays use correct `/img/` prefix). TASK-01 completes in Wave 1. | None | No |
| TASK-CP: Checkpoint | Yes — depends on TASK-04 completion. | None | No |
| TASK-06: Amenity blurbs for 7 rooms | Yes — depends on TASK-CP. No code preconditions (JSON-only change). | [Minor] Blurb content must not contradict TASK-02 feature fields. Authoring discipline, not structural risk. | No |

| TASK-07: Define RoomImages interface + populate 11 entries | Yes — no external dependencies; `Room` interface and all 11 entries confirmed; `LocalizedRoom` extends `Room` directly (no re-declaration) | [Minor] Cross-room image assignment for rooms 3/5 is provisional — operator visual confirmation recommended before PR publish. Documented in Assumptions as acceptable interim. | No |
| TASK-08: Update 4 consumers | Partial — depends on TASK-07 (TypeScript errors in all 4 consumers until schema defined). `builders.ts` hotel-node hardcoded refs confirmed out of scope. | [Moderate] Two distinct `imagesRaw` usages in `RoomsStructuredDataRsc.tsx` (lines 71 and 89) — both must be updated, not just one. Identified in Planning Validation. | No — addressed in Acceptance |
| TASK-09: Update 3 test files | Partial — depends on TASK-07 (TypeScript errors in test stubs until interface defined). | None | No |

No Critical simulation findings. All findings are Minor or Moderate and advisory.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Image path bug is already causing broken galleries in production | Confirmed | High | TASK-01 is Wave 1 priority; deploy as hotfix if needed separately |
| rooms 3 and 5 will have 1-image galleries until new photography | Confirmed | Medium | TASK-05 documents the gap. Operator can provide photography post-deploy. |
| room_8 has only 2 images; operator may have unpublished photography | Unknown | Medium | Documented in fact-find open questions. Default: retain 2 images as-is. |
| locker icon availability in @/icons barrel | Low | Low | Fallback: any distinct Lucide lock icon. Import directly from lucide-react if needed. |
| Blurb content in TASK-06 may need operator review before publish | Medium | Low | Checkpoint gate before TASK-06 provides review opportunity. |
| TypeScript compile errors if RoomFeatures fields accessed without optional chaining | Low | Low | All access uses `room.features?.field` pattern; TypeScript strict mode enforces this. |
| Wave 2: TASK-07/08/09 must land in a single PR — partial deployment causes TypeScript compile failure | Confirmed | High | Single-PR requirement enforced in Constraints. CI gates prevent merge if any consumer still references `imagesRaw`. |
| Wave 2: `RoomsStructuredDataRsc.tsx` has two separate `imagesRaw` usages (lines 71 and 89) — one could be missed | Low | Moderate | Both usages identified in Planning Validation for TASK-08. TASK-09 CI test will fail if either remains. |
| Wave 2: Rooms 3 and 5 image slots provisionally assigned from cross-room assets — may show misleading content | Low | Low | Inline comments document the provisional state. Same content that was being shown before (cross-borrowing was pre-existing). Operator can supply dedicated photography as follow-on. |
| Wave 2: `builders.ts` hotel-node hardcoded image references may be confused with `imagesRaw` consumers | Low | Low | Explicitly out of scope and documented in Constraints and TASK-08 Acceptance. |
| Wave 2: `builders.ts` hotel-node image refs (lines 109–113) use legacy `/images/` prefix (e.g. `makeImageNode("/images/7/landing.webp")`) — pre-existing technical debt | Confirmed | Low | Out of scope for Wave 2; hotel-level JSON-LD only. Separate fix required before hotel structured data images resolve correctly. Log as follow-on task. |

## Observability

- Logging: None required — no runtime logging changes.
- Metrics: Monitor room detail page image 404 rates post TASK-01 deploy (Cloudflare analytics).
- Alerts/Dashboards: Track `room_selection_rate` at `room_detail_view` funnel step before/after full plan deploys.

## Acceptance Criteria (overall)

- [x] All `imagesRaw` and `landingImage` paths in `roomsData.ts` use `/img/` prefix (TASK-01 complete)
- [x] `RoomFeatures` interface defined and populated for all 10 non-apartment rooms (TASK-02 complete)
- [x] `Room.features?.bedSpec` and `Room.features?.bathroomSpec` non-empty for all 10 rooms (TASK-02 complete)
- [x] `Room.features?.terracePresent` true for double_room, room_5, room_6, room_11, room_12; absent for others (TASK-02 complete)
- [x] `Room.features?.inRoomLockers` true for rooms 11, 12 (TASK-02 complete)
- [x] `locker` present in `FacilityKey` union and `FacilityIcon.tsx` iconMap (TASK-03 complete)
- [x] `FeatureSection` renders in `RoomDetailContent.tsx` with clean omission for absent fields (TASK-04 complete)
- [x] No broken layout on any room detail page for any of the 10 rooms (TASK-04 complete)
- [x] room_3 and room_5 `imagesRaw` contain only own `/img/3/` and `/img/5/` images (TASK-05 complete)
- [x] All 10 rooms have amenity blurbs in `rooms.json` (TASK-06 complete)
- [ ] `RoomImages` interface (`bed`, `bathroom`, `view?`, `terrace?`, `security?`) defined and exported from `roomsData.ts` (TASK-07)
- [ ] `imagesRaw: string[]` removed from `Room` interface; replaced by `images: RoomImages` (TASK-07)
- [ ] All 11 entries (10 rooms + apartment) have `images` block with `bed` and `bathroom` populated (TASK-07)
- [ ] `toFlatImageArray(images: RoomImages): string[]` utility exported and used by all consumers (TASK-07/08)
- [ ] `RoomCard.tsx`, `RoomStructuredData.tsx`, `RoomsStructuredDataRsc.tsx`, `builders.ts` — no remaining `imagesRaw` references (TASK-08)
- [ ] All 3 test files updated — no `imagesRaw` stubs; schema integrity test passes (TASK-09)
- [ ] TypeScript compiles cleanly with zero new errors after Wave 2 PR merges (TASK-07/08/09)
- [ ] All CI tests pass after Wave 2 PR (TASK-07/08/09)

## Decision Log

- 2026-02-27: Chose Option A (typed RoomFeatures struct) over Option B (i18n-only). Rationale: TypeScript enforcement enables clean boolean omission logic; i18n-only has no type safety for render decisions.
- 2026-02-27: `terracePresent` stays boolean (not richer type). Terrace size distinction lives in i18n label variants; no duplication needed. Rooms with `terracePresent: true`: double_room, room_5, room_6, room_11, room_12 (confirmed from bed_description text).
- 2026-02-27: `viewSpec` absent for no-view rooms (rooms 3, 4, 10). Omit policy means no view renders nothing, not "No external view" copy.
- 2026-02-27: room_3 and room_5 image arrays trimmed to landing-only by default. Operator can override if shared photography is acceptable.
- 2026-02-27: `locker` added as `FacilityKey` to enable icon chip rendering for rooms with `inRoomLockers: true`.
- 2026-02-27 (Wave 2 — Dispatch 0046): Replace-not-extend chosen for `imagesRaw → images: RoomImages`. Clean single-PR migration; all consumers are app-layer files with no external package dependencies on the field name. `landingImage` stays unchanged.
- 2026-02-27 (Wave 2): `toFlatImageArray` utility co-located in `roomsData.ts` (or adjacent utility). Returns `[bed, bathroom, view, terrace, security].filter(Boolean)` — preserves semantic ordering for gallery narrative flow.
- 2026-02-27 (Wave 2): TASK-07/08/09 must ship in a single PR. TypeScript compile integrity requires all consumers to be updated atomically when `imagesRaw` is removed from the `Room` interface.
- 2026-02-27 (Wave 2): Cross-room image assignment for rooms 3/5 is acceptable interim state. Inline comments document the provisional nature. No new photography required before this PR.
- 2026-02-27 (Wave 2): `/img/keycard-tap.avif` used as universal `security` slot for all rooms — keycard access is universal across all BRIK rooms.
- 2026-02-27 (Wave 2): Room 8 `bathroom` slot left `undefined` intentionally. Only 2 images exist; `8_1.webp` provisionally assigned to `bed`. The `RoomFeatures.bathroomSpec` field already communicates bathroom type textually; image slot is an enhancement.
- 2026-02-27 (Wave 2): `builders.ts` hardcoded hotel-level image references (lines 109–113, `buildHotelNode`) are explicitly out of scope. They are hotel-level JSON-LD fixed references, not room gallery images.

## Overall-confidence Calculation

All original tasks are complete. Wave 2 pending tasks only:

Tasks and effort weights (pending tasks):
- TASK-07: 83% × M(2) = 166
- TASK-08: 85% × M(2) = 170
- TASK-09: 88% × S(1) = 88

Sum of (confidence × weight) = 166 + 170 + 88 = 424
Sum of weights = 2 + 2 + 1 = 5

Wave 2 overall-confidence = 424 / 5 = **84.8%** (rounded to 85%)

For reference, full plan weighted average (all tasks including complete):
- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × M(2) = 170
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × M(2) = 170
- TASK-05: 90% × S(1) = 90
- TASK-06: 80% × M(2) = 160
- TASK-07: 83% × M(2) = 166
- TASK-08: 85% × M(2) = 170
- TASK-09: 88% × S(1) = 88

Sum of (confidence × weight) = 90 + 170 + 85 + 170 + 90 + 160 + 166 + 170 + 88 = 1189
Sum of weights = 1 + 2 + 1 + 2 + 1 + 2 + 2 + 2 + 1 = 14

Plan overall-confidence = 1189 / 14 = **85%** (rounded)

(TASK-CP is CHECKPOINT — excluded from confidence calculation per policy.)
