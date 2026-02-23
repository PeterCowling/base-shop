---
Type: Plan
Status: Draft
Domain: Infra
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: none
Feature-Slug: turbopack-full-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85.0%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Turbopack Full Migration Plan

## Summary
This plan converts the repository from webpack-pinned Next app workflows to Turbopack-ready workflows in controlled waves. The fact-find shows the largest blocker is policy enforcement (`check-next-webpack-flag`) that currently requires `--webpack` by default, so policy and tests must move first. After policy changes, the plan migrates script surfaces, retires remaining webpack magic comments in i18n import paths, and then removes residual webpack-only callback/config surfaces where equivalent Turbopack behavior exists. Storybook builder scope is explicitly decision-gated because Turbopack is a Next bundler and does not directly replace Storybook's webpack builder.

## Active tasks
- [x] TASK-01: Decide migration scope boundary (Next-only vs Next+Storybook)
- [ ] TASK-02: Build canonical migration matrix for app/script/config surfaces
- [ ] TASK-03: Decide policy strategy for `check-next-webpack-flag`
- [ ] TASK-04: Implement policy and tests for Turbopack-first migration mode
- [ ] TASK-05: Horizon checkpoint after policy-layer rollout
- [ ] TASK-06: Retire `webpackInclude` magic-comment pattern in active i18n loaders
- [ ] TASK-07: Migrate shared and app-level webpack callback behavior to Turbopack-safe surfaces
- [ ] TASK-08: Migrate remaining webpack-pinned app scripts and workflow build surfaces
- [ ] TASK-09: Cleanup and hardening (dependency and policy tightening)

## Goals
- Remove webpack pinning from in-scope Next app `dev/build` script surfaces.
- Align repository policy gates with Turbopack migration targets.
- Preserve application behavior by validating alias/fallback parity before callback retirement.
- Finish with explicit zero-webpack acceptance criteria for in-scope runtime surfaces.

## Non-goals
- Storybook builder migration in this plan (explicitly excluded by TASK-01 decision; track as follow-on lane).
- Unrelated feature work in app domains while migration is in progress.
- Bulk refactors outside bundler/runtime surfaces.

## Constraints & Assumptions
- Constraints:
  - CI/hook policy currently rejects many non-webpack script changes by default.
  - Several apps still rely on app-level webpack callbacks (`cms`, `business-os`, `cochlearfit`, `product-pipeline`, `handbag-configurator`, `skylar`, `xa-uploader`, `template-app`).
  - Migration must remain non-destructive and wave-based to avoid broad regressions.
- Assumptions:
  - Existing Turbopack support in current Next version is sufficient for in-scope app runtime flows.
  - Storybook can be tracked as a separate lane if scope excludes it.

## Fact-Find Reference
- Related brief: `docs/plans/turbopack-full-migration/fact-find.md`
- Key findings used:
  - `--webpack` remains in 28 package-script commands across 14 apps.
  - repo guard policy is fail-closed to webpack and enforced in CI/hooks.
  - active `import.meta.webpackContext` usage is already retired in source.
  - Storybook still uses webpack builder and webpack plugins.

## Proposed Approach
- Option A: app-by-app script edits first, then policy updates.
  - Rejected: policy gate blocks fast iteration and creates repetitive failures.
- Option B: policy-first migration, then app/config/script waves.
  - Chosen: removes systemic blocker and enables controlled rollout.
- Chosen approach:
  - run policy and matrix decisions first,
  - execute migration in three implementation waves,
  - checkpoint and re-sequence after policy rollout before touching broader app surfaces.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Decide migration scope boundary | 90% | S | Complete | - | - |
