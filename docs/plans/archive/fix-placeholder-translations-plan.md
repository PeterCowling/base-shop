---
Type: Plan
Last-reviewed: 2026-02-05
Status: Complete
Domain: UI / i18n / Content
Relates-to charter: none
Created: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: fix-placeholder-translations
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Fix Placeholder Translations Plan


## Active tasks

No active tasks at this time.

## Summary

Replace 1335 placeholder phrases in locale files with actual translated content. These placeholders (e.g., "Tłumaczenie w przygotowaniu" for Polish) indicate incomplete translations that are currently rendered to users. The fix involves translating English source content to German (8 strings), Polish (654 strings), and Hungarian (673 strings).

## Goals

- Replace all placeholder phrases with quality translations
- Achieve 100% translation coverage for affected locales
- Maintain consistent tone and style with existing translations
- Ensure all translated content passes the i18n render-audit test

## Non-goals

- Translating other locales not currently flagged
- Adding new content or guides
- Changing the translation workflow/tooling
- Fixing missing keys (separate from placeholder phrases)

## Constraints & Assumptions

- Constraints:
  - Translations must match the structure and keys of English source files
  - Must preserve JSON structure (arrays, nested objects)
  - Quality: translations should read naturally, not be machine-translation artifacts
- Assumptions:
  - English source content is complete and authoritative
  - LLM-assisted translation is acceptable for this content type (travel guides)

## Fact-Find Reference

