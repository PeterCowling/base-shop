---
Type: Fact-Find
Outcome: Implemented
Status: Completed
Domain: UI
Created: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: guides-inline-images
---

# Guides Inline Images — Fact-Find

## Summary

Some Brikette guide content JSON files include section-level images (`content.<guideKey>.sections[].images[]`) intended to render inline with the section text, but they were not appearing in the guide pages.

Root cause: the `images` field existed in content but was **(a) stripped by schema/normalization** and **(b) never rendered** by `GenericContent`.

## Evidence (Examples)

English content files with `sections[].images[]` (non-exhaustive):
- `apps/brikette/src/locales/en/guides/content/positanoMainBeach.json`
- `apps/brikette/src/locales/en/guides/content/positanoMainBeachBusBack.json`
- `apps/brikette/src/locales/en/guides/content/fornilloBeachGuide.json`

## Root Cause

1) **Schema stripping on authoring writes**
- `apps/brikette/src/routes/guides/content-schema.ts` validated `sections[]` with a strict object schema that did not include `images`, so `safeParse()` stripped `sections[].images` when saving via the authoring API (`apps/brikette/src/app/api/guides/[guideKey]/route.ts`).

2) **Rendering path dropped/ignored the field**
- `apps/brikette/src/components/guides/generic-content/sections.ts` normalized legacy section shapes but did not carry `images` through to `ResolvedSection`.
- `apps/brikette/src/components/guides/GenericContent.tsx` rendered section headings + body blocks only; no inline image rendering existed.

## Fix Implemented

- Preserve and validate section images in the content schema:
  - `apps/brikette/src/routes/guides/content-schema.ts`
- Carry `images` through GenericContent normalization and render via `ImageGallery` inside each section:
  - `apps/brikette/src/components/guides/generic-content/types.ts`
  - `apps/brikette/src/components/guides/generic-content/sections.ts`
  - `apps/brikette/src/components/guides/GenericContent.tsx`
- Include `images` in the structured section normalization + minimal structured section rendering:
  - `apps/brikette/src/routes/guides/guide-seo/types.ts`
  - `apps/brikette/src/routes/guides/guide-seo/content-normalization/sections.ts`
  - `apps/brikette/src/routes/guides/guide-seo/components/structured-toc/StructuredTocSections.tsx`

## Tests / Validation

- Schema regression tests:
  - `apps/brikette/src/test/routes/guides/__tests__/content-schema.test.ts`
- Rendering regression tests:
  - `apps/brikette/src/test/routes/guides/__tests__/generic-content.section-images.test.tsx`
- Verified:
  - `pnpm --filter @apps/brikette typecheck`
  - Focused Jest runs for the two tests above

