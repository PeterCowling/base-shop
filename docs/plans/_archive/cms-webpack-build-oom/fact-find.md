---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: cms-webpack-build-oom
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/_archive/cms-webpack-build-oom/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
Audit-Ref: working-tree
direct-inject: true
direct-inject-rationale: User requested a separate /lp-do-fact-find artifact focused on recurring CMS webpack build OOM failures.
---

# CMS Webpack Build OOM Fact-Find Brief

## Scope
### Summary
This fact-find isolates the recurring `@apps/cms` webpack build out-of-memory failure from the broader Turbopack migration thread. The goal is to produce planning-grade evidence for why `pnpm --filter @apps/cms build` is still failing in current conditions and define executable mitigation tracks.

### Goals
- Confirm current reproducibility of CMS webpack OOM with exact command variants.
- Map configuration and build-graph factors that materially contribute to memory pressure.
- Produce planning-ready mitigation hypotheses with explicit validation contracts.

### Non-goals
- Implementing OOM fixes in this run.
- Replanning the full Turbopack migration end-to-end.
- Migrating Storybook or other non-CMS build surfaces.

### Constraints & Assumptions
- Constraints:
  - `@apps/cms` build script is explicitly webpack-pinned: `next build --webpack`.
  - Current validation run expectations in turbopack migration still include a representative CMS build probe.
  - Prior CMS OOM work is archived under Next 16 upgrade planning; new work must not contradict known historical evidence.
- Assumptions:
  - The OOM is a build-graph/memory-pressure issue, not a transient shell failure.
  - Existing alias/cache behavior in `apps/cms/next.config.mjs` is intentional and cannot be dropped blindly for memory relief.

## Evidence Audit (Current State)
### Entry Points
- `apps/cms/package.json` - authoritative build command surface.
- `apps/cms/next.config.mjs` - webpack/turbopack config and memory-related build settings.
- `docs/plans/turbopack-full-migration/plan.md` - current blocking status for CMS validation in active migration tasking.
- `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` - callback parity and validation outcomes from current run.
- `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md` - historical OOM baseline and prior mitigation attempts.

### Key Modules / Files
- `apps/cms/package.json` - `build` remains `next build --webpack`; `dev` and `dev:debug` also webpack-pinned.
- `apps/cms/next.config.mjs` - sets `experimental.cpus` via `NEXT_BUILD_CPUS` (default `2`), adds large alias and transpilation surfaces, applies custom webpack callback logic.
- `apps/cms/next.config.mjs` - `serverExternalPackages` includes `typescript` to reduce bundling pressure from theme token loader paths.
- `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` - records 2026-02-23 CMS build failures under default, 8GB heap, and 8GB+cpus=1 variants.
- `docs/plans/turbopack-full-migration/plan.md` - TASK-07 remains pending with explicit `CMS validation blocker` status.
- `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md` - historical evidence that CMS OOM persisted at 8GB and 16GB heap under Next 16 webpack builds.

### Patterns & Conventions Observed
- CMS build path is intentionally webpack-bound today (script-level), so OOM is currently tied to webpack compilation rather than Turbopack execution.
- Historical and current evidence converge: increasing heap and reducing build workers has not eliminated OOM in this environment.
- CMS `next.config.mjs` carries high-complexity webpack behavior (hash guard, filesystem cache, extensive aliasing, runtime dependency alias repair) that increases migration/change risk.
- Inference: “more heap only” is not sufficient; either build graph must shrink further, build execution environment must change, or webpack path must be reduced/replaced for CMS.

### Data & Contracts
- Build command contract:
  - `pnpm --filter @apps/cms build` -> `next build --webpack`.
- Config contract:
  - `NEXT_BUILD_CPUS` controls `experimental.cpus` (default `2`).
  - `serverExternalPackages` includes memory-relevant packages (including `typescript`).
- Active migration contract:
  - CMS representative build probe is part of TASK-07 validation in `docs/plans/turbopack-full-migration/plan.md`.

### Dependency & Impact Map
- Upstream dependencies:
  - `apps/cms/package.json`
  - `apps/cms/next.config.mjs`
  - shared next preset (`@acme/next-config`).
- Downstream dependents:
  - Turbopack full migration TASK-07/TASK-08 sequencing.
  - Any CI/job invoking CMS webpack build.
