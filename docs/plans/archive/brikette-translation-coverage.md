# Brikette Translation Coverage Audit

Type: Research
Status: Active
Domain: Brikette i18n
Last-reviewed: 2026-02-09
Audit-Ref: b559badf70
Relates-to plan: docs/plans/brikette-translation-coverage-plan.md

---

## Executive Summary

Brikette has strong **file-level** translation coverage across 18 supported languages. All locales now have identical file structure — 39 root JSON files, 168 guide content files, and 24 how-to-get-here route files per locale. Previous key-level gaps (invalid JSON, missing keys, schema drift) have been resolved.

**Overall Assessment:** Good (A-). File and key parity is now symmetric across all locales.

### Key Issues Found

| Issue | Severity | Scope |
|-------|----------|-------|
| Invalid JSON locale files (`experiencesPage.json`) | Resolved | de, hi, ko, pl, zh |
| Missing keys in `howToGetHere.json` | Resolved | All 17 non-EN languages |
| Missing keys in `translation.json` (skip links) | Not applicable | Keys never existed in EN (see note below) |
| Schema drift in `dealsPage.json` (`perksList` items) | Resolved | All 17 non-EN languages |
| ~~24 legacy route JSON files in some locales~~ | Resolved | All locales now symmetric (see below) |
| Polish interpolation placeholders (`__placeholder_0__`) | Resolved | pl only |

---

## Supported Languages

| Code | Language | Tier | Root Files | Status |
|------|----------|------|------------|--------|
| en | English | Primary | 39 | Baseline |
| de | German | Tier 1 | 39 | Parity |
| es | Spanish | Tier 1 | 39 | Parity |
| fr | French | Tier 1 | 39 | Parity |
| it | Italian | Tier 1 | 39 | Parity |
| ja | Japanese | Tier 1 | 39 | Parity |
| ko | Korean | Tier 1 | 39 | Parity |
| pt | Portuguese | Tier 1 | 39 | Parity |
| ru | Russian | Tier 1 | 39 | Parity |
| zh | Chinese | Tier 1 | 39 | Parity |
| ar | Arabic | Tier 2 | 39 | RTL |
| hi | Hindi | Tier 2 | 39 | Parity |
| vi | Vietnamese | Tier 2 | 39 | Parity |
| pl | Polish | Tier 2 | 39 | Parity |
| sv | Swedish | Tier 2 | 39 | Parity |
| no | Norwegian | Tier 2 | 39 | Parity |
| da | Danish | Tier 2 | 39 | Parity |
| hu | Hungarian | Tier 2 | 39 | Parity |

**Note:** All 18 locales now have identical file structure: 39 root JSON files, 168 guide content files, and 24 how-to-get-here route files each. The legacy route file asymmetry described in earlier versions of this audit has been resolved.

---

## Key-Level Parity Issues

### Locale JSON Validity

All locale JSON now parses as strict JSON.

Note: earlier versions of this audit found invalid quoting in `*/experiencesPage.json` for `de`, `hi`, `ko`, `pl`, `zh`; this has been corrected.

### Missing Keys (EN vs non-EN)

```
howToGetHere.json (previously missing in every non-EN locale; now present):
  - destinations.sections.image.caption
  - destinations.sections.links.facts.cost
  - destinations.sections.links.facts.duration
  - destinations.sections.links.facts.luggageFriendly
  - destinations.sections.links.facts.seasonality
  - destinations.sections.links.facts.walking
  - lightbox.openAria
  - lightbox.openAriaWithCaption
  - lightbox.titleFallback
  - sorrento.links.facts.cost
  - sorrento.links.facts.duration
  - sorrento.links.facts.luggageFriendly
  - sorrento.links.facts.seasonality
  - sorrento.links.facts.walking

translation.json — accessibility.skipToMain / accessibility.skipToNav:
  - These keys do NOT exist in EN (accessibility object is empty `{}`).
  - They were never added to any locale. The original audit was incorrect.
  - If skip-link translations are needed, they must first be added to EN.

dealsPage.json (schema drift — resolved):
  - perksList is now a uniform array of `{ title, subtitle }` objects in all 18 locales
```

---

## Guide Content Issues

### File Parity

| Issue | Details |
|-------|---------|
| Resolved | Added `apps/brikette/src/locales/en/guides/content/positanoMainBeach.json` and wired a dedicated route + manifest entry so `positanoMainBeach` is reachable. |
| Resolved | All 18 locales now have identical sets of 168 guide content JSON files. |

---

## Legacy Route File Duplication

