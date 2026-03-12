---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: caryina-i18n-hardcoded-english
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/caryina-i18n-hardcoded-english/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312143000-9558
Trigger-Why:
Trigger-Intended-Outcome:
---

# Caryina Chrome i18n — Hardcoded English Strings Fact-Find

## Scope

### Summary

All persistent UI chrome on the Caryina storefront (header nav, footer links, cookie consent banner, and shipping trust strip) displays in English regardless of the visitor's selected locale. The URL routing and product content are already correctly localised, but the surrounding chrome layer silently falls back to English for German and Italian visitors. The root cause is not hardcoding in the component layer — the components are correctly wired — but missing DE/IT translation values in the underlying chrome data source.

### Goals

- Identify the exact root cause of English-only chrome output for DE/IT locales
- Map which data source controls chrome translations and how the fix path should work
- Determine the correct approach for adding DE/IT translations durably
- Confirm test landscape for chrome localisation coverage

### Non-goals

- Translating product copy, policy body text, or SEO content (separate materializer scope)
- Adding new chrome components or changing chrome structure
- Internationalising admin routes

### Constraints & Assumptions

- Constraints:
  - The materializer (`materialize-site-content-payload.ts`) must not be broken — existing product content generation must continue working
  - Any fix must survive a future materializer re-run without silently wiping DE/IT translations
  - Translations must be accurate and natural (not machine-literal) for DE and IT locales
- Assumptions:
  - The chrome strings are UI micro-copy (Shop, Support, Terms, etc.) that belongs in code, not in a CMS or content packet
  - The LOCALES constant confirms `en`, `de`, `it` are the three supported locales

---

## Outcome Contract

**Why:** The site supports three languages in the URL, but the footer links (Terms, Privacy, Returns & Refunds), the header navigation (Shop, Support), the cookie consent banner, and the shipping trust strip are all hardcoded in English. A German or Italian visitor gets a mixed-language experience — translated product pages but English navigation. This undermines trust, especially for legal pages where language matters.

**Intended Outcome:**
- Type: operational
- Statement: All persistent UI chrome (header, footer, consent banner, trust strip) displays in the visitor's selected language
- Source: operator

---

## Access Declarations

| Source | Access Type | Status |
|---|---|---|
| `apps/caryina/src/lib/contentPacket.ts` | Read | Verified |
| `data/shops/caryina/site-content.generated.json` | Read | Verified |
| `scripts/src/startup-loop/website/materialize-site-content-payload.ts` | Read | Verified |
| `apps/caryina/src/app/[lang]/layout.tsx` | Read | Verified |
| `packages/i18n/src/locales.ts` | Read | Verified |

---

## Current Process Map

Chrome strings flow through the following path:

**Trigger:** A visitor loads a Caryina page at `/de/...` or `/it/...`

**Step-by-step current flow:**

1. `[lang]/layout.tsx` reads `lang` from URL params via `resolveLocale(rawLang)` → resolves to `"de"` or `"it"`
2. `layout.tsx` calls `getChromeContent(lang)` from `contentPacket.ts`
3. `getChromeContent(locale)`:
   - Calls `readPayload()` which reads `data/shops/caryina/site-content.generated.json`
   - Returns `payload.chrome ?? CHROME_EN_DEFAULTS`
   - Since the JSON has a `chrome` key, `CHROME_EN_DEFAULTS` is **never reached**
   - Iterates over each chrome string calling `localizedText(value, locale)`
   - `localizedText` returns `value[locale] ?? value.en` — since no `de`/`it` key exists in any value, always returns `value.en`
4. Layout passes chrome strings to `Header`, `SiteFooter`, `ConsentBanner`, `ShippingReturnsTrustBlock`
5. All chrome renders in English regardless of locale

**Owner/systems:** `contentPacket.ts` (runtime read path); `site-content.generated.json` (chrome data store); `materialize-site-content-payload.ts` (JSON generator — does NOT generate chrome)

