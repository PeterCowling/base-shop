---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-room-content-schema
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-room-content-schema/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0046
Trigger-Source: dispatch-routed
artifact: fact-find
---

# BRIK Room Content Schema Fact-Find Brief

## Scope

### Summary

`roomsData.ts` is the single source of truth for all 10 room entries plus the apartment. Each entry carries a flat, semantically unlabeled `imagesRaw: string[]` alongside operational fields (rate codes, occupancy, pricing). There is no typed content schema enforcing presence of guest-decision-driver image categories: bed, bathroom, view, terrace (where applicable), and security (keycard entry, in-room lockers). The i18n `roomsPage.json` namespace carries facility keys per room as a flat array, which is the current rendering mechanism for feature discovery. Components (`RoomCard`, `RoomDetailContent`) have null-guard patterns but no explicit resilience contract for optional features. The proposed change introduces a structured typed image schema and a per-room feature inventory, with conditional rendering that silently omits absent optional slots.

### Goals

- Define a typed `RoomImages` interface with required slots (`bed`, `bathroom`) and optional slots (`view?`, `terrace?`, `security?`) replacing the untyped `imagesRaw: string[]`
- Inventory all 11 room entries against the five decision-driver categories so the schema can be populated accurately
- Establish which `/img/<room>/` files exist and which schema slots can be assigned from current assets
- Determine a conditional rendering strategy in `RoomCard` and `RoomDetailContent` that silently omits absent optional feature slots with no empty sections, placeholders, or broken layout
- Produce a planning brief for `roomsData.ts` schema update and `RoomCard`/`RoomDetailContent` rendering changes

### Non-goals

- Image compression or format optimisation (deferred to a separate pass)
- Alt-text authoring per slot (adjacent item from the dispatch queue)
- Apartment page (`ApartmentPageContent.tsx`) scope (noted as adjacent later work)
- Translation of new schema keys into all 20+ locales (translation follows structure-first build)

### Constraints & Assumptions

- Constraints:
  - `imagesRaw` paths in `roomsData.ts` use `/img/<room>/…` directly (the file has already migrated away from the legacy `/images/` prefix). `resolveAssetPath()` in `packages/ui/src/shared/media.ts` normalises any residual `/images/` prefix but is effectively a no-op for current data. New schema slots must use `/img/` paths.
  - `Room` extends `RoomCategory` (from `@/types/machine-layer/ml.ts`) minus localisation fields — schema extension must stay compatible with `Omit<RoomCategory, …>` pattern
  - The shared `@acme/ui` `RoomCard` component consumes images as `images?: string[]` — any schema change in `roomsData.ts` must either remain backwards-compatible with this flat array prop or include a coordinated adapter update in the app-layer `RoomCard.tsx`
  - `FacilityKey` in `packages/ui/src/types/facility.ts` is a const-narrowed array; keys used in `roomsPage.json` (e.g. `seaViewTerrace`, `bathroomSharedFemale`) extend beyond the canonical list — these are i18n display keys, not the facility type
- Assumptions:
  - The operator owns or can supply images for any gap slots; this fact-find establishes which slots are unpopulated but does not require photography to be in hand before planning
  - The apartment entry is **out of scope for content population** (slot assignment deferred to adjacent task) but **in scope for type migration** — when `imagesRaw: string[]` is removed from the `Room` interface, the apartment entry must be migrated to the new `images: RoomImages` type in the same PR to maintain TypeScript safety. Its `imagesRaw` currently has 3 images (`/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg`) — a dedicated test (`roomsDataImagePaths.test.ts` TC-03/TC-04) confirms this; a code comment notes these are placeholder images pending dedicated room photography

## Outcome Contract

