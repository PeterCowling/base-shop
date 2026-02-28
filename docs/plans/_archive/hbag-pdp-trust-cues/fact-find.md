---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-pdp-trust-cues
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-pdp-trust-cues/plan.md
Dispatch-ID: IDEA-DISPATCH-20260228-0007
Trigger-Source: docs/business-os/strategy/HBAG/worldclass-scan-2026-02-28.md
artifact: fact-find
---

# HBAG PDP Trust Cues — Fact-Find Brief

## Scope

### Summary

The Caryina PDP purchase area currently shows price + Add to Cart only. No warranty statement, no delivery timeframe, no returns summary, and no payment method logos appear near the CTA. The StickyCheckoutBar (mobile) shows price + Add to Cart only. For a new, unknown brand at €89–€99 with no physical retail, trust cues near the CTA do the work a store would do.

The change: add a static trust strip (desktop + mobile inline PDP) and a brief trust signal to the StickyCheckoutBar. The trust strip covers: delivery timeframe, return window, origin claim, and accepted payment methods. A companion update to the content packet (`site-content.generated.json`) adds a `trustStrip` block with the canonical copy strings.

### Goals

- Surface delivery timeframe, return window, and origin claim directly below the Add to Cart button on PDP.
- Add at minimum a one-line trust signal to the StickyCheckoutBar so mobile users scrolling past the primary CTA still see a return/exchange statement.
- Keep the trust copy consistent with the canonical content packet (no ad-hoc strings in component files).
- Copy tone: confident, not apologetic — consistent with brand dossier ("Confident, not apologetic — own the quality story").
- No external dependencies introduced; trust cues are static text with optional SVG icons.

### Non-goals

- Not adding dynamic shipping quotes or per-product delivery calculations.
- Not integrating a payment processor SDK or external-hosted payment logos (use inline SVG lock icon or text-only for payment trust signal at this stage).
- Not changing the `AddToCartButton` component in `packages/platform-core` — trust strip is a sibling, not a wrapper.
- Not adding i18n translation for trust copy beyond English at this stage (same pattern as AddToCartButton which is currently `i18n-exempt`).

### Constraints and Assumptions

- Constraints:
  - Brand constraint: "Made in Italy" cannot be used — only "Designed in Positano, Italy" or "Designed in Italy". Confirmed in brand dossier (`docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md` §Brand Claims).
  - "Birkin" cannot appear in any copy — IP/trade dress constraint.
  - Offer constraint: 30-day free exchange (not "returns", which implies full refunds by default — exchanges are the stated policy). 90-day hardware guarantee exists as a secondary commitment.
  - Payment constraint: Caryina checkout uses Axerve (Italian payment gateway, confirmed via `apps/caryina/src/app/api/checkout-session/route.ts` which imports `@acme/axerve`). The `shop.json` field `billingProvider: "stripe"` is stale and incorrect. No Apple Pay / Google Pay integrated yet (that gap is a separate scoped-out item per worldclass scan). Payment trust copy must say "Secure checkout" only — do not name any specific payment processor or use a processor-branded label.
  - Content packet constraint: trust copy strings must be added to `site-content.generated.json` via the content packet source at `docs/business-os/startup-baselines/HBAG-content-packet.md` and regenerated, or added directly to the generated JSON as a new `trustStrip` key (direct edit is the low-path option for now — materializer regeneration is the correct longer-term path; both are viable at this build scale).
- Assumptions:
  - Shipping carrier: DHL (`shop.json`: `"shippingProviders": ["dhl"]`). DHL delivery to EU is typically 3–5 business days from Italy. This is not currently stated in any policy copy — the existing policy copy defers delivery windows to checkout. The trust strip will introduce a new timeframe claim; the default assumption is "Usually ships in 2–5 business days (EU)" — EU-qualified to avoid misleading international buyers. Operator confirmation required before this goes live (see Open question).
  - Return window: 30-day free exchange is confirmed in the offer design (`HBAG-offer.md` §Guarantees). The existing `/returns` page copy says "exchange-first handling" — consistent.
  - The `productPage` section of `site-content.generated.json` already has `proofHeading` and `proofBullets` fields consumed by `page.tsx`. A new `trustStrip` key at the same level is the cleanest extension.

