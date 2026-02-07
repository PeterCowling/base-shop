---
Type: Plan
Last-reviewed: 2026-02-05
Status: Active
Domain: Platform / Commerce
Relates-to charter: none
Created: 2026-02-01
Last-updated: 2026-02-03
Relates-to-charter: docs/plans/edge-commerce-standardization-implementation-plan.md
Overall-confidence: 71%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Feature-Slug: commerce-core-readiness
Fact-Find-Reference: docs/plans/commerce-core-readiness-fact-find.md
---

# Commerce Core Readiness Implementation Plan


## Active tasks

No active tasks at this time.

## Summary

This plan addresses the launch-blocking gaps identified in the commerce core readiness fact-find, enabling production-grade checkout for CochlearFit headbands. The work is phased to prioritize checkout correctness (Phase 1), then contract coherence and webhook hardening (Phase 2), followed by CochlearFit integration (Phase 3), and finally platform hardening (Phase 4).

**Key outcomes:**
- Server-side repricing wired into checkout session creation (no price tampering)
- Consistent and idempotent inventory holds tied to checkout intent
- Rate limiting on checkout endpoints (abuse prevention)
- Unified inventory authority contract across all consumers
- Production-grade CochlearFit checkout flow

## Goals

1. **Checkout correctness:** Ensure checkout session creation uses authoritative prices from the catalog, not cart-provided prices
2. **Inventory integrity:** Make inventory holds consistent and idempotent across retries; release holds only on definitive failures
3. **Abuse resistance:** Add rate limiting to checkout endpoints to prevent inventory exhaustion and Stripe abuse
4. **Contract coherence:** Unify inventory authority request/response shapes across CMS, tenant apps, and workers
5. **CochlearFit launch:** Wire CochlearFit to platform primitives for production-grade checkout

### Invariants

- **At most one active hold per checkout intent** (idempotency key uniqueness enforced at DB level)
- **At most one Stripe session per checkout intent** (Stripe idempotency key)
- **Session metadata references the hold** (for webhook reconciliation)
- **Retries converge to the same hold + session pair** (deterministic, not atomic)

## Non-Goals

- Complete fulfillment/warehouse automation
- Long-horizon central inventory routing/allocation (unless required for launch)
- Redesigning PIM/catalog end-to-end
- Full secure-cart storage migration (Phase 4 / post-launch)
- CAPTCHA/fraud review integration (Phase 4 / post-launch)

## Constraints

- **Fail-closed tenancy** for authoritative operations (checkout, webhooks, inventory holds)
- Inventory holds must be transactional and idempotent
- No price tampering (server-side repricing mandatory)
- Edge-to-Node split: Workers route, Node/DB performs authoritative writes
- Must follow edge-commerce-standardization contract (`docs/plans/edge-commerce-standardization-implementation-plan.md`)

---

## Fact-Find Reference

See `docs/plans/commerce-core-readiness-fact-find.md` for:
- Detailed code evidence (file paths, line numbers)
- Gap analysis (Gap 1-6) with proof tests
- Launch readiness assessment
- Decision options and recommendations

---

## Existing System Notes

### Key Modules

| Area | Primary Files | Notes |
|------|---------------|-------|
| Checkout Session | `packages/platform-core/src/checkout/createSession.ts` | Custom UI mode (`ui_mode: "custom"`), uses `buildCheckoutIdempotencyKey` |
| Repricing | `packages/platform-core/src/checkout/reprice.ts` | Exists but **unused** - critical gap |
| Inventory Holds | `packages/platform-core/src/inventoryHolds.ts` | DB-backed, uses ULID per call (not idempotent) |
| Inventory Validation | `packages/platform-core/src/inventoryValidation.ts` | Per-shop and central fallback |
| Webhook Handlers | `packages/platform-core/src/webhookHandlers/*` | Per-tenant routes with hardcoded shop IDs |
| Cart Storage | `packages/platform-core/src/cartStore.ts` | Memory/Redis/DO backends |
| CochlearFit Worker | `apps/cochlearfit-worker/src/index.ts` | Separate Stripe session creation, KV storage |
| Gateway Worker | `apps/checkout-gateway-worker/src/index.ts` | Route allowlist, shop context enforcement |

### Test Coverage (Verified)

- **Checkout session unit tests:** `packages/platform-core/__tests__/checkout-session.test.ts` — PASS (11 tests) (re-verified 2026-02-02)
- **Webhook route tests (tenant):** `apps/cover-me-pretty/__tests__/stripe-webhook.test.ts` — PASS (3 tests) (re-verified 2026-02-02)
- **Inventory tests:** `packages/platform-core/__tests__/inventory.test.ts` — PASS (4 suites, 47 tests) (re-verified 2026-02-02)
- **Known gaps:** repricing is not integrated at the route boundary; sale mode is unit-tested but not exercised via a tenant checkout-session route

---

## Proposed Approach

### Phase 0: Decisions and Invariants (BLOCKER)

Resolve the decisions that gate later phases (and decision-dependent tasks like rate limiting and Stripe topology). Phase 1/2 tasks that do not depend on these decisions can proceed in parallel.

### Phase 1: Checkout Correctness Envelope (Launch-Blocking)

Fix the critical gaps that could cause incorrect pricing or inventory exhaustion:
1. Wire repricing into checkout
2. Make hold creation idempotent (with DB uniqueness constraint)
3. Release holds only on definitive Stripe failures (not unknown-outcome errors)
4. Add rate limiting

### Phase 2: Contract Coherence + Webhook Hardening

Unify contracts and add fail-closed assertions:
1. Unify inventory authority contract (with fail-closed mismatch rules)
2. Add webhook tenant assertion (handle missing shop_id correctly)
3. Add contract tests
4. Add sale mode exercised test

### Phase 3: CochlearFit Integration

Wire CochlearFit to platform primitives:
1. Replace placeholder Stripe Price IDs (with meaningful rollback)
2. Wire to platform cart/checkout APIs
3. Clear cart on payment success

### Phase 4: Platform Hardening (Post-Launch Acceptable)

Production-grade reliability:
1. Central inventory fail-closed enforcement
2. Secure-cart migration
3. Scheduled hold reaper
4. Observability dashboards

---

## Task Summary

| ID | Task | Type | Effort | Confidence | Phase | Depends On |
|----|------|------|--------|------------|-------|------------|
| COM-D01 | CochlearFit Architecture Decision | DECISION | S | 75% | 0 | - |
| COM-D02 | Checkout Mode Decision | DECISION | S | 70% | 0 | - |
| COM-D03 | Inventory Enforcement Policy Decision | DECISION | S | 80% | 0 | - |
| COM-D04 | Gateway Rate Limiting Backend Choice | DECISION | S | 60% | 0 | - |
| COM-D05 | Stripe Account Topology Decision | DECISION | S | 70% | 0 | - |
| COM-101 | Wire repricing into checkout session creation | IMPLEMENT | M | 80% | 1 | - |
| COM-102 | Fix inventory hold idempotency | IMPLEMENT | L | 70% | 1 | COM-101 |
| COM-103 | Release holds on definitive Stripe failures only | IMPLEMENT | S | 80% | 1 | COM-102 |
| COM-104 | Add rate limiting to checkout endpoints | IMPLEMENT | M | 60% | 1 | COM-D04 |
| COM-201 | Unify inventory authority contract | IMPLEMENT | M | 80% | 2 | - |
| COM-202 | Add fail-closed webhook tenant assertion | IMPLEMENT | M | 80% | 2 | - |
| COM-203 | Add contract tests for inventory validate | IMPLEMENT | M | 80% | 2 | COM-201 |
| COM-204 | Add sale mode exercised test | IMPLEMENT | S | 85% | 2 | - |
| COM-301 | Replace CochlearFit placeholder Stripe Price IDs | IMPLEMENT | S | 60% | 3 | COM-D01, COM-D05 |
| COM-302 | Wire CochlearFit to platform cart/checkout APIs | INVESTIGATE | L | 55% | 3 | COM-D01, COM-D02, COM-101, COM-102, COM-201 |
| COM-303 | Clear cart on payment success | IMPLEMENT | S | 80% | 3 | COM-302 |
| COM-401 | Central inventory fail-closed enforcement | IMPLEMENT | M | 80% | 4 | COM-D03 |
| COM-402 | Secure-cart storage migration | INVESTIGATE | L | 55% | 4 | COM-101 |

---

## Detailed Tasks

### Phase 0: Decisions and Invariants

---

#### COM-D01: CochlearFit Architecture Decision

**Type:** DECISION
**Effort:** S
**Affects:** `apps/cochlearfit-worker/`, `apps/cochlearfit/`, platform routing
**Depends on:** -

**Question:** For the headband launch, should CochlearFit converge onto the platform contract (front-door + gateway + node authority), or keep the per-tenant `apps/cochlearfit-worker` approach?

**Options:**
- **Option A (Recommended):** Converge onto platform contract - route CochlearFit API calls through front-door + gateway to node commerce authority; retire `apps/cochlearfit-worker`
- **Option B:** Keep `apps/cochlearfit-worker`, but extract and share catalog + Stripe price ID mapping with the frontend

**Trade-offs:**
- Option A: Higher upfront integration effort; long-term maintenance reduction; single source of truth for checkout logic
- Option B: Faster to ship; keeps webhook/checkout logic fragmented; requires CochlearFit-specific monitoring

**Confidence:**
- Overall: 75%
- Implementation: 85% - Both options match existing repo patterns (shared platform-core vs tenant worker)
- Approach: 75% - CochlearFit supports static-export previews; architecture must respect “static app + external APIs” constraints
- Impact: 80% - Touches routing, webhook topology, and potentially deprecates `apps/cochlearfit-worker/`

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 90%
- **Updated confidence:** 75%
  - Implementation: 85% — Both approaches are already present in-repo; integration seams are known.
  - Approach: 75% — CochlearFit’s preview path uses Next export (`apps/cochlearfit/package.json:8-9`), so we must validate any “converge to platform” choice against static export constraints.
  - Impact: 80% — Scope is broad but bounded to CochlearFit + routing/webhook entrypoints.
- **Investigation performed:**
  - Repo: `apps/cochlearfit/package.json:8-9` (static export preview + Pages preview scripts)
  - Repo: `apps/checkout-gateway-worker/src/index.ts:41-92` (gateway worker routing/headers model that CochlearFit would need to integrate with)
- **Decision / resolution:** No decision made; still requires stakeholder input.
- **Changes to task:** Confidence corrected to match min-of-dimensions + added concrete evidence pointers.

**Acceptance:**
- [ ] Decision documented in ADR format
- [ ] Decision reviewed and signed off by stakeholders
- [ ] Downstream tasks updated based on decision

**Documentation impact:** Create `docs/adr/adr-XX-cochlearfit-checkout-architecture.md`

---

#### COM-D02: Checkout Mode Decision

**Type:** DECISION
**Effort:** S
**Affects:** `packages/platform-core/src/checkout/createSession.ts`, CochlearFit frontend
**Depends on:** -

**Question:** Which checkout UX is desired for headbands: hosted Stripe Checkout (simpler, best for static exports) vs custom Payment Element (`ui_mode: "custom"`, currently used by platform-core)?

**Options:**
- **Option A:** Hosted Stripe Checkout for CochlearFit - add hosted-checkout session creator to platform-core
- **Option B:** Migrate CochlearFit to custom UI - requires more frontend work in CochlearFit app

**Trade-offs:**
- Hosted: Simpler UX, Stripe manages payment form, less frontend code; limited customization
- Custom UI: More control, consistent with platform-core; higher frontend complexity

**Current state:**
- Platform-core uses `ui_mode: "custom"` + `return_url` (see `packages/platform-core/src/checkout/createSession.ts:351-356`)
- CochlearFit worker builds hosted checkout form params with `success_url`/`cancel_url` (see `apps/cochlearfit-worker/src/index.ts:246-251`)

