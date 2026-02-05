---
Type: Plan
Last-reviewed: 2026-02-05
Status: Historical
Domain: i18n
Relates-to charter: none
Created: 2026-01-26
Last-updated: 2026-01-26
Completed: 2026-01-26
Overall-confidence: 85%
---

# Translation Gap Resolution Plan


## Active tasks

No active tasks at this time.

## Summary

Translate 2,074 missing strings (122 unique strings × 17 locales) with actual localized content. Work is batched by locale tier to enable true incremental delivery and early validation.

---

## Locale Canon

These are the exact locale directory names in `apps/brikette/src/locales/`:

| Code | Language | BCP 47 Notes |
|------|----------|--------------|
| `en` | English | Baseline |
| `es` | Spanish | Generic (serves es-ES, es-MX, es-AR) |
| `de` | German | Generic |
| `fr` | French | Generic |
| `it` | Italian | |
| `ja` | Japanese | |
| `ko` | Korean | |
| `pt` | Portuguese | Generic (serves pt-PT, pt-BR) |
| `ru` | Russian | |
| `zh` | Chinese | Simplified (zh-Hans equivalent) |
| `ar` | Arabic | RTL layout |
| `hi` | Hindi | |
| `vi` | Vietnamese | |
| `pl` | Polish | |
| `sv` | Swedish | |
| `no` | Norwegian | Bokmål (nb equivalent) |
| `da` | Danish | |
| `hu` | Hungarian | |

---

## Revised Scope (String-Level)

| Category | Files | Unique Strings | × Locales | Total Translations |
|----------|-------|----------------|-----------|-------------------|
| UI/Page strings | 4 | 64 | 17 | 1,088 |
| Guide content | 9 | 58 | 17 | 986 |
| **Total** | **13** | **122** | **17** | **2,074** |

### UI String Breakdown (64 strings)

| File | Key | Strings | Notes |
|------|-----|---------|-------|
| `dealsPage.json` | `dealCard.badges` | 2 | Short labels |
| | `dealCard.cta` | 2 | Button text |
| | `dealCard.status` | 2 | Status labels with `{{tokens}}` |
| | `dealCard.stayDatesLabel` | 1 | |
| | `emptyState` | 3 | Title + subtitle + CTA |
| | `hero` | 4 | Labels with `{{tokens}}` |
| `experiencesPage.json` | `guideCollections.directionLinks` | 19 | **Nested routes - see de-risking** |
| | `guideCollections.directionsLabel` | 1 | |
| `howToGetHere.json` | `lightbox` | 3 | Aria labels |
| | `rome.image` | 3 | Alt + caption |
| | `sorrento.image` | 3 | Alt + caption |
| `roomsPage.json` | `detailsLine` | 11 | Bed types, view descriptions |
| | `facts` | 8 | Room type labels |
| | `priceUnits` | 2 | "room" / "bed" |

### Guide String Breakdown (58 strings)

| File | Strings | Notes |
|------|---------|-------|
| `arienzoBeachClub.json` | 5 | Gallery heading + alt/captions |
| `fiordoDiFuroreBeachGuide.json` | 4 | Figure + costs |
| `fornilloBeachGuide.json` | 6 | Essentials + costs |
| `gavitellaBeachGuide.json` | 14 | Essentials + images + costs |
| `hostelBriketteToFiordoDiFuroreBus.json` | 6 | Essentials + costs |
| `hostelBriketteToFornilloBeach.json` | 7 | Gallery items |
| `lauritoBeachGuide.json` | 8 | Images array |
| `marinaDiPraiaBeaches.json` | 5 | Gallery items |
| `positanoMainBeach.json` | 3 | **SEO title + desc + linkLabel** |

---

## Batching Strategy: By Locale Tier

True incremental delivery - complete one tier before starting the next.

| Tier | Locales | Translations | Cumulative |
|------|---------|--------------|------------|
| 1 | es, de, fr, it | 122 × 4 = 488 | 488 |
| 2 | ja, ko, zh, pt | 122 × 4 = 488 | 976 |
| 3 | ru, ar, hi | 122 × 3 = 366 | 1,342 |
| 4 | vi, pl, sv, no, da, hu | 122 × 6 = 732 | 2,074 |

**Acceptance per tier:** Coverage check passes for that locale set; PR can merge after each tier.

---

## De-Risking: directionLinks Structure

The `guideCollections.directionLinks` object has nested route-specific labels.

**Translatable fields (labels only):**
```json
{
  "capriDayTrip": {
    "positanoCapriFerry": "Positano → Capri ferry",  // ✓ Translate
    "capriPositanoFerry": "Capri → Positano ferry"   // ✓ Translate
  }
}
```

**Non-translatable (preserve exactly):**
- Object keys (`capriDayTrip`, `positanoCapriFerry`)
- Any `href`, `slug`, or `id` fields if present

**Rule:** Only translate the string values. Never modify keys.

---

## Token Preservation Requirements

Patterns that MUST be preserved exactly in translations:

| Pattern | Example | Usage |
|---------|---------|-------|
| Interpolation | `{{percent}}`, `{{startDate}}` | Dynamic values |
| Link tokens | `%LINK:guideKey\|label%` | Internal links |
| Arrow symbols | `→` | Route indicators |
| Proper nouns | Positano, Capri, Amalfi | Place names (usually keep) |