---

## Outcome Contract

- **Why:** The worldclass scan identified zero trust cues near the PDP purchase CTA as a major-gap abandonment driver at the €80–€150 price point. For a new/unknown brand with no physical retail, trust cues near the CTA do the work a store environment would do. Closing this gap is expected to reduce purchase hesitation for ICP-A (considered bag buyer, 3–7 day deliberation window) and ICP-B (gift buyer).
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Reduce PDP-to-checkout drop-off by making key policy commitments visible at the moment of decision. Success signal: checkout initiation rate from PDP improves (measured via GA4 `begin_checkout` events relative to `view_item` events, once GA4 is configured). Operational proxy for pre-GA4: qualitative — no customer support questions about "how long does shipping take" or "what is your return policy" from buyers who viewed the PDP.
- **Source:** auto

---

## Access Declarations

| Source | Access type | Status |
|--------|------------|--------|
| `apps/caryina/src/` — repository filesystem | read | Verified |
| `data/shops/caryina/` — local JSON data | read | Verified |
| `packages/platform-core/src/` — shared component library | read | Verified |
| `docs/business-os/` — strategy and content docs | read | Verified |
| Payment processor logos / branding | external fetch (not required) | Not needed — "Secure checkout" text + lock SVG only; no processor-branded assets |

---

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — Server component. PDP layout. The purchase area (lines 101–110) renders: price (`formatMoney`), `StockBadge`, `AddToCartButton`, and `StickyCheckoutBar`. No trust content rendered anywhere in this file outside the proof bullets section (lines 113–128), which renders placeholder system text from the content packet.
- `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — Client component. Fixed bottom bar (mobile only, `md:hidden`). IntersectionObserver-based visibility toggle. Renders: `{priceLabel}` + `AddToCartButton` only — 47 lines total.

### Key Modules / Files

1. `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP page; the insertion site for the inline trust strip.
2. `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — Mobile sticky bar; the insertion site for the brief mobile trust line.
3. `apps/caryina/src/lib/contentPacket.ts` — Content packet reader. `getProductPageContent(locale)` returns `{ proofHeading, proofBullets, relatedHeading }`. A new `getTrustStripContent(locale)` function needs to be added here, reading a new `trustStrip` key from `SiteContentPayload`.
4. `data/shops/caryina/site-content.generated.json` — Generated content JSON. Currently has `productPage.proofHeading`, `proofBullets`, `relatedHeading`. No `trustStrip` key exists. New key must be added: `productPage.trustStrip` (or a top-level `trustStrip` block).
5. `docs/business-os/startup-baselines/HBAG-content-packet.md` — Canonical content source; defines trust blocks ("Designed in Positano, Italy; manufactured to spec.", "30-day exchange window and 90-day hardware support."). These are the source for the trust copy.
6. `packages/platform-core/src/components/shop/AddToCartButton.client.tsx` — Referenced to confirm it is self-contained; no wrapping or modification needed.
7. `data/shops/caryina/shop.json` — Confirms `shippingProviders: ["dhl"]`, `returnsEnabled: true`. Note: `billingProvider: "stripe"` in this file is stale and incorrect — actual payment processor is Axerve (see `apps/caryina/src/app/api/checkout-session/route.ts`). Trust copy must not rely on this field for processor claims.
8. `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md` — Brand language constraints: origin claim = "Designed in Italy" / "Designed in Positano, Italy"; words to avoid; personality ("Confident, not apologetic").
9. `docs/business-os/startup-baselines/HBAG-offer.md` §Guarantees — Risk reversal commitments: 30-day free exchange, 90-day hardware guarantee.
10. `apps/caryina/src/components/catalog/StockBadge.tsx` — Reference for inline component pattern (small, branded, Tailwind-styled). Trust strip should follow the same pattern.

### Patterns and Conventions Observed

- Component pattern: small server-renderable components with Tailwind CSS classes; no CSS modules. Muted text uses `text-muted-foreground`. Accent dots use `bg-accent`. Evidence: `page.tsx` lines 93–128, `StockBadge.tsx`.
- Content sourcing: all page-level copy flows through `contentPacket.ts` → `site-content.generated.json`. No ad-hoc strings in page files. Evidence: `getProductPageContent`, `getPolicyContent` in `contentPacket.ts`.
- Client vs. server split: `page.tsx` is a server component; trust strip can be server-rendered (static text, no interactivity needed). StickyCheckoutBar is client-only due to IntersectionObserver; the trust line added to it must be compatible with `"use client"`.
- Locale resolution: `lang: Locale` passed to content functions. The trust strip should accept a `locale` prop or be read from `contentPacket` at render time in `page.tsx`, consistent with how `productPageContent` is already read.
- `data-cy` attribute convention: `page.tsx` line 104 uses `data-cy="pdp-checkout"` on the checkout div — test attribute pattern. New trust strip wrapper should have `data-cy="pdp-trust-strip"` for testability.

### Data and Contracts

- Types/schemas:
  - `SiteContentPayload` in `contentPacket.ts` defines the shape of `site-content.generated.json`. A new optional `trustStrip` field on `productPage` needs to be added to this interface.
  - `SKU` type from `@acme/types` — passed to both `AddToCartButton` and `StickyCheckoutBar`; trust strip does not require this type (it is static content).
- Persistence:
  - `data/shops/caryina/site-content.generated.json` — the JSON file must gain a `productPage.trustStrip` block. Since the materializer is not being rebuilt in this feature, the generated JSON will be edited directly. The `generatedAt` date field must remain date-formatted (e.g. `"2026-02-28"`) — do not convert it to free text. To track the manual extension, add a separate top-level `"_manualExtension"` string key (e.g. `"_manualExtension": "trustStrip added manually 2026-02-28 — materializer update pending"`). Note: the `sourceHash` field in this file will no longer match the content packet source after a direct edit — this is an accepted temporary exception for this build cycle. The materializer should be updated in a subsequent cycle to produce `trustStrip` natively and restore hash integrity.
- API/contracts:
  - No API changes. Trust strip is purely render-time static content.

### Dependency and Impact Map

- Upstream dependencies:
  - `contentPacket.ts` reads from `site-content.generated.json` — adding a new key and a new reader function.
  - `page.tsx` imports from `contentPacket.ts` — will import new `getTrustStripContent`.
  - `StickyCheckoutBar.client.tsx` will receive a new optional `trustLine` prop (string) from `page.tsx`.
- Downstream dependents:
  - No other files import `StickyCheckoutBar.client.tsx` outside the PDP page.
  - `contentPacket.ts` is imported by: `page.tsx` (product), `shop/page.tsx`, `[lang]/page.tsx` (home), `support/page.tsx`, `shipping/page.tsx`, `returns/page.tsx`. Adding a new exported function does not affect existing exports.
- Likely blast radius:
  - Narrow. Changes touch: `page.tsx`, `StickyCheckoutBar.client.tsx`, `contentPacket.ts`, `site-content.generated.json`. No shared platform packages modified. No routes added or removed.
  - TypeScript interface extension in `contentPacket.ts` (`SiteContentPayload`) is additive and optional — no breaking change to existing callers.

### Test Landscape

#### Test Infrastructure

- Framework: Jest (caryina app config: `apps/caryina/jest.config.cjs`)
- Test root: `apps/caryina/src/`
- CI integration: tests run in GitHub Actions CI only (CI-only test policy, `docs/testing-policy.md`). Monitor via `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`. Do not run Jest locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| PDP page | None | — | No test file exists for `product/[slug]/page.tsx` or `StickyCheckoutBar.client.tsx` |
| StockBadge | Unit | `components/catalog/StockBadge.test.tsx` | Existing; not affected by this change |
| ProductGallery | Unit | `components/catalog/ProductGallery.client.test.tsx` | Existing; not affected |
| Cart page | Unit | `app/[lang]/cart/page.test.tsx` | Existing; not affected |
| launchMerchandising | Unit | `lib/launchMerchandising.test.ts` | Existing; not affected |
| contentPacket | None | — | No test file for `lib/contentPacket.ts` |

#### Coverage Gaps

- Untested paths:
  - `StickyCheckoutBar.client.tsx` — no tests at all. Visibility toggle behaviour (IntersectionObserver) is currently untested.
  - `contentPacket.ts` — no tests for reader functions or locale fallback.
  - PDP page — no render test verifying the trust strip renders correct content.
- New tests required by this feature:
  - `StickyCheckoutBar.client.tsx` — should gain tests for: (a) trust line renders when `trustLine` prop provided, (b) trust line absent when prop not provided.
  - PDP page — should gain a test verifying `data-cy="pdp-trust-strip"` is present and renders expected trust items.

#### Testability Assessment

- Easy to test: Trust strip is a server component — straightforward to render in Jest with a mock content packet.
- Moderate complexity: `StickyCheckoutBar` uses `IntersectionObserver` — requires mock in test environment. Pattern for IntersectionObserver mock already exists in the codebase (see `ProductGallery.client.test.tsx` for precedent, or add a `beforeEach` mock).
- Test seams needed: `contentPacket.ts` needs a mock/stub seam for unit tests of page components that call it. Current pattern: Jest module mock (`jest.mock("@/lib/contentPacket", ...)`).

---

## Questions

### Resolved

- Q: What is the correct origin claim for trust copy?
  - A: "Designed in Positano, Italy" — not "Made in Italy" (manufacturing is China-based; Italian Law 166/2009 would be violated by that claim).
  - Evidence: `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md` §Brand Claims; `HBAG-offer.md` §5 objection map.

- Q: What is the return policy for trust copy?
  - A: 30-day free exchange (exchange-first; not described as "refund"). One exchange per order, no fault required. The existing returns page summary says "exchange-first handling".
  - Evidence: `HBAG-offer.md` §3 Guarantees; `site-content.generated.json` policies.returns.summary.

- Q: What payment methods are accepted?
  - A: Card payment only via Axerve (Italian payment gateway). No Apple Pay, Google Pay, or PayPal. The worldclass scan noted wallet payment as a separate out-of-scope gap. Trust copy must say "Secure checkout" only — do not name any specific processor. Note: `shop.json` `billingProvider: "stripe"` is stale; actual processor confirmed via `apps/caryina/src/app/api/checkout-session/route.ts` which imports `@acme/axerve`.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts` (imports `@acme/axerve`, calls `callPayment`); `CheckoutClient.client.tsx` (custom CardForm, no wallet entries).

