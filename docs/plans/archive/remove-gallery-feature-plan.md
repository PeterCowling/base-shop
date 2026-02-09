---
Type: Plan
Last-reviewed: 2026-02-05
Status: Complete
Domain: CMS
Relates-to charter: none
Created: 2026-01-30
Last-updated: 2026-01-30
Feature-Slug: remove-gallery-feature
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Remove Gallery Feature Plan


## Active tasks

No active tasks at this time.

## Summary

Remove the gallery block feature from the guides system completely. Gallery images from the 2 guides currently displaying galleries (`positanoBeaches` and `luggageStoragePositano`) will be migrated inline into guide sections using the existing `section.images` array support. All gallery-related code (block handlers, components, types, schemas, dev tools, SEO audit logic) will be removed. Gallery JSON data from 29 guide files across 18 locales will be cleaned up.

## Goals

- Remove all gallery-related code from guides system
- Migrate gallery images inline for 2 active galleries (positanoBeaches with 8 images, luggageStoragePositano)
- Remove gallery validation from SEO audit
- Remove gallery section from dev guidelines panel
- Clean up gallery JSON from 29 guide files × 18 locales

## Non-goals

- Keeping gallery as deprecated/hidden feature
- Creating new generic image block system
- Migrating images for guides with unused gallery JSON (just delete the data)

## Constraints & Assumptions

**Constraints:**
- Must preserve all gallery images (no data loss)
- Must maintain image attribution/credits in captions
- One-shot migration (no feature flag)
- All locales updated simultaneously

**Assumptions:**
- Inline images (section.images array) work identically to gallery for display purposes
- Guides with gallery JSON but no gallery block never displayed those images (safe to delete)
- No external dependencies on gallery API

## Fact-Find Reference

- Related brief: `docs/plans/remove-gallery-feature-fact-find.md`
- Key findings:
  - Only 2 of 29 guides with gallery JSON actually display galleries
  - Inline images already supported via `section.images` array (evidence: positanoMainBeach.json, fornilloBeachGuide.json)
  - GenericContent.tsx already renders section.images using ImageGallery component (line 283)
  - Gallery tests pass (11/11 tests) — no extinct tests found

## Existing System Notes

**Key modules/files:**
- `src/routes/guides/blocks/handlers/galleryBlock.tsx` — Gallery block handler
- `src/routes/guides/blocks/composeBlocks.tsx:87` — Gallery case in block composition switch
- `src/routes/guides/blocks/types.ts` — 6 gallery-related type/schema locations
- `src/components/guides/ImageGallery.tsx` — Grid gallery component (also used by section.images)
- `src/components/guides/ZoomableImageGallery.tsx` — Zoomable variant
- `src/lib/seo-audit/index.ts` — Gallery image extraction and counting
- `src/routes/guides/guide-seo/components/DiagnosticDetails.tsx:292-314` — Dev guidelines panel

**Patterns to follow:**
- Block removal: Remove from GUIDE_BLOCK_TYPES, discriminated union, schema, handler export (established pattern in blocks/types.ts)
- Inline image format: `section.images: [{ src, alt, caption }]` (evidence: positanoMainBeach.json)
- Credit attribution: Append to caption as "Caption — Credit" (evidence: positanoBeaches gallery has credits array)

## Proposed Approach

**Single-pass removal with inline migration:**

1. **Content migration first** — Convert gallery data to inline section images for the 2 active guides, preserving all metadata (alt, caption, credits)
2. **Code removal** — Remove gallery block system (handlers, types, schemas, components)
3. **Dev tools cleanup** — Remove from SEO audit, guidelines panel, editor UI
4. **Bulk JSON cleanup** — Remove unused gallery data from 29 guides × 18 locales
5. **Test cleanup** — Remove gallery tests, verify no regressions

**Why this order:** Content migration first ensures we don't lose data if validation fails. Code removal second allows TypeScript to catch any missed references. Bulk cleanup last because it's low-risk once the feature is gone.