- **Why:** Guests must be able to review accurate room information and a complete image set before booking. The current flat, unlabeled `imagesRaw` array provides no guarantee that the five key decision-driver categories are covered, creating a gap in the pre-booking information experience.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 10 room detail pages display images that reliably cover each applicable decision driver (bed, bathroom, view, terrace, security); optional feature slots are silently omitted when not present with no empty sections or broken layout; the typed schema prevents future room entries from shipping without required slot coverage.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx` — Next.js App Router server component; calls `generateStaticParams` over all `roomsData` entries; renders `<RoomDetailContent lang id />` inside `<Suspense>`
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — client component; orchestrates the full room detail render pipeline (HeroSection, SocialProofSection, RoomCard, bed description, DirectBookingPerks, StickyBookNow)

### Key Modules / Files

- `apps/brikette/src/data/roomsData.ts` — data source of truth; defines `Room` interface and the 10-entry `roomsData` array plus apartment. The `imagesRaw: string[]` field is the only image store; entries range from 2 images (room_8) to 7 images (room_12); apartment has 3 placeholder images. No semantic labeling.
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — client component; reads `room.imagesRaw` indirectly via `RoomCard`; HeroSection has null-guard (`if (!hero || …) return null`); AmenitiesSection has a `shouldRender` guard; no image-slot-level guards exist
- `apps/brikette/src/components/rooms/RoomCard.tsx` — app adapter; extracts `const images = room.imagesRaw ?? []`; passes flat array to `<UiRoomCard images={images} …>`; no slot-aware logic
- `packages/ui/src/molecules/RoomCard.tsx` — shared UI card; renders a carousel gallery from `images?: string[]` via `RoomImage` atom; gracefully handles empty array (renders `labels.empty` placeholder text)
- `packages/ui/src/atoms/RoomImage.tsx` — renders a single gallery image; calls `resolveAssetPath(image)` to convert `/images/` → `/img/`
- `packages/ui/src/shared/media.ts` — `resolveAssetPath(path)`: replaces `/images/` prefix with `/img/`; the entire gallery rendering depends on this transform
- `packages/ui/src/types/roomCard.ts` — `RoomCardProps.images?: string[]`; the gallery prop is untyped beyond flat string array
- `packages/ui/src/types/facility.ts` — canonical `FacilityKey` const union (12 keys); separate from the i18n facility display keys
- `apps/brikette/src/components/rooms/FacilityIcon.tsx` — maps `FacilityKey` to Lucide icons; includes `keycard`, `bathroomEnsuite`, `bathroomShared`, `seaView`, `gardenView`
- `apps/brikette/src/components/seo/RoomStructuredData.tsx` — consumes `room.imagesRaw.slice(0, 4)` for JSON-LD `HotelRoom.image`; will need updating when schema changes

### Patterns & Conventions Observed

- **Null-guard pattern** — `HeroSection`, `OutlineSection`, `AmenitiesSection` all check for content existence before rendering; the same pattern should apply to any new optional image section
- **`resolveAssetPath` convention** — `roomsData.ts` now uses `/img/<room>/…` paths directly in all entries (migration from `/images/` already complete). `resolveAssetPath()` normalises any legacy `/images/` prefix but is a no-op for current data. The test fixture in `RoomCard.test.tsx` still uses `/images/one.jpg` (which `resolveAssetPath` maps to `/img/one.jpg`) — this is intentional for testing the transform path.
- **i18n-first feature list** — room features are authored as i18n `facilities` arrays per room ID in `roomsPage.json`; the `FacilityKey` type is the render contract; extended keys like `seaViewTerrace` exist in locale files but not in the canonical type
- **Flat `imagesRaw` array** — no positional or semantic convention is enforced; `landing.webp` is always the first entry and also stored in `landingImage`; remaining images are numbered (`7_1.webp`, `7_2.webp`, …) with no semantic meaning

### Data & Contracts

- Types/schemas:
  - `Room` (roomsData.ts): `{ id: RoomId; imagesRaw: string[]; landingImage: string; widgetRoomCode: string; widgetRateCodeNR: string; widgetRateCodeFlex: string; rateCodes: RateCodes; … extends Omit<RoomCategory, 'images'|'name'|'description'|'amenities'> }`
  - `RoomCardProps` (packages/ui/src/types/roomCard.ts): `images?: string[]` — accepts flat array only
  - `FacilityKey` (packages/ui/src/types/facility.ts): const union of 12 canonical facility keys
- Persistence: all room data is static TypeScript; no database; no CMS
- API/contracts: `RoomStructuredData` consumes `room.imagesRaw.slice(0, 4)` for JSON-LD; `page.tsx` uses `room.landingImage` for OG image metadata

### Dependency & Impact Map

- Upstream dependencies:
  - `roomsData.ts` is imported by: `RoomDetailContent.tsx`, `page.tsx` (rooms), `RoomStructuredData.tsx`, `roomsCatalog.ts` utility, `RoomsSection.tsx` (listing page), `page.tsx` (rooms listing)
  - `imagesRaw` is consumed by: `RoomCard.tsx` (app adapter), `RoomStructuredData.tsx`
- Downstream dependents:
  - `@acme/ui` `RoomCard` receives `images: string[]` from the app adapter — any change to the Room schema must go through the adapter without breaking the UI contract
  - `RoomStructuredData` reads `imagesRaw.slice(0, 4)` — must be updated to read from new schema
  - `RoomsSection.tsx` (listing page) reads `room.landingImage` — not `imagesRaw` — unaffected by the gallery schema change
- Likely blast radius:
  - **Direct:** `roomsData.ts`, app-layer `RoomCard.tsx` adapter, `RoomStructuredData.tsx`, `RoomsStructuredDataRsc.tsx` (two usages of `room.imagesRaw`), `apps/brikette/src/utils/schema/builders.ts` (`pickRelativeImagePaths` reads `room.imagesRaw.slice(0,4)` for JSON-LD graph construction) — all must be updated in the same PR
  - **Direct production updates required:** `apps/brikette/src/utils/schema/builders.ts` (`pickRelativeImagePaths` uses `room.imagesRaw.slice(0,4)` for Home graph JSON-LD); `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` (two `room.imagesRaw` usages for JSON-LD image arrays) — both must be updated in the same PR alongside `RoomCard.tsx` adapter and `RoomStructuredData.tsx`.
  - **Direct test updates required:** `apps/brikette/src/test/utils/roomsDataImagePaths.test.ts` — directly iterates `room.imagesRaw` in TC-01 through TC-04 and will fail when `imagesRaw` is removed; must be updated to test the new `images` schema in the same PR. `apps/brikette/src/test/utils/roomsCatalog.test.ts` stubs `imagesRaw: []` in a mock room — will need updating. `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` stubs `imagesRaw` in mock data — will need updating.
  - **Indirect:** `rooms-metadata-copy.test.ts` does not reference images; unaffected.
  - **Safe:** `landingImage` field is separate from `imagesRaw`; listing page renders are unaffected

### Room Feature Inventory (Decision Drivers)

Based on `roomsPage.json` facility keys and actual `/img/` directory contents:

| Room ID | Room Num | Type | Has Terrace | Has Sea View | Has Courtyard/Garden View | Has Ensuite Bath | Has Shared Bath | Keycard | Image Count (raw) | Image Dirs Confirmed |
|---|---|---|---|---|---|---|---|---|---|---|
| double_room | 7 | Private double | Yes (`seaViewTerrace`) | Yes | — | Yes (`bathroomEnsuite`) | — | Yes | 4 | /img/7/ (4 files) |
| room_10 | 10 | Mixed dorm (6) | No (`noView`) | No | — | Yes (`bathroomEnsuite`) | — | Yes | 3 | /img/10/ (3 files) |
| room_11 | 11 | Female dorm (6) | Yes (`seaViewExtraLargeTerrace`) | Yes | — | Yes (`bathroomEnsuite`) | — | Yes | 6 | /img/11/ (6 files) |
| room_12 | 12 | Mixed dorm (6) | Yes (`seaViewExtraLargeTerrace`) | Yes | — | — | Yes (`bathroomPrivate` — i18n uses private, likely ensuite) | Yes | 7 | /img/12/ (7 files) |
| room_3 | 3 | Female dorm (8) | No (`noView`) | No | — | — | Yes (`bathroomSharedFemale`) | Yes | 4 (using /img/4/ images) | /img/3/ (1 file: landing.webp only) |
| room_4 | 4 | Mixed dorm (8) | No (`noView`) | No | — | — | Yes (`bathroomSharedFemale`) | Yes | 3 | /img/4/ (4 files: landing + 3) |
| room_5 | 5 | Female dorm (6) | Yes (`seaViewTerrace`) | Yes | — | Yes (`bathroomEnsuite`) | — | Yes | 7 (using /img/6/ images) | /img/5/ (1 file: landing.webp only) |
| room_6 | 6 | Female dorm (7) | Yes (`seaViewTerrace`) | Yes | — | Yes (`bathroomEnsuite`) | — | Yes | 7 | /img/6/ (7 files) |
| room_9 | 9 | Mixed dorm (3) | No | No | Yes (`courtyardView`) | Yes (`bathroomEnsuite`) | — | Yes | 5 | /img/9/ (5 files) |
| room_8 | 8 | Female dorm (2) | No | No | Yes (`gardenView`) | — | Yes (`bathroomSharedFemale`) | Yes | 2 | /img/8/ (2 files) |
| apartment | — | Private apt (4) | Unknown | Unknown | — | Unknown | — | Unknown | 3 (`apt1.jpg`, `apt2.jpg`, `apt3.jpg`; comment notes photography gap) | /img/ root (not a room subdirectory) |

**Critical data-quality observations:**
1. **room_3** references `/img/4/4_1.webp`, `/img/4/4_2.webp`, `/img/4/4_3.webp` — images from Room 4's directory. `/img/3/` contains only `landing.webp`. This means room_3's gallery shows Room 4 content.
2. **room_5** references `/img/6/6_1.webp` through `6_6.webp` — images from Room 6's directory. `/img/5/` contains only `landing.webp`. Room_5's gallery shows Room 6 content.
3. **room_8** has only `landing.webp` + `8_1.webp` — 2 images, no dedicated bathroom or feature shots likely.
4. **apartment** has 3 images (`/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg`); a code comment flags these as placeholder images. A dedicated test (`roomsDataImagePaths.test.ts` TC-03/TC-04) asserts exactly 3 images with the `/img/apt1.jpg` path. Apartment is out of scope for this task but the test confirms current state accurately.

### Image Slot Assessment Against Schema Targets

For the proposed schema `{ bed: string; bathroom: string; view?: string; terrace?: string; security?: string }`:

| Room | `bed` slot (required) | `bathroom` slot (required) | `view` slot (optional) | `terrace` slot (optional) | `security` slot (optional) | Assessment |
|---|---|---|---|---|---|---|
| double_room | Has 3 numbered images — plausible bed shot | Ensuite present in room, image may exist among 3 shots | Sea view: yes, dedicated shot unknown | Terrace: yes, dedicated shot unknown | Keycard entry exists; `/img/keycard-tap.avif` in global `/img/` | PARTIAL — numbered images unvalidated by subject |
| room_10 | 2 numbered images | Ensuite; shot unknown | No view (no slot needed) | No terrace (no slot needed) | Keycard; global asset available | PARTIAL |
| room_11 | 5 numbered images, rich set | Ensuite | Sea view + extra-large terrace | Terrace | Keycard | GOOD — most images; slots plausibly assignable |
| room_12 | 6 numbered images | Private/ensuite | Sea view + extra-large terrace | Terrace | Keycard | GOOD |
| room_3 | Images are actually Room 4's | Shared bathroom; shots from Room 4 | No view | No terrace | Keycard | BAD — wrong images; needs own photography or reassignment |
| room_4 | 3 numbered images | Shared bathroom | No view | No terrace | Keycard | PARTIAL — image count low |
| room_5 | Images are Room 6's | Ensuite; shots from Room 6 | Sea view terrace; shots from Room 6 | Terrace; shots from Room 6 | Keycard | BAD — wrong images; needs own photography |
| room_6 | 6 numbered images | Ensuite | Sea view terrace | Terrace | Keycard | GOOD |
| room_9 | 4 numbered images | Ensuite | Courtyard view | No terrace | Keycard | PARTIAL |
| room_8 | 1 numbered image only | Shared; unknown coverage | Garden view | No terrace | Keycard | SPARSE — only 2 images total |
| apartment | 3 images exist (`/img/apt1.jpg`, `apt2.jpg`, `apt3.jpg`); code comment notes photography gap | Unknown (apt images unreviewed) | Unknown | Unknown | Unknown | PARTIAL — images present but subjects unknown; out of scope for this task |

**Global assets available for `security` slot across all rooms:**
- `/img/keycard-tap.avif` — keycard tap image; usable as shared `security` slot image for all rooms
- `/img/hostel-terrace-bamboo-canopy.webp` — terrace image; potentially reusable as shared `terrace` context image

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (app tests); Jest + Testing Library (packages/ui)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` (governed runner)
- CI integration: reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `RoomCard` (UI) | Unit | `packages/ui/src/molecules/__tests__/RoomCard.test.tsx` | Covers: core fields render, price states, fullscreen handler, image cycling, empty state label, action label split. Passes `images: ["/images/one.jpg", …]` — tests resolveAssetPath indirectly. No schema-slot tests. |
| Room metadata copy | Unit | `apps/brikette/src/test/app/rooms-metadata-copy.test.ts` | Tests page metadata strings; no image coverage. |
| roomsCatalog | Unit | `apps/brikette/src/test/utils/roomsCatalog.test.ts` | Tests catalog utility; no image field coverage. |
| RoomsStructuredData | Unit | `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` | Tests JSON-LD output; likely exercises `imagesRaw.slice(0, 4)` code path. Will need updating when schema changes. |
| GA4 room CTAs | Unit | `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` | Tests GA4 tracking; no image coverage. |
| useRoomPricing | Unit | `apps/brikette/src/test/hooks/useRoomPricing.test.ts` | Hook test; unaffected. |
| RoomCard (app adapter) | None | — | No unit tests exist for the app-layer `RoomCard.tsx` adapter directly. |