| TASK-02 | INVESTIGATE | Build canonical migration matrix and callback responsibility map | 90% | S | Pending | - | TASK-03, TASK-07, TASK-08 |
| TASK-03 | DECISION | Select policy strategy (matrix expansion vs default inversion) | 85% | S | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update policy script/tests and validation hooks for migration mode | 85% | S | Pending | TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess downstream plan after policy rollout | 95% | S | Pending | TASK-04 | TASK-06, TASK-07, TASK-08 |
| TASK-06 | IMPLEMENT | Replace remaining `webpackInclude` magic-comment pattern | 85% | S | Pending | TASK-05 | TASK-08 |
| TASK-07 | IMPLEMENT | Migrate/retire webpack callback behavior with Turbopack parity checks | 75%* | M | Pending | TASK-01, TASK-02, TASK-05 | TASK-08 |
| TASK-08 | IMPLEMENT | Migrate app/workflow webpack script surfaces in waves | 85% | S | Pending | TASK-02, TASK-05, TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Final cleanup and hardening (policy tightening, optional dependency removal) | 85% | S | Pending | TASK-01, TASK-08 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Scope and evidence collection can run in parallel |
| 2 | TASK-03 | TASK-02 | Policy decision depends on migration matrix evidence |
| 3 | TASK-04 | TASK-03 | Policy implementation follows decision |
| 4 | TASK-05 | TASK-04 | Mandatory checkpoint before wider rollout |
| 5 | TASK-06, TASK-07 | TASK-05 (+ TASK-01/TASK-02 for TASK-07) | Source-pattern cleanup and callback parity can run in parallel |
| 6 | TASK-08 | TASK-06, TASK-07, TASK-02 | Script/workflow migration after parity work |
| 7 | TASK-09 | TASK-08 (+ TASK-01 for scope) | Final tightening and cleanup |

## Tasks

### TASK-01: Decide migration scope boundary (Next-only vs Next+Storybook)
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/turbopack-full-migration/plan.md` Decision Log and explicit scope statement in Summary/Non-goals
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete
- **Affects:** `docs/plans/turbopack-full-migration/plan.md`, `[readonly] apps/storybook/.storybook/main.ts`, `[readonly] apps/storybook/.storybook-ci/main.ts`
- **Depends on:** -
- **Blocks:** `None: task complete, downstream scope gate resolved`
- **Confidence:** 90%
  - Implementation: 90% - required evidence is already present in fact-find and source pointers.
  - Approach: 90% - binary scope decision with clear downstream implications.
  - Impact: 90% - resolves ambiguity that would otherwise stall cleanup criteria.
- **Options:**
  - Option A: Next runtime surfaces only; track Storybook as separate follow-on.
  - Option B: Include Storybook builder migration in this plan.
- **Recommendation:** Option A unless explicit priority is placed on Storybook in the same migration window.
- **Decision outcome (2026-02-23):**
  - Selected option: Option A (Next runtime surfaces only; Storybook excluded from this plan).
  - Why: Turbopack migration scope in this plan is Next runtime; Storybook builder migration is a separate toolchain lane and would expand risk/scope without helping the immediate Next migration path.
  - Residual risk accepted: root `webpack` dependency may remain while Storybook still uses webpack.
- **Acceptance:**
  - Scope decision captured in Decision Log and reflected in Goals/Non-goals.
  - Downstream tasks updated (if needed) to match scope.
- **Validation contract:** Scope statement and task dependencies are internally consistent and non-contradictory.
- **Planning validation:** None: decision task based on existing fact-find evidence.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update this plan only.

### TASK-02: Build canonical migration matrix and callback responsibility map
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`, `[readonly] apps/*/package.json`, `[readonly] apps/*/next.config.mjs`, `[readonly] packages/next-config/next.config.mjs`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-07, TASK-08
- **Confidence:** 90%
  - Implementation: 90% - data sources and extraction approach are straightforward.
  - Approach: 90% - artifact directly supports policy and rollout sequencing.
  - Impact: 90% - reduces execution risk by making wave boundaries explicit.
- **Questions to answer:**
  - Which apps still have webpack-pinned scripts and which command surfaces must change?
  - Which apps depend on app-level webpack callback behavior and what parity is required?
  - Which workflow jobs indirectly inherit webpack via package scripts?
- **Acceptance:**
  - Matrix includes app, script surface, callback status, workflow impact, planned wave.
  - Matrix lists validation command(s) per app wave.
