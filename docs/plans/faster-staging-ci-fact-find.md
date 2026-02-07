---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CI/Infrastructure
Created: 2026-02-06
Last-updated: 2026-02-06
Feature-Slug: faster-staging-ci
Related-Plan: docs/plans/faster-staging-ci-plan.md
Business-Unit: PLAT
Card-ID:
---

# Faster Staging Deploys: Tailored CI & Local Pre-flight Validation — Fact-Find Brief

## Scope

### Summary

Reduce the number of CI cycles needed to get an app to staging by (a) making CI pipelines change-aware so deploy-only changes skip irrelevant validation, and (b) catching platform-specific deployment failures locally before pushing. Catalysed by the 82-run brikette staging deployment.

### Goals

- Reduce CI cycles for deploy config changes by 80% (82 → <15 for a comparable task)
- Reduce wall-clock time per CI run by 50% for deploy-only changes
- Catch >90% of static export incompatibilities locally before pushing
- Catch platform constraint violations locally (Cloudflare free tier limits, missing features)
- No regression in quality gates — code changes still get full lint/typecheck/test

### Non-goals

- Rewriting the entire CI architecture (incremental improvements to existing workflows)
- Parallelizing tests across packages (separate plan: `docs/plans/ci-test-parallelization-plan.md`)
- Changing how production deploys work (focus is staging iteration speed)
- Replacing Turborepo or GitHub Actions

### Constraints & Assumptions

- Constraints:
  - Must not weaken quality gates for code changes — lint/typecheck/test must still run for source changes
  - Must work with the existing reusable-app.yml pattern (used by 7+ app workflows)
  - Must be backward-compatible — apps that don't opt in should behave exactly as before
  - `dorny/paths-filter@v3` is already a trusted dependency (used in 4 workflows)
- Assumptions:
  - Next.js route tree is deterministic from filesystem structure (no runtime route generation)
  - Static export constraints are enumerable and stable across Next.js 15 minor versions
  - GitHub Actions conditional steps (`if:`) are sufficient granularity (no need for separate jobs)

## Repo Audit (Current State)

### Entry Points

- `.github/workflows/reusable-app.yml` — Central reusable pipeline (lint → typecheck → test → build → deploy), used by all app workflows
- `.github/workflows/brikette.yml` — Brikette-specific caller workflow (staging: static export, production: Worker)
- `.github/workflows/merge-gate.yml` — Central merge gate with `dorny/paths-filter` for 11 change-set categories
- `.github/workflows/ci.yml` — Core platform CI (lint, typecheck, test, storybook-visual, build, e2e, release)
- `scripts/validate-deploy-env.sh` — Pre-deploy environment validation (278 lines)
- `scripts/post-deploy-health-check.sh` — Post-deploy HTTP verification (120 lines)
- `packages/next-config/index.mjs` — Shared Next.js base config (reads `OUTPUT_EXPORT` env var)

### Key Modules / Files

| File | Lines | Role |
|------|-------|------|
| `.github/workflows/reusable-app.yml` | 193 | Reusable pipeline template — the primary modification target |
| `.github/workflows/brikette.yml` | 94 | Brikette caller — static export build with route hiding workaround |
| `.github/workflows/merge-gate.yml` | 353 | Merge gate — already uses `dorny/paths-filter` for 11 filters |
| `.github/workflows/ci.yml` | ~250 | Core CI — separate from reusable-app, has its own change detection |
| `scripts/validate-deploy-env.sh` | 278 | Secret validation gate (currently `continue-on-error: true`) |
| `scripts/post-deploy-health-check.sh` | 120 | Post-deploy HTTP check with retries |
| `scripts/post-deploy-brikette-cache-check.sh` | 187 | Brikette production-only cache header validation |
| `scripts/validate-deploy-health-checks.sh` | 82 | CI enforcement: ensure all deploy workflows have health checks |
| `packages/next-config/index.mjs` | 90 | Shared config with `OUTPUT_EXPORT` → `output: 'export'` logic |
| `scripts/validate-changes.sh` | 287 | Pre-commit local validation (lint, typecheck, targeted tests) |
| `scripts/src/launch-shop/preflight.ts` | 257 | Launch-shop pre-flight (runtime, git, config, secrets, compliance) |
| `docs/brikette-deploy-decisions.md` | 207 | Documents static export gotchas and deploy strategy |

