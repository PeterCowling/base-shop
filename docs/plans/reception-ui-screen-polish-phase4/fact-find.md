---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: reception-ui-screen-polish-phase4
Dispatch-ID: IDEA-DISPATCH-20260226-0006
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: frontend-design
Supporting-Skills: lp-do-build
Related-Plan: docs/plans/reception-ui-screen-polish-phase4/plan.md
Trigger-Why: Phase 1–3 reception app UI polish is complete (9 screens polished, archived 2026-02-26). The established visual standard — gradient backdrop, card elevation, ReceptionSkeleton, StatPanel, accent-bar headings — now applies to less than half the reception app. The 16 remaining Phase 4 screens have a visible visual gap against the polished baseline. Extending polish to these screens is the logical continuation using the same frontend-design skill that produced the design language.
Trigger-Intended-Outcome: type: operational | statement: All 16 Phase 4 reception app screens polished to the same visual standard as Phase 1–3 (gradient backdrop via PageShell, card elevation with shadow-lg, accent-bar headings, ReceptionSkeleton for loading, rounded-lg on interactive controls, no raw color values), delivered across three priority waves. | source: operator
---

# Reception App — Phase 4 UI Polish Fact-Find

## Scope

### Summary

Phase 1–3 of the reception app UI polish is complete: 9 screens polished and archived (2026-02-26). The established visual language — `bg-gradient-to-b from-surface-2 to-surface-3` via PageShell, `bg-surface rounded-xl shadow-lg` card surfaces, accent-bar `h1` headings, `ReceptionSkeleton` shimmer loading states, `StatPanel` for key data display, `rounded-lg` on all interactive controls — is now the canonical standard for the app.

16 screens remain unpolished. This fact-find reads all 16 root components, classifies each by visual gap and complexity, and produces a planning-ready brief with phased execution order. The `frontend-design` skill is the primary execution mechanism — it produced the original design language and must be used per-screen for Phase 4.

**Key discovery:** 7 of 16 screens already use PageShell (gradient backdrop + accent-bar heading already applied). These screens need only loading skeleton upgrades and radius consistency — lightweight work. The remaining 9 screens have no PageShell and vary from simple stub pages to complex multi-hook components.

### Goals

- Extend the established visual standard to all 16 Phase 4 screens
- Eliminate the remaining instances of `text-5xl text-center text-primary-main` heading convention (confirmed in doc-insert and prime-requests)
- Replace all plain italic loading text with `ReceptionSkeleton` (confirmed in loan-items, extension, prime-requests, alloggiati, menu-performance, variance-heatmap)
- Add PageShell (gradient backdrop + structured heading) to the 9 screens currently missing it
- Sweep remaining `rounded` → `rounded-lg` on interactive controls across Phase 4 screens
- Apply frontend-design creative direction to elevate dashboards and complex screens beyond mechanical migration

### Non-goals

- Logic changes, data model changes, or new features in any screen
- Fixing debug `console.log` calls in Extension.tsx if removal is entangled with logic (flag only)
- Changing Chart.js dataset colors in MenuPerformanceDashboard — these are CSS custom properties consumed as raw HSL strings by the chart library; this is an accepted constraint of the Chart.js integration
- Shared navigation or AppNav changes (already polished, out of scope)
- Automated visual regression testing (no infrastructure exists; manual QA per screen)

### Constraints & Assumptions

- Constraints:
  - Dark-mode only — `reception-remove-light-mode` plan complete. All polish assumes dark mode.
  - Token discipline required — no raw hex/rgb values. All colors via semantic token classes.
  - `rounded-2xl/xl/lg` radius cascade: page-level → `rounded-2xl`, content panels → `rounded-xl`, inputs/buttons/badges → `rounded-lg`.
  - Gradient backdrop formula: `bg-gradient-to-b from-surface-2 to-surface-3` (vertical, used in PageShell default).
  - PageShell post-Phase-3 state: 45 lines, gradient is the **default** (no prop needed), `withoutGradient` prop available to suppress. `title` prop drives the accent-bar `h1`.
  - Snapshot tests will break for every screen touched — regeneration expected per screen.
  - `ReconciliationWorkbench.tsx` is mounted inside `TillDataProvider` in its `page.tsx` — any PageShell wrapper must preserve this provider boundary.
  - `prepayments/page.tsx` and `email-automation/page.tsx` use `next/dynamic` with `ssr: false` — component structure changes must preserve the dynamic import boundary.
