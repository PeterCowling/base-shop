---
Type: Plan
Status: Complete
Domain: Infra
Last-reviewed: 2026-02-20
Relates-to-charter: none
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: turbopack-i18n-alias-retirement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall = effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Turbopack i18n Alias Retirement Plan

## Summary
This plan executes step 1 of the Brikette production-build Turbopack migration by removing the shared webpack `@acme/i18n` alias dependency. Brikette already has app-local Turbopack alias wiring and a passing Turbopack production build baseline; the remaining blocker is shared resolver contract drift around i18n source-vs-dist resolution. The plan adopts a dist-only consumer contract for `@acme/i18n`, normalizes app mappings that still prefer `src`, adds a durable resolver-contract validation harness, and then removes the shared webpack alias. Remaining webpack callback migration rows (`extensionAlias`, shared source aliases, `node:*`) stay explicitly out of scope for this pass. Separately, `scripts/check-next-webpack-flag.mjs` still enforces `--webpack` for Brikette `build`; updating that policy is a prerequisite for the later step that actually drops `--webpack` from deploy workflows, and is out of scope here. Build evidence on 2026-02-20 showed template-app webpack resolution still fails immediately when the shared alias is removed, so this replan adds a formal precursor investigation before retrying TASK-04.

## Goals
- Retire shared webpack alias `@acme/i18n -> ../i18n/dist` in `packages/next-config/next.config.mjs`.
- Standardize `@acme/i18n` consumer mapping on a dist-only/dist-first contract.
- Add a resolver-contract validation harness that covers webpack, Turbopack, and Node runtime imports.
- Decide and finalize Brikette i18n mapping state after normalization (remove override if redundant; keep only with explicit rationale).
- Document the final i18n contract and guardrails so future migrations do not reintroduce alias debt.

## Non-goals
- Migrating all remaining webpack callback entries in this pass.
- Switching Brikette deploy workflow from `next build --webpack` to `next build` in this plan.
- Changing `check-next-webpack-flag` Brikette `build` policy from `RULE_REQUIRE_WEBPACK` to `RULE_ALLOW_ANY`.
- Refactoring i18n message content or translation behavior.

## Constraints & Assumptions
- Constraints:
  - Shared alias with break-warning is currently present in `packages/next-config/next.config.mjs`.
  - Workspace currently has known i18n import-specifier churn risk; baseline must be stabilized before alias retirement.
  - Brikette deploy workflow still uses webpack build in `.github/workflows/brikette.yml`.
  - Repo policy enforcer `scripts/check-next-webpack-flag.mjs` is wired in both `scripts/validate-changes.sh` and `.github/workflows/merge-gate.yml` and currently requires `--webpack` for Brikette `build`; this plan must integrate alongside it.
- Assumptions:
  - Dist-only consumer contract is the selected long-term direction for this pass.
  - Existing Brikette Turbopack production build pass indicates CI/deploy mechanics are not the current blocker.
  - Resolver-contract automation should be introduced before alias removal to keep rollback quick and deterministic.

## Fact-Find Reference
- Related brief: `docs/plans/turbopack-i18n-alias-retirement/fact-find.md`
- Key findings used:
  - `apps/brikette/next.config.mjs` already mirrors app-local aliases in `turbopack.resolveAlias`.
  - Brikette Turbopack production build baseline (`next build` without `--webpack`) is currently passing.
  - Shared alias still exists and is the load-bearing blocker for template-app compatibility.
  - App-level i18n mapping is mixed (`dist-only` and `src+dist`), requiring normalization before alias retirement.

## Proposed Approach
- Option A: keep shared webpack alias and continue app-local exceptions.
  - Pros: minimal immediate change.
  - Cons: preserves debt and blocks clean Turbopack migration sequencing.
- Option B: lock dist-only i18n consumer contract, add resolver harness, remove shared alias, then finalize app-level mapping state.
  - Pros: aligns all resolver surfaces and removes a known long-term blocker.
  - Cons: requires coordinated config and validation updates across multiple apps.
- Chosen approach:
  - **Option B** with incremental sequencing and a checkpoint before Brikette override finalization.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (all executable tasks complete)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Stabilize i18n source baseline before alias retirement | 85% | M | Complete (2026-02-20) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Normalize i18n consumer mappings for source+dist apps | 85% | M | Complete (2026-02-20) | TASK-01 | TASK-09, TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Add resolver-contract validation harness (webpack + Turbopack + Node) | 85% | M | Complete (2026-02-20) | TASK-01 | TASK-09, TASK-04 |
| TASK-09 | INVESTIGATE | Diagnose template-app webpack resolver failure without shared i18n alias | 75% | S | Complete (2026-02-20) | TASK-02, TASK-03 | TASK-04 |
| TASK-04 | IMPLEMENT | Remove shared webpack i18n alias from `@acme/next-config` | 85% | M | Complete (2026-02-20) | TASK-02, TASK-03, TASK-09 | TASK-05 |
| TASK-05 | CHECKPOINT | Horizon checkpoint after alias removal | 95% | S | Complete (2026-02-20) | TASK-04 | TASK-06 |
| TASK-06 | INVESTIGATE | Prove whether Brikette i18n tsconfig override is now redundant | 75% | S | Complete (2026-02-20) | TASK-02, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Apply Brikette final i18n mapping decision from TASK-06 | 85% | S | Complete (2026-02-20) | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Document final i18n resolver contract and migration guardrails | 85% | S | Complete (2026-02-20) | TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Baseline freeze is prerequisite for contract work |
| 2A | TASK-02 | TASK-01 | App and shared tsconfig normalization |
| 2B | TASK-03 | TASK-01 | Harness can be built in parallel with mapping normalization |
| 3 | TASK-09 | TASK-02, TASK-03 | Resolve template-app webpack alias-removal failure before retry |
| 4 | TASK-04 | TASK-02, TASK-03, TASK-09 | Alias removal retry only after precursor evidence is complete |
| 5 | TASK-05 | TASK-04 | Checkpoint validates downstream assumptions |
| 6 | TASK-06 | TASK-02, TASK-05 | Override redundancy probe requires normalized baseline |
| 7 | TASK-07 | TASK-06 | Implement selected Brikette mapping state |
| 8 | TASK-08 | TASK-07 | Docs finalize after code contract is settled |

