<!-- docs/commerce/cart-security-requirements.md -->

Type: Requirements
Status: Active
Domain: Commerce, Security
Last-reviewed: 2026-01-12

# Cart Security & Trust Boundary Requirements

**Revision:** v1.0
**Parent Document:** [Cart Production Readiness Plan](./cart-production-readiness.md)
**Purpose:** Define mandatory security requirements and trust boundaries for cart implementation

## Executive Summary

This document addresses critical security and architectural gaps identified in the cart production readiness review. These requirements are **mandatory** for production deployment and supersede any conflicting statements in the base plan.

### Critical Findings

1. **Price/Inventory Trust Boundary** - Cart stores full SKU objects, creating risk of stale/tampered pricing
2. **Multi-Shop Isolation** - Cart keys not namespaced by shop, risking cross-shop data leakage
3. **Inventory Validation Gap** - Phase 1 acceptance criteria conflict with validate-only mode
4. **Cart Clearing Idempotency** - Webhook cart clearing lacks state machine and retry safety
5. **Secret Rotation** - No rotation plan or monitoring for cookie signature failures

---

## 1. Price & Inventory Trust Boundary (CRITICAL)

### Problem Statement

**Current Implementation:**
- Cart stores full `SKU` objects including `price`, `stock`, `deposit`
- Checkout can read cart via `useCart()` hook or `decodeCartCookie()`
- No mandatory server-side repricing at checkout
- Stale or tampered cart data can cause under/overcharging

**Risk:** Price tampering, stale pricing, incorrect charges, compliance violations

### Required Changes

#### 1.1 Cart Data Model Modification

**MUST:** Store only immutable identifiers and quantities in cart

```typescript
// REQUIRED: New cart line format
interface CartLine {
  skuId: string;           // ✅ Only the ID, not full SKU object
  qty: number;             // ✅ Quantity
  size?: string;           // ✅ Size variant (if applicable)
  meta?: CartLineMeta;     // ✅ Metadata (attribution, try-on)
  rental?: RentalLineItem; // ✅ Rental metadata (if rental mode)

  // ❌ MUST NOT store: price, stock, deposit, or any pricing fields
}

// For display purposes, cart API response can include hydrated SKU
interface CartApiResponse {
  ok: true;
  cart: Record<string, CartLine>;
  hydrated?: Record<string, {
    line: CartLine;
    sku: SKU; // Server-fetched, fresh data for display only
  }>;
}
```

**Migration Path:**
1. Add `skuId` field to existing `CartLine` (derived from `sku.id`)
2. Deprecate reading `sku.price` from cart
3. Update UI components to use hydrated response
4. Remove `sku` object storage in Phase 2

#### 1.2 Mandatory Checkout Repricing

**MUST:** Checkout creates authoritative pricing snapshot from database/catalog

```typescript
// packages/platform-core/src/checkout/createCheckoutSession.ts

export async function createCheckoutSession(
  cartId: string,
  shopId: string
): Promise<CheckoutSession> {
  // 1. Fetch cart (has only IDs + quantities)
  const cart = await getCart(cartId);

  // 2. REQUIRED: Fetch fresh prices from authoritative source
  const lineItems = await Promise.all(
    Object.values(cart).map(async (line) => {
      // Fetch from database, not from cart
      const sku = await db.sku.findUnique({
        where: { id: line.skuId, shopId },
      });

      if (!sku) {
        throw new Error(`SKU ${line.skuId} not found`);
      }

      if (!sku.active || sku.stock < line.qty) {
        throw new Error(`SKU ${line.skuId} unavailable`);
      }

      // Use fresh, authoritative pricing
      return {
        skuId: sku.id,
        title: sku.title,
        quantity: line.qty,
        price: sku.price,        // ✅ Fresh from DB
        deposit: sku.deposit,    // ✅ Fresh from DB
        tax: calculateTax(sku),  // ✅ Computed server-side
      };
    })
  );

  // 3. Create Stripe session with authoritative amounts
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems.map(item => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.price, // ✅ From DB, not cart
        product_data: { name: item.title },
      },
      quantity: item.quantity,
    })),
    // ...
  });

  return session;
}
```

#### 1.3 Acceptance Criteria

**MUST pass before production:**

