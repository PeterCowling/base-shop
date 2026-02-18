---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: test-typecheck-enablement
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Related-Plan: docs/plans/test-typecheck-enablement/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Test Typecheck Enablement Fact-Find Brief

## Scope
### Summary
Type checking is universally disabled for test files across the entire monorepo. `ts-jest` runs with
`diagnostics: false` everywhere (shared preset), and the production `tsconfig.json` in every
package explicitly excludes test files, so `turbo run typecheck` also misses them. A purpose-built
script (`scripts/typecheck-tests.mjs`) and three `tsconfig.test.typecheck.json` files already exist
but are never wired into any automated gate (CI, pre-commit, or turbo task).

This plan incrementally enables test-file type checking: wire the existing infrastructure first
(minimal-risk Phase 1), then expand coverage package-by-package through subsequent phases.

### Goals
- Gate CI on test-file type errors for `packages/**` (already covered by root config)
- Gate CI on test-file type errors for `apps/cms` (config already exists)
- Fix the `packages/ui` config bug and include its tests
- Add `tsconfig.test.typecheck.json` for the four highest-risk packages/apps not yet covered
- Never silently fall back to `tsconfig.test.json` for strict tsc (requires script guard or full coverage)

### Non-goals
- Enabling `diagnostics: true` in ts-jest itself (too slow; keep separate tsc gate pattern)
- Pre-commit hook changes (out of scope for Phase 1; recommended post-Phase 2)
- Covering `apps/api`, `apps/dashboard`, `apps/skylar`, and other lower-risk apps in Phase 1

### Constraints & Assumptions
- Constraints:
  - Must not break existing CI — each CI step addition must be preceded by fixing pre-existing errors
  - The `tsconfig.test.json` fallback in `typecheck-tests.mjs` is unsafe for strict tsc (different settings); do not enable `TYPECHECK_ALL=1` until all targeted packages have a dedicated `tsconfig.test.typecheck.json`
  - Each new `tsconfig.test.typecheck.json` must extend the package's existing `tsconfig.json` (same pattern as `apps/cms`)
- Assumptions:
  - The prior `fix(typecheck): add type declarations to eliminate ~183 test typecheck errors` commit resolved errors in `packages/**` — the root config may already pass `tsc --noEmit` cleanly; needs verification
  - `apps/cms` test files may have residual errors since the config exists but was never enforced in CI

## Evidence Audit (Current State)

### Entry Points
- `scripts/typecheck-tests.mjs` — discovery and runner script; handles root config + per-package scan
- `.github/workflows/ci.yml:218` — `typecheck` job running `turbo run typecheck --affected`
- `scripts/git-hooks/typecheck-staged.sh` — pre-commit hook; runs `turbo run typecheck` (production tsconfigs only)
- `packages/config/jest.preset.cjs` — shared Jest preset; sets `diagnostics: false` for all packages

### Key Modules / Files
- `tsconfig.test.typecheck.json` (root) — covers `packages/**/__tests__/**` and `packages/**/*.test.*`; extends `tsconfig.base.json`
- `apps/cms/tsconfig.test.typecheck.json` — covers `__tests__/**` and `src/**/*.test.*`; extends CMS `tsconfig.json` ✓
- `packages/ui/tsconfig.test.typecheck.json` — **BUGGED**: `exclude: ["__tests__/**"]` cancels `include: ["__tests__/**/*"]`; net result = tests excluded
- `turbo.json:35` — `typecheck` task: `dependsOn: ["^build"]`, no `outputs`; does not include a `typecheck-tests` task
- `package.json:37` — root script `"typecheck": "bash scripts/typecheck.sh"` (production tsconfigs only)
- `.github/workflows/ci.yml:260` — `run: pnpm exec turbo run typecheck --affected` (no test typecheck step exists)