**Confidence:**
- Overall: 70%
- Implementation: 90% - Both modes are supported by Stripe and already used in-repo
- Approach: 70% - Depends on CochlearFit constraints (static export + routing) and desired UX/brand control
- Impact: 80% - Bounded to checkout-session creation + CochlearFit frontend integration

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 85%
- **Updated confidence:** 70%
  - Implementation: 90% — Both hosted and custom UI session creation are already represented (`packages/platform-core/src/checkout/createSession.ts:351-369`, `apps/cochlearfit-worker/src/index.ts:246-257`).
  - Approach: 70% — Requires a stakeholder choice because hosted vs custom changes UX, deployment constraints, and API surface.
  - Impact: 80% — Impacts session creation + redirect/return handling, but is localized once chosen.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/checkout/createSession.ts:351-369` (Stripe session created with `ui_mode: "custom"` and Stripe idempotency key)
  - Repo: `apps/cochlearfit-worker/src/index.ts:246-257` (hosted checkout form params using price IDs)
  - Repo: `apps/cochlearfit/package.json:8-9` (static export preview scripts constrain the frontend)
- **Decision / resolution:** No decision made; still needs stakeholder input on UX + deployment constraints.
- **Changes to task:** Updated confidence to reflect the unresolved approach decision (not an implementation unknown).

**Acceptance:**
- [ ] Decision documented
- [ ] If Option A: platform-core hosted-checkout variant designed
- [ ] If Option B: CochlearFit frontend migration scoped

**Documentation impact:** Update `docs/orders.md` with checkout mode guidance

---

#### COM-D03: Inventory Enforcement Policy Decision

**Type:** DECISION
**Effort:** S
**Affects:** `packages/platform-core/src/inventoryValidation.ts`, shop configuration
**Depends on:** -

**Question:** What should happen if central inventory is unavailable in production?

**Options:**
- **Option A (Recommended):** Fail-closed with per-shop capability flag
  - If shop has `requiresCentralInventory: true`, FAIL in production when central is unavailable
  - If shop has `requiresCentralInventory: false`, fallback to per-shop inventory is acceptable
  - In DEV, fallback is always OK
- **Option B:** Always fail-closed in production (no fallback)
- **Option C:** Always fallback (current behavior - not recommended)

**Recommendation:** Option A provides flexibility per shop while maintaining safety for shops that require central inventory.

**Confidence:**
- Overall: 80%
- Implementation: 90% - Policy can be expressed in `inventoryValidation.ts` with a small config surface
- Approach: 85% - Per-shop capability flag is flexible and aligns with “fail-closed for authoritative ops”
- Impact: 80% - Requires shop settings schema + environment detection but blast radius is bounded

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 90%
- **Updated confidence:** 80%
  - Implementation: 90% — Central inventory fallback is localized to `validateInventoryFromCentral` (`packages/platform-core/src/inventoryValidation.ts:92-110`), so adding policy gates is straightforward.
  - Approach: 85% — Per-shop `requiresCentralInventory` avoids a one-size-fits-all production policy.
  - Impact: 80% — Impacts checkout + validate endpoints indirectly (they call inventory validation); requires schema + env detection.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/inventoryValidation.ts:92-110` (explicit “fallback when central unavailable” behavior)
- **Decision / resolution:** No decision made; Option A remains the recommendation.
- **Changes to task:** Confidence updated to reflect schema/env work still needed (not just “add a flag”).

**Acceptance:**
- [ ] Decision documented
- [ ] Schema for `requiresCentralInventory` flag designed
- [ ] Environment detection (DEV vs PROD) approach defined

**Documentation impact:** Update `docs/inventory-migration.md` with enforcement policy

---

#### COM-D04: Gateway Rate Limiting Backend Choice

**Type:** DECISION
**Effort:** S
**Affects:** `apps/checkout-gateway-worker/`
**Depends on:** -

**Question:** Which rate limiting backend should we use for checkout-gateway-worker?

**Context:** CMS Node rate limiter patterns won't work unchanged in Workers runtime. The gateway runs in Cloudflare Workers which has different runtime, storage, and timer capabilities.

**Clarification (naming):**
- Cloudflare primitives: Durable Objects (DO), KV, D1
- D1 is Cloudflare’s SQL database; generally a poor fit for hot per-request counters vs DO/KV/product limits
- Redis is not a Cloudflare product (in this repo it’s typically Upstash Redis via REST); it can be used from Workers but adds an external dependency

**Options:**
- **Option A: Cloudflare Rate Limiting product** — native, lowest latency, lowest ops burden
- **Option B: Cloudflare Durable Objects** — reliable, stateful, per-PoP, allows granular per-shop limits
- **Option C: KV** — less ideal for strict limits (eventual consistency)

**Recommendation:** Option A (Cloudflare Rate Limiting) for production simplicity; Option B if granular per-shop limits needed (prevents cross-tenant griefing via shared NATs).

**Confidence:**
- Overall: 60%
- Implementation: 80% - All options are implementable
- Approach: 60% - Need to choose backend based on requirements
- Impact: 70% - Affects gateway performance and reliability

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 70%
- **Updated confidence:** 60%
  - Implementation: 80% — Worker is small and can integrate either a product-level limit or a DO-backed limiter.
  - Approach: 60% — Backend choice is a requirements/ops decision (per-shop fairness vs lowest ops burden).
  - Impact: 70% — Needs deployment/config alignment; current worker has no rate limiting and no persistence bindings surfaced in `Env` (`apps/checkout-gateway-worker/src/index.ts:4-8`).
- **Investigation performed:**
  - Repo: `apps/checkout-gateway-worker/src/index.ts:41-92` (no rate limiting; request routing + header enforcement only)
  - Repo: `wrangler.toml:5-19` (existing KV + Durable Object bindings in this repo; DO is already in use for carts/sessions)
  - Repo: `packages/auth/src/rateLimiter.ts:24-115` (existing KV-based limiter pattern; could be reused for a coarse gateway limit)
  - Repo: `packages/platform-core/src/cartStore/cloudflareDurableStore.ts:8-88` (DO patterns + minimal type surface used in-repo)
  - Repo: `apps/cochlearfit-worker/wrangler.toml:1-26` (reference: worker app packaging + bindings live alongside the worker)
  - Repo: `apps/checkout-gateway-worker/` (no `package.json`/`wrangler.toml` today; D04 decision should account for how this worker is built/deployed/tested)
- **Decision / resolution:** No decision made; still needs user/stakeholder input.
- **Changes to task:** Confidence corrected to reflect “needs-input” approach uncertainty (not an implementation unknown).

**Question for user:**
- Which rate limiting backend should we use for checkout-gateway-worker: Cloudflare Rate Limiting product vs Durable Objects vs KV?
- Why it matters: Workers runtime needs an edge-compatible store; DO and KV already exist in-repo (`wrangler.toml:5-19`), but product-level rate limiting is an external Cloudflare configuration dependency.
- Suggested default if you want “in-code + consistent”: Durable Objects (per-IP + per-shop keying).
- Suggested default if you want “lowest ops and you already have it enabled”: Cloudflare Rate Limiting product.

**Acceptance:**
- [ ] User selects backend
- [ ] COM-104 updated with chosen implementation
- [ ] Architecture documented

**Documentation impact:** Update gateway worker README with rate limiting architecture

---

#### COM-D05: Stripe Account Topology Decision

**Type:** DECISION
**Effort:** S
**Affects:** `apps/cochlearfit-worker/`, Stripe Dashboard, webhook configuration
**Depends on:** -

**Question:** What is the Stripe account topology for CochlearFit vs other shops?

**Sub-questions:**
- Shared Stripe account vs per-tenant accounts?
- Where are Price IDs created and managed?
- Can CochlearFit worker credentials be retired or kept separate?

**Options:**
- **Option A:** Single shared Stripe account for all shops - Price IDs centrally managed
- **Option B:** Separate Stripe accounts per tenant - each tenant manages their own Price IDs
- **Option C:** Hybrid - shared account with tenant isolation via metadata

**Impact on:**
- Price ID management strategy (COM-301)
- Webhook secret topology
- Worker retirement feasibility

**Confidence:**
- Overall: 70%
- Implementation: 80% - All options are implementable
- Approach: 70% - Current-state Stripe usage is now better evidenced; target topology still needs stakeholder choice
- Impact: 70% - Affects multiple tasks (price IDs, webhook secrets, worker retirement feasibility)

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 75%
- **Updated confidence:** 70%
  - Implementation: 80% — Any topology can work, but requires coordinating secrets + webhook routing.
  - Approach: 70% — Current state is consistent with a single shared Stripe account: shared env schema (`packages/config/src/env/payments.ts:5-29`) and checkout session creation does not use Connect account scoping (`packages/platform-core/src/checkout/createSession.ts:351-370`).
  - Impact: 70% — Multiple tasks depend on this (COM-301, COM-302); also affects webhook secret handling.
- **Investigation performed:**
  - Repo: `packages/config/src/env/payments.ts:5-29` (single set of Stripe env vars; no per-shop key surface)
  - Repo: `packages/platform-core/src/checkout/createSession.ts:351-370` (Stripe session creation has no `stripeAccount` override)
  - Repo: `packages/platform-core/src/stripeConnect/shopIntegration.ts:83-106` (per-shop connected account config exists, stored under `DATA_ROOT/shops/<shopId>/stripe-connect.json`, but not wired into checkout)
  - Repo: `apps/cover-me-pretty/src/api/stripe-webhook/route.ts:16-25` (shop hard-coded; shared webhook secret)
  - Repo: `apps/cochlearfit-worker/src/index.ts:452-455` (worker verifies signature with `env.STRIPE_WEBHOOK_SECRET`)
  - Repo: `packages/platform-core/src/stripeTenantResolver.ts:62-75` + `packages/platform-core/src/stripeObjectShopMap.ts:112-138` (shared-account webhook routing helpers exist, but require a `prisma.stripeObjectShopMap` model/migration if adopted)
- **Decision / resolution:** No decision made; current state is clearer (shared secrets + no connect scoping in checkout), but target topology still needs stakeholder input.
- **Changes to task:** Raised confidence based on stronger current-state evidence; expanded evidence to include Connect integration and webhook routing helpers.

**Acceptance:**
- [ ] Current Stripe account topology documented
- [ ] Decision made on target topology
- [ ] Migration path defined if topology change needed

**Documentation impact:** Update `docs/orders.md` with Stripe account topology

---

### Phase 1: Checkout Correctness Envelope

---

#### COM-101: Wire repricing into checkout session creation

**Type:** IMPLEMENT
**Effort:** M (3-5 files, existing pattern)
**Affects:**
- `packages/platform-core/src/checkout/createSession.ts`
- `packages/platform-core/src/checkout/reprice.ts`
- `apps/cover-me-pretty/src/api/checkout-session/route.ts`
- `packages/platform-core/__tests__/checkout-session.test.ts`

**Depends on:** - (removed COM-D01 dependency - repricing is platform correctness regardless of architecture)

**Problem:** Gap 3 from fact-find - `repriceCart` exists but is unused. Checkout currently trusts `item.sku.price` from cart state, which could be stale or incorrect.

**Evidence:**
- `packages/platform-core/src/checkout/createSession.ts:63-76`: `buildInventorySnapshot` hashes `line.sku.price` + `line.sku.deposit` into the Stripe idempotency key payload (so cart-stored prices matter today)
- `packages/platform-core/src/checkout/reprice.ts:6-11`: Security comment (“Never trust cart data for pricing”)
- `packages/platform-core/src/checkout/reprice.ts:49-52`: `repriceCart(cart: CartStateSecure, shopId?)` expects secure-cart input (IDs + qty), not hydrated `CartState`

**Implementation:**
1. In `apps/*/api/checkout-session/route.ts`, convert hydrated `CartState` → `CartStateSecure` (IDs + qty + size; preserve `meta`/`rental`)
2. Call `repriceCart(secureCart, shopId)` to fetch authoritative SKU data
3. Re-hydrate the original `CartState` by replacing `line.sku` with the authoritative `sku` returned by repricing (preserve `qty/size/meta/rental`)
4. Compare repriced totals vs cart totals to detect drift and record metric(s)
5. **Create the Stripe session using the repriced cart values** (never stored cart prices)
6. Return `priceChanged: true` when drift is detected (even if proceeding)

**Price Drift Policy:**
- **Threshold:** $0.10 or 1% (not 1 cent - avoids rounding false positives from tax/currency rounding)
- **On drift detected:**
  - `enforce_and_proceed` (recommended for launch): Proceed with repriced values, return `priceChanged: true` so UI can message it
  - `enforce_and_reject`: Return typed 409 `PRICE_CHANGED` when drift exceeds threshold
  - `log_only`: Reprice but don't enforce (for monitoring rollout)

