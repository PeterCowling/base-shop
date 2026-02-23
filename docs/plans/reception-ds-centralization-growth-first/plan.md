---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-ds-centralization-growth-first
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system, lp-refactor, lp-sequence
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Reception DS Centralization (Growth-First) Plan

## Summary
This plan centralizes Reception UI by expanding shared DS/UI capability first, then migrating Reception usage in guarded waves with strict parity gates. The migration is explicitly no-regression: route behavior and visual output for the locked parity set must remain unchanged during each wave. The plan avoids broad codemods and instead uses compatibility components exposed from shared packages, so variation comes from growth of system capabilities rather than route redesign. Lint escalation is deferred until all migration waves prove parity and app-local escape hatches are retired.

## Active tasks
- [x] TASK-01: Build migration inventory + lock parity contract
- [x] TASK-02: Create parity harness for locked routes
- [x] TASK-03: Add table compatibility surface in design-system
- [x] TASK-04: Add text-field compatibility surface in design-system
- [x] TASK-05: Add button compatibility surface in design-system
- [ ] TASK-06: Publish Reception compatibility exports + remove deep NotificationCenter imports
- [ ] TASK-07: Horizon checkpoint - reassess downstream migration assumptions
- [ ] TASK-08: Wave 1 migration - parity route set
- [ ] TASK-09: Wave 2 migration - table-heavy operational routes
- [ ] TASK-10: Wave 3 migration - form/modal-heavy operational routes
- [ ] TASK-11: Wave 4 migration - remaining routes + local UI retirement
- [ ] TASK-12: Escalate Reception DS lint rules after full parity coverage

## Goals
- Centralize Reception UI through shared DS/UI capabilities rather than app-local bespoke components.
- Preserve existing Reception look and behavior during migration.
- Create enforceable parity evidence so centralization can progress safely.
- Finish with DS structural governance enabled for Reception.

## Non-goals
- Big-bang replacement of native tags across all Reception files.
- Unscoped redesign of Reception screens.
- Forcing DS primitives that alter DOM contracts before compatibility variants exist.

## Constraints & Assumptions
- Constraints:
  - Reception has 26 route entry pages.
  - HEAD baseline includes large native element usage (`270` buttons, `134` input/select/textarea, `561` table tags in app/components).
  - Reception currently runs phased DS governance and keeps `ds/enforce-layout-primitives` disabled.
  - Prior broad codemod probe touched 121 files and produced 159 lint errors, so mechanical replacement is not acceptable.
- Assumptions:
  - Shared package maintainers will accept compatibility-surface growth for operational apps.
  - Route parity can be demonstrated with deterministic component/interaction baselines in existing Jest infrastructure.

## Fact-Find Reference
- Related brief: `docs/plans/reception-ds-centralization-growth-first/fact-find.md`
- Key findings used:
  - Direct native-to-primitive replacement is disruptive in this app and must not be the migration mechanism.
  - DS primitive wrappers (table/input/textarea) are not currently drop-in for Reception layouts.
  - Deep NotificationCenter import usage in Reception indicates missing central API usage.
  - Delivery readiness is constrained by lack of explicit parity harness.

## Proposed Approach
- Option A:
  - Continue broad codemod replacement and resolve fallout incrementally.
  - Rejected: probe evidence already shows high churn and immediate lint breakage.
- Option B:
  - Freeze app-local UI and defer centralization indefinitely.
  - Rejected: does not solve governance drift.
- Chosen approach:
  - Growth-first centralization.
  - Sequence: inventory + parity harness -> shared compatibility surface growth -> route migration waves -> lint escalation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build migration inventory + lock parity contract | 85% | S | Complete (2026-02-23) | - | TASK-02, TASK-08, TASK-09, TASK-10, TASK-11 |
