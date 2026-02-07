#!/usr/bin/env bash
# validate-guide-structure.sh — Validate locale guide files against EN structure.
#
# Usage:
#   bash scripts/validate-guide-structure.sh <guideKey>          # Phase 1 (structural)
#   bash scripts/validate-guide-structure.sh --phase2 <guideKey> # Phase 1 + Phase 2 (translation)
#
# Exits 0 if all locales pass, 1 if any fail.
# Must be run from apps/brikette/ directory.

set -euo pipefail

LOCALES=(ar da de es fr hi hu it ja ko no pl pt ru sv vi zh)
PHASE2=false
GUIDE_KEY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase2) PHASE2=true; shift ;;
    --help|-h)
      echo "Usage: bash scripts/validate-guide-structure.sh [--phase2] <guideKey>"
      echo ""
      echo "Phase 1 (default): structural checks (JSON, section count/IDs, required keys)"
      echo "Phase 2 (--phase2): adds translation checks (body lengths, tokens, empty strings)"
      exit 0
      ;;
    *) GUIDE_KEY="$1"; shift ;;
  esac
done

if [[ -z "$GUIDE_KEY" ]]; then
  echo "ERROR: guideKey argument required"
  echo "Usage: bash scripts/validate-guide-structure.sh [--phase2] <guideKey>"
  exit 1
fi

EN_FILE="src/locales/en/guides/content/${GUIDE_KEY}.json"

if [[ ! -f "$EN_FILE" ]]; then
  echo "ERROR: EN file not found: $EN_FILE"
  exit 1
fi

FAILURES=0
PASSES=0

# Extract EN reference data once
EN_DATA=$(node -e "
  const c = JSON.parse(require('fs').readFileSync('$EN_FILE', 'utf8'));
  const out = {
    sectionCount: (c.sections || []).length,
    sectionIds: (c.sections || []).map(s => s.id),
    sectionBodyLengths: (c.sections || []).map(s => (s.body || []).length),
    hasSeO: 'seo' in c,
    hasLinkLabel: 'linkLabel' in c,
    hasIntro: 'intro' in c,
    hasSections: 'sections' in c,
    faqsLength: (c.faqs || []).length,
    tipsLength: (c.tips || []).length,
    hasFaqs: 'faqs' in c,
    hasTips: 'tips' in c,
  };
  console.log(JSON.stringify(out));
")

EN_SECTION_COUNT=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.sectionCount);")
EN_SECTION_IDS=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.sectionIds.join(','));")
EN_FAQS_LENGTH=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.faqsLength);")
EN_TIPS_LENGTH=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.tipsLength);")
EN_HAS_FAQS=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.hasFaqs);")
EN_HAS_TIPS=$(echo "$EN_DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.hasTips);")

echo "=== Validating $GUIDE_KEY ==="
echo "EN reference: $EN_SECTION_COUNT sections, IDs: $EN_SECTION_IDS"
if [[ "$PHASE2" == "true" ]]; then
  echo "Mode: Phase 1 (structural) + Phase 2 (translation)"
else
  echo "Mode: Phase 1 (structural) only"
fi
echo ""

