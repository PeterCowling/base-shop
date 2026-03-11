---
Type: Micro-Build
Status: Archived
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-i18n-util-resolve-translated-copy-dedup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311100000-3100
Related-Plan: none
---

# resolveTranslatedCopy Deduplication Micro-Build

## Scope
- Change: Export `resolveTranslatedCopy` from `apps/brikette/src/utils/i18nContent.ts` and remove the three identical local definitions from `bookingControlLabels.ts`, `LocationMiniBlock.tsx`, and `RoomsPageContent.tsx`.
- Non-goals: Do not change `SocialProofSection.tsx` (its local variant has extra `EXACT_UNRESOLVED_RATINGS_KEYS` guard logic). Do not change function behaviour.

## Execution Contract
- Affects:
  - `apps/brikette/src/utils/i18nContent.ts`
  - `apps/brikette/src/utils/bookingControlLabels.ts`
  - `apps/brikette/src/components/landing/LocationMiniBlock.tsx`
  - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
- Acceptance checks:
  - `resolveTranslatedCopy` exported from `i18nContent.ts`
  - No remaining local definitions of `resolveTranslatedCopy` in the 3 target files
  - Each file imports `resolveTranslatedCopy` from `@/utils/i18nContent`
  - TypeScript passes with no new errors
- Validation commands: `pnpm --filter brikette typecheck`
- Rollback note: Revert to local function definitions in each file — pure refactor, no behaviour change.

## Outcome Contract
- **Why:** Four-way duplication of a core i18n validation helper means any future change to the sentinel pattern must be applied in four places with no mechanism to keep them in sync. A single shared export eliminates that maintenance risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `resolveTranslatedCopy` is defined once in `apps/brikette/src/utils/i18nContent.ts` and imported by the 3 former duplicates. TypeScript confirms no remaining inline copies.
- **Source:** operator
