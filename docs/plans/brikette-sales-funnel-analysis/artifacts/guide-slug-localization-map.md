# Guide Slug Localization Map

- Date: `2026-03-06`
- Task: `TASK-13G`
- Scope: cause map for live non-English guide slugs still matching English plus alias-preservation contract

## Executive Summary
The current live guide-slug debt is not caused by missing labels or placeholder fallbacks. The current debt is caused by explicit per-locale slug overrides that intentionally keep English slugs in non-English locales.

That changes the implementation strategy materially:

- `TASK-13D` is an override-localization task first.
- It is not primarily a guide-label completeness task.

## Current State
`verify-route-localization` reports `495` unexpected guide-slug English matches across the `17` non-English locales.

Locale totals:

- `29` matches in most non-English locales
- `30` matches in `fr`
- `30` matches in `it`

## Cause Classification
Cause breakdown from live-guide audit:

- `explicit-override`: `495`
- `placeholder-label`: `0`
- `missing-label`: `0`
- `same-as-english-label`: `0`
- `generated-slug-still-english`: `0`

This means every current live guide slug that still matches English is being held there by `GUIDE_SLUG_OVERRIDES`, not by the fallback generator in `slugs.ts`.

Evidence:
- `apps/brikette/src/guides/slugs/overrides.ts`
- `apps/brikette/src/guides/slugs/slugs.ts`
- `apps/brikette/src/guides/slugs/urls.ts`

## Shape Of The Debt
The debt is concentrated in:

- `howToGetHere` route guides
  - examples: `amalfi-positano-bus`, `capri-positano-ferry`, `positano-sorrento-bus`
- a small number of `assistance` guides in specific locales
  - `it`: `groceries-and-pharmacies-positano`
  - `fr`: `work-and-travel-remote-work-positano`

The route-localization artifact contains the exact per-locale exception list:

- `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`

## Important Constraint
`resolveGuideKeyFromSlug()` does not currently preserve old guide slugs generically once the slug changes.

Evidence:
- `apps/brikette/src/guides/slugs/urls.ts`
  - resolver falls back to guide keys, not historic slug aliases

So if `TASK-13D` rewrites guide canonicals without adding alias support, existing indexed English-style guide URLs will break.

## Alias-Preservation Contract
`TASK-13D` should preserve legacy English-style guide URLs through both:

- route-level redirect coverage for old public paths
- resolver compatibility or equivalent alias support where direct redirect coverage is not enough

Minimum contract:

- old English guide URL remains reachable
- canonical non-English URL becomes the primary target
- no old indexed guide URL should 404 because a localized override was removed

## Recommended Implementation Order For TASK-13D
1. Localize `GUIDE_SLUG_OVERRIDES` for the current English-held non-English guide keys.
2. Add explicit alias-preservation support for the old English slugs.
3. Refresh route inventory and redirect generation.
4. Re-run `verify-route-localization` and `verify-url-coverage`.

## Implication For Confidence
`TASK-13D` is now bounded:

- the debt set is known
- the cause is known
- the implementation seam is known
- the remaining risk is backward compatibility, not discovery
