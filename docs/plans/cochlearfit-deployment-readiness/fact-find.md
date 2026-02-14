---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Feature-Slug: cochlearfit-deployment-readiness
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/cochlearfit-deployment-readiness/plan.md
Business-OS-Integration: off
Business-Unit: HEAD
Card-ID:
# Note: Business OS integration disabled - BOS_AGENT_API_KEY not configured
---

# Cochlear Fit Deployment Readiness Fact-Find Brief

## Scope

### Summary

Assess production deployment readiness for the Cochlear Fit e-commerce website. The codebase has production-quality cart and Stripe integration, but **the Worker catalog is hardcoded with placeholder Stripe Price IDs** (deployment blocker). Additionally requires: Stripe account setup, inventory authority API configuration, email receipt implementation, and frontend data file population.

### Goals

- Identify all deployment blockers (Worker catalog hardcoding is critical)
- Validate cart and checkout implementation completeness
- Document external dependencies and configuration requirements
- Create actionable plan with Stripe setup, Worker catalog fix, inventory validation, and email receipts

### Non-goals

- Redesigning existing cart or checkout architecture (already production-quality)
- Adding features beyond core e-commerce (order history, multi-currency, discounts)
- Implementing abandoned cart recovery or advanced analytics

### Constraints & Assumptions

**Constraints:**
- Must maintain existing architecture (Cloudflare Pages frontend + Worker backend)
- Must use Stripe Checkout hosted payment flow (already implemented)
- Must validate inventory against external authority API before go-live (launch requirement)
- Must send email order confirmations before go-live (launch requirement)
- Data files must follow existing schema contracts in `cochlearfitCatalog.server.ts`
- **CORS policy:** `PAGES_ORIGIN` is comma-separated allowlist; Worker falls back to first origin if request origin missing/not allowed (see `index.ts:157-162`)

**Assumptions:**
- Stripe account will be set up as part of this process (staging + production)
- Inventory authority API will be configured before launch
- Email service provider will be chosen and configured as part of implementation
- Product catalog data is available in some format (needs transformation to JSON)
- Cloudflare Workers KV namespace for order storage can be provisioned

---

## What Exists in Code (Verified)

### Frontend: Production-Ready Cart & Catalog System

**Entry Points:**
- `apps/cochlearfit/src/app/[lang]/page.tsx` — Home/product listing
- `apps/cochlearfit/src/app/[lang]/product/[slug]/page.tsx` — Product detail with variant selection
- `apps/cochlearfit/src/app/[lang]/cart/page.tsx` — Shopping cart
- `apps/cochlearfit/src/app/[lang]/checkout/page.tsx` — Checkout (Stripe redirect initiator)
- `apps/cochlearfit/src/app/[lang]/thank-you/page.tsx` — Order confirmation

**Cart Implementation (Complete):**
- `apps/cochlearfit/src/contexts/cart/CartContext.tsx` — React Context state management
- `apps/cochlearfit/src/contexts/cart/cartReducer.ts` — Reducer (add, remove, setQuantity, clear, hydrate)
- `apps/cochlearfit/src/contexts/cart/cartStorage.ts` — localStorage persistence (key: `"cochlearfit:cart"`, versioned)
- `apps/cochlearfit/src/lib/cart.ts` — Cart totals calculation
- `apps/cochlearfit/src/lib/quantity.ts` — Quantity validation/clamping (1-10)

**Catalog System (Server-Side with Fallback):**
- `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts` — Server catalog loader
  - **Fallback behavior:** If `products.json` missing, falls back to in-repo `products.ts` (line 206-216)
  - NOT "defaults to empty"
  - Reads from `data/shops/cochlearfit/*.json` when present
- `apps/cochlearfit/src/data/products.ts` — In-repo fallback catalog (hardcoded products)

**JSON File Schemas (CORRECTED):**

```typescript
// apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts:14-33
type CochlearfitProductRecord = {
  id?: string;
  sku: string;                                    // NOT "name"
  status?: string;
  title?: Localized<string>;                      // Localized = Record<string, T>
  description?: Localized<string>;
  media?: Array<{
    url: string;
    type: "image" | "video";
    altText?: string;                             // NOT "alt"
    title?: string;
  }>;
  style?: Localized<string>;
  shortDescription?: Localized<string>;
  longDescription?: Localized<string>;
  featureBullets?: Localized<string[]>;
  materials?: Localized<string[]>;
  careInstructions?: Localized<string[]>;
  compatibilityNotes?: Localized<string[]>;
  // NO "variants: string[]" field
};

// cochlearfitCatalog.server.ts:43-51
type VariantPricingRecord = {
  id: string;                                     // NOT "variantId"
  productSlug: string;                            // NOT "sku"
  size: ProductSize;
  color: ProductColor;
  price: number;
  currency: ProductVariant["currency"];
  stripePriceId: string;
};

// cochlearfitCatalog.server.ts:35-40
type InventoryRecord = {
  sku: string;                                    // Used as key in stock map (line 200)
  quantity: number;
  variant?: Record<string, string>;
  variantAttributes?: Record<string, string>;
  [key: string]: unknown;
};
```

