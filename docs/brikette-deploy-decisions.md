# Brikette Deploy Decisions

> **IMPORTANT**: Read this before ANY brikette deploy change. Referenced by `/deploy-brikette` skill.

## Current State (2026-02-06)

Brikette has **two deploy targets** with different build strategies:

| | Staging | Production |
|---|---|---|
| **Tier** | Cloudflare Pages (free) | Cloudflare Workers (paid, $5/mo) |
| **Build** | `output: 'export'` → static HTML in `out/` | `@opennextjs/cloudflare` → Worker in `.open-next/` |
| **Deploy** | `wrangler pages deploy out` | `wrangler deploy` |
| **URL** | `staging.brikette-website.pages.dev` | `www.hostel-positano.com` |
| **Env var** | `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1` | _(none)_ |

### What Works on Staging (static export)

- All pre-rendered pages (4098 pages across 18 locales)
- Client-side JS hydration and interactivity
- Static assets (`/_next/static/*`, `/img/*`)
- Images served directly from `public/img/` (no resizing)

### What Does NOT Work on Staging

- **Middleware** — i18n slug rewrites (e.g. `/fr/chambres` → `/fr/rooms`) don't run
- **API routes** — 7 guide authoring/validation endpoints unavailable
- **Server-side rendering** — draft preview/edit pages don't render
- **ISR** — no incremental static regeneration
- **Image Resizing** — `/cdn-cgi/image/` not available on free tier; images served unoptimised
- **Root URL** — `/` doesn't redirect; use `/en/` directly (handled by `_redirects` file)

---

## Static Export Build: How It Works

The staging build uses Next.js `output: 'export'` mode, controlled by the `OUTPUT_EXPORT` env var. The shared config at `packages/next-config/index.mjs` reads this and sets `output: "export"` + `images.unoptimized: true`.

### Route Hiding During Build

Several route types are incompatible with `output: 'export'` and must be **physically moved aside** before the build:

```
apps/brikette/
  src/app/
    api/              → _api-off       (route handlers in dynamic segments)
    [lang]/
      draft/          → _draft-off     (fs reads, SSR-only pages)
      guides/[...slug] → guides/_slug-off  (catch-all with no params)
```

The build command in `brikette.yml` does:
```bash
mv src/app/api src/app/_api-off &&
mv "src/app/[lang]/draft" "src/app/[lang]/_draft-off" &&
mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off" &&
(OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build; e=$?;
 mv src/app/_api-off src/app/api;
 mv "src/app/[lang]/_draft-off" "src/app/[lang]/draft";
 mv "src/app/[lang]/guides/_slug-off" "src/app/[lang]/guides/[...slug]";
 exit $e)
```

The subshell `(cmd; e=$?; restore; exit $e)` pattern ensures directories are restored even if the build fails.

### Image Resizing Bypass

Cloudflare Image Resizing (`/cdn-cgi/image/...`) requires a paid plan or custom domain. On staging, `buildCfImageUrl()` in `packages/ui/src/lib/buildCfImageUrl.ts` detects `NEXT_PUBLIC_OUTPUT_EXPORT=1` and returns raw `/img/...` paths instead.

### Redirects

Since middleware doesn't run on static Pages, `apps/brikette/public/_redirects` provides edge-level redirects:
- `/` → `/en/` (302)
- `/api/health` → `/en/` (302)

---

## Next.js Static Export Gotchas

These are hard-won lessons from getting `output: 'export'` working. **Do not remove these notes.**

### 1. Catch-all routes (`[...slug]`) don't work with `generateStaticParams`

Even when `generateStaticParams()` is exported and returns `[]`, Next.js errors with:
> Page "/[lang]/guides/[...slug]" is missing "generateStaticParams()"

**Workaround**: Physically move the directory out of `src/app/` before the build.

### 2. Route handlers in dynamic segments don't support `generateStaticParams`

`route.ts` files inside `[param]` directories (e.g. `api/guides/[guideKey]/route.ts`) cannot use `generateStaticParams` with `output: 'export'`. Next.js errors the same way.

**Workaround**: Move the entire `api/` directory aside during the build.

### 3. Config exports cannot use conditional expressions

```typescript
// BREAKS — Next.js static analysis fails
export const dynamic = process.env.OUTPUT_EXPORT ? "force-static" : undefined;
// Error: Unsupported node type "ConditionalExpression" at "dynamic"

// WORKS — plain string literal
export const dynamic = "force-static";
```

Next.js does static analysis of config exports (like `dynamic`, `revalidate`) at build time and cannot evaluate ternaries, function calls, or any non-literal expressions. Routes hidden during build don't need these guards at all.

### 4. Middleware produces warnings but doesn't error

