# Build Record — resolveTranslatedCopy Deduplication

**Plan slug:** brikette-i18n-util-resolve-translated-copy-dedup
**Completed:** 2026-03-11
**Business:** BRIK

## What was done

Extracted the `resolveTranslatedCopy` i18n helper from 3 duplicate locations into a single named export in `apps/brikette/src/utils/i18nContent.ts`.

**Files changed:**
- `apps/brikette/src/utils/i18nContent.ts` — added `resolveTranslatedCopy` export (11 lines)
- `apps/brikette/src/utils/bookingControlLabels.ts` — removed local definition, now imports from `i18nContent`
- `apps/brikette/src/components/landing/LocationMiniBlock.tsx` — removed local definition, now imports from `i18nContent`
- `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` — removed local definition, now imports from `i18nContent`

**Not changed:** `SocialProofSection.tsx` retains its local variant which has an additional `EXACT_UNRESOLVED_RATINGS_KEYS` guard not present in the other copies.

## Validation

- TypeScript typecheck: ✅ passes (`pnpm --filter brikette typecheck`)
- No functional behaviour change — pure refactor

## Outcome Contract
- **Why:** Four-way duplication of a core i18n validation helper means any future change to the sentinel pattern must be applied in four places with no mechanism to keep them in sync. A single shared export eliminates that maintenance risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `resolveTranslatedCopy` is defined once in `apps/brikette/src/utils/i18nContent.ts` and imported by the 3 former duplicates. TypeScript confirms no remaining inline copies.
- **Source:** operator
