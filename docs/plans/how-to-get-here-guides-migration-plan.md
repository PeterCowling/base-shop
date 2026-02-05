---
Type: Plan
Status: Historical
Domain: CMS
Relates-to charter: Content unification
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27
Completed: 2026-01-27
Feature-Slug: how-to-get-here-guides-migration
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

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
- New translations (existing translations preserved)

## Constraints & Assumptions

**Constraints:**
- URLs must be preserved for SEO (critical)
- Existing rendering must continue to work (no content migration in this plan)
- 18 supported languages (`SUPPORTED_LANGUAGES` in `apps/brikette/src/i18n.config.ts`)

**Assumptions:**
- It’s acceptable for GUIDES_INDEX “tags” pages to include transport routes (tag discovery is cross-section today).
- We can introduce new guide keys via `GUIDE_SLUG_OVERRIDES` without adding full guide manifest entries.

## Audit Updates (2026-01-27)

Concrete repo findings that reduce risk and clarify what must (and must not) change:

- The App Router route `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` already supports a **hybrid** strategy (route-definition first; guide fallback when no route definition exists).
- How-to-get-here route content is loaded from `apps/brikette/src/locales/{lang}/how-to-get-here/routes/*.json` via `apps/brikette/src/routes/how-to-get-here/content-modules.ts`.
- `apps/brikette/src/routing/routeInventory.ts` currently enumerates how-to-get-here URLs from `apps/brikette/src/data/how-to-get-here/routes.json`; this must be updated carefully to keep URL fixtures unique once routes are also indexed as guides.
- Language switching already contains a branch for `slugKey === "howToGetHere"` and will translate route slugs via `resolveGuideKeyFromSlug()` when a guide key is known (`apps/brikette/src/context/modal/global-modals/LanguageModal.tsx`).
- Transport metadata for route slugs already exists in `apps/brikette/src/routes/how-to-get-here/transport.ts` (`routeMetadataOverrides`), which we can reuse to avoid hand-maintaining mode/direction tags.

## Fact-Find Reference

- Related brief: `docs/plans/how-to-get-here-guides-migration-fact-find.md`
- Key findings (revalidated):
  - 24 routes in `apps/brikette/src/data/how-to-get-here/routes.json`
  - Route content exists for all locales under `apps/brikette/src/locales/*/how-to-get-here/routes/`
  - How-to-get-here already participates in guide slug routing via `guideNamespace()` and `resolveGuideKeyFromSlug()`

## Existing System Notes

**Key modules/files:**
- `apps/brikette/src/data/how-to-get-here/routes.json` — route definitions (slug → contentKey + bindings)
- `apps/brikette/src/guides/slugs/overrides.ts` — `GUIDE_SLUG_OVERRIDES` (slug ↔ key lookup)
- `apps/brikette/src/guides/slugs/namespaces.ts` — `GUIDE_BASE_KEY_OVERRIDES` (fallback base routing)
- `apps/brikette/src/data/guides.index.ts` — `GUIDES_INDEX` (tags discovery + publish gating)
- `apps/brikette/src/routing/routeInventory.ts` — App Router URL fixture source

## Proposed Approach

Treat each transport route as a **guide key** for slug resolution, tags, and inventory — while continuing to render via the existing how-to-get-here renderer backed by `routes.json`.

This keeps the migration:
- **Low risk:** no content conversion, no renderer change
- **Incremental:** purely additive + test-guarded changes
- **Reversible:** removing the guide registrations returns behavior to the pre-migration state

### Follow-on (explicitly out of scope)

