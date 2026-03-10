---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-appnav-dual-source
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-appnav-dual-source/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309100000-0007
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception AppNav Dual Source Fact-Find Brief

## Scope
### Summary
Navigation items and groupings are currently defined twice: once in the `navSections` array in `AppNav.tsx` (sidebar nav) and again independently in four modal files (`OperationsModal.tsx`, `ManagementModal.tsx`, `TillModal.tsx`, `ManModal.tsx`). The dual source has diverged significantly — at least 8 discrete discrepancies found across the four modal/section pairs (see Complete Divergence Inventory below). The divergences include missing items in both directions (items in AppNav not in modals and vice versa), icon mismatches, a label collision on two separate routes, and a section placement mismatch for Staff Accounts.

In addition, `useAuth` is called twice per render: once inside the HOC (`withIconModal.tsx`) and once in the wrapper components `TillModal` and `ManModal`.

The investigation confirms consolidation is feasible but requires a deliberate decision on which source is canonical for each discrepancy before extraction can proceed. The plan must define the resolved state, not just move the divergences into a shared config.

### Goals
- Single source of truth for nav items and groupings in a new `navConfig.ts` file — consumed by AppNav, all 4 modals, **and** `CurrentPageIndicator.tsx` (which maintains its own independent `routeMap` of the same routes).
- Resolve all divergences between AppNav and modal action arrays (using AppNav as canonical where intent is clear, or documenting the decision for ambiguous cases).
- Fix the label collision: two different routes (`/end-of-day`, `/eod-checklist`) both labelled "End of Day".
- Eliminate duplicate `useAuth` calls in TillModal/ManModal wrappers.
- Adding or renaming a route requires one edit to `navConfig.ts`.

### Non-goals
- Redesigning the nav UX (sidebar vs modal structure stays).
- Changing permission model or role definitions.
- Migrating `withIconModal` to a different pattern (HOC can be retained, just consuming shared config).
- Deciding whether modals should mirror AppNav exactly (some deliberate surface-level differences may be preserved if justified).

### Constraints & Assumptions
- Constraints:
  - `navSections` uses `LucideIcon` components; `ModalAction` also uses `LucideIcon` — same type, compatible.
  - Modals reference `ModalAction[]` (with `label`, `icon`, `route`, optional `permission`, optional `peteOnly`). AppNav's `NavItem` has the same fields minus `peteOnly`. Shared config must carry both.
  - The `interactive` flag in TillModal and ManModal wrappers must be preserved — it controls disabled UI state for users without the relevant permission.
  - `OperationsModal` and `ManagementModal` are plain HOC results (no wrapper layer), so no `useAuth` duplication there.
- Assumptions:
  - The `/end-of-day` route (Till EOD workflow) and `/eod-checklist` route (admin manager checklist) are separate pages that should both exist; the fix is renaming the label of the Admin entry to "EOD Checklist".
  - No test checks the actual actions array contents by asserting Lucide icon instances (tests use `iconClass` strings from an older icon system — they are already stale and will need updating).
  - For Inbox: OperationsModal has `/inbox` but AppNav does not. AppNav has `Prime Requests` (`/prime-requests`) which appears in both — `/inbox` is likely a separate workflow not yet added to AppNav sidebar. The plan must decide: add Inbox to AppNav, add Dashboard to OperationsModal, or both. AppNav is assumed more up-to-date for the sidebar use case.

## Outcome Contract

