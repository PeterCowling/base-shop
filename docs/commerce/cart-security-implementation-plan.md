<!-- docs/commerce/cart-security-implementation-plan.md -->

Type: Implementation Plan
Status: In Progress
Domain: Commerce, Security
Last-reviewed: 2026-01-12

# Cart Security Implementation Plan

**Parent:** [Cart Security Requirements](./cart-security-requirements.md)
**Purpose:** Step-by-step implementation guide for security requirements

## Implementation Status

- [x] Created secure CartLine types
- [ ] Phase 1: Add hydration to API responses (non-breaking)
- [ ] Phase 2: Migrate storage to secure format
- [ ] Phase 3: Remove legacy SKU storage
- [ ] Phase 4: Add shop ID scoping
- [ ] Phase 5: Implement checkout repricing
- [ ] Phase 6: Add lifecycle state machine

---

## Phase 1: API Hydration (Non-Breaking)

**Goal:** Add SKU hydration to API responses without changing storage format

### Changes Required

#### 1.1 Add Hydrated Response Type

```typescript
// packages/platform-core/src/cart/apiTypes.ts
export interface HydratedCartLine {
  line: CartLine | CartLineSecure;
  sku: SKU; // Fresh from database
}

export interface CartApiResponse {
  ok: true;
  cart: CartState;
  hydrated?: Record<string, HydratedCartLine>;
}
```

#### 1.2 Modify Cart API to Hydrate SKUs

```typescript
// packages/platform-core/src/cartApi.ts

export async function GET(req: NextRequest) {
  const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await getCart(cartId);

  // NEW: Hydrate SKUs from database
  const hydrated: Record<string, HydratedCartLine> = {};
  for (const [key, line] of Object.entries(cart)) {
    const sku = await getProductById(line.sku?.id || line.skuId);
    if (sku) {
      hydrated[key] = { line, sku };
    }
  }

  const res = NextResponse.json({
    ok: true,
    cart,
    hydrated, // NEW: Fresh SKU data for display
  });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}
```

#### 1.3 Update UI Components to Use Hydrated Data

```typescript
// packages/ui/src/components/templates/CartTemplate.tsx

export function CartTemplate({ cart, hydrated }: {
  cart: CartState;
  hydrated?: Record<string, HydratedCartLine>;
}) {
  const lines = Object.entries(cart).map(([id, line]) => {
    // Use hydrated SKU if available, fallback to cart SKU (legacy)
    const sku = hydrated?.[id]?.sku || line.sku;

    return {
      id,
      ...line,
      sku, // Fresh SKU data
    };
  });

  // Rest of component uses `sku` from hydrated data
  const subtotal = lines.reduce(
    (s, l) => s + (l.sku.price ?? 0) * l.qty,
    0
  );
  //...
}
```

**Testing:**
- [ ] API returns hydrated SKUs
- [ ] UI displays correct prices from hydrated data
- [ ] Legacy carts (with SKU objects) still work
- [ ] New carts work with or without hydration

---

## Phase 2: Migrate Storage to Secure Format

**Goal:** Store only SKU IDs in cart, rely on hydration for display

### Changes Required

#### 2.1 Update cartStore to Use Secure Format

```typescript
// packages/platform-core/src/cartStore.ts

export async function incrementQty(
  cartId: string,
  sku: SKU,
  qty: number,
  size?: string,
  rental?: RentalLineItem
): Promise<CartStateSecure> { // Changed return type
  const cart = await getCart(cartId);
  const key = size ? `${sku.id}:${size}` : sku.id;

  const line: CartLineSecure = { // NEW: Secure format
    skuId: sku.id, // Only ID stored
    qty: (cart[key]?.qty ?? 0) + qty,
    size,
    rental,
  };

  cart[key] = line;
  await setCart(cartId, cart);
  return cart;
}
```

#### 2.2 Migration Utility

