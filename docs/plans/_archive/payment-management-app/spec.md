# Payment Management App — Specification

**Date:** 2026-03-13
**Status:** Proposal
**Owner:** Peter Cowling

---

## Problem

Payment management is currently embedded inside `apps/caryina` — the storefront for one specific shop. This creates several problems:

1. **No portfolio-level visibility.** Refunds and order status for HBAG, CMP, or future shops must go through their own separate admin surfaces (if they have one at all).
2. **Provider selection is per-deploy, not per-shop.** `PAYMENTS_PROVIDER` is an env var on the Caryina process — switching processors means redeploying the app.
3. **Refunds are inaccessible to anyone not in the Caryina admin.** There is no cross-shop refund surface.
4. **The idempotency store is a local JSON file.** It is scoped to Caryina's deployment and not queryable.

The goal is a dedicated **Payment Management App** — a standalone internal tool (not customer-facing) that centralises the payment lifecycle, per-shop processor configuration, and refund operations across the entire shop portfolio.

---

## Scope

### In scope
- Per-shop payment processor selection and switching (Axerve / Stripe)
- Cross-portfolio order list with filtering, search, and status
- Refund issuance (migrated from `apps/caryina/src/app/admin/api/refunds/`)
- Partial refund support
- Refund history per order
- Order detail view (provider, amount, items, status, transaction IDs)
- Checkout reconciliation view (stale/in-progress attempts per shop)
- Webhook event log (Stripe events per shop)
- Basic analytics: revenue by shop, refund rate, failed payment rate

### Out of scope (v1)
- Customer-facing payment UI (stays in each storefront)
- Dispute/chargeback management (future)
- New payment provider integrations beyond Axerve and Stripe
- Payout management or bank reconciliation

---

## Functional Specification

### 1. Shop Registry & Processor Configuration

**Purpose:** Replace the `PAYMENTS_PROVIDER` env var with a database-backed per-shop config, manageable at runtime without redeploy.

**Data model (per shop):**

```
ShopPaymentConfig {
  shopId           String  (e.g. "caryina", "cover-me-pretty")
  displayName      String
  activeProvider   "stripe" | "axerve"
  axerve {
    shopLogin      String (encrypted)
    apiKey         String (encrypted)
    sandbox        Boolean
  } | null
  stripe {
    publishableKey String (encrypted)
    secretKey      String (encrypted)
    webhookSecret  String (encrypted)
    accountId      String  // for multi-account setups
  } | null
  updatedAt        DateTime
  updatedBy        String
}
```

**UI:**

- Shop list with active processor badge and last-updated timestamp
- Click shop → processor config form
  - Select active provider (dropdown: Axerve / Stripe / Disabled)
  - Enter/update credentials per provider (masked after save)
  - Test-connection button (validates credentials against provider sandbox)
  - Save confirmation with audit trail entry: "Switched caryina from Axerve → Stripe at 14:32 by peter"

**Switching behaviour:**

- Switching provider is effective for new checkouts immediately
- In-flight checkouts complete on the old provider (reconciliation handles this)
- Existing orders always refund via the provider they were originally charged on (stored per order — not affected by current config)

**Audit log:**

- Every config change is appended to an immutable audit log (shopId, changedBy, oldValue, newValue, timestamp)
- Displayed in a "Change history" tab per shop

---

### 2. Order List (Cross-Portfolio)

**Purpose:** Single view of all orders across all shops.

**Columns:**
- Order date/time
- Shop
- Customer name / email (masked to `j***@gmail.com` by default, expand on demand)
- Items (collapsed count, expand inline)
- Amount (formatted, currency)
- Provider (Stripe / Axerve badge)
- Status (Completed / Refunded / Partial Refund / Failed / Pending)
- Actions (View / Refund)

**Filters:**
- Shop (multi-select)
- Provider (Stripe / Axerve)
- Status
- Date range
- Amount range
- Free-text search (order ID, transaction ID, customer email)

**Sorting:** Date (default desc), amount, status

**Pagination:** 50 per page, cursor-based

---

### 3. Order Detail View

**Shows:**
- Full order metadata (shop, provider, amounts, currency, dates)
- Line items
- Transaction IDs: `shopTransactionId`, `bankTransactionId`, `stripePaymentIntentId` / `stripeSessionId`
- Checkout attempt timeline (created → hold → charged / expired)
- Refund history (list of refunds issued: amount, date, by whom, provider response)
- Raw provider response (collapsed by default, expandable)
- Stripe webhook events received (for Stripe orders)

