---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: turbopack-brikette-build-flag-retirement
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/turbopack-brikette-build-flag-retirement/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Brikette Build Flag Retirement Fact-Find Brief

## Scope
### Summary
This brief covers the next step after i18n alias retirement: moving Brikette production build defaults from webpack (`next build --webpack`) to Turbopack (`next build`) while preserving CI/deploy safety and fail-closed repo policy checks.

Current evidence shows Brikette Turbopack production builds already pass (both normal and static-export workflow shape), and Cloudflare deploy consumes static `out/` artifacts independent of bundler. The remaining blockers are policy/contracts, not core build capability:
- command policy matrix still requires webpack for Brikette `build`
- Brikette deploy workflow still calls `next build --webpack`
- resolver harness currently mixes two non-equivalent Brikette surfaces (full script lifecycle vs direct `next build`), creating a lifecycle-coverage design decision for post-migration validation

### Goals
- Retire `--webpack` from Brikette build commands in app scripts and deploy workflow build-cmds.
- Update policy enforcement so Brikette `build` is allowed without `--webpack` while keeping fail-closed defaults for other apps.
- Realign resolver-contract checks so Brikette lifecycle coverage (prebuild/build/postbuild) remains explicit after the bundler switch.
- Add continuous enforcement for static-export build-shape safety (not just one-time local probes).

### Non-goals
- Migrating template-app, business-os, or cms production builds to Turbopack.
- Removing remaining shared webpack callback customizations in `packages/next-config/next.config.mjs` for non-Brikette apps.
- Changing Cloudflare Pages deployment model or environment topology.
- Refactoring unrelated Brikette feature/content code.

### Constraints & Assumptions
- Constraints:
  - Policy checks are wired into local/CI gates and must stay fail-closed (`scripts/git-hooks/pre-commit.sh`, `scripts/validate-changes.sh`, `.github/workflows/merge-gate.yml`).
  - Brikette deploy workflow uses a route hide/restore shell pattern around static export; this behavior must remain intact.
  - Shared config still serves webpack consumers (template-app/business-os), so this step must stay Brikette-scoped.
