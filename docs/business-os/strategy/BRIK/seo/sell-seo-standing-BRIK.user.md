# SEO Standing — BRIK (hostel-positano.com)

**Last updated**: 2026-03-12
**Stage**: SELL-04
**Business**: BRIK
**Site**: https://hostel-positano.com

## Current Health

| Signal | Status | Detail |
|---|---|---|
| Lighthouse SEO | 100 | Clean score |
| robots.txt | Live | References sitemap index |
| Sitemap | Live | 1,246 URLs; 24 dead `/directions/*` entries (needs cleanup) |
| Canonical tags | Present | Self-referencing on sampled pages |
| Hreflang | Present | 18 locales across content pages |
| Structured data | Present | Lodging, Article, BreadcrumbList, WebPage, WebSite, Organization |
| www redirect | Working | 301 site-wide |
| Legacy path redirects | Mostly working | `/en/assistance` → `/en/help` works; bare `/assistance` returns 404 |
| SSR content quality | Mixed | Experiences OK; how-to-get-here has i18n key leakage |
| Core Web Vitals | Unknown | PSI API rate-limited; no authenticated access |
| Search Console | Not connected | No API access configured |

## Open Issues (from tech audit 2026-03-08, fact-checked 2026-03-12)

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | 24 dead `/directions/*` URLs in sitemap (all 404) | High | Open — needs code fix in `generate-public-seo.ts` |
| 2 | i18n key leakage on how-to-get-here pages (SSR) | High | Open — namespace preload gap |
| 3 | Bare `/assistance` returns 404 (no redirect) | Medium | Open — needs `_redirects` entry |
| 4 | Sparse `lastmod` (23% coverage) | Medium | Open — needs content JSON backfill |

## lp-seo Phase Coverage

| Phase | Name | Status | Artifact |
|---|---|---|---|
| 1 | keyword-universe | Not started | Blocked — needs offer.md + channels.md |
| 2 | content-clusters | Not started | Blocked — needs Phase 1 |
| 3 | serp-briefs | Not started | Blocked — needs Phase 2 |
| 4 | tech-audit | Done | `2026-03-08-tech-audit-BRIK.user.md` (fact-checked 2026-03-12) |
| 5 | snippet-optimization | Not started | Blocked — needs Phase 3 + 4 |

## Backfill Requirements

### To unblock Phases 1-3

- `docs/business-os/startup-baselines/BRIK-offer.md` — formal offer artifact (data exists across plan/demand-pack, needs consolidation)
- `docs/business-os/startup-baselines/BRIK-channels.md` — formal channel strategy (direct 20.5% / OTA 79.5% split documented in demand-pack, needs formalization)

### To complete next audit cycle

- Google Search Console API access
- PageSpeed Insights authenticated endpoint (or re-run anonymous)
- CrUX data access (BigQuery or PSI API)

## Downstream Consumers

- `draft-marketing` — uses Phase 3 SERP briefs for content creation
- `lp-launch-qa` — uses Phase 4 tech audit checklist (available now)
- `lp-metrics` — uses phase outputs for SEO KPI tracking
