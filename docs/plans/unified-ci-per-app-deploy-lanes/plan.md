---
Type: Plan
Status: Draft
Domain: Infra
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: unified-ci-per-app-deploy-lanes
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/unified-ci-per-app-deploy-lanes/analysis.md
artifact: plan
---

# Unified CI Validation and Per-App Deploy Lanes Plan

## Summary
Replace the current fragmented CI/CD setup with a clean two-layer model: ci.yml as the sole validation workflow for all apps on dev/PR (turbo lint/typecheck/test --affected), and thin per-app deploy-only workflows on staging/main. This eliminates validation duplication across ci.yml, reusable-app.yml, and 10+ per-app workflows. The plan phases: (1) make ci.yml universal, (2) convert all per-app workflows to deploy-only, (3) update merge-gate/auto-pr and archive reusable-app.yml, (4) define the missing Worker staging prerequisite contract, then (5) add Worker staging deploys with Reception split from Caryina/Business OS because its safe deploy path and staging resource model are materially different.

## Active tasks
- [ ] TASK-01: Make ci.yml the universal validation workflow
- [ ] TASK-02: Strip standalone app workflows to deploy-only
- [ ] TASK-03: Convert Pages reusable-app callers to thin deploy-only
- [ ] TASK-04: Convert Worker reusable-app callers to thin deploy-only
- [ ] TASK-05: Horizon checkpoint — reassess downstream plan
- [ ] TASK-07: Define Worker staging prerequisite contract
- [ ] TASK-06: Update merge-gate, narrow triggers, archive reusable-app.yml
- [ ] TASK-08: Add staging deploy for Caryina and Business OS
- [ ] TASK-09: Add staging deploy for Reception

## Goals
- ci.yml is the sole validation workflow for all apps on dev/PR. (Exception: promotion PRs dev→main skip lint/typecheck/test via promote-app:* guards — intentional, since validation already ran on the dev push.)
- Per-app deploy workflows are thin: detect changes, build, deploy. No lint/typecheck/test.
- "Nothing changed, nothing to do" at both layers (turbo --affected for validation, path-gated for deploy).
- Remove workflow_dispatch from all app workflows (with auto-pr.yml exception handled).
- Staging and main are merge-only lanes — no manual publish entrypoint.
- Add staging deploy to apps that lack it (caryina, reception, business-os).

## Non-goals
- Redesign app code, static-export architecture, or Cloudflare project structure.
- Change the dev → staging → main branch promotion policy.
- Modify non-app workflows (storybook, consent-analytics, lighthouse, cypress).
- Add new testing frameworks or CI tooling.

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only — no local Jest/e2e execution (existing policy).
  - merge-gate.yml scopeWorkflowMap must reference correct workflow file IDs after changes.
  - auto-pr.yml dispatches brikette.yml and merge-gate.yml by workflow_id.
  - Per-app deploy secrets, environment variables, build quirks (route-hide/restore, SOPS decrypt, OpenNext), and health checks must be preserved verbatim.
  - ci.yml paths-ignore removal must happen before or atomically with per-app validation removal.
- Assumptions:
  - turbo --affected correctly scopes lint/typecheck/test to changed workspaces (verified in fact-find).
  - Keeping workflow filenames stable avoids merge-gate scopeWorkflowMap changes.
  - CMS test duration under single-job turbo is acceptable initially; sharding can be re-added if needed.

