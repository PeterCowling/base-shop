---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://ad824098.brikette-website.pages.dev/en
Created: 2026-02-11
Created-by: Claude (meta-user-test skill)
Audit-Timestamp: 2026-02-11T22:20:56.318Z
Artifacts-JSON: docs/audits/user-testing/2026-02-11-ad824098-brikette-website-pages-staging-en-full-full-js-off-crawl.json
---

# Full JS-off Sitemap Crawl: https://ad824098.brikette-website.pages.dev/en

## Coverage
- Sitemaps visited: 1
- URLs discovered from sitemap: 0
- URLs crawled: 1
- HTML pages crawled: 1

## Preflight
- robots.txt status: 200
- sitemap.xml status: 200
- llms.txt status: 200

## Status Histogram
| Status | Count |
|---|---:|
| 200 | 1 |

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | full-crawl-no-js-shell | Key routes fail no-JS shell checks |
| P1 | full-crawl-hreflang-self-missing | Localized pages missing self hreflang |

## Detailed Findings
### 1. [P0] Key routes fail no-JS shell checks

**Issue ID:** `full-crawl-no-js-shell`

```json
{
  "count": 1,
  "sample": [
    {
      "routePath": "/en",
      "targetUrl": "https://ad824098.brikette-website.pages.dev/en",
      "finalUrl": "https://ad824098.brikette-website.pages.dev/en",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "noindex",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "home",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": false,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [
          "socialProof.title",
          "socialProof.subtitle"
        ],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/",
        "hreflangValues": [
          "es",
          "de",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "ar",
          "hi",
          "vi",
          "pl",
          "sv",
          "no",
          "da",
          "hu",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    }
  ]
}
```

### 2. [P1] Localized pages missing self hreflang

**Issue ID:** `full-crawl-hreflang-self-missing`

```json
{
  "count": 1,
  "sample": [
    {
      "routePath": "/en",
      "targetUrl": "https://ad824098.brikette-website.pages.dev/en",
      "finalUrl": "https://ad824098.brikette-website.pages.dev/en",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "noindex",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "home",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": false,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [
          "socialProof.title",
          "socialProof.subtitle"
        ],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/",
        "hreflangValues": [
          "es",
          "de",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "ar",
          "hi",
          "vi",
          "pl",
          "sv",
          "no",
          "da",
          "hu",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    }
  ]
}
```