---
Type: Audit-Report
Status: Complete
Domain: Testing
Package: "@acme/stripe"
Created: 2026-01-18
Created-by: Claude Opus 4.5
Last-updated: 2026-01-18
Last-updated-by: Claude Opus 4.5
---

# Test Quality Audit: @acme/stripe

## Summary

| Dimension | Score | Target | Status |
|-----------|-------|--------|--------|
| Mock Fidelity | 2.9/5 | 4+ | ⚠️ Below target |
| Implementation Coupling | 4.8/5 | 4+ | ✅ Good |
| Assertion Clarity | 4.8/5 | 4+ | ✅ Good |
| Test Isolation | 5.0/5 | 4.5+ | ✅ Excellent |
| **Overall** | **4.3/5** | — | Needs attention |

**Files analyzed**: 10 test files
**Flagged files**: 2 (client-instantiation.test.ts, stripe-wrapper.test.ts)

## Key Findings

### 1. Heavy Mocking (Primary Issue)

Both flagged test files mock the Stripe constructor, config module, and HTTP client to test initialization logic.

**Observed pattern** (from `client-instantiation.test.ts`):
```typescript
jest.doMock("stripe", () => ({ __esModule: true, default: StripeMock }));
jest.doMock("@acme/config/env/core", () => ({
  coreEnv: { STRIPE_SECRET_KEY: "sk_test_123" },
}));
```

**Why this is problematic**:
- Tests verify that mocks were called correctly, not that Stripe integration works
- Real Stripe SDK behavior isn't exercised
- Constructor changes in the Stripe SDK won't be caught

**Mitigating factors**:
- Mocking is appropriate for external payment APIs (can't make real charges in tests)
- Tests do verify important behaviors: key validation, caching, mock mode toggle
- Assertions are specific (`toHaveBeenCalledWith` with exact args)

### 2. Test Duplication

`store.test.ts` and `store.factory.test.ts` in the auth package (not stripe) show significant overlap. The stripe package has similar duplication between `client-instantiation.test.ts` and `stripe-wrapper.test.ts`.

Both files test:
- Missing STRIPE_SECRET_KEY error
- Valid key passes to constructor
- Instance caching
- Mock mode toggle

**Recommendation**: Consolidate into a single test file with clear sections.

### 3. Good Practices Observed

**Test isolation** (excellent):
- `process.env` saved and restored in `afterEach`
- `jest.resetModules()` between tests
- `jest.isolateModulesAsync` for ESM module isolation

**Assertion clarity** (good):
- Specific `expect(StripeCtor).toHaveBeenCalledWith('sk_test_123', expect.any(Object))`
- Tests verify both positive and negative cases
- Error messages checked with regex patterns

## Recommendations

### High Priority

1. **Add contract tests for Stripe responses** ✅ COMPLETED (2026-01-18)

   Created fixture-based tests that validate response parsing:
   - [stripe-response-contracts.test.ts](../../../packages/stripe/src/__tests__/stripe-response-contracts.test.ts)
   - [__fixtures__/stripe-responses.ts](../../../packages/stripe/src/__tests__/__fixtures__/stripe-responses.ts)

   Covers: checkout sessions, payment intents, refunds, webhook events, customers
   Tests: 29 contract tests validating field extraction and edge cases

2. **Consolidate duplicate tests** ✅ COMPLETED (2026-01-18)

   Merged unique tests from `stripe-wrapper.test.ts` into `client-instantiation.test.ts`:
   - Added: invalid key format test, method calling test, mock interface test
   - Deleted: `stripe-wrapper.test.ts`

### Medium Priority

3. **Add integration test with Stripe test mode**

   A single integration test that actually calls Stripe's test API would catch SDK version incompatibilities:
   ```typescript
   // stripe-integration.test.ts (run in CI with STRIPE_TEST_KEY)
   it.skipIf(!process.env.STRIPE_TEST_KEY)("creates and retrieves a customer", async () => {
     const customer = await stripe.customers.create({ email: "test@example.com" });
     expect(customer.id).toMatch(/^cus_/);
     await stripe.customers.del(customer.id);
   });
   ```

### Low Priority

4. **Document why mocking is necessary**

   Add a comment at the top of test files explaining the mocking strategy:
   ```typescript
   /**
    * These tests mock the Stripe SDK because:
    * 1. Real API calls require secrets and incur costs
    * 2. We need deterministic responses for edge cases
    *
    * For integration testing, see stripe-integration.test.ts (requires STRIPE_TEST_KEY)
    */
   ```

## Checklist Review

| Criterion | Status | Notes |
|-----------|--------|-------|
| Mocks are justified | ✅ | External payment API |
| Tests verify behavior, not implementation | ⚠️ | Constructor call verification is implementation-coupled |
| Error paths tested with realistic errors | ✅ | Invalid key, missing key tested |
| Integration points have integration tests | ❌ | No real Stripe API tests |
| Assertions are specific and descriptive | ✅ | Good use of `toHaveBeenCalledWith` |

## Files Reviewed

| File | Score | Issues |
|------|-------|--------|
| `src/__tests__/client-instantiation.test.ts` | 2.5/5 | 11 mocks, tests constructor wiring |
| `tests/__tests__/stripe-wrapper.test.ts` | 2.8/5 | 9 mocks, duplicates client-instantiation tests |
| Other 8 files | 4.5+/5 | Good quality |
