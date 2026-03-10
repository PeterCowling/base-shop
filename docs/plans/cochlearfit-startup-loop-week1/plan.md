---
Type: Plan
Status: Draft
Domain: HEAD / CochlearFit
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cochlearfit-startup-loop-week1
Fact-Find-Reference: docs/plans/cochlearfit-startup-loop-week1/fact-find.md
Workstream: startup-loop
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-channels, /lp-seo
Business-Unit: HEAD
Overall-confidence: 72%
Confidence-Method: min(Implementation,Approach,Impact) with gating on Delivery-Readiness/Testability
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# CochlearFit (HEAD) Startup Loop - Week 1 Execution Plan

## Objective
Turn the HEAD 90-day outcome contract into Week-1 decision-grade signal by:
1. making the CochlearFit storefront reliably purchasable (catalog, pricing, checkout),
2. instrumenting the funnel and daily KPI reporting,
3. running a capped acquisition experiment with explicit stop/hold rules.

Canonical guardrails live in `docs/business-os/strategy/HEAD/plan.user.md` and must remain enforced.

## Success Criteria (Week-1)
- Storefront renders products consistently across home/shop/PDP/cart/checkout (English + Italian), and cart/variant mapping is correct.
- Checkout reliability evidence exists (>=20 successful test-mode purchases across device/payment mix).
- Daily KPI pack exists and can be updated without manual spreadsheet archaeology.
- A capped acquisition test can run for 7 days with daily CAC/CVR reads and a documented Week-2 recalibration trigger.

## Decision Log
- 2026-02-14: Plan created from `docs/plans/cochlearfit-startup-loop-week1/fact-find.md`.

## Open Decisions (Blockers)
### CF-D01: Week-1 Checkout Architecture
**Question:** Keep `apps/cochlearfit-worker` for Week-1 learning, or converge onto platform checkout primitives now?
- Default: keep `apps/cochlearfit-worker` for Week-1, and treat platform convergence as a parallel/next plan.
- Evidence: `apps/cochlearfit/README.md`, `docs/plans/archive/commerce-core-readiness-plan-archived-2026-02-14.md`

### CF-D02: Italy Pricing + Currency + Stripe Topology
**Question:** Final EUR pricing architecture (single vs bundle/threshold) and which Stripe account owns prices?
- Default: pick a single EUR price point in the observed competitor band, then add bundles only after first signal.
- Evidence: `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`

## Active tasks
- CF-101
- CF-102

## Work Plan

### Phase 0: Unblock Catalog + Source-of-Truth (Launch-Blocking)

#### CF-101: Unify CochlearFit Catalog Contract (Server + Client)
- Type: IMPLEMENT
- Effort: S
- Confidence: 85%
- Execution-Skill: /lp-do-build
- Depends on: -

**Problem:** The runtime catalog path can render empty or inconsistent because server pages use `listCochlearfitProducts()` (file-backed, empty in-repo) while client helpers/tests assume `apps/cochlearfit/src/data/products.ts` (i18n-keyed, non-empty).
- Evidence:
  - `apps/cochlearfit/src/app/[lang]/layout.tsx`
  - `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts`
  - `apps/cochlearfit/src/lib/catalog.ts`
  - `data/shops/cochlearfit/`
  - `apps/cochlearfit/__tests__/pages.test.tsx`

**Acceptance criteria**
- Home/shop/cart/checkout/PDP all receive a non-empty, consistent `products` list in production builds.
- Product fields are consistently treated as i18n keys (or consistently treated as literal strings), with tests matching runtime.
- `generateStaticParams()` for product pages yields correct slugs.

**Validation**
- `pnpm --filter @apps/cochlearfit typecheck`
- `pnpm --filter @apps/cochlearfit lint`
- `pnpm --filter @apps/cochlearfit test -- --testPathPattern=pages`
- Add/adjust targeted tests if needed (TC-CF-101-*).

#### CF-102: Remove Placeholder Catalog Data Risks (Data-Backed Fallback)
- Type: IMPLEMENT
- Effort: S
- Confidence: 80%
- Execution-Skill: /lp-do-build
- Depends on: CF-101

**Goal:** Preserve a long-term path to data-backed catalogs without breaking Week-1. Implement a safe fallback strategy:
- Prefer data-backed catalog if `data/shops/cochlearfit/*` is present and valid.
- Otherwise fall back to the in-repo `apps/cochlearfit/src/data/products.ts` catalog.

**Acceptance criteria**
- When data files are absent, storefront still renders the default product set.
- When data files are present, storefront uses them (for future ops).

**Validation**
- Add unit tests for fallback selection logic (TC-CF-102-01, TC-CF-102-02).

### Phase 1: Pricing + Stripe + Checkout Reliability

#### CF-D03: Week-1 Stripe Operation Mode
- Type: DECISION
- Effort: S
- Confidence: 70%
- Depends on: CF-D01, CF-D02

**Question:** Hosted Stripe Checkout (current worker-style) vs custom UI checkout (platform-core style).
- Evidence: `docs/plans/archive/commerce-core-readiness-plan-archived-2026-02-14.md` (COM-D02)

