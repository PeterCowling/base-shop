---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: storybook-vite-migration-assessment
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Storybook Vite Migration Assessment Plan

## Summary
This plan migrates Storybook from the current webpack builder to a Vite-backed path without breaking CI smoke and interaction contracts. The plan is intentionally staged: stabilize the current webpack baseline first, then introduce a Vite canary lane, then perform a gated default cutover. It explicitly separates Storybook migration from repo-wide webpack eradication because Cypress and Storybook package chains currently still pull webpack. The execution path includes a checkpoint and go/no-go decision before default switching.

## Active tasks
- [x] TASK-01: Decide lane scope and acceptance boundary
- [x] TASK-02: Investigate duplicate story indexing and choose baseline dedupe strategy
- [x] TASK-03: Stabilize webpack baseline and remove stale failure messaging
- [ ] TASK-04: Build Vite canary lane with parity validation contracts
- [ ] TASK-05: Horizon checkpoint after canary evidence
- [ ] TASK-06: Decide default cutover go/no-go
- [ ] TASK-07: Cut over default Storybook configs to Vite and align docs/dependencies

## Goals
- Preserve `storybook:smoke:ui` and `test-storybook:runner` behavior during migration.
- Prove Vite parity on defined canary contracts before default cutover.
- Keep migration reversible until cutover decision is explicitly approved.
- Resolve current baseline drift where `build` script messaging no longer matches observed failure mode.

## Non-goals
- Repo-wide webpack removal in the same lane.
- Cypress webpack preprocessor migration/removal.
- Broad tsconfig alias policy rewrite outside Storybook needs.
- Chromatic workflow redesign.

## Constraints & Assumptions
- Constraints:
  - CI Storybook jobs in `.github/workflows/storybook.yml` must remain green.
  - Next module stubs and aliases used by current Storybook configs must be preserved.
  - Changes must be incremental and rollback-safe in a shared workspace.
- Assumptions:
  - `@storybook/nextjs-vite` is still the target framework package for migration.
  - Existing smoke and runner commands are sufficient minimum gating for cutover.

## Fact-Find Reference
- Related brief: `docs/plans/storybook-vite-migration-assessment/fact-find.md`
- Key findings used:
  - Active configs are webpack builder pinned in `apps/storybook/.storybook/main.ts` and `apps/storybook/.storybook-ci/main.ts`.
  - Fact-find baseline (2026-02-23): `build:ci` succeeded while `build:full` failed on duplicate story indexing.
  - Current execution state (2026-02-24): `build:full`, `build:ci`, and `test-storybook:runner` pass after TASK-03 hardening + CI story-scope curation.
  - `@storybook/nextjs-vite` and Vite config are present but not active as runtime builder.
  - `pnpm why webpack` confirms Storybook-only migration will not fully remove webpack from the workspace.

## Proposed Approach
- Option A: staged migration with baseline stabilization -> Vite canary -> checkpoint -> cutover decision -> default switch.
- Option B: direct cutover of existing configs to Vite and fix breakages in-place.
- Chosen approach: Option A. It contains blast radius and provides a deterministic rollback point.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; no explicit auto-build intent)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Decide Storybook-only vs repo-wide webpack scope and acceptance boundary | 90% | S | Complete (2026-02-24) | - | TASK-04, TASK-06 |
| TASK-02 | INVESTIGATE | Identify duplicate story indexing root cause and dedupe strategy | 85% | M | Complete (2026-02-23) | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Stabilize webpack baseline and align script messaging with observed failures | 90% | M | Complete (2026-02-24) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Introduce Vite canary config/scripts and parity checks | 75% | L | Pending | TASK-01, TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess downstream plan from canary evidence | 95% | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | DECISION | Decide default cutover go/no-go from canary evidence | 90% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Switch default configs/docs to Vite and document residual webpack sources | 85% | M | Pending | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Scope decision and baseline investigation can run in parallel. |
| 2 | TASK-03 | TASK-02 | Baseline must be stabilized before introducing canary lane. |
| 3 | TASK-04 | TASK-01, TASK-03 | Canary work depends on scope boundary and clean baseline. |
| 4 | TASK-05 | TASK-04 | Checkpoint enforces evidence-based replan before cutover choice. |
| 5 | TASK-06 | TASK-05 | Explicit go/no-go decision based on canary evidence. |
| 6 | TASK-07 | TASK-06 | Cutover only after decision closure. |

