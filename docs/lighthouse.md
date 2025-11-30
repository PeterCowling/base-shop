# Lighthouse and LHCI Setup

This repo runs Lighthouse in two ways:

- LHCI in CI for mobile and desktop, for Storefront and Skylar (CMS configs are available for local runs only).
- Cypress smoke checks with explicit device settings for quick local validation.

## Local quickstart

- Mobile CMS: `pnpm lhci:cms:mobile`
- Desktop CMS: `pnpm lhci:cms:desktop`
- Mobile Storefront: `pnpm lhci:shop:mobile`
- Desktop Storefront: `pnpm lhci:shop:desktop`
- Mobile Skylar: `pnpm lhci:skylar:mobile`
- Desktop Skylar: `pnpm lhci:skylar:desktop`

Notes:
- These commands start the respective app (`next start`) and audit a few URLs.
- If CMS routes require auth, LHCI uses `scripts/lhci/login.cjs` with `LHCI_USERNAME`/`LHCI_PASSWORD`.
- Lighthouse uses simulated throttling for determinism.
- Third‑party analytics are blocked via `collect.settings.blockedUrlPatterns`.

## CI workflow

See `.github/workflows/ci-lighthouse.yml`.
- Node 20 LTS is used.
- `@lhci/cli` is pinned (see `package.json` and workflow) for deterministic runs.
- Upload target: `temporary-public-storage` (public and short‑lived). Migrate to an LHCI server to persist history.

## Budgets and assertions

- LightWallet budgets in `collect.settings.budgets` use KB.
- LHCI `resource-summary:*` assertions use bytes.
- Categories and key audits (LCP/TBT/CLS) have warn‑level thresholds; ratchet over time.

## Cypress smoke

`apps/cms/cypress/e2e/lighthouse-smoke.cy.ts` runs mobile and desktop against `/dashboard` with device emulation set via the third argument to `cy.lighthouse`:

```ts
cy.lighthouse(thresholds, {}, { settings: { preset: 'mobile', throttlingMethod: 'simulate' } })
```

Viewport or `--browser` do not control Lighthouse’s device profile.
