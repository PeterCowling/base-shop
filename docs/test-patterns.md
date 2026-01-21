---
Type: Guide
Status: Active
Domain: Testing
Last-reviewed: 2026-01-18
Created: 2026-01-18
Created-by: Claude Opus 4.5
---

# Test Patterns Guide

This document describes approved testing patterns and anti-patterns for the base-shop monorepo. Follow these patterns to write tests that accurately reflect production behavior while remaining efficient to run.

## Philosophy

Tests should:
1. **Reflect reality** — Exercise actual code paths, not mock approximations
2. **Test behavior, not implementation** — Survive refactoring if behavior stays the same
3. **Provide clear signal** — Failures indicate real problems
4. **Run fast enough to run often** — Balance thoroughness with developer experience

## Quality Dimensions

We measure test quality on four dimensions (see [test-quality-audit-plan.md](plans/test-quality-audit-plan.md)):

| Dimension | Target | What It Measures |
|-----------|--------|------------------|
| Mock Fidelity | 3.5+/5 | How closely test execution matches production |
| Implementation Coupling | 4+/5 | Whether tests break on refactoring |
| Assertion Clarity | 4+/5 | How quickly you understand failures |
| Test Isolation | 4.5+/5 | Whether tests can run in any order |

Run `pnpm analyze-test-quality` to check scores.

---

## Approved Patterns

### 1. Environment Isolation with `withEnv()`

**When to use**: Testing code that reads from `process.env` or config modules.

**Pattern** (from `@acme/config`):
```typescript
import { withEnv } from "../test/utils/withEnv";

it("loads production config", async () => {
  await withEnv(
    { NODE_ENV: "production", API_KEY: "real-key" },
    async () => {
      const { loadConfig } = await import("../config");
      const config = loadConfig();
      expect(config.apiKey).toBe("real-key");
    }
  );
});
```

**Why**: Proper cleanup is guaranteed even if the test fails. Avoids polluting other tests.

**Location**: `packages/config/test/utils/withEnv.ts`

---

### 2. Module Isolation with `jest.isolateModulesAsync()`

**When to use**: Testing module-level initialization or singleton behavior.

**Pattern** (from `@acme/auth`):
```typescript
it("creates Redis store when credentials exist", async () => {
  await jest.isolateModulesAsync(async () => {
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { UPSTASH_REDIS_REST_URL: "https://...", UPSTASH_REDIS_REST_TOKEN: "token" },
    }));

    const { createSessionStore } = await import("../store");
    const store = await createSessionStore();

    expect(store).toBeInstanceOf(RedisSessionStore);
  });
});
```

**Why**: Each test gets a fresh module cache. Essential for ESM modules with top-level initialization.

---

### 3. React Component Testing with Providers

**When to use**: Testing components that require context providers.

**Pattern** (from `@acme/platform-core`):
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { CartProvider } from "../contexts/CartContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";

async function renderWithProviders(ui: React.ReactElement) {
  const result = render(
    <CurrencyProvider>
      <CartProvider>
        {ui}
      </CartProvider>
    </CurrencyProvider>
  );
  // Wait for initial data fetch
  await screen.findByRole("button", { name: /add to cart/i });
  return result;
}

it("adds item to cart", async () => {
  await renderWithProviders(<ProductCard sku={testSku} />);

  fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

  await waitFor(() => {
    expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
  });
});
```

**Why**: Tests real provider behavior. Queries by role are accessible and resilient.

---

### 4. Factory Tests with Exhaustive Branches

**When to use**: Testing factory functions that select implementations based on config.

**Pattern** (from `@acme/auth`):
```typescript
describe("createSessionStore factory", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it.each([
    ["Redis with credentials", { SESSION_STORE: "redis", UPSTASH_REDIS_REST_URL: "https://...", UPSTASH_REDIS_REST_TOKEN: "token" }, "redis"],
    ["Memory forced despite credentials", { SESSION_STORE: "memory", UPSTASH_REDIS_REST_URL: "https://..." }, "memory"],
    ["Credentials missing", {}, "memory"],
    ["Redis import fails", { UPSTASH_REDIS_REST_URL: "https://...", UPSTASH_REDIS_REST_TOKEN: "token", _simulateImportError: true }, "memory"],
  ])("%s -> %s store", async (_desc, env, expectedBackend) => {
    // ... test implementation
  });
});
```

**Why**: Parameterized tests ensure all branches are covered. Clear what each case tests.

---

### 5. Mocking External APIs with `jest.spyOn`

**When to use**: Mocking `fetch`, `console`, or other globals.

**Pattern**:
```typescript
// GOOD: Use spyOn for globals
beforeEach(() => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ data: "test" }),
  } as Response);
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

