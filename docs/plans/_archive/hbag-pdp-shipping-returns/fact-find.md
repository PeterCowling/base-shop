---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-pdp-shipping-returns
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-pdp-shipping-returns/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260228-0005
Trigger-Why: Shipping and returns are documented abandonment drivers at the €89–€99 price point for an unknown brand. Policy pages exist but are only reachable via footer navigation — shoppers who want to check exchange/delivery expectations before adding to cart have no way to do so without leaving the PDP.
Trigger-Intended-Outcome: operational — shipping and returns summary visible on PDP near the Add to Cart CTA so shoppers can confirm exchange window and delivery expectations without navigating away
---

# HBAG PDP Shipping & Returns Visibility Fact-Find Brief

## Scope

### Summary

The Caryina product detail page (PDP) currently shows price, stock badge, and Add to Cart button — with no shipping timeframe, no returns summary, and no link to the shipping or returns policy anywhere near the purchase area. The `/shipping` and `/returns` policy pages exist but are only accessible via footer navigation. This creates a decision gap: shoppers considering a €89–€99 item who want to check returns or shipping before committing must leave the PDP to find out — or simply abandon.

The task is to add a condensed shipping and returns summary below or near the Add to Cart CTA, either as an inline trust strip or a collapsible accordion, with copy sourced from the existing policy content and offer document trust blocks.

### Goals

- Surface shipping timeframe and returns window on the PDP without requiring the shopper to navigate away
- Use copy consistent with the canonical offer document trust blocks (30-day exchange, 90-day hardware coverage)
- Maintain the compact PDP layout — add density, not visual clutter
- Optionally add a brief trust signal to the mobile StickyCheckoutBar

### Non-goals

- Rewriting or expanding the `/shipping` and `/returns` policy pages (separate concern)
- Updating the `site-content.generated.json` placeholder content broadly — only the PDP-specific trust copy is in scope
- Adding payment method logos or warranty badge icons (addressed under IDEA-DISPATCH-20260228-0007)
- Internationalisation of the new block beyond `en` for launch (existing i18n-exempt pattern in footer applies)

### Constraints & Assumptions

- Constraints:
  - `contentPacket.ts` reads `data/shops/caryina/site-content.generated.json` at runtime via `readPayload()`. The PDP already calls `getProductPageContent(locale)` to get `proofHeading` and `proofBullets`. Any structured shipping/returns copy consumed at PDP level should either extend this contract or be hardcoded with an i18n-exempt annotation for launch.
  - `getPolicyContent(locale, 'shipping')` and `getPolicyContent(locale, 'returns')` already exist and return `{ title, summary, bullets, notice }` — these can be called in the server component `page.tsx` without new data-fetching infrastructure.
  - Copy constraint from HBAG-offer.md: "no luxury, premium, exclusive, statement piece, must-have, or turn heads" — show craft, don't claim it. Trust copy must match this voice register.
  - Do not use "Made in Italy" — only "Designed in Italy/Positano".
  - US duty disclosure is required if surfacing shipping copy to US buyers. At launch, a brief disclaimer ("International duties may apply") is sufficient at PDP level.
  - The `StickyCheckoutBar` is a client component (`"use client"`). Any trust signal added there must be static/prop-driven — no additional async fetch inside the client.
- Assumptions:
  - The generated JSON `policies.shipping.summary` and `policies.returns.summary` fields are currently placeholder text and do not match the offer document trust blocks. The plan must include a step to update the generated JSON with real copy (or source directly from the content packet).
  - i18n-exempt annotation for launch is acceptable (consistent with existing `// i18n-exempt -- CARYINA-103` pattern in SiteFooter.tsx).
  - No new npm packages are needed — the accordion pattern can be implemented with native HTML `<details>`/`<summary>` or a simple Tailwind-styled chevron toggle, consistent with the existing component style.

## Outcome Contract

