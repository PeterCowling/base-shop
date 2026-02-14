---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: HEAD / CochlearFit
Workstream: Mixed
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cochlearfit-startup-loop-week1
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-plan, /lp-channels, /lp-seo
Related-Plan: docs/plans/cochlearfit-startup-loop-week1/plan.md
Business-OS-Integration: on
Business-Unit: HEAD
Card-ID:
---

# CochlearFit (HEAD) Startup Loop - Week 1 Fact-Find Brief

## Scope
### Summary
Run the next startup-loop cycle for the cochlear headband business (Business Unit `HEAD`, brand/tenant: CochlearFit).

The business strategy and 90-day outcome contract are already defined in `docs/business-os/strategy/HEAD/`. The immediate Week-1 objective is to turn those priors into decision-grade signal by shipping a launch-ready storefront and running a capped acquisition test with reliable measurement.

### Goals
- Ship a purchase-ready CochlearFit storefront suitable for Italy launch learning (catalog renders, pricing correct, checkout works end-to-end, translations intact).
- Establish decision-grade measurement: daily sessions, funnel, orders, paid CAC, payment success, and return/issue taxonomy.
- Publish a customer-facing compatibility/fit guidance surface that reduces wrong-buy returns.
- Run a capped Week-1 acquisition experiment that can falsify (or support) the core demand + economics hypotheses.

### Non-goals
- Full platform convergence (migrating CochlearFit onto shared platform cart/checkout) unless it becomes required for day-1 checkout reliability.
- Building an end-to-end PIM/catalog pipeline.
- Broad channel expansion beyond the minimum channels needed for Week-1 learning.

### Constraints & Assumptions
- Constraints:
  - HEAD guardrails are enforced as written (CVR floor, CAC ceiling, returns ceiling).
    - Evidence: `docs/business-os/strategy/HEAD/plan.user.md`
  - Avoid medical efficacy claims; position as accessory/comfort/retention.
    - Evidence: `apps/cochlearfit/i18n/en.json` (terms/policy language)
  - CochlearFit is currently a static-export Next.js app with an external Worker for checkout.
    - Evidence: `apps/cochlearfit/README.md`
- Assumptions:
  - Initial launch geo is Italy.
    - Evidence: `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`
  - Inventory is near-term launch-ready but unit counts and exact date still need confirmation.
    - Evidence: `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md`

## Evidence Audit (Current State)
### Strategy / Loop Artifacts (Business)
- `docs/business-os/strategy/HEAD/plan.user.md` - canonical outcome contract + guardrails.
- `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md` - 90-day forecast (Italy, cochlear headbands).
- `docs/business-os/strategy/HEAD/launch-readiness-action-backlog.user.md` - execution checklist framing.
- `docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md` - top priorities for Week 1.

### Entry Points (Code)
- Storefront routes:
  - `apps/cochlearfit/src/app/[lang]/page.tsx` (home)
  - `apps/cochlearfit/src/app/[lang]/shop/page.tsx` (shop)
  - `apps/cochlearfit/src/app/[lang]/product/[slug]/page.tsx` (PDP)
  - `apps/cochlearfit/src/app/[lang]/cart/page.tsx` (cart)
  - `apps/cochlearfit/src/app/[lang]/checkout/page.tsx` (checkout)
- Storefront runtime wiring:
  - `apps/cochlearfit/src/app/[lang]/layout.tsx` passes `products` into `CartProvider`.
- Catalog sources (currently inconsistent):
  - Server catalog: `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts` reads `data/shops/cochlearfit/{products,variants,inventory}.json`.
  - Client catalog helper: `apps/cochlearfit/src/lib/catalog.ts` reads `apps/cochlearfit/src/data/products.ts`.

### Key Modules / Files
- Product definition (i18n-keyed): `apps/cochlearfit/src/data/products.ts` (USD pricing + placeholder Stripe price IDs).
- UI expects i18n keys for product strings:
  - `apps/cochlearfit/src/components/ProductDetail.tsx` uses `t(product.*)`.
  - `apps/cochlearfit/src/app/[lang]/product/[slug]/page.tsx` uses `t(product.name)` for metadata.
- Data directory for CochlearFit catalog is empty in-repo (currently only `.DS_Store`).
  - Evidence: `data/shops/cochlearfit/`