#### Coverage Gaps

- Untested paths:
  - App-layer `RoomCard.tsx` adapter image mapping logic — no test file exists
  - Schema slot presence validation — no test enforces that `bed` and `bathroom` slots are populated for every room entry
  - Optional slot omission — no test verifies that absent `view/terrace/security` slots produce no empty DOM nodes
- Extinct tests: none identified; `resolveAssetPath` is tested indirectly via `RoomCard` test passing `/images/` paths

#### Testability Assessment

- Easy to test:
  - Schema type enforcement (TypeScript at compile time)
  - Slot omission rendering (unit test: render `RoomCard` with `images` drawn from schema slots; assert no empty `<section>` when optional slot is `undefined`)
  - `resolveAssetPath` transform (already covered)
- Hard to test:
  - Visual correctness of images assigned to schema slots — requires visual review or screenshot comparison
  - Actual file existence for each slot path — can be tested in a lightweight Node script or CI check
- Test seams needed:
  - A schema integrity test (Jest): iterate all rooms in `roomsData`; assert each has `images.bed` (non-empty string) and `images.bathroom` (non-empty string)
  - A rendering test: render `RoomCard` with structured schema props; assert gallery renders bed/bathroom first, skips optional slots that are `undefined`

#### Recommended Test Approach

- Unit tests for: `roomsData` schema integrity (required slots populated); adapter `images[]` derivation from schema; optional-slot conditional rendering in app-layer `RoomCard`
- Integration tests for: none additional; `RoomStructuredData` test update to accept new image source
- E2E tests for: not required; visual review adequate for image assignment validation
- Contract tests for: TypeScript compile-time type checking of `RoomImages` interface is the primary contract

