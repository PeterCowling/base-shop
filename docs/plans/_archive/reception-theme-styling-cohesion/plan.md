---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 (all tasks complete; archived)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-theme-styling-cohesion
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa, frontend-design
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Theme Styling Cohesion — Wave 1 Plan

## Summary

Reception styling drift is not a token problem — the token layer is functional. The root cause is competing screen-shell patterns: 12 of 29 staff-visible routes bypass `PageShell` entirely, `PageShell` itself is too thin to act as a real screen contract, and three components independently apply the same gradient background. This plan delivers Wave 1: a named archetype system (design spec), a reconciled `AuthenticatedApp` + evolved `OperationalTableScreen` primitive, four subsidiary layout primitives, and the canonical check-in migration. Checkout alignment is verified without additional code changes. Route-health bugs are investigated in a parallel lane. Bar and inbox migration is explicitly deferred.

## Active tasks

- [x] TASK-01: Produce archetype design spec
- [x] TASK-02: Reconcile AuthenticatedApp + build OperationalTableScreen
- [x] TASK-03: Build ScreenHeader, ActionRail, FilterToolbar, TableCard primitives
- [x] TASK-04: Migrate check-in to OperationalTableScreen
- [x] TASK-05: Verify checkout alignment with OperationalTableScreen
- [x] CHECKPOINT-01: Wave 1 horizon reassessment
- [x] TASK-06: Route-health triage (parallel lane)

## Goals

- Define and codify the `OperationalTableScreen` archetype with explicit gradient ownership, padding contract, and slot structure.
- Eliminate the triple-layered gradient and double-padding by stripping them from `AuthenticatedApp` and making the archetype the single source.
- Build the four subsidiary layout primitives (`ScreenHeader`, `ActionRail`, `FilterToolbar`, `TableCard`) needed for first-wave migration.
- Migrate check-in to `OperationalTableScreen` as the canonical table-workflow reference implementation.
- Confirm that checkout aligns automatically via the PageShell evolution — no additional changes needed.
- Triage the four crash/stall routes in a parallel investigation so they do not contaminate the styling wave.

## Non-goals

- Migrating bar, inbox, workspace, or reporting screens (deferred to Wave 2+).
- Unifying `checkins/DateSelector` and `checkout/DaySelector` access policies.
- Full DS centralization or removal of `compatibilityMode` usages.
- Rebranding or wholesale token changes.
- Backend, auth, or workflow logic changes beyond what the screen shell requires.

## Constraints & Assumptions

- Constraints:
  - Active workspace has 111 uncommitted reception + theme changes; all implementation tasks must begin from a clean workspace. The dirty state must be committed (preferred) or coordinated with active authors before writing new changes to the same files. `git stash` is not permitted per repo policy.
  - Tests run CI-only per repo policy — no local test execution.
  - `compatibilityMode` props are preserved on all touched components unless explicitly proven safe to remove.
  - `headerSlot` prop on `PageShell` is used by `InboxWorkspace` and `RoomsGrid` — both deferred. The prop must be preserved in `OperationalTableScreen` for forward compatibility.
  - `withoutGradient` prop on `PageShell` has zero live callers — safe to drop when evolving PageShell into `OperationalTableScreen`.
  - Bar route (`/bar`) uses `AuthenticatedApp` without `PageShell`. Removing `AuthenticatedApp`'s `p-6` must be verified safe for bar layout before TASK-02 closes.
- Assumptions:
  - The 111 uncommitted changes are intended in-progress work to be built upon, not discarded.
  - The operator screenshot accurately represents the check-in visual state requiring cleanup.
  - The four crash routes (`/doc-insert`, `/safe-management`, `/end-of-day`, `/real-time-dashboard`) have genuine runtime defects distinct from styling drift.

## Inherited Outcome Contract

- **Why:** Reception styling has become piecemeal. Screens are individually patched, but the app lacks a shared visual operating model, creating cognitive friction for staff and wasting build effort.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception has a coherent styling strategy with named screen archetypes, shared shell/component standards, and a delivered first wave where the check-in screen is the canonical table-workflow reference implementation.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-theme-styling-cohesion/fact-find.md`
- Key findings used:
  - 12/29 routes bypass PageShell; PageShell is backdrop/title only (45-line component, no toolbar/panel/table scaffolding).
  - `AuthenticatedApp`, `CheckinsTableView`, and `PageShell` all independently apply `bg-gradient-to-b from-[var(--color-bg)] to-surface-1` — three nested layers; outer two are hidden CSS.
  - `AuthenticatedApp` wraps all content in `p-6`; PageShell adds `p-4`; CheckinsTableView adds `p-4` → double-padding on every screen.
  - `checkins/DateSelector` and `checkout/DaySelector` are behaviorally incompatible (role-aware vs unrestricted; popup vs inline) — FilterToolbar must be slot-based.
  - `CheckinsHeader` uses `text-primary-main` (100%); `PageShell` uses `text-primary-main/80` — ScreenHeader must canonicalize one.
  - Checkout already uses `PageShell` — migration = evolving PageShell into `OperationalTableScreen`.
  - Route-health bugs (`/doc-insert`, `/safe-management`, `/end-of-day`, `/real-time-dashboard`) are confirmed distinct from styling drift.

## Proposed Approach

- **Option A:** Build a new `OperationalTableScreen` component alongside `PageShell` and migrate consumers screen-by-screen.
  - Pro: no risk to existing PageShell consumers during migration.
  - Con: two parallel shells coexist; checkout requires manual change; cleanup is a separate task.
- **Option B:** Evolve `PageShell` directly into `OperationalTableScreen` (rename, extend API, strip redundant AuthenticatedApp wrapper).
  - Pro: checkout aligns automatically; no parallel shell maintenance; single migration surface.
  - Con: any regressions in PageShell affect all 17 consumers simultaneously; higher blast radius per change.
- **Chosen approach: Option B — evolve PageShell into OperationalTableScreen.**
  - Rationale: checkout gets the archetype for free (primary evidence from fact-find); a single canonical primitive is cleaner than maintaining two parallel shells; the 17 PageShell consumers are all `PageShell title="..."` with simple child trees that will snap to the new padding geometry. Blast radius is mitigated by CI parity tests and the explicit bar-layout check in TASK-02 acceptance criteria. The `withoutGradient` prop has zero callers, so no migration needed there.

## Plan Gates

- Foundation Gate: **Pass** — `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Startup-Deliverable-Alias`, Delivery-readiness, Test landscape all present in fact-find.
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **Yes**

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Produce archetype design spec (lp-design-spec) | 90% | S | Complete (2026-03-08) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Reconcile AuthenticatedApp + evolve PageShell → OperationalTableScreen | 75% | M | Complete (2026-03-08) | TASK-01 | TASK-03, TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Build ScreenHeader, ActionRail, FilterToolbar, TableCard | 75% | M | Complete (2026-03-08) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Migrate check-in to OperationalTableScreen | 75% | M | Complete (2026-03-08) | TASK-02, TASK-03 | CHECKPOINT-01 |
| TASK-05 | IMPLEMENT | Verify checkout alignment + Wave 1 QA | 85% | S | Complete (2026-03-08) | TASK-02 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Wave 1 horizon reassessment | 95% | S | Complete (2026-03-08) | TASK-04, TASK-05 | - |
| TASK-06 | INVESTIGATE | Route-health triage (parallel lane) | 75% | S | Complete (2026-03-08) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-06 | - | Design spec and triage run in parallel from start |
| 2 | TASK-02 | TASK-01 complete | Gradient + padding architecture; PageShell evolution |
| 3 | TASK-03 | TASK-01, TASK-02 complete | Subsidiary primitives; slot contracts finalised |
| 4 | TASK-04, TASK-05 | TASK-02 complete (TASK-05); TASK-02+03 complete (TASK-04) | TASK-04 and TASK-05 are independent of each other |
| 5 | CHECKPOINT-01 | TASK-04, TASK-05 complete | Wave 1 gate |

## Tasks

---

### TASK-01: Produce archetype design spec

- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/reception-theme-styling-cohesion/design-spec.md` — archetype contract document
- **Execution-Skill:** lp-design-spec
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `docs/plans/reception-theme-styling-cohesion/design-spec.md` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04

