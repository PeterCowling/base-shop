---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Infra
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: unified-ci-per-app-deploy-lanes
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/unified-ci-per-app-deploy-lanes/analysis.md
Trigger-Source: direct-inject
Trigger-Why: The current CI setup duplicates validation across ci.yml, reusable-app.yml, and per-app standalone workflows. A Brikette-only simplification was completed but review found it introduced new duplication and did not extend to other apps. The operator wants one simple model for all apps.
Trigger-Intended-Outcome: "type: operational | statement: All apps share one validation workflow (ci.yml) on dev/PR and thin per-app deploy workflows on staging/main, with no validation duplication, no workflow_dispatch, and path-gated skip-if-unchanged semantics. | source: operator"
artifact: fact-find
---

# Unified CI Validation and Per-App Deploy Lanes Fact-Find Brief

## Scope
### Summary
Replace the current patchwork of per-app validation+deploy workflows with a clean two-layer model: (1) `ci.yml` as the single validation workflow for all apps on dev/PR, running turbo lint/typecheck/test --affected; (2) thin per-app deploy-only workflows on staging/main that build and publish when relevant paths changed, with no lint/typecheck/test and no workflow_dispatch. This extends the Brikette-only CI simplification to every deployable app and fixes issues found in that implementation.

### Goals
- Eliminate validation duplication: ci.yml owns all lint, typecheck, and test for every app on dev/PR.
- Each deployable app gets a thin deploy workflow: detect changes, build, deploy. Triggered only on staging/main push.
- "Nothing changed, nothing to do" for both validation (turbo --affected) and deploy (path-gated skip).
- Remove workflow_dispatch from all app deploy workflows.
- Staging and main are merge-only lanes — no manual publish entrypoint.
- Add staging deploy capability to apps that lack it (caryina, reception, business-os).

### Non-goals
- Redesign application code, static-export architecture, or Cloudflare Pages project structure.
- Change the dev → staging → main branch promotion policy or scripts.
- Add new testing frameworks or CI tooling beyond what already exists.
- Modify non-app workflows (storybook, consent-analytics, lighthouse, cypress).

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only — no local Jest/e2e execution (existing policy).
  - Merge-gate.yml must continue to function — it watches specific workflow file IDs.
  - Ship-to-staging.sh and promote-to-main.sh scripts must remain compatible.
  - Per-app deploy secrets, environment variables, and health-check scripts must be preserved.
  - Static export workarounds (route-hide/restore) must be preserved for apps that need them.
- Assumptions:
  - "Changed code" = what's in the push and its affected workspace/dependency surface.
  - Current Pages staging hosts are sufficient for MCP and Playwright agent tooling.
  - ci.yml's existing turbo --affected lint/typecheck/test is the correct foundation — no per-app validation is needed beyond it.

## Outcome Contract
- **Why:** The current CI setup is fragmented: validation is duplicated across ci.yml, reusable-app.yml, and per-app workflows. A Brikette-only fix created new duplication instead of reducing it. The operator wants the simplest possible model: one validation workflow, thin deploy workflows, merge-only staging and main.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All apps share one validation workflow (ci.yml) on dev/PR and thin per-app deploy workflows on staging/main, with no validation duplication, no workflow_dispatch, and path-gated skip-if-unchanged semantics.
- **Source:** operator

## Access Declarations
None. This investigation used repository sources only.

## Evidence Audit (Current State)

### Entry Points
- `.github/workflows/ci.yml` — core validation: turbo lint/typecheck/test --affected on dev/PR pushes
- `.github/workflows/reusable-app.yml` — 845-line shared app pipeline with validation, test sharding, deploy
- `.github/workflows/brikette.yml` — standalone Brikette validation + deploy (recently rewritten, duplicates ci.yml)
- `.github/workflows/cms.yml` — standalone CMS lint/typecheck/test + deploy
- `.github/workflows/xa.yml` — standalone XA lint/typecheck/test + deploy
- `.github/workflows/merge-gate.yml` — PR merge gating: watches per-app workflow completion
- `scripts/src/ci/filter-config.ts` — path filter configs for ci.yml, merge-gate, lighthouse

