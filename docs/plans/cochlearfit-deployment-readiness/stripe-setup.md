---
Type: Setup-Memo
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Relates-to: docs/plans/cochlearfit-deployment-readiness/plan.md
---

# Cochlear Fit Stripe Setup Memo

This doc is a scaffold to record Stripe setup outcomes.

Rules:
- Do not commit secret values (Stripe secret keys, webhook secrets).
- Stripe object IDs (e.g. `prod_...`, `price_...`) are safe to commit.

## What To Record (Non-Secret)

- Stripe account email / team owner:
- Stripe account ID:
- Account default API version (Dashboard -> Developers):

## Secrets (Do Not Commit)

Store in 1Password (or Cloudflare secrets) and reference by name only:
- `STRIPE_SECRET_KEY` (staging/test)
- `STRIPE_SECRET_KEY` (production/live)
- `STRIPE_WEBHOOK_SECRET` (staging)
- `STRIPE_WEBHOOK_SECRET` (production)

## Products + Prices

Create 2 products:
- `Classic Sound Sleeve` (productSlug: `classic`)
- `Sport Sound Sleeve` (productSlug: `sport`)

Create 12 prices matching `data/shops/cochlearfit/variants.json`.

### Variant Map (Source Of Truth: `data/shops/cochlearfit/variants.json`)

Fill in the real Stripe Price IDs after creating prices.

| Variant ID | Product | Size | Color | Price (USD cents) | Stripe Price ID (real) |
|---|---|---|---|---:|---|
| classic-kids-sand | classic | kids | sand | 3400 | price_... |
| classic-kids-ocean | classic | kids | ocean | 3400 | price_... |
| classic-kids-berry | classic | kids | berry | 3400 | price_... |
| classic-adult-sand | classic | adult | sand | 3800 | price_... |
| classic-adult-ocean | classic | adult | ocean | 3800 | price_... |
| classic-adult-berry | classic | adult | berry | 3800 | price_... |
| sport-kids-sand | sport | kids | sand | 3600 | price_... |
| sport-kids-ocean | sport | kids | ocean | 3600 | price_... |
| sport-kids-berry | sport | kids | berry | 3600 | price_... |
| sport-adult-sand | sport | adult | sand | 4000 | price_... |
| sport-adult-ocean | sport | adult | ocean | 4000 | price_... |
| sport-adult-berry | sport | adult | berry | 4000 | price_... |

After filling the `Stripe Price ID (real)` column, update:
- `data/shops/cochlearfit/variants.json` `stripePriceId` values (TASK-08)

## Webhooks

Stripe Checkout completion webhook target:
- Staging: `https://<staging-host>/api/stripe/webhook`
- Production: `https://<production-host>/api/stripe/webhook`

Notes:
- While `cochlearfit.com` is not configured, use the `workers.dev` URL for early testing.
- Webhook signing secret must be configured as a Worker secret (`STRIPE_WEBHOOK_SECRET`).

### Local Test (Stripe CLI)

```bash
stripe listen --forward-to localhost:8788/api/stripe/webhook
stripe trigger checkout.session.completed
```