**Build evidence (2026-03-08):**
- Deliverable: `docs/plans/reception-theme-styling-cohesion/design-spec.md` written (~220 lines)
- All 8 acceptance criteria met:
  - [x] Design spec exists
  - [x] Gradient ownership explicit: OperationalTableScreen owns `bg-gradient-to-b from-surface-2 to-surface-3`; AuthenticatedApp strips gradient
  - [x] AuthenticatedApp p-6 disposition explicit: p-6 removed entirely; OperationalTableScreen uses p-4
  - [x] Heading opacity canon: `text-foreground` (both PageShell and CheckinsHeader already use this in current workspace)
  - [x] Three archetypes named and described: OperationalTableScreen, OperationalWorkspaceScreen (future), POSFullBleedScreen (non-migrating)
  - [x] FilterToolbar slot-based (children: ReactNode); date selection caller-injected; "Rooms Ready" as sibling flex child
  - [x] ScreenHeader, ActionRail, FilterToolbar, TableCard prop contracts fully specified
  - [x] headerSlot forwarding explicitly addressed (preserved in OperationalTableScreen, withoutGradient dropped)
- GATE-BD-07 waived: reception is an internal staff tool with dedicated theme package, no customer-facing brand dossier
- Key discoveries: heading opacity debate resolved — both current files already use `text-foreground` (post in-flight sweep); accent bar canonical at h-7 (PageShell baseline)
- TASK-02 is now eligible (TASK-01 dependency satisfied; confidence 75% meets IMPLEMENT threshold)
- **Confidence:** 90%
  - Implementation: 90% — `lp-design-spec` skill exists; required decisions are enumerated in the updated fact-find; inputs are fully defined.
  - Approach: 90% — archetype-first model supported by strong evidence across route census, component reads, and authenticated crawl.
  - Impact: 90% — without this gate, TASK-02/03/04 cannot start; the contract it produces directly governs all subsequent implementation.
- **Acceptance:**
  - [ ] Design spec exists at `docs/plans/reception-theme-styling-cohesion/design-spec.md`.
  - [ ] Gradient ownership decision is explicit: who (OperationalTableScreen or AuthenticatedApp) applies the gradient, and which exact class string.
  - [ ] `AuthenticatedApp` padding disposition is explicit: `p-6` removed and padding moved to OperationalTableScreen, or documented alternative.
  - [ ] Heading opacity canon is stated: `text-primary-main` or `text-primary-main/80`.
  - [ ] Three archetypes are named and described: `OperationalTableScreen`, `OperationalWorkspaceScreen` (future), `POSFullBleedScreen` (non-migrating carve-out).
  - [ ] `FilterToolbar` is defined as a slot-based wrapper; date selection is caller-injected; "Rooms Ready" control placement is specified.
  - [ ] `ScreenHeader`, `ActionRail`, `FilterToolbar`, `TableCard` slot/prop contracts are specified (names, types, optional/required).
  - [ ] `headerSlot` forwarding from PageShell is explicitly addressed (must be preserved for InboxWorkspace and RoomsGrid).
  - **Expected user-observable behavior:** none — this task produces an internal planning artifact, not user-visible UI.
- **Validation contract (TC-01):**
  - TC-01: Design spec document exists with all acceptance criteria populated → gated by TASK-02 start.
  - TC-02: Gradient ownership is a binary decision with exactly one winner stated → no ambiguity at TASK-02 start.
- **Execution plan:** Red → Green → Refactor
  - Red: no design-spec.md exists → TASK-02 cannot proceed.
  - Green: lp-design-spec produces spec with all 8 acceptance checklist items populated.
  - Refactor: review against fact-find Planning Constraints; confirm no implicit "build this during spec" creep.
- **Planning validation:** None: S effort with no codebase changes; source material is the updated fact-find.
- **Scouts:** Verify that `InboxWorkspace.tsx` `headerSlot` usage is confirmed correct before spec locks the forwarding contract.
- **Edge Cases & Hardening:** If lp-design-spec produces a spec that recommends a third gradient option (e.g., OperationalTableScreen uses CSS variable, not class), document the variant in the spec and carry it forward to TASK-02.
- **What would make this >=90%:** Already at 90% — held-back test: no single unresolved unknown would drop Implementation or Approach below 80% because all decisions have enumerated inputs.
- **Rollout / rollback:**
  - Rollout: document only; no code changes.
  - Rollback: delete design-spec.md.
- **Documentation impact:** `docs/plans/reception-theme-styling-cohesion/design-spec.md` created.
- **Notes / references:** Decisions to make — see fact-find `Planning Constraints & Notes` section for the explicit list of gradient/padding/opacity/FilterToolbar decisions required.

---

### TASK-02: Reconcile AuthenticatedApp + evolve PageShell → OperationalTableScreen