---

### 4. Refund Facility (migrated from Caryina)

**Current state (`apps/caryina/src/app/admin/api/refunds/route.ts`):**
- Accepts `shopTransactionId` + `amountCents`
- Looks up provider from stored checkout attempt or falls back to `PAYMENTS_PROVIDER` env var
- Dispatches to Stripe `refunds.create()` or Axerve `callRefundS2S`

**Migrated behaviour:**
- Same core logic, but surfaced in the Payment Management App
- Caryina's `/admin/api/refunds` route becomes a thin proxy to the Payment Management App's API (or is removed and Caryina admin page is removed)

**Full refund:**
- Select order → "Issue Refund" button
- Confirmation modal: "Refund £X.XX to [customer]? This will be processed via [Provider]."
- Submit → provider API call → status update

**Partial refund:**
- Same flow, amount input capped at original charge amount minus already-refunded amounts
- Line-item-level selection (if line items are stored): check boxes to select items to refund, auto-calculates amount

**Validation:**
- Cannot refund more than charged amount minus prior refunds
- Cannot refund orders in `Failed` or `Pending` state
- Provider-specific constraints enforced (e.g. Axerve has max refund window)

**Audit trail:**
- Every refund action logged: orderId, refundedBy, amountCents, provider, providerResponse, timestamp

---

### 5. Checkout Reconciliation View

**Purpose:** Expose the reconciliation state currently computed by `apps/caryina/src/lib/checkoutReconciliation.server.ts`.

**Shows (per shop):**
- Count of stale in-progress checkout attempts (>15 min)
- List of stale attempts with: idempotency key, amount, provider, started-at, elapsed time
- Per attempt: action buttons — "Mark resolved", "Release hold", "Escalate for manual review"
- Last reconciliation run timestamp per shop
- Trigger manual reconciliation run per shop

---

### 6. Webhook Event Log (Stripe)

**Purpose:** Visibility into Stripe webhook delivery without having to open the Stripe dashboard.

**Shows (per shop, Stripe only):**
- Event type (`checkout.session.completed`, `checkout.session.expired`, etc.)
- Event ID
- Received at
- Processing result: Succeeded / Failed / Already processed (idempotent)
- Raw payload (collapsed, expandable)

**Retention:** 30 days

---

### 7. Analytics Dashboard (Basic)

**Metrics:**
- Revenue this month / last 30 days, by shop and total
- Orders this month vs prior period (sparkline)
- Failed payment rate (%) by shop
- Refund rate (%) by shop
- Provider split (Axerve vs Stripe, by volume and count)

**Scope:** Read from the orders store; no external analytics calls in v1.

---

## Technical Architecture

### App Location

New app: `apps/payment-manager/`

**Stack:**
- Next.js 15 (App Router) — consistent with monorepo
- TypeScript, Tailwind CSS v4
- Design system: `@acme/design-system`
- Database: Neon PostgreSQL (same project as inventory-uploader: `silent-flower-70372159`, `eu-west-2`)
- ORM: Prisma via `packages/platform-core` — same adapter detection pattern already proven in inventory-uploader
- Auth: session cookie pattern from `apps/xa-uploader` (`uploaderAuth.ts`)
- Deploy target: Cloudflare Worker (same pattern as inventory-uploader)

### Database

**Same Neon project as inventory-uploader.** Payment models are added as new Prisma migrations in `packages/platform-core/prisma/schema.prisma`. No new database or Neon project required.

**CF Workers runtime:** `packages/platform-core/src/db.ts` detects the CF runtime and switches to `@prisma/adapter-neon` + `@neondatabase/serverless` (HTTP-based) automatically. No extra work needed in the app.

**New Prisma models:**

