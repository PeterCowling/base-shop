# TASK-14 — Homepage Featured Guides Section

Date: 2026-02-22  
Task: `TASK-14` (`IMPLEMENT`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope Implemented

Implemented a new homepage featured-guides section that surfaces transport and beach guides directly from the homepage.

Code changes:
- Added `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`
- Integrated section in `apps/brikette/src/app/[lang]/HomeContent.tsx` (after quick links)
- Added test `apps/brikette/src/test/components/featured-guides-section.test.tsx`

## Implementation Notes

- Guide links are generated through `%LINK:guideKey|label%` tokens and rendered with:
  - `renderGuideLinkTokens(...)`
  - `sanitizeLinkLabel(...)`
- Labels are resolved via `getGuideLinkLabel(...)` with EN fallback translator.
- Candidate guides are filtered by `isGuideLive(...)` and capped at 8 links.

Featured candidates include transport and beach guides:
- Transport: `amalfiPositanoBus`, `naplesAirportPositanoBus`, `naplesCenterPositanoFerry`, `salernoPositanoBus`
- Beaches: `fornilloBeachGuide`, `arienzoBeachClub`, `lauritoBeachGuide`, `positanoMainBeach`
- Additional fallback candidates retained to keep 6-8 live links available.

## Validation

Executed:
- `pnpm --filter @apps/brikette test -- src/test/components/featured-guides-section.test.tsx`
- `pnpm --filter @apps/brikette test -- src/test/components/ga4-cta-click-header-hero-widget.test.tsx`
- `pnpm --filter @apps/brikette typecheck`

Results:
- New section test passed:
  - verifies 6-8 links rendered
  - verifies `%LINK:` token path is used
  - verifies rendered links are locale-prefixed (`/en/...`)
- Existing HomeContent GA4 CTA test passed (no regression).
- Brikette typecheck passed.

## Acceptance Check (TASK-14)

- 6-8 guide links visible on homepage (EN): **Pass**
- Links resolved through `%LINK:guideKey|label%` token system: **Pass**
- Section integration in homepage flow: **Pass**
- Regression validation run for HomeContent path: **Pass**