- **Why:** Dual source of truth for nav items means route changes require 5 simultaneous edits and has already produced an inconsistency (/end-of-day vs /eod-checklist both labelled "End of Day"). The useAuth double-call is a mild inefficiency.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Navigation items are defined once in AppNav (or a shared nav config) and consumed by both the nav bar and all modal variants. Adding a route requires one change.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/appNav/AppNav.tsx` — sidebar nav, defines `navSections: NavSection[]`, each section has `label`, `items: NavItem[]`, optional `permission`
- `apps/reception/src/components/AppModals.tsx` — renders all 4 modals, routes `activeModal` to the correct component
- `apps/reception/src/hoc/withIconModal.tsx` — HOC factory; takes `{ label, actions: ModalAction[] }`, returns a component that reads `useAuth` internally and filters `visibleActions`

### Key Modules / Files

| File | Role |
|---|---|
| `apps/reception/src/components/appNav/AppNav.tsx` | Source 1 of nav data — `navSections` array, `NavItem`/`NavSection` types |
| `apps/reception/src/components/appNav/OperationsModal.tsx` | Source 2 — hardcoded `actions` array, calls `withIconModal`, no wrapper |
| `apps/reception/src/components/appNav/ManagementModal.tsx` | Source 2 — hardcoded `actions` array, calls `withIconModal`, no wrapper |
| `apps/reception/src/components/appNav/TillModal.tsx` | Source 2 — hardcoded `actions` array + wrapper with `useAuth` + `canAccess(TILL_ACCESS)` |
| `apps/reception/src/components/appNav/ManModal.tsx` | Source 2 — hardcoded `actions` array + wrapper with `useAuth` + `canAccess(MANAGEMENT_ACCESS)` |
| `apps/reception/src/hoc/withIconModal.tsx` | HOC — calls `useAuth` itself to filter per-action permissions |
| `apps/reception/src/types/component/ModalAction.ts` | `ModalAction` type: `label`, `icon: LucideIcon`, `route`, `permission?: UserRole[]`, `peteOnly?: boolean` |
| `apps/reception/src/types/component/IconModalProps.ts` | `IconModalProps`: `visible`, `onClose`, `onLogout`, `user: User`, `interactive?: boolean` |
| `apps/reception/src/lib/roles.ts` | `Permissions` constants, `canAccess`, `isPrivileged` |
| `apps/reception/src/components/appNav/CurrentPageIndicator.tsx` | **Third nav source** — `routeMap: Record<string, RouteInfo>` with 24 entries; same routes/labels/icons as AppNav but maintained independently |
| `apps/reception/src/components/appNav/__tests__/Modals.test.tsx` | Unit tests for all 4 modals — mock `withIconModal`, assert actions passed |

### Patterns & Conventions Observed

- **NavItem (AppNav):** `{ label, route, icon: LucideIcon, permission?: UserRole[] }` — no `peteOnly`
- **ModalAction:** `{ label, route, icon: LucideIcon, permission?: UserRole[], peteOnly?: boolean }` — strictly superset of NavItem; `peteOnly` is the only divergence and it's optional
- **Section-level permission:** In AppNav, `NavSection` carries `permission` (e.g. Till & Safe, Admin). The modals don't have a section concept — each modal _is_ a section. The `interactive` prop on TillModal/ManModal serves the section-level gate for modals.
- **`withIconModal` HOC pattern:** Called at module level (not inside a component), returns a component. Calls `useAuth()` at render time to filter `visibleActions`. The returned component is pure from the perspective of parent re-renders (no extra hook calls outside render).
- **Wrapper anti-pattern (TillModal, ManModal):** The wrapper calls `useAuth()` again to compute `interactive`. This is the double auth lookup — same context read twice per render. Eliminating the wrapper and moving `interactive` logic into the HOC config or a prop would remove the duplication.

### Complete Divergence Inventory

A full cross-tabulation of all differences between AppNav sections and corresponding modal action arrays:

**Operations section vs OperationsModal:**

| Item | AppNav | OperationsModal | Notes |
|---|---|---|---|
| Dashboard | `/` (Home icon, Calculator) | Absent | AppNav only |
| Bar | `/bar` (Calculator icon) | `/bar` (GlassWater icon) | Icon mismatch |
| Check-in | `/checkin` (UserCheck) | `/checkin` (LogIn) | Icon mismatch |
| Rooms | `/rooms-grid` (Bed) | `/rooms-grid` (Bed) | Match |
| Check-out | `/checkout` (DoorOpen) | `/checkout` (DoorOpen) | Match |
| Loans | `/loan-items` (HandCoins) | `/loan-items` (Lock) | Icon mismatch |
| Extension | `/extension` (CalendarPlus) | `/extension` (CalendarPlus) | Match |
| Inbox | Absent | `/inbox` (Mail) | Modal only |
| Prime Requests | `/prime-requests` (Inbox) | `/prime-requests` (Inbox) | Match |

**Management section vs ManagementModal:**

| Item | AppNav "Management" | ManagementModal | Notes |
|---|---|---|---|
| Prepare | `/prepare-dashboard` | `/prepare-dashboard` | Match |
| Prepayments | `/prepayments` | `/prepayments` | Match |
| Opt-In | `/email-automation` | `/email-automation` | Match |
| Search | `/audit` | `/audit` | Match |
| Staff Accounts | In AppNav Admin section | In ManagementModal (peteOnly:true) | Section placement mismatch — modal treats it as a Management item, AppNav treats it as Admin |

**Till & Safe section vs TillModal:**

| Item | AppNav | TillModal | Notes |
|---|---|---|---|
| Till | `/till-reconciliation` (Calculator) | `/till-reconciliation` (Calculator) | Match |
| Safe | `/safe-reconciliation` (Shield) | `/safe-reconciliation` (Shield) | Match |
| Workbench | `/reconciliation-workbench` (Wrench) | `/reconciliation-workbench` (Wrench) | Match |
| Live | `/live` (List) | `/live` (Activity) | Icon mismatch |
| Variance | `/variance-heatmap` (AreaChart) | `/variance-heatmap` (AreaChart) | Match |
| End of Day | `/end-of-day` (FileText) | `/end-of-day` (FileText) | Match (route + icon) |

**Admin section vs ManModal:**

| Item | AppNav "Admin" | ManModal | Notes |
|---|---|---|---|
| Alloggiati | `/alloggiati` (Database) | `/alloggiati` (Database) | Match |
| Stock | `/stock` (Package) | `/stock` (Package) | Match |
| Ingredients | `/ingredient-stock` (Carrot) | `/ingredient-stock` (Carrot) | Match |
| Real Time | `/real-time-dashboard` (LineChart) | `/real-time-dashboard` (LineChart) | Match |
| Manager Audit | `/manager-audit` (ClipboardCheck) | Absent | AppNav only |
| End of Day | `/eod-checklist` (ListChecks) | Absent | AppNav only (label collision with Till EOD) |
| Statistics | `/statistics` (BarChart3) | `/statistics` (BarChart3) | Match |
| Menu Perf | `/menu-performance` (PieChart) | `/menu-performance` (PieChart) | Match (label differs: "Menu Perf" vs "Menu Performance") |
| Staff Accounts | Present (MANAGEMENT_ACCESS + peteOnly guard) | Absent | In ManagementModal instead |

**Summary of divergences requiring decisions:**
1. Dashboard (`/`) present in AppNav Operations, absent from OperationsModal — add to modal or keep sidebar-only?
2. Inbox (`/inbox`) present in OperationsModal, absent from AppNav — add to AppNav or keep modal-only?
3. 4 icon mismatches (Bar, Check-in, Loans, Live) — pick one canonical icon per item
4. Staff Accounts in ManagementModal but in AppNav Admin section — resolve section placement
5. Manager Audit absent from ManModal — add or keep sidebar-only?
6. EOD Checklist (`/eod-checklist`) absent from ManModal — add or keep sidebar-only?
7. Label: "End of Day" used for both `/end-of-day` and `/eod-checklist` in AppNav — rename Admin entry
8. "Menu Perf" vs "Menu Performance" label difference — pick canonical label

### Data & Contracts

- Types/schemas/events:
  - `NavItem` and `NavSection` are local to `AppNav.tsx` — not exported. Must be extracted if shared.
  - `ModalAction` is in `src/types/component/ModalAction.ts` — already exported.
  - `ModalAction.permission` is `UserRole[]` (array), matching `Permissions.*` constants in `roles.ts`.
  - `NavItem.permission` in AppNav is typed as `(typeof Permissions)[keyof typeof Permissions]` which resolves to `UserRole[]` — same shape. The types are compatible.
- Persistence: None — nav config is static.
- API/contracts: None.

### Dependency & Impact Map

- Upstream dependencies:
  - `apps/reception/src/lib/roles.ts` — `Permissions`, `canAccess`, `isPrivileged`
  - `apps/reception/src/lib/staffAccountsAccess.ts` — `isStaffAccountsPeteIdentity` (used for `peteOnly` filtering in HOC)
  - Lucide icons — imported by name in each modal file; in shared config they'd all be co-located
- Downstream dependents:
  - `apps/reception/src/components/AppModals.tsx` — renders all 4 modals; props unchanged
  - `apps/reception/src/components/appNav/CurrentPageIndicator.tsx` — third nav source with its own `routeMap`; must be migrated to consume shared config or it will continue to drift
  - `apps/reception/src/components/appNav/__tests__/Modals.test.tsx` — tests mock `withIconModal` and assert on `actions` arrays; tests use stale `iconClass` strings (old icon system), not Lucide icons — tests are weak and out of sync with current runtime contracts; need rewriting
  - Any future route additions to AppNav
- Likely blast radius:
  - Files changed: `navConfig.ts` (new), `AppNav.tsx`, all 4 modal files, `CurrentPageIndicator.tsx`, `withIconModal.tsx` (optional dedup), `Modals.test.tsx`
  - 7 files total (6 existing + 1 new)
  - No API calls; no database; no shared packages

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only — never run locally)
- CI integration: GitHub Actions, `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| 4 modals via withIconModal | Unit | `__tests__/Modals.test.tsx` | Mocks HOC; asserts config shape passed; tests logout callback |
| AppNav | None found | — | No unit tests for AppNav.tsx itself |

