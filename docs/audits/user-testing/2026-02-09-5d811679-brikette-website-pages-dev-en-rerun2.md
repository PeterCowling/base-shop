---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://5d811679.brikette-website.pages.dev/en
Created: 2026-02-09
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-09T23:51:41.800Z
Artifacts-JSON: docs/audits/user-testing/2026-02-09-5d811679-brikette-website-pages-dev-en-rerun2.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-09-5d811679-brikette-website-pages-dev-en-rerun2-screenshots
---

# User Testing Audit: https://5d811679.brikette-website.pages.dev/en

## Coverage
- Discovered internal paths: 154
- Audited desktop pages: 10
- Audited mobile pages: 6
- Link checks run: 154

## Priority Summary
- P0 issues: 2
- P1 issues: 2
- P2 issues: 4

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | broken-internal-routes | Internal routes return 4xx/5xx |
| P0 | broken-images | Image assets fail to render |
| P1 | color-contrast | WCAG color contrast failures |
| P1 | mobile-menu-state-leak | Mobile menu appears/focuses when marked closed |
| P2 | aria-progressbar-name | Progressbar ARIA name missing |
| P2 | recurring-network-404-noise | Recurring 4xx fetch/XHR errors in console |
| P2 | touch-target-size | Touch targets below recommended size |
| P2 | horizontal-overflow | Horizontal overflow detected |

## Detailed Findings
### 1. [P0] Internal routes return 4xx/5xx

**Issue ID:** `broken-internal-routes`

