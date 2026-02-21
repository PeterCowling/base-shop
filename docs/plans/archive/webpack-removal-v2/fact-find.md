---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21
Last-factchecked: 2026-02-21
Feature-Slug: webpack-removal-v2
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/webpack-removal-v2/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Webpack Removal V2 Fact-Find Brief

## Scope

### Summary

Phase 1 (`docs/plans/brikette-webpack-removal/plan.md`, Status: Complete 2026-02-21) removed all
webpack-specific runtime surface from the brikette app source — `import.meta.webpackContext`,
`webpackInclude`/`webpackPrefetch` magic comments, `webpackGlob.ts`, and the
`NormalModuleReplacementPlugin` from the shared config. However, both `webpack()` config callback
functions remain in place:

1. `apps/brikette/next.config.mjs:136` — brikette-specific webpack callback (aliases + fallbacks)
2. `packages/next-config/next.config.mjs:30` — shared webpack callback (used by 13 apps)

These remain because brikette's **production build** (`next build` with `OUTPUT_EXPORT=1`) still
uses webpack. Dev already uses Turbopack (Next.js 15 default). V2 scope is to switch brikette's
production build to Turbopack, enabling removal of the brikette-specific `webpack()` callback.

**Why this matters:** Dev uses Turbopack but production uses webpack, creating a bundler parity gap
where dev behavior can diverge from production. Removing the webpack callback eliminates 27 lines of
config that duplicate the Turbopack `resolveAlias` block (lines 136–162), aligns the build pipeline with Next.js 15's
intended direction, and removes the last brikette-specific webpack surface after Phase 1 cleanup.

The **shared** callback in `packages/next-config/next.config.mjs` is **explicitly out of scope** —
it serves 13 other apps (cms, reception, cover-me-pretty, etc.) that all explicitly pass
`--webpack` and are not being migrated.

### Goals

- Switch brikette `next build` to `--turbopack` in CI and local scripts.
- Verify that `OUTPUT_EXPORT=1 next build --turbopack` (static export) produces a correct `out/`
  artifact deployable to Cloudflare Pages.
- Remove the `webpack()` callback from `apps/brikette/next.config.mjs` (the two aliases and the
  `resolve.fallback` block are already mirrored in Turbopack config or are not needed under
  Turbopack).
- Update the `check-next-webpack-flag.mjs` policy matrix and tests if needed (Brikette is already
  on `RULE_ALLOW_ANY`, so likely a no-op).

### Non-goals

- Remove `webpack()` callback from `packages/next-config/next.config.mjs` — serves 13 webpack
  apps; no change.
- Remove `--webpack` from any other app.
- Remove the root `webpack: ^5.104.1` devDependency (still needed by 13 apps and Storybook).
- Storybook webpack migration (separate concern).
- Breakfast-menu multi-locale restoration via `import.meta.glob` replacement (separate follow-on).
- `emailService.ts` dynamic require refactor (unrelated).

### Constraints & Assumptions

- Constraints:
  - The brikette static export build pipeline must produce an `out/` dir suitable for Cloudflare
    Pages — same acceptance criterion as today.
  - The catch-all route hide-and-restore pattern (`mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off"`)
    must continue to work unchanged.
  - Pre-commit hooks must pass; `--no-verify` is prohibited.
  - `packages/next-config/next.config.mjs` webpack callback must be left unchanged.
  - All brikette tests must remain green.
- Assumptions:
  - Next.js 15 Turbopack supports `output: 'export'` (static export). **Unverified — see Open
    Questions Q1.** This is the primary risk gate.
  - The two aliases in the brikette webpack callback (`@` and `@acme/design-system/utils/style`)
    are already present in the Turbopack `resolveAlias` block — confirmed by reading both configs.
  - The `resolve.fallback` entries (`fs`, `module`, `path`, `url` → `false`) are a
    webpack-specific workaround. Turbopack enforces server/client boundaries natively and does not
    need explicit fallback overrides. **Assumed safe to drop — see Open Questions Q2.**

---

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/next.config.mjs` — brikette Next.js config; contains `webpack()` callback and
  `turbopack.resolveAlias` block; production build reads `OUTPUT_EXPORT` env var
- `apps/brikette/package.json` `build` script — `cross-env NODE_OPTIONS="--require
  ./scripts/ssr-polyfills.cjs" next build` — no `--turbopack` flag today