#### Coverage Gaps
- Tests use `iconClass` (FontAwesome-style string) rather than Lucide icon objects — **tests are already stale** and will fail if run with current code since `ModalAction.icon` is `LucideIcon`, not a string. Tests need rewriting regardless.
- No test for the `interactive` flag logic (canAccess gating in TillModal/ManModal wrappers).
- No test for the `peteOnly` filter path in `withIconModal`.

#### Recommended Test Approach
- Unit tests for: the shared nav config (correct routes, labels, permissions, peteOnly flags); the `withIconModal` HOC (action filtering by permission and peteOnly); updated Modals tests asserting Lucide icon references
- Integration tests for: TillModal/ManModal `interactive` prop behaviour (if wrapper layer is retained)

### Recent Git History (Targeted)
- `08ff2e8d83` "Add reception inbox workflow and Brikette route localization" — recent; touches appNav area
- `f8e47b8f9c` "feat(reception): add Chiusura nav entry to Admin section (TASK-03)" — added a nav item to AppNav only (not modal); illustrates the dual-source problem directly
- `864ee51e0d` "feat(reception): Wave 3 — staff accounts UI (TASK-05) and AppNav item (TASK-06)" — staff accounts nav item added; also AppNav only

## Questions

### Resolved

- Q: Are `NavItem.permission` and `ModalAction.permission` type-compatible?
  - A: Yes. Both resolve to `UserRole[]`. `NavItem.permission` is typed as `(typeof Permissions)[keyof typeof Permissions]` which is the same shape.
  - Evidence: `apps/reception/src/lib/roles.ts` L49-90; `apps/reception/src/types/component/ModalAction.ts`

