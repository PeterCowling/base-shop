# Brikette Deploy Decisions

> **IMPORTANT**: Read this before ANY brikette deploy change. Referenced by `/ops-deploy` skill.

## Current State (2026-03-07)

Brikette has **two deploy targets** on the same Cloudflare Pages delivery model:

| | Staging | Production |
|---|---|---|
| **Tier** | Cloudflare Pages | Cloudflare Pages |
| **Build** | `output: 'export'` → static HTML in `out/` | `output: 'export'` → static HTML in `out/` |
| **Deploy** | `wrangler pages deploy out --branch staging` | `wrangler pages deploy out --branch main` |
| **URL** | `staging.brikette-website.pages.dev` | `www.hostel-positano.com` |
| **Env vars** | `OUTPUT_EXPORT=1`, `NEXT_PUBLIC_OUTPUT_EXPORT=1` | `OUTPUT_EXPORT=1`, `NEXT_PUBLIC_OUTPUT_EXPORT=1`, `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` |

Production also ships Cloudflare Pages Functions:
- `functions/api/availability.js` for live availability
- `functions/[[path]].js` for exact historical legacy-path redirects scoped by `public/_routes.json`

That means live availability and the curated high-cardinality legacy redirect contract remain available even though the Next.js `src/app/api` directory is hidden during the static export build.

### What Works On The Current Pages Deploy

- All pre-rendered pages (4098 pages across 18 locales)
- Client-side JS hydration and interactivity
- Static assets (`/_next/static/*`, `/img/*`)
- Images served directly from `public/img/` (no resizing)
- Cloudflare Pages structural routing from `apps/brikette/public/_redirects`
- Cloudflare Pages exact legacy redirects via `functions/[[path]].js` + `functions/generated/legacy-redirects.js`
- Pages Function scoping via `apps/brikette/public/_routes.json`
- Production-only live availability via `functions/api/availability.js`

### What Does NOT Work In The Static Export Runtime

- **Middleware** — i18n slug rewrites (e.g. `/fr/chambres` → `/fr/rooms`) don't run
- **API routes** — 7 guide authoring/validation endpoints unavailable
- **Server-side rendering** — draft preview/edit pages don't render
- **ISR** — no incremental static regeneration
- **Image Resizing** — `/cdn-cgi/image/` not available on free tier; images served unoptimised
- **Next.js `src/app/api/*` routes** — hidden during build; only explicit Cloudflare Pages Functions survive deploy

---

## Static Export Build: How It Works

The staging build uses Next.js `output: 'export'` mode, controlled by the `OUTPUT_EXPORT` env var. The shared config at `packages/next-config/index.mjs` reads this and sets `output: "export"` + `images.unoptimized: true`.

### Route Hiding During Build

Several route types are incompatible with `output: 'export'` and must be **physically moved aside** before the build:

```
apps/brikette/
  src/app/
    api/                → .tmp/app-api-off            (route handlers in dynamic segments)
    [lang]/
      guides/[...slug]  → guides/_slug-off            (catch-all route)
      guides/[slug]     → guides/_single-off          (single guide route)
      help/[slug]       → help/_slug-off              (single help article route)
```

The build command in `brikette.yml` does:
```bash
mkdir -p ".tmp" &&
[ -d "src/app/[lang]/guides/[...slug]" ] && mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off" || true &&
[ -d "src/app/[lang]/guides/[slug]" ] && mv "src/app/[lang]/guides/[slug]" "src/app/[lang]/guides/_single-off" || true &&
[ -d "src/app/[lang]/help/[slug]" ] && mv "src/app/[lang]/help/[slug]" "src/app/[lang]/help/_slug-off" || true &&
[ -d "src/app/api" ] && mv "src/app/api" ".tmp/app-api-off" || true &&
(OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build; e=$?;
 [ -d ".tmp/app-api-off" ] && mv ".tmp/app-api-off" "src/app/api" || true;
 [ -d "src/app/[lang]/guides/_slug-off" ] && mv "src/app/[lang]/guides/_slug-off" "src/app/[lang]/guides/[...slug]" || true;
 [ -d "src/app/[lang]/guides/_single-off" ] && mv "src/app/[lang]/guides/_single-off" "src/app/[lang]/guides/[slug]" || true;
 [ -d "src/app/[lang]/help/_slug-off" ] && mv "src/app/[lang]/help/_slug-off" "src/app/[lang]/help/[slug]" || true;
 exit $e)
```

The subshell `(cmd; e=$?; restore; exit $e)` pattern ensures directories are restored even if the build fails.