**Validation approach:** After translation, verify same token count and pattern in source vs target.

---

## Tasks (Tier-Based)

### TASK-01: Translate Tier 1 locales (es, de, fr, it)
- **Strings:** 122 × 4 = 488 translations
- **Confidence:** 88%
- **Risk:** Highest visibility languages; errors most impactful
- **Mitigation:** Start with es (most familiar), validate pattern before de/fr/it
- **Acceptance:**
  - All 4 locale files updated for all 13 source files
  - `check-i18n-coverage.ts` passes for es, de, fr, it
  - Tokens preserved correctly

### TASK-02: Translate Tier 2 locales (ja, ko, zh, pt)
- **Strings:** 122 × 4 = 488 translations
- **Confidence:** 82%
- **Risk:** CJK languages have different grammar; pt ambiguity (BR vs PT)
- **Mitigation:** Use neutral Portuguese; verify CJK doesn't break JSON
- **Acceptance:** Coverage passes for ja, ko, zh, pt

### TASK-03: Translate Tier 3 locales (ru, ar, hi)
- **Strings:** 122 × 3 = 366 translations
- **Confidence:** 80%
- **Risk:** RTL (Arabic) may surface layout issues; Cyrillic/Devanagari encoding
- **Mitigation:** Verify UTF-8 encoding; note ar for RTL smoke test
- **Acceptance:** Coverage passes for ru, ar, hi

### TASK-04: Translate Tier 4 locales (vi, pl, sv, no, da, hu)
- **Strings:** 122 × 6 = 732 translations
- **Confidence:** 85%
- **Risk:** Lower priority; less familiar languages
- **Mitigation:** Follow established patterns from Tier 1
- **Acceptance:** Coverage passes for all locales; 0 missing keys total

### TASK-05: Final verification and cleanup
- **Confidence:** 95%
- **Checks:**
  - `check-i18n-coverage.ts` reports 0 missing keys
  - JSON validity (all files parse)
  - Token parity spot-check (sample 10 strings per locale)
  - Build passes
- **Acceptance:** All checks green

---

## Glossary (Key Terms)

Maintain consistency across locales for high-frequency terms:

| English | es | de | fr | it |
|---------|----|----|----|----|
| Deal | Oferta | Angebot | Offre | Offerta |
| Book / Reserve | Reservar | Buchen | Réserver | Prenotare |
| Stay | Estancia | Aufenthalt | Séjour | Soggiorno |
| Room | Habitación | Zimmer | Chambre | Camera |
| Bed (single) | Cama | Bett | Lit | Letto |
| Bunk bed | Litera | Etagenbett | Lit superposé | Letto a castello |
| Dorm | Dormitorio | Schlafsaal | Dortoir | Dormitorio |
| Ferry | Ferry/Ferri | Fähre | Ferry | Traghetto |
| per night | por noche | pro Nacht | par nuit | a notte |

**Proper nouns (keep in all locales):** Positano, Amalfi, Capri, Sorrento, Naples, Rome, Hostel Brikette

---

## SEO Priority Within Guides

The `positanoMainBeach.json` SEO fields are externally visible (SERPs, social). Treat as high priority even though in "Guide Content" category.

**Promote to early in each tier:**
- `seo.title`
- `seo.description`
- `linkLabel`

---

## Execution Approach

For each tier:
1. Read English source files for missing keys
2. Read target locale files to preserve existing content
3. Translate strings maintaining:
   - Token patterns exactly
   - Key structure (nested objects, arrays)
   - Glossary consistency
4. Write updated locale files (append only, preserve formatting)
5. Run `check-i18n-coverage.ts` for that tier
6. Commit with message: `i18n: complete Tier X translations (es, de, fr, it)`

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Token loss in translation | High | Medium | Verify token parity after each file |
| JSON syntax errors | High | Low | Validate JSON after each write |
| directionLinks key modification | High | Medium | Only translate string values, never keys |
| Inconsistent terminology | Medium | Medium | Use glossary; review Tier 1 before proceeding |
| RTL layout issues (ar) | Medium | Medium | Flag for visual smoke test |
| CJK encoding issues | Medium | Low | Verify UTF-8; test JSON parse |
| Overwriting existing translations | High | Low | Append-only merge; diff review |

---

## Acceptance Criteria (Overall)

- [x] All 2,074 translations completed with actual localized text
- [x] No placeholder phrases in any locale
- [x] All interpolation tokens preserved correctly
- [x] `check-i18n-coverage.ts` reports 0 missing keys
- [x] Existing translations unchanged
- [x] JSON validity verified for all files
- [ ] Build passes (deferred to CI)

---

## Estimated Work by Tier

| Tier | Locales | Translations | Priority |
|------|---------|--------------|----------|
| 1 | es, de, fr, it | 488 | Highest |
| 2 | ja, ko, zh, pt | 488 | High |
| 3 | ru, ar, hi | 366 | Medium |
| 4 | vi, pl, sv, no, da, hu | 732 | Lower |
| **Total** | **17** | **2,074** | |

Recommend completing Tier 1 first, validating the approach, then proceeding through remaining tiers.