```typescript
// packages/platform-core/src/cart/migrate.ts

export function migrateCartLine(legacy: CartLine): CartLineSecure {
  return {
    skuId: legacy.sku.id,
    qty: legacy.qty,
    size: legacy.size,
    meta: legacy.meta,
    rental: legacy.rental,
  };
}

export function migrateCartState(cart: CartState): CartStateSecure {
  const migrated: CartStateSecure = {};
  for (const [key, line] of Object.entries(cart)) {
    // Check if already migrated
    if ('skuId' in line) {
      migrated[key] = line as CartLineSecure;
    } else {
      migrated[key] = migrateCartLine(line as CartLine);
    }
  }
  return migrated;
}
```

#### 2.3 Update cartStore.getCart to Migrate On Read

```typescript
export async function getCart(cartId: string): Promise<CartStateSecure> {
  const raw = await store.get(`cart:${cartId}`);
  if (!raw) return {};

  const cart = JSON.parse(raw);

  // AUTO-MIGRATE: Convert legacy format to secure format
  return migrateCartState(cart);
}
```

**Testing:**
- [ ] New carts stored in secure format
- [ ] Legacy carts migrated on read
- [ ] API hydration still works
- [ ] No SKU pricing data in storage

---

## Phase 3: Checkout Repricing

**Goal:** Always fetch authoritative pricing at checkout

### Changes Required

#### 3.1 Create Checkout Repricing Module

```typescript
// packages/platform-core/src/checkout/reprice.ts

export interface RepricedLineItem {
  skuId: string;
  title: string;
  quantity: number;
  price: number;        // Fresh from DB
  deposit: number;      // Fresh from DB
  size?: string;
  sku: SKU;            // Full SKU for reference
}

export async function repriceCart(
  cart: CartStateSecure,
  shopId: string
): Promise<RepricedLineItem[]> {
  const items: RepricedLineItem[] = [];

  for (const [key, line] of Object.entries(cart)) {
    // SECURITY: Fetch fresh from database, never trust cart
    const sku = await db.sku.findUnique({
      where: { id: line.skuId, shopId },
    });

    if (!sku) {
      throw new CheckoutValidationError({
        code: 'SKU_NOT_FOUND',
        skuId: line.skuId,
      });
    }

    if (!sku.active) {
      throw new CheckoutValidationError({
        code: 'SKU_INACTIVE',
        skuId: line.skuId,
      });
    }

    if (sku.stock < line.qty) {
      throw new CheckoutValidationError({
        code: 'INSUFFICIENT_STOCK',
        skuId: line.skuId,
        requested: line.qty,
        available: sku.stock,
      });
    }

    items.push({
      skuId: sku.id,
      title: sku.title,
      quantity: line.qty,
      price: sku.price,      // ✅ Fresh from DB
      deposit: sku.deposit ?? 0, // ✅ Fresh from DB
      size: line.size,
      sku,
    });
  }

  return items;
}
```

#### 3.2 Update lineItems.ts to Use Repriced Data

```typescript
// packages/platform-core/src/checkout/lineItems.ts

export async function buildLineItemsForItem(
  item: RepricedLineItem, // Changed from CartLine
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  // Use repriced data, not cart data
  const unitPrice = await priceForDays(item.sku, rentalDays);
  const discounted = Math.round(unitPrice * (1 - discountRate));
  const unitConv = await convertCurrency(discounted, currency);
  const depositConv = await convertCurrency(item.deposit, currency); // ✅ From reprice

  const baseName = item.size ? `${item.title} (${item.size})` : item.title;

  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(unitConv * 100),
        product_data: { name: baseName },
      },
      quantity: item.quantity,
    },
  ];

  if (item.deposit > 0) {
    lines.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(depositConv * 100),
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.quantity,
    });
  }

  return lines;
}
```

#### 3.3 Update Checkout Session Creation

```typescript
// packages/platform-core/src/checkout/createSession.ts

export async function createCheckoutSession(
  cartId: string,
  shopId: string,
  options: CheckoutOptions
): Promise<Stripe.Checkout.Session> {
  // 1. Fetch cart
  const cart = await getCart(cartId);

  // 2. SECURITY: Reprice from database (authoritative)
  const repricedItems = await repriceCart(cart, shopId);

  // 3. Build Stripe line items from repriced data
  const lineItems = await Promise.all(
    repricedItems.map(item =>
      buildLineItemsForItem(item, options.rentalDays, options.discountRate, options.currency)
    )
  );

  // 4. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems.flat(),
    metadata: {
      shop_id: shopId,
      cart_id: cartId,
      // ...
    },
    // ...
  });

  return session;
}
```

