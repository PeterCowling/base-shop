---
Type: Plan
Status: Archived
Domain: Products
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-i18n-ui-chrome
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: None — direct fact-find to plan (small scope, single clear recommendation)
artifact: plan
---

# Caryina i18n UI Chrome Plan

## Summary

Extend `site-content.generated.json` with a `chrome` section containing all header, footer, consent banner, trust block, and notify-me form strings as `LocalizedText` objects. Add a `getChromeContent(locale)` getter to `contentPacket.ts`. Update all five chrome components to receive resolved strings instead of rendering hardcoded English. Client components (ConsentBanner, NotifyMeForm) receive strings as props from the server layout. Initial content is EN-only; DE/IT translations can be added to the JSON later without code changes, thanks to the existing `localizedText()` EN-fallback behavior.

## Active tasks
- [x] TASK-01: Add chrome content section to data layer — Complete (2026-03-12)
- [x] TASK-02: Wire chrome strings into all UI chrome components — Complete (2026-03-12)

## Goals
- All persistent UI chrome (header nav, footer links, consent banner, trust strip, notify-me form) renders in the visitor's selected language.
- Consistent with Caryina's existing content-packet `LocalizedText` pattern — no new dependencies.
- DE/IT translations addable later by editing JSON only (no code changes).

## Non-goals
- Providing DE/IT translations now (EN-only initial pass; `localizedText()` falls back to EN).
- Updating the materializer to generate the chrome section (manual JSON edit, same as `trustStrip`). The `getChromeContent()` getter must include hardcoded EN defaults as fallback when the JSON `chrome` key is absent — so a materializer regeneration will not break the app, just revert chrome text to EN defaults until the chrome section is re-added.
- Translating admin UI or error pages.
- Localizing server-side API error messages (e.g., `/api/notify-me` returns English error strings like "Consent required"). The client-side form will use its own locale-resolved validation messages for the common cases; server errors are a separate concern.

## Constraints & Assumptions
- Constraints:
  - Client components (`ConsentBanner`, `NotifyMeForm`) cannot call `contentPacket.ts` (uses `node:fs`). Resolved strings must be passed as props from the server layout.
  - `SiteContentPayload` type must be updated in `contentPacket.ts`. The materializer TS type (`materialize-site-content-payload.ts`) is a separate concern — not updated in this scope (manual JSON editing is the current pattern for `trustStrip`).
- Assumptions:
  - The `site-content.generated.json` file is the primary source for all Caryina translatable content. The `getChromeContent()` getter includes hardcoded EN defaults as a resilience fallback only — the JSON chrome section is the authoritative source when present. This is the same dual-layer pattern used by `getTrustStripContent()` (optional section with graceful fallback).
  - Existing `localizedText(value, locale)` returns `value[locale] ?? value.en` — DE/IT keys can be absent.

## Inherited Outcome Contract
- **Why:** German and Italian visitors see English-only navigation and legal text, undermining the multilingual promise of the site and eroding trust on non-EN routes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All persistent UI chrome (header, footer, consent banner, trust strip, notify-me form) displays in the visitor's selected language.
- **Source:** operator

## Analysis Reference
- Related analysis: None — direct fact-find to plan (small, bounded scope with single clear recommendation).
- Selected approach inherited from fact-find recommendation: Option A (extend site-content.generated.json).

## Selected Approach Summary
- What was chosen: Extend `site-content.generated.json` with a `chrome` section and add a `getChromeContent()` getter. Components receive resolved strings as props.
- Why planning is not reopening option selection: Fact-find evaluated 3 options; Option A is the clear winner — consistent with existing patterns, no new dependencies, smallest effort, supports incremental translation. Options B (i18next) and C (inline maps) were rejected for valid reasons.

## Fact-Find Support
- Supporting brief: `docs/plans/caryina-i18n-ui-chrome/fact-find.md`
- Evidence carried forward:
  - ~30 hardcoded English strings across 5 components (Header, SiteFooter, ConsentBanner, ShippingReturnsTrustBlock, NotifyMeForm)
  - All marked `i18n-exempt` with CARYINA-103 through CARYINA-106 TTLs
  - `localizedText()` pattern proven across all other Caryina content
  - ConsentBanner and NotifyMeForm are client components requiring prop threading

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add chrome content section to data layer | 90% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Wire chrome strings into all UI chrome components | 85% | S | Complete (2026-03-12) | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Chrome components render locale-resolved text instead of hardcoded English | TASK-02 | No layout/styling changes — text content only |
| UX / states | EN fallback when DE/IT keys missing; client components receive strings as props | TASK-01, TASK-02 | `localizedText()` already handles missing locale keys |
| Security / privacy | N/A: no auth, input, or data exposure changes | - | Consent text is informational; legal accuracy is a content concern |
| Logging / observability / audit | N/A: no logging changes | - | Existing dev warnings for missing locales cover this |
| Testing / validation | Typecheck verifies type additions; manual verification of rendered strings | TASK-01, TASK-02 | Tests run in CI only per project policy |
| Data / contracts | `SiteContentPayload` type extended with `chrome` section; JSON updated | TASK-01 | Materializer type not updated (manual pattern, same as trustStrip) |
| Performance / reliability | N/A: same single JSON read, same cache | - | Adding a section to existing cached payload has zero cost |
| Rollout / rollback | Standard git revert | - | No migration, no feature flag needed |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Data layer must exist before components can consume it |
| 2 | TASK-02 | TASK-01 | All 5 components can be updated in one pass |

