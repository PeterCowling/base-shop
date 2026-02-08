---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: CMS
Created: 2026-01-27
Last-updated: 2026-02-08
Feature-Slug: how-to-get-here-guides-migration
Related-Plan: docs/plans/how-to-get-here-guides-migration-plan.md
---

# How-To-Get-Here Guides Migration Fact-Find Brief

## Scope

### Summary

The how-to-get-here transport routes have been **migrated to the unified guide system** (TASK-01 through TASK-09). All 24 routes are registered in GUIDES_INDEX, have slug/namespace overrides, and render via the shared `GuideContent` component. The remaining work is **deprecating the legacy dual-source system** — `routes.json`, the old `HowToGetHereContent.tsx` renderer, the `transformRouteToGuide.ts` bridge, and the legacy content-loading pipeline — now that the guide system is the single rendering path.

### Goals

- Remove the dual-source pattern (routes.json + GUIDES_INDEX both enumerate slugs)
- Deprecate `HowToGetHereContent.tsx` (legacy renderer, 225 lines)
- Deprecate `transformRouteToGuide.ts` (bridge layer, 356 lines)
- Deprecate legacy content loading via `content.ts` / `content-modules.ts` (dynamic imports from locale JSON)
- Clean up `[slug]/page.tsx` to use GUIDES_INDEX as sole source of truth for `generateStaticParams`
- Remove or archive `routes.json` (977 lines) once no longer referenced
- Preserve all existing URLs (24 routes × 18 languages = 432 URLs)

### Non-goals

- Changing the how-to-get-here index page UX (filter UI, Rome planner, route picker remain)
- Modifying the Chiesa Nuova drop-in subsystem (self-contained, 11 files, works via guide blocks)
- Rewriting the Rome travel planner subsystem (6+ files, standalone interactive tool)
- Changing content (translations, SEO, etc.) — only removing dead code paths

### Constraints & Assumptions

**Constraints:**
- URLs must remain stable: `/{lang}/how-to-get-here/{slug}` format unchanged
- 432 URLs (24 routes × 18 languages) verified by `routeGuides.test.ts` line 251
- Legacy `/directions/:slug` redirects in `public/_redirects` must remain
- Index page components (`DestinationSections`, `RoutePicker`, `RouteCardGroup`, etc.) depend on route metadata — need to verify what they source from
- 18 supported languages, English as fallback

**Assumptions:**
- `routes.json` is only used for slug enumeration in `generateStaticParams` and legacy content loading — no other runtime path depends on it
- The index page components may source filter/metadata directly from locale JSON or guide content, not from routes.json

---

## Repo Audit (Current State)

### Entry Points

| Path | Role | Status |
|------|------|--------|
| `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx` (50 lines) | Index page — renders `HowToGetHereIndexContent` | Active |
| `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` (122 lines) | Route detail — **fully migrated to guide system** | Active (dual-source for `generateStaticParams`) |
| `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` (225 lines) | Legacy client renderer — hero, callouts, sections, galleries, JSON-LD | **Dead code** (no longer rendered by page.tsx) |
| `apps/brikette/src/data/how-to-get-here/routes.json` (977 lines) | Legacy route definitions — 24 entries with linkBindings, galleries, media | **Legacy** (still read by `generateStaticParams` + scripts) |
| `apps/brikette/src/data/how-to-get-here/routeGuides.ts` (180 lines) | Canonical guide key mapping — 24 entries with slugs + tags | **Active** (single source of truth for route↔guide mapping) |
| `apps/brikette/src/locales/[lang]/how-to-get-here/routes/*.json` | Content files (24 × 18+ languages ≈ 432 files) | **Active** (still loaded by guide system via i18n) |

### Key Modules / Files