- Q: Should the trust strip link to the /shipping and /returns pages?
  - A: Yes — linking to the policy pages is the correct pattern. It satisfies users who want more detail without cluttering the PDP. Each trust item can be a link or have a link inline. This is both accessible and consistent with how major e-commerce PDPs handle policy references.
  - Evidence: `apps/caryina/src/app/[lang]/shipping/page.tsx` and `returns/page.tsx` both exist as live routes.

- Q: What UI pattern — trust strip, icon+text row, or accordion?
  - A: Inline icon + text row (horizontal on desktop, vertical stacked on mobile). An accordion or collapsible adds interaction complexity and hides content by default — not desirable when the goal is immediate trust signal at the moment of decision. The chosen pattern: a small `<ul>` with 3–4 items, each an icon (SVG) + short text, rendered below the Add to Cart button and above the proof bullets section. No accordion. Brand personality ("sophisticated, curated") means icons should be minimal — single-stroke SVG, not emoji or filled icons.
  - Inferred from: brand dossier personality traits; standard e-commerce conversion pattern; simplicity constraint (no new interactive dependencies).

- Q: What delivery timeframe is accurate to state?
  - Status: Partially resolved — see Open question below. The current repo policy copy (`site-content.generated.json` line 181) explicitly says "Delivery windows are shown at checkout" — meaning no specific timeframe is currently committed to in any public-facing copy. Introducing a specific timeframe in the trust strip is a new, stronger claim not currently asserted anywhere in the codebase. The DHL shipping provider (`shop.json`) implies EU delivery of roughly 3–5 business days from Italy; "2–5 business days" is consistent with this but is unverified by an operator-confirmed SLA. The default assumption for build is to use a qualified form: "Usually ships in 2–5 business days (EU)" with a link to the /shipping page for detail. Whether to commit to a specific timeframe at all is an operator decision — see Open question below.
  - Evidence: `shop.json` `shippingProviders: ["dhl"]`; `site-content.generated.json` line 181 (existing policy copy defers timeframe to checkout).

