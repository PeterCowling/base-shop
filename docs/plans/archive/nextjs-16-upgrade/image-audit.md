---
Type: Fact-Find-Artifact
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: nextjs-16-upgrade
---

# Next/Image Upgrade-Guide Audit (Next 16)

## Scope
Next 16 changes and deprecations that can affect `next/image` behavior, caching, and build/runtime correctness.

This artifact is used by `docs/plans/nextjs-16-upgrade/plan.md` TASK-06.

## Evidence Summary

### Config
Shared base config already pins one Next 16 default change:
- `packages/next-config/index.mjs` sets:
  - `images.unoptimized: Boolean(process.env.OUTPUT_EXPORT)`
  - `images.qualities: [75, 80, 85, 90]`

Per-app config keys:
- `apps/cms/next.config.mjs`: `images.remotePatterns: [{ protocol: "https", hostname: "**" }]`
- `apps/xa/next.config.mjs`, `apps/xa-b/next.config.mjs`, `apps/xa-j/next.config.mjs`: extend `remotePatterns` to include Cloudflare Image Delivery + Unsplash + optional env-host

No evidence found of these upgrade-guide items in config:
- `images.domains` (deprecated)
- `next/legacy/image`
- `images.minimumCacheTTL`
- `images.maximumRedirects`
- `images.dangerouslyAllowLocalIP`
- `images.imageSizes`

### Code usage patterns
- Many packages import `next/image` directly (design-system, ui, platform-core, apps).
- Explicit `quality={...}` usage exists and depends on `images.qualities` allowing values above 75:
  - `apps/brikette/src/components/rooms/FullscreenImage.tsx` uses `quality={90}`
  - `packages/ui/src/organisms/*` uses `quality={80|85}`

No evidence found of local static image paths with query strings in `<Image src="/path?..." />`.

## Upgrade-Guide Checklist

| Item | Status | Evidence | Notes |
|---|---|---|---|
| `images.domains` deprecated | Checked (clean) | grep in `apps/*/next.config.*` + `packages/next-config/*` | repo uses `remotePatterns` |
| local images with query strings require `images.localPatterns.search` | Checked (no evidence) | grep for `<Image src="/…?…"` | no matches |
| default `images.qualities` becomes `[75]` | Mitigated | `packages/next-config/index.mjs` sets `[75,80,85,90]` | required due to real `quality={90}` usage |
| `images.minimumCacheTTL` default change | Checked (no pins) | no config usage found | consider pinning only if you observe cache regressions |
| `images.maximumRedirects` default change | Checked (no pins) | no config usage found | consider pinning only if remote images rely on redirects |
| local IP optimization blocked unless `dangerouslyAllowLocalIP` | Checked (no pins) | no config usage found | no evidence of Image `src` using local IPs |
| default `images.imageSizes` change | Checked (no pins) | no config usage found | risk only if code depends on specific generated widths |

## Recommendations

### R1) Keep the shared `images.qualities` pin (already done)
This is not optional in this repo because code uses `quality={80|85|90}`. If `images.qualities` were left to Next 16 defaults (`[75]`), those call sites would be coerced or rejected depending on Next behavior.

### R2) No further config changes required right now
Based on repo evidence, there’s no current usage requiring:
- `images.domains` migration (already clean)
- `images.localPatterns.search`
- `dangerouslyAllowLocalIP`
- explicit `minimumCacheTTL` or `maximumRedirects` pinning

### R3) Watch-outs to validate during smoke testing
If you see regressions after Next 16:
- remote images intermittently failing: check redirect behavior (default `maximumRedirects=3`)
- unexpected cache behavior: consider `minimumCacheTTL`
- dev-only surprises: `OUTPUT_EXPORT` builds use `images.unoptimized` which changes runtime behavior

## Planning Output
TASK-07 (“Apply Next/Image config pinning”) should likely become a no-op unless runtime smoke tests reveal regressions. The only confirmed pin that must remain is `images.qualities`.

