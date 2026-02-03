---
Type: Plan
Status: Complete
Domain: CMS
Relates-to charter: Content unification
Created: 2026-01-26
Last-reviewed: 2026-01-26
Last-updated: 2026-01-26
Completed: 2026-01-26
Overall-confidence: 100%
---

# Article Helpers to Guide Helpers Migration Plan

## Summary

Migrate components that use legacy article helpers (`ARTICLE_KEYS`, `articleSlug`, `HelpArticleKey`, `ARTICLE_SLUGS`) to use guide helpers instead (`GUIDE_KEYS`, `guideSlug`, `GuideKey`). This completes the content unification by removing the dual-system overhead.

## Success Signals (What “Good” Looks Like)

- No runtime references remain to `apps/brikette/src/routes.assistance-helpers.ts` or `apps/brikette/src/article-slug-map.ts` (files deleted, no imports).
- SEO alternates/hreflang for assistance pages still translate correctly across locales.
- Assistance navigation (desktop + mobile), footer links, and language switching work for:
  - `/[lang]/assistance` index page
  - `/[lang]/assistance/<help-centre-guide-slug>` guide pages
- URL inventory generation no longer counts “articles” separately; assistance guide URLs are covered via guide helpers.

## Prerequisite Completed

The "Help Articles to Guides Conversion" plan established **slug parity**: all article slugs match guide slugs via `GUIDE_SLUG_OVERRIDES`. This means URLs remain unchanged after migration.

## Audit Updates (2026-01-26)

Call sites the migration must cover (beyond the obvious UI components):

- `apps/brikette/src/utils/seo.ts` builds a reverse lookup for assistance article slugs using `ARTICLE_SLUGS`.
- `apps/brikette/src/routing/routeInventory.ts` enumerates assistance URLs using `ARTICLE_KEYS` (and URL fixtures depend on this).
- `apps/brikette/src/types/loaderSchemas.ts` derives a Zod enum from `ARTICLE_SLUGS` and references a translation string that mentions `ARTICLE_SLUGS`.
- `apps/brikette/src/components/AGENTS.md` instructs contributors to update `@/routes.assistance-helpers` when adding assistance articles.

## Approach

Since slugs are identical between systems, much of the migration is mechanical:
- Replace `HelpArticleKey` with `GuideKey`
- Replace `articleSlug(lang, key)` with `guideSlug(lang, key)`

But there are two non-mechanical requirements to keep risk low:

- Keep “help centre” enumeration stable (nav/footer/language switch need the same 12 keys consistently).
- Preserve test/mock resilience (the repo already uses namespace imports for modules that tests partially mock).

## Migration Strategy

Establish a single canonical “help-centre policy guide keys” list for enumeration use-cases:

- Canonical content source remains `apps/brikette/src/data/assistance.tags.ts` (it already maps the 12 keys to tags).
- Add a helper that exports a typed, validated list for use by nav/footer/language switching:
  - `ASSISTANCE_GUIDE_KEYS: readonly GuideKey[]`
  - `isAssistanceGuideKey(value: string): value is GuideKey`

## Files to Migrate

| File | Complexity | Dependencies |
|------|------------|--------------|
| assistance.tags.ts | Low | None |
| quick-links-section/types.ts | Low | None |
| TravelHelpStructuredData.tsx | Low | None |
| Footer.tsx | Medium | None |
| quick-links-section/useQuickLinks.ts | Medium | types.ts |
| quick-links-section/normalise.ts | Medium | types.ts |
| routing/routeInventory.ts | Medium | None |
| test/utils/seo.test.ts | Medium | seo.ts |
| HelpCentreNav.tsx | High | assistance.tags.ts |
| HelpCentreMobileNav.tsx | High | HelpCentreNav.tsx |
| LanguageModal.tsx | High | HelpCentreNav.tsx, seo.ts |
| seo.ts | Very High | None |
| types/loaderSchemas.ts | Medium | i18nConfig |
| components/AGENTS.md | Low | Docs only |

## Tasks

### TASK-01: Create assistance guide keys helper

- **Affects:** `apps/brikette/src/data/assistanceGuideKeys.ts` (new)
- **CI:** 91%
  - Implementation: 92% — derive the list from `ASSISTANCE_TAGS` keys and validate against the guide key set.
  - Approach: 90% — keeps enumeration stable without relying on broad `GUIDES_INDEX` filters.
  - Impact: 90% — additive and low risk.