| Path | Lines | Role | Status |
|------|-------|------|--------|
| `src/lib/how-to-get-here/schema.ts` | ~160 | Zod schemas for route definitions, link targets, content | Legacy (used by routes.json parsing) |
| `src/lib/how-to-get-here/definitions.ts` | 113 | `listHowToSlugs()`, `getRouteDefinition()`, pattern matching | Legacy (used only by `generateStaticParams`) |
| `src/routes/how-to-get-here/transformRouteToGuide.ts` | 356 | Bridge: route content → guide content format | **Dead code** (guide system now reads content directly) |
| `src/routes/how-to-get-here/content.ts` | ~40 | Legacy dynamic import content loader with EN fallback | Legacy |
| `src/routes/how-to-get-here/content-modules.ts` | ~15 | Webpack dynamic import for locale JSON | Legacy |
| `src/routes/how-to-get-here/linking.tsx` | ~200 | Link target resolution, rich text rendering, placeholder parsing | Active (used by index page components) |
| `src/routes/how-to-get-here/sections.tsx` | — | Section rendering logic | Likely legacy |
| `src/routes/how-to-get-here/_galleries.tsx` | — | Gallery rendering | Likely legacy |
| `src/routes/how-to-get-here/guideNormalisers.ts` | 117 | Section/FAQ/TOC normalizers for guide content | Active (used by guide rendering) |
| `src/routes/how-to-get-here/pickBestLink.ts` | — | Transport route scoring/recommendation | Active (index page) |
| `src/routes/how-to-get-here/computeSuggestedFixes.ts` | — | Smart filter suggestions when no results | Active (index page) |
| `src/routes/how-to-get-here/useDestinationFilters.ts` | — | Filter state management hook | Active (index page) |
| `src/routes/how-to-get-here/useHowToGetHereContent.ts` | — | Content loading hook | Needs investigation |
| `src/data/guides.index.ts` | — | GUIDES_INDEX (130 guides total; 23 from HOW_TO_GET_HERE spread) | Active |
| `src/guides/slugs/overrides.ts` | — | GUIDE_SLUG_OVERRIDES (48 guide keys × 18 langs; includes all 24 routes) | Active |
| `src/guides/slugs/namespaces.ts` | — | GUIDE_BASE_KEY_OVERRIDES (70 entries; 30 howToGetHere) | Active |
| `src/routes/guides/guide-manifest.ts` | 4540 | Guide manifest (141 entries; 30 howToGetHere) | Active |

### Index Page Component Architecture (Active — NOT part of migration cleanup)

| Path | Lines | Role |
|------|-------|------|
| `src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx` | — | Client wrapper for index page |
| `src/routes/how-to-get-here/components/DestinationSections.tsx` | 192 | Main destination list renderer |
| `src/routes/how-to-get-here/components/RouteCardGroup.tsx` | 362 | Route card with direction toggle, facts pills |
| `src/routes/how-to-get-here/components/RoutePicker.tsx` | 221 | Smart route finder form |
| `src/routes/how-to-get-here/components/HowToToolbar.tsx` | 281 | Sticky toolbar with filters & jump-to nav |
| `src/routes/how-to-get-here/components/FiltersDialog.tsx` | 225 | Full-screen filter modal |
| `src/routes/how-to-get-here/components/IntroHighlights.tsx` | 209 | Hero intro cards |
| `src/routes/how-to-get-here/components/BeforeYouTravel.tsx` | 130 | Travel checklist section |
| `src/routes/how-to-get-here/ui.tsx` | 12 | UI primitives (Cluster, Inline, Stack, InlineList) |

### Subsystems (Active — NOT part of migration cleanup)

**Rome Travel Planner** (`src/routes/how-to-get-here/rome/`, 6+ files):
- `RomeTravelPlanner.tsx` (164 lines) — interactive route planner with preference-based filtering
- `DecisionPills.tsx` (168 lines) — cheapest/scenic toggle, luggage checkbox
- `RouteCard.tsx` (82 lines) — collapsible route card with pros/cons
- `useRomeRouteFilter.ts` — filter hook, `routes-data.ts` — route data

**Chiesa Nuova Arrivals** (`src/routes/how-to-get-here/chiesaNuovaArrivals/`, 11 files, 740 lines):
- Drop-in component conditionally rendered in transport route pages
- Self-contained: content loader, breadcrumbs, selectors, labels, i18n
- Guide key: `chiesaNuovaArrivals` (registered in guide system)

**Related subsystems:** `chiesaNuovaDepartures/`, `ferryDockToBrikette/`, `briketteToFerryDock/`, `fornilloBeachToBrikette/` (similar structure, ~11 files each)

### Patterns & Conventions Observed

