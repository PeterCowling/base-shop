# next-config — Agent Notes

## Purpose
Shared Next.js base configuration consumed by app-level `next.config.mjs` files.

## Operational Constraints
- Preserve `OUTPUT_EXPORT` behavior for static exports and `images.unoptimized`.
- Avoid importing `@acme/config` or other TS modules at import time; only read
  minimal env in `index.mjs` to prevent startup coupling.
- Keep `transpilePackages` aligned with workspace packages that ship client
  components; add new packages here before enabling them in apps.
- Do not change `output: "export"` defaults without a plan (affects Pages deploys).
- `withShopCode` must merge `env` as: base → config overrides → `SHOP_CODE`.

## Safe Change Checklist
- Update `transpilePackages` when adding new UI/client packages.
- Validate at least one app build after changes (pick the affected app).
- Keep shared defaults small; app-specific overrides belong in app configs.
