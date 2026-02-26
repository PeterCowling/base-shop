---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Build-last-task: TASK-09 (Wave 2 complete)
Critique-Round: 2
Critique-Score: 4.5
Critique-Verdict: credible
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-ui-screen-polish-phase4
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: frontend-design
Supporting-Skills: lp-do-build
Overall-confidence: 70%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1,M=2,L=3)
Auto-Build-Intent: plan+auto
---

# Reception App — Phase 4 UI Polish Plan

## Summary

Phase 1–3 of the reception app UI polish is complete (9 screens, archived 2026-02-26). 16 screens remain unpolished against the established visual standard: gradient backdrop via PageShell, `bg-surface rounded-xl shadow-lg` card surfaces, accent-bar headings, ReceptionSkeleton loading states, rounded-lg interactive controls, and zero raw color values. This plan delivers Phase 4 across three priority waves using the `frontend-design` skill per screen. Wave 1 targets the four highest-traffic screens lacking PageShell (audit, prime-requests, alloggiati, doc-insert). Wave 2 targets five moderate-use screens also lacking PageShell. Wave 3 applies light polish to the seven screens that already have PageShell. A pre-wave CHECKPOINT task (TASK-00) verifies shared component stability before any implementation begins.

## Active tasks
- [x] TASK-00: Pre-wave fact-check: confirm PageShell and ReceptionSkeleton stable, grep Phase 4 screens for any new issues
- [x] TASK-01: Wave 1 — Audit/Search screen polish
- [x] TASK-02: Wave 1 — Prime Requests screen polish
- [x] TASK-03: Wave 1 — Alloggiati screen polish
- [x] TASK-04: Wave 1 — Doc Insert screen polish
- [x] TASK-05: Wave 2 — Reconciliation Workbench screen polish
- [x] TASK-06: Wave 2 — Variance Heatmap screen polish
- [x] TASK-07: Wave 2 — Menu Performance screen polish
- [x] TASK-08: Wave 2 — Ingredient Stock screen polish
- [x] TASK-09: Wave 2 — Statistics screen polish
- [ ] TASK-10: Wave 3 — Loan Items light polish
- [ ] TASK-11: Wave 3 — Extension light polish
- [ ] TASK-12: Wave 3 — Safe Reconciliation light polish
- [ ] TASK-13: Wave 3 — Email Automation light polish
- [ ] TASK-14: Wave 3 — Live Shift View light polish
- [ ] TASK-15: Wave 3 — Prepayments spot-check
- [ ] TASK-16: Wave 3 — Stock spot-check

## Goals
- Extend the established Phase 1–3 visual standard to all 16 remaining Phase 4 reception app screens
- Eliminate remaining `text-5xl text-center text-primary-main` heading anti-pattern (doc-insert, prime-requests)
- Replace all plain italic/bare loading text with `ReceptionSkeleton` (loan-items, extension, alloggiati, variance-heatmap, ingredient-stock)
- Add PageShell (gradient backdrop + accent-bar heading) to the 9 screens currently missing it
- Sweep all bare `rounded` → `rounded-lg` on interactive controls across all 16 screens
- Apply frontend-design creative direction to elevate dashboards and complex screens beyond mechanical migration

## Non-goals
- Logic changes, data model changes, or new features in any screen
- Fixing debug `console.log` calls in Extension.tsx if removal is logic-entangled (flag only)
- Changing Chart.js dataset colors in MenuPerformanceDashboard (accepted Chart.js integration constraint)
- Shared navigation or AppNav changes (already polished, out of scope)
- Automated visual regression testing (no infrastructure exists; manual QA per screen)
- Light mode CSS (reception-remove-light-mode plan complete; dark mode only)

## Constraints & Assumptions
- Constraints:
  - Dark-mode only — all polish assumes dark mode; no light mode CSS added
  - Token discipline required — no raw hex/rgb values; all colors via semantic token classes
  - Radius cascade: page-level → `rounded-2xl`, content panels → `rounded-xl`, inputs/buttons/badges → `rounded-lg`
  - Gradient backdrop formula: `bg-gradient-to-b from-surface-2 to-surface-3` (PageShell default, no prop needed)
  - `PageShell` is stable and readonly — do not modify `apps/reception/src/components/common/PageShell.tsx`
  - `ReceptionSkeleton` is stable and readonly — import as-is
  - `ReconciliationWorkbench.tsx` must have PageShell added inside the component (not page.tsx) to preserve the `Providers`/`ClientProviders` (`next/dynamic` ssr:false) boundary in its page.tsx — TASK-00 confirmed: page.tsx wraps with `Providers` via `ClientProviders`, not a named `TillDataProvider`
  - `prepayments/page.tsx` and `email-automation/page.tsx` use `next/dynamic` with `ssr: false` — component structural changes must preserve the dynamic import boundary (modifications safe in component internals)
  - Chart.js HSL strings (`hsl(var(--chart-1))`) in MenuPerformanceDashboard are an accepted integration constraint — not a token discipline violation; do not change dataset colors
  - Snapshot tests will break for every screen touched — regeneration is expected and standard procedure per screen
- Assumptions:
  - `frontend-design` skill is the execution mechanism per screen (operator-confirmed)
  - `PageShell`, `ReceptionSkeleton`, and `StatPanel` are stable (verified in fact-find audit)
  - Per-screen work is independent — screens are not visually coupled
  - Snapshot regeneration command: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<screen> --updateSnapshot`

## Inherited Outcome Contract

- **Why:** Phase 1–3 proved the pattern works and staff notice the improvement. Leaving half the app unpolished creates a two-tier experience that undermines the operational consistency goal. Phase 4 completes the visual unification of the reception app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 16 Phase 4 reception app screens polished to the Phase 1–3 visual standard — gradient backdrops, card elevation, accent-bar headings, ReceptionSkeleton loading states, rounded-lg controls, no raw color values — delivered across three priority waves using the frontend-design skill.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-ui-screen-polish-phase4/fact-find.md`
- Key findings used:
  - 7/16 screens already have PageShell; 9/16 need full PageShell migration
  - Wave priority order: Wave 1 = highest-traffic + largest gap (audit, prime-requests, alloggiati, doc-insert); Wave 2 = moderate use (reconciliation-workbench, variance-heatmap, menu-performance, ingredient-stock, statistics); Wave 3 = light polish (PageShell already present)
  - SmallSpinner in audit is acceptable quality — no replacement needed unless table skeleton required
  - Provider constraint in reconciliation-workbench: PageShell inside component, not page.tsx; TASK-00 confirmed page.tsx uses `Providers`/`ClientProviders` (`next/dynamic` ssr:false), not a named `TillDataProvider`
  - Chart.js HSL constraint in menu-performance: accepted, document and leave unchanged
  - Prepayments already mostly polished — spot-check only
  - Debug console.log calls in Extension.tsx: flag only, do not remove if logic-entangled

## Proposed Approach

- Option A: Mechanical migration only — add PageShell/card/skeleton to each screen without additional design direction. Lowest effort, but misses the design quality that made Phase 1–3 successful.
- Option B: Per-screen frontend-design execution — apply the `frontend-design` skill per screen to provide creative direction beyond mechanical migration. Same skill used in Phase 1–3; proven effective. Ensures design consistency with the existing polished screens.
- Chosen approach: **Option B — per-screen frontend-design execution.** The operator explicitly required `frontend-design` as the Execution-Skill for every IMPLEMENT task. The Phase 1–3 results confirm this approach produces staff-noticed improvements. The planning evidence (all 16 screens fully audited) provides sufficient context for the skill to operate effectively on each screen.

## Plan Gates
- Foundation Gate: Pass
  - Deliverable-Type: code-change ✓
  - Execution-Track: code ✓
  - Primary-Execution-Skill: frontend-design ✓
  - Startup-Deliverable-Alias: none ✓
  - Test landscape documented ✓ (snapshot tests, Jest + RTL, per-screen update procedure)
  - Testability confidence: 70% ✓ (meets ≥60% requirement)
- Sequenced: Yes
- Edge-case review complete: Yes (all edge cases reviewed in individual task Edge Cases sections; risks documented in Risks table)
- Auto-build eligible: Yes (multiple IMPLEMENT tasks with confidence ≥80 in Wave 1; no blocking decisions; no Needs-Input tasks)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | CHECKPOINT | Pre-wave fact-check: confirm PageShell and ReceptionSkeleton stable | 95% | S | Complete (2026-02-26) | - | TASK-01, TASK-02, TASK-03, TASK-04 |
| TASK-01 | IMPLEMENT | Wave 1 — Audit/Search screen polish | 80% | M | Complete (2026-02-26) | TASK-00 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-02 | IMPLEMENT | Wave 1 — Prime Requests screen polish | 80% | M | Complete (2026-02-26) | TASK-00 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-03 | IMPLEMENT | Wave 1 — Alloggiati screen polish | 80% | M | Complete (2026-02-26) | TASK-00 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-04 | IMPLEMENT | Wave 1 — Doc Insert screen polish | 80% | M | Complete (2026-02-26) | TASK-00 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-05 | IMPLEMENT | Wave 2 — Reconciliation Workbench screen polish | 75% | M | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 |
| TASK-06 | IMPLEMENT | Wave 2 — Variance Heatmap screen polish | 75% | M | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 |
| TASK-07 | IMPLEMENT | Wave 2 — Menu Performance screen polish | 75% | M | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 |
| TASK-08 | IMPLEMENT | Wave 2 — Ingredient Stock screen polish | 75% | S | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 |
| TASK-09 | IMPLEMENT | Wave 2 — Statistics screen polish | 75% | S | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 |
| TASK-10 | IMPLEMENT | Wave 3 — Loan Items light polish | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-11 | IMPLEMENT | Wave 3 — Extension light polish | 65% | M | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-12 | IMPLEMENT | Wave 3 — Safe Reconciliation light polish | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-13 | IMPLEMENT | Wave 3 — Email Automation light polish | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-14 | IMPLEMENT | Wave 3 — Live Shift View light polish | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-15 | IMPLEMENT | Wave 3 — Prepayments spot-check | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-16 | IMPLEMENT | Wave 3 — Stock spot-check | 60% | S | Pending | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 0 | TASK-00 | - | Sequential CHECKPOINT; blocks all Wave 1 tasks |
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-00 complete | All four run in parallel; each touches a different component file |
| 2 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | All Wave 1 tasks complete | All five run in parallel; each touches a different component file |
| 3 | TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16 | All Wave 2 tasks complete | All seven run in parallel; each touches a different component file. Wave gate is a planning-discipline choice (not a file-overlap constraint) — Wave 3 screens already have PageShell and their changes are independent of Wave 2 files, but completing Wave 2 first ensures the full design standard is stable before lower-priority spot-checks begin. |

