---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: reception-ui-screen-polish
Dispatch-ID: IDEA-DISPATCH-20260225-0005
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design
Related-Plan: docs/plans/reception-ui-screen-polish/plan.md
Trigger-Why: Login and bar screens were improved via the frontend-design skill. The design system applied (gradient backdrops, elevation shadows, semantic token discipline, consistent radius cascade) is clearly extensible to remaining screens. The reception app is the primary daily operational tool for hostel staff — improving UI quality directly improves operational clarity and efficiency.
Trigger-Intended-Outcome: type: operational | statement: All high-priority reception app screens polished to match the visual standard set by the login and bar screens — gradient backdrops, elevation shadows, prominent status/data display, and semantic token discipline — delivered across 3 prioritised phases. | source: operator
---

# Reception App — Screen-by-Screen UI Polish Fact-Find

## Scope

### Summary
The reception app login and bar screens have been visually upgraded via the `frontend-design` skill (commits a681694e, b15ee42c, ed815e0991, d8c48f78e3). A consistent design language has been established: gradient backdrops between surface token stops, elevated card surfaces with `shadow-lg/xl`, semantic token discipline throughout, and a three-tier button hierarchy. This work has proven the pattern is effective and systematic.

There are 17 named routes plus the cross-route Login screen — 18 distinct UI surfaces total. The remaining 16 screens vary significantly in their current visual quality and their importance to daily operations. This fact-find inventories all screens, assesses the 8 most critical, prioritises polish work, and identifies high-leverage shared component improvements that would lift multiple screens simultaneously.

### Goals
- Extend the login/bar design language to all remaining reception app screens, starting with the highest-impact operational screens
- Eliminate the two incompatible heading conventions currently in use (`text-5xl text-center` vs `text-2xl` accent-bar)
- Connect RoomsGrid's hardcoded CSS hex color system to the design token system
- Improve visual prominence of key operational data (safe balance, shift mode state, keycards)
- Establish loading skeleton and stat-display patterns that can be reused across screens

### Non-goals
- Full redesign of the navigation structure (AppNav is already well-implemented)
- Backend / data changes — this is UI-only polish
- New features or new screens
- Migration of remaining raw-HTML screens to DS components (beyond what is directly needed for visual quality)

### Constraints & Assumptions
- Constraints:
  - Dark-mode-only — light mode has been removed (`reception-remove-light-mode` plan, complete). All polish must assume dark mode.
  - Token discipline required — no raw color values (hex, rgb, `gray-300`, etc.); all colors via semantic token classes.
  - Snapshot tests will break for every screen touched — regeneration is expected and acceptable.
  - RoomsGrid uses a custom CSS module system with its own CSS variable namespace — changes must stay within that system or be a deliberate migration.
- Assumptions:
  - The design pattern from login/bar (gradient backdrop + `bg-surface` card + `shadow-lg/xl`) is the canonical target for all primary screens.
  - Per-screen work can be executed independently — screens are not tightly coupled at the UI level.
  - The `frontend-design` skill will be invoked per-screen as the execution mechanism.

## Outcome Contract

- **Why:** Daily-use operational tool; staff interact with the reception app for every hostel operation (check-in, bar POS, till management, room status). Visual clarity and consistency reduce cognitive load and error rates. The login and bar improvements proved the approach — now extend it systematically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Phase 1 screens (RoomsGrid, TillReconciliation, SafeManagement) polished to match the login/bar visual standard; shared heading system unified; loading skeleton pattern established. Phase 2 and Phase 3 screens executed in subsequent build cycles.
- **Source:** operator

## Evidence Audit (Current State)

### Established Design Pattern (Login + Bar — Reference)

Applied via commits a681694e, b15ee42c, ed815e0991, d8c48f78e3:

**Backdrop:** `bg-gradient-to-br from-surface-2 via-surface-2 to-surface-3` (login) / `bg-gradient-to-b from-surface-2 to-surface-3` (bar) — soft diagonal/vertical gradient between adjacent surface token stops.

**Card surface:** `bg-surface rounded-2xl shadow-xl` (login modal) / `bg-surface rounded-xl shadow-lg ring-1 ring-border-1/50` (bar persistent panel).

