---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-roomgrid-external-package-removal
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-refactor
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Reception RoomGrid External Package Removal Plan

## Summary
This plan removes `@daminort/reservation-grid` from Reception without losing any upstream capability. The approach is to treat the audited upstream GitHub feature set as a hard compatibility contract, canonicalize one internal grid engine to satisfy that contract, prove parity with focused low-memory tests, then remove package/shim residue. This avoids the long-term risk of feature regression hidden behind dependency cleanup while also reducing external lock-in. The execution is intentionally sequenced with a checkpoint before test and dependency removal tasks to prevent drift from dual local implementations.

## Active tasks
- [x] TASK-01: Freeze upstream capability contract for internal parity
- [x] TASK-02: Canonicalize internal RoomGrid engine to full upstream-compatible API
- [x] TASK-05: Horizon checkpoint - reassess downstream parity/removal tasks
- [x] TASK-03: Add capability-contract test suite (low-memory-safe)
- [x] TASK-04: Remove external dependency residue and enforce import guard

## Goals
- Preserve the upstream `@daminort/reservation-grid` capability set as an internal contract.
- Keep `/rooms-grid` runtime behavior stable for current Reception usage.
- Remove `@daminort/reservation-grid` dependency and stale ambient declarations from Reception.
- Add regression gates so future changes cannot silently reduce RoomGrid capabilities.

## Non-goals
- UI redesign of the room grid.
- Rewriting booking aggregation (`useGridData`) beyond capability-parity needs.
- Broad refactor of unrelated Reception routes/components.

## Constraints & Assumptions
- Constraints:
  - Validation must stay memory-safe (single-file tests, no broad suite fan-out).
  - Current repo has concurrent unrelated changes; this plan must keep change scope isolated.
  - Operational route stability for `/rooms-grid` is mandatory.
- Assumptions:
  - Full upstream parity is the target (default from fact-find).
  - Existing local parity assets under `components/roomgrid/components/*` can be promoted safely.

## Fact-Find Reference
- Related brief: `docs/plans/reception-roomgrid-external-package-removal/fact-find.md`
- Key findings used:
  - Runtime no longer imports `@daminort/reservation-grid`, but dependency/shim residue remains.
  - Upstream capability matrix identifies preserved, missing, and reduced runtime features.
  - Two overlapping local grid implementations currently exist, creating drift risk.

## Proposed Approach
- Option A: Minimal dependency cleanup only (remove package/shims now).
  - Pros: quick cleanup.
  - Cons: risks silently dropping upstream capabilities that are currently not surfaced in runtime.
- Option B: Capability-first cleanup (chosen).
  - Pros: prevents regression debt; creates enforceable parity contract; still enables package removal.
  - Cons: more upfront work (engine canonicalization + tests).
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Freeze audited upstream capability contract as execution baseline | 90% | M | Complete | - | TASK-02 |
| TASK-02 | IMPLEMENT | Canonicalize internal RoomGrid engine to upstream-compatible API/behavior | 85% | L | Complete | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess readiness before parity tests and dependency/shim removal | 95% | S | Complete | TASK-02 | TASK-03 |
| TASK-03 | IMPLEMENT | Add capability-contract tests for parity and regression protection | 85% | M | Complete | TASK-05 | TASK-04 |
| TASK-04 | IMPLEMENT | Remove package/shim residue and enforce static reintroduction guard | 85% | M | Complete | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish immutable capability target before code edits. |
| 2 | TASK-02 | TASK-01 | Canonicalize implementation path before tests/removal. |
| 3 | TASK-05 | TASK-02 | Checkpoint to avoid executing stale downstream assumptions. |
| 4 | TASK-03 | TASK-05 | Add parity tests after canonical engine is stable. |
| 5 | TASK-04 | TASK-03 | Remove external residue only after tests prove parity. |

## Tasks

### TASK-01: Freeze upstream capability contract for internal parity
- **Type:** IMPLEMENT
- **Deliverable:** code-change + artifact `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `docs/plans/reception-roomgrid-external-package-removal/fact-find.md`, `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% - upstream capability map is already audited and source-backed.
  - Approach: 95% - freezing contract first prevents drift and scope confusion.
  - Impact: 90% - provides explicit acceptance baseline for all downstream tasks.