| TASK-02 | IMPLEMENT | Create parity harness for locked routes | 85% | S | Complete (2026-02-23) | TASK-01 | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 |
| TASK-03 | IMPLEMENT | Add table compatibility surface in DS | 85% | S | Complete (2026-02-23) | - | TASK-06 |
| TASK-04 | IMPLEMENT | Add text-field compatibility surface in DS | 85% | S | Complete (2026-02-23) | - | TASK-06 |
| TASK-05 | IMPLEMENT | Add button compatibility surface in DS | 85% | S | Complete (2026-02-23) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Publish Reception compatibility exports + deep import cleanup | 85% | S | Pending | TASK-03, TASK-04, TASK-05 | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 |
| TASK-07 | CHECKPOINT | Horizon checkpoint - reassess downstream migration assumptions | 95% | S | Pending | TASK-02, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Wave 1 migration - parity route set | 75% | S | Pending | TASK-01, TASK-02, TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Wave 2 migration - table-heavy operational routes | 75% | S | Pending | TASK-01, TASK-02, TASK-06, TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Wave 3 migration - form/modal-heavy operational routes | 75% | S | Pending | TASK-01, TASK-02, TASK-06, TASK-09 | TASK-11 |
| TASK-11 | IMPLEMENT | Wave 4 migration - remaining routes + local UI retirement | 75% | S | Pending | TASK-01, TASK-02, TASK-06, TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Escalate Reception DS lint rules after full parity coverage | 85% | S | Pending | TASK-11 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Locks inventory and parity route contract before build work. |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-01 for TASK-02; none for TASK-03/04/05 | Parity harness and DS compatibility growth can proceed in parallel. |
| 3 | TASK-06 | TASK-03, TASK-04, TASK-05 | Export consolidation and deep import cleanup after compat primitives exist. |
| 4 | TASK-07 | TASK-02, TASK-06 | Mandatory checkpoint before migration waves. |
| 5 | TASK-08 | TASK-01, TASK-02, TASK-06, TASK-07 | Parity route migration wave only. |
| 6 | TASK-09 | TASK-01, TASK-02, TASK-06, TASK-08 | Table-heavy routes. |
| 7 | TASK-10 | TASK-01, TASK-02, TASK-06, TASK-09 | Form/modal-heavy routes. |
| 8 | TASK-11 | TASK-01, TASK-02, TASK-06, TASK-10 | Remaining routes and local UI retirement. |
| 9 | TASK-12 | TASK-11 | Governance hardening only after full migration parity evidence. |

## Tasks

### TASK-01: Build migration inventory + lock parity contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/reception-ds-centralization-growth-first/artifacts/migration-inventory.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/reception/src/app`, `apps/reception/src/components`, `docs/plans/reception-ds-centralization-growth-first/artifacts/migration-inventory.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-08, TASK-09, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 85% - route and component enumeration commands are deterministic.
  - Approach: 90% - inventory-first gating directly reduces migration ambiguity.
  - Impact: 85% - clear route-wave boundaries reduce regression risk later.
- **Questions to answer:**
  - Which exact route/component groups define Wave 1-4 boundaries?
  - Which selectors and interactions are the parity contract for each locked route?
  - Which native element hotspots must be migrated per wave?
- **Acceptance:**
  - Migration inventory maps all 26 routes to a wave.
  - Locked parity set is explicitly recorded: unauthenticated login state on `/bar`, plus `/checkin`, `/checkout`, `/till-reconciliation`, `/safe-management`.
  - Hotspot files are listed per wave with native tag counts.
- **Validation contract:**
  - `VC-01`: `find apps/reception/src/app -name page.tsx | wc -l` confirms route count baseline.
  - `VC-02`: `git grep` counts for button/input/table tags are captured in artifact.
  - `VC-03`: Artifact includes explicit wave assignment for every route.
- **Planning validation:** checks run and artifacts recorded in deliverable.
- **Rollout / rollback:** `None: non-implementation task`.
- **Documentation impact:** adds migration inventory artifact.
- **Notes / references:**
  - `docs/plans/reception-ds-centralization-growth-first/fact-find.md`