**Catalog Loading (lines 190-203):**
- `readStockMap()` loads inventory.json
- Creates `Map<string, number>` where key is `row.sku` (line 200)
- In practice, `sku` is treated as variant ID

### Worker: Checkout API with Hardcoded Catalog (BLOCKER)

**API Routes:**
- `POST /api/checkout/session` — Creates Stripe checkout session
- `GET /api/checkout/session/:id` — Fetches session status for confirmation page
- `POST /api/stripe/webhook` — Handles Stripe payment completion events

**🚨 CRITICAL BLOCKER: Hardcoded Catalog (lines 122-128):**
```typescript
const catalog = [
  ...buildVariants("classic", "product.classic.name", { kids: 3400, adult: 3800 }),
  ...buildVariants("sport", "product.sport.name", { kids: 3600, adult: 4000 }),
];
```
- Worker catalog is **hardcoded** with placeholder Stripe Price IDs:
  - `price_${prefix}_${size.key}_${color.key}` (line 111)
  - Example: `price_classic_kids_sand`, `price_sport_adult_ocean`
- **Worker does NOT consume `data/shops/cochlearfit/*.json` files**
- **This blocks deployment** — Worker must either:
  1. Read from data files (requires build-time or runtime loading), OR
  2. Get Stripe Price IDs hardcoded into source before deployment

**Stripe Integration (Verified):**
- `createStripeSession()` (lines 262-305) — Creates session via `POST https://api.stripe.com/v1/checkout/sessions`
- `fetchStripeSession()` (lines 307-331) — Fetches session with `expand[]=line_items`
- `verifyStripeSignature()` (lines 333-360) — Webhook signature verification
- **No Stripe-Version header** — depends on Stripe account's default API version (line 290-297)

**Stripe Metadata (CORRECTED, lines 281-288):**
```typescript
metadata[shop_id] = "cochlearfit-worker"          // NOT "cochlearfit"
metadata[environment] = "dev" | "prod"             // NOT "staging" | "production"
// "dev" if env.SITE_URL includes "localhost", else "prod"
```

**Inventory Validation (lines 204-244):**
```typescript
// buildInventoryAuthorityItems() sends:
{
  items: [{
    sku: variant.id,                              // SKU = variant.id
    quantity: number,
    variantAttributes: { size: string }
  }]
}
// POST ${INVENTORY_AUTHORITY_URL}/api/inventory/validate
// Authorization: Bearer ${INVENTORY_AUTHORITY_TOKEN}
```

**Order Storage (lines 64-90):**
```typescript
// buildOrderRecord() creates:
{
  id, amountTotal, currency, status, created,
  paymentIntentId?, stripeCustomerId?,
  cartId?, orderId?, internalCustomerId?, environment?
}
// Stored in KV after webhook (NO customer email field)
```

**StripeSessionPayload (lines 33-42):**
```typescript
type StripeSessionPayload = {
  id?, payment_intent?, customer?,
  amount_total?, currency?, payment_status?,
  created?, metadata?
  // NO customer email!
};
```

**CORS Handling (lines 157-162):**
- `PAGES_ORIGIN` is comma-separated allowlist
- If request origin is null/missing, falls back to first allowed origin
- If request origin not in allowlist, falls back to first allowed origin

### Configuration (wrangler.toml)

**🚨 SECURITY ISSUE: Secrets in Plain Text (lines 9-14):**
```toml
[vars]
INVENTORY_AUTHORITY_TOKEN = "dev-inventory-token"     # COMMITTED SECRET

[env.production.vars]
INVENTORY_AUTHORITY_TOKEN = "REPLACE_ME"              # COMMITTED PLACEHOLDER
```
- **Violates "never commit secrets" policy**
- Must be moved to `wrangler secret put` workflow

**Environment Strategy Gap:**
- Only `[vars]` (default) and `[env.production.vars]` exist
- **No `[env.staging]` section**
- Staging strategy must be decided and documented

### Test Coverage (Comprehensive for Frontend)

**Existing Tests:**
- `__tests__/cartContext.test.tsx` — Cart Context operations
- `__tests__/cartReducer.test.ts` — All reducer actions
- `__tests__/cartStorage.test.ts` — localStorage persistence
- `__tests__/components.cart.test.tsx` — Cart UI
- `__tests__/components.checkout.test.tsx` — Checkout panel, thank you page
- `__tests__/checkoutButton.test.tsx` — Session creation flow

**Coverage Gaps:**
- **Worker has zero tests** (inventory validation, webhook handler, email sending)
- No E2E tests for full checkout flow
- No tests for CORS/origin handling
- No tests for signature verification edge cases

---

## External Dependencies (Not in Repo)

### 1. Stripe Account & Configuration

**Owner:** Pete (finance/operations)

**Required:**
- Stripe account (staging + production, or test/live mode on single account)
- Test mode API keys (secret key, webhook secret)
- Production API keys (secret key, webhook secret)
- Products created in Stripe Dashboard (or via API)
- **Stripe Price IDs** for each product variant (block Worker catalog fix)
- Webhook endpoints configured for both environments