- **Acceptance:**
  - Export `ASSISTANCE_GUIDE_KEYS: readonly GuideKey[]` containing exactly the 12 converted assistance policy guides
  - Export `isAssistanceGuideKey(value: string): value is GuideKey`
  - Unit test asserts list is stable + non-empty

### TASK-02: Migrate assistance.tags.ts

- **Affects:** `apps/brikette/src/data/assistance.tags.ts`
- **CI:** 95%
  - Implementation: 95% — simple type change
  - Approach: 95% — direct replacement
  - Impact: 95% — only used by navigation components
- **Acceptance:**
  - Change `HelpArticleKey` → `GuideKey`
  - Update import from `@/routes.assistance-helpers` → `@/routes.guides-helpers`
  - TypeScript compiles

### TASK-03: Migrate quick-links-section/types.ts

- **Affects:** `apps/brikette/src/components/assistance/quick-links-section/types.ts`
- **CI:** 95%
  - Implementation: 95% — type-only change
  - Approach: 95% — direct replacement
  - Impact: 95% — affects only quick-links consumers
- **Acceptance:**
  - Change `HelpArticleKey` → `GuideKey`
  - Update import

### TASK-04: Migrate quick-links-section/normalise.ts

- **Affects:** `apps/brikette/src/components/assistance/quick-links-section/normalise.ts`
- **CI:** 90%
  - Implementation: 90% — replace Set construction with ASSISTANCE_GUIDE_KEYS
  - Approach: 90% — uses new helper from TASK-01
  - Impact: 90% — only affects quick-links validation
- **Acceptance:**
  - Import `ASSISTANCE_GUIDE_KEYS` and `GuideKey`
  - Replace `HELP_KEY_SET` with `ASSISTANCE_GUIDE_KEY_SET`
  - TypeScript compiles

### TASK-05: Migrate quick-links-section/useQuickLinks.ts

- **Affects:** `apps/brikette/src/components/assistance/quick-links-section/useQuickLinks.ts`
- **CI:** 90%
  - Implementation: 92% — replace `articleSlug` with `guideSlug`
  - Approach: 90% — direct function replacement
  - Impact: 90% — affects quick-links href generation
- **Acceptance:**
  - Import `guideSlug` from `@/routes.guides-helpers`
  - Replace `articleSlug(sourceLang, item.slug)` → `guideSlug(sourceLang, item.slug)`
  - Quick links continue to work (manual verification)

### TASK-06: Migrate TravelHelpStructuredData.tsx

- **Affects:** `apps/brikette/src/components/seo/TravelHelpStructuredData.tsx`
- **CI:** 95%
  - Implementation: 95% — single function replacement
  - Approach: 95% — direct replacement
  - Impact: 95% — only affects this SEO component
- **Acceptance:**
  - Import `guideSlug` from `@/routes.guides-helpers`
  - Replace `articleSlug(lang, "travelHelp")` → `guideSlug(lang, "travelHelp")`
  - TypeScript compiles

### TASK-07: Migrate Footer.tsx

- **Affects:** `apps/brikette/src/components/footer/Footer.tsx`
- **CI:** 90%
  - Implementation: 92% — replace three `articleSlug` calls
  - Approach: 90% — direct replacement
  - Impact: 90% — affects footer navigation links
- **Acceptance:**
  - Import `guideSlug` from `@/routes.guides-helpers`
  - Replace all `articleSlug(lang, key)` → `guideSlug(lang, key as GuideKey)`
  - Footer links still work (manual verification)

### TASK-08: Migrate routeInventory.ts (RE-PLANNED)

