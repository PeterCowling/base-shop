---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: CMS
Created: 2026-01-30
Last-updated: 2026-01-30
Feature-Slug: remove-gallery-feature
Related-Plan: docs/plans/remove-gallery-feature-plan.md
---

# Remove Gallery Feature Fact-Find Brief

## Scope

### Summary

Remove the gallery block feature from the guides system. This includes:
- Removing gallery block type from guide manifest and block composition
- Removing gallery UI components (ImageGallery, ZoomableImageGallery)
- Removing gallery from dev guidelines panel
- Removing gallery from editor UI
- Migrating existing gallery images to inline placement in guide articles
- Removing gallery data structures from types and schemas
- Removing gallery-related tests

Gallery images will be repurposed as inline images within guide articles, with captions placed underneath. Images should be positioned near related content mentions.

### Goals

- Remove all gallery-related code from the guides system
- Migrate gallery images inline for 2 guides that currently display galleries:
  - `positanoBeaches` (8 gallery images)
  - `luggageStoragePositano` (uses gallery data from JSON)
- Remove gallery validation from SEO audit
- Remove gallery section from dev guidelines panel
- Clean up gallery data from all 29+ guide JSON files across all locales

### Non-goals

- Keeping gallery as a deprecated/hidden feature
- Creating a new generic image block system (just use inline images in markdown/content)
- Migrating images for guides that have gallery JSON but never displayed it (can remove the unused data)

### Constraints & Assumptions

**Constraints:**
- Must preserve all gallery images (no data loss)
- Must maintain image attribution/credits in captions
- One-shot migration (no feature flag, no phased rollout)
- All locales must be updated simultaneously

**Assumptions:**
- Gallery images can be appropriately placed inline by examining content context
- Guides with gallery JSON but no gallery block were never using those images (safe to just delete the unused JSON data)
- No external dependencies on gallery API or data structure

## Repo Audit (Current State)

### Entry Points

**Gallery block usage (active):**
- `src/routes/guides/guide-manifest.ts:675` — luggageStoragePositano guide (source: "luggage-storage-positano")
- `src/routes/guides/guide-manifest.ts:1477` — positanoBeaches guide (source: "positanoBeaches", zoomable: true)

**Gallery module files:**
- `src/routes/guides/positanoBeaches.gallery.ts` — Gallery builder for positanoBeaches (only gallery.ts file)

**Guide JSON files with gallery data:**
- 29 EN guide JSON files contain gallery data (found via grep)
- Most guides have gallery JSON but no corresponding gallery block in manifest
- Only 2 guides actively display galleries

### Key Modules / Files

**Block system:**
- `src/routes/guides/blocks/handlers/galleryBlock.tsx` — Gallery block handler with rendering logic
- `src/routes/guides/blocks/handlers/index.ts:9` — Exports applyGalleryBlock
- `src/routes/guides/blocks/composeBlocks.tsx` — Likely handles gallery block composition
- `src/routes/guides/blocks/types.ts:13` — "gallery" in GUIDE_BLOCK_TYPES array
- `src/routes/guides/blocks/types.ts:68-99` — galleryItemSchema and galleryBlockOptionsSchema
- `src/routes/guides/blocks/types.ts:208-209` — GalleryBlockOptions and GalleryBlockItem type exports
- `src/routes/guides/blocks/types.ts:237-240` — GalleryBlock type definition
- `src/routes/guides/blocks/types.ts:301` — GalleryBlock in GuideBlockDeclaration union
- `src/routes/guides/blocks/types.ts:327-330` — Gallery schema in GUIDE_BLOCK_DECLARATION_SCHEMA

**Components:**
- `src/components/guides/ImageGallery.tsx` — Standard grid gallery component
- `src/components/guides/ZoomableImageGallery.tsx` — Zoomable gallery with Dialog (TASK-03)
- `src/components/guides/GenericContent.tsx` — May reference galleries

**Module resolution:**
- `src/routes/guides/blocks/utils/moduleResolver.ts:39-44` — GALLERY_CONTEXT and GALLERY_MODULES webpack resolution

