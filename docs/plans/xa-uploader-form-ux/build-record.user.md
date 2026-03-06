# Build Record — xa-uploader-form-ux

**Plan:** xa-uploader-form-ux
**Completed:** 2026-03-06
**Business:** XA

## What was built

Three form-level UX fixes to the xa-uploader product console:

1. **Autosave state initialisation** — `isAutosaveDirty` now starts `true`, so operators see "Unsaved" on every fresh product load instead of a false "Saved" indicator. `resetAutosaveState()` also resets to `true` so navigation events show the correct state.

2. **Save-and-advance feedback** — A new `onSavedFeedback` callback fires at the 2-second advance timer point, updating the inline feedback area with "Saved. Moving to images…" before advancing to the images step. i18n keys added in both `en` and `zh`.

3. **Delete button relocation** — The delete button moved from its isolated top-of-panel position into the action footer, left-aligned in a `justify-between` row opposite the save button. The `window.confirm` guard and `selectedSlug` conditional are preserved.

## Files changed

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- `apps/xa-uploader/src/lib/uploaderI18n.ts`
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`

## Validation

- TypeScript: clean (`pnpm --filter @apps/xa-uploader typecheck` — zero errors)
- Tests: updated in CI (new assertions for autosave init state, advance feedback message, delete footer position)

## Outcome Contract

- **Why:** xa-uploader UI review revealed three form-level UX issues creating operator confusion: false autosave "saved" on fresh load, silent step advance, delete button isolated at top with no context.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators see a truthful autosave state on fresh/new product load, receive visible feedback when save-and-advance fires, and find the delete button in the action footer where it belongs.
- **Source:** operator
