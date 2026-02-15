---
Type: Plan
Status: Active
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: startup-loop-contract-hardening
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Startup Loop Contract Hardening Plan

## Summary
Eliminate contract drift across startup-loop skills, stage-doc API endpoints, on-disk stage-doc filenames, and canonical contract docs. This plan implements a compatibility-window normalization layer (aliases accepted only at API/tooling boundaries), hardens lint/tests to detect drift early, and migrates legacy docs/filenames to canonical forms.

## Goals
- Stage-doc API accepts canonical stage keys and (during a compatibility window) legacy alias `lp-fact-find`, normalizing all writes to canonical `fact-find`.
- Tooling/repo readers treat `fact-finding.user.md` as a temporary legacy alias for `fact-find.user.md` with deterministic precedence.
- Startup-loop contract docs reference real canonical targets (no broken links).
- Startup-loop contract lint becomes a reliable drift gate (catches both API-contract drift and skill/doc reintroduction).

## Non-goals
- Changing the startup-loop stage graph semantics beyond contract hardening (unless required to encode enforceable metadata like `stage_doc_type`).
- Broad refactors of unrelated skills.

## Constraints & Assumptions
- Constraints:
  - Multi-agent compatibility: changes must be migration-safe with a compatibility window and deterministic precedence.
  - StageTypeSchema remains canonical: do not widen the enum to include aliases.