**Evidence**
```json
{
  "brokenCount": 27,
  "samples": [
    {
      "page": "/en/help/amalfi-coast-travel-faqs",
      "status": 404
    },
    {
      "page": "/en/help/checkin-checkout",
      "status": 404
    },
    {
      "page": "/en/help/rules",
      "status": 404
    },
    {
      "page": "/en/help/changing-cancelling",
      "status": 404
    },
    {
      "page": "/en/experiences/praiano-travel-guide",
      "status": 404
    },
    {
      "page": "/en/experiences/beach-hopping-amalfi-coast",
      "status": 404
    },
    {
      "page": "/en/experiences/history-of-positano",
      "status": 404
    },
    {
      "page": "/en/experiences/avoid-crowds-off-the-beaten-path-positano",
      "status": 404
    },
    {
      "page": "/en/help/hostel-faqs",
      "status": 404
    },
    {
      "page": "/en/experiences/amalfi-coast-cuisine-guide",
      "status": 404
    },
    {
      "page": "/en/experiences/amalfi-town-guide",
      "status": 404
    },
    {
      "page": "/en/experiences/ravello-travel-guide",
      "status": 404
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Every internal navigation route linked from the audited pages returns HTTP 200 (or expected redirect).
- [ ] No help/support/article link in the audited navigation returns 404.
- [ ] Automated link check passes for audited internal routes.

### 2. [P0] Image assets fail to render

**Issue ID:** `broken-images`

**Evidence**
```json
{
  "pageCount": 11,
  "viewportAuditSamples": [],
  "assetSweepBrokenCount": 62,
  "assetSweepSamples": [
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/marina-di-praia/08-beach-club-entrance.webp",
      "status": 404,
      "pages": [
        "/en/experiences/marina-di-praia-and-secluded-beaches"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/marina-di-praia/03-marina-di-praia-swimmers.webp",
      "status": 404,
      "pages": [
        "/en/experiences/marina-di-praia-and-secluded-beaches"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/marina-di-praia/04-beach-setup.webp",
      "status": 404,
      "pages": [
        "/en/experiences/marina-di-praia-and-secluded-beaches"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/01-chiesa-nuova-stairs.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/02-fornillo-beach-workout.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/03-path-of-gods-trail.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/04-santa-maria-trail.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/05-fornillo-swimming.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/stay-fit-positano/06-terrace-stretching.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/stay-fit-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/capri-day-trip/capri-ferry-positano-marina.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/day-trip-capri-from-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/capri-day-trip/anacapri-piazza-vittoria.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/day-trip-capri-from-positano"
      ]
    },
    {
      "imageUrl": "https://5d811679.brikette-website.pages.dev/img/guides/capri-day-trip/monte-solaro-chairlift-view.jpg",
      "status": 404,
      "pages": [
        "/en/experiences/day-trip-capri-from-positano"
      ]
    }
  ]
}
```

**Acceptance Criteria**
- [ ] No `img` elements decode to `naturalWidth=0` on audited pages.
- [ ] No image requests return 4xx/5xx for audited pages and viewports.
- [ ] Sitewide HTML image-asset sweep reports 0 broken `/img/...` references.
- [ ] Lazy-loaded images render successfully after full-page scroll.

### 3. [P1] WCAG color contrast failures

**Issue ID:** `color-contrast`

**Evidence**
```json
{
  "pageCount": 2,
  "sampleViolations": [
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "nodeCount": 10,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/how-to-get-here",
      "viewport": "desktop",
      "nodeCount": 1,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/rooms",
      "viewport": "mobile",
      "nodeCount": 11,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/how-to-get-here",
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

### 4. [P1] Mobile menu appears/focuses when marked closed

**Issue ID:** `mobile-menu-state-leak`

**Evidence**
```json
{
  "pageCount": 6,
  "samples": [
    {
      "page": "/en",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    },
    {
      "page": "/en/rooms",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    },
    {
      "page": "/en/experiences",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    },
    {
      "page": "/en/how-to-get-here",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    },
    {
      "page": "/en/deals",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    },
    {
      "page": "/en/help",
      "leak": {
        "hasLeak": true,
        "linksVisible": 6,
        "panelClass": "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg translate-y-full",
        "panelTransform": "none",
        "panelDisplay": "block",
        "panelVisibility": "visible",
        "toggleExpanded": "false"
      }
    }
  ]
}
```

**Acceptance Criteria**
- [ ] When menu toggle is closed (`aria-expanded=false`), menu links are not visible or focusable.
- [ ] Closed-state menu panel has an effective offscreen/hidden transform in computed styles.
- [ ] Keyboard tab order skips mobile nav links until menu is explicitly opened.

### 5. [P2] Progressbar ARIA name missing

**Issue ID:** `aria-progressbar-name`

**Evidence**
```json
{
  "pageCount": 10,
  "samples": [
    {
      "page": "/en",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/experiences",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/how-to-get-here",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/deals",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/help",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/help/amalfi-coast-travel-faqs",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/help/checkin-checkout",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/help/rules",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en/help/changing-cancelling",
      "viewport": "desktop",
      "nodeCount": 1
    },
    {
      "page": "/en",
      "viewport": "mobile",
      "nodeCount": 1
    },
    {
      "page": "/en/rooms",
      "viewport": "mobile",
      "nodeCount": 1
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Every `role=progressbar` element has a valid accessible name (`aria-label` or `aria-labelledby`).
- [ ] Axe `aria-progressbar-name` reports 0 violations on audited pages.

### 6. [P2] Recurring 4xx fetch/XHR errors in console

**Issue ID:** `recurring-network-404-noise`

**Evidence**
```json
{
  "patternCount": 1,
  "samples": [
    {
      "signature": "404 /en/help.txt",
      "count": 10,
      "pageCount": 9
    }
  ]
}
```

**Acceptance Criteria**
- [ ] No recurring 4xx fetch/XHR errors appear during page load of audited routes.
- [ ] Browser console is free from deterministic missing-resource noise in normal navigation.

### 7. [P2] Touch targets below recommended size

**Issue ID:** `touch-target-size`

**Evidence**
```json
{
  "pageCount": 10,
  "samples": [
    {
      "page": "/en",
      "viewport": "desktop",
      "tinyTapTargets44": 21
    },
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "tinyTapTargets44": 47
    },
    {
      "page": "/en/experiences",
      "viewport": "desktop",
      "tinyTapTargets44": 142
    },
    {
      "page": "/en/how-to-get-here",
      "viewport": "desktop",
      "tinyTapTargets44": 39
    },
    {
      "page": "/en/deals",
      "viewport": "desktop",
      "tinyTapTargets44": 15
    },
    {
      "page": "/en/help",
      "viewport": "desktop",
      "tinyTapTargets44": 17
    },
    {
      "page": "/en/help/amalfi-coast-travel-faqs",
      "viewport": "desktop",
      "tinyTapTargets44": 21
    },
    {
      "page": "/en/help/checkin-checkout",
      "viewport": "desktop",
      "tinyTapTargets44": 21
    },
    {
      "page": "/en/help/rules",
      "viewport": "desktop",
      "tinyTapTargets44": 21
    },
    {
      "page": "/en/help/changing-cancelling",
      "viewport": "desktop",
      "tinyTapTargets44": 21
    },
    {
      "page": "/en",
      "viewport": "mobile",
      "tinyTapTargets44": 16
    },
    {
      "page": "/en/rooms",
      "viewport": "mobile",
      "tinyTapTargets44": 62
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.
- [ ] Lighthouse/Axe touch target checks pass for key conversion flows.

### 8. [P2] Horizontal overflow detected

**Issue ID:** `horizontal-overflow`

**Evidence**
```json
{
  "pageCount": 1,
  "samples": [
    {
      "page": "/en/how-to-get-here",
      "viewport": "mobile",
      "scrollWidth": 433,
      "clientWidth": 390
    }
  ]
}
```

**Acceptance Criteria**
- [ ] No audited page allows unintended horizontal scrolling at target mobile widths.
- [ ] Decorative/offscreen effects are clipped without widening document scroll width.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.