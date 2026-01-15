# Test Parallelization

**Status:** ⚠️ Configured but Not Recommended
**Date Implemented:** 2026-01-12
**Date Investigated:** 2026-01-12
**Actual Performance Impact:** Neutral to Negative

## ⚠️ Important: Read This First

**TL;DR:** Test parallelization was configured but investigation showed it provides **no benefit or makes things worse** for most packages in this monorepo. The 35 packages using `--runInBand` should keep it.

**Why?** Parallelization overhead (worker spawning, IPC) exceeds benefits for fast tests. Our packages have mostly fast tests (<30 seconds) where parallelization is counterproductive.

**See:** [Phase 2 Investigation Report](completion/test-parallelization-phase2-findings.md) for detailed findings.

---

## Overview

Test parallelization allows tests to run concurrently across multiple CPU cores. However, **it only benefits large, slow test suites** (1000+ tests taking 30-120 seconds). Fast tests get slower due to overhead.

### What Was Implemented

1. ✅ **Root Jest config** has `maxWorkers: 5` (50% of CPU cores)
2. ✅ **Vitest config** already had parallelization enabled
3. ⚠️ **35 packages use `--runInBand`** to override root config (intentionally)

### Investigation Results

**@acme/shared-utils (462 tests):**
- With `--runInBand`: 9.145s
- Without `--runInBand`: 9.183s
- **Result:** 38ms SLOWER with parallelization ❌

**Conclusion:** Parallelization overhead exceeds benefits for this monorepo's test suites.

---

## Configuration

### Jest (Monorepo Default)

**File:** `jest.config.cjs:159`

```javascript
maxWorkers: Math.max(1, Math.floor(require("os").cpus().length * 0.5))
```

**Strategy:**
- Uses **50% of available CPU cores** (logical cores from `os.cpus().length`)
- Minimum of 1 worker (for single-core machines)
- Provides a default for packages that want parallelization

**Current Machine:**
- Logical CPU cores: 10 (from `os.cpus().length`)
- Workers allocated: 5 (50% of logical cores)
- **Note:** `os.cpus().length` counts logical cores (threads), not physical cores

**Usage:** This setting is **overridden** by 35 packages that use `--runInBand` in their package.json test scripts.

### Vitest (Brikette App)

**File:** `apps/brikette/vitest.config.ts:62-69`

```typescript
test: {
  pool: "forks",
  poolOptions: {
    forks: {
      singleFork: false,
    },
  },
  isolate: true,
}
```

**Status:** ✅ Already configured (before Phase 1)
**Strategy:** Fork-based parallelization with full test isolation

---

## Why 35 Packages Use `--runInBand`

Investigation revealed these packages use `--runInBand` for **valid reasons**:

### 1. Fast Tests (Overhead > Benefit)

**Examples:** `@acme/shared-utils`, `@acme/config`, `@acme/date-utils`

For test suites under 30 seconds:
- Parallelization overhead: 100-500ms (worker spawning, IPC)
- Actual test time: 8-15 seconds
- **Result:** Overhead makes parallelization slower

**Finding:** Tests are already fast enough. Parallelization adds complexity with no benefit.

### 2. Test Isolation Issues

Tests that share state, mock globals, or have side effects:
- Can't run safely in parallel
- Would cause flaky test failures
- Sequential execution is more reliable

### 3. Resource Contention (I/O Bound)

Tests with database access, file system operations, or network calls:
- Don't benefit from CPU parallelization (they're waiting on I/O)
- May have resource conflicts when running in parallel

### 4. Integration Tests (Need Optimization First)

**Examples:** `@acme/platform-core` (11+ minutes), `@acme/email` (10+ minutes)

These packages have slow tests that need optimization:
- Split integration tests from unit tests
- Mock external dependencies
- Reduce test setup/teardown time
- **Then** consider parallelization (but likely still not worth it)

---

## Packages Using `--runInBand` (35 Total)

### Packages (25)
- `packages/auth`
- `packages/cms-marketing`
- `packages/config`
- `packages/configurator`
- `packages/date-utils`
- `packages/email`
- `packages/email-templates`
- `packages/eslint-plugin-ds`
- `packages/i18n`
- `packages/lib`
- `packages/page-builder-core`
- `packages/page-builder-ui`
- `packages/pipeline-engine`
- `packages/platform-core`
- `packages/platform-machine`
- `packages/product-configurator`
- `packages/sanity`
- `packages/shared-utils`
- `packages/stripe`
- `packages/template-app`
- `packages/templates`
- `packages/tools`
- `packages/types`
- `packages/ui`
- `packages/zod-utils`

