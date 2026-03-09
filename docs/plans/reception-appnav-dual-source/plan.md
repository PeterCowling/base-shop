---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-appnav-dual-source
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception AppNav Dual Source — Plan

## Summary

Navigation items and groupings for the Reception app are currently defined independently in three places: `AppNav.tsx` (sidebar), four modal files (`OperationsModal`, `ManagementModal`, `TillModal`, `ManModal`), and `CurrentPageIndicator.tsx`. The dual/triple source has produced 8 discrete discrepancies including missing items, icon mismatches, a label collision, and a section placement error for Staff Accounts. This plan extracts a single canonical `navConfig.ts`, migrates all three consumers to derive from it, fixes all 8 divergences in the config, eliminates the double `useAuth` call in the TillModal/ManModal wrapper components, rewrites the stale `Modals.test.tsx`, and adds a new `withIconModal.test.tsx` to test the HOC's `permissionKey→interactive` behaviour.

## Active tasks
- [ ] TASK-01: Create navConfig.ts shared nav source
- [ ] TASK-02: Migrate AppNav.tsx to consume navConfig
- [ ] TASK-03: Migrate 4 modal files to derive from navConfig
- [ ] TASK-04: Migrate CurrentPageIndicator.tsx to derive from navConfig
- [ ] TASK-05: Dedup useAuth by removing TillModal/ManModal wrapper components
- [ ] TASK-06: Rewrite Modals.test.tsx and add withIconModal.test.tsx

## Goals
- Single source of truth for all nav route/label/icon data in `navConfig.ts`
- All 8 divergences resolved with explicit rationale
- No duplicate `useAuth` calls per render in modal components
- Adding a nav route requires one edit to `navConfig.ts`; keyboard shortcut metadata (CPI only) and special CPI breadcrumb section overrides (Dashboard only) remain as thin overlays in CPI but are isolated and documented

## Non-goals
- Redesigning the sidebar vs modal UI structure
- Changing the permission model or role definitions
- Migrating `withIconModal` to a non-HOC pattern

## Constraints & Assumptions
- Constraints:
  - `withIconModal` HOC signature and `IconModalProps` contract must not change (AppModals.tsx passes same props)
  - `peteOnly` field must be honoured in both AppNav and modal rendering paths
  - `interactive` behaviour in TillModal/ManModal must be preserved (users without permission see disabled modal)
- Assumptions:
  - `/inbox` and `/manager-audit` routes confirmed to exist as actual pages
  - Dashboard (`/`) is intentionally sidebar-only — it is the root route, not a sub-page useful in modals
  - All 8 divergence resolutions are low-risk agent decisions; operator can trivially correct any icon/label choice

## Inherited Outcome Contract

