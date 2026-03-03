# XA catalog data

`catalog.json` is the local fallback seed.

`catalog.runtime.json` is the primary product catalog file consumed by the app at build/runtime.

`catalog.media.runtime.json` is the runtime media index synced from the contract payload.

`catalog.runtime.meta.json` records runtime sync metadata (`source`, `syncedAt`, optional contract `version` and `publishedAt`) so stale fallback state is visible.

`apps/xa-b/scripts/build-xa.mjs` refreshes these runtime files from the catalog contract (`XA_CATALOG_CONTRACT_BASE_URL`/`XA_CATALOG_CONTRACT_READ_URL`) before `next build`.