**Alternative considered:** Phased removal with feature flag — Rejected because this is a one-shot migration with no rollback requirement and no external dependencies.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Migrate positanoBeaches gallery to inline images (EN) | 90% | M | Pending | - |
| TASK-02 | IMPLEMENT | Check luggageStoragePositano gallery usage | 85% | S | Pending | - |
| TASK-03 | IMPLEMENT | Remove gallery block type and schema | 92% | S | Pending | TASK-01, TASK-02 |
| TASK-04 | IMPLEMENT | Remove gallery block handler | 95% | S | Pending | TASK-03 |
| TASK-05 | IMPLEMENT | Remove gallery components | 90% | S | Pending | TASK-04 |
| TASK-06 | IMPLEMENT | Remove gallery from module resolver | 92% | S | Pending | TASK-04 |
| TASK-07 | IMPLEMENT | Remove gallery from dev tools | 88% | M | Pending | TASK-03 |
| TASK-08 | IMPLEMENT | Remove gallery from SEO audit | 85% | M | Pending | TASK-03 |
| TASK-09 | IMPLEMENT | Propagate positanoBeaches to all locales | 88% | M | Pending | TASK-01 |
| TASK-10 | IMPLEMENT | Bulk remove unused gallery JSON | 90% | M | Pending | TASK-05 |
| TASK-11 | IMPLEMENT | Remove gallery tests | 92% | S | Pending | TASK-05 |
| TASK-12 | IMPLEMENT | Final validation and visual QA | 85% | M | Pending | TASK-11 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Migrate positanoBeaches gallery to inline images (EN)

- **Type:** IMPLEMENT
- **Affects:**
  - `src/locales/en/guides/content/positanoBeaches.json`
  - `src/routes/guides/guide-manifest.ts` (remove gallery block at line 1477)
  - `src/routes/guides/positanoBeaches.gallery.ts` (delete file)
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — Inline images already work (evidence: positanoMainBeach.json has section.images, GenericContent.tsx:283 renders them)
  - Approach: 90% — Straightforward data transformation, credits append to caption per fact-find pattern
  - Impact: 88% — Isolated to positanoBeaches, gallery removal in manifest is low-risk
- **Acceptance:**
  - All 8 gallery images moved to appropriate section.images arrays
  - Credits appended to captions (format: "Caption — Photo: Author (License)")
  - galleryTitle field removed from JSON
  - gallery array removed from JSON
  - Gallery block removed from guide-manifest.ts
  - positanoBeaches.gallery.ts deleted
  - Images positioned near related content (e.g., Fornillo image in Positano beaches section)
- **Test plan:**
  - Visual verification: Load http://localhost:3012/en/experiences/positano-beaches
  - Verify all 8 images render inline within sections
  - Verify captions include credits
  - Run `pnpm typecheck` — must pass
- **Planning validation:**
  - Tests run: `pnpm test gallery-block-zoomable` — 11/11 passed (no extinct tests)
  - Verified inline image rendering in GenericContent.tsx:283 uses same ImageGallery component
  - Examined positanoBeaches.json gallery structure (lines 215-264)
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 90%
  - To reach 95%: Dry-run manual placement of all 8 images to validate logical positioning
- **Rollout / rollback:**
  - Rollout: Direct commit, atomic JSON change
  - Rollback: Git revert, gallery data preserved in history
- **Documentation impact:**
  - None (content-only change)
- **Notes / references:**
  - Pattern: positanoMainBeach.json lines 74-88 (section.images example)
  - Credits format: positanoBeaches.json line 220 (credits array)

### TASK-02: Check luggageStoragePositano gallery usage

- **Type:** IMPLEMENT
- **Affects:**
  - `src/locales/en/guides/content/luggageStorage.json`
  - `src/routes/guides/guide-manifest.ts` (gallery block at line 675)