for locale in "${LOCALES[@]}"; do
  LOCALE_FILE="src/locales/$locale/guides/content/${GUIDE_KEY}.json"
  LOCALE_ERRORS=()

  # Check file exists
  if [[ ! -f "$LOCALE_FILE" ]]; then
    echo "FAIL $locale: file not found: $LOCALE_FILE"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  # Phase 1: Structural checks
  VALIDATION=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$LOCALE_FILE', 'utf8'));
      const enIds = '$EN_SECTION_IDS'.split(',');
      const errors = [];

      // Required top-level keys
      if (!('seo' in c)) errors.push('missing key: seo');
      if (!('linkLabel' in c)) errors.push('missing key: linkLabel');
      if (!('intro' in c)) errors.push('missing key: intro');
      if (!('sections' in c)) errors.push('missing key: sections');

      // Section count
      const secCount = (c.sections || []).length;
      if (secCount !== $EN_SECTION_COUNT) {
        errors.push('section count: ' + secCount + ' (expected $EN_SECTION_COUNT)');
      }

      // Section IDs (same order)
      const localeIds = (c.sections || []).map(s => s.id);
      if (localeIds.join(',') !== enIds.join(',')) {
        errors.push('section IDs mismatch: [' + localeIds.join(',') + '] vs EN [' + enIds.join(',') + ']');
      }

      // FAQs length (if EN has faqs)
      if ($EN_HAS_FAQS === true) {
        const faqLen = (c.faqs || []).length;
        if (faqLen !== $EN_FAQS_LENGTH) {
          errors.push('faqs length: ' + faqLen + ' (expected $EN_FAQS_LENGTH)');
        }
      }

      // Tips length (if EN has tips)
      if ($EN_HAS_TIPS === true) {
        const tipLen = (c.tips || []).length;
        if (tipLen !== $EN_TIPS_LENGTH) {
          errors.push('tips length: ' + tipLen + ' (expected $EN_TIPS_LENGTH)');
        }
      }

      console.log(JSON.stringify({ ok: errors.length === 0, errors, data: c }));
    } catch (e) {
      console.log(JSON.stringify({ ok: false, errors: ['JSON parse error: ' + e.message], data: null }));
    }
  " 2>&1)

  PHASE1_OK=$(echo "$VALIDATION" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.ok);")
  PHASE1_ERRORS=$(echo "$VALIDATION" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); if(d.errors.length) console.log(d.errors.join('; '));")

  if [[ "$PHASE1_OK" != "true" ]]; then
    echo "FAIL $locale (Phase 1): $PHASE1_ERRORS"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  # Phase 2: Translation checks (only if --phase2 flag)
  if [[ "$PHASE2" == "true" ]]; then
    PHASE2_VALIDATION=$(node -e "
      const en = JSON.parse(require('fs').readFileSync('$EN_FILE', 'utf8'));
      const lc = JSON.parse(require('fs').readFileSync('$LOCALE_FILE', 'utf8'));
      const errors = [];

      // Body array length parity per section
      for (let i = 0; i < (en.sections || []).length; i++) {
        const enBody = (en.sections[i].body || []).length;
        const lcBody = (lc.sections[i].body || []).length;
        if (enBody !== lcBody) {
          errors.push('section ' + en.sections[i].id + ' body length: ' + lcBody + ' (expected ' + enBody + ')');
        }
      }

      // Token preservation — compare targets only (anchors are translated)
      // %LINK:target|anchor% → extract 'LINK:target'
      // %HOWTO:slug|anchor%  → extract 'HOWTO:slug'
      // %IMAGE:path%         → extract 'IMAGE:path'
      // %URL:path%           → extract 'URL:path'
      const tokenPattern = /%(?:LINK|HOWTO|URL|IMAGE):[^%|]+/g;
      const enStr = JSON.stringify(en);
      const lcStr = JSON.stringify(lc);
      const enTargets = (enStr.match(tokenPattern) || []).sort();
      const lcTargets = (lcStr.match(tokenPattern) || []).sort();
      if (enTargets.join('|') !== lcTargets.join('|')) {
        const missing = enTargets.filter(t => !lcTargets.includes(t));
        const extra = lcTargets.filter(t => !enTargets.includes(t));
        if (missing.length) errors.push('missing token targets: ' + missing.join(', '));
        if (extra.length) errors.push('extra token targets: ' + extra.join(', '));
      }

      // No empty strings in translated fields (only flag if EN is non-empty)
      if (en.seo && en.seo.title && en.seo.title.trim() !== '') {
        if (!lc.seo || !lc.seo.title || lc.seo.title.trim() === '') errors.push('empty seo.title');
      }
      if (en.seo && en.seo.description && en.seo.description.trim() !== '') {
        if (!lc.seo || !lc.seo.description || lc.seo.description.trim() === '') errors.push('empty seo.description');
      }
      if (en.linkLabel && en.linkLabel.trim() !== '') {
        if (!lc.linkLabel || lc.linkLabel.trim() === '') errors.push('empty linkLabel');
      }
      for (let i = 0; i < (lc.sections || []).length; i++) {
        const s = lc.sections[i];
        const enS = (en.sections || [])[i];
        if (enS && enS.title && enS.title.trim() !== '') {
          if (!s.title || s.title.trim() === '') errors.push('empty title in section ' + s.id);
        }
        for (let j = 0; j < (s.body || []).length; j++) {
          const enBody = enS && enS.body && enS.body[j];
          // Only flag empty locale body if EN body is non-empty
          if (typeof enBody === 'string' && enBody.trim() !== '') {
            if (typeof s.body[j] === 'string' && s.body[j].trim() === '') {
              errors.push('empty body[' + j + '] in section ' + s.id);
            }
          }
        }
      }

      if (errors.length) {
        console.log('FAIL:' + errors.join('; '));
      } else {
        console.log('OK');
      }
    " 2>&1)

    if [[ "$PHASE2_VALIDATION" != "OK" ]]; then
      PHASE2_ERRORS="${PHASE2_VALIDATION#FAIL:}"
      echo "FAIL $locale (Phase 2): $PHASE2_ERRORS"
      FAILURES=$((FAILURES + 1))
      continue
    fi
  fi

  echo "PASS $locale"
  PASSES=$((PASSES + 1))
done

echo ""
echo "=== Summary ==="
echo "Passed: $PASSES / $((PASSES + FAILURES))"
echo "Failed: $FAILURES / $((PASSES + FAILURES))"

if [[ $FAILURES -gt 0 ]]; then
  exit 1
else
  echo "All locales validated successfully."
  exit 0
fi
