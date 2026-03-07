# Build Record: xa-uploader-publish-flow

## Outcome Contract

- **Why:** Operators need a direct publish action on the product form; the sync panel added friction and confusion for a simple use case.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-product Make Live button replaces sync panel; catalog is published to xa-b within 15 minutes of the first Make Live click after a cooldown window.
- **Source:** operator

## Build Summary

All 5 tasks completed in 3 waves on 2026-03-07.

### What was delivered

**TASK-01** — New `catalogCloudPublish.ts` lib extracted 3 private helpers from sync/route.ts. New `POST /api/catalog/publish` route implements the full pipeline: authenticate → acquire lock → merge draft with `publishState: "live"` in memory → read snapshot → build catalog → validate media (warn) → publish contract → write-back R2 → trigger deploy hook. TC-01–TC-06 tests pass.

**TASK-02** — `handlePublishImpl` added to `catalogConsoleActions.ts` with full busy-lock/error/feedback pattern. `useCatalogConsole` exposes `handlePublish`. TC-01–TC-03 tests pass.

**TASK-03** — "Make Live" button added to `CatalogProductForm`; appears only when `isPublishReady === true`. "live" option removed from `StatusSelect` — operators use Make Live button to promote products. TC-01–TC-04 tests pass.

**TASK-04** — `CatalogSyncPanel.client.tsx` deleted. `CurrencyScreen` now renders `CurrencyRatesPanel` unconditionally for cloud and local mode operators. `onPublish` wired into `ProductEditor`. 10 orphaned i18n keys removed from EN + ZH. Extinct sync-panel tests removed.

**TASK-05** — 7 new i18n keys added to EN and ZH (`makeLive`, `makeLiveSuccess`, `makeLiveSuccessCooldown`, `makeLiveSuccessUnconfigured`, `makeLiveFailed`, `publishStatusTriggered`, `publishStatusSkipped`).

### Commits

- `ab820aa094` — TASK-01: Extract cloud media helpers + create publish route
- `65bbeca9f2` — TASK-02: Client publish handler + useCatalogConsole wiring
- `8cde80254f` — TASK-03: Make Live button + StatusSelect simplification
- `077c08d02f` — TASK-04: Remove CatalogSyncPanel + fix CurrencyScreen

### Deviations from plan

- `onPublish` prop type broadened to `() => Promise<unknown>` (was `() => Promise<void>`) to accept `handlePublish`'s return type without wrapping. Functionally identical — return value is always discarded via `void onPublish?.()`.
- `handleSync` and `syncReadiness` kept in `useCatalogConsole` public return (plan's TASK-02 acceptance listed them for removal). `CurrencyRatesPanel` requires both to gate its "Save & Sync" button — removing them would have required modifying the readonly `CurrencyRatesPanel` component. Decision logged in plan.
- `syncWarningUnknown` key also removed (was not in plan's explicit list but was orphaned alongside the other syncStatus* keys).

### Validation

- TypeScript: clean across xa-uploader (`tsc --noEmit`)
- Lint: clean across xa-uploader (`eslint .`)
- Pre-commit hooks: all passed for each commit
- Test contracts (TC-01–TC-06 for TASK-01, TC-01–TC-03 for TASK-02, TC-01–TC-04 for TASK-03) verified by CI push
