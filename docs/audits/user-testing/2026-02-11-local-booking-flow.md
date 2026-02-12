---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: http://localhost:4020/en
Created: 2026-02-11
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-11T18:39:26.132Z
Artifacts-JSON: docs/audits/user-testing/2026-02-11-local-booking-flow.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-11-local-booking-flow-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/2026-02-11-local-booking-flow-seo-summary.json
---

# User Testing Audit: http://localhost:4020/en

## Coverage
- Discovered internal paths: 1
- Audited desktop pages: 1
- Audited mobile pages: 1
- Link checks run: 1

## Priority Summary
- P0 issues: 4
- P1 issues: 3
- P2 issues: 0

## No-JS Predicate Summary
| Route | Path | Status | Meaningful H1 | No Bailout Marker | No Home-Key Leak | No Booking-Key Leak | Booking CTA Fallback | Visible Book Now Label | Home Mailto Link | Home Named Social Links |
|---|---|---:|---|---|---|---|---|---|---|---|
| home | `/en` | 400 | no | yes | yes | yes | yes | no | no | no |
| rooms | `/en/rooms` | 400 | no | yes | - | yes | yes | no | - | - |
| roomDetail | `/en/rooms/double_room` | 400 | no | yes | - | yes | yes | no | - | - |
| experiences | `/en/experiences` | 400 | no | yes | - | yes | yes | no | - | - |
| howToGetHere | `/en/how-to-get-here` | 400 | no | yes | - | yes | yes | no | - | - |
| deals | `/en/deals` | 400 | no | yes | - | yes | yes | no | - | - |

## Booking Transaction Summary
| Flow | Route | Hydrated Interaction | Provider Handoff | Required Query Params | No Runtime Error | Pass | Observed Handoff |
|---|---|---|---|---|---|---|---|
| homeModalHandoff | `/en` | no | no | no | no | no | No visible booking CTA trigger found on homepage. |
| roomDetailRateHandoff | `/en/rooms/double_room` | no | no | no | no | no | No visible room-rate booking action found on room detail. |

## SEO/Lighthouse Summary
- SEO checks: skipped (`--skip-seo`)
- SEO execution errors: 0
| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| - | - | - | - |

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | no-js-route-shell-bailout | Top-nav routes fail no-JS SSR content checks |
| P0 | booking-cta-visible-label-missing | Booking funnel routes are missing visible booking CTA labels |
| P1 | social-proof-snapshot-date | Social proof snapshot date missing in initial HTML |
| P1 | contact-email-mailto-missing | Contact email is not rendered as a mailto link in initial HTML |
| P1 | social-links-accessible-name-missing | Social links are missing accessible names in initial HTML |
| P0 | booking-transaction-provider-handoff | Hydrated booking transaction cannot complete provider handoff |
| P0 | broken-internal-routes | Internal routes return 4xx/5xx |

## Detailed Findings
### 1. [P0] Top-nav routes fail no-JS SSR content checks

