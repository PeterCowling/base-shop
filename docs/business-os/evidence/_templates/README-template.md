---
Type: Evidence-Pack
BIZ: <BRIK|HEAD|PET|HBAG>
Period: <YYYY-MM>
Created: <YYYY-MM-DD>
Owner: Pete
Index:
  - id: E-01
    file: <source>-<type>-<YYYY-MM-DD>.<ext>
    what-it-proves: <short description>
    confidence: <High|Medium|Low>
    stage-gate: <S2|S2B|S3|S6B|etc.>
---

# Evidence Pack — <BIZ> <YYYY-MM>

This directory stores raw evidence for the `<BIZ>` business for period `<YYYY-MM>`.
Artifact authors cite evidence by path (e.g., `docs/business-os/evidence/BRIK/2026-02/competitor-ad-library-2026-02-14.json`).

## File Naming Convention

```
<source>-<type>-<YYYY-MM-DD>.<ext>
```

Examples:
- `meta-ad-library-2026-02-14.json` — raw export from Meta Ad Library
- `tripadvisor-review-sample-2026-02-12.txt` — short-quote sample from TripAdvisor
- `competitor-pricing-2026-02-10.csv` — manually transcribed pricing table
- `analytics-ga4-weekly-2026-02-03.json` — GA4 export

## Evidence Index

| ID | File | What it proves | Confidence | Stage gate |
|----|------|----------------|-----------|------------|
| E-01 | `<file>` | `<what-it-proves>` | High/Medium/Low | S2/S2B/etc. |

## Compliance Guardrails

Before adding any evidence file, confirm ALL of the following:

- [ ] **Short quotes only**: extracted quotes are ≤3 sentences; no bulk content reproduced
- [ ] **Attributed**: each quote or data point names its source (platform, URL, date accessed)
- [ ] **No ToS-violating scraping**: data was collected via official API, manual review, or ad library UI — no automated scraping of review platforms
- [ ] **Minimum necessary**: only evidence needed for the cited claim is stored; no bulk downloads
- [ ] **Personal data excluded**: no customer names, emails, or PII in evidence files

Violating these guardrails is a hard blocker for the citing artifact's `Active` status.

## Stage Gate Reference

Evidence files are consumed by brand artifacts that cite them. The artifact's `Proof-Ledger` section lists which evidence entries support each claim. During gate review, gates verify:
1. The cited evidence file exists
2. The evidence matches what's claimed
3. Compliance guardrails above are met for that file

## How to Use

1. Create this directory: `docs/business-os/evidence/<BIZ>/<YYYY-MM>/`
2. Copy this README and fill in the frontmatter
3. Add evidence files following the naming convention
4. Fill in the Evidence Index table as files are added
5. In your artifact (e.g., `brand-dossier.user.md`), cite entries by their `E-XX` ID and relative path