> **Resolved.** The legacy root-level route JSON files described in earlier versions of this audit (e.g., `capriPositanoFerry.json`, `positanoAmalfiBus.json`) no longer exist at the root level of any locale. All route content now lives under `{lang}/how-to-get-here/routes/` (24 files per locale), and all 18 locales have identical file sets.

---

## How to Reproduce This Audit

### 1. Count Root JSON Files per Language

```bash
cd apps/brikette/src/locales
for lang in en de es fr it ja ko pt ru zh ar hi vi pl sv no da hu; do
  count=$(ls -1 "$lang"/*.json 2>/dev/null | wc -l)
  echo "$lang: $count"
done
```

### 2. Validate Locale JSON

```bash
cd apps/brikette/src/locales
python - <<'PY'
import json
from pathlib import Path

base = Path(".")
errors = []
for path in base.rglob("*.json"):
  try:
    json.loads(path.read_text(encoding="utf-8"))
  except Exception as e:
    errors.append((str(path), str(e)))

print("parse_errors", len(errors))
for path, err in errors:
  print("-", path, "->", err)
PY
```

### 3. Find Guide File Parity Issues

```bash
cd apps/brikette/src/locales
# Files in non-EN but not EN
for lang in de es fr; do
  ls "$lang/guides/content/"*.json | xargs -n1 basename | while read f; do
    [ ! -f "en/guides/content/$f" ] && echo "$lang has extra: $f"
  done
done
```

---

## Action Items

### P0 - High Priority (Runtime Visible)

1. ✅ **Fix invalid locale JSON files**
   - Files: `*/experiencesPage.json` for de, hi, ko, pl, zh
   - Scope: JSON string quoting/punctuation only (no meaning change)
   - Impact: those languages risk broken bundles or full English fallback for the experiences page

2. ✅ **Add missing keys to `howToGetHere.json` in all non-EN locales**
   - Scope: 14 keys × 17 languages
   - Impact: lightbox/a11y labels and destination facts show in English

3. ❌ **~~Add missing skip-link keys to `translation.json` in all non-EN locales~~**
   - These keys (`accessibility.skipToMain`, `accessibility.skipToNav`) do not exist in EN either — the `accessibility` object is empty `{}` in all locales. This item was based on an incorrect audit finding. If skip-link translations are needed, they must be added to EN first.

### P1 - Medium Priority (Quality)

4. ✅ **Normalize `dealsPage.json` `perksList` schema**
   - Option A: update non-EN locales to `{ title, subtitle }` objects (recommended)
   - Option B: remove subtitles from EN and keep strings everywhere
   - Impact: subtitles are missing for most locales today

5. ✅ **Fix Polish interpolation syntax**
   - Files: `apps/brikette/src/locales/pl/roomsPage.json`, `apps/brikette/src/locales/pl/assistanceSection.json`
   - Pattern: `__placeholder_0__` → `{{room}}` / `{{tag}}`

### P2 - Low Priority (Cleanup / Consistency)

6. ✅ **Resolve `positanoMainBeach.json` parity**
   - Added EN content and wired a new guide route + manifest entry.

7. ✅ **~~Remove or consolidate legacy route JSON files~~**
   - Resolved. Legacy root-level route files no longer exist. All route content is now under `{lang}/how-to-get-here/routes/` with full parity across locales.

---

## File Structure Reference

```
src/locales/
├── {lang}/                      # One per supported language
│   ├── *.json                   # Core namespace files (39 per locale)
│   ├── guides/
│   │   ├── content/             # Guide content (168 files per locale)
│   │   │   └── {guideKey}.json
│   │   ├── labels.json          # Shared guide labels
│   │   ├── fallbacks.json       # Guide-specific fallbacks
│   │   └── tags.json            # Guide tag translations
│   └── how-to-get-here/
│       └── routes/              # Route content (24 files)
│           └── {routeKey}.json
├── guides.stub/                 # Development stubs (not production)
├── _guides/                     # Guide loader utilities
├── _how-to-get-here/            # Route loader utilities
└── *.ts                         # Locale management code
```

---

**Document Version:** 3.0
**Last Updated:** 2026-02-09
**Next Review:** Periodic (all P0/P1 items resolved)

---

### Changelog

- **2026-02-09 (v3.0):** Fact-check at `b559badf70`. Fixed root file counts (51/75→39 uniform), removed legacy route file duplication section (resolved — all locales symmetric), corrected skip-link key claim (keys never existed in EN), updated guide parity (all locales now have 168 identical guide content files), updated overall assessment.
- **2026-01-14 (v2.0):** Key-level parity fixes, JSON validity corrections, schema normalization.
