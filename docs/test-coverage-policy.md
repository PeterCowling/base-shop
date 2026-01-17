---
Type: Policy
Status: Active
Domain: Testing
Last-reviewed: 2026-01-17
Created: 2026-01-17
Created-by: Claude Opus 4.5
---

# Test Coverage Policy

This document defines the uniform coverage requirements for the base-shop monorepo. All packages MUST meet their assigned tier threshold.

## Philosophy

A world-class repository requires consistent, enforceable coverage standards based on code criticality:

1. **Revenue and security-critical code** gets the highest bar (90%)
2. **All other runtime code** meets the industry-standard baseline (80%)
3. **Non-runtime code** (types, configs, templates) is exempt (0%)

This is simpler than ad-hoc per-package thresholds and eliminates the "inverted risk profile" where admin UI was tested more strictly than payment processing.

## Coverage Tiers

| Tier | Threshold | Packages | Rationale |
|------|-----------|----------|-----------|
| **CRITICAL** | 90% all metrics | `@acme/stripe`, `@acme/auth`, `@acme/platform-core` | Revenue-impacting, security-critical, or foundational domain logic |
| **STANDARD** | 80% all metrics | All other packages and apps | Industry baseline for mature repositories |
| **MINIMAL** | 0% | `@acme/types`, `@acme/templates`, `@acme/template-app`, `@acme/tailwind-config`, `scripts` | No runtime logic; type definitions and configs only |

## Enforcement

### Local Gate (Primary Enforcement)

Coverage is enforced via **local gating only**. Run before committing significant changes:

```bash
# Check all packages
./scripts/check-coverage.sh

# Check specific package
./scripts/check-coverage.sh @acme/stripe

# Dry run (show what would be checked)
DRY_RUN=1 ./scripts/check-coverage.sh
```

### CI Integration

CI runs coverage collection for all workspaces (see `.github/workflows/test.yml`). Coverage reports are:
- Collected during the test phase with `--coverage`
- Uploaded as artifacts for analysis
- Available for trend tracking

**Threshold enforcement** is currently local-only (developers run `./scripts/check-coverage.sh` before commit). CI collects coverage data but does not fail on threshold violations — this prevents flaky failures from blocking PRs on minor coverage fluctuations (0.1-0.5% variance is common).

**Why local enforcement is preferred:**
1. **Immediate feedback** — Developers catch issues before commit, not after a 10-minute CI run
2. **Developer ownership** — Coverage is the developer's responsibility, enforced at their desk
3. **Reduced CI noise** — Threshold failures don't block PRs on noise

**CI gating** (failing PRs on threshold violations) will be revisited in June 2026 after local gate adoption is proven stable.

### Jest Integration

Coverage thresholds are enforced by Jest when running tests with `--coverage`:

```bash
# Single package with coverage
pnpm --filter @acme/stripe test --coverage

# All tests with coverage (slow)
pnpm test:coverage
```

### Configuration

Coverage tiers are defined in `packages/config/coverage-tiers.cjs`. To use in a package's jest config:

```javascript
// packages/stripe/jest.config.cjs
const { getTier } = require("@acme/config/coverage-tiers.cjs");
const base = require("../../jest.config.cjs");

module.exports = {
  ...base,
  coverageThreshold: getTier("@acme/stripe"), // Returns CRITICAL (90%)
};
```

Or use the tier directly:

```javascript
const { TIERS } = require("@acme/config/coverage-tiers.cjs");

module.exports = {
  coverageThreshold: TIERS.STANDARD, // 80%
};
```

## Adding New Packages

New packages default to **STANDARD** (80%) tier. To assign a different tier:

1. Edit `packages/config/coverage-tiers.cjs`
2. Add the package to `PACKAGE_TIERS`:

```javascript
const PACKAGE_TIERS = {
  // CRITICAL: Revenue and security-critical
  "@acme/stripe": "CRITICAL",
  "@acme/auth": "CRITICAL",
  "@acme/platform-core": "CRITICAL",
  "@acme/new-payment-provider": "CRITICAL", // ← Add here

  // MINIMAL: No runtime logic
  "@acme/types": "MINIMAL",
  // ...
};
```

## Tier Assignment Criteria

### CRITICAL (90%)

Assign to packages where bugs cause:
- Financial loss (payment processing, pricing calculations)
- Security incidents (authentication, authorization, session management)
- Data corruption (core domain entities, persistence layer)
- Cascading failures (foundational libraries used by everything)

### STANDARD (80%)

The default for all runtime code:
- UI components
- API routes
- Business logic
- Utilities and helpers
- Application code

### MINIMAL (0%)

Only for code with no runtime behavior:
- TypeScript type definitions
- Tailwind/CSS configurations
- Templates and scaffolding
- Build scripts and tooling

## Metrics

All four Jest coverage metrics must meet the tier threshold:

| Metric | What It Measures |
|--------|------------------|
| **Lines** | Percentage of executed lines |
| **Branches** | Percentage of executed conditional branches (if/else, ternary) |
| **Functions** | Percentage of called functions |
| **Statements** | Percentage of executed statements |

## Exceptions

There are no per-file or per-package exceptions. If a package cannot meet its tier:

1. **Add tests** — the primary solution
2. **Re-evaluate tier assignment** — if criticality was misjudged
3. **Refactor** — extract untestable code into a MINIMAL package

Do NOT add `istanbul ignore` comments or `coveragePathIgnorePatterns` to work around thresholds.

## Gradual Adoption

For packages currently below threshold:

1. Run `./scripts/check-coverage.sh @acme/package-name` to see current coverage
2. Identify files with lowest coverage
3. Add tests incrementally
4. Track progress in the package's README or a plan doc

The coverage gate will fail CI once enabled. Until then, it's advisory.

## Related Documents

- [packages/config/coverage-tiers.cjs](../packages/config/coverage-tiers.cjs) — Tier definitions
- [scripts/check-coverage.sh](../scripts/check-coverage.sh) — Local gate script
- [jest.coverage.cjs](../jest.coverage.cjs) — Jest coverage configuration
- [docs/repo-quality-audit-2026-01.md](repo-quality-audit-2026-01.md) — Audit that identified coverage gaps
