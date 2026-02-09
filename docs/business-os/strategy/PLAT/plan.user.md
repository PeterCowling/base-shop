---
Type: Business-Plan
Business: PLAT
Created: 2026-02-09
Updated: 2026-02-09
Owner: Pete
---

# Platform — Business Plan

## Strategy

### Current Focus (2026-02-09)

1. **Developer Experience Stability** (Priority: High)
   - Status: Monorepo (Turborepo + pnpm workspaces) operational; 13 tests skipped on brikette, packages/editorial/dist/ not built locally causing typecheck errors
   - Next: Resolve skipped tests, fix editorial build pipeline, stabilize local dev environment

2. **Cloudflare Deployment Maturity** (Priority: Medium)
   - Status: Static export gotchas documented (catch-all routes, route handlers, config exports don't support conditionals); staging deployed; production uses @opennextjs/cloudflare
   - Next: Consolidate deployment patterns, document edge runtime restrictions, standardize caching headers

3. **Shared Service Quality** (Priority: Medium)
   - Status: Core packages operational (@acme/platform-core, @acme/design-system, @acme/ui, @acme/i18n); @acme/platform-core → @acme/email cyclic dependency worked around with dynamic require
   - Next: Refactor cyclic dependencies, establish package boundaries, improve type safety

## Risks

### Active Risks

- **Test Infrastructure Debt** (Severity: Medium, Added: 2026-02-09)
  - Source: 13 tests skipped with describe.skip on brikette; tests skipped entirely on staging branch via GitHub Actions
  - Impact: Reduced confidence in changes; regressions may reach production
  - Mitigation: Unblock skipped tests incrementally; remove staging branch test skip; enforce test coverage thresholds

- **Build Pipeline Fragility** (Severity: Medium, Added: 2026-02-09)
  - Source: Static export requires `mv` gymnastics to hide unsupported routes; editorial package not built locally; config exports can't use ternaries
  - Impact: Developer onboarding friction; unexpected build failures
  - Mitigation: Document all gotchas in MEMORY.md; consider build pipeline redesign for Next.js 15 + Cloudflare

- **Cyclic Dependency Pattern** (Severity: Low, Added: 2026-02-09)
  - Source: @acme/platform-core → @acme/email cyclic dependency hidden with dynamic require string concat
  - Impact: Webpack/bundler confusion; maintenance risk
  - Mitigation: Refactor email service extraction; establish clear package dependency graph

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Metrics

### Build Performance (Established: 2026-02-09)

- **Local Build Time:** Not measured
  - Target: <2 minutes for full monorepo build
  - Measurement: `time pnpm build` from root

- **CI Build Time:** Not measured
  - Target: <5 minutes for PR validation (lint + typecheck + test)
  - Measurement: GitHub Actions workflow duration

### Developer Experience (Established: 2026-02-09)

- **Test Pass Rate:** ~95% (13 tests skipped out of ~200+)
  - Target: 100% (zero skipped tests)
  - Measurement: Jest/Playwright/Cypress run outputs

### Code Quality (Established: 2026-02-09)

- **TypeScript Strict Mode Coverage:** 100%
  - Target: Maintain 100% (no tsconfig strict: false escapes)
  - Measurement: pnpm typecheck across all packages
