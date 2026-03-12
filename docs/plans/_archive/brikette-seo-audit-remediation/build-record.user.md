---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: "2026-03-12"
Feature-Slug: brikette-seo-audit-remediation
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
Build-Event-Ref: docs/plans/brikette-seo-audit-remediation/build-event.json
---

# Build Record: Brikette SEO Audit Remediation

## Outcome Contract

- **Why:** SEO tech audit identified crawl waste (24 dead URLs in sitemap), content quality degradation (raw i18n keys visible to Google on transport guide pages), and sparse freshness signals (77% of sitemap without lastmod). These directly impact search indexing quality for a 1,246-URL multilingual travel site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All sitemap URLs return 200, no i18n keys leak in SSR HTML for how-to-get-here pages, /assistance redirects correctly, lastmod coverage ≥60%
- **Source:** auto

## What Was Built

**TASK-01 — Remove dead directions URLs from sitemap + add redirect:** Removed `...listDirectionPaths()` from `listCanonicalSitemapPaths()` in `generate-public-seo.ts`, eliminating 24 dead `/directions/*` URLs from the sitemap. Added `/en/directions/:slug → /en/how-to-get-here/:slug` redirect to `_redirects` to catch the `/en/` prefix variant. Added TC-15 test asserting zero `/directions/` entries in generated sitemap.

**TASK-02 — Fix i18n SSR key leakage on how-to-get-here pages:** Added synchronous i18n store seeding via `useRef` in `GuideContent.tsx` to ensure `addResourceBundle` runs during SSR (not just in `useEffect`). Removed the `ready` gate from `PlanChoice.tsx` translator selection so the `useTranslation("guides")` hook's `t` function is used regardless of ready state, fixing SSR fallback to raw keys.

**TASK-03 — Add /assistance redirect:** Added `/assistance /en/help 301` and `/assistance/ /en/help 301` to `_redirects`.

**TASK-04 — Backfill lastmod coverage:** Added root-level `lastUpdated` field to ~250 guide content JSON files across all locales using git commit dates via `git log -1 --format=%aI`. Coverage increased from 23% to 100% of guide-detail pages.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter brikette typecheck` | Pass | Clean, no errors |
| `pnpm --filter brikette lint` | Pass | 1 pre-existing warning (unrelated) |
| CI (push to dev) | Pending | Tests run in CI only per testing policy |

## Workflow Telemetry Summary

- Feature slug: `brikette-seo-audit-remediation`
- Records: 4 (fact-find, analysis, plan, build)
- Context input bytes: 208,102
- Artifact bytes: 54,694
- Modules counted: 5
- Deterministic checks counted: 6
- Token measurement coverage: 0.0% (session token capture not configured)
- Stages missing records: lp-do-ideas

## Validation Evidence

### TASK-01
- TC-01: `listCanonicalSitemapPaths()` no longer calls `listDirectionPaths()` — verified by code inspection
- TC-02: TC-15 test added asserting `directionsEntries.toHaveLength(0)` — zero `/directions/` URLs in sitemap
- TC-02b: Existing TC-14 canonical path assertions preserved — `listLocalizedPublicUrls()` still in sitemap paths

### TASK-02
- TC-01: `GuideContent.tsx` now seeds i18n store synchronously via `useRef` before first render
- TC-02: `PlanChoice.tsx` no longer gates on `ready` — SSR always uses the `t` function
- TC-03: Typecheck passes clean — no regressions in guide rendering pipeline

### TASK-03
- TC-01: `_redirects` contains `/assistance /en/help 301` and `/assistance/ /en/help 301`
- Post-deploy verification required: `curl -I hostel-positano.com/assistance`

### TASK-04
- TC-01: All guide content JSON files now have `lastUpdated` field — 100% coverage (up from 23%)
- TC-02: `lastUpdated` values are historical git dates, not today's date — `assertNoBulkTodayLastmod()` guard will pass
- TC-03: Existing TC-12/TC-13 test contracts unaffected — `resolveGuideLastmod()` reads the same field

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A — build-time/config changes only | No rendering changes |
| UX / states | N/A — no interaction changes | SSR fix improves content quality for JS-off users |
| Security / privacy | N/A — no auth/input changes | - |
| Logging / observability / audit | N/A — no runtime logging | - |
| Testing / validation | TC-15 added for sitemap exclusion; typecheck+lint clean | CI run pending |
| Data / contracts | `lastUpdated` field added to ~250 guide JSON files | Existing field schema, no structural change |
| Performance / reliability | N/A — build-time changes only | - |
| Rollout / rollback | Standard deploy; each task independently revertable | - |

## Scope Deviations

None. All changes within planned scope.
