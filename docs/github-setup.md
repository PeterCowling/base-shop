# GitHub Repository Setup

How to configure GitHub secrets, variables, environments, and branch protection for Base-Shop.

For application-level environment variables, see [`.env.reference.md`](.env.reference.md).
For SOPS encryption workflow, see [`secrets.md`](secrets.md).

---

## Repository Secrets

Secrets are encrypted values available to GitHub Actions workflows. Set them in **Settings > Secrets and variables > Actions > Repository secrets**.

### Required for CI

| Secret | Purpose | Used by |
|--------|---------|---------|
| `TURBO_TOKEN` | Vercel Turborepo remote cache authentication | All workflows (via `setup-repo` action) |

### Required for Deployment

| Secret | Purpose | Used by |
|--------|---------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API authentication (Pages, Workers, D1, R2, KV) | `ci.yml`, `cms.yml`, `reusable-app.yml`, `business-os-deploy.yml`, `xa.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | Same as above |
| `SOPS_AGE_KEY` | Age private key for decrypting `.env.*.sops` files before deploy | `ci.yml`, `cms.yml`, `reusable-app.yml` |

### Application Runtime Secrets

These are passed to deployment steps for environment validation and runtime configuration.

| Secret | Purpose | Used by |
|--------|---------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js session encryption | `reusable-app.yml` (apps using NextAuth) |
| `SESSION_SECRET` | Session cookie signing | `reusable-app.yml` |
| `CART_COOKIE_SECRET` | Shopping cart cookie encryption | `reusable-app.yml` (e-commerce apps) |

### Firebase Configuration (Build-Time)

These are public Firebase SDK config values, stored as secrets to keep them out of the codebase.

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket name |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |

Used by `ci.yml` build step for the Prime app.

### Optional / Feature-Specific

| Secret | Purpose | Notes |
|--------|---------|-------|
| `BOS_EXPORT_API_KEY` | Business OS D1 export API authentication | Used by `bos-export.yml` |
| `LHCI_USERNAME` | Lighthouse CI basic auth username | Used by `ci-lighthouse.yml` |
| `LHCI_PASSWORD` | Lighthouse CI basic auth password | Used by `ci-lighthouse.yml` |
| `CHROMATIC_PROJECT_TOKEN` | Chromatic visual regression testing | Used by `storybook.yml`; skipped if not set |

---

## Repository Variables

Variables are non-encrypted configuration values. Set them in **Settings > Secrets and variables > Actions > Repository variables**.

| Variable | Purpose | Default | Used by |
|----------|---------|---------|---------|
| `TURBO_TEAM` | Turborepo team slug for remote cache | — | All workflows (via `setup-repo` action) |
| `BRIKETTE_PAGES_PROJECT` | Cloudflare Pages project name for Brikette | `brikette-website` | `brikette.yml` |
| `XA_STAGING_PROJECT` | Cloudflare Workers project name for XA | `xa-site` | `xa.yml` |
| `CF_ACCOUNT_SUBDOMAIN` | Cloudflare account subdomain for Workers URLs | `peter-cowling1976` | `xa.yml` |
| `BOS_EXPORT_API_BASE_URL` | Business OS export API endpoint | — | `bos-export.yml` |
| `BOS_AGENT_API_BASE_URL` | Business OS agent API endpoint | — | `bos-export.yml` |

---

## Environments

GitHub Environments provide deployment URLs and optional protection rules. Configure in **Settings > Environments**.

### production

- **Used by:** brikette, business-os, cms, prime, product-pipeline, skylar (via `ci.yml` or app-specific workflows)
- **Triggers:** Push to `main` branch (auto-deploy after CI passes)
- **Exception:** Brikette production requires manual `workflow_dispatch` with `publish_to_production: true`

### staging

- **Used by:** cms, prime, product-pipeline, skylar
- **Triggers:** Push to `staging` branch (auto-deploy)

### staging-pages

- **Used by:** brikette (static export to Cloudflare Pages free tier)
- **Triggers:** Push to `main` or `staging` branch

### xa-staging

- **Used by:** xa (stealth staging via Cloudflare Workers)
- **Triggers:** Push to `staging` branch only

---

## App Deployment Summary

| App | Workflow | Cloudflare Target | Method | Staging URL | Production URL |
|-----|----------|--------------------|--------|-------------|----------------|
| base-shop | `ci.yml` | `base-shop` (Pages) | next-on-pages | staging.base-shop.pages.dev | — |
| brikette | `brikette.yml` | `brikette-website` (Pages) | Static export | staging.brikette-website.pages.dev | www.hostel-positano.com |
| business-os | `business-os-deploy.yml` | `business-os` (Worker) | OpenNext | — | business-os.peter-cowling1976.workers.dev |
| cms | `cms.yml` | `cms` (Pages) | next-on-pages | staging.cms.pages.dev | cms.pages.dev |
| prime | `prime.yml` | `prime` (Pages) | Static + Functions | staging.prime.pages.dev | prime.pages.dev |
| product-pipeline | `product-pipeline.yml` | `product-pipeline` (Pages) | Static export | staging.product-pipeline.pages.dev | product-pipeline.pages.dev |
| reception | `reception.yml` | — | **None (CI only)** | — | — |
| skylar | `skylar.yml` | `skylar` (Pages) | Static export | staging.skylar.pages.dev | skylar.pages.dev |
| xa | `xa.yml` | `xa-site` (Worker) | OpenNext | xa-site.peter-cowling1976.workers.dev | — |

---

## Branch Protection

### CODEOWNERS

`.github/CODEOWNERS` requires `@petercowling` review for:
- Agent instructions: `AGENTS.md`, `CLAUDE.md`, `CODEX.md`
- Workflow files: `.github/workflows/**`
- Skill definitions: `.claude/SKILLS_INDEX.md`, `.claude/prompts/README.md`

CODEOWNERS enforcement requires a GitHub Ruleset with "Require code owner review" enabled (**Settings > Rules > Rulesets**).

### Dependabot

`.github/dependabot.yml` is configured for:
- **npm** dependencies: weekly (Mondays 09:00 UTC), minor/patch grouped
- **GitHub Actions**: weekly (Mondays 09:00 UTC)

---

## New Repository Setup Checklist

Use this checklist when setting up a fresh clone or fork.

### 1. Repository Secrets

- [ ] `CLOUDFLARE_API_TOKEN` — generate from Cloudflare dashboard with Pages/Workers/D1/R2/KV edit permissions
- [ ] `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard overview
- [ ] `TURBO_TOKEN` — generate from Vercel dashboard (Turborepo remote cache)
- [ ] `SOPS_AGE_KEY` — age private key for SOPS decryption (see [`secrets.md`](secrets.md))
- [ ] Firebase `NEXT_PUBLIC_FIREBASE_*` secrets (8 values) — from Firebase Console project settings
- [ ] `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` — generate with `openssl rand -hex 32`

### 2. Repository Variables

- [ ] `TURBO_TEAM` — Vercel team slug
- [ ] `BRIKETTE_PAGES_PROJECT` — Cloudflare Pages project name (default: `brikette-website`)
- [ ] `CF_ACCOUNT_SUBDOMAIN` — Cloudflare account subdomain for Workers URLs

### 3. GitHub Environments

Create these environments in **Settings > Environments**:

- [ ] `production`
- [ ] `staging`
- [ ] `staging-pages` (for Brikette static export)
- [ ] `xa-staging` (for XA stealth staging)

### 4. Branch Protection / Rulesets

- [ ] Enable "Require code owner review" ruleset for `main` branch
- [ ] Ensure required status checks pass before merge (CI workflows)

### 5. Verify

- [ ] Push to `staging` — confirm staging deployments trigger
- [ ] Push to `main` — confirm production deployments trigger
- [ ] Check Turborepo logs for "Remote caching enabled" and cache hits