**Dev tools:**
- `src/routes/guides/guide-seo/components/DiagnosticDetails.tsx:292-314` — "Media & galleries" section in guidelines panel
- `src/app/[lang]/draft/edit/[guideKey]/tabs/GalleryTab.tsx` — Editor UI for gallery management

**SEO audit:**
- `src/lib/seo-audit/index.ts:69-96` — GuideContent type includes gallery field
- `src/lib/seo-audit/index.ts:181-187` — Extracts gallery titles/captions for analysis
- `src/lib/seo-audit/index.ts:323-392` — getGalleryImages() and getAllImages() functions

**Other components referencing gallery:**
- `src/routes/how-to-get-here/_galleries.tsx` — How-to-get-here section galleries
- `src/components/apartment/GallerySection.tsx` — Apartment page gallery (separate feature)
- These are NOT part of guides gallery and should not be touched

### Patterns & Conventions Observed

**Gallery block options:**
- Can provide `items` array directly OR `source` string to load from module/JSON
- Optional `headingKey` for gallery section title
- Optional `zoomable: boolean` for ZoomableImageGallery vs ImageGallery
- Evidence: `src/routes/guides/blocks/types.ts:82-99`

**Gallery item structure:**
- Fields: image, alt/altKey, caption/captionKey, width, height, format, quality, credits
- Zod schema enforces structure
- Evidence: `src/routes/guides/blocks/types.ts:68-80`

**Image resolution:**
1. If `items` provided inline: use directly
2. If `source` provided: check GALLERY_MODULES for .gallery.ts file
3. Fallback: read from translations JSON
- Evidence: `src/routes/guides/blocks/handlers/galleryBlock.tsx:17-112`

**Gallery JSON formats:**
- Array format: `"gallery": [{ src, alt, caption, credits }]`
- Object format: `"gallery": { title, items: [...] }`
- Also supports old format with `primaryAlt`, `primaryCaption`, `secondaryAlt`, `secondaryCaption`
- Evidence: `src/lib/seo-audit/index.ts:69-96`

### Data & Contracts

**Types:**
- `GalleryBlock` (type: "gallery", options: GalleryBlockOptions)
- `GalleryBlockOptions` (items?, source?, contentKey?, headingKey?, zoomable?)
- `GalleryBlockItem` (image, alt/altKey, caption/captionKey, width, height, format, quality)
- `ImageGalleryItem` (src, alt, width?, height?, caption?)
- `ZoomableImageGalleryItem` (src, alt, width?, height?, caption?)

**Schemas:**
- galleryItemSchema (Zod)
- galleryBlockOptionsSchema (Zod)
- GUIDE_BLOCK_DECLARATION_SCHEMA discriminated union includes gallery

**JSON data contracts:**
- Guide content JSON: optional `gallery` field (array or object with items array)
- Gallery .ts modules: export `buildGuideGallery` or `buildGallery` function

### Dependency & Impact Map

**Upstream dependencies:**
- Guide manifest entries (2 guides with gallery blocks)
- Guide content JSON files (29+ guides with gallery data)
- Gallery .ts modules (1 file: positanoBeaches.gallery.ts)
- Image files in /public/img/guides/

**Downstream dependents:**
- Block composition system (composeBlocks.tsx)
- Guide rendering (GuideSeoTemplate, GenericContent)
- SEO audit scoring (counts images, checks captions)
- Dev guidelines panel (displays gallery status)
- Editor UI (GalleryTab)

**Likely blast radius:**
- **High impact:** Guide manifest (2 guide entries), block handlers, components, types
- **Medium impact:** SEO audit (image counting logic changes), dev tools
- **Low impact:** Tests, editor UI (GalleryTab can be deleted)
- **No impact:** Apartment gallery, how-to-get-here galleries (separate systems)

### Tests & Quality Gates

**Existing tests:**
- `src/test/routes/guides/__tests__/gallery-block-zoomable.test.tsx` — Comprehensive tests for zoomable gallery feature (265 lines)
- 26 references to ImageGallery/ZoomableImageGallery/GalleryBlock across test files

**Test coverage:**
- Schema validation for zoomable option
- Rendering behavior (standard vs zoomable)
- Dialog integration for zoomable images
- Heading rendering with headingKey
- Accessibility (keyboard accessible triggers)
- Caption display in tiles and dialog titles