**End condition (current):** DE/IT visitor sees English chrome

**Known issues visible in current state:**
- `site-content.generated.json` `chrome` section has only `{en: "..."}` per string — no `de` or `it` entries
- `CHROME_EN_DEFAULTS` also has only `{en: "..."}` per string — but is bypassed anyway since JSON chrome takes precedence
- The materializer's `SiteContentPayload` type has **no `chrome` key** — the JSON chrome was added outside the materializer. If the materializer is re-run, it will write a new JSON without chrome, wiping any manual DE/IT additions. This is a durability risk.

---

## Investigation Findings

### Root Cause (Confirmed)

The components are correctly locale-aware. The failure is entirely in the data layer:

| Layer | Finding |
|---|---|
| `SiteFooter.tsx` | Calls `getChromeContent(lang as "en" \| "de" \| "it")` — locale-aware ✓ |
| `Header.tsx` | Calls `getChromeContent(lang as "en" \| "de" \| "it")` — locale-aware ✓ |
| `ConsentBanner.client.tsx` | Accepts `strings: ConsentBannerStrings` prop from parent — no hardcoding ✓ |
| `ShippingReturnsTrustBlock.tsx` | Calls `getChromeContent(lang as "en" \| "de" \| "it")` — locale-aware ✓ |
| `layout.tsx` | Calls `getChromeContent(lang)` and passes `chrome.consent` to ConsentBanner ✓ |
| `getChromeContent()` | Reads `payload.chrome ?? CHROME_EN_DEFAULTS`; every string in both paths is `{en: "..."}` only — **this is the bug** |
| `site-content.generated.json` `.chrome` section | Present with 5 sub-sections, 27 strings total; all `{en: "..."}`, zero `de`/`it` entries |
| `CHROME_EN_DEFAULTS` in `contentPacket.ts` | Also all `{en: "..."}` only — and is bypassed when JSON chrome exists |
| `materialize-site-content-payload.ts` | `SiteContentPayload` type has no `chrome` key; `buildPayload()` never generates chrome |

### Key Modules

| File | Role |
|---|---|
| `apps/caryina/src/lib/contentPacket.ts` | Entry point for chrome reads; `CHROME_EN_DEFAULTS` is the fallback; `getChromeContent()` is the only caller interface |
| `data/shops/caryina/site-content.generated.json` | Active chrome data store — overrides `CHROME_EN_DEFAULTS` entirely |
| `scripts/src/startup-loop/website/materialize-site-content-payload.ts` | Generates the JSON but does NOT output chrome — durability risk |
| `packages/i18n/src/locales.ts` | Defines `LOCALES = ["en", "de", "it"]` — 3 supported locales confirmed |

### Chrome String Inventory

The `chrome` section has 27 strings across 5 groups:

| Group | Strings | Example |
|---|---|---|
| `header` | 3 | shop, support, navAriaLabel |
| `footer` | 7 | terms, privacy, returnsRefunds, shipping, support, copyright, sectionAriaLabel |
| `consent` | 5 | message, privacyLink, decline, accept, ariaLabel |
| `trust` | 3 | summary, shippingLink, returnsLink |
| `notifyMe` | 7 + 2 edge | consent, genericError, validation, emailLabel, submit, submitting, success |

Total translation work: ~27 strings × 2 locales = ~54 new values. Most are single words or short phrases.

### Approach Options

**Option A (Recommended): Enrich `CHROME_EN_DEFAULTS` + remove chrome from JSON**
- Add `de` and `it` keys to every entry in `CHROME_EN_DEFAULTS` in `contentPacket.ts`
- Remove the `chrome` key from `data/shops/caryina/site-content.generated.json` so `CHROME_EN_DEFAULTS` is always the active path
- Rename `CHROME_EN_DEFAULTS` → `CHROME_DEFAULTS` to reflect it now holds all locales
- Benefit: chrome translations are code-owned, survive materializer re-runs, no JSON maintenance risk
- Cost: translations must be authored in code (fine for micro-copy)