**Max parallelism:** 7 (Wave 3)
**Critical path:** TASK-00 → [any Wave 1] → [any Wave 2] → [any Wave 3] (4 waves)
**Total tasks:** 17 (1 CHECKPOINT + 16 IMPLEMENT)
**File overlap:** None detected — all tasks affect distinct component files

## Tasks

---

### TASK-00: Pre-wave fact-check — confirm PageShell and ReceptionSkeleton stable, grep Phase 4 screens for any new issues
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence; confirmation that shared components are stable and no new issues were found in Phase 4 screens since the fact-find audit
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/plans/reception-ui-screen-polish-phase4/plan.md`
- **Depends on:** -
- **Blocks:** TASK-01, TASK-02, TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — process is defined; checkpoint is a read-only verification pass
  - Approach: 95% — prevents executing against stale facts
  - Impact: 95% — controls downstream risk in all 16 tasks
- **Acceptance:**
  - `PageShell.tsx` read and confirmed stable (≤45 lines, gradient default, no breaking changes since fact-find)
  - `ReceptionSkeleton.tsx` read and confirmed importable with `rows?: number = 5` interface
  - `StatPanel.tsx` read and confirmed available for use
  - Grep for `rounded[^-lg]` and `rounded\b` patterns in all 16 Phase 4 component files confirms no new radius instances beyond those documented in the fact-find
  - Grep for any new import or usage of `PageShell` added to any of the 9 Group B screens since the fact-find confirms no overlap work
  - If any new issue is found: plan updated with a note in the relevant task before Wave 1 begins
- **Horizon assumptions to validate:**
  - PageShell is still 45 lines and the `title` + `withoutGradient` props are the only props (no new breaking changes)
  - ReceptionSkeleton still accepts `rows?: number = 5` — no interface changes since Phase 1–3
  - Provider constraint confirmed: `apps/reception/src/app/reconciliation-workbench/page.tsx` uses `Providers` via `ClientProviders` (`next/dynamic` ssr:false) — the named `TillDataProvider` referenced in the fact-find does not exist as a named import; constraint (PageShell inside component, not page) remains valid
  - No new dynamic import boundary was added to any Wave 1–3 screen since the fact-find audit date (2026-02-26)
- **Validation contract:** Checkpoint completion verified by: (1) explicit confirmation note in plan that PageShell/ReceptionSkeleton are stable, (2) grep output summary showing no new radius/heading violations beyond the fact-find inventory
- **Planning validation:** Fact-find completed 2026-02-26; all 16 screens read in full; checkpoint is a freshness gate only
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Inline note added to plan if new issues found; no separate doc needed
- **Build evidence (2026-02-26):**
  - `PageShell.tsx`: 45 lines confirmed stable — props `title/children/className?/headerSlot?/withoutGradient?`, gradient default (`bg-gradient-to-b from-surface-2 to-surface-3`), `memo` wrapped. Matches fact-find exactly.
  - `ReceptionSkeleton.tsx`: confirmed stable — `rows?: number = 5`, default export, animated shimmer rows (`h-10 animate-pulse rounded-lg bg-surface-3`).
  - `StatPanel.tsx`: confirmed available — `label/value/icon?` props.
  - Constraint correction: `reconciliation-workbench/page.tsx` wraps with `Providers` via `ClientProviders` (`next/dynamic` ssr:false) — no named `TillDataProvider`. Constraint (PageShell inside component, not page.tsx) is valid and unchanged.
  - Group B bare `rounded` grep: matched fact-find inventory. One additional finding in `IngredientStock.tsx` — warning/success banners (lines 44, 67) and warning button (line 51) also use bare `rounded`. Plan updated (TASK-08 Planning validation note added).
  - Group A bare `rounded` grep: no violations found. Group A screens are clean.
  - Group B PageShell check: no PageShell added to any of the 9 Group B screens since the fact-find. No overlap work.
  - All acceptance criteria met. Downstream tasks unaffected by findings (TASK-08 scope note added; no task confidence impact).

---

### TASK-01: Wave 1 — Audit/Search screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/search/Search.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/search/Search.tsx`; snapshot test file in `apps/reception/src/components/search/__tests__/`
- **Depends on:** TASK-00
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 80%
  - Implementation: 85% — Search.tsx (270L) fully audited; no PageShell, bare React fragment root, no card, tab-scoped `h2` only, uses SmallSpinner for loading. Migration path is clear: add `<PageShell title="Audit">`, wrap content in `bg-surface rounded-xl shadow-lg p-6` card, retain SmallSpinner (acceptable quality per fact-find resolution), sweep `rounded` → `rounded-lg`. No logic changes. Fact-find cap: implementation ≤88%.
  - Approach: 85% — Frontend-design skill per screen is proven effective from Phase 1–3. SmallSpinner retention decision is made (fact-find Q resolved: spinners acceptable for non-table loading). React fragment root → PageShell wrapping adds a single structural element; approach is identical to Phase 2–3 screens with the same starting condition.
  - Impact: 80% — Audit is the highest-frequency daily-use lookup screen. Staff notice improvements to screens they use every day (Phase 1–3 evidence). Held-back test: single unknown that could push below 80 — if staff do not notice the gradient/card improvement specifically on this screen (e.g., the tab interface draws visual attention away from the backdrop). This is possible but the Phase 1–3 evidence strongly suggests visual improvements are noticed on operational screens. Held-back test result: no single unresolved unknown would drop impact below 80; Phase 1–3 staff feedback is the evidence base.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default (no withoutGradient prop)
  - [ ] Accent-bar `h1` heading present with `text-2xl font-heading font-semibold text-foreground`
  - [ ] Content wrapped in `bg-surface rounded-xl shadow-lg p-6` card
  - [ ] All interactive controls (tabs, buttons) use `rounded-lg` not bare `rounded`
  - [ ] Zero raw color values — all via semantic token classes
  - [ ] SmallSpinner retained (not replaced); or if a full table skeleton is needed, `ReceptionSkeleton` used instead
  - [ ] Snapshot tests updated: `jest --testPathPattern=search --updateSnapshot` passes
  - [ ] Manual visual QA checklist: gradient visible ✓, accent-bar heading ✓, card elevated ✓, controls rounded-lg ✓, no raw colors ✓