**Confidence:**
- Overall: 80%
- Implementation: 85% - Clear integration seam at checkout-session route; repricing helper already exists
- Approach: 90% - Repricing at the checkout boundary is the correct trust boundary
- Impact: 80% - Cart can be converted to `CartStateSecure` without migrating storage; blast radius limited to session creation path

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 75%
- **Updated confidence:** 80%
  - Implementation: 85% — `repriceCart` already implements SKU lookup + validation (`packages/platform-core/src/checkout/reprice.ts:49-137`); route already owns the checkout boundary (`apps/cover-me-pretty/src/api/checkout-session/route.ts:57-68`, `:203-286`).
  - Approach: 90% — Makes pricing authoritative without requiring Phase 4 secure-cart migration first.
  - Impact: 80% — Conversion is mechanical because `CartLineSecure` is a subset of `CartLine` (`packages/platform-core/src/cart/cartLineSecure.ts:13-36`); only checkout-session path is modified.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/checkout/reprice.ts:49-137` (repricing API + validation behavior)
  - Repo: `packages/platform-core/src/cart/cartLineSecure.ts:13-36` (secure cart line shape)
  - Repo: `apps/cover-me-pretty/src/api/checkout-session/route.ts:57-68` (cart hydration) and `:203-231` (Stripe session creation call site)
- **Decision / resolution:** Enforce repricing inside platform-core checkout session creation (all call sites) using a `CartState` → `CartStateSecure` conversion + re-hydration (no storage migration required for Phase 1).
- **Changes to task:** Updated confidence + updated implementation steps to reflect the secure-cart input requirement.

**What would make this >=90%:**
- Implement + green the repricing/drift tests in `apps/cover-me-pretty/__tests__/checkout-session.test.ts`
- Confirm production product lookup path for `getProductById(shopId, skuId)` is authoritative for the shop (no stale fallback under normal latency)
- Validate drift thresholds against real tax/rounding behavior in Stripe test mode

**Planning validation:**
- Tests run: `pnpm --filter @acme/platform-core test -- checkout-session.test.ts` — PASS (14 tests) (2026-02-03)
- Tests run: `pnpm --filter @apps/cover-me-pretty test -- checkout-session.test.ts` — PASS (2026-02-03)
  - Note: route tests still log `console.error` from hold-stub gaps (`inventoryHolds.reaper`); address as part of COM-102’s stub hardening.
- Lint: `pnpm --filter @acme/platform-core lint` — PASS (2026-02-03)
- Lint: `pnpm --filter @apps/cover-me-pretty lint` — PASS (2026-02-03)
- Lint: `pnpm --filter @acme/template-app lint` — PASS (2026-02-03)

**Acceptance:**
- [x] Checkout session creation reprices cart server-side (no stored cart pricing trust)
- [x] Price drift threshold defaults: `$0.10` or `1%` (configurable)
- [x] Response includes `priceChanged: true` when drift detected but proceeding
- [x] Metric: `cart_reprice_drift_total` recorded on drift
- [x] Policy supports strict rejection via 409 `PRICE_CHANGED`

**Test contract:**
- **TC-01:** Cart contains stale `sku.price` → session uses repriced SKU values and returns `priceChanged: true`
- **TC-02:** Drift ≤ threshold → session proceeds and returns `priceChanged: false` (no user-facing “price changed”)
- **TC-03:** Drift > threshold + `CHECKOUT_REPRICE_POLICY=enforce_and_reject` → route returns 409 `PRICE_CHANGED`
- **TC-04:** Drift detected → `cart_reprice_drift_total` increments with `{ shopId, mode }`
- **Acceptance coverage:** TC-01/TC-03 cover “session uses repriced values”; TC-02/TC-03 cover drift policy; TC-04 covers metrics
- **Test type:** integration (route) + unit (platform-core)
- **Test location:** `apps/cover-me-pretty/__tests__/checkout-session.test.ts` (extend) and `packages/platform-core/__tests__/checkout-session.test.ts` (extend if needed)
- **Run:** `pnpm --filter @apps/cover-me-pretty test -- checkout-session.test.ts && pnpm --filter @acme/platform-core test -- checkout-session.test.ts`

**Rollout/rollback:**
- Policy: `CHECKOUT_REPRICE_POLICY` (`log_only` | `enforce_and_proceed` | `enforce_and_reject`; default: `enforce_and_proceed`)
- Thresholds: `CHECKOUT_REPRICE_DRIFT_ABS` (default: `0.10`) and `CHECKOUT_REPRICE_DRIFT_PCT` (default: `0.01`)
- Rollback: Set `CHECKOUT_REPRICE_POLICY=log_only` (drift still observed + reported; no rejection)

**Documentation impact:** Update `docs/orders.md` with repricing behavior

#### Build Update (2026-02-03)
- **Commit:** `265a971b6b`
- **Implemented:** server-side repricing in `@acme/platform-core` checkout session creation, drift detection + metric, and 409 `PRICE_CHANGED` path (configurable)

**Notes/references:**
- Security comment in `reprice.ts:40-46` explains rationale
- Similar pattern: `findCoupon` is already server-side validated in `createSession.ts:205-214`
- Rejecting at 1-cent drift causes false positives (rounding, tax rounding)

---

#### COM-102: Fix inventory hold idempotency

**Type:** IMPLEMENT
**Effort:** L (6+ files, schema/transaction changes, multiple boundaries)
**Affects:**
- `packages/platform-core/src/inventoryHolds.ts`
- `packages/platform-core/src/inventoryHolds.reaper.ts`
- `packages/platform-core/src/checkout/createSession.ts`
- `apps/cover-me-pretty/src/api/checkout-session/route.ts`
- `packages/platform-core/src/db.ts` (test stub wiring)
- `packages/platform-core/src/db/stubs/index.ts` (export stubs)
- `packages/platform-core/src/db/stubs/inventoryHold.ts`
- `packages/platform-core/src/db/stubs/inventoryHoldItem.ts`
- `packages/platform-core/src/db/stubs/inventoryItem.ts` (add `updateMany` semantics)
- `packages/platform-core/prisma/schema.prisma` (migration)
- `packages/platform-core/__tests__/inventoryHolds.idempotency.test.ts`

**Depends on:** COM-101 (idempotency key may include pricing/cart normalization; lock repricing decisions first)

**Problem:** Gap 2 from fact-find - Each checkout retry creates a NEW hold (keyed on ULID). If Stripe session creation fails after hold creation, the hold is NOT released (orphaned until TTL).

**Evidence:**
- `packages/platform-core/src/inventoryHolds.ts:45`: `const holdId = ulid();` — new ID per call, not idempotent
- `apps/cover-me-pretty/src/api/checkout-session/route.ts:153-201`: Hold created before Stripe session, no release on Stripe failure
- `packages/platform-core/src/cart/cartValidation.ts:168-179`: Hold-based validation path also calls `createInventoryHold` (additional blast radius)
- `packages/platform-core/src/db.ts:153-157`: Tests always use `createTestPrismaStub()` (`NODE_ENV === "test"`), so hold semantics must be supported by stubs for tests to be meaningful
- `apps/cover-me-pretty/__tests__/checkout-session.test.ts`: Fails today because the stub has no `inventoryHold` delegate → `releaseExpiredInventoryHolds` throws on `tx.inventoryHold.findMany` (`packages/platform-core/src/inventoryHolds.reaper.ts:13-18`) and Jest hard-fails on the resulting `console.error` (`jest.setup.ts:364-369`)

**Implementation:**
1. **Test harness first:** Extend `createTestPrismaStub()` to support inventory holds so tests can exercise the real flow:
   - Add `inventoryHold` + `inventoryHoldItem` delegates to the stub (`packages/platform-core/src/db.ts:45-97`)
   - Export the hold delegates from `packages/platform-core/src/db/stubs/index.ts`
   - Implement `inventoryItem.updateMany` semantics in `packages/platform-core/src/db/stubs/inventoryItem.ts` (needed by `createInventoryHold` at `packages/platform-core/src/inventoryHolds.ts:84-108`)
2. Add `idempotencyKey` column to `InventoryHold` (`packages/platform-core/prisma/schema.prisma`) and include it in created holds when provided
3. Enforce **“one active hold per checkout intent”** with a uniqueness strategy that does not block historical holds:
   - Preferred: Add `activeIdempotencyKey` (nullable) and enforce `@@unique([shopId, activeIdempotencyKey])`; set it only while `status="active"` and clear it on commit/release/expire
   - Alternative: Partial unique index on `(shopId, idempotencyKey)` **WHERE** `status='active'` (raw SQL migration) if we want to avoid a second column
4. Add optional `idempotencyKey` param to `createInventoryHold` (default: current ULID-per-call behavior)
5. In `createInventoryHold`, when `idempotencyKey` is provided:
   - Look up an existing active hold for the intent → return it (idempotent hit)
   - Otherwise create hold + items with the intent key and handle uniqueness races (P2002) by re-reading and returning the existing hold
6. Update checkout-session route to pass the checkout intent key into `createInventoryHold` (requires exposing the intent key builder from `packages/platform-core/src/checkout/createSession.ts:88-349` or providing a shared helper)
7. Record metrics: `inventory_hold_idempotent_hit_total` on idempotent hits
8. Keep release-on-failure semantics scoped to COM-103 (this task only ensures holds converge on retry)

**Confidence:**
- Overall: 70%
- Implementation: 70% - DB schema + transaction changes are clear; race handling requires careful testing but pattern is standard (unique + retry/read)
- Approach: 75% - Idempotency key aligned to checkout intent is the correct long-term model
- Impact: 70% - Call sites are now identified; changes are bounded to inventory hold creation + checkout/session wiring

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 60%
- **Updated confidence:** 70%
  - Implementation: 70% — Schema + unique index is straightforward (`packages/platform-core/prisma/schema.prisma:260-275`); `createInventoryHold` is already transactional (`packages/platform-core/src/inventoryHolds.ts:54-145`).
  - Approach: 75% — Idempotency keyed by checkout intent enables “retries converge” and is compatible with Stripe idempotency (`packages/platform-core/src/checkout/createSession.ts:332-369`).
  - Impact: 70% — Additional call sites identified (cart validation path) so impact is better understood (`packages/platform-core/src/cart/cartValidation.ts:168-179`).
- **Investigation performed:**
  - Repo: `packages/platform-core/src/inventoryHolds.ts:24-147` (transaction structure; current ULID-per-call behavior)
  - Repo: `packages/platform-core/prisma/schema.prisma:260-275` (InventoryHold model has no idempotency key today)
  - Repo: `apps/cover-me-pretty/src/api/checkout-session/route.ts:153-201` (hold created before Stripe session)
  - Repo: `packages/platform-core/src/db.ts:45-97`, `:153-157` (tests always use `createTestPrismaStub()`; stub currently omits inventory hold delegates)
  - Repo: `packages/platform-core/src/inventoryHolds.reaper.ts:13-25` (reaper calls `tx.inventoryHold.findMany` before item loop)
  - Tests: `pnpm --filter @apps/cover-me-pretty test -- checkout-session.test.ts` — FAIL (root cause: missing `inventoryHold` delegate in stub; throws at `packages/platform-core/src/inventoryHolds.reaper.ts:13-18`) (re-verified 2026-02-02)
  - Tests: `pnpm --filter @acme/platform-core test -- inventoryHolds.idempotency.test.ts` — PASS (12 todos; stubs exist but are not enforcing yet) (re-verified 2026-02-02)
- **Decision / resolution:** Uniqueness must apply to **active** holds only (holds persist after release/expire/commit). Prefer a Prisma-expressible “active key” uniqueness strategy (nullable `activeIdempotencyKey`) to avoid a partial-index-only constraint.
- **Changes to task:** Added missing test harness work (inventory hold delegates + `inventoryItem.updateMany` semantics) and corrected uniqueness strategy to account for non-active holds remaining in the DB.

**What would make this >=90%:**
- Convert the existing TODO stubs into red/green tests (remove `it.todo`) for the core idempotency scenarios
- Add a concurrency-focused test that proves uniqueness handling under parallel calls
- Prove the full retry story: same checkout intent yields same hold + same Stripe session ID (Phase 1 completion gate)

**Planning validation:**
- Tests run:
  - `pnpm --filter @acme/platform-core test -- inventoryHolds.idempotency.test.ts` — PASS (12 todos; stubs exist but are not enforcing yet) (re-verified 2026-02-02)
  - `pnpm --filter @acme/platform-core test -- inventory.test.ts` — PASS (4 suites, 47 tests) (re-verified 2026-02-02)
- Code reviewed: `packages/platform-core/src/inventoryHolds.ts`, `packages/platform-core/src/inventoryHolds.reaper.ts`, `packages/platform-core/src/db.ts`, `packages/platform-core/src/db/stubs/index.ts`, `packages/platform-core/src/db/stubs/inventoryItem.ts`, `packages/platform-core/src/db/stubs/inventoryHold.ts`, `packages/platform-core/src/db/stubs/inventoryHoldItem.ts`, `packages/platform-core/prisma/schema.prisma`, `apps/cover-me-pretty/src/api/checkout-session/route.ts`, `packages/platform-core/src/cart/cartValidation.ts`

**Acceptance:**
- [ ] Duplicate checkout requests within TTL return same hold ID
- [ ] Duplicate checkout requests return same Stripe session ID
- [ ] **Add uniqueness to ensure one *active* hold per `(shopId, idempotencyKey)` (preferred: `activeIdempotencyKey` unique; alternative: partial unique on `status='active'`)**
- [ ] **Handle unique constraint violations by re-reading existing hold and returning it**
- [ ] **Two concurrent requests with same idempotency key create exactly one hold**
- [ ] Schema migration for `idempotencyKey` (and `activeIdempotencyKey` if chosen) column(s)
- [ ] Metrics: `inventory_hold_idempotent_hit_total` counter

**Test contract:**
- **TC-01:** Two `createInventoryHold` calls with same `(shopId, idempotencyKey)` → same `holdId`, inventory decremented once
- **TC-02:** Concurrent `createInventoryHold` calls with same key → one hold (unique constraint), both callers receive same `holdId`
- **TC-03:** Existing hold expired → new hold created (new `holdId`), inventory decremented once for the new hold only
- **TC-04:** Idempotent hit → `inventory_hold_idempotent_hit_total` increments
- **TC-05:** Two identical checkout-session POSTs (same cart + body) → same `inventoryReservationId` (hold) + same `sessionId` (Stripe idempotency) and no double-decrement
- **Acceptance coverage:** TC-01/TC-02 cover idempotency + race safety; TC-03 covers expiry handling; TC-04 covers metrics; TC-05 covers “same hold + same Stripe session on retry”
- **Test type:** integration (db) + unit
- **Test location:** `packages/platform-core/__tests__/inventoryHolds.idempotency.test.ts` (existing; convert TODOs to real tests) and `apps/cover-me-pretty/__tests__/checkout-session.test.ts` (extend with an idempotent retry case)
- **Run:** `pnpm --filter @acme/platform-core test -- inventoryHolds.idempotency.test.ts && pnpm --filter @apps/cover-me-pretty test -- checkout-session.test.ts`

**Rollout/rollback:**
- Database migration required (additive: new column(s) + uniqueness constraint strategy)
- Feature flag: `ENABLE_IDEMPOTENT_HOLDS` for gradual rollout
- Rollback: Flag off falls back to ULID-per-call behavior

**Documentation impact:** Update `docs/inventory-migration.md` with idempotency behavior

**Notes/references:**
- `buildCheckoutIdempotencyKey` in `createSession.ts:88-160` provides the normalized payload
- Alternative: Create hold AFTER Stripe session, update session metadata - requires Stripe API verification
- Error handling (release on failure) delegated to COM-103

---

#### COM-103: Release holds on definitive Stripe session creation failures only

**Type:** IMPLEMENT
**Effort:** S (1-2 files, but requires careful error classification)
**Affects:**
- `apps/cover-me-pretty/src/api/checkout-session/route.ts`
- `packages/platform-core/src/checkout/stripeErrorClassifier.ts` (new)

**Depends on:** COM-102 (this task is less valuable before COM-102 exists; after COM-102, orphan holds on retry mostly disappear)

**Problem:** Gap 2 sub-item - If Stripe session creation fails AFTER hold creation, the hold is NOT released. Error path in `apps/cover-me-pretty/src/api/checkout-session/route.ts:274-286` doesn't call `releaseInventoryHold`.

**CRITICAL CORRECTNESS ISSUE:** Treating ALL Stripe failures as safe to release can cause oversell on timeout/network/5xx errors where session state is unknown.

**Failure Classification:**

**Definitive no-session failures (SAFE TO RELEASE):**
- Auth errors (401, 403) - Stripe guarantees no session created
- Validation errors (400 with explicit "invalid" responses) - malformed request, no object created
- Invalid API key errors

**Unknown-outcome failures (DO NOT RELEASE):**
- Timeouts - session may have been created
- 429 rate limits - request may have succeeded before rate limit applied
- 5xx server errors - session may have been created
- Network errors - session may have been created

**Evidence:**
- `apps/cover-me-pretty/src/api/checkout-session/route.ts:153-201`: Hold created
- `apps/cover-me-pretty/src/api/checkout-session/route.ts:274-286`: Error handling doesn't release hold

**Implementation:**
1. Create `stripeErrorClassifier.ts` to categorize Stripe errors
2. Wrap Stripe session creation (lines 203-273) in try/catch
3. Classify the error:
   - If definitive no-session: call `releaseInventoryHold({ shopId, holdId: inventoryReservationId })`
   - If unknown-outcome: DO NOT release, rely on TTL + idempotent hold reuse (COM-102)
4. Re-throw the error after appropriate handling

**Confidence:**
- Overall: 80%
- Implementation: 80% - Error classification is straightforward with Stripe error types + a small helper module
- Approach: 85% - Correct to differentiate definitive vs unknown-outcome failures (oversell prevention)
- Impact: 80% - Blast radius is bounded to hold-creating routes; template app route does not create holds today

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 75%
- **Updated confidence:** 80%
  - Implementation: 80% — Checkout-session route already has a single error boundary (`apps/cover-me-pretty/src/api/checkout-session/route.ts:274-286`) where we can classify and conditionally release.
  - Approach: 85% — “Release only on definitive no-session failures” prevents oversell on timeouts/5xx/429.
  - Impact: 80% — Only the hold-based checkout route needs this; template checkout route is read-only validation (no holds) (`packages/template-app/src/api/checkout-session/route.ts:123-147`).
- **Investigation performed:**
  - Repo: `apps/cover-me-pretty/src/api/checkout-session/route.ts:153-201` (hold creation) and `:274-286` (error boundary)
  - Repo: `packages/template-app/src/api/checkout-session/route.ts:123-147` (no hold creation; uses `validateInventoryAvailability`)
- **Decision / resolution:** Implement Stripe error classifier and only release on definitive no-session failures.
- **Changes to task:** Corrected impact assessment (not all checkout-session routes create holds).

**What would make this >=90%:**
- Document all Stripe error codes and their session-creation semantics
- Test with actual Stripe test mode errors

**Acceptance:**
- [ ] Release hold ONLY on definitive no-session failures (4xx validation/auth errors)
- [ ] Do NOT release on timeouts, 5xx, 429, network errors (unknown outcome)
- [ ] `stripeErrorClassifier` module created with documented error categories
- [ ] Test: Definitive failure (401) releases hold
- [ ] Test: Unknown-outcome failure (timeout) does NOT release hold

**Test contract:**
- **TC-01:** Stripe throws 401/403 (auth) → `releaseInventoryHold` called; response remains 502/propagated error
- **TC-02:** Stripe throws 400 validation error → `releaseInventoryHold` called
- **TC-03:** Stripe throws timeout/5xx/429/network → `releaseInventoryHold` NOT called (unknown outcome)
- **Acceptance coverage:** TC-01/TC-02 cover “release only on definitive no-session”; TC-03 covers “do not release on unknown outcome”
- **Test type:** unit (route)
- **Test location:** `apps/cover-me-pretty/__tests__/checkout-session.test.ts` (extend; mock `@acme/platform-core/inventoryHolds` + Stripe failures)
- **Run:** `pnpm --filter @apps/cover-me-pretty test -- checkout-session.test.ts`

**Rollout/rollback:**
- Feature flag: `ENABLE_STRIPE_ERROR_CLASSIFICATION` (default: true)
- Rollback: Flag off disables all release behavior (safe but accumulates orphan holds)

**Documentation impact:** Update `docs/orders.md` with error handling semantics

**Notes/references:**
- `releaseInventoryHold` already handles "not found" gracefully (returns `{ ok: false, reason: "not_found" }`)
- This task is less valuable before COM-102 exists; after COM-102, orphan holds on retry mostly disappear

---

#### COM-104: Add rate limiting to checkout endpoints

**Type:** IMPLEMENT
**Effort:** M (3-5 files, Workers-specific implementation)
**Affects:**
- `apps/checkout-gateway-worker/src/index.ts`
- `apps/checkout-gateway-worker/src/rateLimiter.ts` (new)
- `apps/cover-me-pretty/src/api/checkout-session/route.ts` (optional secondary layer)
- `apps/cochlearfit-worker/src/index.ts` (if kept)

**Depends on:** COM-D04 (rate limiting backend choice)

**Problem:** Gap 6 from fact-find - No rate limiting on checkout-session creation. Anonymous checkout + no rate limiting = abuse vector for inventory hold exhaustion, Stripe rate limit exhaustion, and card testing attacks.

**Evidence:**
- `apps/checkout-gateway-worker/src/index.ts:41-92`: No rate limiting; only routing + auth header injection
- `apps/checkout-gateway-worker/src/routing.ts:9-30`: Checkout endpoints are explicitly enumerated (single choke point)
- `apps/front-door-worker/src/routing.ts:9-36`: `/api/checkout-session` is routed to the gateway (correct choke point); `/api/cart` is storefront-only
- `apps/cms/src/lib/server/rateLimiter.ts:11-38`: Existing Node-side rate limiter patterns (not reusable as-is in Workers runtime)

**Implementation (depends on COM-D04 decision):**

**If COM-D04 = Cloudflare Rate Limiting product:**
1. Configure Cloudflare Rate Limiting rules in `wrangler.toml` or dashboard
2. Set: 10 requests/minute/IP for checkout-session endpoints
3. Return 429 with `Retry-After` header

**If COM-D04 = Durable Objects:**
1. Create rate limiter DO class
2. Implement sliding window counter
3. Configure per-shop limits: IP + shopId (prevents cross-tenant griefing via shared NATs)

**Confidence:**
- Overall: 60%
- Implementation: 80% - Worker routing is centralized; existing KV/DO patterns exist in-repo, but requires deployment/config wiring
- Approach: 60% - Backend choice (product vs DO) is a genuine requirements/ops decision
- Impact: 75% - Blast radius is mostly isolated to gateway allowlisted endpoints; must ensure correct IP + shop keying and consistent 429 behavior

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 70%
- **Updated confidence:** 60%
  - Implementation: 80% — Worker code is small and centralized (`apps/checkout-gateway-worker/src/index.ts:41-92`) and checkout routes are explicitly enumerated (`apps/checkout-gateway-worker/src/routing.ts:9-30`).
  - Approach: 60% — Must choose backend first (COM-D04); without it, this is “needs-input”.
  - Impact: 75% — Gateway is the right control plane; `x-shop-id` is already mandatory for shop routes (`apps/checkout-gateway-worker/src/index.ts:74-81`) and CF provides stable client IP headers (`apps/cms/src/lib/server/rateLimiter.ts:49-69`).
- **Investigation performed:**
  - Repo: `apps/checkout-gateway-worker/src/index.ts:41-92` (single choke point; no rate limiting today)
  - Repo: `apps/checkout-gateway-worker/src/routing.ts:9-30` (exact endpoint list; apply limits only where intended)
  - Repo: `apps/front-door-worker/src/index.ts:92-97` (front-door injects `x-shop-id` for downstream shop-scoped endpoints)
  - Repo: `packages/auth/src/rateLimiter.ts:24-115` (existing KV-capable rate limiter that can run in Workers if D04 selects KV)
  - Repo: `apps/xa/src/lib/rateLimit.ts:24-78` (header patterns incl. `Retry-After`)
  - Repo: `wrangler.toml:5-19` (existing KV/DO bindings patterns in this repo)
  - Repo: `apps/cms/src/lib/server/rateLimiter.ts:11-110` (Node-side limiter patterns and trusted IP extraction)
  - Repo: `apps/cochlearfit-worker/wrangler.toml:1-26` (reference: a worker app that is deployable/testable in isolation; gateway worker currently lacks this scaffolding)
- **Decision / resolution:** Blocked on COM-D04 backend choice.
- **Changes to task:** Updated evidence and raised implementation/impact confidence (approach still decision-gated).

**What would make this >=90%:**
- COM-D04 decision made
- Verify chosen approach works in Workers runtime

**Planning validation:**
- Pattern reviewed: `apps/cms/src/lib/server/rateLimiter.ts` - confirmed NOT directly reusable in Workers

**Acceptance:**
- [ ] 11th checkout request from same IP + shop within 1 minute returns 429 (applies to `/api/checkout-session` + legacy alias)
- [ ] Response includes `Retry-After` header
- [ ] Metrics: `checkout_rate_limited_total` counter
- [ ] Test: Rate limit exceeded scenario

**Test contract:**
- **TC-01:** 11th request/min from same `cf-connecting-ip` + `x-shop-id` → 429 + `Retry-After` header
- **TC-02:** Requests below threshold → forwarded to origin normally
- **TC-03:** Different `x-shop-id` (same IP) is independently limited when using per-shop keying (DO option)
- **Acceptance coverage:** TC-01 covers rate limit behavior + headers; TC-02 covers non-regression; TC-03 covers per-shop fairness (if chosen)
- **Test type:** integration (worker; local `wrangler dev`) + unit (pure limiter module)
- **Test location:** `apps/checkout-gateway-worker/src/rateLimiter.ts` (new) + `apps/checkout-gateway-worker/src/rateLimiter.test.ts` (new; runner to be added as part of COM-104 packaging)
- **Run:** `pnpm exec wrangler dev apps/checkout-gateway-worker/src/index.ts --local --port 8789` then `for i in {1..11}; do curl -s -o /dev/null -w \"%{http_code}\\n\" -H \"cf-connecting-ip: 203.0.113.10\" -H \"x-front-door-token: <token>\" -H \"x-shop-id: <shopId>\" -X POST \"http://localhost:8789/api/checkout-session\"; done` (expect last code 429)

