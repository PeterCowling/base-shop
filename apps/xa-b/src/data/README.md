# XA catalog data

`catalog.json` is the local fallback seed.

`catalog.runtime.json` is the file consumed by the app at build/runtime. `apps/xa-b/scripts/build-xa.mjs` refreshes it from the catalog contract (`XA_CATALOG_CONTRACT_BASE_URL`/`XA_CATALOG_CONTRACT_READ_URL`) before `next build`, and falls back to the local seed when the contract is unavailable.