**Why**: `jest.restoreAllMocks()` guarantees cleanup. Direct assignment (`global.fetch = jest.fn()`) can leak if test fails before cleanup.

---

### 6. Contract Tests for External API Responses

**When to use**: Validating that your code handles real API response shapes correctly.

**Pattern**:
```typescript
// __fixtures__/stripe-responses.ts
export const stripeFixtures = {
  checkoutSession: {
    complete: { id: "cs_test_...", payment_status: "paid", ... },
    pending: { id: "cs_test_...", payment_status: "unpaid", ... },
  },
};

// stripe-contracts.test.ts
import { stripeFixtures } from "./__fixtures__/stripe-responses";
import { parseCheckoutSession } from "../parseCheckoutSession";

describe("Stripe response contracts", () => {
  it("parses complete checkout session", () => {
    const result = parseCheckoutSession(stripeFixtures.checkoutSession.complete);

    expect(result).toMatchObject({
      paymentStatus: "paid",
      sessionId: expect.stringMatching(/^cs_/),
    });
  });

  it("handles pending payment", () => {
    const result = parseCheckoutSession(stripeFixtures.checkoutSession.pending);

    expect(result.paymentStatus).toBe("pending");
  });
});
```

**Why**: Tests real parsing logic against realistic data. Catches schema changes.

---

### 7. Specific Assertions with `toMatchObject`

**When to use**: Asserting on objects where you care about specific fields.

**Pattern**:
```typescript
// GOOD: Specific, partial matching
expect(order).toMatchObject({
  status: "confirmed",
  items: expect.arrayContaining([
    expect.objectContaining({ sku: "PROD-1", qty: 2 }),
  ]),
  total: expect.any(Number),
});

// GOOD: Regex for generated values
expect(order.trackingNumber).toMatch(/^TRK-\d{10}$/);
```

**Why**: Test only what matters. Survives adding new fields.

---

## Anti-Patterns (Avoid)

### 1. Over-Mocking Internal Dependencies

**Bad** (tests mock behavior, not code):
```typescript
jest.mock("../validateUser");
import { validateUser } from "../validateUser";

it("calls validateUser", () => {
  (validateUser as jest.Mock).mockReturnValue(true);
  const result = createSession({ user: mockUser });
  expect(validateUser).toHaveBeenCalled(); // Tests wiring, not behavior
});
```

**Good** (mock external only, test real logic):
```typescript
jest.mock("../services/database"); // External only

it("rejects invalid users", async () => {
  const result = await createSession({ user: { email: "" } });
  expect(result.error).toBe("Invalid email"); // Tests real validation
});
```

**When mocking IS appropriate**:
- External APIs (Stripe, Redis, databases)
- Time (`Date.now`, timers)
- Randomness (`Math.random`, `crypto.randomUUID`)
- File system (when testing business logic, not I/O)

---

### 2. Testing Implementation Details

**Bad** (breaks when refactored):
```typescript
it("uses memoization", () => {
  const spy = jest.spyOn(component, "_memoizedCalculate");
  render(<Calculator value={5} />);
  render(<Calculator value={5} />);
  expect(spy).toHaveBeenCalledTimes(1); // Tests HOW, not WHAT
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

---

### 3. Weak Assertions

**Bad** (no signal on failure):
```typescript
it("works", () => {
  const result = processOrder(order);
  expect(result).toBeTruthy();
});

