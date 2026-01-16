Type: Guide
Status: Active
Domain: Testing
Last-reviewed: 2025-12-02
Last-updated: 2026-01-15
Last-updated-by: Claude Opus 4.5

# Test Coverage — Jest, Cypress CT, Cypress E2E

This repo generates a single, unified coverage report that combines:

- Jest unit/integration coverage (Node + JSDOM)
- Cypress Component Testing coverage (Vite + React)
- Cypress E2E coverage for both client and server routes

## Coverage Targets

All packages must meet minimum coverage thresholds enforced by Jest. These thresholds are configured in `jest.coverage.cjs` and package-specific `jest.config.cjs` files.

### Global Defaults

| Metric     | Target |
|------------|--------|
| Lines      | 80%    |
| Branches   | 80%    |
| Functions  | 80%    |

### Package-Specific Thresholds

| Package      | Lines | Branches | Functions | Notes                                    |
|--------------|-------|----------|-----------|------------------------------------------|
| `@acme/ui`   | 90%   | 85%      | 90%       | Stricter for shared design system        |

### Exclusions

The following are excluded from coverage metrics:
- Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Storybook stories (`*.stories.ts`)
- DevTools code
- CMS/page-builder components (until migrated)
- Data/constant files (icons, palettes, presets)

### Relaxing Thresholds

For targeted test runs where full coverage isn't expected:

```bash
# Disable thresholds for @acme/ui
JEST_DISABLE_COVERAGE_THRESHOLD=1 pnpm --filter @acme/ui test

# Allow partial coverage globally
JEST_ALLOW_PARTIAL_COVERAGE=1 pnpm test
```

### E2E Coverage Targets

E2E tests focus on critical user paths rather than line coverage:

| Area                | Target  | Notes                              |
|---------------------|---------|-------------------------------------|
| Critical user paths | 80%+    | Checkout, auth, core navigation     |
| Accessibility       | WCAG AA | Automated axe testing on all pages  |
| Performance         | FCP <1.5s, TTI <3.5s | Core Web Vitals budgets  |

## Outputs

- Raw NYC JSON: `.nyc_output/*.json` (Cypress)
- Jest JSON + lcov: `coverage/` (per package/app)
- Merged report: `coverage/merged/coverage.json`
- Final HTML + text summary: `coverage/index.html`

## Commands

1) Run Jest with coverage (workspace‑wide)

```bash
pnpm test:coverage
```

2) Run Cypress CT with coverage (already instrumented via Vite)

```bash
pnpm ct   # headless
# or
pnpm ct:open
```

3) Run Cypress E2E with client+server coverage enabled

```bash
pnpm e2e:coverage
```

- Client coverage is collected by instrumenting Next’s client bundles when `COVERAGE=1`.
- Server coverage is exposed via `GET /api/__coverage__` (only when `COVERAGE=1`) and automatically pulled at the end of the Cypress run.

4) Merge all coverage and generate HTML

```bash
pnpm coverage:merge
```

Open `coverage/index.html` in your browser for a navigable report.

## Notes

- E2E coverage is opt‑in to avoid overhead in normal runs. Use `pnpm e2e` for speed; use `pnpm e2e:coverage` when you need instrumentation.
- If you add another Next app to E2E coverage, add its own `/api/__coverage__` endpoint and extend the Cypress collection step to fetch it before merging.
- To focus on quick E2E checks for PRs, use `pnpm e2e:smoke`. For only Lighthouse budgets, run `pnpm e2e:lh`.
