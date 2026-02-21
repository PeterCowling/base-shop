---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: turbopack-i18n-alias-retirement
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/turbopack-i18n-alias-retirement/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Turbopack i18n Alias Retirement Fact-Find Brief

## Scope
### Summary
Brikette dev mode runs Turbopack. The next step is normalizing Brikette production build defaults from `next build --webpack` to `next build` (Turbopack default in Next.js 16). In this repository, Brikette already has app-local Turbopack alias wiring and `next build` (Turbopack) currently succeeds; the remaining migration work is callback-content hardening, not CI or Cloudflare deployment mechanics.

The shared `webpack()` callback in `@acme/next-config` still contains behavior that was historically required for webpack. Each entry has its own migration path. This brief scopes the **first and hardest shared entry: `@acme/i18n`**, whose alias exists because i18n source files use `.js` specifiers that previously required webpack `extensionAlias`. Retiring it establishes the dist-only consumer contract that makes i18n safe across webpack build, Turbopack build, and Node runtime. Subsequent briefs can address the remaining callback entries.

### Goals
- Remove dependency on shared webpack alias `@acme/i18n -> ../i18n/dist` in `@acme/next-config`.
- Normalize app-level i18n path mappings to a consistent dist-only consumer contract.
- Establish one durable i18n resolution contract across webpack/Turbopack/runtime.
- Add validation gates that catch regressions in both bundlers and Node execution.
- Unblock the remaining webpack callback migration by proving the incremental approach works.

### Non-goals
- Migrating all webpack callback entries to Turbopack in this pass (see Wider Context below).
- Refactoring unrelated i18n message content.
- Broad monorepo path-alias redesign for all workspace packages.

### Wider Context: Full Webpack Callback Migration
The `packages/next-config/next.config.mjs` webpack callback contains the following entries, each requiring a separate migration step before the `--webpack` flag can be dropped from `next build`:

| Entry | Current purpose | Status now | Migration path |
|---|---|---|---|
| `@` and `@acme/design-system/utils/style` (Brikette-local) | App-local aliasing for Brikette imports/style helper | Already mirrored in `apps/brikette/next.config.mjs` `turbopack.resolveAlias` | Keep validated; no blocking action in this brief |
| `@acme/i18n → ../i18n/dist` (shared) | Force dist resolution; source has `.js` specifier coupling | Blocked (this brief) | **This brief**: retire via dist-only package exports + tsconfig normalization |
| `extensionAlias` (`.js → [.ts, .tsx, .js]`) (shared) | Allow webpack to resolve `.js` imports from TS source | Needs assessment | Becomes redundant once workspace packages are consumed via dist; evaluate remaining source consumers |
| `@acme/design-system`, `@acme/lib`, `@acme/seo`, `@acme/cms-ui → src/` (shared) | Point webpack at source for these packages | Needs assessment | Assess whether package exports + dist-first tsconfig is sufficient, or if Turbopack alias config is needed |
| `node:* remapping` (shared) | Map `node:foo` → `foo` for webpack | Likely deletable | Turbopack handles `node:` protocol natively; remove after verification |
| `fs/module/path/url` client fallbacks (Brikette webpack) | Prevent client polyfill/module-not-found issues in webpack client bundles | Needs assessment | Confirm Turbopack equivalents are unnecessary, or add targeted Turbopack config if needed |

The `--webpack` flag on `next build` for Brikette can be dropped as default policy once remaining shared callback rows are resolved and validated. This brief clears the i18n row.

### Constraints & Assumptions
- Constraints:
  - Shared alias currently exists with explicit warning that removal breaks template-app builds: `packages/next-config/next.config.mjs`.
  - App-level tsconfig mappings are mixed today (`dist-only` and `src+dist` both exist), so migration must normalize explicitly.
  - Turbopack does not execute webpack callback logic (including `extensionAlias`) per prior probe evidence.
- Assumptions:
  - Long-term solution should remove alias debt, not add more app-local overrides.
  - Solution must preserve both browser bundling and Node/runtime compatibility for i18n imports.
  - Contract decision for this brief is fixed to `dist-only` consumer resolution (no branch split in plan handoff).
  - Next.js 16 is the installed version (`^16.1.6` in brikette); Turbopack production build support is stable and available now.