- Assumptions:
  - `docs/business-os/startup-loop/loop-spec.yaml` is canonical for stage graph semantics.
  - `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` StageTypeSchema is canonical for stage-doc keys + filenames.
  - Mutation boundary policy: `/lp-bos-sync` is the sole mutation boundary for board/state mutations (lane transitions/board status), not for stage-doc writes.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-contract-hardening/fact-find.md`
- Planning validations run (evidence):
  - `bash scripts/check-startup-loop-contracts.sh` (FAIL baseline: SQ-02, SQ-12; WARN SQ-10) as of 2026-02-15
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts --maxWorkers=2` (PASS) as of 2026-02-15
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/lane-transitions.test.ts --maxWorkers=2` (PASS) as of 2026-02-15

## Existing System Notes
- Agent API stage-doc enforcement:
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts` (POST body `stage` validates via StageTypeSchema; GET `stage` filter validates)
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` (path `stage` validates via StageTypeSchema)
- StageTypeSchema authority:
  - `packages/platform-core/src/repositories/businessOsStageDocs.server.ts`
- Filesystem stage-doc creation/validation:
  - `apps/business-os/src/lib/lane-transitions.ts` writes/reads `${stage}.{user|agent}.md` (canonical stage keys)
- Current drift sources:
  - `.claude/skills/idea-generate/SKILL.md` uses `lp-fact-find` in stage-doc writes and endpoint paths
  - `.claude/skills/idea-develop/SKILL.md` uses `lp-fact-find` in stage-doc writes
  - `.claude/skills/_shared/stage-doc-operations.md` uses `fact-finding.user.md` and non-canonical schema terminology
- Contract lint:
  - `scripts/check-startup-loop-contracts.sh` (SQ-01..SQ-12)

## Proposed Approach
1. Introduce a **separate normalization layer** (stage key alias mapping) in API/tooling boundaries. StageTypeSchema stays canonical.
2. Make compatibility-window behavior **config-driven**, but **do not rely on runtime filesystem reads** in Next.js route handlers.
   - Canonical source: `docs/business-os/startup-loop/contract-migration.yaml`
   - Runtime source (recommended): build-time embedded generated module `apps/business-os/src/lib/contract-migration.generated.ts`
   - Lint/tooling source: parse the canonical YAML directly
3. Update all emitting callers (skills/docs) to **stop writing legacy aliases**.
4. Add deterministic dual-read for legacy filenames (canonical wins) during the window.
5. Harden lint/tests so drift is caught quickly, and so alias usage telemetry is visible.
6. Timebox and remove legacy support after the window.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add migration config + loader + schema validation for compatibility window | 80% | M | Complete (2026-02-15) | - | TASK-02, TASK-03, TASK-06 |
| TASK-02 | IMPLEMENT | Agent API: accept stage aliases (lp-fact-find) with normalization + telemetry + tests | 84% | M | Complete (2026-02-15) | TASK-01 | TASK-11 |
| TASK-03 | IMPLEMENT | Filesystem stage-doc reader: dual-read legacy fact-finding.user.md with canonical precedence + tests | 80% | M | Complete (2026-02-15) | TASK-01 | TASK-10 |
| TASK-04 | IMPLEMENT | Docs: fix stage-doc helper + canonical filename/key references across core BOS docs | 85% | M | Complete (2026-02-15) | - | TASK-10 |
| TASK-05 | IMPLEMENT | Skills: migrate idea-* stage-doc writes/paths to canonical stage keys; update wording | 85% | M | Pending | - | TASK-06, TASK-11 |
| TASK-06 | IMPLEMENT | Contract lint: detect idea-* alias usage, fact-finding filename references, broken decision refs; allowlist support | 82% | M | Pending | TASK-01, TASK-05, TASK-09 | TASK-11 |
| TASK-07 | IMPLEMENT | Add missing `/lp-bos-sync` skill doc (operator surface) | 90% | S | Complete (2026-02-15) | - | TASK-11 |
| TASK-08 | IMPLEMENT | Fix SQ-12 + SQ-10: lp-experiment stage mapping; lp-seo path topology | 85% | S | Complete (2026-02-15) | - | TASK-11 |
| TASK-09 | IMPLEMENT | Doc reference chain: add markdown shim for sequencing plan + update loop-spec/contract docs; lint check | 85% | M | Pending | - | TASK-06 |
| TASK-10 | IMPLEMENT | Migrate legacy fact-finding docs/links to fact-find (rename + reference updates) | 82% | M | Pending | TASK-03, TASK-04 | TASK-11 |
| TASK-11 | CHECKPOINT | Horizon checkpoint: validate alias usage drop + lint coverage before removing compatibility support | 95% | S | Pending | TASK-02, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Window end (operational): disable aliases + dual-read via config (code path remains for rollback) | 85% | S | Pending | TASK-11 | TASK-13 |
| TASK-13 | IMPLEMENT | Later cleanup (code hygiene): remove dead alias/dual-read code + remove allowlists | 75% ⚠️ | M | Pending | TASK-12 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04, TASK-05, TASK-07, TASK-08, TASK-09 | - | Independent foundation/doc tasks (stop emitting legacy forms early) |
| 2 | TASK-02, TASK-03, TASK-06 | Wave 1: TASK-01 + TASK-05 + TASK-09 | Compatibility work + lint hardening after emitters fixed |
| 3 | TASK-10 | Wave 2: TASK-03 + Wave 1: TASK-04 | Doc/file migration |
| 4 | TASK-11 | Wave 2 + Wave 3 + TASK-07 + TASK-08 | Checkpoint gate |
| 5 | TASK-12 | Wave 4: TASK-11 | Window end: config disables legacy behavior |
| 6 | TASK-13 | Wave 5: TASK-12 | Later cleanup |

**Max parallelism:** 6 (Wave 1)

**Critical path (example):** TASK-01 -> TASK-02 -> TASK-10 -> TASK-11 -> TASK-12 -> TASK-13 (6 waves)

**Total tasks:** 13

## Tasks

### TASK-01: Migration Config + Loader (Compatibility Window)
- **Type:** IMPLEMENT
- **Deliverable:** Canonical YAML + build-time generated runtime config module
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/business-os/startup-loop/contract-migration.yaml`
  - `apps/business-os/scripts/generate-contract-migration.mjs` (build-time generator)
  - `apps/business-os/package.json` (prebuild hook)
  - `apps/business-os/src/lib/contract-migration.generated.ts` (generated; runtime import)
  - `apps/business-os/src/lib/contract-migration.ts` (thin wrapper around generated config)
  - `apps/business-os/src/lib/contract-migration.test.ts`
  - `[readonly] apps/business-os/src/lib/get-repo-root.ts`
  - `[readonly] scripts/check-startup-loop-contracts.sh`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-06