- `.github/workflows/brikette.yml` — CI production build command:
  `OUTPUT_EXPORT=1 ... pnpm exec next build` — the `pnpm exec next build` call drives the static
  export; no `--turbopack`
- `scripts/check-next-webpack-flag.mjs` — policy enforcement; Brikette already on `RULE_ALLOW_ANY`
  for both `dev` and `build`

### Key Modules / Files

- `apps/brikette/next.config.mjs:128–135` — Turbopack `resolveAlias` block (current coverage)
- `apps/brikette/next.config.mjs:136–162` — webpack callback (target for removal)
- `packages/next-config/next.config.mjs:21–29` — shared Turbopack `resolveAlias` block
- `packages/next-config/next.config.mjs:30–98` — shared webpack callback (out of scope; keep)
- `packages/next-config/index.mjs` — `baseConfig` definition; no `webpack` key — the `baseConfig`
  check on line 32 (`if (typeof baseConfig.webpack === "function")`) always evaluates to false
  today; this guard is inert
- `scripts/check-next-webpack-flag.mjs` — policy matrix; Brikette `APP_COMMAND_POLICY_MATRIX`
  entry uses `RULE_ALLOW_ANY` for both `dev` and `build`
- `scripts/__tests__/next-webpack-flag-policy.test.ts` — TC-01, TC-07 verify Brikette exemption
- `.github/workflows/brikette.yml` — CI build command; `pnpm exec next build` target
- `apps/brikette/package.json:7` — `postbuild` script runs `generate-public-seo.ts` automatically
  after every `build`; must be validated for Turbopack output structure compatibility

### Patterns & Conventions Observed

- **Turbopack aliases already mirrored**: `apps/brikette/next.config.mjs` Turbopack block (lines
  128–135) already contains all aliases from the webpack block:
  - `@` → `apps/brikette/src` ✓
  - `@acme/design-system/utils/style` → `designSystemStylePath` ✓
  - Shared aliases (`@acme/design-system`, `@acme/cms-ui`, `@acme/lib`, `@acme/seo`,
    `@themes-local`) inherited from shared turbopack block ✓
- **`resolve.fallback` is webpack-only**: The `{ fs: false, module: false, path: false, url: false
  }` block (lines 151–158) is a webpack client-bundle safeguard. The source-code comment at
  `apps/brikette/next.config.mjs:148–150` explains: *"The brikette app still has a few Node-only
  helpers (fs loaders, createRequire). Those are guarded at runtime, but webpack needs explicit
  'no polyfill' fallbacks for the client build to avoid 'Module not found' errors."* This means
  webpack's client compilation encounters these module references during analysis even though no
  client component directly imports them. Under Turbopack, server/client boundaries are enforced
  at the component level rather than via fallback overrides — Turbopack's different architecture
  may not replicate this analysis-time exposure.
- **Node.js imports in production source are server-only**: Searched `apps/brikette/src/*.{ts,tsx}`
  (excluding `test/`, `__tests__/`). Four production files import `fs`, `path`, `url`, `module`:
  - `src/lib/seo-audit/index.ts` — imports `fs/promises`, `path` (server-only SEO audit utility)
  - `src/locales/_guides/node-loader.ts` — imports `fs`, `path` (server-only loader)
  - `src/locales/_how-to-get-here/node-loader.ts` — imports `fs`, `path` (server-only loader)
  - `src/locales/guides.fs.ts` — imports `createRequire` from `module`, `fileURLToPath` from `url`
    (server-only file-system guides reader)
  All four files are server-side code paths. None are imported by client components.
- **`baseConfig.webpack` is always undefined**: `packages/next-config/index.mjs` exports
  `baseConfig` with no `webpack` key. The guard in `packages/next-config/next.config.mjs:32`
  (`if (typeof baseConfig.webpack === "function")`) is always false. The chain call
  `apps/brikette/next.config.mjs:137` (`if (typeof sharedConfig.webpack === "function")`) calls
  into this and does execute (because `sharedConfig` is the fully merged result from
  `packages/next-config/next.config.mjs` which does have a `webpack` key).