- **Why:** Shipping and returns are documented abandonment drivers at the €89–€99 price point for an unknown brand. Policy pages exist but are only reachable via footer navigation — shoppers who want to check exchange/delivery expectations before adding to cart have no way to do so without leaving the PDP. The offer document (HBAG-offer.md Section 6) lists "I've never heard of this brand — can I trust a small maker?" as the second objection, answered directly by the 30-day free exchange guarantee. That guarantee is currently invisible at the point of decision.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Shipping and returns summary visible on PDP below the Add to Cart CTA — shopper no longer needs to navigate to footer policy pages to find exchange window or delivery expectations before purchasing. Success: exchange window and delivery-at-checkout copy render correctly on the PDP in both desktop layout and mobile StickyCheckoutBar, confirmed on staging.
- **Source:** auto

## Access Declarations

None — all evidence read from local repository files and the `data/shops/caryina/site-content.generated.json` data file. No external API calls required.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP server component; renders the full purchase area; calls `getProductPageContent()`, `getPolicyContent()` is NOT currently called here
- `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — mobile sticky bar client component; renders price + AddToCartButton only; no trust signal

### Key Modules / Files

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP layout; the `<div className="space-y-6 md:sticky md:top-6">` block (lines 92–129) is the insert zone for the trust block, after `<div data-cy="pdp-checkout">` and before the proof points `<section>`
- `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — mobile bar; current layout is a single-row flex with price left and AddToCartButton right; a second small text row could be added below
- `apps/caryina/src/lib/contentPacket.ts` — `getPolicyContent(locale, kind)` returns `{ title, summary, bullets, notice }` for shipping and returns; function is already exported and can be called from the server component
- `apps/caryina/src/components/PolicyPage.tsx` — renders policy pages; shows the shape of the existing policy content (title + summary + bullets + notice)
- `apps/caryina/src/components/SiteFooter.tsx` — shows the existing i18n-exempt annotation pattern; links to `/returns` and `/shipping` from footer only
- `data/shops/caryina/site-content.generated.json` — `policies.shipping` and `policies.returns` keys contain the policy data; currently placeholder content (summary/bullets are placeholder startup-loop text, not real offer copy)
- `docs/business-os/startup-baselines/HBAG-content-packet.md` — canonical source: "30-day exchange window and 90-day hardware support" in Reusable Trust Blocks (line 101); this is the authoritative condensed copy
- `docs/business-os/startup-baselines/HBAG-offer.md` — Section 6 Objection Map confirms the exact trust language: "30-day free exchange on any order — wrong colour, changed mind, doesn't feel right; one exchange per order, no fault required" and "90-day hardware guarantee: if clip or closure hardware fails within 90 days of normal use, replacement at no cost"; Section 3 confirms "Proactive duty disclosure for US buyers" as a requirement

### Patterns & Conventions Observed

- **Server async component data-fetch pattern**: PDP already calls multiple async functions in `Promise.all([...])` — adding `getPolicyContent(lang, 'shipping')` and `getPolicyContent(lang, 'returns')` fits this pattern exactly; no new infrastructure needed — evidence: `page.tsx` lines 59–63
- **Proof points section pattern**: The existing `<section aria-label="Product proof points">` (lines 113–128 in page.tsx) uses a heading + bullet list with `<span>` dot markers — the new trust block can follow the same pattern for inline, or use an accordion variant
- **i18n-exempt annotation**: `SiteFooter.tsx` line 4 shows `// i18n-exempt -- CARYINA-103 [ttl=2026-12-31]`; the new block should carry the same annotation
- **Tailwind utility classes**: component uses `text-sm text-muted-foreground`, `border-t pt-5`, `space-y-2`, `flex items-start gap-2` — new block should be consistent
- **No external UI library for accordion**: no Radix, Headless UI, or other accordion library is present in caryina; native `<details>`/`<summary>` or Tailwind-only chevron toggle is the appropriate approach

### Data & Contracts

- Types/schemas/events:
  - `PolicyCopy` interface in `contentPacket.ts`: `{ title: LocalizedText; summary: LocalizedText; bullets: LocalizedText[]; notice?: LocalizedText }` — fully typed
  - `getPolicyContent(locale, kind)` returns `{ title: string; summary: string; bullets: string[]; notice: string | null }` after locale resolution — clean, no changes needed
  - No new types needed for the PDP trust block; the extracted fields are plain strings