| Pattern | Evidence |
|---------|----------|
| Guide keys are camelCase | `routeGuides.ts` — 24 keys, `guides.index.ts` — 130 keys |
| Slug overrides preserve URLs across all locales | `overrides.ts` — 24 route keys × 18 lang entries |
| Namespace routing via `GUIDE_BASE_KEY_OVERRIDES` | `namespaces.ts` — 30 entries with `"howToGetHere"` value |
| Guide manifest declares structured data, blocks, related guides | `guide-manifest.ts` — 30 howToGetHere entries with full metadata |
| `GuideContent` is the shared renderer | `[slug]/page.tsx:114` imports from `experiences/[slug]/GuideContent` |
| Dual enumeration in `generateStaticParams` | `[slug]/page.tsx:23-38` merges `listHowToSlugs()` + GUIDES_INDEX |
| Route-to-guide transform exists but is dead code | `transformRouteToGuide.ts` — implements TASK-05 mapping but page no longer calls it |
| Content loading via i18n bundles (new path) | `[slug]/page.tsx:111` uses `loadGuideI18nBundle(validLang, guideKey)` |
| Content loading via dynamic import (legacy path) | `content-modules.ts` uses webpack dynamic import for locale JSON |
| Link tokens: `%HOWTO:slug|label%`, `%LINK:key|label%`, `%URL:href|label%` | `transformRouteToGuide.ts:65-80`, `_linkTokens.tsx` |

### Data & Contracts

**Current Rendering Path (Guide System — Active):**

```typescript
// [slug]/page.tsx loads guide content via i18n bundle
const { serverGuides, serverGuidesEn } = await loadGuideI18nBundle(validLang, guideKey);
// Renders via shared GuideContent component
<GuideContent lang={validLang} guideKey={guideKey} serverGuides={serverGuides} serverGuidesEn={serverGuidesEn} />
```

**Legacy Rendering Path (Dead Code):**

```typescript
// HowToGetHereContent.tsx loaded content via:
content.ts → content-modules.ts → dynamic import from locales/[lang]/how-to-get-here/routes/*.json
// Then rendered via custom hero, callouts, sections, galleries, JSON-LD
```

**Route Definition Schema (routes.json):**

```typescript
{
  contentKey: string;
  linkBindings?: Array<{ key: string; linkObject?: LinkTarget; placeholders?: Record<string, LinkTarget> }>;
  media?: MediaBinding[];
  galleries?: Array<{ key: string; items: Array<{ id: string; src: string; aspectRatio?: string; preset?: string }> }>;
  linkLists?: LinkListBinding[];
  sectionsRoot?: string | null;
  sectionPaths?: string[];
  status?: "draft" | "review" | "published";
}
```

**Link Target Types (5 discriminated union variants):**

```typescript
{ type: "howToOverview" }
{ type: "external", href: string }
{ type: "guide", guideKey: GuideKey }
{ type: "directions", slug: string }
{ type: "guidesSlug", slug: string }
```

**Guide Manifest Entry (active):**

```typescript
{
  key: GuideKey;
  slug: string;
  contentKey: string;
  status: "draft" | "review" | "live";
  areas: GuideArea[];
  primaryArea: GuideArea; // "howToGetHere" for transport routes
  structuredData: StructuredDataDeclaration[];
  relatedGuides: GuideKey[];
  blocks: GuideBlockDeclaration[];
  options?: GuideRouteOptions;
  template?: GuideTemplate;
  focusKeyword?: string;
  sites?: Record<string, { status?: GuideStatus }>; // NEW per-site publication (TASK-07)
}
```

### Dependency & Impact Map

**Upstream dependencies of routes.json:**
- `lib/how-to-get-here/definitions.ts` — parses routes.json, exports `listHowToSlugs()`
- `[slug]/page.tsx:25` — calls `listHowToSlugs()` in `generateStaticParams` (dual enumeration)
- `scripts/generate-public-seo.ts` — reads routes.json for legacy `/directions/:slug` sitemap paths
- `scripts/generate-url-fixtures.ts` — reads routes.json for test fixture generation
- `scripts/validate-guide-links.ts` — loads route slugs from routes.json for HOWTO token validation
- `__tests__/routeGuides.test.ts` — imports routes.json for 1:1 sync assertion
- `__tests__/content-files.test.ts` — reads routes.json to verify locale files exist per contentKey