- Q: How should the StickyCheckoutBar be updated?
  - A: Add a single short line beneath the price + button area — e.g., "Free exchange within 30 days". This is a minimal addition that requires: (a) a new optional `trustLine` prop on `StickyCheckoutBar`, (b) conditional rendering of a `<p>` below the main row. The sticky bar is already constrained in height (mobile) — one line of fine print is the maximum safe addition without layout testing.
  - Inferred from: existing component layout (`StickyCheckoutBar.client.tsx` lines 40–43); mobile height constraint.

- Q: Should payment method icons be included?
  - A: Not at this stage. The checkout uses Axerve (card-only, no wallets). Showing card brand icons (Visa, MC, Amex) adds implementation complexity for limited trust value when the real gap is return/delivery clarity. A "Secure checkout" lock icon + text is sufficient and honest for the current checkout setup. Payment icon expansion deferred until wallet payments are implemented.
  - Inferred from: scope of this feature; card-only checkout (Axerve, no wallets); wallet payments are a separate out-of-scope gap per worldclass scan.

### Open (Operator Input Required)

- Q: What exact delivery timeframe copy should be used for non-EU orders (UK, US, international)?
  - Why operator input is required: DHL international delivery from Italy varies significantly (5–10 business days to US, 3–5 to UK). The offer design notes US duty disclosure is required. An exact copy claim for non-EU needs either operator confirmation of the tested range or a decision to show EU-only at launch.
  - Decision impacted: the `trustStrip.delivery` string in the content packet.
  - Decision owner: Pete
  - Default assumption + risk: Use "Usually ships in 2–5 business days (EU)" — EU-qualified, consistent with the safer position elsewhere in this document. Risk: non-EU buyers will need to follow the /shipping link for their delivery estimate. This is acceptable; the trust strip links to /shipping for full detail. Non-EU delivery copy can be added post-launch when real order data is available. Do not use an unqualified "Ships in 2–5 business days" claim — that formulation is internally inconsistent with acknowledging the non-EU uncertainty.

