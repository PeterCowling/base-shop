---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://hostel-positano.com/en
Created: 2026-02-11
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-11T23:09:02.181Z
Artifacts-JSON: docs/audits/user-testing/2026-02-11-hostel-positano-com-en-postfix-full-js-off-crawl.json
---

# Full JS-off Sitemap Crawl: https://hostel-positano.com/en

## Coverage
- Sitemaps visited: 1
- URLs discovered from sitemap: 165
- URLs crawled: 165
- HTML pages crawled: 165

## Preflight
- robots.txt status: 200
- sitemap.xml status: 200
- llms.txt status: 200

## Status Histogram
| Status | Count |
|---|---:|
| 200 | 165 |

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P1 | full-crawl-hreflang-self-missing | Localized pages missing self hreflang |

## Detailed Findings
### 1. [P1] Localized pages missing self hreflang

**Issue ID:** `full-crawl-hreflang-self-missing`

```json
{
  "count": 160,
  "sample": [
    {
      "routePath": "/de",
      "targetUrl": "https://hostel-positano.com/de",
      "finalUrl": "https://hostel-positano.com/de/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "home",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/angebote",
      "targetUrl": "https://hostel-positano.com/de/angebote",
      "finalUrl": "https://hostel-positano.com/de/angebote/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/angebote",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": false,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/altersgerechte-barrierefreiheit",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/altersgerechte-barrierefreiheit",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/altersgerechte-barrierefreiheit/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/altersgerechte-barrierefreiheit",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/anreise-mit-faehre",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/anreise-mit-faehre",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/anreise-mit-faehre/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/anreise-mit-faehre",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/buchungen-aendern-stornieren",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/buchungen-aendern-stornieren",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/buchungen-aendern-stornieren/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/buchungen-aendern-stornieren",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/buchungen-reservierungen",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/buchungen-reservierungen",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/buchungen-reservierungen/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/buchungen-reservierungen",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/einchecken-auschecken",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/einchecken-auschecken",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/einchecken-auschecken/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/einchecken-auschecken",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/kautionen-zahlungen",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/kautionen-zahlungen",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/kautionen-zahlungen/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/kautionen-zahlungen",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/maengel-schaeden",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/maengel-schaeden",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/maengel-schaeden/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/maengel-schaeden",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/rechtliches",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/rechtliches",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/rechtliches/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/rechtliches",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/regeln-richtlinien",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/regeln-richtlinien",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/regeln-richtlinien/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/regeln-richtlinien",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/sicherheit",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/sicherheit",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/sicherheit/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/sicherheit",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/hilfezentrum/travel-help",
      "targetUrl": "https://hostel-positano.com/de/hilfezentrum/travel-help",
      "finalUrl": "https://hostel-positano.com/de/hilfezentrum/travel-help/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": false,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/hilfezentrum/travel-help",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/karriere",
      "targetUrl": "https://hostel-positano.com/de/karriere",
      "finalUrl": "https://hostel-positano.com/de/karriere/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/karriere",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/de/zimmer",
      "targetUrl": "https://hostel-positano.com/de/zimmer",
      "finalUrl": "https://hostel-positano.com/de/zimmer/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/de/zimmer",
        "hreflangValues": [
          "en",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en",
      "targetUrl": "https://hostel-positano.com/en",
      "finalUrl": "https://hostel-positano.com/en/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "home",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance",
      "targetUrl": "https://hostel-positano.com/en/assistance",
      "finalUrl": "https://hostel-positano.com/en/assistance/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": false,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/age-accessibility",
      "targetUrl": "https://hostel-positano.com/en/assistance/age-accessibility",
      "finalUrl": "https://hostel-positano.com/en/assistance/age-accessibility/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/age-accessibility",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/arriving-by-ferry",
      "targetUrl": "https://hostel-positano.com/en/assistance/arriving-by-ferry",
      "finalUrl": "https://hostel-positano.com/en/assistance/arriving-by-ferry/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/arriving-by-ferry",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/bookings-reservations",
      "targetUrl": "https://hostel-positano.com/en/assistance/bookings-reservations",
      "finalUrl": "https://hostel-positano.com/en/assistance/bookings-reservations/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/bookings-reservations",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/changing-cancelling-bookings",
      "targetUrl": "https://hostel-positano.com/en/assistance/changing-cancelling-bookings",
      "finalUrl": "https://hostel-positano.com/en/assistance/changing-cancelling-bookings/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/changing-cancelling-bookings",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/checkin-checkout",
      "targetUrl": "https://hostel-positano.com/en/assistance/checkin-checkout",
      "finalUrl": "https://hostel-positano.com/en/assistance/checkin-checkout/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/checkin-checkout",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/defects-damages",
      "targetUrl": "https://hostel-positano.com/en/assistance/defects-damages",
      "finalUrl": "https://hostel-positano.com/en/assistance/defects-damages/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/defects-damages",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/deposits-payments",
      "targetUrl": "https://hostel-positano.com/en/assistance/deposits-payments",
      "finalUrl": "https://hostel-positano.com/en/assistance/deposits-payments/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/deposits-payments",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/legal",
      "targetUrl": "https://hostel-positano.com/en/assistance/legal",
      "finalUrl": "https://hostel-positano.com/en/assistance/legal/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/legal",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/rules-policies",
      "targetUrl": "https://hostel-positano.com/en/assistance/rules-policies",
      "finalUrl": "https://hostel-positano.com/en/assistance/rules-policies/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/rules-policies",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/security",
      "targetUrl": "https://hostel-positano.com/en/assistance/security",
      "finalUrl": "https://hostel-positano.com/en/assistance/security/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/security",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/assistance/travel-help",
      "targetUrl": "https://hostel-positano.com/en/assistance/travel-help",
      "finalUrl": "https://hostel-positano.com/en/assistance/travel-help/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": false,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/assistance/travel-help",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    },
    {
      "routePath": "/en/careers",
      "targetUrl": "https://hostel-positano.com/en/careers",
      "finalUrl": "https://hostel-positano.com/en/careers/",
      "status": 200,
      "error": "",
      "contentType": "text/html; charset=utf-8",
      "xRobotsTag": "",
      "isHtml": true,
      "isLocalizedPath": true,
      "template": "other",
      "noJs": {
        "hasMeaningfulH1": true,
        "hasNoBailoutMarker": true,
        "hasNoBookingFunnelI18nLeak": true,
        "hasBookingCtaFallback": true,
        "hasVisibleBookingCtaLabel": false
      },
      "samples": {
        "homeI18nKeys": [],
        "bookingI18nKeys": []
      },
      "head": {
        "canonicalHref": "https://hostel-positano.com/en/careers",
        "hreflangValues": [
          "de",
          "es",
          "fr",
          "it",
          "ja",
          "ko",
          "pt",
          "ru",
          "zh",
          "x-default"
        ],
        "hasCanonical": true,
        "hasSelfHreflang": false
      }
    }
  ]
}
```