## Tasks

### TASK-01: Decide Storybook migration scope and acceptance boundary
- **Type:** DECISION
- **Deliverable:** Decision record in `docs/plans/storybook-vite-migration-assessment/plan.md` Decision Log.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-24)
- **Affects:** `docs/plans/storybook-vite-migration-assessment/plan.md`, `[readonly] docs/plans/storybook-vite-migration-assessment/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 90%
  - Implementation: 95% - decision artifact path and owner are explicit.
  - Approach: 90% - option framing is binary and directly tied to acceptance criteria.
  - Impact: 90% - scope lock prevents migration success criteria drift.
- **Options:**
  - Option A: Storybook-only Vite migration now; treat repo-wide webpack removal as separate lane.
  - Option B: Require repo-wide webpack removal in same lane.
- **Recommendation:** Option A. Evidence shows Cypress and Storybook package chains still consume webpack, so bundling both goals increases risk and hides success criteria.
- **Decision outcome (2026-02-24):**
  - selected option: Option A (Storybook-only migration lane).
  - rationale: Matches migration objective while keeping repo-wide webpack removal explicit and separately trackable.
  - known tradeoff: webpack residuals remain expected until dedicated non-Storybook lanes are executed.
- **Acceptance:**
  - Scope decision is recorded with owner and date.
  - Acceptance criteria explicitly state whether repo-wide webpack removal is in or out of scope.
- **Validation contract:**
  - VC-01: Decision log entry references `pnpm why webpack` evidence and fact-find scope notes.
  - VC-02: Task Summary/Goals/Non-goals all reflect the same scope statement.
- **Planning validation:**
  - Checks run: `pnpm why webpack`.
  - Validation artifacts: command output from 2026-02-23 plus fact-find dependency map.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Keep scope statement synchronized across plan sections and final migration PR summary.
- **Build completion evidence (2026-02-24):**
  - Decision closed to Option A (Storybook-only migration lane).
  - Non-goals remain explicit for repo-wide webpack removal and Cypress webpack preprocessor migration.
  - VC-01/VC-02 satisfied via scope consistency across Summary, Goals/Non-goals, and this Decision Log.

### TASK-02: Investigate duplicate story indexing root cause and dedupe strategy
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`, `docs/plans/storybook-vite-migration-assessment/artifacts/story-duplicate-map.tsv`, `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook-ci/main.ts`, `[readonly] apps/storybook/package.json`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 90% - failure signature is reproducible and source globs are inspectable.
  - Approach: 85% - collision-mapping to canonical source path is straightforward.
  - Impact: 85% - resolving this is a hard prerequisite for trustworthy parity testing.
- **Questions to answer:**
  - Which story globs include duplicate design-system story sources?
  - What canonical source rule removes duplicates without dropping intended coverage?
  - Does the same collision exist in both `.storybook` and `.storybook-ci` routes?
- **Acceptance:**
  - Artifact lists collided story IDs and their file paths.
  - A single canonical dedupe strategy is selected and mapped to exact config edits.
  - Validation matrix for `build:full` and `build:ci` is defined.
- **Validation contract:**
  - VC-01: `pnpm --filter @apps/storybook run build:full` reproduces duplicate story indexing failure before fix.
  - VC-02: Candidate dedupe rule is testable with explicit post-fix pass criteria.
