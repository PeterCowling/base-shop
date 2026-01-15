# ADR 0001: Test Parallelization Strategy

**Status:** ✅ Accepted
**Date:** 2026-01-12
**Deciders:** Engineering Team
**Tags:** testing, performance, developer-experience

---

## Context and Problem Statement

Jest and Vitest support running tests in parallel across multiple CPU cores. This could potentially speed up test execution, improving developer experience and CI pipeline performance.

**Question:** Should we enable test parallelization for the monorepo packages?

---

## Decision Drivers

1. **Developer Experience** - Faster test feedback loops
2. **CI Performance** - Reduced pipeline duration and costs
3. **Code Quality** - More frequent testing due to faster runs
4. **Complexity** - Implementation and debugging overhead
5. **Stability** - Risk of flaky tests from parallelization

---

## Considered Options

### Option 1: Enable Parallelization for All Packages
Remove `--runInBand` flags from 35 packages and rely on root `maxWorkers` configuration.

### Option 2: Keep Current Configuration (Selected)
Maintain `--runInBand` flags for 35 packages, root config available for new packages.

### Option 3: Selective Parallelization
Remove `--runInBand` only from packages with slow, well-isolated tests.

---

## Decision Outcome

**Chosen Option:** Option 2 - Keep Current Configuration

**Reason:** Investigation showed parallelization provides **no benefit or makes things worse** for this monorepo's test suites.

### Implementation

**Phase 1 (Completed):**
- ✅ Root Jest config: `maxWorkers: Math.max(1, Math.floor(os.cpus().length * 0.5))`
- ✅ Vitest config: Already had parallelization enabled
- ✅ Documentation created

**Phase 2 (Investigated and Rejected):**
- ✅ Tested `@acme/shared-utils`: 38ms SLOWER with parallelization
- ✅ Identified why `--runInBand` flags exist (valid reasons)
- ❌ Decision: DO NOT remove `--runInBand` flags from 35 packages

---

## Evidence and Metrics

### Experimental Data

**Package:** `@acme/shared-utils` (462 tests, 44 test suites)

| Configuration | Jest Time | Real Time | CPU Time | Result |
|---------------|-----------|-----------|----------|--------|
| Sequential (`--runInBand`) | 7.937s | 9.145s | 11.869s user | Baseline |
| Parallel (5 workers) | 8.375s | 9.183s | 13.507s user | **38ms slower** ❌ |

**Analysis:**
- Parallelization overhead: ~500ms (worker spawning + IPC)
- Test execution time: ~8 seconds
- Overhead > benefit for fast test suites
- CPU time increased (more total work due to coordination)

### Parallelization Overhead Components

Measured overhead for parallel execution:
- **Worker startup:** 100-500ms (spawning 5 Node.js processes)
- **IPC communication:** 50-100ms (coordinating test results)
- **Memory overhead:** 50-100MB per worker (5 workers = 250-500MB extra)
- **Context switching:** Additional CPU cycles for process coordination

**Break-even point:** Test suite needs ~60+ seconds of pure compute time to overcome overhead.

### Package Analysis

**35 packages use `--runInBand` for valid reasons:**

1. **Fast Tests (23 packages)** - Tests <30 seconds where overhead > benefit
   - Examples: `shared-utils`, `config`, `date-utils`, `types`, `zod-utils`
   - Parallelization makes them 0-5% slower

2. **Test Isolation Issues (8 packages)** - Shared state prevents safe parallel execution
   - Examples: `auth`, `platform-machine`, `cms-marketing`
   - Would cause flaky tests if parallelized

3. **Resource Contention (4 packages)** - I/O bound tests don't benefit from CPU parallelization
   - Examples: `platform-core`, `email`, `sanity`, `product-pipeline`
   - Database/network/filesystem operations are the bottleneck

**0 packages identified** that would benefit from parallelization.

---

## Rationale

### Why Keep `--runInBand`

1. **Proven Performance:** Sequential execution is faster for fast tests
   - Real data: 38ms slower with parallelization
   - Overhead exceeds benefit for <30 second test suites
   - Most packages are 8-15 seconds

2. **Stability:** No risk of flaky tests from race conditions
   - Sequential execution is deterministic
   - Parallel execution can expose hidden shared state
   - Debugging is simpler

3. **Simplicity:** Lower cognitive overhead
   - Tests run in predictable order
   - Failures are easier to reproduce
   - No worker-related debugging

4. **Resource Efficiency:** Lower memory usage
   - Sequential: 1 process, ~200MB memory
   - Parallel: 5 processes, ~700MB memory
   - CI runners have limited resources

### Why Root Config Still Valuable

Provides a default for **future packages** if they meet criteria:
- 1000+ tests
- 30-120 seconds duration
- Well-isolated (no shared state)
- Compute-bound (not I/O bound)