**Rollout/rollback:**
- Feature flag: `CHECKOUT_RATE_LIMIT_ENABLED` (default: true)
- Configurable limit: `CHECKOUT_RATE_LIMIT_REQUESTS_PER_MINUTE` (default: 10)

**Documentation impact:** Update gateway worker README

**Notes/references:**
- Cannot reuse CMS Node rate limiter directly (different runtime)
- Consider per-shop limits: IP + shopId (prevents cross-tenant griefing via shared NATs)
- Cloudflare Rate Limiting API is recommended for simplicity

---

### Phase 1 Completion Gate

**Before proceeding to Phase 2, must demonstrate:**

- [ ] **Retries converge:** Same request twice returns same hold + same session (or deterministic 409)
- [ ] **Unknown Stripe error path doesn't oversell:** Holds NOT released on timeouts/5xx/network errors
- [ ] **Repricing enforced:** All checkout sessions use server-authoritative prices
- [ ] **Rate limiting active:** Checkout endpoints protected from abuse
- [ ] **Contract tests pass:** Inventory validate contract enforced

**Proof tests:**
```bash
pnpm --filter @acme/platform-core test -- checkout-session.test.ts
pnpm --filter @acme/platform-core test -- inventoryHolds.idempotency.test.ts   # gate: convert TODOs to real tests in COM-102
pnpm --filter @apps/cover-me-pretty test -- stripe-webhook.test.ts
```

