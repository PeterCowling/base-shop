# Test Parallelization - Executive Summary

**Status:** ⚠️ Configured but Not Recommended
**Date:** 2026-01-12
**Decision:** Keep `--runInBand` flags in 35 packages

---

## TL;DR

Test parallelization was investigated and **rejected**. Investigation showed it makes fast tests slower due to overhead. The 35 packages using `--runInBand` should keep it.

**Key Finding:**
```
@acme/shared-utils (462 tests):
- With --runInBand:    9.145s
- Without --runInBand: 9.183s (38ms SLOWER) ❌
```

---

## What Happened

### Phase 1: Configuration (1 hour)
✅ Added `maxWorkers: 5` to root Jest config
✅ Verified Vitest already had parallelization
✅ Created documentation

### Phase 2: Investigation (2 hours)
✅ Tested @acme/shared-utils with/without parallelization
✅ Identified why 35 packages use `--runInBand`
❌ Parallelization made tests slower (overhead > benefit)
❌ Decision: DO NOT remove `--runInBand` flags

---

## Why Parallelization Doesn't Help

### 1. Fast Tests (Overhead > Benefit)
Tests under 30 seconds get **slower** with parallelization:
- Worker startup: 100-500ms
- IPC communication: 50-100ms
- Most packages have 8-15 second test suites
- **Result:** Overhead exceeds benefit

### 2. Test Isolation Issues
Tests with shared state, mocks, or side effects:
- Can't run safely in parallel
- Would cause flaky failures
- Sequential execution more reliable

### 3. Resource Contention (I/O Bound)
Tests with database/network/filesystem access:
- Don't benefit from CPU parallelization
- Already waiting on I/O, not CPU
- May conflict when run in parallel

### 4. Integration Tests (Need Optimization)
Slow tests like `@acme/platform-core` (11+ min):
- Need optimization, not parallelization
- Should split integration/unit tests
- Mock external dependencies first

---

## 35 Packages Using `--runInBand`

### Keep These Flags ✅

**Packages (25):**
auth, cms-marketing, config, configurator, date-utils, email, email-templates, eslint-plugin-ds, i18n, lib, page-builder-core, page-builder-ui, pipeline-engine, platform-core, platform-machine, product-configurator, sanity, shared-utils, stripe, template-app, templates, tools, types, ui, zod-utils

**Apps (10):**
api, cms, cochlearfit, cover-me-pretty, dashboard, handbag-configurator, handbag-configurator-api, prime, product-pipeline, skylar

**Why?** Tests are fast (<30s) where parallelization overhead makes them slower.

---

## Recommendations

### ✅ DO
- Keep `--runInBand` flags for fast tests (<30 seconds)
- Optimize slow tests (>5 minutes) by mocking and splitting
- Write isolated, fast unit tests
- Mock external dependencies

### ❌ DON'T
- Remove `--runInBand` to "speed up" fast tests (makes them slower)
- Try to parallelize tests with shared state
- Add parallelization to solve slow integration tests

### 🎯 Focus Instead On
1. Fix slow tests in `@acme/email` (10+ minutes)
2. Fix slow tests in `@acme/platform-core` (11+ minutes)
3. Split integration tests from unit tests
4. Mock external dependencies to speed up tests
5. Target: <30 seconds per package

---

## When Parallelization Helps

Only packages with **ALL** these characteristics benefit:
1. ✅ **1000+ tests** (not 100-500)
2. ✅ **30-120 seconds** with `--runInBand` (not <30 or >120)
3. ✅ **Well-isolated** (no shared state, all mocked)
4. ✅ **Compute-bound** (not I/O bound)

**In this monorepo:** Zero packages match these criteria.

---

## Documentation

- **[Full Documentation](test-parallelization.md)** - Complete guide
- **[Phase 2 Investigation](completion/test-parallelization-phase2-findings.md)** - Detailed findings
- **[Phase 1 Completion](completion/test-parallelization-completion.md)** - Implementation report

---

## Quick Reference

### For Existing Packages
```json
{
  "scripts": {
    "test": "jest --ci --runInBand --config ../../jest.config.cjs"
  }
}
```
**Keep the `--runInBand` flag!**

### For New Packages
```json
{
  "scripts": {
    "test": "jest --ci --runInBand --config ../../jest.config.cjs"
  }
}
```
**Use `--runInBand` unless you have 1000+ tests taking 30-120 seconds.**

---

## Decision Record

| Date | Decision | Reason |
|------|----------|--------|
| 2026-01-12 | Phase 1: Add `maxWorkers` to root config | Provides default for new packages |
| 2026-01-12 | Phase 2: Keep `--runInBand` in 35 packages | Parallelization makes fast tests slower |

**Final Decision:** ⚠️ Configured but not recommended for most packages

---

## Cost-Benefit Analysis

### Effort to Remove `--runInBand`
- Best case: 10-12 hours
- Realistic: 45-80 hours
- Includes: testing, fixing isolation issues, debugging flaky tests

### Expected Benefit
- Best case: 0-2% speed improvement (may be slower)
- Realistic: Negative (overhead > benefit)
- Risk: High (flaky tests, debugging complexity)

### ROI: Negative ❌

---

**Status:** Complete and rejected
**Recommendation:** Keep current configuration
**Next:** Optimize slow tests instead of adding parallelization