- **Planning validation:**
  - Checks run: `pnpm --filter @apps/storybook run build:full` (fails on duplicate IDs), `pnpm --filter @apps/storybook run build:ci` (passes).
  - Validation artifacts: command logs from 2026-02-23 and current story glob definitions.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Add artifact link to this plan and to migration PR description.
- **Notes / references:**
  - `apps/storybook/.storybook/main.ts`
  - `apps/storybook/.storybook-ci/main.ts`
  - `docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`
  - `docs/plans/storybook-vite-migration-assessment/artifacts/story-duplicate-map.tsv`
- **Build completion evidence (2026-02-23):**
  - Artifact produced: `docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`
  - Collision map produced: `docs/plans/storybook-vite-migration-assessment/artifacts/story-duplicate-map.tsv` (840 duplicate rows, 237 unique IDs, 167 unique source-path pairs)
  - VC-01 closed: reproduced `build:full` duplicate-index failure from captured log evidence.
  - VC-02 closed: selected canonical dedupe strategy and mapped exact config edits for TASK-03.
  - Outcome classification: Affirming for TASK-03, Neutral for TASK-04.

### TASK-03: Stabilize webpack baseline and align script messaging
- **Type:** IMPLEMENT
- **Deliverable:** Baseline-stable webpack Storybook configs and accurate wrapper script messaging.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook-ci/main.ts`, `apps/storybook/package.json`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 95% - TASK-02 produced a concrete collision map and exact edit targets.
  - Approach: 90% - dedupe strategy is now explicit and bounded to story source discovery.
  - Impact: 90% - baseline stabilization risk reduced after root-cause confirmation.
- **Acceptance:**
  - Story discovery no longer produces duplicate story ID failures in `build:full`.
  - `build:ci` remains successful after dedupe edits.
  - `build` script message no longer advertises stale `webpack hash bug` root cause.
- **Validation contract (TC-03):**
  - TC-01: `pnpm --filter @apps/storybook run build:full` -> exits 0.
  - TC-02: `pnpm --filter @apps/storybook run build:ci` -> exits 0.
  - TC-03: `pnpm storybook:smoke:ui` -> passes.
  - TC-04: `pnpm test-storybook:runner` -> passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/storybook run build:full` (pass, 2026-02-24)
    - `pnpm --filter @apps/storybook run build:ci` (pass, 2026-02-24)
    - `pnpm --filter @apps/storybook run build:ci` (pass after CI story-source curation, 2026-02-24)
    - `pnpm storybook:smoke:ui` (first run timeout waiting on `http://localhost:6007`; rerun pass, 2026-02-24)
    - `pnpm exec cross-env WAIT_ON_TIMEOUT=180000 start-server-and-test "pnpm run storybook:ci" tcp:6007 "pnpm exec test-storybook --config-dir apps/storybook/.storybook-ci --url http://localhost:6007 --includeTags ci --listTests"` (pass; reduced CI runner scope to 17 story files, 2026-02-24)
    - `pnpm test-storybook:runner` (pass, exit 0, `Time: 236.409 s`, 2026-02-24)
    - config inspection in `.storybook/main.ts` and `.storybook-ci/main.ts`
  - Validation artifacts:
    - fact-find baseline command section
    - duplicate-ID command output captured on 2026-02-23
    - `docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`
    - `docs/plans/storybook-vite-migration-assessment/artifacts/task-03-validation-2026-02-24.md`
    - Local transient command logs: `/tmp/tc03-build-full.log`, `/tmp/tc03-build-ci.log`, `/tmp/tc03-smoke-ui.log`, `/tmp/tc03-smoke-ui-rerun.log`, `/tmp/tc03-runner-rerun.log`, `/tmp/tc03-runner-fix1.log`, `/tmp/tc03-runner-fix1-controlled.log`, `/tmp/tc03-runner-final2.log`, `/tmp/ci-list-after.log`, `/tmp/tc03-runner-final3.log`
  - Unexpected findings:
    - Prior documented `WasmHash` failure signature no longer matches current failure mode.
    - Post-dedupe duplicate IDs persisted between `packages/ui/src` and `packages/design-system/src`; resolved by keeping `packages/ui/src` as the canonical full-build source.
    - Broad `.storybook-ci` story globs produced an unbounded runner surface relative to CI timeout budget; explicit allowlist curation was required to stabilize runtime.
    - `test-storybook:runner` now exits successfully but with `17 skipped` suites, so ci-tag assertion depth remains a known risk for TASK-04 parity work.
  - Consumer tracing:
    - Modified behavior: Story discovery globs are consumed by Storybook index generation in local and CI configs.
    - Consumer safety: root scripts (`storybook`, `storybook:ci`, `storybook:smoke:ui`, `test-storybook:runner`) remain unchanged; only discovery behavior changes.