### Patterns & Conventions Observed
- `tsconfig.test.typecheck.json` extends the package's own `tsconfig.json` (not the root base directly) — evidence: `apps/cms/tsconfig.test.typecheck.json:2` (`"extends": "./tsconfig.json"`)
- Root `tsconfig.test.typecheck.json` extends `./tsconfig.base.json` directly and uses `"allowImportingTsExtensions": true` — evidence: `tsconfig.test.typecheck.json:1`
- `typecheck-tests.mjs` default mode (no env vars): runs root config only. `TYPECHECK_ALL=1` or `TYPECHECK_FILTER=<path>` enables per-package scan — evidence: `scripts/typecheck-tests.mjs:8-10`
- Fallback to `tsconfig.test.json` when no `tsconfig.test.typecheck.json` exists — evidence: `scripts/typecheck-tests.mjs:44-47`; this fallback is unsafe because `tsconfig.test.json` is tuned for ts-jest resolution, not strict tsc

### Data & Contracts
- Types/schemas/events:
  - `tsconfig.test.typecheck.json` specifies: `"types": ["node", "jest", "@testing-library/jest-dom", "react", "react-dom"]` — must be consistent across all per-package typecheck configs
  - `"verbatimModuleSyntax": false` required in test typecheck configs (test files use `import type` inconsistently) — evidence: root + cms config both set this
- API/contracts:
  - `typecheck-tests.mjs` reads `TYPECHECK_FILTER` and `TYPECHECK_ALL` env vars; consumed by CI step (to be added)
  - Script exits with code 1 on any failure; suitable for CI gate

### Dependency & Impact Map
- Upstream dependencies:
  - Each per-package `tsconfig.test.typecheck.json` depends on upstream package builds (`.d.ts` files) — same constraint as `turbo run typecheck`
  - Root `tsconfig.test.typecheck.json` paths point to `packages/*/src/index.ts` — requires packages to be built or source-resolvable
- Downstream dependents:
  - CI `typecheck` job — new step would be added here
  - Pre-commit hook — not touched in Phase 1
