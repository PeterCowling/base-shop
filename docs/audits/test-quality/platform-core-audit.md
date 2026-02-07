---
Type: Audit-Report
Status: Historical
Domain: Testing
Package: "@acme/platform-core"
Created: 2026-01-18
Created-by: Claude Opus 4.5
---

# Test Quality Audit: @acme/platform-core

## Summary

| Dimension | Score | Target | Status |
|-----------|-------|--------|--------|
| Mock Fidelity | 3.9/5 | 3.5+ | ✅ Meets target |
| Implementation Coupling | 5.0/5 | 4+ | ✅ Excellent |
| Assertion Clarity | 4.8/5 | 4+ | ✅ Excellent |
| Test Isolation | 4.9/5 | 4.5+ | ✅ Good |
| **Overall** | **4.6/5** | — | Good |

**Files analyzed**: 356 test files
**Flagged files**: 15 (primarily factory tests and order/refund tests)

## Key Findings

### 1. Heavy Mocking in Factory Tests (Expected)

Factory tests (`cartStore.factory.test.ts`, `plugins.loadFromDir.test.ts`) heavily mock dependencies to test branching logic.

**Pattern** (from `cartStore.factory.test.ts`):
```typescript
jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => env }));
jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
```

**Assessment**: Acceptable—factory tests are inherently about selecting implementations based on environment.

### 2. Order/Refund Tests Mock Database and Stripe

Tests in `orders/__tests__/` mock Prisma and Stripe:

```typescript
jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findUnique, update } } }));
jest.doMock("@acme/stripe", () => ({
  stripe: { refunds: { create: refundsCreate }, checkout: { sessions: { retrieve: sessionsRetrieve } } },
}));
```

**Why this is reasonable**:
- Can't make real Stripe refunds in tests
- Database tests would require test database setup
- Tests verify business logic: refund calculations, error handling

**Improvement opportunity**: Add integration tests with test database.

### 3. Global Mutation in Component Tests (Issue)

Several component tests mutate `global.fetch` without always restoring properly:

```typescript
// addToCartButton.test.tsx
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
```

**Files affected**:
- `addToCartButton.test.tsx`
- `productCard.test.tsx`
- `productGrid.test.tsx`
- `cartStore/require-fallback.test.ts`
- `deploy.test.ts`

**Current state**: These tests DO have cleanup, but the pattern is fragile. A test failure before `afterEach` could leave globals polluted.

**Recommendation**: Use `jest.spyOn(global, 'fetch')` instead of direct assignment.

### 4. Component Tests Are Well-Structured

UI component tests use React Testing Library properly:
- Render with context providers (CartProvider, CurrencyProvider)
- Query by role/label (accessible queries)
- Use `waitFor` for async updates
- Test user interactions with `fireEvent`

**Example** (from `productCard.test.tsx`):
```typescript
async function renderCard(sku: SKU) {
  await act(async () => {
    render(
      <CurrencyProvider>
        <CartProvider>
          <ProductCard sku={sku} />
        </CartProvider>
      </CurrencyProvider>
    );
  });
  await screen.findByRole("button", { name: /add to cart/i });
}
```

### 5. Good Edge Case Coverage

Order tests cover important edge cases:
- Order not found → returns null
- Already fully refunded → no Stripe call
- Missing payment_intent → throws descriptive error
- Partial refund calculations

## Recommendations

### High Priority

1. **Replace global.fetch mutation with spyOn**

   Current (fragile):
   ```typescript
   const originalFetch = global.fetch;
   beforeEach(() => { global.fetch = jest.fn(); });
   afterEach(() => { global.fetch = originalFetch; });
   ```

   Better:
   ```typescript
   beforeEach(() => {
     jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) });
   });
   afterEach(() => {
     jest.restoreAllMocks();
   });
   ```

2. **Add database integration tests for orders**

   Create a test database setup for critical paths:
   ```typescript
   describe("OrderRepository integration", () => {
     let testDb: TestDatabase;

     beforeAll(async () => {
       testDb = await TestDatabase.create();
       await testDb.seed(orderFixtures);
     });

     it("creates and retrieves order", async () => {
       const order = await createOrder(testDb.prisma, orderData);
       const retrieved = await findOrder(testDb.prisma, order.id);
       expect(retrieved).toEqual(order);
     });
   });
   ```

### Medium Priority

3. **Consolidate duplicate factory tests**

   `cartStore.factory.test.ts` and similar store factory tests share patterns. Consider a shared test helper:
   ```typescript
   // __tests__/helpers/factoryTestHelpers.ts
   export function testStoreFactory<T>(config: {
     name: string;
     modulePath: string;
     redisEnv: Record<string, string>;
     memoryEnv: Record<string, string>;
   }) { ... }
   ```

4. **Add contract tests for Prisma models**

   Validate that test data matches schema:
   ```typescript
   import { orderSchema } from "../schemas";

   it("order fixture matches schema", () => {
     expect(() => orderSchema.parse(testOrder)).not.toThrow();
   });
   ```

### Low Priority

5. **Document mocking rationale in heavy-mock files**

   Add header comments explaining why mocking is necessary:
   ```typescript
   /**
    * Factory tests mock all store implementations because:
    * 1. We're testing factory selection logic, not store behavior
    * 2. Store implementations have their own tests
    */
   ```

## Checklist Review

| Criterion | Status | Notes |
|-----------|--------|-------|
| Mocks are justified | ✅ | External services, DB, config |
| Tests verify behavior, not implementation | ✅ | Good black-box testing |
| Error paths tested with realistic errors | ✅ | DB errors, missing data, Stripe errors |
| Integration points have integration tests | ⚠️ | No real DB tests |
| Assertions are specific and descriptive | ✅ | Good use of `toMatchObject`, specific expects |

## Files Reviewed

### High Mock Count (needs monitoring)

| File | Mocks | Assessment |
|------|-------|------------|
| `src/__tests__/cartStore.factory.test.ts` | 20 | Factory test, acceptable |
| `src/__tests__/legacy/db.test.ts` | 18 | DB mocking, acceptable |
| `src/repositories/__tests__/settings.server.test.ts` | 17 | Repository test |
| `__tests__/plugins.loadFromDir.test.ts` | 15 | Plugin loading |
| `src/orders/__tests__/refunds.test.ts` | 15 | Order/Stripe integration |

### Isolation Concerns

| File | Issue | Severity |
|------|-------|----------|
| `__tests__/addToCartButton.test.tsx` | global.fetch mutation | Low |
| `__tests__/productCard.test.tsx` | global.fetch mutation | Low |
| `__tests__/productGrid.test.tsx` | global.fetch mutation | Low |
| `__tests__/deploy.test.ts` | global mutation | Low |
| `__tests__/cartStore/require-fallback.test.ts` | global mutation | Low |

### Excellent Examples

| File | Score | Why |
|------|-------|-----|
| `src/pricing/__tests__/*.test.ts` | 5.0/5 | Pure function tests, no mocks |
| `src/cart/__tests__/validation.test.ts` | 4.9/5 | Logic tests, minimal mocks |
| `src/utils/__tests__/*.test.ts` | 5.0/5 | Utility function tests |

## Positive Highlights

1. **Pricing tests** - Pure function tests with comprehensive edge cases
2. **Validation tests** - Good coverage of validation rules
3. **Component tests** - Proper use of React Testing Library
4. **Error handling** - All error paths tested with specific error types
