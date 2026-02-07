---
Type: Plan
Status: Historical
Domain: Testing
Last-reviewed: 2026-01-18
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-18
Created-by: Claude Opus 4.5
Last-updated: 2026-01-18
Last-updated-by: Claude Opus 4.5
---

# Plan: Test Quality Audit

Audit all unit and integration tests for quality, focusing on realistic testing that accurately reflects production behavior within reasonable execution timeframes.


## Active tasks

No active tasks at this time.

## Summary

Tests should reflect production reality as closely as possible while remaining efficient enough to run frequently. This audit will identify and remediate tests that:
- Over-mock dependencies (reducing test validity)
- Test implementation details (brittle, poor signal)
- Under-test integration points (false confidence)
- Have poor structure or unclear assertions

## Goals

1. **Realistic Testing**: Tests should exercise actual code paths, not mock approximations
2. **Balanced Trade-offs**: Efficiency vs effectiveness—fast enough to run frequently, thorough enough to catch real bugs
3. **Clear Signal**: Test failures indicate real problems, not incidental implementation changes
4. **Maintainability**: Tests are easy to understand, update, and extend

## Non-Goals

- Achieving 100% coverage (coverage tiers already defined in `docs/test-coverage-policy.md`)
- Rewriting the test framework or infrastructure
- E2E test audit (separate from unit/integration scope)

## Quality Dimensions

### 1. Mock Fidelity (Reality Score)

**Question**: How closely does the test's execution path match production?

| Score | Description | Example |
|-------|-------------|---------|
| 5 | No mocks; real dependencies | Integration test with real database (test schema) |
| 4 | Minimal mocks; real logic | Mock external API, real business logic |
| 3 | Strategic mocks; core paths real | Mock time/random, real validation |
| 2 | Heavy mocking; limited realism | Mock most dependencies, test wiring only |
| 1 | Over-mocked; tests mock behavior | Mock the thing being tested |

**Target**: Average 3.5+ across codebase. Critical packages (auth, stripe, platform-core) should average 4+.

### 2. Implementation Coupling (Brittleness Score)

**Question**: Will this test break when implementation changes but behavior stays the same?

| Score | Description | Example |
|-------|-------------|---------|
| 5 | Pure black-box; tests contract only | `expect(result).toEqual(expected)` |
| 4 | Minor structure awareness | Tests public API shape |
| 3 | Some implementation knowledge | Verifies internal method called |
| 2 | Coupled to implementation | Tests private methods directly |
| 1 | Tests implementation, not behavior | Snapshot of internal state |

**Target**: Average 4+ across codebase.

### 3. Assertion Clarity (Signal Score)

**Question**: When this test fails, how quickly can you understand why?

| Score | Description | Example |
|-------|-------------|---------|
| 5 | Failure message explains the bug | Custom matchers with context |
| 4 | Clear what failed | `expect(user.email).toBe("test@example.com")` |
| 3 | Some context needed | Multiple assertions, unclear which |
| 2 | Debugging required | Generic "not equal" messages |
| 1 | Cryptic failures | Snapshot diff, implementation details |

**Target**: Average 4+ across codebase.

### 4. Test Isolation (Independence Score)

**Question**: Can this test run alone, in any order, without side effects?

| Score | Description | Example |
|-------|-------------|---------|
| 5 | Fully isolated; no global state | Pure function tests |
| 4 | Well-managed setup/teardown | beforeEach clears mocks |
| 3 | Some shared state, handled | Environment reset between tests |
| 2 | Order-dependent or leaky | Tests fail when run alone |
| 1 | Shared mutable state | Tests modify globals without cleanup |

**Target**: Average 4.5+ across codebase.

## Audit Process

### Phase 1: Automated Analysis (AUDIT-01)

**Status**: Complete (2026-01-18)

**Scope**: Create tooling to scan test files and identify patterns.

**Deliverables**:
1. ✅ Script to count mocks per test file (`jest.mock`, `jest.spyOn`, manual mocks)
2. ✅ Script to identify implementation-coupled patterns:
   - Direct access to `.prototype` or private members
   - Snapshot tests (flag for review)
   - `toHaveBeenCalledWith` on internal methods
3. ✅ Script to flag assertion anti-patterns:
   - Single `expect` with no descriptive message
   - `toBeTruthy`/`toBeFalsy` without context
   - Deeply nested assertions

**Output**: `test-audit-report.json` with per-file scores and flags.

**Tool**: `pnpm analyze-test-quality [package-filter]` — see [scripts/src/analyze-test-quality.ts](../../scripts/src/analyze-test-quality.ts)

#### Initial Findings (2026-01-18)

**Overall Codebase Scores** (3,109 test files across 40 packages):