- [ ] Cart stores only `skuId`, `qty`, `size`, `meta`, `rental` (no pricing fields)
- [ ] Checkout fetches prices from database, never from cart
- [ ] UI displays prices from hydrated API response, not cached SKU objects
- [ ] Test: Tampered cart cookie with inflated prices is rejected
- [ ] Test: Stale cart (price changed in DB) uses fresh price at checkout
- [ ] Test: Out-of-stock item in cart is rejected at checkout
- [ ] Stripe Checkout Session amounts match database prices, not cart

#### 1.4 Migration Checklist

- [ ] Update `CartLine` type definition
- [ ] Modify cart API to hydrate SKU data in response
- [ ] Update `CartTemplate`, `MiniCart` to use hydrated data
- [ ] Implement `createCheckoutSession` with mandatory repricing
- [ ] Add integration tests for price tampering scenarios
- [ ] Update documentation

**Acceptance Test:**
```typescript
test('checkout rejects tampered cart prices', async () => {
  // 1. Add item to cart (price=$29.99 in DB)
  const cart = await POST('/api/cart', {
    sku: { id: 'sku_123' },
    qty: 1,
  });

  // 2. Tamper with cookie (inject fake price=$0.01)
  const tamperedCookie = tamperCartCookie(cart.cookie, {
    'sku_123': { skuId: 'sku_123', qty: 1, fakePrice: 1 }
  });

  // 3. Create checkout session
  const session = await createCheckoutSession(cart.id, 'shop-1');

  // 4. MUST use DB price, not tampered price
  expect(session.amount_total).toBe(2999); // $29.99 from DB
});
```

---

## 2. Multi-Shop Isolation (HIGH)

### Problem Statement

**Current Implementation:**
- Cookie contains only `cartId` (UUID)
- `createShopCartApi(shopId)` relies on environment variable
- Cart keys in Redis/storage not namespaced by shop
- Misconfiguration or ID collision could leak carts across shops

**Risk:** Cross-shop data leakage, GDPR violations, billing errors

### Required Changes

#### 2.1 Shop-Scoped Cart Keys

**MUST:** Namespace all cart storage keys by shop

```typescript
// packages/platform-core/src/cartStore.ts

// ❌ CURRENT (shop-agnostic)
const key = `cart:${cartId}`;

// ✅ REQUIRED (shop-scoped)
const key = `cart:${shopId}:${cartId}`;
```

**Implementation:**
```typescript
export interface CartStore {
  createCart(shopId: string): Promise<string>;
  getCart(shopId: string, cartId: string): Promise<CartState>;
  setCart(shopId: string, cartId: string, cart: CartState): Promise<void>;
  deleteCart(shopId: string, cartId: string): Promise<void>;
  // ... all methods require shopId as first param
}
```

#### 2.2 Shop Binding in Cookie

**MUST:** Bind shop ID to cookie signature to prevent cross-shop replay

```typescript
// packages/platform-core/src/cartCookie.ts

export function encodeCartCookie(
  cartId: string,
  shopId: string, // ✅ REQUIRED parameter
  secret: string
): string {
  const payload = `${cartId}:${shopId}`; // Shop bound to signature
  const signature = hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export function decodeCartCookie(
  cookie: string,
  expectedShopId: string, // ✅ REQUIRED parameter
  secret: string
): { cartId: string; shopId: string } | null {
  const [payload, signature] = cookie.split('.');

  // Verify signature
  if (!hmacVerify(payload, signature, secret)) {
    return null;
  }

  const [cartId, shopId] = payload.split(':');

  // MUST verify shop matches expected
  if (shopId !== expectedShopId) {
    logger.warn('Cart cookie shop mismatch', {
      cookieShop: shopId,
      expectedShop: expectedShopId,
    });
    return null;
  }

  return { cartId, shopId };
}
```

#### 2.3 Shop ID Derivation & Enforcement

**MUST:** Define canonical shop ID source and validate on every request