### Data & Contracts

- Types/schemas/events:
  - `next.config.mjs` webpack callback signature: `(config: WebpackConfig, context: {isServer,
    nextRuntime, dev, webpack}) => WebpackConfig` — standard Next.js type; removal has no external
    type contract
  - `turbopack.resolveAlias` shape: `Record<string, string>` — same on both shared and brikette
    configs
- Persistence: None — config-only change.
- API/contracts:
  - `check-next-webpack-flag.mjs` policy matrix: Brikette is `RULE_ALLOW_ANY`; adding `--turbopack`
    to the build command does not violate the policy.

### Dependency & Impact Map

- Upstream dependencies:
  - `apps/brikette/next.config.mjs` inherits from `@acme/next-config/next.config.mjs` via spread.
    The `sharedConfig.webpack` function is invoked by brikette's webpack callback. Removing
    brikette's webpack callback severs this chain — the shared webpack callback continues to run
    for the 13 other apps unchanged.
- Downstream dependents:
  - Brikette CI: `.github/workflows/brikette.yml` — `build-cmd` will need `--turbopack` added to
    `pnpm exec next build`
  - `apps/brikette/package.json` `build` script — needs `--turbopack` flag
  - The static export `out/` directory and Cloudflare Pages deployment — functionally unchanged if
    the turbopack build succeeds
