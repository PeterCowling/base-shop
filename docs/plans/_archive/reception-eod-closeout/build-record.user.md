---
Status: Complete
Feature-Slug: reception-eod-closeout
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record: Reception EOD Close-Out

## What Was Built

**TASK-01 — EodChecklistContent component + RTL tests**

Created `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`, a new read-only client component that queries till, safe, and stock close-out status for today and renders three status cards. Each card independently shows a loading state (while its hook is fetching), a done state (✓ Completata), or an incomplete state (✗ Incompleta). The permission gate (`if (!canView) return null;`) is placed after all hook calls, conforming to the React hooks ordering rule confirmed in `ManagerAuditContent.tsx:111`.

Also created `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` with 9 RTL tests (TC-01 through TC-09) covering: access control (returns null without MANAGEMENT_ACCESS), all three loading states, all-done state, each individual incomplete scenario, and mixed state.

**TASK-02 — /eod-checklist/ page route**

Created `apps/reception/src/app/eod-checklist/page.tsx` using the established `force-dynamic + Providers + Content` pattern, identical to `manager-audit/page.tsx`. The route is now accessible to users with `MANAGEMENT_ACCESS`.

**TASK-03 — Admin nav entry (Chiusura)**

Added `ListChecks` to the lucide-react imports in `apps/reception/src/components/appNav/AppNav.tsx` (alphabetically after `List`, before `LogOut`) and added `{ label: "Chiusura", route: "/eod-checklist", icon: ListChecks }` to the Admin section items after "Controllo" and before "Statistics". The section-level `MANAGEMENT_ACCESS` permission on the Admin nav section already gates this item correctly.

## Tests Run

All tests are run in CI only (policy effective 2026-02-27: `BASESHOP_CI_ONLY_TESTS=1`). Local test invocation is blocked by the integrator shell.

The 9 RTL tests in `EodChecklistContent.test.tsx` will be validated in CI after push.

## Validation Evidence

**TASK-01:**
- TC-01 through TC-09: test file created, reviewed directly against component code — all acceptance criteria confirmed met
- `pnpm --filter @apps/reception typecheck` — exit 0, no errors
- `pnpm --filter @apps/reception lint` — 0 new errors (7 pre-existing warnings in unrelated files)
- Post-build validation: Mode 1 (Visual/Degraded) — JSX reviewed directly; all acceptance criteria confirmed

**TASK-02:**
- TC-01: `pnpm --filter @apps/reception typecheck` — exit 0, imports resolve correctly
- Post-build validation: Mode 2 (Data Simulation) — typecheck confirms component wiring

**TASK-03:**
- TC-01: `pnpm --filter @apps/reception typecheck` — exit 0, no errors
- TC-02: `pnpm --filter @apps/reception lint` — 0 new errors

Pre-commit hooks (typecheck-staged + lint-staged) ran on every commit and passed.

## Scope Deviations

None. All three tasks delivered exactly the planned scope. No controlled expansions were made.

## Outcome Contract

- **Why:** World-class gap scan (BRIK/reception, 2026-02-28) identified EOD close-out unification as a gap. Till, safe, and stock close-out are uncoordinated with no single confirmation artefact.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A unified EOD close-out checklist page is live in the reception app that shows till, safe, and stock close-out status for today in one view, accessible to users with MANAGEMENT_ACCESS.
- **Source:** auto