**Testing:**
- [ ] Checkout fetches fresh prices from DB
- [ ] Tampered cart prices ignored
- [ ] Stale cart prices updated
- [ ] Out-of-stock items rejected
- [ ] Stripe session has correct amounts

---

## Phase 4: Shop ID Scoping

**Goal:** Namespace carts by shop to prevent cross-shop leakage

### Changes Required

#### 4.1 Update CartStore Interface

```typescript
// packages/platform-core/src/cartStore.ts

export interface CartStore {
  createCart(shopId: string): Promise<string>;
  getCart(shopId: string, cartId: string): Promise<CartStateSecure>;
  setCart(shopId: string, cartId: string, cart: CartStateSecure): Promise<void>;
  deleteCart(shopId: string, cartId: string): Promise<void>;
  incrementQty(shopId: string, cartId: string, sku: SKU, qty: number, size?: string, rental?: RentalLineItem): Promise<CartStateSecure>;
  setQty(shopId: string, cartId: string, skuId: string, qty: number): Promise<CartStateSecure | null>;
  removeItem(shopId: string, cartId: string, skuId: string): Promise<CartStateSecure | null>;
}
```

#### 4.2 Update Storage Keys

```typescript
// packages/platform-core/src/cartStore/redisStore.ts

export class RedisCartStore implements CartStore {
  async getCart(shopId: string, cartId: string): Promise<CartStateSecure> {
    const key = `cart:${shopId}:${cartId}`; // ✅ Shop-scoped
    const raw = await redis.get(key);
    if (!raw) return {};
    return JSON.parse(raw);
  }

  async setCart(shopId: string, cartId: string, cart: CartStateSecure): Promise<void> {
    const key = `cart:${shopId}:${cartId}`; // ✅ Shop-scoped
    await redis.set(key, JSON.stringify(cart), {
      ex: CART_TTL,
    });
  }

  // Similar updates for all methods...
}
```

#### 4.3 Update Cookie to Bind Shop ID

```typescript
// packages/platform-core/src/cartCookie.ts

export function encodeCartCookie(
  cartId: string,
  shopId: string
): string {
  const secret = getCartCookieSecret();
  const payload = `${cartId}:${shopId}`;
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function decodeCartCookie(
  cookie: string | undefined,
  expectedShopId: string
): { cartId: string; shopId: string } | null {
  if (!cookie) return null;

  const [payload, signature] = cookie.split('.');
  if (!payload || !signature) return null;

  // Verify signature
  const secret = getCartCookieSecret();
  const expectedSig = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSig) {
    logger.warn('Cart cookie signature verification failed', {
      expectedShop: expectedShopId,
    });
    return null;
  }

  const [cartId, shopId] = payload.split(':');

  // SECURITY: Verify shop matches expected
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

#### 4.4 Add Shop Context Helper

```typescript
// packages/platform-core/src/shopContext.ts

export function getShopIdFromRequest(req: NextRequest): string {
  // Strategy 1: Environment variable (one shop per deployment)
  const envShopId = process.env.SHOP_ID;
  if (envShopId) {
    return envShopId;
  }

  // Strategy 2: Hostname mapping (future multi-tenancy)
  // const hostname = req.headers.get('host');
  // return HOSTNAME_TO_SHOP_MAP[hostname];

  throw new Error('SHOP_ID environment variable not set');
}
```

#### 4.5 Update Cart API Handlers

```typescript
// packages/platform-core/src/cartApi.ts