- Likely blast radius:
  - **Brikette only.** The shared config is not modified. No other app is affected.
  - If `next build --turbopack --output export` is not yet stable, the CI build fails; rollback is
    reverting the `--turbopack` flag addition (one-line change).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner), Playwright (e2e), Cypress
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`
- CI integration: `brikette.yml` runs full test suite before build

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Webpack policy enforcement | Unit | `scripts/__tests__/next-webpack-flag-policy.test.ts` | TC-01 (Brikette dev exempt), TC-07 (Brikette build exempt) — both pass with `RULE_ALLOW_ANY` |
| i18n resolver contract | Integration | `scripts/__tests__/i18n-resolver-contract.test.ts` | Brikette explicitly excluded as `--webpack` surface; will need no change |
| Build smoke test | E2E smoke | `apps/brikette/scripts/e2e/brikette-smoke.mjs` | Smoke script already launches `next dev` without explicit `--turbopack`; Turbopack is implicit via Next.js 15 default |
| Turbopack smoke CI job | CI | `.github/workflows/brikette.yml` `turbopack-smoke` job | Runs `brikette-smoke.mjs --mode=turbopack` — validates Turbopack dev already |

#### Coverage Gaps

- Untested paths:
  - **`next build --turbopack` for brikette** — no existing CI test. The turbopack-smoke job only
    validates `next dev`. Build output correctness under Turbopack (routes, static pages, cache
    headers) is uncovered.
  - Static export artifact validation under Turbopack — `out/` dir structure not tested.
- Extinct tests:
  - None identified in this area.

#### Testability Assessment

- Easy to test: `next build --turbopack` can be run locally and in CI; success/failure is binary.
- Hard to test: Subtle differences in static export output (route ordering, file hashing, chunk
  names) — unlikely to matter for Cloudflare Pages deployment but not easily asserted.
- Test seams needed: Add a CI step (or expand the `turbopack-smoke` job) to run `OUTPUT_EXPORT=1
  next build --turbopack` and assert `out/` exists and is non-empty after the successful migration.

#### Recommended Test Approach

- Unit tests for: No unit tests needed; config change only.
- Integration tests for: Run the full brikette Jest suite unchanged (no changes to source).
- E2E tests for: Expand `turbopack-smoke` or add a separate `turbopack-build` CI job that runs
  `OUTPUT_EXPORT=1 next build --turbopack` and validates `out/index.html` exists.
- Contract tests for: Verify `check-next-webpack-flag.mjs --all` still passes (Brikette already
  exempt; should be a no-op but should be confirmed).

### Recent Git History (Targeted)

- `docs/plans/brikette-webpack-removal/` — Phase 1 plan and verification report (commits
  `b23b379e9e` through `2dc4118631`, 2026-02-20 to 2026-02-21). All 12 tasks complete.
- `cd9c24dc28` — Added turbopack resolveAlias block to `packages/next-config/next.config.mjs`
  mirroring webpack source aliases. **This is the key enabler for v2: the shared turbopack aliases
  are in place and brikette's config merges them.**
- `2dc4118631` — TASK-12 verification; confirmed zero `import.meta.webpackContext` in brikette src.
  Neither `next.config.mjs` was modified — the webpack callbacks were left in place intentionally.
- `a88a27a72e` — TASK-01 cleanup: removed unused `webpack` parameter from shared config after
  NormalModuleReplacementPlugin removal in an earlier commit. This was the last shared-config
  change in Phase 1.

---

## External Research (If Needed)

- Finding: Next.js 15 Turbopack is stable for `next build` as of Next.js 15.0 release. The
  `--turbopack` flag on `next build` is the documented path. However, compatibility with
  `output: 'export'` (static export mode) needs explicit verification — static export is a
  separate code path in Next.js and Turbopack's coverage of it may differ from webpack's. Source:
  Next.js 15 release notes and Turbopack migration guide.

---

## Questions

### Resolved

- Q: Does Turbopack `resolveAlias` already cover all aliases in the brikette webpack callback?
  - A: Yes — confirmed by reading both config files. `@` → `src` and
    `@acme/design-system/utils/style` → `designSystemStylePath` are in the Turbopack block
    (lines 132–133). Shared aliases are inherited from the shared turbopack block.
  - Evidence: `apps/brikette/next.config.mjs:128–135`, `packages/next-config/next.config.mjs:21–29`

- Q: Does `baseConfig` have a webpack function that is being used?
  - A: No. `packages/next-config/index.mjs` exports `baseConfig` with no webpack key. The guard
    `typeof baseConfig.webpack === "function"` in the shared next-config is always false. The guard
    in brikette's callback does execute but the call it makes is into the shared config's webpack
    function (not baseConfig).
  - Evidence: `packages/next-config/index.mjs:36–73`

- Q: Do any brikette client-side production files import `fs`, `path`, `url`, or `module`?
  - A: No. The four production files that import these modules (`seo-audit/index.ts`,
    `_guides/node-loader.ts`, `_how-to-get-here/node-loader.ts`, `guides.fs.ts`) are all
    server-only code paths. No client component tree imports them. The `resolve.fallback` was
    defensive webpack configuration, not a required runtime fix.
  - Evidence: `grep -r "from ['\"]fs" apps/brikette/src/*.{ts,tsx}` — only server-only files match

- Q: Does the `check-next-webpack-flag.mjs` policy need changing?
  - A: No. Brikette is already `RULE_ALLOW_ANY` for both `dev` and `build`. Adding `--turbopack`
    to the build command is permitted by the existing policy matrix.
  - Evidence: `scripts/check-next-webpack-flag.mjs` APP_COMMAND_POLICY_MATRIX

### Open (User Input Needed)

- Q1: Does `OUTPUT_EXPORT=1 next build --turbopack` work in Next.js 15?
  - Why it matters: This is the primary go/no-go gate for the entire migration. If Turbopack does
    not support `output: 'export'`, the brikette webpack callback must remain indefinitely.
  - Decision impacted: Whether to attempt the build flag change at all.
  - Decision owner: Engineering
  - Default assumption (if any) + risk: Assume it works based on Next.js 15 Turbopack stability
    claims. Risk: if it fails, the fix is reverting one flag (low blast radius), but could surface
    build regressions that need diagnosis.
  - Contingency if NO: Scope dies. The brikette webpack callback remains until either (a) Turbopack
    adds `output: 'export'` support in a future Next.js release, or (b) brikette migrates from
    static export to Cloudflare Worker deployment (separate scope). No intermediate workaround
    exists.

- Q2: Are there any client-side modules that produce Turbopack module-not-found errors for `fs`,
  `path`, `url`, or `module` without the `resolve.fallback`?
  - Why it matters: If any transitive dependency (e.g., from `@acme/lib`, `@acme/seo`) imports
    a Node built-in in a way that reaches client bundles under Turbopack, removing the fallback
    will cause a build error.
  - Decision impacted: Whether the fallback block can be safely dropped or must be replaced with
    a Turbopack-native mechanism (e.g., marking the package as external).
  - Decision owner: Engineering
  - Default assumption + risk: Server-only files are not included in client bundle; fallback not
    needed. Risk: Low — if a module-not-found error appears, it is caught at build time (not
    silently at runtime).

---

## Confidence Inputs

- Implementation: 72%
  - Basis: Both config files fully read. The two aliases are already in Turbopack. The fallback is
    defensive webpack-ism. However, Q1 (Turbopack static export compatibility) is the primary
    go/no-go gate and is unverified. If Q1 is YES, implementation is straightforward (~90%).
    Weighted by Q1 uncertainty: 72%.
  - To reach >=80: Answer Q1 by running `OUTPUT_EXPORT=1 next build --turbopack` locally.
  - To reach >=90: Q1 confirmed YES + postbuild script validated.

- Approach: 75%
  - Basis: The approach (add `--turbopack` to build command, remove webpack callback) is
    well-understood. Turbopack resolveAlias parity confirmed. Server/client boundary analysis
    complete for the fallback items. Held at 75% (not 80%) because the approach's viability
    depends entirely on Q1.
  - To reach >=80: Answer Q1 by running `OUTPUT_EXPORT=1 next build --turbopack` locally.
  - To reach >=90: Q1 confirmed + `out/` structure matches current webpack output.

- Impact: 90%
  - Basis: Blast radius is brikette-only. Shared config unchanged. If the build fails it's caught
    at CI, not in production. Rollback is one-line flag revert.
  - To reach >=90: Already at 90%.

- Delivery-Readiness: 78%
  - Basis: All groundwork from Phase 1 is complete. The Turbopack resolveAlias blocks are in
    place. The only gate is Q1 verification.
  - To reach >=80: Answer Q1 by running the build AND verify `postbuild` script compatibility.
  - To reach >=90: Full CI green on the `--turbopack` build in a PR.

- Testability: 85%
  - Basis: Success/failure is binary (build passes or not). Existing turbopack-smoke job covers
    dev; a build job can be added for production validation.
  - To reach >=85: Already at 85%.
  - To reach >=90: Add CI build job that runs the full turbopack static export and validates
    `out/en/index.html` exists.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `next build --turbopack` + `output: 'export'` not supported in Next.js 15 | Medium | High (blocks entire v2 scope) | Verify locally before committing to the task; rollback is one-line flag revert |
| Transitive client-side import of Node.js built-in causes module-not-found without `resolve.fallback` | Low | Medium (caught at build time, not runtime) | Add `--turbopack` build to CI early; fix by marking affected package as server-external |
| Turbopack static export output differs from webpack output (route structure, hash format) | Low | Medium (Cloudflare Pages deployment breaks) | Validate `out/` directory structure post-build; compare critical paths (`out/en/index.html`, `out/_next/static/`) |
| `ssr-polyfills.cjs` incompatible with Turbopack build mode | Low | Low (build would fail fast) | No evidence of incompatibility; `ssr-polyfills.cjs` is a Node.js `--require` preload, bundler-agnostic |
| `generate:static-aliases` post-build script incompatible with Turbopack output structure | Low | Low (aliases script operates on `out/`; not bundler-specific) | Verify the aliases script after a Turbopack build run |
| Catch-all route hide-and-restore pattern breaks under Turbopack | Very Low | High (guide pages 404 in production) | The mv/restore pattern operates on the source tree, not the bundler; should be transparent |
| `postbuild` script (`generate-public-seo.ts`) depends on webpack output structure | Low | Medium (SEO metadata missing or malformed in production) | Validate postbuild output after Turbopack build in TASK-01 |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Modify only `apps/brikette/next.config.mjs` and `apps/brikette/package.json`. Do not touch
    `packages/next-config/next.config.mjs`.
  - Keep `turbopack.resolveAlias` block unchanged (already correct).
  - Update `.github/workflows/brikette.yml` `build-cmd` for both staging and production.
  - Pre-commit hooks must pass.
- Rollout/rollback expectations:
  - Rollout: Single PR; CI validates before merge. Cloudflare Pages deployment is the final gate.
  - Rollback: Remove `--turbopack` from build command; restore webpack callback from git. Two-line
    change. No data changes.
- Observability expectations:
  - Build log will show `Turbopack` instead of `webpack` in the bundler output header.
  - Monitor first deployment to Cloudflare Pages: navigate `/en/` and a guide page to confirm
    content renders.

---

## Suggested Task Seeds (Non-binding)

- **TASK-01** (INVESTIGATE/S): Run `OUTPUT_EXPORT=1 pnpm exec next build --turbopack` locally;
  document result (pass/fail, errors, `out/` structure). This is the go/no-go gate for the plan.
- **TASK-02** (IMPLEMENT/S): Add `--turbopack` to `apps/brikette/package.json` `build` script and
  update `.github/workflows/brikette.yml` `build-cmd` (both staging and production).
- **TASK-03** (IMPLEMENT/S): Remove the `webpack()` callback from `apps/brikette/next.config.mjs`
  (lines 136–162). The `resolve.fallback` block, `@` alias, and `@acme/design-system/utils/style`
  alias are all already covered by the Turbopack block or are not needed under Turbopack.
- **TASK-04** (IMPLEMENT/S): Expand turbopack-smoke CI job (or add a dedicated `turbopack-build`
  job) to run `OUTPUT_EXPORT=1 next build --turbopack` and assert `out/en/index.html` exists.
- **TASK-05** (VERIFY/S): Confirm `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`
  and `scripts/check-next-webpack-flag.mjs --all` pass after TASK-02 and TASK-03.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `out/` directory produced by `OUTPUT_EXPORT=1 next build --turbopack`
  - `apps/brikette/next.config.mjs` has no `webpack()` key
  - CI green on brikette workflow
- Post-delivery measurement plan:
  - Monitor Cloudflare Pages deployment: core routes (`/en/`, guide pages) render non-empty
  - Compare build time before/after (Turbopack is typically faster)

---

## Evidence Gap Review

### Gaps Addressed

- **Citation integrity**: All claims traced to specific file:line evidence. The four production
  files importing Node built-ins identified and confirmed server-only by reading their import
  context.
- **Boundary coverage**: The shared webpack config boundary (13 other apps) is explicitly
  scoped out. The client-bundle boundary for `resolve.fallback` was investigated via source grep.
- **Testing coverage**: Existing turbopack-smoke CI job confirmed as dev-only; coverage gap for
  Turbopack build identified and a new CI job proposed in TASK-04.
- **Confidence calibration**: Implementation (72%), Approach (75%), and Delivery-Readiness (78%)
  all held below 80% due to unverified Q1. Scores reflect current evidence state, not post-
  verification expectations.

### Confidence Adjustments

- Implementation held at 72% (not 90%) because Q1 — Turbopack static export compatibility — is
  unverified and is the primary go/no-go gate. A local build run confirming Q1 would push to 90%+.
- Approach held at 75% for the same Q1 dependency.
- Delivery-Readiness held at 78%. Will cross 80% once Q1 is answered and postbuild script validated.

### Remaining Assumptions

- Turbopack `next build --turbopack` is compatible with `output: 'export'` in Next.js 15. **Must
  be verified in TASK-01 before TASK-02 and TASK-03 proceed.**
- `resolve.fallback` entries are truly not needed under Turbopack for brikette's production client
  bundle. Risk is low (build-time error if wrong, not silent runtime failure).
- `ssr-polyfills.cjs` is bundler-agnostic (a Node.js `--require` preload). No evidence of
  incompatibility.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - Q1 must be answered in TASK-01 (investigative gate) before TASK-02 and TASK-03 execute. The
    plan should sequence TASK-01 first with explicit go/no-go output.
- Recommended next step:
  - `/lp-do-plan` to produce a sequenced 5-task plan. TASK-01 gates TASK-02 and TASK-03;
    TASK-04 and TASK-05 follow after TASK-03.

## Phase 1 Completion Reference

For full context on what was already removed, see:
- `docs/plans/brikette-webpack-removal/plan.md` — Phase 1 plan (Status: Complete)
- `docs/plans/brikette-webpack-removal/verification-report.md` — TC-01 through TC-04 evidence
