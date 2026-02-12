---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://2d506a9c.brikette-website.pages.dev/en
Created: 2026-02-11
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-11T19:50:25.999Z
Artifacts-JSON: docs/audits/user-testing/2026-02-11-crawl-hardening-discovery-policy.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-11-crawl-hardening-discovery-policy-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/2026-02-11-crawl-hardening-discovery-policy-seo-summary.json
---

# User Testing Audit: https://2d506a9c.brikette-website.pages.dev/en

## Coverage
- Discovered internal paths: 118
- Audited desktop pages: 16
- Audited mobile pages: 10
- Link checks run: 118

## Priority Summary
- P0 issues: 5
- P1 issues: 2
- P2 issues: 0

## No-JS Predicate Summary
| Route | Path | Status | Meaningful H1 | No Bailout Marker | No Home-Key Leak | No Booking-Key Leak | Booking CTA Fallback | Visible Book Now Label | Crawlable Experience Links | Crawlable Room Inventory | Home Mailto Link | Home Named Social Links |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| home | `/en` | 200 | no | no | no | no | yes | no | yes | yes | yes | yes |
| rooms | `/en/rooms` | 200 | yes | yes | - | no | yes | no | yes | yes | - | - |
| roomDetail | `/en/rooms/double_room` | 200 | yes | yes | - | no | yes | yes | yes | yes | - | - |
| experiences | `/en/experiences` | 200 | no | yes | - | yes | yes | no | no | yes | - | - |
| howToGetHere | `/en/how-to-get-here` | 200 | no | yes | - | no | yes | no | yes | yes | - | - |
| deals | `/en/deals` | 200 | yes | yes | - | yes | yes | no | yes | yes | - | - |

## Booking Transaction Summary
| Flow | Route | Hydrated Interaction | Provider Handoff | Required Query Params | No Runtime Error | Pass | Observed Handoff |
|---|---|---|---|---|---|---|---|
| homeModalHandoff | `/en` | yes | yes | yes | yes | yes | https://book.octorate.com/octobook/site/reservation/result.xhtml?checkin=2026-02-11&checkout=2026-02-13&codice=45111&pax=1 |
| roomDetailRateHandoff | `/en/rooms/double_room` | yes | yes | yes | yes | yes | https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-11&checkout=2026-02-13&pax=1&children=0&childrenAges= |

## Discovery Policy Summary
| Host | Preview Noindex Required | Preview Noindex Pass | Hreflang Pass | llms.txt Pass | llms.txt Status | llms.txt Sample |
|---|---|---|---|---|---:|---|
| 2d506a9c.brikette-website.pages.dev | yes | yes | no | yes | 200 | # Hostel Brikette > Cliff-top hostel in Positano, Italy — panoramic Amalfi Coast |

## SEO/Lighthouse Summary
- SEO checks: skipped (`--skip-seo`)
- SEO execution errors: 0
| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| - | - | - | - |

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | no-js-i18n-key-leakage | Homepage initial HTML leaks untranslated i18n keys |
| P0 | no-js-route-shell-bailout | Top-nav routes fail no-JS SSR content checks |
| P0 | no-js-booking-funnel-key-leakage | Booking funnel initial HTML leaks untranslated key tokens |
| P0 | booking-cta-visible-label-missing | Booking funnel routes are missing visible booking CTA labels |
| P0 | experiences-guide-text-links-missing | Experiences index lacks crawlable text links to guide detail pages |
| P1 | hreflang-policy-missing | Localized routes are missing hreflang alternates |
| P1 | color-contrast | WCAG color contrast failures |

## Detailed Findings
### 1. [P0] Homepage initial HTML leaks untranslated i18n keys

**Issue ID:** `no-js-i18n-key-leakage`

**Evidence**
```json
{
  "route": "/en",
  "status": 200,
  "samples": [
    "introSection.title",
    "heroSection.title",
    "heroSection.subtitle",
    "heroSection.secondaryCta",
    "socialProof.title",
    "socialProof.subtitle",
    "locationSection.title",
    "locationSection.subtitle",
    "locationSection.nearbyBeach",
    "heroSection.address",
    "locationSection.mapLabel",
    "locationSection.mapHint",
    "locationSection.mapCta"
  ]
}
```