## Inherited Outcome Contract
- **Why:** The current CI setup is fragmented: validation is duplicated across ci.yml, reusable-app.yml, and per-app workflows. A Brikette-only fix created new duplication instead of reducing it. The operator wants the simplest possible model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All apps share one validation workflow (ci.yml) on dev/PR and thin per-app deploy workflows on staging/main, with no validation duplication, no workflow_dispatch, and path-gated skip-if-unchanged semantics.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/unified-ci-per-app-deploy-lanes/analysis.md`
- Selected approach inherited:
  - Option A: Remove ci.yml paths-ignore entirely. ci.yml validates all pushes via turbo --affected. Per-app workflows become deploy-only on staging/main.
- Key reasoning used:
  - Simplest configuration — operator explicitly prioritized simplicity.
  - No governance coverage gap — all pushes get security audit, license checks, etc.
  - One mental model: ci.yml validates everything, per-app workflows only deploy.
  - CI minute cost (~5-10 min governance jobs on pure app-only pushes) is acceptable.

## Selected Approach Summary
- What was chosen:
  - Remove ci.yml paths-ignore. ci.yml validates all pushes. Per-app workflows become deploy-only (staging + main, path-gated, merge-only). Archive reusable-app.yml.
- Why planning is not reopening option selection:
  - Analysis evaluated 3 options and decisively selected Option A with clear rejection rationale for B (governance gap + sync burden) and C (kitchen-sink reusable deploy recreates the problem). Score: 4.2/5.0 credible.

## Fact-Find Support
- Supporting brief: `docs/plans/unified-ci-per-app-deploy-lanes/fact-find.md`
- Evidence carried forward:
  - Complete app workflow inventory with patterns, validation duplication, staging/prod deploy status, and workflow_dispatch presence.
  - All app build commands documented from existing workflows.
  - merge-gate scopeWorkflowMap and auto-pr.yml dispatch dependency mapped.
  - Worker apps (caryina, reception, business-os) lack staging wrangler config.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Partially — TASK-01 through TASK-08 are sequenced for build once predecessors complete; TASK-09 remains below the IMPLEMENT confidence floor pending TASK-07 evidence

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Make ci.yml universal validation | 85% | M | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Strip standalone workflows to deploy-only (cms, xa, pwrb-brochure) | 85% | S | Pending | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Convert Pages reusable-app callers to thin deploy-only (skylar, prime, product-pipeline) | 85% | M | Pending | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Convert Worker reusable-app callers to thin deploy-only (caryina, reception, business-os) | 80% | M | Pending | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Horizon checkpoint — reassess downstream plan | 95% | S | Pending | TASK-02, TASK-03, TASK-04 | TASK-06, TASK-07 |
| TASK-07 | INVESTIGATE | Define Worker staging prerequisite contract (caryina, reception, business-os) | 85% | M | Pending | TASK-05 | TASK-08, TASK-09 |
| TASK-06 | IMPLEMENT | Update merge-gate, narrow triggers, archive reusable-app.yml | 82% | L | Pending | TASK-05 | TASK-08, TASK-09 |
| TASK-08 | IMPLEMENT | Add staging deploy for Caryina and Business OS | 80% | M | Pending | TASK-06, TASK-07 | - |
| TASK-09 | IMPLEMENT | Add staging deploy for Reception | 70% | M | Pending | TASK-06, TASK-07 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: no product UI changes — workflow/infra only | - | - |
| UX / states | Required: clear two-layer model (ci.yml validates, per-app deploys) replaces fragmented multi-workflow model | TASK-01 through TASK-06 | Operator mental model simplification |
| Security / privacy | Required: workflow_dispatch removed (with auto-pr.yml exception), all pushes get governance checks | TASK-01, TASK-06 | No more manual publish paths |
| Logging / observability / audit | Required: one validation workflow + one deploy workflow per app = clear audit trail | TASK-01 through TASK-04 | Deploy workflows log skip-if-unchanged |
| Testing / validation | Required: ci.yml turbo --affected covers all apps; app-specific gates (prime firebase, reception firebase rules) moved to ci.yml | TASK-01 | actionlint on all modified workflows |
| Data / contracts | Required: merge-gate scopeWorkflowMap, auto-pr.yml dispatch, filter-config.ts updated atomically | TASK-06 | Workflow file IDs kept stable where possible |
| Performance / reliability | Required: validation duplication eliminated; CMS 4-shard dropped (monitor for re-add) | TASK-01, TASK-02 | ~5-10 min governance overhead on pure app pushes accepted |
| Rollout / rollback | Required: phased by task; rollback via git revert of workflow changes | All tasks | Merge-gate update must be atomic with workflow identity changes |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must complete before any per-app workflow changes |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 | All three run in parallel — independent app groups |
| 3 | TASK-05 | TASK-02, TASK-03, TASK-04 | Checkpoint: verify CI runs clean, reassess TASK-06/07 |
| 4 | TASK-07, TASK-06 | TASK-05 | TASK-07 is artifact-only and marks source files as `[readonly]`, so it can run in parallel with TASK-06 without false file-overlap blocking |
| 5 | TASK-08 | TASK-06, TASK-07 | Caryina and Business OS are the first Worker staging implementations once the contract is defined |
| 6 | TASK-09 | TASK-06, TASK-07 | Reception remains separately blocked below threshold; re-run `/lp-do-replan` after TASK-07 if its prerequisite artifact changes the topology materially |

**Max parallelism:** 3 tasks (Wave 2)
**Critical path:** 6 waves including the confidence-gated Reception staging lane

## Tasks

### TASK-01: Make ci.yml the universal validation workflow
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/ci.yml` and `.github/workflows/brikette.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.github/workflows/ci.yml`, `.github/workflows/brikette.yml`, `scripts/src/ci/filter-config.ts`, `[readonly] .github/workflows/reusable-app.yml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - paths-ignore block at ci.yml lines 7-23 is clearly defined; brikette.yml validate job at lines 95-136 is self-contained; filter-config.ts CI_FILTER paths are documented
  - Approach: 90% - analysis decisively chose this; no alternative evaluation needed
  - Impact: 90% - eliminates the root cause of validation duplication
- **Acceptance:**
  - ci.yml push and pull_request triggers have no paths-ignore entries
  - CI_FILTER in filter-config.ts extended with `prime` and `reception` path entries (so ci.yml can gate app-specific steps)
  - ci.yml has conditional prime firebase cost gate step, gated on CI_FILTER `prime` output
  - ci.yml has conditional reception firebase rules test step, gated on CI_FILTER `reception` output
  - brikette.yml validate job (lines 95-136) is removed
  - brikette.yml keeps current triggers (dev, staging, main, pull_request) during this task — deploy jobs skip on dev/PR since they're gated on staging/main. Trigger narrowing deferred to TASK-06 (atomic with merge-gate update)
  - ci.yml promote-app:* job guards remain unchanged (intentional: promotion PRs skip validation because it already ran on dev push)
  - actionlint passes on modified workflow files
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no user-facing state changes
  - Security / privacy: Required - all pushes now get governance checks (security audit, secret scanning, license)
  - Logging / observability / audit: Required - ci.yml is now the single validation audit trail for all apps
  - Testing / validation: Required - verify turbo --affected covers all workspaces after paths-ignore removal; actionlint on ci.yml and brikette.yml
  - Data / contracts: Required - ci.yml trigger contract changes (no more paths-ignore exclusions)
  - Performance / reliability: Required - governance jobs now run on all pushes (~5-10 min overhead accepted)
  - Rollout / rollback: Required - git revert of ci.yml + brikette.yml changes; verify merge-gate still passes
- **Validation contract (TC-XX):**
  - TC-01: Push to dev with brikette-only change -> ci.yml triggers (previously excluded by paths-ignore)
  - TC-02: Push to dev with shared package change -> ci.yml lint/typecheck/test --affected runs once (not duplicated by brikette.yml validate)
  - TC-03: Push to dev with prime changes -> prime firebase cost gate runs in ci.yml
  - TC-04: Push to dev with reception changes -> reception firebase rules test runs in ci.yml
  - TC-05: actionlint passes on ci.yml and brikette.yml
- **Execution plan:** Red -> Green -> Refactor
  1. Remove paths-ignore block from ci.yml push trigger (lines 7-15) and pull_request trigger (lines 17-23)
  2. Add `prime` and `reception` path entries to BOTH `scripts/src/ci/filter-config.ts` (CI_FILTER) AND its runtime mirror `scripts/ci/path-classifier.cjs` (CI_FILTER object). Both files must stay in sync — filter-config.ts is the TypeScript source, path-classifier.cjs is the standalone CJS runtime file executed by CI.
  3. Wire new CI_FILTER outputs through ci.yml changes job → new step outputs
  4. Add conditional step in ci.yml for prime firebase cost gate: gated on `prime` filter output → `pnpm --filter @apps/prime test:firebase-cost-gate`
  5. Add conditional step in ci.yml for reception firebase rules test: gated on `reception` filter output → `pnpm --filter @apps/reception test:rules`
  6. Remove brikette.yml validate job (lines 95-136) and remove `needs: [validate]` from deploy jobs if present
  7. Remove brikette.yml validate job only — keep triggers on dev/PR/staging/main (deploy jobs skip on dev/PR; trigger narrowing deferred to TASK-06)
  8. Run actionlint on ci.yml, brikette.yml, and verify filter-config.ts compiles and path-classifier.cjs is in sync
- **Planning validation (required for M/L):**
  - Checks run: Verified ci.yml paths-ignore at lines 7-23 (push) and corresponding pull_request block; verified brikette.yml validate job at lines 95-136; verified prime firebase cost gate at reusable-app.yml lines 397-400; verified reception firebase rules test at reusable-app.yml lines 402-405
  - Validation artifacts: ci.yml, brikette.yml, reusable-app.yml read in full
  - Unexpected findings: None
- **Scouts:** None: all file locations and content verified
- **Edge Cases & Hardening:**
  - Edge case: ci.yml governance jobs running on pure app-only pushes — accepted trade-off per analysis
  - Edge case: brikette.yml deploy jobs may have `needs: [validate]` — must update dependency chain when validate is removed
- **What would make this >=90%:**
  - Verify the exact ci.yml path filter mechanism for conditional app-specific gates (dorny/paths-filter or custom)
- **Rollout / rollback:**
  - Rollout: Push ci.yml + brikette.yml changes together; verify CI on dev
  - Rollback: git revert both files
- **Documentation impact:** None
- **Notes / references:**
  - ci.yml paths-ignore: lines 7-23
  - brikette.yml validate: lines 95-136
  - Prime firebase cost gate: reusable-app.yml lines 397-400 (`pnpm --filter @apps/prime test:firebase-cost-gate`)
  - Reception firebase rules: reusable-app.yml lines 402-405 (`pnpm --filter @apps/reception test:rules`)

### TASK-02: Strip standalone app workflows to deploy-only (cms, xa, pwrb-brochure)
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/cms.yml`, `.github/workflows/xa.yml`, `.github/workflows/pwrb-brochure.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/cms.yml`, `.github/workflows/xa.yml`, `.github/workflows/pwrb-brochure.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - all three workflows read in full; validation jobs and deploy jobs clearly separated
  - Approach: 90% - direct removal of validation jobs is mechanical
  - Impact: 85% - eliminates validation duplication for 3 standalone workflows
- **Acceptance:**
  - cms.yml: lint-typecheck job removed, 4-shard test job removed, build job removed (deploy job does its own build); triggers kept on dev/staging/main + pull_request during transition (deploy job `if:` gated on staging/main — skips on dev/PR); workflow_dispatch removed; SOPS decrypt, deploy-env validation, health check preserved
  - xa.yml: validate job removed, test job removed; triggers kept on dev+main during transition (deploy jobs `if:` gated on staging/main — skip on dev); workflow_dispatch removed; all 3 deploy jobs preserved with their build/deploy/health-check steps; xa-b health check URL updated to handle staging branch (`https://staging.xa-b-site.pages.dev/` case added)
  - pwrb-brochure.yml: workflow_dispatch removed (already has no validation); triggers remain staging/main push
  - Trigger narrowing to staging/main-only deferred to TASK-06 (atomic with merge-gate update)
  - Workflow filenames unchanged (merge-gate compatibility)
  - actionlint passes on all three
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no user-facing state changes
  - Security / privacy: Required - workflow_dispatch removed from all three
  - Logging / observability / audit: N/A - deploy job logging unchanged
  - Testing / validation: Required - actionlint on modified workflows
  - Data / contracts: Required - cms.yml and xa.yml deploy jobs gated with `if:` on staging/main; trigger narrowing deferred to TASK-06
  - Performance / reliability: Required - CMS 4-shard dropped; monitor test duration under turbo --affected
  - Rollout / rollback: Required - git revert of modified workflow files
- **Validation contract (TC-XX):**
  - TC-01: cms.yml on staging push with CMS changes -> deploys (no lint/typecheck/test)
  - TC-02: xa.yml on main push with xa-b changes -> deploys xa-b (no lint/typecheck/test)
  - TC-03: xa.yml on dev push -> fires but deploy jobs skip (gated with `if:` on staging/main); trigger narrowing deferred to TASK-06
  - TC-04: pwrb-brochure.yml -> no workflow_dispatch trigger
  - TC-05: actionlint passes on all three
- **Execution plan:** Red -> Green -> Refactor
  1. cms.yml: Remove lint-typecheck job (lines 61-83), test job (lines 85-122), build job (lines 124-145); restructure deploy job to include its own build steps (checkout, setup, SOPS decrypt, validate-deploy-env, OpenNext build, deploy, health check); KEEP existing triggers (dev/staging/main + pull_request) during transition — deploy jobs gated with `if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'` so they skip on dev/PR; remove workflow_dispatch
  2. xa.yml: Remove validate job (lines 20-52), test job (lines 54-77); remove `needs: [test]` from deploy jobs; KEEP existing triggers (dev+main) during transition — deploy jobs gated with `if:` on staging/main; add staging to branch list; remove workflow_dispatch; xa-b health check URL: add `elif [ "$GITHUB_REF_NAME" = "staging" ]` case
  3. pwrb-brochure.yml: Remove workflow_dispatch line (already staging/main only)
  4. Run actionlint on all three
  - Note: trigger narrowing to staging/main-only happens atomically in TASK-06
