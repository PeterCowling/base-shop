---
Type: Plan
Status: Active
Domain: Brikette i18n
Last-reviewed: 2026-02-08
Relates-to charter: none
Progress: 6/7 tasks complete
---

# Brikette Translation Coverage Fix Plan

## Goals
- Remove locale JSON parse failures that can break non-EN experiences pages.
- Reduce user-visible English fallback by closing a small, known set of missing keys.
- Keep locale bundles structurally consistent where the UI expects structure (notably `dealsPage.perksList`).

## Non-goals
- Translating every long-form guide/routes stub in `apps/brikette/src/locales/guides.stub/`.
- Changing runtime i18n fallback behavior (`fallbackLng: "en"`).
- Reworking the overall i18n architecture (tracked in other plans).

## Current Findings (2026-02-08)
- 18 locales under `apps/brikette/src/locales/`.
- Status: BRIK-I18N-COV-00..06 complete (6/7 tasks); BRIK-I18N-COV-07 deferred.
- Resolved: invalid JSON locale files (`*/experiencesPage.json`) for `de`, `hi`, `ko`, `pl`, `zh`.
- Resolved: missing keys in all 17 non-EN locales (`howToGetHere.json` and `translation.json`).
- Resolved: schema drift in `dealsPage.json` (`perksList` now object-array everywhere).
- Resolved: `positanoMainBeach.json` parity (EN content added + route wired up).
- Remaining: 24 extra root route-guide JSON files exist in 10 locales but not EN (usage unclear - COV-07 deferred).

## Active Tasks

- [x] BRIK-I18N-COV-00: Re-audit locale coverage and document findings
  - Scope: validate JSON parseability; compute missing key sets vs EN for core namespaces; identify file parity issues in `guides/content`.
  - Dependencies: none.
  - Definition of done: findings recorded in `docs/brikette-translation-coverage.md`.
  - Status: Complete.

- [x] BRIK-I18N-COV-01: Fix invalid `experiencesPage.json` files
  - Scope: correct JSON syntax in:
    - `apps/brikette/src/locales/de/experiencesPage.json`
    - `apps/brikette/src/locales/hi/experiencesPage.json`
    - `apps/brikette/src/locales/ko/experiencesPage.json`
    - `apps/brikette/src/locales/pl/experiencesPage.json`
    - `apps/brikette/src/locales/zh/experiencesPage.json`
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: all 5 files parse as strict JSON (validated via the "Validate Locale JSON" script in `docs/brikette-translation-coverage.md`).
  - Status: Complete.

- [x] BRIK-I18N-COV-02: Add missing `howToGetHere.json` keys to all non-EN locales
  - Scope: add translations for the 14 EN-only keys listed in `docs/brikette-translation-coverage.md`.
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: key-parity check vs EN shows zero missing keys for `howToGetHere.json` (for `lightbox.*`, `destinations.sections.image.caption`, and `*.links.facts.*`).
  - Status: Complete.

- [x] BRIK-I18N-COV-03: Add missing skip-link keys to all non-EN locales
  - Scope: add `accessibility.skipToMain` and `accessibility.skipToNav` to `apps/brikette/src/locales/*/translation.json` (non-EN).
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: key-parity check vs EN shows zero missing keys for `translation.json` (for the `accessibility.skipTo*` keys).
  - Status: Complete.

- [x] BRIK-I18N-COV-04: Decide and normalize `dealsPage.perksList` schema
  - Scope: choose one:
    - A) migrate all locales to `Array<{ title, subtitle?: string }>` (chosen), or
    - B) drop subtitles from EN and keep `string[]` everywhere.
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: all locales ship `perksList` as an array of objects with `title` (subtitles may be added later).
  - Status: Complete.

- [x] BRIK-I18N-COV-05: Fix Polish interpolation placeholders
  - Scope: replace `__placeholder_0__` with correct i18next interpolation variables:
    - `apps/brikette/src/locales/pl/roomsPage.json` (`landingImageAlt` → `{{room}}`)
    - `apps/brikette/src/locales/pl/assistanceSection.json` (`{{tag}}`)
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: no `__placeholder_0__` tokens remain in `apps/brikette/src/locales/pl`; runtime interpolation works.
  - Status: Complete.

- [x] BRIK-I18N-COV-06: Resolve `positanoMainBeach.json` guide parity
  - Scope: ensure `apps/brikette/src/locales/*/guides/content/positanoMainBeach.json` is shippable:
    - Add `apps/brikette/src/locales/en/guides/content/positanoMainBeach.json`.
    - Add slug mapping and guide index entry.
    - Wire a new guide route + manifest entry so the guide is reachable.
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: guide is reachable at the generated slug and resolves content for all locales (with EN fallback where needed).
  - Status: Complete.

- [ ] BRIK-I18N-COV-07: Decide fate of the 24 extra root route-guide JSON files
  - Scope: confirm usage of the extra root files present in 10 locales (e.g. `positanoAmalfiBus.json`); remove or consolidate if unused/superseded.
  - Dependencies: BRIK-I18N-COV-00.
  - Definition of done: either (a) files removed safely, or (b) documented as intentional with a loader/consumer reference.
  - Status: Deferred (explicitly no action for now).

## Validation
- JSON validity: run the parse scan in `docs/brikette-translation-coverage.md` ("Validate Locale JSON").
- Targeted tests: `pnpm --filter @apps/brikette test:content-readiness`

## Deferred tasks

- **BRIK-I18N-COV-07** - Decide fate of 24 extra root route-guide JSON files (deferred - no action required)