- **Why:** Dual source of truth for nav items means route changes require 5 simultaneous edits and has already produced an inconsistency (/end-of-day vs /eod-checklist both labelled "End of Day"). The useAuth double-call is a mild inefficiency.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Navigation items are defined once in AppNav (or a shared nav config) and consumed by both the nav bar and all modal variants. Adding a route requires one change.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-appnav-dual-source/fact-find.md`
- Key findings used:
  - 8 divergences catalogued across all modal/section pairs (see Divergence Decisions below)
  - `CurrentPageIndicator.tsx` identified as third independent nav source
  - `ModalAction` type is a strict superset of `NavItem` — no type migration needed
  - `useAuth` double-call pattern in TillModal/ManModal wrappers
  - All referenced routes confirmed to exist as pages

## Proposed Approach

- Option A: Extract `navConfig.ts` as the single canonical nav source; migrate AppNav, 4 modal files, and CurrentPageIndicator to derive from it; remove TillModal/ManModal wrapper components and move `interactive` computation into the HOC via a `permissionKey` config option.
- Option B: Extract `navConfig.ts` but keep TillModal/ManModal wrappers (just remove the duplicate `useAuth` call by accepting `interactive` as a prop from AppModals.tsx).
- Chosen approach: **Option A** — eliminates the wrapper layer entirely. The HOC accepts an optional `permissionKey?: UserRole[]` config field; when provided, it calls `canAccess(authUser, permissionKey)` internally and renders with the result as `interactive`. This is cleaner than option B (no wrapper passthrough, no prop threading through AppModals). Fallback: if `permissionKey` is absent, `interactive` defaults to `true` (preserving existing behaviour for OperationsModal and ManagementModal).

## Divergence Decisions (8 items, all applied in TASK-01)

1. **Dashboard (`/`) in AppNav, absent from OperationsModal** → Keep sidebar-only. Mark with `sidebarOnly: true` in config. Dashboard is the root route; it is already the default landing for any nav context.
2. **Inbox (`/inbox`) in OperationsModal, absent from AppNav** → Add Inbox to AppNav Operations section. Route exists. Pattern of items added to modals but not to sidebar.
3. **Icon mismatches (4 items)** → Canonical icons: Bar → GlassWater (semantically clearer), Check-in → UserCheck (domain match), Loans → HandCoins (more descriptive), Live → Activity (evocative of live data). CurrentPageIndicator uses the old icons — will be corrected when it migrates to navConfig.
4. **Staff Accounts in ManagementModal but AppNav Admin section** → Place in Admin section. Admin is more defensible (elevated access function). ManagementModal will not include it; it appears only via ManModal.
5. **Manager Audit absent from ManModal** → Add to Admin section in navConfig, include in ManModal. Route `/manager-audit` exists. Omission appears unintentional.
6. **EOD Checklist absent from ManModal** → Add to Admin section in navConfig, include in ManModal. Route `/eod-checklist` exists.
7. **Label collision** → AppNav Admin entry labelled "End of Day" (route `/eod-checklist`) → rename to "EOD Checklist". Sidebar and modal will show "EOD Checklist" to distinguish from Till EOD.
8. **"Menu Perf" vs "Menu Performance"** → Canonical label "Menu Performance" (full word, more readable). Apply in navConfig.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create navConfig.ts shared nav source | 90% | M | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Migrate AppNav.tsx to consume navConfig | 90% | S | Pending | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | Migrate 4 modal files to derive from navConfig | 90% | S | Pending | TASK-01 | TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Migrate CurrentPageIndicator.tsx to derive from navConfig | 85% | S | Pending | TASK-01 | - |
| TASK-05 | IMPLEMENT | Dedup useAuth by removing TillModal/ManModal wrappers | 85% | S | Pending | TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Rewrite Modals.test.tsx + add withIconModal.test.tsx | 80% | M | Pending | TASK-02, TASK-03, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must complete before any other task |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 | All three can run in parallel — no file overlap |
| 3 | TASK-05 | TASK-03 | Depends on modal migration being complete |
| 4 | TASK-06 | TASK-02, TASK-03, TASK-05 | Tests assert on post-migration structure |

## Tasks

---

### TASK-01: Create navConfig.ts shared nav source
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/components/appNav/navConfig.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/navConfig.ts` (new), `[readonly] apps/reception/src/types/component/ModalAction.ts`, `[readonly] apps/reception/src/lib/roles.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — type shape is confirmed compatible; all divergences have explicit resolutions; all icons are named imports from lucide-react; straightforward static object construction
  - Approach: 95% — extracting a static config object is the simplest possible refactor; no runtime behaviour change
  - Impact: 90% — this task is the foundation; if it is wrong, downstream tasks fail; correctness is verifiable by comparing routes/labels/icons against the fact-find inventory
- **Acceptance:**
  - `navConfig.ts` exports `navSections: NavSection[]` where `NavSection` has `label`, `items: NavConfigItem[]`, optional `permission: UserRole[]`, optional `permissionKey: UserRole[]` (for HOC interactive gating)
  - `NavConfigItem` extends `ModalAction` with optional `sidebarOnly?: boolean`
  - All 8 divergence decisions applied (see Divergence Decisions section)
  - Dashboard item marked `sidebarOnly: true`
  - Inbox (`/inbox`, Mail icon) present in Operations section
  - EOD Checklist item labelled "EOD Checklist" (not "End of Day")
  - Manager Audit present in Admin section
  - Staff Accounts present in Admin section (peteOnly: true, permission: MANAGEMENT_ACCESS)
  - ManagementModal section does NOT include Staff Accounts
  - Canonical icons applied: Bar → GlassWater, Check-in → UserCheck, Loans → HandCoins, Live → Activity
  - Menu Performance uses full label "Menu Performance"
  - Till & Safe section carries `permissionKey: Permissions.TILL_ACCESS`
  - Admin section carries `permissionKey: Permissions.MANAGEMENT_ACCESS`
  - File is TypeScript, no "use client" directive (it is a static config — no hooks)
- **Validation contract:**
  - TC-01: `navSections[0].items` includes Dashboard (`/`, sidebarOnly:true) AND Inbox (`/inbox`); Dashboard is present but marked sidebarOnly — it is NOT excluded from the items array
  - TC-02: Admin section item for `/eod-checklist` has label "EOD Checklist"
  - TC-03: Admin section includes Manager Audit, Staff Accounts (peteOnly:true)
  - TC-04: ManagementModal-equivalent section does not include Staff Accounts
  - TC-05: `sidebarOnly` field is `true` only for Dashboard; all other items have `sidebarOnly` absent or false
  - TC-06: Till & Safe section has `permissionKey: Permissions.TILL_ACCESS`
- **Execution plan:** Create file → write `NavConfigItem` interface (extends `ModalAction` + `sidebarOnly?`) → write `NavSection` interface (label, items, permission?, permissionKey?) → write `navSections` array with all 4 sections → apply all 8 divergence decisions inline with comments → export `navSections` and both interfaces
- **Planning validation (required for M/L):**
  - Checks run: read `ModalAction.ts` (confirmed shape), read `roles.ts` (confirmed `Permissions.*` shape), verified all icon names against `AppNav.tsx` and modal file imports, verified all routes exist as pages
  - Validation artifacts: fact-find divergence inventory, fact-find resolved questions
  - Unexpected findings: None
- **Scouts:** Confirm lucide-react exports `GlassWater` and `Activity` icons by name (both are in `OperationsModal.tsx` and `TillModal.tsx` imports respectively — confirmed present)
- **Edge Cases & Hardening:**
  - `sidebarOnly` items must be filtered out by modal consumers — this filtering is the responsibility of TASK-03, but the flag must be present in this task
  - `permissionKey` must be optional (OperationsModal and ManagementModal have no section-level interactive gate)
- **What would make this >=90%:** Already at 90%. To reach 95%: have build agent run `tsc --noEmit` on the new file before proceeding.
- **Rollout / rollback:**
  - Rollout: New file only; no existing file changes; zero runtime impact until consumers are migrated
  - Rollback: Delete `navConfig.ts`
- **Documentation impact:** None — internal refactor
- **Notes / references:**
  - `NavConfigItem` is intentionally a superset of `ModalAction` so modal files can use items directly
  - Shortcuts for CurrentPageIndicator (e.g. Bar=1, Check-in=2, etc.) are NOT included in this task — they are currently only in CPI and will be migrated in TASK-04

---

### TASK-02: Migrate AppNav.tsx to consume navConfig
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/appNav/AppNav.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/AppNav.tsx`, `[readonly] apps/reception/src/components/appNav/navConfig.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% — remove local `navSections` array and `NavItem`/`NavSection` type declarations; import from `navConfig.ts`; render logic unchanged (AppNav shows all items including sidebarOnly — only modal consumers filter those out)
  - Approach: 95% — straightforward import swap
  - Impact: 90% — AppNav renders the sidebar; any mistake here breaks navigation for all users
- **Acceptance:**
  - Local `navSections` array removed from `AppNav.tsx`
  - Local `NavItem` and `NavSection` type declarations removed (or converted to re-exports/aliases of `NavConfigItem`/`NavSection` from navConfig)
  - `navSections` imported from `./navConfig`
  - AppNav renders all items in each section, including Dashboard (`sidebarOnly: true`). The `sidebarOnly` flag means "show in sidebar, exclude from modals" — AppNav does NOT filter it. Only modal consumers filter `sidebarOnly` items out.
  - `peteOnly` check preserved inline in render: `item.peteOnly && !isStaffAccountsPeteIdentity(user)` → skip
  - Import list: remove all unused icon imports (icons now live in navConfig.ts)
  - TypeScript: no type errors
  - Expected user-observable behavior:
    - [ ] Inbox appears in the Operations section of the sidebar
    - [ ] "EOD Checklist" label replaces "End of Day" in the Admin section
    - [ ] Manager Audit and Staff Accounts remain in Admin section (unchanged from before for sidebar users)
    - [ ] All navigation links continue to work
    - [ ] Bar icon changed to GlassWater, Check-in to UserCheck, Loans to HandCoins — visible icon changes in sidebar
- **Validation contract:**
  - TC-01: Sidebar renders Inbox item in Operations section
  - TC-02: Admin section shows "EOD Checklist" (not "End of Day") for `/eod-checklist`
  - TC-03: Dashboard (`/`) renders correctly in sidebar
  - TC-04: `peteOnly` items hidden for non-Pete users
  - TC-05: No TypeScript errors (tsc --noEmit passes)
- **Execution plan:** Import `navSections`, `NavConfigItem`, `NavSection` from `./navConfig` → remove local type declarations → remove local `navSections` array → update `canAccessSection` param type if needed → confirm render loop handles `peteOnly` via `isStaffAccountsPeteIdentity` → remove unused icon imports
- **Planning validation:** Verified local `NavItem`/`NavSection` types are not exported (local only) — safe to remove
- **Scouts:** None required — all file paths and types verified in fact-find
- **Edge Cases & Hardening:** Do NOT filter `sidebarOnly` items in AppNav — sidebar shows all items. Only modal consumers filter them.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Purely cosmetic icon/label changes for sidebar users; no route changes
  - Rollback: Revert AppNav.tsx
- **Documentation impact:** None
- **Notes / references:** `canAccessSection` in AppNav currently accepts `(typeof Permissions)[keyof typeof Permissions]` which is `UserRole[]` — same as `NavConfigItem.permission` — no type change needed

---

### TASK-03: Migrate 4 modal files to derive from navConfig
- **Type:** IMPLEMENT
- **Deliverable:** Modified `OperationsModal.tsx`, `ManagementModal.tsx`, `TillModal.tsx`, `ManModal.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/OperationsModal.tsx`, `apps/reception/src/components/appNav/ManagementModal.tsx`, `apps/reception/src/components/appNav/TillModal.tsx`, `apps/reception/src/components/appNav/ManModal.tsx`, `[readonly] apps/reception/src/components/appNav/navConfig.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 90%
  - Implementation: 90% — each modal file replaces its hardcoded `actions` array with a derived slice from `navConfig.ts`; the HOC call is unchanged
  - Approach: 90% — filter by section label + exclude `sidebarOnly` items
  - Impact: 90% — four modal files are modified; any routing mistake breaks modal navigation
