# Launch Shop Runbook

This runbook describes how to launch a new shop using `pnpm launch-shop` — the single-command orchestrator that chains shop creation, CI setup, deploy, and smoke checks.

## Quick Start

```bash
# 1. Validate your config (no side effects)
pnpm launch-shop --config profiles/shops/my-shop.json --validate

# 2. Dry-run locally (creates files, no deploy)
pnpm launch-shop --config profiles/shops/my-shop.json \
  --env-file profiles/shops/my-shop.env \
  --dry-run

# 3. Launch preview deployment
pnpm launch-shop --config profiles/shops/my-shop.json \
  --env-file profiles/shops/my-shop.env \
  --mode preview

# 4. Launch production deployment
pnpm launch-shop --config profiles/shops/my-shop.json \
  --env-file profiles/shops/my-shop.env \
  --mode production
```

## Prerequisites

### Required Tools

| Tool | Version | Install | Verify |
|------|---------|---------|--------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) | `node --version` |
| pnpm | 10+ | `npm i -g pnpm` | `pnpm --version` |
| git | any | [git-scm.com](https://git-scm.com) | `git --version` |
| GitHub CLI | any | [cli.github.com](https://cli.github.com) | `gh --version` |

### GitHub Authentication

```bash
# Authenticate with GitHub (required for workflow triggers and secret checks)
gh auth login
gh auth status  # Verify: should show "Logged in to github.com"
```

### GitHub Secrets (Repository-Level)

Before launching, ensure these secrets exist in your GitHub repository:

**For Cloudflare Pages deploys:**
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages edit permission
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID
- `SOPS_AGE_KEY` — Age private key for SOPS decryption (see [secrets.md](secrets.md))
- `TURBO_TOKEN` — Turborepo remote cache token (optional but recommended)

**For Vercel deploys:**
- `VERCEL_TOKEN` — Vercel authentication token
- `TURBO_TOKEN` — Turborepo remote cache token (optional)

To add secrets:
```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set SOPS_AGE_KEY  # Paste contents of ~/.config/sops/age/keys.txt
gh secret set TURBO_TOKEN
```

For encrypted secrets workflow, see [Secrets Management](secrets.md).

### Git State

By default, `launch-shop` requires a clean git working tree. Use `--allow-dirty-git` to override (not recommended for production).

## Command Reference

```
pnpm launch-shop --config <file> [options]

Required:
  --config <file>       Path to launch config JSON file

Secrets sourcing (one required for non-dry-run):
  --env-file <file>     Path to .env file with secrets
  --vault-cmd <cmd>     Command to fetch secrets from vault

Mode selection:
  --mode preview        Deploy to preview environment (default)
  --mode production     Deploy to production environment

Validation modes:
  --validate            Validate config only, no files created
  --dry-run             Create files locally, no git push or deploy

Override flags:
  --force               Overwrite existing shop directory
  --allow-dirty-git     Allow uncommitted changes in git
```

## Configuration Files

### Launch Config (`profiles/shops/<shop-id>.json`)

```json
{
  "$schema": "../../scripts/schemas/launch-config.schema.json",
  "schemaVersion": 1,
  "shopId": "acme-sale",
  "name": "Acme Sale",
  "type": "sale",
  "theme": "base",
  "template": "template-app",
  "payment": ["stripe"],
  "shipping": ["ups"],
  "deployTarget": {
    "type": "cloudflare-pages",
    "projectName": "acme-sale"
  },
  "ci": {
    "workflowName": "deploy-shop-acme-sale.yml",
    "useReusableWorkflow": true
  },
  "smokeChecks": [
    { "endpoint": "/", "expectedStatus": 200 },
    { "endpoint": "/api/health", "expectedStatus": 200 }
  ]
}
```

**Key fields:**
- `shopId`: Raw identifier (no `shop-` prefix)
- `deployTarget.type`: `"cloudflare-pages"` | `"vercel"` | `"local"`
- `deployTarget.projectName`: Must be lowercase alphanumeric + hyphens, max 63 chars

### Environment File (`profiles/shops/<shop-id>.env`)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CART_COOKIE_SECRET=your-32-char-secret-here
CMS_SPACE_URL=https://...
CMS_ACCESS_TOKEN=...
```

**Important:** Replace all `TODO_*` placeholders before production deploys. The pipeline fails if `TODO_` values remain in production mode.

## Execution Flow

The pipeline executes these steps in order:

1. **Preflight** — Validates config, checks tools, verifies GitHub secrets
2. **Scaffold** — Runs `init-shop` to create the shop directory structure
3. **CI Setup** — Runs `setup-ci` to generate GitHub Actions workflow
4. **Commit** — Commits all generated files
5. **Push** — Pushes to the remote branch
6. **Deploy** — Triggers GitHub workflow and waits for completion
7. **Report** — Writes launch report to `data/shops/<app-slug>/`

### Validation Modes

| Flag | Preflight | Scaffold | CI Setup | Commit | Push | Deploy | Report |
|------|-----------|----------|----------|--------|------|--------|--------|
| `--validate` | Yes | No | No | No | No | No | No |
| `--dry-run` | Yes | Yes | Yes | No | No | No | No |
| (none) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

## Failure Taxonomy

### Preflight Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Runtime check failed" | Node < 20 or pnpm < 10 | Upgrade Node/pnpm |
| "Required CLI tool not found: gh" | GitHub CLI not installed | Install gh: `brew install gh` |
| "GitHub CLI not authenticated" | Not logged in to GitHub | Run `gh auth login` |
| "Git working tree is dirty" | Uncommitted changes | Commit or stash changes, or use `--allow-dirty-git` |
| "Config validation failed" | Invalid config schema | Check config against JSON schema |
| "Shop already exists" | `apps/<shop>/` directory exists | Use `--force` to overwrite |
| "Found N TODO_ placeholders" | Unset secrets in env file | Replace `TODO_*` values |
| "Missing GitHub secrets" | Required secrets not configured | Run `gh secret set <name>` |
| "Invalid Cloudflare project name" | Bad characters or too long | Use lowercase alphanumeric + hyphens, max 63 chars |

### Scaffold Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "init-shop failed" | Template not found or permissions | Check template exists, verify write permissions |
| "Failed to create directory" | Filesystem permissions | Check directory permissions |
| "Seed data failed" | Database connection or schema | Check database connection |

### CI/Workflow Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "setup-ci failed" | Invalid shop ID or config | Verify shopId matches expected format |
| "Failed to trigger workflow" | GitHub API error or permissions | Check `gh auth status`, verify repo access |
| "No workflow run found" | Workflow not triggered | Check workflow file exists, verify branch triggers |
| "Workflow failed" | CI job failure | Check workflow logs at provided URL |
| "Workflow timed out" | Deploy took > 10 minutes | Check CI logs for hangs, retry if transient |

### Deploy Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Commit failed" | Git error | Check git status, ensure staged files |
| "Push failed" | Remote rejection or network | Check remote URL, network, branch protection |
| "Cloudflare deploy failed" | API error or quota | Check Cloudflare dashboard, verify project exists |
| "Deploy artifact not found" | Artifact upload failed | Check workflow logs for upload errors |

### Smoke Check Failures

Smoke checks run in CI. If they fail:

1. Check the workflow run URL in the error message
2. Look at the "Post-Deploy Health Check" step
3. Common issues:
   - **Transient**: DNS propagation delay, cold start — usually passes on retry
   - **Hard failure**: App crash, missing env vars, route errors — check app logs

## Recovery and Rollback

### Preview Deploy Failure

Preview deploys are disposable:
1. Fix the issue in your config/code
2. Re-run `launch-shop` with `--force` flag
3. The new preview replaces the failed one

### Production Deploy Failure

If production deploy fails after CI passes:

1. **Check the error** — review workflow logs
2. **Quick rollback** — redeploy the previous known-good SHA:
   ```bash
   # From Cloudflare dashboard: rollback to previous deployment
   # Or trigger workflow on the previous good commit:
   gh workflow run deploy-shop-<id>.yml --ref <previous-sha>
   ```
3. **Verify recovery** — run health checks manually:
   ```bash
   BASE_URL="https://<project>.pages.dev" ./scripts/post-deploy-health-check.sh
   ```

### Re-running After Failure

```bash
# Fix the issue, then re-run with --force to overwrite
pnpm launch-shop --config profiles/shops/my-shop.json \
  --env-file profiles/shops/my-shop.env \
  --mode preview \
  --force
```

## Launch Reports

After successful launch, reports are written to:
- `data/shops/<app-slug>/launches/<launch-id>.json` — Per-run history
- `data/shops/<app-slug>/launch.json` — Latest launch pointer

Report contents:
```json
{
  "launchId": "20260118143052-a1b2c3d",
  "shopId": "acme-sale",
  "configHash": "abc123...",
  "gitRef": "sha...",
  "mode": "preview",
  "deployUrl": "https://...",
  "workflowRunUrl": "https://github.com/.../actions/runs/...",
  "steps": [...],
  "smokeChecks": [...],
  "startedAt": "2026-01-18T14:30:52.000Z",
  "completedAt": "2026-01-18T14:35:12.000Z",
  "totalDurationMs": 260000
}
```

## Examples

### Validate a new shop config

```bash
pnpm launch-shop --config profiles/shops/new-shop.json --validate
```

Output:
```
Loading configuration...

=== Launch Shop: new-shop ===
Launch ID: 20260118143052-a1b2c3d
App slug: shop-new-shop
Mode: preview

Running preflight checks...
Preflight checks passed.

=== Execution Plan ===

Shop ID:        new-shop
App slug:       shop-new-shop
App directory:  apps/shop-new-shop/
Deploy target:  cloudflare-pages
Project name:   new-shop

Steps to execute:
  1. Scaffold shop (init-shop --skip-prompts --seed-full)
  2. Setup CI workflow (setup-ci)
  3. Commit and push changes
  4. Trigger workflow and wait for deploy
  5. Generate launch report

Smoke checks (run by CI):
  - / (expected: 200)
  - /api/health (expected: 200)

Validation complete. No changes made.
```

### Dry-run to test local generation

```bash
pnpm launch-shop --config profiles/shops/new-shop.json \
  --env-file profiles/shops/new-shop.env \
  --dry-run
```

This creates:
- `apps/shop-new-shop/` — Full app scaffold
- `.github/workflows/deploy-shop-new-shop.yml` — CI workflow

But does NOT:
- Commit or push changes
- Trigger any CI/deploy

### Full preview launch

```bash
pnpm launch-shop --config profiles/shops/new-shop.json \
  --env-file profiles/shops/new-shop.env \
  --mode preview
```

Expected output:
```
=== Launch Complete ===
Shop ID: new-shop
Launch ID: 20260118143052-a1b2c3d
Deploy URL: https://work-feature-123.new-shop.pages.dev
Workflow: https://github.com/.../actions/runs/12345
Report: data/shops/shop-new-shop/launches/20260118143052-a1b2c3d.json
```

## Related Documentation

- [Launch Shop Pipeline Plan](plans/archive/launch-shop-pipeline-plan.md) — Implementation details (Complete)
- [CI and Deploy Roadmap](ci-and-deploy-roadmap.md) — CI/CD strategy
- [Environment Reference](.env.reference.md) — Environment variables
- [Setup Guide](setup.md) — Development environment setup
