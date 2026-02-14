---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Feature-Slug: cochlearfit-deployment-readiness
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 69%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: HEAD
Card-ID:
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# Cochlear Fit Deployment Readiness Plan

## Summary

Deploy the Cochlear Fit e-commerce website to production with full checkout functionality. The frontend cart and Stripe integration are production-ready, but **the Worker catalog is hardcoded with placeholder Stripe Price IDs** (critical blocker). Implementation requires: Stripe account setup, Worker catalog bundling system, inventory validation API configuration, email receipt implementation, data file population, and staging/production deployment.

**Architecture:** Cloudflare Pages (frontend) + Cloudflare Worker (checkout API) + Stripe Checkout (payments) + Email service (receipts) + Inventory Authority API (stock validation). Same Worker codebase deployed as two Wrangler environments (staging + production) with isolated secrets + KV namespaces; routing uses same-origin `/api/*` on production custom domain (free tier: 100k requests/day shared across both Workers).

**Timeline:** 9-14 business days (depends on Stripe account verification).

## Goals

- Fix Worker catalog hardcoding blocker with build-time bundling system
- Deploy functional e-commerce checkout to production
- Implement inventory validation before checkout (launch requirement)
- Implement email order confirmations (launch requirement)
- Set up Stripe accounts (staging + production or test/live mode)
- Configure all secrets and environment variables securely
- Run end-to-end staging tests before production deployment
- Monitor first 5 production orders for errors

## Non-goals

- Redesigning cart or checkout architecture (already production-quality)
- Adding features beyond core e-commerce (order history, multi-currency, discounts)
- Implementing abandoned cart recovery or advanced analytics
- Building admin dashboard or inventory management UI
- Multi-language support (English only for MVP)

## Constraints & Assumptions

**Constraints:**
- Must maintain existing architecture (Cloudflare Pages + Worker backend)
- Must use Stripe Checkout hosted payment flow (already implemented)
- Must validate inventory against external authority API before go-live
- Must send email order confirmations before go-live
- Data files must follow existing schema contracts in `cochlearfitCatalog.server.ts`
- **Cloudflare free tier:** 100k requests/day (all Workers combined), 1k KV writes/day, 100k KV reads/day
- CORS policy: `PAGES_ORIGIN` is comma-separated allowlist
- **Secrets policy:** Never commit secret values to repo; docs may list secret names and locations only (store values in 1Password/Cloudflare secrets)
- **Fulfillment:** Orders fulfilled manually from Stripe Dashboard (CSV export) — no automated shipping integration for MVP

**Assumptions:**
- Stripe account setup will take 1-3 days (business verification)
- Inventory authority API will be configured before launch
- Email service provider (Resend or SendGrid) will be chosen during implementation
- Product catalog data is available in some format (needs JSON transformation)
- Cloudflare Workers KV namespace can be provisioned
- Sender email domain DNS can be configured

## Fact-Find Reference

- Related brief: `docs/plans/cochlearfit-deployment-readiness/fact-find.md`
- Key findings:
  - Frontend cart/checkout are production-ready (comprehensive tests exist)
  - **CRITICAL BLOCKER:** Worker catalog hardcoded with placeholder Stripe Price IDs (lines 122-128 of `apps/cochlearfit-worker/src/index.ts`)
  - Customer email available via `session.customer_details.email` (nested field, retrieve session with `expand[]=line_items` for order details)
  - Secrets committed in `wrangler.toml` (security issue, must fix)
  - Worker has zero tests (must add minimal tests before launch)
  - Wrangler environments needed (not runtime URL detection)
  - CORS handling documented (falls back to first origin if missing/not allowed)

## Existing System Notes

**Key modules/files:**

Frontend (Production-ready):
- `apps/cochlearfit/src/contexts/cart/` — Cart Context + Reducer (complete)
- `apps/cochlearfit/src/lib/cart.ts` — Totals calculation
- `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts` — Server catalog loader (lines 14-51: schemas, 206-216: fallback behavior)
- `apps/cochlearfit/src/data/products.ts` — In-repo fallback catalog
- `apps/cochlearfit/src/app/[lang]/checkout/page.tsx` — Checkout page

Worker (Needs fixes):
- `apps/cochlearfit-worker/src/index.ts` — Checkout API
  - Lines 122-128: **HARDCODED CATALOG** (blocker)
  - Lines 204-244: Inventory validation logic
  - Lines 262-305: Stripe session creation
  - Lines 307-331: Stripe session retrieval (retrieve with `expand[]=line_items` for order details; customer email is in `customer_details.email` nested field)
  - Lines 333-360: Webhook signature verification
  - Lines 64-90: Order record builder (needs `customerEmail` field)
- `apps/cochlearfit-worker/wrangler.toml` — Configuration (lines 9-14: committed secrets)

**Patterns to follow:**
- Cart architecture: existing Context + Reducer pattern (no changes)
- Data schemas: `CochlearfitProductRecord`, `VariantPricingRecord`, `InventoryRecord` (lines 14-51 of `cochlearfitCatalog.server.ts`)
- Fallback behavior: Falls back to in-repo `products.ts` if `products.json` missing (line 206-216)
- Secrets: Use `wrangler secret put --env <staging|production>` (never commit)
- Environments: Wrangler manages separate deployments (no runtime detection)

## Proposed Approach

**Build-time catalog bundling** (Decision 6 from fact-find):
- Create `scripts/bundle-worker-catalog.ts` to generate `worker-catalog.generated.ts` from `data/shops/cochlearfit/*.json`
- Add validation: fail build if Stripe Price IDs missing or malformed
- Run as prebuild step in Worker package.json
- Replace hardcoded `buildVariants()` calls with `import { catalog } from './worker-catalog.generated'`
- Generated file excluded from git, regenerated on every build
- **Single source of truth:** Frontend and Worker read from same data files

**Wrangler environments for staging/production** (Decision 4 revised):
- Use Wrangler `[env.staging]` and `[env.production]` sections in `wrangler.toml`
- Separate deployment targets: `wrangler deploy --env staging` / `wrangler deploy --env production`
- Separate KV namespaces (true isolation — no runtime detection, no key prefixes)
- Separate secrets per environment (no suffixes — Wrangler manages per-env secrets)
- Eliminates runtime URL detection fragility
- Same 100k requests/day cap (shared across all Workers), but better isolation

**Routing Strategy** (same-origin to avoid CORS):
- **Production:** Route `cochlearfit.com/api/*` to Worker (via Cloudflare zone route), Pages serves `cochlearfit.com/*`
- **Staging:** Use real staging domain `staging.cochlearfit.com` with same routing pattern, OR accept cross-origin calls from `*.pages.dev` to Worker with strict CORS
- **Workers.dev URLs are for development only** — production traffic uses custom domain routes
- Same-origin routing eliminates CORS complexity (recommended Cloudflare pattern)
- Worker name format: `cochlearfit-worker-staging` / `cochlearfit-worker-production` (derives `<account>.workers.dev` URLs for dev testing)

**Email recipient from Stripe session** (Decision 7 corrected):
- Read `session.customer_details.email` from webhook payload (nested field, always included in session object)
- Retrieve session with `expand[]=line_items` to get itemized order details (product names, quantities, prices)
- `customer_details` is a nested object on the session, not an expandable linked resource
- No frontend changes (Stripe Checkout already collects email)

**Stripe API version pinning** (Decision 5 updated):
- Pin to Stripe API version matching account default (check Stripe Dashboard → Developers → API version)
- Add `Stripe-Version` header to all API calls: `"Stripe-Version": "<account-pinned-version>"`
- Format: `"YYYY-MM-DD.release"` (e.g., `"2026-01-28.clover"` — use exact string from dashboard)
- Include webhook endpoint version alignment (Stripe webhooks have their own version pin — configure in webhook settings)

**Critical path:**
1. Stripe account setup (Phase 1) — longest lead time due to verification
2. Worker catalog bundling (Phase 2) — **BLOCKER**, depends on Stripe Price IDs
3. Email service integration (Phase 3) — launch requirement
4. Data files + secrets config (Phase 4) — depends on Stripe Price IDs
5. Staging deployment + tests (Phase 5) — gate before production
6. Production deployment (Phase 6) — final go-live

## Capacity & Limits

**Cloudflare Free Tier:**
- **Workers requests:** 100k/day across all Worker scripts (staging + production combined)
- **KV writes:** 1,000/day (across all namespaces)
- **KV reads:** 100,000/day (across all namespaces)

**Expected Usage Model:**
- **Order volume estimate:** 10-50 orders/day initially (well below caps)
- **KV operations per order:**
  - 1 write: order record (`orders:{orderId}`)
  - 1 read: idempotency check (`webhook_events:{eventId}`)
  - 1 write: idempotency marker (`webhook_events:{eventId}`)
  - **Total:** 2 writes + 1 read per order
- **Scaling capacity:** Can handle ~500 orders/day before hitting KV write cap (1000 / 2 writes per order)

**Failure Modes:**
- **KV write failure:** Return 500 to Stripe webhook (triggers retry with idempotency protection)
- **Request cap exceeded (100k/day):** Cloudflare returns 1027 error page (fail closed) or bypasses Worker (fail open, configured per route); resets at midnight UTC
- **KV read failure:** Webhook processes anyway (risk of duplicate order if idempotency check fails — acceptable with order ID uniqueness constraint)

**Monitoring Thresholds:**
- Alert if daily requests > 80k (80% of cap)
- Alert if daily KV writes > 800 (80% of cap)
- Alert if KV write errors > 0 in 10-minute window

## Webhook Correctness Contract

**Required guarantees (pre-launch):**

1. **Idempotency:** Use Stripe `session.id` as stable order key (idempotent by construction)
   - Define `orderId = session.id` (stable Stripe identifier)
   - Store order record as `ORDERS.put("orders:" + session.id, JSON.stringify(order))`
   - Repeated webhook processing overwrites same key with same data (safe)
   - **Best-effort event deduplication:** Check KV for `webhook_events:{event.id}` before processing
     - If exists: return 200 immediately (already processed)
     - If not exists: process order → persist order → mark event processed
   - **KV eventual consistency:** Event marker may be stale during rapid retries; order key idempotency provides safety net

2. **Persistence failure handling:**
   - If order persistence fails: return 500 (Stripe retries, safe with idempotent order key)
   - If order write succeeds but event marker write fails: return 200 (prevents infinite retry loop; duplicate order writes are safe because order key is session.id)