- **Acceptance:**
  - Each modal file no longer contains a hardcoded `actions` array
  - Actions are derived: `navSections.find(s => s.label === "Operations").items.filter(i => !i.sidebarOnly)`
  - `OperationsModal`: derives from Operations section; excludes Dashboard (sidebarOnly); includes Inbox
  - `ManagementModal`: derives from Management section; does NOT include Staff Accounts (it is in Admin)
  - `TillModal`: derives from Till & Safe section; no sidebarOnly items in this section
  - `ManModal`: derives from Admin section; includes Manager Audit, EOD Checklist, Staff Accounts; filtering of peteOnly is handled by the HOC
  - `withIconModal` call signature unchanged for each file
  - All unused icon imports removed from each modal file
  - TypeScript: no type errors
  - Expected user-observable behavior:
    - [ ] OperationsModal shows Inbox, does not show Dashboard
    - [ ] ManagementModal does not show Staff Accounts
    - [ ] ManModal shows Manager Audit, EOD Checklist, Staff Accounts (for pete-only users)
    - [ ] TillModal unchanged (already matched navConfig)
    - [ ] All existing modal items still accessible
- **Validation contract:**
  - TC-01: OperationsModal derives actions from Operations section, Inbox present, Dashboard absent
  - TC-02: ManagementModal derives from Management section, Staff Accounts absent
  - TC-03: ManModal derives from Admin section, Manager Audit and EOD Checklist present
  - TC-04: TillModal derives from Till & Safe section, 6 items present
  - TC-05: All 4 modal files typecheck without errors