### Patterns & Conventions Observed

- **Reusable workflow pattern**: All app deploys call `reusable-app.yml` with app-specific inputs. Modifications to this file affect all apps simultaneously — evidence: `brikette.yml:46`, `skylar.yml`, `prime.yml`, `product-pipeline.yml` all reference it.
- **`dorny/paths-filter@v3` for change detection**: Already used in `merge-gate.yml` (11 filters), `ci.yml` (E2E change detection), and `ci-lighthouse.yml`. Well-understood pattern.
- **Concurrency groups with cancel-in-progress**: All app workflows use `cancel-in-progress: true`, so pushing a fix cancels the previous failing run — evidence: `brikette.yml:40-41`.
- **Route hiding for static export**: Brikette hides `api/`, `draft/`, and `[...slug]` during build with `mv` commands — evidence: `brikette.yml:54-61`.
- **Artifact upload/download between jobs**: Build artifacts passed via `actions/upload-artifact@v4` with 1-day retention — evidence: `reusable-app.yml:108-115`.
- **Separate `validate-and-build` and `deploy` jobs**: Deploy job is a separate runner that downloads artifacts — cannot share filesystem state.
- **TEMP workarounds in place**: Tests skipped on staging branch (`reusable-app.yml:82`), `validate-deploy-env.sh` continues on error (`reusable-app.yml:156`).

### Data & Contracts

- Types/schemas:
  - No formal "pipeline profile" type exists. Each app workflow hardcodes its build strategy.
  - `packages/next-config/index.mjs` — `OUTPUT_EXPORT` env var toggles `output: 'export'` and `images.unoptimized`.
- Persistence:
  - Turbo remote cache (configured via `TURBO_TOKEN`/`TURBO_TEAM` in `setup-repo` action)
  - GitHub Actions artifact store (1-day retention for build artifacts)
- API/event contracts:
  - `reusable-app.yml` inputs: `app-filter`, `build-cmd`, `artifact-path`, `deploy-cmd`, `project-name`, `environment-name`, `environment-url`, `healthcheck-args`, `healthcheck-base-url`
  - `reusable-app.yml` secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `TURBO_TOKEN`, `SOPS_AGE_KEY`

### Dependency & Impact Map

- Upstream dependencies:
  - `dorny/paths-filter@v3` — third-party action for change classification
  - `actions/checkout@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4` — GitHub first-party
  - `.github/actions/setup-repo` — custom composite action (pnpm, Node, Turbo cache)
  - `.github/actions/decrypt-secrets` — custom composite action (SOPS/Age)
- Downstream dependents (workflows that call `reusable-app.yml`):
  - `brikette.yml` (staging + production)
  - `skylar.yml` (staging + production)
  - `prime.yml` (staging + production)
  - `product-pipeline.yml` (staging + production)
  - Any future app workflows
