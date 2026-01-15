Type: Guide
Status: Active
Domain: Development
Last-reviewed: 2025-12-25

# Dev Ports

This repo uses fixed localhost ports per app to avoid collisions.

## Next.js apps

| App | Command | Port | URL |
| --- | --- | --- | --- |
| cover-me-pretty | `pnpm --filter @apps/cover-me-pretty dev` | 3004 | http://localhost:3004 |
| cms | `pnpm --filter @apps/cms dev` | 3006 | http://localhost:3006 |
| skylar | `pnpm --filter @apps/skylar dev` | 3008 | http://localhost:3008 |
| xa | `pnpm --filter @apps/xa dev` | 3010 | http://localhost:3010 |
| xa-b | `pnpm --filter @apps/xa-b dev` | 3013 | http://localhost:3013 |
| xa-j | `pnpm --filter @apps/xa-j dev` | 3015 | http://localhost:3015 |
| cochlearfit | `pnpm --filter @apps/cochlearfit dev` | 3011 | http://localhost:3011 |
| product-pipeline | `pnpm --filter @apps/product-pipeline dev` | 3012 | http://localhost:3012 |
| brikette | `pnpm --filter @apps/brikette dev` | 3014 | http://localhost:3014 |
| handbag-configurator | `pnpm --filter @apps/handbag-configurator dev` | 3016 | http://localhost:3016 |
| reception | `pnpm --filter @apps/reception dev` | 3018 | http://localhost:3018 |
| prime | `pnpm --filter @apps/prime dev` | 3020 | http://localhost:3020 |

## Storybook

| App | Command | Port | URL |
| --- | --- | --- | --- |
| storybook | `pnpm --filter @apps/storybook dev` | 6006 | http://localhost:6006 |
| storybook (ci) | `pnpm --filter @apps/storybook run dev:ci` | 6007 | http://localhost:6007 |
| storybook (composed) | `pnpm --filter @apps/storybook run dev:composed` | 6012 | http://localhost:6012 |

## Workers (wrangler dev)

| App | Command | Port | URL |
| --- | --- | --- | --- |
| front-door-worker | `pnpm --filter @apps/front-door-worker dev` | 8787 | http://localhost:8787 |
| cochlearfit-worker | `pnpm --filter @apps/cochlearfit-worker dev` | 8788 | http://localhost:8788 |
| product-pipeline-queue-worker | `pnpm --filter @apps/product-pipeline-queue-worker dev` | 8789 | http://localhost:8789 |
| checkout-gateway-worker | `pnpm --filter @apps/checkout-gateway-worker dev` | 8790 | http://localhost:8790 |

## Node services

| App | Command | Port | URL |
| --- | --- | --- | --- |
| handbag-configurator-api | `pnpm --filter @apps/handbag-configurator-api dev` | 3017 | http://localhost:3017 |

## Updating ports

- Keep each app on a unique port.
- When changing ports, update the app `package.json` scripts and this doc.
- Some e2e scripts assume the CMS port (3006) and the shop port (3004). Update those scripts if the ports change.
