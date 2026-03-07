# Build Record — XA Uploader Unified Catalog Screen

**Plan slug:** xa-uploader-unified-catalog-screen
**Build date:** 2026-03-06
**Status:** Complete

## Outcome Contract

- **Why:** Operator wants a single catalog management screen instead of separate add/edit tabs, matching standard catalog-manager UX patterns (list+detail).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CatalogConsole renders one unified product-sidebar + editor layout instead of switching between New Product and Revise Existing tabs.
- **Source:** operator

## Tasks Completed

| Task | Status | Notes |
|---|---|---|
| TASK-01 | Complete (2026-03-06) | Merged catalog screen; removed ScreenTabs; always-visible sidebar+editor |

## What Was Built

- Removed tab-based `ScreenTabs` and `ReviseScreen` components from `CatalogConsole.client.tsx`.
- Simplified `ConsoleScreen` type from `"new" | "revise" | "currency"` to `"catalog" | "currency"`.
- The `"catalog"` screen now unconditionally renders the two-column grid (product sidebar + editor form), replacing the previous pattern of switching between separate new/revise screens.
- Added a prominent "New Product" button to the `EditProductFilterSelector` sidebar header in both the empty-state and the populated filter state. Clicking it calls `handleNew()` (via `handleReset`) and resets filter criteria.
- The currency/sync header button now toggles between catalog and currency screens (previously it only opened the currency screen). Labels itself "Sync" in cloud mode.
- Removed dead i18n keys: `screenNewProduct`, `screenReviseExisting`, `screenNewHint`, `screenReviseHint`. Added `sidebarNewProduct`.

## Validation Evidence

- `pnpm --filter @apps/xa-uploader typecheck` — clean
- `pnpm --filter @apps/xa-uploader lint` — clean (0 errors, 0 warnings)
- Commit: `d5900d1dcf` — `feat(xa-uploader): unified catalog screen — remove tabs, always-visible sidebar+editor`

## Files Changed

- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`
- `apps/xa-uploader/src/lib/uploaderI18n.ts`