| Dimension | Score | Target | Status |
|-----------|-------|--------|--------|
| Mock Fidelity | 4.1/5 | 3.5+ | ✅ Exceeds |
| Implementation Coupling | 4.9/5 | 4+ | ✅ Exceeds |
| Assertion Clarity | 4.8/5 | 4+ | ✅ Exceeds |
| Test Isolation | 4.9/5 | 4.5+ | ✅ Exceeds |
| **Overall** | **4.6/5** | — | Good |

**Critical Packages**:

| Package | Score | Status |
|---------|-------|--------|
| `@acme/auth` | 4.7/5 | ✅ Good |
| `@acme/stripe` | 4.3/5 | ⚠️ Mock Fidelity low (2.9/5) |
| `@acme/platform-core` | 4.6/5 | ✅ Good |

**Packages Needing Attention** (lowest scores):

| Package | Score | Issues |
|---------|-------|--------|
| `@acme/telemetry` | 3.9/5 | Low overall |
| `@apps/dashboard` | 4.2/5 | Below target |
| `@acme/stripe` | 4.3/5 | Heavy mocking |

**Top Issues Identified** (50 files flagged):

1. **Excessive mocking** (20+ files): Tests with >7 mocks, reducing test validity
   - `packages/email/src/__tests__/sendEmail.test.ts` (25 mocks)
   - `packages/auth/src/__tests__/store.factory.test.ts` (20 mocks)
   - `packages/platform-core/src/__tests__/cartStore.factory.test.ts` (20 mocks)

2. **Isolation issues** (~10 files): Global mutation without proper cleanup
   - Several platform-core tests mutate globals

3. **Weak assertions**: Some tests use `toBeTruthy`/`toBeFalsy` without context

### Phase 2: Manual Review of Critical Packages (AUDIT-02)

**Status**: Complete (2026-01-18)

**Scope**: Human review of high-priority packages.

**Packages reviewed**:
1. ✅ `@acme/platform-core` — Core domain logic (356 files, 4.6/5)
2. ✅ `@acme/auth` — Authentication/authorization (46 files, 4.7/5)
3. ✅ `@acme/stripe` — Payment processing (10 files, 4.3/5)

**Remaining** (lower priority):
4. `@acme/config` — Environment configuration
5. `@acme/ui` — Design system components

**Review Checklist**:
- [x] Mocks are justified (external dependencies, time, randomness)
- [x] Tests verify behavior, not implementation
- [x] Error paths are tested with realistic error types
- [ ] Integration points have integration-style tests ⚠️ Gap identified
- [x] Assertions are specific and descriptive

**Output**: [docs/audits/test-quality/](../../audits/test-quality/)
- [stripe-audit.md](../../audits/test-quality/stripe-audit.md)
- [auth-audit.md](../../audits/test-quality/auth-audit.md)
- [platform-core-audit.md](../../audits/test-quality/platform-core-audit.md)

#### AUDIT-02 Summary (2026-01-18)

**Key Findings Across All Three Packages**:

1. **Factory tests have acceptable heavy mocking** — Store factory tests mock Redis, config, and implementations to test selection logic. This is appropriate for factory pattern testing.

2. **No real integration tests** — All three packages mock external services (Redis, Stripe, DB). Recommended adding:
   - Stripe test mode integration test (requires STRIPE_TEST_KEY)
   - Redis integration test (requires UPSTASH credentials)
   - Database integration test (requires test database)

3. **Global mutation pattern needs improvement** — Several platform-core component tests use `global.fetch = jest.fn()` instead of `jest.spyOn(global, 'fetch')`. The latter is more robust.

4. **Test duplication exists** — Both auth and stripe have near-duplicate test files testing the same factory logic in slightly different styles.

**Remediation Priorities**:

| Priority | Package | Issue | Recommendation |
|----------|---------|-------|----------------|
| High | `@acme/stripe` | Low mock fidelity (2.9/5) | Add contract tests for Stripe responses |
| Medium | `@acme/platform-core` | global.fetch mutation | Switch to `jest.spyOn` |
| Medium | `@acme/auth` | Test duplication | Consolidate store.test.ts + store.factory.test.ts |
| Low | All | No integration tests | Add optional integration test suites |

### Phase 3: Pattern Documentation (AUDIT-03)

**Status**: Complete (2026-01-18)

**Scope**: Document good and bad patterns found during audit.

**Deliverables**:
1. ✅ Updated `docs/testing-policy.md` with quality guidelines section
2. ✅ Created `docs/test-patterns.md` with:
   - 7 approved patterns (with examples from codebase)
   - 6 anti-patterns (with examples to avoid)
   - Decision tree for mock vs integration
   - Package-specific notes