- Likely blast radius:
  - Memory-focused config changes can affect alias resolution, server/client package behavior, and build determinism.
  - Validation gates in migration plans remain blocked if CMS build probe cannot complete.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | CMS webpack build OOM remains reproducible in current repo state and is not fixed by 8GB heap or reduced CPU workers. | Stable local env + command reruns | Low | Medium |
| H2 | Memory pressure is distributed across many compilation units (no single unit accounts for >50% of peak heap), requiring graph-breadth reduction rather than targeted single-unit fixes. | Build profiling + graph analysis | Medium | Medium |
| H3 | Hard-blocker policy is now explicit for CMS, and dependent migration artifacts must stay aligned to that contract. | Plan/task contract consistency checks | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Three failing variants on 2026-02-23 (`default`, `8GB`, `8GB+cpus=1`) all abort with Node OOM/SIGABRT. | `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` | High |
| H2 | Historical Next 16 spike showed OOM persisting through 8GB/16GB and transpile-package reduction attempts. | `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md` | Medium-High |
| H3 | CMS build remains an active migration blocker and is explicitly governed as a hard blocker in the dedicated mitigation lane. | `docs/plans/turbopack-full-migration/plan.md`, `docs/plans/_archive/cms-webpack-build-oom/plan.md` | High |

#### Falsifiability Assessment
- Easy to test:
  - Repro matrix for CMS build command variants.
  - Contract alignment checks for blocker handling across dependent migration plans.
- Hard to test:
  - Root-cause attribution without heap/profile artifacts.
- Validation seams needed:
  - Webpack profile/heap snapshots tied to a single reproducible command.
  - Controlled A/B builds with selective graph reductions.

#### Recommended Validation Approach
- Quick probes:
  - Reconfirm default build failure once per major config change.
  - Keep `NEXT_BUILD_CPUS` + heap variants as standardized probes.
- Structured tests:
  - Add one profiling spike that captures webpack profile + Node heap usage during CMS build.
  - Compare memory envelope before/after any graph-reduction experiment.
- Deferred validation:
  - CI hardware upgrade path (if chosen) should be validated only after local profile results are recorded.

### Test Landscape
#### Test Infrastructure
- Build command: `pnpm --filter @apps/cms build`
- Variant probes used in current run:
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`
  - `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CMS build success/failure | Manual integration probe | `apps/cms/package.json` build command | No stable automated memory-budget test; failures observed via build runs |
| Historical mitigation evidence | Fact-find artifact | `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md` | Includes prior OOM experiments and partial mitigations |
| Active migration validation linkage | Plan task contract | `docs/plans/turbopack-full-migration/plan.md` | CMS probe currently blocks TASK-07 completion |

#### Coverage Gaps
- No current heap/profile artifact from 2026-02-23 run.
- Hard-blocker pass/fail policy is defined, but no fresh profiled memory-envelope baseline exists for this lane.
- Dedicated mitigation plan exists (`docs/plans/_archive/cms-webpack-build-oom/plan.md`), but TASK-01 profiling artifact is still pending.

## Questions
### Resolved
- Q: Is CMS OOM still present in current migration run?
  - A: Yes. `pnpm --filter @apps/cms build` failed repeatedly with Node heap OOM (`SIGABRT`) on 2026-02-23.
  - Evidence: `docs/plans/turbopack-full-migration/plan.md`, `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`.

- Q: Does simply increasing heap to 8GB solve it?
  - A: No.
  - Evidence: `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` and historical `docs/plans/archive/nextjs-16-upgrade/build-oom-notes.md`.

- Q: Does reducing build workers to `NEXT_BUILD_CPUS=1` solve it (with 8GB heap)?
  - A: No.
  - Evidence: `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`.

- Q: What gate policy should CMS build have for turbopack migration?
  - A: **Hard blocker** — CMS build must pass before TASK-07 completes. The OOM fix is on the critical path for the turbopack migration.
  - Decision: Option A hard-blocker policy selected on 2026-02-23 (input source: user decision), recorded in `docs/plans/_archive/cms-webpack-build-oom/plan.md` TASK-03.

### Open (User Input Needed)
- None.