### Image Resizing Bypass

Cloudflare Image Resizing (`/cdn-cgi/image/...`) requires a paid plan or custom domain. On staging, `buildCfImageUrl()` in `packages/ui/src/lib/buildCfImageUrl.ts` detects `NEXT_PUBLIC_OUTPUT_EXPORT=1` and returns raw `/img/...` paths instead.

### Redirects And Localized Canonical Routes

Since middleware doesn't run on static Pages, the deployed edge routing contract is split:
- `apps/brikette/public/_redirects`
  - small structural redirects only
  - root and health redirects
  - stable global entrypoints and typo corrections
  - low-cardinality route-family redirects such as `/directions/:slug`
- `apps/brikette/functions/[[path]].js` + `apps/brikette/functions/generated/legacy-redirects.js`
  - exact historical redirect map for supported legacy URLs from `apps/brikette/src/test/fixtures/legacy-urls.txt`
- `apps/brikette/public/_routes.json`
  - constrains the legacy-path function to route families that need it

This is intentional. Pages `_redirects` is no longer allowed to mirror every mechanically derivable alias because that exceeded Cloudflare Pages limits and preserved synthetic wrong-locale URLs the business does not want.

For rollout-critical funnel checks, the canonical booking surfaces are currently:
- `/it/prenota`
- `/it/prenota-alloggi-privati`

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

### 6. Next.js 16 emits `__next.*` metadata files — delete before deploying

Next.js 16 writes `__next._tree.txt`, `__next._head.txt`, `__next.__PAGE__.txt` and similar files alongside every route directory. A full Brikette export produces ~33k of these files. Brikette is on a paid Pages plan, but deploys still behave like the old 20k-file cap until the Pages project has `PAGES_WRANGLER_MAJOR_VERSION=4` enabled. Until that setting is confirmed, strip the metadata files before deploy.

**Always run after `next build` and before `wrangler pages deploy`:**

```bash
find out -name "__next.*" -type f -delete
```

---

## Direct Wrangler Deploy (Bypass Git Flow)

Use when `ship-to-staging.sh` / `promote-to-main.sh` is blocked (e.g. dirty working tree from uncommitted changes in other apps/packages) or you need to ship immediately without a PR.

Run from `apps/brikette/`:

```bash
# 1. Build package dependencies (fast if already cached)
pnpm exec turbo run build --filter=@apps/brikette^...

# 2. Fetch the GA measurement ID from repo variables
GA_ID=$(gh variable list | grep NEXT_PUBLIC_GA_MEASUREMENT_ID | awk '{print $2}')

# 3. Static export build with the same normalization steps used in CI
mkdir -p ".tmp"
[ -d "src/app/[lang]/guides/[...slug]" ] && mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off" || true
[ -d "src/app/[lang]/guides/[slug]" ] && mv "src/app/[lang]/guides/[slug]" "src/app/[lang]/guides/_single-off" || true
[ -d "src/app/[lang]/help/[slug]" ] && mv "src/app/[lang]/help/[slug]" "src/app/[lang]/help/_slug-off" || true
[ -d "src/app/api" ] && mv "src/app/api" ".tmp/app-api-off" || true
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 NEXT_PUBLIC_GA_MEASUREMENT_ID="$GA_ID" pnpm build
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm --filter @apps/brikette normalize:localized-routes
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm --filter @apps/brikette generate:static-redirects
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm --filter @apps/brikette verify:sitemap-contract -- --file out/sitemap.xml

# 4. REQUIRED — strip Next.js 16 metadata bloat
#    Next.js 16 emits ~33k __next.* txt files per route build.
#    Brikette no longer targets Pages free tier, but deploys still need this cleanup
#    until the Pages project has `PAGES_WRANGLER_MAJOR_VERSION=4` enabled.
find out -name "__next.*" -type f -delete

# 5. Restore hidden routes
[ -d ".tmp/app-api-off" ] && mv ".tmp/app-api-off" "src/app/api" || true
[ -d "src/app/[lang]/guides/_slug-off" ] && mv "src/app/[lang]/guides/_slug-off" "src/app/[lang]/guides/[...slug]" || true
[ -d "src/app/[lang]/guides/_single-off" ] && mv "src/app/[lang]/guides/_single-off" "src/app/[lang]/guides/[slug]" || true
[ -d "src/app/[lang]/help/_slug-off" ] && mv "src/app/[lang]/help/_slug-off" "src/app/[lang]/help/[slug]" || true

# 6. Deploy
pnpm exec wrangler pages deploy out --project-name brikette-website --branch main --commit-dirty=true
```

