---
Type: Task-Artifact
Status: Draft
---

# TASK-19 — Lastmod Eligibility Matrix and URL-Source Mapping

Date: 2026-02-22
Task: `TASK-19` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope

Define which sitemap URL classes have trustworthy timestamp sources for `<lastmod>`, quantify coverage, and recommend whether `TASK-12` should proceed.

## Sources Reviewed

- `apps/brikette/public/sitemap.xml`
- `apps/brikette/scripts/generate-public-seo.ts`
- `apps/brikette/src/routing/routeInventory.ts`
- `apps/brikette/src/data/guides.index.ts`
- `apps/brikette/src/i18n.config.ts`
- `apps/brikette/src/data/how-to-get-here/routes.json`
- `apps/brikette/src/data/roomsData.ts`
- `apps/brikette/src/locales/*/guides/content/*.json`
- Prior feasibility note: `docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md`

## Method and Key Counts

1. Parsed `sitemap.xml` and classified all `<loc>` URLs by structural class.
2. Confirmed route-inventory cardinalities via runtime imports (`listAppRouterUrls()`, `getUrlCounts()`).
3. Checked all localized live guide content files for explicit semantic date fields:
   - top-level `lastUpdated`
   - `seo.lastUpdated`
4. Validated date parseability for detected values.

Observed totals:

- Sitemap URLs: `4,093`
- App-router URLs: `4,086`
- Difference explained by generator inputs: `+1` root (`/`) and `+24` `/directions/:slug`, offset by `-18` draft URLs excluded from sitemap (`4,086 + 1 + 24 - 18 = 4,093`)

## URL-Class Eligibility Matrix

| URL class | Count | Source mapping | Date signal(s) available now | Reliability |
|---|---:|---|---|---|
| Root (`/`) | 1 | Hardcoded in `generate-public-seo.ts` path list | None | `none` |
| `/directions/:slug` | 24 | Keys from `how-to-get-here/routes.json` | No `lastUpdated` / `updatedAt` fields in route data | `none` |
| Locale home (`/{lang}`) | 18 | `routeInventory.ts` (`home`) | No canonical per-locale freshness field in URL inventory | `none` |
| Static sections (`/{lang}/{section}`) | 270 | `routeInventory.ts` (`STATIC_EXPORT_SECTION_KEYS`) | No canonical per-URL freshness field in URL inventory | `none` |
| Room detail (`/{lang}/{roomsSlug}/{roomId}`) | 198 | `routeInventory.ts` + `roomsData.ts` | No `lastUpdated` / `updatedAt` in `roomsData.ts` | `none` |
| Guide detail (`/{lang}/{guide-section}/{slug}`) | 2,142 | `routeInventory.ts` live `GUIDES_INDEX` keys -> localized guide content JSON | `lastUpdated` and/or `seo.lastUpdated` present on subset | `authoritative` for subset; `none` for remainder |
| Tag pages (`/{lang}/{experiencesSlug}/{tagsSlug}/{tag}`) | 1,440 | `routeInventory.ts` unique tags from `GUIDES_INDEX` | No direct per-tag freshness field | `none` |

## Eligibility Coverage (Strict Rules)

Strict eligibility rule used for this task:

- URL is eligible only if it has an explicit semantic timestamp field in its own content source (`lastUpdated` or `seo.lastUpdated`).
- No filesystem mtime fallback.
- No git-history fallback for strict mode.

Results:

- Strict-eligible URLs: `681 / 4,093 = 16.64%`
- All strict-eligible URLs are in the guide-detail class.
- Guide-detail strict coverage: `681 / 2,142 = 31.79%`
- Non-eligible URLs: `3,412 / 4,093 = 83.36%`

Live guide detail breakdown by namespace:

- `assistance`: `74 / 612 = 12.09%`
- `experiences`: `325 / 972 = 33.44%`
- `howToGetHere`: `282 / 558 = 50.54%`

## Date Quality Notes

- No parse failures detected for discovered guide date values (`Date.parse` valid for all).
- Field-format consistency is mixed (`YYYY-MM-DD`, `YYYY-MM-DDTHH:mm:ss.sssZ`, `...Z` variants) and requires output normalization.
- In `7` localized guide files where both fields are present, `lastUpdated` and `seo.lastUpdated` disagree; precedence must be explicit in implementation.

## Decision

Recommendation: **Proceed with scoped `TASK-12` implementation**, not full-sitemap implementation.

Reasoning:

- Full-sitemap `<lastmod>` (all `4,093` URLs) is not trustworthy with current data coverage.
- A strict semantic-source implementation is viable today for a bounded subset (`681` guide URLs).
- Remaining URLs should omit `<lastmod>` until explicit timestamp fields are backfilled.

## Implementation Contract Inputs for TASK-12

If re-scoped and executed:

1. Emit `<lastmod>` only for URLs with authoritative semantic fields.
2. Field precedence for guide pages:
   - `lastUpdated` (preferred)
   - `seo.lastUpdated` (fallback)
3. If both fields exist and differ, prefer `lastUpdated` and log conflict count in build output.
4. Normalize output to ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
5. Do not synthesize dates for non-eligible classes (root, directions, home, static sections, rooms, tags).
6. Add a coverage guard in tests:
   - ensure no class outside guide-detail emits `<lastmod>` without explicit source,
   - assert emitted `<lastmod>` count equals current eligible count from source scan (or expected fixture in test harness).

## Downstream Impact

- `TASK-19` acceptance is met.
- `TASK-12` requires `/lp-do-replan` because its current acceptance assumes `<lastmod>` on all `<loc>` entries, which conflicts with evidence.