---

## Confidence Inputs

- **Implementation:** 92%
  - Evidence: Entry points confirmed, file locations confirmed, component structure fully read. The change is a new component + content key addition + existing component prop extension. Zero platform-level changes.
  - What raises to >=80: Already above. What raises to >=90: Confirmed (>90). Lowered 8 points for the open delivery timeframe copy question; once Pete confirms the non-EU copy or accepts the default, this reaches 95%.

- **Approach:** 88%
  - Evidence: The inline icon+text row pattern is standard across e-commerce PDPs. The StickyCheckoutBar one-line addition is minimal. Content flowing through `contentPacket.ts` is consistent with existing patterns. No novel architecture.
  - What raises to >=80: Already above. What raises to >=90: Confirm mobile layout behaviour of trust strip (1–2 item widths at 375px) before shipping. A smoke test on dev confirms layout.

- **Impact:** 80%
  - Evidence: Trust cues near CTA are a documented major-gap abandonment driver (worldclass scan). At €89–€99 with a 3–7 day deliberation window and TikTok/Instagram as the primary inbound path, a return visit to a trust-cue-free PDP increases abandonment probability. The change addresses a verified gap.
  - What raises to >=80: Already at floor. What raises to >=90: GA4 confirmation of checkout initiation rate improvement post-launch (but GA4 is not yet configured — this is a trailing signal only).

- **Delivery-Readiness:** 90%
  - Evidence: All content sources confirmed. All file paths confirmed. No missing data. One open question (non-EU delivery copy) has a safe default assumption. No external API dependencies.
  - What raises to >=80: Already above. What raises to >=90: Already at 90. Only dependency is Pete confirming or accepting the default delivery copy assumption.

