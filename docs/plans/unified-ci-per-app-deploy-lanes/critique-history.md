---
Type: Critique-History
Feature-Slug: unified-ci-per-app-deploy-lanes
artifact: plan
---

# Critique History

## Fact-Find Critique (prior artifact)

## Round 1

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Critical:** 1
- **Major:** 2
- **Minor:** 0
- **Findings:**
  - Critical (1): auto-pr.yml dispatches brikette.yml by workflow_id — merge-gate is NOT the only consumer of workflow IDs. Removing workflow_dispatch from brikette.yml would break this automation.
  - Major (1): Removing ci.yml paths-ignore would cause ~8 governance jobs to run on every push. CI cost impact was understated.
  - Major (1): H5 staging deploy for caryina/reception/business-os marked high-confidence but wrangler.toml files lack staging/preview environments.
- **Resolution:**
  - Added auto-pr.yml as a workflow-ID consumer throughout the fact-find.
  - Corrected ci.yml paths-ignore analysis to acknowledge governance job overhead.
  - Downgraded H5 confidence and noted wrangler.toml staging config gap.

## Round 2

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Critical:** 0
- **Major:** 3
- **Minor:** 0
- **Findings:**
  - Major (1): Evidence gap summary still said "merge-gate is the only consumer" — internal contradiction with auto-pr.yml documentation.
  - Major (1): Test landscape said CMS/XA tests are "NOT covered" but resolved questions concluded the opposite.
  - Major (1): Task seed "Remove workflow_dispatch from all" conflicted with auto-pr.yml resolved question.
- **Resolution:**
  - Fixed evidence gap summary to include auto-pr.yml.
  - Updated test landscape coverage gaps to reflect turbo --affected covers CMS/XA workspaces.
  - Updated task seed to note auto-pr.yml exception.

## Plan Critique

## Round 1

- **Route:** codemoot
- **Score:** 4/10 (lp_score: 2.0)
- **Verdict:** needs_revision
- **Critical:** 2
- **Major:** 5
- **Minor:** 2
- **Findings:**
  - Critical (1): TASK-06 plans to remove auto-pr.yml dispatch as redundant, but brikette.yml is path-gated — dispatch guarantees merge-gate sees a scoped brikette run.
  - Critical (1): TASK-01 only removes paths-ignore but doesn't address promote-app:* job guards — stated end-state cannot be achieved.
  - Major (5): CI_FILTER missing prime/reception entries; brikette.yml triggers not wired; reception deploy used raw wrangler instead of worker-deploy-safe.mjs; xa-b health check missing staging URL; brikette.yml triggers change without merge-gate awareness.
  - Minor (2): CI_FILTER paths-ignore mismatch; MERGE_GATE_FILTER cleanup note inaccurate.
- **Resolution:**
  - Updated TASK-06 to remove dispatch AND update merge-gate to require ci.yml (not brikette.yml) for brikette scope.
  - Clarified promote-app guards are intentional (validation already ran on dev push).
  - Added CI_FILTER + path-classifier.cjs extension to TASK-01.
  - Updated TASK-04 to use worker-deploy-safe.mjs.
  - Added xa-b staging health check URL.

## Round 2

- **Route:** codemoot
- **Score:** 5/10 (lp_score: 2.5)
- **Verdict:** needs_revision
- **Critical:** 1
- **Major:** 4
- **Minor:** 0
- **Findings:**
  - Critical (1): merge-gate default path (lines 229+) requires per-app workflows via need.* flags. If triggers narrow to staging/main, merge-gate hangs forever on dev/PR.
  - Major (4): Sequencing — brikette trigger change in TASK-01 but merge-gate in TASK-06 creates broken intermediate state; path-classifier.cjs is CJS mirror of filter-config.ts; CMS maps to both cms.yml AND cypress.yml; reception env vars not mapped.
- **Resolution:**
  - Adopted transition strategy: keep per-app triggers on dev/PR during TASK-01-04 (deploy jobs skip via `if:` gate). TASK-06 narrows triggers atomically with merge-gate update.
  - Added path-classifier.cjs to TASK-01 and TASK-06.
  - Preserved cypress.yml for CMS scope in TASK-06 scopeWorkflowMap.
  - Added explicit env var mapping for reception in TASK-04.
  - Reworked TASK-06 to address ALL THREE merge-gate coupling paths.

## Round 3

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Critical:** 0
- **Major:** 3
- **Minor:** 1
- **Findings:**
  - Major (1): Goals section says "ci.yml is sole validation workflow" without noting promote-app:* guard exception.
  - Major (1): TASK-04 consumer tracing claims merge-gate watches reception.yml in default path — only true for scoped promotions.
  - Major (1): TASK-05 checkpoint says "Reception main deploy works via wrangler deploy" but TASK-04 routes through worker-deploy-safe.mjs.
  - Minor (1): Summary table TASK-06 description doesn't match updated body.
- **Resolution:**
  - Added promote-app exception clarification to Goals section.
  - Fixed TASK-04 consumer tracing to note reception.yml is scopeWorkflowMap-only, not default path.
  - Fixed TASK-05 checkpoint to reference worker-deploy-safe.mjs.
  - Updated summary table TASK-06 description, effort, and confidence.

## Round 4

- **Route:** inline replan critique
- **Score:** 7.5/10 (lp_score: 3.75)
- **Verdict:** needs_revision
- **Critical:** 0
- **Major:** 2
- **Minor:** 1
- **Findings:**
  - Major (1): Original TASK-07 violated the precursor gate. The repo does not define Worker staging resources yet, and Reception's safe deploy wrapper cannot target a staging environment.
  - Major (1): TASK-04's Reception env contract omitted `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, so following the plan literally would fail closed in `worker-deploy-safe.mjs`.
  - Minor (1): TASK-06 overstated whole-file parity between `filter-config.ts` and `path-classifier.cjs`; repo evidence supports merge-gate-scope parity for this task, while unrelated LIGHTHOUSE filter drift already exists.
- **Resolution:**
  - Replaced the old TASK-07 with a prerequisite-contract INVESTIGATE task and split Worker staging implementation into TASK-08 (Caryina/Business OS) and TASK-09 (Reception).
  - Added `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` to TASK-04 acceptance and execution details.
  - Narrowed TASK-06 parity language to `MERGE_GATE_FILTER` and recorded the LIGHTHOUSE drift as adjacent debt.

## Round 5

- **Route:** inline replan critique + sequence pass
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** credible
- **Critical:** 0
- **Major:** 1
- **Minor:** 1
- **Findings:**
  - Major (1): `caryina.yml` already recognizes `promote-app:caryina`, but TASK-06's planned `scopeWorkflowMap` update still omitted Caryina. That would leave scoped Caryina promotions ungated.
  - Minor (1): TASK-07 still presented repo source files as writable `Affects`, which would falsely serialize sequencing despite the task only producing an investigation artifact.
- **Resolution:**
  - Added Caryina to TASK-06's planned `scopeWorkflowMap` update and validation contract.
  - Changed TASK-07 `Affects` so the artifact is the only write target and all inspected source files are `[readonly]`.
  - Refreshed sequence metadata so TASK-07 is preferred before TASK-06 at the shared dependency boundary while keeping both in the same execution wave.