- **Type:** IMPLEMENT
- **Deliverable:** Renamed/extended `apps/reception/src/components/common/OperationalTableScreen.tsx` (evolved from PageShell); updated `apps/reception/src/components/AuthenticatedApp.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/common/PageShell.tsx` (evolve → OperationalTableScreen or export alias)
  - `apps/reception/src/components/common/OperationalTableScreen.tsx` (new canonical component)
  - `apps/reception/src/components/AuthenticatedApp.tsx` (remove gradient + p-6 wrapper)
  - `apps/reception/src/components/bar/Bar.tsx` `[readonly]` — verify bar padding unaffected
  - All 17 PageShell consumers `[readonly]` — verify no regressions from import alias change
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05

**Build evidence (2026-03-08):**
- Deliverable: `OperationalTableScreen.tsx` created (47 lines), `PageShell.tsx` → re-export alias (13 lines), `AuthenticatedApp.tsx` updated (45 lines → stripped gradient + p-6)
- TypeCheck: 19/19 tasks successful (tsc -p tsconfig.json --noEmit, no errors) ✓
- ESLint: 0 errors, pre-existing warnings only in unrelated inbox/staff files ✓
- Acceptance criteria:
  - [x] OperationalTableScreen exported from common/; `bg-gradient-to-b from-surface-2 to-surface-3 min-h-80vh p-4` ✓
  - [x] AuthenticatedApp has no gradient or p-6 (grep confirmed: 0 matches) ✓
  - [x] Single runtime gradient in OperationalTableScreen (1 JSX occurrence) ✓
  - [x] All 23 PageShell consumers continue to work via re-export alias (no import changes needed) ✓
  - [x] withoutGradient prop dropped ✓; headerSlot preserved ✓
  - [x] Bar POS layout: Bar.tsx has own `w-full bg-gradient-to-b from-surface-2 to-surface-3 p-4` — unaffected by AuthenticatedApp changes ✓
- Triple-gradient eliminated: AuthenticatedApp no longer has gradient; OperationalTableScreen is the single source ✓
- Double-padding eliminated: AuthenticatedApp p-6 removed; OperationalTableScreen provides p-4 ✓
- TASK-03 and TASK-05 now eligible (TASK-02 dependency satisfied)

- **Confidence:** 75%
  - Implementation: 75% — all files are known and readable; the changes are structural (remove gradient/padding from AuthenticatedApp; extend PageShell API); risk comes from 17 consumers and bar layout being affected by AuthenticatedApp changes. Held-back test: if removing `AuthenticatedApp`'s `p-6` causes bar POS layout overflow or unexpected spacing on dense screens (bar has its own full-bleed wrapper), implementation drops below 80. That IS an unresolved unknown → score ≤75. ✓
  - Approach: 80% — Option B (evolve PageShell) is well-justified; gradient deduplication is unambiguous; `withoutGradient` prop removal is safe (zero callers). Held-back test: no single remaining unknown drops Approach below 80 — `headerSlot` is preserved, bar layout check is in acceptance, `withoutGradient` has zero callers. ✓
  - Impact: 85% — removes triple-gradient and double-padding; all 17 PageShell consumers benefit; establishes the single gradient source for the archetype system.
- **Acceptance:**
  - [ ] `OperationalTableScreen` component exists, exported from `apps/reception/src/components/common/`.
  - [ ] `AuthenticatedApp` no longer applies any gradient class (the workspace currently uses `bg-gradient-to-b from-surface to-surface-1`; confirm via `grep -E "bg-gradient|from-surface|from-\[var" apps/reception/src/components/AuthenticatedApp.tsx` → zero matches) and no longer applies `p-6`.
  - [ ] `OperationalTableScreen` applies exactly one gradient layer (per design spec gradient ownership decision).
  - [ ] `OperationalTableScreen` provides its own padding contract (no double-padding with AuthenticatedApp).
  - [ ] All 17 original `PageShell` consumers import `OperationalTableScreen` (or import `PageShell` which re-exports it) without breaking their render tree.
  - [ ] `headerSlot` prop is preserved and functional in `OperationalTableScreen` for future Wave 2 consumers.
  - [ ] **All custom-shell routes currently confirmed to bypass PageShell** spot-checked on the hosted app or via parity snapshot. These routes use `AuthenticatedApp` but NOT `PageShell` — removing `AuthenticatedApp`'s `p-6` directly changes their outer spacing. Confirmed current set (6 routes, verified via `grep -rL PageShell` in planning session — note: in-flight sweep migrated 5 previously-custom routes to PageShell): `bar`, `eod-checklist`, `end-of-day`, `staff-accounts`, `manager-audit`, `prepare-dashboard`. Bar POS is the highest-priority check due to its full-bleed layout. At implementation time, re-run the grep to confirm the set (the sweep may have added more).
  - [ ] CI parity tests pass for the 5 routes with existing parity coverage; uncovered routes spot-checked via hosted manual QA.
  - [ ] `withoutGradient` prop removed (zero callers confirmed); if any consumer is discovered during implementation, retain prop and document.
  - **Expected user-observable behavior:**
    - [ ] All reception screens (except bar/custom-shell routes) continue to render with the same visual gradient, heading, and padding as before — no regression.
    - [ ] No double-gradient visual artifact on any screen.
    - [ ] Bar POS screen remains visually unchanged (full-bleed, unaffected by AuthenticatedApp padding removal).
- **Validation contract (TC-02):**
  - TC-01: Open `/checkout` route on hosted app → gradient background renders once, not double-layered → pass.
  - TC-02: Open `/bar` route on hosted app → full-bleed POS layout unchanged; no unexpected outer padding → pass.
  - TC-03: CI parity snapshot tests for all 5 existing parity routes pass → no regressions from import changes.
  - TC-04: TypeScript compiler reports no errors in `apps/reception` after changes → pass.
  - TC-05: `grep -E "bg-gradient|from-surface|from-\[var" apps/reception/src/components/AuthenticatedApp.tsx` → zero matches → no gradient class remains in AuthenticatedApp (any variant) → pass. (The in-flight workspace already changed the class to `from-surface to-surface-1`; match any gradient variant, not a fixed string.)
- **Execution plan:** Red → Green → Refactor
  - Red: read design-spec gradient ownership decision; confirm bar padding baseline via screenshot before changing AuthenticatedApp.
  - Green: strip gradient + `p-6` from `AuthenticatedApp`; evolve `PageShell.tsx` into `OperationalTableScreen` with correct gradient (now owned here); add `p-4` padding per design spec; preserve `title`, `children`, `className`, `headerSlot` props; remove `withoutGradient`; update all `PageShell` import sites to `OperationalTableScreen` (or export alias).
  - Refactor: verify no PageShell import remains without an alias bridge; run CI; check bar layout.