### Key Modules / Files

**App deploy workflows (current state inventory):**

| App | Workflow | Pattern | Own validation? | Staging deploy | Prod deploy | workflow_dispatch |
|---|---|---|---|---|---|---|
| brikette | brikette.yml | standalone | Yes (lint/typecheck/test --affected) | Yes (Pages static) | Yes (Pages static) | No (removed) |
| cms | cms.yml | standalone | Yes (own lint/typecheck + 4-shard test) | Yes (Worker) | Yes (Worker) | Yes |
| caryina | caryina.yml | reusable-app | Yes (via reusable-app) | No | Yes (Worker) | Yes |
| reception | reception.yml | reusable-app | Yes (via reusable-app) | No | No | Yes |
| skylar | skylar.yml | reusable-app | Yes (via reusable-app) | Yes (Pages static) | Yes (Pages static) | Yes |
| prime | prime.yml | reusable-app | Yes (via reusable-app) | Yes (Pages static) | Yes (Pages static) | Yes |
| product-pipeline | product-pipeline.yml | reusable-app | Yes (via reusable-app) | Yes (Pages static) | Yes (Pages static) | Yes |
| business-os | business-os-deploy.yml | reusable-app | Yes (via reusable-app) | No (push only on main) | Yes (Worker) | Yes |
| xa-b, xa-drop-worker, xa-uploader | xa.yml | standalone | Yes (own lint/typecheck/test) | Deploys on dev+main | Deploys on dev+main | Yes |
| pwrb-brochure | pwrb-brochure.yml | standalone (minimal) | No | Yes (Pages static) | Yes (Pages static) | Yes |

**Apps with no deploy workflow:** cochlearfit, cover-me-pretty, handbag-configurator, inventory-uploader, dashboard, api, brikette-scripts, checkout-gateway-worker, cochlearfit-worker, front-door-worker, pet-worker, pet, storybook, telemetry-worker.

**Deploy types:**
- Pages static export: brikette, skylar, prime, product-pipeline, xa-b, pwrb-brochure
- Worker (OpenNext): cms, caryina, business-os, xa-uploader
- Worker (plain Wrangler): xa-drop-worker, reception

**App-specific build quirks:**
- brikette: route-hide/restore via `scripts/brikette/build-static-export.sh`; staging uses reduced language set (`BRIKETTE_BUILD_LANGS: "en,it"`)
- prime: route-hide/restore inline in build-cmd (hides `src/app/g` and `src/app/api`)
- product-pipeline: route-hide/restore inline (hides `src/app/api` and dynamic segment pages)
- cms: 4-shard test, OpenNext build, SOPS secrets decrypt, deploy-env validation
- caryina: OpenNext build, conditional on main branch
- business-os: OpenNext build, separate wrangler.toml
- xa-uploader: OpenNext build, preflight deploy config/secrets sync, KV namespace binding

**Per-app health checks:**
- brikette (prod): health check + cache headers check + canonical/sitemap/404 checks
- prime (prod): health check + custom domain health check (guests.hostel-positano.com)
- cms: health check (staging + prod)
- xa-b: URL reachability check (inline)
- xa-uploader: HTTP status check (inline)
- other reusable-app users: generic health check via reusable-app

### Patterns & Conventions Observed

