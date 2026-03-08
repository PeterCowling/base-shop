# Top-Level Route Policy

- Date: `2026-03-06`
- Task: `TASK-13F`
- Scope: top-level public route policy, shared-spelling allowlist, and apartment-booking route consumer map

## Decision
Localize the full non-English public top-level route contract, including legal pages and the apartment-booking route.

No DECISION task is needed here. The operator standard is already explicit: non-English public slugs should not remain English unless the overlap is deliberate and justified.

## Approved Shared-Spelling Allowlist
These are the only top-level shared-spelling exceptions that should currently remain approved:

- `fr/experiences`
- `fr/guides`

## Not Approved
These are route-localization debts, not approved exceptions:

- `/{lang}/book-private-accommodations`
- `/{lang}/privacy-policy`
- `/{lang}/cookie-policy`
- `/hi/book`
- `/da/book`
- `/ja/house-rules`
- `/ko/house-rules`
- `/it/{experiencesSlug}/tags/{tag}`

## Why Legal Routes Should Join The Localized Contract
The repo currently treats `privacy-policy` and `cookie-policy` as public route slugs, not as externally managed/legal-system slugs.

Evidence:
- `apps/brikette/src/slug-map.ts` carries them as standard route keys alongside other localized public sections.
- `apps/brikette/src/routing/sectionSegments.ts` includes both keys in `TOP_LEVEL_SEGMENT_KEYS`.
- `apps/brikette/src/middleware.ts` already handles wrong-locale and legacy top-level segment correction generically.

There is no repo evidence that legal pages must stay English for compliance, platform, or external-contract reasons. The correct default is therefore to localize them.

## Apartment Booking Route Consumer Map
The hardcoded apartment-booking route currently fans out across these surfaces:

- `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`
  - RSC entry point and metadata path contract
- `apps/brikette/src/routing/routeInventory.ts`
  - canonical public route inventory and App Router inventory
- `apps/brikette/src/middleware.ts`
  - redirects legacy apartment booking aliases into the hardcoded route
- `apps/brikette/scripts/generate-static-export-redirects.ts`
  - legacy and typo redirect rules point at the hardcoded route
- `apps/brikette/src/app/[lang]/private-rooms/book/page.tsx`
  - old apartment booking entry redirects into the hardcoded route
- `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`
  - summary-page CTA target
- `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx`
  - apartment-page CTA target
- `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx`
  - source-level regression expectations
- `apps/brikette/src/test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts`
  - route audit expectation
- `apps/brikette/scripts/verify-route-localization.ts`
  - new audit gate tracks the hardcoded route as special-route debt

## Consumer Implications
Renaming or localizing the apartment-booking route is not a one-file change.

It must ship with:

- updated route inventory
- updated metadata path generation
- updated CTA targets
- updated middleware redirects
- updated static redirect generation
- updated tests
- legacy English alias preservation

## Implementation Recommendation For TASK-13B
1. Represent apartment booking as a proper localized public slug contract rather than a standalone hardcoded path.
2. Localize `privacy-policy` and `cookie-policy`.
3. Localize `/hi/book` and `/da/book`.
4. Localize `/ja/house-rules` and `/ko/house-rules`.
5. Localize the nested Italian `tags` segment under the experiences tag family.
6. Preserve the old English paths as permanent redirect aliases.

## Validation Expectations For TASK-13B
- `verify-route-localization` should stop flagging the top-level, nested-segment, and special-route debts above.
- `verify-url-coverage` should continue to pass after redirect regeneration.
- Middleware must continue to resolve old aliases and wrong-locale slugs into the new localized canonicals.