- **Planning validation:** None required for S effort
- **Scouts:** None: all workflows read in full
- **Edge Cases & Hardening:**
  - Edge case: cms.yml deploy job currently `needs: [build]` — when build job is removed, deploy must be self-contained with its own build steps
  - Edge case: xa.yml deploy jobs `needs: [test]` — must remove this dependency
  - Edge case: xa.yml currently triggers on dev+main; must change to staging+main for consistency
  - Edge case: xa-b health check URL uses `dev` branch name; adding staging requires a third branch case (`elif staging → staging.xa-b-site.pages.dev`)
- **What would make this >=90%:**
  - Push and verify CI run confirms no regressions
- **Rollout / rollback:**
  - Rollout: Push all three together; verify CI
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:**
  - cms.yml: 204 lines currently; will shrink to ~80 lines (deploy section)
  - xa.yml: 222 lines currently; will shrink to ~140 lines (3 deploy jobs)
  - pwrb-brochure.yml: 34 lines; will shrink to 33 lines

### TASK-03: Convert Pages reusable-app callers to thin deploy-only (skylar, prime, product-pipeline)
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/skylar.yml`, `.github/workflows/prime.yml`, `.github/workflows/product-pipeline.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.github/workflows/skylar.yml`, `.github/workflows/prime.yml`, `.github/workflows/product-pipeline.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - all three caller workflows read in full; build commands, artifact paths, deploy commands, health checks documented verbatim from existing callers
  - Approach: 90% - brikette.yml deploy jobs are the proven reference pattern
  - Impact: 85% - removes reusable-app dependency for 3 apps
- **Acceptance:**
  - Each workflow is standalone (no `uses: ./.github/workflows/reusable-app.yml`)
  - Each keeps existing triggers (dev/staging/main + pull_request) during transition — deploy jobs gated with `if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'` so they skip on dev/PR; workflow_dispatch removed
  - Trigger narrowing to staging/main-only deferred to TASK-06 (atomic with merge-gate update)
  - Each has: checkout, setup-repo, path-filter check ("nothing changed, nothing to do"), build, deploy, health check
  - Build commands copied verbatim from current caller `build-cmd` inputs (including route-hide/restore for prime and product-pipeline)
  - Deploy commands copied verbatim from current caller `deploy_cmd` inputs
  - Health checks preserved per current caller inputs
  - prime.yml retains `healthcheck-custom-domain` job for guests.hostel-positano.com on main
  - Workflow filenames unchanged
  - actionlint passes on all three
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no user-facing state changes
  - Security / privacy: Required - workflow_dispatch removed; secrets: inherit replaced with explicit secret references
  - Logging / observability / audit: Required - deploy jobs log skip reason when path filter shows no changes
  - Testing / validation: Required - actionlint on modified workflows
  - Data / contracts: Required - workflow trigger contracts change; path filter lists must match current caller + reusable-app path coverage
  - Performance / reliability: N/A - deploy-only jobs don't change performance characteristics
  - Rollout / rollback: Required - git revert of workflow files
- **Validation contract (TC-XX):**
  - TC-01: skylar.yml on staging push with skylar changes -> builds static export + deploys to Pages staging branch
  - TC-02: prime.yml on main push with prime changes -> builds with route-hide/restore + deploys to Pages main branch + runs health check + runs custom domain health check
  - TC-03: product-pipeline.yml on staging push with no product-pipeline changes -> skips (path filter)
  - TC-04: All three still fire on dev push/PR during transition (but deploy jobs skip via `if:` gate) — trigger narrowing deferred to TASK-06
  - TC-05: actionlint passes on all three
- **Execution plan:** Red -> Green -> Refactor
  1. Write skylar.yml as standalone thin deploy (model after brikette.yml deploy pattern):
     - Triggers: KEEP existing (push to dev/staging/main + pull_request) during transition; deploy job gated with `if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'`; remove workflow_dispatch
     - Job: checkout, setup-repo, dorny/paths-filter, build (`OUTPUT_EXPORT=1 pnpm --filter @apps/skylar... build`), deploy (`wrangler pages deploy apps/skylar/out --project-name skylar --branch ${{ github.ref_name }}`), health check
  2. Write prime.yml as standalone thin deploy:
     - Same trigger pattern; build-cmd includes route-hide/restore for `src/app/g` and `src/app/api`
     - Includes `healthcheck-custom-domain` job on main
  3. Write product-pipeline.yml as standalone thin deploy:
     - Same trigger pattern; build-cmd includes route-hide/restore for `src/app/api` and dynamic segment pages
  4. Run actionlint on all three
  - Note: trigger narrowing to staging/main-only happens atomically in TASK-06
- **Planning validation (required for M/L):**
  - Checks run: Read skylar.yml (61 lines), prime.yml (81 lines), product-pipeline.yml (62 lines) in full; extracted build-cmd, artifact-path, deploy_cmd, environment-name, environment-url, healthcheck-args from each
  - Validation artifacts: All three caller workflows + reusable-app.yml deploy section
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none (deploy workflows produce deploy artifacts, not consumed by other workflows)
  - Modified behavior: workflows no longer call reusable-app.yml → reusable-app.yml has fewer callers (tracked in TASK-06 for archival)
  - Consumer `merge-gate.yml` is unchanged because workflow filenames are stable
- **Scouts:** None: build/deploy commands verified from existing callers
- **Edge Cases & Hardening:**
  - Edge case: prime route-hide/restore must preserve exit code (existing pattern uses subshell with `e=$?`)
  - Edge case: product-pipeline route-hide/restore hides both API dir and dynamic segment pages (2 extra mv commands)
  - Edge case: skylar uses `pnpm --filter @apps/skylar...` (with `...` suffix) for build — preserves workspace dependency build
- **What would make this >=90%:**
  - Successful CI run deploying each app to staging
- **Rollout / rollback:**
  - Rollout: Push all three together with TASK-01 changes
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:**
  - Reference pattern: brikette.yml deploy-staging (lines 138-173) and deploy-production (lines 175-227)
  - skylar build: `OUTPUT_EXPORT=1 pnpm --filter @apps/skylar... build`
  - prime build: route-hide `src/app/g` + `src/app/api`, then `OUTPUT_EXPORT=1 pnpm exec next build`
  - product-pipeline build: route-hide `src/app/api` + dynamic pages, then `OUTPUT_EXPORT=1 pnpm exec next build --webpack`

### TASK-04: Convert Worker reusable-app callers to thin deploy-only (caryina, reception, business-os)
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/caryina.yml`, `.github/workflows/reception.yml`, `.github/workflows/business-os-deploy.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.github/workflows/caryina.yml`, `.github/workflows/reception.yml`, `.github/workflows/business-os-deploy.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 80% - caryina and business-os build/deploy commands documented from existing callers; reception has NO existing deploy (only validation via reusable-app) and needs new wrangler deploy logic. Held-back test: no single unknown would drop below 80 because reception's wrangler.toml defines the Worker config and `wrangler deploy` for plain Workers is well-understood.
  - Approach: 85% - same thin deploy pattern; Worker deploy is wrangler deploy
  - Impact: 85% - removes reusable-app dependency for 3 Worker apps
