---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-roomgrid-external-package-removal
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-refactor
Related-Plan: docs/plans/reception-roomgrid-external-package-removal/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: operator requested removal of external RoomView grid package from Reception and explicit carry-forward of upstream capability set
---

# Reception RoomGrid External Package Removal Fact-Find Brief

## Scope
### Summary
Assess and define a safe path to stop using the external `@daminort/reservation-grid` package for Reception RoomView (`/rooms-grid`) while preserving current behavior and carrying forward the upstream package capability set as an internal contract.

### Goals
- Remove active dependency on `@daminort/reservation-grid` from Reception.
- Keep `/rooms-grid` behavior unchanged (data mapping, cell click semantics, modal flow, styling).
- Preserve the upstream `@daminort/reservation-grid` capabilities in an internal implementation contract so future use-cases are not reduced.
- Remove stale compatibility shims only after capability parity is proven.

### Non-goals
- Redesigning the rooms grid UI.
- Rewriting the booking/guest/activity data aggregation pipeline.
- Broad refactor of unrelated Reception flows.

### Constraints & Assumptions
- Constraints:
  - Reception is an operational tool; `/rooms-grid` is reachable from main nav and dashboard quick actions.
  - Validation must be memory-conscious (operator constraint), so no broad test fan-out.
- Assumptions:
  - Runtime code no longer imports `@daminort/reservation-grid` directly.
  - Local `ReservationGrid` implementation is currently production source of truth for `/rooms-grid`.

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/rooms-grid/page.tsx` - route entry (`force-dynamic`) for rooms grid.
- `apps/reception/src/app/rooms-grid/RoomsGridClient.tsx` - client wrapper + provider stack.
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` - room-range inputs and per-room rendering loop.
- `apps/reception/src/components/roomgrid/RoomGrid.tsx` - per-room grid render + modal open semantics.
- `apps/reception/src/components/appNav/AppNav.tsx` - operations nav route to `/rooms-grid`.
- `apps/reception/src/components/dashboard/DashboardQuickActions.tsx` - quick-action route to `/rooms-grid`.

### Key Modules / Files
- `apps/reception/package.json` - still declares `"@daminort/reservation-grid": "^3.0.0"`.
- `pnpm-lock.yaml:3702` - package lock entry for `@daminort/reservation-grid@3.0.0`.
- `pnpm-lock.yaml:18621` - resolved dependency graph under `@daminort` node includes test/build transitive deps.
- `apps/reception/src/components/roomgrid/ReservationGrid.tsx` - active local replacement with reduced prop/API surface.
- `apps/reception/src/components/roomgrid/GridCell.tsx` - active per-cell logic (single matching period, simplified day type).
- `apps/reception/src/components/roomgrid/RoomGrid.tsx` - active runtime consumer of local `ReservationGrid`.
- `apps/reception/src/components/roomgrid/components/Grid/Grid.interface.ts` - local legacy parity-style grid props (includes `showInfo`, selection, renderers).
- `apps/reception/src/components/roomgrid/components/Row/Row.tsx` - legacy implementation path still supports richer semantics (title click, selection, day variants).
- `apps/reception/src/types/daminort__reservation-grid.d.ts` - ambient module shim re-exporting local `_g` implementation.
- `apps/reception/src/types/reservation-grid.d.ts` - second ambient module shim for `@daminort/reservation-grid`.

### Verification Snapshot (2026-02-23)
- Runtime import audit:
  - Command: `rg -n "from ['\\\"]@daminort/reservation-grid['\\\"]|require\\(['\\\"]@daminort/reservation-grid['\\\"]\\)|import\\(['\\\"]@daminort/reservation-grid['\\\"]\\)" apps/reception/src -S`
  - Observed: no matches.
- Residual-reference audit:
  - Command: `rg -n "@daminort/reservation-grid" -S .`
  - Observed: references remain in `apps/reception/package.json`, `pnpm-lock.yaml`, two local `*.d.ts` files, and historical docs.
- Local replacement confirmation:
  - `apps/reception/src/components/roomgrid/ReservationGrid.tsx` explicitly documents custom replacement.
- Upstream source confirmation:
  - Registry points to `https://github.com/daminort/reservation-grid` (`npm view @daminort/reservation-grid repository.url`).
  - Latest and pinned version align at `3.0.0` (`npm view ... version`, `dist-tags.latest`).

### Patterns & Conventions Observed
- Active runtime path uses a simplified local component stack (`RoomsGrid -> RoomGrid -> ReservationGrid -> GridCell`).
- A richer legacy local implementation still exists under `components/roomgrid/components/*` and mirrors upstream model with additional extensions.
- The codebase currently has two overlapping local implementations, increasing drift risk.

