---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-ENG-0012
Title: How-To-Get-Here Guides Migration Plan
Business: BRIK
Tags:
  - plan-migration
  - cms
Created: 2026-01-27T00:00:00.000Z
Updated: 2026-01-27T00:00:00.000Z
---
# How-To-Get-Here Guides Migration Plan

**Source:** Migrated from `how-to-get-here-guides-migration-plan.md`


# How-To-Get-Here Guides Migration Plan

## Summary

Register the 24 “how-to-get-here” transport routes (currently defined in `routes.json`) as first-class guide keys so they participate in the unified guide slug/namespace helpers, tags discovery, and URL inventory — **without changing how the pages render** today. Existing URLs (`/[lang]/how-to-get-here/[slug]`) remain unchanged.

## Success Signals (What “Good” Looks Like)

- `resolveGuideKeyFromSlug()` recognizes every how-to-get-here route slug and returns a stable guide key.
- `guidePath(lang, key)` for each route key produces `/${lang}/${getSlug("howToGetHere")}/${existingSlug}`.
- Routes appear in tag discovery (GUIDES_INDEX) with consistent mode + location tagging.
- App Router URL inventory remains unique and complete (24 routes × 18 languages = 432 URLs).
- No rendering changes: visiting `/[lang]/how-to-get-here/[slug]` continues to render the existing `HowToGetHereContent` path.

## Non-goals

- Changing the how-to-get-here index page UX (filter UI remains as-is)
- Converting how-to-get-here route content into guide JSON/i18n format (explicit follow-on)
- Changing the existing how-to-get-here route renderer (`HowToGetHereContent`)

[... see full plan in docs/plans/how-to-get-here-guides-migration-plan.md]