- **Testability:** 78%
  - Evidence: The trust strip is a server component — straightforward to Jest-render with mocked content packet. StickyCheckoutBar requires IntersectionObserver mock (standard Jest pattern). No existing PDP or StickyCheckoutBar tests; test scaffolding must be written from scratch.
  - What raises to >=80: Writing the IntersectionObserver mock and a basic StickyCheckoutBar render test. What raises to >=90: Full PDP page render test verifying trust strip items (3 items) and their link hrefs.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Trust copy makes unsupported material claims | Low | High — false advertising risk | All copy constrained to confirmed offer commitments; "Designed in Positano" not "Made in Italy"; 30-day exchange not "return". Note: the HBAG content packet linter (`scripts/src/startup-loop/lint-website-content-packet.ts`) checks packet structure and forbidden terms only — it does not validate the `trustStrip` JSON values specifically. Manual review of trust copy strings during TASK-01 is required; the linter is not a substitute for human claim verification. |
| StickyCheckoutBar layout breaks on narrow mobile (320px) with trust line added | Low-Medium | Medium — visual regression on older devices | Trust line is a single short text node; use `text-xs` class (consistent with other small-text patterns); verify on 375px viewport in dev. |
| Delivery timeframe stated as "2–5 business days" is inaccurate for non-EU buyers | Medium | Medium — customer trust damage if under-delivery occurs | Default to EU-specific framing ("for EU orders") or add link to shipping page for detail. This is explicitly called out as the one open question. |
| `site-content.generated.json` direct edit gets overwritten by materializer re-run | Low (materializer not running automatically) | Low — reversion risk | Update `generatedAt` value to signal manual extension (JSON does not support comments — no comment can be added). Plan task should note this risk; longer term the materializer should be updated to produce `trustStrip` natively. |
| TypeScript interface extension causes downstream type errors | Very Low | Low | Interface extension is additive and optional (`trustStrip?: ...`). Existing callers unaffected. |

---

## Planning Constraints and Notes

- Must-follow patterns:
  - All copy strings must come from `contentPacket.ts` / `site-content.generated.json`, not hard-coded in components.
  - Tailwind classes only (no CSS modules). Use existing token classes (`text-muted-foreground`, `bg-accent`, brand radius tokens).
  - `data-cy` attribute on trust strip wrapper for testability.
  - Brand constraint: no "Made in Italy", no "Birkin". Copy must be claim-safe per content packet source ledger.
  - `"use client"` boundary: trust strip on PDP is server-renderable. Do not make it a client component without reason.
- Rollout/rollback:
  - No feature flag needed — this is a pure additive render change. Rollback = revert the 4 changed files.
- Observability:
  - GA4 not yet configured for HBAG. No analytics hooks to add at this stage. Trust strip change is observable via qualitative support feedback and eventually checkout funnel metrics once GA4 is set up.

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Add `trustStrip` block to content packet and generated JSON** — Add `productPage.trustStrip` key to `SiteContentPayload` interface and `site-content.generated.json` with canonical copy strings (delivery, exchange, origin, secure checkout). Add `getTrustStripContent(locale)` to `contentPacket.ts`.

2. **TASK-02: Create `PdpTrustStrip` server component** — New file `apps/caryina/src/app/[lang]/product/[slug]/PdpTrustStrip.tsx`. Renders 4 items: delivery, exchange window, origin, secure payment. Icon + text per item. Links to `/shipping` and `/returns`. `data-cy="pdp-trust-strip"`.

3. **TASK-03: Wire trust strip into PDP page** — Import and render `<PdpTrustStrip>` in `page.tsx` immediately after `<div data-cy="pdp-checkout">`. Pass `lang` prop.

4. **TASK-04: Extend StickyCheckoutBar with trust line** — Add optional `trustLine?: string` prop to `StickyCheckoutBar`. Render a `<p>` below the price+button row when `trustLine` is provided. Pass from `page.tsx` using exchange window copy from content packet.