**Acceptance Criteria:**
- [ ] Stripe account accessible
- [ ] Test mode keys documented
- [ ] Production keys documented (stored securely)
- [ ] All product variants have Stripe Price IDs
- [ ] Webhook endpoints configured and returning 200 on test events
- [ ] Stripe dashboard accessible for monitoring

**Current State:** Not set up (part of implementation)

### 2. Inventory Authority API

**Owner:** Pete (operations/backend)

**Required:**
- API endpoint URL
- Authentication token (Bearer token)
- Contract: `POST /api/inventory/validate` with payload:
  ```json
  {
    "items": [{
      "sku": "variant-id",
      "quantity": 1,
      "variantAttributes": { "size": "adult" }
    }]
  }
  ```
- Response: 200 (OK) or 409 (Insufficient stock)

**Acceptance Criteria:**
- [ ] API endpoint deployed and accessible
- [ ] Authentication token generated
- [ ] Test SKUs return expected validation results
- [ ] API contract documented
- [ ] Error responses (409, 503) tested

**Current State:** Not configured (launch requirement)

### 3. Email Service

**Owner:** Pete (product/marketing)

**Required:**
- Email service provider selected (recommend: Resend or SendGrid)
- Account created with API credentials
- Sender domain verified (DNS: SPF, DKIM, DMARC records)
- Email template designed (HTML + plain-text)
- Test mode/sandbox verified

**Acceptance Criteria:**
- [ ] Provider account active
- [ ] API credentials documented (stored securely)
- [ ] Sender domain DNS verified
- [ ] Email template created and tested across clients (Gmail, Outlook, Apple Mail)
- [ ] Test email successfully delivered

**Current State:** Not selected (launch requirement)

**Provider Options:**
- **Resend:** Best DX, React email templates, 100 emails/day free
- **SendGrid:** Proven reliability, 100 emails/day free
- **AWS SES:** Low cost ($0.10/1000), requires AWS account
- **Mailgun:** Good deliverability, 5000 emails/month free

---

## Decision Log

### Decision 1: Inventory Validation Required Before Launch
- **Status:** ✅ Decided
- **Decision:** Inventory validation API must be configured and blocking checkouts before go-live
- **Rationale:** Prevents overselling, launch requirement per user decision
- **Impact:** Inventory authority API becomes critical path blocker

### Decision 2: Email Receipts Required Before Launch
- **Status:** ✅ Decided
- **Decision:** Email order confirmations must be implemented and tested before go-live
- **Rationale:** Essential customer experience, launch requirement per user decision
- **Impact:** Email service integration and Worker webhook updates become critical path

### Decision 3: Stripe Setup Part of Implementation
- **Status:** ✅ Decided
- **Decision:** Stripe account setup (staging + production) will be completed as part of this project
- **Rationale:** No existing Stripe account; must create and configure from scratch
- **Impact:** Stripe setup becomes first critical path task (longest lead time due to verification)

### Decision 4: Environment Strategy (Revised for Free Tier)
- **Status:** ✅ Decided (Pragmatic Quality Choice)
- **Decision:** **Single Worker with environment detection** — Use one Worker with runtime environment detection via `SITE_URL`
- **Rationale:**
  - **Free tier friendly:** Cloudflare Workers free tier is 100k requests/day total. Single Worker = simpler quota management
  - **KV namespace economy:** Free tier includes KV, but separate namespaces add complexity. Use environment-prefixed keys instead (`staging:order:123`, `prod:order:456`)
  - **Stripe mode separation:** Use Stripe test mode keys for staging domain, live mode keys for production domain (detected via `SITE_URL`)
  - **Acceptable risk:** Low-volume e-commerce site, staging/production traffic combined unlikely to hit 100k requests/day
  - **Future upgrade path:** When traffic/revenue justifies it, migrate to separate Workers (or Workers Paid plan at $5/month)
  - **Good enough isolation:** Different Stripe modes, different domains, environment-prefixed KV keys prevent most accidents
- **Implementation:**
  - Single Worker with environment detection: `const env = req.url.includes('staging') ? 'staging' : 'production'`
  - Secrets named with environment suffix: `STRIPE_SECRET_KEY_STAGING`, `STRIPE_SECRET_KEY_PRODUCTION`
  - KV keys prefixed: `${environment}:order:${orderId}`
  - Deploy once: `wrangler deploy` (serves both staging and production)
- **Migration Path:** When revenue > $500/month or traffic > 50k req/day, migrate to separate Workers

### Decision 5: Stripe API Version Strategy
- **Status:** ✅ Decided (Long-Term Quality Choice)
- **Decision:** **Pin API version** — Add `Stripe-Version: "2024-12-18"` header to all Stripe API calls
- **Rationale:**
  - Prevents breaking changes when Stripe upgrades account's default API version
  - Explicit control over API behavior and response formats
  - Enables testing version upgrades in staging before production
  - Standard production best practice for external API integrations
  - Low implementation cost (single header addition)