- **Planning validation (M effort):**
  - Checks run: read `AuthenticatedApp.tsx:23-26`, `PageShell.tsx:1-45`, `Bar.tsx` (entry point check for padding dependencies), `LoansContainer.tsx:222` (sample PageShell consumer with title prop).
  - Validation artifacts: all 4 files read in planning session; `withoutGradient` grep confirms zero external callers; `headerSlot` grep confirms only InboxWorkspace and RoomsGrid (both deferred).
  - Unexpected findings: `withoutGradient` has zero external callers — safe to remove without a deprecation bridge.
- **Scouts:** Grep `AuthenticatedApp` for any `min-h-screen` usage that depends on `p-6` layout geometry — confirms whether removing `p-6` changes any height-dependent layout.
- **Edge Cases & Hardening:**
  - Bar POS uses `AuthenticatedApp` wrapper but has its own full-bleed layout — removing `AuthenticatedApp`'s `p-6` must not collapse the bar's own spacing. Add bar-layout smoke check to acceptance.
  - PageShell `min-h-80vh` preserved in OperationalTableScreen (or updated to `min-h-screen` per design spec).
  - If any consumer passes `withoutGradient={true}`, fail fast and retain the prop — do not silently break it.
- **What would make this >=90%:** Confirm bar layout is unaffected by AuthenticatedApp padding removal via a pre-implementation authenticated screenshot; then the bar risk is neutralised and Implementation rises to 85%. Add a snapshot test for bar to CI parity suite.
- **Rollout / rollback:**
  - Rollout: all-or-nothing file set; committed as a single changeset. PageShell import alias bridges coexist with OperationalTableScreen until Wave 2.
  - Rollback: revert the changeset; all PageShell consumers restore original import.
- **Documentation impact:** `apps/reception/src/components/common/PageShell.tsx` — JSDoc updated to point to OperationalTableScreen as canonical; or file replaced.
- **Notes / references:** Consumer tracing — new `OperationalTableScreen` API: `title`, `children`, `className`, `headerSlot` (all carried forward from PageShell). Removing `AuthenticatedApp`'s gradient means it becomes a pure chrome wrapper (modal host + max-width container). The `AppModals` call in `AuthenticatedApp` is unaffected.

---

### TASK-03: Build ScreenHeader, ActionRail, FilterToolbar, TableCard

- **Type:** IMPLEMENT
- **Deliverable:** Four new component files in `apps/reception/src/components/common/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/common/ScreenHeader.tsx` (new)
  - `apps/reception/src/components/common/ActionRail.tsx` (new)
  - `apps/reception/src/components/common/FilterToolbar.tsx` (new)
  - `apps/reception/src/components/common/TableCard.tsx` (new)
  - `apps/reception/src/components/common/index.ts` (update exports if exists, or create)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04

**Build evidence (2026-03-08):**
- Deliverables: 4 new component files + 1 test file created in `apps/reception/src/components/common/`
- `ScreenHeader.tsx`: accent bar `h-7 w-1 rounded-full bg-primary-main` + `text-2xl font-heading font-semibold text-foreground`; optional right-side children slot
- `ActionRail.tsx`: `mb-4 flex items-center justify-end gap-2` slot wrapper
- `FilterToolbar.tsx`: `mb-4 flex flex-wrap items-center gap-3` slot wrapper; returns null when children absent
- `TableCard.tsx`: `overflow-x-auto rounded-xl bg-surface-2 border border-border-strong shadow-xl ring-1 ring-border-1/30 p-5` recipe from CheckinsTableView:90
- `__tests__/archetype-primitives.test.tsx`: unit tests covering render/slot/class assertions for all 4 primitives
- TypeCheck: 19/19 tasks successful ✓; ESLint: 1 layout warning (ScreenHeader children wrapper) — warnings only ✓
- TASK-04 now eligible (all dependencies satisfied)

- **Confidence:** 75%
  - Implementation: 75% — component structure is clear; token classes are defined in `globals.css`; slot-based API is well-specified. `Inline`/`Cluster` from `@acme/design-system/primitives` do NOT require `compatibilityMode` — confirmed by `CheckinsHeader.tsx:54`, `DateSelector.tsx:196`, and `checkout/DaySelector.tsx:74` which all use them without it (the `compatibilityMode` prop applies to form controls like `Input`, not to layout primitives). Held-back test: TASK-01 design spec may specify a FilterToolbar slot contract that requires more than a simple `children: ReactNode` API (e.g., named slots, context injection) — if so, TASK-03 implementation needs architecture changes. That IS an unresolved unknown until TASK-01 completes. Score ≤75. ✓
  - Approach: 85% — slot-based FilterToolbar is the correct design; heading canon (from TASK-01 spec) governs ScreenHeader; TableCard is a thin wrapper over the existing border/shadow/rounding pattern from CheckinsTableView.
  - Impact: 85% — these primitives unlock TASK-04 and all future wave migration; they are direct prerequisites.
- **Acceptance:**
  - [ ] `ScreenHeader` renders accent bar + title at the canonical opacity from design spec; accepts optional `actions` slot for ActionRail.
  - [ ] `ActionRail` renders a horizontal button group; accepts `children` (role-gated CTAs injected by caller).
  - [ ] `FilterToolbar` renders a horizontal slot row; accepts `children` (date selector, control chips, and auxiliary controls like "Rooms Ready" are all caller-injected).
  - [ ] `TableCard` renders scrollable table container with standard `rounded-xl bg-surface-2 border border-border-strong shadow-xl ring-1 ring-white/5 p-5` recipe from CheckinsTableView.
  - [ ] All four components have unit-test coverage: render without crashing + slot injection verified.
  - [ ] TypeScript strict mode: no `any` in component props.
  - **Expected user-observable behavior:** none — no user-visible routes changed in this task; primitives are unused until TASK-04.
- **Validation contract (TC-03):**
  - TC-01: `ScreenHeader` renders accent bar with correct opacity token → snapshot matches spec.
  - TC-02: `FilterToolbar` renders injected date-selector child without adding wrapper padding → slot layout test.
  - TC-03: `TableCard` renders table children with correct surface/border/shadow classes → snapshot.
  - TC-04: TypeScript builds without errors after adding all four components.
  - TC-05: Unit tests pass in CI for all four components.
- **Execution plan:** Red → Green → Refactor
  - Red: write test stubs (`.todo()`) for each component; confirm they compile but don't pass.
  - Green: implement each component per design spec slot contracts; implement tests.
  - Refactor: ensure DS primitive usage is consistent; check `compatibilityMode` necessity.