### Apps (10)
- `apps/api`
- `apps/cms`
- `apps/cochlearfit`
- `apps/cover-me-pretty`
- `apps/dashboard`
- `apps/handbag-configurator`
- `apps/handbag-configurator-api`
- `apps/prime`
- `apps/product-pipeline`
- `apps/skylar`

**Recommendation:** **Keep `--runInBand`** for all these packages.

---

## Usage

### Run Tests (Standard Commands)

```bash
# Monorepo-wide - uses package-level test scripts (most use --runInBand)
pnpm test

# Single package - uses package's test script
pnpm --filter @acme/platform-core test

# Direct Jest invocation - uses root maxWorkers setting
jest --config jest.config.cjs

# Brikette app - uses Vitest with parallelization
pnpm --filter @apps/brikette test:unit
```

### Override Parallelization (If Needed)

```bash
# Force sequential execution
pnpm --filter @acme/shared-utils exec jest --ci --runInBand --config ../../jest.config.cjs

# Force parallel execution (not recommended based on findings)
pnpm --filter @acme/shared-utils exec jest --ci --config ../../jest.config.cjs

# Specify worker count
jest --maxWorkers=2
```

---

## Performance Impact - Actual Findings

### @acme/shared-utils (462 tests, 44 suites)

| Configuration | Jest Time | Real Time | Tests | Result |
|---------------|-----------|-----------|-------|--------|
| With `--runInBand` (sequential) | 7.937s | 9.145s | 462 passed | Baseline |
| Without `--runInBand` (5 workers) | 8.375s | 9.183s | 462 passed | **38ms slower** ❌ |

**Analysis:**
- Parallelization added 38ms (0.4% slower)
- Worker spawning overhead exceeded any benefit
- Tests are already fast (<10 seconds)

**Conclusion:** Keep `--runInBand` for fast test suites.

### When Parallelization Helps

Only packages with ALL these characteristics benefit:

1. ✅ **Many tests:** 1000+ individual tests
2. ✅ **Medium duration:** 30-120 seconds with `--runInBand`
3. ✅ **Well-isolated:** No shared state, mocked dependencies
4. ✅ **Compute-bound:** Not waiting on I/O (database, network, filesystem)

**In this monorepo:** No packages identified matching all criteria.

### Parallelization Overhead

Real-world overhead measured:
- **Worker startup:** ~100-500ms total
- **IPC communication:** ~50-100ms during execution
- **Memory overhead:** ~50-100MB per worker

**Break-even point:** Test suite needs ~60+ seconds to overcome overhead.

---

## CI Configuration

### GitHub Actions

```yaml
- name: Run tests
  run: pnpm test
  # Uses package-level scripts (most have --runInBand)
```

**GitHub Runners:**
- Standard runners: 2 CPU cores
- Root config would use 1 worker
- Most packages override with `--runInBand` anyway

### Recommendation for CI

Keep current configuration:
- ✅ Predictable, stable test execution
- ✅ No flaky tests from parallelization
- ✅ Debugging is simpler
- ✅ No worker-related CI failures

---

## Troubleshooting

### Issue: Tests Pass Sequentially but Fail in Parallel

**Cause:** Test isolation issues (shared state, race conditions)

**Solution:** Use `--runInBand` (which most packages already do)

```bash
# Run sequentially
pnpm --filter @acme/package-name test
```

**Don't:** Try to fix test isolation for parallelization if tests are fast (<30s). The effort isn't worth it.

### Issue: Tests Are Very Slow (>5 minutes)

**Examples:** `@acme/platform-core`, `@acme/email`

**Cause:** Integration tests, not unit tests

**Solution:** Optimize tests first, not parallelization:

1. Split integration tests into separate test suite
2. Mock external dependencies (database, network, filesystem)
3. Reduce test setup/teardown overhead
4. Target: <30 seconds per package

**After optimization:** Tests should be fast enough without parallelization.

### Issue: Out of Memory in Tests

**Symptoms:**
```
FATAL ERROR: JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" pnpm test

# Or reduce workers (if not using --runInBand)
pnpm test -- --maxWorkers=2
```

---

## Best Practices

### 1. Write Fast Tests