## Tasks

### TASK-01: Add chrome content section to data layer
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `data/shops/caryina/site-content.generated.json`, `apps/caryina/src/lib/contentPacket.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `data/shops/caryina/site-content.generated.json`, `apps/caryina/src/lib/contentPacket.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% - Clear pattern to follow: existing `SiteContentPayload` interface, existing getter functions. Just add a new interface section and getter.
  - Approach: 95% - Fact-find recommendation is unambiguous; extends proven pattern.
  - Impact: 90% - Enables all chrome components to consume locale-resolved strings.
- **Acceptance:**
  - [ ] `SiteContentPayload` interface has a `chrome` section with all ~30 strings as `LocalizedText` objects
  - [ ] `site-content.generated.json` has a `chrome` key with EN values for all strings
  - [ ] `getChromeContent(locale)` exported from `contentPacket.ts` returning resolved strings
  - [ ] `readPayload()` validation does not break (chrome section is optional or validated)
  - [ ] `pnpm --filter caryina typecheck` passes
- **Engineering Coverage:**
  - UI / visual: N/A — data layer only, no rendering
  - UX / states: Required — `getChromeContent()` must return EN fallback when locale key missing
  - Security / privacy: N/A — no auth or input changes
  - Logging / observability / audit: N/A — no logging changes
  - Testing / validation: Required — typecheck passes with new type; getter returns expected shape
  - Data / contracts: Required — `SiteContentPayload` type extended; JSON schema matches type
  - Performance / reliability: N/A — same cached read
  - Rollout / rollback: N/A — standard git revert
- **Validation contract (TC-XX):**
  - TC-01: `getChromeContent("en")` returns object with all header/footer/consent/trust/notify strings resolved to EN values
  - TC-02: `getChromeContent("de")` returns same shape, falling back to EN values (no DE keys yet)
  - TC-03: Type error if `chrome` section shape doesn't match `SiteContentPayload` definition
- **Execution plan:**
  1. Add `ChromeContent` interface to `contentPacket.ts` with groups: `header` (shop, support, navAriaLabel), `footer` (terms, privacy, returnsRefunds, shipping, support, copyright, sectionAriaLabel), `consent` (message, privacyLink, decline, accept, ariaLabel), `trust` (summary, shippingLink, returnsLink), `notifyMe` (consent, error, validation, emailLabel, submit, submitting, success)
  2. Add `chrome?: ChromeContent` to `SiteContentPayload` (optional with `?` to not break existing payloads missing it)
  3. Add `getChromeContent(locale)` getter following existing pattern. **Must include hardcoded EN defaults** as fallback when `payload.chrome` is undefined — this makes the app resilient to materializer regeneration that omits the chrome section
  4. Add `chrome` section to `site-content.generated.json` with EN values for all strings including aria-labels
  5. Typecheck
- **Scouts:** None: pattern is proven across 7 existing getter functions
- **Edge Cases & Hardening:**
  - Missing `chrome` key in JSON (materializer regeneration or old payload): `getChromeContent()` returns hardcoded EN defaults. Making `chrome?` optional on the type handles backward compat. This means the app never breaks — worst case, chrome strings revert to EN defaults until the JSON chrome section is re-added.
- **What would make this >=90%:** Already at 90%. Would reach 95% with a unit test for the getter, but tests run in CI only.
- **Rollout / rollback:**
  - Rollout: Ship with next deployment
  - Rollback: Revert the 2 files (JSON + TS)
- **Documentation impact:** None
- **Notes / references:**
  - Follow exact pattern of `getTrustStripContent()` for optional section handling
- **Build Evidence (2026-03-12):**
  - Added `ChromeContent` interface with 5 groups (header, footer, consent, trust, notifyMe) to `contentPacket.ts`
  - Added `chrome?: ChromeContent` to `SiteContentPayload` (optional for backward compat)
  - Added `CHROME_EN_DEFAULTS` hardcoded fallback constant
  - Added `getChromeContent(locale)` getter with dual-layer pattern (JSON primary, EN defaults fallback)
  - Added `chrome` section to `site-content.generated.json` with EN values for all ~30 strings
  - Typecheck passes