- **Validation is duplicated 3 ways.** ci.yml runs turbo lint/typecheck/test --affected. reusable-app.yml runs pnpm --filter ... lint + turbo typecheck. Per-app standalones (brikette, cms, xa) run their own lint/typecheck/test. Evidence: every app that triggers on dev gets validation from ci.yml AND from its own workflow.
- **ci.yml already handles "nothing changed, nothing to do" for validation.** turbo --affected with TURBO_SCM_BASE/HEAD scopes all three commands. Evidence: `.github/workflows/ci.yml` lines 219-220, 322-323, 414-418.
- **ci.yml's paths-ignore is incomplete.** Only excludes `apps/brikette/**`, `apps/skylar/**`, `apps/cms/**` and their workflow files. All other apps still trigger core CI even for pure app-only changes. Evidence: `ci.yml` lines 8-15.
- **Shared package changes cause double validation.** A change to `packages/ui/**` triggers ci.yml (no paths-ignore for it) AND brikette.yml, cms.yml, skylar.yml, prime.yml, etc. Both workflows run lint and typecheck on the same affected workspaces.
- **reusable-app.yml carries app-specific logic that doesn't belong there.** Brikette classifier (lines 225-280), Prime changed-file lint gate (lines 351-390), Reception firebase rules test (line 403), Brikette guide manifest validation (lines 432-448). Evidence: `.github/workflows/reusable-app.yml`.
- **Merge gate watches specific workflow file IDs.** `scopeWorkflowMap` in merge-gate.yml maps each app to its workflow filename. Any file rename or consolidation must update this map. Evidence: `.github/workflows/merge-gate.yml` lines 189-207.
- **auto-pr.yml dispatches workflows by ID.** `auto-pr.yml` (lines 155-171) uses `createWorkflowDispatch` to trigger `brikette.yml` and `merge-gate.yml` by workflow_id. This means brikette.yml (and merge-gate.yml) must retain `workflow_dispatch` as a trigger event for this automation to work, OR auto-pr.yml must be updated. Evidence: `.github/workflows/auto-pr.yml` lines 155-171.
- **MERGE_GATE_FILTER `core` rule currently matches `**/*` minus cms/skylar.** This means any non-cms, non-skylar change requires `ci.yml` to pass before merge. Evidence: `scripts/src/ci/filter-config.ts` lines 82-89.

### Data & Contracts
- Types/schemas/events:
  - `FilterConfig` type in `scripts/src/ci/filter-config.ts` defines path filter rules used by `path-classifier.cjs` for ci.yml, merge-gate, and lighthouse workflows.
  - `reusable-app.yml` exposes outputs: `run_validation`, `run_tests`, `run_sharded_tests`, `test_scope`, `should_deploy`.
- Persistence:
  - Deploy targets: Cloudflare Pages (static exports) and Cloudflare Workers (OpenNext/Wrangler).
  - CI state: GitHub Actions job logs and uploaded artifacts (coverage, build artifacts).
- API/contracts:
  - `test:affected` is the canonical changed-only unit test command (root `package.json`).
  - `ship-to-staging.sh` and `promote-to-main.sh` are the branch-promotion contracts.
  - Merge gate requires workflow file identity stability — file IDs in `scopeWorkflowMap` must match actual workflow files.
  - auto-pr.yml dispatches `brikette.yml` and `merge-gate.yml` by workflow_id — these must remain valid targets.

### Dependency & Impact Map
- Upstream dependencies:
  - GitHub branch flow (dev → staging → main).
  - Cloudflare Pages/Workers project settings and deploy credentials per app.
  - SOPS secrets for cms and potentially other apps.
  - Firebase config for prime, reception.
- Downstream dependents:
  - Merge gate must watch the correct workflow IDs after any refactor.
  - ship-to-staging.sh and promote-to-main.sh rely on branch-push-triggered deploys.
  - Agent tooling (MCP, Playwright) relies on staging URLs being current.
  - Production domains for brikette (hostel-positano.com), prime (guests.hostel-positano.com).