**Typography scale:**
| Role | Classes |
|---|---|
| Page/card heading | `text-xl font-semibold text-foreground` |
| Body / descriptor | `text-sm text-muted-foreground` |
| Form labels | `text-sm font-medium text-foreground` |
| Error/success states | `text-sm font-medium text-error-main` / `text-success-main` |

**Button hierarchy (three tiers):**
- Primary: `bg-primary-main text-primary-fg hover:bg-primary-dark rounded-lg py-3` (44px touch target)
- Secondary/outlined: `border border-border-2 text-foreground hover:bg-surface-2 rounded-lg py-3`
- Ghost: `text-sm font-medium text-primary-main hover:text-primary-main` (no background)

**Radius cascade:** `rounded-2xl` (full-screen modal card) → `rounded-xl` (persistent panels) → `rounded-lg` (inputs, buttons, badges).

**Token discipline:** Zero raw color values. All colors via semantic classes (`text-foreground`, `bg-primary-main`, `text-error-main`, `bg-surface-2`, `border-border-2`).

---

### Entry Points

- `apps/reception/src/components/Login.tsx` — cross-route auth overlay, 556 lines. **DONE.**
- `apps/reception/src/components/bar/Bar.tsx` — bar POS root, 64 lines. **DONE.**
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — room occupancy grid. **P1 target.**
- `apps/reception/src/components/till/TillReconciliation.tsx` — till lifecycle. **P1 target.**
- `apps/reception/src/components/safe/SafeManagement.tsx` — safe operations. **P1 target.**
- `apps/reception/src/components/checkins/CheckinsTable.tsx` — arrivals table. **P2 target.**
- `apps/reception/src/components/prepare/PrepareDashboard.tsx` — housekeeping dashboard. **P2 target.**
- `apps/reception/src/components/reports/RealTimeDashboard.tsx` — live financial charts. **P2 target.**
- `apps/reception/src/components/checkout/Checkout.tsx` — checkout table. **P3 target.**
- `apps/reception/src/components/reports/EndOfDayPacket.tsx` — print report. **P3 target.**

### Key Modules / Files

- `apps/reception/src/components/common/PageShell.tsx` — shared page wrapper. Currently minimal: `min-h-80vh p-4 font-sans text-foreground` outer, accent-bar `h1`. **Needs gradient backdrop option added.**
- `apps/reception/src/components/appNav/AppNav.tsx` — sidebar navigation. **Already polished; no action needed.** Uses DS `Button`, backdrop blur, semantic tokens throughout.
- `apps/reception/src/components/till/TillReconciliation.tsx` — thin orchestration shell; delegates to `ActionButtons`, `FormsContainer`, `TillShiftHistory` — those children not yet read.
- `apps/reception/src/components/safe/SafeManagement.tsx` — monolithic 9-form component, all logic inline. Balance display: two plain `<p>` tags.
- `packages/themes/reception/tokens.css` — source of truth for reception semantic tokens (`--color-surface`, `--color-surface-2`, `--color-surface-3`, `--color-primary-main`, etc.).

### Screen Inventory and Visual Assessment

#### Fully Investigated Screens