#### Re-plan Update (2026-03-12)
- Confidence: 80% -> 80% (Evidence: E1 static audit of `apps/reception/scripts/worker-deploy-safe.mjs`)
- Key change: Added the missing `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` requirement to the Reception deploy contract so the plan matches the fail-closed safe deploy script
- Dependencies: unchanged
- Validation contract: updated Reception env mapping expectations only
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
- **Acceptance:**
  - Each workflow is standalone (no `uses: ./.github/workflows/reusable-app.yml`)
  - Each keeps existing triggers during transition — deploy jobs gated with `if: github.ref == 'refs/heads/main'` so they skip on dev/PR; workflow_dispatch removed
  - Trigger narrowing to main-only deferred to TASK-06 (atomic with merge-gate update)
  - caryina.yml: builds with `turbo build --filter=@apps/caryina^...` + OpenNext build, deploys via `wrangler deploy`
  - business-os-deploy.yml: builds with `turbo build --filter=@apps/business-os^...` + OpenNext build, deploys via `wrangler deploy`, health check at business-os.peter-cowling1976.workers.dev
  - reception.yml: uses existing `apps/reception/scripts/worker-deploy-safe.mjs` which validates Firebase/Cloudflare env, builds (`pnpm run build:worker:raw`), and deploys via `wrangler deploy`. Required env vars: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` — all must be available as GitHub Actions secrets or env vars
  - Workflow filenames unchanged
  - actionlint passes on all three
  - Staging deploy NOT included here (deferred to TASK-07 through TASK-09)
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no user-facing state changes
  - Security / privacy: Required - workflow_dispatch removed
  - Logging / observability / audit: Required - deploy jobs log skip reason when path filter shows no changes
  - Testing / validation: Required - actionlint on modified workflows
  - Data / contracts: Required - caryina concurrency group preserved; reception needs deploy contract defined
  - Performance / reliability: N/A - deploy-only
  - Rollout / rollback: Required - git revert of workflow files
- **Validation contract (TC-XX):**
  - TC-01: caryina.yml on main push with caryina changes -> OpenNext build + wrangler deploy
  - TC-02: business-os-deploy.yml on main push with business-os changes -> OpenNext build + wrangler deploy + health check
  - TC-03: reception.yml on main push with reception changes -> build + wrangler deploy
  - TC-04: All three still fire on dev push/PR during transition (but deploy jobs skip via `if:` gate) — trigger narrowing deferred to TASK-06
  - TC-05: actionlint passes on all three
- **Execution plan:** Red -> Green -> Refactor
  1. Write caryina.yml as standalone thin deploy:
     - Triggers: KEEP existing (push to dev/main + pull_request) during transition; deploy job gated with `if: github.ref == 'refs/heads/main'`; remove workflow_dispatch
     - Job: checkout, setup-repo, path-filter, `turbo build --filter=@apps/caryina^...`, OpenNext build, wrangler deploy
     - Preserve concurrency group `caryina-deploy-${{ github.ref }}`
  2. Write business-os-deploy.yml as standalone thin deploy:
     - Triggers: KEEP existing during transition; deploy job gated with `if: github.ref == 'refs/heads/main'`; remove workflow_dispatch
     - Job: checkout, setup-repo, path-filter, `turbo build --filter=@apps/business-os^...`, OpenNext build, wrangler deploy, health check
     - Preserve concurrency group
  3. Write reception.yml as standalone thin deploy:
     - Triggers: KEEP existing during transition; deploy job gated with `if: github.ref == 'refs/heads/main'`; remove workflow_dispatch
     - Paths: `apps/reception/**`, `firebase.json`, `.github/workflows/reception.yml`
     - Job: checkout, setup-repo, path-filter, run `node apps/reception/scripts/worker-deploy-safe.mjs`
     - Env vars required (from GitHub secrets): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
     - Note: reception has an existing safe deploy script that handles build+deploy with env validation — use it instead of raw wrangler commands
  4. Run actionlint on all three
  - Note: trigger narrowing to main-only happens atomically in TASK-06
- **Planning validation (required for M/L):**
  - Checks run: Read caryina.yml (72 lines), reception.yml (35 lines), business-os-deploy.yml (55 lines) in full; verified caryina build = `turbo build --filter=@apps/caryina^... + opennextjs-cloudflare build`; business-os build = `turbo build --filter=@apps/business-os^... + opennextjs-cloudflare build`; reception currently has NO deploy (deploy_enabled: false in reusable-app call)
  - Validation artifacts: All three caller workflows + wrangler.toml files
  - Unexpected findings: reception.yml currently has NO deploy at all — adding main deploy is new functionality, not extraction
- **Consumer tracing:**
  - New outputs: reception.yml now produces a deploy (previously validation-only) — consumer: merge-gate scopeWorkflowMap watches reception.yml for scoped promotions only (not default PR path); after TASK-06, scopeWorkflowMap maps reception to ci.yml instead
  - Modified behavior: caryina/business-os no longer call reusable-app.yml; reception gains deploy capability
  - Consumer `merge-gate.yml` is unchanged because workflow filenames are stable
- **Scouts:**
  - reception deploy: verify `wrangler deploy` works with reception's wrangler.toml (has custom_domains and D1 binding — these should work with `wrangler deploy` as-is)
- **Edge Cases & Hardening:**
  - Edge case: caryina currently has conditional OpenNext build (skips if not main) — thin deploy only runs on main, so always build
  - Edge case: reception wrangler.toml has custom_domains and D1 binding — `wrangler deploy` handles these natively
  - Edge case: business-os has deploy_enabled gated on main OR staging — thin deploy triggers on main only initially
- **What would make this >=90%:**
  - Successful main deploy for all three apps
  - Verify reception wrangler deploy works end-to-end
- **Rollout / rollback:**
  - Rollout: Push all three together; verify CI
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:**
  - caryina build: `turbo build --filter=@apps/caryina^... && cd apps/caryina && opennextjs-cloudflare build`
  - business-os build: `turbo build --filter=@apps/business-os^... && cd apps/business-os && opennextjs-cloudflare build`
  - reception build+deploy: `node apps/reception/scripts/worker-deploy-safe.mjs` (validates env, builds via `pnpm run build:worker:raw`, deploys via `wrangler deploy`)
  - Reception required env list comes from `REQUIRED_FIREBASE_ENV` + `REQUIRED_DEPLOY_ENV` in `apps/reception/scripts/worker-deploy-safe.mjs`

### TASK-05: Horizon checkpoint — reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via /lp-do-replan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/unified-ci-per-app-deploy-lanes/plan.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream tasks (TASK-06, TASK-07)
  - Confidence for downstream tasks recalibrated from latest CI evidence
  - Plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - All per-app workflows are now deploy-only and pass actionlint
  - ci.yml turbo --affected covers all app workspaces (confirmed by successful CI run)
  - Merge-gate still passes for PR gating (workflow filenames unchanged)
  - CMS test duration under turbo --affected is acceptable
  - Reception main deploy works via worker-deploy-safe.mjs (validates env, builds, deploys)
- **Validation contract:** Checkpoint evidence from CI runs and actionlint results
- **Planning validation:** replan evidence from TASK-01 through TASK-04 completion
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated at `docs/plans/unified-ci-per-app-deploy-lanes/plan.md`

### TASK-06: Update merge-gate, narrow triggers, archive reusable-app.yml
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/merge-gate.yml`, `.github/workflows/auto-pr.yml`, `.github/workflows/reusable-app.yml`, `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, plus trigger narrowing in ALL per-app workflow files from TASK-01/02/03/04
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `.github/workflows/merge-gate.yml`, `.github/workflows/auto-pr.yml`, `.github/workflows/reusable-app.yml`, `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, `.github/workflows/brikette.yml`, `.github/workflows/cms.yml`, `.github/workflows/xa.yml`, `.github/workflows/skylar.yml`, `.github/workflows/prime.yml`, `.github/workflows/product-pipeline.yml`, `.github/workflows/caryina.yml`, `.github/workflows/reception.yml`, `.github/workflows/business-os-deploy.yml`
- **Depends on:** TASK-05
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 82%
  - Implementation: 80% - merge-gate has THREE coupling paths that all need updating: (1) scopeWorkflowMap at lines 189-207, (2) isBriketteMainPromotion at lines 223-227, (3) default path at lines 229-260. All read and understood. filter-config.ts MERGE_GATE_FILTER has per-app entries that must be cleaned. path-classifier.cjs must mirror changes. Trigger narrowing across 9 workflow files is mechanical but must be atomic with merge-gate updates.
  - Approach: 85% - replace per-app workflow requirements with ci.yml universally; ci.yml fires on all pushes (no paths-ignore after TASK-01)
  - Impact: 85% - completes the two-layer model; archives 845-line reusable-app.yml; removes merge-gate coupling to per-app deploy workflows
#### Re-plan Update (2026-03-12)
- Confidence: 82% -> 82% (Evidence: E1 static audit of `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, and `.github/workflows/ci-lighthouse.yml`)
- Key change: Scoped the parity requirement to `MERGE_GATE_FILTER`; broader `LIGHTHOUSE_FILTER` drift already exists and is tracked as adjacent repo debt, not a blocker for this release-lane task
- Dependencies: unchanged
- Validation contract: narrowed from whole-file parity to merge-gate filter parity plus no-regression check on the touched runtime mirror file
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
#### Re-plan Update (2026-03-12)
- Confidence: 82% -> 82% (Evidence: E1 static audit of `.github/workflows/caryina.yml` and `.github/workflows/merge-gate.yml`)
- Key change: Added the missing Caryina scoped-promotion coverage to `scopeWorkflowMap`; the workflow already recognizes `promote-app:caryina`, so merge-gate must too
- Dependencies: unchanged
- Validation contract: expanded to include a Caryina scoped-promotion case
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
- **Acceptance:**
  - **merge-gate scopeWorkflowMap** (lines 189-207) updated:
    - `brikette` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `caryina` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `cms` → `[{ id: "ci.yml", name: "Core Platform CI" }, { id: "cypress.yml", name: "CMS E2E & Component Tests" }]` (cypress.yml PRESERVED for CMS E2E)
    - `prime` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `product-pipeline` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `reception` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `skylar` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `xa` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `business-os` → `[{ id: "ci.yml", name: "Core Platform CI" }]`
    - `core` → unchanged (ci.yml + storybook + consent-analytics)
    - `shop` → unchanged (ci.yml)
  - **isBriketteMainPromotion** path (lines 223-227): changed from `brikette.yml` to `ci.yml`
  - **Default path** (lines 229-260) simplified:
    - Always require ci.yml (unconditional — ci.yml fires on ALL pushes/PRs after TASK-01)
    - Remove per-app deploy workflow requirements: `need.brikette`, `need.cms_deploy`, `need.skylar`, `need.prime`, `need.product_pipeline` lines deleted
    - Keep non-app workflows: `cypress.yml` (need.cms_e2e), `storybook.yml` (need.storybook), `consent-analytics.yml` (need.consent_analytics), `ci-lighthouse.yml` (lhci logic)
  - **MERGE_GATE_FILTER** in `scripts/src/ci/filter-config.ts`:
    - Remove per-app entries no longer needed: `brikette`, `skylar`, `prime`, `product_pipeline`, `cms_deploy`
    - Keep: `github_config`, `core` (simplified: `**/*` with no exclusions since ci.yml covers everything), `cms_e2e`, `storybook`, `consent_analytics`, `lhci`
  - **path-classifier.cjs**: updated to mirror `scripts/src/ci/filter-config.ts` `MERGE_GATE_FILTER` changes; do not widen unrelated filter drift while editing the runtime mirror
  - **Per-app workflow trigger narrowing** (atomic with merge-gate update):
    - brikette.yml: narrow triggers from dev/staging/main + pull_request to staging/main push only
    - cms.yml: narrow triggers from dev/staging/main + pull_request to staging/main push only
    - xa.yml: narrow triggers from dev/staging/main to staging/main push only
    - skylar.yml: narrow triggers from dev/staging/main + pull_request to staging/main push only
    - prime.yml: narrow triggers from dev/staging/main + pull_request to staging/main push only
    - product-pipeline.yml: narrow triggers from dev/staging/main + pull_request to staging/main push only
    - caryina.yml: narrow triggers from dev/main + pull_request to main push only
    - reception.yml: narrow triggers from dev/main + pull_request to main push only
    - business-os-deploy.yml: narrow triggers from dev/main + pull_request to main push only
  - **auto-pr.yml**: brikette.yml dispatch REMOVED (lines 155-160) — no longer needed since merge-gate requires ci.yml for brikette scope, not brikette.yml. Keep promote-app:brikette label (still used by ci.yml promote-app guards). Keep merge-gate.yml dispatch (lines 162-171).
  - **reusable-app.yml**: DELETED (no callers remain after TASK-02/03/04)
  - Per-app workflow `paths:` lists cleaned: remove `".github/workflows/reusable-app.yml"` entries
  - merge-gate still passes for all app scopes
  - actionlint passes on all modified workflows
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no user-facing state changes
  - Security / privacy: Required - auto-pr.yml dispatch path reviewed; workflow_dispatch removal verified
  - Logging / observability / audit: N/A - merge-gate logging unchanged
  - Testing / validation: Required - verify merge-gate all three paths (scopeWorkflowMap, isBriketteMainPromotion, default); actionlint
  - Data / contracts: Required - scopeWorkflowMap is critical coupling; filter-config.ts + path-classifier.cjs must stay in sync; per-app triggers must narrow atomically
  - Performance / reliability: N/A - merge-gate is lightweight; per-app workflows no longer fire unnecessary empty runs on dev/PR
  - Rollout / rollback: Required - ALL changes in ONE commit; git revert if merge-gate breaks
- **Validation contract (TC-XX):**
  - TC-01: PR with brikette-only changes → merge-gate default path always requires ci.yml → satisfied
  - TC-02: PR with CMS-only changes → merge-gate default path requires ci.yml + cypress.yml (need.cms_e2e) → satisfied
  - TC-03: Scoped promotion PR (promote-app:brikette) → scopeWorkflowMap maps brikette → ci.yml → merge-gate waits for ci.yml
  - TC-04: Scoped promotion PR (promote-app:caryina) → scopeWorkflowMap maps caryina → ci.yml → merge-gate waits for ci.yml
  - TC-05: Scoped promotion PR (promote-app:cms) → scopeWorkflowMap maps cms → ci.yml + cypress.yml → both required
  - TC-06: isBriketteMainPromotion fallback → requires ci.yml (not brikette.yml)
  - TC-07: auto-pr.yml no longer dispatches brikette.yml → merge-gate requires ci.yml (fires on all pushes)
  - TC-08: Per-app deploy workflows do NOT fire on dev push or pull_request after trigger narrowing
  - TC-09: No workflow references reusable-app.yml
  - TC-10: Promotion PRs (dev→main with promote-app:*) → ci.yml fires but lint/typecheck/test skipped via promote-app guards → merge-gate still sees ci.yml as completed
  - TC-11: actionlint passes on ALL modified workflows
  - TC-12: `MERGE_GATE_FILTER` entries removed from `scripts/src/ci/filter-config.ts` and `scripts/ci/path-classifier.cjs` match exactly
- **Execution plan:** Red -> Green -> Refactor
  1. Update merge-gate.yml scopeWorkflowMap: map all per-app scopes to ci.yml, including caryina; preserve cypress.yml for CMS scope; keep core/shop unchanged
  2. Update merge-gate.yml isBriketteMainPromotion path (line 227): change `brikette.yml` to `ci.yml`
  3. Update merge-gate.yml default path (lines 229-260): add unconditional ci.yml requirement; remove `need.brikette`, `need.cms_deploy`, `need.skylar`, `need.prime`, `need.product_pipeline` lines; keep cypress.yml/storybook.yml/consent-analytics.yml/ci-lighthouse.yml conditionals
  4. Update filter-config.ts MERGE_GATE_FILTER: remove `brikette`, `skylar`, `prime`, `product_pipeline`, `cms_deploy` entries; simplify `core` to `**/*` with no exclusions
  5. Update path-classifier.cjs MERGE_GATE_FILTER to mirror step 4
  6. Narrow per-app workflow triggers (ALL in same commit):
     - brikette.yml, cms.yml, skylar.yml, prime.yml, product-pipeline.yml: `push: branches: [staging, main]` only (remove dev, pull_request)
     - xa.yml: `push: branches: [staging, main]` only (remove dev)
     - caryina.yml, reception.yml, business-os-deploy.yml: `push: branches: [main]` only (remove dev, pull_request)
  7. Remove auto-pr.yml brikette.yml dispatch (lines 155-160); keep promote-app:brikette label and merge-gate dispatch
  8. Remove `".github/workflows/reusable-app.yml"` from per-app workflow `paths:` lists
  9. Delete `.github/workflows/reusable-app.yml`
  10. Run actionlint on ALL modified workflows; verify merge-gate in a test PR
- **Planning validation (required for M/L):**
  - Checks run: Read merge-gate.yml in full — identified THREE coupling paths: scopeWorkflowMap (lines 189-207), isBriketteMainPromotion (lines 223-227), default path (lines 229-260). Read filter-config.ts MERGE_GATE_FILTER (lines 71-244) — identified per-app entries to remove. Read auto-pr.yml dispatch (lines 155-171). Verified path-classifier.cjs is the CJS mirror of filter-config.ts. Verified `caryina.yml` already recognizes `promote-app:caryina`.
  - Validation artifacts: merge-gate.yml, auto-pr.yml, filter-config.ts, path-classifier.cjs, `caryina.yml`, all per-app workflows
  - Unexpected findings: (1) merge-gate has THREE separate paths, not just scopeWorkflowMap — the default path at lines 229+ and isBriketteMainPromotion at lines 223-227 must also be updated. (2) CMS scope maps to BOTH cms.yml AND cypress.yml — cypress.yml must be preserved. (3) MERGE_GATE_FILTER `core` entry excludes cms/skylar — must simplify since ci.yml now covers everything. (4) `caryina.yml` already gates on `promote-app:caryina`, but merge-gate scopeWorkflowMap did not include caryina.
- **Consumer tracing:**
  - Modified behavior: merge-gate all three paths now use ci.yml for app scopes → consumer: PR merge gating. ci.yml fires on all dev pushes/PRs (no paths-ignore after TASK-01) so merge-gate will always see it.
  - Modified behavior: per-app workflows narrowed to staging/main only → consumer: merge-gate default path no longer requires them (requires ci.yml instead). No broken intermediate state because both changes happen in same commit.
  - Modified behavior: auto-pr.yml no longer dispatches brikette.yml → consumer: merge-gate. Satisfied because merge-gate now requires ci.yml for brikette scope.
  - Modified behavior: MERGE_GATE_FILTER per-app entries removed → consumer: merge-gate dorny/paths-filter. Fewer outputs emitted, but default path no longer reads those outputs.
  - Modified behavior: reusable-app.yml removed → consumers: all former callers (already converted in TASK-02/03/04)
  - Consumer path-classifier.cjs updated in sync with filter-config.ts
- **Scouts:**
  - Verify that skipped GitHub Actions jobs (via `if: false` or branch gate) still count as "completed" for merge-gate status check purposes — if not, trigger narrowing would break merge-gate (workflows don't fire at all vs workflows fire with skipped jobs). GitHub Actions: a workflow that doesn't trigger at all produces no check run. merge-gate uses `actions/github-script` to poll for workflow runs by SHA — if workflow never fires, no run exists, and merge-gate would wait forever. This is WHY trigger narrowing and merge-gate update must be atomic.
- **Edge Cases & Hardening:**
  - Edge case: merge-gate polls for workflow runs by SHA — after trigger narrowing, per-app workflows don't fire on dev/PR, so no runs exist. merge-gate must NOT require them. Atomic commit ensures this.
  - Edge case: ci.yml promote-app guards cause validation jobs to skip on promotion PRs — merge-gate must still see ci.yml as "completed" (skipped jobs don't block workflow completion — the workflow run itself completes)
  - Edge case: reusable-app.yml deletion — grep for `reusable-app.yml` across all workflows before deleting
  - Edge case: CMS scope MUST preserve cypress.yml requirement in scopeWorkflowMap — CMS E2E tests are separate from ci.yml validation
  - Edge case: Caryina scoped promotions already exist at the workflow layer, so merge-gate must not treat `promote-app:caryina` as an unknown label
  - Edge case: filter-config.ts and path-classifier.cjs MUST be updated in same commit (they're the TS and CJS mirrors of the same config)
  - Edge case: `isBriketteMainPromotion` path (line 223-227) is a separate code path from scopeWorkflowMap — must also be updated to ci.yml
- **What would make this >=90%:**
  - Successful PR merge-gate pass after ALL changes pushed in one commit
- **Rollout / rollback:**
  - Rollout: ALL changes in ONE commit — merge-gate update + trigger narrowing + auto-pr cleanup + reusable-app deletion. Push once, verify merge-gate in a test PR.
  - Rollback: git revert (restores reusable-app.yml, per-app triggers, merge-gate config, dispatch)
- **Documentation impact:** None
- **Notes / references:**
  - merge-gate THREE paths: scopeWorkflowMap (lines 189-207), isBriketteMainPromotion (lines 223-227), default (lines 229-260)
  - auto-pr.yml dispatch: lines 155-160 (brikette), lines 162-171 (merge-gate — keep)
  - MERGE_GATE_FILTER: filter-config.ts lines 71-244 + path-classifier.cjs mirror
  - Workflows referencing reusable-app.yml in paths or uses clauses: prime.yml, skylar.yml, product-pipeline.yml, reception.yml, caryina.yml, business-os-deploy.yml
  - CMS scope requires cypress.yml (E2E tests) in addition to ci.yml
- Existing unrelated classifier drift: `.github/workflows/ci-lighthouse.yml` still uses a separate Brikette filter path; do not treat that adjacent debt as completion criteria for TASK-06

### TASK-07: Define Worker staging prerequisite contract
- **Type:** INVESTIGATE
- **Deliverable:** decision-grade prerequisite artifact at `docs/plans/unified-ci-per-app-deploy-lanes/artifacts/worker-staging-prereqs.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/unified-ci-per-app-deploy-lanes/artifacts/worker-staging-prereqs.md`, `[readonly] apps/caryina/wrangler.toml`, `[readonly] apps/reception/wrangler.toml`, `[readonly] apps/business-os/wrangler.toml`, `[readonly] apps/reception/scripts/worker-deploy-safe.mjs`, `[readonly] docs/secrets.md`, `[readonly] .github/workflows/caryina.yml`, `[readonly] .github/workflows/reception.yml`, `[readonly] .github/workflows/business-os-deploy.yml`
- **Depends on:** TASK-05
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 85%
  - Implementation: 90% - the repo already exposes the missing contract surface: three production-only wrangler files, the Reception fail-closed deploy wrapper, and the current workflow trigger topology
  - Approach: 85% - convert hidden infra assumptions into a concrete staging resource matrix before touching deploy code
  - Impact: 85% - removes the main source of uncertainty for Worker staging without pretending the external resources already exist
#### Re-plan Update (2026-03-12)
- Confidence: 70% -> 85% (Evidence: E1 static audit of Worker wrangler files, `apps/reception/scripts/worker-deploy-safe.mjs`, `docs/secrets.md`, and repo-wide preview-env search results)
- Key change: Replaced the single vague Worker staging implementation task with an explicit prerequisite-contract investigation
- Dependencies: TASK-05 -> TASK-07 -> TASK-08/TASK-09; TASK-08/TASK-09 also depend on TASK-06
- Validation contract: replaced "deploy succeeds" with a concrete staging resource inventory, environment model choice, and operator provisioning contract
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
#### Re-plan Update (2026-03-12)
- Confidence: 85% -> 85% (Evidence: E1 sequence overlap audit)
- Key change: Marked all source files as `[readonly]` and made the artifact path the only write target so sequencing can parallelize TASK-07 with TASK-06 honestly
- Dependencies: unchanged
- Validation contract: unchanged
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
- **Acceptance:**
  - The artifact records, per app, the chosen Wrangler environment key (`preview` vs `staging`), Worker name, staging URL shape, build-time env source, runtime secret source, and any data bindings that require isolated staging resources
  - The artifact states whether each prerequisite already exists or must be provisioned outside the repo before code changes can land
  - Caryina contract identifies the runtime secret set needed for a staging Worker (minimum: `CARYINA_ADMIN_KEY`, plus any app-specific analytics/runtime secrets used in production)
  - Business OS contract identifies a separate staging D1 database and `SESSION_SECRET` source
  - Reception contract explicitly addresses: separate staging D1 database, staging-safe handling of `[[custom_domains]]`, cron posture for staging, build-time Firebase env source, and whether `worker-deploy-safe.mjs` is extended with an environment flag or wrapped by a staging-specific entrypoint
  - The artifact includes exact operator-facing provisioning commands for any external resources that do not already exist (for example `wrangler d1 create ...`, `wrangler secret put ... --env <name>`)
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: Required - staging URLs must be predictable for agent/browser tooling
  - Security / privacy: Required - staging Workers must not reuse production D1 databases or production-only custom domains
  - Logging / observability / audit: Required - the contract must state staging health-check targets and cron posture
  - Testing / validation: Required - every later Worker staging task inherits this contract; ambiguity here invalidates downstream validation
  - Data / contracts: Required - this task defines the resource IDs, env names, and secret sources downstream code changes depend on
  - Performance / reliability: N/A - no runtime code changes yet
  - Rollout / rollback: N/A - investigation only
- **Validation contract (TC-XX):**
  - TC-01: Repo audit confirms all three Worker apps currently lack `[env.preview]` / `[env.staging]` sections
  - TC-02: Repo audit confirms Reception staging cannot reuse the current safe deploy script unchanged because it hardcodes plain `wrangler deploy`
  - TC-03: Repo audit confirms only `apps/cms/.env.preview.sops` currently exists, so Worker staging build-time env sources must be defined explicitly
  - TC-04: Per-app prerequisite matrix includes resource existence status and provisioning commands
- **Execution plan:** Red -> Green -> Refactor
  1. Audit current Worker deploy topology for Caryina, Reception, and Business OS: wrangler files, workflow triggers, deploy commands, and env sources
  2. Decide one staging environment naming contract per app (`preview` or `staging`) and record the exact Worker name / URL consequences
  3. Inventory external resources required for staging isolation: D1 databases, secrets, custom domains, and any encrypted build-time env artifacts
  4. Record operator provisioning commands and completion checks for missing resources
  5. Hand off the resolved contract to TASK-08 and TASK-09
- **Planning validation (required for M/L):**
  - Checks run: Read `apps/caryina/wrangler.toml`, `apps/reception/wrangler.toml`, `apps/business-os/wrangler.toml`, `apps/reception/scripts/worker-deploy-safe.mjs`, `apps/reception/.env.example`, and `docs/secrets.md`; searched repo for existing preview/staging Worker env sections and encrypted preview env artifacts
  - Validation artifacts: All three Worker wrangler files, Reception safe deploy wrapper, repo-wide preview env search results
  - Unexpected findings: (1) Reception safe deploy wrapper does not accept an environment flag; it always runs plain `wrangler deploy`. (2) Reception requires `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` at build time in addition to the previously documented Firebase keys. (3) Only CMS currently has a tracked preview env artifact (`apps/cms/.env.preview.sops`)
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Edge case: Reception staging must not inherit production `[[custom_domains]]`
  - Edge case: Reception cron triggers may need to be disabled or made intentionally distinct in staging
  - Edge case: Business OS staging must not point at the production D1 database
  - Edge case: Caryina has no data binding today, but staging still needs a deliberate runtime secret source
- **What would make this >=90%:**
  - Operator confirmation that the documented staging resources already exist, or attached evidence proving they were provisioned
- **Rollout / rollback:** `None: investigation artifact only`
- **Documentation impact:** Creates the prerequisite artifact consumed by TASK-08 and TASK-09
- **Notes / references:**
  - `apps/reception/scripts/worker-deploy-safe.mjs` currently accepts `--dry-run`, `--skip-deploy`, `--app-env-file`, and `--root-env-file`, but no environment selector
  - `apps/reception/wrangler.toml` currently contains production `[[custom_domains]]`, production D1 binding, and cron triggers only
  - `docs/secrets.md` documents preview/staging env files generically, but repo search shows only CMS currently has one committed

### TASK-08: Add staging deploy for Caryina and Business OS
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/caryina/wrangler.toml`, `apps/business-os/wrangler.toml`, `.github/workflows/caryina.yml`, `.github/workflows/business-os-deploy.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/wrangler.toml`, `apps/business-os/wrangler.toml`, `.github/workflows/caryina.yml`, `.github/workflows/business-os-deploy.yml`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - once TASK-07 defines the exact staging env names, D1 IDs, and secret sources, the remaining code changes are standard wrangler-env and workflow updates
  - Approach: 85% - both apps use straightforward `wrangler deploy` entrypoints; no special safe deploy wrapper or custom domain logic is currently in the way
  - Impact: 85% - delivers two of the three missing Worker staging lanes without taking on Reception's extra complexity at the same time
- **Acceptance:**
  - Caryina and Business OS each gain an explicit staging Wrangler environment section using the naming and resource contract defined in TASK-07
  - Caryina workflow deploys on `staging` push via `wrangler deploy --env <chosen-env>` and production deploy remains unchanged on `main`
  - Business OS workflow deploys on `staging` push via `wrangler deploy --env <chosen-env>` and uses a staging-only D1 database plus staging `SESSION_SECRET`
  - Staging URLs are recorded and used for health checks where applicable
  - Production deploy behavior remains unchanged
  - actionlint passes on both workflows
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: Required - staging URLs must be reachable and distinct from production
  - Security / privacy: Required - staging D1 / secrets are isolated from production
  - Logging / observability / audit: Required - staging deploy and health-check output is explicit in workflow logs
  - Testing / validation: Required - actionlint + staging deploy verification
  - Data / contracts: Required - `wrangler.toml` env sections and workflow `--env` flags must match TASK-07 exactly
  - Performance / reliability: N/A - deploy-lane change only
  - Rollout / rollback: Required - revert wrangler/workflow deltas if staging deploy misbehaves
- **Validation contract (TC-XX):**
  - TC-01: Caryina staging push -> workflow runs `wrangler deploy --env <chosen-env>` and publishes to the staging Worker URL
  - TC-02: Business OS staging push -> workflow runs `wrangler deploy --env <chosen-env>` and publishes using the staging D1 binding
  - TC-03: Main push behavior for both apps remains unchanged
  - TC-04: actionlint passes on both workflows
- **Execution plan:** Red -> Green -> Refactor
  1. Add staging env sections to `apps/caryina/wrangler.toml` and `apps/business-os/wrangler.toml` using the contract from TASK-07
  2. Extend the two workflows to trigger on `staging` and pass the correct `--env` flag for staging deploys
  3. Add or update staging health checks / environment URLs
  4. Run actionlint and verify staging deploy behavior
- **Planning validation (required for M/L):**
  - Checks run: Verified both apps already deploy via plain `wrangler deploy` in workflow callers and do not rely on a custom safe deploy wrapper
  - Validation artifacts: `.github/workflows/caryina.yml`, `.github/workflows/business-os-deploy.yml`, both wrangler files
  - Unexpected findings: Business OS already declares a production D1 binding, so staging cannot be implemented honestly without a separate staging D1 resource from TASK-07
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Edge case: Caryina staging needs an explicit runtime secret source even though it has no D1 binding today
  - Edge case: Business OS staging must not point at the production `BUSINESS_OS_DB`
- **What would make this >=90%:**
  - TASK-07 completed with real staging resource IDs and a verified secret source for both apps
- **Rollout / rollback:**
  - Rollout: update wrangler topology and workflow triggers together, then verify staging before main
  - Rollback: revert the two wrangler files and workflows
- **Documentation impact:** Update the prerequisite artifact with actual staging URLs once deployed
- **Notes / references:**
  - `apps/caryina/wrangler.toml` currently has no env sections
  - `apps/business-os/wrangler.toml` currently has only the production D1 binding

### TASK-09: Add staging deploy for Reception
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/reception/wrangler.toml`, `apps/reception/scripts/worker-deploy-safe.mjs`, `.github/workflows/reception.yml`, and any staging env artifacts or operator docs required by TASK-07
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/wrangler.toml`, `apps/reception/scripts/worker-deploy-safe.mjs`, `apps/reception/.env.example`, `.github/workflows/reception.yml`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 70% - Reception still has multiple unresolved staging specifics even after splitting: its safe deploy wrapper has no environment selector, the Worker uses production `[[custom_domains]]`, the D1 binding is production-only, and build-time Firebase env sourcing for staging is not yet defined in-repo
  - Approach: 80% - a staging Wrangler environment plus a staging-safe deploy wrapper is the right shape, but the exact contract depends on TASK-07
  - Impact: 80% - adds the final missing Worker staging lane, but only if the staging resource and secret contract is correct
#### Re-plan Update (2026-03-12)
- Confidence: 70% -> 70% (Evidence: E1 static audit of `apps/reception/wrangler.toml`, `apps/reception/scripts/worker-deploy-safe.mjs`, and `apps/reception/.env.example`)
- Key change: narrowed scope from "all Worker apps" to the Reception-specific staging implementation that remains below threshold after extracting the prerequisite work
- Dependencies: now depends on TASK-06 and TASK-07
- Validation contract: expanded to include deploy-wrapper environment targeting, staging-safe custom domain handling, and explicit build-time env sourcing
- Notes: see `docs/plans/unified-ci-per-app-deploy-lanes/replan-notes.md`
- **Acceptance:**
  - `apps/reception/wrangler.toml` gains a staging environment section that does not reuse production `[[custom_domains]]` or the production D1 database
  - `apps/reception/scripts/worker-deploy-safe.mjs` is extended (or wrapped) so staging deploys can target a non-production Wrangler environment explicitly
  - `.github/workflows/reception.yml` triggers on `staging` push and passes the full staging-safe env contract, including `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
  - The staging plan states whether cron triggers are enabled, disabled, or pointed at staging-safe downstream systems
  - Staging Worker is reachable at the recorded staging URL
  - Production deploy is unaffected
  - actionlint passes
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: Required - staging URLs must be reachable for agent tooling (MCP, Playwright)
  - Security / privacy: Required - staging Workers must not share production D1 databases
  - Logging / observability / audit: Required - staging deploy health checks
  - Testing / validation: Required - verify staging deploy end-to-end; actionlint
  - Data / contracts: Required - wrangler.toml env config defines staging Worker names, D1 bindings, routes
  - Performance / reliability: N/A - staging is for preview only
  - Rollout / rollback: Required - wrangler config changes are reversible; staging Workers can be deleted if needed
- **Validation contract (TC-XX):**
  - TC-01: Reception staging push -> workflow invokes a staging-targeted safe deploy path (not plain production `wrangler deploy`)
  - TC-02: Staging Worker deploy uses isolated D1 / secrets and does not register production-only custom domains
  - TC-03: Staging URL is reachable
  - TC-04: Production deploy unchanged
  - TC-05: actionlint passes
- **Execution plan:** Red -> Green -> Refactor
  1. Extend `worker-deploy-safe.mjs` with an explicit environment selector (or add a staging wrapper) so it can deploy to a non-production Wrangler environment safely
  2. Add the Reception staging env section to `wrangler.toml` using the resource contract from TASK-07
  3. Update `.github/workflows/reception.yml` to trigger on `staging`, pass the required build-time env, and invoke the staging-safe deploy path
  4. Run actionlint; push to staging and verify
- **Planning validation (required for M/L):**
  - Checks run: Read `apps/reception/wrangler.toml`, `apps/reception/scripts/worker-deploy-safe.mjs`, `apps/reception/.env.example`, and `.github/workflows/reception.yml`
  - Validation artifacts: Reception wrangler file, safe deploy wrapper, env example, workflow
  - Unexpected findings: the safe deploy wrapper currently has no `--env` support, so staging cannot be added by workflow trigger changes alone
- **Scouts:**
  - Verify whether the staging D1 database already exists or must be created as part of TASK-07
  - Verify whether staging should disable cron triggers until inbox-side dependencies exist
- **Edge Cases & Hardening:**
  - Edge case: Reception `[[custom_domains]]` in `wrangler.toml` must not leak into staging
  - Edge case: staging D1 database may not exist yet — may need `wrangler d1 create` before staging deploy works
  - Edge case: build-time Firebase env for staging may require a new preview/staging env artifact or a secrets-based workflow mapping
  - Edge case: cron triggers may need a staging-specific disable flag or reduced schedule
- **What would make this >=90%:**
  - TASK-07 completed with real staging D1 ID, staging secret source, and a resolved safe deploy wrapper design
  - Staging URL verified reachable
- **Rollout:**
  - Update deploy wrapper and `wrangler.toml` first, then workflow trigger changes; verify staging deploy before relying on the lane
  - Rollback: remove the staging env section / wrapper changes and revert the workflow delta
- **Documentation impact:** Update the prerequisite artifact and any Reception deploy docs with the final staging-safe procedure
- **Notes / references:**
  - `apps/reception/scripts/worker-deploy-safe.mjs` currently ends with `pnpm exec wrangler deploy`
  - `apps/reception/wrangler.toml` currently has production `[[custom_domains]]`, D1 binding (`RECEPTION_INBOX_DB`), and cron triggers only
  - `apps/reception/.env.example` is the current source of build-time Firebase key names

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CMS test duration increases without 4-shard parallelism | Medium | Medium | Monitor after TASK-02; re-add sharding as ci.yml conditional job if >30min |
| merge-gate has THREE coupling paths (scopeWorkflowMap, isBriketteMainPromotion, default) — all must be updated atomically with trigger narrowing | Medium | High | TASK-06 pushes ALL changes in ONE commit: merge-gate update + trigger narrowing + auto-pr cleanup + reusable-app deletion |
| Worker app staging deploy blocked by missing staging resources or secret sources | Medium | High | TASK-07 converts hidden assumptions into an explicit resource/secret contract before TASK-08 or TASK-09 touch code |
| Governance jobs add ~5-10 min to pure app-only pushes | Low | Low | Accepted trade-off; re-add targeted paths-ignore only if costs become material |
| Reception staging deploy fails because the current safe wrapper only targets production | Medium | High | TASK-07 must choose the staging-safe wrapper design; TASK-09 cannot proceed without it |
| filter-config.ts and path-classifier.cjs drift out of sync | Low | High | Both updated in same commit in TASK-06; TASK-01 adds prime/reception to both |
| Per-app workflows fire empty runs on dev/PR during transition (TASK-01-04) | Low | Low | Deploy jobs skip via `if:` gate; minor CI minute waste until TASK-06 narrows triggers |

## Observability
- Logging: Each deploy workflow logs whether it skipped deployment due to no path changes
- Metrics: CI duration comparison before/after (governance job overhead)
- Alerts/Dashboards: Existing post-deploy health checks preserved in all deploy workflows

## Acceptance Criteria (overall)
- [ ] ci.yml is the sole validation workflow — no per-app lint/typecheck/test
- [ ] All per-app workflows are deploy-only on staging/main
- [ ] workflow_dispatch removed from all app workflows
- [ ] reusable-app.yml archived/removed
- [ ] merge-gate scopeWorkflowMap references correct workflow IDs
- [ ] actionlint passes on all modified workflows
- [ ] All apps deploy successfully to their current targets; Worker staging lanes land after TASK-07 resolves the missing resource contract
- [ ] "Nothing changed, nothing to do" works at both validation (turbo --affected) and deploy (path-gated) layers

## Decision Log
- 2026-03-12: Analysis chose Option A (remove ci.yml paths-ignore entirely) over Option B (keep paths-ignore) and Option C (reusable deploy workflow). Rationale: simplest config, no governance gap, one mental model.
- 2026-03-12: Second replan split Worker staging into a prerequisite investigation plus two implementation tasks. Sequencing now prefers TASK-07 before TASK-06 at the shared dependency boundary because it is an INVESTIGATE task with only one write target artifact.
- 2026-03-12: [Execution decision self-resolved] auto-pr.yml brikette dispatch: remove it AND update merge-gate to require ci.yml for brikette scope (not brikette.yml). brikette.yml is now deploy-only on staging/main and doesn't fire on dev, so merge-gate cannot require it. ci.yml fires on all pushes/PRs and is the correct gating workflow. Promote-app:brikette label kept for ci.yml job guards.
- 2026-03-12: [Execution decision self-resolved] ci.yml promote-app:* guards: these are intentional. Promotion PRs skip validation because it already ran on dev push. Not a gap — consistent with the two-layer model.
- 2026-03-12: [Execution decision self-resolved] XA apps (3 in 1 workflow): keep xa.yml as one deploy workflow for 3 apps (just strip validation). Splitting into 3 files adds complexity without benefit.
- 2026-03-12: [Critique R2 fix] Per-app workflow triggers must be kept on dev/PR during TASK-01-04 transition (deploy jobs skip via `if:` gate). Narrowing happens atomically in TASK-06 alongside merge-gate update. This prevents broken intermediate state where merge-gate requires workflows that don't fire.
- 2026-03-12: [Critique R2 fix] merge-gate has THREE coupling paths: scopeWorkflowMap (scoped promotions), isBriketteMainPromotion (brikette fallback), and default path (need.* flags). All three must be updated in TASK-06.
- 2026-03-12: [Critique R2 fix] CMS scope in merge-gate scopeWorkflowMap maps to BOTH cms.yml AND cypress.yml. After TASK-06, cms scope maps to ci.yml + cypress.yml (cypress.yml preserved for CMS E2E tests).
- 2026-03-12: [Critique R2 fix] reception.yml deploy requires explicit env vars (Firebase + Cloudflare) — worker-deploy-safe.mjs fails closed without them. Env mapping documented in TASK-04.
- 2026-03-12: [Critique R2 fix] path-classifier.cjs is CJS mirror of filter-config.ts — both must be updated in sync (TASK-01 for prime/reception additions, TASK-06 for per-app entry removal).
- 2026-03-12: [Replan R1] Worker staging was over-compressed into one 70% IMPLEMENT task. Replan split it into TASK-07 prerequisite-contract investigation, TASK-08 for Caryina/Business OS staging, and TASK-09 for the still-blocked Reception staging path.
- 2026-03-12: [Replan R1] Reception staging cannot reuse the current safe deploy wrapper unchanged because `apps/reception/scripts/worker-deploy-safe.mjs` hardcodes plain `wrangler deploy` and requires `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` in addition to the previously documented Firebase keys.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: ci.yml universal validation | Yes | None — ci.yml paths-ignore removal verified; brikette validate job removal verified; app-specific gates (prime lint, reception firebase rules) moved to ci.yml; CI_FILTER + path-classifier.cjs both updated with prime/reception entries; brikette.yml keeps dev/PR triggers during transition (deploy jobs skip); promote-app guards acknowledged as intentional | No |
| TASK-02: Strip standalone workflows | Yes — TASK-01 complete means ci.yml covers all validation | None — cms.yml, xa.yml, pwrb-brochure.yml all read in full; validation vs deploy sections clearly separated; triggers kept on dev/PR during transition with deploy `if:` gates; xa-b health check URL gets staging case | No |
| TASK-03: Pages callers to thin deploy | Yes — TASK-01 complete; build-cmd, deploy_cmd, artifact-path documented from each caller | None — all build/deploy commands are verbatim from existing callers; triggers kept on dev/PR during transition with deploy `if:` gates | No |
| TASK-04: Worker callers to thin deploy | Yes — reception has existing safe deploy script (worker-deploy-safe.mjs) | None after replan fix — the plan now includes the full Reception env contract (`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` was the missing key) | No |
| TASK-05: Checkpoint | Yes — TASK-02/03/04 preconditions met | None | No |
| TASK-06: Merge-gate + trigger narrowing + archive | Yes — TASK-05 provides CI evidence; all per-app workflows still fire on dev/PR (safe for merge-gate) | None after replan scoping — merge-gate THREE paths still update atomically, but acceptance now scopes parity to `MERGE_GATE_FILTER` instead of claiming whole-file classifier parity | No |
| TASK-07: Define Worker staging prerequisite contract | Yes — checkpoint evidence exists and no code writes are required | None — this task now formalizes the previously missing staging resource and secret prerequisites instead of hiding them inside a low-confidence IMPLEMENT step | No |
| TASK-08: Caryina and Business OS staging deploy | Partial — depends on TASK-06 trigger narrowing and TASK-07 resource contract | None once prerequisites are complete — no unresolved blocker remains outside the formal dependency chain | No |
| TASK-09: Reception staging deploy | Partial — depends on TASK-06 and TASK-07 | [Moderate]: current Reception safe deploy wrapper has no environment selector and production-only `wrangler.toml` resources; task remains below threshold until TASK-07 resolves the staging contract | Yes — build TASK-07 first, then re-run `/lp-do-replan` if the resulting contract changes the Reception implementation shape materially |

## Overall-confidence Calculation
- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × M(2) = 170
- TASK-04: 80% × M(2) = 160
- TASK-05: 95% × S(1) = 95
- TASK-06: 82% × L(3) = 246
- TASK-07: 85% × M(2) = 170
- TASK-08: 80% × M(2) = 160
- TASK-09: 70% × M(2) = 140
- Sum = 1396 / 17 = 82%