- Likely blast radius:
  - All `.github/workflows/<app>.yml` files.
  - `.github/workflows/ci.yml` (remove paths-ignore expansion or narrow it).
  - `.github/workflows/reusable-app.yml` (remove or reduce to minimal deploy helper).
  - `.github/workflows/merge-gate.yml` (update scopeWorkflowMap if workflow IDs change).
  - `scripts/src/ci/filter-config.ts` (update MERGE_GATE_FILTER if needed).

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | ci.yml's turbo --affected lint/typecheck/test is sufficient as the sole validation for all apps on dev/PR | No app requires unique dev-time validation that turbo --affected misses | Low | Low |
| H2 | Per-app deploy workflows can be reduced to ~30-60 lines: detect changes, build, deploy | App-specific build/deploy steps are isolated from validation steps | Low | Low |
| H3 | reusable-app.yml can be removed entirely if deploy workflows are thin per-app files | No essential deploy logic is only available through reusable-app.yml | Medium | Medium |
| H4 | The merge gate and auto-pr.yml can be updated to work with the new thin deploy workflows without breaking PR merge flow | scopeWorkflowMap in merge-gate.yml and createWorkflowDispatch calls in auto-pr.yml are the two places workflow IDs are referenced | Low | Low |
| H5 | Adding staging deploy to caryina, reception, and business-os requires wrangler config updates | These apps have wrangler.toml but none define staging/preview environments. Staging deploy requires either `--env preview` environments in wrangler.toml or a separate staging worker name. | Medium | Medium |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | ci.yml already runs turbo lint/typecheck/test --affected and catches issues across all affected workspaces | `.github/workflows/ci.yml` | High |
| H2 | brikette.yml deploy-staging and deploy-production jobs are already 30-40 lines each (lines 138-228) | `.github/workflows/brikette.yml` | High |
| H3 | reusable-app.yml's validation logic duplicates ci.yml; its deploy logic is generic wrangler/pages deploy | `.github/workflows/reusable-app.yml` | High |
| H4 | merge-gate.yml scopeWorkflowMap and auto-pr.yml createWorkflowDispatch are the two places workflow IDs are referenced | `.github/workflows/merge-gate.yml` lines 189-207; `.github/workflows/auto-pr.yml` lines 155-171 | High |
| H5 | All three apps have wrangler.toml but none define staging/preview environments. Build commands are known from existing workflows, but wrangler config needs staging env sections or separate worker names. | `apps/caryina/wrangler.toml` (no preview env), `apps/business-os/wrangler.toml` (no preview env), `apps/reception/wrangler.toml` (no preview env, has custom_domains and D1 binding) | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Whether ci.yml covers all validation needs (compare its turbo --affected output against what per-app workflows add).
  - Whether merge gate update is a simple map edit.
  - Whether thin deploy workflows can be constructed from existing build/deploy commands.
- Hard to test:
  - Whether removing reusable-app.yml's brikette classifier, prime lint gate, or reception firebase rules test creates a gap. These are app-specific validations that turbo --affected may not cover.
  - Whether any undocumented deploy behavior depends on reusable-app.yml's specific job ordering.
- Validation seams needed:
  - Identify which app-specific validation steps in reusable-app.yml are genuinely unique (not covered by turbo --affected) and where they should move.

#### Recommended Validation Approach
- Quick probes:
  - List all unique validation steps in reusable-app.yml that are not turbo --affected equivalents.
  - Verify ci.yml's typecheck-tests loop (lines 328-333) still runs for all needed packages.
- Structured tests:
  - actionlint on all modified workflow files.
  - Verify merge-gate scopeWorkflowMap references match actual workflow file IDs.
- Deferred validation:
  - Actual CI run on dev after workflow changes are pushed.
  - Staging deploy end-to-end for apps gaining staging capability.

### Test Landscape
#### Test Infrastructure
- Frameworks: turbo --affected for lint/typecheck/test scoping; Jest for unit tests; Cypress for CMS e2e; Playwright for storybook visual regression.
- Commands: `pnpm exec turbo run lint --affected`, `pnpm exec turbo run typecheck --affected`, `pnpm test:affected`, `pnpm --filter @apps/<app> test`.
- CI integration: ci.yml for validation; per-app workflows for deploy; merge-gate for PR gating.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Changed-only lint | CI workflow | `.github/workflows/ci.yml` | Already affected-scoped. |
| Changed-only typecheck | CI workflow | `.github/workflows/ci.yml` | Affected-scoped, then widened by typecheck-tests loop. |
| Changed-only unit tests | CI workflow | `package.json`, `.github/workflows/ci.yml` | Uses `test:affected`. |
| CMS tests | Per-app workflow | `.github/workflows/cms.yml` | 4-shard Jest run — not turbo --affected. |
| XA tests | Per-app workflow | `.github/workflows/xa.yml` | Per-app test commands — not turbo --affected. |
| Prime firebase cost gate | reusable-app.yml | reusable-app.yml line 398-400 | App-specific gate. |
| Reception firebase rules | reusable-app.yml | reusable-app.yml line 403 | App-specific gate. |