| Screen | Route | Current state | Polish gap | Priority |
|---|---|---|---|---|
| **Login** | overlay | Gradient backdrop, card elevation, semantic tokens, 3-tier buttons | DONE | — |
| **Bar POS** | `/bar` | Gradient backdrop, card with `ring-1`, semantic tokens | DONE | — |
| **RoomsGrid** | `/rooms-grid` | Hardcoded hex CSS vars (`#006490`, `#E4FFE6`, `#759AB5`), no card container, no shadow, flush to page | Connect to token system; add card wrapper with shadow | **P1** |
| **TillReconciliation** | `/till-reconciliation` | Uses PageShell; inner `bg-surface rounded-xl shadow-lg` card; mode banners are plain text (no container, no icon) | Mode banners need visual container; ActionButtons likely flat row | **P1** |
| **SafeManagement** | `/safe-management` | Uses PageShell; balance display is two `<p>` tags; 9 action buttons undifferentiated except Reconcile; `rounded` not `rounded-lg` | Prominent balance panel; group primary/secondary/destructive buttons; structured denomination breakdown | **P1** |
| **CheckinsTable** | `/checkin` | Partial DS; card `bg-surface rounded-xl shadow-lg`; no PageShell; toolbar area outside card completely unstyled; `rounded` on Rooms Ready button; plain italic "Loading..." | Add gradient backdrop; style toolbar container; `rounded-lg` consistency; loading skeleton | **P2** |
| **PrepareDashboard** | `/prepare-dashboard` | No PageShell; `text-5xl font-heading text-primary-main text-center` heading (wrong convention); `bg-surface-2` page, `bg-surface rounded-xl shadow-lg` card | Migrate to PageShell pattern; fix heading convention | **P2** |
| **RealTimeDashboard** | `/real-time-dashboard` | No PageShell; `text-5xl font-heading text-primary-main text-center` heading; chart cards: `bg-surface rounded shadow p-4` (no `shadow-lg`; just `shadow`); no DS components | Fix heading convention; upgrade chart card shadows; gradient backdrop | **P2** |
| **Checkout** | `/checkout` | Strongest screen: full DS Table suite, Lucide icons, `bg-surface border border-border-2 rounded-xl shadow-md`; sticky header has no backdrop blur | Sticky header blur; loading skeleton; complete-button hover semantics | **P3** |
| **EndOfDayPacket** | `/end-of-day` | No PageShell; DS Table components; print-focused; `text-2xl` heading; functional but visually flat | Heading + print layout refinement only | **P3** |

#### Unread Screens (Phase 4 — Defer Investigation to Execution)

| Screen | Route | Expected complexity | Notes |
|---|---|---|---|
| Doc Insert | `/doc-insert` | Form | Reached from checkin flow; sequential doc entry |
| Loan Items | `/loan-items` | Table + form | Date-filtered loaned items table |
| Extension | `/extension` | Table | In-house guests with rate/payment |
| Prime Requests | `/prime-requests` | Queue table | Approve/decline/complete actions |
| Safe Reconciliation | `/safe-reconciliation` | Form | End-of-shift safe count form |
| Reconciliation Workbench | `/reconciliation-workbench` | Data entry table | Cross-system reconciliation |
| Live Shift View | `/live` | Read-only dashboard | Real-time till totals |
| Variance Heatmap | `/variance-heatmap` | Table with thresholds | Green/amber/red heatmap by user/shift |
| Prepayments | `/prepayments` | Table + form | Bookings awaiting payment |
| Email Automation | `/email-automation` | Progress tracker | Email stage per booking |
| Audit/Search | `/audit` | Search + table | Multi-panel search tool |
| Alloggiati | `/alloggiati` | Table + submit | Italian police registration |
| Stock | `/stock` | Editable table | Bar stock counts |
| Ingredient Stock | `/ingredient-stock` | Editable table | Raw material counts |
| Statistics | `/statistics` | Stub | Button only |
| Menu Performance | `/menu-performance` | Chart dashboard | Chart.js bar/doughnut/line |

### Patterns & Conventions Observed

- **Two incompatible heading conventions in active use:**
  1. PageShell convention: `h-7 w-1 rounded-full bg-primary-main` accent bar + `text-2xl font-heading font-semibold text-foreground` heading (used by Till, Safe, Checkout)
  2. Dashboard convention: `text-5xl font-heading text-primary-main w-full text-center mb-6` (used by PrepareDashboard, RealTimeDashboard) — evidence: `components/prepare/PrepareDashboard.tsx`, `components/reports/RealTimeDashboard.tsx`