### TASK-02: Wire chrome strings into all UI chrome components
- **Type:** IMPLEMENT
- **Deliverable:** code-change — Header.tsx, SiteFooter.tsx, ConsentBanner.client.tsx, ShippingReturnsTrustBlock.tsx, NotifyMeForm.client.tsx, layout.tsx, product/[slug]/page.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/caryina/src/components/Header.tsx`, `apps/caryina/src/components/SiteFooter.tsx`, `apps/caryina/src/components/ConsentBanner.client.tsx`, `apps/caryina/src/components/ShippingReturnsTrustBlock.tsx`, `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx`, `apps/caryina/src/app/[lang]/layout.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - 5 components + layout update. Each is straightforward but the volume means more surface area for mistakes. Held-back test: no single unknown would drop this below 80 — all component signatures are known, all string locations identified in fact-find.
  - Approach: 90% - Server components call getter directly; client components receive props from layout. Pattern is clear.
  - Impact: 90% - Directly delivers the intended outcome: locale-resolved chrome text.
- **Acceptance:**
  - [ ] Header renders locale-resolved "Shop" and "Support" labels and nav aria-label
  - [ ] SiteFooter renders locale-resolved link labels, copyright text, and section aria-label
  - [ ] ConsentBanner renders locale-resolved consent message, button labels, and aria-label
  - [ ] ShippingReturnsTrustBlock renders locale-resolved summary and link labels
  - [ ] NotifyMeForm renders locale-resolved form labels, consent text, and success message. Client-side validation messages (consent, email) are locale-resolved; server API error strings remain EN (out of scope — see Non-goals)
  - [ ] All `i18n-exempt` comments removed from all 5 components (CARYINA-103 through CARYINA-106 and any other exemption markers including CARYINA-notify-me)
  - [ ] `pnpm --filter caryina typecheck` passes
  - [ ] No visual/layout changes — only text content changes
- **Expected user-observable behavior:**
  - [ ] Visiting `/en/shop` shows "Shop" in header, "Terms" in footer, "Accept"/"Decline" on consent banner
  - [ ] Visiting `/de/shop` shows same strings (EN fallback until DE translations added to JSON)
  - [ ] Visiting `/it/shop` shows same strings (EN fallback until IT translations added to JSON)
  - [ ] After DE/IT translations are added to JSON, visiting `/de/shop` shows German strings without code changes
- **Engineering Coverage:**
  - UI / visual: Required — text content changes in 5 components; no layout/styling changes
  - UX / states: Required — EN fallback verified on DE/IT routes; client components receive valid props
  - Security / privacy: N/A — no auth or input changes
  - Logging / observability / audit: N/A — no logging changes
  - Testing / validation: Required — typecheck; manual visual verification
  - Data / contracts: Required — component prop types updated to accept chrome strings
  - Performance / reliability: N/A — no change to render cost
  - Rollout / rollback: N/A — standard git revert
- **Validation contract (TC-XX):**
  - TC-01: Header on `/en/shop` renders "Shop" and "Support" (from chrome content, not hardcoded)
  - TC-02: Header on `/de/shop` renders "Shop" and "Support" (EN fallback, no DE translations yet)
  - TC-03: ConsentBanner receives resolved strings as props from layout and renders them
  - TC-04: NotifyMeForm receives resolved strings as props and renders them in form labels/messages
  - TC-05: All `i18n-exempt` comments removed; no hardcoded English strings remain in chrome components
  - TC-06: Typecheck passes with updated prop types