```typescript
// packages/platform-core/src/shopContext.ts

export function getShopIdFromRequest(req: NextRequest): string {
  // Option 1: Environment variable (static per deployment)
  const envShopId = process.env.SHOP_ID;
  if (envShopId) return envShopId;

  // Option 2: Hostname-based (for multi-tenant deployments)
  const hostname = req.headers.get('host');
  const shopId = HOSTNAME_TO_SHOP_MAP[hostname];
  if (shopId) return shopId;

  // Option 3: Database lookup (for dynamic shops)
  // const shop = await getShopByHostname(hostname);
  // if (shop) return shop.id;

  throw new Error('Unable to determine shop ID');
}

// MUST be called at start of every cart API handler
export async function GET(req: NextRequest) {
  const shopId = getShopIdFromRequest(req); // ✅ REQUIRED
  const { cartId } = decodeCartCookie(
    req.cookies.get(CART_COOKIE)?.value,
    shopId // ✅ Validate shop
  );
  const cart = await getCart(shopId, cartId); // ✅ Shop-scoped
  // ...
}
```

#### 2.4 Acceptance Criteria

**MUST pass before production:**

- [ ] All cart storage keys namespaced by shop (`cart:{shopId}:{cartId}`)
- [ ] Cookie signature includes and validates shop ID
- [ ] Shop ID derivation strategy documented and tested
- [ ] Test: Cart from shop A cannot be read by shop B
- [ ] Test: Replayed cookie with wrong shop ID is rejected
- [ ] Test: Missing/invalid shop ID returns 400 error
- [ ] Monitoring: Alert on shop ID mismatch attempts

#### 2.5 Shop ID Derivation Decision

**MUST answer before implementation:**

| Strategy | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Environment Variable** | Simple, no DB lookup | One shop per deployment | Single-tenant shops |
| **Hostname Map** | Multi-tenant capable | Requires config updates | Known shop domains |
| **Database Lookup** | Fully dynamic | Performance overhead | SaaS platform |

**Recommended:** Environment variable for Phase 1, migrate to hostname map if multi-tenancy needed

---

## 3. Inventory Validation Consistency (HIGH)

### Problem Statement

**Current Plan States:**
- "Out-of-stock items cannot be added" (Acceptance Criteria)
- "Stock counts accurate across all shops" (Acceptance Criteria)
- "Phase 1: validate_only (no reservation)" (Implementation)

**Conflict:** Cannot guarantee acceptance criteria with validate-only mode due to TOCTOU (time-of-check-time-of-use) race conditions

### Required Changes

#### 3.1 Acceptance Criteria Adjustment

**MUST:** Align criteria with implementation reality

```diff
- [ ] Out-of-stock items cannot be added
+ [ ] Out-of-stock items rejected at add-to-cart (best effort)
+ [ ] Out-of-stock items ALWAYS rejected at checkout (mandatory)

- [ ] Stock counts accurate across all shops
+ [ ] Stock validation uses single source of truth
+ [ ] Checkout revalidates stock before payment
```

#### 3.2 Mandatory Checkout Revalidation

**MUST:** Validate stock at checkout, even in Phase 1

```typescript
export async function createCheckoutSession(
  cartId: string,
  shopId: string
): Promise<CheckoutSession> {
  const cart = await getCart(shopId, cartId);

  // REQUIRED: Revalidate stock at checkout
  const unavailableItems: string[] = [];
  const lineItems = await Promise.all(
    Object.values(cart).map(async (line) => {
      const sku = await db.sku.findUnique({
        where: { id: line.skuId, shopId },
      });

      // Check availability at checkout time (authoritative)
      if (!sku || !sku.active || sku.stock < line.qty) {
        unavailableItems.push(line.skuId);
        return null;
      }

      return { ...line, sku };
    })
  );

  // MUST reject checkout if any items unavailable
  if (unavailableItems.length > 0) {
    throw new CheckoutValidationError({
      code: 'ITEMS_UNAVAILABLE',
      items: unavailableItems,
      message: 'Some items are no longer available',
    });
  }

  // Proceed with checkout...
}
```

#### 3.3 Phase 1 vs Phase 2 Clarification

**Phase 1 (validate_only):**
- ✅ Best-effort stock check at add-to-cart
- ✅ MANDATORY stock check at checkout
- ❌ No stock reservation/holds
- ⚠️ Oversells possible between add and checkout (race condition)
- ✅ Clear error messaging when checkout fails due to stock

**Phase 2 (reserve_ttl):**
- ✅ Stock hold placed on checkout initiation
- ✅ TTL-based reservation (e.g., 15 minutes)
- ✅ Hold released on completion/timeout
- ✅ Prevents oversells across concurrent checkouts