- **Build evidence (2026-02-23):**
  - Deliverable created: `docs/plans/reception-ds-centralization-growth-first/artifacts/migration-inventory.md`.
  - `VC-01` passed: `find apps/reception/src/app -name 'page.tsx' | wc -l` -> `26`.
  - `VC-02` passed at `HEAD` baseline:
    - `git grep -n "<button\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `270`
    - `git grep -n "<input\\b\\|<select\\b\\|<textarea\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `134`
    - `git grep -n "<table\\b\\|<thead\\b\\|<tbody\\b\\|<tr\\b\\|<th\\b\\|<td\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `561`
  - `VC-03` passed: all 26 routes assigned to Waves 1-4 in inventory artifact.
  - Downstream confidence propagation:
    - TASK-02, TASK-08, TASK-09, TASK-10, TASK-11 were reviewed with new inventory evidence.
    - Outcome: affirming but no score changes required (all remain at current confidence values).

### TASK-02: Create parity harness for locked routes
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/parity/__tests__/` + parity command documentation in plan artifacts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/reception/src/parity/__tests__`, `apps/reception/jest.config.cjs`, `docs/plans/reception-ds-centralization-growth-first/artifacts/parity-results/`
- **Depends on:** TASK-01
- **Blocks:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 85% - existing Jest + RTL patterns are already used in Reception.
  - Approach: 90% - parity tests before migration directly enforce no-regression.
  - Impact: 85% - provides deterministic pass/fail gate for every wave.
- **Acceptance:**
  - Baseline parity tests exist for locked route set components and login state.
  - Each parity suite includes DOM snapshot assertions and keyboard/modal interaction assertions.
  - CI-invokable command for parity suite is documented and reproducible.
- **Validation contract (TC-02):**
  - TC-01: parity suite runs and snapshots are created/updated intentionally.
  - TC-02: keyboard interaction test (modal open/close, focus return, arrow-key unaffected inputs) passes.
  - TC-03: baseline run and post-migration run produce zero unexpected snapshot diffs for wave-scoped files.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Confirm existing snapshot pattern in Reception tests and reuse it.
- **Edge Cases & Hardening:**
  - Stabilize non-deterministic data/time in parity tests through mocks.
- **What would make this >=90%:**
  - One full dry-run of parity suite before and after a no-op refactor with stable zero diffs.
- **Rollout / rollback:**
  - Rollout: additive test-only harness.
  - Rollback: remove parity suites if flake cannot be controlled and replace with deterministic contract tests.
- **Documentation impact:** add parity command and evidence path in artifacts.
- **Notes / references:**
  - `apps/reception/src/components/checkins/__tests__/TableHeader.test.tsx`
- **Build evidence (2026-02-23):**
  - Deliverables created:
    - `apps/reception/src/parity/__tests__/login-route.parity.test.tsx`
    - `apps/reception/src/parity/__tests__/checkin-route.parity.test.tsx`
    - `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx`
    - `apps/reception/src/parity/__tests__/till-route.parity.test.tsx`
    - `apps/reception/src/parity/__tests__/safe-route.parity.test.tsx`
    - snapshot baselines under `apps/reception/src/parity/__tests__/__snapshots__/`
    - `docs/plans/reception-ds-centralization-growth-first/artifacts/parity-results/README.md`
  - `TC-01` passed (baseline snapshot run):
    - `pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__ --updateSnapshot` (run in `apps/reception`)
    - Result: `5` suites passed, `10` tests passed, snapshot baseline established (`5` snapshots).
  - `TC-02` passed (keyboard/modal interaction contract):
    - `/bar` login parity asserts arrow-key-safe input behavior and password toggle interaction in `apps/reception/src/parity/__tests__/login-route.parity.test.tsx`.
    - `/checkin`, `/till-reconciliation`, and `/safe-management` parity suites assert keyboard/modal open-close flows.
  - `TC-03` passed (zero unexpected snapshot diffs on rerun):
    - `pnpm exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__` (run in `apps/reception`)
    - Result: `5` suites passed, `10` tests passed, `5` snapshots passed (no diffs).
  - Task validation gate:
    - `pnpm --filter @apps/reception typecheck` -> pass
    - `pnpm --filter @apps/reception lint` -> pass
  - Downstream confidence propagation:
    - TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 reviewed with completed parity harness evidence.
    - Outcome: affirming; confidence values unchanged pending TASK-06 compatibility-surface completion.

### TASK-03: Add table compatibility surface in design-system
- **Type:** IMPLEMENT
- **Deliverable:** code-change in DS table primitive + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/table.tsx`, `packages/design-system/src/primitives/__tests__/table.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - localized primitive change with existing test coverage.
  - Approach: 90% - compatibility mode removes wrapper-induced layout shifts.
  - Impact: 85% - enables safe table migration without route redesign.
- **Acceptance:**
  - Table primitive exposes explicit compatibility option to disable automatic overflow wrapper.
  - Default behavior remains unchanged for existing consumers.
  - Table tests cover both default and compatibility modes.
- **Validation contract (TC-03):**
  - TC-01: default table render remains byte-equivalent with current snapshots.
  - TC-02: compatibility mode renders no extra wrapper element.
  - TC-03: semantic table structure/accessibility remains valid in both modes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Confirm wrapper behavior call sites in Reception tables with large tag density.
- **Edge Cases & Hardening:**
  - Guard against breaking horizontal overflow in existing non-Reception consumers.
- **What would make this >=90%:**
  - Cross-package test pass confirming no visual/layout regression in existing DS consumers.
- **Rollout / rollback:**
  - Rollout: additive prop with unchanged defaults.
  - Rollback: remove compatibility prop and call-site usage.
- **Documentation impact:** update DS primitive docs for compatibility mode.
- **Notes / references:**
  - `packages/design-system/src/primitives/table.tsx`
- **Build evidence (2026-02-23):**
  - Deliverables updated:
    - `packages/design-system/src/primitives/table.tsx`
    - `packages/design-system/src/primitives/__tests__/table.test.tsx`
  - Acceptance coverage:
    - Explicit compatibility surface added: `TableProps.compatibilityMode` with values `"default"` (existing wrapper behavior) and `"no-wrapper"` (bare table render).
    - Default behavior unchanged: wrapper path still renders `div.w-full.overflow-x-auto` around table.
    - Compatibility mode verified: no extra wrapper element when `compatibilityMode="no-wrapper"`.
  - `TC-03` validation:
    - `pnpm --filter @acme/design-system test -- src/primitives/__tests__/table.test.tsx` -> pass (`10` tests, including default-wrapper and no-wrapper compatibility assertions).
    - `pnpm --filter @acme/design-system typecheck` -> pass.
    - `pnpm --filter @acme/design-system lint` -> pass (non-blocking pre-existing warning in `packages/design-system/src/molecules/MediaSelector.tsx:47`).
  - Downstream confidence propagation:
    - TASK-06 reviewed with TASK-03 evidence.
    - Outcome: affirming but confidence unchanged until TASK-04 and TASK-05 complete.

### TASK-04: Add text-field compatibility surface in design-system
- **Type:** IMPLEMENT
- **Deliverable:** code-change in DS input/textarea primitives + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/input.tsx`, `packages/design-system/src/primitives/textarea.tsx`, `packages/design-system/src/primitives/__tests__/input.test.tsx`, `packages/design-system/src/primitives/__tests__/textarea.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - targeted primitive branching with test coverage.
  - Approach: 90% - compatibility mode avoids implicit FormField wrapper drift.
  - Impact: 85% - unlocks form migration while preserving existing DOM contracts.
- **Acceptance:**
  - Input and Textarea expose explicit compatibility mode that renders bare control semantics when requested.
  - Default FormField-wrapped behavior remains unchanged.
  - Validation and aria behavior is preserved across modes.
- **Validation contract (TC-04):**
  - TC-01: default mode snapshots unchanged for current DS tests.
  - TC-02: compatibility mode omits FormField wrapper and preserves passed className.
  - TC-03: `aria-invalid`, `aria-describedby`, and focus handlers work in both modes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Audit current Reception form call sites that rely on raw input DOM placement.
- **Edge Cases & Hardening:**
  - Ensure compatibility mode does not silently drop required/description semantics.
- **What would make this >=90%:**
  - Verified migration of one high-risk Reception form without snapshot or interaction drift.
- **Rollout / rollback:**
  - Rollout: additive mode with default unchanged.
  - Rollback: remove compatibility mode and affected wrapper exports.
- **Documentation impact:** update DS input/textarea primitive docs.
- **Notes / references:**
  - `packages/design-system/src/primitives/input.tsx`
  - `packages/design-system/src/primitives/textarea.tsx`
- **Build evidence (2026-02-23):**
  - Deliverables updated:
    - `packages/design-system/src/primitives/input.tsx`
    - `packages/design-system/src/primitives/textarea.tsx`
    - `packages/design-system/src/primitives/__tests__/input.test.tsx`
    - `packages/design-system/src/primitives/__tests__/textarea.test.tsx`
  - Acceptance coverage:
    - Explicit compatibility surface added on both primitives:
      - `InputProps.compatibilityMode` and `TextareaProps.compatibilityMode` with values `"default"` and `"no-wrapper"`.
    - Default FormField behavior preserved for `"default"` mode.
    - Compatibility mode renders bare control semantics (`<input>` / `<textarea>` without FormField wrapper).
  - `TC-04` validation:
    - `pnpm --filter @acme/design-system test -- src/primitives/__tests__/input.test.tsx src/primitives/__tests__/textarea.test.tsx` -> pass (`25` tests).
    - Added no-wrapper assertions in both suites covering:
      - wrapper omission + className passthrough (`TC-02`)
      - `aria-invalid`, `aria-describedby`, and focus/blur handlers in compatibility mode (`TC-03`)
      - existing default-mode tests unchanged (`TC-01`)
    - `pnpm --filter @acme/design-system typecheck` -> pass.
    - `pnpm --filter @acme/design-system lint` -> pass (non-blocking pre-existing warning in `packages/design-system/src/molecules/MediaSelector.tsx:47`).
  - Downstream confidence propagation:
    - TASK-06 reviewed with TASK-04 evidence.
    - Outcome: affirming but confidence unchanged until TASK-05 completes.

### TASK-05: Add button compatibility surface in design-system
- **Type:** IMPLEMENT
- **Deliverable:** code-change in DS button primitive + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/button.tsx`, `packages/design-system/src/primitives/__tests__/button.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - existing button already supports variants; compatibility mode is additive.
  - Approach: 85% - enables centralization without forced restyling.
  - Impact: 85% - critical for replacing high native button footprint safely.
- **Acceptance:**
  - Button exposes explicit compatibility mode for style-neutral passthrough behavior.
  - Default button styling/behavior remains unchanged.
  - Loading/disabled semantics stay intact in compatibility mode.
- **Validation contract (TC-05):**
  - TC-01: existing button variant snapshots remain unchanged.
  - TC-02: compatibility mode preserves caller-supplied classes without DS style injection.
  - TC-03: disabled/loading behavior still enforces accessibility attributes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Validate compatibility mode can replace native button usages with no class rewrites.
- **Edge Cases & Hardening:**
  - Verify icon-only and `asChild` usage do not regress in compatibility mode.
- **What would make this >=90%:**
  - One parity-route replacement using compatibility button with zero snapshot delta.
- **Rollout / rollback:**
  - Rollout: additive mode with default unchanged.
  - Rollback: remove compatibility mode and revert migrated call sites.
- **Documentation impact:** update DS button docs.
- **Notes / references:**
  - `packages/design-system/src/primitives/button.tsx`
- **Build evidence (2026-02-23):**
  - Deliverables updated:
    - `packages/design-system/src/primitives/button.tsx`
    - `packages/design-system/src/primitives/__tests__/button.test.tsx`
  - Acceptance coverage:
    - Explicit compatibility surface added: `ButtonProps.compatibilityMode` with values `"default"` and `"passthrough"`.
    - `"passthrough"` mode preserves caller-supplied classes without DS style injection (style-neutral path for migration).
    - Default mode behavior remains unchanged for existing button styling and variants.
  - `TC-05` validation:
    - `pnpm --filter @acme/design-system test -- src/primitives/__tests__/button.test.tsx` -> pass (`6` tests, including passthrough class preservation and loading/disabled semantics).
    - `pnpm --filter @acme/design-system typecheck` -> pass.
    - `pnpm --filter @acme/design-system lint` -> pass (non-blocking pre-existing warning in `packages/design-system/src/molecules/MediaSelector.tsx:47`).
  - Downstream confidence propagation:
    - TASK-06 reviewed with TASK-05 evidence.
    - Outcome: affirming; prerequisites for TASK-06 now complete (TASK-03, TASK-04, TASK-05).

### TASK-06: Publish Reception compatibility exports + deep import cleanup
- **Type:** IMPLEMENT
- **Deliverable:** shared export surface in `@acme/ui` for Reception compatibility primitives + Reception import path cleanup
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/components/organisms/operations/index.ts`, `packages/ui/src/components/organisms/operations/*`, `apps/reception/src/App.tsx`, `apps/reception/src/utils/toastUtils.ts`, `apps/reception/src/utils/__tests__/toastUtils.test.ts`
- **Depends on:** TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 85% - export plumbing and targeted Reception import swaps are straightforward.
  - Approach: 90% - central API surface eliminates deep import drift.
  - Impact: 85% - consolidates migration entrypoint for all later waves.