- Persistence:
  - `data/shops/caryina/site-content.generated.json` is the runtime source; the `policies.shipping.summary.en` and `policies.returns.summary.en` fields need updating from placeholder text to real offer copy
  - The content packet `docs/business-os/startup-baselines/HBAG-content-packet.md` is the upstream source of truth — the generated JSON should be updated to match it
- API/contracts:
  - None — all data is statically read at build/request time from local JSON; no API calls involved

### Dependency & Impact Map

- Upstream dependencies:
  - `data/shops/caryina/site-content.generated.json` must have correct shipping/returns summary text before the component can display real copy
  - `apps/caryina/src/lib/contentPacket.ts` exports `getPolicyContent()` — already works, no changes needed
- Downstream dependents:
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — modified to call `getPolicyContent` and render new block
  - `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — optionally modified to accept and render a `trustLine` prop
  - No other components consume the PDP directly; blast radius is tightly contained to this route
- Likely blast radius:
  - Minimal — server component change in a route-level file; client StickyCheckoutBar change only if trust line is added; no shared component library touched
  - The `data/shops/caryina/site-content.generated.json` update affects shipping and returns policy pages too — they will display improved copy as a side effect (positive)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (apps/caryina/jest.config.cjs using `@acme/config/jest.preset.cjs`)
- Commands: Tests run in CI only (repo testing policy: `docs/testing-policy.md`). Push changes and monitor via `gh run watch`. Local gates: `pnpm typecheck && pnpm lint` only.
- CI integration: yes (via reusable-app.yml)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| StockBadge | Unit | `src/components/catalog/StockBadge.test.tsx` | Stock states covered thoroughly |
| CheckoutClient | Unit | `src/app/[lang]/checkout/CheckoutClient.test.tsx` | Cart + form validation; no PDP concern |
| ProductGallery | Unit | `src/components/catalog/ProductGallery.client.test.tsx` | Gallery rendering |
| Admin API routes | Unit | `src/app/admin/api/*/route.test.ts` | API handler coverage |
| Cart/checkout API | Unit | `src/app/api/*/route.test.ts` | Cart state; checkout session |

#### Coverage Gaps

- Untested paths:
  - `page.tsx` PDP server component: no tests exist at all for the PDP route (server component rendering with policy content) — this is a gap that a new test should address
  - `StickyCheckoutBar.client.tsx`: no existing tests; if a trust line prop is added, a unit test for visibility + trust line rendering should be added
  - `getPolicyContent()` in `contentPacket.ts`: not directly tested in isolation (test coverage for contentPacket.ts is absent)
- Extinct tests: None identified

#### Testability Assessment

- Easy to test:
  - New trust block rendering in the PDP: can mock `contentPacket` module and assert the returned text is in the DOM
  - StickyCheckoutBar trust line: can pass prop and assert rendering
- Hard to test:
  - The accordion open/close interaction: `<details>`/`<summary>` is browser-native and JS-free; the open/close state change is straightforward to assert with fireEvent in RTL if needed
- Test seams needed:
  - `contentPacket.ts` will need to be mockable in PDP tests — standard `jest.mock('@/lib/contentPacket')` pattern

#### Recommended Test Approach

- Unit tests for: new `ShippingReturnsTrustBlock` component (or inline section) — assert summary text and link render given mocked policy content
- Unit tests for: `StickyCheckoutBar` trust line prop rendering
- Integration tests for: not needed; trust block is static rendering
- E2E tests for: not required for launch; accordion open/close is low-risk

### Recent Git History (Targeted)

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — last touched in commit `88d4ae88ca` (feat: TASK-10+11 — AddToCartButton, /cart page, checkout-session API); StickyCheckoutBar added alongside AddToCartButton at that time
- `a2216404b5` — Wave 1: Worker build config, stock badge added; PDP layout established
- No churn on PDP layout since initial build — low merge-conflict risk for new additions

## Questions

### Resolved

- Q: Does `getPolicyContent()` already exist and return the right shape for PDP use?
  - A: Yes. `apps/caryina/src/lib/contentPacket.ts` exports `getPolicyContent(locale, kind)` returning `{ title, summary, bullets, notice }`. It reads from the generated JSON and resolves locale. No changes needed to the function itself.
  - Evidence: `apps/caryina/src/lib/contentPacket.ts` lines 165–176

- Q: What is the authoritative short-form copy for shipping/returns on the PDP?
  - A: From `docs/business-os/startup-baselines/HBAG-content-packet.md` Reusable Trust Blocks: "30-day exchange window and 90-day hardware support." From `HBAG-offer.md` Section 3 Guarantees: "30-day free exchange on any order — wrong colour, changed mind, doesn't feel right; one exchange per order, no fault required" and "90-day hardware guarantee: if clip or closure hardware fails within 90 days, replacement at no cost." For PDP the condensed form is: **Returns: 30-day free exchange. Shipping: timeframe shown at checkout. Duties may apply for international orders.**
  - Evidence: `docs/business-os/startup-baselines/HBAG-content-packet.md` line 101; `docs/business-os/startup-baselines/HBAG-offer.md` Section 3 and Section 6

- Q: Is the generated JSON shipping/returns content currently correct/usable?
  - A: No. Current content in `data/shops/caryina/site-content.generated.json` under `policies.shipping` and `policies.returns` is placeholder startup-loop boilerplate (e.g., "Shipping windows and tracking availability depend on destination and fulfillment mode"; "Launch orders include exchange-first handling and hardware support coverage"). These do not match the canonical offer trust language. The plan must include a content update task.
  - Evidence: `data/shops/caryina/site-content.generated.json` policies block (read directly)

- Q: Is shipping timeframe available?
  - A: Not precisely specified anywhere in the content or offer documents. The shipping page states "Delivery windows are shown at checkout" — which is the honest position (depends on destination and Poste Italiane vs. courier). The PDP should mirror this: "Delivery estimated at checkout" rather than quoting a specific day range. This avoids a false promise.
  - Evidence: `data/shops/caryina/site-content.generated.json` `policies.shipping.bullets[0]`; `HBAG-offer.md` objection map: US duty disclosure is operator-confirmed as required

- Q: Which component pattern — inline trust strip or accordion — is appropriate?
  - A: **Recommendation: collapsible accordion using native HTML `<details>`/`<summary>`**, with a one-line summary always visible ("Free exchange within 30 days · Delivery estimated at checkout") and the expanded state revealing both policy summaries + links to the full pages. Rationale: (1) no JS dependency (works with static export); (2) consistent with the app's no-external-UI-library approach; (3) keeps the PDP compact by default; (4) progressive disclosure matches the €89–€99 considered-purchase buyer who will want details if uncertain. An inline strip is simpler but cannot fit both shipping and returns context in one line without truncation at narrow viewports.
  - Evidence: pattern derived from existing component conventions; no accordion library in `apps/caryina`

- Q: Should the StickyCheckoutBar be updated?
  - A: Yes, with a minimal trust line. The mobile bar currently shows price + AddToCartButton in a single flex row. Adding a `trustLine?: string` prop that renders as a small secondary row below (e.g., "Free exchange · Returns within 30 days") is low-risk and addresses the mobile CTA trust gap. The prop is optional to keep the component backwards-compatible.
  - Evidence: `StickyCheckoutBar.client.tsx` — current layout; no test file for this component, so no existing test would break

- Q: Is i18n required at launch?
  - A: No. Consistent with the `// i18n-exempt -- CARYINA-103 [ttl=2026-12-31]` pattern already used in `SiteFooter.tsx`. The trust block should carry the same annotation with a new CARYINA ticket reference.
  - Evidence: `apps/caryina/src/components/SiteFooter.tsx` lines 4–5