#### 3.4 Acceptance Criteria

**Phase 1:**
- [ ] Add-to-cart checks stock (may have false positives due to race)
- [ ] Checkout ALWAYS revalidates stock (authoritative check)
- [ ] Checkout fails with clear error if stock unavailable
- [ ] User shown which items unavailable and option to remove them
- [ ] Cart preserved on checkout failure for retry

**Phase 2 (future):**
- [ ] Stock hold placed on checkout initiation
- [ ] Hold ID tracked in checkout session
- [ ] Hold released on webhook completion
- [ ] Hold TTL enforced (auto-release after timeout)
- [ ] Holds work across all shops sharing inventory

---

## 4. Cart Clearing Idempotency (MEDIUM)

### Problem Statement

**Current Plan:** "Clear cart after successful order"

**Issues:**
- No behavior defined for webhook retries
- No state machine to track order/cart lifecycle
- Risk of clearing on duplicate events or partial failures

### Required Changes

#### 4.1 Order-Cart Lifecycle State Machine

**MUST:** Track relationship between cart, checkout session, and order

```typescript
// packages/platform-core/src/cart/lifecycle.ts

export enum CartStatus {
  ACTIVE = 'active',           // Shopping in progress
  CHECKOUT_INITIATED = 'checkout_initiated', // Checkout started
  ORDER_PENDING = 'order_pending',   // Payment processing
  ORDER_COMPLETE = 'order_complete', // Order finalized, cart cleared
  ORDER_FAILED = 'order_failed',     // Payment failed, cart restored
}

export interface CartLifecycle {
  cartId: string;
  shopId: string;
  status: CartStatus;
  checkoutSessionId?: string;  // Stripe session ID
  orderId?: string;            // Internal order ID
  clearedAt?: Date;
  updatedAt: Date;
}
```

#### 4.2 Idempotent Cart Clearing

**MUST:** Clear cart only once per order, idempotently

```typescript
// packages/platform-core/src/cart/clearCart.ts

export async function clearCartForOrder(
  shopId: string,
  cartId: string,
  orderId: string,
  sessionId: string
): Promise<void> {
  // 1. Check lifecycle state
  const lifecycle = await getCartLifecycle(shopId, cartId);

  // 2. Idempotent: If already cleared for this order, return success
  if (lifecycle.status === CartStatus.ORDER_COMPLETE &&
      lifecycle.orderId === orderId) {
    logger.info('Cart already cleared for order', { cartId, orderId });
    return; // ✅ Idempotent success
  }

  // 3. Verify session/order match
  if (lifecycle.checkoutSessionId !== sessionId) {
    throw new Error('Session ID mismatch');
  }

  // 4. Clear cart and update lifecycle atomically
  await db.$transaction([
    db.cart.delete({ where: { shopId, id: cartId } }),
    db.cartLifecycle.update({
      where: { cartId },
      data: {
        status: CartStatus.ORDER_COMPLETE,
        orderId,
        clearedAt: new Date(),
      },
    }),
  ]);

  logger.info('Cart cleared for order', { cartId, orderId });
}
```

#### 4.3 Webhook Integration

**MUST:** Use idempotent clearing in webhook handler

```typescript
// Webhook handler for checkout.session.completed
export async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  // 1. Idempotent order creation (existing)
  const order = await createOrGetOrder({
    sessionId: session.id,
    shopId: session.metadata.shop_id,
    // ...
  });

  // 2. Idempotent cart clearing (NEW)
  if (session.metadata.cart_id) {
    await clearCartForOrder(
      session.metadata.shop_id,
      session.metadata.cart_id,
      order.id,
      session.id
    );
  }

  // 3. Return success (idempotent on retries)
  return { ok: true };
}
```

#### 4.4 Acceptance Criteria

- [ ] `CartLifecycle` model tracks cart status and order linkage
- [ ] `clearCartForOrder` is idempotent (safe on duplicate calls)
- [ ] Webhook handler uses idempotent clearing
- [ ] Test: Duplicate `checkout.session.completed` events don't error
- [ ] Test: Cart not cleared if payment fails
- [ ] Test: Cart clearing logged with order ID for audit trail

---

## 5. Secret Rotation & Cookie Hardening (MEDIUM)

