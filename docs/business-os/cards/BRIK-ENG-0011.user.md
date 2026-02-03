---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-ENG-0011
Title: Help Articles to Guides Conversion Plan
Business: BRIK
Tags:
  - plan-migration
  - cms
Created: 2026-01-26T00:00:00.000Z
Updated: 2026-01-26T00:00:00.000Z
---
# Help Articles to Guides Conversion Plan

**Source:** Migrated from `help-articles-to-guides-conversion-plan.md`


## Progress Update (2026-01-26)

### All Tasks Complete

- **TASK-01**: ✅ Added `%URL:` token support for external/mailto links
- **TASK-02**: ✅ Created conversion script (`scripts/convert-assistance-articles-to-guides.ts`)
- **TASK-03**: ✅ Added guide keys + slug parity for all 12 articles
- **TASK-04**: ✅ Pilot converted `rules` article (all 18 locales)
- **TASK-05**: ✅ Converted remaining 10 low/medium complexity articles (180 conversions, 10 manifest + index entries)
- **TASK-06**: ✅ Converted `bookingBasics` with grouping (35 sections → 9 groups, all 18 locales)
  - Extended script with `--grouping` option for structure file
  - Created `scripts/help-articles/bookingBasics.structure.json`
- **TASK-07**: ✅ Cutover complete:
  - Updated `/[lang]/assistance/[article]/page.tsx` to use guide rendering only
  - Deleted `AssistanceArticleContent.tsx` (no longer needed)
  - Deleted 216 legacy article JSON files (12 articles × 18 locales)
  - Removed legacy article imports from `i18n.ts`
  - Legacy article helpers remain for link generation (same URLs, slug parity maintained)


[... see full plan in docs/plans/help-articles-to-guides-conversion-plan.md]
