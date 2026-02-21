---
Type: Build-Doc
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Relates-to: docs/plans/cochlearfit-deployment-readiness/plan.md
---

# Cochlear Fit Worker Config (Secrets + Environments)

This doc intentionally includes **secret names and commands only**. Do not commit secret values.

## Worker Environments

Wrangler environments are defined in `apps/cochlearfit-worker/wrangler.toml`.

- Local/dev (default): `cochlearfit-worker-dev`
- Staging: `cochlearfit-worker-staging`
- Production: `cochlearfit-worker-production`

## KV Bindings

The Worker expects a KV binding named `ORDERS_KV`.

- Purpose: order persistence + webhook idempotency markers

## Non-Secret Vars

These are configured via `wrangler.toml` `[vars]` / `[env.<name>.vars]`:

- `PAGES_ORIGIN` (comma-separated allowlist)
- `SITE_URL`
- `INVENTORY_AUTHORITY_URL`

## Secrets (Per Environment)

These must be set via Wrangler secrets (never in `wrangler.toml`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_SERVICE_API_KEY` (deferred until email work resumes)
- `INVENTORY_AUTHORITY_TOKEN`

### Commands

Staging:

```bash
wrangler secret put STRIPE_SECRET_KEY --env staging
wrangler secret put STRIPE_WEBHOOK_SECRET --env staging
wrangler secret put INVENTORY_AUTHORITY_TOKEN --env staging
# Email is deferred for now:
# wrangler secret put EMAIL_SERVICE_API_KEY --env staging
```

Production:

```bash
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put INVENTORY_AUTHORITY_TOKEN --env production
# Email is deferred for now:
# wrangler secret put EMAIL_SERVICE_API_KEY --env production
```

## Verification

- Confirm config has no committed secrets:
  - `rg -n "REPLACE_ME|dev-inventory-token|INVENTORY_AUTHORITY_TOKEN\s*=\s*\"\"" apps/cochlearfit-worker/wrangler.toml`
- Confirm env topology exists:
  - Inspect `apps/cochlearfit-worker/wrangler.toml` for `[env.staging]` and `[env.production]`