5. **TASK-05: Tests** — (a) `StickyCheckoutBar.client.test.tsx`: renders trust line when prop provided; absent when not. (b) `PdpTrustStrip.test.tsx`: renders all 4 trust items; shipping link points to `/[lang]/shipping`.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PDP page entry point and insertion site | Yes | None | No |
| StickyCheckoutBar structure and prop contract | Yes | None | No |
| Content packet interface (`SiteContentPayload`) and reader pattern | Yes | None | No |
| `site-content.generated.json` structure and field locations | Yes | None | No |
| Brand copy constraints (origin claim, words to avoid, return policy framing) | Yes | None | No |
| Payment method accuracy (Axerve/card-only, no wallets; shop.json billingProvider stale) | Yes | None | No |
| Test landscape — existing coverage and gaps | Yes | [Minor] No existing PDP or StickyCheckoutBar tests; test scaffolding required from scratch | No (advisory) |
| Delivery timeframe claim accuracy for non-EU orders | Partial | [Moderate] Open question on non-EU delivery copy; safe default available | No (default assumption documented) |

---

## Evidence Gap Review

### Gaps Addressed

1. **Trust copy source**: Confirmed in `HBAG-content-packet.md` §Reusable Trust Blocks — "30-day exchange window and 90-day hardware support", "Designed in Positano, Italy; manufactured to spec." These are the canonical strings; no new claims need to be invented.
2. **Payment method accuracy**: Confirmed via `apps/caryina/src/app/api/checkout-session/route.ts` (imports `@acme/axerve`) — actual processor is Axerve. `shop.json` `billingProvider: "stripe"` is stale. No wallet payments exist. Trust copy uses "Secure checkout" only — no processor name.
3. **Return policy framing**: Confirmed as exchange-first (not refund) via `HBAG-offer.md` §3 and `/returns` page summary. Copy will say "exchange" not "return" to be accurate.
4. **Brand voice constraint**: Confirmed — "Confident, not apologetic" per brand dossier. Trust copy should state commitments plainly: "Ships in 2–5 business days", "30-day exchange", not "We hope you'll be happy with your order".
5. **Component insertion point**: Confirmed — `page.tsx` lines 101–110 are the purchase area. Trust strip inserts after line 106 (AddToCartButton wrapper div), before the `<section aria-label="Product proof points">` at line 113.
6. **StickyCheckoutBar structure**: Confirmed — 47 lines, simple layout, `trustLine` prop addition is clean and non-breaking.

### Confidence Adjustments

- Implementation reduced from 95 to 92 due to the non-EU delivery copy open question (minor, has safe default).
- Testability at 78 (below 80 floor) noted: the plan should include a task that explicitly writes the IntersectionObserver mock and base StickyCheckoutBar test, ensuring build does not ship without a test gate on the sticky bar trust line.

### Remaining Assumptions

- Delivery timeframe: The existing policy copy defers timeframe to checkout ("Delivery windows are shown at checkout" — `site-content.generated.json` line 181). The trust strip introduces a new, stronger claim not previously asserted anywhere. The default build assumption is to use "Usually ships in 2–5 business days (EU)" — EU-qualified throughout (consistent with the Resolved question and Remaining Assumptions). Pete must confirm this is accurate before the copy goes live. This is documented as an Open question. An unqualified formulation ("Ships in 2–5 business days") must not be used — it would be internally inconsistent and claim-risky for non-EU buyers.
- SVG icons for trust items will be inline single-stroke SVGs using brand token colors (`text-muted-foreground`, `--color-accent`). No icon library dependency added.
- The `site-content.generated.json` direct edit will not be overwritten before the materializer is updated to include the trust strip block natively. JSON does not support comments; the `generatedAt` field value will be updated to signal the manual extension.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `PdpTrustStrip.tsx` renders 4 trust items with correct copy from content packet.
  - `StickyCheckoutBar.client.tsx` renders trust line when prop provided.
  - `page.tsx` wires both.
  - `contentPacket.ts` exports `getTrustStripContent`.
  - `site-content.generated.json` has `productPage.trustStrip` block.
  - Tests pass for trust strip render and sticky bar trust line.
  - `pnpm typecheck && pnpm lint` pass.
- Post-delivery measurement plan: Monitor qualitative support messages for shipping/returns questions post-launch. Once GA4 is configured, track `view_item` → `begin_checkout` funnel conversion rate vs. pre-feature baseline.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan hbag-pdp-trust-cues --auto`