3. **Email failure handling:**
   - Email send failures: log error, return 200 (don't block webhook)
   - Email service unavailable: queue for retry (or manual follow-up from Stripe Dashboard)

4. **Inventory re-check policy:**
   - **MVP decision:** Do NOT re-check inventory at webhook time (accept oversell risk)
   - Inventory checked at session creation only
   - **Post-MVP:** Add webhook inventory re-check + automatic refund if out-of-stock

5. **Stripe signature verification:**
   - Must verify webhook signature before processing
   - Invalid signature: return 401 (not 200)
   - Signature mismatch: log incident, alert team

## Security Requirements

**Beyond secret management:**

1. **Secret rotation after committed secrets removed:**
   - Assume compromise of any secrets previously in `wrangler.toml`
   - Rotate: Stripe keys, inventory API token, email service key
   - Update all secrets in Cloudflare dashboard + external services

2. **Log scrubbing (PII protection):**
   - Do NOT log: full customer email, shipping address, payment details
   - OK to log: order ID, SKU, quantity, anonymized customer ID (last 4 of email: `****@domain.com`)
   - Worker logs are public in Cloudflare dashboard — treat as untrusted

3. **Rate limiting (abuse prevention):**
   - **MVP:** Rely on Stripe's built-in rate limits (no additional Worker-level limiting)
   - **Post-MVP:** Consider KV-based per-IP rate limiting (10 session creates per IP per minute) — adds KV read+write per attempt, can exhaust 1k writes/day cap during bot activity
   - Bots can spam session creation → costs Stripe API calls (rate limited by Stripe)

4. **Input validation:**
   - Validate all JSON payloads before processing (malformed JSON → 400)
   - Validate SKUs against catalog (unknown SKU → 400)
   - Validate quantities (< 1 or > 10 → 400)

5. **Origin allowlist (browser-based abuse prevention):**
   - Only allow `PAGES_ORIGIN` domains (staging + production Pages URLs)
   - Reject requests from unknown origins (reduces browser-based abuse, e.g., unauthorized API calls from unrelated sites)
   - **Note:** Production uses same-origin `/api/*` routing (no CORS needed); staging may use cross-origin Workers.dev URL (strict CORS required)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Set up Stripe account and products | 75% | M | Pending | TASK-19 | TASK-08, TASK-09 |
| TASK-02 | IMPLEMENT | Set up inventory authority API | 70% | M | Pending | TASK-20, TASK-22 | TASK-09 |
| TASK-03 | IMPLEMENT | Select and configure email service | 75% | M | Blocked (2026-02-14) | - | TASK-06, TASK-07, TASK-09 |
| TASK-04 | IMPLEMENT | Implement build-time catalog bundling system | 85% | L | Complete (2026-02-14) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Replace hardcoded catalog with generated import | 90% | M | Complete (2026-02-14) | TASK-04 | TASK-09 |
| TASK-06 | IMPLEMENT | Create email receipt template | 85% | M | Pending | TASK-03 | TASK-07 |
| TASK-07 | IMPLEMENT | Implement email sending in Worker webhook | 80% | L | Pending | TASK-03, TASK-06 | TASK-10 |
| TASK-08 | IMPLEMENT | Populate production data files with real Price IDs | 85% | S | Pending | TASK-01 | TASK-09 |
| TASK-09 | IMPLEMENT | Configure Worker secrets and environment variables | 75% | M | Pending | TASK-01, TASK-02, TASK-03, TASK-17 | TASK-10 |
| TASK-10 | IMPLEMENT | Deploy Worker and frontend to staging | 80% | M | Pending | TASK-07, TASK-09 | TASK-11 |
| TASK-11 | IMPLEMENT | Run end-to-end staging tests | 85% | M | Pending | TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Deploy frontend to production | 90% | S | Pending | TASK-11 | TASK-13 |
| TASK-13 | IMPLEMENT | Run production smoke test | 85% | S | Pending | TASK-12 | TASK-16 |
| TASK-14 | IMPLEMENT | Add minimal Worker tests (pre-launch) | 80% | S | Complete (2026-02-14) | TASK-18, TASK-21 | TASK-12 |
| TASK-15 | IMPLEMENT | Document fulfillment runbook (draft pre-launch) | 85% | S | Pending | TASK-01 | - |
| TASK-16 | IMPLEMENT | Add comprehensive Worker tests (post-launch) | 70% ⚠️ | M | Pending | TASK-13 | - |
| TASK-17 | IMPLEMENT | Sanitize wrangler.toml + add env topology (no committed secrets) | 85% | M | Complete (2026-02-14) | TASK-05 | TASK-09, TASK-10 |
| TASK-18 | SPIKE | Spike: Jest test harness for cochlearfit-worker | 82% | S | Complete (2026-02-14) | TASK-05 | TASK-14 |
| TASK-19 | INVESTIGATE | Stripe setup memo + stripe-setup.md scaffold | 85% | S | Complete (2026-02-14) | - | TASK-01, TASK-08, TASK-09 |
| TASK-20 | INVESTIGATE | Inventory authority API contract memo + inventory-api.md scaffold | 85% | S | Complete (2026-02-14) | - | TASK-02, TASK-09 |
| TASK-21 | IMPLEMENT | Fix ESLint flat-config crash (unblock Worker lint) | 85% | S | Complete (2026-02-14) | - | TASK-14 |
| TASK-22 | IMPLEMENT | Add `x-shop-id` to inventory authority requests (Worker) | 85% | M | Complete (2026-02-14) | TASK-18, TASK-21 | TASK-02 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-17, TASK-18, TASK-19, TASK-20, TASK-21, TASK-22 | TASK-05 (for 17,18) | Internal hardening + precursors (no external accounts required) |
| 2 | TASK-01, TASK-02, TASK-03 | Wave 1: TASK-19 (for 01); TASK-20, TASK-22 (for 02) | External setup tasks (Stripe/Inventory/Email). TASK-03 remains blocked by domain + business timing |
| 3 | TASK-06, TASK-08, TASK-15 | Wave 2: TASK-03 (for 06); TASK-01 (for 08,15) | Email template, real price IDs in data files, fulfillment runbook |
| 4 | TASK-07 | Wave 3: TASK-06; Wave 2: TASK-03 | Email sending in webhook |
| 5 | TASK-09 | Wave 1: TASK-17; Wave 2: TASK-01, TASK-02, TASK-03 | Secrets/KV provisioning (external) |
| 6 | TASK-10 | Wave 5: TASK-09; Wave 4: TASK-07 | Deploy to staging |
| 7 | TASK-11, TASK-14 | Wave 6: TASK-10; Wave 1: TASK-18 (for 14) | E2E staging tests + Worker unit tests |
| 8 | TASK-12 | Wave 7: TASK-11, TASK-14 | Deploy to production |
| 9 | TASK-13 | Wave 8: TASK-12 | Production smoke test |
| 10 | TASK-16 | Wave 9: TASK-13 | Post-launch comprehensive tests |

**Max parallelism:** 6 (Wave 1)
**Critical path (to production):** TASK-19 -> TASK-01 -> TASK-08 -> TASK-17 -> TASK-22 -> TASK-02 -> TASK-09 -> TASK-10 -> TASK-11 -> TASK-12 -> TASK-13
**Total tasks:** 21

## Tasks

### TASK-01: Set up Stripe account and products
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** External (Stripe Dashboard), `docs/plans/cochlearfit-deployment-readiness/stripe-setup.md`
- **Depends on:** TASK-19
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 75%
  - Implementation: 80% — Stripe Dashboard is well-documented, straightforward product/variant setup
  - Approach: 75% — Standard Stripe Checkout pattern, but account verification adds uncertainty
  - Impact: 70% — Account verification can take 1-3 days (blocks critical path), webhook configuration requires DNS

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 75%
- **Updated confidence:** 75% (no uplift; external setup still required)
  - **Evidence class:** E1 (plan/contract audit)
- **Investigation performed:**
  - Verified current constraint: `cochlearfit.com` is NXDOMAIN on 2026-02-14 (public DNS).
- **Decision / resolution:**
  - Added TASK-19 (INVESTIGATE) as explicit precursor for `stripe-setup.md` scaffolding.
- **Changes to task:**
  - Dependencies: now depends on TASK-19


- **Acceptance:**
  - [ ] Stripe account created (or access granted to existing account)
  - [ ] Test mode enabled with API keys generated (secret key, publishable key)
  - [ ] Production mode enabled with API keys generated (secret key, publishable key)
  - [ ] 2 products created in Stripe Dashboard: "Classic Sound Sleeve", "Sport Sound Sleeve"
  - [ ] 12 variants created (kids/adult × sand/ocean/berry for each product)
  - [ ] All 12 Stripe Price IDs documented in `docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` (Price IDs are safe to commit)
  - [ ] Webhook endpoints configured (URLs noted in doc, but using placeholder hostnames — actual Workers.dev URL depends on account subdomain)
  - [ ] Test webhook delivery verified with Stripe CLI: `stripe listen --forward-to localhost:8788/api/stripe/webhook`
  - [ ] **Secret values stored securely:** Test/production secret keys + webhook secrets stored in 1Password (never commit values to repo)
- **Validation contract:**
  - TC-01: Stripe Dashboard login → products visible → 2 products exist with 6 variants each
  - TC-02: Stripe CLI `stripe listen` → webhook event forwarded → returns 200 (Worker receives event)
  - TC-03: Test mode API call → `POST https://api.stripe.com/v1/checkout/sessions` with test secret key → session created successfully
  - TC-04: Webhook secret verification → test signature with `stripe trigger checkout.session.completed` → signature validates correctly
  - **Acceptance coverage:** TC-01 covers products/variants, TC-02+TC-04 cover webhook config, TC-03 covers API keys
  - **Validation type:** manual verification + CLI testing
  - **Run/verify:** Stripe Dashboard visual check + `stripe listen` + `stripe trigger` commands
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First webhook attempt will fail signature verification (no webhook secret configured yet)
  - **Green evidence:** After configuring webhook secret and endpoint, `stripe trigger checkout.session.completed` returns 200 from Worker
  - **Refactor evidence:** Document webhook secrets and Price IDs in standalone doc (not in code comments)
- **Planning validation:**
  - Checks run: Reviewed Stripe documentation for Checkout setup, webhook configuration, and product/variant API
  - Unexpected findings: None (standard Stripe Checkout pattern)
- **What would make this ≥90%:** Complete account verification early (start immediately), have backup plan for webhook DNS if custom domain not ready (use Workers.dev subdomain first)
- **Rollout / rollback:**
  - Rollout: No code deployment for this task; purely Stripe Dashboard configuration
  - Rollback: N/A (configuration changes are non-destructive; can delete products/webhooks if needed)
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` with:
    - Account details (email, account ID)
    - Test mode keys (secret, publishable, webhook secret)
    - Production mode keys (secret, publishable, webhook secret)
    - Product IDs and names
    - All 12 Price IDs in table format (product, size, color, Price ID)
    - Webhook endpoint URLs (test + production)
- **Notes / references:**
  - Stripe Checkout docs: https://stripe.com/docs/payments/checkout
  - Stripe webhook docs: https://stripe.com/docs/webhooks
  - Stripe CLI: https://stripe.com/docs/stripe-cli
  - Estimated lead time: 1-3 days for business verification

### TASK-02: Set up inventory authority API
- **Type:** IMPLEMENT
- **Deliverable:** code-change + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** External (Inventory API deployment), `docs/plans/cochlearfit-deployment-readiness/inventory-api.md`
- **Depends on:** TASK-20, TASK-22
- **Blocks:** TASK-09
- **Confidence:** 70%
  - Implementation: 70% — Contract has a `shopId` requirement in the existing authority endpoint; Worker must send shop context (TASK-22) before this can be validated end-to-end
  - Approach: 70% — Authority endpoint exists in-repo (`apps/cms`), but deployment/hosting decision is still external
  - Impact: 65% — Inventory is a launch blocker; missing shop context manifests as hard 400/503 failures during checkout

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 70%
- **Updated confidence:** 70% (no uplift; external API may be greenfield)
  - **Evidence class:** E1 (code audit)
- **Investigation performed:**
  - Worker inventory contract is explicit in `apps/cochlearfit-worker/src/index.ts:170-194`.
- **Decision / resolution:**
  - Added TASK-20 (INVESTIGATE) to create `inventory-api.md` scaffold before provisioning.
- **Changes to task:**
  - Dependencies: now depends on TASK-20
  - Correctness note: Worker currently fails closed (503) when inventory URL/token missing; plan should not claim inventory can be disabled by empty URL without a code change.

#### Re-plan Update (2026-02-14) — Inventory shopId mismatch
- **Previous confidence:** 70%
- **Updated confidence:** 70% (no uplift; discovered a blocking contract mismatch)
  - **Evidence class:** E2 (executable verification + code audit)
- **Investigation performed:**
  - Authority endpoint requires `shopId` via `x-shop-id` header or body: `apps/cms/src/app/api/inventory/validate/route.ts:65-80`.
  - Authority contract is test-covered: `apps/cms/__tests__/inventory-validate.test.ts` (PASS via `pnpm --filter @apps/cms test -- apps/cms/__tests__/inventory-validate.test.ts`).
  - Cochlearfit Worker currently omits `shopId` (no header/body): `apps/cochlearfit-worker/src/index.ts:180-187`.
- **Decision / resolution:**
  - Create TASK-22 to add `x-shop-id: cochlearfit` to Worker inventory authority requests, and update `inventory-api.md` to include shop context requirements.
- **Changes to task:**
  - Dependencies: now depends on TASK-22 (in addition to TASK-20) so TASK-02 cannot be "done" while the Worker payload is incompatible with the authority contract.
  - Acceptance/validation: updated below to include `shopId` requirement.

- **Acceptance:**
  - [ ] API endpoint deployed and accessible (e.g., `https://inventory-api.example.com`)
  - [ ] Authentication token generated (Bearer token)
  - [ ] Contract implemented: `POST /api/inventory/validate` requires shop context:
    - `x-shop-id: <shopId>` header OR body `shopId` field (if both provided, they must match)
  - [ ] Request body accepts payload (Worker-compatible):
    ```json
    {
      "items": [{
        "sku": "variant-id",
        "quantity": 1,
        "variantAttributes": { "size": "adult" }
      }]
    }
    ```
    - Optional: `shopId` may also be provided in the body (but is not required when `x-shop-id` is present)
  - [ ] Response codes: 200 (OK), 409 (Insufficient stock), 503 (Service unavailable)
  - [ ] Test SKUs return expected validation results (in-stock → 200, out-of-stock → 409)
  - [ ] API contract documented in `docs/plans/cochlearfit-deployment-readiness/inventory-api.md`
  - [ ] Error responses (409, 503) tested with sample payloads
- **Validation contract:**
  - TC-01: In-stock validation → POST with available SKU → returns 200
  - TC-02: Out-of-stock validation → POST with unavailable SKU → returns 409
  - TC-03: Authentication → POST without Bearer token → returns 401
  - TC-04: Malformed payload → POST with invalid JSON → returns 400
  - TC-05: Missing shop context → POST without `x-shop-id` and without `shopId` → returns 400
  - TC-06: Service unavailable → API down or slow → returns 503 or times out
  - **Acceptance coverage:** TC-01+TC-02 cover validation logic, TC-03 covers auth, TC-04 covers error handling, TC-05 covers shop context requirement, TC-06 covers availability
  - **Validation type:** integration testing (manual API calls with curl/Postman)
  - **Run/verify:** `curl -X POST -H "x-shop-id: cochlearfit" -H "Authorization: Bearer TOKEN" -d '{"items":[...]}' https://inventory-api.example.com/api/inventory/validate`
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First API call will fail 401 (no auth token configured)
  - **Green evidence:** After adding Bearer token middleware, test SKU returns 200 (in-stock) and 409 (out-of-stock)
  - **Refactor evidence:** Add request logging for debugging, error response includes helpful message
- **Planning validation:**
  - Checks run: Reviewed Worker inventory validation logic (lines 204-244 of `apps/cochlearfit-worker/src/index.ts`)
  - Unexpected findings: None (contract is clear from Worker code)
- **What would make this ≥90%:** Confirm if API already exists (reuse existing inventory system) or needs greenfield build; if greenfield, clarify hosting platform and data source
- **Rollout / rollback:**
  - Rollout: Deploy API to hosting platform (e.g., Cloudflare Worker, Vercel, AWS Lambda)
  - Rollback: Revert API deployment if issues found during testing; the Worker currently fails closed (503) when inventory config is missing, so there is no safe "disable" rollback without a code change
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/inventory-api.md` with:
    - API endpoint URL
    - Authentication method (Bearer token)
    - Request/response contract with examples
    - Error codes and meanings
    - Test SKUs for staging validation
- **Notes / references:**
  - Worker inventory validation logic: `apps/cochlearfit-worker/src/index.ts:170-194`
  - Payload format: `{ items: [{ sku, quantity, variantAttributes }] }`
  - Launch requirement per user decision

### TASK-22: Add `x-shop-id` to inventory authority requests (Worker)
- **Type:** IMPLEMENT
- **Deliverable:** code-change + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/index.ts`
  - `apps/cochlearfit-worker/src/__tests__/inventory-authority-shop-id.test.ts` (new)
  - `docs/plans/cochlearfit-deployment-readiness/inventory-api.md`
- **Depends on:** TASK-18, TASK-21
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — Single callsite; add header + unit test around fetch invocation
  - Approach: 85% — Worker is single-tenant (cochlearfit), so an explicit shop id is acceptable; document the contract in `inventory-api.md`
  - Impact: 85% — Without shop context the authority rejects requests (400), cascading into 503 checkout failures

#### Re-plan Update (2026-02-14) — Effort correction
- **Previous effort:** S
- **Updated effort:** M
  - Reason: Task explicitly affects 3 files (runtime code + tests + contract memo), which exceeds the S-effort guardrail.
- **Acceptance:**
  - [ ] Worker sends `x-shop-id: cochlearfit` on inventory authority requests.
  - [ ] Unit test asserts the header is present and stable.
  - [ ] `inventory-api.md` updated to include the shop context requirement (header/body) so the contract memo is not misleading.
- **Validation contract:**
  - TC-01: Inventory authority request includes shop header → unit test spies on `fetch` → asserts `headers["x-shop-id"] === "cochlearfit"`.
  - TC-02: Inventory authority request body remains `{ items: [...] }` → unit test asserts `JSON.parse(body).items` exists and `shopId` is not required in body when header is present.
  - **Acceptance coverage:** TC-01 covers header requirement; TC-02 covers payload stability + documentation clarity
  - **Validation type:** unit tests (Jest)
  - **Test location:** `apps/cochlearfit-worker/src/__tests__/inventory-authority-shop-id.test.ts`
  - **Run/verify:** `pnpm --filter @apps/cochlearfit-worker test -- inventory-authority-shop-id`
- **Rollout / rollback:**
  - Rollout: deploy Worker after tests pass (no API shape change; adds required header)
  - Rollback: revert to previous Worker build (not recommended; would re-break inventory checks against the authority contract)
  - Note: This is safe to ship before TASK-02 completes; it only adds a header on already-authenticated requests.
- **Documentation impact:**
  - Update `docs/plans/cochlearfit-deployment-readiness/inventory-api.md` to document shop context requirements (header/body) and align with `apps/cms` authority behavior.

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** d59b87afc5
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 85% (validation confirmed)
- **Validation:**
  - Ran: `pnpm --filter @apps/cochlearfit-worker test -- inventory-authority-shop-id` — PASS
  - Ran: `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - Ran: `pnpm --filter @apps/cochlearfit-worker lint` — PASS
- **Documentation updated:** `docs/plans/cochlearfit-deployment-readiness/inventory-api.md`
- **Implementation notes:**
  - Worker now sends `x-shop-id: cochlearfit` when calling the inventory authority.
  - Added a unit test that asserts header presence and keeps request body items-only.

### TASK-03: Select and configure email service
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** External (Email service provider), `docs/plans/cochlearfit-deployment-readiness/email-setup.md`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-07, TASK-09
- **Confidence:** 75%
  - Implementation: 85% — Well-documented providers (Resend, SendGrid), straightforward account setup and domain verification
  - Approach: 80% — Resend recommended for best DX (React email templates, 100 emails/day free), but SendGrid also proven
  - Impact: 75% — Domain DNS verification can take 24-48 hours (SPF, DKIM, DMARC records propagation)
- **Acceptance:**
  - [ ] Email service provider selected (Resend or SendGrid)
  - [ ] Account created with API credentials
  - [ ] Sender domain configured (e.g., `orders@cochlearfit.com`)
  - [ ] DNS records verified (SPF, DKIM, DMARC records added and propagated)
  - [ ] Test email successfully sent and delivered (check inbox, spam folder)
  - [ ] **Secret values stored securely:** API credentials stored in 1Password (never commit values to repo)
  - [ ] Email service metadata documented in `docs/plans/cochlearfit-deployment-readiness/email-setup.md` (provider name, sender domain, test mode configuration)
  - [ ] Test mode/sandbox verified (emails don't go to real customers during development)
- **Validation contract:**
  - TC-01: DNS verification → Check DNS records with `dig` → SPF, DKIM, DMARC records exist
  - TC-02: Test email send → Call API with test credentials → email delivered to inbox (not spam)
  - TC-03: API authentication → Call API without credentials → returns 401
  - TC-04: Rate limit check → Send multiple test emails → no rate limit errors for free tier
  - **Acceptance coverage:** TC-01 covers DNS, TC-02+TC-04 cover deliverability, TC-03 covers auth
  - **Validation type:** manual verification + API testing
  - **Run/verify:** `dig TXT orders.cochlearfit.com` (SPF), provider dashboard for DKIM/DMARC, send test email via API
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First DNS verification will fail (records not added yet)
  - **Green evidence:** After adding DNS records and waiting for propagation, provider dashboard shows "Verified" status
  - **Refactor evidence:** Test email rendering across multiple clients (Gmail, Outlook, Apple Mail)
- **Planning validation:**
  - Checks run: Reviewed Resend and SendGrid documentation, pricing, and free tier limits
  - Unexpected findings: None (standard email service setup)
- **What would make this ≥90%:** Pre-register domain early, start DNS verification immediately (24-48 hour propagation delay)
- **Rollout / rollback:**
  - Rollout: No code deployment for this task; purely email service configuration
  - Rollback: N/A (configuration changes are non-destructive; can switch providers if needed)
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/email-setup.md` with:
    - Provider name and account details
    - Secret storage location (1Password vault reference — never document secret values in repo)
    - Sender email address and domain
    - DNS records (SPF, DKIM, DMARC values)
    - Test mode configuration
    - API endpoint URLs
- **Notes / references:**
  - Resend docs: https://resend.com/docs
  - SendGrid docs: https://docs.sendgrid.com
  - DNS verification guide: SPF, DKIM, DMARC records
  - Recommended: Resend (best DX, React email templates, 100 emails/day free)

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 80%
- **Updated confidence:** 75% (min-of-dim correction)
  - **Evidence class:** E2 (public DNS probe)
  - Impact: 75% — Domain DNS verification is blocked because `cochlearfit.com` is NXDOMAIN.
- **Investigation performed:**
  - `dig @1.1.1.1 cochlearfit.com` and `dig @8.8.8.8 cochlearfit.com` -> NXDOMAIN (2026-02-14).
- **Decision / resolution:**
  - Keep TASK-03 explicitly deferred/blocked until domain is registered/configured and you decide to proceed with email.


#### Build Attempt (2026-02-14)
- **Status:** Blocked (external prerequisite)
- **Commit:** c18cddd395
- **Blocker:** `cochlearfit.com` does not resolve (NXDOMAIN), so sender-domain DNS verification cannot be completed.
- **Evidence:** `dig @1.1.1.1 cochlearfit.com` -> `status: NXDOMAIN`; `dig @8.8.8.8 cochlearfit.com` -> `status: NXDOMAIN` on 2026-02-14.
- **Next action:** Register/configure the domain (or confirm the correct production domain) before continuing TASK-03 and any routing tasks (TASK-10/TASK-12/TASK-13).

### TASK-04: Implement build-time catalog bundling system
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `scripts/bundle-worker-catalog.ts` (new file)
  - `apps/cochlearfit-worker/package.json` (add prebuild script)
  - `apps/cochlearfit-worker/.gitignore` (exclude generated file)
  - `apps/cochlearfit-worker/src/worker-catalog.generated.ts` (generated output)
  - `data/shops/cochlearfit/products.json` (new, template data)
  - `data/shops/cochlearfit/variants.json` (new, template data with placeholder `price_...` IDs)
  - `data/shops/cochlearfit/inventory.json` (new, template data)
  - `[readonly] apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts` (schema reference)
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — Frontend catalog loading (cochlearfitCatalog.server.ts) already exists as reference, script logic is straightforward (read JSON → generate TypeScript)
  - Approach: 85% — Build-time bundling is best long-term pattern (single source of truth), but requires build infrastructure setup
  - Impact: 80% — Generated file must be excluded from git; build failure modes must be handled gracefully
- **Acceptance:**
  - [ ] Script `scripts/bundle-worker-catalog.ts` created
  - [ ] Script reads `data/shops/cochlearfit/*.json` (products, variants, inventory)
  - [ ] Script generates `apps/cochlearfit-worker/src/worker-catalog.generated.ts` with:
    ```typescript
    export const catalog = [
      {
        id: "classic-kids-sand",
        name: "Classic Sound Sleeve",
        size: "kids",
        color: "sand",
        price: 3400,
        stripePriceId: "price_1ABC...",
        inStock: true,
      },
      // ... 11 more variants
    ];
    ```
  - [ ] Script validates: fail build if Stripe Price IDs missing or malformed (must start with `price_`)
  - [ ] Template `variants.json` uses placeholder Stripe Price IDs (format-valid `price_...`), to be replaced with real IDs in TASK-08
  - [ ] Script validates: fail build if products.json, variants.json, or inventory.json missing
  - [ ] Script added to Worker package.json: `"prebuild": "node --import tsx ../../scripts/bundle-worker-catalog.ts"`
  - [ ] Generated file added to `apps/cochlearfit-worker/.gitignore`
  - [ ] Build succeeds with template data files (Stripe Price IDs present)
  - [ ] Build fails gracefully with helpful error if data files missing or Price IDs invalid
- **Validation contract:**
  - TC-01: Build with valid template data → run `pnpm --filter @apps/cochlearfit-worker build` → succeeds, generated file exists
  - TC-02: Build with missing products.json → run bundler with a fixture dir missing products.json → fails with error "products.json not found"
  - TC-03: Build with invalid Price ID → run bundler with a fixture dir containing invalid Price ID → fails with error "Stripe Price ID malformed for variant X"
  - TC-04: Generated catalog structure → inspect generated file → matches expected TypeScript format
  - TC-05: Gitignore exclusion → run `git status` → generated file not shown as untracked
  - **Acceptance coverage:** TC-01+TC-04 cover happy path, TC-02+TC-03 cover validation, TC-05 covers git exclusion
  - **Validation type:** unit testing (build script execution)
  - **Run/verify:** `pnpm --filter @apps/cochlearfit-worker build`, `git status`, inspect generated file
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First build attempt will fail (script doesn't exist yet, data files incomplete)
  - **Green evidence:** After writing script and populating data files, build succeeds and generated file contains 12 variants
  - **Refactor evidence:** Add helpful error messages for validation failures, add TypeScript type safety to generated file
- **Planning validation:**
  - Checks run: Reviewed frontend catalog loading (cochlearfitCatalog.server.ts lines 178-223) as reference implementation
  - Validation artifacts written: None (script will be written during task execution)
  - Unexpected findings: None (straightforward TypeScript code generation)
- **What would make this ≥90%:** Test with real Stripe Price IDs from TASK-01 (currently only have template structure)
- **Rollout / rollback:**
  - Rollout: Build script runs automatically via prebuild hook; no manual intervention required
  - Rollback: If script fails, build will fail (safe default); fix script or revert to placeholder catalog temporarily
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md` with:
    - Build process explanation (prebuild script runs automatically)
    - Data file requirements (products.json, variants.json, inventory.json)
    - Validation rules (Stripe Price IDs must start with `price_`)
    - How to update catalog (edit data files, rebuild Worker)
- **Notes / references:**
  - Reference implementation: `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts:178-223`
  - Schema contracts: lines 14-51 of cochlearfitCatalog.server.ts
  - Decision 6 from fact-find: Build-time bundling (single source of truth)

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 7fb1d23a1f
- **Validation Evidence:**
  - `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - `pnpm --filter @apps/cochlearfit-worker lint` — PASS
  - `pnpm --filter @apps/cochlearfit-worker build` — PASS (prebuild runs bundler; generated file created)
  - `pnpm exec eslint scripts/bundle-worker-catalog.ts` — PASS
  - TC-02/TC-03 failure-mode checks executed via `node --import tsx scripts/bundle-worker-catalog.ts --data-dir <fixture>` — PASS
- **Confidence reassessment:** 85% -> 90% (validation confirmed assumptions; build + failure modes verified)
- **Documentation updated:** `apps/cochlearfit-worker/README.md` (commit 4210264862)
- **Implementation notes:**
  - Added `scripts/bundle-worker-catalog.ts` to generate `apps/cochlearfit-worker/src/worker-catalog.generated.ts` from `data/shops/cochlearfit/*.json`.
  - Seeded `data/shops/cochlearfit/{products,variants,inventory}.json` with placeholder `price_...` IDs; real Stripe Price IDs remain a TASK-08 requirement.


### TASK-05: Replace hardcoded catalog with generated import
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/index.ts` (remove hardcoded catalog, import generated)
  - `apps/cochlearfit-worker/package.json` (ensure generated file exists before dev/lint/typecheck)
  - `[readonly] apps/cochlearfit-worker/src/worker-catalog.generated.ts` (import source)
- **Depends on:** TASK-04
- **Blocks:** TASK-09
- **Confidence:** 90%
  - Implementation: 95% — Straightforward import replacement, generated catalog already has correct structure
  - Approach: 90% — Clean removal of hardcoded logic, no side effects
  - Impact: 85% — Integration verification with real Stripe Price IDs happens after TASK-08 (data) and TASK-01 (Stripe); this task focuses on removing hardcoding and wiring to generated data
- **Acceptance:**
  - [ ] Import statement added: `import { catalog } from "./worker-catalog.generated";`
  - [ ] Hardcoded `buildVariants()` calls removed (lines 122-124)
  - [ ] `buildVariants()` function removed (lines 108-120, no longer needed)
  - [ ] Types updated to match generated catalog format
  - [ ] Build succeeds with no TypeScript errors
  - [ ] Local check: imported `catalog` matches `data/shops/cochlearfit/variants.json` stripePriceId values (placeholder `price_...` allowed until TASK-08)
  - [ ] Commit changes (excluding generated file)
- **Validation contract:**
  - TC-01: TypeScript compilation → run `pnpm --filter @apps/cochlearfit-worker typecheck` → no errors
  - TC-02: Generated catalog import → run `pnpm --filter @apps/cochlearfit-worker build` → import resolves correctly
  - TC-03: Catalog wiring sanity → run bundler + import generated catalog via tsx → expected variant IDs exist
    - Example: `node --import tsx -e "import { catalog } from './apps/cochlearfit-worker/src/worker-catalog.generated.ts'; console.log(catalog.length)"` → prints `12`
  - TC-04: Placeholder Price IDs tolerated pre-TASK-08 → confirm generated `stripePriceId` values start with `price_`
  - **Acceptance coverage:** TC-01+TC-02 cover compilation/build, TC-03+TC-04 cover wiring and ID format
  - **Validation type:** compile/build verification + local import sanity checks
  - **Run/verify:** `pnpm --filter @apps/cochlearfit-worker typecheck && pnpm --filter @apps/cochlearfit-worker build`, plus TC-03 node import check
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** N/A (this task is a wiring change validated by typecheck/build + local import sanity checks)
  - **Green evidence:** After import replacement, typecheck/build succeed and the Worker catalog maps are driven by the generated file
  - **Refactor evidence:** Remove unused `buildVariants()` function, clean up imports
- **Planning validation:**
  - Checks run: Reviewed Worker index.ts lines 108-128 (hardcoded catalog to be removed)
  - Unexpected findings: None (straightforward import replacement)
- **What would make this ≥90%:** Run end-to-end checkout using real Stripe Price IDs after TASK-08 + TASK-01 (covered by TASK-11 staging tests)
- **Rollout / rollback:**
  - Rollout: Worker build includes generated catalog; no runtime changes required
  - Rollback: Revert to hardcoded catalog if generated import fails (temporary fallback)
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md`: Explain that catalog is now generated from data files (not hardcoded)
- **Notes / references:**
  - Hardcoded catalog location: `apps/cochlearfit-worker/src/index.ts:108-128`
  - Decision 6 from fact-find: Build-time bundling removes code duplication

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 8e243ac4ba
- **Validation Evidence:**
  - `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - `pnpm --filter @apps/cochlearfit-worker lint` — PASS
  - `pnpm --filter @apps/cochlearfit-worker build` — PASS
  - TC-03 example from plan: `node --import tsx -e "import { catalog } from './apps/cochlearfit-worker/src/worker-catalog.generated.ts'; console.log(catalog.length)"` — prints `12`
- **Confidence reassessment:** 90% -> 90% (wiring change validated; Stripe integration deferred until real Price IDs in TASK-08/TASK-11)
- **Documentation updated:** `apps/cochlearfit-worker/README.md` (commit 4210264862)
- **Implementation notes:**
  - `apps/cochlearfit-worker/src/index.ts` now imports `catalog` from `./worker-catalog.generated`.
  - Removed the hardcoded `COLORS`/`SIZES`/`buildVariants()` and inline catalog array.
  - Added `predev`/`prelint`/`pretypecheck` scripts so generated catalog exists before dev/lint/typecheck.


### TASK-06: Create email receipt template
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/templates/order-receipt.html` (new file, HTML template)
  - `apps/cochlearfit-worker/src/templates/order-receipt.txt` (new file, plain-text fallback)
  - `[readonly] apps/cochlearfit-worker/src/index.ts` (template import location)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% — Email templates are straightforward HTML + plain-text, well-documented patterns
  - Approach: 85% — HTML template approach is standard (inline CSS for email clients), but requires client testing
  - Impact: 80% — Email rendering varies across clients (Gmail, Outlook, Apple Mail); must test all major clients
- **Acceptance:**
  - [ ] HTML email template created with:
    - Order details (items, quantities, prices, subtotal, total)
    - Order ID and date
    - Customer email
    - Company branding (logo, colors)
    - Contact information (support email, website)
    - Inline CSS (required for email clients)
  - [ ] Plain-text fallback created with same information (ASCII formatting)
  - [ ] Template uses dynamic variables: `{{orderId}}`, `{{orderDate}}`, `{{items}}`, `{{total}}`, `{{customerEmail}}`
  - [ ] Template tested across email clients (Gmail, Outlook, Apple Mail, mobile)
  - [ ] Template renders correctly in all tested clients (no layout breaks, images load, links work)
  - [ ] Template includes unsubscribe footer (if required by provider)
- **Validation contract:**
  - TC-01: HTML rendering → Open template in browser → renders correctly with test data
  - TC-02: Gmail rendering → Send test email to Gmail → renders correctly (no layout breaks)
  - TC-03: Outlook rendering → Send test email to Outlook → renders correctly
  - TC-04: Apple Mail rendering → Send test email to Apple Mail → renders correctly
  - TC-05: Mobile rendering → Open email on mobile device → renders correctly (responsive)
  - TC-06: Plain-text fallback → Disable HTML in email client → plain-text version is readable
  - **Acceptance coverage:** TC-01 covers basic HTML, TC-02-TC-05 cover cross-client rendering, TC-06 covers plain-text fallback
  - **Validation type:** manual verification (send test emails to multiple clients)
  - **Run/verify:** Send test email via provider API with template, check inbox across clients
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First email will have rendering issues (CSS not inlined, layout breaks in Outlook)
  - **Green evidence:** After inlining CSS and testing, email renders correctly across all clients
  - **Refactor evidence:** Add company logo, improve mobile responsiveness, add clear CTA (contact support)
- **Planning validation:**
  - Checks run: Reviewed email template best practices (inline CSS, table layouts for Outlook compatibility)
  - Unexpected findings: None (standard email template patterns)
- **What would make this ≥90%:** Complete cross-client testing with real order data (currently only template structure)
- **Rollout / rollback:**
  - Rollout: Template is bundled with Worker deployment; no separate deployment step
  - Rollback: Revert to previous template version if rendering issues found
- **Documentation impact:**
  - Add `apps/cochlearfit-worker/README.md` section:
    - Email template location
    - Dynamic variables available
    - How to update template (edit HTML/TXT files, rebuild Worker)
- **Notes / references:**
  - Email template best practices: inline CSS, table layouts, alt text for images
  - Provider-specific requirements: Resend supports React email templates, SendGrid uses Handlebars

### TASK-07: Implement email sending in Worker webhook
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/index.ts` (lines 307-331: retrieve session with expand[]=line_items, lines ~470: send email, idempotency logic)
  - `apps/cochlearfit-worker/package.json` (add email service client library)
  - `[readonly] apps/cochlearfit-worker/src/templates/order-receipt.html` (template source)
- **Depends on:** TASK-03, TASK-06
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 85% — Email service client libraries are well-documented, straightforward API integration
  - Approach: 80% — Session expansion for email is standard pattern, but must handle missing email gracefully
  - Impact: 75% — Email failures must not block webhook (return 200 to Stripe even if email fails), requires careful error handling
- **Acceptance:**
  - [ ] **Webhook idempotency implemented** (critical for payment system):
    - **Order key is session.id** (stable Stripe identifier → idempotent writes by construction)
    - Store order as `ORDERS.put("orders:" + session.id, JSON.stringify(order))`
    - **Best-effort event deduplication:** Check KV for `webhook_events:{event.id}` before processing
    - If event marker exists: return 200 immediately (already processed)
    - If not exists: process order → persist order → mark event processed
    - Write event marker to KV: `webhook_events:{event.id} = "processed"`
  - [ ] **Order persistence with failure handling:**
    - If order persistence fails: return 500 (Stripe retries, safe with idempotent order key)
    - If order write succeeds but event marker write fails: return 200 (prevents retry loop; duplicate order writes are safe because key is session.id)
  - [ ] Email service client library added to dependencies (e.g., `@sendgrid/mail` or `resend`)
  - [ ] Session retrieval: retrieve with `expand[]=line_items` to get itemized order details
  - [ ] Customer email extracted from `session.customer_details.email` (nested field, always included in session object)
  - [ ] `StripeSessionPayload` type updated to include `customer_details?: { email?: string }` (line 33)
  - [ ] `buildOrderRecord()` updated to include `customerEmail?: string` field (line 64)
  - [ ] Webhook handler extracts email: `const email = session.customer_details?.email`
  - [ ] Email sending logic added after payment success (line ~470):
    - Load email template (HTML + plain-text)
    - Replace dynamic variables (order ID, items, total, customer email)
    - Call email service API with rendered template
    - Log success or error
  - [ ] Error handling added: log email failures, return 200 to Stripe (prevent retries)
  - [ ] Handle missing email gracefully: log warning, continue webhook processing (don't fail order)
  - [ ] Local test: `stripe trigger checkout.session.completed` → email sent and received
  - [ ] Idempotency test: trigger same event twice → second trigger returns 200 immediately, no duplicate order
- **Validation contract:**
  - TC-01: Order key idempotency → trigger webhook with `session.id=cs_test_123` → order stored as `orders:cs_test_123`
  - TC-02: Duplicate order write → trigger same `session.id` twice → both writes succeed (idempotent), order value unchanged
  - TC-03: Event deduplication → trigger same `event.id` twice → KV checked for `webhook_events:evt_test_123`, second returns 200 immediately
  - TC-04: Event marker persistence → after processing webhook → KV contains `webhook_events:evt_test_123 = "processed"`
  - TC-05: Order persistence failure → simulate KV write error → webhook returns 500 (Stripe will retry)
  - TC-06: Session retrieval → inspect fetched session → `customer_details.email` field present (nested, not expanded)
  - TC-07: Email extraction → log email value → matches customer email from Stripe Checkout
  - TC-08: Email sending → trigger test webhook → email delivered to inbox (check spam folder)
  - TC-09: Template rendering → inspect sent email → dynamic variables replaced correctly (order ID, items, total)
  - TC-10: Email failure handling → simulate API error (invalid credentials) → webhook returns 200 to Stripe, error logged
  - TC-11: Missing email handling → trigger webhook with session missing customer_details → webhook returns 200, warning logged
  - **Acceptance coverage:** TC-01-TC-05 cover idempotency, TC-06+TC-07 cover email extraction, TC-08+TC-09 cover email delivery, TC-10+TC-11 cover error handling
  - **Validation type:** integration testing (Stripe CLI webhook trigger + KV inspection + email delivery verification)
  - **Run/verify:** `stripe trigger checkout.session.completed`, `wrangler kv:key get webhook_events:evt_test_123`, check inbox, inspect Worker logs
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First webhook will fail to send email (API credentials not configured, customer_details not expanded)
  - **Green evidence:** After configuring API credentials and expanding customer_details, test webhook sends email successfully
  - **Refactor evidence:** Add retry logic for transient email failures (503 from email service), improve error logging
- **Planning validation:**
  - Checks run: Reviewed Worker webhook handler (lines 362-490 of index.ts), Stripe session fetch logic (lines 307-331)
  - Unexpected findings: None (standard webhook + email integration pattern)
- **What would make this ≥90%:** Test with real Stripe session data (currently only test webhook events)
- **Rollout / rollback:**
  - Rollout: Worker deployment includes email functionality; email failures don't block checkout
  - Rollback: Disable email sending via environment variable if issues found (`EMAIL_ENABLED=false`)
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md`:
    - Email sending logic location
    - Error handling strategy (log but don't fail webhook)
    - How to test email sending locally (Stripe CLI)
- **Notes / references:**
  - Decision 7 from fact-find: Expand session customer_details for email (no frontend changes)
  - Worker webhook handler: `apps/cochlearfit-worker/src/index.ts:362-490`
  - Stripe session expansion docs: https://stripe.com/docs/api/checkout/sessions/object#checkout_session_object-customer_details

### TASK-08: Populate production data files with real Price IDs
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `data/shops/cochlearfit/products.json`
  - `data/shops/cochlearfit/variants.json`
  - `data/shops/cochlearfit/inventory.json`
  - `[readonly] docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` (Price ID reference)
- **Depends on:** TASK-01
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 90% — Data file population is straightforward (copy Price IDs from Stripe setup doc, fill JSON fields)
  - Approach: 85% — JSON schemas are well-defined in cochlearfitCatalog.server.ts (lines 14-51)
  - Impact: 80% — Must validate JSON structure matches schemas exactly (field names, types, localization format)
- **Acceptance:**
  - [ ] `products.json` created with 2 products:
    - Classic Sound Sleeve (SKU: `classic`)
    - Sport Sound Sleeve (SKU: `sport`)
    - Localized fields: `title`, `description`, `shortDescription`, `longDescription`, `featureBullets`
    - Media array with image URLs (type: `image`, `altText` field)
  - [ ] `variants.json` created with 12 variants:
    - Real Stripe Price IDs (from TASK-01 stripe-setup.md)
    - Fields: `id`, `productSlug`, `size`, `color`, `price`, `currency`, `stripePriceId`
  - [ ] `inventory.json` created with 12 inventory records:
    - Fields: `sku` (matches variant `id`), `quantity` (realistic stock levels)
  - [ ] JSON structure validated against schemas (cochlearfitCatalog.server.ts lines 14-51)
  - [ ] Frontend catalog loading tested: verify products display correctly
  - [ ] Verify fallback behavior: remove products.json temporarily → frontend falls back to products.ts
  - [ ] Commit data files to repo
- **Validation contract:**
  - TC-01: JSON schema validation → run build script from TASK-04 → no validation errors
  - TC-02: Frontend catalog loading → start dev server → products display with correct titles, prices, images
  - TC-03: Variant SKU matching → inspect inventory.json `sku` values → match variant `id` values in variants.json
  - TC-04: Localization format → inspect products.json → `title` is `Record<string, string>` with at least `en` key
  - TC-05: Stripe Price ID format → inspect variants.json → all `stripePriceId` values start with `price_`
  - **Acceptance coverage:** TC-01 covers schemas, TC-02 covers frontend integration, TC-03 covers SKU consistency, TC-04 covers localization, TC-05 covers Stripe IDs
  - **Validation type:** integration testing (frontend + build script)
  - **Run/verify:** `pnpm --filter @apps/cochlearfit dev` → open http://localhost:3011 → verify products display, run build script → verify no errors
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First frontend load will fail (products.json missing, falls back to products.ts)
  - **Green evidence:** After creating products.json with real data, frontend loads products from data files
  - **Refactor evidence:** Add product images, improve localized descriptions, set realistic inventory quantities
- **Planning validation:**
  - Checks run: Reviewed schema contracts in cochlearfitCatalog.server.ts (lines 14-51)
  - Unexpected findings: None (schemas are well-defined)
- **What would make this ≥90%:** Complete with real product images and localized descriptions (currently only structure)
- **Rollout / rollback:**
  - Rollout: Data files committed to repo, deployed with Worker build
  - Rollback: Revert to fallback products.ts if data files have errors (frontend gracefully falls back)
- **Documentation impact:**
  - Update `data/shops/cochlearfit/README.md` (create if missing):
    - Data file schemas and required fields
    - How to add new products/variants
    - SKU matching rules (inventory.json `sku` must match variants.json `id`)
    - Localization format (at least `en` key required)
- **Notes / references:**
  - Schema reference: `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts:14-51`
  - Fallback behavior: lines 206-216 (falls back to products.ts if products.json missing)
  - Fact-find: "Expected JSON File Schemas" section has corrected field names

### TASK-09: Configure Worker secrets and environment variables
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/wrangler.toml` (remove committed secrets, add env var comments)
  - External (Cloudflare Workers secrets via `wrangler secret put`)
  - `docs/plans/cochlearfit-deployment-readiness/worker-config.md` (new doc)
  - `[readonly] docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` (secret values reference)
  - `[readonly] docs/plans/cochlearfit-deployment-readiness/email-setup.md` (secret values reference)
  - `[readonly] docs/plans/cochlearfit-deployment-readiness/inventory-api.md` (secret values reference)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-17
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 85% — Wrangler environments are well-documented, cleaner than runtime URL detection
  - Approach: 80% — Separate `[env.staging]` and `[env.production]` sections eliminate fragile URL substring matching
  - Impact: 75% — Must remove committed secrets from wrangler.toml (security issue), must configure separate KV namespaces

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 80%
- **Updated confidence:** 75% (min-of-dim correction)
  - **Evidence class:** E1 (config audit)
- **Investigation performed:**
  - `apps/cochlearfit-worker/wrangler.toml` currently contains committed token placeholders (e.g., `INVENTORY_AUTHORITY_TOKEN`).
- **Decision / resolution:**
  - Added TASK-17 (IMPLEMENT) to separate repo-side config hardening from external secrets/KV provisioning.
- **Changes to task:**
  - Dependencies: now depends on TASK-17 (plus external setup tasks TASK-01/02/03)


- **Acceptance:**
  - [ ] Committed secrets removed from wrangler.toml (lines 9-14: `INVENTORY_AUTHORITY_TOKEN` placeholders deleted)
  - [ ] **Rotate all secrets** (assume compromise from previous commits):
    - Generate new Stripe keys (test + live mode)
    - Generate new email service API keys (test + production)
    - Generate new inventory API tokens (staging + production)
  - [ ] Wrangler.toml updated with environment sections:
    ```toml
    # Shared vars (common to both environments)
    [vars]
    EMAIL_FROM_ADDRESS = "orders@cochlearfit.com"
    EMAIL_FROM_NAME = "Cochlear Fit Orders"

    # Staging environment
    [env.staging]
    name = "cochlearfit-worker-staging"
    # Option A: Real staging domain (same-origin, no CORS):
    # routes = [{ pattern = "staging.cochlearfit.com/api/*", zone_name = "cochlearfit.com" }]
    # Option B: Workers.dev for staging (cross-origin, strict CORS):
    workers_dev = true
    [env.staging.vars]
    PAGES_ORIGIN = "https://cochlearfit-staging.pages.dev"
    INVENTORY_AUTHORITY_URL = "https://inventory-api-staging.example.com"
    [[env.staging.kv_namespaces]]
    binding = "ORDERS"
    id = "<staging-kv-namespace-id>"

    # Production environment
    [env.production]
    name = "cochlearfit-worker-production"
    # Production MUST use custom domain routing (not workers.dev):
    routes = [{ pattern = "cochlearfit.com/api/*", zone_name = "cochlearfit.com" }]
    [env.production.vars]
    PAGES_ORIGIN = "https://cochlearfit.com"
    INVENTORY_AUTHORITY_URL = "https://inventory-api.example.com"
    [[env.production.kv_namespaces]]
    binding = "ORDERS"
    id = "<production-kv-namespace-id>"
    ```
    **Note:** `workers.dev` URLs are for development/testing only (format: `cochlearfit-worker-staging.<account>.workers.dev`). Production uses custom domain routing.
  - [ ] Secrets configured per environment (4 secrets × 2 environments = 8 total):
    - `wrangler secret put STRIPE_SECRET_KEY --env staging` (test mode)
    - `wrangler secret put STRIPE_WEBHOOK_SECRET --env staging`
    - `wrangler secret put EMAIL_SERVICE_API_KEY --env staging`
    - `wrangler secret put INVENTORY_AUTHORITY_TOKEN --env staging`
    - `wrangler secret put STRIPE_SECRET_KEY --env production` (live mode)
    - `wrangler secret put STRIPE_WEBHOOK_SECRET --env production`
    - `wrangler secret put EMAIL_SERVICE_API_KEY --env production`
    - `wrangler secret put INVENTORY_AUTHORITY_TOKEN --env production`
  - [ ] KV namespaces created: one for staging, one for production (true isolation, not key prefixes)
  - [ ] Worker code **does NOT include runtime environment detection** (Wrangler handles it via separate deployments)
  - [ ] Documentation created in `worker-config.md` with:
    - Secret list and wrangler commands
    - Wrangler environment configuration
    - Deployment commands: `wrangler deploy --env staging` / `wrangler deploy --env production`
    - KV namespace IDs and binding names
  - [ ] Test: `wrangler dev --env staging` → Worker runs with staging secrets → checkout works
- **Validation contract:**
  - TC-01: Secret removal → `git diff wrangler.toml` → no committed secrets (INVENTORY_AUTHORITY_TOKEN deleted)
  - TC-02: Secret rotation → new Stripe/Email/Inventory keys generated (different from committed values)
  - TC-03: Staging secrets → `wrangler secret list --env staging` → 4 secrets listed (not suffixed)
  - TC-04: Production secrets → `wrangler secret list --env production` → 4 secrets listed (not suffixed)
  - TC-05: KV namespaces → `wrangler kv:namespace list` → 2 namespaces (staging + production)
  - TC-06: Wrangler config → inspect wrangler.toml → `[env.staging]` and `[env.production]` sections exist with separate KV bindings
  - TC-07: Local development → `wrangler dev --env staging` → Worker starts with staging secrets
  - TC-08: Checkout test → local staging Worker → session creation succeeds with test mode Stripe key
  - **Acceptance coverage:** TC-01+TC-02 cover security, TC-03+TC-04 cover secrets, TC-05+TC-06 cover Wrangler environments, TC-07+TC-08 cover local testing
  - **Validation type:** manual verification (wrangler CLI commands, Worker logs)
  - **Run/verify:** `wrangler secret list --env staging`, `wrangler kv:namespace list`, `wrangler dev --env staging`, test checkout locally
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First deployment will fail (secrets not configured, Worker crashes on missing env vars)
  - **Green evidence:** After configuring secrets via `wrangler secret put --env <staging|production>`, both Workers start successfully with correct isolation
  - **Refactor evidence:** Add startup health checks for secrets and KV bindings, validate all required env vars are present
- **Planning validation:**
  - Checks run: Reviewed wrangler.toml (lines 9-14: committed secrets identified)
  - Unexpected findings: Committed secrets found (security issue flagged in fact-find)
- **What would make this ≥90%:** Test with real checkout flow using staging secrets (currently only Worker startup)
- **Rollout / rollback:**
  - Rollout: Secrets configured via `wrangler secret put`, Worker deployed with updated wrangler.toml
  - Rollback: Secrets persist across deployments (not deleted by rollback), can update secrets independently
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/worker-config.md`:
    - Secret names and 1Password vault references (never document secret values in repo)
    - Wrangler environment configuration ([env.staging] and [env.production])
    - How to configure secrets (`wrangler secret put --env <staging|production>` commands)
    - Environment variable descriptions
    - Deployment commands (`wrangler deploy --env <staging|production>`)
    - KV namespace isolation (separate namespace per environment)
- **Notes / references:**
  - **Decision 4 REVISED:** Changed from "single Worker with runtime URL detection" to "Wrangler environments" for better isolation
  - Eliminates fragile `req.url.includes('staging')` substring matching
  - Security requirement: rotate all secrets after removing committed values (assume compromise)
  - Wrangler environments docs: https://developers.cloudflare.com/workers/wrangler/configuration/#environments
  - Wrangler secrets docs: https://developers.cloudflare.com/workers/wrangler/commands/#secret

### TASK-10: Deploy Worker and frontend to staging
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - External (Cloudflare Workers deployment)
  - External (Cloudflare Pages staging deployment)
  - `[readonly] apps/cochlearfit-worker/wrangler.toml` (deployment config)
  - `[readonly] apps/cochlearfit/package.json` (build config)
- **Depends on:** TASK-07, TASK-09
- **Blocks:** TASK-11
- **Confidence:** 85%
  - Implementation: 90% — Wrangler environments are well-documented, separate deployments eliminate detection fragility
  - Approach: 85% — Separate staging deployment with own KV namespace; routing verified per Routing Strategy
  - Impact: 80% — Routing must work (same-origin /api/* OR cross-origin with CORS), KV namespace must be bound correctly
- **Acceptance:**
  - [ ] Staging Worker deployed: `wrangler deploy --env staging` → Worker deployed with staging KV + secrets
  - [ ] Frontend deployed to Cloudflare Pages staging: `https://cochlearfit-staging.pages.dev` (or `staging.cochlearfit.com`)
  - [ ] Routing verified per strategy:
    - **If same-origin:** `curl https://staging.cochlearfit.com/api/health` → Worker responds (routed via zone)
    - **If cross-origin:** `curl https://cochlearfit-worker-staging.<account>.workers.dev/api/health` → Worker responds, CORS headers present
  - [ ] Staging KV namespace bound: `wrangler kv:namespace list` shows staging namespace ID matches wrangler.toml
  - [ ] Staging secrets verified: `wrangler secret list --env staging` shows 4 secrets (no suffixes)
  - [ ] CORS verified (if cross-origin): frontend fetch → no CORS errors in browser console
  - [ ] Worker logs accessible: Cloudflare Workers dashboard → Logs → filter by `cochlearfit-worker-staging`
- **Validation contract:**
  - TC-01: Staging Worker deployment → `wrangler deploy --env staging` → succeeds, shows staging KV binding
  - TC-02: Frontend deployment → git push to staging branch → Cloudflare Pages build succeeds
  - TC-03: Routing → `curl <staging-worker-url>/api/checkout/session` (method: OPTIONS for CORS preflight) → responds
  - TC-04: KV binding → Worker logs show successful KV write test (no binding errors)
  - TC-05: Secrets isolation → staging Worker uses staging Stripe key (verify session created in Stripe test mode, not live mode)
  - TC-06: CORS (if needed) → frontend fetch from Pages → `Access-Control-Allow-Origin` header present
  - **Acceptance coverage:** TC-01+TC-02 cover deployment, TC-03+TC-06 cover routing/CORS, TC-04 covers KV, TC-05 covers secrets isolation
  - **Validation type:** deployment verification + manual testing
  - **Run/verify:** `wrangler deploy --env staging`, check Cloudflare dashboard, test routing
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First deployment will have routing issues (CORS errors if cross-origin, route not configured if same-origin)
  - **Green evidence:** After configuring routing per strategy, staging frontend successfully calls Worker API
  - **Refactor evidence:** Add deployment checklist, automate staging deployment via CI/CD
- **Planning validation:**
  - Checks run: Reviewed Cloudflare Workers and Pages documentation
  - Unexpected findings: None (standard Cloudflare deployment pattern)
- **What would make this ≥90%:** Complete staging deployment with successful end-to-end checkout test (covered in TASK-11)
- **Rollout / rollback:**
  - Rollout: Staging Worker deployed independently (`wrangler deploy --env staging`), frontend deployed to staging branch
  - Rollback: Revert staging Worker via `wrangler rollback --env staging`, revert Pages via git
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md`:
    - Deployment instructions (`wrangler deploy --env staging` / `--env production`)
    - How to verify deployment (check logs, test routing, verify KV binding)
  - Update `apps/cochlearfit/README.md`:
    - Staging deployment process (git push to staging branch)
- **Notes / references:**
  - Cloudflare Workers deployment docs: https://developers.cloudflare.com/workers/get-started/guide/
  - Cloudflare Pages deployment docs: https://developers.cloudflare.com/pages/

### TASK-11: Run end-to-end staging tests
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - External (staging environment testing)
  - `docs/plans/cochlearfit-deployment-readiness/staging-test-results.md` (new doc)
  - `[readonly] data/shops/cochlearfit/inventory.json` (modify for out-of-stock test, then revert)
- **Depends on:** TASK-10
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 90% — End-to-end testing is straightforward (manual checkout flow, verify results)
  - Approach: 85% — Test coverage is comprehensive (happy path, out-of-stock, email delivery, webhook)
  - Impact: 80% — Must fix all issues found before production deployment
- **Acceptance:**
  - [ ] Happy path test passed:
    - Add item to cart → checkout → pay with test card (`4242 4242 4242 4242`)
    - Order persists to KV (verify via Wrangler dashboard or CLI)
    - Webhook returns 200 to Stripe (check Stripe Dashboard)
    - Email receipt sent and received (check inbox, verify rendering)
    - Thank you page displays correctly (session ID, items, total, order ID)
  - [ ] Out-of-stock test passed:
    - Set inventory quantity to 0 in inventory.json for one variant
    - Attempt checkout → returns 409 (Insufficient stock)
    - Order not created (verify KV, Stripe Dashboard)
  - [ ] Email rendering test passed:
    - Check email in Gmail → renders correctly
    - Check email in Outlook → renders correctly
    - Check email in Apple Mail → renders correctly
    - Check email on mobile → renders correctly
  - [ ] CORS test passed (if cross-origin):
    - Frontend calls Worker API → no CORS errors
  - [ ] Environment isolation test passed:
    - Staging checkout creates Stripe session in test mode (verify in Stripe Dashboard → filter by "test mode")
    - KV order record written to staging namespace (verify via `wrangler kv:key list --env staging --binding ORDERS`)
    - Email sent from staging email service account (check logs for staging API key usage)
  - [ ] All issues fixed before proceeding to production deployment
  - [ ] Test results documented in `staging-test-results.md`
- **Validation contract:**
  - TC-01: Happy path checkout → complete checkout flow → order created, email sent, thank you page displays
  - TC-02: Out-of-stock blocking → checkout with zero quantity → returns 409, order not created
  - TC-03: Email delivery → check inbox → email received within 60 seconds
  - TC-04: Email rendering → open email in Gmail/Outlook/Apple Mail → no layout breaks
  - TC-05: Webhook success → Stripe Dashboard shows webhook delivery (test mode) → returns 200
  - TC-06: KV persistence → `wrangler kv:key list --env staging --binding ORDERS` → order record exists in staging namespace
  - TC-07: Secrets isolation → Stripe Dashboard → session created in test mode (not live mode), confirms staging secrets used
  - **Acceptance coverage:** TC-01 covers happy path, TC-02 covers out-of-stock, TC-03+TC-04 cover email, TC-05 covers webhook, TC-06+TC-07 cover namespace isolation
  - **Validation type:** manual end-to-end testing
  - **Run/verify:** Run checkout on staging, `wrangler kv:key list --env staging`, check Stripe Dashboard test mode, verify email inbox
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First staging test will reveal issues (email not sent, CORS error, wrong environment secrets)
  - **Green evidence:** After fixing issues, all tests pass successfully
  - **Refactor evidence:** Document test procedure for future deployments, add automated E2E tests (TASK-14)
- **Planning validation:**
  - Checks run: Reviewed staging deployment requirements, identified critical test cases
  - Unexpected findings: None (standard staging testing pattern)
- **What would make this ≥90%:** Automate E2E tests with Playwright or Cypress (covered in post-launch TASK-14)
- **Rollout / rollback:**
  - Rollout: No deployment for this task; purely testing and validation
  - Rollback: N/A (testing task, no deployment changes)
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/staging-test-results.md`:
    - Test cases executed
    - Test results (pass/fail)
    - Issues found and fixes applied
    - Screenshots/evidence of successful tests
- **Notes / references:**
  - Go/No-Go checklist from fact-find (Phase 5: Staging Deployment & Testing)

### TASK-12: Deploy frontend to production
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - External (Cloudflare Pages production deployment)
  - `[readonly] apps/cochlearfit/package.json` (build config)
- **Depends on:** TASK-11
- **Blocks:** TASK-13
- **Confidence:** 92%
  - Implementation: 95% — Production deployment mirrors staging (separate Wrangler environment)
  - Approach: 92% — Production Worker deployed independently with own KV namespace + secrets
  - Impact: 88% — Routing must work per strategy (same-origin /api/* route configured), production secrets must be isolated
- **Acceptance:**
  - [ ] Production Worker deployed: `wrangler deploy --env production` → Worker deployed with production KV + secrets
  - [ ] Production secrets already configured in TASK-09 (via `wrangler secret put --env production`, no suffixes)
  - [ ] Frontend deployed to Cloudflare Pages production: `https://cochlearfit.com`
  - [ ] Routing verified per strategy:
    - **Same-origin (recommended):** `curl https://cochlearfit.com/api/health` → Worker responds (routed via zone)
    - **Cross-origin:** CORS headers present in response
  - [ ] Production KV namespace bound: `wrangler kv:namespace list` shows production namespace ID matches wrangler.toml
  - [ ] Production secrets verified: `wrangler secret list --env production` shows 4 secrets (no suffixes)
- **Validation contract:**
  - TC-01: Production Worker deployment → `wrangler deploy --env production` → succeeds, shows production KV binding
  - TC-02: Frontend deployment → git push to production branch → Cloudflare Pages build succeeds
  - TC-03: Routing → `curl https://cochlearfit.com/api/checkout/session` (OPTIONS for CORS preflight) → responds
  - TC-04: KV namespace isolation → production Worker uses production KV (different namespace ID than staging)
  - TC-05: Secrets isolation → production Worker uses production Stripe key (Stripe Dashboard live mode, not test mode)
  - TC-06: CORS (if needed) → frontend fetch → `Access-Control-Allow-Origin` header present
  - **Acceptance coverage:** TC-01+TC-02 cover deployment, TC-03+TC-06 cover routing, TC-04+TC-05 cover isolation
  - **Validation type:** deployment verification + manual testing
  - **Run/verify:** `wrangler deploy --env production`, check Cloudflare dashboard, test routing
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First production deployment will have routing issues (route not configured for same-origin, or CORS misconfigured)
  - **Green evidence:** After configuring production routing, frontend successfully calls Worker API
  - **Refactor evidence:** Add deployment checklist, automate production deployment via CI/CD with manual approval gate
- **Planning validation:**
  - Checks run: Reviewed production deployment requirements
  - Unexpected findings: None (standard deployment pattern)
- **What would make this ≥90%:** Already at 90% (straightforward deployment after staging tests passed)
- **Rollout / rollback:**
  - Rollout: Production Worker deployed independently (`wrangler deploy --env production`), frontend deployed to production branch
  - Rollback: Revert production Worker via `wrangler rollback --env production`, revert Pages via git
- **Documentation impact:**
  - Update `apps/cochlearfit/README.md`:
    - Production deployment process (git push to production branch)
    - How to verify deployment (check logs, test routing)
- **Notes / references:**
  - Go/No-Go checklist from fact-find (Phase 6: Production Deployment)

### TASK-13: Run production smoke test
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - External (production environment testing)
  - `docs/plans/cochlearfit-deployment-readiness/production-smoke-test.md` (new doc)
- **Depends on:** TASK-12
- **Blocks:** TASK-14
- **Confidence:** 85%
  - Implementation: 90% — Smoke test is straightforward (small-value real purchase, verify results)
  - Approach: 85% — Real Stripe payment in live mode adds risk (must refund immediately)
  - Impact: 80% — Production traffic will be live; errors affect real customers
- **Acceptance:**
  - [ ] Production Pages deployment verified (https://cochlearfit.com accessible)
  - [ ] Smoke test executed:
    - Real small-value purchase (e.g., $1 test product or lowest-priced variant)
    - Use Stripe live mode (real card, real charge)
    - Verify environment isolation: checkout uses production Stripe secret (check Stripe Dashboard for live mode payment)
    - Email receipt arrives at customer email
    - Order persists to production KV namespace (verify via `wrangler kv:key list --env production --binding ORDERS`)
    - Thank you page displays correctly
  - [ ] Production Worker logs monitored for first 5 orders (Cloudflare dashboard → `cochlearfit-worker-production` logs)
  - [ ] No errors found in logs (Stripe API errors, email failures, inventory validation errors)
  - [ ] Smoke test order refunded via Stripe Dashboard
  - [ ] Test results documented in `production-smoke-test.md`
- **Validation contract:**
  - TC-01: Production checkout → complete real purchase → order created, email sent
  - TC-02: Environment isolation → Stripe Dashboard → payment in live mode (confirms production secrets used)
  - TC-03: KV namespace isolation → `wrangler kv:key list --env production --binding ORDERS` → order exists in production namespace
  - TC-04: Email delivery → check inbox → email received within 60 seconds
  - TC-05: Stripe Dashboard → payment visible in live mode → charge succeeded
  - TC-06: Refund → Stripe Dashboard → refund succeeds
  - **Acceptance coverage:** TC-01 covers smoke test, TC-02+TC-03 cover environment isolation, TC-04 covers email, TC-05+TC-06 cover Stripe
  - **Validation type:** manual smoke testing with real payment
  - **Run/verify:** Run checkout on production site with real card, verify results in Stripe Dashboard, KV dashboard, email inbox, Worker logs
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First production checkout will reveal deployment issues (wrong Worker bound to domain, CORS misconfigured)
  - **Green evidence:** After verifying routing and secrets, production checkout uses production secrets and writes to production KV namespace
  - **Refactor evidence:** Set up monitoring alerts for checkout errors, email failures, inventory validation errors
- **Planning validation:**
  - Checks run: Reviewed production smoke test requirements
  - Unexpected findings: None (standard smoke testing pattern)
- **What would make this ≥90%:** Automate smoke test with synthetic monitoring (e.g., Cloudflare Workers Analytics)
- **Rollout / rollback:**
  - Rollout: No deployment for this task; purely testing and validation
  - Rollback: N/A (testing task, but can revert frontend deployment if critical issues found)
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/production-smoke-test.md`:
    - Smoke test procedure
    - Test results (pass/fail)
    - Issues found and fixes applied
    - Monitoring setup (alerts configured)
- **Notes / references:**
  - Go/No-Go checklist from fact-find (Phase 6: Production Deployment)

### TASK-14: Add minimal Worker tests (pre-launch)
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/__tests__/` (expand test directory created in TASK-18)
  - `apps/cochlearfit-worker/README.md` (test running instructions + scope note)
  - `[readonly] apps/cochlearfit-worker/jest.config.cjs` (created in TASK-18)
  - `[readonly] apps/cochlearfit-worker/package.json` (test script created in TASK-18)
  - `[readonly] apps/cochlearfit-worker/src/worker-catalog.generated.ts` (generated dependency)
  - `[readonly] scripts/bundle-worker-catalog.ts` (catalog bundler validation)
- **Depends on:** TASK-18, TASK-21
- **Blocks:** TASK-12
- **Confidence:** 80%
  - Implementation: 90% — Jest harness feasibility verified by TASK-18 (E2: `pnpm --filter @apps/cochlearfit-worker test` PASS; commit 2545c6cb6b)
  - Approach: 85% — Pre-launch scope stays focused on build-time/catalog correctness; runtime-heavy tests deferred to TASK-16
  - Impact: 80% — Adds regression guards before production deploy; blast radius is limited to test files

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 75% (Vitest-based plan text)
- **Updated confidence:** 75% (tooling alignment; no uplift)
  - **Evidence class:** E1 (repo testing-policy + validation gate inspection)
- **Decision / resolution:**
  - Align Worker tests to Jest (repo standard and `scripts/validate-changes.sh` runner), remove Vitest-only assumptions.

#### Re-plan Update (2026-02-14) — Post TASK-18 Evidence
- **Previous confidence:** 75%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification: Jest harness boots and imports generated catalog)
  - Implementation: 90% — `pnpm --filter @apps/cochlearfit-worker test` PASS (TASK-18)
  - Approach: 85% — Tests are scoped to bundler/catalog correctness; avoids Worker runtime harness complexity
  - Impact: 80% — Adds pre-launch regression guard without touching production code
- **Investigation performed:**
  - Read: `apps/cochlearfit-worker/jest.config.cjs`, `apps/cochlearfit-worker/src/__tests__/catalog-wireup.test.ts`
  - Ran: `pnpm --filter @apps/cochlearfit-worker test` — PASS (commit 2545c6cb6b)
- **Changes to task:**
  - Confidence promoted above build threshold based on E2 evidence; no scope change

#### Re-plan Update (2026-02-14) — Scope Fix (README in Affects)
- **Previous confidence:** 80%
- **Updated confidence:** 80% (scope alignment only)
  - **Evidence class:** E1 (plan integrity check)
- **Decision / resolution:**
  - `apps/cochlearfit-worker/README.md` is listed as a Documentation impact; added it to `Affects` so `/lp-build` can update it without violating scope rules.

#### Re-plan Update (2026-02-14) — Validation Gate Unblocked (ESLint crash)
- **Previous confidence:** 80%
- **Updated confidence:** 80% (blocked until TASK-21)
  - **Evidence class:** E2 (executable verification: lint fails with config crash)
- **Investigation performed:**
  - Ran: `pnpm --filter @apps/cochlearfit-worker lint` → FAIL (`TypeError: Converting circular structure to JSON`)
  - Reproduced in another Worker package: `pnpm --filter @apps/xa-drop-worker lint` → FAIL (same error)
- **Decision / resolution:**
  - Create TASK-21 to fix the repo ESLint config crash; TASK-14 now depends on TASK-21 so build/validation can proceed deterministically.

- **Acceptance:**
  - [ ] Add at least 2 additional Jest tests under `apps/cochlearfit-worker/src/__tests__/` (beyond the TASK-18 spike)
  - [ ] Catalog bundler failure-mode test exists and passes:
    - Invalid `stripePriceId` in fixture data → bundler exits non-zero with a helpful error
  - [ ] Catalog bundler happy-path test exists and passes:
    - Valid fixture data → bundler succeeds; generated catalog imports and has 12 variants
  - [ ] All Worker tests pass locally: `pnpm --filter @apps/cochlearfit-worker test`
- **Validation contract:**
  - TC-01: Bundler rejects malformed Price ID → run test → process exits non-zero and stderr contains variant identifier
  - TC-02: Bundler accepts valid data → run test → process exits 0
  - TC-03: Generated catalog wiring → Jest imports generated catalog and asserts `catalog.length === 12`
  - **Acceptance coverage:** TC-01 covers failure mode, TC-02 covers happy path, TC-03 covers generated wiring
  - **Validation type:** unit tests (Jest) using child-process execution of the bundler
  - **Run/verify:** `pnpm --filter @apps/cochlearfit-worker test`
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First run will fail until fixtures + assertions exist
  - **Green evidence:** Jest suite runs deterministically and covers bundler failure + success paths
  - **Refactor evidence:** Extract fixture helpers for readability; keep assertions diagnostic
- **Planning validation:**
  - Checks run: Reviewed `scripts/validate-changes.sh` (Jest-based gate)
  - Unexpected findings: Existing TASK-14/TASK-16 text referenced Vitest; updated to match repo tooling
- **What would make this ≥90%:** Add a Worker-runtime harness test (Miniflare/wrangler dev) to cover request handling (deferred to TASK-16)
- **Rollout / rollback:**
  - Rollout: Tests run locally and in validation gate; no production changes
  - Rollback: N/A (tests only)
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md`:
    - How to run Worker tests (`pnpm --filter @apps/cochlearfit-worker test`)
    - Scope: pre-launch tests cover catalog/bundler correctness; runtime tests deferred

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commits:** 0e81f99616
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm --filter @apps/cochlearfit-worker test` — PASS
  - Ran: `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - Ran: `pnpm --filter @apps/cochlearfit-worker lint` — PASS
- **Implementation notes:**
  - Added bundler fixture tests in `apps/cochlearfit-worker/src/__tests__/bundle-worker-catalog.test.ts`.
  - Updated `apps/cochlearfit-worker/README.md` with test instructions + scope note.


### TASK-21: Fix ESLint flat-config crash (unblock Worker lint)
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `eslint.config.mjs`
- **Depends on:** -
- **Blocks:** TASK-14
- **Confidence:** 85%
  - Implementation: 90% — Small config change; validated by running package lints
  - Approach: 85% — Prefer first-party flat config usage over compat shims to avoid config-shape errors
  - Impact: 80% — Repo-wide lint gate stability; affects many packages
- **Acceptance:**
  - [ ] `pnpm --filter @apps/cochlearfit-worker lint` passes
  - [ ] `pnpm --filter @apps/xa-drop-worker lint` passes (regression check; previously reproduces the same crash)
  - [ ] ESLint config uses Next flat presets directly (no compat conversion of already-flat configs)
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cochlearfit-worker lint` → PASS
  - TC-02: `pnpm --filter @apps/xa-drop-worker lint` → PASS
  - **Acceptance coverage:** TC-01/TC-02 cover lint gate stability across two packages
  - **Validation type:** targeted lint runs
  - **Run/verify:** Run the two `pnpm --filter ... lint` commands above
- **Rollout / rollback:**
  - Rollout: None (repo tooling config only)
  - Rollback: Revert the config change if it causes rule regressions (should not; goal is to restore lint execution)
- **Documentation impact:** None

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commits:** 3f4876c5af (existing change in `eslint.config.mjs`), plus plan tracking commit 857d2129f9
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm --filter @apps/cochlearfit-worker lint` — PASS
  - Ran: `pnpm --filter @apps/xa-drop-worker lint` — PASS
- **Implementation notes:**
  - Root cause was a repo-level ESLint flat-config load crash; resolved by ensuring Next flat presets are used directly (no compat conversion of already-flat configs) in `eslint.config.mjs` (commit 3f4876c5af).

### TASK-15: Document fulfillment runbook (draft pre-launch)
- **Type:** IMPLEMENT
- **Deliverable:** Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/plans/cochlearfit-deployment-readiness/fulfillment-runbook.md` (new doc)
  - `[readonly] Stripe Dashboard` (order lookup reference)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Straightforward documentation task, manual CSV export process is well-documented by Stripe
  - Approach: 85% — Manual fulfillment via Stripe Dashboard is acceptable for MVP (no automated shipping integration needed)
  - Impact: 80% — Operations team needs clear runbook to avoid fulfillment errors (wrong items shipped, missed orders)
- **Acceptance:**
  - [ ] Fulfillment runbook **draft** created in `docs/plans/cochlearfit-deployment-readiness/fulfillment-runbook.md` with:
    - Order lookup procedure (Stripe Dashboard → Payments → filter by date range)
    - CSV export instructions (export columns: Order ID, Customer Email, Items, Quantities, Shipping Address)
    - Inventory reconciliation steps (match exported orders against inventory.json stock levels)
    - Fulfillment workflow (pick → pack → ship → mark fulfilled)
    - Refund workflow (Stripe Dashboard → Refunds → issue refund, update inventory)
    - Email remediation workflow (if order confirmation failed to send, manually resend from template)
    - Error handling (duplicate orders, payment disputes, address issues)
  - [ ] Runbook includes screenshots of Stripe Dashboard for critical steps
  - [ ] Runbook reviewed by operations team (or DRI for fulfillment)
  - [ ] **Validation with real order deferred to post-TASK-13** (runbook complete but not field-tested until production smoke test)
- **Validation contract:**
  - TC-01: Runbook structure → inspect doc → all sections present (lookup, export, reconciliation, fulfillment, refund, email remediation, error handling)
  - TC-02: Stripe Dashboard screenshots → inspect doc → critical steps illustrated with annotated screenshots
  - TC-03: CSV export columns → verify doc lists correct export fields (Order ID, Email, Items, Quantities, Address)
  - TC-04: Operations review → DRI reviews runbook → confirms clarity and completeness
  - TC-05 (post-TASK-13): Real order test → follow runbook with production smoke test order → all steps complete successfully
  - **Acceptance coverage:** TC-01-TC-04 cover draft completeness, TC-05 validates with real production order (deferred to post-TASK-13)
  - **Validation type:** documentation review + post-launch field test
  - **Run/verify:** Review runbook sections + screenshots; after TASK-13, execute runbook with real order
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First draft will be missing screenshots and error handling edge cases
  - **Green evidence:** After adding screenshots and operations review, runbook draft is complete (field test deferred to post-TASK-13)
  - **Refactor evidence:** Add troubleshooting section after real order experience, document common errors discovered
- **Planning validation:**
  - Checks run: Reviewed Stripe Dashboard export features, confirmed CSV export includes necessary fields
  - Unexpected findings: None (standard manual fulfillment pattern for MVP)
- **What would make this ≥90%:** Field test runbook with 5+ production orders (post-TASK-13), get operations team sign-off after field validation
- **Rollout / rollback:**
  - Rollout: Documentation artifact, no deployment required
  - Rollback: N/A (documentation only)
- **Documentation impact:**
  - Create `docs/plans/cochlearfit-deployment-readiness/fulfillment-runbook.md` (this is the deliverable)
- **Notes / references:**
  - Overall acceptance criterion: "Fulfillment process documented (manual CSV export from Stripe Dashboard)"
  - Manual fulfillment is acceptable for MVP per constraints section
  - **Two-phase approach:** Draft runbook pre-launch (depends on TASK-01 Stripe setup), field test with real order post-TASK-13
  - Future enhancement: integrate with shipping provider API (ShipStation, Shippo) for automated fulfillment

### TASK-16: Add comprehensive Worker tests (post-launch)
- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/src/__tests__/` (expand test directory)
  - `apps/cochlearfit-worker/package.json` (add coverage script and any required dev deps)
  - `apps/cochlearfit-worker/jest.config.cjs` (update config as needed)
  - `[readonly] apps/cochlearfit-worker/src/index.ts` (test subjects)
- **Depends on:** TASK-13
- **Blocks:** -
- **Confidence:** 70% ⚠️ BELOW THRESHOLD
  - Implementation: 75% — Jest unit tests are straightforward; Worker-runtime integration tests may require Miniflare or a custom harness
  - Approach: 70% — Need to decide the least-fragile mocking strategy for Stripe + KV + fetch
  - Impact: 65% — Broad edge-case surface (Stripe, email, inventory, KV idempotency) and risk of brittle mocks

#### Re-plan Update (2026-02-14)
- **Previous confidence:** 70% (Vitest-based plan text)
- **Updated confidence:** 70% (tooling alignment; no uplift)
  - **Evidence class:** E1 (repo testing-policy + validation gate inspection)
- **Decision / resolution:**
  - Keep comprehensive testing as a post-launch hardening task, aligned to Jest; if a Workers-native harness is needed, add a precursor SPIKE when ready.

- **Acceptance:**
  - [ ] Add comprehensive test files (or equivalents) covering:
    - Stripe session creation
    - Webhook handler flow (idempotency, persistence)
    - Email sending behavior (success/failure)
    - Inventory validation behavior (in-stock/out-of-stock/timeout)
  - [ ] Add coverage run capability (Jest `--coverage` or a `test:coverage` script)
  - [ ] All tests pass: `pnpm --filter @apps/cochlearfit-worker test`
  - [ ] Coverage report generated (aim for >70% statement coverage)
  - [ ] Edge cases covered: missing email, KV failure, upstream API timeout, malformed webhook payload
- **Validation contract:**
  - TC-01: Stripe session creation → valid payload → session request built correctly (mocked Stripe client)
  - TC-02: Webhook idempotency → same `session.id` twice → idempotent persistence
  - TC-03: Event deduplication → same `event.id` twice → second returns 200 without processing
  - TC-04: Email sending → success path → email client called with expected payload
  - TC-05: Email failure → provider error → webhook returns 200; error logged
  - TC-06: KV write failure → persistence error → webhook returns 500
  - TC-07: Inventory timeout → upstream timeout → checkout session creation fails with 503
  - **Acceptance coverage:** Critical paths + edge cases
  - **Validation type:** unit/integration tests (Jest)
  - **Run/verify:** `pnpm --filter @apps/cochlearfit-worker test -- --coverage`
- **Execution plan:**
  - **Red → Green → Refactor**
  - **Red evidence:** First comprehensive run will surface missing seams/mocks
  - **Green evidence:** Stable mocks + harness; tests pass consistently
  - **Refactor evidence:** Consolidate mock helpers; reduce brittleness; add regression tests for prior incidents
- **Planning validation:**
  - Checks run: Reviewed `scripts/validate-changes.sh` (Jest)
  - Unexpected findings: Existing TASK-16 text referenced Vitest/Miniflare; retained Miniflare as an option but kept runner consistent (Jest)
- **What would make this ≥90%:** Add a precursor SPIKE to validate a Workers-native runtime harness (Miniflare or Wrangler) with one passing request-level test
- **Rollout / rollback:**
  - Rollout: Tests added to validation gate / CI
  - Rollback: N/A (tests only)
- **Documentation impact:**
  - Update `apps/cochlearfit-worker/README.md`:
    - Test suite map + mocking strategy
    - How to run coverage




### TASK-17: Sanitize wrangler.toml + add env topology (no committed secrets)
- **Type:** IMPLEMENT
- **Deliverable:** code-change + Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/wrangler.toml` (remove committed secrets; add `[env.staging]` + `[env.production]` topology with no secret values)
  - `docs/plans/cochlearfit-deployment-readiness/worker-config.md` (new doc: secret names + wrangler commands; no values)
  - `[readonly] apps/cochlearfit-worker/src/index.ts` (env vars consumed)
- **Depends on:** TASK-05
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 90% — Mechanical config edits, validated by local `wrangler build`
  - Approach: 85% — Wrangler env sections are the repo’s preferred isolation pattern
  - Impact: 85% — Removes a known security footgun and clarifies deploy topology
- **Acceptance:**
  - [ ] `apps/cochlearfit-worker/wrangler.toml` contains no committed secret values/placeholders for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_SERVICE_API_KEY`, `INVENTORY_AUTHORITY_TOKEN`
  - [ ] `wrangler.toml` defines `[env.staging]` and `[env.production]` with distinct Worker names and KV namespace bindings
  - [ ] `docs/plans/cochlearfit-deployment-readiness/worker-config.md` created (secret names only; no values)
  - [ ] Local build succeeds: `pnpm --filter @apps/cochlearfit-worker build`
- **Validation contract:**
  - TC-01: Secret hygiene → `rg -n "REPLACE_ME|dev-inventory-token|INVENTORY_AUTHORITY_TOKEN\s*=\s*"" apps/cochlearfit-worker/wrangler.toml` → no matches
  - TC-02: Topology present → inspect `wrangler.toml` → `[env.staging]` and `[env.production]` exist
  - TC-03: Build → `pnpm --filter @apps/cochlearfit-worker build` → PASS

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 26e93dfeec
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1
  - Final validation: PASS
- **Validation Evidence:**
  - `rg -n "REPLACE_ME|dev-inventory-token|INVENTORY_AUTHORITY_TOKEN\s*=\s*\"\"" apps/cochlearfit-worker/wrangler.toml` — PASS (no matches)
  - `pnpm --filter @apps/cochlearfit-worker build` — PASS
  - `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - `pnpm --filter @apps/cochlearfit-worker lint` — PASS
- **Documentation updated:** `docs/plans/cochlearfit-deployment-readiness/worker-config.md` (new)
- **Implementation notes:**
  - Replaced committed token placeholders in `apps/cochlearfit-worker/wrangler.toml` with non-secret vars + per-env topology (`[env.staging]`, `[env.production]`).
  - No secret values are committed; secrets remain `wrangler secret put --env <staging|production>` responsibilities (TASK-09).

### TASK-18: Spike: Jest test harness for cochlearfit-worker
- **Type:** SPIKE
- **Deliverable:** code-change
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cochlearfit-worker/package.json` (add `test` script)
  - `apps/cochlearfit-worker/jest.config.cjs` (new)
  - `apps/cochlearfit-worker/src/__tests__/catalog-wireup.test.ts` (new)
  - `[readonly] apps/cochlearfit-worker/src/worker-catalog.generated.ts` (generated dependency)
- **Depends on:** TASK-05
- **Blocks:** TASK-14
- **Confidence:** 82%
  - Implementation: 85% — Jest is the repo standard; spike scope is one passing test
  - Approach: 82% — Confirms Worker code is testable under Node/Jest
  - Impact: 80% — Produces E2 evidence to promote/execute TASK-14 safely
- **Acceptance:**
  - [ ] `pnpm --filter @apps/cochlearfit-worker test` runs and passes
  - [ ] At least one test imports generated `catalog` and asserts `catalog.length === 12`
- **Validation contract:**
  - TC-01: Harness boots → `pnpm --filter @apps/cochlearfit-worker test` → PASS
  - TC-02: Catalog import → test imports `catalog` and asserts length 12

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 2545c6cb6b
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1
  - Final validation: PASS
- **Validation Evidence:**
  - `pnpm --filter @apps/cochlearfit-worker test` — PASS (1 test)
  - `pnpm --filter @apps/cochlearfit-worker typecheck` — PASS
  - `pnpm --filter @apps/cochlearfit-worker lint` — PASS
- **Implementation notes:**
  - Added `apps/cochlearfit-worker/jest.config.cjs` with `testEnvironment: node`.
  - Added `apps/cochlearfit-worker/src/__tests__/catalog-wireup.test.ts` asserting generated catalog length is 12.
  - Added `pretest` hook to run the catalog bundler before tests.

### TASK-19: Stripe setup memo + stripe-setup.md scaffold
- **Type:** INVESTIGATE
- **Deliverable:** Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` (new)
  - `[readonly] data/shops/cochlearfit/variants.json` (variant IDs)
- **Depends on:** -
- **Blocks:** TASK-01, TASK-08, TASK-09
- **Confidence:** 85%
- **Acceptance:**
  - [ ] `stripe-setup.md` exists with required product/variant list (12 variants, IDs aligned to `variants.json`)
  - [ ] Keys are documented as names/placeholders only (no secret values committed)
- **Validation contract:**
  - TC-01: Doc exists and references variant IDs from `data/shops/cochlearfit/variants.json`

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** ba0a454ace
- **Validation Evidence:**
  - Confirmed doc contains all 12 variant IDs from `data/shops/cochlearfit/variants.json` (script check)
- **Implementation notes:**
  - Created `docs/plans/cochlearfit-deployment-readiness/stripe-setup.md` scaffold (no secret values; IDs only).

### TASK-20: Inventory authority API contract memo + inventory-api.md scaffold
- **Type:** INVESTIGATE
- **Deliverable:** Documentation artifact
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/plans/cochlearfit-deployment-readiness/inventory-api.md` (new)
  - `[readonly] apps/cochlearfit-worker/src/index.ts` (contract)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-09
- **Confidence:** 85%
- **Acceptance:**
  - [ ] `inventory-api.md` exists and matches `apps/cochlearfit-worker/src/index.ts:170-194`
- **Validation contract:**
  - TC-01: Doc exists

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 92c9c549f7
- **Implementation notes:**
  - Created `docs/plans/cochlearfit-deployment-readiness/inventory-api.md` matching the Worker contract in `apps/cochlearfit-worker/src/index.ts:170-194` (Bearer auth, 200/409/503 semantics).


## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Stripe account setup delays (business verification)** | Medium | High | Start TASK-01 immediately; setup typically takes 1-3 days for verification. Have fallback plan for demo mode if verification delayed. |
| **Worker catalog hardcoding missed in planning** | Low | Critical | **Already addressed** — TASK-04 and TASK-05 explicitly fix hardcoded catalog before deployment |
| **Inventory authority API not ready at launch** | Medium | High | **Blocker per requirements** — TASK-02 must complete before TASK-09; delay launch if API not ready |
| **Email deliverability issues (spam filters)** | Medium | Medium | Use reputable provider (Resend/SendGrid in TASK-03); verify sender domain DNS; test with multiple clients in TASK-06 |
| **Customer email not in webhook payload** | High | High | **Mitigated** — TASK-07 implements session expansion for `customer_details.email` |
| **Secrets leaked via wrangler.toml** | High | High | **Fix required** — TASK-17 removes committed secrets from `wrangler.toml`; TASK-09 rotates/configures secrets via `wrangler secret put` |
| **CORS blocks production Pages origin** | Low | High | Test CORS in TASK-10 staging deployment; verify `PAGES_ORIGIN` includes all deployed origins |
| **Stripe API version breaking change** | Low | Medium | **Mitigated** — Pin Stripe API version via `Stripe-Version` header to the account's pinned version; verify webhook endpoint version alignment (TASK-01 + TASK-07) |
| **Worker tests missing cause regressions** | Medium | Medium | TASK-18 + TASK-14 add minimal Jest tests for catalog/bundler correctness; TASK-16 expands coverage post-launch |
| **KV namespace not provisioned in production** | Low | High | Verify KV binding in wrangler.toml matches production namespace in TASK-10; test in staging first |
| **Environment isolation fails (wrong secrets used)** | Low | High | Wrangler environments provide true isolation (separate deployments, KV namespaces, secrets); TASK-10+TASK-11 verify staging uses staging secrets; TASK-12+TASK-13 verify production uses production secrets |
| **Email template rendering breaks in Outlook** | Medium | Medium | TASK-06 tests email rendering across Gmail, Outlook, Apple Mail; use inline CSS and table layouts |

## Observability

**Logging:**
- Worker logs all checkout session creation attempts (success/failure)
- Worker logs all inventory validation API calls (in-stock/out-of-stock/error)
- Worker logs all email sending attempts (success/failure, recipient email)
- Worker logs all webhook deliveries (signature verification, payment status, order ID)
- Worker deployment environment visible via Cloudflare dashboard (staging vs production Workers listed separately)

**Metrics:**
- Stripe Dashboard: payment success/failure rates, average order value
- Email service dashboard: delivery/bounce/open rates
- Cloudflare Workers Analytics: request volume, error rate, latency

**Alerts:**
- Checkout session creation failures (error rate > 5%)
- Email sending failures (error rate > 10%)
- Inventory validation API unavailability (503 errors)
- Webhook signature verification failures
- KV write errors

**Dashboards:**
- Stripe Dashboard: payment metrics
- Email service dashboard: delivery metrics
- Cloudflare Workers dashboard: request metrics, logs

## Acceptance Criteria (overall)

- [ ] Worker catalog no longer hardcoded (build-time bundling implemented)
- [ ] Stripe account set up with test + production modes
- [ ] Inventory validation API configured and blocking out-of-stock checkouts
- [ ] Email order confirmations sent after payment success
- [ ] All secrets configured via `wrangler secret put` (no committed secret values in repo)
- [ ] Webhook idempotency implemented (duplicate Stripe events don't create duplicate orders)
- [ ] Staging deployment tested end-to-end (checkout, email, webhook)
- [ ] Production deployment tested with smoke test (real purchase, email sent)
- [ ] No regressions (frontend cart tests still passing)
- [ ] Wrangler environments configured (staging + production with separate KV namespaces)
- [ ] CORS working (frontend can call Worker API)
- [ ] First 5 production orders monitored with no critical errors
- [ ] Fulfillment process documented (manual CSV export from Stripe Dashboard)

## Launch Readiness Gate (Enforceable Checklist)

**Run this 10-minute check before go-live:**

### Configuration
- [ ] `wrangler whoami` shows correct Cloudflare account
- [ ] `wrangler kv:namespace list` shows 2 namespaces (staging + production)
- [ ] `wrangler secret list --env staging` shows 4 secrets (Stripe, Email, Inventory token)
- [ ] `wrangler secret list --env production` shows 4 secrets (Stripe, Email, Inventory token)
- [ ] `git log --oneline --grep="secret"` returns no commits with secret values (verify rotation complete)

### Stripe
- [ ] Stripe Dashboard → Developers → Webhooks shows 2 endpoints (staging + production) with status "Enabled"
- [ ] `stripe listen --forward-to <staging-worker-url>` forwards events successfully
- [ ] Stripe Dashboard → API version matches `Stripe-Version` header in Worker code

### Worker Health
- [ ] `curl <staging-worker-url>/api/health` returns 200 (if health endpoint exists) OR session creation returns 200
- [ ] `curl <production-worker-url>/api/health` returns 200 OR session creation returns 200
- [ ] KV write test: `wrangler kv:key put --env staging "test:launch-check" "OK"` succeeds
- [ ] KV write test: `wrangler kv:key put --env production "test:launch-check" "OK"` succeeds
- [ ] KV read test: `wrangler kv:key get --env staging "test:launch-check"` returns "OK"
- [ ] KV read test: `wrangler kv:key get --env production "test:launch-check"` returns "OK"

### Inventory API
- [ ] `curl -H "Authorization: Bearer <staging-token>" <staging-inventory-url>/api/inventory/validate` returns 200 or 400 (not 401/403/500)
- [ ] Inventory API p95 latency < 500ms (check logs/dashboard)
- [ ] Inventory API error rate < 1% over last 24 hours

### Email Service
- [ ] Email provider dashboard shows domain verified (green checkmark)
- [ ] DNS verification: `dig TXT <sender-domain>` shows SPF, DKIM records
- [ ] Test email send: `curl` email service API with test payload → email delivered to inbox (not spam)

### Rollback Procedure
- [ ] Rollback tested in staging: revert Worker deployment via `wrangler rollback --env staging --message "rollback reason"` succeeds
- [ ] Cloudflare Pages rollback tested: revert to previous deployment via dashboard succeeds
- [ ] Rollback runbook documented with exact commands for both envs:
  - Staging Worker: `wrangler rollback --env staging --message "<reason>"`
  - Production Worker: `wrangler rollback --env production --message "<reason>"`
  - Pages: Cloudflare dashboard → Deployments → select previous deployment → "Rollback to this deployment"

### On-Call Coverage
- [ ] DRI assigned for launch window (name:_____________)
- [ ] On-call escalation path documented (PagerDuty/Slack/Phone)
- [ ] Monitoring dashboards accessible (Cloudflare Workers, Stripe, Email service)
- [ ] Incident response runbook ready (common failure modes + fixes)

**Sign-off:**
- [ ] Technical lead reviewed: __________ (name + date)
- [ ] Product/business stakeholder informed of go-live: __________ (name + date)

## Decision Log

- 2026-02-14: Replanned low-confidence external setup tasks by adding explicit precursors TASK-17..TASK-20

- 2026-02-13: Initial plan created with 8 decisions from fact-find
- 2026-02-13: **REVISED Decision 4:** Changed from "single Worker with runtime URL detection" to "Wrangler environments with [env.staging] and [env.production]" for better isolation and elimination of fragile URL substring matching
- 2026-02-13: **REVISED Decision 5:** Updated Stripe API version from hardcoded "2024-12-18" to "use account-pinned version from Stripe Dashboard" (more maintainable)
- 2026-02-13: **REVISED Decision 7:** Corrected email logic — `customer_details.email` is a nested field (not an expandable), already included in session retrieval
- 2026-02-13: Added webhook idempotency requirement (critical for payment system reliability)
- 2026-02-13: Added capacity/limits modeling (KV writes: 1k/day, can handle ~500 orders/day)
- 2026-02-13: Added security requirements (secret rotation, log scrubbing, rate limiting, input validation)
- 2026-02-13: Added enforceable launch readiness gate (10-minute checklist before go-live)
