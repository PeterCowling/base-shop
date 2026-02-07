Type: Guide
Status: Active
Domain: Performance
Last-reviewed: 2026-01-21
Audit-status: VERIFIED

# Auto-Scaling Architecture

This document describes the auto-scaling configuration **currently in place** for the Base-Shop platform, based on code audit performed 2026-01-21.

## Overview

Base-Shop deploys to Cloudflare Pages/Workers, which provides automatic horizontal scaling at the edge. This document audits what is actually configured, not what is theoretically possible.

## Verified Configuration

### Deployment Targets

| App | Deployment Target | Evidence |
|-----|------------------|----------|
| base-shop (root) | Cloudflare Pages | `wrangler.toml` |
| xa, xa-b, xa-j | Cloudflare Pages | `apps/xa*/wrangler.toml` |
| cochlearfit | Cloudflare Pages | `apps/cochlearfit/wrangler.toml` |
| product-pipeline | Cloudflare Pages + D1 + R2 + Queues | `apps/product-pipeline/wrangler.toml` |
| product-pipeline-queue-worker | Cloudflare Workers (Queue Consumer) | `apps/product-pipeline-queue-worker/wrangler.toml` |

**Verified in CI:** `.github/workflows/reusable-app.yml` deploys via `wrangler pages deploy` with `CLOUDFLARE_API_TOKEN`.

### Scaling Resources In Use

#### Durable Objects (Configured)

| Binding | Class | Location | Purpose |
|---------|-------|----------|---------|
| `CART_DO` | `CartDurableObject` | `wrangler.toml` | Per-cart state with TTL |
| `SESSION_DO` | `SessionDurableObject` | `wrangler.toml` | Per-session state with customer index |

**Implementation:**
- [cloudflareDurableStore.ts](../packages/platform-core/src/cartStore/cloudflareDurableStore.ts) (282 lines)
- [sessionDurableStore.ts](../packages/auth/src/sessionDurableStore.ts) (241 lines)

**Scaling behavior:** Each cart/session is a separate DO instance. Cloudflare creates instances on-demand and garbage collects idle ones automatically.

#### KV Namespaces (Configured)

| Binding | ID | Purpose | Status |
|---------|-----|---------|--------|
| `CART_KV` | `0e0888a980cd46efa1d28aea3794b3ac` | Cart storage (legacy/fallback) | Real ID |
| `LOGIN_RATE_LIMIT_KV` | `00000000000000000000000000000000` | Login rate limiting | **Placeholder** |

**Gap:** `LOGIN_RATE_LIMIT_KV` uses placeholder ID. Production deployment requires real namespace ID.

#### D1 Database (product-pipeline only)

| Binding | Database | Status |
|---------|----------|--------|
| `PIPELINE_DB` | `product-pipeline` | **Placeholder ID** |

#### R2 Storage (product-pipeline only)

| Binding | Bucket | Status |
|---------|--------|--------|
| `PIPELINE_EVIDENCE` | `product-pipeline-evidence` | Configured |

#### Queues (product-pipeline only)

| Queue | Consumer Config |
|-------|-----------------|
| `pipeline-jobs` | `max_batch_size: 1`, `max_batch_timeout: 30` |

**Scaling:** Queue consumers scale based on queue depth (Cloudflare-managed).

### Provider Selection Logic

The codebase supports multiple storage backends with provider selection:

| Variable | Options | Default |
|----------|---------|---------|
| `CART_STORE_PROVIDER` | `cloudflare`, `redis`, `memory` | Auto-detect |
| `SESSION_STORE_PROVIDER` | `cloudflare`, `redis`, `memory` | Auto-detect |
| `RATE_LIMIT_STORE_PROVIDER` | `kv`, `redis`, `memory` | Auto-detect |

**Fallback chain (verified in code):**
1. If `cloudflare` provider + DO binding present → use Durable Object
2. If `redis` provider + Upstash credentials present → use Redis
3. Otherwise → use in-memory (**does not scale horizontally**)

**Evidence:**
- [cartStore.ts:84-121](../packages/platform-core/src/cartStore.ts#L84-L121)
- [rateLimiter.ts:90-115](../packages/auth/src/rateLimiter.ts#L90-L115)

### Latency Monitoring (In Place)

Both DO implementations log warnings when calls exceed 200ms:

```typescript
// cloudflareDurableStore.ts:79-81
if (duration > 200 && shouldLogLatency()) {
  console.warn(`Cart DO latency ${duration}ms for op=${body.op}`);
}
```

This is the **only** auto-scaling observability currently implemented.

## Gaps Identified

### Critical Gaps

| Gap | Impact | Status |
|-----|--------|--------|
| **No Smart Placement configured** | DOs may be placed far from users, increasing latency | Not configured |
| **Placeholder KV/D1 IDs** | Rate limiting and pipeline DB won't work in production | Placeholder values |
| **No scaling metrics dashboard** | Cannot measure or alert on scaling behavior | Not implemented |

### Missing Configuration

Smart Placement is **not configured** in any wrangler.toml:

```toml
# NOT PRESENT - should be added for production:
[placement]
mode = "smart"
```

**Searched:** `grep -r "placement\|smart" **/*.toml` — no results.

### No Production Verification

| Item | Status |
|------|--------|
| DO latency in production | Not measured |
| KV replication lag | Not measured |
| Queue consumer scaling | Not measured |
| Cold start frequency | Not measured |

## What Cloudflare Provides Automatically

These behaviors are inherent to Cloudflare's platform (no configuration required):

| Aspect | Behavior |
|--------|----------|
| Worker horizontal scaling | Automatic — up to 6 concurrent requests per isolate, new isolates spawn as needed |
| Geographic distribution | Runs at 300+ edge locations |
| Cold starts | ~5ms (V8 isolate architecture) |
| KV global replication | Eventually consistent, edge-cached |
| Static asset caching | Automatic at edge |

## Current wrangler.toml (root)

```toml
name = "base-shop"
pages_build_output_dir = ".vercel/output/static"
compatibility_date = "2025-06-20"

[[kv_namespaces]]
binding = "CART_KV"
id = "0e0888a980cd46efa1d28aea3794b3ac"

[[kv_namespaces]]
binding = "LOGIN_RATE_LIMIT_KV"
id = "00000000000000000000000000000000"  # PLACEHOLDER - needs real ID

[durable_objects]
bindings = [
  { name = "CART_DO", class_name = "CartDurableObject" },
  { name = "SESSION_DO", class_name = "SessionDurableObject" },
]

[vars]
NEXT_PUBLIC_SHOP_ID = "default"
CART_TTL = "2592000"

# NOTE: No [placement] section - Smart Placement not enabled
```

## Recommended Actions

### P0 — Before Production

1. Replace placeholder KV namespace ID for `LOGIN_RATE_LIMIT_KV`
2. Replace placeholder D1 database ID for product-pipeline
3. Verify DO bindings are deployed with correct class names

### P1 — Production Readiness

1. Add Smart Placement to wrangler.toml:
   ```toml
   [placement]
   mode = "smart"
   ```
2. Set up Cloudflare Analytics dashboard for Worker/DO metrics

### P2 — Observability

1. Add structured metrics for DO operations (beyond console.warn)
2. Set up alerts for DO latency >200ms
3. Monitor queue depth and consumer scaling

## Related Documents

- [Cloudflare Edge Storage Plan](runtime/cloudflare-edge-storage-plan.md) — Implementation details for DO/KV providers
- [Performance Budgets](performance-budgets.md) — Latency targets (p95)
- [Deploy Health Checks](deploy-health-checks.md) — Deployment verification