- Assumptions:
  - Next.js `^16.1.6` Turbopack production build path is sufficiently stable for Brikette's current graph.
  - Non-fatal env warnings (`CART_COOKIE_SECRET`) are known and currently non-blocking for static export completion.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/package.json:5-9` - `dev` has no `--webpack`; `build` still `next build --webpack`.
- `.github/workflows/brikette.yml:91-99` and `.github/workflows/brikette.yml:123-130` - staging/production build-cmds still invoke `pnpm exec next build --webpack`.
- `scripts/check-next-webpack-flag.mjs:23-27` - Brikette policy matrix allows `dev` without webpack but still requires webpack for `build`.
- `scripts/__tests__/next-webpack-flag-policy.test.ts` - tests explicitly assert Brikette build without `--webpack` fails.
- `scripts/check-i18n-resolver-contract.mjs:23-27` and `scripts/check-i18n-resolver-contract.mjs:129-143` - default checks include Brikette build via app script path plus a separate direct Turbopack build step.
- `apps/brikette/next.config.mjs:128-135` - Brikette already has `turbopack.resolveAlias` for local aliasing.
- `.github/workflows/brikette.yml:73-75` + `apps/brikette/scripts/e2e/brikette-smoke.mjs` - Turbopack dev smoke is already in CI.

### Key Modules / Files
- `apps/brikette/package.json` - authoritative app script contract.
- `.github/workflows/brikette.yml` - deploy build commands + Turbopack smoke stage.
- `scripts/check-next-webpack-flag.mjs` - centralized policy gate.
- `scripts/__tests__/next-webpack-flag-policy.test.ts` - policy regression suite.
- `scripts/validate-changes.sh` - local range/staged gate wiring.
- `.github/workflows/merge-gate.yml` - CI gate wiring.
- `scripts/check-i18n-resolver-contract.mjs` - cross-surface resolver harness.
- `apps/brikette/next.config.mjs` - current Turbopack + webpack config seams.
- `packages/next-config/next.config.mjs` - shared webpack callback (kept out of scope except impact analysis).

### Patterns & Conventions Observed
- Policy fan-out is single-source:
  - `check-next-webpack-flag.mjs` is called by pre-commit, validate-changes, and merge-gate.
- Brikette is already partially app-aware in policy:
  - `dev` is `allow-any`, `build` remains `require-webpack`.
- CI already accepts Turbopack dev runtime checks:
  - dedicated Turbopack smoke job exists and is greenable by route assertions.
- Brikette resolver harness surfaces are not pure duplicates:
  - `webpack:brikette` runs `pnpm --filter @apps/brikette build` (includes prebuild + postbuild hooks)
  - `turbopack:brikette-build` runs direct `next build` (no pre/post hook coverage)
- Static export safety is currently point-in-time evidence:
  - local probe passed with route hide/restore + `OUTPUT_EXPORT=1 next build` + alias generation, but no dedicated continuous enforcement surface exists yet.

### Data & Contracts
- Command policy contract:
  - `scripts/check-next-webpack-flag.mjs` enforces `next dev/build` flags by app/command matrix.
- Build lifecycle contract:
  - Brikette script-level `build` runs prebuild (`generate:guide-link-labels`, telemetry build), bundler build, then postbuild (`generate-public-seo.ts`).
- Static export contract:
  - Brikette staging/prod build-cmd generates static export and aliases before deploy.
  - Deploy consumes `out/` artifacts (deploy step itself is bundler-agnostic).
- Resolver harness contract:
  - i18n resolver script validates webpack/template-app + business-os + Brikette script build, explicit Turbopack Brikette direct build, and Node imports.
  - After migration, harness must intentionally choose whether to preserve lifecycle coverage, bundler coverage, or both.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js 16 Turbopack build behavior.
  - policy checker matrix and tests.
  - reusable deploy workflow command-string execution.
- Downstream dependents:
  - Brikette local builds (`pnpm --filter @apps/brikette build`).
  - Brikette staging/production workflow runs.
  - merge gate and pre-commit enforcement behavior.
  - resolver contract reporting accuracy and coverage scope.
- Likely blast radius:
  - High if policy defaults are relaxed globally by mistake.
  - High if resolver redesign accidentally removes Brikette lifecycle validation.
  - Medium if workflow build-cmd changes without preserving route restore and alias-generation steps.
  - Medium if static-export regression detection remains one-off/manual.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest (policy script tests).
  - GitHub Actions smoke/build jobs.
  - Scripted contract checks (`check-next-webpack-flag`, `check-i18n-resolver-contract`).
- Commands run in this fact-find:
  - `node scripts/check-next-webpack-flag.mjs --all` (pass)
  - `pnpm -w run test:governed -- jest -- --runInBand scripts/__tests__/next-webpack-flag-policy.test.ts` (pass)
  - `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` (pass, Turbopack)
  - Dev runtime probe:
    - `pnpm exec next dev -p 3312` + `curl /en/apartment`
    - startup log captured `Next.js 16.1.6 (Turbopack)` and `Ready in 5.8s` (pass)
  - Workflow-shape static export probe (no `--webpack`):
    - temporary hide of `src/app/[lang]/guides/[...slug]`
    - `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build`
    - `pnpm --filter @apps/brikette generate:static-aliases`
    - route restore (pass)
  - `pnpm --filter @acme/template-app build` (pass; existing warning in `platform-core` import trace)
  - `pnpm --filter @apps/business-os build` (pass)
  - `node scripts/check-i18n-resolver-contract.mjs` (pass all configured surfaces)

#### Existing Test Coverage
| Area | Test Type | Files/Commands | Coverage Notes |
|---|---|---|---|
| Policy matrix behavior | Unit | `scripts/__tests__/next-webpack-flag-policy.test.ts` | Covers Brikette dev allow + build require-webpack |
| Policy gate integration | Script | `node scripts/check-next-webpack-flag.mjs --all` | Confirms current repo state satisfies matrix |
| Turbopack dev behavior | CI smoke + local probe | `.github/workflows/brikette.yml` + `brikette-smoke.mjs` + dev startup log probe | Confirms active Turbopack dev surface and route assertions |
| Brikette Turbopack production build | Build probe | `next build` (without `--webpack`) | Passes locally in current state |
| Brikette static-export workflow shape | Build probe | route hide/restore + `OUTPUT_EXPORT=1 next build` + alias generation | Passes locally; point-in-time only |
| Cross-app resolver contract | Script | `node scripts/check-i18n-resolver-contract.mjs` | Passes, but Brikette lifecycle-vs-bundler surface intent is not explicit |

#### Coverage Gaps
- Untested paths:
  - No policy test yet for Brikette `build` allowed without `--webpack` (future matrix update requirement).
  - No unit tests for `check-i18n-resolver-contract.mjs` surface selection/labels/lifecycle intent.
  - No continuous static-export regression surface in CI or in a dedicated contract harness mode.
- Extinct tests:
  - None yet, but current Brikette build-requirement assertions become obsolete once matrix policy changes.

#### Testability Assessment
- Easy to test:
  - Policy checker behavior through existing fixture-driven Jest suite.
  - Command-level build pass/fail for app/workflow surfaces.
- Hard to test:
  - Full static-export workflow behavior continuously in CI without runtime bloat.
- Test seams needed:
  - Script-level tests for resolver harness lifecycle vs bundler surface selection.
  - One continuous static-export contract surface (harness mode or dedicated CI gate).

### Recent Git History (Targeted)
- `5e27a4655c` (`apps/brikette/package.json`) - introduced `--webpack` on Brikette dev/build during Next.js 16 upgrade.
- `c0a14c205e` (`scripts/check-next-webpack-flag.mjs`, tests) - introduced app-aware matrix; Brikette dev allowed, build still webpack-required.
- `f90ac108a2` (`.github/workflows/brikette.yml`) - added Turbopack dev smoke job/harness usage.
- `6b614e83fa` (`.github/workflows/brikette.yml`) - enforced webpack in deploy build-cmd path.
- `ae38cc4431` (`apps/brikette/next.config.mjs`) - added Brikette Turbopack alias support.

## Questions
### Resolved
- Q: Is Turbopack production build technically blocked for Brikette today?
  - A: No; direct Turbopack `next build` passes.
  - Evidence: command probe in this run (pass).

- Q: Does the workflow-style static-export sequence pass with Turbopack build?
  - A: Yes; route hide/restore + `OUTPUT_EXPORT=1 next build` + alias generation passed without `--webpack`.
  - Evidence: workflow-shape local probe in this run (pass).

- Q: Is Brikette dev actually running Turbopack in current state?
  - A: Yes.
  - Evidence: startup log probe captured `Next.js 16.1.6 (Turbopack)` and readiness at startup.

- Q: Are CI/Cloudflare deployment steps intrinsically webpack-coupled?
  - A: Deploy step is not; build step behavior still depends on command strings.
  - Evidence: `.github/workflows/brikette.yml` build-cmd currently includes webpack flag, deploy consumes `out/` with `wrangler pages deploy out`.

- Q: What is the immediate blocker to dropping `--webpack` from Brikette build commands?
  - A: Policy contract and command strings, not core bundler capability in current graph.
  - Evidence: `scripts/check-next-webpack-flag.mjs:23-27`, `apps/brikette/package.json:8`, `.github/workflows/brikette.yml:95`, `.github/workflows/brikette.yml:127`.

### Open (User Input Needed)
- Q: Which resolver-harness contract should own Brikette coverage after build-flag retirement?
  - Why it matters: determines whether lifecycle coverage (prebuild/build/postbuild) is preserved or silently dropped.
  - Decision impacted: `scripts/check-i18n-resolver-contract.mjs` scope + naming + tests.
  - Decision owner: Peter (repo owner).
  - Options and consequences:
    - Option A: keep Brikette lifecycle surface (`pnpm --filter @apps/brikette build`) and relabel neutrally (`build-lifecycle:brikette`), plus keep explicit Turbopack direct build surface.
      - Consequence: highest coverage, longer runtime.
    - Option B: replace Turbopack direct step with a Turbopack lifecycle step (`pnpm --filter @apps/brikette build` after script migration), drop separate Brikette webpack list identity.
      - Consequence: keeps lifecycle coverage with less duplication, but requires careful script/label refactor.
    - Option C: drop lifecycle surface and keep only direct Turbopack build check.
      - Consequence: fastest, but loses pre/postbuild artifact validation.
  - **Decision (Peter, 2026-02-20): Option B.** Replace the direct Turbopack build step with a single Turbopack lifecycle surface (`pnpm --filter @apps/brikette build` after script migration). Drop `webpack:brikette` and `turbopack:brikette-build` identities; relabel as `build-lifecycle:brikette`.

## Confidence Inputs
- Implementation: 88% (effective ceiling ~84% until CI-confirmed)
  - Derivation: baseline 75% + 7 (localized policy/workflow/script entry points) + 4 (Turbopack production build probe pass) + 2 (workflow-shape static-export probe pass) = 88%.
  - Note: all build evidence is local/point-in-time only; no CI-level confirmation exists for the Turbopack production build itself. Effective ceiling is ~84% until one staging workflow run confirms the migrated path.
  - To >=90: add scripted test coverage for resolver harness surface semantics and one automated static-export contract check.

- Approach: 85%
  - Derivation: baseline 74% + 6 (Brikette-scoped change avoids shared webpack callback churn) + 5 (clear rollback path and policy fan-out control) = 85%.
  - To >=90: one green staging workflow run after migration confirms real-world bundler behavior.

- Impact: 86%
  - Derivation: baseline 76% + 6 (removes remaining Brikette webpack build-policy debt) + 4 (aligns build path with existing Turbopack dev direction) = 86%.
  - To >=90: show one full staging workflow run green after command/policy change.

- Delivery-Readiness: 84%
  - Derivation: baseline 72% + 6 (all blocking surfaces identified with commands/paths) + 6 (key probes pass now) = 84%.
  - To >=90: include explicit sequencing/rollback checks in plan acceptance criteria and capture one green staging run.

- Testability: 82%
  - Derivation: baseline 70% + 8 (existing policy tests + script gates) + 6 (live build probes) - 2 (no continuous static-export surface yet) = 82%.
  - To >=90: add harness tests + continuous static-export enforcement surface.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Policy matrix change accidentally weakens enforcement for non-Brikette apps | Medium | High | Keep default fail-closed; update tests first; include explicit non-Brikette fail cases |
| Brikette workflow build-cmd edited incompletely (staging/prod divergence) | Medium | Medium | Update both workflow branches atomically and validate both command blocks |
| Resolver contract refactor removes Brikette lifecycle coverage (prebuild/postbuild) | Medium-High | High | Option B chosen (Peter, 2026-02-20): single `build-lifecycle:brikette` surface; add script-level tests to lock semantics |
| Static export command regresses due route hide/restore sequencing | Low-Medium | High | Add continuous static-export surface (harness mode or dedicated CI step), not only manual probe |
| Turbopack output differences pass build but regress runtime artifact behavior | Low-Medium | Medium | Add post-change staging verification checklist on representative routes and monitor smoke/health signals |
| Task sequencing drift (policy/test change and command change land out-of-order) | Medium | Medium | Enforce explicit task dependency ordering in plan; do not parallelize those tasks |
| Existing non-fatal env warnings mask real failures | Medium | Low-Medium | Treat exit code as gate and capture warning baseline in plan acceptance notes |
| Next.js 16.x.y future bump regresses Turbopack build path post-migration | Low | Medium-High | Pin Next.js to exact version in `packages/next-config` during migration window; update with intent after staging confirms stable |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep `check-next-webpack-flag` fail-closed default for unknown apps/commands.
  - Do not broaden shared-config changes; this is Brikette build-policy scope.
  - Update policy logic and corresponding Jest tests in the same task.
  - Resolver contract updates must preserve Brikette lifecycle coverage unless explicitly waived by owner decision.
- Rollout/rollback expectations:
  - Rollout should be atomic across `apps/brikette/package.json`, `.github/workflows/brikette.yml`, and `scripts/check-next-webpack-flag.mjs`.
  - Rollback path: reintroduce `--webpack` command segments and revert Brikette build matrix rule.
- Ordering requirement for `/lp-do-plan`:
  - Seed 1 (policy matrix + tests) must complete before or in the same PR as Seed 2 (build-command changes).
  - Seed 3 requires: (a) resolver-harness option locked — **done: Option B (Peter, 2026-02-20)**; (b) Seed 2 landed so the lifecycle surface reflects Turbopack behavior.
  - **Seed 4 (continuous static-export enforcement) is a hard merge gate on Seeds 1–2.** It must land in the same PR or before Seeds 1–2 merge. Shipping Seeds 1–2 without Seed 4 would recreate the same unguarded point-in-time state this brief is resolving. Decision: Peter, 2026-02-20.
- Observability expectations:
  - Preserve/monitor Turbopack smoke job.
  - Capture at least one green staging workflow run after migration.

## Suggested Task Seeds (Execution-Bounding)
1. Update `check-next-webpack-flag` policy matrix to allow Brikette `build` without `--webpack`, and update `scripts/__tests__/next-webpack-flag-policy.test.ts` (including non-Brikette fail-closed cases).
2. Remove `--webpack` from Brikette build command surfaces:
   - `apps/brikette/package.json` `build`
   - `.github/workflows/brikette.yml` staging + production `build-cmd` blocks.
   - Dependency: Seed 1 must be complete first or landed atomically.
3. Refactor `scripts/check-i18n-resolver-contract.mjs` using selected lifecycle-safe option (A or B) and add tests that lock intended Brikette surface semantics.
4. Add continuous static-export enforcement surface (harness mode or dedicated CI step) for route hide/restore + `OUTPUT_EXPORT=1 next build` + alias-generation sequence.
5. Validate acceptance matrix:
   - `node scripts/check-next-webpack-flag.mjs --all`
   - policy Jest suite
   - Brikette Turbopack `next build`
   - continuous static-export contract surface
   - template-app + business-os builds
   - `node scripts/check-i18n-resolver-contract.mjs`.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Brikette build command and workflow build-cmd use Turbopack (`next build` without `--webpack`).
  - Policy matrix and tests explicitly reflect Brikette `build` allowance while preserving fail-closed behavior elsewhere.
  - Resolver contract checks remain accurate and lifecycle-complete post-change.
  - Static-export pipeline behavior is continuously enforced (not one-off only).
- Post-delivery measurement plan:
  - Monitor merge-gate and pre-commit policy failures for one week.
  - Monitor Brikette staging workflow runtime/flakiness after build-flag switch.

## Evidence Gap Review
### Gaps Addressed
- Verified live command probes instead of inferring from old artifacts:
  - Turbopack production build pass
  - workflow-shape static export pass without webpack flag
  - cross-app baseline builds and resolver contract pass
  - explicit dev runtime probe confirming Turbopack startup
- Verified policy and CI wiring directly from current files with line-level evidence.

### Confidence Adjustments
- Raised implementation and delivery confidence after proving both direct and workflow-shape Turbopack build paths pass.
- Kept testability below 90 due missing continuous static-export enforcement and resolver-harness unit tests.

### Remaining Assumptions
- Brikette should continue converging to Turbopack for production build path.
- Existing non-fatal env warnings remain acceptable until separately addressed.
- Static-export artifact equivalence (Turbopack vs webpack `out/` structure) has not been validated via diff — probing confirmed build exits 0 but did not compare output artifacts. Assumed equivalent; continuous enforcement from Seed 4 is the guard.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none — resolver-harness option resolved (Option B, Peter 2026-02-20); Seed 4 merge-gate decision locked.
- Recommended next step:
  - `/lp-do-plan docs/plans/turbopack-brikette-build-flag-retirement/fact-find.md`