export async function GET(req: NextRequest) {
  // SECURITY: Get and validate shop ID
  const shopId = getShopIdFromRequest(req);

  const cookie = decodeCartCookie(
    req.cookies.get(CART_COOKIE)?.value,
    shopId // ✅ Validate shop
  );

  let cartId: string;
  if (cookie) {
    cartId = cookie.cartId;
  } else {
    cartId = await createCart(shopId); // ✅ Shop-scoped
  }

  const cart = await getCart(shopId, cartId); // ✅ Shop-scoped

  // Hydrate...
  const res = NextResponse.json({ ok: true, cart, hydrated });
  res.headers.set("Set-Cookie", asSetCookieHeader(
    encodeCartCookie(cartId, shopId) // ✅ Shop in cookie
  ));
  return res;
}
```

**Testing:**
- [ ] Cart keys namespaced by shop
- [ ] Cookie includes and validates shop ID
- [ ] Cross-shop cart access rejected
- [ ] Replayed cookie with wrong shop rejected
- [ ] Missing SHOP_ID env var errors clearly

---

## Phase 5: Cart Lifecycle State Machine

**Goal:** Idempotent cart clearing with order tracking

### Changes Required

#### 5.1 Create CartLifecycle Model

```typescript
// packages/platform-core/src/cart/lifecycle.ts

export enum CartStatus {
  ACTIVE = 'active',
  CHECKOUT_INITIATED = 'checkout_initiated',
  ORDER_PENDING = 'order_pending',
  ORDER_COMPLETE = 'order_complete',
  ORDER_FAILED = 'order_failed',
}

export interface CartLifecycle {
  cartId: string;
  shopId: string;
  status: CartStatus;
  checkoutSessionId?: string;
  orderId?: string;
  clearedAt?: Date;
  updatedAt: Date;
}
```

#### 5.2 Add Prisma Schema

```prisma
model CartLifecycle {
  id                  String      @id @default(cuid())
  cartId              String
  shopId              String
  status              String      @default("active")
  checkoutSessionId   String?
  orderId             String?
  clearedAt           DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@unique([shopId, cartId])
  @@index([checkoutSessionId])
  @@index([orderId])
}
```

#### 5.3 Implement Idempotent Clearing

```typescript
// packages/platform-core/src/cart/clearCart.ts

export async function clearCartForOrder(
  shopId: string,
  cartId: string,
  orderId: string,
  sessionId: string
): Promise<void> {
  // 1. Check lifecycle state
  const lifecycle = await db.cartLifecycle.findUnique({
    where: { shopId_cartId: { shopId, cartId } },
  });

  // 2. Idempotent: If already cleared for this order, return success
  if (lifecycle?.status === CartStatus.ORDER_COMPLETE &&
      lifecycle.orderId === orderId) {
    logger.info('Cart already cleared for order', { cartId, orderId });
    return; // ✅ Idempotent
  }

  // 3. Verify session matches
  if (lifecycle && lifecycle.checkoutSessionId !== sessionId) {
    throw new Error(`Session mismatch: expected ${lifecycle.checkoutSessionId}, got ${sessionId}`);
  }

  // 4. Clear cart and update lifecycle atomically
  await db.$transaction([
    // Delete cart from storage
    deleteCart(shopId, cartId),
    // Update lifecycle
    db.cartLifecycle.upsert({
      where: { shopId_cartId: { shopId, cartId } },
      update: {
        status: CartStatus.ORDER_COMPLETE,
        orderId,
        clearedAt: new Date(),
      },
      create: {
        shopId,
        cartId,
        status: CartStatus.ORDER_COMPLETE,
        checkoutSessionId: sessionId,
        orderId,
        clearedAt: new Date(),
      },
    }),
  ]);

  logger.info('Cart cleared for order', { cartId, orderId, sessionId });
}
```

**Testing:**
- [ ] Cart cleared only once per order
- [ ] Duplicate webhook calls idempotent
- [ ] Failed payments don't clear cart
- [ ] Lifecycle tracked correctly

---

## Phase 6: Cookie Hardening

**Goal:** Enforce security attributes and enable secret rotation

### Changes Required

#### 6.1 Enforce Cookie Attributes

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
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = options?.secure ?? isProduction;
  const sameSite = options?.sameSite ?? 'Lax';
  const maxAge = options?.maxAge ?? 2592000; // 30 days

  // __Host- prefix REQUIRES Secure attribute
  if (!secure && isProduction) {
    throw new Error('__Host- cookies require Secure attribute in production');
  }

  return [
    `__Host-CART_ID=${encodedCookie}`,
    'HttpOnly',
    secure ? 'Secure' : '',
    `SameSite=${sameSite}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    // NO Domain attribute (host-only)
  ].filter(Boolean).join('; ');
}
```

#### 6.2 Support Secret Rotation

```typescript
export function decodeCartCookie(
  cookie: string | undefined,
  expectedShopId: string
): { cartId: string; shopId: string } | null {
  if (!cookie) return null;

  const primarySecret = getCartCookieSecret();
  const secondarySecret = process.env.CART_COOKIE_SECRET_OLD;

  // Try primary secret
  const result = tryDecodeWithSecret(cookie, expectedShopId, primarySecret);
  if (result) return result;

  // Try secondary secret (during rotation)
  if (secondarySecret) {
    const result = tryDecodeWithSecret(cookie, expectedShopId, secondarySecret);
    if (result) {
      logger.info('Cart cookie decoded with secondary secret', { shopId: expectedShopId });
      // Emit metric for monitoring rotation progress
      metrics.increment('cart.cookie.secondary_secret_used', {
        shop_id: expectedShopId,
      });
      return result;
    }
  }

  // Both secrets failed
  logger.warn('Cart cookie signature verification failed', { shopId: expectedShopId });
  metrics.increment('cart.cookie.signature_failure', {
    shop_id: expectedShopId,
  });

  return null;
}
```

**Testing:**
- [ ] Cookie has all required attributes
- [ ] Secret rotation works
- [ ] Signature failures tracked
- [ ] Alerts configured

---

## Testing Strategy

### Unit Tests

```typescript
// packages/platform-core/__tests__/cart-security.test.ts