### Open (Operator Input Required)

- Q: Is the exact shipping carrier / delivery timeframe known, or should the PDP say "Delivery estimated at checkout" only?
  - Why operator input is required: The shipping carrier and transit times have not been confirmed in any document (TASK-02 supply chain confirmation was listed as a blocker in HBAG-offer.md). The generated JSON explicitly says "Delivery windows are shown at checkout."
  - Decision impacted: Whether the trust block can include a specific timeframe (e.g. "3–7 business days to EU") or must use the checkout-deferred form.
  - Decision owner: Pete (operator)
  - Default assumption (if any) + risk: Proceed with "Delivery estimated at checkout" — safe, honest, and consistent with current policy page copy. Risk: slightly weaker trust signal than a specific timeframe. Low risk; can be updated once carrier confirmed.

## Confidence Inputs

- Implementation: 90%
  - Evidence: entry points, insert zones, function signatures, data contracts all confirmed. Only the generated JSON content update and the specific StickyCheckoutBar layout decision are left to the build phase. What raises to >=90: already at 90 — confidence is high given all key modules are confirmed; the remaining work is mechanical.
- Approach: 85%
  - Evidence: `<details>`/`<summary>` accordion approach is consistent with the app's no-external-library stance and static export requirements. What raises to >=90: operator confirming the accordion pattern over a flat trust strip (minor preference question).