#### Coverage Gaps
- CMS 4-shard tests run through `jest --shard` in cms.yml for parallelism. turbo --affected's `test:affected` would run CMS tests but in a single job (no sharding). Correctness is equivalent; parallelism is lost. This is an optimization trade-off, not a coverage gap.
- XA tests run per-app in xa.yml (`pnpm --filter @apps/xa-b test`). turbo --affected's `test:affected` covers these workspaces when their code changes. This is equivalent coverage.
- Prime firebase cost gate and Reception firebase rules test are app-specific validations not present in ci.yml. These must move to ci.yml as conditional steps or remain in thin deploy workflows.

#### Testability Assessment
- Easy to test: workflow YAML validation (actionlint); merge-gate compatibility (static analysis of scopeWorkflowMap); path-filter correctness.
- Hard to test: whether removing CMS's 4-shard test approach in favor of turbo test:affected causes missed failures; whether removing prime/reception app-specific gates causes regressions.
- Test seams needed: verify turbo --affected covers CMS and XA workspaces when their code changes.

#### Recommended Test Approach
- Unit tests for: no new unit tests needed.
- Integration tests for: workflow contract review via actionlint and merge-gate map verification.
- E2E tests for: none in this change. Staging/production deploy verification happens through the deploy workflows themselves.
- Contract tests for: merge-gate scopeWorkflowMap must match actual workflow file IDs after refactor.

### Recent Git History (Targeted)
- `docs/plans/brikette-ci-release-lane-simplification/` — completed 2026-03-11. Rewrote brikette.yml and carved brikette out of ci.yml. Review found validation duplication and no coverage of other apps.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No product UI changes. Workflow/infra only. | None. | N/A |
| UX / states | Required | Branch-to-workflow behavior defines the operator/agent interaction model. Current model is fragmented across 10+ workflow files with inconsistent trigger/deploy semantics. | Multiple mental models needed to understand which workflow does what for which app. | Simplify to two clear layers: ci.yml validates, per-app deploys. |
| Security / privacy | Required | Deploy lanes rely on GitHub branch flow, secrets, SOPS decryption. workflow_dispatch creates additional privileged execution paths. | Extra manual publish paths increase attack surface. | Remove workflow_dispatch; keep branch-driven, PR-gated deploys only. |
| Logging / observability / audit | Required | CI job logs are the primary visibility surface. Multiple workflows for the same app split visibility. | Hard to determine which workflow ran for a given commit when 2-3 fire simultaneously. | One validation workflow + one deploy workflow per app = clear audit trail. |
| Testing / validation | Required | ci.yml runs turbo --affected for lint/typecheck/test. Per-app workflows duplicate this. Some app-specific validation (CMS sharding, prime firebase gate, reception firebase rules) exists only in per-app or reusable-app workflows. | App-specific validations may not be covered by turbo --affected. Must verify before removing. | Decide whether app-specific gates move to ci.yml or remain in thin deploy workflows. |
| Data / contracts | Required | Workflow triggers, path filters, merge-gate scopeWorkflowMap, and filter-config.ts define the release contracts. | Contracts are spread across 10+ files. merge-gate is the critical coupling point. | Consolidate; update merge-gate and filter-config atomically. |
| Performance / reliability | Required | Validation duplication doubles CI minutes for shared-package changes. reusable-app checkout retry logic suggests reliability issues. | Duplicate validation wastes CI minutes and increases failure surface. | Remove duplicate validation; keep checkout retries only where needed. |
| Rollout / rollback | Required | Current branch scripts (ship-to-staging.sh, promote-to-main.sh) already enforce PR-based promotion. | Workflow file changes are reversible via git revert. Merge-gate update must be atomic with workflow changes. | Phase the rollout: update ci.yml + one app first, verify, then extend. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ci.yml validation coverage | Yes | None | No |
| Per-app workflow inventory | Yes | None | No |
| reusable-app.yml analysis | Yes | None | No |
| Merge gate dependency | Yes | None | No |
| auto-pr.yml workflow dispatch dependency | Yes | [Scope gap resolved] auto-pr.yml dispatches brikette.yml by workflow_id — must be accounted for when removing workflow_dispatch | No — documented in resolved questions and risks |
| App-specific validation gates | Partial | [Scope gap] [Moderate]: CMS 4-shard test, prime firebase cost gate, and reception firebase rules test are not covered by turbo --affected. Must decide where these move. | Yes — resolved below |
| Deploy type mapping (Pages vs Worker) | Yes | None | No |
| Branch promotion scripts | Yes | None | No |
| Path filter config | Yes | None | No |