- **Depends on:** -
- **Confidence:** 85%
  - Implementation: 85% — Gallery data exists (primaryAlt, primaryCaption format) but no .gallery.ts module, unclear if actually displays
  - Approach: 90% — If displays: migrate inline; if not: just remove block
  - Impact: 80% — Need to verify runtime behavior before deciding
- **Acceptance:**
  - Verify if gallery renders on http://localhost:3012/en/how-to-get-here/luggage-storage-positano
  - If yes: migrate gallery data to inline section images
  - If no: just remove gallery block from manifest and gallery JSON from file
- **Test plan:**
  - Visual check: Load luggage storage page in dev
  - If migrating: verify images render inline
  - Run `pnpm typecheck` after changes
- **Planning validation:**
  - Tests run: Reviewed luggageStorage.json:46-51 (old-format gallery with primaryAlt/Caption)
  - No .gallery.ts module exists for luggage-storage-positano
  - galleryBlock handler fallback reads from JSON (lines 73-110)
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: Gallery uses old primaryAlt/primaryCaption format (may not render)
- **What would make this ≥90%:**
  - Visual confirmation that gallery either renders or doesn't (eliminates uncertainty)
- **Rollout / rollback:**
  - Rollout: Direct commit
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - galleryBlock.tsx:73-110 — JSON fallback logic
  - luggageStorage.json:46-51 — Old gallery format

### TASK-03: Remove gallery block type and schema

- **Type:** IMPLEMENT
- **Affects:**
  - `src/routes/guides/blocks/types.ts`
- **Depends on:** TASK-01, TASK-02
- **Confidence:** 92%
  - Implementation: 95% — Direct removal from well-defined locations (lines 13, 68-99, 208-209, 237-240, 301, 327-330)
  - Approach: 92% — Established block removal pattern, TypeScript will catch missing references
  - Impact: 90% — No gallery blocks remain in manifest after TASK-01/02, safe to remove type
- **Acceptance:**
  - Remove "gallery" from GUIDE_BLOCK_TYPES array (line 13)
  - Remove galleryItemSchema (lines 68-80)
  - Remove galleryBlockOptionsSchema (lines 82-99)
  - Remove GalleryBlockOptions and GalleryBlockItem type exports (lines 208-209)
  - Remove GalleryBlock type definition (lines 237-240)
  - Remove GalleryBlock from GuideBlockDeclaration union (line 301)
  - Remove gallery schema from GUIDE_BLOCK_DECLARATION_SCHEMA (lines 327-330)
  - TypeScript compilation passes
- **Test plan:**
  - Run `pnpm typecheck` — must pass with no gallery references
  - Expected: Errors in composeBlocks.tsx, galleryBlock.tsx (to be fixed in TASK-04)
- **Planning validation:**
  - Tests run: Verified block types structure and schema locations
  - Confirmed pattern: faq/callout/table blocks follow same structure
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 92%
- **Rollout / rollback:**
  - Rollout: Direct commit after TASK-01/02 complete
  - Rollback: Git revert
- **Documentation impact:**
  - None (internal types)
- **Notes / references:**
  - Pattern: Similar to removing any block type from discriminated union
  - Evidence: blocks/types.ts lines 9-25 (GUIDE_BLOCK_TYPES constant)

### TASK-04: Remove gallery block handler

- **Type:** IMPLEMENT
- **Affects:**
  - `src/routes/guides/blocks/handlers/galleryBlock.tsx` (delete)
  - `src/routes/guides/blocks/handlers/index.ts` (remove applyGalleryBlock export at line 9)
  - `src/routes/guides/blocks/composeBlocks.tsx` (remove gallery case at lines 87-89)
- **Depends on:** TASK-03
- **Confidence:** 95%
  - Implementation: 98% — Simple file deletion + 2-line removals
  - Approach: 95% — Handler only called from composeBlocks.tsx:87, no other references
  - Impact: 92% — TypeScript will catch any missed call sites
