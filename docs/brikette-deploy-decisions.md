# Brikette Deploy Decisions

> **IMPORTANT**: Read this before ANY brikette deploy change. Referenced by `/deploy-brikette` skill.

## Current State (2026-02-06)

Brikette deploys as **static assets to Cloudflare Pages** (free tier).
The OpenNext build produces `.open-next/assets/` which is deployed via `wrangler pages deploy`.

### What Works
- All pre-rendered pages (4098 pages across 18 locales)
- Client-side JS hydration and interactivity
- Static asset caching (`/_next/static/*`, `/img/*`)

### What Does NOT Work (without Worker)
- **Middleware** — i18n slug rewrites (e.g. `/fr/chambres` → `/fr/rooms`) don't run
- **API routes** — 7 guide authoring/validation endpoints are unavailable
- **Server-side rendering** — dynamic routes (`draft/*`) don't render
- **ISR** — no incremental static regeneration

---

## Upgrade Path: Workers Paid Plan ($5/month)

Upgrading to **Cloudflare Workers Paid** ($5/month) enables deploying the full Worker (`wrangler deploy` instead of `wrangler pages deploy`), which unlocks:

| Feature | Static (current) | Worker (paid) |
|---|---|---|
| Pre-rendered pages | Yes | Yes |
| Middleware (i18n rewrites) | No | Yes |
| API routes | No | Yes |
| Server-side rendering | No | Yes |
| Draft/preview pages | No | Yes |
| ISR | No | Yes |
| Compressed size limit | N/A | 10 MiB |

### How to Upgrade
1. Go to: `https://dash.cloudflare.com/<account-id>/workers/plans`
2. Select "Workers Paid" ($5/month)
3. In `brikette.yml`, change the deploy-cmd from:
   ```yaml
   deploy-cmd: >
     cd apps/brikette &&
     pnpm exec wrangler pages deploy .open-next/assets
     --project-name brikette-website --branch staging
   ```
   to:
   ```yaml
   deploy-cmd: >
     cd apps/brikette &&
     pnpm exec wrangler deploy
   ```
4. Update `wrangler.toml` worker name as needed for staging/production

---

## Architecture Notes

- **Adapter**: `@opennextjs/cloudflare` (replaces deprecated `@cloudflare/next-on-pages`)
- **Build output**: `.open-next/worker.js` (Worker entry, 24 MiB) + `.open-next/assets/` (static files)
- **Guide content JSON**: Loaded via `fs.readFileSync` at build time (NOT bundled into Worker) to keep handler under 64 MiB
- **`@cloudflare/next-on-pages` removed**: It pulls esbuild 0.15.18 which conflicts with OpenNext's esbuild >=0.16.10 requirement
- **`public/_headers`**: Minimal (2 rules). Full headers in `config/_headers`, applied by Next.js `headers()` function

## Size Budget

| Component | Uncompressed | Compressed (est.) |
|---|---|---|
| handler.mjs | 24 MiB | ~6 MiB |
| middleware/handler.mjs | 2.3 MiB | ~0.5 MiB |
| Free plan limit | 64 MiB | 3 MiB |
| **Paid plan limit** | **64 MiB** | **10 MiB** |

The handler fits under the uncompressed limit but exceeds the free compressed limit.
