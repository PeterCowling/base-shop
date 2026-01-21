# Launch Shop Runbook

This runbook guides operators through launching a new shop using the `pnpm launch-shop` pipeline.

## Prerequisites

### Required Tools

| Tool | Version | Check Command | Install |
|------|---------|---------------|---------|
| Node.js | 20+ | `node --version` | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `pnpm --version` | `npm install -g pnpm` |
| GitHub CLI | 2.0+ | `gh --version` | [cli.github.com](https://cli.github.com) |
| Git | 2.30+ | `git --version` | System package manager |

### Required Authentication

1. **GitHub CLI**: Must be authenticated with repo access
   ```bash
   gh auth status
   # If not authenticated:
   gh auth login
   ```

2. **GitHub Secrets**: The following must be pre-provisioned in the repository:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages write access
   - `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
   - `TURBO_TOKEN` - Turborepo remote cache token (optional but recommended)

   Verify with:
   ```bash
   gh secret list
   ```

### Working Tree State

By default, `launch-shop` requires a clean git working tree. Use `--allow-dirty-git` to override (not recommended for production).

## Quick Start

### 1. Create a Config File

Create a launch config at `profiles/shops/<shop-id>.json`:

```json
{
  "schemaVersion": 1,
  "shopId": "my-shop",
  "name": "My Shop",
  "deployTarget": {
    "type": "cloudflare-pages",
    "projectName": "shop-my-shop"
  },
  "theme": "base",
  "template": "template-app",
  "smokeChecks": [
    { "endpoint": "/", "expectedStatus": 200 },
    { "endpoint": "/api/health", "expectedStatus": 200 }
  ]
}
```

### 2. Create an Environment File (Optional)

If using `--env-file`, create `profiles/shops/<shop-id>.env`:

```bash
# Required for local development
NEXT_PUBLIC_SITE_URL=https://shop-my-shop.pages.dev

# Optional - analytics, payments, etc.
# NEXT_PUBLIC_GA_ID=G-XXXXXXXX
```

### 3. Validate the Configuration

Always validate before launching:

```bash
pnpm launch-shop --config profiles/shops/my-shop.json --validate
```

### 4. Launch (Preview Mode)

Launch to a preview branch first:

```bash
git checkout -b work/launch-my-shop
pnpm launch-shop --config profiles/shops/my-shop.json --mode preview
```

### 5. Launch (Production Mode)

After validating the preview, merge to main and launch production:

```bash
git checkout main
git merge work/launch-my-shop
pnpm launch-shop --config profiles/shops/my-shop.json --mode production
```

## CLI Reference

```bash
pnpm launch-shop [options]

Options:
  --config <path>      Path to launch config JSON file (required)
  --env-file <path>    Path to environment file
  --vault-cmd <cmd>    Command to fetch secrets (alternative to --env-file)
  --mode <mode>        Deploy mode: preview | production (default: preview)
  --validate           Validate config and preflight only (no side effects)
  --dry-run            Run scaffold and CI setup, but don't push/deploy
  --force              Overwrite existing artifacts
  --allow-dirty-git    Allow running with uncommitted changes
  --help               Show help
```

## Pipeline Steps

The launch-shop pipeline executes these steps in order:

| Step | Description | Skipped In |
|------|-------------|------------|
| **preflight** | Validate config, check secrets, verify git state | - |
| **scaffold** | Create shop directory via `init-shop` | `--validate` |
| **ci-setup** | Generate GitHub Actions workflow | `--validate` |
| **commit** | Commit scaffolded files | `--validate`, `--dry-run` |
| **push** | Push to remote branch | `--validate`, `--dry-run` |
| **deploy** | Trigger workflow and wait for completion | `--validate`, `--dry-run` |
| **smoke** | Run health checks against deployed URL | `--validate`, `--dry-run` |
| **report** | Generate launch report | `--validate` (partial) |

## Failure Taxonomy

### Preflight Failures

| Error | Cause | Resolution |
|-------|-------|------------|
| `Config load failed` | Invalid JSON or missing file | Check file path and JSON syntax |
| `Invalid config` | Schema validation error | Review error details, fix config |
| `Missing required secret: X` | GitHub secret not provisioned | Run `gh secret set X` |
| `Git working tree is dirty` | Uncommitted changes | Commit or stash changes, or use `--allow-dirty-git` |
| `GitHub CLI not authenticated` | `gh auth status` failed | Run `gh auth login` |
| `TODO_ placeholder detected` | Env file contains TODO_ values | Replace placeholders with real values |
| `Shop already exists` | `apps/<shop>/` directory exists | Use `--force` or choose different shop ID |

### Scaffold Failures

| Error | Cause | Resolution |
|-------|-------|------------|
| `Template not found` | Invalid template name | Check `packages/templates/` for available templates |
| `Theme not found` | Invalid theme name | Check `packages/themes/` for available themes |
| `init-shop failed` | Subprocess error | Check init-shop output for details |

### CI Setup Failures

| Error | Cause | Resolution |
|-------|-------|------------|
| `Workflow already exists` | `.github/workflows/<shop>.yml` exists | Use `--force` to overwrite |
| `Invalid project name` | Cloudflare naming constraints violated | Project name must be ≤63 chars, lowercase alphanumeric + hyphens |

### Deploy Failures

| Error | Cause | Resolution |
|-------|-------|------------|
| `Push failed` | Git push rejected | Check branch permissions, pull latest |
| `Workflow trigger failed` | `gh workflow run` failed | Check workflow file exists, GitHub permissions |
| `No workflow run found` | Run didn't appear after trigger | Check workflow file is valid YAML |
| `Workflow failed` | CI validation or deploy error | Check workflow run URL for details |
| `Workflow timed out` | Run took >10 minutes | Check workflow run URL, retry |

### Smoke Check Failures

| Error | Cause | Resolution |
|-------|-------|------------|
| `Deploy URL not reachable` | Site not responding | Wait and retry, check Cloudflare dashboard |
| `Smoke check failed: /path` | Endpoint returned unexpected status | Check app logs, verify endpoint exists |

## Rollback Procedures

### Preview Deploy Failure

Preview deploys are disposable. Simply:
1. Don't merge the work branch
2. Delete the preview deployment from Cloudflare (optional)
3. Fix issues and re-run `launch-shop`

### Production Deploy Failure

If production deploy succeeds but smoke checks fail:

1. **Identify the previous good deployment**:
   ```bash
   # Check Cloudflare dashboard or use:
   gh run list --workflow=shop-<id>.yml --branch=main --limit=5
   ```

2. **Rollback via Cloudflare**:
   - Go to Cloudflare Pages dashboard
   - Find the project
   - Click on a previous successful deployment
   - Click "Rollback to this deployment"

3. **Rollback via git revert** (if needed):
   ```bash
   git revert HEAD
   git push origin main
   ```

4. **Verify recovery**:
   ```bash
   ./scripts/post-deploy-health-check.sh <shop-id>
   ```

## Launch Reports

Launch reports are written to:
- **Per-run history**: `data/shops/<shopId>/launches/<launchId>.json`
- **Latest pointer**: `data/shops/<shopId>/launch.json`

Report contents include:
- Launch ID and timestamp
- Config hash (not contents)
- Git ref and commit SHA
- Workflow run URL
- Deploy URL
- Step results with durations
- Smoke check outcomes

## Example Configs

### Minimal Config (Local Testing)

```json
{
  "schemaVersion": 1,
  "shopId": "test-shop",
  "deployTarget": {
    "type": "local"
  }
}
```

### Full Production Config

```json
{
  "schemaVersion": 1,
  "shopId": "acme-store",
  "name": "ACME Store",
  "deployTarget": {
    "type": "cloudflare-pages",
    "projectName": "shop-acme-store"
  },
  "ci": {
    "workflowName": "shop-acme-store.yml",
    "useReusableWorkflow": true
  },
  "theme": "base",
  "template": "template-app",
  "type": "sale",
  "payment": ["stripe"],
  "shipping": ["shippo"],
  "analytics": {
    "enabled": true,
    "provider": "ga4",
    "id": "G-XXXXXXXX"
  },
  "smokeChecks": [
    { "endpoint": "/", "expectedStatus": 200 },
    { "endpoint": "/api/health", "expectedStatus": 200 },
    { "endpoint": "/products", "expectedStatus": 200 }
  ]
}
```

## Troubleshooting

### "TURBO_TOKEN secret missing" but I don't need caching

TURBO_TOKEN is required for CI builds. Either:
1. Set a token: `gh secret set TURBO_TOKEN`
2. Or use local mode: `"deployTarget": { "type": "local" }`

### Workflow runs but deploy step fails

Check:
1. `CLOUDFLARE_API_TOKEN` has Pages write permissions
2. `CLOUDFLARE_ACCOUNT_ID` matches the account where the project should be created
3. Project name doesn't already exist in a different account

### Smoke checks pass locally but fail in launch

The launch smoke checks run against the deployed URL, not localhost. Check:
1. The endpoint paths are correct for production
2. Any environment-specific routes are configured
3. The site has finished propagating (Cloudflare can take a few seconds)

### "Cannot read properties of undefined" errors

This usually means a required package export is missing. Check:
1. Run `pnpm build` in the root to ensure all packages are built
2. Check that `packages/platform-core` exports all required types

## Related Documentation

- [Launch Shop Pipeline Plan](../plans/archive/launch-shop-pipeline-plan.md) (Complete)
- [Architecture Overview](../architecture.md)
- [Testing Policy](../testing-policy.md)
- [Secrets Management](../plans/integrated-secrets-workflow-plan.md)