- **Validation contract:** Artifact entries reconcile with repository grep/audit output and contain no missing in-scope app.
- **Planning validation:** None: investigation artifact creation.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** adds one artifact under `docs/plans/turbopack-full-migration/artifacts/`.
- **Notes / references:**
  - `docs/plans/turbopack-full-migration/fact-find.md`

### TASK-03: Select policy strategy for `check-next-webpack-flag`
- **Type:** DECISION
- **Deliverable:** policy strategy decision and accepted transition rule-set in `docs/plans/turbopack-full-migration/plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/turbopack-full-migration/plan.md`, `[readonly] scripts/check-next-webpack-flag.mjs`, `[readonly] scripts/__tests__/next-webpack-flag-policy.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% - decision writes are straightforward.
  - Approach: 85% - trade-off between fast migration and fail-closed safety.
  - Impact: 85% - wrong choice can create excessive churn or weak enforcement.
- **Options:**
  - Option A: Temporary matrix expansion (allow Turbopack app-by-app) before default inversion.
  - Option B: Immediate default inversion (`require-webpack` -> `allow-any` / `require-turbopack` policy model).
- **Recommendation:** Option A for controlled rollout and lower regression risk, then invert default in TASK-09.
- **Decision input needed:**
  - question: prioritize conservative migration control (A) or faster one-shot policy inversion (B)?
  - why it matters: impacts number of intermediate policy edits and CI stability.
  - default + risk: default A; risk is longer mixed-policy period.
- **Acceptance:**
  - Selected option recorded with rationale and transition checkpoints.
  - TASK-04 acceptance criteria aligned to chosen strategy.
- **Validation contract:** strategy is testable with existing policy unit tests and merge-gate behavior.
- **Planning validation:** None: decision informed by TASK-02 artifact.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update this plan.

### TASK-04: Implement policy and tests for Turbopack-first migration mode
- **Type:** IMPLEMENT
- **Deliverable:** code-change in policy script/tests/hooks enabling chosen migration mode
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/check-next-webpack-flag.mjs`, `scripts/__tests__/next-webpack-flag-policy.test.ts`, `scripts/validate-changes.sh`, `scripts/git-hooks/pre-commit.sh`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - code paths are localized and already unit-tested.
  - Approach: 85% - strategy-selected update path is explicit.
  - Impact: 85% - policy mistakes can block CI, but fast feedback exists.
- **Acceptance:**
  - Policy script reflects selected strategy and no longer blocks intended migration wave.
  - Contract tests are updated and passing for fail/open cases.
  - Hook and validate script behavior remains consistent with merge-gate intent.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm -w test -- --testPathPattern=next-webpack-flag-policy` passes with updated strategy cases.
  - TC-02: `node scripts/check-next-webpack-flag.mjs --all` exits 0 on current repo state after intentional rule update.
  - TC-03: negative fixture in policy tests still fails when policy violation is present.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: policy surfaces already identified in fact-find.
- **Edge Cases & Hardening:** Ensure multi-command scripts and workflow step parsing remain covered by tests.
- **What would make this >=90%:**
  - Add explicit regression tests for both old and new policy modes during transition.
- **Rollout / rollback:**
  - Rollout: land policy updates before app script migration commits.
  - Rollback: revert policy script/tests to previous matrix behavior.
- **Documentation impact:**
  - Update plan Decision Log if strategy differs from default recommendation.
- **Notes / references:**
  - `scripts/check-next-webpack-flag.mjs`
  - `scripts/__tests__/next-webpack-flag-policy.test.ts`

### TASK-05: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if needed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/turbopack-full-migration/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06, TASK-07, TASK-08
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream tasks if policy outcomes changed assumptions
  - confidence for downstream tasks recalibrated from latest evidence
  - plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - policy update did not create hidden blockers for app/workflow migration waves
  - migration matrix from TASK-02 still matches current repo state
- **Validation contract:** checkpoint notes recorded in plan and dependencies remain acyclic.
- **Planning validation:** checkpoint output references updated plan sections.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan with checkpoint outcomes.

### TASK-06: Replace remaining `webpackInclude` magic-comment pattern
- **Type:** IMPLEMENT
- **Deliverable:** code-change replacing active `webpackInclude` usage with bundler-neutral import/loading pattern
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/i18n/src/loadMessages.server.ts`, `packages/template-app/src/app/[lang]/layout.tsx`, `packages/template-app/src/app/[lang]/checkout/layout.tsx`, `apps/cover-me-pretty/src/app/[lang]/layout.tsx`, `apps/skylar/src/app/[lang]/layout.tsx`, `apps/cochlearfit/src/lib/messages.ts`, `scripts/src/add-locale.ts`
- **Depends on:** TASK-05
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - call sites are explicit and bounded.
  - Approach: 85% - neutral import patterns are known from prior Turbopack migrations.
  - Impact: 85% - cross-app i18n regressions are possible but testable.