**Gaps:**
- No tests found for gallery fallback logic (module → JSON fallback)
- No tests for gallery data migration

**Commands:**
- `pnpm test` — Run all tests
- `pnpm test gallery` — Run gallery-specific tests
- `pnpm typecheck` — TypeScript validation

### Recent Git History (Targeted)

Gallery-related commits (last checked: 2026-01-30):
- Gallery feature appears to be from TASK-03 (zoomable variant)
- positanoBeaches.gallery.ts last modified 2026-01-30 09:57
- No recent removal or deprecation work visible

## External Research

Not needed — gallery is an internal feature with no external dependencies.

## Questions

### Resolved

**Q: Should gallery images be migrated to all locales simultaneously?**
- A: Yes, one-shot migration for all locales
- Evidence: User requirement "all locales at once"

**Q: Should guides with gallery JSON but no gallery block keep the gallery data?**
- A: No, remove unused gallery data from JSON files
- Evidence: If they never displayed it, the data is unused (29 guides have JSON, only 2 display galleries)

**Q: Should we preserve image credits/attributions?**
- A: Yes, incorporate credits into captions
- Evidence: positanoBeaches gallery items have credits array (e.g., "Photo: Mihael Grmek (CC BY-SA 4.0)")

**Q: What about apartment gallery and how-to-get-here galleries?**
- A: Leave them alone — those are separate systems
- Evidence: Different components (GallerySection.tsx, _galleries.tsx), not part of guides blocks

### Open (User Input Needed)

None — all requirements clarified during intake.

## Confidence Inputs (for /plan-feature)

### Implementation: 85%

**Why:**
- Clear code paths for all gallery-related features
- Well-defined block system with explicit handler/type/schema locations
- Only 2 guides actively use galleries (limited migration scope)

**What's missing for ≥80:**
- ✓ Already at 85%

**What would raise to ≥90:**
- Dry-run image placement for positanoBeaches to validate inline positioning strategy
- Confirm GenericContent.tsx behavior with inline images vs gallery blocks

### Approach: 90%

**Why:**
- Straightforward removal + data migration
- No backwards compatibility needed (one-shot)
- No architectural unknowns

**What's missing for ≥80:**
- ✓ Already at 90%

**What would raise to ≥95:**
- User approval of inline image placement strategy for positanoBeaches (8 images across article)
- Confirmation that unused gallery JSON (27 guides) can be safely deleted

### Impact: 80%

**Why:**
- Blast radius is well-mapped
- Only 2 guides actively use feature
- No external dependencies
- Clear separation from apartment/how-to-get-here galleries

**What's missing for ≥80:**
- ✓ Already at 80%

**What would raise to ≥90:**
- Verify GenericContent doesn't have hidden gallery dependencies
- Confirm SEO audit changes don't affect existing audit scores for non-gallery guides
- Test that removing gallery from GUIDE_BLOCK_TYPES doesn't break guide-manifest validation

## Planning Constraints & Notes

### Must-follow patterns

**Block removal:**
- Remove from GUIDE_BLOCK_TYPES constant
- Remove from discriminated union in types
- Remove from GUIDE_BLOCK_DECLARATION_SCHEMA
- Remove handler from handlers/index.ts exports
- Evidence: Established pattern in blocks/types.ts

**Image migration:**
- Preserve alt text and captions
- Incorporate credits into captions (format: "Caption — Credits")
- Position images near related content
- Use existing inline image support in GenericContent

**JSON cleanup:**
- Remove gallery field from all guide JSON files (29+ files × 18 locales)
- Remove galleryTitle field where present
- Keep seo.image if present (hero image, not gallery)

### Rollout/rollback expectations

**Rollout:**
- One-shot migration (no feature flag)
- Atomic commit with all changes
- Should not break any existing published guides
- Images remain accessible (no file moves needed)

**Rollback:**
- Standard git revert
- Gallery JSON data will be preserved in git history if needed

### Observability expectations

**Validation:**
- TypeScript compilation must pass
- All tests must pass (after removing gallery tests)
- pnpm build must succeed
- Visual QA on positanoBeaches and luggageStoragePositano pages

