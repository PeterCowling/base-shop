---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://c0227146.brikette-website.pages.dev/en
Created: 2026-02-09
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-10T00:02:09.606Z
Artifacts-JSON: docs/audits/user-testing/2026-02-09-c0227146-brikette-website-pages-dev-en.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-09-c0227146-brikette-website-pages-dev-en-screenshots
---

# User Testing Audit: https://c0227146.brikette-website.pages.dev/en

## Coverage
- Discovered internal paths: 139
- Audited desktop pages: 10
- Audited mobile pages: 6
- Link checks run: 139

## Priority Summary
- P0 issues: 2
- P1 issues: 1
- P2 issues: 2

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | broken-internal-routes | Internal routes return 4xx/5xx |
| P0 | untranslated-i18n-keys | Raw i18n keys leak into user-visible UI |
| P1 | color-contrast | WCAG color contrast failures |
| P2 | recurring-network-404-noise | Recurring 4xx fetch/XHR errors in console |
| P2 | touch-target-size | Touch targets below recommended size |

## Detailed Findings
### 1. [P0] Internal routes return 4xx/5xx

**Issue ID:** `broken-internal-routes`

**Evidence**
```json
{
  "brokenCount": 9,
  "samples": [
    {
      "page": "/en/how-to-get-here/how-to-get-here",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positano-naples-ferry",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/chiesa-nuova-arrivals",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/chiesaNuovaDepartures",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positanoSorrentoBus",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positanoNaplesCenterFerry",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positanoSalernoBus",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positanoAmalfiBus",
      "status": 404
    },
    {
      "page": "/en/how-to-get-here/positanoRavelloBus",
      "status": 404
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Every internal navigation route linked from the audited pages returns HTTP 200 (or expected redirect).
- [ ] No help/support/article link in the audited navigation returns 404.
- [ ] Automated link check passes for audited internal routes.

### 2. [P0] Raw i18n keys leak into user-visible UI

**Issue ID:** `untranslated-i18n-keys`

**Evidence**
```json
{
  "pageCount": 2,
  "samples": [
    {
      "page": "/en",
      "viewport": "desktop",
      "samples": [
        "sources.hostelworld.label",
        "sources.booking.label"
      ]
    },
    {
      "page": "/en/rooms/double_room",
      "viewport": "desktop",
      "samples": [
        "rooms.double_room.title",
        "ROOMS.DOUBLE_ROOM.TITLE",
        "rooms.double_room.bed_description",
        "detail.common.amenitiesHeading",
        "detail.common.amenitiesIntro"
      ]
    }
  ]
}
```

**Acceptance Criteria**
- [ ] All user-facing labels, headings, and descriptions resolve to localized strings.
- [ ] No `namespace.key.path` patterns appear in rendered UI text on audited pages.
- [ ] Both desktop and mobile snapshots for affected pages show translated content only.

### 3. [P1] WCAG color contrast failures

**Issue ID:** `color-contrast`

**Evidence**
```json
{
  "pageCount": 1,
  "sampleViolations": [
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "nodeCount": 1,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/rooms",
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

### 4. [P2] Recurring 4xx fetch/XHR errors in console

**Issue ID:** `recurring-network-404-noise`

**Evidence**
```json
{
  "patternCount": 1,
  "samples": [
    {
      "signature": "404 /en/help.txt",
      "count": 6,
      "pageCount": 6
    }
  ]
}
```

**Acceptance Criteria**
- [ ] No recurring 4xx fetch/XHR errors appear during page load of audited routes.
- [ ] Browser console is free from deterministic missing-resource noise in normal navigation.

### 5. [P2] Touch targets below recommended size

**Issue ID:** `touch-target-size`

**Evidence**
```json
{
  "pageCount": 9,
  "samples": [
    {
      "page": "/en",
      "viewport": "desktop",
      "tinyTapTargets44": 11
    },
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "tinyTapTargets44": 44
    },
    {
      "page": "/en/experiences",
      "viewport": "desktop",
      "tinyTapTargets44": 17
    },
    {
      "page": "/en/deals",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/help",
      "viewport": "desktop",
      "tinyTapTargets44": 14
    },
    {
      "page": "/en/terms",
      "viewport": "desktop",
      "tinyTapTargets44": 10
    },
    {
      "page": "/en/privacy-policy",
      "viewport": "desktop",
      "tinyTapTargets44": 10
    },
    {
      "page": "/en/cookie-policy",
      "viewport": "desktop",
      "tinyTapTargets44": 10
    },
    {
      "page": "/en/rooms/double_room",
      "viewport": "desktop",
      "tinyTapTargets44": 15
    },
    {
      "page": "/en",
      "viewport": "mobile",
      "tinyTapTargets44": 10
    },
    {
      "page": "/en/rooms",
      "viewport": "mobile",
      "tinyTapTargets44": 56
    },
    {
      "page": "/en/experiences",
      "viewport": "mobile",
      "tinyTapTargets44": 131
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.
- [ ] Lighthouse/Axe touch target checks pass for key conversion flows.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.