- **Acceptance:**
  - No active source files in scope contain `webpackInclude` comments.
  - Locale/message loading behavior remains functional in targeted app smoke tests.
  - `scripts/src/add-locale.ts` updated to stop rewriting webpack-specific comments.
- **Validation contract (TC-XX):**
  - TC-01: `rg -n 'webpackInclude|webpackPrefetch|webpackChunkName' apps packages scripts --glob '!**/_artifacts/**'` returns only out-of-scope/historical matches.
  - TC-02: targeted locale-loading tests for affected packages/apps pass.
  - TC-03: one dev/build smoke per affected app wave confirms locale content renders.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** Verify import path behavior under both server and client execution paths before finalizing pattern.
- **Edge Cases & Hardening:** Preserve lazy-loading semantics and language fallback behavior.
- **What would make this >=90%:**
  - Add regression tests for each migrated loader path.
- **Rollout / rollback:**
  - Rollout: merge after policy checkpoint and before bulk script migration.
  - Rollback: restore previous import-comment behavior and generator logic.
- **Documentation impact:**
  - update migration matrix artifact with completed source-pattern retirement.
- **Notes / references:**
  - `docs/plans/turbopack-full-migration/fact-find.md`

### TASK-07: Migrate/retire webpack callback behavior with Turbopack parity checks
- **Type:** IMPLEMENT
- **Deliverable:** code-change converting or removing webpack callback logic where Turbopack equivalents exist
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/next-config/next.config.mjs`, `apps/business-os/next.config.mjs`, `apps/cms/next.config.mjs`, `apps/cochlearfit/next.config.mjs`, `apps/handbag-configurator/next.config.mjs`, `apps/product-pipeline/next.config.mjs`, `apps/skylar/next.config.mjs`, `apps/xa-uploader/next.config.mjs`, `packages/template-app/next.config.mjs`
- **Depends on:** TASK-01, TASK-02, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 75%* _(provisional — pending TASK-02 callback responsibility map; will be recalibrated at TASK-05 checkpoint)_
  - Implementation: 70% - files are known, but callback behavior varies significantly per app (CMS alone is ~174 lines of aliases, caching, React dedup, Sentry exclusion, and warning suppression). Turbopack equivalents are not yet verified per callback family.
  - Approach: 80% - parity-first migration with matrix guidance is clear.
  - Impact: 75% - callback regressions can break runtime/build paths; CMS and business-os have the highest blast radius due to client-side fallbacks and extensive alias mappings.
- **Known callback complexity (from repo audit):**
  - Shared config (`packages/next-config`): resolve extensions, extensionAlias, workspace package aliases (4 packages), node: built-in mapping, drizzle-orm disable.
  - `apps/cms`: ~174 lines — `ensureSafeWebpackHash`, filesystem caching in dev, `@` alias, theme subpath aliases, `@acme/configurator`, React/ReactDOM dedup, entity decode/escape, oidc-token-hash, Sentry client exclusion, pino runtime deps, dynamic import warning suppression.
  - `apps/business-os`: `@` alias, client-side resolve.fallback for `fs`, `child_process`, `path`.
  - Other apps: scope to be confirmed by TASK-02 migration matrix.
- **Acceptance:**
  - Shared and app-level webpack callback responsibilities are either ported, isolated, or intentionally retained with explicit rationale.
  - For migrated apps, Turbopack config surfaces (`turbopack.resolveAlias` and related settings) cover required behavior.
  - Representative app build/dev validations pass for each callback family.
  - Any callback behavior with no Turbopack equivalent is documented as an explicit exception with retention rationale.
- **Validation contract (TC-XX):**
  - TC-01: targeted grep/report shows migrated apps no longer rely on webpack-only callback behavior for required runtime paths.
  - TC-02: targeted build/dev probes pass for `cms`, `business-os`, and one shared-config app.
  - TC-03: no new alias/fallback resolution errors in migration wave logs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Review TASK-02 callback responsibility map for completeness before starting implementation.
  - Verify Turbopack equivalents exist for each callback behavior family (aliases, fallbacks, caching, warning suppression).
- **Scouts:** Confirm whether any callback behavior should remain webpack-only (documented exception) before removal. Priority: CMS safe-hash guard, CMS filesystem caching, business-os client fallbacks.
- **Edge Cases & Hardening:** preserve server/client alias boundaries and node built-in handling.
- **What would make this >=90%:**
  - TASK-02 callback responsibility map shows all behaviors have Turbopack equivalents or explicit exception rationale.
  - Add explicit parity checklist per callback file in migration matrix.
  - Prototype CMS config migration and verify build/dev success before full rollout.
- **Rollout / rollback:**
  - Rollout: migrate one callback family at a time with validation after each commit.
  - Rollback: revert affected app config file(s) and rerun targeted validations.
- **Documentation impact:**
  - Update matrix artifact with callback parity outcomes.
- **Notes / references:**
  - `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`

### TASK-08: Migrate remaining webpack-pinned app scripts and workflow build surfaces
- **Type:** IMPLEMENT
- **Deliverable:** code-change updating app package scripts and affected workflow surfaces away from `--webpack`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/business-os/package.json`, `apps/caryina/package.json`, `apps/cms/package.json`, `apps/cochlearfit/package.json`, `apps/cover-me-pretty/package.json`, `apps/handbag-configurator/package.json`, `apps/prime/package.json`, `apps/product-pipeline/package.json`, `apps/skylar/package.json`, `apps/xa/package.json`, `apps/xa-b/package.json`, `apps/xa-j/package.json`, `apps/xa-uploader/package.json`, `packages/template-app/package.json`, `.github/workflows/*.yml` (where build-cmd assumptions require updates)
- **Depends on:** TASK-02, TASK-05, TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - script surfaces are fully enumerated.
  - Approach: 85% - wave rollout is straightforward once policy/callback prerequisites are done.
  - Impact: 85% - broad app touch count; mitigated by wave validation.