### Recent Git History (Targeted)

- `apps/brikette/src/data/roomsData.ts` — last changed in `e90d02aa44` ("fix(brikette): booking funnel fixes") and `764d0f6585` ("feat(brikette): apartment content rework + theme token cleanup"). The apartment entry has a `// TODO: Get room number from Octorate` and `// TODO: Add actual apartment images` — explicitly flagged for follow-up.
- `apps/brikette/src/components/rooms/RoomCard.tsx` — last changed in `83cc0c043c` ("fix(brikette): TASK-09 — tighten SSR ready guard in RoomCard to eliminate i18n key leakage"). Adapter has been actively refined; the `images = room.imagesRaw ?? []` line is a stable, simple extraction.

## Questions

### Resolved

- Q: Does `resolveAssetPath` apply uniformly, or do some images skip the transform?
  - A: It applies at two points: `RoomImage.tsx` (display) and `RoomCard.tsx` (fullscreen payload). All gallery images pass through it. The convention of using `/images/` in data and `/img/` at render is fully consistent. New schema can use either convention; using `/img/` directly is cleaner but either works.
  - Evidence: `packages/ui/src/shared/media.ts`, `packages/ui/src/atoms/RoomImage.tsx` lines 4 + 30, `packages/ui/src/molecules/RoomCard.tsx` line `resolveAssetPath(currentImage)`