- **Acceptance:**
  - Reception compatibility wrappers are exported from a stable `@acme/ui` public entrypoint.
  - Reception NotificationCenter imports use public entrypoints only (no deep internals path).
  - All existing toast tests pass after import path migration.
- **Validation contract (TC-06):**
  - TC-01: `rg "@acme/ui/components/organisms/operations/NotificationCenter/NotificationCenter" apps/reception/src` returns zero matches.
  - TC-02: `pnpm --filter @apps/reception test -- --testPathPattern toastUtils` passes.
  - TC-03: `pnpm --filter @apps/reception typecheck` passes after export migration.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Confirm public exports needed by Reception are available from chosen entrypoint.
- **Edge Cases & Hardening:**
  - Preserve module resolution for existing CMS consumers of `@acme/ui/operations`.
- **What would make this >=90%:**
  - Package build and dependent app typecheck pass in one run with no import fallback usage.
- **Rollout / rollback:**
  - Rollout: additive exports then call-site swap.
  - Rollback: revert exports and restore prior import paths.
- **Documentation impact:** update any import guidance docs for Reception.
- **Notes / references:**
  - `apps/reception/src/App.tsx`
  - `apps/reception/src/utils/toastUtils.ts`

### TASK-07: Horizon checkpoint - reassess downstream migration assumptions
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/reception-ds-centralization-growth-first/plan.md`
- **Depends on:** TASK-02, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream tasks (TASK-08 through TASK-12)
  - confidence for downstream tasks recalibrated from latest evidence
  - plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - Compatibility primitives are sufficient to migrate parity routes without style drift.
  - Parity harness remains deterministic and non-flaky for wave gating.
- **Validation contract:** checkpoint output includes updated confidence and dependency notes.
- **Planning validation:** replan evidence path recorded in plan decision log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update at checkpoint.

### TASK-08: Wave 1 migration - parity route set
- **Type:** IMPLEMENT
- **Deliverable:** parity-route components migrated to shared compatibility wrappers with zero approved visual/interaction regressions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/Login.tsx`, `apps/reception/src/components/checkins/**/*`, `apps/reception/src/components/checkout/**/*`, `apps/reception/src/components/till/**/*`, `apps/reception/src/components/safe/**/*`
- **Depends on:** TASK-01, TASK-02, TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 75%
  - Implementation: 75% - coverage is broad across critical operational routes.
  - Approach: 85% - compatibility-first approach is validated and checkpoint-gated before this wave.
  - Impact: 75% - parity risk remains until wave execution evidence exists.
