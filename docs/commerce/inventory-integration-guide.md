<!-- docs/commerce/inventory-integration-guide.md -->

Type: Guide
Status: Active
Domain: Commerce / Inventory / Integration
Last-reviewed: 2026-01-16

# Inventory System Integration Guide (Agent Runbook)

**Audience:** Agents integrating inventory holds into shop applications
**Purpose:** Step-by-step guide for adding production-ready inventory management to shops

---

## Quick Start

### For Node.js/Next.js Shops

**1. Add environment variables to `.env`:**

```bash
INVENTORY_BACKEND=prisma
INVENTORY_MODE=reserve_ttl
INVENTORY_HOLD_TTL_SECONDS=1200
SKIP_INVENTORY_VALIDATION=0
```

**2. Update the checkout route:**

```typescript
// apps/example-shop/src/api/checkout-session/route.ts
import { createCheckoutSession } from "@acme/platform-core/checkout/session";

export async function POST(req: NextRequest) {
  // ... existing cart and customer logic

  const inventoryMode = (process.env.INVENTORY_MODE || "validate_only") as
    | "validate_only"
    | "reserve_ttl";
  const inventoryHoldTtlSeconds = parseInt(
    process.env.INVENTORY_HOLD_TTL_SECONDS || "1200",
    10
  );
  const skipInventoryValidation = process.env.SKIP_INVENTORY_VALIDATION === "1";

  const result = await createCheckoutSession(cart, {
    mode: "rental", // or "sale"
    shopId: shop.id,
    skipInventoryValidation,
    inventoryMode,
    inventoryHoldTtlSeconds,
    // ... other options
  });

  return NextResponse.json(result);
}
```

**3. Done!** Webhook handlers are already integrated in `@acme/platform-core`.

---

### For Cloudflare Workers

**1. Set environment variables in `wrangler.toml`:**

```toml
[vars]
INVENTORY_AUTHORITY_URL = "https://example-cms.example.com/api/inventory"
INVENTORY_AUTHORITY_TOKEN = "example-token"
INVENTORY_AUTHORITY_TIMEOUT = "5000"
```

**2. Create inventory client:**

```typescript
// apps/example-shop-worker/src/inventory.ts
import { InventoryAuthorityClient } from "@acme/platform-core/inventory/client";

export const inventoryClient = new InventoryAuthorityClient({
  baseUrl: env.INVENTORY_AUTHORITY_URL,
  token: env.INVENTORY_AUTHORITY_TOKEN,
  timeout: parseInt(env.INVENTORY_AUTHORITY_TIMEOUT ?? "5000"),
});
```

**3. Validate before checkout:**

```typescript
// apps/example-shop-worker/src/checkout.ts
import { inventoryClient } from "./inventory";

export async function handleCheckout(request: Request, env: Env) {
  const cart = await getCart(request);

  // Validate inventory
  try {
    const result = await inventoryClient.validate(shop.id, [
      { sku: "SKU-123", variantKey: "size:M", quantity: 2 },
      // ... more items from cart
    ]);

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: "insufficient_stock",
          items: result.insufficient,
        }),
        { status: 409 }
      );
    }
  } catch (err) {
    // Fail closed - don't allow checkout if authority unavailable
    console.error("[Inventory] Validation failed:", err);
    return new Response(
      JSON.stringify({ error: "service_unavailable" }),
      { status: 503 }
    );
  }

  // Proceed with checkout...
}
```

---

## Integration Patterns

### Pattern 1: Validate-Only Mode (Safe Default)

**Use Case:** Initial rollout, low-risk deployments

**How it works:**
- Checks inventory at checkout creation
- Does NOT create holds
- Stock can change between check and payment
- Risk: Overselling possible (low probability)

**Configuration:**
```bash
INVENTORY_MODE=validate_only
```

**Implementation:**
```typescript
const result = await createCheckoutSession(cart, {
  inventoryMode: "validate_only",
  skipInventoryValidation: false,
  // ... other options
});
```

---

### Pattern 2: Reserve-TTL Mode (Production)

**Use Case:** Production deployments requiring strong guarantees

**How it works:**
- Creates TTL-based hold at checkout
- Stock reserved for configured duration (default 20 min)
- Hold committed on payment success
- Hold released on failure/expiry
- Guarantees: No overselling

**Configuration:**
```bash
INVENTORY_MODE=reserve_ttl
INVENTORY_HOLD_TTL_SECONDS=1200  # 20 minutes
```