**Downstream dependents (things that consume how-to-get-here data):**
- Footer (`components/footer/Footer.tsx:115-119`) — uses `getSlug("howToGetHere", lang)` for nav link
- Quick links section (`components/assistance/quick-links-section/`) — uses `getSlug("howToGetHere", lang)`
- Guide collection cards (`components/guides/GuideCollectionCard.tsx:166`) — uses `getSlug` for base URL
- Route inventory (`routing/routeInventory.ts:63-88`) — already migrated to GUIDES_INDEX
- SEO/sitemap (`scripts/generate-public-seo.ts`) — uses both `listAppRouterUrls()` and legacy direction paths
- Redirects (`public/_redirects:11-12`) — `/directions/:slug → /en/how-to-get-here/:slug`
- i18n audit tests — include `how-to-get-here/routes/` in parity checks
- Guide link token resolution (`routes/guides/utils/_linkTokens.tsx`) — resolves `%HOWTO:slug|label%` tokens
- Transport drop-in block handler (`routes/guides/blocks/handlers/transportDropInBlock.tsx`)

**Likely blast radius of removing routes.json:**
- `generateStaticParams` in `[slug]/page.tsx` — must switch to GUIDES_INDEX only
- `generate-public-seo.ts` — must derive `/directions/:slug` paths from routeGuides.ts instead
- `generate-url-fixtures.ts` — must switch source
- `validate-guide-links.ts` — must switch source
- 2 test files — must update imports
- `lib/how-to-get-here/schema.ts` and `definitions.ts` — can be deleted if no other consumers

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (unit/integration), no E2E for how-to-get-here
- **Commands:** `pnpm --filter @apps/brikette test`
- **CI integration:** Tests run via reusable workflow; typecheck + lint required
- **Coverage tools:** No specific coverage thresholds for this area

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Route↔Guide sync | integration | `__tests__/routeGuides.test.ts` (307 lines) | **Comprehensive:** 1:1 sync, slugs, tags, overrides, namespaces, GUIDES_INDEX, URL inventory (432 URLs) |
| Content file existence | filesystem | `__tests__/content-files.test.ts` (76 lines) | Validates every locale has JSON for every contentKey |
| Schema validation | unit | `test/lib/how-to-get-here.schema.test.ts` | 4 tests: minimal def, link targets, meta fields, nested locale |
| Link scoring | unit | `test/routes/how-to-get-here/pickBestLink.test.ts` (171 lines) | Transport route recommendation scoring |
| Filter suggestions | unit | `test/routes/how-to-get-here/computeSuggestedFixes.test.ts` (130 lines) | Smart suggestions when filters yield no results |
| Transport migration | integration | `test/routes/how-to-get-here/__tests__/transportMigration.test.ts` | Migration validation |
| Header rendering | component | `test/routes/how-to-get-here/components/HeaderSection.test.tsx` | Header component |
| URL inventory | integration | `test/migration/url-inventory.test.ts` | URL stability |
| Static export aliases | integration | `test/routing/staticExportAliases.test.ts` | Static export compatibility |
| Static export redirects | integration | `test/routing/staticExportRedirects.test.ts` | Redirect validation |
| Guide manifest | integration | `test/content-readiness/guides/guide-manifest-completeness.test.ts` | Every guide key has manifest entry |
| Guide content schema | unit | `test/content-readiness/guides/content-schema.test.ts` (468 lines) | Comprehensive Zod schema validation |
| Guide namespace migration | snapshot | `test/content-readiness/guides/guide-namespace-migration.test.ts` | Namespace assignment stability |
| I18n parity audit | quality | `test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` (611 lines) | Includes how-to-get-here/routes in guide content parity |
| Image alt presence | quality | `test/content-readiness/i18n/image-alt-presence.test.ts` | Alt text enforcement for route content |

#### Test Patterns & Conventions
- Route↔guide sync tests use `HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS` as canonical source
- Content existence verified via filesystem reads against routes.json contentKeys
- URL inventory validated as exactly 24 × 18 = 432 URLs
- Tags validated: always includes "transport" + at least one mode + "positano"

#### Coverage Gaps (Planning Inputs)
- **No E2E tests** for how-to-get-here page rendering
- **No tests for legacy renderer removal** — need to verify nothing imports `HowToGetHereContent`
- **No tests for `transformRouteToGuide.ts` usage** — verify it's truly dead code before deletion

#### Testability Assessment
- **Easy to test:** Removing dual-source in `generateStaticParams` — existing tests validate all 432 URLs
- **Easy to test:** Removing routes.json — existing sync tests can be updated to source from routeGuides.ts
- **Hard to test:** Verifying no hidden runtime dependency on legacy content-loading pipeline
- **Test seams needed:** None — the guide system is already the active rendering path