- Q: Is `peteOnly` used anywhere in AppNav?
  - A: No. AppNav uses `isStaffAccountsPeteIdentity(user)` inline in the render function for the staff-accounts item. The shared config will need to carry `peteOnly` (already on `ModalAction`) and AppNav's renderer must honour it.
  - Evidence: `AppNav.tsx` L215-218; `ModalAction.ts` L9

- Q: Does the `interactive` prop need to stay?
  - A: Yes. TillModal and ManModal use `interactive` to render a visually disabled (non-clickable) modal for users who can view but not act. This is a deliberate UX choice (e.g. front desk staff can _see_ the Till modal, they just can't navigate from it). The wrapper logic can be moved into the HOC config, but the `interactive` behaviour itself must be preserved.
  - Evidence: `TillModal.tsx` L37-46; `ManModal.tsx` L37-46; `withIconModal.tsx` L29 (`interactive = true`)

- Q: Is there a `ManModal.tsx` analogue in the admin section labelled "Man" that's separate from "Management"?
  - A: Yes, but with a section placement anomaly. `ManagementModal` (Prepare, Prepayments, Opt-In, Search, Staff Accounts) is loosely the "Management" section — except Staff Accounts appears here but is placed in AppNav Admin. `ManModal` (Alloggiati, Stock, Ingredients, Real Time, Statistics, Menu Performance) loosely covers the "Admin" section but is missing Manager Audit, EOD Checklist, and Staff Accounts. The mapping is not clean; the plan must make explicit placement decisions.
  - Evidence: `ManModal.tsx`; `ManagementModal.tsx`; `AppNav.tsx` sections

- Q: Should the eod-checklist label be renamed to fix the duplicate "End of Day" label?
  - A: Yes. The AppNav Admin section has `{ label: "End of Day", route: "/eod-checklist" }` and the Till & Safe section has `{ label: "End of Day", route: "/end-of-day" }`. Two different routes with the same label is a UX bug. The Admin entry should be renamed "EOD Checklist" to distinguish it.
  - Evidence: `AppNav.tsx` L80, L101

- Q: Is the double `useAuth` call actually a problem?
  - A: Mild inefficiency only. `useAuth` reads from a React context — identical value returned both times in the same render. No correctness issue; no extra network call; no visible performance impact. Deduplication is clean and desirable but not urgent.
  - Evidence: `TillModal.tsx` L38; `withIconModal.tsx` L31

- Q: What is the canonical resolution for the icon mismatches (Bar uses Calculator in AppNav vs GlassWater in OperationsModal; Check-in uses UserCheck vs LogIn; Loans uses HandCoins vs Lock; Live uses List vs Activity)?
  - A: Icon discrepancies are best resolved by picking the more semantically accurate icon for each item. Recommended: Bar → GlassWater (semantically clearer for a bar), Check-in → UserCheck (matches domain), Loans → HandCoins (more descriptive), Live → Activity (more evocative of live data). These are all agent-resolvable design judgements with low risk. Plan can use these defaults; operator correction is trivial if disagreed.
  - Evidence: `AppNav.tsx` vs `OperationsModal.tsx`, `TillModal.tsx`

- Q: Should Dashboard (`/`) be added to OperationsModal and/or Inbox (`/inbox`) added to AppNav?
  - A: Resolvable by reasoning: Dashboard (`/`) in AppNav serves as a "home" entry point in the sidebar context. For the floating keyboard-shortcut modals, Dashboard is less useful (already on home). Inbox (`/inbox`) in OperationsModal appears to be a route that was added to the modal but not yet propagated to AppNav sidebar — the more likely omission. Recommendation: add Inbox to AppNav Operations section; keep Dashboard as sidebar-only (it is the root route, not a sub-page). This is agent-resolvable with low risk.
  - Evidence: `OperationsModal.tsx` L22; `AppNav.tsx` Operations items

- Q: Should Manager Audit and EOD Checklist be added to ManModal?
  - A: Yes, for consistency — these are admin-section items that live in AppNav but are absent from the modal. The omission appears unintentional (same pattern as other items added to AppNav but not propagated to modals). Plan should add them.
  - Evidence: `AppNav.tsx` L100-101; `ManModal.tsx` actions

- Q: Where does Staff Accounts belong in the unified config — Management or Admin section?
  - A: AppNav places it in Admin (with `MANAGEMENT_ACCESS` permission + peteOnly); ManagementModal places it with management items. The AppNav Admin placement is more defensible (it is an admin function requiring elevated access). Unified config should place it in Admin section. ManagementModal will not include it; it will appear only in the Admin (ManModal) surface.
  - Evidence: `AppNav.tsx` L104-110; `ManagementModal.tsx` L18-24; `ManModal.tsx`

### Open (Operator Input Required)

None. All divergences are resolvable by reasoning from code evidence and UX/domain logic. No operator-only knowledge is required — all placements and icon choices can be defaulted with low risk and are trivially correctable.

## Confidence Inputs

- Implementation: 88%
  - Evidence: All 6 files fully read (including CurrentPageIndicator.tsx identified in R2 critique); type compatibility confirmed; blast radius is 7 files (6 existing + 1 new config); pattern is straightforward extraction. Slight reduction from initial estimate to account for the breadth of the 8 divergence decisions.
  - To reach ≥90: Confirm approach for migrating CurrentPageIndicator.tsx `shortcut` metadata into shared config.
- Approach: 88%
  - Evidence: The "extract shared config, derive modals from it" approach maps cleanly to existing types. One decision point: whether to move `interactive` logic into HOC config or keep wrappers as thin pass-throughs.
  - To reach ≥90: Firm up the `interactive` dedup approach in the plan.
- Impact: 90%
  - Evidence: Route discrepancy already observed; recent git history shows new nav items added to AppNav only without corresponding modal updates (Chiusura, etc.), confirming the problem is live.
  - To reach ≥90: Already there.
- Delivery-Readiness: 88%
  - Evidence: No external dependencies; no API contracts; all affected files are in one app; test infrastructure is established. All referenced routes confirmed to exist.
  - To reach ≥90: Migrate CurrentPageIndicator.tsx shortcut data to shared config (requires design decision on config shape for shortcut annotations).
- Testability: 75%
  - Evidence: Tests exist but are stale (iconClass vs Lucide). Must rewrite tests. New shared config is easily unit-testable.
  - To reach ≥80: Confirm approach for testing LucideIcon references (identity vs display name).
  - To reach ≥90: Add interactive-flag tests and peteOnly filter tests.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Test rewrite introduces regression | Low | Medium | Tests mock withIconModal and assert shape — mechanical rewrite; no complex logic |
| Stale tests already broken in CI | Medium | Low | Tests use old iconClass shape incompatible with current LucideIcon type; this is pre-existing; rewrite resolves it |
| ManModal/ManagementModal placement decisions land incorrectly | Low | Medium | All placement decisions documented with rationale in Questions/Resolved section |
| `peteOnly` flag missing from AppNav render path | Low | Medium | AppNav.tsx L215-218 already has the guard inline; shared config must preserve peteOnly and AppNav renderer must check it |
| Staff Accounts moved from ManagementModal to ManModal creates a user-visible change | Low | Medium | Staff Accounts is peteOnly:true — only one user sees it; risk is minimal |
| Adding Inbox to AppNav sidebar changes sidebar item count | Low | Low | AppNav Operations already has 8 items; adding Inbox makes 9, consistent with other sections |
| Scope creep: resolving 8 divergences expands the diff significantly | Medium | Low | All 8 decisions are documented and agent-resolvable; no design work needed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Shared config should export `navSections` as the canonical source. Modal files derive their `ModalAction[]` by mapping from section items (or by referencing section items directly).
  - `ModalAction` type already covers `NavItem` — use `ModalAction` as the item shape in the shared config, eliminating the local `NavItem`/`NavSection` types in AppNav.tsx (or keep them as aliases).
  - The `withIconModal` HOC signature and `IconModalProps` contract must not change (AppModals.tsx passes the same props).
  - `peteOnly` must be honoured in both AppNav and modal filtering paths.
  - **All 8 divergence decisions must be explicitly documented in the plan** with a rationale. The plan must not silently pick one source as canonical — each decision must be traceable.
  - All routes added to the config (`/inbox`, `/manager-audit`, `/eod-checklist`, `/end-of-day`) are confirmed to exist as actual pages — no pre-build verification step needed.
- Rollout/rollback expectations:
  - Low runtime risk — primarily a static config extraction. User-visible changes are limited to: Inbox appearing in AppNav sidebar, Staff Accounts moving from ManagementModal to ManModal, Manager Audit and EOD Checklist appearing in ManModal, minor icon changes. Rollback = revert commit.
- Observability expectations:
  - None needed — no API or data contract changes.

## Suggested Task Seeds (Non-binding)

1. **Extract shared nav config** — create `apps/reception/src/components/appNav/navConfig.ts` exporting `navSections` (with `ModalAction`-shaped items, plus optional `sidebarOnly` flag). Apply all 8 divergence resolutions: add Inbox to Operations, resolve icon mismatches, place Staff Accounts in Admin, add Manager Audit + EOD Checklist to Admin, fix EOD Checklist label, fix "Menu Performance" label. Mark Dashboard as `sidebarOnly: true`.
2. **Migrate AppNav.tsx** — import `navSections` from `navConfig.ts`; remove local `NavItem`/`NavSection` types and inline array; update render to check `item.peteOnly` using `isStaffAccountsPeteIdentity`; skip `sidebarOnly` items in modal context.
3. **Migrate modal files** — OperationsModal, ManagementModal, TillModal, ManModal each derive their `actions` by filtering/mapping from the relevant section in `navSections`, excluding `sidebarOnly` items.
4. **Migrate CurrentPageIndicator.tsx** — replace `routeMap` with a derived map from `navConfig.ts` (flat `route → { label, section, icon, shortcut? }` structure); add any shortcut metadata to the config.
5. **Dedup useAuth in TillModal/ManModal** — remove wrapper components; move `interactive` computation into the HOC (accept a `permissionCheck` config option) or compute upstream in AppModals.tsx and pass as prop.
6. **Update Modals.test.tsx** — rewrite action assertions to use Lucide icon objects (or test by icon display name); add peteOnly and interactive-flag tests.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All 4 modal files derive their actions from `navConfig.ts`
  - AppNav.tsx imports `navSections` from `navConfig.ts`
  - `CurrentPageIndicator.tsx` derives its `routeMap` from `navConfig.ts` (no independent hardcoded map)
  - No duplicate route/label definitions remain across all 6 files (AppNav, 4 modals, CurrentPageIndicator)
  - All 8 divergence decisions resolved and applied to config
  - EOD Checklist label fixed (Admin section)
  - Double `useAuth` call eliminated
  - `Modals.test.tsx` updated and passing in CI
- Post-delivery measurement plan:
  - CI green (lint, typecheck, tests)
  - Adding a new nav route = one edit to `navConfig.ts` only

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| AppNav.tsx navSections | Yes | None | No |
| All 4 modal files (actions arrays) — full cross-tabulation | Yes | Major (R1 critique): Initial inventory incomplete; 8 divergences found including Dashboard/Inbox mismatch and Staff Accounts placement error | No — corrected in R2 revision |
| withIconModal.tsx HOC | Yes | None | No |
| ModalAction / NavItem type compatibility | Yes | None | No |
| useAuth duplication path | Yes | None | No |
| interactive flag / wrapper pattern | Yes | None | No |
| peteOnly flag coverage | Yes | Minor: AppNav guards peteOnly inline; shared config must propagate it | No (documented in risks) |
| Test landscape | Yes | Major (advisory): Tests use stale iconClass shape not matching current LucideIcon type — needs rewrite regardless | No (pre-existing, plan task covers it) |
| EOD route discrepancy | Yes | None — correctly identified as label-only fix | No |
| Staff Accounts section placement mismatch | Yes | Major (R1 critique): ManagementModal has Staff Accounts but AppNav places it in Admin — corrected | No — resolved in R2 revision |
| Icon mismatches (Bar, Check-in, Loans, Live) | Yes | None | No |
| AppModals.tsx consumer | Yes | None | No |
| Route existence verification (/inbox, /manager-audit, /eod-checklist, /end-of-day) | Yes | None — all confirmed to exist as actual pages (R2 critique finding) | No |
| CurrentPageIndicator.tsx as third nav source | Yes | Major (R2 critique): Initial brief omitted CPI as a third independent routeMap — corrected in R2 revision, added to scope | No |

## Scope Signal

- Signal: right-sized
- Rationale: All 6 source files read and fully understood (including `CurrentPageIndicator.tsx` identified in R2 critique). Full divergence inventory produced (8 divergences across 4 modal/section pairs). All divergences are agent-resolvable by reasoning from code evidence and domain logic. Blast radius is confined to one app directory: 7 files (6 existing + 1 new config). All referenced routes confirmed to exist. No operator knowledge gaps remain. The additional scope of resolving divergences and migrating CurrentPageIndicator is bounded and documented.

## Evidence Gap Review

### Gaps Addressed
- Confirmed `NavItem.permission` and `ModalAction.permission` are the same underlying type — no schema migration needed.
- Confirmed `peteOnly` exists in `ModalAction` and is already used in the HOC; AppNav has its own inline guard. Unified config will carry the field.
- Confirmed the EOD label collision is a bug (two separate routes, same label); fix is label rename in Admin section.
- Confirmed tests are stale (iconClass vs Lucide) and need rewriting regardless of this change.
- Confirmed wrapper components (`TillModal`, `ManModal`) are the sole source of useAuth duplication.
- Produced a complete cross-tabulation of all 8 divergences across all 4 modal/section pairs (Round 1 critique found the initial inventory was incomplete — corrected in Round 2 revision).
- Confirmed Staff Accounts section placement mismatch: in ManagementModal but should be in Admin (ManModal) to match AppNav.
- Confirmed Dashboard (`/`) is sidebar-only (appropriate), Inbox (`/inbox`) should be added to AppNav sidebar.

### Confidence Adjustments
- Implementation: 88% (raised from 75% dispatch estimate; reflects 6 files read, 8 divergences documented, CPI as third source identified in R2 critique).
- Delivery-Readiness: 88% (no blockers; all routes confirmed to exist; CPI migration adds modest complexity to shortcut metadata handling).

### Remaining Assumptions
- That the `/eod-checklist` route is a separate page from `/end-of-day` (not a redirect). **Route existence confirmed**: `apps/reception/src/app/eod-checklist/page.tsx` and `apps/reception/src/app/end-of-day/page.tsx` both exist.
- That `/inbox` and `/manager-audit` routes exist as actual pages. **Route existence confirmed**: `apps/reception/src/app/inbox/page.tsx` and `apps/reception/src/app/manager-audit/page.tsx` both exist. The Task 1 "verify routes" seed task from R1 revision is no longer needed.
- That ManModal's omission of Manager Audit, EOD Checklist, and Staff Accounts is unintentional (pattern matches other items added to AppNav sidebar but not propagated to modals).

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-appnav-dual-source --auto`