**Implementation:**
```typescript
const result = await createCheckoutSession(cart, {
  inventoryMode: "reserve_ttl",
  inventoryHoldTtlSeconds: 1200,
  skipInventoryValidation: false,
  // ... other options
});
```

---

### Pattern 3: Worker Validation

**Use Case:** Edge-deployed shops using Cloudflare Workers

**How it works:**
- Worker calls CMS validation endpoint
- Fail-closed: Rejects checkout if authority unavailable
- No holds created (handled by Node.js backend after validation)

**Implementation:**

```typescript
import { InventoryAuthorityClient } from "@acme/platform-core/inventory/client";

const client = new InventoryAuthorityClient({
  baseUrl: env.INVENTORY_AUTHORITY_URL,
  token: env.INVENTORY_AUTHORITY_TOKEN,
});

// Health check before critical operations
const healthy = await client.healthCheck();
if (!healthy) {
  console.warn("[Inventory] Authority unhealthy");
}

// Validate cart
const result = await client.validate(shopId, cartItems);
if (!result.ok) {
  // Handle insufficient stock
  return insufficientStockResponse(result.insufficient);
}
```

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INVENTORY_BACKEND` | No | `auto` | Backend storage (`prisma` or `json`) |
| `INVENTORY_MODE` | No | `validate_only` | Checkout mode (`validate_only` or `reserve_ttl`) |
| `INVENTORY_HOLD_TTL_SECONDS` | No | `1200` | Hold duration in seconds (20 min default) |
| `SKIP_INVENTORY_VALIDATION` | No | `0` | Emergency bypass (`1` to disable validation) |
| `INVENTORY_AUTHORITY_URL` | Yes (Workers) | - | Base URL for validation API |
| `INVENTORY_AUTHORITY_TOKEN` | Yes (Workers) | - | Authentication token |
| `INVENTORY_AUTHORITY_TIMEOUT` | No | `5000` | Request timeout in milliseconds |

### Hold TTL Guidelines

| Duration | Use Case |
|----------|----------|
| 600s (10 min) | Fast checkout flows, low abandonment |
| 1200s (20 min) | **Default** - balanced for most shops |
| 1800s (30 min) | Complex checkouts (address forms, etc.) |
| 3600s (60 min) | Maximum - very slow checkouts |

**Recommendation:** Start with 1200s (20 min), adjust based on metrics.

---

## Error Handling

### Checkout Errors

```typescript
try {
  const result = await createCheckoutSession(cart, options);
  return NextResponse.json(result);
} catch (err) {
  if (err instanceof Error && err.message === INSUFFICIENT_STOCK_ERROR) {
    // Specific SKUs out of stock
    return NextResponse.json(
      {
        error: "insufficient_stock",
        code: "inventory_insufficient",
        items: (err as any).items, // Array of { sku, variantKey, requested, available }
      },
      { status: 409 }
    );
  }

  if (err instanceof InventoryBusyError) {
    // Database locked, retry after delay
    return NextResponse.json(
      {
        error: "inventory_busy",
        retryAfter: err.retryAfterMs,
      },
      { status: 429 }
    );
  }

  // Generic error
  console.error("[Checkout] Error:", err);
  return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
}
```

### Worker Validation Errors

```typescript
try {
  const result = await inventoryClient.validate(shopId, items);
  // ... handle result
} catch (err) {
  if (err instanceof Error) {
    if (err.message === "Inventory authority unavailable") {
      // Service down - fail closed
      return new Response(
        JSON.stringify({ error: "inventory_unavailable" }),
        { status: 503 }
      );
    }

    if (err.message === "Inventory authority timeout") {
      // Timeout - fail closed
      return new Response(
        JSON.stringify({ error: "inventory_timeout" }),
        { status: 504 }
      );
    }

    if (err.message === "Inventory authority authentication failed") {
      // Token invalid
      console.error("[Inventory] Auth failed - check INVENTORY_AUTHORITY_TOKEN");
      return new Response(
        JSON.stringify({ error: "internal_error" }),
        { status: 500 }
      );
    }
  }

  throw err;
}
```

---

## Testing

### Unit Tests

```typescript
import { createCheckoutSession } from "@acme/platform-core/checkout/session";
import { validateInventoryAvailability } from "@acme/platform-core/inventoryValidation";