- **Confidence:** 80%
  - Implementation: 80% — existing patterns for config + zod validation; new file is additive.
  - Approach: 85% — config-driven cutoffs avoid hardcoding timelines in code.
  - Impact: 80% — localized; consumers are API + lint.
- **Acceptance:**
  - Define explicit cutoffs with UTC semantics (fields example):
    - `alias_accept_until_utc` (inclusive through 23:59:59Z)
    - `lint_warn_until_utc` (inclusive through 23:59:59Z)
  - Runtime does not depend on `docs/**` filesystem availability (build-time embed).
  - Fail-closed applies to legacy behavior only: if config is missing/invalid, **canonical stage-doc behavior continues**, but alias acceptance + dual-read are disabled.
- **Validation contract:**
  - TC-01: invalid config file (missing required field) → loader returns structured error and legacy behavior defaults fail-closed (aliases/dual-read disabled; canonical stage-doc behavior continues).
  - TC-02: valid config file → loader returns parsed cutoffs and allowlists.
  - Run/verify: `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/contract-migration.test.ts --maxWorkers=2`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Scouts: build-time generator + prebuild hook implemented (no runtime fs dependency).
- **What would make this ≥90%:**
  - Loader unit tests cover missing/invalid config, valid config, and cutoff boundary conditions.
- **Rollout / rollback:**
  - Rollout: ship config with conservative cutoffs; treat missing/invalid config as fail-closed for legacy behavior only.
  - Rollback: remove loader usage and hard-disable alias acceptance.
- **Documentation impact:**
  - Update contract docs to mention config file as the enforcement switch.
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit 0e530b066c; Validation: pnpm --filter @apps/business-os test -- apps/business-os/src/lib/contract-migration.test.ts --maxWorkers=2 (PASS).

### TASK-02: Agent API Alias Acceptance + Normalization + Telemetry
- **Type:** IMPLEMENT
- **Deliverable:** Stage alias normalization in stage-doc endpoints + tests
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts`
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
  - `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts`
  - `[readonly] packages/platform-core/src/repositories/businessOsStageDocs.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-11
- **Confidence:** 84%
  - Implementation: 85% — small pre-parse normalization layer; existing tests cover endpoints.
  - Approach: 85% — keeps StageTypeSchema canonical and makes alias support timeboxed.
  - Impact: 80% — touches API contract; mitigated via tests and telemetry.
- **Acceptance:**
  - During window, `lp-fact-find` is accepted for `stage` (body/path/query) and normalized to `fact-find`.
  - All writes store/use canonical stage (`fact-find`) and canonical `filePath`.
  - When normalization occurs, emit telemetry `bos.stage_alias_used` and optionally response header `x-bos-stage-normalized: lp-fact-find->fact-find`.
  - Deployment invariant: enforce Node runtime for these routes (do not run as edge runtime).
- **Validation contract:**
  - TC-01: POST with canonical `stage=fact-find` → 201 created; persisted stage is `fact-find`.
  - TC-02: POST with alias `stage=lp-fact-find` (within window) → 201 created; persisted stage is `fact-find`; header present.
  - TC-03: GET/PATCH path stage `lp-fact-find` (within window) → 200 OK; operates on `fact-find` record.
  - TC-04: after cutoff, alias stage is rejected → 400 with deterministic error.
  - Run/verify: `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts --maxWorkers=2`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts --maxWorkers=2` (PASS baseline).
  - Unexpected findings: None.
- **What would make this ≥90%:**
  - Add tests for alias stage in body/path/query across all endpoints + verify stored stage/filePath normalization.
- **Rollout / rollback:**
  - Rollout: enable alias acceptance only when config says within window.
  - Rollback: disable alias acceptance; retain canonical behavior.
- **Documentation impact:**
  - Update stage-doc helper docs to reflect canonical keys and the temporary alias window.
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit 40381e9201; Validation: pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts --maxWorkers=2 (PASS 2026-02-15).

### TASK-03: Dual-Read Legacy Filename For Fact-Finding (Filesystem Readers)
- **Type:** IMPLEMENT
- **Deliverable:** Deterministic dual-read for `fact-finding.user.md` as alias for `fact-find.user.md` across all filesystem readers (canonical wins)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/business-os/src/lib/lane-transitions.ts`
  - `apps/business-os/src/lib/lane-transitions.test.ts`
  - `apps/business-os/src/lib/repo-reader.ts`
  - `apps/business-os/src/lib/repo-reader.test.ts`
  - `apps/business-os/src/lib/stage-doc-paths.ts` (new shared resolver)
