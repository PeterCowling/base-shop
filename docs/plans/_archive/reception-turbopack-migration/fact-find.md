---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21
Feature-Slug: reception-turbopack-migration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-turbopack-migration/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Reception App: Webpack → Turbopack Migration Fact-Find Brief

## Scope

### Summary
Migrate the reception app (`apps/reception`) from webpack to Turbopack (Next.js 16's default bundler). The `--webpack` flag was added as a blanket safety measure during the Next.js 16 upgrade (commit `5e27a4655c`, 2026-02-14) across all 14 apps. Brikette has already completed this migration successfully, providing a proven reference path. Reception is the second app to migrate.

### Goals
- Remove `--webpack` from both `dev` and `build` scripts in `apps/reception/package.json`
- Achieve a clean `next build` with Turbopack (zero errors)
- Achieve a clean `next dev` with Turbopack (HMR working, all routes functional)
- Update the webpack policy matrix in `scripts/check-next-webpack-flag.mjs` to allow reception

### Non-goals
- Migrating any other app beyond reception
- Changing reception's Firebase architecture or test infrastructure
- Optimizing bundle size (separate concern)

### Constraints & Assumptions
- Constraints:
  - Turbopack `resolveAlias` is exact-match only — sub-path imports bypass aliases (documented in MEMORY.md)
  - Absolute-path aliases must NOT be added for server-side/RSC packages (causes "server relative imports are not implemented yet")
  - Policy enforcement script (`scripts/check-next-webpack-flag.mjs`) must be updated for reception to pass CI
- Assumptions:
  - Reception's "use client" on all pages means most code is client-side, reducing RSC alias risk
  - Brikette's successful migration proves the shared package resolution approach works
  - Firebase SDK v11 modular imports are Turbopack-compatible (standard ESM)

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/package.json` — build scripts with `--webpack` flag
- `apps/reception/next.config.mjs` — standalone config (does NOT use shared `packages/next-config`)
- `apps/reception/src/app/globals.css` — CSS entry with `@themes` alias
- `scripts/check-next-webpack-flag.mjs` — policy enforcement gate

### Key Modules / Files
- `apps/reception/next.config.mjs` — minimal config: `transpilePackages: ["@acme/mcp-server"]`, `compiler.removeConsole`
- `packages/next-config/next.config.mjs` — shared config with `turbopack.resolveAlias` block (not consumed by reception)
- `apps/brikette/next.config.mjs` — reference implementation extending shared config with Turbopack aliases
- `apps/reception/src/app/globals.css` — `@import "@themes/base/tokens.css"` requires alias resolution
- `apps/reception/tailwind.config.mjs` — standard Tailwind 4 config, extends root
- `scripts/check-next-webpack-flag.mjs` — fail-closed policy matrix; only brikette is currently exempted
- `scripts/__tests__/next-webpack-flag-policy.test.ts` — policy enforcement tests

### Patterns & Conventions Observed
- **Standalone config**: Reception has its own `next.config.mjs`, not importing from `packages/next-config` — evidence: `apps/reception/next.config.mjs`
- **Client-first rendering**: All page routes use `"use client"` + `export const dynamic = "force-dynamic"` — evidence: 45 `"use client"` declarations across `apps/reception/src/`
- **Sub-path imports from workspace packages**: 8 files import `@acme/design-system/{atoms,primitives}`, 8 files use `@acme/ui/{hooks,providers,molecules,operations,components}` sub-path imports + 2 files use bare `@acme/ui` (10 total) — evidence: grep results
- **No Babel config**: No `.babelrc` or `babel.config.*` — compatible with Turbopack's SWC-only approach
- **No custom webpack config**: No `webpack.config.js` or webpack function in next.config — clean starting point
- **No `require()` in production code**: Only 1 test file uses `require()` — evidence: `src/hooks/mutations/__tests__/useBulkBookingActions.test.ts:17`

### Data & Contracts
- Types/schemas/events: Not investigated: migration is infrastructure-only, no schema changes
- Persistence: Not investigated: no data model changes
- API/contracts:
  - `transpilePackages: ["@acme/mcp-server"]` — Turbopack supports this option; the two API routes (`/api/mcp/booking-email`, `/api/mcp/guest-email-activity`) should work unchanged

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/design-system` (workspace) — sub-path imports: `atoms`, `primitives`, `atoms/Grid` (8 files)
  - `@acme/ui` (workspace) — sub-path imports: `hooks/useTheme`, `providers/ThemeProvider`, `molecules`, `components/organisms/...` (8 files with sub-path imports + 2 bare imports = 10 total)
  - `@acme/lib` (workspace) — single sub-path import: `math/financial` (1 file: `src/utils/moneyUtils.ts`)
  - `@acme/mcp-server` (workspace) — transpiled; used in 2 API routes
  - `@themes/base/tokens.css` — CSS alias import in `globals.css`
  - Third-party: `firebase` (90+ files), `react-dnd` (1 component + test), `sweetalert2` (1 util), `framer-motion` (1 component), `@fortawesome/*` (13 components), `react-day-picker` (5 components), `react-transition-group` (2 components)
- Downstream dependents:
  - No other app depends on reception
- Likely blast radius:
  - Reception app only — fully isolated
  - Policy matrix update affects CI validation for reception only
  - No shared package changes needed

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (via `pnpm exec jest`)
- Commands: `pnpm --filter @apps/reception test`
- CI integration: Runs via `reusable-app.yml` workflow

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Hooks/mutations | Unit | ~20 test files | Good coverage of business logic hooks |
| Components | Unit/integration | ~50 test files | Component rendering and interaction tests |
| Utils | Unit | ~15 test files | Utility function tests |
| Firebase rules | Integration | 1 file | `databaseRules.test.ts` with emulator |

#### Testability Assessment
- Easy to test: Build success (`next build` exit code), dev server startup, route accessibility
- Hard to test: CSS ordering/specificity changes, HMR boundary correctness, `react-dnd` context sharing
- Test seams needed: None — existing test suite runs via Jest (unaffected by bundler change); manual smoke test of key routes needed

#### Recommended Test Approach
- Build validation: `next build` (no `--webpack`) must exit 0
- Dev smoke: `next dev` (no `--webpack`) must serve all 28 routes
- Visual regression: Manual check of CSS-heavy pages (rooms-grid, bar, email-automation)
- DnD functional: Manual test of drag-and-drop in rooms-grid
- E2E: Not required for initial migration (reception has no E2E suite)

### Recent Git History (Targeted)
- `5e27a4655c` (2026-02-14) — `feat(nextjs-16-upgrade): add --webpack to dev/build scripts (TASK-02)` — blanket `--webpack` addition across all 14 apps during Next.js 16 upgrade
- Brikette's Turbopack migration (multiple commits) — progressive migration from `--webpack` to `--turbopack` with resolveAlias fixes, sub-path alias handling, and policy matrix updates

## Questions

### Resolved
- Q: Why was `--webpack` added to reception?
  - A: Blanket safety measure during Next.js 16 upgrade — not reception-specific
  - Evidence: commit `5e27a4655c` touched all 14 apps

- Q: Does reception use the shared `packages/next-config`?
  - A: No — it has its own standalone `next.config.mjs`
  - Evidence: `apps/reception/next.config.mjs` contains only `transpilePackages` and `compiler` options

- Q: Are there any `require()` calls in production code?
  - A: No — only one test file uses `require()`
  - Evidence: grep across `apps/reception/src/`

- Q: Is `@daminort/reservation-grid` a real dependency?
  - A: The npm package appears unused — reception has a custom replacement at `src/components/roomgrid/ReservationGrid.tsx` and `_g.tsx`. The import in `RoomGrid.tsx` may be dead code.
  - Evidence: `RoomGrid.tsx` imports from npm package but custom implementation exists alongside

- Q: Which apps have already migrated to Turbopack?
  - A: Only Brikette (both dev and build use Turbopack). All other 13 apps still use `--webpack`.
  - Evidence: `apps/brikette/package.json` scripts

### Open (User Input Needed)
- Q: Should reception adopt the shared `packages/next-config` or keep its own standalone config with Turbopack additions?
  - Why it matters: Adopting shared config gives automatic alias sync but adds complexity; standalone is simpler but requires manual alias maintenance for ~10+ sub-path aliases
  - Decision impacted: Config architecture, ongoing maintenance burden
  - Decision owner: Engineering lead
  - Default assumption (if any) + risk: Keep standalone config with minimal Turbopack additions (matches current pattern, lower risk). Risk: new sub-path imports added in future will silently break until someone adds an alias.

## Confidence Inputs
- Implementation: 85% — Brikette proves the path works; reception has no Babel/custom webpack/RSC complications. Sub-path alias resolution is the main unknown.
  - To >=90: Confirm sub-path imports from `@acme/design-system` and `@acme/ui` resolve correctly without individual aliases (or add them)
- Approach: 90% — Clear precedent from Brikette migration; standalone config approach is well-understood
  - To >=90: Already there
- Impact: 95% — Fully isolated to reception app; no shared package changes; no downstream dependents
  - To >=90: Already there
- Delivery-Readiness: 80% — All evidence gathered; policy matrix update path is clear; manual smoke testing needed post-migration
  - To >=90: Complete the migration and validate all routes work
- Testability: 75% — Jest tests are unaffected by bundler change; build validation is straightforward; CSS ordering and DnD context sharing require manual testing
  - To >=80: Add a basic dev-server smoke test (similar to Brikette's `brikette-smoke.mjs`)

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sub-path imports (`@acme/design-system/atoms`, etc.) resolve to `dist/` creating dual module identity | High | High | Add explicit sub-path aliases in Turbopack resolveAlias, or restructure imports to use bare specifiers |
| `@themes` CSS alias not resolved by Turbopack | High | High | Add `@themes` to `turbopack.resolveAlias` in reception's next.config.mjs |
| `react-dnd` context sharing breaks under Turbopack module deduplication | Medium | Medium | Manual smoke test of rooms-grid drag-and-drop; if broken, add `react-dnd` to resolveAlias |
| CSS ordering differs between webpack and Turbopack causing visual regressions | Low | Medium | Visual comparison of CSS-heavy pages (rooms-grid, email-automation, prepayments) |
| Firebase SDK tree-shaking difference causes larger bundles | Low | Low | Monitor bundle size; not a blocker for migration |
| `compiler.removeConsole` behaves differently with Turbopack | Low | Low | Turbopack uses SWC; this option should work identically |
| Ongoing alias maintenance: new sub-path imports break silently | Medium | Medium | Lint rule or CI check to detect unaliased sub-path imports; or adopt shared config to inherit aliases automatically |

## Planning Constraints & Notes
- Must-follow patterns:
  - Follow Brikette's migration pattern: extend or replicate shared config's `turbopack.resolveAlias`
  - Update policy matrix in `scripts/check-next-webpack-flag.mjs` to allow reception
  - Update policy tests in `scripts/__tests__/next-webpack-flag-policy.test.ts`
- Rollout/rollback expectations:
  - Rollback: re-add `--webpack` flags to package.json scripts and revert policy matrix
  - Low-risk rollback — single app, no shared state changes
- Observability expectations:
  - Build success/failure is the primary signal
  - Dev server route accessibility is the secondary signal

## Suggested Task Seeds (Non-binding)

1. **Add Turbopack config to reception's `next.config.mjs`** — Add `turbopack.resolveAlias` entries for `@acme/design-system`, `@acme/ui`, `@acme/lib`, and `@themes`. Add explicit sub-path aliases for the 3 `@acme/design-system` sub-paths and key `@acme/ui` sub-paths used by reception.

2. **Remove `--webpack` from reception's `package.json` scripts** — Update `dev` and `build` commands to drop the `--webpack` flag (Turbopack is the default in Next.js 16).

3. **Update webpack policy matrix** — Add reception to the `RULE_ALLOW_ANY` exception list in `scripts/check-next-webpack-flag.mjs` and update policy tests.

4. **Validate Turbopack build** — Run `next build` without `--webpack` and fix any compilation errors.

5. **Validate Turbopack dev** — Run `next dev` without `--webpack`, confirm HMR works, and smoke-test all 28 routes.

6. **Validate DnD and CSS-heavy pages** — Manual smoke test of rooms-grid (drag-and-drop), email-automation (CSS transitions), and prepayments (CSS transitions).

7. **Clean up dead `@daminort/reservation-grid` import** (optional) — Remove unused npm package import from `RoomGrid.tsx` if confirmed dead.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `next build` exits 0 without `--webpack`
  - `next dev` serves all routes without `--webpack`
  - Policy matrix updated and tests pass
  - Manual smoke test of DnD and CSS-heavy pages passes
- Post-delivery measurement plan:
  - Monitor dev experience (HMR speed, rebuild times) vs webpack baseline
  - Track any runtime errors in reception after migration

## Evidence Gap Review

### Gaps Addressed
- [x] Every non-trivial claim has evidence pointers (commit SHAs, file paths, grep results)
- [x] Dependency claims traced to real import sites (8 design-system files, 13 ui files, 90+ firebase files)
- [x] Integration boundaries inspected (API routes use `@acme/mcp-server` via `transpilePackages`)
- [x] Error/fallback paths considered (rollback is trivial: re-add `--webpack`)
- [x] Existing tests verified (Jest suite unaffected by bundler change)
- [x] Coverage gaps identified (manual smoke testing needed for CSS ordering and DnD)
- [x] Hypotheses are explicit (sub-path resolution is the primary risk)

### Confidence Adjustments
- Implementation confidence reduced from 90% to 85% due to sub-path alias uncertainty (8 design-system + 8 ui sub-path imports that bypass exact-match aliases)
- Testability reduced from 80% to 75% due to no automated visual regression or DnD functional testing

### Remaining Assumptions
- Firebase SDK v11 modular imports work with Turbopack without explicit aliases (based on standard ESM, not yet proven in this monorepo)
- `compiler.removeConsole` works identically with Turbopack's SWC compiler (strong assumption, SWC is shared)
- CSS ordering for global CSS files imported via side-effect imports matches webpack behavior (low-confidence assumption, needs manual validation)
- The `@themes` alias in CSS differs from the shared config's `@themes-local` key — even adopting the shared config would not resolve the `@import "@themes/base/tokens.css"` without an additional alias entry mapping `@themes` specifically

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan` to sequence the migration tasks
