---
Type: Fact-Find
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: "2026-03-12"
Feature-Slug: caryina-i18n-ui-chrome
Execution-Track: code
artifact: fact-find
dispatch: IDEA-DISPATCH-20260312143000-9558
---

# Caryina i18n UI Chrome -- Fact-Find

## Problem Statement

Caryina serves customers in EN/DE/IT locales (route-based: `[lang]/...`), but the header, footer, consent banner, and trust strip all render hardcoded English strings. A German or Italian visitor sees "Shop", "Support", "Terms", "Privacy", "Accept", "Decline", etc. regardless of their locale. This undermines the multilingual promise of the site and creates a jarring mixed-language experience on non-EN routes.

## Current State

### Hardcoded strings inventory

**Header** (`apps/caryina/src/components/Header.tsx`):
- "Shop" (nav link label, line 47)
- "Support" (nav link label, line 53)
- `aria-label="Caryina"` (line 20) -- brand name, not translatable

**Footer** (`apps/caryina/src/components/SiteFooter.tsx`):
- "Terms", "Privacy", "Returns & Refunds", "Shipping", "Support" (link labels, lines 6-10)
- "All rights reserved." (copyright line, line 43)
- `alt="Caryina -- Un solo dettaglio. Quello carino."` (logo alt text, line 21) -- Italian tagline, arguably intentional

**Consent banner** (`apps/caryina/src/components/ConsentBanner.client.tsx`):
- "We use analytics cookies to understand how visitors interact with our site. See our" (line 56)
- "privacy policy" (link label, line 62)
- "Decline" (button, line 71)
- "Accept" (button, line 79)
- `aria-label="Cookie consent"` (line 53)

**Shipping/Returns trust block** (`apps/caryina/src/components/ShippingReturnsTrustBlock.tsx`):
- "Free exchange within 30 days . Delivery estimated at checkout" (summary line, line 5)
- "Shipping policy" (link label, line 33)
- "Returns & exchanges" (link label, line 39)

**NotifyMe form** (`apps/caryina/src/components/catalog/NotifyMeForm.client.tsx`) -- also in scope:
- "I agree to receive a one-time reminder email about this product" (line 11)
- "Something went wrong -- please try again." (line 12)
- "Please enter your email and consent to receive the reminder." (line 30)
- "Email" (label, line 80)
- "Notify me" / "Submitting..." (button, lines 121)
- "Thank you. We'll email you when this product is available." (success, line 72)

All strings are marked with `i18n-exempt` comments referencing CARYINA-103 through CARYINA-106 with `ttl=2026-12-31`.

### How content currently flows

1. **Materializer** (`scripts/src/startup-loop/website/materialize-site-content-payload.ts`) reads source markdown artifacts and writes `data/shops/caryina/site-content.generated.json`.
2. **Content packet** (`apps/caryina/src/lib/contentPacket.ts`) reads the JSON at build/runtime, exposes getter functions (`getHomeContent`, `getShopContent`, `getTrustStripContent`, etc.) that accept a `Locale` and resolve via the `localizedText()` helper (returns `value[locale] ?? value.en`).
3. **Page components** call content-packet getters in server components, pass resolved strings as props to presentational components.
4. **UI chrome components** (Header, Footer, ConsentBanner, ShippingReturnsTrustBlock) do NOT participate in this content pipeline. They receive only `lang: string` and render hardcoded English.

The `LocalizedText` type (`{ en: string; de?: string; it?: string }`) and the `localizedText()` resolver are already proven patterns in the codebase.

### Shared i18n infrastructure

- `@acme/i18n/locales` provides `Locale`, `resolveLocale`, `LOCALES` -- already imported by Caryina pages.
- `@acme/i18n` barrel exports `resolveText`, `resolveContentText`, `useTranslations`, `TranslationsProvider` -- these support a `TranslatableText` union type (key-ref or inline).
- Brikette uses a full i18next setup with namespace JSON files, `loadI18nNs`, and `getTranslations` server helper. This is heavyweight infrastructure Caryina does not use and does not need for ~30 UI chrome strings.
- Caryina has zero i18next dependency. Its entire i18n strategy is the content-packet `LocalizedText` pattern.

## Options Considered

### Option A: Extend site-content.generated.json with a `chrome` section

Add a `chrome` (or `ui`) key to the existing `SiteContentPayload` type and JSON file containing all header/footer/consent/trust-block strings as `LocalizedText` objects. Add a `getChromeContent(locale)` getter to `contentPacket.ts`. Components receive resolved strings as props from the layout or page.

**Pros:**
- Consistent with how all other Caryina content is already handled.
- Translations live in the same artifact, same pipeline, same fallback logic.
- No new dependencies. No new build steps.
- DE/IT translations can be added incrementally -- `localizedText()` already falls back to EN.
- The materializer can eventually generate these strings from source artifacts, or they can be hand-edited in the JSON (like `trustStrip` was).

**Cons:**
- The materializer TypeScript type and output need updating to include the new section.
- The JSON file note says `_manualExtension: "trustStrip added manually 2026-02-28 -- materializer update pending"` -- adding another manual section increases the gap.
- ConsentBanner is a client component (`"use client"`), so it cannot call `contentPacket.ts` directly (which uses `fs`). The resolved strings must be passed as props from the server layout.