```prisma
model ShopPaymentConfig {
  shopId          String   @id @map("shop_id")
  displayName     String   @map("display_name")
  activeProvider  String   @default("axerve") @map("active_provider") // "stripe" | "axerve" | "disabled"
  updatedAt       DateTime @updatedAt @map("updated_at")
  updatedBy       String   @map("updated_by")
  credentials     ShopProviderCredential[]
  auditLog        PaymentConfigAudit[]
  orders          Order[]
  webhookEvents   StripeWebhookEvent[]

  @@map("shop_payment_configs")
}

model ShopProviderCredential {
  shopId          String   @map("shop_id")
  provider        String   // "stripe" | "axerve"
  credentialKey   String   @map("credential_key") // e.g. "secretKey", "apiKey", "webhookSecret"
  encryptedValue  String   @map("encrypted_value")
  updatedAt       DateTime @updatedAt @map("updated_at")
  shop            ShopPaymentConfig @relation(fields: [shopId], references: [shopId])

  @@id([shopId, provider, credentialKey])
  @@map("shop_provider_credentials")
}

model PaymentConfigAudit {
  id          Int      @id @default(autoincrement())
  shopId      String   @map("shop_id")
  changedBy   String   @map("changed_by")
  field       String
  oldValue    String?  @map("old_value")
  newValue    String?  @map("new_value")
  changedAt   DateTime @default(now()) @map("changed_at")
  shop        ShopPaymentConfig @relation(fields: [shopId], references: [shopId])

  @@map("payment_config_audit")
}

model Order {
  id                     String   @id
  shopId                 String   @map("shop_id")
  provider               String   // "stripe" | "axerve"
  status                 String   // "completed" | "refunded" | "partial_refund" | "failed" | "pending"
  amountCents            Int      @map("amount_cents")
  currency               String   @default("EUR")
  customerEmail          String?  @map("customer_email")
  customerName           String?  @map("customer_name")
  lineItemsJson          String?  @map("line_items_json")
  shopTransactionId      String?  @map("shop_transaction_id")
  bankTransactionId      String?  @map("bank_transaction_id")
  stripeSessionId        String?  @map("stripe_session_id")
  stripePaymentIntentId  String?  @map("stripe_payment_intent_id")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")
  shop                   ShopPaymentConfig @relation(fields: [shopId], references: [shopId])
  refunds                Refund[]

  @@map("orders")
}

model Refund {
  id                   String   @id
  orderId              String   @map("order_id")
  shopId               String   @map("shop_id")
  provider             String
  amountCents          Int      @map("amount_cents")
  status               String   // "succeeded" | "failed" | "pending"
  issuedBy             String   @map("issued_by")
  providerRefundId     String?  @map("provider_refund_id")
  providerResponseJson String?  @map("provider_response_json")
  createdAt            DateTime @default(now()) @map("created_at")
  order                Order    @relation(fields: [orderId], references: [id])

  @@map("refunds")
}

model StripeWebhookEvent {
  eventId           String   @id @map("event_id")
  shopId            String   @map("shop_id")
  eventType         String   @map("event_type")
  receivedAt        DateTime @default(now()) @map("received_at")
  processingResult  String   @map("processing_result") // "succeeded" | "failed" | "already_processed"
  payloadJson       String?  @map("payload_json")
  errorMessage      String?  @map("error_message")
  shop              ShopPaymentConfig @relation(fields: [shopId], references: [shopId])

  @@map("stripe_webhook_events")
}
```

### Credential Encryption

- Credentials encrypted at rest using AES-256-GCM
- Encryption key stored as `PAYMENT_MANAGER_ENCRYPTION_KEY` (Worker secret, set via `wrangler secret put`)
- Never returned to client in decrypted form
- Decrypted server-side only when initiating provider API calls
- Test-connection endpoint decrypts, calls provider, discards decrypted value from memory

### Worker Setup

Follows the inventory-uploader pattern exactly:

**`wrangler.toml` vars:**
```toml
PAYMENTS_BACKEND = "prisma"
PAYMENTS_LOCAL_FS_DISABLED = "1"
```

**Secrets (via `wrangler secret put`):**
```
DATABASE_URL                      — Neon pooler connection string (same as inventory-uploader)
PAYMENT_MANAGER_ADMIN_TOKEN       — login token
PAYMENT_MANAGER_SESSION_SECRET    — HMAC session signing key
PAYMENT_MANAGER_ENCRYPTION_KEY    — AES-256-GCM key for credential encryption
```

**KV namespace:** One KV binding (`PAYMENT_MANAGER_KV`) for session revocation, created alongside the worker.

### API Surface

```
# Config management
GET  /api/shops                                    — list shops with active provider
GET  /api/shops/:shopId/config                     — get config (no credentials)
PUT  /api/shops/:shopId/config                     — update active provider
GET  /api/shops/:shopId/credentials/:provider      — returns masked credential keys only
PUT  /api/shops/:shopId/credentials/:provider      — upsert credential set
POST /api/shops/:shopId/credentials/:provider/test — test connection
GET  /api/shops/:shopId/config/audit               — change history

# Orders
GET  /api/orders                                   — paginated list (filterable)
GET  /api/orders/:orderId                          — order detail
GET  /api/orders/:orderId/refunds                  — refund history for order

# Refunds
POST /api/refunds                                  — issue refund (full or partial)
  body: { orderId, amountCents, reason? }

# Reconciliation
GET  /api/reconciliation                           — stale attempts per shop
POST /api/reconciliation/:shopId/run               — trigger manual reconciliation
POST /api/reconciliation/:shopId/attempts/:key/resolve  — mark attempt resolved

# Webhook events
GET  /api/webhook-events                           — filterable log (shopId, type, dateRange)

# Analytics
GET  /api/analytics/summary                        — revenue, counts, rates by shop
```