- **Validation contract (TC-01):**
  - TC-01: Render Search.tsx in test — expect PageShell wrapper present in snapshot
  - TC-02: Snapshot update passes — `jest --testPathPattern=search --updateSnapshot` exits 0
  - TC-03: No raw color values (hex/rgb) grep in modified file returns empty
  - TC-04: No bare `rounded` class (without `-lg`/`-xl`/`-2xl`) remains in modified JSX
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Search.tsx` in full; identify current structure (React fragment root, tab-scoped h2, SmallSpinner usage, bare rounded instances); confirm no unexpected patterns beyond fact-find audit
  - Green: Add `<PageShell title="Audit">` wrapper replacing the React fragment root; add `bg-surface rounded-xl shadow-lg p-6` card around tab content; replace bare `rounded` with `rounded-lg` on all interactive controls; run snapshot update
  - Refactor: Apply frontend-design creative direction — verify visual hierarchy, accent-bar heading alignment with tab structure, consistent spacing inside card
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of Search.tsx, 270L)
  - Validation artifacts: fact-find.md Evidence Audit table — Search.tsx entry confirms no PageShell, bare React fragment root, SmallSpinner, tab-scoped h2 only
  - Unexpected findings: None. SmallSpinner retention decision resolved in fact-find (Q: Should SmallSpinner be replaced?)
- **Consumer tracing (M effort):**
  - New outputs from this task: none. This is a JSX visual restructuring only. No new function return values, no new interface fields, no new config keys.
  - Modified behaviors: The component's root element changes from a React fragment to a PageShell wrapper div. Downstream consumer: snapshot test — expected to break and be regenerated. No other downstream consumers of Search.tsx's JSX structure.
  - Consumer `Search.tsx` snapshot test: updated via `--updateSnapshot` within this task. No consumers left unaddressed.
- **Scouts:** Read Search.tsx fully at task start to confirm no additional patterns (e.g., conditional rendering paths, nested loading states) missed in the fact-find audit before making changes.
- **Edge Cases & Hardening:**
  - If the tab interface has its own background that conflicts with the PageShell gradient, apply `bg-transparent` to the tab container and let PageShell gradient show through
  - If SmallSpinner renders inside a conditional that also returns a loading-only JSX tree, ensure the loading path is also wrapped in PageShell (or uses a PageShell-compatible loading wrapper)
- **What would make this ≥90%:**
  - Full read of Search.tsx confirming no hidden conditional rendering paths or nested loading states beyond what the fact-find captured would raise Implementation to 90%
  - Confirmed Phase 1–3 staff feedback on audit screen specifically (not just general screens) would raise Impact to 85%
- **Rollout / rollback:**
  - Rollout: Per-screen commit after task complete; no feature flag (internal staff tool)
  - Rollback: `git revert` the Search.tsx commit; no downstream effects
- **Documentation impact:** None: visual-only change; no API or interface documentation affected
- **Notes / references:**
  - SmallSpinner located at `apps/reception/src/components/search/SmallSpinner.tsx` — retain if used for single-element loading; only replace with ReceptionSkeleton if a full table skeleton is needed
  - Phase 1–3 reference screens for heading pattern: PrepareDashboard, RealTimeDashboard (accent-bar h1 with `h-7 w-1 rounded-full bg-primary-main`)
- **Build evidence (2026-02-26):**
  - `PageShell title="Audit"` added as root wrapper replacing React fragment
  - `bg-surface rounded-xl shadow-lg p-6` card wrapping tab bar + tab content
  - Tab buttons: 3× bare `rounded` → `rounded-lg`
  - `h2 text-xl font-semibold "Search Bookings"` retained as tab sub-heading (not page heading)
  - SmallSpinner retained in loading path (per fact-find resolution)
  - TC-01–TC-04: all 19 Wave 1 tests pass; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: d23f167a85

---

### TASK-02: Wave 1 — Prime Requests screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx`; snapshot test file in `apps/reception/src/components/prime-requests/__tests__/`
- **Depends on:** TASK-00
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 80%
  - Implementation: 85% — PrimeRequestsQueue.tsx (307L) fully audited: `text-5xl text-primary-main text-center` heading (same anti-pattern removed from PrepareDashboard/RealTimeDashboard in Phase 2), flat `bg-surface-2` root, `rounded-lg bg-surface shadow` card (upgrade shadow to `shadow-lg`). No PageShell. Migration path clear. Fact-find cap: implementation ≤88%.
  - Approach: 85% — This is the same heading anti-pattern removal executed successfully in Phase 2. The approach is identical: replace `text-5xl text-primary-main text-center` with PageShell `title` prop, upgrade existing card shadow from `shadow` to `shadow-lg`, add gradient backdrop via PageShell default.
  - Impact: 80% — Prime Requests is a daily queue management screen (second highest traffic after audit). Staff interact with this screen daily; visual improvement will be noticed. Held-back test: single unknown that could push impact below 80 — if the queue cards are so visually dominant that the backdrop gradient is barely perceptible, impact might be lower. However the heading anti-pattern removal is an unambiguous improvement regardless of backdrop perception. Held-back test result: no single unknown would drop impact below 80; heading fix alone justifies 80%.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present replacing `text-5xl text-primary-main text-center`
  - [ ] Card surface upgraded to `shadow-lg` from bare `shadow`
  - [ ] All interactive controls use `rounded-lg` not bare `rounded`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated: `jest --testPathPattern=prime-requests --updateSnapshot` passes
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, controls rounded-lg ✓, no raw colors ✓
- **Validation contract (TC-02):**
  - TC-01: Render PrimeRequestsQueue.tsx in test — expect PageShell wrapper present in snapshot, no `text-5xl` class
  - TC-02: Snapshot update passes — `jest --testPathPattern=prime-requests --updateSnapshot` exits 0
  - TC-03: No raw color values grep in modified file returns empty
  - TC-04: No bare `rounded` (without suffix) remains in modified JSX
- **Execution plan:** Red → Green → Refactor
  - Red: Read `PrimeRequestsQueue.tsx` in full; confirm `text-5xl text-primary-main text-center` heading location, flat root structure, card shadow value, any `rounded` instances
  - Green: Add `<PageShell title="Prime Requests">` wrapper; remove `text-5xl text-primary-main text-center` heading element (replaced by PageShell title prop); upgrade card `shadow` → `shadow-lg`; sweep `rounded` → `rounded-lg`; run snapshot update
  - Refactor: Apply frontend-design creative direction — review queue item card layout, spacing, visual hierarchy within the new gradient context
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of PrimeRequestsQueue.tsx, 307L)
  - Validation artifacts: fact-find.md — confirms `text-5xl text-primary-main text-center`, flat `bg-surface-2` root, card with weak shadow
  - Unexpected findings: None
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Modified behaviors: Root element changes from flat div to PageShell wrapper; heading element removed. Downstream consumer: snapshot test — updated via `--updateSnapshot` within this task.
- **Scouts:** Read PrimeRequestsQueue.tsx fully at task start to confirm heading element location and any additional `rounded` instances not captured in fact-find.
- **Edge Cases & Hardening:**
  - If queue items have their own `bg-surface-2` background that is now redundant (gradient provides context), consider whether to remove the explicit bg or keep it for card separation clarity
- **What would make this ≥90%:**
  - Full read of PrimeRequestsQueue.tsx confirming no additional heading anti-patterns or conditional loading paths
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the PrimeRequestsQueue.tsx commit
- **Documentation impact:** None: visual-only change
- **Notes / references:**
  - Same heading anti-pattern (`text-5xl text-primary-main text-center`) also in DocInsertPage.tsx — removed in TASK-04
- **Build evidence (2026-02-26):**
  - `PageShell title="Prime Requests"` added replacing `div.min-h-80vh bg-surface-2`
  - `h1 text-5xl text-primary-main text-center` removed (replaced by PageShell accent-bar heading)
  - Card shadow upgraded: `shadow` → `shadow-lg`
  - Status filter buttons: `rounded` → `rounded-lg`; select: `rounded` → `rounded-lg`; input: `rounded` → `rounded-lg`; Apply button: `rounded` → `rounded-lg`
  - TC-01–TC-04: all tests pass; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: d23f167a85

---