**Acceptance criteria**
- Decision recorded (ADR or within this plan) with constraints and rollback plan.

#### CF-201: Encode Italy EUR Pricing in a Single Source of Truth
- Type: IMPLEMENT
- Effort: M
- Confidence: 65%
- Execution-Skill: /lp-do-build
- Depends on: CF-D02

**Acceptance criteria**
- Storefront displays EUR pricing consistently across locales.
- Any tax/shipping notes needed for Italy are reflected in policy copy.

**Validation**
- Unit/component tests for `Price` rendering with EUR.
- Manual visual QA via `pnpm --filter @apps/cochlearfit dev`.

#### CF-202: Replace Placeholder Stripe Price IDs
- Type: IMPLEMENT
- Effort: S
- Confidence: 60%
- Execution-Skill: /lp-do-build
- Depends on: CF-D02

**Acceptance criteria**
- No `price_${...}` placeholder IDs remain on the checkout path.
- Stripe price IDs are consistent between storefront and worker (if worker retained).

**Validation**
- Grep guard: ensure no placeholder IDs remain.
- Manual test-mode checkout (see CF-203).

#### CF-203: Checkout Reliability Pack (Manual, Test Mode)
- Type: IMPLEMENT
- Effort: M
- Confidence: 70%
- Execution-Skill: /lp-do-build
- Depends on: CF-201, CF-202, CF-D03

**Acceptance criteria**
- >=20 successful end-to-end test purchases recorded.
- Mix includes:
  - mobile + desktop
  - at least 2 payment method types used in Italy (as supported)
  - at least 2 SKUs/variants
- Payment success rate >=97% is not required at this sample size, but failures are categorized and fixed before running spend.

**Validation**
- Document evidence in a short memo (path to be created during build) and link it from HEAD weekly K/P/C/S.

### Phase 2: Measurement + KPI Packs

#### CF-301: Measurement Instrumentation Fact-Find (Storefront Funnel)
- Type: INVESTIGATE
- Effort: M
- Confidence: 55%
- Execution-Skill: /lp-do-build
- Depends on: CF-101

**Questions**
- What measurement stack is canonical for CochlearFit (GA4, internal analytics, Cloudflare Web Analytics, custom events)?
- What are the required event names/definitions to satisfy HEAD weekly indicators?

**Acceptance criteria**
- Documented event taxonomy (sessions, PDP view, add-to-cart, begin-checkout, purchase) and where each event fires.
- Clear extraction method for daily KPI pack.

#### CF-302: Implement Required Events + Daily KPI Export
- Type: IMPLEMENT
- Effort: M
- Confidence: 60%
- Execution-Skill: /lp-do-build
- Depends on: CF-301

**Acceptance criteria**
- Daily KPI pack can be updated (script or documented manual pull) including:
  - sessions
  - funnel steps
  - orders
  - paid spend (if applicable) and CAC (paid + blended)
  - payment success
  - return/issue reason counts
- KPI pack format is stable enough to support Week-2 recalibration.

**Validation**
- Add at least one integration-ish test that asserts event emission wiring at the component boundary (where feasible).

### Phase 3: Compatibility Guidance + Return-Reason Taxonomy

#### CF-401: Compatibility/Fit Guidance Surface (Customer-Facing)
- Type: IMPLEMENT
- Effort: M
- Confidence: 70%
- Execution-Skill: /lp-do-build
- Depends on: CF-D02

**Acceptance criteria**
- PDP (and/or dedicated page) includes compatibility notes that match the ICP and reduce wrong-buy ambiguity.
- A clear support path exists (email/FAQ/contact) in both locales.

**Validation**
- Visual QA in EN/IT.
- Update/add tests for copy keys presence (similar to existing page tests).

#### CF-402: Return/Issue Reason Taxonomy (Ops)
- Type: IMPLEMENT
- Effort: S
- Confidence: 65%
- Execution-Skill: /lp-do-build
- Depends on: -

**Acceptance criteria**
- A fixed reason-code list exists and is used consistently in the weekly memo.
- First week of returns/issues (even if small) is tagged with 100% coverage.

## Validation Gate (Before Commit)
For code changes under `apps/cochlearfit`:
- `pnpm --filter @apps/cochlearfit typecheck`
- `pnpm --filter @apps/cochlearfit lint`
- Targeted tests only (never unfiltered `pnpm test`):
  - `pnpm --filter @apps/cochlearfit test -- --testPathPattern=pages`
  - plus any new/updated test files for touched modules

## What Would Make This >=90%?
- Decide CF-D01/CF-D02/CF-D03 with concrete Stripe + pricing inputs.
- Implement CF-101 and run the test suite to prove catalog correctness in runtime.
- Produce a first draft of the daily KPI pack script/output format and verify it can be refreshed.

## Next Step
- If you confirm the three decisions (CF-D01/CF-D02/CF-D03), we can move the plan to `Status: Active` and start `/lp-do-build` on CF-101 immediately.