- **Execution plan:** For each modal: identify corresponding section label → replace hardcoded `actions` with derived slice → remove unused imports → verify `withIconModal` call is unchanged → verify TillModal and ManModal wrapper components still call `withIconModal` correctly (wrapper components removed in TASK-05, not here — this task only replaces the `actions` array)
- **Planning validation:** Confirmed section label strings in AppNav: "Operations", "Till & Safe", "Management", "Admin" — these will be the filter keys
- **Scouts:** None required
- **Edge Cases & Hardening:**
  - TillModal and ManModal still retain their wrapper components in this task (dedup happens in TASK-05)
  - `peteOnly` filtering is already handled inside `withIconModal.tsx` — no extra filter needed in modal files
  - Null-guard the `navSections.find()` call (or use a named helper) to avoid runtime crash if section label changes
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Modal items will change for users — Inbox in OperationsModal, Manager Audit/EOD Checklist/Staff Accounts in ManModal
  - Rollback: Revert 4 modal files
- **Documentation impact:** None
- **Notes / references:** Section label strings should ideally be constants rather than magic strings — add `SECTION_LABELS` const to navConfig.ts or use direct object references

---

### TASK-04: Migrate CurrentPageIndicator.tsx to derive from navConfig
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/appNav/CurrentPageIndicator.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/CurrentPageIndicator.tsx`, `[readonly] apps/reception/src/components/appNav/navConfig.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — CPI has an independent `routeMap` with a `shortcut` field not present in navConfig; migrating requires either adding shortcut data to navConfig or keeping shortcut as a separate overlay; either is viable but adds one design choice
  - Approach: 85% — derive `routeMap` from navConfig via `Object.fromEntries(navSections.flatMap(...))` + overlay shortcuts
  - Impact: 90% — CPI is purely display (shows current page label/icon in header); mistakes affect the header label only, not navigation