- **Acceptance:**
  - Upstream capability set is documented as a normalized checklist with status (`preserved`, `missing`, `reduced`) and required remediation.
  - Each capability row maps to at least one planned verification point in TASK-03.
  - No capability is silently excluded; any intentional deferment is explicitly marked with risk.
- **Validation contract (TC-01):**
  - TC-01: Contract rows trace to upstream GitHub source locations and current Reception files.
  - TC-02: Contract includes execution owner task mapping for each row.
  - TC-03: Edge case - overlapping-period semantics and multi-status payload are explicitly represented as must-pass, not optional.
- **Execution plan:** Red -> Green -> Refactor
  - Red: capability expectations exist only in narrative form.
  - Green: contract artifact created with one-to-one upstream/local mapping.
  - Refactor: collapse duplicate capability wording into canonical terms used by tests.
- **Planning validation (required for M/L):**
  - Checks run:
    - `npm view @daminort/reservation-grid repository.url version dist-tags --json`
    - Source audit of upstream repo (`Grid.interface.ts`, `Grid.tsx`, `dateUtils.ts`, `theme.ts`, `locales.ts`).
    - Source audit of local runtime and legacy parity files under `apps/reception/src/components/roomgrid`.
  - Validation artifacts:
    - `docs/plans/reception-roomgrid-external-package-removal/fact-find.md`
    - `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`
  - Unexpected findings:
    - Active runtime path is capability-reduced compared with both upstream and local legacy parity path.
  - New outputs check:
    - New artifact output: `upstream-capability-contract.md`.
    - Consumers: TASK-02 (implementation scope), TASK-03 (test contract), TASK-04 (removal gate evidence).
  - Modified behavior check:
    - None: this task is contract definition only.
- **Scouts:** None: evidence is already gathered and version-pinned to `3.0.0`.
- **Edge Cases & Hardening:**
  - Freeze upstream reference as `@daminort/reservation-grid@3.0.0` to avoid moving-target criteria.
- **What would make this >=90%:**
  - Already 90%. To sustain: include explicit line-level references for every capability row.
- **Rollout / rollback:**
  - Rollout: add contract artifact and link it from plan.
  - Rollback: remove artifact if consensus rejects parity scope.
- **Documentation impact:**
  - Add `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`.
- **Notes / references:**
  - Upstream repo: `https://github.com/daminort/reservation-grid`
  - TASK-01 artifact completed: `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md` (line-level upstream/local mapping + VC-01..VC-09).