it("returns something", () => {
  const user = getUser("123");
  expect(user).toBeDefined();
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

it("returns user with email and role", () => {
  const user = getUser("123");
  expect(user).toEqual({
    id: "123",
    email: "test@example.com",
    role: "customer",
  });
});
```

---

### 4. Direct Global Mutation

**Bad** (can leak if test fails):
```typescript
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  global.fetch = originalFetch; // Not called if test throws!
});
```

**Good** (guaranteed cleanup):
```typescript
beforeEach(() => {
  jest.spyOn(global, "fetch").mockResolvedValue({ ok: true } as Response);
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

---

### 5. Hidden Test Dependencies

**Bad** (relies on implicit state):
```typescript
// test1 sets globalConfig
it("sets config", () => {
  setGlobalConfig({ theme: "dark" });
});

// test2 depends on test1 running first
it("uses config", () => {
  const prefs = getUserPreferences();
  expect(prefs.theme).toBe("dark"); // Fails when run alone!
});
```

**Good** (explicit setup):
```typescript
it("uses configured theme", () => {
  const config = createTestConfig({ theme: "dark" });
  const prefs = getUserPreferences({ config });
  expect(prefs.theme).toBe("dark");
});
```

---

### 6. Snapshot Overuse

**Bad** (low signal, easy to blindly update):
```typescript
it("renders correctly", () => {
  const { container } = render(<ComplexComponent {...props} />);
  expect(container).toMatchSnapshot();
});
```

**Better** (snapshot specific parts):
```typescript
it("renders user info section", () => {
  render(<ComplexComponent user={testUser} />);
  expect(screen.getByTestId("user-info")).toMatchInlineSnapshot(`
    <div data-testid="user-info">
      <span>John Doe</span>
      <span>john@example.com</span>
    </div>
  `);
});
```

**Best** (explicit assertions):
```typescript
it("displays user name and email", () => {
  render(<ComplexComponent user={testUser} />);
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("john@example.com")).toBeInTheDocument();
});
```

---

## Decision Tree: Mock vs Real

```
Should I mock this dependency?
│
├─ Is it an EXTERNAL service? (Stripe, Redis, DB, HTTP)
│  ├─ Yes → Mock it (can't/shouldn't call in tests)
│  │        Consider: contract tests with fixtures
│  └─ No → Continue
│
├─ Is it TIME or RANDOMNESS?
│  ├─ Yes → Mock it (need deterministic tests)
│  └─ No → Continue
│
├─ Is it another module in THIS package?
│  ├─ Yes → Usually DON'T mock
│  │        Exception: testing factory selection logic
│  └─ No → Continue
│
├─ Is it a shared package (@acme/*)?
│  ├─ Yes → Prefer real, mock only external calls within it
│  └─ No → Continue
│
└─ Default: Use the real thing
```

---

## Package-Specific Notes

### @acme/stripe
- Mock the Stripe SDK constructor
- Add contract tests for response parsing (see [stripe-audit.md](audits/test-quality/stripe-audit.md))
- Integration tests require `STRIPE_TEST_KEY`

### @acme/auth
- Mock Redis client, test store implementations separately
- Use `jest.isolateModulesAsync` for session store factory tests
- See [auth-audit.md](audits/test-quality/auth-audit.md)

### @acme/platform-core
- Use `jest.spyOn(global, 'fetch')` instead of direct assignment
- Wrap components in required providers
- See [platform-core-audit.md](audits/test-quality/platform-core-audit.md)

### @acme/config
- Use `withEnv()` helper for all env-dependent tests
- Test schema validation with invalid inputs

---

## Related Documents

- [testing-policy.md](testing-policy.md) — Resource management and execution rules
- [test-coverage-policy.md](test-coverage-policy.md) — Coverage tier requirements
- [test-quality-audit-plan.md](plans/test-quality-audit-plan.md) — Audit process and findings
- [audits/test-quality/](audits/test-quality/) — Per-package audit reports
