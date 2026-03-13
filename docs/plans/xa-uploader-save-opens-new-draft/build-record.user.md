# Build Record - xa-uploader-save-opens-new-draft

## Outcome Contract
- **Why:** Operators saving one product at a time should land on a fresh draft for the next item instead of being left in the product they just completed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After a successful manual save in XA uploader, the editor shows the saved confirmation state briefly and then opens a fresh draft via `handleNew()`, unless the operator has already changed context.
- **Source:** operator

## Delivered
- Manual save now transitions to a blank new draft after the existing short saved-state delay.
- The transition reuses the existing `handleNew()` path instead of introducing a parallel reset path.
- If the operator changes product context during the saved-state delay, the delayed reset is cancelled.
- Image autosave behavior is unchanged.

## Validation
- `pnpm --filter @apps/xa-uploader typecheck` -> pass
- `pnpm --filter @apps/xa-uploader lint` -> pass with 3 pre-existing warnings:
  - `apps/xa-uploader/src/app/UploaderShell.client.tsx` `ds/min-tap-size`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` `ds/no-hardcoded-copy`
  - `apps/xa-uploader/src/lib/uploaderAuth.ts` `ds/no-hardcoded-copy`

## Notes
- Jest tests were updated but not run locally because repo policy routes test execution to CI.
