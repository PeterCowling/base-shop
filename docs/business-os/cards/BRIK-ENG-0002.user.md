---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0002
Title: Brikette Translation Coverage Fix Plan
Business: BRIK
Tags:
  - plan-migration
  - brikette-i18n
Created: 2026-01-14T00:00:00.000Z
Updated: 2026-01-14T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Brikette Translation Coverage Fix Plan

**Source:** Migrated from `brikette-translation-coverage-plan.md`


# Brikette Translation Coverage Fix Plan

## Goals
- Remove locale JSON parse failures that can break non-EN experiences pages.
- Reduce user-visible English fallback by closing a small, known set of missing keys.
- Keep locale bundles structurally consistent where the UI expects structure (notably `dealsPage.perksList`).

## Non-goals
- Translating every long-form guide/routes stub in `apps/brikette/src/locales/guides.stub/`.
- Changing runtime i18n fallback behavior (`fallbackLng: "en"`).
- Reworking the overall i18n architecture (tracked in other plans).

## Current Findings (2026-01-14)
- 18 locales under `apps/brikette/src/locales/`.
- Status: BRIK-I18N-COV-00..06 complete; BRIK-I18N-COV-07 pending.
- Resolved: invalid JSON locale files (`*/experiencesPage.json`) for `de`, `hi`, `ko`, `pl`, `zh`.
- Resolved: missing keys in all 17 non-EN locales (`howToGetHere.json` and `translation.json`).
- Resolved: schema drift in `dealsPage.json` (`perksList` now object-array everywhere).
- Resolved: `positanoMainBeach.json` parity (EN content added + route wired up).

[... see full plan in docs/plans/brikette-translation-coverage-plan.md]