Convert how-to-get-here route content to guide-native content/manifest format (this would be ~24 × 18 = 432 locale files plus renderer changes). Keep this as a separate plan so this migration stays safe and testable.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Add canonical how-to-get-here route guide map + key list | 92% | S | ✅ Complete | - |
| TASK-02 | IMPLEMENT | Add `GUIDE_SLUG_OVERRIDES` entries for 24 route keys | 92% | S | ✅ Complete | TASK-01 |
| TASK-03 | IMPLEMENT | Add `GUIDE_BASE_KEY_OVERRIDES` entries for 24 route keys | 92% | S | ✅ Complete | TASK-01 |
| TASK-04 | IMPLEMENT | Add `GUIDES_INDEX` entries + tags (mode + origin/destination) | 90% | M | ✅ Complete | TASK-01 |
| TASK-05 | IMPLEMENT | Update App Router URL inventory to enumerate from guide keys (unique URLs) | 90% | M | ✅ Complete | TASK-01, TASK-04 |
| TASK-06 | IMPLEMENT | Add regression tests (slug lookup, namespaces, inventory uniqueness) | 90% | M | ✅ Complete | TASK-02, TASK-03, TASK-05 |

> Effort scale: S=1, M=2, L=3

---

## Milestones

| Milestone | Focus | Tasks | Effort | CI |
|-----------|-------|-------|--------|-----|
| 1 | Canonical route→guide mapping (single source of truth) | TASK-01 | S | **92%** |
| 2 | Slug + namespace registration (guide helpers can generate/resolve) | TASK-02, TASK-03 | S | **92%** |
| 3 | Discovery + inventory parity (tags + URL fixtures stay unique) | TASK-04, TASK-05, TASK-06 | M | **90%** |

## Tasks

### TASK-01: Add canonical how-to-get-here route guide map + key list

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/data/how-to-get-here/routeGuides.ts` (new)
- **Depends on:** -
- **CI:** 92%
  - Implementation: 92% — Small, additive data module + helpers.
  - Approach: 92% — Mirrors `apps/brikette/src/data/assistanceGuideKeys.ts` pattern (typed list + type guard).
  - Impact: 92% — Used only by routing/helpers/tests; no rendering change.
- **Acceptance:**
  - Export a single source of truth for the 24 routes:
    - `HOW_TO_GET_HERE_ROUTE_GUIDES` (key → `{ slug, tags }`)
    - `HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS: readonly string[]` (stable ordering)
    - `isHowToGetHereRouteGuideKey(value: string): value is string` type guard
  - Test asserts the mapping is in 1:1 sync with `apps/brikette/src/data/how-to-get-here/routes.json` (same slugs).
- **Test plan:**
  - Add: `apps/brikette/src/routes/how-to-get-here/__tests__/routeGuides.test.ts`
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Direct merge, additive only
  - Rollback: Delete file
  - Notes: Keep keys as strings to avoid circular deps with GuideKey typing until overrides exist.

### TASK-02: Add `GUIDE_SLUG_OVERRIDES` entries for 24 route keys

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/guides/slugs/overrides.ts`
- **Depends on:** TASK-01
- **CI:** 92%
  - Implementation: 92% — Straightforward entries (or generated from TASK-01 mapping).
  - Approach: 92% — Same URL-preservation approach as assistance guide overrides.
  - Impact: 92% — Scoped to new keys; existing slugs unchanged.
- **Acceptance:**
  - Add 24 entries mapping each new key → existing route slug.
  - Slugs are identical across locales for these routes (set `en` and rely on fallback, or explicitly set all 18).
  - `resolveGuideKeyFromSlug(existingSlug, lang)` resolves to the expected key for all supported languages.
- **Test plan:**
  - Extend `routeGuides.test.ts` to assert every mapped key has a slug override.
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Direct merge
  - Rollback: Remove entries from overrides.ts
- **Notes / references:**
  - Slugs must exactly match keys in `apps/brikette/src/data/how-to-get-here/routes.json`.

