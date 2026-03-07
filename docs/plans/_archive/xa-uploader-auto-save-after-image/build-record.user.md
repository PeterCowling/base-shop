---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-auto-save-after-image
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-auto-save-after-image/build-event.json
---

# Build Record: XA Uploader Auto-Save After Image Upload

## Outcome Contract

- **Why:** When a user uploads an image via the catalog form, the form data is not auto-saved. This means the product can be in a state where images exist in R2 but the catalog entry is still "draft" with unsaved field changes. Navigating away after upload loses the draft and orphans the R2 object.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After a successful image upload, the catalog form auto-saves the current draft state so that product data and images stay in sync. No data loss on navigation after image upload.
- **Source:** operator

## What Was Built

**TASK-01: Aligned UI image roles with schema.** The `IMAGE_ROLES` array in `CatalogProductImagesFields.client.tsx` was updated from `["front", "side", "top", "detail", "lifestyle", "packaging"]` to `["front", "side", "top", "back", "detail", "interior", "scale"]`, matching the `allowedImageRoles` in `catalogAdminSchema.ts`. Updated `ROLE_I18N_KEYS` mapping and added i18n translations for both EN and ZH locales. Removed invalid `lifestyle`/`packaging` role entries. This fixes a pre-existing bug where selecting those roles caused silent validation failure on save.

**TASK-02: Added auto-save after image upload.** Added `handleSaveWithDraft(nextDraft)` to `useCatalogDraftHandlers` — a wrapper that calls `handleSaveImpl` with an explicit draft argument, bypassing React state to avoid batching staleness. Threaded `onSaveWithDraft` from `CatalogConsole` through `CatalogProductForm` to `CatalogProductImagesFields` as `onImageUploaded`. After a successful image upload, `handleUpload()` now calls `onChange(nextDraft)` then `onImageUploaded(nextDraft)`, triggering an automatic save with the updated draft including the new image reference. Validation failures (e.g. incomplete required roles for clothing products) are handled gracefully via existing feedback — no crash, no state corruption.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Clean after both tasks |
| `pnpm --filter @apps/xa-uploader lint` | Pass | 1 pre-existing warning (ds/min-tap-size), unrelated |

## Validation Evidence

### TASK-01
- `IMAGE_ROLES` matches `allowedImageRoles` exactly: 7 roles, no extras
- `ROLE_I18N_KEYS` updated: removed `lifestyle`/`packaging`, added `back`/`interior`/`scale`
- EN: `uploadImageRoleBack: "Back"`, `uploadImageRoleInterior: "Interior"`, `uploadImageRoleScale: "Scale"`
- ZH: `uploadImageRoleBack: "背面"`, `uploadImageRoleInterior: "内部"`, `uploadImageRoleScale: "比例"`
- Grep: zero references to `lifestyle`/`packaging` in xa-uploader or packages/lib/xa

### TASK-02
- `handleSaveWithDraft` added to `useCatalogConsole.client.ts` — calls `handleSaveImpl` with explicit draft
- `onSaveWithDraft` prop added to `CatalogProductForm`
- `onImageUploaded` prop added to `CatalogProductImagesFields`
- Upload success path: `onChange(nextDraft)` → `onImageUploaded(nextDraft)` — batching resolved by design
- `busyLockRef` respected via `tryBeginBusyAction` in `handleSaveImpl` (unchanged path)

## Scope Deviations

- TASK-02: `handleSaveWithDraft` placed in `useCatalogConsole.client.ts` instead of `catalogConsoleActions.ts` as originally in the Affects list. The hook file is the correct location since `handleSave` wrapper also lives there. `CatalogConsole.client.tsx` also touched to pass `handleSaveWithDraft` through.