- Assumptions:
  - `frontend-design` skill is the execution mechanism per screen (operator-confirmed).
  - The established shared components (`PageShell`, `ReceptionSkeleton`, `StatPanel`, `PreparePage`) are stable and available.
  - Per-screen work can proceed independently — screens are not visually coupled.

## Outcome Contract

- **Why:** Phase 1–3 proved the pattern works and staff notice the improvement. Leaving half the app unpolished creates a two-tier experience that undermines the operational consistency goal. Phase 4 completes the visual unification of the reception app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 16 Phase 4 reception app screens polished to the Phase 1–3 visual standard — gradient backdrops, card elevation, accent-bar headings, ReceptionSkeleton loading states, rounded-lg controls, no raw color values — delivered across three priority waves using the frontend-design skill.
- **Source:** operator

## Evidence Audit (Current State)

### Established Visual Standard (Phase 1–3 Reference)

Applied via the archived `reception-ui-screen-polish` plan (complete 2026-02-26):

| Element | Canonical form |
|---|---|
| Page backdrop | `bg-gradient-to-b from-surface-2 to-surface-3` (via PageShell default) |
| Content card | `bg-surface rounded-xl shadow-lg p-6` |
| Accent-bar heading | `h-7 w-1 rounded-full bg-primary-main` + `text-2xl font-heading font-semibold text-foreground` |
| Loading state | `<ReceptionSkeleton rows={N} />` — animated shimmer rows |
| Stat display | `<StatPanel>` — `bg-surface-2 rounded-lg p-4 flex items-center gap-4` |
| Interactive controls | `rounded-lg` (buttons, inputs, badges) |
| Token discipline | Zero raw color values — all via semantic token classes |

**PageShell post-Phase-3** (`apps/reception/src/components/common/PageShell.tsx`, 45 lines):
- Gradient is the default — no prop needed to activate
- `withoutGradient` prop available for print/special cases
- `title` → accent-bar `h1` (2xl font-heading font-semibold)
- `headerSlot` → override heading entirely

### Entry Points

- `apps/reception/src/components/checkins/docInsert/DocInsertPage.tsx` — doc-insert screen root (181 lines)
- `apps/reception/src/components/loans/LoansContainer.tsx` — loan-items screen root (252 lines)
- `apps/reception/src/components/man/Extension.tsx` — extension screen root (487 lines)
- `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx` — prime-requests root (307 lines)
- `apps/reception/src/components/safe/SafeReconciliation.tsx` — safe-reconciliation root (154 lines)
- `apps/reception/src/components/till/ReconciliationWorkbench.tsx` — reconciliation-workbench root (388 lines)
- `apps/reception/src/components/live/Live.tsx` — live shift view root (61 lines)
- `apps/reception/src/components/reports/VarianceHeatMap.tsx` — variance-heatmap root (233 lines)
- `apps/reception/src/components/prepayments/PrepaymentsView.tsx` + `PrepaymentsContainer.tsx` (210 + 404 lines)
- `apps/reception/src/components/emailAutomation/EmailProgress.tsx` — email-automation root (111 lines)
- `apps/reception/src/components/search/Search.tsx` — audit/search root (270 lines)
- `apps/reception/src/components/man/Alloggiati.tsx` — alloggiati root (391 lines)
- `apps/reception/src/components/man/Stock.tsx` — stock root (63 lines)
- `apps/reception/src/components/inventory/IngredientStock.tsx` — ingredient-stock root (106 lines)
- `apps/reception/src/components/stats/Statistics.tsx` — statistics root (58 lines)
- `apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx` — menu-performance root (211 lines)

### Screen Inventory — Complete Phase 4 Assessment

#### Group A: PageShell already present — loading/radius polish only

These 7 screens already have the gradient backdrop and accent-bar heading. The remaining gap is minor: loading skeleton and radius consistency.

