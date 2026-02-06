---
name: deploy-brikette
description: Deploy brikette to staging or production with pre-flight checks and decision awareness.
---

# Deploy Brikette

Deploy the brikette app to Cloudflare with mandatory pre-flight checks.

## MANDATORY: Read Decision Doc First

Before ANY deploy action, read `docs/brikette-deploy-decisions.md`. This contains:
- Current deploy architecture (static Pages vs Worker)
- Upgrade path to Workers Paid ($5/month) and what it unlocks
- Size budget constraints
- Known limitations of the current static deploy

**Summarise the key limitations to the user before proceeding.**

## Pre-Flight Checklist

1. **Branch check** — Confirm which branch to deploy (staging or main)
2. **Decision doc** — Read and summarise `docs/brikette-deploy-decisions.md`
3. **Pending changes** — Check `git status` for uncommitted work
4. **Tests** — Run `pnpm --filter @apps/brikette test` (or confirm CI will run them)
5. **Typecheck** — Run `pnpm --filter @apps/brikette typecheck` (or confirm CI will run it)

## Deploy to Staging

```bash
# Push to staging branch (CI handles build + deploy)
git push origin <branch>:staging
```

CI workflow: `.github/workflows/brikette.yml` → `reusable-app.yml`

**Current deploy target**: Cloudflare Pages (static assets only, free tier)
**URL**: `https://staging.brikette-website.pages.dev`

### Post-Deploy Verification
- Check `https://staging.brikette-website.pages.dev/en/` (note: root `/` returns 404 without middleware)
- Verify key pages: `/en/rooms`, `/en/guides`, a guide detail page
- Note: localized slugs (e.g. `/fr/chambres`) do NOT work without the Worker

## Deploy to Production

Production deploy requires `workflow_dispatch` with `publish_to_production: true` on the `main` branch.

**WARNING**: Ensure the staging deploy has been verified first.

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Worker exceeds 3 MiB | Free plan limit | Upgrade to paid ($5/mo) or deploy static assets only |
| Worker exceeds 64 MiB | Guide JSON bundled | Ensure `locale-loader.guides.ts` uses `fs.readFileSync` |
| `_headers` exceeds 100 rules | Too many header rules | Keep `public/_headers` minimal; full rules in `config/_headers` |
| esbuild "Invalid alias name" | Old esbuild from `@cloudflare/next-on-pages` | Remove `@cloudflare/next-on-pages` from all `package.json` files |
| Upload artifact empty | `.open-next` starts with dot | Ensure `include-hidden-files: true` in upload-artifact step |
| Health check 404 on root | No middleware on static deploy | Check `/en/` instead of `/` |

## Key Files

- `.github/workflows/brikette.yml` — CI/CD workflow
- `apps/brikette/wrangler.toml` — Cloudflare config
- `apps/brikette/open-next.config.ts` — OpenNext adapter config
- `docs/brikette-deploy-decisions.md` — Architecture decisions and upgrade path
