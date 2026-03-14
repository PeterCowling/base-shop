---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: caryina-i18n-hardcoded-english
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/caryina-i18n-hardcoded-english/fact-find.md
Related-Plan: docs/plans/caryina-i18n-hardcoded-english/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Caryina Chrome i18n — Analysis

## Decision Frame

### Summary

All four Caryina chrome components (Header, SiteFooter, ConsentBanner, ShippingReturnsTrustBlock) are already locale-wired — they all call `getChromeContent(lang)`. The display bug is caused entirely by missing DE/IT translation values in the chrome data layer. The decision here is: **where should DE/IT chrome translations live and how should they be loaded?**

### Goals

- Choose an approach that delivers DE/IT translations for all 27 chrome strings across 5 groups
- Ensure the fix is durable across future materializer re-runs
- Add test coverage confirming locale-correct output from `getChromeContent`

### Non-goals

- Translating product copy, policy body text, or SEO content
- Adding new chrome components or changing chrome structure
- Internationalising admin routes

### Constraints & Assumptions

- Constraints:
  - Materializer (`materialize-site-content-payload.ts`) must continue to work without changes (or with minimal additive changes only)
  - Any fix must survive future materializer re-runs without silently wiping translations
  - Translations must be natural (not machine-literal) German and Italian
- Assumptions:
  - Chrome strings are UI micro-copy that belongs in code constants, not in a CMS or content packet
  - Three supported locales: `en`, `de`, `it` (confirmed from `packages/i18n/src/locales.ts`)
  - `LocalizedText` type already has optional `de?` and `it?` keys — no type changes needed

---

## Inherited Outcome Contract

- **Why:** German and Italian visitors get a mixed-language experience — translated product pages but English navigation, consent banner, footer links, and trust strip. This undermines trust, especially on legal pages where language matters.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All persistent UI chrome (header, footer, consent banner, trust strip) displays in the visitor's selected language
- **Source:** operator

---

## Fact-Find Reference

- Related brief: `docs/plans/caryina-i18n-hardcoded-english/fact-find.md`
- Key findings used:
  - All 4 chrome components already call `getChromeContent(lang)` — no component changes needed
  - `getChromeContent` uses `readPayload().chrome ?? CHROME_EN_DEFAULTS` — JSON chrome takes full precedence over defaults
  - `site-content.generated.json` chrome section exists with 27 strings, all `{en: "..."}` only — no `de`/`it` entries
  - `CHROME_EN_DEFAULTS` in `contentPacket.ts` also has only `en` entries, and is currently bypassed
  - **Two separate `SiteContentPayload` types exist**: the runtime type in `contentPacket.ts` (has `chrome?: ChromeContent`) and the materializer's own type in `materialize-site-content-payload.ts` (has no `chrome` key). These are different types with the same name — the materializer's type is authoritative for what gets written to JSON.
  - `site-content.generated.json` has an explicit `_manualExtension` guard: `"Do not run materializer without porting productPage.trustStrip and chrome blocks first."` — confirms chrome was added manually and the materializer does not regenerate it. `trustStrip` on `productPage` faces the same risk.
  - `LocalizedText` type: `{ en: string; de?: string; it?: string }` — schema already supports the fix

---

## Evaluation Criteria

| Criterion | Why it matters | Weight |
|---|---|---|
| Durability: survives materializer re-run | The materializer could silently wipe DE/IT if chrome remains in JSON | High |
| Complexity | Team velocity and future maintainability | High |
| Translation maintainability | How easy it is to update or extend translations in future | Medium |
| Test coverage feasibility | Deterministic verification of locale output | Medium |
| Rollback safety | Can changes be reverted safely in production | Medium |