describe('Cart Security', () => {
  describe('Price Tampering Protection', () => {
    test('checkout uses DB price, not cart price');
    test('stale cart pricing updated at checkout');
    test('tampered cookie prices ignored');
  });

  describe('Multi-Shop Isolation', () => {
    test('cart from shop A cannot be read by shop B');
    test('cookie with wrong shop ID rejected');
    test('storage keys namespaced by shop');
  });

  describe('Inventory Revalidation', () => {
    test('checkout rejects out-of-stock items');
    test('checkout rejects inactive SKUs');
  });

  describe('Cart Lifecycle', () => {
    test('duplicate webhook events idempotent');
    test('cart not cleared on payment failure');
  });

  describe('Cookie Security', () => {
    test('cookie has required __Host- attributes');
    test('secret rotation works');
    test('signature failures logged');
  });
});
```

### Integration Tests

```typescript
describe('Cart → Checkout Integration', () => {
  test('full cart to order flow with repricing');
  test('cart cleared after successful order');
  test('cart preserved on checkout failure');
});
```

---

## Rollout Plan

### Week 1-2: Phase 0 (Critical Blockers)
- [ ] Implement secure CartLine types
- [ ] Add API hydration (Phase 1)
- [ ] Migrate storage to secure format (Phase 2)
- [ ] Implement checkout repricing (Phase 3)
- [ ] Add shop ID scoping (Phase 4)

### Week 3: Phase 1 (Core Features)
- [ ] Implement cart lifecycle (Phase 5)
- [ ] Add cookie hardening (Phase 6)
- [ ] Write security test suite

### Week 4: Phase 2 (Validation)
- [ ] Security audit
- [ ] Performance testing
- [ ] Integration testing
- [ ] Documentation

---

## Success Criteria

- [ ] Cart stores only SKU IDs (no pricing data)
- [ ] Checkout always reprices from database
- [ ] Multi-shop isolation enforced
- [ ] Cart clearing idempotent
- [ ] Cookie security hardened
- [ ] All security tests passing
- [ ] Performance targets met
- [ ] Documentation complete

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude | Initial implementation plan |