### TASK-03: Wave 1 — Alloggiati screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/man/Alloggiati.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/man/Alloggiati.tsx`; snapshot test file in `apps/reception/src/components/man/__tests__/`
- **Depends on:** TASK-00
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 80%
  - Implementation: 85% — Alloggiati.tsx (391L, L by line count but M by change complexity: changes are JSX wrapping, heading swap, skeleton add) fully audited: bare `h2 text-xl font-bold`, React fragment root, no card wrapper, submission section `border rounded p-3` only, inline `<p>` loading text. Highest blast radius in Group B (React fragment root, first structural element). Fact-find cap: ≤88%.
  - Approach: 85% — React fragment → PageShell wrapping is the same pattern as Phase 2–3 (e.g., Alloggiati-equivalent screens). The key constraint is that after wrapping, heading role tests (`getByRole('heading', { level: 2 })`) may need updating to level 1 — this is expected and documented. ReceptionSkeleton replaces inline `<p>` loading text (same as Phase 2).
  - Impact: 80% — Alloggiati is the police registration screen used for near-daily check-in registration. Direct staff-facing impact during a compliance workflow. Held-back test: single unknown — if heading level assertion changes in existing tests cause unexpected test failures beyond the snapshot, the task might need a test fix sub-step. However, test failures are identified and fixed within the task scope. No single unknown would block task completion or drop impact below 80. Held-back test result: pass.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present replacing `h2 text-xl font-bold`
  - [ ] Submission section wrapped in `bg-surface rounded-xl shadow-lg p-6` card (replacing `border rounded p-3`)
  - [ ] Inline `<p>` loading text replaced with `<ReceptionSkeleton rows={3} />`
  - [ ] All interactive controls (buttons, inputs) use `rounded-lg`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated: `jest --testPathPattern=alloggiati --updateSnapshot` passes
  - [ ] Any `getByRole('heading', { level: 2 })` assertions updated to level 1 in test files if present
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, skeleton loading ✓, controls rounded-lg ✓, no raw colors ✓
- **Validation contract (TC-03):**
  - TC-01: Render Alloggiati.tsx in test — expect PageShell wrapper, `h1` heading, no `<p>` loading text in snapshot
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
  - TC-04: No bare `rounded` remains in modified JSX
  - TC-05: If heading role tests exist, confirm they pass after level adjustment
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Alloggiati.tsx` in full (391L); identify all loading states, heading usages, rounded instances, and submission section structure; check `man/__tests__/` for heading role assertions
  - Green: Add `<PageShell title="Alloggiati">` wrapper replacing React fragment root; replace `h2` heading with PageShell `title` prop; wrap submission section in `bg-surface rounded-xl shadow-lg p-6` card; replace inline `<p>` loading text with `<ReceptionSkeleton rows={3} />`; sweep `rounded` → `rounded-lg` on all interactive controls; fix any heading role assertions in tests; run snapshot update
  - Refactor: Apply frontend-design creative direction — review multi-section layout within card context, consistent vertical rhythm for form sections
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of Alloggiati.tsx, 391L); test directory confirmed at `man/__tests__/`
  - Validation artifacts: fact-find.md — confirms React fragment root, `h2 text-xl font-bold`, `border rounded p-3` submission section, inline `<p>` loading text
  - Unexpected findings: Highest blast radius in Group B — React fragment root means the first structural wrapper element is being added. This is expected; same pattern as other Phase 2–3 screens with fragment roots.
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Modified behaviors: Root element changes from React fragment to PageShell; heading changes from h2 to h1 (via PageShell title); loading state changes from `<p>` text to ReceptionSkeleton. Downstream consumers: (1) snapshot test — updated via `--updateSnapshot`; (2) any `getByRole('heading', { level: 2 })` assertions in test files — updated within this task. No other consumers.
- **Scouts:** Read `man/__tests__/` to identify any heading role assertions before making changes; update them within the same task.
- **Edge Cases & Hardening:**
  - Alloggiati.tsx has multiple loading states (submission in progress, data loading) — ensure all loading paths are addressed, not just the top-level one
  - If the submission section uses a conditional render that includes the `border rounded p-3` wrapper, ensure the card upgrade is applied to all conditional branches
- **What would make this ≥90%:**
  - Read `man/__tests__/` directory and confirm no heading role assertions (or that they are identified and planned for update) would raise Implementation to 90%
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the Alloggiati.tsx commit
- **Documentation impact:** None: visual-only change
- **Notes / references:**
  - Alloggiati is the police registration compliance tool — visual quality matters for staff confidence in compliance workflows
  - Debug note from fact-find: no debug console.log calls noted in Alloggiati.tsx (only Extension.tsx has this issue)
- **Build evidence (2026-02-26):**
  - `PageShell title="Alloggiati"` added replacing React fragment root; `h2 text-xl font-bold` removed
  - Loading `<p>` replaced with `<ReceptionSkeleton rows={3} />`; test updated to use `aria-busy="true"` selector
  - Send section: `border border-border-2 rounded` → `bg-surface rounded-xl shadow-lg p-6` card
  - TC-01–TC-05: all tests pass; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: d23f167a85

---

### TASK-04: Wave 1 — Doc Insert screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/checkins/docInsert/DocInsertPage.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/checkins/docInsert/DocInsertPage.tsx`
- **Depends on:** TASK-00
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 80%
  - Implementation: 85% — DocInsertPage.tsx (181L) fully audited: `text-5xl text-primary-main text-center` heading, outer wrapper `p-4 mx-auto` (no gradient), own `bg-surface rounded-2xl shadow-xl` card (good — keep; it uses rounded-2xl which is correct for panel-level). Add gradient backdrop via PageShell, fix heading only; card is already strong. Fact-find cap: ≤88%.
  - Approach: 85% — This is the simplest Group B screen: existing card is already well-formed (rounded-2xl shadow-xl), so the only changes are (1) add PageShell for gradient, (2) replace text-5xl heading with accent-bar h1 via PageShell title. Lower risk than other Group B screens.
  - Impact: 80% — Doc Insert is part of the check-in flow, used multiple times per day during busy check-in periods. Heading fix eliminates the most visually jarring anti-pattern (oversized centered heading vs. refined accent-bar). Held-back test: if the existing rounded-2xl shadow-xl card already provides most of the visual quality, the PageShell addition may provide marginal incremental improvement. But heading fix is independently impactful. No single unknown drops impact below 80. Held-back test result: pass.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present replacing `text-5xl text-primary-main text-center`
  - [ ] Existing `bg-surface rounded-2xl shadow-xl` card preserved (not replaced)
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, existing card preserved ✓, no raw colors ✓
- **Validation contract (TC-04):**
  - TC-01: Render DocInsertPage.tsx in test — expect PageShell wrapper, no `text-5xl` class in snapshot
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
- **Execution plan:** Red → Green → Refactor
  - Red: Read `DocInsertPage.tsx` in full (181L); confirm `text-5xl text-primary-main text-center` heading location, `p-4 mx-auto` outer wrapper, `bg-surface rounded-2xl shadow-xl` card structure
  - Green: Replace outer `p-4 mx-auto` div with `<PageShell title="Document Insert">`; remove `text-5xl text-primary-main text-center` heading (replaced by PageShell title prop); preserve inner `bg-surface rounded-2xl shadow-xl` card; run snapshot update
  - Refactor: Apply frontend-design creative direction — verify card sits well within PageShell gradient context; adjust padding if needed
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of DocInsertPage.tsx, 181L)
  - Validation artifacts: fact-find.md — confirms text-5xl heading, `p-4 mx-auto` outer wrapper, own card (keep)
  - Unexpected findings: None. This is the simplest Wave 1 screen to migrate.
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Modified behaviors: Outer wrapper element changes; heading changes. Downstream consumer: snapshot test — updated within this task.
- **Scouts:** None beyond full file read at task start.
- **Edge Cases & Hardening:**
  - Verify that `rounded-2xl` on the existing card is intentional (panel level — correct per radius cascade) and should not be changed to `rounded-xl`
- **What would make this ≥90%:**
  - Full file read confirming no additional conditional rendering paths or unexpected wrapper patterns raises Implementation to 90%
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the DocInsertPage.tsx commit
- **Documentation impact:** None: visual-only change
- **Notes / references:**
  - Keep existing `bg-surface rounded-2xl shadow-xl` card — it already meets the standard (shadow-xl exceeds shadow-lg, rounded-2xl is correct for this panel level)
- **Build evidence (2026-02-26):**
  - `PageShell title="Insert Guest Details"` added replacing `div.p-4.mx-auto.font-body`
  - `h1 text-5xl font-heading text-primary-main` removed (replaced by PageShell accent-bar heading)
  - Existing `bg-surface rounded-2xl shadow-xl px-8 py-12` card preserved
  - Early-return loading/error/no-occupant states also wrapped in PageShell for visual consistency
  - TC-01–TC-03: all tests pass; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: d23f167a85

---

### TASK-05: Wave 2 — Reconciliation Workbench screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/till/ReconciliationWorkbench.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/till/ReconciliationWorkbench.tsx`; `[readonly] apps/reception/src/app/reconciliation-workbench/page.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16
- **Confidence:** 75%
  - Implementation: 85% — ReconciliationWorkbench.tsx (388L) fully audited: own `h2 text-2xl font-semibold`, no gradient, no card container, bare `rounded` on all inputs/buttons. Critical constraint: PageShell must be added inside the component (not page.tsx) to preserve TillDataProvider wrapper. This constraint is clearly documented and the approach is viable — the component is the JSX owner; page.tsx only provides the data provider boundary.
  - Approach: 85% — Adding PageShell as the first element in the component's JSX return is the correct and safe approach. TillDataProvider provides data context only; it does not affect JSX structure inside the component.
  - Impact: 65% — Reconciliation workbench is used during till close (daily but scheduled). Visual improvement is real but lower daily frequency than Wave 1 screens. The table/form-heavy nature of the screen means gradient backdrop adds less perceptible value than on dashboard screens. Impact capped at 65% due to lower daily surface area and the moderate-frequency usage assumption (not verified against actual usage data).
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell added inside `ReconciliationWorkbench.tsx` component return
  - [ ] `page.tsx` TillDataProvider boundary preserved — PageShell is NOT added to page.tsx
  - [ ] Accent-bar `h1` heading present replacing `h2 text-2xl font-semibold`
  - [ ] Content wrapped in `bg-surface rounded-xl shadow-lg p-6` card
  - [ ] All inputs and buttons use `rounded-lg` not bare `rounded`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, controls rounded-lg ✓, no raw colors ✓
- **Validation contract (TC-05):**
  - TC-01: Render ReconciliationWorkbench.tsx in test — expect PageShell wrapper inside component, no `text-2xl font-semibold` bare h2
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
  - TC-04: No bare `rounded` remains in modified JSX
  - TC-05: Verify page.tsx is unmodified (TillDataProvider boundary preserved)
- **Execution plan:** Red → Green → Refactor
  - Red: Read `ReconciliationWorkbench.tsx` in full (388L) and `page.tsx`; confirm h2 location, all `rounded` instances, no card wrapper currently, TillDataProvider boundary in page.tsx
  - Green: Add `<PageShell title="Reconciliation Workbench">` as first element in component JSX return; replace `h2` heading with PageShell `title` prop; wrap content in `bg-surface rounded-xl shadow-lg p-6`; sweep `rounded` → `rounded-lg`; run snapshot update
  - Refactor: Apply frontend-design creative direction — review table layout within card, column headers, form input alignment in new gradient context
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit; page.tsx audit confirming TillDataProvider boundary
  - Validation artifacts: fact-find.md confirms constraint; `apps/reception/src/app/reconciliation-workbench/page.tsx` read in fact-find
  - Unexpected findings: None beyond the documented TillDataProvider constraint
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Modified behaviors: Root JSX element of component changes; heading changes. Consumer: snapshot test — updated within this task. Page.tsx unchanged.
- **Scouts:** Read both `ReconciliationWorkbench.tsx` and `page.tsx` at task start to confirm TillDataProvider structure and no new wrapping patterns added since fact-find.
- **Edge Cases & Hardening:**
  - If ReconciliationWorkbench.tsx has conditional renders (e.g., loading state, empty state), ensure all branches are wrapped by PageShell (PageShell should be the outermost return; loading/empty states render as children)
  - Do not add any `className` to the PageShell component that would affect the gradient (gradient is the default; no props needed)
- **What would make this ≥90%:**
  - Read ReconciliationWorkbench.tsx in full and confirm all conditional render paths are identifiable would raise Implementation to 90%
  - Verified usage frequency data showing till close happens at least 1x/day would raise Impact to 75%
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the ReconciliationWorkbench.tsx commit; page.tsx unchanged
- **Documentation impact:** None: visual-only change
- **Notes / references:**
  - CRITICAL: PageShell added inside ReconciliationWorkbench.tsx component return, NOT in page.tsx. This preserves TillDataProvider context for all child components.
- **Build evidence (2026-02-26):**
  - `PageShell title="Reconciliation Workbench"` added as root of `ReconciliationWorkbenchContent` (inner memoized component); `h2 text-2xl font-semibold` removed
  - Content wrapped in `bg-surface rounded-xl shadow-lg p-6` card
  - PmsPostingForm inputs/select/button: `rounded` → `rounded-lg`; TerminalBatchForm inputs/button: `rounded` → `rounded-lg` (6 instances total)
  - `TillDataProvider` wrapper in outer `ReconciliationWorkbench` component preserved unchanged
  - TC-01–TC-05: all tests pass; typecheck clean; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: 4b777cacab