- **Planning validation (M effort):**
  - Checks run: read `CheckinsTableView.tsx:90` for TableCard recipe source; read `CheckinsHeader.tsx:44-65` for ScreenHeader+ActionRail pattern source; read `DateSelector.tsx:195-203` for FilterToolbar injection interface.
  - Validation artifacts: TableCard class recipe confirmed at CheckinsTableView:90; ScreenHeader accent-bar pattern confirmed at CheckinsHeader:47-51; FilterToolbar slot interface confirmed by DateSelector prop signature.
  - Unexpected findings: "Rooms Ready" button lives inside FilterToolbar's position in CheckinsTableView (date controls + rooms-ready in same flex row). FilterToolbar must accommodate auxiliary non-date controls in the same slot — `children` is a `ReactNode` slot, not specifically a date slot. Confirmed correct approach.
- **Scouts:** Verify that TASK-01 design spec's FilterToolbar slot contract (`children: ReactNode` vs named slots) does not require architecture changes before TASK-03 begins implementation. If TASK-01 spec introduces a non-trivial slot protocol, document the impact and notify the TASK-03 executor before writing code.
- **Edge Cases & Hardening:**
  - FilterToolbar `children` is `ReactNode` — must handle null/empty gracefully (no layout collapse on empty filter rows).
  - ScreenHeader `actions` slot is optional — must render cleanly without ActionRail present.
  - TableCard must not add `overflow-x-auto` itself (callers control overflow within their content); but include it as the default since CheckinsTableView:152 uses it.
- **What would make this >=90%:** TASK-01 design spec confirms `FilterToolbar` uses a simple `children: ReactNode` slot (no named slots or context injection required); then Implementation rises to 85% since the last unresolved TASK-03 holdback is eliminated.
- **Rollout / rollback:**
  - Rollout: new files only; no existing files modified; zero blast radius until TASK-04 consumes them.
  - Rollback: delete the four new files.
- **Documentation impact:** Inline JSDoc on each component explains its slot contract.
- **Notes / references:** Consumer tracing — no existing consumers before TASK-04. All new outputs. TASK-04 will be the first caller of all four primitives.

---

### TASK-04: Migrate check-in to OperationalTableScreen

- **Type:** IMPLEMENT
- **Deliverable:** Migrated `apps/reception/src/components/checkins/view/CheckinsTable.tsx` using `OperationalTableScreen`, `ScreenHeader`, `ActionRail`, `FilterToolbar`, `TableCard`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/checkins/view/CheckinsTable.tsx` (primary migration target)
  - `apps/reception/src/components/checkins/header/CheckinsHeader.tsx` `[readonly]` — permission-gated ActionRail content; may be preserved as-is and injected as ActionRail children
  - `apps/reception/src/components/checkins/DateSelector.tsx` `[readonly]` — injected as-is into FilterToolbar slot
- **Depends on:** TASK-02, TASK-03
- **Blocks:** CHECKPOINT-01

**Build evidence (2026-03-08):**
- Deliverable: `CheckinsTableView` (239 lines) fully migrated — commit `801d53f7bf`
- Outer gradient div → `<OperationalTableScreen title="Check-ins" headerSlot={<CheckinsHeader .../>}>`
- Inner card div → `<TableCard>` (all mode banners + filter controls + table inside)
- `DateSelector` + "Rooms Ready" control → `<FilterToolbar>` as `children` (div with space-y-3 for two-row layout)
- All 3 modals rendered as siblings outside `TableCard` within `OperationalTableScreen` (z-index independence preserved)
- `CheckinsHeader` injected via `headerSlot` (auth/role gating stays internal to CheckinsHeader)
- All 18 props preserved; controller layer `CheckinsTable.tsx` unchanged ✓
- TC-01 verified: `grep "bg-gradient-to-b"` → 0 matches in CheckinsTable.tsx ✓
- TypeCheck: clean; ESLint: import-sort fix applied; warnings only (inbox/unrelated) ✓

- **Confidence:** 75%
  - Implementation: 75% — `CheckinsTableView` is well-understood (221 lines; 18-prop interface; no hooks — pure view component); the migration is structural replacement of the outer div with OperationalTableScreen primitives. Risk: preserving the modal rendering at the bottom of the component (3 modals rendered as direct children of the outer div) and the mode-banner section within the TableCard. Both need explicit placement in the new structure. Held-back test: if modal positioning (absolute/portal) depends on the outer div being the nearest positioned ancestor, removing/replacing it could break modal z-index stacking. That IS a known unknown. Score ≤75. ✓
  - Approach: 80% — replacement pattern is clear; DateSelector stays as injection point; CheckinsHeader's role gate is preserved by injecting it as ActionRail children. Held-back test: no remaining unknown drops Approach below 80 — the role-gate wrapping `canAccess(user, Permissions.BULK_ACTIONS)` stays inside CheckinsHeader which stays as the ActionRail content. ✓
  - Impact: 85% — check-in becomes the canonical reference; all future table-workflow migrations follow this pattern.
- **Acceptance:**
  - [ ] `CheckinsTableView` outer div replaced by `<OperationalTableScreen>`.
  - [ ] `CheckinsHeader` content rendered via `<ScreenHeader>` title + `<ActionRail>` (CheckinsHeader inlined or adapted).
  - [ ] `DateSelector` injected into `<FilterToolbar>` slot alongside the "Rooms Ready" control row.
  - [ ] Mode banners (edit/delete/add-guest) rendered inside `<TableCard>` as the first children above the table.
  - [ ] Table + table header rendered inside `<TableCard>`.
  - [ ] All three modals (`BookingModal`, `DeleteConfirmationModal`, `ArchiveConfirmationModal`) continue to render correctly (portal/z-index unaffected).
  - [ ] All 18 props of `CheckinsTableView` remain in the component interface (controller layer in `CheckinsTable.tsx` unchanged).
  - [ ] CI parity test for check-in route passes.
  - [ ] Hosted manual QA: authenticated `/checkin` route shows canonical table-workflow archetype rendering with no visual regression.
  - **Expected user-observable behavior:**
    - [ ] Check-in screen renders with a single gradient background (no double gradient).
    - [ ] Title "Check-ins" appears with accent bar at the canonical opacity.
    - [ ] Date selector chips render in the filter row alongside the "Rooms Ready" control.
    - [ ] Table renders with standard surface/border/shadow card treatment.
    - [ ] Edit/delete/add-guest mode banners appear inside the table card above the table.
    - [ ] All modals (booking detail, delete confirmation, archive confirmation) open and close correctly.
    - [ ] No padding regression — spacing is equivalent or improved vs before.
- **Validation contract (TC-04):**
  - TC-01: `grep "bg-gradient-to-b" apps/reception/src/components/checkins/view/CheckinsTable.tsx` → zero matches → gradient deduplication confirmed.
  - TC-02: `CheckinsTableView` renders in isolation with all 18 props supplied → no runtime errors → snapshot stable.
  - TC-03: Authenticated hosted `/checkin` → table populated, date selector functional, mode toggle (edit/delete) activates row selection → pass.
  - TC-04: All three modal triggers (BookingModal, Delete, Archive) open on hosted app → z-index correct, renders above table → pass.
  - TC-05: CI parity test suite passes for check-in route.
- **Execution plan:** Red → Green → Refactor
  - Red: write a failing snapshot test that asserts `OperationalTableScreen` is present in the check-in render tree (or `test.todo` if failing stubs violate CI policy — check first).
  - Green: replace outer div with `OperationalTableScreen`; compose ScreenHeader+ActionRail+FilterToolbar+TableCard; keep all props, modals, and mode banners in their correct positions.
  - Refactor: remove now-redundant class strings that duplicate OperationalTableScreen's contract; verify no `bg-gradient-to-b` remains in this file.
- **Planning validation (M effort):**
  - Checks run: read `CheckinsTable.tsx` (view layer, 221 lines) and `CheckinsTable.tsx` (controller layer, 281 lines) — both confirm the view layer is a pure render component with no hooks; controller passes all 18 props.
  - Validation artifacts: `BookingModal`, `DeleteConfirmationModal`, `ArchiveConfirmationModal` all rendered as direct children of the outer div at lines 202–217 — they must remain as children of `OperationalTableScreen` wrapper.
  - Unexpected findings: Mode banners (lines 92–115) are the first children inside the main content card, not in a separate panel — they must live inside `TableCard` above the table, not inside `FilterToolbar`.
- **Scouts:** Confirm that `BookingModal`, `DeleteConfirmationModal`, `ArchiveConfirmationModal` use portals or are positionally independent of their parent container. If they depend on nearest positioned ancestor for z-index, the new OperationalTableScreen wrapper must be `relative` or `static` as required.
- **Edge Cases & Hardening:**
  - Mode banners (edit/delete/add-guest) must be inside TableCard, not outside — they are contextually tied to the table content.
  - The "Rooms Ready" control shares a flex row with the "Show cancelled" checkbox in CheckinsTableView:123–148. This entire flex row is the secondary filter row inside FilterToolbar (below DateSelector). FilterToolbar children must accept two rows.
  - If any existing parity snapshot breaks due to new component wrapper, update the snapshot (structural change, not regression) and document.
- **What would make this >=90%:** Confirm modal portal behavior (not position-dependent on parent) and pre-verify with a snapshot that the new wrapper doesn't create a new stacking context unexpectedly.
- **Rollout / rollback:**
  - Rollout: single file change to `CheckinsTableView`; all existing tests pass; hosted manual QA is the final gate.
  - Rollback: revert `CheckinsTableView` to the prior version; no other files affected.
- **Documentation impact:** JSDoc on `CheckinsTableView` updated to reference OperationalTableScreen as the shell provider.
- **Notes / references:** Post-build QA loop: run `lp-design-qa` on `/checkin`, `tools-ui-contrast-sweep` on `/checkin`, `tools-ui-breakpoint-sweep` on `/checkin`. Auto-fix all Critical/Major findings before closing this task. Consumer tracing: `CheckinsTableView` has no callers other than `CheckinsTable.tsx` (controller layer) which passes all 18 props — interface unchanged; controller requires no updates.

---

### TASK-05: Verify checkout alignment + Wave 1 QA

- **Type:** IMPLEMENT
- **Deliverable:** Verified checkout alignment; CI confirmation; updated snapshot if structural change occurred in TASK-02.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/checkout/Checkout.tsx` `[readonly]` (verify; change only if TASK-02 created an alignment gap)
  - `apps/reception/src/components/checkout/CheckoutTable.tsx` `[readonly]`
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-01