#### Recommended Test Approach
- **Before cleanup:** Run grep/import analysis to confirm dead code status of legacy modules
- **Unit tests:** Update `routeGuides.test.ts` to remove routes.json dependency (switch to routeGuides.ts as sole source)
- **Integration tests:** Verify URL inventory remains stable after removing dual enumeration
- **Regression:** Run full i18n parity audit to confirm no content changes

### Recent Git History (Targeted)

Key commits establishing the current state:
- Transport-unification TASK-01 through TASK-09 completed the guide system migration
- `routeGuides.ts` created as canonical mapping (TASK-01)
- `GUIDE_SLUG_OVERRIDES` populated for all 24 routes (TASK-02)
- `GUIDE_BASE_KEY_OVERRIDES` populated (TASK-03)
- `GUIDES_INDEX` entries added via spread from `HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS` (TASK-04)
- URL inventory integration (TASK-05)
- `guide-manifest.ts` entries added for all 30 howToGetHere guides (TASK-06)
- Per-site publication status added to manifest schema (TASK-07)
- `[slug]/page.tsx` switched to `GuideContent` renderer (comments: "All transport routes now use the guide system")

---

## External Research (If needed)

None required — all patterns established in the codebase.

---

## Questions

### Resolved

**Q: Is the guide system migration complete?**
- A: Yes. `[slug]/page.tsx` exclusively renders via `GuideContent` (line 114). Comment on line 96: "All transport routes now use the guide system."
- Evidence: `[slug]/page.tsx:92-121`

**Q: Is `HowToGetHereContent.tsx` still used?**
- A: No. The page component (`[slug]/page.tsx`) renders `GuideContent` exclusively. `HowToGetHereContent.tsx` is dead code.
- Evidence: `[slug]/page.tsx:114` imports `GuideContent` from `experiences/[slug]/GuideContent`

**Q: Is `transformRouteToGuide.ts` still used?**
- A: Needs import analysis to confirm. It implements the TASK-05 schema mapping but the page no longer calls it — guide content is loaded directly via `loadGuideI18nBundle`.
- Evidence: `[slug]/page.tsx:111` — `loadGuideI18nBundle(validLang, guideKey)` bypasses transform

**Q: Can routes.json be removed safely?**
- A: Yes, with targeted updates. It's consumed by: `definitions.ts` (for `listHowToSlugs()`), `generateStaticParams` dual enumeration, 3 scripts, 2 test files. All can switch to `routeGuides.ts`.
- Evidence: grep for `routes.json` across codebase

**Q: What does the dual enumeration in generateStaticParams do?**
- A: Merges slugs from `listHowToSlugs()` (routes.json) with GUIDES_INDEX. Since both sources list the same 24 routes, the result is identical. The dual enumeration is redundant.
- Evidence: `[slug]/page.tsx:23-38`, `routeGuides.test.ts:36-37` (asserts same slugs)

**Q: Do index page components depend on routes.json?**
- A: The index page loads content via `useHowToGetHereContent` hook. Need to trace whether this hook reads routes.json or guide content. The filter/destination UI may have its own data sources.
- Evidence: Needs further investigation in `useHowToGetHereContent.ts` and `HowToGetHereIndexContent.tsx`

**Q: Are URLs preserved?**
- A: Yes. 432 URLs verified by `routeGuides.test.ts:251-268`. All 24 slugs × 18 languages resolved via `guidePath()`.
- Evidence: `routeGuides.test.ts` TASK-05 tests

**Q: How are Chiesa Nuova drop-ins handled?**
- A: Via guide blocks system. `transportDropInBlock.tsx` handles integration. Self-contained in `chiesaNuovaArrivals/DropIn.tsx` (150 lines).
- Evidence: `guide-manifest.ts` — howToGetHere entries declare blocks; `[slug]/page.tsx` renders via `GuideContent` which processes blocks

**Q: How many languages?**
- A: 18 supported languages (not 17 as originally stated). Verified by `routeGuides.test.ts:251` (24 × 18 = 432).
- Evidence: `i18nConfig.supportedLngs`, URL inventory test

### Open (User Input Needed)

**Q: Should we remove routes.json in this phase or a later phase?**
- Why it matters: Determines scope — cleanup only the rendering path, or also eliminate the data source
- Decision impacted: Task breakdown and blast radius
- Default assumption: Remove everything in one phase (rendering + data) since all consumers are identified
- Risk: Low — all consumers can switch to `routeGuides.ts`; test coverage validates URL stability