**Integration test:** Retry checkout with same idempotency key returns same Stripe session ID

---

### Phase 2: Contract Coherence + Webhook Hardening

---

#### COM-201: Unify inventory authority contract

**Type:** IMPLEMENT
**Effort:** M (3-5 files, standardization across routes)
**Affects:**
- `apps/cms/src/app/api/inventory/validate/route.ts`
- `apps/cover-me-pretty/src/api/inventory/validate/route.ts`
- `apps/cochlearfit-worker/src/index.ts`
- `packages/platform-core/src/types/inventory.ts` (contract types)
- `packages/platform-core/src/types/__tests__/inventorySchema.test.ts` (extend)
- `docs/contracts/inventory-authority-contract.md` (new)

**Depends on:** -

**Problem:** Fact-find identified contract mismatch between endpoints:
- CMS endpoint expects `{ shopId, items: [{ sku, variantKey?, quantity }] }` in body
- Tenant endpoint expects `{ items: [{ sku, quantity, variantAttributes? }] }` with shop from `shop.json`
- CochlearFit worker sends `{ items: [{ sku, quantity, variantAttributes }] }` without `shopId`

**Evidence:**
- `apps/cms/src/app/api/inventory/validate/route.ts:11-20`: Uses `shopId` in body, `variantKey` field
- `apps/cover-me-pretty/src/api/inventory/validate/route.ts:14-28`: Uses `variantAttributes` field, no `shopId`
- `apps/cochlearfit-worker/src/index.ts:204-218` + `:230-237`: Sends `{ items: [{ sku, quantity, variantAttributes }] }` without `shopId`

**Implementation:**
1. Define canonical contract in `packages/platform-core/src/types/inventory.ts`
2. Canonical shape: `{ items: [{ sku: string, quantity: number, variantAttributes?: Record<string, string> }] }`
3. Shop context from `x-shop-id` header (gateway-provided) OR explicit `shopId` body field (for multi-tenant CMS)
4. Add a small parser helper:
   - `variantKey(variantAttributes)` already exists; add `parseVariantKey(variantKey) -> { sku, variantAttributes }` for backward compatibility
5. Update all routes to accept:
   - Canonical `{ items: [{ sku, quantity, variantAttributes? }] }`
   - Deprecated `{ items: [{ sku, quantity, variantKey? }] }` (convert via `parseVariantKey`)
6. Deprecate `variantKey` in favor of `variantAttributes` (keep soft support until all callers migrate)

**Fail-Closed Mismatch Rules:**

1. **Header vs body conflict:**
   - If both `x-shop-id` header and `shopId` body field exist and differ: return 400
   - Never silently pick one over the other

2. **variantKey vs variantAttributes conflict:**
   - If both exist: compute server-side `variantKey(variantAttributes)`
   - If computed key mismatches provided `variantKey`: return 400
   - Otherwise ignore client `variantKey` (treat as deprecated input)

**Confidence:**
- Overall: 80%
- Implementation: 85% - Clear mismatch; canonical shape aligns with `InventoryValidationRequest` and existing zod schemas
- Approach: 85% - Header-based shop context aligns with gateway pattern and avoids shopId-in-body drift
- Impact: 80% - Callers are identified; backward-compat + conflict rules bound migration risk

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 72%
- **Updated confidence:** 80%
  - Implementation: 85% — Platform-core already models requests as `{ sku, quantity, variantAttributes? }` (`packages/platform-core/src/inventoryValidation.ts:10-14`), so the canonical contract matches the real runtime expectation.
  - Approach: 85% — Consolidates on one contract while preserving deprecated inputs; conflict rules prevent silent cross-tenant mistakes.
  - Impact: 80% — All current callers are known (`apps/cms/...`, `apps/cover-me-pretty/...`, `apps/cochlearfit-worker/...`), so rollout can be coordinated.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/inventoryValidation.ts:10-35` (canonical request type + cart adapter)
  - Repo: `apps/cms/src/app/api/inventory/validate/route.ts:11-20` (shopId-in-body + variantKey schema)
  - Repo: `apps/cover-me-pretty/src/api/inventory/validate/route.ts:14-28` (variantAttributes schema)
  - Repo: `apps/cochlearfit-worker/src/index.ts:204-218` + `:230-237` (worker caller shape)
  - Tests: `pnpm --filter @acme/platform-core test -- inventory.test.ts` — PASS (baseline inventory behaviors) (re-verified 2026-02-02)
- **Decision / resolution:** Canonicalize on `variantAttributes`; accept `variantKey` only as a deprecated input with strict conflict checks.
- **Changes to task:** Added concrete backward-compat mechanism (`parseVariantKey`) and updated confidence to reflect known caller map.

**Acceptance:**
- [ ] All endpoints accept canonical request shape
- [ ] CochlearFit worker can call any endpoint
- [ ] Backward compatibility for `variantKey` field
- [ ] Contract types exported from platform-core
- [ ] **If both `x-shop-id` and `shopId` exist and differ: return 400 (never silently pick one)**
- [ ] **If `variantKey` and `variantAttributes` mismatch: return 400**

**Test contract:**
- **TC-01:** CMS endpoint: `{ shopId, items:[{ sku, quantity, variantAttributes }] }` → 200 `{ ok: true }`
- **TC-02:** Tenant endpoint: `{ items:[{ sku, quantity, variantAttributes }] }` → 200 `{ ok: true }`
- **TC-03:** Request includes both `x-shop-id` header and `shopId` body with different values → 400
- **TC-04:** Request includes both `variantKey` and `variantAttributes` but they mismatch → 400
- **Acceptance coverage:** TC-01/TC-02 cover canonical acceptance; TC-03 covers header/body conflict; TC-04 covers variant conflict rule
- **Test type:** contract (endpoints)
- **Test location:** `packages/platform-core/__tests__/inventory-validate-contract.test.ts` (new; implemented in COM-203)
- **Run:** `pnpm --filter @acme/platform-core test -- inventory-validate-contract.test.ts`

**Rollout/rollback:** Additive changes, no breaking changes (except fail-closed on conflicts)

**Documentation impact:** Create `docs/contracts/inventory-authority-contract.md`

---

#### COM-202: Add fail-closed webhook tenant assertion

**Type:** IMPLEMENT
**Effort:** M (5-7 files)
**Affects:**
- `packages/platform-core/src/handleStripeWebhook.ts`
- `packages/platform-core/src/stripeTenantResolver.ts`
- `apps/cover-me-pretty/src/api/stripe-webhook/route.ts`
- `packages/template-app/src/api/stripe-webhook/route.ts`
- `apps/cover-me-pretty/__tests__/stripe-webhook.test.ts` (extend)
- `packages/template-app/__tests__/stripe-webhook.test.ts` (extend)
- `docs/orders.md` (update)

**Depends on:** -

**Problem:** Gap 1 from fact-find - Per-tenant webhook routes pass hardcoded shop IDs, bypassing tenant resolution. If a webhook arrives at the wrong tenant endpoint, it will be processed with the wrong shop ID.

**Evidence:**
- `apps/cover-me-pretty/src/api/stripe-webhook/route.ts:24-25`: `await handleStripeWebhook("cover-me-pretty", event);`
- `packages/platform-core/src/stripeTenantResolver.ts:62-75`: Resolver exists but unused at route layer

**Implementation:**
1. Use existing resolver: `resolveShopIdFromStripeEventWithFallback(event)`
2. In each webhook route, resolve shopId from the event and compare to the route’s expected tenant
3. **Fail-closed assertions:**
   - If route passes expected shop and resolved shop differs: reject with 400 or 403
   - If tenant cannot be resolved at all: return 5xx/503 (NOT 400 - Stripe retries on 5xx)
   - Never 400 for unresolvable tenant (can cause permanent event loss)
4. Log resolution failures for monitoring
5. Optional: Add `assertTenant` helper for routes

**Confidence:**
- Overall: 80%
- Implementation: 85% - Resolver exists; route-layer assertion is a small, testable change
- Approach: 85% - Fail-closed is correct for security and cross-tenant isolation
- Impact: 80% - Limited to webhook routes + shop resolution behavior; Stripe retry semantics are understood

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 75%
- **Updated confidence:** 80%
  - Implementation: 85% — Resolver is already implemented (`packages/platform-core/src/stripeTenantResolver.ts:62-75`); route call sites are clear (`apps/cover-me-pretty/src/api/stripe-webhook/route.ts:24-25`, `packages/template-app/src/api/stripe-webhook/route.ts:25-26`).
  - Approach: 85% — Prevents cross-tenant event processing and aligns with fail-closed tenancy.
  - Impact: 80% — Bounded to webhook routes; explicit 503 on unresolvable tenant preserves Stripe retry behavior.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/handleStripeWebhook.ts:37-54` (current handler signature + processing)
  - Repo: `packages/platform-core/src/stripeTenantResolver.ts:62-75` (resolution order)
  - Repo: `apps/cover-me-pretty/src/api/stripe-webhook/route.ts:16-25` and `packages/template-app/src/api/stripe-webhook/route.ts:17-26` (hardcoded shop IDs)
  - Tests: `pnpm --filter @apps/cover-me-pretty test -- stripe-webhook.test.ts` — PASS (3 tests) (re-verified 2026-02-02)
- **Decision / resolution:** Enforce tenant assertion at the route layer; return 503 when unresolvable so Stripe retries.
- **Changes to task:** Updated confidence + clarified that the assertion is route-layer (not inside `handleStripeWebhook`).

**Acceptance:**
- [ ] Webhook with mismatched `shop_id` metadata is rejected with 400 or 403
- [ ] **If tenant cannot be resolved at all: return 503 (not 400) so Stripe retries**
- [ ] **Never return 400 for unresolvable tenant (causes permanent event loss)**
- [ ] Rejection logged with event ID and shop mismatch details
- [ ] Metrics: `webhook_tenant_mismatch_total` counter
- [ ] Test: Mismatched tenant scenario
- [ ] Test: Event with no shop_id returns 503 (not silent processing)