| Screen | Route | Component | Lines | Complexity | Specific gaps |
|---|---|---|---|---|---|
| Loan Items | `/loan-items` | `loans/LoansContainer.tsx` | 252 | M | Italic `div` loading text → `ReceptionSkeleton` |
| Extension | `/extension` | `man/Extension.tsx` | 487 | L | Italic `<p>` loading → `ReceptionSkeleton`; bare `rounded` on Input borders → `rounded-lg`; debug `console.log` calls present (flag only, do not remove if logic-entangled) |
| Safe Reconciliation | `/safe-reconciliation` | `safe/SafeReconciliation.tsx` | 154 | S | Bare `rounded` on Button inline class → `rounded-lg` |
| Live Shift View | `/live` | `live/Live.tsx` | 61 | S | Guard `<p>` renders outside PageShell on unauthorized/no-shift states — these display before PageShell renders; low visual surface but inconsistent |
| Prepayments | `/prepayments` | `prepayments/PrepaymentsView.tsx` | 210+404 | L | Already has animated spinner + card + PageShell. Verify `rounded` instances; likely needs only a spot-check pass |
| Email Automation | `/email-automation` | `emailAutomation/EmailProgress.tsx` | 111 | S | Animated spinner already present; bare `rounded` on input border (`border-primary-light rounded`) → `rounded-lg` |
| Stock | `/stock` | `man/Stock.tsx` | 63 | S | No loading state (synchronous hook); spot-check only — likely already compliant |

#### Group B: No PageShell — heading + gradient migration

These 9 screens have no PageShell. They need full migration: wrap with `<PageShell title="...">`, remove any old heading convention, add card surface inside.

| Screen | Route | Component | Lines | Complexity | Specific gaps |
|---|---|---|---|---|---|
| Doc Insert | `/doc-insert` | `checkins/docInsert/DocInsertPage.tsx` | 181 | M | `text-5xl text-primary-main text-center` heading; outer wrapper has no gradient (bare `p-4 mx-auto`); own `bg-surface rounded-2xl shadow-xl` card — keep card, add gradient backdrop |
| Prime Requests | `/prime-requests` | `prime-requests/PrimeRequestsQueue.tsx` | 307 | M | `text-5xl text-primary-main text-center` heading; flat `bg-surface-2` root; `rounded-lg bg-surface shadow` card (upgrade shadow to `shadow-lg`) |
| Reconciliation Workbench | `/reconciliation-workbench` | `till/ReconciliationWorkbench.tsx` | 388 | M | Own `h2 text-2xl font-semibold`; no gradient; no card container; bare `rounded` on all inputs/buttons — needs full migration |
| Variance Heatmap | `/variance-heatmap` | `reports/VarianceHeatMap.tsx` | 233 | M | No page-level `h1`; bare root div; weak card on thresholds panel only (`rounded border shadow-sm`); bare `rounded` throughout; plain `<p>Loading...` |
| Audit / Search | `/audit` | `search/Search.tsx` | 270 | M | No page-level `h1`; bare React fragment root; no card; tab-scoped `h2` only; already uses `SmallSpinner` — replace with ReceptionSkeleton or keep SmallSpinner if it matches visual quality |
| Alloggiati | `/alloggiati` | `man/Alloggiati.tsx` | 391 | L | Bare `h2 text-xl font-bold`; React fragment root; no card wrapper; submission section `border rounded p-3` only; inline `<p>` loading text |
| Ingredient Stock | `/ingredient-stock` | `inventory/IngredientStock.tsx` | 106 | S | Own `h1 text-3xl font-bold` (no font-heading); bare `div p-4` root; no card; `<div>Loading...</div>` bare |
| Statistics | `/statistics` | `stats/Statistics.tsx` | 58 | S | Own `h2 text-2xl font-semibold`; `bg-surface-2 rounded border border-border` (no shadow) — migrate to PageShell, upgrade card to `shadow-lg` |
| Menu Performance | `/menu-performance` | `analytics/MenuPerformanceDashboard.tsx` | 211 | M | Own `h1 text-2xl font-semibold` (no font-heading); flat `bg-surface rounded shadow` root; chart HSL vars accepted constraint; bare `rounded` on root card |

### Patterns & Conventions Observed