**Option B: Keep JSON chrome + add DE/IT to it + guard materializer**
- Add `de` and `it` entries directly to `data/shops/caryina/site-content.generated.json` chrome section
- Extend `materialize-site-content-payload.ts` `SiteContentPayload` type to include `chrome`, and have it preserve/merge existing chrome on regeneration
- More complex; materializer changes needed to avoid data loss on re-run

**Option C: Per-string merge fallback in `getChromeContent`**
- Change `getChromeContent` to merge JSON chrome (as locale overrides) over `CHROME_EN_DEFAULTS` (as base with all locales)
- Both sources contribute: `CHROME_EN_DEFAULTS` provides DE/IT, JSON chrome can override per-string
- Most flexible but adds a merge function; slightly more code

**Recommended:** Option A. Chrome strings are UI labels (not brand/product copy) — they belong in `contentPacket.ts` as code-owned constants, not in the generated data file. Removing `chrome` from the JSON eliminates the durability risk entirely.

### Test Landscape

| Area | Current State |
|---|---|
| `contentPacket.ts` unit tests | None found — no `contentPacket.test.ts` exists |
| `ConsentBanner.client.test.tsx` | Exists; tests component with string props (no locale logic tested) |
| `[lang]/page.test.tsx` | Mocks `getChromeContent` via `jest.mock("@/lib/contentPacket")` |
| i18n parity audit | `CONTENT_READINESS_MODE=fail pnpm --filter caryina test i18n-parity-quality-audit` — need to check if chrome is covered |
| Component snapshot tests | No snapshot tests for Header/SiteFooter found |

Test gap: no test verifies that `getChromeContent("de")` returns German strings or `getChromeContent("it")` returns Italian strings. This should be added as part of this fix.

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 4 chrome components render strings from `getChromeContent(lang)` — all wired | No DE/IT strings in data → all chrome renders EN regardless of locale | ensure DE/IT translations are natural and cover all 5 groups |
| UX / states | Required | DE/IT locale URL segment routes correctly; product pages localised; chrome layer not | visitor locale experience is broken for DE/IT — mixed-language page | validate full DE/IT page rendering after fix |
| Security / privacy | N/A | No auth or session changes; no data exposure risk | None | N/A |
| Logging / observability / audit | N/A | No observability changes needed; no audit trail for static strings | None | N/A |
| Testing / validation | Required | No unit test for `getChromeContent` locale resolution; component tests mock the function | DE/IT translations not verified in any test | add `contentPacket.test.ts` with locale resolution assertions for all 5 chrome groups |
| Data / contracts | Required | `LocalizedText` type allows `de?` and `it?` keys — schema supports fix without type changes | `CHROME_EN_DEFAULTS` only has `en`; JSON chrome only has `en` | add `de`/`it` to defaults; remove chrome from JSON (Option A) |
| Performance / reliability | N/A | Chrome strings are read once at request time from cached in-memory object | No performance impact from adding translation keys | N/A |
| Rollout / rollback | Required | Change is additive (adding keys to a constant); no migration | Rollback: revert `CHROME_EN_DEFAULTS` changes; safe at any time | no feature flag needed; additive string addition is safe to deploy |

---

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Translation quality — machine-literal DE/IT | Medium | Medium | Use natural phrasing; for micro-copy (Shop, Support, etc.) standard translations exist |
| Materializer re-run wipes JSON chrome (Option B/C) | High | Medium | Option A avoids entirely by removing chrome from JSON |
| `notifyMe.message` and `consent.message` are longer strings — translation harder | Low | Low | Strings are short enough (1 sentence) for clear translation |
| Caching: `cachedPayload` in `readPayload()` could serve stale content in dev | Low | Low | Dev server restarts clear cache; no prod impact |
| New DE/IT strings not covered by i18n parity audit | Medium | Medium | Add `getChromeContent` unit test and check if parity audit covers chrome strings |