- Q: Is the `imagesRaw` field the only image input to the gallery, or are there secondary sources?
  - A: Yes, it is the only gallery source. `landingImage` is used only for OG/metadata and in the listing card thumbnail; it does not feed the detail-page gallery.
  - Evidence: `RoomCard.tsx` adapter line `const images = room.imagesRaw ?? []`; `page.tsx` line `buildCfImageUrl(room.landingImage || …)`

- Q: What is the right omission strategy for optional feature slots?
  - A: The pattern already established in `RoomDetailContent.tsx` is the correct approach: compute a derived flat `string[]` from the schema by filtering out undefined optional slots, then pass the flat array to `UiRoomCard.images`. The UI `RoomCard` already handles empty arrays gracefully (shows `labels.empty`). This means no changes are needed to the shared UI package's `RoomCardProps` — the adapter handles the mapping. Optional slots that are `undefined` are simply not included in the derived array.
  - Evidence: `RoomDetailContent.tsx` `AmenitiesSection shouldRender` guard pattern; `packages/ui/src/molecules/RoomCard.tsx` empty-state branch

- Q: Should the new schema replace `imagesRaw` in the `Room` interface or extend it?
  - A: Replace. The `imagesRaw: string[]` field is consumed by: `RoomCard.tsx` adapter, `RoomStructuredData.tsx`, `RoomsStructuredDataRsc.tsx`, and `builders.ts` (`pickRelativeImagePaths`). All four are app-layer files with no external package dependencies on the field name, so a clean replacement with `images: RoomImages` (typed) is feasible in one PR. A derived flat-array adapter can be extracted as a shared utility (`toFlatImageArray(images: RoomImages): string[]`) used by all four consumers. `landingImage` stays as-is — it serves a different purpose.
  - Evidence: blast radius analysis above; both consumers are app-layer files with no external package dependencies on the field name