---

### TASK-06: Wave 2 — Variance Heatmap screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/reports/VarianceHeatMap.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/reports/VarianceHeatMap.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16
- **Confidence:** 75%
  - Implementation: 85% — VarianceHeatMap.tsx (233L) fully audited: no page-level h1, bare root div, weak card on thresholds panel only (`rounded border shadow-sm`), bare `rounded` throughout, plain `<p>Loading...</p>`. Migration path clear: add PageShell, add page-level h1 via PageShell title, upgrade thresholds card to `shadow-lg`, replace loading text with ReceptionSkeleton, sweep rounded.
  - Approach: 85% — Standard Group B migration. The heatmap visualization itself is separate from the page structure; PageShell wrapping does not affect chart/table rendering.
  - Impact: 65% — Variance heatmap is a reporting/analysis screen, used less frequently than the daily-operation Wave 1 screens. Visual improvement is real but impact is lower than audit/alloggiati/prime-requests.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present (no existing page-level heading to remove, just add via PageShell title)
  - [ ] Thresholds card upgraded to `bg-surface rounded-xl shadow-lg p-6`
  - [ ] Plain `<p>Loading...</p>` replaced with `<ReceptionSkeleton rows={4} />`
  - [ ] All interactive controls use `rounded-lg`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, skeleton loading ✓, controls rounded-lg ✓, no raw colors ✓
- **Validation contract (TC-06):**
  - TC-01: Render VarianceHeatMap.tsx in test — expect PageShell wrapper, ReceptionSkeleton in loading path, no `<p>Loading` in snapshot
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
  - TC-04: No bare `rounded` remains in modified JSX
- **Execution plan:** Red → Green → Refactor
  - Red: Read `VarianceHeatMap.tsx` in full; identify all `rounded` instances, loading state render path, thresholds card location
  - Green: Add `<PageShell title="Variance Heatmap">`; wrap content in `bg-surface rounded-xl shadow-lg p-6`; upgrade thresholds card shadow; replace `<p>Loading...</p>` with `<ReceptionSkeleton rows={4} />`; sweep `rounded` → `rounded-lg`; run snapshot update
  - Refactor: Apply frontend-design creative direction — review heatmap table within card context, threshold panel layout
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of VarianceHeatMap.tsx, 233L)
  - Validation artifacts: fact-find.md entry confirmed
  - Unexpected findings: None
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Consumer: snapshot test — updated within this task.
- **Scouts:** Read `VarianceHeatMap.tsx` fully at task start to confirm all loading state paths.
- **Edge Cases & Hardening:** None beyond standard Group B edge cases (all conditional rendering branches wrapped under PageShell)
- **What would make this ≥90%:**
  - Full read confirming no hidden loading states beyond the `<p>Loading...`
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the VarianceHeatMap.tsx commit
- **Documentation impact:** None: visual-only change
- **Build evidence (2026-02-26):**
  - `PageShell title="Variance Heatmap"` added replacing bare `div.space-y-6` root
  - Loading early-return: `<p>Loading variance data...</p>` → `<PageShell title="Variance Heatmap"><ReceptionSkeleton rows={4} /></PageShell>`
  - Error early-return wrapped in PageShell for visual consistency
  - Thresholds card: `rounded border border-border bg-surface p-4 shadow-sm` → `rounded-xl border border-border bg-surface p-4 shadow-lg`
  - Cash threshold input: `rounded border` → `rounded-lg border`; keycard threshold input: `rounded border` → `rounded-lg border`
  - Save button: `rounded bg-primary-main` → `rounded-lg bg-primary-main`
  - TC-01–TC-04: all tests pass; typecheck clean; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: 4b777cacab

---

### TASK-07: Wave 2 — Menu Performance screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16
- **Confidence:** 75%
  - Implementation: 85% — MenuPerformanceDashboard.tsx (211L) fully audited: own `h1 text-2xl font-semibold` (no font-heading), flat `bg-surface rounded shadow` root, bare `rounded` on root card. Chart.js HSL constraint documented: `hsl(var(--chart-1))` strings passed to dataset colors — do not change. Migration: add PageShell, fix heading font-heading, upgrade card shadow, sweep rounded. Fact-find cap: ≤88%.
  - Approach: 85% — Standard Group B migration. Chart.js constraint is clear: touch only the page structure/heading/card, not the dataset color strings. Accepted constraint requires no deviation from standard approach.
  - Impact: 65% — Menu performance is an analytics screen used for periodic review, not daily operations. Lower daily contact frequency.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present with `font-heading` replacing `text-2xl font-semibold` (no font-heading)
  - [ ] Root card upgraded to `bg-surface rounded-xl shadow-lg` from `bg-surface rounded shadow`
  - [ ] All interactive controls use `rounded-lg`
  - [ ] Zero raw color values in JSX/CSS (Chart.js HSL dataset strings are accepted exception — document in code comment)
  - [ ] Chart.js dataset `backgroundColor`/`borderColor` HSL strings UNCHANGED
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, controls rounded-lg ✓, chart colors unchanged ✓
- **Validation contract (TC-07):**
  - TC-01: Render MenuPerformanceDashboard.tsx in test — expect PageShell wrapper, font-heading class in heading, no bare `rounded` class on root card
  - TC-02: Snapshot update passes
  - TC-03: Chart.js dataset color strings unchanged (grep `hsl(var(--chart` still present)
  - TC-04: No bare `rounded` (without suffix) remains in structural JSX
- **Execution plan:** Red → Green → Refactor
  - Red: Read `MenuPerformanceDashboard.tsx` in full; identify heading element, root card classes, all `rounded` instances, Chart.js dataset color string locations (do not touch)
  - Green: Add `<PageShell title="Menu Performance">`; replace `h1 text-2xl font-semibold` with PageShell title (accent-bar heading includes font-heading); upgrade root card `bg-surface rounded shadow` → `bg-surface rounded-xl shadow-lg`; sweep `rounded` → `rounded-lg` on interactive controls only; add code comment noting Chart.js HSL constraint; run snapshot update
  - Refactor: Apply frontend-design creative direction — review chart container layout within new card/gradient context
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of MenuPerformanceDashboard.tsx, 211L)
  - Validation artifacts: fact-find.md — Chart.js constraint confirmed and resolved
  - Unexpected findings: None
- **Consumer tracing (M effort):**
  - New outputs: none. JSX visual restructuring only.
  - Modified behaviors: Heading class changes (adds font-heading via PageShell title); card shadow upgrades. Consumer: snapshot test — updated within task.
  - Chart.js dataset color strings: unchanged. Consumer (Chart.js library): no change, strings still consumed as-is.
- **Scouts:** Read MenuPerformanceDashboard.tsx fully at task start; identify all Chart.js dataset configuration sections to ensure no accidental modification.
- **Edge Cases & Hardening:**
  - Chart.js color strings use `hsl(var(--chart-N))` pattern — these are raw HSL function calls but they reference CSS variables, which is an accepted Chart.js integration pattern. Add a code comment: `// Chart.js dataset colors intentionally use hsl(var(--chart-N)) — accepted integration pattern, not a token discipline violation`
- **What would make this ≥90%:**
  - Confirmed that no other string-based color references exist beyond the known Chart.js dataset fields
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the MenuPerformanceDashboard.tsx commit
- **Documentation impact:** None beyond inline code comment for Chart.js constraint
- **Notes / references:**
  - Chart.js HSL constraint is a known limitation of the Chart.js API — color values must be passed as strings, not Tailwind utility classes
- **Build evidence (2026-02-26):**
  - `PageShell title="Menu Performance"` added replacing `div.space-y-8.p-4.bg-surface.rounded.shadow` root
  - `h1 text-2xl font-semibold` removed (replaced by PageShell accent-bar heading with font-heading)
  - Content wrapped in `bg-surface rounded-xl shadow-lg p-6 space-y-8` card
  - Loading early-return: `<p>Loading transaction data…</p>` → `<PageShell title="Menu Performance"><ReceptionSkeleton rows={4} /></PageShell>`
  - Error early-return: `<p className="text-danger-fg">` → `<PageShell title="Menu Performance"><p className="text-error-main">` (token fix: `text-danger-fg` → `text-error-main`)
  - Chart.js HSL dataset strings on lines 158, 170–171, 181–182 left unchanged
  - TC-01–TC-04: all tests pass; typecheck clean; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: 4b777cacab

---

### TASK-08: Wave 2 — Ingredient Stock screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inventory/IngredientStock.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/inventory/IngredientStock.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16
- **Confidence:** 75%
  - Implementation: 85% — IngredientStock.tsx (106L, S complexity) fully audited: own `h1 text-3xl font-bold` (no font-heading), bare `div p-4` root, no card, `<div>Loading...</div>` bare. Minimal component. Migration is straightforward.
  - Approach: 85% — Simplest Group B screen by line count. Standard migration: PageShell, card surface, replace loading div with ReceptionSkeleton, fix heading.
  - Impact: 65% — Inventory management screen; usage frequency is periodic (stock takes/checks), not daily operational. Lower impact than Wave 1 screens.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present replacing `h1 text-3xl font-bold`
  - [ ] Content wrapped in `bg-surface rounded-xl shadow-lg p-6` card
  - [ ] `<div>Loading...</div>` replaced with `<ReceptionSkeleton rows={4} />`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, skeleton loading ✓, no raw colors ✓