---

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Code-owned defaults | Add DE/IT to `CHROME_EN_DEFAULTS` in `contentPacket.ts`; remove `chrome` from `site-content.generated.json` so defaults are always used | Zero materializer risk; chrome translations are code-owned, versioned with code; simple rollback; no merge logic | All future chrome changes require code deploy (not data update) | None significant | **Yes — Recommended** |
| B — JSON + materializer guard | Add DE/IT entries to JSON chrome; extend materializer's `SiteContentPayload` type and `buildPayload()` to preserve/regenerate chrome with translations | Chrome stays close to product content data; materializer-driven regeneration | Materializer must now carry translations (requires source of truth for DE/IT strings); significant materializer changes; risk of mistranslation on regeneration | Materializer becomes translation-aware — adds scope and fragility | Yes — viable but overcomplicated |
| C — Per-string merge fallback | Add DE/IT to `CHROME_EN_DEFAULTS`; change `getChromeContent` to deep-merge JSON chrome over defaults (so JSON can override per-string) | Most flexible; both code and JSON can contribute locale values | Adds merge function complexity; two sources of truth for chrome; harder to reason about locale resolution | Dual-source confusion for future maintainers | Viable but unnecessary complexity for current scope |

**Option B rejected:** Materializer changes to carry chrome translations add significant scope and risk. The materializer is for product/brand content generation — making it translation-aware for UI micro-copy is a responsibility mismatch. This would require: (a) a new source of DE/IT strings in the content packet, (b) translation extraction logic, (c) preserving user-edited values across regeneration cycles. Not worth it for 27 short strings.

**Option C rejected:** The merge strategy is elegant but unnecessary. There is no current or foreseeable need to override individual chrome strings from JSON — chrome is structural UI copy, not shop-specific brand text. Adding merge complexity to serve a non-existent use case is overengineering.

---

## Engineering Coverage Comparison

| Coverage Area | Option A | Option B | Option C | Chosen (A) implication |
|---|---|---|---|---|
| UI / visual | Add DE/IT to code constant; JSON chrome removed → defaults active | Add DE/IT to JSON; extend materializer | Add DE/IT to defaults; add merge to getChromeContent | No component changes; translations live in `contentPacket.ts` |
| UX / states | Full DE/IT locale page experience delivered | Same | Same | All 4 chrome surfaces correct for DE/IT after deploy |
| Security / privacy | N/A — no auth/session changes | N/A | N/A | N/A |
| Logging / observability / audit | N/A — static strings, no audit needed | N/A | N/A | N/A |
| Testing / validation | Unit test `getChromeContent("de")` / `("it")` — pure function, easy | Same test, but also need materializer regen test | Same test + merge logic test | One focused test file: `contentPacket.test.ts` covering all 5 groups × 3 locales |
| Data / contracts | Remove `chrome` from JSON (or let materializer overwrite); defaults become canonical | Extend materializer `SiteContentPayload` type with `chrome` | Keep JSON chrome as override surface; defaults as base | `CHROME_EN_DEFAULTS` → `CHROME_DEFAULTS` with `de`/`it` keys; JSON chrome removed |
| Performance / reliability | No change — cached read, additive object keys | No change | Adds merge overhead (negligible) | Zero performance impact |
| Rollout / rollback | Additive constant change + JSON key removal; revert = delete `de`/`it` keys from constant | Materializer regeneration required to rollback | Additive merge + constant changes | Safest rollback of all options |

---

## Chosen Approach

**Recommendation: Option A — Code-owned `CHROME_DEFAULTS` with DE/IT entries; remove `chrome` from generated JSON**

**Why this wins:**
1. **Durability is guaranteed**: Once `chrome` is removed from `site-content.generated.json`, there is no materializer re-run that can wipe translations. The materializer doesn't generate chrome and never will under this approach.
2. **Simplest implementation**: ~54 translation string values added to an existing constant; one JSON key removed; no new abstractions.
3. **Correct responsibility boundary**: UI micro-copy (Shop, Support, Terms, etc.) belongs in code alongside the component logic that uses it, not in a data pipeline driven by brand content generation.
4. **Easiest to test**: `getChromeContent` is a pure function with deterministic output; a single unit test file can cover all 27 strings × 3 locales.
5. **Safe rollback**: Reverting is a simple code change; no data migration or materializer rerun needed.

**What it depends on:**
- Natural German and Italian translations for all 27 chrome strings (micro-copy, straightforward to author)
- Removing the `chrome` key from `data/shops/caryina/site-content.generated.json`

### Rejected Approaches

- **Option B (JSON + materializer guard)** — Materializer responsibility mismatch; requires chrome translation source in content packet; over-scoped for UI micro-copy
- **Option C (per-string merge)** — Unnecessary complexity; no use case for per-string JSON overrides on UI chrome labels

