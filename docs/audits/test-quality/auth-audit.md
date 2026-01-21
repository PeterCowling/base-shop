---
Type: Audit-Report
Status: Complete
Domain: Testing
Package: "@acme/auth"
Created: 2026-01-18
Created-by: Claude Opus 4.5
---

# Test Quality Audit: @acme/auth

## Summary

| Dimension | Score | Target | Status |
|-----------|-------|--------|--------|
| Mock Fidelity | 4.1/5 | 4+ | ✅ Good |
| Implementation Coupling | 5.0/5 | 4+ | ✅ Excellent |
| Assertion Clarity | 4.9/5 | 4+ | ✅ Excellent |
| Test Isolation | 5.0/5 | 4.5+ | ✅ Excellent |
| **Overall** | **4.7/5** | — | Good |

**Files analyzed**: 46 test files
**Flagged files**: 2 (store.test.ts, store.factory.test.ts)

## Key Findings

### 1. Store Tests Have Heavy Mocking (Acceptable)

The session store factory tests mock Redis, config, and store implementations to test factory logic.

**Observed pattern** (from `store.factory.test.ts`):
```typescript
jest.doMock("@acme/config/env/core", () => ({
  coreEnv: env({
    SESSION_STORE: "redis",
    UPSTASH_REDIS_REST_URL: "https://example",
    UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
  }),
}));
jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
jest.doMock("../redisStore", () => ({ RedisSessionStore }));
```

**Why this is acceptable**:
- Factory logic is inherently about selecting implementations based on config
- Real Redis would require test infrastructure
- Tests comprehensively cover all factory paths:
  - Redis with credentials → RedisSessionStore
  - Memory forced → MemorySessionStore
  - Missing credentials → fallback to MemorySessionStore
  - Redis import failure → fallback
  - Custom factory override

### 2. Excellent Test Isolation

All auth tests demonstrate proper cleanup:
```typescript
afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});
```

The `jest.isolateModulesAsync` pattern is used correctly for ESM-compatible module isolation.

### 3. Good Practices Observed

**Comprehensive edge case coverage**:
- Invalid tokens, missing tokens, expired tokens
- CSRF validation scenarios
- Session store fallback chains
- MFA flow edge cases

**Strong typing in tests**:
- Type imports used for test data
- Mock return types explicitly typed

**Parameterized tests**:
```typescript
it.each([
  ["SESSION_STORE set to memory", env({ SESSION_STORE: "memory", ... })],
  ["redis credentials missing", env({})],
])("Env %s -> returns MemorySessionStore", async (_desc, coreEnv) => { ... });
```

### 4. Test Duplication Between Files

`store.test.ts` and `store.factory.test.ts` both test session store creation with overlapping scenarios.

**store.test.ts**:
- Uses `toBeInstanceOf(RedisSessionStore)` assertions
- Imports actual store classes

**store.factory.test.ts**:
- Mocks store implementations completely
- Uses instance equality checks

**Recommendation**: Consolidate or clarify the distinction (unit vs integration style).

## Recommendations

### High Priority

1. **Consolidate store tests**

   Merge or clearly differentiate:
   - `store.test.ts` → "integration-style" (imports real classes)
   - `store.factory.test.ts` → "unit-style" (all mocked)

   Or consolidate into one file with sections.

### Medium Priority

2. **Add real Redis integration test**

   A single test that verifies Redis store behavior:
   ```typescript
   describe.skipIf(!process.env.UPSTASH_REDIS_REST_URL)("RedisSessionStore integration", () => {
     it("sets and gets session", async () => {
       const store = new RedisSessionStore(realClient, 3600);
       await store.set("test-session", { user: "test" });
       const session = await store.get("test-session");
       expect(session).toEqual({ user: "test" });
       await store.delete("test-session");
     });
   });
   ```

### Low Priority

3. **Reduce mock count in factory tests**

   Consider using a test helper that sets up common mocks:
   ```typescript
   function withStoreMocks(overrides: Partial<StoreMocks>) {
     return jest.isolateModulesAsync(async () => {
       const mocks = { ...defaultMocks, ...overrides };
       jest.doMock("@acme/config/env/core", () => ({ coreEnv: mocks.env }));
       // ...
       return import("../store");
     });
   }
   ```

## Checklist Review

| Criterion | Status | Notes |
|-----------|--------|-------|
| Mocks are justified | ✅ | External services (Redis), config |
| Tests verify behavior, not implementation | ✅ | Tests verify observable outcomes |
| Error paths tested with realistic errors | ✅ | Import failures, missing creds |
| Integration points have integration tests | ⚠️ | No real Redis tests |
| Assertions are specific and descriptive | ✅ | Good use of `toBeInstanceOf`, equality |

## Files Reviewed

| File | Score | Issues |
|------|-------|--------|
| `__tests__/store.test.ts` | 3.5/5 | 12 mocks, but good assertions |
| `src/__tests__/store.factory.test.ts` | 3.2/5 | 20 mocks, comprehensive coverage |
| `__tests__/oidc.flow.test.ts` | 4.1/5 | 5 mocks, good flow testing |
| `__tests__/permissions.test.ts` | 5.0/5 | No mocks, pure function tests |
| `__tests__/rbac.test.ts` | 4.7/5 | 1 mock, good domain tests |
| Other 41 files | 4.8+/5 | Good to excellent quality |

## Positive Highlights

1. **permissions.test.ts** - Zero mocks, tests pure permission checking logic
2. **rbac.test.ts** - Minimal mocking, tests role-based access control behavior
3. **CSRF tests** - Comprehensive coverage of token validation scenarios
4. **MFA tests** - Good coverage of multi-factor authentication flows
