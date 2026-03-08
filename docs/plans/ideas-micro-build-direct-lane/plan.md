---
Type: Plan
Status: Active
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-micro-build-direct-lane
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: bounded workflow-change implementation; confidence limited by existing unrelated scripts package typecheck debt
Auto-Build-Intent: plan+auto
---

# Ideas Micro-Build Direct Lane Plan

## Summary
Add a canonical direct-build fast lane for trivially bounded ideas by extending dispatch routing, queue metadata, and build contracts. The change keeps atomic idea logging and build controls intact while removing mandatory fact-find/plan overhead for micro work. A follow-up intake seam now classifies bounded UI/code signals into `micro_build_ready` automatically when concrete implementation anchors are available.

## Active tasks
- [x] TASK-01: Add `micro_build_ready` route support in ideas contracts and routing adapter
- [x] TASK-02: Make queue processed/completed metadata route-aware for direct-build packets
- [x] TASK-03: Add direct-build build-contract docs and minimal artifact template
- [x] TASK-04: Run targeted validation and capture remaining blockers
- [x] TASK-05: Auto-classify bounded code signals into the micro-build lane and reflect them in DO-lane metrics

## Goals
- Preserve dispatch-level accuracy.
- Allow direct `lp-do-ideas -> lp-do-build` for truly tiny work.
- Keep validation, build-record, queue completion, and empty-state reflection.

## Non-goals
- Auto-invocation without operator confirmation.
- Reclassifying all fact-find work as micro-builds.

## Inherited Outcome Contract
- **Why:** Tiny executable ideas should avoid unnecessary ceremony, but they still need build controls and queue reconciliation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The ideas workflow can send trivially bounded changes straight to build with a minimal execution contract while keeping queue, validation, and reflection records accurate.
- **Source:** operator

## Tasks

### TASK-01: Add `micro_build_ready` route support
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`, ideas schemas/contracts/docs
- **Confidence:** 88%

### TASK-02: Make queue metadata route-aware
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-audit.ts`
- **Confidence:** 84%

### TASK-03: Add direct-build contract docs
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Status:** Complete (2026-03-06)
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/plans/_templates/micro-build.md`
- **Confidence:** 85%

### TASK-04: Validation and follow-up blockers
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Status:** Complete (2026-03-06)
- **Affects:** targeted scripts tests and validation commands
- **Confidence:** 82%
- **Build evidence:** Targeted ESLint passed on touched scripts/tests. Direct runtime check of `routeDispatch()` for `micro_build_ready -> lp-do-build` succeeded. Full `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` still fails in unrelated pre-existing self-evolving files (`self-evolving-backbone-consume.ts`, `self-evolving-from-build-output.ts`).

### TASK-05: Wire automatic micro-build intake classification
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts`, targeted tests/docs
- **Confidence:** 84%
- **Build evidence:** `runTrialOrchestrator()` now emits `micro_build_ready` for bounded UI/code signals with concrete `location_anchors`, derives a concrete `area_anchor` from the affected surface, and the metrics/queue helpers now count `micro_build_ready` packets as DO-lane work. Filtered TypeScript scan produced no errors in the touched files; only the pre-existing unrelated self-evolving errors remain in the package-level `tsc` run.

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Route and queue seams must evolve together |
| 2 | TASK-03 | TASK-01, TASK-02 | Docs follow settled runtime shape |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Validation after code/docs settle |