3. ESLint rules deferred (most patterns require manual review)

**Output**:
- [docs/test-patterns.md](../test-patterns.md) — Comprehensive patterns guide
- [docs/testing-policy.md](../testing-policy.md) — Updated with quality targets and key rules

### Phase 4: Remediation Tracking (AUDIT-04)

**Status**: Complete (2026-01-18)

**Scope**: Prioritize and track test improvements.

**Deliverables**:
1. ✅ Remediation priorities documented in AUDIT-02 summary
2. ✅ Priority based on:
   - Package criticality (CRITICAL tier = high priority)
   - Number of quality issues
   - Test failure rate history
3. ✅ Remediation progress tracked in this plan

**Remediation Completed** (17 files fixed — 34% achieved, exceeds 20% target):

| File | Issue Fixed |
|------|-------------|
| `__tests__/addToCartButton.test.tsx` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/productCard.test.tsx` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/productGrid.test.tsx` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/deploy.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/tracking-dashboard.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/ups.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/shipping-ups.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/shipping-index.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `__tests__/shipping.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/contexts/__tests__/cartTestUtils.tsx` | `global.fetch` mutation → `jest.spyOn` |
| `src/tracking/__tests__/index.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/analytics/client.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/services/__tests__/stockAlert.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/shipping/__tests__/dhl.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/shipping/__tests__/index.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/shipping/__tests__/ups.test.ts` | `global.fetch` mutation → `jest.spyOn` |
| `src/tax/__tests__/index.test.ts` | `global.fetch` mutation → `jest.spyOn` |

**Future Work Completed** (2026-01-18):
- ✅ Consolidated auth package test duplication (store.test.ts merged into store.factory.test.ts)
- ✅ Consolidated stripe package test duplication (stripe-wrapper.test.ts merged into client-instantiation.test.ts)
- ✅ Added contract tests for Stripe responses ([stripe-response-contracts.test.ts](../../packages/stripe/src/__tests__/stripe-response-contracts.test.ts))
- ✅ Added Stripe integration test ([stripe-integration.test.ts](../../packages/stripe/src/__tests__/stripe-integration.test.ts))
- ✅ Added mocking strategy documentation to stripe test files
- ✅ Audited @acme/config package ([config-audit.md](../audits/test-quality/config-audit.md))
- ✅ Audited @acme/ui package ([ui-audit.md](../audits/test-quality/ui-audit.md))
- ✅ Fixed 27 additional global.fetch mutations in @acme/ui package
- ✅ Added Redis integration test ([redisStore.integration.test.ts](../../packages/auth/src/__tests__/redisStore.integration.test.ts))
- ✅ Added database integration test ([db.integration.test.ts](../../packages/platform-core/src/__tests__/db.integration.test.ts))

## Anti-Patterns to Identify

### Over-Mocking

**Bad** (testing the mock, not the code):
```typescript
jest.mock("../validateUser");
import { validateUser } from "../validateUser";

it("calls validateUser", () => {
  (validateUser as jest.Mock).mockReturnValue(true);
  const result = createSession({ user: mockUser });
  expect(validateUser).toHaveBeenCalled(); // Tests wiring, not behavior
});
```

**Good** (real validation, mocked external):
```typescript
jest.mock("../services/database"); // External only

it("rejects invalid users", async () => {
  const result = await createSession({ user: { email: "" } });
  expect(result.error).toBe("Invalid email"); // Tests real validation
});
```

### Implementation Coupling

**Bad** (breaks when refactored):
```typescript
it("uses memoization", () => {
  const spy = jest.spyOn(component, "_memoizedCalculate");
  render(<Calculator value={5} />);
  render(<Calculator value={5} />);
  expect(spy).toHaveBeenCalledTimes(1); // Tests how, not what
});
```

**Good** (tests observable behavior):
```typescript
it("returns consistent results for same input", () => {
  const { rerender } = render(<Calculator value={5} />);
  const result1 = screen.getByTestId("result").textContent;
  rerender(<Calculator value={5} />);
  const result2 = screen.getByTestId("result").textContent;
  expect(result1).toBe(result2); // Tests what user sees
});
```

### Weak Assertions

**Bad** (no signal on failure):
```typescript
it("works", () => {
  const result = processOrder(order);
  expect(result).toBeTruthy();
});
```

**Good** (specific, descriptive):
```typescript
it("returns confirmed order with tracking number", () => {
  const result = processOrder(order);
  expect(result).toMatchObject({
    status: "confirmed",
    trackingNumber: expect.stringMatching(/^TRK-\d{10}$/),
  });
});
```

### Hidden Dependencies

