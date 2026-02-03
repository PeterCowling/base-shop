---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: CMS
Created: 2026-01-27
Last-updated: 2026-01-27
Topic-Slug: guide-areas-comparison
---

# Guide Areas Comparison Briefing

## Executive Summary

The three guide areas (how-to-get-here, help/assistance, experiences) share a **unified guide system** for slug resolution, namespace routing, and URL generation. However, **how-to-get-here has a hybrid rendering architecture** that differs from the other two areas.

After the recent migration (see `docs/plans/how-to-get-here-guides-migration-plan.md`), all three areas now:
- Use the same guide key registry (`GUIDES_INDEX`)
- Use the same slug resolution (`resolveGuideKeyFromSlug`, `guideSlug`)
- Use the same namespace routing (`guideNamespace`, `guidePath`)
- Participate in tag discovery

The key **remaining difference** is that how-to-get-here transport routes still use a **legacy content renderer** (`HowToGetHereContent`) while assistance and experiences use the **unified guide renderer** (`GuideSeoTemplate`).

## Questions Answered

- Q1: How does slug resolution work for each area?
- Q2: How does URL routing differ between areas?
- Q3: What content renderers are used?
- Q4: What content sources are used?
- Q5: What inconsistencies remain after the migration?

## High-Level Architecture

### Components

| Component | Path | Role |
|-----------|------|------|
| `guideNamespace()` | `src/guides/slugs/namespaces.ts` | Determines `baseKey` (howToGetHere/assistance/experiences) for URL path |
| `GUIDE_BASE_KEY_OVERRIDES` | `src/guides/slugs/namespaces.ts` | Maps guide keys to their base area |
| `GUIDE_SLUG_OVERRIDES` | `src/guides/slugs/overrides.ts` | Explicit slug mappings per language |
| `GUIDES_INDEX` | `src/data/guides.index.ts` | Central registry of all guides with tags and status |
| `resolveGuideKeyFromSlug()` | `src/guides/slugs/urls.ts` | Reverse lookup: slug → guide key |
| `guidePath()` | `src/guides/slugs/urls.ts` | Forward lookup: guide key → full URL path |

### Data Stores

| Store | Used By | Format |
|-------|---------|--------|
| `guides` i18n namespace | experiences, assistance | JSON (via i18next) |
| `howToGetHere` i18n namespace | how-to-get-here (legacy renderer) | JSON (via i18next) |
| `routes.json` | how-to-get-here transport routes | JSON (route definitions) |
| locale content files | how-to-get-here transport routes | `src/locales/{lang}/how-to-get-here/routes/*.json` |

## End-to-End Flow

### Unified Flow (Assistance & Experiences)

```
Request: /en/experiences/path-of-the-gods
                    ↓
[lang]/experiences/[slug]/page.tsx
                    ↓
resolveGuideKeyFromSlug("path-of-the-gods", "en") → "pathOfTheGods"
                    ↓
guideNamespace("en", "pathOfTheGods") → { baseKey: "experiences", baseSlug: "experiences" }
                    ↓
Validate: baseKey === "experiences" ✓
                    ↓
<GuideContent lang="en" guideKey="pathOfTheGods" />
                    ↓
<GuideSeoTemplate /> (loads content from `guides` i18n namespace)
```

**Evidence:** `src/app/[lang]/experiences/[slug]/page.tsx:95-108`, `src/app/[lang]/assistance/[article]/page.tsx:85-95`

### Hybrid Flow (How-To-Get-Here)

```
Request: /en/how-to-get-here/amalfi-positano-bus
                    ↓
[lang]/how-to-get-here/[slug]/page.tsx
                    ↓
getRouteDefinition("amalfi-positano-bus") → RouteDefinition ✓
                    ↓
getContentForRoute("en", "howToGetHereAmalfiPositanoBus")
                    ↓
<HowToGetHereContent /> (legacy renderer, loads from locale content files)
```

**Fallback path (when no route definition exists):**
```
getRouteDefinition(slug) → undefined
                    ↓
resolveGuideKeyFromSlug(slug, lang) → guideKey
                    ↓
guideNamespace(lang, guideKey) → { baseKey: "howToGetHere" } ✓
                    ↓
<GuideContent /> → <GuideSeoTemplate /> (unified renderer)
```

**Evidence:** `src/app/[lang]/how-to-get-here/[slug]/page.tsx:147-186`

## Data & Contracts

### Key Types/Schemas

| Type | Location | Purpose |
|------|----------|---------|
| `GuideKey` | `src/guides/slugs/keys.ts` | Union type of all valid guide keys |
| `GuideMeta` | `src/data/guides.index.ts` | Guide index entry with key, section, tags, status |
| `GuideSection` | `src/data/guides.index.ts` | `"help" | "experiences"` |
| `RouteDefinition` | `src/lib/how-to-get-here/definitions.ts` | How-to-get-here route schema |

### Source of Truth