### TASK-03: Add `GUIDE_BASE_KEY_OVERRIDES` entries for 24 route keys

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/guides/slugs/namespaces.ts`
- **Depends on:** TASK-01
- **CI:** 92%
  - Implementation: 92% — Simple object entries.
  - Approach: 92% — Matches existing how-to-get-here routing overrides.
  - Impact: 92% — Affects only the new keys (fallback-only when no manifest entry exists).
- **Acceptance:**
  - Add 24 entries with value `"howToGetHere"`.
  - `guideNamespace(lang, key).baseKey === "howToGetHere"` for every new key.
- **Test plan:**
  - Extend `routeGuides.test.ts` to assert namespace routing for all keys.
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Direct merge
  - Rollback: Remove entries
- **Notes / references:**
  - `guideNamespaceKey()` is manifest-first; these overrides act as a fallback for keys without manifest entries.

### TASK-04: Add `GUIDES_INDEX` entries + tags (mode + origin/destination)

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/data/guides.index.ts`
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — Standard index entries.
  - Approach: 90% — Tags become deterministic by deriving mode/direction from `routeMetadataOverrides` and locking the origin/destination tag set in the TASK-01 map.
  - Impact: 90% — Additive entries only; publish gating remains unchanged.
- **Acceptance:**
  - Add 24 entries with `section: "help"` and `status: "published"` (these routes are already live today).
  - Tags include:
    - `transport`
    - at least one transport mode tag (`bus` / `ferry` / `train`) consistent with `routeMetadataOverrides`
    - location tags (locked set: `positano`, `amalfi`, `naples`, `salerno`, `ravello`, `sorrento`, `capri`)
  - Any future changes to tags go through the TASK-01 map (single source of truth).
- **Test plan:**
  - Extend `routeGuides.test.ts` to assert all keys exist in GUIDES_INDEX with expected section/status.
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Direct merge (URLs unchanged; this only enables discovery/tagging).
  - Rollback: Remove the 24 entries.
- **Notes / references:**
  - Reuse `apps/brikette/src/routes/how-to-get-here/transport.ts` metadata where possible; avoid re-deriving modes.

### TASK-05: Update App Router URL inventory to enumerate from guide keys (unique URLs)

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/routing/routeInventory.ts`
- **Depends on:** TASK-01, TASK-04
- **CI:** 90%
  - Implementation: 90% — Small refactor + reuse of existing guide helpers.
  - Approach: 90% — Eliminates double-enumeration risk (routes.json + GUIDES_INDEX).
  - Impact: 90% — Impacts only fixture generation/tests; pages unchanged.
- **Acceptance:**
  - How-to-get-here URLs are enumerated from the new guide key list (TASK-01), not from `routes.json` keys.
  - URL inventory output remains **unique** (no duplicate URLs when routes also exist in GUIDES_INDEX).
  - Count remains stable: 24 × 18 = 432 how-to-get-here URLs.
- **Test plan:**
  - Regenerate fixtures: `pnpm --filter @apps/brikette generate:url-fixtures`
  - Run: `pnpm --filter @apps/brikette test url-inventory -- --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Direct merge
  - Rollback: Revert `routeInventory.ts` changes + re-generate fixtures.

### TASK-06: Add regression tests (slug lookup, namespaces, inventory uniqueness)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/how-to-get-here/__tests__/routeGuides.test.ts` (new)
  - `apps/brikette/src/test/migration/url-inventory.test.ts` (existing; should pass with updated fixture)
- **Depends on:** TASK-02, TASK-03, TASK-05
- **CI:** 90%
  - Implementation: 90% — Tests are deterministic and target the migration surface area.
  - Approach: 90% — Guards the exact invariants that keep URLs stable.
  - Impact: 90% — Test-only.
- **Acceptance:**
  - `routeGuides.test.ts` asserts:
    - all 24 slugs in `routes.json` are represented in the route guide map
    - slug lookup resolves for every supported language (18)
    - namespace baseKey resolves to `"howToGetHere"` for each key
  - URL inventory fixture test passes and URL list is unique.
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
  - Run: `pnpm --filter @apps/brikette test url-inventory -- --maxWorkers=2`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| URL changes break SEO | Slugs are preserved by mapping them to existing `routes.json` slugs; TASK-06 asserts 1:1 parity. |