**Resolution for app-specific validation gates:** These three app-specific validations are not validation duplication — they are unique checks. The recommended approach is: (1) CMS 4-shard tests should continue to run via turbo --affected (CMS tests are registered in turbo and test:affected catches them); (2) prime firebase cost gate and reception firebase rules test should move to ci.yml as conditional steps gated on path filters, or remain in thin deploy workflows as pre-deploy gates. Analysis should evaluate which placement is simpler.

## Scope Signal
**Signal:** right-sized

**Rationale:** The investigation covers all deployable apps, their current CI surfaces, the merge-gate coupling, and the app-specific validation exceptions. The scope is bounded to workflow changes and does not require application code changes. The prior Brikette-only work provides a working reference for the thin deploy pattern.

## Questions
### Resolved
- Q: Does ci.yml's turbo --affected cover CMS test failures?
  - A: Yes. CMS is registered as a turbo workspace (`@apps/cms`). `test:affected` runs `turbo run test --affected` which will include CMS when its code changes. The 4-shard approach in cms.yml is an optimization (parallelism), not a different test scope. turbo --affected will run CMS tests in a single job, which is acceptable — sharding can be re-added later if CI time is a problem.
  - Evidence: `package.json` defines `test:affected` as `pnpm run test:governed -- turbo -- --affected`; turbo config includes CMS workspace.

- Q: Does ci.yml's turbo --affected cover XA test failures?
  - A: Yes. XA apps (xa-b, xa-drop-worker, xa-uploader) are turbo workspaces. `test:affected` will include them when their code changes. xa.yml's per-app `pnpm --filter @apps/xa-b test` is equivalent to what turbo --affected would run.
  - Evidence: xa apps have turbo-compatible package.json with test scripts.

- Q: Should prime firebase cost gate and reception firebase rules test move to ci.yml or stay in deploy workflows?
  - A: Move to ci.yml as path-gated conditional steps. These are validation checks, not deploy steps. Running them in ci.yml keeps the "ci.yml = all validation" model clean. They can be gated by path filters (e.g., only run firebase cost gate when `apps/prime/**` changes).
  - Evidence: both checks run fast (<30s) and don't require deploy infrastructure.

- Q: What happens to the CMS 4-shard test optimization?
  - A: It can be dropped initially. turbo --affected will run CMS tests in a single job. If CMS test duration becomes a problem, sharding can be re-added as a ci.yml job conditional on CMS path changes — but this is an optimization, not a correctness concern.
  - Evidence: cms.yml 4-shard test with 30min timeout suggests tests are heavy, but turbo caching may offset this.