For staging, swap `--branch main` → `--branch staging`.

**Auth**: `wrangler` can use either a valid OAuth login or `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from `.env.local`. Confirm before deploying with either:

```bash
pnpm exec wrangler whoami
```

or

```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

**Build lifecycle**: use `pnpm build`, not raw `pnpm exec next build`. Brikette’s prebuild lifecycle generates the canonical SEO assets that must be copied into `out/` for Pages deploys.

**Route hiding**: do not skip the route-hide / restore sequence. The current CI path hides `src/app/api`, `src/app/[lang]/guides/[...slug]`, `src/app/[lang]/guides/[slug]`, and `src/app/[lang]/help/[slug]` before the export build, then restores them after normalization and redirect generation.

---

## CI Pipeline Details

### Workflow: `.github/workflows/brikette.yml`

Triggers: push to `main`/`staging` (with path filters), PRs, manual dispatch.

**Staging job**: Always runs. Uses `reusable-app.yml` with:
- `build-cmd`: Turbo builds deps → hide incompatible routes → `OUTPUT_EXPORT=1 next build` → restore
- `artifact-path`: `apps/brikette/out`
- `deploy-cmd`: `wrangler pages deploy out --project-name brikette-website --branch staging`
- Health check runs against staging URL and requires canonical localized booking routes to return `200` (`/it/prenota`, `/it/prenota-alloggi-privati`)
- Cache headers check **skipped** (only runs for production — static Pages can't set custom headers)

**Production job**: Manual dispatch only (`publish_to_production: true`, `main` branch). Uses:
- `build-cmd`: same static export + route-hide + localized-route normalization + redirect generation flow as staging
- `artifact-path`: `apps/brikette/out`
- `deploy-cmd`: `wrangler pages deploy out --project-name brikette-website --branch main`
- Health check runs against `https://www.hostel-positano.com`, verifies `/api/health`, `/api/availability`, and requires `/it/prenota` plus `/it/prenota-alloggi-privati` to return direct `200`

### Post-Deploy Checks

| Check | Staging | Production |
|---|---|---|
| Health check | Yes (via `--staging` flag) | Yes |
| Cache headers | Skipped | Yes |

### Test Skipping (TEMPORARY)

Tests are currently skipped on the `staging` branch via `if: github.ref != 'refs/heads/staging'` in `reusable-app.yml`. This is a temporary measure — remove once tests are stabilised.

---

## Upgrade Path: Worker Runtime (future option)

If Brikette moves back to a Worker runtime later, the main gain is middleware/SSR parity instead of static-export workarounds:

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
3. In `brikette.yml`, replace the current static export build/deploy path:
   - Remove the route-hiding `mv` commands from `build-cmd`
   - Change `build-cmd` to use `opennextjs-cloudflare build`
   - Change `artifact-path` to `apps/brikette/.open-next`
   - Change `deploy-cmd` to `wrangler deploy`
   - Re-enable cache headers check
4. Remove `OUTPUT_EXPORT` and `NEXT_PUBLIC_OUTPUT_EXPORT` from the build command
5. Remove `_redirects` file entries (middleware will handle redirects)

---

## Architecture Notes

- **Current deploy artifact**: `apps/brikette/out` for both staging and production
- **Current edge routing contract**: `apps/brikette/public/_redirects`
- **Current production dynamic surface**: `apps/brikette/functions/api/availability.js`
- **Localized static export normalization**: `apps/brikette/scripts/normalize-static-export-localized-routes.ts`
- **Redirect generation**: `apps/brikette/scripts/generate-static-export-redirects.ts`
- **`@opennextjs/cloudflare`** remains in the repo as a future option, but it is not the active production deploy path today.

## Key Files

- `.github/workflows/brikette.yml` — CI/CD workflow (staging + production)
- `.github/workflows/reusable-app.yml` — Shared workflow template
- `packages/next-config/index.mjs` — Shared Next.js config (reads `OUTPUT_EXPORT`)
- `packages/ui/src/lib/buildCfImageUrl.ts` — Image URL builder (reads `NEXT_PUBLIC_OUTPUT_EXPORT`)
- `apps/brikette/public/_redirects` — Edge redirects / rewrites for static deploy
- `apps/brikette/functions/api/availability.js` — Production Pages Function for live availability
- `apps/brikette/wrangler.toml` — legacy Worker config kept for reference
- `apps/brikette/open-next.config.ts` — inactive OpenNext adapter config kept for future Worker runtime work
- `scripts/post-deploy-health-check.sh` — Post-deploy verification