- **Validation contract (TC-08):**
  - TC-01: Render IngredientStock.tsx in test — expect PageShell, ReceptionSkeleton, no bare loading div
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
- **Execution plan:** Red → Green → Refactor
  - Red: Read `IngredientStock.tsx` in full; confirm h1 location, loading div, no card
  - Green: Add PageShell; add card surface; replace loading div with ReceptionSkeleton; fix heading via PageShell title; run snapshot update
  - Refactor: Apply frontend-design creative direction — review stock list/table layout within card
- **Planning validation:**
  - Checks run: Fact-find component audit (full read of IngredientStock.tsx, 106L)
  - Validation artifacts: fact-find.md entry confirmed
  - Unexpected findings: **TASK-00 checkpoint update** — grep revealed additional bare `rounded` instances beyond the fact-find: warning banner (line 44), warning button (line 51), success banner (line 67), stock-item button (line 92). All are `rounded` not `rounded-lg`. Add `rounded-lg` fix to Green step execution.
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task.
- **Scouts:** Read `IngredientStock.tsx` fully at task start.
- **Edge Cases & Hardening:** None — minimal component, standard migration.
- **What would make this ≥90%:** Full read confirming no conditional render paths beyond the loading state.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the IngredientStock.tsx commit
- **Documentation impact:** None
- **Build evidence (2026-02-26):**
  - `PageShell title="Ingredient Stock"` added replacing `div.p-4`; `h1 text-3xl font-bold` removed (replaced by PageShell accent-bar heading)
  - Loading early-return: `<div>Loading...</div>` → `<PageShell title="Ingredient Stock"><ReceptionSkeleton rows={3} /></PageShell>`
  - Error early-return: `<div>Error loading inventory</div>` → `<PageShell title="Ingredient Stock"><p className="text-error-main">Error loading inventory</p></PageShell>`
  - Content wrapped in `bg-surface rounded-xl shadow-lg p-6 space-y-4` card
  - Warning banner: `rounded border` → `rounded-lg border`; migrate button: `rounded bg-warning-main` → `rounded-lg bg-warning-main`
  - Success banner: `rounded border` → `rounded-lg border`; stock-item save button: `rounded` → `rounded-lg`
  - Test updated: `screen.getByText("Loading...")` → `document.querySelector('[aria-busy="true"]')`
  - TC-01–TC-04: all tests pass; typecheck clean; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: 4b777cacab

---

### TASK-09: Wave 2 — Statistics screen polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/stats/Statistics.tsx` polished to Phase 1–3 visual standard
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/reception/src/components/stats/Statistics.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16
- **Confidence:** 75%
  - Implementation: 85% — Statistics.tsx (58L, S complexity) fully audited: own `h2 text-2xl font-semibold`, `bg-surface-2 rounded border border-border` card (no shadow). Straightforward: add PageShell, upgrade card shadow, fix heading.
  - Approach: 85% — Simplest migration possible. 58 lines. Standard PageShell wrap, card upgrade.
  - Impact: 65% — Statistics screen provides aggregate data for periodic review. Not a daily-operations screen; lower impact than Wave 1.
- **Acceptance:**
  - [ ] Gradient backdrop visible via PageShell default
  - [ ] Accent-bar `h1` heading present replacing `h2 text-2xl font-semibold`
  - [ ] Card upgraded to `bg-surface rounded-xl shadow-lg p-6` from `bg-surface-2 rounded border border-border`
  - [ ] Zero raw color values
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA checklist: gradient ✓, accent-bar heading ✓, card elevated ✓, no raw colors ✓
- **Validation contract (TC-09):**
  - TC-01: Render Statistics.tsx in test — expect PageShell, upgraded card, no bare h2
  - TC-02: Snapshot update passes
  - TC-03: No raw color values grep returns empty
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Statistics.tsx` in full; confirm h2, card classes
  - Green: Add PageShell; replace h2 with PageShell title; upgrade card surface; run snapshot update
  - Refactor: Apply frontend-design creative direction — review stat display layout within elevated card
- **Planning validation:**
  - Checks run: Fact-find component audit (full read of Statistics.tsx, 58L)
  - Validation artifacts: fact-find.md entry confirmed
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task.
- **Scouts:** None beyond full file read at task start.
- **Edge Cases & Hardening:** None — minimal 58L component.
- **What would make this ≥90%:** Full read confirming no additional conditional paths.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the Statistics.tsx commit
- **Documentation impact:** None
- **Build evidence (2026-02-26):**
  - `PageShell title="Connection Test"` added replacing `div.p-6.text-center.bg-surface-2.rounded.border.border-border`
  - `h2 text-2xl font-semibold` removed (replaced by PageShell accent-bar heading via title prop)
  - Content wrapped in `bg-surface rounded-xl shadow-lg p-6 text-center` card
  - Test updated: `expect(container).toHaveClass("bg-surface-2")` → `expect(container).toHaveClass("bg-surface")`
  - TC-01–TC-03: all tests pass; typecheck clean; ESLint clean; zero raw colors; zero bare `rounded`
  - Commit: 4b777cacab

---

### TASK-10: Wave 3 — Loan Items light polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/loans/LoansContainer.tsx` loading state upgraded to `ReceptionSkeleton`
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/loans/LoansContainer.tsx`; snapshot test in `apps/reception/src/components/loans/__tests__/`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 85% — LoansContainer.tsx (252L) fully audited: already has PageShell. Only gap: italic `div` loading text → `ReceptionSkeleton`. Standard swap.
  - Approach: 85% — Loading state swap is the simplest change possible. Import ReceptionSkeleton, replace loading div.
  - Impact: 60% — Wave 3 screens already have PageShell (gradient + heading already applied). The remaining gap (loading text → skeleton) is a genuine quality improvement (animated shimmer vs static italic text) but incremental relative to the already-polished backdrop/heading. min(85,85,60) = 60.
- **Acceptance:**
  - [ ] Italic `div` loading text replaced with `<ReceptionSkeleton rows={3} />`
  - [ ] PageShell (already present) preserved unchanged
  - [ ] Zero raw color values (verify only — already compliant per fact-find)
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA: skeleton animation visible during loading state ✓
- **Validation contract (TC-10):**
  - TC-01: Render LoansContainer.tsx loading state in test — expect ReceptionSkeleton, no italic loading div
  - TC-02: Snapshot update passes
- **Execution plan:** Red → Green → Refactor
  - Red: Read `LoansContainer.tsx` in full; locate italic loading div; confirm PageShell is untouched
  - Green: Import ReceptionSkeleton if not already imported; replace italic loading div with `<ReceptionSkeleton rows={3} />`; run snapshot update
  - Refactor: Apply frontend-design review — confirm skeleton row count matches typical content row count
- **Planning validation:**
  - Checks run: Fact-find component audit (full read of LoansContainer.tsx, 252L)
  - Validation artifacts: fact-find.md confirms italic loading div gap
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task.
- **Scouts:** None beyond full file read.
- **Edge Cases & Hardening:** Confirm skeleton row count (rows={N}) matches expected content rows for visual size consistency.
- **What would make this ≥90%:** N/A — Wave 3 light polish; 60% is appropriate given scope.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the LoansContainer.tsx commit
- **Documentation impact:** None

---

### TASK-11: Wave 3 — Extension light polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/man/Extension.tsx` loading state upgraded to `ReceptionSkeleton`, bare `rounded` on Input borders fixed, debug `console.log` calls flagged
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/man/Extension.tsx`; snapshot test in `apps/reception/src/components/man/__tests__/`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 65%
  - Implementation: 75% — Extension.tsx (487L, L by line count) has PageShell already. Gaps: italic `<p>` loading text → ReceptionSkeleton; bare `rounded` on Input borders → `rounded-lg`. The debug `console.log` calls are present — must read fully to confirm they are not entangled with render logic before modifying the file. 487L is the largest Wave 3 component; risk of hitting unexpected patterns. Capped at 75% until full read is done at task start.
  - Approach: 80% — PageShell already in place. Changes are loading swap and radius fix. The debug log flag is a documentation step only, not a code change. Main uncertainty is whether `rounded` on Input borders is in Extension.tsx directly or in a child `<Input className="rounded">` prop — grep required.
  - Impact: 60% — Extension screen is used for managing booking extensions. PageShell already polished; incremental improvement from loading skeleton and radius fix is minor. min(75,80,60) = 60.
- **Acceptance:**
  - [ ] Italic `<p>` loading text replaced with `<ReceptionSkeleton rows={3} />`
  - [ ] `rounded` → `rounded-lg` on Input border class instances in Extension.tsx JSX
  - [ ] Debug `console.log` calls listed in task notes (not removed unless clearly safe — flag only)
  - [ ] PageShell preserved unchanged
  - [ ] Zero raw color values (verify)
  - [ ] Snapshot tests updated
  - [ ] Manual visual QA: skeleton ✓, rounded-lg on inputs ✓
- **Validation contract (TC-11):**
  - TC-01: Render Extension.tsx loading state — expect ReceptionSkeleton, no italic `<p>` loading
  - TC-02: No bare `rounded` (without `-lg`) on Input elements in JSX
  - TC-03: Snapshot update passes
  - TC-04: Debug `console.log` calls documented in task notes
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Extension.tsx` in full (487L); locate italic loading `<p>`, identify all `rounded[^-]` instances, identify all debug `console.log` calls and note whether they are entangled with render logic; grep child component `<Input>` props for `className="rounded"`
  - Green: Replace italic `<p>` loading with `<ReceptionSkeleton rows={3} />`; fix `rounded` → `rounded-lg` on Input border classes that are directly in Extension.tsx JSX (not child component internals); add code comment flagging `console.log` calls with `// TODO: remove debug console.log — not removing here as logic-entanglement is unconfirmed`; run snapshot update
  - Refactor: Apply frontend-design review — confirm skeleton matches expected content structure