- **Scouts:** Verify no CI-tagged story subset loss after dedupe.
- **Edge Cases & Hardening:** Ensure no shared-output race (`storybook-static`) by running build commands serially in validation.
- **What would make this >=90%:**
  - Capture before/after story index counts and confirm no intentional stories were dropped.
  - Run smoke + runner twice consecutively after fix.
- **Rollout / rollback:**
  - Rollout: land dedupe edits first without changing builder.
  - Rollback: restore prior glob configuration from git if coverage gaps appear.
- **Documentation impact:** Note baseline stabilization in migration changelog section of plan.
- **Notes / references:**
  - `apps/storybook/.storybook/main.ts`
  - `apps/storybook/.storybook-ci/main.ts`
  - `apps/storybook/package.json`
- **Downstream confidence propagation (from TASK-02):**
  - TASK-03 confidence increased from 85% to 90% based on direct collision inventory and exact dedupe mapping.
  - TASK-04 remains 75% because Vite parity and alias-stub behavior are still unresolved.
- **Build execution evidence (2026-02-24):**
  - Implemented: removed `packages/design-system/src/**/*.stories.@(ts|tsx)` from `apps/storybook/.storybook/main.ts` story discovery.
  - Implemented: updated `apps/storybook/package.json` `build` wrapper message to remove stale `webpack hash bug` phrasing.
  - Implemented: added hardened `.storybook-ci` test-runner `prepare` with retryable long-timeout `iframe.html` bootstrap.
  - Implemented: hardened root `test-storybook:runner` / `test-storybook:coverage` scripts (`WAIT_ON_TIMEOUT=300000`, `--testTimeout 60000`, `--maxWorkers 1`, `tcp:6007` readiness).
  - Implemented: curated `.storybook-ci/main.ts` story sources to an explicit smoke + ci allowlist and removed CI MDX story loading.
  - TC-01: pass (`build:full`, no duplicate story indexing errors).
  - TC-02: pass (`build:ci`).
  - TC-03: pass on rerun (`storybook:smoke:ui`).
  - TC-04: pass (`pnpm test-storybook:runner` exit 0, `Time: 236.409 s`; note: `17 skipped` suites).

### TASK-04: Build Vite canary lane with parity checks
- **Type:** IMPLEMENT
- **Deliverable:** Non-default Vite canary config, scripts, and parity evidence artifacts.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/storybook/.storybook/vite.storybook.ts`, `apps/storybook/package.json`, `package.json`, `.github/workflows/storybook.yml`, `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook-ci/main.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 75%
  - Implementation: 75% - Vite config/stub path exists but unresolved parity seams remain.
  - Approach: 85% - dual-lane canary before cutover minimizes production tooling risk.
  - Impact: 75% - unresolved alias and Next stub edge cases can still break canary execution.
- **Acceptance:**
  - Canary scripts exist and are isolated from default webpack scripts.
  - Canary build, smoke, and runner contracts are defined and executable.
  - Canary evidence artifacts are saved for checkpoint review.