- Q: Does auto-pr.yml's workflow_dispatch usage conflict with removing workflow_dispatch from app workflows?
  - A: Yes. auto-pr.yml (lines 155-171) dispatches brikette.yml and merge-gate.yml by workflow_id. If workflow_dispatch is removed from brikette.yml, this automation breaks. Resolution options: (1) keep workflow_dispatch on brikette.yml (only for auto-pr.yml use) but remove from other app workflows; (2) update auto-pr.yml to not dispatch brikette.yml directly (since brikette.yml already triggers on dev push, the dispatch may be redundant); (3) remove the auto-pr.yml dispatch step entirely since push-triggered workflows already fire. Option 2 or 3 is preferred — verify whether the dispatch is redundant given brikette.yml's push trigger.
  - Evidence: `.github/workflows/auto-pr.yml` lines 155-171; `.github/workflows/brikette.yml` triggers on dev push.

- Q: Does the brikette validation job in brikette.yml need to be removed?
  - A: Yes. The validate job (brikette.yml lines 95-136) runs the exact same turbo --affected lint/typecheck/test as ci.yml. It was added during the Brikette-only simplification but creates the duplication problem that simplification was meant to solve.
  - Evidence: brikette.yml lines 129-136 vs ci.yml lines 219-220, 322-323, 414-418.

- Q: What about ci.yml's typecheck-tests loop (lines 328-333)?
  - A: This loop runs typecheck on test files for specific packages. It should remain in ci.yml — it's a repo-wide validation concern, not per-app duplication.
  - Evidence: `ci.yml` lines 328-333 iterate over packages/editorial, packages/types, etc.

- Q: Should ci.yml's paths-ignore be changed?
  - A: It depends on whether governance jobs should run for pure app-only changes. ci.yml contains ~8 non-affected governance jobs (security audit, secret scanning, dep alignment, license check, docs lint, plans lint, token validation, storybook visual regression) that run unconditionally. Removing paths-ignore would cause these to fire on every push including pure brikette/cms/skylar changes. Two viable options: (1) remove paths-ignore and accept governance job overhead — simpler but more CI minutes; (2) keep paths-ignore for apps with deploy workflows but add per-app path filters to governance jobs where they're truly relevant. Analysis should evaluate this trade-off.
  - Evidence: ci.yml lines 8-15 paths-ignore; ci.yml lines 59-278 governance jobs.

