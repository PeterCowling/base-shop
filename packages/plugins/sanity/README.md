# Sanity Plugin

Integrates the Sanity headless CMS.

## Setup

When running `pnpm init-shop`, choose **Sanity** from the plugin list. The wizard adds `@acme/plugin-sanity` to your shop and asks for:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_TOKEN`

Add these variables to `apps/shop-<id>/.env` before validating the environment.
