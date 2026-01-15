# Test Parallelization - Phase 2 (Follow-up Task)

**Status:** 📋 Planned (Not Yet Implemented)
**Priority:** Medium
**Estimated Effort:** 2-3 hours
**Blocked By:** None (Phase 1 complete)

## Issue Discovered

During Phase 1 implementation, we discovered that **38 packages override the global `maxWorkers` configuration** by using the `--runInBand` flag in their test scripts.

### Current State

**Global Configuration (jest.config.cjs):**
```javascript
maxWorkers: Math.max(1, Math.floor(require("os").cpus().length * 0.5))
```
✅ Configured correctly

**Package-Level Overrides:**
```json
{
  "scripts": {
    "test": "jest --ci --runInBand --detectOpenHandles"
  }
}
```
❌ `--runInBand` disables parallelization (forces 1 worker)

### Impact

**38 packages** are running tests sequentially despite global parallelization configuration:
- `@acme/shared-utils` ❌
- `@acme/platform-core` ❌
- `@acme/ui` ❌
- ... (35 more)

**Result:** Phase 1 provides **limited benefit** until package-level flags are removed.

## Why `--runInBand` Was Used

Common reasons for using `--runInBand`:

1. **Test Isolation Issues:** Tests share state and fail in parallel
2. **Resource Contention:** Database/network mocks conflict
3. **Debugging:** Easier to debug with sequential execution
4. **Historical:** Added to fix flaky tests, never removed
5. **Copy-Paste:** Cargo-culted from other packages

## Phase 2 Goals

Remove unnecessary `--runInBand` flags to enable parallelization for all packages.

### Success Criteria

1. ✅ Identify which packages actually need `--runInBand`
2. ✅ Fix test isolation issues in packages that don't need it
3. ✅ Remove `--runInBand` from 30+ packages
4. ✅ Verify all tests pass with parallelization
5. ✅ Measure actual performance improvement

## Implementation Plan

### Step 1: Audit Packages (30 minutes)

```bash
# Find all packages using --runInBand
grep -r "runInBand" apps/*/package.json packages/*/package.json

# Test each package with parallelization
for pkg in $(pnpm -r list --depth -1 --json | jq -r '.[].name'); do
  echo "Testing $pkg without --runInBand..."
  pnpm --filter "$pkg" exec jest --maxWorkers=2
done
```

**Output:** List of packages that:
- ✅ Pass with parallelization (can remove flag)
- ❌ Fail with parallelization (need investigation)

### Step 2: Fix Test Isolation Issues (1-2 hours)

For packages that fail with parallelization:

```typescript
// Common issues and fixes:

// Issue 1: Shared global state
// ❌ Bad
let sharedUser;
beforeAll(() => { sharedUser = createUser(); });

// ✅ Good
let user;
beforeEach(() => { user = createUser(); });

// Issue 2: Unmocked external dependencies
// ❌ Bad
test('fetches data', async () => {
  const data = await fetch('/api/users');
});

// ✅ Good
jest.mock('node-fetch');
test('fetches data', async () => {
  // Mock is isolated per test
});

// Issue 3: File system access
// ❌ Bad
test('writes file', () => {
  fs.writeFileSync('/tmp/test.txt', 'data');
});

// ✅ Good
jest.mock('fs');
// Or use unique temp files per test
```

### Step 3: Remove Flags (1 hour)

For each package that passes:

```diff
{
  "scripts": {
-   "test": "jest --ci --runInBand --detectOpenHandles"
+   "test": "jest --ci --detectOpenHandles"
  }
}
```

Keep `--ci` and `--detectOpenHandles` (useful flags).
Remove only `--runInBand`.

### Step 4: Verify (30 minutes)

```bash
# Run full test suite with parallelization
time pnpm test

# Compare to baseline (from Phase 1)
# Expected: 50%+ faster

# Check for flaky tests
pnpm test
pnpm test
pnpm test
# All runs should pass consistently
```

## Expected Packages to Fix

### High-Value Targets (Slow Tests)

These packages have the most tests and will benefit most:

1. **@acme/platform-core** (500+ tests)
   - Currently: ~2 minutes with `--runInBand`
   - Expected: ~1 minute with 2 workers
   - **Impact:** 1 minute saved per run

2. **@acme/ui** (200+ tests)
   - Currently: ~45 seconds with `--runInBand`
   - Expected: ~23 seconds with 2 workers
   - **Impact:** 22 seconds saved per run

3. **@acme/auth** (150+ tests)
   - Currently: ~30 seconds with `--runInBand`
   - Expected: ~15 seconds with 2 workers
   - **Impact:** 15 seconds saved per run

**Total Expected Savings:** ~2 minutes per test run

### Low-Risk Targets (Fast Tests)