**Monitoring:**
- No runtime monitoring needed (static content change)
- Manual verification that images display correctly inline

## Suggested Task Seeds (Non-binding)

### Phase 1: Prepare image migration content

1. **Map positanoBeaches images to content sections**
   - Audit positanoBeaches JSON gallery (8 images)
   - Identify appropriate inline placement for each image
   - Draft updated sections with inline images and captions
   - All locales (18 × positanoBeaches.json)

2. **Map luggageStoragePositano gallery data**
   - Check if luggageStoragePositano actually displays images
   - If yes: identify inline placement
   - If no: just remove gallery JSON

### Phase 2: Remove gallery from guide system

3. **Remove gallery block type and schema**
   - Remove "gallery" from GUIDE_BLOCK_TYPES
   - Remove GalleryBlock from GuideBlockDeclaration union
   - Remove gallery schema from GUIDE_BLOCK_DECLARATION_SCHEMA
   - Remove GalleryBlock, GalleryBlockOptions, GalleryBlockItem type exports
   - Remove galleryItemSchema and galleryBlockOptionsSchema

4. **Remove gallery block handler**
   - Delete src/routes/guides/blocks/handlers/galleryBlock.tsx
   - Remove applyGalleryBlock export from handlers/index.ts
   - Update composeBlocks.tsx to remove gallery case

5. **Remove gallery components**
   - Delete src/components/guides/ImageGallery.tsx
   - Delete src/components/guides/ZoomableImageGallery.tsx

6. **Remove gallery from module resolver**
   - Remove GALLERY_CONTEXT from moduleResolver.ts
   - Remove GALLERY_MODULES from moduleResolver.ts

7. **Remove gallery from dev tools**
   - Remove "Media & galleries" section from DiagnosticDetails.tsx (lines 292-314)
   - Update to only show "Hero" status, remove "Gallery" row
   - Delete src/app/[lang]/draft/edit/[guideKey]/tabs/GalleryTab.tsx

8. **Remove gallery from SEO audit**
   - Remove gallery field from GuideContent type
   - Remove getGalleryImages() function
   - Update getAllImages() to only use getSectionImages()
   - Remove gallery title/caption extraction (lines 181-187)

### Phase 3: Migrate gallery images inline

9. **Update positanoBeaches guide (all locales)**
   - Add inline images to sections JSON
   - Remove gallery block from guide-manifest.ts:1477
   - Remove galleryTitle field from JSON
   - Remove gallery array from JSON
   - Delete src/routes/guides/positanoBeaches.gallery.ts
   - Repeat for all 18 locales

10. **Update luggageStoragePositano guide (all locales)**
    - Add inline images if needed
    - Remove gallery block from guide-manifest.ts:675
    - Remove gallery JSON data
    - Repeat for all 18 locales

11. **Clean up unused gallery JSON**
    - Remove gallery field from 27 remaining guide JSON files
    - All locales (27 guides × 18 locales = 486 files)
    - Consider script/bulk operation for efficiency

### Phase 4: Remove tests and validate

12. **Remove gallery tests**
    - Delete src/test/routes/guides/__tests__/gallery-block-zoomable.test.tsx
    - Remove gallery mocks from test utilities
    - Remove ImageGallery/ZoomableImageGallery mocks

13. **Validation**
    - Run `pnpm typecheck` — must pass
    - Run `pnpm test` — must pass
    - Run `pnpm build` — must succeed
    - Visual QA: positanoBeaches page (all images inline)
    - Visual QA: luggageStoragePositano page
    - Verify dev guidelines panel (no gallery section)

## Planning Readiness

**Status:** Ready-for-planning

**Blocking items:** None

**Recommended next step:** Proceed to `/plan-feature` to create atomic tasks with confidence assessments.

**Notes:**
- High confidence scores (Implementation: 85%, Approach: 90%, Impact: 80%)
- Clear scope and well-mapped dependencies
- Main work is bulk JSON cleanup (29 guides × 18 locales for gallery removal, 2 guides × 18 locales for image migration)
- Consider scripting the JSON cleanup to reduce manual work and errors
