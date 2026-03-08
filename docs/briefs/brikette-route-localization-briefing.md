---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: UI
Created: 2026-03-06
Last-updated: 2026-03-06
Topic-Slug: brikette-route-localization
---

# Brikette Route Localization Briefing

## Executive Summary
Brikette already has a real public route-localization contract. Public URLs are generated from localized slug maps, while the App Router keeps English internal segment names and relies on middleware rewrites to bridge the two. That means route localization should be judged on the public canonical URLs, not on folder names.

The public contract is mostly localized, but it is not complete. The main remaining English leakage is concentrated in three areas: one hardcoded apartment-booking route, legal-policy top-level slugs, and dynamic room/guide slugs that still fall back to English for several locales.

## Questions Answered
- Q1: What are the public route families for Brikette?
- Q2: Which route families are localized at the public URL layer?
- Q3: Which non-English routes still expose English slugs?
- Q4: Where is the source of truth for top-level slugs versus dynamic slugs?

## High-Level Architecture
- Components:
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L7) - source of truth for localized top-level public section slugs.
  - [apps/brikette/src/routing/sectionSegments.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/sectionSegments.ts#L7) - source of truth for internal App Router segment names and localized top-level keys.
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L26) - enumerates valid App Router URLs and canonical localized public URLs.
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L201) - rewrites localized public first segments to internal App Router segments and redirects wrong-locale/legacy aliases.
  - [packages/ui/src/config/roomSlugs.ts](/Users/petercowling/base-shop/packages/ui/src/config/roomSlugs.ts#L1) - source of truth for dynamic dorm room detail slugs by locale.
  - [apps/brikette/src/guides/slugs/slugs.ts](/Users/petercowling/base-shop/apps/brikette/src/guides/slugs/slugs.ts#L12) - source of truth for dynamic guide/article slugs by locale.
- Data stores / external services:
  - No external slug service is involved. Route localization is repo-owned.

## End-to-End Flow
### Primary flow
1. Top-level public slugs are defined per locale in `SLUGS`.
2. Public canonical URLs are emitted from `listLocalizedPublicUrls()`.
3. Next.js App Router still uses internal English folder segment names.
4. Middleware rewrites localized public first segments to those internal segments.
5. Dynamic room and guide child slugs are generated separately from top-level section slugs.

- Evidence:
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L7)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L85)
  - [apps/brikette/src/routing/sectionSegments.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/sectionSegments.ts#L7)
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L201)

### Public route families
- `/{lang}`
- `/{lang}/{sectionSlug}`
- `/{lang}/{roomsSlug}/{roomSlug}`
- `/{lang}/{guideNamespaceSlug}/{guideSlug}`
- `/{lang}/{experiencesSlug}/{tagsSlug}/{tag}`
- `/{lang}/book-private-accommodations`

- Evidence:
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L30)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L92)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L98)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L103)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L116)

### Alternate / edge flows
- Wrong-locale or English top-level slugs are redirected to the correct localized slug for the active locale.
- Legacy apartment roots and `.../book` aliases are redirected into the special apartment booking route.
- The apartment booking route is not currently localized by locale; it remains hardcoded as `book-private-accommodations`.

- Evidence:
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L122)
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L162)
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L204)
  - [apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx](/Users/petercowling/base-shop/apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx#L19)

## Data & Contracts
### Top-level route keys
The public top-level route contract covers these route keys:

- `rooms`
- `deals`
- `careers`
- `about`
- `assistance`
- `experiences`
- `howToGetHere`
- `apartment`
- `book`
- `guides`
- `guidesTags`
- `terms`
- `houseRules`
- `privacyPolicy`
- `cookiePolicy`
- `breakfastMenu`
- `barMenu`

- Evidence:
  - [apps/brikette/src/routing/sectionSegments.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/sectionSegments.ts#L30)
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L7)

### Top-level non-English slugs that still match English
These are the current public top-level slug exceptions where a non-English locale still exposes the English slug text:

- `book`
  - `hi`: `book`
  - `da`: `book`
  - Evidence: [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L186)
- `houseRules`
  - `ja`: `house-rules`
  - `ko`: `house-rules`
  - Evidence: [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L262)
- `privacyPolicy`
  - All non-English locales still use `privacy-policy`
  - Evidence: [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L278)
- `cookiePolicy`
  - All non-English locales still use `cookie-policy`
  - Evidence: [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L300)
- `guidesTags`
  - `it`: `tags`
  - Evidence: [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L232)

### Top-level non-English slugs that look English but are not necessarily debt
These slugs match English spelling, but the overlap appears intentional or linguistically acceptable within the current ASCII-safe scheme:

- `experiences`
  - `fr`: `experiences`
- `guides`
  - `fr`: `guides`

- Evidence:
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L119)
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L209)

### Hardcoded English public route
The apartment booking landing route is currently hardcoded as `book-private-accommodations` for every locale. This is a true public-route localization gap, not just an internal folder-name detail.

