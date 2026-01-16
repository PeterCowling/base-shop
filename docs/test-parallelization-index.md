# Test Parallelization - Documentation Index

Complete documentation for the test parallelization investigation conducted on 2026-01-12.

---

## Quick Links

- **🚀 [Executive Summary](test-parallelization-summary.md)** - Start here for TL;DR
- **📋 [Architecture Decision Record](decisions/0001-test-parallelization.md)** - Official decision record
- **📖 [Full Guide](test-parallelization.md)** - Complete reference documentation
- **🔬 [Phase 2 Investigation](completion/test-parallelization-phase2-findings.md)** - Detailed findings
- **✅ [Phase 1 Completion](completion/test-parallelization-completion.md)** - Implementation report

---

## Reading Recommendations

### I need the bottom line (2 min read)
→ **[Executive Summary](test-parallelization-summary.md)**

**Key points:**
- Test parallelization investigated and rejected
- Makes fast tests slower (38ms overhead for 9s test suite)
- Keep `--runInBand` flags in 35 packages
- Focus on optimizing slow tests instead

### I need the official decision (5 min read)
→ **[Architecture Decision Record](decisions/0001-test-parallelization.md)**

**Key points:**
- ADR format with context, evidence, and rationale
- Experimental data from @acme/shared-utils
- Decision: Keep current configuration
- Reversal conditions documented

### I need to understand how parallelization works (15 min read)
→ **[Full Guide](test-parallelization.md)**

