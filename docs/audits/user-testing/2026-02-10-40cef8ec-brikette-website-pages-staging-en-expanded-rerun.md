---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: https://40cef8ec.brikette-website.pages.dev/en
Created: 2026-02-10
Created-by: Claude (meta-user-test skill)
Audit-Timestamp: 2026-02-10T10:05:46.283Z
Deployment-URL: https://40cef8ec.brikette-website.pages.dev/en
Deployment-Run: https://github.com/PeterCowling/base-shop/actions/runs/21858712116
Deployment-Commit: eaf0ef7df5274c2b29680e9bd3cca37bb79e2213
Compared-To: docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-rerun-fixes.md
Artifacts-JSON: docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun.json
Artifacts-Screenshots: docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun-seo-summary.json
Artifacts-SEO-Raw: docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun-seo-artifacts
---

# User Testing Audit: https://40cef8ec.brikette-website.pages.dev/en

## Coverage
- Discovered internal paths: 136
- Audited desktop pages: 36
- Audited mobile pages: 24
- Link checks run: 136

## Priority Summary
- P0 issues: 0
- P1 issues: 1
- P2 issues: 2

## Delta vs Previous Audit
- Previous report: `docs/audits/user-testing/2026-02-10-180acf60-brikette-website-pages-staging-en-expanded-rerun-fixes.md`
- P0 delta: 0 -> 0
- P1 delta: 1 -> 1
- P2 delta: 2 -> 2
- Resolved IDs: `color-contrast`, `recurring-network-404-noise`
- Still-open IDs: `touch-target-size`
- Regressions/new IDs: `seo-console-errors-help-route`, `seo-label-accessible-name-mismatch`

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P2 | touch-target-size | Touch targets below recommended size |
| P1 | seo-console-errors-help-route | Console exception on `/en/help` during Lighthouse runs |
| P2 | seo-label-accessible-name-mismatch | Visible label text differs from accessible name on primary interactive elements |

## Detailed Findings
### 1. [P2] Touch targets below recommended size

**Issue ID:** `touch-target-size`

**Evidence**
```json
{
  "pageCount": 11,
  "samples": [
    {
      "page": "/en/experiences/positano-beaches",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/positano-main-beach-guide",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/walk-down-to-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/bus-down-to-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/walk-back-to-hostel-brikette-from-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/bus-back-to-hostel-brikette-from-positano-main-beach",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/marina-di-praia-and-secluded-beaches",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/fiordo-di-furore-beach-guide",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/hostel-brikette-to-fiordo-di-furore-by-bus",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/fiordo-di-furore-bus-return",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    },
    {
      "page": "/en/experiences/fornillo-beach-guide",
      "viewport": "desktop",
      "tinyTapTargets44": 12
    }
  ]
}
```

**Acceptance Criteria**
- [ ] Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.
- [ ] Lighthouse/Axe touch target checks pass for key conversion flows.

### 2. [P1] Console exception on `/en/help` during Lighthouse runs

**Issue ID:** `seo-console-errors-help-route`

**Evidence**
```json
{
  "page": "/en/help",
  "desktop": {
    "audit": "errors-in-console",
    "error": "Minified React error #418"
  },
  "mobile": {
    "audit": "errors-in-console",
    "error": "Minified React error #418"
  }
}
```

**Acceptance Criteria**
- [ ] Lighthouse `errors-in-console` passes on `/en/help` for desktop and mobile runs.
- [ ] No React runtime exception is emitted during initial render/hydration on `/en/help`.

### 3. [P2] Visible label text differs from accessible name on primary interactive elements

**Issue ID:** `seo-label-accessible-name-mismatch`

**Evidence**
```json
{
  "pages": [
    "/en",
    "/en/rooms",
    "/en/help"
  ],
  "audit": "label-content-name-mismatch",
  "sampleSelectors": [
    "body.antialiased > button.sticky",
    "section.mx-auto > div.flex > div.grid > a.group"
  ]
}
```

**Acceptance Criteria**
- [ ] Interactive elements with visible text have accessible names that include that visible text.
- [ ] Lighthouse `label-content-name-mismatch` passes on `/en`, `/en/rooms`, and `/en/help` (desktop + mobile).

## SEO Audit (Lighthouse)
- Scope: `/en`, `/en/rooms`, `/en/help` (desktop + mobile)
- Artifacts: `docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun-seo-artifacts`
- Summary: `docs/audits/user-testing/2026-02-10-40cef8ec-brikette-website-pages-staging-en-expanded-rerun-seo-summary.json`
- Average desktop: SEO 92, Accessibility 100, Best Practices 99
- Average mobile: SEO 93, Accessibility 100, Best Practices 99

| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| `/en` | 92 | 93 | `label-content-name-mismatch`, `is-crawlable` |
| `/en/rooms` | 92 | 93 | `label-content-name-mismatch`, `is-crawlable` |
| `/en/help` | 92 | 93 | `errors-in-console`, `label-content-name-mismatch`, `is-crawlable` |

`is-crawlable` failures are expected on staging because responses send `x-robots-tag: noindex`; they are tracked as non-blocking staging behavior, not a product defect.

## Notes
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.