- **Planning validation (required for M):**
  - Checks run: Fact-find component audit (full read of Extension.tsx, 487L)
  - Validation artifacts: fact-find.md — confirms italic loading `<p>`, bare `rounded` on Input borders, debug console.log calls present
  - Unexpected findings: Debug console.log calls — documented as flag-only (do not remove if logic-entangled)
- **Consumer tracing (M effort):**
  - New outputs: none. Loading state change + radius fix. Consumer: snapshot test — updated within task.
  - `console.log` documentation: code comment only; no runtime behavior change.
- **Scouts:** Read `Extension.tsx` fully before making any changes; explicitly check whether debug `console.log` calls are inside conditional render paths or in event handlers (if in event handlers: safe to flag; if in render return: more care needed but still flag-only task).
- **Edge Cases & Hardening:**
  - If `rounded` on Input is inside a child component's default className (not in Extension.tsx JSX directly), do not modify the child component — note it and leave as-is (out of scope)
  - If debug `console.log` is inside a render return statement (not just an event handler), add extra note that removal requires logic review before proceeding
- **What would make this ≥90%:** Full read of Extension.tsx confirming all loading states, no additional class violations, and console.log entanglement status would raise Implementation to 85%. Impact is capped by Wave 3 scope — would not exceed 70%.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the Extension.tsx commit
- **Documentation impact:** None beyond inline TODO comment for console.log

---

### TASK-12: Wave 3 — Safe Reconciliation light polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/safe/SafeReconciliation.tsx` Button rounded-lg sweep
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/safe/SafeReconciliation.tsx`; snapshot test in `apps/reception/src/components/safe/__tests__/`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 85% — SafeReconciliation.tsx (154L, S complexity) fully audited: has PageShell. Only gap: bare `rounded` on Button inline class → `rounded-lg`. Minimal change.
  - Approach: 85% — Single class replacement. Lowest complexity Wave 3 task.
  - Impact: 60% — Safe reconciliation is a periodic cash management task. Minor radius fix. min(85,85,60) = 60.
- **Acceptance:**
  - [ ] Bare `rounded` on Button class → `rounded-lg`
  - [ ] PageShell preserved unchanged
  - [ ] Zero raw color values (verify)
  - [ ] Snapshot tests updated
- **Validation contract (TC-12):**
  - TC-01: No bare `rounded` on Button in SafeReconciliation.tsx JSX
  - TC-02: Snapshot update passes
- **Execution plan:** Red → Green → Refactor
  - Red: Read `SafeReconciliation.tsx` in full; confirm bare `rounded` location on Button
  - Green: Replace `rounded` → `rounded-lg` on Button; run snapshot update
  - Refactor: Verify no other radius violations
- **Planning validation:**
  - Checks run: Fact-find component audit
  - Validation artifacts: fact-find.md confirms bare `rounded` on Button
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task.
- **Scouts:** None beyond full file read.
- **Edge Cases & Hardening:** None — single class fix.
- **What would make this ≥90%:** N/A — single targeted fix; confidence is appropriate.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the SafeReconciliation.tsx commit
- **Documentation impact:** None

---

### TASK-13: Wave 3 — Email Automation light polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/emailAutomation/EmailProgress.tsx` input border rounded-lg fix
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/emailAutomation/EmailProgress.tsx`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 85% — EmailProgress.tsx (111L, S complexity) fully audited: has PageShell. Gap: bare `rounded` on input border (`border-primary-light rounded`) → `rounded-lg`. The `ssr: false` dynamic import boundary is in `page.tsx` — component internals are safe to modify.
  - Approach: 80% — Single class fix. Dynamic import boundary is in page.tsx (safe). Animated spinner already present (no loading state change needed).
  - Impact: 60% — Token discipline completion (no bare `rounded`) across all screens has value even for minor fixes. min(85,80,60) = 60.
- **Acceptance:**
  - [ ] `border-primary-light rounded` → `border-primary-light rounded-lg` on input
  - [ ] PageShell preserved unchanged
  - [ ] `next/dynamic` with `ssr: false` boundary in page.tsx preserved unchanged
  - [ ] Snapshot tests updated
- **Validation contract (TC-13):**
  - TC-01: No bare `rounded` (without suffix) on input element in EmailProgress.tsx
  - TC-02: Snapshot update passes
  - TC-03: page.tsx dynamic import boundary unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Read `EmailProgress.tsx` in full; confirm bare `rounded` on input border; confirm page.tsx dynamic boundary untouched
  - Green: Replace `rounded` → `rounded-lg` on input border class; run snapshot update
  - Refactor: Verify no other radius violations
- **Planning validation:**
  - Checks run: Fact-find component audit
  - Validation artifacts: fact-find.md confirms `border-primary-light rounded` input
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task.
- **Scouts:** Confirm page.tsx dynamic import is not affected by component modifications.
- **Edge Cases & Hardening:** None — single class fix.
- **What would make this ≥90%:** N/A — targeted single fix.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the EmailProgress.tsx commit
- **Documentation impact:** None

---

### TASK-14: Wave 3 — Live Shift View light polish
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/live/Live.tsx` guard state `<p>` renders given visual consistency treatment
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/live/Live.tsx`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 75% — Live.tsx (61L, S complexity) fully audited: has PageShell. Gap: guard `<p>` renders (unauthorized/no-shift states) display outside or before PageShell renders; low visual surface but inconsistent. Guard render path purpose is uncertain; could be auth redirect (should remain outside PageShell) or simple empty-state (should be wrapped). Read required to determine — resolvable within the task Red phase.
  - Approach: 75% — Once the guard pattern is understood (Red phase read), the fix is straightforward. Uncertainty in guard purpose means approach confidence matches implementation until read is complete.
  - Impact: 60% — Live shift view is low-priority micro-polish. Guard states (unauthorized/no-shift) are rarely seen by authorized staff. min(75,75,60) = 60.
- **Acceptance:**
  - [ ] Guard `<p>` renders (unauthorized/no-shift) visually consistent with the polished screen — either wrapped in a minimal PageShell-compatible container or treated as a pre-PageShell auth redirect (documented and left as-is if auth redirect)
  - [ ] PageShell for the main shift view preserved unchanged
  - [ ] Snapshot tests updated if guard state changes
  - [ ] Manual visual QA: guard states reviewed ✓
- **Validation contract (TC-14):**
  - TC-01: If guard `<p>` is wrapped in PageShell context — expect wrapper present in snapshot for guard state
  - TC-02: If guard `<p>` is a legitimate auth redirect — document as accepted exception, snapshot unchanged
  - TC-03: Snapshot update passes
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Live.tsx` in full (61L); determine if guard `<p>` renders are auth redirects (leave as-is, document) or empty-state messages (wrap in consistent container)
  - Green: If empty-state: wrap guard `<p>` renders inside a minimal PageShell-compatible container with consistent text styling; if auth redirect: add comment and leave as-is; run snapshot update
  - Refactor: Apply frontend-design review — confirm consistency of guard state messaging
- **Planning validation:**
  - Checks run: Fact-find component audit (Live.tsx, 61L); guard render behavior identified but purpose not fully confirmed
  - Validation artifacts: fact-find.md — "Guard `<p>` renders outside PageShell on unauthorized/no-shift states — these display before PageShell renders; low visual surface but inconsistent"
  - Unexpected findings: Guard render purpose ambiguity — must read file to determine approach
- **Consumer tracing:**
  - New outputs: none. Consumer: snapshot test — updated within task if guard state changes.
- **Scouts:** Read `Live.tsx` fully and determine guard render purpose before taking action.
- **Edge Cases & Hardening:** If guard is a redirect flow, any wrapping must not prevent the redirect from firing. Do not add PageShell to auth guard paths if they trigger router navigation.
- **What would make this ≥90%:** Full read of Live.tsx (61L) — this task rises to ≥80% immediately after reading, since the uncertainty is resolvable in 2 minutes.
- **Rollout / rollback:**
  - Rollout: Per-screen commit; no feature flag
  - Rollback: `git revert` the Live.tsx commit
- **Documentation impact:** None beyond inline comment if guard is accepted as auth-redirect exception

---