## Tasks

### TASK-01: Stabilize i18n source baseline before alias retirement
- **Type:** IMPLEMENT
- **Deliverable:** baseline-freeze artifact + stable i18n package state (`docs/plans/turbopack-i18n-alias-retirement/artifacts/i18n-baseline-freeze.md`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `packages/i18n/src/index.ts`, `packages/i18n/src/locales.ts`, `packages/i18n/src/fallbackChain.ts`, `packages/i18n/src/*.ts`, `[readonly] packages/i18n/dist/index.js`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% - baseline stabilization is deterministic once disposition (land or revert) is applied explicitly.
  - Approach: 85% - decouples alias retirement from unrelated in-flight churn.
  - Impact: 90% - prevents false regressions in all downstream resolver probes.
- **Acceptance:**
  - i18n source specifier disposition is explicit (landed or reverted) and captured with commit SHA(s) in the artifact.
  - `pnpm --filter @acme/i18n build` exits 0 from clean baseline.
  - Node probes from `packages/template-app` succeed for both `@acme/i18n` and `@acme/i18n/locales` imports.
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter @acme/i18n build` -> exits 0.
  - TC-02: `cd packages/template-app && node -e "import('@acme/i18n').then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })"` -> exits 0.
  - TC-03: `cd packages/template-app && node -e "import('@acme/i18n/locales').then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })"` -> exits 0.
- **Execution plan:**
  1. Capture current `packages/i18n/src/*` delta and decide disposition (land or revert) as baseline freeze.
  2. Apply disposition in one isolated change and record exact SHAs in the artifact.
  3. Rebuild `@acme/i18n` and run root/subpath Node probes.
  4. Gate TASK-02/TASK-03 start on green probes.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @acme/i18n build`
    - Node probes from `packages/template-app` for root + `locales`.
  - Validation artifacts:
    - `docs/plans/turbopack-i18n-alias-retirement/fact-find.md` (Node import failure diagnosis section).
  - Unexpected findings:
    - Fact-find captured extensionless relative imports in `dist/index.js` during in-flight edits; baseline freeze task exists to eliminate that ambiguity.
- **Scouts:** `None: uncertainty is execution-state stabilization, not architecture discovery`
- **Edge Cases & Hardening:**
  - If baseline freeze lands source changes, verify emitted dist specifiers remain Node ESM-resolvable.
  - If TC-02 or TC-03 fail with extensionless imports in `dist` (for example `ERR_MODULE_NOT_FOUND` on `dist/fallbackChain`), recover by restoring `.js` specifiers in i18n source (or equivalent emit configuration that produces fully specified ESM imports), rebuild, and re-run probes before proceeding.
  - If baseline freeze reverts source changes, ensure revert does not discard unrelated intentional i18n feature work.
- **What would make this >=90%:**
  - Add a small CI probe that asserts Node import viability for `@acme/i18n` on every i18n package change.
- **Rollout / rollback:**
  - Rollout: land baseline-freeze change separately before alias-removal work.
  - Rollback: revert baseline-freeze commit only; downstream tasks remain blocked until probes are green again.
- **Documentation impact:**
  - Add baseline disposition artifact in plan folder.
- **Notes / references:**
  - Root failure evidence recorded in fact-find Node Import Failure Diagnosis.
- **Build completion evidence (2026-02-20):**
  - Baseline disposition selected: revert in-flight i18n `.js`-specifier removals to HEAD-compatible state.
  - Artifact written: `docs/plans/turbopack-i18n-alias-retirement/artifacts/i18n-baseline-freeze.md`.
  - Validation results:
    - `pnpm --filter @acme/i18n build` -> pass.
    - `cd packages/template-app && node -e "import('@acme/i18n')..."` -> `ROOT_IMPORT_OK`.
    - `cd packages/template-app && node -e "import('@acme/i18n/locales')..."` -> `LOCALES_IMPORT_OK`.
  - Unexpected findings:
    - Node emitted a deprecation warning for `dist/Translations.js` assert syntax during probe; non-blocking for resolver-contract gating.

---

### TASK-02: Normalize i18n consumer mappings for source+dist apps
- **Type:** IMPLEMENT
- **Deliverable:** tsconfig normalization to dist-only/dist-first i18n consumer contract
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `packages/config/tsconfig.base.json`, `packages/template-app/tsconfig.json`, `apps/cms/tsconfig.json`, `apps/xa-b/tsconfig.json`, `apps/xa-j/tsconfig.json`, `apps/xa-uploader/tsconfig.json`, `[readonly] apps/brikette/tsconfig.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-09, TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 85% - mappings are explicit and audited in fact-find.
  - Approach: 85% - aligns remaining source+dist apps with selected dist-only contract.
  - Impact: 85% - removes cross-app contract drift that keeps alias debt alive.
- **Acceptance:**
  - Target files no longer map `@acme/i18n` or `@acme/i18n/*` to `packages/i18n/src/*`.
  - Shared base config and app overrides agree on i18n consumer contract.
  - Typecheck passes for all touched apps.
- **Validation contract (TC-02):**
  - TC-01: `rg -n 'packages/i18n/src|../../packages/i18n/src|../i18n/src' packages/config/tsconfig.base.json packages/template-app/tsconfig.json apps/cms/tsconfig.json apps/xa-b/tsconfig.json apps/xa-j/tsconfig.json apps/xa-uploader/tsconfig.json` -> no matches for i18n path entries.
  - TC-02: `pnpm --filter @acme/i18n build` -> exits 0 (dist freshness prerequisite for downstream checks).
  - TC-03: `bash -c 'rg -n "\"typecheck\"" apps/xa-b/package.json apps/xa-j/package.json apps/xa-uploader/package.json && pnpm --filter @apps/cms typecheck && pnpm --filter @apps/xa-b exec tsc -p tsconfig.json --noEmit && pnpm --filter @apps/xa-j exec tsc -p tsconfig.json --noEmit && pnpm --filter @apps/xa-uploader exec tsc -p tsconfig.json --noEmit'` -> exits 0.
  - TC-04: `pnpm --filter @acme/template-app build && pnpm --filter @apps/brikette typecheck` -> exits 0.
- **Execution plan:**
  1. Run `pnpm --filter @acme/i18n build` to guarantee dist artifacts are fresh before resolver checks.
  2. Update `packages/config/tsconfig.base.json` i18n entries to dist-only/dist-first consumer mapping.
  3. Update audited source+dist app/package overrides (including `packages/template-app/tsconfig.json`) to match the chosen contract.
  4. Ensure no app-local mapping reintroduces i18n `src` entries.
  5. Run typecheck/build matrix and fix resolver fallout before unblocking alias removal.
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n '"@acme/i18n' apps/*/tsconfig*.json packages/config/tsconfig.base.json`
    - `rg -n '"typecheck"' apps/xa-*/package.json` to confirm xa app command availability before execution.
  - Validation artifacts:
    - App mapping matrix in `docs/plans/turbopack-i18n-alias-retirement/fact-find.md`.
  - Unexpected findings:
    - `docs/tsconfig-paths.md` currently documents `src`-first convention and must be updated after contract migration.
- **Scouts:** `None: target file list and desired contract are already enumerated`
- **Edge Cases & Hardening:**
  - Preserve non-i18n path aliases unchanged.
  - Watch `tsconfig.test*` variants for apps that intentionally diverge from runtime config.
- **What would make this >=90%:**
  - Add a repo lint rule that blocks `@acme/i18n` mappings to `src` in app tsconfigs.
- **Rollout / rollback:**
  - Rollout: merge shared base + app overrides atomically.
  - Rollback: restore previous i18n mapping entries for affected files.
- **Documentation impact:**
  - Feeds TASK-08 contract documentation updates.
- **Notes / references:**
  - Brikette dist-only mapping remains reference end-state, not removal target.
  - Scope split: `packages/config/tsconfig.base.json`, `packages/template-app/tsconfig.json`, and `apps/cms/tsconfig.json` are migration-critical; `apps/xa-*` normalization is hygiene to eliminate mixed-contract drift.
- **Build completion evidence (2026-02-20):**
  - Normalized i18n mappings to dist-only in:
    - `packages/config/tsconfig.base.json`
    - `packages/template-app/tsconfig.json`
    - `apps/cms/tsconfig.json`
    - `apps/xa-b/tsconfig.json`
    - `apps/xa-j/tsconfig.json`
    - `apps/xa-uploader/tsconfig.json`
  - Validation results:
    - `! rg -n 'packages/i18n/src|../../packages/i18n/src|../i18n/src' ...` -> pass (no source mappings in scoped files).
    - `pnpm --filter @acme/i18n build` -> pass.
    - `bash -c 'rg -n "\"typecheck\"" apps/xa-*/package.json && ... tsc --noEmit'` -> pass.
    - `pnpm --filter @acme/template-app build` -> pass.
    - `pnpm --filter @apps/brikette typecheck` -> pass.
  - Unexpected findings:
    - `@apps/cms typecheck` initially failed with TS6307 for `@acme/i18n/en.json` from dist paths; resolved by adding `../../packages/i18n/dist/**/*.json` to `apps/cms/tsconfig.json` include list.

---

### TASK-03: Add resolver-contract validation harness (webpack + Turbopack + Node)
- **Type:** IMPLEMENT
- **Deliverable:** deterministic contract check command and CI wiring
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `scripts/check-i18n-resolver-contract.mjs`, `.github/workflows/merge-gate.yml`, `scripts/validate-changes.sh`, `[readonly] .github/workflows/brikette.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-09, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - command matrix is already known from fact-find probes.
  - Approach: 85% - centralized harness avoids drift across ad-hoc validation commands.
  - Impact: 85% - provides fail-fast protection before and after alias removal.
- **Acceptance:**
  - A single harness command validates resolver contract across webpack builds, Brikette Turbopack production build, and Node root/subpath imports.
  - `scripts/validate-changes.sh` invokes the harness after the existing `check-next-webpack-flag.mjs` check and only when changed paths include `packages/i18n/**`, `packages/next-config/**`, or `**/tsconfig*.json`.
  - Merge-gate or validate-changes path invokes the harness for relevant changed files.
  - Harness output clearly identifies failing surface (webpack, Turbopack, or Node).
- **Validation contract (TC-03):**
  - TC-01: `node scripts/check-i18n-resolver-contract.mjs` -> exits 0 on green baseline.
  - TC-02: `bash -c 'a=$(rg -n \"check-next-webpack-flag\\.mjs\" scripts/validate-changes.sh | head -n1 | cut -d: -f1); b=$(rg -n \"check-i18n-resolver-contract\" scripts/validate-changes.sh | head -n1 | cut -d: -f1); test -n \"$a\" && test -n \"$b\" && test \"$b\" -gt \"$a\"'` -> exits 0 (harness attached after existing policy check).
  - TC-03: Harness emits non-zero exit for at least one induced-failure path (for example invalid target app arg) with actionable error text.
  - TC-04: `bash -c 'g=$(rg -n \"packages/i18n/|packages/next-config/|tsconfig.*json\" scripts/validate-changes.sh | head -n1 | cut -d: -f1); h=$(rg -n \"check-i18n-resolver-contract\" scripts/validate-changes.sh | head -n1 | cut -d: -f1); test -n \"$g\" && test -n \"$h\" && test \"$g\" -lt \"$h\"'` -> exits 0 (guard predicate appears before harness invocation in `validate-changes.sh`).
- **Execution plan:**
  1. Implement `check-i18n-resolver-contract` with explicit subchecks and labeled output.
  2. Wire harness into `scripts/validate-changes.sh` immediately after `check-next-webpack-flag.mjs`, guarded by i18n/next-config/tsconfig changed-file predicates.
  3. Wire harness into merge-gate for the same changed-file scope.
  4. Add strict non-zero exits and terse failure guidance.
  5. Validate green path and one intentional failure path.
- **Planning validation (required for M/L):**
  - Checks run:
    - Fact-find command matrix: template-app/business-os/brikette webpack builds, Brikette Turbopack build, Node import probes.
    - Current merge gate entrypoint check (`scripts/check-next-webpack-flag.mjs --all`) to confirm where to attach new guard.
  - Validation artifacts:
    - `docs/plans/turbopack-i18n-alias-retirement/fact-find.md` test landscape and confidence sections.
  - Unexpected findings:
    - Existing policy checks and smoke checks are split across files; harness should remain single-source to avoid regressions.
- **Scouts:** `None: command set is already bounded by fact-find evidence`
- **Edge Cases & Hardening:**
  - Ensure harness can run in CI without interactive shells.
  - Keep runtime under CI budget with clear timeout handling.
- **What would make this >=90%:**
  - Add focused unit tests for harness argument parsing and failure-labeling paths.
- **Rollout / rollback:**
  - Rollout: land harness command first, then wire CI invocation in same PR.
  - Rollback: remove harness invocations and restore prior validation flow.
- **Documentation impact:**
  - TASK-08 will reference this command as canonical contract guard.
- **Notes / references:**
  - Reuse command patterns already proven in fact-find instead of creating new bespoke probes.
- **Build completion evidence (2026-02-20):**
  - Added contract harness: `scripts/check-i18n-resolver-contract.mjs`.
  - Wired `scripts/validate-changes.sh` to run harness immediately after `check-next-webpack-flag.mjs`, gated to i18n/next-config/tsconfig path changes.
  - Wired `.github/workflows/merge-gate.yml` with scoped harness execution against `/tmp/changed-files.txt`.
  - Validation results:
    - `node scripts/check-i18n-resolver-contract.mjs` -> pass across webpack, Turbopack, and Node probe surfaces.
    - `bash -c 'a=$(rg -n "check-next-webpack-flag\\.mjs" ...); b=$(rg -n "check-i18n-resolver-contract" ...); test "$b" -gt "$a"'` -> pass.
    - `node scripts/check-i18n-resolver-contract.mjs --webpack-apps not-a-real-app` -> exits 2 with actionable invalid-app error.
    - `bash -c 'g=$(rg -n "packages/i18n/|packages/next-config/|tsconfig.*json" scripts/validate-changes.sh ...); h=$(rg -n "check-i18n-resolver-contract" scripts/validate-changes.sh ...); test "$g" -lt "$h"'` -> pass.
  - Unexpected findings:
    - Harness runs are expensive because they intentionally execute full build surfaces; no flakiness observed in this run.

---

### TASK-09: Diagnose template-app webpack resolver failure without shared i18n alias
- **Type:** INVESTIGATE
- **Deliverable:** investigation artifact with root cause and selected remediation seam (`docs/plans/turbopack-i18n-alias-retirement/artifacts/template-app-i18n-alias-retirement-investigation.md`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `packages/next-config/next.config.mjs`, `packages/template-app/next.config.mjs`, `packages/template-app/tsconfig.json`, `packages/i18n/package.json`, `[readonly] scripts/check-i18n-resolver-contract.mjs`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-04
- **Confidence:** 75%
  - Implementation: 75% - reproducing the failure and capturing candidate seams is straightforward, but root cause is still unresolved.
  - Approach: 75% - multiple plausible seams exist (`transpilePackages`, package exports shape, path mapping interpretation), and evidence is needed before implementation.
  - Impact: 80% - resolving this precursor is required before alias retirement can be safely retried.
- **Questions to answer:**
  - Why does template-app webpack still fail to resolve `@acme/i18n` once the shared alias is removed?
  - Which remediation seam preserves the dist-only contract without reintroducing shared alias debt?
  - Does the selected seam keep template-app webpack build and resolver harness green when alias is absent?
- **Acceptance:**
  - Artifact includes failing baseline reproduction (`Can't resolve '@acme/i18n'`) with command and excerpt.
  - Artifact compares at least two candidate remediation seams and records pass/fail evidence for template-app webpack build + resolver harness.
  - Artifact names one preferred seam with exact target files and rollback notes, enabling TASK-04 promotion.
- **Validation contract:**
  - TC-01: `rg -n "Can't resolve '@acme/i18n'" docs/plans/turbopack-i18n-alias-retirement/artifacts/template-app-i18n-alias-retirement-investigation.md` -> at least one match.
  - TC-02: `rg -n 'Candidate seam|template-app webpack build|resolver harness|Selected seam' docs/plans/turbopack-i18n-alias-retirement/artifacts/template-app-i18n-alias-retirement-investigation.md` -> at least four matches total across those headings/labels.
  - TC-03: `rg -n 'TASK-04 promotion criteria|rollback' docs/plans/turbopack-i18n-alias-retirement/artifacts/template-app-i18n-alias-retirement-investigation.md` -> at least two matches.
- **Execution plan:**
  1. Reproduce alias-removal failure on a controlled spike state and capture exact failing module chain.
  2. Evaluate candidate remediation seams one-by-one with `pnpm --filter @acme/template-app build` and `node scripts/check-i18n-resolver-contract.mjs`.
  3. Record outcomes in the artifact and choose one seam for implementation.
  4. Update TASK-04 confidence/dependencies via `/lp-do-replan` if the selected seam changes implementation scope.
- **Planning validation:** None: this task produces the missing evidence needed to unblock implementation.
- **Rollout / rollback:** `None: investigation artifact only`
- **Documentation impact:**
  - Adds an investigation artifact consumed by TASK-04 execution.
- **Build completion evidence (2026-02-20):**
  - Artifact added: `docs/plans/turbopack-i18n-alias-retirement/artifacts/template-app-i18n-alias-retirement-investigation.md`.
  - Baseline failure reproduced:
    - `pnpm --filter @acme/template-app build` with shared alias removed -> fail (`Can't resolve '@acme/i18n'`).
  - Candidate seams tested:
    - shared alias-shape adjustment (`"@" -> "@/"`) with alias removed -> fail.
    - removing `@acme/i18n` from template-app `transpilePackages` with alias removed -> fail.
    - template-app-local webpack alias with shared alias removed -> pass.
  - Selected seam validation:
    - `pnpm --filter @acme/template-app build` -> pass.
    - `node scripts/check-i18n-resolver-contract.mjs` -> pass all configured surfaces.
  - Workspace state:
    - temporary probe edits reverted; baseline restored after investigation.

---

### TASK-04: Remove shared webpack i18n alias from `@acme/next-config`
- **Type:** IMPLEMENT
- **Deliverable:** alias retirement in shared next-config with green resolver matrix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `packages/next-config/next.config.mjs`, `packages/template-app/next.config.mjs`, `[readonly] packages/template-app/package.json`
- **Depends on:** TASK-02, TASK-03, TASK-09
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - TASK-09 isolated and validated one runnable seam for alias retirement.
  - Approach: 85% - selected seam is command-validated across template-app build and full resolver harness.
  - Impact: 90% - this still clears the i18n blocker row for production Turbopack migration.
- **Acceptance:**
  - `packages/next-config/next.config.mjs` no longer sets webpack alias for `@acme/i18n`.
  - Resolver harness remains green after alias removal.
  - Template-app, business-os, and Brikette webpack builds remain green.
- **Validation contract (TC-04):**
  - TC-01: `rg -n '"@acme/i18n"\s*:' packages/next-config/next.config.mjs` -> no matches.
  - TC-02: `pnpm --filter @acme/template-app build` -> exits 0.
  - TC-03: `pnpm --filter @apps/business-os build && pnpm --filter @apps/brikette build` -> exits 0.
  - TC-04: `node scripts/check-i18n-resolver-contract.mjs` -> exits 0.
- **Execution plan:**
  1. Apply the selected remediation seam from TASK-09 (if required by investigation outcome).
  2. Remove i18n alias entry and stale warning comment from shared webpack callback.
  3. Re-run resolver harness and direct webpack build matrix.
  4. Confirm no unrelated callback rows were modified in this task.
  5. Capture build evidence in task completion notes.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @acme/template-app build`
    - `pnpm --filter @apps/business-os build`
    - `pnpm --filter @apps/brikette build`
  - Validation artifacts:
    - Fact-find build baseline table.
  - Unexpected findings:
    - None in planning; alias removal risk is explicitly managed by TASK-03 harness.
- **Scouts:** `None: dependent unknowns are already handled by TASK-01..TASK-03`
- **Edge Cases & Hardening:**
  - Keep all non-i18n webpack callback entries unchanged in this pass.
  - Verify template-app prebuild still provides `@acme/i18n` dist freshness.
- **What would make this >=90%:**
  - Add CI-required status check specifically for resolver harness on all next-config changes.
- **Rollout / rollback:**
  - Rollout: merge alias removal only after harness and mappings are green.
  - Rollback: restore alias line in `packages/next-config/next.config.mjs` immediately if matrix regresses.
- **Documentation impact:**
  - TASK-08 updates docs to reflect alias retirement.
- **Notes / references:**
  - This task intentionally clears only the i18n row in the wider callback migration table.
- **Build execution evidence (2026-02-20):**
  - Attempted alias retirement by removing `@acme/i18n` alias from `packages/next-config/next.config.mjs`.
  - Failure reproduced immediately:
    - `pnpm --filter @acme/template-app build` -> webpack module resolution failure (`Can't resolve '@acme/i18n'` in template-app layout files).
  - Recovery action taken in same cycle:
    - Restored shared alias line in `packages/next-config/next.config.mjs` to return workspace to green baseline.
    - Re-ran `pnpm --filter @acme/template-app build` -> pass.
  - Block reason:
    - Alias removal currently has unresolved resolver behavior in webpack/template-app despite dist-only tsconfig normalization.
  - Next action:
    - Requires `/lp-do-replan` to add a dedicated investigation/decision step before re-attempting TASK-04.
#### Re-plan Update (2026-02-20)
- Confidence: 85% -> 70% (Evidence: E2)
- Key change: Added TASK-09 precursor because alias removal is not currently runnable without a chosen resolver seam.
- Dependencies: updated to include TASK-09.
- Validation contract: unchanged; execution plan now explicitly consumes TASK-09 outcome.
- Notes: build blocker captured in task evidence (`@acme/template-app` webpack cannot resolve `@acme/i18n` when alias is removed).
#### Build Update (2026-02-20)
- Confidence: 70% -> 85% (Evidence: E2 via TASK-09 artifact + full resolver harness pass)
- Key change: TASK-09 selected and validated a runnable seam (template-app-local alias with shared alias retired).
- Dependencies: unchanged (TASK-09 now Complete).
- Validation contract: unchanged.
- Notes: TASK-04 status promoted from Blocked to Pending.
- **Build completion evidence (2026-02-20):**
  - Implemented selected seam:
    - Removed shared webpack alias `@acme/i18n` from `packages/next-config/next.config.mjs`.
    - Added template-app-local webpack alias `@acme/i18n -> ../i18n/dist` in `packages/template-app/next.config.mjs`.
  - Scope expansion:
    - `packages/template-app/next.config.mjs` was promoted from `[readonly]` to writable for this task because TASK-09 proved shared-alias retirement requires app-local compatibility wiring in template-app.
  - Validation results (TC-04):
    - TC-01: `rg -n '"@acme/i18n"\s*:' packages/next-config/next.config.mjs` -> no matches (exit 1 expected).
    - TC-02: `pnpm --filter @acme/template-app build` -> pass.
    - TC-03: `pnpm --filter @apps/business-os build && pnpm --filter @apps/brikette build` -> pass.
    - TC-04: `node scripts/check-i18n-resolver-contract.mjs` -> pass all configured surfaces.

---

### TASK-05: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if assumptions fail
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/turbopack-i18n-alias-retirement/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - process is defined.
  - Approach: 95% - checkpoint protects against blind continuation after alias removal.
  - Impact: 95% - keeps downstream Brikette mapping decision evidence-based.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - Downstream tasks reassessed against fresh TASK-04 evidence.
  - Plan updated/re-sequenced if confidence or dependencies changed.
- **Horizon assumptions to validate:**
  - Dist-only normalization + alias removal did not introduce hidden regressions in Brikette build/test surfaces.
  - Remaining webpack callback rows are still out-of-scope and unaffected by i18n retirement.
- **Validation contract:**
  - Checkpoint completion note records whether TASK-06/TASK-07 confidence remains unchanged or required `/lp-do-replan` adjustments.
- **Planning validation:**
  - Evidence source is TASK-04 completion outputs.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - Update this plan if checkpoint changes downstream execution.
- **Checkpoint completion evidence (2026-02-20):**
  - Completed-task evidence reviewed:
    - TASK-04 removed shared alias and passed TC-01..TC-04 (including full resolver harness).
  - Horizon assumption validation:
    - Dist-only normalization + alias retirement did not introduce hidden regressions in Brikette build/test surfaces (webpack + Turbopack remained green in TASK-04/TC-04 evidence).
    - Remaining webpack callback rows (`extensionAlias`, source aliases, `node:*`) remained out-of-scope and unmodified during TASK-04.
  - Checkpoint-triggered `/lp-do-replan` reassessment outcome:
    - Downstream tasks (TASK-06, TASK-07, TASK-08) remain valid and above type thresholds with unchanged dependency graph.
    - No topology changes required; `/lp-sequence` not needed.
    - Build flow can resume at TASK-06.

---

### TASK-06: Prove whether Brikette i18n tsconfig override is now redundant
- **Type:** INVESTIGATE
- **Deliverable:** decision artifact (`docs/plans/turbopack-i18n-alias-retirement/artifacts/brikette-i18n-override-investigation.md`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `apps/brikette/tsconfig.json`, `[readonly] packages/config/tsconfig.base.json`, `[readonly] apps/brikette/next.config.mjs`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 75%
  - Implementation: 75% - probe work is straightforward but outcome is genuinely unknown before testing.
  - Approach: 75% - two valid end states exist (remove override vs retain with rationale).
  - Impact: 75% - final Brikette state controls whether app-local debt remains and still depends on unresolved probe outcomes.
- **Questions to answer:**
  - After TASK-02 normalization, does Brikette still need explicit `@acme/i18n` mapping?
  - If override is removed, do Brikette typecheck + webpack build + Turbopack production build all stay green?
  - If override must remain, what concrete resolver gap justifies it?
- **Acceptance:**
  - Artifact records both tested states and command outputs.
  - Recommendation is explicit: remove override or retain with rationale.
  - TASK-07 can execute without unresolved decision ambiguity.
- **Validation contract:**
  - Artifact must include command-backed evidence for `@apps/brikette typecheck`, webpack build, and Turbopack production build under evaluated state(s).
- **Planning validation:** None: investigation output is the required evidence.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds investigation artifact used by TASK-07/TASK-08.
- **Notes / references:**
  - Brikette dist-only override is currently acceptable baseline and should only be removed if proven redundant.
- **Build completion evidence (2026-02-20):**
  - Artifact added: `docs/plans/turbopack-i18n-alias-retirement/artifacts/brikette-i18n-override-investigation.md`.
  - State A (override present) evidence:
    - `pnpm --filter @apps/brikette typecheck` -> pass.
    - `pnpm --filter @apps/brikette build` -> pass.
    - `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> pass.
  - State B (override removed) evidence:
    - Removed `@acme/i18n` and `@acme/i18n/*` from `apps/brikette/tsconfig.json` for probe.
    - `pnpm --filter @apps/brikette typecheck` -> pass.
    - `pnpm --filter @apps/brikette build` -> pass.
    - `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> pass.
  - Recommendation:
    - Override is redundant; TASK-07 should remove Brikette app-local i18n mapping entries.
  - Workspace state:
    - Temporary probe edit to `apps/brikette/tsconfig.json` reverted after testing.

---

### TASK-07: Apply Brikette final i18n mapping decision from TASK-06
- **Type:** IMPLEMENT
- **Deliverable:** finalized Brikette i18n mapping state with validated behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `apps/brikette/tsconfig.json`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - change is small once TASK-06 recommendation is fixed.
  - Approach: 85% - conditional removal/retention prevents speculative cleanup.
  - Impact: 85% - ensures Brikette ends in intentional, documented state.
- **Acceptance:**
  - Brikette i18n mapping matches TASK-06 recommendation.
  - If override is retained, an inline rationale comment points to investigation artifact.
  - Brikette typecheck + webpack build + Turbopack production build pass.
- **Validation contract (TC-07):**
  - TC-01: `pnpm --filter @apps/brikette typecheck` -> exits 0.
  - TC-02: `pnpm --filter @apps/brikette build` -> exits 0.
  - TC-03: `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> exits 0.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** `None: TASK-06 provides the decision artifact`
- **Edge Cases & Hardening:**
  - Preserve existing non-i18n path aliases in Brikette config.
- **What would make this >=90%:**
  - Add a targeted Brikette config test asserting expected i18n path resolution source.
- **Rollout / rollback:**
  - Rollout: apply decision and validate all three checks in one commit.
  - Rollback: restore prior Brikette tsconfig mapping block.
- **Documentation impact:**
  - TASK-08 records final state and rationale.
- **Notes / references:**
  - Decision source: TASK-06 investigation artifact.
- **Build completion evidence (2026-02-20):**
  - Applied TASK-06 recommendation by removing Brikette app-local i18n path overrides from `apps/brikette/tsconfig.json`:
    - removed `@acme/i18n`
    - removed `@acme/i18n/*`
  - Validation results (TC-07):
    - `pnpm --filter @apps/brikette typecheck` -> pass.
    - `pnpm --filter @apps/brikette build` -> pass.
    - `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> pass.
  - Outcome:
    - Brikette now inherits the i18n contract without app-local override and remains green across typecheck, webpack build, and Turbopack build.

---

### TASK-08: Document final i18n resolver contract and migration guardrails
- **Type:** IMPLEMENT
- **Deliverable:** updated guidance with explicit i18n exception and enforcement references
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/tsconfig-paths.md`, `docs/plans/turbopack-i18n-alias-retirement/plan.md`, `[readonly] docs/plans/turbopack-i18n-alias-retirement/fact-find.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - docs updates are localized.
  - Approach: 85% - codifies contract to prevent reintroduction of src-first i18n paths.
  - Impact: 85% - improves long-term migration consistency and onboarding clarity.
- **Acceptance:**
  - `docs/tsconfig-paths.md` explicitly documents i18n consumer contract (dist-only/dist-first) as an exception to general src+dist guidance.
  - Docs reference the resolver-contract harness command as enforcement mechanism.
  - Plan/fact-find references are aligned with the final i18n migration outcome.
- **Validation contract (TC-08):**
  - TC-01: `rg -n 'i18n.*dist-only|@acme/i18n.*dist' docs/tsconfig-paths.md` -> at least one match.
  - TC-02: `rg -n 'Always list the src path\(s\) first' docs/tsconfig-paths.md` -> either removed or clearly scoped with i18n exception.
  - TC-03: `rg -n 'check-i18n-resolver-contract' docs/tsconfig-paths.md` -> at least one match.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort docs task.
- **Scouts:** `None: content source is finalized by TASK-02..TASK-07`
- **Edge Cases & Hardening:**
  - Keep general path-mapping guidance intact for non-i18n packages.
- **What would make this >=90%:**
  - Add a short docs lint check for i18n contract wording drift.
- **Rollout / rollback:**
  - Rollout: publish docs with final code changes in same PR.
  - Rollback: revert docs updates only if contract changes are postponed.
- **Documentation impact:**
  - Final canonical wording for i18n resolution contract.
- **Notes / references:**
  - This task closes the i18n row in the wider migration table and triggers follow-up brief for remaining rows.
- **Build completion evidence (2026-02-20):**
  - Updated `docs/tsconfig-paths.md` with explicit i18n resolver contract exception:
    - `@acme/i18n` is now documented as dist-only consumer mapping.
    - General src-first guidance is retained for non-i18n workspace packages.
  - Added enforcement reference:
    - `node scripts/check-i18n-resolver-contract.mjs` documented as canonical guard.
  - Validation results (TC-08):
    - TC-01: `rg -n 'i18n.*dist-only|@acme/i18n.*dist' docs/tsconfig-paths.md` -> pass.
    - TC-02: `rg -n 'Always list the src path\(s\) first' docs/tsconfig-paths.md` -> no matches (guidance reworded/scoped).
    - TC-03: `rg -n 'check-i18n-resolver-contract' docs/tsconfig-paths.md` -> pass.

## Risks & Mitigations
- Baseline freeze unexpectedly conflicts with unrelated i18n feature edits.
  - Mitigation: isolate TASK-01 disposition in dedicated commit + artifact before any contract edits.
- Dist-only normalization causes typecheck fallout in apps with hidden source-only imports.
  - Mitigation: targeted app typecheck matrix in TASK-02 and fail-fast rollback path.
- Alias removal passes app builds but regresses Node imports.
  - Mitigation: TASK-03 harness includes root/subpath Node probes as first-class gates.
- Next-step migration to drop `--webpack` from Brikette build is blocked by policy enforcer config even after callback rows are cleared.
  - Mitigation: document follow-up prerequisite to update `scripts/check-next-webpack-flag.mjs` Brikette `build` policy in the next brief.
- Brikette override removal may be premature.
  - Mitigation: explicit investigate-first TASK-06 before any cleanup change in TASK-07.

## Observability
- Logging:
  - Harness output labels each failing surface (`webpack`, `turbopack`, `node-root`, `node-subpath`).
- Metrics:
  - CI pass/fail trend for resolver-contract harness.
  - Count of app tsconfig files still mapping `@acme/i18n` to `src`.
- Alerts/Dashboards:
  - CI required-check failure notifications for merge-gate when resolver contract breaks.

## Acceptance Criteria (overall)
- [x] Shared webpack alias for `@acme/i18n` is removed from `packages/next-config/next.config.mjs`.
- [x] Target source+dist apps are normalized to selected i18n consumer contract.
- [x] Resolver-contract harness exists and is wired into CI validation path.
- [x] Node root + subpath imports for `@acme/i18n` are green on stabilized baseline.
- [x] Brikette i18n override state is explicitly justified and validated.
- [x] `docs/tsconfig-paths.md` reflects final i18n contract and enforcement command.

## Decision Log
- 2026-02-20: Dist-only i18n consumer contract remains selected for this migration step; source-compatible contract remains out-of-scope.
- 2026-02-20: Plan mode set to `plan-only`; no automatic `/lp-do-build` handoff.
- 2026-02-20: `/lp-do-build` stopped at TASK-04 validation gate after reproducible template-app webpack resolver failure without shared i18n alias; reroute to `/lp-do-replan`.
- 2026-02-20: `/lp-do-replan` added TASK-09 INVESTIGATE as a required precursor for TASK-04 and downgraded TASK-04 to conditional confidence pending resolver-seam evidence.
- 2026-02-20: `/lp-do-build` completed TASK-09 and selected seam C (template-app-local alias + shared alias retirement) as the TASK-04 execution path.
- 2026-02-20: `/lp-do-build` completed TASK-04 by retiring the shared i18n alias and localizing compatibility aliasing to template-app; full TC-04 contract passed.
- 2026-02-20: `/lp-do-build` completed TASK-05 checkpoint; downstream replan reassessment required no topology/confidence changes and unblocked TASK-06.
- 2026-02-20: `/lp-do-build` completed TASK-06 investigation; both override-present and override-removed Brikette states passed all probes, so TASK-07 should remove the app-local i18n override.
- 2026-02-20: `/lp-do-build` completed TASK-07 by removing Brikette app-local i18n path overrides; TC-07 typecheck + webpack + Turbopack validations all passed.
- 2026-02-20: `/lp-do-build` completed TASK-08 docs hardening; i18n dist-only exception and resolver-contract enforcement command are now documented in `docs/tsconfig-paths.md`.

## Overall-confidence Calculation
- Effort weights: S=1, M=2, L=3
- Weighted confidence:
  - TASK-01: 85 * 2 = 170
  - TASK-02: 85 * 2 = 170
  - TASK-03: 85 * 2 = 170
  - TASK-09: 75 * 1 = 75
  - TASK-04: 85 * 2 = 170
  - TASK-05: 95 * 1 = 95
  - TASK-06: 75 * 1 = 75
  - TASK-07: 85 * 1 = 85
  - TASK-08: 85 * 1 = 85
- Overall-confidence = (170+170+170+75+170+95+75+85+85) / (2+2+2+1+2+1+1+1+1) = 1095 / 13 = 84%

## Section Omission Rule
None: all template sections are relevant for this code-track plan.
