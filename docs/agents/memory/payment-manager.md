# Payment Manager — Agent Reference

Cross-agent reference for `apps/payment-manager/`. Applies to all agents (Claude, Codex, GPT, Gemini, etc.).

---

## What it is

A standalone internal Cloudflare Worker app that centralises payment lifecycle management across the shop portfolio. It is **not** customer-facing — operator access only.

**Live URL:** `https://payment-manager.peter-cowling1976.workers.dev`

---

## What it does

| Capability | Detail |
|---|---|
| Per-shop processor config | Axerve or Stripe switchable at runtime via UI, no redeploy |
| Cross-portfolio order list | Filter by shop, provider, status, date, amount |
| Refund issuance | Full and partial refunds; Axerve via Caryina proxy, Stripe direct |
| Checkout reconciliation | View stale in-flight attempts per shop, release holds |
| Stripe webhook event log | Per-shop event history, processing result, raw payload |
| Analytics | Revenue, refund rate, failed payment rate by shop |
| Shop credential vault | Encrypted-at-rest provider credentials (AES-256-GCM) |

---

## Stack

- **Runtime:** Cloudflare Worker (`@opennextjs/cloudflare`)
- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** Neon PostgreSQL — same project as `inventory-uploader` (`silent-flower-70372159`, `eu-west-2`)
- **ORM:** Prisma via `packages/platform-core` — uses `@prisma/adapter-neon` + `@neondatabase/serverless` in CF Workers runtime (HTTP-based, TCP is blocked)
- **KV:** `PAYMENT_MANAGER_KV` (`e47d7e7c21f44fcfb86f0da9bc3b0910`) — session revocation
- **Auth:** Session cookie (same pattern as `apps/xa-uploader`)
- **Port (local dev):** 3025

---

## Prisma models added to `packages/platform-core/prisma/schema.prisma`

| Model | Table | Purpose |
|---|---|---|
| `ShopPaymentConfig` | `shop_payment_configs` | Per-shop active provider + metadata |
| `ShopProviderCredential` | `shop_provider_credentials` | Encrypted provider credentials |
| `PaymentConfigAudit` | `payment_config_audit` | Immutable config change log |
| `Order` | `orders` | Cross-portfolio order records |
| `Refund` | `refunds` | Refund records per order |
| `StripeWebhookEvent` | `stripe_webhook_events` | Stripe event log (shared with Caryina) |

---

## Key API routes

### Public (session-authenticated)
```
GET  /api/shops                              list shops with active provider
GET  /api/shops/:shopId/config               get config (no credentials)
PUT  /api/shops/:shopId/config               update active provider
PUT  /api/shops/:shopId/credentials/:prov    upsert credential set (encrypted)
POST /api/shops/:shopId/credentials/:prov/test  test connection
GET  /api/orders                             paginated order list (filterable)
GET  /api/orders/:orderId                    order detail
POST /api/refunds                            issue refund { orderId, amountCents }
GET  /api/reconciliation                     stale attempts per shop
GET  /api/webhook-events                     Stripe event log
GET  /api/analytics/summary                  revenue/rates by shop
```

### Internal (no session required, token-authenticated)
```
GET  /api/internal/shop-config?shopId=...    read active provider for a shop
                                             Header: PAYMENT_MANAGER_INTERNAL_TOKEN
POST /api/internal/orders                    write order record from shop checkout
                                             Header: CARYINA_INTERNAL_TOKEN
```

---

## Secrets

### On `payment-manager` worker
| Secret | Purpose |
|---|---|
| `PAYMENT_MANAGER_SESSION_SECRET` | Session HMAC signing |
| `PAYMENT_MANAGER_ADMIN_TOKEN` | Browser login token |
| `PAYMENT_MANAGER_ENCRYPTION_KEY` | AES-256-GCM key for credential vault (32 bytes hex) |
| `DATABASE_URL` | Neon pooler connection string (same as inventory-uploader) |
| `CARYINA_INTERNAL_TOKEN` | Authenticates calls from PM → Caryina `/api/internal/axerve-refund` |
| `CARYINA_PM_TOKEN` | Authenticates calls from Caryina admin → PM `/api/refunds` |
| `PAYMENT_MANAGER_INTERNAL_TOKEN` | Authenticates calls from Caryina checkout → PM `/api/internal/shop-config` |

### On `caryina` worker (new — added for PM integration)
| Secret | Purpose |
|---|---|
| `PAYMENT_MANAGER_URL` | `https://payment-manager.peter-cowling1976.workers.dev` |
| `PAYMENT_MANAGER_INTERNAL_TOKEN` | Sent by Caryina checkout when fetching active provider from PM |
| `CARYINA_PM_TOKEN` | Sent by Caryina admin refunds proxy when calling PM `/api/refunds` |

### `wrangler.toml` vars (non-secret)
| Var | Value | Note |
|---|---|---|
| `PAYMENTS_BACKEND` | `prisma` | |
| `PAYMENTS_LOCAL_FS_DISABLED` | `1` | |
| `CART_FEATURE_ENABLED` | `false` | Required — suppresses `CART_COOKIE_SECRET` requirement from platform-core |
| `PAYMENT_MANAGER_KV` | `e47d7e7c21f44fcfb86f0da9bc3b0910` | KV namespace ID |

---

## Build + deploy