- **Implementation:**
  - Add `"Stripe-Version": "2024-12-18"` to headers in `createStripeSession()` (line 292)
  - Add `"Stripe-Version": "2024-12-18"` to headers in `fetchStripeSession()` (line 314)
  - Document version in code comments with upgrade testing procedure
  - Test new versions in staging before upgrading production

### Decision 6: Worker Catalog Strategy
- **Status:** ✅ Decided (Long-Term Quality Choice)
- **Decision:** **Build-time bundling** — Bundle `data/shops/cochlearfit/*.json` into Worker at build time
- **Rationale:**
  - Single source of truth: Frontend and Worker read from same data files
  - Catalog updates don't require Worker code changes or redeployment
  - Adding products/variants becomes data-only operation
  - Supports non-technical catalog management (edit JSON, commit, CI deploys)
  - Frontend catalog loading already exists as reference implementation
  - Better than hardcoding (no code duplication) and runtime loading (no cold-start latency)
- **Implementation:**
  - Add build script: `scripts/bundle-worker-catalog.ts`
  - Script reads `data/shops/cochlearfit/*.json` → generates `worker-catalog.generated.ts`
  - Import generated catalog in Worker instead of hardcoded `buildVariants()`
  - Add build step to Worker package.json: `"prebuild": "tsx scripts/bundle-worker-catalog.ts"`
  - Generated file excluded from git (add to .gitignore), regenerated on every build
  - Validation: Build fails if Stripe Price IDs missing or malformed
- **Blocker:** Must obtain real Stripe Price IDs before populating data files

### Decision 7: Email Recipient Source
- **Status:** ✅ Decided (Long-Term Quality Choice)
- **Decision:** **Expand session customer_details** — Fetch `customer_details.email` from Stripe session in webhook
- **Rationale:**
  - No frontend changes required (Stripe Checkout already collects email)
  - No additional API calls (single session fetch gets all data)
  - Most reliable source (Stripe validates email format during checkout)
  - Supports guest checkout (no customer object required)
  - Standard pattern for Stripe Checkout email receipts