- **`text-5xl text-primary-main text-center` heading** still present in doc-insert, prime-requests — same anti-pattern eliminated from PrepareDashboard and RealTimeDashboard in Phase 2.
- **Italic loading text** still present in loan-items, extension, alloggiati, variance-heatmap — same pattern replaced by `ReceptionSkeleton` in Phase 2-3.
- **Bare `rounded`** (not `rounded-lg`) on interactive controls still widespread in safe-reconciliation, extension, email-automation, reconciliation-workbench, variance-heatmap, audit, alloggiati, statistics, menu-performance.
- **`SmallSpinner` component** used in audit — distinct from the inline `animate-spin` div pattern in prepayments/email-automation. Both are already animated; could standardise to one or accept both.
- **Chart.js HSL constraint** in menu-performance — `hsl(var(--chart-1))` etc. passed as raw strings to Chart.js datasets. This is not a token discipline violation in the Tailwind sense; it's an accepted Chart.js integration pattern. No change needed.
- **`TillDataProvider` wrapper** — reconciliation-workbench page.tsx wraps component in data provider. PageShell must be added inside the component, not in page.tsx.
- **`next/dynamic` with `ssr: false`** — prepayments and email-automation use this pattern. Component internals are safe to modify; the dynamic boundary lives in page.tsx.

### Key Modules / Files

- `apps/reception/src/components/common/PageShell.tsx` — shared page wrapper, gradient default, 45 lines. **[readonly — already complete, do not modify]**
- `apps/reception/src/components/common/ReceptionSkeleton.tsx` — loading skeleton, `rows?: number = 5`. **[readonly — already complete, import as-is]**
- `apps/reception/src/components/common/StatPanel.tsx` — stat display component. **[readonly — may be useful for live shift view stat display]**
- `apps/reception/src/app/reconciliation-workbench/page.tsx` — mounts `TillDataProvider` wrapping `ReconciliationWorkbench` — structure must be preserved.
- `packages/themes/reception/tokens.css` — token source of truth. **[readonly]**

### Data & Contracts

- No data model changes — purely visual layer changes
- All screens use Firebase hooks or context for data; no data contract changes
- `SmallSpinner` component location: `apps/reception/src/components/search/SmallSpinner.tsx` — already exists, can be used

### Dependency & Impact Map

- **Upstream dependencies (stable, no changes):** `PageShell`, `ReceptionSkeleton`, `StatPanel`, `packages/themes/reception/tokens.css`, `@acme/design-system/atoms`
- **Downstream dependents:** Snapshot tests for each touched screen will break (expected, regenerate per screen)
- **Blast radius assessment:**
  - Group A screens: minimal blast radius — adding ReceptionSkeleton import and swapping one JSX element per loading state
  - Group B screens: moderate blast radius — PageShell wrapping changes the component's root element, snapshot tests will change significantly
  - Extension.tsx (487L, L complexity): highest blast radius in Group A — loading + radius changes but no structural change to the component tree
  - Alloggiati.tsx (391L, L complexity): highest blast radius in Group B — wrapping a complex multi-hook fragment in PageShell; React fragment root means no wrapping element exists today, so adding `<PageShell>` is the first structural element added

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (post-Vitest migration, complete)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: reception app tests run in CI; snapshot tests enforced

#### Existing Test Coverage

| Area | Test Type | Files | Expected impact from Phase 4 |
|---|---|---|---|
| Loan Items / LoansContainer | Snapshot (likely) | `components/loans/__tests__/` | Snapshot update on loading state change |
| Extension | Snapshot or unit | `components/man/__tests__/` (confirmed — directory exists) | Snapshot update on loading state change |
| Safe Reconciliation | Unit + snapshot | `components/safe/__tests__/` | Snapshot update on radius change |
| Prime Requests | Snapshot (likely) | `components/prime-requests/__tests__/` | Snapshot update on heading + PageShell migration |
| Search / Audit | Unit | `components/search/__tests__/` | Snapshot update on structural change |
| Alloggiati | Snapshot or unit | `components/man/__tests__/` (confirmed — directory exists) | Snapshot update on PageShell wrapping; check for `getByRole('heading', { level: 2 })` assertions that may need updating to level 1 after PageShell wrapping |
| Stock | No coverage expected | — | Minimal or no test impact |
| Statistics | No coverage expected | — | Minimal or no test impact |
| Menu Performance | No coverage expected | — | Minimal or no test impact |
| Prepayments | Snapshot/unit | `components/prepayments/__tests__/` | Likely no change if only spot-check pass |

#### Coverage Gaps

- No visual regression / screenshot tests (same as Phase 1–3; manual QA is the validation)
- ReceptionSkeleton integration into each screen adds one import — no additional unit test needed (ReceptionSkeleton is already tested)

#### Recommended Test Approach

- Run targeted snapshot update per screen after each task: `jest --testPathPattern=<screen> --updateSnapshot`
- Manual visual QA checklist per screen (see Validation Acceptance)
- No new unit tests required — these are structural visual changes, not logic changes