## Confidence Inputs
- Implementation: 82%
  - Basis: Repro evidence is current and consistent with historical data.
  - Raise to >=80: already met.
  - Raise to >=90: capture fresh heap/profile artifacts from one instrumented CMS build run.
- Approach: 83%
  - Basis: Mitigation shape is clear and now sequenced in a dedicated plan with hard-blocker policy already decided.
  - Raise to >=80: already met.
  - Raise to >=90: complete TASK-04 with a measured mitigation delta and checkpoint reassessment.
- Impact: 85%
  - Basis: CMS OOM currently blocks active migration task completion and affects release confidence.
  - Raise to >=80: already met.
  - Raise to >=90: quantify blast radius in CI by enumerating all workflows that require hard CMS build success.
- Delivery-Readiness: 82%
  - Basis: Dedicated execution plan exists and blocker policy is explicitly recorded.
  - Raise to >=80: already met.
  - Raise to >=90: complete TASK-01 profiling artifact and TASK-04 mitigation slice with checkpoint evidence.
- Testability: 74%
  - Basis: Reproduction is easy; diagnosis protocol is planned but not yet instrumented with fresh artifacts.
  - Raise to >=80: complete TASK-01 profiling instrumentation and artifact capture path.
  - Raise to >=90: automated regression check (or deterministic profiling protocol) proving memory envelope changes.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Migration task deadlock under hard-blocker policy if mitigation progress stalls | High | High | Keep checkpoint/replan escalation explicit in plan sequencing and gate-contract updates. |
| Over-focusing on heap flags and missing graph-level root causes | Medium | High | Require one profiling spike before further heuristic tuning. |
| Regressing CMS alias/runtime behavior while attempting memory reductions | Medium | High | Keep parity checklist for aliases/fallbacks and validate representative CMS routes after each change. |
| Repeating historical experiments without net-new signal | Medium | Medium | Start from archived OOM notes and define only net-new experiments. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Treat `apps/cms/next.config.mjs` webpack callback behavior as high-risk surface; change incrementally.
  - Keep new OOM work decoupled from unrelated app migration changes.
- Rollout/rollback expectations:
  - Any mitigation should be applied in one narrow slice at a time with immediate build probe and documented rollback command.
- Observability expectations:
  - Persist command variants, elapsed time, and failure mode in plan artifacts for each mitigation attempt.

## Suggested Task Seeds (Non-binding)
- INVESTIGATE-01: Complete TASK-01 profiler artifact (`docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`) with command matrix and heap/profile pointers.
- INVESTIGATE-02: Complete TASK-02 build-surface matrix to enumerate all hard-blocker consumers.
- IMPLEMENT-01: Execute TASK-04 bounded graph-reduction mitigation slice and rerun standardized probe matrix against baseline.
- CHECKPOINT-01: Execute TASK-05 checkpoint and recalculate confidence dimensions using mitigation evidence deltas.
- IMPLEMENT-02: Execute TASK-06 updates in dependent migration docs to align with the validated hard-blocker contract.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `none`
- Deliverable acceptance package:
  - Dedicated plan with reproducible mitigation steps and pass/fail criteria.
- Post-delivery measurement plan:
  - Compare OOM incidence and peak heap behavior across fixed probe commands per mitigation iteration.

## Evidence Gap Review
### Gaps Addressed
- Converted scattered evidence (historical OOM notes + current migration blocker logs) into a single planning artifact.
- Captured dedicated mitigation plan and recorded blocker-policy decision (**hard blocker**) in `docs/plans/_archive/cms-webpack-build-oom/plan.md` TASK-03 (2026-02-23).

### Confidence Adjustments
- Delivery-Readiness is now above 80 after dedicated plan creation and policy decision capture.
- Testability remains below 80 because fresh profiling artifacts are still pending.

### Remaining Assumptions
- Assumes current local environment class is representative of dev validation constraints.
- Assumes archived Next 16 OOM evidence remains materially relevant to current CMS build graph.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None hard-blocking. Note: Testability (74%) remains below 80%. Plan execution should begin with profiling capture (TASK-01) before mitigation implementation.
- Recommended next step:
  - Execute `docs/plans/_archive/cms-webpack-build-oom/plan.md` via `/lp-do-build`, starting at TASK-01.