| URL fixture duplicates appear (GUIDES_INDEX + routes.json) | TASK-05 updates enumeration to avoid double counting; TASK-06 enforces uniqueness. |
| Language switching fails to preserve route | LanguageModal already branches for `howToGetHere`; TASK-06 asserts slug lookup is stable across locales. |
| Tag pages become noisy | Keep tags consistent + predictable; scope transport tags to a small controlled vocabulary (mode + location). |

## Observability

- **Logging:** Existing content loading logs preserved
- **Metrics:** URL inventory stats should remain stable (432 how-to-get-here URLs)
- **Alerts/Dashboards:** Monitor 404s for how-to-get-here URLs post-deployment

## Acceptance Criteria (overall)

- [x] All 24 routes present in `GUIDES_INDEX` with deterministic tags
- [x] All routes resolvable via guide helpers (`resolveGuideKeyFromSlug()`, `guideSlug()`, `guideNamespace()`, `guidePath()`)
- [x] URLs preserved: `/[lang]/how-to-get-here/[slug]` unchanged for all existing slugs
- [x] routeInventory fixture remains unique and includes 432 how-to-get-here URLs
- [x] TypeScript compiles without errors
- [x] All tests pass

## Decision Log

- 2026-01-27: Chose “register routes as guide keys” over “convert content to guide-native format” — preserves rendering and keeps scope low-risk.

---

## Appendix: Guide Key Mapping

| # | Current Slug | Guide Key | Tags |
|---|--------------|-----------|------|
| 1 | amalfi-positano-bus | amalfiPositanoBus | transport, bus, amalfi, positano |
| 2 | amalfi-positano-ferry | amalfiPositanoFerry | transport, ferry, amalfi, positano |
| 3 | capri-positano-ferry | capriPositanoFerry | transport, ferry, capri, positano |
| 4 | naples-airport-positano-bus | naplesAirportPositanoBus | transport, bus, naples, positano |
| 5 | naples-center-positano-ferry | naplesCenterPositanoFerry | transport, ferry, naples, positano |
| 6 | naples-center-train-bus | naplesCenterTrainBus | transport, train, bus, naples, positano |
| 7 | positano-amalfi-bus | positanoAmalfiBus | transport, bus, positano, amalfi |
| 8 | positano-amalfi-ferry | positanoAmalfiFerry | transport, ferry, positano, amalfi |
| 9 | positano-capri-ferry | positanoCapriFerry | transport, ferry, positano, capri |
| 10 | positano-naples-airport-bus | positanoNaplesAirportBus | transport, bus, positano, naples |
| 11 | positano-naples-center-bus-train | positanoNaplesCenterBusTrain | transport, bus, train, positano, naples |
| 12 | positano-naples-center-ferry | positanoNaplesCenterFerry | transport, ferry, positano, naples |
| 13 | positano-ravello-bus | positanoRavelloBus | transport, bus, positano, ravello |
| 14 | positano-ravello-ferry-bus | positanoRavelloFerryBus | transport, ferry, bus, positano, ravello |
| 15 | positano-salerno-bus | positanoSalernoBus | transport, bus, positano, salerno |
| 16 | positano-salerno-ferry | positanoSalernoFerry | transport, ferry, positano, salerno |
| 17 | positano-sorrento-bus | positanoSorrentoBus | transport, bus, positano, sorrento |
| 18 | positano-sorrento-ferry | positanoSorrentoFerry | transport, ferry, positano, sorrento |
| 19 | positano-to-naples-directions-by-ferry | positanoToNaplesDirectionsByFerry | transport, ferry, positano, naples |
| 20 | ravello-positano-bus | ravelloPositanoBus | transport, bus, ravello, positano |
| 21 | salerno-positano-bus | salernoPositanoBus | transport, bus, salerno, positano |
| 22 | salerno-positano-ferry | salernoPositanoFerry | transport, ferry, salerno, positano |
| 23 | sorrento-positano-bus | sorrentoPositanoBus | transport, bus, sorrento, positano |
| 24 | sorrento-positano-ferry | sorrentoPositanoFerry | transport, ferry, sorrento, positano |