### Current Gaps (Launch-Blocking)
- Catalog risk: server catalog reads from empty `data/shops/cochlearfit/` which implies product lists can render empty in real runtime (and `CartProvider` will have no variant mapping).
  - Evidence: `apps/cochlearfit/src/app/[lang]/layout.tsx`, `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts`, `data/shops/cochlearfit/`
- i18n contract mismatch risk: server catalog returns localized strings, but components/tests treat product fields as i18n keys.
  - Evidence: `apps/cochlearfit/src/components/ProductDetail.tsx`, `apps/cochlearfit/__tests__/pages.test.tsx`
- Pricing/currency mismatch vs Italy launch: products are currently priced in `USD` in code.
  - Evidence: `apps/cochlearfit/src/data/products.ts` vs `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`
- Stripe integration readiness is currently placeholder-driven in some paths.
  - Evidence: `apps/cochlearfit/src/data/products.ts` builds `stripePriceId: price_${...}`
- Measurement: no obvious analytics instrumentation in `apps/cochlearfit/src` (needs explicit plan).

### Related Plans
- Platform commerce hardening and CochlearFit integration work is already planned (not Week-1 scoped by default):
  - `docs/plans/commerce-core-readiness-fact-find.md`
  - `docs/plans/commerce-core-readiness-plan.md`

### Delivery & Channel Landscape (mixed)
- Audience/recipient:
  - Initial ICP hypothesis: parents/caregivers of children ~6 months-6 years with cochlear implants.
  - Evidence: `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`
- Channel constraints:
  - Week-1 should prioritize channels that allow tight spend caps, high intent, and attribution clarity.
  - Evidence: forecast validation plan section in `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`
- Approvals/owners:
  - Owner: Pete (HEAD plan)
  - Engineering: changes land in `apps/cochlearfit` and potentially `apps/cochlearfit-worker`.
- Compliance constraints:
  - EU distance selling (withdrawal rights) must be correctly represented in policies and post-purchase flow.
  - Evidence: forecast source list + existing terms copy in `apps/cochlearfit/i18n/en.json` and `apps/cochlearfit/i18n/it.json`
- Measurement hooks:
  - Must measure: sessions, funnel events, orders, payment success, CAC, returns/issue reasons.
  - Evidence: `docs/business-os/strategy/HEAD/plan.user.md`

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Italy visitors will buy CochlearFit headbands at the chosen price point (>=0.9% CVR after >=500 sessions) | storefront renders products + checkout works + tracking works | ~EUR 100-300 test spend (cap) | 7 days |
| H2 | Paid CAC can be kept below gross profit/order (and <= guardrails) in Week-1 learning mode | price + margin known + attribution correct | ~EUR 100-300 test spend (cap) | 7 days |
| H3 | Compatibility/fit guidance reduces wrong-buy risk enough to keep returns <=7% (once denominators are valid) | support workflow + taxonomy + copy | primarily ops time | 2-4 weeks |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Competitor pricing and conversion priors exist; no first-party demand signal yet | `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md` | Medium |
| H2 | CPC/CPM priors are directional only; no first-party CAC yet | forecast v2 | Low-Medium |
| H3 | No first-party returns yet; priors exist | forecast v2 + HEAD plan | Low |

#### Recommended Validation Approach
- Quick probes (Week-1):
  - Capped high-intent acquisition test + daily CAC/CVR tracking.
  - Checkout reliability pack (>=20 test orders) before spend.
- Structured tests (Week-2+):
  - Offer test matrix (3 cells) once baseline is stable.
- Deferred validation:
  - Returns-rate guardrail becomes decision-valid only after sufficient shipped volume.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + Testing Library (app), TypeScript.
- Commands:
  - `pnpm --filter @apps/cochlearfit test -- --testPathPattern=pages`
  - `pnpm --filter @apps/cochlearfit typecheck`
  - `pnpm --filter @apps/cochlearfit lint`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Pages and metadata | integration-ish | `apps/cochlearfit/__tests__/pages.test.tsx` | Mocks server catalog; checks page renders and metadata keys |