- Q: Are there images among the numbered slots that can already be assigned to schema categories?
  - A: Partially. For rooms with clean directories (7, 10, 11, 12, 6, 9), numbered images exist and can be assigned at edit time (requires visual inspection to confirm subject). For rooms 3 and 5, the images currently referenced are borrowed from other rooms — these need corrective action before schema population. Room 8 has very sparse coverage (2 images total). A global asset `/img/keycard-tap.avif` can serve as the `security` slot for all rooms since keycard access is universal.
  - Evidence: image directory audit above; roomsData.ts cross-room borrowing confirmed

- Q: Is the `FacilityKey` type sufficient to drive the schema design, or is a separate image schema concept needed?
  - A: A separate `RoomImages` interface is needed. `FacilityKey` drives the facilities list in the card (icons + labels), not the image gallery. The image schema is a content schema for visual decision-driver coverage, not a feature registry. The two are parallel concerns: `facilities[]` describes what the room has; `images` shows it. They should remain separate.
  - Evidence: `FacilityIcon.tsx` iconMap; `RoomCard.tsx` adapter separation of `images` and `facilityItems`

- Q: Will apartment need to be handled in this plan?
  - A: No. Apartment is explicitly deferred. It currently has 3 placeholder images (`/img/apt1.jpg`, `apt2.jpg`, `apt3.jpg`) that are not dedicated room-type photography. A code comment flags the gap. The apartment follows a different route (`/apartment` not `/rooms/[id]`) and uses a separate component (`ApartmentPageContent`). Its `imagesRaw` field will need to be migrated to the new schema type in the same PR (to maintain type safety), but slot population follows in an adjacent task.
  - Evidence: `roomsData.ts` apartment entry line 334; `roomsDataImagePaths.test.ts` TC-03/TC-04
  - Evidence: roomsData.ts apartment entry; dispatch adjacent_later list

### Open (Operator Input Required)

- Q: For rooms 3 and 5, the gallery currently borrows images from Room 4 and Room 6 respectively. Is this intentional (shared space that looks the same) or a data entry error?
  - Why operator input is required: only the operator knows whether rooms 3+5 are physically similar enough to rooms 4+6 that cross-borrowing is acceptable, or whether dedicated photography is needed.
  - Decision impacted: whether `room_3.images.bed` and `room_5.images.bed` can be assigned from Room 4/6 assets, or whether new photography is needed before the schema can be fully populated.
  - Decision owner: operator
  - Default assumption: treat as shared-look rooms; allow cross-room image assignment as an interim measure, clearly documented in code comments. Schema slots can be populated; image uniqueness is a separate concern.

- Q: For Room 8 (2 images: landing + one numbered shot), does dedicated bathroom photography exist or is new photography needed?
  - Why operator input is required: the agent cannot determine from file inventory whether the single `8_1.webp` shows a bathroom, bed, or other feature.
  - Decision impacted: whether `room_8.images.bathroom` can be populated from existing assets or requires new content.
  - Decision owner: operator
  - Default assumption: `8_1.webp` is provisionally assigned to the `bed` slot; `bathroom` slot is left undefined pending operator confirmation or new asset.

## Confidence Inputs

- **Implementation: 85%**
  Evidence basis: Entry points, adapter pattern, and type contract are fully mapped. `imagesRaw → RoomImages` is a straightforward field rename + typing addition; the adapter derives a flat array for the UI. The change touches 3 files with clear responsibilities. Score would be 90% after operator confirms rooms 3/5 image question and Room 8 bathroom coverage.

- **Approach: 88%**
  Evidence basis: The replace-not-extend approach for `imagesRaw` is consistent with how other optional features are handled in `RoomDetailContent` (guard patterns). The adapter-derived flat array preserves UI package API compatibility with zero changes to `packages/ui`. Confidence is high; the only residual uncertainty is whether the operator prefers a labeled gallery view (showing slot labels as captions) vs. plain sequential gallery (current behavior unchanged).

- **Impact: 90%**
  Evidence basis: Operators have stated the requirement explicitly. The current `room_3` and `room_5` cross-room image borrowing is a live content bug visible to guests. Introducing typed schema catches this class of error at compile time going forward.

- **Delivery-Readiness: 78%**
  Evidence basis: All component files are mapped; no external dependencies; no API keys required; no database migrations. Score is below 80% because image content for rooms 3/5/8 needs operator input before the schema can be fully populated. The TypeScript refactor itself is delivery-ready at 90%+; only the image assignment completion is gated on operator.