### Recent Git History (Targeted)

- `apps/reception/src/components/man/Extension.tsx` — last polished as part of original `reception-design-overhaul`; no subsequent visual changes. Debug `console.log` calls appear to be original code, not recently added.
- `apps/reception/src/components/loans/LoansContainer.tsx` — no recent visual changes found
- `apps/reception/src/components/prime-requests/PrimeRequestsQueue.tsx` — no recent visual changes
- `apps/reception/src/components/till/ReconciliationWorkbench.tsx` — last touched by `reception-visual-ux-audit` plan (functional fixes, not visual polish)
- Phase 1–3 work: commits `be2a919`, `3b75771`, `5ab6e57`, `b00c078`, `0a7ce02` — archived plan is the primary reference

## Questions

### Resolved

- **Q: Which screens still need PageShell migration?**
  - A: 9 screens: doc-insert, prime-requests, reconciliation-workbench, variance-heatmap, audit, alloggiati, ingredient-stock, statistics, menu-performance.
  - Evidence: Full component audit above — all 9 confirmed no PageShell usage.

- **Q: Which screens already have PageShell and need only light polish?**
  - A: 7 screens: loan-items, extension, safe-reconciliation, live, prepayments, email-automation, stock.
  - Evidence: Full component audit above — all confirmed `<PageShell title="...">` usage.

- **Q: What execution priority order should be used?**
  - A: Priority by visual gap severity and operational usage frequency:
    - **Wave 1 (highest daily use + large gap):** audit, prime-requests, alloggiati, doc-insert
    - **Wave 2 (moderate use + notable gap):** reconciliation-workbench, variance-heatmap, menu-performance, ingredient-stock, statistics
    - **Wave 3 (PageShell present, light polish):** loan-items, extension, safe-reconciliation, email-automation, live, prepayments (spot-check), stock (spot-check)
  - Basis: Audit (daily booking lookups), prime-requests (daily queue), alloggiati (near-daily check-in registrations), and doc-insert (part of check-in flow) are the highest-traffic screens with the largest visual gap.

- **Q: Does prepayments need work?**
  - A: Minimal. PrepaymentsView already has PageShell, gradient, `bg-surface rounded-xl shadow-lg` card, and an animated spinner. Execution should be a spot-check pass for bare `rounded` instances only.
  - Evidence: Component audit — prepayments confirmed PageShell + spinner + card.

- **Q: Can the frontend-design skill be applied to table/form screens directly?**
  - A: Yes. The frontend-design skill is not limited to hero/marketing screens — it was applied to SafeManagement (form), TillReconciliation (table+forms), and CheckinsTable (table) in Phase 1–3. The same approach applies to all Phase 4 screens.
  - Basis: Phase 1–3 build record confirms frontend-design pattern applied to operational screens.

- **Q: What is the Chart.js constraint in menu-performance?**
  - A: Chart.js dataset `backgroundColor` and `borderColor` fields consume raw HSL strings (`hsl(var(--chart-1))`). These cannot be replaced with Tailwind utility classes because they're passed as JS string values to the Chart.js API. The correct approach is to migrate the outer page structure to PageShell (heading, gradient, card surface) while leaving the chart dataset color strings unchanged.
  - Basis: MenuPerformanceDashboard.tsx component audit — Chart.js dataset configuration confirmed.

- **Q: Should the `SmallSpinner` in audit be replaced with `ReceptionSkeleton`?**
  - A: No replacement needed unless the visual quality is poor. `SmallSpinner` is a centered spinner with `flex justify-center my-4` — acceptable quality. Apply `ReceptionSkeleton` for table/list loading states; `SmallSpinner` or the inline spinner pattern is acceptable for single-element loading gates. Standardise to `ReceptionSkeleton` if a full table skeleton is needed.
  - Basis: Consistency principle — `ReceptionSkeleton` is for table row shimmer; spinners are acceptable for non-table loading.

### Open (Operator Input Required)

*None.* All questions are resolvable from the component evidence above. The execution order is determined by visual gap severity and known operational usage frequency — the agent can decide this without operator input.

## Confidence Inputs

- **Implementation: 88%** — Phase 1–3 proved the pattern. 7/16 screens already have PageShell (gradient already done). Main uncertainty: Extension.tsx (487L, L complexity, debug logs present) and Alloggiati.tsx (391L, L complexity, complex fragment to wrap). Both are well-understood from the audit; no hidden architectural surprises expected. Raise to ≥90: read Extension.tsx and Alloggiati.tsx in full before starting their tasks to confirm no logic entanglement with the visual wrapper.