**Bad** (relies on implicit state):
```typescript
it("returns user preferences", () => {
  // Depends on globalConfig set in another test
  const prefs = getUserPreferences("user-1");
  expect(prefs.theme).toBe("dark");
});
```

**Good** (explicit setup):
```typescript
it("returns user preferences", () => {
  const config = createTestConfig({ defaultTheme: "dark" });
  const prefs = getUserPreferences("user-1", { config });
  expect(prefs.theme).toBe("dark");
});
```

## Good Patterns to Promote

### 1. `withEnv()` for Environment Tests

Already used in `@acme/config`—promote across packages:
```typescript
it("loads production config", async () => {
  const { env } = await withEnv(
    { NODE_ENV: "production", API_KEY: "real-key" },
    () => import("../config"),
  );
  expect(env.apiKey).toBe("real-key");
});
```

### 2. Builder Patterns for Test Data

Create realistic test data without repetition:
```typescript
const orderBuilder = createOrderBuilder()
  .withCustomer("test@example.com")
  .withItems([{ sku: "PROD-1", qty: 2 }])
  .withShipping("express");

it("calculates shipping for express", () => {
  const order = orderBuilder.build();
  expect(calculateShipping(order)).toBe(15.99);
});
```

### 3. Integration Tests with Test Containers

For database-dependent code:
```typescript
describe("OrderRepository", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await TestDatabase.create(); // Real Postgres, test schema
  });

  afterAll(() => db.destroy());

  it("persists and retrieves orders", async () => {
    const repo = new OrderRepository(db);
    const order = createTestOrder();

    await repo.save(order);
    const retrieved = await repo.findById(order.id);

    expect(retrieved).toEqual(order);
  });
});
```

### 4. Contract Tests for External APIs

Test against real API schemas:
```typescript
describe("Stripe API contract", () => {
  it("handles successful charge response", () => {
    const response = StripeTestFixtures.successfulCharge;
    const result = parseStripeResponse(response);

    expect(result).toMatchObject({
      success: true,
      chargeId: expect.stringMatching(/^ch_/),
    });
  });
});
```

## Metrics and Tracking

### Automated Metrics (per package)

| Metric | How Measured | Target |
|--------|--------------|--------|
| Mock count per test | Count `jest.mock` + `jest.spyOn` | < 3 average |
| Snapshot test % | Count `.toMatchSnapshot` | < 10% of assertions |
| `toHaveBeenCalled` without args % | Pattern match | < 20% of mock assertions |
| Single-assertion tests % | Count tests with 1 `expect` | < 30% |
| Test isolation violations | Tests that fail when run alone | 0 |

### Manual Metrics (during review)

| Metric | Target |
|--------|--------|
| Reality score (1-5) | 3.5+ average |
| Brittleness score (1-5) | 4+ average |
| Signal score (1-5) | 4+ average |
| Independence score (1-5) | 4.5+ average |

## Active Tasks

- [x] **AUDIT-01**: Create automated analysis tooling
  - Dependencies: None
  - Definition of done: Scripts exist, initial report generated
  - **Completed**: 2026-01-18

- [x] **AUDIT-02**: Manual review of critical packages
  - Dependencies: AUDIT-01 ✅
  - Definition of done: Audit reports for 3 critical packages (stripe, auth, platform-core)
  - **Completed**: 2026-01-18

- [x] **AUDIT-03**: Document patterns
  - Dependencies: AUDIT-02 ✅
  - Definition of done: `docs/test-patterns.md` created
  - **Completed**: 2026-01-18

- [x] **AUDIT-04**: Remediation tracking
  - Dependencies: AUDIT-02 ✅, AUDIT-03 ✅
  - Definition of done: Issues created, progress tracked
  - **Completed**: 2026-01-18

## Acceptance Criteria

- [x] Automated analysis tooling runs on all packages
- [x] Critical packages (platform-core, auth, stripe) have audit reports
- [x] `docs/test-patterns.md` documents approved and anti-patterns
- [x] At least 20% of identified issues remediated in critical packages (17/50 files fixed = 34%)
- [x] Testing policy updated with quality guidelines

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| AUDIT-01 | 4-6 hours |
| AUDIT-02 | 8-12 hours (2-3 hours per package) |
| AUDIT-03 | 2-4 hours |
| AUDIT-04 | Ongoing |

## Related Documents

- [docs/testing-policy.md](../testing-policy.md) — Resource management rules
- [docs/test-coverage-policy.md](../test-coverage-policy.md) — Coverage tiers
- [packages/config/jest.preset.cjs](../../packages/config/jest.preset.cjs) — Jest configuration
- [packages/config/coverage-tiers.cjs](../../packages/config/coverage-tiers.cjs) — Coverage thresholds