- **Testability: 82%**
  Evidence basis: TypeScript compile-time enforcement is the primary contract gate. A schema integrity Jest test can run in CI. Optional-slot rendering can be unit-tested against the adapter. What raises to >=90: add a file-existence CI check that verifies each populated slot path resolves to an actual `/img/` file.

### What raises scores to >=80 and >=90:

- Implementation >=90: Operator confirms rooms 3/5 cross-borrow is acceptable (or new images supplied). Removes the only open question about data completeness.
- Approach >=90: Operator confirms no labeled-gallery UI requirement. Keeps the scope as a pure data-schema change with no UI visual changes.
- Delivery-Readiness >=80: Operator answers the two Open questions above. All slot assignments can then be written in the plan task without a "to be determined" flag.
- Testability >=90: File-existence CI check added alongside schema integrity test.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Rooms 3 and 5 currently show borrowed images from other rooms — guests may be misled | Confirmed (factual observation) | High — direct booking-decision quality impact | Schema update makes the borrowing explicit and typed; operator decision needed on whether to accept cross-room assignment or commission dedicated photography |
| `RoomStructuredData.tsx` reads `room.imagesRaw.slice(0, 4)` — will break on schema change | High (guaranteed) | Moderate — SEO JSON-LD breakage if not updated | Must update `RoomStructuredData` in the same PR to derive images from the new schema |
| Apartment entry has 3 placeholder images (`/img/apt1.jpg` etc.) that are not dedicated room-type photography (bed, bathroom, view) — its `imagesRaw` field is in-scope of any type-level `imagesRaw` removal | Confirmed | Low (apartment is out of scope for schema population; its test (`roomsDataImagePaths.test.ts` TC-03/TC-04) must be updated in the same PR) | Update the apartment entry with its own provisional `images` schema block using the 3 placeholder paths; apartment follows with proper slot population in adjacent task |
| Extended i18n facility keys (e.g. `seaViewTerrace`, `bathroomSharedFemale`) exist in locale JSON but not in the canonical `FacilityKey` type | Confirmed | Low — display-only, no type error at runtime | Out of scope for this change; noted as a pre-existing type gap |
| Schema integrity test may be hard to enforce if rooms have known missing slots (e.g. room_8 bathroom) | Low | Low | Test can assert presence of required slots at the type level and optionally allow `null` as an explicit "known missing" value distinct from `undefined` (unset) |
| New schema adds a nominal migration burden for future room entries | Low | Negligible | TypeScript will enforce required slots at compile time — this is a benefit, not a risk |

## Planning Constraints & Notes

- Must-follow patterns:
  - All image paths in `roomsData.ts` must use `/img/<room>/…` directly — the file has already completed the migration from legacy `/images/` prefix; new schema slots must follow the same `/img/` convention
  - The shared `@acme/ui` `RoomCard` interface (`images?: string[]`) must not change; all schema-to-display mapping stays in the app-layer adapter
  - Optional slots must be `undefined` (absent), not `null` or `""` — the adapter filters with `Boolean()` or explicit `!== undefined` to build the flat array
  - The `RoomImages` interface should use required vs optional field typing (`bed: string; bathroom: string; view?: string; terrace?: string; security?: string`) to enforce slot presence at the type level — TypeScript compile errors will surface any room entry missing required slots
- Rollout/rollback expectations:
  - This is a static-data change; rollback is a git revert. No runtime feature flag needed.
  - The change is backwards-safe for the UI: flat array still passes unchanged to `UiRoomCard`
- Observability expectations:
  - No new analytics events required for the schema change itself
  - Image assignment correctness is verified visually per room detail page after deploy

## Suggested Task Seeds (Non-binding)