- **Depends on:** TASK-01
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 80% — small change to existence checks and/or read logic with added tests.
  - Approach: 80% — deterministic precedence avoids split-brain reads.
  - Impact: 80% — localized to stage-doc existence behavior.
- **Acceptance:**
  - If `fact-find.user.md` exists, it is treated as authoritative.
  - If only `fact-finding.user.md` exists, it is treated as satisfying required `fact-find.user.md` during the window.
  - If both exist, canonical is used; legacy presence surfaces a warning signal (log/lint).
- **Validation contract:**
  - TC-01: only canonical exists → stageDocExists returns true.
  - TC-02: only legacy exists (within window) → stageDocExists returns true for fact-find user.
  - TC-03: both exist → canonical chosen; legacy flagged.
  - Run/verify: `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/lane-transitions.test.ts --maxWorkers=2`.
  - Run/verify: `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/repo-reader.test.ts --maxWorkers=2`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/lane-transitions.test.ts --maxWorkers=2` (PASS baseline).
  - Unexpected findings: None.
- **What would make this ≥90%:**
  - Add a regression test fixture that contains both canonical+legacy files and asserts deterministic precedence + warning.
- **Rollout / rollback:**
  - Rollout: dual-read gated by config window.
  - Rollback: revert to canonical-only checks.
- **Documentation impact:** None (covered by TASK-04/TASK-10).
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit d10e4b6ff5; Validation: pnpm --filter @apps/business-os test -- apps/business-os/src/lib/lane-transitions.test.ts --maxWorkers=2 (PASS 2026-02-15); pnpm --filter @apps/business-os test -- apps/business-os/src/lib/repo-reader.test.ts --maxWorkers=2 (PASS 2026-02-15).

### TASK-04: Canonicalize Stage-Doc Helper + Core Docs
- **Type:** IMPLEMENT
- **Deliverable:** Docs updated to reflect canonical stage-doc keys + filenames
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `.claude/skills/_shared/stage-doc-operations.md`
  - `docs/business-os/business-os-charter.md`
  - `docs/business-os/agent-workflows.md`
- **Depends on:** -
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 90% — straightforward doc edits.
  - Approach: 85% — aligns human docs with runtime contracts.
  - Impact: 85% — reduces future drift.
- **Acceptance:**
  - Replace `fact-finding.user.md` with `fact-find.user.md` references (and similarly align plan/build/reflect filenames).
  - Fix helper schema terminology to match actual frontmatter (`Type: Stage`, `Stage: fact-find|plan|build|reflect`).
- **Validation contract:**
  - TC-01: contract lint flags any remaining `fact-finding.user.md` references outside migration allowlist.
  - Run/verify: `bash scripts/check-startup-loop-contracts.sh`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `rg -n "fact-finding\\.user\\.md" docs/business-os` (baseline matches exist).
- **What would make this ≥90%:**
  - Land TASK-06 lint enforcement so doc drift cannot re-enter.
- **Rollout / rollback:**
  - Rollout: doc-only.
  - Rollback: revert doc edits.
- **Documentation impact:** None.
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit 0ef305950f.

### TASK-05: Skills Stop Writing Legacy Stage Keys (idea-*)
- **Type:** IMPLEMENT
- **Deliverable:** idea-* skills use canonical `fact-find` stage-doc type and canonical stage-doc endpoints
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `.claude/skills/idea-generate/SKILL.md`, `.claude/skills/idea-develop/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-11
- **Confidence:** 85%
  - Implementation: 85% — doc-only changes; update examples + instructions.
  - Approach: 90% — removes root-cause drift.
  - Impact: 80% — impacts agent behavior; mitigated by compatibility window.