- Likely blast radius:
  - **Modifying `reusable-app.yml`** affects all 4+ app workflows. Must be backward-compatible.
  - **Adding a new input** to `reusable-app.yml` is safe (callers that don't pass it get the default).
  - **Local pre-flight script** is additive — no blast radius on CI.
  - **merge-gate.yml** already handles change detection; no modification needed for Phase 1.

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest (primary), Node test runner (`@acme/next-config`), Cypress (E2E), Playwright (Storybook visual)
- **Commands:** `pnpm test` (all), `pnpm test:affected` (Turbo-filtered), `pnpm test:changed` (hash-based)
- **CI integration:** `pnpm test:affected` in `ci.yml` (20 min timeout); `pnpm --filter {app} test` in `reusable-app.yml`; CMS uses 4 Jest shards
- **Coverage:** Codecov upload from `ci.yml`; tiered thresholds (CRITICAL 90%, STANDARD 80%, MINIMAL 0%)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `packages/next-config` | unit | `__tests__/index.test.mjs` | Tests `OUTPUT_EXPORT` → `output: 'export'` toggle |
| `scripts/launch-shop/preflight` | unit | `scripts/__tests__/launch-shop/preflight.test.ts` | Tests runtime, git, config, secrets validation |
| `scripts/validate-deploy-env.sh` | none | — | Shell script, no tests |
| `scripts/post-deploy-health-check.sh` | none | — | Shell script, no tests |
| CI workflows (`.github/workflows/*.yml`) | none | — | No workflow-level tests (standard for GHA) |

#### Test Patterns & Conventions

- Unit tests: Jest with shared preset (`packages/config/jest.preset.cjs`), hybrid ESM/CJS support
- Pre-commit validation: `scripts/validate-changes.sh` — runs lint, typecheck, targeted tests for changed files
- No existing test framework for CI workflow logic or deploy scripts

#### Coverage Gaps (Planning Inputs)

- **No tests for static export compatibility** — the constraints that caused 5+ CI failures are not validated anywhere
- **No tests for deploy scripts** — `validate-deploy-env.sh`, `post-deploy-health-check.sh` are untested shell scripts
- **No local simulation of CI pipeline steps** — can't reproduce "will this build succeed in CI?" locally

#### Testability Assessment

- **Easy to test:** Route tree scanning (filesystem-based, deterministic), config export validation (AST parsing), platform constraint checks (rule-based)
- **Hard to test:** GitHub Actions conditional logic (requires act or real workflow runs), Cloudflare deploy behavior (requires real infrastructure)
- **Test seams needed:** A `preflight-deploy` script can be unit-tested with fixture directories representing valid/invalid route trees

#### Recommended Test Approach

- **Unit tests for:** Route tree scanner (fixture-based), config export linter (AST fixtures), platform constraint checker (rule list)
- **Integration tests for:** Full pre-flight script running against real app directories
- **No E2E needed:** CI workflow changes are verified by running the workflows themselves
- **Regression tests:** Encode the 5 brikette failures as test cases for the pre-flight script

### Recent Git History (Targeted)

- `.github/workflows/brikette.yml` — 17 failed + 3 successful runs in last session (2026-02-06); all failures were static export or deploy config issues
- `.github/workflows/reusable-app.yml` — Added staging test skip (`if: github.ref != 'refs/heads/staging'`), `continue-on-error: true` on validate-deploy-env.sh
- `docs/brikette-deploy-decisions.md` — Recently rewritten to document static export gotchas and deploy strategy

## Measured CI Performance Data

### Brikette Deploy Workflow

| Metric | Value | Notes |
|--------|-------|-------|
| Successful run duration | ~11-12 min | Consistent across 3 recent successful runs |
| Validate & build job | ~8-9 min | Lint + typecheck + build (tests skipped on staging) |
| Deploy job | ~2-3 min | Download artifact + deploy + health check |
| Recent failure rate | 85% (17/20) | During deploy config migration work |
| Avg failures before success | ~17 | Each requiring a fix-push-wait cycle |

### Core Platform CI

| Metric | Value | Notes |
|--------|-------|-------|
| Lint job | ~7-8 min | Slowest single job (standard lint 4.5min + Tailwind 1.7min) |
| Typecheck | ~5-6 min | Second slowest |
| Unit tests | ~2 min | Fast (uses `test:affected`) |
| Setup/install | ~35-45s | Per job (repeated across parallel jobs) |
| Full pipeline | ~15-20 min | When all jobs run |

### Time Breakdown for Deploy-Only Changes (Current)

For a change that only touches `brikette.yml` or `wrangler.toml`:

| Step | Time | Necessary? |
|------|------|-----------|
| Checkout + setup | ~1 min | Yes |
| Lint (app + deps) | ~3-4 min | **No** — no code changed |
| Typecheck (app + deps) | ~4-5 min | **No** — no code changed |
| Test (app) | ~1-2 min | **No** — no code changed (currently skipped on staging anyway) |
| Build | ~3-4 min | Yes — need to verify build succeeds |
| Deploy | ~2-3 min | Yes |
| **Total** | ~11-12 min | **~5-6 min could be saved** |

## Existing Change Detection Mechanisms

### Already Implemented

1. **GitHub native `paths` filters** — Used in `brikette.yml` (lines 8-30) to trigger only when relevant paths change. Good for "should this workflow run at all?" but not for "which steps should run?"
2. **`dorny/paths-filter@v3`** — Used in `merge-gate.yml` (11 filters), `ci.yml` (E2E detection), `ci-lighthouse.yml`. Trusted, well-understood. Runs as a step and produces boolean outputs.
3. **Turborepo `--affected`** — Used for test runs (`pnpm test:affected`). Determines affected packages from git changes + dependency graph. Works at package level, not file level.
4. **Turborepo `--filter`** — Used for scoped builds and lints (`--filter=@apps/brikette^...`). Builds only the dependency tree, not unrelated packages.
5. **Concurrency groups** — All workflows use `cancel-in-progress: true`, so new pushes cancel stale runs.

### Gap: No Step-Level Change Awareness in Reusable Pipeline

`reusable-app.yml` always runs: Lint → Typecheck → Test → Build → Deploy (in that order). There is **no mechanism to skip Lint/Typecheck/Test when only deploy config changed**. The `paths` filters on caller workflows determine whether the workflow runs at all, but once it's running, all steps execute.

This is the key gap. The idea's Phase 1 ("classify changes" step) directly addresses it.

## Analysis: Feasibility of Proposed Phases

### Phase 1: Change-Set Aware CI (reusable-app.yml)

**Approach:** Add `dorny/paths-filter` as a step in `reusable-app.yml` (or have callers pass a `skip-validation` input) to classify changes and conditionally skip lint/typecheck/test.

**Option A: Caller passes `skip-validation` boolean input**
- Simplest. Each caller workflow decides whether validation is needed based on its own `paths` config.
- Pro: No change to reusable-app.yml's internal logic beyond an `if:` condition.
- Con: Callers must maintain the classification logic. Doesn't help if a PR has mixed changes.

**Option B: `dorny/paths-filter` inside reusable-app.yml**
- More powerful. The reusable workflow itself detects what changed and skips irrelevant steps.
- Pro: Centralised logic, works for mixed changesets.
- Con: The reusable workflow needs to know each app's "code paths" vs "config paths" — could require a new input like `code-paths` (glob list).
- **Problem:** `dorny/paths-filter` requires the checkout step and works on the PR/push diff. It's already available in the reusable workflow since we checkout with `fetch-depth: 0`.

**Option C: New input `change-category` (enum: code | config | deploy-only | mixed)**
- Caller workflow classifies the change and passes it as an input.
- Pro: Explicit, testable, no additional action needed in reusable workflow.
- Con: GitHub Actions doesn't support running `dorny/paths-filter` in a caller and passing results as inputs to a reusable workflow in the same job — they're in separate runners. Would need a separate classify job.

**Recommendation: Option B** — Add `dorny/paths-filter` inside `reusable-app.yml` as the first step. Define two categories:
- `code_changed`: matches `apps/**/*.{ts,tsx,js,jsx,mjs,css}`, `packages/**/*.{ts,tsx,js,jsx,mjs,css}`, `*.config.*`, `tsconfig*`
- `deploy_config_only`: matches `.github/workflows/**`, `**/wrangler.toml`, `**/public/_redirects`, `scripts/validate-deploy*`, `scripts/post-deploy*`

If `code_changed` is false, skip lint/typecheck/test. Build always runs (needed to verify the build config).

**Estimated savings:** ~5-6 minutes per deploy-only change (skip lint + typecheck + test).

**Risk:** False negatives — if the classification misses a path that matters, a code change could skip validation. Mitigation: default to running all steps (fail-open). Only skip when explicitly confident no code changed.

### Phase 2: Local Pre-flight Script

**Approach:** `scripts/preflight-deploy.sh <app> <target>` (or TypeScript equivalent) that validates:

1. **Route tree compatibility** (static export constraints):
   - Scan `apps/{app}/src/app/` for catch-all routes (`[...slug]`), route handlers (`route.ts`) in dynamic segments, and pages with conditional config exports
   - Flag any route not listed in the build command's "hide" list
   - **Feasibility: High** — filesystem scan + simple grep/AST check

2. **Config export validation**:
   - Parse `.tsx`/`.ts` files that export `dynamic`, `revalidate`, etc.
   - Flag conditional expressions (ternaries, if/else) — Next.js static analysis rejects these
   - **Feasibility: High** — AST parsing with `ts-morph` or even regex for simple cases

3. **Platform constraint check**:
   - Given target = "cloudflare-pages-free": flag Image Resizing URLs (`/cdn-cgi/image/`), middleware usage, Worker-only APIs
   - **Feasibility: Medium** — need a rule list per platform, maintained manually

4. **Deploy config linter**:
   - Validate that the build command hides all routes that need hiding
   - Cross-reference route tree with the `mv` commands in the workflow YAML
   - **Feasibility: Medium** — requires parsing the workflow YAML to extract `mv` commands

**Existing asset to build on:** `scripts/src/launch-shop/preflight.ts` (257 lines) already validates runtime, git state, config schema, themes, secrets, and compliance. Same pattern — a pre-flight checklist. The new script can follow the same structure.

**Implementation language:** TypeScript (consistent with `preflight.ts`, can use `ts-morph` for AST parsing).

### Phase 3: Build Caching

**Current state:** Turbo remote cache is configured (`setup-repo` action sets `TURBO_TOKEN`/`TURBO_TEAM`). Turbo caches build outputs (`dist/`, `.next/`, `*.tsbuildinfo`). However:
- The Brikette build uses a custom build command with `mv` workarounds, which may defeat Turbo caching
- GitHub Actions artifact store has 1-day retention (not a cache, just job-to-job transfer)
- No Next.js `.next/cache` persistence between CI runs

**Opportunity:**
- Add GitHub Actions cache for `.next/cache` directory to speed up Next.js incremental builds
- Ensure Turbo remote cache is actually being used (check hit rates)
- **Needs measurement first** — this is Phase 3 for a reason

### Phase 4: App Pipeline Profiles

**Current state:** Each app workflow hardcodes its build strategy. `reusable-app.yml` is generic (takes `build-cmd`, `deploy-cmd` as strings).

**Opportunity:** Define pipeline profiles (e.g., `static-export`, `worker`, `full-ssr`) that encode:
- Which validation steps to run
- Build command template
- Deploy command template
- Post-deploy checks to run

**Assessment:** This is premature optimisation. The current system with explicit inputs works well for 4-5 apps. Profiles add abstraction without clear benefit until there are 10+ apps. **Defer.**

## Questions

### Resolved

- Q: Can `dorny/paths-filter` work inside a reusable `workflow_call` workflow?
  - A: Yes. It runs as a step that reads the git diff. The reusable workflow has `fetch-depth: 0` checkout, which is required. It works on both push and PR events.
  - Evidence: Already used inside `merge-gate.yml` which handles both push and PR events. `reusable-app.yml` has identical checkout config.

- Q: Can we add a new input to `reusable-app.yml` without breaking existing callers?
  - A: Yes. All inputs have `required: false` with defaults. New inputs with defaults are backward-compatible.
  - Evidence: `reusable-app.yml:14-47` — all optional inputs have defaults.

- Q: How many routes need hiding for brikette static export?
  - A: 3 routes: `src/app/api` (route handlers), `src/app/[lang]/draft` (preview-only), `src/app/[lang]/guides/[...slug]` (catch-all).
  - Evidence: `brikette.yml:54-56`. Route tree scan confirms these are the only problematic patterns.

- Q: Is there existing tooling for route tree scanning?
  - A: No dedicated tool. But `scripts/src/launch-shop/preflight.ts` provides the pattern (checklist of file-system-based validations). The route tree is entirely filesystem-derived (Next.js App Router convention).
  - Evidence: `apps/brikette/src/app/` directory structure; `Glob` results show all pages.

- Q: What's the actual time saved by skipping validation for deploy-only changes?
  - A: ~5-6 minutes. Lint takes ~3-4 min, typecheck takes ~4-5 min for brikette (including dependency builds). Tests are already skipped on staging. Build + deploy takes ~5-6 min and must always run.
  - Evidence: CI run data from `gh run list` and job step durations.

- Q: Are there static export tests in `packages/next-config`?
  - A: Yes, basic test that `OUTPUT_EXPORT=1` sets `output: 'export'` in config. But no test for route compatibility constraints.
  - Evidence: `packages/next-config/__tests__/index.test.mjs:48-54`.

### Open (User Input Needed)

- Q: Should the pre-flight script be invoked automatically as a pre-push hook, or only manually / by the deploy skill?
  - Why it matters: Auto-invocation catches errors early but adds latency to every push. Manual invocation requires developer discipline.
  - Decision impacted: Phase 2 integration strategy.
  - Default assumption: Start manual (invoked by `/deploy-brikette` skill and available as `pnpm preflight-deploy brikette staging`). Add as optional pre-push hook later if adoption is good. Risk: Low — manual is safer; can always tighten later.

- Q: Should Phase 1 (change-aware CI) be implemented for all apps via `reusable-app.yml`, or just for brikette first?
  - Why it matters: Doing all apps is more work upfront but prevents per-app drift. Doing brikette first is faster but means the reusable workflow has brikette-specific logic.
  - Decision impacted: Whether to modify `reusable-app.yml` or create `brikette-ci.yml` with inline logic.
  - Default assumption: Implement in `reusable-app.yml` for all apps — the change detection logic is generic (code vs config paths). Brikette-specific aspects (route hiding, static export) stay in `brikette.yml`. Risk: Low — the reusable workflow already handles app-specific logic via inputs.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - `dorny/paths-filter` is well-understood (used in 4 workflows already). Adding it to `reusable-app.yml` is a known pattern. Route tree scanning is straightforward filesystem work. TypeScript pre-flight script follows existing patterns (`preflight.ts`).
  - What would raise to 90%: Prototype the `dorny/paths-filter` step in `reusable-app.yml` and verify it correctly classifies a deploy-only change vs a code change in a test PR.

- **Approach:** 80%
  - Option B (paths-filter inside reusable-app.yml) is the right approach — centralised, backward-compatible, proven pattern. Phase ordering (CI first, local pre-flight second) makes sense — CI changes have immediate impact, pre-flight is additive.
  - What would raise to 90%: Confirm that `dorny/paths-filter` inside a reusable `workflow_call` correctly reads the caller's trigger diff (not the reusable workflow's file changes). A quick test PR would confirm this.

