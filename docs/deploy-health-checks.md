Type: Guide
Status: Active

# Deploy Health Checks

All deploy workflows must include post-deploy health checks to verify deployments succeed.

## Requirement

Every workflow that deploys to Cloudflare Pages (or other targets) must run `scripts/post-deploy-health-check.sh` after deploy.

## How to Comply

### Option 1: Use `reusable-app.yml` (Recommended)

Pass `project-name` or `healthcheck-url` input:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable-app.yml
    with:
      app-filter: "@apps/my-app"
      build-cmd: "pnpm --filter @apps/my-app... build"
      deploy-cmd: "pnpm exec next-on-pages deploy --project-name my-app --branch ${{ github.ref_name }}"
      project-name: "my-app"  # Required for health checks
    secrets: inherit
```

For custom domains, use `healthcheck-url`:

```yaml
      healthcheck-url: "https://custom-domain.example.com"
```

### Option 2: Add Explicit Health Check Step

For workflows not using `reusable-app.yml`:

```yaml
- name: Deploy
  run: pnpm exec next-on-pages deploy --project-name my-app

- name: Post-Deploy Health Check
  if: success()
  run: |
    chmod +x scripts/post-deploy-health-check.sh
    ./scripts/post-deploy-health-check.sh my-app
  env:
    EXTRA_ROUTES: "/api/health"
    MAX_RETRIES: "10"
    RETRY_DELAY: "6"
```

## Validation

Run the validation script to check all workflows:

```bash
./scripts/validate-deploy-health-checks.sh
```

This script runs in CI to enforce the requirement.

## Health Check Script Options

`scripts/post-deploy-health-check.sh` accepts:

| Argument/Env | Description |
|--------------|-------------|
| `$1` (project-name) | Cloudflare project name (constructs `https://<name>.pages.dev`) |
| `--staging` | Use staging URL pattern |
| `BASE_URL` | Override the URL to check |
| `EXTRA_ROUTES` | Additional routes to check (e.g., `/api/health`) |
| `MAX_RETRIES` | Number of retry attempts (default: 10) |
| `RETRY_DELAY` | Seconds between retries (default: 6) |

## See Also

- [Post-Deploy Health Checks Plan](plans/archive/post-deploy-health-checks-mandatory-plan.md)
- [scripts/post-deploy-health-check.sh](../scripts/post-deploy-health-check.sh)
