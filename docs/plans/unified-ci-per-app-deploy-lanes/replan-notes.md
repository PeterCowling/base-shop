---
Type: Replan-Notes
Feature-Slug: unified-ci-per-app-deploy-lanes
Replan-round: 2
Created: "2026-03-12"
Last-updated: "2026-03-12"
artifact: replan-notes
---

# Replan Notes

## Scope
- Invocation: `/lp-do-replan unified-ci-per-app-deploy-lanes`
- Extra instruction applied: include rehearsal and critique before reporting readiness
- Targeted tasks:
  - TASK-07 (original 70% Worker staging implementation)
  - TASK-04 and TASK-06 because critique/rehearsal found contract defects in runnable tasks

## Evidence Audit
- `apps/caryina/wrangler.toml`
  - No `[env.preview]` or `[env.staging]` section exists.
- `apps/reception/wrangler.toml`
  - Production-only `[[custom_domains]]`, production D1 binding, and cron triggers exist.
  - No staging environment section exists.
- `apps/business-os/wrangler.toml`
  - Production D1 binding exists.
  - No staging environment section exists.
- `apps/reception/scripts/worker-deploy-safe.mjs`
  - `REQUIRED_FIREBASE_ENV` includes `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.
  - CLI supports `--dry-run`, `--skip-deploy`, `--app-env-file`, and `--root-env-file`.
  - Deploy step hardcodes plain `pnpm exec wrangler deploy`; there is no environment selector for staging.
- `apps/reception/.env.example`
  - Confirms the current build-time Firebase variable set, including `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.
- `docs/secrets.md`
  - Documents preview/staging env files generically.
- Repo search for preview env artifacts / Worker staging topology
  - Only `apps/cms/.env.preview.sops` currently exists in-repo.
  - Existing preview Worker patterns exist elsewhere (`xa-*`, `cochlearfit-worker`), but none are wired for Caryina, Reception, or Business OS.
- `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, `.github/workflows/ci-lighthouse.yml`
  - TASK-06's merge-gate edits are still sound.
  - There is already unrelated LIGHTHOUSE filter drift between the TS source and CJS runtime mirror; the plan should not claim full-file parity as a completion condition for TASK-06.

## Rehearsal Findings
| Task | Finding | Severity | Outcome |
|---|---|---|---|
| TASK-04 | Reception deploy contract omitted `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, so the planned workflow env mapping would fail in `worker-deploy-safe.mjs` | Major | Fixed in plan |
| TASK-06 | Acceptance implied whole-file parity between `filter-config.ts` and `path-classifier.cjs`, but repo evidence only supports merge-gate-scope parity for this task | Moderate | Fixed in plan by narrowing parity scope |
| TASK-07 (original) | Single IMPLEMENT step hid unproven external prerequisites: staging D1 resources, build-time env source, and Reception staging-safe deploy targeting | Major | Replaced with explicit precursor + split implementation tasks |

## Critique Summary
- The original TASK-07 violated the precursor gate from `/lp-do-replan`.
  - The repo does not define the staging resources the task assumed.
  - Reception in particular needs contract work before code edits because its safe deploy wrapper only targets production.
- TASK-04 was buildable, but the Reception env contract was incomplete.
- TASK-06 remained credible after critique, but its validation wording was over-broad.

## Plan Delta Applied
- TASK-04
  - Added `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` to the Reception env contract.
- TASK-06
  - Scoped parity requirements to `MERGE_GATE_FILTER`.
  - Recorded the existing LIGHTHOUSE filter drift as adjacent repo debt, not a release-lane blocker for this task.
- TASK-07
  - Replaced the old 70% IMPLEMENT task with an 85% INVESTIGATE task: define the Worker staging prerequisite contract.
- TASK-08
  - Added a new 80% IMPLEMENT task for Caryina + Business OS staging, dependent on TASK-06 and TASK-07.
- TASK-09
  - Added a new 70% IMPLEMENT task for Reception staging, dependent on TASK-06 and TASK-07.

## Readiness Decision
- Outcome: Partially ready
- Ready after dependencies:
  - TASK-01 through TASK-06
  - TASK-07
  - TASK-08 once TASK-06 and TASK-07 are complete
- Still blocked below threshold:
  - TASK-09
- Why TASK-09 remains below threshold:
  - Reception staging still lacks a resolved safe deploy targeting design.
  - The repo does not yet prove the staging D1 / secret / build-env source contract.
  - A bad resolution here would create either production leakage or a non-runnable staging lane.

## Exact Next Replan Point
- After TASK-07 completes, re-run `/lp-do-replan unified-ci-per-app-deploy-lanes` if the resulting prerequisite artifact changes:
  - the chosen Wrangler env key,
  - the Reception deploy-wrapper design,
  - the staging secret source, or
  - the staging D1 / custom-domain posture.

## Round 2 Delta

### New Evidence
- `.github/workflows/caryina.yml`
  - Already recognizes `promote-app:caryina` in its workflow-level gating logic.
- `.github/workflows/merge-gate.yml`
  - `scopeWorkflowMap` still omitted `caryina`, so a scoped Caryina promotion would be treated as unknown and would not wait for the intended CI workflow.
- Sequence overlap audit
  - TASK-07 was still listing source files as writable `Affects`, which would create false file-overlap serialization against TASK-06, TASK-08, and TASK-09 despite TASK-07 being an artifact-only investigation.

### Round 2 Findings
| Task | Finding | Severity | Outcome |
|---|---|---|---|
| TASK-06 | Caryina promotion scope existed in the workflow but not in merge-gate's `scopeWorkflowMap` | Major | Fixed in plan |
| TASK-07 | Investigate task still looked like a writer because its source files were not marked `[readonly]` | Moderate | Fixed in plan |

### Round 2 Plan Delta
- TASK-06
  - Added `caryina -> ci.yml` to the planned `scopeWorkflowMap` update.
  - Added a Caryina scoped-promotion validation case.
- TASK-07
  - Changed `Affects` so the artifact path is the only write target and all inspected source files are `[readonly]`.
- Sequencing outcome
  - No new dependency edges were needed.
  - Metadata now reflects the correct preference order at the shared TASK-05 boundary: TASK-07 before TASK-06, while both remain parallelizable.