### Open Questions (Operator Input Required)

None. The approach is fully determined from available evidence.

---

## End-State Operating Model

None: no material process topology change

The runtime locale-read path is unchanged: `[lang]/layout.tsx` calls `getChromeContent(lang)`, components receive strings, locale resolution happens inside `contentPacket.ts`. After this fix, `CHROME_DEFAULTS` replaces `CHROME_EN_DEFAULTS` as the active chrome source (because the JSON `chrome` key is removed), and `localizedText(value, locale)` returns the correct locale string instead of falling back to `en`.

**Important source-of-truth change**: Chrome translations permanently move from JSON to code (`contentPacket.ts`). Future contributors updating chrome strings must edit `CHROME_DEFAULTS` in `contentPacket.ts` — not the generated JSON. This should be documented in the constant's JSDoc comment.

---

## Planning Handoff

- Planning focus:
  - TASK-01: Author all 27 DE and 27 IT chrome translations (54 total values). Non-trivial strings requiring natural phrasing: `consent.message` = "We use analytics cookies to understand how visitors interact with our site. See our"; `notifyMe.consent` = "I agree to receive a one-time reminder email about this product"; `notifyMe.validation` = "Please enter your email and consent to receive the reminder."
  - TASK-02: Rename `CHROME_EN_DEFAULTS` → `CHROME_DEFAULTS`; add `de`/`it` entries for all 5 groups; add JSDoc noting this is the source of truth for chrome translations
  - TASK-03: Remove `chrome` key from `data/shops/caryina/site-content.generated.json` (keep other manual additions: `_manualExtension`, `productPage.trustStrip`); update `_manualExtension` note to reflect chrome is now code-owned
  - TASK-04: Add `apps/caryina/src/lib/contentPacket.test.ts` — unit test `getChromeContent` for all 5 groups × 3 locales; also check i18n parity audit scope before writing to avoid overlap
- Validation implications:
  - `getChromeContent("de")` must return German strings for all 27 fields
  - `getChromeContent("it")` must return Italian strings for all 27 fields
  - `getChromeContent("en")` must continue returning English strings unchanged
  - Existing component tests that mock `getChromeContent` must still pass (no interface change)
  - Typecheck: `CHROME_DEFAULTS` entries now have additional `de`/`it` keys — type is still `ChromeContent` (compatible)
  - TASK-03 must not remove `productPage.trustStrip` from JSON (separate manual addition, different durability concern)
- Sequencing constraints:
  - TASK-01 (author translations) must precede TASK-02 (add to constant)
  - TASK-02 and TASK-03 must be in the same commit — atomically swap source of truth from JSON to code; do not leave chrome in JSON while code also has DE/IT (this would cause the JSON chrome to still win, hiding the new translations until TASK-03 is done)
  - TASK-04 (tests) can be written after TASK-02/03
- Risks to carry into planning:
  - **`_manualExtension` guard**: JSON has explicit warning not to run materializer without porting trustStrip and chrome. TASK-03 resolves the chrome risk; trustStrip risk is separate and pre-existing
  - Translation naturalness: 3 sentence-length strings flagged above require careful DE/IT authoring
  - i18n parity audit scope: verify whether `CONTENT_READINESS_MODE=fail` audit covers chrome strings to avoid test conflicts in TASK-04

---

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Translation naturalness for 3 sentence-length strings | Low | Low | Requires specific translation content not yet authored | Flag these strings in TASK-01: `consent.message`, `notifyMe.consent`, `notifyMe.validation` |
| `_manualExtension` guard: materializer run would wipe chrome and trustStrip | Very Low | High | JSON guard is the only protection; TASK-03 resolves chrome; trustStrip risk is pre-existing and out of scope | Complete TASK-02+03 atomically; track trustStrip durability as a follow-on concern |
| i18n parity audit scope overlap with new unit tests | Low | Low | Requires running the audit to check scope | Check before writing TASK-04: `CONTENT_READINESS_MODE=fail pnpm --filter caryina test i18n-parity-quality-audit` |

---

## Planning Readiness

- Status: Go
- Rationale: Approach is decisive; no operator input required; scope is fully bounded; all 27 strings identified; ECM complete; zero blocking risks