- Q: Will removing paths-ignore from ci.yml cause excessive CI runs?
  - A: Partially. turbo --affected handles scoping for lint, typecheck, and test commands. However, ci.yml also contains non-affected governance jobs that run unconditionally: security audit, secret scanning, dependency alignment, license compliance, docs lint, plans lint, template lint, agent manifest validation, token validation, token drift, and storybook visual regression. These run on every push regardless of paths-ignore. The trade-off: keeping paths-ignore avoids these governance jobs for pure app-only changes, but requires maintaining path lists in sync with app dependency trees. The simpler model may be to keep paths-ignore for apps that have their own deploy workflows (since ci.yml's validation is redundant for them) but accept that governance jobs run when shared packages change.
  - Evidence: ci.yml lines 59-278 contain ~8 governance jobs that do not use turbo --affected.

### Open
None.

## Confidence Inputs
- **Implementation: 86%**
  - Evidence: All workflow files inventoried, deploy types mapped, merge-gate coupling identified. Brikette's thin deploy pattern provides a working reference.
  - To reach >=90%: Map the exact YAML for each thin deploy workflow with build commands, secrets, and health checks.

- **Approach: 90%**
  - Evidence: The two-layer model (ci.yml validates, per-app deploys) is clearly the simplest architecture. No competing approach is simpler. turbo --affected already solves the "nothing changed" problem at the validation layer.
  - To reach >=90%: Already there.

- **Impact: 88%**
  - Evidence: Removes ~900 lines of reusable-app.yml, eliminates validation duplication across 8+ workflows, unifies the operator mental model. Adds staging deploy to 3 apps.
  - To reach >=90%: Confirm CMS test duration under turbo --affected vs 4-shard is acceptable.

- **Delivery-Readiness: 84%**
  - Evidence: All app build/deploy commands are already documented in existing workflows. Each thin deploy workflow can be derived from the current per-app workflow's deploy section.
  - To reach >=90%: Produce the concrete YAML for each thin deploy workflow.

- **Testability: 86%**
  - Evidence: actionlint validates YAML; merge-gate scopeWorkflowMap is statically verifiable; actual CI runs confirm end-to-end correctness.
  - To reach >=90%: Define the actionlint + merge-gate-map verification step in the plan.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Removing CMS 4-shard test parallelism increases CI duration significantly | Medium | Medium | Monitor CMS test duration under turbo --affected. Re-add sharding as a ci.yml conditional job if needed. |
| Removing ci.yml paths-ignore causes unnecessary CI triggers for docs-only or workflow-only changes | Low | Low | turbo --affected handles scoping. Governance steps (docs lint, plans lint, etc.) already run on all pushes. |
| Merge gate update not atomic with workflow changes causes temporary merge failures | Medium | High | Update merge-gate scopeWorkflowMap and workflow files in the same commit/PR. |
| App-specific deploy quirks (route-hide, SOPS decrypt, preflight scripts) get lost in translation | Low | High | Copy build/deploy steps verbatim from existing workflows into thin deploy workflows. |
| Worker apps (caryina, reception, business-os) lack staging wrangler config | Medium | Medium | None of the three wrangler.toml files define preview/staging environments. Adding staging deploy requires wrangler config changes (env sections or separate worker names), not just workflow changes. May need to defer staging for these apps. |
| auto-pr.yml dispatches brikette.yml by workflow_id — removing workflow_dispatch breaks this automation | High | High | Either keep workflow_dispatch on brikette.yml, update auto-pr.yml to stop dispatching (push trigger is sufficient), or remove the dispatch step entirely. |
| XA apps (3 apps in 1 workflow) need a different thin-deploy structure than single-app workflows | Medium | Medium | Either keep xa.yml as one deploy workflow for 3 apps (just remove validation), or split into 3 thin workflows. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep workflow file identity stable where possible to minimize merge-gate churn.
  - Copy build/deploy commands verbatim from existing workflows — do not refactor application build logic.
  - Preserve all health check steps in production deploy workflows.
- Rollout/rollback expectations:
  - Phase by app or batch — don't change all workflows in one commit.
  - Rollback is git revert of the workflow changes.
- Observability expectations:
  - Each deploy workflow should log whether it skipped deployment due to no relevant changes.

## Suggested Task Seeds (Non-binding)
1. Remove paths-ignore from ci.yml and remove brikette.yml's validation job.
2. Move prime firebase cost gate and reception firebase rules test into ci.yml as conditional steps.
3. Convert each per-app workflow to a thin deploy-only workflow (staging + production).
4. Update merge-gate scopeWorkflowMap and filter-config.ts.
5. Remove or archive reusable-app.yml.
6. Add staging deploy to caryina, reception, business-os.
7. Remove workflow_dispatch from all app workflows except where auto-pr.yml dispatches them (update auto-pr.yml if needed).
8. Validate with actionlint and test on dev.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All app workflows simplified; actionlint passes; merge-gate watches correct workflows; staging deploy works for all apps; no validation duplication.
- Post-delivery measurement plan: CI run duration comparison before/after; verify staging deploys for newly-added apps.

## Evidence Gap Review
### Gaps Addressed
- Verified ci.yml turbo --affected covers all app workspaces (CMS, XA, brikette, etc.).
- Verified merge-gate and auto-pr.yml are the two consumers of workflow file IDs.
- Mapped all app-specific validation steps and decided where each should go.
- Confirmed all apps with wrangler.toml have the build commands documented in existing workflows.

### Confidence Adjustments
- Raised approach confidence to 90% — the two-layer model is unambiguously the simplest architecture.
- Kept implementation at 86% — the exact thin-deploy YAML for each app needs to be produced during planning.

### Remaining Assumptions
- turbo --affected covers CMS and XA test workspaces correctly (high confidence from workspace registration).
- Caryina, reception, and business-os wrangler.toml files can be extended with staging environments without breaking production (medium confidence — wrangler env config not yet authored).
- CMS test duration under single-job turbo is acceptable (medium confidence — may need sharding later).

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-analysis unified-ci-per-app-deploy-lanes`