### Problem Statement

**Current Plan:**
- Mentions `CART_COOKIE_SECRET` but no rotation plan
- No telemetry on signature failures
- Security checklist items not in acceptance criteria

### Required Changes

#### 5.1 Cookie Attribute Enforcement

**MUST:** Validate all `__Host-` cookie requirements

```typescript
// packages/platform-core/src/cartCookie.ts

export function asSetCookieHeader(
  encodedCookie: string,
  options?: {
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict';
    maxAge?: number;
  }
): string {
  // REQUIRED: __Host- prefix enforces these
  const secure = options?.secure ?? (process.env.NODE_ENV === 'production');
  const sameSite = options?.sameSite ?? 'Lax';
  const maxAge = options?.maxAge ?? 2592000; // 30 days

  // __Host- prefix REQUIRES:
  // - Secure attribute
  // - Path=/
  // - NO Domain attribute
  if (!secure) {
    throw new Error('__Host- cookies require Secure attribute');
  }

  return [
    `__Host-CART_ID=${encodedCookie}`,
    'HttpOnly',
    'Secure',
    `SameSite=${sameSite}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    // NO Domain attribute (host-only)
  ].join('; ');
}
```

#### 5.2 Secret Rotation Plan

**MUST:** Support graceful secret rotation

```typescript
// Support primary + secondary secret for rotation
export function decodeCartCookie(
  cookie: string,
  expectedShopId: string
): { cartId: string; shopId: string } | null {
  const primarySecret = process.env.CART_COOKIE_SECRET;
  const secondarySecret = process.env.CART_COOKIE_SECRET_OLD; // During rotation

  // Try primary secret first
  const result = tryDecode(cookie, expectedShopId, primarySecret);
  if (result) return result;

  // Try secondary secret (graceful rotation)
  if (secondarySecret) {
    const result = tryDecode(cookie, expectedShopId, secondarySecret);
    if (result) {
      // Log for monitoring rotation completion
      logger.info('Cart cookie decoded with secondary secret', {
        shopId: expectedShopId,
      });
      return result;
    }
  }

  // Both secrets failed
  logger.warn('Cart cookie signature verification failed', {
    shopId: expectedShopId,
  });
  return null;
}
```

**Rotation Procedure:**
1. Set `CART_COOKIE_SECRET_OLD` to current secret
2. Generate and set new `CART_COOKIE_SECRET`
3. Deploy (both secrets active)
4. Wait for cookie TTL (30 days) or monitor metric
5. Remove `CART_COOKIE_SECRET_OLD`

#### 5.3 Telemetry & Monitoring

**MUST:** Track signature failures and rotation progress

```typescript
// Track signature failure rate
export function decodeCartCookie(/*...*/): /*...*/ {
  // ...

  if (!result) {
    // Emit metric for monitoring
    metrics.increment('cart.cookie.signature_failure', {
      shop_id: expectedShopId,
    });

    // Alert if spike detected
    if (isFailureRateHigh()) {
      alerts.page('Cart cookie signature failure spike');
    }
  }

  return result;
}