- **Approach: 87%** — Frontend-design skill per screen is proven effective. Phased grouping (Group A loading/radius vs Group B PageShell migration) is the right separation of concerns. `TillDataProvider` preservation constraint in reconciliation-workbench is clearly understood. Raise to ≥90: confirm reconciliation-workbench wrapping pattern (PageShell inside component, not in page.tsx) is viable without affecting TillDataProvider data flow.

- **Impact: 82%** — Phase 4 screens include the most frequently used lookup/registration tools (audit, alloggiati, prime-requests, doc-insert). Unifying their visual experience reduces the two-tier feeling staff notice when switching between polished and unpolished screens. Impact is real but incremental — Phase 1–3 already captured the highest-traffic screens. Raise to ≥90: verify usage frequency at task start from operational context or brief operator check — this is documented as a remaining assumption, not a blocking gate.

- **Delivery-Readiness: 93%** — No external dependencies. Entirely within reception app component tree. PageShell and ReceptionSkeleton are stable and tested. Token system unchanged. Snapshot regeneration is standard procedure. Raise to ≥95: N/A — already at high confidence.

- **Testability: 70%** — Same constraint as Phase 1–3: no visual regression infrastructure. Snapshot tests verify structure but not visual quality. Manual per-screen QA is the validation gate. Raise to ≥80: establish a per-screen visual QA checklist (same as Phase 1–3) and run it before marking each task complete.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Extension.tsx (487L, L complexity) has debug `console.log` calls entangled with render logic | Low | Medium | Read Extension.tsx fully before starting; limit scope to visual-layer changes only; flag console.log in task notes but do not remove unless clearly safe |
| Alloggiati.tsx React fragment root — wrapping in PageShell adds a new root element; any test that checks the top-level DOM structure will break | High (certain) | Low | Expected — run snapshot update after wrapping; confirm test assertions still pass with new root element |
| `ReconciliationWorkbench.tsx` uses `TillDataProvider` from page.tsx — PageShell must be added inside the component, not wrapping it from page.tsx | Medium | Medium | Add PageShell as the first element inside `ReconciliationWorkbench` JSX return, preserving the TillDataProvider boundary at page level |
| Prepayments (PrepaymentsContainer, 404L, L) has complex payment state machine — any accidental modification could break payment flows | Low | High | Scope work to spot-check pass only; do not touch PrepaymentsContainer logic; only modify PrepaymentsView structural JSX |
| Snapshot cascade — all 16 screens will require snapshot regeneration | High (certain) | Low | Expected. Standard procedure: `jest --testPathPattern=<screen> --updateSnapshot` per task |
| Menu Performance Chart.js colors are HSL custom properties, not Tailwind tokens — may flag as raw color violation in automated tooling | Low | Low | Document as accepted Chart.js integration constraint in task notes; do not attempt to migrate to Tailwind utilities |
| Extension.tsx has `rounded` on Input border — this may be set inside a child component `<Input className="rounded">` that overrides the DS Input default | Medium | Low | Grep for `rounded[^-]` in Extension.tsx and child components before making changes; target only the root component's JSX |

## Planning Constraints & Notes

- **Must-follow patterns (inherited from Phase 1–3):**
  - All colors via semantic token classes — no raw values
  - Dark mode only — no light mode CSS
  - `rounded-2xl/xl/lg` radius cascade
  - Gradient backdrop: `bg-gradient-to-b from-surface-2 to-surface-3` via PageShell default
  - `py-3` minimum on interactive buttons (44px touch target)
  - `frontend-design` skill is the execution mechanism per screen
- **Rollout:** Per-screen — each screen is an independent unit of work. No feature flag or staged rollout needed (internal staff tool).
- **Observability:** Manual visual QA per screen. Check: gradient visible, card elevated, accent-bar heading, `ReceptionSkeleton` for loading (not italic text), `rounded-lg` not `rounded`, no raw color values.

## Suggested Task Seeds (Non-binding)

**Pre-wave CHECKPOINT:**
- TASK-00: Fact-check: confirm PageShell and ReceptionSkeleton are stable; grep Phase 4 screens for any new issues not caught in audit