| Data | Source | Notes |
|------|--------|-------|
| Guide keys | `GUIDE_KEYS` in `src/guides/slugs/keys.ts` | Includes all areas |
| Guide metadata | `GUIDES_INDEX` in `src/data/guides.index.ts` | Central registry |
| How-to-get-here route slugs | `HOW_TO_GET_HERE_ROUTE_GUIDES` in `src/data/how-to-get-here/routeGuides.ts` | Canonical mapping (TASK-01) |
| Route definitions | `src/data/how-to-get-here/routes.json` | Transport route content bindings |

## Configuration, Flags, and Operational Controls

### GUIDES_INDEX Section Values

| Section | Meaning | Used For |
|---------|---------|----------|
| `"experiences"` | Experience/activity guides | Experiences area |
| `"help"` | Help/assistance guides | Assistance AND how-to-get-here areas |

**Important:** The `section` field does NOT determine routing. Routing is determined by `guideNamespace()` which uses `GUIDE_BASE_KEY_OVERRIDES`.

### Base Key Overrides

The `GUIDE_BASE_KEY_OVERRIDES` map determines which URL path a guide is served under:
- Keys mapped to `"howToGetHere"` → `/[lang]/how-to-get-here/[slug]`
- Keys mapped to `"assistance"` → `/[lang]/assistance/[slug]`
- Default (no override) → `/[lang]/experiences/[slug]`

## Differences Summary

| Aspect | Experiences | Assistance | How-To-Get-Here |
|--------|-------------|------------|-----------------|
| **Base URL** | `/[lang]/experiences/[slug]` | `/[lang]/assistance/[slug]` | `/[lang]/how-to-get-here/[slug]` |
| **Page route** | `[lang]/experiences/[slug]/page.tsx` | `[lang]/assistance/[article]/page.tsx` | `[lang]/how-to-get-here/[slug]/page.tsx` |
| **Renderer** | `GuideContent` → `GuideSeoTemplate` | `GuideContent` → `GuideSeoTemplate` | **Hybrid:** `HowToGetHereContent` OR `GuideContent` |
| **Content source** | `guides` i18n namespace | `guides` i18n namespace | `routes.json` + locale files OR `guides` namespace |
| **GUIDES_INDEX section** | `"experiences"` | `"help"` | `"help"` |
| **Slug resolution** | Unified | Unified | Unified |
| **URL generation** | Unified | Unified | Unified |

## Inconsistencies Found

### 1. Dual Rendering Path for How-To-Get-Here

**What:** The 24 transport routes use `HowToGetHereContent` while other how-to-get-here guides (e.g., `chiesaNuovaArrivals`) can fall back to `GuideSeoTemplate`.

**Impact:**
- Different styling and layout between transport routes and other guides in the same area
- Different structured data generation (HowTo JSON-LD vs. Article)
- Different content loading mechanisms

**Evidence:** `src/app/[lang]/how-to-get-here/[slug]/page.tsx:150-158`

### 2. Section vs. Base Key Mismatch

**What:** GUIDES_INDEX uses `section: "help"` for both assistance AND how-to-get-here guides, but they're served under different URL paths.

**Impact:** The `section` field is misleading - it doesn't indicate the URL path. The actual routing is determined by `GUIDE_BASE_KEY_OVERRIDES`.

**Why it exists:** Historical artifact - `section` was added before the namespace routing system.

### 3. Heading Weight Styling

**What:** `GuideSeoTemplate` applies different heading weights based on section:
- `experiences` → `prose-headings:font-bold`
- `help` → `prose-headings:font-semibold`

**Impact:** Assistance and how-to-get-here guides (both `section: "help"`) render with semibold headings, while experiences render with bold headings.

**Evidence:** `src/routes/guides/_GuideSeoTemplate.tsx:94-97`

### 4. Content Namespace Split

**What:**
- Unified guides use `guides` i18n namespace
- How-to-get-here transport routes use `howToGetHere` i18n namespace

**Impact:** Content is stored in different locations:
- Unified: `src/locales/{lang}/guides/*.json`
- How-to-get-here routes: `src/locales/{lang}/how-to-get-here/routes/*.json`

## If You Later Want to Change This (Non-plan)

### Option A: Full Content Migration

**Goal:** Migrate how-to-get-here transport route content to the unified guide format.

**Likely change points:**
- Convert 24 × 18 = 432 locale files from route format to guide format
- Remove `routes.json` dependency
- Remove `HowToGetHereContent` renderer
- Update page.tsx to remove hybrid logic

**Key risks:**
- SEO impact from content structure changes
- Loss of HowTo JSON-LD structured data
- Chiesa Nuova drop-in component integration

### Option B: Renderer Unification

**Goal:** Keep content separate but unify rendering through `GuideSeoTemplate`.

**Likely change points:**
- Create content adapter to transform route content into guide format
- Remove `HowToGetHereContent`
- Preserve route-specific features (galleries, callouts) in GuideSeoTemplate

**Key risks:**
- Feature parity (galleries, Chiesa Nuova integration)
- Structured data handling

### Evidence-based Constraints

- URLs must be preserved (SEO critical) - already achieved via GUIDE_SLUG_OVERRIDES
- Transport routes are already live and indexed
- How-to-get-here index page has dedicated filter UI that depends on route metadata