### Data & Contracts
- Active UI contract:
  - `ReservationGridProps` in `apps/reception/src/components/roomgrid/ReservationGrid.tsx` includes `start`, `end`, `data`, `theme["date.status"]`, `highlightToday`, `locale`, `title`, `onClickCell`.
- Active event contract:
  - `TClickCellEventData` in active grid reports `dayType` as `free|busy|arrival|departure|string`, but current `GridCell` logic emits `arrival|busy|free` only.
- Grid data contract:
  - `GridReservationRow` and `TBookingPeriod` in `apps/reception/src/hooks/data/roomgrid/useGridData.ts`.
  - Period overlap semantics use `[start, end)` and `dateRangesOverlap`.
- Data-source contract:
  - Firebase realtime nodes (`bookings`, `guestsDetails`, `guestByRoom`, `activities`) via data hooks.

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase subscription hooks and auth/provider app shell (`App`/`Providers`).
  - `@acme/ui/operations` table/input/select/button primitives.
  - Date utilities in `apps/reception/src/utils/dateUtils.ts`.
- Downstream dependents:
  - `/rooms-grid` route consumers from app nav and dashboard quick actions.
  - Booking-details modal flow triggered from room cell interaction.
- Likely blast radius for package removal + parity hardening:
  - `apps/reception/package.json` + lockfile.
  - Local roomgrid implementation files (active and/or legacy parity path).
  - Ambient module shims and type consumers.
- Security/performance boundaries:
  - Auth boundaries in `apps/reception/src/App.tsx` are unchanged by this work.
  - Hot path remains room x booking aggregation in `useGridData`; dependency removal alone does not optimize it.

### Test Landscape
#### Test Infrastructure
- Jest per package (`apps/reception/package.json` script runs `--runInBand` by default).
- Roomgrid-focused tests exist under:
  - `apps/reception/src/components/roomgrid/__tests__/`
  - `apps/reception/src/hooks/data/roomgrid/__tests__/`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| RoomGrid modal and interaction logic | Unit (component) | `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx` | Mocks `ReservationGrid`; validates dbl-click/modal behavior and classes. |
| RoomsGrid date-range wiring | Unit (component) | `apps/reception/src/components/roomgrid/__tests__/RoomsGrid.test.tsx` | Mocks data hook and RoomGrid child rendering. |
| Row packing/data mapping | Unit (hook) | `apps/reception/src/hooks/data/roomgrid/__tests__/useGridData.test.ts` | Validates overlap packing and metadata filtering. |
| Legacy parity grid internals | Unit (component) | `apps/reception/src/components/roomgrid/__tests__/GridComponents.test.tsx` | Exercises legacy `components/Grid` + context stack. |

#### Coverage Gaps
- No direct non-mocked test for active `ReservationGrid.tsx` + `GridCell.tsx` render semantics.
- No explicit capability-contract tests for upstream features (`showInfo`, selection highlights, `renderTitle`, intersection day typing).
- No guard test asserting “no runtime imports of `@daminort/reservation-grid`”.
- This session intentionally avoided full/broad Jest execution (operator memory constraint).

#### Testability Assessment
- Easy to test:
  - Static import gates (`rg`) and package manifest/lockfile checks.
  - Single-file Jest runs for key roomgrid tests.
- Hard to test:
  - Broad suite execution under memory pressure.
- Test seams needed:
  - Capability-contract tests that encode upstream API/behavior as acceptance criteria.

#### Recommended Test Approach
- Static gates (always):
  - `rg -n "@daminort/reservation-grid" apps/reception/src apps/reception/package.json`
- Focused Jest (memory-safe):
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomGrid.test.tsx`
  - `pnpm --filter @apps/reception test -- src/components/roomgrid/__tests__/RoomsGrid.test.tsx`
  - `pnpm --filter @apps/reception test -- src/hooks/data/roomgrid/__tests__/useGridData.test.ts`
- Package checks:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`

### Recent Git History (Targeted)
- `d7dc02290a` (2026-02-23), `85f8c13a05` (2026-02-23), `b34bd90c1d` (2026-02-23), `39b9863cfb` (2026-02-23): broad workspace/chore commits touching this area; no dedicated roomgrid dependency cleanup commit.
- Historical evidence already states package replacement intent:
  - `docs/plans/archive/ds-reception-migration-plan.md`
  - `docs/plans/_archive/reception-turbopack-migration/fact-find.md`
- Current implication: dependency residue remains and capability parity is not yet formalized in tests.

