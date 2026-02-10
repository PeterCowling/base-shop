---
Type: Audit-Report
Status: Draft
Domain: User-Testing
Target-URL: <https://example.com>
Created: YYYY-MM-DD
Created-by: Claude (user-testing-audit skill)
Audit-Timestamp: YYYY-MM-DDTHH:MM:SSZ
Artifacts-JSON: docs/audits/user-testing/YYYY-MM-DD-<slug>.json
Artifacts-Screenshots: docs/audits/user-testing/YYYY-MM-DD-<slug>-screenshots
Artifacts-SEO-Summary: docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-summary.json
Artifacts-SEO-Raw: docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-artifacts
---

# User Testing Audit: <target-url>

## Coverage
- Discovered internal paths: <n>
- Audited desktop pages: <n>
- Audited mobile pages: <n>
- Link checks run: <n>

## Priority Summary
- P0 issues: <n>
- P1 issues: <n>
- P2 issues: <n>

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

## SEO Audit (Lighthouse)
- Scope: `/<lang>`, `/<lang>/rooms`, `/<lang>/help` (desktop + mobile)
- Average SEO score: <n>

| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |
|---|---:|---:|---|
| `/<lang>` | <n> | <n> | <id or none> |

### SEO Finding A. [P2] <SEO Issue Title>

**Issue ID:** `<seo-issue-id>`

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
- Automated checks are deterministic but not a complete replacement for human exploratory testing.
- Re-run this audit after fixes to confirm regressions are resolved.
