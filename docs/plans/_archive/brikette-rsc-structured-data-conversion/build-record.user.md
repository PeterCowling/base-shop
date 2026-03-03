---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-rsc-structured-data-conversion
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record: Brikette RSC Structured Data Conversion

## Outcome Contract

- **Why:** Structured data was only emitting after JavaScript hydration — absent from the raw HTML that crawlers receive on first request. The `ExperiencesStructuredData` component's `!ready` guard explicitly returned empty string on the server. Moving both components to RSC makes JSON-LD present in every initial HTML response.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both `/rooms` and `/experiences` pages emit their JSON-LD structured data in the initial server HTML response (verifiable via `curl` without JavaScript), with no regression in schema validity.
- **Source:** operator

## What Was Built

**Wave 1 — New RSC components (commit `c6d9cee400`, TASK-01 + TASK-02 + TASK-06):** Created `RoomsStructuredDataRsc.tsx` and `ExperiencesStructuredDataRsc.tsx` as `server-only` async RSC components. Both accept `{ lang: AppLanguage }` as a prop, use server-safe data paths (`loadRoomsCatalog(lang)`, `getTranslations(lang, "experiencesPage")`), and emit JSON-LD via `<script type="application/ld+json" dangerouslySetInnerHTML>`. No client hooks, no `memo()`, no `suppressHydrationWarning`. The `ExperiencesStructuredDataRsc` variant eliminates the `!ready` guard — the root cause of SSR absence. Unit tests added for both components.

**Wave 2 — Integration and cleanup (commit `04c4f9fc8b`, TASK-03 + TASK-05):** Integrated both RSC variants into `rooms/page.tsx` and `experiences/page.tsx`, and removed the client-side renders from `RoomsPageContent.tsx` and `ExperiencesPageContent.tsx` in a single atomic commit to prevent any window of duplicate JSON-LD in production. Deleted the old client-only `RoomsStructuredData.tsx` and `ExperiencesStructuredData.tsx` components.

**TASK-07 — Live smoke-test (2026-02-26):** Verified JSON-LD presence on the live production site (`hostel-positano.com`) across all 18 supported locales on both `/rooms` and `/experiences`. 36/36 checks passed. `inLanguage` matches URL locale in all cases. JSON is valid and schema-correct in every locale.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --no-coverage` | Pass | Unit tests for both RSC components added and passing; no pre-existing regressions |
| TypeScript typecheck (pre-commit hook) | Pass | Clean compile on all affected packages |
| `pnpm lint` (pre-commit hook) | Pass | import-sort autofix applied; no violations |
| Live curl smoke-test — 18 locales × 2 pages | Pass | 36/36 — all `inLanguage` correct, all JSON valid, run on `hostel-positano.com` 2026-02-26 |

## Validation Evidence

### TASK-01 (`RoomsStructuredDataRsc`)
- `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` created; begins with `import "server-only"`.
- No `"use client"`, no `memo()`, no `useCurrentLanguage` import.
- Calls `loadRoomsCatalog(lang)` (async). Emits `<script type="application/ld+json" dangerouslySetInnerHTML>`. No `suppressHydrationWarning`.
- TC-01/02/03/04: all contracts met — confirmed by static code review and passing typecheck.

### TASK-02 (`ExperiencesStructuredDataRsc`)
- `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx` created; begins with `import "server-only"`.
- No `"use client"`, no `memo()`, no `useCurrentLanguage`, `usePathname`, or `useTranslation`.
- Uses `getTranslations(lang, "experiencesPage")`. No `!ready` guard. `pathname` computed as `` `/${lang}/${getSlug("experiences", lang)}` ``.
- TC-01 through TC-06: all contracts met.

### TASK-03 (Integration — atomic commit)
- `rooms/page.tsx` and `experiences/page.tsx` render RSC variants.
- `RoomsPageContent.tsx` and `ExperiencesPageContent.tsx` no longer render client-side structured data.
- Single atomic commit prevents any window of duplicate JSON-LD.

### TASK-05 (Deletion)
- `apps/brikette/src/components/seo/RoomsStructuredData.tsx` deleted.
- `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` deleted.
- No remaining imports of deleted files — confirmed by clean typecheck.

### TASK-06 (Unit tests)
- Tests at `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` and `ExperiencesStructuredDataRsc.test.tsx` — all passing.
- No pre-existing test regressions.

### TASK-07 (Live smoke-test)
- Run on `hostel-positano.com`, 2026-02-26.
- All 18 locales × both routes: JSON-LD present in raw HTML, `inLanguage` matches URL locale, JSON valid.
- `en/rooms`: `@type=OfferCatalog`, 23 items. `en/experiences`: `@type=ItemList`, 3 items.
- Result: **36/36 pass**.