**Test contract:**
- **TC-01:** Event resolves to different shop than route tenant → 403 (or 400) + `webhook_tenant_mismatch_total` increments
- **TC-02:** Event resolves to same shop → handler invoked and returns 200
- **TC-03:** Event cannot be resolved → 503 (not 400) + `webhook_tenant_unresolvable_total` increments
- **Acceptance coverage:** TC-01 covers mismatch rejection; TC-03 covers unresolvable retry semantics; TC-02 covers non-regression
- **Test type:** integration (route)
- **Test location:** `apps/cover-me-pretty/__tests__/stripe-webhook.test.ts` and `packages/template-app/__tests__/stripe-webhook.test.ts` (extend/add)
- **Run:** `pnpm --filter @apps/cover-me-pretty test -- stripe-webhook.test.ts && pnpm --filter @acme/template-app test -- stripe-webhook.test.ts`

**Rollout/rollback:**
- Feature flag: `WEBHOOK_TENANT_ASSERTION_ENABLED` (default: true)
- Alert on mismatch without rejection first (monitoring mode)

**Documentation impact:** Update `docs/orders.md` with webhook tenancy model

**Notes/references:**
- 5xx causes Stripe retry; 4xx can cause permanent loss if event is dropped
- Use existing resolver: `resolveShopIdFromStripeEventWithFallback(event)`

---

#### COM-203: Add contract tests for inventory validate

**Type:** IMPLEMENT
**Effort:** M (integration test layer)
**Affects:**
- `packages/platform-core/__tests__/inventory-validate-contract.test.ts` (new)
- `apps/cover-me-pretty/__tests__/inventory-validate.test.ts` (new)
- `apps/cms/__tests__/inventory-validate.test.ts` (new)

**Depends on:** COM-201

**Problem:** Contract mismatch across inventory validate endpoints is not tested. Easy for workers to drift.

**Implementation:**
1. Create contract test suite that validates all endpoints accept canonical shape
2. Test both `variantKey` and `variantAttributes` fields
3. Test shop context from header vs body
4. Test error responses (400, 401, 409, 503)
5. Test fail-closed mismatch rules from COM-201

**Confidence:**
- Overall: 80%
- Implementation: 85% - Standard route-test patterns exist in apps; contract suite is straightforward to add
- Approach: 85% - Contract tests prevent drift across tenants/workers
- Impact: 80% - Tests-only changes; bounded to request/response contracts

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 85%
- **Updated confidence:** 80%
  - Implementation: 85% — Multiple route tests already exist in `apps/*/__tests__` (e.g. `apps/cover-me-pretty/__tests__/stripe-webhook.test.ts`) and can be mirrored for inventory validate.
  - Approach: 85% — Locks down a cross-app contract and prevents silent drift.
  - Impact: 80% — Tests only; failures will correctly surface contract breaks early.
- **Investigation performed:**
  - Repo: `apps/cms/src/app/api/inventory/validate/route.ts:11-101` and `apps/cover-me-pretty/src/api/inventory/validate/route.ts:14-76` (current contract mismatch)
- **Decision / resolution:** Add contract tests that exercise both canonical + deprecated request shapes and all fail-closed mismatch rules.
- **Changes to task:** Added explicit test contract (TC-XX) instead of “this task is the test plan”.

**Acceptance:**
- [ ] Contract test for CMS endpoint
- [ ] Contract test for tenant endpoint
- [ ] Tests verify all response codes
- [ ] Tests run in CI

**Test contract:**
- **TC-01:** CMS endpoint accepts canonical `{ shopId, items:[{ sku, quantity, variantAttributes }] }` → 200 `{ ok: true }`
- **TC-02:** Tenant endpoint accepts canonical `{ items:[{ sku, quantity, variantAttributes }] }` → 200 `{ ok: true }`
- **TC-03:** Deprecated `variantKey` input still accepted when consistent → 200 `{ ok: true }`
- **TC-04:** `x-shop-id` header and `shopId` body mismatch → 400
- **TC-05:** `variantKey` and `variantAttributes` mismatch → 400
- **Acceptance coverage:** TC-01/TC-02 cover endpoint contract; TC-03 covers backward compat; TC-04/TC-05 cover fail-closed mismatch rules
- **Test type:** contract
- **Test location:** `packages/platform-core/__tests__/inventory-validate-contract.test.ts` (new) + `apps/cover-me-pretty/__tests__/inventory-validate.test.ts` (new) + `apps/cms/__tests__/inventory-validate.test.ts` (new if needed)
- **Run:** `pnpm --filter @acme/platform-core test -- inventory-validate-contract.test.ts && pnpm --filter @apps/cover-me-pretty test -- --testPathPattern=inventory-validate && pnpm --filter @apps/cms test -- --testPathPattern=inventory-validate`

**Rollout/rollback:** N/A - tests only

**Documentation impact:** None

---

#### COM-204: Add sale mode exercised test

**Type:** IMPLEMENT
**Effort:** S (1-2 files)
**Affects:**
- `packages/template-app/__tests__/checkout-session.success.test.ts` (extend) or `packages/template-app/__tests__/checkout-session.sale.test.ts` (new)

**Depends on:** -

**Problem:** Sale mode exists in platform-core but is not exercised by any tenant route. Need integration test coverage.

**Evidence:**
- `packages/platform-core/__tests__/checkout-session.test.ts:318-352`: Unit test exists for sale mode
- No tenant route exercises `mode: "sale"` in production

**Implementation:**
1. Add integration test that exercises full sale checkout flow
2. Test: Cart -> Checkout Session -> Webhook -> Order creation
3. Verify deposits are zero, rental days are zero

**Confidence:**
- Overall: 85%
- Implementation: 90% - Unit coverage exists; route-level exercise can follow existing checkout-session route tests
- Approach: 90% - Route-level coverage reduces risk of “sale path” drifting from unit semantics
- Impact: 85% - Tests only; no production behavior change

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 90%
- **Updated confidence:** 85%
  - Implementation: 90% — Sale mode is already unit-tested (`packages/platform-core/__tests__/checkout-session.test.ts:318-352`); missing piece is route-level exercise.
  - Approach: 90% — Adds regression protection for the first sale-focused tenant (CochlearFit).
  - Impact: 85% — Tests only; should be safe to land early.
- **Investigation performed:**
  - Repo: `packages/platform-core/__tests__/checkout-session.test.ts:318-352` (sale mode expectations: no deposit line-items; rentalDays=0)
- **Decision / resolution:** Add a tenant-route test that exercises sale mode end-to-end at the API boundary.
- **Changes to task:** Added explicit test contract (TC-XX) instead of “this task is the test plan”.

**Acceptance:**
- [ ] Integration test for sale mode checkout
- [ ] Test verifies no deposit line items
- [ ] Test verifies `rentalDays: 0` in metadata

**Test contract:**
- **TC-01:** Tenant checkout-session route with sale shop type → Stripe session created without deposit line-items
- **TC-02:** Sale flow metadata → `rentalDays=0` and `depositTotal=0`
- **TC-03:** Regression: rental flow remains unchanged for rental shops
- **Acceptance coverage:** TC-01/TC-02 cover acceptance criteria; TC-03 covers non-regression
- **Test type:** integration (route)
- **Test location:** `packages/template-app/__tests__/checkout-session.success.test.ts` (extend) or add `packages/template-app/__tests__/checkout-session.sale.test.ts` (new)
- **Run:** `pnpm --filter @acme/template-app test -- --testPathPattern=checkout-session.*sale`

**Rollout/rollback:** N/A - tests only

**Documentation impact:** None

---

### Phase 3: CochlearFit Integration

---

#### COM-301: Replace CochlearFit placeholder Stripe Price IDs

**Type:** IMPLEMENT
**Effort:** S (1-2 files) or M (if migrating to price_data)
**Affects:**
- `apps/cochlearfit-worker/src/index.ts`
- `apps/cochlearfit/src/data/products.ts`
- Stripe Dashboard (external)

**Depends on:** COM-D01 (if converging to platform, this may be handled differently), COM-D05 (Stripe account topology)

**Problem:** Gap 4 from fact-find - CochlearFit uses placeholder Stripe Price IDs (`price_${prefix}_${size}_${color}`).

**Evidence:**
- `apps/cochlearfit-worker/src/index.ts:111`: `stripePriceId: \`price_${prefix}_${size.key}_${color.key}\``

**Implementation options:**
- **Option A:** Create real Stripe Products and Prices in Stripe Dashboard, update code with real IDs
- **Option B:** Migrate to `price_data` (dynamic pricing like platform-core) - more flexibility

**Confidence:**
- Overall: 60%
- Implementation: 80% - Straightforward either way (update mapping or switch to `price_data`)
- Approach: 60% - Depends on COM-D01 and COM-D05 decisions (who owns Prices + where they live)
- Impact: 70% - Affects payment flow and rollback strategy

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 70%
- **Updated confidence:** 60%
  - Implementation: 80% — Placeholder IDs are clearly localized to the catalog mapping (`apps/cochlearfit-worker/src/index.ts:111-116`).
  - Approach: 60% — Must align with Stripe account topology decision (COM-D05) to avoid creating Prices in the wrong account.
  - Impact: 70% — Touches both worker and product catalog; rollback requires a real “known-good” mapping (not placeholders).
- **Investigation performed:**
  - Repo: `apps/cochlearfit-worker/src/index.ts:111-116` (placeholder `price_*` ID construction)
  - Repo: `apps/cochlearfit-worker/package.json:4-7` (worker run via `wrangler dev`; no automated test runner today)
- **Decision / resolution:** Blocked on COM-D05; prefer “real Price IDs in the correct account” with a documented rollback mapping.
- **Changes to task:** Confidence updated to reflect approach dependency; test plan moved to an explicit e2e contract.

**Acceptance:**
- [ ] Real Stripe Price IDs or price_data in use
- [ ] Test checkout creates valid Stripe session
- [ ] Prices match expected product prices

**Test contract:**
- **TC-01:** Worker creates a Stripe session with real Price IDs → Stripe accepts request (2xx) and line items match expected SKUs/qty
- **TC-02:** Price mapping is complete (no placeholders) → no `price_*` template IDs appear in runtime requests
- **Acceptance coverage:** TC-01 covers “valid session”; TC-02 covers “no placeholder IDs”
- **Test type:** e2e (manual, Stripe test mode)
- **Test location:** `apps/cochlearfit-worker/src/index.ts` (runtime) + Stripe dashboard (test mode)
- **Run:** `pnpm --filter @apps/cochlearfit-worker dev` then `curl -X POST http://localhost:8788/api/checkout-session -H 'Content-Type: application/json' -d '{\"items\":[{\"variantId\":\"<id>\",\"quantity\":1}]}'`

**Rollout/rollback:**
- Staged rollout by environment (dev -> staging -> prod)
- **Rollback: Revert to previous known-good real Stripe Price IDs (requires keeping old IDs available)**
- **OR: Switch to `price_data` approach if that's the fallback strategy**

**Documentation impact:** Update CochlearFit README with Stripe configuration

**Notes/references:**
- Rollback to placeholder IDs is NOT meaningful (breaks real payments)
- Must have either: previous real IDs saved, OR `price_data` as fallback

---

#### COM-302: Wire CochlearFit to platform cart/checkout APIs

**Type:** INVESTIGATE
**Effort:** L (6+ files, frontend + backend integration)
**Affects:**
- `apps/cochlearfit/src/contexts/cart/CartContext.tsx`
- `apps/cochlearfit/src/contexts/cart/cartStorage.ts`
- `apps/cochlearfit/src/lib/checkout.ts`
- `apps/cochlearfit-worker/src/index.ts` (if retiring)
- Routing configuration

**Depends on:** COM-D01, COM-D02, COM-101, COM-102, COM-201 (avoid integrating onto moving inventory contract)

**Problem:** CochlearFit currently uses localStorage cart and worker-direct Stripe calls. Need to migrate to platform cart API and checkout-session endpoint.