- **Acceptance:**
  - CPI no longer contains a hardcoded `routeMap` with route/label/icon entries
  - `routeMap` is derived at module level from `navSections` via a flatten + reduce
  - Shortcut annotations (Bar=1, Check-in=2, etc.) preserved — injected as a separate const overlay merged with the derived map
  - CPI uses the canonical icons and labels from navConfig (e.g. GlassWater for Bar, "Menu Performance" label)
  - Routes added to navConfig automatically appear in CPI without any manual CPI edit (for route/label/icon). Routes that additionally need a keyboard shortcut must also be added to CPI's `shortcutsOverlay` (a thin, stable 6-entry const). Routes with a special breadcrumb section label must be added to `sectionOverlay` (currently only Dashboard: "Reception"). These two overlays are the only remaining CPI-local data.
  - TypeScript: no type errors
  - Expected user-observable behavior:
    - [ ] Header indicator label and icon still match the current page
    - [ ] Bar shows GlassWater icon (updated from Calculator)
    - [ ] Check-in shows UserCheck icon
    - [ ] Loans shows HandCoins icon
    - [ ] Live shows Activity icon
    - [ ] "Menu Performance" label in header (instead of "Menu Perf")
    - [ ] Inbox page shows correct header when navigated to
- **Validation contract:**
  - TC-01: `routeMap["/bar"].icon` is GlassWater (matches navConfig)
  - TC-02: `routeMap["/menu-performance"].label` is "Menu Performance"
  - TC-03: `routeMap["/inbox"]` exists and has label "Inbox"
  - TC-04: Shortcut `routeMap["/bar"].shortcut` is still "1"
  - TC-05: `routeMap["/"].section` is "Reception" (not "Operations") — section override preserves current CPI breadcrumb behaviour for Dashboard
- **Execution plan:** Build derived routeMap with shortcut overlay AND section label overrides for special cases. `const shortcutsOverlay: Record<string, string> = { "/bar": "1", "/checkin": "2", "/rooms-grid": "3", "/checkout": "4", "/loan-items": "5", "/extension": "6" }` — section label overrides: Dashboard (`/`) must display section "Reception" (not "Operations") to preserve current CPI behavior: `const sectionOverlay: Record<string, string> = { "/": "Reception" }` → `const routeMap = Object.fromEntries(navSections.flatMap(section => section.items.map(item => [item.route, { label: item.label, section: sectionOverlay[item.route] ?? section.label, icon: item.icon, shortcut: shortcutsOverlay[item.route] }])))` → remove hardcoded entries → remove unused icon imports
- **Planning validation:** Verified CPI `RouteInfo` type: `{ label, section, icon, shortcut? }` — matches what the derived map produces
- **Scouts:** None required
- **Edge Cases & Hardening:**
  - Shortcut overlay is a thin separate const — easy to maintain; shortcuts are only for Operations items (6 routes)
  - Dashboard (`/`) is `sidebarOnly` — but CPI should still show it (it IS a page). Include sidebarOnly items in CPI's derived map (sidebarOnly only means "don't show in modals")
- **What would make this >=90%:** Confirm that including `sidebarOnly` items in CPI derived map is correct; 85% because the shortcut overlay adds one non-obvious merge step.
- **Rollout / rollback:**
  - Rollout: Header icon/label changes for 4 routes (Bar, Check-in, Loans, Live); new routes auto-appear
  - Rollback: Revert CurrentPageIndicator.tsx
- **Documentation impact:** None
- **Notes / references:** CPI currently has 24 entries; navConfig will have ~25 routes (slightly more after divergence fixes) — coverage is a net improvement

---