- **Acceptance:**
  - Delete galleryBlock.tsx file
  - Remove applyGalleryBlock from handlers/index.ts exports
  - Remove case "gallery" block from composeBlocks.tsx switch statement
  - No TypeScript errors referencing applyGalleryBlock or gallery handler
- **Test plan:**
  - Run `pnpm typecheck` — must pass
  - Grep for `applyGalleryBlock` — should find no references
  - Grep for `case "gallery"` in composeBlocks.tsx — should find no results
- **Planning validation:**
  - Tests run: Verified composeBlocks.tsx:87 is only call site
  - Grep for applyGalleryBlock: Only found in handlers/index.ts export and composeBlocks.tsx import
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 95%
- **Rollout / rollback:**
  - Rollout: Direct commit after TASK-03
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - composeBlocks.tsx:87-89 — Gallery case in switch

### TASK-05: Remove gallery components

- **Type:** IMPLEMENT
- **Affects:**
  - `src/components/guides/ImageGallery.tsx` (delete)
  - `src/components/guides/ZoomableImageGallery.tsx` (delete)
- **Depends on:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% — File deletion
  - Approach: 90% — Components used by galleryBlock handler (removed in TASK-04) AND by GenericContent for section.images
  - Impact: 88% — Must verify GenericContent still works after removal (it imports ImageGallery at line 22)
- **Acceptance:**
  - WAIT — ImageGallery.tsx is used by GenericContent.tsx for section.images (line 283)
  - DO NOT delete ImageGallery.tsx (still needed for inline images)
  - DELETE only ZoomableImageGallery.tsx (only used by gallery blocks)
  - Remove unused zoomable import from GenericContent.tsx if present
  - TypeScript compilation passes
  - Section images still render correctly
- **Test plan:**
  - Run `pnpm typecheck` — must pass
  - Grep for ZoomableImageGallery imports — should find no results
  - Visual check: positanoMainBeach page section images render correctly
- **Planning validation:**
  - Tests run: Examined GenericContent.tsx:22 (imports ImageGallery), line 283 (uses for section.images)
  - grep for ZoomableImageGallery: Only found in galleryBlock.tsx and test file
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: **CRITICAL** — ImageGallery.tsx is shared between gallery blocks and section.images, cannot be deleted
- **What would make this ≥90%:**
  - Already at 90%
  - To reach 95%: Verify no other components import ZoomableImageGallery
- **Rollout / rollback:**
  - Rollout: Direct commit, delete ZoomableImageGallery.tsx only
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - GenericContent.tsx:22, 283 — ImageGallery used for section.images
  - galleryBlock.tsx:144 — Conditional use of ZoomableImageGallery

### TASK-06: Remove gallery from module resolver

- **Type:** IMPLEMENT
- **Affects:**
  - `src/routes/guides/blocks/utils/moduleResolver.ts`
- **Depends on:** TASK-04
- **Confidence:** 92%
  - Implementation: 95% — Remove GALLERY_CONTEXT and GALLERY_MODULES (lines 39-44)
  - Approach: 92% — Only used by galleryBlock handler (removed in TASK-04)
  - Impact: 90% — TypeScript will catch references
- **Acceptance:**
  - Remove GALLERY_CONTEXT export and definition (lines 39-41)
  - Remove GALLERY_MODULES export and definition (lines 43-44)
  - TypeScript compilation passes
  - No references to GALLERY_CONTEXT or GALLERY_MODULES remain
- **Test plan:**
  - Run `pnpm typecheck` — must pass
  - Grep for GALLERY_MODULES — should find no references
  - Grep for GALLERY_CONTEXT — should find no references
- **Planning validation:**
  - Tests run: Verified moduleResolver.ts:39-44 exports
  - Grep for GALLERY_MODULES: Only found in galleryBlock.tsx (to be deleted)
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 92%
- **Rollout / rollback:**
  - Rollout: Direct commit
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - galleryBlock.tsx:36-44 — Only usage of GALLERY_MODULES

### TASK-07: Remove gallery from dev tools