**Key points:**
- How Jest/Vitest parallelization works
- Why 35 packages use `--runInBand`
- When parallelization helps (and doesn't)
- Best practices for writing fast tests
- Troubleshooting guide

### I need the detailed investigation findings (10 min read)
→ **[Phase 2 Investigation Report](completion/test-parallelization-phase2-findings.md)**

**Key points:**
- Test methodology and results
- Package-by-package analysis
- Cost-benefit calculation
- Lessons learned

### I need to know what was implemented (10 min read)
→ **[Phase 1 Completion Report](completion/test-parallelization-completion.md)**

**Key points:**
- Root Jest config changes
- Vitest verification
- Documentation created
- Phase 2 update with findings

---

## Document Summaries

### 1. Executive Summary
**File:** [test-parallelization-summary.md](test-parallelization-summary.md)
**Purpose:** Quick reference for busy developers
**Length:** ~150 lines
**Audience:** Everyone

**Contents:**
- TL;DR with test results
- Why parallelization doesn't help
- List of 35 packages using `--runInBand`
- Recommendations (do/don't)
- Quick reference for package.json

**When to read:** First document to read, or when you need a quick refresher.

---

### 2. Architecture Decision Record (ADR)
**File:** [decisions/0001-test-parallelization.md](decisions/0001-test-parallelization.md)
**Purpose:** Official decision record in ADR format
**Length:** ~400 lines
**Audience:** Technical leads, architects, future team members

**Contents:**
- Context and problem statement
- Decision drivers and options considered
- Experimental data and evidence
- Rationale and consequences
- Implementation guide
- Reversal conditions

**When to read:**
- Making architectural decisions
- Onboarding senior engineers
- Reviewing past decisions
- Planning to reverse the decision

---

### 3. Full Guide
**File:** [test-parallelization.md](test-parallelization.md)
**Purpose:** Complete reference documentation
**Length:** ~470 lines
**Audience:** All developers

**Contents:**
- Overview and configuration details
- Why 35 packages use `--runInBand`
- Performance impact with real data
- Usage examples
- CI configuration
- Troubleshooting (6 issues)
- Best practices (4 practices)
- Decision record summary

**When to read:**
- Debugging test issues
- Writing new tests
- Creating new packages
- Understanding test behavior

---

### 4. Phase 2 Investigation Report
**File:** [completion/test-parallelization-phase2-findings.md](completion/test-parallelization-phase2-findings.md)
**Purpose:** Detailed investigation findings
**Length:** ~500 lines
**Audience:** Technical team, stakeholders

**Contents:**
- Executive summary
- Test 1: @acme/shared-utils results (detailed)
- Test 2: @acme/email attempt (abandoned)
- Test 3: @acme/platform-core attempt (abandoned)
- Pattern analysis (fast vs slow tests)
- Why packages have `--runInBand`
- Cost-benefit analysis with realistic effort estimates
- Recommendations (3 alternatives)
- Lessons learned (4 key lessons)
- Conclusion

**When to read:**
- Need detailed justification for decision
- Planning test optimization work
- Understanding why tests are slow
- Estimating effort for future test improvements

---

### 5. Phase 1 Completion Report
**File:** [completion/test-parallelization-completion.md](completion/test-parallelization-completion.md)
**Purpose:** Implementation report for Phase 1 + Phase 2 update
**Length:** ~460 lines
**Audience:** Project managers, technical team

**Contents:**
- Phase 1: What was implemented
- Configuration details
- Documentation created
- Verification steps
- Phase 2 update: Investigation results
- Files modified
- Comparison to plan
- Next steps

**When to read:**
- Tracking project progress
- Understanding what changed
- Reviewing implementation details
- Planning next steps

---

## Common Questions

### Q: Should I remove `--runInBand` from my package?
**A:** No. See [Executive Summary](test-parallelization-summary.md) → "35 Packages Using --runInBand"

**Why?** Parallelization makes fast tests slower. Keep `--runInBand` unless you have 1000+ tests taking 30-120 seconds.

---

### Q: Why are my tests slow?
**A:** See [Full Guide](test-parallelization.md) → "Troubleshooting" → "Tests Are Very Slow"

**TL;DR:** Probably integration tests. Mock dependencies and split integration/unit tests.

---

### Q: Can I use parallelization for my new package?
**A:** See [ADR](decisions/0001-test-parallelization.md) → "Implementation Guide" → "For New Packages"

**TL;DR:** Default to `--runInBand` unless you have 1000+ well-isolated tests taking 30-120 seconds.

---

### Q: What's the performance impact?
**A:** See [Executive Summary](test-parallelization-summary.md) → "TL;DR"

**Answer:** 38ms slower for 9-second test suite. Overhead > benefit for fast tests.

---

### Q: Why was Phase 2 rejected?
**A:** See [Phase 2 Investigation](completion/test-parallelization-phase2-findings.md) → "Executive Summary"

**Answer:** Experimental data showed parallelization makes tests slower. No packages benefit.

---

## File Structure

```
docs/
├── test-parallelization.md                          # Full guide (470 lines)
├── test-parallelization-summary.md                  # Executive summary (150 lines)
├── test-parallelization-index.md                    # This file
├── decisions/
│   └── 0001-test-parallelization.md                 # ADR (400 lines)
└── completion/
    ├── test-parallelization-completion.md           # Phase 1 + Phase 2 (460 lines)
    └── test-parallelization-phase2-findings.md      # Investigation (500 lines)
```

**Total:** ~2,000 lines of documentation

---

## Key Findings at a Glance

### What Was Done
- ✅ Root Jest config: `maxWorkers: 5`
- ✅ Vitest config: Already had parallelization
- ✅ Tested @acme/shared-utils: 462 tests
- ✅ Identified 35 packages with `--runInBand`
- ✅ Created comprehensive documentation

### What Was Learned
- ❌ Parallelization makes fast tests slower (38ms overhead)
- ✅ `--runInBand` flags exist for valid reasons
- ❌ No packages benefit from parallelization
- ✅ Test optimization > parallelization

### What Was Decided
- ✅ Keep `--runInBand` in 35 packages
- ✅ Root config available for new packages
- ✅ Focus on optimizing slow tests instead

---

## Update History

| Date | Update | Files Changed |
|------|--------|---------------|
| 2026-01-12 | Phase 1 implementation | `jest.config.cjs`, 3 docs created |
| 2026-01-12 | Phase 2 investigation | Tested @acme/shared-utils |
| 2026-01-12 | Documentation updated | All 5 docs updated with findings |
| 2026-01-12 | Index created | This file |

---

## For Future Reference

### If Tests Become Slow (>60 seconds)

1. **DON'T** remove `--runInBand` first
2. **DO** profile and optimize tests
3. **DO** mock I/O operations
4. **DO** split integration/unit tests
5. **THEN** consider parallelization if still 30-120 seconds

See: [Full Guide](test-parallelization.md) → "Troubleshooting" → "Tests Are Very Slow"

### If Creating New Package

1. **Default to `--runInBand`** in package.json
2. Write fast, isolated unit tests
3. Mock external dependencies
4. Target <30 seconds per package

See: [ADR](decisions/0001-test-parallelization.md) → "Implementation Guide"

### If Tests Start Failing Randomly

1. Check for shared state between tests
2. Ensure proper cleanup in `afterEach`
3. Mock time-dependent code
4. Keep `--runInBand` flag

See: [Full Guide](test-parallelization.md) → "Best Practices"

---

## Maintenance

### Annual Review (Next: 2027-01-12)

Review this decision if:
- Package test suites grow significantly (1000+ tests)
- New test runner reduces overhead
- CI infrastructure improves substantially
- Test patterns change (better isolation)

See: [ADR](decisions/0001-test-parallelization.md) → "Reversal Conditions"

---

**Last Updated:** 2026-01-12
**Status:** Complete and final
**Next Review:** 2027-01-12