- **Acceptance:**
  - No stage-doc writes use `lp-fact-find`.
  - No stage-doc endpoint paths use `/lp-fact-find`.
- **Validation contract:**
  - TC-01: contract lint fails if `.claude/skills/idea-*` contains stage-doc writes with `lp-fact-find`.
  - Run/verify: `bash scripts/check-startup-loop-contracts.sh`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `rg -n "\\\"stage\\\": \\\"lp-fact-find\\\"" -S .claude/skills` (baseline offenders identified in fact-find inventory).
- **What would make this ≥90%:**
  - Extend contract lint (TASK-06) and ensure it is green after skill edits.
- **Rollout / rollback:**
  - Rollout: doc-only.
  - Rollback: revert doc edits; rely on API alias acceptance temporarily.
- **Documentation impact:** None.

### TASK-06: Contract Lint Expansion (Prevent Reintroduction)
- **Type:** IMPLEMENT
- **Deliverable:** Deterministic contract lint that can parse YAML + timeboxes without shell toolchain dependencies
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `scripts/src/check-startup-loop-contracts.ts` (new; YAML parsing, allowlists, cutoffs)
  - `scripts/check-startup-loop-contracts.sh` (wrapper)
- **Depends on:** TASK-01, TASK-05, TASK-09
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Implementation: 85% — bash lint extensions with clear patterns.
  - Approach: 80% — makes lint authoritative for the drift classes we are fixing.
  - Impact: 82% — could create false positives; mitigated via allowlist + self-test mode.
- **Acceptance:**
  - Lint fails on `"stage": "lp-fact-find"` in `.claude/skills/idea-*` stage-doc writes.
  - Lint fails on `fact-finding.user.md` references outside temporary allowlist.
  - Lint fails when `docs/plans/lp-skill-system-sequencing-plan.md` decision reference is missing.
  - Allowlist mechanism exists and is timeboxed/removed in TASK-13.
- **Validation contract:**
  - TC-01: `scripts/check-startup-loop-contracts.sh --self-test` covers new checks.
  - TC-02: baseline run flags violations in known offenders before fixes.
  - Run/verify: `bash scripts/check-startup-loop-contracts.sh --self-test`.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `bash scripts/check-startup-loop-contracts.sh` (FAIL baseline: SQ-02, SQ-12; WARN SQ-10).
- **What would make this ≥90%:**
  - Add `--self-test` coverage for each new check and ensure it fails on a controlled fixture, passes after fixes.
- **Rollout / rollback:**
  - Rollout: land lint changes after offenders are fixed in same PR set.
  - Rollback: revert new checks or widen allowlist temporarily.
- **Documentation impact:** Update lint README/comments in script.

### TASK-07: Add Missing /lp-bos-sync Skill Doc
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-bos-sync/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `.claude/skills/lp-bos-sync/SKILL.md`, `[readonly] scripts/src/startup-loop/bos-sync.ts`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 90%
  - Implementation: 90% — doc creation.
  - Approach: 90% — clarifies operator mutation boundary.
  - Impact: 90% — fixes SQ-02 lint failure.
- **Acceptance:**
  - Contract lint SQ-02 passes.
  - Skill doc explicitly scopes mutations (board/state only) and references implementation script.
- **Validation contract:**
  - TC-01: `bash scripts/check-startup-loop-contracts.sh` no longer fails SQ-02.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** doc-only.
- **Documentation impact:** None.
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit dfe60da1bf; Validation: `bash scripts/check-startup-loop-contracts.sh` (SQ-02 cleared; remaining: FAIL SQ-12, WARN SQ-10 as of 2026-02-15).