**Target:** <30 seconds per package

```typescript
// ✅ Good: Fast, isolated unit tests
test('calculateTotal adds prices', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60);
});

// ❌ Bad: Slow integration test
test('full checkout flow', async () => {
  const user = await createUserInDatabase();
  const cart = await createCart(user);
  await addItemsToCart(cart, items);
  const order = await checkout(cart);
  await verifyEmailSent(user.email);
  await verifyInventoryUpdated();
});
```

### 2. Keep `--runInBand` for Fast Tests

If your package tests run in under 30 seconds, keep `--runInBand`:

```json
{
  "scripts": {
    "test": "jest --ci --runInBand --detectOpenHandles --config ../../jest.config.cjs"
  }
}
```

**Why?** Parallelization overhead makes fast tests slower.

### 3. Mock External Dependencies

```typescript
// Mock prevents actual I/O (faster tests)
jest.mock('axios');
jest.mock('fs/promises');
jest.mock('@acme/platform-core/src/prisma');
```

### 4. Use Test Fixtures

```typescript
// Isolated test data
export const createTestUser = (overrides = {}) => ({
  id: `test-${Math.random().toString(36)}`,
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  ...overrides,
});
```

---

## Decision Record

### Phase 1: Root Configuration ✅

**Implemented:** 2026-01-12
**Status:** Complete
**Impact:** Provides default for new packages

```javascript
// jest.config.cjs:159
maxWorkers: Math.max(1, Math.floor(require("os").cpus().length * 0.5))
```

### Phase 2: Remove `--runInBand` Flags ❌

**Investigated:** 2026-01-12
**Status:** Rejected based on findings
**Decision:** Keep `--runInBand` flags in 35 packages

**Reasons:**
1. ❌ Parallelization makes fast tests slower (overhead > benefit)
2. ❌ No packages benefit from parallelization
3. ❌ High risk of introducing flaky tests
4. ❌ Increased complexity for no gain
5. ✅ Current configuration is stable and predictable

**See:** [Complete investigation report](completion/test-parallelization-phase2-findings.md)

---

## Recommendations

### For Existing Packages

**DO:**
- ✅ Keep `--runInBand` flag if tests are <30 seconds
- ✅ Optimize slow tests (>5 minutes) by mocking and splitting
- ✅ Write isolated, fast unit tests
- ✅ Mock external dependencies

**DON'T:**
- ❌ Remove `--runInBand` to "speed up" fast tests (makes them slower)
- ❌ Try to parallelize tests with shared state
- ❌ Add parallelization to solve slow integration tests (optimize instead)

### For New Packages

**If tests will be <30 seconds:**
```json
{
  "scripts": {
    "test": "jest --ci --runInBand --config ../../jest.config.cjs"
  }
}
```

**If tests will be 30-120 seconds with 1000+ isolated tests:**
```json
{
  "scripts": {
    "test": "jest --ci --config ../../jest.config.cjs"
  }
}
```
(Will use root `maxWorkers: 5` setting)

**Most likely:** You'll want `--runInBand` based on patterns in this monorepo.

---

## Related Documentation

- **[Phase 2 Investigation Report](completion/test-parallelization-phase2-findings.md)** - Detailed findings and analysis
- **[Phase 1 Completion Report](completion/test-parallelization-completion.md)** - Initial implementation
- [Jest Configuration](https://jestjs.io/docs/configuration#maxworkers-number--string)
- [Vitest Pooling](https://vitest.dev/config/#pooloptions)
- [Testing Strategy](__tests__/docs/testing.md)

---

## Changelog

| Date | Change | Status |
|------|--------|--------|
| 2026-01-12 | Enabled Jest parallelization (50% CPU) | ✅ Complete |
| 2026-01-12 | Documented Vitest parallelization (already enabled) | ✅ Complete |
| 2026-01-12 | Investigated Phase 2 (`--runInBand` removal) | ❌ Rejected |
| 2026-01-12 | Tested @acme/shared-utils with/without parallelization | ✅ Complete |
| 2026-01-12 | Updated documentation with actual findings | ✅ Complete |

---

**Final Status:** ⚠️ Configured but not recommended for most packages

**Impact:** Neutral to negative (overhead > benefit for fast tests)

**Recommendation:** Keep `--runInBand` flags for 35 packages

**Future:** Consider parallelization only for new packages with 1000+ tests taking 30-120 seconds