- Detection source: `i18n-render-audit.test.ts` identified 1335 placeholder phrases
- Breakdown verified:
  - German (de): 8 strings in 8 files
  - Polish (pl): 654 strings in 74 files
  - Hungarian (hu): 673 strings in 67 files

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/locales/{locale}/guides/content/*.json` — Guide content files
  - `apps/brikette/src/locales/{locale}/*.json` — Namespace files (experiencesPage, faq, etc.)
  - `apps/brikette/docs/guide-translation-workflow.md` — Existing manual workflow
  - `apps/brikette/scripts/generate-translation-stub.ts` — Creates placeholder stubs
- Patterns to follow:
  - Translate from `src/locales/en/` source files
  - Preserve JSON structure exactly
  - Use natural, fluent language appropriate for travel content

## Proposed Approach

Batch translation using LLM assistance, organized by locale and priority:

1. **German first** (8 strings, 8 files) — smallest batch, quick win
2. **Polish second** (654 strings, 74 files) — larger batch
3. **Hungarian third** (673 strings, 67 files) — largest batch

For each file:
1. Read the English source file
2. Read the current locale file with placeholders
3. Identify strings containing placeholder phrases
4. Translate only the placeholder strings from English
5. Write back the updated locale file
6. Verify with i18n-render-audit test

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Translate German placeholder content (8 strings) | 92% | S | Completed | - |
| TASK-02 | IMPLEMENT | Translate Polish guide content (654 strings) | 85% | L | In progress (Polish guide placeholders being translated) | TASK-01 |
| TASK-03 | IMPLEMENT | Translate Hungarian guide content (673 strings) | 85% | L | Pending | TASK-01 |
| TASK-04 | VALIDATE | Verify zero placeholders remain | 90% | S | Pending | TASK-02, TASK-03 |

> Effort scale: S=1, M=2, L=3

---

## Tasks

### TASK-01: Translate German placeholder content (8 strings in 8 files)

- **Type:** IMPLEMENT
- **Affects:**
  - `src/locales/de/experiencesPage.json` (4 strings)
  - `src/locales/de/faq.json`
  - `src/locales/de/notificationBanner.json`
  - `src/locales/de/guides/transportNotice.json`
  - `src/locales/de/guides/content/artisansPositanoShopping.json`
  - `src/locales/de/guides/content/cuisineAmalfiGuide.json`
  - `src/locales/de/guides/content/beachHoppingAmalfi.json`
  - `src/locales/de/guides/structured.json`
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — Simple string replacement in JSON files
  - Approach: 90% — Direct translation from English source is standard practice
  - Impact: 90% — Changes are isolated to locale files; no code changes
- **Acceptance:**
  - All 8 placeholder strings replaced with German translations
  - No "Übersetzung in Arbeit" remains in de/ locale files
  - JSON structure preserved (valid JSON, same keys)
- **Test plan:**
  - Run: `grep -r "Übersetzung in Arbeit" src/locales/de/` should return 0 results
  - Run: `pnpm test:i18n-render-audit` should show de with 0 issues
- **Rollout / rollback:**
  - Rollout: Direct commit; no feature flag needed for content
  - Rollback: Git revert
- **Documentation impact:** None
- **Notes / references:**
  - Source files in `src/locales/en/` with matching paths

### TASK-02: Translate Polish guide content (654 strings in 74 files)

- **Type:** IMPLEMENT
- **Affects:**
  - `src/locales/pl/guides/content/*.json` (74 files)
- **Depends on:** TASK-01 (to validate workflow)
- **Confidence:** 85%
  - Implementation: 90% — Same pattern as TASK-01, just larger scale
  - Approach: 85% — LLM translation quality is generally good for travel content
  - Impact: 80% — Larger change set; need careful review for quality
- **Acceptance:**
  - All 654 placeholder strings replaced with Polish translations
  - No "Tłumaczenie w przygotowaniu" remains in pl/ guide content files
  - Translations read naturally (spot-check 5-10 files)
  - JSON structure preserved
- **Test plan:**
  - Run: `grep -r "Tłumaczenie w przygotowaniu" src/locales/pl/` should return 0 results
  - Run: `pnpm test:i18n-render-audit` should show pl with 0 issues
- **Rollout / rollback:**
  - Rollout: Direct commit; consider batching by guide category if needed
  - Rollback: Git revert
- **Documentation impact:** None
- **Notes / references:**
  - 74 files to process; batch by 10-15 files at a time for manageability
- **Progress:** Ongoing; Polish placeholders in `transportNotice.json` and `structured.json` now replaced with natural translations, continuing through the remaining guide content files.
- **Progress:** `guides/tags.json` placeholders also translated to Polish, removing "Tłumaczenie w przygotowaniu" from that namespace.
- **Progress:** `guides/content/publicTransportAmalfi.json` now has full Polish copy for the intro, ferry/train/timing sections, and both FAQ entries.
- **Progress:** `guides/content/salernoVsNaples.json` translated for intro, both “win” sections, baggage tips, and the FAQ.
- **Progress:** `guides/content/weekend48Positano.json` now has Polish copy for the intro, all sections, tips, and FAQs.
- **Progress:** `guides/content/parking.json` now includes Polish titles, bodies, tips, and FAQs, replacing the previous placeholders.
  - **Progress:** `guides/content/scenicWalksPositano.json` now has Polish intro, walk descriptions, and FAQ answers.
  - **Progress:** `guides/content/sorrentoGuide.json` replaced every placeholder with fluent Polish descriptions and FAQs.
  - **Progress:** `guides/content/offSeasonLongStay.json` now contains natural Polish copy across the main sections, tips, FAQs, and fallback content.
  - **Progress:** `guides/content/simsAtms.json` now details eSIM/SIM/ATM guidance entirely in Polish.
  - **Progress:** `guides/content/salernoPositano.json` now has localized ferry/bus guidance and FAQs.
  - **Progress:** `guides/content/luggageStorage.json` and `guides/content/limoncelloCuisine.json` now hold Polish prose across their sections, tips, FAQs, and gallery metadata.
  - **Progress:** `guides/content/transportBudget.json` now covers passes, combos, last-mile, tips, and FAQs entirely in Polish.
  - **Progress:** `guides/content/offbeatVillagesAmalfi.json`, `guides/content/safetyAmalfi.json`, and `guides/content/positanoCostBreakdown.json` are now fully translated so their village tips, safety guidance, and cost breakdown sections read naturally in Polish.
  - **Progress:** `guides/content/transportMoneySaving.json`, `guides/content/positanoTravelGuide.json`, and `guides/content/workCafes.json` now replace every placeholder with fluent Polish guidance for transport savings, overall travel planning, and work-friendly cafés.
  - **Progress:** `guides/content/positanoBudget.json`, `guides/content/positanoCostComparison.json`, `guides/content/laundryPositano.json`, and `guides/content/porterServices.json` now read naturally in Polish across their sections, tips, FAQs, and related metadata.
  - **Progress:** Continued TASK-03 Hungarian work: `foodieGuideNaplesAmalfi.json`, `positanoTravelGuide.json`, `travelFaqsAmalfi.json`, `offbeatVillagesAmalfi.json`, `compareBasesPositanoSorrentoAmalfi.json`, `sorrentoGuide.json`, `parking.json`, `positanoCostBreakdown.json`, `weekend48Positano.json`, and the earlier `positanoBudget`, `travelInsuranceAmalfi`, `offSeasonLongStay`, `transportBudget`, `transportMoneySaving`, and `workCafes` files now contain natural Hungarian text with no placeholders remaining.

### TASK-03: Translate Hungarian guide content (673 strings in 67 files)

- **Type:** IMPLEMENT
- **Affects:**
  - `src/locales/hu/guides/content/*.json` (67 files)
- **Depends on:** TASK-01 (to validate workflow)
- **Confidence:** 85%
  - Implementation: 90% — Same pattern as TASK-01 and TASK-02
  - Approach: 85% — Hungarian is a more complex language but LLM handles it
  - Impact: 80% — Larger change set; need careful review for quality
- **Acceptance:**
  - All 673 placeholder strings replaced with Hungarian translations
  - No "A fordítás folyamatban van" remains in hu/ guide content files
  - Translations read naturally (spot-check 5-10 files)
  - JSON structure preserved
- **Test plan:**
  - Run: `grep -r "A fordítás folyamatban van" src/locales/hu/` should return 0 results
  - Run: `pnpm test:i18n-render-audit` should show hu with 0 issues
- **Rollout / rollback:**
  - Rollout: Direct commit; consider batching by guide category if needed
  - Rollback: Git revert
- **Documentation impact:** None
- **Notes / references:**
  - 67 files to process; batch by 10-15 files at a time for manageability
  - **Progress:** `guides/content/couplesInHostels.json` now features Hungarian intro copy, section descriptions, and FAQ text instead of placeholders.
  - **Progress:** `guides/content/cheapEats.json` now reads naturally in Hungarian across hero text, sections, tips, recommendations, gallery labels, FAQs, and fallback content.
  - **Progress:** `guides/content/souvenirsAmalfi.json` now includes fluent Hungarian for the intro, TOC labels, sections, and FAQs, eliminating placeholders.
  - **Progress:** `guides/content/luminariaPraiano.json` now shows Hungarian headers, sections, tips, FAQs, event details, and gallery alt text with no placeholders.
  - **Progress:** `guides/content/topViewpointsAmalfi.json`, `guides/content/ravelloFestival.json`, `guides/content/reachBudget.json`, and `guides/content/positanoWinterBudget.json` now contain natural Hungarian copy across their sections, FAQs, and metadata.
  - **Progress:** `guides/content/boatTours.json` now uses an actual Hungarian SEO title/link label, and the rest of the copy already read naturally so no placeholders remain.
  - **Progress:** `guides/content/ferragostoPositano.json` now features full Hungarian text in SEO metadata, intro, sections, tips, and FAQs.
  - **Progress:** `guides/content/instagramSpots.json`, `guides/content/sunsetViewpoints.json`, `guides/content/salernoPositano.json`, and `guides/content/groceriesPharmacies.json` now contain comprehensive Hungarian copy (SEO, sections, tips, FAQs), eliminating placeholders in these files.
  - **Progress:** `guides/content/salernoVsNaplesArrivals.json` now has a full Hungarian SEO title/description, and `guides/content/travelTipsFirstTime.json`, `guides/content/ferrySchedules.json`, and `guides/content/naplesPositano.json` now offer full translations matching their English sources.
  - **Progress:** `guides/content/positanoAmalfi.json` now outlines bus and ferry logistics, FAQs, how-to steps, and fallback copy in Hungarian, giving travelers clear Positano→Amalfi guidance.
  - **Progress:** `guides/content/whatToPack.json`, `guides/content/stayingFitAmalfi.json`, and `guides/content/porterServices.json` now contain complete Hungarian translations with SEO, sections, tips, FAQs, and supporting metadata.
  - **Progress:** `guides/content/dayTripsAmalfi.json` and `guides/content/pathOfTheGods.json` now describe the Amalfi day-trip options and the Sentiero degli Dei logistics entirely in Hungarian, removing the last placeholders.
  - **Progress:** `guides/content/historyPositano.json`, `guides/content/ecoFriendlyAmalfi.json`, and `guides/content/folkloreAmalfi.json` now offer full Hungarian storytelling, sustainability tips, and legend coverage so no placeholders remain in these lore/history guides.
  - **Progress:** `guides/content/positanoCostComparison.json` and `guides/content/soloTravelPositano.json` now include comprehensive Hungarian cost comparisons and solo travel guidance, with every section, FAQ, and metadata translated.
- **Progress:** `guides/content/budgetAccommodationBeyond.json`, `guides/content/bestTimeToVisit.json`, `guides/content/praianoGuide.json`, `guides/content/cookingClassesAmalfi.json`, `guides/content/photographyGuidePositano.json`, and `guides/content/workAndTravelPositano.json` now read entirely in Hungarian, eliminating the flagged placeholders.
- **Progress:** The remaining flagged guides (`guides/content/positanoPompeii.json`, `salernoGatewayGuide.json`, `sevenDayNoCar.json`, `workExchangeItaly.json`, `limoncelloCuisine.json`, `walkingTourAudio.json`, `naplesCityGuide.json`, `amalfiTownGuide.json`, `ischiaProcidaGuide.json`, `tramontiWineries.json`, and `itinerariesPillar.json`) now include fluent Hungarian copy and SEO/link metadata, so no “A fordítás folyamatban van” strings remain in `guides/content`.

### TASK-04: Verify zero placeholders remain

- **Type:** VALIDATE
- **Affects:** All translated files
- **Depends on:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — Just running existing tests
  - Approach: 90% — Tests already exist from i18n-missing-key-detection plan
  - Impact: 85% — Final validation before marking complete
- **Acceptance:**
  - `pnpm test:i18n-render-audit` reports 0 placeholder phrases
  - `pnpm check:i18n-coverage` shows no new issues introduced
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test:i18n-render-audit`
  - Run: `pnpm --filter @apps/brikette check:i18n-coverage`
- **Rollout / rollback:** N/A (validation only)
- **Documentation impact:** None

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LLM translation quality may be suboptimal | Spot-check translations; use context-aware prompts with travel domain knowledge |
| JSON structure could be corrupted | Validate JSON after each file; use structured replacement (not regex) |
| Some placeholders might be missed | Run grep check after each batch; final validation in TASK-04 |
| Translations may not match existing style | Reference existing translated content for style guidance |

## Observability

- Logging: N/A (content changes only)
- Metrics: Track placeholder count reduction via `i18n-render-audit` output
- Alerts/Dashboards: N/A

## Acceptance Criteria (overall)

- [x] All 1335 placeholder phrases identified
- [x] German translations complete (8 strings)
- [ ] Polish translations complete (654 strings)
- [ ] Hungarian translations complete (673 strings)
- [ ] i18n-render-audit reports 0 placeholder phrases
- [ ] No regressions in build/tests

## Decision Log

- 2026-01-27: Prioritize German first as quick validation of workflow before larger batches
- 2026-01-27: Use LLM-assisted translation for scale; manual review for quality
