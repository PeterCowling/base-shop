<!-- docs/commerce/inventory-production-readiness.md -->

Type: Plan
Status: Active
Domain: Commerce / Inventory
Last-reviewed: 2026-01-12

# Inventory System Production Readiness Plan

**Revision:** v1.0
**Audience:** Product, Engineering, QA, Operations
**Purpose:** Define requirements, metrics, and rollout plan for deploying the centralized inventory system to production shops

## Executive Summary

The base-shop platform has a centralized inventory implementation (`@acme/platform-core`) with solid architecture:
- Multi-backend storage (Prisma/PostgreSQL, JSON fallback)
- Advanced hold/reservation system with TTL-based expiry
- Validation APIs with variant-aware matching
- CMS management UI with import/export
- Stock alert system with cooldown

**Current Status:** Core implementation complete (~80%), but critical integration work required before production deployment.

**Timeline:** 2-3 week phased rollout recommended

**Key Blocker:** Database tables for holds system don't exist yet

---

## Current State Assessment

### What Works ✅

1. **Inventory Store**
   - Prisma/PostgreSQL backend + JSON fallback
   - Variant support via `variantKey`
   - Atomic operations, file locking
   - Location: `packages/platform-core/src/repositories/inventory.server.ts`

2. **Hold System** (code exists, tables missing)
   - TTL-based reservations (default 20 min)
   - Atomic transactions with row locking
   - Idempotent operations
   - Location: `packages/platform-core/src/inventoryHolds.ts`

3. **Validation API**
   - `validateInventoryAvailability()`
   - Variant-aware matching
   - Endpoint exists in cover-me-pretty

4. **CMS Management**
   - Grid editor, import/export
   - Low stock dashboard
   - Location: `apps/cms/src/app/cms/shop/[shop]/data/inventory/`

5. **Stock Alerts**
   - Email + webhook delivery
   - 24-hour cooldown per variant

### Critical Gaps ❌

1. **Checkouts use stale cart data** (not live inventory)
2. **Database tables missing** (InventoryHold, InventoryHoldItem)
3. **No webhook integration** (holds never committed/released)
4. **Workers use hardcoded stock**
5. **No background reaper job**

---

## Production Requirements

### 🔴 Critical (Blockers)

#### 1. Add Database Schema (30 min)

**Add to** `packages/platform-core/prisma/schema.prisma`:

```prisma
model InventoryHold {
  id          String   @id
  shopId      String
  status      String
  expiresAt   DateTime
  committedAt DateTime?
  releasedAt  DateTime?
  expiredAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       InventoryHoldItem[]
  @@index([shopId, status])
  @@index([expiresAt])
}

model InventoryHoldItem {
  id                String @id @default(cuid())
  holdId            String
  shopId            String
  sku               String
  productId         String
  variantKey        String
  variantAttributes Json
  quantity          Int
  hold              InventoryHold @relation(fields: [holdId], references: [id], onDelete: Cascade)
  @@index([holdId])
  @@index([shopId, sku, variantKey])
}
```

**Run migration:**
```bash
pnpm --filter @acme/platform-core exec prisma migrate dev --name add_inventory_holds
pnpm prisma:generate
pnpm --filter @acme/platform-core test inventoryHolds
```

---

#### 2. Integrate Live Validation (2-3 days)

**Update** `packages/platform-core/src/checkout/createSession.ts`:

**Phase 1: Validate-Only**
```typescript
import { validateInventoryAvailability, cartToInventoryRequests } from "../inventoryValidation";

async function assertInventoryAvailable(
  shopId: string,
  cart: CartState,
  skipInventoryValidation?: boolean
): Promise<void> {
  if (skipInventoryValidation) return;
  const requests = cartToInventoryRequests(cart);
  const result = await validateInventoryAvailability(shopId, requests);
  if (!result.ok) {
    const error = new Error(INSUFFICIENT_STOCK_ERROR) as any;
    error.code = "inventory_insufficient";
    error.items = result.insufficient;
    throw error;
  }
}
```

**Phase 2: Reserve-TTL**
```typescript
export interface CreateCheckoutSessionOptions {
  inventoryMode?: "validate_only" | "reserve_ttl";
  inventoryHoldTtlSeconds?: number;
  skipInventoryValidation?: boolean;
}

export async function createCheckoutSession(cart: CartState, options: CreateCheckoutSessionOptions) {
  let holdId: string | undefined;

  if (options.inventoryMode === "reserve_ttl") {
    const hold = await createInventoryHold({
      shopId: options.shopId,
      requests: cartToInventoryRequests(cart),
      ttlSeconds: options.inventoryHoldTtlSeconds ?? 1200,
    });
    holdId = hold.holdId;
  } else {
    await assertInventoryAvailable(options.shopId, cart);
  }

  const metadata = buildCheckoutMetadata({
    ...options.metadataExtra,
    inventory_reservation_id: holdId,
  });
  // ... create session
}
```

**Update all shops:**
```typescript
// apps/*/src/api/checkout-session/route.ts
const session = await createCheckoutSession(cart, {
  inventoryMode: process.env.INVENTORY_MODE === "reserve_ttl" ? "reserve_ttl" : "validate_only",
  inventoryHoldTtlSeconds: parseInt(process.env.INVENTORY_HOLD_TTL_SECONDS ?? "1200"),
});
```

---

#### 3. Add Webhook Handlers (1 day)

**Add to** `packages/platform-core/src/webhooks/stripe.ts`:

```typescript
import { commitInventoryHold, releaseInventoryHold } from "../inventoryHolds";

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const holdId = session.metadata?.inventory_reservation_id;
  const shopId = session.metadata?.shop_id;
  if (!holdId || !shopId) return;

  try {
    if (session.payment_status === "paid") {
      await commitInventoryHold({ shopId, holdId });
    } else {
      await releaseInventoryHold({ shopId, holdId });
    }
  } catch (err) {
    console.error(`[Inventory] CRITICAL: Hold ${holdId} failed`, err);
    await sendOpsAlert({ severity: "critical", holdId, error: err });
  }
}

async function handleCheckoutSessionExpired(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const holdId = session.metadata?.inventory_reservation_id;
  const shopId = session.metadata?.shop_id;
  if (holdId && shopId) await releaseInventoryHold({ shopId, holdId });
}
```

---

#### 4. Deploy Reaper Job (1 day)

**Create** `packages/platform-core/src/jobs/releaseExpiredHolds.ts`:

```typescript
import { releaseExpiredInventoryHolds } from "../inventoryHolds.reaper";
import { getAllShopIds } from "../shops";

export async function releaseExpiredHoldsForAllShops(): Promise<void> {
  const shops = await getAllShopIds();
  for (const shopId of shops) {
    try {
      await releaseExpiredInventoryHolds({ shopId, limit: 100, now: new Date() });
    } catch (err) {
      console.error(`[Reaper] Failed for ${shopId}`, err);
    }
  }
}
```

**Deploy as cron** `apps/cms/src/app/api/cron/release-expired-holds/route.ts`:

```typescript
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await releaseExpiredHoldsForAllShops();
  return NextResponse.json({ ok: true });
}
```

**Add to vercel.json**: `{ "crons": [{ "path": "/api/cron/release-expired-holds", "schedule": "*/5 * * * *" }] }`

---

#### 5. Environment Config (1 hour)

**Add to all shop `.env.template`:**

```bash
INVENTORY_BACKEND=prisma
INVENTORY_MODE=reserve_ttl
INVENTORY_HOLD_TTL_SECONDS=1200
INVENTORY_AUTHORITY_URL=https://cms.yourshop.com/api/inventory
INVENTORY_AUTHORITY_TOKEN=<secure-token>
STOCK_ALERT_RECIPIENT=ops@yourshop.com
SKIP_INVENTORY_VALIDATION=0
CRON_SECRET=<secure-token>
```

---

### 🟡 Important (Polish)

#### 6. Worker Integration (2-3 days)

**Create** `packages/platform-core/src/inventory/client.ts`:

```typescript
export class InventoryAuthorityClient {
  constructor(private baseUrl: string, private token: string) {}
  async validate(items: InventoryValidationRequest[]) {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      if (response.status === 503) throw new Error("Inventory unavailable");
      const error = await response.json();
      if (error.code === "inventory_insufficient") return { ok: false, insufficient: error.items };
      throw new Error("Validation failed");
    }
    return { ok: true };
  }
}
```

**Update workers:** Call `client.validate()` before checkout, fail-closed if unavailable.

---

#### 7. Monitoring (1 day)

**Metrics:**
- `inventory_hold_created`, `committed`, `released`, `expired`
- `inventory_validation_failure`
- `checkout_rejected_stock`

**Dashboards:**
- Hold lifecycle rates
- Hold commit rate (target: >80%)
- Validation failures
- Reaper performance

**Alerts:**
- High expiry rate (>20%) → Warning
- Commit failures (>5 in 5 min) → Critical
- Validation spikes (>50/min) → Warning

---

## Rollout Plan

### Week 1: Foundation
- Add schema, migrate
- Configure env vars
- Deploy reaper

### Week 2: Validate-Only
- Integrate validation
- Update shops
- Production rollout

### Week 3: Reserve-TTL
- Enable holds
- Add webhooks
- Full deployment

### Week 4+: Polish
- Workers
- Monitoring
- Optimization

---

## Success Metrics

**Technical:**
- Validation < 100ms (p95)
- Hold creation < 200ms (p95)
- Webhook < 500ms (p95)
- Hold commit rate > 80%
- Hold expiry rate < 20%

**Business:**
- Oversells: 0/month
- Checkout abandonment (stock): <2%
- Inventory accuracy: >99%

---

## Risk Mitigation

1. **Split-brain:** Enforce `INVENTORY_BACKEND=prisma` in prod
2. **Hold leaks:** Aggressive reaper (5 min), max TTL (60 min)
3. **Race conditions:** `FOR UPDATE` locks, concurrency tests
4. **DB downtime:** Fail-closed policy, health checks

**Rollback:** Set `SKIP_INVENTORY_VALIDATION=1` if critical issues.

---

## Quick Checklist

**Infrastructure:**
- [ ] Add schema, migrate
- [ ] Configure env vars
- [ ] Deploy reaper

**Code:**
- [ ] Update createCheckoutSession()
- [ ] Add webhooks
- [ ] Update workers

**Testing:**
- [ ] Unit/integration/E2E tests
- [ ] Concurrency tests

**Monitoring:**
- [ ] Metrics, dashboards, alerts

---

## References

- [Inventory Standardization Blueprint](./inventory-standardization-blueprint.md)
- [Reservation Service](../inventory/reservation-service.md)
- Key: `packages/platform-core/src/inventoryHolds.ts`, `prisma/schema.prisma`

**Contact:** Platform Team | #inventory-system

---

**Last Updated:** 2026-01-12