### First-time / fresh deploy
```bash
# 1. Build worker (requires env vars — platform-core's features.ts runs at module init)
PAYMENT_MANAGER_SESSION_SECRET=<val> \
PAYMENT_MANAGER_ADMIN_TOKEN=<val> \
PAYMENT_MANAGER_ENCRYPTION_KEY=<val> \
DATABASE_URL=<neon-url> \
EMAIL_FROM=noreply@pay.internal \
NEXT_PUBLIC_BASE_URL=https://payment-manager.peter-cowling1976.workers.dev \
CART_FEATURE_ENABLED=false \
pnpm --filter @acme/payment-manager build:worker

# 2. Deploy
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=9e2c24d2db8e38f743f0ad6f9dfcfd65 \
pnpm --filter @acme/payment-manager exec wrangler deploy

# 3. Set secrets (see list above)
echo -n "<value>" | CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=9e2c24d2db8e38f743f0ad6f9dfcfd65 \
  pnpm --filter @acme/payment-manager exec wrangler secret put <SECRET_NAME>
```

### Subsequent deploys (CI / incremental)
The wrangler.toml `CART_FEATURE_ENABLED = "false"` var is already set — pass only the required build-time env vars as above. Secrets persist across deploys and do not need to be re-set unless rotating.

### Why CART_FEATURE_ENABLED is required at build time
`packages/platform-core/src/features.ts` calls `loadCoreEnv()` at module init level. `loadCoreEnv()` enforces `CART_COOKIE_SECRET` unless `CART_FEATURE_ENABLED=false` is set. Payment Manager does not use carts; this flag disables the requirement.

---

## Caryina integration

### Refund proxy (`apps/caryina/src/app/admin/api/refunds/route.ts`)
Caryina's admin refund endpoint is now a **proxy** to Payment Manager. All POST requests are forwarded to `${PAYMENT_MANAGER_URL}/api/refunds` with `Authorization: Bearer ${CARYINA_PM_TOKEN}`. The actual refund logic (Stripe direct, Axerve SOAP) runs inside PM.

### Axerve proxy (`apps/caryina/src/app/api/internal/axerve-refund/route.ts`)
Payment Manager cannot call Axerve directly (SOAP is blocked in CF Workers V8). Instead, PM calls this Caryina-internal route, which executes the SOAP call from Caryina's Node.js runtime and returns the result. Authenticated by `CARYINA_INTERNAL_TOKEN` header.

### Runtime provider resolution
`resolveCaryinaPaymentProvider()` in `apps/caryina/src/lib/payments/provider.server.ts` fetches the active provider from `${PAYMENT_MANAGER_URL}/api/internal/shop-config?shopId=caryina` with a 60-second Next.js cache. Falls back silently to `process.env.PAYMENTS_PROVIDER` if PM is unreachable. Checkout flow works correctly even if PM is temporarily unavailable.

---

## Local development

```bash
pnpm --filter @acme/payment-manager dev   # port 3025
```

Required in `.env.local` (root):
```
PAYMENT_MANAGER_SESSION_SECRET=<any 32+ char string for dev>
PAYMENT_MANAGER_ADMIN_TOKEN=<any 32+ char string for dev>
PAYMENT_MANAGER_ENCRYPTION_KEY=<any 64-char hex for dev>
DATABASE_URL=<neon connection string>
CART_FEATURE_ENABLED=false
PAYMENT_MANAGER_URL=http://localhost:3025
PAYMENT_MANAGER_INTERNAL_TOKEN=<matching dev token>
CARYINA_PM_TOKEN=<matching dev token>
CARYINA_INTERNAL_TOKEN=<matching dev token>
```

Session revocation (KV) is not available locally — sessions fail open (not revoked) without `wrangler dev`.

---

## Shops registered

| `shopId` | `displayName` | `activeProvider` | Notes |
|---|---|---|---|
| `caryina` | Caryina Shop | `axerve` | Default — matches env var fallback |
| `cover-me-pretty` | Cover Me Pretty | `stripe` | Stripe-only; `shop.json` hardcodes `billingProvider: "stripe"` |

To add a new shop: insert a row into `shop_payment_configs` via migration or PM admin UI, then enter credentials via the UI.

---

## Known constraints

- **Axerve refunds via proxy only.** CF Workers cannot run SOAP (`import('soap')` is blocked). PM calls `POST /api/internal/axerve-refund` on Caryina for all Axerve operations. If Caryina is down, Axerve refunds will fail.
- **Phase 3 provider switching.** Runtime provider switching requires both PM and Caryina to be deployed and the secrets above to be set. Caryina falls back to `PAYMENTS_PROVIDER` env var if PM is unreachable.
- **Prisma migrations.** New models are in `packages/platform-core/prisma/schema.prisma`. Run migrations via `prisma migrate deploy` against the Neon DB — same process as inventory-uploader.

---

## Files changed by this feature

```
apps/payment-manager/                         new app
packages/platform-core/prisma/schema.prisma   5 new models + CMP/caryina seed migration
apps/caryina/src/app/admin/api/refunds/       now a proxy to PM
apps/caryina/src/app/api/internal/axerve-refund/  new internal route
apps/caryina/src/lib/payments/provider.server.ts   async, fetches from PM
apps/caryina/.env.example                     3 new secrets documented
```

---

## See also

- Full spec: `docs/plans/_archive/payment-management-app/spec.md`
- Plan (archived): `docs/plans/_archive/payment-management-app/plan.md`
- Inventory-uploader reference (same DB, same CF Workers pattern): `docs/agents/memory/inventory-uploader.md`