describe("Inventory Integration", () => {
  it("should create hold in reserve_ttl mode", async () => {
    const result = await createCheckoutSession(mockCart, {
      shopId: "test-shop",
      inventoryMode: "reserve_ttl",
      inventoryHoldTtlSeconds: 600,
      // ... other options
    });

    expect(result.metadata?.inventory_reservation_id).toBeDefined();
  });

  it("should validate without creating hold in validate_only mode", async () => {
    const result = await createCheckoutSession(mockCart, {
      shopId: "test-shop",
      inventoryMode: "validate_only",
      // ... other options
    });

    expect(result.metadata?.inventory_reservation_id).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe("Hold Lifecycle", () => {
  it("should commit hold on payment success", async () => {
    // 1. Create checkout with hold
    const session = await createCheckoutSession(cart, {
      inventoryMode: "reserve_ttl",
      // ...
    });

    const holdId = session.metadata?.inventory_reservation_id;

    // 2. Simulate Stripe webhook (checkout.session.completed)
    await handleCheckoutSessionCompleted(mockEvent);

    // 3. Verify hold committed
    const hold = await prisma.inventoryHold.findUnique({ where: { id: holdId } });
    expect(hold?.status).toBe("committed");
  });

  it("should release hold on payment failure", async () => {
    // ... similar test for release
  });

  it("should expire hold after TTL", async () => {
    // ... test reaper
  });
});
```

---

## Migration Guide

### From No Inventory System

**Phase 1: Add Validation (1-2 days)**
1. Set `INVENTORY_MODE=validate_only`
2. Deploy and monitor for false positives
3. Fix any data inconsistencies

**Phase 2: Enable Holds (1 week)**
1. Set `INVENTORY_MODE=reserve_ttl`
2. Deploy to staging, test full flow
3. Monitor metrics (commit rate, expiry rate)
4. Deploy to production with low TTL (600s)
5. Gradually increase TTL based on metrics

**Phase 3: Optimize (ongoing)**
1. Tune TTL based on actual checkout duration
2. Add monitoring dashboards
3. Set up alerts

### From Custom Inventory System

1. **Audit current system:**
   - How are holds created?
   - When are they released?
   - What happens on failures?

2. **Map to new system:**
   - Map holds → InventoryHold
   - Map validation → validateInventoryAvailability
   - Map commits → commitInventoryHold

3. **Parallel run:**
   - Run both systems simultaneously
   - Compare results, identify discrepancies
   - Fix data issues

4. **Cut over:**
   - Disable old system
   - Enable new system
   - Monitor closely

---

## Troubleshooting

### "Inventory hold not found" error

**Cause:** Hold ID not passed to webhook or hold already processed

**Solution:**
- Verify `inventory_reservation_id` in Stripe session metadata
- Check webhook logs for duplicate events
- Ensure idempotency (handlers should be safe to retry)

### "Inventory busy" errors

**Cause:** Database lock contention under high load

**Solution:**
- Scale database (increase CPU/memory)
- Reduce hold TTL to shorten lock duration
- Add read replicas for validation queries

### High expiry rate

**Cause:** Users taking too long to complete checkout or abandoning carts

**Solution:**
- Investigate checkout flow performance
- Increase TTL if legitimate slow checkouts
- Optimize payment integration (reduce redirects)

### Stock overselling (validate_only mode)

**Cause:** Race condition between validation and payment

**Solution:**
- Switch to `reserve_ttl` mode for strong guarantees
- Or accept risk and handle refunds

---

## Best Practices

1. **Always use reserve_ttl in production** for critical inventory
2. **Set appropriate TTL** based on actual checkout duration (p95)
3. **Monitor metrics** - especially commit rate and expiry rate
4. **Fail closed** - if authority unavailable, reject checkout
5. **Log hold IDs** for debugging and customer support
6. **Test webhook failures** - ensure idempotency
7. **Have rollback plan** - `SKIP_INVENTORY_VALIDATION=1` for emergencies

---

## Examples

### Complete Next.js Integration

See: [apps/cover-me-pretty/src/api/checkout-session/route.ts](../../apps/cover-me-pretty/src/api/checkout-session/route.ts)

### Worker Integration

See: `docs/examples/inventory-worker-integration.ts`

### Monitoring Dashboard

See: [Inventory Monitoring Guide](./inventory-monitoring-guide.md)

---

## References

- [Production Readiness Plan](./inventory-production-readiness.md)
- [Monitoring Guide](./inventory-monitoring-guide.md)
- [API Reference](../../packages/platform-core/src/inventoryHolds.ts)
- [Client Library](../../packages/platform-core/src/inventory/client.ts)

---

**Last Updated:** 2026-01-12
**Contact:** Platform Team | #inventory-system