- **`rounded` vs `rounded-lg` split:** SafeManagement buttons use `rounded`; Checkout, Login, Bar use `rounded-lg`. Inconsistency confirmed across 3+ files.
- **Loading state pattern:** Universally plain italic text (`italic text-sm text-muted-foreground`) or plain `text-center`. No screen has a loading skeleton.
- **RoomsGrid color isolation:** The grid uses `--color-border`, `--color-background`, `--color-today`, `--color-confirmed: #006490`, `--color-awaiting`, etc. as CSS custom properties in a module — entirely outside the theme token system.
- **PageShell adoption gap:** 5 screens don't use PageShell (CheckinsTable, PrepareDashboard, RealTimeDashboard, EndOfDayPacket, RoomsGrid). Of these, PrepareDashboard and RealTimeDashboard actively define full-page layouts with the wrong heading pattern.

### Shared Component Opportunities (High-Leverage)

Three shared improvements that each lift multiple screens:

1. **PageShell gradient backdrop option** — add optional `withGradient` prop to `PageShell.tsx` (or make gradient the default) to apply `bg-gradient-to-b from-surface-2 to-surface-3` to the page background. This immediately improves the 3 Phase 1-3 screens that already use PageShell: TillReconciliation, SafeManagement, and Checkout. The remaining Phase 2-3 targets (CheckinsTable, PrepareDashboard, RealTimeDashboard, RoomsGrid, EndOfDayPacket) do not currently use PageShell — they receive the gradient benefit only after migrating to PageShell as part of their respective tasks.

2. **Loading skeleton pattern** — create a `ReceptionSkeleton` shared component (or use DS skeleton if available) to replace the plain italic "Loading..." pattern across all screens. One implementation lifts Checkins, Checkout, PrepareDashboard, and SafeManagement simultaneously.