**Effort:** Small. ~3-4 files changed (JSON schema type, JSON content, contentPacket.ts getter, layout.tsx prop threading), plus updating each of the 4-5 chrome components to accept string props instead of hardcoding.

### Option B: Use the shared i18n package (i18next + namespace bundles)

Add i18next as a dependency to Caryina. Create a `chrome.json` namespace file per locale. Use `getTranslations(lang, "chrome")` in server components and a `TranslationsProvider` + `useTranslations` in client components.

**Pros:**
- Standard i18n pattern used by Brikette.
- Scales well if Caryina grows to hundreds of translatable strings.
- Built-in pluralization, interpolation, nested keys.

**Cons:**
- Adds i18next dependency + significant wiring (init, config, namespace loading, fallback setup).
- Caryina currently has zero i18next usage -- this is a large structural change for ~30 strings.
- Inconsistent with how all other Caryina content is loaded (content-packet pattern).
- Client components (ConsentBanner, NotifyMeForm) need `TranslationsProvider` context wrapping.
- Overkill for the current scale. Can be revisited if the string count grows significantly.

**Effort:** Medium-large. New dependency, i18n init config, namespace JSON files, provider wrapping in layout, refactor all chrome components.

### Option C: Inline locale map co-located with each component

Each component defines its own `Record<Locale, string>` map for its strings:

```ts
const labels = {
  shop: { en: "Shop", de: "Shop", it: "Negozio" },
  support: { en: "Support", de: "Hilfe", it: "Assistenza" },
} as const;
```

Components resolve via `labels.shop[lang] ?? labels.shop.en`.

**Pros:**
- Simplest possible change. Zero infrastructure. Each component is self-contained.
- Easy to understand, easy to review.
- No prop threading needed -- components already receive `lang`.

**Cons:**
- Strings scattered across 5+ component files -- no single source of truth.
- Cannot be managed by the materializer pipeline.
- Inconsistent with the content-packet pattern used everywhere else in Caryina.
- Hard to hand off to a translator (they need to find strings in TSX files).
- Client components work naturally (they already have `lang` prop), but the pattern diverges from the rest of the app.

**Effort:** Small. Each component edited independently. No shared infrastructure changes.

## Recommendation

**Option A: Extend site-content.generated.json.** It aligns with Caryina's established content architecture, keeps all translatable text in one artifact, and requires no new dependencies. The `localizedText()` fallback-to-EN behavior means DE/IT translations can be added later without code changes. The only wrinkle -- client components needing props from server -- is straightforward to solve in the layout (pass a `chromeStrings` object to ConsentBanner and NotifyMeForm as props).

Option C is a reasonable fallback if speed is the priority and content-pipeline consistency is not a concern. Option B is not justified at the current scale.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to plan |
|---|---|---|---|---|
| UI / visual | Required | Chrome components render hardcoded English. Layout passes `lang` but components ignore it for text. | All chrome text is EN-only on DE/IT routes. | Components must render locale-resolved strings. No visual/layout changes needed -- only text content changes. |
| UX / states | Required | `localizedText()` returns EN when locale key is missing -- graceful fallback exists. | ConsentBanner and NotifyMeForm are client components; they cannot access the server-side content packet directly. | Layout must thread resolved strings as props to client components. Fallback behavior (EN when DE/IT missing) is already correct. |
| Security / privacy | N/A | Consent banner text is informational/legal. No auth or input handling changes. | None. | Translated consent text should be reviewed for legal accuracy, but that is a content concern, not a code concern. |
| Logging / observability / audit | N/A | No logging changes. Content resolution already logs warnings in dev for missing locales. | None. | Existing `localizedText()` dev warnings cover missing translations. |
| Testing / validation | Required | No existing tests for chrome string content. Snapshot tests exist for structured data but not for UI chrome text. | No test coverage for locale-resolved chrome strings. | Plan should include at least one test verifying that `getChromeContent` returns correct structure and falls back to EN. |
| Data / contracts | Required | `SiteContentPayload` type in both `contentPacket.ts` and `materialize-site-content-payload.ts` defines the JSON shape. | New `chrome` section must be added to both type definitions and to the JSON file. Materializer type and runtime type must stay in sync. | Type changes in two files; JSON content addition; getter function addition. |
| Performance / reliability | N/A | Content packet is read once and cached (`cachedPayload`). Adding a section does not change read cost. | None. | No performance concern -- same single JSON read, same cache. |
| Rollout / rollback | N/A | Content is baked into the JSON file at build time. Rolling back means reverting the JSON and type changes. | None. | Standard git revert suffices. No migration, no feature flag needed. |

## Open Questions

1. **Should the NotifyMe form strings be included in this scope?** It has 6 hardcoded strings and is also a client component. Including it keeps all chrome i18n in one pass, but it is a different component category (form UX vs. navigation/legal).
2. **Who provides DE/IT translations?** The content-packet pattern supports adding them later, but the plan should clarify whether translations are provided now (by the operator or an LLM pass) or deferred to a follow-up.
3. **Materializer update**: The JSON already has a `_manualExtension` warning about `trustStrip`. Should the plan include a materializer update to generate the `chrome` section, or is manual editing acceptable for now?
