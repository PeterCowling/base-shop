---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CMS
Created: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: how-to-get-here-guides-migration
Related-Plan: docs/plans/how-to-get-here-guides-migration-plan.md
---

# How-To-Get-Here Guides Migration Fact-Find Brief

## Scope

### Summary

Migrate the 24 how-to-get-here transport routes from the standalone `routes.json` + locale JSON system to the unified guide system, achieving full parity with experiences/assistance guides. This includes GUIDES_INDEX registration, content format conversion, tag-based discovery, and multilingual slug support.

### Goals

- All 24 how-to-get-here routes registered in GUIDES_INDEX
- Content converted to guide JSON format (seo, intro, sections, faqs)
- Tag-based discovery enabled (transport mode, origin/destination tags)
- Multilingual slug support via GUIDE_SLUG_OVERRIDES
- Existing URLs preserved (no SEO impact)
- Deprecate routes.json in favor of unified guide system

### Non-goals

- Changing the how-to-get-here index page UX (filter UI remains)
- Converting how-to-get-here index to a guide listing
- Migrating the Chiesa Nuova drop-in logic (can remain as-is)
- Full localization of all 24 routes × 17 languages (existing translations preserved)

### Constraints & Assumptions

**Constraints:**
- URLs must be preserved: `/[lang]/how-to-get-here/[slug]` format unchanged
- Existing link bindings behavior must be maintained
- Gallery rendering must continue to work
- 17 supported languages, English as fallback

**Assumptions:**
- Link bindings can be converted to inline `<linkKey>` tags in guide content
- Gallery items can be embedded in guide sections or use existing asset paths
- Guide component overrides can point to existing rendering logic

---

## Repo Audit (Current State)

### Entry Points

| Path | Role |
|------|------|
| `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx` | Index page (filter UI) |
| `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` | Route detail page |
| `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` | Client render component |
| `apps/brikette/src/data/how-to-get-here/routes.json` | Route definitions (24 entries) |
| `apps/brikette/src/locales/[lang]/how-to-get-here/routes/*.json` | Content files (24 × 17 languages) |

### Key Modules / Files

| Path | Role |
|------|------|
| `src/lib/how-to-get-here/schema.ts` | Zod schemas for routes and content |
| `src/lib/how-to-get-here/definitions.ts` | Route definition parsing, binding resolution |
| `src/routes/how-to-get-here/sections.tsx` | Section rendering logic |
| `src/routes/how-to-get-here/_galleries.tsx` | Gallery rendering |
| `src/routes/how-to-get-here/linking.tsx` | Link target resolution, rich text rendering |
| `src/routes/how-to-get-here/content.ts` | Content loading (dynamic import) |
| `src/data/guides.index.ts` | GUIDES_INDEX (109 guides currently) |
| `src/guides/slugs/overrides.ts` | GUIDE_SLUG_OVERRIDES |
| `src/guides/slugs/namespaces.ts` | GUIDE_BASE_KEY_OVERRIDES |

### Patterns & Conventions Observed

| Pattern | Evidence |
|---------|----------|
| Guide keys are camelCase | `guides.index.ts` - all 109 keys |
| Slug overrides preserve URLs | `overrides.ts` - 378+ mappings |
| Section routing via base key overrides | `namespaces.ts` - `GUIDE_BASE_KEY_OVERRIDES` |
| Content fallback to English | `content.ts` - tries locale then fallback |
| Link bindings use declarative config | `routes.json` - `linkBindings` array |
| Gallery items separate from content | `routes.json` - `galleries` array with item configs |

### Data & Contracts

**Current How-To-Get-Here:**

```typescript
// Route definition (routes.json)
{
  contentKey: string;
  linkBindings?: LinkBinding[];
  media?: MediaBinding[];
  galleries?: GalleryBinding[];
  linkLists?: LinkListBinding[];
  status?: "draft" | "review" | "published";
}

// Content JSON structure
{
  meta: { title: string; description: string };
  header: { eyebrow, title, description };
  tip?: { label, intro, linkLabel, outro };
  journeyOverview?: { title, paragraphs[], links };
  photoGuide?: { title, items: { [id]: { alt, caption } } };
  sections: { [key]: { title, body/items/steps } };
}

// LinkTarget types
{ type: "howToOverview" }
{ type: "external", href: string }
{ type: "guide", guideKey: string }
{ type: "directions", slug: string }
```

**Target Guide System:**