### TASK-05: Dedup useAuth by removing TillModal/ManModal wrapper components
- **Type:** IMPLEMENT
- **Deliverable:** Modified `withIconModal.tsx`, `TillModal.tsx`, `ManModal.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hoc/withIconModal.tsx`, `apps/reception/src/components/appNav/TillModal.tsx`, `apps/reception/src/components/appNav/ManModal.tsx`, `[readonly] apps/reception/src/components/AppModals.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — modifying the HOC to accept a `permissionKey` config option is a small, additive change; removing wrapper components requires verifying AppModals.tsx does not need changes
  - Approach: 85% — the chosen approach (Option A) is clean; held-back test: if `canAccess` has different semantics in HOC vs wrapper, the `interactive` computation would differ. Both call `canAccess(authUser, permission)` with the same args — same result guaranteed.
  - Impact: 85% — TillModal and ManModal no longer have wrapper components; the external interface (from AppModals.tsx) is unchanged since `BaseTillModal` / `BaseManModal` become the direct export
- **Acceptance:**
  - `withIconModal.tsx` accepts new optional `permissionKey?: UserRole[]` in `WithIconModalConfig`
  - When `permissionKey` is provided, the HOC calls `canAccess(authUser, permissionKey)` and passes the result as `interactive` to its render logic
  - `TillModal.tsx` removes the `TillModal` wrapper function; the exported component is `withIconModal({ label: "TILL", actions, permissionKey: Permissions.TILL_ACCESS })`
  - `ManModal.tsx` removes the `ManModal` wrapper function; the exported component is `withIconModal({ label: "MAN", actions, permissionKey: Permissions.MANAGEMENT_ACCESS })`
  - `AppModals.tsx` requires no changes (props interface unchanged: `visible`, `onClose`, `onLogout`, `user`)
  - `useAuth` called exactly once per render in TillModal and ManModal
  - TypeScript: no type errors
  - Expected user-observable behavior:
    - [ ] TillModal still renders as disabled (read-only) for users without TILL_ACCESS
    - [ ] ManModal still renders as disabled for users without MANAGEMENT_ACCESS
    - [ ] Interactive navigation works correctly for users with the appropriate permission
- **Validation contract:**
  - TC-01: TillModal renders with `interactive=false` when authUser lacks TILL_ACCESS
  - TC-02: ManModal renders with `interactive=false` when authUser lacks MANAGEMENT_ACCESS
  - TC-03: OperationsModal and ManagementModal unaffected (no permissionKey → interactive defaults to true)
  - TC-04: AppModals.tsx compiles without changes
- **Execution plan:** Extend `WithIconModalConfig` with `permissionKey?: UserRole[]` → inside HOC render function, add: `const effectiveInteractive = config.permissionKey ? canAccess(authUser, config.permissionKey) : interactive` → use `effectiveInteractive` instead of `interactive` in render → update TillModal.tsx: remove wrapper, change export to `withIconModal({ label: "TILL", actions, permissionKey: Permissions.TILL_ACCESS })` → update ManModal.tsx: same pattern with MANAGEMENT_ACCESS → remove `useAuth`, `canAccess`, `IconModalProps` imports from TillModal/ManModal
- **Planning validation:** Confirmed `AppModals.tsx` does not pass `interactive` prop to any modal (all 4 modals receive only `visible`, `onClose`, `onLogout`, `user`) — `interactive` prop removal from external API is safe
- **Consumer tracing:**
  - `IconModalProps.interactive` field: currently consumed by `TillModal` and `ManModal` wrappers. After this task, no external caller passes `interactive`. The prop can remain on `IconModalProps` for forward compatibility but is unused externally.
  - `withIconModal` return type: unchanged (still returns a component matching `IconModalProps`)
- **Scouts:** Verify `canAccess` import path in withIconModal.tsx (already imports from `../lib/roles`)
- **Edge Cases & Hardening:**
  - `interactive` prop on `IconModalProps` stays typed as optional — no breaking change
  - When `permissionKey` is provided AND external `interactive` is also passed, `permissionKey` wins (computed value takes precedence over external override). Document this precedence in a comment.
- **What would make this >=90%:** Run tsc on withIconModal.tsx to confirm the `permissionKey` type addition is error-free.
- **Rollout / rollback:**
  - Rollout: No user-visible change — same interactive behaviour, one fewer hook call per render
  - Rollback: Revert withIconModal.tsx, TillModal.tsx, ManModal.tsx
- **Documentation impact:** None
- **Notes / references:** `memo()` wrapper on `TillModal` and `ManModal` is removed since the HOC result is already memo-able at the module level

---

### TASK-06: Rewrite Modals.test.tsx
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/appNav/__tests__/Modals.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/__tests__/Modals.test.tsx`, `apps/reception/src/hoc/__tests__/withIconModal.test.tsx` (new), `[readonly] apps/reception/src/components/appNav/navConfig.ts`, `[readonly] apps/reception/src/components/appNav/OperationsModal.tsx`, `[readonly] apps/reception/src/components/appNav/ManagementModal.tsx`, `[readonly] apps/reception/src/components/appNav/TillModal.tsx`, `[readonly] apps/reception/src/components/appNav/ManModal.tsx`, `[readonly] apps/reception/src/hoc/withIconModal.tsx`
- **Depends on:** TASK-02, TASK-03, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — tests need to be rewritten to assert on Lucide icon function references (or `.name` / `.displayName`); mock structure must match new TillModal/ManModal (no wrapper component); approach is clear but requires careful mock setup
  - Approach: 80% — testing LucideIcon identity: compare `action.icon === GlassWater` or `action.icon.displayName === "GlassWater"` — either works; choose `.name` comparison for readability
  - Impact: 85% — tests validate the config is correctly plumbed through; if tests pass, the migration is verified
