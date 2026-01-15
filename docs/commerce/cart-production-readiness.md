<!-- docs/commerce/cart-production-readiness.md -->

Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2026-01-12

# Cart Production Readiness Plan

**Revision:** v1.0
**Audience:** Product, Engineering, QA, Operations
**Purpose:** Define requirements, metrics, and rollout plan for deploying the centralized shopping cart to production shops

## Executive Summary

The base-shop platform has a centralized cart implementation (`@acme/platform-core`) with solid architecture:
- Multi-backend storage (Memory, Redis, Cloudflare Durable Objects)
- Secure cookie-based identification (`__Host-CART_ID`)
- REST API with full CRUD operations
- React context with offline support
- Comprehensive UI components and test coverage

**Current Status:** Core implementation complete, but critical integration work required before production deployment.

**Timeline:** 4-week phased rollout recommended

**First Pilot Shop:** Brikette (recommended due to existing platform alignment)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│ Shop Frontend (Next.js App Router)                          │
├─────────────────────────────────────────────────────────────┤
│ CartProvider (React Context)                                │
│  ├─ useState (local cart state)                             │
│  ├─ localStorage (offline cache)                            │
│  └─ Online sync handler                                     │
├─────────────────────────────────────────────────────────────┤
│ UI Components                                               │
│  ├─ AddToCartButton                                         │
│  ├─ CartTemplate (full cart view)                          │
│  ├─ MiniCart (drawer)                                       │
│  ├─ HeaderCart (icon + badge)                              │
│  └─ OrderSummary                                            │
├─────────────────────────────────────────────────────────────┤
│ API Routes (/api/cart)                                      │
│  ├─ GET    (fetch cart)                                     │
│  ├─ POST   (add item)                                       │
│  ├─ PATCH  (update quantity)                                │
│  ├─ PUT    (replace cart)                                   │
│  └─ DELETE (remove item)                                    │
├─────────────────────────────────────────────────────────────┤
│ CartStore (abstraction layer)                               │
│  ├─ MemoryStore (dev/fallback)                             │
│  ├─ RedisStore (production)                                │
│  └─ CloudflareDurableStore (edge)                          │
├─────────────────────────────────────────────────────────────┤
│ Cart Cookie (__Host-CART_ID)                               │
│  └─ HMAC-SHA256 signed with CART_COOKIE_SECRET             │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| Component | Location | Purpose |
|-----------|----------|---------|
| API Handlers | `packages/platform-core/src/cartApi.ts` | REST endpoint handlers |
| Shop API Factory | `packages/platform-core/src/cartApiForShop.ts` | Per-shop API creation |
| Storage Abstraction | `packages/platform-core/src/cartStore.ts` | Storage interface + factory |
| Memory Backend | `packages/platform-core/src/cartStore/memoryStore.ts` | In-memory storage |
| Redis Backend | `packages/platform-core/src/cartStore/redisStore.ts` | Redis/Upstash storage |
| Cookie Security | `packages/platform-core/src/cartCookie.ts` | Signed cookie encoding |
| React Context | `packages/platform-core/src/contexts/CartContext.tsx` | Client-side state |
| Cart Template | `packages/ui/src/components/templates/CartTemplate.tsx` | Full cart UI |
| Mini Cart | `packages/ui/src/components/organisms/MiniCart.client.tsx` | Drawer component |
| Add to Cart | `packages/platform-core/src/components/shop/AddToCartButton.client.tsx` | Add button |

### Data Model

```typescript
// Cart state is a map of line items keyed by SKU ID (or SKU:Size)
type CartState = Record<string, CartLine>;

interface CartLine {
  sku: SKU;              // Full SKU object with price, stock, etc.
  qty: number;           // Quantity
  size?: string;         // Size variant (if applicable)
  meta?: {               // Optional metadata
    source?: string;     // Attribution (e.g., "related-products")
    tryOn?: {            // Try-on integration
      idempotencyKey?: string;
      transform?: Record<string, unknown>;
    };
  };
  rental?: RentalLineItem; // Rental metadata (if rental mode)
}
```

---

## Production Readiness Requirements

### 🔴 Critical (Blockers)

Must be completed before any production deployment.

#### 1. Environment Configuration

**Issue:** Required environment variables not consistently set across shops

