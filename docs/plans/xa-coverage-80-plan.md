---
Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2026-01-15
Relates-to charter: none
Created: 2026-01-15
Created-by: Codex
Last-updated: 2026-01-15
Last-updated-by: Codex
---

# XA app 80% coverage plan

## Context
The XA app currently has only a handful of unit/security tests, and the
monorepo Jest config explicitly relaxes coverage thresholds to 0 for
`apps/xa`. The goal is to reach a minimum of 80% coverage across lines,
branches, and functions for the XA app.

## Goals
- Enforce 80% global Jest coverage thresholds for `apps/xa`.
- Add meaningful unit and component tests that exercise core behavior.
- Keep tests deterministic, fast, and isolated (no network or heavy Next
  runtime assumptions).

## Non-goals
- End-to-end or Playwright coverage.
- Testing generated `.vercel/output` artifacts.
- Large-scale refactors unrelated to testability.

## Current state
- Existing tests: a few unit tests in `apps/xa/src/lib/__tests__` and
  security tests in `apps/xa/src/__tests__`.
- Jest config (`jest.config.cjs`) explicitly sets XA coverage thresholds
  to 0, so coverage is not enforced today.
- `collectCoverageFrom` includes all `src/**/*.{ts,tsx}`, which means
  large coverage gaps in `src/app/**` and UI-heavy components.

## Plan
1. Baseline and scope agreement
   - Run XA tests with coverage to establish baseline and top offenders.
   - Confirm coverage scope: all `src/**/*` (including static page files)
     vs. any acceptable exclusions.
2. Coverage enforcement
   - Remove the XA-specific coverage relaxation in `jest.config.cjs`.
   - Ensure XA uses the global 80% thresholds for lines/branches/functions.
3. Library unit tests (highest ROI)
   - Add tests for `src/lib` modules with business logic:
     `xaCatalog`, `xaCart`, `xaListingUtils`, `xaSearchService`,
     `xaEdits`, `inventoryStore`, `ordersStore`, `accessTokens`, etc.
   - Use small, deterministic fixtures to cover edge cases and branches.
4. Component tests for stable UI logic
   - Target components with logic-heavy rendering (filters, buy box,
     listing/cards, cart/wishlist contexts).
   - Use React Testing Library with focused assertions; mock Next hooks.
5. Route handler tests
   - Add unit tests for API route handlers in `src/app/api/**` using
     NextRequest/NextResponse where practical.
6. Coverage stabilization
   - Add shared test utilities/mocks to reduce duplication.
   - Re-run coverage and address remaining hot spots.
7. Final verification
   - Ensure XA passes with 80% thresholds locally and in CI.

## Risks and mitigations
- **High volume of app/page files**: If coverage must include every page,
  the test count will be significant. Mitigation: prioritize shared
  render helpers, test representative pages per category, and reuse
  fixtures.
- **Next.js testing friction**: Mock Next navigation and server
  components where needed; avoid rendering full layouts.

## Open questions
- Should the 80% coverage requirement include all `src/app/**` pages, or
  are there acceptable exclusions for static/marketing-only pages?
- Are there specific flows you want prioritized (e.g., cart, search,
  access-admin)?

## Active tasks

- **XA-COV-01** - Baseline coverage measurement and gap analysis