### TASK-08: Fix SQ-12 + SQ-10 (lp-experiment + lp-seo)
- **Type:** IMPLEMENT
- **Deliverable:** bring lint SQ-12 fail and SQ-10 warn to green
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `.claude/skills/lp-experiment/SKILL.md`, `.claude/skills/lp-seo/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 85%
  - Implementation: 85% — doc edits.
  - Approach: 85% — aligns semantics/path topology.
  - Impact: 85% — makes lint reliable.
- **Acceptance:**
  - SQ-12 passes (lp-prioritize mapped to S5A, not S3).
  - SQ-10 warning removed or justified with updated path patterns.
- **Validation contract:**
  - TC-01: `bash scripts/check-startup-loop-contracts.sh` has no SQ-12 fail and no SQ-10 warn.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** doc-only.
- **Documentation impact:** None.
- **Status:** Complete (2026-02-15)
- **Build evidence:** Commit 1fca258186; Validation: `bash scripts/check-startup-loop-contracts.sh` (PASS 2026-02-15).

### TASK-09: Fix Broken Decision References (Stable Markdown Shim)
- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/lp-skill-system-sequencing-plan.md` exists and contract docs reference it
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/plans/lp-skill-system-sequencing-plan.md` (new shim)
  - `docs/business-os/startup-loop/loop-spec.yaml`
  - `docs/business-os/startup-loop/autonomy-policy.md`
  - `docs/business-os/startup-loop/manifest-schema.md`
  - `docs/business-os/startup-loop/event-state-schema.md`
  - `docs/business-os/startup-loop/stage-result-schema.md`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — doc edits + new file.
  - Approach: 85% — stable reference path avoids archive churn.
  - Impact: 85% — removes trust-breaking broken links.
- **Acceptance:**
  - All references to `docs/plans/lp-skill-system-sequencing-plan.md` resolve.
  - A policy note exists in the shim describing canonical reference behavior.
- **Validation contract:**
  - TC-01: lint check added in TASK-06 verifies referenced targets exist.
  - Run/verify: `bash scripts/check-startup-loop-contracts.sh` (after TASK-06).
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `rg -n "lp-skill-system-sequencing-plan\\.md" docs/business-os/startup-loop` (baseline references exist).
- **What would make this ≥90%:**
  - Add lint coverage (TASK-06) that fails on broken decision_reference targets.
- **Rollout / rollback:** doc-only.
- **Documentation impact:** None.

### TASK-10: Migrate Legacy Fact-Finding Filename References + File Rename
- **Type:** IMPLEMENT
- **Deliverable:** migrate `fact-finding.user.md` to `fact-find.user.md` on disk and in references
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/business-os/cards/BRIK-ENG-0020.user.md`
  - `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md` (rename)
  - `docs/registry.json` (if it tracks the old path)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Implementation: 85% — small scoped rename + reference update.
  - Approach: 80% — migration eliminates split-brain.
  - Impact: 82% — minimal blast radius (single known file); dual-read provides safety.
- **Acceptance:**
  - Canonical file exists at `docs/business-os/cards/BRIK-ENG-0020/fact-find.user.md`.
  - No remaining references to `fact-finding.user.md` in non-archived canonical docs.
- **Validation contract:**
  - TC-01: `rg -n "fact-finding\\.user\\.md" docs/business-os` returns 0 (or only migration note, if retained).
  - TC-02: `bash scripts/check-startup-loop-contracts.sh` passes new filename checks (after TASK-06).
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `find docs -name fact-finding.user.md -print` (baseline shows at least one file).
- **What would make this ≥90%:**
  - Prove migration via tests (TASK-03) + lint (TASK-06) with no allowlist needed.
- **Rollout / rollback:**
  - Rollout: rename with git mv; keep dual-read during window.
  - Rollback: revert rename; retain dual-read.
- **Documentation impact:** None.

### TASK-11: Horizon Checkpoint (Pre-Removal Verification)
- **Type:** CHECKPOINT
- **Depends on:** TASK-02, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 95%
- **Acceptance:**
  - Re-run contract lint and confirm:
    - SQ-02 fixed, SQ-12 fixed, SQ-10 addressed
    - New alias/filename checks are green
  - Search for remaining legacy usage:
    - `rg -n "lp-fact-find" .claude/skills` is limited to migration notes only
    - `rg -n "fact-finding\\.user\\.md" docs/business-os` is 0 or explicitly allowlisted
  - Confirm API telemetry surfaces alias usage (if any) and that it is trending to zero.
  - Run downstream consumer tests:
    - `pnpm --filter @acme/mcp-server test:startup-loop`
    - `pnpm --filter @acme/platform-core test -- packages/platform-core/src/repositories/__tests__/businessOsOther.server.test.ts`