// Track rotation progress
export function recordSecondarySecretUsage(shopId: string) {
  metrics.increment('cart.cookie.secondary_secret_used', {
    shop_id: shopId,
  });
}
```

#### 5.4 Acceptance Criteria

- [ ] Cookie uses `__Host-` prefix with correct attributes
- [ ] Cookie attributes enforced: Secure, HttpOnly, SameSite=Lax, Path=/, NO Domain
- [ ] Secret rotation supported with primary + secondary
- [ ] Signature failures logged and monitored
- [ ] Alert configured for signature failure spike (>0.5%)
- [ ] Rotation procedure documented
- [ ] Test: Cookie without Secure attribute rejected
- [ ] Test: Cookie with Domain attribute rejected
- [ ] Test: Rotation with secondary secret works

---

## Open Questions & Decisions Required

### Question 1: Checkout Price Authority

**Question:** Is checkout/server the single source of truth for price/tax/shipping, or will cart SKU snapshots be trusted?

**Decision Required:**
- [ ] **Option A (Recommended):** Checkout is authoritative - Always fetch fresh from DB
- [ ] **Option B:** Cart snapshot trusted - Must version SKUs and validate version at checkout
- [ ] **Option C:** Hybrid - Trust for X minutes, then revalidate

**Impact:** Architecture, security model, user experience

**Recommendation:** Option A (checkout authoritative) for correctness and simplicity

---

### Question 2: Shop ID Derivation Strategy

**Question:** How is shopId derived and enforced across requests (env, hostname, header), and how is it protected from spoofing?

**Decision Required:**
- [ ] **Strategy:** Environment variable | Hostname map | Database lookup
- [ ] **Validation:** How to prevent spoofing? (signature, allowlist, etc.)
- [ ] **Fallback:** What happens if shop ID cannot be determined?

**Current State:** Relies on env variable, not validated

**Recommendation for Phase 1:**
- Use `SHOP_ID` environment variable (one shop per deployment)
- Validate presence at app startup
- Future: Add hostname-based derivation for multi-tenancy

---

### Question 3: Alternate Integration Patterns

**Question:** Do any shops run outside Next.js App Router (besides cochlearfit), and should the plan include alternate integration steps?

**Current Divergent Implementations:**
- `cochlearfit` - Uses custom local cart context
- Worker-based shops - Different architecture

**Decision Required:**
- [ ] Migrate all to platform-core pattern
- [ ] Support multiple patterns with clear documentation
- [ ] Maintain divergent implementations as exceptions

**Impact:** Maintenance burden, testing coverage, feature parity

---

### Question 4: Data Retention & Privacy

**Question:** What's the intended data retention policy for carts and analytics events containing cart_id (GDPR/CCPA)?

**Compliance Requirements:**
- GDPR: Right to erasure, data minimization
- CCPA: Right to deletion, sale opt-out

**Decision Required:**
- [ ] **Cart TTL:** Current 30 days - is this appropriate?
- [ ] **Cart Lifecycle Records:** Retention period?
- [ ] **Analytics Events:** PII handling, anonymization?
- [ ] **Deletion Requests:** How to handle cart_id in user deletion?

**Recommendation:**
- Cart data: 30-day TTL (existing)
- Lifecycle records: 90 days (for fraud investigation)
- Analytics: Anonymize cart_id after order complete
- User deletion: Delete cart and lifecycle records, anonymize analytics

---

## Implementation Priority

### Phase 0: Security Foundations (Weeks 1-2)

**MUST complete before any production deployment:**

1. **Price Trust Boundary** (Critical)
   - Modify `CartLine` to store only IDs
   - Implement checkout repricing
   - Add tampering tests

2. **Multi-Shop Isolation** (High)
   - Namespace cart storage keys
   - Bind shop ID to cookie
   - Implement shop ID derivation
   - Add isolation tests

3. **Inventory Revalidation** (High)
   - Mandatory checkout stock check
   - Clear error messaging
   - Adjust acceptance criteria

### Phase 1: Core Features (Weeks 3-4)

4. **Cart Lifecycle** (Medium)
   - Implement state machine
   - Idempotent clearing
   - Webhook integration

5. **Cookie Hardening** (Medium)
   - Enforce attributes
   - Secret rotation support
   - Telemetry

### Phase 2: Enhancements (Weeks 5+)

6. **Inventory Reservation** (Target)
   - TTL-based holds
   - Cross-shop coordination

---

## Revised Go/No-Go Criteria

### GO Criteria ✅

**Security (NEW):**
- ✅ Price trust boundary implemented (checkout repricing)
- ✅ Multi-shop isolation enforced (namespaced keys + cookie)
- ✅ Inventory revalidation at checkout (mandatory)
- ✅ Cart clearing idempotent (state machine)
- ✅ Cookie hardening complete (attributes + rotation)
- ✅ Tampering tests passing
- ✅ Isolation tests passing

**Technical:**
- ✅ All critical requirements complete
- ✅ End-to-end tests passing
- ✅ Performance targets met in staging
- ✅ Security audit passed
- ✅ Monitoring/alerts configured

**UX:**
- ✅ At least 2 important items complete
- ✅ User testing completed (positive feedback)
- ✅ Mobile experience validated
- ✅ Accessibility requirements met

### NO-GO Criteria ❌

**Security Blockers (NEW):**
- ❌ Cart stores pricing data (must store only IDs)
- ❌ Checkout doesn't reprice (price tampering possible)
- ❌ Cart keys not shop-scoped (leakage risk)
- ❌ Cookie doesn't validate shop (replay attack risk)
- ❌ No checkout stock revalidation (oversell risk)
- ❌ Cart clearing not idempotent (duplicate event risk)

**Technical Blockers:**
- ❌ Any critical requirement incomplete
- ❌ P0/P1 bugs in staging
- ❌ Performance below targets
- ❌ Security vulnerabilities found
- ❌ Storage backend not ready

---

## Testing Requirements

### Security Test Suite (MANDATORY)

```typescript
describe('Cart Security', () => {
  describe('Price Tampering Protection', () => {
    test('checkout uses DB price, not cart price', async () => {
      // Add item (price=$29.99)
      const cart = await addToCart({ skuId: 'sku_123', qty: 1 });

      // Tamper cookie to inject fake price
      const tampered = tamperCookie(cart.cookie, { price: 1 });

      // Checkout MUST use DB price
      const session = await createCheckout(tampered);
      expect(session.amount_total).toBe(2999); // DB price
    });

    test('stale cart pricing updated at checkout', async () => {
      // Add item (price=$29.99)
      const cart = await addToCart({ skuId: 'sku_123', qty: 1 });

      // Price changes in DB
      await db.sku.update({ where: { id: 'sku_123' }, data: { price: 3999 } });

      // Checkout MUST use new DB price
      const session = await createCheckout(cart.cookie);
      expect(session.amount_total).toBe(3999); // New price
    });
  });

  describe('Multi-Shop Isolation', () => {
    test('cart from shop A cannot be read by shop B', async () => {
      // Create cart in shop A
      const cartA = await createCart('shop-a');
      await addToCart(cartA.id, 'shop-a', { skuId: 'sku_123', qty: 1 });

      // Try to read from shop B
      const result = await getCart(cartA.id, 'shop-b');
      expect(result).toBeNull(); // ✅ Isolated
    });

    test('cookie with wrong shop ID rejected', async () => {
      // Create cart in shop A
      const cart = await createCart('shop-a');

      // Try to use cookie in shop B
      const result = await decodeCartCookie(cart.cookie, 'shop-b');
      expect(result).toBeNull(); // ✅ Rejected
    });
  });

  describe('Inventory Revalidation', () => {
    test('checkout rejects out-of-stock items', async () => {
      // Add item (in stock)
      const cart = await addToCart({ skuId: 'sku_123', qty: 5 });

      // Stock drops to 2
      await db.sku.update({ where: { id: 'sku_123' }, data: { stock: 2 } });

      // Checkout MUST reject
      await expect(createCheckout(cart.cookie))
        .rejects.toThrow('ITEMS_UNAVAILABLE');
    });
  });

  describe('Cart Clearing Idempotency', () => {
    test('duplicate webhook events do not error', async () => {
      const event = mockCheckoutCompletedEvent();

      // First call: clears cart
      await handleWebhook(event);

      // Second call: idempotent success
      await expect(handleWebhook(event)).resolves.not.toThrow();
    });
  });

  describe('Cookie Hardening', () => {
    test('cookie has required attributes', () => {
      const cookie = encodeCartCookie('cart_123', 'shop-1');
      const header = asSetCookieHeader(cookie);

      expect(header).toContain('__Host-CART_ID=');
      expect(header).toContain('Secure');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header).not.toContain('Domain='); // ✅ No Domain
    });

    test('secret rotation works', () => {
      // Encode with old secret
      const oldCookie = encodeCartCookie('cart_123', 'shop-1', 'old-secret');

      // Decode with new primary + old secondary
      process.env.CART_COOKIE_SECRET = 'new-secret';
      process.env.CART_COOKIE_SECRET_OLD = 'old-secret';

      const result = decodeCartCookie(oldCookie, 'shop-1');
      expect(result).toEqual({ cartId: 'cart_123', shopId: 'shop-1' });
    });
  });
});
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude | Initial security requirements based on review findings |

## References

- [Cart Production Readiness Plan](./cart-production-readiness.md) - Parent document
- [Cart & Checkout Standardization Blueprint](./cart-checkout-standardization-blueprint.md) - Strategic direction
- [MDN: __Host- Prefix](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Status:** These requirements are MANDATORY for production deployment. They supersede any conflicting statements in other documents.
