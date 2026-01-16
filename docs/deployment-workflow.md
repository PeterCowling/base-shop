---
Type: Runbook
Status: Canonical
Domain: CI-Deploy
Created: 2026-01-16
Created-by: Claude Opus 4.5
---

# Deployment Workflow

This document describes how to deploy applications from staging to production.

## Overview

All apps follow a two-stage deployment workflow:

```
PR merged to main
       │
       ▼
┌──────────────────┐
│ validate & build │  Lint, typecheck, test
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  deploy-staging  │  Automatic (no approval)
│  --branch staging│
└──────────────────┘
       │
       ▼
 staging.<app>.pages.dev
       │
  [Manual testing]
       │
       ▼
┌──────────────────┐
│ deploy-production│  Manual trigger + approval
│  --branch main   │
└──────────────────┘
       │
       ▼
 <app>.pages.dev (production)
```

## URLs

| App | Staging URL | Production URL |
|-----|-------------|----------------|
| product-pipeline | `staging.product-pipeline.pages.dev` | `product-pipeline.pages.dev` |
| cms | `staging.cms-9by.pages.dev` | `cms-9by.pages.dev` |
| brikette | `staging.brikette.pages.dev` | `brikette.pages.dev` |
| skylar | `staging.skylar.pages.dev` | `skylar.pages.dev` |
| reception | `staging.reception.pages.dev` | `reception.pages.dev` |
| prime | `staging.prime.pages.dev` | `prime.pages.dev` |
| cover-me-pretty | `staging.cover-me-pretty.pages.dev` | `cover-me-pretty.pages.dev` |
| xa | `staging.xa.pages.dev` | `xa.pages.dev` |
| xa-b | `staging.xa-b.pages.dev` | `xa-b.pages.dev` |
| xa-j | `staging.xa-j.pages.dev` | `xa-j.pages.dev` |
| cochlearfit | `staging.cochlearfit.pages.dev` | `cochlearfit.pages.dev` |
| handbag-configurator | `staging.handbag-configurator.pages.dev` | `handbag-configurator.pages.dev` |

## Deploying to Staging

**Automatic.** Staging deploys happen automatically when:
- A PR is merged to `main`
- Code is pushed directly to `main`

No action required. Wait for the GitHub Actions workflow to complete and check the staging URL.

## Promoting to Production

### Option 1: Via GitHub UI (Recommended)

1. Go to **Actions** in the GitHub repository
2. Select the workflow for the app you want to deploy (e.g., "Deploy CMS")
3. Click **Run workflow** dropdown
4. Select `main` branch
5. Choose `production` from the **Deploy target environment** dropdown
6. Click **Run workflow**
7. You will receive a notification requesting approval
8. Review the deployment and click **Approve**

### Option 2: Via GitHub CLI

```bash
# Promote a specific app
gh workflow run cms.yml -f deploy-target=production
gh workflow run brikette.yml -f deploy-target=production
gh workflow run skylar.yml -f deploy-target=production
gh workflow run reception.yml -f deploy-target=production
gh workflow run prime.yml -f deploy-target=production
gh workflow run product-pipeline.yml -f deploy-target=production
gh workflow run cover-me-pretty.yml -f deploy-target=production
gh workflow run xa.yml -f deploy-target=production
gh workflow run xa-b.yml -f deploy-target=production
gh workflow run xa-j.yml -f deploy-target=production
gh workflow run cochlearfit.yml -f deploy-target=production
gh workflow run handbag-configurator.yml -f deploy-target=production

# Or use the centralized promotion workflow
gh workflow run promote-to-production.yml -f app=cms
```

Then approve the deployment in the GitHub UI when prompted.

### Option 3: Via Centralized Promotion Workflow

The `promote-to-production.yml` workflow provides a single place to promote any app:

1. Go to **Actions → Promote to Production**
2. Click **Run workflow**
3. Select the app from the dropdown
4. Click **Run workflow**
5. Approve when prompted

## Production Approval

Production deployments require approval. When you trigger a production deployment:

1. GitHub creates a **pending deployment** requiring review
2. You receive a notification (email/GitHub app)
3. Go to the workflow run in Actions
4. Click **Review deployments**
5. Select the `production` environment
6. Click **Approve and deploy**

Only after approval does the deploy proceed.

## Rollback

If something goes wrong in production:

### Quick Rollback (Cloudflare Dashboard)

1. Go to **Cloudflare Dashboard → Pages → [Project]**
2. Click **Deployments**
3. Find the previous working deployment
4. Click **...** → **Rollback to this deployment**

### Proper Rollback (Git Revert)

1. Create a revert commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Wait for staging auto-deploy
3. Verify fix on staging
4. Promote to production using the normal workflow

## GitHub Environments Setup (One-Time)

To enable the approval workflow, configure GitHub Environments:

1. Go to **Settings → Environments** in your GitHub repository
2. Create `staging` environment:
   - No protection rules needed (auto-deploy)
3. Create `production` environment:
   - **Required reviewers:** Add yourself (or team members who can approve)
   - **Deployment branches:** Select "Selected branches" → Add `main`

## Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/reusable-app.yml` | Reusable workflow with staging/production logic |
| `.github/workflows/product-pipeline.yml` | Product Pipeline deploys |
| `.github/workflows/cms.yml` | CMS deploys |
| `.github/workflows/brikette.yml` | Brikette deploys |
| `.github/workflows/skylar.yml` | Skylar deploys |
| `.github/workflows/reception.yml` | Reception deploys |
| `.github/workflows/prime.yml` | Prime deploys |
| `.github/workflows/cover-me-pretty.yml` | Cover Me Pretty deploys |
| `.github/workflows/xa.yml` | XA deploys |
| `.github/workflows/xa-b.yml` | XA-B deploys |
| `.github/workflows/xa-j.yml` | XA-J deploys |
| `.github/workflows/cochlearfit.yml` | Cochlearfit deploys |
| `.github/workflows/handbag-configurator.yml` | Handbag Configurator deploys |
| `.github/workflows/promote-to-production.yml` | Centralized promotion helper |

## Apps Excluded from This Workflow

The following apps are **not** part of the staging/production workflow:

| App | Reason |
|-----|--------|
| `storybook` | Development tool only, not deployed to production |
| `*-worker` apps | Cloudflare Workers use `wrangler deploy`, different deployment pattern |
| `api` | Separate deployment mechanism |
| `dashboard` | Library/incomplete app, no build script |
| `storefront` | Library/incomplete app, no build script |

## Troubleshooting

### Deployment stuck "waiting for approval"

Check that:
- You have the `production` GitHub Environment configured
- You are listed as a required reviewer
- Go to the workflow run and click "Review deployments"

### Staging deployed but URL not updating

- Cloudflare Pages caches aggressively
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check the Cloudflare Dashboard → Deployments to confirm the new deployment exists

### Production deployment failed

- Check the Actions logs for the specific error
- If it's a transient failure (network, API timeout), retry the workflow
- If it's a build failure, fix in a new PR, deploy to staging, then promote

### "Only main branch can deploy to production" error

Production deploys are restricted to the `main` branch for safety. Make sure:
- Your workflow was triggered from `main`
- You're not trying to deploy from a feature branch

## Related Documentation

- [CI & Deploy Roadmap](./ci-and-deploy-roadmap.md) - Full CI/CD plan and history
- [Architecture](./architecture.md) - Overall system architecture
- [CLAUDE.md](../CLAUDE.md) - Quick reference for AI assistants