```typescript
// GUIDES_INDEX entry
{
  key: GuideKey;
  tags: string[];
  section: "help" | "experiences";
  status?: "draft" | "review" | "published";
}

// Guide content JSON
{
  seo: { title, description };
  linkLabel: string;
  intro: string | string[];
  toc?: { [id]: string };
  sections: Array<{ id, title, body: string[] }>;
  faqs?: Array<{ q: string, a: string[] }>;
  fallback?: { ... };
}
```

### Dependency & Impact Map

**Upstream dependencies:**
- `routes.json` → Content files (`contentKey` mapping)
- `routes.json` → `generateStaticParams()` in page.tsx
- `routes.json` → `routeInventory.ts` URL enumeration
- Content files → `HowToGetHereContent.tsx` rendering

**Downstream dependents:**
- Footer links (uses `guideSlug` for some assistance links)
- LanguageModal (handles `howToGetHere` slug translation)
- SEO utils (`seo.ts` already handles howToGetHere in guideLookup)
- Route picker on index page

**Likely blast radius:**
- Page rendering for 24 routes
- URL inventory generation
- Static params generation
- Link binding resolution (if approach changes)

### Tests & Quality Gates

**Existing tests:**
- `src/test/lib/how-to-get-here.schema.test.ts` - 4 tests for schema validation
- No E2E tests for how-to-get-here pages
- No integration tests for rendering pipeline

**Gaps:**
- No snapshot tests for rendered output
- No URL preservation tests
- No cross-language slug tests

**Commands:**
- `pnpm --filter @apps/brikette test` - Runs Jest tests
- `pnpm typecheck` - TypeScript validation

### Recent Git History (Targeted)

- `src/data/how-to-get-here/routes.json` - Stable, occasional status updates
- `src/routes/how-to-get-here/` - Rendering logic stable
- `src/guides/slugs/` - Recently updated for assistance guides migration

---

## External Research (If needed)

None required - all patterns already established in the codebase via existing guide system.

---

## Questions

### Resolved

**Q: Can existing URLs be preserved?**
- A: Yes, via `GUIDE_SLUG_OVERRIDES`. The 24 route slugs can be added as explicit overrides.
- Evidence: `src/guides/slugs/overrides.ts` - 378+ existing overrides

**Q: How do link bindings work in guides?**
- A: Guides use inline `<linkKey>` tags in content text, resolved at render time.
- Evidence: `positionTravelGuide.json` fallback section uses `<linkBeaches>`, `<linkPath>`, etc.

**Q: Can galleries be preserved?**
- A: Yes, either via guide fallback `gallery` block or inline in sections.
- Evidence: `positanoTravelGuide.json` has `fallback.gallery.items`

**Q: What about the Chiesa Nuova drop-in logic?**
- A: Can remain as special-case logic in page.tsx or move to guide component override.
- Evidence: `[slug]/page.tsx` lines 166-173 - 6 routes get special treatment

**Q: How are how-to-get-here guides distinguished from experiences?**
- A: Via `GUIDE_BASE_KEY_OVERRIDES` setting `baseKey: "howToGetHere"`.
- Evidence: `namespaces.ts` - existing pattern for assistance, some transport guides

### Open (User Input Needed)

**Q: Should how-to-get-here guides appear in tag pages?**
- Why it matters: Affects discoverability and tag page counts
- Decision impacted: Tag assignment and visibility
- Default assumption: Yes, with transport-related tags (ferry, bus, train, etc.)
- Risk: Tag pages may become cluttered; minimal if tags are specific

**Q: Should we convert all 17 languages at once or phase by language?**
- Why it matters: Effort scope and risk of breaking existing translations
- Decision impacted: Migration task breakdown
- Default assumption: Convert all at once (content structure change, not translation)
- Risk: Low - existing translations are preserved, just restructured

**Q: What tags should how-to-get-here guides have?**
- Why it matters: Discovery and filtering
- Decision impacted: GUIDES_INDEX entries
- Default assumption: `transport` + mode (`ferry`, `bus`, `train`) + locations (`positano`, `naples`, etc.)
- Risk: Minimal

---

## Confidence Inputs (for /plan-feature)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Implementation** | 85% | Clear patterns from assistance migration; link bindings conversion requires care |
| **Approach** | 80% | Unified guide system is proven; gallery/binding conversion approach needs validation |
| **Impact** | 85% | URLs preserved via overrides; blast radius understood from audit |