- **Type:** IMPLEMENT
- **Affects:**
  - `src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`
  - `src/app/[lang]/draft/edit/[guideKey]/tabs/GalleryTab.tsx` (delete)
- **Depends on:** TASK-03
- **Confidence:** 88%
  - Implementation: 90% — Remove lines 292-314 from DiagnosticDetails, delete GalleryTab
  - Approach: 88% — Must verify GalleryTab is imported/routed somewhere (editor tabs)
  - Impact: 85% — Need to check if tab removal requires route/navigation updates
- **Acceptance:**
  - Remove "Media & galleries" section from DiagnosticDetails.tsx (lines 292-314)
  - Update to show only "Hero" status in media section
  - Delete GalleryTab.tsx file
  - Remove GalleryTab import/reference from editor tabs routing if present
  - Dev guidelines panel no longer shows gallery status
  - Editor UI no longer has gallery tab
- **Test plan:**
  - Visual check: Load guide in dev mode, verify guidelines panel has no gallery section
  - Visual check: Load editor UI, verify no gallery tab
  - Run `pnpm typecheck` — must pass
- **Planning validation:**
  - Tests run: Read DiagnosticDetails.tsx:292-314 (gallery status rendering)
  - Checked for GalleryTab imports: Need to find editor tabs index
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: Need to verify tab routing structure
- **What would make this ≥90%:**
  - Verify how editor tabs are wired (find tabs index/router)
  - Confirm GalleryTab removal won't break tab navigation
- **Rollout / rollback:**
  - Rollout: Direct commit
  - Rollback: Git revert
- **Documentation impact:**
  - None (dev tool UI only)
- **Notes / references:**
  - DiagnosticDetails.tsx:292-314 — Gallery status display

### TASK-08: Remove gallery from SEO audit

- **Type:** IMPLEMENT
- **Affects:**
  - `src/lib/seo-audit/index.ts`
- **Depends on:** TASK-03
- **Confidence:** 85%
  - Implementation: 88% — Remove gallery field from GuideContent type, remove getGalleryImages(), update getAllImages()
  - Approach: 85% — Must verify removing gallery images won't affect audit scores for existing guides
  - Impact: 82% — getAllImages() feeds into image count scoring; need to verify section.images coverage
- **Acceptance:**
  - Remove gallery field from GuideContent type (lines 69-96)
  - Remove getGalleryImages() function (lines 323-367)
  - Update getAllImages() to only call getSectionImages() (line 395)
  - Remove gallery title/caption extraction (lines 181-187)
  - Audit tests pass
  - Guides with section.images maintain correct image counts
- **Test plan:**
  - Run `pnpm test seo-audit` — must pass
  - Verify positanoBeaches audit after migration counts 8 images from section.images
  - Run audit on guide with only section.images (e.g., positanoMainBeach) — score unchanged
- **Planning validation:**
  - Tests run: Examined SEO audit structure (lines 69-400)
  - Verified getSectionImages() extracts from section.images array (lines 370-392)
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: Need to verify guides migrated from gallery to section.images maintain image counts
- **What would make this ≥90%:**
  - Run audit on positanoBeaches before and after migration to confirm image count preservation
  - Verify no guides have gallery-only images (all migrated to sections)
- **Rollout / rollback:**
  - Rollout: Direct commit after content migration
  - Rollback: Git revert
- **Documentation impact:**
  - None (internal audit logic)
- **Notes / references:**
  - index.ts:395 — getAllImages() combines section and gallery images
  - index.ts:370-392 — getSectionImages() implementation

### TASK-09: Propagate positanoBeaches to all locales

- **Type:** IMPLEMENT
- **Affects:**
  - 17 locale files: `src/locales/{locale}/guides/content/positanoBeaches.json` (ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh)
- **Depends on:** TASK-01
- **Confidence:** 88%
  - Implementation: 90% — Straightforward JSON transformation, same structure as EN
  - Approach: 90% — Use EN as source of truth for image placement, localize only captions/credits if present
  - Impact: 85% — Bulk change across 17 files, risk of copy-paste errors