- Evidence:
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L96)
  - [apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx](/Users/petercowling/base-shop/apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx#L19)
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L169)

### Dynamic room-slug contract
Dorm room detail pages use a separate per-locale slug map. This is already localized for many Latin-script locales, but the file explicitly states that non-Latin-script languages use English slugs.

- `ja`, `ko`, `zh`, `ar`, `hi` currently expose English room slugs for all `9/9` public dorm detail pages.
- `vi` is localized for room detail slugs.

- Evidence:
  - [packages/ui/src/config/roomSlugs.ts](/Users/petercowling/base-shop/packages/ui/src/config/roomSlugs.ts#L1)
  - [packages/ui/src/config/roomSlugs.ts](/Users/petercowling/base-shop/packages/ui/src/config/roomSlugs.ts#L8)

### Dynamic guide/article slug contract
Guide slugs are generated from localized guide labels when available, but they fall back to the English slug when the locale label is missing or placeholder. This means guide localization quality depends directly on guide-label completeness.

- Runtime audit on 2026-03-06 showed `29-30` of `119` live guide slugs still matching English in every non-English locale checked.
- The main cluster is transport and logistics guides, such as `positano-sorrento-bus`, `capri-positano-ferry`, `positano-naples-center-ferry`, plus assistance pages like `groceries-and-pharmacies-positano`.

- Evidence:
  - [apps/brikette/src/guides/slugs/slugs.ts](/Users/petercowling/base-shop/apps/brikette/src/guides/slugs/slugs.ts#L29)
  - [apps/brikette/src/guides/slugs/slugs.ts](/Users/petercowling/base-shop/apps/brikette/src/guides/slugs/slugs.ts#L35)

## Current Top-Level Localized Route Examples
- Italian:
  - `/it/prenota`
  - `/it/camere`
  - `/it/offerte`
  - `/it/assistenza`
  - `/it/come-arrivare`
  - `/it/camere-private`
- Spanish:
  - `/es/reservar`
  - `/es/habitaciones`
  - `/es/ofertas`
  - `/es/ayuda`
  - `/es/como-llegar`
  - `/es/habitaciones-privadas`
- German:
  - `/de/buchen`
  - `/de/zimmer`
  - `/de/angebote`
  - `/de/hilfe`
  - `/de/anfahrt`
  - `/de/privatzimmer`
- Arabic:
  - `/ar/hajz`
  - `/ar/ghuraf`
  - `/ar/urood`
  - `/ar/musaada`
  - `/ar/kayfa-tasil`
  - `/ar/ghuraf-khassa`

- Evidence:
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L7)

## Tests and Coverage
- Existing tests and route tooling already validate that the localized public route inventory is wired into SEO and redirect coverage flows.
- The route inventory and generated redirect coverage do not currently prove that every non-English public slug is non-English; they only prove coverage and routability.

- Evidence:
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L85)
  - [apps/brikette/scripts/verify-url-coverage.ts](/Users/petercowling/base-shop/apps/brikette/scripts/verify-url-coverage.ts#L8)

## Unknowns / Follow-ups
- Unknown: whether `privacy-policy` and `cookie-policy` are intentionally frozen for legal/compliance discoverability or simply unfinished localization.
  - How to verify: inspect commit history or product/SEO decision notes for [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L278)
- Unknown: whether French `experiences` and `guides` should be treated as acceptable shared spellings or be forced into different ASCII-safe variants.
  - How to verify: product decision plus native-speaker review of [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L119)
- Unknown: whether the apartment booking route should be represented as a real localized slug key instead of a standalone hardcoded route.
  - How to verify: trace all consumers of `book-private-accommodations` via `rg "book-private-accommodations" apps/brikette/src apps/brikette/scripts`

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - [apps/brikette/src/slug-map.ts](/Users/petercowling/base-shop/apps/brikette/src/slug-map.ts#L7)
  - [apps/brikette/src/routing/routeInventory.ts](/Users/petercowling/base-shop/apps/brikette/src/routing/routeInventory.ts#L85)
  - [apps/brikette/src/middleware.ts](/Users/petercowling/base-shop/apps/brikette/src/middleware.ts#L122)
  - [apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx](/Users/petercowling/base-shop/apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx#L19)
  - [packages/ui/src/config/roomSlugs.ts](/Users/petercowling/base-shop/packages/ui/src/config/roomSlugs.ts#L8)
  - [apps/brikette/src/guides/slugs/slugs.ts](/Users/petercowling/base-shop/apps/brikette/src/guides/slugs/slugs.ts#L12)
- Key risks:
  - Changing public slugs without a deliberate redirect matrix will create SEO and deep-link breakage.
  - The apartment booking route is wired into redirects and link generation in multiple places, so it should not be renamed opportunistically.
  - Guide slugs are derived from content labels, so route localization and content localization are coupled.
