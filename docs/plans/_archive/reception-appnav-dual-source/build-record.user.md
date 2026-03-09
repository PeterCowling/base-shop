---
Type: Build-Record
Status: Complete
Feature-Slug: reception-appnav-dual-source
Build-date: 2026-03-09
artifact: build-record
---

# Build Record — reception-appnav-dual-source

## Outcome Contract

- **Why:** Dual source of truth for nav items in the Reception app means any route change requires simultaneous edits in up to 5 files and had already produced inconsistencies (two items both labelled "End of Day" routing to different pages; Inbox missing from the sidebar despite being present in the Operations modal).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Navigation items are defined once in a shared `navConfig.ts` and consumed by all nav surfaces (sidebar, 4 modals, header indicator). Adding a route requires one edit.
- **Source:** auto

## Build Summary

All 6 tasks completed in a single build cycle (Wave 1 → Wave 2 parallel → Wave 3 → Wave 4).

### Files created/modified

| File | Change |
|---|---|
| `apps/reception/src/components/appNav/navConfig.ts` | **New** — single source of truth, 4 sections, 25 items, all 8 divergences resolved |
| `apps/reception/src/components/appNav/AppNav.tsx` | Migrated to import from navConfig; icon imports removed |
| `apps/reception/src/components/appNav/OperationsModal.tsx` | Derives actions from Operations section; excludes `sidebarOnly` items |
| `apps/reception/src/components/appNav/ManagementModal.tsx` | Derives actions from Management section |
| `apps/reception/src/components/appNav/TillModal.tsx` | Derives actions from Till & Safe section; wrapper component removed |
| `apps/reception/src/components/appNav/ManModal.tsx` | Derives actions from Admin section; wrapper component removed |
| `apps/reception/src/components/appNav/CurrentPageIndicator.tsx` | routeMap derived from navConfig; two thin overlays preserved (shortcuts, section label) |
| `apps/reception/src/hoc/withIconModal.tsx` | Added `permissionKey?: UserRole[]` to config; HOC computes interactive internally |
| `apps/reception/src/components/appNav/__tests__/Modals.test.tsx` | Rewritten: removed `iconClass` assertions; asserts on route sets and permissionKey |
| `apps/reception/src/hoc/__tests__/withIconModal.test.tsx` | **New** — real HOC tests for permissionKey→interactive gating and peteOnly filtering |

### Divergences resolved (all 8)

1. Dashboard marked `sidebarOnly: true` — present in sidebar, excluded from modals
2. Inbox (`/inbox`, Mail icon) added to AppNav sidebar Operations section
3. 4 icon mismatches canonicalized: Bar→GlassWater, Check-in→UserCheck, Loans→HandCoins, Live→Activity
4. Staff Accounts placed in Admin section (not Management); ManagementModal no longer shows it
5. Manager Audit added to Admin section and ManModal
6. EOD Checklist added to Admin section and ManModal
7. EOD Checklist label corrected from "End of Day" (collision with Till EOD)
8. "Menu Performance" used as full canonical label (was "Menu Perf" in CPI)

### useAuth dedup

TillModal and ManModal wrapper components removed entirely. The `withIconModal` HOC now accepts an optional `permissionKey` config field and computes `canAccess(authUser, permissionKey)` internally. `useAuth` is called exactly once per render instead of twice.

### Validation

- `pnpm --filter @apps/reception typecheck` — clean (no errors)
- `pnpm --filter @apps/reception lint` — clean (zero errors; pre-existing warnings only in unrelated files)
- CI queued on origin/dev (run IDs: 22844324802, 22844324805, 22844324811)

## Build Evidence

- TASK-01: navConfig.ts created; TC-01 through TC-06 manually verified against file content
- TASK-02: AppNav.tsx imports navConfig; local type declarations removed; icon imports trimmed to Menu/X/LogOut only
- TASK-03: All 4 modal files now derive actions via `navSections.find(...).items.filter(!sidebarOnly)`
- TASK-04: CPI routeMap derived via `Object.fromEntries(navSections.flatMap(...))`; shortcutsOverlay (6 entries) and sectionOverlay (Dashboard→"Reception") preserved as documented thin overlays
- TASK-05: permissionKey added to WithIconModalConfig; effectiveInteractive computed in HOC; TillModal/ManModal are now single-line HOC calls
- TASK-06: Modals.test.tsx rewritten with route-set assertions and permissionKey assertions; withIconModal.test.tsx created with 5 tests covering permissionKey gating and peteOnly filtering