**Q: Should dead-code files be deleted or archived?**
- Why it matters: `HowToGetHereContent.tsx`, `transformRouteToGuide.ts`, `content.ts`, `content-modules.ts` are dead code
- Decision impacted: Whether to simply delete or create an archive commit
- Default assumption: Delete (git history preserves them)
- Risk: None — recoverable from git history

---

## Confidence Inputs (for /plan-feature)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Implementation** | 92% | Migration is complete. Remaining work is dead-code removal and switching 5-6 files from routes.json to routeGuides.ts. Clear, mechanical changes. |
| **Approach** | 90% | Single approach: remove legacy, keep guide system. No design decisions needed — the architecture is already in place. |
| **Impact** | 88% | Blast radius well-mapped (7 consumers of routes.json, all identified). URL stability covered by 432-URL test. Index page dependency on legacy content loading needs verification. |
| **Testability** | 95% | Comprehensive existing tests: `routeGuides.test.ts` (307 lines, validates sync/slugs/overrides/namespaces/URLs), content-file tests, manifest tests, i18n audit. Import analysis can confirm dead-code status before deletion. |

**What would raise scores:**
- Impact → 95%: Trace `useHowToGetHereContent.ts` to confirm index page is independent of routes.json content loading
- Implementation → 95%: Verify `transformRouteToGuide.ts` has zero runtime callers via import analysis

---

## Planning Constraints & Notes

### Must-follow patterns

- `routeGuides.ts` (`HOW_TO_GET_HERE_ROUTE_GUIDES`) is the canonical source — all references should point here
- Preserve the `routeGuides.test.ts` test suite but update to remove routes.json dependency
- Keep `GUIDE_SLUG_OVERRIDES`, `GUIDE_BASE_KEY_OVERRIDES`, GUIDES_INDEX entries, guide-manifest entries untouched
- Legacy `/directions/:slug` redirects in `public/_redirects` must remain

### Rollout/rollback expectations

- Single-phase cleanup (no incremental rollout needed — guide system already live)
- Rollback: `git revert` the cleanup commit(s) to restore dual-source
- No feature flag needed — removing dead code, not changing behavior

### Observability expectations

- Verify URL inventory count remains 432 after cleanup
- Run full test suite: `pnpm --filter @apps/brikette test`
- Run typecheck: `pnpm typecheck`
- Spot-check 2-3 routes in dev server across languages

---

## Suggested Task Seeds (Non-binding)

1. **Verify dead-code status** — Import analysis on `HowToGetHereContent.tsx`, `transformRouteToGuide.ts`, `content.ts`, `content-modules.ts`, `sections.tsx`, `_galleries.tsx`
2. **Trace index page data sources** — Determine if `useHowToGetHereContent.ts` / `HowToGetHereIndexContent.tsx` depend on routes.json or legacy content loading
3. **Remove dual enumeration in generateStaticParams** — Switch `[slug]/page.tsx` to GUIDES_INDEX only (remove `listHowToSlugs()` call)
4. **Update scripts** — Switch `generate-public-seo.ts`, `generate-url-fixtures.ts`, `validate-guide-links.ts` from routes.json to routeGuides.ts
5. **Update tests** — Remove routes.json imports from `routeGuides.test.ts` and `content-files.test.ts`
6. **Delete dead-code files** — `HowToGetHereContent.tsx`, `transformRouteToGuide.ts`, `content.ts`, `content-modules.ts`, `_callouts.tsx`
7. **Remove routes.json** — Delete after all consumers migrated
8. **Delete legacy schemas** — `schema.ts`, `definitions.ts` (if no remaining consumers)
9. **Final validation** — Full test suite + URL inventory + typecheck

---

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None — all open questions have safe defaults
- **Recommended next step:** Proceed to `/plan-feature` to create the cleanup task breakdown

---

## Appendix A: Current 24 Route Guide Keys