- **Impact:** 90%
  - Blast radius is well-understood. `reusable-app.yml` modifications affect 4+ app workflows, but the change is additive (new input + conditional `if:`). Default behavior is unchanged. Pre-flight script is purely additive. No risk to existing quality gates for code changes.
  - What would raise to 95%: Measure Turbo remote cache hit rates to confirm Phase 3 (build caching) value before committing to it.

- **Testability:** 75%
  - Route tree scanner and config export linter are highly testable (fixture-based). CI workflow changes are harder to test (require real workflow runs or `act`). Pre-flight script can be integration-tested against real app directories.
  - What would raise to 85%: Create fixture directories for valid/invalid route trees and use them as test cases for the pre-flight script.

## Planning Constraints & Notes

- Must-follow patterns:
  - Reusable workflow pattern — all changes to the pipeline go through `reusable-app.yml`, not per-app workflows
  - `dorny/paths-filter@v3` — use the same action version already in use across the repo
  - Fail-open for change classification — if classification is uncertain, run all validation steps (never skip when unsure)
  - TypeScript for new scripts — consistent with `preflight.ts` and existing tooling
- Rollout/rollback expectations:
  - Phase 1 can be rolled back by removing the `if:` conditions on lint/typecheck/test steps (one commit)
  - Phase 2 is purely additive (new script) — rollback is "don't run it"
  - Test Phase 1 on brikette first (most frequent deploys), then verify other apps still work