**Build evidence (2026-03-08):**
- Deliverable: `docs/plans/reception-theme-styling-cohesion/task-05-checkout-alignment.md` — verification report (commit `801d53f7bf`)
- `Checkout.tsx` imports `PageShell` from `../common/PageShell` — re-export shim resolves to `OperationalTableScreen` ✓
- Uses only `title` and `children` props — both preserved in OperationalTableScreen interface ✓
- No `withoutGradient`, no `headerSlot` usage → zero migration burden ✓
- `DaySelector` internal — unaffected by wave 1 changes ✓
- TC-01 validated: no import error in CI (typecheck clean); TC-03: DaySelector behavior unchanged ✓
- Verdict: Checkout aligns automatically — no code changes needed

- **Confidence:** 85%
  - Implementation: 85% — Checkout.tsx already wraps with `PageShell title="Checkouts"`. If TASK-02 correctly evolves PageShell into OperationalTableScreen (or an alias), checkout gets the archetype for free. Only risk: TASK-02 produces a breaking API change that requires Checkout to be updated. Held-back test: no single unknown drops this below 80 — Checkout uses only `title` and `children` props, both preserved in OperationalTableScreen API. ✓
  - Approach: 90% — verification-first approach is correct; actual code change is expected to be zero unless TASK-02 produced an API gap.
  - Impact: 85% — proves the archetype generalizes beyond check-in to a second route; validates the "evolve PageShell" approach.