## External Research (If Needed)
- Upstream source audited (official):
  - GitHub repo: `https://github.com/daminort/reservation-grid`
  - Audited snapshot: `5bf1437` (default branch at fetch time)
- Canonical upstream capability evidence:
  - Prop surface: `src/lib/components/Grid/Grid.interface.ts` and `src/lib/components/Grid/Grid.tsx`
  - Day typing/intersection semantics: `src/lib/utils/dateUtils/dateUtils.ts`
  - Locales: `src/lib/constants/locales.ts`
  - Theme contract: `src/lib/constants/theme.ts`
  - Visual day variants (intersection/start/end/full): `src/lib/components/Days/*.tsx`

### Upstream Capability Matrix (GitHub) vs Current Reception Runtime
- Frozen contract artifact: `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md` (TASK-01).
| Capability | Upstream evidence | Current Reception runtime state | Classification | Forward requirement |
|---|---|---|---|---|
| Core props (`start`,`end`,`data`,`title`,`locale`,`highlightToday`,`onClickCell`) | `src/lib/components/Grid/Grid.tsx:15-32` | Supported in `apps/reception/src/components/roomgrid/ReservationGrid.tsx:53-72` | Preserved | Keep as baseline contract. |
| Info column and toggle (`info`,`showInfo`) | `src/lib/components/Grid/Grid.tsx:20-23`, `src/lib/components/Header/Header.tsx` | `info` not rendered; `showInfo` not exposed in active runtime path | Missing (runtime) | Reintroduce or formally provide compatible API. |
| Row/column selection (`selectedRows`,`selectedColumns`) | `src/lib/components/Grid/Grid.tsx:23-24`, `src/lib/components/Row/Row.tsx` | Not exposed in active runtime path | Missing (runtime) | Add compatibility support and tests. |
| Row title click callback (`onClickTitle`) | `src/lib/components/Grid/Grid.tsx:30,52` | Not exposed in active runtime path | Missing (runtime) | Preserve callback in internal contract. |
| Custom renderers (`renderTitle`,`renderInfo`) | `src/lib/components/Grid/Grid.interface.ts:14-15`, Grid render path | Not exposed in active runtime path | Missing (runtime) | Preserve renderer extension points. |
| Intersection/day-shape semantics (`single.start`,`single.end`,`intersection`) | `src/lib/utils/dateUtils/dateUtils.ts:171-229`, `src/lib/components/Days/Intersection.tsx` | Active `GridCell` picks first matching period and outputs simple fill | Reduced | Restore intersection/multi-period semantics in core engine. |
| Multi-status payload in click event (`dayStatus[]`) | `src/lib/utils/dateUtils/dateUtils.ts:191-229` | Active runtime emits single status or `free` (`GridCell.tsx:117-122`) | Reduced | Emit full status arrays when overlaps exist. |
| Theme surface (`font`,`color`,`width`,`date.status`) | `src/lib/constants/theme.ts` | Active prop accepts only `theme["date.status"]`; CSS vars exist but not prop-driven | Partial | Expose full theme contract (or documented adapter). |
| Locale bundle (`en`,`ua`,`de`,`fr`,`it`,`es`,`pl`) | `src/lib/constants/locales.ts:4-12` | Locale map matches upstream in Reception constants | Preserved | Keep parity tests for locale keys/day labels. |

### Local Parity Asset Already Present
- Reception already contains a near-upstream grid implementation under `apps/reception/src/components/roomgrid/components/*` and `context/*` with richer props than active runtime.
- This can be leveraged as internal parity base instead of retaining external package dependency.

## Questions
### Resolved
- Q: Is `@daminort/reservation-grid` still imported at runtime by Reception source?
  - A: No runtime imports were found.
  - Evidence: runtime import audit command.
- Q: What capabilities does upstream package provide that must be carried forward?
  - A: Capability set extracted from official GitHub source and mapped in the capability matrix above.

### Open
- None. Operator explicitly confirmed full upstream capability carry-forward on 2026-02-23; parity scope is fixed as full upstream compatibility.

## Confidence Inputs
- Implementation: 85%
  - Evidence basis: runtime already detached from package; local parity assets exist in repo.
  - To >=80: already met.
  - To >=90: choose one canonical internal engine and pass capability-contract tests.
- Approach: 93%
  - Evidence basis: upstream official source audited and mapped; phased dependency removal + parity gate is low-risk.
  - To >=80: already met.
  - To >=90: already met.
- Impact: 88%
  - Evidence basis: removes stale external dependency while preserving extensibility and reducing future lock-in.
  - To >=80: already met.
  - To >=90: complete parity contract and de-duplicate local dual implementations.