## Evidence Audit (Current State)
### Entry Points
- `packages/next-config/next.config.mjs` - shared webpack alias includes `@acme/i18n -> ../i18n/dist`.
- `apps/brikette/next.config.mjs` - Brikette already mirrors `@` and `@acme/design-system/utils/style` into `turbopack.resolveAlias`.
- `packages/template-app/next.config.mjs` - consumes shared config; template-app was historical break surface.
- `packages/template-app/package.json` - `prebuild` explicitly builds `@acme/i18n` before app build.
- `packages/template-app/tsconfig.json` - source-first i18n paths (`../i18n/src/*`, then `../i18n/dist/*`).
- `apps/brikette/tsconfig.json` - app-local i18n dist pin from Turbopack hardening (`dist` only).
- `.github/workflows/brikette.yml` - static export build/deploy uses `next build --webpack` then `wrangler pages deploy out`.
- `packages/config/tsconfig.base.json` - shared default i18n paths include source-first mapping.
- `packages/i18n/package.json` - package exports point to `dist/*`.
- `packages/i18n/src/index.ts` (HEAD) - internal imports use explicit `.js` specifiers.
- `docs/plans/archive/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md` - observed Turbopack failure from i18n source `.js` specifiers without webpack `extensionAlias`.
- `docs/plans/archive/turbopack-post-migration-hardening-archived-2026-02-20/plan.md` - marks i18n alias retirement as deferred follow-up debt.

### Patterns & Conventions Observed
- Shared alias debt is explicit:
  - `packages/next-config/next.config.mjs` line comment: removing alias currently breaks template-app Next builds.
- Source-first tsconfig mapping is widespread:
  - `packages/config/tsconfig.base.json` and multiple app tsconfigs map `@acme/i18n` to `src` before `dist`.
- Turbopack hardening introduced app-local exception:
  - Brikette now pins `@acme/i18n` to dist in `apps/brikette/tsconfig.json`.
- Brikette Turbopack groundwork is already present for app-local aliases:
  - `apps/brikette/next.config.mjs` defines `turbopack.resolveAlias` for `@` and `@acme/design-system/utils/style`.
- App-level i18n tsconfig mappings are mixed (audit of `apps/*/tsconfig*.json`):
  - `dist-only`: `apps/brikette/tsconfig.json`, `apps/handbag-configurator/tsconfig.json`, `apps/skylar/tsconfig.json`.
  - `src+dist`: `apps/cms/tsconfig.json`, `apps/xa-b/tsconfig.json`, `apps/xa-j/tsconfig.json`, `apps/xa-uploader/tsconfig.json`.
- CI and deploy mechanics are not a bundler-specific blocker for this step:
  - Brikette workflow builds to static `out/` and deploys via `wrangler pages deploy out`; deployment surface consumes static artifacts regardless of bundler.
- Template-app build path assumes dist artifact availability:
  - `packages/template-app/package.json` prebuild runs `pnpm --filter @acme/i18n build`.
- Historical repro confirms why this debt exists:
  - Archived Next.js 16 probe recorded Turbopack HTTP 500 on `@acme/i18n` source path due `.js` specifiers and missing webpack `extensionAlias` behavior.
  - Current brief treats this as historical evidence plus code-shape continuity (not a fresh same-day repro).

### Data & Contracts
- API/contracts:
  - Package contract: `@acme/i18n` exports resolve to `dist` (`packages/i18n/package.json`).
  - Build contract: template-app prebuild compiles i18n prior to webpack app build.
  - Config contract: shared next-config currently overrides package resolution via webpack alias.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js webpack/Turbopack resolver differences.
  - TypeScript path mappings in base and app tsconfigs.
- Downstream dependents:
  - Template-app, Brikette, Business-OS, and other apps importing `@acme/i18n` and subpaths.
- Likely blast radius:
  - Build/runtime failures in any app that resolves i18n source under Turbopack.
  - Potential Node runtime breakage if emitted i18n dist imports are not ESM-resolvable.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - App build gates via Next build (webpack).
  - Turbopack smoke probes for selected apps.
  - Node runtime import probe for package entrypoints.
- Commands run in this fact-find:
  - `pnpm --filter @acme/i18n build`
  - `pnpm --filter @acme/template-app build`
  - `pnpm --filter @apps/business-os build`
  - `pnpm --filter @apps/brikette build`
  - `cd packages/template-app && node -e "import('@acme/i18n/locales')..."`
  - `cd packages/template-app && node -e "import('@acme/i18n')..."`