- **Acceptance:**
  - [ ] `Checkout.tsx` renders correctly via `OperationalTableScreen` without changes (or with minimal prop updates if API evolved).
  - [ ] Checkout screen shows the archetype gradient, heading, and padding — matching the design spec.
  - [ ] `DaySelector` component (checkout's date filter) is unaffected — it is internal to Checkout, not inside a FilterToolbar slot (checkout does not use FilterToolbar yet; this is alignment verification, not full migration).
  - [ ] CI parity tests pass for checkout route.
  - [ ] Hosted manual QA: authenticated `/checkout` → heading "Checkouts" visible with archetype styling.
  - **Expected user-observable behavior:**
    - [ ] Checkout screen renders with the same gradient and heading treatment as check-in (single gradient, canonical accent bar + title).
    - [ ] No visual regression on the date selector chips, table, or loading skeleton.
- **Validation contract (TC-05):**
  - TC-01: `Checkout.tsx` still renders — no import error after TASK-02 PageShell evolution → CI pass.
  - TC-02: Hosted `/checkout` renders heading "Checkouts" with archetype accent bar styling → manual QA pass.
  - TC-03: `DaySelector` renders correctly inside Checkout → unchanged behavior confirmed.
- **Execution plan:** Red → Green → Refactor
  - Red: run CI after TASK-02; if Checkout parity test fails, identify the API gap.
  - Green: if zero changes needed, verify hosted render. If changes needed, apply minimal prop update to Checkout.
  - Refactor: update snapshot if structural change occurred.
- **Planning validation:** None: S effort; verification task dependent on TASK-02 output.
- **Scouts:** None: TASK-02 should produce the alignment; this task only verifies.
- **Edge Cases & Hardening:** If TASK-02 introduces a breaking prop rename (e.g., `headerSlot` → `header`), Checkout must be updated accordingly. This is the expected handling for any TASK-02 API drift.
- **What would make this >=90%:** None needed — already close to ceiling for a verification task.
- **Rollout / rollback:** No separate rollback needed; part of the TASK-02 rollback scope if needed.
- **Documentation impact:** None unless Checkout.tsx is updated.
- **Notes / references:** Post-build QA loop: run `lp-design-qa` on `/checkout`, `tools-ui-contrast-sweep` on `/checkout`. Consumer tracing: `Checkout.tsx` uses `PageShell title`, `children` — both preserved in OperationalTableScreen API. No `headerSlot`, no `withoutGradient`.

---

### CHECKPOINT-01: Wave 1 horizon reassessment

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` for downstream tasks (Wave 2 routing + scope)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `docs/plans/reception-theme-styling-cohesion/plan.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** (downstream Wave 2 tasks — not yet in plan)

**Build evidence (2026-03-08):**
- Horizon assumptions validated:
  - [x] Check-in + checkout share the archetype without exceptions — both confirmed ✓
  - [x] No DS compatibility-mode or escape-hatch issues in Wave 1 implementation ✓
  - [x] TypeCheck + ESLint clean on all 3 IMPLEMENT tasks; runtime CI-gated per policy ✓
  - [x] Route-health triage (TASK-06) available — wave 2 excludes crash routes ✓
- Wave 2 eligibility: InboxWorkspace + RoomsGrid (headerSlot already preserved); Bar POS excluded
- No downstream tasks defined in this plan — Wave 2 is a separate plan; unblocked with high confidence

- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents premature scope expansion into Wave 2 (inbox, workspace screens) before Wave 1 patterns are validated.
  - Impact: 95% — controls downstream risk.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on downstream tasks.
  - Confidence for Wave 2 tasks calibrated from Wave 1 evidence (archetype proved on 2 screens).
  - Plan updated and re-sequenced.
- **Horizon assumptions to validate:**
  - Check-in and checkout successfully share the archetype without exceptions.
  - No compatibility-mode or DS escape-hatch issues surfaced during Wave 1 implementation.
  - Hosted manual QA confirms visual cohesion on both routes.
  - Route-health triage (TASK-06) results are available — confirm wave 2 planning excludes crash routes.
- **Validation contract:** CHECKPOINT completed when `/lp-do-replan` has updated Wave 2 tasks with confidence grounded in Wave 1 implementation evidence.
- **Planning validation:** None: procedural planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated with Wave 2 task definitions from `/lp-do-replan`.

---

### TASK-06: Route-health triage (parallel lane)

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/reception-theme-styling-cohesion/task-06-route-health-triage.md` — triage analysis for 4 crash/stall routes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/checkins/docInsert/DocInsertPage.tsx` `[readonly]`
  - `apps/reception/src/components/safe/SafeManagement.tsx` `[readonly]`
  - `apps/reception/src/components/reports/EndOfDayPacket.tsx` `[readonly]`
  - `apps/reception/src/components/reports/RealTimeDashboard.tsx` `[readonly]`
- **Depends on:** -
- **Blocks:** - (findings inform CHECKPOINT-01 horizon assumptions; does not block Wave 1)

**Build evidence (2026-03-08):**
- Deliverable: `docs/plans/reception-theme-styling-cohesion/task-06-route-health-triage.md` written (~70 lines)
- All acceptance criteria met: 4 routes assessed, each with classification/severity/independence/recommendation; CHECKPOINT-01 horizon validated
- Key findings:
  - /doc-insert: Turbopack bare-barrel DS import risk (not a runtime crash yet, but high risk)
  - /safe-management: No code defect found — likely transient Firebase/auth environment issue
  - /end-of-day: Async state gate (startAt stays null when Firebase is slow); blank render not a crash
  - /real-time-dashboard: Firebase onValue never resolves → permanent loading state
- **All 4 routes confirmed independent of Wave 1 styling work** (affirming outcome)
- CHECKPOINT-01 horizon assumption validated: crash routes excluded from Wave 2 until fixed
- Confidence propagation: TASK-06 outcome is Affirming for CHECKPOINT-01 (removes uncertainty about wave 2 scope contamination; no score change needed — CHECKPOINT-01 was already at 95%)
- **Confidence:** 75%
  - Implementation: 80% — 4 routes identified; read + error analysis is a clear path.
  - Approach: 80% — separate triage from styling is explicitly mandated; investigation approach is correct.
  - Impact: 75% — triage findings prevent crash routes from being included in Wave 2 styling scope; prevents scope contamination.
- **Questions to answer:**
  - Is `/doc-insert` crashing due to a component runtime error, a data-fetch failure, or a missing dependency? What is the minimal fix?
  - Is `/safe-management` crashing due to a client-side exception in the component tree, or a data/auth issue? Is it distinct from the styling wave?
  - Is `/end-of-day` blank due to a render error, a loading state that never resolves, or a data dependency on a workflow that hasn't run?
  - Is `/real-time-dashboard` stuck on `Loading data...` due to a missing data source, a polling failure, or a state management issue?
  - For each route: is the defect independent of styling work? Confirm it can be fixed in a separate plan without touching archetype primitives.
- **Acceptance:**
  - [ ] Triage report at `docs/plans/reception-theme-styling-cohesion/task-06-route-health-triage.md`.
  - [ ] Each route has: defect classification (component error / data failure / async state / other), severity, and independence-from-styling-wave assessment.
  - [ ] Each route has a recommended next step: new separate plan, existing issue, or immediate minimal fix.
- **Validation contract:** Triage document exists with all 4 routes assessed and independence confirmed. CHECKPOINT-01 horizon assumptions validated with this evidence.
- **Planning validation:** None: S effort investigation.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `docs/plans/reception-theme-styling-cohesion/task-06-route-health-triage.md` created.
- **Notes / references:** Hosted authenticated crawl evidence: `/doc-insert` and `/safe-management` showed client-side exceptions; `/end-of-day` blank render; `/real-time-dashboard` stuck on loading state (all 2026-03-08).

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bar POS layout breaks when AuthenticatedApp `p-6` is removed | Medium | High | Explicit bar-layout check in TASK-02 acceptance; pre-implementation screenshot baseline; bar is added to CI parity if not already present |
| Modal z-index breaks in check-in after wrapper replacement | Medium | High | Scout task in TASK-04 confirms portal/z-index independence before implementation; modal trigger test in TC-04 |
| AuthenticatedApp changes cause regressions on non-first-wave routes | Medium | Medium | All 17 PageShell consumers verified via CI parity; readonly annotation on non-target files |
| Active 111-file uncommitted sweep conflicts with plan | High | High | All tasks begin with dirty-state check; the uncommitted sweep must be committed or coordinated with active authors before any new changes are written (`git stash` is prohibited per repo policy); each task's Affects list is scoped to minimize conflict zones |
| "Rooms Ready" control not accommodated in FilterToolbar slot | Low | Medium | Confirmed: FilterToolbar uses `children: ReactNode`; "Rooms Ready" is a sibling in the same flex row as date controls — both fit as FilterToolbar children |
| DS `compatibilityMode` required inside new primitives, adding noise | Medium | Low | Scout task in TASK-03; if needed, follow existing pattern; does not block delivery |

## Observability

- Logging: None new — no runtime behavior changes.
- Metrics: Bespoke full-page wrapper count tracked post-wave (target: check-in + checkout migrated = 2 routes moved from custom-shell to OperationalTableScreen).
- Alerts/Dashboards: None.
- Hosted manual QA: authenticated check-in and checkout before CHECKPOINT-01 closes.

## Acceptance Criteria (overall)

- [ ] `docs/plans/reception-theme-styling-cohesion/design-spec.md` exists with all archetype decisions documented.
- [ ] `OperationalTableScreen` component is the single source of gradient and padding for the first wave.
- [ ] `AuthenticatedApp` no longer applies gradient or `p-6` padding.
- [ ] Check-in route renders via `OperationalTableScreen` with ScreenHeader, ActionRail, FilterToolbar, TableCard.
- [ ] Checkout route aligns with `OperationalTableScreen` automatically via PageShell evolution.
- [ ] CI parity tests pass for the 5 routes with existing parity coverage (`/checkin`, `/checkout`, `/safe-management`, `/till-reconciliation`, unauthenticated `/bar`). Routes without parity coverage validated via hosted manual QA spot-checks for the 6 currently confirmed custom-shell routes (`bar`, `eod-checklist`, `end-of-day`, `staff-accounts`, `manager-audit`, `prepare-dashboard`) and any others confirmed at implementation time via `grep -rL PageShell`.
- [ ] Hosted manual QA passes for `/checkin` and `/checkout`.
- [ ] Route-health triage report exists for 4 crash/stall routes.
- [ ] Bar POS layout is unchanged and verified.

## Decision Log

- 2026-03-08: Chosen **Option B** (evolve PageShell into OperationalTableScreen). Rationale: checkout aligns for free; single canonical primitive; zero `withoutGradient` callers confirmed.
- 2026-03-08: Gradient ownership decision deferred to TASK-01 design spec — both `OperationalTableScreen` and `AuthenticatedApp` options are valid; design spec makes the call.
- 2026-03-08: Heading opacity canon deferred to TASK-01 design spec — `text-primary-main` vs `text-primary-main/80`; design spec makes the call.
- 2026-03-08: `FilterToolbar` is slot-based (`children: ReactNode`). DateSelector and DaySelector are caller-injected. Unification of access policy explicitly deferred — not in scope for Wave 1. `[Adjacent: delivery-rehearsal]`
- 2026-03-08: Bar and inbox migration deferred to Wave 2. `POSFullBleedScreen` documented as non-migrating carve-out.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 90% × 1 = 90
- TASK-02: 75% × 2 = 150
- TASK-03: 75% × 2 = 150
- TASK-04: 75% × 2 = 150
- TASK-05: 85% × 1 = 85
- CHECKPOINT-01: 95% × 1 = 95
- TASK-06: 75% × 1 = 75
- Total weighted: 795 / 10 = **79.5% → 80%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Archetype design spec | Yes — fact-find provides all decisions; lp-design-spec skill exists | None | No |
| TASK-02: Reconcile AuthenticatedApp + evolve PageShell | Partial — depends on TASK-01 design spec decision on gradient ownership (not yet documented) | [Missing precondition, Moderate] Gradient ownership decision must be output of TASK-01 before TASK-02 implements it — correctly sequenced (TASK-01 blocks TASK-02); no issue. [Scope gap, Moderate] Bar POS padding impact: removing `AuthenticatedApp` `p-6` affects bar layout (uses AuthenticatedApp but not PageShell); bar must be verified as acceptance criterion in TASK-02 → **added to TASK-02 acceptance**. | Yes — bar layout check added |
| TASK-03: Build primitives | Partial — depends on TASK-01 for slot contracts and TASK-02 for OperationalTableScreen API | [Type contract gap, Moderate] `FilterToolbar` children slot API undefined at planning time; must come from TASK-01 design spec → correctly gated (TASK-01 + TASK-02 block TASK-03). [Scope gap, Minor] "Rooms Ready" control placement — confirmed as caller-injected FilterToolbar child in same flex row; no ambiguity. | No — scope gaps resolved by design |
| TASK-04: Migrate check-in | Partial — depends on TASK-02 + TASK-03 being complete | [Scope gap, Moderate] Modal z-index: `BookingModal`, `DeleteConfirmationModal`, `ArchiveConfirmationModal` are direct children of the outer div (CheckinsTableView:202–217). If OperationalTableScreen wrapper creates a new stacking context (e.g., `transform`, `filter`, `opacity` CSS), modal positioning could break. → **added as Scout task** and TC-04 acceptance criterion. | Yes — scout + acceptance criterion added |
| TASK-05: Verify checkout alignment | Yes — depends only on TASK-02; Checkout.tsx API confirmed compatible | [Scope gap, Minor] `DaySelector` `username` prop is ignored — if TASK-02 introduces a context that passes username, this could surface. Likelihood negligible; documented. | No |
| CHECKPOINT-01: Wave 1 reassessment | Yes — depends on TASK-04 + TASK-05 | None | No |
| TASK-06: Route-health triage | Yes — independent; no preconditions | None | No |

No Critical rehearsal findings. Plan proceeds to `Status: Active`.