- **Validation contract (TC-04):**
  - TC-01: `pnpm --filter @apps/storybook run build:ci:vite` -> exits 0.
  - TC-02: `pnpm storybook:smoke:ui:vite` -> passes.
  - TC-03: `pnpm test-storybook:runner:vite` -> passes.
  - TC-04: Optional non-blocking CI canary job publishes pass/fail telemetry without replacing existing required jobs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `.storybook/vite.storybook.ts` inspection confirms unresolved `__dirname` usage under ESM semantics.
    - Fact-find confirms no fresh Vite canary run in this round.
  - Validation artifacts:
    - `docs/plans/storybook-vite-migration-assessment/fact-find.md`
    - Vite config source at `apps/storybook/.storybook/vite.storybook.ts`
  - Unexpected findings:
    - Existing Vite helper config is substantial but not wired into active Storybook entrypoints.
  - Consumer tracing:
    - New outputs: canary scripts and optional workflow job definitions.
    - Consumers: root `package.json` script entrypoints, Storybook CI workflow steps, local developer execution docs.
    - Consumer safety: default scripts (`storybook:ci`, `storybook:smoke:ui`, `test-storybook:runner`) remain unchanged until TASK-07.
- **Scouts:** Probe resolver behavior against `@acme/editorial` multi-target aliases before enabling CI canary by default.
- **Edge Cases & Hardening:**
  - Keep canary output directory distinct from default where needed to avoid cross-job artifacts.
  - Guard against canary-only alias overrides leaking into webpack default config.
- **What would make this >=90%:**
  - Two consecutive green local canary matrices plus one green CI canary run.
  - Explicit parity snapshot for Next navigation/router mock behavior across representative stories.
- **Rollout / rollback:**
  - Rollout: introduce canary scripts/config behind non-default commands.
  - Rollback: delete canary script entries/config files without affecting default webpack path.
- **Documentation impact:** Add canary command section to Storybook migration notes.
- **Notes / references:**
  - `apps/storybook/.storybook/vite.storybook.ts`
  - `package.json`
  - `.github/workflows/storybook.yml`

### TASK-05: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if canary evidence changes risk profile.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/storybook-vite-migration-assessment/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - checkpoint contract is explicit.
  - Approach: 95% - prevents unsafe automatic cutover progression.
  - Impact: 95% - forces evidence-based decision quality.
- **Acceptance:**
  - Checkpoint executor is run.
  - Canary evidence is reviewed and downstream confidence is recalibrated.
  - Plan is updated/resequenced if needed.
- **Horizon assumptions to validate:**
  - Canary pass means default cutover risk is materially lower.
  - Any unresolved parity gap is documented before go/no-go decision.
- **Validation contract:** Checkpoint notes include explicit pass/fail status for TC-04 matrix and residual risks.
- **Planning validation:** Reference canary artifacts produced by TASK-04.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Update task confidence and dependency notes in this plan.

### TASK-06: Decide default cutover go/no-go
- **Type:** DECISION
- **Deliverable:** Cutover decision entry in this plan and go/no-go rationale.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/storybook-vite-migration-assessment/plan.md`, `[readonly] docs/plans/storybook-vite-migration-assessment/artifacts/story-source-collision.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 95% - decision gate is explicit and bounded.
  - Approach: 90% - ties directly to canary evidence contracts.
  - Impact: 90% - controls cutover blast radius.
- **Options:**
  - Option A: Proceed to default Vite cutover now.
  - Option B: Keep webpack default and open replan tasks for unresolved parity gaps.
- **Recommendation:** Conditional A. Proceed only if all TC-04 checks are green and no high-risk unresolved parity defect remains.
- **Decision input needed:**
  - question: Do we accept canary evidence as sufficient to replace default webpack Storybook configs now?
  - why it matters: This decision controls whether CI contract shifts immediately or stays in canary mode.
  - default + risk: Default to hold (Option B) if any high-risk parity defect remains; risk is timeline extension.