- Likely blast radius:
  - Phase 1 CI step: if pre-existing errors exist, CI fails until fixed (gating step required before adding CI step)
  - No source code changes; pure infra/config additions

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (via ts-jest, `diagnostics: false`), tsc (`typecheck-tests.mjs`)
- Commands: `node scripts/typecheck-tests.mjs` (manual only today), `TYPECHECK_ALL=1 node scripts/typecheck-tests.mjs`
- CI integration: **none** (to be added)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| packages/** (root config) | tsc --noEmit | root `tsconfig.test.typecheck.json` | Script exists; not in CI |
| apps/cms | tsc --noEmit | `apps/cms/tsconfig.test.typecheck.json` | Config correct; not in CI |
| packages/ui | tsc --noEmit | `packages/ui/tsconfig.test.typecheck.json` | Config has `exclude` bug |
| apps/brikette | none | — | No config; largest test suite |
| packages/platform-core | none | — | No config; core business logic |
| packages/platform-machine | none | — | No config; state machine logic |
| packages/template-app | none | — | No config; Stripe webhook tests |

#### Coverage Gaps
- Untested paths (from type checking perspective):
  - All `apps/**` except `apps/cms`
  - `packages/platform-core`, `packages/platform-machine`, `packages/template-app`, `packages/email`
  - `scripts/` test files

### Recent Git History (Targeted)
- `8944ff6446` `fix(typecheck): add type declarations to eliminate ~183 test typecheck errors` — prior attempt to enable test typecheck; fixed ~183 errors in `packages/**`; root config likely passes, but was never wired into CI
- `scripts/typecheck-tests.mjs` and root `tsconfig.test.typecheck.json` were committed as part of CI/turbo cache work (branch `work/2026-01-16-ci-turbo-cache`)

## Questions

### Resolved
- Q: Does `typecheck-tests.mjs` run by default (no env vars) include apps?
  - A: No. Without `TYPECHECK_ALL=1` or `TYPECHECK_FILTER`, it only runs the root `tsconfig.test.typecheck.json` which covers `packages/**` only (not `apps/**`).
  - Evidence: `scripts/typecheck-tests.mjs:9-10,23-24`
- Q: Does the prior fix commit mean packages/** already passes typecheck?
  - A: Likely yes — `8944ff6446` fixed 183 errors. But this must be **verified** before adding CI step.
  - Evidence: git log output showing commit message
- Q: Is the `packages/ui` bug one line?
  - A: Yes. Remove `"__tests__/**"` from the `exclude` array in `packages/ui/tsconfig.test.typecheck.json:57`.
  - Evidence: `packages/ui/tsconfig.test.typecheck.json:50-57`
- Q: What does the fallback to `tsconfig.test.json` risk?
  - A: `tsconfig.test.json` files are configured for ts-jest module resolution (not strict tsc). Running `tsc --noEmit` against them may produce spurious errors or miss real ones. Strategy: never enable `TYPECHECK_ALL=1` until all target packages have `tsconfig.test.typecheck.json`.
  - Evidence: `scripts/typecheck-tests.mjs:44-47`

### Open (User Input Needed)
- Q: Should a new `typecheck-tests` turbo task be created, or should the CI step call the script directly?
  - Why it matters: Turbo task would enable per-package scoping and caching; direct script call is simpler but not turbo-cached.
  - Decision impacted: Task seed 01 design
  - Decision owner: Engineer
  - Default assumption + risk: Call script directly from CI (simpler, no per-package `package.json` changes needed). Risk: not turbo-cached, runs on every CI run even if tests unchanged.

## Confidence Inputs
- Implementation: 90%
  - Evidence: Infrastructure (script + root config + cms config) already exists. Changes are additive: new CI step, new tsconfig files per package. Pattern is established.
  - To reach 90%: Verify root config actually passes clean today (run `node scripts/typecheck-tests.mjs`).
- Approach: 85%
  - Evidence: Incremental phased approach follows existing pattern. Risk of pre-existing errors is mitigated by mandatory pre-check step before CI gate addition.
  - To reach 90%: Confirm zero errors in packages/** before proceeding.
- Impact: 95%
  - Evidence: Currently 0 packages have enforced test typechecking; plan adds enforcement to highest-risk packages in order of existing infrastructure.
- Delivery-Readiness: 85%
  - Evidence: Phase 1 tasks can begin immediately. Phases 2-4 depend on no pre-existing errors being found.
  - To reach 90%: Complete Phase 1 pre-check.
- Testability: 95%
  - Evidence: `typecheck-tests.mjs` exits with code 1 on failure — CI gate is self-testing.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pre-existing type errors in packages/** test files break CI when step is added | Medium | High | Mandatory pre-check: run script locally and fix all errors before adding CI step |
| `apps/cms` test files have accrued silent type errors since config was never enforced | Medium | Medium | Same mitigation: run `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` first |
| New `tsconfig.test.typecheck.json` files for brikette/platform-core/etc surface large error counts that stall the plan | Medium | Medium | Add typecheck config per package, fix errors, then add CI gate — never gate before errors are resolved |
| `tsconfig.test.json` fallback in script causes spurious failures if `TYPECHECK_ALL=1` is enabled prematurely | High | Medium | Never enable `TYPECHECK_ALL=1` until all target packages have dedicated `tsconfig.test.typecheck.json` |
| Per-package `tsconfig.test.typecheck.json` path aliases drift from `tsconfig.test.json` | Low | Low | Copy-paste from CMS config and validate with a dry-run |
| CI `typecheck` job timeout (currently 15 min) — adding tsc step may push it over | Low | Low | tsc is fast; root config + targeted packages unlikely to add >2 min |

## Planning Constraints & Notes
- Must-follow patterns:
  - Each `tsconfig.test.typecheck.json` must extend the package's own `tsconfig.json` (not root base) — evidence: `apps/cms/tsconfig.test.typecheck.json:2`
  - Must include `"verbatimModuleSyntax": false`, `"noEmit": true`, and `"types": ["node", "jest", "@testing-library/jest-dom"]`
  - New CI steps must be **ordered**: verify-clean → add-gate (never add the gate first)
- Rollout/rollback expectations:
  - Each phase is independently mergeable. Rollback = remove the CI step for that phase.
  - No source code changes; config-only (except fixing errors found during pre-check).
- Observability expectations:
  - CI failure message from `typecheck-tests.mjs` lists failing configs by name — no additional instrumentation needed.

## Suggested Task Seeds (Non-binding)

**Phase 1 — Wire existing infrastructure**
- TASK-01: Verify `node scripts/typecheck-tests.mjs` passes clean (packages/**); fix any residual errors
- TASK-02: Add CI step to `typecheck` job in `ci.yml` calling `node scripts/typecheck-tests.mjs` (packages/** gate)
- TASK-03: Fix `packages/ui/tsconfig.test.typecheck.json` — remove `__tests__/**` from `exclude`
- TASK-04: Verify `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` passes; fix any errors in `apps/cms` tests
- TASK-05: Extend CI step to also cover `apps/cms` (use `TYPECHECK_FILTER` or combine into single invocation with both configs)

**Phase 2 — High-risk packages**
- TASK-06: Create `packages/platform-core/tsconfig.test.typecheck.json`; run + fix errors
- TASK-07: Create `packages/platform-machine/tsconfig.test.typecheck.json`; run + fix errors
- TASK-08: Add platform-core and platform-machine to CI coverage

**Phase 3 — Apps coverage**
- TASK-09: Create `apps/brikette/tsconfig.test.typecheck.json`; run + fix errors (likely largest error count)
- TASK-10: Create `packages/template-app/tsconfig.test.typecheck.json`; run + fix errors
- TASK-11: Add brikette and template-app to CI coverage

**Phase 4 — Full enablement (deferred)**
- TASK-12: Add `tsconfig.test.typecheck.json` for remaining apps/packages (or add guard to script that rejects tsconfig.test.json fallback)
- TASK-13: Enable `TYPECHECK_ALL=1` in CI
- TASK-14: Add pre-commit hook companion (`typecheck-tests-staged.sh`)

## Execution Routing Packet
- Primary execution skill: `lp-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `node scripts/typecheck-tests.mjs` exits 0 in CI for all targeted packages
  - CI `typecheck` job has a `Typecheck test files` step that gates merge
  - `packages/ui/tsconfig.test.typecheck.json` no longer has the `__tests__/**` exclude bug
- Post-delivery measurement plan:
  - Monitor CI `typecheck` job duration after each phase — should stay under 15-min timeout
  - Track error count reduction per phase as each new config is added

## Evidence Gap Review

### Gaps Addressed
- Verified `typecheck-tests.mjs` script behavior (default vs TYPECHECK_ALL) from source — evidence: `scripts/typecheck-tests.mjs:8-50`
- Confirmed `packages/ui` bug is exactly one line in `exclude` array — evidence: `packages/ui/tsconfig.test.typecheck.json:57`
- Confirmed `apps/cms` config is correct and complete (no bug) — evidence: `apps/cms/tsconfig.test.typecheck.json:81-90`
- Confirmed CI `typecheck` job structure and timeout from `ci.yml:218-261`
- Identified prior error-fix commit (`8944ff6446`) establishing that packages/** was previously cleaned

### Confidence Adjustments
- Implementation confidence raised from 80% → 90% because: prior work (183-error fix) means packages/** likely already passes; infrastructure for Phase 1 is complete; tasks are additive config changes
- Approach confidence held at 85% pending verification that packages/** is clean today

### Remaining Assumptions
- Root `tsconfig.test.typecheck.json` passes `tsc --noEmit` today (based on prior fix commit; not re-verified in this session)
- `apps/brikette` will have the highest pre-existing error count (largest test suite, no typecheck config ever)
- Per-package `tsconfig.test.typecheck.json` files can be bootstrapped from the CMS template with only path alias changes

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none (verification in TASK-01 is the first task, not a pre-planning blocker)
- Recommended next step: `/lp-plan` with this fact-find as input