- **Acceptance:**
  - `Modals.test.tsx` no longer uses `iconClass` assertions
  - Tests assert that each modal was configured with the correct routes from navConfig
  - At minimum, tests check: correct label passed to HOC, correct route set (no more, no less than expected), peteOnly item present in ManModal config
  - TillModal/ManModal mock setup updated: no wrapper component, direct HOC result
  - `permissionKey` config option asserted for TillModal (`Permissions.TILL_ACCESS`) and ManModal (`Permissions.MANAGEMENT_ACCESS`)
  - **New file `hoc/__tests__/withIconModal.test.tsx`**: tests the real HOC (no mock) with a mocked AuthContext; asserts that when `permissionKey` is provided and `canAccess` returns false, the rendered buttons are disabled (`interactive=false`). This is a separate file because `Modals.test.tsx` mocks `withIconModal` at module level and cannot test the real HOC behavior.
  - All tests pass in CI
  - Expected user-observable behavior: None (test-only change)
- **Validation contract:**
  - TC-01: OperationsModal test asserts Inbox route present, Dashboard absent from modal actions (Dashboard is sidebarOnly — modal derives actions filtering sidebarOnly out)
  - TC-02: ManagementModal test asserts Staff Accounts absent
  - TC-03: ManModal test asserts Manager Audit, EOD Checklist, Staff Accounts present
  - TC-04: TillModal test asserts permissionKey is TILL_ACCESS
  - TC-05: `withIconModal.test.tsx` — real HOC renders buttons as disabled when authUser lacks permissionKey roles
  - TC-06: `withIconModal.test.tsx` — real HOC renders buttons as interactive when authUser has permissionKey roles
- **Execution plan:** In `Modals.test.tsx`: remove all `iconClass` assertions → build new assertion helpers using `action.icon.name` → update mock to capture `config.permissionKey` → add permissionKey assertions for TillModal and ManModal → update Dashboard TC-01 (Dashboard absent from modal-derived actions since it is `sidebarOnly`) → run CI. Create `hoc/__tests__/withIconModal.test.tsx`: render real HOC result with mocked AuthContext returning user with/without TILL_ACCESS → assert button disabled state → assert peteOnly item hidden for non-pete user.
- **Planning validation:** Confirmed test file uses `jest.mock("../../../hoc/withIconModal")` at module level — this mock approach works for Modals.test.tsx config assertions. The real HOC behavior (permissionKey→interactive) must be tested in a separate file that does NOT mock withIconModal.
- **Consumer tracing:**
  - `withIconModalMock` captures `config` on each call — after TASK-05, TillModal and ManModal calls will include `permissionKey` in config. The mock must be updated to capture and assert on this field.
- **Scouts:** Check if Lucide icon functions have a `.name` property at test time — confirmed standard JS functions have `.name` (e.g. `GlassWater.name === "GlassWater"`). Also check if `hoc/__tests__/` directory exists — if not, create it.
- **Edge Cases & Hardening:**
  - Test isolation: each modal test imports independently; mock is reset between describe blocks
  - AuthContext mock needed for interactive-flag tests
- **What would make this >=90%:** Add test for peteOnly filtering via mocked `isStaffAccountsPeteIdentity`.
- **Rollout / rollback:**
  - Rollout: Tests only — no production change
  - Rollback: Revert test file
- **Documentation impact:** None
- **Notes / references:** Tests run in CI only; never run locally per project policy

---

## Risks & Mitigations
- Test rewrite introduces regression: Low likelihood — tests mock withIconModal and assert on config shape; mechanical rewrite with clear target structure
- `sidebarOnly` filtering incorrectly applied in AppNav (showing modals-only items in sidebar): Not applicable — `sidebarOnly: true` means show in sidebar, hide in modals. AppNav must NOT filter these. Only modal consumers filter.
- Section label string mismatch (magic string used in `find(s => s.label === "Operations")`): Mitigate by exporting section label constants from navConfig.ts or by using section index/key lookup
- `permissionKey` precedence over external `interactive` prop causes unexpected behavior: Documented in TASK-05; only TillModal and ManModal pass permissionKey; AppModals never passes `interactive` externally
- Staff Accounts visible to wrong users after migration: peteOnly:true + MANAGEMENT_ACCESS ensures only Pete can see it via ManModal; ManagementModal no longer shows it