- Delivery-Readiness: 78%
  - Evidence basis: path is clear but requires capability-contract tests and canonicalization decision.
  - To >=80: lock parity scope (full API) and run low-memory targeted validation after implementation.
  - To >=90: typecheck + lint + focused capability tests all green.
- Testability: 76%
  - Evidence basis: tests exist but do not yet encode upstream capability contract end-to-end.
  - To >=80: add targeted capability tests for missing/reduced features.
  - To >=90: enforce these tests in CI and remove redundant untested paths.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Removing package residue without preserving upstream capabilities causes long-term feature regression | Medium | High | Make upstream capability matrix a hard acceptance contract in plan/build. |
| Keeping two local implementations (simplified + legacy) leads to drift and bugs | High | High | Select one canonical internal engine and deprecate the other path. |
| Removing ambient shims too early breaks compile-time consumers | Medium | Medium | Remove shims only after import/type usage audit and parity tests pass. |
| Memory pressure during validation produces incomplete confidence signals | High | Medium | Use staged single-file tests and scoped package checks only. |
| Lockfile churn collides with unrelated ongoing workspace changes | Medium | Medium | Keep commit scope narrow and validate only `@apps/reception`. |

## Planning Constraints & Notes
- Must-follow patterns:
  - External dependency removal is allowed only with explicit upstream capability carry-forward.
  - Capability parity must be proven with targeted tests before deleting residual compatibility artifacts.
  - Choose one canonical local RoomGrid implementation to avoid dual-path drift.
- Rollout/rollback expectations:
  - Rollback trigger: any break in `/rooms-grid` behavior or failure in capability-contract tests.
  - Rollback mechanism: revert dependency-removal/parity step commit atomically.
- Observability expectations:
  - Capture capability matrix pass/fail evidence in plan/build artifacts.

## Suggested Task Seeds (Non-binding)
- `RVG-01` Create explicit internal capability contract from upstream matrix (types + behavior checklist).
- `RVG-02` Canonicalize one local grid engine (recommended: parity-capable implementation) and route active `RoomGrid` through it.
- `RVG-03` Add capability tests for `showInfo`, selection, `onClickTitle`, `renderTitle`/`renderInfo`, intersection/dayStatus[] semantics, and theme/locale parity.
- `RVG-04` Remove `@daminort/reservation-grid` from `apps/reception/package.json` and regenerate lockfile.
- `RVG-05` Remove stale `@daminort/reservation-grid` ambient module declarations once type/runtime audits are clean.
- `RVG-06` Add static guard to fail on new runtime imports of `@daminort/reservation-grid`.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-refactor`
- Deliverable acceptance package:
  - No `@daminort/reservation-grid` dependency in Reception manifest.
  - No runtime imports of `@daminort/reservation-grid` in Reception source.
  - Upstream capability matrix satisfied by internal implementation + tests.
  - Targeted low-memory validation (`@apps/reception` typecheck/lint + focused roomgrid tests) passes.
- Post-delivery measurement plan:
  - Track `/rooms-grid` incident count and verify no regressions in booking-cell interaction behavior during first operational week.

## Evidence Gap Review
### Gaps Addressed
- Verified runtime import absence directly in source.
- Verified dependency residue in manifest + lockfile.
- Audited upstream GitHub source and extracted capability set.
- Mapped upstream capability set against current Reception runtime implementation.

### Confidence Adjustments
- Delivery-Readiness and Testability remain <80 until capability-contract tests are implemented and validated in low-memory-safe runs.

### Remaining Assumptions
- Full upstream capability parity is the intended target unless operator constrains scope.
- Existing local parity assets can be safely promoted/canonicalized without unrelated route regressions.

## Post-build Update (2026-02-23)
- The scoped build execution for this feature is complete via:
  - `docs/plans/reception-roomgrid-external-package-removal/plan.md`
  - `docs/plans/reception-roomgrid-external-package-removal/artifacts/upstream-capability-contract.md`
- Active Reception state now reflects the intended outcome:
  - `@daminort/reservation-grid` removed from `apps/reception/package.json` and lockfile.
  - Ambient shim files for `@daminort/reservation-grid` removed from `apps/reception/src/types/`.
  - Guard command added: `pnpm --filter @apps/reception guard:no-external-reservation-grid`.
- The earlier residue findings in this fact-find remain valid as a pre-remediation snapshot.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (default assumption: full parity target).
- Recommended next step:
  - `/lp-do-plan docs/plans/reception-roomgrid-external-package-removal/fact-find.md`