**Issue ID:** `no-js-route-shell-bailout`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "rooms",
      "route": "/en/rooms",
      "status": 400,
      "hasMeaningfulH1": false,
      "hasNoBailoutMarker": true
    },
    {
      "key": "experiences",
      "route": "/en/experiences",
      "status": 400,
      "hasMeaningfulH1": false,
      "hasNoBailoutMarker": true
    },
    {
      "key": "howToGetHere",
      "route": "/en/how-to-get-here",
      "status": 400,
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

### 2. [P0] Booking funnel routes are missing visible booking CTA labels

**Issue ID:** `booking-cta-visible-label-missing`

**Evidence**
```json
{
  "failingRoutes": [
    {
      "key": "home",
      "route": "/en",
      "status": 400,
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
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
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
      "status": 400,
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
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
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
      "key": "roomDetail",
      "route": "/en/rooms/double_room",
      "status": 400,
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
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
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
      "status": 400,
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
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
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
      "status": 400,
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
          "visibleButtonCount": 0,
          "visibleAnchorCount": 0,
          "visibleTotal": 0
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

### 3. [P1] Social proof snapshot date missing in initial HTML

**Issue ID:** `social-proof-snapshot-date`

**Evidence**
```json
{
  "route": "/en",
  "status": 400
}
```

**Acceptance Criteria**
- [ ] Homepage social proof includes explicit snapshot date disclosure.
- [ ] Snapshot date is rendered in initial HTML (no-JS check).

### 4. [P1] Contact email is not rendered as a mailto link in initial HTML

**Issue ID:** `contact-email-mailto-missing`

**Evidence**
```json
{
  "route": "/en",
  "status": 400,
  "mailto": {
    "hasMailtoLink": false,
    "linkCount": 0
  }
}
```

**Acceptance Criteria**
- [ ] At least one contact email address is rendered as a `mailto:` link in initial HTML.
- [ ] No-JS checks report `hasMailtoContactLink=true` on homepage.

### 5. [P1] Social links are missing accessible names in initial HTML

**Issue ID:** `social-links-accessible-name-missing`

**Evidence**
```json
{
  "route": "/en",
  "status": 400,
  "socialLinks": {
    "hasNamedSocialLinks": false,
    "socialLinkCount": 0,
    "unnamedSocialLinks": []
  }
}
```

**Acceptance Criteria**
- [ ] Each social link has a visible text label or an accessible name (`aria-label` / `aria-labelledby`).
- [ ] No-JS checks report `hasNamedSocialLinks=true` on homepage.

### 6. [P0] Hydrated booking transaction cannot complete provider handoff

**Issue ID:** `booking-transaction-provider-handoff`

**Evidence**
```json
{
  "failingFlows": [
    {
      "flowKey": "homeModalHandoff",
      "routePath": "/en",
      "flowType": "home-modal-booking",
      "hydratedInteraction": false,
      "hydratedTriggerWorked": false,
      "handoffObservedUrl": "",
      "handoffHref": "",
      "checks": {
        "hasHydratedInteraction": false,
        "hasProviderHandoff": false,
        "hasRequiredBookingQuery": false,
        "hasNoExecutionError": false,
        "passes": false
      },
      "handoffAnalysis": {
        "url": "",
        "isValidUrl": false,
        "isProviderHost": false,
        "isExpectedPath": false,
        "hasRequiredQuery": false,
        "missingQueryKeys": [
          "codice",
          "checkin",
          "checkout"
        ],
        "hasPartySize": false
      },
      "error": "No visible booking CTA trigger found on homepage."
    },
    {
      "flowKey": "roomDetailRateHandoff",
      "routePath": "/en/rooms/double_room",
      "flowType": "room-detail-rate-booking",
      "hydratedInteraction": false,
      "hydratedTriggerWorked": false,
      "handoffObservedUrl": "",
      "handoffHref": "",
      "checks": {
        "hasHydratedInteraction": false,
        "hasProviderHandoff": false,
        "hasRequiredBookingQuery": false,
        "hasNoExecutionError": false,
        "passes": false
      },
      "handoffAnalysis": {
        "url": "",
        "isValidUrl": false,
        "isProviderHost": false,
        "isExpectedPath": false,
        "hasRequiredQuery": false,
        "missingQueryKeys": [
          "codice",
          "checkin",
          "checkout"
        ],
        "hasPartySize": false
      },
      "error": "No visible room-rate booking action found on room detail."
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Hydrated booking CTA interactions open the expected booking surface (modal or rate selector) on all audited booking flows.
- [ ] Completing each booking flow transitions to the provider handoff URL on `book.octorate.com` (`result.xhtml` or `confirm.xhtml`).
- [ ] Provider handoff URLs include required booking query keys (`codice`, `checkin`, `checkout`, and party size).

### 7. [P0] Internal routes return 4xx/5xx

**Issue ID:** `broken-internal-routes`

**Evidence**
```json
{
  "brokenCount": 1,
  "samples": [
    {
      "page": "/en",
      "status": 400
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Every internal navigation route linked from the audited pages returns HTTP 200 (or expected redirect).
- [ ] No help/support/article link in the audited navigation returns 404.
- [ ] Automated link check passes for audited internal routes.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.