### TASK-15: Wave 3 — Prepayments spot-check
- **Type:** IMPLEMENT
- **Deliverable:** code-change (or no-op) — `apps/reception/src/components/prepayments/PrepaymentsView.tsx` spot-check pass; fix any bare `rounded` instances found
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/prepayments/PrepaymentsView.tsx` (structural JSX only — do NOT touch `PrepaymentsContainer.tsx` payment logic)
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 85% — PrepaymentsView.tsx (210L) already has PageShell, gradient, card, animated spinner. The task is a verification pass + targeted fix of any bare `rounded` found. Low probability of finding violations (per fact-find: likely already compliant). High implementation confidence because even the "no change needed" outcome is a valid deliverable.
  - Approach: 85% — Spot-check scope: read, grep for bare `rounded`, fix if found, update snapshot if changed. If no violations found: mark complete with "no changes required" note. Do NOT touch PrepaymentsContainer.tsx (payment state machine — high risk, out of scope).
  - Impact: 60% — Already polished; incremental improvement is minimal. min(85,85,60) = 60.
- **Acceptance:**
  - [ ] PrepaymentsView.tsx read in full; any bare `rounded` (without suffix) fixed to `rounded-lg`
  - [ ] PrepaymentsContainer.tsx UNTOUCHED
  - [ ] `next/dynamic` with `ssr: false` boundary in page.tsx preserved unchanged
  - [ ] If no violations found: task marked complete with "no changes required" note
  - [ ] Snapshot tests updated only if changes were made
- **Validation contract (TC-15):**
  - TC-01: Grep for bare `rounded` in PrepaymentsView.tsx returns empty (or is fixed before close)
  - TC-02: PrepaymentsContainer.tsx unchanged (git diff confirms)
  - TC-03: Snapshot update passes (or confirms no-op)
- **Execution plan:** Red → Green → Refactor
  - Red: Read `PrepaymentsView.tsx` in full; grep for bare `rounded`; confirm PageShell, card, spinner status
  - Green: Fix any bare `rounded` found; if none found, document and mark complete; run snapshot update if changed
  - Refactor: N/A for spot-check
- **Planning validation:**
  - Checks run: Fact-find component audit
  - Validation artifacts: fact-find.md — "Verify `rounded` instances; likely needs only a spot-check pass"
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none (or no-op). Consumer: snapshot test — updated only if changes made.
- **Scouts:** None — spot-check is the scout.
- **Edge Cases & Hardening:**
  - CRITICAL: Do not touch PrepaymentsContainer.tsx. PrepaymentsView.tsx is the visual layer; PrepaymentsContainer.tsx is the payment state machine. Scope is strictly PrepaymentsView.tsx.
- **What would make this ≥90%:** N/A — spot-check task; confidence is appropriate.
- **Rollout / rollback:**
  - Rollout: Per-screen commit (or no commit if no changes); no feature flag
  - Rollback: `git revert` if any changes made
- **Documentation impact:** None

---

### TASK-16: Wave 3 — Stock spot-check
- **Type:** IMPLEMENT
- **Deliverable:** code-change (or no-op) — `apps/reception/src/components/man/Stock.tsx` spot-check pass
- **Execution-Skill:** frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/man/Stock.tsx`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 85% — Stock.tsx (63L) fully audited: has PageShell, no loading state (synchronous hook), likely already compliant. High probability of no-change outcome. Spot-check is a verification, not a migration.
  - Approach: 85% — Read, grep, confirm or fix if needed. Synchronous hook means no skeleton needed.
  - Impact: 60% — Minimal expected change; already compliant per fact-find. min(85,85,60) = 60.
- **Acceptance:**
  - [ ] Stock.tsx read in full; any bare `rounded` found and fixed
  - [ ] If no violations found: task marked complete with "no changes required" note
  - [ ] Snapshot tests updated only if changes were made
- **Validation contract (TC-16):**
  - TC-01: Grep for bare `rounded` in Stock.tsx returns empty (or is fixed)
  - TC-02: Snapshot update passes (or confirms no-op)
- **Execution plan:** Red → Green → Refactor
  - Red: Read `Stock.tsx` in full (63L); confirm compliance status
  - Green: Fix any bare `rounded` found; if none, mark complete; run snapshot update if changed
  - Refactor: N/A for spot-check
- **Planning validation:**
  - Checks run: Fact-find component audit
  - Validation artifacts: fact-find.md — "spot-check only — likely already compliant"
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: none (or no-op). Consumer: snapshot test — updated only if changes made.
- **Scouts:** None — spot-check is the scout.
- **Edge Cases & Hardening:** None.
- **What would make this ≥90%:** N/A — spot-check.
- **Rollout / rollback:**
  - Rollout: Per-screen commit (or no commit if no changes); no feature flag
  - Rollback: `git revert` if any changes made
- **Documentation impact:** None

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Extension.tsx (487L) debug `console.log` calls entangled with render logic | Low | Medium | Read Extension.tsx fully before starting TASK-11; scope to visual-layer only; flag logs but do not remove if entangled |
| Alloggiati.tsx React fragment root — wrapping in PageShell adds new root element; heading role assertions in tests will break | High (certain) | Low | Expected — read `man/__tests__/` before starting TASK-03; update heading level assertions from level 2 → level 1 within the task |
| ReconciliationWorkbench.tsx — PageShell added in wrong place (page.tsx instead of component) | Medium | Medium | TASK-05 explicitly requires PageShell inside component return; read both files at task start to confirm TillDataProvider boundary |
| Prepayments (PrepaymentsContainer, 404L) payment state machine accidentally modified | Low | High | TASK-15 scoped strictly to PrepaymentsView.tsx (visual layer only); PrepaymentsContainer.tsx is explicitly excluded |
| Snapshot cascade — all touched screens require regeneration | High (certain) | Low | Expected; standard procedure per task: `jest --testPathPattern=<screen> --updateSnapshot` |
| Menu Performance Chart.js colors inadvertently removed | Low | Low | TASK-07 explicitly preserves all `hsl(var(--chart-N))` dataset strings; adds code comment to prevent future confusion |
| Extension.tsx Input `rounded` class may be in child component's defaultProps/className | Medium | Low | Grep for `rounded[^-]` in Extension.tsx JSX specifically; if only in child component defaults, note and leave as-is |
| Live.tsx guard renders are auth redirect flows (not empty states) — wrapping could interfere with redirect | Medium | Medium | TASK-14 Red phase resolves this: read Live.tsx to determine guard render purpose before taking action; if auth redirect, document and leave as-is |

## Observability
- Logging: None — visual-only changes; no new logging
- Metrics: None — no new analytics events
- Alerts/Dashboards: None — internal staff tool; manual visual QA per screen is the validation

## Acceptance Criteria (overall)

- [ ] All 16 Phase 4 screens polished: gradient backdrop visible, accent-bar heading present, card elevated with `shadow-lg`, `ReceptionSkeleton` for loading states (not italic/plain text), `rounded-lg` on all interactive controls, zero raw color values
- [ ] PageShell added to all 9 Group B screens (audit, prime-requests, alloggiati, doc-insert, reconciliation-workbench, variance-heatmap, menu-performance, ingredient-stock, statistics)
- [ ] All Wave 3 spot-check/light-polish tasks complete or confirmed as no-change-required
- [ ] All snapshot tests updated and passing after each screen's changes
- [ ] TillDataProvider boundary preserved in reconciliation-workbench page.tsx
- [ ] next/dynamic ssr:false boundary preserved in prepayments and email-automation page.tsx files
- [ ] Chart.js HSL dataset color strings unchanged in menu-performance
- [ ] Extension.tsx debug console.log calls flagged (code comments) but not removed if logic-entangled
- [ ] Zero bare `rounded` (without `-lg`/`-xl`/`-2xl`) on interactive controls across all 16 screens

## Decision Log
- 2026-02-26: SmallSpinner in audit/Search screen retained (not replaced with ReceptionSkeleton) — spinners are acceptable for non-table loading; ReceptionSkeleton is for table row shimmer. Resolved in fact-find, carried forward.
- 2026-02-26: Chart.js HSL strings in menu-performance accepted as integration constraint — not a token discipline violation. Document in code comment.
- 2026-02-26: PageShell in reconciliation-workbench added inside component return, not page.tsx — preserves TillDataProvider data context boundary.
- 2026-02-26: Wave order confirmed: Wave 1 = highest-traffic + largest gap; Wave 2 = moderate use; Wave 3 = light polish (PageShell already present). Agent-decided from operational context; operator can override.
- 2026-02-26: Prepayments scoped to PrepaymentsView.tsx only — PrepaymentsContainer.tsx (payment state machine) explicitly excluded from scope.
- 2026-02-26: TASK-10 (Loan Items), TASK-12 (Safe Reconciliation), TASK-13 (Email Automation), TASK-15 (Prepayments), TASK-16 (Stock) confidence corrected to min(Implementation,Approach,Impact) per scoring rules — Impact dimension is the limiter for Wave 3 light polish tasks.
- 2026-02-26: Critique Round 2 (plan mode) applied — task body confidence headers for TASK-10/12/13/14/15/16 corrected from 65–70% to 60% to match body-computed minimums and Task Summary; inline planning monologue removed from TASK-10/12/13/14; Parallelism Guide Wave 3 note added to document planning-discipline rationale for Wave 2→3 gate.

## Overall-confidence Calculation

Task confidences (using corrected min values):
- TASK-00: CHECKPOINT — excluded from weighted average (procedural)
- TASK-01: 80%, effort M=2
- TASK-02: 80%, effort M=2
- TASK-03: 80%, effort M=2
- TASK-04: 80%, effort M=2
- TASK-05: 75%, effort M=2
- TASK-06: 75%, effort M=2
- TASK-07: 75%, effort M=2
- TASK-08: 75%, effort S=1
- TASK-09: 75%, effort S=1
- TASK-10: 60%, effort S=1
- TASK-11: 65%, effort M=2
- TASK-12: 60%, effort S=1
- TASK-13: 60%, effort S=1
- TASK-14: 60%, effort S=1
- TASK-15: 60%, effort S=1
- TASK-16: 60%, effort S=1

Wave 1 (M=2 each, 4 tasks): 4 × 80 × 2 = 640
Wave 2 (M=2 for TASK-05/06/07; S=1 for TASK-08/09): (75×2 + 75×2 + 75×2) + (75×1 + 75×1) = 450 + 150 = 600
Wave 3: TASK-10(S=1,60) + TASK-11(M=2,65) + TASK-12(S=1,60) + TASK-13(S=1,60) + TASK-14(S=1,60) + TASK-15(S=1,60) + TASK-16(S=1,60)
= 60 + 130 + 60 + 60 + 60 + 60 + 60 = 490

Total weighted sum: 640 + 600 + 490 = 1730
Total weight: (2+2+2+2) + (2+2+2+1+1) + (1+2+1+1+1+1+1) = 8 + 8 + 8 = 24

Overall-confidence = 1730 / 24 = 72.1% → **70%** (rounded to nearest multiple of 5, downward bias rule)

**Overall-confidence: 70%**

## Section Omission Rule

- Monitoring/dashboards: `None: internal staff tool; manual visual QA is the full observability strategy`