**Requirements:**
- [ ] `CART_COOKIE_SECRET` added to all shop `.env.template` files
- [ ] Secret generation script or documentation provided
- [ ] Validation at app startup (throw clear error if missing)
- [ ] `CART_STORE_PROVIDER` documented (memory/redis/cloudflare)
- [ ] `CART_TTL` documented (default: 2,592,000 seconds = 30 days)
- [ ] Redis credentials documented (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

**Files to Update:**
- `apps/*/src/.env.template`
- `docs/.env.reference.md`
- `apps/*/src/config/env.ts` (add validation)

**Acceptance Criteria:**
- App fails fast with clear error if `CART_COOKIE_SECRET` missing
- All shops have template files with cart env vars
- Documentation explains each variable's purpose

---

#### 2. CartProvider Integration

**Issue:** Shops don't have CartProvider in root layout

**Requirements:**
- [ ] Wrap app in `CartProvider` for each shop
- [ ] Verify provider is above all cart-consuming components
- [ ] Test offline sync behavior
- [ ] Verify localStorage fallback works

**Implementation Pattern:**
```tsx
// apps/[shop]/src/app/layout.tsx
import { CartProvider } from '@acme/platform-core/contexts/CartContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

**Shops to Update:**
- [ ] brikette
- [ ] cover-me-pretty
- [ ] xa
- [ ] skylar
- [ ] cochlearfit (or document divergence)

**Acceptance Criteria:**
- `useCart()` hook works in all components
- Cart state persists across page navigation
- Offline → online sync tested and working

---

#### 3. API Route Registration

**Issue:** `/api/cart` endpoints not exposed in all shops

**Requirements:**
- [ ] Create API route files for each shop
- [ ] Import handlers from platform-core
- [ ] Verify runtime set to "edge" or "nodejs" appropriately
- [ ] Test all HTTP methods (GET, POST, PATCH, PUT, DELETE)

**Implementation Pattern:**
```typescript
// apps/[shop]/src/app/api/cart/route.ts
export { runtime } from '@acme/platform-core/cartApi';
export { GET, POST, PATCH, PUT, DELETE } from '@acme/platform-core/cartApi';
```

**For shops with custom product resolution:**
```typescript
// apps/[shop]/src/app/api/cart/route.ts
import { createShopCartApi } from '@acme/platform-core/cartApiForShop';

const shopId = process.env.SHOP_ID || 'default-shop';
export const { GET, POST, PATCH, PUT, DELETE, runtime } = createShopCartApi(shopId);
```

**Acceptance Criteria:**
- All CRUD operations work via API
- Proper HTTP status codes returned
- Cookie set correctly on all responses
- Zod validation working (test with invalid payloads)

---

#### 4. Product & Inventory Integration

**Issue:** Cart validates against static `PRODUCTS` array, not real shop inventory

**Requirements:**
- [ ] Connect cart API to actual shop inventory system
- [ ] Implement real-time stock validation
- [ ] Handle out-of-stock scenarios gracefully
- [ ] Support multi-shop product catalogs

**Implementation:**
```typescript
// Create shop-specific product resolver
export async function getShopProducts(shopId: string): Promise<SKU[]> {
  // Fetch from database, not static PRODUCTS array
  return await db.sku.findMany({
    where: { shopId, active: true }
  });
}

// Use in cartApiForShop
export function createShopCartApi(shopId: string) {
  // Override getProductById to use shop-specific resolver
  // ...
}
```

**Inventory Validation Strategy:**
- **Phase 1 (Baseline):** `inventoryMode=validate_only`
  - Check stock availability on add/update
  - Reject if insufficient stock
  - No reservation/locking
- **Phase 2 (Target):** `inventoryMode=reserve_ttl`
  - Place TTL-based hold on checkout
  - Release on completion/timeout
  - Prevent oversells across concurrent checkouts

**Acceptance Criteria:**
- Cart checks actual inventory, not hardcoded values
- Out-of-stock items cannot be added
- Clear error messages for stock issues
- Stock counts accurate across all shops

---

#### 5. Checkout Integration

**Issue:** Cart exists in isolation without checkout flow

**Requirements:**
- [ ] Create `/cart` page in each shop
- [ ] Implement "Proceed to Checkout" button
- [ ] Checkout reads cart state via `useCart()` or API
- [ ] Clear cart after successful order
- [ ] Handle checkout failures (restore cart)

**Flow:**
```
Cart Page → Proceed to Checkout → /checkout
  ↓
Checkout reads cart via decodeCartCookie() or useCart()
  ↓
Create Stripe Checkout Session (includes cart items)
  ↓
On successful payment webhook → Clear cart
  ↓
On failure → Cart remains intact for retry
```

**Files to Create:**
- `apps/[shop]/src/app/cart/page.tsx`
- `apps/[shop]/src/app/checkout/page.tsx` (if not exists)

**Acceptance Criteria:**
- Cart page displays all items with correct prices
- Checkout receives cart data correctly
- Cart cleared only after confirmed payment
- Failed checkouts preserve cart for retry

---

### 🟡 Important (Should Fix for Good UX)

Should be completed before broad rollout to ensure good user experience.

#### 6. Internationalization (i18n)

**Issue:** Cart UI has hardcoded English strings

**Requirements:**
- [ ] Replace hardcoded strings with `t()` calls
- [ ] Add translation keys to all shop locales
- [ ] Test with RTL languages (Arabic)
- [ ] Verify number/currency formatting

**Strings to Translate:**
- AddToCartButton: "Add to cart", "Adding..."
- CartTemplate: "Your cart is empty", "Remove", "Quantity", "Subtotal"
- Error messages: "Item not found", "Out of stock", "Size required"

**Acceptance Criteria:**
- All user-facing strings use i18n keys
- Translations exist in all shop locales
- UI works correctly in RTL mode

---

#### 7. Error Handling & User Feedback

**Issue:** Error messages too technical for end users

**Requirements:**
- [ ] User-friendly error messages
- [ ] Helpful recovery suggestions
- [ ] Toast notifications for cart actions
- [ ] Retry logic for transient failures

**Error Message Improvements:**

| Current (Technical) | Improved (User-Friendly) |
|---------------------|--------------------------|
| "Item not found" | "Sorry, this item is no longer available" |
| "Insufficient stock" | "Only {count} left in stock. Quantity adjusted." |
| "Size required" | "Please select a size before adding to cart" |
| "Cart update failed" | "Connection issue. Your cart will sync when back online." |

**Acceptance Criteria:**
- Non-technical users understand errors
- Errors suggest next action
- Transient failures retry automatically
- Success feedback on add to cart

---

#### 8. Mini Cart Integration

**Issue:** MiniCart component exists but not integrated

**Requirements:**
- [ ] Add HeaderCart block to shop headers
- [ ] Wire up cart icon with item count badge
- [ ] Configure MiniCart drawer trigger
- [ ] Test mobile UX

**Implementation:**
```tsx
// In shop header component
import { HeaderCart } from '@acme/ui/components/cms/blocks/HeaderCart';
import { MiniCart } from '@acme/ui/components/organisms/MiniCart.client';

export function Header() {
  return (
    <header>
      <nav>
        {/* other nav items */}
        <MiniCart trigger={<HeaderCart />} />
      </nav>
    </header>
  );
}
```

**Acceptance Criteria:**
- Cart icon visible in header
- Badge shows accurate item count
- Drawer opens smoothly on mobile/desktop
- Quick add/remove actions work

---

#### 9. Empty Cart State

**Issue:** Basic empty state lacks engagement

**Requirements:**
- [ ] Design appealing empty cart UI
- [ ] Add "Continue Shopping" CTA
- [ ] Show recommended/popular products
- [ ] Track empty cart views

**Acceptance Criteria:**
- Empty state guides user back to shopping
- Recommendations personalized if possible
- Clear path to product discovery

---

#### 10. Analytics Integration

**Issue:** Basic events logged but incomplete tracking

**Current Events:**
- `add_to_cart`
- `cart_remove`
- `cart_set_qty`

**Additional Events Needed:**
- [ ] `view_cart` (cart page load)
- [ ] `cart_quantity_changed` (manual qty update)
- [ ] `proceed_to_checkout` (button click)
- [ ] `cart_abandoned` (left cart page without checkout)
- [ ] `cart_recovered` (returned after abandonment)

**Event Schema Standardization:**
```typescript
interface CartAnalyticsEvent {
  type: 'add_to_cart' | 'remove_from_cart' | 'view_cart' | /* ... */;
  shop_id: string;
  cart_id: string;
  currency: string;
  value: number;              // Total cart value
  items: Array<{
    product_id: string;
    name: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
  is_logged_in: boolean;
  source?: string;            // Attribution
  timestamp: string;
}
```

**Acceptance Criteria:**
- All events follow standard schema
- Events fire reliably across shops
- Data flows to analytics platform
- Dashboards show cart funnel metrics

---

### 🟢 Nice to Have (Future Enhancements)

Can be implemented post-launch based on business priorities.

#### 11. Promo Codes & Discounts

**Requirements:**
- [ ] Promo code validation API
- [ ] Discount calculation in cart totals
- [ ] Discount breakdown display
- [ ] Integration with Stripe metadata

---

#### 12. Gift Cards

**Requirements:**
- [ ] Gift card balance checking
- [ ] Apply to cart totals
- [ ] Split payment support with Stripe

---

#### 13. Loyalty Points

**Requirements:**
- [ ] Points calculation
- [ ] Redemption at checkout
- [ ] Customer account integration

---

#### 14. Advanced Cart Features

**Future Considerations:**
- Save for later / wishlists
- Cart sharing via URL
- Cross-device cart sync (for logged-in users)
- Bulk quantity updates
- Compare items side-by-side
- Cart recovery emails (abandoned cart automation)

---

## Shop Integration Checklist

Use this checklist for each shop deployment:

### Pre-Integration
- [ ] Review shop-specific requirements
- [ ] Identify custom product catalog structure
- [ ] Plan inventory integration approach
- [ ] Design cart/checkout page layouts

### Development
- [ ] Add environment variables
- [ ] Integrate CartProvider in root layout
- [ ] Create `/api/cart` route
- [ ] Connect product/inventory resolution
- [ ] Build cart page UI
- [ ] Integrate checkout flow
- [ ] Add header cart icon
- [ ] Implement empty cart state
- [ ] Translate all strings
- [ ] Add analytics events

### Testing
- [ ] Unit tests pass for cart components
- [ ] Integration tests: add/update/remove items
- [ ] E2E tests: full cart → checkout flow
- [ ] Test offline sync behavior
- [ ] Test stock validation
- [ ] Test error scenarios
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing (iOS, Android)
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance testing (load time, API response)

### Security
- [ ] `CART_COOKIE_SECRET` is cryptographically secure
- [ ] Cookie attributes verified (HttpOnly, Secure, SameSite)
- [ ] CSRF protection on API routes
- [ ] XSS prevention (input sanitization)
- [ ] Rate limiting on cart API
- [ ] Validate all user inputs (Zod schemas)

### Operations
- [ ] Redis/storage backend configured
- [ ] Monitoring alerts set up
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Cart TTL configured appropriately
- [ ] Backup/restore plan documented
- [ ] Rollback procedure defined

### Documentation
- [ ] Shop-specific configuration documented
- [ ] Custom integration points noted
- [ ] Known issues/limitations listed
- [ ] Support runbook created

---

## Success Metrics

### Technical Health Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Cart API Error Rate | < 0.1% | > 1.0% |
| Cart API Response Time (p95) | < 200ms | > 500ms |
| Cart API Response Time (p99) | < 500ms | > 1000ms |
| Offline Sync Success Rate | > 99% | < 95% |
| Cookie Validation Failures | < 0.01% | > 0.1% |
| Storage Backend Availability | > 99.9% | < 99% |

### User Experience Metrics

| Metric | Target | Industry Benchmark |
|--------|--------|-------------------|
| Add-to-Cart Success Rate | > 98% | 95-98% |
| Cart Page Load Time | < 1.5s | < 2s |
| Cart → Checkout Conversion | > 40% | 30-50% |
| Checkout Completion Rate | > 60% | 50-70% |
| Cart Abandonment Rate | < 60% | 60-80% |
| Average Items Per Cart | 2-4 items | Varies by shop |

### Business Impact Metrics

| Metric | Measurement Period | Goal |
|--------|-------------------|------|
| % Orders Using Centralized Cart | Weekly | 100% by Week 8 |
| Average Cart Value | Weekly | Increase 10% YoY |
| Cart-to-Purchase Time | Daily | Decrease 20% |
| Cart Abandonment Recovery | Monthly | 5-10% of abandoned carts |
| Cross-Sell Success (via cart) | Monthly | Baseline, then improve |

### Monitoring & Alerting

**Critical Alerts** (Page immediately):
- Cart API error rate > 1% for 5 minutes
- Storage backend down
- Cookie validation failures spike > 0.5%

**Warning Alerts** (Notify):
- Cart API response time p95 > 500ms
- Cart abandonment rate spike > 10% day-over-day
- Add-to-cart success rate < 95%

**Info Alerts** (Log):
- Unusual cart size (> 50 items)
- Cart TTL approaching expiry with items
- Offline sync retries

---

## Rollout Plan

### Phase 1: Core Functionality (Week 1-2)

**Goal:** Complete critical requirements and validate with one pilot shop

**Tasks:**
1. Environment configuration for all shops
2. CartProvider integration (pilot shop)
3. API routes registered (pilot shop)
4. Product/inventory integration (pilot shop)
5. Basic checkout flow (pilot shop)
6. End-to-end testing
7. Security audit
8. Performance baseline

**Pilot Shop:** Brikette (recommended)
- Already uses platform-core patterns
- Good test case for multi-language support
- Moderate traffic for safe testing

**Exit Criteria:**
- All critical items complete
- Cart → checkout → order flow working
- No P0/P1 bugs in testing
- Performance targets met

---

### Phase 2: UX Polish (Week 3)

**Goal:** Improve user experience before broader rollout

**Tasks:**
1. Complete i18n for all cart strings
2. Implement user-friendly error messages
3. Integrate MiniCart in header
4. Design empty cart state
5. Complete analytics integration
6. Mobile optimization
7. Accessibility improvements

**Exit Criteria:**
- All important items complete (or explicitly deferred)
- User testing feedback incorporated
- Mobile UX validated
- Analytics dashboard showing data

---

### Phase 3: Gradual Rollout (Week 4-6)

**Goal:** Deploy to remaining shops with monitoring

**Week 4:**
- Deploy to Shop #2 (e.g., cover-me-pretty)
- Monitor metrics for 3-5 days
- Address any shop-specific issues

**Week 5:**
- Deploy to Shops #3-4 (e.g., xa, skylar)
- Monitor comparative metrics
- Optimize based on learnings

**Week 6:**
- Deploy to remaining shops
- Monitor at scale
- Address any edge cases

**Deployment Strategy:**
- Staged rollout per shop (not all at once)
- 3-5 day soak period between shops
- Feature flag for quick rollback if needed
- On-call rotation during deployments

**Exit Criteria:**
- All shops using centralized cart
- Metrics within target ranges
- No critical bugs in production
- Support team trained

---

### Phase 4: Optimization (Week 7+)

**Goal:** Iterate based on real-world data

**Focus Areas:**
1. Cart abandonment reduction
2. Performance optimization
3. Feature enhancements
4. Cross-shop optimization

---

## Risk Management

### High-Risk Areas

#### 1. Cart Data Loss
**Risk:** Cart data lost during migration or failures

**Mitigation:**
- Comprehensive localStorage fallback
- Redis persistence configuration validated
- Regular backups of cart data
- Graceful degradation to empty cart

#### 2. Inventory Oversells
**Risk:** Multiple customers purchase last item simultaneously

**Mitigation:**
- Phase 1: Validate-only mode (best effort)
- Phase 2: Implement TTL-based holds
- Stock buffer for high-demand items
- Clear communication when out of stock

#### 3. Performance Degradation
**Risk:** Cart API becomes bottleneck under load

**Mitigation:**
- Load testing before rollout
- Redis scaling plan
- CDN for static cart assets
- Circuit breakers on external dependencies

#### 4. Cookie Issues
**Risk:** Cart IDs not persisting across sessions

**Mitigation:**
- Thorough testing of cookie attributes
- Fallback to localStorage
- Clear error messages
- Support documentation for users

#### 5. Checkout Integration Failures
**Risk:** Cart → checkout handoff breaks

**Mitigation:**
- Comprehensive integration tests
- Idempotent checkout creation
- Cart preservation on errors
- Clear user communication

### Rollback Procedure

If critical issues occur:

1. **Immediate:** Enable feature flag to disable new cart
2. **Fallback:** Revert to shop's previous cart (if applicable)
3. **Preserve:** Existing cart data retained during rollback
4. **Communicate:** Notify users of any issues via banner
5. **Debug:** Investigate in non-production environment
6. **Fix:** Address root cause
7. **Re-deploy:** With fix, after testing

---

## Production Go/No-Go Criteria

### GO Criteria ✅

**Technical:**
- All critical requirements complete
- End-to-end tests passing
- Performance targets met in staging
- Security audit passed
- Monitoring/alerts configured

**UX:**
- At least 2 important items complete
- User testing completed (positive feedback)
- Mobile experience validated
- Accessibility requirements met

**Operations:**
- Storage backend ready (Redis provisioned)
- On-call rotation staffed
- Rollback procedure documented
- Support team trained

**Business:**
- Stakeholder approval
- Success metrics defined
- Pilot shop willing to deploy

### NO-GO Criteria ❌

**Blockers:**
- Any critical requirement incomplete
- P0/P1 bugs in staging
- Performance below targets
- Security vulnerabilities found
- Storage backend not ready

**Concerns:**
- Less than 1 important item complete
- User testing showed major issues
- Mobile experience broken
- No rollback plan

**Timing:**
- Peak shopping season (wait for low-traffic period)
- Other major releases scheduled same week
- Insufficient testing time

---

## Technical Debt & Future Work

### Known Limitations

1. **Cochlearfit Divergence**
   - Uses custom cart implementation
   - Decision needed: migrate or maintain as exception
   - Document if maintaining separate implementation

2. **Static Product Resolution**
   - Current API uses global `PRODUCTS` array
   - Needs real inventory integration per shop
   - Plan for gradual migration

3. **No Reservation System**
   - Phase 1 is validate-only (best effort)
   - True inventory locking is Phase 2
   - Document limitations clearly

4. **Limited Multi-Currency Support**
   - Cart stores prices as-is from SKU
   - No dynamic currency conversion
   - Future enhancement if needed

### Future Enhancements (Post-Launch)

**Q1 2026:**
- Implement promo code system
- Add cart abandonment emails
- Optimize performance based on production data

**Q2 2026:**
- Inventory reservation system (TTL-based holds)
- Gift card support
- Loyalty points integration

**Q3 2026:**
- Advanced cart features (save for later, wishlists)
- Cart sharing functionality
- Cross-device sync for authenticated users

**Q4 2026:**
- Multi-currency support
- International tax calculation
- Regional inventory allocation

---

## Appendix

### A. Environment Variables Reference

```bash
# Required
CART_COOKIE_SECRET=<generate-secure-random-string>

# Optional - Storage Configuration
CART_STORE_PROVIDER=redis # memory | redis | cloudflare
CART_TTL=2592000 # 30 days in seconds

# Optional - Redis Configuration (if using redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### B. API Response Examples

**Successful Add to Cart:**
```json
POST /api/cart
{
  "sku": { "id": "sku_123" },
  "qty": 2,
  "size": "M"
}

Response: 200 OK
{
  "ok": true,
  "cart": {
    "sku_123:M": {
      "sku": { "id": "sku_123", "title": "T-Shirt", "price": 2999, ... },
      "qty": 2,
      "size": "M"
    }
  }
}
```

**Out of Stock Error:**
```json
Response: 409 Conflict
{
  "error": "Insufficient stock"
}
```

### C. Testing Scenarios

**Functional Tests:**
- Add item to cart
- Update quantity
- Remove item
- Clear cart
- Add multiple items
- Add sized vs non-sized items
- Handle out of stock
- Handle missing size

**Integration Tests:**
- Cart persists across page loads
- Cart syncs when coming back online
- Cart data migrates to checkout
- Cart cleared after order completion

**Edge Cases:**
- Add same item multiple times
- Concurrent add from multiple tabs
- Network failure during add
- Storage backend failure
- Invalid cookie tampering
- Expired cart
- Cart with 50+ items

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude | Initial production readiness plan |

## References

- [Cart & Checkout Standardization Blueprint](./cart-checkout-standardization-blueprint.md)
- [Inventory Migration Plan](../inventory-migration.md)
- [Template Contract](../runtime/template-contract.md)
- [Testing Documentation](../../__tests__/docs/testing.md)

---

**Questions or feedback?** Contact the platform team or create an issue in the repository.
