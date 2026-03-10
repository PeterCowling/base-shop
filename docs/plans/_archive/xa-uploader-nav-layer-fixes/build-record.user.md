---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-nav-layer-fixes
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/_archive/xa-uploader-nav-layer-fixes/build-event.json
---

# Build Record: XA Uploader Navigation Layer Fixes

## Outcome Contract

- **Why:** xa-uploader UI review found that operators must navigate the brand→collection cascade to reach any product with no shortcut. The `onHeaderExtra` portal couples child screen state to parent layout and is fragile to restructuring.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deliver a plan and implementation that (1) adds a browse-all or search mode to EditProductFilterSelector so operators can see and select any product without filtering, and (2) replaces the onHeaderExtra portal with self-contained inline navigation inside CatalogConsole.
- **Source:** operator

## What Was Built

The xa-uploader sidebar now supports a direct browse-all mode with localized labels and brand/collection disambiguation, so operators no longer have to traverse the full brand-to-color cascade to reach a known product. That work was already present in the repo and is now reflected in the archived plan state.

This pass completed the remaining navigation-layer task: `CatalogConsole` now owns its own inline catalog/currency tabs and `UploaderHomeClient` no longer injects navigation into the shell header via `onHeaderExtra`. Focused UI coverage was added for the new inline tab behavior, and package validation passed.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Run on 2026-03-09 |
| `pnpm --filter @apps/xa-uploader lint` | Pass | Run on 2026-03-09 |

## Validation Evidence

- `EditProductFilterSelector.client.tsx` exposes the browse-all flow and uses the localized show-all keys already added in `uploaderI18n.ts`.
- `CatalogConsole.client.tsx` no longer accepts `onHeaderExtra` and renders inline `console-tab-catalog` / `console-tab-currency` controls.
- `UploaderHome.client.tsx` no longer manages `headerExtra` state for catalog navigation.
- `CatalogConsole.test.tsx` covers tab rendering, screen switching, and non-internal suppression.

## Scope Deviations

None. The build stayed within the original two navigation-layer fixes and the validation gate.