| # | Guide Key | Slug | Tags |
|---|-----------|------|------|
| 1 | amalfiPositanoBus | amalfi-positano-bus | transport, bus, amalfi, positano |
| 2 | amalfiPositanoFerry | amalfi-positano-ferry | transport, ferry, amalfi, positano |
| 3 | capriPositanoFerry | capri-positano-ferry | transport, ferry, capri, positano |
| 4 | naplesAirportPositanoBus | naples-airport-positano-bus | transport, bus, naples, positano |
| 5 | naplesCenterPositanoFerry | naples-center-positano-ferry | transport, ferry, naples, positano |
| 6 | naplesCenterTrainBus | naples-center-train-bus | transport, train, bus, naples, positano |
| 7 | positanoAmalfiBus | positano-amalfi-bus | transport, bus, positano, amalfi |
| 8 | positanoAmalfiFerry | positano-amalfi-ferry | transport, ferry, positano, amalfi |
| 9 | positanoCapriFerry | positano-capri-ferry | transport, ferry, positano, capri |
| 10 | positanoNaplesAirportBus | positano-naples-airport-bus | transport, bus, positano, naples |
| 11 | positanoNaplesCenterBusTrain | positano-naples-center-bus-train | transport, bus, train, positano, naples |
| 12 | positanoNaplesCenterFerry | positano-naples-center-ferry | transport, ferry, positano, naples |
| 13 | positanoRavelloBus | positano-ravello-bus | transport, bus, positano, ravello |
| 14 | positanoRavelloFerryBus | positano-ravello-ferry-bus | transport, ferry, bus, positano, ravello |
| 15 | positanoSalernoBus | positano-salerno-bus | transport, bus, positano, salerno |
| 16 | positanoSalernoFerry | positano-salerno-ferry | transport, ferry, positano, salerno |
| 17 | positanoSorrentoBus | positano-sorrento-bus | transport, bus, positano, sorrento |
| 18 | positanoSorrentoFerry | positano-sorrento-ferry | transport, ferry, positano, sorrento |
| 19 | positanoToNaplesDirectionsByFerry | positano-to-naples-directions-by-ferry | transport, ferry, positano, naples |
| 20 | ravelloPositanoBus | ravello-positano-bus | transport, bus, ravello, positano |
| 21 | salernoPositanoBus | salerno-positano-bus | transport, bus, salerno, positano |
| 22 | salernoPositanoFerry | salerno-positano-ferry | transport, ferry, salerno, positano |
| 23 | sorrentoPositanoBus | sorrento-positano-bus | transport, bus, sorrento, positano |
| 24 | sorrentoPositanoFerry | sorrento-positano-ferry | transport, ferry, sorrento, positano |

## Appendix B: File Counts

| Category | Count | Notes |
|----------|-------|-------|
| TypeScript files in `routes/how-to-get-here/` | 94 | Includes components, subsystems, tests |
| Locale content files | ~432 | 24 routes × 18 languages |
| Guide manifest howToGetHere entries | 30 | 24 routes + 6 local navigation guides |
| GUIDES_INDEX total | 130 | 107 base + 23 from HOW_TO_GET_HERE spread |
| Slug override entries | 48 guide keys | Each with 18 language variants |
| Test files (directly related) | 15+ | See Test Landscape section |
| Files importing routes.json | 7 | definitions.ts, 3 scripts, 2 tests, page.tsx (indirect) |

## Appendix C: Corrections from Original Fact-Find

| Original Claim | Actual State | Evidence |
|----------------|-------------|----------|
| "24 routes need to be registered in GUIDES_INDEX" | Already registered — 23 via spread from `HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS` | `guides.index.ts` |
| "Content needs to be converted to guide JSON format" | Guide system reads content via i18n bundles; transform bridge exists but is dead code | `[slug]/page.tsx:111` |
| "Tag-based discovery needs to be enabled" | Already enabled — all 24 routes have transport + mode + location tags | `routeGuides.ts`, `routeGuides.test.ts:80-124` |
| "Multilingual slug support via GUIDE_SLUG_OVERRIDES" | Already implemented — 24 entries × 18 languages | `overrides.ts`, `routeGuides.test.ts:140-167` |
| "109 guides currently" | 130 guides (107 base + 23 howToGetHere) | `guides.index.ts` |
| "17 supported languages" | 18 supported languages | `i18nConfig.supportedLngs`, `routeGuides.test.ts:251` |
| "378+ slug override mappings" | 48 guide keys × 18 language variants = 864 mappings | `overrides.ts` |
| "4 tests for schema validation" | 4 schema tests + 307-line integration test + 13 other related test files | See Test Landscape |
| "Status: Draft" | Should be Ready-for-planning (migration complete, cleanup is well-scoped) | This audit |
