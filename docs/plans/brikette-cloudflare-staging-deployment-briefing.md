---
Type: Briefing
Outcome: Understanding
Status: Superseded
Domain: Deploy
Created: 2026-01-27
Last-updated: 2026-02-06
Topic-Slug: brikette-cloudflare-staging-deployment
---

# Brikette Cloudflare Staging Deployment Briefing

> **SUPERSEDED**: This briefing was written before the static export approach was implemented.
> For current deployment architecture, see **`docs/brikette-deploy-decisions.md`**.
> Key changes since this doc: adapter switched from `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`,
> staging now uses `output: 'export'` (static HTML) instead of Worker deploy.

## Executive Summary (OUTDATED)

Brikette (`apps/brikette`) is now wired for Cloudflare Pages deployments via a dedicated workflow (`.github/workflows/brikette.yml`) that deploys a **staging** preview for user testing, plus an optional **manual publish** path to production. You still need a Cloudflare Pages project (likely already exists) and the standard Cloudflare credentials in GitHub Actions for deployments to succeed.

## Questions Answered

1. **Q: Does Brikette currently deploy to Cloudflare?**
   - A: The repo now includes a Brikette deploy workflow (`.github/workflows/brikette.yml`). Actual deployment success depends on Cloudflare project setup and secrets.

2. **Q: What infrastructure exists for Cloudflare deployment?**
   - A: The repo uses `@cloudflare/next-on-pages` to deploy Next.js apps to Cloudflare Pages via GitHub Actions workflows.

3. **Q: What steps are needed to deploy Brikette to staging?**
   - A: Create/configure a Cloudflare Pages project, set up GitHub secrets, create or modify a GitHub Actions workflow, and deploy using the existing patterns.

4. **Q: Can I preview changes before pushing to production?**
   - A: Yes. Cloudflare Pages supports branch-based staging deployments using the `--branch staging` flag.

## High-Level Architecture

### Current Deployment Flow (base-shop)

```
┌─────────────────┐
│ Git Push (main) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ .github/workflows/ci.yml        │
│ - Runs on main branch           │
│ - Builds workspace              │
│ - Runs tests, lint, typecheck   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Deploy Step (line 257-261)      │
│ Command:                         │
│ pnpm exec next-on-pages deploy  │
│   --project-name base-shop      │
│   --branch staging              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cloudflare Pages                 │
│ Project: base-shop               │
│ URL: base-shop.pages.dev         │
│ Branch: staging                  │
└──────────────────────────────────┘
```

### Components and Responsibilities

**GitHub Actions Workflows:**
- `.github/workflows/ci.yml` — Core platform CI, deploys base-shop to Cloudflare Pages staging (line 226-267)
- `.github/workflows/reusable-app.yml` — Reusable workflow template for app deployments
- `.github/workflows/cms.yml` — Deploys CMS app (separate Cloudflare project)
- `.github/workflows/skylar.yml` — Deploys Skylar app
- `.github/workflows/brikette.yml` — Deploys Brikette to Cloudflare Pages (staging by default; optional manual production publish)

**Deployment Tool:**
- `@cloudflare/next-on-pages` (v1.13.12) — Adapter for deploying Next.js 15 apps to Cloudflare Pages
  - Located in root `package.json` dependencies (line 164)
  - Handles Next.js → Cloudflare Workers compatibility
  - CLI: `pnpm exec next-on-pages deploy`

**Key Files:**
- `apps/brikette/next.config.mjs` — Brikette Next.js configuration (uses shared config)
- `apps/brikette/package.json` — Brikette dependencies and scripts
- `scripts/post-deploy-health-check.sh` — Post-deployment health verification (required)
- `scripts/validate-deploy-env.sh` — Pre-deployment environment validation