**Confidence:**
- Overall: 55%
- Implementation: 65% - Integration seams and required endpoints are identifiable; still needs a sequencing plan (static export + routing + auth headers)
- Approach: 55% - Blocked on COM-D01/COM-D02 decisions; multiple viable paths
- Impact: 60% - Large blast radius across CochlearFit frontend + worker + platform routing, but the contract gaps are now explicit

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 58% (IMPLEMENT)
- **Updated confidence:** 55% (INVESTIGATE)
  - Implementation: 65% — Platform endpoints and routing constraints are now explicit, but a safe build still requires decisions + routing verification.
  - Approach: 55% — This is fundamentally decision-gated (COM-D01 architecture + COM-D02 checkout mode).
  - Impact: 60% — Key incompatibilities are now proven (CochlearFit relies on routes not allowed by the platform front-door/gateway allowlists).
- **Investigation performed:**
  - Repo: `apps/cochlearfit/package.json:8-9` (static export preview is a first-class workflow)
  - Repo: `apps/cochlearfit/README.md:1-60` (current topology: static export + separate Worker API; `NEXT_PUBLIC_API_BASE_URL` can point at the Worker)
  - Repo: `apps/cochlearfit/src/lib/api.ts:1-7` (`NEXT_PUBLIC_API_BASE_URL` + relative `/api/*` calls)
  - Repo: `apps/cochlearfit-worker/src/index.ts:480-579` (current Worker implements POST `/api/checkout/session` + GET `/api/checkout/session/:id`)
  - Repo: `apps/checkout-gateway-worker/src/index.ts:70-81` (gateway requires `x-shop-id` for shop-scoped endpoints)
  - Repo: `apps/cochlearfit/src/lib/checkout.ts:16-46` (current API surface: POST `/api/checkout/session`, GET `/api/checkout/session/:id`)
  - Repo: `apps/cochlearfit-worker/src/index.ts:513-555` (worker implements GET `/api/checkout/session/:id` which the platform routing layer does not allow)
  - Repo: `apps/front-door-worker/src/routing.ts:9-36` (platform routes `/api/checkout-session` to gateway but keeps `/api/cart` storefront-only)
  - Repo: `apps/checkout-gateway-worker/src/routing.ts:9-30` (gateway allowlist does not include GET `/api/checkout/session/:id`; does include `/api/order-status`)
  - Repo: `packages/template-app/src/runtimeContractManifest.ts:36-47` (canonical platform contract expects `/api/cart` + `/api/checkout-session` in nodejs runtime)
  - Repo: `packages/template-app/src/api/cart/route.ts:10-15` (example: mount platform cart API by re-exporting `@acme/platform-core/cartApi`)
  - Repo: `packages/template-app/src/api/checkout-session/route.ts:33-37` (platform checkout-session reads cart from `CART_COOKIE` + cart store, not request items)
  - Repo: `apps/cover-me-pretty/src/api/order-status/route.ts:12-44` (platform success flow uses `/api/order-status` for “finalized” polling)
- **Decision / resolution:** Convert to INVESTIGATE until COM-D01/COM-D02 are resolved and routing constraints are proven.
- **Changes to task:** Type changed to INVESTIGATE; acceptance re-framed to produce follow-on IMPLEMENT tasks with full test contracts.

**Blockers / questions to answer:**
- What is the target topology for CochlearFit: platform convergence (COM-D01) vs retained worker?
- Hosted vs custom UI checkout mode (COM-D02) — affects frontend work and API shape
- Can CochlearFit static export reliably call the platform cart + checkout-session APIs in the target deployment topology?
- What is the routing plan for CochlearFit origin → front-door → gateway → node, and where does `x-shop-id` come from?
- CochlearFit thank-you UI currently depends on GET `/api/checkout/session/:id` (to show line-item summary + `paymentStatus`); platform routing layer does not allow this — should we switch to `/api/order-status` + client-side summary snapshot, or add a platform endpoint for order/session details?

**Acceptance (investigation outputs):**
- [ ] Confirm COM-D01 + COM-D02 decisions (or produce a decision memo with recommendation + tradeoffs)
- [ ] Produce a call graph of CochlearFit purchase flow (frontend → API endpoints → webhook completion) with concrete paths
- [ ] Verify routing constraints: which endpoints CochlearFit must call and which headers must be present (esp. `x-shop-id`)
- [ ] Propose thank-you status strategy compatible with platform allowlists (e.g. `/api/order-status` polling) and update COM-303’s downstream assumptions accordingly
- [ ] Produce a sequenced set of follow-on IMPLEMENT tasks (with new COM-3xx IDs) each with:
  - acceptance criteria
  - enumerated test contracts (TC-XX)
  - rollout/rollback notes (feature flag strategy)
  - affected files list
- [ ] Update this plan’s Task Summary + dependencies based on the above
**Documentation impact:** Update CochlearFit deployment docs (once decisions + routing are confirmed)

---

#### COM-303: Clear cart on payment success

**Type:** IMPLEMENT
**Effort:** S (1-2 files)
**Affects:**
- `apps/cochlearfit/src/app/[lang]/thank-you/page.tsx`
- `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx`
- `apps/cochlearfit/src/contexts/cart/cartStorage.ts`
- `apps/cochlearfit/src/contexts/cart/CartContext.tsx`

**Depends on:** COM-302

**Problem:** Cart is not cleared on payment success.

**Evidence:**
- `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx:36-60`: Fetches checkout session + derives paid/unpaid status but does not clear cart
- `apps/cochlearfit/src/contexts/cart/cartStorage.ts:22-51`: Has `loadCart`/`saveCart` but no clear/remove helper

**Implementation:**
1. On thank-you page load, call cart clear API or clear localStorage
2. Verify Stripe session status before clearing (prevent clearing on revisit)

**Confidence:**
- Overall: 80%
- Implementation: 85% - LocalStorage cart is centralized; clear helper can be added safely
- Approach: 85% - Clear-on-paid is standard and avoids user confusion
- Impact: 80% - Frontend-only change but must be idempotent to avoid clearing on page revisit

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 85%
- **Updated confidence:** 80%
  - Implementation: 85% — Cart storage is centralized (`apps/cochlearfit/src/contexts/cart/cartStorage.ts:4-51`); ThankYouPanel already fetches session status (`apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx:36-60`).
  - Approach: 85% — Clear only when `paymentStatus === "paid"` to avoid wiping carts on failed/unpaid sessions.
  - Impact: 80% — Must be idempotent on revisit; ensure it only runs once per paid session (store a “cleared session_id” marker).
- **Investigation performed:**
  - Repo: `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx:18-60` (session fetch + status derivation)
  - Repo: `apps/cochlearfit/src/contexts/cart/cartStorage.ts:4-51` (storage key + current API)
- **Decision / resolution:** Clear cart only when session is verified paid; make clearing idempotent across revisits.
- **Changes to task:** Confidence adjusted + evidence added; test plan upgraded to explicit test contract.

**Acceptance:**
- [ ] Cart is empty after successful checkout
- [ ] Cart is NOT cleared on page revisit (idempotent)
- [ ] Test: Successful checkout clears cart

**Test contract:**
- **TC-01:** Thank-you page with `paymentStatus="paid"` → cart is cleared from localStorage
- **TC-02:** Thank-you page with `paymentStatus!="paid"` → cart is NOT cleared
- **TC-03:** Revisiting thank-you page with same `session_id` → no repeated side effects (idempotent)
- **Acceptance coverage:** TC-01 covers “clears cart on success”; TC-03 covers “not cleared on revisit”; TC-02 covers safety guard
- **Test type:** unit (component)
- **Test location:** `apps/cochlearfit/__tests__/components.checkout.test.tsx` (extend) or add `apps/cochlearfit/__tests__/thank-you-panel.test.tsx` (new)
- **Run:** `pnpm --filter @apps/cochlearfit test -- --testPathPattern=thank-you-panel`

**Rollout/rollback:** No flag needed - standard behavior

**Documentation impact:** None

---

### Phase 4: Platform Hardening (Post-Launch Acceptable)

---

#### COM-401: Central inventory fail-closed enforcement

**Type:** IMPLEMENT
**Effort:** M (3-5 files)
**Affects:**
- `packages/platform-core/src/inventoryValidation.ts`
- `packages/platform-core/src/repositories/settings.server.ts` (shop settings source-of-truth)
- `packages/platform-core/src/repositories/settings.json.server.ts`, `packages/platform-core/src/repositories/settings.prisma.server.ts`
- `packages/types/src/ShopSettings.ts` (schema for `requiresCentralInventory`)
- `packages/platform-core/src/utils/metrics.ts` (fallback alerting/metrics)

**Depends on:** COM-D03

**Problem:** Gap 5 from fact-find - Silent fallback to per-shop inventory when central is unavailable. No environment-specific policy.

**Implementation:**
1. Add `requiresCentralInventory` flag to shop settings schema + defaults
2. Define environment detection (DEV vs PROD) and enforcement flag wiring
3. Update `validateInventoryFromCentral` to apply the COM-D03 policy matrix for central-unavailable cases
4. Add logging/metrics for fallback (prod) and fail-closed events

**Confidence:**
- Overall: 80%
- Implementation: 80% - Policy is localized; settings + env patterns are already established
- Approach: 80% - Per-shop capability is flexible and aligns with fail-closed tenancy
- Impact: 80% - Blast radius is currently bounded to a single central-validation call site and an additive settings field

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 60%
- **Updated confidence:** 80%
  - Implementation: 80% — Central fallback behavior is localized (`packages/platform-core/src/inventoryValidation.ts:88-110`) and shop settings already have a repo + schema boundary (`packages/platform-core/src/repositories/settings.server.ts:19-40`, `packages/types/src/ShopSettings.ts:97-204`).
  - Approach: 80% — Per-shop `requiresCentralInventory` avoids a one-size-fits-all production policy (matches COM-D03 Option A).
  - Impact: 80% — `validateInventoryFromCentral` is only referenced by `packages/platform-core/src/cart/cartValidation.ts:252-255` (no other call sites found); settings changes are additive and covered by existing settings repo tests (`packages/platform-core/__tests__/settingsRepo.test.ts:23-113`).
- **Investigation performed:**
  - Repo: `packages/platform-core/src/inventoryValidation.ts:88-110` (fallback-to-shop behavior)
  - Repo: `packages/platform-core/src/cart/cartValidation.ts:246-296` (central validation boundary + error mapping)
  - Repo: `packages/platform-core/src/repositories/settings.server.ts:19-40` (settings backend selection)
  - Repo: `packages/platform-core/src/repositories/settings.json.server.ts:87-140` (defaults merge + safe parse)
  - Repo: `packages/platform-core/src/repositories/settings.prisma.server.ts:33-40` (strict schema parse)
  - Repo: `packages/platform-core/src/utils/metrics.ts:13-30` (env labeling + metric logging pattern)
  - Tests: `packages/platform-core/__tests__/settingsRepo.test.ts` (PASS; verifies defaults merge + resilience)
- **Decision / resolution:** Still blocked on COM-D03 final decision, but implementation can be prepared to match Option A behind an explicit enforcement flag (default off).
- **Changes to task:**
  - Clarified “central unavailable” cases to handle: module import failure, missing routing (allocations empty), and allocation query errors.
  - Strengthened test contract to cover the central-unavailable variants (not just the env matrix).

**Acceptance:**
- [ ] PROD + enforcement enabled + `requiresCentralInventory=true` + central unavailable → fail-closed (no fallback; error maps to 503 at API boundary)
- [ ] PROD + enforcement enabled + `requiresCentralInventory=false` + central unavailable → fallback to per-shop inventory
- [ ] DEV (`NODE_ENV !== "production"`) → fallback is always allowed regardless of flag
- [ ] Production fallback events emit an explicit metric/log entry (shopId + env)

**Test contract:**
- **TC-01:** PROD + enforcement enabled + `requiresCentralInventory=true` + central import fails → fail-closed (no fallback; surfaces as “unavailable”)
- **TC-02:** PROD + enforcement enabled + `requiresCentralInventory=false` + central import fails → fallback to `validateInventoryAvailability`
- **TC-03:** DEV + enforcement enabled + central import fails → fallback allowed regardless of shop flag
- **TC-04:** PROD + enforcement enabled + `requiresCentralInventory=true` + allocations empty (no routing) → fail-closed (no fallback)
- **TC-05:** PROD + enforcement enabled + `requiresCentralInventory=false` + allocation query throws → fallback allowed + fallback metric recorded
- **Acceptance coverage:** TC-01/TC-04 cover “fail-closed when required”; TC-02/TC-05 cover “fallback when allowed”; TC-03 covers “DEV fallback”
- **Test type:** unit (platform-core)
- **Test location:** `packages/platform-core/__tests__/inventoryValidation.failClosed.test.ts` (new)
- **Run:** `pnpm --filter @acme/platform-core test -- inventoryValidation.failClosed.test.ts`