**What would raise scores:**
- Implementation → 90%: Prototype one route conversion end-to-end
- Approach → 90%: Validate gallery rendering in guide format with one sample
- Impact → 90%: Add URL preservation test coverage before migration

---

## Planning Constraints & Notes

### Must-follow patterns

- Use `GUIDE_SLUG_OVERRIDES` for all 24 slugs (URL preservation critical)
- Add entries to `GUIDE_BASE_KEY_OVERRIDES` with `"howToGetHere"` value
- Follow existing guide content JSON schema (seo, intro, sections)
- Maintain backward compatibility for link bindings during transition

### Rollout/rollback expectations

- Feature can be rolled out incrementally per-route
- Rollback: Keep `routes.json` until all routes migrated and verified
- No feature flag needed - both systems can coexist during migration

### Observability expectations

- Verify URL inventory counts remain stable
- Monitor 404s for how-to-get-here URLs post-migration
- Test language switching on migrated routes

---

## Suggested Task Seeds (Non-binding)

1. **Add guide keys to slugs system** - Create constants, add to GUIDE_SLUG_OVERRIDES, GUIDE_BASE_KEY_OVERRIDES
2. **Add GUIDES_INDEX entries** - 24 entries with tags, section, status
3. **Convert content format** - Script to transform how-to-get-here JSON → guide JSON
4. **Create guide rendering adapter** - Component that bridges existing section rendering to guide template
5. **Update page routing** - Point how-to-get-here pages to guide system
6. **Add URL preservation tests** - Verify all 24 × 17 URLs still work
7. **Deprecate routes.json** - Remove after verification

### Content conversion pseudo-mapping

```
Current                          → Target
─────────────────────────────────────────────────────
meta.title                       → seo.title
meta.description                 → seo.description
header.title                     → (derived from seo.title)
tip                              → sections[0] with type "tip"
journeyOverview                  → sections[1] with id "overview"
photoGuide                       → sections[n] with gallery embedded
sections.*                       → sections[n..] with id from key
linkBindings                     → inline <linkKey> tags in body text
galleries                        → fallback.gallery or section.gallery
```

---

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None - open questions have reasonable defaults
- **Recommended next step:** Proceed to `/plan-feature`

---

## Appendix: Current 24 Route Slugs

| # | Slug | ContentKey |
|---|------|------------|
| 1 | amalfi-positano-bus | howToGetHereAmalfiPositanoBus |
| 2 | amalfi-positano-ferry | howToGetHereAmalfiPositanoFerry |
| 3 | capri-positano-ferry | howToGetHereCapriPositanoFerry |
| 4 | naples-airport-positano-bus | howToGetHereNaplesAirportPositanoBus |
| 5 | naples-center-positano-ferry | howToGetHereNaplesCenterPositanoFerry |
| 6 | naples-center-train-bus | howToGetHereNaplesCenterTrainBus |
| 7 | positano-amalfi-bus | howToGetHerePositanoAmalfiBus |
| 8 | positano-amalfi-ferry | howToGetHerePositanoAmalfiFerry |
| 9 | positano-capri-ferry | howToGetHerePositanoCapriFerry |
| 10 | positano-naples-airport-bus | howToGetHerePositanoNaplesAirportBus |
| 11 | positano-naples-center-bus-train | howToGetHerePositanoNaplesCenterBusTrain |
| 12 | positano-naples-center-ferry | howToGetHerePositanoNaplesCenterFerry |
| 13 | positano-ravello-bus | howToGetHerePositanoRavelloBus |
| 14 | positano-ravello-ferry-bus | howToGetHerePositanoRavelloFerryBus |
| 15 | positano-salerno-bus | howToGetHerePositanoSalernoBus |
| 16 | positano-salerno-ferry | howToGetHerePositanoSalernoFerry |
| 17 | positano-sorrento-bus | howToGetHerePositanoSorrentoBus |
| 18 | positano-sorrento-ferry | howToGetHerePositanoSorrentoFerry |
| 19 | positano-to-naples-directions-by-ferry | howToGetHerePositanoToNaplesDirectionsByFerry |
| 20 | ravello-positano-bus | howToGetHereRavelloPositanoBus |
| 21 | salerno-positano-bus | howToGetHereSalernoPositanoBus |
| 22 | salerno-positano-ferry | howToGetHereSalernoPositanoFerry |
| 23 | sorrento-positano-bus | howToGetHereSorrentoPositanoBus |
| 24 | sorrento-positano-ferry | howToGetHereSorrentoPositanoFerry |