- **Acceptance:**
  - All 17 non-EN locales have gallery array removed
  - All 17 non-EN locales have galleryTitle removed
  - All 17 non-EN locales have 8 images added to section.images (same positioning as EN)
  - Image src, alt, caption translated where translations exist
  - If locale has no translated caption, use EN caption
  - Credits preserved from EN (not translated)
- **Test plan:**
  - Spot-check 3 locales: de, it, ja
  - Verify images render on /{locale}/experiences/positano-beaches
  - Run `pnpm typecheck` — must pass
  - Run `pnpm build` — must succeed (validates all locales)
- **Planning validation:**
  - Tests run: Examined positanoBeaches.json structure across locales
  - Verified locale pattern: Most have gallery array, some have translations
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: May need to script this to avoid manual errors
- **What would make this ≥90%:**
  - Create script to automate locale propagation (reduces error risk)
  - Already at 88%
- **Rollout / rollback:**
  - Rollout: Direct commit after TASK-01 validated
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - Pattern: EN positanoBeaches.json (definitive structure)

### TASK-10: Bulk remove unused gallery JSON

- **Type:** IMPLEMENT
- **Affects:**
  - 27 guide files × 18 locales = 486 JSON files
  - Guides: hostelBriketteToFornilloBeach, luggageStorage, arienzoBeachBusBack, sunriseHike, boatTours, cuisineAmalfiGuide, pathOfTheGods, sunsetViewpoints, workCafes, ferryDockToBrikette, capriPositanoFerry, limoncelloCuisine, positanoBudget, positanoToNaplesDirectionsByFerry, amalfiPositanoBus, chiesaNuovaDepartures, topOfTheMountainHike, positanoTravelGuide, marinaDiPraiaBeaches, positanoNaplesCenterFerry, lauritoBeachGuide, porterServices, groceriesPharmacies, positanoCapriFerry, naplesPositano, cheapEats, arienzoBeachClub, luminariaPraiano
- **Depends on:** TASK-05
- **Confidence:** 90%
  - Implementation: 92% — Remove gallery field from JSON (simple deletion)
  - Approach: 95% — Script-based bulk operation to minimize errors
  - Impact: 85% — Large file count, but low-risk (unused data)
- **Acceptance:**
  - All 27 guides have gallery field removed from all 18 locales
  - galleryTitle field removed where present
  - seo.image preserved (not gallery-related)
  - Script validates JSON syntax after changes
  - TypeScript compilation passes
- **Test plan:**
  - Run script with dry-run mode first
  - Verify sample output correctness
  - Run full script
  - Run `pnpm typecheck` — must pass
  - Run `pnpm build` — must succeed
  - Spot-check 5 random guide files for correct removal
- **Planning validation:**
  - Tests run: Listed 29 EN guides with gallery JSON (fact-find)
  - Verified none have gallery blocks in manifest (except positanoBeaches, luggageStorage)
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 90%
- **Rollout / rollback:**
  - Rollout: Script execution, atomic commit
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - Script pattern: Read JSON, delete field, write JSON with validation

### TASK-11: Remove gallery tests

- **Type:** IMPLEMENT
- **Affects:**
  - `src/test/routes/guides/__tests__/gallery-block-zoomable.test.tsx` (delete)
  - Test utilities: Remove gallery mocks if present
- **Depends on:** TASK-05
- **Confidence:** 92%
  - Implementation: 95% — File deletion + mock cleanup
  - Approach: 92% — Tests only cover removed feature
  - Impact: 90% — No test dependencies on gallery tests
- **Acceptance:**
  - Delete gallery-block-zoomable.test.tsx
  - Remove ImageGallery mocks from test utilities if gallery-specific
  - Remove ZoomableImageGallery mocks completely
  - All remaining tests pass
  - No references to deleted test file