---

## Open Questions

All questions self-resolved from available evidence and constraints.

| Question | Resolution | Evidence |
|---|---|---|
| Are components hardcoded? | No — all correctly call `getChromeContent(lang)` | Component file reads |
| What is the active data source? | `payload.chrome` in generated JSON (overrides `CHROME_EN_DEFAULTS`) | `contentPacket.ts:307` |
| Why does materializer not generate chrome? | `SiteContentPayload` type has no `chrome` key; was added to JSON separately | `materialize-site-content-payload.ts:16-66` |
| Is there a separate chrome generation script? | No — no script found that generates chrome | `grep -rn "chrome" scripts/src/` returned no hits |
| Does the i18n parity audit cover chrome strings? | Unverified — requires running the audit | UNVERIFIED: run `CONTENT_READINESS_MODE=fail pnpm --filter caryina test i18n-parity-quality-audit` |

---

## Current Process Map — Chrome Generation

**This section covers the content generation process (not the runtime flow above):**

- Trigger: developer runs `pnpm startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina`
- Current flow: materializer reads content-packet markdown → `buildPayload()` outputs JSON with `home`, `shop`, `productPage`, `support`, `policies` → writes to `data/shops/caryina/site-content.generated.json`
- `chrome` is NOT in `buildPayload()` output — the chrome section in the current JSON was added manually or by a one-off script (not tracked)
- End condition: JSON without chrome key
- Known issue: if materializer is re-run today, chrome key is lost → all components fall back to `CHROME_EN_DEFAULTS` (EN-only) → same user-facing bug remains, just via a different code path

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Chrome component wiring (Header, SiteFooter, ConsentBanner, ShippingReturnsTrustBlock) | Yes | None — all components correctly pass `lang` to `getChromeContent` | No |
| `getChromeContent` function logic | Yes | `??` operator picks full JSON chrome object over defaults; per-string locale fallback exists but is never reached with DE/IT | No |
| `site-content.generated.json` chrome data | Yes | All 27 chrome strings have only `en` key | No |
| `CHROME_EN_DEFAULTS` in `contentPacket.ts` | Yes | All entries EN-only; bypassed anyway since JSON chrome exists | No |
| Materializer scope | Yes | `chrome` absent from `SiteContentPayload` type and `buildPayload()` — durability risk confirmed | No |
| Test coverage | Partial | No unit test for `getChromeContent` locale resolution; component tests mock the function | No |

---

## Scope Signal

**Signal: right-sized**

**Rationale:** The fix is contained to one module (`contentPacket.ts`) plus translation values. No component changes, no API changes, no schema migrations. Adding ~54 translation strings to `CHROME_EN_DEFAULTS` (27 strings × 2 locales) and removing the chrome key from the JSON is a well-bounded change. The materializer durability risk is eliminated by Option A. Test additions are one focused unit test file for `getChromeContent`.

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed component code is locale-aware (read all 4 component files + layout.tsx)
- Confirmed the chrome data path in `contentPacket.ts` (`readPayload().chrome ?? CHROME_EN_DEFAULTS`)
- Confirmed `site-content.generated.json` has chrome key with EN-only values
- Confirmed materializer does not generate chrome (no `chrome` in `SiteContentPayload` type)
- Confirmed `LOCALES = ["en", "de", "it"]` (3 locales)
- Confirmed chrome string inventory (27 strings across 5 groups)

### Confidence Adjustments

- Initial operator description ("hardcoded in English") was misleading — the components are not hardcoded, but the data is. Investigation correctly identified the actual root cause.
- Confidence in fix approach: **high** — Option A is low-risk, contained, and eliminates the durability problem entirely.

### Remaining Assumptions

