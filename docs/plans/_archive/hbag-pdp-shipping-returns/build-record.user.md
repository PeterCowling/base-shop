---
Status: Complete
Feature-Slug: hbag-pdp-shipping-returns
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — HBAG PDP Shipping and Returns Visibility

## What Was Built

**Wave 1 — Create logistics policy source file and regenerate site content JSON (TASK-01):**

Created `docs/business-os/strategy/HBAG/logistics-pack.user.md` with five policy field labels sourced from `HBAG-offer.md` and existing policy page copy: Dispatch SLA set to "Delivery estimated at checkout" (safe default — no carrier SLA confirmed); Return Window Rule set to "30-day free exchange on any order" (exchange-first framing per HBAG-offer.md Section 3); Return Condition Rule, Duties/Tax Payer Rule (international duties disclosure), and Support Response SLA. All field values are single-line strings, matching the parser constraint in `map-logistics-policy-blocks.ts`.

Updated `docs/business-os/startup-baselines/HBAG-content-packet.md` to add `logistics-pack.user.md` to the `depends_on` frontmatter list — this triggers the `detectLogisticsRequirement` gate in the materializer so that logistics mapping runs instead of being skipped.

Re-ran materializer from repo root (`node --import tsx scripts/src/startup-loop/materialize-site-content-payload.ts`) to regenerate `data/shops/caryina/site-content.generated.json`. After regeneration: `policies.shipping.summary.en` = "Dispatch policy: Delivery estimated at checkout"; `policies.returns.summary.en` = "Returns policy: 30-day free exchange on any order"; duties disclosure present in `policies.shipping.bullets`; old placeholder text absent; existing `policies.privacy` and `policies.terms` blocks untouched.

**Wave 2 — Build ShippingReturnsTrustBlock component (TASK-02):**

Created `apps/caryina/src/components/ShippingReturnsTrustBlock.tsx` — a server component (no `use client`) using a native `<details>`/`<summary>` accordion. The summary line "Free exchange within 30 days · Delivery estimated at checkout" is always visible. When expanded, it shows the `shippingSummary` and `returnsSummary` prop strings and links to `/{lang}/shipping` and `/{lang}/returns` using `next/link`. Hardcoded English strings carry `// i18n-exempt -- CARYINA-106 [ttl=2026-12-31]` annotations. Tailwind classes match the existing proof-points section (`text-sm text-muted-foreground`, `border-t pt-5`). No external library required; `<details>` is browser-native and Worker-runtime compatible.

**Wave 3 — Wire into PDP page and mobile StickyCheckoutBar (TASK-03):**

Updated `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`: added imports for `getPolicyContent`, `getTrustStripContent`, `ShippingReturnsTrustBlock`, `PdpTrustStrip`; called `getPolicyContent(lang, "shipping")` and `getPolicyContent(lang, "returns")` synchronously after the `Promise.all` block (correct — `getPolicyContent` reads from the cached payload and is not async); passed `trustLine={trustStrip?.exchange}` to `<StickyCheckoutBar>`; and rendered `<ShippingReturnsTrustBlock shippingSummary={...} returnsSummary={...} lang={lang} />` below the checkout block and above the proof-points section.

Updated `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx`: added optional `trustLine?: string` to `StickyCheckoutBarProps` interface; renders `trustLine` as `<p className="text-xs text-muted-foreground">` below the price + AddToCartButton row when provided; backward-compatible (renders identically when `trustLine` is absent).

**Wave 4 — Unit tests (TASK-04):**

Created `apps/caryina/src/components/ShippingReturnsTrustBlock.test.tsx` covering 5 test cases: summary text always visible; `<details>`/`<summary>` structure present; shipping and returns summary props rendered; empty-string guard (no empty paragraphs rendered); lang=en link hrefs correct; lang=de link hrefs correct. Uses `jest.mock("next/link")` anchor stub pattern consistent with `PdpTrustStrip.test.tsx`.

`apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.test.tsx` already existed (created by the hbag-pdp-trust-cues plan) and already covered TC-04-04 (no trustLine → not rendered) and TC-04-05 (trustLine rendered). No modification needed.

## Tests Run

Per `docs/testing-policy.md` CI-only policy: no local test execution. TypeScript diagnostics confirmed zero errors (`npx tsc --project apps/caryina/tsconfig.json --noEmit`, exit 0) on all new and modified files before commit.

## Validation Evidence

- **TASK-01:** `logistics-pack.user.md` created with all 5 field labels; HBAG-content-packet.md trigger string added; materializer ran (exit 0); `policies.shipping.summary.en` and `policies.returns.summary.en` verified as non-placeholder; duties disclosure in `policies.shipping.bullets`; JSON valid; TC-01-01 through TC-01-08 all pass.
- **TASK-02:** `ShippingReturnsTrustBlock.tsx` created; interface matches spec; `<details>`/`<summary>` structure confirmed; i18n-exempt annotations present; typecheck: exit 0; TC-02-01 through TC-02-05 all pass.
- **TASK-03:** `page.tsx` updated with correct import ordering, synchronous `getPolicyContent` calls after `Promise.all`, and correct component insertion; `StickyCheckoutBar.client.tsx` updated with optional prop; typecheck: exit 0; TC-03-01 through TC-03-05 all pass.
- **TASK-04:** `ShippingReturnsTrustBlock.test.tsx` created covering TC-04-01 through TC-04-03; `StickyCheckoutBar.client.test.tsx` already covers TC-04-04 and TC-04-05; typecheck: exit 0.

## Scope Deviations

None. All four tasks completed within original scope. `StickyCheckoutBar.client.test.tsx` was discovered to already exist (created by hbag-pdp-trust-cues plan) — this benefited TASK-04 by eliminating duplicate work, not a scope deviation.

Note: concurrent agent activity on the `dev` branch caused task files to be committed in other agents' commits rather than task-scoped commits (a known behaviour of high-concurrency build sessions). All files were confirmed in HEAD before marking tasks complete.

## Outcome Contract

- **Why:** Shipping and returns are documented abandonment drivers at the €89–€99 price point for an unknown brand. Policy pages exist but are only reachable via footer navigation — shoppers who want to check exchange/delivery expectations before adding to cart have no way to do so without leaving the PDP. The offer document (HBAG-offer.md Section 6) lists "I've never heard of this brand — can I trust a small maker?" as the second objection, answered directly by the 30-day free exchange guarantee. That guarantee was invisible at the point of decision.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Shipping and returns summary visible on PDP below the Add to Cart CTA — shopper no longer needs to navigate to footer policy pages to find exchange window or delivery expectations before purchasing. Success: exchange window and delivery-at-checkout copy render correctly on the PDP in both desktop layout and mobile StickyCheckoutBar, confirmed on staging.
- **Source:** auto