**Rollout/rollback:**
- Feature flag: `ENFORCE_CENTRAL_INVENTORY` (default: false initially)
- Per-shop migration to `requiresCentralInventory: true`

**Documentation impact:** Update `docs/inventory-migration.md`

---

#### COM-402: Secure-cart storage migration

**Type:** INVESTIGATE
**Effort:** L (migration + storage changes)
**Affects:**
- `packages/platform-core/src/cartStore.ts`
- `packages/platform-core/src/cart/cartLineSecure.ts`
- `packages/platform-core/src/cart/migrate.ts`
- `packages/platform-core/src/cart/hydrate.ts`

**Depends on:** COM-101

**Problem:** Current cart store (`CartState`) stores hydrated SKU objects (legacy, mutable). Secure cart format exists (`CartStateSecure`) but is not wired.

**Confidence:**
- Overall: 55%
- Implementation: 65% - Secure format exists and storage hot-spots are now identified; migration sequencing across backends/consumers still needs design
- Approach: 70% - Secure-by-design is correct; aligns with repricing boundary work
- Impact: 55% - Affects all cart operations; needs explicit consumer audit + rollout plan

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 55% (IMPLEMENT)
- **Updated confidence:** 55% (INVESTIGATE)
  - Implementation: 65% — Secure types + migration helpers exist (`packages/platform-core/src/cart/cartLineSecure.ts:13-42`, `packages/platform-core/src/cart/migrate.ts:10-52`) and the storage hot-spots are explicit (Redis + DO both persist full SKU objects today).
  - Approach: 70% — Still the right direction, but not required for Phase 1 if repricing is enforced at checkout boundary.
  - Impact: 55% — Large blast radius; requires explicit consumer audit before implementation.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/cart/cartLineSecure.ts:13-42` (secure cart format)
  - Repo: `packages/platform-core/src/cart/migrate.ts:10-52` + `packages/platform-core/src/cart/hydrate.ts:20-59` (migration + hydration helpers already support dual formats)
  - Repo: `packages/platform-core/src/cartStore/redisStore.ts:63-107` (Redis persists full `SKU` object JSON today; needs secure serialization)
  - Repo: `packages/platform-core/src/cartStore/cloudflareDurableStore.ts:51-52` and `:177-199` (DO persists full `CartState` today; needs secure storage format)
  - Repo: `packages/platform-core/src/cartStore.ts:15-30` (store API currently requires `SKU` objects on write; migration likely needs a new secure write surface or wrapper)
  - Repo: `packages/platform-core/src/cartApi.ts:1-210` (edge cart API currently reads/writes legacy `CartState` with hydrated `SKU` objects; migration must account for this API surface)
  - Repo: `packages/template-app/src/api/cart/route.ts:10-15` + `apps/cover-me-pretty/src/api/cart/route.ts:11-18` + `apps/cms/src/app/api/cart/route.ts:1-30` (multiple cart API entrypoints exist; all currently return legacy cart shape)
  - Repo: `packages/ui/src/components/layout/Header.tsx:49-58` (server UI reads cart via `createCartStore().getCart()` and expects `CartLine.sku`)
  - Repo: `packages/platform-core/__tests__/cart.secureMigration.test.ts:1-153` (existing TODO stub scenarios)
- **Decision / resolution:** Convert to INVESTIGATE until consumer audit + migration strategy is fully specified.
- **Changes to task:** Type changed to INVESTIGATE; acceptance reframed to produce follow-on IMPLEMENT tasks with full test contracts.

**What would make this >=90%:**
- Complete consumer inventory + call-site map across `packages/platform-core` and tenant apps
- Decide migration strategy (lazy-on-read vs dual-write window) with rollback story
- Convert TODO stubs into red/green tests to lock the migration behavior

**Blockers / questions to answer:**
- Which cart consumers expect hydrated `SKU` objects today (platform-core + tenant apps)?
- Which storage backends are in use in production (memory/Redis/DO), and how will migration be rolled out safely?
- Do we need dual-write, or can we do lazy migration on read with a safe rollback?

**Acceptance (investigation outputs):**
- [ ] Produce a cart consumer inventory (files + call sites) and identify required refactors
- [ ] Document current storage formats per backend (Memory/Redis/DO) and where SKU objects are persisted (so migration can be staged safely)
- [ ] Propose a migration strategy + rollback plan (flag behavior, dual-write vs lazy)
- [ ] Split follow-on work into IMPLEMENT tasks (new COM-4xx IDs) each with:
  - acceptance criteria
  - enumerated test contracts (TC-XX)
  - affected files + rollout/rollback

**Documentation impact:** Update `docs/persistence.md` with cart format (after implementation approach is selected)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hold idempotency introduces race conditions | Medium | High | DB unique constraint, transaction isolation, comprehensive testing |
| Rate limiting blocks legitimate high-volume customers | Low | Medium | Configurable limits, monitoring, bypass for authenticated users |
| CochlearFit static export incompatible with platform APIs | Medium | High | Spike early (COM-D01), design hybrid approach |
| Repricing rejects too many checkouts due to price drift | Low | Medium | Configurable threshold ($0.10 not $0.01), monitoring, gradual rollout |
| Database migration for idempotency key causes downtime | Low | High | Additive migration, no breaking changes |
| Releasing hold on unknown Stripe errors causes oversell | High | High | Error classification (COM-103), fail-safe to NOT release on unknown |
| Workers rate limiter doesn't work like Node version | Medium | Medium | COM-D04 decision, use native Cloudflare options |

---

## Observability

### Metrics to Add

| Metric | Type | Description |
|--------|------|-------------|
| `cart_reprice_drift_total` | Counter | Price drift detected during repricing |
| `inventory_hold_idempotent_hit_total` | Counter | Existing hold returned (idempotency) |
| `inventory_hold_orphaned_total` | Counter | Holds released due to definitive Stripe failure |
| `checkout_rate_limited_total` | Counter | Checkout requests rate limited |
| `webhook_tenant_mismatch_total` | Counter | Webhook tenant assertion failures |
| `webhook_tenant_unresolvable_total` | Counter | Webhook tenant could not be resolved |
| `stripe_error_classification_total` | Counter | Stripe errors by classification (definitive vs unknown) |

### Dashboards

- Checkout success/failure rates by shop
- Hold lifecycle (created -> committed/released/expired)
- Rate limiting effectiveness
- Inventory validation latency

### Alerts

- Hold expiration rate > 10% (indicates Stripe failures or long checkout times)
- Tenant mismatch events (security concern)
- Rate limiting > 1% of traffic (may indicate attack or misconfiguration)

---

## Overall Acceptance Criteria

1. **Phase 1 complete:** Checkout uses authoritative prices, holds are idempotent with DB uniqueness, rate limiting active
2. **Phase 2 complete:** Unified inventory contract with fail-closed mismatch rules, webhook tenant assertions in place
3. **Phase 3 complete:** CochlearFit checkout works end-to-end with platform primitives
4. **All tests pass:** Contract tests + repricing tests + idempotency tests (no TODO stubs)
5. **Monitoring active:** All new metrics visible in dashboards

---

## Decision Log

| Date | Decision | Rationale | Reference |
|------|----------|-----------|-----------|
| 2026-02-01 | Plan created | Based on commerce-core-readiness-fact-find.md | This document |
| 2026-02-01 | Plan revised | Address correctness, safety, and sequencing issues | Issues 1-12 |
| 2026-02-02 | Re-plan update applied | Added test contracts + corrected confidence math; converted COM-302/COM-402 to INVESTIGATE | Re-plan Updates in tasks |
| 2026-02-02 | Investigation pass | Identified inventory-hold stub gaps + clarified D04/D05 evidence | Re-plan Updates in tasks |
| 2026-02-02 | Investigation pass | Mapped COM-401 blast radius + confirmed shop settings source-of-truth and env/metrics patterns | COM-401 Re-plan Update |
| 2026-02-02 | Investigation pass | Mapped COM-104/COM-302/COM-402 routing + storage constraints; tightened test/rollout assumptions | Re-plan Updates in tasks |
| 2026-02-03 | Investigation pass | Clarified Cloudflare storage primitives and expanded evidence for COM-D04/COM-104/COM-302/COM-402 | Re-plan Updates in tasks |
| TBD | COM-D01: CochlearFit Architecture | Pending | - |
| TBD | COM-D02: Checkout Mode | Pending | - |
| TBD | COM-D03: Inventory Enforcement | Pending | - |
| TBD | COM-D04: Gateway Rate Limiting Backend | Pending | - |
| TBD | COM-D05: Stripe Account Topology | Pending | - |

---

## Existing TODO Tests

These files currently use `it.todo()` and **do not satisfy the TDD gate**. Convert them into enforcing tests (red/green) before treating the corresponding L-effort work as build-ready.

- COM-102: `packages/platform-core/__tests__/inventoryHolds.idempotency.test.ts`
- COM-402 (follow-on): `packages/platform-core/__tests__/cart.secureMigration.test.ts`

---

## Confidence Calculation

| Task | Effort Weight | Impl | Approach | Impact | Overall (min) | Weighted |
|------|---------------|------|----------|--------|---------------|----------|
| COM-D01 | 1 | 85% | 75% | 80% | 75% | 0.75 |
| COM-D02 | 1 | 90% | 70% | 80% | 70% | 0.70 |
| COM-D03 | 1 | 90% | 85% | 80% | 80% | 0.80 |
| COM-D04 | 1 | 80% | 60% | 70% | 60% | 0.60 |
| COM-D05 | 1 | 80% | 70% | 70% | 70% | 0.70 |
| COM-101 | 2 | 85% | 90% | 80% | 80% | 1.60 |
| COM-102 | 3 | 70% | 75% | 70% | 70% | 2.10 |
| COM-103 | 1 | 80% | 85% | 80% | 80% | 0.80 |
| COM-104 | 2 | 80% | 60% | 75% | 60% | 1.20 |
| COM-201 | 2 | 85% | 85% | 80% | 80% | 1.60 |
| COM-202 | 2 | 85% | 85% | 80% | 80% | 1.60 |
| COM-203 | 2 | 85% | 85% | 80% | 80% | 1.60 |
| COM-204 | 1 | 90% | 90% | 85% | 85% | 0.85 |
| COM-301 | 1 | 80% | 60% | 70% | 60% | 0.60 |
| COM-302 | 3 | 65% | 55% | 60% | 55% | 1.65 |
| COM-303 | 1 | 85% | 85% | 80% | 80% | 0.80 |
| COM-401 | 2 | 80% | 80% | 80% | 80% | 1.60 |
| COM-402 | 3 | 65% | 70% | 55% | 55% | 1.65 |

**Total weight:** 30
**Total weighted confidence:** 21.20
**Weighted average:** 21.20 / 30 = **70.7%** → **71%** (reported in frontmatter)

---

## Re-plan Handoff (2026-02-02)

- **Ready to build (≥80% + test contracts):** - (none; complete COM-D0x decisions + re-plan COM-102 next)
- **Ready after dependencies:** COM-401 (after COM-D03)
- **Needs re-plan before build:** COM-102 (L-effort; TODO stubs must become enforcing tests), COM-104 (blocked on COM-D04), COM-301 (blocked on COM-D05)
- **Investigation required:** COM-302, COM-402

---

## Next Steps

1. Resolve Phase 0 decisions (start with COM-D04 + COM-D05; COM-D03 unblocks COM-401)
2. Re-plan COM-102 once TODO stubs are converted to enforcing tests; then proceed with idempotent holds + Stripe failure classification (COM-103)
3. After COM-D03, build COM-401 (central inventory fail-closed enforcement)

---

## Build Progress

| Date | Task | Status | Commit | Notes |
|------|------|--------|--------|-------|
| 2026-02-03 | COM-204 | Done | f4c4216159 | Added sale-mode checkout-session integration coverage; fixed template-app Jest `@auth` mapping |
| 2026-02-03 | COM-201 | Done | 03b45c32fc | Unified inventory validate request contract, added strict mismatch checks, and documented the shared API contract |
| 2026-02-03 | COM-202 | Done | 4c916f54c5 | Enforced fail-closed webhook tenant assertion with mismatch/unresolvable tests and metrics |
| 2026-02-03 | COM-203 | Done | effdeb6053 | Added contract tests for CMS + tenant inventory validate routes (canonical + deprecated shapes + fail-closed mismatches) |
| 2026-02-03 | COM-101 | Done | 265a971b6b | Enforced checkout repricing at session creation with drift detection + optional `PRICE_CHANGED` rejection |