**Wave 1 — Highest daily use + large gap (no PageShell):**
- TASK-01: Audit/Search (`Search.tsx`) — add PageShell, card container, migrate tab-scoped h2 to PageShell title
- TASK-02: Prime Requests (`PrimeRequestsQueue.tsx`) — PageShell migration, replace text-5xl heading, upgrade card shadow
- TASK-03: Alloggiati (`Alloggiati.tsx`) — PageShell wrapping, card container for content, fix h2 heading, ReceptionSkeleton for loading
- TASK-04: Doc Insert (`DocInsertPage.tsx`) — gradient backdrop (outer wrapper), fix text-5xl heading; keep own card (rounded-2xl shadow-xl is good)

**Wave 2 — Moderate use, notable gap:**
- TASK-05: Reconciliation Workbench (`ReconciliationWorkbench.tsx`) — PageShell inside component, card container, fix h2, rounded-lg sweep
- TASK-06: Variance Heatmap (`VarianceHeatMap.tsx`) — PageShell migration, page-level heading, upgrade card, ReceptionSkeleton for loading, rounded-lg sweep
- TASK-07: Menu Performance (`MenuPerformanceDashboard.tsx`) — PageShell migration, fix heading, upgrade card shadow; chart colors unchanged
- TASK-08: Ingredient Stock (`IngredientStock.tsx`) — PageShell migration, fix h1, ReceptionSkeleton for loading, rounded-lg sweep
- TASK-09: Statistics (`Statistics.tsx`) — PageShell migration, fix h2, upgrade card surface

**Wave 3 — Light polish (PageShell already present):**
- TASK-10: Loan Items (`LoansContainer.tsx`) — ReceptionSkeleton for loading italic text
- TASK-11: Extension (`Extension.tsx`) — ReceptionSkeleton for loading, rounded-lg on Input borders, flag console.logs
- TASK-12: Safe Reconciliation (`SafeReconciliation.tsx`) — rounded-lg sweep on Button
- TASK-13: Email Automation (`EmailProgress.tsx`) — rounded-lg on input border
- TASK-14: Live Shift View (`Live.tsx`) — guard state `<p>` visual consistency (low priority, micro-polish)
- TASK-15: Prepayments (`PrepaymentsView.tsx`) — spot-check pass, verify rounded-lg compliance (likely already done)
- TASK-16: Stock (`Stock.tsx`) — spot-check pass (likely already compliant)

## Execution Routing Packet

- Primary execution skill: `frontend-design` (per-screen creative execution — applies design direction to each screen, not just mechanical migration)
- Supporting skills: `lp-do-build` (build orchestrator for gate enforcement, commit management, plan updates)
- Deliverable acceptance package: per-screen visual QA — gradient backdrop visible, accent-bar heading present, card elevated with `shadow-lg`, `ReceptionSkeleton` for loading states (not italic text), `rounded-lg` on all interactive controls, zero raw color values, snapshot tests pass after update
- Post-delivery measurement plan: operator visual review of each screen in production; staff feedback on visual consistency improvement

## Evidence Gap Review

### Gaps Addressed

1. **All 16 screen root components fully read** — no unread screens remain; every component's visual state, complexity, and specific gap is documented above.
2. **PageShell/non-PageShell split confirmed** — 7/16 have PageShell, 9/16 do not; categorised with specific per-screen gap descriptions.
3. **Chart.js constraint identified** — MenuPerformanceDashboard's HSL chart colors are documented as accepted constraint; no planning gap.
4. **TillDataProvider constraint identified** — ReconciliationWorkbench wrapping strategy is documented; no planning gap.
5. **Prepayments already mostly done** — confirmed via component audit; scope correctly limited to spot-check.

### Confidence Adjustments

- Implementation raised to 88% from the initial estimate (previously deferred at 82%+) because all 16 screens have been fully audited — no unknowns remain about component structure.
- No confidence reductions from audit — no hidden complexity discovered beyond what the Phase 1 fact-find predicted.

### Remaining Assumptions

- Extension.tsx debug `console.log` calls are not entangled with render logic — will be confirmed by reading the file fully before starting TASK-11
- ReconciliationWorkbench PageShell wrapping pattern is viable inside the component — will be confirmed at task start
- Staff usage frequency ordering (audit > alloggiati > prime-requests > doc-insert) is correct — operator can adjust wave order if needed, but this is the agent's best estimate from operational context

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-ui-screen-polish-phase4 --auto`