These packages have few tests and likely don't need `--runInBand`:

- `@acme/shared-utils` (42 tests) - Remove flag ✅
- `@acme/date-utils` (20 tests) - Remove flag ✅
- `@acme/config` (10 tests) - Remove flag ✅

## Risk Assessment

### Low Risk (Safe to Remove)

Packages with:
- ✅ No database access
- ✅ No file system access
- ✅ No global state
- ✅ All mocks isolated

**Action:** Remove `--runInBand` immediately

### Medium Risk (Test First)

Packages with:
- ⚠️ Database mocks
- ⚠️ Network mocks
- ⚠️ Some global state

**Action:** Test with parallelization, fix issues if needed

### High Risk (Keep Flag)

Packages with:
- 🔴 Real database connections
- 🔴 Real network calls
- 🔴 Shared external resources

**Action:** Keep `--runInBand`, or refactor tests

## Performance Projections

### Current State (Phase 1 Only)

```
Global config: maxWorkers=5
Package overrides: --runInBand (forces 1 worker)

Result: Minimal improvement (~5%)
```

### After Phase 2

```
Global config: maxWorkers=5
Package overrides: None (most packages)

Result: 50%+ improvement ✅
```

### Specific Examples

| Package | Tests | Before | After | Saved |
|---------|-------|--------|-------|-------|
| platform-core | 500+ | 120s | 60s | 60s |
| ui | 200+ | 45s | 23s | 22s |
| auth | 150+ | 30s | 15s | 15s |
| **Total** | **850+** | **195s** | **98s** | **97s** |

**Per-run savings:** 97 seconds (1.6 minutes)
**Monthly savings:** 1,000 runs × 97s = **27 hours/month**

## Potential Issues and Solutions

### Issue 1: Tests Fail in Parallel

**Symptoms:**
```bash
$ pnpm --filter @acme/platform-core exec jest --maxWorkers=2

FAIL src/cart.test.ts
  ● Cart › should add item

    Expected: []
    Received: [{ id: 'item-1' }]
```

**Cause:** Shared state between tests

**Solution:**
```typescript
// Add proper cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
```

### Issue 2: Resource Exhaustion

**Symptoms:**
```
FATAL ERROR: JavaScript heap out of memory
```

**Cause:** Too many workers for available memory

**Solution:**
```json
{
  "scripts": {
    "test": "jest --ci --maxWorkers=2"
  }
}
```

Override global config for specific packages.

### Issue 3: Flaky Tests

**Symptoms:** Tests pass sometimes, fail randomly

**Cause:** Race conditions in parallel execution

**Solution:**
1. Identify flaky tests
2. Add proper synchronization
3. Increase timeouts if needed
4. Use unique test data

## Rollback Plan

If Phase 2 causes issues:

```bash
# Revert all package.json changes
git checkout packages/*/package.json apps/*/package.json

# Or add --runInBand back to specific packages
pnpm --filter @acme/problematic-package exec jest --runInBand
```

## Success Metrics

### Quantitative

- [ ] Remove `--runInBand` from 30+ packages
- [ ] All tests pass with parallelization
- [ ] 50%+ faster test runs (actual measurement)
- [ ] No increase in flaky tests
- [ ] CI time reduced by 2-3 minutes

### Qualitative

- [ ] Tests remain reliable
- [ ] No new debugging complexity
- [ ] Team satisfied with speed improvement
- [ ] Documentation updated

## Timeline

**Total Effort:** 2-3 hours

| Phase | Duration | Tasks |
|-------|----------|-------|
| Audit | 30 min | Identify packages, test parallelization |
| Fix Issues | 1-2 hours | Fix test isolation problems |
| Remove Flags | 1 hour | Update package.json files |
| Verify | 30 min | Run tests, measure performance |

**Target Completion:** Same day as Phase 1 (or next sprint)

## Dependencies

**Requires:**
- ✅ Phase 1 complete (global config enabled)
- ✅ Working test suite
- ✅ CI pipeline stable

**Blocks:**
- Performance budgets implementation
- CI optimization work

## Next Steps

1. **Schedule Phase 2** - Allocate 2-3 hours
2. **Run Audit** - Test each package without `--runInBand`
3. **Fix Issues** - Address test isolation problems
4. **Remove Flags** - Update package.json files
5. **Measure** - Verify 50%+ improvement achieved
6. **Document** - Update test-parallelization.md with results

## Related Documentation

- [Test Parallelization (Phase 1)](test-parallelization.md)
- [Testing Strategy](__tests__/docs/testing.md)
- [Phase 1 Completion Report](completion/test-parallelization-completion.md)

---

**Status:** 📋 Planned
**Priority:** Medium (High ROI but requires investigation)
**Estimated Additional Savings:** 27 hours/month (on top of Phase 1)