- **Execution plan:**
  1. **Server components** (Header, SiteFooter, ShippingReturnsTrustBlock): import `getChromeContent`, call with `lang`, replace hardcoded strings (including aria-labels) with resolved values
  2. **Layout** (`[lang]/layout.tsx`): call `getChromeContent(lang)`, pass consent string subset as props to ConsentBanner
  3. **Product page** (`[lang]/product/[slug]/page.tsx`): call `getChromeContent(lang)`, pass notifyMe string subset as props to NotifyMeForm
  4. **Client components** (ConsentBanner, NotifyMeForm): update prop types to accept chrome strings, replace hardcoded text with props. For NotifyMeForm, use locale-resolved validation messages for client-side checks (consent, email format); display server API error messages as-is (EN, out of scope for this plan)
  5. **Cleanup**: remove all `i18n-exempt` comments (CARYINA-103 through CARYINA-106)
  6. Typecheck
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: all component signatures and string locations identified in fact-find
- **Edge Cases & Hardening:**
  - Component receiving undefined chrome prop (e.g., if layout forgets to pass): TypeScript will catch this at compile time since props are required.
  - NotifyMeForm is rendered from product detail page, not just layout: check if it needs chrome props threaded through the product page too, or if it can import getChromeContent directly (it's a client component — cannot use fs). Must receive props from the nearest server component ancestor.
- **What would make this >=90%:**
  - Snapshot tests verifying rendered text per locale (tests run in CI only)
  - DE/IT translations populated in JSON (out of scope for this plan)
- **Rollout / rollback:**
  - Rollout: Ship with next deployment
  - Rollback: Revert all 7 files (5 components + layout + product page)
- **Documentation impact:** None
- **Notes / references:**
  - NotifyMeForm is rendered inside product detail page (`apps/caryina/src/app/[lang]/product/[slug]/page.tsx`), not directly in layout. The product page is a server component — it can call `getChromeContent()` and pass notify-me strings as props.
- **Build Evidence (2026-03-12):**
  - Header.tsx: imports `getChromeContent`, renders `chrome.header.shop`, `chrome.header.support`, `chrome.header.navAriaLabel`
  - SiteFooter.tsx: imports `getChromeContent`, builds footerLinks from `chrome.footer.*`, renders copyright and section aria-label
  - ConsentBanner.client.tsx: exported `ConsentBannerStrings` interface, receives strings as props from layout
  - ShippingReturnsTrustBlock.tsx: imports `getChromeContent`, renders `chrome.trust.summary`, `chrome.trust.shippingLink`, `chrome.trust.returnsLink`
  - NotifyMeForm.client.tsx: exported `NotifyMeStrings` interface, receives strings as props from product page
  - layout.tsx: calls `getChromeContent(lang)`, passes `chrome.consent` to ConsentBanner
  - product/[slug]/page.tsx: calls `getChromeContent(lang)`, passes `chrome.notifyMe` to NotifyMeForm
  - All `i18n-exempt` comments removed from updated components
  - Typecheck passes

## Risks & Mitigations
- Risk: NotifyMeForm prop threading path is longer than expected (layout → page → component). Mitigation: Product page is a server component with direct `getChromeContent()` access.
- Risk: Removing `i18n-exempt` comments triggers lint warnings. Mitigation: Comments have TTL expiry; removal is the intended resolution.

## Observability
- Logging: None — no new logging
- Metrics: None — no new metrics
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] All 5 chrome components render locale-resolved text from the content packet
- [ ] No hardcoded English strings remain in Header, SiteFooter, ConsentBanner, ShippingReturnsTrustBlock, or NotifyMeForm
- [ ] `pnpm --filter caryina typecheck` passes
- [ ] DE/IT translations can be added by editing JSON only — no code changes required

## Decision Log
- 2026-03-12: Include NotifyMeForm in scope (same pass, same pattern, ~6 additional strings). Self-resolved per Phase 4.5 — no operator fork needed.
- 2026-03-12: EN-only initial content; DE/IT translations deferred. Self-resolved — `localizedText()` fallback handles this automatically.
- 2026-03-12: Manual JSON edit, no materializer update. Self-resolved — same pattern as `trustStrip` manual extension. Mitigated by hardcoded EN defaults in getter.
- 2026-03-12: [Critique R1] Materializer overwrite risk — addressed by adding hardcoded EN defaults in `getChromeContent()` fallback. App never breaks on regeneration.
- 2026-03-12: [Critique R1] NotifyMeForm rendered from product page, not layout — added `product/[slug]/page.tsx` to TASK-02 affects list and execution plan.
- 2026-03-12: [Critique R1] Missing aria-label strings — added `navAriaLabel` and `sectionAriaLabel` to chrome schema.
- 2026-03-12: [Critique R1] Server API error messages remain EN — documented as explicit non-goal. Client-side validation uses locale-resolved messages.
- 2026-03-12: [Adjacent: delivery-rehearsal] Server-side API error localization for `/api/notify-me` — out of scope for this plan, routed to future fact-find.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add chrome content to data layer | Yes — `contentPacket.ts` and `site-content.generated.json` exist and are well-understood | None | No |
| TASK-02: Wire chrome strings into components | Yes — TASK-01 provides `getChromeContent()` getter; all 5 component paths and string locations verified in fact-find; layout.tsx threading path clear; NotifyMeForm receives props from product page (server component) | [Minor] NotifyMeForm also appears on product page, not just layout — prop threading path noted in execution plan | No |

## Overall-confidence Calculation
- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × S(1) = 85
- Overall = (90 + 85) / 2 = 87.5% → rounded to 85%
