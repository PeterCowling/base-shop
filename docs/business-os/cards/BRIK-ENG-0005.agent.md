---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0005
Title: Fix Placeholder Translations Plan
Business: BRIK
Tags:
  - plan-migration
  - ui-/-i18n-/-content
Created: 2026-01-27T00:00:00.000Z
Updated: 2026-01-27T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Fix Placeholder Translations Plan

**Source:** Migrated from `fix-placeholder-translations-plan.md`


# Fix Placeholder Translations Plan

## Summary

Replace 1335 placeholder phrases in locale files with actual translated content. These placeholders (e.g., "Tłumaczenie w przygotowaniu" for Polish) indicate incomplete translations that are currently rendered to users. The fix involves translating English source content to German (8 strings), Polish (654 strings), and Hungarian (673 strings).

## Goals

- Replace all placeholder phrases with quality translations
- Achieve 100% translation coverage for affected locales
- Maintain consistent tone and style with existing translations
- Ensure all translated content passes the i18n render-audit test

## Non-goals

- Translating other locales not currently flagged
- Adding new content or guides
- Changing the translation workflow/tooling
- Fixing missing keys (separate from placeholder phrases)

[... see full plan in docs/plans/fix-placeholder-translations-plan.md]