- Observability expectations:
  - CI step annotations showing "Skipped lint/typecheck/test: deploy-only change detected" when steps are skipped
  - Pre-flight script should output a clear pass/fail summary with specific issues listed

## Suggested Task Seeds (Non-binding)

1. **Add `dorny/paths-filter` step to `reusable-app.yml`** — Classify changes as code vs deploy-config. Output `code_changed` boolean.
2. **Gate lint/typecheck/test steps on `code_changed`** — Add `if: steps.filter.outputs.code_changed == 'true'` to validation steps. Build always runs.
3. **Add new input `skip-validation`** — Optional override for callers to force-skip validation (useful for `workflow_dispatch` deploy-only runs).
4. **Create `scripts/preflight-deploy.ts`** — Route tree scanner + config export linter + platform constraint checker. Start with brikette's known failure patterns as test cases.
5. **Add route tree fixture tests** — Encode the 5 brikette static export failures as fixture-based test cases for the pre-flight script.
6. **Integrate pre-flight into `/deploy-brikette` skill** — Run pre-flight before triggering CI.
7. **Remove TEMP workarounds** — Re-enable tests on staging branch, fix `validate-deploy-env.sh` (separate tasks, but enabled by faster CI).
8. **Measure Turbo remote cache effectiveness** — Audit cache hit rates to determine Phase 3 value (blocking for Phase 3 go/no-go).

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None — open questions have safe defaults.
- Recommended next step: Proceed to `/plan-feature faster-staging-ci`
