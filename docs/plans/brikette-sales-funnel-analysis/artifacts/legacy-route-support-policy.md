# Legacy Route Support Policy

- Date: `2026-03-07`
- Plan: `docs/plans/brikette-sales-funnel-analysis/plan.md`
- Scope: Brikette public URL support contract for the static Cloudflare Pages runtime

## Decision

Brikette will **not** preserve every mechanically derivable alias after route localization.

The supported legacy contract is now:

1. Current localized public canonicals.
2. Historically public legacy URLs evidenced by repo fixtures or explicit pre-existing entry contracts.
3. A small set of stable global redirects (`/`, booking entry roots, typo corrections, custom-domain entrypoints, `/directions/:slug`, health shim).

Brikette will **not** preserve synthetic alias debt such as:

- wrong-locale English booking slugs like `/it/book`
- generalized cross-locale slug permutations never published as canonicals
- internal-segment compatibility paths invented only because the generator can derive them

## Evidence

### 1. The current preserve-everything strategy exceeds Pages limits

The generated Pages artifact currently contains:

- `4016` static `_redirects` rules
- `601` dynamic `_redirects` rules

Cloudflare Pages documents `_redirects` limits of:

- `2000` static rules
- `100` dynamic rules

Staging proof on `2026-03-07` showed that early rules still redirect while later localized alias families fall through to `404`, which is consistent with rule truncation or parser cut-off.

### 2. The repo already has a durable public-history boundary

`apps/brikette/src/test/fixtures/legacy-urls.txt` contains `3435` historical/public URLs.

This file is the right “line in the sand” because it represents URLs we have chosen to care about as legacy/public contract. It is a much better authority than generated combinatorics from current slug maps.

### 3. The static Pages runtime is not the same as the App Router runtime

`apps/brikette/scripts/normalize-static-export-localized-routes.ts` moves localized public routes into the deployed `out/` tree and removes many non-English internal-path duplicates.

That means:

- internal App Router URLs are not a valid public-runtime coverage proxy
- the legacy support contract must be expressed in deploy-time routing artifacts, not inferred from `listAppRouterUrls()`

## Supported Legacy Categories

### Keep

- historical internal top-level URLs that were actually public before localization
  - example: `/ja/about` -> `/ja/annai`
- historical room detail aliases that were previously live
- historical guide/article aliases that were previously live
- historical tag-root/internal-section URLs that were previously live
- explicit global entrypoint contracts

### Drop

- synthetic wrong-locale booking/private-booking aliases not present in the historical fixture
  - examples: `/it/book`, `/it/book-private-accommodations`
- synthetic cross-locale top-level aliases derived only from current slug tables
- synthetic generalized room/guide alias permutations with no public-history evidence

## Implication For Implementation

The correct static-runtime architecture is now:

1. Keep `public/_redirects` small and structural.
2. Move high-cardinality exact historical alias resolution into a generated, repo-owned edge manifest plus Pages Function logic.
3. Update verification so coverage is checked against:
   - current localized canonicals
   - supported historical legacy URLs
   - explicit global redirect contracts

## Non-Goals

- Preserving every alias that middleware can theoretically resolve in the Next.js runtime.
- Treating internal App Router URLs as public contract merely because they exist in source.
- Building new infrastructure just to preserve junk URLs.