- **Affects:** `apps/brikette/src/routing/routeInventory.ts`
- **Previous CI:** 90% ⚠️
- **Updated CI:** 92%
  - Implementation: 92% — replace `ARTICLE_KEYS` with `ASSISTANCE_GUIDE_KEYS` and `articleSlug` with `guideSlug`
  - Approach: 92% — keep separate assistance enumeration (guides are in draft status, won't appear via `publishedGuides`)
  - Impact: 92% — URL inventory unchanged, just different helpers
- **Resolution:**
  - Investigated: `guides.index.ts` shows all 12 assistance guides have `status: "draft"`
  - Decision: Keep separate enumeration for assistance URLs since draft guides aren't in `publishedGuides` filter
  - Evidence: Lines 14-25 of guides.index.ts show `status: "draft"` for all 12 converted articles
- **Acceptance:**
  - Replace `ARTICLE_KEYS` import with `ASSISTANCE_GUIDE_KEYS` from `@/data/assistanceGuideKeys`
  - Replace `articleSlug` import with `guideSlug` from `@/routes.guides-helpers`
  - Keep the assistance URL enumeration block (lines 91-96) but use guide helpers
  - URL count for "assistance" stays at 12 × langCount
  - TypeScript compiles
  - Regenerate URL fixtures: `pnpm --filter @apps/brikette generate:url-fixtures`

### TASK-09: Migrate HelpCentreNav.tsx

- **Affects:** `apps/brikette/src/components/assistance/HelpCentreNav.tsx`
- **CI:** 90%
  - Implementation: 90% — replace key list + slug function with guide equivalents while preserving mock-resilience.
  - Approach: 90% — keep the defensive “namespace import” pattern, but point it at the consolidated guide slugs module (`@/guides/slugs`) used elsewhere.
  - Impact: 90% — affects desktop navigation, re-export used by LanguageModal.
- **Acceptance:**
  - Import `GuideKey`, `guideSlug` from guide helpers
  - Import `ASSISTANCE_GUIDE_KEYS` from new helper
  - Replace `HelpArticleKey` → `GuideKey` throughout
  - Replace defensive namespace import with a resilient guide slugs import (`@/guides/slugs`) if needed
  - Update ICONS record type
  - Re-export `ASSISTANCE_GUIDE_KEYS` instead of `HELP_ARTICLE_KEYS`
  - Desktop nav renders correctly (manual verification)

### TASK-10: Migrate HelpCentreMobileNav.tsx

- **Affects:** `apps/brikette/src/components/assistance/HelpCentreMobileNav.tsx`
- **CI:** 90%
  - Implementation: 90% — mirror HelpCentreNav changes with the same helper list.
  - Approach: 90% — keep translation fallback behavior unchanged.
  - Impact: 90% — affects mobile navigation.
- **Acceptance:**
  - Import `GuideKey`, `guideSlug` from guide helpers
  - Import `ASSISTANCE_GUIDE_KEYS` from new helper
  - Replace defensive namespace import with resilient guide slugs import if needed
  - Mobile nav renders correctly (manual verification)

### TASK-11: Migrate seo.ts

- **Affects:** `apps/brikette/src/utils/seo.ts`
- **CI:** 90%
  - Implementation: 90% — `GUIDE_SLUG_LOOKUP_BY_LANG` can replace `ARTICLE_SLUGS` reverse lookup once slug parity is in place.
  - Approach: 90% — treat assistance pages as guides: resolve `guideKey` for the second segment and translate via `guideSlug()` for alternates.
  - Impact: 90% — affects hreflang alternates; mitigated by updating tests.
- **Acceptance:**
  - Remove `ARTICLE_SLUGS` import
  - Remove `ARTICLE_SLUGS_BY_KEY` and `assistanceArticleLookup` construction
  - For `slugKey === "assistance"`, resolve `guideKey` via `guideLookup[lang][afterFirst]`
  - Alternates for assistance pages use `guideNamespace(targetLang, guideKey).baseSlug` + `guideSlug(targetLang, guideKey)`
  - Update `apps/brikette/src/test/utils/seo.test.ts` accordingly

### TASK-12: Migrate LanguageModal.tsx

- **Affects:** `apps/brikette/src/context/modal/global-modals/LanguageModal.tsx`
- **CI:** 90%
  - Implementation: 90% — replace article-key lookup with `resolveGuideKeyFromSlug`.
  - Approach: 90% — fix an existing edge case: `/[lang]/assistance` should remain the assistance index when switching languages.
  - Impact: 90% — affects language switching on assistance pages.
- **Acceptance:**
  - Remove `HelpArticleKey` and `articleSlug` usage
  - When on `/[lang]/assistance`, switching language stays on `/<nextLang>/<assistanceSlug>`
  - When on `/[lang]/assistance/<guideSlug>`, switching language keeps the same `guideKey` and translates slug via `guideSlug(nextLang, guideKey)`

### TASK-13: Migrate test/utils/seo.test.ts

- **Affects:** `apps/brikette/src/test/utils/seo.test.ts`
- **CI:** 90%
  - Implementation: 90% — update imports and iteration.
  - Approach: 90% — follows seo.ts migration (assistance pages are guides).
  - Impact: 90% — test file only.
- **Acceptance:**
  - Import `ASSISTANCE_GUIDE_KEYS`, `guideSlug` instead of article helpers
  - Update test iteration
  - All tests pass

### TASK-14: Delete legacy article files

- **Affects:**
  - `apps/brikette/src/routes.assistance-helpers.ts` (delete)
  - `apps/brikette/src/article-slug-map.ts` (delete)
- **CI:** 90%
  - Implementation: 95% — straightforward deletion
  - Approach: 90% — final cleanup
  - Impact: 90% — only after all migrations complete
- **Acceptance:**
  - No remaining imports of these files
  - TypeScript compiles
  - Targeted tests pass (SEO + any URL inventory tests impacted)

### TASK-15: Migrate types/loaderSchemas.ts (remove ARTICLE_SLUGS dependency)

- **Affects:** `apps/brikette/src/types/loaderSchemas.ts`, `apps/brikette/src/locales/*/translation.json`
- **CI:** 90%
  - Implementation: 90% — derive assistance slug enum from `ASSISTANCE_GUIDE_KEYS` + `guideSlug` across supported languages.
  - Approach: 90% — keep the invariant check but remove the `ARTICLE_SLUGS` dependency.
  - Impact: 90% — low risk; keeps schema honest.
- **Acceptance:**
  - No imports from `@/article-slug-map`
  - Internal error copy updated to not mention `ARTICLE_SLUGS`
  - Schema still validates known assistance slugs across supported languages

### TASK-16: Update components runbook docs

- **Affects:** `apps/brikette/src/components/AGENTS.md`
- **CI:** 90%
  - Implementation: 90% — update references from legacy article helpers to the new canonical guide key list.
  - Approach: 90% — keeps contributor guidance accurate after the migration.
  - Impact: 90% — docs only.
- **Acceptance:**
  - Replace “update `@/routes.assistance-helpers`” with “update assistance guide keys source (`assistance.tags.ts` + `assistanceGuideKeys.ts`)”

## Patterns to Follow

- **Guide imports:** `import { guideSlug, type GuideKey } from "@/routes.guides-helpers"`
- **Assistance keys:** `import { ASSISTANCE_GUIDE_KEYS } from "@/data/assistanceGuideKeys"`
- **Slug lookup:** Use `GUIDE_SLUG_LOOKUP_BY_LANG[lang][slug]` for reverse lookups

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| URL changes breaking navigation | Slug parity ensures URLs are identical |
| Test failures revealing edge cases | Use targeted tests; avoid unfiltered `pnpm test` runs |
| seo.ts reverse lookup complexity | Investigate GUIDE_SLUG_LOOKUP_BY_LANG before implementing |
| Defensive import pattern removal | Keep the “namespace import” pattern where tests may partially mock modules (pattern already used in guide SEO code) |
| URL inventory fixtures drift | Regenerate fixtures with `pnpm --filter @apps/brikette generate:url-fixtures` after routeInventory changes |

## Acceptance Criteria (Overall)

- [x] All article-helper call sites migrated (including seo, routeInventory, loaderSchemas, and LanguageModal)
- [x] `apps/brikette/src/routes.assistance-helpers.ts` deleted
- [x] `apps/brikette/src/article-slug-map.ts` deleted
- [x] TypeScript compiles without errors
- [x] Navigation links work in footer, desktop nav, mobile nav
- [x] Language switching works on assistance pages
- [x] hreflang alternates correct for assistance pages

## Dependencies

- **Depends on:** Help Articles to Guides Conversion (complete)
- **Blocks:** None (cleanup work)

## Milestones

| Milestone | Tasks | Focus | Status |
|-----------|-------|-------|--------|
| 1 | TASK-01 through TASK-07 | Low/medium complexity migrations | **Complete** |
| 2 | TASK-08, TASK-15 | URL inventory + loader schemas | **Complete** |
| 3 | TASK-09 through TASK-13 | Navigation + SEO + Language switching | **Complete** |
| 4 | TASK-16, TASK-14 | Docs + delete legacy files | **Complete** |

## Completion Summary

**Completed: 2026-01-26**

All 16 tasks were successfully implemented across 4 milestones. The migration eliminated the dual article/guide helper system by:

1. **Created canonical enumeration** (`apps/brikette/src/data/assistanceGuideKeys.ts`) with `ASSISTANCE_GUIDE_KEYS` and type guard
2. **Migrated all consumers** from `articleSlug`/`HelpArticleKey` to `guideSlug`/`GuideKey`
3. **Simplified SEO logic** by removing `assistanceArticleLookup` in favor of unified `guideLookup`
4. **Fixed edge case** in LanguageModal where assistance index now stays on index when switching languages
5. **Deleted legacy files**: `routes.assistance-helpers.ts` and `article-slug-map.ts`

**Verification:**
- TypeScript compiles without errors
- SEO tests pass (23/23)
- Assistance guide keys tests pass (7/7)
- No remaining imports of deleted legacy files