- Impact: 80%
  - Evidence: documented abandonment driver at this price point; offer document confirms 30-day exchange is a top objection handler; policy pages exist but are not discoverable at point of decision. What raises to >=90: post-launch measurement showing reduced exit rate from PDP, which is a post-build concern.
- Delivery-Readiness: 88%
  - Evidence: all required data-fetching infrastructure exists; component patterns established; i18n-exempt path clear; test plan is concrete. What raises to >=90: confirming shipping timeframe copy preference (open question above).
- Testability: 80%
  - Evidence: Jest + RTL pattern established; mock pattern for contentPacket is standard; `<details>`/`<summary>` is testable without JS. What raises to >=90: a concrete test file plan reviewed before build starts.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Generated JSON placeholder content is displayed instead of real policy copy | High (it's currently placeholder) | Medium — trust block would show boilerplate, not real offer copy | TASK-01 in plan must update `data/shops/caryina/site-content.generated.json` with real copy before the component is wired up |
| Shipping timeframe is a false promise if carrier not confirmed | Medium | Medium — customer expectations set, then missed on delivery | Default to "Delivery estimated at checkout" until TASK-02 supply chain confirmation; open question surfaced to operator |
| US duty disclosure omitted from PDP shipping copy | Medium | Medium — duty complaints can tank new-seller reputation on Etsy | Add "International duties may apply" to the shipping summary line; matches HBAG-offer.md Section 3 proactive disclosure requirement |
| StickyCheckoutBar trust line overcrowds the mobile bar at small viewports | Low | Low | Keep trust line to one line, small type (text-xs); or make it conditional (only show on screens above 360px breakpoint) |
| Native `<details>`/`<summary>` styling differs across browsers | Low | Low — functional fallback works; only visual inconsistency | Test in Safari iOS; use Tailwind reset/utility classes for chevron icon |
| contentPacket.ts cache (`cachedPayload`) may serve old content during hot-reload in dev | Very Low | Very Low (dev-only) | Already an existing caveat; no action needed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Server component data-fetch: extend `Promise.all([...])` in `page.tsx` with `getPolicyContent(lang, 'shipping')` and `getPolicyContent(lang, 'returns')`
  - i18n-exempt annotation: `// i18n-exempt -- CARYINA-NNN [ttl=2026-12-31]` on any hardcoded strings in the new block
  - Component style: `text-sm text-muted-foreground`, `border-t pt-5`, consistent with existing proof-points section
  - No new npm packages
  - Static export compatible: no client-side data fetching in the trust block; `<details>`/`<summary>` works without JS
- Rollout/rollback expectations:
  - No feature flag needed — this is additive UI with no data mutation; rollback is a revert of the PDP page file
  - Generated JSON content update is also easily reverted
- Observability expectations:
  - No analytics hook required at this stage (GA4 events are a post-launch concern for accordion interaction tracking)

## Suggested Task Seeds (Non-binding)

1. TASK-01 (content): Update `data/shops/caryina/site-content.generated.json` — replace placeholder `policies.shipping` and `policies.returns` content with real offer copy sourced from HBAG-content-packet.md and HBAG-offer.md
2. TASK-02 (component): Create `ShippingReturnsTrustBlock` server component (or inline section in `page.tsx`) — accordion using `<details>`/`<summary>`, always-visible summary line, expanded state shows shipping summary + returns summary + links to policy pages
3. TASK-03 (integration): Wire TASK-02 into `page.tsx` — call `getPolicyContent(lang, 'shipping')` and `getPolicyContent(lang, 'returns')` in `Promise.all`; pass data to new block; place below `<div data-cy="pdp-checkout">`
4. TASK-04 (mobile): Update `StickyCheckoutBar.client.tsx` — add optional `trustLine?: string` prop; render as small secondary row below the price+CTA row; pass from `page.tsx`
5. TASK-05 (tests): Add unit tests for `ShippingReturnsTrustBlock` rendering + `StickyCheckoutBar` trust line prop

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PDP entry point (`page.tsx`) — current structure | Yes | None | No |
| `getPolicyContent()` contract and return shape | Yes | None | No |
| Generated JSON current content accuracy | Yes | [Missing data dependency] [Moderate]: `policies.shipping.summary` and `policies.returns.summary` are placeholder text — real copy must be written before the component can display meaningful content | Yes — TASK-01 addresses this |
| Canonical copy source (content packet + offer doc) | Yes | None | No |
| `StickyCheckoutBar.client.tsx` layout and prop constraints | Yes | None | No |
| i18n-exempt pattern | Yes | None | No |
| Accordion pattern — library and static-export compatibility | Yes | None | No |
| Test landscape — existing tests | Yes | [Missing domain coverage] [Minor]: no test file for `page.tsx` PDP server component or `StickyCheckoutBar`; new tests needed but no extinct tests to reconcile | No (new tests planned in TASK-05) |
| US duty disclosure requirement | Yes | None | No |
| Blast radius — upstream/downstream | Yes | None | No |

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Shipping and returns summary visible on PDP below Add to Cart CTA (desktop + mobile)
  - StickyCheckoutBar shows trust line on mobile
  - Generated JSON policy content updated with real offer copy
  - Unit tests passing for new block
- Post-delivery measurement plan:
  - Manual review on staging: confirm trust block renders with real copy, accordion expands/collapses, links to /shipping and /returns work
  - Post-launch: monitor PDP exit rate (if GA4 funnel is configured) — not a hard gate for this deliverable

## Evidence Gap Review

### Gaps Addressed

- Generated JSON content accuracy: confirmed as placeholder; plan includes explicit content update task
- Shipping timeframe copy: confirmed as checkout-deferred (no specific carrier SLA in any document); open question surfaced to operator with safe default
- US duty disclosure requirement: confirmed from HBAG-offer.md Section 3 and Section 6 objection map
- Accordion vs. inline strip decision: resolved in favour of accordion based on no-library constraint and viewport density reasoning
- StickyCheckoutBar update scope: confirmed as optional but recommended; prop-driven design preserves backwards compatibility

### Confidence Adjustments

- Implementation confidence started at 90% and stayed at 90% — all key modules confirmed
- Approach confidence is 85% (not 90%) due to the open operator question on shipping timeframe copy; safe default exists
- Impact confidence is 80% due to no post-launch measurement baseline yet; this is appropriate for a pre-launch feature

### Remaining Assumptions

- Shipping timeframe will remain checkout-deferred ("Delivery estimated at checkout") unless operator confirms carrier and SLA before build completes
- i18n-exempt annotation is acceptable for launch scope (consistent with existing footer pattern)
- No external accordion library will be introduced; native HTML is sufficient

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (open question on shipping timeframe has a safe default and does not block build)
- Recommended next step: `/lp-do-plan hbag-pdp-shipping-returns --auto`
