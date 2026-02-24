---
Type: Task-Artifact
Status: Draft
---

# TASK-09 — Sitemap `lastmod` Feasibility

Date: 2026-02-22
Task: `TASK-09` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope

Evaluate whether Brikette can emit accurate per-URL sitemap `<lastmod>` values without introducing untrusted timestamps.

Read-only sources reviewed:
- `apps/brikette/src/data/generate-guide-slugs.ts`
- `apps/brikette/scripts/generate-public-seo.ts`
- `apps/brikette/src/routing/routeInventory.ts`
- `apps/brikette/src/locales/en/guides/content/*.json`
- Git history for guide content files (`git log --follow`)

## Evidence Summary

1. Guide slug map does not carry timestamp metadata.
- `generate-guide-slugs.ts` is a key->slug map only (no `updatedAt`/`lastModified` fields).

2. Sitemap generator currently has no timestamp source and normalizes URL paths only.
- `generate-public-seo.ts` writes `<url><loc>...</loc></url>` entries with no `<lastmod>`.
- URL set comes from static route inventory (`listAppRouterUrls()`), plus `/` and `/directions/:slug`.

3. Explicit semantic date coverage in guide content is partial.
- EN guide content files: `168` total.
- Files with top-level `lastUpdated`: `35`.
- Files with `seo.lastUpdated`: `5`.
- Files with either field: `40`.
- Files with neither field: `128`.

4. Filesystem mtime is not reliable in this checkout.
- For EN guide content, all `168` files currently share one mtime date (`2026-02-20`).
- This shows mtime can collapse to checkout/build effects and is not trustworthy as freshness truth.

5. Git history can produce per-file dates in this environment.
- Repository is not shallow: `git rev-parse --is-shallow-repository` => `false`.
- `git log -1` across EN guide files produced multiple distinct dates (`11` unique; top buckets include `2026-02-05` and `2025-12-22`).
- This indicates git-based dates are technically retrievable here.

## Decision

Conclusion: **(c) no reliable source currently for accurate all-URL `<lastmod>` output in the existing sitemap pipeline**.

Rationale:
- Semantic content dates are missing for most guides (`128/168`).
- mtime is demonstrably untrustworthy.
- Git-log dates are viable in this repo, but are deployment-environment-sensitive (shallow clone risk) and still not equivalent to semantic update dates.
- Current sitemap generation path is URL-first and does not carry authoritative URL->source metadata for all route classes.

## Actionable Outcome

- Recommend **do not implement `<lastmod>` in current form**.
- Route `TASK-12` to CHECKPOINT replan for either:
  - explicit content-level `updatedAt` coverage + URL->source mapping, or
  - scoped lastmod only for URL classes with authoritative dates (with acceptance criteria adjusted), or
  - cancellation of TASK-12.

## What This Changes Downstream

- `TASK-12` should not proceed as currently specified without replan.
- This investigation reduces risk of shipping low-trust sitemap freshness signals that Google may ignore.