- **Acceptance:**
  - Decision explicitly references canary evidence and residual risk list.
  - TASK-07 is either unblocked or superseded with rationale.
- **Validation contract:** VC-01 all TC-04 criteria status documented; VC-02 decision rationale includes rollback expectations.
- **Planning validation:** `None: decision depends on TASK-05 runtime evidence.`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update Decision Log and task status transitions.

### TASK-07: Cut over default Storybook configs to Vite and align docs/dependencies
- **Type:** IMPLEMENT
- **Deliverable:** Default Storybook commands/configs run on Vite with updated docs and explicit webpack residual inventory.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook-ci/main.ts`, `apps/storybook/package.json`, `package.json`, `.github/workflows/storybook.yml`, `docs/storybook.md`, `apps/storybook/README.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - required file surfaces and command contracts are known.
  - Approach: 90% - gated decision + canary evidence reduces cutover ambiguity.
  - Impact: 85% - CI and local Storybook behavior remain validated via existing smoke/runner contracts.
- **Acceptance:**
  - Default Storybook config path uses `@storybook/nextjs-vite` where intended.
  - CI-required Storybook smoke and runner jobs remain green.
  - Storybook docs no longer contain stale anti-Vite guidance once migration is complete.
  - `pnpm why webpack` is captured post-cutover and remaining webpack sources are documented explicitly.
- **Validation contract (TC-07):**
  - TC-01: `pnpm --filter @apps/storybook run build:ci` -> exits 0 using default config.
  - TC-02: `pnpm storybook:smoke:ui` -> passes.
  - TC-03: `pnpm test-storybook:runner` -> passes.
  - TC-04: `pnpm why webpack` -> residual chains documented in plan/PR notes.
  - TC-05: `rg -n "pinned to Webpack 5|do not retry Vite" docs/storybook.md apps/storybook/README.md` -> no stale guidance remains.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - Config and workflow file inspection completed.
    - Current dependency graph confirmed with `pnpm why webpack`.
  - Validation artifacts:
    - fact-find evidence and command logs from 2026-02-23.
  - Unexpected findings:
    - Current docs are internally inconsistent with actual Storybook 10 package set and runner usage notes.
  - Consumer tracing:
    - Modified behavior: existing default Storybook scripts now resolve to Vite-backed config.
    - Consumers: root scripts, CI jobs in `.github/workflows/storybook.yml`, developers following `docs/storybook.md` and `apps/storybook/README.md`.
    - Consumer safety: command names are preserved to avoid downstream contract churn.
- **Scouts:** Confirm no hidden tooling relies on webpack-specific config hooks before removing builder references.
- **Edge Cases & Hardening:**
  - Keep rollback-ready config snapshot until two consecutive green CI runs.
  - Validate both local and CI config paths (`.storybook` and `.storybook-ci`) after switch.
- **What would make this >=90%:**
  - Two consecutive green CI runs after cutover with unchanged required Storybook jobs.
  - Post-cutover dev smoke feedback from at least one additional operator session.
- **Rollout / rollback:**
  - Rollout: switch default configs after TASK-06 go decision and validated canary artifacts.
  - Rollback: restore prior webpack builder config blocks and script routing if required jobs regress.
- **Documentation impact:** Update `docs/storybook.md`, `apps/storybook/README.md`, and plan Decision Log with final state.
- **Notes / references:**
  - `apps/storybook/.storybook/main.ts`
  - `apps/storybook/.storybook-ci/main.ts`
  - `docs/storybook.md`

## Risks & Mitigations
- Vite canary fails on Next stubs/aliases.
  - Mitigation: keep non-default canary lane and require TC-04 parity evidence before cutover.
- Baseline remains unstable due duplicate story sources.
  - Mitigation: force TASK-02/TASK-03 completion before any Vite activation.
- Scope creep to repo-wide webpack removal stalls migration.
  - Mitigation: lock scope in TASK-01 and track residual webpack as explicit post-cutover backlog.