#### Existing Test Coverage
| Area | Test Type | Files/Commands | Coverage Notes |
|---|---|---|---|
| Shared alias behavior | Static config | `packages/next-config/next.config.mjs` | Alias present and documented as required |
| Brikette Turbopack alias baseline | Static config | `apps/brikette/next.config.mjs` | `turbopack.resolveAlias` already includes `@` and `@acme/design-system/utils/style` |
| Historical Turbopack failure mode | Probe artifact | `docs/plans/archive/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md` | Observed `.js`-specifier i18n source failure under Turbopack |
| Current webpack app builds | Build | `pnpm --filter @acme/template-app build`, `pnpm --filter @apps/business-os build`, `pnpm --filter @apps/brikette build` | Pass in current state (Brikette emitted non-fatal env validation warnings but exited 0) |
| Current Brikette Turbopack production build baseline | Build | `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS=\"--require ./scripts/ssr-polyfills.cjs\" next build` | Passes in current state; callback-content hardening remains the migration focus |
| Package runtime import | Node probe | `node -e \"import('@acme/i18n')\"` and `node -e \"import('@acme/i18n/locales')\"` | Root import fails with `ERR_MODULE_NOT_FOUND` on `dist/fallbackChain`; `locales` subpath import succeeds |

#### Node Import Failure Diagnosis
- Observed failure:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../packages/i18n/dist/fallbackChain' imported from '.../packages/i18n/dist/index.js'`.
- Immediate cause in this workspace state:
  - `packages/i18n/dist/index.js` currently contains extensionless relative imports (`"./fallbackChain"`), which Node ESM does not resolve.
- Why this appeared:
  - Workspace has in-flight uncommitted edits in `packages/i18n/src/*` removing `.js` specifiers; rebuilding `@acme/i18n` emitted extensionless imports to `dist`.
  - `git show HEAD:packages/i18n/src/index.ts` still uses `.js` specifiers, so this failure is tied to local in-progress edits rather than an established repository baseline.

#### Coverage Gaps
- Untested paths:
  - No CI probe for "alias removed" scenario.
  - No dedicated regression test that asserts i18n resolution contract across webpack + Turbopack + Node.
- Extinct tests:
  - None found; gap is missing cross-resolver contract coverage.

#### Testability Assessment
- Easy to test:
  - Shared config/tsconfig contract checks (static).
  - Webpack app builds (template-app, business-os, brikette).
- Hard to test:
  - Turbopack behavior across multiple apps without inflating CI time.
  - Runtime import compatibility when workspace contains in-flight i18n source edits.
- Test seams needed:
  - One deterministic resolver contract suite with three gates:
    - webpack app builds
    - Turbopack smoke on at least two apps (Brikette + one non-Brikette)
    - Node import probes for `@acme/i18n` root + subpath.

## Recent Git History (Targeted)
- File-scoped history from `packages/next-config/next.config.mjs`:
  - `11fda5528f` adds alias line `"@acme/i18n": path.resolve(__dirname, "../i18n/dist")`.
  - `60b1d4b696` updates the alias comment to `Keep explicit i18n alias: removing this currently breaks template-app Next builds`.
  - Note: both commits are broad multi-file commits; above statements are file-scoped deltas verified with `git show <sha> -- packages/next-config/next.config.mjs`.
- `75633b4be8` marked post-migration hardening complete and left i18n alias retirement as explicit follow-up debt.

## Questions
### Resolved
- Q: Is alias debt still active in shared config?
  - A: Yes.
  - Evidence: `packages/next-config/next.config.mjs` alias + warning comment.

- Q: Are current webpack builds healthy with existing alias contract?
  - A: Yes.
  - Evidence: template-app, business-os, and brikette builds passed during this fact-find.

- Q: Is there strong evidence that Turbopack can fail when i18n resolves to source with `.js` specifiers?
  - A: Yes (historical observed repro).
  - Evidence: archived Next.js 16 blocker matrix (`@acme/i18n` module-not-found from source imports).

- Q: Is there active in-workspace churn in i18n source import specifiers?
  - A: Yes; uncommitted edits currently remove many `.js` specifiers in `packages/i18n/src/*`.
  - Evidence: local `git status` / `git diff` for i18n source files.

- Q: Which contract is selected for this follow-up: dist-only or source-compatible?
  - A: Dist-only consumer contract is selected for this brief and downstream planning.
  - Evidence: package export contract already targets `dist/*`; Turbopack historical source-resolution failure mode; mixed app overrides requiring normalization.
  - Decision owner: Peter (repo owner).
  - Follow-up boundary: if source-compatible consumption is desired later, treat it as a separate scoped initiative.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: exact alias locations, app-mapping matrix, and build probes are concrete, including a fresh Brikette Turbopack production build pass (`next build` without `--webpack`).
  - To >=90: execute one alias-removal spike in isolated commit with full validation matrix.

- Approach: 84%
  - Evidence basis: contract ambiguity removed; this brief now locks to dist-only consumer resolution aligned with package exports, and Brikette Turbopack alias baseline is already in place.
  - To >=90: add a dedicated CI resolver-contract job proving alias removal with no regressions.

- Impact: 85%
  - Evidence basis: alias debt spans shared config and app-local overrides; cleanup removes recurring Turbopack drift.
  - To >=90: add CI resolver-contract checks so regressions are caught automatically.