3. **Stat display panel** — a simple `StatPanel` component (`bg-surface-2 rounded-lg p-3 flex items-center gap-3`) to display balance/keycard/count data prominently. SafeManagement is the primary target but Live Shift View and Reconciliation Workbench likely need this too.

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/themes/reception/tokens.css` — token source; no changes expected
  - `@acme/design-system/atoms` — DS components used across screens; no changes expected
  - `apps/reception/src/components/common/PageShell.tsx` — will be modified for gradient backdrop option
- Downstream dependents:
  - `apps/reception/src/components/roomgrid/RoomsGrid.module.css` (or `_reservationGrid.css`) — must be read before RoomsGrid work begins; custom CSS module structure not fully inspected
  - `apps/reception/src/components/till/` sub-components (`ActionButtons`, `FormsContainer`, `TillShiftHistory`) — not read; scope of TillReconciliation polish may extend into these
  - `apps/reception/src/components/safe/` — all safe forms are inline in SafeManagement monolith; restructuring for visual clarity may require extracting handlers
- Likely blast radius:
  - PageShell change: affects all screens using PageShell (Till, Safe, Checkout + any P4 screens)
  - Snapshot tests will break for every touched screen — regeneration required per screen
  - RoomsGrid CSS changes are isolated to the grid module and do not affect other screens

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (post-migration from Vitest, complete)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (governed runner)
- CI integration: reception app tests run in CI; snapshot tests enforced

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Login | Snapshot + unit | `components/__tests__/Login.test.tsx` (parity snapshot exists) | Parity snapshot captured post-TASK-07b migration |
| CheckinsTable | Snapshot | `components/checkins/__tests__/` | Exists; will break on toolbar changes |
| Checkout | Snapshot | `components/checkout/__tests__/` | Exists; parity snapshot from receipt migration |
| Till | Unit + snapshot | `components/till/__tests__/` | Shift lifecycle tested; snapshots will break on visual changes |
| Safe | Unit | `components/safe/__tests__/` | Functional coverage; no visual snapshots noted |
| RoomsGrid | Capabilities suite | `components/roomgrid/ReservationGrid.capabilities.test.tsx` | Tests capability contract (from `reception-roomgrid-external-package-removal`), not visual |
| RealTimeDashboard | None confirmed | — | No test coverage expected for pure chart renders |
| PrepareDashboard | None confirmed | — | No test coverage expected |

#### Coverage Gaps
- No visual regression / screenshot tests — all UI validation is manual
- Loading skeleton component (once created) needs a unit test
- RoomsGrid: capabilities tests cover data contract, not visual token compliance

#### Recommended Test Approach
- Unit tests for: `ReceptionSkeleton` component; `StatPanel` component; PageShell gradient variant
- Snapshot regeneration for: every screen touched in Phases 1–3
- Manual visual validation for: RoomsGrid token migration (colour correctness), SafeManagement balance display, TillReconciliation mode banners

### Recent Git History (Targeted)

- `apps/reception/src/components/Login.tsx` — last: `a681694e feat(reception): apply green login aesthetic`; before that `3472d63f feat(reception): remove light mode`
- `apps/reception/src/components/bar/` — last: `ed815e0991 style(reception/bar): green-theme sales screen and ticket area`; series of 4 commits applying bar design
- `apps/reception/src/components/till/`, `safe/` — last substantive: `f0ae5e74 fix(reception): fix 6 remaining test failures from TASK-07b modal migration` — no visual polish since then
- `apps/reception/src/components/roomgrid/` — last: `reception-roomgrid-external-package-removal` plan work (capability contract, test suite) — no visual polish

## Questions

### Resolved

- **Q: What design language was applied to login and bar screens?**
  - A: Gradient backdrops (`from-surface-2 to-surface-3`), elevated card surfaces (`shadow-lg/xl`), `ring-1 ring-border-1/50` on persistent panels, semantic token discipline throughout, `rounded-2xl/xl/lg` radius cascade, three-tier button hierarchy with `py-3` touch targets.
  - Evidence: `apps/reception/src/components/Login.tsx`, `apps/reception/src/components/bar/Bar.tsx`

- **Q: Which screens are highest priority for polish?**
  - A: P1 = RoomsGrid (most visually discordant — hardcoded colors, no card), TillReconciliation (richest operational screen, mode banners invisible), SafeManagement (key financial data buried in plain `<p>` tags). These are the screens with the most daily operational interaction and the largest visual gap from the established standard.
  - Evidence: screen assessment above; git history showing these screens have had no visual polish since before the login/bar work

- **Q: Is there a shared component that would lift multiple screens?**
  - A: Yes — three: (1) PageShell gradient backdrop option, (2) loading skeleton pattern, (3) stat display panel. PageShell is the highest-leverage because it instantly improves every screen using it when the gradient is added.
  - Evidence: `apps/reception/src/components/common/PageShell.tsx`

- **Q: Does RoomsGrid use the token system?**
  - A: No. It uses a custom CSS variable namespace with hardcoded hex colors (`#006490`, `#E4FFE6`, `#759AB5`). The full scope of the CSS module file has not been read — this is a known partial unknown that needs a targeted read before RoomsGrid work begins.
  - Evidence: `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (CSS variable definitions visible at top of file)

- **Q: Can screen polish work proceed independently per screen?**
  - A: Yes, except for PageShell (which is a shared prerequisite for screens using it). Otherwise screens are independently renderable and their UI components are not tightly coupled at the visual layer.
  - Basis: Route and component architecture inspection — each route has its own component tree

- **Q: Are there existing parity or snapshot tests that will break?**
  - A: Yes — Login, CheckinsTable, Checkout, and Till have confirmed snapshot tests. All will need regeneration after their respective screens are polished. This is expected and not a blocker.
  - Evidence: audit plan history; `reception-remove-light-mode` plan (updated login parity snapshot in TASK-07)

- **Q: Is AppNav a polish target?**
  - A: No. AppNav is already well-implemented — DS `Button` throughout, backdrop blur, semantic tokens, logical properties, `memo` wrapping. No action needed.
  - Evidence: `apps/reception/src/components/appNav/AppNav.tsx`

### Open (Operator Input Required)

- **Q: Which unread screens (Phase 4) should be triaged first after Phase 1–3 are complete?**
  - Why operator input required: Requires knowledge of which operational workflows (Alloggiati, Prepayments, Email Automation, etc.) are most actively used by staff day-to-day — this is operational usage data the operator holds.
  - Decision impacted: Execution order for Phase 4
  - Decision owner: Operator / hostel operations
  - Default assumption: Menu Performance, Variance Heatmap, and Reconciliation Workbench are next (chart/table dashboards with the most visual surface area). Risk: low — Phase 4 is deferred and this decision is not blocking.

## Confidence Inputs

- **Implementation: 85%** — Design patterns are clear and established from login/bar. Token system is fully documented. Main uncertainty: RoomsGrid CSS module scope (not fully read), TillReconciliation child components (ActionButtons, FormsContainer not read). Raise to ≥90: read `apps/reception/src/components/till/ActionButtons.tsx` and `apps/reception/src/components/roomgrid/` CSS module file before starting P1.

- **Approach: 82%** — Phased per-screen approach is sound and matches how the bar work was delivered. SafeManagement monolith is the largest scope risk — restructuring for visual clarity may require extracting inline handlers, which is beyond pure polish. Raise to ≥90: confirm SafeManagement scope is limited to visual layer only (no logic extraction required).

- **Impact: 85%** — Staff-facing daily-use tool. Visual clarity of safe balance, shift mode indicators, and room grid status directly affects operational decision-making speed. High confidence this is impactful. Raise to ≥90: operator feedback after P1 delivery.

- **Delivery-Readiness: 90%** — No external dependencies, no permissions needed. Work is entirely within the reception app component tree. Design system and token system are stable. Snapshot test regeneration is expected and tooled.

- **Testability: 70%** — No visual regression testing exists. All visual validation is manual inspection. Snapshot tests verify structural correctness but not visual quality. Raise to ≥80: establish a manual visual QA checklist (per screen, check backdrop gradient, card elevation, radius consistency, token compliance, mode state visibility).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RoomsGrid CSS module is larger than visible — more hardcoded values than the CSS vars shown in `RoomsGrid.tsx` | Medium | Medium | Read the full CSS module file (likely `RoomsGrid.module.css` or `_reservationGrid.css`) as Task 0 of RoomsGrid work before making any changes |
| SafeManagement monolith requires logic extraction before visual restructuring is feasible | Medium | Medium | Limit Phase 1 SafeManagement scope to: balance panel, button grouping, denomination text only. Do not extract handlers unless directly blocking visual change. Probe required before starting TASK-03: read all inline form JSX blocks in SafeManagement.tsx to verify visual wrappers can be added without touching handler logic. If entanglement is found, scope TASK-03 as visual-surface changes only and raise a separate plan task for form extraction. |
| TillReconciliation child components (`ActionButtons`, `FormsContainer`) have large visual surface not yet read | Medium | Low | Read `ActionButtons.tsx` and `FormsContainer.tsx` as Task 0 before designing Till polish. Add to scope estimate if they're larger than expected. |
| Snapshot test cascade — every screen touch requires snapshot regeneration, increasing commit size | High (certain) | Low | Expected and acceptable. Run snapshot update as a standard step after each screen task: `jest --updateSnapshot`. |
| `rounded` vs `rounded-lg` fix touches many files simultaneously | Low | Low | Include as a sweep task in Phase 2 or add to each screen's task. Do not do as a standalone PR to avoid merge conflicts. |
| PageShell gradient change affects all screens using it — may reveal visual regressions on unread screens | Low | Medium | Review all PageShell-using screens manually after the gradient is added. Simple visual check: do any screens look broken? |
| Phase 4 scope (16 unread screens) could equal or exceed Phase 1–3 effort | Medium | Medium | Before starting Phase 4, run a quick read of all 16 screen root components (~30 lines each) to establish complexity brackets. Defer screens rated "complex" (multi-panel, real-time data, heavy modals) to a separate planning cycle. |

## Planning Constraints & Notes

- **Must-follow patterns:**
  - All colors via semantic token classes — no raw values
  - Dark mode only — no light mode CSS
  - `rounded-2xl/xl/lg` radius cascade: page-level card → `rounded-2xl`; persistent content panels → `rounded-xl`; inputs/buttons/badges → `rounded-lg`
  - Gradient backdrop formula: `bg-gradient-to-b from-surface-2 to-surface-3` (vertical) or `bg-gradient-to-br from-surface-2 via-surface-2 to-surface-3` (diagonal for floating cards)
  - `py-3` minimum on interactive buttons (44px touch target for tablet POS use)
  - Use the `frontend-design` skill per screen for execution — it has proven effective for this app
- **Rollout expectations:**
  - Per-screen rollout — each screen is an independent unit of work
  - Snapshot tests regenerated after each screen task
  - No feature flag or staged rollout needed (internal staff tool, not customer-facing)
- **Observability:**
  - Manual visual QA per screen before marking task done
  - Check: gradient visible, card elevated, mode states legible, balance data prominent, `rounded-lg` not `rounded`

## Suggested Task Seeds (Non-binding)

**Pre-work (shared):**
- TASK-00: Read and assess PageShell; add gradient backdrop option (lifts all P1/P2 screens)

**Phase 1 — Highest visual debt:**
- TASK-01: RoomsGrid — read CSS module fully, replace hardcoded hex vars with theme tokens, add card container + shadow
- TASK-02: TillReconciliation — read ActionButtons + FormsContainer; add visual containers to mode banners; polish shift phase state display
- TASK-03: SafeManagement — prominent balance/keycard display panel; group buttons (primary ops / secondary / destructive); structure denomination breakdown

**Phase 2 — Heading system + dashboard screens:**
- TASK-04: Heading system unification — replace `text-5xl text-center text-primary-main` with PageShell accent-bar pattern in PrepareDashboard and RealTimeDashboard
- TASK-05: PrepareDashboard — migrate to PageShell; gradient backdrop; DS component adoption
- TASK-06: RealTimeDashboard — fix heading; upgrade chart cards from `shadow` to `shadow-lg`; gradient backdrop
- TASK-07: CheckinsTable — gradient backdrop; style toolbar container; `rounded-lg` consistency; loading skeleton

**Phase 3 — Minor polish:**
- TASK-08: Checkout — sticky header backdrop blur; loading skeleton; complete-button hover semantics review
- TASK-09: EndOfDayPacket — heading alignment; print layout refinement

**Phase 4 — Unread screens (after operator priority input):**
- TASK-10+: Triage and polish remaining 16 screens in operator-specified order

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (orchestrator); `frontend-design` (per-screen execution)
- Supporting skills: none additional
- Deliverable acceptance package: per-screen visual QA — backdrop gradient visible, card elevation present, no raw color values, `rounded-lg` consistent, mode/status states have visual containers, loading states have skeleton or spinner (not plain italic text)
- Post-delivery measurement plan: operator review of each screen in production; no automated metric — this is operational UX quality

## Evidence Gap Review

### Gaps Addressed
1. **RoomsGrid CSS module scope** — partial gap remains. `RoomsGrid.tsx` showed CSS variable definitions but the full module file (`.module.css` or `_reservationGrid.css`) was not read. Flagged as Task 0 for RoomsGrid execution.
2. **TillReconciliation children** — `ActionButtons.tsx` and `FormsContainer.tsx` not read. Flagged as Task 0 for Till execution. Gap does not block planning — these are confirmed child components of the TillReconciliation shell.
3. **SafeManagement monolith risk** — identified and risk-rated. Scope explicitly limited to visual-layer changes only; logic extraction is out of scope.
4. **Phase 4 screens** — 16 screens not investigated. Deliberate deferral — Phase 4 is gated on operator priority input. Not a planning blocker for Phases 1–3.

### Confidence Adjustments
- Implementation confidence reduced from initial ~90% to 85% due to RoomsGrid CSS module and TillReconciliation child gaps
- Approach confidence set at 82% (not higher) due to SafeManagement monolith risk — scope creep is possible
- Delivery-Readiness high (90%) because Phases 1–3 are fully specifiable without resolving Phase 4 screen ordering

### Remaining Assumptions
- The `frontend-design` skill is the correct execution mechanism for per-screen polish (confirmed by operator context)
- Token system in `packages/themes/reception/tokens.css` provides `--color-surface`, `--color-surface-2`, `--color-surface-3` — assumed present based on login/bar usage; not independently verified against tokens.css (low risk, high confidence this is correct)
- Snapshot test regeneration is acceptable on every touched screen (operator confirmed this workflow in prior plans)

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-ui-screen-polish --auto`