| Cart, checkout UI | component | `apps/cochlearfit/__tests__/components.checkout.test.tsx` | CartProvider + checkout components |
| Storage and reducers | unit | `apps/cochlearfit/__tests__/cartStorage.test.ts`, `apps/cochlearfit/__tests__/cartReducer.test.ts` | Core cart logic |

#### Coverage Gaps (Planning Inputs)
- Measurement instrumentation has no test coverage yet (no events found).
- End-to-end checkout (real Stripe) is not test-covered; requires manual reliability pack.

#### Testability Assessment
- Easy to test: catalog wiring, i18n-key consistency, cart mapping.
- Hard to test: Stripe checkout end-to-end, payment method mix; requires manual test mode runs.

## Questions
### Open (User Input Needed)
- Q1: What is the intended Week-1 architecture choice: keep `apps/cochlearfit-worker` (fast) vs converge onto platform checkout/gateway (slower, cleaner)?
  - Why it matters: determines where checkout/webhook logic lives and which plan we follow.
  - Decision impacted: technical sequencing and validation commands.
  - Decision owner: Pete
  - Default assumption + risk: default to keeping `apps/cochlearfit-worker` for Week-1 learning; risk is tech debt and contract drift.

- Q2: What is the target currency/pricing for Italy launch (EUR) per SKU/variant, and do we want bundles or free-shipping thresholds?
  - Why it matters: CAC guardrails and contribution model depend on it.
  - Decision impacted: product catalog + Stripe prices.
  - Decision owner: Pete
  - Default assumption + risk: keep a single-SKU price point in the observed EUR 18-29 band; risk is wrong margin/CAC envelope.

- Q3: Stripe account topology: one Stripe account for HEAD only, or shared across tenants?
  - Why it matters: determines price ID mapping and webhook configuration.
  - Decision impacted: env/secrets + worker config.
  - Decision owner: Pete

- Q4: Inventory readiness: exact sellable units by variant and ship SLA (<=48h?) for Italy.
  - Why it matters: spend caps and out-of-stock behavior.
  - Decision owner: Pete

## Confidence Inputs (for /lp-plan)
- Implementation: 80%
  - App/test patterns exist; key gap is catalog/source-of-truth alignment.
- Approach: 70%
  - Week-1 needs speed-to-learning; long-term commerce convergence decisions remain open.
- Impact: 75%
  - Changes touch storefront catalog + checkout flows; existing tests reduce regression risk.
- Delivery-Readiness: 70%
  - Owner is clear, but measurement + Stripe/ops readiness are not yet evidenced.
- Testability: 75%
  - Good unit/component coverage; requires manual reliability pack for Stripe.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Storefront shows empty/incorrect catalog due to server/client source mismatch | High | High | Unify catalog contract and add regression tests |
| EUR/Italy launch conflicts with USD pricing in code | Medium | High | Decide currency/pricing and encode in single source of truth |
| Checkout appears “working” but payment success is low due to payment-method mismatch | Medium | High | Run reliability pack before spend; ship required methods |
| Returns spike due to compatibility confusion | Medium | High | Publish compatibility guidance + tag return reasons day 1 |

## Planning Constraints & Notes
- Keep HEAD guardrails as coded in strategy docs; do not “move goalposts” mid-week.
- Prefer changes that preserve a clean long-term path (e.g., a fallback catalog strategy instead of ripping out future data-driven catalog).

## Suggested Task Seeds (Non-binding)
- Unify CochlearFit catalog source-of-truth and i18n contract.
- Decide Week-1 checkout architecture (worker vs platform).
- Define EUR pricing + Stripe price mapping and remove placeholder IDs.
- Add measurement events required for weekly scorecard.
- Publish compatibility/fit guidance surface and support path.

## Execution Routing Packet
- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-channels`, `/lp-seo`
- Deliverable acceptance package:
  - A buildable, purchase-ready storefront, plus a Week-1 experiment protocol and a daily KPI pack.
- Post-delivery measurement plan:
  - Daily KPI export (sessions, funnel, orders, paid CAC, payment success); weekly K/P/C/S memo.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (non-blocking for planning, blocking for full execution): Stripe + pricing + inventory confirmation.
- Recommended next step: proceed to `/lp-plan` to produce an executable Week-1 plan with DECISION + IMPLEMENT tasks.