**Data Stores / External Services:**
- Cloudflare Pages — Hosting platform
- GitHub Actions — CI/CD orchestration
- GitHub Secrets — Stores `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

## End-to-End Flow

### Primary Flow: Deploy to Cloudflare Staging

**Brikette pattern (recommended for user testing):**

1. Developer pushes code to `main` branch
2. GitHub Actions triggers `.github/workflows/brikette.yml`
3. Workflow runs quality gates (lint/typecheck/test/build) via the reusable pipeline
4. If all checks pass and branch is `main`, it deploys to Cloudflare Pages **staging preview** using:
   - `pnpm exec next-on-pages deploy --project-name brikette --branch staging`
   - Health check: `./scripts/post-deploy-health-check.sh brikette --staging`
5. Application is accessible at `https://staging.brikette.pages.dev` (Cloudflare preview for the `staging` branch)

**Evidence pointers:**
- `.github/workflows/brikette.yml`
- `package.json:164` (`@cloudflare/next-on-pages` dependency)

### Alternate Flow: Manual Workflow Dispatch

As documented in `docs/ci-and-deploy-roadmap.md`, app-specific workflows support `workflow_dispatch` for manual deployment triggers. This is particularly useful for:
- Initial first-time deployments
- Testing deployment configuration
- Emergency deployments outside of normal CI flow

## Data & Contracts

### Key Environment Variables (GitHub Secrets)

**Required for Cloudflare deployment:**
- `CLOUDFLARE_API_TOKEN` — API token with "Workers Pages Write" permissions
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account identifier
- `SOPS_AGE_KEY` — Key for decrypting SOPS-encrypted secrets (optional, used in current workflow)

**Required for Next.js/Brikette runtime:**
- `NEXT_PUBLIC_BASE_URL` — Base URL for the application
- `NEXT_PUBLIC_SITE_ORIGIN` — Site origin for CORS/redirects
- Additional app-specific vars from `apps/brikette/next.config.mjs`

### Deployment Command Schema

```bash
pnpm exec next-on-pages deploy \
  --project-name <PROJECT_NAME> \
  --branch <BRANCH_NAME> \
  [--directory <BUILD_DIR>]
```

**Parameters:**
- `--project-name` — Cloudflare Pages project name (determines URL: `<name>.pages.dev`)
- `--branch` — Branch name (e.g., `staging`, `production`) affects deployment environment
- `--directory` — Build output directory (defaults to `.vercel/output/static` for Next.js)

## Configuration, Flags, and Operational Controls

### Cloudflare Pages Project Configuration

**To be configured (not yet done for Brikette):**
- **Project name:** `brikette` (or choose another name)
- **Production branch:** `main`
- **Branch deployments:** Enabled (for staging/preview)
- **Build configuration:** Managed by GitHub Actions, not Cloudflare's built-in build
- **Environment variables:** Must be set in Cloudflare dashboard for runtime

### GitHub Actions Workflow Pattern

**Reusable workflow template** (`.github/workflows/reusable-app.yml`) provides:
- Lint, typecheck, test, build steps
- Conditional deployment (only on `main` branch)
- Artifact upload/download
- SOPS secret decryption
- Environment validation
- Post-deploy health checks

**To create a Brikette workflow:**
1. Copy `.github/workflows/skylar.yml` or `.github/workflows/cms.yml` as a template
2. Adjust path filters to `apps/brikette/**`
3. Set `project-name: brikette`
4. Configure `deploy-cmd` with appropriate flags

## Error Handling and Failure Modes

### Common Deployment Errors

**1. Missing Cloudflare credentials**
- Error: API authentication failure
- Cause: `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` not set
- Resolution: Add secrets to GitHub repository settings

**2. Project not found**
- Error: "Project '<name>' not found"
- Cause: Cloudflare Pages project doesn't exist yet
- Resolution: Create project in Cloudflare dashboard first, or let `next-on-pages` create it

**3. Build failures**
- Error: Next.js build fails during deployment
- Cause: Missing dependencies, type errors, or runtime issues
- Resolution: Test build locally first (`pnpm --filter @apps/brikette build`)

**4. Health check failures**
- Error: Post-deploy health check times out or returns errors
- Cause: Application not starting, runtime errors, or misconfigured environment
- Resolution: Check Cloudflare Pages deployment logs, verify environment variables