- Translations for the ~27 chrome strings can be authored as part of the build task (no external translation service needed for micro-copy)
- `CONTENT_READINESS_MODE=fail` parity audit scope does not already cover chrome strings (needs verification in CI)

---

## Evidence Audit

### Entry Points
- `apps/caryina/src/lib/contentPacket.ts:306`
  - `getChromeContent(locale)` — single function that produces all chrome strings for all components; reads `readPayload().chrome ?? CHROME_EN_DEFAULTS`
- `apps/caryina/src/lib/contentPacket.ts:268`
  - `CHROME_EN_DEFAULTS` — fallback when no chrome in JSON; currently EN-only; bypassed when JSON chrome exists
- `data/shops/caryina/site-content.generated.json`
  - Active chrome data store; `chrome` key present with all 5 groups and 27 strings; all `{en: "..."}` only
- `apps/caryina/src/app/[lang]/layout.tsx`
  - Root locale layout; calls `getChromeContent(lang)` and distributes to all chrome components

### Key Modules / Files
- `apps/caryina/src/lib/contentPacket.ts` — chrome read path; `CHROME_EN_DEFAULTS`; `localizedText(value, locale)`
- `data/shops/caryina/site-content.generated.json` — active data source (overrides defaults)
- `scripts/src/startup-loop/website/materialize-site-content-payload.ts` — JSON generator; has no `chrome` in type/output
- `packages/i18n/src/locales.ts` — `LOCALES = ["en", "de", "it"]` confirmed

---

## Confidence Inputs

- **Implementation: 95%**
  - Evidence basis: single function to modify (`getChromeContent` / `CHROME_EN_DEFAULTS`); no schema changes needed; `LocalizedText` type already supports `de?` and `it?` keys; all components already wired
  - To raise to 100%: author and verify all 54 translation strings

- **Approach: 92%**
  - Evidence basis: Option A (enrich `CHROME_EN_DEFAULTS`, remove JSON chrome) is safe, additive, and eliminates materializer durability risk; components need no changes
  - To raise to 95%: confirm parity audit test coverage scope for chrome strings

- **Impact: 95%**
  - Evidence basis: fix directly resolves the mixed-language experience for all 4 chrome surfaces; no collateral changes required
  - To raise to 100%: manual verification of DE/IT rendering in browser

- **Delivery-Readiness: 90%**
  - Evidence basis: scope is fully bounded; 27 strings × 2 locales = 54 translation values; one new test file; remove chrome from JSON
  - To raise to 95%: settle translation content for all 54 strings before task execution

- **Testability: 88%**
  - Evidence basis: `getChromeContent` is a pure function with deterministic output — easily unit-testable; component tests already mock at this boundary
  - To raise to 95%: confirm jest setup for `contentPacket.ts` unit tests (no module mocking needed for this path)

---

## Analysis Readiness

- Ready: Yes
- Recommended next step: `lp-do-analysis`
- Rationale:
  - Root cause is confirmed and fully scoped — data layer only, no component changes
  - Option A (enrich `CHROME_EN_DEFAULTS`, remove JSON chrome) is clearly the right approach; no operator-only decision required
  - The only remaining work before build is authoring the 54 translation strings
  - Risk profile is low: additive change, easy rollback, no migrations

---

## Primary Evidence

1. `apps/caryina/src/lib/contentPacket.ts:306-344` — `getChromeContent()` + `CHROME_EN_DEFAULTS`
2. `data/shops/caryina/site-content.generated.json` — confirmed chrome present, zero `de`/`it` keys
3. `scripts/src/startup-loop/website/materialize-site-content-payload.ts:16-66` — `SiteContentPayload` type has no `chrome`; `buildPayload()` never generates it
4. `apps/caryina/src/app/[lang]/layout.tsx:18-30` — locale routing and chrome wiring confirmed correct
5. `packages/i18n/src/locales.ts` — `LOCALES = ["en", "de", "it"]` confirmed