---

## Migration Plan: Caryina Refund Facility

### Phase 1 — Build Payment Manager (new app, no disruption to Caryina)

1. Scaffold `apps/payment-manager/` with D1, auth, and base UI.
2. Populate D1 `orders` table from Caryina's `data/caryina/checkout-idempotency.json` via a one-time migration script.
3. Build the refund API in Payment Manager, backed by the same Axerve + Stripe packages (`@acme/axerve`, `@acme/stripe`).
4. Build the refund UI (order list → order detail → issue refund modal).
5. Build shop config UI (initially with Caryina as the only shop).
6. Wire `PAYMENTS_PROVIDER` resolution to read from the D1 config instead of env var — but only for refunds at this stage; checkout still uses env var.

### Phase 2 — Proxy Caryina admin refunds to Payment Manager

1. Replace `apps/caryina/src/app/admin/api/refunds/route.ts` with a thin proxy that forwards to Payment Manager's `/api/refunds`.
2. Caryina admin page (`/admin/refunds` if it exists) either removed or replaced with a redirect to Payment Manager.
3. Verify behaviour under test: both Axerve and Stripe refund paths work via the proxy.

### Phase 3 — Checkout provider resolution from Payment Manager

1. Caryina's `resolveCaryinaPaymentProvider()` reads from Payment Manager's `/api/shops/caryina/config` instead of `process.env.PAYMENTS_PROVIDER`.
2. Provider switching is now live via the UI without redeploy.
3. `PAYMENTS_PROVIDER` env var becomes optional (fallback only during bootstrap).

### Phase 4 — Add remaining shops

1. Register `cover-me-pretty` in Payment Manager's shop registry.
2. Populate its order history from its own idempotency store (or Stripe API directly, if no local store).
3. Any future shop is onboarded by adding a row to `shop_payment_configs` and entering credentials via UI.

### Phase 5 — Remove Caryina payment admin code

1. Delete `apps/caryina/src/app/admin/api/refunds/` route and tests.
2. Remove `apps/caryina/src/app/admin/` entirely if no other admin routes remain.
3. Caryina's `checkoutIdempotency.server.ts` continues to serve as the source of truth for in-flight checkout state; Payment Manager reads from it on sync (or via a shared D1 table once migration is complete).

---

## Open Questions

| # | Question | Default assumption |
|---|----------|--------------------|
| 1 | Should each shop's orders be written to D1 in real time (from checkout events) or synced on-demand? | Real-time via a shared write from each shop's checkout route into D1 |
| 2 | Does the credential encryption key need to be per-shop or global? | Global (one Worker secret) is acceptable for v1 |
| 3 | Should partial refunds support line-item granularity, or amount-only? | Amount-only for v1; line-item for v2 |
| 4 | Is there an operator login requirement separate from the API key, or is the API key sufficient? | Simple session cookie (same pattern as xa-uploader) for browser access |
| 5 | Does `cover-me-pretty` have an existing idempotency store to migrate? | TBD — check before Phase 4 |
| 6 | Should this app be publicly accessible (e.g. `payments.peter-cowling1976.workers.dev`) or restricted to internal IP? | Restricted — API key + session auth only |

---

## Deliverables

| Deliverable | Owner | Phase |
|-------------|-------|-------|
| `apps/payment-manager/` scaffold (D1, auth, routing) | Build | 1 |
| Migration script: idempotency JSON → D1 | Build | 1 |
| Refund API (full + partial, Axerve + Stripe) | Build | 1 |
| Refund UI (order list, order detail, refund modal) | Build | 1 |
| Shop config UI (provider selection, credential management) | Build | 1 |
| Proxy: Caryina admin refunds → Payment Manager | Build | 2 |
| Checkout provider resolution from Payment Manager | Build | 3 |
| Cover-me-pretty onboarding | Build | 4 |
| Caryina payment admin code removal | Build | 5 |
| Reconciliation view | Build | 1 |
| Webhook event log | Build | 1 |
| Analytics dashboard | Build | 1–2 |