### TASK-02: Canonicalize internal RoomGrid engine to full upstream-compatible API
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/components/roomgrid/*` to expose and honor upstream-compatible props/behavior from a single canonical engine
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete
- **Affects:** `apps/reception/src/components/roomgrid/ReservationGrid.tsx`, `apps/reception/src/components/roomgrid/GridCell.tsx`, `apps/reception/src/components/roomgrid/RoomGrid.tsx`, `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx`, `apps/reception/src/components/roomgrid/components/Row/Row.tsx`, `apps/reception/src/components/roomgrid/interfaces/grid.interface.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - local parity-capable assets already exist and can be promoted.
  - Approach: 90% - canonical single-engine approach directly addresses drift risk.
  - Impact: 85% - restores missing/reduced capabilities while keeping runtime route stable.
- **Acceptance:**
  - Active runtime `ReservationGrid` exposes compatibility props: `showInfo`, `info`, `selectedRows`, `selectedColumns`, `onClickTitle`, `renderTitle`, `renderInfo`, full `theme` surface.
  - Day semantics include multi-period overlap/intersection behavior and multi-value `dayStatus[]` payload when applicable.
  - Existing `RoomGrid` caller behavior remains compatible (modal flow unaffected).
  - One canonical engine path is selected; duplicate alternative runtime path is not left active.
- **Validation contract (TC-02):**
  - TC-01: Happy path - current `RoomGrid` usage renders as before and still opens `BookingDetailsModal` on double-click behavior.
  - TC-02: Capability path - enabling `showInfo`, selection props, and render callbacks changes rendering according to contract.
  - TC-03: Edge path - overlapping periods emit intersection-compatible `dayType` and complete `dayStatus[]`.
  - TC-04: Failure path - invalid locale key falls back safely to `en` without runtime crash.
- **Execution plan:** Red -> Green -> Refactor
  - Red: active runtime API/behavior does not satisfy full upstream contract.
  - Green: canonical engine implements full capability set and preserves current caller behavior.
  - Refactor: remove dual-path drift by consolidating shared logic into one source.
- **Planning validation (required for M/L):**
  - Checks run:
    - Upstream API and behavior audit from `src/lib/components/Grid/*`, `src/lib/utils/dateUtils/dateUtils.ts`.
    - Local active runtime audit in `ReservationGrid.tsx` and `GridCell.tsx`.
    - Local legacy parity audit in `components/roomgrid/components/*`.
  - Validation artifacts:
    - `docs/plans/reception-roomgrid-external-package-removal/fact-find.md`
    - TASK-01 contract artifact.
  - Unexpected findings:
    - Active runtime currently omits/degrades several upstream capabilities.
  - New outputs check:
    - New/expanded outputs: compatibility props + richer click payload semantics.
    - Consumers:
      - `apps/reception/src/components/roomgrid/RoomGrid.tsx` (primary runtime caller).
      - `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx` (mocked prop shape expectations).
      - TASK-03 capability tests (new consumer for explicit contract behavior).
  - Modified behavior check:
    - Modified semantics: day typing/payload generation for overlaps.
    - Callers impacted: `RoomGrid.tsx` modal data extraction and any tests mocking click payload.
    - Plan coverage: TASK-02 updates callers; TASK-03 asserts backward compatibility and new capability behavior.
- **Scouts:**
  - Confirm whether canonicalization should preserve `@acme/ui/operations` table primitives or fall back to native table elements; keep one path only.
- **Edge Cases & Hardening:**
  - Overlapping periods with >2 statuses.
  - Period boundaries at checkout date (`[start,end)` behavior).
  - Empty `theme` and missing `date.status` keys.
- **What would make this >=90%:**
  - Complete TASK-03 capability tests and verify no behavioral regression in existing `RoomGrid` tests.
- **Rollout / rollback:**
  - Rollout: introduce canonical engine behind existing runtime export path first.
  - Rollback: revert engine canonicalization commit; keep pre-existing active runtime.
- **Documentation impact:**
  - Update contract artifact status rows for implemented capabilities.
- **Notes / references:**
  - Upstream API: `/tmp/reservation-grid-audit.T09nTt/src/lib/components/Grid/Grid.interface.ts`
  - Implementation evidence:
    - `apps/reception/src/components/roomgrid/ReservationGrid.tsx` now routes active export through canonical `Grid`.
    - `apps/reception/src/utils/dateUtils.ts` now emits overlap-compatible `dayType` and `dayStatus[]`.
    - `apps/reception/src/components/roomgrid/hooks/useDaysRange/useDaysRange.ts` now falls back to `en` for unknown locale keys.
    - Scoped validation pass: `pnpm --filter @apps/reception typecheck`, `pnpm --filter @apps/reception lint`, and focused roomgrid tests (`RoomGrid`, `RoomsGrid`, `RoomGridLayout`, `DayVariants`).

### TASK-05: Horizon checkpoint - reassess downstream parity/removal tasks
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if checkpoint assumptions fail
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete
- **Affects:** `docs/plans/reception-roomgrid-external-package-removal/plan.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is deterministic.
  - Approach: 95% - prevents executing tests/removal against stale architecture assumptions.
  - Impact: 95% - limits wasted work and regression risk.
- **Acceptance:**
  - Canonical engine path is explicitly confirmed.
  - Downstream TASK-03 and TASK-04 assumptions are re-validated.
  - If assumptions shifted, `/lp-do-replan` updates downstream tasks before execution continues.
- **Horizon assumptions to validate:**
  - `ReservationGrid` runtime export now maps to the canonical parity-capable engine.
  - Existing `RoomGrid` event-handling compatibility is still intact.
- **Validation contract:**
  - Checkpoint note added to plan with pass/fail decision and any required task edits.
- **Checkpoint note (2026-02-23):**
  - Result: **Pass**
  - Assumption 1 confirmed: active `ReservationGrid` export maps to canonical parity-capable `Grid`.
  - Assumption 2 confirmed: existing `RoomGrid` modal interaction compatibility remains intact in focused tests.
  - Downstream edits required: none; TASK-03 and TASK-04 remain valid as sequenced.
- **Planning validation:**
  - Re-read TASK-02 diff scope and verify downstream dependencies remain accurate.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - Update this plan if downstream sequencing or confidence changes.

### TASK-03: Add capability-contract test suite (low-memory-safe)
- **Type:** IMPLEMENT
- **Deliverable:** code-change tests under `apps/reception/src/components/roomgrid/__tests__/` + optional hook assertions in `apps/reception/src/hooks/data/roomgrid/__tests__/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx`, `apps/reception/src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx`, `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx`, `apps/reception/jest.config.cjs`
- **Depends on:** TASK-05
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - component seams are testable and existing suite provides patterns.
  - Approach: 90% - contract tests are the direct proof of carry-forward requirement.
  - Impact: 85% - protects against future silent capability regressions.
- **Acceptance:**
  - Tests cover upstream capability rows marked missing/reduced in fact-find matrix.
  - Tests assert intersection/multi-status behavior where overlapping periods exist.
  - Tests validate optional props (`showInfo`, selection, title/info render callbacks, title click callback).
  - Tests are runnable in low-memory mode as single-file invocations.
- **Validation contract (TC-03):**
  - TC-01: `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` passes.
  - TC-02: `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx` passes.
  - TC-03: Existing focused regressions still pass:
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomGrid.test.tsx`
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomsGrid.test.tsx`
  - TC-04: Edge case - overlapping periods expected to produce intersection-compatible payload assertions.
- **Execution plan:** Red -> Green -> Refactor
  - Red: capability parity cannot be proven automatically.
  - Green: focused tests encode required capabilities and pass.
  - Refactor: deduplicate test fixtures/utilities to keep maintenance cost low.
- **Planning validation (required for M/L):**
  - Checks run:
    - Existing roomgrid test inventory and patterns in `__tests__/` directories.
  - Validation artifacts:
    - `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx`
    - `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts`
  - Unexpected findings:
    - Existing tests heavily mock `ReservationGrid`; direct capability coverage is currently thin.
  - New outputs check:
    - New outputs: capability-contract tests and fixtures.
    - Consumers: CI test jobs, TASK-04 removal gate.
  - Modified behavior check:
    - If TASK-02 updates prop/event semantics, these tests are the canonical consumer and regression detector.
- **Scouts:** None: test insertion points are clear.
- **Edge Cases & Hardening:**
  - Ensure tests do not require broad suite execution or non-deterministic timers.
- **What would make this >=90%:**
  - Demonstrate green runs for all capability test files + existing focused roomgrid tests in one pass.
- **Rollout / rollback:**
  - Rollout: add tests first; run them file-by-file.
  - Rollback: revert added tests if they prove flaky/non-deterministic; reintroduce with deterministic fixtures.
- **Documentation impact:**
  - Update contract artifact with test evidence references.
- **Notes / references:**
  - Memory safety policy: avoid broad test fan-out.
  - Implemented tests:
    - `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx`
    - `apps/reception/src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx`
  - Validation evidence:
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx`
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/GridCell.capabilities.test.tsx`
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomGrid.test.tsx`
    - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomsGrid.test.tsx`

### TASK-04: Remove external dependency residue and enforce import guard
- **Type:** IMPLEMENT
- **Deliverable:** code-change in dependency manifests/lockfile and local shims + static guard docs/checks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `apps/reception/package.json`, `pnpm-lock.yaml`, `apps/reception/src/types/daminort__reservation-grid.d.ts`, `apps/reception/src/types/reservation-grid.d.ts`, `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - removal steps are straightforward once parity tests pass.
  - Approach: 90% - delayed removal after parity proof minimizes regression risk.
  - Impact: 85% - simplifies dependency graph and formalizes internal ownership.
- **Acceptance:**
  - `@daminort/reservation-grid` removed from `apps/reception/package.json`.
  - Lockfile updated with no active Reception dependency path for the package.
  - Ambient module shims for `@daminort/reservation-grid` removed when no consumers remain.
  - Static guard command is documented and used in validation evidence.
- **Validation contract (TC-04):**
  - TC-01: `rg -n "from ['\\\"]@daminort/reservation-grid['\\\"]|require\\(['\\\"]@daminort/reservation-grid['\\\"]\\)|import\\(['\\\"]@daminort/reservation-grid['\\\"]\\)" apps/reception/src -S` returns no matches.
  - TC-02: `rg -n "declare module \"@daminort/reservation-grid\"" apps/reception/src -S` returns no matches.
  - TC-03: `pnpm --filter @apps/reception typecheck` passes.
  - TC-04: TASK-03 focused capability tests remain green after removal.
- **Execution plan:** Red -> Green -> Refactor
  - Red: package/shims still present.
  - Green: dependency/shim residue removed with passing checks.
  - Refactor: tighten docs/guard references to prevent reintroduction.
- **Planning validation (required for M/L):**
  - Checks run:
    - Repo-wide residual reference checks for `@daminort/reservation-grid`.
    - Local type-shim audits under `apps/reception/src/types`.
  - Validation artifacts:
    - `docs/plans/reception-roomgrid-external-package-removal/fact-find.md`
    - `apps/reception/package.json`
    - `pnpm-lock.yaml`
  - Unexpected findings:
    - Dependency residue persists despite no runtime imports.
  - New outputs check:
    - New outputs: clean manifest/lockfile + guard command evidence.
    - Consumers: `pnpm` resolution, CI validation scripts, future contributors.
  - Modified behavior check:
    - None expected at runtime; this task should only remove unused external dependency artifacts.
- **Scouts:**
  - Verify no non-runtime build tooling still depends on module declaration shims.
- **Edge Cases & Hardening:**
  - If hidden shim consumers exist, reclassify with `/lp-do-replan` before force-removal.
- **What would make this >=90%:**
  - Confirm clean typecheck/lint and capability test pass after residue removal in one validation pass.
- **Rollout / rollback:**
  - Rollout: remove dependency/shims in one atomic commit after test proof.
  - Rollback: revert that commit if any regression appears.
- **Documentation impact:**
  - Update contract artifact to `all capabilities preserved; external package removed` state.
- **Notes / references:**
  - Keep historical docs untouched; only active runtime/dependency state changes.
  - Implementation evidence:
    - `apps/reception/package.json` dependency removal + guard script `guard:no-external-reservation-grid`.
    - `apps/reception/src/types/daminort__reservation-grid.d.ts` removed.
    - `apps/reception/src/types/reservation-grid.d.ts` removed.
  - Validation evidence:
    - `pnpm --filter @apps/reception guard:no-external-reservation-grid`
    - `pnpm --filter @apps/reception typecheck`
    - `pnpm --filter @apps/reception lint`

## Risks & Mitigations
- Capability regression hidden behind cleanup:
  - Mitigation: enforce TASK-01 contract + TASK-03 capability tests before TASK-04 removal.
- Dual-engine drift persists:
  - Mitigation: TASK-02 canonicalization and TASK-05 checkpoint gate.
- Memory pressure from validation:
  - Mitigation: single-file test execution and scoped package checks only.
- Hidden compile-time dependency on ambient shims:
  - Mitigation: explicit shim search and typecheck before/after removal.

## Observability
- Logging:
  - None: no new runtime logging expected.
- Metrics:
  - Track parity test pass/fail and regression incidents on `/rooms-grid`.
- Alerts/Dashboards:
  - None: use CI/job output and ops issue tracking for first-week monitoring.

## Acceptance Criteria (overall)
- [x] Upstream capability matrix is converted into an internal, test-backed contract.
- [x] Active runtime grid path supports full required parity behavior and API.
- [x] `@daminort/reservation-grid` dependency and ambient shims are removed from active Reception code.
- [x] Focused low-memory validation contracts (TC-01..TC-04) pass.

## Decision Log
- 2026-02-23: Selected capability-first removal strategy (Option B) over minimal cleanup.
- 2026-02-23: Adopted default target of full upstream parity compatibility for internal RoomGrid contract.
- 2026-02-23: Sequenced with checkpoint before test/removal tasks to prevent drift execution.
- 2026-02-23: Completed TASK-03 capability tests and TASK-04 dependency/shim removal with scoped validation green.

## Overall-confidence Calculation
- Task overall confidence values (min rule):
  - TASK-01: 90 (M=2)
  - TASK-02: 85 (L=3)
  - TASK-05: 95 (S=1)
  - TASK-03: 85 (M=2)
  - TASK-04: 85 (M=2)
- Weighted calculation:
  - `(90*2 + 85*3 + 95*1 + 85*2 + 85*2) / (2+3+1+2+2)`
  - `= 870 / 10 = 87%`

## Section Omission Rule
- None: all template sections are relevant for this plan.
