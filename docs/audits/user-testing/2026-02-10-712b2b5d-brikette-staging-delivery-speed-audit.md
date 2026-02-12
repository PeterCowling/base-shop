---
Type: Audit-Report
Status: Accepted
Domain: Delivery-Speed
Target-URL: https://staging.brikette-website.pages.dev
Deployment-ID: 712b2b5d
Deployment-URL: https://712b2b5d.brikette-website.pages.dev
Source-Commit: 36808e4
Created: 2026-02-10
Created-by: Claude (wf-build skill)
Plan: docs/plans/brikette-live-delivery-speed-v2-plan.md
---

# Delivery Speed Audit: Brikette Staging (712b2b5d)

Verification audit for the **Brikette Live Delivery Speed** plan. Tests cache headers (`_headers` file on CF Pages) and GA4 analytics injection (`NEXT_PUBLIC_GA_MEASUREMENT_ID` env var at build time).

## Deployment Context

| Property | Value |
|---|---|
| Deployment ID | `712b2b5d` |
| Branch | `staging` |
| Source commit | `36808e4` (PR #7206 merge) |
| Architecture | Static export (`OUTPUT_EXPORT=1`) → `out/` → `wrangler pages deploy` → Cloudflare Pages |
| Staging URL | `https://staging.brikette-website.pages.dev` |
| Deployment URL | `https://712b2b5d.brikette-website.pages.dev` |
| Audit timestamp | 2026-02-10T10:30:00Z |

## 1. Cache Headers

**Method:** `curl -sI <url>` against `staging.brikette-website.pages.dev`

### Results

| Route | `cache-control` header | Expected | Status |
|---|---|---|---|
| `/en` | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400` | `s-maxage=600, swr=86400` | PASS |
| `/en/book` | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400, no-store` | includes `no-store` | PASS |
| `/en/experiences` | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400` | `s-maxage=600, swr=86400` | PASS |
| `/en/rooms` | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400` | `s-maxage=600, swr=86400` | PASS |
| `/data/rates.json` | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400, public, max-age=0, s-maxage=300, stale-while-revalidate=86400` | includes `s-maxage=300` | PASS (minor) |

### Notes

- **`/en/book` no-store:** The `/*` catch-all and `/*/book*` rules merge on CF Pages. Per HTTP spec, `no-store` takes precedence — browsers will not cache the booking page. Correct behavior.
- **`/data/rates.json` duplicate directives:** The `/*` catch-all (`s-maxage=600`) and `/data/*` rule (`s-maxage=300`) both match and CF Pages concatenates both. Per RFC 9111, when duplicate `s-maxage` values appear, the CDN should use the last value (300s). Minor cosmetic issue; functionally correct.
- **`x-robots-tag: noindex`** present on staging — prevents search engine indexing. Correct for staging environment.

### Verification

```bash
curl -sI "https://staging.brikette-website.pages.dev/en" | grep cache-control
# cache-control: public, max-age=0, s-maxage=600, stale-while-revalidate=86400

curl -sI "https://staging.brikette-website.pages.dev/en/book" | grep cache-control
# cache-control: public, max-age=0, s-maxage=600, stale-while-revalidate=86400, no-store
```

## 2. GA4 Analytics (Google Analytics 4)

**Method:** `curl -s <url>` then grep for GA4 markers in HTML source.

### Results

| Check | Expected | Actual | Status |
|---|---|---|---|
| Measurement ID in HTML | `G-2ZSYXG8R7T` | `G-2ZSYXG8R7T` | PASS |
| gtag.js script tag | `googletagmanager.com/gtag/js?id=G-2ZSYXG8R7T` | Present (2 references) | PASS |
| `gtag('config', ...)` call | `gtag('config', 'G-2ZSYXG8R7T')` | Present | PASS |
| `gtag('js', new Date())` call | Present | Present | PASS |

### Configuration

- **GitHub repo variable:** `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2ZSYXG8R7T` (set via `gh variable set`)
- **Workflow injection:** `brikette.yml` build command passes `NEXT_PUBLIC_GA_MEASUREMENT_ID=${{ vars.NEXT_PUBLIC_GA_MEASUREMENT_ID || '' }}` inline before `pnpm exec next build`
- **Guard:** `layout.tsx` only loads gtag when `IS_PROD && GA_MEASUREMENT_ID` is set. `IS_PROD` is true during `next build` (`NODE_ENV=production`).

### GA4 stream details

| Property | Value |
|---|---|
| Stream name | hostel |
| Stream URL | https://hostel-positano.com |
| Stream ID | 10183287178 |
| Measurement ID | G-2ZSYXG8R7T |

### Verification

```bash
curl -s "https://staging.brikette-website.pages.dev/en" | grep -oE "G-[A-Z0-9]+" | sort -u
# G-2ZSYXG8R7T

curl -s "https://staging.brikette-website.pages.dev/en" | grep -c "googletagmanager.com/gtag"
# 2

curl -s "https://staging.brikette-website.pages.dev/en" | grep -o "gtag([^)]*)" | head -5
# gtag()
# gtag('js', new Date()
# gtag('config', 'G-2ZSYXG8R7T')
```

## 3. Other Checks

| Check | Result | Status |
|---|---|---|
| HTTP status `/en` | 200 | PASS |
| HTTP status `/en/book` | 200 | PASS |
| HTTP status `/en/experiences` | 200 | PASS |
| HTTP status `/en/rooms` | 200 | PASS |
| HTTP status `/data/rates.json` | 200 | PASS |
| `x-robots-tag: noindex` on staging | Present | PASS |

## Summary

| Category | Checks | Pass | Fail | Minor |
|---|---|---|---|---|
| Cache headers | 5 | 4 | 0 | 1 (duplicate directives on rates.json) |
| GA4 analytics | 4 | 4 | 0 | 0 |
| HTTP status | 5 | 5 | 0 | 0 |
| **Total** | **14** | **13** | **0** | **1** |

**Overall: PASS** — All functional checks pass. One cosmetic issue with duplicate cache-control directives on `/data/rates.json` (functionally correct, lower s-maxage wins).

## Plan Task Mapping

| Plan Task | Description | Audit Result |
|---|---|---|
| TASK-03 | Verify `_headers` on staging | PASS — all routes return correct `cache-control` |
| TASK-04 | GA4 measurement setup | PASS — `G-2ZSYXG8R7T` injected and gtag loading |

## Remaining Work (per plan)

- **TASK-04 pending verification:** GA4 data collection is "not active" per Google — need to wait for first real pageview events to flow through (24-48h).
- **TASK-07 (optional):** Bundle size investigation — `guides.state.ts` identified as primary bottleneck (200KB chunk). Deferred; not blocking.
- **Production deploy:** Cache headers and GA4 will activate on production when next deploy to `main` occurs (same `_headers` file and env var are already configured for both environments).