- **Acceptance:**
  - In-scope apps no longer pin `--webpack` in `dev/build/preview` scripts.
  - Workflow commands remain aligned with updated app script contracts.
  - Targeted app build/dev smoke checks pass per migration wave.
- **Validation contract (TC-XX):**
  - TC-01: `rg -n 'next (dev|build).*--webpack|--webpack' apps/*/package.json packages/template-app/package.json` returns zero in-scope matches.
  - TC-02: representative app build commands for each wave exit 0.
  - TC-03: merge-gate policy check passes with updated strategy (`node scripts/check-next-webpack-flag.mjs --all`).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** confirm apps with no `build` script remain intentional and documented.
- **Edge Cases & Hardening:** ensure multi-command scripts and preview commands keep equivalent behavior.
- **What would make this >=90%:**
  - Add per-wave automated smoke workflow to CI before final wave merge.
- **Rollout / rollback:**
  - Rollout: migrate in bounded waves with validation after each wave.
  - Rollback: revert affected app/workflow files for failing wave.
- **Documentation impact:**
  - Update migration matrix status and completed wave log.
- **Notes / references:**
  - `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`

### TASK-09: Final cleanup and hardening (policy tightening, optional dependency removal)
- **Type:** IMPLEMENT
- **Deliverable:** code-change tightening post-migration enforcement and removing now-unused webpack dependency where in-scope
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/check-next-webpack-flag.mjs`, `scripts/__tests__/next-webpack-flag-policy.test.ts`, `package.json`, `pnpm-lock.yaml`, `docs/plans/turbopack-full-migration/plan.md`
- **Depends on:** TASK-01, TASK-08
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - cleanup is straightforward once migration is complete.
  - Approach: 85% - final-state policy can be locked after wave completion evidence.
  - Impact: 85% - dependency/policy cleanup affects broad tooling surfaces.
- **Acceptance:**
  - Final policy mode aligns with completed migration scope and blocks regressions.
  - Root `webpack` dependency is removed only if no in-scope consumer remains (or retained with explicit scope rationale if Storybook is in-scope deferred).
  - Plan status and decision log reflect completed migration state and residual out-of-scope items.
- **Validation contract (TC-XX):**
  - TC-01: policy tests pass in final mode.
  - TC-02: dependency graph/install checks pass after optional `webpack` removal.
  - TC-03: final grep audit confirms in-scope zero-webpack criteria.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** verify non-Next webpack consumers before dependency removal attempt.
- **Edge Cases & Hardening:** if Storybook remains out-of-scope and still uses webpack, keep dependency with explicit rationale.
- **What would make this >=90%:**
  - Explicit consumer-proof checklist run and archived in artifacts.
- **Rollout / rollback:**
  - Rollout: apply cleanup only after all migration waves are green.
  - Rollback: restore final-state policy/dependency changes and defer cleanup lane.
- **Documentation impact:**
  - update plan status, Decision Log, and migration matrix final state.
- **Notes / references:**
  - `apps/storybook/.storybook/main.ts`
  - `apps/storybook/.storybook-ci/main.ts`

## Risks & Mitigations
- Policy drift during migration windows:
  - Mitigation: keep policy tests mandatory in each wave.
- Callback parity regressions:
  - Mitigation: callback matrix and representative app smoke checks before script migration.
- Scope ambiguity around Storybook:
  - Mitigation: TASK-01 explicit decision gate.
- No Turbopack equivalent for webpack callback behavior:
  - Mitigation: TASK-02 matrix must enumerate each callback behavior and verify Turbopack equivalent exists. If no equivalent, document as explicit exception and retain webpack callback for that app. CMS is highest risk (safe-hash guard, filesystem caching, warning suppression). Recalibrate TASK-07 confidence at TASK-05 checkpoint based on TASK-02 findings.
- Over-aggressive cleanup:
  - Mitigation: dependency removal only with positive consumer audit.

## Observability
- Logging:
  - capture per-wave migration notes and failing command output in plan task notes.
- Metrics:
  - count remaining in-scope `--webpack` script matches after each wave.
  - count remaining in-scope webpack callback surfaces after each wave.
- Alerts/Dashboards:
  - None: use CI failures and merge-gate output as enforcement signal.

## Acceptance Criteria (overall)
- [x] Scope boundary is explicitly decided and documented.
- [ ] Policy gate supports planned Turbopack migration sequence.
- [ ] In-scope Next app script surfaces no longer require `--webpack`.
- [ ] In-scope webpack callback/magic-comment surfaces are retired or explicitly documented as intentional exceptions.
- [ ] Final policy prevents regressions back to deprecated webpack patterns for in-scope surfaces.

## Decision Log
- 2026-02-23: Initialized plan from `fact-find.md` in plan-only mode; selected policy-first migration shape pending TASK-03 confirmation.
- 2026-02-23: TASK-01 decision recorded. Scope = Option A (Next runtime only). Storybook builder migration is out-of-scope for this plan and will be tracked as a separate follow-on lane.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Task confidences (effort-weighted): 90×1, 90×1, 85×1, 85×1, 95×1, 85×1, 75×2, 85×1, 85×1
- Total weighted = 90 + 90 + 85 + 85 + 95 + 85 + 150 + 85 + 85 = 850
- Total weights = 1 + 1 + 1 + 1 + 1 + 1 + 2 + 1 + 1 = 10
- Overall-confidence = 850 / 10 = 85.0%
- Note: TASK-07 confidence (75%*) is provisional pending TASK-02 output; will be recalibrated at TASK-05 checkpoint.