### Health Check Configuration

From `docs/deploy-health-checks.md`:

**Required:** All deployment workflows must run `scripts/post-deploy-health-check.sh` after deploy.

**Configuration:**
```bash
./scripts/post-deploy-health-check.sh <project-name> [--staging]
```

**Environment variables:**
- `EXTRA_ROUTES` — Additional routes to verify (e.g., `/api/health`)
- `MAX_RETRIES` — Number of retry attempts (default: 10)
- `RETRY_DELAY` — Seconds between retries (default: 6)

**URL patterns:**
- Production: `https://<project-name>.pages.dev`
- Staging: `https://<branch>.<project-name>.pages.dev` (or custom pattern with `--staging` flag)

## Tests and Coverage

**Existing deployment tests:**
- None specifically for Brikette deployment
- Health check script provides runtime verification after deployment

**Testing strategy before deployment:**
```bash
# 1. Local build verification
pnpm --filter @apps/brikette build

# 2. Type checking
pnpm --filter @apps/brikette typecheck

# 3. Linting
pnpm --filter @apps/brikette lint

# 4. Unit tests
pnpm --filter @apps/brikette test
```

**Known issues:**
- Per `docs/plans/brikette-deferred-plan.md`, Brikette has unresolved prerender issues that block full build verification (BRIK-DEF-01)
- Build may fail due to these prerender failures

## What You Need to Do (Step-by-Step)

### Option 1: Use the Existing Brikette Deployment Workflow (Recommended)

**Step 1: Create Cloudflare Pages Project**
1. Log into Cloudflare dashboard
2. Navigate to Workers & Pages → Pages
3. Click "Create application" → "Connect to Git" (or "Direct Upload")
4. Name: `brikette` (or your preferred name)
5. Configure:
   - Production branch: `main`
   - Build configuration: None (managed by GitHub Actions)
   - Enable branch deployments: Yes

**Step 2: Configure GitHub Secrets (if not already set)**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Verify these secrets exist:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. If missing, create them:
   - Get API token from Cloudflare dashboard → My Profile → API Tokens
   - Token needs "Workers Pages Write" permission
   - Get Account ID from any Cloudflare Pages project URL

**Step 3: Confirm Workflow File**
The workflow already exists at `.github/workflows/brikette.yml`:
- **Staging**: deploys to Cloudflare preview branch `staging` → `https://staging.brikette.pages.dev`
- **Production** (manual): optional workflow-dispatch gate to deploy `main` to production (for custom domain cutover)
- Optional override: set GitHub Actions variable `BRIKETTE_PAGES_PROJECT` if the Cloudflare Pages project name is not `brikette`.

**Step 4: Configure Cloudflare Environment Variables**
1. In Cloudflare dashboard, open your `brikette` project
2. Go to Settings → Environment variables
3. Set separately for "Preview" (staging) and "Production":
   - **Preview (staging):** `NEXT_PUBLIC_SITE_ORIGIN=https://staging.brikette.pages.dev` (or `NEXT_PUBLIC_SITE_DOMAIN=staging.brikette.pages.dev`)
   - **Production:** `NEXT_PUBLIC_SITE_ORIGIN=https://www.hostel-positano.com` (or `NEXT_PUBLIC_SITE_DOMAIN=www.hostel-positano.com`)
4. Add any other required keys from `apps/brikette/next.config.mjs` (lines 26-49)

**Step 5: Test Deployment**
1. Merge/push to `main` (or run the workflow manually on `main`)
2. Monitor workflow progress
3. If successful, staging preview will be at `https://staging.brikette.pages.dev`
4. Verify health checks pass

**Step 6: Publish to Production (when ready)**
The workflow supports a manual production publish path (workflow dispatch input `publish_to_production`) that deploys the `main` branch to Cloudflare Pages production.

### Option 2: Modify Existing CI Workflow (Quick but less maintainable)

**Step 1-2:** Same as Option 1 (create Cloudflare project, verify secrets)