**Acceptance Criteria**
- [ ] Homepage initial HTML contains resolved copy for hero and core section headings.
- [ ] No `heroSection.*`, `introSection.*`, `socialProof.*`, or `locationSection.*` tokens appear in raw HTML.
- [ ] No-JS route checks pass on desktop and mobile audit runs.

### 2. [P0] Top-nav routes fail no-JS SSR content checks

**Issue ID:** `no-js-route-shell-bailout`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "experiences",
      "route": "/en/experiences",
      "status": 200,
      "hasMeaningfulH1": false,
      "hasNoBailoutMarker": true
    },
    {
      "key": "howToGetHere",
      "route": "/en/how-to-get-here",
      "status": 200,
      "hasMeaningfulH1": false,
      "hasNoBailoutMarker": true
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Top-nav pages (`rooms`, `experiences`, `how-to-get-here`) render a meaningful non-empty H1 in initial HTML (not blank/punctuation/i18n-key token).
- [ ] No `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker appears in initial HTML for top-nav routes.
- [ ] No-JS route checks pass for all top-nav routes.

### 3. [P0] Booking funnel initial HTML leaks untranslated key tokens

**Issue ID:** `no-js-booking-funnel-key-leakage`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "home",
      "route": "/en",
      "status": 200,
      "hasNoBookingFunnelI18nLeak": false,
      "samples": [
        "locationSection.title",
        "locationSection.subtitle",
        "location.nearbyBusCompact",
        "locationSection.nearbyBeach",
        "location.getDirections",
        "location.justShowMap",
        "locationSection.mapLabel",
        "locationSection.mapHint",
        "locationSection.mapCta"
      ]
    },
    {
      "key": "rooms",
      "route": "/en/rooms",
      "status": 200,
      "hasNoBookingFunnelI18nLeak": false,
      "samples": [
        "rooms.title",
        "filters.all",
        "filters.private",
        "filters.dorms",
        "rooms.double_room.title",
        "rooms.room_10.title",
        "rooms.room_11.title",
        "rooms.room_12.title",
        "rooms.room_3.title",
        "rooms.room_4.title",
        "rooms.room_5.title",
        "rooms.room_6.title",
        "rooms.room_9.title",
        "rooms.room_8.title",
        "checkRatesNonRefundable",
        "checkRatesFlexible",
        "moreAboutThisRoom"
      ]
    },
    {
      "key": "roomDetail",
      "route": "/en/rooms/double_room",
      "status": 200,
      "hasNoBookingFunnelI18nLeak": false,
      "samples": [
        "roomImage.clickToEnlarge",
        "rooms.double_room.title",
        "location.nearbyBusCompact",
        "loadingPrice"
      ]
    },
    {
      "key": "howToGetHere",
      "route": "/en/how-to-get-here",
      "status": 200,
      "hasNoBookingFunnelI18nLeak": false,
      "samples": [
        "filters.resultsCount",
        "filters.editLabel",
        "intro.taxiEyebrow",
        "intro.taxi",
        "intro.shuttleEyebrow",
        "intro.shuttle",
        "romePlanner.title",
        "romePlanner.subtitle",
        "romePlanner.directionPrompt",
        "romePlanner.tabs.from",
        "romePlanner.tabs.to",
        "romePlanner.pref.prompt",
        "romePlanner.pref.cheapest.label",
        "romePlanner.pref.scenic.label",
        "romePlanner.pref.heavyPrefix",
        "romePlanner.pref.heavy_luggage.label",
        "romePlanner.reco.title",
        "romePlanner.route.naples.ferry.title",
        "romePlanner.route.naples.ferry.summary.to",
        "romePlanner.otherMatches",
        "romePlanner.route.salerno.ferry.title",
        "romePlanner.route.salerno.ferry.summary.to",
        "romePlanner.tag.ferry",
        "romePlanner.tag.scenic",
        "romePlanner.ui.showDetails"
      ]
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Booking funnel routes (`home`, `rooms`, `room-detail`, `experiences`, `how-to-get-here`) render localized strings in initial HTML.
- [ ] No booking-funnel key tokens (for example `roomImage.*`, `loadingPrice`, `checkRates*`, `filters.*`, `romePlanner.*`) appear in no-JS route HTML.
- [ ] Route no-JS checks report `hasNoBookingFunnelI18nLeak=true` across all target routes.

### 4. [P0] Booking funnel routes are missing visible booking CTA labels

**Issue ID:** `booking-cta-visible-label-missing`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "home",
      "route": "/en",
      "status": 200,
      "hasVisibleBookingCtaLabel": false,
      "missingLabels": [
        "Book Now"
      ],
      "labelCounts": [
        {
          "label": "Book Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        },
        {
          "label": "Check availability",
          "visibleButtonCount": 2,
          "visibleAnchorCount": 1,
          "visibleTotal": 3
        },
        {
          "label": "Reserve Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        }
      ]
    },
    {
      "key": "rooms",
      "route": "/en/rooms",
      "status": 200,
      "hasVisibleBookingCtaLabel": false,
      "missingLabels": [
        "Book Now"
      ],
      "labelCounts": [
        {
          "label": "Book Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        },
        {
          "label": "Check availability",
          "visibleButtonCount": 2,
          "visibleAnchorCount": 1,
          "visibleTotal": 3
        },
        {
          "label": "Reserve Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        }
      ]
    },
    {
      "key": "experiences",
      "route": "/en/experiences",
      "status": 200,
      "hasVisibleBookingCtaLabel": false,
      "missingLabels": [
        "Book Now"
      ],
      "labelCounts": [
        {
          "label": "Book Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        },
        {
          "label": "Check availability",
          "visibleButtonCount": 2,
          "visibleAnchorCount": 1,
          "visibleTotal": 3
        },
        {
          "label": "Reserve Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        }
      ]
    },
    {
      "key": "howToGetHere",
      "route": "/en/how-to-get-here",
      "status": 200,
      "hasVisibleBookingCtaLabel": false,
      "missingLabels": [
        "Book Now"
      ],
      "labelCounts": [
        {
          "label": "Book Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        },
        {
          "label": "Check availability",
          "visibleButtonCount": 2,
          "visibleAnchorCount": 1,
          "visibleTotal": 3
        },
        {
          "label": "Reserve Now",
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
        }
      ]
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Every booking-funnel route exposes a visible `Book Now` CTA label in initial HTML.
- [ ] Route no-JS checks report `hasVisibleBookingCtaLabel=true` across funnel routes.

### 5. [P0] Experiences index lacks crawlable text links to guide detail pages

**Issue ID:** `experiences-guide-text-links-missing`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "experiences",
      "route": "/en/experiences",
      "status": 200,
      "hasCrawlableGuideLinks": false,
      "guideLinks": {
        "hasCrawlableGuideLinks": false,
        "guideDetailLinkCount": 54,
        "textLinkedGuideCount": 0,
        "sampleGuideLinks": []
      }
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Experiences guide cards expose text-based `<a href>` links to detail pages in initial HTML.
- [ ] No-JS checks report `hasCrawlableGuideLinks=true` for the experiences route.

### 6. [P1] Localized routes are missing hreflang alternates

**Issue ID:** `hreflang-policy-missing`

**Evidence**
```json
{
  "hostname": "2d506a9c.brikette-website.pages.dev",
  "lang": "en",
  "failingRoutes": [
    {
      "routePath": "/en",
      "status": 200,
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
        "vi"
      ]
    },
    {
      "routePath": "/en/rooms",
      "status": 200,
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
        "vi"
      ]
    },
    {
      "routePath": "/en/help",
      "status": 200,
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
        "vi"
      ]
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Localized routes publish `<link rel="alternate" hreflang="...">` tags.
- [ ] Each localized route includes a self hreflang entry for the active language.
- [ ] Discovery policy checks pass `hreflangPolicy` on audited localized routes.

### 7. [P1] WCAG color contrast failures

**Issue ID:** `color-contrast`

**Evidence**
```json
{
  "pageCount": 1,
  "sampleViolations": [
    {
      "page": "/en",
      "viewport": "desktop",
      "nodeCount": 1,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en",
      "viewport": "mobile",
      "nodeCount": 1,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Text contrast meets WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text).
- [ ] Axe `color-contrast` reports 0 violations on homepage and key landing pages.
- [ ] Updated palette passes both desktop and mobile checks.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.