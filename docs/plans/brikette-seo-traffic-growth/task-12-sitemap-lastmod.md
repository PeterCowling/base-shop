---
Type: Task-Artifact
Status: Draft
---

# TASK-12 — Scoped Sitemap lastmod (Eligible Guide URLs)

Date: 2026-02-22  
Task: `TASK-12` (`IMPLEMENT`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope Implemented

Implemented scoped `<lastmod>` emission in sitemap generation for eligible guide-detail URLs only.

Code changes:
- Updated `apps/brikette/scripts/generate-public-seo.ts`
- Added contract tests in `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`
- Regenerated `apps/brikette/public/sitemap.xml`

## Implementation Notes

- Eligibility scope is semantic-source only:
  - `lastUpdated` (preferred)
  - `seo.lastUpdated` (fallback)
- Deterministic precedence is enforced when both fields exist and disagree:
  - `lastUpdated` wins
  - conflict count is logged in build output
- No date synthesis/fallback for non-eligible classes:
  - `/`, `/directions/*`, locale home, static sections, room detail, tag pages
- Added a bulk-today guard to block accidental mass timestamping of emitted entries.

## Validation

Executed:
- `pnpm --filter @apps/brikette test -- src/test/lib/generate-public-seo.lastmod.test.ts`
- `pnpm --filter @apps/brikette test -- src/test/tsx-runtime-resolution.test.ts`
- `pnpm --filter @apps/brikette typecheck`
- `pnpm exec tsx --tsconfig tsconfig.scripts.json scripts/generate-public-seo.ts` (from `apps/brikette`)

Observed build output:
- `[generate-public-seo] guide lastmod conflict count (lastUpdated vs seo.lastUpdated): 7`
- `[generate-public-seo] sitemap lastmod entries emitted: 681`

Sitemap verification:
- `apps/brikette/public/sitemap.xml` contains `681` `<lastmod>` entries.
- Non-eligible classes remain without `<lastmod>`.

## Acceptance Check (TASK-12)

- `<lastmod>` emitted only for eligible guide-detail URLs: **Pass**
- Non-eligible URL classes emit no `<lastmod>`: **Pass**
- Emitted `<lastmod>` values normalized to ISO-8601 UTC: **Pass**
- `lastUpdated` precedence over `seo.lastUpdated` enforced: **Pass**
- Bulk-today accident guard test present and passing: **Pass**