- **Implementation:**
  - Update `fetchStripeSession()` to include `expand[]=customer_details` (line 309)
  - Update `StripeSessionPayload` type to include `customer_details?: { email?: string }` (line 33)
  - Update `buildOrderRecord()` to include `customerEmail?: string` field (line 64)
  - Extract email in webhook handler: `session.customer_details?.email`
  - Pass email to email service when sending receipt
  - Handle missing email gracefully (log warning, don't fail webhook)

### Decision 8: Cart Expiration Strategy
- **Status:** ⚠️ Deferred to Post-Launch
- **Current State:** Cart persists indefinitely in localStorage
- **Options:**
  1. **Add TTL:** Implement 30-day expiration with cleanup on load
  2. **Keep indefinite:** Accept current behavior (user-friendly for MVP)
- **Recommendation:** Option 2 (keep indefinite) for launch — Low risk, common pattern
- **Revisit:** Add to post-launch backlog if stale carts become a support issue

---

## Go/No-Go Checklist

### Phase 1: Stripe & Infrastructure Setup ✅

- [ ] **Stripe account created** (or access granted)
- [ ] **Test mode enabled** with API keys generated
- [ ] **Production mode enabled** with API keys generated
- [ ] **Products created** in Stripe Dashboard (2 products: Classic, Sport)
- [ ] **Variants created** (4 variants per product: kids/adult × 3 colors = 6 variants × 2 products = 12 total)
- [ ] **Stripe Price IDs documented** (12 Price IDs total)
- [ ] **Webhook endpoints configured** (test + production)
- [ ] **Test webhook delivery verified** (use Stripe CLI: `stripe listen --forward-to localhost:8788/api/stripe/webhook`)
- [ ] **Inventory authority API deployed** and accessible
- [ ] **Inventory auth token generated** and documented
- [ ] **Inventory validation tested** with sample SKUs (in-stock allows, out-of-stock blocks)

### Phase 2: Worker Catalog Fix (CRITICAL) ✅

- [ ] **Decision made** on Worker catalog strategy (hardcode vs build-time vs runtime)
- [ ] **Real Stripe Price IDs obtained** from Phase 1
- [ ] **Worker catalog updated** with real Price IDs (if hardcoding) OR build system configured (if build-time)
- [ ] **Worker catalog tested** locally (verify Price IDs match Stripe)
- [ ] **Placeholder Price IDs removed** (`price_classic_kids_sand`, etc.)

### Phase 3: Email Receipt Implementation ✅

- [ ] **Email service provider selected** (Resend or SendGrid recommended)
- [ ] **Email service account created** with API credentials
- [ ] **Sender domain configured** and DNS verified (SPF, DKIM, DMARC)
- [ ] **HTML email template created** with order details (items, total, order ID)
- [ ] **Plain-text fallback created**
- [ ] **Email template tested** across clients (Gmail, Outlook, Apple Mail, mobile)
- [ ] **Worker updated** with email service client library
- [ ] **Webhook handler updated** to send email after payment success
- [ ] **Email recipient source implemented** (expand `customer_details.email` from Stripe session)
- [ ] **Error handling added** (log email failures, don't fail webhook)
- [ ] **Test email sent** via webhook with Stripe test event

### Phase 4: Data Files & Configuration ✅

- [ ] **Frontend data files created:**
  - [ ] `data/shops/cochlearfit/products.json` (2 products with localized fields)
  - [ ] `data/shops/cochlearfit/variants.json` (12 variants with real Stripe Price IDs)
  - [ ] `data/shops/cochlearfit/inventory.json` (12 inventory records with realistic quantities)
- [ ] **JSON schema validation** added to Worker (catch malformed data at startup)
- [ ] **Server-side catalog loading verified** (frontend reads from data files, falls back to products.ts if missing)
- [ ] **Staging Worker secrets configured:**
  - [ ] `STRIPE_SECRET_KEY` (test mode)
  - [ ] `STRIPE_WEBHOOK_SECRET` (test endpoint)
  - [ ] `EMAIL_SERVICE_API_KEY` (test mode)
  - [ ] `INVENTORY_AUTHORITY_TOKEN` (staging token)
- [ ] **Staging Worker env vars set:**
  - [ ] `SITE_URL` (staging Pages URL)
  - [ ] `PAGES_ORIGIN` (staging Pages origin, comma-separated if multiple)
  - [ ] `INVENTORY_AUTHORITY_URL` (staging API endpoint)
  - [ ] `EMAIL_FROM_ADDRESS` (verified sender email)
  - [ ] `EMAIL_FROM_NAME` (e.g., "Cochlear Fit Orders")
- [ ] **Secrets removed from wrangler.toml** (`INVENTORY_AUTHORITY_TOKEN` moved to secrets)

### Phase 5: Staging Deployment & Testing ✅

- [ ] **Worker deployed** to staging environment
- [ ] **Frontend deployed** to Cloudflare Pages staging
- [ ] **End-to-end checkout test** with Stripe test card (`4242 4242 4242 4242`)
- [ ] **Order persists to KV** (verify via Wrangler KV CLI or dashboard)
- [ ] **Webhook delivery verified** (Stripe Dashboard shows 200 response)
- [ ] **Email receipt sent and received** (check inbox, verify rendering)
- [ ] **Inventory validation blocks out-of-stock** (test with zero quantity in inventory.json)
- [ ] **Thank you page displays correctly** (session status, items, total, order ID)
- [ ] **CORS verified** (frontend can call Worker API from Pages origin)
- [ ] **All staging issues fixed** before proceeding

### Phase 6: Production Deployment ✅

- [ ] **Production Worker secrets configured:**
  - [ ] `STRIPE_SECRET_KEY` (live mode)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production endpoint)
  - [ ] `EMAIL_SERVICE_API_KEY` (production mode)
  - [ ] `INVENTORY_AUTHORITY_TOKEN` (production token)
- [ ] **Production Worker env vars set:**
  - [ ] `SITE_URL` (production Pages URL)
  - [ ] `PAGES_ORIGIN` (production Pages origin)
  - [ ] `INVENTORY_AUTHORITY_URL` (production API endpoint)
- [ ] **KV namespace verified** (binding matches production namespace ID)
- [ ] **Worker deployed** to production
- [ ] **Frontend built** with `OUTPUT_EXPORT=1` (static export)
- [ ] **Frontend deployed** to Cloudflare Pages production
- [ ] **Routing verified** (frontend can call Worker `/api/*` routes)
- [ ] **Final smoke test** with real small-value purchase (refund after test)
- [ ] **Email receipt arrives** for smoke test order
- [ ] **Error monitoring enabled** (Cloudflare Workers logs, email service dashboard)
- [ ] **First 5 orders monitored** for errors

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Stripe account setup delays (business verification)** | Medium | High | Start Stripe setup immediately; setup typically takes 1-3 days for verification |
| **Worker catalog hardcoding missed in planning** | Low | Critical | **Already identified** — Phase 2 now explicitly requires catalog fix before deployment |
| **Inventory authority API not ready at launch** | Medium | High | **Blocker per requirements** — must prioritize API setup or delay launch |
| **Email deliverability issues (spam filters)** | Medium | Medium | Use reputable provider (Resend/SendGrid); verify sender domain DNS; test with multiple clients |
| **Customer email not in webhook payload** | High | High | **Mitigated** — Decision 7 documents solution (expand `customer_details` in webhook) |
| **Secrets leaked via wrangler.toml** | High | High | **Fix required** — Move `INVENTORY_AUTHORITY_TOKEN` to `wrangler secret put` workflow |
| **CORS blocks production Pages origin** | Low | High | Test CORS in staging with production-like origin; verify `PAGES_ORIGIN` includes all deployed origins |
| **Stripe API version breaking change** | Low | Medium | **Mitigate** — Pin API version with `Stripe-Version` header (Decision 5) |
| **Worker tests missing cause regressions** | Medium | Medium | Add minimal Worker tests to critical path (inventory mock, email mock, signature verification) |
| **KV namespace not provisioned in production** | Low | High | Verify KV binding in wrangler.toml matches production namespace; test in staging first |

---

## Planning Constraints & Notes

### Must-Follow Patterns
- Use existing cart Context + Reducer architecture (no state management changes)
- Follow `cochlearfitCatalog.server.ts` schema contracts **exactly** for data files
- Use `wrangler secret put` for all Worker secrets (never commit secrets)
- Test with Stripe test mode before production deployment
- Send transactional emails from webhook handler (not synchronously during checkout)
- Pin Stripe API version with header (prevent breaking changes)

### Rollout/Rollback Expectations
- Deploy to staging first with Stripe test keys and email service test mode
- Run end-to-end checkout test in staging (payment + email delivery)
- Deploy Worker first (API must be available before frontend)
- Frontend deployment is zero-downtime (static asset update)
- Rollback: Revert Worker deployment via Wrangler, clear Cloudflare Pages cache
- Email service failures should log errors but not block order processing

### Observability Expectations
- Monitor Stripe Dashboard for payment success/failure rates
- Monitor email service dashboard for delivery/bounce/open rates
- Monitor Cloudflare Workers logs for API errors (email, inventory, Stripe)
- Monitor KV namespace for order volume
- Set up alerts for:
  - Checkout session creation failures
  - Email sending failures
  - Inventory validation API unavailability
  - Webhook signature verification failures

### Data Quality Expectations
- All products in data files must have valid Stripe Price IDs
- Inventory quantities must be non-negative integers
- Variant IDs must be unique across all products
- SKUs in `inventory.json` must match `id` values in `variants.json`
- Email templates must render correctly across major email clients (Gmail, Outlook, Apple Mail)
- Localized fields must have at least `en` locale

---

## Confidence Inputs (for /lp-plan)

**Implementation: 70%**
- Medium-high confidence: Cart/checkout are production-quality
- Missing: Worker catalog fix (straightforward but critical), Stripe setup, email integration, data files
- **What would raise to ≥90%:** Fix Worker catalog with real Price IDs, complete Stripe account setup, select email provider

**Approach: 85%**
- High confidence: Architecture follows best practices (Cloudflare + Stripe + email)
- Tradeoffs: Worker catalog hardcoding requires decision (hardcode vs build-time vs runtime)
- **What would raise to ≥90%:** Make Worker catalog decision, verify approach with Pete

**Impact: 70%**
- Medium confidence: Changes mostly isolated (Worker catalog, email integration)
- Blast radius: Email failures don't block checkout; inventory API unavailability blocks checkout (launch requirement)
- **What would raise to ≥90%:** Test inventory validation error handling, test email sending from staging webhook

**Delivery-Readiness: 55%**
- Medium-low confidence: Clear deployment path but blocked on multiple external dependencies
- Gaps: Stripe account, Worker catalog fix, email service, inventory API, data files, secrets management
- **What would raise to ≥90%:** Complete all setup tasks in Phase 1-3, run staging tests successfully

**Testability: 75%**
- Good confidence: Frontend has comprehensive tests, clear seams for Worker mocking
- Gaps: Worker has zero tests (must add minimal tests before launch per updated plan)
- **What would raise to ≥90%:** Add Worker unit tests for inventory mock, email mock, signature verification

---

## Suggested Task Seeds (Non-binding)

### Phase 1: Stripe & Infrastructure Setup (Critical Path)

**TASK-01: Set up Stripe account and products**
- Create Stripe account (or get access)
- Enable test mode and generate API keys
- Enable production mode and generate API keys
- Create 2 products: "Classic Sound Sleeve", "Sport Sound Sleeve"
- Create 6 variants per product (kids/adult × sand/ocean/berry)
- Document all 12 Stripe Price IDs
- Configure webhook endpoints (test: `https://cochlearfit-api-staging.workers.dev/api/stripe/webhook`, prod: `https://cochlearfit-api.workers.dev/api/stripe/webhook`)
- Test webhook delivery with Stripe CLI

**TASK-02: Set up inventory authority API**
- Deploy inventory validation endpoint (or use existing)
- Generate authentication token
- Test with sample SKUs (in-stock allows, out-of-stock returns 409)
- Document API contract and error responses

**TASK-03: Create data file templates**
- Create `data/shops/cochlearfit/products.json` with 2 products (localized title/description)
- Create `data/shops/cochlearfit/variants.json` with 12 variants (PLACEHOLDER Price IDs for now)
- Create `data/shops/cochlearfit/inventory.json` with 12 inventory records
- Test frontend catalog loading with templates
- Verify fallback to `products.ts` if products.json removed

### Phase 2: Worker Catalog Fix (BLOCKER)

**TASK-04: Implement build-time catalog bundling**
- Create `scripts/bundle-worker-catalog.ts` script
- Script reads `data/shops/cochlearfit/*.json` and generates `worker-catalog.generated.ts`
- Add validation: fail build if Stripe Price IDs missing or malformed
- Add to Worker package.json: `"prebuild": "tsx scripts/bundle-worker-catalog.ts"`
- Add `worker-catalog.generated.ts` to .gitignore
- Test: Run build script with template data files, verify generated catalog structure

**TASK-05: Replace hardcoded catalog with generated import**
- Wait for TASK-01 completion (Stripe Price IDs available)
- Wait for TASK-04 completion (build script ready)
- Replace hardcoded `buildVariants()` calls (lines 122-124) with `import { catalog } from './worker-catalog.generated'`
- Remove `buildVariants()` function (no longer needed)
- Update types to match generated catalog format
- Test locally: Run prebuild → verify generated catalog → create test session → verify line items match Stripe
- Commit changes (excluding generated file)

### Phase 3: Email Receipt Implementation (Critical Path)

**TASK-06: Select and set up email service**
- Choose provider (Resend or SendGrid)
- Create account and get API credentials
- Configure sender domain (e.g., `orders@cochlearfit.com`)
- Verify DNS records (SPF, DKIM, DMARC)
- Test email sending in provider's test mode/sandbox

**TASK-07: Create email receipt template**
- Design HTML email template with order details (items, quantities, prices, total, order ID)
- Include company branding and contact information
- Add plain-text fallback version
- Test rendering across email clients (Gmail, Outlook, Apple Mail, mobile)

**TASK-08: Implement email sending in Worker webhook**
- Add email service client library to Worker dependencies (e.g., `@sendgrid/mail` or `resend`)
- Update `fetchStripeSession()` to include `expand[]=customer_details` (line 309)
- Update `StripeSessionPayload` type to include `customer_details?: { email?: string }`
- Update `buildOrderRecord()` to include `customerEmail?: string` field
- Extract email in webhook handler: `session.customer_details?.email`
- Call email service API after payment success (line ~470 in index.ts)
- Pass order details (items, total, order ID) and customer email to email template
- Add error handling: log email failures, return 200 to Stripe (prevent retries)
- Handle missing email gracefully: log warning, continue webhook processing
- Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Phase 4: Data Files & Configuration (Critical Path)

**TASK-09: Populate production data files**
- Wait for TASK-01 completion (Stripe Price IDs available)
- Update `variants.json` with real Stripe Price IDs (replace placeholders)
- Set realistic inventory quantities in `inventory.json`
- Validate JSON structure matches schemas
- Commit data files to repo

**TASK-10: Fix secrets management in wrangler.toml**
- Remove `INVENTORY_AUTHORITY_TOKEN` from `[vars]` and `[env.production.vars]`
- Document that it must be set via `wrangler secret put INVENTORY_AUTHORITY_TOKEN`
- Update wrangler.toml comments to clarify secrets vs env vars

**TASK-11: Configure Worker secrets for both environments (single Worker)**
- Run `wrangler secret put STRIPE_SECRET_KEY_STAGING` (test mode key)
- Run `wrangler secret put STRIPE_SECRET_KEY_PRODUCTION` (live mode key)
- Run `wrangler secret put STRIPE_WEBHOOK_SECRET_STAGING` (test endpoint secret)
- Run `wrangler secret put STRIPE_WEBHOOK_SECRET_PRODUCTION` (production endpoint secret)
- Run `wrangler secret put EMAIL_SERVICE_API_KEY_STAGING` (test mode key)
- Run `wrangler secret put EMAIL_SERVICE_API_KEY_PRODUCTION` (production mode key)
- Run `wrangler secret put INVENTORY_AUTHORITY_TOKEN_STAGING` (staging token)
- Run `wrangler secret put INVENTORY_AUTHORITY_TOKEN_PRODUCTION` (production token)
- Set env vars in wrangler.toml `[vars]`:
  - `STAGING_SITE_URL` = `https://cochlearfit-staging.pages.dev`
  - `PRODUCTION_SITE_URL` = `https://cochlearfit.com`
  - `STAGING_PAGES_ORIGIN` = `https://cochlearfit-staging.pages.dev`
  - `PRODUCTION_PAGES_ORIGIN` = `https://cochlearfit.com`
  - `STAGING_INVENTORY_URL` = staging API endpoint
  - `PRODUCTION_INVENTORY_URL` = production API endpoint
  - `EMAIL_FROM_ADDRESS` = verified sender email
  - `EMAIL_FROM_NAME` = "Cochlear Fit Orders"

### Phase 5: Staging Deployment & Testing (Critical Path)

**TASK-12: Deploy Worker and frontend to staging**
- Deploy Worker once: `wrangler deploy` (serves both staging and production via environment detection)
- Deploy frontend to Cloudflare Pages staging (`cochlearfit-staging.pages.dev`)
- Verify routing (`/api/*` calls from staging Pages → Worker detects staging environment via origin)
- Test environment detection: staging Pages should use `STRIPE_SECRET_KEY_STAGING`
- Verify KV keys are prefixed with `staging:` for staging orders

**TASK-13: Run end-to-end staging tests**
- Add item to cart → checkout → pay with test card (`4242 4242 4242 4242`)
- Verify order persists to KV (check Wrangler dashboard or CLI)
- Verify webhook returns 200 to Stripe (check Stripe Dashboard)
- Verify email receipt sent and received (check inbox)
- Test email rendering in Gmail, Outlook, Apple Mail
- Test inventory validation: set quantity to 0 in inventory.json, verify checkout blocked with 409
- Test thank you page displays correctly with session ID
- Fix any issues found

### Phase 6: Production Deployment (Critical Path)

**TASK-14: Deploy production frontend (Worker already deployed)**
- Worker is already deployed (serves both environments)
- Production secrets already configured in TASK-11 (suffixed with `_PRODUCTION`)
- Deploy frontend to Cloudflare Pages production (`cochlearfit.com`)
- Verify routing (`/api/*` calls from production Pages → Worker detects production environment via origin)
- Test environment detection: production Pages should use `STRIPE_SECRET_KEY_PRODUCTION`
- Verify KV keys are prefixed with `prod:` for production orders

**TASK-15: Run production smoke test**
- Verify production Pages deployment is live
- Run smoke test: real small-value purchase (e.g., $1 test product) with Stripe live mode
- Verify environment detection: checkout uses `STRIPE_SECRET_KEY_PRODUCTION` (check Worker logs)
- Verify email receipt arrives at customer email
- Verify order persists to KV with `prod:` prefix (isolated from staging by key prefix)
- Monitor Worker logs for first 5 orders (both staging and production traffic visible in same logs)
- Refund smoke test order

### Post-Launch: Testing & Monitoring

**TASK-16: Add Worker unit tests**
- Test inventory validation with mocked fetch
- Test Stripe session creation with mocked Stripe API
- Test webhook handler with fixture payloads
- Test email sending with mocked email service
- Test signature verification with test secrets
- Add to CI pipeline

**TASK-17: Add E2E checkout tests**
- Set up Playwright or Cypress
- Test full flow: cart → checkout → Stripe redirect → confirmation
- Test out-of-stock blocking
- Test email receipt delivery (using email service test mode)
- Add to CI pipeline

**TASK-18: Set up monitoring and alerting**
- Cloudflare Workers: alert on error rate > 5%
- Email service: alert on bounce rate > 2%
- Stripe Dashboard: monitor payment failure rate
- Create dashboard for key metrics (conversion, email delivery, inventory blocks)

### Post-Launch: Enhancements

**TASK-19: Add cart expiration logic** (P2)
- Implement 30-day TTL for localStorage carts
- Clean up expired carts on load
- Notify user if cart was cleared

**TASK-20: Build order history feature** (P1)
- Add user authentication
- Store user ID with orders in KV
- Create order history page
- Add "View past orders" link

---

## Planning Readiness

**Status:** ✅ Ready-for-planning

**Key Decisions Made:**
1. ✅ Inventory validation required before launch
2. ✅ Stripe setup (staging + production) part of implementation
3. ✅ Email receipts required before launch
4. ✅ **Separate Workers for staging/production** (true environment isolation)
5. ✅ **Pin Stripe API version** (prevent breaking changes)
6. ✅ **Build-time catalog bundling** (single source of truth, no code duplication)
7. ✅ **Expand session customer_details** for email (no frontend changes, no extra API calls)

**Critical Path:**
1. Stripe account setup (Phase 1) — longest lead time
2. Worker catalog fix (Phase 2) — **BLOCKER, depends on Stripe Price IDs**
3. Email service integration (Phase 3) — launch requirement
4. Data files + config (Phase 4) — depends on Stripe Price IDs
5. Staging tests (Phase 5) — gate before production
6. Production deployment (Phase 6) — final go-live

**Recommended Next Steps:**
1. ✅ All decisions made (long-term quality choices)
2. Run `/lp-plan` to create detailed task breakdown with dependencies
3. Start Stripe account setup immediately (longest lead time)
4. Once Stripe Price IDs available, unblock Worker catalog bundling (TASK-04, TASK-05)
5. Parallel: Select email service and start domain verification
6. Sequential: Catalog bundling → Staging deployment → Staging tests → Production deployment

**Timeline Estimate:**
- Phase 1 (Stripe + Inventory): 2-3 days (depends on Stripe verification)
- Phase 2 (Worker catalog bundling): 1-2 days (build script + integration, after Price IDs available)
- Phase 3 (Email implementation): 2-3 days
- Phase 4 (Data + config): 1 day
- Phase 5 (Staging tests): 1-2 days
- Phase 6 (Production deploy): 1 day
- **Total: ~9-14 business days** (depends on Stripe verification; +1 day for build-time bundling)

**Note:** Worker catalog hardcoding is critical blocker. Phase 2 (build-time bundling) unblocks deployment and provides long-term maintainability. Phase 2 cannot proceed until Phase 1 delivers Stripe Price IDs.

**Quality Choices:** All decisions balance long-term quality with pragmatic constraints:
- Single Worker with environment detection (not separate Workers) — Free tier friendly, good-enough isolation
- Pin Stripe API version (not account default) — Prevent breaking changes
- Build-time bundling (not hardcoding) — Single source of truth
- Expand session (not extra API calls) — Simplest reliable source

**Free Tier Note:** Single Worker approach keeps deployment within Cloudflare free tier (100k requests/day). When traffic/revenue grows, migrate to separate Workers or Workers Paid plan ($5/month for unlimited requests).