- **Acceptance:**
  - Native buttons/inputs/tables in Wave 1 scope are replaced with shared compatibility wrappers.
  - Parity harness reports zero unapproved diffs for locked route set.
  - Keyboard/modal workflows in Wave 1 pass parity tests.
- **Validation contract (TC-08):**
  - TC-01: Wave 1 parity suite passes with no unexpected snapshot changes.
  - TC-02: `git grep` native tag counts in Wave 1 scope decrease versus baseline inventory.
  - TC-03: `pnpm --filter @apps/reception lint` passes for touched files.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Reuse route-specific baseline fixtures from TASK-02.
- **Edge Cases & Hardening:**
  - Ensure focus management and modal escape behavior remain unchanged after wrapper swaps.
- **What would make this >=90%:**
  - One full Wave 1 migration run with parity green and zero rollback events.
- **Rollout / rollback:**
  - Rollout: merge only after parity green and reviewer sign-off on zero-diff exceptions list.
  - Rollback: revert entire wave if any locked route regression is unresolved in-wave.
- **Documentation impact:** update wave evidence log in artifacts.
- **Notes / references:**
  - `docs/plans/reception-ds-centralization-growth-first/artifacts/migration-inventory.md`

### TASK-09: Wave 2 migration - table-heavy operational routes
- **Type:** IMPLEMENT
- **Deliverable:** Wave 2 route group migrated to shared table compatibility wrappers with parity evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/reports/**/*`, `apps/reception/src/components/inventory/**/*`, `apps/reception/src/components/search/**/*`, `apps/reception/src/components/prime-requests/**/*`
- **Depends on:** TASK-01, TASK-02, TASK-06, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 75% - high-density table components have diverse cell layouts.
  - Approach: 85% - compatibility table mode directly addresses the known wrapper mismatch.
  - Impact: 75% - operational table regressions would be high-impact without full parity proof.
- **Acceptance:**
  - Wave 2 table-heavy routes use shared compatibility table primitives.
  - Route parity and interaction contracts pass for Wave 2 scope.
  - No visual drift is accepted without explicit waiver.
- **Validation contract (TC-09):**
  - TC-01: Wave 2 parity tests pass.
  - TC-02: Table hotspot files from inventory show native table tag reduction.
  - TC-03: No new deep imports or local table abstractions introduced.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Prioritize highest-count table files from inventory first.
- **Edge Cases & Hardening:**
  - Verify horizontal overflow behavior parity where previous wrapper assumptions existed.
- **What would make this >=90%:**
  - Wave 2 completed with parity green across all table-heavy routes and no rollback.
- **Rollout / rollback:**
  - Rollout: incremental commits per route cluster.
  - Rollback: revert route cluster commit if parity fails.
- **Documentation impact:** append Wave 2 evidence to artifacts.
- **Notes / references:**
  - hotspot list in inventory artifact.

### TASK-10: Wave 3 migration - form/modal-heavy operational routes
- **Type:** IMPLEMENT
- **Deliverable:** Wave 3 route group migrated to shared input/textarea/button compatibility wrappers with parity evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/prepayments/**/*`, `apps/reception/src/components/docInsert/**/*`, `apps/reception/src/components/loans/**/*`, `apps/reception/src/components/man/**/*`, `apps/reception/src/components/common/**/*`
- **Depends on:** TASK-01, TASK-02, TASK-06, TASK-09
- **Blocks:** TASK-11
- **Confidence:** 75%
  - Implementation: 75% - modal and form coupling complexity is high.
  - Approach: 85% - compatibility modes target the identified wrapper mismatch with prior primitive coverage.
  - Impact: 75% - workflow regressions are possible without strict interaction parity.