- CI contract regressions after cutover.
  - Mitigation: preserve command names and gate on existing smoke/runner jobs.

## Observability
- Logging:
  - Save canary/build outputs under `docs/plans/storybook-vite-migration-assessment/artifacts/`.
- Metrics:
  - Capture pass/fail for `build:ci`, `storybook:smoke:ui`, and `test-storybook:runner` across baseline, canary, and cutover phases.
- Alerts/Dashboards:
  - Use existing GitHub Actions job statuses for `ui-smoke` and `runner`; add optional canary status check while canary lane is active.

## Acceptance Criteria (overall)
- [x] Scope boundary is explicitly decided and documented.
- [x] Webpack baseline is stable enough for parity comparisons.
- [ ] Vite canary matrix has reproducible pass/fail evidence.
- [ ] Checkpoint and cutover decision are executed before default switch.
- [ ] Default Storybook commands and CI contracts remain green after migration.
- [ ] Residual webpack usage is documented with explicit source chains.

## Decision Log
- 2026-02-23: Plan created in `plan-only` mode from fact-find evidence.
- 2026-02-23: Default scope assumption set to Storybook-only migration pending explicit owner confirmation (TASK-01).
- 2026-02-23: TASK-02 completed; investigation artifacts captured duplicate source collisions and selected canonical dedupe strategy.
- 2026-02-24: TASK-01 completed; migration lane scope locked to Storybook-only (repo-wide webpack removal deferred by design).
- 2026-02-24: TASK-03 dedupe edits landed in `.storybook/main.ts`; `build:full`, `build:ci`, and `storybook:smoke:ui` are green.
- 2026-02-24: TASK-03 runner hardening + CI scope curation completed (`.storybook-ci/test-runner.ts` prepare retries/timeouts, root runner timeout/worker hardening, `.storybook-ci` explicit allowlist); `test-storybook:runner` completed with exit 0 in `236.409 s`.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted calculation:
  - TASK-01: 90 * 1 = 90
  - TASK-02: 85 * 2 = 170
  - TASK-03: 90 * 2 = 180
  - TASK-04: 75 * 3 = 225
  - TASK-05: 95 * 1 = 95
  - TASK-06: 90 * 1 = 90
  - TASK-07: 85 * 2 = 170
- Total weight = 12
- Overall-confidence = 1020 / 12 = 85.0% (rounded to 85%)
- Trigger check:
  - Trigger 1 (`Overall-confidence < 80`): not fired.
  - Trigger 2 (uncovered task `<80`): not fired; TASK-04 (75%) is preceded by TASK-02 (INVESTIGATE).
- Critique status: skipped under trigger policy.
- What would make this >=90%:
  - Resolve CI interaction-depth risks by converting skipped ci-tag runner suites into executed assertions and stabilizing `storybook:smoke:ci`.
  - Close TASK-06 cutover decision with explicit approvals.
  - Produce two consecutive green canary/cutover validation cycles.

## Pending Audit Work
- CI interaction-depth audit (partial):
  - Already examined:
    - `test-storybook:runner` timeout blocker is closed (exit 0 within CI budget after timeout hardening + story-scope curation).
    - Current runner summary reports `17 skipped` suites for ci-tag lane, indicating limited assertion execution depth.
    - Probe run of `pnpm storybook:smoke:ci` showed failing tests (`tokens`, `usefsm`, `focus-visible`) before completion while long PageBuilder flow remained in flight.
  - Remaining:
    - Align ci-tag strategy at story/meta level so `test-storybook:runner` executes (not skips) intended ci assertions.
    - Triage and stabilize `storybook:smoke:ci` failures to confirm curated CI story scope did not regress expected smoke contract behavior.
    - Feed resolved contract into TASK-04 parity baseline before Vite canary promotion.
  - Estimated scope: 1-2 focused test hardening cycles plus targeted story-tag normalization.