1. **Define `RoomImages` interface** in `roomsData.ts` — required slots `bed: string`, `bathroom: string`; optional slots `view?: string`, `terrace?: string`, `security?: string`; update `Room` interface to replace `imagesRaw: string[]` with `images: RoomImages`; keep `landingImage: string` unchanged
2. **Populate schema for all 10 rooms plus apartment** — assign each slot based on the inventory table above; document cross-room borrowing (rooms 3/5) with inline comments; leave slots undefined where no suitable image exists; use `/img/keycard-tap.avif` for `security` slot across all rooms; apartment gets a provisional `images` block using its 3 placeholder paths (slot population deferred to adjacent task)
3. **Update app-layer `RoomCard.tsx` adapter** — replace `const images = room.imagesRaw ?? []` with a derived array from `room.images`; order: `[bed, bathroom, view, terrace, security].filter(Boolean)` where each optional slot is only included if defined
4. **Update `RoomStructuredData.tsx`** — derive JSON-LD image array from new schema instead of `imagesRaw.slice(0, 4)`
5. **Add schema integrity test** — Jest test that iterates all rooms in `roomsData` and asserts `images.bed` and `images.bathroom` are non-empty strings
6. **Update all `imagesRaw` consumers and tests** — update `roomsDataImagePaths.test.ts` (TC-01 through TC-04 all reference `room.imagesRaw`); update `roomsCatalog.test.ts` mock; update `RoomsStructuredDataRsc.test.tsx` mock; remove `imagesRaw` from `Room` interface; verify TypeScript compiles cleanly

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - TypeScript compiles with zero new errors (`pnpm typecheck`)
  - All existing room-related tests pass
  - New schema integrity test passes
  - `RoomStructuredData` test updated and passing
  - `imagesRaw` field no longer present in `Room` interface
- Post-delivery measurement plan:
  - Visual QA: review each of the 10 room detail pages and confirm gallery shows relevant decision-driver images
  - No GA4 event changes required for this task

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `roomsData.ts` structure and field inventory | Yes | None | No |
| `imagesRaw` consumption path (RoomCard adapter → UI RoomCard → RoomImage → resolveAssetPath) | Yes | None | No |
| Optional feature omission strategy (null-guard precedents in RoomDetailContent) | Yes | None | No |
| `/img/<room>/` file inventory vs `imagesRaw` declarations | Yes | [Scope gap in investigation] Minor: actual image subjects (what each numbered file shows) cannot be determined without visual inspection — operator assignment needed for slot labeling | No (documented in Open Questions) |
| Cross-room image borrowing (rooms 3 and 5) | Yes | [Missing data dependency] Major: rooms 3 and 5 reference another room's images; `bed` and `bathroom` slots cannot be accurately populated without operator decision | No (Open Question Q1 handles this) |
| `RoomStructuredData.tsx` impact | Yes | [Missing precondition] Moderate: `imagesRaw.slice(0,4)` will break if field is removed without updating this file — must be in same PR | No (Task Seed 4 covers this) |
| Facility key type gap (i18n keys vs canonical FacilityKey) | Yes | [Scope gap] Minor: extended i18n keys are out of scope and pre-existing; noted but not blocking | No |
| Test landscape coverage | Yes | None | No |
| Apartment entry status | Yes | None (confirmed out of scope; TODO documented in data) | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** All claims are traced to specific file paths, line content, or command output. The cross-room image borrowing (rooms 3/5) was confirmed by reading `roomsData.ts` and running a directory listing of `/img/`.
2. **Boundary coverage:** Integration boundary between `roomsData.ts` and `RoomStructuredData.tsx` was inspected — the `imagesRaw.slice(0,4)` usage was found and noted as a required co-update. No external API boundaries exist; this is static data only.
3. **Testing coverage:** Existing test files were enumerated; coverage gaps (no app-layer RoomCard adapter test; no schema integrity test) were identified and incorporated into task seeds.
4. **Business validation coverage:** The operator's three stated requirements (decision-driver coverage, resilient omission, accurate pre-booking info) map directly to the schema design. The facility key inventory provides the ground truth for which rooms have which features.
5. **Confidence calibration:** Delivery-Readiness is held below 80% to reflect the two genuine open questions (rooms 3/5 borrowing intent; room 8 bathroom coverage). Other scores reflect the actual evidence quality.

### Confidence Adjustments

- Delivery-Readiness reduced from initial estimate of 85% to 78% after discovering the rooms 3/5 cross-borrow pattern — image content cannot be fully specified without operator input.
- Implementation held at 85% (not 90%) because `RoomStructuredData.tsx` update dependency was identified after initial scoping.

### Remaining Assumptions

- The `/img/keycard-tap.avif` global asset is suitable for use as the `security` slot image for all rooms (visual QA required but no blocking concern).
- The numbered image files for rooms with clean directories (7, 11, 12, 6, 9) contain images that can be visually mapped to bed/bathroom/view/terrace subjects — slot assignment requires operator visual review but no new photography.
- Room 8's single numbered image `8_1.webp` can be provisionally assigned to `bed`; bathroom slot can be left `undefined` initially.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (the two Open Questions are non-blocking for planning — the plan can include a task step for operator to confirm image assignments before the schema is populated with file paths, or the plan can use the default assumptions documented above)
- Recommended next step: `/lp-do-plan brik-room-content-schema --auto`
