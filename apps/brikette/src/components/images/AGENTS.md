<!-- /src/components/images/AGENTS.md -->

# Agents – Image Management

This directory contains the Cloudflare-specific image components used across the site. Images are served through **Cloudflare Image Resizing** (the free variant), keeping payloads lean and ensuring responsive delivery.

## 1 · Cloudflare Image Resizing

- Source files live under `public/img/` and are referenced by path, never imported into JavaScript.
- At runtime the helper `buildCfImageUrl()` prefixes paths with `/cdn-cgi/image/<tokens>` when the site runs on production domains. Development and preview builds fall back to the original paths so assets load without the service.
- The `<CfImage/>` component outputs a `<picture>` element with `avif`, `webp` and `jpeg` sources. Width, quality, format and fit options map directly to Cloudflare's API tokens.
- `useResponsiveImage()` generates the `srcSet`, `sizes` and intrinsic dimensions based on presets in `src/config/imagePresets.ts`.

## 2 · Keeping the bundle small

- Images are external files served via Cloudflare rather than bundled with the JavaScript. This avoids shipping multiple resolutions in the client bundle.
- Every `<img>` tag includes explicit `width` and `height` attributes to reserve space and allow the browser to pick the optimal source.
- CI fails if a raster image exceeds **300&nbsp;kB**, if an `<img>` lacks dimensions, or if a Cloudflare URL is missing a `width` parameter (see `.github/workflows/AGENTS.md`).
- Lazy loading is enabled by default; only images marked with `priority` use `loading="eager"`.

These conventions ensure responsive images with minimal overhead while leveraging Cloudflare's free resizing layer.
