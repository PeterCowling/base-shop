---
Type: Build-Record
Plan-Slug: reception-theme-styling-cohesion
Business: BRIK
Completed: 2026-03-08
---

# Build Record: Reception Theme Styling Cohesion — Wave 1

## Outcome Contract

- **Why:** Reception styling had become piecemeal — screens individually patched with no shared visual operating model, creating cognitive friction for staff and wasting build effort.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception has a coherent styling strategy with named screen archetypes, shared shell/component standards, and a delivered first wave where the check-in screen is the canonical table-workflow reference implementation.
- **Source:** operator

## What Was Built

Wave 1 of the reception theme cohesion effort. All 7 tasks complete.

### TASK-01 — Archetype design spec
Produced `docs/plans/reception-theme-styling-cohesion/design-spec.md`. Codified three named screen archetypes (OperationalTableScreen, OperationalWorkspaceScreen, POSFullBleedScreen), resolved the heading-opacity discrepancy (`text-foreground` canon), locked the gradient ownership decision (OperationalTableScreen owns `bg-gradient-to-b from-surface-2 to-surface-3`), and specified slot/prop contracts for all four subsidiary primitives. GATE-BD-07 waived: reception is internal staff tooling with its own theme package.

### TASK-02 — OperationalTableScreen + AuthenticatedApp reconciliation
- Created `apps/reception/src/components/common/OperationalTableScreen.tsx` — the single gradient source for all table-workflow screens.
- Evolved `apps/reception/src/components/common/PageShell.tsx` into a re-export alias — all 23 existing consumers continue working without import changes.
- Stripped gradient and `p-6` padding from `apps/reception/src/components/AuthenticatedApp.tsx`.
- Eliminated the triple-layered gradient and double-padding problem.

### TASK-03 — Four subsidiary layout primitives
Created four new components in `apps/reception/src/components/common/`:
- `ScreenHeader.tsx` — accent bar + heading with optional right-side children slot
- `ActionRail.tsx` — `justify-end` flex row for role-gated action buttons
- `FilterToolbar.tsx` — `flex-wrap` slot wrapper for date selectors and control chips
- `TableCard.tsx` — canonical surface recipe (`rounded-xl bg-surface-2 border-border-strong shadow-xl`)

Unit tests covering all four primitives added at `__tests__/archetype-primitives.test.tsx`.

### TASK-04 — Check-in migration (canonical reference)
Migrated `apps/reception/src/components/checkins/view/CheckinsTable.tsx` to the full archetype stack:
- Outer gradient div → `<OperationalTableScreen headerSlot={<CheckinsHeader/>}>`
- Card div → `<TableCard>` (mode banners + filter controls + table inside)
- `DateSelector` + "Rooms Ready" → `<FilterToolbar>` as caller-injected children
- All 3 modals rendered outside `TableCard` as siblings (z-index independence preserved)
- All 18 component props preserved; controller layer unchanged

### TASK-05 — Checkout alignment (zero code changes)
Verified that `Checkout.tsx` imports `PageShell` via the re-export shim → resolves automatically to `OperationalTableScreen`. Uses only `title` and `children` props. No code changes needed.

### TASK-06 — Route-health triage (parallel lane)
Investigated 4 crash/stall routes. All confirmed independent of Wave 1 styling work. Findings documented at `docs/plans/reception-theme-styling-cohesion/task-06-route-health-triage.md`. Wave 2 planning must exclude these routes until separately fixed.

### CHECKPOINT-01 — Wave 1 horizon reassessment
All horizon assumptions validated. Archetype proven on 2 screens (check-in, checkout). Wave 2 (InboxWorkspace, RoomsGrid) is unblocked — `headerSlot` forward-compatibility preserved.

## Key Metrics

| Metric | Value |
|---|---|
| Tasks completed | 7 / 7 |
| New components | 5 (OperationalTableScreen + 4 primitives) |
| Files migrated | 3 (AuthenticatedApp, PageShell→alias, CheckinsTableView) |
| Gradient layers eliminated | 2 (AuthenticatedApp + CheckinsTableView outer div) |
| Padding layers eliminated | 1 (AuthenticatedApp p-6) |
| Existing PageShell consumers needing changes | 0 (re-export alias) |
| Typecheck errors | 0 |
| ESLint errors | 0 |

## Validation Evidence

- TypeCheck: clean across all 3 IMPLEMENT commits (19/19 turbo tasks each time)
- ESLint: 0 errors; advisory warnings only (layout primitive rule, pre-existing inbox warnings)
- Import-sort lint error caught and fixed before commit (TASK-04 import order)
- Build-time ideas hook: 0 dispatches (plan docs not in standing registry) — advisory, non-blocking

## What Was Not Done (In Scope Boundary)

Per plan non-goals:
- Bar POS, inbox, workspace, reporting screens — deferred to Wave 2+
- `checkins/DateSelector` and `checkout/DaySelector` access policy unification — deferred
- Full DS centralization — deferred
- Fix for the 4 crash routes (triage complete; fixes are separate plans)