- **Horizon assumptions to validate:**
  - No remaining callers depend on alias stage keys.
  - Dual-read covers any remaining legacy files without ambiguity.

### TASK-12: Window End (Operational Disable Via Config)
- **Type:** IMPLEMENT
- **Deliverable:** disable alias acceptance + dual-read via config cutoffs (keep code for rollback)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `docs/business-os/startup-loop/contract-migration.yaml`
- **Depends on:** TASK-11
- **Blocks:** TASK-13
- **Confidence:** 85%
  - Implementation: 90% — config-only change.
  - Approach: 85% — operationally reversible.
  - Impact: 85% — minimal blast radius.
- **Acceptance:**
  - Alias acceptance is disabled by cutoff.
  - Dual-read is disabled by cutoff.
  - Rollback is config-only within the stabilization period.
- **Validation contract:**
  - TC-01: contract lint is fully green with no warns.
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Gate: TASK-11 checkpoint must show alias usage at (or near) zero before proceeding.
- **What would make this ≥90%:**
  - Capture a week of zero alias telemetry (or equivalent evidence) and remove all allowlists.
- **Rollout / rollback:**
  - Rollout: only after checkpoint confirms alias usage is zero.
  - Rollback: adjust cutoffs in config while remediating stragglers.
- **Documentation impact:** Update compatibility window policy section in docs.

### TASK-13: Later Cleanup (Remove Dead Code)
- **Type:** IMPLEMENT
- **Deliverable:** remove alias/dual-read code paths + remove allowlists after stabilization period
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts`
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
  - `apps/business-os/src/lib/lane-transitions.ts`
  - `apps/business-os/src/lib/repo-reader.ts`
  - `scripts/src/check-startup-loop-contracts.ts`
  - `scripts/check-startup-loop-contracts.sh`
- **Depends on:** TASK-12
- **Blocks:** -
- **Confidence:** 75% ⚠️
  - Implementation: 80% — deletion work is straightforward but must be coordinated with stability evidence.
  - Approach: 75% — timing depends on operational readiness.
  - Impact: 75% — removing rollback lever is irreversible without revert.
- **Acceptance:**
  - API rejects alias stages unconditionally (no code path).
  - Filesystem readers do not dual-read legacy filenames.
  - Lint has no allowlists and fails on any legacy reintroduction.
- **Validation contract:**
  - TC-01: API tests updated for post-cleanup behavior.
  - TC-02: contract lint is fully green with no warns.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: only after stability period following TASK-12.
  - Rollback: revert commit/PR.

## Risks & Mitigations
- Risk: hidden callers still depend on alias stage keys.
  - Mitigation: TASK-06 lint expansion + TASK-11 checkpoint + API telemetry.
- Risk: doc churn in archives creates noisy lint failures.
  - Mitigation: timeboxed allowlists scoped to archives/fixtures only.
- Risk: config parsing introduces new dependency risk.
  - Mitigation: explicit dependency management; loader schema + tests.

## Observability
- Logging: structured log event `bos.stage_alias_used` on normalization.
- Headers: optional `x-bos-stage-normalized` for operator visibility.

## Acceptance Criteria (overall)
- [ ] `bash scripts/check-startup-loop-contracts.sh` passes with 0 warnings.
- [ ] Stage-doc API accepts aliases during the window and normalizes to canonical; rejects after window end.
- [ ] No skills emit legacy stage keys for writes.
- [ ] Canonical contract docs references resolve.

## Decision Log
- 2026-02-15: Chose alias-and-migrate with config-driven cutoffs and deterministic precedence (canonical wins).
- 2026-02-15: Clarified mutation boundary: `/lp-bos-sync` governs board/state mutations, not stage-doc writes.