## Observability
- Logging: None — static config refactor
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `navConfig.ts` exists and is the single source of truth for all nav items
- [ ] All 6 files (AppNav, 4 modals, CPI) consume navConfig; no independent hardcoded route/label/icon definitions remain. CPI retains two thin overlays (`shortcutsOverlay` for keyboard shortcuts, `sectionOverlay` for the Dashboard breadcrumb label) — these are metadata that cannot move to navConfig without changing its scope.
- [ ] All 8 divergences resolved (see Divergence Decisions)
- [ ] `useAuth` called exactly once per render in TillModal and ManModal
- [ ] `Modals.test.tsx` tests all pass in CI with no `iconClass` assertions
- [ ] TypeScript compiles without errors (`pnpm --filter @apps/reception typecheck`)
- [ ] Lint passes (`pnpm --filter @apps/reception lint`)
- [ ] Adding a new nav route requires one edit to `navConfig.ts`; if the route also needs a CPI keyboard shortcut, one additional edit to CPI's `shortcutsOverlay`; if it needs a special section label in CPI breadcrumb, one additional edit to `sectionOverlay` (only Dashboard requires this)

## Decision Log
- 2026-03-09: Chosen Option A for useAuth dedup (remove wrappers, add permissionKey to HOC config) over Option B (keep wrappers, thread interactive prop). Rationale: cleaner architecture, no prop threading through AppModals.
- 2026-03-09: Dashboard marked sidebarOnly:true (not shown in modals). Rationale: it is the root route; modals are keyboard shortcuts for sub-pages.
- 2026-03-09: Inbox added to AppNav Operations. Rationale: route exists; omission appears unintentional based on git history pattern.
- 2026-03-09: Staff Accounts placed in Admin section (not Management). Rationale: admin function requiring elevated access; AppNav placement used as canonical.
- 2026-03-09: All icon mismatch resolutions applied (Bar→GlassWater, Check-in→UserCheck, Loans→HandCoins, Live→Activity). Rationale: semantically clearer icons chosen; trivially reversible.
- 2026-03-09: "Menu Performance" used as canonical label. Rationale: full label more readable.
- 2026-03-09: EOD Checklist label renamed from "End of Day". Rationale: label collision with Till EOD is a UX bug.

## Overall-confidence Calculation
- TASK-01: M (weight 2), confidence 90%
- TASK-02: S (weight 1), confidence 90%
- TASK-03: S (weight 1), confidence 90%
- TASK-04: S (weight 1), confidence 85%
- TASK-05: S (weight 1), confidence 85%
- TASK-06: M (weight 2), confidence 80%

Weighted: (90×2 + 90×1 + 90×1 + 85×1 + 85×1 + 80×2) / (2+1+1+1+1+2) = (180+90+90+85+85+160) / 8 = 690 / 8 = 86.25% → **Overall-confidence: 85%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create navConfig.ts | Yes — no dependencies | None | No |
| TASK-02: Migrate AppNav.tsx | Yes — TASK-01 produces navConfig.ts | Minor: `sidebarOnly` semantics must be correctly understood (AppNav shows all items; only modals filter). Documented in task acceptance. | No |
| TASK-03: Migrate 4 modal files | Yes — TASK-01 produces navConfig.ts | Minor: section label magic strings risk; mitigated by exporting SECTION_LABELS const from navConfig | No |
| TASK-04: Migrate CPI | Yes — TASK-01 produces navConfig.ts | Minor: shortcut overlay pattern adds one non-obvious merge step; documented in task execution plan | No |
| TASK-05: Remove wrappers, add permissionKey | Yes — TASK-03 migrated modal actions first; HOC signature extension is additive | Minor: `permissionKey` precedence over external `interactive` prop; documented in task notes | No |
| TASK-06: Rewrite tests | Yes — TASK-02, TASK-03, TASK-05 all complete; withIconModal mock captures new config shape | Minor: LucideIcon `.name` property used for assertions — standard JS; no library dependency. Minor: interactive-disabled test requires separate real-HOC test file (withIconModal.test.tsx) because Modals.test.tsx mocks withIconModal at module level — addressed in task acceptance criteria | No |

No Critical findings. All findings are Minor advisory items documented in task bodies.