- **Acceptance:**
  - Wave 3 form/modal-heavy components use shared compatibility wrappers.
  - Interaction parity tests (keyboard/focus/close semantics) pass.
  - Local form/button primitives in migrated scope are retired.
- **Validation contract (TC-10):**
  - TC-01: Wave 3 parity suite passes.
  - TC-02: form/modal interaction tests pass for migrated components.
  - TC-03: native button/input/select/textarea usage drops in Wave 3 scope.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Ensure each modal flow has deterministic fixture data before migration.
- **Edge Cases & Hardening:**
  - Verify focus trap and escape-key behavior in modal conversions.
- **What would make this >=90%:**
  - Full Wave 3 completion with parity green and no interaction regressions.
- **Rollout / rollback:**
  - Rollout: per-feature cluster merges with parity evidence attached.
  - Rollback: revert cluster if modal interaction contract fails.
- **Documentation impact:** append Wave 3 evidence to artifacts.
- **Notes / references:**
  - Wave boundaries from TASK-01 artifact.

### TASK-11: Wave 4 migration - remaining routes + local UI retirement
- **Type:** IMPLEMENT
- **Deliverable:** remaining Reception route scopes migrated; app-local UI building blocks removed or converted into shared wrappers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/bar/**/*`, `apps/reception/src/components/live/**/*`, `apps/reception/src/components/emailAutomation/**/*`, `apps/reception/src/components/roomgrid/**/*`, `apps/reception/src/components/stats/**/*`, `apps/reception/src/components/appNav/**/*`, `apps/reception/src/components/analytics/**/*`, `apps/reception/src/components/prepare/**/*`
- **Depends on:** TASK-01, TASK-02, TASK-06, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 75% - residual route set includes mixed UI patterns.
  - Approach: 85% - shared compatibility layer and prior wave evidence reduce approach uncertainty.
  - Impact: 75% - broad touch surface still needs strict parity validation.
- **Acceptance:**
  - All remaining route groups migrate to shared wrappers where applicable.
  - Inventory marks 100% route coverage.
  - App-local hand-rolled reusable UI building blocks are removed or delegated to shared packages.
- **Validation contract (TC-11):**
  - TC-01: parity suites pass for Wave 4 scope.
  - TC-02: inventory check confirms all routes assigned and completed.
  - TC-03: no new local reusable UI primitives are introduced in Reception.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Confirm route-specific exceptions list is explicit and minimal.
- **Edge Cases & Hardening:**
  - Protect route-level keyboard shortcuts and auth-gated rendering behavior.
- **What would make this >=90%:**
  - Inventory closed with full parity pass and zero unresolved regression exceptions.
- **Rollout / rollback:**
  - Rollout: route-cluster merges with parity gates.
  - Rollback: route-cluster revert on unresolved parity regression.
- **Documentation impact:** finalize migration inventory with completion markers.
- **Notes / references:**
  - `docs/plans/reception-ds-centralization-growth-first/artifacts/migration-inventory.md`

### TASK-12: Escalate Reception DS lint rules after full parity coverage
- **Type:** IMPLEMENT
- **Deliverable:** Reception lint posture upgraded from phased/off to enforced for structural DS rules
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `eslint.config.mjs`, `apps/reception/src/**/*`
- **Depends on:** TASK-11
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - config changes are straightforward after migration completion.
  - Approach: 90% - governance should be escalated only after parity-proven migration.
  - Impact: 85% - closes centralization loop and prevents regression to local UI.
- **Acceptance:**
  - `ds/enforce-layout-primitives` for Reception is enabled.
  - `ds/no-arbitrary-tailwind` for Reception is escalated per final post-migration policy.
  - Any temporary rule exceptions are removed or documented as narrowly scoped justified exceptions.
- **Validation contract (TC-12):**
  - TC-01: `pnpm --filter @apps/reception lint --max-warnings=0` passes.
  - TC-02: no broad Reception `ds/*` rule disable blocks remain in lint config.
  - TC-03: parity harness still passes under final lint posture.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:**
  - Confirm no wave-scoped migrations are pending before rule escalation.
- **Edge Cases & Hardening:**
  - Avoid all-or-nothing escalation before inventory completion.
- **What would make this >=90%:**
  - A full clean run of typecheck + lint + parity suites with no temporary suppressions.
- **Rollout / rollback:**
  - Rollout: escalate rules only in final merge after parity green.
  - Rollback: revert lint escalation commit if parity or operational validation fails.
- **Documentation impact:** update Reception DS migration closure notes.
- **Notes / references:**
  - `eslint.config.mjs`

## Risks & Mitigations
- Shared compatibility API overfits Reception-only patterns.
  - Mitigation: keep compatibility props generic and documented in DS primitives, not route-specific hacks.
- Parity harness flakiness undermines confidence.
  - Mitigation: deterministic fixtures/mocks and explicit snapshot update protocol.
- Migration waves accidentally change route behavior.
  - Mitigation: mandatory parity gate and pre-committed wave rollback trigger.
- Lint escalation happens before true migration completion.
  - Mitigation: Task dependency requires completion of all migration waves before TASK-12.

## Observability
- Logging:
  - Per-wave migration result summary logged in plan artifacts.
- Metrics:
  - Native tag count deltas per wave.
  - Parity test pass/fail counts per wave.
  - Route coverage completion percentage from migration inventory.
- Alerts/Dashboards:
  - CI failure on parity suites or lint escalation commands.

## Acceptance Criteria (overall)
- [ ] Compatibility-first DS/UI surface is added before route migration begins.
- [ ] Locked parity route set shows zero unapproved visual/interaction regressions in every wave.
- [ ] Deep NotificationCenter imports are removed from Reception.
- [ ] Route inventory shows complete migration coverage across all Reception routes.
- [ ] App-local reusable UI building blocks are retired or delegated to shared packages.
- [ ] Reception DS lint structural governance is enabled after migration completion.

## Decision Log
- 2026-02-23: Planning mode set to `plan-only` (no auto-build handoff requested).
- 2026-02-23: Adopted default parity route set from fact-find for execution gating: unauthenticated login state on `/bar`, plus `/checkin`, `/checkout`, `/till-reconciliation`, `/safe-management`.
- 2026-02-23: Chose growth-first compatibility expansion over direct codemod replacement based on probe breakage evidence.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Task confidences:
  - TASK-01 85
  - TASK-02 85
  - TASK-03 85
  - TASK-04 85
  - TASK-05 85
  - TASK-06 85
  - TASK-07 95
  - TASK-08 75
  - TASK-09 75
  - TASK-10 75
  - TASK-11 75
  - TASK-12 85
- Weighted sum: `990`
- Weight sum: `12`
- Raw weighted average: `82.5%`
- Overall-confidence: `82%` (downward bias applied)

## Section Omission Rule
- None: all standard sections are relevant for this plan.