**Step 3: Modify `.github/workflows/ci.yml`**
- Change line 261: `--project-name base-shop` to `--project-name brikette`
- Change line 266: `./scripts/post-deploy-health-check.sh base-shop` to `./scripts/post-deploy-health-check.sh brikette`
- Update build command if needed to build Brikette specifically

**Step 4-6:** Same as Option 1

### Quick Command Reference

```bash
# Test local build
pnpm --filter @apps/brikette build

# Deploy manually (if you have Cloudflare CLI configured locally)
cd apps/brikette
pnpm build
pnpm exec next-on-pages deploy --project-name brikette --branch staging

# Check deployment logs in Cloudflare dashboard
# Pages → brikette → Deployments → [latest] → View logs
```

## Unknowns / Follow-ups

### Unknown: Brikette Build Stability
- **Issue:** Per `docs/plans/brikette-deferred-plan.md` (BRIK-DEF-01), Brikette has unresolved prerender issues
- **Impact:** Build may fail during deployment
- **How to verify:** Run `pnpm --filter @apps/brikette build` locally and check for errors
- **Resolution path:** May need to resolve prerender issues first, or configure Next.js to skip problematic prerender paths

### Unknown: Required Environment Variables
- **Issue:** Full list of runtime environment variables for Brikette not documented
- **How to verify:** Check `apps/brikette/next.config.mjs` lines 19-48 for all `readEnv()` calls
- **Test approach:** Deploy to staging and check Cloudflare logs for "undefined environment variable" errors

### Unknown: Cloudflare Account/Project Ownership
- **Issue:** Not clear who has access to Cloudflare account, whether `brikette` project already exists
- **How to verify:** Ask team lead for Cloudflare dashboard access, or check if project exists via API:
  ```bash
  curl -X GET "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
  ```

## If You Later Want to Change This (Non-plan)

### Likely Change Points

**Switch from staging to production:**
- Workflow file: Remove or change `--branch staging` flag
- Environment variables: Update in Cloudflare dashboard for production environment
- URL: Production will be `https://brikette.pages.dev` (without branch prefix)

**Add custom domain:**
- Cloudflare dashboard → brikette project → Custom domains → Add domain
- Update DNS records as instructed
- Update `NEXT_PUBLIC_SITE_ORIGIN` environment variable

**Deploy to both staging and production:**
- Add conditional logic in workflow with different deploy commands based on branch or environment

**Change project name:**
- Update `--project-name` flag in workflow
- Update Cloudflare project name (may require recreating project)
- Update URLs and environment variables

### Key Risks

**Build failures:**
- Prerender issues documented in deferred plan may block deployment
- Mitigation: Resolve BRIK-DEF-01 or configure Next.js to skip prerendering

**Environment variable mismatches:**
- Different environments (local, staging, prod) may require different values
- Mitigation: Use Cloudflare's environment-specific variable configuration

**Cost implications:**
- Cloudflare Pages has usage limits on free tier
- Mitigation: Monitor usage, upgrade to paid plan if needed

### Evidence-Based Constraints

- **Must use `@cloudflare/next-on-pages`** — Only deployment method proven to work for Next.js 15 apps in this repo (evidence: `package.json:164`, existing workflows)
- **Must include health checks** — Enforced by `scripts/validate-deploy-health-checks.sh` in CI (evidence: `docs/deploy-health-checks.md`)
- **Should use reusable workflow** — Pattern established for all app deployments to maintain consistency (evidence: `docs/ci-and-deploy-roadmap.md`)

## Related Documentation

- `docs/ci-and-deploy-roadmap.md` — Strategic plan for CI/CD organization
- `docs/deploy-health-checks.md` — Health check requirements and configuration
- `docs/deployment-adapters.md` — Deployment adapter pattern (for shop scaffolding, not Cloudflare)
- `docs/setup.md` — General project setup (not deployment-specific)
- `.github/workflows/reusable-app.yml` — Reusable workflow template
- `.github/workflows/ci.yml` — Current deployment workflow for base-shop
- `docs/plans/brikette-deferred-plan.md` — Known Brikette issues (prerender problems)
