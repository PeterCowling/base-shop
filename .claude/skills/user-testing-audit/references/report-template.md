---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: <https://example.com>
Created: YYYY-MM-DD
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: YYYY-MM-DDTHH:MM:SSZ
Deployment-URL: <https://<hash>.brikette-website.pages.dev/en>
Deployment-Run: <https://github.com/<owner>/<repo>/actions/runs/<id>>
Deployment-Commit: <sha>
Compared-To: <docs/audits/user-testing/YYYY-MM-DD-<previous-slug>.md | none>
Artifacts-Full-Crawl-Markdown: docs/audits/user-testing/YYYY-MM-DD-<slug>-full-js-off-crawl.md
Artifacts-Full-Crawl-JSON: docs/audits/user-testing/YYYY-MM-DD-<slug>-full-js-off-crawl.json
Artifacts-Focused-Markdown: docs/audits/user-testing/YYYY-MM-DD-<slug>.md
Artifacts-Focused-JSON: docs/audits/user-testing/YYYY-MM-DD-<slug>.json
Artifacts-Screenshots: docs/audits/user-testing/YYYY-MM-DD-<slug>-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-summary.json
Artifacts-SEO-Raw: docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-artifacts
---

# User Testing Audit: <target-url>

## Audit Layers
- Layer A: full sitemap JS-off crawl for complete machine-readability/indexability inventory.
- Layer B: focused JS-on user-flow checks for booking, hydration, mobile UX, and accessibility.

## Coverage
- Full crawl sitemaps visited: <n>
- Full crawl URLs discovered: <n>
- Full crawl URLs crawled: <n>
- Focused run discovered internal paths: <n>
- Focused run audited desktop pages: <n>
- Focused run audited mobile pages: <n>
- Focused run link checks: <n>

## Priority Summary
- P0 issues: <n>
- P1 issues: <n>
- P2 issues: <n>

## Layer A Summary (Full JS-off Crawl)
- Full crawl report: `docs/audits/user-testing/YYYY-MM-DD-<slug>-full-js-off-crawl.md`
- Full crawl JSON: `docs/audits/user-testing/YYYY-MM-DD-<slug>-full-js-off-crawl.json`

| Status | Count |
|---|---:|
| 200 | <n> |
| 301/302 | <n> |
| 4xx/5xx/ERR | <n> |

## No-JS Predicate Summary (Focused)
| Route | Path | Status | H1 Present | No Bailout Marker |
|---|---|---:|---|---|
| home | `/en` | 200 | yes | yes |

## Booking Transaction Summary (Focused)
| Flow | Route | CTA pass | Handoff URL pass | Params pass | Runtime error | Overall |
|---|---|---|---|---|---|---|
| dorm-next-month | `/en/rooms` | yes | yes | yes | none | pass |

## Discovery Policy Summary (Focused)
| Host | Preview Noindex Required | Preview Noindex Pass | Hreflang Pass | llms.txt Pass |
|---|---|---|---|---|
| `<host>` | yes | yes | yes | yes |

## Delta vs Previous Audit
- Previous report: <path | none>
- P0 delta: <before> -> <after>
- P1 delta: <before> -> <after>
- P2 delta: <before> -> <after>
- Resolved IDs: <comma-separated IDs or none>
- Still-open IDs: <comma-separated IDs or none>
- Regressions/new IDs: <comma-separated IDs or none>

## SEO/Lighthouse Summary (Focused)
- Average SEO score: <n>

| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| `/<lang>` | <n> | <n> | <id or none> |

## Findings Index
| Priority | Issue ID | Title |
|---|---|---|
| P0 | <issue-id> | <title> |

## Detailed Findings

### 1. [P0] <Issue Title>

**Issue ID:** `<issue-id>`

**Evidence**
```json
{
  "sample": "..."
}
```

**Acceptance Criteria**
- [ ] <objective criterion>
- [ ] <objective criterion>

## Notes
- Layer A provides completeness; layer B provides conversion-path behavioral coverage.
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run both layers after fixes to confirm regressions are resolved.