- Delivery-Readiness: 86%
  - Evidence basis: contract decision is now explicit; app-level mapping matrix and build evidence are documented; CI/deploy surfaces are confirmed non-blocking for this step.
  - To >=90: run alias-removal spike plus CI resolver-contract harness in one controlled branch.

- Testability: 82%
  - Evidence basis: webpack baseline now includes Brikette; Turbopack production baseline also passes for Brikette; Node failure has concrete error and diagnosis.
  - To >=90: implement explicit CI job with webpack + Turbopack + Node import probes.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Removing shared alias reintroduces template-app failure | Medium | High | Stage rollout behind matrixed build/smoke checks; keep rollback commit ready |
| Turbopack resolves i18n source path and fails on `.js` specifier expectations | Medium | High | Keep consumer resolution on dist-only contract; do not route Turbopack app graphs through i18n `src` during this follow-up |
| Node/runtime imports diverge from bundler behavior | Medium | Medium | Add Node import probes for root/subpath in CI |
| Partial migration leaves mixed app-level overrides | Medium | Medium | Use audited app matrix to drive explicit normalization tasks (not just Brikette) |
| In-flight uncommitted i18n source edits alter baseline during alias retirement | High | Medium | Require baseline freeze checkpoint: land or revert i18n specifier edits before alias-removal spike |
| CI build graph does not guarantee `@acme/i18n` freshness before consumers | Low-Medium | High | Validate `turbo.json` `build -> ^build` dependency and keep consumer prebuild hooks where needed |

## Planning Constraints & Notes
- Must-follow patterns:
  - No app-local alias hacks as terminal state.
  - Shared resolution contract must be documented and test-enforced.
  - Preserve current production build reliability while migrating.
- Rollout/rollback expectations:
  - Rollout in phases: baseline freeze (i18n source edits) -> alias-removal spike -> matrix validation -> cleanup.
  - Rollback: reinstate shared alias quickly if matrix detects regressions.
- Observability expectations:
  - Capture CI evidence for webpack builds, Turbopack smokes, and Node import probes.

## Suggested Task Seeds (Non-binding)
1. Freeze i18n source baseline: land or revert uncommitted `.js` specifier edits in `packages/i18n/src/*` before alias-removal spike.
2. Codify i18n resolution contract (dist-only for consumers, source for package-internal development only).
3. Add resolver contract test harness (webpack builds + Turbopack smokes + Node import probes).
4. Remove shared `@acme/i18n` webpack alias from `@acme/next-config` once harness is green.
5. Normalize `src+dist` app mappings (`apps/cms`, `apps/xa-b`, `apps/xa-j`, `apps/xa-uploader`) to dist-only/dist-first consumer paths using the audited matrix.
6. After matrix normalization, evaluate whether Brikette-specific i18n mapping is redundant; remove only if equivalent behavior is preserved by shared defaults.
7. Document the final i18n contract in `docs/tsconfig-paths.md` with explicit i18n exception/rule.

Note: completing tasks 1–7 clears the i18n row in the webpack callback migration table (Wider Context above). The remaining rows (`extensionAlias`, source aliases, `node:*`) are out of scope for this plan and should be addressed in follow-up briefs.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Shared alias removed.
  - No unresolved `src+dist` app mappings remain for `@acme/i18n` in production consumer paths.
  - Matrixed webpack + Turbopack + Node probes pass for agreed app set.
  - Documentation updated with explicit i18n resolution contract.
- Post-delivery measurement plan:
  - Monitor CI for resolver regressions over first week.
  - Track whether any app reintroduces ad-hoc i18n aliasing.
  - Confirm i18n row is cleared in the webpack callback migration table, then initiate follow-up brief for remaining entries.

## Evidence Gap Review
### Gaps Addressed
- Re-validated current build health for template-app, business-os, and brikette.
- Reconfirmed shared alias location and historic reason.
- Added runtime probe showing root import sensitivity under current workspace state, with explicit error diagnosis.
- Added app-level tsconfig mapping audit to replace unsupported blanket likelihood assumptions.

### Confidence Adjustments
- Raised implementation/approach/delivery/testability above 80 after locking contract decision and adding missing baseline evidence.
- Kept <90 because resolver-contract CI harness and alias-removal spike are still future work.

### Remaining Assumptions
- Dist-only contract remains acceptable for long-term maintenance.
- In-flight uncommitted i18n source edits are not yet considered stable baseline.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none (contract decision is explicit in this brief)
- Recommended next step:
  - `/lp-do-plan docs/plans/turbopack-i18n-alias-retirement/fact-find.md`
