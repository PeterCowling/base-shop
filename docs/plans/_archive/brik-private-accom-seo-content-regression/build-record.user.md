---
Type: Build-Record
Status: Complete
Feature-Slug: brik-private-accom-seo-content-regression
Completed-date: 2026-03-04
artifact: build-record
Build-Event-Ref: docs/plans/brik-private-accom-seo-content-regression/build-event.json
---

# Build Record: BRIK Private Accommodation Page — SEO + Content Regression Fix

## Outcome Contract

- **Why:** The private accommodation booking page is invisible to search engines due to broken meta tags and noindex directive. This is the highest-margin conversion path — its landing page needs to rank and convert organic traffic.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Page serves correct meta title/description, is indexable, has SSR heading hierarchy and descriptive content, and includes JSON-LD structured data — enabling organic discovery and improving landing page conversion.
- **Source:** operator

## What Was Built

**Meta tags and indexing (TASK-01):** Removed `{ optional: true }` from `getTranslations()` in `generateMetadata` so namespace load failures throw instead of silently returning raw i18n keys. Changed `isPublished: false` to `true` to remove the noindex directive. Switched OG image from generic facade to apartment-specific `/img/apt1.jpg`.

**Server-rendered landing content (TASK-02):** Added translated heading, intro paragraph, feature highlights (100sqm, kitchen, 2 bathrooms, sea-view terrace, Wi-Fi/AC), "why book direct" value proposition section, and cross-links to dorms, experiences, and location pages — all rendered server-side above the `<Suspense>` boundary. Added corresponding i18n keys to `bookPage.json` under `apartment.landing`. Passed `heading=""` to `BookPageContent` to prevent duplicate H1.

**Structured data (TASK-03):** Created `PrivateAccomStructuredDataRsc` server component that emits JSON-LD with existing `apartment` schema and breadcrumb list. Integrated into page above Suspense boundary with `import "server-only"`.

**URL rename (TASK-04):** Renamed route directory from `book-private-accomodations` to `book-private-accommodations` (fixed double-m spelling). Updated the slug constant, route inventory, all 13 source files referencing the old slug (middleware, nav components, redirect scripts, private-rooms pages, tests), and added 301 redirects from old misspelled URLs to corrected URLs in `_redirects`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | Pass | Stale `.next/types` cache cleared after directory rename; pre-existing TS6059 in packages/ui unrelated |
| `pnpm --filter brikette lint` | Pass | Pre-existing errors in book-dorm-bed and book pages unrelated to changes |
| `pnpm --filter @acme/ui lint` | Pass | No errors |
| `grep -r "book-private-accomodations" apps/brikette/src/` | 0 matches | TC-01 for TASK-04 verified |

## Validation Evidence

### TASK-01
- TC-01: `getTranslations(validLang, ["bookPage"])` no longer uses `{ optional: true }` — namespace must load or build fails. `t("apartment.meta.title", { defaultValue: "" })` returns translated text.
- TC-02: `isPublished: true` in `buildAppMetadata()` call — robots will allow indexing.
- TC-03: OG image now `buildCfImageUrl("/img/apt1.jpg", ...)` — apartment-specific.

### TASK-02
- TC-01: `<h1>` with `{heading}` rendered server-side in page.tsx above Suspense.
- TC-02: Intro paragraph with "Positano" and "apartment" from `t("apartment.landing.intro")`.
- TC-03: Cross-links to `/book-dorm-bed`, `/experiences`, `/how-to-get-here` present.
- TC-04: All copy from i18n keys; lint passes with no new hardcoded-copy errors.

### TASK-03
- TC-01: `PrivateAccomStructuredDataRsc` renders `<script type="application/ld+json">` with Apartment schema.
- TC-02: Breadcrumb list includes Home → Private Rooms → Book path.
- TC-03: Component uses `import "server-only"` — guaranteed SSR.

### TASK-04
- TC-01: `grep -r "book-private-accomodations" apps/brikette/src/` returns 0 matches.
- TC-02: `_redirects` contains 4 old→new 301 redirects for the misspelled slug.
- TC-03: `routeInventory.ts` lists `book-private-accommodations`.

## Scope Deviations

TASK-04 required controlled scope expansion: the old slug `book-private-accomodations` appeared in 13 additional files beyond the plan's original 4-file scope (middleware, 3 nav components, buildNavLinks, 3 private-rooms components, redirect generation script, 3 test files). All references updated to prevent broken links and test assertions. Expansion was necessary to satisfy TC-01 (zero matches for old slug in source).