The middleware file isn't deleted; it just doesn't execute on static Pages. Next.js emits a warning during export but doesn't fail.

### 5. `generateStaticParams` must be `async`

Some versions of Next.js don't detect synchronous `generateStaticParams` during static export. Always use `export async function generateStaticParams()`.

---

## CI Pipeline Details

### Workflow: `.github/workflows/brikette.yml`

Triggers: push to `main`/`staging` (with path filters), PRs, manual dispatch.

**Staging job**: Always runs. Uses `reusable-app.yml` with:
- `build-cmd`: Turbo builds deps → hide incompatible routes → `OUTPUT_EXPORT=1 next build` → restore
- `artifact-path`: `apps/brikette/out`
- `deploy-cmd`: `wrangler pages deploy out --project-name brikette-website --branch staging`
- Health check runs against staging URL
- Cache headers check **skipped** (only runs for production — static Pages can't set custom headers)

**Production job**: Manual dispatch only (`publish_to_production: true`, `main` branch). Uses:
- `build-cmd`: Turbo builds deps → `opennextjs-cloudflare build`
- `artifact-path`: `apps/brikette/.open-next`
- `deploy-cmd`: `wrangler deploy`

### Post-Deploy Checks

| Check | Staging | Production |
|---|---|---|
| Health check | Yes (via `--staging` flag) | Yes |
| Cache headers | Skipped | Yes |

### Test Skipping (TEMPORARY)

Tests are currently skipped on the `staging` branch via `if: github.ref != 'refs/heads/staging'` in `reusable-app.yml`. This is a temporary measure — remove once tests are stabilised.

---

## Upgrade Path: Workers Paid Plan ($5/month)

Upgrading to Cloudflare Workers Paid unlocks the full Worker deploy for staging:

| Feature | Static (current) | Worker (paid) |
|---|---|---|
| Pre-rendered pages | Yes | Yes |
| Middleware (i18n rewrites) | No | Yes |
| API routes | No | Yes |
| Server-side rendering | No | Yes |
| Draft/preview pages | No | Yes |
| ISR | No | Yes |
| Image Resizing | No | Yes |
| Compressed size limit | N/A | 10 MiB |

### How to Upgrade

1. Go to: `https://dash.cloudflare.com/<account-id>/workers/plans`
2. Select "Workers Paid" ($5/month)
3. In `brikette.yml`, change the staging job to use the same build/deploy as production:
   - Remove the route-hiding `mv` commands from `build-cmd`
   - Change `build-cmd` to use `opennextjs-cloudflare build`
   - Change `artifact-path` to `apps/brikette/.open-next`
   - Change `deploy-cmd` to `wrangler deploy`
   - Re-enable cache headers check
4. Remove `OUTPUT_EXPORT` and `NEXT_PUBLIC_OUTPUT_EXPORT` from the build command
5. Remove `_redirects` file entries (middleware will handle redirects)

---

## Architecture Notes

- **Adapter**: `@opennextjs/cloudflare` (replaces deprecated `@cloudflare/next-on-pages`)
- **Production build output**: `.open-next/worker.js` (Worker entry) + `.open-next/assets/` (static files)
- **Staging build output**: `out/` directory (plain HTML/CSS/JS)
- **Guide content JSON**: Loaded via `fs.readFileSync` at build time (NOT bundled into Worker) to keep handler under 64 MiB
- **`@cloudflare/next-on-pages` removed**: It pulls esbuild 0.15.18 which conflicts with OpenNext's esbuild >=0.16.10 requirement

## Size Budget (Production Worker)

| Component | Uncompressed | Compressed (est.) |
|---|---|---|
| handler.mjs | 24 MiB | ~6 MiB |
| middleware/handler.mjs | 2.3 MiB | ~0.5 MiB |
| Free plan limit | 64 MiB | 3 MiB |
| **Paid plan limit** | **64 MiB** | **10 MiB** |

## Key Files

- `.github/workflows/brikette.yml` — CI/CD workflow (staging + production)
- `.github/workflows/reusable-app.yml` — Shared workflow template
- `packages/next-config/index.mjs` — Shared Next.js config (reads `OUTPUT_EXPORT`)
- `packages/ui/src/lib/buildCfImageUrl.ts` — Image URL builder (reads `NEXT_PUBLIC_OUTPUT_EXPORT`)
- `apps/brikette/wrangler.toml` — Cloudflare Worker config (production only)
- `apps/brikette/open-next.config.ts` — OpenNext adapter config (production only)
- `apps/brikette/public/_redirects` — Edge redirects for static deploy
- `scripts/post-deploy-health-check.sh` — Post-deploy verification
- `scripts/post-deploy-brikette-cache-check.sh` — Cache header verification (production only)
