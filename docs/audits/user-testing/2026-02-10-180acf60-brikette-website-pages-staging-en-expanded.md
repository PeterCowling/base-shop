---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://180acf60.brikette-website.pages.dev/en
Created: 2026-02-10
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: 2026-02-10T07:56:50.475Z
Artifacts-JSON: docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-seo-summary.json
Artifacts-SEO-Raw: docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-seo-artifacts
---

# User Testing Audit: https://180acf60.brikette-website.pages.dev/en

## Coverage
- Discovered internal paths: 136
- Audited desktop pages: 36
- Audited mobile pages: 24
- Link checks run: 136

## Priority Summary
- P0 issues: 0
- P1 issues: 1
- P2 issues: 3

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P1 | color-contrast | WCAG color contrast failures |
| P2 | recurring-network-404-noise | Recurring 4xx fetch/XHR errors in console |
| P2 | touch-target-size | Touch targets below recommended size |
| P2 | seo-preview-noindex | Preview environment is blocked from indexing |

## Detailed Findings
### 1. [P1] WCAG color contrast failures

**Issue ID:** `color-contrast`

**Evidence**
```json
{
  "pageCount": 2,
  "sampleViolations": [
    {
      "page": "/en/rooms/room_12",
      "viewport": "desktop",
      "nodeCount": 2,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/how-to-get-here",
      "viewport": "mobile",
      "nodeCount": 1,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    },
    {
      "page": "/en/rooms/room_12",
      "viewport": "mobile",
      "nodeCount": 2,
      "help": "Elements must meet minimum color contrast ratio thresholds"
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Text contrast meets WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text).
- [ ] Axe `color-contrast` reports 0 violations on homepage and key landing pages.
- [ ] Updated palette passes both desktop and mobile checks.

### 2. [P2] Recurring 4xx fetch/XHR errors in console

**Issue ID:** `recurring-network-404-noise`

**Evidence**
```json
{
  "patternCount": 1,
  "samples": [
    {
      "signature": "404 /en/help.txt",
      "count": 34,
      "pageCount": 34
    }
  ]
}
```

**Acceptance Criteria**
- [ ] No recurring 4xx fetch/XHR errors appear during page load of audited routes.
- [ ] Browser console is free from deterministic missing-resource noise in normal navigation.

### 3. [P2] Touch targets below recommended size

**Issue ID:** `touch-target-size`

**Evidence**
```json
{
  "pageCount": 14,
  "samples": [
    {
      "page": "/en",
      "viewport": "desktop",
      "tinyTapTargets44": 10
    },
    {
      "page": "/en/rooms",
      "viewport": "desktop",
      "tinyTapTargets44": 23
    },
    {
      "page": "/en/experiences/positano-beaches",
      "viewport": "desktop",
      "tinyTapTargets44": 37
    },
    {
      "page": "/en/experiences/positano-main-beach-guide",
      "viewport": "desktop",
      "tinyTapTargets44": 27
    },
    {
      "page": "/en/experiences/walk-down-to-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 18
    },
    {
      "page": "/en/experiences/bus-down-to-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 18
    },
    {
      "page": "/en/experiences/walk-back-to-hostel-brikette-from-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 17
    },
    {
      "page": "/en/experiences/bus-back-to-hostel-brikette-from-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 17
    },
    {
      "page": "/en/experiences/marina-di-praia-and-secluded-beaches",
      "viewport": "desktop",
      "tinyTapTargets44": 19
    },
    {
      "page": "/en/experiences/fiordo-di-furore-beach-guide",
      "viewport": "desktop",
      "tinyTapTargets44": 29
    },
    {
      "page": "/en/experiences/hostel-brikette-to-fiordo-di-furore-by-bus",
      "viewport": "desktop",
      "tinyTapTargets44": 19
    },
    {
      "page": "/en/experiences/fiordo-di-furore-bus-return",
      "viewport": "desktop",
      "tinyTapTargets44": 17
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.
- [ ] Lighthouse/Axe touch target checks pass for key conversion flows.

## SEO Audit (Lighthouse)
- Run date: 2026-02-10 (UTC)
- Scope: `/en`, `/en/rooms`, `/en/help` on desktop and mobile
- SEO summary artifact: `docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-seo-summary.json`
- Raw Lighthouse artifacts: `docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-seo-artifacts`
- Average SEO score across 6 runs: `93`

| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| `/en` | 92 | 93 | `is-crawlable` (`x-robots-tag: noindex`) |
| `/en/rooms` | 92 | 93 | `is-crawlable` (`x-robots-tag: noindex`) |
| `/en/help` | 92 | 93 | `is-crawlable` (`x-robots-tag: noindex`) |

### SEO Finding A. [P2] Preview environment is blocked from indexing

**Issue ID:** `seo-preview-noindex`

**Evidence**
```json
{
  "affectedUrls": ["/en", "/en/rooms", "/en/help"],
  "desktopSeoScoreRange": "92-92",
  "mobileSeoScoreRange": "93-93",
  "failedAudit": "is-crawlable",
  "blockingDirective": "x-robots-tag: noindex"
}
```

**Acceptance Criteria**
- [ ] Preview/staging hostnames keep `x-robots-tag: noindex` (intentional).
- [ ] Production hostname does not send `x-robots-tag: noindex` unless explicitly intended.
- [ ] Production Lighthouse SEO run has `is-crawlable` passing on homepage and key landing pages.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.