- **Test plan:**
  - Run `pnpm test` — all tests pass
  - Grep for gallery-block-zoomable — should find no references
  - Verify test count decreased by 11 tests
- **Planning validation:**
  - Tests run: `pnpm test gallery-block-zoomable` — 11/11 passed
  - Verified no other tests import from gallery-block-zoomable.test.tsx
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 92%
- **Rollout / rollback:**
  - Rollout: Direct commit
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - gallery-block-zoomable.test.tsx — 265 lines, 11 tests

### TASK-12: Final validation and visual QA

- **Type:** IMPLEMENT
- **Affects:**
  - All changed files (validation only)
- **Depends on:** TASK-11
- **Confidence:** 85%
  - Implementation: 90% — Standard validation procedures
  - Approach: 85% — Visual QA subjective, depends on image placement decisions
  - Impact: 80% — Final gate before completion
- **Acceptance:**
  - Run `pnpm typecheck` — must pass with zero errors
  - Run `pnpm test` — all tests pass
  - Run `pnpm build` — build succeeds
  - Visual QA: http://localhost:3012/en/experiences/positano-beaches — all 8 images render inline
  - Visual QA: http://localhost:3012/en/how-to-get-here/luggage-storage-positano — no gallery errors
  - Visual QA: Dev guidelines panel has no gallery section
  - Grep codebase for "gallery" — only apartment/how-to-get-here galleries remain
  - No TypeScript errors mentioning gallery/Gallery
- **Test plan:**
  - Checklist execution (see acceptance criteria)
  - Manual browser testing on 2 migrated guides
  - Dev guidelines panel verification
- **Planning validation:**
  - Tests run: N/A (validation task)
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: N/A
- **What would make this ≥90%:**
  - Additional QA on 3+ locales beyond EN
  - Lighthouse audit to verify no image loading issues
- **Rollout / rollback:**
  - Rollout: Final commit after all validation passes
  - Rollback: Git revert entire feature branch
- **Documentation impact:**
  - None (unless validation reveals need for migration notes)
- **Notes / references:**
  - Validation checklist based on fact-find acceptance criteria

## Risks & Mitigations

- **Risk:** Image placement in positanoBeaches sections may not match user's intent for "near related content"
  - **Mitigation:** Review image captions for context clues; place images in sections that mention the location/topic in the image

- **Risk:** Bulk JSON cleanup script could corrupt files if not carefully written
  - **Mitigation:** Dry-run mode, JSON validation after each change, atomic commit for easy rollback

- **Risk:** ImageGallery component removal could break section.images rendering
  - **Mitigation:** TASK-05 updated to preserve ImageGallery.tsx, only delete ZoomableImageGallery.tsx

- **Risk:** SEO audit scores may change after gallery → section images migration
  - **Mitigation:** TASK-08 includes before/after audit comparison, verify image counts preserved

## Observability

**Logging:**
- No new logging needed (static content removal)

**Metrics:**
- No metrics needed

**Alerts/Dashboards:**
- N/A

**Manual verification:**
- Visual QA on migrated guide pages
- Dev guidelines panel inspection
- Grep for remaining "gallery" references

## Acceptance Criteria (overall)

- [ ] positanoBeaches displays 8 inline images with credits
- [ ] luggageStoragePositano has no gallery block
- [ ] Gallery block type removed from types.ts
- [ ] Gallery handler and components removed (except ImageGallery.tsx preserved)
- [ ] SEO audit no longer references gallery
- [ ] Dev guidelines panel has no gallery section
- [ ] All 29 guides × 18 locales have gallery JSON removed
- [ ] All tests pass (gallery tests deleted)
- [ ] TypeScript compilation passes
- [ ] Build succeeds
- [ ] No regressions (section.images still work)

## Decision Log

- 2026-01-30: Preserve ImageGallery.tsx component — used by both gallery blocks (removed) and section.images (retained). Only delete ZoomableImageGallery.tsx.
- 2026-01-30: Script-based bulk JSON cleanup for 486 files to minimize manual errors.