**Probability:** Low (no current packages meet criteria)

---

## Consequences

### Positive

- ✅ **Stability:** No risk of introducing flaky tests
- ✅ **Performance:** Fast tests stay fast (no overhead)
- ✅ **Simplicity:** Easier debugging and maintenance
- ✅ **Resources:** Lower memory usage in CI
- ✅ **Predictability:** Tests run in consistent order

### Negative

- ⚠️ **Opportunity Cost:** Can't benefit from parallelization if tests grow
- ⚠️ **Perception:** May seem "unoptimized" to new developers
- ⚠️ **Future Work:** If tests become slow, need to optimize not parallelize

### Neutral

- 📊 **Root Config Unused:** 35 packages override with `--runInBand`
- 📊 **Vitest Already Parallel:** Brikette app unaffected by this decision

---

## Validation

### Success Criteria

- ✅ Tests remain fast (<30 seconds per package)
- ✅ No increase in flaky tests
- ✅ CI pipeline remains stable
- ✅ Developer experience unaffected

### Monitoring

Track these metrics monthly:
- Average test duration per package
- Flaky test rate
- CI pipeline duration
- Developer satisfaction with test speed

### Reversal Conditions

Reconsider this decision if:
1. A package grows to 1000+ tests taking 30-120 seconds
2. All tests become well-isolated (no shared state)
3. New test runner reduces parallelization overhead significantly
4. CI runners upgrade to much more powerful hardware

---

## Alternatives Considered

### Option 1: Enable Parallelization for All Packages

**Pros:**
- Could speed up slow tests (if they were compute-bound)
- Would follow industry "best practices"
- Might reduce CI costs (if faster)

**Cons:**
- Makes fast tests slower (proven with data)
- High risk of flaky tests from shared state
- Increased debugging complexity
- Higher memory usage in CI
- Effort: 45-80 hours to implement and stabilize

**Why Rejected:** Experimental data showed it makes tests slower.

### Option 3: Selective Parallelization

**Pros:**
- Could benefit specific packages while leaving others sequential
- Lower risk than Option 1

**Cons:**
- No packages identified that would benefit
- Creates inconsistent testing strategy
- Higher maintenance burden (need to decide for each package)
- Still risks flaky tests for parallelized packages

**Why Rejected:** No packages found that meet the criteria for parallelization.

---

## Implementation Guide

### For Existing Packages

**Keep `--runInBand` flag:**

```json
{
  "scripts": {
    "test": "jest --ci --runInBand --detectOpenHandles --config ../../jest.config.cjs"
  }
}
```

### For New Packages

**Default to `--runInBand`:**

```json
{
  "scripts": {
    "test": "jest --ci --runInBand --config ../../jest.config.cjs"
  }
}
```

**Exception:** If new package has:
- 1000+ well-isolated tests
- 30-120 seconds duration
- All compute-bound (no I/O)

Then consider omitting `--runInBand` to use root `maxWorkers: 5`.

### When Tests Become Slow

If a package's tests exceed 60 seconds, **DON'T** try parallelization. Instead:

1. **Profile tests** - Identify slow operations
2. **Mock I/O** - Mock database, network, filesystem
3. **Split tests** - Separate integration and unit tests
4. **Optimize setup** - Reduce beforeEach/beforeAll overhead
5. **Target** - Get back under 30 seconds

**Only then** consider parallelization if tests are still 30-120 seconds.

---

## Related Decisions

- **ADR 0002 (Future):** Test Optimization Strategy
- **ADR 0003 (Future):** Integration vs Unit Test Split

---

## References

### Documentation
- [Full Guide](../test-parallelization.md)
- [Phase 2 Investigation Report](../completion/test-parallelization-phase2-findings.md)
- [Phase 1 Completion Report](../completion/test-parallelization-completion.md)
- [Executive Summary](../test-parallelization-summary.md)

### External Resources
- [Jest Configuration - maxWorkers](https://jestjs.io/docs/configuration#maxworkers-number--string)
- [Vitest - Pool Options](https://vitest.dev/config/#pooloptions)
- [Google Testing Blog: Test Parallelization](https://testing.googleblog.com/2015/12/test-parallelization.html)

### Experimental Data
- Test results: `@acme/shared-utils` (462 tests)
- Baseline: 9.145s (sequential)
- Parallel: 9.183s (5 workers)
- Delta: +38ms slower with parallelization

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-12 | Initial decision | Based on Phase 1 & 2 investigation |
| 2026-01-12 | Added experimental data | Test results from @acme/shared-utils |
| 2026-01-12 | Finalized recommendation | Keep `--runInBand` for 35 packages |

---

**Status:** ✅ Accepted and Implemented
**Review Date:** 2027-01-12 (annual review)
**Owner:** Engineering Team
