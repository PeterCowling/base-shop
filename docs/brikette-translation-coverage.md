# Brikette Translation Coverage Audit

Type: Research
Status: Active
Domain: Brikette i18n
Last-reviewed: 2026-01-14
Relates-to plan: docs/plans/brikette-translation-coverage-plan.md

---

## Executive Summary

Brikette has strong **file-level** translation coverage across 18 supported languages (core UI JSON, guides, and route content exist for every locale), but a key-level pass found a few concrete gaps that currently rely on i18next’s English fallback (`fallbackLng: "en"`), plus several invalid locale JSON files.

**Overall Assessment:** Good, with fixable gaps (B+)

**Remaining Open Item:** Legacy root route JSON duplication (BRIK-I18N-COV-07) — deferred (no action for now).

### Key Issues Found

| Issue | Severity | Scope |
|-------|----------|-------|
| Invalid JSON locale files (`experiencesPage.json`) | Resolved | de, hi, ko, pl, zh |
| Missing keys in `howToGetHere.json` | Resolved | All 17 non-EN languages |
| Missing keys in `translation.json` (skip links) | Resolved | All 17 non-EN languages |
| Schema drift in `dealsPage.json` (`perksList` items) | Resolved | All 17 non-EN languages |
| 24 legacy route JSON files in some locales | Low | Cleanup |
| Polish interpolation placeholders (`__placeholder_0__`) | Resolved | pl only |

---

## Supported Languages

| Code | Language | Tier | Root Files | Status |
|------|----------|------|------------|--------|
| en | English | Primary | 51 | Baseline |
| de | German | Tier 1 | 75 | Has legacy route files |
| es | Spanish | Tier 1 | 75 | Has legacy route files |
| fr | French | Tier 1 | 75 | Has legacy route files |
| it | Italian | Tier 1 | 75 | Has legacy route files |
| ja | Japanese | Tier 1 | 75 | Has legacy route files |
| ko | Korean | Tier 1 | 75 | Has legacy route files |
| pt | Portuguese | Tier 1 | 75 | Has legacy route files |
| ru | Russian | Tier 1 | 75 | Has legacy route files |
| zh | Chinese | Tier 1 | 51 | Missing keys |
| ar | Arabic | Tier 2 | 51 | RTL, missing keys |
| hi | Hindi | Tier 2 | 51 | Missing keys |
| vi | Vietnamese | Tier 2 | 51 | Missing keys |
| pl | Polish | Tier 2 | 75 | Has legacy route files |
| sv | Swedish | Tier 2 | 75 | Has legacy route files |
| no | Norwegian | Tier 2 | 51 | Key gaps |
| da | Danish | Tier 2 | 51 | Key gaps |
| hu | Hungarian | Tier 2 | 51 | Key gaps |

**Note:** Languages with 75 root files have 24 extra legacy route JSON files (e.g., `positanoAmalfiBus.json`) that don't exist in EN. These should be consolidated or removed.

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

translation.json (previously missing in every non-EN locale; now present):
  - accessibility.skipToMain
  - accessibility.skipToNav

dealsPage.json (schema drift in every non-EN locale):
  - perksList is an array of `{ title, subtitle }` objects in EN
  - perksList is now an array of `{ title, subtitle? }` objects in all locales (subtitles remain EN-only for now)
```

---

## Guide Content Issues

### File Parity

| Issue | Details |
|-------|---------|
| Resolved | Added `apps/brikette/src/locales/en/guides/content/positanoMainBeach.json` and wired a dedicated route + manifest entry so `positanoMainBeach` is reachable. |
| Note | EN includes some guide content files not present in other locales (likely untranslated/pending). |

---

## Legacy Route File Duplication

Some languages have 24 extra root-level JSON files for route translations:

```
Extra files in de/es/fr/it/ja/ko/pt/ru/pl/sv (not in en):
  - capriPositanoFerry.json
  - howToGetHereAmalfiPositanoBus.json
  - howToGetHereAmalfiPositanoFerry.json
  - howToGetHereNaplesAirportPositanoBus.json
  - howToGetHereNaplesCenterPositanoFerry.json
  - howToGetHerePositanoNaplesAirportBus.json
  - howToGetHerePositanoNaplesFerry.json
  - howToGetHerePositanoRavelloFerryBus.json
  - howToGetHerePositanoSalernoFerry.json
  - howToGetHereRavelloPositanoBus.json
  - howToGetHereSalernoPositanoFerry.json
  - naplesCenterTrainBus.json
  - positanoAmalfiBus.json
  - positanoAmalfiFerry.json
  - positanoCapriFerry.json
  - positanoNaplesCenterBusTrain.json
  - positanoNaplesCenterFerry.json
  - positanoRavelloBus.json
  - positanoSalernoBus.json
  - positanoSorrentoBus.json
  - positanoSorrentoFerry.json
  - salernoPositanoBus.json
  - sorrentoPositanoBus.json
  - sorrentoPositanoFerry.json
```

These appear to be legacy files that should either be:
1. Consolidated into `how-to-get-here/routes/`
2. Removed if no longer used

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

3. ✅ **Add missing skip-link keys to `translation.json` in all non-EN locales**
   - Scope: 2 keys × 17 languages
   - Impact: accessibility strings show in English

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

7. **Remove or consolidate legacy route JSON files**
   - 24 files in 10 locales (de, es, fr, it, ja, ko, pt, ru, pl, sv)
   - Decision needed: Are these still used or superseded by `how-to-get-here/routes/`?

---

## File Structure Reference

```
src/locales/
├── {lang}/                      # One per supported language
│   ├── *.json                   # Core namespace files (51 in EN, 51-75 in others)
│   ├── guides/
│   │   ├── content/             # Guide content (counts vary by locale)
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

**Document Version:** 2.0
**Last Updated:** 2026-01-14
**Next Review:** After P0 items are addressed
